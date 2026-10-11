/** 电报纸带总时间轴：六章入口、按像素分组的事件、播放与导演。 */
import { store, fmtDate, T_START, T_END, PHASES, phaseAt, type Speed } from '../app/store';
import type { Chapter } from '../app/campaign';
import { clock } from '../app/clock';
import type { DB, REvent } from '../data/db';
import { escapeXml } from '../map2d/symbols';
import { T0 } from '../schema';

const CAT_COLOR: Record<string, string> = { battle: '#a8262d', air: '#5b4a82', naval: '#2a6474', political: '#3a352c', atrocity: '#4a1515', movement: '#6b5a1e', surrender: '#3d3d3d', siege: '#8a3a1a' };
const SPEEDS: Speed[] = [0.5, 1, 2, 4, 8];

export class Timeline {
  el: HTMLElement;
  private track: HTMLElement;
  private needle: HTMLElement;
  private dateEl: HTMLElement;
  private phaseEl: HTMLElement;
  private playBtn: HTMLButtonElement;
  private speedBtn: HTMLButtonElement;
  private dirBtn: HTMLButtonElement;
  private tipEl: HTMLElement;
  private menu: HTMLElement;
  private dragging = false;
  private groups = new Map<string, REvent[]>();
  onEventPick: (e: REvent) => void = () => {};
  onChapter: (p: Chapter) => void = () => {};

