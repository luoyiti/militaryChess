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
import { eventCameraFrame, type CameraFrame } from './camera';
import { eventSorties } from '../model/flight';
import type { PlaneKind } from '../map2d/fx';

const H_PEAK = isoToHours('1940-08-13T00:00');
const H_LONDON = isoToHours('1940-09-07T00:00');

export class Director {
  private lastT = store.get().t;
  private active: REvent | null = null;
  private effectTimers = new Set<number>();
  onEvent3D: ((e: REvent) => void) | null = null;
  onCamera3D: ((frame: CameraFrame, ms: number) => void) | null = null;

  constructor(private db: DB, private map: MapView, private card: EventCard, private fx: FxLayer, private dyn: DynamicLayers) {
    store.on((s, ch) => {
      if (ch.has('t')) this.onTime(s.t);
      if (ch.has('playing') && s.playing) this.updateMusic(s.t);
      if (ch.has('selectedEvent') && s.selectedEvent !== this.active?.id) {
        this.cancelReturn(); this.cancelEffects();
      }
    });
    clock.onSeek((t) => { this.lastT = t; this.queue = []; this.cancelEffects(); });
    map.onManual(() => this.cancelReturn());
  }

  /** 事件的镜头缩放（相对全图） */
  zoomFor(e: REvent) { return Math.max(1,Math.min(8,e.zoom ?? (e.importance===1?2.8:3.4))); }
  frameFor(e: REvent, context = false) { return eventCameraFrame(this.db, e, context); }

  cancelReturn() { clearTimeout(this.returnTimer); this.returnTimer = 0; }

  /** 事件切换和时间跳转取消旧的出击、投弹、音效以及待执行回调。 */
  cancelEffects() {
    this.cancelReturn();
    for (const timer of this.effectTimers) clearTimeout(timer);
    this.effectTimers.clear();
    this.fx.clear();
  }

  private schedule(ms: number, fn: () => void) {
    const timer = window.setTimeout(() => { this.effectTimers.delete(timer); fn(); }, ms);
    this.effectTimers.add(timer);
  }

  /** 切换视图时继续展示当前事件，使用相同战区范围。 */
  reframe(ms = 0) {
    const e = this.db.events.find((x) => x.id === store.get().selectedEvent);
    if (e) this.moveCamera(e, false, ms);
  }

  private moveCamera(e: REvent, context: boolean, ms: number) {
    const frame = this.frameFor(e, context);
    if (store.get().mode === '2d') this.map.flyToFrame(frame, ms);
    else if (this.onCamera3D) this.onCamera3D(frame, ms);
    else this.onEvent3D?.(e);
  }

  private queue: REvent[] = [];
  private returnTimer = 0;

  private onTime(t: number) {
    const s = store.get();
    const prev = this.lastT;
    this.lastT = t;
    if (t === prev) { this.updateMusic(t); return; }
    if (!s.playing || t < prev || t - prev > 12) { this.queue = []; this.cancelReturn(); this.cancelEffects(); this.updateMusic(t); return; }
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
    this.cancelEffects();
    this.active = e;
    // 驻留回到被跨过的事件时刻；同步 lastT，使微任务不会把对齐当作 seek 清掉队列。
    // 手动打开事件的时间仍由调用方管理，seek 与 present 可以在同一微任务发布。
    this.lastT = hold ? e.h : store.get().t;
    this.cancelReturn();
    store.set({ ...(hold ? { t: e.h } : {}), selectedEvent: e.id, selectedUnit: null, followUnit: false });
    this.dyn.selectedEvent = e.id;
    this.card.show(e, { typewriter: true });
    this.moveCamera(e, false, hold ? 1600 : 1100);
    if (hold) {
      const dwell = Math.min(20000,Math.max(15000,this.card.dwellMs(e)+1400));
      clock.hold(dwell);
      // 留在该事件的战区，稍微拉远保留出击／拦截来路。
      this.returnTimer = window.setTimeout(() => {
        const s = store.get();
        if (!s.playing || !s.director || this.queue.length || this.active !== e || s.selectedEvent !== e.id) return;
        const next = this.db.events.find((x) => x.h > s.t && x.importance <= (s.speed >= 4 ? 1 : 2));
        if (!next || next.h - s.t > 10) this.moveCamera(e, true, 2200);
      }, dwell + 200);
    }
    this.schedule(hold ? 1100 : 300, () => this.fxFor(e, true));
    // 伦敦大空袭的警报提示
    if(e.id==='e.london_blitz')audio.play('air_siren',{volume:.5});
  }

  private fxFor(e: REvent, full: boolean) {
    const sfx = e.sfx ?? [];
    const vol = full ? 0.9 : 0.35;
    sfx.slice(0, full ? 3 : 1).forEach((id, i) => this.schedule(i * 650, () => audio.play(id, { volume: vol })));
    const air = e.category === 'air' || sfx.includes('stuka') || sfx.includes('bomber');
    if(air && full) {
      for (const sortie of eventSorties(this.db, e)) {
        const unit = this.db.units.get(sortie.unit);
        const kind: PlaneKind = unit?.model === 'ju87' ? 'stuka' : sortie.role === 'raid' ? 'bomber' : 'fighter';
        this.fx.planesAlong(sortie, kind);
      }
    } else if(['battle','naval'].includes(e.category))this.fx.burst(e.ll,full&&e.importance===1);
  }

  updateMusic(t:number) {
    if(!audio.unlocked)return;
    const intensity=t < H_PEAK ? .16 : t < H_LONDON ? .65 : t < isoToHours('1940-10-03T00:00') ? .5 : .22;
    audio.setIntensity(intensity);
  }

  get current() { return this.active; }
}
