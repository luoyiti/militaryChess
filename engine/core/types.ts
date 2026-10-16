/**
 * 数据契约 v2（运行时类型）。所有战役包 data/** JSON 的形状；离线校验见 engine/schema/zod.ts（仅 Node）。
 * 时间：'YYYY-MM-DDTHH:mm'，战役叙事时区（manifest.time.tzLabel）；引擎把它当作 UTC 计算相对小时，不做时区换算。
 * 坐标：[经度, 纬度]（WGS84），或地名引用 '@placeId'（见 data/gazetteer/*.json）。
 * 阵营、模型等枚举由 manifest 与模型注册表决定，类型层只是 string。
 */

export type LonLat = [number, number];
export type Pos = LonLat | string;
export type ISO = string;
export type Side = string;
export type ModelId = string;
export type Conf = 'high' | 'medium' | 'low';

export interface I18n { zh: string; orig?: string; short?: string }

// ---------- 来源 ----------
export interface Source { id: string; title: string; author?: string; year?: number; url?: string; license?: string }

// ---------- 地名库 ----------
export type PlaceKind = 'capital' | 'city' | 'town' | 'village' | 'fort' | 'port' | 'crossing' | 'region' | 'forest' | 'river' | 'airfield' | 'sea' | 'radar';
export interface Place {
  id: string;
  zh: string;
  orig: string;
  alt?: string;
  pos: LonLat;
  kind: PlaceKind;
  rank: 1 | 2 | 3 | 4; // 1=首都级 … 4=村镇/战场点
  country?: string; // 当时所属国（manifest 无约束，仅供展示/校验）
  confidence?: Conf;
  sources?: string[];
}

// ---------- 部队（OOB） ----------
export type Echelon =
  | 'armygroup' | 'front' | 'command' | 'army' | 'air_fleet' | 'air_group' | 'corps' | 'sector' | 'wing'
  | 'division' | 'brigade' | 'regiment' | 'group' | 'ship' | 'squadron' | 'gruppe';
/** 显示层级：0=集团军级，1=军级，2=师旅级；-1 只作标签与侧栏树 */
export const ECHELON_RANK: Record<Echelon, number> = {
  armygroup: -1, front: -1, command: -1,
  army: 0, air_fleet: 0, air_group: 0,
  corps: 1, sector: 1, wing: 1,
  division: 2, brigade: 2, regiment: 2, group: 2, ship: 2, squadron: 2, gruppe: 2,
};
export const ECHELONS = Object.keys(ECHELON_RANK) as Echelon[];

export const UNIT_TYPES = [
  'hq', 'armor', 'light', 'motorized', 'infantry', 'mountain', 'cavalry', 'cavalry_mech',
  'border', 'fortress', 'naval', 'marine', 'artillery', 'reserve', 'airborne', 'air', 'aviation', 'fighter', 'bomber',
] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_STATUSES = [
  'reserve', 'active', 'engaged', 'encircled', 'withdrawing', 'destroyed', 'surrendered', 'interned', 'disbanded',
  'evacuated', 'ineffective', 'inactive',
] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];
/** 终止状态：之后 48h 内淡出 */
export const TERMINAL_STATUSES: UnitStatus[] = ['destroyed', 'surrendered', 'interned', 'disbanded', 'evacuated', 'ineffective', 'inactive'];

export const MOVEMENTS = ['land', 'sea', 'air', 'rail'] as const;
export type Movement = (typeof MOVEMENTS)[number];

export const FLIGHT_PHASES = ['at_base', 'outbound', 'engaged', 'returning'] as const;
export type FlightPhase = (typeof FLIGHT_PHASES)[number];

export interface TrackPoint {
  at: ISO;
  pos: Pos;
  status?: UnitStatus; // 从该时刻起的状态
  note?: string;
  movement?: Movement; // 从此航点至下一航点的移动方式（缺省 land）
  flightPhase?: FlightPhase; // 空战：飞行阶段（设置后线性插值）
  altitudeM?: number;
  /** 海战：该点的航向（度，真北顺时针）。舰船（unit.ship）的海上航段按航向/航速做三次 Hermite 曲线插值 */
  course?: number;
  /** 海战：该点的航速（节） */
  speedKn?: number;
}

export interface Unit {
  id: string; // '<side前缀>.<id>'，前缀见 manifest.sides[].prefix
  side: Side;
  echelon: Echelon;
  type: UnitType;
  parent: string | null;
  name: I18n;
  commander?: I18n;
  strength?: { men?: number; tanks?: number; guns?: number; aircraft?: number };
  equipment?: { id: string; count?: number }[];
  model?: ModelId;
  active?: { from?: ISO; to?: ISO };
  track: TrackPoint[];
  history?: string;
  base?: Pos; // 空军基地（空战）
  /** 'container'：有下属时不作为棋子显示，直接展开下属（替代旧版写死的部队 id） */
  display?: 'container';
  schematic?: boolean; // 位置为编排示意
  modelNote?: string;
  /** 舰船档案（海战）：设置后 2D 画成俯视剪影、轨迹按航向曲线插值、部队卡显示损伤图 */
  ship?: ShipInfo;
  sources: string[];
  confidence: Conf;
}

