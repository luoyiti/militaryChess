/**
 * 共享部件：负重轮、主动轮、诱导轮、托带轮、履带（分节履带片 / 简化带状）、悬挂、火炮、指挥塔、舱盖、排气管、车灯、天线、工具。
 * 约定：+X 前，+Y 上，+Z 右；两侧部件在 z>0 一侧建模，调用方用 b.both() 镜像。
 */
import { B, type V2, type V3 } from './builder';
import type { Role } from './paint';

// ---------- 车轮 ----------
export type WheelStyle = 'disc' | 'spoke' | 'dish' | 'twin' | 'big' | 'car';

/** 负重轮：中心 (x,y)，外侧面 z=zc+w/2 */
export function roadWheel(b: B, x: number, y: number, zc: number, r: number, w: number, style: WheelStyle = 'disc'): void {
  if (!b.hi) {
    b.wheelDisc(x, y, zc, r, w, style === 'big' || style === 'car' ? 8 : 7, style === 'car' ? 'rubber' : 'paint');
    return;
  }
  const seg = r > 0.3 ? 22 : 16;
  if (style === 'twin') {
    const g = w * 0.18;
    for (const s of [-1, 1]) {
      const zz = zc + s * (w / 4 + g / 4);
      b.wheelDisc(x, y, zz, r, w / 2 - g / 2, seg, 'rubber');
      b.wheelDisc(x, y, zz + s * 0.004, r * 0.8, w / 2 - g / 2 + 0.01, seg, 'paint');
    }
    b.wheelDisc(x, y, zc + w / 2 + 0.01, r * 0.3, 0.02, 10, 'paint');
    b.wheelDisc(x, y, zc + w / 2 + 0.025, r * 0.15, 0.02, 8, 'metal');
    return;
  }
  if (style === 'car') {
    // 充气轮胎 + 钢圈
    b.cyl([x, y, zc - w / 2], [x, y, zc + w / 2], r * 0.96, r * 0.96, seg, 'rubber');
    b.lathe([[r * 0.96, -w * 0.5], [r, -w * 0.3], [r, w * 0.3], [r * 0.96, w * 0.5]], seg, [0, 0, 0], 'rubber', (v) => {
      const yy = v.y; v.y = -v.z; v.z = yy; v.x += x; v.y += y; v.z += zc;
    });
    b.wheelDisc(x, y, zc + 0.01, r * 0.6, w + 0.01, seg, 'paint');
    b.cyl([x, y, zc + w / 2], [x, y, zc + w / 2 + 0.03], r * 0.35, r * 0.25, 10, 'paint');
    b.wheelDisc(x, y, zc + w / 2 + 0.035, r * 0.12, 0.015, 8, 'metal');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.wheelDisc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, zc + w / 2 + 0.008, r * 0.07, 0.02, 6, 'dark');
    }
    return;
  }
  // 橡胶圈 + 轮辋
  b.wheelDisc(x, y, zc, r, w, seg, 'rubber');
  b.wheelDisc(x, y, zc, r * 0.84, w + 0.012, seg, 'paint');
  if (style === 'dish' || style === 'big') {
    b.cyl([x, y, zc + w / 2 + 0.006], [x, y, zc + w / 2 + 0.04], r * 0.8, r * 0.38, seg, 'paint');
  }
  if (style === 'spoke' || style === 'big') {
    const holes = style === 'big' ? 8 : 6;
    const zz = style === 'big' ? zc + w / 2 + 0.024 : zc + w / 2 + 0.004;
    const rr = style === 'big' ? r * 0.58 : r * 0.55;
    for (let i = 0; i < holes; i++) {
      const a = (i / holes) * Math.PI * 2 + 0.3;
      b.wheelDisc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, zz, r * 0.09, 0.012, 6, 'dark');
    }
  }
  b.wheelDisc(x, y, zc + w / 2 + 0.015, r * 0.3, 0.03, 10, 'paint');
  b.wheelDisc(x, y, zc + w / 2 + 0.035, r * 0.14, 0.02, 8, 'metal');
}

/** 主动轮（带齿） */
export function sprocket(b: B, x: number, y: number, zc: number, r: number, w: number): void {
  if (!b.hi) { b.wheelDisc(x, y, zc, r, w * 0.8, 7, 'paint'); return; }
  const teeth = Math.max(10, Math.round(r * 50));
  for (const s of [-1, 1]) {
    const zz = zc + s * w * 0.28;
    b.wheelDisc(x, y, zz, r * 0.86, w * 0.16, 18, 'paint');
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      b.box([0.05, r * 0.26, w * 0.14], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, zz], 'metal', [0, 0, a - Math.PI / 2]);
    }
  }
  b.wheelDisc(x, y, zc, r * 0.55, w * 0.62, 14, 'paint');
  b.cyl([x, y, zc + w * 0.36], [x, y, zc + w * 0.5 + 0.01], r * 0.45, r * 0.25, 12, 'paint');
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.wheelDisc(x + Math.cos(a) * r * 0.32, y + Math.sin(a) * r * 0.32, zc + w * 0.5, 0.018, 0.03, 6, 'metal');
  }
}

