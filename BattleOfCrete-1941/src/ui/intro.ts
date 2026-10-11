/** 沿用档案袋开场和本地照片索引。 */
import { photoFor, cleanAuthor } from './eventCard';
export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph = photoFor('File:German paratroopers and Ju 52 over Crete 1941.jpg');
  const el = document.createElement('div'); el.className = 'intro';
  el.innerHTML = `<div class="intro-bg"></div><div class="intro-folder paper"><div class="intro-clip"></div>
    <div class="intro-stamp">OPERATIONS · 作战档案</div><div class="intro-left">
    <div class="intro-kicker">地中海战区 · No. 1941/V</div><h1>克里特岛战役</h1>
    <div class="intro-en">THE BATTLE OF CRETE · OPERATION MERCURY</div><div class="intro-dates">1941年5月20日 — 6月1日</div>
    <p>空降兵落在岛屿北岸，守军分散保卫机场和港口。马莱迈机场的失守打开了德军空运增援的通道；西部防线逐步东移，英联邦部队随后翻越山地，撤往南岸。皇家海军在空袭下完成分批撤运。</p>
    <p class="intro-how">沿时间轴观察四处空降战区、地面控制区和撤退路线。选择部队查看编制与经历，或开启导演模式，按事件逐步推演。路线、位置及部分时刻为史料支持的示意重建。</p>
    <div class="intro-btns"><button class="btn-enter">进入作战室 · 自动推演</button><button class="btn-free">自由浏览</button></div>
    <div class="intro-note">滚轮缩放 · 拖动地图 · 空格播放 · H 全岛 · M 切换 3D</div></div>
    ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt="克里特岛战役历史照片"/><figcaption>${ph.title}</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : `<div class="intro-operation"><span>MERKUR</span><b>35° N / 25° E</b><small>CRETE · MAY 1941</small></div>`}</div>`;
  parent.appendChild(el); const go=(tour:boolean)=>{el.classList.add('leaving');window.setTimeout(()=>el.remove(),900);onEnter(tour);};
  (el.querySelector('.btn-enter') as HTMLElement).onclick=()=>go(true);(el.querySelector('.btn-free') as HTMLElement).onclick=()=>go(false);return el;
}