// ---------- 舰船（海战） ----------
export const SHIP_KINDS = [
  'battleship', 'battlecruiser', 'pocket_battleship', 'carrier', 'heavy_cruiser', 'light_cruiser', 'destroyer', 'submarine',
  'auxiliary', 'tanker', 'merchant', 'liner', 'tug', 'boat',
] as const;
export type ShipKind = (typeof SHIP_KINDS)[number];
/** 舰炮 / 鱼雷：射程圈、开火特效与损伤图（atPct = 自舰艏起的位置百分比） */
export interface ShipWeapon {
  id: string; // 'main' / 'A' / 'tt_port' …（hits.gunsOut、fire.weapon 引用）
  label: string; // '28 厘米主炮（前炮塔「安东」）'
  cal: string; // '28 cm SK C/28'
  kind: 'main' | 'secondary' | 'aa' | 'torpedo';
  mounts?: number;
  perMount?: number;
  rangeKm?: number;
  atPct?: number;
}
export interface ShipInfo {
  kind: ShipKind;
  class?: I18n; // 舰级
  pennant?: string; // 舷号
  flag?: string; // 船旗国（商船）
  lengthM?: number;
  beamM?: number;
  tonnage?: number; // 军舰：标准排水量（吨）；商船：总吨位
  tonnageKind?: 'std' | 'full' | 'grt';
  maxKn?: number;
  crew?: number;
  weapons?: ShipWeapon[];
  /** 2D 剪影样式（缺省按 kind）：graf_spee / county / york / leander / merchant … */
  silhouette?: string;
}

// ---------- 海战数据 data/naval/*.json ----------
/** 射击时段：shooter 在 [from, to] 内持续向 target 射击（特效按武器的齐射间隔重放；暂停时画射击线） */
export interface FirePeriod {
  id: string;
  shooter: string;
  target: string;
  weapon: string; // shooter.ship.weapons[].id，或 'main' / 'secondary'
  from: ISO;
  to: ISO;
  rounds?: number; // 本时段发射弹数（史料）
  salvoSec?: number; // 齐射间隔（秒，缺省按武器）
  note?: string;
  sources: string[];
  confidence: Conf;
}
/** 命中：目标闪光、损伤记录；gunsOut 列出被打哑的武器 id */
export interface NavalHit {
  id: string;
  at: ISO;
  shooter?: string;
  target: string;
  weapon?: string;
  location?: string; // 中文部位：「B 炮塔」「舰桥」
  effect: string; // 中文后果
  killed?: number;
  wounded?: number;
  severity: 1 | 2 | 3; // 1 = 致命/重创 … 3 = 轻伤
  gunsOut?: string[];
  precision?: 'minute' | 'approx';
  sources: string[];
  confidence: Conf;
}
/** 鱼雷齐射：从发射舰当时位置沿 bearing（缺省指向 target）扇形航行 */
export interface TorpedoLaunch {
  id: string;
  at: ISO;
  shooter: string;
  count: number;
  target?: string;
  bearing?: number; // 度，真北顺时针
  spreadDeg?: number; // 扇面总角（缺省 count×2°）
  speedKn?: number; // 缺省 30
  rangeKm?: number; // 缺省 12
  result?: string; // 中文结果
  sources: string[];
  confidence: Conf;
}
/** 烟幕：沿 ship 在 [from, to] 的航迹铺设，结束后 persistMin 分钟内消散 */
export interface SmokeScreen {
  id: string;
  ship: string;
  from: ISO;
  to: ISO;
  kind?: 'screen' | 'funnel';
  widthKm?: number; // 缺省 0.8
  persistMin?: number; // 缺省 25
  driftDeg?: number; // 风向下游（度，真北顺时针，缺省不漂移）
  note?: string;
  sources: string[];
  confidence?: Conf;
}
/** 损伤状态：从 at 起生效，直到下一条 */
export interface DamageState {
  ship: string;
  at: ISO;
  integrity: number; // 0..1（1 = 完好）
  speedKn?: number; // 当前最大航速
  gunsOut?: string[];
  fire?: boolean;
  listDeg?: number;
  note: string;
  sources: string[];
}
/** 电文 / 信号：电文纸带逐条打出 */
export interface Signal {
  id: string;
  at: ISO;
  from: string; // 部队 id 或文字
  to?: string;
  kind?: 'signal' | 'distress' | 'radio' | 'order' | 'report' | 'diplomatic';
  text: string; // 原文
  zh: string; // 中文
  sources: string[];
  confidence?: Conf;
}
export interface NavalData {
  fire?: FirePeriod[];
  hits?: NavalHit[];
  torpedoes?: TorpedoLaunch[];
  smoke?: SmokeScreen[];
  damage?: DamageState[];
  signals?: Signal[];
}

