/** 左侧作战简报：兵力对比、当前态势、战斗序列树、图例与图层开关。文字与阵营全部来自 manifest.ui。 */
import type { DB } from '../data/db';
import { store, BASE_LAYERS, type LayerKey } from '../app/store';
import { unitStateAt, isTerminal, type RUnit } from '../model/core';
import { counterSVG, SIDE_ZH, STATUS_ZH, escapeXml, SIDE_COUNTER } from '../map2d/symbols';
import { ECHELON_RANK, type Side, type SideSummary } from '../core/types';
import { manifest, sideOrder } from '../campaign/context';
import { phaseAt } from '../core/phases';
import { isoToHours } from '../core/time';
import { fillCounts } from './intro';

const LAYER_LABELS: Record<string, string> = {
  units: '部队棋子', control: '占领区', front: '战线', routes: '推进箭头', routesFull: '完整推进路线',
  pockets: '包围圈', demarcation: '分界线', events: '事件标记', cities: '城镇', rivers: '河流湖泊',
  forest: '森林沼泽', hex: '六角格', terrain: '地形晕渲',
};

export class Sidebar {
  el: HTMLElement;
  private tab = 'brief';
  onUnit: (id: string) => void = () => {};
  private statusEl!: HTMLElement;
  private treeEl!: HTMLElement;
  private filter = '';
  private openNodes = new Set<string>();
  /** 插件追加的图层（显示在图层开关里） */
  extraLayers: { key: string; label: string }[] = [];

  constructor(parent: HTMLElement, private db: DB) {
    this.el = document.createElement('aside');
    this.el.className = 'sidebar paper';
    this.el.innerHTML = `
      <div class="sb-tabs"><button data-t="brief" class="on">简报</button><button data-t="oob">战斗序列</button><button data-t="legend">图例</button></div>
      <div class="sb-body">
        <section class="sb-pane" data-p="brief"></section>
        <section class="sb-pane hidden" data-p="oob"><input class="sb-search" placeholder="搜索部队 / 指挥官…"/><div class="sb-tree"></div></section>
        <section class="sb-pane hidden" data-p="legend"></section>
      </div>
      <button class="sb-collapse" title="收起/展开">‹</button>`;
    parent.appendChild(this.el);
    if (window.matchMedia('(max-width: 759px)').matches) {
      this.el.classList.add('collapsed');
      (this.el.querySelector('.sb-collapse') as HTMLElement).textContent = '›';
    }
    this.el.querySelectorAll<HTMLButtonElement>('.sb-tabs button').forEach((b) => (b.onclick = () => this.setTab(b.dataset.t!)));
    (this.el.querySelector('.sb-collapse') as HTMLElement).onclick = () => {
      this.el.classList.toggle('collapsed');
      (this.el.querySelector('.sb-collapse') as HTMLElement).textContent = this.el.classList.contains('collapsed') ? '›' : '‹';
      window.dispatchEvent(new Event('sidebar-toggle'));
    };
    this.buildBrief();
    this.treeEl = this.el.querySelector('.sb-tree')!;
    (this.el.querySelector('.sb-search') as HTMLInputElement).oninput = (ev) => { this.filter = (ev.target as HTMLInputElement).value.trim().toLowerCase(); this.buildTree(); };
    for (const r of db.roots) this.openNodes.add(r.id);
    this.buildTree();
    store.on((s, ch) => {
      if (ch.has('t')) this.updateStatus(s.t);
      if (ch.has('selectedUnit')) this.markSelected(s.selectedUnit);
    });
  }

  /** 图层开关需要等插件注册完额外图层后再构建 */
  start() {
    this.buildLegend();
    this.updateStatus(store.get().t);
  }

