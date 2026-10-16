/** 底部时间轴（电报纸带风格）：播放控制、日期、阶段色带、事件刻度、可拖动指针。 */
import { store, type Speed } from '../app/store';
import { clock } from '../app/clock';
import type { DB, REvent } from '../data/db';
import { escapeXml } from '../map2d/symbols';
import { isoToHours, hoursToDate, fmtDate, T_START, T_END, timeToU, uToTime, hasPace } from '../core/time';
import { PHASES, phaseAt } from '../core/phases';
import { manifest } from '../campaign/context';
import { upperBound } from '../geo/spatial';

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
  private eventMarks: { el: HTMLElement; h: number }[] = [];
  private eventTimes = new Float64Array();
  private pastCount = 0;
  private dateInput: HTMLInputElement | null = null;
  private trackWidth = 1;
  private lastDate = '';
  private lastInput = '';
  onEventPick: (e: REvent) => void = () => {};

  constructor(parent: HTMLElement, private db: DB) {
    const opt = manifest().ui.timeline ?? {};
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
        ${opt.jump ? '<label class="tl-jump-label"><select class="tl-jump" aria-label="选择历史事件"><option value="">跳转历史事件…</option></select></label>' : ''}${opt.dateInput ? `<input class="tl-date-input" type="date" min="${manifest().time.start.slice(0, 10)}" max="${manifest().time.end.slice(0, 10)}" aria-label="跳转日期"/>` : ''}<div class="tl-phase"></div>
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
    this.dateInput = this.el.querySelector<HTMLInputElement>('.tl-date-input');
    this.needle.style.left = '0';
    new ResizeObserver(([e]) => { this.trackWidth = e.contentRect.width; this.renderTime(store.get().t); }).observe(this.track);
    this.playBtn.onclick = () => this.togglePlay();
    this.speedBtn.onclick = () => {
      const s = store.get().speed;
      store.set({ speed: SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length] });
    };
    this.dirBtn.onclick = () => store.set({ director: !store.get().director });
    (this.el.querySelector('.tl-prev') as HTMLButtonElement).onclick = () => this.stepEvent(-1);
    (this.el.querySelector('.tl-next') as HTMLButtonElement).onclick = () => this.stepEvent(1);
    if (opt.jump) {
      const jump = this.el.querySelector<HTMLSelectElement>('.tl-jump')!;
      jump.insertAdjacentHTML('beforeend', db.events.map((e) => `<option value="${e.id}">${e.at.slice(5, 10)} · ${escapeXml(e.title.zh)}</option>`).join(''));
      jump.onchange = () => { const e = db.events.find((x) => x.id === jump.value); if (e) { this.seek(e.h); this.onEventPick(e); } jump.value = ''; };
    }
    if (opt.dateInput) {
      const dateInput = this.el.querySelector<HTMLInputElement>('.tl-date-input')!;
      dateInput.onchange = () => { if (!dateInput.value || !dateInput.validity.valid) return; this.seek(isoToHours(dateInput.value + 'T12:00')); };
    }
    const onPos = (ev: PointerEvent) => {
      const r = this.track.getBoundingClientRect();
      const u = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      this.seek(uToTime(u));
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

  /** 时间 → 轴位置（%）；有变速播放（manifest.time.pace）时按播放时长展开 */
  private x(t: number) { return timeToU(t) * 100; }

  private buildTrack() {
    const frag: string[] = [];
    for (const p of PHASES) {
      const a = Math.max(T_START, p.from), b = Math.min(T_END, p.to);
      frag.push(`<div class="tl-phase-band" style="left:${this.x(a)}%;width:${this.x(b) - this.x(a)}%"><span>${p.name.split('·')[1]?.trim() ?? p.name}</span></div>`);
    }
    // 日刻度（变速播放时按像素间距省略过密的标签，并在放慢的时段补小时刻度）
    const width = this.track.clientWidth || window.innerWidth - 60;
    let lastLabel = -1e9;
    for (let d = Math.ceil(T_START / 24) * 24; d <= T_END; d += 24) {
      const date = hoursToDate(d);
      const day = date.getUTCDate(), mon = date.getUTCMonth() + 1;
      const major = day === 1 || day % (manifest().ui.timeline?.majorEvery ?? 5) === 0;
      const px = (this.x(d) / 100) * width;
      const label = !hasPace() || px - lastLabel >= (major ? 22 : 30);
      if (label) lastLabel = px;
      frag.push(`<div class="tl-tick ${major ? 'major' : ''}" style="left:${this.x(d)}%"><span>${label ? (day === 1 ? `${mon}月1日` : day) : ''}</span></div>`);
    }
    if (hasPace()) {
      let lastHour = -1e9;
      for (let h = Math.ceil(T_START); h <= T_END; h++) {
        if (h % 24 === 0) continue;
        const span = ((this.x(h + 1) - this.x(h)) / 100) * width;
        if (span < 9) continue;
        const px = (this.x(h) / 100) * width, hh = hoursToDate(h).getUTCHours();
        const label = px - lastHour >= 34 && (span >= 34 || hh % 3 === 0);
        if (label) lastHour = px;
        frag.push(`<div class="tl-tick tl-hour" style="left:${this.x(h)}%"><span>${label ? `${hh}时` : ''}</span></div>`);
      }
    }
    // 关键日期标注
    for (const [iso, name] of manifest().marks ?? []) frag.push(`<div class="tl-mark"${iso === manifest().time.end ? ' data-end' : ''} style="left:${this.x(isoToHours(iso))}%"><span>${name}</span></div>`);
    // 事件刻度
    for (const e of this.db.events) {
      const lanes = manifest().ui.timeline?.lanes;
      frag.push(`<div class="tl-ev imp${e.importance}" data-id="${e.id}"${lanes ? ` title="${escapeXml(e.title.zh)}"` : ''} style="${lanes ? `top:${30 + (e.idx % lanes) * 13}px;` : ''}left:${this.x(e.h)}%;background:${CAT_COLOR[e.category] ?? '#444'}"></div>`);
    }
    this.track.insertAdjacentHTML('afterbegin', frag.join(''));
    this.track.querySelectorAll<HTMLElement>('.tl-ev').forEach((el) => {
      const e = this.db.events.find((x) => x.id === el.dataset.id)!;
      this.eventMarks.push({ el, h: e.h });
      el.addEventListener('pointerenter', () => {
        this.tipEl.innerHTML = `<b>${escapeXml(e.title.zh)}</b><span>${fmtDate(e.h, e.precision !== 'day')}</span>`;
        this.tipEl.style.display = 'block';
        const r = el.getBoundingClientRect(), pr = this.el.getBoundingClientRect();
        this.tipEl.style.left = `${Math.min(pr.width - 240, Math.max(0, r.left - pr.left - 100))}px`;
      });
      el.addEventListener('pointerleave', () => { this.tipEl.style.display = 'none'; });
      el.addEventListener('click', (ev) => { ev.stopPropagation(); this.seek(e.h); this.onEventPick(e); });
    });
    this.eventMarks.sort((a, b) => a.h - b.h);
    this.eventTimes = Float64Array.from(this.eventMarks, mark => mark.h);
  }

  private lastDay = -1;
  private lastPhase = '';
  private renderTime(t: number) {
    this.needle.style.transform = `translateX(${this.x(t) * this.trackWidth / 100}px)`;
    const date = fmtDate(t) + (manifest().ui.timeline?.dateSuffix ?? '');
    if (date !== this.lastDate) { this.lastDate = date; this.dateEl.textContent = date; }
    const dateInput = this.dateInput;
    if (dateInput && document.activeElement !== dateInput) {
      const value = hoursToDate(t).toISOString().slice(0, 10);
      if (value !== this.lastInput || dateInput.value !== value) { this.lastInput = value; dateInput.value = value; }
    }
    const d = Math.floor(t / 24);
    if (d !== this.lastDay || phaseAt(t).id !== this.lastPhase) {
      this.lastPhase = phaseAt(t).id;
      this.lastDay = d;
      const p = phaseAt(t);
      this.phaseEl.innerHTML = `<b>${p.name}</b><span>${p.sub}</span>`;
      this.dateEl.parentElement!.classList.remove('flip');
      void (this.dateEl.parentElement as HTMLElement).offsetWidth;
      this.dateEl.parentElement!.classList.add('flip');
    }
    const count = upperBound(this.eventTimes, t);
    for (let i = Math.min(count, this.pastCount); i < Math.max(count, this.pastCount); i++)
      this.eventMarks[i].el.classList.toggle('past', i < count);
    this.pastCount = count;
  }

  togglePlay() {
    const s = store.get();
    if (!s.playing && s.t >= T_END - 0.5) clock.seek(T_START);
    store.set({ playing: !s.playing });
  }

  stepEvent(dir: 1 | -1) {
    const t = store.get().t;
    const evs = this.db.events.filter((e) => e.importance <= 2);
    const e = dir > 0 ? evs.find((x) => x.h > t + 0.01) : [...evs].reverse().find((x) => x.h < t - 0.01);
    if (e) { this.seek(e.h); this.onEventPick(e); }
  }

  /** 跳转：释放导演驻留；跳转式时间轴（挪威）同时暂停并广播 campaign-seek，清理卡片与导演队列 */
  private seek(t: number) {
    clock.release();
    if (manifest().ui.timeline?.jump) { store.set({ playing: false }); window.dispatchEvent(new Event('campaign-seek')); }
    clock.seek(t);
  }
}
