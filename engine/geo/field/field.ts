/**
 * 控制区有符号距离场（SDF）—— 纯函数，浏览器 / Worker / Node 通用。
 * 约定：网格坐标 (gx, gy)，格子 (i,j) 覆盖 [i,i+1]×[j,j+1]，格心 (i+0.5, j+0.5)；世界坐标 = 网格坐标 × cell。
 * 距离单位：格子；负值 = 区域内部。
 */
import { contours } from 'd3-contour';

import type { Grid } from '../frame';
export type { Grid };
export type GPoly = number[][][]; // [外环, 洞…]，环 = [[gx,gy],…]
export type Line = number[][];

/** 比特下标列表 → 掩码 */
export const bitsMask = (bits: readonly number[] = []) => bits.reduce((m, b) => m | (1 << b), 0);

/** 扫描线填充（每个多边形内部用奇偶规则，多边形之间取并集） */
export function rasterize(polys: GPoly[], g: Grid, out = new Uint8Array(g.w * g.h)): Uint8Array {
  const xs: number[] = [];
  for (const poly of polys) {
    let minY = Infinity, maxY = -Infinity;
    for (const ring of poly) for (const p of ring) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const j0 = Math.max(0, Math.floor(minY - 0.5)), j1 = Math.min(g.h - 1, Math.ceil(maxY - 0.5));
    for (let j = j0; j <= j1; j++) {
      const y = j + 0.5;
      xs.length = 0;
      for (const ring of poly) {
        const n = ring.length;
        for (let k = 0, m = n - 1; k < n; m = k++) {
          const a = ring[m], b = ring[k];
          if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      if (xs.length < 2) continue;
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil(xs[k] - 0.5));
        const i1 = Math.min(g.w - 1, Math.floor(xs[k + 1] - 0.5));
        const row = j * g.w;
        for (let i = i0; i <= i1; i++) out[row + i] = 1;
      }
    }
  }
  return out;
}

const INF = 1e20;
/** Felzenszwalb & Huttenlocher 1D 平方距离变换 */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dq = q - v[k];
    d[q] = dq * dq + f[v[k]];
  }
}
/** 2D 平方欧氏距离：到 seed=true 的格子 */
function edt2d(seed: (idx: number) => boolean, g: Grid): Float64Array {
  const { w, h } = g;
  const n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1);
  const v = new Int32Array(n);
  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = seed(i) ? 0 : INF;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) f[x] = grid[row + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[row + x] = d[x];
  }
  return grid;
}
/** 有符号距离场（格子单位，内部为负），截断到 ±clamp */
export function sdf(mask: Uint8Array, g: Grid, clamp: number): Float32Array {
  const out = new Float32Array(g.w * g.h);
  let any = false, all = true;
  for (let i = 0; i < mask.length; i++) { if (mask[i]) any = true; else all = false; }
  if (!any) return out.fill(clamp);
  if (all) return out.fill(-clamp);
  const toInside = edt2d((i) => mask[i] === 1, g);
  const toOutside = edt2d((i) => mask[i] === 0, g);
  for (let i = 0; i < out.length; i++) {
    const v = mask[i] ? -(Math.sqrt(toOutside[i]) - 0.5) : Math.sqrt(toInside[i]) - 0.5;
    out[i] = v > clamp ? clamp : v < -clamp ? -clamp : v;
  }
  return out;
}

