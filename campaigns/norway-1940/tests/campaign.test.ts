/** 挪威战役：日历、示意性海上航线、step 过渡的登陆占领、增援与撤离的显示时机、无起点航线的 SVG。 */
import { describe, it, expect } from 'vitest';
import { isoToHours, hoursToDate } from '../../../engine/core/time';
import { createModel, fieldAt, type KFInput } from '../../../engine/geo/field/field';
import { resolveUnits, unitStateAt } from '../../../engine/model/core';
import { lineD } from '../../../engine/map2d/dynamicLayers';
import { makeDataSchemas, ISO } from '../../../engine/schema/zod';
import { MODEL_IDS } from '../../../engine/three/models/index';
import { SYNTH_IDS } from '../../../engine/audio/synth';
import { openCampaign } from '../../../tests/helpers';

const { m } = openCampaign('norway-1940');
const S = makeDataSchemas(m, { models: MODEL_IDS(), sfx: SYNTH_IDS() });

describe('挪威战役数据契约', () => {
  it('使用完整的 1940 年日历并拒绝不存在的时刻', () => {
    expect(isoToHours('1940-04-09T00:00')).toBe(0);
    expect(isoToHours('1940-06-10T00:00')).toBe(62 * 24);
    expect(hoursToDate(62 * 24).toISOString().slice(0, 10)).toBe('1940-06-10');
    expect(ISO.safeParse('1940-04-31T12:00').success).toBe(false);
    expect(ISO.safeParse('1940-04-09T24:01').success).toBe(false);
    expect(m.sides.map((s) => s.id)).toEqual(['DE', 'NO', 'UK', 'FR', 'PL']);
  });
  it('支持明确标注为示意的海上航线', () => {
    const r = S.Route.safeParse({ id: 'r.test', side: 'UK', unit: 'uk.warspite', style: 'main', movement: 'sea', widthKm: 5,
      waypoints: [{ at: '1940-04-13T00:00', pos: [15, 68] }, { at: '1940-04-13T12:00', pos: [17, 68.4] }],
      sources: ['uk_official'], confidence: 'medium', schematic: true });
    expect(r.success).toBe(true);
  });
  it('登陆日之前不会长出登陆点的占领区（step 过渡）', () => {
    const grid = { w: 32, h: 32, cell: 1 };
    const kfs: KFInput[] = [{ h: 0, a: [], b: [] }, { h: 8, a: [[[[10, 10], [20, 10], [20, 20], [10, 20]]]], b: [], transition: 'step' }];
    const model = createModel(grid, new Uint8Array(1024).fill(17), kfs, 12, { theatreMask: 1, homeMasks: [0, 0] });
    expect(fieldAt(model, 7.999, 0)[15 * 32 + 15]).toBeGreaterThan(0);
    expect(fieldAt(model, 8, 0)[15 * 32 + 15]).toBeLessThan(0);
  });
  it('增援抵达前不显示，撤离后淡出', () => {
    const units = resolveUnits([{
      id: 'uk.reinforcement', side: 'UK', echelon: 'brigade', type: 'infantry', parent: null, name: { zh: '增援' }, active: { from: '1940-04-18T00:00' },
      track: [{ at: '1940-04-18T00:00', pos: [7.7, 62.5], status: 'active' }, { at: '1940-05-02T00:00', pos: [3, 64], status: 'evacuated' }],
      sources: ['uk_official'], confidence: 'medium',
    }], new Map());
    expect(unitStateAt('uk.reinforcement', units, isoToHours('1940-04-17T00:00'))).toBeNull();
    expect(unitStateAt('uk.reinforcement', units, isoToHours('1940-05-04T00:00'))?.fade).toBe(0);
  });
  it('海空航线尚未出发时不输出残缺的 SVG 路径', () => {
    expect(lineD([[]])).toBe('');
    expect(lineD([[[10, 20]]])).toBe('');
    expect(lineD([[], [[10, 20], [30, 40]]])).toBe('M10.0,20.0L30.0,40.0');
  });
});
