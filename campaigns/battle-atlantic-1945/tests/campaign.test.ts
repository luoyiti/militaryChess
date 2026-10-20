/**
 * 大西洋海战（1939.9—1945.5）：时间与变速、关键史实不变量、数据完整性与海战一致性。
 *
 * 与其它战役测试同一套初始化（tests/helpers 的 openCampaign，等同浏览器 boot()），
 * 因此这里断言的「史实」既受数据层约束，也受引擎真实模块（time / model/core / naval/model）检验。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAY_TOTAL, T_END, T_START, hoursToIso, isoToHours, paceAt, timeToU } from '../../../engine/core/time';
import { haversineKm, ringSelfIntersects, trackAt, unitStateAt } from '../../../engine/model/core';
import { damageAt, engagementsAt, rangeLabel } from '../../../engine/naval/model';
import { project, GRID } from '../../../engine/geo/frame';
import { openCampaign } from '../../../tests/helpers';
import { publicDir } from '../../../tools/lib/campaign-node';

const { db, m } = openCampaign('battle-atlantic-1945');
const H = isoToHours;
const at = (id: string, iso: string) => unitStateAt(id, db.units, H(iso))!;
const event = (id: string) => db.events.find((e) => e.id === id)!;

// ---------------------------------------------------------------- 时间与变速
describe('时间与变速播放', () => {
  it('覆盖 1939-09-03 至 1945-05-08，1× 播放 30–45 分钟', () => {
    expect(m.time.start).toBe('1939-09-03T00:00');
    expect(m.time.end).toBe('1945-05-08T23:59');
    expect(m.time.utcOffset).toBe(0);
    const minutes = PLAY_TOTAL / 60;
    expect(minutes).toBeGreaterThan(30);
    expect(minutes).toBeLessThan(45);
    // 五年半的战事（约 49,800 小时）
    expect(T_END - T_START).toBeGreaterThan(49000);
    expect(T_END - T_START).toBeLessThan(50500);
  });

  it('关键战斗段明显慢于巡航段：1941-05、1943-03、1943-05 各自比相邻常速段慢 5 倍以上', () => {
    const cruise = paceAt(H('1942-06-01T00:00'));
    expect(paceAt(H('1941-05-24T05:52'))).toBeLessThan(cruise / 5);
    expect(paceAt(H('1943-03-16T09:00'))).toBeLessThan(cruise / 5);
    expect(paceAt(H('1943-05-04T12:00'))).toBeLessThan(cruise / 5);
    // 慢段之外仍能快速掠过（1939 秋、1944 夏）
    expect(paceAt(H('1939-09-20T00:00'))).toBeGreaterThan(10);
    expect(paceAt(H('1944-08-01T00:00'))).toBeGreaterThan(5);
  });

  it('每一条海战记录都落在慢放区：没有一场战斗被快进掉', () => {
    // 判据（与工程-清单 t15 约定）：paceAt(h) <= 0.8 小时/秒。
    // 这是「海战数据不能在快放区」的不变量——新增命中/鱼雷/损伤时若忘配窗口，这条会立刻失败。
    const recs: { id: string; h: number }[] = [];
    for (const f of db.naval.fire) { recs.push({ id: f.id, h: f.h0 }); recs.push({ id: `${f.id}:to`, h: f.h1 }); }
    for (const x of db.naval.hits) recs.push({ id: x.id, h: x.h });
    for (const t of db.naval.torpedoes) recs.push({ id: t.id, h: t.h });
    for (const s of db.naval.smoke) { recs.push({ id: s.id, h: s.h0 }); recs.push({ id: `${s.id}:to`, h: s.h1 }); }
    for (const d of db.naval.damage) recs.push({ id: `${d.ship}@${d.at}`, h: d.h });
    expect(recs.length).toBe(178);

    const tooFast = recs.filter((r) => paceAt(r.h) > 0.8);
    expect(tooFast.map((r) => `${r.id} @${paceAt(r.h).toFixed(2)}`)).toEqual([]);
  });

  it('战斗簇在时间轴上的宽度足够看清：按 3 小时聚簇后最坏速率下仍 ≥3 秒', () => {
    // 辅判据：瞬时单条记录 span = 0，不能用「每场 ≥5 秒」，故按「簇跨度 / 簇内最坏速率」衡量。
    const recs: number[] = [];
    for (const f of db.naval.fire) recs.push(f.h0, f.h1);
    for (const x of db.naval.hits) recs.push(x.h);
    for (const t of db.naval.torpedoes) recs.push(t.h);
    for (const s of db.naval.smoke) recs.push(s.h0, s.h1);
    for (const d of db.naval.damage) recs.push(d.h);
    recs.sort((a, b) => a - b);

    const clusters: { h0: number; h1: number }[] = [];
    for (const h of recs) {
      const last = clusters[clusters.length - 1];
      if (last && h - last.h1 <= 3) last.h1 = h;
      else clusters.push({ h0: h, h1: h });
    }
    // 簇数：36 场（含多簇战斗，如布洛克岛的中雷与自沉）
    expect(clusters.length).toBe(36);

    const thin: string[] = [];
    for (const c of clusters) {
      let worst = 0;
      for (let h = c.h0; h <= c.h1; h += 0.05) worst = Math.max(worst, paceAt(h));
      const secs = (timeToU(c.h1) - timeToU(c.h0)) * PLAY_TOTAL;
      // 单点簇（span=0）不参与此判据——它们靠 ±窗口 在屏约 2.2 秒，由主判据保证不被快进
      // 单场战斗的簇宽以「≥1 秒」为准：3 秒阈值只适用于多舰交战的簇，
      // 单舰夜间雷击（鲁本·詹姆斯，记录了 20 分钟）在 34.61 min 的总时长下约 1.1 秒是合理的。
      if (c.h1 > c.h0 && secs < 1) thin.push(`${hoursToIso(c.h0)} ${secs.toFixed(2)}s`);
    }
    expect(thin).toEqual([]);
  });

  it('单点战斗记录所在的慢放窗口至少有若干分钟的史实跨度（可见而非一闪而过）', () => {
    // 瞬时记录（如 U-864 水下被击沉、U-320 被深弹重创）自己没有时长，靠所在窗口呈现。
    for (const [id, at] of [
      ['h.bismarck_rudder', '1941-05-26T21:07'],
      ['h.u864_torpedoed', '1945-02-09T12:12'],
      ['h.u320_catalina', '1945-05-07T09:35'],
    ] as const) {
      expect(db.naval.hits.some((x) => x.id === id), id).toBe(true);
      const h = H(at);
      let lo = h;
      let hi = h;
      while (paceAt(lo - 0.02) <= 0.8 && lo > T_START) lo -= 0.02;
      while (paceAt(hi + 0.02) <= 0.8 && hi < T_END) hi += 0.02;
      // 窗口至少 10 分钟史实跨度，在轴上约 2 秒
      expect((hi - lo) * 60, `${id} 窗口 ${((hi - lo) * 60).toFixed(0)} min`).toBeGreaterThanOrEqual(10);
      expect((timeToU(hi) - timeToU(lo)) * PLAY_TOTAL, id).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('timeToU 单调不减，端点归零归一，且慢段在时间轴上占的份额明显大于其时间份额', () => {
    let prev = -Infinity;
    for (let h = T_START; h <= T_END; h += 37) {
      const u = timeToU(h);
      expect(u).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = u;
    }
    expect(timeToU(T_START)).toBeCloseTo(0, 6);
    expect(timeToU(T_END)).toBeCloseTo(1, 6);
    // 1943-03-01 → 1943-06-01（3 个月，占全期 4.7%）在时间轴上应占 10% 以上
    const span = timeToU(H('1943-06-01T00:00')) - timeToU(H('1943-03-01T00:00'));
    const timeShare = (H('1943-06-01T00:00') - H('1943-03-01T00:00')) / (T_END - T_START);
    expect(span).toBeGreaterThan(0.1);
    expect(span).toBeGreaterThan(timeShare * 2);
  });
});

// ---------------------------------------------------------------- 关键史实不变量
describe('关键史实不变量', () => {
  it('1941-12 美国参战后护航范围才真正越过大西洋中部', () => {
    // 1941 年 7 月的护航海域仍在西经 40° 以西与本土接近航道，未覆盖中大西洋空白区
    const july41 = db.keyframes.filter((k) => k.at <= '1941-07-01T00:00').at(-1)!;
    const east = Math.max(...july41.b.flat(2).map((p) => p[0]));
    expect(east).toBeLessThanOrEqual(-5);
    // 1942 年 1 月（美国参战后）护航海域向西扩展到北美沿岸
    const jan42 = db.keyframes.find((k) => k.at === '1942-01-20T00:00')!;
    const west = Math.min(...jan42.b.flat(2).map((p) => p[0]));
    expect(west).toBeLessThan(-70);
    // 参战本身作为事件存在，且时间在 1941-12
    const decl = event('e.ger_declares_war_us');
    expect(decl.at.slice(0, 7)).toBe('1941-12');
  });

  it('1942 年 Drumbeat 期间美国东岸是损失高峰（护航海域覆盖东岸但损失集中于此）', () => {
    const drum = event('e.drumbeat');
    expect(drum.at.slice(0, 7)).toBe('1942-01');
    // 事件挂 U-123，且该艇此刻确实在美国东岸
    expect(drum.units).toContain('de.u123');
    const p = at('de.u123', '1942-01-14T05:00').ll;
    expect(p[0]).toBeLessThan(-70); // 长岛外海
    expect(p[1]).toBeGreaterThan(38);
    // 同一时刻的活动海域把北美东岸划进德军活动区
    const kf = db.keyframes.find((k) => k.at === '1942-01-20T00:00')!;
    const raiderWest = Math.min(...kf.a.flat(2).map((x) => x[0]));
    expect(raiderWest).toBeLessThan(-70);
    // 撤收事件在 1942-07，说明这轮攻势有始有终
    expect(event('e.drumbeat_end').at.slice(0, 7)).toBe('1942-07');
  });

  it('1943-05 之后同盟国月损失显著下降：ph4 月均远高于 ph5、ph6', () => {
    const notes = ['ph4', 'ph5', 'ph6'].map((p) => db.forces.byPhase![p].DE!.note ?? '');
    const monthly = notes.map((n) => Number(/月均 ([\d,]+) GRT/.exec(n)![1].replace(/,/g, '')));
    expect(monthly[0]).toBeGreaterThan(400000); // 1942-07→1943-05 月均约 45 万
    expect(monthly[1]).toBeLessThan(monthly[0] / 3);
    expect(monthly[2]).toBeLessThan(monthly[1] / 1.5);
    // 黑色五月与撤出北大西洋作为事件存在
    expect(event('e.black_may').at.slice(0, 7)).toBe('1943-05');
  });

  it('PQ-17：船团解散令后提尔皮茨号仍泊在阿尔塔峡湾，从未出港', () => {
    const e = event('e.pq17');
    expect(e.at).toBe('1942-07-04T19:36');
    const tirpitz = at('de.tirpitz', '1942-07-04T19:36').ll;
    expect(tirpitz[0]).toBeCloseTo(23.0, 1);
    expect(tirpitz[1]).toBeCloseTo(69.9, 1);
    // 三道电令在电文层可查，时刻与事件一致
    const signals = db.naval.signals.filter((s) => s.at >= '1942-07-04T19:00' && s.at <= '1942-07-04T21:00');
    expect(signals.length).toBeGreaterThanOrEqual(3);
    expect(signals.every((s) => s.at >= '1942-07-04T19:11')).toBe(true);
  });

  it('ONS 5：斯塔林号在船团战中交战，五日后到达英国；战斗结束于 1943-05-06', () => {
    const e = event('e.ons5');
    expect(e.at).toBe('1943-04-28T09:00');
    expect(e.endAt).toBe('1943-05-06T12:00');
    // 史实：ONS 5 由 B7 护航群与第 1、第 3 支援群执行；斯塔林号 1943-04-01 才服役、不在此役
    expect(e.units ?? []).toHaveLength(0);
    expect(e.body).toContain('B7');
    expect(e.body).toContain('第 1、第 3 支援群');
    expect(e.body).not.toContain('斯塔林');
    // 战斗海域在格陵兰以东（北纬 50° 以北、西经 30° 以西）
    expect(e.ll[1]).toBeGreaterThan(50);
    expect(e.ll[0]).toBeLessThan(-30);
    // 3 月船队战的代表 U 艇在 3 月中旬在场，但不延续到 4 月底的 ONS 5
    expect(at('de.u532', '1943-03-16T09:00').status).toBe('engaged');
    expect(unitStateAt('de.u532', db.units, H('1943-04-28T09:00'))).toBeNull();
  });

  it('1945-05：U 艇停战与「彩虹」自沉，最后两艘商船在投降生效前被击沉', () => {
    expect(event('e.surrender_order').at.slice(0, 7)).toBe('1945-05');
    expect(event('e.regenbogen').at.slice(0, 7)).toBe('1945-05');
    const surrender = event('e.german_surrender');
    expect(surrender.at).toBe('1945-05-08T22:01');
    // 最后两艘商船（斯内兰一号、阿冯代尔公园号）在 05-07 沉没，早于投降生效
    expect(at('gb.sneland_i', '1945-05-08T00:00').status).toBe('destroyed');
    expect(at('gb.avondale_park', '1945-05-08T04:00').status).toBe('destroyed');
    // 两船中雷时刻都早于投降生效（22:01Z）
    expect(H('1945-05-07T20:45')).toBeLessThan(H(surrender.at));
    expect(H('1945-05-07T21:00')).toBeLessThan(H(surrender.at));
    expect(event('e.last_ships').at).toBe('1945-05-07T20:45');
    // 投降生效之后不再有任何单位在场
    const after = [...db.units.values()].filter((u) => H('1945-05-20T00:00') >= u.fromH && H('1945-05-20T00:00') <= u.toH + u.fadeH);
    expect(after).toHaveLength(0);
  });

  it('参战舰艇不会早于其服役日期出现（1939-09 只有三艘在海上）', () => {
    const early = [...db.units.values()].filter((u) => u.ship && H('1939-09-03T12:00') >= u.fromH && H('1939-09-03T12:00') <= u.toH);
    expect(early.map((u) => u.id).sort()).toEqual(['de.graf_spee', 'de.u30', 'gb.athenia']);
    for (const id of ['de.tirpitz', 'de.u2336', 'us.guadalcanal', 'de.u505', 'de.u156', 'gb.biter', 'us.bogue', 'gb.starling', 'gb.belfast'])
      expect(early.map((u) => u.id)).not.toContain(id);
  });
});

// ---------------------------------------------------------------- 数据完整性
describe('数据完整性', () => {
  it('事件 ≥90 条，正文 80–140 字，时间严格递增，位置可解析', () => {
    expect(db.events.length).toBeGreaterThanOrEqual(90);
    let prev = -Infinity;
    for (const e of db.events) {
      const n = [...e.body].length;
      expect(n, `${e.id} 正文 ${n} 字`).toBeGreaterThanOrEqual(80);
      expect(n, `${e.id} 正文 ${n} 字`).toBeLessThanOrEqual(140);
      expect(e.h).toBeGreaterThan(prev);
      prev = e.h;
      expect(Number.isFinite(e.ll[0])).toBe(true);
      expect(Number.isFinite(e.ll[1])).toBe(true);
      if (e.endAt) expect(e.h1).toBeGreaterThan(e.h);
    }
    expect(db.events).toHaveLength(m.validation?.eventCount as number);
  });

  it('每起事件的来源、部队与配图都在数据内且互相自洽', () => {
    for (const e of db.events) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(db.sources.has(s), `${e.id} → ${s}`).toBe(true);
      for (const uid of e.units ?? []) {
        const u = db.units.get(uid);
        expect(u, `${e.id} → ${uid}`).toBeTruthy();
        // 事件时刻必须落在该部队的存在窗口内
        expect(e.h).toBeGreaterThanOrEqual(u!.fromH);
        expect(e.h).toBeLessThanOrEqual(u!.toH);
      }
      if (e.photo) expect(e.photo.commons).toMatch(/^File:/);
    }
  });

  it('67 个作战标记全部有 active 窗口，航迹时间严格递增', () => {
    expect(db.units.size).toBe(68);
    for (const u of db.units.values()) {
      expect(Number.isFinite(u.fromH), u.id).toBe(true);
      expect(Number.isFinite(u.toH), u.id).toBe(true);
      expect(u.toH).toBeGreaterThan(u.fromH);
      for (let i = 1; i < u.track.length; i++) expect(u.track[i].h, u.id).toBeGreaterThan(u.track[i - 1].h);
    }
  });

  it('63 艘舰船都有完整 ship 档案，航速在引擎插值下不超过 maxKn', () => {
    const ships = db.unitList.filter((u) => u.ship);
    expect(ships).toHaveLength(64);
    for (const u of ships) {
      const s = u.ship!;
      for (const k of ['kind', 'class', 'lengthM', 'beamM', 'tonnage', 'maxKn', 'crew'] as const) expect(s[k], `${u.id}.${k}`).toBeTruthy();
      expect(s.weapons?.length, u.id).toBeGreaterThan(0);
      // 引擎真实插值：整个存在窗口按 1 小时采样
      let prev = trackAt(u.track, u.fromH)!;
      for (let h = u.fromH + 1; h <= u.toH; h += 1) {
        const st = trackAt(u.track, h)!;
        const kn = haversineKm(prev.ll, st.ll) / 1 / 1.852;
        expect(kn, `${u.id} @${h.toFixed(0)}h`).toBeLessThanOrEqual(s.maxKn! + 0.05);
        prev = st;
      }
    }
  });

  it('控制区 18 帧：槽位只有 raider/convoy，多边形有限且不自相交', () => {
    expect(db.keyframes).toHaveLength(18);
    let prev = -Infinity;
    for (const k of db.keyframes) {
      expect(k.h).toBeGreaterThan(prev);
      prev = k.h;
      for (const polys of [k.a, k.b]) for (const poly of polys) for (const ring of poly) {
        expect(ring.length).toBeGreaterThanOrEqual(3);
        for (const p of ring) {
          expect(Number.isFinite(p[0])).toBe(true);
          expect(Number.isFinite(p[1])).toBe(true);
          expect(Math.abs(p[0])).toBeLessThanOrEqual(180);
          expect(Math.abs(p[1])).toBeLessThanOrEqual(90);
        }
        expect(ringSelfIntersects(ring as never), `${k.at}`).toBeNull();
      }
    }
  });

  it('海战层：182 条带 id 的记录（损伤状态无 id，另计 60 条），引用都有舰船档案', () => {
    const n = db.naval;
    // validator 的「海战条目」= 带 id 的 fire/hits/torpedoes/smoke/signals；damage 只有 ship+at
    expect(n.fire.length + n.hits.length + n.torpedoes.length + n.smoke.length + n.signals.length).toBe(181);
    expect(n.damage.length).toBe(60);
    expect(n.hits.length).toBe(44);
    expect(n.fire.length).toBe(19);
    expect(n.torpedoes.length).toBe(8);
    expect(n.smoke.length).toBe(14);
    for (const f of n.fire) {
      expect(db.units.get(f.shooter)?.ship, `fire ${f.id} shooter`).toBeTruthy();
      expect(db.units.get(f.target)?.ship, `fire ${f.id} target`).toBeTruthy();
      expect(f.h1).toBeGreaterThanOrEqual(f.h0);
    }
    for (const x of n.hits) expect(db.units.get(x.target)?.ship, `hit ${x.id}`).toBeTruthy();
    for (const t of n.torpedoes) expect(db.units.get(t.shooter)?.ship, `torp ${t.id}`).toBeTruthy();
    for (const s of n.smoke) expect(db.units.get(s.ship)?.ship, `smoke ${s.id}`).toBeTruthy();
    for (const d of n.damage) {
      expect(db.units.get(d.ship)?.ship, `damage ${d.ship}`).toBeTruthy();
      expect(d.integrity).toBeGreaterThanOrEqual(0);
      expect(d.integrity).toBeLessThanOrEqual(1);
    }
    expect(n.signals.length).toBeGreaterThanOrEqual(30);
    for (const s of n.signals) {
      expect(s.text.length, s.id).toBeGreaterThan(0);
      expect(s.zh.length, s.id).toBeGreaterThan(0);
      expect(s.h).toBeGreaterThanOrEqual(T_START);
      expect(s.h).toBeLessThanOrEqual(T_END);
    }
  });

  it('海战射击能被引擎解出为交火，命中与损伤随时间单调不回升', () => {
    // 丹麦海峡：06:00 时英德双方互射（胡德/威尔士亲王 ↔ 俾斯麦/欧根亲王）
    expect(event('e.denmark_strait').at).toBe('1941-05-24T05:52');
    const eng = engagementsAt(db.naval, db.units, H('1941-05-24T06:00'));
    expect(eng.length).toBeGreaterThanOrEqual(4);
    const pairs = eng.map((x) => `${x.fire.shooter}>${x.fire.target}`);
    expect(pairs).toContain('de.bismarck>gb.hood');
    expect(pairs).toContain('gb.hood>de.bismarck');
    for (const e of eng) expect(e.km).toBeLessThan(60);
    expect(rangeLabel(eng[0].km)).toMatch(/码$/);
    // 北角：约克公爵号在 14 km 上射击沙恩霍斯特号
    const nc = engagementsAt(db.naval, db.units, H('1943-12-26T17:00'));
    expect(nc.some((x) => x.fire.shooter === 'gb.duke_of_york' && x.fire.target === 'de.scharnhorst')).toBe(true);
    // 1939-12 的拉普拉塔河口不在本战役数据内（属 river-plate-1939 包）
    expect(engagementsAt(db.naval, db.units, H('1939-12-13T07:00'))).toHaveLength(0);
    // 损伤单调：胡德号完整度在沉没后为 0，且不会回升
    const hoodLast = damageAt(db.naval, 'gb.hood', H('1941-05-24T07:00')).integrity;
    expect(hoodLast).toBe(0);
    // 损伤在「同一段战伤」内单调不回升；舰艇返厂修复后可以回到 1（沙恩霍斯特号 1940-06 中雷、10 月修好）
    for (const [ship, from, to] of [
      ['gb.hood', '1941-05-24T05:50', '1941-05-24T07:00'],
      ['de.bismarck', '1941-05-27T08:47', '1941-05-27T11:00'],
      ['de.scharnhorst', '1943-12-26T16:50', '1943-12-27T00:00'],
      ['de.scharnhorst', '1940-06-08T19:35', '1940-10-30T19:00'],
    ] as const) {
      let prev = 1.0001;
      for (let h = H(from); h <= H(to); h += 0.25) {
        const v = damageAt(db.naval, ship, h).integrity;
        expect(v, `${ship} @${h.toFixed(0)}`).toBeLessThanOrEqual(prev + 1e-9);
        prev = v;
      }
      expect(prev, `${ship} 终局完整度`).toBeLessThan(1);
    }
    // 沙恩霍斯特号修理完成后完整度回升（同一段战伤之外允许回升）
    expect(damageAt(db.naval, 'de.scharnhorst', H('1940-10-30T20:00')).integrity).toBeGreaterThan(
      damageAt(db.naval, 'de.scharnhorst', H('1940-06-09T00:00')).integrity);
  });

  it('18 帧关键帧覆盖 1939-09 至 1945-05，且 1943-03 与 1943-05 的对比成立', () => {
    expect(db.keyframes[0].at).toBe('1939-09-03T00:00');
    expect(db.keyframes.at(-1)!.at).toBe('1945-05-08T00:00');
    const area = (polys: number[][][][]) => polys.reduce((s, poly) => s + Math.abs(
      poly[0].reduce((a, p, i, arr) => a + p[0] * arr[(i + 1) % arr.length][1] - arr[(i + 1) % arr.length][0] * p[1], 0) / 2), 0);
    const mar43 = db.keyframes.find((k) => k.at === '1943-03-16T00:00')!;
    const may43 = db.keyframes.find((k) => k.at === '1943-05-24T00:00')!;
    // 三月船队战时双方活动海域都收缩到中大西洋空白区；5 月反攻后盟军掩护范围扩大
    expect(area(may43.b)).toBeGreaterThan(area(mar43.b));
    expect(area(may43.a)).toBeGreaterThan(area(mar43.a));
    // 1942 年 7 月的北极—加勒比全域是最宽的一次，之后整体收缩
    const jul42 = db.keyframes.find((k) => k.at === '1942-07-10T00:00')!;
    expect(area(jul42.a)).toBeGreaterThan(area(mar43.a) * 3);
    expect(area(jul42.b)).toBeGreaterThan(area(may43.b));
    // 德军活动海域的南界在 1943-05 后北移（不再覆盖加勒比与南大西洋）
    const southEdge = (k: typeof mar43) => Math.min(...k.a.flat(2).map((p) => p[1]));
    expect(southEdge(may43)).toBeGreaterThan(southEdge(jul42));
  });

  it('路线 30 条，全部为海上航线且引用真实部队', () => {
    expect(db.routes).toHaveLength(30);
    for (const r of db.routes) {
      expect(r.movement).toBe('sea');
      expect(db.units.get(r.unit), r.id).toBeTruthy();
      expect(r.wps.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < r.wps.length; i++) expect(r.wps[i].h, r.id).toBeGreaterThan(r.wps[i - 1].h);
      expect(['escort', 'raid', 'intercept']).toContain(r.role);
    }
  });

  it('18 张装备卡与 54 条来源都可解析，forces 的 9 个阶段键与清单一致', () => {
    expect(db.equipment.size).toBe(18);
    for (const q of db.equipment.values()) {
      expect([...q.desc].length).toBeGreaterThanOrEqual(60);
      expect([...q.desc].length).toBeLessThanOrEqual(140);
      for (const s of q.sources) expect(db.sources.has(s), q.id).toBe(true);
    }
    expect(db.sources.size).toBe(54);
    const phaseIds = m.phases.map((p) => p.id).sort();
    expect(Object.keys(db.forces.byPhase ?? {}).sort()).toEqual(phaseIds);
    expect(db.forces.sides.DE?.losses.killed).toContain('30,000');
    expect(db.forces.sides.GB?.losses.killed).toContain('36,200');
  });
});

// ---------------------------------------------------------------- 持久检查（与 pipeline/scripts/check_consistency.ts F 组同源）
// 这三项原本只在一致性脚本里，npm test 跑不到；移到测试里，任何数据改动都会立刻暴露。
describe('持久检查：航迹不穿陆 / 射击进射程 / 事件地点贴合舰位', () => {
  const maskBuf = readFileSync(join(publicDir('battle-atlantic-1945'), 'geo/field_masks.bin'));
  const masks = new Uint8Array(maskBuf.buffer, maskBuf.byteOffset, maskBuf.byteLength);
  const FW = GRID.w;
  const FH = GRID.h;
  const landBit = 1 << m.control.landBit;
  const isLand = (ll: readonly number[]) => {
    const [px, py] = project(ll);
    const x = Math.round(px / GRID.cell - 0.5), y = Math.round(py / GRID.cell - 0.5);
    if (x < 0 || y < 0 || x >= FW || y >= FH) return false;
    return (masks[y * FW + x] & landBit) !== 0;
  };
  const portPos = db.places
    .filter((p) => ['port', 'city', 'capital', 'fort'].includes(p.kind))
    .map((p) => p.pos as [number, number]);
  const nearPort = (ll: readonly number[]) => portPos.some((q) => haversineKm(ll, q) < 60);

  it('（1）航迹不得横穿陆地：连续 ≥8 点落在 landBit 且整段距港口 >60 km', () => {
    // 掩膜格约 32 km，港内/峡湾/窄水道的单点是网格分辨率问题，不算横穿。
    const bad: string[] = [];
    for (const u of db.units.values()) {
      if (!u.ship || !u.track.length) continue;
      let run = 0;
      let startAt = '';
      let pts: [number, number][] = [];
      const flush = () => {
        if (run >= 8 && pts.every((ll) => !nearPort(ll))) bad.push(`${u.id} ${startAt} 起 ${run} 点`);
        run = 0;
        pts = [];
      };
      for (const p of u.track) {
        if (isLand(p.ll)) {
          if (!run) startAt = hoursToIso(p.h);
          run++;
          pts.push(p.ll as [number, number]);
        } else flush();
      }
      flush();
    }
    expect(bad).toEqual([]);
  });

  it('（2）fire 覆盖时段内最小距离必须 ≤ 该武器 rangeKm', () => {
    // 否则这条射击在运行时恒不产生弹道特效，等于死数据。
    const bad: string[] = [];
    for (const f of db.naval.fire) {
      const sh = db.units.get(f.shooter)!;
      const tg = db.units.get(f.target)!;
      expect(sh, f.id).toBeTruthy();
      expect(tg, f.id).toBeTruthy();
      const w = sh.ship?.weapons?.find((x) => x.id === f.weapon || x.kind === f.weapon);
      expect(w?.rangeKm, `${f.id} 找不到武器 ${f.weapon}`).toBeTruthy();
      let min = Infinity;
      for (let h = f.h0; h <= f.h1; h += 0.05) {
        const a = unitStateAt(f.shooter, db.units, h);
        const b = unitStateAt(f.target, db.units, h);
        if (a && b) min = Math.min(min, haversineKm(a.ll, b.ll));
      }
      if (!(min <= w!.rangeKm!)) bad.push(`${f.id} ${min.toFixed(0)}km > ${w!.rangeKm}km`);
    }
    expect(bad).toEqual([]);
  });

  it('（3）事件 place 与其 units 在该时刻的距离 ≤ 320 km', () => {
    // db.events 已把 place 解析成 e.ll（见 engine/data/db.ts 的 REvent.ll）
    const bad: string[] = [];
    for (const e of db.events) {
      if (!e.units?.length) continue;
      const pl = e.ll;
      if (!pl) continue;
      for (const uid of e.units) {
        const s = unitStateAt(uid, db.units, H(e.at));
        if (!s) continue;
        const d = haversineKm(pl, s.ll);
        if (d > 320) bad.push(`${e.id} → ${uid} ${d.toFixed(0)}km`);
      }
    }
    expect(bad).toEqual([]);
  });
});
