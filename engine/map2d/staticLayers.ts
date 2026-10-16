/** 静态矢量层（世界坐标，已预投影）与屏幕坐标标注（城市/国家/河流/森林，带避让）。 */
import { SpatialIndex, type Bounds } from '../geo/spatial';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry, LineString, MultiLineString, Polygon, MultiPolygon } from 'geojson';
import { geoPath } from 'd3-geo';
import { MapView, svgEl, type View } from './MapView';
import { KM, W, H, project } from '../geo/frame';
import type { DB } from '../data/db';
import type { Place } from '../core/types';
import { GRID } from '../geo/frame';
import { manifest } from '../campaign/context';
import { slotStyle } from '../campaign/theme';

const path = geoPath(); // 恒等投影：坐标已是世界坐标

export type GroupName =
  | 'hex' | 'forest' | 'marsh' | 'fillRest' | 'fillA' | 'fillB' | 'isobaths' | 'lakes' | 'rivers' | 'coast' | 'borders' | 'overlays'
  | 'demarc' | 'trackSel' | 'routes' | 'fronts' | 'pocketsW';

const ORDER: GroupName[] = ['hex', 'forest', 'marsh', 'fillRest', 'fillA', 'fillB', 'isobaths', 'lakes', 'rivers', 'coast', 'borders', 'overlays', 'demarc', 'trackSel', 'routes', 'fronts', 'pocketsW'];

interface LabelItem {
  el: SVGGElement;
  wx: number; wy: number;
  w: number; h: number; // 近似像素尺寸
  minRel: number;
  prio: number;
  kind: 'country' | 'water' | 'city' | 'river' | 'forest';
  dx: number; dy: number; // 相对锚点的文本框偏移
  scaleWithZoom?: boolean;
}

export class StaticLayers {
  groups = {} as Record<GroupName, SVGGElement>;
  labelsG: SVGGElement;
  private labels: LabelItem[] = [];
  /** 等深线分组（海战战役，topo 含 isobaths 时才有）：水深 → 显示它所需的最小相对缩放 */
  private isoGroups: { minRel: number; g: SVGGElement }[] = [];
  private isoSolid = false;
  private isoParts: { bounds: Bounds; el: SVGPathElement; offset: number; minRel: number }[] = [];
  private isoIndex?: SpatialIndex<(typeof this.isoParts)[number]>;
  private shownIso = new Set<(typeof this.isoParts)[number]>();
  private labelIndex?: SpatialIndex<LabelItem>;
  private shownLabels = new Set<LabelItem>();
  private patternK = NaN;
  private hexNumG: SVGGElement | null = null;
  private patterns: SVGPatternElement[] = [];

  constructor(private map: MapView, private topo: Topology, private db: DB, private contextTopo?: Topology) {
    for (const n of ORDER) this.groups[n] = svgEl('g', { class: `g-${n}` }, map.zoomG);
    this.labelsG = svgEl('g', { class: 'labels' }, map.screenSvg);
    this.buildDefs();
    this.buildGeography();
    this.buildOverlays();
    this.buildLabels();
    this.labelIndex = new SpatialIndex(this.labels.map(value => ({ value, bounds: [value.wx,value.wy,value.wx,value.wy] })));
    this.isoIndex = new SpatialIndex(this.isoParts.map(value => ({ value, bounds: value.bounds })));
  }

