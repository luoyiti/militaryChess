/**
 * 步兵小组、骑兵、野炮。人物用关节点 + 两段式 IK 摆姿势（身高约 1.75 m）。
 * 钢盔：德 M1935（前沿短、两侧/后沿外翻）、波 wz.31（圆顶窄檐）、苏 SSh-36（宽外翻檐 + 顶部脊）、斯洛伐克/捷 vz.32（圆顶、侧后沿下垂）。
 */
import * as THREE from 'three';
import { B, type V3 } from './builder';
import type { Role } from './paint';

export type Nation = 'de' | 'pl' | 'su' | 'sk';
const V = (a: V3) => new THREE.Vector3(...a);
const A = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];

/** 两段式 IK：根 s、末端 e、段长 l1/l2、弯曲方向 pole */
function ik(s: THREE.Vector3, e: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3): THREE.Vector3 {
  const d0 = e.clone().sub(s);
  const d = Math.min(d0.length(), l1 + l2 - 1e-3);
  const dir = d0.normalize();
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return s.clone().add(dir.multiplyScalar(a)).add(p.multiplyScalar(h));
}

// ---------- 钢盔 ----------
function helmet(b: B, n: Nation, c: THREE.Vector3, yaw: number, pitch: number): void {
  const seg = b.n(16, 5);
  const lathe = b.lathe.bind(b);
  const lp = (pts: [number, number][]) => (b.hi ? pts : pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1));
  b.with({ p: A(c), r: [0, yaw, pitch] }, () => {
    if (n === 'de') {
      // M1935：前檐短，两侧与后沿外翻（「煤斗」）
      lathe(lp([[0.155, -0.075], [0.14, -0.04], [0.128, -0.01], [0.126, 0.03], [0.112, 0.075], [0.08, 0.11], [0.04, 0.128], [0.001, 0.132]]), seg, [0, 0.02, 0], 'helmet', (v) => {
        const front = Math.max(0, v.x / 0.155);
        if (v.y < 0.0) v.y += (-v.y) * 0.85 * Math.pow(front, 1.5);
        if (v.y < -0.04) { v.x *= 1.04; v.z *= 1.06; }
      });
      if (b.hi) b.box([0.01, 0.02, 0.02], [0, 0.07, 0.123], 'helmet');
    } else if (n === 'pl') {
      // wz.31：圆顶、窄而均匀的外檐，前檐略长
      lathe(lp([[0.15, -0.035], [0.132, -0.028], [0.126, 0.0], [0.122, 0.045], [0.104, 0.09], [0.07, 0.118], [0.03, 0.13], [0.001, 0.132]]), seg, [0, 0.02, 0], 'helmet', (v) => {
        if (v.y < -0.02 && v.x > 0.06) v.x *= 1.08;
      });
    } else if (n === 'su') {
      // SSh-36：宽大外翻帽檐 + 顶部通风脊
      lathe(lp([[0.19, -0.07], [0.165, -0.045], [0.135, -0.018], [0.126, 0.03], [0.112, 0.08], [0.08, 0.115], [0.04, 0.132], [0.001, 0.136]]), seg, [0, 0.02, 0], 'helmet', (v) => {
        const front = Math.max(0, v.x / 0.19);
        if (v.y < -0.02) v.y += (-v.y - 0.02) * 0.6 * front;
      });
      b.box([0.18, 0.025, 0.035], [-0.01, 0.155, 0], 'helmet');
    } else {
      // vz.32：圆顶较高，侧后沿斜向下垂、前檐短而平
      lathe(lp([[0.15, -0.085], [0.138, -0.05], [0.13, -0.015], [0.127, 0.04], [0.11, 0.09], [0.075, 0.122], [0.035, 0.138], [0.001, 0.142]]), seg, [0, 0.015, 0], 'helmet', (v) => {
        const front = Math.max(0, v.x / 0.15);
        if (v.y < -0.01) v.y += (-v.y) * 0.9 * Math.pow(front, 0.8);
        if (v.y < -0.03) { v.x *= 1.02; v.z *= 1.08; }
      });
      if (b.hi) b.box([0.05, 0.012, 0.02], [0.02, 0.1, 0.105], 'helmet');
    }
  });
}

