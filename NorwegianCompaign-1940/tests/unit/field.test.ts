import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { sdf, rasterize, createModel, frontGeometry, fieldAt, sample, type Grid, type KFInput } from '../../src/geo/field/field';
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
    return { h: isoToHours(k.at), DE: k.DE.map((p: any) => p.map((r: any) => r.map(toG))), transition: k.transition, AL: k.AL.map((p: any) => p.map((r: any) => r.map(toG))) };
  });
  const model = createModel(grid, masks, kfs, 25);

  it('纳尔维克城区在5月28日从德军据点转为盟军据点', () => {
    const xy = toG('@narvik');
    expect(sample(fieldAt(model, isoToHours('1940-05-27T12:00'), 'DE'), grid, xy[0], xy[1])).toBeLessThan(0);
    expect(sample(fieldAt(model, isoToHours('1940-05-27T12:00'), 'AL'), grid, xy[0], xy[1])).toBeGreaterThan(0);
    expect(sample(fieldAt(model, isoToHours('1940-05-28T12:00'), 'DE'), grid, xy[0], xy[1])).toBeGreaterThan(0);
    expect(sample(fieldAt(model, isoToHours('1940-05-28T12:00'), 'AL'), grid, xy[0], xy[1])).toBeLessThan(0);
  });

  it('中部陆路接通、初始无盟军登陆区、5月北部据点与热帧性能', () => {
    const t0 = performance.now();
    const g1 = frontGeometry(model, isoToHours('1940-04-09T14:00'));
    const g2 = frontGeometry(model, isoToHours('1940-04-30T12:00'));
    const g3 = frontGeometry(model, isoToHours('1940-05-28T12:00'));
    const t1 = performance.now();
    const warm = performance.now();
    frontGeometry(model, isoToHours('1940-05-28T18:00'));
    const perFrame = performance.now() - warm;
    const a1 = areaOf(g1.fills.DE), a2 = areaOf(g2.fills.DE);
    console.log('德占 km²', a1.toFixed(0), a2.toFixed(0), '苏占 9/24', areaOf(g3.fills.AL).toFixed(0), '波兰残余 9/14', areaOf(g2.fills.NO).toFixed(0),
      '战线段', g2.fronts.DE.length, '冷启动 ms', (t1 - t0).toFixed(0), '热帧 ms', perFrame.toFixed(1));
    expect(a2).toBeGreaterThan(a1);
    expect(areaOf(g1.fills.AL)).toBeLessThan(50);
    expect(areaOf(g3.fills.AL)).toBeGreaterThan(100);
    expect(g2.fronts.DE.length).toBeGreaterThan(0);
    expect(perFrame).toBeLessThan(250);
  });
});
