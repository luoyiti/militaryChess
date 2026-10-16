/**
 * 舰船俯视剪影：按 ship.silhouette（缺省按 ship.kind）选样式——舰体半宽剖面 + 炮塔、舰桥、烟囱、桅杆、弹射器、飞行甲板等部件，
 * 炮塔位置优先取 ship.weapons[].atPct。2D 海战层（Canvas）、部队卡（SVG 俯视图与侧视损伤图）共用同一份布局。
 *
 * 坐标约定（归一化）：x ∈ [-0.5, 0.5]，+0.5 为舰艏；y 以舰宽为单位 ∈ [-0.5, 0.5]，+y 为右舷
 * （画布 y 向下、舰艏朝 +x 时右舷在 +y 一侧）。部件位置用「自舰艏起的比例」f ∈ [0, 1] 书写，x = 0.5 − f。
 * 只做几何与绘制，不访问 DOM（Node 端可导入）。
 */
import type { ShipInfo, ShipKind, ShipWeapon } from '../core/types';

export interface SilTurret { f: number; n: number; id?: string }
export type BlockKind = 'bridge' | 'tower' | 'house' | 'island' | 'hatch' | 'forecastle' | 'boat' | 'hangar';
export interface SilBlock { f0: number; f1: number; w: number; y?: number; kind: BlockKind; h?: number }
export interface SilFunnel { f: number; len: number; w: number; y?: number; h?: number }
export interface SilSpec {
  id: string;
  /** 画法舰宽 / 舰长（接近真实比例，绘制时再按尺寸放大） */
  beam: number;
  /** 半宽剖面：[自舰艏比例, 半宽比例 0..1]，单调三次插值（不过冲） */
  hull: [number, number][];
  /** 缺省主炮口径（毫米）：炮塔大小与炮管长度 */
  calMm: number;
  turrets: SilTurret[];
  blocks: SilBlock[];
  funnels: SilFunnel[];
  masts?: number[];
  catapult?: { f: number; len: number; deg: number };
  /** 副炮：每舷 n 座，f0..f1 均布 */
  secondary?: { f0: number; f1: number; n: number; cal: number; perMount?: number };
  /** 鱼雷发射管（两舷） */
  tubes?: number[];
  flightDeck?: boolean;
  /** 侧视：干舷高 / 舰长（舰艏、舯部、舰艉） */
  freeboard?: [number, number, number];
  /** 船型：warship（军舰灰色系）/ merchant（商船） */
  civil?: boolean;
}

// ---------- 样式表 ----------
const CRUISER_HULL: [number, number][] = [[0, 0], [0.03, 0.26], [0.08, 0.52], [0.16, 0.8], [0.26, 0.95], [0.36, 1], [0.62, 1], [0.76, 0.95], [0.87, 0.82], [0.95, 0.62], [0.99, 0.36], [1, 0]];
const CAPITAL_HULL: [number, number][] = [[0, 0], [0.04, 0.24], [0.1, 0.52], [0.2, 0.82], [0.3, 0.97], [0.4, 1], [0.66, 1], [0.8, 0.94], [0.9, 0.8], [0.96, 0.6], [0.995, 0.34], [1, 0]];
const MERCHANT_HULL: [number, number][] = [[0, 0], [0.025, 0.42], [0.07, 0.76], [0.14, 0.95], [0.22, 1], [0.8, 1], [0.9, 0.93], [0.96, 0.78], [0.995, 0.56], [1, 0.4]];