// ---------- 武器 ----------
export type Rifle = 'kar98' | 'wz29' | 'mosin' | 'vz24';
function rifle(b: B, butt: THREE.Vector3, muzzle: THREE.Vector3, kind: Rifle, slung = false): void {
  const d = muzzle.clone().sub(butt);
  const L = d.length();
  const at = (t: number) => A(butt.clone().add(d.clone().multiplyScalar(t / L)));
  const seg = b.n(6, 3);
  b.cyl(at(0), at(0.32), 0.03, 0.02, b.n(5, 3), 'wood');
  b.cyl(at(0.3), at(L * 0.86), 0.018, 0.016, seg, 'wood');
  b.cyl(at(0.3), at(L), 0.009, 0.008, b.n(5, 3), 'metal');
  if (b.hi) {
    b.cyl(at(0.33), at(0.42), 0.02, 0.02, 6, 'metal');
    b.sphere(at(0.36), [0.014, 0.014, 0.014], 'metal', 6, 4);
    if (kind !== 'mosin') b.cyl(at(0.45), at(0.62), 0.004, 0.004, 3, 'leather');
  }
  if (kind === 'mosin' && !slung) b.cyl(at(L), at(L + 0.45), 0.007, 0.002, b.n(4, 3), 'metal'); // 苏军常上刺刀
}

export type Lmg = 'mg34' | 'wz28' | 'dp27' | 'vz26';
function lmg(b: B, butt: THREE.Vector3, muzzle: THREE.Vector3, kind: Lmg, bipodGround: number): void {
  const d = muzzle.clone().sub(butt);
  const L = d.length();
  const dirN = d.clone().normalize();
  const at = (t: number) => A(butt.clone().add(dirN.clone().multiplyScalar(t)));
  const seg = b.n(8, 4);
  b.cyl(at(0), at(0.28), 0.04, 0.03, b.n(5, 3), kind === 'mg34' ? 'metal' : 'wood');
  b.cyl(at(0.28), at(0.55), 0.035, 0.035, b.n(6, 4), 'metal');
  b.cyl(at(0.55), at(L), kind === 'mg34' || kind === 'dp27' ? 0.03 : 0.018, 0.022, seg, 'metal');
  const mid = V(at(0.42));
  if (kind === 'dp27') b.cyl(A(mid.clone().add(new THREE.Vector3(0, 0.04, 0))), A(mid.clone().add(new THREE.Vector3(0, 0.07, 0))), 0.13, 0.13, b.n(16, 7), 'metal');
  if (kind === 'vz26') b.box([0.1, 0.16, 0.03], A(mid.clone().add(new THREE.Vector3(0, 0.1, 0))), 'metal', [0, 0, 0.2]);
  if (kind === 'wz28') b.box([0.08, 0.14, 0.03], A(mid.clone().add(new THREE.Vector3(0.04, -0.09, 0))), 'metal');
  if (kind === 'mg34' && b.hi) b.cyl(A(mid.clone().add(new THREE.Vector3(0, -0.04, 0.03))), A(mid.clone().add(new THREE.Vector3(0, -0.1, 0.12))), 0.05, 0.05, 10, 'metal');
  // 两脚架
  const bp = V(at(L * 0.82));
  for (const s of [-1, 1]) b.cyl(A(bp), [bp.x + 0.05, bipodGround, bp.z + s * 0.14], 0.008, 0.008, b.n(4, 3), 'metal');
}

// ---------- 人物 ----------
export interface Pose {
  at: V3; yaw: number;
  pelvis: V3; lean: number;
  handL: V3; handR: V3; footL: V3; footR: V3;
  kneeL?: V3; kneeR?: V3;
  headTurn?: number; headDip?: number;
  weapon?: { kind: 'rifle'; model: Rifle; butt: V3; muzzle: V3 } | { kind: 'lmg'; model: Lmg; butt: V3; muzzle: V3; ground: number } | { kind: 'sabre'; tip: V3 } | { kind: 'none' };
  rider?: boolean;
}

