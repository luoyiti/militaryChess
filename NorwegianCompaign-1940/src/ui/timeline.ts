/** 底部时间轴（电报纸带风格）：播放控制、日期、阶段色带、事件刻度、可拖动指针。 */
import { store, fmtDate, T_START, T_END, PHASES, phaseAt, type Speed } from '../app/store';
import { clock } from '../app/clock';
import type { DB, REvent } from '../data/db';
import { escapeXml } from '../map2d/symbols';
import { isoToHours, hoursToDate } from '../schema';

const CAT_COLOR: Record<string, string> = {
  battle: '#a8262d', air: '#5b4a82', naval: '#2a6474', political: '#3a352c', atrocity: '#4a1515', movement: '#6b5a1e', surrender: '#3d3d3d', siege: '#8a3a1a',
};
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
  private dragging = false;
  onEventPick: (e: REvent) => void = () => {};

  constructor(parent: HTMLElement, private db: DB) {
    this.el = document.createElement('div');
    this.el.className = 'timeline paper';
    this.el.innerHTML = `
      <div class="tl-controls">
        <button class="tl-btn tl-prev" title="上一个事件（←）">⏮</button>
        <button class="tl-btn tl-play" title="播放/暂停（空格）">▶</button>
        <button class="tl-btn tl-next" title="下一个事件（→）">⏭</button>
        <button class="tl-btn tl-speed" title="播放速度">1×</button>
        <button class="tl-btn tl-dir on" title="导演模式：遇重要事件自动停留、运镜、讲解">导演模式</button>
        <div class="tl-date"><span class="tl-date-main"></span></div>
        <label class="tl-jump-label"><select class="tl-jump" aria-label="选择历史事件"><option value="">跳转历史事件…</option></select></label><input class="tl-date-input" type="date" min="1940-04-09" max="1940-06-10" aria-label="跳转日期"/><div class="tl-phase"></div>
      </div>
      <div class="tl-track-wrap"><div class="tl-track"><div class="tl-needle"><div class="tl-needle-head"></div></div></div></div>
      <div class="tl-tip"></div>`;
    parent.appendChild(this.el);
    this.track = this.el.querySelector('.tl-track')!;
    this.needle = this.el.querySelector('.tl-needle')!;
    this.dateEl = this.el.querySelector('.tl-date-main')!;
    this.phaseEl = this.el.querySelector('.tl-phase')!;
    this.playBtn = this.el.querySelector('.tl-play')!;
    this.speedBtn = this.el.querySelector('.tl-speed')!;
    this.dirBtn = this.el.querySelector('.tl-dir')!;
    this.tipEl = this.el.querySelector('.tl-tip')!;
    this.buildTrack();
    const jump = this.el.querySelector<HTMLSelectElement>('.tl-jump')!;
    jump.insertAdjacentHTML('beforeend', db.events.map(e => `<option value="${e.id}">${e.at.slice(5,10)} · ${escapeXml(e.title.zh)}</option>`).join(''));
    jump.onchange = () => { const e = db.events.find(e => e.id === jump.value); if (e) { this.seek(e.h); this.onEventPick(e); } jump.value = ''; };
    const dateInput = this.el.querySelector<HTMLInputElement>('.tl-date-input')!;
    dateInput.onchange = () => { if (!dateInput.value || !dateInput.validity.valid) return; this.seek(isoToHours(dateInput.value + 'T12:00')); };
    this.playBtn.onclick = () => this.togglePlay();
    this.speedBtn.onclick = () => {
      const s = store.get().speed;
      store.set({ speed: SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length] });
    };
    this.dirBtn.onclick = () => store.set({ director: !store.get().director });
    (this.el.querySelector('.tl-prev') as HTMLButtonElement).onclick = () => this.stepEvent(-1);
    (this.el.querySelector('.tl-next') as HTMLButtonElement).onclick = () => this.stepEvent(1);
    const onPos = (ev: PointerEvent) => {
      const r = this.track.getBoundingClientRect();
      const u = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      this.seek(T_START + u * (T_END - T_START));
    };
    this.track.addEventListener('pointerdown', (ev) => {
      if ((ev.target as HTMLElement).classList.contains('tl-ev')) return;
      this.dragging = true;
      this.track.setPointerCapture(ev.pointerId);
      onPos(ev);
    });
    this.track.addEventListener('pointermove', (ev) => { if (this.dragging) onPos(ev); });
    this.track.addEventListener('pointerup', () => { this.dragging = false; });
    store.on((s, ch) => {
      if (ch.has('t')) this.renderTime(s.t);
      if (ch.has('playing')) { this.playBtn.textContent = s.playing ? '❚❚' : '▶'; this.playBtn.classList.toggle('on', s.playing); }
      if (ch.has('speed')) this.speedBtn.textContent = `${s.speed}×`;
      if (ch.has('director')) this.dirBtn.classList.toggle('on', s.director);
    });
    this.renderTime(store.get().t);
  }

  private x(t: number) { return ((t - T_START) / (T_END - T_START)) * 100; }

  private buildTrack() {
    const frag: string[] = [];
    for (const p of PHASES) {
      const a = Math.max(T_START, p.from), b = Math.min(T_END, p.to);
      frag.push(`<div class="tl-phase-band" style="left:${this.x(a)}%;width:${this.x(b) - this.x(a)}%"><span>${p.name.split('·')[1]?.trim() ?? p.name}</span></div>`);
    }
    // 日刻度
    for (let d = Math.ceil(T_START / 24) * 24; d <= T_END; d += 24) {
      const date = hoursToDate(d);
      const day = date.getUTCDate(), mon = date.getUTCMonth() + 1;
      const major = day === 1 || day % 5 === 0;
      frag.push(`<div class="tl-tick ${major ? 'major' : ''}" style="left:${this.x(d)}%"><span>${day === 1 ? `${mon}月1日` : day}</span></div>`);
    }
    // 关键日期标注
    const marks: [string, string][] = [['1940-04-09T00:00', '多港口入侵'], ['1940-04-18T12:00', '中部登陆'], ['1940-05-03T12:00', '中部撤离'], ['1940-05-28T12:00', '夺回纳尔维克'], ['1940-06-10T12:00', '本土结束']];
    for (const [iso, name] of marks) frag.push(`<div class="tl-mark" style="left:${this.x(isoToHours(iso))}%"><span>${name}</span></div>`);
    // 事件刻度
    for (const e of this.db.events) {
      frag.push(`<div class="tl-ev imp${e.importance}" data-id="${e.id}" title="${escapeXml(e.title.zh)}" style="top:${30+(e.idx%3)*13}px;left:${this.x(e.h)}%;background:${CAT_COLOR[e.category] ?? '#444'}"></div>`);
    }
    this.track.insertAdjacentHTML('afterbegin', frag.join(''));
    this.track.querySelectorAll<HTMLElement>('.tl-ev').forEach((el) => {
      const e = this.db.events.find((x) => x.id === el.dataset.id)!;
      el.addEventListener('pointerenter', () => {
        this.tipEl.innerHTML = `<b>${escapeXml(e.title.zh)}</b><span>${fmtDate(e.h)}</span>`;
        this.tipEl.style.display = 'block';
        const r = el.getBoundingClientRect(), pr = this.el.getBoundingClientRect();
        this.tipEl.style.left = `${Math.min(pr.width - 240, Math.max(0, r.left - pr.left - 100))}px`;
      });
      el.addEventListener('pointerleave', () => { this.tipEl.style.display = 'none'; });
      el.addEventListener('click', (ev) => { ev.stopPropagation(); this.seek(e.h); this.onEventPick(e); });
    });
  }

  private lastDay = -1;
  private renderTime(t: number) {
    this.needle.style.left = `${this.x(t)}%`;
    this.dateEl.textContent = fmtDate(t) + ' · 编排';
    const dateInput = this.el.querySelector<HTMLInputElement>('.tl-date-input')!;
    if (document.activeElement !== dateInput) dateInput.value = hoursToDate(t).toISOString().slice(0,10);
    const d = Math.floor(t / 24);
    if (d !== this.lastDay) {
      this.lastDay = d;
      const p = phaseAt(t);
      this.phaseEl.innerHTML = `<b>${p.name}</b><span>${p.sub}</span>`;
      this.dateEl.parentElement!.classList.remove('flip');
      void (this.dateEl.parentElement as HTMLElement).offsetWidth;
      this.dateEl.parentElement!.classList.add('flip');
    }
    this.track.querySelectorAll<HTMLElement>('.tl-ev').forEach((el) => {
      const e = this.db.events[Number(this.db.events.findIndex((x) => x.id === el.dataset.id))];
      el.classList.toggle('past', e.h <= t);
    });
  }

  togglePlay() {
    const s = store.get();
    clock.release();
    if (!s.playing && s.t >= T_END - 0.5) clock.seek(T_START);
    store.set({ playing: !s.playing });
  }

  private seek(t: number) {
    store.set({ playing: false });
    clock.release();
    window.dispatchEvent(new Event('campaign-seek'));
    clock.seek(t);
  }

  stepEvent(dir: 1 | -1) {
    const t = store.get().t;
    const evs = this.db.events.filter((e) => e.importance <= 2);
    const e = dir > 0 ? evs.find((x) => x.h > t + 0.01) : [...evs].reverse().find((x) => x.h < t - 0.01);
    if (e) { this.seek(e.h); this.onEventPick(e); }
  }
}
