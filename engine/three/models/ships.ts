/**
 * 1939 年舰船与舰载机（拉普拉塔河口海战与施佩伯爵号的袭击巡航）。
 * 坐标：米，+X 舰艏，+Y 向上，+Z 右舷；舰体中点在 x=0，龙骨在 y=0（全舰体模型，含水线以下的防污漆）。
 * 高度 = 龙骨到桅顶；沙盘按 SHIP_META[id].draftM 把模型下沉到水线（水线中心为原点）。
 * 角色借用 paint.ts 的通用角色，按涂装覆盖颜色：
 *   paint 舰体/上层建筑  wood 甲板  dark 水线黑带/烟囱顶  red 防污漆  metal 炮管  glass 舰桥窗
 *   canvas 帆布/炮衣  belly 次要灰（炮塔顶、平台）  white 商船上层/小艇  yellow 商船烟囱（浅黄）
 */
import { B, type V2, type V3 } from './builder';
import type { Role } from './paint';
import { MODEL_SPECS } from './specs';

const HULL: Role = 'paint', DECK: Role = 'wood', BOOT: Role = 'dark', BOTTOM: Role = 'red', GUN: Role = 'metal';
const WIN: Role = 'glass', TONE: Role = 'belly';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 折线插值：pts 按第一分量升序（相同横坐标 = 台阶） */
function pl(pts: readonly V2[], v: number): number {
  if (v <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][0]) {
      const [a0, a1] = pts[i - 1], [b0, b1] = pts[i];
      return b0 === a0 ? b1 : a1 + ((b1 - a1) * (v - a0)) / (b0 - a0);
    }
  }
  return pts[pts.length - 1][1];
}

// ---------- 舰体 ----------
export interface HullDef {
  L: number; B: number; T: number;
  /** 甲板边线高度（舷弧）：[x, y]，自舰艉到舰艏；相邻两点 x 很近 = 甲板台阶（艏楼甲板 / 后甲板） */
  deck: V2[];
  /** 艏柱轮廓：[y, x]，自龙骨向上（x = 该高度最前点） */
  stem: V2[];
  /** 艉部轮廓：[y, x]，自龙骨向上（x = 该高度最后点） */
  stern: V2[];
  entry?: number; // 艏部收窄段占全长比例
  run?: number; // 艉部收窄段占全长比例
  transom?: number; // 甲板高度处艉部半宽比例
  flare?: number; // 艏部外飘（上层水线更丰满）
  bilge?: number; // 龙骨处半宽比例（舭部丰满度）
}

export class Hull {
  constructor(readonly d: HullDef) {}
  deckAt(x: number) { return pl(this.d.deck, x); }
  bowX(y: number) { return pl(this.d.stem, y); }
  sternX(y: number) { return pl(this.d.stern, y); }
  /** 站位 u（0 = 艉，1 = 艏）在高度 y 的半宽；yt = 该站位甲板高度 */
  half(u: number, y: number, yt: number): number {
    const { B: Bm, T } = this.d;
    const entry = this.d.entry ?? 0.3, run = this.d.run ?? 0.22, transom = this.d.transom ?? 0.25, flare = this.d.flare ?? 0.5;
    let p = 1;
    if (u > 1 - entry) {
      const t = (u - (1 - entry)) / entry;
      const pe = 1.25 + flare * 1.5 * clamp01((y - T * 0.3) / Math.max(0.1, yt - T * 0.3));
      p = Math.pow(Math.max(0, 1 - Math.pow(t, pe)), 0.6);
    } else if (u < run) {
      const t = (run - u) / run;
      const tw = transom * clamp01((y - T * 0.75) / Math.max(0.1, yt - T * 0.75));
      p = tw + (1 - tw) * Math.sqrt(Math.max(0, 1 - t * t));
    }
    const bil = this.d.bilge ?? 0.72;
    const sec = y >= T * 0.55 ? 1 : bil + (1 - bil) * Math.sqrt(Math.max(0, y) / (T * 0.55));
    return (Bm / 2) * p * sec;
  }
  /** 站位 u 的甲板高度与该高度的艏艉端点 */
  private top(u: number) {
    let x = lerp(-this.d.L / 2, this.d.L / 2, u), yt = this.deckAt(x);
    for (let i = 0; i < 2; i++) { x = lerp(this.sternX(yt), this.bowX(yt), u); yt = this.deckAt(x); }
    return yt;
  }
  uAt(x: number) { const yt = this.deckAt(x); return clamp01((x - this.sternX(yt)) / (this.bowX(yt) - this.sternX(yt))); }
  /** 甲板高度处 x 的半宽（布置舷侧炮位、小艇） */
  halfAtDeck(x: number) { const yt = this.deckAt(x); return this.half(this.uAt(x), yt, yt); }

  build(b: B, deckRole: Role = DECK) {
    const { T, deck } = this.d;
    const n = b.n(46, 14);
    const us: number[] = [];
    for (let i = 0; i <= n; i++) us.push(0.5 - 0.5 * Math.cos((Math.PI * i) / n));
    for (const [x] of deck) us.push(this.uAt(x));
    us.sort((a, c) => a - c);
    const U = us.filter((u, i) => i === 0 || u - us[i - 1] > 1e-4);
    const below = b.hi ? [0, 0.22 * T, 0.55 * T, T - 0.35] : [0, T - 0.35];
    const bandRole = (j: number) => (j < below.length - 1 ? BOTTOM : j === below.length - 1 ? BOOT : HULL);
    const rows: V3[][] = U.map((u) => {
      const yt = this.top(u);
      const ys = [...below, T + 0.9, ...(b.hi ? [lerp(T + 0.9, yt, 0.5)] : []), yt];
      return ys.map((y): V3 => [lerp(this.sternX(y), this.bowX(y), u), y, this.half(u, y, yt)]);
    });
    const mir = (p: V3): V3 => [p[0], p[1], -p[2]];
    for (let i = 0; i < rows.length - 1; i++) {
      const A = rows[i], C = rows[i + 1];
      for (let j = 0; j < A.length - 1; j++) {
        const q: [V3, V3, V3][] = [[A[j], C[j], C[j + 1]], [A[j], C[j + 1], A[j + 1]]];
        b.tris(q, bandRole(j));
        b.tris(q.map(([p0, p1, p2]) => [mir(p0), mir(p2), mir(p1)] as [V3, V3, V3]), bandRole(j));
      }
      // 甲板（台阶处为竖直舱壁）
      const s0 = A[A.length - 1], s1 = C[C.length - 1];
      const step = Math.abs(s1[1] - s0[1]) > 0.5 * Math.abs(s1[0] - s0[0]);
      b.tris([[s0, s1, mir(s1)], [s0, mir(s1), mir(s0)]], step ? HULL : deckRole, [0, 1, 0]);
      // 船底
      b.tris([[A[0], C[0], mir(C[0])], [A[0], mir(C[0]), mir(A[0])]], BOTTOM, [0, -1, 0]);
    }
    // 艉封板
    const S = rows[0];
    for (let j = 0; j < S.length - 1; j++) {
      if (S[j][2] < 0.02 && S[j + 1][2] < 0.02) continue;
      b.tris([[S[j], S[j + 1], mir(S[j + 1])], [S[j], mir(S[j + 1]), mir(S[j])]], bandRole(j), [-1, 0, 0], true);
    }
  }
}

