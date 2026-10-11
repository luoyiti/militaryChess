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
    <p class="fine">本页面为历史教学用示意推演。历史国界、阶段战线与部队位置依据官方战史及公开地理数据整理，存在近似与简化；有争议事件均已注明。地图完全离线自绘，未使用任何在线地图瓦片服务。</p>
    <h3>地理数据</h3>
    <ul>
      <li><b>Natural Earth 1:10m</b>（河流、湖泊、海岸、陆地）— 公有领域</li>
      <li><b>1940年开战时国界</b> — Historical Basemaps 1938（GPL-3.0）基础，经官方史料校核修正；自然海岸由 Natural Earth 对齐。<a href="geo/balkans1940.meta.json" target="_blank" rel="noopener">地理处理记录</a></li>
      <li><b>离线周边地理背景</b> — Natural Earth物理地理与Terrarium高程，同一投影独立生成。<a href="geo/context.meta.json" target="_blank" rel="noopener">来源与处理记录</a></li>
      <li><b>Terrain Tiles (Terrarium)</b> — Mapzen / AWS Open Data；SRTM、GMTED2010、ETOPO1 等</li>
    </ul>
    <h3>历史地图</h3><ul>
      <li><a href="history/yugoslavia-1941.jpg" target="_blank" rel="noopener">美国陆军 · 南斯拉夫战役图</a></li>
      <li><a href="history/greece-1941.jpg" target="_blank" rel="noopener">美国陆军 · 希腊本土战役图</a></li>
      <li><a href="history/crete-1941.jpg" target="_blank" rel="noopener">美国陆军 · 克里特空降图</a></li>
    </ul><h3>同期英语档案</h3><p><a href="https://www.nzonscreen.com/videos/return-from-crete-1941/" target="_blank" rel="noopener">Return from Crete（1941）· 新西兰国家电影单位原片</a>，记录撤离后的返航与讲话。此入口需联网。</p>
    ${sec('照片', c.photos)}${sec('音效', c.audio)}${sec('音乐', c.music)}${sec('字体', c.fonts)}
    <p class="fine"><a href="library-credits.json" target="_blank" rel="noopener">复用素材库的完整署名</a> · 页面事件照片使用本战役的新素材。</p>
    <h3>史料（${srcs.length}）</h3>
    <ul class="src-list">${srcs.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${escapeXml(s.title)}</a>` : escapeXml(s.title)}${s.author ? ` — ${escapeXml(s.author)}` : ''}${s.year ? `，${s.year}` : ''}</li>`).join('')}</ul>
  </div>`;
  parent.appendChild(el);
  const close = () => el.remove();
  (el.querySelector('.card-close') as HTMLElement).onclick = close;
  el.onclick = (ev) => { if (ev.target === el) close(); };
}
