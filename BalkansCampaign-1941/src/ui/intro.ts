/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。 */
import { photoFor, campaignPhoto, cleanAuthor } from './eventCard';

export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph = photoFor('File:Bundesarchiv Bild 101I-200-1342-17, Griechenland, Gebirgsjäger.jpg') ?? campaignPhoto();
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">GEHEIM · SECRET · 绝密</div>
      <div class="intro-left">
        <div class="intro-kicker">作战档案 No. 1941/B</div>
        <h1>巴尔干战役</h1>
        <div class="intro-en">The Balkans Campaign · Greece, Yugoslavia & Crete</div>
        <div class="intro-dates">1940年10月28日 — 1941年6月1日</div>
        <p>从意军由阿尔巴尼亚入侵希腊，到希军反攻与冬季山地战；从德军多路突破南斯拉夫、希腊本土，到英联邦撤退与克里特空降。这份作战档案以连续时间轴呈现七个月的战线变化。</p>
        <p class="intro-how">六个章节同步展示部队、推进方向和事件说明。全景以集团军与军团呈现，放大可查看关键师与旅；每个历史节点均附来源。路线与战线为战役级重建。</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">建议开启声音 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，边界与位置为近似</div>
      </div>
      ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt=""/><figcaption>${ph.title || '巴尔干战场'}</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : ''}
    </div>`;
  parent.appendChild(el);
  const go = (tour: boolean) => {
    el.classList.add('leaving');
    window.setTimeout(() => el.remove(), 900);
    onEnter(tour);
  };
  (el.querySelector('.btn-enter') as HTMLElement).onclick = () => go(true);
  (el.querySelector('.btn-free') as HTMLElement).onclick = () => go(false);
  return el;
}
