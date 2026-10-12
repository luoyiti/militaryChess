/**
 * 总台底图（Canvas）：海面刻线 → 海岸涟漪 → 陆地 → 各国阵营着色 → 国界 / 分界线 → 海岸线 → 河湖
 *                   → 经纬网 → 地名 → 图框刻度。
 * 几何在构造时一次性投影成世界坐标的 Path2D，每帧只换变换矩阵；线宽、虚线与纹样都按屏幕像素绘制，缩放时保持不变。
 */
import { geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature } from 'geojson';
import { projection, project, WORLD_W, WORLD_H, LON0, LAT_N, LAT_S, UNITS_PER_DEG } from './geo';
import { parseStatus, type Status, type WorldData, type BBox } from './types';

export interface View { k: number; x: number; y: number }
interface Shape { path: Path2D; bbox: BBox }
interface CountryProps { id: string; of?: string; sov?: string }

/** 旧版欧洲地图桌的比例（1° ≈ 18px）：地名参考字号按此设计 */
export const K_REF = 1.57;

const PAL = { sea: '#b8c7c0', land: '#ece2c6', ripple: '#2f5862', coast: '#45666b', border: '#6b5a40', split: '#8a1d22', river: '#6a8e98', grat: '#4f5f5e', ink: '#3b2f20', red: '#b3262e', wax: '#a3161d' };
const SERIF = '"WB Serif SC", "Noto Serif SC", "Songti SC", "STSong", serif';
const TYPE = '"WB Typewriter", "Special Elite", "Courier New", monospace';

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const overlaps = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

export class BaseMap {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  w = 0;
  h = 0;
  private readonly land: Path2D;
  private readonly borders: Path2D;
  private readonly lakes: Path2D;
  private readonly countries: (Shape & { id: string })[] = [];
  private readonly byId = new Map<string, Shape[]>();
  private readonly splits: { path: Path2D; parts: string[] }[] = [];
  private readonly rivers: (Shape & { rank: number })[] = [];
  private readonly labels: { wx: number; wy: number; zh: string; size: number; sea: boolean; id: string }[];
  private readonly status = new Map<string, Status>();
  private readonly fades = new Map<string, number>();
  private readonly patterns = new Map<string, CanvasPattern>();
  private readonly fills = new Map<string, string>();
  /** 高亮的国家（按交战国筛选时） */
  highlight = new Set<string>();
  /** 地名是否绘制（转场推进时淡出） */
  labelAlpha = 1;
  /** 每个国家的宗主国（底图 sov + world.json 补充） */
  readonly sovereign = new Map<string, string>();

  constructor(host: HTMLElement, topo: Topology, private world: WorldData) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'basemap';
    this.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;

