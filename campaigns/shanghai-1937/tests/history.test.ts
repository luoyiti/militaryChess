/**
 * 独立史实回归：日期/编制依据见 pipeline/research.json 中的实际阅读记录。
 * 史料只支持日或阶段精度；午夜、正午及防插值哨点均是显示契约，不是历史实钟。
 * 场测试读取成品掩膜并走生产 SDF；不能用 raw polygon 或交接中的 PASS 替代。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';
import { campaignDir, publicDir } from '../../../tools/lib/campaign-node';
import { isoToHours } from '../../../engine/core/time';
import { haversineKm, isTerminal, unitStateAt } from '../../../engine/model/core';
import { fieldAt, sample, theaterAt, type FieldModel } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import type { HistEvent, LonLat, Unit } from '../../../engine/core/types';

const opened = openCampaign('shanghai-1937');
const { def, db, m } = opened;
const root = campaignDir(m.id);
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const units = Object.entries(def.data).filter(([path]) => path.includes('/oob/')).flatMap(([, data]) => data as Unit[]);
const events = def.data['./data/events.json'] as HistEvent[];
const event = (id: string) => {
  const found = events.find((e) => e.id === id);
  expect(found, id).toBeDefined();
  return found!;
};
const state = (id: string, at: string) => unitStateAt(id, db.units, isoToHours(at));
const place = (id: string) => db.gaz.get(id)!.pos;
let model: FieldModel | undefined;
const field = () => model ??= fieldModelFor(opened);
const maskAt = (ll: LonLat) => {
  const f = field(), [x, y] = toGrid(ll);
  return f.masks[Math.floor(y) * f.grid.w + Math.floor(x)];
};
/** <0 才是经过物理陆地和战区裁剪后的实际日军着色，不是多边形包含关系。 */
const japaneseField = (ll: LonLat, at: string) => {
  const f = field(), [x, y] = toGrid(ll), h = isoToHours(at);
  return Math.max(sample(fieldAt(f, h, 0), f.grid, x, y), sample(theaterAt(f, h), f.grid, x, y));
};
const credits = readJson<{ geography: { title: string }[]; photos: { src: string; sourceUrl: string; license: string; author: string }[] }>(join(publicDir(m.id), 'credits.json'));
const publicGeography = credits.geography.map((c) => c.title).join('\n');
/** 方法和异说可放事件备注/公开署名，不强迫叙事正文重复实现细节。 */
const disclosureText = (id: string) => {
  const e = event(id);
  return [e.body, e.mapNote, m.credits.extraHtml, ...(m.credits.geodata ?? [])].filter(Boolean).join(' ');
};

interface Photo {
  src: string; sourceUrl: string; author: string; license: string; caption: string;
}
const photoIndex = readJson<Record<string, Photo>>(join(publicDir(m.id), 'photos/index.json'));
const photoEvidence = readJson<{
  accepted: { commons: string; sourceUrl: string; permissionTemplate: string; limits: string }[];
  excluded: { commons: string; reason: string }[];
}>(join(root, 'pipeline/photo-evidence.json'));
const research = readJson<{
  sourceReadings: { id: string; scope: string; evidenceRole?: string; supports: string[]; cautions?: string[] }[];
  accessLimitations: { url: string; directFetch?: string; usedAsEvidence: boolean }[];
}>(join(root, 'pipeline/research.json'));

