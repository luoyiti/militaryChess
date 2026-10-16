/**
 * 海面与天空：Gerstner 波浪（顶点着色器位移 + 解析法线，JS 版供舰船起伏与尾迹贴水）、程序化细节法线、
 * 天空渐变（太阳光晕、星空、月亮），以及按太阳高度插值的环境色板（天顶、地平线、水色、光照、曝光）。
 * 不使用外部纹理。
 */
import * as THREE from 'three';

// ---------- 波浪（JS 与 GLSL 共用参数） ----------
/** [方向角(弧度), 波长 m, 振幅 m, 陡度 Q] —— 中等海况（约 3 级） */
export const WAVES: [number, number, number, number][] = [
  [0.35, 96, 0.95, 0.55],
  [0.95, 61, 0.55, 0.5],
  [-0.3, 37, 0.32, 0.45],
  [1.6, 23, 0.16, 0.4],
];
const G = 9.81;
const W = WAVES.map(([a, len, amp, q]) => ({ dx: Math.cos(a), dz: Math.sin(a), len, amp, q, omega: Math.sqrt((G * 2 * Math.PI) / len) }));

/** 海面高度（米）：x/z 世界坐标，t 秒，scale = 波浪放大倍数（兵棋比例下波浪与模型同比放大，周期不变） */
export function waveHeight(x: number, z: number, t: number, scale: number, att = 1): number {
  let y = 0;
  for (const w of W) {
    const k = (2 * Math.PI) / (w.len * scale);
    y += w.amp * scale * att * Math.sin(k * (w.dx * x + w.dz * z) - w.omega * t);
  }
  return y;
}

const glslVec4 = (a: number[]) => `vec4(${a.map((v) => v.toFixed(5)).join(',')})`;
const WAVE_GLSL = W.map((w, i) => `const vec4 W${i} = ${glslVec4([w.dx, w.dz, w.len, w.amp])}; const vec2 Q${i} = vec2(${w.q.toFixed(3)}, ${w.omega.toFixed(5)});`).join('\n');

/** 天空颜色函数（天空球、海面反射共用） */
const SKY_GLSL = /* glsl */ `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunGlow; uniform vec3 uGround;
vec3 skyCol(vec3 d){
  float h = d.y;
  vec3 c = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.42));
  c = mix(c, uGround, smoothstep(0.0, -0.25, h));
  float sd = max(dot(d, uSunDir), 0.0);
  float low = 1.0 - smoothstep(0.0, 0.5, abs(h));
  c += uSunGlow * (pow(sd, 6.0) * (0.22 + 0.5 * low) + pow(sd, 48.0) * 0.55);
  return c;
}
`;