// ---------- 上层建筑与舾装部件 ----------
/** 甲板室：x0..x1，半宽 w，y0..y1，顶面四周收进 inset */
function house(b: B, x0: number, x1: number, w: number, y0: number, y1: number, role: Role = HULL, inset = 0.15) {
  b.frustum(x0, x1, w, x0 + inset, x1 - inset, Math.max(0.05, w - inset), y0, y1, role);
}
/** 舰桥窗带（卡片版） */
function windows(b: B, x0: number, x1: number, w: number, y: number, h = 0.7, front = true) {
  if (!b.hi) return;
  for (const s of [-1, 1]) b.box([x1 - x0 - 0.5, h, 0.08], [(x0 + x1) / 2, y, s * (w + 0.03)], WIN);
  if (front) b.box([0.08, h, 2 * w - 0.5], [x1 + 0.03, y, 0], WIN);
}
/** 椭圆截面柱（烟囱、塔桅）：a 底中心 → c 顶中心，rx/rz 半轴；tilt = 顶面前后倾斜（每米 x 的 y 变化） */
function oval(b: B, a: V3, c: V3, rx: number, rz: number, role: Role, capRole: Role | null = null, tilt = 0, rxTop = rx, rzTop = rz) {
  const n = b.n(22, 8);
  const ring = (p: V3, ax: number, az: number, t: number) => Array.from({ length: n }, (_, i): V3 => {
    const ang = (i / n) * Math.PI * 2, dx = Math.cos(ang) * ax;
    return [p[0] + dx, p[1] + dx * t, p[2] + Math.sin(ang) * az];
  });
  const r0 = ring(a, rx, rz, 0), r1 = ring(c, rxTop, rzTop, tilt);
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    b.tris([[r0[i], r1[i], r1[k]], [r0[i], r1[k], r0[k]]], role, [Math.cos(((i + 0.5) / n) * Math.PI * 2), 0, Math.sin(((i + 0.5) / n) * Math.PI * 2)]);
  }
  b.tris(r1.map((p, i) => [c, p, r1[(i + 1) % n]] as [V3, V3, V3]), capRole ?? role, [0, 1, 0]);
  b.tris(r0.map((p, i) => [a, r0[(i + 1) % n], p] as [V3, V3, V3]), role, [0, -1, 0]);
}
/** 烟囱：x 中心，y0..y1，长 len、宽 wid，后倾 rake（弧度），顶部 capH 米涂黑；tilt = 斜切烟囱帽 */
function funnel(b: B, x: number, y0: number, y1: number, len: number, wid: number, rake = 0, capH = 1.4, role: Role = HULL, tilt = 0) {
  const dx = -(y1 - y0) * Math.tan(rake);
  const ym = y1 - capH, f = (ym - y0) / (y1 - y0);
  oval(b, [x, y0, 0], [x + dx * f, ym, 0], len / 2, wid / 2, role);
  oval(b, [x + dx * f, ym, 0], [x + dx, y1, 0], len / 2, wid / 2, BOOT, 'dark', tilt);
  if (b.hi) oval(b, [x + dx * f, ym - 0.6, 0], [x + dx * f, ym, 0], len / 2 + 0.25, wid / 2 + 0.25, TONE);
}
function pole(b: B, a: V3, c: V3, r0: number, r1 = r0 * 0.6, role: Role = HULL) { b.cyl(a, c, r0, r1, b.n(8, 4), role); }
/** 三脚桅：主柱 (x, y0)→(x, top)，两根后撑脚自 (x - back, y0, ±spread) 交于 join 高度 */
function tripod(b: B, x: number, y0: number, top: number, join: number, back: number, spread: number, r = 0.45) {
  pole(b, [x, y0, 0], [x, top, 0], r, r * 0.5);
  for (const s of [-1, 1]) pole(b, [x - back, y0, s * spread], [x, join, 0], r * 0.8, r * 0.6);
}
function yard(b: B, x: number, y: number, span: number) { b.box([0.22, 0.22, span], [x, y, 0], HULL); }
function platform(b: B, x: number, y: number, r: number, role: Role = TONE) { b.cyl([x, y - 0.25, 0], [x, y, 0], r, r, b.n(16, 6), role); }

/** 舰载小艇 */
function boat(b: B, x: number, y: number, z: number, len: number, wid: number, role: Role = 'white') {
  if (!b.hi) { b.box([len, wid * 0.7, wid], [x, y + wid * 0.35, z], role); return; }
  b.frustum(x - len / 2, x + len / 2, wid * 0.32, x - len / 2 + 0.2, x + len / 2, wid / 2, y, y + wid * 0.55, role, z);
  b.box([len * 0.7, 0.18, wid * 0.8], [x - len * 0.05, y + wid * 0.62, z], 'canvas');
}
/** 吊车：立柱 + 吊臂（指向 dir 侧） */
function crane(b: B, x: number, y0: number, z: number, h: number, jib: number, yaw: number) {
  pole(b, [x, y0, z], [x, y0 + h, z], 0.45, 0.35);
  if (!b.hi) return;
  pole(b, [x, y0 + h * 0.75, z], [x + Math.cos(yaw) * jib, y0 + h * 0.75 + jib * 0.45, z + Math.sin(yaw) * jib], 0.22, 0.12, HULL);
}

interface TurretDef { len: number; wid: number; hgt: number; guns: number; bore: number; barrel: number; spacing: number; style: 'de' | 'rn' | 'shield'; rf?: number }
const T_DE28: TurretDef = { len: 13.5, wid: 10.2, hgt: 3.1, guns: 3, bore: 0.14, barrel: 14.5, spacing: 2.3, style: 'de', rf: 10.4 };
const T_DE15: TurretDef = { len: 4.6, wid: 3.4, hgt: 2.3, guns: 1, bore: 0.075, barrel: 8.2, spacing: 0, style: 'shield' };
const T_DE105: TurretDef = { len: 3.4, wid: 3.6, hgt: 1.9, guns: 2, bore: 0.052, barrel: 6.6, spacing: 0.9, style: 'shield' };
const T_RN8: TurretDef = { len: 9.4, wid: 7.6, hgt: 2.9, guns: 2, bore: 0.1, barrel: 10.4, spacing: 2.0, style: 'rn' };
const T_RN6: TurretDef = { len: 7.6, wid: 6.4, hgt: 2.6, guns: 2, bore: 0.076, barrel: 7.8, spacing: 1.7, style: 'rn' };
const T_RN15: TurretDef = { len: 12.6, wid: 9.8, hgt: 3.5, guns: 2, bore: 0.19, barrel: 16, spacing: 2.6, style: 'rn', rf: 9.2 };
const T_RN45: TurretDef = { len: 4.8, wid: 4.4, hgt: 2.4, guns: 2, bore: 0.057, barrel: 5.4, spacing: 1.1, style: 'rn' };
const T_RN4: TurretDef = { len: 2.6, wid: 2.4, hgt: 1.8, guns: 1, bore: 0.051, barrel: 4.8, spacing: 0, style: 'shield' };

/** 平面多边形沿 y 拉伸、顶面收进的凸体（炮塔） */
function plan(b: B, ptsBottom: V2[], ptsTop: V2[], y0: number, y1: number, role: Role) {
  const n = ptsBottom.length;
  const pts: V3[] = [...ptsBottom.map(([x, z]): V3 => [x, y0, z]), ...ptsTop.map(([x, z]): V3 => [x, y1, z])];
  const faces: number[][] = [[...Array(n).keys()], [...Array(n).keys()].map((i) => i + n)];
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, ((i + 1) % n) + n, i + n]);
  b.poly(pts, faces, role);
}

/** 炮塔：中心 (x, y)，facing = 1 朝艏 / -1 朝艉；z 偏移（舷侧副炮） */
function turret(b: B, x: number, y: number, d: TurretDef, facing: 1 | -1 = 1, z = 0, yaw = 0, elev = 0.04) {
  b.with({ p: [x, y, z], r: [0, (facing < 0 ? Math.PI : 0) + yaw, 0] }, () => {
    const L = d.len, W = d.wid / 2, H = d.hgt;
    let front: number;
    if (d.style === 'de') {
      front = L * 0.42;
      plan(b, [[front, -W * 0.62], [L * 0.16, -W], [-L * 0.58, -W], [-L * 0.58, W], [L * 0.16, W], [front, W * 0.62]],
        [[L * 0.3, -W * 0.56], [L * 0.12, -W * 0.92], [-L * 0.55, -W * 0.92], [-L * 0.55, W * 0.92], [L * 0.12, W * 0.92], [L * 0.3, W * 0.56]], 0, H, HULL);
    } else if (d.style === 'rn') {
      front = L * 0.38;
      plan(b, [[front, -W * 0.84], [L * 0.2, -W], [-L * 0.62, -W * 0.96], [-L * 0.62, W * 0.96], [L * 0.2, W], [front, W * 0.84]],
        [[L * 0.12, -W * 0.8], [L * 0.02, -W * 0.92], [-L * 0.6, -W * 0.9], [-L * 0.6, W * 0.9], [L * 0.02, W * 0.92], [L * 0.12, W * 0.8]], 0, H, HULL);
    } else {
      front = L * 0.3;
      plan(b, [[front, -W * 0.7], [-L * 0.1, -W], [-L * 0.55, -W * 0.9], [-L * 0.55, W * 0.9], [-L * 0.1, W], [front, W * 0.7]],
        [[L * 0.05, -W * 0.62], [-L * 0.15, -W * 0.9], [-L * 0.5, -W * 0.85], [-L * 0.5, W * 0.85], [-L * 0.15, W * 0.9], [L * 0.05, W * 0.62]], 0, H, HULL);
    }
    if (b.hi && d.style !== 'shield') b.box([L * 0.5, 0.12, W * 1.5], [-L * 0.2, H + 0.06, 0], TONE);
    if (d.rf) {
      b.box([1.4, 1.2, d.rf], [-L * 0.42, H * 0.62, 0], HULL);
      if (b.hi) for (const s of [-1, 1]) b.cyl([-L * 0.42, H * 0.62, s * d.rf / 2], [-L * 0.42, H * 0.62, s * (d.rf / 2 + 0.05)], 0.55, 0.55, 10, 'dark');
    }
    const yb = H * (d.style === 'shield' ? 0.55 : 0.45);
    for (let g = 0; g < d.guns; g++) {
      const zz = (g - (d.guns - 1) / 2) * d.spacing;
      const x0 = front - 0.4;
      b.cyl([x0, yb, zz], [x0 + d.barrel * Math.cos(elev), yb + d.barrel * Math.sin(elev), zz], d.bore * 1.7, d.bore * 1.15, b.n(12, 5), GUN);
      if (b.hi) {
        b.cyl([x0 - 0.1, yb, zz], [x0 + 0.9, yb + 0.04, zz], d.bore * 2.6, d.bore * 2.4, 10, 'canvas');
        b.cyl([x0 + d.barrel * 0.98, yb + d.barrel * Math.sin(elev), zz], [x0 + d.barrel * 1.0, yb + d.barrel * Math.sin(elev), zz], d.bore * 1.3, d.bore * 1.3, 10, GUN);
      }
    }
  });
}
/** 炮座（超射炮塔下的圆柱基座） */
function barbette(b: B, x: number, y0: number, y1: number, r: number) { b.cyl([x, y0 - 0.2, 0], [x, y1, 0], r, r, b.n(20, 8), HULL); }

