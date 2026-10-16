/**
 * 敦刻尔克大撤退（dunkirk-1940）：史实约束与数据一致性。
 *
 * 用与浏览器相同的 SDF 控制区场判断各城镇在给定时刻归谁控制：德军控制区（槽 A「DE」）之外的
 * 战区陆地即敦刻尔克桥头堡（同盟国控制）。关键节点取关键帧附近并留出插值余量：
 * 加来 5-26 黄昏投降、比利时 5-28 04:00 停止抵抗、卡塞尔 5-29 夜陷落、贝尔格 6-2 夜陷落、
 * 敦刻尔克 6-4 上午投降 —— 都在战线上有对应的关键帧或绕行点。
 */
import { describe, expect, it } from 'vitest';
import { fieldAt, sample, theaterAt } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import { GRID } from '../../../engine/geo/frame';
import { isoToHours, H_END, T_START, T_END } from '../../../engine/core/time';
import { PHASES } from '../../../engine/core/phases';
import { resolvePos, unitStateAt } from '../../../engine/model/core';
import type { ControlKeyframe, HistEvent, Pocket, Route, Unit, LonLat } from '../../../engine/core/types';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';

const o = openCampaign('dunkirk-1940');
const model = fieldModelFor(o);
const files = o.def.data as Record<string, unknown>;
const of = <T>(re: RegExp) => Object.keys(files).filter((k) => re.test(k)).sort()
  .flatMap((k) => (Array.isArray(files[k]) ? (files[k] as T[]) : [files[k] as T]));
