/** 事件档案卡：打字机正文、宝丽来照片（带署名许可）、涉及部队、来源。 */
import type { DB, REvent } from '../data/db';
import { fmtDate } from '../app/store';
import { escapeXml, SIDE_ZH } from '../map2d/symbols';
import { audio } from '../audio/audio';

export interface PhotoMeta { src: string; w: number; h: number; title?: string; author?: string; license?: string; licenseUrl?: string; sourceUrl?: string; caption?: string }
let photoIndex: Record<string, PhotoMeta> | null = null;
export async function loadPhotoIndex(): Promise<Record<string, PhotoMeta>> {
  if (photoIndex) return photoIndex;
  try { photoIndex = await fetch('photos/index.json').then((r) => r.json()); } catch { photoIndex = {}; }
  return photoIndex!;
}
export function photoFor(commons?: string): PhotoMeta | null {
  if (!commons || !photoIndex) return null;
  return photoIndex[commons] ?? photoIndex[commons.replace(/_/g, ' ')] ?? null;
}

/** 作者字段清洗：去掉 Commons 描述性长文与重复片段 */
export function cleanAuthor(a?: string): string {
  if (!a) return '佚名';
  let s = a.replace(/\s+/g, ' ').trim();
  s = s.split(/\s*[.;。]\s+|\s+Crop from|\s+\(/)[0];
  const half = s.slice(0, Math.floor(s.length / 2)).trim();
  if (half && s.replace(half, '').trim() === half) s = half;
  if (/^unknown/i.test(s)) s = '佚名';
  return s.length > 42 ? s.slice(0, 40) + '…' : s;
}

const CAT_ZH: Record<string, string> = { battle: '战斗', air: '空袭', naval: '海战', political: '政治', atrocity: '暴行', movement: '行动', surrender: '投降', siege: '围城' };

export class EventCard {
  el: HTMLElement;
  private typing = 0;
  current: REvent | null = null;
  onUnit: (id: string) => void = () => {};
  onNav: (dir: 1 | -1) => void = () => {};
  onClose: () => void = () => {};

  constructor(parent: HTMLElement, private db: DB) {
    this.el = document.createElement('div');
    this.el.className = 'event-card paper hidden';
    parent.appendChild(this.el);
  }

  show(e: REvent, opts: { typewriter?: boolean } = {}) {
    this.current = e;
    const ph = photoFor(e.photo?.commons);
    const units = (e.units ?? []).map((id) => this.db.units.get(id)).filter(Boolean);
    const srcs = e.sources.map((s) => this.db.sources.get(s)).filter(Boolean);
    const placeName = this.nearestPlace(e);
    this.el.innerHTML = `
      <button class="card-close" title="关闭">×</button>
      <div class="ec-stamp cat-${e.category}">${CAT_ZH[e.category] ?? ''}</div>
      <div class="ec-meta"><span class="ec-date">${fmtDate(e.h, e.timePrecision === 'minute')}${e.timePrecision === 'day' ? ' · 当日' : ''}${e.endAt ? ` — ${fmtDate(e.h1, false).replace('1940年', '')}` : ''}</span><span class="ec-place">📍 ${escapeXml(placeName)}</span></div>
      <h2 class="ec-title">${escapeXml(e.title.zh)}</h2>
      ${e.title.orig ? `<div class="ec-orig">${escapeXml(e.title.orig)}</div>` : ''}
      ${ph ? `<figure class="polaroid"><img src="${ph.src}" alt="" loading="lazy"/><figcaption>${escapeXml(e.photo?.caption ?? ph.caption ?? '')}</figcaption>
        <div class="credit">${escapeXml(cleanAuthor(ph.author))} · <a href="${ph.sourceUrl ?? '#'}" target="_blank" rel="noopener">${escapeXml(ph.license ?? '')}</a></div></figure>` : ''}
      <p class="ec-body typewriter"></p>
      ${e.narration ? `<details class="ec-narration"><summary>English briefing · <button class="ec-speak" type="button">朗读</button></summary><p>${escapeXml(e.narration)}</p><small>可选浏览器合成英语声音 · 非历史录音</small></details>` : ''}
      ${e.mapNote ? `<p class="ec-map-note">${escapeXml(e.mapNote)}</p>` : ''}
      ${units.length ? `<div class="ec-units">${units.map((u) => `<button class="chip side-${u!.side}" data-u="${u!.id}">${escapeXml(u!.name.zh)}</button>`).join('')}</div>` : ''}
      <div class="ec-foot">
        <div class="ec-src">来源：${srcs.map((s) => s!.url ? `<a href="${s!.url}" target="_blank" rel="noopener">${escapeXml(s!.title)}</a>` : escapeXml(s!.title)).join('；')}${e.confidence !== 'high' ? `<span class="conf">（可信度：${e.confidence === 'medium' ? '中' : '低'}）</span>` : ''}</div>
        <div class="ec-nav"><button class="ec-prev">‹ 上一事件</button><button class="ec-next">下一事件 ›</button></div>
      </div>
      ${e.side ? `<div class="ec-side side-${e.side}">${SIDE_ZH[e.side]}</div>` : ''}`;
    this.el.classList.remove('hidden');
    this.el.classList.remove('enter');
    void this.el.offsetWidth;
    this.el.classList.add('enter');
    (this.el.querySelector('.card-close') as HTMLElement).onclick = () => this.hide();
    (this.el.querySelector('.ec-prev') as HTMLElement).onclick = () => this.onNav(-1);
    (this.el.querySelector('.ec-next') as HTMLElement).onclick = () => this.onNav(1);
    this.el.querySelectorAll<HTMLElement>('.chip').forEach((b) => (b.onclick = () => this.onUnit(b.dataset.u!)));
    this.el.querySelector<HTMLButtonElement>('.ec-speak')?.addEventListener('click', ev => { ev.preventDefault(); audio.narrate(e.narration, true); });
    const body = this.el.querySelector('.ec-body') as HTMLElement;
    cancelAnimationFrame(this.typing);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (opts.typewriter === false || reduced) { body.textContent = e.body; body.classList.add('done'); return; }
    const text = [...e.body];
    let i = 0, last = 0;
    const cps = 38;
    const t0 = performance.now();
    const step = (now: number) => {
      const n = Math.min(text.length, Math.floor(((now - t0) / 1000) * cps));
      if (n > i) {
        body.textContent = text.slice(0, n).join('');
        if (now - last > 90) { audio.play('typewriter', { volume: 0.18, throttleMs: 1800 }); last = now; }
        i = n;
      }
      if (i < text.length) this.typing = requestAnimationFrame(step);
      else body.classList.add('done');
    };
    body.classList.remove('done');
    this.typing = requestAnimationFrame(step);
  }

  /** 事件正文完整显示所需毫秒数（导演模式驻留时间） */
  dwellMs(e: REvent) {
    return Math.max(5200, Math.min(12000, 2600 + [...e.body].length * 48));
  }

  hide() {
    this.el.classList.add('hidden');
    cancelAnimationFrame(this.typing);
    this.current = null;
    audio.stopNarration();
    this.onClose();
  }

  private nearestPlace(e: REvent): string {
    if ((e.zoom ?? 3) <= 1.5) return e.category === 'political' ? '外交/政治（示意位置）' : '全线';
    let best = '', bd = Infinity;
    for (const p of this.db.places) {
      const d = (p.pos[0] - e.ll[0]) ** 2 * 0.4 + (p.pos[1] - e.ll[1]) ** 2;
      if (d < bd) { bd = d; best = p.zh + (p.orig && p.orig !== p.zh ? `（${p.orig}）` : ''); }
    }
    return bd < 0.05 ? best : `${best} 附近`;
  }
}
