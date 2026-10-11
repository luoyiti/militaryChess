/**
 * 数据契约 v2 的 zod 校验（仅 Node：tools/validate 与测试使用，不进入浏览器包）。
 * 与 engine/core/types.ts 的运行时类型一一对应；阵营、部队 id 前缀、控制区槽位、3D 模型与音效
 * 这些「随战役变化」的枚举由 makeDataSchemas(manifest, registries) 按战役生成。
 */
import { z } from 'zod';
import { ECHELONS, UNIT_TYPES, UNIT_STATUSES, MOVEMENTS, FLIGHT_PHASES, EVENT_CATS } from '../core/types';
import type { CampaignManifest } from '../campaign/types';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
/** 'YYYY-MM-DDTHH:mm' 且为真实日历日期（拒绝 1940-02-30 之类） */
export function isCalendarIso(s: string): boolean {
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d && h < 24 && mi < 60;
}
export const ISO = z.string().refine(isCalendarIso, { message: '时间须为真实日期的 YYYY-MM-DDTHH:mm' });
export const LonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export const PlaceRef = z.string().regex(/^@[a-z0-9_]+$/, '地名引用须为 @小写id');
export const Pos = z.union([LonLat, PlaceRef]);
export const Conf = z.enum(['high', 'medium', 'low']);
export const I18n = z.object({ zh: z.string().min(1), orig: z.string().optional(), short: z.string().optional() });
export const SourceIds = z.array(z.string().min(1)).min(1, '至少引用一个来源');
export const Photo = z.object({ commons: z.string().regex(/^File:.+/, 'commons 须为 Wikimedia 文件名 File:…'), caption: z.string() });
const Color = z.string().regex(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))$/, '颜色须为 #hex 或 rgb(a)()');

// ---------- 清单 campaign.json ----------
const SideDef = z.object({
  id: z.string().regex(/^[A-Z]{2,4}$/, '阵营 id 为 2–4 个大写字母'),
  prefix: z.string().regex(/^[a-z]{2,4}$/),
  name: z.string().min(1),
  nation: z.string().optional(),
  coalition: z.enum(['axis', 'allies', 'comintern', 'neutral']),
  counter: z.object({ bg: Color, edge: Color, text: Color, box: Color, ink: Color }),
  css: z.object({ main: Color, dark: Color }),
}).loose();
const SlotDef = z.object({ key: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), label: z.string() }).loose();
const PhaseDef = z.object({ id: z.string(), from: ISO, to: ISO.optional(), name: z.string(), short: z.string().optional(), sub: z.string(), center: LonLat.optional(), zoom: z.number().optional() });
const HubEntry = z.object({
  order: z.number().optional(),
  codename: z.string().min(1),
  codenameOrig: z.string().optional(),
  pin: LonLat,
  labelAt: z.enum(['n', 's', 'e', 'w']).optional(),
  theatre: z.object({ countries: z.array(z.string()).optional(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), kind: z.enum(['land', 'air']).optional() }).optional(),
  cover: z.string().optional(),
  blurb: z.string().min(10),
  parent: z.string().optional(),
});
const Title = z.object({ mark: z.string(), zh: z.string(), sub: z.string(), en: z.string(), orig: z.string().optional(), codename: z.string().optional(), html: z.string(), description: z.string(), favicon: Color.optional() });

/** 已发布 / 草稿战役的完整清单；界面细项（ui/map/director/audio/sandbox 的可选字段）只校验类型骨架 */
export const ManifestSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*-\d{4}$/, 'id 形如 <地名>-<年份>，小写连字符'),
  status: z.enum(['published', 'draft']),
  title: Title,
  time: z.object({ epoch: ISO, start: ISO, end: ISO, dataEnd: ISO.optional(), tzLabel: z.string(), hoursPerSec: z.number().positive().optional() }),
  sides: z.array(SideDef).min(2),
  sideOrder: z.array(z.string()).optional(),
  parentExceptions: z.array(z.tuple([z.string(), z.string()])).optional(),
  control: z.object({
    mode: z.enum(['territory', 'air']),
    landBit: z.number().int().min(0).max(7),
    theatreBits: z.array(z.number().int().min(0).max(7)),
    deferred: z.array(z.object({ bits: z.array(z.number().int()), from: ISO })).optional(),
    slots: z.array(SlotDef).min(1).max(2, '运行时最多 2 个控制区槽位'),
    remainder: z.object({ label: z.string(), fill: z.string().optional() }).optional(),
  }),
  phases: z.array(PhaseDef).min(1),
  marks: z.array(z.tuple([ISO, z.string()])).optional(),
  theme: z.object({ accent: Color, accentDark: Color, accentTint: Color, theatreBorder: Color, theatreHalo: Color, restFill: Color }),
  map: z.object({ home3d: LonLat, theatreCountries: z.array(z.string()) }).loose(),
  ui: z.object({}).loose(),
  intro: z.object({}).loose(),
  credits: z.object({}).loose(),
  director: z.object({}).loose(),
  audio: z.object({ music: z.array(z.object({ from: ISO, track: z.string() })), intensity: z.array(z.object({ from: ISO, value: z.number().min(0).max(1) })) }).loose(),
  sandbox: z.object({}).loose().optional(),
  hub: HubEntry,
  validation: z.record(z.string(), z.unknown()).optional(),
}).loose();

