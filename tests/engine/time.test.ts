/** 时间与轨迹插值：任意纪元的 ISO → 小时、日历校验、飞行阶段线性插值、驻场保持、空战航线淡出。 */
import { describe, it, expect } from 'vitest';
import { initTime, isoToHours, hoursToIso } from '../../engine/core/time';
import { isCalendarIso } from '../../engine/schema/zod';
import { resolveUnits, trackAt, buildGazetteer, routeOpacity, type RRoute } from '../../engine/model/core';
import type { Unit } from '../../engine/core/types';

describe('战役时间', () => {
  it('以 manifest.time.epoch 为零点，往返转换一致', () => {
    initTime({ epoch: '1940-07-10T00:00', start: '1940-07-10T00:00', end: '1940-10-31T23:59' });
    expect(isoToHours('1940-07-10T00:00')).toBe(0);
    expect(isoToHours('1940-07-11T00:00')).toBe(24);
    expect(hoursToIso(isoToHours('1940-09-15T11:30'))).toBe('1940-09-15T11:30');
  });
  it('拒绝不存在的日历日期', () => {
    expect(isCalendarIso('1940-07-10T00:00')).toBe(true);
    expect(isCalendarIso('1940-07-32T00:00')).toBe(false);
    expect(isCalendarIso('1941-02-29T12:00')).toBe(false);
    expect(isCalendarIso('1940-02-29T12:00')).toBe(true);
    expect(isCalendarIso('1940-07-10 00:00')).toBe(false);
  });
});

describe('空战轨迹', () => {
  it('飞行阶段的航点线性插值，飞机与航线位置一致', () => {
    initTime({ epoch: '1940-07-10T00:00', start: '1940-07-10T00:00', end: '1940-10-31T23:59' });
    const u: Unit = { id: 'gb.19sq', side: 'GB', echelon: 'squadron', type: 'fighter', parent: null, name: { zh: '第19中队', short: '19 Sq' }, model: 'spitfire', sources: ['raf'], confidence: 'medium',
      track: [{ at: '1940-07-10T12:00', pos: [0, 51], flightPhase: 'outbound', altitudeM: 3000 }, { at: '1940-07-10T13:00', pos: [2, 51], flightPhase: 'returning', altitudeM: 3000 }] };
    const s = trackAt(resolveUnits([u], buildGazetteer().gaz).get('gb.19sq')!.track, 12.25)!;
    expect(s.ll[0]).toBeCloseTo(0.5);
    expect(s.flightPhase).toBe('outbound');
    expect(s.altitudeM).toBe(3000);
  });
  it('两个驻场节点之间保持基地位置，调防不产生跨日飞行', () => {
    const s = trackAt([{ h: 0, ll: [0, 51], status: 'active', flightPhase: 'at_base', altitudeM: 0 }, { h: 72, ll: [1, 52], status: 'active', flightPhase: 'at_base', altitudeM: 0 }] as never, 36)!;
    expect(s.ll).toEqual([0, 51]);
    expect(s.moving).toBe(false);
  });
  it('空战任务结束后按 fadeHours 迅速淡出', () => {
    const r = { wps: [{ h: 12, ll: [0, 51] }, { h: 13, ll: [1, 51] }], role: 'raid', fadeHours: 0.25 } as unknown as RRoute;
    expect(routeOpacity(r, 11)).toBe(0);
    expect(routeOpacity(r, 12.5)).toBe(1);
    expect(routeOpacity(r, 13.125)).toBeCloseTo(0.5);
    expect(routeOpacity(r, 14)).toBe(0);
  });
});
