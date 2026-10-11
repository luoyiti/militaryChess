/** 克里特岛战役：史实约束（空降目标、机场易手时刻、斯法基亚撤离、希腊守军结局）与数据引用完整性。 */
import { describe, expect, it } from 'vitest';
import { buildGazetteer, pointInMulti, resolvePos } from '../../../engine/model/core';
import { isoToHours, H_END } from '../../../engine/core/time';
import type { Unit, Route, HistEvent, ControlKeyframe, Place, Source, LonLat, Pos } from '../../../engine/core/types';
import { openCampaign } from '../../../tests/helpers';

const { def } = openCampaign('crete-1941');
const files = def.data as Record<string, unknown>;
const of = <T>(re: RegExp) => Object.keys(files).filter((k) => re.test(k)).sort().flatMap((k) => (Array.isArray(files[k]) ? (files[k] as T[]) : [files[k] as T]));
const units = of<Unit>(/\/oob\//), routes = of<Route>(/\/routes\//), sources = of<Source>(/\/sources\//);
const events = files['./data/events.json'] as HistEvent[];
const fronts = of<ControlKeyframe>(/\/fronts\//).sort((a, b) => a.at.localeCompare(b.at));
const { gaz } = buildGazetteer(...Object.keys(files).filter((k) => k.includes('/gazetteer/')).map((k) => files[k] as Place[]));
const pos = (p: Pos) => resolvePos(p, gaz);
const frame = (at: string) => fronts.filter((f) => f.at <= at).at(-1)!;
const occupied = (at: string, place: string) => pointInMulti(pos(`@${place}`), (frame(at).control.DE ?? []).map((poly) => poly.map((r) => r.map(pos))) as LonLat[][][]);

describe('克里特岛战役', () => {
  it('覆盖整场战役，没有法国战役遗留的对象', () => {
    expect(isoToHours('1941-05-20T00:00')).toBe(0);
    expect(H_END).toBeCloseTo(312 - 1 / 60);
    expect(fronts[0].at).toBe('1941-05-20T00:00');
    expect(fronts.at(-1)!.at).toBe('1941-06-01T23:59');
    expect(new Set(units.map((u) => u.side))).toEqual(new Set(['DE', 'GB', 'GR', 'NZ', 'AU', 'IT']));
    for (const u of units) for (const p of u.track) expect(isoToHours(p.at)).toBeGreaterThanOrEqual(0);
    for (const e of events) expect(isoToHours(e.at)).toBeLessThanOrEqual(H_END);
    expect(fronts.every((f) => !f.control.SU?.length)).toBe(true);
  });
  it('四个空降目标分开，山地师空运推迟到次日', () => {
    const assault = routes.filter((r) => ['r.cr_air_maleme', 'r.cr_air_chania', 'r.cr_air_retimo', 'r.cr_air_heraklion'].includes(r.id));
    expect(assault).toHaveLength(4);
    expect(assault.every((r) => r.movement === 'air')).toBe(true);
    expect(new Set(assault.map((r) => JSON.stringify(r.waypoints.at(-1)!.pos))).size).toBe(4);
    expect(routes.find((r) => r.id === 'r.cr_air_mountain')!.waypoints[0].at).toMatch(/^1941-05-21/);
    expect(events.find((e) => e.id === 'e.cr_retimo_drop')!.at > events.find((e) => e.id === 'e.cr_merkur')!.at).toBe(true);
  });
  it('三座机场在史实结局之前不归轴心国', () => {
    expect(fronts[0].control.DE ?? []).toHaveLength(0);
    expect(occupied('1941-05-20T23:59', 'cr_maleme_airfield')).toBe(false);
    expect(occupied('1941-05-21T23:59', 'cr_maleme_airfield')).toBe(true);
    expect(occupied('1941-05-28T23:59', 'cr_heraklion_airfield')).toBe(false);
    expect(occupied('1941-05-29T23:59', 'cr_heraklion_airfield')).toBe(true);
    expect(occupied('1941-05-30T11:59', 'cr_retimo_airfield')).toBe(false);
    expect(occupied('1941-05-30T12:00', 'cr_retimo_airfield')).toBe(true);
  });
  it('斯法基亚坚持到最后撤离，海上撤离航线不穿越岛屿', () => {
    expect(occupied('1941-05-31T23:59', 'cr_sfakia')).toBe(false);
    expect(occupied('1941-06-01T23:59', 'cr_sfakia')).toBe(true);
    const sea = routes.find((r) => r.id === 'r.cr_heraklion_evacuation')!;
    expect(sea.movement).toBe('sea');
    expect(sea.waypoints.slice(1).every((w) => pos(w.pos)[0] >= 26.48)).toBe(true);
    expect(routes.find((r) => r.id === 'r.cr_south_pursuit')!.unit).toBe('de.100mountain_crete');
  });
  it('希腊守军与撤离的英联邦部队结局不同', () => {
    const greek = units.filter((u) => u.side === 'GR' && u.track.length);
    expect(greek.length).toBeGreaterThanOrEqual(3);
    expect(greek.every((u) => u.track.at(-1)!.status === 'surrendered')).toBe(true);
    expect(units.find((u) => u.id === 'au.retimo_crete')!.track.at(-1)!.at).toMatch(/^1941-05-30/);
    expect(units.find((u) => u.id === 'it.sitia_crete')!.active!.from).toMatch(/^1941-05-27/);
  });
  it('引用可解析、事件按时间排序、运镜缩放有限', () => {
    const ids = new Set(units.map((u) => u.id));
    const sourceIds = new Set(sources.map((s) => s.id));
    for (const item of [...units, ...routes, ...events, ...fronts]) expect(item.sources.every((s) => sourceIds.has(s))).toBe(true);
    for (const r of routes) { expect(ids.has(r.unit)).toBe(true); r.waypoints.forEach((w) => expect(pos(w.pos)).toHaveLength(2)); }
    for (const e of events) expect((e.units ?? []).every((id) => ids.has(id))).toBe(true);
    expect(events.map((e) => e.at)).toEqual(events.map((e) => e.at).sort());
    for (const e of events) if (e.zoomRel !== undefined) { expect(Number.isFinite(e.zoomRel)).toBe(true); expect(e.zoomRel).toBeGreaterThanOrEqual(1); }
  });
});
