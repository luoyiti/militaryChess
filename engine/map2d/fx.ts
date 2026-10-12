/** 屏幕特效（Canvas）：交战部队附近的炮火闪光与硝烟、事件爆炸、斯图卡/轰炸机掠过、包围圈脉冲。 */
import type { MapView } from './MapView';
import { project, unproject } from '../geo/frame';
import { flightPoseAt, type FlightSortie } from '../model/flight';
import type { LonLat } from '../core/types';
import { sideDef } from '../campaign/context';

interface P { wx: number; wy: number; t0: number; life: number; kind: 'flash' | 'smoke' | 'burst' | 'ring' | 'spark'; size: number; vx: number; vy: number; seed: number }
export type PlaneKind = 'stuka' | 'bomber' | 'fighter';
interface Plane { sortie: FlightSortie; t0: number; dur: number; kind: PlaneKind; n: number; dive: boolean; bombed: boolean }
interface DrawnPlane { route: string; unit: string; side: string; role: string; kind: PlaneKind; h: number; ll: LonLat; world: [number, number]; screen: [number, number]; nose: [number, number]; alpha: number }

export class FxLayer {
  private ps: P[] = [];
  private planes: Plane[] = [];
  private drawnPlanes: DrawnPlane[] = [];
  private ctx: CanvasRenderingContext2D;
  reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  enabled = true;

  constructor(private map: MapView) {
    this.ctx = map.fx.getContext('2d')!;
  }