function limb(b: B, a: THREE.Vector3, c: THREE.Vector3, r0: number, r1: number, role: Role): void {
  b.cyl(A(a), A(c), r0, r1, b.n(6, 3), role);
}

export function figure(b: B, n: Nation, p: Pose): void {
  b.with({ p: p.at, r: [0, p.yaw, 0] }, () => {
    const P = V(p.pelvis);
    const up = new THREE.Vector3(Math.sin(p.lean), Math.cos(p.lean), 0);
    const fw = new THREE.Vector3(Math.cos(p.lean), -Math.sin(p.lean), 0);
    const Z = new THREE.Vector3(0, 0, 1);
    const neck = P.clone().add(up.clone().multiplyScalar(0.5));
    const pt = (base: THREE.Vector3, u: number, f: number, z: number) => A(base.clone().add(up.clone().multiplyScalar(u)).add(fw.clone().multiplyScalar(f)).add(Z.clone().multiplyScalar(z)));
    // 躯干（上衣）
    b.hexa([
      pt(P, -0.02, -0.1, -0.15), pt(P, -0.02, 0.1, -0.15), pt(P, -0.02, 0.1, 0.15), pt(P, -0.02, -0.1, 0.15),
      pt(P, 0.5, -0.11, -0.19), pt(P, 0.5, 0.12, -0.19), pt(P, 0.5, 0.12, 0.19), pt(P, 0.5, -0.11, 0.19),
    ], 'uniform');
    // 腰带 + 装具
    if (b.hi) b.hexa([
      pt(P, 0.12, -0.108, -0.163), pt(P, 0.12, 0.108, -0.163), pt(P, 0.12, 0.108, 0.163), pt(P, 0.12, -0.108, 0.163),
      pt(P, 0.17, -0.11, -0.168), pt(P, 0.17, 0.112, -0.168), pt(P, 0.17, 0.112, 0.168), pt(P, 0.17, -0.11, 0.168),
    ], 'leather');
    if (b.hi) {
      for (const s of [-1, 1]) b.box([0.06, 0.07, 0.07], pt(P, 0.16, 0.12, s * 0.09), 'leather');
      // Y 形背带
      for (const s of [-1, 1]) b.cyl(pt(P, 0.16, 0.112, s * 0.12), pt(P, 0.5, 0.1, s * 0.1), 0.012, 0.012, 3, 'leather');
      if (n === 'de') {
        b.cyl(pt(P, 0.02, -0.14, 0.13), pt(P, 0.3, -0.16, 0.13), 0.055, 0.055, 10, 'kit'); // 防毒面具罐
        b.box([0.05, 0.16, 0.12], pt(P, 0.14, -0.1, -0.17), 'canvas');
      } else if (n === 'pl' || n === 'sk') {
        b.box([0.1, 0.26, 0.26], pt(P, 0.34, -0.17, 0), 'kit');
        b.box([0.05, 0.14, 0.12], pt(P, 0.12, -0.08, 0.17), 'canvas');
      }
    }
    if (n === 'su') {
      // 斜挎卷起的大衣（skatka）
      b.with({ p: pt(P, 0.3, 0, 0), r: [0, 0, 0] }, () => {
        const g = new THREE.TorusGeometry(0.2, 0.045, b.n(6, 3), b.n(14, 4));
        g.scale(0.9, 1.25, 1.1);
        g.rotateY(Math.PI / 2);
        g.rotateX(0.6);
        g.rotateZ(-p.lean);
        b.add(g, 'coat');
      });
    }
    // 头
    const head = neck.clone().add(up.clone().multiplyScalar(0.15)).add(fw.clone().multiplyScalar(0.02));
    if (b.hi) b.cyl(A(neck.clone().sub(up.clone().multiplyScalar(0.02))), A(head), 0.045, 0.045, 6, 'skin');
    b.sphere(A(head), [0.098, 0.108, 0.09], 'skin', b.n(10, 5), b.n(7, 3), [0, p.headTurn ?? 0, 0]);
    if (b.hi) b.box([0.03, 0.03, 0.02], A(head.clone().add(new THREE.Vector3(0.095, -0.01, 0))), 'skin');
    helmet(b, n, head.clone().add(new THREE.Vector3(0.0, 0.035, 0)), p.headTurn ?? 0, -(p.headDip ?? 0));
    // 手臂
    for (const s of [-1, 1]) {
      const sh = V(pt(P, 0.45, 0, s * 0.2));
      const hand = V(s < 0 ? p.handL : p.handR);
      const el = ik(sh, hand, 0.29, 0.27, new THREE.Vector3(-0.3, -1, s * 0.8));
      limb(b, sh, el, 0.055, 0.048, 'uniform');
      limb(b, el, hand, 0.046, 0.038, 'uniform');
      if (b.hi) b.sphere(A(hand), [0.04, 0.045, 0.04], 'skin', 6, 4);
    }
    // 腿
    for (const s of [-1, 1]) {
      const hip = V(pt(P, 0, 0, s * 0.1));
      const foot = V(s < 0 ? p.footL : p.footR);
      const kn = (s < 0 ? p.kneeL : p.kneeR);
      const knee = kn ? V(kn) : ik(hip, foot, 0.45, 0.45, new THREE.Vector3(1, 0.1, s * 0.3));
      limb(b, hip, knee, 0.075, 0.058, 'trousers');
      const boot = foot.clone().add(knee.clone().sub(foot).multiplyScalar(0.55));
      if (b.hi) { limb(b, knee, boot, 0.056, 0.052, 'trousers'); limb(b, boot, foot, 0.055, 0.05, 'boots'); }
      else limb(b, knee, foot, 0.056, 0.05, 'boots');
      b.box([0.24, 0.07, 0.1], [foot.x + 0.06, Math.max(0.035, foot.y - 0.03), foot.z], 'boots', p.rider ? [0, 0, 0] : undefined);
    }
    const w = p.weapon;
    if (w?.kind === 'rifle') rifle(b, V(w.butt), V(w.muzzle), w.model);
    if (w?.kind === 'lmg') lmg(b, V(w.butt), V(w.muzzle), w.model, w.ground);
    if (w?.kind === 'sabre') {
      const h = V(p.handR);
      b.cyl(A(h.clone().add(new THREE.Vector3(0, -0.06, 0))), A(h.clone().add(new THREE.Vector3(0, 0.05, 0))), 0.02, 0.02, b.n(5, 3), 'leather');
      b.cyl(A(h), w.tip, 0.014, 0.006, b.n(4, 3), 'metal');
    }
  });
}