// 纪念馆综述、冯明铭研究支持11/12；更晚的苏锡追击不能倒入本卷。
describe('会战范围与日精度史实', () => {
  it('区分8月9日危机背景、8月13日开战与11月12日华界失守', () => {
    expect(m.time.start).toBe('1937-08-13T09:00');
    expect(m.time.end).toBe('1937-11-12T23:59');
    expect(m.time.dataEnd).toBe(m.time.end);
    expect([m.time.tzLabel, m.time.utcOffset]).toEqual(['UTC+8', 8]);
    const intro = m.intro.paragraphs.join('');
    expect(intro).toMatch(/(?:8月9日|八月九日).*虹桥机场/);
    const openingDisclosure = [disclosureText('e.opening'), m.intro.how].join(' ');
    expect(openingDisclosure).toMatch(/(?:播放|显示)起点/);
    expect(openingDisclosure).toMatch(/(?:并非|不是|不代表|非).*(?:实钟|首枪|开火)/);
    expect(event('e.shanghai_falls').sources).toEqual(expect.arrayContaining(['nmm_shanghai_overview', 'feng_command_2021']));
    expect(event('e.shanghai_falls').body).toContain('公共租界和法租界并非同日全部被日军占领');
    for (const e of events) expect(e.at <= m.time.end && (e.endAt ?? e.at) <= m.time.end, e.id).toBe(true);
    expect(db.units.has('jp.16div')).toBe(false); // 11/13白茆口登陆在窗口外。
  });

  it('重要节点采用已核日而非误抄日期，并关联对应的已读来源', () => {
    const expected = [
      ['e.opening', '1937-08-13', 'nmm_shanghai_overview'],
      ['e.air_misbomb', '1937-08-14', 'shanghai_sites_2017'],
      ['e.jianqiao_context', '1937-08-14', 'cacw_jianqiao'],
      ['e.river_landings', '1937-08-23', 'sanlian_chronology_2005'],
      ['e.south_station', '1937-08-28', 'shanghai_sites_2017'],
      ['e.baoshan', '1937-09-07', 'xinhua_yao_2018'],
      ['e.dachang_falls', '1937-10-26', 'sihang_museum_2024'],
      ['e.sihang_defense', '1937-10-27', 'sihang_museum_2024'],
      ['e.sihang_flag', '1937-10-29', 'yang_shenbao_2017'],
      ['e.sihang_withdrawal', '1937-10-31', 'sihang_museum_2024'],
      ['e.hangzhou_landing', '1937-11-05', 'jacar_hangzhou_landing'],
      ['e.central_china', '1937-11-07', 'feng_command_2021'],
      ['e.nanshi_refuge', '1937-11-09', 'shanghai_sites_2017'],
      ['e.shanghai_falls', '1937-11-12', 'feng_command_2021'],
    ];
    for (const [id, day, source] of expected) {
      const e = event(id);
      expect(e.at.slice(0, 10), id).toBe(day);
      expect(e.precision, id).toBe('day');
      expect(e.sources, id).toContain(source);
      expect(db.sources.has(source), source).toBe(true);
    }
  });

  it('误炸、日军南站轰炸与筧桥空战不混淆责任、地理或组织年代', () => {
    const mistake = event('e.air_misbomb'), station = event('e.south_station'), air = event('e.jianqiao_context');
    // 大世界归因采用编年的明确窄项；不能把FRUS的再发风险假设当作两地逐弹归属证明。
    expect(mistake.body).toMatch(/中国空军.*(?:误落|误投).*大世界/);
    expect(mistake.body).toMatch(/外滩.*原目标.*出云/);
    expect(mistake.sources).toEqual(expect.arrayContaining(['shanghai_sites_2017', 'sanlian_chronology_2005', 'frus_gauss_19371004']));
    expect(mistake.confidence).toBe('medium');
    expect(station.body).toMatch(/日军轰炸旧上海南站/);
    expect(station.body).toContain('不是今日徐汇上海南站');
    expect(air.body).toMatch(/杭州筧桥.*第四大队.*霍克三型.*日本海军鹿屋航空队/);
    expect(air.mapNote).toContain('不设置移到上海的机场或飞机棋子');
    expect(db.units.has('cn.avg')).toBe(false);
    expect(db.units.has('jp.air_force')).toBe(false);
    expect(db.equipment.get('jp_naval_air')?.desc).toContain('各有航空兵');
  });
});