    const shape = (obj: GeoPermissibleObjects): Shape => {
      const p = new Path2D();
      const adapter = { beginPath() {}, moveTo: (x: number, y: number) => p.moveTo(x, y), lineTo: (x: number, y: number) => p.lineTo(x, y), closePath: () => p.closePath(), arc: (x: number, y: number, r: number) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); } };
      geoPath(projection, adapter as unknown as CanvasRenderingContext2D)(obj);
      const b = geoPath(projection).bounds(obj);
      return { path: p, bbox: [b[0][0], b[0][1], b[1][0], b[1][1]] };
    };
    const countries = topo.objects.countries as GeometryCollection<CountryProps>;
    this.land = shape(feature(topo, topo.objects.land) as Feature).path;
    for (const g of countries.geometries) {
      const props = g.properties as CountryProps;
      const s = shape(feature(topo, g) as Feature);
      this.countries.push({ id: props.id, ...s });
      this.byId.set(props.id, [...(this.byId.get(props.id) ?? []), s]);
      const sov = world.sovereign[props.id] ?? props.sov;
      if (sov) this.sovereign.set(props.id, sov);
    }
    const of = (gm: { properties?: CountryProps }) => gm.properties?.of ?? gm.properties?.id;
    this.borders = shape(mesh(topo, countries, (a, b) => a !== b && of(a as never) !== of(b as never))).path;
    const groups = new Map<string, string[]>();
    for (const gm of countries.geometries) { const p = gm.properties as CountryProps; if (p.of) groups.set(p.of, [...(groups.get(p.of) ?? []), p.id]); }
    for (const [name, parts] of groups) this.splits.push({ path: shape(mesh(topo, countries, (a, b) => a !== b && of(a as never) === name && of(b as never) === name)).path, parts });
    for (const f of feature(topo, topo.objects.rivers as GeometryCollection<{ rank: number }>).features) this.rivers.push({ rank: f.properties?.rank ?? 6, ...shape(f) });
    this.lakes = shape(feature(topo, topo.objects.lakes as GeometryCollection) as GeoPermissibleObjects).path;
    this.labels = world.labels.map((L) => { const [wx, wy] = project(L.at); return { wx, wy, zh: L.zh, size: L.size ?? 12, sea: L.id === '@sea', id: L.id }; }).sort((a, b) => b.size - a.size);
  }

  countryIds() { return [...this.byId.keys()]; }
  /** 国家（可多个）的世界坐标外接框 */
  boundsOf(ids: string[]): BBox | null {
    const shapes = ids.flatMap((id) => this.byId.get(id) ?? []);
    if (!shapes.length) return null;
    return shapes.map((s) => s.bbox).reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(w * this.dpr));
    this.canvas.height = Math.max(1, Math.round(h * this.dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.patterns.clear();
  }

  /** 设定各国状态；animate 时新状态从淡到浓过渡 */
  setStatus(next: Map<string, Status>, animate: boolean) {
    const now = performance.now();
    for (const [id, s] of next) {
      const prev = this.status.get(id);
      if (prev === s) continue;
      this.status.set(id, s);
      if (animate && prev !== undefined) this.fades.set(id, now);
    }
  }
  statusOf(id: string): Status { return this.status.get(id) ?? 'neutral'; }

  // ---------- 纹样（设备像素，屏幕对齐） ----------
  private pattern(key: string, size: number, draw: (c: CanvasRenderingContext2D, s: number) => void): CanvasPattern {
    const k = `${key}@${this.dpr}`;
    let p = this.patterns.get(k);
    if (p) return p;
    const s = Math.round(size * this.dpr);
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d')!;
    draw(x, s);
    p = this.ctx.createPattern(c, 'repeat')!;
    this.patterns.set(k, p);
    return p;
  }
  /** 45° 斜线纹（可无缝平铺） */
  private hatch(x: CanvasRenderingContext2D, s: number, color: string, width: number, dir: 1 | -1 = 1, cross = false) {
    x.strokeStyle = color;
    x.lineWidth = width * this.dpr;
    x.lineCap = 'square';
    const line = (d: 1 | -1) => {
      x.beginPath();
      for (const o of [-s, 0, s]) {
        if (d === 1) { x.moveTo(o, s); x.lineTo(o + s, 0); } else { x.moveTo(o, 0); x.lineTo(o + s, s); }
      }
      x.stroke();
    };
    line(dir);
    if (cross) line(dir === 1 ? -1 : 1);
  }
  private styleFor(status: Status): string | CanvasPattern | null {
    const { kind, bloc } = parseStatus(status);
    if (kind === 'neutral') return null;
    if (kind === 'contested') return this.pattern('contested', 7, (x, s) => { x.fillStyle = 'rgba(179,38,46,.14)'; x.fillRect(0, 0, s, s); x.globalAlpha = 0.5; this.hatch(x, s, PAL.red, 1, 1, true); });
    const color = this.world.blocs[bloc!]?.color ?? '#777777';
    if (kind === 'member') {
      let f = this.fills.get(color);
      if (!f) { f = hexA(color, 0.42); this.fills.set(color, f); }
      return f;
    }
    if (kind === 'occupied') return this.pattern(`occ-${color}`, 6, (x, s) => { x.fillStyle = hexA(color, 0.2); x.fillRect(0, 0, s, s); x.globalAlpha = 0.62; this.hatch(x, s, color, 1.4); });
    return this.pattern(`ali-${color}`, 6, (x, s) => { x.fillStyle = hexA(color, 0.14); x.fillRect(0, 0, s, s); x.fillStyle = hexA(color, 0.72); x.beginPath(); x.arc(s / 2, s / 2, 1.05 * this.dpr, 0, Math.PI * 2); x.fill(); });
  }

  // ---------- 绘制 ----------
  /** 返回 true 表示仍有过渡动画，需要继续逐帧绘制 */
  render(v: View): boolean {
    const { ctx, dpr, w, h } = this;
    if (!w || !h) return false;
    const now = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAL.sea;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.pattern('sea', 4, (x, s) => { x.strokeStyle = 'rgba(111,138,140,.35)'; x.lineWidth = 0.35 * this.dpr; x.beginPath(); x.moveTo(0, s / 2); x.lineTo(s, s / 2); x.stroke(); });
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const k = v.k, px = 1 / k;
    ctx.setTransform(k * dpr, 0, 0, k * dpr, v.x * dpr, v.y * dpr);
    const inv = new DOMMatrix([1 / (k * dpr), 0, 0, 1 / (k * dpr), -v.x / k, -v.y / k]);
    const vis: BBox = [-v.x / k, -v.y / k, (w - v.x) / k, (h - v.y) / k];
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 海岸涟漪：陆地轮廓由粗到细叠三道淡色描边，模仿旧式铜版地图
    ctx.strokeStyle = PAL.ripple;
    for (const [wpx, a] of [[11, 0.07], [6.5, 0.1], [3, 0.16]]) { ctx.globalAlpha = a; ctx.lineWidth = wpx * px; ctx.stroke(this.land); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAL.land;
    ctx.fill(this.land);

    // 阵营着色
    let animating = false;
    for (const c of this.countries) {
      if (!overlaps(c.bbox, vis)) continue;
      const style = this.styleFor(this.status.get(c.id) ?? 'neutral');
      if (!style) continue;
      const t0 = this.fades.get(c.id);
      let a = 1;
      if (t0 !== undefined) {
        a = Math.min(1, 0.25 + 0.75 * ((now - t0) / 480));
        if (a >= 1) this.fades.delete(c.id); else animating = true;
      }
      if (typeof style !== 'string') style.setTransform(inv);
      ctx.globalAlpha = a;
      ctx.fillStyle = style;
      ctx.fill(c.path);
    }
    ctx.globalAlpha = 1;
    if (this.fades.size) animating = true;

    // 交战国筛选：高亮其领土
    if (this.highlight.size) {
      ctx.fillStyle = 'rgba(163,22,29,.08)';
      ctx.strokeStyle = PAL.wax;
      ctx.lineWidth = 1.6 * px;
      for (const c of this.countries) if (this.highlight.has(c.id) && overlaps(c.bbox, vis)) { ctx.fill(c.path); ctx.stroke(c.path); }
    }

    // 国界（点划线）与分界线（两侧状态不同时显示）
    ctx.setLineDash([3.2 * px, 1.4 * px, 0.8 * px, 1.4 * px]);
    ctx.strokeStyle = PAL.border;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 0.75 * px;
    ctx.stroke(this.borders);
    ctx.globalAlpha = 0.9;
    ctx.setLineDash([5 * px, 2 * px, 1.2 * px, 2 * px]);
    ctx.strokeStyle = PAL.split;
    ctx.lineWidth = 1.4 * px;
    for (const s of this.splits) if (new Set(s.parts.map((p) => this.statusOf(p))).size > 1) ctx.stroke(s.path);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // 海岸线、河流、湖泊
    ctx.strokeStyle = PAL.coast;
    ctx.lineWidth = 0.75 * px;
    ctx.stroke(this.land);
    const maxRank = k >= 3 ? 6 : k >= 2 ? 5 : k >= 1.25 ? 4 : k >= 0.8 ? 3 : 0;
    if (maxRank) {
      ctx.strokeStyle = PAL.river;
      for (const r of this.rivers) {
        if (r.rank > maxRank || !overlaps(r.bbox, vis)) continue;
        ctx.globalAlpha = r.rank >= 6 ? 0.55 : 0.75;
        ctx.lineWidth = (r.rank >= 6 ? 0.42 : r.rank <= 3 ? 0.75 : 0.6) * px;
        ctx.stroke(r.path);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = PAL.sea;
    ctx.fill(this.lakes);
    ctx.strokeStyle = PAL.coast;
    ctx.lineWidth = 0.45 * px;
    ctx.stroke(this.lakes);

    // 以下按屏幕像素绘制
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grat = this.graticule(v);
    this.drawLabels(v);
    this.drawFrame(v, grat);
    return animating;
  }

  /** 经纬网：米勒投影下经线竖直、纬线水平；间隔随缩放在 30°/15°/10°/5° 间切换 */
  private graticule(v: View) {
    const { ctx, w, h } = this;
    const pxPerDeg = v.k * UNITS_PER_DEG;
    const step = [5, 10, 15, 30].find((s) => s * pxPerDeg >= 75) ?? 30;
    const lons: { x: number; lon: number }[] = [];
    const lats: { y: number; lat: number }[] = [];
    for (let lon = Math.ceil((LON0 - 180) / step) * step; lon < LON0 + 180; lon += step) {
      const x = project([lon, 0])[0] * v.k + v.x;
      if (x > 0 && x < w) lons.push({ x, lon: ((lon + 540) % 360) - 180 });
    }
    for (let lat = Math.ceil(LAT_S / step) * step; lat <= LAT_N; lat += step) {
      const y = project([LON0, lat])[1] * v.k + v.y;
      if (y > 0 && y < h) lats.push({ y, lat });
    }
    ctx.save();
    ctx.strokeStyle = PAL.grat;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2.5]);
    ctx.beginPath();
    for (const { x } of lons) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (const { y, lat } of lats) { ctx.moveTo(0, y); ctx.lineTo(w, y); if (lat === 0) { ctx.moveTo(0, y + 1.5); ctx.lineTo(w, y + 1.5); } }
    ctx.stroke();
    ctx.restore();
    return { lons, lats };
  }

  /** 地名：字号随缩放平方根变化，小于 7.5px 不画；按字号从大到小放置，互相避让 */
  private drawLabels(v: View) {
    if (this.labelAlpha <= 0) return;
    const { ctx, w, h } = this;
    const zr = Math.sqrt(v.k / K_REF);
    const placed: BBox[] = [];
    const hasSpacing = 'letterSpacing' in ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const L of this.labels) {
      const fs = L.size * Math.max(0.5, Math.min(1.5, zr));
      if (fs < 7.5) continue;
      const sx = L.wx * v.k + v.x, sy = L.wy * v.k + v.y;
      const n = [...L.zh.replace(/ /g, '')].length;
      const sp = fs * (L.sea ? 0.35 : 0.28);
      const tw = L.zh.includes(' ') ? [...L.zh].length * fs * 0.5 + n * sp : n * (fs + sp);
      const box: BBox = [sx - tw / 2 - 3, sy - fs / 2 - 2, sx + tw / 2 + 3, sy + fs / 2 + 2];
      if (box[2] < 0 || box[0] > w || box[3] < 0 || box[1] > h) continue;
      if (placed.some((b) => overlaps(b, box))) continue;
      placed.push(box);
      ctx.font = `${fs.toFixed(1)}px ${SERIF}`;
      if (hasSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${sp.toFixed(1)}px`;
      const x = sx + (hasSpacing ? sp / 2 : 0);
      ctx.globalAlpha = (L.sea ? 0.68 : 0.78) * this.labelAlpha;
      if (!L.sea) { ctx.strokeStyle = 'rgba(236,226,198,.65)'; ctx.lineWidth = 2.4; ctx.strokeText(L.zh, x, sy); }
      ctx.fillStyle = L.sea ? '#3f616b' : '#574730';
      ctx.fillText(L.zh, x, sy);
    }
    ctx.restore();
  }

  /** 图框：双线外框 + 经纬度刻度（与战役地图的纸质风格一致） */
  private drawFrame(v: View, grat: { lons: { x: number; lon: number }[]; lats: { y: number; lat: number }[] }) {
    const { ctx, w, h } = this;
    const m = 7;
    ctx.save();
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    ctx.lineWidth = 0.6;
    ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    ctx.fillStyle = '#4a3c28';
    ctx.font = `9px ${TYPE}`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const lonLabel = (lon: number) => (lon === 0 ? '0°' : Math.abs(lon) === 180 ? '180°' : `${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`);
    const latLabel = (lat: number) => (lat === 0 ? '0°' : `${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}`);
    ctx.textAlign = 'center';
    for (const { x, lon } of grat.lons) {
      if (x < 40 || x > w - 40) continue;
      ctx.moveTo(x, m); ctx.lineTo(x, m + 6); ctx.moveTo(x, h - m); ctx.lineTo(x, h - m - 6);
      ctx.fillText(lonLabel(lon), x, m + 15);
      ctx.fillText(lonLabel(lon), x, h - m - 9);
    }
    for (const { y, lat } of grat.lats) {
      if (y < 30 || y > h - 30) continue;
      ctx.moveTo(m, y); ctx.lineTo(m + 6, y); ctx.moveTo(w - m, y); ctx.lineTo(w - m - 6, y);
      ctx.textAlign = 'left'; ctx.fillText(latLabel(lat), m + 9, y + 3);
      ctx.textAlign = 'right'; ctx.fillText(latLabel(lat), w - m - 9, y + 3);
    }
    ctx.stroke();
    ctx.restore();
    void v;
  }

  /**
   * 当前画面的快照（JPEG data URL），转场时交给战役页面作为开场的第一帧。
   * extra 在世界坐标下追加绘制（如目标战区的红线）。
   */
  snapshot(v: View, extra?: (ctx: CanvasRenderingContext2D, px: number) => void, maxW = 1600): string {
    const scale = Math.min(1, maxW / this.w);
    const c = document.createElement('canvas');
    c.width = Math.round(this.w * scale);
    c.height = Math.round(this.h * scale);
    const x = c.getContext('2d')!;
    x.drawImage(this.canvas, 0, 0, c.width, c.height);
    if (extra) { x.setTransform(scale * v.k, 0, 0, scale * v.k, scale * v.x, scale * v.y); extra(x, 1 / v.k); }
    return c.toDataURL('image/jpeg', 0.8);
  }
}

export { WORLD_W, WORLD_H };
