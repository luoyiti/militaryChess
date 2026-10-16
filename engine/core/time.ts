/**
 * 战役时间：t = 自 manifest.time.epoch 起的小时数（叙事时间按 UTC 计算，不做时区换算）。
 * 由 boot() 调用 initTime() 设定；初始化前调用任何换算都会抛错，防止静默错值。
 */

let epochMs = NaN;
/** 可播放区间（小时） */
export let T_START = NaN;
export let T_END = NaN;
/** 数据时间上限（小时），用于最后一个阶段的结束 */
export let H_END = NaN;
/** 1× 播放速度：每秒推进的小时数 */
export let HOURS_PER_SEC = 4;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** 'YYYY-MM-DDTHH:mm' → 毫秒（当作 UTC）。带日历校验。 */
export function isoMs(iso: string): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error('bad iso ' + iso);
  const [y, mo, d, hh, mm] = m.slice(1).map(Number);
  const ms = Date.UTC(y, mo - 1, d, hh, mm);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d || hh > 23 || mm > 59) throw new Error('bad calendar date ' + iso);
  return ms;
}
export const isIso = (s: unknown): s is string => typeof s === 'string' && ISO_RE.test(s);

export interface TimeConfig { epoch: string; start: string; end: string; dataEnd?: string; hoursPerSec?: number; pace?: { from: string; hoursPerSec: number }[] }

/** 变速播放分段（manifest.time.pace）：[起点小时, 每秒小时数, 该段起点的累计播放秒数] */
let PACE: { h: number; rate: number; sec: number }[] = [];
/** 1× 速度下从 T_START 播到 T_END 的总秒数 */
export let PLAY_TOTAL = NaN;

export function initTime(cfg: TimeConfig) {
  epochMs = isoMs(cfg.epoch);
  T_START = isoToHours(cfg.start);
  T_END = isoToHours(cfg.end);
  H_END = isoToHours(cfg.dataEnd ?? cfg.end);
  HOURS_PER_SEC = cfg.hoursPerSec ?? 4;
  const cues = (cfg.pace ?? []).map((c) => ({ h: isoToHours(c.from), rate: c.hoursPerSec })).sort((a, b) => a.h - b.h);
  // 第一段从 T_START 起：早于第一个 pace 的部分用 hoursPerSec
  const segs: { h: number; rate: number; sec: number }[] = [{ h: T_START, rate: cues.length && cues[0].h <= T_START ? cues.filter((c) => c.h <= T_START).at(-1)!.rate : HOURS_PER_SEC, sec: 0 }];
  for (const c of cues) if (c.h > T_START && c.h < T_END) segs.push({ h: c.h, rate: c.rate, sec: 0 });
  for (let i = 1; i < segs.length; i++) segs[i].sec = segs[i - 1].sec + (segs[i].h - segs[i - 1].h) / segs[i - 1].rate;
  PACE = segs;
  const last = segs[segs.length - 1];
  PLAY_TOTAL = last.sec + (T_END - last.h) / last.rate;
}

/** 时刻 t 的 1× 播放速度（小时/秒） */
export function paceAt(t: number): number {
  let r = PACE[0]?.rate ?? HOURS_PER_SEC;
  for (const s of PACE) { if (s.h <= t) r = s.rate; else break; }
  return r;
}
/** 是否设置了变速播放（时间轴按播放时长展开） */
export const hasPace = () => PACE.length > 1 || (PACE.length === 1 && PACE[0].rate !== HOURS_PER_SEC);
/** 时刻 → 1× 下自 T_START 起的播放秒数 */
export function playSec(t: number): number {
  if (!PACE.length) return (t - T_START) / HOURS_PER_SEC;
  let s = PACE[0];
  for (const x of PACE) { if (x.h <= t) s = x; else break; }
  return s.sec + (t - s.h) / s.rate;
}
/** 播放秒数 → 时刻 */
export function tAtPlaySec(sec: number): number {
  if (!PACE.length) return T_START + sec * HOURS_PER_SEC;
  let s = PACE[0];
  for (const x of PACE) { if (x.sec <= sec) s = x; else break; }
  return s.h + (sec - s.sec) * s.rate;
}
/** 时间轴位置 0..1：有变速播放时按播放时长展开，否则按时间线性 */
export function timeToU(t: number): number {
  const u = hasPace() ? playSec(t) / PLAY_TOTAL : (t - T_START) / (T_END - T_START);
  return Math.max(0, Math.min(1, u));
}
export function uToTime(u: number): number {
  const v = Math.max(0, Math.min(1, u));
  return hasPace() ? tAtPlaySec(v * PLAY_TOTAL) : T_START + v * (T_END - T_START);
}

function epoch(): number {
  if (!Number.isFinite(epochMs)) throw new Error('战役时间未初始化（initTime）');
  return epochMs;
}

/** ISO → 自纪元起的小时数 */
export function isoToHours(iso: string): number {
  return (isoMs(iso) - epoch()) / 3_600_000;
}
export function hoursToDate(h: number): Date {
  return new Date(epoch() + h * 3_600_000);
}
export function hoursToIso(h: number): string {
  return new Date(Math.round((epoch() + h * 3_600_000) / 60_000) * 60_000).toISOString().slice(0, 16);
}

// ---------- 格式化 ----------
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const p2 = (n: number) => String(n).padStart(2, '0');

export function fmtDate(t: number, withTime = true): string {
  const d = hoursToDate(t);
  const s = `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 星期${WEEK[d.getUTCDay()]}`;
  if (!withTime) return s;
  return `${s} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}
export function fmtShort(t: number): string {
  const d = hoursToDate(t);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}
/** 去掉 fmtDate 结果开头的「YYYY年」 */
export const stripYear = (s: string) => s.replace(/^\d{4}年/, '');
export function dayIndex(t: number) { return Math.floor(t / 24); }