export const SILHOUETTES: Record<string, SilSpec> = {
  // 德意志级装甲舰：修长舰体、飞剪舰艏、前后各一座三联装 28 cm 炮塔、塔式舰桥、单烟囱、弹射器
  graf_spee: {
    id: 'graf_spee', beam: 0.116, hull: CAPITAL_HULL, calMm: 283,
    turrets: [{ f: 0.26, n: 3, id: 'A' }, { f: 0.76, n: 3, id: 'B' }],
    blocks: [{ f0: 0.31, f1: 0.42, w: 0.5, kind: 'tower', h: 0.12 }, { f0: 0.62, f1: 0.7, w: 0.34, kind: 'house', h: 0.05 }],
    funnels: [{ f: 0.5, len: 0.06, w: 0.34, h: 0.08 }],
    masts: [0.665], catapult: { f: 0.575, len: 0.085, deg: 18 },
    secondary: { f0: 0.41, f1: 0.61, n: 4, cal: 150 }, tubes: [0.88], freeboard: [0.05, 0.034, 0.03],
  },
  // 约克级（埃克塞特号）：A、B 两座双联装 8 英寸炮塔在前、Y 在后，两座直立烟囱
  york: {
    id: 'york', beam: 0.101, hull: CRUISER_HULL, calMm: 203,
    turrets: [{ f: 0.2, n: 2, id: 'A' }, { f: 0.28, n: 2, id: 'B' }, { f: 0.8, n: 2, id: 'Y' }],
    blocks: [{ f0: 0.32, f1: 0.4, w: 0.48, kind: 'bridge', h: 0.075 }, { f0: 0.62, f1: 0.7, w: 0.3, kind: 'house', h: 0.04 }],
    funnels: [{ f: 0.45, len: 0.05, w: 0.3, h: 0.07 }, { f: 0.535, len: 0.05, w: 0.3, h: 0.07 }],
    masts: [0.36, 0.69], catapult: { f: 0.6, len: 0.075, deg: 25 },
    secondary: { f0: 0.47, f1: 0.58, n: 2, cal: 102 }, tubes: [0.56], freeboard: [0.05, 0.032, 0.028],
  },
  // 利安德级（阿贾克斯号、阿基里斯号）：A、B / X、Y 四座双联装 6 英寸炮塔，一座粗大的合并烟囱
  leander: {
    id: 'leander', beam: 0.101, hull: CRUISER_HULL, calMm: 152,
    turrets: [{ f: 0.2, n: 2, id: 'A' }, { f: 0.28, n: 2, id: 'B' }, { f: 0.72, n: 2, id: 'X' }, { f: 0.8, n: 2, id: 'Y' }],
    blocks: [{ f0: 0.31, f1: 0.39, w: 0.46, kind: 'bridge', h: 0.075 }, { f0: 0.6, f1: 0.67, w: 0.3, kind: 'house', h: 0.035 }],
    funnels: [{ f: 0.485, len: 0.1, w: 0.42, h: 0.075 }],
    masts: [0.35, 0.64], catapult: { f: 0.575, len: 0.075, deg: 20 },
    secondary: { f0: 0.54, f1: 0.62, n: 2, cal: 102, perMount: 2 }, tubes: [0.56], freeboard: [0.05, 0.03, 0.026],
  },
  // 郡级（坎伯兰号）：四座双联装 8 英寸炮塔、三座烟囱
  county: {
    id: 'county', beam: 0.108, hull: CRUISER_HULL, calMm: 203,
    turrets: [{ f: 0.17, n: 2, id: 'A' }, { f: 0.25, n: 2, id: 'B' }, { f: 0.74, n: 2, id: 'X' }, { f: 0.82, n: 2, id: 'Y' }],
    blocks: [{ f0: 0.29, f1: 0.37, w: 0.46, kind: 'bridge', h: 0.08 }, { f0: 0.62, f1: 0.69, w: 0.3, kind: 'house', h: 0.04 }],
    funnels: [{ f: 0.41, len: 0.045, w: 0.28, h: 0.08 }, { f: 0.48, len: 0.045, w: 0.28, h: 0.08 }, { f: 0.55, len: 0.045, w: 0.28, h: 0.08 }],
    masts: [0.33, 0.68], catapult: { f: 0.615, len: 0.07, deg: 22 },
    secondary: { f0: 0.44, f1: 0.58, n: 2, cal: 102 }, freeboard: [0.055, 0.04, 0.034],
  },
  // 声望级战列巡洋舰：三座双联装 15 英寸炮塔（A、B / Y），两座烟囱，三联装副炮
  battlecruiser: {
    id: 'battlecruiser', beam: 0.112, hull: CAPITAL_HULL, calMm: 381,
    turrets: [{ f: 0.2, n: 2, id: 'A' }, { f: 0.285, n: 2, id: 'B' }, { f: 0.8, n: 2, id: 'Y' }],
    blocks: [{ f0: 0.32, f1: 0.41, w: 0.5, kind: 'tower', h: 0.1 }, { f0: 0.64, f1: 0.72, w: 0.32, kind: 'house', h: 0.05 }],
    funnels: [{ f: 0.46, len: 0.05, w: 0.3, h: 0.07 }, { f: 0.555, len: 0.05, w: 0.3, h: 0.07 }],
    masts: [0.37, 0.69], secondary: { f0: 0.4, f1: 0.66, n: 4, cal: 114, perMount: 3 }, freeboard: [0.045, 0.03, 0.026],
  },
  // 通用战列舰：四座双联装主炮
  battleship: {
    id: 'battleship', beam: 0.135, hull: CAPITAL_HULL, calMm: 381,
    turrets: [{ f: 0.18, n: 2, id: 'A' }, { f: 0.26, n: 2, id: 'B' }, { f: 0.74, n: 2, id: 'X' }, { f: 0.82, n: 2, id: 'Y' }],
    blocks: [{ f0: 0.3, f1: 0.4, w: 0.48, kind: 'tower', h: 0.11 }, { f0: 0.62, f1: 0.7, w: 0.32, kind: 'house', h: 0.05 }],
    funnels: [{ f: 0.47, len: 0.07, w: 0.32, h: 0.07 }],
    masts: [0.35, 0.66], secondary: { f0: 0.38, f1: 0.64, n: 4, cal: 152 }, freeboard: [0.045, 0.03, 0.026],
  },
  // 敦刻尔克级：两座四联装 330 毫米炮塔全在前部，塔式舰桥，单烟囱，舰艉机库
  dunkerque: {
    id: 'dunkerque', beam: 0.145, hull: CAPITAL_HULL, calMm: 330,
    turrets: [{ f: 0.2, n: 4, id: 'A' }, { f: 0.3, n: 4, id: 'B' }],
    blocks: [{ f0: 0.36, f1: 0.45, w: 0.46, kind: 'tower', h: 0.12 }, { f0: 0.82, f1: 0.95, w: 0.5, kind: 'hangar', h: 0.035 }],
    funnels: [{ f: 0.53, len: 0.06, w: 0.34, h: 0.06 }],
    masts: [0.62], catapult: { f: 0.9, len: 0.07, deg: 0 },
    secondary: { f0: 0.6, f1: 0.76, n: 2, cal: 130, perMount: 4 }, freeboard: [0.05, 0.03, 0.022],
  },
  // 航空母舰（皇家方舟号）：飞行甲板、右舷舰岛、升降机
  carrier: {
    id: 'carrier', beam: 0.125, hull: [[0, 0.12], [0.02, 0.52], [0.06, 0.82], [0.12, 0.97], [0.18, 1], [0.86, 1], [0.94, 0.92], [0.985, 0.72], [1, 0.5]],
    calMm: 114, turrets: [], flightDeck: true,
    blocks: [{ f0: 0.36, f1: 0.52, w: 0.17, y: 0.39, kind: 'island', h: 0.07 }],
    funnels: [{ f: 0.45, len: 0.05, w: 0.12, y: 0.39, h: 0.08 }],
    masts: [], freeboard: [0.075, 0.07, 0.07],
  },
  // 油船 / 补给舰（阿尔特马克号）：舯部舰桥，机舱与烟囱在艉
  tanker: {
    id: 'tanker', beam: 0.124, hull: MERCHANT_HULL, calMm: 105, turrets: [], civil: true,
    blocks: [{ f0: 0, f1: 0.1, w: 0.9, kind: 'forecastle', h: 0.012 }, { f0: 0.33, f1: 0.42, w: 0.82, kind: 'bridge', h: 0.05 }, { f0: 0.78, f1: 0.97, w: 0.84, kind: 'house', h: 0.04 }],
    funnels: [{ f: 0.86, len: 0.045, w: 0.3, h: 0.055 }],
    masts: [0.15, 0.58], freeboard: [0.04, 0.025, 0.035],
  },
  // 货船：舯部上层建筑、前后货舱口、吊杆桅
  merchant: {
    id: 'merchant', beam: 0.135, hull: MERCHANT_HULL, calMm: 100, turrets: [], civil: true,
    blocks: [
      { f0: 0, f1: 0.08, w: 0.9, kind: 'forecastle', h: 0.012 },
      { f0: 0.1, f1: 0.17, w: 0.5, kind: 'hatch' }, { f0: 0.22, f1: 0.3, w: 0.5, kind: 'hatch' },
      { f0: 0.38, f1: 0.55, w: 0.8, kind: 'house', h: 0.05 },
      { f0: 0.62, f1: 0.7, w: 0.5, kind: 'hatch' }, { f0: 0.76, f1: 0.84, w: 0.5, kind: 'hatch' },
      { f0: 0.9, f1: 1, w: 0.8, kind: 'forecastle', h: 0.012 },
    ],
    funnels: [{ f: 0.48, len: 0.05, w: 0.3, h: 0.06 }],
    masts: [0.195, 0.73], freeboard: [0.04, 0.028, 0.035],
  },
  // 客轮：长上层建筑、两座烟囱、两舷救生艇
  liner: {
    id: 'liner', beam: 0.125, hull: [[0, 0], [0.05, 0.4], [0.12, 0.74], [0.22, 0.95], [0.3, 1], [0.75, 1], [0.88, 0.88], [0.96, 0.68], [1, 0.48]], calMm: 100, turrets: [], civil: true,
    blocks: [
      { f0: 0.22, f1: 0.76, w: 0.82, kind: 'house', h: 0.055 }, { f0: 0.24, f1: 0.3, w: 0.6, kind: 'bridge', h: 0.075 },
      { f0: 0.34, f1: 0.4, w: 0.12, y: 0.43, kind: 'boat' }, { f0: 0.34, f1: 0.4, w: 0.12, y: -0.43, kind: 'boat' },
      { f0: 0.5, f1: 0.56, w: 0.12, y: 0.43, kind: 'boat' }, { f0: 0.5, f1: 0.56, w: 0.12, y: -0.43, kind: 'boat' },
      { f0: 0.64, f1: 0.7, w: 0.12, y: 0.43, kind: 'boat' }, { f0: 0.64, f1: 0.7, w: 0.12, y: -0.43, kind: 'boat' },
    ],
    funnels: [{ f: 0.42, len: 0.05, w: 0.3, h: 0.07 }, { f: 0.56, len: 0.05, w: 0.3, h: 0.07 }],
    masts: [0.12, 0.85], freeboard: [0.045, 0.035, 0.04],
  },
  destroyer: {
    id: 'destroyer', beam: 0.1, hull: [[0, 0], [0.05, 0.32], [0.14, 0.7], [0.26, 0.95], [0.36, 1], [0.7, 1], [0.85, 0.9], [0.95, 0.72], [1, 0.55]], calMm: 120,
    turrets: [{ f: 0.13, n: 1, id: 'A' }, { f: 0.21, n: 1, id: 'B' }, { f: 0.76, n: 1, id: 'X' }, { f: 0.87, n: 1, id: 'Y' }],
    blocks: [{ f0: 0.24, f1: 0.31, w: 0.5, kind: 'bridge', h: 0.06 }],
    funnels: [{ f: 0.38, len: 0.05, w: 0.3, h: 0.06 }, { f: 0.49, len: 0.05, w: 0.3, h: 0.06 }],
    masts: [0.32], tubes: [0.57, 0.67], freeboard: [0.05, 0.03, 0.025],
  },
  submarine: {
    id: 'submarine', beam: 0.09, hull: [[0, 0.1], [0.08, 0.6], [0.2, 0.95], [0.5, 1], [0.8, 0.85], [0.95, 0.4], [1, 0.1]], calMm: 88,
    turrets: [{ f: 0.3, n: 1, id: 'gun' }], blocks: [{ f0: 0.38, f1: 0.49, w: 0.44, kind: 'tower', h: 0.05 }], funnels: [], freeboard: [0.012, 0.01, 0.008],
  },
  tug: {
    id: 'tug', beam: 0.27, hull: [[0, 0.05], [0.06, 0.55], [0.16, 0.88], [0.3, 1], [0.7, 1], [0.85, 0.9], [0.95, 0.7], [1, 0.45]], calMm: 0, turrets: [], civil: true,
    blocks: [{ f0: 0.22, f1: 0.56, w: 0.68, kind: 'house', h: 0.09 }], funnels: [{ f: 0.45, len: 0.08, w: 0.3, h: 0.1 }], masts: [0.28], freeboard: [0.07, 0.05, 0.05],
  },
  boat: {
    id: 'boat', beam: 0.3, hull: [[0, 0.05], [0.1, 0.6], [0.25, 0.95], [0.45, 1], [0.8, 0.95], [1, 0.7]], calMm: 0, turrets: [], civil: true,
    blocks: [{ f0: 0.3, f1: 0.62, w: 0.62, kind: 'house', h: 0.08 }], funnels: [], freeboard: [0.08, 0.06, 0.06],
  },
};
/** 常见别名（数据作者可直接写舰名 / 舰级） */
const ALIAS: Record<string, string> = {
  deutschland: 'graf_spee', pocket_battleship: 'graf_spee', admiral_graf_spee: 'graf_spee', admiral_scheer: 'graf_spee',
  exeter: 'york', ajax: 'leander', achilles: 'leander', neptune: 'leander', cumberland: 'county', sussex: 'county', shropshire: 'county', dorsetshire: 'county',
  renown: 'battlecruiser', strasbourg: 'dunkerque', ark_royal: 'carrier', altmark: 'tanker', cargo: 'merchant', freighter: 'merchant',
  heavy_cruiser: 'county', light_cruiser: 'leander',
};
const KIND_DEFAULT: Record<ShipKind, string> = {
  battleship: 'battleship', battlecruiser: 'battlecruiser', pocket_battleship: 'graf_spee', carrier: 'carrier', heavy_cruiser: 'county',
  light_cruiser: 'leander', destroyer: 'destroyer', submarine: 'submarine', auxiliary: 'merchant', tanker: 'tanker', merchant: 'merchant',
  liner: 'liner', tug: 'tug', boat: 'boat',
};
/** 剪影样式：ship.silhouette（或别名）→ 缺省按 kind */
export function silhouetteOf(ship: Pick<ShipInfo, 'kind' | 'silhouette'>): SilSpec {
  const k = ship.silhouette?.toLowerCase();
  return (k && (SILHOUETTES[k] ?? SILHOUETTES[ALIAS[k] ?? ''])) || SILHOUETTES[KIND_DEFAULT[ship.kind] ?? 'merchant'] || SILHOUETTES.merchant;
}
/** 缺省舰长（米），没有 lengthM 时用于尺寸与炮塔比例 */
const KIND_LENGTH: Record<string, number> = {
  battleship: 230, battlecruiser: 242, pocket_battleship: 186, carrier: 240, heavy_cruiser: 190, light_cruiser: 165, destroyer: 110,
  submarine: 70, auxiliary: 140, tanker: 160, merchant: 130, liner: 180, tug: 32, boat: 14,
};

