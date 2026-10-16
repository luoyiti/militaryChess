/** 部队棋子层：三级 LOD（带滞回）、碰撞松弛避让、引线、悬停提示、点击选中。 */
import { MapView, svgEl, type View } from './MapView';
import type { DB } from '../data/db';
import { unitStateAt, isTerminal, type RUnit, type UnitState } from '../model/core';
import { ECHELON_RANK, type UnitStatus } from '../core/types';
import { counterSVG, statusOverlay, STATUS_ZH, ECH_ZH, TYPE_ZH, SIDE_ZH, FLIGHT_ZH, escapeXml } from './symbols';
import { campaign, manifest } from '../campaign/context';

const SIZE: Record<string, number> = { army: 38, corps: 32, division: 27, brigade: 27, armygroup: 40, front: 40, command: 40, air_group: 38, air_fleet: 38, sector: 32, wing: 32, squadron: 27, gruppe: 27 };

/** 有下属时是否直接展开（不作为棋子显示）：unit.display='container'，或 manifest.display.hqPassThrough 下的指挥部 */
export function isContainer(u: RUnit): boolean {
  const d = manifest().display;
  return u.display === 'container' || (!!d?.hqPassThrough && u.type === 'hq');
}
/** 海运/空运途中的地面部队是否隐藏（manifest.display.hideTransport.map2d / sandbox） */
export function hiddenInTransit(u: RUnit, s: UnitState, where: 'map2d' | 'sandbox' = 'map2d'): boolean {
  return !!manifest().display?.hideTransport?.[where] && !!s.movement && s.movement !== 'land' && u.type !== 'naval' && u.type !== 'air';
}

interface Item {
  u: RUnit; s: UnitState; ax: number; ay: number; x: number; y: number; r: number; dir: [number, number] | null;
}
interface El { g: SVGGElement; inner: SVGGElement; status: SVGGElement; dir: SVGPathElement; lastStatus: UnitStatus | ''; }

export class UnitsLayer {
  level = 0;
  private g: SVGGElement;
  private leaders: SVGPathElement;
  private els = new Map<string, El>();
  private offsets = new Map<string, [number, number]>();
  private items: Item[] = [];
  private t = 0;
  selected: string | null = null;
  highlightSide: string | null = null;
  onSelect: (id: string | null) => void = () => {};
  /** 由其他图层绘制的部队（如海战层画舰船剪影）：不作为棋子显示 */
  skip: ((u: RUnit) => boolean) | null = null;
  visible = true;
  private tip: HTMLDivElement;
  stats = { shown: 0, overlap: 0 };

  constructor(private map: MapView, private db: DB) {
    const leadersG = svgEl('g', { class: 'unit-leaders' }, map.screenSvg);
    this.leaders = svgEl('path', { class: 'leader' }, leadersG);
    this.g = svgEl('g', { class: 'units' }, map.screenSvg);
    this.tip = document.createElement('div');
    this.tip.className = 'unit-tip';
    document.body.appendChild(this.tip);
  }

  private updateLevel() {
    const lod = campaign().lod;
    const T1 = lod.levels[1].minK, T2 = lod.levels[2].minK, HYS = 1 + lod.hysteresis;
    const rel = this.map.relK;
    let L = this.level;
    if (L === 0 && rel > T1 * HYS) L = 1;
    if (L === 1 && rel < T1 / HYS) L = 0;
    if (L === 1 && rel > T2 * HYS) L = 2;
    if (L === 2 && rel < T2 / HYS) L = 1;
    if (L === 0 && rel > T2 * HYS) L = 2;
    if (L === 2 && rel < T1 / HYS) L = 0;
    this.level = L;
    this.map.root.dataset.lod = String(L);
  }

  /** 当前层级下应显示的部队 */
  private displaySet(t: number): RUnit[] {
    const L = this.level;
    const out: RUnit[] = [];
    const U = this.db.units;
    const visit = (u: RUnit) => {
      const r = ECHELON_RANK[u.echelon];
      if (t < u.fromH - 1 || t > u.toH + u.fadeH) return;
      const kids = u.children.map((c) => U.get(c)!).filter((c) => t >= c.fromH - 1 && t <= c.toH + c.fadeH);
      if (r < 0 || (kids.length && isContainer(u))) { kids.forEach(visit); return; }
      if (r >= L || !kids.length) { out.push(u); return; }
      if (L === 1 && !kids.some((c) => ECHELON_RANK[c.echelon] === 1)) { out.push(u); return; }
      kids.forEach(visit);
    };
    this.db.roots.forEach(visit);
    return out;
  }