/** 弹射器：轨道桁架 + 底座 */
function catapult(b: B, x: number, y: number, len: number, yaw = 0, z = 0) {
  b.cyl([x, y - 1.2, z], [x, y, z], 1.1, 1.3, b.n(12, 6), HULL);
  b.with({ p: [x, y, z], r: [0, yaw, 0] }, () => {
    b.box([len, 0.55, 1.2], [0, 0.28, 0], TONE);
    if (b.hi) for (let i = 0; i < 6; i++) b.box([0.1, 0.5, 1.25], [-len / 2 + (i + 0.5) * (len / 6), 0.3, 0], 'dark');
  });
}
/** 鱼雷发射管组 */
function tubes(b: B, x: number, y: number, z: number, n: number, yaw: number, len = 7) {
  b.cyl([x, y, z], [x, y + 0.6, z], 1.0, 1.0, b.n(12, 5), HULL);
  b.with({ p: [x, y + 0.9, z], r: [0, yaw, 0] }, () => {
    for (let i = 0; i < n; i++) b.cyl([-len * 0.3, 0, (i - (n - 1) / 2) * 0.62], [len * 0.7, 0, (i - (n - 1) / 2) * 0.62], 0.3, 0.3, b.n(8, 4), HULL);
  });
}
/** 白船旗（皇家海军） */
function whiteEnsign(b: B, x: number, y: number) {
  if (!b.hi) return;
  b.box([2.4, 1.3, 0.05], [x, y, 0], 'flagA');
  b.box([2.42, 0.28, 0.07], [x, y, 0], 'flagB');
  b.box([0.3, 1.32, 0.07], [x + 0.2, y, 0], 'flagB');
}
function anchors(b: B, h: Hull, x: number) {
  if (!b.hi) return;
  const y = h.deckAt(x) - 1.6, w = h.halfAtDeck(x) * 0.96;
  for (const s of [-1, 1]) b.box([1.6, 1.4, 0.3], [x, y, s * w], 'dark');
}
function staffs(b: B, h: Hull, L: number) {
  const xb = L / 2 - 1.2, xs = -L / 2 + 0.8;
  pole(b, [xb, h.deckAt(xb), 0], [xb, h.deckAt(xb) + 3, 0], 0.08, 0.05);
  pole(b, [xs, h.deckAt(xs), 0], [xs, h.deckAt(xs) + 4, 0], 0.1, 0.06);
}
/** 4 根船柱 + 吊杆组（商船、补给舰） */
function derricks(b: B, x: number, y: number, dir: 1 | -1, n = 2, len = 12) {
  if (!b.hi) return;
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * 2.4;
    pole(b, [x, y + 1.2, z * 0.4], [x + dir * len * 0.86, y + 1.2 + len * 0.5, z], 0.16, 0.1, 'yellow');
  }
}

// ---------- 舰载机（独立模型 + 舰上缩小版） ----------
type Station = [number, number, number, number]; // x, 中心 y, 竖半径, 横半径
function loft(b: B, st: Station[], role: Role = HULL, under: Role = role, zc = 0) {
  const n = b.n(14, 6);
  const rings = st.map(([x, y, ry, rz]) => Array.from({ length: n }, (_, i): V3 => {
    const a = (i / n) * Math.PI * 2;
    return [x, y + Math.cos(a) * ry, zc + Math.sin(a) * rz];
  }));
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n, a = ((j + 0.5) / n) * Math.PI * 2;
      b.tris([[rings[i][j], rings[i + 1][j], rings[i + 1][k]], [rings[i][j], rings[i + 1][k], rings[i][k]]], Math.cos(a) < -0.3 ? under : role, [0, Math.cos(a), Math.sin(a)]);
    }
  }
  for (const i of [0, st.length - 1]) {
    const c: V3 = [st[i][0], st[i][1], zc];
    if (st[i][2] < 0.02) continue;
    b.tris(rings[i].map((p, j) => [c, p, rings[i][(j + 1) % n]] as [V3, V3, V3]), role, [i ? 1 : -1, 0, 0]);
  }
}
/** 机翼（左右对称）：翼根前缘 xLe、根/梢弦长、半翼展、高度、厚度、后掠（翼梢前缘后退量）、上反角高度增量、翼根 z0 */
function wing(b: B, xLe: number, cr: number, ct: number, semi: number, y: number, th: number, sweep = 0, dihedral = 0, z0 = 0, role: Role = HULL) {
  for (const s of [-1, 1]) {
    const zr = s * z0, zt = s * semi, yt = y + dihedral, h = th / 2;
    b.hexa([[xLe - cr, y - h, zr], [xLe, y - h, zr], [xLe - sweep, yt - h, zt], [xLe - sweep - ct, yt - h, zt],
      [xLe - cr, y + h, zr], [xLe, y + h, zr], [xLe - sweep, yt + h, zt], [xLe - sweep - ct, yt + h, zt]], role);
  }
}
function prop(b: B, x: number, y: number, z: number, r: number, blades: number, dir: 1 | -1 = 1) {
  b.cyl([x, y, z], [x + dir * r * 0.32, y, z], r * 0.17, 0.02, b.n(12, 6), 'dark');
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + 0.4;
    b.with({ p: [x + dir * 0.05, y, z], r: [a, 0, 0] }, () => b.box([0.07, r, 0.2], [0, r / 2, 0], 'dark'));
  }
}
function strut(b: B, a: V3, c: V3, r = 0.045) { b.cyl(a, c, r, r, b.n(6, 3), 'dark'); }
function roundel(b: B, x: number, y: number, z: number, r: number, face: 'up' | 'side') {
  if (!b.hi) return;
  for (const [f, role, lift] of [[1, 'blue', 0.012], [0.62, 'white', 0.024], [0.3, 'red', 0.036]] as const) {
    if (face === 'up') b.cyl([x, y, z], [x, y + lift, z], r * f, r * f, 16, role);
    else b.cyl([x, y, z], [x, y, z + Math.sign(z || 1) * lift], r * f, r * f, 16, role);
  }
}
function balkenkreuz(b: B, x: number, y: number, z: number, s: number) {
  if (!b.hi) return;
  b.box([s, 0.02, s * 0.3], [x, y, z], 'white'); b.box([s * 0.3, 0.02, s], [x, y, z], 'white');
  b.box([s * 0.8, 0.03, s * 0.16], [x, y + 0.006, z], 'dark'); b.box([s * 0.16, 0.03, s * 0.8], [x, y + 0.006, z], 'dark');
}