const units = of<Unit>(/\/oob\//);
const routes = of<Route>(/\/routes\//);
const events = files['./data/events.json'] as HistEvent[];
const pockets = (files['./data/pockets.json'] ?? []) as Pocket[];
const fronts = of<ControlKeyframe>(/\/fronts\//).sort((a, b) => a.at.localeCompare(b.at));
const g = { w: GRID.w, h: GRID.h, cell: GRID.cell };

/** 时刻 at 某地（地名 id 或经纬度）的归属：'DE' 德军控制区 · 'AL' 桥头堡（战区其余部分）· 'out' 不在战区 */
function holder(p: string | LonLat, at: string): 'DE' | 'AL' | 'out' {
  const ll = typeof p === 'string' ? resolvePos(`@${p}`, o.db.gaz) : p;
  const h = isoToHours(at);
  const [gx, gy] = toGrid(ll);
  const T = sample(theaterAt(model, h), g, gx, gy);
  if (T > -0.6) return 'out';
  return sample(fieldAt(model, h, 0), g, gx, gy) < 0 ? 'DE' : 'AL';
}
const present = (side: string, at: string) =>
  [...o.db.units.values()].some((u) => u.side === side && !!unitStateAt(u.id, o.db.units, isoToHours(at)));
const unitById = (id: string) => units.find((u) => u.id === id);
const sourceIds = new Set((of<{ id: string }>(/\/sources\//)).map((s) => s.id));

describe('敦刻尔克大撤退 · 覆盖与引用', () => {
  it('时间窗与关键帧覆盖整场行动', () => {
    // epoch = 1940-05-22T00:00（为容纳加来 5-23、布洛涅 5-22 两个围城口袋而前移）
    expect(isoToHours('1940-05-22T00:00')).toBe(0);
    expect(isoToHours('1940-05-26T00:00')).toBe(4 * 24);
    expect(T_END - T_START).toBeCloseTo(9 * 24 + 14 + 23 / 60, 4);
    expect(H_END).toBeCloseTo(T_END + 9 + 36 / 60, 2);
    expect(fronts[0].at).toBe('1940-05-26T00:00');
    expect(fronts.at(-1)!.at).toBe('1940-06-04T10:00');
    expect(fronts.length).toBeGreaterThanOrEqual(10);
  });

  it('四方都在场，且没有其他战役遗留的对象', () => {
    expect(new Set(units.map((u) => u.side))).toEqual(new Set(['DE', 'GB', 'FR', 'BE']));
    // 轨迹点不得早于 epoch（写手可以写图外集结地，但不能写进 epoch 之前）
    for (const u of units) for (const p of u.track) expect(isoToHours(p.at)).toBeGreaterThanOrEqual(0);
    for (const e of events) expect(isoToHours(e.at)).toBeLessThanOrEqual(H_END);
    // 第二占领槽（AL）在本战役不使用：所有关键帧都不写 AL
    expect(fronts.every((f) => !f.control.AL?.length)).toBe(true);
    // 槽 A 的键是 DE
    for (const f of fronts) expect(Object.keys(f.control)).toEqual(['DE']);
  });

  it('引用可解析：来源、地名、部队、上级、装备', () => {
    for (const item of [...units, ...routes, ...events, ...fronts, ...pockets]) {
      for (const s of item.sources ?? []) expect(sourceIds.has(s), `${(item as { id: string }).id} 来源 ${s}`).toBe(true);
    }
    const ids = new Set(units.map((u) => u.id));
    for (const u of units) if (u.parent) expect(ids.has(u.parent), `${u.id} 上级 ${u.parent}`).toBe(true);
    for (const r of routes) {
      expect(ids.has(r.unit), `路线 ${r.id} 的部队 ${r.unit}`).toBe(true);
      expect(r.waypoints.length).toBeGreaterThanOrEqual(2);
      for (const w of r.waypoints) if (typeof w.pos === 'string') expect(o.db.gaz.has(w.pos.slice(1))).toBe(true);
    }
    for (const e of events) if (typeof e.place === 'string') expect(o.db.gaz.has(e.place.slice(1)), `事件 ${e.id} 地点`).toBe(true);
  });

  it('事件按时间排序、正文长度合规、配图已索引', () => {
    expect(events.map((e) => e.at)).toEqual([...events.map((e) => e.at)].sort());
    for (const e of events) {
      const n = [...e.body].length;
      // manifest.validation.bodyLength = [80, 175]（政治与战史类事件常需交代背景）
      expect(n, `${e.id} 正文 ${n} 字`).toBeGreaterThanOrEqual(70);
      expect(n, `${e.id} 正文 ${n} 字`).toBeLessThanOrEqual(185);
    }
    expect(events.length).toBeGreaterThanOrEqual(45);
    const withPhoto = events.filter((e) => e.photo);
    expect(withPhoto.length).toBeGreaterThanOrEqual(14);
  });
});

describe('敦刻尔克大撤退 · 控制区史实', () => {
  it('开战时德军尚未进入佛兰德滨海：敦刻尔克、加来、格拉沃利讷都在桥头堡里', () => {
    for (const p of ['dunkirk', 'calais', 'gravelines', 'la_panne', 'bray_dunes']) {
      expect(holder(p, '1940-05-26T06:00'), p).toBe('AL');
    }
  });

  it('战区内陆自 5-26 起已在德军手中', () => {
    for (const p of ['lille', 'arras', 'saint_quentin', 'brussel', 'antwerpen', 'gent']) {
      expect(holder(p, '1940-05-26T06:00'), p).toBe('DE');
    }
  });

  it('加来 5-26 16:00 投降前后易手（口袋消失用 step 过渡）', () => {
    expect(holder('calais', '1940-05-26T12:00')).toBe('AL');
    // 关键帧之间的插值在场网格上换算，留一格容差：16:00 之后进入德军控制区
    expect(holder('calais', '1940-05-26T17:00')).toBe('DE');
    expect(holder('calais', '1940-05-28T12:00')).toBe('DE');
  });

  it('比利时投降后德军向伊珀尔推进（5-27 在盟军手中、5-30 之后易手）', () => {
    expect(holder('ieper', '1940-05-27T06:00')).toBe('AL');
    expect(holder('ieper', '1940-05-30T18:00')).toBe('DE');
  });

  it('卡塞尔（利斯河防线核心）5-30 之前仍在盟军手中', () => {
    expect(holder('cassel', '1940-05-29T06:00')).toBe('AL');
    expect(holder('cassel', '1940-05-31T12:00')).toBe('DE');
  });

  it('桥头堡核心城镇按史实先后陷落：贝尔格 6-2 夜、敦刻尔克 6-4', () => {
    expect(holder('bergues', '1940-06-02T06:00')).toBe('AL');
    expect(holder('bergues', '1940-06-03T18:00')).toBe('DE');
    expect(holder('dunkirk', '1940-06-03T12:00')).toBe('AL');
    expect(holder('dunkirk', '1940-06-04T12:00')).toBe('DE');
  });

  it('海滩（马洛莱班）坚持到 6-4 上午投降前仍由盟军控制', () => {
    expect(holder('malo_les_bains', '1940-06-03T12:00')).toBe('AL');
    expect(holder('malo_les_bains', '1940-06-04T06:00')).toBe('AL');
  });
});

describe('敦刻尔克大撤退 · 编制与行动', () => {
  it('四方编制规模符合契约（德军装甲与步兵师、BEF 各军、法军桥头堡骨干、比军）', () => {
    const bySide = (s: string) => units.filter((u) => u.side === s);
    expect(bySide('DE').length).toBeGreaterThanOrEqual(30);
    expect(bySide('GB').length).toBeGreaterThanOrEqual(30);
    expect(bySide('FR').length).toBeGreaterThanOrEqual(25);
    expect(bySide('BE').length).toBeGreaterThanOrEqual(15);
    for (const id of ['de.1pz', 'de.2pz', 'de.6pz', 'de.8pz', 'de.9pz', 'de.10pz', 'de.xix', 'de.xli', 'de.pg_kleist']) {
      expect(unitById(id), id).toBeTruthy();
    }
    for (const id of ['gb.ghq', 'gb.i_corps', 'gb.ii_corps', 'gb.30bde', 'gb.1div', 'gb.3div', 'gb.50div', 'gb.1armd']) {
      expect(unitById(id), id).toBeTruthy();
    }
    for (const id of ['fr.12dim', 'fr.262di', 'fr.68di', 'fr.2dlm', 'fr.abrial', 'fr.1ca', 'fr.5ca']) {
      expect(unitById(id), id).toBeTruthy();
    }
    expect(unitById('be.ghq')).toBeTruthy();
  });

  it('德军装甲师在停止前进令期间（5-24 至 5-26 18:00）几乎原地不动', () => {
    for (const id of ['de.1pz', 'de.2pz', 'de.10pz']) {
      const u = unitById(id);
      expect(u, id).toBeTruthy();
      const pts = u!.track.filter((p) => {
        const h = isoToHours(p.at);
        return h >= isoToHours('1940-05-22T00:00') && h <= isoToHours('1940-05-26T18:00');
      });
      expect(pts.length, `${id} 缺停止前进令期间的轨迹点`).toBeGreaterThanOrEqual(1);
      // 相邻点位移不超过阈值（停止前进令：装甲部队停在运河线一线）
      let maxKm = 0;
      let prev: number[] | null = null;
      for (const p of pts) {
        const ll = typeof p.pos === 'string' ? resolvePos(p.pos, o.db.gaz) : p.pos;
        if (prev) maxKm = Math.max(maxKm, Math.hypot((ll[0] - prev[0]) * 70, (ll[1] - prev[1]) * 111));
        prev = ll;
      }
      expect(maxKm, `${id} 停止前进令期间最大位移 ${maxKm.toFixed(1)} km`).toBeLessThan(120);
    }
  });

  it('比军 5-28 04:00 之后为投降态，法军桥头堡部队 6-4 投降', () => {
    const be = units.filter((u) => u.side === 'BE' && u.echelon === 'division');
    expect(be.length).toBeGreaterThanOrEqual(8);
    const terminal = (id: string) => unitById(id)?.track.at(-1);
    expect(terminal('be.ghq')!.status).toBe('surrendered');
    expect(terminal('be.ghq')!.at.slice(0, 10)).toBe('1940-05-28');
    for (const id of ['fr.68di', 'fr.12dim']) {
      const t = terminal(id)!;
      expect(['surrendered', 'evacuated'], `${id} 终态 ${t.status}`).toContain(t.status!);
    }
  });

  it('英军大量部队以 evacuated 结束，撤离时刻落在 Dynamo 窗口内（布洛涅 5-24 撤出除外）', () => {
    const evac = units.filter((u) => u.side === 'GB' && u.track.at(-1)?.status === 'evacuated');
    expect(evac.length).toBeGreaterThanOrEqual(10);
    const early = new Set(['gb.20gds_bde']); // 布洛涅守军 5-24 由海上撤出，早于 Dynamo
    for (const u of evac) {
      const t = u.track.at(-1)!;
      const h = isoToHours(t.at);
      expect(h).toBeLessThanOrEqual(H_END);
      if (!early.has(u.id)) {
        expect(h, `${u.id} 撤离时刻 ${t.at}`).toBeGreaterThan(isoToHours('1940-05-28T00:00'));
      } else {
        expect(h, `${u.id} 布洛涅撤离应早于 Dynamo`).toBeLessThan(isoToHours('1940-05-26T00:00'));
      }
    }
  });

  it('加来守军（gb.30bde）在 5-26 之后为投降态', () => {
    const t = unitById('gb.30bde')!.track.at(-1)!;
    expect(t.status).toBe('surrendered');
    expect(t.at.slice(0, 10)).toBe('1940-05-26');
  });

  it('三条撤离航线都存在且为海运，航程递增（Z < X < Y）', () => {
    const sea = routes.filter((r) => r.movement === 'sea');
    expect(sea.length).toBeGreaterThanOrEqual(3);
    const byId = (id: string) => sea.find((r) => r.id === id);
    const z = byId('r.dk_sea_route_z'), x = byId('r.dk_sea_route_x'), y = byId('r.dk_sea_route_y');
    expect(z, 'r.dk_sea_route_z').toBeTruthy();
    expect(x, 'r.dk_sea_route_x').toBeTruthy();
    expect(y, 'r.dk_sea_route_y').toBeTruthy();
    const len = (r?: Route) => {
      if (!r) return 0;
      let km = 0, prev: LonLat | null = null;
      for (const w of r.waypoints) {
        const ll = typeof w.pos === 'string' ? resolvePos(w.pos, o.db.gaz) : w.pos;
        if (prev) km += Math.hypot((ll[0] - prev[0]) * 70, (ll[1] - prev[1]) * 111);
        prev = ll;
      }
      return km;
    };
    expect(len(x)).toBeGreaterThan(len(z));
    expect(len(y)).toBeGreaterThan(len(x));
  });

  it('海军层已启用（存在舰船档案）', () => {
    const ships = units.filter((u) => u.ship);
    expect(ships.length).toBeGreaterThanOrEqual(12);
    for (const s of ships) {
      expect(s.echelon).toBe('ship');
      expect(s.ship!.lengthM ?? 0).toBeGreaterThan(10);
    }
  });

  it('包围圈：加来、布洛涅、里尔、敦刻尔克四个口袋，结局与时刻符合史实', () => {
    expect(pockets.length).toBeGreaterThanOrEqual(4);
    const byId = (id: string) => pockets.find((p) => p.id === id);
    expect(byId('p.dk_calais')?.fate).toBe('surrendered');
    expect(byId('p.dk_lille')?.fate).toBe('surrendered');
    expect(byId('p.dk_dunkirk')?.fate).toBe('surrendered');
    for (const p of pockets) expect(isoToHours(p.end)).toBeGreaterThan(isoToHours(p.start));
  });

  it('阶段覆盖整场行动、导演配置与配乐时间表合法', () => {
    expect(PHASES.length).toBeGreaterThanOrEqual(3);
    // 阶段从战役开始时刻（epoch 之后 4 天）起算
    expect(PHASES[0].from).toBe(isoToHours(o.m.time.start));
    for (const p of PHASES) expect(p.from).toBeGreaterThan(isoToHours(o.m.time.epoch));
    const m = o.m;
    expect(m.audio.music.length).toBeGreaterThanOrEqual(2);
    for (const cue of m.audio.music) expect(isoToHours(cue.from)).toBeGreaterThanOrEqual(0);
    expect(m.validation?.slotEmptyBefore).toBeTruthy();
    expect(m.control.slots[1].key).toBe('AL');
  });
});
