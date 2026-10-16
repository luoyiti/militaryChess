/**
 * 巴巴罗萨行动：史实约束。用与浏览器相同的 SDF 控制区场判断各城市在给定时刻归谁控制
 * （城市陷落 2–3 天后应在占领区内、陷落前应在苏方一侧），包围圈存续期间锚点在苏方「洞」里，
 * 以及参战方登场时序、阶段与事件覆盖。时刻为柏林时间，选在关键帧附近、离史实日期留出插值余量。
 */
import { describe, it, expect } from 'vitest';
import { fieldAt, sample, theaterAt } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import { GRID } from '../../../engine/geo/frame';
import { isoToHours, H_END } from '../../../engine/core/time';
import { PHASES } from '../../../engine/core/phases';
import { unitStateAt, resolvePos } from '../../../engine/model/core';
import type { HistEvent, Pocket, LonLat } from '../../../engine/core/types';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';

const o = openCampaign('barbarossa-1941');
const model = fieldModelFor(o);
const files = o.def.data as Record<string, unknown>;
const events = files['./data/events.json'] as HistEvent[];
const pockets = (files['./data/pockets.json'] ?? []) as Pocket[];
const g = { w: GRID.w, h: GRID.h, cell: GRID.cell };

/** 时刻 at 某地（地名 id 或经纬度）的控制方：DE（轴心国占领）、FI（芬兰占领）、SU（苏方）、out（不在苏联战区） */
function holder(p: string | LonLat, at: string): 'DE' | 'FI' | 'SU' | 'out' {
  const ll = typeof p === 'string' ? resolvePos(`@${p}`, o.db.gaz) : p;
  const h = isoToHours(at);
  const [gx, gy] = toGrid(ll);
  if (sample(fieldAt(model, h, 0), g, gx, gy) < 0 && sample(theaterAt(model, h), g, gx, gy) < 0) return 'DE';
  if (sample(fieldAt(model, h, 1), g, gx, gy) < 0 && sample(theaterAt(model, h), g, gx, gy) < 0) return 'FI';
  return sample(theaterAt(model, h), g, gx, gy) < 0 ? 'SU' : 'out';
}
const present = (side: string, at: string) => [...o.db.units.values()].some((u) => u.side === side && !!unitStateAt(u.id, o.db.units, isoToHours(at)));

