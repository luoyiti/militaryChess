/**
 * D 模型接口（CONTRACT §8）：
 *  - MODEL_SPECS：外形尺寸
 *  - buildModel(id)：卡片展示版 THREE.Group（≤ 20k 三角形，迷彩材质 + 徽标 decal；node 下自动跳过纹理）
 *  - buildInstanceGeometry(id)：沙盘实例版单一 BufferGeometry（≤ 1.5k 三角形，position/normal/color）
 * 单位米，原点在车底中心，+X 朝前，+Y 朝上。
 */
import * as THREE from 'three';
import type { ModelId } from '../../core/types';
import { B } from './builder';
import { SCHEMES, type Scheme } from './paint';
import * as V from './vehicles';
import { infantry, cavalry, fieldGun } from './figures';
import { navalToken, aircraftToken } from './campaignTokens';
import * as A from './aircraft';
import * as S from './ships';

import { MODEL_SPECS as MODEL_SPECS_REG } from './specs';
export { MODEL_SPECS, type ModelSpec, type ModelKind } from './specs';
export { countTriangles } from './builder';

export interface Def { scheme: Scheme; build: (b: B) => void }
const TOKEN: Scheme = { camo: 'plain', c0: '#60746e', c1: '', c2: '', line: '', roles: {} };

