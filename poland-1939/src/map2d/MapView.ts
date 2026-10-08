/**
 * 2D 主地图：视口缩放、瓦片底图（Canvas）、世界坐标矢量层（SVG，整体变换）、屏幕坐标层（棋子/标注/特效）。
 * 世界坐标 → 屏幕：sx = x + k * wx。
 */
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { interpolateZoom } from 'd3-interpolate';
import { W, H, project } from '../geo/frame';
import type { LonLat } from '../schema';

export interface View { k: number; x: number; y: number }
interface TileLevel { z: number; width: number; height: number; cols: number; rows: number; scale: number }

const SVGNS = 'http://www.w3.org/2000/svg';
export const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
};

export class MapView {
  readonly root: HTMLElement;
  readonly base: HTMLCanvasElement;
  readonly worldSvg: SVGSVGElement;
  readonly zoomG: SVGGElement;
  readonly defs: SVGDefsElement;
  readonly screenSvg: SVGSVGElement;
  readonly fx: HTMLCanvasElement;
  view: View = { k: 0.1, x: 0, y: 0 };
  fitK = 0.1; // 波兰全境适配时的 k（relK = k / fitK）
  width = 0;
  height = 0;
  dpr = 1;
  terrainOpacity = 1;
  private zb: ZoomBehavior<HTMLElement, unknown>;
  private levels: TileLevel[] = [];
  private tiles = new Map<string, HTMLImageElement | 'loading' | 'error'>();
  private viewListeners: ((v: View, zooming: boolean) => void)[] = [];
  private raf = 0;
  private zooming = false;
  private zoomEndTimer = 0;
  private anim: number | null = null;
  insets = { left: 340, right: 20, top: 70, bottom: 150 };

  constructor(root: HTMLElement) {
    this.root = root;
    root.classList.add('map-root');
    this.base = document.createElement('canvas');
    this.base.className = 'map-base';
    root.appendChild(this.base);
    this.worldSvg = svgEl('svg', { class: 'map-world' }, root);
    this.defs = svgEl('defs', {}, this.worldSvg);
    this.zoomG = svgEl('g', { class: 'zoom' }, this.worldSvg);
    this.screenSvg = svgEl('svg', { class: 'map-screen' }, root);
    this.fx = document.createElement('canvas');
    this.fx.className = 'map-fx';
    root.appendChild(this.fx);

    this.zb = d3zoom<HTMLElement, unknown>()
      .scaleExtent([0.02, 5])
      .on('start', () => { this.zooming = true; this.root.classList.add('zooming'); })
      .on('zoom', (ev: { transform: ZoomTransform }) => {
        const t = ev.transform;
        this.view = { k: t.k, x: t.x, y: t.y };
        this.schedule();
      })
      .on('end', () => {
        clearTimeout(this.zoomEndTimer);
        this.zoomEndTimer = window.setTimeout(() => { this.zooming = false; this.root.classList.remove('zooming'); this.schedule(); }, 120);
      });
    select(root).call(this.zb).on('dblclick.zoom', null);
    new ResizeObserver(() => this.resize()).observe(root);
    this.resize();
  }

  async loadTiles(metaUrl: string, base: string) {
    const meta = await fetch(metaUrl).then((r) => r.json());
    this.levels = meta.levels;
    this.tileBase = base;
    // 预载最低一级，保证首屏立即可见
    const l0 = this.levels[0];
    await Promise.all(Array.from({ length: l0.cols * l0.rows }, (_, i) => this.loadTile(0, i % l0.cols, Math.floor(i / l0.cols))));
    this.schedule();
  }
  private tileBase = 'tiles/base';

