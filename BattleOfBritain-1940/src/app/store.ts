/** 全局状态：极简发布/订阅。时间 t = 自 1940-07-10 00:00 BST 起的小时数。 */
import { isoToHours, T0 } from '../schema';
import { SCENARIO } from './scenario';

export type LayerKey = 'terrain' | 'hex' | 'rivers' | 'forest' | 'cities' | 'control' | 'front' | 'routes' | 'routesFull' | 'pockets' | 'demarcation' | 'events' | 'units' | 'radar';
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

export const T_START = isoToHours(SCENARIO.start);
export const T_END = isoToHours(SCENARIO.end);

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
      routes: true, routesFull: false, pockets: false, demarcation: true, events: true, units: true, radar: false,
    },
    muted: false,
    musicVol: 0.22,
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
  const d = new Date(T0 + t * 3_600_000);
  const s = `${SCENARIO.year}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 星期${WEEK[d.getUTCDay()]}`;
  if (!withTime) return s;
  return `${s} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function fmtShort(t: number): string {
  const d = new Date(T0 + t * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function dayIndex(t: number) { return Math.floor(t / 24); }

/** 战役阶段 */
export const PHASES = SCENARIO.phases.map((p) => ({ ...p, from:isoToHours(p.from), to:isoToHours(p.to) }));
export function phaseAt(t: number) { return PHASES.find((p) => t >= p.from && t < p.to) ?? PHASES[PHASES.length - 1]; }
