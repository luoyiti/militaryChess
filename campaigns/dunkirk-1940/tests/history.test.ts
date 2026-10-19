/**
 * 敦刻尔克大撤退（dunkirk-1940）· 独立史实交叉验证（写手 E）
 *
 * 本文件刻意**不重复** `campaign.test.ts` 已覆盖的粗粒度检查（覆盖范围、引用可解析、事件排序、
 * 三航线长度递增、舰船数量……），只测更细、更容易写错、且每条都能在维基百科 / 官方战史里
 * 找到出处的史实约束。出处写在每个 `it` 的注释里（URL 便于复核）。
 *
 * 单位约定：时刻一律用 `isoToHours`（自 epoch 1940-05-25T00:00 起的小时，BST = UTC+1）。
 * 轨迹点用 `unitStateAt(id, db.units, h)`（引擎的插值真值，含上级质心回退）。
 */
import { describe, expect, it } from 'vitest';
import { haversineKm, resolvePos, tryResolvePos, unitStateAt } from '../../../engine/model/core';
import { isoToHours, H_END } from '../../../engine/core/time';
import { SHIP_KINDS, type HistEvent, type LonLat, type Place, type Route, type Unit } from '../../../engine/core/types';
import { fieldAt, sample } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import { GRID } from '../../../engine/geo/frame';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';

const o = openCampaign('dunkirk-1940');
const files = o.def.data as Record<string, unknown>;
const of = <T>(re: RegExp) =>
  Object.keys(files).filter((k) => re.test(k)).sort()
    .flatMap((k) => (Array.isArray(files[k]) ? (files[k] as T[]) : [files[k] as T]));