/** 模型注册表：id → 涂装 + 构建函数。新战役的模型在此登记（或由插件 registerModel 追加）。 */
const DEFS: Record<string, Def> = {
  pz1: { scheme: SCHEMES.de, build: V.pz1 },
  pz2: { scheme: SCHEMES.de, build: V.pz2 },
  pz3: { scheme: SCHEMES.de, build: V.pz3 },
  pz4: { scheme: SCHEMES.de, build: V.pz4 },
  pz35t: { scheme: SCHEMES.de, build: V.pz35t },
  pz38t: { scheme: SCHEMES.de, build: V.pz38t },
  sdkfz231: { scheme: SCHEMES.de, build: V.sdkfz231 },
  stug3: { scheme: SCHEMES.de, build: V.stug3 },
  '7tp': { scheme: SCHEMES.pl, build: V.sevenTP },
  tks: { scheme: SCHEMES.pl, build: V.tks },
  wz34: { scheme: SCHEMES.pl, build: V.wz34 },
  t26: { scheme: SCHEMES.su, build: V.t26 },
  bt7: { scheme: SCHEMES.su, build: V.bt7 },
  t34: { scheme: SCHEMES.su, build: V.t34 },
  kv1: { scheme: SCHEMES.su, build: V.kv1 },
  inf_de: { scheme: SCHEMES.inf_de, build: (b) => infantry(b, 'de') },
  inf_pl: { scheme: SCHEMES.inf_pl, build: (b) => infantry(b, 'pl') },
  inf_su: { scheme: SCHEMES.inf_su, build: (b) => infantry(b, 'su') },
  inf_sk: { scheme: SCHEMES.inf_sk, build: (b) => infantry(b, 'sk') },
  cav_pl: { scheme: { ...SCHEMES.inf_pl, roles: { ...SCHEMES.inf_pl.roles, horse: '#4a2e1c', mane: '#16100c', blanket: '#3b3f4a', flagA: '#e6dfd0', flagB: '#b3262e' } }, build: (b) => cavalry(b, 'pl') },
  cav_su: { scheme: { ...SCHEMES.inf_su, roles: { ...SCHEMES.inf_su.roles, horse: '#7a4a26', mane: '#3a2414', blanket: '#2f3a52' } }, build: (b) => cavalry(b, 'su') },
  art_gun: { scheme: SCHEMES.gun, build: fieldGun },
  inf_it: { scheme: SCHEMES.inf_it, build: (b) => infantry(b, 'pl') },
  inf_gr: { scheme: SCHEMES.inf_gr, build: (b) => infantry(b, 'pl') },
  inf_yu: { scheme: SCHEMES.inf_yu, build: (b) => infantry(b, 'pl') },
  inf_gb: { scheme: SCHEMES.inf_gb, build: (b) => infantry(b, 'pl') },
  inf_au: { scheme: SCHEMES.inf_au, build: (b) => infantry(b, 'pl') },
  inf_hu: { scheme: SCHEMES.inf_hu, build: (b) => infantry(b, 'pl') },
  inf_bg: { scheme: SCHEMES.inf_bg, build: (b) => infantry(b, 'pl') },
  inf_nz: { scheme: SCHEMES.inf_nz, build: (b) => infantry(b, 'pl') },
  para_de: { scheme: SCHEMES.para_de, build: (b) => infantry(b, 'de') },
  inf_fi: { scheme: SCHEMES.inf_fi, build: (b) => infantry(b, 'fi') },
  inf_ro: { scheme: SCHEMES.inf_ro, build: (b) => infantry(b, 'ro') },
  // 符号化棋子（挪威）：不代表真实舰型、机型或制服
  inf_allied: { scheme: { ...SCHEMES.inf_de, roles: { ...SCHEMES.inf_de.roles, uniform: '#6e7056', helmet: '#68705f' } }, build: (b) => infantry(b, 'de') },
  navy_token: { scheme: TOKEN, build: navalToken },
  air_token: { scheme: TOKEN, build: aircraftToken },
  // 1940 年飞机（不列颠空战）
  spitfire: { scheme: SCHEMES.raf, build: A.spitfire },
  hurricane: { scheme: SCHEMES.raf, build: A.hurricane },
  bf109: { scheme: SCHEMES.luftwaffe, build: A.bf109 },
  bf110: { scheme: SCHEMES.luftwaffe, build: A.bf110 },
  he111: { scheme: SCHEMES.luftwaffe, build: A.he111 },
  do17: { scheme: SCHEMES.luftwaffe, build: A.do17 },
  ju87: { scheme: SCHEMES.luftwaffe, build: A.ju87 },
  ju88: { scheme: SCHEMES.luftwaffe, build: A.ju88 },
  // 1939 年舰船与舰载机（拉普拉塔河口海战）
  graf_spee: { scheme: SCHEMES.km_grey, build: S.grafSpee },
  exeter: { scheme: SCHEMES.rn_grey, build: S.exeter },
  leander: { scheme: SCHEMES.rn_grey, build: S.leander },
  county: { scheme: SCHEMES.rn_grey, build: S.county },
  renown: { scheme: SCHEMES.rn_dark, build: S.renown },
  ark_royal: { scheme: SCHEMES.rn_dark, build: S.arkRoyal },
  tanker: { scheme: SCHEMES.km_supply, build: S.tanker },
  merchant: { scheme: SCHEMES.merchant, build: S.merchant },
  ar196: { scheme: SCHEMES.km_air, build: S.ar196 },
  seafox: { scheme: SCHEMES.faa_silver, build: S.seafox },
  walrus: { scheme: SCHEMES.faa_silver, build: S.walrus },

};

export function registerModel(id: ModelId, def: Def, spec?: import('./specs').ModelSpec) {
  DEFS[id] = def;
  if (spec) MODEL_SPECS_REG[id] = spec;
}
export const hasModel = (id: ModelId) => id in DEFS;
export const MODEL_IDS = () => Object.keys(DEFS);

/** 卡片展示版 */
export function buildModel(id: ModelId): THREE.Group {
  const d = DEFS[id] ?? DEFS.inf_de;
  const b = new B(true);
  d.build(b);
  const g = b.toGroup(d.scheme, id);
  g.userData.modelId = id;
  return g;
}

/** 沙盘实例版：单一几何 + 顶点色 */
export function buildInstanceGeometry(id: ModelId): THREE.BufferGeometry {
  const d = DEFS[id] ?? DEFS.inf_de;
  const b = new B(false);
  d.build(b);
  const g = b.toInstanceGeometry(d.scheme);
  g.name = id;
  return g;
}
