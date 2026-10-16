/**
 * 电文纸带：data/naval signals 按时间逐条打出（最新在上，保留 4 条）。每条：时刻「0616」、发报方、中文译文、原文（贴在电报纸上的打字机纸条）。
 * 播放中新到的电文以电传打字机的速度打出（prefers-reduced-motion 时直接显示）；遇险电文（RRR 袭击舰报告）红色，外交电文另一种墨色。
 * 浮在右上角、顶栏之下，有卡片打开时让到卡片左侧；可折叠（记在 localStorage）。没有电文时隐藏。
 */
import type { DB } from '../data/db';
import { signalsUntil, type RSignal } from '../naval/model';
import { hoursToDate } from '../core/time';
import { escapeXml } from '../map2d/symbols';
import { store } from '../app/store';
import { audio } from '../audio/audio';
import '../styles/naval.css';

const KIND_ZH: Record<NonNullable<RSignal['kind']>, string> = { signal: '旗号', distress: '遇险', radio: '无线电', order: '命令', report: '报告', diplomatic: '外交' };
const SHOW = 4;
const CPS = 48; // 电传打字机：每秒字符数
const KEY = 'naval:tape-collapsed';
const p2 = (n: number) => String(n).padStart(2, '0');

export class SignalTape {
  readonly el: HTMLElement;
  private body: HTMLElement;
  private count: HTMLElement;
  private shown: string[] = [];
  private lastT = -Infinity;
  private typing = 0;
  private reduced: boolean;

  constructor(readonly parent: HTMLElement, readonly db: DB) {
    this.el = document.createElement('div');
    this.el.className = 'signal-tape paper empty';
    this.el.setAttribute('role', 'log');
    this.el.setAttribute('aria-label', '电文纸带');
    this.el.innerHTML = `<div class="st-head" title="展开 / 折叠电文"><b>电文 · SIGNALS</b><span class="st-n"></span><button class="st-tog" aria-label="折叠电文">▾</button></div><div class="st-body"></div>`;
    this.body = this.el.querySelector('.st-body') as HTMLElement;
    this.count = this.el.querySelector('.st-n') as HTMLElement;
    parent.appendChild(this.el);
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let collapsed = window.innerWidth < 760;
    try { const v = localStorage.getItem(KEY); if (v !== null) collapsed = v === '1'; } catch { /* 隐私模式 */ }
    this.el.classList.toggle('collapsed', collapsed);
    (this.el.querySelector('.st-head') as HTMLElement).onclick = () => {
      const c = !this.el.classList.contains('collapsed');
      this.el.classList.toggle('collapsed', c);
      try { localStorage.setItem(KEY, c ? '1' : '0'); } catch { /* 隐私模式 */ }
    };
  }

  setTime(t: number) {
    const list = signalsUntil(this.db.naval, t, SHOW).slice().reverse(); // 最新在上
    const ids = list.map((s) => s.id);
    const total = countUntil(this.db.naval.signals, t);
    this.count.textContent = total ? `${total} / ${this.db.naval.signals.length}` : '';
    this.el.classList.toggle('empty', !list.length);
    if (ids.join('|') === this.shown.join('|')) { this.lastT = t; return; }
    // 播放中向前推进、且只多出一两条：新电文逐字打出；跳转则直接重排
    const fresh = ids.filter((id) => !this.shown.includes(id));
    const animate = !this.reduced && store.get().playing && t >= this.lastT && fresh.length >= 1 && fresh.length <= 2;
    this.lastT = t;
    this.shown = ids;
    window.clearInterval(this.typing);
    this.body.innerHTML = list.map((s) => this.html(s)).join('');
    if (animate) {
      const el = this.body.firstElementChild as HTMLElement | null;
      const sig = list[0];
      if (el && sig && fresh.includes(sig.id)) this.typeIn(el, sig);
      if (!this.el.classList.contains('collapsed')) audio.play(sig?.kind === 'distress' ? 'morse' : 'radio', { volume: 0.22, throttleMs: 1500 });
      this.el.classList.remove('flash'); void this.el.offsetWidth; this.el.classList.add('flash');
    }
  }

  private html(s: RSignal): string {
    const u = this.db.units.get(s.from);
    const from = u ? u.name.short ?? u.name.zh : s.from;
    const to = s.to ? this.db.units.get(s.to)?.name.short ?? s.to : '';
    const kind = s.kind ?? 'signal';
    const d = hoursToDate(s.h);
    return `<div class="st-msg k-${kind} ${u ? `side-${u.side}` : ''}" data-id="${escapeXml(s.id)}">
      <div class="st-meta"><span class="st-time">${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}</span><span class="st-from">${escapeXml(from)}${to ? ` → ${escapeXml(to)}` : ''}</span><span class="st-kind">${KIND_ZH[kind] ?? kind}</span></div>
      <div class="st-zh">${escapeXml(s.zh)}</div>
      ${s.text ? `<div class="st-orig">${escapeXml(s.text)}</div>` : ''}
    </div>`;
  }

  /** 电传打字机：原文逐字出现，打完后显出译文 */
  private typeIn(el: HTMLElement, s: RSignal) {
    const orig = el.querySelector('.st-orig') as HTMLElement | null;
    if (!orig || !s.text) return;
    el.classList.add('typing');
    const full = s.text;
    let i = 0;
    orig.textContent = '';
    const step = Math.max(1, Math.round(CPS / 30));
    this.typing = window.setInterval(() => {
      i = Math.min(full.length, i + step);
      orig.textContent = full.slice(0, i);
      if (i >= full.length) { window.clearInterval(this.typing); el.classList.remove('typing'); }
    }, 1000 / 30);
  }
}

function countUntil(list: RSignal[], t: number): number {
  let n = 0;
  for (const s of list) { if (s.h <= t) n++; else break; }
  return n;
}
