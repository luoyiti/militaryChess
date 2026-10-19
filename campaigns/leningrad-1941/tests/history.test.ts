import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { openCampaign } from '../../../tests/helpers';
import { isoToHours } from '../../../engine/core/time';
import { haversineKm, resolvePos, unitStateAt } from '../../../engine/model/core';
import type { LonLat } from '../../../engine/core/types';

const { db, m } = openCampaign('leningrad-1941');
const militaryIds = new Set((JSON.parse(readFileSync(new URL('../pipeline/military-events.json', import.meta.url), 'utf8')) as { id: string }[]).map((e) => e.id));
const event = (id: string) => {
  const e = db.events.find((e) => e.id === id);
  if (!e) throw new Error(`缺少历史节点 ${id}`);
  return e;
};
const at = (id: string, time: string) => unitStateAt(id, db.units, isoToHours(time));
const place = (id: string) => {
  const p = db.gaz.get(id);
  if (!p) throw new Error(`缺少历史地名 ${id}`);
  return p.pos;
};

// This independent ray crossing check tests the authored geographic proposition.
// SDF/land-mask acceptance is separately exercised in campaign/geography tests.
function insideRing(p: LonLat, ring: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
const covered = (p: LonLat, polys: LonLat[][][]) => polys.some((poly) => insideRing(p, poly[0]) && !poly.slice(1).some((r) => insideRing(p, r)));
const frame = (day: string) => {
  const f = [...db.keyframes].reverse().find((f) => f.at <= `${day}T23:59`);
  if (!f) throw new Error(`缺少 ${day} 以前的控制帧`);
  return f;
};

describe('列宁格勒 · 围城、破围与完全解围是不同节点', () => {
  // GARF exhibit: https://statearchive.ru/blokada/pred.html
  it('6月22日是战略序章，9月8日才是围城开始', () => {
    expect(m.time.start).toBe('1941-06-22T00:00');
    expect(event('e.barbarossa_north_starts').at.slice(0, 10)).toBe('1941-06-22');
    expect(event('e.shlisselburg_falls').at.slice(0, 10)).toBe('1941-09-08');
  });

  it('芬兰当地15时转换为统一叙事时区的莫斯科16时', () => {
    expect(event('e.karelia_offensive').at).toBe('1941-07-10T16:00');
    expect(event('e.karelia_offensive').precision).toBe('hour');
    expect(event('e.karelia_offensive').mapNote).toContain('UTC+2');
  });

  it('1943年1月18日突破，1944年1月27日20时庆祝完全解围', () => {
    expect(event('e.iskra_linkup').at.slice(0, 10)).toBe('1943-01-18');
    expect(event('e.siege_lifted_salute').at).toBe('1944-01-27T20:00');
    expect(event('e.siege_lifted_salute').precision).toBe('hour');
    expect(db.pockets.find((p) => p.id === 'p.leningrad')?.end.slice(0, 10)).toBe('1943-01-18');
  });

  // Certified-copy catalogue, TsAMO F.3 Op.11556 D.10 L.352.
  // https://www.prlib.ru/item/1936531
  it('火花首次批准使用12月2日第170696号指令，不冒用12月8日后续指令', () => {
    const e = event('e.iskra_plan_approved');
    expect(e.at.slice(0, 10)).toBe('1942-12-02');
    expect(e.sources).toContain('mil_prlib_directive170696');
    expect(db.sources.get('mil_prlib_directive170696')?.title).toContain('170696');
  });
});

describe('列宁格勒 · 编制与指挥不能跨越历史阶段', () => {
  // CMH Moscow to Stalingrad, chapter III pp.50–58.
  it('梅列茨科夫11月7日接任第4集团军，早于8日季赫温失守', () => {
    expect(event('e.meretskov_takes_4a').at.slice(0, 10)).toBe('1941-11-07');
    expect(event('e.tikhvin_falls').at.slice(0, 10)).toBe('1941-11-08');
    expect(event('e.meretskov_takes_4a').h).toBeLessThan(event('e.tikhvin_falls').h);
  });

  it('1941年显示涅瓦前身集群，第67集团军在1942年10月才出现', () => {
    expect(at('su.67a', '1941-09-20T12:00')).toBeNull();
    expect(at('su.neva_group', '1941-09-20T12:00')).not.toBeNull();
    expect(at('su.67a', '1942-10-11T12:00')).not.toBeNull();
    expect(event('e.nevsky_pyatachok_born').units).toContain('su.neva_group');
    expect(event('e.nevsky_pyatachok_born').units).not.toContain('su.67a');
  });

  // July14/15 restoration directives: TsAMO F.48a Op.3408 D.72 L.25/32.
  it('第2突击集团军六月旧记录结束，七月重建另有记录与活动窗口', () => {
    expect(at('su.2sh_a', '1942-06-30T12:00')).toBeNull();
    expect(at('su.2sh_rebuilt', '1942-07-10T12:00')).toBeNull();
    expect(at('su.2sh_rebuilt', '1942-07-16T12:00')).not.toBeNull();
    expect(event('e.iskra_launches').units).toContain('su.2sh_rebuilt');
    expect(event('e.iskra_launches').units).not.toContain('su.2sh_a');
    expect(db.units.get('su.2sh_rebuilt')?.sources).toContain('mil_secondshock_rebuild');
  });

  it('不能把莫德尔提前为一月雷霆初期指挥官', () => {
    expect(event('e.model_takes_command').at.slice(0, 10)).toBe('1944-01-31');
    expect(event('e.peterhof_pocket_crushed').body).toContain('仍是屈希勒尔');
    expect(db.units.get('de.hgr_nord')?.commander?.zh).toContain('1月31日');
  });

  it('1941年的芬兰卡累利阿集团军机关不原样延续至1944年', () => {
    expect(at('fi.karelian_army', '1944-01-15T12:00')).toBeNull();
    expect(at('fi.aunus_group', '1944-01-15T12:00')).not.toBeNull();
  });
});

describe('列宁格勒 · 对易误绘地点的独立控制断言', () => {
  it('里加、陶格夫匹尔斯和塔林的后方占领区不会在后续帧重置', () => {
    for (const f of db.keyframes.filter((f) => f.at >= '1941-09-01')) {
      for (const id of ['riga', 'dvinsk', 'tallinn']) expect(covered(place(id), f.a), `${f.at} ${id}`).toBe(true);
    }
  });

  it('季赫温先被占领，十二月反攻后恢复苏控', () => {
    expect(covered(place('tikhvin'), frame('1941-11-10').a)).toBe(true);
    expect(covered(place('tikhvin'), frame('1941-12-12').a)).toBe(false);
  });

  // Library bibliography pp.48–49 explicitly states height50.1 was not taken.
  // https://www.reglib.ru/books/25/get-file
  it('1943年9月43.3高地已取，但主要50.1高地仍由德军控制', () => {
    const f = frame('1943-09-18');
    expect(covered(place('sinyavino_43_3'), f.a)).toBe(false);
    expect(covered(place('sinyavino_50_1'), f.a)).toBe(true);
    expect(event('e.sinyavino_heights_captured').body).toContain('仍在德军手中');
  });

  it('1月18日已出现第5工人村的破围结果，不延迟到20日', () => {
    const f = frame('1943-01-18');
    expect(f.at.slice(0, 10)).toBe('1943-01-18');
    expect(f.transition).toBe('step');
    expect(covered(place('rabochiy_5'), f.a)).toBe(false);
    expect(covered(place('rabochiy_5'), frame('1943-01-11').a)).toBe(true);
  });

  // Kingisepp museum: https://www.lenoblmus.ru/node/1151
  // Novgorod archives PDFp28: Batetskaya was liberated February12.
  it('金吉谢普和巴捷茨卡亚在1月31日仍属德军，不能提前填入二月战果', () => {
    const f = frame('1944-01-31');
    expect(covered(place('kingisepp'), f.a)).toBe(true);
    expect(covered(place('batetskiy'), f.a)).toBe(true);
    const s = at('su.2sh_rebuilt', '1944-01-31T18:00');
    expect(s).not.toBeNull();
    expect(haversineKm(s!.ll, place('kingisepp'))).toBeGreaterThan(4);
  });

  it('沃洛索沃的解放放在27日，不与26日红卫城战果合并', () => {
    expect(event('e.volosovo_liberated').at.slice(0, 10)).toBe('1944-01-27');
    expect(covered(place('volosovo'), frame('1944-01-25').a)).toBe(true);
    expect(covered(place('volosovo'), frame('1944-01-27').a)).toBe(false);
  });

  it('斯维里河前沿不能将洛杰伊诺耶波列误涂为芬军占领', () => {
    for (const f of db.keyframes.filter((f) => f.at >= '1941-09-25')) expect(covered(place('lodeynoye_pole'), f.b), f.at).toBe(false);
  });

  it('奥列舍克岛在岸上城市被占期间不落入德国原始占领多边形', () => {
    // The island is smaller than the field grid. Test the authored hole, not
    // an unstable sign interpolated from neighboring mainland/water cells.
    for (const f of db.keyframes.filter((f) => f.at >= '1941-09-08' && f.at < '1943-01-18')) expect(covered(place('oreshek'), f.a), f.at).toBe(false);
  });
});

describe('列宁格勒 · 运动轨迹与实际战区', () => {
  it('诺夫哥罗德南翼越过的是伊尔门湖北部至西岸，不是舍隆河口', () => {
    const r = db.routes.find((r) => r.id === 'r.su_59a_novgorod_1944');
    expect(r).toBeDefined();
    const crossing = r!.wps.filter((p) => p.h <= isoToHours('1944-01-14T12:00'));
    expect(crossing).toHaveLength(2);
    for (const p of crossing) {
      expect(p.ll[0]).toBeGreaterThan(31.05);
      expect(p.ll[1]).toBeGreaterThan(58.3);
    }
    expect(event('e.novgorod_offensive_starts').body).toContain('螺旋桨雪橇');
  });

  it('两个柳班口袋窗口保留重新开通通道的间隔', () => {
    const a = db.pockets.find((p) => p.id === 'p.myasnoy_bor_march');
    const b = db.pockets.find((p) => p.id === 'p.myasnoy_bor');
    expect(a?.end.slice(0, 10)).toBe('1942-03-27');
    expect(b?.start.slice(0, 10)).toBe('1942-05-31');
    expect(a!.h1).toBeLessThan(b!.h0);
    expect(db.keyframes.find((f) => f.at.startsWith('1942-03-27'))).toBeDefined();
    expect(db.keyframes.find((f) => f.at.startsWith('1942-05-31'))).toBeDefined();
  });

  it('虎式重装甲营不用四号坦克模型伪装，未核编制数量不混成装备计数', () => {
    expect(db.units.get('de.spz502')?.model).not.toBe('pz4');
    for (const u of db.unitList) for (const eq of u.equipment ?? []) expect(eq.count, `${u.id}/${eq.id}`).toBeUndefined();
  });

  it('正文中的军事来源可以追溯，日期精度不由动画控制点冒充', () => {
    for (const e of db.events.filter((e) => militaryIds.has(e.id))) {
      expect([...e.body].length, e.id).toBeGreaterThanOrEqual(80);
      expect([...e.body].length, e.id).toBeLessThanOrEqual(140);
      for (const source of e.sources) expect(db.sources.has(source), `${e.id}/${source}`).toBe(true);
      if (e.precision !== 'day') expect(['e.karelia_offensive', 'e.january_thunder_oranienbaum', 'e.siege_lifted_salute']).toContain(e.id);
    }
    expect(resolvePos('@sinyavino', db.gaz)[1]).toBeLessThan(59.86);
    expect(resolvePos('@sinyavino_modern', db.gaz)[1]).toBeGreaterThan(59.89);
  });
});
