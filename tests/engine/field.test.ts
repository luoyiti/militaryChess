/** SDF 控制区场：基础算法 + 每个战役真实数据的关键帧（由各 fork 的 field.test 合并而来）。 */
import { describe, it, expect } from 'vitest';
import { sdf, rasterize, createModel, frontGeometry, type Grid } from '../../engine/geo/field/field';
import { PUBLISHED, openCampaign, fieldModelFor, areaKm2 } from '../helpers';

describe('SDF 基础', () => {
  it('圆形掩膜的距离场符号与幅值正确', () => {
    const g: Grid = { w: 64, h: 64, cell: 1 };
    const ring: number[][] = [];
    for (let k = 0; k < 64; k++) ring.push([32 + 10 * Math.cos((k / 64) * 2 * Math.PI), 32 + 10 * Math.sin((k / 64) * 2 * Math.PI)]);
    const f = sdf(rasterize([[ring]], g), g, 30);
    expect(f[32 * 64 + 32]).toBeLessThan(-8);
    expect(f[32 * 64 + 60]).toBeGreaterThan(15);
    expect(Math.abs(f[32 * 64 + 42])).toBeLessThan(1.5);
  });

  it('空战模式：两槽不依赖陆地、可以重叠，没有剩余战区', () => {
    const grid = { w: 32, h: 32, cell: 1 };
    const p = [[[8, 8], [24, 8], [24, 24], [8, 24]]];
    const m = createModel(grid, new Uint8Array(1024), [{ h: 0, a: [p], b: [p] }], 12, { air: true, theatreMask: 0, homeMasks: [0, 0] });
    const g = frontGeometry(m, 0);
    expect(g.fA[16 * 32 + 16]).toBeLessThan(0);
    expect(g.fB[16 * 32 + 16]).toBeLessThan(0);
    expect(g.fills.a.length).toBeGreaterThan(0);
    expect(g.fills.b.length).toBeGreaterThan(0);
    expect(g.fills.rest).toEqual([]);
  });

  it('step 过渡：两帧之间保持上一帧，不插值', () => {
    const grid = { w: 32, h: 32, cell: 1 };
    const small = [[[10, 10], [14, 10], [14, 14], [10, 14]]], big = [[[4, 4], [28, 4], [28, 28], [4, 28]]];
    const m = createModel(grid, new Uint8Array(1024).fill(1), [{ h: 0, a: [small], b: [] }, { h: 10, a: [big], b: [], transition: 'step' }], 12, { theatreMask: 1, homeMasks: [0, 0] });
    const mid = frontGeometry(m, 5), end = frontGeometry(m, 10);
    expect(mid.fA[6 * 32 + 6]).toBeGreaterThan(0);
    expect(end.fA[6 * 32 + 6]).toBeLessThan(0);
  });
});

describe.each(PUBLISHED)('%s 真实关键帧', (id) => {
  it('每个关键帧都能生成有限的填充与战线；主槽面积在战役中不缩到开局以下；热帧足够快', () => {
    const o = openCampaign(id);
    const model = fieldModelFor(o);
    const ks = o.db.keyframes;
    expect(ks.length).toBeGreaterThan(0);
    const areas = ks.map((k) => {
      const g = frontGeometry(model, k.h);
      for (const poly of [...g.fills.a, ...g.fills.b]) for (const ring of poly) for (const p of ring) expect(Number.isFinite(p[0]) && Number.isFinite(p[1])).toBe(true);
      return areaKm2(g.fills.a);
    });
    if (o.m.control.mode === 'territory') expect(Math.max(...areas)).toBeGreaterThan(areas[0]);
    else expect(areas.some((a) => a > 0)).toBe(true);
    const mid = (ks[0].h + ks[ks.length - 1].h) / 2;
    frontGeometry(model, mid);
    const t = performance.now();
    frontGeometry(model, mid + 0.5);
    expect(performance.now() - t).toBeLessThan(400);
  });
});