export function lerpField(a: Float32Array, b: Float32Array, t: number, out: Float32Array = new Float32Array(a.length)): Float32Array {
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

/** 双线性采样（输入网格坐标） */
export function sample(f: Float32Array, g: Grid, gx: number, gy: number): number {
  const x = Math.max(0, Math.min(g.w - 1.001, gx - 0.5));
  const y = Math.max(0, Math.min(g.h - 1.001, gy - 0.5));
  const i = Math.floor(x), j = Math.floor(y);
  const fx = x - i, fy = y - j;
  const a = f[j * g.w + i], b = f[j * g.w + i + 1], c = f[(j + 1) * g.w + i], d = f[(j + 1) * g.w + i + 1];
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/** 区域轮廓（value<0 的区域）→ 网格坐标多边形 */
export function regionPolygons(f: Float32Array, g: Grid): number[][][][] {
  const neg = new Float64Array(f.length);
  for (let i = 0; i < f.length; i++) neg[i] = -f[i];
  const mp = contours().size([g.w, g.h]).thresholds([0])(neg as unknown as number[])[0];
  return mp ? (mp.coordinates as number[][][][]) : [];
}

/** Chaikin 平滑（闭合环） */
export function chaikinRing(r: number[][], iter = 1): number[][] {
  let pts = r;
  for (let it = 0; it < iter; it++) {
    const out: number[][] = [];
    const n = pts.length - (samePt(pts[0], pts[pts.length - 1]) ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(out[0]);
    pts = out;
  }
  return pts;
}
export function chaikinLine(l: number[][], iter = 1): number[][] {
  let pts = l;
  for (let it = 0; it < iter; it++) {
    if (pts.length < 3) return pts;
    const out: number[][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}
const samePt = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

/** 从区域环中截取满足条件的折线段（例如只保留位于战区内部的部分） */
export function splitRings(rings: number[][][], keep: (p: number[]) => boolean, minPts = 3): Line[] {
  const lines: Line[] = [];
  for (const ring of rings) {
    const n = ring.length;
    if (n < 3) continue;
    // 从一个「不保留」点开始遍历，避免把一条连续线切成首尾两段
    let start = 0;
    for (let i = 0; i < n; i++) if (!keep(ring[i])) { start = i; break; }
    let cur: Line = [];
    for (let k = 0; k <= n; k++) {
      const p = ring[(start + k) % n];
      if (keep(p)) cur.push(p);
      else { if (cur.length >= minPts) lines.push(cur); cur = []; }
    }
    if (cur.length >= minPts) lines.push(cur);
  }
  return lines;
}

// ---------------- 关键帧场 ----------------
/**
 * 两个占领槽：a（主攻方，优先）与 b（第二占领方 / 空战拦截）。剩余战区 = rest。
 * 配置来自 manifest.control：战区比特、延迟启用的战区（如 1941-04-06 起的南斯拉夫）、各槽本土比特、空战模式。
 */
export interface KFInput { h: number; a: GPoly[]; b: GPoly[]; transition?: 'smooth' | 'step' }
export interface FieldCfg {
  air?: boolean; // 空战：两槽均为原始区域，可重叠，不并入本土、不按战区裁切
  theatreMask: number; // 始终有效的战区比特
  deferred?: { mask: number; h: number }[]; // h 之后并入战区
  homeMasks: [number, number];
}
export interface FieldModel {
  grid: Grid;
  masks: Uint8Array;
  clamp: number;
  kfs: KFInput[];
  cfg: FieldCfg;
  theaters: { h: number; sdf: Float32Array }[]; // 按 h 升序；首项 h = -Infinity
  cache: Map<string, Float32Array>;
}

export function createModel(grid: Grid, masks: Uint8Array, kfs: KFInput[], clamp: number, cfg: FieldCfg): FieldModel {
  const steps = [{ h: -Infinity, mask: cfg.theatreMask }];
  const deferred = [...(cfg.deferred ?? [])].sort((a, b) => a.h - b.h);
  let acc = cfg.theatreMask;
  for (const d of deferred) { acc |= d.mask; steps.push({ h: d.h, mask: acc }); }
  const theaters = steps.map(({ h, mask }) => {
    const th = new Uint8Array(grid.w * grid.h);
    for (let i = 0; i < th.length; i++) th[i] = masks[i] & mask ? 1 : 0;
    return { h, sdf: sdf(th, grid, clamp) };
  });
  return { grid, masks, clamp, kfs: [...kfs].sort((a, b) => a.h - b.h), cfg, theaters, cache: new Map() };
}

export function theaterAt(m: FieldModel, h: number): Float32Array {
  let T = m.theaters[0].sdf;
  for (const t of m.theaters) if (h >= t.h) T = t.sdf;
  return T;
}

export type Slot = 0 | 1;

export function keyframeField(m: FieldModel, k: number, slot: Slot): Float32Array {
  const key = `${k}:${slot}`;
  const hit = m.cache.get(key);
  if (hit) return hit;
  const kf = m.kfs[k];
  const mask = rasterize(slot === 0 ? kf.a : kf.b, m.grid);
  const homeBits = m.cfg.homeMasks[slot];
  if (!m.cfg.air && homeBits) for (let i = 0; i < mask.length; i++) if (m.masks[i] & homeBits) mask[i] = 1;
  const f = sdf(mask, m.grid, m.clamp);
  m.cache.set(key, f);
  return f;
}

/** 时刻 h 的场（关键帧之间线性插值；step 过渡保持上一帧；首帧之前 = 首帧；末帧之后 = 末帧） */
export function fieldAt(m: FieldModel, h: number, slot: Slot, out?: Float32Array): Float32Array {
  const ks = m.kfs;
  // 直接返回缓存的关键帧场时复制到 out：调用方可能把结果 transfer 给主线程（会使缓存的 buffer 失效）
  const cached = (k: number) => { const f = keyframeField(m, k, slot); if (!out) return f; out.set(f); return out; };
  if (h <= ks[0].h) return cached(0);
  if (h >= ks[ks.length - 1].h) return cached(ks.length - 1);
  let i = 0;
  while (i < ks.length - 2 && ks[i + 1].h <= h) i++;
  if (ks[i + 1].transition === 'step') return cached(i);
  const t = (h - ks[i].h) / (ks[i + 1].h - ks[i].h);
  return lerpField(keyframeField(m, i, slot), keyframeField(m, i + 1, slot), t, out);
}

export interface FrontGeometry {
  h: number;
  air?: boolean;
  fills: { a: number[][][][]; b: number[][][][]; rest: number[][][][] }; // 世界坐标多边形
  fronts: { a: Line[]; b: Line[]; contact: Line[] }; // 世界坐标折线
}

/** 计算时刻 h 的占领区填充与战线（世界坐标） */
export function frontGeometry(m: FieldModel, h: number): FrontGeometry & { fA: Float32Array; fB: Float32Array } {
  const g = m.grid;
  const fA = fieldAt(m, h, 0, new Float32Array(g.w * g.h));
  const fB = fieldAt(m, h, 1, new Float32Array(g.w * g.h));
  const toWorld = (polys: number[][][][], smooth: number) =>
    polys.map((poly) => poly.map((ring) => chaikinRing(ring, smooth).map((p) => [p[0] * g.cell, p[1] * g.cell])));
  if (m.cfg.air) {
    const raid = toWorld(regionPolygons(fA, g), 1), intercept = toWorld(regionPolygons(fB, g), 1);
    return { h, air: true, fills: { a: raid, b: intercept, rest: [] }, fronts: { a: raid.flat(), b: intercept.flat(), contact: [] }, fA, fB };
  }
  const T = theaterAt(m, h);
  const tmp = new Float32Array(g.w * g.h);
  // 占领区 = 槽 ∩ 战区；b 让位于 a
  for (let i = 0; i < tmp.length; i++) tmp[i] = Math.max(fA[i], T[i]);
  const fillA = toWorld(regionPolygons(tmp, g), 1);
  for (let i = 0; i < tmp.length; i++) tmp[i] = Math.max(fB[i], T[i], -fA[i] + 0.25);
  const fillB = toWorld(regionPolygons(tmp, g), 1);
  // 剩余战区
  for (let i = 0; i < tmp.length; i++) tmp[i] = Math.max(T[i], -fA[i], -fB[i]);
  const fillRest = toWorld(regionPolygons(tmp, g), 1);

  // 战线：各方区域边界中位于战区内部的部分
  const inside = (p: number[]) => sample(T, g, p[0], p[1]) < -0.6;
  const lines = (f: Float32Array, other: Float32Array) => {
    const rings = regionPolygons(f, g).flat();
    const front: Line[] = [], contact: Line[] = [];
    for (const l of splitRings(rings, inside)) {
      // 再按是否与另一方接触拆分
      let cur: Line = [], curContact: boolean | null = null;
      const flush = () => { if (cur.length >= 3) (curContact ? contact : front).push(cur); };
      for (const p of l) {
        const c = sample(other, g, p[0], p[1]) < 1.6;
        if (curContact === null || c === curContact) cur.push(p);
        else { flush(); cur = [cur[cur.length - 1], p]; }
        curContact = c;
      }
      flush();
    }
    const Wl = (ls: Line[]) => ls.map((l) => chaikinLine(l, 2).map((p) => [p[0] * g.cell, p[1] * g.cell]));
    return { front: Wl(front), contact: Wl(contact) };
  };
  const a = lines(fA, fB);
  const b = lines(fB, fA);
  return {
    h,
    fills: { a: fillA, b: fillB, rest: fillRest },
    fronts: { a: a.front, b: b.front, contact: a.contact },
    fA, fB,
  };
}