// 日本编制：JACAR内容摘要、冯文；师团主官另核日文编制表。
describe('登陆、指挥及不确定性的实际运行约束', () => {
  it('增援先不可见，再按已核日登陆；10月1日只表示保守显示窗口', () => {
    const boundaries = [
      ['jp.3div', '1937-08-23T00:00', '1937-08-22T23:59'],
      ['jp.11div', '1937-08-23T00:00', '1937-08-22T23:59'],
      ['jp.10army', '1937-11-05T00:00', '1937-11-04T23:59'],
      ['jp.6div', '1937-11-05T00:00', '1937-11-04T23:59'],
      ['jp.18div', '1937-11-05T00:00', '1937-11-04T23:59'],
      ['jp.114div', '1937-11-05T00:00', '1937-11-04T23:59'],
      ['jp.kunisaki', '1937-11-05T00:00', '1937-11-04T23:59'],
    ];
    for (const [id, start, before] of boundaries) {
      expect(db.units.get(id)?.active?.from, id).toBe(start);
      expect(state(id, before), id).toBeNull();
      expect(state(id, start), id).not.toBeNull();
    }
    for (const id of ['jp.9div', 'jp.13div', 'jp.101div']) {
      expect(state(id, '1937-09-30T23:59'), id).toBeNull();
      expect(state(id, '1937-10-01T00:00'), id).not.toBeNull();
      expect(db.units.get(id)?.history, id).toMatch(/保守/);
      expect(db.units.get(id)?.history, id).toMatch(/不是|不将|不作为/);
    }
    expect(disclosureText('e.reinforcements')).toMatch(/(?:显示|展示|编排).*(?:不是|并非|不代表|不意味着).*(?:登陆|上岸)/);
    expect(state('cn.36div', '1937-08-13T12:00')).toBeNull();
  });

  it('两陆军与海军系统不倒置，第10军成立不等于上陆', () => {
    expect(db.units.get('jp.10army')?.parent).toBeNull();
    expect(db.units.get('jp.shanghai_army')?.parent).toBeNull();
    expect(db.units.get('jp.shanghai_marines')?.parent).toBe('jp.third_fleet');
    expect(db.units.get('jp.izumo')?.parent).toBe('jp.third_fleet');
    const army = db.units.get('jp.10army')!;
    expect(army.history).toMatch(/10月20日.*11月5日/);
    for (const id of ['jp.6div', 'jp.18div', 'jp.114div', 'jp.kunisaki']) expect(db.units.get(id)?.parent).toBe(army.id);
    expect(db.units.get('jp.central_china')?.active?.from).toBe('1937-11-07T00:00');
    expect(db.units.get('jp.kunisaki')?.history).toContain('不能把这支支队画成完整第5师团');
    for (const [id, name] of [['jp.3div', '藤田进'], ['jp.11div', '山室宗武'], ['jp.101div', '伊东政喜']]) {
      expect(db.units.get(id)?.commander?.zh, id).toBe(name);
      expect(db.units.get(id)?.sources, id).toContain('japanese_oob_tables');
    }
  });

  it('中方父级只表达可证阶段，不把师、军和集团军同号混成一支部队', () => {
    for (const id of ['cn.87div', 'cn.88div', 'cn.36div']) expect(db.units.get(id)?.parent, id).toBe('cn.9army');
    for (const id of ['cn.98div', 'cn.11div']) expect(db.units.get(id)?.parent, id).toBe('cn.15army');
    expect(db.units.get('cn.98div')?.history).toContain('编制上属第18军');
    expect(db.units.get('cn.98div')?.history).toMatch(/不据此补造.*第18军/);
    for (const id of ['cn.51div', 'cn.18div', 'cn.21army', 'cn.67corps']) expect(db.units.get(id)?.parent, id).toBe('cn.third_war_area');
    expect(db.units.get('cn.18div')?.history).toContain('第18师不是第18军');
    expect(db.units.get('cn.67corps')?.history).toContain('不是8月编年中另提的第67师');
  });

  it('未知后续位置不变成11月冻结抵抗点，更不能成为部队覆灭日期', () => {
    for (const id of ['cn.98div', 'cn.11div', 'cn.51div', 'cn.18div', 'cn.21army']) {
      const u = db.units.get(id)!;
      expect(u.active?.to, id).toBeTruthy();
      expect(u.track.some((p) => isTerminal(p.status)), id).toBe(false);
      expect(u.history, id).toMatch(/后续位置未核/);
      expect(state(id, '1937-11-05T12:00'), id).toBeNull();
      expect(state(id, m.time.end), id).toBeNull();
    }
    // 原第8集团军只有南市静态点，曾在上海失守后仍被当成在战HQ。
    expect(state('cn.8army', m.time.end)).toBeNull();
    expect(db.units.get('cn.8army')?.display).toBe('container');
    expect(m.ui.legend.after).toContain('消失不代表部队停战、撤退或覆灭');
    expect(state('cn.88div', m.time.end)?.status).toBe('withdrawing');
  });
});

