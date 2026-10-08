/** 投影与世界坐标（与 config/frame.json、Python 管线严格一致） */
import { geoConicConformal, type GeoProjection } from 'd3-geo';
import frameJson from '../../config/frame.json';
import type { LonLat } from '../schema';

export const FRAME = frameJson as unknown as {
  projection: { parallels: [number, number]; rotate: [number, number]; center: [number, number] };
  bbox: [number, number, number, number];
  width: number; height: number; scale: number; translate: [number, number]; kmPerUnit: number;
  tiles: { size: number; levels: number[] };
  field: { cell: number; w: number; h: number; clampKm: number };
};

export const W = FRAME.width;
export const H = FRAME.height;
export const KM = FRAME.kmPerUnit; // 1 世界单位 = KM 公里

export const projection: GeoProjection = geoConicConformal()
  .parallels(FRAME.projection.parallels)
  .rotate(FRAME.projection.rotate)
  .center(FRAME.projection.center)
  .scale(FRAME.scale)
  .translate(FRAME.translate)
  .precision(0.1);

export function project(ll: LonLat | readonly number[]): [number, number] {
  return projection(ll as [number, number]) as [number, number];
}
export function unproject(xy: readonly number[]): LonLat {
  return projection.invert!(xy as [number, number]) as LonLat;
}
export const kmToWorld = (km: number) => km / KM;
