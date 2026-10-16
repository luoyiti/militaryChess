/**
 * 海战特效的池化渲染（不在帧内分配对象）：
 *  - SpriteBatch：即时模式的面向镜头公告板（实例化四边形），每帧 begin → push… → end，一次绘制；
 *  - Particles：结构数组（Float32Array）粒子模拟，环形分配，写入 SpriteBatch（烟、火、水柱、闪光、弹片）；
 *  - RibbonBatch：贴水面的条带（尾迹、舰首浪、鱼雷航迹），即时模式，一次绘制。
 * 纹理图集由 canvas 程序化生成：0 柔和烟团、1 火光/闪光、2 亮点、3 水花。
 */
import * as THREE from 'three';

export const TILE = { puff: 0, flash: 1, dot: 2, spray: 3 } as const;
const TILES = 4;

function hash(n: number) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

/** 程序化图集（浏览器：canvas；Node 测试中不会调用） */
export function makeAtlas(): THREE.Texture {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S * TILES; c.height = S;
  const g = c.getContext('2d')!;
  // 0 烟团：多层叠加的柔和圆斑
  for (let i = 0; i < 14; i++) {
    const a = hash(i) * Math.PI * 2, r = hash(i + 7) * S * 0.18;
    const x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, rad = S * (0.2 + hash(i + 3) * 0.16);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  // 1 火光：亮核 + 放射状
  {
    const ox = S;
    const gr = g.createRadialGradient(ox + S / 2, S / 2, 0, ox + S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(ox, 0, S, S);
    g.save(); g.translate(ox + S / 2, S / 2); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4 + hash(i) * 0.2); const lg = g.createLinearGradient(0, 0, S * 0.48, 0); lg.addColorStop(0, 'rgba(255,255,255,0.35)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(0, -2.5, S * 0.48, 5); }
    g.restore();
  }
  // 2 亮点
  {
    const ox = S * 2;
    const gr = g.createRadialGradient(ox + S / 2, S / 2, 0, ox + S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(ox, 0, S, S);
  }
  // 3 水花：颗粒状的白色团
  {
    const ox = S * 3;
    for (let i = 0; i < 60; i++) {
      const a = hash(i + 40) * Math.PI * 2, r = Math.sqrt(hash(i + 90)) * S * 0.36;
      const x = ox + S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, rad = S * (0.05 + hash(i + 11) * 0.09);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(ox, 0, S, S);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** 面向镜头的公告板批次 */
export class SpriteBatch {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array; private col: Float32Array; private misc: Float32Array;
  private aPos: THREE.InstancedBufferAttribute; private aCol: THREE.InstancedBufferAttribute; private aMisc: THREE.InstancedBufferAttribute;
  private geo: THREE.InstancedBufferGeometry;
  n = 0;
  constructor(readonly cap: number, atlas: THREE.Texture, additive: boolean, fog: { color: THREE.Color; density: { value: number } }) {
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.getAttribute('position')); geo.setAttribute('uv', base.getAttribute('uv'));
    this.pos = new Float32Array(cap * 3); this.col = new Float32Array(cap * 4); this.misc = new Float32Array(cap * 3);
    this.aPos = new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.aMisc = new THREE.InstancedBufferAttribute(this.misc, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPos', this.aPos); geo.setAttribute('iCol', this.aCol); geo.setAttribute('iMisc', this.aMisc);
    geo.instanceCount = 0;
    this.geo = geo;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uMap: { value: atlas }, uFogCol: { value: fog.color }, uFogDensity: fog.density },
      vertexShader: /* glsl */ `
        attribute vec3 iPos; attribute vec4 iCol; attribute vec3 iMisc;
        varying vec2 vUv; varying vec4 vCol; varying float vDist;
        void main(){
          vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
          float c = cos(iMisc.z), s = sin(iMisc.z);
          vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y) * iMisc.x;
          mv.xy += q;
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
          vUv = vec2((uv.x + iMisc.y) / ${TILES}.0, uv.y);
          vCol = iCol;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform vec3 uFogCol; uniform float uFogDensity;
        varying vec2 vUv; varying vec4 vCol; varying float vDist;
        void main(){
          vec4 t = texture2D(uMap, vUv);
          float f = clamp(1.0 - exp(-pow(vDist * uFogDensity, 1.6)), 0.0, 1.0);
          ${additive
            ? 'gl_FragColor = vec4(vCol.rgb * t.a * vCol.a * (1.0 - f), 1.0);'
            : 'gl_FragColor = vec4(mix(vCol.rgb, uFogCol, f * 0.85), t.a * vCol.a);'}
          if (gl_FragColor.a < 0.003) discard;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 6 : 5;
  }
  visible: ((x: number, y: number, z: number, radius: number) => boolean) | null = null;
  begin() { this.n = 0; }
  push(x: number, y: number, z: number, size: number, r: number, g: number, b: number, a: number, tile: number, rot = 0) {
    if (this.n >= this.cap || a <= 0.002 || size <= 0 || (this.visible && !this.visible(x,y,z,size*2))) return;
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a;
    this.misc[i * 3] = size; this.misc[i * 3 + 1] = tile; this.misc[i * 3 + 2] = rot;
  }
  end() {
    this.geo.instanceCount = this.n;
    if (!this.n) return;
    for (const a of [this.aPos, this.aCol, this.aMisc]) { a.clearUpdateRanges(); a.addUpdateRange(0, this.n * a.itemSize); a.needsUpdate = true; }
  }
}

/** 粒子字段（每粒 F 个 float） */
const F = 22;
const PX = 0, PY = 1, PZ = 2, VX = 3, VY = 4, VZ = 5, AGE = 6, LIFE = 7, S0 = 8, S1 = 9, R = 10, Gc = 11, Bc = 12, A = 13, TL = 14, ROT = 15, VR = 16, DRAG = 17, GRAV = 18, ADD = 19, FIN = 20, FOUT = 21;

export interface ParticleOpts {
  x: number; y: number; z: number; vx?: number; vy?: number; vz?: number; life: number; s0: number; s1: number;
  r: number; g: number; b: number; a: number; tile: number; rot?: number; vr?: number; drag?: number; grav?: number; additive?: boolean; fin?: number; fout?: number;
}

/** 粒子模拟：环形覆盖最旧的粒子 */
export class Particles {
  private d: Float32Array;
  private cursor = 0;
  alive = 0;
  spawned = 0;
  constructor(readonly cap: number) { this.d = new Float32Array(cap * F); for (let i = 0; i < cap; i++) this.d[i * F + LIFE] = -1; }
  spawn(o: ParticleOpts) {
    // 优先找空位（最多扫描 32 个），否则覆盖游标处
    let i = this.cursor;
    for (let k = 0; k < 32; k++) { const j = (this.cursor + k) % this.cap; if (this.d[j * F + LIFE] < 0) { i = j; break; } }
    this.cursor = (i + 1) % this.cap;
    const b = i * F, d = this.d;
    d[b + PX] = o.x; d[b + PY] = o.y; d[b + PZ] = o.z; d[b + VX] = o.vx ?? 0; d[b + VY] = o.vy ?? 0; d[b + VZ] = o.vz ?? 0;
    d[b + AGE] = 0; d[b + LIFE] = o.life; d[b + S0] = o.s0; d[b + S1] = o.s1; d[b + R] = o.r; d[b + Gc] = o.g; d[b + Bc] = o.b; d[b + A] = o.a;
    d[b + TL] = o.tile; d[b + ROT] = o.rot ?? (this.spawned * 2.399) % 6.283; d[b + VR] = o.vr ?? 0; d[b + DRAG] = o.drag ?? 0; d[b + GRAV] = o.grav ?? 0;
    d[b + ADD] = o.additive ? 1 : 0; d[b + FIN] = o.fin ?? 0.08; d[b + FOUT] = o.fout ?? 0.55;
    this.spawned++;
  }
  /** dt 秒；windX/windZ 为风（米/秒，作用于有浮力/阻力的烟） */
  update(dt: number, windX: number, windZ: number) {
    const d = this.d;
    let n = 0;
    for (let i = 0; i < this.cap; i++) {
      const b = i * F;
      if (d[b + LIFE] < 0) continue;
      d[b + AGE] += dt;
      if (d[b + AGE] >= d[b + LIFE]) { d[b + LIFE] = -1; continue; }
      n++;
      const drag = d[b + DRAG];
      if (drag > 0) {
        const k = Math.exp(-drag * dt);
        d[b + VX] = windX + (d[b + VX] - windX) * k; d[b + VZ] = windZ + (d[b + VZ] - windZ) * k; d[b + VY] *= k;
      }
      d[b + VY] -= d[b + GRAV] * dt;
      d[b + PX] += d[b + VX] * dt; d[b + PY] += d[b + VY] * dt; d[b + PZ] += d[b + VZ] * dt;
      d[b + ROT] += d[b + VR] * dt;
    }
    this.alive = n;
  }
  write(alpha: SpriteBatch, add: SpriteBatch) {
    const d = this.d;
    for (let i = 0; i < this.cap; i++) {
      const b = i * F;
      if (d[b + LIFE] < 0) continue;
      const t = d[b + AGE] / d[b + LIFE];
      const fin = d[b + FIN], fout = d[b + FOUT];
      const fa = (fin > 0 ? Math.min(1, t / fin) : 1) * (t > fout ? Math.max(0, 1 - (t - fout) / (1 - fout)) : 1);
      const g = 1 - (1 - t) * (1 - t);
      const s = d[b + S0] + (d[b + S1] - d[b + S0]) * g;
      const y = Math.max(d[b + PY], -s * 0.3);
      (d[b + ADD] > 0 ? add : alpha).push(d[b + PX], y, d[b + PZ], s, d[b + R], d[b + Gc], d[b + Bc], d[b + A] * fa, d[b + TL], d[b + ROT]);
    }
  }
  /** 平移全部粒子（浮动原点重定） */
  shift(dx: number, dz: number) { const d = this.d; for (let i = 0; i < this.cap; i++) { const b = i * F; if (d[b + LIFE] >= 0) { d[b + PX] -= dx; d[b + PZ] -= dz; } } }
  clear() { for (let i = 0; i < this.cap; i++) this.d[i * F + LIFE] = -1; this.alive = 0; }
}

/** 贴水面条带：每段两三角形；aData = (沿程 u, 横向 v -1..1, 透明度, 种类) */
export class RibbonBatch {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array; private data: Float32Array;
  private aPos: THREE.BufferAttribute; private aData: THREE.BufferAttribute;
  private geo: THREE.BufferGeometry;
  n = 0;
  constructor(readonly capVerts: number, uniforms: { uTime: { value: number }; uScale: { value: number }; uFogCol: { value: THREE.Color }; uFogDensity: { value: number } }) {
    this.pos = new Float32Array(capVerts * 3); this.data = new Float32Array(capVerts * 4);
    this.geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aData = new THREE.BufferAttribute(this.data, 4).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.aPos); this.geo.setAttribute('aData', this.aData);
    this.geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      uniforms,
      vertexShader: 'attribute vec4 aData; varying vec4 vD; varying vec3 vW; void main(){ vD = aData; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uScale; uniform vec3 uFogCol; uniform float uFogDensity;
        varying vec4 vD; varying vec3 vW;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float v = abs(vD.y);
          float n = vn(vW.xz / (14.0 * uScale) + uTime * 0.15) * 0.6 + vn(vW.xz / (5.0 * uScale) - uTime * 0.2) * 0.4;
          float a;
          if (vD.w < 0.5) {            // 尾迹：中间翻滚的白沫 + 两侧的开尔文波纹
            float core = 1.0 - smoothstep(0.15, 0.75, v);
            float edge = smoothstep(0.55, 0.85, v) * (1.0 - smoothstep(0.88, 1.0, v));
            a = (core * (0.55 + 0.45 * n) + edge * 0.55 * n) * vD.z;
          } else if (vD.w < 1.5) {     // 鱼雷航迹：细长气泡带
            a = (1.0 - smoothstep(0.2, 1.0, v)) * (0.5 + 0.5 * step(0.45, fract(vD.x * 0.004 - uTime * 0.8))) * vD.z;
          } else {                     // 舰首浪
            a = (1.0 - smoothstep(0.3, 1.0, v)) * (0.6 + 0.4 * n) * vD.z;
          }
          float dist = distance(cameraPosition, vW);
          float f = clamp(1.0 - exp(-pow(dist * uFogDensity, 1.6)), 0.0, 1.0);
          gl_FragColor = vec4(mix(vec3(0.93, 0.95, 0.96), uFogCol, f), a * (1.0 - f * 0.8));
          if (gl_FragColor.a < 0.004) discard;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
  }
  begin() { this.n = 0; }
  private vert(x: number, y: number, z: number, u: number, v: number, a: number, kind: number) {
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.data[i * 4] = u; this.data[i * 4 + 1] = v; this.data[i * 4 + 2] = a; this.data[i * 4 + 3] = kind;
  }
  /**
   * 条带：pts = [x, z, y, 半宽, 透明度, 沿程]×n（扁平数组，n 个点）。kind 0 尾迹、1 鱼雷、2 舰首浪
   */
  strip(pts: Float32Array, n: number, kind: number) {
    if (n < 2 || this.n + (n - 1) * 6 > this.capVerts) return;
    // 每点法线取相邻点的中心差分，相邻段共用边
    const nrm = (i: number, out: number[]) => {
      const a = Math.max(0, i - 1) * 6, c = Math.min(n - 1, i + 1) * 6;
      const dx = pts[c] - pts[a], dz = pts[c + 1] - pts[a + 1], L = Math.hypot(dx, dz) || 1;
      out[0] = -dz / L; out[1] = dx / L;
    };
    const na = [0, 0], nc = [0, 0];
    nrm(0, na);
    for (let i = 0; i < n - 1; i++) {
      nrm(i + 1, nc);
      const a = i * 6, c = (i + 1) * 6;
      const wa = pts[a + 3], wc = pts[c + 3];
      const p0x = pts[a] + na[0] * wa, p0z = pts[a + 1] + na[1] * wa, p1x = pts[a] - na[0] * wa, p1z = pts[a + 1] - na[1] * wa;
      const q0x = pts[c] + nc[0] * wc, q0z = pts[c + 1] + nc[1] * wc, q1x = pts[c] - nc[0] * wc, q1z = pts[c + 1] - nc[1] * wc;
      const ya = pts[a + 2], yc = pts[c + 2], aa = pts[a + 4], ac = pts[c + 4], ua = pts[a + 5], uc = pts[c + 5];
      this.vert(p0x, ya, p0z, ua, 1, aa, kind); this.vert(q0x, yc, q0z, uc, 1, ac, kind); this.vert(q1x, yc, q1z, uc, -1, ac, kind);
      this.vert(p0x, ya, p0z, ua, 1, aa, kind); this.vert(q1x, yc, q1z, uc, -1, ac, kind); this.vert(p1x, ya, p1z, ua, -1, aa, kind);
      na[0] = nc[0]; na[1] = nc[1];
    }
  }
  end() {
    this.geo.setDrawRange(0, this.n);
    for (const a of [this.aPos, this.aData]) { a.clearUpdateRanges(); a.addUpdateRange(0, this.n * a.itemSize); a.needsUpdate = true; }
  }
}
