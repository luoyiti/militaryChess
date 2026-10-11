import { describe, it, expect } from 'vitest';
import { ISO, isoToHours, hoursToDate, H_END } from '../../src/schema';

describe('Balkans campaign dates', () => {
  it('begins at the invasion of Greece and advances across New Year', () => {
    expect(isoToHours('1940-10-28T00:00')).toBe(0);
    expect(isoToHours('1941-01-01T00:00') - isoToHours('1940-12-31T23:59')).toBeCloseTo(1 / 60);
    expect(hoursToDate(isoToHours('1941-05-20T08:00')).toISOString()).toBe('1941-05-20T08:00:00.000Z');
    expect(hoursToDate(H_END).toISOString()).toBe('1941-06-01T23:59:00.000Z');
  });
  it('rejects impossible calendar dates instead of normalizing them', () => {
    for (const at of ['1941-02-29T12:00', '1941-04-31T12:00', '1941-05-20T24:00']) {
      expect(ISO.safeParse(at).success).toBe(false);
      expect(() => isoToHours(at)).toThrow();
    }
  });
});
