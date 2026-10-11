/** 巴尔干战役：参战方登场时序、南斯拉夫/希腊投降与撤离的区分、六个章节的事件与兵力、跨年日期。 */
import { describe, it, expect } from 'vitest';
import { unitStateAt } from '../../../engine/model/core';
import { isoToHours, hoursToDate, H_END } from '../../../engine/core/time';
import { PHASES } from '../../../engine/core/phases';
import { ISO } from '../../../engine/schema/zod';
import type { HistEvent, ForcesSummary, ControlKeyframe } from '../../../engine/core/types';
import { openCampaign } from '../../../tests/helpers';

const { def, db } = openCampaign('balkans-1941');
const files = def.data as Record<string, unknown>;
const events = files['./data/events.json'] as HistEvent[];
const forces = files['./data/forces.json'] as ForcesSummary;
const fronts = Object.keys(files).filter((k) => k.includes('/fronts/')).sort().map((k) => files[k] as ControlKeyframe);
const present = (side: string, at: string) => [...db.units.values()].some((u) => u.side === side && !!unitStateAt(u.id, db.units, isoToHours(at)));

describe('巴尔干战役时序', () => {
  it('后来的参战方不出现在开局，英联邦部队一月尚未抵达', () => {
    expect(present('IT', '1940-10-28T12:00')).toBe(true);
    expect(present('GR', '1940-10-28T12:00')).toBe(true);
    expect(present('DE', '1940-10-28T12:00')).toBe(false);
    expect(present('YU', '1940-10-28T12:00')).toBe(false);
    expect(present('AU', '1941-01-11T12:00')).toBe(false);
    expect(present('NZ', '1941-01-11T12:00')).toBe(false);
    expect(present('AU', '1941-03-28T12:00')).toBe(true);
    expect(present('NZ', '1941-03-28T12:00')).toBe(true);
  });
  it('南斯拉夫签字与生效分开，希腊西部投降与英联邦撤离分开', () => {
    const event = (id: string) => events.find((e) => e.id === id)!;
    expect(event('e.yugoslav_surrender_signed').at.slice(0, 10)).toBe('1941-04-17');
    expect(event('e.yugoslav_armistice_effective').at).toBe('1941-04-18T12:00');
    expect(event('e.greek_final_surrender').title.zh).toContain('西部希军');
    expect(present('GB', '1941-04-25T12:00')).toBe(true);
    expect(present('NZ', '1941-05-10T12:00')).toBe(true);
  });
  it('六个章节都有事件与分阶段兵力', () => {
    for (const p of PHASES) {
      expect(events.some((e) => isoToHours(e.at) >= p.from && isoToHours(e.at) < p.to), p.id).toBe(true);
      expect(Object.keys(forces.byPhase?.[p.id] ?? {}).length, p.id).toBeGreaterThan(0);
    }
    expect(fronts[0].at).toBe('1940-10-28T00:00');
    expect(fronts.at(-1)!.at).toBe('1941-06-01T23:59');
  });
});

describe('巴尔干战役日期', () => {
  it('从意军入侵希腊开始，跨越新年连续计时', () => {
    expect(isoToHours('1940-10-28T00:00')).toBe(0);
    expect(isoToHours('1941-01-01T00:00') - isoToHours('1940-12-31T23:59')).toBeCloseTo(1 / 60);
    expect(hoursToDate(isoToHours('1941-05-20T08:00')).toISOString()).toBe('1941-05-20T08:00:00.000Z');
    expect(hoursToDate(H_END).toISOString()).toBe('1941-06-01T23:59:00.000Z');
  });
  it('拒绝不存在的日期而不是顺延', () => {
    for (const at of ['1941-02-29T12:00', '1941-04-31T12:00', '1941-05-20T24:00']) {
      expect(ISO.safeParse(at).success).toBe(false);
      expect(() => isoToHours(at)).toThrow();
    }
  });
});
