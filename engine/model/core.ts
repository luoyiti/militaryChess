/** 纯函数模型层：浏览器与 Node（校验/调试脚本）共用，不得依赖 DOM。 */
import type { LonLat, Place, Pos, Unit, UnitStatus, Route, Movement, FlightPhase } from '../core/types';
import { TERMINAL_STATUSES } from '../core/types';
import { isoToHours } from '../core/time';

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
export interface RTrackPoint {
  h: number; ll: LonLat; status: UnitStatus; movement?: Movement; note?: string; flightPhase?: FlightPhase; altitudeM?: number;
  /** 海战：航向（度，真北顺时针）/ 航速（节）；curve = 舰船海上航段，按三次 Hermite 曲线插值 */
  course?: number; speedKn?: number; curve?: boolean;
}
export interface RUnit extends Omit<Unit, 'track'> {
  track: RTrackPoint[];
  fromH: number; // 存在时间窗
  toH: number;
  /** active.to 之后的淡出时长（小时）：缺省 48；舰载机回收后 0.25 */
  fadeH: number;
  children: string[];
}

export const isTerminal = (s: UnitStatus) => TERMINAL_STATUSES.includes(s);

export function resolveUnits(units: Unit[], gaz: Gazetteer): Map<string, RUnit> {
  const map = new Map<string, RUnit>();
  for (const u of units) {
    let last: UnitStatus = 'active';
    const track: RTrackPoint[] = u.track.map((p) => {
      if (p.status) last = p.status;
      const movement = p.movement ?? (u.ship ? 'sea' : 'land');
      return {
        h: isoToHours(p.at), ll: resolvePos(p.pos, gaz), status: last, movement, note: p.note, flightPhase: p.flightPhase, altitudeM: p.altitudeM,
        ...(p.course !== undefined ? { course: p.course } : {}), ...(p.speedKn !== undefined ? { speedKn: p.speedKn } : {}),
        ...(u.ship && movement === 'sea' ? { curve: true } : {}),
      };
    });
    const fromH = u.active?.from ? isoToHours(u.active.from) : -1e9;
    let toH = u.active?.to ? isoToHours(u.active.to) : 1e9;
    map.set(u.id, { ...u, track, fromH, toH, fadeH: 48, children: [] });
  }
  for (const u of map.values()) {
    const parent = u.parent ? map.get(u.parent) : undefined;
    if (parent) parent.children.push(u.id);
    // 舰载机（上级是舰船）：回收后很快消失，不在母舰旁残留两天
    if (u.type === 'air' && parent?.ship) u.fadeH = 0.25;
  }
  return map;
}

export interface UnitState {
  ll: LonLat; status: UnitStatus; heading: number; moving: boolean; fade: number; movement?: Movement; flightPhase?: FlightPhase; altitudeM?: number;
  /** 舰船：真航向（度，真北顺时针）与航速（节），由曲线切线求得 */
  courseDeg?: number; speedKn?: number;
}

const KM_LAT = 110.57;
const kmLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);
const KN = 1.852;
/** 航向（度，真北顺时针）→ 经纬度空间的 heading（弧度，0 = 东，逆时针；与 trackAt 的约定一致） */
export const courseToHeading = (course: number, lat: number) => {
  const c = (course * Math.PI) / 180;
  return Math.atan2(Math.cos(c) / KM_LAT, Math.sin(c) / kmLon(lat));
};

/**
 * 舰船航段：三次 Hermite 曲线（局部平面 km）。端点切线取该点的航向/航速；缺省用相邻点的中心差分（Catmull-Rom），
 * 端点处用弦向。切线长度夹在弦速的 0.35–1.7 倍之间，避免史料航向与位置稍有出入时打圈。
 */
function curveAt(track: RTrackPoint[], i: number, h: number): UnitState {
  const a = track[i], b = track[i + 1];
  const T = Math.max(1e-6, b.h - a.h);
  const lat0 = a.ll[1], kx = kmLon(lat0);
  const P = (p: RTrackPoint): [number, number] => [(p.ll[0] - a.ll[0]) * kx, (p.ll[1] - a.ll[1]) * KM_LAT];
  const pa: [number, number] = [0, 0], pb = P(b);
  const chord = Math.hypot(pb[0], pb[1]);
  const chordV = chord / T; // km/h
  const vel = (k: number): [number, number] => {
    const p = track[k];
    if (p.course !== undefined) {
      const sp = p.speedKn !== undefined ? p.speedKn * KN : chordV;
      const c = (p.course * Math.PI) / 180;
      return [Math.sin(c) * sp, Math.cos(c) * sp];
    }
    const prev = track[k - 1], next = track[k + 1];
    if (prev && next && prev.curve && p.curve && next.h > prev.h) {
      const q0 = P(prev), q1 = P(next);
      return [(q1[0] - q0[0]) / (next.h - prev.h), (q1[1] - q0[1]) / (next.h - prev.h)];
    }
    return [pb[0] / T, pb[1] / T];
  };
  const clamp = (v: [number, number]): [number, number] => {
    const n = Math.hypot(v[0], v[1]);
    if (n < 1e-9 || chordV < 1e-9) return v;
    const lim = Math.max(chordV * 0.35, Math.min(chordV * 1.7, n));
    return [(v[0] / n) * lim, (v[1] / n) * lim];
  };
  const stationary = chord < 0.05; // 锚泊 / 停船：原地，航向沿用该点记录
  const s = Math.max(0, Math.min(1, (h - a.h) / T));
  let x: number, y: number, dx: number, dy: number;
  if (stationary) { x = pb[0] * s; y = pb[1] * s; dx = 0; dy = 0; }
  else {
    const va = clamp(vel(i)), vb = clamp(vel(i + 1));
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const d00 = 6 * s2 - 6 * s, d10 = 3 * s2 - 4 * s + 1, d01 = -6 * s2 + 6 * s, d11 = 3 * s2 - 2 * s;
    x = h00 * pa[0] + h10 * T * va[0] + h01 * pb[0] + h11 * T * vb[0];
    y = h00 * pa[1] + h10 * T * va[1] + h01 * pb[1] + h11 * T * vb[1];
    dx = (d00 * pa[0] + d10 * T * va[0] + d01 * pb[0] + d11 * T * vb[0]) / T;
    dy = (d00 * pa[1] + d10 * T * va[1] + d01 * pb[1] + d11 * T * vb[1]) / T;
  }
  const ll: LonLat = [a.ll[0] + x / kx, a.ll[1] + y / KM_LAT];
  const speedKmh = Math.hypot(dx, dy);
  const moving = speedKmh > 0.9; // ≈ 0.5 节
  const courseDeg = moving ? ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 : (a.course ?? b.course ?? 0);
  return {
    ll, status: a.status, heading: courseToHeading(courseDeg, ll[1]), moving, fade: 1, movement: 'sea',
    courseDeg, speedKn: moving ? speedKmh / KN : 0,
  };
}