// ---------- 推进路线 ----------
export type RouteStyle = 'main' | 'secondary' | 'counter' | 'retreat' | 'breakout';
export interface Route {
  id: string;
  side: Side;
  unit: string;
  style: RouteStyle;
  widthKm: number;
  movement?: Movement; // 缺省 land；非 land 画成线而不是箭头
  role?: string; // 语义角色：landing / evacuation / raid / escort / interception …
  until?: ISO;
  fadeHours?: number; // 空战出击：抵达后淡出时长
  label?: string;
  waypoints: { at: ISO; pos: Pos }[];
  schematic?: boolean;
  illustrative?: boolean;
  sources: string[];
  confidence: Conf;
}

// ---------- 控制区关键帧 ----------
export type Ring = Pos[];
export type PolygonDef = Ring[]; // [外环, 洞…]
export interface ControlKeyframe {
  at: ISO;
  /** 槽名 → 多边形；槽名见 manifest.control.slots[].key。缺省槽 = 空。 */
  control: Record<string, PolygonDef[]>;
  transition?: 'smooth' | 'step'; // step：从上一帧到本帧不插值
  note?: string;
  sources: string[];
  confidence: Conf;
}

export interface Pocket {
  id: string;
  name: I18n;
  start: ISO;
  end: ISO;
  anchor: Pos;
  fate: 'surrendered' | 'broke_out' | 'relieved' | 'destroyed' | 'handed_over';
  units?: string[];
  note?: string;
  sources: string[];
}

export interface Demarcation {
  id: string;
  name: I18n;
  at: ISO;
  until?: ISO;
  line: Pos[];
  style?: 'pact' | 'final';
  note?: string;
  sources: string[];
}

/** 静态叠加层（空域分区、雷达圈、防线等），按 layer 归入图层开关 */
export interface Overlay {
  id: string;
  layer: string;
  kind: 'polygon' | 'range' | 'line';
  label?: string;
  polygons?: PolygonDef[];
  line?: Pos[];
  pos?: Pos;
  rangeKm?: number;
  style?: string;
  sources?: string[];
}

// ---------- 事件 ----------
export const EVENT_CATS = ['battle', 'air', 'naval', 'political', 'atrocity', 'movement', 'surrender', 'siege'] as const;
export type EventCat = (typeof EVENT_CATS)[number];
export interface Photo { commons: string; caption: string }
export interface HistEvent {
  id: string;
  at: ISO;
  endAt?: ISO;
  category: EventCat;
  /** 时间精度：day=只表达先后（显示「当日」）；hour/minute 显示时刻。缺省 minute。 */
  precision?: 'day' | 'hour' | 'minute';
  importance: 1 | 2 | 3;
  side?: Side;
  title: I18n;
  body: string;
  place: Pos;
  units?: string[];
  photo?: Photo;
  sfx?: string[];
  /** 导演模式运镜：相对全图的缩放倍数（1 = 全图）。缺省按重要度。 */
  zoomRel?: number;
  /** 事件覆盖全线（地点显示「全线」，可选回到全图） */
  wide?: boolean;
  narration?: string; // 英文旁白文本（narration 插件 tts）
  mapNote?: string;
  airAction?: string;
  sources: string[];
  confidence: Conf;
}

// ---------- 装备 ----------
export type EquipmentClass = 'tank_light' | 'tank_medium' | 'tankette' | 'armored_car' | 'fighter' | 'bomber' | 'dive_bomber' | 'ship' | 'gun' | 'small_arms' | 'transport' | 'glider' | 'seaplane' | 'torpedo';
export interface Equipment {
  id: string;
  side: Side;
  name: I18n;
  class: EquipmentClass;
  crew?: number;
  weightT?: number;
  armorMm?: [number, number];
  gun?: string;
  speedKmh?: number;
  count?: number; // 参战数量
  model?: ModelId;
  photo?: Photo;
  desc: string;
  sources: string[];
}

// ---------- 兵力概况 ----------
export interface SideSummary {
  name: string;
  commander: string;
  men?: number | null; // 缺省或 null = 未单独统计（显示 —）
  divisions: string;
  tanks?: number | null;
  aircraft?: number | null;
  guns?: number | null;
  fighters?: number | null;
  bombers?: number | null;
  asOf?: string;
  losses: { killed: string; wounded: string; captured?: string; tanks?: string; aircraft?: string };
  note?: string;
}
export interface ForcesSummary {
  sides: Record<Side, SideSummary>;
  /** 分阶段兵力（phase id → side → 概况） */
  byPhase?: Record<string, Record<Side, SideSummary>>;
  sources: string[];
}
