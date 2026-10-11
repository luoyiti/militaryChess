/**
 * 作战地图桌：1938 年欧洲形势图（SVG）。
 * 图层（自下而上）：海面 → 海岸涟漪 → 陆地 → 各国状态着色 → 国界 / 分界线 → 河湖 → 经纬网 → 地名
 *                  → 战区轮廓 → 红线（按时间串起各战役）→ 代号模板字 → 火漆印。
 * 战役一律来自 catalog（campaign.json 的 hub 字段），这里不写死任何战役。
 */
import { geoConicConformal, geoPath, geoGraticule, geoDistance, type GeoPermissibleObjects } from 'd3-geo';
import { feature, mesh, merge } from 'topojson-client';
import type { Topology, GeometryCollection, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';
import gsap from 'gsap';
import type { CatalogEntry, OccupationData, Status, LonLat } from './types';
import { dayOf } from './dates';

/** 图幅经纬度范围（图框按投影后的外接矩形放大，四角由更大的底图覆盖） */
const EXTENT: [number, number, number, number] = [-12, 33.5, 44, 70.5];
const NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

/** 经纬度框 → 顺时针采样环（d3-geo 球面多边形外环须顺时针） */
function bboxPolygon([x0, y0, x1, y1]: [number, number, number, number]): Feature {
  const ring: LonLat[] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) ring.push([x0, y0 + ((y1 - y0) * i) / n]);
  for (let i = 1; i <= n; i++) ring.push([x0 + ((x1 - x0) * i) / n, y1]);
  for (let i = 1; i <= n; i++) ring.push([x1, y1 - ((y1 - y0) * i) / n]);
  for (let i = 1; i < n; i++) ring.push([x1 - ((x1 - x0) * i) / n, y0]);
  ring.push(ring[0]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}
function extentPoints(): GeoPermissibleObjects {
  const [x0, y0, x1, y1] = EXTENT;
  const pts: LonLat[] = [];
  for (let x = x0; x <= x1; x += 1) pts.push([x, y0], [x, y1]);
  for (let y = y0; y <= y1; y += 1) pts.push([x0, y], [x1, y]);
  return { type: 'MultiPoint', coordinates: pts };
}

interface CountryProps { id: string; of?: string }

export interface TheatreShape { id: string; el: SVGGElement; outline: SVGPathElement; bounds: [[number, number], [number, number]] }

export class HubMap {
  readonly el: SVGSVGElement;
  readonly width: number;
  readonly height: number;
  private readonly world: SVGGElement;
  private readonly projection = geoConicConformal().parallels([40, 64]).rotate([-16, 0]).center([0, 52]).precision(0.2);
  private readonly path = geoPath(this.projection);
  private readonly countries = new Map<string, SVGPathElement>();
  private readonly status = new Map<string, Status>();
  private readonly splits = new Map<string, { line: SVGPathElement; parts: string[] }>();
  readonly theatres = new Map<string, TheatreShape>();
  readonly pins = new Map<string, SVGGElement>();
  private readonly order: CatalogEntry[];
  /** 悬停 / 聚焦 / 点击回调（main.ts 接到档案夹与转场） */
  onHover: (c: CatalogEntry | null) => void = () => {};
  onFocus: (c: CatalogEntry) => void = () => {};
  /** viaTouch：本次点击来自触屏/触控笔（先展开卷宗，再点一次进入） */
  onActivate: (c: CatalogEntry, viaTouch: boolean) => void = () => {};
  private lastPointer = 'mouse';
  private pointerAt = -1e9;

  constructor(host: HTMLElement, private topo: Topology, private entries: CatalogEntry[], private occ: OccupationData, viewWidth = 1000) {
    const ext = extentPoints();
    this.projection.fitSize([1000, 1000], ext);
    const b = this.path.bounds(ext);
    const aspect = (b[1][0] - b[0][0]) / (b[1][1] - b[0][1]);
    this.width = viewWidth;
    this.height = Math.round(viewWidth / aspect);
    this.projection.fitSize([this.width, this.height], ext);
    this.order = [...entries].sort((a, b) => dayOf(a.time.start) - dayOf(b.time.start));

    this.el = svg('svg', { class: 'hub-map', viewBox: `0 0 ${this.width} ${this.height}`, role: 'img', 'aria-label': '1938 年欧洲形势图：各战役战区与火漆印' }, host);
    this.el.addEventListener('pointerdown', (ev) => { this.lastPointer = ev.pointerType; this.pointerAt = performance.now(); }, true);
    this.buildDefs();
    svg('rect', { class: 'sea', width: this.width, height: this.height }, this.el);
    svg('rect', { class: 'sea-engrave', width: this.width, height: this.height, fill: 'url(#sea-lines)' }, this.el);
    this.world = svg('g', { class: 'world' }, this.el);
    this.buildGeography();
    this.buildGraticule();
    this.buildLabels();
    this.buildTheatres();
    this.buildThread();
    this.buildPins();
    this.buildFrame();
  }

  // ---------- 底图 ----------
  private buildDefs() {
    const defs = svg('defs', {}, this.el);
    const pattern = (id: string, size: number, inner: string, rotate = 0) => {
      const p = svg('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse', patternTransform: rotate ? `rotate(${rotate})` : undefined }, defs);
      p.innerHTML = inner;
    };
    pattern('sea-lines', 4, '<path d="M0 2H4" stroke="#6f8a8c" stroke-width=".35" opacity=".35"/>');
    pattern('pat-occupied', 6, '<rect width="6" height="6" fill="rgba(76,94,122,.24)"/><path d="M0 0V6" stroke="#4c5e7a" stroke-width="1.5" opacity=".6"/>', 45);
    pattern('pat-ally', 6, '<rect width="6" height="6" fill="rgba(111,134,163,.16)"/><circle cx="3" cy="3" r="1.05" fill="#5f7898" opacity=".7"/>');
    pattern('pat-vichy', 7, '<rect width="7" height="7" fill="rgba(146,128,78,.2)"/><path d="M0 0V7" stroke="#8a7a48" stroke-width="1.3" opacity=".55"/>', -45);
    pattern('pat-contested', 7, '<rect width="7" height="7" fill="rgba(179,38,46,.14)"/><path d="M0 0V7M0 0H7" stroke="#b3262e" stroke-width="1" opacity=".5"/>', 45);
    pattern('pat-sealed', 8, '<rect width="8" height="8" fill="rgba(40,36,30,.08)"/><path d="M0 0V8" stroke="#3b342a" stroke-width="2.2" opacity=".22"/>', 45);
    // 火漆：径向渐变 + 轻微高光
    for (const [id, a, b, c] of [['wax', '#d2483f', '#9c1f1f', '#5e0c0e'], ['wax-sealed', '#8b857b', '#57524b', '#2e2b27'], ['wax-on', '#e85a4c', '#b0262a', '#6e1012']]) {
      const g = svg('radialGradient', { id, cx: '38%', cy: '32%', r: '75%' }, defs);
      svg('stop', { offset: '0%', 'stop-color': a }, g);
      svg('stop', { offset: '55%', 'stop-color': b }, g);
      svg('stop', { offset: '100%', 'stop-color': c }, g);
    }
    const f = svg('filter', { id: 'pin-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    f.innerHTML = '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/><feOffset dx="1.6" dy="2.4" result="o"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>';
    const clip = svg('clipPath', { id: 'sheet-clip' }, defs);
    svg('rect', { width: this.width, height: this.height }, clip);
  }

  private buildGeography() {
    const t = this.topo;
    const countries = t.objects.countries as GeometryCollection<CountryProps>;
    const land = feature(t, t.objects.land);
    const g = (cls: string) => svg('g', { class: cls }, this.world);
    // 海岸涟漪：陆地轮廓由粗到细叠三道淡色描边，模仿旧式铜版地图
    const ripples = g('coast-ripples');
    for (const [w, o] of [[11, 0.07], [6.5, 0.1], [3, 0.16]]) svg('path', { d: this.path(land) ?? '', 'stroke-width': w, opacity: o }, ripples);
    svg('path', { class: 'land', d: this.path(land) ?? '' }, g('land-g'));
    const statusG = g('status');
    for (const geom of countries.geometries) {
      const id = (geom.properties as CountryProps).id;
      const p = svg('path', { class: 'country', d: this.path(feature(t, geom as TopoPolygon | TopoMultiPolygon) as Feature) ?? '', 'data-id': id }, statusG);
      this.countries.set(id, p);
    }
    // 国界：不同国家之间；同一国家的拆分线另作「分界线」，状态不同时才显示
    const of = (gm: { properties?: { id: string; of?: string } }) => gm.properties?.of ?? gm.properties?.id;
    svg('path', { class: 'borders', d: this.path(mesh(t, countries, (a, b) => a !== b && of(a as never) !== of(b as never))) ?? '' }, g('borders-g'));
    const splitG = g('splits');
    const groups = new Map<string, string[]>();
    for (const gm of countries.geometries) { const p = gm.properties as CountryProps; if (p.of) groups.set(p.of, [...(groups.get(p.of) ?? []), p.id]); }
    for (const [name, parts] of groups) {
      const d = this.path(mesh(t, countries, (a, b) => a !== b && of(a as never) === name && of(b as never) === name)) ?? '';
      if (d) this.splits.set(name, { line: svg('path', { class: 'split-line', d }, splitG), parts });
    }
    svg('path', { class: 'coast', d: this.path(land) ?? '' }, g('coast-g'));
    const water = g('water');
    for (const f of feature(t, t.objects.rivers as GeometryCollection<{ rank: number }>).features) svg('path', { class: `river r${Math.min(6, f.properties?.rank ?? 6)}`, d: this.path(f) ?? '' }, water);
    for (const f of feature(t, t.objects.lakes as GeometryCollection).features) svg('path', { class: 'lake', d: this.path(f) ?? '' }, water);
  }

  private buildGraticule() {
    const g = svg('g', { class: 'graticule' }, this.world);
    svg('path', { d: this.path(geoGraticule().step([10, 5]).extent([[-40, 20], [80, 80]])()) ?? '' }, g);
  }

  private buildLabels() {
    const g = svg('g', { class: 'labels', 'aria-hidden': 'true' }, this.world);
    const k = this.width / 1000;
    for (const L of this.occ.labels) {
      const [x, y] = this.projection(L.at)!;
      const t = svg('text', { x: x.toFixed(1), y: y.toFixed(1), class: L.id === '@sea' ? 'lbl-sea' : 'lbl-country', 'font-size': ((L.size ?? 12) * Math.max(1, k * 0.9)).toFixed(1), 'data-id': L.id }, g);
      t.textContent = L.zh;
    }
  }

  /** 图框：双线外框 + 经纬度刻度（与战役地图的纸质风格一致） */
  private buildFrame() {
    const g = svg('g', { class: 'neatline', 'aria-hidden': 'true' }, this.el);
    const W = this.width, H = this.height, m = 6;
    svg('rect', { x: m, y: m, width: W - 2 * m, height: H - 2 * m, class: 'frame-in' }, g);
    svg('rect', { x: 1.5, y: 1.5, width: W - 3, height: H - 3, class: 'frame-out' }, g);
    // 经线与上下边框、纬线与左右边框的交点
    const cross = (pts: LonLat[], axis: 0 | 1, at: number) => {
      for (let i = 1; i < pts.length; i++) {
        const a = this.projection(pts[i - 1])!, b = this.projection(pts[i])!;
        if ((a[axis] - at) * (b[axis] - at) <= 0 && a[axis] !== b[axis]) {
          const f = (at - a[axis]) / (b[axis] - a[axis]);
          return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        }
      }
      return null;
    };
    const tick = (x: number, y: number, label: string, side: 'top' | 'bottom' | 'left' | 'right') => {
      const len = 6;
      const [dx, dy] = side === 'top' ? [0, len] : side === 'bottom' ? [0, -len] : side === 'left' ? [len, 0] : [-len, 0];
      svg('line', { x1: x, y1: y, x2: x + dx, y2: y + dy }, g);
      const tx = side === 'left' ? x + 9 : side === 'right' ? x - 9 : x;
      const ty = side === 'top' ? y + 15 : side === 'bottom' ? y - 9 : y + 3;
      const t = svg('text', { x: tx.toFixed(1), y: ty.toFixed(1), 'text-anchor': side === 'left' ? 'start' : side === 'right' ? 'end' : 'middle' }, g);
      t.textContent = label;
    };
    const lonLabel = (lon: number) => (lon === 0 ? '0°' : `${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`);
    for (let lon = -30; lon <= 70; lon += 10) {
      const merid: LonLat[] = Array.from({ length: 121 }, (_, i) => [lon, 15 + i * 0.6]);
      const top = cross(merid, 1, m), bot = cross(merid, 1, H - m);
      if (top && top[0] > 40 && top[0] < W - 40) tick(top[0], m, lonLabel(lon), 'top');
      if (bot && bot[0] > 40 && bot[0] < W - 40) tick(bot[0], H - m, lonLabel(lon), 'bottom');
    }
    for (let lat = 30; lat <= 75; lat += 5) {
      const par: LonLat[] = Array.from({ length: 241 }, (_, i) => [-60 + i * 0.6, lat]);
      const l = cross(par, 0, m), r = cross(par, 0, W - m);
      if (l && l[1] > 30 && l[1] < H - 30) tick(m, l[1], `${lat}°N`, 'left');
      if (r && r[1] > 30 && r[1] < H - 30) tick(W - m, r[1], `${lat}°N`, 'right');
    }
    // 比例尺（图幅中心纬度）
    const c = this.projection.invert!([W / 2, H / 2])!;
    const pxPerKm = 1 / (geoDistance(this.projection.invert!([W / 2 - 50, H / 2])!, this.projection.invert!([W / 2 + 50, H / 2])!) * 6371 / 100);
    const km = 500, len = km * pxPerKm;
    const sb = svg('g', { class: 'scalebar', transform: `translate(${W - m - 26 - len},${H - m - 22})` }, g);
    svg('rect', { width: (len / 2).toFixed(1), height: 4 }, sb);
    svg('rect', { x: (len / 2).toFixed(1), width: (len / 2).toFixed(1), height: 4, class: 'alt' }, sb);
    for (const [x, s] of [[0, '0'], [len / 2, '250'], [len, '500 公里']] as [number, string][]) { const t = svg('text', { x: x.toFixed(1), y: -4, 'text-anchor': 'middle' }, sb); t.textContent = s; }
    void c;
    // 指北针
    const cp = svg('g', { class: 'compass', transform: `translate(${W - m - 44},${m + 50})` }, g);
    cp.innerHTML = '<circle r="22"/><circle r="17" class="in"/><path d="M0-27 L5 0 L0 4 L-5 0Z" class="n"/><path d="M0 27 L5 0 L0-4 L-5 0Z" class="s"/><path d="M-27 0 L0-3.5 L4 0 L0 3.5Z M27 0 L0 3.5 L-4 0 L0-3.5Z" class="ew"/><text y="-30" text-anchor="middle">N</text>';
  }

  // ---------- 战区 / 红线 / 火漆印 ----------
  private theatreFeature(c: CatalogEntry): Feature | null {
    const th = c.hub.theatre;
    if (th?.countries?.length) {
      const set = new Set(th.countries);
      const geoms = (this.topo.objects.countries as GeometryCollection<CountryProps>).geometries.filter((gm) => set.has((gm.properties as CountryProps).id));
      if (!geoms.length) { console.warn(`[hub] ${c.id}: hub.theatre.countries 在底图中找不到`, th.countries); return null; }
      return { type: 'Feature', properties: {}, geometry: merge(this.topo, geoms as (TopoPolygon | TopoMultiPolygon)[]) as Geometry };
    }
    return th?.bbox ? bboxPolygon(th.bbox) : null;
  }

  private buildTheatres() {
    const g = svg('g', { class: 'theatres' }, this.world);
    // 大战区在下，嵌套的小战区（克里特）在上，便于悬停
    const list = [...this.entries].sort((a, b) => (a.hub.parent ? 1 : 0) - (b.hub.parent ? 1 : 0));
    for (const c of list) {
      const f = this.theatreFeature(c);
      if (!f) continue;
      const d = this.path(f) ?? '';
      const tg = svg('g', { class: `theatre ${c.status === 'planned' ? 'sealed' : ''} ${c.hub.theatre?.kind === 'air' ? 'air' : ''}`, 'data-id': c.id }, g);
      svg('path', { class: 'th-fill', d }, tg);
      const outline = svg('path', { class: 'th-line', d }, tg);
      tg.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') this.onHover(c); });
      tg.addEventListener('click', () => this.onActivate(c, this.lastPointer !== 'mouse'));
      this.theatres.set(c.id, { id: c.id, el: tg, outline, bounds: this.path.bounds(f) });
    }
  }

  private pinXY(c: CatalogEntry) { return this.projection(c.hub.pin as LonLat)!; }

  /** 红线：按开战日期把火漆印串起来，每段自然下垂 */
  private buildThread() {
    const g = svg('g', { class: 'thread', 'aria-hidden': 'true' }, this.world);
    let d = '';
    let dPlanned = '';
    for (let i = 1; i < this.order.length; i++) {
      const [x0, y0] = this.pinXY(this.order[i - 1]), [x1, y1] = this.pinXY(this.order[i]);
      // 两枚图钉之间的线自然下垂：控制点沿垂线偏向下方（近乎竖直的段偏向右侧）
      const dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy) || 1;
      let nx = -dy / dist, ny = dx / dist;
      if (ny < 0 || (Math.abs(ny) < 0.35 && nx < 0)) { nx = -nx; ny = -ny; }
      const cx = (x0 + x1) / 2 + nx * dist * 0.2, cy = (y0 + y1) / 2 + ny * dist * 0.2 + dist * 0.06;
      const seg = `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
      if (this.order[i].status === 'planned') dPlanned += seg; else d += seg;
    }
    svg('path', { class: 'thread-shadow', d, transform: 'translate(1.4,2.2)' }, g);
    svg('path', { class: 'thread-line', d }, g);
    if (dPlanned) svg('path', { class: 'thread-line planned', d: dPlanned }, g);
  }

  private buildPins() {
    const labels = svg('g', { class: 'stencils', 'aria-hidden': 'true' }, this.world);
    const g = svg('g', { class: 'pins' }, this.world);
    const roman = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'];
    this.order.forEach((c, i) => {
      const [x, y] = this.pinXY(c);
      const sealed = c.status === 'planned';
      // 代号模板字
      const off = 22;
      const [dx, dy, anchor] = ({ n: [0, -off - 4, 'middle'], s: [0, off + 12, 'middle'], e: [off, 5, 'start'], w: [-off, 5, 'end'] } as const)[c.hub.labelAt ?? 's'];
      const st = svg('text', { class: `stencil ${sealed ? 'sealed' : ''}`, x: (x + dx).toFixed(1), y: (y + dy).toFixed(1), 'text-anchor': anchor, 'data-id': c.id }, labels);
      st.textContent = c.hub.codenameOrig ?? c.hub.codename;
      // 火漆印（可聚焦按钮）
      const label = `${c.title.mark} ${c.title.zh}（${c.hub.codename}）${sealed ? '：绝密，筹备中' : c.playable ? '：查看卷宗，回车进入作战室' : '：迁移中'}`;
      const pin = svg('g', { class: `pin ${sealed ? 'sealed' : ''} ${c.playable ? '' : 'locked'}`, transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': label, 'data-id': c.id, style: `--i:${i}` }, g);
      svg('circle', { class: 'pin-pulse', r: 12 }, pin); // 时间带日期落在战役期间时扩散
      const body = svg('g', { class: 'pin-body', filter: 'url(#pin-shadow)' }, pin);
      // 不规则蜡滴边缘
      const blob = Array.from({ length: 18 }, (_, k) => { const a = (k / 18) * Math.PI * 2; const r = 12.6 + Math.sin(k * 2.7 + i) * 0.9 + (k % 3 === 0 ? 0.8 : 0); return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`; });
      svg('polygon', { class: 'wax-drip', points: blob.join(' ') }, body);
      svg('circle', { class: 'wax', r: 10.4 }, body);
      svg('circle', { class: 'wax-ring', r: 7.6 }, body);
      const t = svg('text', { class: 'wax-num', y: 3.6, 'text-anchor': 'middle' }, body);
      t.textContent = sealed ? '密' : roman[i] ?? String(i + 1);
      svg('circle', { class: 'pin-hit', r: 18 }, pin);
      pin.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') this.onHover(c); });
      // 只有键盘聚焦才展开卷宗；点按引起的聚焦交给 click 处理（触屏要先展开、再点一次进入）
      pin.addEventListener('focus', () => { if (performance.now() - this.pointerAt > 500) this.onFocus(c); });
      pin.addEventListener('click', () => this.onActivate(c, this.lastPointer !== 'mouse'));
      pin.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.onActivate(c, false); } });
      this.pins.set(c.id, pin);
    });
  }

  // ---------- 状态 ----------
  highlight(id: string | null) {
    for (const [k, t] of this.theatres) t.el.classList.toggle('on', k === id);
    for (const [k, p] of this.pins) p.classList.toggle('on', k === id);
    this.el.querySelectorAll<SVGTextElement>('.stencil').forEach((s) => s.classList.toggle('on', s.dataset.id === id));
    this.el.classList.toggle('has-focus', !!id);
  }

  /** 时间带日期变化：各国着色、分界线、正在进行的战区 */
  setDay(day: number, animate = true) {
    for (const [id, p] of this.countries) {
      const changes = this.occ.countries[id] ?? [];
      let s: Status = 'neutral';
      for (const ch of changes) if (dayOf(ch.from) <= day) s = ch.status;
      if (this.status.get(id) === s) continue;
      const first = !this.status.has(id);
      this.status.set(id, s);
      p.setAttribute('class', `country st-${s}`);
      if (animate && !first && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(p, { opacity: 0.25 }, { opacity: 1, duration: 0.5, ease: 'power1.out' });
    }
    for (const { line, parts } of this.splits.values()) line.classList.toggle('shown', new Set(parts.map((p) => this.status.get(p))).size > 1);
    for (const c of this.entries) {
      const on = dayOf(c.time.start) <= day && day <= dayOf(c.time.end);
      this.theatres.get(c.id)?.el.classList.toggle('active', on);
      this.pins.get(c.id)?.classList.toggle('active', on);
    }
  }
  statusOf(id: string) { return this.status.get(id) ?? 'neutral'; }

  /** 入场动画：红线描出、火漆印依次落下 */
  intro(reduced: boolean) {
    const lines = this.el.querySelectorAll<SVGPathElement>('.thread-line, .thread-shadow');
    if (reduced) return;
    lines.forEach((l) => { const len = l.getTotalLength(); gsap.fromTo(l, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.4, delay: 0.5, ease: 'power2.inOut', onComplete: () => { l.style.strokeDasharray = ''; } }); });
    gsap.from(this.el.querySelectorAll('.pin-body'), { scale: 2.2, opacity: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.22, delay: 0.3, transformOrigin: '50% 50%' });
    gsap.from(this.el.querySelectorAll('.stencil'), { opacity: 0, duration: 0.6, stagger: 0.22, delay: 0.7 });
  }

  /** 进入战役：镜头推进到战区并淡出 */
  zoomTo(id: string, ms: number): Promise<void> {
    // 战区外接框裁到图幅内（挪威含斯瓦尔巴，延伸到图框之外）；无效时以火漆印为中心
    const c = this.entries.find((e) => e.id === id);
    const b = this.theatres.get(id)?.bounds;
    const ok = b && b.flat().every(Number.isFinite);
    const [px, py] = c ? this.pinXY(c) : [this.width / 2, this.height / 2];
    const clampX = (v: number) => Math.max(0, Math.min(this.width, v)), clampY = (v: number) => Math.max(0, Math.min(this.height, v));
    const [x0, y0, x1, y1] = ok ? [clampX(b[0][0]), clampY(b[0][1]), clampX(b[1][0]), clampY(b[1][1])] : [px - 60, py - 45, px + 60, py + 45];
    const k = Math.min(6, 0.82 * Math.min(this.width / Math.max(1, x1 - x0), this.height / Math.max(1, y1 - y0)));
    const tx = this.width / 2 - k * (x0 + x1) / 2, ty = this.height / 2 - k * (y0 + y1) / 2;
    // 补间键名避开 x / y（GSAP 会把它们当作变换属性处理成带单位的字符串）
    const st = { scale: 1, panX: 0, panY: 0 };
    const apply = () => this.world.setAttribute('transform', `translate(${Number(st.panX).toFixed(2)},${Number(st.panY).toFixed(2)}) scale(${Number(st.scale).toFixed(4)})`);
    return new Promise((resolve) => {
      gsap.to(st, { scale: k, panX: tx, panY: ty, duration: ms / 1000, ease: 'power2.inOut', onUpdate: apply, onComplete: () => resolve() });
    });
  }
  resetZoom() { this.world.removeAttribute('transform'); }
}
