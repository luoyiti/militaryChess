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
    <p class="fine">本页面为历史教学用示意推演。主要据点、行动日期与参战单位依据所列史料整理；控制区是主要据点与交通走廊示意，路线不是精确航迹。地图完全离线自绘，未使用任何在线地图瓦片服务。</p>
    <h3>地理数据</h3>
    <ul>
      <li><b>Natural Earth 1:10m</b>（河流、湖泊、海岸、陆地）— 公有领域</li>
      <li><b>Natural Earth countries</b> — 挪威/瑞典陆界与现代周边背景边界；芬兰/苏联1940年变动未作复原，不作为战役控制区依据</li>
      <li><b>Terrain Tiles (Terrarium, z6)</b> — Mapzen / AWS Open Data；真实高程约公里级，已生成离线纸质瓦片与3D地形</li>
    </ul>
    ${sec('照片', c.photos)}${sec('音效', c.audio)}${sec('音乐', c.music)}<p class="fine">英语旁白为原创摘要，由可选浏览器声音合成；非历史广播录音。未使用原波兰战役配乐。兵棋引擎沿用 InvasionOfPoland-1939 的 D3 / SDF / Three.js / 音频系统。</p>${sec('字体', c.fonts)}
    <h3>史料（${srcs.length}）</h3>
    <ul class="src-list">${srcs.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${escapeXml(s.title)}</a>` : escapeXml(s.title)}${s.author ? ` — ${escapeXml(s.author)}` : ''}${s.year ? `，${s.year}` : ''}</li>`).join('')}</ul>
  </div>`;
  parent.appendChild(el);
  const close = () => el.remove();
  (el.querySelector('.card-close') as HTMLElement).onclick = close;
  el.onclick = (ev) => { if (ev.target === el) close(); };
}