  /** 炮火闪光（世界坐标附近随机） */
  battle(wx: number, wy: number, spread: number, n = 3) {
    if (!this.enabled || this.reduced) return;
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
      const x = wx + Math.cos(a) * r, y = wy + Math.sin(a) * r;
      const d = Math.random() * 400;
      this.ps.push({ wx: x, wy: y, t0: now + d, life: 260 + Math.random() * 200, kind: 'flash', size: 5 + Math.random() * 6, vx: 0, vy: 0, seed: Math.random() });
      this.ps.push({ wx: x, wy: y, t0: now + d + 120, life: 2200 + Math.random() * 1600, kind: 'smoke', size: 6 + Math.random() * 8, vx: (Math.random() - 0.3) * 0.004, vy: -0.004 - Math.random() * 0.004, seed: Math.random() });
    }
  }

  /** 事件大爆炸 */
  burst(ll: LonLat, big = true) {
    if (!this.enabled) return;
    const [wx, wy] = project(ll);
    const now = performance.now();
    this.ps.push({ wx, wy, t0: now, life: 1400, kind: 'ring', size: big ? 60 : 36, vx: 0, vy: 0, seed: 0 });
    if (this.reduced) return;
    for (let i = 0; i < (big ? 10 : 5); i++) {
      const a = Math.random() * Math.PI * 2;
      this.ps.push({ wx, wy, t0: now + i * 90, life: 380, kind: 'flash', size: 10 + Math.random() * 10, vx: Math.cos(a) * 0.02, vy: Math.sin(a) * 0.02, seed: Math.random() });
      this.ps.push({ wx, wy, t0: now + i * 90 + 150, life: 3200, kind: 'smoke', size: 12 + Math.random() * 12, vx: Math.cos(a) * 0.01, vy: -0.006, seed: Math.random() });
    }
  }

  /** 事件重放沿已解析的出击／交战／返航节点运动，墙钟只压缩任务时长。 */
  planesAlong(sortie: FlightSortie, kind: PlaneKind, dur = 9200) {
    if (!this.enabled || this.reduced || sortie.wps.length < 2) return;
    this.planes.push({ sortie, t0: performance.now(), dur, kind, n: kind === 'bomber' ? 5 : 3, dive: kind === 'stuka', bombed: false });
  }

  /** 兼容单次掠过调用；有真实起点时，终点不再由屏幕边缘推算。 */
  planesTo(ll: LonLat, kind: PlaneKind, fromSide: 'W' | 'N' | 'E', origin: LonLat | undefined, side: string) {
    const [sx, sy] = this.map.llToScreen(ll);
    const x0 = fromSide === 'E' ? this.map.width + 80 : fromSide === 'N' ? sx - 200 : -80;
    const y0 = fromSide === 'N' ? -60 : sy - 140;
    const from = origin ?? unproject(this.map.toWorld(x0, y0));
    this.planesAlong({ id: 'flyover', unit: '', side, role: kind === 'fighter' ? 'intercept' : 'raid',
      wps: [{ h: 0, ll: from }, { h: 1, ll }], ...(kind === 'fighter' ? {} : { attackH: 1, attackLL: ll }) }, kind, 6200);
  }

  /** 事件切换或时间跳转时取消全部旧场景效果；投弹由 draw 到达节点触发，没有遗留定时器。 */
  clear() {
    this.ps = []; this.planes = []; this.drawnPlanes = [];
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.map.fx.width, this.map.fx.height);
  }

  stats() { return { formations: this.planes.length, particles: this.ps.length, planes: this.drawnPlanes }; }

  get busy() { return this.ps.length > 0 || this.planes.length > 0; }

  draw(now: number) {
    const ctx = this.ctx, map = this.map;
    const dpr = map.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, map.fx.width, map.fx.height);
    this.drawnPlanes = [];
    if (!this.ps.length && !this.planes.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = map.view;
    const zs = Math.max(0.6, Math.min(1.8, Math.sqrt(map.relK)));
    const keep: P[] = [];
    for (const p of this.ps) {
      const age = now - p.t0;
      if (age < 0) { keep.push(p); continue; }
      if (age > p.life) continue;
      keep.push(p);
      const u = age / p.life;
      const x = v.x + (p.wx + p.vx * age / v.k * 0) * v.k + p.vx * age, y = v.y + p.wy * v.k + p.vy * age;
      if (p.kind === 'flash') {
        const r = p.size * zs * (1 - u * 0.6);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,248,210,${0.95 * (1 - u)})`);
        g.addColorStop(0.35, `rgba(255,170,60,${0.8 * (1 - u)})`);
        g.addColorStop(1, 'rgba(200,60,20,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'smoke') {
        const r = p.size * zs * (0.6 + u * 1.6);
        ctx.fillStyle = `rgba(70,62,52,${0.28 * (1 - u) * Math.min(1, u * 6)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'ring') {
        const r = p.size * zs * (0.2 + u * 1.2);
        ctx.strokeStyle = `rgba(170,30,30,${0.8 * (1 - u)})`;
        ctx.lineWidth = 2.5 * (1 - u) + 0.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
      }
    }
    this.ps = keep.length > 1600 ? keep.slice(-1600) : keep;
    const pk: Plane[] = [];
    for (const pl of this.planes) {
      const u = (now - pl.t0) / pl.dur;
      if (u > 1 + (pl.n - 1) * .012) continue;
      pk.push(pl);
      const wps = pl.sortie.wps, h0 = wps[0].h, span = wps.at(-1)!.h - h0;
      if (!pl.bombed && pl.sortie.attackH != null && h0 + u * span >= pl.sortie.attackH) {
        pl.bombed = true;
        if (pl.kind !== 'fighter' && pl.sortie.role === 'raid' && pl.sortie.attackLL) this.burst(pl.sortie.attackLL, true);
      }
      for (let i = 0; i < pl.n; i++) {
        const uu = u - i * .012;
        if (uu < 0 || uu >= 1) continue;
        const h = h0 + uu * span, pose = flightPoseAt(wps, h)!;
        const [sx, sy] = map.toScreen(...pose.world), ang = pose.heading;
        // 编队间隔随航向转动，不再固定在画面的右下方。
        const row = Math.ceil(i / 2), lateral = (i % 2 ? 1 : -1) * row * 16, trail = -row * 12;
        const x = sx + Math.cos(ang) * trail - Math.sin(ang) * lateral;
        const y = sy + Math.sin(ang) * trail + Math.cos(ang) * lateral;
        const attackU = pl.sortie.attackH == null ? .5 : (pl.sortie.attackH - h0) / Math.max(1e-9, span);
        const dive = pl.dive ? Math.max(0, 1 - Math.abs(uu - attackU) / .18) : 0;
        const alpha = Math.min(1, uu / .06, (1 - uu) / .12);
        ctx.save(); ctx.globalAlpha = alpha;
        const matrix = this.drawPlane(x, y, ang, pl.kind, 1 + dive * .25, 26 + dive * 22, pl.sortie.side);
        if (i === 0) {
          const len = Math.hypot(matrix.a, matrix.b) || 1;
          this.drawnPlanes.push({ route: pl.sortie.id, unit: pl.sortie.unit, side: pl.sortie.side, role: pl.sortie.role, kind: pl.kind, h, ll: pose.ll, world: pose.world,
            screen: [matrix.e / dpr, matrix.f / dpr], nose: [matrix.a / len, matrix.b / len], alpha });
        }
        ctx.restore();
      }
    }
    this.planes = pk;
  }

  private drawPlane(x: number, y: number, ang: number, kind: PlaneKind, s: number, shadowOff: number, side: string) {
    const ctx = this.ctx;
    const shape = () => {
      ctx.beginPath();
      if(kind==='fighter'){ ctx.moveTo(10,0);ctx.lineTo(2,-1.1);ctx.lineTo(-1,-9);ctx.quadraticCurveTo(-5,-11,-4,-7);ctx.lineTo(-3,-1);ctx.lineTo(-8,-.8);ctx.lineTo(-9,-4);ctx.lineTo(-10,-4);ctx.lineTo(-10,0);ctx.lineTo(-10,4);ctx.lineTo(-9,4);ctx.lineTo(-8,.8);ctx.lineTo(-3,1);ctx.lineTo(-4,7);ctx.quadraticCurveTo(-5,11,-1,9);ctx.lineTo(2,1.1); } else if (kind === 'stuka') {
        // 倒海鸥翼
        ctx.moveTo(9, 0); ctx.lineTo(3, -1.2); ctx.lineTo(1, -3); ctx.lineTo(-1.5, -9); ctx.lineTo(-3, -9); ctx.lineTo(-2, -2.5); ctx.lineTo(-7, -1.2);
        ctx.lineTo(-8, -4); ctx.lineTo(-9.5, -4); ctx.lineTo(-9, 0);
        ctx.lineTo(-9.5, 4); ctx.lineTo(-8, 4); ctx.lineTo(-7, 1.2); ctx.lineTo(-2, 2.5); ctx.lineTo(-3, 9); ctx.lineTo(-1.5, 9); ctx.lineTo(1, 3); ctx.lineTo(3, 1.2);
      } else {
        ctx.moveTo(10, 0); ctx.lineTo(5, -1.4); ctx.lineTo(2, -1.6); ctx.lineTo(0, -12); ctx.lineTo(-2.5, -12); ctx.lineTo(-2, -1.6); ctx.lineTo(-8, -1.2);
        ctx.lineTo(-9, -5); ctx.lineTo(-10.5, -5); ctx.lineTo(-10, 0); ctx.lineTo(-10.5, 5); ctx.lineTo(-9, 5); ctx.lineTo(-8, 1.2); ctx.lineTo(-2, 1.6); ctx.lineTo(-2.5, 12); ctx.lineTo(0, 12); ctx.lineTo(2, 1.6); ctx.lineTo(5, 1.4);
      }
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(x + shadowOff * 0.6, y + shadowOff);
    ctx.rotate(ang); ctx.scale(s * 1.4, s * 1.4);
    ctx.fillStyle = 'rgba(40,30,15,0.18)'; shape(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s * 1.4, s * 1.4);
    const matrix = ctx.getTransform();
    ctx.fillStyle = (side && planeColor(side)) || '#2d3036'; shape(); ctx.fill();
    ctx.strokeStyle = 'rgba(250,245,230,0.5)'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.restore();
    return matrix;
  }
}

/** 飞机剪影颜色：manifest.sides[].planeColor（未声明的阵营用缺省深灰） */
function planeColor(side: string): string | undefined {
  try { return sideDef(side).planeColor; } catch { return undefined; }
}
