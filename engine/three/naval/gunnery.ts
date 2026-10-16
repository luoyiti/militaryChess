/**
 * 海战沙盘的炮火调度（纯函数，Node 可测）：按播放速度封顶的确定性齐射、每次齐射的炮弹数、
 * 水柱散布（目标舰坐标系：沿射线方向 along、横向 across）、水柱高度与弹道顶点高度。
 * 数据只通过 engine/naval/model.ts 读取。
 */
import type { RUnit } from '../../model/core';
import type { ShipWeapon } from '../../core/types';
import { type RNaval, type RFire, salvosBetween, weaponOf, caliberMm, hash01 } from '../../naval/model';

export interface Salvo { key: string; fire: RFire; k: number; h: number; calMm: number; weapon: ShipWeapon | null; shells: number }

/**
 * (h0, h1] 内的齐射。rateHps = 当前每真实秒推进的叙事小时数；每艘射击舰每真实秒最多 maxPerSec 次齐射
 * （同一射击舰同时有 n 个射击时段时各自的间隔放大 n 倍）。
 */
export function salvoWindow(nav: RNaval, units: Map<string, RUnit>, h0: number, h1: number, rateHps: number, maxPerSec = 1.5): Salvo[] {
  if (!(h1 > h0)) return [];
  const active = nav.fire.filter((f) => f.h0 < h1 && f.h1 > h0);
  const per = new Map<string, number>();
  for (const f of active) per.set(f.shooter, (per.get(f.shooter) ?? 0) + 1);
  const out: Salvo[] = [];
  for (const f of active) {
    const shooter = units.get(f.shooter);
    if (!shooter) continue;
    const weapon = weaponOf(shooter, f.weapon);
    const calMm = caliberMm(weapon?.cal ?? f.weapon);
    const minIv = rateHps > 0 ? (rateHps * (per.get(f.shooter) ?? 1)) / maxPerSec : 0;
    // 区间左开右闭：恰好在 h0 的齐射已在上一帧放出
    for (const s of salvosBetween(f, calMm, h0, h1, minIv)) {
      if (s.h <= h0) continue;
      out.push({ key: `${f.id}#${s.k}`, fire: f, k: s.k, h: s.h, calMm, weapon, shells: shellsPerSalvo(weapon) });
    }
  }
  return out.sort((a, b) => a.h - b.h);
}

/** 每次齐射的炮弹（水柱）数：主炮 = 每座炮管数，副炮 = 一舷约一半的炮座，缺省 2 */
export function shellsPerSalvo(w: ShipWeapon | null): number {
  if (!w) return 2;
  if (w.kind === 'torpedo') return 0;
  if (w.kind === 'main') return Math.max(1, Math.min(4, w.perMount ?? 2));
  return Math.max(1, Math.min(4, Math.ceil((w.mounts ?? 2) * (w.perMount ?? 1) / 2)));
}

/** 第 i 发炮弹的落点散布（-1..1，确定性）：沿射线方向的误差大于横向；偶尔跨射 */
export function scatter(key: string, i: number): { along: number; across: number } {
  const a = hash01(key, i * 2 + 1) * 2 - 1, c = hash01(key, i * 2 + 2) * 2 - 1;
  return { along: Math.sign(a) * (0.35 + 0.65 * Math.abs(a)), across: c * 0.55 };
}

/** 水柱实际高度（米）：28 cm 约 70 m，8 英寸 50 m，6 英寸 35 m，4 英寸 20 m */
export function splashHeightM(calMm: number): number {
  return Math.max(12, Math.min(90, 0.0009 * calMm * calMm + 0.02 * calMm));
}

/** 弹道顶点高度（米）：远距离射击弹道更高（视觉近似，按射程的约 12%） */
export function apexM(rangeKm: number): number {
  return Math.max(150, rangeKm * 1000 * 0.12);
}

/** 炮弹飞行的真实播放时长（秒）：叙事飞行时间按当前播放速度换算，夹在可读范围内 */
export function flightRealSec(flightNarrSec: number, rateHps: number): number {
  const real = rateHps > 0 ? flightNarrSec / (rateHps * 3600) : 1.4;
  return Math.max(0.75, Math.min(2.6, real));
}
