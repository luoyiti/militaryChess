/**
 * 电报纸带：1939—1941 的时间线。拖动或播放时，地图按日期为各国着色、点亮进行中的战区；
 * 纸带上方打出当时最新的一条电报。战役跨度条来自 catalog，电报来自 occupation.json。
 */
import type { CatalogEntry, OccupationData } from './types';
import { dayOf, fmtLong, fmtDot, weekday, monthStart, yearOf, monthOf } from './dates';

const PLAY_DAYS_PER_SEC = 18;

export class Tape {
  readonly el: HTMLElement;
  private readonly strip: HTMLElement;
  private readonly scroll: HTMLElement;
  private readonly cursor: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly dateEl: HTMLElement;
  private readonly playBtn: HTMLButtonElement;
  private readonly tgDate: HTMLElement;
  private readonly tgText: HTMLElement;
  private readonly spansEl: HTMLElement;
  readonly start: number;
  readonly end: number;
  day: number;
  private playing = false;
  private raf = 0;
  private lastDispatch = -1;
  private typing = 0;
  onChange: (day: number) => void = () => {};
  onSpan: (c: CatalogEntry) => void = () => {};
  onType: () => void = () => {};

  constructor(host: HTMLElement, private entries: CatalogEntry[], private occ: OccupationData, initial: number, private reduced: boolean) {
    this.start = dayOf(occ.window.start);
    this.end = dayOf(occ.window.end);
    this.day = Math.max(this.start, Math.min(this.end, initial));
    this.el = document.createElement('section');
    this.el.className = 'tape';
    this.el.setAttribute('aria-label', '电报纸带：1939—1941 年时间线');
    this.el.innerHTML = `
      <div class="tape-controls">
        <button class="tape-play" type="button" aria-label="播放时间线" title="播放 / 暂停（空格）"><span>▶</span></button>
        <div class="tape-date"><b></b><small></small></div>
      </div>
      <div class="tape-telegram" aria-live="polite"><span class="tg-stamp">电报</span><span class="tg-date"></span><span class="tg-text"></span></div>
      <div class="tape-scroll"><div class="tape-strip">
        <div class="tape-months" aria-hidden="true"></div>
        <div class="tape-spans"></div>
        <div class="tape-marks" aria-hidden="true"></div>
        <div class="tape-cursor"><div class="tape-handle" role="slider" tabindex="0" aria-label="时间线日期"></div></div>
      </div></div>`;
    host.appendChild(this.el);
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector(s) as T;
    this.strip = q('.tape-strip');
    this.scroll = q('.tape-scroll');
    this.cursor = q('.tape-cursor');
    this.handle = q('.tape-handle');
    this.dateEl = q('.tape-date');
    this.playBtn = q('.tape-play');
    this.tgDate = q('.tg-date');
    this.tgText = q('.tg-text');
    this.spansEl = q('.tape-spans');
    this.handle.setAttribute('aria-valuemin', String(this.start));
    this.handle.setAttribute('aria-valuemax', String(this.end));
    this.buildMonths();
    this.buildMarks();
    this.layoutSpans();
    new ResizeObserver(() => this.layoutSpans()).observe(this.strip);
    this.bindInput();
    this.render(false);
  }

  private pct(day: number) { return ((day - this.start) / (this.end - this.start)) * 100; }

  private buildMonths() {
    const host = this.el.querySelector('.tape-months')!;
    let html = '';
    for (let y = yearOf(this.start), m = monthOf(this.start); ; m++) {
      if (m > 12) { m = 1; y++; }
      const d = monthStart(y, m);
      if (d > this.end) break;
      if (d < this.start) continue;
      const major = m === 1;
      const label = d - this.start < 20 ? '' : major ? `${y}年` : `${m}月`; // 紧挨起点年份标签的月份不写字
      html += `<span class="tm ${major ? 'year' : ''} ${m % 3 === 1 ? 'q' : ''}" style="left:${this.pct(d).toFixed(3)}%"><i></i><em>${label}</em></span>`;
    }
    host.innerHTML = `<span class="tm year first" style="left:0"><i></i><em>${yearOf(this.start)}年</em></span>` + html;
  }

  private buildMarks() {
    const host = this.el.querySelector('.tape-marks')!;
    host.innerHTML = this.occ.dispatches
      .filter((d) => dayOf(d.date) >= this.start && dayOf(d.date) <= this.end)
      .map((d) => `<i style="left:${this.pct(dayOf(d.date)).toFixed(3)}%" title="${fmtDot(dayOf(d.date))} ${d.text}"></i>`).join('');
  }

