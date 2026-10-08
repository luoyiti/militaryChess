/** 全局状态：极简发布/订阅。时间 t = 自 1939-08-31 00:00 CET 起的小时数。 */
import { isoToHours } from '../schema';

export type LayerKey = 'terrain' | 'hex' | 'rivers' | 'forest' | 'cities' | 'control' | 'front' | 'routes' | 'routesFull' | 'pockets' | 'demarcation' | 'events' | 'units';
export type Speed = 0.5 | 1 | 2 | 4 | 8;

export interface AppState {
  t: number;
  playing: boolean;
  speed: Speed;
  director: boolean;
  mode: '2d' | '3d';
  selectedUnit: string | null;
  selectedEvent: string | null;
  followUnit: boolean;
  layers: Record<LayerKey, boolean>;
  muted: boolean;
  musicVol: number;
  sfxVol: number;
  started: boolean;
}

export const T_START = isoToHours('1939-08-31T18:00');
export const T_END = isoToHours('1939-10-06T23:00');

type Listener = (s: AppState, changed: Set<keyof AppState>) => void;

class Store {
  s: AppState = {
    t: T_START,
    playing: false,
    speed: 1,
    director: true,
    mode: '2d',
    selectedUnit: null,
    selectedEvent: null,
    followUnit: false,
    layers: {
      terrain: true, hex: true, rivers: true, forest: true, cities: true, control: true, front: true,
      routes: true, routesFull: false, pockets: true, demarcation: true, events: true, units: true,
    },
    muted: false,
    musicVol: 0.5,
    sfxVol: 0.8,
    started: false,
  };
  private ls: Listener[] = [];
  private pending = new Set<keyof AppState>();
  private scheduled = false;

  get() { return this.s; }
  on(fn: Listener) { this.ls.push(fn); return () => { this.ls = this.ls.filter((x) => x !== fn); }; }
  set(patch: Partial<AppState>) {
    for (const k of Object.keys(patch) as (keyof AppState)[]) {
      if (this.s[k] !== patch[k]) { (this.s as unknown as Record<string, unknown>)[k] = patch[k]; this.pending.add(k); }
    }
    if (this.pending.size && !this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => {
        this.scheduled = false;
        const changed = new Set(this.pending);
        this.pending.clear();
        for (const l of this.ls) l(this.s, changed);
      });
    }
  }
  setLayer(k: LayerKey, v: boolean) { this.set({ layers: { ...this.s.layers, [k]: v } }); }
}

export const store = new Store();

// ---------- 时间格式 ----------
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
export function fmtDate(t: number, withTime = true): string {
  const d = new Date(Date.UTC(1939, 7, 31) + t * 3_600_000);
  const s = `1939年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 星期${WEEK[d.getUTCDay()]}`;
  if (!withTime) return s;
  return `${s} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function fmtShort(t: number): string {
  const d = new Date(Date.UTC(1939, 7, 31) + t * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function dayIndex(t: number) { return Math.floor(t / 24); }

/** 战役阶段 */
export const PHASES = [
  { from: isoToHours('1939-08-31T00:00'), to: isoToHours('1939-09-07T00:00'), name: '第一阶段 · 边境交战', sub: '走廊被切断，西里西亚失守，波军全线后撤' },
  { from: isoToHours('1939-09-07T00:00'), to: isoToHours('1939-09-17T00:00'), name: '第二阶段 · 维斯瓦河与布祖拉', sub: '华沙被围，布祖拉反击，拉多姆覆灭' },
  { from: isoToHours('1939-09-17T00:00'), to: isoToHours('1939-10-07T00:00'), name: '第三阶段 · 苏军入侵与最后抵抗', sub: '两线夹击，华沙、莫德林、赫尔、科克相继投降' },
];
export function phaseAt(t: number) { return PHASES.find((p) => t >= p.from && t < p.to) ?? PHASES[PHASES.length - 1]; }
