/**
 * 数据契约（唯一真值）。所有 src/data/** JSON 必须通过这里的 zod 校验。
 * 时间：统一使用 CET（当时波兰/德国时间）字符串 'YYYY-MM-DDTHH:mm'；苏方莫斯科时间需 -2h 换算。
 * 坐标：[经度, 纬度]（WGS84，小数度），或地名引用 '@placeId'（见 src/data/gazetteer/*.json）。
 */
import { z } from 'zod';

// ---------- 通用 ----------
export const SIDES = ['DE', 'SK', 'PL', 'SU'] as const;
export const Side = z.enum(SIDES);
export type Side = z.infer<typeof Side>;

export const ISO = z.string().regex(/^1939-(08|09|10)-\d{2}T\d{2}:\d{2}$/, '时间格式须为 1939-MM-DDTHH:mm (CET)');
export type ISO = z.infer<typeof ISO>;

export const LonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export type LonLat = z.infer<typeof LonLat>;
export const PlaceRef = z.string().regex(/^@[a-z0-9_]+$/, '地名引用须为 @小写id');
export const Pos = z.union([LonLat, PlaceRef]);
export type Pos = z.infer<typeof Pos>;

export const Conf = z.enum(['high', 'medium', 'low']);
export const I18n = z.object({
  zh: z.string().min(1),
  orig: z.string().optional(), // 原文（波兰文/德文/俄文/英文）
  short: z.string().optional(), // 棋子上的短标签，如 "4.Pz" "7 DP" "Wołyńska BK"
});
export type I18n = z.infer<typeof I18n>;
export const SourceIds = z.array(z.string().min(1)).min(1);

// ---------- 来源 ----------
export const Source = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  title: z.string(),
  author: z.string().optional(),
  year: z.number().optional(),
  url: z.string().optional(),
  license: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

// ---------- 地名库 ----------
export const PlaceKind = z.enum(['capital', 'city', 'town', 'village', 'fort', 'port', 'crossing', 'region', 'forest', 'river']);
export const Place = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  zh: z.string(),
  orig: z.string(), // 1939 年当地正式名（波兰境内用波兰文，德国境内用德文）
  alt: z.string().optional(), // 其他写法（如德文/俄文/今名）
  pos: LonLat,
  kind: PlaceKind,
  rank: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), // 1=首都级 … 4=村镇/战场点
  country1939: z.enum(['PL', 'DE', 'DZG', 'SK', 'PROT', 'HU', 'RO', 'LT', 'LV', 'SU']).optional(),
});
export type Place = z.infer<typeof Place>;

// ---------- 部队（OOB） ----------
export const ECHELONS = ['armygroup', 'front', 'army', 'corps', 'division', 'brigade'] as const;
export const Echelon = z.enum(ECHELONS);
export type Echelon = z.infer<typeof Echelon>;
/** 显示层级：army=0, corps=1, division/brigade=2；armygroup/front 只作标签与侧栏树 */
export const ECHELON_RANK: Record<Echelon, number> = { armygroup: -1, front: -1, army: 0, corps: 1, division: 2, brigade: 2 };

export const UNIT_TYPES = [
  'hq', 'armor', 'light', 'motorized', 'infantry', 'mountain', 'cavalry', 'cavalry_mech',
  'border', 'fortress', 'naval', 'marine', 'artillery', 'reserve',
] as const;
export const UnitType = z.enum(UNIT_TYPES);
export type UnitType = z.infer<typeof UnitType>;

export const UnitStatus = z.enum(['reserve', 'active', 'engaged', 'encircled', 'withdrawing', 'destroyed', 'surrendered', 'interned', 'disbanded']);
export type UnitStatus = z.infer<typeof UnitStatus>;

export const MODEL_IDS = [
  'pz1', 'pz2', 'pz3', 'pz4', 'pz35t', 'pz38t', 'sdkfz231', '7tp', 'tks', 'wz34', 't26', 'bt7',
  'inf_de', 'inf_pl', 'inf_su', 'inf_sk', 'cav_pl', 'cav_su', 'art_gun',
] as const;
export const ModelId = z.enum(MODEL_IDS);
export type ModelId = z.infer<typeof ModelId>;

export const TrackPoint = z.object({
  at: ISO,
  pos: Pos,
  status: UnitStatus.optional(), // 从该时刻起的状态
  note: z.string().optional(),
});
export type TrackPoint = z.infer<typeof TrackPoint>;

export const Unit = z.object({
  id: z.string().regex(/^(de|sk|pl|su)\.[a-z0-9_.]+$/),
  side: Side,
  echelon: Echelon,
  type: UnitType,
  parent: z.string().nullable(),
  name: I18n, // short 必填为佳：棋子标签
  commander: I18n.optional(),
  strength: z.object({ men: z.number().optional(), tanks: z.number().optional(), guns: z.number().optional(), aircraft: z.number().optional() }).optional(),
  equipment: z.array(z.object({ id: z.string(), count: z.number().optional() })).optional(),
  model: ModelId.optional(), // 3D 沙盘/单位卡中代表该部队的模型
  active: z.object({ from: ISO.optional(), to: ISO.optional() }).optional(), // 存在时间窗（组建/撤编），缺省=全程
  track: z.array(TrackPoint), // 时间升序；上级单位可为空（取下属质心）
  history: z.string().optional(), // 单位卡简史（中文 100–250 字）
  sources: SourceIds,
  confidence: Conf,
});
export type Unit = z.infer<typeof Unit>;

