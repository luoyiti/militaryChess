/** 屏幕特效（Canvas）：交战部队附近的炮火闪光与硝烟、事件爆炸、斯图卡/轰炸机掠过、包围圈脉冲。 */
import type { MapView } from './MapView';
import { project } from '../geo/frame';
import type { LonLat } from '../core/types';

interface P { wx: number; wy: number; t0: number; life: number; kind: 'flash' | 'smoke' | 'burst' | 'ring' | 'spark'; size: number; vx: number; vy: number; seed: number }
interface Plane { x0: number; y0: number; x1: number; y1: number; t0: number; dur: number; kind: 'stuka' | 'bomber'; n: number; dive: boolean }

export class FxLayer {
  private ps: P[] = [];
  private planes: Plane[] = [];
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

  /** 飞机编队掠过并在目标上空投弹 */
  planesTo(ll: LonLat, kind: 'stuka' | 'bomber', fromSide: 'W' | 'N' | 'E' = 'W') {
    if (!this.enabled || this.reduced) return;
    const [sx, sy] = this.map.llToScreen(ll);
    const w = this.map.width, h = this.map.height;
    const x0 = fromSide === 'E' ? w + 80 : fromSide === 'N' ? sx - 200 : -80;
    const y0 = fromSide === 'N' ? -60 : sy - 140 + Math.random() * 60;
    const dx = sx - x0, dy = sy - y0;
    const x1 = sx + dx * 1.2, y1 = sy + dy * 1.2;
    const [wx0, wy0] = this.map.toWorld(x0, y0), [wx1, wy1] = this.map.toWorld(x1, y1);
    this.planes.push({ x0: wx0, y0: wy0, x1: wx1, y1: wy1, t0: performance.now(), dur: 4200, kind, n: kind === 'stuka' ? 3 : 5, dive: kind === 'stuka' });
    setTimeout(() => this.burst(ll, true), 2000);
  }

  get busy() { return this.ps.length > 0 || this.planes.length > 0; }

  draw(now: number) {
    const ctx = this.ctx, map = this.map;
    const dpr = map.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, map.fx.width, map.fx.height);
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
      if (u > 1) continue;
      pk.push(pl);
      for (let i = 0; i < pl.n; i++) {
        const lag = i * 0.045;
        const uu = Math.max(0, Math.min(1, u - lag));
        const off = [(i % 2 ? 1 : -1) * Math.ceil(i / 2) * 16, Math.ceil(i / 2) * 12];
        const wx = pl.x0 + (pl.x1 - pl.x0) * uu, wy = pl.y0 + (pl.y1 - pl.y0) * uu;
        const [sx, sy] = map.toScreen(wx, wy);
        const ang = Math.atan2(pl.y1 - pl.y0, pl.x1 - pl.x0);
        const dive = pl.dive ? Math.sin(Math.min(1, uu * 2.2) * Math.PI) : 0;
        const scale = 1 + dive * 0.25;
        this.drawPlane(sx + off[0], sy + off[1] + dive * 18, ang, pl.kind, scale, 26 + dive * 22);
      }
    }
    this.planes = pk;
  }

  private drawPlane(x: number, y: number, ang: number, kind: 'stuka' | 'bomber', s: number, shadowOff: number) {
    const ctx = this.ctx;
    const shape = () => {
      ctx.beginPath();
      if (kind === 'stuka') {
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
    ctx.fillStyle = '#2d3036'; shape(); ctx.fill();
    ctx.strokeStyle = 'rgba(250,245,230,0.5)'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.restore();
  }
}
