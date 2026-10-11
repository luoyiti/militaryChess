/**
 * 导演模式：播放时跨过重要事件 → 暂停驻留、运镜、打字机事件卡、音效与特效；配乐与氛围随战局切换。
 * 所有战役差异来自 manifest.director / manifest.audio（运镜回位方式、警报规则、配乐与强度时间表）。
 */
import { store } from './store';
import { clock } from './clock';
import type { DB, REvent } from '../data/db';
import type { MapView } from '../map2d/MapView';
import type { EventCard } from '../ui/eventCard';
import type { FxLayer } from '../map2d/fx';
import type { DynamicLayers } from '../map2d/dynamicLayers';
import { audio } from '../audio/audio';
import { isoToHours } from '../core/time';
import { phaseAt } from '../core/phases';
import { manifest, sideDef } from '../campaign/context';
import type { SirenRule } from '../campaign/types';

/** 按时间表取值：最后一个 from ≤ t 的条目；早于第一条时取第一条 */
function cueAt<T extends { from: string }>(cues: T[], t: number): T | undefined {
  let cur = cues[0];
  for (const c of cues) if (isoToHours(c.from) <= t) cur = c;
  return cur;
}

const sirenMatches = (r: SirenRule, e: REvent) =>
  (r.events ? r.events.includes(e.id) : true)
  && (r.idIncludes ? e.id.includes(r.idIncludes) : true)
  && (r.category ? e.category === r.category : true)
  && (r.maxImportance ? e.importance <= r.maxImportance : true);

export class Director {
  private lastT = store.get().t;
  private active: REvent | null = null;
  private generation = 0;
  private fxTimer = 0;
  onEvent3D: ((e: REvent) => void) | null = null;
  /** 插件钩子：展示事件时（如英文旁白） */
  readonly presentHooks: ((e: REvent, hold: boolean) => void)[] = [];
  readonly cancelHooks: (() => void)[] = [];

  constructor(private db: DB, private map: MapView, private card: EventCard, private fx: FxLayer, private dyn: DynamicLayers) {
    store.on((s, ch) => {
      if (ch.has('t')) this.onTime(s.t);
      if (ch.has('playing') && s.playing) this.updateMusic(s.t);
    });
  }

  /** 事件的镜头缩放（相对全图） */
  zoomFor(e: REvent) {
    const [major, minor] = manifest().director.defaultZoom ?? [1.9, 2.6];
    return e.zoomRel ?? (e.importance === 1 ? major : minor);
  }

  private queue: REvent[] = [];
  private returnTimer = 0;

  private onTime(t: number) {
    const s = store.get();
    const prev = this.lastT;
    this.lastT = t;
    if (!s.playing || t <= prev || t - prev > 12) { this.queue = []; this.updateMusic(t); return; }
    const crossed = this.db.events.filter((e) => e.h > prev && e.h <= t);
    const maxImp = s.speed >= 4 ? 1 : 2;
    for (const e of crossed) {
      const major = e.importance <= maxImp;
      if (s.director && major) this.queue.push(e);
      else {
        // 非导演或次要事件：只做轻量提示
        this.fxFor(e, false);
        if (major && !s.director) this.present(e, false);
      }
    }
    this.pump();
    this.updateMusic(t);
  }

  /** 依次展示队列中的重要事件（驻留期间时间暂停，后续事件排队） */
  pump() {
    if (clock.holding || !this.queue.length) return;
    const e = this.queue.shift()!;
    this.present(e, true);
  }

  /** 每帧调用：驻留结束后继续队列 */
  tick() {
    if (!store.get().playing || !store.get().director) return;
    if (!clock.holding && this.queue.length) this.pump();
  }

  /** 镜头回到战略全景：manifest.director.returnTo */
  private returnHome(ms: number) {
    const m = manifest();
    const how = m.director.returnTo ?? 'point';
    if (how === 'home') this.map.home(ms);
    else if (how === 'phase') { const p = phaseAt(store.get().t); if (p.center) this.map.flyTo(p.center, p.zoom ?? 1, ms); else this.map.home(ms); }
    else this.map.flyTo(m.director.returnCenter ?? m.map.home3d, m.map.returnZoom ?? 1.15, ms);
  }

  /** 展示一个事件（可由时间轴/按钮直接调用） */
  present(e: REvent, hold: boolean) {
    const gen = ++this.generation;
    clearTimeout(this.fxTimer);
    this.active = e;
    store.set({ selectedEvent: e.id });
    this.dyn.selectedEvent = e.id;
    const rel = this.zoomFor(e);
    const mode = store.get().mode;
    const m = manifest();
    this.card.show(e, { typewriter: true });
    if (mode === '2d') {
      if (e.wide && m.director.wideGoesHome) this.map.home(1100);
      else this.map.flyTo(e.ll, rel, hold ? 1600 : 1100);
    } else this.onEvent3D?.(e);
    if (hold) {
      const dwell = this.card.dwellMs(e) + 1400;
      clock.hold(dwell);
      // 驻留结束后若短期内没有下一个重要事件，镜头拉回战略全景
      clearTimeout(this.returnTimer);
      this.returnTimer = window.setTimeout(() => {
        const s = store.get();
        if (!s.playing || !s.director || this.queue.length || s.mode !== '2d') return;
        const next = this.db.events.find((x) => x.h > s.t && x.importance <= (s.speed >= 4 ? 1 : 2));
        if (!next || next.h - s.t > 10) this.returnHome(m.director.returnTo === 'home' ? 1800 : 2200);
      }, dwell + 200);
    }
    this.fxTimer = window.setTimeout(() => { if (gen === this.generation) this.fxFor(e, true); }, hold ? 1100 : 300);
    for (const r of m.director.sirens ?? []) if (sirenMatches(r, e)) { audio.play(r.sfx, { volume: r.volume ?? 0.55 }); break; }
    for (const h of this.presentHooks) h(e, hold);
  }

  /** 取消队列与待执行特效（时间跳转、手动打开事件时） */
  cancel() {
    this.queue = [];
    this.active = null;
    clearTimeout(this.returnTimer);
    clearTimeout(this.fxTimer); this.generation++;
    clock.release();
    this.lastT = store.get().t;
    for (const h of this.cancelHooks) h();
  }

  private fxFor(e: REvent, full: boolean) {
    const sfx = e.sfx ?? [];
    const vol = full ? 0.9 : 0.35;
    sfx.slice(0, full ? 3 : 1).forEach((id, i) => window.setTimeout(() => audio.play(id, { volume: vol }), i * 650));
    const air = e.category === 'air' || sfx.includes('stuka') || sfx.includes('bomber');
    if (air && full) this.fx.planesTo(e.ll, sfx.includes('bomber') ? 'bomber' : 'stuka', (e.side && sideDef(e.side).planesFrom) || 'W');
    else if (['battle', 'siege', 'naval', 'atrocity'].includes(e.category)) this.fx.burst(e.ll, full && e.importance === 1);
    else if (full) this.fx.burst(e.ll, false);
  }

  private musicState = '';
  updateMusic(t: number) {
    if (!audio.unlocked) return;
    const a = manifest().audio;
    const want = cueAt(a.music, t)?.track;
    if (want && want !== this.musicState) {
      this.musicState = want;
      audio.playMusic(want, 3000);
    }
    const intensity = cueAt(a.intensity, t)?.value;
    if (intensity !== undefined) audio.setIntensity(intensity);
  }

  get current() { return this.active; }
}
