/**
 * 卷宗面板（浮在地图右侧，窄屏为底部抽屉）：
 *  - 索引：总台简报、按交战国筛选（任何一方都可以作为视角）、按分区排列的全部卷宗；
 *  - 卷宗：悬停 / 聚焦火漆印时换页——封面照片、代号、交战双方（按清单顺序、按阵营分组）、统计、简介、进入按钮；
 *  - 筹备中的战役显示为加封的绝密卷宗。
 */
import type { CatalogEntry, WorldData } from './types';
import { dayOf, fmtDot, yearOf } from './dates';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface Nation { code: string; zh: string; coalition: string; campaigns: Set<string>; countries: string[] }

export class Dossier {
  readonly el: HTMLElement;
  private readonly body: HTMLElement;
  private readonly tab: HTMLElement;
  current: CatalogEntry | null = null;
  readonly nations: Nation[];
  nation: string | null = null;
  onEnter: (c: CatalogEntry, nointro: boolean) => void = () => {};
  onPick: (c: CatalogEntry) => void = () => {};
  onClose: () => void = () => {};
  onFilter: (n: Nation | null) => void = () => {};
  onToggle: (collapsed: boolean) => void = () => {};

  constructor(host: HTMLElement, private entries: CatalogEntry[], private world: WorldData, private regionOf: (c: CatalogEntry) => string | null) {
    this.nations = this.collectNations();
    this.el = document.createElement('aside');
    this.el.className = 'dossier';
    this.el.setAttribute('aria-label', '战役卷宗');
    this.el.innerHTML = `
      <button type="button" class="panel-toggle" aria-label="收起卷宗面板" title="收起 / 展开卷宗面板"><span>‹</span></button>
      <div class="folder"><button type="button" class="folder-tab"></button><div class="folder-body"></div></div>`;
    host.appendChild(this.el);
    this.body = this.el.querySelector('.folder-body') as HTMLElement;
    this.tab = this.el.querySelector('.folder-tab') as HTMLElement;
    this.el.addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement;
      if (t.closest('.panel-toggle')) { this.setCollapsed(!this.el.classList.contains('collapsed')); return; }
      if (t.closest('.folder-tab')) { this.toggleSheet(); return; }
      const enter = t.closest<HTMLElement>('[data-enter]');
      if (enter && this.current) { ev.preventDefault(); this.onEnter(this.current, enter.dataset.enter === 'free'); return; }
      const pick = t.closest<HTMLElement>('[data-pick]');
      if (pick) { const c = this.entries.find((x) => x.id === pick.dataset.pick); if (c) this.onPick(c); return; }
      const nat = t.closest<HTMLElement>('[data-nation]');
      if (nat) { this.setNation(this.nation === nat.dataset.nation ? null : nat.dataset.nation!); return; }
      if (t.closest('.dz-close')) this.onClose();
    });
    this.showIndex();
  }

  /** 各战役的交战国（合并别名，如挪威战役的 UK → GB） */
  private collectNations(): Nation[] {
    const map = new Map<string, Nation>();
    for (const c of this.entries) for (const s of c.sides) {
      const code = this.world.nations[s.nation]?.alias ?? s.nation;
      const info = this.world.nations[code];
      let n = map.get(code);
      if (!n) { n = { code, zh: info?.zh ?? s.name, coalition: s.coalition ?? 'neutral', campaigns: new Set(), countries: info?.countries ?? [] }; map.set(code, n); }
      n.campaigns.add(c.id);
    }
    return [...map.values()].sort((a, b) => b.campaigns.size - a.campaigns.size || a.zh.localeCompare(b.zh, 'zh'));
  }

  setNation(code: string | null) {
    this.nation = code;
    const n = code ? this.nations.find((x) => x.code === code) ?? null : null;
    this.el.querySelectorAll<HTMLElement>('[data-nation]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.nation === code)));
    this.el.querySelectorAll<HTMLElement>('.dz-index [data-pick]').forEach((b) => b.classList.toggle('dim', !!n && !n.campaigns.has(b.dataset.pick!)));
    const note = this.el.querySelector('.dz-filter-note');
    if (note) note.textContent = n ? `${n.zh}参与的 ${n.campaigns.size} 场战役` : '点选一国，地图只突出它参与的战役';
    this.onFilter(n);
  }

  setCollapsed(v: boolean) {
    this.el.classList.toggle('collapsed', v);
    const t = this.el.querySelector('.panel-toggle') as HTMLElement;
    t.setAttribute('aria-label', v ? '展开卷宗面板' : '收起卷宗面板');
    (t.firstElementChild as HTMLElement).textContent = v ? '卷宗 ›' : '‹';
    try { localStorage.setItem('warroom:panel', v ? 'collapsed' : 'open'); } catch { /* ignore */ }
    this.onToggle(v);
  }
  get collapsed() { return this.el.classList.contains('collapsed'); }
  /** 窄屏抽屉：点标签展开 / 收起 */
  toggleSheet(open?: boolean) { this.el.classList.toggle('sheet-open', open ?? !this.el.classList.contains('sheet-open')); }

  private totals() {
    const pub = this.entries.filter((c) => c.stats);
    const sum = (k: 'units' | 'events' | 'photos') => pub.reduce((n, c) => n + (c.stats?.[k] ?? 0), 0);
    return { campaigns: pub.length, planned: this.entries.filter((c) => c.status === 'planned').length, units: sum('units'), events: sum('events'), photos: sum('photos') };
  }

  showIndex() {
    this.current = null;
    this.el.classList.remove('sealed-file');
    this.el.classList.add('index');
    this.tab.textContent = `卷宗索引 · ${this.entries.length}`;
    const t = this.totals();
    const y0 = yearOf(dayOf(this.world.window.start)), y1 = yearOf(dayOf(this.world.window.end));
    const groups = [...this.world.theatres.map((r) => ({ id: r.id as string | null, zh: r.zh })), { id: null, zh: '其他战区' }]
      .map((g) => ({ ...g, list: this.entries.filter((c) => this.regionOf(c) === g.id).sort((a, b) => dayOf(a.time.start) - dayOf(b.time.start)) }))
      .filter((g) => g.list.length);
    const swatch = (coalition: string) => `<i style="background:${this.world.blocs[coalition]?.color ?? '#8a7d68'}"></i>`;
    this.body.innerHTML = `
      <div class="dz-brief">
        <div class="dz-stamp-row"><span class="stamp red">绝密</span><span class="stamp ink">作战总台</span></div>
        <h2>二战战役推演档案<small>${y0} — ${y1}</small></h2>
        <p class="dz-lede">地图桌上陈列着 ${t.campaigns} 场可进入的战役（${t.units.toLocaleString('zh-CN')} 支部队、${t.events.toLocaleString('zh-CN')} 个历史事件、${t.photos.toLocaleString('zh-CN')} 张档案照片）${t.planned ? `，另有 ${t.planned} 份筹备中的卷宗` : ''}。</p>
        <ul class="dz-how">
          <li><b>拖动 · 滚轮</b>平移与缩放世界地图，顶部切换战区</li>
          <li><b>火漆印</b>悬停或聚焦查看卷宗，点击进入作战室</li>
          <li><b>电报纸带</b>拖动或播放，看各国阵营逐日变化</li>
        </ul>
        <div class="dz-filter">
          <div class="dz-filter-head"><b>交战国</b><span class="dz-filter-note">点选一国，地图只突出它参与的战役</span></div>
          <div class="dz-chips">${this.nations.map((n) => `<button type="button" data-nation="${n.code}" aria-pressed="false" title="${esc(n.zh)}：${n.campaigns.size} 场战役">${swatch(n.coalition)}${esc(n.zh)}<small>${n.campaigns.size}</small></button>`).join('')}</div>
        </div>
        ${groups.map((g) => `
          <h3 class="dz-group">${esc(g.zh)}<small>${g.list.length}</small></h3>
          <ol class="dz-index">${g.list.map((c) => `
            <li><button type="button" data-pick="${c.id}" class="${c.status}">
              <span class="ix-year">${esc(c.title.mark)}</span>
              <span class="ix-title">${esc(c.title.zh)}<small>${esc(c.hub.codename)}</small></span>
              <span class="ix-date">${c.status === 'planned' ? '筹备中' : `${fmtDot(dayOf(c.time.start))}`}</span>
            </button></li>`).join('')}
          </ol>`).join('')}
      </div>`;
    if (this.nation) this.setNation(this.nation);
  }

  show(c: CatalogEntry) {
    if (this.current?.id === c.id) return;
    this.current = c;
    const sealed = c.status === 'planned';
    this.el.classList.remove('index');
    this.el.classList.toggle('sealed-file', sealed);
    const n = String(c.hub.order ?? 0).padStart(2, '0');
    this.tab.textContent = `卷宗 No.${n}`;
    const s = dayOf(c.time.start), e = dayOf(c.time.end);
    const days = e - s + 1;
    // 交战双方：按清单中出现的顺序分组，任何阵营都不预设在前
    const groups = new Map<string, CatalogEntry['sides']>();
    for (const side of c.sides) { const k = side.coalition ?? 'neutral'; groups.set(k, [...(groups.get(k) ?? []), side]); }
    const sides = [...groups].map(([k, list]) => `
      <div class="dz-side"><em><i style="background:${this.world.blocs[k]?.color ?? '#8a7d68'}"></i>${esc(this.world.blocs[k]?.zh ?? '中立')}</em>${list.map((x) => `<span class="chip"><i style="background:${x.color ?? '#777'}"></i>${esc(x.name)}</span>`).join('')}</div>`).join('');
    const parent = c.hub.parent ? this.entries.find((x) => x.id === c.hub.parent) : null;
    const region = this.world.theatres.find((r) => r.id === this.regionOf(c));
    const credit = c.cover?.credit;
    const blurb = sealed ? redact(c.hub.blurb) : esc(c.hub.blurb);
    const st = c.stats;
    this.body.innerHTML = `
      <button type="button" class="dz-close" aria-label="收起卷宗，返回索引">×</button>
      <div class="dz-head">
        ${c.cover && !sealed ? `<figure class="polaroid"><img src="${c.cover.src}" alt="${esc(credit?.caption ?? c.title.zh)}" loading="lazy"/><figcaption>${esc((credit?.caption ?? '').replace(/[；。].*$/, ''))}</figcaption></figure>` : `<div class="polaroid blank"><span>${sealed ? '照片\n尚未归档' : esc(c.title.mark)}</span></div>`}
        <div class="dz-stamps">
          <span class="stamp codename ${[...c.hub.codename].length > 5 ? 'long' : ''}">${esc(c.hub.codename)}</span>
          ${c.hub.codenameOrig ? `<span class="dz-orig">${esc(c.hub.codenameOrig)}</span>` : ''}
          ${sealed ? '<span class="stamp sealed">绝密 · 筹备中</span>' : ''}
        </div>
      </div>
      <h2 class="dz-title"><span class="mark">${esc(c.title.mark)}</span>${esc(c.title.zh)}</h2>
      <div class="dz-en">${esc(c.title.en)}${c.title.orig ? `<i>${esc(c.title.orig)}</i>` : ''}</div>
      <div class="dz-dates">${fmtDot(s)} — ${fmtDot(e)}<span>${sealed ? '计划中' : `历时 ${days} 天`}</span>${region ? `<span>${esc(region.zh)}</span>` : ''}</div>
      ${parent ? `<div class="dz-parent">隶属 <button type="button" data-pick="${parent.id}">${esc(parent.title.zh)}</button> 卷宗</div>` : ''}
      <div class="dz-sides">${sides}</div>
      <p class="dz-blurb">${blurb}</p>
      <dl class="dz-stats">${st ? [['部队', st.units], ['事件', st.events], ['态势帧', st.keyframes], ['照片', st.photos]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') : '<div class="na"><dt>档案</dt><dd>整理中</dd></div>'}</dl>
      <div class="dz-actions">${sealed
        ? '<span class="stamp locked">尚未解密</span>'
        : c.playable
          ? `<a class="btn primary" href="${c.href}?tour" data-enter="tour">进入作战室 · 自动推演</a><a class="btn" href="${c.href}?nointro" data-enter="free">自由浏览</a>`
          : '<span class="stamp locked">尚未开放</span>'}</div>
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