export function idler(b: B, x: number, y: number, zc: number, r: number, w: number, spoked = true): void {
  if (!b.hi) { b.wheelDisc(x, y, zc, r, w * 0.8, 7, 'paint'); return; }
  b.wheelDisc(x, y, zc, r, w * 0.75, 18, 'metal');
  b.wheelDisc(x, y, zc, r * 0.82, w * 0.8, 18, 'paint');
  if (spoked) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    b.wheelDisc(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, zc + w * 0.4 + 0.004, r * 0.13, 0.01, 6, 'dark');
  }
  b.wheelDisc(x, y, zc + w * 0.4, r * 0.25, 0.05, 10, 'metal');
}

export function roller(b: B, x: number, y: number, zc: number, r: number, w: number): void {
  b.wheelDisc(x, y, zc, r, w, b.n(12, 5), b.hi ? 'rubber' : 'paint');
  if (b.hi) {
    b.wheelDisc(x, y, zc + 0.01, r * 0.6, w + 0.02, 10, 'paint');
    b.box([0.05, 0.05, 0.12], [x, y, zc - w / 2 - 0.06], 'paint');
  }
}

// ---------- 履带 ----------
export interface Circle { x: number; y: number; r: number }

function hull2d(pts: V2[]): V2[] {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: V2, a: V2, c: V2) => (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up); // 逆时针
}

/** 履带中心线：各轮外包凸包（半径 + 半厚） */
export function trackPath(circles: Circle[], t: number, samples: number): V2[] {
  const pts: V2[] = [];
  for (const c of circles) {
    const R = c.r + t / 2;
    for (let i = 0; i < samples; i++) {
      const a = (i / samples) * Math.PI * 2;
      pts.push([c.x + Math.cos(a) * R, c.y + Math.sin(a) * R]);
    }
  }
  return hull2d(pts);
}

function resample(path: V2[], step: number): { p: V2; t: V2 }[] {
  const n = path.length;
  const seg: number[] = [];
  let L = 0;
  for (let i = 0; i < n; i++) { const a = path[i], c = path[(i + 1) % n]; const l = Math.hypot(c[0] - a[0], c[1] - a[1]); seg.push(l); L += l; }
  const count = Math.max(8, Math.round(L / step));
  const ds = L / count;
  const out: { p: V2; t: V2 }[] = [];
  let si = 0, acc = 0;
  for (let k = 0; k < count; k++) {
    const s = k * ds;
    while (acc + seg[si] < s) { acc += seg[si]; si = (si + 1) % n; }
    const a = path[si], c = path[(si + 1) % n];
    const f = (s - acc) / seg[si];
    const tx = (c[0] - a[0]) / seg[si], ty = (c[1] - a[1]) / seg[si];
    out.push({ p: [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f], t: [tx, ty] });
  }
  return out;
}

export interface TrackOpts { zc: number; w: number; t: number; pitch: number; horns?: 'center' | 'none' | 'alt' }