// ---------- 步兵小组 ----------
const RIFLE: Record<Nation, Rifle> = { de: 'kar98', pl: 'wz29', su: 'mosin', sk: 'vz24' };
const LMG: Record<Nation, Lmg> = { de: 'mg34', pl: 'wz28', su: 'dp27', sk: 'vz26' };

export function infantry(b: B, n: Nation): void {
  const rf = RIFLE[n];
  // 1 立姿瞄准
  figure(b, n, {
    at: [0.35, 0, -0.95], yaw: 0.1, pelvis: [0, 0.94, 0], lean: 0.06,
    handR: [0.22, 1.36, 0.12], handL: [0.52, 1.38, 0.02], footL: [0.26, 0.1, -0.16], footR: [-0.22, 0.1, 0.17],
    headDip: 0.15, headTurn: 0.1,
    weapon: { kind: 'rifle', model: rf, butt: [0.0, 1.4, 0.14], muzzle: [1.12, 1.45, 0.0] },
  });
  // 2 跪姿瞄准
  figure(b, n, {
    at: [0.55, 0, 0.95], yaw: -0.15, pelvis: [0, 0.56, 0], lean: 0.12,
    handR: [0.26, 0.97, 0.13], handL: [0.55, 1.0, 0.03], footL: [0.42, 0.1, -0.14], footR: [-0.42, 0.08, 0.14],
    kneeL: [0.45, 0.52, -0.14], kneeR: [0.02, 0.08, 0.14], headDip: 0.15,
    weapon: { kind: 'rifle', model: rf, butt: [0.04, 1.02, 0.15], muzzle: [1.14, 1.08, 0.02] },
  });
  // 3 卧姿机枪手
  figure(b, n, {
    at: [0.35, 0, 0.0], yaw: 0, pelvis: [-0.45, 0.2, 0], lean: 1.36,
    handR: [0.2, 0.3, 0.1], handL: [0.4, 0.26, -0.1], footL: [-1.3, 0.08, -0.22], footR: [-1.28, 0.1, 0.2],
    kneeL: [-0.9, 0.1, -0.18], kneeR: [-0.88, 0.1, 0.16], headDip: -0.4,
    weapon: { kind: 'lmg', model: LMG[n], butt: [0.02, 0.32, 0.08], muzzle: [1.15, 0.34, 0.06], ground: 0.0 },
  });
  // 4 端枪前进
  figure(b, n, {
    at: [-1.0, 0, 0.55], yaw: 0.05, pelvis: [0, 0.92, 0], lean: 0.22,
    handR: [0.22, 1.02, 0.13], handL: [0.5, 1.15, -0.08], footL: [0.36, 0.1, -0.1], footR: [-0.3, 0.16, 0.12],
    headTurn: -0.2,
    weapon: { kind: 'rifle', model: rf, butt: [0.02, 0.92, 0.18], muzzle: [0.98, 1.36, -0.2] },
  });
  // 5 班长指向前方
  figure(b, n, {
    at: [-0.9, 0, -0.75], yaw: 0.25, pelvis: [0, 0.95, 0], lean: 0.05,
    handR: [0.62, 1.52, 0.18], handL: [0.12, 0.95, -0.24], footL: [0.18, 0.1, -0.14], footR: [-0.12, 0.1, 0.14],
    headTurn: 0.1,
    weapon: { kind: 'none' },
  });
  if (b.hi) {
    // 班长背上的步枪
    b.with({ p: [-0.9, 0, -0.75], r: [0, 0.25, 0] }, () => rifle(b, V([-0.2, 0.92, 0.18]), V([-0.12, 1.72, -0.2]), rf, true));
  }
}