// ---------- 口径解析（与 engine/naval/model.ts 的 caliberMm 同一规则；这里只取数，不依赖时间初始化） ----------
function calMm(cal: string | undefined, dflt: number): number {
  if (!cal) return dflt;
  const m = /([\d.]+)\s*(cm|mm|in|inch|″|")/i.exec(cal);
  if (!m) return dflt;
  const v = Number(m[1]), u = m[2].toLowerCase();
  return u === 'cm' ? v * 10 : u === 'mm' ? v : v * 25.4;
}
/** 炮塔直径（米）：按口径与联装数的经验值（双联 8 英寸约 7.5 m，三联 28 cm 约 11 m） */
const turretDiaM = (cal: number, n: number) => (2.2 + cal * 0.026) * (n >= 4 ? 1.3 : n === 3 ? 1.15 : n === 1 ? 0.62 : 1);
/** 炮管伸出长度（米）：约 45 倍口径减去炮塔内部分 */
const barrelM = (cal: number) => Math.max(1.5, cal * 0.045);

// ---------- 布局 ----------
export interface LTurret {
  /** 归一化位置（x：+0.5 舰艏；y：舰宽单位） */
  x: number; y: number;
  n: number; calMm: number;
  /** 直径 / 炮管长度（舰长比例） */
  d: number; barrel: number;
  id: string | null;
  /** 背负式（B、X）/ 艉部炮塔（静止时炮口朝后）/ 副炮 */
  sup: boolean; aft: boolean; small: boolean;
}
export interface LBlock extends SilBlock { x0: number; x1: number }
export interface LFunnel extends SilFunnel { x: number }
export interface ShipLayout {
  spec: SilSpec;
  lengthM: number;
  /** 舰宽 / 舰长（ship.beamM 优先） */
  beamRatio: number;
  /** 闭合轮廓（右舷舰艏 → 舰艉 → 左舷 → 舰艏），x,y 交替 */
  hull: Float32Array;
  turrets: LTurret[];
  blocks: LBlock[];
  funnels: LFunnel[];
  masts: number[];
  tubes: { x: number; y: number; len: number }[];
  catapult: { x: number; len: number; deg: number } | null;
}

/** 单调三次插值（Fritsch–Carlson）：半宽剖面不过冲 */
function pchip(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length, d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) if (d[i - 1] * d[i] > 0) { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const hullCache = new Map<string, Float32Array>();
/** 闭合舰体轮廓（归一化），按样式缓存 */
export function hullOutline(spec: SilSpec, samples = 30): Float32Array {
  const key = `${spec.id}:${samples}`;
  const hit = hullCache.get(key);
  if (hit) return hit;
  const f = pchip(spec.hull.map((p) => p[0]), spec.hull.map((p) => p[1]));
  const fs: number[] = [];
  for (let i = 0; i <= samples; i++) fs.push((1 - Math.cos((Math.PI * i) / samples)) / 2); // 两端加密
  const out = new Float32Array((fs.length * 2) * 2);
  let k = 0;
  for (const s of fs) { out[k++] = 0.5 - s; out[k++] = Math.max(0, f(s)) * 0.5; }
  for (let i = fs.length - 1; i >= 0; i--) { const s = fs[i]; out[k++] = 0.5 - s; out[k++] = -Math.max(0, f(s)) * 0.5; }
  hullCache.set(key, out);
  return out;
}

/** 舰船的完整布局（炮塔取 weapons[].atPct；缺省用样式表） */
export function shipLayout(ship: ShipInfo): ShipLayout {
  const spec = silhouetteOf(ship);
  const lengthM = ship.lengthM ?? KIND_LENGTH[ship.kind] ?? 150;
  const beamM = ship.beamM ?? spec.beam * lengthM;
  const ws = ship.weapons ?? [];
  const placed = ws.filter((w) => (w.kind === 'main' || w.kind === 'secondary') && w.atPct !== undefined && (w.mounts ?? 1) === 1);
  const turrets: LTurret[] = [];
  const mk = (f: number, n: number, cal: number, id: string | null, small: boolean, y = 0): LTurret => {
    const d = turretDiaM(cal || 120, n);
    return { x: 0.5 - f, y, n, calMm: cal, d: d / lengthM, barrel: barrelM(cal || 100) / lengthM, id, sup: false, aft: f > 0.5, small };
  };
  const mainCal = calMm(ws.find((w) => w.kind === 'main')?.cal, spec.calMm);
  if (placed.length) for (const w of placed) turrets.push(mk(w.atPct! / 100, w.perMount ?? 2, calMm(w.cal, mainCal), w.id, w.kind === 'secondary'));
  else for (const t of spec.turrets) turrets.push(mk(t.f, t.n, mainCal, t.id ?? null, false));
  // 背负式：同一端（艏/艉）靠近舯部的炮塔
  for (const end of [false, true]) {
    const group = turrets.filter((t) => !t.small && t.aft === end).sort((a, b) => (end ? a.x - b.x : b.x - a.x));
    group.forEach((t, i) => (t.sup = i > 0));
  }
  // 副炮组（weapons 中 mounts > 1 的副炮按 atPct 沿两舷均布；否则用样式表）
  const battery = ws.find((w) => w.kind === 'secondary' && (w.mounts ?? 1) > 1);
  const sec = spec.secondary;
  if (battery) {
    const per = Math.ceil((battery.mounts ?? 2) / 2), c = (battery.atPct ?? 50) / 100, span = Math.min(0.24, 0.05 * per);
    const cal = calMm(battery.cal, 150);
    for (let i = 0; i < per; i++) {
      const f = per > 1 ? c - span / 2 + (span * i) / (per - 1) : c;
      for (const side of [1, -1]) turrets.push({ ...mk(f, battery.perMount ?? 1, cal, battery.id, true, side * 0.33), aft: false });
    }
  } else if (sec && !placed.some((w) => w.kind === 'secondary')) {
    for (let i = 0; i < sec.n; i++) {
      const f = sec.n > 1 ? sec.f0 + ((sec.f1 - sec.f0) * i) / (sec.n - 1) : (sec.f0 + sec.f1) / 2;
      for (const side of [1, -1]) turrets.push({ ...mk(f, sec.perMount ?? 1, sec.cal, null, true, side * 0.33), aft: false });
    }
  }
  // 鱼雷发射管
  const tubeW = ws.filter((w) => w.kind === 'torpedo');
  const tubeF = tubeW.length ? tubeW.map((w) => (w.atPct ?? 55) / 100) : spec.tubes ?? [];
  const tubes = tubeF.flatMap((f) => [1, -1].map((side) => ({ x: 0.5 - f, y: side * 0.3, len: Math.max(0.03, 7 / lengthM) })));
  return {
    spec, lengthM, hull: hullOutline(spec), turrets,
    blocks: spec.blocks.map((b) => ({ ...b, x0: 0.5 - b.f0, x1: 0.5 - b.f1 })),
    funnels: spec.funnels.map((fn) => ({ ...fn, x: 0.5 - fn.f })),
    masts: (spec.masts ?? []).map((f) => 0.5 - f),
    tubes,
    catapult: spec.catapult ? { x: 0.5 - spec.catapult.f, len: spec.catapult.len, deg: spec.catapult.deg } : null,
    beamRatio: Math.max(0.06, Math.min(0.4, beamM / lengthM)),
  };
}
/** 画法舰宽比：真实比例 × 夸大系数（棋子尺寸更胖，便于辨认；战术缩放接近真实） */
export function drawBeam(lay: ShipLayout, lengthPx: number): number {
  const ex = Math.max(1.12, Math.min(1.65, 1.95 - lengthPx / 70));
  return Math.max(3.2, lay.beamRatio * ex * lengthPx);
}
/** 武器的短标签：'28 cm SK C/28' → '28 cm'；'8in Mk VIII' → '8 英寸' */
export function calLabel(w: Pick<ShipWeapon, 'cal'> | undefined): string {
  if (!w?.cal) return '';
  const m = /([\d.]+)\s*(cm|mm|in|inch|″|")/i.exec(w.cal);
  if (!m) return w.cal;
  const u = m[2].toLowerCase();
  return u === 'cm' ? `${m[1]} cm` : u === 'mm' ? `${m[1]} mm` : `${m[1]} 英寸`;
}
export const WEAPON_KIND_ZH: Record<ShipWeapon['kind'], string> = { main: '主炮', secondary: '副炮', aa: '高炮', torpedo: '鱼雷' };

// ---------- Canvas 绘制 ----------
export interface ShipPalette { fill: string; edge: string; deck: string; ink: string; paper: string; }
export interface DrawShipOpts {
  L: number; W: number;
  pal: ShipPalette;
  /** 0 = 标绘棋子（点状炮塔）1 = 中等（舰桥、炮管）2 = 全细节（副炮、桅杆、弹射器、鱼雷管） */
  detail: 0 | 1 | 2;
  gunsOut?: Set<string> | null;
  /** 炮塔回旋：返回相对舰艏的角度（弧度，正 = 向右舷），null = 静止位置 */
  train?: ((t: LTurret) => number | null) | null;
}
type Ctx = CanvasRenderingContext2D;

export function traceHull(ctx: Ctx, hull: Float32Array, L: number, W: number, sx = 1, sy = 1) {
  ctx.beginPath();
  for (let i = 0; i < hull.length; i += 2) {
    const x = hull[i] * L * sx, y = hull[i + 1] * W * sy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y); ctx.closePath();
}

/** 被打哑的武器：红色 ✕（带纸色衬底） */
export function drawCross(ctx: Ctx, x: number, y: number, r: number) {
  ctx.lineCap = 'round';
  for (const [col, lw] of [['rgba(250,244,228,.9)', Math.max(2.4, r * 0.62)], ['#c0222b', Math.max(1.3, r * 0.34)]] as const) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x - r, y + r); ctx.lineTo(x + r, y - r); ctx.stroke();
  }
}

/** 在当前变换下画一艘舰（原点 = 舰中心，+x = 舰艏，单位像素） */
export function drawShip(ctx: Ctx, lay: ShipLayout, o: DrawShipOpts) {
  const { L, W, pal, detail } = o;
  const spec = lay.spec;
  // 舰体
  traceHull(ctx, lay.hull, L, W);
  ctx.fillStyle = pal.fill; ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pal.edge; ctx.lineWidth = detail === 0 ? 0.9 : 1.1; ctx.stroke();
  // 甲板（舷边留一圈阵营色）
  if (detail > 0 || spec.flightDeck) {
    traceHull(ctx, lay.hull, L, W, spec.flightDeck ? 0.985 : 0.955, spec.flightDeck ? 0.9 : 0.66);
    ctx.fillStyle = pal.deck; ctx.fill();
  }
  if (spec.flightDeck) drawFlightDeck(ctx, L, W, pal, detail);
  // 上层建筑
  if (detail > 0) for (const b of lay.blocks) drawBlock(ctx, b, L, W, pal, detail);
  // 弹射器（含水上飞机）
  if (detail === 2 && lay.catapult) {
    const c = lay.catapult, cx = c.x * L, a = (c.deg * Math.PI) / 180, hl = (c.len * L) / 2;
    ctx.strokeStyle = pal.ink; ctx.lineWidth = Math.max(0.8, W * 0.06);
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * hl, -Math.sin(a) * hl); ctx.lineTo(cx + Math.cos(a) * hl, Math.sin(a) * hl); ctx.stroke();
    if (L > 70) { // 水上飞机：小十字
      const px = cx + Math.cos(a) * hl * 0.3, py = Math.sin(a) * hl * 0.3, s = W * 0.32;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ctx.fillStyle = pal.paper; ctx.strokeStyle = pal.ink; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.rect(-s * 0.15, -s, s * 0.3, s * 2); ctx.rect(-s * 0.9, -s * 0.08, s * 1.4, s * 0.16); ctx.rect(-s * 0.9, -s * 0.35, s * 0.18, s * 0.7);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  // 烟囱
  for (const fn of lay.funnels) {
    const fx = fn.x * L, fy = (fn.y ?? 0) * W, rx = Math.max(detail === 0 ? 1.1 : 1.4, (fn.len * L) / 2), ry = Math.max(detail === 0 ? 0.9 : 1.2, (fn.w * W) / 2);
    ctx.beginPath(); ctx.ellipse(fx, fy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = pal.ink; ctx.fill();
    if (detail > 0 && rx > 2.2) {
      ctx.strokeStyle = 'rgba(240,232,212,.55)'; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(fx - rx * 0.08, fy, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#0d0a06'; ctx.fill();
    }
  }
  // 桅杆
  if (detail === 2) for (const mx of lay.masts) {
    const x = mx * L, r = Math.max(0.9, W * 0.07);
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x, -W * 0.42); ctx.lineTo(x, W * 0.42); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, 0, r, 0, Math.PI * 2); ctx.fillStyle = pal.ink; ctx.fill();
  }
  // 鱼雷发射管
  if (detail === 2) for (const tb of lay.tubes) {
    const x = tb.x * L, y = tb.y * W, len = tb.len * L;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tb.y > 0 ? 0.5 : -0.5);
    ctx.fillStyle = pal.ink; ctx.fillRect(-len / 2, -W * 0.05, len, W * 0.1); ctx.restore();
  }
  // 炮塔：先副炮，再主炮（背负式最后，压在低位炮塔的炮管上）
  const order = [...lay.turrets].sort((a, b) => Number(!a.small) - Number(!b.small) || Number(a.sup) - Number(b.sup));
  for (const t of order) {
    if (t.small && detail < 2) continue;
    drawTurret(ctx, t, L, W, pal, detail, o.train?.(t) ?? null);
  }
  // 打哑的武器
  if (o.gunsOut?.size) {
    const seen = new Set<string>();
    for (const t of lay.turrets) {
      if (!t.id || !o.gunsOut.has(t.id)) continue;
      if (t.small) { if (detail < 2 || seen.has(t.id)) continue; seen.add(t.id); }
      drawCross(ctx, t.x * L, t.y * W, Math.max(2.4, turretPx(t, L, W) * 0.55));
    }
  }
}

/** 炮塔在当前尺寸下的像素直径（下限保证可见） */
export function turretPx(t: LTurret, L: number, W: number): number {
  const real = t.d * L;
  if (t.small) return Math.max(1.2, Math.min(W * 0.26, real * 1.2));
  return Math.max(W * 0.5, Math.min(W * 0.8, real * (t.n >= 3 ? 1.1 : 1.15)));
}

function drawTurret(ctx: Ctx, t: LTurret, L: number, W: number, pal: ShipPalette, detail: number, trained: number | null) {
  const d = turretPx(t, L, W);
  const x = t.x * L, y = t.y * W;
  if (detail === 0) { // 棋子：深色小块
    ctx.fillStyle = pal.ink;
    ctx.beginPath(); roundRect(ctx, x - d * 0.4, y - d * 0.42, d * 0.8, d * 0.84, d * 0.25); ctx.fill();
    return;
  }
  const rest = t.aft ? Math.PI : 0;
  const ang = trained ?? (t.small ? (t.y > 0 ? 0.25 : -0.25) : rest);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  // 炮管
  const bl = Math.max(d * 0.55, t.barrel * L * (detail === 2 ? 1 : 0.8));
  const gap = d * (t.n >= 4 ? 0.2 : t.n === 3 ? 0.27 : 0.3);
  ctx.strokeStyle = pal.ink; ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(0.7, d * (t.small ? 0.16 : 0.11));
  ctx.beginPath();
  for (let i = 0; i < t.n; i++) {
    const by = t.n === 1 ? 0 : (i - (t.n - 1) / 2) * gap * (t.n >= 4 ? 0.85 : 1);
    ctx.moveTo(d * 0.3, by); ctx.lineTo(d * 0.3 + bl, by);
  }
  ctx.stroke();
  // 炮塔：前缘平直、后部圆弧
  ctx.beginPath();
  const hw = d * 0.5;
  ctx.moveTo(d * 0.42, -hw * 0.86); ctx.lineTo(d * 0.42, hw * 0.86);
  ctx.lineTo(-d * 0.05, hw); ctx.arc(-d * 0.05, 0, hw, Math.PI / 2, (3 * Math.PI) / 2); ctx.closePath();
  ctx.fillStyle = pal.ink; ctx.fill();
  if (t.sup && !t.small) { ctx.strokeStyle = 'rgba(240,232,212,.65)'; ctx.lineWidth = 0.7; ctx.stroke(); }
  if (!t.small && d > 5) { // 测距仪
    ctx.strokeStyle = 'rgba(240,232,212,.5)'; ctx.lineWidth = Math.max(0.6, d * 0.08);
    ctx.beginPath(); ctx.moveTo(-d * 0.22, -hw * 1.02); ctx.lineTo(-d * 0.22, hw * 1.02); ctx.stroke();
  }
  ctx.restore();
}

function drawBlock(ctx: Ctx, b: LBlock, L: number, W: number, pal: ShipPalette, detail: number) {
  const x0 = Math.min(b.x0, b.x1) * L, x1 = Math.max(b.x0, b.x1) * L, w = b.w * W, cy = (b.y ?? 0) * W;
  const len = x1 - x0;
  ctx.beginPath();
  switch (b.kind) {
    case 'hatch':
      ctx.rect(x0, cy - w / 2, len, w);
      ctx.fillStyle = 'rgba(60,48,30,.35)'; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.6; ctx.stroke();
      return;
    case 'forecastle':
      return; // 甲板色已表达
    case 'boat':
      roundRect(ctx, x0, cy - w / 2, len, w, w / 2);
      ctx.fillStyle = pal.paper; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.5; ctx.stroke();
      return;
    case 'tower': {
      // 塔式舰桥：圆角体 + 顶部测距仪
      roundRect(ctx, x0, cy - w / 2, len, w, Math.min(len, w) * 0.45);
      ctx.fillStyle = pal.paper; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.8; ctx.stroke();
      if (detail === 2) {
        const cx = x0 + len * 0.55, r = Math.min(len, w) * 0.28;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = pal.ink; ctx.fill();
        ctx.strokeStyle = pal.ink; ctx.lineWidth = Math.max(0.7, w * 0.08);
        ctx.beginPath(); ctx.moveTo(cx, cy - w * 0.62); ctx.lineTo(cx, cy + w * 0.62); ctx.stroke();
      }
      return;
    }
    case 'island':
      roundRect(ctx, x0, cy - w / 2, len, w, w * 0.3);
      ctx.fillStyle = pal.paper; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.8; ctx.stroke();
      return;
    case 'hangar':
      ctx.rect(x0, cy - w / 2, len, w);
      ctx.fillStyle = pal.paper; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.7; ctx.stroke();
      return;
    default: { // bridge / house
      const r = b.kind === 'bridge' ? Math.min(len, w) * 0.35 : Math.min(len, w) * 0.15;
      roundRect(ctx, x0, cy - w / 2, len, w, r);
      ctx.fillStyle = pal.paper; ctx.fill(); ctx.strokeStyle = pal.edge; ctx.lineWidth = 0.75; ctx.stroke();
      if (b.kind === 'bridge' && detail === 2) { // 舰桥前缘的风挡
        ctx.beginPath(); ctx.moveTo(x1 - len * 0.18, cy - w * 0.36); ctx.quadraticCurveTo(x1 + len * 0.02, cy, x1 - len * 0.18, cy + w * 0.36);
        ctx.strokeStyle = pal.ink; ctx.lineWidth = 0.8; ctx.stroke();
      }
    }
  }
}

function drawFlightDeck(ctx: Ctx, L: number, W: number, pal: ShipPalette, detail: number) {
  if (detail === 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(250,246,234,.8)'; ctx.lineWidth = Math.max(0.6, W * 0.03);
  ctx.setLineDash([Math.max(2, L * 0.03), Math.max(2, L * 0.025)]);
  ctx.beginPath(); ctx.moveTo(-L * 0.42, 0); ctx.lineTo(L * 0.4, 0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(40,32,20,.55)'; ctx.lineWidth = 0.7;
  for (const f of [0.22, 0.5, 0.78]) { const x = (0.5 - f) * L; ctx.strokeRect(x - L * 0.035, -W * 0.18, L * 0.07, W * 0.36); }
  ctx.restore();
}

// ---------- SVG（部队卡） ----------
const n1 = (v: number) => (Math.round(v * 10) / 10).toString();
/** 俯视剪影 SVG（舰艏朝右），用于部队卡标题 */
export function silhouetteSVG(lay: ShipLayout, pal: ShipPalette, width = 120, height = 34, gunsOut?: Set<string>): string {
  const L = width - 8, W = Math.min(height - 6, drawBeam(lay, L) * 1.05);
  const pts: string[] = [];
  for (let i = 0; i < lay.hull.length; i += 2) pts.push(`${n1(lay.hull[i] * L)},${n1(lay.hull[i + 1] * W)}`);
  const deck: string[] = [];
  const sx = lay.spec.flightDeck ? 0.985 : 0.955, sy = lay.spec.flightDeck ? 0.9 : 0.66;
  for (let i = 0; i < lay.hull.length; i += 2) deck.push(`${n1(lay.hull[i] * L * sx)},${n1(lay.hull[i + 1] * W * sy)}`);
  let parts = `<polygon points="${pts.join(' ')}" fill="${pal.fill}" stroke="${pal.edge}" stroke-width="1.1" stroke-linejoin="round"/>`;
  parts += `<polygon points="${deck.join(' ')}" fill="${pal.deck}"/>`;
  for (const b of lay.blocks) {
    if (b.kind === 'forecastle') continue;
    const x0 = Math.min(b.x0, b.x1) * L, len = Math.abs(b.x1 - b.x0) * L, w = b.w * W, cy = (b.y ?? 0) * W;
    const fill = b.kind === 'hatch' ? 'rgba(60,48,30,.35)' : pal.paper;
    const r = b.kind === 'tower' ? Math.min(len, w) * 0.45 : b.kind === 'bridge' ? Math.min(len, w) * 0.35 : Math.min(len, w) * 0.15;
    parts += `<rect x="${n1(x0)}" y="${n1(cy - w / 2)}" width="${n1(len)}" height="${n1(w)}" rx="${n1(r)}" fill="${fill}" stroke="${pal.edge}" stroke-width=".7"/>`;
  }
  for (const fn of lay.funnels) parts += `<ellipse cx="${n1(fn.x * L)}" cy="${n1((fn.y ?? 0) * W)}" rx="${n1(Math.max(1.4, (fn.len * L) / 2))}" ry="${n1(Math.max(1.2, (fn.w * W) / 2))}" fill="${pal.ink}"/>`;
  for (const t of lay.turrets) {
    if (t.small) continue;
    const d = turretPx(t, L, W), x = t.x * L, y = t.y * W, dir = t.aft ? -1 : 1, bl = Math.max(d * 0.55, t.barrel * L);
    let barrels = '';
    for (let i = 0; i < t.n; i++) { const by = t.n === 1 ? 0 : (i - (t.n - 1) / 2) * d * (t.n >= 3 ? 0.27 : 0.3); barrels += `M${n1(x + dir * d * 0.3)},${n1(y + by)}h${n1(dir * bl)}`; }
    parts += `<path d="${barrels}" stroke="${pal.ink}" stroke-width="${n1(Math.max(0.7, d * 0.11))}"/>`;
    parts += `<rect x="${n1(x - d * 0.45)}" y="${n1(y - d / 2)}" width="${n1(d * 0.9)}" height="${n1(d)}" rx="${n1(d * 0.4)}" fill="${pal.ink}"/>`;
    if (t.id && gunsOut?.has(t.id)) { const r = Math.max(2.4, d * 0.55); parts += `<path d="M${n1(x - r)},${n1(y - r)}L${n1(x + r)},${n1(y + r)}M${n1(x - r)},${n1(y + r)}L${n1(x + r)},${n1(y - r)}" stroke="#c0222b" stroke-width="1.6" stroke-linecap="round"/>`; }
  }
  return `<svg class="ship-sil" viewBox="${n1(-width / 2)} ${n1(-height / 2)} ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">${parts}</svg>`;
}

/** 命中部位 → 自舰艏比例：「B 炮塔」按炮塔位置，「舰桥」「烟囱」「弹射器」「舰艏」「舰艉」「舯部」按样式；解析不到返回 null */
export function hitLocation(location: string | undefined, gunsOut: string[] | undefined, lay: ShipLayout): number | null {
  const loc = (location ?? '') + ' ' + (gunsOut ?? []).join(' ');
  if (!loc.trim()) return null;
  for (const t of lay.turrets) if (t.id && !t.small && new RegExp(`(^|[^A-Za-z])${t.id}([^A-Za-z]|$)`).test(loc)) return 0.5 - t.x;
  if (/舰桥|bridge|指挥塔|司令塔|塔楼/i.test(loc)) { const b = lay.blocks.find((x) => x.kind === 'bridge' || x.kind === 'tower'); if (b) return (1 - b.x0 - b.x1) / 2; }
  if (/烟囱|funnel/i.test(loc) && lay.funnels.length) return 0.5 - lay.funnels[0].x;
  if (/弹射|catapult|飞机|aircraft/i.test(loc) && lay.catapult) return 0.5 - lay.catapult.x;
  if (/鱼雷|torpedo/i.test(loc) && lay.tubes.length) return 0.5 - lay.tubes[0].x;
  if (/艏|bow|前部|forward|锚/i.test(loc)) return 0.1;
  if (/艉|stern|后部|aft|舵/i.test(loc)) return 0.9;
  if (/舯|舷|amidships|水线|装甲带|belt|机舱|engine/i.test(loc)) return 0.5;
  return null;
}

