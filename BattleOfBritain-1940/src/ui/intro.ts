/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。 */
import { photoFor, cleanAuthor } from './eventCard';

export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph=photoFor('File:The Battle of Britain HU54418.jpg');
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">SECRET · RAF · 绝密</div>
      <div class="intro-left">
        <div class="intro-kicker">作战档案 No. 1940/VII</div>
        <h1>不列颠空战</h1>
        <div class="intro-en">The Battle of Britain</div>
        <div class="intro-dates">1940年7月10日 — 10月31日</div>
        <p>1940年夏，德国空军跨越海峡，试图夺取英国上空的制空权。皇家空军依靠雷达、地面指挥和战斗机中队，迎击一轮又一轮的空袭。从海峡船队到防空机场，再到伦敦，两军在英伦上空展开决战。</p>
        <p class="intro-how">沿时间轴探索五个阶段、十五个关键事件，查看双方编制、示意出击航线和空战态势。地图与3D沙盘共用同一战役时钟。</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">建议开启声音 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，航迹与空战范围为重建示意</div>
      </div>
      ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt=""/><figcaption>1940年7月29日，霍金奇机场的第32中队飞行员</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : ''}
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
