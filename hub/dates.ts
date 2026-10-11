/** 总台的日期工具：以 UTC 日为单位（时间带精度为天） */
const DAY = 86400000;
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** 'YYYY-MM-DD' 或 'YYYY-MM-DDTHH:mm' → 自 1970-01-01 起的天数 */
export function dayOf(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
}
export const isoOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
const parts = (day: number) => { const d = new Date(day * DAY); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCDay()]; };

/** 1940年6月22日 */
export const fmtLong = (day: number) => { const [y, m, d] = parts(day); return `${y}年${m}月${d}日`; };
export const weekday = (day: number) => WEEK[parts(day)[3]];
/** 1940.6.22 */
export const fmtDot = (day: number) => { const [y, m, d] = parts(day); return `${y}.${m}.${d}`; };
/** 6.22（同年时省略年份） */
export const fmtShort = (day: number) => { const [, m, d] = parts(day); return `${m}.${d}`; };
export const monthStart = (y: number, m: number) => Math.floor(Date.UTC(y, m - 1, 1) / DAY);
export const yearOf = (day: number) => parts(day)[0];
export const monthOf = (day: number) => parts(day)[1];
