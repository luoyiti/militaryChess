/**
 * 海战沙盘的局部切平面：以焦点经纬度为原点的等距圆柱近似（米）。x = 东，z = 南，y 向上（与地形沙盘的 z 向南一致）。
 * 焦点远离原点时由沙盘重新定原点（浮动原点），保证交战海域的坐标精度与投影误差都很小。
 */
import type { LonLat } from '../../core/types';

const M_LAT = 110_574;
const M_LON = 111_320;

export class LocalFrame {
  lon0 = 0;
  lat0 = 0;
  kx = M_LON;
  readonly kz = M_LAT;
  constructor(ll: readonly number[]) { this.set(ll); }
  set(ll: readonly number[]) {
    this.lon0 = ll[0];
    this.lat0 = Math.max(-85, Math.min(85, ll[1]));
    this.kx = M_LON * Math.cos((this.lat0 * Math.PI) / 180);
  }
  /** 经纬度 → 局部平面（米） */
  x(ll: readonly number[]): number {
    let d = ll[0] - this.lon0;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    return d * this.kx;
  }
  z(ll: readonly number[]): number { return -(ll[1] - this.lat0) * this.kz; }
  toXZ(ll: readonly number[]): [number, number] { return [this.x(ll), this.z(ll)]; }
  toLL(x: number, z: number): LonLat { return [this.lon0 + x / this.kx, this.lat0 - z / this.kz]; }
}

/** 真航向（度，真北顺时针）→ 绕 +Y 的偏航角（模型 +X 为舰艏；世界北 = -z） */
export const courseYaw = (courseDeg: number) => ((90 - courseDeg) * Math.PI) / 180;
/** 方位角（度）→ 平面单位向量 [东, 南] */
export const bearingVec = (deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), -Math.cos(r)];
};

/** 相对缩放（与 2D 的 relZoom 对应）↔ 镜头距离：rel 1 ≈ 大洋总览（800 km），rel 40 ≈ 战术距离（20 km） */
export const REL_DIST = 800_000;
export const relToDist = (rel: number) => REL_DIST / Math.max(0.05, rel);
export const distToRel = (d: number) => REL_DIST / Math.max(1, d);

/** 兵棋比例：近距离固定放大 base 倍，远距离随镜头距离加大（像 2D 的标绘棋子一样保持可读） */
export function wargameScale(dist: number, base: number, max = 90): number {
  return Math.max(base, Math.min(max, dist / 2200));
}

/** 昼夜阶段（中文）：按太阳高度与上下午 */
export function dayPhase(elev: number, morning: boolean): string {
  if (elev < -12) return '夜间';
  if (elev < -0.8) return morning ? '拂晓' : '黄昏';
  if (elev < 10) return morning ? '清晨' : '傍晚';
  return '白昼';
}