// 新华姚子青传记、四行仓库馆：著名分队不能代替整个母师。
describe('宝山与四行的分队尺度和终态', () => {
  it('宝山采用9月7日而非9月5日，战术营瓦解不等于母师全灭或无人生还', () => {
    const u = db.units.get('cn.baoshan_battalion')!;
    expect(u.parent).toBe('cn.98div');
    expect(u.commander?.zh).toBe('姚子青');
    expect(u.name.zh).toMatch(/98师583团第3营/);
    expect(u.sources).toContain('xinhua_yao_2018');
    expect(isTerminal(state(u.id, '1937-09-05T12:00')!.status)).toBe(false);
    expect(state(u.id, '1937-09-07T12:00')?.status).toBe('destroyed');
    expect(state('cn.98div', '1937-09-07T12:00')?.status).toBe('engaged');
    expect(u.history).toContain('已有伤员后送');
    expect(db.pockets.find((p) => p.id === 'p.baoshan')?.units).toEqual([u.id]);
  });

  it('四行是524团第一营等约四百余人，谢团附、杨营长角色不倒置', () => {
    const u = db.units.get('cn.sihang_detachment')!;
    expect(u.parent).toBe('cn.88div');
    expect(u.name.zh).toContain('524团第一营');
    expect(u.commander?.zh).toMatch(/谢晋元（中校团附）.*杨瑞符（第一营营长）/);
    expect(u.history).toMatch(/实际约四百余.*对外称八百/);
    expect(state(u.id, '1937-10-26T23:59')).toBeNull();
    expect(state(u.id, '1937-10-27T00:00')?.ll).toEqual(place('sihang'));
    expect(u.sources).toContain('sihang_museum_2024');
    expect(db.pockets.find((p) => p.id === 'p.sihang')?.units).toEqual([u.id]);
  });

  it('切换前守军仍在仓库，不提前插值成在租界被围；切换后羁留而母师继续西撤', () => {
    const id = 'cn.sihang_detachment';
    // 正午为唯一日级显示边界；前一分钟hold只是防动画漂移，不据此断言撤离钟点。
    for (const at of ['1937-10-30T23:59', '1937-10-31T00:00', '1937-10-31T06:00', '1937-10-31T11:59']) {
      expect(state(id, at)?.ll, at).toEqual(place('sihang'));
      expect(state(id, at)?.status, at).toBe('encircled');
    }
    expect(state(id, '1937-10-31T12:00')?.ll).toEqual(place('settlement'));
    expect(state(id, '1937-10-31T12:00')?.status).toBe('interned');
    expect(state('cn.88div', '1937-10-31T12:00')?.status).toBe('withdrawing');
    const text = [disclosureText('e.sihang_withdrawal'), db.units.get(id)?.history].join(' ');
    expect(text).toMatch(/(?:三十一|31)日凌晨/);
    expect(text).toMatch(/(?:三十一|31)日夜至(?:十一月一|11月1)日凌晨/);
    expect(text).toMatch(/(?:不是|并非|不等于).*向日军投降/);
  });

  it('孤立点的inclusive结束边界不跨入分队终态，11:59仅为最后守备显示哨点', () => {
    const cases = [
      ['p.baoshan', 'cn.baoshan_battalion', '1937-09-07T11:59', '1937-09-07T12:00', 'destroyed'],
      ['p.sihang', 'cn.sihang_detachment', '1937-10-31T11:59', '1937-10-31T12:00', 'interned'],
    ];
    // 读取生产解析后的h0/h1，遵循动态层与侧栏共享的inclusive结束契约；非DOM渲染测试。
    const activePockets = (at: string) => {
      const h = isoToHours(at);
      return db.pockets.filter((p) => h >= p.h0 && h <= p.h1).map((p) => p.id);
    };
    for (const [pocketId, unitId, before, after, terminal] of cases) {
      const p = db.pockets.find((q) => q.id === pocketId)!;
      expect(p, pocketId).toBeDefined();
      expect(p.h1, pocketId).toBe(isoToHours(before));
      expect(state(unitId, before)?.status, unitId).toBe('encircled');
      expect(activePockets(before), pocketId).toContain(pocketId);
      expect(state(unitId, after)?.status, unitId).toBe(terminal);
      expect(p.h1, pocketId).toBeLessThan(isoToHours(after));
      expect(activePockets(after), pocketId).not.toContain(pocketId);
      expect(p.note, pocketId).toMatch(/显示|哨点/);
      expect(p.note, pocketId).toMatch(/(?:不是|非|不代表).*(?:史实|钟点|实钟)/);
    }
  });
});

