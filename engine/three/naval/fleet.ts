/**
 * 舰船在沙盘中的选型与姿态（纯函数，Node 可测）：模型选择（unit.model → ship.kind 缺省）、按舰长缩放、
 * 沉没/自沉的下沉与倾侧曲线、轻微摇摆、武器在模型上的位置。
 */
import type { RUnit } from '../../model/core';
import { isTerminal } from '../../model/core';
import type { ModelId, ShipKind, ShipWeapon } from '../../core/types';
import { MODEL_SPECS } from '../models/specs';
import { SHIP_META, type ShipMeta } from '../models/ships';

/** ship.kind → 缺省模型（数据未写 unit.model 时） */
export const KIND_MODEL: Record<ShipKind, ModelId> = {
  pocket_battleship: 'graf_spee', battleship: 'renown', battlecruiser: 'renown', carrier: 'ark_royal',
  heavy_cruiser: 'exeter', light_cruiser: 'leander', destroyer: 'leander', submarine: 'merchant',
  auxiliary: 'tanker', tanker: 'tanker', merchant: 'merchant', liner: 'merchant', tug: 'merchant', boat: 'merchant',
};

const isNavalModel = (id: string | undefined): id is string => !!id && MODEL_SPECS[id]?.kind === 'naval' && !!SHIP_META[id];
const isAirModel = (id: string | undefined): id is string => !!id && MODEL_SPECS[id]?.kind === 'aircraft';

/** 舰船模型；非舰船部队返回 null */
export function shipModelFor(u: RUnit): ModelId | null {
  if (!u.ship && u.type !== 'naval') return null;
  if (isNavalModel(u.model)) return u.model;
  return KIND_MODEL[u.ship?.kind ?? 'merchant'] ?? 'merchant';
}
/** 舰载机/飞机模型（unit.model 为飞机模型时） */
export function aircraftModelFor(u: RUnit): ModelId | null {
  return isAirModel(u.model) ? u.model : null;
}

/** 模型缩放：数据给出的舰长 / 模型舰长（通用商船模型按实际船长缩放），夹在 0.25–2 */
export function modelScaleFor(u: RUnit, model: ModelId): number {
  const L = u.ship?.lengthM, sp = MODEL_SPECS[model];
  if (!L || !sp) return 1;
  return Math.max(0.25, Math.min(2, L / sp.lengthM));
}

/** 进入终止状态（沉没、自沉、失能）的时刻；没有则 null */
export function terminalAt(u: RUnit): number | null {
  for (const p of u.track) if (isTerminal(p.status)) return p.h;
  return null;
}

/**
 * 沉没曲线：ageH = 进入终止状态后的叙事小时，fade = unitStateAt 的淡出（48 h 内 1 → 0）。
 * 先在约半小时内下沉到甲板齐水并倾侧（大火），淡出期间继续下沉直至完全没入。
 * 返回模型单位（米）的下沉量与姿态（度）。
 */
export function sinkProfile(ageH: number, fade: number, meta: ShipMeta, mastTop: number): { sink: number; listDeg: number; pitchDeg: number; burning: boolean; gone: boolean } {
  const a = Math.max(0, ageH);
  const settle = smooth(Math.min(1, a / 0.6));
  const deckMid = deckAt(meta, 0);
  const awash = deckMid - meta.draftM + 1.2;
  const deep = (1 - Math.max(0, Math.min(1, fade))) * (mastTop + 4);
  const sink = settle * awash + deep;
  return { sink, listDeg: settle * 9, pitchDeg: -settle * 2.5, burning: a < 30 && fade > 0.05, gone: sink >= mastTop || fade <= 0.03 };
}
const smooth = (t: number) => t * t * (3 - 2 * t);

/** 甲板高度（模型坐标，自龙骨） */
export function deckAt(meta: ShipMeta, x: number): number {
  const d = meta.deck;
  if (x <= d[0][0]) return d[0][1];
  for (let i = 1; i < d.length; i++) if (x <= d[i][0]) { const [a0, a1] = d[i - 1], [b0, b1] = d[i]; return b0 === a0 ? b1 : a1 + ((b1 - a1) * (x - a0)) / (b0 - a0); }
  return d[d.length - 1][1];
}

/** 武器在模型上的位置（模型坐标，自龙骨）：atPct = 自舰艏起的百分比；缺省主炮在前 1/4 */
export function weaponLocal(meta: ShipMeta, lengthM: number, w: ShipWeapon | null, aft = false): [number, number] {
  const pct = w?.atPct ?? (aft ? 76 : 26);
  const x = lengthM / 2 - (pct / 100) * lengthM;
  return [x, deckAt(meta, x) + (w?.kind === 'main' ? 3.4 : 2.4)];
}

/** 轻微摇摆（度）：按舰船 id 错开相位；航速越快纵摇越明显 */
export function bob(id: string, tSec: number, speedKn: number, lengthM: number): { roll: number; pitch: number; heave: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const ph = (h & 1023) / 163;
  const small = Math.max(0.35, Math.min(1.6, 160 / Math.max(40, lengthM)));
  const sp = 0.6 + Math.min(1, speedKn / 28) * 0.6;
  return {
    roll: Math.sin(tSec * 0.71 + ph) * 1.6 * small + Math.sin(tSec * 1.37 + ph * 2) * 0.4 * small,
    pitch: Math.sin(tSec * 0.93 + ph * 1.3) * 0.55 * small * sp,
    heave: Math.sin(tSec * 0.83 + ph * 0.7) * 0.35,
  };
}
