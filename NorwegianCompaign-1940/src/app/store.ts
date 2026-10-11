/** 全局状态：极简发布/订阅。时间 t = 自 1940-04-09 00:00 编排时间 起的小时数。 */
import { isoToHours, hoursToDate } from '../schema';

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

export const T_START = isoToHours('1940-04-09T00:00');
export const T_END = isoToHours('1940-06-10T23:59');

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
      terrain: true, hex: false, rivers: true, forest: false, cities: true, control: true, front: true,
      routes: true, routesFull: false, pockets: false, demarcation: false, events: true, units: true,
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
  const d = new Date(hoursToDate(t).getTime());
  const s = `1940年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 星期${WEEK[d.getUTCDay()]}`;
  if (!withTime) return s;
  return `${s} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function fmtShort(t: number): string {
  const d = new Date(hoursToDate(t).getTime());
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function dayIndex(t: number) { return Math.floor(t / 24); }

/** 战役阶段 */
export const PHASES = [
  { from: isoToHours('1940-04-09T00:00'), to: isoToHours('1940-04-14T00:00'), name: '第一阶段 · 多港口突袭', sub: '威悉演习、海峡阻击与两次纳尔维克海战' },
  { from: isoToHours('1940-04-14T00:00'), to: isoToHours('1940-05-04T00:00'), name: '第二阶段 · 中部争夺', sub: '盟军南北登陆、山谷迟滞与中部撤运；北部并行展开' },
  { from: isoToHours('1940-05-04T00:00'), to: isoToHours('1940-06-04T00:00'), name: '第三阶段 · 北部反攻', sub: '比耶克维克、纳尔维克与北部南翼迟滞战' },
  { from: isoToHours('1940-06-04T00:00'), to: isoToHours('1940-06-10T23:59'), name: '第四阶段 · 撤离与占领', sub: 'Alphabet 撤运、政府流亡与本土战役结束' },
];
export function phaseAt(t: number) { return PHASES.find((p) => t >= p.from && t < p.to) ?? PHASES[PHASES.length - 1]; }