describe('真实控制场、登陆陆地与地理边界', () => {
  it('宝山县城9月7日前不被提前涂成日占，而不是仅在note声称尚未失守', () => {
    const ll = place('baoshan');
    expect(maskAt(ll) & 17).toBe(17);
    for (const at of ['1937-08-22T23:59', '1937-08-23T00:00', '1937-08-28T12:00', '1937-09-06T23:59', '1937-09-07T11:59']) {
      expect(japaneseField(ll, at), at).toBeGreaterThan(0);
    }
    expect(japaneseField(ll, '1937-09-07T12:00')).toBeLessThan(0);
  }, 60_000);

  it('两次登陆在真实SDF中按日跳变，不能由下一帧插值倒灌到前日', () => {
    const north = state('jp.11div', '1937-08-23T00:00')!.ll;
    for (const ll of [place('wusong'), north]) {
      expect(japaneseField(ll, '1937-08-22T23:59')).toBeGreaterThan(0);
      expect(japaneseField(ll, '1937-08-23T00:00')).toBeLessThan(0);
    }
    const south = place('jinshanwei');
    expect(japaneseField(south, '1937-11-04T23:59')).toBeGreaterThan(0);
    expect(japaneseField(south, '1937-11-05T00:00')).toBeLessThan(0);
  }, 60_000);

  it('北川沙与狮子林地名不为底图而移动，作战点另落同地域陆地并公开示意性质', () => {
    // 现代文保/地域锚点仍落NE概化水格；不谎称这些格子证实1937海滩。
    expect(place('chuanshakou')).toEqual([121.3627, 31.4856]);
    expect(maskAt(place('chuanshakou'))).toBe(0);
    expect(maskAt(place('shizilin'))).toBe(0);
    const landing = state('jp.11div', '1937-08-23T00:00')!.ll;
    const defender = state('cn.98div', '1937-08-23T00:00')!.ll;
    for (const [ll, anchor] of [[landing, place('chuanshakou')], [defender, place('shizilin')]]) {
      expect(maskAt(ll) & 17).toBe(17);
      expect(haversineKm(ll, anchor)).toBeLessThan(2);
      expect(haversineKm(ll, anchor)).toBeGreaterThan(0.1);
    }
    expect(japaneseField(defender, '1937-08-23T00:00')).toBeGreaterThan(0);
    for (const id of ['jp.11div', 'cn.98div']) expect(db.units.get(id)?.track[0].note, id).toMatch(/示意.*(?:非|不是)|(?:非|不是).*(?:史料|精确|原滩)/);
    const sea = db.routes.find((r) => r.id === 'r.north_chuansha_sealift')!;
    const land = db.routes.find((r) => r.id === 'r.luodian_axis')!;
    expect(sea.movement).toBe('sea');
    expect(land.movement).toBe('land');
    expect(sea.wps.at(-1)?.ll).toEqual(landing);
    expect(land.wps[0].ll).toEqual(landing);
    expect(publicGeography).toContain('地名锚点落在概化底图水格');
    expect(publicGeography).toContain('作战标记另用邻近陆上示意点');
  }, 60_000);

  it('外国守备核心始终排除日占，华界与旧站、四行不被整片租界抹去', () => {
    expect(maskAt(place('settlement'))).toBe(80);
    for (const id of ['sihang', 'baoshan', 'hongkou', 'yangshupu', 'nanshi', 'south_station']) expect(maskAt(place(id)) & 17, id).toBe(17);
    for (const k of db.keyframes) expect(japaneseField(place('settlement'), k.at), k.at).toBeGreaterThan(0);
    expect(japaneseField(place('nanshi'), m.time.end)).toBeLessThan(0);
    expect(japaneseField(place('hongkou'), m.time.start)).toBeLessThan(0);
    expect(japaneseField(place('kunshan'), m.time.end)).toBeGreaterThan(0);
    expect(place('sihang')[1]).toBeGreaterThan(place('settlement')[1]);
    expect(db.gaz.get('north_station')?.alt).toContain('非今上海站');
    expect(db.gaz.get('south_station')?.alt).toContain('非今徐汇上海南站');
    expect(publicGeography).toContain('不是完整租界界线');
    expect(publicGeography).toContain('不表示免于炮击');
  }, 60_000);
});

