import { describe, it, expect } from 'vitest';
import { resolveUnits, unitStateAt } from '../../src/model/core';
import { createModel, frontGeometry, BIT } from '../../src/geo/field/field';
import type { Unit } from '../../src/schema';

describe('campaign transport and time-gated control', () => {
  it('carries sea transfer through interpolation and ends it on arrival', () => {
    const unit = { id: 'nz.transfer', side: 'NZ', echelon: 'brigade', type: 'infantry', parent: null, name: { zh: '撤离支队' }, sources: ['test'], confidence: 'medium', active: { from: '1941-04-25T00:00' }, track: [{ at: '1941-04-25T00:00', pos: [23, 37], movement: 'sea' }, { at: '1941-04-26T00:00', pos: [24, 35.3] }] } as Unit;
    const units = resolveUnits([unit], new Map());
    const start = units.get(unit.id)!.fromH;
    expect(unitStateAt(unit.id, units, start - 1)).toBeNull();
    expect(unitStateAt(unit.id, units, start + 12)?.movement).toBe('sea');
    expect(unitStateAt(unit.id, units, start + 24)?.movement).toBe('land');
  });
  it('keeps the deferred theater neutral until its activation hour', () => {
    const grid = { w: 24, h: 16, cell: 1 }, masks = new Uint8Array(24 * 16);
    for (let y = 2; y < 14; y++) for (let x = 2; x < 22; x++) masks[y * 24 + x] = BIT.LAND | (x < 12 ? BIT.PL : BIT.DZG);
    const m = createModel(grid, masks, [{ h: 0, DE: [], SU: [] }, { h: 10, DE: [], SU: [] }], 20, 5);
    const before = frontGeometry(m, 4), after = frontGeometry(m, 5);
    const maxX = (g: typeof before) => Math.max(...g.fills.PL.flat(2).map((p) => p[0]));
    expect(maxX(before)).toBeLessThan(13);
    expect(maxX(after)).toBeGreaterThan(20);
  });
});
