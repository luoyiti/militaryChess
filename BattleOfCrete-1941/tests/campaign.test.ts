import { describe, expect, it } from 'vitest';
import { loadAll } from '../scripts/validate/load_node';
import { buildGazetteer, pointInMulti, resolvePos } from '../src/model/core';
import { Unit, Route, HistEvent, ControlKeyframe, H_END, isoToHours, type LonLat, type Pos } from '../src/schema';

const data = loadAll();
const units = data.units.flatMap(g => g.items).map(u => Unit.parse(u));
const routes = data.routes.map(r => Route.parse(r));
const events = data.events.map(e => HistEvent.parse(e));
const fronts = data.fronts.map(f => ControlKeyframe.parse(f.item)).sort((a,b) => a.at.localeCompare(b.at));
const { gaz } = buildGazetteer(...data.gazetteer.map(g => g.items));
const pos = (p: Pos) => resolvePos(p, gaz);
const frame = (at: string) => fronts.filter(f => f.at <= at).at(-1)!;
const occupied = (at: string, place: string) => pointInMulti(pos(`@${place}`), frame(at).DE.map(poly => poly.map(r => r.map(pos))) as LonLat[][][]);

describe('Crete historical campaign', () => {
  it('covers the complete battle without inherited French campaign objects', () => {
    expect(isoToHours('1941-05-20T00:00')).toBe(0);
    expect(H_END).toBeCloseTo(312 - 1/60);
    expect(fronts[0].at).toBe('1941-05-20T00:00');
    expect(fronts.at(-1)!.at).toBe('1941-06-01T23:59');
    expect(new Set(units.map(u => u.side))).toEqual(new Set(['DE','GB','GR','NZ','AU','IT']));
    for (const u of units) for (const p of u.track) expect(isoToHours(p.at)).toBeGreaterThanOrEqual(0);
    for (const e of events) expect(isoToHours(e.at)).toBeLessThanOrEqual(H_END);
    expect(fronts.every(f => f.SU.length === 0)).toBe(true);
  });
  it('separates the four airborne objectives and delayed mountain airlift', () => {
    const assault = routes.filter(r => ['r.cr_air_maleme','r.cr_air_chania','r.cr_air_retimo','r.cr_air_heraklion'].includes(r.id));
    expect(assault).toHaveLength(4);
    expect(assault.every(r => r.movement === 'air')).toBe(true);
    expect(new Set(assault.map(r => JSON.stringify(r.waypoints.at(-1)!.pos))).size).toBe(4);
    expect(routes.find(r => r.id === 'r.cr_air_mountain')!.waypoints[0].at).toMatch(/^1941-05-21/);
    expect(events.find(e => e.id === 'e.cr_retimo_drop')!.at > events.find(e => e.id === 'e.cr_merkur')!.at).toBe(true);
  });
  it('does not give the Axis the three airfields before their historical outcomes', () => {
    expect(fronts[0].DE).toHaveLength(0);
    expect(occupied('1941-05-20T23:59','cr_maleme_airfield')).toBe(false);
    expect(occupied('1941-05-21T23:59','cr_maleme_airfield')).toBe(true);
    expect(occupied('1941-05-28T23:59','cr_heraklion_airfield')).toBe(false);
    expect(occupied('1941-05-29T23:59','cr_heraklion_airfield')).toBe(true);
    expect(occupied('1941-05-30T11:59','cr_retimo_airfield')).toBe(false);
    expect(occupied('1941-05-30T12:00','cr_retimo_airfield')).toBe(true);
  });
  it('keeps Sfakia available through final evacuation and avoids sea routes across the island', () => {
    expect(occupied('1941-05-31T23:59','cr_sfakia')).toBe(false);
    expect(occupied('1941-06-01T23:59','cr_sfakia')).toBe(true);
    const sea = routes.find(r => r.id === 'r.cr_heraklion_evacuation')!;
    expect(sea.movement).toBe('sea');
    expect(sea.waypoints.slice(1).every(w => pos(w.pos)[0] >= 26.48)).toBe(true);
    expect(routes.find(r => r.id === 'r.cr_south_pursuit')!.unit).toBe('de.100mountain_crete');
  });
  it('keeps Greek defenders distinct from evacuated Commonwealth units', () => {
    const greek = units.filter(u => u.side === 'GR' && u.track.length);
    expect(greek.length).toBeGreaterThanOrEqual(3);
    expect(greek.every(u => u.track.at(-1)!.status === 'surrendered')).toBe(true);
    expect(units.find(u => u.id === 'au.retimo_crete')!.track.at(-1)!.at).toMatch(/^1941-05-30/);
    expect(units.find(u => u.id === 'it.sitia_crete')!.active!.from).toMatch(/^1941-05-27/);
  });
  it('has resolvable references and ordered chronology', () => {
    const ids = new Set(units.map(u => u.id));
    const sources = new Set(data.sources.map(s => s.id));
    for (const item of [...units, ...routes, ...events, ...fronts]) {
      expect(item.sources.length).toBeGreaterThan(0);
      expect(item.sources.every(s => sources.has(s))).toBe(true);
    }
    for (const r of routes) {
      expect(ids.has(r.unit)).toBe(true);
      r.waypoints.forEach(w => expect(pos(w.pos)).toHaveLength(2));
    }
    for (const e of events) expect((e.units ?? []).every(id => ids.has(id))).toBe(true);
    expect(events.map(e => e.at)).toEqual(events.map(e => e.at).sort());
  });
});
