/** 开场：档案袋封面 + 「进入作战室」（首次交互后解锁音频）。 */
import { photoFor, cleanAuthor } from './eventCard';

export function showIntro(parent: HTMLElement, onEnter: (withTour: boolean) => void) {
  const ph = photoFor('File:Bundesarchiv Bild 101I-126-0347-09A, Frankreich, Panzer IV.jpg') ?? photoFor('File:Dunkirk 26-29 May 1940 NYP68075.jpg');
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="intro-bg"></div>
    <div class="intro-folder paper">
      <div class="intro-clip"></div>
      <div class="intro-stamp">GEHEIM · SECRET · 绝密</div>
      <div class="intro-left">
        <div class="intro-kicker">作战档案 No. 1940/V</div>
        <h1>法国战役</h1>
        <div class="intro-en">Fall Gelb · The Battle of France</div>
        <div class="intro-dates">1940年5月10日 — 6月25日</div>
        <p>5月10日拂晓，德军以黄色方案攻入荷兰、比利时和卢森堡，装甲部队穿过阿登，在色当渡过默兹河，十天后到达英吉利海峡。北方的同盟军退入敦刻尔克。6月5日红色方案展开，6月14日巴黎陷落，6月22日在贡比涅签署停战协定。</p>
        <p class="intro-how">这是可播放的基础版：集团军和几支著名装甲部队、十条战线关键帧、若干推进箭头，以及时间轴上的简短事件。位置是示意，不是实测阵地图。</p>
        <div class="intro-btns">
          <button class="btn-enter">进入作战室 · 自动推演</button>
          <button class="btn-free">自由浏览</button>
        </div>
        <div class="intro-note">建议开启声音 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，边界与位置为近似</div>
      </div>
      ${ph ? `<figure class="polaroid intro-photo"><img src="${ph.src}" alt=""/><figcaption>${ph.title || '1940 年法国战役'}</figcaption><div class="credit">${cleanAuthor(ph.author)} · ${ph.license ?? ''}</div></figure>` : ''}
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
