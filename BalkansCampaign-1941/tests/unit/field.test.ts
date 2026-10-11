import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { sdf, rasterize, createModel, frontGeometry, sample, type Grid, type KFInput } from '../../src/geo/field/field';
import { geoConicConformal } from 'd3-geo';
import { isoToHours, type LonLat } from '../../src/schema';
import { buildGazetteer, resolvePos } from '../../src/model/core';
import { YUGOSLAVIA_ACTIVE_FROM } from '../../src/app/campaign';

const ROOT = resolve(__dirname, '../..');
const read = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const frame = read('config/frame.json');
const proj = geoConicConformal().parallels(frame.projection.parallels).rotate(frame.projection.rotate).center(frame.projection.center).scale(frame.scale).translate(frame.translate);
function areaOf(polys: number[][][][]) {
  let a = 0;
  for (const poly of polys) poly.forEach((ring, k) => { let s = 0; for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]; a += (k === 0 ? 1 : -1) * Math.abs(s / 2); });
  return a * frame.kmPerUnit ** 2;
}

describe('reused SDF', () => {
  it('keeps inside/outside signs around a circular region', () => {
    const g: Grid = { w: 64, h: 64, cell: 1 }, ring: number[][] = [];
    for (let k = 0; k < 64; k++) ring.push([32 + 10 * Math.cos(k / 64 * Math.PI * 2), 32 + 10 * Math.sin(k / 64 * Math.PI * 2)]);
    const f = sdf(rasterize([[ring]], g), g, 30);
    expect(f[32 * 64 + 32]).toBeLessThan(-8); expect(f[32 * 64 + 60]).toBeGreaterThan(15);
    expect(Math.abs(f[32 * 64 + 42])).toBeLessThan(1.5);
  });
});

describe('historical Balkan control', () => {
  const buf = readFileSync(resolve(ROOT, 'public/geo/field_masks.bin'));
  const masks = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const { gaz } = buildGazetteer(...readdirSync(resolve(ROOT, 'src/data/gazetteer')).filter((f) => f.endsWith('.json')).map((f) => read('src/data/gazetteer/' + f)));
  const grid: Grid = { w: frame.field.w, h: frame.field.h, cell: frame.field.cell };
  const toG = (p: unknown) => { const [x, y] = proj(resolvePos(p as LonLat, gaz))!; return [x / grid.cell, y / grid.cell]; };
  const kfs: KFInput[] = readdirSync(resolve(ROOT, 'src/data/fronts')).filter((f) => f.endsWith('.json')).map((f) => { const k = read('src/data/fronts/' + f); return { h: isoToHours(k.at), DE: k.DE.map((p: any) => p.map((r: any) => r.map(toG))), SU: k.SU.map((p: any) => p.map((r: any) => r.map(toG))) }; });
  const model = createModel(grid, masks, kfs, 25, YUGOSLAVIA_ACTIVE_FROM);
  const at = (iso: string) => frontGeometry(model, isoToHours(iso));
  const occupied = (iso: string, ll: LonLat) => { const geom = at(iso), p = toG(ll); return sample(geom.fDE, grid, p[0], p[1]) < 0; };
  it('allows the Greek counteroffensive to shrink Axis territory', () => {
    const early = at('1940-11-04T12:00'), counter = at('1941-01-10T12:00');
    expect(areaOf(counter.fills.DE)).toBeLessThan(areaOf(early.fills.DE));
    expect(areaOf(counter.fills.SU)).toBeLessThan(50);
    expect(counter.fronts.DE.length).toBeGreaterThan(0);
  });
  it('does not occupy Crete before the airborne landings', () => {
    expect(occupied('1941-05-19T12:00', [24.0, 35.45])).toBe(false);
    expect(occupied('1941-05-20T07:59', [23.85, 35.5])).toBe(false);
    expect(occupied('1941-06-01T20:00', [24.5, 35.25])).toBe(true);
  });
  it('keeps mainland control while the Crete battle unfolds', () => {
    expect(occupied('1941-05-20T12:00', [23.72, 37.98])).toBe(true);
    expect(occupied('1941-06-01T12:00', [20.46, 44.81])).toBe(true);
  });
  it('keeps the isolated Retimo aerodrome garrison until its surrender', () => {
    expect(occupied('1941-05-29T18:00', [24.613, 35.372])).toBe(false);
    expect(occupied('1941-05-30T11:00', [24.613, 35.372])).toBe(false);
    expect(occupied('1941-05-30T12:00', [24.613, 35.372])).toBe(true);
  });
  it('computes a warmed frame fast enough for interaction', () => {
    at('1941-04-12T12:00'); const t = performance.now(); at('1941-04-12T14:00');
    expect(performance.now() - t).toBeLessThan(400);
  });
});