/** Arado Ar 196 A：低单翼双浮筒，BMW 132 星形发动机，长座舱罩 */
export function ar196(b: B) {
  const { lengthM: L, widthM: S, heightM: H } = MODEL_SPECS.ar196;
  const cy = H * 0.66;
  loft(b, [[L * 0.46, cy, 0.62, 0.62], [L * 0.38, cy, 0.66, 0.66], [L * 0.2, cy + 0.05, 0.6, 0.52], [-L * 0.1, cy + 0.05, 0.5, 0.42], [-L * 0.36, cy + 0.15, 0.26, 0.2], [-L * 0.5, cy + 0.25, 0.08, 0.06]], HULL, 'belly');
  b.cyl([L * 0.38, cy, 0], [L * 0.47, cy, 0], 0.68, 0.6, b.n(16, 8), 'dark');
  prop(b, L * 0.47, cy, 0, 1.45, 3);
  loft(b, [[L * 0.22, cy + 0.5, 0.05, 0.35], [L * 0.12, cy + 0.5, 0.45, 0.38], [-L * 0.22, cy + 0.45, 0.32, 0.32], [-L * 0.28, cy + 0.4, 0.05, 0.1]], WIN, WIN);
  wing(b, L * 0.2, 2.3, 1.2, S / 2, cy - 0.45, 0.22, 0.45, 0.35, 0);
  wing(b, -L * 0.4, 1.2, 0.7, 2.2, cy + 0.25, 0.1);
  b.prism([[-L * 0.5, cy + 0.2], [-L * 0.38, cy + 0.25], [-L * 0.45, H], [-L * 0.5 + 0.05, H - 0.1]], -0.05, 0.05, HULL, 0);
  for (const s of [-1, 1]) {
    const z = s * 1.85;
    loft(b, [[L * 0.38, 0.45, 0.06, 0.1], [L * 0.28, 0.32, 0.32, 0.36], [0, 0.35, 0.36, 0.4], [-L * 0.24, 0.42, 0.22, 0.26], [-L * 0.3, 0.5, 0.05, 0.06]], HULL, 'belly', z);
    strut(b, [L * 0.18, 0.6, z], [L * 0.16, cy - 0.5, s * 1.3], 0.07);
    strut(b, [-L * 0.02, 0.65, z], [-L * 0.02, cy - 0.5, s * 1.3], 0.07);
    strut(b, [L * 0.1, 0.6, z], [L * 0.16, cy - 0.3, s * 0.4], 0.05);
  }
  balkenkreuz(b, -L * 0.02, cy - 0.32, 4.6, 0.9); balkenkreuz(b, -L * 0.02, cy - 0.32, -4.6, 0.9);
}

/** Fairey Seafox：双浮筒双翼侦察机，尖头直列发动机，封闭后座 */
export function seafox(b: B) {
  const { lengthM: L, widthM: S, heightM: H } = MODEL_SPECS.seafox;
  const cy = H * 0.58;
  loft(b, [[L * 0.47, cy, 0.25, 0.25], [L * 0.38, cy, 0.5, 0.45], [L * 0.15, cy, 0.58, 0.48], [-L * 0.15, cy + 0.05, 0.46, 0.38], [-L * 0.4, cy + 0.2, 0.2, 0.16], [-L * 0.5, cy + 0.28, 0.06, 0.05]], HULL, 'belly');
  prop(b, L * 0.48, cy, 0, 1.3, 2);
  loft(b, [[L * 0.05, cy + 0.45, 0.04, 0.3], [-L * 0.02, cy + 0.45, 0.32, 0.33], [-L * 0.2, cy + 0.42, 0.28, 0.3], [-L * 0.26, cy + 0.4, 0.04, 0.12]], WIN, WIN);
  const yl = cy - 0.55, yu = H - 0.25;
  wing(b, L * 0.24, 1.75, 1.6, S / 2, yl, 0.14, 0.2, 0.15, 0.4);
  wing(b, L * 0.3, 1.75, 1.6, S / 2, yu, 0.14, 0.2, 0.05, 0);
  for (const s of [-1, 1]) for (const zz of [1.2, S / 2 - 1.0]) {
    strut(b, [L * 0.2, yl + 0.1, s * zz], [L * 0.25, yu - 0.07, s * zz]);
    strut(b, [L * 0.07, yl + 0.1, s * zz], [L * 0.12, yu - 0.07, s * zz]);
  }
  wing(b, -L * 0.38, 1.1, 0.7, 1.9, cy + 0.2, 0.08);
  b.prism([[-L * 0.5, cy + 0.2], [-L * 0.38, cy + 0.25], [-L * 0.46, H - 0.6], [-L * 0.5, H - 0.62]], -0.05, 0.05, HULL, 0);
  for (const s of [-1, 1]) {
    const z = s * 1.6;
    loft(b, [[L * 0.36, 0.42, 0.05, 0.08], [L * 0.26, 0.3, 0.3, 0.32], [-L * 0.05, 0.32, 0.32, 0.34], [-L * 0.24, 0.4, 0.15, 0.18], [-L * 0.3, 0.46, 0.04, 0.05]], HULL, 'belly', z);
    strut(b, [L * 0.2, 0.55, z], [L * 0.2, yl, s * 0.6], 0.06);
    strut(b, [0, 0.6, z], [0, yl, s * 0.6], 0.06);
  }
  roundel(b, L * 0.1, yu + 0.08, 4.4, 0.55, 'up'); roundel(b, L * 0.1, yu + 0.08, -4.4, 0.55, 'up');
}

/** Supermarine Walrus：水陆两栖船身，推进式发动机，双翼，翼尖浮筒 */
export function walrus(b: B) {
  const { lengthM: L, widthM: S, heightM: H } = MODEL_SPECS.walrus;
  const hy = 1.75;
  loft(b, [[L * 0.47, hy + 0.15, 0.25, 0.3], [L * 0.38, hy + 0.1, 0.72, 0.68], [L * 0.1, hy, 0.85, 0.75], [-L * 0.12, hy + 0.1, 0.7, 0.6], [-L * 0.34, hy + 0.5, 0.36, 0.3], [-L * 0.5, hy + 0.8, 0.12, 0.1]], HULL, 'belly');
  b.box([2.2, 0.6, 1.3], [L * 0.3, hy + 0.85, 0], WIN);
  const yl = hy + 0.35, yu = H - 0.8;
  wing(b, L * 0.18, 1.9, 1.7, S / 2, yl, 0.15, 0.3, 0.25, 0.6);
  wing(b, L * 0.18, 1.9, 1.7, S / 2, yu, 0.15, 0.3, 0.15, 0);
  for (const s of [-1, 1]) {
    for (const zz of [2.6, S / 2 - 1.2]) { strut(b, [L * 0.12, yl, s * zz], [L * 0.12, yu, s * zz]); strut(b, [L * 0.0, yl, s * zz], [L * 0.0, yu, s * zz]); }
    loft(b, [[L * 0.14, yl - 0.5, 0.05, 0.08], [L * 0.08, yl - 0.55, 0.2, 0.18], [-L * 0.06, yl - 0.5, 0.12, 0.12]], HULL, 'belly', s * (S / 2 - 1.1));
    strut(b, [L * 0.06, yl - 0.4, s * (S / 2 - 1.1)], [L * 0.06, yl, s * (S / 2 - 1.1)]);
    b.wheelDisc(L * 0.12, 0.42, s * 1.15, 0.42, 0.2, b.n(14, 6), 'rubber');
    strut(b, [L * 0.12, 0.42, s * 1.15], [L * 0.14, hy - 0.2, s * 0.6], 0.06);
  }
  // 推进式发动机吊舱（两翼之间，桨叶朝后）
  loft(b, [[L * 0.2, (yl + yu) / 2 + 0.1, 0.4, 0.4], [L * 0.05, (yl + yu) / 2 + 0.1, 0.48, 0.48], [-L * 0.05, (yl + yu) / 2 + 0.1, 0.25, 0.25]], HULL);
  prop(b, -L * 0.06, (yl + yu) / 2 + 0.1, 0, 1.55, 4, -1);
  for (const s of [-1, 1]) strut(b, [L * 0.1, yl + 0.1, s * 0.5], [L * 0.1, (yl + yu) / 2, s * 0.25]);
  b.prism([[-L * 0.5, hy + 0.8], [-L * 0.36, hy + 0.6], [-L * 0.42, H], [-L * 0.5 + 0.1, H - 0.05]], -0.06, 0.06, HULL, 0);
  wing(b, -L * 0.36, 1.2, 0.9, 2.4, H - 0.6, 0.1);
  roundel(b, L * 0.1, yu + 0.08, 5.0, 0.6, 'up'); roundel(b, L * 0.1, yu + 0.08, -5.0, 0.6, 'up');
}

/** 舰上放置舰载机（仅卡片版；实例版用简化十字） */
function aircraftOn(b: B, kind: 'ar196' | 'seafox' | 'walrus', x: number, y: number, z = 0, yaw = 0) {
  b.with({ p: [x, y, z], r: [0, yaw, 0] }, () => {
    if (b.hi) { if (kind === 'ar196') ar196(b); else if (kind === 'seafox') seafox(b); else walrus(b); return; }
    const sp = MODEL_SPECS[kind];
    b.box([sp.lengthM, 1.0, 0.9], [0, sp.heightM * 0.6, 0], HULL);
    b.box([1.8, 0.2, sp.widthM * 0.95], [sp.lengthM * 0.12, sp.heightM * 0.6, 0], HULL);
  });
}