// ---------- 马 ----------
function horse(b: B, coat: Role): void {
  const hs = b.n(12, 6), vs = b.n(8, 4);
  b.sphere([0, 1.22, 0], [0.62, 0.3, 0.26], coat, hs, vs);
  b.sphere([0.5, 1.22, 0], [0.3, 0.32, 0.25], coat, hs, vs);
  b.sphere([-0.52, 1.26, 0], [0.32, 0.31, 0.27], coat, hs, vs);
  b.cyl([0.62, 1.32, 0], [0.98, 1.82, 0], 0.2, 0.12, b.n(10, 5), coat);
  b.cyl([0.98, 1.88, 0], [1.34, 1.56, 0], 0.12, 0.07, b.n(10, 5), coat);
  b.sphere([1.33, 1.57, 0], [0.08, 0.07, 0.07], coat, b.n(8, 4), b.n(6, 3));
  for (const s of [-1, 1]) b.cyl([0.95, 1.94, s * 0.05], [0.9, 2.06, s * 0.07], 0.03, 0.005, b.n(4, 3), coat);
  // 鬃毛
  b.hexa([[0.6, 1.5, -0.03], [0.98, 1.95, -0.03], [0.98, 1.95, 0.03], [0.6, 1.5, 0.03], [0.55, 1.58, -0.02], [0.92, 2.02, -0.02], [0.92, 2.02, 0.02], [0.55, 1.58, 0.02]], 'mane');
  b.cyl([-0.82, 1.4, 0], [-0.98, 0.72, 0], 0.06, 0.11, b.n(6, 3), 'mane');
  // 腿（慢步：右前腿抬起）
  const legs: [V3, V3, V3][] = [
    [[0.5, 1.02, -0.14], [0.54, 0.5, -0.14], [0.5, 0.05, -0.14]],
    [[0.5, 1.02, 0.14], [0.66, 0.56, 0.14], [0.58, 0.28, 0.14]],
    [[-0.55, 1.05, -0.15], [-0.7, 0.55, -0.15], [-0.62, 0.05, -0.15]],
    [[-0.55, 1.05, 0.15], [-0.62, 0.55, 0.15], [-0.48, 0.05, 0.15]],
  ];
  for (const [h, k, f] of legs) {
    b.cyl(h, k, 0.1, 0.055, b.n(6, 4), coat);
    b.cyl(k, f, 0.05, 0.04, b.n(6, 4), coat);
    b.cyl([f[0], f[1] - 0.04, f[2]], [f[0], f[1] + 0.06, f[2]], 0.055, 0.045, b.n(6, 4), 'hoof');
  }
  // 马鞍、鞍褥、马勒
  b.box([0.55, 0.05, 0.62], [0.02, 1.49, 0], 'blanket');
  b.frustum(-0.22, 0.26, 0.24, -0.18, 0.22, 0.2, 1.5, 1.6, 'tack');
  if (b.hi) {
    b.box([0.1, 0.12, 0.06], [0.24, 1.66, 0], 'tack');
    b.box([0.08, 0.12, 0.05], [-0.2, 1.64, 0], 'tack');
    for (const s of [-1, 1]) {
      b.box([0.3, 0.22, 0.1], [-0.35, 1.38, s * 0.3], 'canvas');
      b.cyl([1.12, 1.75, s * 0.075], [1.3, 1.6, s * 0.06], 0.012, 0.012, 3, 'tack');
      b.cyl([1.22, 1.68, s * 0.07], [0.35, 1.72, s * 0.14], 0.008, 0.008, 3, 'tack');
    }
  }
}

