/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。 */
import { photoFor, cleanAuthor } from './eventCard';

export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph = photoFor('File:HMS Warspite, Norway 1940.jpg');
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">GEHEIM · NORGE · 档案</div>
      <div class="intro-left">
        <div class="intro-kicker">作战档案 No. 1940/IV</div>
        <h1>挪威战役</h1>
        <div class="intro-en">Norwegian Campaign · Operation Weserübung</div>
        <div class="intro-dates">1940年4月9日 — 6月10日</div>
        <p>从奥斯陆峡湾的岸炮，到纳尔维克的雪山与海战。德国以多港口突袭占据挪威海岸，挪威、英国、法国与波兰部队在山谷和峡湾反击；夺回纳尔维克之后，盟军仍因法国战局恶化撤离。</p>
        <p class="intro-how">沿用波兰战役的作战室引擎，通过38个历史事件、35个作战标记、海陆空行动与18个控制关键帧，观察四条并行战役主线。</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">可选音效与合成英语旁白 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，边界与位置为近似</div>
      </div>
      ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt=""/><figcaption>1940年4月13日，英国厌战号参加第二次纳尔维克海战（IWM A38）</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : ''}
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