  setTab(t: string) {
    this.tab = t;
    this.el.querySelectorAll<HTMLButtonElement>('.sb-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    this.el.querySelectorAll<HTMLElement>('.sb-pane').forEach((p) => p.classList.toggle('hidden', p.dataset.p !== t));
  }

  /** 简报面板（插件可替换：见 PluginHooks.sidebarBrief） */
  get briefPane() { return this.el.querySelector('[data-p="brief"]') as HTMLElement; }

  private briefPhase = '';
  private buildBrief(t = store.get().t) {
    const m = manifest();
    const B = m.ui.brief;
    if (B.layout === 'theatres') { this.buildTheatreBrief(); return; }
    const phase = phaseAt(t);
    this.briefPhase = phase.id;
    // 分阶段兵力（manifest.ui.brief.byPhase + forces.byPhase）
    const f = (B.byPhase ? this.db.forces.byPhase?.[phase.id] : undefined) ?? this.db.forces.sides;
    const sides = sideOrder().filter((k) => f[k]);
    const fixed1 = B.menFormat === 'fixed1';
    const nullLabel = B.nullLabel ?? '—';
    const nullBar = B.nullBarWidth ?? 1.5;
    const rows: [string, (s: SideSummary) => number | null][] = [
      ['兵力（万人）', (s) => (s.men == null ? null : s.men / 10000)], ['坦克', (s) => s.tanks], ['飞机', (s) => s.aircraft], ['火炮', (s) => s.guns],
    ];
    const fmt = (label: string, v: number | null) => v == null ? nullLabel : label.includes('万') ? v.toFixed(fixed1 || v < 10 ? 1 : 0) : v.toLocaleString();
    const bar = (label: string, get: (s: SideSummary) => number | null) => {
      const vals = sides.map((k) => get(f[k]));
      const max = Math.max(1, ...vals.map((v) => v ?? 0));
      return `<div class="fc-row"><div class="fc-label">${label}</div>${sides.map((k, i) => `<div class="fc-bar"><i class="side-${k}" style="width:${vals[i] == null ? nullBar : Math.max(1.5, ((vals[i] ?? 0) / max) * 100)}%"></i><span>${fmt(label, vals[i])}</span></div>`).join('')}</div>`;
    };
    const notes = B.notes ?? (B.forceNotes ? 'details' : 'none');
    const notesHtml = notes === 'details'
      ? sides.map((k) => `<details class="force-note"><summary>${SIDE_ZH[k]} · 兵力口径</summary><p>${escapeXml(f[k].note ?? f[k].divisions)}</p></details>`).join('')
      : notes === 'list'
        ? `<h3>${B.notesTitle ?? '编制与史料口径'}</h3>${sides.map((k) => `<p class="force-note list"><b>${SIDE_ZH[k]}</b> · ${escapeXml(f[k].divisions)}<br/><span>${escapeXml(f[k].note ?? '')}</span></p>`).join('')}`
        : '';
    const losses = B.losses === false ? '' : `
      <h3>伤亡与损失</h3>
      <table class="losses"><tr><th></th><th>阵亡</th><th>被俘/失踪</th></tr>
        ${sides.map((k) => `<tr><td><i class="sw side-${k}"></i>${SIDE_ZH[k]}</td><td>${escapeXml(shorten(f[k].losses.killed))}</td><td>${escapeXml(shorten(f[k].losses.captured ?? '—'))}</td></tr>`).join('')}</table>`;
    const rowsHtml = rows.filter(([, g]) => B.showEmptyRows || sides.some((k) => g(f[k]) != null)).map(([l, g]) => bar(l, g)).join('');
    const pane = this.briefPane;
    pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">${B.stamp ?? '绝密 · 作战简报'}</div><h1>${B.title}</h1><div class="sub">${B.sub}</div><div class="sub2">${B.sub2}</div></div>
      ${m.ui.chapterNav === 'sidebar' ? '<div class="chapter-nav"></div>' : ''}<div class="sb-status"></div>
      <h3>${B.byPhase ? `${escapeXml(phase.short)} · ` : ''}交战各方</h3>
      <div class="fc-sides${B.sideColumns === 3 ? ' cols-3' : ''}">${sides.map((k) => `<div class="fc-side"><i class="sw side-${k}"></i><b>${SIDE_ZH[k]}</b><small>${escapeXml(f[k].commander.split(/[；;，,]/)[0])}</small></div>`).join('')}</div>
      <div class="fc">${rowsHtml}<div class="fc-legend">${sides.map((k) => `<span><i class="sw side-${k}"></i>${SIDE_ZH[k]}</span>`).join('')}</div></div>
      ${losses}
      ${notes === 'list' ? `${notesHtml}<p class="fine">${B.fine}</p>` : `<p class="fine">${B.fine}</p>${notesHtml}`}`;
    const prev = this.statusEl?.innerHTML;
    this.statusEl = pane.querySelector('.sb-status')!;
    if (prev) this.statusEl.innerHTML = prev;
    this.briefRebuilt?.(pane);
  }

  /** 并行战区式简报（挪威）：各方折叠说明 + 读图说明；态势区显示各战区阶段与最近事件 */
  private buildTheatreBrief() {
    const m = manifest();
    const B = m.ui.brief;
    const f = this.db.forces.sides;
    const pane = this.briefPane;
    pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">${B.stamp ?? '绝密 · 作战简报'}</div><h1>${B.title}</h1><div class="sub">${B.sub}</div><div class="sub2">${B.sub2}</div></div>
      ${m.ui.chapterNav === 'sidebar' ? '<div class="chapter-nav"></div>' : ''}<div class="sb-status"></div>
      <h3>交战各方</h3>
      <div class="campaign-forces">${sideOrder().filter((k) => f[k]).map((k) => `<details class="force-entry"><summary><i class="sw side-${k}"></i><b>${SIDE_ZH[k]}</b><small>${escapeXml(f[k].commander.split('；')[0])}</small></summary><p>${escapeXml(f[k].divisions)}<br/>${escapeXml(f[k].note ?? '')}</p></details>`).join('')}</div>
      <h3>怎样读这张地图</h3>
      ${(B.paragraphs ?? []).map((p) => `<p class="fine">${fillCounts(p, this.db)}</p>`).join('\n      ')}`;
    this.statusEl = pane.querySelector('.sb-status')!;
  }
  /** 「最近事件」按钮回调 */
  onEvent: (id: string) => void = () => {};

  /** 分阶段简报重建后回调（章节导航、插件面板需要重新挂载） */
  briefRebuilt: ((pane: HTMLElement) => void) | null = null;
  private lastStatusKey = '';
  private lastTreeKey = '';
  private updateStatus(t: number) {
    const m = manifest();
    if (m.ui.brief.byPhase && phaseAt(t).id !== this.briefPhase) this.buildBrief(t);
    const S = m.ui.status;
    const key = String(Math.floor(t / (S.theatres ? 1 : 3)));
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    const markersOnly = m.display?.statusEchelons === 'markers';
    const divisionsOnly = m.display?.statusEchelons === 'divisions';
    const leafOnly = m.display?.statusEchelons === 'leaves';
    const count: Record<string, { act: number; enc: number; out: number }> = {};
    for (const u of this.db.unitList) {
      if (divisionsOnly ? u.echelon !== 'division' && u.echelon !== 'brigade' : ECHELON_RANK[u.echelon] < 0) continue;
      if (leafOnly && u.children.some((id) => !!unitStateAt(id, this.db.units, t))) continue;
      const s = unitStateAt(u.id, this.db.units, t);
      if (!s || (markersOnly ? s.fade <= 0.05 : t < u.fromH)) continue;
      const c = count[u.side] ?? (count[u.side] = { act: 0, enc: 0, out: 0 });
      if (isTerminal(s.status)) c.out++;
      else if (s.status === 'encircled') c.enc++;
      else c.act++;
    }
    const pockets = this.db.pockets.filter((p) => t >= p.h0 && t <= p.h1);
    const cells = S.cells.map((c) => {
      const n = c.sides.reduce((sum, k) => sum + (count[k]?.[c.metric] ?? 0), 0);
      return c.hideZero && !n ? '' : `<div${c.cls ? ` class="${c.cls}"` : ''}><b>${n}</b><span>${c.label}</span></div>`;
    });
    if (S.theatres) {
      // 并行战区：每个战区按时间表显示当前阶段
      const rows = S.theatres.rows.map(([name, states]) => {
        const cur = states.find(([until]) => until === null || t < isoToHours(until)) ?? states[states.length - 1];
        return `<div><b>${name}</b><span>${cur[1]}</span></div>`;
      }).join('');
      const latest = S.latestEvent ? [...this.db.events].reverse().find((e) => e.h <= t) : undefined;
      this.statusEl.innerHTML = `<h3>${S.theatres.title ?? '并行战区态势'}</h3><div class="theater-status">${rows}</div>
      <div class="st-grid">${cells.join('')}</div>
      ${latest ? `<button class="latest-event" data-e="${latest.id}"><small>最近事件 · 点击查看</small><b>${escapeXml(latest.title.zh)}</b></button>` : ''}`;
      this.statusEl.querySelector<HTMLButtonElement>('[data-e]')?.addEventListener('click', (ev) => this.onEvent((ev.currentTarget as HTMLElement).dataset.e!));
    } else {
      this.statusEl.innerHTML = `<h3>当前态势</h3>
      <div class="st-grid">
        ${cells.join('\n        ')}
      </div>
      ${pockets.length ? `<div class="st-pockets">${S.pocketsLabel ?? '包围圈'}：${pockets.map((p) => escapeXml(p.name.zh.replace('包围圈', ''))).join('、')}</div>` : ''}`;
    }
    // 序列树只列当前在场的部队（manifest.ui.treeActiveOnly）：在场集合变化时才重建
    if (m.ui.treeActiveOnly) {
      const treeKey = this.db.unitList.filter((u) => this.activeAt(u, t)).map((u) => u.id).join(',');
      if (treeKey !== this.lastTreeKey) { this.lastTreeKey = treeKey; this.buildTree(); }
    }
  }

  private activeAt(u: RUnit, t: number): boolean {
    return (t >= u.fromH && t <= u.toH + 48) || u.children.some((id) => !!unitStateAt(id, this.db.units, t));
  }

  private buildTree() {
    const q = this.filter;
    const match = (u: RUnit): boolean =>
      !q || [u.name.zh, u.name.orig, u.name.short, u.commander?.zh, u.commander?.orig].some((s) => s?.toLowerCase().includes(q)) || u.children.some((c) => match(this.db.units.get(c)!));
    const activeOnly = !!manifest().ui.treeActiveOnly;
    const t = store.get().t;
    const node = (u: RUnit, depth: number): string => {
      if (!match(u)) return '';
      if (activeOnly && !q && !this.activeAt(u, t)) return '';
      const kids = u.children.map((c) => this.db.units.get(c)!).filter(Boolean);
      const open = q ? true : this.openNodes.has(u.id);
      const mini = `<svg viewBox="-13 -12 26 24" width="24" height="22">${counterSVG({ side: u.side, type: u.type, echelon: u.echelon, label: '', size: 22 })}</svg>`;
      return `<div class="tn d${Math.min(depth, 4)}" data-id="${u.id}">
        <div class="tn-row">${kids.length ? `<button class="tn-tog">${open ? '▾' : '▸'}</button>` : '<span class="tn-sp"></span>'}${mini}<span class="tn-name">${escapeXml(u.name.zh)}</span><span class="tn-cmd">${escapeXml(u.commander?.zh ?? '')}</span></div>
        ${kids.length && open ? `<div class="tn-kids">${kids.map((k) => node(k, depth + 1)).join('')}</div>` : ''}</div>`;
    };
    this.treeEl.innerHTML = sideOrder().map((s: Side) => {
      const roots = this.db.roots.filter((r) => r.side === s).sort((a, b) => ECHELON_RANK[a.echelon] - ECHELON_RANK[b.echelon]);
      const inner = roots.map((r) => node(r, 0)).join('');
      return inner ? `<div class="tree-side"><div class="tree-h" style="border-color:${SIDE_COUNTER[s].bg}">${SIDE_ZH[s]}</div>${inner}</div>` : '';
    }).join('');
    this.treeEl.querySelectorAll<HTMLElement>('.tn-tog').forEach((b) => (b.onclick = (ev) => {
      ev.stopPropagation();
      const id = (b.closest('.tn') as HTMLElement).dataset.id!;
      if (this.openNodes.has(id)) this.openNodes.delete(id); else this.openNodes.add(id);
      this.buildTree();
    }));
    this.treeEl.querySelectorAll<HTMLElement>('.tn-row').forEach((r) => (r.onclick = () => this.onUnit((r.parentElement as HTMLElement).dataset.id!)));
    this.markSelected(store.get().selectedUnit);
  }

  revealUnit(id: string) {
    let u = this.db.units.get(id);
    while (u?.parent) { this.openNodes.add(u.parent); u = this.db.units.get(u.parent); }
    this.buildTree();
  }

  private markSelected(id: string | null) {
    this.treeEl.querySelectorAll('.tn-row.sel').forEach((e) => e.classList.remove('sel'));
    if (!id) return;
    const row = this.treeEl.querySelector(`.tn[data-id="${CSS.escape(id)}"] > .tn-row`);
    row?.classList.add('sel');
    if (this.tab === 'oob') row?.scrollIntoView({ block: 'nearest' });
  }

  /** 图层列表：内置图层（manifest 可改名/隐藏）+ 插件图层 */
  layerList(): [LayerKey, string][] {
    const cfg = manifest().ui.layers ?? {};
    const base = BASE_LAYERS.filter((k) => cfg[k]?.hidden !== true).map((k) => [k, cfg[k]?.label ?? LAYER_LABELS[k]] as [LayerKey, string]);
    const extra = this.extraLayers.map((l) => [l.key, cfg[l.key]?.label ?? l.label] as [LayerKey, string]);
    const order = manifest().ui.layerOrder;
    const all = [...base, ...extra];
    return order ? order.map((k) => all.find(([key]) => key === k)).filter((x): x is [LayerKey, string] => !!x) : all;
  }

  private buildLegend() {
    const m = manifest();
    const pane = this.el.querySelector('[data-p="legend"]') as HTMLElement;
    const c = (side: Side, type: Parameters<typeof counterSVG>[0]['type'], ech: Parameters<typeof counterSVG>[0]['echelon'], label: string) =>
      `<svg viewBox="-17 -15 34 30" width="34" height="30">${counterSVG({ side, type, echelon: ech, label, size: 30 })}</svg>`;
    const s = store.get().layers;
    const L = m.ui.legend;
    pane.innerHTML = `
      <h3>兵种符号（北约 APP-6 风格）</h3>
      <div class="lg-grid">
        ${L.counters.map(([side, type, ech, label]) => `<div>${c(side, type, ech, '')}<span>${label}</span></div>`).join('')}
      </div>
      <h3>梯队标记</h3>
      <div class="lg-ech">${L.echelons ?? '<span><b>XXXX</b> 集团军</span><span><b>XXX</b> 军/作战集群</span><span><b>XX</b> 师</span><span><b>X</b> 旅</span>'}</div>
      <h3>阵营与状态</h3>
      <div class="lg-list">
        ${sideOrder().map((k) => `<div><i class="sw side-${k}"></i>${SIDE_ZH[k]}</div>`).join('')}
        ${L.items.map((h) => `<div>${h}</div>`).join('')}
        ${L.statuses ?? `<div><span class="lg-st">★</span>${STATUS_ZH.engaged}</div><div><span class="lg-st enc">▢</span>${STATUS_ZH.encircled}</div><div><span class="lg-st">✕</span>覆灭 / 投降 / 越境</div>`}
      </div>
      <h3>图层</h3>
      <div class="lg-layers">${this.layerList().map(([k, name]) => `<label><input type="checkbox" data-l="${k}" ${s[k] ? 'checked' : ''}/> ${name}</label>`).join('')}</div>
      <h3>快捷键</h3>
      <div class="lg-keys"><span><kbd>空格</kbd> 播放/暂停</span><span><kbd>←</kbd><kbd>→</kbd> 上/下一事件</span><span><kbd>,</kbd><kbd>.</kbd> 后退/前进 6 小时</span><span><kbd>H</kbd> 回到全图</span><span><kbd>M</kbd> 2D/3D 切换</span><span><kbd>Esc</kbd> 关闭卡片</span></div>`;
    pane.querySelectorAll<HTMLInputElement>('input[data-l]').forEach((i) => (i.onchange = () => store.setLayer(i.dataset.l as LayerKey, i.checked)));
  }
}

function shorten(s: string) {
  const m = s.split(/[（(；;]/)[0].trim();
  return m.length > 22 ? m.slice(0, 22) + '…' : m;
}
export { STATUS_ZH };
