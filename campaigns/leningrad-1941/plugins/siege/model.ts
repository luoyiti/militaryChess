/** 本战役的日精度史料状态。叙事日期按清单的莫斯科时间解释，不作浏览器时区换算。 */
export interface RationRecord {
  from: string; workers: number; employees: number; dependents: number; children: number;
  note: string; sources: string[];
}
export type TransportState = 'regular' | 'restricted' | 'uncertain';
export interface TransportSegment { from: string; until?: string; state: TransportState; note: string; sources: string[] }
export interface LogisticsRoute { id: string; key: string; label: string; segments: TransportSegment[] }
export interface CivicRecord { from: string; title: string; body: string; sources: string[] }
export interface EvidenceNote { eventId: string; paragraphs: string[]; sources: string[] }
export interface MilitaryStatistics {
  eventId: string; title: string; period: string; scope: string; definition: string; sources: string[];
  rows: { label: string; initial: number; irrecoverable: number; sanitary: number }[];
}
export type ComparisonMode = 'time' | 'history';

export function latestAt<T extends { from: string }>(records: readonly T[], at: string): T | undefined {
  let latest: T | undefined;
  for (const record of records) if (record.from <= at && (!latest || record.from > latest.from)) latest = record;
  return latest;
}

export function transportAt(route: LogisticsRoute, at: string): TransportSegment | undefined {
  return latestAt(route.segments.filter((s) => !s.until || at < s.until), at);
}

/** 返回 undefined 表示无须通知 store；始终保留用户的总开关及其他图层。 */
export function reconcileLayers(current: Record<string, boolean>, routes: readonly LogisticsRoute[], at: string, mode: ComparisonMode): Record<string, boolean> | undefined {
  const effective = Object.fromEntries(routes.map((route) => [route.key, current.logistics !== false && (mode === 'history' || !!transportAt(route, at))]));
  return Object.keys(effective).some((key) => current[key] !== effective[key]) ? { ...current, ...effective } : undefined;
}

export function siegeAt(at: string): { stage: 'prelude' | 'closed' | 'corridor' | 'lifted'; label: string; day: number | null; detail: string } {
  if (at < '1941-09-08T00:00') return { stage: 'prelude', label: '围城前奏', day: null, detail: '北方推进与城市动员；正式围城计时尚未开始。' };
  const day = Math.min(872, Math.floor((Date.parse(`${at.slice(0, 10)}T00:00:00Z`) - Date.parse('1941-09-08T00:00:00Z')) / 86400000) + 1);
  if (at >= '1944-01-27T00:00') return { stage: 'lifted', label: '完全解除围城', day, detail: '872天围城结束。北侧芬军仍在地峡，外围作战继续。' };
  if (at >= '1943-01-18T00:00') return { stage: 'corridor', label: '突破封锁 · 仍受炮击', day, detail: '拉多加湖南岸打通狭窄走廊，城市尚未完全解围。' };
  return { stage: 'closed', label: '陆上交通被切断', day, detail: '湖上与空中联系仍在；补给和撤离受到季节、火力与接驳能力限制。' };
}