  /** 叠加层（data/overlays.json）：空域分区多边形、雷达探测圈、防线；按图层键分组以便开关 */
  readonly overlayGroups = new Map<string, SVGGElement>();
  private buildOverlays() {
    const polyD = (ps: number[][][][]) => ps.map((p) => p.map((r) => 'M' + r.map((q) => q.map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('')).join('');
    for (const o of this.db.overlays) {
      let layer = this.overlayGroups.get(o.layer);
      if (!layer) { layer = svgEl('g', { class: `ov-layer ov-${o.layer}` }, this.groups.overlays); this.overlayGroups.set(o.layer, layer); }
      if (o.kind === 'polygon' && o.polygons) {
        const g = svgEl('g', { class: `ov ov-${o.style ?? 'polygon'} raf-sector` }, layer);
        svgEl('path', { d: polyD(o.polygons.map((p) => p.map((r) => r.map((ll) => project(ll))))), class: 'sector-line' }, g);
        if (o.label) svgEl('title', {}, g).textContent = o.label;
      } else if (o.kind === 'range' && o.pos && o.rangeKm) {
        const [x, y] = project(o.pos);
        svgEl('circle', { cx: x, cy: y, r: o.rangeKm / KM, class: `radar-range ov-${o.style ?? 'range'}` }, layer);
        if (o.label) svgEl('title', {}, layer).textContent = o.label + ' · 示意探测范围';
      } else if (o.kind === 'line' && o.line) {
        svgEl('path', { d: 'M' + o.line.map((ll) => project(ll).map((v) => v.toFixed(1)).join(',')).join('L'), class: `sector-line ov-${o.style ?? 'line'}` }, layer);
      }
    }
  }
  setOverlayVisible(layer: string, v: boolean) {
    const g = this.overlayGroups.get(layer);
    if (g) g.style.display = v ? '' : 'none';
  }

  private buildDefs() {
    const d = this.map.defs;
    const mk = (id: string, size: number, inner: string) => {
      const p = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size }, d);
      p.innerHTML = inner;
      this.patterns.push(p);
      return p;
    };
    const m = manifest();
    for (const i of [0, 1] as const) { const p = slotStyle(m, i).pattern; mk(i ? 'pat-b' : 'pat-a', p.size, p.svg); }
    mk('pat-pencil', 6, `<path d="M-1,1 L1,-1 M0,6 L6,0 M5,7 L7,5" stroke="rgba(255,252,240,0.30)" stroke-width="1.1"/>`);
    mk('pat-forest', 14, `<g fill="rgba(70,90,45,0.32)"><circle cx="3.5" cy="4" r="1.4"/><circle cx="10.5" cy="10.5" r="1.4"/><path d="M3.5,5.4 v1.6 M10.5,11.9 v1.6" stroke="rgba(70,90,45,0.4)" stroke-width="0.7"/></g>`);
    mk('pat-marsh', 12, `<g stroke="rgba(70,105,120,0.5)" stroke-width="0.8"><path d="M1,3 h4 M7,3 h3 M2,8 h3 M6.5,8 h4.5"/><path d="M3,2.2 v-1.4 M8.5,2.2 v-1.6 M4,7.2 v-1.4 M9,7.2 v-1.5" stroke-width="0.6"/></g>`);
    // 铅笔粗糙滤镜（箭头、战线用；缩放中关闭）
    const f = svgEl('filter', { id: 'pencil', x: '-5%', y: '-5%', width: '110%', height: '110%' }, d);
    f.innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>`;
    const glow = svgEl('filter', { id: 'glow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, d);
    glow.innerHTML = `<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>`;
  }

  /** 让纹样在屏幕上保持恒定密度 */
  updatePatterns(k: number) {
    if (k === this.patternK) return;
    this.patternK = k;
    for (const p of this.patterns) p.setAttribute('patternTransform', `scale(${1 / k})`);
  }

  private buildGeography() {
    const t = this.topo;
    const fc = (name: string) => feature(t, t.objects[name] as GeometryCollection).features as Feature<Geometry, Record<string, unknown>>[];
    const physical = this.contextTopo ?? t;
    const physicalFC = (name: string) => feature(physical, physical.objects[name] as GeometryCollection).features as Feature<Geometry, Record<string, unknown>>[];
    // 森林、沼泽
    for (const f of fc('forest')) svgEl('path', { d: path(f) ?? '', class: 'forest' }, this.groups.forest);
    for (const f of fc('marsh')) svgEl('path', { d: path(f) ?? '', class: 'marsh' }, this.groups.marsh);
    // 湖泊
    for (const f of physicalFC('lakes')) svgEl('path', { d: path(f) ?? '', class: 'lake' }, this.groups.lakes);
    // 河流（按等级）
    for (const f of physicalFC('rivers')) {
      const rk = Number(f.properties.rank ?? 4);
      svgEl('path', { d: path(f) ?? '', class: `river rk${rk}` }, this.groups.rivers);
    }
    // 等深线（可选对象 isobaths：LineString，depth 为水深米数）：浅处点线、深处虚线，越浅的线越晚出现
    if (physical.objects.isobaths) {
      const iso = feature(physical, physical.objects.isobaths as GeometryCollection).features as Feature<LineString | MultiLineString, Record<string, unknown>>[];
      const byDepth = new Map<number, number[][][]>();
      for (const f of iso) {
        const dep = Number(f.properties?.depth);
        if (!isFinite(dep)) continue;
        (byDepth.get(dep) ?? byDepth.set(dep, []).get(dep)!).push(...(f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates));
      }
      for (const dep of [...byDepth.keys()].sort((a, b) => b - a)) {
        const deep = dep >= 200;
        const minRel = dep >= 1000 ? 0 : dep >= 200 ? 0.6 : dep >= 50 ? 1.6 : dep >= 20 ? 3.2 : dep >= 10 ? 6 : 10;
        const g = svgEl('g', { class: `isobath iso-d${dep}`, fill: 'none', stroke: '#5b8795', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          'stroke-width': deep ? 0.8 : 1, 'stroke-dasharray': deep ? '6 3.5' : '0.1 3.6', opacity: deep ? 0.5 : 0.62 }, this.groups.isobaths);
        for (const line of byDepth.get(dep)!) {
          let offset = 0;
          for (let start=0;start<line.length-1;start+=128) {
            const pts=line.slice(start,start+129);
            const el=svgEl('path', { d: 'M'+pts.map(p=>`${p[0]},${p[1]}`).join('L') },g);
            el.style.display = 'none';
            this.isoParts.push({el,offset,minRel,bounds:[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))]});
            for(let i=1;i<pts.length;i++)offset+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
          }
        }
        g.dataset.dash = deep ? '6 3.5' : '0.1 3.6';
        this.isoGroups.push({ minRel, g });
      }
    }
    // 海岸线
    const coast = mesh(physical, physical.objects.land as GeometryCollection);
    svgEl('path', { d: path(coast) ?? '', class: 'coast' }, this.groups.coast);
    // 战区国界加粗（manifest.map.theatreCountries）；对象名沿用引擎的 countries1939
    const cobj = t.objects.countries1939 as GeometryCollection;
    const idOf = (g: { properties?: unknown }) => (g.properties as { id?: string } | undefined)?.id;
    const theatreIds = new Set(manifest().map.theatreCountries);
    const theater = (id?: string) => !!id && theatreIds.has(id);
    const internal = mesh(t, cobj, (a, b) => a !== b && !theater(idOf(a)) && !theater(idOf(b)));
    svgEl('path', { d: path(internal) ?? '', class: 'border' }, this.groups.borders);
    const pl = mesh(t, cobj, (a, b) => a !== b && (theater(idOf(a)) || theater(idOf(b))));
    svgEl('path', { d: path(pl) ?? '', class: 'border-pl-halo' }, this.groups.borders);
    svgEl('path', { d: path(pl) ?? '', class: 'border-pl' }, this.groups.borders);
  }

  /** 六角格（仅陆地；需要场掩膜） */
  buildHex(masks: Uint8Array | null) {
    const g = this.groups.hex;
    g.innerHTML = '';
    const mm = manifest();
    if (mm.map.hexKm === 0) return; // 0 = 不画六角格（海战：大洋战区的陆地六角格只会拖慢绘制）
    const R = (mm.map.hexKm ?? 18) / KM;
    const LAND = 1 << mm.control.landBit;
    const overSea = !!mm.map.hexOverSea;
    const hh = Math.sqrt(3) * R;
    let d = '';
    const nums: string[] = [];
    const land = (x: number, y: number) => {
      if (!masks || overSea) return true;
      const i = Math.floor(x / GRID.cell), j = Math.floor(y / GRID.cell);
      if (i < 0 || j < 0 || i >= GRID.w || j >= GRID.h) return false;
      return (masks[j * GRID.w + i] & LAND) !== 0;
    };
    const cols = Math.ceil(W / (1.5 * R)) + 1, rows = Math.ceil(H / hh) + 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cx = c * 1.5 * R, cy = r * hh + (c % 2 ? hh / 2 : 0);
        if (!land(cx, cy)) continue;
        d += `M${(cx + R).toFixed(1)},${cy.toFixed(1)}`;
        for (let k = 1; k < 6; k++) d += `L${(cx + R * Math.cos((k * Math.PI) / 3)).toFixed(1)},${(cy + R * Math.sin((k * Math.PI) / 3)).toFixed(1)}`;
        d += 'Z';
        nums.push(`<text x="${cx.toFixed(0)}" y="${(cy - hh * 0.3).toFixed(0)}">${String(c).padStart(2, '0')}${String(r).padStart(2, '0')}</text>`);
      }
    }
    svgEl('path', { d, class: 'hex' }, g);
    this.hexNumG = svgEl('g', { class: 'hexnum' }, g);
    this.hexNumG.innerHTML = nums.join('');
  }

  private addLabel(item: Omit<LabelItem, 'el'>, html: string, cls: string) {
    const el = svgEl('g', { class: `lbl ${cls}` }, this.labelsG);
    el.innerHTML = html;
    el.style.display = 'none';
    this.labels.push({ ...item, el });
  }

  private buildLabels() {
    const mm = manifest().map;
    // 国家/地区大字
    for (const [name, lon, lat, size, minRel] of mm.labels?.countries ?? []) {
      const [wx, wy] = project([lon, lat]);
      this.addLabel({ wx, wy, w: 0, h: 0, minRel, prio: 0, kind: 'country', dx: 0, dy: 0, scaleWithZoom: true },
        `<text class="country" text-anchor="middle" data-size="${size}" font-size="${size}">${name}</text>`, 'l-country');
    }
    // 海域 / 山脉
    for (const [name, lon, lat, size, mountain, minRel] of mm.labels?.waters ?? []) {
      const [wx, wy] = project([lon, lat]);
      this.addLabel({ wx, wy, w: 0, h: 0, minRel: minRel ?? (mountain ? 1.6 : 0), prio: 0, kind: 'water', dx: 0, dy: 0, scaleWithZoom: true },
        `<text class="${mountain ? 'mountain' : 'water'}" text-anchor="middle" data-size="${size}" font-size="${size}">${name}</text>`, 'l-water');
    }
    // 城市
    const places = this.db.places.filter((p) => !['forest', 'river', 'region'].includes(p.kind));
    // 战略要点标注偏移到空白处，并用引线指回准确位置（manifest.map.labelHubs）
    const hubs: Record<string, [number, number]> = mm.labelHubs ?? {};
    const placeMarkers = !!mm.portMarkers; // 港口用锚形标记（挪威）
    const minRelFor = (p: Place) => (p.rank === 1 ? 0 : p.rank === 2 ? 0.95 : p.rank === 3 ? 1.9 : 3.6);
    for (const p of places.sort((a, b) => (hubs[a.id] ? 0 : a.rank) - (hubs[b.id] ? 0 : b.rank))) {
      const [wx, wy] = project(p.pos);
      const hub = hubs[p.id];
      const fs = hub ? 13.5 : p.rank === 1 ? 14 : p.rank === 2 ? 12.5 : p.rank === 3 ? 11.5 : 10.5;
      const w = p.zh.length * fs + 10, h = fs + 4;
      const marker = p.kind === 'airfield' ? `<path d="M0,-5 V5 M-5,0 H5 M-3,4 H3" stroke="#5b4a82" stroke-width="1.6"/><circle r="7" fill="none" stroke="#5b4a82" stroke-width=".7"/>`
        : p.kind === 'sea' ? `<path d="M-4,0 Q-2,-3 0,0 T4,0" fill="none" stroke="#2a6474" stroke-width="1.4"/>`
        : p.kind === 'port' && placeMarkers ? `<path d="M0,-4 V4 M-4,1 Q0,7 4,1 M-2,-2 H2" fill="none" stroke="#2a6474" stroke-width="1.5"/>`
        : p.kind === 'radar' ? `<path d="M0,3 V-2 M-4,-5 Q0,-1 4,-5" fill="none" stroke="#5b4a82" stroke-width="1.4"/><circle r="1.6" fill="#5b4a82"/>`
        : p.kind === 'capital'
        ? `<path class="m-cap" d="M0,-5.5 L1.6,-1.7 L5.6,-1.6 L2.5,0.9 L3.5,5 L0,2.7 L-3.5,5 L-2.5,0.9 L-5.6,-1.6 L-1.6,-1.7Z"/>`
        : p.kind === 'fort' ? `<rect class="m-fort" x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)"/>`
          : p.rank <= 2 ? `<circle class="m-city" r="3.6"/><circle class="m-city-in" r="1.4"/>` : `<circle class="m-town" r="2.3"/>`;
      const [dx, baseline] = hub ?? [6, 4];
      const leader = hub ? `<path d="M0,0 L${dx},${baseline - 5}" fill="none" stroke="#73664d" stroke-width="0.8" opacity="0.72"/>` : '';
      this.addLabel({ wx, wy, w, h, minRel: hub ? 0 : minRelFor(p), prio: hub ? 1 : p.rank, kind: 'city', dx, dy: baseline - fs },
        `${leader}${marker}<text class="city r${hub ? 1 : p.rank}" x="${dx}" y="${baseline}" font-size="${fs}">${p.zh}</text>`, `l-city r${hub ? 1 : p.rank}`);
    }
    // 等深线水深注记：沿线按三级间距布点（越放大越密，屏幕上的间距大致恒定），越浅的线越晚出现
    const isoObj = (this.contextTopo ?? this.topo).objects.isobaths as GeometryCollection | undefined;
    if (isoObj) {
      const pt = this.contextTopo ?? this.topo;
      const base: Record<number, number> = { 5000: 2.4, 3000: 2, 1000: 1.6, 200: 1.4, 50: 4, 20: 6, 10: 9, 5: 12 }; // 第一级的 minRel
      const tiers: [number, number][] = [[900, 1], [320, 2.2], [120, 4.5]]; // [沿线间距（世界单位）, minRel 倍数]
      const lines = new Map<number, { len: number; pts: number[][] }[]>();
      for (const f of feature(pt, isoObj).features as Feature<LineString | MultiLineString, Record<string, unknown>>[]) {
        const dep = Number(f.properties?.depth);
        if (!base[dep]) continue;
        const parts = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
        for (const l of parts) {
          let len = 0;
          for (let i = 1; i < l.length; i++) len += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
          if (len >= 60) (lines.get(dep) ?? lines.set(dep, []).get(dep)!).push({ len, pts: l as number[][] });
        }
      }
      let total = 0;
      for (const [dep, ls] of lines) {
        ls.sort((a, b) => b.len - a.len);
        const placed: number[][] = [];
        let count = 0;
        tiers.forEach(([gap, mult], ti) => {
          for (const { len, pts } of ls) {
            if (ti === 0 && len < 90) continue;
            let acc = gap / 2;
            for (let i = 1; i < pts.length && count < 320 && total < 2600; i++) {
              const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
              acc += seg;
              if (acc < gap) continue;
              acc = 0;
              const [x, y] = pts[i];
              if (placed.some((q) => Math.hypot(q[0] - x, q[1] - y) < gap * 0.6)) continue; // 同深度的注记彼此留出间距，下一级不压在上一级上
              placed.push([x, y]);
              const a = pts[Math.max(0, i - 3)], c = pts[Math.min(pts.length - 1, i + 3)];
              let ang = (Math.atan2(c[1] - a[1], c[0] - a[0]) * 180) / Math.PI;
              if (ang > 90) ang -= 180;
              if (ang < -90) ang += 180;
              count++; total++;
              this.addLabel({ wx: x, wy: y, w: 0, h: 0, minRel: base[dep] * mult, prio: 0, kind: 'water', dx: 0, dy: 0 },
                `<text transform="rotate(${ang.toFixed(1)})" text-anchor="middle" dy="3" font-size="9.5" font-style="italic" fill="#4a7380" stroke="#e9eadb" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" opacity="0.9">${dep} m</text>`, 'l-depth');
            }
          }
        });
      }
    }
    // 河流名：同名河取最长折线中点
    const t = this.contextTopo ?? this.topo;
    const rivers = feature(t, t.objects.rivers as GeometryCollection).features as Feature<LineString | MultiLineString, Record<string, unknown>>[];
    const best = new Map<string, { len: number; line: number[][]; rank: number }>();
    for (const f of rivers) {
      const zh = String(f.properties.zh || '');
      const rank = Number(f.properties.rank ?? 4);
      if (!zh || rank > 3) continue;
      const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const l of lines) {
        let len = 0;
        for (let i = 1; i < l.length; i++) len += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
        const mid = l[Math.floor(l.length / 2)];
        const [cx0, cy0, cx1, cy1] = mm.riverLabelCrop ?? [W * 0.02, H * 0.02, W * 0.98, H * 0.98];
        if (mid[0] < cx0 || mid[0] > cx1 || mid[1] < cy0 || mid[1] > cy1) continue;
        const cur = best.get(zh);
        if (!cur || len > cur.len) best.set(zh, { len, line: l as number[][], rank });
      }
    }
    for (const [zh, b] of best) {
      if (b.len < 300) continue;
      const l = b.line;
      const i = Math.floor(l.length * 0.45);
      const a = l[Math.max(0, i - 2)], c = l[Math.min(l.length - 1, i + 2)];
      let ang = (Math.atan2(c[1] - a[1], c[0] - a[0]) * 180) / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      const fs = b.rank <= 1 ? 12 : 11;
      this.addLabel({ wx: l[i][0], wy: l[i][1], w: zh.length * fs * 0.9, h: fs + 2, minRel: b.rank <= 1 ? 0.9 : b.rank === 2 ? 1.6 : 2.6, prio: 5 + b.rank, kind: 'river', dx: -zh.length * fs * 0.45, dy: -fs },
        `<text class="river-l" text-anchor="middle" transform="rotate(${ang.toFixed(1)})" y="-3" font-size="${fs}">${zh}</text>`, 'l-river');
    }
    // 森林名
    for (const f of feature(this.topo, this.topo.objects.forest as GeometryCollection).features as Feature<Polygon | MultiPolygon, Record<string, unknown>>[]) {
      const zh = String(f.properties.zh || '');
      if (!zh) continue;
      const c = path.centroid(f);
      if (!isFinite(c[0])) continue;
      this.addLabel({ wx: c[0], wy: c[1], w: zh.length * 10, h: 12, minRel: 2.2, prio: 9, kind: 'forest', dx: -zh.length * 5, dy: -6 },
        `<text class="forest-l" text-anchor="middle" font-size="10">${zh}</text>`, 'l-forest');
    }
  }

  private visible = { cities: true, rivers: true, forest: true };
  setVisible(k: 'cities' | 'rivers' | 'forest', v: boolean) {
    this.visible[k] = v;
    if (k === 'rivers') { this.groups.rivers.style.display = v ? '' : 'none'; this.groups.lakes.style.display = v ? '' : 'none'; }
    if (k === 'forest') { this.groups.forest.style.display = v ? '' : 'none'; this.groups.marsh.style.display = v ? '' : 'none'; }
    this.update(this.map.view);
  }

  /** 视图变化：标注定位 + 避让 */
  update(v: View) {
    const rel = this.map.relK;
    this.updatePatterns(v.k);
    const root = this.map.root;
    root.classList.toggle('lod-far', rel < 1.8);
    root.classList.toggle('lod-mid', rel >= 1.8 && rel < 4);
    root.classList.toggle('lod-near', rel >= 4);
    if (this.hexNumG) this.hexNumG.style.display = rel >= 5.5 ? '' : 'none';
    for (const { minRel, g } of this.isoGroups) g.style.display = rel >= minRel ? '' : 'none';
    // 非缩放线宽下虚线段数随缩放线性增长，整条等深线一次展开会卡住绘制：放大后改为实线
    const isoSolid = rel >= 8;
    if (isoSolid !== this.isoSolid) {
      this.isoSolid = isoSolid;
      for (const { g } of this.isoGroups) g.setAttribute('stroke-dasharray', isoSolid ? 'none' : g.dataset.dash ?? 'none');
    }
    const bounds: Bounds = [(-200-v.x)/v.k,(-60-v.y)/v.k,(this.map.width+200-v.x)/v.k,(this.map.height+60-v.y)/v.k];
    const nextIso = new Set(this.isoIndex?.query(bounds).filter(p=>rel>=p.minRel) ?? []);
    for(const p of this.shownIso) if(!nextIso.has(p)) p.el.style.display='none';
    for(const p of nextIso) {
      if(!this.shownIso.has(p)) p.el.style.display='';
      if(!isoSolid) p.el.setAttribute('stroke-dashoffset',String(-p.offset*v.k));
    }
    this.shownIso=nextIso;
    const occupied: number[][] = [];
    const hit = (x: number, y: number, w: number, h: number) => {
      for (const o of occupied) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return true;
      return false;
    };
    const Wd = this.map.width, Hd = this.map.height;
    const candidates = this.labelIndex?.query(bounds) ?? this.labels;
    const nextLabels = new Set<LabelItem>();
    for (const L of candidates) {
      const sx = v.x + L.wx * v.k, sy = v.y + L.wy * v.k;
      let show = rel >= L.minRel && sx > -200 && sx < Wd + 200 && sy > -60 && sy < Hd + 60;
      if (L.kind === 'city' && !this.visible.cities) show = false;
      if (L.kind === 'river' && !this.visible.rivers) show = false;
      if (L.kind === 'forest' && !this.visible.forest) show = false;
      if (show && (L.kind === 'city' || L.kind === 'river' || L.kind === 'forest')) {
        const bx = sx + L.dx - 4, by = sy + L.dy;
        if (hit(bx, by, L.w, L.h) && !(L.kind === 'city' && L.prio === 1)) show = false;
        else occupied.push([bx, by, L.w, L.h]);
      }
      if (!show) { if (L.el.style.display !== 'none') L.el.style.display = 'none'; continue; }
      nextLabels.add(L);
      if (!this.shownLabels.has(L)) L.el.style.display = '';
      if (L.scaleWithZoom) {
        const s = Math.max(0.75, Math.min(2.2, Math.pow(rel, 0.55)));
        L.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${s.toFixed(3)})`);
      } else L.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
    }
    for (const L of this.shownLabels) if (!nextLabels.has(L)) L.el.style.display = 'none';
    this.shownLabels = nextLabels;
  }

  /** 供 3D/其他模块查询的城市屏幕坐标 */
  get labelItems() { return this.labels; }
}
