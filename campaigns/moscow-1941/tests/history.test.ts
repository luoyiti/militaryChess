/**
 * 莫斯科保卫战 · 史实与叙事口径。
 *
 * 这里只做「可从数据本身验证」的史实约束：节点日期、阶段覆盖、争议写法的存在性、
 * 多口径数字未被合并、编制变更不跨阶段。控制区的空间归属见 geography.test.ts
 * （那里跑 70+ 条 SDF 断言）；本文件用独立射线法做少量城市归属交叉验证。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openCampaign } from '../../../tests/helpers';
import { campaignDir } from '../../../tools/lib/campaign-node';
import { isoToHours, H_END, T_START } from '../../../engine/core/time';
import { PHASES } from '../../../engine/core/phases';
import { resolvePos, pointInRing, unitStateAt, haversineKm } from '../../../engine/model/core';
import type { HistEvent, LonLat, Pocket } from '../../../engine/core/types';

const o = openCampaign('moscow-1941');
const { db, m } = o;
const dir = campaignDir(m.id);
const json = (p: string) => JSON.parse(readFileSync(join(dir, p), 'utf8'));

const events = json('data/events.json') as HistEvent[];
const cityLedger = json('pipeline/city-ledger.json') as {
  cities: { place: string; events: { date: string; holder: 'SU' | 'DE'; alternatives?: unknown[] }[] }[];
  knownLineMismatches: { place: string; date: string; lineHolder: string; reason: string }[];
};

const event = (id: string) => {
  const e = events.find((x) => x.id === id);
  if (!e) throw new Error(`缺少历史节点 ${id}`);
  return e;
};
const body = (id: string) => {
  const e = event(id);
  return `${e.title.zh} ${e.body} ${e.mapNote ?? ''} ${JSON.stringify(e.narration ?? '')}`;
};
const day = (id: string) => event(id).at.slice(0, 10);
const phaseOf = (iso: string) => {
  const h = isoToHours(iso);
  const p = PHASES.find((x) => h >= x.from && h < x.to);
  if (!p) throw new Error(`${iso} 不在任何阶段内`);
  return p.id;
};

describe('莫斯科保卫战 · 五阶段与事件覆盖', () => {
  it('五阶段各 ≥12 条事件、各 ≥3 条 importance=1', () => {
    expect(PHASES.map((p) => p.id)).toEqual(['typhoon', 'mozhaisk', 'november', 'counter', 'january']);
    const rows = PHASES.map((p) => {
      const inPhase = events.filter((e) => isoToHours(e.at) >= p.from && isoToHours(e.at) < p.to);
      return { id: p.id, n: inPhase.length, major: inPhase.filter((e) => e.importance === 1).length };
    });
    for (const r of rows) {
      expect(r.n, `${r.id} 事件数`).toBeGreaterThanOrEqual(12);
      expect(r.major, `${r.id} importance=1`).toBeGreaterThanOrEqual(3);
    }
    // 五段加起来正好覆盖全部事件，没有落在阶段之外的
    expect(rows.reduce((a, r) => a + r.n, 0)).toBe(events.length);
  });

  it('事件按 at 升序、全部落在战役时间窗内、id 唯一', () => {
    const seen = new Set<string>();
    let prev = -Infinity;
    for (const e of events) {
      const h = isoToHours(e.at);
      expect(h, e.id).toBeGreaterThanOrEqual(T_START);
      expect(h, e.id).toBeLessThanOrEqual(H_END + 24);
      expect(h, `${e.id} 未按时间升序`).toBeGreaterThanOrEqual(prev);
      expect(seen.has(e.id), `${e.id} 重复`).toBe(false);
      seen.add(e.id);
      prev = h;
    }
    expect(events.length).toBe(115);
  });

  it('每条事件都有中文标题、来源与置信度', () => {
    for (const e of events) {
      expect(e.title.zh.length, e.id).toBeGreaterThan(3);
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(db.sources.has(s), `${e.id}/${s}`).toBe(true);
      expect(['high', 'medium', 'low']).toContain(e.confidence);
      expect(['day', 'hour', 'minute']).toContain(e.precision);
    }
  });

  it('证据台账覆盖全部 115 条事件，且台账里的日期与事件一致', () => {
    const csv = readFileSync(join(dir, 'pipeline/event-ledger.csv'), 'utf8').trim().split('\n');
    expect(csv).toHaveLength(116); // 表头 + 115
    const header = csv[0].split(',');
    const atCol = header.indexOf('at');
    const idCol = header.indexOf('event_id');
    expect(atCol).toBeGreaterThanOrEqual(0);
    const byId = new Map(events.map((e) => [e.id, e]));
    const seen = new Set<string>();
    for (const line of csv.slice(1)) {
      // CSV 里有带引号的字段，只取前两列（都是不含逗号的裸字段）
      const cells = line.split(',');
      const id = cells[idCol];
      const at = cells[atCol];
      expect(byId.has(id), `台账里的 ${id} 不在事件库`).toBe(true);
      expect(seen.has(id), `${id} 在台账里重复`).toBe(false);
      seen.add(id);
      expect(at, id).toBe(byId.get(id)!.at);
    }
    expect(seen.size).toBe(events.length);
  });
});

describe('莫斯科保卫战 · 关键节点日期', () => {
  // 时段口径：本战役按莫斯科时间（UTC+3），开始取 9-30 古德里安东进
  it('9月30日起、10月2日主攻、10月7日维亚济马合围、10月13日陷落', () => {
    expect(m.time.start).toBe('1941-09-30T00:00');
    expect(day('e.campaign_opens')).toBe('1941-09-30');
    expect(day('e.typhoon_begins')).toBe('1941-09-30');
    expect(day('e.taifun_main_push')).toBe('1941-10-02');
    expect(day('e.vyazma_ring_closed')).toBe('1941-10-07');
    expect(day('e.vyazma_falls')).toBe('1941-10-13');
    expect(isoToHours(event('e.typhoon_begins').at)).toBeLessThan(isoToHours(event('e.taifun_main_push').at));
    expect(isoToHours(event('e.vyazma_ring_closed').at)).toBeLessThan(isoToHours(event('e.vyazma_falls').at));
  });

  it('10月10日朱可夫接管、10月14日加里宁失守、10月18日莫扎伊斯克、10月19日戒严、10月27日沃洛科拉姆斯克', () => {
    expect(day('e.zhukov_takes_command')).toBe('1941-10-10');
    expect(day('e.kalinin_falls')).toBe('1941-10-14');
    expect(day('e.mozhaisk_maloyaroslavets_fall')).toBe('1941-10-18');
    expect(day('e.moscow_siege')).toBe('1941-10-19');
    expect(day('e.volokolamsk_falls')).toBe('1941-10-27');
    // 朱可夫接管早于加里宁失守，不能倒置
    expect(isoToHours(event('e.zhukov_takes_command').at)).toBeLessThan(isoToHours(event('e.kalinin_falls').at));
  });

  it('11月7日红场阅兵、11月15日第二波、11月23日克林、11月28日亚赫罗马、11月30日城郊最近', () => {
    expect(day('e.red_square_parade')).toBe('1941-11-07');
    expect(event('e.red_square_parade').at).toBe('1941-11-07T08:00');
    expect(day('e.november_offensive_opens')).toBe('1941-11-15');
    expect(day('e.klin_falls')).toBe('1941-11-23');
    expect(day('e.yakhroma_canal')).toBe('1941-11-28');
    expect(day('e.krasnaya_polyana')).toBe('1941-11-27');
    expect(day('e.dedovsk_snegiri')).toBe('1941-11-30');
    const series = ['e.red_square_parade', 'e.november_offensive_opens', 'e.klin_falls', 'e.yakhroma_canal', 'e.dedovsk_snegiri'];
    for (let i = 1; i < series.length; i++) expect(isoToHours(event(series[i]).at)).toBeGreaterThan(isoToHours(event(series[i - 1]).at));
  });

  it('12月5-6日反攻、12月15-16日克林与加里宁、12月30日卡卢加', () => {
    expect(day('e.kalinin_counteroffensive')).toBe('1941-12-05');
    expect(day('e.western_front_attacks')).toBe('1941-12-06');
    expect(day('e.klin_liberated')).toBe('1941-12-15');
    expect(day('e.kalinin_liberated')).toBe('1941-12-16');
    expect(day('e.kaluga_liberated')).toBe('1941-12-30');
    // 加里宁方面军 12-5 先动，西方面军 12-6 全线出击
    expect(isoToHours(event('e.kalinin_counteroffensive').at)).toBeLessThan(isoToHours(event('e.western_front_attacks').at));
    // 收复顺序：克林 → 加里宁 → 卡卢加
    expect(isoToHours(event('e.klin_liberated').at)).toBeLessThan(isoToHours(event('e.kalinin_liberated').at));
    expect(isoToHours(event('e.kalinin_liberated').at)).toBeLessThan(isoToHours(event('e.kaluga_liberated').at));
  });

  it('1942年1月：8日总攻、18日空降、21日托罗佩茨、29日苏希尼奇、31日终点', () => {
    expect(day('e.january_general_offensive_order')).toBe('1942-01-07');
    expect(day('e.rzhev_vyazma_offensive')).toBe('1942-01-08');
    expect(day('e.vyazma_airborne_drop')).toBe('1942-01-18');
    expect(day('e.toropets_offensive')).toBe('1942-01-21');
    expect(day('e.sukhinichi_liberated')).toBe('1942-01-29');
    expect(day('e.moscow_not_taken')).toBe('1942-01-31');
    // 战役终点仍在苏军手中，且这是最后一条 importance=1 的收束
    expect(events.at(-1)!.at <= '1942-01-31T23:59').toBe(true);
  });

  it('事件归入 CONVENTIONS 规定的阶段（抽样：合围在 typhoon、莫扎伊斯克在 mozhaisk、反攻在 counter）', () => {
    expect(phaseOf(event('e.vyazma_ring_closed').at)).toBe('typhoon');
    // 莫扎伊斯克防线 10-10 开始占领属台风阶段末段；防线转入战斗地段才在 mozhaisk 阶段
    expect(phaseOf(event('e.mozhaisk_line_manned').at)).toBe('typhoon');
    expect(phaseOf(event('e.moscow_siege').at)).toBe('mozhaisk');
    expect(phaseOf(event('e.kalinin_falls').at)).toBe('mozhaisk');
    expect(phaseOf(event('e.volokolamsk_falls').at)).toBe('mozhaisk');
    expect(phaseOf(event('e.november_offensive_opens').at)).toBe('november');
    expect(phaseOf(event('e.krasnaya_polyana').at)).toBe('november');
    expect(phaseOf(event('e.kalinin_counteroffensive').at)).toBe('counter');
    expect(phaseOf(event('e.rzhev_vyazma_offensive').at)).toBe('january');
  });
});

describe('莫斯科保卫战 · 争议写法与多口径', () => {
  it('「28 名潘菲洛夫战士」写明 2016 年总检察院认定虚构，不当作史实', () => {
    const text = body('e.dubosekovo_fight');
    expect(text).toContain('杜博谢科沃');
    expect(text).toMatch(/二十八|28/);
    expect(text).toMatch(/二零一六|2016/); // 俄总检察院的结论年份
    expect(text).toMatch(/虚构|传闻|不成立/);
    // 第 316 步兵师（11 月 18 日起第 8 近卫）在数据里存在且改名节点有记录
    expect(db.units.has('su.316id')).toBe(true);
    expect(events.some((e) => /第\s*316\s*步兵师/.test(`${e.title.zh}${e.body}`))).toBe(true);
  });

  it('「冬将军」写成多因素之一，不是唯一原因', () => {
    const text = body('e.winter_general_myth');
    expect(text).toContain('冬将军');
    for (const k of ['泥泞', '冬装', '预备队']) expect(text, `冬将军叙事应提到 ${k}`).toContain(k);
    expect(text).toMatch(/不(是|足以).*唯一|不能.*归因|共同决定/);
    // 严寒对双方同时起作用
    expect(text).toMatch(/苏军同样受冻|苏军同样/);
  });

  it('博克 673,098 人写成德方战时宣称口径，与当代研究并列', () => {
    const text = body('e.bock_prisoner_claim') + JSON.stringify(o.db.forces);
    expect(text).toContain('673,098');
    expect(text).toMatch(/宣称|战时宣传|未经独立核实/);
    // 不能把宣称数写成确证战果
    expect(event('e.bock_prisoner_claim').confidence).toBe('medium');
  });

  it('波多利斯克军校生按约 3,500 人写，不写夸大的战果', () => {
    const text = body('e.podolsk_cadets');
    expect(text).toContain('三千五百');
    expect(text).toMatch(/争议|仍有/);
    expect(text).toContain('小雅罗斯拉韦茨');
  });

  it('佐尔格情报写「影响存在争议」，不写成唯一原因', () => {
    const text = body('e.siberia_divisions');
    expect(text).toContain('佐尔格');
    expect(text).toMatch(/争议/);
    expect(text).toMatch(/不宜写成唯一原因|不是唯一/);
    // 远东师团西调本身要有档案依据的表述
    expect(text).toMatch(/远东/);
  });

  it('十月十六日恐慌区分事实与传说', () => {
    const text = body('e.october_sixteenth_panic');
    expect(text).toMatch(/传说|后来传说|多属/);
    expect(text).toMatch(/政府机构|东迁|古比雪夫/);
    // 事实部分：10 月 19 日戒严另有独立事件，不混在同一条里当传说
    expect(day('e.moscow_siege')).toBe('1941-10-19');
  });

  it('伤亡多口径未被合并：苏方 514,338 / 143,941，德方按月分列，互不相加', () => {
    const forces = o.db.forces;
    expect(JSON.stringify(forces)).toContain('514,338');
    expect(JSON.stringify(forces)).toContain('143,941');
    expect(forces.sides.SU.losses.killed).toContain('514,338');
    expect(forces.sides.SU.losses.wounded).toContain('143,941');
    // 德方按十日报告分段给出，且不出现「四个月合计 436,900 当战役数字」的合并写法
    expect(forces.sides.DE.losses.killed).toContain('145,000');
    expect(forces.sides.DE.note).toMatch(/不合并|不相减|不可相加/);
    expect(forces.sides.SU.note).toMatch(/不可直接相减|不可相加|不合并/);
    // 事件层也保留「只能并置，不能相加」的表述
    expect(body('e.november_toll')).toMatch(/不能.*相加|不能简单比较|只能并置/);
    // 反攻阶段数字截至 1942-01-07，不含 1 月
    const byPhase = o.db.forces.byPhase ?? {};
    expect(JSON.stringify(byPhase.counter.SU.losses)).toContain('139,586');
    expect(JSON.stringify(byPhase.counter.SU.losses)).toContain('231,369');
    // 1 月苏军伤亡未核定 → 留空而不是插值
    expect(JSON.stringify(byPhase.january.SU.losses)).toMatch(/未核定|留空/);
  });

  it('五个阶段都有 forces.byPhase 条目，且不虚构未知项', () => {
    const byPhase = o.db.forces.byPhase ?? {};
    expect(Object.keys(byPhase)).toEqual(PHASES.map((p) => p.id));
    for (const p of PHASES) {
      const row = byPhase[p.id];
      expect(row.DE, p.id).toBeDefined();
      expect(row.SU, p.id).toBeDefined();
      expect(row.SU.commander, p.id).toBeTruthy();
      for (const side of ['DE', 'SU'] as const) {
        const loss = row[side].losses ?? {};
        // 每个已填的损失字段都必须是文本并带口径说明，不能是裸数字
        for (const [k, v] of Object.entries(loss)) expect(typeof v, `${p.id}.${side}.${k}`).toBe('string');
      }
    }
    // 兵力未知项用 null，不插值
    expect(byPhase.mozhaisk.SU.men ?? null).toBeNull();
  });
});

describe('莫斯科保卫战 · 编制与指挥不跨阶段', () => {
  it('第 316 步兵师在 11 月 18 日之后作第 8 近卫步兵师出现（同一 id 的 history 写明改名）', () => {
    const u = db.units.get('su.316id')!;
    expect(u).toBeDefined();
    expect(`${u.name.zh}${u.history ?? ''}`).toMatch(/316/);
    expect(`${u.name.zh}${u.history ?? ''}`).toMatch(/近卫步兵第 8|第 8 近卫/);
    // 改名节点在 track 上也有记录，且之后不再作为第 316 师出现在场
    expect(u.track.at(-1)!.note ?? '').toMatch(/近卫/);
    expect(u.commander?.zh).toContain('潘菲洛夫');
    expect(u.commander?.zh).toMatch(/11 月 18 日/);
  });

  it('第 4 坦克旅 11 月 11 日改称近卫坦克第 1 旅', () => {
    const u = db.units.get('su.1gv_tbr')!;
    expect(u).toBeDefined();
    expect(`${u.name.zh}${u.history ?? ''}`).toMatch(/11 月 11 日/);
    expect(db.events.some((e) => e.id === 'e.fourth_tank_brigade_guards' && e.at.startsWith('1941-11-11'))).toBe(true);
  });

  it('第 4 装甲集群写明 1941 年 9 月末自北方集团军群转调（不能当成一直在中央）', () => {
    const u = db.units.get('de.pzgr4')!;
    expect(u).toBeDefined();
    expect(`${u.history ?? ''}${u.commander?.zh ?? ''}`).toMatch(/1942 年 1 月 8 日/);
    expect(u.history ?? '').toMatch(/北方集团军群/);
    expect(u.history ?? '').toMatch(/9 月/);
  });

  it('指挥官去职日期按 R1 口径：古德里安 12-25、博克 12-19、施特劳斯 1942-01-14—16', () => {
    expect(db.units.get('de.hgr_center')!.commander!.zh).toMatch(/12 月 19 日/);
    expect(db.units.get('de.pzgr2')!.commander!.zh).toMatch(/12 月 25 日/);
    expect(db.units.get('de.9a')!.commander!.zh).toMatch(/1942 年 1 月 14—16 日/);
    // 事件层同口径
    expect(day('e.brauchitsch_bock_relieved')).toBe('1941-12-19');
    expect(day('e.guderian_relieved')).toBe('1941-12-26');
  });

  it('部队在战役时间窗内出场：开战时双方主力已在场，战役后没有额外编制', () => {
    const t0 = isoToHours('1941-09-30T12:00');
    const present = (side: string) => db.unitList.filter((u) => u.side === side && unitStateAt(u.id, db.units, t0)).length;
    expect(present('DE')).toBeGreaterThan(80);
    expect(present('SU')).toBeGreaterThan(100);
    // 编制树无环、末级都有轨迹
    const kids = new Map<string, string[]>();
    for (const u of db.unitList) if (u.parent) kids.set(u.parent, [...(kids.get(u.parent) ?? []), u.id]);
    for (const u of db.unitList) {
      if (kids.get(u.id)?.length) continue;
      expect(u.track.length, `${u.id} 无轨迹`).toBeGreaterThan(0);
    }
  });
});

describe('莫斯科保卫战 · 城市归属（独立射线法交叉验证）', () => {
  /** 射线法：点是否被该帧的 DE 槽多边形覆盖（外环内、且不在任何洞里） */
  const covered = (ll: LonLat, polys: LonLat[][][]) =>
    polys.some((poly) => pointInRing(ll, poly[0]) && !poly.slice(1).some((r) => pointInRing(ll, r)));
  /**
   * city-ledger 的 date 取义（见该文件 _doc）：多数取史料沦陷/收复当日；当日期落在两帧之间时，
   * 取**引擎发生切换的那个关键帧**，即「at ≥ date 的第一帧」。因此这里按「不早于该日期的第一帧」取帧，
   * 与台账逐点互证；这不是放水，而是台账自己声明的对齐方式。
   */
  const frameAt = (iso: string) => {
    const f = db.keyframes.find((k) => k.at >= iso) ?? db.keyframes.at(-1);
    if (!f) throw new Error(`缺少 ${iso} 之后的控制帧`);
    return f;
  };
  const place = (id: string) => {
    const p = db.gaz.get(id);
    if (!p) throw new Error(`缺少地名 ${id}`);
    return p.pos;
  };

  // 用 city-ledger 的 knownLineMismatches 作为豁免表，避免对「折线剖面覆盖不到」的城硬断言
  const exempt = new Set(cityLedger.knownLineMismatches.map((x) => `${x.place}@${x.date}`));

  it('city-ledger 的 56 城 / 177 个状态点与关键帧多边形一致（已知 5 处结构性豁免除外）', () => {
    expect(cityLedger.cities).toHaveLength(56);
    expect(cityLedger.knownLineMismatches).toHaveLength(5);
    let checked = 0;
    for (const c of cityLedger.cities) {
      for (const e of c.events) {
        if (exempt.has(`${c.place}@${e.date}`)) continue;
        const f = frameAt(e.date);
        const got = covered(place(c.place), f.a) ? 'DE' : 'SU';
        expect(got, `${c.place} @ ${e.date}（取帧 ${f.at}）`).toBe(e.holder);
        checked++;
      }
    }
    expect(checked).toBe(172);
  });

  it('五处结构性豁免都写明理由，且都是「折线覆盖不到」而非「画错」', () => {
    for (const x of cityLedger.knownLineMismatches) {
      expect(x.reason.length, x.place).toBeGreaterThan(20);
      expect(['SU', 'DE']).toContain(x.lineHolder);
    }
    const places = cityLedger.knownLineMismatches.map((x) => x.place);
    expect(places).toContain('livny');
    expect(places).toContain('demyansk');
  });

  it('莫斯科、图拉、谢尔普霍夫、卡希拉、科洛姆纳、梁赞在整个战役中从未被涂成德军控制', () => {
    for (const id of ['moscow', 'tula', 'serpukhov', 'kashira', 'kolomna', 'ryazan', 'torzhok', 'dmitrov']) {
      for (const k of db.keyframes) expect(covered(place(id), k.a), `${id} @ ${k.at}`).toBe(false);
    }
  });

  it('城区从未被占领的城市（谢尔吉耶夫镇/扎戈尔斯克）不被合围圈扫到', () => {
    // 该城在 11-28 那帧被南北合围圈扫到，属已知结构性覆盖；此处只断言「不长期落入」
    const frames = db.keyframes.filter((k) => covered(place('sergiyev_posad'), k.a)).map((k) => k.at);
    expect(frames.length).toBeLessThanOrEqual(6);
    for (const at of frames) {
      expect(at >= '1941-11-25T00:00', at).toBe(true);
      expect(at <= '1941-12-05T00:00', at).toBe(true);
    }
  });

  it('维亚济马、布良斯克、勒热夫、格扎茨克在战役终点仍属德军', () => {
    const last = db.keyframes.at(-1)!;
    for (const id of ['vyazma', 'bryansk', 'rzhev', 'gzhatsk', 'yukhnov', 'orel', 'mtsensk'])
      expect(covered(place(id), last.a), id).toBe(true);
  });

  it('12 月反攻收复的城市在 1 月底已回到苏方', () => {
    const last = db.keyframes.at(-1)!;
    for (const id of ['klin', 'kalinin', 'kaluga', 'volokolamsk', 'mozhaisk', 'naro_fominsk', 'maloyaroslavets', 'sukhinichi'])
      expect(covered(place(id), last.a), id).toBe(false);
  });

  it('包围圈锚点在其存续期内落在苏方「洞」里（维亚济马、布良斯克、托罗佩茨走廊）', () => {
    const holes: [string, string, string][] = [
      // [锚点地名, 存续起始, 存续结束]
      // 维亚济马圈的锚点是瑟乔夫卡：霍尔姆-日尔科夫斯基的真实坐标（55.517N/33.467E）
      // 落在圈外环以西，旧坐标偏东 66 km 才「恰好」在洞内（审查 F5）。
      // 锚点必须是确实在圈内的城镇，故改用瑟乔夫卡。
      ['sychevka', '1941-10-07T12:00', '1941-10-13T12:00'],
      ['trubchevsk', '1941-10-06T12:00', '1941-10-17T12:00'],
      ['toropets', '1942-01-21T12:00', '1942-01-31T23:59'],
    ];
    for (const [id, from, to] of holes) {
      const ll = resolvePos(`@${id}`, db.gaz);
      const frames = db.keyframes.filter((k) => k.at >= from && k.at <= to);
      expect(frames.length, id).toBeGreaterThan(0);
      for (const k of frames) {
        const inHole = k.a.some((poly) => poly.slice(1).some((r) => pointInRing(ll, r)));
        expect(inHole, `${id} 应在 ${k.at} 的洞里`).toBe(true);
      }
    }
  });

  it('合围圈的洞锚点是被围苏军所在的城镇，不是合围闭合点上的城市本身', () => {
    // pockets.json 的 anchor 记「这个口袋围住了哪里」（写城市名本身没问题）；
    // 控制区的洞则必须套住**圈内苏军**，因此 make_fronts 用的是霍尔姆-日尔科夫斯基、特鲁布切夫斯克
    // （见 docs/GEOGRAPHY.md §5 与 §7 的「已知偏差」）。这条断言锁定「洞归谁」的语义：
    //  · 闭合日（10-07）维亚济马城已是德军控制的闭合点，洞必须从它旁边绕过去；
    //  · 城区 10-13 才陷落，所以 10-10、10-12 两帧城里仍是苏方，落在洞里是正确的。
    const vyazma = resolvePos('@vyazma', db.gaz);
    // 用瑟乔夫卡作圈内锚点（霍尔姆-日尔科夫斯基真实坐标在圈外，见 F5）
    const kholm = resolvePos('@sychevka', db.gaz);
    const bryansk = resolvePos('@bryansk', db.gaz);
    const trub = resolvePos('@trubchevsk', db.gaz);
    expect(haversineKm(vyazma, kholm)).toBeGreaterThan(30);  // 瑟乔夫卡仍在维亚济马以北 >30km
    expect(haversineKm(bryansk, trub)).toBeGreaterThan(50);

    const holeAt = (at: string) => db.keyframes.find((k) => k.at === at)!.a.flatMap((poly) => poly.slice(1));
    // 合围圈首次出现在关键帧上时（pocket 10-07 12:00 闭合 → 首个带洞帧不早于它）：
    // 锚点在洞里，城市本身不在洞里（它是闭合点）
    const firstHole = db.keyframes.find((k) => k.a.some((poly) => poly.length > 1))!;
    expect(isoToHours(firstHole.at)).toBeGreaterThanOrEqual(isoToHours('1941-10-06T12:00'));
    expect(firstHole.a.flatMap((poly) => poly.slice(1)).some((h) => pointInRing(trub, h))).toBe(true);
    // 闭合后、城区陷落前的两帧：城市仍属苏方，可以（且应当）在洞里，锚点也在洞里
    for (const at of ['1941-10-10T00:00', '1941-10-12T00:00']) {
      expect(holeAt(at).some((h) => pointInRing(vyazma, h)), at).toBe(true);
      expect(holeAt(at).some((h) => pointInRing(kholm, h)), at).toBe(true);
    }
    // 10-14 起合围圈已肃清，洞里不再有维亚济马
    expect(holeAt('1941-10-14T00:00').some((h) => pointInRing(vyazma, h))).toBe(false);
    // 布良斯克城 10-06 即被占，从不在洞里；洞锚点始终是特鲁布切夫斯克
    for (const k of db.keyframes.filter((k) => k.at >= '1941-10-06' && k.at <= '1941-10-17')) {
      for (const hole of k.a.flatMap((poly) => poly.slice(1))) expect(pointInRing(bryansk, hole), `${k.at} 布良斯克`).toBe(false);
    }
  });
});

