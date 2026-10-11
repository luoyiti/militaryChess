/** 移动方式与延迟战区：海运插值到抵达为止；延迟启用的战区在启用时刻之前保持中立（巴尔干：南斯拉夫）。 */
import { describe, it, expect } from 'vitest';
import { initTime } from '../../engine/core/time';
import { resolveUnits, unitStateAt } from '../../engine/model/core';
import { createModel, frontGeometry, bitsMask } from '../../engine/geo/field/field';
import type { Unit } from '../../engine/core/types';

describe('移动与延迟战区', () => {
  it('海运航段在插值期间保持 sea，抵达后结束', () => {
    initTime({ epoch: '1940-10-28T00:00', start: '1940-10-28T00:00', end: '1941-06-01T23:59' });
    const unit: Unit = { id: 'nz.transfer', side: 'NZ', echelon: 'brigade', type: 'infantry', parent: null, name: { zh: '撤离支队' }, sources: ['test'], confidence: 'medium', active: { from: '1941-04-25T00:00' },
      track: [{ at: '1941-04-25T00:00', pos: [23, 37], movement: 'sea' }, { at: '1941-04-26T00:00', pos: [24, 35.3] }] };
    const units = resolveUnits([unit], new Map());
    const start = units.get(unit.id)!.fromH;
    expect(unitStateAt(unit.id, units, start - 1)).toBeNull();
    expect(unitStateAt(unit.id, units, start + 12)?.movement).toBe('sea');
    expect(unitStateAt(unit.id, units, start + 24)?.movement).toBe('land');
  });
  it('延迟战区在启用时刻之前不计入剩余战区', () => {
    const LAND = 4, A = 0, B = 5;
    const grid = { w: 24, h: 16, cell: 1 }, masks = new Uint8Array(24 * 16);
    for (let y = 2; y < 14; y++) for (let x = 2; x < 22; x++) masks[y * 24 + x] = (1 << LAND) | (x < 12 ? 1 << A : 1 << B);
    const m = createModel(grid, masks, [{ h: 0, a: [], b: [] }, { h: 10, a: [], b: [] }], 20, { theatreMask: bitsMask([A]), deferred: [{ mask: bitsMask([B]), h: 5 }], homeMasks: [0, 0] });
    const maxX = (h: number) => Math.max(...frontGeometry(m, h).fills.rest.flat(2).map((p) => p[0]));
    expect(maxX(4)).toBeLessThan(13);
    expect(maxX(5)).toBeGreaterThan(20);
  });
});
