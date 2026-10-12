/**
 * 总台的数据类型：virtual:campaign-catalog（tools/vite/catalog.ts 在构建时从各 campaign.json 生成）
 * 与 hub/world.json（世界形势时间表、地名、电报、战区分区）。
 */
import type { HubEntry } from '../engine/campaign/types';

export type LonLat = [number, number];
export type BBox = [number, number, number, number];

export interface CatalogEntry {
  id: string;
  status: 'published' | 'draft' | 'planned';
  /** 本次构建/开发中有可进入的战役页面 */
  playable: boolean;
  href: string;
  title: { mark: string; zh: string; sub?: string; en: string; orig?: string; codename?: string };
  time: { start: string; end: string };
  sides: { id: string; nation: string; name: string; coalition?: string; color?: string }[];
  hub: HubEntry;
  /** 战役页面开场时的地图范围（转场推进镜头的终点） */
  view: { bbox: BBox } | null;
  cover: { src: string; credit: { caption: string; author: string; license: string; url: string } | null } | null;
  phases: { from: string; name: string }[];
  stats: { units: number; events: number; keyframes: number; routes: number; photos: number } | null;
}

/**
 * 国家/分区在某一时刻的状态：
 *   <阵营>            交战国（实色）       <阵营>-aligned   附庸 / 合作政权 / 共同交战国（点纹）
 *   <阵营>-occupied   被该阵营占领（斜线）  contested        交战中（红色交叉线）   neutral  中立
 */
export type Status = string;
export type StatusKind = 'member' | 'aligned' | 'occupied' | 'contested' | 'neutral';
export function parseStatus(s: Status): { kind: StatusKind; bloc?: string } {
  if (s === 'neutral' || s === 'contested') return { kind: s };
  const m = /^([a-z]+)(?:-(aligned|occupied))?$/.exec(s);
  if (!m) return { kind: 'neutral' };
  return { kind: (m[2] as StatusKind | undefined) ?? 'member', bloc: m[1] };
}

export interface StatusChange { from: string; status: Status; note?: string; source?: string }

export interface Theatre { id: string; zh: string; en: string; view: BBox }

export interface WorldData {
  window: { start: string; end: string };
  blocs: Record<string, { zh: string; en: string; color: string }>;
  kinds: Record<StatusKind, { zh: string; desc: string }>;
  theatres: Theatre[];
  /** 阵营代码（campaign.json 的 sides[].nation ?? id）→ 中文名与总台底图中的国家 */
  nations: Record<string, { zh: string; alias?: string; countries: string[] }>;
  /** 底图缺失的宗主国 */
  sovereign: Record<string, string>;
  countries: Record<string, StatusChange[]>;
  /** 地图上的地名（底图 id → 中文名、标注位置、参考字号）；@sea 为海域 */
  labels: { id: string; zh: string; at: LonLat; size?: number }[];
  dispatches: { date: string; text: string; source?: string }[];
  sources: Record<string, { title: string; url: string }>;
}
