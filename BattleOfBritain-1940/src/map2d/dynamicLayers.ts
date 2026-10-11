/** 随时间变化的图层：占领区、战线、推进箭头、分界线、包围圈、事件标记、选中部队轨迹。 */
import { MapView, svgEl, type View } from './MapView';
import type { StaticLayers } from './staticLayers';
import { project, KM } from '../geo/frame';
import type { DB, REvent, RPocket } from '../data/db';
import type { GeomResult } from '../geo/field/client';
import { routeProgress, routeOpacity, type RRoute, type RUnit } from '../model/core';
import type { LonLat, Side } from '../schema';
import { SIDE_COUNTER, escapeXml } from './symbols';
import { fmtShort } from '../app/store';

const SIDE_ARROW: Record<Side, { fill: string; stroke: string }> = {
  GB: { fill:'rgba(179,38,46,0.60)',stroke:'#6e1b20' },
  DE: { fill: 'rgba(52,84,132,0.62)', stroke: '#1f3558' },
  SK: { fill: 'rgba(74,122,140,0.62)', stroke: '#2f5561' },
  PL: { fill: 'rgba(179,38,46,0.62)', stroke: '#6e1b20' },
  SU: { fill: 'rgba(143,82,34,0.62)', stroke: '#4f2e10' },
};

