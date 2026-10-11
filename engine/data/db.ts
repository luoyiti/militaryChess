/**
 * 运行时数据库：把战役包 data/** 的 JSON（campaign.ts 里 import.meta.glob 收集，键形如 './data/oob/de.json'）
 * 按目录约定解析成可查询结构。离线已由 tools/validate 校验，这里不再做 schema 校验。浏览器与 Node 共用。
 */
import type {
  Place, Unit, Route, ControlKeyframe, Pocket, Demarcation, HistEvent, Equipment, ForcesSummary, Source, LonLat, Pos, Overlay,
} from '../core/types';
import { ECHELON_RANK } from '../core/types';
import { isoToHours } from '../core/time';
import { buildGazetteer, resolveUnits, resolveRoutes, resolvePos, type RUnit, type RRoute, type Gazetteer } from '../model/core';
import type { CampaignManifest } from '../campaign/types';
import { campaign } from '../campaign/context';

export interface RKeyframe { at: string; h: number; a: LonLat[][][]; b: LonLat[][][]; transition?: 'smooth' | 'step'; note?: string }
export interface RPocket extends Omit<Pocket, 'anchor'> { anchor: LonLat; h0: number; h1: number }
export interface RDemarcation extends Omit<Demarcation, 'line'> { line: LonLat[]; h0: number; h1: number }
export interface REvent extends Omit<HistEvent, 'place'> { ll: LonLat; h: number; h1: number; idx: number }
export interface ROverlay extends Omit<Overlay, 'polygons' | 'line' | 'pos'> { polygons?: LonLat[][][]; line?: LonLat[]; pos?: LonLat }

export interface DB {
  gaz: Gazetteer;
  places: Place[];
  units: Map<string, RUnit>;
  unitList: RUnit[];
  roots: RUnit[];
  routes: RRoute[];
  keyframes: RKeyframe[];
  pockets: RPocket[];
  demarcation: RDemarcation[];
  events: REvent[];
  equipment: Map<string, Equipment>;
  forces: ForcesSummary;
  sources: Map<string, Source>;
  overlays: ROverlay[];
  /** 插件自有数据：data/ext/<plugin>/<name>.json → ext[plugin][name] */
  ext: Record<string, Record<string, unknown>>;
}

/** data 目录约定（键为相对战役包根目录的路径） */
export const DATA_LAYOUT = {
  gazetteer: /^\.\/data\/gazetteer\/[^/]+\.json$/,
  oob: /^\.\/data\/oob\/[^/]+\.json$/,
  routes: /^\.\/data\/routes\/[^/]+\.json$/,
  fronts: /^\.\/data\/fronts\/[^/]+\.json$/,
  sources: /^\.\/data\/sources\/[^/]+\.json$/,
  ext: /^\.\/data\/ext\/([^/]+)\/([^/]+)\.json$/,
  single: /^\.\/data\/(events|pockets|demarcation|equipment|forces|overlays)\.json$/,
} as const;

export function unknownDataFiles(files: Record<string, unknown>): string[] {
  return Object.keys(files).filter((k) => !Object.values(DATA_LAYOUT).some((re) => re.test(k)));
}

function pick<T>(files: Record<string, unknown>, re: RegExp): T[] {
  return Object.keys(files).filter((k) => re.test(k)).sort().map((k) => files[k] as T);
}
const single = <T>(files: Record<string, unknown>, name: string, fallback: T): T => (files[`./data/${name}.json`] as T) ?? fallback;

export function buildDB(files: Record<string, unknown>, manifest: CampaignManifest): DB {
  const { gaz } = buildGazetteer(...pick<Place[]>(files, DATA_LAYOUT.gazetteer));
  const R = (p: Pos) => resolvePos(p, gaz);
  const units = resolveUnits(pick<Unit[]>(files, DATA_LAYOUT.oob).flat(), gaz);
  const unitList = [...units.values()];
  // 子单位按梯队与名称排序，便于序列树显示
  for (const u of unitList) {
    u.children.sort((a, b) => {
      const ua = units.get(a)!, ub = units.get(b)!;
      return ECHELON_RANK[ua.echelon] - ECHELON_RANK[ub.echelon] || ua.id.localeCompare(ub.id, 'en', { numeric: true });
    });
  }
  const roots = unitList.filter((u) => !u.parent || !units.has(u.parent));
  const routes = resolveRoutes(pick<Route[]>(files, DATA_LAYOUT.routes).flat(), gaz);
  const [slotA, slotB] = manifest.control.slots.map((s) => s.key);
  const conv = (polys: ControlKeyframe['control'][string] | undefined) => (polys ?? []).map((poly) => poly.map((ring) => ring.map(R)));
  const keyframes: RKeyframe[] = pick<ControlKeyframe>(files, DATA_LAYOUT.fronts)
    .map((k) => ({
      at: k.at,
      h: isoToHours(k.at),
      a: conv(slotA ? k.control[slotA] : undefined),
      b: conv(slotB ? k.control[slotB] : undefined),
      ...(k.transition ? { transition: k.transition } : {}),
      note: k.note,
    }))
    .sort((a, b) => a.h - b.h);
  const pockets: RPocket[] = single<Pocket[]>(files, 'pockets', []).map((p) => ({ ...p, anchor: R(p.anchor), h0: isoToHours(p.start), h1: isoToHours(p.end) }));
  const demarcation: RDemarcation[] = single<Demarcation[]>(files, 'demarcation', []).map((d) => ({
    ...d, line: d.line.map(R), h0: isoToHours(d.at), h1: d.until ? isoToHours(d.until) : 1e9,
  }));
  const events: REvent[] = single<HistEvent[]>(files, 'events', [])
    .map((e) => ({ ...e, ll: R(e.place), h: isoToHours(e.at), h1: e.endAt ? isoToHours(e.endAt) : isoToHours(e.at), idx: 0 }))
    .sort((a, b) => a.h - b.h);
  events.forEach((e, i) => (e.idx = i));
  const equipment = new Map(single<Equipment[]>(files, 'equipment', []).map((q) => [q.id, q]));
  const sources = new Map(pick<Source[]>(files, DATA_LAYOUT.sources).flat().map((s) => [s.id, s]));
  const overlays: ROverlay[] = single<Overlay[]>(files, 'overlays', []).map((o) => ({
    ...o,
    polygons: o.polygons?.map((poly) => poly.map((ring) => ring.map(R))),
    line: o.line?.map(R),
    pos: o.pos ? R(o.pos) : undefined,
  }));
  const ext: DB['ext'] = {};
  for (const k of Object.keys(files)) {
    const m = DATA_LAYOUT.ext.exec(k);
    if (m) (ext[m[1]] ??= {})[m[2]] = files[k];
  }
  const places = [...gaz.values()];
  const forces = single<ForcesSummary>(files, 'forces', { sides: {}, sources: [] });
  return { gaz, places, units, unitList, roots, routes, keyframes, pockets, demarcation, events, equipment, forces, sources, overlays, ext };
}

let _db: DB | null = null;
/** 当前战役的数据库（首次调用时构建）。需先 initCampaign/initTime。 */
export function getDB(): DB {
  return (_db ??= buildDBFromCampaign());
}
function buildDBFromCampaign(): DB {
  const c = campaign();
  return buildDB(c.data, c.manifest);
}