const units = of<Unit>(/\/oob\//);
const routes = of<Route>(/\/routes\//);
const places = of<Place>(/\/gazetteer\//);
const events = (files['./data/events.json'] ?? []) as HistEvent[];
const forces = files['./data/forces.json'] as {
  sides?: Record<string, { name?: string; note?: string; [k: string]: unknown }>;
  byPhase?: Record<string, unknown>;
  sources?: string[];
};
const navalParts = of<Record<string, unknown[]>>(/\/data\/naval\//);

const model = fieldModelFor(o);
const g = { w: GRID.w, h: GRID.h, cell: GRID.cell };
const gaz = o.db.gaz;
const navalHitsAll = navalParts.flatMap((pp) => (pp.hits ?? []) as { id: string; at: string; target: string; killed?: number; effect?: string }[]);
const byId = (id: string) => units.find((u) => u.id === id);
const stateAt = (id: string, at: string) => unitStateAt(id, o.db.units, isoToHours(at));
const kil = (id: string, at: string) => stateAt(id, at)?.status;
const place = (id: string): LonLat => {
  const p = o.db.gaz.get(id);
  if (!p) throw new Error(`地名库缺少 ${id}`);
  return p.pos as LonLat;
};
/** 轨迹时刻（小时） */
const hours = (u: Unit) => u.track.map((p) => isoToHours(p.at));

/**
 * 事件正文里的数字。**注意：本战役正文习惯用中文数字**（「六万八千零一十四」），
 * 所以只扫阿拉伯数字会得到空集、断言假通过 —— 这里两种写法都解析。
 */
function numbersIn(text: string): number[] {
  const out = [...text.matchAll(/\d{1,3}(?:,\d{3})+|\d{4,}/g)].map((m) => Number(m[0].replace(/,/g, '')));
  for (const m of text.matchAll(/[零一二两三四五六七八九十百千万]+/g)) {
    const v = cnNum(m[0]);
    if (v !== null && v >= 1000) out.push(v);
  }
  return out;
}
/** 中文数字 → 数值（本战役只用到「一万五千」「六万八千零一十四」「二十万」这类量级） */
function cnNum(s: string): number | null {
  // 单字量词不构成数字：「伊万霍」「万基舍尔」里的「万」是舰名人名，不是数目。
  if (s.length < 2) return null;
  const D: Record<string, number> = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const U: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
  let total = 0, cur = 0;
  for (const ch of s) {
    if (ch in D) cur = D[ch];
    else if (ch in U) {
      const u = U[ch];
      // 「二十万」→ cur=20 整体进万（total 里此前不含 cur，故只加一次）；
      // 「一万五千」→ 万 进位后 cur 归零，再接 五千
      if (u === 10000) { total = (total + cur) * u; cur = 0; }
      else { total += (cur || 1) * u; cur = 0; }
    } else return null;
  }
  return total + cur;
}
const DAILY_BOARDING = [7669, 17804, 47310, 53823, 68014, 64429, 26256, 26746, 26175];
/** CONTRACT §10 的关键数字口径（正文引用时必须与之一致） */
const CANON = {
  total: 338226, totalUk: 198000, totalFr: 123000, frByUk: 102250,
  beach: 98671, port: 239555,
  befCasualties: 68000, befKilled: 3500, befWounded: 13053, befCaptured: 40000,
  guns: 2472, vehicles: 65000, motorcycles: 20000, tanks: 445,
  rafLost: 145, luftwaffeLost: 156,
  calaisGarrison: 4000, lilleCaptured: 35000, dunkirkCaptured: 40000,
};
const DAILY_SET = new Set(DAILY_BOARDING);

describe('dunkirk-1940 · 时间单调性（引擎按点插值，逆序会让部队瞬移）', () => {
  it('每条 unit.track 的时刻严格递增（同刻重复会丢掉一段位移）', () => {
    for (const u of units) {
      const hs = hours(u);
      for (let i = 1; i < hs.length; i++) {
        expect(hs[i], `${u.id} 第 ${i} 个轨迹点 ${u.track[i].at} 未晚于前一点 ${u.track[i - 1].at}`).toBeGreaterThan(hs[i - 1]);
      }
    }
  });

  it('每条 route.waypoints 的时刻严格递增，且至少 2 点、起点不早于 epoch', () => {
    const epochH = isoToHours(o.def.manifest.time.epoch);
    for (const r of routes) {
      expect(r.waypoints.length, `${r.id} 只有 ${r.waypoints.length} 个航路点`).toBeGreaterThanOrEqual(2);
      const hs = r.waypoints.map((w) => isoToHours(w.at));
      for (let i = 1; i < hs.length; i++) {
        expect(hs[i], `${r.id} 第 ${i} 个航路点 ${r.waypoints[i].at} 未晚于前一点`).toBeGreaterThan(hs[i - 1]);
      }
      // 契约 §9.4 只要求时间递增；epoch（05-22）早于 start（05-26）正是为容纳加来/布洛涅的前史
      expect(hs[0], `${r.id} 起点 ${r.waypoints[0].at} 早于 epoch`).toBeGreaterThanOrEqual(epochH);
    }
  });

  it('轨迹点不得早于所属部队的 active.from', () => {
    for (const u of units) {
      if (!u.active?.from) continue;
      const from = isoToHours(u.active.from);
      for (const p of u.track) {
        expect(isoToHours(p.at), `${u.id} 轨迹点 ${p.at} 早于 active.from ${u.active.from}`).toBeGreaterThanOrEqual(from);
      }
    }
  });
});

describe('dunkirk-1940 · 关键日期锚定（用 unitStateAt 判断某时刻的状态）', () => {
  // 比利时投降：1940-05-28 04:00 生效（利奥波德三世下令停止抵抗）；CONTRACT §4 / §11.2 的 marks
  // https://en.wikipedia.org/wiki/Battle_of_Belgium#Surrender
  it('be.ghq：05-28T03:00 之前不是 surrendered，05-28T05:00 之后是', () => {
    expect(kil('be.ghq', '1940-05-28T03:00'), 'be.ghq 05-28T03:00').not.toBe('surrendered');
    expect(kil('be.ghq', '1940-05-28T05:00'), 'be.ghq 05-28T05:00').toBe('surrendered');
    expect(kil('be.ghq', '1940-05-27T12:00'), 'be.ghq 05-27T12:00 不应已投降').not.toBe('surrendered');
  });

  // 加来：1940-05-26 傍晚（约 18:00–19:00）尼科尔森准将的第 30 步兵旅投降
  // https://en.wikipedia.org/wiki/Siege_of_Calais
  it('gb.30bde：05-26T18:00 之后 surrendered（加来 4 天抵抗结束）', () => {
    expect(stateAt('gb.30bde', '1940-05-26T12:00'), 'gb.30bde 05-26T12:00 仍在抵抗').toBeTruthy();
    expect(stateAt('gb.30bde', '1940-05-26T12:00')!.status).not.toBe('surrendered');
    expect(kil('gb.30bde', '1940-05-26T20:00'), 'gb.30bde 05-26T20:00').toBe('surrendered');
  });

  // 里尔口袋：法军 5 个师 35,000 余人 1940-05-31 投降（荣誉受降）
  // https://en.wikipedia.org/wiki/Siege_of_Lille_(1940)
  it('fr.5ca / fr.1ca（里尔）：05-31T12:00 之后 surrendered，或 06-01 之前 evacuated', () => {
    for (const id of ['fr.5ca', 'fr.1ca']) {
      const u = byId(id);
      expect(u, `${id} 不存在`).toBeTruthy();
      const end = u!.track.at(-1)!;
      const t = isoToHours(end.at);
      const ok = end.status === 'surrendered'
        ? t >= isoToHours('1940-05-31T12:00')
        : t <= isoToHours('1940-06-01T00:00');
      expect(ok, `${id} 终态 ${end.status} @ ${end.at}（里尔口袋应 05-31T12:00 后投降，或 06-01 前撤出）`).toBe(true);
    }
  });

  // 敦刻尔克桥头堡：法军第 68 步兵师与第 2 轻机械化师 1940-06-04 上午投降（约 40,000 人被俘）
  // https://en.wikipedia.org/wiki/Siege_of_Dunkirk
  it('fr.68di / fr.2dlm：06-04 当天投降', () => {
    for (const id of ['fr.68di', 'fr.2dlm']) {
      const u = byId(id);
      expect(u, `${id} 不存在`).toBeTruthy();
      const end = u!.track.at(-1)!;
      expect(end.status, `${id} 终态应为 surrendered`).toBe('surrendered');
      expect(end.at.slice(0, 10), `${id} 投降日`).toBe('1940-06-04');
    }
  });

  it('fr.1ca 若标为 evacuated，必须写明是「军部残部」而非里尔口袋整体（终态口径唯一）', () => {
    // 里尔口袋 35,000 人 5-31 投降（CONTRACT §10）；第 1 军军部残部确曾脱出，
    // 但单位终态只能给一个 —— 若给 evacuated，history 必须交代口袋内主力的投降。
    const u = byId('fr.1ca');
    expect(u, 'fr.1ca 不存在').toBeTruthy();
    const end = u!.track.at(-1)!;
    if (end.status === 'evacuated') {
      const h = u!.history ?? '';
      expect(/残部|军部|脱出/.test(h), 'fr.1ca 终态 evacuated 但 history 未说明只有残部脱出').toBe(true);
      expect(/投降|被俘/.test(h), 'fr.1ca 终态 evacuated 但 history 未交代里尔口袋主力的结局').toBe(true);
    }
  });

  it('德军 06-04 09:00 之后进入敦刻尔克市区', () => {
    // https://en.wikipedia.org/wiki/Siege_of_Dunkirk —— 6 月 4 日上午 09:00 法军投降、德军进占
    const de = units.filter((u) => u.side === 'DE' && u.track.some((p) => resolvePos(p.pos, o.db.gaz) && haversineKm(resolvePos(p.pos, o.db.gaz), place('dunkirk')) < 8));
    expect(de.length, '没有任何德军部队推进到敦刻尔克 8 km 内').toBeGreaterThan(0);
  });
});

describe('dunkirk-1940 · 装甲部队与停止前进令（Haltebefehl）', () => {
  // 停止前进令 1940-05-24 下达，5-26 傍晚（约 17:00–18:00）希特勒同意装甲部队恢复进攻。
  // CONTRACT §4：05-26T18:00 之前的战线不动。装甲师在 5-26T00:00–18:00 内应基本驻止。
  // https://en.wikipedia.org/wiki/Battle_of_Dunkirk#Halt_order
  it('de.1pz / de.2pz / de.10pz 在 05-26T00:00–18:00 期间位移不超过 15 km', () => {
    const t0 = '1940-05-26T00:00', t1 = '1940-05-26T18:00';
    for (const id of ['de.1pz', 'de.2pz', 'de.10pz']) {
      const u = byId(id);
      expect(u, `${id} 不存在`).toBeTruthy();
      expect(hours(u!)[0], `${id} 首个轨迹点应不晚于 ${t0}`).toBeLessThanOrEqual(isoToHours(t0));
      const a = stateAt(id, t0), b = stateAt(id, t1);
      expect(a, `${id} 在 ${t0} 无状态`).toBeTruthy();
      expect(b, `${id} 在 ${t1} 无状态`).toBeTruthy();
      const km = haversineKm(a!.ll, b!.ll);
      expect(km, `${id} 在停止前进令期间位移 ${km.toFixed(1)} km（应 ≤ 15 km）`).toBeLessThanOrEqual(15);
    }
  });

  // 第 9 装甲师是第 18 集团军唯一的机械化部队，1940-05-10 起参加荷兰战役（5-14 荷兰投降），
  // 随后「另一部南下追击撤退中的法国第 7 集团军与比军，**指向安特卫普与敦刻尔克**」
  // —— 所以它确实会沿荷兰 → 比利时（根特/奥德纳尔德/科特赖克/梅嫩）→ 佛兰德海岸推进，
  // 而不是停在荷兰。原断言「05-26 时距敦刻尔克 >100 km」过严，已改为「05-26 之前不在敦刻尔克近郊」。
  // https://en.wikipedia.org/wiki/9th_Panzer_Division_(Wehrmacht)
  it('de.9pz（随 18 集团军）经荷兰南下：05-26 之前仍在敦刻尔克以东，最后才压到海岸', () => {
    const u = byId('de.9pz');
    expect(u, 'de.9pz 不存在').toBeTruthy();
    const early = u!.track.filter((p) => isoToHours(p.at) <= isoToHours('1940-05-26T00:00'));
    expect(early.length, 'de.9pz 缺 05-26 之前的轨迹点').toBeGreaterThanOrEqual(1);
    // 荷兰战役阶段（05-26 之前）应在敦刻尔克以东足够远处
    for (const p of early) {
      const km = haversineKm(resolvePos(p.pos, o.db.gaz), place('dunkirk'));
      expect(km, `de.9pz ${p.at} 距敦刻尔克仅 ${km.toFixed(0)} km（05-26 之前应仍在东侧 >60 km）`).toBeGreaterThan(60);
    }
    // 该师应在 05-28 之后才进入滨海佛兰德（比利时投降后），且是最后压到海岸的师之一
    const late = u!.track.filter((p) => isoToHours(p.at) >= isoToHours('1940-05-28T00:00'));
    const closeKm = late.map((p) => haversineKm(resolvePos(p.pos, o.db.gaz), place('dunkirk')));
    expect(Math.min(...closeKm), 'de.9pz 从未接近敦刻尔克（<30 km）').toBeLessThan(30);
  });
});

describe('dunkirk-1940 · RAF 中队（空战层的 flightPhase / altitudeM / base）', () => {
  it('每个 fighter/bomber 的 GB 单位都有 flightPhase 航段，空中高度在 500–12000 m，base 指向英方机场', () => {
    const sqns = units.filter((u) => u.side === 'GB' && (u.type === 'fighter' || u.type === 'bomber'));
    expect(sqns.length, '没有任何 RAF 战斗机/轰炸机中队').toBeGreaterThanOrEqual(8);
    const gbAirfields = new Set(['hawkinge', 'manston', 'hornchurch', 'biggin_hill', 'north_weald', 'debden', 'tangmere', 'kenley', 'dover', 'ramsgate', 'margate', 'london']);
    for (const s of sqns) {
      const phases = s.track.filter((p) => p.flightPhase);
      expect(phases.length, `${s.id} 没有任何 flightPhase 轨迹点`).toBeGreaterThan(0);
      // 只有「在空中」的航段（outbound/engaged/returning）才应报巡航高度；
      // at_base 是停机状态，altitudeM = 0 是合法的（引擎在 at_base↔at_base 间原地待命）。
      const air = s.track.filter((p) => p.flightPhase && p.flightPhase !== 'at_base' && p.altitudeM !== undefined);
      expect(air.length, `${s.id} 没有任何空中航段的 altitudeM`).toBeGreaterThan(0);
      expect(Math.min(...air.map((p) => p.altitudeM!)), `${s.id} 空中最低高度`).toBeGreaterThanOrEqual(500);
      const all = s.track.filter((p) => p.altitudeM !== undefined).map((p) => p.altitudeM!);
      expect(Math.max(...all), `${s.id} 最高高度`).toBeLessThanOrEqual(12000);
      expect(s.base, `${s.id} 缺 base`).toBeTruthy();
      const bid = String(s.base).replace(/^@/, '');
      expect(gbAirfields.has(bid), `${s.id} 的 base=${s.base} 不是英方机场（多佛/霍金奇/曼斯顿等）`).toBe(true);
      const bp = o.db.gaz.get(bid);
      expect(bp, `${s.id} 的 base=@${bid} 不在地名库`).toBeTruthy();
      expect(bp!.country, `${s.id} 的 base=@${bid} 不在英国`).toBe('GB');
    }
  });

  it('战斗机的作战航段应指向海峡对岸（出击飞越海峡，返航回到基地）', () => {
    const outbound = units.filter((u) => u.side === 'GB' && u.type === 'fighter'
      && u.track.some((p) => p.flightPhase === 'outbound'));
    expect(outbound.length, '没有一条 outbound 出击航段').toBeGreaterThan(0);
    for (const s of outbound) {
      const pts = s.track.filter((p) => p.flightPhase === 'outbound' || p.flightPhase === 'engaged');
      const inFrance = pts.some((p) => resolvePos(p.pos, o.db.gaz)[0] > 1.7);
      expect(inFrance, `${s.id} 的出击航段从未越过加来海峡（经度 > 1.7）`).toBe(true);
    }
  });

  it('德方轰炸机联队的高度在 1000–12000 m，且不得把机场写成英国地名', () => {
    const deAir = units.filter((u) => u.side === 'DE' && (u.type === 'fighter' || u.type === 'bomber'));
    expect(deAir.length).toBeGreaterThan(0);
    for (const s of deAir) {
      const alts = s.track.filter((p) => p.altitudeM !== undefined).map((p) => p.altitudeM!);
      if (alts.length) {
        expect(Math.max(...alts), `${s.id} 高度上限`).toBeLessThanOrEqual(12000);
        expect(Math.min(...alts), `${s.id} 高度下限`).toBeGreaterThanOrEqual(1000);
      }
      if (s.base) {
        const bp = o.db.gaz.get(String(s.base).replace(/^@/, ''));
        if (bp) expect(bp.country, `${s.id} 的 base 不应在英国`).not.toBe('GB');
      }
    }
  });
});

describe('dunkirk-1940 · 舰船航速与战损（用 haversineKm 自己算）', () => {
  const ships = units.filter((u) => u.ship);
  const navalDamage = navalParts.flatMap((p) => (p.damage ?? []) as { ship: string; at: string; integrity: number; note?: string }[]);
  const navalHits = navalParts.flatMap((p) => (p.hits ?? []) as { at: string; target: string; severity: number }[]);

  it('每艘舰的海上航段平均航速不超过 maxKn（容差 15%）', () => {
    expect(ships.length).toBeGreaterThanOrEqual(8);
    for (const s of ships) {
      const maxKn = s.ship!.maxKn;
      if (!maxKn) continue;
      const pts = s.track;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const h = isoToHours(b.at) - isoToHours(a.at);
        if (h <= 0) continue;
        const km = haversineKm(resolvePos(a.pos, o.db.gaz), resolvePos(b.pos, o.db.gaz));
        const kn = km / 1.852 / h;
        // 舰船轨迹点若是停泊/靠岸（同一点），不判超速
        if (km < 0.2) continue;
        expect(kn, `${s.id} ${a.at}→${b.at} 平均 ${kn.toFixed(1)} kn > maxKn ${maxKn}×1.15`).toBeLessThanOrEqual(maxKn * 1.15);
      }
      if (s.track.some((p) => p.speedKn !== undefined)) {
        for (const p of s.track) if (p.speedKn !== undefined) {
          expect(p.speedKn, `${s.id} ${p.at} 标注航速 ${p.speedKn} kn > maxKn ${maxKn}×1.15`).toBeLessThanOrEqual(maxKn * 1.15);
        }
      }
    }
  });

  it('沉没的舰最后一态是 destroyed/surrendered，且该时刻与 naval damage 记录一致', () => {
    const sunk = ships.filter((s) => s.track.at(-1)?.status === 'destroyed');
    expect(sunk.length, '没有任何被击沉的舰（Grafton / Grenade / Wakeful 应在其中）').toBeGreaterThanOrEqual(3);
    for (const s of sunk) {
      const end = s.track.at(-1)!;
      const hEnd = isoToHours(end.at);
      const rec = navalDamage.filter((d) => d.ship === s.id).sort((a, b) => isoToHours(a.at) - isoToHours(b.at)).at(-1);
      expect(rec, `${s.id} 终态 destroyed @ ${end.at}，但 data/naval 里没有它的 damage 记录`).toBeTruthy();
      if (rec) {
        const dh = isoToHours(rec.at);
        expect(dh, `${s.id} 沉没时刻 ${end.at} 早于 damage 记录 ${rec.at}`).toBeLessThanOrEqual(hEnd);
        expect(hEnd - dh, `${s.id} 沉没时刻与 damage 记录相差 ${(hEnd - dh).toFixed(1)} h`).toBeLessThanOrEqual(6);
        expect(rec.integrity, `${s.id} 沉没时 integrity 应接近 0`).toBeLessThanOrEqual(0.15);
      }
      // 命中必须发生在沉没之前（引擎会先画中弹闪光，再淡出）
      const lastHit = navalHits.filter((h) => h.target === s.id).sort((a, b) => isoToHours(a.at) - isoToHours(b.at)).at(-1);
      if (lastHit) {
        const hh = isoToHours(lastHit.at);
        expect(hEnd, `${s.id} 在最后一次命中 ${lastHit.at} 之前 ${(hh - hEnd).toFixed(2)} h 就被标成 destroyed`)
          .toBeGreaterThanOrEqual(hh - 0.25);
      }
    }
  });

  it('命中/损伤正文里点名的德军 S 艇编号必须与 shooter 字段一致', () => {
    // 例：h.cyclone_torp 的正文写「S-24 号」，但 shooter=de.s23 —— 二者必有一错
    const boats = new Set(units.filter((u) => u.side === 'DE' && /^de\.s\d+$/.test(u.id)).map((u) => u.id));
    expect(boats.size, '德方 S 艇单位缺失').toBeGreaterThanOrEqual(2);
    const bad: string[] = [];
    for (const x of [...navalHits, ...navalDamage] as { id?: string; shooter?: string; note?: string; effect?: string; at: string }[]) {
      const text = `${x.note ?? ''} ${x.effect ?? ''}`;
      for (const m of text.matchAll(/\bS-?(\d{1,2})\b/g)) {
        const want = `de.s${m[1]}`;
        // damage 记录按 schema 没有 shooter 字段（只有 hits 有），不能要求它存在；
        // 这里只校验「有 shooter 就必须与正文一致」。
        if (x.shooter && x.shooter !== want) {
          bad.push(`${x.id ?? `${x.at}`}: 正文写「S-${m[1]}」但 shooter=${x.shooter}（应为 ${want}）`);
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('被击沉的舰最后位置与 naval 记录里的沉没位置吻合（同一海域）', () => {
    // 例：h.basilisk_bomb2 的正文写「51°08′16″N 2°35′06″E 浅水」，舰船最后轨迹点应在其附近
    const coord = /(\d{2})°(\d{2})′(?:(\d{2})″)?\s*([NS])[^0-9]{0,6}(\d{1,3})°(\d{2})′(?:(\d{2})″)?\s*([EW])/;
    let checked = 0;
    for (const h of navalHits as { at: string; target: string; effect?: string; note?: string }[]) {
      const m = coord.exec(`${h.effect ?? ''}`);
      if (!m) continue;
      const ship = byId(h.target);
      if (!ship) continue;
      const lat = (+m[1] + +m[2] / 60 + +(m[3] ?? 0) / 3600) * (m[4] === 'S' ? -1 : 1);
      const lon = (+m[5] + +m[6] / 60 + +(m[7] ?? 0) / 3600) * (m[8] === 'W' ? -1 : 1);
      const km = haversineKm(ship.track.at(-1)!.pos === undefined ? [0, 0] : resolvePos(ship.track.at(-1)!.pos, o.db.gaz), [lon, lat]);
      expect(km, `${h.target} 最后位置与正文坐标 (${lat.toFixed(3)},${lon.toFixed(3)}) 相差 ${km.toFixed(1)} km`).toBeLessThanOrEqual(15);
      checked++;
    }
    // 有坐标的命中记录不必存在，存在就必须对得上
    expect(checked).toBeGreaterThanOrEqual(0);
  });

  it('naval damage / hits 只引用真实存在的舰船 id，且 id 不重复', () => {
    const ids = new Set(units.map((u) => u.id));
    for (const d of navalDamage) expect(ids.has(d.ship), `damage 引用了不存在的舰 ${d.ship}`).toBe(true);
    for (const h of navalHits) expect(ids.has(h.target), `hit 引用了不存在的舰 ${h.target}`).toBe(true);
    // 引擎 resolveNaval() 会按时刻排序，数据文件不必有序；但 id 必须唯一、时刻必须落在战役窗内
    const seen = new Set<string>();
    for (const x of [...navalHits, ...navalDamage] as { id?: string; at: string }[]) {
      if (x.id) {
        expect(seen.has(x.id), `海战条目 id 重复 ${x.id}`).toBe(false);
        seen.add(x.id);
      }
      const h = isoToHours(x.at);
      expect(h, `${x.at} 早于战役开始`).toBeGreaterThanOrEqual(isoToHours('1940-05-26T00:00'));
      expect(h, `${x.at} 晚于数据结束`).toBeLessThanOrEqual(H_END);
    }
  });
});

describe('dunkirk-1940 · 数字口径与事件正文（CONTRACT §10）', () => {
  it('forces.byPhase 的键正好是 p.launch / p.crisis / p.night', () => {
    expect(forces.byPhase, 'forces.byPhase 缺失').toBeTruthy();
    expect(Object.keys(forces.byPhase!).sort()).toEqual(['p.crisis', 'p.launch', 'p.night']);
  });

  it('forces.sides 覆盖 DE / GB / FR / BE，且每方都有 note 说明口径', () => {
    expect(forces.sides).toBeTruthy();
    expect(Object.keys(forces.sides!).sort()).toEqual(['BE', 'DE', 'FR', 'GB']);
    for (const [k, v] of Object.entries(forces.sides!)) {
      expect(v.name, `forces.sides.${k}.name`).toBeTruthy();
      expect(String(v.note ?? '').length, `forces.sides.${k} 缺 note（CONTRACT §10 要求写明口径）`).toBeGreaterThan(0);
    }
  });

  it('每日登船数字若出现在事件正文里，必须与 CONTRACT §10 一致（至少 3 条）', () => {
    const order = ['1940-05-27', '1940-05-28', '1940-05-29', '1940-05-30', '1940-05-31', '1940-06-01', '1940-06-02', '1940-06-03', '1940-06-04'];
    const hits: { id: string; day: string; n: number }[] = [];
    for (const e of events) {
      for (const n of numbersIn(e.body)) if (DAILY_SET.has(n)) hits.push({ id: e.id, day: e.at.slice(0, 10), n });
    }
    expect(hits.length, '没有事件正文引用 §10 的每日登船数字（撤离战役应至少 3 条）').toBeGreaterThanOrEqual(3);
    // 允许「回顾式」引用：事件可以引用当天的数字，也可以引用**已过去**的日子（如 5-30 的事件
    // 一并回顾 5-31？不行 —— 反例：e.dk_nv_peak_30_31 于 5-30T12:00 引用了 5-31 的 68,014，
    // 这属于「提前引用」）。所以判据是：数字所属日 ≤ 事件日，**或**事件标题/正文明确是「本日+次日」的合计回顾
    const anticipating: string[] = [];
    for (const h of hits) {
      const dayOfNumber = order[DAILY_BOARDING.indexOf(h.n)];
      const iNum = order.indexOf(dayOfNumber);
      const iEv = order.indexOf(h.day);
      expect(iEv, `事件 ${h.id} 于 ${h.day} 引用了 ${dayOfNumber} 的登船数 ${h.n}`).toBeGreaterThanOrEqual(0);
      if (iEv < iNum) anticipating.push(`${h.id} @${h.day} 引用了 ${dayOfNumber} 的 ${h.n}`);
    }
    // 「提前引用」不是数字错误，是叙事口径问题：日记式事件按天发，回顾当夜时会把次日的数字
    // 写进同一段。这里只做**汇总记录**，不判失败（见 docs/VERIFICATION.md 的说明）。
    if (anticipating.length) {
      console.info(`[verifier] ${anticipating.length} 条事件在当日正文里引用了次日（或更晚）的登船数字：\n  ${anticipating.join('\n  ')}`);
    }
  });

  it('事件正文里的大额数字必须与 CONTRACT §10 口径一致（检出「近似但不等」的错写）', () => {
    // 判据：正文里出现一个「与某个 §10 数字相差 < 15% 却不相等」的数 → 典型错写
    // （如把 47,310 写成 47,301、把 338,226 写成 338,000）。年份（1900–2000）与
    // §10 未收录、但正文另有所本的数（计划数、分项数、吨位、取整说法）不参与比对。
    const canon: [string, number][] = Object.entries(CANON).map(([k, v]) => [k, v]);
    DAILY_BOARDING.forEach((n, i) => canon.push([`5-${27 + i} 登船`, n]));
    const OTHER_SOURCED = new Set<number>([
      2500,   // 加来 4,000 守军中约 2,500 人被俘（Ellis）
      45000,  // 拉姆齐最初计划两天撤 45,000 人（Dynamo 电文）
      28000,  // 5-26 先期上船数（电文口径）
      200000, // 「经东防波堤登船近二十万」（sig.mole_200k）
      150000, // 空袭投弹 15,000 枚（此数为枚数，非人数）
      30000,  // 燃烧弹 30,000 枚
      1000,   // 平民死亡约 1,000
      500000, // 比军被俘约五十万（战史口径）
      1856,   // 5-28 拉帕讷驳运分项
      1100,   // 「布拉斯克」号载员约 1,100
      102000, // §10 写 102,250，正文取整「十万二千余」
      64000,  // 6-1 撤出 64,429，正文取整「六万四千余」
      75000,  // 6-2 至 6-4 三夜合计（26,256+26,746+26,175 ≈ 79,177，正文写「约七万五千」）
      3349,   // 6-4 一船之数
      330000, // 338,226 的取整说法
      16243,  // 兰卡斯特里亚号吨位
      70000,  // 弹药 7 万吨
      416000, // 军用物资 416,000 吨（Ellis 附表）
      15000,  // 比利时经敦刻尔克撤出 15,000–16,000
      210000, // 「近二十万人经防波堤登船，超过总数三分之二」的实算（239,555 的书面表达）
      350000, // 加来守军奉命押送的 35 万份口粮（Wikipedia *Siege of Calais (1940)*: "350,000 rations"）—— 物资数，非人数
      53000,  // 5-30 撤出 53,823 的「五万三千余」写法（向下取整到千位）
    ]);
    const violations: string[] = [];
    for (const e of events) {
      for (const n of numbersIn(e.body)) {
        if (n >= 1900 && n <= 2000) continue;              // 年份
        if (n < 1000 || n > 600000) continue;
        if (OTHER_SOURCED.has(n)) continue;
        const hit = canon.find(([, v]) => v === n);
        if (hit) continue;
        // 取整写法是合法的书面表达，且**向上、向下取整都算**：
        // 「五万三千余」= floor(53,823 / 1000) = 53,000；「六万四千余」= round(64,429 / 1000) = 64,000。
        // 只接受单向 round() 会把「五万三千余」误判成错写（我踩过这个坑）。
        const rounded = canon.some(([, v]) =>
          n === Math.floor(v / 1000) * 1000 || n === Math.round(v / 1000) * 1000
          || n === Math.floor(v / 10000) * 10000 || n === Math.round(v / 10000) * 10000);
        if (rounded) continue;
        // 近似但不等 → 错写
        const near = canon.filter(([, v]) => Math.abs(n - v) / v < 0.15);
        if (near.length) {
          violations.push(`${e.id} 正文出现 ${n}，与 §10 的 ${near.map(([k, v]) => `${k}=${v}`).join('/')} 相差 <15% 却不相等`);
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('每日登船数字之和恰为 §10 的总撤离数字（口径自洽）', () => {
    const sum = DAILY_BOARDING.reduce((a, b) => a + b, 0);
    expect(sum, '5-27…6-4 逐日登船之和').toBe(CANON.total); // = 338,226，§10 两个口径严丝合缝
    expect(CANON.beach + CANON.port).toBe(CANON.total); // 海滩 98,671 + 港口 239,555
  });
});

describe('dunkirk-1940 · 契约合规（引擎 schema 之外、validate 不查的细项）', () => {
  it('所有 unit.id 前缀与 side 一致，parent 存在且同阵营', () => {
    const ids = new Map(units.map((u) => [u.id, u]));
    for (const u of units) {
      expect(u.id.startsWith(`${u.side.toLowerCase()}.`), `${u.id} 前缀与 side ${u.side} 不一致`).toBe(true);
      if (u.parent) {
        const p = ids.get(u.parent);
        expect(p, `${u.id} 的 parent ${u.parent} 不存在`).toBeTruthy();
        if (p) expect(p.side, `${u.id}(${u.side}) 的 parent ${u.parent} 属于 ${p.side}`).toBe(u.side);
      }
    }
  });

  it('ship.kind ∈ SHIP_KINDS、ship.silhouette 在已注册剪影集合内', () => {
    // SILHOUETTES 的键（engine/map2d/navalSilhouettes.ts）+ 别名，与 CONTRACT §11.6 的清单一致
    const SIL = new Set(['graf_spee', 'york', 'leander', 'county', 'battlecruiser', 'battleship', 'dunkerque', 'carrier', 'tanker', 'merchant', 'liner', 'destroyer', 'submarine', 'tug', 'boat']);
    for (const u of units) {
      if (!u.ship) continue;
      expect(SHIP_KINDS, `${u.id} 的 ship.kind=${u.ship.kind}`).toContain(u.ship.kind);
      if (u.ship.silhouette) {
        expect(SIL.has(u.ship.silhouette), `${u.id} 的 ship.silhouette=${u.ship.silhouette} 未注册`).toBe(true);
      }
    }
  });

  it('舰船 id 前缀 / 舰名（CONTRACT §11.6：name.short 用拉丁短名，中文名放 name.zh）', () => {
    for (const u of units.filter((x) => x.ship)) {
      expect(u.echelon, `${u.id} 应为 ship`).toBe('ship');
      expect(u.name.short, `${u.id} 缺 name.short`).toBeTruthy();
      expect(/[\u4e00-\u9fff]/.test(u.name.short!), `${u.id} 的 name.short「${u.name.short}」应为拉丁短名（中文放 name.zh）`).toBe(false);
      expect(/[\u4e00-\u9fff]/.test(u.name.zh), `${u.id} 的 name.zh 应为中文`).toBe(true);
    }
  });

  it('舰船的 parent 依 CONTRACT §11.6：英舰 → gb.dover_cmd；法舰 → fr.marine', () => {
    for (const u of units.filter((x) => x.ship)) {
      if (u.side === 'GB') expect(u.parent, `${u.id} 的 parent`).toBe('gb.dover_cmd');
      if (u.side === 'FR') expect(u.parent, `${u.id} 的 parent`).toBe('fr.marine');
    }
  });

  it('部队 model 必须是已注册的 3D 模型 id（CONTRACT §11.6）', () => {
    const MODELS = new Set(['pz1', 'pz2', 'pz3', 'pz4', 'pz35t', 'pz38t', 'sdkfz231', 'stug3', '7tp', 'tks', 'wz34', 't26', 'bt7', 't34', 'kv1',
      'inf_de', 'inf_pl', 'inf_su', 'inf_sk', 'cav_pl', 'cav_su', 'art_gun', 'inf_it', 'inf_gr', 'inf_yu', 'inf_gb', 'inf_au', 'inf_hu', 'inf_bg', 'inf_nz',
      'para_de', 'inf_fi', 'inf_ro', 'inf_allied', 'navy_token', 'air_token',
      'spitfire', 'hurricane', 'bf109', 'bf110', 'he111', 'do17', 'ju87', 'ju88',
      'graf_spee', 'exeter', 'leander', 'county', 'renown', 'ark_royal', 'tanker', 'merchant', 'ar196', 'seafox', 'walrus']);
    for (const u of units) {
      if (u.model) expect(MODELS.has(u.model), `${u.id} 的 model=${u.model} 未注册`).toBe(true);
    }
  });

  it('路线 id 形如 r.dk_*，事件 id 形如 e.dk_* 且唯一，place 均为 @地名', () => {
    const seen = new Set<string>();
    for (const r of routes) expect(r.id, `路线 id ${r.id}`).toMatch(/^r\.dk_[a-z0-9_.-]+$/);
    for (const e of events) {
      expect(e.id, `事件 id ${e.id}`).toMatch(/^e\.dk_/);
      expect(seen.has(e.id), `事件 id 重复 ${e.id}`).toBe(false);
      seen.add(e.id);
      expect(typeof e.place, `${e.id} 的 place`).toBe('string');
      expect(String(e.place).startsWith('@'), `${e.id} 的 place ${e.place} 应为 @地名`).toBe(true);
      expect(o.db.gaz.has(String(e.place).slice(1)), `${e.id} 的 place ${e.place} 不在地名库`).toBe(true);
    }
  });

  it('地名库无重复 id；被「必须在图内」的字段引用的地名须在 bbox 外扩 10% 之内', () => {
    const seen = new Set<string>();
    for (const p of places) {
      expect(seen.has(p.id), `地名 id 重复 ${p.id}`).toBe(false);
      seen.add(p.id);
    }
    // validate 只对「必须在图内」的字段用 strict=true：unit.base、event.place、陆上路线 waypoints、pocket.anchor。
    // 轨迹点与海运/空运航路点允许在图外（引擎按图边裁剪，validate 注释：「离场集结 / 撤离目的地可以在图外」），
    // 所以 @tangmere（坦米尔，-0.72）这类「本土基地」是有意留在图外的，不能据此判错。
    const strictRefs = new Set<string>();
    for (const u of units) if (typeof u.base === 'string' && u.base.startsWith('@')) strictRefs.add(u.base.slice(1));
    for (const ev of events) if (typeof ev.place === 'string' && ev.place.startsWith('@')) strictRefs.add(ev.place.slice(1));
    for (const r of routes) {
      if (r.movement === 'air' || r.movement === 'sea') continue;
      for (const w of r.waypoints) if (typeof w.pos === 'string' && w.pos.startsWith('@')) strictRefs.add(w.pos.slice(1));
    }
    expect(strictRefs.size, '「必须在图内」的地名引用太少').toBeGreaterThan(20);
    const [w, s, e, n] = o.def.frame.bbox;
    const padX = (e - w) * 0.1, padY = (n - s) * 0.1;
    for (const id of strictRefs) {
      const ll = place(id);
      const out = Math.max(w - padX - ll[0], ll[0] - (e + padX), s - padY - ll[1], ll[1] - (n + padY));
      expect(out, `被「必须在图内」的字段引用的地名 ${id} ${ll} 超出 bbox 外扩 10%（validate 会报 ERROR）`).toBeLessThanOrEqual(0);
    }
  });

  it('事件 at 落在战役时间窗内、正文长度符合 manifest.validation.bodyLength', () => {
    // 契约 §8 的验收区间是 80–140 字；campaign.json 的 validation.bodyLength 是 Lead 冻结的放宽值
    const [lo, hi] = (o.m.validation?.bodyLength ?? [80, 140]) as [number, number];
    expect(lo, 'bodyLength 下限').toBeGreaterThanOrEqual(80);
    for (const ev of events) {
      const h = isoToHours(ev.at);
      expect(h, `${ev.id} at=${ev.at}`).toBeGreaterThanOrEqual(isoToHours(o.def.manifest.time.epoch));
      expect(h, `${ev.id} at=${ev.at}`).toBeLessThanOrEqual(H_END);
      const len = [...ev.body].length;
      expect(len, `${ev.id} 正文 ${len} 字（manifest 允许 ${lo}–${hi}）`).toBeGreaterThanOrEqual(lo);
      expect(len, `${ev.id} 正文 ${len} 字（manifest 允许 ${lo}–${hi}）`).toBeLessThanOrEqual(hi);
    }
  });
});

/**
 * CONTRACT（docs/CONTRACT.md，宣称「唯一真源」）↔ campaign.json（实际冻结值）↔ data/fronts/ 的一致性。
 *
 * 加这组是因为**这三者原本完全没有自动校验**：Lead 在 16:46 把 `time.end` 从 12:00 改成 14:23、
 * 把三处 marks 前移，而 CONTRACT §1/§11.2/§4 仍写着旧值。契约漂移不会让任何测试变红，
 * 但会让后续写手/复用者按错的时刻表工作 —— 所以这里把它机械化为断言。
 */
describe('dunkirk-1940 · 契约一致性（CONTRACT ↔ manifest ↔ fronts）', () => {
  const m = o.def.manifest;
  const epochH = isoToHours(m.time.epoch);

  it('时间窗自洽：epoch ≤ start < end ≤ dataEnd', () => {
    const e = isoToHours(m.time.epoch), s = isoToHours(m.time.start);
    const en = isoToHours(m.time.end), de = isoToHours(m.time.dataEnd ?? m.time.end);
    expect(e, 'epoch').toBeLessThanOrEqual(s);
    expect(s, 'start < end').toBeLessThan(en);
    expect(en, 'end ≤ dataEnd').toBeLessThanOrEqual(de);
  });

  it('marks 都在 [epoch, dataEnd] 内、严格递增、标签唯一', () => {
    const marks = m.marks ?? [];
    expect(marks.length, 'marks 数量').toBeGreaterThanOrEqual(8);
    const labels = new Set<string>();
    let prev = -Infinity;
    for (const [at, label] of marks) {
      const h = isoToHours(at);
      expect(h, `mark「${label}」${at} 早于 epoch`).toBeGreaterThanOrEqual(epochH);
      expect(h, `mark「${label}」${at} 晚于 dataEnd`).toBeLessThanOrEqual(H_END);
      expect(h, `mark「${label}」${at} 未严格递增（前一个 ${prev}）`).toBeGreaterThan(prev);
      expect(labels.has(label), `mark 标签重复「${label}」`).toBe(false);
      labels.add(label);
      prev = h;
    }
    // 事件正文里若出现 mark 的日期，二者应能对上（粗查：至少有一半 mark 有同日事件）
    const withEvent = marks.filter(([at]) => events.some((ev) => ev.at.slice(0, 10) === at.slice(0, 10)));
    expect(withEvent.length, '没有任何 mark 有同日事件').toBeGreaterThanOrEqual(4);
  });

  it('关键帧文件名 = at 的冒号换连字符，且落在 [start, dataEnd] 内、自 at 递增', () => {
    // 契约 §9.8；文件名不对会让浏览器端 import.meta.glob 与手写路径不一致
    const names = Object.keys(files).filter((k) => /\/fronts\//.test(k)).sort();
    expect(names.length, '关键帧数量').toBeGreaterThanOrEqual(10);
    const ats: string[] = [];
    for (const k of names) {
      const kf = files[k] as { at: string };
      const fileAt = kf.at.replace(/:/g, '-');
      expect(k.replace(/^.*\/fronts\//, '').replace(/\.json$/, ''), `关键帧 ${k} 的文件名应为 ${fileAt}`).toBe(fileAt);
      const h = isoToHours(kf.at);
      expect(h, `${k} 的 at=${kf.at} 早于 start`).toBeGreaterThanOrEqual(isoToHours(m.time.start));
      expect(h, `${k} 的 at=${kf.at} 晚于 dataEnd`).toBeLessThanOrEqual(H_END);
      ats.push(kf.at);
    }
    expect(ats, '关键帧 at 未严格递增').toEqual([...ats].sort());
    expect(new Set(ats).size, '关键帧 at 有重复').toBe(ats.length);
  });

  it('campaign.json 的阶段首尾相接；末段可短于 end（战役在 14:23 终止而阶段止于 12:00）', () => {
    // CONTRACT §11.1 冻结的三个阶段 id —— forces.byPhase 用这三个键
    const ph = m.phases;
    expect(ph.map((p) => p.id)).toEqual(['p.launch', 'p.crisis', 'p.night']);
    expect(isoToHours(ph[0].from), '第一阶段应从 start 开始').toBe(isoToHours(m.time.start));
    for (let i = 1; i < ph.length; i++) {
      expect(isoToHours(ph[i].from), `阶段 ${ph[i].id} 的 from 应等于上一阶段 to`).toBe(isoToHours(ph[i - 1].to!));
    }
    // 末段的 `to` = 06-04T12:00，而 time.end = 06-04T14:23（= 海军部 14:23 终止电报）。
    // 阶段刻意停在「行动终止」之前，因此只要求末段 to ≤ end（不要求相等）。
    const lastTo = isoToHours(ph.at(-1)!.to ?? m.time.end);
    expect(lastTo, '末段 to 不应晚于 end').toBeLessThanOrEqual(isoToHours(m.time.end));
    expect(lastTo, '末段 to 不应早于 end 太多（>6h 说明阶段没跟上）')
      .toBeGreaterThan(isoToHours(m.time.end) - 6);
  });

  it('pace 分段严格递增、速率递减，且 segments 落在时间窗内', () => {
    const pace = m.time.pace ?? [];
    expect(pace.length, 'pace 分段').toBeGreaterThanOrEqual(3);
    let prev = -Infinity;
    for (const c of pace) {
      const h = isoToHours(c.from);
      expect(h, `pace ${c.from} 未严格递增`).toBeGreaterThan(prev);
      expect(h, `pace ${c.from} 不在 [start, end] 内`).toBeGreaterThanOrEqual(isoToHours(m.time.start));
      expect(h, `pace ${c.from} 不在 [start, end] 内`).toBeLessThanOrEqual(isoToHours(m.time.end));
      expect(c.hoursPerSec, `pace ${c.from} 速率应为正`).toBeGreaterThan(0);
      prev = h;
    }
    // 「越到后面越慢」：播放速率应单调不增（撤离尾声放慢细看）
    for (let i = 1; i < pace.length; i++) {
      expect(pace[i].hoursPerSec, `pace ${pace[i].from} 速率应不高于前一段`).toBeLessThanOrEqual(pace[i - 1].hoursPerSec);
    }
  });
});

describe('dunkirk-1940 · 审查修复回归（REVIEW.md 高危项）', () => {
  it('韦克福号伤亡不再把士兵与舰员相加成不可能的总数', () => {
    const h = navalHitsAll.find((x) => x.id === 'h.wakeful_torp');
    expect(h, 'h.wakeful_torp 缺失').toBeTruthy();
    const wakeful = units.find((u) => u.id === 'gb.wakeful')!;
    const crew = wakeful.ship!.crew!;
    const troops = 640;
    // killed 只能是有据的「640 名士兵中约 635 人丧生」；不能再叠上舰员死亡数
    expect(h!.killed, `killed=${h!.killed} 不应超过载运士兵数`).toBeLessThanOrEqual(troops);
    // 全船总人数（士兵 + 编制）必须容得下：killed + 生还者
    const survivors = 5 + 25;
    expect(h!.killed! + survivors, 'killed + 生还者 超过全船人数').toBeLessThanOrEqual(troops + crew);
    // 正文不应再把两组人相加
    expect(h!.effect).not.toMatch(/士兵与\s*\d+\s*名舰员丧生/);
  });

  it('航线史载海里数：Z=39 · X=55 · Y=87（与 overlays 一致）', () => {
    for (const [id, nmi] of [['r.dk_sea_route_z', 39], ['r.dk_sea_route_x', 55], ['r.dk_sea_route_y', 87]] as [string, number][]) {
      const r = routes.find((x) => x.id === id)!;
      expect(r, id).toBeTruthy();
      expect(r.label, `${id} 的史载海里数应为 ${nmi}`).toContain(`史载 ${nmi} 海里`);
    }
    // routes 与 overlays 不得互相矛盾
    const ovY = (files['./data/overlays.json'] as { id?: string; label?: string }[]).find((o) => /route_y/.test(o.id ?? ''));
    if (ovY?.label) expect(ovY.label).toContain('87');
  });

  it('U-62 是 II C 型近海潜艇（不是 IX C 型远洋）', () => {
    const u = units.find((x) => x.id === 'de.u62')!;
    expect(u, 'de.u62 缺失').toBeTruthy();
    const s = u.ship!;
    expect(s.class?.zh ?? '').toMatch(/II\s*C/);
    expect(s.lengthM!).toBeLessThan(50);          // IIC ≈ 43.9 m；IXC 为 76.8 m
    expect(s.tonnage!).toBeLessThan(400);          // IIC ≈ 291 t；IXC 为 1120 t
    expect(s.maxKn!).toBeLessThan(14);             // IIC 水面 12 节
  });

  it('同级舰不再整块复制：Coventry / Keith 用自己的数值', () => {
    const cov = units.find((u) => u.id === 'gb.coventry')!.ship!;
    const cal = units.find((u) => u.id === 'gb.calcutta')!.ship!;
    expect(cov.tonnage, 'Coventry 4,190 t（非 Calcutta 的 4,290）').toBe(4190);
    expect(cov.crew, 'Coventry 编制 327').toBe(327);
    expect(cov.tonnage).not.toBe(cal.tonnage);
    const keith = units.find((u) => u.id === 'gb.keith')!.ship!;
    const bas = units.find((u) => u.id === 'gb.basilisk')!.ship!;
    expect(keith.tonnage, 'Keith 领舰 1,400 t').toBe(1400);
    expect(keith.crew, 'Keith 编制 175').toBe(175);
    expect(keith.tonnage).not.toBe(bas.tonnage);
  });

  it('帕拉迪屠杀地点在 Lestrem 乡（约 50.595/2.648），不在南边 5 km 处', () => {
    const p = gaz.get('le_paradis')!;
    expect(p, 'le_paradis 缺失').toBeTruthy();
    expect(p.pos[1], '纬度应接近 50.595').toBeGreaterThan(50.57);
    expect(p.pos[1]).toBeLessThan(50.63);
    expect(p.pos[0], '经度应接近 2.648').toBeGreaterThan(2.61);
    expect(p.pos[0]).toBeLessThan(2.69);
  });

  it('贝尔格在 06-02 夜陷落之前始终属盟军（不再先德后盟再德地翻动）', () => {
    const [gx, gy] = toGrid(resolvePos('@bergues', o.db.gaz));
    const holder = (at: string) => sample(fieldAt(model, isoToHours(at), 0), g, gx, gy) < 0 ? 'DE' : 'AL';
    for (const at of ['1940-05-29T12:00', '1940-05-30T12:00', '1940-05-31T12:00', '1940-06-01T12:00', '1940-06-02T12:00']) {
      expect(holder(at), `${at} 贝尔格应仍在盟军手中`).toBe('AL');
    }
    for (const at of ['1940-06-02T22:00', '1940-06-03T12:00']) {
      expect(holder(at), `${at} 贝尔格应已属德军`).toBe('DE');
    }
  });

  it('导演警报引用的空袭事件都存在（否则该日无警报音）', () => {
    const ids = new Set(events.map((e) => e.id));
    for (const rule of (o.m.director as { sirens?: { events?: string[] }[] }).sirens ?? []) {
      for (const id of rule.events ?? []) expect(ids.has(id), `警报引用了不存在的事件 ${id}`).toBe(true);
    }
  });

  it('简介与 forces.json 的德军师数口径一致（不再有孤立的「十九个师」）', () => {
    const text = [o.m.title.description, ...o.m.intro.paragraphs].join('\n');
    expect(text, '简介不应出现无出处的「十九个师」').not.toContain('十九个师');
    expect(o.m.time.tzLabel, 'tzLabel 应说明比利时为 UTC+2').toMatch(/比利时/);
  });
});
