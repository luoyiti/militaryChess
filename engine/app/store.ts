/** 全局状态：极简发布/订阅。时间 t = 自战役纪元（manifest.time.epoch）起的小时数。store.init() 由 boot() 调用。 */
import type { CampaignManifest } from '../campaign/types';
import { isoToHours, T_START } from '../core/time';

/** 内置图层（插件可追加，见 manifest.ui.layers 与 CampaignPlugin.layers） */
export const BASE_LAYERS = ['units', 'control', 'front', 'routes', 'routesFull', 'pockets', 'demarcation', 'events', 'cities', 'rivers', 'forest', 'hex', 'terrain'] as const;
export type LayerKey = (typeof BASE_LAYERS)[number] | (string & {});
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
  layers: Record<string, boolean>;
  muted: boolean;
  musicVol: number;
  sfxVol: number;
  started: boolean;
}

const LAYER_DEFAULTS: Record<string, boolean> = {
  terrain: true, hex: true, rivers: true, forest: true, cities: true, control: true, front: true,
  routes: true, routesFull: false, pockets: true, demarcation: true, events: true, units: true,
};

type Listener = (s: AppState, changed: Set<keyof AppState>) => void;

class Store {
  s: AppState = {
    t: 0,
    playing: false,
    speed: 1,
    director: true,
    mode: '2d',
    selectedUnit: null,
    selectedEvent: null,
    followUnit: false,
    layers: { ...LAYER_DEFAULTS },
    muted: false,
    musicVol: 0.5,
    sfxVol: 0.8,
    started: false,
  };
  private ls: Listener[] = [];
  private pending = new Set<keyof AppState>();
  private scheduled = false;

  /** 按战役清单设置初始时刻、图层缺省与音量（boot 时，在任何订阅之前调用） */
  init(m: CampaignManifest, extraLayers: { key: string; default?: boolean }[] = []) {
    this.s.t = T_START;
    for (const l of extraLayers) this.s.layers[l.key] = l.default ?? true;
    for (const [k, v] of Object.entries(m.ui.layers ?? {})) if (v?.default !== undefined) this.s.layers[k] = v.default;
    if (m.audio.musicVol !== undefined) this.s.musicVol = m.audio.musicVol;
  }

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
export { isoToHours };