  constructor(parent: HTMLElement, private db: DB) {
    this.el = document.createElement('div');
    this.el.className = 'timeline paper';
    this.el.innerHTML = `
      <nav class="tl-chapters" aria-label="战役章节">${PHASES.map((p, i) => `<button data-chapter="${p.id}" title="${escapeXml(p.name)}">${i + 1}. ${p.short}</button>`).join('')}</nav>
      <div class="tl-controls">
        <button class="tl-btn tl-prev" title="上一个事件（←）">⏮</button><button class="tl-btn tl-play" title="播放/暂停（空格）">▶</button><button class="tl-btn tl-next" title="下一个事件（→）">⏭</button>
        <button class="tl-btn tl-speed" title="播放速度">1×</button><button class="tl-btn tl-dir on" title="重要事件自动停留、运镜、说明">导演模式</button>
        <div class="tl-date"><span class="tl-date-main"></span></div><div class="tl-phase"></div>
      </div>
      <div class="tl-track-wrap"><div class="tl-track"><div class="tl-needle"><div class="tl-needle-head"></div></div></div></div>
      <div class="tl-tip"></div><div class="tl-event-menu hidden"></div>`;
    parent.appendChild(this.el);
    this.track = this.el.querySelector('.tl-track')!; this.needle = this.el.querySelector('.tl-needle')!;
    this.dateEl = this.el.querySelector('.tl-date-main')!; this.phaseEl = this.el.querySelector('.tl-phase')!;
    this.playBtn = this.el.querySelector('.tl-play')!; this.speedBtn = this.el.querySelector('.tl-speed')!; this.dirBtn = this.el.querySelector('.tl-dir')!;
    this.tipEl = this.el.querySelector('.tl-tip')!; this.menu = this.el.querySelector('.tl-event-menu')!;
    this.buildTrack();
    this.playBtn.onclick = () => this.togglePlay();
    this.speedBtn.onclick = () => store.set({ speed: SPEEDS[(SPEEDS.indexOf(store.get().speed) + 1) % SPEEDS.length] });
    this.dirBtn.onclick = () => store.set({ director: !store.get().director });
    (this.el.querySelector('.tl-prev') as HTMLButtonElement).onclick = () => this.stepEvent(-1);
    (this.el.querySelector('.tl-next') as HTMLButtonElement).onclick = () => this.stepEvent(1);
    this.el.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach((b) => b.onclick = () => {
      const p = PHASES.find((x) => x.id === b.dataset.chapter)!;
      clock.release(); this.menu.classList.add('hidden'); store.set({ playing: false }); clock.seek(p.from); this.onChapter(p);
    });
    const onPos = (ev: PointerEvent) => { const r = this.track.getBoundingClientRect(); const u = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); clock.release(); this.menu.classList.add('hidden'); clock.seek(T_START + u * (T_END - T_START)); };
    this.track.addEventListener('pointerdown', (ev) => { if ((ev.target as HTMLElement).closest('.tl-ev')) return; this.dragging = true; this.track.setPointerCapture(ev.pointerId); onPos(ev); });
    this.track.addEventListener('pointermove', (ev) => { if (this.dragging) onPos(ev); });
    this.track.addEventListener('pointerup', () => { this.dragging = false; });
    this.track.addEventListener('pointercancel', () => { this.dragging = false; });
    document.addEventListener('pointerdown', (ev) => { if (!this.el.contains(ev.target as Node)) this.menu.classList.add('hidden'); });
    new ResizeObserver(() => { this.buildTrack(); this.renderTime(store.get().t); }).observe(this.track);
    store.on((s, ch) => {
      if (ch.has('t')) this.renderTime(s.t);
      if (ch.has('playing')) { this.playBtn.textContent = s.playing ? '❚❚' : '▶'; this.playBtn.classList.toggle('on', s.playing); }
      if (ch.has('speed')) this.speedBtn.textContent = `${s.speed}×`;
      if (ch.has('director')) this.dirBtn.classList.toggle('on', s.director);
    });
    this.renderTime(store.get().t);
  }

  private x(t: number) { return (t - T_START) / (T_END - T_START) * 100; }
  private pick(e: REvent) { this.menu.classList.add('hidden'); clock.release(); clock.seek(e.h); this.onEventPick(e); }
  private buildTrack() {
    const width = this.track.clientWidth || window.innerWidth - 60;
    const frag: string[] = [];
    for (const p of PHASES) { const a = Math.max(T_START, p.from), b = Math.min(T_END, p.to); frag.push(`<div class="tl-phase-band" style="left:${this.x(a)}%;width:${this.x(b) - this.x(a)}%"><span>${p.short}</span></div>`); }
    let lastLabelX = -100;
    for (let d = Math.ceil(T_START / 24) * 24; d <= T_END; d += 24) {
      const date = new Date(T0 + d * 3600000), day = date.getUTCDate();
      if (day !== 1 && day !== 11 && day !== 21) continue;
      const px = this.x(d) / 100 * width, show = day === 1 || px - lastLabelX >= 55;
      if (show) lastLabelX = px;
      frag.push(`<div class="tl-tick ${day === 1 ? 'major' : ''}" style="left:${this.x(d)}%"><span>${show ? day === 1 ? `${date.getUTCMonth() + 1}月` : day : ''}</span></div>`);
    }
    this.groups.clear();
    for (const e of this.db.events) { const k = String(Math.floor(this.x(e.h) / 100 * width / 12)); const g = this.groups.get(k) ?? []; g.push(e); this.groups.set(k, g); }
    for (const [key, events] of this.groups) {
      const e = events.reduce((a, b) => a.importance <= b.importance ? a : b);
      frag.push(`<button class="tl-ev imp${e.importance}${events.length > 1 ? ' grouped' : ''}" data-group="${key}" title="${escapeXml(events.length > 1 ? `${events.length}条事件，点击选择` : e.title.zh)}" style="left:${this.x(events[0].h)}%;background:${CAT_COLOR[e.category] ?? '#444'}">${events.length > 1 ? events.length : ''}</button>`);
    }
    this.track.innerHTML = frag.join(''); this.track.appendChild(this.needle);
    this.track.querySelectorAll<HTMLButtonElement>('.tl-ev').forEach((el) => {
      const events = this.groups.get(el.dataset.group!)!;
      el.onpointerenter = () => { this.tipEl.innerHTML = `<b>${escapeXml(events[0].title.zh)}${events.length > 1 ? ` 等${events.length}条` : ''}</b><span>${fmtDate(events[0].h, events[0].precision === 'minute')}</span>`; this.tipEl.style.display = 'block'; const r = el.getBoundingClientRect(), pr = this.el.getBoundingClientRect(); this.tipEl.style.left = `${Math.max(8, Math.min(pr.width - 245, r.left - pr.left - 100))}px`; };
      el.onpointerleave = () => { this.tipEl.style.display = 'none'; };
      el.onclick = (ev) => {
        ev.stopPropagation(); this.tipEl.style.display = 'none';
        if (events.length === 1) { this.pick(events[0]); return; }
        this.menu.innerHTML = `<b>选择历史事件</b>${events.map((e) => `<button data-event="${e.id}"><small>${fmtDate(e.h, false)}</small><span>${escapeXml(e.title.zh)}</span></button>`).join('')}`;
        this.menu.classList.remove('hidden');
        this.menu.querySelectorAll<HTMLButtonElement>('[data-event]').forEach((b) => b.onclick = () => this.pick(events.find((e) => e.id === b.dataset.event)!));
      };
    });
  }
  private renderTime(t: number) {
    this.needle.style.left = `${this.x(t)}%`; this.dateEl.textContent = fmtDate(t);
    const p = phaseAt(t); this.phaseEl.innerHTML = `<b>${p.name}</b><span>${p.sub}</span>`;
    this.el.querySelectorAll('[data-chapter]').forEach((b) => { const on = (b as HTMLElement).dataset.chapter === p.id; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false'); });
    this.track.querySelectorAll<HTMLElement>('.tl-ev').forEach((el) => el.classList.toggle('past', this.groups.get(el.dataset.group!)![0].h <= t));
  }
  togglePlay() { const s = store.get(); if (!s.playing && s.t >= T_END - .01) clock.seek(T_START); store.set({ playing: !s.playing }); }
  stepEvent(dir: 1 | -1) { const t = store.get().t; const evs = this.db.events; const current = evs.findIndex((e) => e.id === store.get().selectedEvent && Math.abs(e.h - t) < .001); const e = current >= 0 ? evs[current + dir] : dir > 0 ? evs.find((x) => x.h > t + .001) : [...evs].reverse().find((x) => x.h < t - .001); if (e) this.pick(e); }
}
