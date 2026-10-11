/**
 * 1939 年涂装：配色、迷彩噪声（JS 版给实例几何逐三角形上色；GLSL 版给卡片材质逐像素上色）。
 */
import * as THREE from 'three';

export type Role =
  | 'paint' // 车体涂装（参与迷彩）
  | 'track' | 'rubber' | 'dark' | 'metal' | 'rust' | 'wood' | 'glass' | 'canvas'
  | 'uniform' | 'trousers' | 'helmet' | 'skin' | 'leather' | 'boots' | 'kit' | 'coat'
  | 'horse' | 'mane' | 'hoof' | 'tack' | 'blanket'
  | 'flagA' | 'flagB' | 'white' | 'red' | 'belly' | 'blue' | 'yellow';

export type CamoKind = 'de' | 'pl' | 'su' | 'cz' | 'plain' | 'raf' | 'luftwaffe';

export interface Scheme {
  camo: CamoKind;
  /** 迷彩色：c0 底色，c1/c2 斑块，line 分隔线 */
  c0: string; c1: string; c2: string; line: string;
  roles: Partial<Record<Role, string>>;
}

const COMMON: Record<Role, string> = {
  paint: '#808080',
  track: '#3b3531', rubber: '#26241f', dark: '#141210', metal: '#4d4b47', rust: '#6a4a33',
  wood: '#7a5634', glass: '#d9d2b0', canvas: '#8a7f5e',
  uniform: '#5f6250', trousers: '#6a6a5e', helmet: '#4f5448', skin: '#c99a78', leather: '#2b2520',
  boots: '#1e1b18', kit: '#6b6450', coat: '#6b6452',
  horse: '#5a3a24', mane: '#1f1712', hoof: '#2a2420', tack: '#3a2618', blanket: '#5b5a4a',
  flagA: '#e8e2d2', flagB: '#b3262e', white: '#ece6d6', red: '#a82424',
  belly: '#b9c7bc', blue: '#163967', yellow: '#dbc13e',
};

