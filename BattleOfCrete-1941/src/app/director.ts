/** 导演模式：播放时跨过重要事件 → 暂停驻留、运镜、打字机事件卡、音效与特效；配乐随战局切换。 */
import { store } from './store';
import { clock } from './clock';
import type { DB, REvent } from '../data/db';
import type { MapView } from '../map2d/MapView';
import type { EventCard } from '../ui/eventCard';
import type { FxLayer } from '../map2d/fx';
import type { DynamicLayers } from '../map2d/dynamicLayers';
import { audio } from '../audio/audio';
import { isoToHours } from '../schema';

import { eventZoom } from './cameraZoom';
const H_CHANNEL = isoToHours('1941-05-22T12:00');
const H_PARIS = isoToHours('1941-05-27T12:00');

export class Director {
  private lastT = store.get().t;
  private active: REvent | null = null;
  onEvent3D: ((e: REvent) => void) | null = null;

  constructor(private db: DB, private map: MapView, private card: EventCard, private fx: FxLayer, private dyn: DynamicLayers) {
    store.on((s, ch) => {
      if (ch.has('t')) this.onTime(s.t);
      if (ch.has('playing') && s.playing) this.updateMusic(s.t);
    });
  }

  /** 事件的镜头缩放（相对全图） */
  zoomFor(e: REvent) { return eventZoom(e.zoom ?? (e.importance === 1 ? 3 : 4)); }

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

  /** 每帧调用：驻留结束后继续队列；长时间无事件则拉回战略全景 */
  tick() {
    if (!store.get().playing || !store.get().director) return;
    if (!clock.holding && this.queue.length) this.pump();
  }

  /** 展示一个事件（可由时间轴/按钮直接调用） */
  present(e: REvent, hold: boolean) {
    this.active = e;
    store.set({ selectedEvent: e.id });
    this.dyn.selectedEvent = e.id;
    const rel = this.zoomFor(e);
    const mode = store.get().mode;
    this.card.show(e, { typewriter: true });
    if (mode === '2d') this.map.flyTo(e.ll, rel, hold ? 1600 : 1100);
    else this.onEvent3D?.(e);
    if (hold) {
      const dwell = this.card.dwellMs(e) + 1400;
      clock.hold(dwell);
      // 驻留结束后若短期内没有下一个重要事件，镜头拉回战略全景
      clearTimeout(this.returnTimer);
      this.returnTimer = window.setTimeout(() => {
        const s = store.get();
        if (!s.playing || !s.director || this.queue.length || s.mode !== '2d') return;
        const next = this.db.events.find((x) => x.h > s.t && x.importance <= (s.speed >= 4 ? 1 : 2));
        if (!next || next.h - s.t > 10) this.map.flyTo([24.62, 35.23], 1.15, 2200);
      }, dwell + 200);
    }
    window.setTimeout(() => this.fxFor(e, true), hold ? 1100 : 300);
    if ((e.id === 'e.crete_maleme' || e.id === 'e.crete_chania') && e.importance === 1) audio.play('siren', { volume: 0.55 });
  }

  private fxFor(e: REvent, full: boolean) {
    const sfx = e.sfx ?? [];
    const vol = full ? 0.9 : 0.35;
    sfx.slice(0, full ? 3 : 1).forEach((id, i) => window.setTimeout(() => audio.play(id, { volume: vol }), i * 650));
    const air = e.category === 'air' || sfx.includes('stuka') || sfx.includes('bomber');
    if (air && full) this.fx.planesTo(e.ll, sfx.includes('bomber') ? 'bomber' : 'stuka', e.side === 'DE' ? 'E' : 'W');
    else if (['battle', 'siege', 'naval', 'atrocity'].includes(e.category)) this.fx.burst(e.ll, full && e.importance === 1);
    else if (full) this.fx.burst(e.ll, false);
  }

  private musicState = '';
  updateMusic(t: number) {
    if (!audio.unlocked) return;
    const want = t >= H_PARIS ? 'elegy' : 'advance';
    if (want !== this.musicState) {
      this.musicState = want;
      audio.playMusic(want, 3000);
    }
    const intensity = t < isoToHours('1941-05-20T08:00') ? 0.08 : t < H_CHANNEL ? 0.72 : t < H_PARIS ? 0.55 : 0.28;
    audio.setIntensity(intensity);
  }

  get current() { return this.active; }
}
