import type { ModelId } from '../../schema';

export type ModelKind = 'tank' | 'car' | 'infantry' | 'cavalry' | 'gun' | 'naval' | 'air';
export interface ModelSpec { label: string; lengthM: number; widthM: number; heightM: number; kind: ModelKind }

/**
 * 外形尺寸（米）：车辆取公开资料全长×全宽×全高（天线放倒）；
 * 步兵/骑兵/火炮为棋子整体包围盒。
 */
export const MODEL_SPECS: Record<ModelId, ModelSpec> = {
  inf_allied: { label: '盟军步兵符号模型', lengthM: 3.03, widthM: 2.52, heightM: 1.79, kind: 'infantry' },
  navy_token: { label: '海军符号模型（非实际舰型）', lengthM: 3.4, widthM: .65, heightM: 1.3, kind: 'naval' },
  air_token: { label: '航空符号模型（非实际机型）', lengthM: 3.245, widthM: 3.2, heightM: .71, kind: 'air' },
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
};