export interface Env {
  zenith: THREE.Color; horizon: THREE.Color; ground: THREE.Color; sunGlow: THREE.Color;
  sunCol: THREE.Color; sunI: number; hemiSky: THREE.Color; hemiGround: THREE.Color; hemiI: number;
  deep: THREE.Color; scatter: THREE.Color; exposure: number; stars: number; night: number;
}
/** 环境关键帧（太阳高度角，度） */
const KEYS: [number, Record<string, string | number>][] = [
  [-18, { zenith: '#03060f', horizon: '#0b1326', ground: '#05080f', sunGlow: '#000000', sunCol: '#7f95c4', sunI: 0.32, hemiSky: '#3a4a70', hemiGround: '#0b0f18', hemiI: 0.32, deep: '#03080f', scatter: '#07131f', exposure: 1.55, stars: 1 }],
  [-8, { zenith: '#081430', horizon: '#26304e', ground: '#0a0f1a', sunGlow: '#1a1420', sunCol: '#8197c7', sunI: 0.3, hemiSky: '#4a5a80', hemiGround: '#10141e', hemiI: 0.38, deep: '#050d18', scatter: '#0b1a28', exposure: 1.45, stars: 0.75 }],
  [-3, { zenith: '#1b2b55', horizon: '#a8604a', ground: '#141822', sunGlow: '#c0603a', sunCol: '#e08a5a', sunI: 0.5, hemiSky: '#7a7aa0', hemiGround: '#1a1a22', hemiI: 0.5, deep: '#08141f', scatter: '#183040', exposure: 1.3, stars: 0.25 }],
  [1, { zenith: '#2a4a85', horizon: '#e79a62', ground: '#1e232c', sunGlow: '#ffae6a', sunCol: '#ffae72', sunI: 1.6, hemiSky: '#a7a6b6', hemiGround: '#2a2a2c', hemiI: 0.6, deep: '#0b1e2c', scatter: '#24485a', exposure: 1.12, stars: 0 }],
  [8, { zenith: '#3462a2', horizon: '#e8c095', ground: '#252b33', sunGlow: '#ffd09a', sunCol: '#ffd6a6', sunI: 2.3, hemiSky: '#b9c6d6', hemiGround: '#2c3138', hemiI: 0.7, deep: '#0c2636', scatter: '#2a5a6c', exposure: 1.02, stars: 0 }],
  [25, { zenith: '#3368ae', horizon: '#b7cfe2', ground: '#2a323b', sunGlow: '#fff0d6', sunCol: '#fff3e2', sunI: 2.8, hemiSky: '#c4d6ea', hemiGround: '#323a44', hemiI: 0.75, deep: '#0c2b3e', scatter: '#2d6478', exposure: 1.0, stars: 0 }],
  [60, { zenith: '#2c62ab', horizon: '#aecbe3', ground: '#2a323b', sunGlow: '#fff6e6', sunCol: '#ffffff', sunI: 3.0, hemiSky: '#c8daee', hemiGround: '#323a44', hemiI: 0.78, deep: '#0b2c40', scatter: '#2c6a80', exposure: 1.0, stars: 0 }],
];
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
/** 太阳高度 → 环境色板 */
export function envAt(elev: number, out?: Env): Env {
  let i = 0;
  while (i < KEYS.length - 2 && elev > KEYS[i + 1][0]) i++;
  const [e0, a] = KEYS[i], [e1, b] = KEYS[i + 1];
  const t = Math.max(0, Math.min(1, (elev - e0) / (e1 - e0)));
  const col = (k: keyof Env) => { const target = out?.[k]; return (target instanceof THREE.Color ? target : new THREE.Color()).set(a[k] as string).lerp(tmpB.set(b[k] as string), t); };
  const num = (k: string) => (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
  const e: Env = out ?? ({} as Env);
  e.zenith = col('zenith'); e.horizon = col('horizon'); e.ground = col('ground'); e.sunGlow = col('sunGlow');
  e.sunCol = col('sunCol'); e.sunI = num('sunI'); e.hemiSky = col('hemiSky'); e.hemiGround = col('hemiGround'); e.hemiI = num('hemiI');
  e.deep = col('deep'); e.scatter = col('scatter'); e.exposure = num('exposure'); e.stars = num('stars');
  e.night = Math.max(0, Math.min(1, (-elev - 2) / 8));
  return e;
}

/** 方位角 + 高度角（度）→ 世界方向（x 东，z 南，y 上） */
export function dirFromAzEl(az: number, el: number, out = new THREE.Vector3()): THREE.Vector3 {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

export interface OceanUniforms {
  [k: string]: THREE.IUniform;
  uTime: { value: number }; uScale: { value: number }; uCenter: { value: THREE.Vector2 }; uFade: { value: number };
  uZenith: { value: THREE.Color }; uHorizon: { value: THREE.Color }; uGround: { value: THREE.Color }; uSunDir: { value: THREE.Vector3 }; uSunGlow: { value: THREE.Color };
  uSunCol: { value: THREE.Color }; uSunI: { value: number }; uDeep: { value: THREE.Color }; uScatter: { value: THREE.Color };
  uFogCol: { value: THREE.Color }; uFogDensity: { value: number }; uDetail: { value: number }; uNight: { value: number }; uStars: { value: number }; uMoonDir: { value: THREE.Vector3 };
}

export function createOceanUniforms(): OceanUniforms {
  return {
    uTime: { value: 0 }, uScale: { value: 1 }, uCenter: { value: new THREE.Vector2() }, uFade: { value: 20000 },
    uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunGlow: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uSunI: { value: 1 }, uDeep: { value: new THREE.Color() }, uScatter: { value: new THREE.Color() },
    uFogCol: { value: new THREE.Color() }, uFogDensity: { value: 1e-5 }, uDetail: { value: 1 }, uNight: { value: 0 }, uStars: { value: 0 }, uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
  };
}

/** 海面网格：极坐标同心环（内密外疏，单位半径），每帧平移到镜头焦点并按距离缩放 */
export function oceanGeometry(rings: number, segs: number): THREE.BufferGeometry {
  const pos: number[] = [0, 0, 0];
  const idx: number[] = [];
  const g = 7.2 / rings;
  const r = (i: number) => (Math.exp(g * i) - 1) / (Math.exp(g * rings) - 1);
  for (let i = 1; i <= rings; i++) for (let j = 0; j < segs; j++) {
    const a = (j / segs) * Math.PI * 2 + (i % 2) * (Math.PI / segs);
    pos.push(Math.cos(a) * r(i), 0, Math.sin(a) * r(i));
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a0 = 1 + (i - 1) * segs, b0 = 1 + i * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      idx.push(a0 + j, a0 + j1, b0 + j, a0 + j1, b0 + j1, b0 + j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

export function oceanMaterial(u: OceanUniforms, detail: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      ${WAVE_GLSL}
      uniform float uTime; uniform float uScale; uniform float uFade;
      varying vec3 vWorld; varying vec3 vN; varying float vAtt;
      void wave(vec4 w, vec2 q, vec2 p, float att, inout vec3 d, inout vec3 n){
        float k = 6.2831853 / (w.z * uScale); float a = w.w * uScale * att;
        float th = k * dot(w.xy, p) - q.y * uTime; float c = cos(th), s = sin(th);
        d.x += q.x * a * w.x * c; d.z += q.x * a * w.y * c; d.y += a * s;
        float wa = k * a; n.x -= w.x * wa * c; n.z -= w.y * wa * c; n.y -= q.x * wa * s;
      }
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float dist = distance(wp.xz, cameraPosition.xz);
        float att = 1.0 - smoothstep(uFade * 0.35, uFade, dist);
        vec3 d = vec3(0.0); vec3 n = vec3(0.0, 1.0, 0.0);
        wave(W0, Q0, wp.xz, att, d, n); wave(W1, Q1, wp.xz, att, d, n); wave(W2, Q2, wp.xz, att, d, n); wave(W3, Q3, wp.xz, att, d, n);
        wp.xyz += d;
        vWorld = wp.xyz; vN = normalize(n); vAtt = att;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform float uTime; uniform float uScale; uniform vec3 uSunCol; uniform float uSunI; uniform vec3 uDeep; uniform vec3 uScatter;
      uniform vec3 uFogCol; uniform float uFogDensity; uniform float uDetail; uniform float uNight; uniform vec3 uMoonDir;
      varying vec3 vWorld; varying vec3 vN; varying float vAtt;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
      vec2 grad(vec2 p){ float e = 0.12; return vec2(vn(p+vec2(e,0.0)) - vn(p-vec2(e,0.0)), vn(p+vec2(0.0,e)) - vn(p-vec2(0.0,e))) / (2.0*e); }
      void main(){
        vec3 V = cameraPosition - vWorld; float dist = length(V); V /= dist;
        vec3 N = vN;
        ${detail ? `{
          float s = 1.0 / (9.0 * uScale);
          float fd = (1.0 - smoothstep(600.0 * uScale, 6000.0 * uScale, dist)) * uDetail;
          vec2 g1 = grad(vWorld.xz * s + vec2(uTime * 0.05, uTime * 0.03));
          vec2 g2 = grad(vWorld.xz * s * 2.7 - vec2(uTime * 0.04, -uTime * 0.06));
          N = normalize(N + vec3(g1.x + 0.5 * g2.x, 0.0, g1.y + 0.5 * g2.y) * 0.16 * fd);
        }` : ''}
        float ndv = max(dot(N, V), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 refl = skyCol(R);
        float sunUp = clamp(uSunDir.y * 6.0 + 0.2, 0.0, 1.0);
        float diff = max(dot(N, uSunDir), 0.0) * sunUp;
        vec3 water = uDeep * (0.55 + 0.45 * diff) + uScatter * (0.35 * diff + 0.12) * (0.4 + 0.6 * pow(1.0 - ndv, 2.0));
        vec3 col = mix(water, refl, fres * 0.92);
        float spec = pow(max(dot(R, uSunDir), 0.0), 520.0) * 9.0 + pow(max(dot(R, uSunDir), 0.0), 60.0) * 0.35;
        col += uSunCol * uSunI * spec * sunUp * (0.35 + 0.65 * vAtt);
        float mspec = pow(max(dot(R, uMoonDir), 0.0), 300.0) * 2.5 * uNight;
        col += vec3(0.6, 0.68, 0.85) * mspec;
        float f = 1.0 - exp(-pow(dist * uFogDensity, 1.6));
        col = mix(col, uFogCol, clamp(f, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** 天空球（跟随镜头、无雾）：渐变 + 太阳盘 + 星空 + 月亮 */
export function skyMaterial(u: OceanUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform vec3 uSunCol; uniform float uSunI; uniform float uStars; uniform vec3 uMoonDir; uniform float uNight;
      varying vec3 vDir;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        vec3 c = skyCol(d);
        float sd = dot(d, uSunDir);
        c += uSunCol * smoothstep(0.99955, 0.99975, sd) * 6.0 * step(-0.02, uSunDir.y);
        if (uStars > 0.01 && d.y > 0.0) {
          vec3 q = d * 260.0; vec3 i = floor(q); float r = h3(i);
          float star = step(0.9965, r) * smoothstep(0.42, 0.0, length(fract(q) - 0.5));
          c += vec3(0.9, 0.93, 1.0) * star * uStars * (0.4 + 0.6 * h3(i + 3.1)) * smoothstep(0.0, 0.15, d.y);
        }
        float md = dot(d, uMoonDir);
        c += vec3(0.85, 0.88, 0.95) * smoothstep(0.99935, 0.9996, md) * uNight * 1.8;
        c += vec3(0.25, 0.3, 0.42) * pow(max(md, 0.0), 40.0) * 0.25 * uNight;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
