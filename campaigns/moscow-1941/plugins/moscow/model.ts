/**
 * 莫斯科保卫战展示插件的纯计算部分（无 DOM，便于单独核对）。
 *
 * 两件事：
 *  1) 城门态势：按当前时刻的控制区关键帧（DE 槽多边形）算出「德军控制区边界到克里姆林宫的最近直线距离」，
 *     与 `data/ext/moscow/front-watch.json` 里文献的说法并列显示。两者口径不同（一个是按本图重建的近似战线，
 *     一个是史料记载的某地推进距离），不互相替代、不相加。
 *  2) 气温：莫斯科站（WMO 27612）的逐日实测值，按叙事日历日取值，缺测留空，不插值。
 */

import type { LonLat } from '../../../../engine/core/types';

export interface WeatherDay {
  date: string; // YYYY-MM-DD（莫斯科时间日历日）
  tMin: number;
  tAvg: number;
  tMax: number;
  precipMm: number;
  sources?: string[];
}

export interface WeatherDoc {
  meta?: { station?: string; stationName?: string; stationNameZh?: string; unit?: string; sourceTitle?: string; sourceUrl?: string; sourceNote?: string };
  days?: WeatherDay[];
}

export interface FrontReport {
  id: string;
  at: string;
  place?: string;
  km: number;
  kmAlt?: number[];
  label: string;
  text: string;
  sources?: string[];
  confidence?: string;
}

export interface FrontWatchDoc {
  reports?: FrontReport[];
}

/** 经纬度 → 以参照纬度为基准的局部公里平面（战役区域 5° 见方，等距圆柱近似即可） */
const KM_LAT = 110.57;
const kmLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/** 点到线段的距离（km），局部平面 */
function pointSegKm(p: [number, number], a: [number, number], b: [number, number], lat0: number): number {
  const kx = kmLon(lat0);
  const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * KM_LAT;
  const bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * KM_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 < 1e-12 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  const cx = ax + dx * t, cy = ay + dy * t;
  return Math.hypot(cx, cy);
}

/** 点是否在环内（射线法，经纬度平面足够） */
export function ringContains(ring: readonly LonLat[], p: readonly number[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 一条边的长度（km，局部平面；战役区域 5° 见方足够） */
function edgeKm(a: readonly number[], b: readonly number[], lat0: number): number {
  const kx = kmLon(lat0);
  return Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * KM_LAT);
}

/**
 * 多边形（[外环, 洞…]）到点的距离；点在多边形内返回 0。
 * `maxEdgeKm` 给定时跳过超过该长度的边——用于剔除「顶点顺序交错」造成的横穿长弦（见 FrontSnapshot.suspect）。
 */
function polygonDistanceKm(poly: readonly (readonly LonLat[])[], p: readonly number[], maxEdgeKm = Infinity): number {
  const [outer] = poly;
  if (!outer || outer.length < 2) return Infinity;
  if (ringContains(outer, p) && !poly.slice(1).some((hole) => ringContains(hole, p))) return 0;
  let best = Infinity;
  for (const ring of poly) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      if (edgeKm(a, b, p[1]) > maxEdgeKm) continue;
      const d = pointSegKm([p[0], p[1]], [a[0], a[1]], [b[0], b[1]], p[1]);
      if (d < best) best = d;
    }
  }
  return best;
}

/** 长边阈值：正常战线折线的相邻点间距中位数约 17 km，p90 约 83 km（含画布边缘的闭合边）。
 *  超过 60 km 的边在城郊尺度上已不可能是一条真实的接触线，按「顶点顺序交错」对待。 */
const LONG_EDGE_KM = 60;

export interface FrontSnapshot {
  /** 与克里姆林宫的最近直线距离（km，取整）；无法计算时为 null */
  km: number | null;
  /** 所用关键帧的时刻（'YYYY-MM-DDTHH:mm'） */
  at: string | null;
  /** 是否为「德军已控制该点」的情形（距离 0，理论上不应出现） */
  reached: boolean;
  /** 是否有不晚于当前时刻的关键帧（false = 开局前，图上还没有控制区） */
  hasFrame: boolean;
  /** 该关键帧里 DE 槽是否为空白（空白 = 此时德军尚未控制画布内任何区域） */
  emptySlot: boolean;
  /**
   * 数据自检：多边形的顶点顺序在目标附近是否出现「长边背穿」。
   * 控制区多边形由折线自动闭合生成，个别帧会出现东西两侧顶点交错，形成一条横穿城郊的 100 km 长弦，
   * 使「最近距离」被压到与史料矛盾的小值（例如 11-30 算出 6 km，而该帧 note 自述约 28—29 km）。
   * 检测到这种长边时，distance 只按「短边」计算，并把候选值并列出来，由界面同时显示两种口径并注明数据疑问。
   */
  suspect: boolean;
  /** 剔除长边后的距离（km，取整）；与 km 不同时说明该帧存在上述顶点顺序问题 */
  kmShortEdge: number | null;
}

