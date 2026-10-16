/**
 * 2D 海战层：舰船俯视剪影（随航向旋转，大洋缩放为标绘棋子、战术缩放按舰长放大）、尾迹与航迹图（时刻刻度）、
 * 射击（炮口闪光 → 曳光弹道 → 水柱，命中火光与黑烟；暂停时画射击线与距离）、鱼雷航迹、烟幕、射程圈、海图网格与海里比例尺。
 *
 * 全部画在一张插在 map.screenSvg 之下的 Canvas 上（DPR 自适应）；交互用 screenSvg 里透明的命中框（悬停提示、点击选中与棋子一致）。
 * 数据只通过 engine/naval/model.ts 读取；特效按叙事时间确定性生成，墙钟只决定动画进度。
 */
import { SpatialIndex, clipSegment, upperBound, type Bounds } from '../geo/spatial';
import { svgEl, type MapView, type View } from './MapView';
import type { DB } from '../data/db';
import type { UnitsLayer } from './units';
import type { LonLat, UnitStatus } from '../core/types';
import { store } from '../app/store';
import { paceAt, hoursToDate } from '../core/time';
import { project, unproject, KM } from '../geo/frame';
import { unitStateAt, trackAt, isTerminal, type RUnit, type UnitState } from '../model/core';
import { projectedHeading } from '../model/flight';
import {
  engagementsAt, salvosBetween, damageAt, hitsBetween, torpedoesAt, smokeAt, destination, rangeLabel, hash01, defaultSalvoSec,
  type Engagement, type DamageView, type RHit,
} from '../naval/model';
import { shipLayout, drawShip, drawBeam, traceHull, calLabel, hitLocation, WEAPON_KIND_ZH, type ShipLayout, type ShipPalette, type LTurret } from './navalSilhouettes';
import { sideDef, manifest } from '../campaign/context';
import { audio } from '../audio/audio';
import { relaxLayout, type RelaxItem } from './layout';
import '../styles/naval.css';

// ---------- 常量与小工具 ----------
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const p2 = (n: number) => (n < 10 ? '0' + n : String(n));
const FONT_HEAD = '"WB Head", Oswald, "Arial Narrow", sans-serif';
const FONT_TYPE = '"WB Typewriter", "Special Elite", "Courier New", monospace, "WB Serif SC", serif';
const FONT_HAND = '"WB Hand", "LXGW WenKai", "Kaiti SC", serif';
const INK = '#2b2418';
const PAPER = '#efe4c8';
const HALO = 'rgba(246,238,219,.92)';
/** 舰种排序：主力舰标签优先 */
const KIND_RANK: Record<string, number> = {
  battleship: 0, battlecruiser: 0, pocket_battleship: 0, carrier: 1, heavy_cruiser: 2, light_cruiser: 3, destroyer: 4, submarine: 5,
  auxiliary: 6, tanker: 6, liner: 7, merchant: 8, tug: 9, boat: 10,
};
/** 叙事时刻 → '0620' */
const hhmm = (h: number) => { const d = hoursToDate(h); return p2(d.getUTCHours()) + p2(d.getUTCMinutes()); };
/** 叙事时刻 → '12/13' */
const mday = (h: number) => { const d = hoursToDate(h); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };

/** 径向渐变贴图（预渲染，逐帧只 drawImage） */
function sprite(stops: [number, string][], size = 64): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// ---------- 类型 ----------
interface Terminal { h: number; status: UnitStatus; label: string; ll: LonLat; heading: number; fadeH: number }
interface Poly { h: Float64Array; x: Float32Array; y: Float32Array; n: number; index: SpatialIndex<number> }
interface ShipRec {
  u: RUnit; lay: ShipLayout; pal: ShipPalette; main: string; dark: string; shell: string;
  term: Terminal | null; poly: Poly | null; lenF: number; prio: number; label: string; civil: boolean;
}
/** 本帧的舰船（复用对象） */
interface Drawn {
  rec: ShipRec; s: UnitState; wx: number; wy: number; ax: number; ay: number; x: number; y: number; ang: number;
  L: number; W: number; alpha: number; on: boolean; dmg: DamageView | null; detail: 0 | 1 | 2;
}
const enum K { Flash, Cordite, Shell, Splash, HitFlash, Spark, HitSmoke }
/** 瞬时特效（对象池） */
interface Fx {
  kind: K; t0: number; life: number; wx: number; wy: number; vx: number; vy: number; size: number; ang: number; seed: number;
  /** 炮弹：目标、落点偏移（屏幕像素，按开火方向旋转）、水柱数、颜色、口径 */
  target: string; ox: number; oy: number; n: number; col: string; cal: number; shooter: string; tx: number; ty: number;
}
interface Lbl { x: number; y: number; w: number; h: number; text: string; font: string; color: string; align: CanvasTextAlign; alpha: number; bg: string | null; sub?: string; subFont?: string; subColor?: string }
interface NavalCfg { tacticalZoom: number; shipPx: [number, number]; trackTicks: number; fleetTicks: number; wakeMin: number; chartGrid: number | false; rangeUnit: 'yd' | 'km' | 'nm'; shellColor: Record<string, string> }

export class NavalLayer {
  private selection: string | null = null;
  get selected() { return this.selection; }
  set selected(id: string | null) { if (id !== this.selection) { this.selection = id; this.dirty = true; } }
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hitG: SVGGElement;
  private hits = new Map<string, SVGRectElement>();
  private cfg: NavalCfg;
  private ships: ShipRec[] = [];
  private byId = new Map<string, Drawn>();
  private drawn: Drawn[] = [];
  private nDrawn = 0;
  private t = 0;
  private dirty = true;
  private layers = { units: true, tracks: true, gunfire: true, ranges: false, chart: true };
  private playing = false;
  /** 播放时累计的墙钟毫秒（黑烟、火光的动画相位；暂停时静止） */
  private fxClock = 0;
  private fxPrevT: number | null = null;
  private fx: Fx[] = [];
  private pool: Fx[] = [];
  private fireAlpha = 1;
  private lblPool: Lbl[] = [];
  private nLbl = 0;
  private occ: number[] = []; // 已占用的标签矩形 x,y,w,h
  private widthCache = new Map<string, number>();
  private reduced: boolean;
  private sp: Record<'glow' | 'core' | 'smokeDark' | 'smokeLight' | 'smokeBrown' | 'fire', HTMLCanvasElement>;
  private st = { ships: 0, shells: 0, splashes: 0, smoke: 0, torpedoes: 0, fireLines: 0, particles: 0, tracks: 0, gridLines: 0, wrecks: 0, labels: 0, renders: 0 };
  private hover: string | null = null;
  private chartCache = new Map<string, { key: string; canvas: HTMLCanvasElement; lines: number }>();
  private chartKey() { const m = this.map; return [m.view.k,m.view.x,m.view.y,m.width,m.height,m.dpr,m.insets.left,m.insets.right,m.insets.top,m.insets.bottom].join(','); }
  private cachedChart(name: string, draw: () => void) {
    const key = this.chartKey(), main = this.ctx;
    let entry = this.chartCache.get(name);
    if (!entry || entry.key !== key) {
      const canvas = entry?.canvas ?? document.createElement('canvas');
      canvas.width = this.canvas.width; canvas.height = this.canvas.height;
      this.ctx = canvas.getContext('2d')!; this.ctx.scale(this.map.dpr, this.map.dpr);
      const before = this.st.gridLines;
      try { draw(); } finally { this.ctx = main; }
      entry = { key, canvas, lines: this.st.gridLines - before }; this.chartCache.set(name, entry);
    } else this.st.gridLines += entry.lines;
    main.drawImage(entry.canvas, 0, 0, this.map.width, this.map.height);
  }

  constructor(readonly map: MapView, readonly db: DB, readonly units: UnitsLayer) {
    const n = manifest().naval ?? {};
    this.cfg = {
      tacticalZoom: n.tacticalZoom ?? 10, shipPx: n.shipPx ?? [26, 96], trackTicks: n.trackTicks ?? 10, fleetTicks: n.fleetTicks ?? 24,
      wakeMin: n.wakeMin ?? 12, chartGrid: n.chartGrid === undefined ? 6 : n.chartGrid, rangeUnit: n.rangeUnit ?? 'yd', shellColor: n.shellColor ?? {},
    };
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-naval';
    map.root.insertBefore(this.canvas, map.screenSvg);
    this.ctx = this.canvas.getContext('2d')!;
    this.hitG = svgEl('g', { class: 'naval-hits' }, map.screenSvg);
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.sp = {
      glow: sprite([[0, 'rgba(255,236,170,1)'], [0.25, 'rgba(255,170,60,.85)'], [0.6, 'rgba(230,90,20,.28)'], [1, 'rgba(200,60,10,0)']]),
      core: sprite([[0, 'rgba(255,255,245,1)'], [0.4, 'rgba(255,246,210,.8)'], [1, 'rgba(255,240,200,0)']]),
      smokeDark: sprite([[0, 'rgba(38,32,26,.85)'], [0.5, 'rgba(48,42,34,.5)'], [1, 'rgba(60,52,42,0)']]),
      smokeLight: sprite([[0, 'rgba(246,244,238,.95)'], [0.45, 'rgba(232,229,220,.7)'], [0.8, 'rgba(214,210,200,.25)'], [1, 'rgba(210,206,196,0)']]),
      smokeBrown: sprite([[0, 'rgba(120,104,84,.7)'], [0.55, 'rgba(130,114,92,.35)'], [1, 'rgba(140,124,100,0)']]),
      fire: sprite([[0, 'rgba(255,240,180,1)'], [0.3, 'rgba(255,150,40,.9)'], [0.7, 'rgba(210,60,10,.35)'], [1, 'rgba(160,30,0,0)']]),
    };
    for (const u of db.unitList) if (u.ship) this.ships.push(this.makeRec(u));
    this.ships.sort((a, b) => a.prio - b.prio);
    try { // 画布文字用网页字体：字体就位后重画
      const f = document.fonts;
      if (f) Promise.all([f.load(`600 12px ${FONT_HEAD}`), f.load(`11px ${FONT_TYPE}`), f.load(`12px ${FONT_HAND}`)]).then(() => { this.widthCache.clear(); this.chartCache.clear(); this.dirty = true; }, () => undefined);
    } catch { /* 无 FontFaceSet */ }
  }

