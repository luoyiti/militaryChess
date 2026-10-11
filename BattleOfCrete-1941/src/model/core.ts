/** 纯函数模型层：浏览器与 Node（校验/调试脚本）共用，不得依赖 DOM。 */
import type { LonLat, Place, Pos, Unit, UnitStatus, Route, Movement } from '../schema';
import { isoToHours } from '../schema';

export type Gazetteer = Map<string, Place>;

export function buildGazetteer(...lists: Place[][]): { gaz: Gazetteer; conflicts: string[] } {
  const gaz: Gazetteer = new Map();
  const conflicts: string[] = [];
  for (const list of lists) {
    for (const p of list) {
      const prev = gaz.get(p.id);
      if (prev) {
        const d = haversineKm(prev.pos, p.pos);
        if (d > 3) conflicts.push(`地名 ${p.id} 重复且坐标相差 ${d.toFixed(1)} km`);
        continue;
      }
      gaz.set(p.id, p);
    }
  }
  return { gaz, conflicts };
}

export function resolvePos(pos: Pos, gaz: Gazetteer): LonLat {
  if (typeof pos === 'string') {
    const p = gaz.get(pos.slice(1));
    if (!p) throw new Error(`未知地名引用 ${pos}`);
    return p.pos as LonLat;
  }
  return pos as LonLat;
}

export function tryResolvePos(pos: Pos, gaz: Gazetteer): LonLat | null {
  try { return resolvePos(pos, gaz); } catch { return null; }
}