/** 筹备中的战役：只出现在总台，清单只需身份、时间、交战方与总台卷宗 */
export const PlannedManifestSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*-\d{4}$/),
  status: z.literal('planned'),
  title: z.object({ mark: z.string(), zh: z.string(), en: z.string() }).loose(),
  time: z.object({ start: ISO, end: ISO }).loose(),
  sides: z.array(z.object({ id: z.string(), name: z.string(), coalition: z.enum(['axis', 'allies', 'comintern', 'neutral']) }).loose()).min(2),
  hub: HubEntry,
});

// ---------- 战役数据 data/** ----------
export interface Registries { models: string[]; sfx: string[] }

export function makeDataSchemas(m: CampaignManifest, reg: Registries) {
  const sideIds = m.sides.map((s) => s.id) as [string, ...string[]];
  const Side = z.enum(sideIds);
  const prefixRe = new RegExp(`^(${m.sides.map((s) => s.prefix).join('|')})\\.[a-z0-9_.-]+$`);
  const ModelId = z.enum(reg.models as [string, ...string[]]);
  const SfxId = z.enum(reg.sfx as [string, ...string[]]);
  const slotKeys = m.control.slots.map((s) => s.key) as [string, ...string[]];

  const Source = z.object({ id: z.string().regex(/^[a-z0-9_]+$/), title: z.string(), author: z.string().optional(), year: z.number().optional(), url: z.string().optional(), license: z.string().optional() });
  const Place = z.object({
    id: z.string().regex(/^[a-z0-9_]+$/),
    zh: z.string(), orig: z.string(), alt: z.string().optional(),
    pos: LonLat,
    kind: z.enum(['capital', 'city', 'town', 'village', 'fort', 'port', 'crossing', 'region', 'forest', 'river', 'airfield', 'sea', 'radar']),
    rank: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    country: z.string().optional(),
    confidence: Conf.optional(),
    sources: z.array(z.string()).optional(),
  });
  const TrackPoint = z.object({
    at: ISO, pos: Pos,
    status: z.enum(UNIT_STATUSES).optional(),
    note: z.string().optional(),
    movement: z.enum(MOVEMENTS).optional(),
    flightPhase: z.enum(FLIGHT_PHASES).optional(),
    altitudeM: z.number().min(0).max(15000).optional(),
  });
  const Unit = z.object({
    id: z.string().regex(prefixRe, `部队 id 须为 <阵营前缀>.<名称>，前缀：${m.sides.map((s) => s.prefix).join('/')}`),
    side: Side,
    echelon: z.enum(ECHELONS as [string, ...string[]]),
    type: z.enum(UNIT_TYPES),
    parent: z.string().nullable(),
    name: I18n,
    commander: I18n.optional(),
    strength: z.object({ men: z.number().optional(), tanks: z.number().optional(), guns: z.number().optional(), aircraft: z.number().optional() }).optional(),
    equipment: z.array(z.object({ id: z.string(), count: z.number().optional() })).optional(),
    model: ModelId.optional(),
    active: z.object({ from: ISO.optional(), to: ISO.optional() }).optional(),
    track: z.array(TrackPoint),
    history: z.string().optional(),
    base: Pos.optional(),
    display: z.literal('container').optional(),
    schematic: z.boolean().optional(),
    modelNote: z.string().optional(),
    sources: SourceIds,
    confidence: Conf,
  });
  const Route = z.object({
    id: z.string().regex(/^r\.[a-z0-9_.-]+$/),
    side: Side,
    unit: z.string(),
    style: z.enum(['main', 'secondary', 'counter', 'retreat', 'breakout']),
    widthKm: z.number().min(0.5).max(60),
    movement: z.enum(MOVEMENTS).optional(),
    role: z.string().optional(),
    until: ISO.optional(),
    fadeHours: z.number().positive().optional(),
    label: z.string().optional(),
    waypoints: z.array(z.object({ at: ISO, pos: Pos })).min(2),
    schematic: z.boolean().optional(),
    illustrative: z.boolean().optional(),
    sources: SourceIds,
    confidence: Conf,
  });
  const Ring = z.array(Pos).min(3);
  const PolygonDef = z.array(Ring).min(1);
  const ControlKeyframe = z.object({
    at: ISO,
    control: z.partialRecord(z.enum(slotKeys), z.array(PolygonDef)),
    transition: z.enum(['smooth', 'step']).optional(),
    note: z.string().optional(),
    sources: SourceIds,
    confidence: Conf,
  });
  const Pocket = z.object({
    id: z.string().regex(/^p\.[a-z0-9_]+$/), name: I18n, start: ISO, end: ISO, anchor: Pos,
    fate: z.enum(['surrendered', 'broke_out', 'relieved', 'destroyed', 'handed_over']),
    units: z.array(z.string()).optional(), note: z.string().optional(), sources: SourceIds,
  });
  const Demarcation = z.object({ id: z.string(), name: I18n, at: ISO, until: ISO.optional(), line: z.array(Pos).min(2), style: z.enum(['pact', 'final']).optional(), note: z.string().optional(), sources: SourceIds });
  const Overlay = z.object({
    id: z.string(), layer: z.string(), kind: z.enum(['polygon', 'range', 'line']), label: z.string().optional(),
    polygons: z.array(PolygonDef).optional(), line: z.array(Pos).min(2).optional(), pos: Pos.optional(), rangeKm: z.number().positive().optional(),
    style: z.string().optional(), sources: z.array(z.string()).optional(),
  }).refine((o) => (o.kind === 'polygon' ? !!o.polygons?.length : o.kind === 'range' ? !!o.pos && !!o.rangeKm : !!o.line), { message: 'polygon 需要 polygons；range 需要 pos + rangeKm；line 需要 line' });
  const HistEvent = z.object({
    id: z.string().regex(/^e\.[a-z0-9_]+$/),
    at: ISO, endAt: ISO.optional(),
    category: z.enum(EVENT_CATS),
    precision: z.enum(['day', 'hour', 'minute']).optional(),
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    side: Side.optional(),
    title: I18n,
    body: z.string().min(1),
    place: Pos,
    units: z.array(z.string()).optional(),
    photo: Photo.optional(),
    sfx: z.array(SfxId).optional(),
    zoomRel: z.number().min(0.5).max(16).optional(),
    wide: z.boolean().optional(),
    narration: z.string().optional(),
    mapNote: z.string().optional(),
    airAction: z.string().optional(),
    sources: SourceIds,
    confidence: Conf,
  });
  const Equipment = z.object({
    id: z.string().regex(/^[a-z0-9_]+$/), side: Side, name: I18n,
    class: z.enum(['tank_light', 'tank_medium', 'tankette', 'armored_car', 'fighter', 'bomber', 'dive_bomber', 'ship', 'gun', 'small_arms', 'transport', 'glider']),
    crew: z.number().optional(), weightT: z.number().optional(), armorMm: z.tuple([z.number(), z.number()]).optional(), gun: z.string().optional(),
    speedKmh: z.number().optional(), count: z.number().optional(), model: ModelId.optional(), photo: Photo.optional(),
    desc: z.string().min(1), sources: SourceIds,
  });
  const SideSummary = z.object({
    name: z.string(), commander: z.string(), men: z.number().nullable().optional(), divisions: z.string(),
    tanks: z.number().nullable().optional(), aircraft: z.number().nullable().optional(), guns: z.number().nullable().optional(),
    fighters: z.number().nullable().optional(), bombers: z.number().nullable().optional(), asOf: z.string().optional(),
    losses: z.object({ killed: z.string(), wounded: z.string(), captured: z.string().optional(), tanks: z.string().optional(), aircraft: z.string().optional() }),
    note: z.string().optional(),
  });
  const ForcesSummary = z.object({
    sides: z.partialRecord(Side, SideSummary),
    byPhase: z.record(z.string(), z.partialRecord(Side, SideSummary)).optional(),
    sources: SourceIds,
  });
  return { Side, Source, Place, Unit, Route, ControlKeyframe, Pocket, Demarcation, Overlay, HistEvent, Equipment, ForcesSummary };
}
export type DataSchemas = ReturnType<typeof makeDataSchemas>;
