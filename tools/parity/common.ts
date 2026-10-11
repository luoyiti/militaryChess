/** Shared helpers for legacy/new parity dumps. Pure, dependency-free. */
import { createHash } from 'node:crypto';

export const isoFromMs = (ms: number) => new Date(Math.round(ms / 60_000) * 60_000).toISOString().slice(0, 16);

/** Keyframe times + `n` evenly spaced minutes across [from, to]. Sorted, unique. */
export function sampleIsos(kfIsos: string[], from: string, to: string, n: number): string[] {
  const a = Date.parse(from + ':00Z'), b = Date.parse(to + ':00Z');
  const set = new Set(kfIsos);
  for (let i = 0; i <= n; i++) set.add(isoFromMs(a + ((b - a) * i) / n));
  return [...set].sort();
}

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

export function roundState(s: { ll: number[]; status: string; heading: number; moving: boolean; fade: number; movement?: string }) {
  return [r6(s.ll[0]), r6(s.ll[1]), s.status, r4(s.heading), s.moving ? 1 : 0, r4(s.fade), s.movement ?? null];
}

type Polys = number[][][][];
type Lines = number[][][];
function polyArea(polys: Polys): number {
  let a = 0;
  for (const poly of polys) poly.forEach((ring, k) => {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a += (k === 0 ? 1 : -1) * Math.abs(s / 2);
  });
  return Math.round(a);
}
const hash = (v: unknown) => createHash('sha1').update(JSON.stringify(v, (_k, x) => (typeof x === 'number' ? Math.round(x * 100) / 100 : x))).digest('hex').slice(0, 16);

export function summarizeGeometry(g: { fillA: Polys; fillB: Polys; fillRest: Polys; frontA: Lines; frontB: Lines; contact: Lines }) {
  const out: Record<string, unknown> = {};
  for (const k of ['fillA', 'fillB', 'fillRest'] as const) out[k] = { n: g[k].length, area: polyArea(g[k]), hash: hash(g[k]) };
  for (const k of ['frontA', 'frontB', 'contact'] as const) out[k] = { n: g[k].length, pts: g[k].reduce((s, l) => s + l.length, 0), hash: hash(g[k]) };
  return out;
}
