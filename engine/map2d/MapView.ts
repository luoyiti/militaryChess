/**
 * 2D 主地图：视口缩放、瓦片底图（Canvas）、世界坐标矢量层（SVG，整体变换）、屏幕坐标层（棋子/标注/特效）。
 * 世界坐标 → 屏幕：sx = x + k * wx。
 */
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { interpolateZoom } from 'd3-interpolate';
import { W, H, project } from '../geo/frame';
import type { LonLat } from '../core/types';
import { clampViewport, coverageScale, visibleWorld, type WorldBounds } from './coverage';
import { manifest } from '../campaign/context';

export interface View { k: number; x: number; y: number }

/** d3-zoom 的默认 constrain（未启用覆盖范围夹紧时使用） */
function defaultConstrain(transform: ZoomTransform, extent: [[number, number], [number, number]], translateExtent: [[number, number], [number, number]]): ZoomTransform {
  const dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0];
  const dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
  return transform.translate(dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1), dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1));
}
interface TileLevel { z: number; width: number; height: number; cols: number; rows: number; scale: number }
interface TilePyramid { id: string; base: string; origin: [number, number]; bounds: WorldBounds; levels: TileLevel[] }

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
  fitK = 0.1; // 全图适配时的 k（relK = k / fitK）
  width = 0;
  height = 0;
  dpr = 1;
  terrainOpacity = 1;
  private zb: ZoomBehavior<HTMLElement, unknown>;
  private pyramids: TilePyramid[] = [];
  private backgroundBounds: WorldBounds = [0, 0, W, H];
  /** 全图适配框（世界坐标）：整个画布或 manifest.map.fit 经纬度框 */
  private fitBox: WorldBounds = [0, 0, W, H];
  /** true：有周边背景瓦片时把视口夹在背景范围内（BK/CR）；false：缩放 0.55–16 倍、平移外扩 10% */
  private coverageClamp = false;
  private tiles = new Map<string, HTMLImageElement | 'loading' | 'error'>();
  private viewListeners: ((v: View, zooming: boolean) => void)[] = [];
  private raf = 0;
  private zooming = false;
  private zoomEndTimer = 0;
  private anim: number | null = null;
  insets = {
    left: window.innerWidth < 760 ? 30 : 340,
    right: 20,
    top: manifest().map.insetTop ?? 64,
    bottom: window.innerWidth < 760 ? 118 : 150,
  };

  constructor(root: HTMLElement) {
    this.root = root;
    root.classList.add('map-root');
    const fit = manifest().map.fit;
    if (Array.isArray(fit)) {
      const a = project([fit[0], fit[1]]), b = project([fit[2], fit[3]]);
      this.fitBox = [a[0], a[1], b[0], b[1]];
    }
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
      .constrain((t, extent, translateExtent) => {
        if (!this.coverageClamp) return defaultConstrain(t, extent, translateExtent);
        const v = clampViewport(t, this, this.backgroundBounds);
        return zoomIdentity.translate(v.x, v.y).scale(v.k);
      })
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
    const fetchMeta = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`地图数据加载失败：${url}`);
      return response.json();
    };
    const withContext = !!manifest().map.contextTiles;
    const [core, context] = await Promise.all([fetchMeta(metaUrl), withContext ? fetchMeta('tiles/context/meta.json') : null]);
    this.pyramids = [
      ...(context ? [{ id: 'context', base: 'tiles/context', origin: context.origin, bounds: context.bounds, levels: context.levels } as TilePyramid] : []),
      { id: 'base', base, origin: [0, 0], bounds: [0, 0, W, H], levels: core.levels },
    ];
    if (context) { this.backgroundBounds = context.bounds; this.coverageClamp = true; }
    this.computeFit();
    // Preload a complete low-resolution geographic layer, not just the theatre.
    await Promise.all(this.pyramids.flatMap((p) => {
      const l = p.levels[0];
      return Array.from({ length: l.cols * l.rows }, (_, i) => this.loadTile(p, l.z, i % l.cols, Math.floor(i / l.cols)));
    }));
    this.home(0);
  }

  private loadTile(pyramid: TilePyramid, z: number, x: number, y: number): Promise<void> {
    const key = `${pyramid.id}:${z}/${x}_${y}`;
    if (this.tiles.has(key)) return Promise.resolve();
    this.tiles.set(key, 'loading');
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.tiles.set(key, img); this.schedule(); res(); };
      img.onerror = () => { this.tiles.set(key, 'error'); res(); };
      img.src = `${pyramid.base}/${z}/${x}_${y}.webp`;
    });
  }

  resize() {
    const r = this.root.getBoundingClientRect();
    // Switching to the 3D panel hides this surface. Retain the last valid
    // dimensions so an in-flight camera animation cannot produce scale(0).
    if (r.width < 2 || r.height < 2) return;
    const first = this.width === 0;
    if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
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
    this.computeFit();
    if (first) this.home(0);
    else if (this.coverageClamp) {
      const v = clampViewport(this.view, this, this.backgroundBounds);
      select(this.root).call(this.zb.transform, zoomIdentity.translate(v.x, v.y).scale(v.k));
    }
    this.schedule();
  }

  /** 把整张战役地图适配到侧栏和时间轴之间的区域 */
  private computeFit() {
    const aw = Math.max(200, this.width - this.insets.left - this.insets.right);
    const ah = Math.max(200, this.height - this.insets.top - this.insets.bottom);
    const [fx0, fy0, fx1, fy1] = this.fitBox;
    this.fitK = Math.min(aw / (fx1 - fx0), ah / (fy1 - fy0));
    if (!this.coverageClamp) {
      this.zb.scaleExtent([this.fitK * 0.55, this.fitK * 16]);
      this.zb.translateExtent([[-W * 0.1, -H * 0.1], [W * 1.1, H * 1.1]]);
      return;
    }
    const minK = coverageScale(this, this.backgroundBounds);
    this.zb.scaleExtent([minK, Math.max(minK, this.fitK * 16)]);
    this.zb.extent([[0, 0], [this.width, this.height]]);
    this.zb.translateExtent([[this.backgroundBounds[0], this.backgroundBounds[1]], [this.backgroundBounds[2], this.backgroundBounds[3]]]);
  }
  get isAnimating() { return this.anim !== null; }
  get relK() { return this.view.k / this.fitK; }

  home(ms = 900) {
    const [fx0, fy0, fx1, fy1] = this.fitBox;
    this.flyToWorld((fx0 + fx1) / 2, (fy0 + fy1) / 2, 1, ms);
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
    if (![wx, wy, relZoom].every(Number.isFinite)) return;
    const [cx, cy] = this.viewCenter();
    const minK = this.coverageClamp ? coverageScale(this, this.backgroundBounds) : this.fitK * 0.55;
    const k1 = Math.max(minK, Math.min(Math.max(minK, this.fitK * 16), this.fitK * relZoom));
    const toT = (k: number, wx2: number, wy2: number) => {
      if (!this.coverageClamp) return zoomIdentity.translate(cx - wx2 * k, cy - wy2 * k).scale(k);
      const v = clampViewport({ k, x: cx - wx2 * k, y: cy - wy2 * k }, this, this.backgroundBounds);
      return zoomIdentity.translate(v.x, v.y).scale(v.k);
    };
    const sel = select(this.root);
    if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
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

  coverage() {
    return {
      bounds: this.backgroundBounds, visible: visibleWorld(this.view, this), minScale: coverageScale(this, this.backgroundBounds),
      view: { ...this.view }, size: { width: this.width, height: this.height },
      tilesReady: [...this.tiles.values()].filter((t) => t instanceof HTMLImageElement).length,
      tileErrors: [...this.tiles.values()].filter((t) => t === 'error').length,
    };
  }

  private drawTiles() {
    const ctx = this.base.getContext('2d')!;
    const { k, x, y } = this.view;
    const dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#d8cba8';
    ctx.fillRect(0, 0, this.base.width, this.base.height);
    if (!this.pyramids.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = this.terrainOpacity;
    const [wx0, wy0, wx1, wy1] = visibleWorld(this.view, this);
    for (const p of this.pyramids) {
      let target = p.levels.findIndex((l) => l.scale >= k * dpr * .85);
      if (target < 0) target = p.levels.length - 1;
      for (let zi = 0; zi <= target; zi++) {
        const l = p.levels[zi], tw = 512 / l.scale;
        const c0 = Math.max(0, Math.floor((wx0 - p.origin[0]) / tw)), c1 = Math.min(l.cols - 1, Math.floor((wx1 - p.origin[0]) / tw));
        const r0 = Math.max(0, Math.floor((wy0 - p.origin[1]) / tw)), r1 = Math.min(l.rows - 1, Math.floor((wy1 - p.origin[1]) / tw));
        for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
          const tile = this.tiles.get(`${p.id}:${l.z}/${col}_${row}`);
          if (zi === target && tile === undefined) this.loadTile(p, l.z, col, row);
          if (tile instanceof HTMLImageElement) {
            const sw = tile.naturalWidth / l.scale, sh = tile.naturalHeight / l.scale;
            ctx.drawImage(tile, x + (p.origin[0] + col * tw) * k - .25, y + (p.origin[1] + row * tw) * k - .25, sw * k + .5, sh * k + .5);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