/** 履带：卡片版为分节履带片（含履齿、导齿），实例版为带状圆角条 */
export function track(b: B, circles: Circle[], o: TrackOpts): void {
  if (b.hi) {
    const path = trackPath(circles, o.t, 40);
    const links = resample(path, o.pitch);
    links.forEach((l, i) => {
      const ang = Math.atan2(l.t[1], l.t[0]);
      const nx = l.t[1], ny = -l.t[0]; // 逆时针路径的外法线
      b.box([o.pitch * 0.86, o.t, o.w], [l.p[0], l.p[1], o.zc], 'track', [0, 0, ang]);
      b.box([o.pitch * 0.22, o.t * 0.5, o.w * 0.96], [l.p[0] + nx * o.t * 0.6, l.p[1] + ny * o.t * 0.6, o.zc], 'track', [0, 0, ang]);
      const horn = o.horns ?? 'alt';
      if (horn !== 'none' && (horn === 'center' || i % 2 === 0)) {
        b.box([o.pitch * 0.4, o.t * 1.3, o.w * 0.14], [l.p[0] - nx * o.t * 1.05, l.p[1] - ny * o.t * 1.05, o.zc], 'track', [0, 0, ang]);
      }
    });
    return;
  }
  // 实例版：简化带（外表面 + 外侧面 + 内侧面 + 内表面）
  const raw = trackPath(circles, o.t, 6);
  const path: V2[] = [];
  for (let i = 0; i < raw.length; i++) {
    const a = raw[(i - 1 + raw.length) % raw.length], p = raw[i], c = raw[(i + 1) % raw.length];
    const d1 = Math.atan2(p[1] - a[1], p[0] - a[0]), d2 = Math.atan2(c[1] - p[1], c[0] - p[0]);
    let dd = Math.abs(d2 - d1); if (dd > Math.PI) dd = 2 * Math.PI - dd;
    if (dd > 0.12 || path.length === 0) path.push(p);
  }
  const n = path.length;
  const nor: V2[] = path.map((p, i) => {
    const a = path[(i - 1 + n) % n], c = path[(i + 1) % n];
    const tx = c[0] - a[0], ty = c[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l];
  });
  const h = o.t / 2, z0 = o.zc - o.w / 2, z1 = o.zc + o.w / 2;
  const tl: [V3, V3, V3][] = [];
  const out = (i: number, s: number, z: number): V3 => [path[i][0] + nor[i][0] * h * s, path[i][1] + nor[i][1] * h * s, z];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const quad = (a: V3, c: V3, d: V3, e: V3, ow: V3) => { b.tris([[a, c, d], [a, d, e]], 'track', ow); };
    const mx = (nor[i][0] + nor[j][0]) / 2, my = (nor[i][1] + nor[j][1]) / 2;
    quad(out(i, 1, z0), out(j, 1, z0), out(j, 1, z1), out(i, 1, z1), [mx, my, 0]);
    quad(out(i, -1, z0), out(j, -1, z0), out(j, -1, z1), out(i, -1, z1), [-mx, -my, 0]);
    quad(out(i, 1, z1), out(j, 1, z1), out(j, -1, z1), out(i, -1, z1), [0, 0, 1]);
    quad(out(i, 1, z0), out(j, 1, z0), out(j, -1, z0), out(i, -1, z0), [0, 0, -1]);
  }
  void tl;
}

// ---------- 火炮与武器 ----------
export interface GunOpts {
  /** 炮身根部（防盾前）位置 */
  at: V3; len: number; r0: number; r1: number;
  /** 身管前端加厚/制退器 */
  muzzle?: 'none' | 'ring' | 'brake';
  /** 根部驻退套筒长、半径 */
  sleeve?: [number, number];
  elev?: number; yaw?: number;
  role?: Role;
}
export function gun(b: B, o: GunOpts): void {
  const role = o.role ?? 'paint';
  b.with({ p: o.at, r: [0, o.yaw ?? 0, o.elev ?? 0] }, () => {
    const seg = b.n(12, 5);
    if (o.sleeve) b.cyl([0, 0, 0], [o.sleeve[0], 0, 0], o.sleeve[1], o.sleeve[1] * 0.92, seg, role);
    b.cyl([0, 0, 0], [o.len, 0, 0], o.r0, o.r1, seg, role);
    if (o.muzzle === 'ring') b.cyl([o.len - 0.06, 0, 0], [o.len, 0, 0], o.r1 * 1.35, o.r1 * 1.35, seg, role);
    if (o.muzzle === 'brake') b.box([0.12, o.r1 * 2.6, o.r1 * 3.2], [o.len - 0.05, 0, 0], role);
    if (b.hi) b.wheelDiscX(o.len + 0.002, 0, 0, o.r1 * 0.6, 0.004, 'dark');
  });
}

/** 机枪（带散热套筒） */
export function mg(b: B, at: V3, len: number, jacket = true, yaw = 0, elev = 0): void {
  b.with({ p: at, r: [0, yaw, elev] }, () => {
    if (jacket) b.cyl([0, 0, 0], [len * 0.7, 0, 0], 0.03, 0.03, b.n(8, 4), 'metal');
    b.cyl([0, 0, 0], [len, 0, 0], 0.012, 0.012, b.n(6, 3), 'metal');
  });
}

/** 指挥塔：圆柱 + 观察窗 + 舱盖 */
export function cupola(b: B, x: number, y: number, z: number, r: number, h: number, slits = 6): void {
  const seg = b.n(16, 6);
  b.cyl([x, y, z], [x, y + h, z], r, r * 0.97, seg, 'paint');
  if (b.hi) {
    for (let i = 0; i < slits; i++) {
      const a = (i / slits) * Math.PI * 2;
      b.box([0.02, h * 0.18, r * 0.5], [x + Math.cos(a) * r, y + h * 0.6, z + Math.sin(a) * r], 'dark', [0, -a, 0]);
    }
    b.cyl([x, y + h, z], [x, y + h + 0.04, z], r * 0.9, r * 0.82, seg, 'paint');
    b.box([0.08, 0.03, 0.05], [x - r * 0.7, y + h + 0.03, z], 'metal');
  } else b.cyl([x, y + h, z], [x, y + h + 0.04, z], r * 0.9, r * 0.82, seg, 'paint');
}

