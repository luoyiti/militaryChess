/**
 * 独立史实回归：日期/编制依据见 pipeline/research.json 与 docs/research/wuhan-1938-*.md。
 * 史料只支持日或阶段精度；控制场与轨迹为作战地域示意，不是逐日实测或精测阵地图。
 * 场测试读取成品掩膜并走生产 SDF；不能用 raw polygon 替代。
 */
import { describe, expect, it } from 'vitest';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';
import { isoToHours } from '../../../engine/core/time';
import { unitStateAt } from '../../../engine/model/core';
import { fieldAt, sample, theaterAt, type FieldModel } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import type { HistEvent, LonLat, Unit } from '../../../engine/core/types';

const opened = openCampaign('wuhan-1938');
const { def, db, m } = opened;
const units = Object.entries(def.data).filter(([p]) => p.includes('/oob/')).flatMap(([, d]) => d as Unit[]);
const events = def.data['./data/events.json'] as HistEvent[];
const event = (id: string) => events.find((e) => e.id === id)!;
const state = (id: string, at: string) => unitStateAt(id, db.units, isoToHours(at));
let model: FieldModel | undefined;
const field = () => (model ??= fieldModelFor(opened));
/** <0 才是经过物理陆地和战区裁剪后的实际日军着色。 */
const japaneseField = (ll: LonLat, at: string) => {
  const f = field(), [x, y] = toGrid(ll), h = isoToHours(at);
  return Math.max(sample(fieldAt(f, h, 0), f.grid, x, y), sample(theaterAt(f, h), f.grid, x, y));
};

describe('关键日期与部队状态', () => {
  it('二一八、四二九空战在前奏阶段，属航空类别', () => {
    expect(event('e.218air').category).toBe('air');
    expect(event('e.429air').category).toBe('air');
    expect(event('e.218air').at).toBe('1938-02-18T00:00');
    expect(event('e.429air').at).toBe('1938-04-29T00:00');
  });

  it('花园口标为战争罪行且注明自决与多口径死亡数', () => {
    const e = event('e.huayuankou');
    expect(e.category).toBe('atrocity');
    expect(e.body).toMatch(/花园口|黄河/);
    expect(e.body + (e.mapNote ?? '')).toMatch(/自决|炸开|掘|决堤/);
    expect(e.body).toMatch(/38万|89万|8.9万|淹死/);
  });

  it('万家岭：106师团 9月底被围、10/10 重创瓦解', () => {
    expect(event('e.wanjialing').importance).toBe(1);
    // 日方推算自定员除名口径与中方战报并列
    const e = event('e.wanjialing');
    expect(e.body + (e.mapNote ?? '')).toMatch(/6500|6600|除名/);
    expect(e.body).toMatch(/万余|歼敌|突围/);
    const enc = state('jp.div106', '1938-09-29T00:00');
    expect(enc?.status).toBe('encircled');
    const after = state('jp.div106', '1938-10-11T00:00');
    expect(after && ['destroyed', 'ineffective', 'disbanded'].includes(after.status)).toBe(true);
  });

  it('田家镇、马当要塞在规定日期陷落；要塞守备队终止', () => {
    const madang = state('cn.madang', '1938-06-27T00:00');
    expect(madang && ['destroyed', 'surrendered'].includes(madang.status)).toBe(true);
    const tianjia = state('cn.tianjia', '1938-09-30T00:00');
    expect(tianjia && ['destroyed', 'surrendered'].includes(tianjia.status)).toBe(true);
  });

  it('中山舰 10/24 战沉（destroyed）', () => {
    const s = state('cn.zhongshan', '1938-10-25T00:00');
    expect(s?.status).toBe('destroyed');
  });

  it('富金山 71军 9/2—11 交战，潢川、田家镇、万家岭均有 engaged 轨迹点', () => {
    const engaged = (id: string) => units.find((u) => u.id === id)?.track.some((p) => p.status === 'engaged');
    for (const id of ['cn.army71', 'cn.army27', 'cn.army2t', 'cn.army74'])
      expect(engaged(id), id).toBe(true);
  });
});

describe('控制场（生产 SDF，日军着色）', () => {
  it('开战首帧：武汉、信阳、九江为中方战区（无日军着色）', () => {
    for (const ll of [[114.3, 30.6], [114.09, 32.15], [116.0, 29.71]] as LonLat[])
      expect(japaneseField(ll, '1938-02-18T00:00'), JSON.stringify(ll)).toBeGreaterThanOrEqual(0);
  });

  it('安庆在 6/12 前无日军着色、6/12 后有着色（登陆 step）', () => {
    const anqing: LonLat = [117.06, 30.53];
    expect(japaneseField(anqing, '1938-06-11T23:59')).toBeGreaterThanOrEqual(0);
    expect(japaneseField(anqing, '1938-06-12T12:00')).toBeLessThan(0);
  });

  it('九江 7/26、田家镇 9/29、信阳 10/12、武汉 10/25 后相继有着色', () => {
    expect(japaneseField([116.0, 29.71], '1938-07-26T23:59')).toBeLessThan(0);
    expect(japaneseField([115.38, 29.92], '1938-09-29T23:59')).toBeLessThan(0);
    expect(japaneseField([114.09, 32.15], '1938-10-12T23:59')).toBeLessThan(0);
    expect(japaneseField([114.3, 30.6], '1938-10-25T23:59')).toBeLessThan(0);
  });

  it('黄陂在 10/24 前无日军着色（北路未到）', () => {
    expect(japaneseField([114.37, 30.87], '1938-10-20T00:00')).toBeGreaterThanOrEqual(0);
  });
});

describe('叙事口径', () => {
  const allText = events.map((e) => [e.body, e.mapNote].filter(Boolean).join(' ')).join('\n')
    + JSON.stringify(m.credits?.extraHtml ?? '') + JSON.stringify(m.credits?.geodata ?? []);

  it('伤亡不取单一数字，标注多口径', () => {
    expect(m.ui.brief.fine).toMatch(/口径|各说|不.*单一数字/);
    expect(allText).toMatch(/25\.6万|3\.1—3\.5万|254,?628/);
  });

  it('首帧 1937 战线在地图注记中声明为概势非精确界线', () => {
    expect(m.map.mapKey).toMatch(/1937.*概势|非精确界线/);
  });

  it('毒气战有日方档案佐证的战争罪行注记', () => {
    expect(event('e.gas').category).toBe('atrocity');
    expect(allText).toMatch(/吉见义明|毒气|赤筒/);
  });

  it('万家岭不采用「张灵甫奇袭张古山」演绎', () => {
    expect(allText).not.toMatch(/张灵甫/);
  });
});