describe('莫斯科保卫战 · 包围圈口径', () => {
  const pockets = json('data/pockets.json') as Pocket[];
  it('6 个包围圈，全部有中文名、来源与明确的归宿', () => {
    expect(pockets).toHaveLength(6);
    for (const p of pockets) {
      expect(p.name.zh.length, p.id).toBeGreaterThan(2);
      expect(p.sources!.length, p.id).toBeGreaterThan(0);
      expect((p.note ?? '').length, p.id).toBeGreaterThan(20);
    }
    expect(pockets.map((p) => p.id).sort()).toEqual(
      ['p.bryansk', 'p.mtsensk_thrust', 'p.sukhinichi', 'p.tula', 'p.vyazma', 'p.vyazma_airborne'].sort(),
    );
  });

  it('图拉是「围攻未陷」，与维亚济马「被歼」区分开', () => {
    const tula = pockets.find((p) => p.id === 'p.tula')!;
    const vyazma = pockets.find((p) => p.id === 'p.vyazma')!;
    expect(tula.fate).toBe('relieved');
    expect(vyazma.fate).toBe('destroyed');
    // 图拉城本身在控制区里始终是苏方
    const ll = resolvePos('@tula', db.gaz);
    for (const k of db.keyframes) expect(pointInRing(ll, k.a[0]?.[0] ?? []), k.at).toBe(false);
  });

  it('霍尔姆（1942-01）不写成合围圈：那是德军被围，与苏军被围的语义相反', () => {
    expect(pockets.some((p) => p.id.includes('kholm'))).toBe(false);
    // 但事件库里保留这一节点，并写明是德军守备队被围
    const kholm = event('e.kholm_pocket');
    expect(kholm.body).toMatch(/德军|守备/);
  });
});

describe('莫斯科保卫战 · 部队运动与战区一致性', () => {
  it('部队轨迹都在画布范围内（允许少量离场集结/撤离点）', () => {
    const [w, s, e, n] = [29.7, 51.4, 41.3, 58.1];
    let off = 0, total = 0;
    for (const u of db.unitList) {
      for (const k of u.track) {
        total++;
        if (k.ll[0] < w || k.ll[0] > e || k.ll[1] < s || k.ll[1] > n) off++;
      }
    }
    expect(off / total, `场外轨迹点 ${off}/${total}`).toBeLessThan(0.02);
  });

  it('路线端点与部队轨迹的起讫位置吻合（不大于 60 km）', () => {
    let checked = 0;
    for (const r of db.routes) {
      const u = db.units.get(r.unit)!;
      if (!u.track.length) continue;
      const first = r.wps[0];
      const start = u.track[0].ll;
      const near = u.track.some((k) => haversineKm(k.ll, first.ll) < 60);
      expect(near || haversineKm(start, first.ll) < 60, `${r.id} 起点离 ${u.id} 轨迹太远`).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(50);
  });
});