/** 轨迹插值（线性 + smoothstep 缓动）；终止状态后 48h 内淡出 */
export function trackAt(track: RTrackPoint[], h: number): UnitState | null {
  if (!track.length) return null;
  if (h < track[0].h) {
    // 开战前：停在第一个点
    const p0 = track[0];
    const naval = p0.course !== undefined ? { courseDeg: p0.course, speedKn: 0, heading: courseToHeading(p0.course, p0.ll[1]) } : {};
    return { ll: p0.ll, status: p0.status, heading: 0, moving: false, fade: 1, movement: p0.curve ? 'sea' : 'land', flightPhase: p0.flightPhase, altitudeM: p0.altitudeM, ...naval };
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
    if (a.curve) {
      // 舰船终点：保持最后记录的航向（或最后一段的航向），停船
      const last = prev ? curveAt(track, i - 1, a.h) : null;
      const courseDeg = a.course ?? last?.courseDeg ?? 0;
      return { ll: a.ll, status: a.status, heading: courseToHeading(courseDeg, a.ll[1]), moving: false, fade, movement: 'sea', courseDeg, speedKn: 0 };
    }
    return { ll: a.ll, status: a.status, heading, moving: false, fade, movement: a.movement ?? 'land', flightPhase: a.flightPhase, altitudeM: a.altitudeM };
  }
  if (a.curve && b.curve) return curveAt(track, i, h);
  // 空战：两个在场点之间原地待命
  if (a.flightPhase === 'at_base' && b.flightPhase === 'at_base') {
    return { ll: a.ll, status: a.status, heading: 0, moving: false, fade: 1, movement: a.movement ?? 'land', flightPhase: 'at_base', altitudeM: 0 };
  }
  const span = b.h - a.h;
  let t = span > 0 ? (h - a.h) / span : 1;
  // 地面部队 smoothstep 缓动；飞行航段匀速
  if (!a.flightPhase && !b.flightPhase) t = t * t * (3 - 2 * t);
  const ll: LonLat = [a.ll[0] + (b.ll[0] - a.ll[0]) * t, a.ll[1] + (b.ll[1] - a.ll[1]) * t];
  const moving = haversineKm(a.ll, b.ll) > 2;
  const heading = Math.atan2(b.ll[1] - a.ll[1], b.ll[0] - a.ll[0]);
  const flight = a.flightPhase ? { flightPhase: a.flightPhase, altitudeM: (a.altitudeM ?? 0) + ((b.altitudeM ?? a.altitudeM ?? 0) - (a.altitudeM ?? 0)) * t } : {};
  return { ll, status: a.status, heading, moving, fade: 1, movement: a.movement ?? 'land', ...flight };
}

/** 上级单位无轨迹时，取活动下属位置的质心 */
export function unitStateAt(id: string, units: Map<string, RUnit>, h: number, depth = 0): UnitState | null {
  const u = units.get(id);
  if (!u || depth > 6) return null;
  if (h < u.fromH || h > u.toH + u.fadeH) return null;
  if (u.track.length) {
    const s = trackAt(u.track, h);
    if (s && h > u.toH) s.fade = Math.max(0, 1 - (h - u.toH) / u.fadeH);
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
export interface RRoute extends Omit<Route, 'waypoints'> { wps: { h: number; ll: LonLat }[]; untilH?: number }
export function resolveRoutes(routes: Route[], gaz: Gazetteer): RRoute[] {
  return routes.map((r) => ({
    ...r,
    wps: r.waypoints.map((w) => ({ h: isoToHours(w.at), ll: resolvePos(w.pos, gaz) })),
    ...(r.until ? { untilH: isoToHours(r.until) } : {}),
  }));
}
/** 路线不透明度：设了 fadeHours 的出击航线抵达后按该时长淡出；地面推进抵达后保留 12h，再 48h 淡出；until 之后隐藏 */
export function routeOpacity(r: RRoute, h: number): number {
  const start = r.wps[0].h, end = r.wps[r.wps.length - 1].h;
  if (h < start) return 0;
  if (r.untilH !== undefined && h > r.untilH) return 0;
  if (r.fadeHours !== undefined) {
    const fade = r.fadeHours;
    return h <= end ? 1 : fade > 0 ? Math.max(0, 1 - (h - end) / fade) : 0;
  }
  return h <= end + 12 ? 1 : Math.max(0, 1 - (h - end - 12) / 48);
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