export function cavalry(b: B, n: 'pl' | 'su'): void {
  horse(b, 'horse');
  const pose: Pose = {
    at: [0, 0, 0], yaw: 0, pelvis: [0.0, 1.62, 0], lean: -0.03, rider: true,
    handL: [0.4, 1.68, -0.1], handR: n === 'pl' ? [0.14, 1.62, 0.34] : [0.3, 1.72, 0.22],
    footL: [0.12, 0.98, -0.34], footR: [0.12, 0.98, 0.34], kneeL: [0.28, 1.36, -0.3], kneeR: [0.28, 1.36, 0.3],
    headTurn: 0,
    weapon: n === 'su' ? { kind: 'sabre', tip: [0.02, 2.45, 0.3] } : { kind: 'none' },
  };
  figure(b, n, pose);
  // 背挎卡宾枪
  rifle(b, V([-0.22, 1.72, -0.16]), V([0.02, 2.36, 0.18]), n === 'pl' ? 'wz29' : 'mosin', true);
  // 马刀鞘
  b.cyl([0.05, 1.5, -0.3], [-0.6, 1.2, -0.32], 0.02, 0.016, b.n(5, 3), n === 'pl' ? 'metal' : 'leather');
  if (n === 'pl') {
    // 骑枪 + 团三角旗（示意两色）
    const butt = new THREE.Vector3(0.14, 0.95, 0.36);
    const dir = new THREE.Vector3(-Math.sin(0.46), Math.cos(0.46), 0.02).normalize();
    const tip = butt.clone().add(dir.clone().multiplyScalar(2.9));
    b.cyl(A(butt), A(tip), 0.018, 0.012, b.n(6, 3), 'wood');
    b.cyl(A(tip), A(tip.clone().add(dir.clone().multiplyScalar(0.18))), 0.014, 0.002, b.n(5, 3), 'metal');
    const f0 = tip.clone().sub(dir.clone().multiplyScalar(0.06));
    const f1 = tip.clone().sub(dir.clone().multiplyScalar(0.36));
    const fm = f0.clone().add(f1).multiplyScalar(0.5);
    const back = new THREE.Vector3(-0.42, -0.12, 0.02);
    const tail = fm.clone().add(back);
    b.tris([[A(f0), A(fm), A(tail)]], 'flagA', undefined, true);
    b.tris([[A(fm), A(f1), A(tail)]], 'flagB', undefined, true);
  }
}