// ---------- 推进路线 ----------
export const Route = z.object({
  id: z.string().regex(/^r\.[a-z0-9_.]+$/),
  side: Side,
  unit: z.string(), // 所属部队 id
  style: z.enum(['main', 'secondary', 'counter', 'retreat', 'breakout']),
  widthKm: z.number().min(2).max(40),
  label: z.string().optional(), // 箭头旁短注（中文）
  waypoints: z.array(z.object({ at: ISO, pos: Pos })).min(2),
  sources: SourceIds,
  confidence: Conf,
});
export type Route = z.infer<typeof Route>;

// ---------- 战线关键帧 ----------
/** Polygon = [外环, 内环(洞)...]，环为 Pos[]（首尾可不闭合） */
export const Ring = z.array(Pos).min(3);
export const PolygonDef = z.array(Ring).min(1);
export const ControlKeyframe = z.object({
  at: ISO,
  /** 德军（含斯洛伐克）在波兰 1939 年疆域（含但泽）内的占领区。可越出波兰国界（会与本土合并后裁剪）。 */
  DE: z.array(PolygonDef),
  /** 苏军占领区（9/17 之前为空数组） */
  SU: z.array(PolygonDef),
  note: z.string().optional(),
  sources: SourceIds,
  confidence: Conf,
});
export type ControlKeyframe = z.infer<typeof ControlKeyframe>;

export const Pocket = z.object({
  id: z.string().regex(/^p\.[a-z0-9_]+$/),
  name: I18n,
  start: ISO,
  end: ISO,
  anchor: Pos, // 标签锚点（须位于包围圈内）
  fate: z.enum(['surrendered', 'broke_out', 'relieved', 'destroyed', 'handed_over']),
  units: z.array(z.string()).optional(),
  note: z.string().optional(),
  sources: SourceIds,
});
export type Pocket = z.infer<typeof Pocket>;

export const Demarcation = z.object({
  id: z.string(),
  name: I18n,
  at: ISO,
  until: ISO.optional(),
  line: z.array(Pos).min(2), // 北 → 南
  note: z.string().optional(),
  sources: SourceIds,
});
export type Demarcation = z.infer<typeof Demarcation>;

// ---------- 事件 ----------
export const SFX_IDS = [
  'typewriter', 'bell', 'stamp', 'paper', 'explosion', 'artillery', 'stuka', 'bomber', 'engine', 'tank',
  'ship_gun', 'siren', 'radio', 'morse', 'mg', 'rifle', 'march', 'cavalry', 'ui_click', 'fanfare',
] as const;
export const SfxId = z.enum(SFX_IDS);
export type SfxId = z.infer<typeof SfxId>;

export const Photo = z.object({
  commons: z.string().regex(/^File:.+/), // Wikimedia Commons 文件名，如 "File:Westerplatte 1939.jpg"
  caption: z.string(), // 中文图注
});
export const EventCat = z.enum(['battle', 'air', 'naval', 'political', 'atrocity', 'movement', 'surrender', 'siege']);
export const HistEvent = z.object({
  id: z.string().regex(/^e\.[a-z0-9_]+$/),
  at: ISO,
  endAt: ISO.optional(),
  category: EventCat,
  importance: z.union([z.literal(1), z.literal(2), z.literal(3)]), // 1=最重要
  side: Side.optional(), // 主动方
  title: I18n,
  body: z.string(), // 中文 80–140 字
  place: Pos,
  units: z.array(z.string()).optional(),
  photo: Photo.optional(),
  sfx: z.array(SfxId).optional(),
  zoom: z.number().min(1).max(8).optional(), // 导演模式运镜缩放（1=全图）
  sources: SourceIds,
  confidence: Conf,
});
export type HistEvent = z.infer<typeof HistEvent>;

// ---------- 装备 ----------
export const Equipment = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  side: Side,
  name: I18n,
  class: z.enum(['tank_light', 'tank_medium', 'tankette', 'armored_car', 'fighter', 'bomber', 'dive_bomber', 'ship', 'gun', 'small_arms']),
  crew: z.number().optional(),
  weightT: z.number().optional(),
  armorMm: z.tuple([z.number(), z.number()]).optional(),
  gun: z.string().optional(),
  speedKmh: z.number().optional(),
  count1939: z.number().optional(), // 参战数量
  model: ModelId.optional(),
  photo: Photo.optional(),
  desc: z.string(), // 中文 60–140 字
  sources: SourceIds,
});
export type Equipment = z.infer<typeof Equipment>;

// ---------- 兵力概况 ----------
export const SideSummary = z.object({
  name: z.string(),
  commander: z.string(),
  men: z.number(),
  divisions: z.string(), // 文本，如 "约 60 个师"
  tanks: z.number(),
  aircraft: z.number(),
  guns: z.number(),
  losses: z.object({ killed: z.string(), wounded: z.string(), captured: z.string().optional(), tanks: z.string().optional(), aircraft: z.string().optional() }),
  note: z.string().optional(),
});
export const ForcesSummary = z.object({
  sides: z.object({ DE: SideSummary, SK: SideSummary, PL: SideSummary, SU: SideSummary }),
  sources: SourceIds,
});
export type ForcesSummary = z.infer<typeof ForcesSummary>;

// ---------- 时间工具 ----------
export const T0 = Date.UTC(1939, 7, 31, 0, 0); // 1939-08-31T00:00 (把 CET 当作 UTC 处理，仅用于相对小时)
export const T_END_ISO = '1939-10-06T24:00';
/** ISO → 自 8/31 00:00 起的小时数 */
export function isoToHours(iso: string): number {
  const m = /^1939-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso);
  if (!m) throw new Error('bad iso ' + iso);
  const ms = Date.UTC(1939, Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4]));
  return (ms - T0) / 3_600_000;
}
export function hoursToDate(h: number): Date {
  return new Date(T0 + h * 3_600_000);
}
export const H_END = isoToHours('1939-10-06T23:59');
