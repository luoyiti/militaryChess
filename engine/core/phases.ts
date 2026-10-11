/** 战役阶段 / 章节：manifest.phases 只写开始时刻；结束 = 下一阶段开始（末段 = 数据结束 + 1 分钟）。 */
import type { LonLat } from './types';
import type { PhaseDef } from '../campaign/types';
import { isoToHours, H_END } from './time';

export interface Phase { id: string; from: number; to: number; name: string; short: string; sub: string; center?: LonLat; zoom?: number }

export let PHASES: Phase[] = [];

export function initPhases(defs: PhaseDef[]) {
  PHASES = defs.map((p, i) => ({
    id: p.id,
    from: isoToHours(p.from),
    to: p.to ? isoToHours(p.to) : i + 1 < defs.length ? isoToHours(defs[i + 1].from) : H_END + 1 / 60,
    name: p.name,
    short: p.short ?? p.name.split('·').pop()!.trim(),
    sub: p.sub,
    center: p.center,
    zoom: p.zoom,
  }));
}

export function phaseAt(t: number): Phase {
  if (!PHASES.length) throw new Error('战役阶段未初始化');
  if (t < PHASES[0].from) return PHASES[0];
  return PHASES.find((p) => t >= p.from && t < p.to) ?? PHASES[PHASES.length - 1];
}
