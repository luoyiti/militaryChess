/**
 * 总台的世界投影：米勒圆柱投影（1942 年问世，战时作战室常用的世界挂图投影）。
 * 中央经线 39°E：切口落在 141°W（阿拉斯加与加拿大的边界线、东太平洋），
 * 欧洲、非洲、亚洲与整个太平洋战区（含夏威夷、阿留申群岛）连成一片，美洲在左侧。
 * 世界坐标：宽 WORLD_W 个单位对应 360° 经度，纬度裁到 50°S—80°N。
 */
import { geoProjection, type GeoProjection } from 'd3-geo';
import type { BBox, LonLat } from './types';

export const LON0 = 39;
export const LAT_N = 80;
export const LAT_S = -50;
export const WORLD_W = 4096;

const RAD = Math.PI / 180;
type Raw = ((l: number, p: number) => [number, number]) & { invert?: (x: number, y: number) => [number, number] };
const miller: Raw = (l, p) => [l, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * p))];
miller.invert = (x, y) => [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI];

const S = WORLD_W / (2 * Math.PI);
const yN = miller(0, LAT_N * RAD)[1];
const yS = miller(0, LAT_S * RAD)[1];
export const WORLD_H = Math.round((yN - yS) * S);

export const projection: GeoProjection = geoProjection(miller).rotate([-LON0, 0]).scale(S).translate([WORLD_W / 2, yN * S]).precision(0.15);

export const project = (ll: LonLat | readonly number[]) => projection(ll as [number, number])!;
export const unproject = (x: number, y: number) => projection.invert!([x, y])! as LonLat;
/** 每度经度的世界单位数 */
export const UNITS_PER_DEG = WORLD_W / 360;

/** 经纬度框 → 世界坐标矩形 [x0, y0, x1, y1]（米勒投影是圆柱投影，框投影后仍是矩形） */
export function worldRect([lon0, lat0, lon1, lat1]: BBox): BBox {
  const [x0, y1] = project([lon0, lat0]);
  let [x1, y0] = project([lon1, lat1]);
  if (x1 < x0) x1 += WORLD_W; // 跨越切口（不应出现，保险起见）
  return [x0, y0, x1, y1];
}

/** 几个经纬度框的并集（世界坐标） */
export function unionRect(rects: BBox[]): BBox | null {
  if (!rects.length) return null;
  return rects.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
}
