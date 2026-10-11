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

export interface TimeConfig { epoch: string; start: string; end: string; dataEnd?: string; hoursPerSec?: number }

export function initTime(cfg: TimeConfig) {
  epochMs = isoMs(cfg.epoch);
  T_START = isoToHours(cfg.start);
  T_END = isoToHours(cfg.end);
  H_END = isoToHours(cfg.dataEnd ?? cfg.end);
  HOURS_PER_SEC = cfg.hoursPerSec ?? 4;
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
