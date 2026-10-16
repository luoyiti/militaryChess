/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。文字来自 manifest.intro；{units} 等占位符按数据实时计数。 */
import { photoFor, cleanAuthor } from './eventCard';
import { manifest } from '../campaign/context';
import type { DB } from '../data/db';

export function fillCounts(s: string, db: DB): string {
  const n: Record<string, number> = {
    units: db.units.size, events: db.events.length, keyframes: db.keyframes.length, pockets: db.pockets.length, routes: db.routes.length, photos: 0,
  };
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in n ? String(n[k]) : m));
}

export function showIntro(parent: HTMLElement, db: DB, onEnter: (withTour: boolean) => void) {
  const I = manifest().intro;
  let ph = photoFor(I.photo) ?? photoFor(I.photoFallback);
  const el = document.createElement('div');
  el.className = 'intro';
  const figureHTML = () => ph
    ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt="${I.photoAlt ?? ''}"/><figcaption>${I.caption ?? ph.title ?? ''}</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>`
    : I.operation ? `<div class="intro-operation"><span>${I.operation.code}</span><b>${I.operation.coords}</b><small>${I.operation.label}</small></div>` : '';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">${I.stamp}</div>
      <div class="intro-left">
        <div class="intro-kicker">${I.kicker}</div>
        <h1>${I.title}</h1>
        <div class="intro-en">${I.en}</div>
        <div class="intro-dates">${I.dates}</div>
        ${I.paragraphs.map((p) => `<p>${fillCounts(p, db)}</p>`).join('\n        ')}
        <p class="intro-how">${fillCounts(I.how, db)}</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">${I.note}</div>
      </div>
      ${figureHTML()}
    </div>`;
  parent.appendChild(el);
  if (!ph) window.addEventListener('photos-ready', () => {
    if (!el.isConnected) return;
    ph = photoFor(I.photo) ?? photoFor(I.photoFallback);
    if (ph) { el.querySelector('.intro-operation')?.remove(); el.querySelector('.intro-folder')?.insertAdjacentHTML('beforeend', figureHTML()); }
  }, { once: true });
  const go = (tour: boolean) => {
    el.classList.add('leaving');
    window.setTimeout(() => el.remove(), 900);
    onEnter(tour);
  };
  (el.querySelector('.btn-enter') as HTMLElement).onclick = () => go(true);
  (el.querySelector('.btn-free') as HTMLElement).onclick = () => go(false);
  return el;
}