  /** 战役跨度条按泳道排列，标签不重叠 */
  private layoutSpans() {
    const width = this.strip.clientWidth || 1000;
    const pxPerDay = width / (this.end - this.start);
    this.strip.classList.toggle('dense', pxPerDay * 30.5 < 34); // 月宽不足时只标季度月
    // 时间带只画落在窗口（occupation.json 的 window）内的战役；窗口外的战役仍在地图上
    const sorted = this.entries.filter((c) => dayOf(c.time.end) >= this.start && dayOf(c.time.start) <= this.end).sort((a, b) => dayOf(a.time.start) - dayOf(b.time.start));
    const lanes: number[] = [];
    let html = '';
    for (const c of sorted) {
      const s = dayOf(c.time.start), e = dayOf(c.time.end);
      // 标签放在条内（够宽）、条右侧，或贴近纸带右端时放在条左侧
      const labelDays = (c.title.zh.length * 11.5 + 12) / pxPerDay;
      const place = (e - s) >= labelDays + 6 / pxPerDay ? 'in' : e + labelDays <= this.end ? 'right' : 'left';
      const from = place === 'left' ? s - labelDays : s;
      const reach = (place === 'right' ? e + labelDays : e) + 6 / pxPerDay;
      let lane = lanes.findIndex((end) => end < from);
      if (lane < 0) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = reach;
      const color = c.sides.find((x) => x.coalition !== 'axis')?.color ?? '#7a2f2f';
      html += `<button type="button" class="tape-span lbl-${place} ${c.status === 'planned' ? 'planned' : ''}" data-id="${c.id}" style="left:${this.pct(s).toFixed(3)}%;width:${Math.max(0.35, this.pct(e) - this.pct(s)).toFixed(3)}%;--lane:${lane};--c:${color}" title="${c.title.zh} ${fmtDot(s)}—${fmtDot(e)}"><span>${c.title.zh}</span></button>`;
    }
    this.strip.style.setProperty('--lanes', String(Math.max(1, lanes.length)));
    this.spansEl.innerHTML = html;
    this.spansEl.querySelectorAll<HTMLButtonElement>('.tape-span').forEach((b) => {
      b.onclick = (ev) => { ev.stopPropagation(); const c = this.entries.find((x) => x.id === b.dataset.id); if (c) this.onSpan(c); };
    });
    this.markSpans();
  }

  private markSpans() {
    this.spansEl.querySelectorAll<HTMLElement>('.tape-span').forEach((b) => {
      const c = this.entries.find((x) => x.id === b.dataset.id);
      b.classList.toggle('active', !!c && dayOf(c.time.start) <= this.day && this.day <= dayOf(c.time.end));
    });
  }
  highlight(id: string | null) { this.spansEl.querySelectorAll<HTMLElement>('.tape-span').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); }

  private bindInput() {
    const fromX = (clientX: number) => {
      const r = this.strip.getBoundingClientRect();
      return Math.round(this.start + Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (this.end - this.start));
    };
    let dragging = false;
    this.strip.addEventListener('pointerdown', (ev) => {
      if ((ev.target as HTMLElement).closest('.tape-span')) return;
      dragging = true;
      this.strip.setPointerCapture(ev.pointerId);
      this.pause();
      this.set(fromX(ev.clientX));
      this.handle.focus({ preventScroll: true });
    });
    this.strip.addEventListener('pointermove', (ev) => { if (dragging) this.set(fromX(ev.clientX)); });
    const stop = () => { dragging = false; };
    this.strip.addEventListener('pointerup', stop);
    this.strip.addEventListener('pointercancel', stop);
    this.handle.addEventListener('keydown', (ev) => {
      const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1, PageDown: -30, PageUp: 30 };
      if (ev.key in step) { ev.preventDefault(); this.pause(); this.set(this.day + step[ev.key] * (ev.shiftKey ? 7 : 1)); }
      else if (ev.key === 'Home') { ev.preventDefault(); this.set(this.start); }
      else if (ev.key === 'End') { ev.preventDefault(); this.set(this.end); }
    });
    this.playBtn.onclick = () => (this.playing ? this.pause() : this.play());
  }

  set(day: number, notify = true) {
    day = Math.max(this.start, Math.min(this.end, Math.round(day)));
    if (day === this.day) return;
    this.day = day;
    this.render(true);
    if (notify) this.onChange(day);
  }

  play() {
    if (this.day >= this.end) this.set(this.start);
    this.playing = true;
    this.el.classList.add('playing');
    this.playBtn.setAttribute('aria-label', '暂停时间线');
    this.playBtn.querySelector('span')!.textContent = '❚❚';
    let last = performance.now(), acc = this.day;
    const step = (now: number) => {
      if (!this.playing) return;
      acc = Math.min(this.end, acc + ((now - last) / 1000) * PLAY_DAYS_PER_SEC);
      last = now;
      this.set(acc);
      this.keepCursorVisible();
      if (acc >= this.end) { this.pause(); return; }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.el.classList.remove('playing');
    this.playBtn.setAttribute('aria-label', '播放时间线');
    this.playBtn.querySelector('span')!.textContent = '▶';
  }
  get isPlaying() { return this.playing; }

  /** 窄屏横向滚动时让游标保持可见 */
  keepCursorVisible() {
    const s = this.scroll;
    if (s.scrollWidth <= s.clientWidth) return;
    const x = (this.pct(this.day) / 100) * this.strip.clientWidth;
    if (x < s.scrollLeft + 40 || x > s.scrollLeft + s.clientWidth - 40) s.scrollLeft = x - s.clientWidth / 2;
  }

  private render(typed: boolean) {
    this.cursor.style.left = `${this.pct(this.day)}%`;
    this.dateEl.querySelector('b')!.textContent = fmtLong(this.day);
    this.dateEl.querySelector('small')!.textContent = weekday(this.day);
    this.handle.setAttribute('aria-valuenow', String(this.day));
    this.handle.setAttribute('aria-valuetext', fmtLong(this.day));
    this.markSpans();
    // 最新电报
    let idx = -1;
    this.occ.dispatches.forEach((d, i) => { if (dayOf(d.date) <= this.day) idx = i; });
    if (idx === this.lastDispatch) return;
    this.lastDispatch = idx;
    const d = this.occ.dispatches[idx];
    this.tgDate.textContent = d ? fmtDot(dayOf(d.date)) : '';
    const text = d ? `${d.text}　STOP` : '欧洲尚未开战　STOP';
    clearInterval(this.typing);
    if (!typed || this.reduced || this.playing) { this.tgText.textContent = text; return; }
    let n = 0;
    this.tgText.textContent = '';
    this.typing = window.setInterval(() => {
      n++;
      this.tgText.textContent = text.slice(0, n);
      if (n % 3 === 1) this.onType();
      if (n >= text.length) clearInterval(this.typing);
    }, 28);
  }
}
