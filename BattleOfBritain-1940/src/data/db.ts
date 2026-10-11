/** 运行时数据库：用 Vite glob 把 src/data/** 打包进来并解析（离线已由 validate_data 校验，这里不再做 zod 校验）。 */
import type {
  Place, Unit, Route, ControlKeyframe, AirKeyframe, Airspace, Pocket, Demarcation, HistEvent, Equipment, ForcesSummary, Source, LonLat, Pos,
} from '../schema';
import { isoToHours, ECHELON_RANK } from '../schema';
import { buildGazetteer, resolveUnits, resolveRoutes, resolvePos, type RUnit, type RRoute, type Gazetteer } from '../model/core';
import keyframesCfg from '../../config/keyframes.json';

const gazFiles = import.meta.glob<Place[]>('./gazetteer/*.json', { eager: true, import: 'default' });
const oobFiles = import.meta.glob<Unit[]>('./oob/*.json', { eager: true, import: 'default' });
const routeFiles = import.meta.glob<Route[]>('./routes/*.json', { eager: true, import: 'default' });
const frontFiles = import.meta.glob<ControlKeyframe>('./fronts/*.json', { eager: true, import: 'default' });
const airFiles = import.meta.glob<AirKeyframe>('./airframes/*.json', {eager:true,import:'default'});
import airspaceJson from './airspace.json';
const sourceFiles = import.meta.glob<Source[]>('./sources/*.json', { eager: true, import: 'default' });
import pocketsJson from './pockets.json';
import demarcationJson from './demarcation.json';
import eventsJson from './events.json';
import equipmentJson from './equipment.json';
import forcesJson from './forces_summary.json';

export interface RKeyframe { at: string; h: number; DE: LonLat[][][]; SU: LonLat[][][]; note?: string; air?:boolean }
export interface RPocket extends Omit<Pocket, 'anchor'> { anchor: LonLat; h0: number; h1: number }
export interface RDemarcation extends Omit<Demarcation, 'line'> { line: LonLat[]; h0: number; h1: number }
export interface REvent extends Omit<HistEvent, 'place'> { ll: LonLat; h: number; h1: number; idx: number }

export interface DB {
  gaz: Gazetteer;
  places: Place[];
  units: Map<string, RUnit>;
  unitList: RUnit[];
  roots: RUnit[];
  routes: RRoute[];
  keyframes: RKeyframe[];
  airspace: {groups: {id:string;label:string;polygons:LonLat[][][]}[];radar:{id:string;label:string;pos:LonLat;rangeKm:number}[]};
  pockets: RPocket[];
  demarcation: RDemarcation[];
  events: REvent[];
  equipment: Map<string, Equipment>;
  forces: ForcesSummary;
  sources: Map<string, Source>;
}

function pickOrdered<T>(files: Record<string, T>): T[] {
  return Object.keys(files).sort().map((k) => files[k]);
}

let _db: DB | null = null;

export function getDB(): DB {
  if (_db) return _db;
  const { gaz } = buildGazetteer(...pickOrdered(gazFiles));
  const R = (p: Pos) => resolvePos(p, gaz);
  const allUnits = pickOrdered(oobFiles).flat();
  const units = resolveUnits(allUnits, gaz);
  const unitList = [...units.values()];
  // 子单位按梯队与名称排序，便于序列树显示
  for (const u of unitList) {
    u.children.sort((a, b) => {
      const ua = units.get(a)!, ub = units.get(b)!;
      return ECHELON_RANK[ua.echelon] - ECHELON_RANK[ub.echelon] || ua.id.localeCompare(ub.id, 'en', { numeric: true });
    });
  }
  const roots = unitList.filter((u) => !u.parent || !units.has(u.parent));
  const routes = resolveRoutes(pickOrdered(routeFiles).flat(), gaz);
  const kfOrder = (keyframesCfg as { keyframes: string[] }).keyframes;
  const activeFrames: (ControlKeyframe & {air?:boolean})[] = Object.keys(airFiles).length ? Object.values(airFiles).map((k)=>({ ...k, DE:k.raids, SU:k.interceptions, air:true })) : Object.values(frontFiles);
  const keyframes: RKeyframe[] = activeFrames
    .map((k) => ({
      at: k.at,
      h: isoToHours(k.at),
      DE: k.DE.map((poly) => poly.map((ring) => ring.map(R))),
      SU: k.SU.map((poly) => poly.map((ring) => ring.map(R))),
      note: k.note, air:k.air,
    }))
    .filter((k) => kfOrder.includes(k.at))
    .sort((a, b) => a.h - b.h);
  const pockets: RPocket[] = (pocketsJson as Pocket[]).map((p) => ({ ...p, anchor: R(p.anchor), h0: isoToHours(p.start), h1: isoToHours(p.end) }));
  const demarcation: RDemarcation[] = (demarcationJson as Demarcation[]).map((d) => ({
    ...d, line: d.line.map(R), h0: isoToHours(d.at), h1: d.until ? isoToHours(d.until) : 1e9,
  }));
  const events: REvent[] = (eventsJson as HistEvent[])
    .map((e) => ({ ...e, ll: R(e.place), h: isoToHours(e.at), h1: e.endAt ? isoToHours(e.endAt) : isoToHours(e.at), idx: 0 }))
    .sort((a, b) => a.h - b.h);
  events.forEach((e, i) => (e.idx = i));
  const equipment = new Map((equipmentJson as Equipment[]).map((q) => [q.id, q]));
  const sources = new Map(pickOrdered(sourceFiles).flat().map((s) => [s.id, s]));
  const places = [...gaz.values()];
  const rawSpace=airspaceJson as unknown as Airspace;
  const airspace={groups:rawSpace.groups.map((g)=>({...g,polygons:g.polygons.map((p)=>p.map((r)=>r.map(R)))})),radar:rawSpace.radar.map((r)=>({...r,pos:R(r.pos)}))};
  _db = { gaz, places, units, unitList, roots, routes, keyframes, airspace, pockets, demarcation, events, equipment, forces: forcesJson as ForcesSummary, sources };
  return _db;
}