const polyD = (polys: number[][][][]) => {
  let d = '';
  for (const poly of polys) for (const ring of poly) {
    if (ring.length < 3) continue;
    d += 'M' + ring.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z';
  }
  return d;
};
const lineD = (lines: number[][][]) => lines.map((l) => 'M' + l.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')).join('');

/** Catmull-Rom 加密 */
function smooth(pts: number[][], seg = 8): number[][] {
  if (pts.length < 3) return pts;
  const out: number[][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** 锥形粗箭头（世界坐标） */
export function arrowPath(ptsIn: number[][], width: number): string {
  // 去除重复点
  const pts: number[][] = [];
  for (const p of ptsIn) if (!pts.length || Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]) > 0.5) pts.push(p);
  if (pts.length < 2) return '';
  const s = smooth(pts, 10);
  const cum = [0];
  for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const total = cum[cum.length - 1];
  if (total < width * 0.8) return '';
  const headLen = Math.min(width * 1.7, total * 0.6);
  const headW = width * 1.15;
  const bodyEnd = total - headLen;
  const L: number[][] = [], R: number[][] = [];
  const at = (d: number) => {
    let i = 1;
    while (i < s.length - 1 && cum[i] < d) i++;
    const t = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    const x = s[i - 1][0] + (s[i][0] - s[i - 1][0]) * t, y = s[i - 1][1] + (s[i][1] - s[i - 1][1]) * t;
    const dx = s[i][0] - s[i - 1][0], dy = s[i][1] - s[i - 1][1];
    const n = Math.hypot(dx, dy) || 1;
    return { x, y, nx: -dy / n, ny: dx / n };
  };
  const N = Math.max(4, Math.ceil(bodyEnd / (width * 0.35)));
  for (let k = 0; k <= N; k++) {
    const d = (bodyEnd * k) / N;
    const p = at(d);
    const w = (width / 2) * (0.35 + 0.65 * Math.min(1, d / Math.max(1, total * 0.35)));
    L.push([p.x + p.nx * w, p.y + p.ny * w]);
    R.push([p.x - p.nx * w, p.y - p.ny * w]);
  }
  const base = at(bodyEnd), tip = at(total);
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(L[0][0])},${f(L[0][1])}`;
  for (let k = 1; k < L.length; k++) d += `L${f(L[k][0])},${f(L[k][1])}`;
  d += `L${f(base.x + base.nx * headW)},${f(base.y + base.ny * headW)}L${f(tip.x)},${f(tip.y)}L${f(base.x - base.nx * headW)},${f(base.y - base.ny * headW)}`;
  for (let k = R.length - 1; k >= 0; k--) d += `L${f(R[k][0])},${f(R[k][1])}`;
  return d + 'Z';
}

const EVENT_ICON: Record<string, string> = {
  battle: '<path d="M-6,-6 L6,6 M6,-6 L-6,6" stroke-width="2.2"/><path d="M-7,-3 L-3,-7 M7,-3 L3,-7" stroke-width="1.6"/>',
  air: '<path d="M0,-7 L1.3,-1.5 L7,1 L7,2.4 L1.3,1.2 L0.9,5 L2.6,6.4 L2.6,7.2 L0,6.4 L-2.6,7.2 L-2.6,6.4 L-0.9,5 L-1.3,1.2 L-7,2.4 L-7,1 L-1.3,-1.5Z" fill="currentColor" stroke="none"/>',
  naval: '<path d="M0,-6 L0,6 M-5,1 Q-4.6,6.2 0,6 Q4.6,6.2 5,1 M-3,-3 L3,-3" stroke-width="1.6" fill="none"/><circle cx="0" cy="-6.6" r="1.4" fill="none" stroke-width="1.2"/>',
  political: '<rect x="-5" y="-6.5" width="10" height="13" rx="1" fill="none" stroke-width="1.5"/><path d="M-2.8,-3 h5.6 M-2.8,0 h5.6 M-2.8,3 h3.6" stroke-width="1.1"/>',
  atrocity: '<path d="M0,-7 V7 M-4.5,-2.5 H4.5" stroke-width="2.4"/>',
  movement: '<path d="M-6,3 L4,-3 M4,-3 L-0.5,-4.2 M4,-3 L1.8,1" stroke-width="2" fill="none"/>',
  surrender: '<path d="M-4.5,7 V-7" stroke-width="1.6"/><path d="M-4.5,-7 L6,-5 L3.6,-2.6 L6,0 L-4.5,-1.5Z" fill="#fbf6ea" stroke-width="1.1"/>',
  siege: '<circle r="5.5" fill="none" stroke-width="1.8"/><path d="M0,-8 V-5.5 M0,8 V5.5 M-8,0 H-5.5 M8,0 H5.5" stroke-width="1.6"/>',
};
const EVENT_COLOR: Record<string, string> = {
  battle: '#a8262d', air: '#5b4a82', naval: '#2a6474', political: '#3a352c', atrocity: '#4a1515', movement: '#6b5a1e', surrender: '#3d3d3d', siege: '#8a3a1a',
};

interface RouteEl { r: RRoute; body: SVGPathElement; hatch: SVGPathElement; full: SVGPathElement; label: SVGGElement; lastKey: string }

export class DynamicLayers {
  private fillDE: SVGPathElement;
  private fillSU: SVGPathElement;
  private fillPL: SVGPathElement;
  private frontHalo: SVGPathElement;
  private frontDE: SVGPathElement;
  private frontDE2: SVGPathElement;
  private frontSU: SVGPathElement;
  private frontSU2: SVGPathElement;
  private contact: SVGPathElement;
  private routeEls: RouteEl[] = [];
  private demarcEls: { d: DB['demarcation'][number]; path: SVGPathElement; label: SVGGElement; mid: number[] }[] = [];
  private pocketsG: SVGGElement;
  private pocketEls = new Map<string, SVGGElement>();
  private eventsG: SVGGElement;
  private eventEls = new Map<string, SVGGElement>();
  private routeLabelsG: SVGGElement;
  private trackPast: SVGPathElement;
  private trackFuture: SVGPathElement;
  private trackDots: SVGGElement;
  private t = 0;
  selectedEvent: string | null = null;
  onEventClick: (e: REvent) => void = () => {};
  visible = { control: true, front: true, routes: true, routesFull: false, pockets: true, demarcation: true, events: true };

  constructor(private map: MapView, private st: StaticLayers, private db: DB) {
    const G = st.groups;
    this.fillPL = svgEl('path', { class: 'fill-pl' }, G.fillPL);
    this.fillDE = svgEl('path', { class: 'fill-de', fill: 'url(#pat-de)' }, G.fillDE);
    this.fillSU = svgEl('path', { class: 'fill-su', fill: 'url(#pat-su)' }, G.fillSU);
    this.frontHalo = svgEl('path', { class: 'front-halo' }, G.fronts);
    this.frontDE = svgEl('path', { class: 'front front-de' }, G.fronts);
    this.frontDE2 = svgEl('path', { class: 'front2 front-de2' }, G.fronts);
    this.frontSU = svgEl('path', { class: 'front front-su' }, G.fronts);
    this.frontSU2 = svgEl('path', { class: 'front2 front-su2' }, G.fronts);
    this.contact = svgEl('path', { class: 'contact' }, G.fronts);
    this.trackFuture = svgEl('path', { class: 'track-future' }, G.trackSel);
    this.trackPast = svgEl('path', { class: 'track-past' }, G.trackSel);
    this.trackDots = svgEl('g', { class: 'track-dots' }, G.trackSel);

    this.routeLabelsG = svgEl('g', { class: 'route-labels' }, map.screenSvg);
    this.pocketsG = svgEl('g', { class: 'pockets' }, map.screenSvg);
    this.eventsG = svgEl('g', { class: 'events' }, map.screenSvg);

    for (const r of db.routes) {
      const full = svgEl('path', { class: `route-full side-${r.side} role-${r.role ?? "land"}` }, G.routes);
      const body = svgEl('path', { class: `arrow side-${r.side} st-${r.style} role-${r.role ?? "land"}`, fill: SIDE_ARROW[r.side].fill, stroke: SIDE_ARROW[r.side].stroke }, G.routes);
      const hatch = svgEl('path', { class: 'arrow-hatch' }, G.routes);
      const label = svgEl('g', { class: `route-label side-${r.side}` }, this.routeLabelsG);
      label.innerHTML = r.label ? `<text>${escapeXml(r.label)}</text>` : '';
      full.setAttribute('d', 'M' + r.wps.map((w) => project(w.ll).map((v) => v.toFixed(1)).join(',')).join('L'));
      this.routeEls.push({ r, body, hatch, full, label, lastKey: '' });
    }
    for (const d of db.demarcation) {
      const pts = d.line.map((ll) => project(ll));
      const path = svgEl('path', { class: `demarc ${d.id.includes('0928') ? 'final' : 'pact'}`, d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') }, G.demarc);
      const label = svgEl('g', { class: 'demarc-label' }, map.screenSvg);
      label.innerHTML = `<text>${escapeXml(d.name.zh)}</text>`;
      this.demarcEls.push({ d, path, label, mid: pts[Math.floor(pts.length * 0.42)] });
    }
    for (const p of db.pockets) {
      const g = svgEl('g', { class: 'pocket' }, this.pocketsG);
      g.innerHTML = `<circle class="pk-ring" r="18"/><circle class="pk-ring2" r="18"/><text class="pk-name" y="-24">${escapeXml(p.name.zh)}</text><text class="pk-days" y="32"></text>`;
      g.style.display = 'none';
      this.pocketEls.set(p.id, g);
    }
    for (const e of db.events) {
      const g = svgEl('g', { class: `evt cat-${e.category} imp${e.importance}` }, this.eventsG);
      g.style.color = EVENT_COLOR[e.category] ?? '#333';
      g.innerHTML = `<circle class="evt-pulse" r="14"/><circle class="evt-bg" r="12"/><g class="evt-ic" stroke="currentColor" fill="none">${EVENT_ICON[e.category] ?? EVENT_ICON.battle}</g><text class="evt-t" y="25">${escapeXml(e.title.zh)}</text>`;
      g.style.display = 'none';
      g.addEventListener('click', (ev) => { ev.stopPropagation(); this.onEventClick(e); });
      this.eventEls.set(e.id, g);
    }
  }

  setGeometry(g: GeomResult) {
    this.fillDE.setAttribute('d', polyD(g.fills.DE));
    this.fillSU.setAttribute('d', polyD(g.fills.SU));
    this.fillPL.setAttribute('d', polyD(g.fills.PL));
    const de = lineD(g.fronts.DE), su = lineD(g.fronts.SU);
    this.frontHalo.setAttribute('d', de + su);
    this.frontDE.setAttribute('d', de);
    this.frontDE2.setAttribute('d', de);
    this.frontSU.setAttribute('d', su);
    this.frontSU2.setAttribute('d', su);
    this.contact.setAttribute('d', lineD(g.fronts.contact));
  }

  setVisible(k: keyof DynamicLayers['visible'], v: boolean) {
    this.visible[k] = v;
    const G = this.st.groups;
    if (k === 'control') for (const g of [G.fillDE, G.fillSU, G.fillPL]) g.style.display = v ? '' : 'none';
    if (k === 'front') G.fronts.style.display = v ? '' : 'none';
    if (k === 'routes' || k === 'routesFull') { G.routes.style.display = this.visible.routes || this.visible.routesFull ? '' : 'none'; this.routeLabelsG.style.display = this.visible.routes ? '' : 'none'; }
    if (k === 'demarcation') { G.demarc.style.display = v ? '' : 'none'; G.airspace.style.display=v?'':'none'; }
    if (k === 'pockets') this.pocketsG.style.display = v ? '' : 'none';
    if (k === 'events') this.eventsG.style.display = v ? '' : 'none';
    this.setTime(this.t, true);
    this.updateView(this.map.view);
  }

  /** 时间变化 */
  setTime(t: number, force = false) {
    this.t = t;
    for (const R of this.routeEls) {
      const r = R.r;
      const h0 = r.wps[0].h, h1 = r.wps[r.wps.length - 1].h;
      const op = routeOpacity(r,t);
      const showFull = this.visible.routesFull;
      R.full.style.display = showFull ? '' : 'none';
      if (op <= 0.01 && !showFull) {
        if (R.body.style.display !== 'none') { R.body.style.display = 'none'; R.hatch.style.display = 'none'; R.label.style.display = 'none'; }
        continue;
      }
      const tt = Math.min(t, h1);
      const key = `${Math.round(tt * (r.role ? 240 : 4))}:${this.kBucket}`;
      if (key !== R.lastKey || force) {
        R.lastKey = key;
        const prog = routeProgress(r, tt).map((ll) => project(ll));
        // 箭头宽度在屏幕上夹紧：远景按实际宽度，近景不超过 maxPx，避免遮盖棋子
        const k = this.map.view.k;
        const maxPx = r.style === 'main' ? 24 : 17;
        const w = Math.max(6, Math.min(maxPx, (r.widthKm / KM) * k)) / k;
        const d = arrowPath(prog, w);
        R.body.setAttribute('d', d);
        R.hatch.setAttribute('d', d);
        (R as RouteEl & { tip?: number[] }).tip = prog.length ? prog[prog.length - 1] : undefined;
        (R as RouteEl & { mid?: number[] }).mid = prog.length > 1 ? prog[Math.floor(prog.length / 2)] : undefined;
      }
      const near = this.map.relK >= 4 ? 0.6 : 1;
      const o = String(op * near);
      R.body.style.display = this.visible.routes ? '' : 'none'; R.hatch.style.display = this.visible.routes ? '' : 'none';
      R.body.style.opacity = o; R.hatch.style.opacity = o;
      R.label.style.opacity = String(op);
    }
    for (const D of this.demarcEls) {
      const on = t >= D.d.h0 && t <= D.d.h1;
      D.path.style.display = on ? '' : 'none';
      D.label.style.display = on && this.visible.demarcation ? '' : 'none';
    }
    for (const p of this.db.pockets) {
      const g = this.pocketEls.get(p.id)!;
      const on = t >= p.h0 && t <= p.h1 + 6;
      g.style.display = on ? '' : 'none';
      if (on) {
        const day = Math.max(1, Math.floor((Math.min(t, p.h1) - p.h0) / 24) + 1);
        const txt = t > p.h1 ? (p.fate === 'broke_out' ? '突围' : p.fate === 'relieved' ? '解围' : '陷落') : `被围第 ${day} 天`;
        (g.querySelector('.pk-days') as SVGTextElement).textContent = txt;
        g.classList.toggle('ended', t > p.h1);
      }
    }
    for (const e of this.db.events) {
      const g = this.eventEls.get(e.id)!;
      const on = t >= e.h - 2 && t <= Math.max(e.h1, e.h) + (e.importance === 1 ? 30 : 16);
      g.style.display = on || e.id === this.selectedEvent ? '' : 'none';
      g.classList.toggle('active', e.id === this.selectedEvent);
    }
    this.updateView(this.map.view);
  }

  /** 视图变化：屏幕层定位 */
  private kBucket = 0;
  updateView(v: View, zooming = false) {
    const rel = this.map.relK;
    const bucket = Math.round(Math.log(v.k) / Math.log(1.22));
    if (bucket !== this.kBucket && !zooming) { this.kBucket = bucket; this.setTime(this.t); return; }
    const S = (wx: number, wy: number) => `translate(${(v.x + wx * v.k).toFixed(1)},${(v.y + wy * v.k).toFixed(1)})`;
    // 路线注记：主攻优先 + 屏幕避让
    const boxes: number[][] = [];
    const order = [...(this.routeEls as (RouteEl & { mid?: number[] })[])].sort((a, b) => (a.r.style === 'main' ? 0 : 1) - (b.r.style === 'main' ? 0 : 1));
    for (const R of order) {
      if (!R.r.label || !R.mid || R.body.style.display === 'none' || rel < 1.35 || Number(R.label.style.opacity || 1) < 0.3) { R.label.style.display = 'none'; continue; }
      const sx = v.x + R.mid[0] * v.k, sy = v.y + R.mid[1] * v.k;
      const w = R.r.label.length * 12 + 8, h = 16;
      const box = [sx - w / 2, sy - 12, w, h];
      if (boxes.some((b) => box[0] < b[0] + b[2] && box[0] + box[2] > b[0] && box[1] < b[1] + b[3] && box[1] + box[3] > b[1])) { R.label.style.display = 'none'; continue; }
      boxes.push(box);
      R.label.style.display = '';
      R.label.setAttribute('transform', S(R.mid[0], R.mid[1]));
    }
    for (const D of this.demarcEls) if (D.label.style.display !== 'none') D.label.setAttribute('transform', S(D.mid[0], D.mid[1]));
    for (const p of this.db.pockets) {
      const g = this.pocketEls.get(p.id)!;
      if (g.style.display === 'none') continue;
      const [wx, wy] = project(p.anchor);
      g.setAttribute('transform', S(wx, wy));
    }
    for (const e of this.db.events) {
      const g = this.eventEls.get(e.id)!;
      if (g.style.display === 'none') continue;
      const [wx, wy] = project(e.ll);
      g.setAttribute('transform', S(wx, wy));
    }
  }

  /** 选中部队的轨迹 */
  showTrack(u: RUnit | null, t: number) {
    if (!u || !u.track.length) { this.trackPast.setAttribute('d', ''); this.trackFuture.setAttribute('d', ''); this.trackDots.innerHTML = ''; return; }
    const col = SIDE_COUNTER[u.side].edge;
    const pts = u.track.map((p) => ({ h: p.h, xy: project(p.ll) }));
    const past = pts.filter((p) => p.h <= t).map((p) => p.xy);
    const future = pts.filter((p) => p.h >= t).map((p) => p.xy);
    if (past.length && future.length) { past.push(future[0]); }
    const D = (a: number[][]) => (a.length > 1 ? 'M' + a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') : '');
    this.trackPast.setAttribute('d', D(past));
    this.trackFuture.setAttribute('d', D(future));
    this.trackPast.style.stroke = col;
    this.trackFuture.style.stroke = col;
    this.trackDots.innerHTML = pts.map((p) => `<circle cx="${p.xy[0].toFixed(1)}" cy="${p.xy[1].toFixed(1)}" r="1" class="${p.h <= t ? 'past' : 'fut'}" style="stroke:${col}"/>`).join('');
  }

  pocketAt(t: number): RPocket[] { return this.db.pockets.filter((p) => t >= p.h0 && t <= p.h1); }
  eventsNear(t: number, win = 12): REvent[] { return this.db.events.filter((e) => Math.abs(e.h - t) <= win); }
  static fmt = fmtShort;
  static toLL(x: LonLat) { return x; }
}
