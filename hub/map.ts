/**
 * 作战地图桌：全屏的 1938 年世界形势图。
 *  - 底图（Canvas，hub/basemap.ts）按日期为各国着色；
 *  - 覆盖层（SVG）：战区轮廓（世界坐标）、红线、火漆印与模板字（屏幕坐标，缩放时大小不变、互相避让）；
 *  - 镜头：d3-zoom 处理拖动 / 滚轮 / 双指缩放，flyTo 用 van Wijk 平滑缩放曲线（先拉远再推近）。
 * 战役一律来自 catalog（campaign.json 的 hub 字段），这里不写死任何战役或阵营。
 */
import { geoPath } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import type { Topology, GeometryCollection, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select, type Selection } from 'd3-selection';
import { interpolateZoom } from 'd3-interpolate';
import gsap from 'gsap';
import { BaseMap, type View } from './basemap';
import { projection, project, worldRect, unionRect, WORLD_W, WORLD_H } from './geo';
import { parseStatus, type CatalogEntry, type WorldData, type Status, type StatusChange, type Theatre, type BBox } from './types';
import { dayOf } from './dates';

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number | undefined>;
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export interface Insets { top: number; right: number; bottom: number; left: number }
interface CountryProps { id: string; of?: string; sov?: string }
interface PinState { c: CatalogEntry; el: SVGGElement; stencil: SVGTextElement; leader: SVGLineElement; dot: SVGCircleElement; wx: number; wy: number; sx: number; sy: number; region: string | null; idx: number }

/** 用户手动缩放的上限（1° ≈ 90px）；世界底图（world_1938）的精度到此为止，更近的细节交给战役地图 */
export const K_MAX = 8;

