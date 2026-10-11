/**
 * 总台的数据类型：virtual:campaign-catalog（tools/vite/catalog.ts 在构建时从各 campaign.json 生成）
 * 与 hub/occupation.json（时间带上的各国状态）。
 */
import type { HubEntry } from '../engine/campaign/types';

export type LonLat = [number, number];

export interface CatalogEntry {
  id: string;
  status: 'published' | 'draft' | 'planned';
  /** 本次构建/开发中有可进入的战役页面 */
  playable: boolean;
  href: string;
  title: { mark: string; zh: string; sub?: string; en: string; orig?: string; codename?: string };
  time: { start: string; end: string };
  sides: { id: string; name: string; coalition?: 'axis' | 'allies' | 'comintern' | string; color?: string }[];
  hub: HubEntry;
  cover: { src: string; credit: { caption: string; author: string; license: string; url: string } | null } | null;
  phases: { from: string; name: string }[];
  stats: { units: number; events: number; keyframes: number; routes: number; photos: number } | null;
}

/** 国家/分区在某一时刻的状态（缺省为中立） */
export type Status = 'neutral' | 'axis' | 'axis-ally' | 'occupied' | 'contested' | 'allied' | 'soviet' | 'vichy';

export interface StatusChange { from: string; status: Status; note?: string; source?: string }

export interface OccupationData {
  window: { start: string; end: string };
  statuses: Record<Status, { zh: string; desc: string }>;
  countries: Record<string, StatusChange[]>;
  /** 地图上的国名（总台底图 id → 中文名与标注位置、字号） */
  labels: { id: string; zh: string; at: LonLat; size?: number }[];
  dispatches: { date: string; text: string; source?: string }[];
  sources: Record<string, { title: string; url: string }>;
}
