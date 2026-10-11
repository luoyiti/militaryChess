/** 静态矢量层（世界坐标，已预投影）与屏幕坐标标注（城市/国家/河流/森林，带避让）。 */
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry, LineString, MultiLineString, Polygon, MultiPolygon } from 'geojson';
import { geoPath } from 'd3-geo';
import { MapView, svgEl, type View } from './MapView';
import { KM, W, H, project } from '../geo/frame';
import type { DB } from '../data/db';
import type { Place } from '../schema';
import { escapeXml } from './symbols';
import { BIT } from '../geo/field/field';
import { GRID } from '../geo/field/client';

const path = geoPath(); // 恒等投影：坐标已是世界坐标

export type GroupName =
  | 'hex' | 'forest' | 'marsh' | 'fillPL' | 'fillDE' | 'fillSU' | 'lakes' | 'rivers' | 'coast' | 'borders'
  | 'airspace' | 'radar' | 'demarc' | 'trackSel' | 'routes' | 'fronts' | 'pocketsW';

const ORDER: GroupName[] = ['hex', 'forest', 'marsh', 'fillPL', 'fillDE', 'fillSU', 'lakes', 'rivers', 'coast', 'borders', 'airspace', 'radar', 'demarc', 'trackSel', 'routes', 'fronts', 'pocketsW'];

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
  private hexNumG: SVGGElement | null = null;
  private patterns: SVGPatternElement[] = [];

  constructor(private map: MapView, private topo: Topology, private db: DB) {
    for (const n of ORDER) this.groups[n] = svgEl('g', { class: `g-${n}` }, map.zoomG);
    this.labelsG = svgEl('g', { class: 'labels' }, map.screenSvg);
    this.buildDefs();
    this.buildGeography();
    this.buildLabels();
    this.buildAirspace();
    this.groups.radar.style.display="none";
  }

  private buildDefs() {
    const d = this.map.defs;
    const mk = (id: string, size: number, inner: string) => {
      const p = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size }, d);
      p.innerHTML = inner;
      this.patterns.push(p);
      return p;
    };
    mk('pat-de', 9, `<rect width="9" height="9" fill="rgba(58,88,135,0.13)"/><path d="M-2,2 L2,-2 M0,9 L9,0 M7,11 L11,7" stroke="rgba(38,64,110,0.55)" stroke-width="1.1"/>`);
    mk('pat-su', 10, `<rect width="10" height="10" fill="rgba(179,38,46,0.08)"/><path d="M0,10 L10,0 M-2,2 L2,-2 M8,12 L12,8 M0,0 L10,10 M-2,8 L2,12 M8,-2 L12,2" stroke="rgba(150,38,46,0.30)" stroke-width="0.9"/>`);
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
    for (const p of this.patterns) p.setAttribute('patternTransform', `scale(${1 / k})`);
  }

  private buildGeography() {
    const t = this.topo;
    const fc = (name: string) => feature(t, t.objects[name] as GeometryCollection).features as Feature<Geometry, Record<string, unknown>>[];
    // 森林、沼泽
    for (const f of fc('forest')) svgEl('path', { d: path(f) ?? '', class: 'forest' }, this.groups.forest);
    for (const f of fc('marsh')) svgEl('path', { d: path(f) ?? '', class: 'marsh' }, this.groups.marsh);
    // 湖泊
    for (const f of fc('lakes')) svgEl('path', { d: path(f) ?? '', class: 'lake' }, this.groups.lakes);
    // 河流（按等级）
    for (const f of fc('rivers')) {
      const rk = Number(f.properties.rank ?? 4);
      svgEl('path', { d: path(f) ?? '', class: `river rk${rk}` }, this.groups.rivers);
    }
    // 海岸线
    const coast = mesh(t, t.objects.land as GeometryCollection);
    svgEl('path', { d: path(coast) ?? '', class: 'coast' }, this.groups.coast);
    // 1939 国界
    const cobj = t.objects.countries1939 as GeometryCollection;
    const idOf = (g: { properties?: unknown }) => (g.properties as { id?: string } | undefined)?.id;
    const internal = mesh(t, cobj, (a, b) => a !== b && idOf(a) !== 'GB' && idOf(b) !== 'GB');
    svgEl('path', { d: path(internal) ?? '', class: 'border' }, this.groups.borders);
    const pl = mesh(t, cobj, (a, b) => a !== b && (idOf(a) === 'GB' || idOf(b) === 'GB'));
    svgEl('path', { d: path(pl) ?? '', class: 'border-pl-halo' }, this.groups.borders);
    svgEl('path', { d: path(pl) ?? '', class: 'border-pl' }, this.groups.borders);
  }

  private buildAirspace() {
    const polyD=(ps:number[][][][])=>ps.map((p)=>p.map((r)=>'M'+r.map((q)=>q.map((v)=>v.toFixed(1)).join(',')).join('L')+'Z').join('')).join('');
    for (const group of this.db.airspace.groups) {
      const polys=group.polygons.map((p)=>p.map((r)=>r.map(project)));
      const g=svgEl('g',{class:'raf-sector'},this.groups.airspace);
      svgEl('path',{d:polyD(polys),class:'sector-line'},g);
      const title=svgEl('title',{},g); title.textContent=group.label;
    }
    for (const radar of this.db.airspace.radar) {
      const [x,y]=project(radar.pos);
      svgEl('circle',{cx:x,cy:y,r:radar.rangeKm/KM,class:'radar-range'},this.groups.radar);
      const text=svgEl('title',{},this.groups.radar); text.textContent=radar.label+' · 示意探测范围';
    }
  }

  /** 六角格（仅陆地；需要场掩膜） */
  buildHex(masks: Uint8Array | null) {
    const g = this.groups.hex;
    g.innerHTML = '';
    const R = 18 / KM; // 18 km 六角格
    const hh = Math.sqrt(3) * R;
    let d = '';
    const nums: string[] = [];
    const land = (x: number, y: number) => {
      if (!masks) return true;
      const i = Math.floor(x / GRID.cell), j = Math.floor(y / GRID.cell);
      if (i < 0 || j < 0 || i >= GRID.w || j >= GRID.h) return false;
      return true; // 航空战区六角格也覆盖海峡与北海
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
    this.labels.push({ ...item, el });
  }

  private buildLabels() {
    // 国家/地区大字
    const countries: [string, number, number, number, number][] = [
      ['英 格 兰',-2.1,53.5,32,.4],['苏 格 兰',-4.0,57.0,24,.5],['威 尔 士',-3.9,52.2,18,.9],['爱 尔 兰',-7.3,53.0,23,.65],
      ['法 国',1.9,48.7,30,.5],['比 利 时',4.6,50.7,16,.8],['荷 兰',5.9,52.5,17,.8],['德 国',9.4,52.0,26,.5],['丹 麦',9.2,56.1,18,.8],['挪 威',7.0,59.2,24,.55],
    ];
    for (const [name, lon, lat, size, minRel] of countries) {
      const [wx, wy] = project([lon, lat]);
      this.addLabel({ wx, wy, w: 0, h: 0, minRel, prio: 0, kind: 'country', dx: 0, dy: 0, scaleWithZoom: true },
        `<text class="country" text-anchor="middle" data-size="${size}" font-size="${size}">${name}</text>`, 'l-country');
    }
    const waters: [string, number, number, number][] = [['英 吉 利 海 峡',-1.8,50.0,18],['北 海',3.8,55.0,26],['爱 尔 兰 海',-4.8,54.2,18],['大 西 洋',-8.7,56.2,22]];
    for (const [name, lon, lat, size] of waters) {
      const [wx, wy] = project([lon, lat]);
      this.addLabel({ wx, wy, w: 0, h: 0, minRel: name.includes('喀') ? 1.2 : 0, prio: 0, kind: 'water', dx: 0, dy: 0, scaleWithZoom: true },
        `<text class="${name.includes('喀') ? 'mountain' : 'water'}" text-anchor="middle" data-size="${size}" font-size="${size}">${name}</text>`, 'l-water');
    }
    // 城市
    const places = this.db.places.filter((p) => !['forest', 'river', 'region'].includes(p.kind));
    const minRelFor = (p: Place) => (p.rank === 1 ? 0 : p.rank === 2 ? 0.95 : p.rank === 3 ? 1.9 : 3.6);
    for (const p of places.sort((a, b) => a.rank - b.rank)) {
      const [wx, wy] = project(p.pos);
      const fs = p.rank === 1 ? 14 : p.rank === 2 ? 12.5 : p.rank === 3 ? 11.5 : 10.5;
      const w = p.zh.length * fs + 10, h = fs + 4;
      const marker = p.kind === 'airfield' ? `<path class="m-airfield" d="M-4,-2 L4,2 M-4,2 L4,-2" stroke="#554633" stroke-width="1.5"/><circle r="5" fill="none" stroke="#554633" stroke-width=".8"/>` : p.kind==='radar' ? `<path d="M0,-5 L-3,4 L3,4 Z M-4,-3 Q0,-8 4,-3" fill="none" stroke="#654743"/>` : p.kind === 'capital'
        ? `<path class="m-cap" d="M0,-5.5 L1.6,-1.7 L5.6,-1.6 L2.5,0.9 L3.5,5 L0,2.7 L-3.5,5 L-2.5,0.9 L-5.6,-1.6 L-1.6,-1.7Z"/>`
        : p.kind === 'fort' ? `<rect class="m-fort" x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)"/>`
          : p.rank <= 2 ? `<circle class="m-city" r="3.6"/><circle class="m-city-in" r="1.4"/>` : `<circle class="m-town" r="2.3"/>`;
      this.addLabel({ wx, wy, w, h, minRel: minRelFor(p), prio: p.rank, kind: 'city', dx: 6, dy: -h / 2 },
        `${marker}<text class="city r${p.rank}" x="6" y="4" font-size="${fs}">${p.zh}</text>`, `l-city r${p.rank}`);
    }
    // 河流名：同名河取最长折线中点
    const t = this.topo;
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
        // 只取画幅内河流
        const mid = l[Math.floor(l.length / 2)];
        if (mid[0] < 1200 || mid[0] > 7600 || mid[1] < 300 || mid[1] > 6400) continue;
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
    for (const f of feature(t, t.objects.forest as GeometryCollection).features as Feature<Polygon | MultiPolygon, Record<string, unknown>>[]) {
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
    const occupied: number[][] = [];
    const hit = (x: number, y: number, w: number, h: number) => {
      for (const o of occupied) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return true;
      return false;
    };
    const Wd = this.map.width, Hd = this.map.height;
    for (const L of this.labels) {
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
      L.el.style.display = '';
      if (L.scaleWithZoom) {
        const s = Math.max(0.75, Math.min(2.2, Math.pow(rel, 0.55)));
        L.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${s.toFixed(3)})`);
      } else L.el.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
    }
  }

  /** 供 3D/其他模块查询的城市屏幕坐标 */
  get labelItems() { return this.labels; }
}