// ---------- 野炮 ----------
export function fieldGun(b: B): void {
  const wr = 0.66, zc = 0.78;
  b.both(() => {
    // 木制辐条轮
    b.with({ p: [0, wr, zc] }, () => {
      const rim = new THREE.TorusGeometry(wr - 0.035, 0.04, b.n(4, 3), b.n(24, 10));
      rim.scale(1, 1, 1.6);
      b.add(rim, 'wood');
      b.cyl([0, 0, -0.04], [0, 0, 0.04], wr * 0.995, wr * 0.995, b.n(24, 10), 'metal', true);
      const spokes = b.n(12, 6);
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2;
        b.cyl([0, 0, 0], [Math.cos(a) * (wr - 0.05), Math.sin(a) * (wr - 0.05), 0], 0.022, 0.016, b.n(4, 3), 'wood');
      }
      b.cyl([0, 0, -0.1], [0, 0, 0.1], 0.1, 0.08, b.n(10, 5), 'paint');
      b.cyl([0, 0, 0.1], [0, 0, 0.15], 0.05, 0.04, b.n(8, 4), 'metal');
    });
  });
  b.cyl([0, wr, -zc], [0, wr, zc], 0.045, 0.045, b.n(8, 4), 'paint');
  // 防盾（上 + 下）
  b.with({ p: [0.18, 0, 0], r: [0, 0, 0.1] }, () => {
    b.poly([
      [0, 0.72, -0.72], [0, 0.72, 0.72], [0, 1.52, 0.66], [0, 1.55, 0.1], [0, 1.55, -0.1], [0, 1.52, -0.66],
      [0.012, 0.72, -0.72], [0.012, 0.72, 0.72], [0.012, 1.52, 0.66], [0.012, 1.55, 0.1], [0.012, 1.55, -0.1], [0.012, 1.52, -0.66],
    ], [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [0, 1, 7, 6], [1, 2, 8, 7], [2, 3, 9, 8], [3, 4, 10, 9], [4, 5, 11, 10], [5, 0, 6, 11]], 'paint');
    b.box([0.012, 0.36, 1.0], [0.0, 0.46, 0], 'paint');
    if (b.hi) b.box([0.02, 0.08, 0.12], [0.0, 1.3, -0.3], 'dark');
  });
  // 摇架、驻退机、炮管
  b.box([1.3, 0.16, 0.2], [0.1, 0.9, 0], 'paint');
  b.cyl([-0.6, 0.86, 0], [0.9, 0.86, 0], 0.07, 0.07, b.n(10, 5), 'paint');
  b.cyl([-0.75, 1.0, 0], [-0.2, 1.0, 0], 0.11, 0.1, b.n(12, 6), 'paint');
  b.cyl([-0.2, 1.0, 0], [1.95, 1.02, 0], 0.075, 0.055, b.n(12, 6), 'paint');
  b.cyl([1.86, 1.02, 0], [1.95, 1.02, 0], 0.07, 0.07, b.n(12, 6), 'paint');
  if (b.hi) b.wheelDiscX(1.952, 1.02, 0, 0.04, 0.004, 'dark');
  // 箱型大架
  b.with({ p: [-1.08, 0.4, 0], r: [0, 0, 0.2] }, () => b.frustum(-1.14, 1.14, 0.1, -1.14, 1.14, 0.1, -0.11, 0.11, 'paint'));
  b.box([0.1, 0.26, 0.46], [-2.2, 0.13, 0], 'paint');
  if (b.hi) {
    b.box([0.35, 0.04, 0.04], [-2.0, 0.34, 0.14], 'metal');
    b.box([0.35, 0.04, 0.04], [-2.0, 0.34, -0.14], 'metal');
    b.box([0.12, 0.2, 0.06], [-0.45, 1.12, -0.18], 'metal');
    b.cyl([-0.4, 0.95, -0.25], [-0.4, 0.95, -0.35], 0.07, 0.07, 10, 'metal');
  }
}