export const SCHEMES = {
  /** 德军 1937–40 标准：深灰 RAL7021 + 暗褐 RAL7017 斑（约 1/3 面积） */
  de: { camo: 'de', c0: '#4a4e52', c1: '#4c4034', c2: '#4c4034', line: '#2a2a2a', roles: {} },
  /** 波兰 1936 「日式」三色：沙黄/绿/褐 + 黑色分隔细线 */
  pl: { camo: 'pl', c0: '#a58d5c', c1: '#556038', c2: '#6a4c32', line: '#1c1a16', roles: {} },
  /** 苏军 4BO 橄榄绿 */
  su: { camo: 'su', c0: '#4f5634', c1: '#4f5634', c2: '#4f5634', line: '#2a2a2a', roles: {} },
  /** 1940 RAF：Dark Earth / Dark Green 上表面，Sky 下表面。 */
  raf: { camo: 'raf', c0: '#66543c', c1: '#3e4b36', c2: '#3e4b36', line: '#242a22', roles: { belly: '#b9c7ac', glass: '#819ba7', blue: '#173e72', red: '#9f2729', white: '#e7e1cd' } },
  /** 1940 Luftwaffe：深绿碎片式上表面与浅蓝下表面，保留普通铁十字。 */
  luftwaffe: { camo: 'luftwaffe', c0: '#35433b', c1: '#56634c', c2: '#56634c', line: '#28332e', roles: { belly: '#a9c5c8', glass: '#7798a7', dark: '#131a1c', white: '#e6e6db' } },
  /** 中性火炮：橄榄灰 */
  gun: { camo: 'su', c0: '#55573f', c1: '#55573f', c2: '#55573f', line: '#2a2a2a', roles: {} },
  /** 步兵/骑兵：不迷彩，按国别覆盖服装色 */
  inf_de: { camo: 'plain', c0: '#5f6250', c1: '', c2: '', line: '', roles: { uniform: '#5c6150', trousers: '#626258', helmet: '#4d5347', boots: '#1c1a18', leather: '#1f1c19', kit: '#565a48' } },
  inf_pl: { camo: 'plain', c0: '#6b6743', c1: '', c2: '', line: '', roles: { uniform: '#6a6642', trousers: '#65613f', helmet: '#555a3b', boots: '#2e2218', leather: '#4a3322', kit: '#6e6446' } },
  inf_su: { camo: 'plain', c0: '#7d7450', c1: '', c2: '', line: '', roles: { uniform: '#857a52', trousers: '#6c6546', helmet: '#4b5433', boots: '#1f1c18', leather: '#4a3524', kit: '#6a6448', coat: '#6f6553' } },
  inf_sk: { camo: 'plain', c0: '#6f6645', c1: '', c2: '', line: '', roles: { uniform: '#72684a', trousers: '#6a6146', helmet: '#5d5c3c', boots: '#2a2019', leather: '#3d2b1d', kit: '#6b6247' } },
  inf_it: { camo: 'plain', c0: '#727968', c1: '', c2: '', line: '', roles: { uniform: '#727968', trousers: '#727968', helmet: '#555b45' } },
  inf_gr: { camo: 'plain', c0: '#6a6642', c1: '', c2: '', line: '', roles: { uniform: '#6a6642', trousers: '#6a6642', helmet: '#555b45' } },
  inf_yu: { camo: 'plain', c0: '#68664e', c1: '', c2: '', line: '', roles: { uniform: '#68664e', trousers: '#68664e', helmet: '#555b45' } },
  inf_gb: { camo: 'plain', c0: '#93866b', c1: '', c2: '', line: '', roles: { uniform: '#93866b', trousers: '#93866b', helmet: '#555b45' } },
  inf_hu: { camo: 'plain', c0: '#82745d', c1: '', c2: '', line: '', roles: { uniform: '#82745d', trousers: '#82745d', helmet: '#555b45' } },
  inf_bg: { camo: 'plain', c0: '#73694e', c1: '', c2: '', line: '', roles: { uniform: '#73694e', trousers: '#73694e', helmet: '#555b45' } },
  inf_au: { camo: 'plain', c0: '#887757', c1: '', c2: '', line: '', roles: { uniform: '#887757', trousers: '#887757', helmet: '#555b45' } },
  inf_nz: { camo: 'plain', c0: '#817259', c1: '', c2: '', line: '', roles: { uniform: '#817259', trousers: '#817259', helmet: '#555b45' } },
  para_de: { camo: 'plain', c0: '#626850', c1: '', c2: '', line: '', roles: { uniform: '#626850', trousers: '#626850', helmet: '#555b45' } },
} satisfies Record<string, Scheme>;
export type SchemeId = keyof typeof SCHEMES;

export function roleColor(s: Scheme, r: Role): string {
  return s.roles[r] ?? COMMON[r];
}

// ---------- 噪声 ----------
function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function sm(t: number) { return t * t * (3 - 2 * t); }
export function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbm(x: number, y: number, z: number): number {
  return 0.62 * vnoise(x, y, z) + 0.28 * vnoise(x * 2.03 + 5.1, y * 2.03, z * 2.03) + 0.1 * vnoise(x * 4.1, y * 4.1 + 3.3, z * 4.1);
}
export function jitter(x: number, y: number, z: number): number {
  return hash3(x * 13.1, y * 17.7, z * 11.3) * 2 - 1;
}

/** 迷彩参数（JS 与 GLSL 共用常量） */
export const CAMO = { deFreq: 1.35, de: 0.615, plFreq: 1.1, plG: 0.535, plB: 0.578, plLine: 0.0065 };

