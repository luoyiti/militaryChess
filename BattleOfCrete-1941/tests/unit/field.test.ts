import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { sdf, rasterize, createModel, frontGeometry, type Grid, type KFInput } from '../../src/geo/field/field';
import { geoConicConformal } from 'd3-geo';
import { isoToHours, type LonLat } from '../../src/schema';
import { buildGazetteer, resolvePos } from '../../src/model/core';

const ROOT = resolve(__dirname, '../..');
const frame = JSON.parse(readFileSync(resolve(ROOT, 'config/frame.json'), 'utf8'));
const proj = geoConicConformal().parallels(frame.projection.parallels).rotate(frame.projection.rotate).center(frame.projection.center).scale(frame.scale).translate(frame.translate);

function areaOf(polys: number[][][][]) {
  let a = 0;
  for (const poly of polys) poly.forEach((ring, k) => {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a += (k === 0 ? 1 : -1) * Math.abs(s / 2);
  });
  return a * frame.kmPerUnit ** 2; // km²
}

describe('SDF 基础', () => {
  it('圆形掩膜的距离场符号与幅值正确', () => {
    const g: Grid = { w: 64, h: 64, cell: 1 };
    const ring: number[][] = [];
    for (let k = 0; k < 64; k++) ring.push([32 + 10 * Math.cos((k / 64) * 2 * Math.PI), 32 + 10 * Math.sin((k / 64) * 2 * Math.PI)]);
    const m = rasterize([[ring]], g);
    const f = sdf(m, g, 30);
    expect(f[32 * 64 + 32]).toBeLessThan(-8);
    expect(f[32 * 64 + 60]).toBeGreaterThan(15);
    expect(Math.abs(f[32 * 64 + 42])).toBeLessThan(1.5);
  });
});

describe('真实数据战线', () => {
  const masksBuf = readFileSync(resolve(ROOT, 'public/geo/field_masks.bin'));
  const masks = new Uint8Array(masksBuf.buffer, masksBuf.byteOffset, masksBuf.byteLength);
  const gazLists = readdirSync(resolve(ROOT, 'src/data/gazetteer')).map((f) => JSON.parse(readFileSync(resolve(ROOT, 'src/data/gazetteer', f), 'utf8')));
  const { gaz } = buildGazetteer(...gazLists);
  const grid: Grid = { w: frame.field.w, h: frame.field.h, cell: frame.field.cell };
  const toG = (p: unknown) => { const [x, y] = proj(resolvePos(p as LonLat, gaz))!; return [x / grid.cell, y / grid.cell]; };
  const kfs: KFInput[] = readdirSync(resolve(ROOT, 'src/data/fronts')).map((f) => {
    const k = JSON.parse(readFileSync(resolve(ROOT, 'src/data/fronts', f), 'utf8'));
    return { h: isoToHours(k.at), DE: k.DE.map((p: any) => p.map((r: any) => r.map(toG))), SU: k.SU.map((p: any) => p.map((r: any) => r.map(toG))) };
  });
  const model = createModel(grid, masks, kfs, 25);

  it('德占面积随时间扩大，第二占领槽保持为空，单帧计算足够快', () => {
    const t0 = performance.now();
    const g1 = frontGeometry(model, isoToHours('1941-05-20T07:59'));
    const g2 = frontGeometry(model, isoToHours('1941-05-24T12:00'));
    const g3 = frontGeometry(model, isoToHours('1941-06-01T12:00'));
    const t1 = performance.now();
    const warm = performance.now();
    frontGeometry(model, isoToHours('1941-05-24T18:00'));
    const perFrame = performance.now() - warm;
    const a1 = areaOf(g1.fills.DE), a2 = areaOf(g2.fills.DE);
    console.log('德占 km²', a1.toFixed(0), a2.toFixed(0), '6/1', areaOf(g3.fills.DE).toFixed(0),
      '空槽', areaOf(g3.fills.SU).toFixed(0), '盟军残余 5/24', areaOf(g2.fills.PL).toFixed(0),
      '战线段', g2.fronts.DE.length, '冷启动 ms', (t1 - t0).toFixed(0), '热帧 ms', perFrame.toFixed(1));
    expect(a1).toBeLessThan(1);
    expect(a2).toBeGreaterThan(a1);
    expect(areaOf(g3.fills.DE)).toBeGreaterThan(a2);
    expect(areaOf(g1.fills.SU)).toBeLessThan(50);
    expect(areaOf(g3.fills.SU)).toBeLessThan(1);
    expect(areaOf(g3.fills.DE)).toBeLessThan(9000);
    expect(g2.fronts.DE.length).toBeGreaterThan(0);
    expect(perFrame).toBeLessThan(400);
  });
});
