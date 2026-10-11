import { describe, it, expect } from 'vitest';
import { ISO, SIDES, isoToHours, hoursToDate, Route } from '../../src/schema';
import { createModel, fieldAt, type KFInput } from '../../src/geo/field/field';
import { resolveUnits, unitStateAt } from '../../src/model/core';

describe('Norwegian campaign contract', () => {
  it('uses the complete 1940 campaign calendar and rejects impossible dates', () => {
    expect(isoToHours('1940-04-09T00:00')).toBe(0);
    expect(isoToHours('1940-06-10T00:00')).toBe(62 * 24);
    expect(hoursToDate(62 * 24).toISOString().slice(0, 10)).toBe('1940-06-10');
    expect(ISO.safeParse('1940-04-31T12:00').success).toBe(false);
    expect(ISO.safeParse('1940-04-09T24:01').success).toBe(false);
    expect(SIDES).toEqual(['DE', 'NO', 'UK', 'FR', 'PL']);
  });
  it('supports explicitly schematic naval movement', () => {
    const r = Route.safeParse({ id: 'r.test', side: 'UK', unit: 'uk.warspite', style: 'main', kind: 'naval', widthKm: 5,
      waypoints: [{ at: '1940-04-13T00:00', pos: [15, 68] }, { at: '1940-04-13T12:00', pos: [17, 68.4] }],
      sources: ['uk_official'], confidence: 'medium', schematic: true });
    expect(r.success).toBe(true);
  });
  it('does not grow an invasion control pocket before its landing date', () => {
    const grid = { w: 32, h: 32, cell: 1 };
    const kfs = [
      { h: 0, DE: [], AL: [] },
      { h: 8, DE: [[[[10, 10], [20, 10], [20, 20], [10, 20]]]], AL: [], transition: 'step' },
    ] as unknown as KFInput[];
    const m = createModel(grid, new Uint8Array(1024).fill(17), kfs, 12);
    expect(fieldAt(m, 7.999, 'DE')[15 * 32 + 15]).toBeGreaterThan(0);
    expect(fieldAt(m, 8, 'DE')[15 * 32 + 15]).toBeLessThan(0);
  });
  it('hides not-yet-arrived reinforcements and fades evacuated units', () => {
    const units = resolveUnits([{
      id: 'uk.reinforcement', side: 'UK', echelon: 'brigade', type: 'infantry', parent: null,
      name: { zh: '增援' }, active: { from: '1940-04-18T00:00' },
      track: [{ at: '1940-04-18T00:00', pos: [7.7, 62.5], status: 'active' },
        { at: '1940-05-02T00:00', pos: [3, 64], status: 'evacuated' }], sources: ['uk_official'], confidence: 'medium',
    }] as any, new Map());
    expect(unitStateAt('uk.reinforcement', units, isoToHours('1940-04-17T00:00'))).toBeNull();
    expect(unitStateAt('uk.reinforcement', units, isoToHours('1940-05-04T00:00'))?.fade).toBe(0);
  });
});