export class HubMap {
  readonly stage: HTMLElement;
  readonly base: BaseMap;
  private readonly svg: SVGSVGElement;
  private readonly gTheatres: SVGGElement;
  private readonly gThread: SVGGElement;
  private readonly gLeaders: SVGGElement;
  private readonly gStencils: SVGGElement;
  private readonly gPins: SVGGElement;
  private readonly sealedPattern: SVGPatternElement;
  private readonly sel: Selection<HTMLElement, unknown, null, undefined>;
  private readonly zoomer: ZoomBehavior<HTMLElement, unknown>;
  private t: ZoomTransform = zoomIdentity;
  private kMin = 0.3;
  private raf = 0;
  private flight: { cancel: () => void } | null = null;
  private readonly timelines = new Map<string, { day: number; status: Status }[]>();
  readonly theatres = new Map<string, { el: SVGGElement; path: Path2D; rect: BBox }>();
  readonly pins = new Map<string, PinState>();
  readonly regions: Theatre[];
  private day = 0;
  private focusId: string | null = null;
  private filter: Set<string> | null = null;
  private lastPointer = 'mouse';
  private pointerAt = -1e9;
  /** 悬停 / 聚焦 / 点击回调（main.ts 接到档案夹与转场） */
  onHover: (c: CatalogEntry | null) => void = () => {};
  onFocus: (c: CatalogEntry) => void = () => {};
  /** viaTouch：本次点击来自触屏/触控笔（先展开卷宗，再点一次进入） */
  onActivate: (c: CatalogEntry, viaTouch: boolean) => void = () => {};
  /** 镜头变化（moving = 正在拖动或飞行） */
  onView: (moving: boolean) => void = () => {};
  /** 地图上可用于取景的区域（扣除浮动面板） */
  insets: () => Insets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });

  constructor(host: HTMLElement, private topo: Topology, private entries: CatalogEntry[], private world: WorldData) {
    this.stage = host;
    this.base = new BaseMap(host, topo, world);
    this.regions = world.theatres;
    this.buildTimelines();

    this.svg = svg('svg', { class: 'overlay', role: 'group', 'aria-label': '1938 年世界形势图：各战役战区与火漆印' }, host);
    const defs = svg('defs', {}, this.svg);
    for (const [id, a, b, c] of [['wax', '#d2483f', '#9c1f1f', '#5e0c0e'], ['wax-sealed', '#8b857b', '#57524b', '#2e2b27'], ['wax-on', '#e85a4c', '#b0262a', '#6e1012']]) {
      const g = svg('radialGradient', { id, cx: '38%', cy: '32%', r: '75%' }, defs);
      svg('stop', { offset: '0%', 'stop-color': a }, g);
      svg('stop', { offset: '55%', 'stop-color': b }, g);
      svg('stop', { offset: '100%', 'stop-color': c }, g);
    }
    const f = svg('filter', { id: 'pin-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    f.innerHTML = '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/><feOffset dx="1.6" dy="2.4" result="o"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>';
    this.sealedPattern = svg('pattern', { id: 'pat-sealed', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs);
    this.sealedPattern.innerHTML = '<rect width="8" height="8" fill="rgba(40,36,30,.08)"/><path d="M0 0V8" stroke="#3b342a" stroke-width="2.2" opacity=".22" transform="rotate(45 4 4)"/>';
    this.gTheatres = svg('g', { class: 'theatres' }, this.svg);
    this.gThread = svg('g', { class: 'thread', 'aria-hidden': 'true' }, this.svg);
    this.gLeaders = svg('g', { class: 'leaders', 'aria-hidden': 'true' }, this.svg);
    this.gStencils = svg('g', { class: 'stencils', 'aria-hidden': 'true' }, this.svg);
    this.gPins = svg('g', { class: 'pins' }, this.svg);
    this.buildTheatres();
    this.buildPins();

    host.addEventListener('pointerdown', (ev) => { this.lastPointer = ev.pointerType; this.pointerAt = performance.now(); }, true);
    this.sel = select(host);
    this.zoomer = zoom<HTMLElement, unknown>()
      .clickDistance(5)
      .filter((ev: Event & { button?: number; ctrlKey?: boolean }) => (!ev.ctrlKey || ev.type === 'wheel') && !ev.button && !(ev.type === 'dblclick' && (ev.target as Element).closest?.('.pin')))
      .on('start', (ev) => { if (ev.sourceEvent) { this.cancelFlight(); this.stage.classList.add('dragging'); } })
      .on('zoom', (ev) => { this.t = ev.transform; this.schedule(); this.onView(true); })
      .on('end', () => { this.stage.classList.remove('dragging'); this.onView(false); });
    this.sel.call(this.zoomer).on('dblclick.zoom', null);
    this.sel.on('dblclick.hub', (ev: MouseEvent) => { if ((ev.target as Element).closest('.pin')) return; const r = host.getBoundingClientRect(); this.zoomAround(2, ev.clientX - r.left, ev.clientY - r.top); });
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    document.fonts?.ready.then(() => this.schedule());
  }

  // ---------- 时间表 ----------
  private buildTimelines() {
    const parse = (list: StatusChange[] | undefined) => (list ?? []).map((ch) => ({ day: dayOf(ch.from), status: ch.status })).sort((a, b) => a.day - b.day);
    for (const id of this.base.countryIds()) {
      const own = this.world.countries[id];
      if (own) { this.timelines.set(id, parse(own)); continue; }
      // 殖民地继承宗主国的交战国 / 附庸状态（不继承占领与交战）
      const sov = this.base.sovereign.get(id);
      const inherited = sov ? parse(this.world.countries[sov]).filter((x) => ['member', 'aligned', 'neutral'].includes(parseStatus(x.status).kind)) : [];
      this.timelines.set(id, inherited);
    }
  }
  statusAt(id: string, day: number): Status {
    let s: Status = 'neutral';
    for (const ch of this.timelines.get(id) ?? []) if (ch.day <= day) s = ch.status; else break;
    return s;
  }

  // ---------- 战区与火漆印 ----------
  private theatreGeometry(c: CatalogEntry): { d: string; path: Path2D; rect: BBox } | null {
    const th = c.hub.theatre;
    let geom: Geometry | Feature | null = null;
    if (th?.countries?.length) {
      const set = new Set(th.countries);
      const geoms = (this.topo.objects.countries as GeometryCollection<CountryProps>).geometries.filter((gm) => set.has((gm.properties as CountryProps).id));
      if (!geoms.length) { console.warn(`[hub] ${c.id}: hub.theatre.countries 在底图中找不到`, th.countries); return null; }
      geom = merge(this.topo, geoms as (TopoPolygon | TopoMultiPolygon)[]) as Geometry;
      const d = geoPath(projection)(geom) ?? '';
      const b = geoPath(projection).bounds(geom);
      return { d, path: new Path2D(d), rect: [b[0][0], b[0][1], b[1][0], b[1][1]] };
    }
    if (th?.bbox) {
      const r = worldRect(th.bbox);
      const d = `M${r[0]},${r[1]}H${r[2]}V${r[3]}H${r[0]}Z`;
      return { d, path: new Path2D(d), rect: r };
    }
    return null;
  }

  private buildTheatres() {
    // 大战区在下，嵌套的小战区（克里特）在上，便于悬停
    const list = [...this.entries].sort((a, b) => (a.hub.parent ? 1 : 0) - (b.hub.parent ? 1 : 0));
    for (const c of list) {
      const g = this.theatreGeometry(c);
      if (!g) continue;
      const tg = svg('g', { class: `theatre ${c.status === 'planned' ? 'sealed' : ''} ${c.hub.theatre?.kind === 'air' ? 'air' : ''}`, 'data-id': c.id }, this.gTheatres);
      svg('path', { class: 'th-fill', d: g.d }, tg);
      svg('path', { class: 'th-line', d: g.d }, tg);
      tg.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') this.onHover(c); });
      tg.addEventListener('click', () => this.onActivate(c, this.lastPointer !== 'mouse'));
      this.theatres.set(c.id, { el: tg, path: g.path, rect: g.rect });
    }
  }

  /** 战役所属分区：hub.region，或火漆印落在哪个分区的取景框内 */
  regionOf(c: CatalogEntry): string | null {
    if (c.hub.region && this.regions.some((r) => r.id === c.hub.region)) return c.hub.region;
    const [lon, lat] = c.hub.pin;
    return this.regions.find((r) => lon >= r.view[0] && lon <= r.view[2] && lat >= r.view[1] && lat <= r.view[3])?.id ?? null;
  }

  private buildPins() {
    const order = [...this.entries].sort((a, b) => dayOf(a.time.start) - dayOf(b.time.start));
    const roman = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'];
    order.forEach((c, i) => {
      const [wx, wy] = project(c.hub.pin);
      const sealed = c.status === 'planned';
      const leader = svg('line', { class: 'leader' }, this.gLeaders);
      const dot = svg('circle', { class: 'leader-dot', r: 2.2 }, this.gLeaders);
      const stencil = svg('text', { class: `stencil ${sealed ? 'sealed' : ''}`, 'data-id': c.id }, this.gStencils);
      stencil.textContent = c.hub.stencil ?? c.title.en.replace(/^the\s+/i, '').toUpperCase();
      const label = `${c.title.mark} ${c.title.zh}${sealed ? '：绝密，筹备中' : c.playable ? '：查看卷宗，回车进入作战室' : '：尚未开放'}`;
      const pin = svg('g', { class: `pin ${sealed ? 'sealed' : ''} ${c.playable ? '' : 'locked'}`, tabindex: 0, role: 'button', 'aria-label': label, 'data-id': c.id }, this.gPins);
      const inner = svg('g', { class: 'pin-inner' }, pin);
      svg('circle', { class: 'pin-pulse', r: 12 }, inner); // 时间带日期落在战役期间时扩散
      const body = svg('g', { class: 'pin-body', filter: 'url(#pin-shadow)' }, inner);
      // 不规则蜡滴边缘
      const blob = Array.from({ length: 18 }, (_, k) => { const a = (k / 18) * Math.PI * 2; const r = 12.6 + Math.sin(k * 2.7 + i) * 0.9 + (k % 3 === 0 ? 0.8 : 0); return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`; });
      svg('polygon', { class: 'wax-drip', points: blob.join(' ') }, body);
      svg('circle', { class: 'wax', r: 10.4 }, body);
      svg('circle', { class: 'wax-ring', r: 7.6 }, body);
      const t = svg('text', { class: 'wax-num', y: 3.6, 'text-anchor': 'middle' }, body);
      t.textContent = sealed ? '密' : roman[i] ?? String(i + 1);
      svg('circle', { class: 'pin-hit', r: 18 }, inner);
      pin.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') this.onHover(c); });
      // 只有键盘聚焦才展开卷宗；点按引起的聚焦交给 click 处理（触屏要先展开、再点一次进入）
      pin.addEventListener('focus', () => { if (performance.now() - this.pointerAt > 500) { this.onFocus(c); this.ensureVisible(c); } });
      pin.addEventListener('click', () => this.onActivate(c, this.lastPointer !== 'mouse'));
      pin.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.onActivate(c, false); } });
      this.pins.set(c.id, { c, el: pin, stencil, leader, dot, wx, wy, sx: 0, sy: 0, region: this.regionOf(c), idx: i });
    });
  }

  // ---------- 绘制 ----------
  get view(): View { return { k: this.t.k, x: this.t.x, y: this.t.y }; }
  get width() { return this.base.w; }
  get height() { return this.base.h; }
  get minK() { return this.kMin; }

  schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const more = this.base.render(this.view);
      this.layoutOverlay();
      if (more) this.schedule();
    });
  }

  private layoutOverlay() {
    const { k, x, y } = this.t;
    this.gTheatres.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(5)})`);
    this.sealedPattern.setAttribute('patternTransform', `scale(${(1 / k).toFixed(5)})`);
    // 火漆印：随缩放略变大，重叠时互相推开（带引线指回真实位置）
    const s = clamp(0.62 + 0.2 * Math.log2(k / 0.5), 0.62, 1);
    const R = 13.5 * s + 1.5;
    const P = [...this.pins.values()];
    for (const p of P) { p.sx = p.wx * k + x; p.sy = p.wy * k + y; }
    const tx = P.map((p) => p.sx), ty = P.map((p) => p.sy);
    for (let it = 0; it < 24; it++) {
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        let dx = P[j].sx - P[i].sx, dy = P[j].sy - P[i].sy;
        let d = Math.hypot(dx, dy);
        if (d >= 2 * R) continue;
        if (d < 0.01) { dx = Math.cos(j * 2.4); dy = Math.sin(j * 2.4); d = 1; }
        const push = (2 * R - d) / 2;
        P[i].sx -= (dx / d) * push; P[i].sy -= (dy / d) * push;
        P[j].sx += (dx / d) * push; P[j].sy += (dy / d) * push;
      }
      for (let i = 0; i < P.length; i++) { P[i].sx += (tx[i] - P[i].sx) * 0.12; P[i].sy += (ty[i] - P[i].sy) * 0.12; }
    }
    const showStencils = k >= 0.95;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.el.setAttribute('transform', `translate(${p.sx.toFixed(1)},${p.sy.toFixed(1)})`);
      (p.el.firstChild as SVGGElement).setAttribute('transform', `scale(${s.toFixed(3)})`);
      const off = Math.hypot(p.sx - tx[i], p.sy - ty[i]) > 4;
      p.leader.style.display = p.dot.style.display = off ? '' : 'none';
      if (off) {
        p.leader.setAttribute('x1', tx[i].toFixed(1)); p.leader.setAttribute('y1', ty[i].toFixed(1));
        p.leader.setAttribute('x2', p.sx.toFixed(1)); p.leader.setAttribute('y2', p.sy.toFixed(1));
        p.dot.setAttribute('cx', tx[i].toFixed(1)); p.dot.setAttribute('cy', ty[i].toFixed(1));
      }
      const o = 13 * s + 8;
      const [dx, dy, anchor] = ({ n: [0, -o - 2, 'middle'], s: [0, o + 10, 'middle'], e: [o, 4, 'start'], w: [-o, 4, 'end'] } as const)[p.c.hub.labelAt ?? 's'];
      p.stencil.setAttribute('x', (p.sx + dx).toFixed(1));
      p.stencil.setAttribute('y', (p.sy + dy).toFixed(1));
      p.stencil.setAttribute('text-anchor', anchor);
      p.stencil.classList.toggle('shown', showStencils || this.focusId === p.c.id);
    }
    // 红线：同一分区内按开战日期串起火漆印，每段自然下垂
    const byRegion = new Map<string, PinState[]>();
    for (const p of P) if (p.region) byRegion.set(p.region, [...(byRegion.get(p.region) ?? []), p]);
    let d = '', dPlanned = '';
    for (const list of byRegion.values()) {
      list.sort((a, b) => a.idx - b.idx);
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        const ddx = b.sx - a.sx, ddy = b.sy - a.sy, dist = Math.hypot(ddx, ddy) || 1;
        let nx = -ddy / dist, ny = ddx / dist;
        if (ny < 0 || (Math.abs(ny) < 0.35 && nx < 0)) { nx = -nx; ny = -ny; }
        const cx = (a.sx + b.sx) / 2 + nx * dist * 0.18, cy = (a.sy + b.sy) / 2 + ny * dist * 0.18 + dist * 0.05;
        const seg = `M${a.sx.toFixed(1)},${a.sy.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.sx.toFixed(1)},${b.sy.toFixed(1)}`;
        if (b.c.status === 'planned') dPlanned += seg; else d += seg;
      }
    }
    if (!this.gThread.firstChild) {
      svg('path', { class: 'thread-shadow', transform: 'translate(1.4,2.2)' }, this.gThread);
      svg('path', { class: 'thread-line' }, this.gThread);
      svg('path', { class: 'thread-line planned' }, this.gThread);
    }
    const [shadow, line, planned] = [...this.gThread.children] as SVGPathElement[];
    shadow.setAttribute('d', d); line.setAttribute('d', d); planned.setAttribute('d', dPlanned);
  }

  // ---------- 镜头 ----------
  private resize() {
    const r = this.stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const first = this.base.w === 0;
    const old = { w: this.base.w, h: this.base.h };
    this.base.resize(r.width, r.height);
    this.svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    this.kMin = Math.max(r.width / WORLD_W, r.height / WORLD_H);
    this.zoomer.extent([[0, 0], [r.width, r.height]]).scaleExtent([this.kMin, K_MAX]).translateExtent([[0, 0], [WORLD_W, WORLD_H]]);
    if (first) { this.apply(this.constrain(zoomIdentity.scale(this.kMin))); return; }
    // 尺寸变化时保持画面中心的地理位置
    const cx = (old.w / 2 - this.t.x) / this.t.k, cy = (old.h / 2 - this.t.y) / this.t.k;
    const k = Math.max(this.kMin, this.t.k);
    this.apply(this.constrain(zoomIdentity.translate(r.width / 2 - cx * k, r.height / 2 - cy * k).scale(k)));
  }

  private constrain(t: ZoomTransform): ZoomTransform {
    const w = this.base.w, h = this.base.h;
    const k = clamp(t.k, this.kMin, K_MAX * 6);
    const x = clamp(t.x, w - WORLD_W * k, 0), y = clamp(t.y, h - WORLD_H * k, 0);
    return zoomIdentity.translate(x, y).scale(k);
  }
  private apply(t: ZoomTransform) { this.zoomer.transform(this.sel, t); }

  /** 让世界矩形落在可用区域（扣除浮动面板）中央 */
  fitTransform(rect: BBox, opts: { insets?: Insets; maxK?: number; pad?: number } = {}): ZoomTransform {
    const ins = opts.insets ?? this.insets();
    const pad = opts.pad ?? 28;
    const w = this.base.w, h = this.base.h;
    const aw = Math.max(80, w - ins.left - ins.right - 2 * pad), ah = Math.max(80, h - ins.top - ins.bottom - 2 * pad);
    const k = clamp(Math.min(aw / (rect[2] - rect[0] || 1), ah / (rect[3] - rect[1] || 1)), this.kMin, opts.maxK ?? K_MAX);
    const cx = (rect[0] + rect[2]) / 2, cy = (rect[1] + rect[3]) / 2;
    const sx = ins.left + pad + aw / 2, sy = ins.top + pad + ah / 2;
    return this.constrain(zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k));
  }

  /** 平滑飞行到目标镜头；用户拖动或缩放会打断 */
  flyTo(target: ZoomTransform, ms?: number, unconstrained = false): Promise<void> {
    this.cancelFlight();
    const to = unconstrained ? target : this.constrain(target);
    const w = this.base.w, h = this.base.h;
    const from = this.t;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || ms === 0) { this.apply(to); return Promise.resolve(); }
    const p0: [number, number, number] = [(w / 2 - from.x) / from.k, (h / 2 - from.y) / from.k, w / from.k];
    const p1: [number, number, number] = [(w / 2 - to.x) / to.k, (h / 2 - to.y) / to.k, w / to.k];
    const interp = (interpolateZoom as typeof interpolateZoom & { rho(r: number): typeof interpolateZoom }).rho(1.15)(p0, p1); // rho 小于缺省的 √2：拉远得少一些
    const dur = ms ?? clamp(interp.duration * 0.75, 450, 2200);
    return new Promise((resolve) => {
      const t0 = performance.now();
      let raf = 0;
      const step = (now: number) => {
        const u = Math.min(1, (now - t0) / dur);
        const [cx, cy, vw] = interp(ease(u));
        const k = w / vw;
        this.zoomer.transform(this.sel, zoomIdentity.translate(w / 2 - cx * k, h / 2 - cy * k).scale(k));
        if (u < 1) raf = requestAnimationFrame(step);
        else { this.flight = null; this.onView(false); resolve(); }
      };
      this.flight = { cancel: () => { cancelAnimationFrame(raf); this.flight = null; resolve(); } };
      raf = requestAnimationFrame(step);
    });
  }
  cancelFlight() { this.flight?.cancel(); }

  zoomAround(factor: number, sx = this.base.w / 2, sy = this.base.h / 2) {
    const k = clamp(this.t.k * factor, this.kMin, K_MAX);
    const wx = (sx - this.t.x) / this.t.k, wy = (sy - this.t.y) / this.t.k;
    return this.flyTo(zoomIdentity.translate(sx - wx * k, sy - wy * k).scale(k), 380);
  }

  /** 全部卷宗（战区并集）的取景；纬度裁到 75°N（挪威战区含斯瓦尔巴，会把画面撑得过高） */
  allRect(list = this.entries): BBox {
    const yTop = project([0, 75])[1];
    const rects = list.map((c) => this.theatres.get(c.id)?.rect ?? worldRect([c.hub.pin[0] - 2, c.hub.pin[1] - 2, c.hub.pin[0] + 2, c.hub.pin[1] + 2]));
    const u = unionRect(rects);
    return u ? [u[0], Math.max(u[1], yTop), u[2], Math.max(u[3], yTop + 1)] : [0, 0, WORLD_W, WORLD_H];
  }
  /** 分区取景：分区框与其中战区的并集 */
  regionRect(id: string): BBox | null {
    const r = this.regions.find((x) => x.id === id);
    if (!r) return null;
    const members = [...this.pins.values()].filter((p) => p.region === id).map((p) => p.c);
    const u = unionRect([worldRect(r.view), ...members.map((c) => this.theatres.get(c.id)?.rect).filter((x): x is BBox => !!x)])!;
    const yTop = project([0, 75])[1];
    return [u[0], Math.max(u[1], yTop), u[2], u[3]];
  }
  /** 当前镜头最接近哪个分区（world = 接近全图） */
  currentRegion(): string | null {
    const { k, x, y } = this.t;
    if (k < this.kMin * 1.25) return 'world';
    const vis: BBox = [-x / k, -y / k, (this.base.w - x) / k, (this.base.h - y) / k];
    let best: string | null = null, score = 0.3;
    for (const r of this.regions) {
      const rr = this.regionRect(r.id)!;
      const ix = Math.max(0, Math.min(vis[2], rr[2]) - Math.max(vis[0], rr[0])), iy = Math.max(0, Math.min(vis[3], rr[3]) - Math.max(vis[1], rr[1]));
      const inter = ix * iy, uni = (vis[2] - vis[0]) * (vis[3] - vis[1]) + (rr[2] - rr[0]) * (rr[3] - rr[1]) - inter;
      if (inter / uni > score) { score = inter / uni; best = r.id; }
    }
    return best;
  }

  /** 卷宗被键盘或索引选中时，火漆印不在可视区域内就把它移进来 */
  ensureVisible(c: CatalogEntry) {
    const p = this.pins.get(c.id);
    if (!p) return;
    const ins = this.insets();
    const sx = p.wx * this.t.k + this.t.x, sy = p.wy * this.t.k + this.t.y;
    if (sx > ins.left + 30 && sx < this.base.w - ins.right - 30 && sy > ins.top + 30 && sy < this.base.h - ins.bottom - 30) return;
    const rect = this.theatres.get(c.id)?.rect ?? worldRect([c.hub.pin[0] - 3, c.hub.pin[1] - 3, c.hub.pin[0] + 3, c.hub.pin[1] + 3]);
    void this.flyTo(this.fitTransform(rect, { maxK: Math.max(this.t.k, 2.2) }));
  }

  /** 进入战役的推进终点：按战役页面开场的取景（左侧侧栏、上方顶栏、下方时间轴）框住它的地图范围 */
  campaignTransform(c: CatalogEntry, maxK: number): { t: ZoomTransform; full: ZoomTransform } {
    const rect = c.view ? worldRect(c.view.bbox) : this.theatres.get(c.id)?.rect ?? worldRect([c.hub.pin[0] - 3, c.hub.pin[1] - 3, c.hub.pin[0] + 3, c.hub.pin[1] + 3]);
    const narrow = this.base.w < 760;
    const ins: Insets = narrow ? { top: 60, right: 0, bottom: 150, left: 0 } : { top: 64, right: 20, bottom: 150, left: Math.min(360, this.base.w * 0.3) };
    const full = this.fitTransform(rect, { insets: ins, maxK: 400, pad: 0 });
    // 底图精度有限：推到 maxK 为止，剩下的放大由战役页面的开场快照接续
    const k = Math.min(full.k, maxK);
    const w = this.base.w, h = this.base.h;
    const cx = (w / 2 - full.x) / full.k, cy = (h / 2 - full.y) / full.k;
    return { t: zoomIdentity.translate(w / 2 - cx * k, h / 2 - cy * k).scale(k), full };
  }

  // ---------- 状态 ----------
  highlight(id: string | null) {
    this.focusId = id;
    for (const [k, t] of this.theatres) t.el.classList.toggle('on', k === id);
    for (const [k, p] of this.pins) { p.el.classList.toggle('on', k === id); p.stencil.classList.toggle('on', k === id); }
    this.svg.classList.toggle('has-focus', !!id);
    this.layoutOverlay();
  }

  /** 交战国筛选：只突出这些战役，并在底图上描出这些国家 */
  setFilter(ids: Set<string> | null, countries: string[] = []) {
    this.filter = ids;
    for (const [k, p] of this.pins) { const dim = !!ids && !ids.has(k); p.el.classList.toggle('dim', dim); p.stencil.classList.toggle('dim', dim); p.leader.classList.toggle('dim', dim); }
    for (const [k, t] of this.theatres) t.el.classList.toggle('dim', !!ids && !ids.has(k));
    this.base.highlight = new Set(countries);
    this.schedule();
  }
  get filtered() { return this.filter; }

  /** 时间带日期变化：各国着色、正在进行的战区 */
  setDay(day: number, animate = true) {
    this.day = day;
    const next = new Map<string, Status>();
    for (const id of this.timelines.keys()) next.set(id, this.statusAt(id, day));
    this.base.setStatus(next, animate && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    for (const c of this.entries) {
      const on = dayOf(c.time.start) <= day && day <= dayOf(c.time.end);
      this.theatres.get(c.id)?.el.classList.toggle('active', on);
      this.pins.get(c.id)?.el.classList.toggle('active', on);
    }
    this.schedule();
  }
  get currentDay() { return this.day; }
  statusOf(id: string) { return this.base.statusOf(id); }

  /** 入场动画：火漆印依次落下，红线与模板字淡入 */
  intro(reduced: boolean) {
    if (reduced) return;
    gsap.from(this.svg.querySelectorAll('.pin-body'), { scale: 2.2, opacity: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.12, delay: 0.35, transformOrigin: '50% 50%' });
    gsap.from([this.gThread, this.gStencils, this.gLeaders], { opacity: 0, duration: 0.9, delay: 0.9 });
  }

  /** 立即按当前镜头重绘（不等下一帧） */
  renderNow() {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    this.base.render(this.view);
    this.layoutOverlay();
  }

  /** 转场快照：当前底图 + 目标战区的红线（先同步重绘，保证画面与镜头一致） */
  snapshot(id: string): string {
    this.renderNow();
    const th = this.theatres.get(id);
    return this.base.snapshot(this.view, th ? (ctx, px) => {
      ctx.strokeStyle = '#b3262e';
      ctx.lineWidth = 2.6 * px;
      ctx.setLineDash([7 * px, 3 * px]);
      ctx.lineJoin = 'round';
      ctx.stroke(th.path);
    } : undefined);
  }
}