describe('数值、照片和实际阅读范围', () => {
  it('兵力为累计量级，伤亡缺口不补造数字，分队不叠加为母师兵力', () => {
    for (const side of ['CN', 'JP']) {
      const q = db.forces.sides[side]!;
      expect(q.men).toBeNull();
      expect(q.aircraft).toBeNull();
      expect(q.tanks).toBeNull();
      for (const value of Object.values(q.losses)) expect(typeof value).toBe('string');
      expect(q.note).toContain('累计');
    }
    expect(db.forces.sides.CN?.note).toMatch(/不能写作死亡30万/);
    expect(db.forces.sides.CN?.note).toContain('不重复计数');
    expect(db.forces.sides.CN?.note).toContain('1932战事及南京阶段统计全部分开');
    expect(db.forces.sides.JP?.note).toContain('不是完整第5师团');
    expect(m.ui.legend.after).toContain('不表示1937年已加入后来建立的二战同盟');
  });

  it('采用的照片均有已核文件证据和权利声明，排除1945获释人员及错期登陆图', () => {
    expect(photoEvidence.excluded).toHaveLength(2);
    expect(photoEvidence.excluded.find((p) => p.commons.includes('096905'))?.reason).toContain('1945年9月17日');
    expect(photoEvidence.excluded.find((p) => p.commons.includes('hangzhou'))?.reason).toContain('8—10月');
    for (const [key, p] of Object.entries(photoIndex)) {
      const evidence = photoEvidence.accepted.find((a) => a.commons === key);
      expect(evidence, key).toBeDefined();
      expect(evidence?.sourceUrl, key).toBe(p.sourceUrl);
      expect(evidence?.permissionTemplate, key).toMatch(/^PD-(ROC|Japan)-oldphoto$/);
      expect(p.author, key).toContain('不详');
      expect(p.license, key).toBe('Public domain');
      expect(credits.photos).toContainEqual(p);
    }
    const references = [...events, ...db.equipment.values()].flatMap((x) => x.photo ? [x.photo.commons] : []);
    references.push(m.intro.photo!);
    for (const key of references) {
      expect(photoIndex[key], key).toBeDefined();
      expect(key, key).not.toMatch(/096905|hangzhou/i);
    }
    expect(event('e.luodian').photo?.caption).toContain('未证实为罗店');
    expect(m.intro.caption).toContain('拍摄日未详');
  });

  it('未读PDF不冒充原页，JACAR目录和学术转载不冒充已读扫描件或原著', () => {
    const reading = (id: string) => research.sourceReadings.find((r) => r.id === id)!;
    expect(reading('jacar_hangzhou_landing').scope).toMatch(/目录.*摘要/);
    expect(reading('jacar_hangzhou_landing').scope).toMatch(/未读|未读取/);
    expect(reading('feng_command_2021').scope).toMatch(/转载|翻印|重刊/);
    const frus = reading('frus_gauss_19371004');
    expect(frus.evidenceRole).toBe('contextual_retrospective_risk_not_direct_attribution');
    expect(frus.supports.join(' ')).toMatch(/回指.*8月14日.*警告/);
    expect(frus.cautions?.join(' ')).toMatch(/不是直接确认.*8月14日/);
    const failedPdfs = research.accessLimitations.filter((a) => /\.pdf(?:$|\?)/.test(a.url) || a.url.includes('athena.westpoint.edu'));
    expect(failedPdfs.length).toBeGreaterThanOrEqual(3);
    for (const resource of failedPdfs) {
      expect(resource.usedAsEvidence, resource.url).toBe(false);
      expect(resource.directFetch, resource.url).toMatch(/获准.*未执行.*未读取/);
    }
    expect(publicGeography).toMatch(/未取得.*OSM|未下载到OSM/);
    expect(publicGeography).toContain('不是1937岸线');
  });
});