export function haversineKm(a: readonly number[], b: readonly number[]): number {
  const R = 6371;
  const toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR;
  const dLon = (b[0] - a[0]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// ---------- 轨迹 ----------
export interface RTrackPoint { h: number; ll: LonLat; status: UnitStatus; movement?: Movement }
export interface RUnit extends Omit<Unit, 'track'> {
  track: RTrackPoint[];
  fromH: number; // 存在时间窗
  toH: number;
  children: string[];
}

const TERMINAL: UnitStatus[] = ['destroyed', 'surrendered', 'interned', 'disbanded'];
export const isTerminal = (s: UnitStatus) => TERMINAL.includes(s);

export function resolveUnits(units: Unit[], gaz: Gazetteer): Map<string, RUnit> {
  const map = new Map<string, RUnit>();
  for (const u of units) {
    let last: UnitStatus = 'active';
    const track: RTrackPoint[] = u.track.map((p) => {
      if (p.status) last = p.status;
      return { h: isoToHours(p.at), ll: resolvePos(p.pos, gaz), status: last, movement: p.movement ?? 'land' };
    });
    const fromH = u.active?.from ? isoToHours(u.active.from) : -1e9;
    let toH = u.active?.to ? isoToHours(u.active.to) : 1e9;
    map.set(u.id, { ...u, track, fromH, toH, children: [] });
  }
  for (const u of map.values()) {
    if (u.parent && map.has(u.parent)) map.get(u.parent)!.children.push(u.id);
  }
  return map;
}

export interface UnitState { ll: LonLat; status: UnitStatus; heading: number; moving: boolean; fade: number; movement?: Movement }

/** 轨迹插值（线性 + smoothstep 缓动）；终止状态后 48h 内淡出 */
export function trackAt(track: RTrackPoint[], h: number): UnitState | null {
  if (!track.length) return null;
  if (h < track[0].h) {
    // 开战前：停在第一个点
    return { ll: track[0].ll, status: track[0].status, heading: 0, moving: false, fade: 1, movement: 'land' };
  }
  let i = 0;
  while (i < track.length - 1 && track[i + 1].h <= h) i++;
  const a = track[i];
  const b = track[i + 1];
  if (!b) {
    let fade = 1;
    if (isTerminal(a.status)) fade = Math.max(0, 1 - (h - a.h) / 48);
    const prev = track[i - 1];
    const heading = prev ? Math.atan2(a.ll[1] - prev.ll[1], a.ll[0] - prev.ll[0]) : 0;
    return { ll: a.ll, status: a.status, heading, moving: false, fade, movement: a.movement ?? 'land' };
  }
  const span = b.h - a.h;
  let t = span > 0 ? (h - a.h) / span : 1;
  t = t * t * (3 - 2 * t);
  const ll: LonLat = [a.ll[0] + (b.ll[0] - a.ll[0]) * t, a.ll[1] + (b.ll[1] - a.ll[1]) * t];
  const moving = haversineKm(a.ll, b.ll) > 2;
  const heading = Math.atan2(b.ll[1] - a.ll[1], b.ll[0] - a.ll[0]);
  return { ll, status: a.status, heading, moving, fade: 1, movement: a.movement ?? 'land' };
}

/** 上级单位无轨迹时，取活动下属位置的质心 */
export function unitStateAt(id: string, units: Map<string, RUnit>, h: number, depth = 0): UnitState | null {
  const u = units.get(id);
  if (!u || depth > 6) return null;
  if (h < u.fromH || h > u.toH + 48) return null;
  if (u.track.length) {
    const s = trackAt(u.track, h);
    if (s && h > u.toH) s.fade = Math.max(0, 1 - (h - u.toH) / 48);
    return s;
  }
  let sx = 0, sy = 0, n = 0, anyMoving = false, heading = 0;
  let status: UnitStatus = 'active';
  for (const c of u.children) {
    const s = unitStateAt(c, units, h, depth + 1);
    if (!s || s.fade <= 0.05) continue;
    sx += s.ll[0]; sy += s.ll[1]; n++;
    if (s.moving) { anyMoving = true; heading = s.heading; }
    if (s.status === 'engaged') status = 'engaged';
  }
  if (!n) return null;
  return { ll: [sx / n, sy / n], status, heading, moving: anyMoving, fade: 1 };
}

// ---------- 路线 ----------
export interface RRoute extends Omit<Route, 'waypoints'> { wps: { h: number; ll: LonLat }[] }
export function resolveRoutes(routes: Route[], gaz: Gazetteer): RRoute[] {
  return routes.map((r) => ({ ...r, wps: r.waypoints.map((w) => ({ h: isoToHours(w.at), ll: resolvePos(w.pos, gaz) })) }));
}
/** 路线在时刻 h 的推进进度：返回已走过的路点序列（最后一点为插值点） */
export function routeProgress(r: RRoute, h: number): LonLat[] {
  const w = r.wps;
  if (h <= w[0].h) return [];
  const out: LonLat[] = [w[0].ll];
  for (let i = 1; i < w.length; i++) {
    if (h >= w[i].h) { out.push(w[i].ll); continue; }
    const t = (h - w[i - 1].h) / (w[i].h - w[i - 1].h);
    out.push([w[i - 1].ll[0] + (w[i].ll[0] - w[i - 1].ll[0]) * t, w[i - 1].ll[1] + (w[i].ll[1] - w[i - 1].ll[1]) * t]);
    break;
  }
  return out;
}

// ---------- 几何工具 ----------
export function pointInRing(pt: LonLat, ring: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function pointInPolygon(pt: LonLat, poly: LonLat[][]): boolean {
  if (!pointInRing(pt, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (pointInRing(pt, poly[k])) return false;
  return true;
}
export function pointInMulti(pt: LonLat, polys: LonLat[][][]): boolean {
  return polys.some((p) => pointInPolygon(pt, p));
}
/** 点到折线/环的最近距离（km，近似） */
export function distToRingKm(pt: LonLat, ring: LonLat[]): number {
  let best = Infinity;
  const kx = 111.32 * Math.cos((pt[1] * Math.PI) / 180);
  const ky = 110.57;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const ax = (a[0] - pt[0]) * kx, ay = (a[1] - pt[1]) * ky;
    const bx = (b[0] - pt[0]) * kx, by = (b[1] - pt[1]) * ky;
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy;
    let t = L > 0 ? -(ax * dx + ay * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t, py = ay + dy * t;
    best = Math.min(best, Math.hypot(px, py));
  }
  return best;
}
export function ringSelfIntersects(ring: LonLat[]): [number, number] | null {
  const n = ring.length;
  const seg = (i: number) => [ring[i], ring[(i + 1) % n]] as const;
  const cross = (o: LonLat, a: LonLat, b: LonLat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (let i = 0; i < n; i++) {
    const [a, b] = seg(i);
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const [c, d] = seg(j);
      const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
      if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return [i, j];
    }
  }
  return null;
}
