import { describe, it, expect } from 'vitest';
import { clampViewport, coverageScale, visibleWorld } from '../../src/map2d/coverage';

const bounds = [-8192, -4019, 16384, 12057] as const;
describe('continuous geographic coverage', () => {
  for (const size of [{ width: 1024, height: 551 }, { width: 1600, height: 950 }, { width: 3440, height: 1440 }, { width: 390, height: 844 }]) {
    it(`covers all four edges at ${size.width}×${size.height}, even after zooming out and dragging far away`, () => {
      for (const view of [{ k: .0001, x: 0, y: 0 }, { k: .25, x: -200000, y: 300000 }, { k: 1.2, x: 200000, y: -300000 }]) {
        const v = clampViewport(view, size, bounds);
        const [x0, y0, x1, y1] = visibleWorld(v, size);
        expect(x0).toBeGreaterThanOrEqual(bounds[0] - 1e-6);
        expect(y0).toBeGreaterThanOrEqual(bounds[1] - 1e-6);
        expect(x1).toBeLessThanOrEqual(bounds[2] + 1e-6);
        expect(y1).toBeLessThanOrEqual(bounds[3] + 1e-6);
        expect(v.k).toBeGreaterThanOrEqual(coverageScale(size, bounds));
      }
    });
  }
  it('preserves a valid camera instead of shifting its geography', () => {
    const size = { width: 1200, height: 800 }, v = { k: .25, x: -600, y: -200 };
    expect(clampViewport(v, size, bounds)).toEqual(v);
  });
});
