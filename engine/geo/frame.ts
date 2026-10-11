/** 投影与世界坐标（与 config/frame.json、Python 管线严格一致）。initFrame() 之后才可用（ES 模块活绑定）。 */
import { geoConicConformal, type GeoProjection } from 'd3-geo';
import type { FrameConfig } from '../campaign/types';
import type { LonLat } from '../core/types';

export interface Grid { w: number; h: number; cell: number }

export let FRAME: FrameConfig;
export let W = 0;
export let H = 0;
export let KM = 1; // 1 世界单位 = KM 公里
export let projection: GeoProjection;
/** SDF 场网格（与 field_masks.bin 一致） */
export const GRID: Grid = { w: 0, h: 0, cell: 1 };

export function initFrame(f: FrameConfig) {
  if (f.projection.type && f.projection.type !== 'conicConformal') throw new Error('暂只支持 conicConformal 投影');
  FRAME = f;
  W = f.width;
  H = f.height;
  KM = f.kmPerUnit;
  projection = geoConicConformal()
    .parallels(f.projection.parallels)
    .rotate(f.projection.rotate)
    .center(f.projection.center)
    .scale(f.scale)
    .translate(f.translate)
    .precision(0.1);
  GRID.w = f.field.w; GRID.h = f.field.h; GRID.cell = f.field.cell;
}

export function project(ll: LonLat | readonly number[]): [number, number] {
  return projection(ll as [number, number]) as [number, number];
}
export function unproject(xy: readonly number[]): LonLat {
  return projection.invert!(xy as [number, number]) as LonLat;
}
export const kmToWorld = (km: number) => km / KM;
