/** 同一航迹供事件重放、Canvas 机头和沙盘朝向使用；经纬度方向先经过地图投影。 */
import { project } from '../geo/frame';
import type { LonLat } from '../core/types';
import type { RRoute } from './core';
import type { DB, REvent } from '../data/db';

export interface FlightPoint { h: number; ll: LonLat }
export interface FlightPose { ll: LonLat; world: [number, number]; heading: number; moving: boolean }
export interface FlightSortie {
  id: string; unit: string; side: RRoute['side']; role: NonNullable<RRoute['role']>;
  wps: FlightPoint[]; attackH?: number; attackLL?: LonLat;
}

/** Canvas 的 +X 机头；世界坐标的 y 向南。投影的局部导数避免高纬度／斜向航迹偏转。 */
export function projectedHeading(ll: LonLat, geographicHeading: number): number {
  const eps = .00001;
  const a = project(ll), b = project([ll[0] + Math.cos(geographicHeading) * eps, ll[1] + Math.sin(geographicHeading) * eps]);
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

/** 与真实飞行时间轴一样在经纬度节点间线性运动，旋转取当前航段的投影切线。 */
export function flightPoseAt(wps: readonly FlightPoint[], h: number): FlightPose | null {
  if (!wps.length) return null;
  let i = 0;
  while (i < wps.length - 1 && wps[i + 1].h <= h) i++;
  const a = wps[i], b = wps[i + 1];
  if (!b) {
    const prev = wps[i - 1];
    const heading = prev ? projectedHeading(a.ll, Math.atan2(a.ll[1] - prev.ll[1], a.ll[0] - prev.ll[0])) : 0;
    return { ll: a.ll, world: project(a.ll), heading, moving: false };
  }
  const t = Math.max(0, Math.min(1, (h - a.h) / Math.max(1e-9, b.h - a.h)));
  const ll: LonLat = [a.ll[0] + (b.ll[0] - a.ll[0]) * t, a.ll[1] + (b.ll[1] - a.ll[1]) * t];
  const moving = h >= a.h && Math.hypot(b.ll[0] - a.ll[0], b.ll[1] - a.ll[1]) > 1e-9;
  return { ll, world: project(ll), heading: projectedHeading(ll, Math.atan2(b.ll[1] - a.ll[1], b.ll[0] - a.ll[0])), moving };
}

/** 每个关联单位取当前事件的出击及其紧接的返航，包含事件内的不同目标和护航部队。 */
export function eventSorties(db: DB, e: REvent): FlightSortie[] {
  const units = new Set(e.units ?? []);
  const routes = db.routes.filter((r) => units.has(r.unit) && r.wps[0].h <= e.h + 6 && r.wps.at(-1)!.h >= e.h - 6);
  return routes.filter((r) => r.role && r.role !== 'return'
    && (e.airAction !== 'intercept' || r.role === 'intercept')
    && (e.airAction !== 'raid' || r.role !== 'intercept')).map((r) => {
    const end = r.wps.at(-1)!;
    const back = routes.filter((x) => x.unit === r.unit && x.role === 'return' && Math.abs(x.wps[0].h - end.h) < .01)
      .sort((a, b) => Math.abs(a.wps[0].h - end.h) - Math.abs(b.wps[0].h - end.h))[0];
    return { id: r.id, unit: r.unit, side: r.side, role: r.role!,
      wps: back ? [...r.wps, ...back.wps.slice(1)] : [...r.wps],
      ...(r.role === 'raid' ? { attackH: end.h, attackLL: end.ll } : {}) };
  });
}
