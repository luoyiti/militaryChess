/**
 * D 模型接口（CONTRACT §8）：
 *  - MODEL_SPECS：外形尺寸
 *  - buildModel(id)：卡片展示版 THREE.Group（≤ 20k 三角形，迷彩材质 + 徽标 decal；node 下自动跳过纹理）
 *  - buildInstanceGeometry(id)：沙盘实例版单一 BufferGeometry（≤ 1.5k 三角形，position/normal/color）
 * 单位米，原点在车底中心，+X 朝前，+Y 朝上。
 */
import * as THREE from 'three';
import type { ModelId } from '../../schema';
import { B } from './builder';
import { SCHEMES, type Scheme } from './paint';
import * as V from './vehicles';
import { infantry, cavalry, fieldGun } from './figures';

export { MODEL_SPECS, type ModelSpec, type ModelKind } from './specs';
export { countTriangles } from './builder';

interface Def { scheme: Scheme; build: (b: B) => void }

const DEFS: Record<ModelId, Def> = {
  pz1: { scheme: SCHEMES.de, build: V.pz1 },
  pz2: { scheme: SCHEMES.de, build: V.pz2 },
  pz3: { scheme: SCHEMES.de, build: V.pz3 },
  pz4: { scheme: SCHEMES.de, build: V.pz4 },
  pz35t: { scheme: SCHEMES.de, build: V.pz35t },
  pz38t: { scheme: SCHEMES.de, build: V.pz38t },
  sdkfz231: { scheme: SCHEMES.de, build: V.sdkfz231 },
  '7tp': { scheme: SCHEMES.pl, build: V.sevenTP },
  tks: { scheme: SCHEMES.pl, build: V.tks },
  wz34: { scheme: SCHEMES.pl, build: V.wz34 },
  t26: { scheme: SCHEMES.su, build: V.t26 },
  bt7: { scheme: SCHEMES.su, build: V.bt7 },
  inf_de: { scheme: SCHEMES.inf_de, build: (b) => infantry(b, 'de') },
  inf_pl: { scheme: SCHEMES.inf_pl, build: (b) => infantry(b, 'pl') },
  inf_su: { scheme: SCHEMES.inf_su, build: (b) => infantry(b, 'su') },
  inf_sk: { scheme: SCHEMES.inf_sk, build: (b) => infantry(b, 'sk') },
  cav_pl: { scheme: { ...SCHEMES.inf_pl, roles: { ...SCHEMES.inf_pl.roles, horse: '#4a2e1c', mane: '#16100c', blanket: '#3b3f4a', flagA: '#e6dfd0', flagB: '#b3262e' } }, build: (b) => cavalry(b, 'pl') },
  cav_su: { scheme: { ...SCHEMES.inf_su, roles: { ...SCHEMES.inf_su.roles, horse: '#7a4a26', mane: '#3a2414', blanket: '#2f3a52' } }, build: (b) => cavalry(b, 'su') },
  art_gun: { scheme: SCHEMES.gun, build: fieldGun },
  inf_it: { scheme: SCHEMES.inf_it, build: (b) => infantry(b, 'pl') },
  inf_gr: { scheme: SCHEMES.inf_gr, build: (b) => infantry(b, 'pl') },
  inf_gb: { scheme: SCHEMES.inf_gb, build: (b) => infantry(b, 'pl') },
  inf_au: { scheme: SCHEMES.inf_au, build: (b) => infantry(b, 'pl') },
  inf_nz: { scheme: SCHEMES.inf_nz, build: (b) => infantry(b, 'pl') },
  para_de: { scheme: SCHEMES.para_de, build: (b) => infantry(b, 'de') },

};

/** 卡片展示版 */
export function buildModel(id: ModelId): THREE.Group {
  const d = DEFS[id];
  const b = new B(true);
  d.build(b);
  const g = b.toGroup(d.scheme, id);
  g.userData.modelId = id;
  return g;
}

/** 沙盘实例版：单一几何 + 顶点色 */
export function buildInstanceGeometry(id: ModelId): THREE.BufferGeometry {
  const d = DEFS[id];
  const b = new B(false);
  d.build(b);
  const g = b.toInstanceGeometry(d.scheme);
  g.name = id;
  return g;
}
