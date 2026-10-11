/** 致谢与许可 */
import type { DB } from '../data/db';
import { escapeXml } from '../map2d/symbols';

interface Credit { file?: string; title?: string; author?: string; license?: string; licenseUrl?: string; sourceUrl?: string }

export async function showCredits(parent: HTMLElement, db: DB) {
  let c: Record<string, Credit[]> = {};
  try { c = await fetch('credits.json').then((r) => r.json()); } catch { /* ignore */ }
  const el = document.createElement('div');
  el.className = 'modal';
  const sec = (title: string, items: Credit[] = []) => items.length ? `<h3>${title}（${items.length}）</h3><ul>${items.map((i) => `<li><b>${escapeXml(i.title ?? i.file ?? '')}</b> — ${escapeXml(i.author ?? '佚名')} · ${i.licenseUrl ? `<a href="${i.licenseUrl}" target="_blank" rel="noopener">${escapeXml(i.license ?? '')}</a>` : escapeXml(i.license ?? '')}${i.sourceUrl ? ` · <a href="${i.sourceUrl}" target="_blank" rel="noopener">来源</a>` : ''}</li>`).join('')}</ul>` : '';
  const srcs = [...db.sources.values()];
  el.innerHTML = `<div class="modal-box paper">
    <button class="card-close">×</button>
    <h2>资料来源与许可</h2>
    <p class="fine">本页面为历史教学用示意推演。国界、战线与部队位置依据公开史料整理，存在近似与简化；有争议事件均已注明。地图完全离线自绘，未使用任何在线地图瓦片服务。</p>
    <h3>历史地图档案</h3><figure class="history-map"><a href="history/crete-1941.jpg" target="_blank" rel="noopener"><img src="history/crete-1941.jpg" alt="1953 年美国陆军战史克里特岛行动示意图" style="width:100%"/></a><figcaption>美国陆军《The German Campaigns in the Balkans》，1953 年，第 7 图。战后战史示意图；点击查看完整图。<a href="https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/index.html" target="_blank" rel="noopener">出版来源</a></figcaption></figure><h3>地理数据</h3>
    <ul>
      <li><b>Natural Earth 1:10m</b>（河流、湖泊、海岸、陆地）— 公有领域</li>
      <li><b>Natural Earth 1:10m 国界</b> — 以克里特岛及周边真实海岸线为地理基础；战役控制区单独叠加，不把空袭、空降航线或海上行动视为占领</li>
      <li><b>Terrain Tiles (Terrarium)</b> — Mapzen / AWS Open Data；SRTM、GMTED2010、ETOPO1 等</li>
    </ul>
    ${sec('照片', c.photos)}${sec('音效', c.audio)}${sec('音乐', c.music)}${sec('英语旁白', c.narration)}${sec('字体', c.fonts)}
    <h3>史料（${srcs.length}）</h3>
    <ul class="src-list">${srcs.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${escapeXml(s.title)}</a>` : escapeXml(s.title)}${s.author ? ` — ${escapeXml(s.author)}` : ''}${s.year ? `，${s.year}` : ''}</li>`).join('')}</ul>
  </div>`;
  parent.appendChild(el);
  const close = () => el.remove();
  (el.querySelector('.card-close') as HTMLElement).onclick = close;
  el.onclick = (ev) => { if (ev.target === el) close(); };
}