// ---------- 舰型 ----------
/** 沙盘需要的舰型元数据（模型坐标，龙骨为 y=0） */
export interface ShipMeta {
  draftM: number;
  deck: V2[]; // 甲板边线（同 HullDef.deck）
  funnels: V3[]; // 烟囱顶中心
  bridge: V3; // 舰桥视点
  mastTop: number;
}
export const SHIP_META: Record<string, ShipMeta> = {};
function meta(id: string, h: Hull, funnels: V3[], bridge: V3) {
  SHIP_META[id] = { draftM: h.d.T, deck: h.d.deck, funnels, bridge, mastTop: MODEL_SPECS[id]?.heightM ?? 40 };
}

/** 施佩伯爵海军上将号（德意志级装甲舰，1939 年 12 月状态） */
export function grafSpee(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.graf_spee;
  const h = new Hull({
    L, B: Bm, T: 7.3,
    deck: [[-93, 10.2], [-62, 10.0], [-41.2, 10.3], [-40.8, 12.7], [-10, 12.6], [30, 12.9], [60, 13.8], [93, 15.8]],
    stem: [[0, 84.5], [3.3, 88.2], [7.3, 89.6], [11.5, 91], [15.8, 93]],
    stern: [[0, -79], [4.4, -88], [7.3, -91.6], [10.2, -93]],
    entry: 0.3, run: 0.2, transom: 0.3, flare: 0.75,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  // 前主炮塔「安东」
  barbette(b, 44.6, D(44.6), D(44.6) + 0.9, 5.0);
  turret(b, 44.6, D(44.6) + 0.9, T_DE28, 1);
  if (b.hi) b.tris([[[57, D(57), -4.5], [60, D(60), 0], [60, D(60) + 1.0, 0]], [[57, D(57), -4.5], [60, D(60) + 1.0, 0], [57, D(57) + 1.0, -4.5]],
    [[57, D(57), 4.5], [60, D(60), 0], [60, D(60) + 1.0, 0]], [[57, D(57), 4.5], [60, D(60) + 1.0, 0], [57, D(57) + 1.0, 4.5]]], HULL, undefined, true);
  // 司令塔（带测距仪罩）与前部上层建筑
  const d0 = 12.85;
  b.cyl([33.5, d0, 0], [33.5, d0 + 4.2, 0], 2.6, 2.5, b.n(16, 8), HULL);
  b.box([2.2, 1.3, 7.2], [33.2, d0 + 4.8, 0], HULL);
  house(b, 19, 32, 6.2, d0, d0 + 2.7);
  house(b, 20, 31, 5.4, d0 + 2.7, d0 + 5.3);
  windows(b, 20.2, 30.8, 5.25, d0 + 4.6);
  b.box([5.5, 0.35, 11.2], [27.5, d0 + 5.5, 0], TONE);
  house(b, 22, 29, 3.8, d0 + 5.6, d0 + 7.6);
  windows(b, 22.2, 28.8, 3.65, d0 + 7.0, 0.55);
  // 塔式前桅：测距指挥所 + Seetakt 雷达「床垫」 + 顶桅
  oval(b, [23.5, d0, 0], [23.5, d0 + 24.5, 0], 2.7, 2.3, HULL, null, 0, 2.2, 2.0);
  platform(b, 23.5, d0 + 9.5, 4.4);
  platform(b, 23.2, d0 + 14, 3.6);
  platform(b, 23.2, d0 + 18.4, 3.4);
  b.cyl([23.5, d0 + 19, 0], [23.5, d0 + 22.6, 0], 3.1, 2.9, b.n(18, 8), HULL);
  b.sphere([23.5, d0 + 22.6, 0], [3.0, 1.6, 2.9], HULL, b.n(18, 8), b.n(8, 4));
  b.box([2.4, 1.7, 10.4], [23.2, d0 + 21, 0], HULL);
  b.box([1.4, 0.9, 3.4], [23.5, d0 + 24.3, 0], HULL);
  b.box([0.35, 2.2, 5.8], [25.3, d0 + 25.6, 0], 'dark');
  if (b.hi) for (let i = 0; i < 6; i++) b.box([0.4, 0.06, 5.8], [25.35, d0 + 24.7 + i * 0.36, 0], TONE);
  pole(b, [23.3, d0 + 26.5, 0], [23.3, 45.5, 0], 0.32, 0.14);
  yard(b, 23.3, 41, 8.5);
  // 中部甲板室、烟囱（斜切烟囱帽）
  house(b, -20, 19.5, 5.6, 12.6, 15.2);
  funnel(b, -1.5, 15.2, 27.2, 9.4, 6.2, 0.07, 1.6, HULL, 0.14);
  if (b.hi) b.cyl([-2, 21.8, 0], [-2, 22.1, 0], 5.4, 5.4, 20, TONE);
  // SL-4 高炮指挥仪（球罩）
  for (const s of [-1, 1]) { b.cyl([12, 15.2, s * 3.4], [12, 16.4, s * 3.4], 0.9, 1.0, b.n(10, 5), HULL); b.sphere([12, 17.2, s * 3.4], [1.5, 1.4, 1.5], HULL, b.n(14, 6), b.n(8, 4)); }
  // 15 厘米副炮（每舷 4 座，舷侧单装炮塔）
  for (const s of [-1, 1]) for (const [x, f] of [[16.5, 1], [8.5, 1], [-6, -1], [-14, -1]] as const) turret(b, x, D(x), T_DE15, f, s * 7.6);
  // 弹射器 + Ar 196、吊车
  catapult(b, -13.5, 16.0, 14.5);
  aircraftOn(b, 'ar196', -13.5, 16.3);
  for (const s of [-1, 1]) crane(b, -8.5, 15.2, s * 4.4, 8.5, 5.5, s * Math.PI * 0.5);
  // 小艇
  for (const s of [-1, 1]) { boat(b, 4, 15.2, s * 4.2, 9.5, 2.4); boat(b, -22.5, D(-22.5), s * 7.8, 7, 2.0); }
  // 主桅（带撑杆）
  pole(b, [-22, 15.2, 0], [-22, 33.5, 0], 0.42, 0.2);
  for (const s of [-1, 1]) pole(b, [-25.5, 12.6, s * 2.6], [-22, 24, 0], 0.25, 0.2);
  yard(b, -22, 29.5, 7.5);
  // 后部上层建筑与后测距仪、10.5 厘米双联高炮
  house(b, -38.5, -26.5, 5.4, 12.6, 15.4);
  house(b, -36.5, -29.5, 3.8, 15.4, 18.0);
  b.cyl([-33.5, 18, 0], [-33.5, 20.2, 0], 2.0, 1.9, b.n(14, 6), HULL);
  b.box([1.6, 1.2, 7.2], [-33.5, 19.6, 0], HULL);
  for (const s of [-1, 1]) turret(b, -30.5, 12.6, T_DE105, 1, s * 6.9, s * 0.3);
  turret(b, -27.6, 15.4, T_DE105, 1);
  // 后主炮塔「布鲁诺」与后甲板四联装鱼雷发射管
  barbette(b, -48, D(-48), D(-48) + 0.9, 5.0);
  turret(b, -48, D(-48) + 0.9, T_DE28, -1);
  for (const s of [-1, 1]) tubes(b, -69, D(-69), s * 4.6, 4, Math.PI + s * 0.35, 6.4);
  anchors(b, h, 84);
  staffs(b, h, L);
  meta('graf_spee', h, [[-2.4, 27.2, 0]], [27, d0 + 8.2, 0]);
}

/** 埃克塞特号（约克级重巡洋舰改型：直立双烟囱、三座双联 8 英寸炮塔） */
export function exeter(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.exeter;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 6.2,
    deck: [[-hl, 11.3], [-50, 11.4], [-46.2, 11.5], [-45.8, 13.8], [0, 13.8], [40, 14.4], [hl, 16.3]],
    stem: [[0, hl - 6.5], [3, hl - 3.3], [6.2, hl - 2.5], [16.3, hl]],
    stern: [[0, -hl + 12.5], [3.7, -hl + 3.2], [6.2, -hl + 1.2], [11.3, -hl]],
    entry: 0.32, run: 0.2, transom: 0.25, flare: 0.5,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  turret(b, 52, D(52) + 0.6, T_RN8, 1);
  barbette(b, 52, D(52), D(52) + 0.6, 3.6);
  barbette(b, 40.5, D(40.5), D(40.5) + 3.0, 3.8);
  turret(b, 40.5, D(40.5) + 3.0, T_RN8, 1);
  // 箱形舰桥 + 指挥仪
  const d0 = 13.9;
  house(b, 21.5, 33, 5.6, d0, d0 + 2.8);
  house(b, 22.5, 32, 5.0, d0 + 2.8, d0 + 5.6);
  windows(b, 22.7, 31.8, 4.85, d0 + 4.9);
  house(b, 24, 31.5, 4.4, d0 + 5.6, d0 + 7.6);
  windows(b, 24.2, 31.3, 4.25, d0 + 7.0, 0.5);
  b.box([5, 0.3, 9.8], [28.5, d0 + 7.75, 0], TONE);
  b.cyl([28.8, d0 + 7.9, 0], [28.8, d0 + 9.3, 0], 1.3, 1.3, b.n(12, 6), HULL);
  b.box([2.6, 1.8, 3.4], [28.8, d0 + 10.2, 0], HULL);
  // 三脚前桅
  tripod(b, 21, d0 + 2.8, 42.5, 33, 3.6, 2.2, 0.5);
  b.box([3.2, 1.4, 3.2], [21, 33.8, 0], HULL);
  pole(b, [21, 42.5, 0], [21, 44.5, 0], 0.18, 0.1);
  yard(b, 21, 39.5, 9);
  // 直立双烟囱
  house(b, -15, 17, 4.4, 13.8, 15.8);
  funnel(b, 9.5, 15.8, 28.5, 7.0, 4.6, 0, 1.4);
  funnel(b, -6.5, 15.8, 28.5, 7.0, 4.6, 0, 1.4);
  for (const s of [-1, 1]) { boat(b, 1.5, 15.8, s * 3.3, 8, 2.2); boat(b, -12, D(-12), s * 6.6, 6.5, 1.9); }
  // 4 英寸高炮（单装）
  for (const s of [-1, 1]) for (const x of [3, -2.5]) turret(b, x, D(x), T_RN4, 1, s * 6.6);
  // 双固定弹射器（V 形）+ 海象式
  house(b, -30, -18, 3.4, 13.8, 15.6);
  for (const s of [-1, 1]) catapult(b, -26, 16.0, 11, -s * 0.7, s * 1.2);
  aircraftOn(b, 'walrus', -24.5, 16.3, 2.4, -0.7);
  crane(b, -17.5, 15.6, 0, 7.5, 8, Math.PI * 0.6);
  // 主桅、后部上层建筑、Y 炮塔
  house(b, -45, -36.5, 4.2, 13.8, 16.4);
  pole(b, [-37.5, 16.4, 0], [-37.5, 38, 0], 0.4, 0.18);
  for (const s of [-1, 1]) pole(b, [-41, 16.4, s * 2], [-37.5, 28, 0], 0.25, 0.2);
  yard(b, -37.5, 34, 7);
  for (const s of [-1, 1]) tubes(b, -33, D(-33), s * 6.2, 3, s * 1.2, 6);
  barbette(b, -63, D(-63), D(-63) + 0.6, 3.6);
  turret(b, -63, D(-63) + 0.6, T_RN8, -1);
  whiteEnsign(b, -hl + 1.6, 13.6);
  anchors(b, h, hl - 8);
  staffs(b, h, L);
  meta('exeter', h, [[9.5, 28.5, 0], [-6.5, 28.5, 0]], [29, d0 + 8, 0]);
}

/** 利安德级轻巡洋舰（阿贾克斯号 / 阿基里斯号）：四座双联 6 英寸炮塔、单个粗大合并烟囱 */
export function leander(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.leander;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 5.8,
    deck: [[-hl, 10.0], [-56, 10.1], [-53.2, 10.2], [-52.8, 12.5], [0, 12.4], [40, 12.9], [hl, 14.6]],
    stem: [[0, hl - 6], [2.9, hl - 2.9], [5.8, hl - 2.0], [14.6, hl]],
    stern: [[0, -hl + 11.5], [3.5, -hl + 2.5], [5.8, -hl + 0.9], [10, -hl]],
    entry: 0.33, run: 0.2, transom: 0.25, flare: 0.5,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  barbette(b, 47, D(47), D(47) + 0.5, 3.0);
  turret(b, 47, D(47) + 0.5, T_RN6, 1);
  barbette(b, 37.5, D(37.5), D(37.5) + 2.7, 3.2);
  turret(b, 37.5, D(37.5) + 2.7, T_RN6, 1);
  const d0 = 12.5;
  house(b, 19, 30, 5.2, d0, d0 + 2.7);
  house(b, 20, 29, 4.6, d0 + 2.7, d0 + 5.4);
  windows(b, 20.2, 28.8, 4.45, d0 + 4.7);
  house(b, 21.5, 28.5, 4.0, d0 + 5.4, d0 + 7.3);
  windows(b, 21.7, 28.3, 3.85, d0 + 6.7, 0.5);
  b.box([5, 0.3, 9.2], [25.5, d0 + 7.45, 0], TONE);
  b.cyl([25.5, d0 + 7.6, 0], [25.5, d0 + 9, 0], 1.2, 1.2, b.n(12, 6), HULL);
  b.box([2.4, 1.7, 3.2], [25.5, d0 + 9.8, 0], HULL);
  tripod(b, 18.5, d0 + 2.7, 39.5, 31, 3.4, 2.0, 0.48);
  b.box([3, 1.3, 3], [18.5, 31.6, 0], HULL);
  pole(b, [18.5, 39.5, 0], [18.5, 41.8, 0], 0.16, 0.1);
  yard(b, 18.5, 37, 8.5);
  // 合并大烟囱
  house(b, -12, 13, 4.2, 12.4, 14.4);
  funnel(b, -1.5, 14.4, 26.4, 11.2, 6.4, 0.05, 1.5);
  for (const s of [-1, 1]) { boat(b, 8.5, 14.4, s * 3.0, 7.5, 2.1); boat(b, -11, D(-11), s * 6.3, 6.5, 1.9); }
  for (const s of [-1, 1]) for (const x of [-9, -15.5]) turret(b, x, D(x), T_RN4, 1, s * 6.0);
  // 回转弹射器 + 海狐式（阿贾克斯号）
  catapult(b, -24, 14.6, 15.5);
  aircraftOn(b, 'seafox', -23.5, 14.9);
  crane(b, -17.5, 12.4, 5.2, 9, 8, Math.PI);
  pole(b, [-33.5, 12.4, 0], [-33.5, 37, 0], 0.38, 0.17);
  for (const s of [-1, 1]) pole(b, [-37, 12.4, s * 2], [-33.5, 26, 0], 0.24, 0.18);
  yard(b, -33.5, 33, 7);
  house(b, -45.5, -37, 3.6, 12.4, 15.0);
  b.cyl([-41, 15, 0], [-41, 16.4, 0], 1.1, 1.1, b.n(10, 5), HULL);
  for (const s of [-1, 1]) tubes(b, -40, D(-40), s * 6.0, 4, s * 1.25, 6);
  barbette(b, -47.5, D(-47.5), D(-47.5) + 1.4, 3.2);
  turret(b, -47.5, D(-47.5) + 1.4, T_RN6, -1);
  barbette(b, -60, D(-60), D(-60) + 0.5, 3.0);
  turret(b, -60, D(-60) + 0.5, T_RN6, -1);
  whiteEnsign(b, -hl + 1.6, 12.6);
  anchors(b, h, hl - 7);
  staffs(b, h, L);
  meta('leander', h, [[-2.2, 26.4, 0]], [26, d0 + 7.8, 0]);
}

/** 肯特级重巡洋舰（坎伯兰号）：平甲板高干舷、三座高烟囱、四座双联 8 英寸炮塔、大型机库 */
export function county(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.county;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 6.5,
    deck: [[-hl, 14.4], [-40, 14.8], [20, 15.2], [60, 15.8], [hl, 17.2]],
    stem: [[0, hl - 7], [3.2, hl - 3], [6.5, hl - 2], [17.2, hl]],
    stern: [[0, -hl + 12], [4, -hl + 2.5], [6.5, -hl + 1], [14.4, -hl]],
    entry: 0.33, run: 0.2, transom: 0.28, flare: 0.5,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  barbette(b, 61, D(61), D(61) + 0.6, 3.6); turret(b, 61, D(61) + 0.6, T_RN8, 1);
  barbette(b, 49, D(49), D(49) + 3.0, 3.8); turret(b, 49, D(49) + 3.0, T_RN8, 1);
  const d0 = D(35);
  house(b, 30, 41, 5.4, d0, d0 + 2.8);
  house(b, 31, 40, 4.8, d0 + 2.8, d0 + 5.6);
  windows(b, 31.2, 39.8, 4.65, d0 + 4.9);
  house(b, 32.5, 39, 4.2, d0 + 5.6, d0 + 7.4);
  b.box([5, 0.3, 9.6], [36, d0 + 7.55, 0], TONE);
  b.box([2.6, 1.8, 3.4], [36, d0 + 8.6, 0], HULL);
  tripod(b, 29.5, d0 + 2.8, 46.5, 36, 3.6, 2.2, 0.5);
  b.box([3.2, 1.4, 3.2], [29.5, 37, 0], HULL);
  pole(b, [29.5, 46.5, 0], [29.5, 48.5, 0], 0.16, 0.1);
  yard(b, 29.5, 43, 9.5);
  house(b, -18, 22, 4.4, 15.2, 17.2);
  for (const x of [16, 2, -12]) funnel(b, x, 17.2, 33.2, 6.2, 4.2, 0.04, 1.3);
  for (const s of [-1, 1]) { boat(b, 9, 17.2, s * 3.2, 7.5, 2.1); boat(b, -5, 17.2, s * 3.2, 7.5, 2.1); }
  for (const s of [-1, 1]) for (const x of [9, -5]) turret(b, x, D(x), T_RN4, 1, s * 7.6, s * 0.5);
  // 机库（1930 年代改装）
  house(b, -36, -21, 6.0, 15.0, 22.0, HULL, 0.2);
  aircraftOn(b, 'walrus', -28.5, 22.0);
  for (const s of [-1, 1]) crane(b, -20, 15.0, s * 6.4, 12, 3.5, s * Math.PI * 0.5);
  tripod(b, -40, 15, 40, 30, 3.2, 2.0, 0.42);
  yard(b, -40, 36, 8);
  barbette(b, -57, D(-57), D(-57) + 3.0, 3.8); turret(b, -57, D(-57) + 3.0, T_RN8, -1);
  barbette(b, -69, D(-69), D(-69) + 0.6, 3.6); turret(b, -69, D(-69) + 0.6, T_RN8, -1);
  whiteEnsign(b, -hl + 1.6, 16.6);
  anchors(b, h, hl - 8);
  staffs(b, h, L);
  meta('county', h, [[16, 33.2, 0], [2, 33.2, 0], [-12, 33.2, 0]], [37, d0 + 8, 0]);
}

/** 声望号战列巡洋舰（1939 年重建后：塔式舰桥、三座双联 15 英寸炮塔、双烟囱） */
export function renown(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.renown;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 8.6,
    deck: [[-hl, 13.8], [-60, 13.9], [-52.2, 14.0], [-51.8, 16.5], [0, 16.4], [60, 17.0], [hl, 18.6]],
    stem: [[0, hl - 9], [4.3, hl - 3.6], [8.6, hl - 2.4], [18.6, hl]],
    stern: [[0, -hl + 17], [5, -hl + 4], [8.6, -hl + 1.5], [13.8, -hl]],
    entry: 0.35, run: 0.22, transom: 0.3, flare: 0.4, bilge: 0.78,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  barbette(b, 80, D(80), D(80) + 0.8, 5.2); turret(b, 80, D(80) + 0.8, T_RN15, 1);
  barbette(b, 65, D(65), D(65) + 3.6, 5.4); turret(b, 65, D(65) + 3.6, T_RN15, 1);
  const d0 = D(48);
  house(b, 40, 56, 8.0, d0, d0 + 4.4);
  house(b, 42, 54, 6.6, d0 + 4.4, d0 + 9.4);
  house(b, 44, 53, 5.6, d0 + 9.4, d0 + 14.4);
  windows(b, 44.2, 52.8, 5.45, d0 + 13.6, 0.6);
  house(b, 45, 51.5, 4.6, d0 + 14.4, d0 + 17.6);
  windows(b, 45.2, 51.3, 4.45, d0 + 16.9, 0.6);
  b.box([6, 0.3, 12], [48.5, d0 + 17.75, 0], TONE);
  b.box([3.2, 2.2, 4], [48.5, d0 + 19.1, 0], HULL);
  tripod(b, 41.5, d0 + 4.4, 58, 46, 3.6, 2.6, 0.55);
  pole(b, [41.5, 58, 0], [41.5, 60, 0], 0.18, 0.1);
  yard(b, 41.5, 54, 11);
  house(b, -16, 28, 5.6, 16.4, 19.2);
  funnel(b, 21, 19.2, 33.2, 9.6, 7.0, 0.06, 1.5);
  funnel(b, -8, 19.2, 33.2, 9.6, 7.0, 0.06, 1.5);
  // 两舷机库 + 横贯甲板的弹射器
  for (const s of [-1, 1]) b.box([12, 6, 6.6], [5, 19.4, s * 8.4], HULL);
  b.with({ p: [5, 23, 0], r: [0, Math.PI / 2, 0] }, () => b.box([17, 0.6, 1.2], [0, 0, 0], TONE));
  for (const s of [-1, 1]) { boat(b, 14, 19.2, s * 4.4, 9, 2.4); boat(b, -2, 19.2, s * 4.4, 9, 2.4); }
  for (const s of [-1, 1]) {
    for (const x of [36, 29, 22]) turret(b, x, D(x), T_RN45, 1, s * 12.4, s * 0.6);
    for (const x of [-33, -40]) turret(b, x, D(x), T_RN45, -1, s * 12.4, -s * 0.6);
  }
  house(b, -46, -28, 5.4, 16.4, 21.4);
  b.box([2.8, 1.8, 3.6], [-40, 22.4, 0], HULL);
  pole(b, [-29, 21.4, 0], [-29, 50, 0], 0.45, 0.2);
  yard(b, -29, 45, 9);
  barbette(b, -80, D(-80), D(-80) + 0.8, 5.2); turret(b, -80, D(-80) + 0.8, T_RN15, -1);
  whiteEnsign(b, -hl + 1.8, 16.4);
  anchors(b, h, hl - 10);
  staffs(b, h, L);
  meta('renown', h, [[21, 33.2, 0], [-8, 33.2, 0]], [49, d0 + 18, 0]);
}

/** 皇家方舟号航空母舰：封闭双层机库、全通飞行甲板、艉部下弯、右舷舰岛 */
export function arkRoyal(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.ark_royal;
  const hl = L / 2;
  const h = new Hull({
    L: L - 8, B: Bm, T: 8.5,
    deck: [[-hl, 18.6], [-90, 18.7], [80, 19.3], [100, 21.5], [hl, 26.6]],
    stem: [[0, hl - 10], [4, hl - 4.5], [8.5, hl - 3.2], [26.6, hl]],
    stern: [[0, -hl + 22], [5, -hl + 14], [8.5, -hl + 11], [18.6, -hl + 8]],
    entry: 0.34, run: 0.2, transom: 0.5, flare: 1.0, bilge: 0.8,
  });
  h.build(b, HULL);
  // 机库侧壁（与舰体舷侧齐平）
  const seg = b.hi ? 14 : 6;
  const x0 = -hl + 8.5, x1 = hl - 14;
  for (let i = 0; i < seg; i++) {
    const a = lerp(x0, x1, i / seg), c = lerp(x0, x1, (i + 1) / seg);
    const w = Math.min(h.halfAtDeck(a), h.halfAtDeck(c)) - 0.1;
    b.frustum(a, c, w, a, c, w, Math.min(h.deckAt(a), h.deckAt(c)) - 0.2, 27.6, HULL, 0);
  }
  // 飞行甲板 + 艉部下弯
  const top = 28.4, W = Bm / 2;
  plan(b, [[-110, -W * 0.98], [100, -W], [110, -W * 0.8], [116, -W * 0.45], [116, W * 0.45], [110, W * 0.8], [100, W], [-110, W * 0.98]],
    [[-110, -W * 0.98], [100, -W], [110, -W * 0.8], [116, -W * 0.45], [116, W * 0.45], [110, W * 0.8], [100, W], [-110, W * 0.98]], 27.6, top, 'wood');
  b.poly([[-hl, 26.0, -W * 0.68], [-110, 27.6, -W * 0.98], [-110, 27.6, W * 0.98], [-hl, 26.0, W * 0.68],
    [-hl, 26.7, -W * 0.68], [-110, top, -W * 0.98], [-110, top, W * 0.98], [-hl, 26.7, W * 0.68]],
  [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'wood');
  if (b.hi) {
    for (let x = -100; x < 108; x += 9) b.box([4.5, 0.04, 0.5], [x, top + 0.02, 0], 'white');
    for (const x of [-62, 20, 74]) b.box([13, 0.03, 12], [x, top + 0.015, 0], TONE);
    // 甲板上停放的剑鱼式（简化剪影）
    for (const [x, z] of [[-78, -6], [-78, 6], [-92, 0]] as const) { b.box([11, 1.0, 1.1], [x, top + 1.3, z], HULL); b.box([1.8, 0.2, 13.5], [x + 2.4, top + 1.6, z], HULL); b.box([1.8, 0.2, 13.5], [x + 2.4, top + 3.0, z], HULL); }
  }
  // 右舷舰岛（含烟囱与三脚桅）
  const zc = W - 2.4;
  b.frustum(2, 40, 2.15, 3, 39, 2.0, top, top + 4.6, HULL, zc);
  b.frustum(6, 36, 2.0, 7, 35, 1.85, top + 4.6, top + 8.6, HULL, zc);
  b.frustum(12, 30, 1.85, 12.5, 29.5, 1.7, top + 8.6, top + 12, HULL, zc);
  if (b.hi) for (const s of [-1, 1]) b.box([16.6, 0.6, 0.06], [21, top + 11.2, zc + s * 1.78], WIN);
  oval(b, [19, top + 8.6, zc], [19, top + 15.2, zc], 5.0, 1.8, HULL);
  oval(b, [19, top + 15.2, zc], [19, top + 16.4, zc], 5.0, 1.8, BOOT, 'dark');
  for (const x of [8, 34]) { b.cyl([x, top + 8.6, zc], [x, top + 10.4, zc], 1.1, 1.1, b.n(10, 5), HULL); }
  pole(b, [30, top + 12, zc], [30, 53.6, zc], 0.38, 0.16);
  for (const s of [-1, 1]) pole(b, [26.5, top + 12, zc + s * 1.2], [30, 46, zc], 0.22, 0.18);
  b.box([0.22, 0.22, 4.4], [30, 49, zc], HULL);
  // 4.5 英寸双联炮（舷侧炮廓）
  for (const s of [-1, 1]) for (const [x, f] of [[72, 1], [62, 1], [-78, -1], [-88, -1]] as const) turret(b, x, h.deckAt(x) + 0.4, T_RN45, f, s * Math.min(11.6, h.halfAtDeck(x) - 2.6));
  whiteEnsign(b, -hl + 6, 24);
  anchors(b, h, hl - 8);
  meta('ark_royal', h, [[19, top + 16.4, zc]], [21, top + 11.5, zc]);
}

/** 阿尔特马克号补给油船（迪特马申级）：舯部舰桥、艉部机舱与烟囱、吊杆柱、步桥 */
export function tanker(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.tanker;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 9.3,
    deck: [[-hl, 15.8], [-57.2, 15.8], [-56.8, 13.1], [0, 12.9], [67.8, 13.2], [68.2, 15.9], [hl, 16.8]],
    stem: [[0, hl - 7], [4.6, hl - 2.8], [9.3, hl - 1.9], [16.8, hl]],
    stern: [[0, -hl + 11], [5, -hl + 2.6], [9.3, -hl + 1], [15.8, -hl]],
    entry: 0.28, run: 0.2, transom: 0.35, flare: 0.35, bilge: 0.88,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  // 舯部舰桥
  house(b, 10, 26, 8.2, 12.9, 15.8);
  house(b, 12, 24, 7.0, 15.8, 18.4);
  house(b, 15, 22, 5.6, 18.4, 21.0);
  windows(b, 15.2, 21.8, 5.45, 20.2, 0.6);
  b.box([4.2, 0.3, 14], [19.5, 21.15, 0], TONE);
  pole(b, [18, 21, 0], [18, 25, 0], 0.15, 0.1);
  // 步桥（舰桥 → 艉楼）
  b.box([67, 0.35, 1.0], [-23.5, 15.3, 0], TONE);
  if (b.hi) for (let x = -52; x < 10; x += 8) pole(b, [x, 12.9, 0], [x, 15.2, 0], 0.12, 0.12);
  // 吊杆柱（补给舰）
  for (const x of [52, 36, -14, -34]) {
    for (const s of [-1, 1]) pole(b, [x, D(x), s * 3.3], [x, D(x) + 13.5, s * 3.3], 0.42, 0.3, 'white');
    b.box([0.5, 0.5, 7.2], [x, D(x) + 12.5, 0], 'white');
    derricks(b, x, D(x), x > 0 ? 1 : -1, 2, 11);
  }
  if (b.hi) for (const x of [44, 28, -6, -24, -44]) b.box([7, 0.8, 7], [x, 13.3, 0], 'canvas');
  // 前桅、主桅
  pole(b, [62, D(62), 0], [62, 33.4, 0], 0.4, 0.18, 'white');
  yard(b, 62, 27.5, 7);
  pole(b, [-50, D(-50), 0], [-50, 33.4, 0], 0.4, 0.18, 'white');
  yard(b, -50, 27.5, 7);
  // 艉楼上层建筑与烟囱
  house(b, -86, -59, 8.4, 15.8, 19.2);
  house(b, -82, -63, 6.4, 19.2, 21.8);
  windows(b, -81.8, -63.2, 6.25, 21.0, 0.5, false);
  funnel(b, -72.5, 21.8, 29.6, 7.4, 5.6, 0.04, 1.8);
  for (const s of [-1, 1]) boat(b, -70, 19.2, s * 7.3, 7.5, 2.1);
  anchors(b, h, hl - 6);
  staffs(b, h, L);
  meta('tanker', h, [[-72.8, 29.6, 0]], [19, 22, 0]);
}

/** 1930 年代英国货船（三岛式：艏楼、舯部桥楼、艉楼；单烟囱、双桅吊杆） */
export function merchant(b: B) {
  const { lengthM: L, widthM: Bm } = MODEL_SPECS.merchant;
  const hl = L / 2;
  const h = new Hull({
    L, B: Bm, T: 7.6,
    deck: [[-hl, 14.8], [-51.2, 14.6], [-50.8, 12.0], [-10.2, 11.8], [-9.8, 14.4], [15.8, 14.4], [16.2, 11.8], [49.8, 12.0], [50.2, 14.7], [hl, 15.6]],
    stem: [[0, hl - 6], [3.8, hl - 2.2], [7.6, hl - 1.5], [15.6, hl]],
    stern: [[0, -hl + 9.5], [4, -hl + 2.5], [7.6, -hl + 1], [14.8, -hl]],
    entry: 0.3, run: 0.22, transom: 0.3, flare: 0.3, bilge: 0.88,
  });
  h.build(b);
  const D = (x: number) => h.deckAt(x);
  house(b, -7, 12.5, 6.4, 14.4, 16.9, 'white');
  house(b, -4, 10, 5.4, 16.9, 19.2, 'white');
  house(b, 5, 10.2, 4.2, 19.2, 21.4, 'white');
  windows(b, 5.2, 10, 4.05, 20.6, 0.6);
  b.box([3.6, 0.25, 11.6], [8.2, 21.5, 0], 'white');
  funnel(b, -1.5, 19.2, 29.2, 5.0, 4.2, 0.1, 1.8, 'yellow');
  for (const s of [-1, 1]) boat(b, -4.5, 16.9, s * 5.2, 6.5, 1.9);
  if (b.hi) for (const [x, z] of [[2.5, 2.6], [2.5, -2.6]] as const) { b.cyl([x, 19.2, z], [x, 21.4, z], 0.35, 0.35, 8, 'white'); b.sphere([x + 0.2, 21.6, z], [0.6, 0.5, 0.5], 'dark', 8, 4); }
  for (const x of [26, 42, -22, -40]) b.box([7, 0.9, 6], [x, D(x) + 0.4, 0], 'canvas');
  // 双桅（带横桁与吊杆）
  for (const [x, dir] of [[34, 1], [-31, -1]] as const) {
    pole(b, [x, D(x), 0], [x, 35.8, 0], 0.4, 0.15, 'yellow');
    yard(b, x, 26, 6.5);
    b.box([1.6, 0.8, 4.6], [x, D(x) + 3, 0], 'white');
    derricks(b, x, D(x) + 2, dir, 2, 12);
  }
  house(b, -63, -54, 4.8, D(-58), D(-58) + 2.2, 'white');
  anchors(b, h, hl - 5);
  staffs(b, h, L);
  meta('merchant', h, [[-2.4, 29.2, 0]], [8.5, 21.6, 0]);
}
