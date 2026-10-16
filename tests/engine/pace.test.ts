/** 变速播放（manifest.time.pace）：分段速度、播放秒数换算往返一致、时间轴按播放时长展开；未设置时与线性时间轴一致。 */
import { describe, it, expect } from 'vitest';
import { initTime, isoToHours, paceAt, playSec, tAtPlaySec, timeToU, uToTime, hasPace, PLAY_TOTAL, T_START, T_END } from '../../engine/core/time';

describe('变速播放', () => {
  it('未设置 pace 时时间轴线性，速度为 hoursPerSec', () => {
    initTime({ epoch: '1940-07-10T00:00', start: '1940-07-10T00:00', end: '1940-07-20T00:00', hoursPerSec: 6 });
    expect(hasPace()).toBe(false);
    expect(paceAt(100)).toBe(6);
    expect(timeToU(120)).toBeCloseTo(0.5);
    expect(uToTime(0.25)).toBeCloseTo(60);
    expect(PLAY_TOTAL).toBeCloseTo(240 / 6);
  });

  it('分段速度：慢速时段在时间轴上占据与播放时长成比例的宽度', () => {
    initTime({
      epoch: '1939-12-12T00:00', start: '1939-12-12T00:00', end: '1939-12-14T00:00', hoursPerSec: 10,
      pace: [{ from: '1939-12-13T06:00', hoursPerSec: 0.05 }, { from: '1939-12-13T08:00', hoursPerSec: 4 }],
    });
    const h6 = isoToHours('1939-12-13T06:00'), h8 = isoToHours('1939-12-13T08:00');
    expect(hasPace()).toBe(true);
    expect(paceAt(h6 - 0.1)).toBe(10);
    expect(paceAt(h6 + 0.5)).toBe(0.05);
    expect(paceAt(h8 + 1)).toBe(4);
    // 30 h @10 + 2 h @0.05 + 16 h @4 = 3 + 40 + 4 = 47 秒
    expect(PLAY_TOTAL).toBeCloseTo(47);
    expect(playSec(h6)).toBeCloseTo(3);
    expect(playSec(h8)).toBeCloseTo(43);
    // 两小时的交火占时间轴 40/47
    expect(timeToU(h8) - timeToU(h6)).toBeCloseTo(40 / 47);
    for (const t of [0, 7.3, h6 + 0.77, h8 + 5, T_END]) {
      expect(tAtPlaySec(playSec(t))).toBeCloseTo(t);
      expect(uToTime(timeToU(t))).toBeCloseTo(t);
    }
    expect(timeToU(T_START)).toBe(0);
    expect(timeToU(T_END)).toBe(1);
  });

  it('早于 start 的 pace 条目决定第一段速度', () => {
    initTime({ epoch: '1939-12-01T00:00', start: '1939-12-02T00:00', end: '1939-12-03T00:00', hoursPerSec: 10, pace: [{ from: '1939-12-01T00:00', hoursPerSec: 2 }] });
    expect(paceAt(T_START + 1)).toBe(2);
    expect(PLAY_TOTAL).toBeCloseTo(12);
  });
});
