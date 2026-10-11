/** 左侧作战简报：兵力对比、当前态势、战斗序列树、图例与图层开关。 */
import type { DB } from '../data/db';
import { store, type LayerKey } from '../app/store';
import { unitStateAt, type RUnit } from '../model/core';
import { counterSVG, SIDE_ZH, STATUS_ZH, escapeXml, SIDE_COUNTER } from '../map2d/symbols';
import { ECHELON_RANK, SIDES, isoToHours, type Side } from '../schema';

const LAYERS: [LayerKey, string][] = [
  ['units', '部队 / 舰艇 / 航空棋子'], ['control', '据点控制示意'], ['front', '控制边缘'], ['routes', '海陆空行动'],
  ['routesFull', '完整概略路线（含尚未发生）'], ['events', '历史事件标记'], ['cities', '城市 / 港口 / 机场'],
  ['rivers', '河流湖泊'], ['hex', '18 km 六角格'], ['terrain', '真实高程晕渲'],
];

export class Sidebar {
  el: HTMLElement;
  private tab = 'brief';
  onUnit: (id: string) => void = () => {};
  onEvent: (id: string) => void = () => {};
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
    const pane = this.el.querySelector('[data-p="brief"]') as HTMLElement;
    pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">北欧战区 · 作战档案</div><h1>1940 挪威战役</h1><div class="sub">Norwegian Campaign · Weserübung</div><div class="sub2">1940.4.9 — 1940.6.10</div></div>
      <div class="sb-status"></div>
      <h3>交战各方</h3>
      <div class="campaign-forces">${SIDES.map(k => `<details class="force-entry"><summary><i class="sw side-${k}"></i><b>${SIDE_ZH[k]}</b><small>${escapeXml(f[k].commander.split('；')[0])}</small></summary><p>${escapeXml(f[k].divisions)}<br/>${escapeXml(f[k].note ?? '')}</p></details>`).join('')}</div>
      <h3>怎样读这张地图</h3>
      <p class="fine">35个作战标记 · 37条行动 · 38个事件。棋子是代表性单位、舰艇或分遣队，不是完整编制清单。数字表示标记数量，未作为实际兵力比例。</p>
      <p class="fine">据点控制以斜线表示；海面不作陆上占领区。路线是概略行动方向，浅虚线完整路线包含未来行动。单日史实的时分仅为播放编排。</p>
      <p class="fine">瑞典保持中立；挪威本土战役6月10日结束，流亡政府、海外部队继续战争。</p>`;
    this.statusEl = pane.querySelector('.sb-status')!;
  }

  private lastStatusKey = '';
  private updateStatus(t: number) {
    const key = String(Math.floor(t));
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    const active = this.db.unitList.filter(u => { const s = unitStateAt(u.id, this.db.units, t); return s && s.fade > 0.05 && !['destroyed','surrendered','interned','disbanded','evacuated','inactive','ineffective'].includes(s.status); });
    const german = active.filter(u => u.side === 'DE').length, allied = active.length - german;
    const H = (s: string) => isoToHours(s);
    const south = t < H('1940-04-09T14:00') ? '海峡阻击 / 空降突袭' : t < H('1940-05-10T12:00') ? '内陆迟滞 / 分批结束抵抗' : '德军占领南部';
    const central = t < H('1940-04-14T12:00') ? '德军港口据点' : t < H('1940-05-03T12:00') ? '盟军两翼登陆 / 迟滞与撤运' : '盟军退出中部';
    const north = t < H('1940-05-28T12:00') ? '德军据港 / 盟军山地反攻' : t < H('1940-06-04T12:00') ? '盟军夺回纳尔维克' : t < H('1940-06-08T23:00') ? 'Alphabet 撤运' : t < H('1940-06-10T12:00') ? '盟军撤出 / 挪军孤立' : '本土战役结束';
    const latest = [...this.db.events].reverse().find(e => e.h <= t);
    this.statusEl.innerHTML = `<h3>并行战区态势</h3><div class="theater-status"><div><b>南部</b><span>${south}</span></div><div><b>中部</b><span>${central}</span></div><div><b>北部</b><span>${north}</span></div></div>
      <div class="st-grid"><div><b>${german}</b><span>德国活动标记</span></div><div><b>${allied}</b><span>挪威 / 盟军活动标记</span></div></div>
      ${latest ? `<button class="latest-event" data-e="${latest.id}"><small>最近事件 · 点击查看</small><b>${escapeXml(latest.title.zh)}</b></button>` : ''}`;
    this.statusEl.querySelector<HTMLButtonElement>('[data-e]')?.addEventListener('click', ev => this.onEvent((ev.currentTarget as HTMLElement).dataset.e!));
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
    const bySide: readonly Side[] = SIDES;
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
        <div>${c('DE', 'infantry', 'division', '')}<span>步兵</span></div><div>${c('NO', 'mountain', 'division', '')}<span>山地兵</span></div>
        <div>${c('UK', 'naval', 'ship', '')}<span>舰艇 / 编队</span></div><div>${c('UK', 'aviation', 'squadron', '')}<span>航空兵</span></div>
        <div>${c('NO', 'fortress', 'group', '')}<span>岸防 / 要塞</span></div><div>${c('FR', 'infantry', 'regiment', '')}<span>团 / 半旅</span></div>
      </div>
      <h3>梯队标记</h3>
      <div class="lg-ech"><span><b>XXXX</b> 集团军</span><span><b>XXX</b> 军/作战集群</span><span><b>XX</b> 师</span><span><b>X</b> 旅</span></div>
      <h3>阵营与状态</h3>
      <div class="lg-list">
        ${SIDES.map((k) => `<div><i class="sw side-${k}"></i>${SIDE_ZH[k]}</div>`).join('')}
        <div><i class="lg-fill de"></i>德军据点（斜线）</div><div><i class="lg-fill al"></i>盟军据点（交叉线）</div>
        <div><i class="lg-front"></i>控制区概略边缘</div><div>━━▶ 陆军推进 / 登陆</div><div>⚓ ┄┄▶ 海军行动</div><div>✈ ···▶ 空中行动</div><div>┄┄▶ 撤退 / 撤运</div>
        <div><span class="lg-st">★</span>${STATUS_ZH.engaged}</div><div><span class="lg-st enc">▢</span>${STATUS_ZH.encircled}</div><div><span class="lg-st">✕</span>损失 / 投降 / 撤离</div>
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