/** 顶部舱盖（矩形/圆形） */
export function hatch(b: B, x: number, y: number, z: number, sx: number, sz: number, round = false): void {
  if (!b.hi) { b.box([sx, 0.07, sz], [x, y + 0.035, z], 'paint'); return; }
  if (round) b.cyl([x, y, z], [x, y + 0.03, z], sx / 2, sx / 2 * 0.95, 14, 'paint');
  else b.box([sx, 0.03, sz], [x, y + 0.015, z], 'paint');
  b.box([0.04, 0.03, sz * 0.4], [x - sx * 0.35, y + 0.04, z], 'metal');
}

export type FaceDir = '+x' | '-x' | '+z' | '-z';
export const FACE_YAW: Record<FaceDir, number> = { '+x': 0, '-x': Math.PI, '+z': -Math.PI / 2, '-z': Math.PI / 2 };

/** 观察缝/观察窗块（贴在朝向 face 的表面上；slope=装甲板后仰角） */
export function visor(b: B, x: number, y: number, z: number, w: number, h: number, face: FaceDir, slope = 0): void {
  if (!b.hi) return;
  b.with({ p: [x, y, z], r: [0, FACE_YAW[face], 0] }, () => b.with({ r: [0, 0, slope] }, () => {
    b.box([0.04, h, w], [0, 0, 0], 'paint');
    b.box([0.012, h * 0.22, w * 0.8], [0.022, 0, 0], 'dark');
  }));
}

export function exhaust(b: B, x0: number, x1: number, y: number, z: number, r: number): void {
  b.cyl([x0, y, z], [x1, y, z], r, r, b.n(12, 5), 'rust');
  if (b.hi) {
    b.cyl([x0 - 0.12, y - 0.04, z], [x0, y, z], r * 0.3, r * 0.3, 6, 'rust');
    b.cyl([x1, y, z], [x1 + 0.1, y - 0.02, z], r * 0.3, r * 0.3, 6, 'dark');
  }
}

export function headlight(b: B, x: number, y: number, z: number, r = 0.08): void {
  if (!b.hi) return;
  b.cyl([x - r * 1.2, y, z], [x, y, z], r * 0.6, r, 10, 'paint');
  b.wheelDiscX(x + 0.004, y, z, r * 0.85, 0.008, 'glass');
  b.box([0.03, 0.08, 0.03], [x - r, y - r - 0.03, z], 'paint');
}

/** 折叠天线（沿车体侧面放倒） */
export function antenna(b: B, x0: number, x1: number, y: number, z: number): void {
  if (!b.hi) return;
  b.cyl([x0, y, z], [x1, y + 0.02, z], 0.008, 0.005, 5, 'metal');
  b.cyl([x0, y - 0.04, z], [x0, y + 0.02, z], 0.025, 0.025, 8, 'metal');
}

/** 挡泥板随车工具：铁锹、镐、千斤顶 */
export function tools(b: B, x: number, y: number, z: number): void {
  if (!b.hi) return;
  b.box([0.7, 0.025, 0.035], [x, y, z], 'wood');
  b.box([0.22, 0.012, 0.16], [x + 0.44, y, z], 'metal');
  b.box([0.8, 0.028, 0.03], [x - 0.9, y, z - 0.05], 'wood');
  b.box([0.34, 0.03, 0.05], [x - 0.5, y + 0.01, z], 'metal');
  b.cyl([x - 1.62, y + 0.05, z], [x - 1.4, y + 0.05, z], 0.05, 0.05, 8, 'metal');
}

/** 铆钉排（35(t)/38(t)/7TP 的铆接感） */
export function rivets(b: B, pts: V3[], faceYaw: number): void {
  if (!b.hi) return;
  for (const p of pts) b.with({ p, r: [0, faceYaw, 0] }, () => b.cyl([0, 0, 0], [0.012, 0, 0], 0.014, 0.01, 5, 'paint'));
}
export function rivetLine(a: V3, c: V3, n: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t]); }
  return out;
}

/** 片簧（弧形薄板叠） */
export function leafSpring(b: B, x0: number, x1: number, y: number, z: number, arch: number, leaves = 3): void {
  const n = b.n(6, 1);
  for (let l = 0; l < (b.hi ? leaves : 1); l++) {
    const yy = y + l * 0.022;
    const w = (x1 - x0) * (1 - l * 0.18);
    const xc = (x0 + x1) / 2;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const xa = xc - w / 2 + w * t0, xb = xc - w / 2 + w * t1;
      const ya = yy + arch * (1 - Math.pow(2 * t0 - 1, 2)), yb = yy + arch * (1 - Math.pow(2 * t1 - 1, 2));
      b.cyl([xa, ya, z], [xb, yb, z], 0.012, 0.012, 4, 'metal');
      if (!b.hi) break;
    }
  }
}