/**
 * 按时刻取最近一条不晚于 t 的控制区关键帧，算德军控制区边界到目标的最近距离。
 * `keyframes` 按 h 升序（引擎 DB 已排序）；每个关键帧的 a = A 槽（本战役为 DE）多边形。
 */
export function frontSnapshotAt(
  keyframes: readonly { at: string; h: number; a: readonly (readonly (readonly LonLat[])[])[] }[],
  target: readonly number[],
  t: number,
): FrontSnapshot {
  let kf: (typeof keyframes)[number] | undefined;
  for (const k of keyframes) { if (k.h <= t) kf = k; else break; }
  if (!kf) return { km: null, at: null, reached: false, hasFrame: false, emptySlot: false, suspect: false, kmShortEdge: null };
  if (!kf.a.length) return { km: null, at: kf.at, reached: false, hasFrame: true, emptySlot: true, suspect: false, kmShortEdge: null };
  let best = Infinity, bestShort = Infinity;
  for (const poly of kf.a) {
    const d = polygonDistanceKm(poly, target);
    if (d < best) best = d;
    const s = polygonDistanceKm(poly, target, LONG_EDGE_KM);
    if (s < bestShort) bestShort = s;
  }
  if (!Number.isFinite(best)) return { km: null, at: kf.at, reached: false, hasFrame: true, emptySlot: true, suspect: false, kmShortEdge: null };
  const short = Number.isFinite(bestShort) ? Math.round(bestShort) : null;
  // 两种口径相差超过 40% 时，判定该帧顶点顺序需要复核
  const suspect = short !== null && short - Math.round(best) > Math.max(6, Math.round(best) * 0.4);
  return {
    km: Math.round(best), at: kf.at, reached: best <= 0.001, hasFrame: true, emptySlot: false,
    suspect, kmShortEdge: suspect ? short : null,
  };
}

/** 战役第几天（1 = 开始日），按日历日差算，与时区无关 */
export function campaignDay(startIso: string, atIso: string): number {
  const d0 = Date.parse(`${startIso.slice(0, 10)}T00:00:00Z`);
  const d1 = Date.parse(`${atIso.slice(0, 10)}T00:00:00Z`);
  return Math.floor((d1 - d0) / 86_400_000) + 1;
}

/** 取当日的逐日气温；缺测返回 null（不插值、不挪用邻日） */
export function weatherAt(days: readonly WeatherDay[], iso: string): WeatherDay | null {
  const date = iso.slice(0, 10);
  let lo = 0, hi = days.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const d = days[mid].date;
    if (d === date) return days[mid];
    if (d < date) lo = mid + 1; else hi = mid - 1;
  }
  return null;
}

/** 截至（含）某日的窗口内日最低气温序列；缺测日跳过，返回 [date, tMin] */
export function recentLows(days: readonly WeatherDay[], iso: string, window = 14): [string, number][] {
  const end = iso.slice(0, 10);
  const out: [string, number][] = [];
  for (const d of days) if (d.date <= end) out.push([d.date, d.tMin]);
  return out.slice(Math.max(0, out.length - window));
}

/** 自战役开始至某日，日最低气温 ≤ -20℃ 的天数（严寒日计数，仅用于提示，不作战役结论） */
export function frostDays(days: readonly WeatherDay[], iso: string, threshold = -20): number {
  const end = iso.slice(0, 10);
  return days.filter((d) => d.date <= end && d.tMin <= threshold).length;
}

/** 截至某日最近的文献前锋说法（按 at 升序，取不晚于该时刻的最后一条） */
export function latestReport(reports: readonly FrontReport[], iso: string): FrontReport | null {
  let best: FrontReport | null = null;
  for (const r of reports) if (r.at <= iso && (!best || r.at >= best.at)) best = r;
  return best;
}

/** 14 日最低气温的折线路径（viewBox 0 0 W H），供内联 SVG 使用 */
export function sparkPath(values: readonly number[], w = 132, h = 26, pad = 2): string {
  if (values.length < 2) return '';
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = Math.max(1, hi - lo);
  const step = (w - pad * 2) / (values.length - 1);
  return values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (v - lo) / span);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

/** 温度显示：保留一位小数，正值加正号（写「+3.7」「−12.4」），不用连字符减号 */
export function fmtTemp(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const s = Math.abs(v).toFixed(1);
  return v < 0 ? `−${s}` : `+${s}`;
}
