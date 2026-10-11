import { describe, it, expect } from 'vitest';
import { loadAll } from '../../scripts/validate/load_node';
import { buildGazetteer, resolveUnits, unitStateAt } from '../../src/model/core';
import { isoToHours, type Side } from '../../src/schema';
import { PHASES } from '../../src/app/campaign';

const data = loadAll();
const { gaz } = buildGazetteer(...data.gazetteer.map((f) => f.items));
const units = resolveUnits(data.units.flatMap((f) => f.items), gaz);
const present = (side: Side, at: string) => [...units.values()].some((u) => u.side === side && !!unitStateAt(u.id, units, isoToHours(at)));

describe('full campaign chronology', () => {
  it('keeps later participants out of the opening and Commonwealth arrivals out of January', () => {
    expect(present('IT', '1940-10-28T12:00')).toBe(true);
    expect(present('GR', '1940-10-28T12:00')).toBe(true);
    expect(present('DE', '1940-10-28T12:00')).toBe(false);
    expect(present('YU', '1940-10-28T12:00')).toBe(false);
    expect(present('AU', '1941-01-11T12:00')).toBe(false);
    expect(present('NZ', '1941-01-11T12:00')).toBe(false);
    expect(present('AU', '1941-03-28T12:00')).toBe(true);
    expect(present('NZ', '1941-03-28T12:00')).toBe(true);
  });
  it('separates Yugoslav signature/effect and Greek regional surrender from evacuation', () => {
    const event = (id: string) => data.events.find((e) => e.id === id)!;
    expect(event('e.yugoslav_surrender_signed').at.slice(0, 10)).toBe('1941-04-17');
    expect(event('e.yugoslav_armistice_effective').at).toBe('1941-04-18T12:00');
    expect(event('e.greek_final_surrender').title.zh).toContain('西部希军');
    expect(present('GB', '1941-04-25T12:00')).toBe(true);
    expect(present('NZ', '1941-05-10T12:00')).toBe(true);
  });
  it('has event coverage and a force briefing for all six chapters', () => {
    for (const p of PHASES) {
      expect(data.events.some((e) => isoToHours(e.at) >= p.from && isoToHours(e.at) < p.to), p.id).toBe(true);
      expect(Object.keys(data.forces.byPhase[p.id]).length, p.id).toBeGreaterThan(0);
    }
    expect(data.fronts[0].item.at).toBe('1940-10-28T00:00');
    expect(data.fronts.at(-1)!.item.at).toBe('1941-06-01T23:59');
  });
});
