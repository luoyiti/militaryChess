import { it, expect } from 'vitest';
import { eventZoom } from '../../src/app/cameraZoom';
import events from '../../src/data/events.json';
it('all authored fractional event zooms produce finite camera scales', () => {
  for (const e of events) { expect(Number.isFinite(eventZoom(e.zoom))).toBe(true); expect(eventZoom(e.zoom)).toBeGreaterThanOrEqual(1); }
  expect(eventZoom(3.2)).toBeCloseTo(2.04);
  expect(eventZoom(NaN)).toBe(1.9);
});
