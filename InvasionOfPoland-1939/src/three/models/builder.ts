/**
 * 参数化低多边形建模器：累积带「角色」的部件几何，最终输出
 *  - 卡片版 THREE.Group（按材质类别合并、迷彩着色器、徽标 decal）
 *  - 实例版单一 BufferGeometry（position/normal/color，逐三角形顶点色）
 * 所有部件均为非索引三角形；镜像变换自动翻转绕向。
 */
import * as THREE from 'three';
import { type Role, type Scheme, roleColor, camoColor, camoMaterial, jitter } from './paint';
import { type DecalSpec, buildDecal, hasDOM } from './decals';

export type V3 = [number, number, number];
export type V2 = [number, number];

interface Part { pos: Float32Array; role: Role }

const Y = new THREE.Vector3(0, 1, 0);

export class B {
  readonly hi: boolean;
  readonly parts: Part[] = [];
  readonly decals: DecalSpec[] = [];
  private m = new THREE.Matrix4();
  private stack: THREE.Matrix4[] = [];

  constructor(hi: boolean) { this.hi = hi; }
  /** 分段数：卡片版 / 实例版 */
  n(hi: number, lo: number): number { return this.hi ? hi : lo; }

  /** 局部变换（先平移 p，再按 r 欧拉角旋转，再缩放 s） */
  with(t: { p?: V3; r?: V3; s?: V3 | number }, fn: () => void): void {
    this.stack.push(this.m.clone());
    const s = t.s === undefined ? [1, 1, 1] : typeof t.s === 'number' ? [t.s, t.s, t.s] : t.s;
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(...(t.p ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.r ?? [0, 0, 0]))),
      new THREE.Vector3(s[0], s[1], s[2]),
    );
    this.m.multiply(local);
    fn();
    this.m = this.stack.pop()!;
  }
  /** 关于 z=0 平面镜像绘制两侧 */
  both(fn: (side: 1 | -1) => void): void {
    fn(1);
    this.with({ s: [1, 1, -1] }, () => fn(-1));
  }

  add(geo: THREE.BufferGeometry, role: Role): void {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const src = g.getAttribute('position') as THREE.BufferAttribute;
    const pos = new Float32Array(src.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < src.count; i++) {
      v.fromBufferAttribute(src, i).applyMatrix4(this.m);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    }
    if (this.m.determinant() < 0) {
      for (let i = 0; i < pos.length; i += 9) {
        for (let k = 0; k < 3; k++) { const t = pos[i + 3 + k]; pos[i + 3 + k] = pos[i + 6 + k]; pos[i + 6 + k] = t; }
      }
    }
    this.parts.push({ pos, role });
    geo.dispose();
  }

  // ---------- 基本体 ----------
  box(size: V3, p: V3, role: Role, r?: V3): void {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    if (r) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r)));
    g.translate(...p);
    this.add(g, role);
  }

  /** 凸多面体（顶点 + 面索引），绕向按质心自动校正 */
  poly(pts: V3[], faces: number[][], role: Role): void {
    const c = new THREE.Vector3();
    pts.forEach((p) => c.add(new THREE.Vector3(...p)));
    c.divideScalar(pts.length);
    const out: number[] = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3(), fc = new THREE.Vector3();
    for (const f of faces) {
      fc.set(0, 0, 0);
      f.forEach((i) => fc.add(new THREE.Vector3(...pts[i])));
      fc.divideScalar(f.length);
      for (let k = 1; k < f.length - 1; k++) {
        a.set(...pts[f[0]]); b.set(...pts[f[k]]); d.set(...pts[f[k + 1]]);
        n.subVectors(b, a).cross(d.clone().sub(a));
        if (n.lengthSq() < 1e-14) continue;
        const flip = n.dot(fc.clone().sub(c)) < 0;
        const tri = flip ? [a, d, b] : [a, b, d];
        for (const t of tri) out.push(t.x, t.y, t.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    this.add(g, role);
  }

  /** 六面体：pts 顺序 = 底面 (x-,z-),(x+,z-),(x+,z+),(x-,z+)，顶面同序 */
  hexa(pts: V3[], role: Role): void {
    this.poly(pts, [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], role);
  }

  /**
   * 棱台盒：底面 x∈[bx0,bx1]、半宽 bz；顶面 x∈[tx0,tx1]、半宽 tz；y∈[y0,y1]；中心 z=zc
   */
  frustum(bx0: number, bx1: number, bz: number, tx0: number, tx1: number, tz: number, y0: number, y1: number, role: Role, zc = 0): void {
    this.hexa([
      [bx0, y0, zc - bz], [bx1, y0, zc - bz], [bx1, y0, zc + bz], [bx0, y0, zc + bz],
      [tx0, y1, zc - tz], [tx1, y1, zc - tz], [tx1, y1, zc + tz], [tx0, y1, zc + tz],
    ], role);
  }

  /** 圆柱/圆台：从 a 到 b，a 端半径 ra，b 端半径 rb */
  cyl(a: V3, b: V3, ra: number, rb: number, seg: number, role: Role, open = false, rotSeg = 0): void {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
    const dir = Bv.clone().sub(A);
    const len = dir.length();
    if (len < 1e-6) return;
    const g = new THREE.CylinderGeometry(rb, ra, len, seg, 1, open, rotSeg);
    const q = new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(A.add(Bv).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    this.add(g, role);
  }
  /** 沿 z 轴的圆盘（车轮等）：中心 (x,y,zc)，厚 w */
  wheelDisc(x: number, y: number, zc: number, r: number, w: number, seg: number, role: Role, r2 = r): void {
    this.cyl([x, y, zc - w / 2], [x, y, zc + w / 2], r2, r, seg, role);
  }

  /** 沿 x 轴的圆盘（朝前的镜片/炮口） */
  wheelDiscX(x: number, y: number, z: number, r: number, w: number, role: Role, seg = 10): void {
    this.cyl([x - w / 2, y, z], [x + w / 2, y, z], r, r, seg, role);
  }

  sphere(c: V3, rad: V3, role: Role, ws: number, hs: number, r?: V3): void {
    const g = new THREE.SphereGeometry(1, ws, hs);
    g.scale(...rad);
    if (r) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r)));
    g.translate(...c);
    this.add(g, role);
  }

  /** 旋转体（绕 y 轴），pts=[半径, y]，自下而上 */
  lathe(pts: V2[], seg: number, c: V3, role: Role, deform?: (v: THREE.Vector3) => void, phiStart = 0, phiLen = Math.PI * 2): void {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, phiStart, phiLen);
    if (deform) {
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); deform(v); p.setXYZ(i, v.x, v.y, v.z); }
    }
    g.translate(...c);
    this.add(g, role);
  }

  /** 侧视轮廓（x,y）沿 z 拉伸为 [z0,z1]；hi 时带小倒角 */
  prism(profile: V2[], z0: number, z1: number, role: Role, bevel = 0.025): void {
    const shape = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(x, y)));
    const bv = this.hi && bevel > 0 ? Math.min(bevel, (z1 - z0) / 4) : 0;
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: z1 - z0 - 2 * bv, bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv, bevelSegments: 1, curveSegments: 4,
    });
    g.translate(0, 0, z0 + bv);
    this.add(g, role);
  }

  /** 三角片（单面，按 outward 校正绕向） */
  tris(list: [V3, V3, V3][], role: Role, outward?: V3, twoSided = false): void {
    const out: number[] = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (const [p, q, r] of list) {
      a.set(...p); b.set(...q); c.set(...r);
      const n = b.clone().sub(a).cross(c.clone().sub(a));
      const flip = outward ? n.dot(new THREE.Vector3(...outward)) < 0 : false;
      const t = flip ? [a, c, b] : [a, b, c];
      for (const v of t) out.push(v.x, v.y, v.z);
      if (twoSided) for (const v of [t[0], t[2], t[1]]) out.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    this.add(g, role);
  }

  decal(d: DecalSpec): void { if (this.hi) this.decals.push(d); }

  // ---------- 输出 ----------
  private bounds(): THREE.Box3 {
    const bb = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const p of this.parts) for (let i = 0; i < p.pos.length; i += 3) bb.expandByPoint(v.set(p.pos[i], p.pos[i + 1], p.pos[i + 2]));
    return bb;
  }
  /** 平移使原点位于包围盒底面中心 */
  recenter(): THREE.Vector3 {
    const bb = this.bounds();
    const off = new THREE.Vector3(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    for (const p of this.parts) for (let i = 0; i < p.pos.length; i += 3) { p.pos[i] += off.x; p.pos[i + 1] += off.y; p.pos[i + 2] += off.z; }
    for (const d of this.decals) d.pos = [d.pos[0] + off.x, d.pos[1] + off.y, d.pos[2] + off.z];
    return off;
  }

  /** 逐三角形着色：手涂明暗抖动 + 底部污渍 + 顶面干刷高光 */
  private shade(p: Part, scheme: Scheme, H: number, camoInVertex: boolean): Float32Array {
    const col = new Float32Array(p.pos.length);
    const base = new THREE.Color(roleColor(scheme, p.role));
    const dust = new THREE.Color('#7b6a4e');
    const c = new THREE.Color();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
    const isPaint = p.role === 'paint';
    const weather = isPaint || p.role === 'track' || p.role === 'rubber' || p.role === 'hoof' || p.role === 'boots';
    for (let i = 0; i < p.pos.length; i += 9) {
      a.fromArray(p.pos, i); b.fromArray(p.pos, i + 3); d.fromArray(p.pos, i + 6);
      cen.copy(a).add(b).add(d).divideScalar(3);
      n.subVectors(b, a).cross(d.clone().sub(a)).normalize();
      if (isPaint) {
        if (camoInVertex) camoColor(scheme, cen, c, true); else c.setRGB(1, 1, 1);
      } else c.copy(base);
      let k = 1 + 0.05 * jitter(cen.x, cen.y, cen.z);
      k *= 1 + 0.07 * Math.max(0, n.y);
      if (weather) {
        const t = Math.min(1, Math.max(0, cen.y / Math.max(0.3, H * 0.45)));
        k *= 0.84 + 0.16 * t;
        const dm = (1 - t) * 0.22;
        if (dm > 0) c.lerp(isPaint && !camoInVertex ? new THREE.Color(1.2, 1.05, 0.8) : dust, dm);
      }
      c.multiplyScalar(k);
      for (let j = 0; j < 3; j++) { col[i + j * 3] = c.r; col[i + j * 3 + 1] = c.g; col[i + j * 3 + 2] = c.b; }
    }
    return col;
  }

  private static geom(pos: Float32Array, col: Float32Array): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
  private static concat(list: Float32Array[]): Float32Array {
    const n = list.reduce((s, a) => s + a.length, 0);
    const out = new Float32Array(n);
    let o = 0;
    for (const a of list) { out.set(a, o); o += a.length; }
    return out;
  }

  /** 实例版：合并为单一几何 */
  toInstanceGeometry(scheme: Scheme): THREE.BufferGeometry {
    this.recenter();
    const H = this.bounds().max.y;
    const P: Float32Array[] = [], C: Float32Array[] = [];
    for (const p of this.parts) { P.push(p.pos); C.push(this.shade(p, scheme, H, true)); }
    return B.geom(B.concat(P), B.concat(C));
  }

  /** 卡片版：按材质类别合并；迷彩在着色器中计算 */
  toGroup(scheme: Scheme, name: string): THREE.Group {
    this.recenter();
    const H = this.bounds().max.y;
    const cls = (r: Role): 'paint' | 'matte' | 'metal' | 'rubber' | 'glass' =>
      r === 'paint' ? 'paint' : r === 'track' || r === 'metal' || r === 'rust' ? 'metal' : r === 'rubber' || r === 'dark' ? 'rubber' : r === 'glass' ? 'glass' : 'matte';
    const buckets = new Map<string, { P: Float32Array[]; C: Float32Array[] }>();
    for (const p of this.parts) {
      const k = cls(p.role);
      if (!buckets.has(k)) buckets.set(k, { P: [], C: [] });
      const bk = buckets.get(k)!;
      bk.P.push(p.pos); bk.C.push(this.shade(p, scheme, H, false));
    }
    const group = new THREE.Group();
    group.name = name;
    for (const [k, bk] of buckets) {
      const geo = B.geom(B.concat(bk.P), B.concat(bk.C));
      const mat = k === 'paint' ? camoMaterial(scheme)
        : new THREE.MeshStandardMaterial({
          vertexColors: true, flatShading: true,
          roughness: k === 'metal' ? 0.6 : k === 'glass' ? 0.25 : k === 'rubber' ? 0.95 : 0.88,
          metalness: k === 'metal' ? 0.35 : k === 'glass' ? 0.1 : 0.02,
          emissive: k === 'glass' ? new THREE.Color('#3a3220') : new THREE.Color(0),
        });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name + ':' + k;
      mesh.castShadow = true; mesh.receiveShadow = true;
      group.add(mesh);
    }
    if (hasDOM()) for (const d of this.decals) group.add(buildDecal(d));
    return group;
  }
}

/** 对 Object3D 统计三角形数 */
export function countTriangles(o: THREE.Object3D): number {
  let n = 0;
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh && m.geometry) {
      const g = m.geometry;
      n += g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
    }
  });
  return n;
}
