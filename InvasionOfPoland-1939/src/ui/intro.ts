/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。 */
import { photoFor, cleanAuthor } from './eventCard';

export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph = photoFor('File:AGAD Łamanie szlabanu granicznego.jpg') ?? photoFor('File:Bundesarchiv Bild 183-51909-0003, Polen, Schlagbaum, deutsche Soldaten.jpg');
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">GEHEIM · TAJNE · 绝密</div>
      <div class="intro-left">
        <div class="intro-kicker">作战档案 No. 1939/IX</div>
        <h1>九月战役</h1>
        <div class="intro-en">The Invasion of Poland · Kampania wrześniowa</div>
        <div class="intro-dates">1939年8月31日 — 10月6日</div>
        <p>1939年9月1日凌晨，德国从北、西、南三面越过波兰国境；9月17日，苏联红军自东面入侵。三十六天里，波兰军队在两线夹击下节节抵抗，华沙围城二十天，最后一支成建制部队在科克放下武器。</p>
        <p class="intro-how">本推演以复古作战室地图的形式，按小时重现 212 支部队的机动、23 个战线关键帧、15 个包围圈与 62 个历史事件。</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">建议开启声音 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，边界与位置为近似</div>
      </div>
      ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt=""/><figcaption>1939年9月1日，德军士兵拆除波兰边境栏杆（宣传照片）</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : ''}
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
