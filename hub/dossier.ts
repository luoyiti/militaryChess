/**
 * 档案夹：悬停 / 聚焦火漆印时滑出该战役的卷宗（封面照片、代号章、交战方、统计、简介、进入按钮）；
 * 未选择时显示总台简报与全部卷宗索引。筹备中的战役显示为加封的绝密卷宗。
 */
import type { CatalogEntry } from './types';
import { dayOf, fmtDot } from './dates';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const COALITION: Record<string, string> = { axis: '轴心国', allies: '同盟国', comintern: '苏联' };

export class Dossier {
  readonly el: HTMLElement;
  private readonly body: HTMLElement;
  current: CatalogEntry | null = null;
  onEnter: (c: CatalogEntry, nointro: boolean) => void = () => {};
  onPick: (c: CatalogEntry) => void = () => {};
  onClose: () => void = () => {};

  constructor(host: HTMLElement, private entries: CatalogEntry[]) {
    this.el = document.createElement('aside');
    this.el.className = 'dossier';
    this.el.setAttribute('aria-label', '战役卷宗');
    this.el.innerHTML = '<div class="folder"><div class="folder-tab"></div><div class="folder-body"></div></div>';
    host.appendChild(this.el);
    this.body = this.el.querySelector('.folder-body') as HTMLElement;
    this.el.addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement;
      const enter = t.closest<HTMLElement>('[data-enter]');
      if (enter && this.current) { ev.preventDefault(); this.onEnter(this.current, enter.dataset.enter === 'free'); return; }
      const pick = t.closest<HTMLElement>('[data-pick]');
      if (pick) { const c = this.entries.find((x) => x.id === pick.dataset.pick); if (c) this.onPick(c); return; }
      if (t.closest('.dz-close')) this.onClose();
    });
    this.showIndex();
  }

  private totals() {
    const pub = this.entries.filter((c) => c.stats);
    const sum = (k: 'units' | 'events' | 'photos') => pub.reduce((n, c) => n + (c.stats?.[k] ?? 0), 0);
    return { campaigns: pub.length, units: sum('units'), events: sum('events'), photos: sum('photos') };
  }

  showIndex() {
    this.current = null;
    this.el.classList.remove('sealed-file');
    this.el.classList.add('index');
    (this.el.querySelector('.folder-tab') as HTMLElement).textContent = '总台简报 · BRIEFING';
    const t = this.totals();
    const list = [...this.entries].sort((a, b) => dayOf(a.time.start) - dayOf(b.time.start));
    this.body.innerHTML = `
      <div class="dz-brief">
        <div class="dz-stamp-row"><span class="stamp red">绝密</span><span class="stamp ink">作战总台</span></div>
        <h2>欧洲战场推演档案<small>1939 — 1941</small></h2>
        <p class="dz-lede">这张地图桌上陈列着 ${t.campaigns} 场战役的作战卷宗：${t.units.toLocaleString('zh-CN')} 支部队、${t.events.toLocaleString('zh-CN')} 个历史事件、${t.photos.toLocaleString('zh-CN')} 张档案照片。</p>
        <ul class="dz-how">
          <li><b>火漆印</b>悬停或聚焦查看卷宗，点击进入作战室</li>
          <li><b>红线</b>按开战日期串起各战役</li>
          <li><b>电报纸带</b>拖动或播放，看欧洲版图逐日变化</li>
        </ul>
        <ol class="dz-index">${list.map((c) => `
          <li><button type="button" data-pick="${c.id}" class="${c.status}">
            <span class="ix-year">${esc(c.title.mark)}</span>
            <span class="ix-title">${esc(c.title.zh)}<small>${esc(c.hub.codename)}</small></span>
            <span class="ix-date">${c.status === 'planned' ? '筹备中' : `${fmtDot(dayOf(c.time.start))}`}</span>
          </button></li>`).join('')}
        </ol>
      </div>`;
  }

  show(c: CatalogEntry) {
    if (this.current?.id === c.id) return;
    this.current = c;
    const sealed = c.status === 'planned';
    this.el.classList.remove('index');
    this.el.classList.toggle('sealed-file', sealed);
    const n = String(c.hub.order ?? 0).padStart(2, '0');
    (this.el.querySelector('.folder-tab') as HTMLElement).textContent = `卷宗 No.${n}`;
    const s = dayOf(c.time.start), e = dayOf(c.time.end);
    const days = e - s + 1;
    const groups = new Map<string, CatalogEntry['sides']>();
    for (const side of c.sides) { const k = side.coalition ?? 'allies'; groups.set(k, [...(groups.get(k) ?? []), side]); }
    const sides = [...groups].sort(([a], [b]) => (a === 'axis' ? -1 : b === 'axis' ? 1 : 0)).map(([k, list]) => `
      <div class="dz-side"><em>${COALITION[k] ?? k}</em>${list.map((x) => `<span class="chip"><i style="background:${x.color ?? '#777'}"></i>${esc(x.name)}</span>`).join('')}</div>`).join('');
    const parent = c.hub.parent ? this.entries.find((x) => x.id === c.hub.parent) : null;
    const credit = c.cover?.credit;
    const blurb = sealed ? redact(c.hub.blurb) : esc(c.hub.blurb);
    const st = c.stats;
    this.body.innerHTML = `
      <button type="button" class="dz-close" aria-label="收起卷宗，返回总台简报">×</button>
      <div class="dz-head">
        ${c.cover && !sealed ? `<figure class="polaroid"><img src="${c.cover.src}" alt="${esc(credit?.caption ?? c.title.zh)}" loading="lazy"/><figcaption>${esc((credit?.caption ?? '').replace(/[；。].*$/, ''))}</figcaption></figure>` : `<div class="polaroid blank"><span>${sealed ? '照片\n尚未归档' : esc(c.title.mark)}</span></div>`}
        <div class="dz-stamps">
          <span class="stamp codename">${esc(c.hub.codename)}</span>
          ${c.hub.codenameOrig ? `<span class="dz-orig">${esc(c.hub.codenameOrig)}</span>` : ''}
          ${sealed ? '<span class="stamp sealed">绝密 · 筹备中</span>' : ''}
        </div>
      </div>
      <h2 class="dz-title"><span class="mark">${esc(c.title.mark)}</span>${esc(c.title.zh)}</h2>
      <div class="dz-en">${esc(c.title.en)}${c.title.orig ? `<i>${esc(c.title.orig)}</i>` : ''}</div>
      <div class="dz-dates">${fmtDot(s)} — ${fmtDot(e)}<span>${sealed ? '计划中' : `历时 ${days} 天`}</span></div>
      ${parent ? `<div class="dz-parent">隶属 <button type="button" data-pick="${parent.id}">${esc(parent.title.zh)}</button> 卷宗</div>` : ''}
      <div class="dz-sides">${sides}</div>
      <p class="dz-blurb">${blurb}</p>
      <dl class="dz-stats">${st ? [['部队', st.units], ['事件', st.events], ['态势帧', st.keyframes], ['照片', st.photos]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') : '<div class="na"><dt>档案</dt><dd>整理中</dd></div>'}</dl>
      <div class="dz-actions">${sealed
        ? '<span class="stamp locked">尚未解密</span>'
        : c.playable
          ? `<a class="btn primary" href="${c.href}" data-enter="tour">进入作战室 · 自动推演</a><a class="btn" href="${c.href}?nointro" data-enter="free">自由浏览</a>`
          : '<span class="stamp locked">迁移中</span>'}</div>
      ${credit && !sealed ? `<div class="dz-credit">封面：${esc(credit.author)} · ${credit.url ? `<a href="${credit.url}" target="_blank" rel="noopener">${esc(credit.license)}</a>` : esc(credit.license)}</div>` : ''}`;
    // 换页动画
    this.el.classList.remove('flip');
    void this.el.offsetWidth;
    this.el.classList.add('flip');
  }

  /** 加封卷宗被点击：轻微抖动 */
  shake() {
    this.el.classList.remove('shake');
    void this.el.offsetWidth;
    this.el.classList.add('shake');
  }
}

/** 绝密卷宗：逐句涂黑一半（确定性，避免每次渲染不同） */
function redact(text: string) {
  return text.split(/(?<=[，；。])/).map((seg, i) => (i % 2 === 1 ? `<span class="redact" role="img" aria-label="已涂黑">${'█'.repeat(Math.max(3, seg.length - 1))}</span>${seg.slice(-1)}` : esc(seg))).join('');
}