describe('巴巴罗萨行动 · 控制区', () => {
  it('开战时轴心国尚未占领任何苏联领土', () => {
    for (const p of ['brest', 'grodno', 'lvov', 'kaunas', 'kishinev', 'vyborg', 'minsk', 'riga']) expect(holder(p, '1941-06-22T03:15'), p).toBe('SU');
  });

  // [地名, 仍在苏方的时刻, 已陷落的时刻, 占领方]
  const falls: [string, string | null, string, 'DE' | 'FI'][] = [
    ['grodno', null, '1941-06-26T20:00', 'DE'],
    ['kaunas', null, '1941-06-26T20:00', 'DE'],
    ['vilnius', null, '1941-06-26T20:00', 'DE'],
    ['dvinsk', null, '1941-06-30T20:00', 'DE'],
    ['minsk', '1941-06-26T20:00', '1941-06-30T20:00', 'DE'],
    ['lvov', '1941-06-28T20:00', '1941-07-03T20:00', 'DE'],
    ['riga', '1941-06-28T20:00', '1941-07-03T20:00', 'DE'],
    ['pskov', '1941-07-03T20:00', '1941-07-12T20:00', 'DE'],
    ['vitebsk', '1941-07-06T20:00', '1941-07-12T20:00', 'DE'],
    ['zhitomir', '1941-07-06T20:00', '1941-07-12T20:00', 'DE'],
    ['kishinev', '1941-07-12T20:00', '1941-07-20T20:00', 'DE'],
    ['smolensk', '1941-07-12T20:00', '1941-07-25T20:00', 'DE'],
    ['uman', '1941-07-25T20:00', '1941-08-10T20:00', 'DE'],
    ['novgorod', '1941-08-10T20:00', '1941-08-21T20:00', 'DE'],
    ['gomel', '1941-08-10T20:00', '1941-08-21T20:00', 'DE'],
    ['tallinn', '1941-08-21T20:00', '1941-08-31T20:00', 'DE'],
    ['vyborg', '1941-08-21T20:00', '1941-09-01T20:00', 'FI'],
    ['shlisselburg', '1941-09-05T20:00', '1941-09-10T20:00', 'DE'],
    ['kiev', '1941-09-15T20:00', '1941-09-22T20:00', 'DE'],
    ['poltava', '1941-09-10T20:00', '1941-09-22T20:00', 'DE'],
    ['petrozavodsk', '1941-09-26T20:00', '1941-10-04T20:00', 'FI'],
    ['orel', '1941-09-30T20:00', '1941-10-07T20:00', 'DE'],
    ['vyazma', '1941-10-01T20:00', '1941-10-10T20:00', 'DE'],
    ['bryansk', '1941-10-01T20:00', '1941-10-10T20:00', 'DE'],
    ['mariupol', '1941-10-04T20:00', '1941-10-10T20:00', 'DE'],
    ['kalinin', '1941-10-10T20:00', '1941-10-18T20:00', 'DE'],
    ['odessa', '1941-10-14T20:00', '1941-10-18T20:00', 'DE'],
    ['kharkov', '1941-10-18T20:00', '1941-10-31T20:00', 'DE'],
    ['simferopol', '1941-10-24T20:00', '1941-11-07T20:00', 'DE'],
    ['tikhvin', '1941-10-31T20:00', '1941-11-15T20:00', 'DE'],
    ['kerch', '1941-11-07T20:00', '1941-11-20T20:00', 'DE'],
    ['klin', '1941-11-15T20:00', '1941-11-29T20:00', 'DE'],
  ];
  it.each(falls)('%s：%s 仍在苏方，%s 已陷落', (place, before, after, by) => {
    if (before) expect(holder(place, before)).toBe('SU');
    expect(holder(place, after)).toBe(by);
  });

  it('罗斯托夫 11 月 21 日陷落、29 日收复；季赫温到战役结束仍在德军手中（12 月 9 日才收复）', () => {
    expect(holder('rostov', '1941-11-15T20:00')).toBe('SU');
    expect(holder('rostov', '1941-11-25T20:00')).toBe('DE');
    expect(holder('rostov', '1941-12-02T20:00')).toBe('SU');
    expect(holder('tikhvin', '1941-12-05T20:00')).toBe('DE');
  });

  it('莫斯科、列宁格勒、图拉、塞瓦斯托波尔、奥拉宁鲍姆到最后仍在苏方', () => {
    // 喀琅施塔得所在的科特林岛小于场网格（约 3.5 km），不在陆地掩膜里，不作检查
    for (const at of ['1941-09-26T20:00', '1941-11-07T20:00', '1941-12-05T20:00'])
      for (const p of ['moscow', 'leningrad', 'tula', 'sevastopol', 'oranienbaum', 'voronezh']) expect(holder(p, at), `${p} @ ${at}`).toBe('SU');
  });

  it('包围圈存续期间锚点在苏方一侧（被轴心国占领区围住），覆灭后归占领方', () => {
    expect(pockets.length).toBeGreaterThanOrEqual(8);
    for (const p of pockets) {
      const a = isoToHours(p.start), b = isoToHours(p.end);
      const ll = resolvePos(p.anchor, o.db.gaz);
      const mid = new Date(Date.UTC(1941, 5, 22) + ((a + b) / 2) * 3600e3).toISOString().slice(0, 16);
      expect(holder(ll, mid), `${p.id} @ ${mid}`).toBe('SU');
      if (['surrendered', 'destroyed'].includes(p.fate) && b + 72 <= H_END) {
        const after = new Date(Date.UTC(1941, 5, 22) + (b + 72) * 3600e3).toISOString().slice(0, 16);
        expect(['DE', 'FI'], `${p.id} @ ${after}`).toContain(holder(ll, after));
      }
    }
  });
});

describe('巴巴罗萨行动 · 时序与覆盖', () => {
  it('各参战方在开战当天或之后登场', () => {
    for (const side of ['DE', 'SU', 'RO']) expect(present(side, '1941-06-22T12:00'), side).toBe(true);
    expect(present('FI', '1941-06-26T12:00')).toBe(true); // 芬兰 6 月 25 日宣布进入战争状态
    expect(present('IT', '1941-07-01T12:00')).toBe(false); // 意大利远征军 7 月中旬才开始抵达
    expect(present('IT', '1941-08-20T12:00')).toBe(true);
    expect(present('HU', '1941-07-05T12:00')).toBe(true);
  });

  it('五个阶段都有重要事件', () => {
    expect(PHASES.map((p) => p.id)).toEqual(['border', 'smolensk', 'kiev', 'typhoon', 'moscow']);
    for (const p of PHASES) {
      const inPhase = events.filter((e) => isoToHours(e.at) >= p.from && isoToHours(e.at) < p.to);
      expect(inPhase.filter((e) => e.importance === 1).length, p.id).toBeGreaterThanOrEqual(2);
      expect(inPhase.length, p.id).toBeGreaterThanOrEqual(12);
    }
  });

  it('事件按时间排序、在战役时间窗内', () => {
    for (let i = 1; i < events.length; i++) expect(events[i].at >= events[i - 1].at, events[i].id).toBe(true);
    for (const e of events) expect(isoToHours(e.at)).toBeLessThanOrEqual(H_END + 24);
  });
});
