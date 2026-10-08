/**
 * 徽标 decal：CanvasTexture 绘制（仅浏览器端；node 下 hasDOM()=false，调用方跳过）。
 * 1939：德军白色实心十字（早期 Balkenkreuz 前身）与白色战术编号；苏军小红星；波军黑底白字登记号牌。
 */
import * as THREE from 'three';

export type DecalKind = 'cross' | 'num' | 'star' | 'plate';
export type Face = '+x' | '-x' | '+z' | '-z';
export interface DecalSpec {
  kind: DecalKind;
  text?: string;
  pos: [number, number, number];
  face: Face;
  /** 平面高度（米）；宽度按种类自动 */
  size: number;
  /** 绕面内水平轴倾斜（弧度，正值=上沿向内倒），用于斜装甲 */
  tilt?: number;
}

export function hasDOM(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

const cache = new Map<string, THREE.CanvasTexture>();
const ASPECT: Record<DecalKind, number> = { cross: 1, num: 1.6, star: 1, plate: 2.6 };

function draw(kind: DecalKind, text: string): THREE.CanvasTexture {
  const key = kind + ':' + text;
  const hit = cache.get(key);
  if (hit) return hit;
  const H = 128, W = Math.round(H * ASPECT[kind]);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, W, H);
  // 手涂感：轻微抖动的边缘
  const rough = (fn: () => void) => { g.save(); g.translate(Math.random() * 1.5, Math.random() * 1.5); fn(); g.restore(); };
  if (kind === 'cross') {
    rough(() => {
      g.fillStyle = '#ece6d4';
      const a = H * 0.17;
      g.fillRect(W / 2 - a, 8, a * 2, H - 16);
      g.fillRect(8, H / 2 - a, W - 16, a * 2);
    });
  } else if (kind === 'num') {
    g.font = `bold ${Math.round(H * 0.78)}px "Oswald", "Arial Narrow", Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(20,20,20,0.55)';
    g.strokeText(text, W / 2, H / 2 + 4);
    g.fillStyle = '#ebe4d0';
    g.fillText(text, W / 2, H / 2 + 4);
  } else if (kind === 'star') {
    g.fillStyle = '#b52a22';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? H * 0.2 : H * 0.47;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a));
    }
    g.closePath(); g.fill();
  } else if (kind === 'plate') {
    g.fillStyle = '#16140f'; g.fillRect(4, 18, W - 8, H - 36);
    g.strokeStyle = '#d8d0b8'; g.lineWidth = 4; g.strokeRect(10, 24, W - 20, H - 48);
    g.font = `bold ${Math.round(H * 0.5)}px "Arial Narrow", Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e4dcc4';
    g.fillText(text, W / 2, H / 2 + 3);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

export function buildDecal(d: DecalSpec): THREE.Mesh {
  const tex = draw(d.kind, d.text ?? '');
  const geo = new THREE.PlaneGeometry(d.size * ASPECT[d.kind], d.size);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, alphaTest: 0.2, roughness: 0.85, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...d.pos);
  const yaw = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[d.face];
  m.rotation.set(-(d.tilt ?? 0), yaw, 0, 'YXZ');
  m.receiveShadow = true;
  m.name = 'decal:' + d.kind;
  return m;
}
