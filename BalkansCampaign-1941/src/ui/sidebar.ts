/** 左侧作战简报：兵力对比、当前态势、战斗序列树、图例与图层开关。 */
import type { DB } from '../data/db';
import { store, phaseAt, type LayerKey } from '../app/store';
import { unitStateAt, type RUnit } from '../model/core';
import { counterSVG, SIDE_ZH, STATUS_ZH, escapeXml, SIDE_COUNTER } from '../map2d/symbols';
import { ECHELON_RANK, SIDES, AXIS, ALLIES, type Side, type SideSummary } from '../schema';

const LAYERS: [LayerKey, string][] = [
  ['units', '部队棋子'], ['control', '占领区'], ['front', '战线'], ['routes', '推进箭头'], ['routesFull', '完整推进路线'],
  ['pockets', '包围圈'], ['demarcation', '停战线'], ['events', '事件标记'], ['cities', '城镇'], ['rivers', '河流湖泊'],
  ['forest', '森林沼泽'], ['hex', '六角格'], ['terrain', '地形晕渲'],
];

export class Sidebar {
  el: HTMLElement;
  private tab = 'brief';
  onUnit: (id: string) => void = () => {};
  private statusEl!: HTMLElement;
  private treeEl!: HTMLElement;
  private filter = '';
  private openNodes = new Set<string>();

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
    this.buildLegend();
    store.on((s, ch) => {
      if (ch.has('t')) this.updateStatus(s.t);
      if (ch.has('selectedUnit')) this.markSelected(s.selectedUnit);
    });
    this.updateStatus(store.get().t);
  }

  setTab(t: string) {
    this.tab = t;
    this.el.querySelectorAll<HTMLButtonElement>('.sb-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    this.el.querySelectorAll<HTMLElement>('.sb-pane').forEach((p) => p.classList.toggle('hidden', p.dataset.p !== t));
  }

  private briefPhase = '';
  private buildBrief(t = store.get().t) {
    const phase = phaseAt(t);
    this.briefPhase = phase.id;
    const f = this.db.forces.byPhase?.[phase.id] ?? this.db.forces.sides;
    const sides = SIDES.filter((k) => f[k]);
    const rows: [string, keyof Pick<SideSummary, 'men' | 'tanks' | 'aircraft' | 'guns'>][] = [['兵力（万人）', 'men'], ['坦克', 'tanks'], ['飞机', 'aircraft'], ['火炮', 'guns']];
    const bar = (label: string, metric: typeof rows[number][1]) => {
      const vals = sides.map((k) => f[k]![metric]);
      const max = Math.max(1, ...vals.filter((v): v is number => v != null));
      return `<div class="fc-row"><div class="fc-label">${label}</div>${sides.map((k, i) => `<div class="fc-bar"><i class="side-${k}" style="width:${vals[i] == null ? 0 : Math.max(1.5, vals[i]! / max * 100)}%"></i><span>${vals[i] == null ? '未详' : metric === 'men' ? (vals[i]! / 10000).toFixed(1) : vals[i]!.toLocaleString()}</span></div>`).join('')}</div>`;
    };
    const pane = this.el.querySelector('[data-p="brief"]') as HTMLElement;
    pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">绝密 · 作战简报</div><h1>巴尔干战役</h1><div class="sub">Greece · Yugoslavia · Crete</div><div class="sub2">1940.10.28 — 1941.6.1</div></div>
      <div class="sb-status"></div><h3>${escapeXml(phase.short)} · 交战各方</h3>
      <div class="fc-sides">${sides.map((k) => `<div class="fc-side"><i class="sw side-${k}"></i><b>${SIDE_ZH[k]}</b><small>${escapeXml(f[k]!.commander.split(/[；;，,]/)[0])}</small></div>`).join('')}</div>
      <div class="fc">${rows.map(([l, g]) => bar(l, g)).join('')}<div class="fc-legend">${sides.map((k) => `<span><i class="sw side-${k}"></i>${SIDE_ZH[k]}</span>`).join('')}</div></div>
      <h3>编制与史料口径</h3>${sides.map((k) => `<p class="force-note"><b>${SIDE_ZH[k]}</b> · ${escapeXml(f[k]!.divisions)}<br/><span>${escapeXml(f[k]!.note ?? '')}</span></p>`).join('')}
      <p class="fine">数字按本章投入整理，未知项显示“未详”。军团与所属师不重复计为兵力。路线与战线为战役级示意。</p>`;
    this.statusEl = pane.querySelector('.sb-status')!;
  }

  private lastStatusKey = '';
  private updateStatus(t: number) {
    const key = String(Math.floor(t / 3));
    if (phaseAt(t).id !== this.briefPhase) this.buildBrief(t);
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    const count: Record<string, { act: number; enc: number; out: number }> = {};
    for (const u of this.db.unitList) {
      if (u.echelon === 'armygroup' || u.echelon === 'front' || u.children.some((id) => !!unitStateAt(id, this.db.units, t))) continue;
      const s = unitStateAt(u.id, this.db.units, t);
      if (!s || t < u.fromH) continue;
      const c = count[u.side] ?? (count[u.side] = { act: 0, enc: 0, out: 0 });
      if (['destroyed', 'surrendered', 'interned', 'disbanded'].includes(s.status)) c.out++;
      else if (s.status === 'encircled') c.enc++;
      else c.act++;
    }
    const ally = ALLIES.reduce((n, k) => n + (count[k]?.act ?? 0), 0);
    const allyEnc = ALLIES.reduce((n, k) => n + (count[k]?.enc ?? 0), 0);
    const allyOut = ALLIES.reduce((n, k) => n + (count[k]?.out ?? 0), 0);
    const pockets = this.db.pockets.filter((p) => t >= p.h0 && t <= p.h1);
    this.statusEl.innerHTML = `<h3>当前态势</h3>
      <div class="st-grid">
        <div><b>${ally}</b><span>盟军编制在战</span></div>
        <div class="enc"><b>${allyEnc}</b><span>被合围</span></div>
        <div class="out"><b>${allyOut}</b><span>已投降或撤出</span></div>
        <div><b>${AXIS.reduce((n, k) => n + (count[k]?.act ?? 0), 0)}</b><span>轴心国单位在战</span></div>
      </div>
      ${pockets.length ? `<div class="st-pockets">包围圈：${pockets.map((p) => escapeXml(p.name.zh.replace('包围圈', ''))).join('、')}</div>` : ''}`;
    this.buildTree();
  }

  private buildTree() {
    const q = this.filter;
    const match = (u: RUnit): boolean =>
      !q || [u.name.zh, u.name.orig, u.name.short, u.commander?.zh, u.commander?.orig].some((s) => s?.toLowerCase().includes(q)) || u.children.some((c) => match(this.db.units.get(c)!));
    const node = (u: RUnit, depth: number): string => {
      if (!match(u)) return '';
      if (!q && (store.get().t < u.fromH || store.get().t > u.toH + 48) && !u.children.some((id) => unitStateAt(id, this.db.units, store.get().t))) return '';
      const kids = u.children.map((c) => this.db.units.get(c)!).filter(Boolean);
      const open = q ? true : this.openNodes.has(u.id);
      const mini = `<svg viewBox="-13 -12 26 24" width="24" height="22">${counterSVG({ side: u.side, type: u.type, echelon: u.echelon, label: '', size: 22 })}</svg>`;
      return `<div class="tn d${Math.min(depth, 4)}" data-id="${u.id}">
        <div class="tn-row">${kids.length ? `<button class="tn-tog">${open ? '▾' : '▸'}</button>` : '<span class="tn-sp"></span>'}${mini}<span class="tn-name">${escapeXml(u.name.zh)}</span><span class="tn-cmd">${escapeXml(u.commander?.zh ?? '')}</span></div>
        ${kids.length && open ? `<div class="tn-kids">${kids.map((k) => node(k, depth + 1)).join('')}</div>` : ''}</div>`;
    };
    const bySide = SIDES;
    this.treeEl.innerHTML = bySide.map((s) => {
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

  private buildLegend() {
    const pane = this.el.querySelector('[data-p="legend"]') as HTMLElement;
    const c = (side: Side, type: Parameters<typeof counterSVG>[0]['type'], ech: Parameters<typeof counterSVG>[0]['echelon'], label: string) =>
      `<svg viewBox="-17 -15 34 30" width="34" height="30">${counterSVG({ side, type, echelon: ech, label, size: 30 })}</svg>`;
    const s = store.get().layers;
    pane.innerHTML = `
      <h3>兵种符号（北约 APP-6 风格）</h3>
      <div class="lg-grid">
        <div>${c('DE', 'armor', 'division', '')}<span>装甲</span></div><div>${c('DE', 'motorized', 'division', '')}<span>摩托化步兵</span></div>
        <div>${c('GR', 'infantry', 'division', '')}<span>希军步兵</span></div><div>${c('GB', 'infantry', 'division', '')}<span>英军步兵</span></div>
        <div>${c('IT', 'infantry', 'division', '')}<span>意军步兵</span></div><div>${c('DE', 'airborne', 'division', '')}<span>空降部队</span></div>
        <div>${c('GR', 'fortress', 'brigade', '')}<span>要塞/筑垒</span></div><div>${c('DE', 'hq', 'army', '')}<span>集团军指挥部</span></div>
      </div>
      <h3>梯队标记</h3>
      <div class="lg-ech"><span><b>XXXX</b> 集团军</span><span><b>XXX</b> 军/作战集群</span><span><b>XX</b> 师</span><span><b>X</b> 旅</span></div>
      <h3>阵营与状态</h3>
      <div class="lg-list">
        ${SIDES.map((k) => `<div><i class="sw side-${k}"></i>${SIDE_ZH[k]}</div>`).join('')}
        <div><i class="lg-fill de"></i>轴心国控制（斜线）</div><div><i class="lg-fill"></i>盟军控制</div>
        <div><i class="lg-front"></i>战线（接触线）</div><div><i class="lg-demarc"></i>停战线（示意）</div>
        <div><i class="lg-pocket"></i>包围圈</div>
        <div><span class="lg-st">★</span>${STATUS_ZH.engaged}</div><div><span class="lg-st enc">▢</span>${STATUS_ZH.encircled}</div><div><span class="lg-st">✕</span>覆灭 / 投降 / 越境</div>
      </div>
      <h3>图层</h3>
      <div class="lg-layers">${LAYERS.map(([k, name]) => `<label><input type="checkbox" data-l="${k}" ${s[k] ? 'checked' : ''}/> ${name}</label>`).join('')}</div>
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