  private makeRec(u: RUnit): ShipRec {
    const ship = u.ship!;
    let pal: ShipPalette, main = '#3b3226', dark = INK;
    try {
      const sd = sideDef(u.side);
      main = sd.css.main; dark = sd.css.dark;
      pal = { fill: sd.counter.bg, edge: sd.counter.edge, deck: mix(sd.counter.bg, PAPER, 0.42), ink: '#231d14', paper: '#f1e8d0' };
    } catch { pal = { fill: '#6b6253', edge: '#3b3226', deck: '#a59a84', ink: '#231d14', paper: '#f1e8d0' }; }
    const lay = shipLayout(ship);
    if (lay.spec.civil) { pal.deck = mix(pal.fill, '#e8dcc0', 0.62); }
    const last = u.track[u.track.length - 1];
    let term: Terminal | null = null;
    if (last && isTerminal(last.status)) {
      const note = (last.note ?? '') + ' ' + u.track.slice(-3).map((p) => p.note ?? '').join(' ');
      const label = last.status === 'destroyed' ? (/自沉|凿沉|scuttl|selbstversenk/i.test(note) ? '自沉' : '沉没') : last.status === 'interned' ? '扣留' : last.status === 'surrendered' ? '被俘' : '';
      const prev = u.track[u.track.length - 2];
      const heading = last.course !== undefined ? last.course : prev ? (Math.atan2(last.ll[0] - prev.ll[0], last.ll[1] - prev.ll[1]) * 180) / Math.PI : 0;
      // 舰船沉没在 3 秒播放时间内淡出（按当时的播放速度换算叙事时长）
      term = { h: last.h, status: last.status, label, ll: last.ll, heading, fadeH: Math.max(0.02, paceAt(last.h) * 3) };
    }
    return {
      u, lay, pal, main, dark, shell: this.cfg.shellColor[u.side] ?? main, term, poly: null,
      lenF: lay.lengthM / 180, prio: (KIND_RANK[ship.kind] ?? 8) * 1000 - Math.min(999, (ship.tonnage ?? 0) / 40),
      label: u.name.short ?? u.name.zh, civil: !!lay.spec.civil,
    };
  }

  // ---------- 接口（engine/app/start.ts） ----------
  setTime(t: number) { if (t !== this.t) { this.t = t; this.dirty = true; } }
  updateView(_v: View) { this.dirty = true; }
  setLayers(L: Record<string, boolean>) {
    this.layers = { units: L.units !== false, tracks: L.tracks !== false, gunfire: L.gunfire !== false, ranges: !!L.ranges, chart: L.chart !== false };
    if (!this.layers.gunfire) this.clearFx();
    this.dirty = true;
  }
  clearFx() {
    for (const f of this.fx) this.pool.push(f);
    this.fx.length = 0;
    this.fxPrevT = null;
    this.dirty = true;
  }
  tick(dtMs: number, now: number, playing: boolean) {
    const t = store.get().t; // 时钟已在本帧推进 store.t（订阅通知在微任务里）
    if (t !== this.t) { this.t = t; this.dirty = true; }
    if (playing !== this.playing) { this.playing = playing; this.dirty = true; }
    if (playing) {
      this.fxClock += dtMs;
      if (this.layers.gunfire && !this.reduced && this.fxPrevT !== null && t > this.fxPrevT) {
        const R = paceAt(t) * store.get().speed; // 叙事小时 / 墙钟秒
        if (t - this.fxPrevT <= R * 0.35 + 1e-9) this.spawn(this.fxPrevT, t, now, R);
      }
    }
    this.fxPrevT = t;
    const target = playing && !this.reduced ? 0 : 1;
    if (this.fireAlpha !== target) {
      this.fireAlpha = target > this.fireAlpha ? Math.min(1, this.fireAlpha + dtMs / 350) : Math.max(0, this.fireAlpha - dtMs / 200);
      this.dirty = true;
    }
    if (this.dirty || this.fx.length) this.render(now);
  }
  stats() {
    return { ...this.st, inFlight: this.fx.filter((f) => f.kind === K.Shell).length, selected: this.selected };
  }

  // ---------- 尺寸 ----------
  /** 剪影像素长度：大洋缩放为固定大小的标绘棋子（按舰长略分大小），战术缩放起按真实舰长 × 夸大系数放大，夹在 shipPx 内 */
  private lengthPx(rec: ShipRec, relK: number): number {
    const [p0, p1] = this.cfg.shipPx, tz = this.cfg.tacticalZoom;
    const counter = p0 * clamp(Math.pow(rec.lenF, 0.38), 0.6, 1.16);
    if (relK < tz) return counter;
    const base = p0 * Math.pow(relK / tz, 0.48);
    return clamp(base * Math.pow(rec.lenF, 0.9), counter, p1);
  }

  // ---------- 渲染 ----------
  private ensureSize() {
    const map = this.map, dpr = map.dpr;
    const w = Math.round(map.width * dpr), h = Math.round(map.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      this.canvas.style.width = map.width + 'px'; this.canvas.style.height = map.height + 'px';
    }
  }

  private render(now: number) {
    this.dirty = false;
    const map = this.map, ctx = this.ctx;
    if (map.width < 2) return;
    this.ensureSize();
    const dpr = map.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const st = this.st;
    st.ships = st.shells = st.splashes = st.smoke = st.torpedoes = st.fireLines = st.tracks = st.gridLines = st.wrecks = st.labels = 0;
    st.renders++;
    this.nLbl = 0; this.occ.length = 0;
    const t = this.t, relK = map.relK;
    // 1. 海图网格
    if (this.layers.chart && this.cfg.chartGrid !== false && relK >= this.cfg.chartGrid) this.cachedChart('grid', () => this.drawGrid());
    // 2. 舰船状态
    this.layoutShips(t, relK);
    // 3. 航迹图
    this.drawTracks(t, relK);
    // 4. 鱼雷
    if (this.layers.gunfire) this.drawTorpedoes(t);
    // 5. 尾迹
    if (this.layers.units) for (let i = 0; i < this.nDrawn; i++) this.drawWake(this.drawn[i], t);
    // 6. 烟幕
    this.drawSmokeScreens(t);
    // 7. 水柱（落在舰船之下）
    if (this.fx.length) this.drawFx(now, 0);
    // 8. 射程圈
    if (this.layers.ranges && this.selected) this.drawRanges();
    // 9. 射击线（暂停时）
    const engs = this.layers.gunfire && this.db.naval.fire.length ? engagementsAt(this.db.naval, this.db.units, t) : [];
    if (engs.length && this.fireAlpha > 0.01) this.drawFireLines(engs);
    // 10. 残骸
    if (this.layers.units) this.drawWrecks(t);
    // 11. 舰船
    if (this.layers.units) this.drawShips(engs);
    // 12. 起火黑烟
    if (this.layers.units) for (let i = 0; i < this.nDrawn; i++) this.drawBurning(this.drawn[i], t);
    // 13. 闪光、碎片、炮弹
    if (this.fx.length) this.drawFx(now, 1);
    // 14. 标签
    this.flushLabels();
    // 15. 网格边注与比例尺
    if (this.layers.chart && this.cfg.chartGrid !== false && relK >= this.cfg.chartGrid) this.cachedChart('grid-labels', () => this.drawGridLabels());
    this.updateHits();
  }

  // ---------- 舰船布局 ----------
  private layoutShips(t: number, relK: number) {
    const map = this.map, v = map.view;
    this.byId.clear();
    let n = 0;
    for (const rec of this.ships) {
      const u = rec.u;
      if (t < u.fromH || t > u.toH + u.fadeH) continue;
      const s = unitStateAt(u.id, this.db.units, t);
      if (!s) continue;
      let alpha = s.fade;
      if (rec.term && t >= rec.term.h) alpha = Math.min(alpha, 1 - (t - rec.term.h) / rec.term.fadeH);
      if (alpha <= 0.02) continue;
      const [wx, wy] = project(s.ll);
      const ax = v.x + wx * v.k, ay = v.y + wy * v.k;
      let d = this.drawn[n];
      if (!d) { d = { rec, s, wx, wy, ax, ay, x: ax, y: ay, ang: 0, L: 0, W: 0, alpha, on: false, dmg: null, detail: 0 }; this.drawn[n] = d; }
      d.rec = rec; d.s = s; d.wx = wx; d.wy = wy; d.ax = ax; d.ay = ay; d.alpha = alpha;
      d.ang = projectedHeading(s.ll, s.heading);
      d.L = this.lengthPx(rec, relK);
      d.W = drawBeam(rec.lay, d.L);
      d.detail = d.L < 34 ? 0 : d.L < 58 ? 1 : 2;
      const m = d.L + 40;
      d.on = ax > -m && ay > -m && ax < map.width + m && ay < map.height + m;
      d.dmg = d.on && this.db.naval.any ? damageAt(this.db.naval, u.id, t) : null;
      // 一律从锚点冷启动：不沿用上一帧的避让量。否则收敛点取决于相机走过的路径，
      // 平移一个来回时舰船回不到原位（与棋子层同一个 bug，见 engine/map2d/layout.ts）。
      d.x = ax; d.y = ay;
      this.byId.set(u.id, d);
      n++;
    }
    this.nDrawn = n;
    // 碰撞松弛（港内、编队密集时）：大洋缩放下推开，战术缩放下只轻推，保留引线指向真实位置。
    // 与棋子层同源，用共享的 Jacobi 求解器：每轮位移先累加再统一应用，因此与遍历顺序无关
    // （可见舰船集合每帧都在变，顺序相关的求解会让整片舰船重排 = 闪烁）。
    const tactical = relK >= this.cfg.tacticalZoom;
    // Drawn 自带 ax/ay/x/y，结构上就是 RelaxItem；这里只补上求解器需要的「半径」语义
    const items = this.drawn as unknown as (RelaxItem & Drawn)[];
    relaxLayout(items, 8, 0.08, {
      active: (a) => (a as unknown as Drawn).on,
      minDist: (a, b) => ((a as unknown as Drawn).L + (b as unknown as Drawn).L) * (tactical ? 0.2 : 0.42),
      // 主力舰（prio 小）少动，让小船让位
      weight: (a, b) => ((a as unknown as Drawn).rec.prio <= (b as unknown as Drawn).rec.prio ? 0.35 : 0.65),
      ids: this.drawn.map((d) => d.rec.u.id),
    });
  }

