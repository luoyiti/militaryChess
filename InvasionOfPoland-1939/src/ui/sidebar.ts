/** 左侧作战简报：兵力对比、当前态势、战斗序列树、图例与图层开关。 */
import type { DB } from '../data/db';
import { store, type LayerKey } from '../app/store';
import { unitStateAt, type RUnit } from '../model/core';
import { counterSVG, SIDE_ZH, STATUS_ZH, escapeXml, SIDE_COUNTER } from '../map2d/symbols';
import { ECHELON_RANK, type Side } from '../schema';

const LAYERS: [LayerKey, string][] = [
  ['units', '部队棋子'], ['control', '占领区'], ['front', '战线'], ['routes', '推进箭头'], ['routesFull', '完整推进路线'],
  ['pockets', '包围圈'], ['demarcation', '德苏分界线'], ['events', '事件标记'], ['cities', '城镇'], ['rivers', '河流湖泊'],
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

  private buildBrief() {
    const f = this.db.forces.sides;
    const rows: [string, (s: typeof f.DE) => number, string][] = [
      ['兵力（万人）', (s) => s.men / 10000, ''], ['坦克', (s) => s.tanks, ''], ['飞机', (s) => s.aircraft, ''], ['火炮', (s) => s.guns, ''],
    ];
    const sides: Side[] = ['DE', 'SK', 'PL', 'SU'];
    const bar = (label: string, get: (s: typeof f.DE) => number) => {
      const vals = sides.map((k) => get(f[k]));
      const max = Math.max(...vals);
      return `<div class="fc-row"><div class="fc-label">${label}</div>${sides.map((k, i) => `<div class="fc-bar"><i class="side-${k}" style="width:${Math.max(1.5, (vals[i] / max) * 100)}%"></i><span>${label.includes('万') ? vals[i].toFixed(vals[i] < 10 ? 1 : 0) : vals[i].toLocaleString()}</span></div>`).join('')}</div>`;
    };
    const pane = this.el.querySelector('[data-p="brief"]') as HTMLElement;
    pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">绝密 · 作战简报</div><h1>1939 波兰战役</h1><div class="sub">Kampania wrześniowa · Fall Weiß</div><div class="sub2">1939.8.31 — 1939.10.6</div></div>
      <div class="sb-status"></div>
      <h3>交战各方</h3>
      <div class="fc-sides">${sides.map((k) => `<div class="fc-side"><i class="sw side-${k}"></i><b>${SIDE_ZH[k]}</b><small>${escapeXml(f[k].commander.split(/[；;，,]/)[0])}</small></div>`).join('')}</div>
      <div class="fc">${rows.map(([l, g]) => bar(l, g)).join('')}<div class="fc-legend">${sides.map((k) => `<span><i class="sw side-${k}"></i>${SIDE_ZH[k]}</span>`).join('')}</div></div>
      <h3>伤亡与损失</h3>
      <table class="losses"><tr><th></th><th>阵亡</th><th>被俘/失踪</th></tr>
        ${sides.map((k) => `<tr><td><i class="sw side-${k}"></i>${SIDE_ZH[k]}</td><td>${escapeXml(shorten(f[k].losses.killed))}</td><td>${escapeXml(shorten(f[k].losses.captured ?? '—'))}</td></tr>`).join('')}</table>
      <p class="fine">数字为常见区间，各来源口径不一；详见各方说明。</p>`;
    this.statusEl = pane.querySelector('.sb-status')!;
  }

  private lastStatusKey = '';
  private updateStatus(t: number) {
    const key = String(Math.floor(t / 3));
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    const count: Record<string, { act: number; enc: number; out: number }> = { DE: { act: 0, enc: 0, out: 0 }, PL: { act: 0, enc: 0, out: 0 }, SU: { act: 0, enc: 0, out: 0 }, SK: { act: 0, enc: 0, out: 0 } };
    for (const u of this.db.unitList) {
      if (u.echelon !== 'division' && u.echelon !== 'brigade') continue;
      const s = unitStateAt(u.id, this.db.units, t);
      if (!s || t < u.fromH) continue;
      const c = count[u.side];
      if (['destroyed', 'surrendered', 'interned', 'disbanded'].includes(s.status)) c.out++;
      else if (s.status === 'encircled') c.enc++;
      else c.act++;
    }
    const pl = count.PL;
    const pockets = this.db.pockets.filter((p) => t >= p.h0 && t <= p.h1);
    this.statusEl.innerHTML = `<h3>当前态势</h3>
      <div class="st-grid">
        <div><b>${pl.act}</b><span>波军师/旅在战</span></div>
        <div class="enc"><b>${pl.enc}</b><span>被合围</span></div>
        <div class="out"><b>${pl.out}</b><span>已覆灭/投降/越境</span></div>
        <div><b>${count.DE.act + count.SK.act}</b><span>德/斯师旅在波兰</span></div>
        ${count.SU.act ? `<div class="su"><b>${count.SU.act}</b><span>苏军军/旅</span></div>` : ''}
      </div>
      ${pockets.length ? `<div class="st-pockets">包围圈：${pockets.map((p) => escapeXml(p.name.zh.replace('包围圈', ''))).join('、')}</div>` : ''}`;
  }

  private buildTree() {
    const q = this.filter;
    const match = (u: RUnit): boolean =>
      !q || [u.name.zh, u.name.orig, u.name.short, u.commander?.zh, u.commander?.orig].some((s) => s?.toLowerCase().includes(q)) || u.children.some((c) => match(this.db.units.get(c)!));
    const node = (u: RUnit, depth: number): string => {
      if (!match(u)) return '';
      const kids = u.children.map((c) => this.db.units.get(c)!).filter(Boolean);
      const open = q ? true : this.openNodes.has(u.id);
      const mini = `<svg viewBox="-13 -12 26 24" width="24" height="22">${counterSVG({ side: u.side, type: u.type, echelon: u.echelon, label: '', size: 22 })}</svg>`;
      return `<div class="tn d${Math.min(depth, 4)}" data-id="${u.id}">
        <div class="tn-row">${kids.length ? `<button class="tn-tog">${open ? '▾' : '▸'}</button>` : '<span class="tn-sp"></span>'}${mini}<span class="tn-name">${escapeXml(u.name.zh)}</span><span class="tn-cmd">${escapeXml(u.commander?.zh ?? '')}</span></div>
        ${kids.length && open ? `<div class="tn-kids">${kids.map((k) => node(k, depth + 1)).join('')}</div>` : ''}</div>`;
    };
    const bySide: Side[] = ['DE', 'SK', 'PL', 'SU'];
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
        <div>${c('DE', 'light', 'division', '')}<span>轻装/机械化</span></div><div>${c('PL', 'infantry', 'division', '')}<span>步兵</span></div>
        <div>${c('PL', 'cavalry', 'brigade', '')}<span>骑兵</span></div><div>${c('PL', 'cavalry_mech', 'brigade', '')}<span>摩托化骑兵</span></div>
        <div>${c('PL', 'mountain', 'brigade', '')}<span>山地</span></div><div>${c('SU', 'armor', 'brigade', '')}<span>坦克旅</span></div>
        <div>${c('PL', 'fortress', 'brigade', '')}<span>要塞/筑垒</span></div><div>${c('DE', 'hq', 'army', '')}<span>集团军指挥部</span></div>
      </div>
      <h3>梯队标记</h3>
      <div class="lg-ech"><span><b>XXXX</b> 集团军</span><span><b>XXX</b> 军/作战集群</span><span><b>XX</b> 师</span><span><b>X</b> 旅</span></div>
      <h3>阵营与状态</h3>
      <div class="lg-list">
        ${(['DE', 'SK', 'PL', 'SU'] as Side[]).map((k) => `<div><i class="sw side-${k}"></i>${SIDE_ZH[k]}</div>`).join('')}
        <div><i class="lg-fill de"></i>德占区（斜线）</div><div><i class="lg-fill su"></i>苏占区（交叉线）</div>
        <div><i class="lg-front"></i>战线（接触线）</div><div><i class="lg-demarc"></i>德苏分界线</div>
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
