/** 左侧作战简报：兵力对比、当前态势、战斗序列树、图例与图层开关。 */
import type { DB } from '../data/db';
import { store, type LayerKey } from '../app/store';
import { unitStateAt, type RUnit } from '../model/core';
import { counterSVG, SIDE_ZH, STATUS_ZH, escapeXml, SIDE_COUNTER } from '../map2d/symbols';
import { ECHELON_RANK, type Side } from '../schema';
import { SCENARIO } from '../app/scenario';

const LAYERS: [LayerKey,string][]=[
  ['units','部队棋子'],['control','袭击与拦截重点区'],['front','空战态势边界'],['routes','当前任务航线'],['routesFull','完整示意航线'],
  ['demarcation','RAF防空分区'],['radar','雷达覆盖示意'],['events','历史事件'],['cities','城市与基地'],['rivers','河流湖泊'],
  ['forest','森林沼泽'],['hex','六角格'],['terrain','地形晕渲'],
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
    const pane=this.el.querySelector('[data-p="brief"]') as HTMLElement;
    const sides=SCENARIO.sides;
    pane.innerHTML=`
      <div class="brief-title"><div class="stamp-top">绝密 · 作战简报</div><h1>1940 不列颠空战</h1><div class="sub">The Battle of Britain</div><div class="sub2">1940.7.10 — 1940.10.31</div></div>
      <div class="sb-status"></div>
      <h3>交战双方</h3>
      <div class="fc-sides">${sides.map((side)=>{const f=this.db.forces.sides[side]!;return `<div class="fc-side"><i class="sw side-${side}"></i><b>${SIDE_ZH[side]}</b><small>${escapeXml(f.commander)}</small></div>`;}).join('')}</div>
      <h3>作战力量</h3>
      ${sides.map((side)=>{const f=this.db.forces.sides[side]!;return `<div class="air-strength side-${side}"><b>${SIDE_ZH[side]}</b><span>${escapeXml(f.divisions)}</span><strong>${f.aircraft!=null?f.aircraft.toLocaleString():(side==='GB'?'战斗机':'混合机群')} <small>${f.aircraft!=null?'架':'参战类型'}</small></strong><p>${escapeXml(f.note ?? '')}</p></div>`;}).join('')}
      <h3>战役损失</h3>
      <table class="losses"><tr><th></th><th>全战役空勤人员损失</th></tr>${sides.map((side)=>{const f=this.db.forces.sides[side]!;return `<tr><td><i class="sw side-${side}"></i>${side==='GB'?'RAF':'德国空军'}</td><td>${escapeXml(f.losses.killed)}</td></tr>`;}).join('')}</table>
      <p class="fine">兵力数字注明来源口径；地图展示的是代表性编队。袭击与拦截范围、任务航迹为历史教学示意。</p>`;
    this.statusEl=pane.querySelector('.sb-status')!;
  }

  private lastStatusKey='';
  private updateStatus(t:number) {
    const key=String(Math.floor(t*60)); if(key===this.lastStatusKey)return; this.lastStatusKey=key;
    const leaves=this.db.unitList.filter((u)=>u.type==='fighter'||u.type==='bomber');
    const flying=leaves.filter((u)=>{const s=unitStateAt(u.id,this.db.units,t);return s&&s.flightPhase&&s.flightPhase!=='at_base';});
    this.statusEl.innerHTML=`<h3>当前空战态势</h3><div class="st-grid"><div><b>${leaves.filter((u)=>u.side==='GB').length}</b><span>RAF代表中队</span></div><div><b>${leaves.filter((u)=>u.side==='DE').length}</b><span>德军代表大队</span></div><div><b>${flying.filter((u)=>u.side==='GB').length}</b><span>RAF出击编队</span></div><div><b>${flying.filter((u)=>u.side==='DE').length}</b><span>德军出击编队</span></div></div>`;
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
    const bySide: Side[] = SCENARIO.sides;
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
    pane.innerHTML=`
      <h3>航空兵棋子</h3><div class="lg-grid">
        <div>${c('GB','fighter','squadron','RAF')}<span>RAF战斗机</span></div><div>${c('DE','bomber','gruppe','KG')}<span>德军轰炸机</span></div>
        <div>${c('DE','fighter','gruppe','JG')}<span>德军战斗机</span></div><div>${c('GB','hq','air_group','11')}<span>防空大队总部</span></div>
      </div><h3>显示层级</h3><p class="fine">全图：Group／Luftflotte<br/>中景：防空扇区／联队<br/>近景：中队／航空大队</p>
      <h3>态势与航线</h3><div class="lg-list"><div><i class="sw side-GB"></i>英国皇家空军 · 红色</div><div><i class="sw side-DE"></i>德国空军 · 蓝色</div><div><i class="lg-fill de"></i>主要袭击区域</div><div><i class="lg-fill gb"></i>主要拦截区域</div><div><i class="lg-demarc"></i>RAF固定管辖分区</div><div>⇢ 虚线：护航／返航</div></div>
      <p class="fine">双方活动区域可以重叠。边界表示作战重心，雷达圈表示近似覆盖，均不等于领土占领或精确航迹。</p>
      <h3>图层</h3><div class="lg-layers">${LAYERS.map(([k,name])=>`<label><input type="checkbox" data-l="${k}" ${s[k]?'checked':''}/> ${name}</label>`).join('')}</div>
      <h3>快捷键</h3><div class="lg-keys"><span><kbd>空格</kbd> 播放／暂停</span><span><kbd>←</kbd><kbd>→</kbd> 上／下一事件</span><span><kbd>,</kbd><kbd>.</kbd> 前后6小时</span><span><kbd>H</kbd> 全战区</span><span><kbd>M</kbd> 2D／3D</span><span><kbd>Esc</kbd> 关闭卡片</span></div>`;
    pane.querySelectorAll<HTMLInputElement>('input[data-l]').forEach((i) => (i.onchange = () => store.setLayer(i.dataset.l as LayerKey, i.checked)));
  }
}

function shorten(s: string) {
  const m = s.split(/[（(；;]/)[0].trim();
  return m.length > 22 ? m.slice(0, 22) + '…' : m;
}
export { STATUS_ZH };