const _c = new THREE.Color();
/** JS 版迷彩：返回线性空间颜色 */
/** coarse=true：实例版（大三角形）——德军只留底色，波军不画分隔线 */
export function camoColor(s: Scheme, p: THREE.Vector3, out: THREE.Color, coarse = false): THREE.Color {
  const f = s.camo === 'de' ? CAMO.deFreq : CAMO.plFreq;
  const x = p.x * f, y = p.y * f, z = p.z * f;
  switch (s.camo) {
    case 'de': {
      const n = fbm(x + 3.7, y, z);
      return out.set(n > CAMO.de && !coarse ? s.c1 : s.c0);
    }
    case 'pl':
    case 'cz': {
      const n1 = fbm(x, y, z), n2 = fbm(x + 31.7, y + 7.1, z);
      if (s.camo === 'pl' && !coarse && (Math.abs(n1 - CAMO.plG) < CAMO.plLine * 2 || Math.abs(n2 - CAMO.plB) < CAMO.plLine * 2)) return out.set(s.line);
      out.set(s.c0);
      if (n1 > CAMO.plG) out.set(s.c1);
      if (n2 > CAMO.plB) out.set(s.c2);
      return out;
    }
    case 'su': {
      const n = fbm(x * 3, y * 3, z * 3);
      return out.set(s.c0).multiplyScalar(0.93 + 0.14 * n);
    }
    case 'raf':
      return out.set(Math.sin(p.x * .8 + p.z * .7 + fbm(p.x * .3, p.y * .3, p.z * .3) * 4) > 0 ? s.c1 : s.c0);
    case 'luftwaffe':
      return out.set(Math.sin(p.x * .7 + p.z * .45) > .1 ? s.c1 : s.c0);
    default:
      return out.set(s.c0);
  }
}
export function lin(hex: string): THREE.Color { return _c.set(hex).clone(); }

// ---------- GLSL ----------
const GLSL_NOISE = /* glsl */ `
varying vec3 vObjP;
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uLine; uniform int uMode;
float h3(vec3 p){ return fract(sin(p.x*127.1+p.y*311.7+p.z*74.7)*43758.5453); }
float vn(vec3 p){ vec3 i=floor(p); vec3 f=p-i; f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fb(vec3 p){ return 0.62*vn(p)+0.28*vn(p*2.03+vec3(5.1,0.,0.))+0.1*vn(p*4.1+vec3(0.,3.3,0.)); }
vec3 camo(vec3 q){
  vec3 p = q*(uMode==0 ? ${CAMO.deFreq.toFixed(3)} : ${CAMO.plFreq.toFixed(3)});
  float aa = 0.004;
  if(uMode==0){ float n=fb(p+vec3(3.7,0.,0.)); return mix(uC0,uC1,smoothstep(${CAMO.de.toFixed(3)}-aa,${CAMO.de.toFixed(3)}+aa,n)); }
  if(uMode==1||uMode==3){ float n1=fb(p); float n2=fb(p+vec3(31.7,7.1,0.));
    vec3 c=mix(uC0,uC1,smoothstep(${CAMO.plG.toFixed(3)}-aa,${CAMO.plG.toFixed(3)}+aa,n1));
    c=mix(c,uC2,smoothstep(${CAMO.plB.toFixed(3)}-aa,${CAMO.plB.toFixed(3)}+aa,n2));
    if(uMode==1){ float l=min(abs(n1-${CAMO.plG.toFixed(3)}),abs(n2-${CAMO.plB.toFixed(3)}));
      c=mix(uLine,c,smoothstep(${CAMO.plLine.toFixed(4)}*0.7,${CAMO.plLine.toFixed(4)}*1.3,l)); }
    return c; }
  if(uMode==2){ return uC0*(0.93+0.14*fb(p*3.0)); }
  if(uMode==5){ return mix(uC0,uC1,step(0.,sin(q.x*.8+q.z*.7+fb(q*.3)*4.))); }
  if(uMode==6){ return mix(uC0,uC1,step(.1,sin(q.x*.7+q.z*.45))); }
  return uC0;
}
`;
const MODE: Record<CamoKind, number> = { de: 0, pl: 1, su: 2, cz: 3, plain: 4, raf: 5, luftwaffe: 6 };

/** 卡片版迷彩材质：顶点色=明暗（手涂感），片元内按模型空间坐标计算迷彩色 */
export function camoMaterial(s: Scheme): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0.06 });
  const u = {
    uC0: { value: lin(s.c0) }, uC1: { value: lin(s.c1 || s.c0) }, uC2: { value: lin(s.c2 || s.c0) },
    uLine: { value: lin(s.line || '#222222') }, uMode: { value: MODE[s.camo] },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vObjP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vObjP = position;');
    sh.fragmentShader = GLSL_NOISE + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= camo(vObjP);');
  };
  m.customProgramCacheKey = () => 'wbcamo';
  return m;
}
