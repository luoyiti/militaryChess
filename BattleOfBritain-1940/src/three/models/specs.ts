import type { ModelId } from '../../schema';

export type ModelKind = 'tank' | 'car' | 'infantry' | 'cavalry' | 'gun' | 'aircraft';
export interface ModelSpec { label: string; lengthM: number; widthM: number; heightM: number; kind: ModelKind }

/**
 * 外形尺寸（米）：车辆取公开资料全长×全宽×全高（天线放倒）；
 * 步兵/骑兵/火炮为棋子整体包围盒；飞机宽度为翼展、高度含起落架。
 */
export const MODEL_SPECS: Record<ModelId, ModelSpec> = {
  pz1: { label: 'I 号坦克 B 型', lengthM: 4.42, widthM: 2.06, heightM: 1.72, kind: 'tank' },
  pz2: { label: 'II 号坦克 A–C 型', lengthM: 4.81, widthM: 2.22, heightM: 1.99, kind: 'tank' },
  pz3: { label: 'III 号坦克 D 型', lengthM: 5.92, widthM: 2.82, heightM: 2.42, kind: 'tank' },
  pz4: { label: 'IV 号坦克 B/C 型', lengthM: 5.92, widthM: 2.83, heightM: 2.68, kind: 'tank' },
  pz35t: { label: '35(t) 坦克（LT vz.35）', lengthM: 4.9, widthM: 2.06, heightM: 2.37, kind: 'tank' },
  pz38t: { label: '38(t) 坦克（LT vz.38）', lengthM: 4.61, widthM: 2.14, heightM: 2.4, kind: 'tank' },
  sdkfz231: { label: 'Sd.Kfz.231 八轮重型装甲车', lengthM: 5.85, widthM: 2.2, heightM: 2.35, kind: 'car' },
  '7tp': { label: '7TP 单炮塔型（jw）', lengthM: 4.6, widthM: 2.4, heightM: 2.27, kind: 'tank' },
  tks: { label: 'TKS 超轻型坦克', lengthM: 2.58, widthM: 1.76, heightM: 1.33, kind: 'tank' },
  wz34: { label: 'wz.34 装甲车', lengthM: 3.62, widthM: 1.91, heightM: 2.22, kind: 'car' },
  t26: { label: 'T-26 1933 年型', lengthM: 4.65, widthM: 2.44, heightM: 2.24, kind: 'tank' },
  bt7: { label: 'BT-7 快速坦克', lengthM: 5.66, widthM: 2.29, heightM: 2.42, kind: 'tank' },
  inf_de: { label: '德军步兵班组', lengthM: 3.03, widthM: 2.52, heightM: 1.79, kind: 'infantry' },
  inf_pl: { label: '波兰步兵班组', lengthM: 3.03, widthM: 2.52, heightM: 1.79, kind: 'infantry' },
  inf_su: { label: '苏军步兵班组', lengthM: 3.48, widthM: 2.52, heightM: 1.81, kind: 'infantry' },
  inf_sk: { label: '斯洛伐克步兵班组', lengthM: 3.03, widthM: 2.52, heightM: 1.79, kind: 'infantry' },
  cav_pl: { label: '波兰枪骑兵', lengthM: 2.86, widthM: 0.82, heightM: 3.7, kind: 'cavalry' },
  cav_su: { label: '苏军骑兵', lengthM: 2.48, widthM: 0.78, heightM: 2.46, kind: 'cavalry' },
  art_gun: { label: '75 mm 野炮（带防盾）', lengthM: 4.2, widthM: 1.8, heightM: 1.55, kind: 'gun' },
  spitfire: { label: '喷火 Mk I 战斗机', lengthM: 9.12, widthM: 11.23, heightM: 3.86, kind: 'aircraft' },
  hurricane: { label: '飓风 Mk I 战斗机', lengthM: 9.84, widthM: 12.19, heightM: 3.96, kind: 'aircraft' },
  bf109: { label: 'Bf 109 E-3 战斗机', lengthM: 8.64, widthM: 9.87, heightM: 3.4, kind: 'aircraft' },
  bf110: { label: 'Bf 110 C 重型战斗机', lengthM: 12.65, widthM: 16.27, heightM: 3.5, kind: 'aircraft' },
  he111: { label: 'He 111 H-3 轰炸机', lengthM: 16.4, widthM: 22.6, heightM: 4, kind: 'aircraft' },
  do17: { label: 'Do 17 Z-2 轰炸机', lengthM: 15.8, widthM: 18, heightM: 4.56, kind: 'aircraft' },
  ju87: { label: 'Ju 87 B-2 俯冲轰炸机', lengthM: 11.1, widthM: 13.8, heightM: 4.23, kind: 'aircraft' },
  ju88: { label: 'Ju 88 A-1 轰炸机', lengthM: 14.36, widthM: 18.25, heightM: 5.07, kind: 'aircraft' },
};
