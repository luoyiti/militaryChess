/** 致谢与许可：本战役的照片/音效/音乐/字体许可（credits.json）、地理数据说明与史料清单（manifest.credits）。 */
import type { DB } from '../data/db';
import { escapeXml } from '../map2d/symbols';
import { manifest } from '../campaign/context';

interface Credit { file?: string; title?: string; author?: string; license?: string; licenseUrl?: string; sourceUrl?: string }

export async function showCredits(parent: HTMLElement, db: DB) {
  let c: Record<string, Credit[]> = {};
  try { c = await fetch('credits.json').then((r) => r.json()); } catch { /* ignore */ }
  const C = manifest().credits;
  const el = document.createElement('div');
  el.className = 'modal';
  const sec = (title: string, items: Credit[] = []) => items.length ? `<h3>${title}（${items.length}）</h3><ul>${items.map((i) => `<li><b>${escapeXml(i.title ?? i.file ?? '')}</b> — ${escapeXml(i.author ?? '佚名')} · ${i.licenseUrl ? `<a href="${i.licenseUrl}" target="_blank" rel="noopener">${escapeXml(i.license ?? '')}</a>` : escapeXml(i.license ?? '')}${i.sourceUrl ? ` · <a href="${i.sourceUrl}" target="_blank" rel="noopener">来源</a>` : ''}</li>`).join('')}</ul>` : '';
  const srcs = [...db.sources.values()];
  const maps = (C.historyMaps ?? []).map((h) => `<figure class="history-map"><a href="${h.href}" target="_blank" rel="noopener"><img src="${h.href}" alt="${h.alt}" style="width:100%"/></a><figcaption>${h.caption}</figcaption></figure>`).join('');
  const sections = C.sections ?? [['照片', 'photos'], ['音效', 'audio'], ['音乐', 'music'], ['英语旁白', 'narration'], ['字体', 'fonts']];
  el.innerHTML = `<div class="modal-box paper">
    <button class="card-close">×</button>
    <h2>资料来源与许可</h2>
    <p class="fine">${C.disclaimer ?? '本页面为历史教学用示意推演。国界、战线与部队位置依据公开史料整理，存在近似与简化；有争议事件均已注明。地图完全离线自绘，未使用任何在线地图瓦片服务。'}</p>
    ${maps ? `<h3>历史地图档案</h3>${maps}` : ''}<h3>地理数据</h3>
    <ul>
      ${C.geodata.map((g) => `<li>${g}</li>`).join('\n      ')}
    </ul>
    ${C.extraHtml ?? ''}
    ${sections.map(([title, key]) => sec(title, c[key])).join('')}
    <h3>史料（${srcs.length}）</h3>
    <ul class="src-list">${srcs.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${escapeXml(s.title)}</a>` : escapeXml(s.title)}${s.author ? ` — ${escapeXml(s.author)}` : ''}${s.year ? `，${s.year}` : ''}</li>`).join('')}</ul>
  </div>`;
  parent.appendChild(el);
  const close = () => el.remove();
  (el.querySelector('.card-close') as HTMLElement).onclick = close;
  el.onclick = (ev) => { if (ev.target === el) close(); };
}