  // ---------- 舰船 ----------
  private drawShips(engs: Engagement[]) {
    const ctx = this.ctx, dpr = this.map.dpr;
    const order: Drawn[] = [];
    for (let i = 0; i < this.nDrawn; i++) if (this.drawn[i].on) order.push(this.drawn[i]);
    // 小船在下、主力舰与选中舰在上
    order.sort((a, b) => (a.rec.u.id === this.selected ? 1 : 0) - (b.rec.u.id === this.selected ? 1 : 0) || b.rec.prio - a.rec.prio);
    // 先把全部舰船占位，标签避让
    for (const d of order) { const [hx, hy] = this.halfExtent(d); this.occ.push(d.x - hx, d.y - hy, hx * 2, hy * 2); }
    // 引线
    ctx.save();
    ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(40,30,15,.55)'; ctx.lineWidth = 1;
    for (const d of order) {
      if (Math.hypot(d.x - d.ax, d.y - d.ay) < 7) continue;
      ctx.globalAlpha = d.alpha;
      ctx.beginPath(); ctx.moveTo(d.ax, d.ay); ctx.lineTo(d.x, d.y); ctx.stroke();
      ctx.fillStyle = d.rec.dark; ctx.beginPath(); ctx.arc(d.ax, d.ay, 1.8, 0, TAU); ctx.fill();
    }
    ctx.restore();
    const tactical = this.map.relK >= this.cfg.tacticalZoom;
    for (const d of order) {
      const rec = d.rec, sel = rec.u.id === this.selected;
      const c = Math.cos(d.ang), s = Math.sin(d.ang);
      ctx.save();
      ctx.globalAlpha = d.alpha;
      // 投影阴影
      ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * (d.x + 1.2), dpr * (d.y + 1.8));
      traceHull(ctx, rec.lay.hull, d.L, d.W);
      ctx.fillStyle = 'rgba(40,28,12,.2)'; ctx.fill();
      ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * d.x, dpr * d.y);
      // 棋子底板（大洋缩放）
      if (!tactical) {
        ctx.beginPath(); ctx.ellipse(0, 0, d.L / 2 + 4, d.W / 2 + 4.5, 0, 0, TAU);
        ctx.fillStyle = 'rgba(250,245,231,.82)'; ctx.fill();
        ctx.strokeStyle = rec.pal.edge; ctx.globalAlpha = d.alpha * 0.55; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.globalAlpha = d.alpha;
      }
      // 舰艏浪
      if (tactical && d.s.moving && (d.s.speedKn ?? 0) > 8) {
        const bx = d.L / 2, sp = clamp(((d.s.speedKn ?? 0) - 6) / 22, 0.2, 1);
        ctx.strokeStyle = `rgba(255,255,252,${0.75 * sp})`; ctx.lineWidth = Math.max(1, d.W * 0.14); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx + 0.5, 0); ctx.quadraticCurveTo(bx - d.L * 0.06, d.W * 0.6, bx - d.L * 0.16, d.W * (0.75 + 0.3 * sp));
        ctx.moveTo(bx + 0.5, 0); ctx.quadraticCurveTo(bx - d.L * 0.06, -d.W * 0.6, bx - d.L * 0.16, -d.W * (0.75 + 0.3 * sp));
        ctx.stroke();
      }
      // 选中：琥珀色光晕
      if (sel) {
        traceHull(ctx, rec.lay.hull, d.L, d.W, 1 + 7 / d.L, 1 + 7 / d.W);
        ctx.strokeStyle = 'rgba(242,178,51,.95)'; ctx.lineWidth = 2.6; ctx.stroke();
      } else if (this.hover === rec.u.id) {
        traceHull(ctx, rec.lay.hull, d.L, d.W, 1 + 5 / d.L, 1 + 5 / d.W);
        ctx.strokeStyle = 'rgba(255,250,232,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
      }
      const train = this.trainer(d, engs);
      drawShip(ctx, rec.lay, { L: d.L, W: d.W, pal: rec.pal, detail: d.detail, gunsOut: d.dmg?.gunsOut ?? null, train });
      // 横倾 / 起火时舰体发暗
      if (d.dmg && d.dmg.integrity < 0.6) {
        traceHull(ctx, rec.lay.hull, d.L, d.W);
        ctx.fillStyle = `rgba(30,20,10,${(0.6 - d.dmg.integrity) * 0.5})`; ctx.fill();
      }
      if (sel) { // 瞄准框角
        const hx = d.L / 2 + 7, hy = d.W / 2 + 7, a = Math.min(7, hy);
        ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; ctx.lineCap = 'square';
        ctx.beginPath();
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { ctx.moveTo(sx * hx - sx * a, sy * hy); ctx.lineTo(sx * hx, sy * hy); ctx.lineTo(sx * hx, sy * hy - sy * a); }
        ctx.stroke();
      }
      ctx.restore();
      // 航速矢量
      if (tactical && d.s.moving && (d.s.speedKn ?? 0) > 1) {
        const len = clamp((d.s.speedKn ?? 0) * 1.1, 6, 38), bx = d.x + c * d.L / 2, by = d.y + s * d.L / 2;
        ctx.save(); ctx.globalAlpha = d.alpha * 0.6; ctx.strokeStyle = rec.dark; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + c * 3, by + s * 3); ctx.lineTo(bx + c * (3 + len), by + s * (3 + len));
        ctx.moveTo(bx + c * (3 + len) - s * 2.5, by + s * (3 + len) + c * 2.5); ctx.lineTo(bx + c * (3 + len) + s * 2.5, by + s * (3 + len) - c * 2.5);
        ctx.stroke(); ctx.restore();
      }
      this.st.ships++;
    }
    // 标签：选中 → 主力舰 → 其余；商船放不下就省略
    const lorder = [...order].sort((a, b) => (b.rec.u.id === this.selected ? 1 : 0) - (a.rec.u.id === this.selected ? 1 : 0) || a.rec.prio - b.rec.prio);
    for (const d of lorder) {
      if (d.alpha < 0.3) continue;
      const rec = d.rec;
      const sub = tactical && d.s.courseDeg !== undefined ? `${String(Math.round(d.s.courseDeg) % 360).padStart(3, '0')}° · ${Math.round(d.s.speedKn ?? 0)} 节` : undefined;
      const name = /^[\x20-\x7e]+$/.test(rec.label) ? rec.label.toUpperCase() : rec.label;
      const font = `${rec.civil ? 400 : 600} ${rec.civil ? 10.5 : 11.5}px ${FONT_HEAD}`;
      const w = Math.max(this.textW(name, font), sub ? this.textW(sub, `9.5px ${FONT_TYPE}`) : 0) + 4, h = sub ? 25 : 13;
      const [hx, hy] = this.halfExtent(d);
      const cands: [number, number][] = [[d.x - w / 2, d.y + hy + 3], [d.x - w / 2, d.y - hy - 3 - h], [d.x + hx + 4, d.y - h / 2], [d.x - hx - 4 - w, d.y - h / 2], [d.x + hx + 2, d.y + hy], [d.x - hx - w - 2, d.y - hy - h]];
      let pick: [number, number] | null = null;
      for (const cnd of cands) if (!this.collides(cnd[0], cnd[1], w, h)) { pick = cnd; break; }
      if (!pick) { if (rec.civil && rec.u.id !== this.selected) continue; pick = cands[0]; }
      this.occ.push(pick[0], pick[1], w, h);
      this.label(pick[0] + 2, pick[1], w, h, name, font, rec.dark, 'left', d.alpha, null, sub, `9.5px ${FONT_TYPE}`, 'rgba(60,48,30,.85)');
    }
  }

  /** 屏幕上的半包围盒 */
  private halfExtent(d: Drawn): [number, number] {
    const c = Math.abs(Math.cos(d.ang)), s = Math.abs(Math.sin(d.ang));
    return [c * d.L / 2 + s * d.W / 2, s * d.L / 2 + c * d.W / 2];
  }

  /** 炮塔回旋：正在射击的武器指向目标（盲区夹在射界边缘） */
  private trainer(d: Drawn, engs: Engagement[]): ((t: LTurret) => number | null) | null {
    if (d.detail === 0) return null;
    const mine = engs.filter((e) => e.shooter.id === d.rec.u.id);
    if (!mine.length) return null;
    return (tr: LTurret) => {
      const e = mine.find((x) => x.fire.weapon === tr.id) ?? (tr.small ? mine.find((x) => x.weapon?.kind === 'secondary') : mine.find((x) => !x.weapon || x.weapon.kind === 'main' || x.fire.weapon === 'main'));
      if (!e) return null;
      const tg = this.byId.get(e.target.id);
      if (!tg) return null;
      let rel = Math.atan2(tg.y - d.y, tg.x - d.x) - d.ang;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (tr.small) { // 副炮只能射向本舷
        if (tr.y > 0) rel = clamp(rel, 0.15, Math.PI - 0.15); else rel = clamp(rel, -Math.PI + 0.15, -0.15);
        return rel;
      }
      const lim = (150 * Math.PI) / 180;
      if (!tr.aft) return clamp(rel, -lim, lim);
      const back = Math.atan2(Math.sin(rel - Math.PI), Math.cos(rel - Math.PI));
      return Math.PI + clamp(back, -lim, lim);
    };
  }

  // ---------- 尾迹 ----------
  private wakeX = new Float32Array(40);
  private wakeY = new Float32Array(40);
  private drawWake(d: Drawn, t: number) {
    if (!d.on || !d.s.moving || (d.s.speedKn ?? 0) < 1.5) return;
    const map = this.map, v = map.view, ctx = this.ctx;
    const pxPerKm = v.k / KM;
    const vPx = (d.s.speedKn ?? 0) * 1.852 * pxPerKm; // 像素 / 叙事小时
    // 至少 wakeMin 分钟，且屏幕上不短于 2.4 个舰长（大洋缩放、快速播放时仍可见）
    const wakeH = clamp(Math.max(this.cfg.wakeMin / 60, (d.L * 2.4) / Math.max(1e-6, vPx)), 0.05, 36);
    const N = 18, h0 = Math.max(t - wakeH, d.rec.u.fromH, d.rec.u.track[0]?.h ?? -1e9);
    if (t - h0 < 1e-4) return;
    const xs = this.wakeX, ys = this.wakeY;
    let m = 0;
    const dxs = d.x - d.ax, dys = d.y - d.ay; // 松弛偏移随尾迹平移
    for (let i = 0; i <= N; i++) {
      const h = t - ((t - h0) * i) / N;
      const s = i === 0 ? d.s : trackAt(d.rec.u.track, h);
      if (!s) break;
      const [wx, wy] = project(s.ll);
      xs[m] = v.x + wx * v.k + dxs; ys[m] = v.y + wy * v.k + dys; m++;
    }
    if (m < 2) return;
    // 从舰艉开始
    const c = Math.cos(d.ang), s = Math.sin(d.ang);
    const sx = d.x - c * d.L * 0.47, sy = d.y - s * d.L * 0.47;
    let start = 1, acc = 0;
    while (start < m - 1) { acc = Math.hypot(xs[start] - d.x, ys[start] - d.y); if (acc > d.L * 0.47) break; start++; }
    xs[start - 1] = sx; ys[start - 1] = sy;
    const pts = m - start + 1;
    if (pts < 2) return;
    const off = start - 1;
    const tail = m - 1;
    const total = Math.hypot(xs[tail] - sx, ys[tail] - sy);
    if (total < 4) return;
    const grad = ctx.createLinearGradient(sx, sy, xs[tail], ys[tail]);
    const sp = clamp((d.s.speedKn ?? 0) / 25, 0.35, 1);
    grad.addColorStop(0, `rgba(255,255,253,${0.82 * d.alpha})`);
    grad.addColorStop(0.35, `rgba(252,252,248,${0.45 * d.alpha * sp})`);
    grad.addColorStop(1, 'rgba(250,250,245,0)');
    const left: number[] = [], right: number[] = [];
    for (let i = off; i <= tail; i++) {
      const u = (i - off) / Math.max(1, tail - off);
      const ia = Math.max(off, i - 1), ib = Math.min(tail, i + 1);
      let nx = -(ys[ib] - ys[ia]), ny = xs[ib] - xs[ia];
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const hw = d.W * (0.28 + 0.95 * u * sp) + 0.6;
      left.push(xs[i] + nx * hw, ys[i] + ny * hw); right.push(xs[i] - nx * hw, ys[i] - ny * hw);
    }
    ctx.beginPath();
    ctx.moveTo(left[0], left[1]);
    for (let i = 2; i < left.length; i += 2) ctx.lineTo(left[i], left[i + 1]);
    for (let i = right.length - 2; i >= 0; i -= 2) ctx.lineTo(right[i], right[i + 1]);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // 中心翻滚的白浪
    ctx.beginPath(); ctx.moveTo(xs[off], ys[off]);
    for (let i = off + 1; i <= tail; i++) ctx.lineTo(xs[i], ys[i]);
    ctx.strokeStyle = grad; ctx.lineWidth = Math.max(1, d.W * 0.32); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  // ---------- 航迹图 ----------
  /** 全航迹的世界坐标折线（按航段长度自适应细分，缓存） */
  private polyOf(rec: ShipRec): Poly {
    if (rec.poly) return rec.poly;
    const tr = rec.u.track;
    const hs: number[] = [], xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < tr.length; i++) {
      const a = tr[i], b = tr[i + 1];
      const pa = project(a.ll);
      hs.push(a.h); xs.push(pa[0]); ys.push(pa[1]);
      if (!b || b.h <= a.h) continue;
      const pb = project(b.ll);
      const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      let n = clamp(Math.ceil(len / 0.5), 1, 40);
      if (a.course !== undefined && b.course !== undefined) { const dc = Math.abs(((b.course - a.course + 540) % 360) - 180); if (dc > 15) n = Math.max(n, 10); }
      if (!a.curve) n = 1;
      for (let j = 1; j < n; j++) {
        const h = a.h + ((b.h - a.h) * j) / n;
        const s = trackAt(tr, h);
        if (!s) continue;
        const p = project(s.ll);
        hs.push(h); xs.push(p[0]); ys.push(p[1]);
      }
    }
    const segments = xs.slice(1).map((_, j) => ({ value: j, bounds: [Math.min(xs[j],xs[j+1]),Math.min(ys[j],ys[j+1]),Math.max(xs[j],xs[j+1]),Math.max(ys[j],ys[j+1])] as Bounds }));
    rec.poly = { h: Float64Array.from(hs), x: Float32Array.from(xs), y: Float32Array.from(ys), n: hs.length, index: new SpatialIndex(segments) };
    return rec.poly;
  }
  /** 折线上 h 时刻的世界坐标（线性插值） */
  private polyAt(p: Poly, h: number): [number, number, number] {
    let lo = 0, hi = p.n - 1;
    if (h <= p.h[0]) return [p.x[0], p.y[0], 0];
    if (h >= p.h[hi]) return [p.x[hi], p.y[hi], hi];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (p.h[mid] <= h) lo = mid; else hi = mid; }
    const u = (h - p.h[lo]) / Math.max(1e-9, p.h[hi] - p.h[lo]);
    return [p.x[lo] + (p.x[hi] - p.x[lo]) * u, p.y[lo] + (p.y[hi] - p.y[lo]) * u, lo];
  }

  private drawTracks(t: number, relK: number) {
    const map = this.map, v = map.view, ctx = this.ctx;
    const tactical = relK >= this.cfg.tacticalZoom;
    const pad = 60;
    const bx0 = (-pad - v.x) / v.k, by0 = (-pad - v.y) / v.k, bx1 = (map.width + pad - v.x) / v.k, by1 = (map.height + pad - v.y) / v.k;
    const tickLabels: { x: number; y: number; nx: number; ny: number; text: string; col: string; alpha: number }[] = [];
    for (let i = 0; i < this.nDrawn; i++) {
      const d = this.drawn[i], rec = d.rec;
      const sel = rec.u.id === this.selected;
      if (!this.layers.tracks && !sel) continue;
      if (rec.u.track.length < 2) continue;
      const p = this.polyOf(rec);
      const alpha = d.alpha * (sel ? 1 : 0.85);
      // 过去航迹
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = rec.main; ctx.lineWidth = sel ? 1.7 : 1.15; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      const bounds: Bounds = [bx0,by0,bx1,by1];
      const end = upperBound(p.h, t);
      const visible = p.index.query(bounds);
      let penX = NaN, penY = NaN;
      const line = (x0: number,y0: number,x1: number,y1: number) => {
        const clipped = clipSegment(x0,y0,x1,y1,bounds);
        if (!clipped) return;
        const sx=v.x+clipped[0]*v.k,sy=v.y+clipped[1]*v.k;
        if(Math.abs(sx-penX)>0.01 || Math.abs(sy-penY)>0.01 || !Number.isFinite(penX))ctx.moveTo(sx,sy);
        penX=v.x+clipped[2]*v.k;penY=v.y+clipped[3]*v.k;ctx.lineTo(penX,penY);
      };
      for (const j of visible) if (j+1 < end) line(p.x[j],p.y[j],p.x[j+1],p.y[j+1]);
      if (end > 0) line(p.x[end-1],p.y[end-1],d.wx,d.wy);
      ctx.stroke();
      this.st.tracks++;
      // 选中舰：未来航迹（淡虚线）
      if (sel) {
        ctx.setLineDash([3, 4]); ctx.globalAlpha = alpha * 0.5; ctx.lineWidth = 1.2;
        ctx.beginPath(); penX=penY=NaN;
        if (end < p.n) line(d.wx,d.wy,p.x[end],p.y[end]);
        for (const j of visible) if (j >= end) line(p.x[j],p.y[j],p.x[j+1],p.y[j+1]);
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      // 时刻刻度
      if (!this.layers.tracks && !sel) continue;
      const t0 = Math.max(p.h[0], rec.u.fromH);
      if (t - t0 < 1e-3) continue;
      // 平均屏幕速度（像素 / 小时）决定刻度疏密
      const [ex, ey] = this.polyAt(p, Math.max(t0, t - 1));
      const pxH = Math.hypot(d.ax - (v.x + ex * v.k), d.ay - (v.y + ey * v.k)) / Math.min(1, t - t0) || 0;
      const steps = tactical ? [this.cfg.trackTicks, 15, 20, 30, 60, 120, 180, 360, 720, 1440].filter((m) => m >= this.cfg.trackTicks) : [this.cfg.fleetTicks * 60, 2880, 4320, 7200, 10080].filter((m) => m >= this.cfg.fleetTicks * 60);
      const tickMin = steps.find((m) => (pxH * m) / 60 >= 9);
      if (!tickMin) continue;
      const lblMin = steps.find((m) => m >= tickMin && (pxH * m) / 60 >= 54) ?? 0;
      const stepH = tickMin / 60;
      const noon = (tactical ? 0 : 12) - this.epochOff; // 大洋缩放：正午船位（航海日志惯例）
      const ticks = new Set<number>();
      const firstTick = Math.ceil((t0-noon)/stepH-1e-9)*stepH+noon;
      const lastTick = firstTick + 599*stepH; // Preserve the existing historical tick window.
      for (const j of visible) {
        const from = Math.max(t0, p.h[j]), to = Math.min(t,p.h[j+1],lastTick);
        for (let tk = Math.ceil((from-noon)/stepH-1e-9)*stepH+noon; tk <= to+1e-9; tk += stepH) ticks.add(tk);
      }
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = rec.dark; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const tk of [...ticks].sort((a,b)=>a-b)) {
        const [wx, wy] = this.polyAt(p, tk);
        if (wx < bx0 || wx > bx1 || wy < by0 || wy > by1) continue;
        const [wx2, wy2] = this.polyAt(p, tk + 0.02);
        const [wx1, wy1] = this.polyAt(p, tk - 0.02);
        let nx = -(wy2 - wy1), ny = wx2 - wx1;
        const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        const sx = v.x + wx * v.k, sy = v.y + wy * v.k;
        const minutes = Math.round((tk - noon) * 60);
        const labelled = lblMin > 0 && minutes % lblMin === 0;
        const len = labelled ? 4.5 : 3;
        ctx.moveTo(sx - nx * len, sy - ny * len); ctx.lineTo(sx + nx * len, sy + ny * len);
        if (labelled) tickLabels.push({ x: sx, y: sy, nx, ny, text: tactical ? hhmm(tk) : mday(tk), col: rec.dark, alpha });
      }
      ctx.stroke();
      ctx.restore();
    }
    // 刻度标注（与舰名、射击线标签避让）：先排下，等标签统一绘制
    this.pendingTicks = tickLabels;
  }
  /** 纪元在当日的小时数（刻度对齐到整点 / 正午） */
  private epochOff = (() => { const d = hoursToDate(0); return d.getUTCHours() + d.getUTCMinutes() / 60; })();
  private pendingTicks: { x: number; y: number; nx: number; ny: number; text: string; col: string; alpha: number }[] = [];

  // ---------- 鱼雷 ----------
  private drawTorpedoes(t: number) {
    const tracks = torpedoesAt(this.db.naval, this.db.units, t);
    if (!tracks.length) return;
    const ctx = this.ctx, map = this.map;
    ctx.save();
    for (const tr of tracks) {
      const end = tr.launch.h + tr.launch.runH;
      const alpha = tr.done ? clamp(1 - (t - end) / 0.25, 0, 1) : 1;
      if (alpha <= 0.01) continue;
      const [x0, y0] = map.llToScreen(tr.from), [x1, y1] = map.llToScreen(tr.to);
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 0.5) continue;
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      ctx.globalAlpha = alpha * 0.8;
      ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(28,40,52,.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
      // 气泡：越靠近雷头越密
      const seed = tr.launch.id;
      for (let s = 6, i = 0; s < len; s += 5 + hash01(seed, i) * 4, i++) {
        const fade = clamp(1 - (len - s) / 140, 0.15, 1);
        const j = (hash01(seed, i + 99) - 0.5) * 3;
        ctx.globalAlpha = alpha * fade * 0.9;
        ctx.beginPath(); ctx.arc(x0 + ux * s - uy * j, y0 + uy * s + ux * j, 0.7 + hash01(seed, i + 7) * 0.8, 0, TAU);
        ctx.fillStyle = '#fbfaf4'; ctx.fill(); ctx.strokeStyle = 'rgba(40,52,62,.5)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      if (!tr.done) { // 雷头
        ctx.globalAlpha = alpha;
        ctx.save(); ctx.translate(x1, y1); ctx.rotate(Math.atan2(uy, ux));
        ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 1.3, 0, 0, TAU);
        ctx.fillStyle = '#fdfcf6'; ctx.fill(); ctx.strokeStyle = 'rgba(20,30,40,.9)'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.restore();
      }
      this.st.torpedoes++;
    }
    ctx.restore();
  }

  // ---------- 烟幕 ----------
  private drawSmokeScreens(t: number) {
    const groups = smokeAt(this.db.naval, this.db.units, t);
    if (!groups.length) return;
    const ctx = this.ctx, v = this.map.view, map = this.map;
    const kmPx = v.k / KM;
    ctx.save();
    for (const g of groups) {
      const dark = g.smoke.kind === 'funnel';
      const img = dark ? this.sp.smokeDark : this.sp.smokeLight;
      let i = 0;
      for (const p of g.puffs) {
        const [x, y] = map.llToScreen(p.ll);
        const r = Math.max(5 + p.ageH * 6, (p.widthKm / 2) * kmPx) * (0.85 + hash01(g.smoke.id, i) * 0.35);
        i++;
        if (x < -r || y < -r || x > map.width + r || y > map.height + r) continue;
        // 底部阴影，让白烟在浅色海面上可见
        ctx.globalAlpha = p.alpha * 0.22;
        ctx.drawImage(this.sp.smokeBrown, x - r * 1.05 + r * 0.12, y - r * 1.05 + r * 0.16, r * 2.1, r * 2.1);
        ctx.globalAlpha = p.alpha * (dark ? 0.55 : 0.78);
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
        this.st.smoke++;
      }
    }
    ctx.restore();
  }

  // ---------- 射程圈 ----------
  private drawRanges() {
    const d = this.byId.get(this.selected!);
    if (!d) return;
    const ws = (d.rec.u.ship?.weapons ?? []).filter((w) => w.rangeKm && w.rangeKm > 0);
    if (!ws.length) return;
    const ranges = new Map<number, typeof ws[number]>();
    for (const w of ws.sort((a, b) => (a.kind === 'main' ? 0 : 1) - (b.kind === 'main' ? 0 : 1))) if (!ranges.has(w.rangeKm!)) ranges.set(w.rangeKm!, w);
    const ctx = this.ctx, map = this.map;
    ctx.save();
    let k = 0;
    for (const [km, w] of [...ranges.entries()].sort((a, b) => b[0] - a[0])) {
      ctx.beginPath();
      let top: [number, number] = [0, 0], rpx = 0;
      for (let b = 0; b <= 360; b += 5) {
        const [x, y] = map.llToScreen(destination(d.s.ll, b, km));
        if (b === 0) { ctx.moveTo(x, y); rpx = Math.hypot(x - d.ax, y - d.ay); } else ctx.lineTo(x, y);
        if (b === 330 - k * 25) top = [x, y];
      }
      if (rpx < 14) continue;
      ctx.globalAlpha = d.alpha * 0.85;
      ctx.setLineDash([8, 5]); ctx.strokeStyle = d.rec.dark; ctx.lineWidth = 1.1; ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = d.alpha * 0.05; ctx.fillStyle = d.rec.main; ctx.fill();
      const text = `${calLabel(w)} ${WEAPON_KIND_ZH[w.kind]} ${km} km`;
      const font = `10.5px ${FONT_TYPE}`, tw = this.textW(text, font) + 8;
      this.occ.push(top[0] - tw / 2, top[1] - 8, tw, 15);
      this.label(top[0] - tw / 2 + 4, top[1] - 7, tw, 14, text, font, d.rec.dark, 'left', d.alpha, 'rgba(250,245,231,.88)');
      k++;
    }
    ctx.restore();
  }

  // ---------- 射击线（暂停时） ----------
  private drawFireLines(engs: Engagement[]) {
    const ctx = this.ctx, map = this.map;
    const pairs = new Map<string, { a: Drawn; b: Drawn; es: Engagement[] }>();
    for (const e of engs) {
      const a = this.byId.get(e.shooter.id), b = this.byId.get(e.target.id);
      if (!a || !b || (!a.on && !b.on)) continue;
      if (e.weapon?.kind === 'torpedo') continue;
      const key = a.rec.u.id + '>' + b.rec.u.id;
      const p = pairs.get(key);
      if (p) p.es.push(e); else pairs.set(key, { a, b, es: [e] });
    }
    ctx.save();
    for (const { a, b, es } of pairs.values()) {
      let dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < (a.L + b.L) * 0.4 + 8) continue;
      dx /= len; dy /= len;
      const side = a.rec.u.id < b.rec.u.id ? 1 : -1, off = 3.5 * side;
      const nx = -dy * off, ny = dx * off;
      const x0 = a.x + dx * a.L * 0.32 + nx, y0 = a.y + dy * a.L * 0.32 + ny;
      const x1 = b.x - dx * (b.L * 0.38 + 5) + nx, y1 = b.y - dy * (b.L * 0.38 + 5) + ny;
      const col = a.rec.shell;
      const alpha = this.fireAlpha * Math.min(a.alpha, b.alpha);
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.setLineDash([7, 4]);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
      // 箭头
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x1 + dx * 5, y1 + dy * 5); ctx.lineTo(x1 - dx * 4 - dy * 3.6, y1 - dy * 4 + dx * 3.6); ctx.lineTo(x1 - dx * 4 + dy * 3.6, y1 - dy * 4 - dx * 3.6); ctx.closePath(); ctx.fill();
      // 标注：武器与距离
      const cals = [...new Set(es.map((e) => calLabel(e.weapon ?? undefined) || e.fire.weapon))].join(' / ');
      const text = `${cals} · ${rangeLabel(es[0].km, this.cfg.rangeUnit)}`;
      const font = `10px ${FONT_TYPE}`, tw = this.textW(text, font) + 8, th = 14;
      let placed = false;
      for (const f of [0.42, 0.3, 0.55, 0.22, 0.66]) {
        for (const sgn of [side, -side]) {
          const mx = x0 + (x1 - x0) * f - dy * 10 * sgn, my = y0 + (y1 - y0) * f + dx * 10 * sgn;
          const lx = mx - tw / 2, ly = my - th / 2;
          if (this.collides(lx, ly, tw, th)) continue;
          this.occ.push(lx, ly, tw, th);
          this.label(lx + 4, ly, tw, th, text, font, a.rec.dark, 'left', alpha, 'rgba(250,245,231,.86)');
          placed = true; break;
        }
        if (placed) break;
      }
      this.st.fireLines++;
    }
    ctx.restore();
  }

  // ---------- 残骸 ----------
  private drawWrecks(t: number) {
    const ctx = this.ctx, map = this.map;
    for (const rec of this.ships) {
      const tm = rec.term;
      if (!tm || t < tm.h || !tm.label) continue;
      if (tm.status !== 'destroyed') continue;
      const a = clamp((t - tm.h) / tm.fadeH, 0, 1);
      if (a <= 0.02) continue;
      const [x, y] = map.llToScreen(tm.ll);
      if (x < -40 || y < -40 || x > map.width + 40 || y > map.height + 40) continue;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      // 海图沉船符号：虚线椭圆 + 带三道横档的船体线
      ctx.setLineDash([1.6, 2.2]); ctx.strokeStyle = 'rgba(40,30,20,.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, 12, 7, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
      for (const dx of [-4, 0, 4]) { ctx.moveTo(x + dx, y - 3.2); ctx.lineTo(x + dx, y + 3.2); }
      ctx.stroke();
      ctx.restore();
      const text = `${rec.label} ${tm.label} ${mday(tm.h)}`;
      const font = `12px ${FONT_HAND}`, tw = this.textW(text, font) + 4;
      if (!this.collides(x - tw / 2, y + 9, tw, 14)) { this.occ.push(x - tw / 2, y + 9, tw, 14); this.label(x - tw / 2 + 2, y + 9, tw, 14, text, font, '#5a1418', 'left', a, null); }
      this.st.wrecks++;
    }
  }

  // ---------- 起火 ----------
  private drawBurning(d: Drawn, t: number) {
    if (!d.on || !d.dmg) return;
    const recent = d.dmg.hits.length ? t - d.dmg.hits[d.dmg.hits.length - 1].h : 1e9;
    const fire = d.dmg.fire || (recent < 0.12 && d.dmg.hits[d.dmg.hits.length - 1].severity <= 2);
    if (!fire) return;
    const ctx = this.ctx;
    const c = Math.cos(d.ang), s = Math.sin(d.ang);
    // 火点：最近一次命中部位（解析不到时在舯部偏前）
    const f = hitFrac(d.dmg.hits[d.dmg.hits.length - 1], d.rec.lay);
    const ox = d.x + c * (0.5 - f) * d.L, oy = d.y + s * (0.5 - f) * d.L;
    // 下风方向：屏幕左上（若有漂移烟幕则沿用其风向）
    const wind = this.windAngle();
    const wx = Math.cos(wind), wy = Math.sin(wind);
    const len = clamp(d.L * 1.6, 22, 150), N = 10;
    const ph = this.fxClock / 2600;
    ctx.save();
    for (let i = 0; i < N; i++) {
      const p = (ph + i / N + hash01(d.rec.u.id, i) * 0.05) % 1;
      const r = d.W * 0.45 + p * (d.L * 0.38 + 6);
      const curl = Math.sin(p * 5 + i) * p * d.W * 0.8;
      const x = ox + wx * p * len - wy * curl, y = oy + wy * p * len + wx * curl;
      ctx.globalAlpha = d.alpha * 0.5 * (1 - p) * Math.min(1, p * 6 + 0.25);
      ctx.drawImage(this.sp.smokeDark, x - r, y - r, r * 2, r * 2);
      this.st.smoke++;
    }
    const fl = 0.75 + 0.25 * Math.sin(this.fxClock / 90 + hash01(d.rec.u.id) * 6);
    const fr = Math.max(3, d.W * 0.7) * fl;
    ctx.globalAlpha = d.alpha * 0.9;
    ctx.drawImage(this.sp.fire, ox - fr, oy - fr, fr * 2, fr * 2);
    ctx.restore();
  }
  private windAngle(): number {
    const sm = this.db.naval.smoke.find((s) => s.driftDeg !== undefined);
    if (sm) { const r = (sm.driftDeg! * Math.PI) / 180; return Math.atan2(-Math.cos(r), Math.sin(r)); }
    return (-140 * Math.PI) / 180; // 缺省：向屏幕左上飘
  }

  // ---------- 炮火特效 ----------
  private alloc(): Fx {
    return this.pool.pop() ?? { kind: K.Flash, t0: 0, life: 0, wx: 0, wy: 0, vx: 0, vy: 0, size: 0, ang: 0, seed: 0, target: '', ox: 0, oy: 0, n: 0, col: '', cal: 0, shooter: '', tx: 0, ty: 0 };
  }
  private push(kind: K, t0: number, life: number, wx: number, wy: number, size: number, ang = 0, vx = 0, vy = 0, seed = 0): Fx {
    const f = this.alloc();
    f.kind = kind; f.t0 = t0; f.life = life; f.wx = wx; f.wy = wy; f.size = size; f.ang = ang; f.vx = vx; f.vy = vy; f.seed = seed;
    f.target = ''; f.shooter = ''; f.n = 0; f.ox = 0; f.oy = 0; f.col = ''; f.cal = 0; f.tx = 0; f.ty = 0;
    if (this.fx.length > 900) { const old = this.fx.shift()!; this.pool.push(old); }
    this.fx.push(f);
    return f;
  }

  /** (prevT, t] 内的齐射与命中（确定性：齐射时刻只取决于射击时段、口径与画面密度上限） */
  private spawn(prevT: number, t: number, now: number, R: number) {
    const nav = this.db.naval;
    if (!nav.fire.length && !nav.hits.length) return;
    const engs = engagementsAt(nav, this.db.units, t);
    const perShooter = new Map<string, number>();
    for (const e of engs) perShooter.set(e.shooter.id, (perShooter.get(e.shooter.id) ?? 0) + 1);
    const map = this.map;
    let fired = 0;
    for (const e of engs) {
      if (e.weapon?.kind === 'torpedo') continue;
      const a = this.byId.get(e.shooter.id), b = this.byId.get(e.target.id);
      if (!a || !b || (!a.on && !b.on)) continue;
      // 画面密度：每艘射击舰每墙钟秒 ≤ 1.5 次齐射
      const minIv = (R * (perShooter.get(e.shooter.id) ?? 1)) / 1.5; // 叙事小时
      const nat = (e.fire.salvoSec ?? defaultSalvoSec(e.calMm)) / 3600;
      const iv = Math.max(nat, minIv);
      const phase = hash01(e.fire.id) * iv;
      for (const sv of salvosBetween(e.fire, e.calMm, prevT - phase, t - phase, minIv)) { this.salvo(e, a, b, sv.k, now); fired++; }
    }
    if (fired) {
      const vis = Math.min(1, map.relK / Math.max(1, this.cfg.tacticalZoom));
      audio.play('ship_gun', { volume: 0.12 + 0.18 * vis, throttleMs: 420 });
    }
    const hs = hitsBetween(nav, prevT, t);
    for (const h of hs) this.hit(h, now);
    if (hs.length) audio.play('explosion', { volume: 0.4, throttleMs: 600 });
  }

  private salvo(e: Engagement, a: Drawn, b: Drawn, k: number, now: number) {
    const v = this.map.view, id = e.fire.id;
    // 开火的炮塔：fire.weapon 对应的炮塔；副炮组取朝向目标一舷
    const tgtAng = Math.atan2(b.y - a.y, b.x - a.x);
    const rel = Math.atan2(Math.sin(tgtAng - a.ang), Math.cos(tgtAng - a.ang));
    const lay = a.rec.lay;
    let cands = lay.turrets.filter((tr) => tr.id && tr.id === e.fire.weapon);
    if (!cands.length) cands = lay.turrets.filter((tr) => (e.weapon?.kind === 'secondary' ? tr.small : !tr.small));
    if (cands.some((tr) => tr.small)) { const facing = cands.filter((tr) => (rel > 0 ? tr.y > 0 : tr.y < 0)); if (facing.length) cands = facing; }
    if (!cands.length) cands = lay.turrets.length ? [lay.turrets[0]] : [];
    const tr = cands.length ? cands[Math.floor(hash01(id, k * 13) * cands.length)] : null;
    const c = Math.cos(a.ang), s = Math.sin(a.ang);
    const lx = (tr ? tr.x : 0.2) * a.L, ly = (tr ? tr.y : 0) * a.W;
    let mx = a.x + c * lx - s * ly, my = a.y + s * lx + c * ly;
    // 炮口在炮管末端，朝向目标
    const reach = tr ? Math.max(4, tr.barrel * a.L + a.W * 0.35) : a.W;
    mx += Math.cos(tgtAng) * reach; my += Math.sin(tgtAng) * reach;
    const wx = (mx - v.x) / v.k, wy = (my - v.y) / v.k;
    const cal = e.calMm;
    const zs = clamp(a.L / 34, 0.55, 2.2);
    this.push(K.Flash, now, 230, wx, wy, (5 + Math.pow(cal / 280, 0.7) * 8) * zs, tgtAng, 0, 0, hash01(id, k));
    this.push(K.Cordite, now + 60, 1300, wx, wy, (4 + cal / 60) * zs, tgtAng, 0, 0, hash01(id, k + 5));
    // 炮弹（一次齐射一组曳光）
    const dur = (500 + 900 * clamp(e.km / 25, 0, 1)) * (0.92 + hash01(id, k * 3) * 0.16);
    const sh = this.push(K.Shell, now, dur, wx, wy, Math.min(3, tr ? tr.n : 2), tgtAng);
    sh.target = e.target.id; sh.shooter = e.shooter.id; sh.cal = cal; sh.col = a.rec.shell; sh.seed = k;
    sh.n = 2 + Math.floor(hash01(id, k * 7 + 1) * 2); // 2–3 道水柱
    // 散布：沿射线方向更长（远弹 / 近弹），偶尔跨射
    const kmPx = v.k / KM;
    const along = Math.max(b.L * 0.95, (0.15 + e.km * 0.014) * kmPx), across = Math.max(b.W * 1.4, 0.1 * kmPx);
    sh.ox = along; sh.oy = across; sh.tx = hash01(id, k * 11 + 3) < 0.2 ? 1 : 0; // 1 = 跨射
    sh.vx = hash01(id, k * 17); sh.vy = 0;
  }

  private landed(sh: Fx, now: number) {
    const b = this.byId.get(sh.target);
    if (!b) return;
    const v = this.map.view;
    const ang = sh.ang;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const zs = clamp(b.L / 34, 0.55, 2.2);
    const r0 = (2.6 + Math.pow(sh.cal / 280, 0.8) * 5.2) * zs;
    for (let j = 0; j < sh.n; j++) {
      const h1 = hash01(sh.target + sh.shooter, sh.seed * 31 + j), h2 = hash01(sh.shooter, sh.seed * 37 + j * 5);
      let al = (h1 - 0.5) * 2 * sh.ox;
      if (sh.tx) al = (j % 2 ? 1 : -1) * (0.45 + h1 * 0.5) * sh.ox; // 跨射：一远一近
      else if (Math.abs(al) < b.L * 0.4) al += Math.sign(al || 1) * b.L * 0.4; // 不落在舰体上
      const ac = (h2 - 0.5) * 2 * sh.oy;
      const sx = b.x + ca * al - sa * ac, sy = b.y + sa * al + ca * ac;
      this.push(K.Splash, now + j * 70, 1500 + h2 * 300, (sx - v.x) / v.k, (sy - v.y) / v.k, r0 * (0.8 + h1 * 0.4), ang, 0, 0, h2);
    }
  }

  private hit(h: RHit, now: number) {
    const b = this.byId.get(h.target);
    if (!b || !b.on) return;
    const v = this.map.view;
    const f = hitFrac(h, b.rec.lay), c = Math.cos(b.ang), s = Math.sin(b.ang);
    const x = b.x + c * (0.5 - f) * b.L, y = b.y + s * (0.5 - f) * b.L;
    const wx = (x - v.x) / v.k, wy = (y - v.y) / v.k;
    const zs = clamp(b.L / 34, 0.6, 2.2) * (h.severity === 1 ? 1.35 : h.severity === 2 ? 1.05 : 0.8);
    this.push(K.HitFlash, now, 520, wx, wy, 15 * zs, 0, 0, 0, hash01(h.id));
    this.push(K.HitFlash, now + 140, 380, wx, wy, 9 * zs, 0, 0, 0, hash01(h.id, 2));
    for (let i = 0; i < 9; i++) {
      const a = hash01(h.id, i + 10) * TAU, sp = (0.03 + hash01(h.id, i + 30) * 0.05) * zs;
      this.push(K.Spark, now, 650 + hash01(h.id, i) * 300, wx, wy, 1.4 + hash01(h.id, i + 50), 0, Math.cos(a) * sp, Math.sin(a) * sp);
    }
    for (let i = 0; i < 5; i++) this.push(K.HitSmoke, now + 80 + i * 110, 3200 + i * 300, wx, wy, (7 + i * 2) * zs, 0, 0, 0, hash01(h.id, i + 70));
  }

  /** layer 0：水柱（舰船之下）；layer 1：闪光、碎片、黑烟、炮弹 */
  private drawFx(now: number, layer: 0 | 1) {
    const ctx = this.ctx, v = this.map.view;
    const wind = this.windAngle(), wdx = Math.cos(wind), wdy = Math.sin(wind);
    let w = 0;
    const n0 = this.fx.length;
    ctx.save();
    for (let i = 0; i < n0; i++) {
      const f = this.fx[i];
      const age = now - f.t0;
      if (age > f.life) {
        if (layer === 1) { if (f.kind === K.Shell) this.landed(f, now); this.pool.push(f); }
        continue;
      }
      if (layer === 1) this.fx[w++] = f;
      if (age < 0) continue;
      const u = age / f.life;
      const x = v.x + f.wx * v.k, y = v.y + f.wy * v.k;
      if (layer === 0) {
        if (f.kind !== K.Splash) continue;
        this.drawSplash(x, y, f, u);
        this.st.splashes++;
        continue;
      }
      switch (f.kind) {
        case K.Flash: {
          const r = f.size * (0.6 + u * 0.6);
          ctx.globalAlpha = 1 - u;
          ctx.drawImage(this.sp.glow, x - r, y - r, r * 2, r * 2);
          // 炮口焰：沿射向的长条
          ctx.save(); ctx.translate(x, y); ctx.rotate(f.ang);
          ctx.globalAlpha = (1 - u) * 0.95;
          ctx.drawImage(this.sp.core, -r * 0.2, -r * 0.35, r * 1.5, r * 0.7);
          ctx.restore();
          break;
        }
        case K.Cordite: {
          const r = f.size * (0.6 + u * 1.8);
          const dx = wdx * u * f.size * 2.4 + Math.cos(f.ang) * u * f.size * 1.2, dy = wdy * u * f.size * 2.4 + Math.sin(f.ang) * u * f.size * 1.2;
          ctx.globalAlpha = 0.5 * (1 - u) * Math.min(1, u * 8);
          ctx.drawImage(this.sp.smokeBrown, x + dx - r, y + dy - r, r * 2, r * 2);
          break;
        }
        case K.HitFlash: {
          const r = f.size * (0.5 + Math.sqrt(u) * 0.9);
          ctx.globalAlpha = (1 - u) * (1 - u);
          ctx.drawImage(this.sp.fire, x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8);
          ctx.globalAlpha = Math.max(0, 1 - u * 2.2);
          ctx.drawImage(this.sp.core, x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
          break;
        }
        case K.Spark: {
          const k = 1 - Math.pow(1 - u, 2);
          const sx = x + f.vx * f.life * k * 0.6, sy = y + f.vy * f.life * k * 0.6;
          ctx.globalAlpha = 1 - u;
          ctx.fillStyle = u < 0.4 ? '#fff1b0' : '#ff8a2a';
          ctx.beginPath(); ctx.arc(sx, sy, f.size * (1 - u * 0.5), 0, TAU); ctx.fill();
          break;
        }
        case K.HitSmoke: {
          const r = f.size * (0.7 + u * 1.9);
          const dx = wdx * u * f.size * 3.5, dy = wdy * u * f.size * 3.5;
          ctx.globalAlpha = 0.62 * (1 - u) * Math.min(1, u * 5);
          ctx.drawImage(this.sp.smokeDark, x + dx - r, y + dy - r, r * 2, r * 2);
          this.st.smoke++;
          break;
        }
        case K.Shell: this.drawShell(f, u); this.st.shells++; break;
        default: break;
      }
    }
    if (layer === 1) {
      // landed() 在循环中追加的水柱排在 n0 之后，一并保留
      for (let i = n0; i < this.fx.length; i++) this.fx[w++] = this.fx[i];
      this.fx.length = w;
    }
    ctx.restore();
    this.st.particles = this.fx.length;
  }

  private drawShell(f: Fx, u: number) {
    const ctx = this.ctx, v = this.map.view;
    const b = this.byId.get(f.target);
    if (!b) return;
    const x0 = v.x + f.wx * v.k, y0 = v.y + f.wy * v.k;
    // 落点：目标当前位置（散布中心略偏向远弹）
    const x1 = b.x + Math.cos(f.ang) * f.ox * (f.vx - 0.5) * 0.6, y1 = b.y + Math.sin(f.ang) * f.ox * (f.vx - 0.5) * 0.6;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const lift = dist * 0.17;
    const pos = (q: number): [number, number] => [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - Math.sin(Math.PI * q) * lift];
    const n = Math.max(1, Math.round(f.size));
    const nx = -(y1 - y0) / (dist || 1), ny = (x1 - x0) / (dist || 1);
    for (let i = 0; i < n; i++) {
      const q = clamp(u - i * 0.025, 0, 1);
      const [px, py] = pos(q);
      const sp = (i - (n - 1) / 2) * 2.2;
      const qx = px + nx * sp, qy = py + ny * sp;
      // 拖尾
      const [tx, ty] = pos(Math.max(0, q - 0.07));
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = f.col; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx + nx * sp, ty + ny * sp); ctx.lineTo(qx, qy); ctx.stroke();
      // 曳光
      const r = 4 + f.cal / 120;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.sp.glow, qx - r, qy - r, r * 2, r * 2);
      ctx.fillStyle = '#fffbe6';
      ctx.beginPath(); ctx.arc(qx, qy, 1.25, 0, TAU); ctx.fill();
    }
  }

  private drawSplash(x: number, y: number, f: Fx, u: number) {
    const ctx = this.ctx;
    const r0 = f.size;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(f.ang); ctx.scale(1.65, 1);
    // 泡沫圈
    const foamR = r0 * (0.9 + u * 1.2);
    ctx.globalAlpha = 0.42 * (1 - u);
    ctx.beginPath(); ctx.arc(0, 0, foamR, 0, TAU); ctx.fillStyle = '#fdfcf6'; ctx.fill();
    // 外扩的涟漪
    const ringR = r0 * (0.7 + u * 2.1);
    ctx.globalAlpha = 0.85 * Math.pow(1 - u, 1.4);
    ctx.lineWidth = 1.1 / 1.3;
    ctx.strokeStyle = 'rgba(38,58,70,.55)'; ctx.beginPath(); ctx.arc(0, 0, ringR + 0.6, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, ringR, 0, TAU); ctx.stroke();
    // 水柱（俯视为白色实心团，先升后塌）
    const col = u < 0.12 ? u / 0.12 : Math.max(0, 1 - (u - 0.12) / 0.38);
    if (col > 0) {
      ctx.globalAlpha = col;
      ctx.beginPath(); ctx.arc(0, 0, r0 * (0.55 + 0.25 * col), 0, TAU);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = 'rgba(40,58,68,.6)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 海图网格 ----------
  private gridStep = 1;
  private gridLon: [number, number] = [0, 0];
  private gridLat: [number, number] = [0, 0];
  private drawGrid() {
    const map = this.map, ctx = this.ctx;
    const W = map.width, H = map.height;
    const corners: LonLat[] = [];
    for (const fx of [0, 0.5, 1]) for (const fy of [0, 0.5, 1]) {
      const ll = unproject(map.toWorld(W * fx, H * fy));
      if (ll && Number.isFinite(ll[0])) corners.push(ll);
    }
    if (!corners.length) return;
    const lon0 = Math.min(...corners.map((c) => c[0])), lon1 = Math.max(...corners.map((c) => c[0]));
    const lat0 = Math.min(...corners.map((c) => c[1])), lat1 = Math.max(...corners.map((c) => c[1]));
    const center = unproject(map.toWorld(W / 2, H / 2));
    const kmPx = this.kmPx(center);
    // 1° → 30′ → 10′ → 5′ → 2′ → 1′：格距不小于约 90 像素
    const steps = [10, 5, 2, 1, 0.5, 1 / 3, 1 / 6, 1 / 12, 1 / 30, 1 / 60];
    let step = steps[0];
    for (const sDeg of steps) { if (sDeg * 111 * kmPx >= 90) step = sDeg; else break; }
    this.gridStep = step; this.gridLon = [lon0, lon1]; this.gridLat = [lat0, lat1];
    const major = step >= 1 ? step * 5 : step >= 1 / 6 ? 1 : step >= 1 / 30 ? 1 / 6 : 1 / 12;
    const isMajor = (v: number) => Math.abs(v / major - Math.round(v / major)) < 1e-6;
    ctx.save();
    ctx.lineWidth = 0.8;
    const seg = 14;
    for (let lon = Math.ceil(lon0 / step - 1e-9) * step; lon <= lon1 + 1e-9; lon += step) {
      ctx.strokeStyle = isMajor(lon) ? 'rgba(46,66,80,.36)' : 'rgba(46,66,80,.2)';
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) { const [x, y] = map.llToScreen([lon, lat0 + ((lat1 - lat0) * i) / seg]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); this.st.gridLines++;
    }
    for (let lat = Math.ceil(lat0 / step - 1e-9) * step; lat <= lat1 + 1e-9; lat += step) {
      ctx.strokeStyle = isMajor(lat) ? 'rgba(46,66,80,.36)' : 'rgba(46,66,80,.2)';
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) { const [x, y] = map.llToScreen([lon0 + ((lon1 - lon0) * i) / seg, lat]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); this.st.gridLines++;
    }
    ctx.restore();
  }
  /** 某点的像素 / 公里（投影的局部比例） */
  private kmPx(ll: LonLat): number {
    const a = this.map.llToScreen(ll), b = this.map.llToScreen(destination(ll, 90, 10));
    return Math.hypot(b[0] - a[0], b[1] - a[1]) / 10;
  }
  private drawGridLabels() {
    const map = this.map, ctx = this.ctx, step = this.gridStep;
    const ins = map.insets;
    const left = Math.max(8, ins.left + 6), top = ins.top + 6, right = map.width - Math.max(12, ins.right), bottom = map.height - ins.bottom;
    const font = `10.5px ${FONT_TYPE}`;
    ctx.save();
    ctx.font = font; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
    const draw = (text: string, x: number, y: number, align: CanvasTextAlign) => {
      ctx.textAlign = align;
      ctx.strokeStyle = HALO; ctx.lineWidth = 3; ctx.strokeText(text, x, y);
      ctx.fillStyle = 'rgba(40,52,62,.85)'; ctx.fillText(text, x, y);
    };
    // 经线：在可用区域顶边的交点
    const [lat0, lat1] = this.gridLat, [lon0, lon1] = this.gridLon;
    for (let lon = Math.ceil(lon0 / step - 1e-9) * step; lon <= lon1 + 1e-9; lon += step) {
      const x = this.crossX(lon, lat0, lat1, top);
      if (x === null || x < left + 40 || x > right - 30) continue;
      draw(fmtDeg(lon, 'EW'), x, top + 3, 'center');
      ctx.strokeStyle = 'rgba(40,52,62,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, top - 3); ctx.lineTo(x, top + 2); ctx.stroke();
    }
    ctx.textBaseline = 'middle';
    for (let lat = Math.ceil(lat0 / step - 1e-9) * step; lat <= lat1 + 1e-9; lat += step) {
      const y = this.crossY(lat, lon0, lon1, left);
      if (y === null || y < top + 22 || y > bottom - 50) continue;
      draw(fmtDeg(lat, 'NS'), left + 7, y, 'left');
      ctx.strokeStyle = 'rgba(40,52,62,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left - 2, y); ctx.lineTo(left + 4, y); ctx.stroke();
    }
    ctx.restore();
    this.drawScaleBar(left + 10, bottom - 14);
  }
  /** 经线与水平线 y 的交点 x */
  private crossX(lon: number, lat0: number, lat1: number, y: number): number | null {
    const map = this.map;
    let prev = map.llToScreen([lon, lat0]);
    for (let i = 1; i <= 24; i++) {
      const cur = map.llToScreen([lon, lat0 + ((lat1 - lat0) * i) / 24]);
      if ((prev[1] - y) * (cur[1] - y) <= 0 && cur[1] !== prev[1]) return prev[0] + ((cur[0] - prev[0]) * (y - prev[1])) / (cur[1] - prev[1]);
      prev = cur;
    }
    return null;
  }
  private crossY(lat: number, lon0: number, lon1: number, x: number): number | null {
    const map = this.map;
    let prev = map.llToScreen([lon0, lat]);
    for (let i = 1; i <= 24; i++) {
      const cur = map.llToScreen([lon0 + ((lon1 - lon0) * i) / 24, lat]);
      if ((prev[0] - x) * (cur[0] - x) <= 0 && cur[0] !== prev[0]) return prev[1] + ((cur[1] - prev[1]) * (x - prev[0])) / (cur[0] - prev[0]);
      prev = cur;
    }
    return null;
  }
  /** 海里比例尺（上）与码（下） */
  private drawScaleBar(x: number, y: number) {
    const map = this.map, ctx = this.ctx;
    const ll = unproject(map.toWorld(x + 80, y));
    if (!ll || !Number.isFinite(ll[0])) return;
    const kmPx = this.kmPx(ll);
    const nice = (target: number, list: number[]) => list.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), list[0]);
    const nmPx = kmPx * 1.852;
    const nm = nice(150 / nmPx, [0.5, 1, 2, 3, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]);
    const ydPx = kmPx * 0.0009144;
    const yd = nice(150 / ydPx, [500, 1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000]);
    const L1 = nm * nmPx, L2 = yd * ydPx;
    const segs = nm >= 5 && nm % 5 === 0 ? 5 : nm === 3 ? 3 : nm >= 2 ? 4 : 2;
    ctx.save();
    // 底衬
    ctx.fillStyle = 'rgba(246,238,219,.72)';
    ctx.fillRect(x - 6, y - 30, Math.max(L1, L2) + 58, 40);
    ctx.font = `10px ${FONT_TYPE}`; ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
    // 海里：黑白相间
    for (let i = 0; i < segs; i++) {
      ctx.fillStyle = i % 2 ? '#f6eedb' : '#2b2418';
      ctx.fillRect(x + (L1 * i) / segs, y - 16, L1 / segs, 4);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.strokeRect(x, y - 16, L1, 4);
    ctx.fillStyle = INK;
    ctx.fillText('0', x, y - 18);
    ctx.fillText(fmtNum(nm / 2), x + L1 / 2, y - 18);
    ctx.textAlign = 'left'; ctx.fillText(`${fmtNum(nm)} 海里`, x + L1 - 6, y - 18);
    // 码
    ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + L2, y - 6);
    for (let i = 0; i <= 4; i++) { const xx = x + (L2 * i) / 4; ctx.moveTo(xx, y - 6); ctx.lineTo(xx, y - (i % 2 ? 4 : 2)); }
    ctx.stroke();
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(`${yd.toLocaleString('en-US')} 码`, x + L2 + 4, y - 11);
    ctx.restore();
  }

  // ---------- 标签 ----------
  private textW(text: string, font: string): number {
    const key = font + '|' + text;
    let w = this.widthCache.get(key);
    if (w === undefined) {
      this.ctx.font = font; w = this.ctx.measureText(text).width;
      if (this.widthCache.size > 4000) this.widthCache.clear();
      this.widthCache.set(key, w);
    }
    return w;
  }
  private collides(x: number, y: number, w: number, h: number): boolean {
    const o = this.occ;
    for (let i = 0; i < o.length; i += 4) if (x < o[i] + o[i + 2] && x + w > o[i] && y < o[i + 1] + o[i + 3] && y + h > o[i + 1]) return true;
    return false;
  }
  private label(x: number, y: number, w: number, h: number, text: string, font: string, color: string, align: CanvasTextAlign, alpha: number, bg: string | null, sub?: string, subFont?: string, subColor?: string) {
    let l = this.lblPool[this.nLbl];
    if (!l) { l = { x, y, w, h, text, font, color, align, alpha, bg }; this.lblPool[this.nLbl] = l; }
    l.x = x; l.y = y; l.w = w; l.h = h; l.text = text; l.font = font; l.color = color; l.align = align; l.alpha = alpha; l.bg = bg;
    l.sub = sub; l.subFont = subFont; l.subColor = subColor;
    this.nLbl++;
  }
  private flushLabels() {
    // 刻度标注：放得下才画
    for (const tk of this.pendingTicks) {
      const font = `9.5px ${FONT_TYPE}`, w = this.textW(tk.text, font) + 4, h = 11;
      let done = false;
      for (const sgn of [1, -1]) {
        const cx = tk.x + tk.nx * 9 * sgn, cy = tk.y + tk.ny * 9 * sgn;
        const lx = cx - w / 2 + (tk.nx * sgn > 0.3 ? w / 2 - 2 : tk.nx * sgn < -0.3 ? -w / 2 + 2 : 0), ly = cy - h / 2;
        if (this.collides(lx, ly, w, h)) continue;
        this.occ.push(lx, ly, w, h);
        this.label(lx + 2, ly, w, h, tk.text, font, tk.col, 'left', tk.alpha * 0.95, null);
        done = true; break;
      }
      void done;
    }
    this.pendingTicks = [];
    const ctx = this.ctx;
    ctx.save();
    ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
    for (let i = 0; i < this.nLbl; i++) {
      const l = this.lblPool[i];
      ctx.globalAlpha = l.alpha;
      if (l.bg) {
        ctx.fillStyle = l.bg; ctx.fillRect(l.x - 4, l.y, l.w, l.h);
        ctx.strokeStyle = 'rgba(43,36,24,.35)'; ctx.lineWidth = 0.6; ctx.strokeRect(l.x - 4 + 0.5, l.y + 0.5, l.w - 1, l.h - 1);
      }
      ctx.font = l.font; ctx.textAlign = 'left';
      const ty = l.y + (l.bg ? 2.5 : 0.5);
      if (!l.bg) { ctx.strokeStyle = HALO; ctx.lineWidth = 3.2; ctx.strokeText(l.text, l.x, ty); }
      ctx.fillStyle = l.color; ctx.fillText(l.text, l.x, ty);
      if (l.sub && l.subFont) {
        ctx.font = l.subFont;
        ctx.strokeStyle = HALO; ctx.lineWidth = 3; ctx.strokeText(l.sub, l.x, ty + 13);
        ctx.fillStyle = l.subColor ?? INK; ctx.fillText(l.sub, l.x, ty + 13);
      }
      this.st.labels++;
    }
    ctx.restore();
  }

  // ---------- 交互：透明命中框 ----------
  private updateHits() {
    const seen = new Set<string>();
    if (this.layers.units) for (let i = 0; i < this.nDrawn; i++) {
      const d = this.drawn[i];
      if (!d.on || d.alpha < 0.25) continue;
      const id = d.rec.u.id;
      seen.add(id);
      let r = this.hits.get(id);
      if (!r) r = this.makeHit(d.rec.u);
      const L = Math.max(d.L + 6, 22), W = Math.max(d.W + 8, 14);
      r.setAttribute('x', String(-L / 2)); r.setAttribute('y', String(-W / 2));
      r.setAttribute('width', String(L)); r.setAttribute('height', String(W));
      r.setAttribute('transform', `translate(${d.x.toFixed(1)},${d.y.toFixed(1)}) rotate(${((d.ang * 180) / Math.PI).toFixed(1)})`);
      if (r.style.display) r.style.display = '';
    }
    for (const [id, r] of this.hits) if (!seen.has(id) && r.style.display !== 'none') r.style.display = 'none';
  }
  private makeHit(u: RUnit): SVGRectElement {
    const r = svgEl('rect', { class: 'ship-hit', rx: 4 }, this.hitG);
    r.addEventListener('pointerenter', (ev) => { this.hover = u.id; this.dirty = true; this.units.showTip(u, ev as PointerEvent); });
    r.addEventListener('pointermove', (ev) => this.units.moveTip(ev as PointerEvent));
    r.addEventListener('pointerleave', () => { this.hover = null; this.dirty = true; this.units.hideTip(); });
    r.addEventListener('click', (ev) => { ev.stopPropagation(); this.units.onSelect(u.id); });
    this.hits.set(u.id, r);
    return r;
  }
}

// ---------- 辅助 ----------
/** 两色混合（#rrggbb） */
function mix(a: string, b: string, t: number): string {
  const pa = hex(a), pb = hex(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hex(s: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
/** 34.5 → 34°30′S */
function fmtDeg(v: number, hemi: 'NS' | 'EW'): string {
  const a = Math.abs(v);
  let d = Math.floor(a + 1e-9), m = Math.round((a - d) * 60);
  if (m === 60) { d++; m = 0; }
  const h = hemi === 'NS' ? (v < 0 ? 'S' : 'N') : (v < 0 ? 'W' : 'E');
  return m ? `${d}°${p2(m)}′${h}` : `${d}°${h}`;
}
const fmtNum = (v: number) => (v < 1 ? v.toFixed(1).replace(/\.0$/, '') : String(Math.round(v * 10) / 10));

/** 命中部位 → 自舰艏比例（解析不到时取舯部略前） */
export function hitFrac(h: RHit | undefined, lay: ShipLayout): number {
  return (h && hitLocation(h.location, h.gunsOut, lay)) ?? 0.45;
}