  private loadTile(z: number, x: number, y: number): Promise<void> {
    const key = `${z}/${x}_${y}`;
    if (this.tiles.has(key)) return Promise.resolve();
    this.tiles.set(key, 'loading');
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.tiles.set(key, img); this.schedule(); res(); };
      img.onerror = () => { this.tiles.set(key, 'error'); res(); };
      img.src = `${this.tileBase}/${key}.webp`;
    });
  }

  resize() {
    const r = this.root.getBoundingClientRect();
    this.width = r.width;
    this.height = r.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [this.base, this.fx]) {
      c.width = Math.round(r.width * this.dpr);
      c.height = Math.round(r.height * this.dpr);
      c.style.width = r.width + 'px';
      c.style.height = r.height + 'px';
    }
    this.worldSvg.setAttribute('width', String(r.width));
    this.worldSvg.setAttribute('height', String(r.height));
    this.screenSvg.setAttribute('width', String(r.width));
    this.screenSvg.setAttribute('height', String(r.height));
    const first = this.fitK === 0.1;
    this.computeFit();
    if (first) this.home(0);
    this.schedule();
  }

  /** 波兰全境（含东普鲁士）适配到可用区域 */
  private computeFit() {
    const a = project([14.0, 55.9]), b = project([28.2, 48.3]);
    const aw = Math.max(200, this.width - this.insets.left - this.insets.right);
    const ah = Math.max(200, this.height - this.insets.top - this.insets.bottom);
    this.fitK = Math.min(aw / (b[0] - a[0]), ah / (b[1] - a[1]));
    this.zb.scaleExtent([this.fitK * 0.55, this.fitK * 16]);
    this.zb.translateExtent([[-W * 0.1, -H * 0.1], [W * 1.1, H * 1.1]]);
  }
  get relK() { return this.view.k / this.fitK; }

  home(ms = 900) {
    const a = project([14.0, 55.9]), b = project([28.2, 48.3]);
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    this.flyToWorld(cx, cy, 1, ms);
  }

  /** 屏幕可用区域中心 */
  private viewCenter(): [number, number] {
    return [this.insets.left + (this.width - this.insets.left - this.insets.right) / 2, this.insets.top + (this.height - this.insets.top - this.insets.bottom) / 2];
  }

  flyTo(ll: LonLat, relZoom: number, ms = 1400) {
    const [wx, wy] = project(ll);
    this.flyToWorld(wx, wy, relZoom, ms);
  }

  flyToWorld(wx: number, wy: number, relZoom: number, ms = 1400) {
    const [cx, cy] = this.viewCenter();
    const k1 = Math.max(this.fitK * 0.55, Math.min(this.fitK * 16, this.fitK * relZoom));
    const toT = (k: number, wx2: number, wy2: number) => zoomIdentity.translate(cx - wx2 * k, cy - wy2 * k).scale(k);
    const sel = select(this.root);
    if (this.anim) cancelAnimationFrame(this.anim);
    if (ms <= 0) { sel.call(this.zb.transform, toT(k1, wx, wy)); return; }
    // d3.interpolateZoom 以「视口中心 + 视野宽度」插值
    const v = this.view;
    const w0 = this.width / v.k;
    const c0x = (cx - v.x) / v.k, c0y = (cy - v.y) / v.k;
    const it = interpolateZoom([c0x, c0y, w0], [wx, wy, this.width / k1]);
    const dur = Math.max(ms, Math.min(it.duration * 0.9, ms * 1.8));
    const t0 = performance.now();
    const step = (now: number) => {
      let p = Math.min(1, (now - t0) / dur);
      p = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const [x, y, w] = it(p);
      const k = this.width / w;
      sel.call(this.zb.transform, toT(k, x, y));
      if (p < 1) this.anim = requestAnimationFrame(step);
      else this.anim = null;
    };
    this.anim = requestAnimationFrame(step);
  }

  onView(fn: (v: View, zooming: boolean) => void) { this.viewListeners.push(fn); }

  schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.zoomG.setAttribute('transform', `translate(${this.view.x},${this.view.y}) scale(${this.view.k})`);
      this.drawTiles();
      for (const l of this.viewListeners) l(this.view, this.zooming);
    });
  }

  toScreen(wx: number, wy: number): [number, number] { return [this.view.x + wx * this.view.k, this.view.y + wy * this.view.k]; }
  llToScreen(ll: LonLat | readonly number[]): [number, number] { const [x, y] = project(ll); return this.toScreen(x, y); }
  toWorld(sx: number, sy: number): [number, number] { return [(sx - this.view.x) / this.view.k, (sy - this.view.y) / this.view.k]; }

  private drawTiles() {
    const ctx = this.base.getContext('2d')!;
    const { k, x, y } = this.view;
    const dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#d8cba8';
    ctx.fillRect(0, 0, this.base.width, this.base.height);
    if (!this.levels.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = this.terrainOpacity;
    // 世界坐标可见范围
    const wx0 = -x / k, wy0 = -y / k, wx1 = (this.width - x) / k, wy1 = (this.height - y) / k;
    let target = this.levels.findIndex((l) => l.scale >= k * dpr * 0.85);
    if (target < 0) target = this.levels.length - 1;
    // 先画低级别作为占位，再画目标级别
    for (let z = 0; z <= target; z++) {
      const L = this.levels[z];
      const tw = 512 / L.scale;
      const c0 = Math.max(0, Math.floor(wx0 / tw)), c1 = Math.min(L.cols - 1, Math.floor(wx1 / tw));
      const r0 = Math.max(0, Math.floor(wy0 / tw)), r1 = Math.min(L.rows - 1, Math.floor(wy1 / tw));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const key = `${z}/${c}_${r}`;
        const t = this.tiles.get(key);
        if (z === target && t === undefined) this.loadTile(z, c, r);
        if (t instanceof HTMLImageElement) {
          const sw = t.naturalWidth / L.scale, sh = t.naturalHeight / L.scale;
          // 轻微外扩 0.5px 避免瓦片缝
          ctx.drawImage(t, x + c * tw * k - 0.25, y + r * tw * k - 0.25, sw * k + 0.5, sh * k + 0.5);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