  setTime(t: number) { this.t = t; this.layout(); }
  updateView(_v: View) { this.layout(); }

  private layout() {
    if (!this.visible) { this.g.style.display = 'none'; this.leaders.setAttribute('d', ''); return; }
    this.g.style.display = '';
    this.updateLevel();
    const t = this.t, map = this.map;
    const set = this.displaySet(t);
    const items: Item[] = [];
    for (const u of set) {
      if (this.skip?.(u)) continue;
      const s = unitStateAt(u.id, this.db.units, t);
      if (!s || hiddenInTransit(u, s) || s.fade <= 0.03) continue;
      const [ax, ay] = map.llToScreen(s.ll);
      if (ax < -80 || ay < -80 || ax > map.width + 80 || ay > map.height + 80) continue;
      let dir: [number, number] | null = null;
      if (s.moving) {
        const p = unitStateAt(u.id, this.db.units, t - (s.flightPhase ? 0.025 : 3));
        if (p) {
          const [px, py] = map.llToScreen(p.ll);
          const dx = ax - px, dy = ay - py, n = Math.hypot(dx, dy);
          if (n > 1.5) dir = [dx / n, dy / n];
        }
      }
      const off = this.offsets.get(u.id) ?? [0, 0];
      items.push({ u, s, ax, ay, x: ax + off[0], y: ay + off[1], r: (SIZE[u.echelon] ?? 28) * 0.56, dir });
    }
    // 碰撞松弛
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const min = (a.r + b.r) * 0.98;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          let d = Math.sqrt(d2);
          if (d < 0.01) { dx = Math.cos(i + j); dy = Math.sin(i + j); d = 1; }
          const push = (min - d) / 2;
          const ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
      for (const a of items) { a.x += (a.ax - a.x) * 0.06; a.y += (a.ay - a.y) * 0.06; }
    }
    // 统计重叠
    let overlap = 0;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.7) overlap++;
    }
    this.stats = { shown: items.length, overlap: items.length ? overlap / items.length : 0 };
    // 渲染
    const seen = new Set<string>();
    let leaders = '';
    for (const it of items) {
      const u = it.u;
      seen.add(u.id);
      this.offsets.set(u.id, [it.x - it.ax, it.y - it.ay]);
      let el = this.els.get(u.id);
      if (!el) el = this.create(u);
      el.g.style.display = '';
      el.g.setAttribute('transform', `translate(${it.x.toFixed(1)},${it.y.toFixed(1)})`);
      const dead = isTerminal(it.s.status);
      el.g.style.opacity = String(it.s.fade * (this.highlightSide && this.highlightSide !== u.side ? 0.35 : 1));
      el.g.classList.toggle('dead', dead);
      el.g.classList.toggle('selected', u.id === this.selected);
      if (it.s.flightPhase) {
        el.g.dataset.flight = it.s.flightPhase;
        el.g.dataset.lon = it.s.ll[0].toFixed(5); el.g.dataset.lat = it.s.ll[1].toFixed(5);
        el.g.classList.toggle('airborne', it.s.flightPhase !== 'at_base');
      }
      if (el.lastStatus !== it.s.status) {
        el.lastStatus = it.s.status;
        el.status.innerHTML = statusOverlay(it.s.status, SIZE[u.echelon] ?? 28);
        el.g.dataset.status = it.s.status;
      }
      if (it.dir && !dead) {
        const R = (SIZE[u.echelon] ?? 28) * 0.62 + 5;
        const [dx, dy] = it.dir;
        const tx = dx * R, ty = dy * R;
        el.dir.setAttribute('d', `M${(tx - dx * 6 - dy * 4).toFixed(1)},${(ty - dy * 6 + dx * 4).toFixed(1)} L${tx.toFixed(1)},${ty.toFixed(1)} L${(tx - dx * 6 + dy * 4).toFixed(1)},${(ty - dy * 6 - dx * 4).toFixed(1)}`);
        el.dir.style.display = '';
      } else el.dir.style.display = 'none';
      if (Math.hypot(it.x - it.ax, it.y - it.ay) > 9) leaders += `M${it.ax.toFixed(1)},${it.ay.toFixed(1)}L${it.x.toFixed(1)},${it.y.toFixed(1)}`;
    }
    this.leaders.setAttribute('d', leaders);
    for (const [id, el] of this.els) if (!seen.has(id) && el.g.style.display !== 'none') el.g.style.display = 'none';
    // 被选中的放到最上层
    if (this.selected) { const el = this.els.get(this.selected); if (el && el.g.parentNode === this.g && el.g !== this.g.lastChild) this.g.appendChild(el.g); }
    this.items = items;
  }

  private create(u: RUnit): El {
    const g = svgEl('g', { class: `unit side-${u.side} ech-${u.echelon}` }, this.g);
    const S = SIZE[u.echelon] ?? 28;
    const dir = svgEl('path', { class: 'unit-dir' }, g);
    const inner = svgEl('g', { class: 'unit-counter' }, g);
    inner.innerHTML = counterSVG({ side: u.side, type: u.type, echelon: u.echelon, label: u.name.short ?? u.name.zh, size: S });
    const status = svgEl('g', { class: 'unit-status' }, g);
    svgEl('rect', { class: 'unit-sel', x: -S / 2 - 5, y: -S * 0.45 - 5, width: S + 10, height: S * 0.9 + 10, rx: 5 }, g);
    g.addEventListener('pointerenter', (ev) => this.showTip(u, ev as PointerEvent));
    g.addEventListener('pointermove', (ev) => this.moveTip(ev as PointerEvent));
    g.addEventListener('pointerleave', () => this.hideTip());
    g.addEventListener('click', (ev) => { ev.stopPropagation(); this.onSelect(u.id); });
    const el: El = { g, inner, status, dir, lastStatus: '' };
    this.els.set(u.id, el);
    return el;
  }

  /** 悬停提示（海战层的舰船剪影共用） */
  showTip(u: RUnit, ev: PointerEvent) {
    const s = unitStateAt(u.id, this.db.units, this.t);
    const parent = u.parent ? this.db.units.get(u.parent) : null;
    this.tip.innerHTML = `<div class="tt-h side-${u.side}">${escapeXml(u.name.zh)}</div>
      <div class="tt-o">${escapeXml(u.name.orig ?? '')}</div>
      <div class="tt-r">${SIDE_ZH[u.side]} · ${ECH_ZH[u.echelon]} · ${TYPE_ZH[u.type]}</div>
      ${u.commander ? `<div class="tt-r">指挥官：${escapeXml(u.commander.zh)}${u.commander.orig ? `（${escapeXml(u.commander.orig)}）` : ''}</div>` : ''}
      ${parent ? `<div class="tt-r">隶属：${escapeXml(parent.name.zh)}</div>` : ''}
      ${u.ship?.class ? `<div class="tt-r">${escapeXml(u.ship.class.zh)}${u.ship.lengthM ? ` · 舰长 ${u.ship.lengthM} 米` : ''}</div>` : ''}
      ${u.ship && s?.courseDeg !== undefined ? `<div class="tt-r tt-nav">航向 ${String(Math.round(s.courseDeg) % 360).padStart(3, '0')}° · 航速 ${Math.round(s.speedKn ?? 0)} 节</div>` : ''}
      ${s ? `<div class="tt-s st-${s.status}">${s.flightPhase ? FLIGHT_ZH[s.flightPhase] : STATUS_ZH[s.status]}</div>` : ''}
      <div class="tt-hint">点击查看部队档案</div>`;
    this.tip.style.display = 'block';
    this.moveTip(ev);
  }
  moveTip(ev: PointerEvent) {
    const x = Math.min(window.innerWidth - 280, ev.clientX + 16), y = Math.min(window.innerHeight - 160, ev.clientY + 14);
    this.tip.style.transform = `translate(${x}px,${y}px)`;
  }
  hideTip() { this.tip.style.display = 'none'; }

  setVisible(v: boolean) { this.visible = v; this.layout(); }
  screenPosOf(id: string): [number, number] | null {
    const it = this.items.find((i) => i.u.id === id);
    return it ? [it.x, it.y] : null;
  }
  get shownItems() { return this.items; }
}
