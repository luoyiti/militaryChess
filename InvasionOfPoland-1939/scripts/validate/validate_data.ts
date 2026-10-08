/**
 * 史实数据自检：npx tsx scripts/validate/validate_data.ts [--quiet] [--only units|fronts|events|routes]
 * ERROR 必须修复（退出码 1）；WARN 需人工复核。
 */
import {
  Source, Place, Unit, Route, ControlKeyframe, Pocket, Demarcation, HistEvent, Equipment, ForcesSummary,
  ECHELON_RANK, isoToHours, type LonLat, type Pos,
} from '../../src/schema';
import {
  buildGazetteer, tryResolvePos, haversineKm, pointInMulti, ringSelfIntersects, distToRingKm,
} from '../../src/model/core';
import { loadAll, loadPoland1938 } from './load_node';
import type { ZodType } from 'zod';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const errors: string[] = [];
const warns: string[] = [];
const E = (m: string) => errors.push(m);
const W = (m: string) => warns.push(m);

const raw = loadAll();
const [W0, S0, E0, N0] = raw.frame.bbox as [number, number, number, number];
const H_MIN = isoToHours('1939-08-31T00:00');
const H_MAX = isoToHours('1939-10-07T00:00');

function check<T>(schema: ZodType<T>, obj: unknown, where: string): T | null {
  const r = schema.safeParse(obj);
  if (!r.success) {
    for (const iss of r.error.issues.slice(0, 5)) E(`${where}: 结构错误 ${iss.path.join('.')} — ${iss.message}`);
    return null;
  }
  return r.data;
}

// ---------- 来源 ----------
const sourceIds = new Set<string>();
raw.sources.forEach((s, i) => { const v = check(Source, s, `sources[${i}]`); if (v) { if (sourceIds.has(v.id)) E(`来源 id 重复 ${v.id}`); sourceIds.add(v.id); } });
function checkSources(ids: string[] | undefined, where: string) {
  if (!ids?.length) return E(`${where}: 缺少 sources`);
  for (const id of ids) if (!sourceIds.has(id)) E(`${where}: 来源 ${id} 不在 sources.json`);
}

// ---------- 地名 ----------
const placeLists: Place[][] = [];
for (const g of raw.gazetteer) {
  const list: Place[] = [];
  g.items.forEach((p, i) => { const v = check(Place, p, `${g.file}[${i}]`); if (v) list.push(v); });
  placeLists.push(list);
}
const { gaz, conflicts } = buildGazetteer(...placeLists);
conflicts.forEach(E);
for (const p of gaz.values()) {
  if (p.pos[0] < W0 || p.pos[0] > E0 || p.pos[1] < S0 || p.pos[1] > N0) W(`地名 ${p.id} 超出地图范围 ${p.pos}`);
}
function pos(p: Pos, where: string): LonLat | null {
  const ll = tryResolvePos(p, gaz);
  if (!ll) { E(`${where}: 无法解析位置 ${JSON.stringify(p)}`); return null; }
  if (ll[0] < W0 || ll[0] > E0 || ll[1] < S0 || ll[1] > N0) E(`${where}: 坐标超出地图范围 ${ll}`);
  return ll;
}
function hours(iso: string, where: string): number {
  const h = isoToHours(iso);
  if (h < H_MIN || h > H_MAX) E(`${where}: 时间越界 ${iso}`);
  return h;
}

// ---------- 装备 ----------
const equipIds = new Set<string>();
raw.equipment.forEach((q, i) => {
  const v = check(Equipment, q, `equipment[${i}]`);
  if (!v) return;
  if (equipIds.has(v.id)) E(`装备 id 重复 ${v.id}`);
  equipIds.add(v.id);
  checkSources(v.sources, `equipment ${v.id}`);
  if (v.desc.length < 40 || v.desc.length > 180) W(`装备 ${v.id} 描述长度 ${v.desc.length}`);
});

// ---------- 战线关键帧（先解析，供单位位置检查）----------
type KF = { h: number; at: string; DE: LonLat[][][]; SU: LonLat[][][] };
const kfs: KF[] = [];
const kfFiles = new Set(raw.fronts.map((f) => f.item?.at));
for (const k of raw.keyframes) if (!kfFiles.has(k)) E(`战线关键帧缺失 ${k}（应为 src/data/fronts/${k.replace(':', '-')}.json）`);
for (const f of raw.fronts) {
  const v = check(ControlKeyframe, f.item, f.file);
  if (!v) continue;
  const expect = `src/data/fronts/${v.at.replace(':', '-')}.json`;
  if (f.file !== expect) E(`${f.file}: 文件名应为 ${expect}`);
  checkSources(v.sources, f.file);
  const conv = (polys: Pos[][][], side: string) => polys.map((poly, pi) => poly.map((ring, ri) => {
    const r = ring.map((p, k) => pos(p, `${f.file} ${side}[${pi}][${ri}][${k}]`) ?? [0, 0] as LonLat);
    const x = ringSelfIntersects(r);
    if (x) E(`${f.file} ${side}[${pi}] 环 ${ri} 自相交（边 ${x[0]} 与 ${x[1]}）`);
    return r;
  }));
  kfs.push({ h: hours(v.at, f.file), at: v.at, DE: conv(v.DE, 'DE'), SU: conv(v.SU, 'SU') });
  if (isoToHours(v.at) < isoToHours('1939-09-17T03:00') && v.SU.length) E(`${f.file}: 9/17 03:00 之前不应有苏军占领区`);
}
kfs.sort((a, b) => a.h - b.h);
const kfAt = (h: number): KF | null => { let r: KF | null = null; for (const k of kfs) if (k.h <= h) r = k; return r; };
const poland = loadPoland1938() as LonLat[][][] | null;
const inPoland = (ll: LonLat) => (poland ? pointInMulti(ll, poland) : true);

// 德苏占领区不得在波兰境内重叠；占领区面积统计（0.1° 网格采样）
{
  let prevDE = -1;
  for (const k of kfs) {
    let both = 0, de = 0, su = 0;
    for (let lon = 14; lon <= 28.5; lon += 0.1) for (let lat = 48; lat <= 56.5; lat += 0.1) {
      const ll: LonLat = [lon, lat];
      if (!inPoland(ll)) continue;
      const a = pointInMulti(ll, k.DE), b = pointInMulti(ll, k.SU);
      if (a) de++; if (b) su++; if (a && b) both++;
    }
    if (both > 4) E(`战线关键帧 ${k.at}: 德苏占领区在波兰境内重叠约 ${both} 个采样点（约 ${(both * 80).toFixed(0)} km²）`);
    const whitelist = (k.h >= isoToHours('1939-09-09T00:00') && k.h <= isoToHours('1939-09-13T00:00')) || k.h >= isoToHours('1939-09-20T00:00');
    if (prevDE > 0 && de < prevDE * 0.98 && !whitelist) W(`战线关键帧 ${k.at}: 德占面积比上一帧缩小 ${(100 - (de / prevDE) * 100).toFixed(1)}%`);
    if (!quiet) console.log(`  关键帧 ${k.at}  德占≈${de}  苏占≈${su}  (采样点，1 点≈80 km²)`);
    prevDE = de;
  }
}

// ---------- 部队 ----------
const units = new Map<string, Unit>();
for (const g of raw.units) {
  g.items.forEach((u, i) => {
    const v = check(Unit, u, `${g.file}[${i}]`);
    if (!v) return;
    if (units.has(v.id)) E(`部队 id 重复 ${v.id}`);
    units.set(v.id, v);
  });
}
const SPEED: Record<string, number> = { infantry: 45, mountain: 40, border: 45, fortress: 30, reserve: 45, hq: 120, artillery: 45, cavalry: 65, cavalry_mech: 100, light: 100, motorized: 100, armor: 100, naval: 60, marine: 45 };
for (const u of units.values()) {
  const where = `部队 ${u.id}`;
  checkSources(u.sources, where);
  if (!u.id.startsWith(u.side.toLowerCase() + '.')) E(`${where}: id 前缀须与 side 一致`);
  if (!u.name.short) W(`${where}: 缺少 name.short（棋子标签）`);
  if (u.parent) {
    const p = units.get(u.parent);
    if (!p) E(`${where}: 上级 ${u.parent} 不存在`);
    else {
      if (p.side !== u.side && !(u.side === 'SK' && p.side === 'DE')) E(`${where}: 与上级阵营不一致`);
      if (ECHELON_RANK[p.echelon] >= ECHELON_RANK[u.echelon] && !(p.echelon === 'division' && u.echelon === 'brigade')) E(`${where}: 梯队(${u.echelon}) 不低于上级 ${p.id}(${p.echelon})`);
    }
  }
  for (const q of u.equipment ?? []) if (!equipIds.has(q.id)) W(`${where}: 装备 ${q.id} 不在 equipment.json`);
  if (ECHELON_RANK[u.echelon] >= 1 && !u.track.length) W(`${where}: 军/师级缺少轨迹`);
  let prevH = -Infinity; let prevLL: LonLat | null = null;
  u.track.forEach((p, i) => {
    const h = hours(p.at, `${where}.track[${i}]`);
    if (h <= prevH) E(`${where}.track[${i}]: 时间未严格递增 ${p.at}`);
    const ll = pos(p.pos, `${where}.track[${i}]`);
    if (ll && prevLL && h > prevH && prevH > -Infinity) {
      const days = Math.max((h - prevH) / 24, 1 / 24);
      const v = haversineKm(prevLL, ll) / days;
      const lim = SPEED[u.type] ?? 60;
      if (v > lim * 1.15) W(`${where}.track[${i}]: 速度 ${v.toFixed(0)} km/天 超过 ${u.type} 上限 ${lim}`);
    }
    // 阵营一致性
    if (ll && kfs.length) {
      const k = kfAt(h);
      if (k) {
        const st = p.status;
        if (u.side === 'PL' && !['encircled', 'withdrawing', 'interned', 'surrendered', 'destroyed', 'disbanded'].includes(st ?? '')) {
          if (pointInMulti(ll, k.DE) || pointInMulti(ll, k.SU)) {
            const d = Math.min(...[...k.DE, ...k.SU].map((poly) => distToRingKm(ll, poly[0])));
            if (d > 20) W(`${where}.track[${i}] @${p.at}: 波兰部队位于敌占区内 ${d.toFixed(0)} km（关键帧 ${k.at}）`);
          }
        }
        if ((u.side === 'DE' || u.side === 'SK') && inPoland(ll) && h > isoToHours('1939-09-01T12:00')) {
          if (!pointInMulti(ll, k.DE)) {
            const d = Math.min(Infinity, ...k.DE.map((poly) => distToRingKm(ll, poly[0])));
            if (d > 25) W(`${where}.track[${i}] @${p.at}: 德军部队在德占区外 ${d.toFixed(0)} km（关键帧 ${k.at}）`);
          }
        }
      }
    }
    prevH = h; if (ll) prevLL = ll;
  });
}
// 环检测
for (const u of units.values()) {
  const seen = new Set<string>();
  let c: Unit | undefined = u;
  while (c?.parent) { if (seen.has(c.id)) { E(`部队树存在环: ${u.id}`); break; } seen.add(c.id); c = units.get(c.parent); }
}

// ---------- 路线 ----------
const routeIds = new Set<string>();
raw.routes.forEach((r, i) => {
  const v = check(Route, r, `routes[${i}]`);
  if (!v) return;
  if (routeIds.has(v.id)) E(`路线 id 重复 ${v.id}`);
  routeIds.add(v.id);
  if (!units.has(v.unit)) E(`路线 ${v.id}: 部队 ${v.unit} 不存在`);
  checkSources(v.sources, `路线 ${v.id}`);
  let prev = -Infinity;
  v.waypoints.forEach((w, k) => { const h = hours(w.at, `路线 ${v.id}[${k}]`); if (h <= prev) E(`路线 ${v.id}[${k}]: 时间未递增`); prev = h; pos(w.pos, `路线 ${v.id}[${k}]`); });
});

// ---------- 包围圈 / 分界线 ----------
raw.pockets.forEach((p, i) => {
  const v = check(Pocket, p, `pockets[${i}]`);
  if (!v) return;
  checkSources(v.sources, `包围圈 ${v.id}`);
  const a = pos(v.anchor, `包围圈 ${v.id}`);
  const h0 = hours(v.start, v.id), h1 = hours(v.end, v.id);
  if (h1 <= h0) E(`包围圈 ${v.id}: end 早于 start`);
  for (const uid of v.units ?? []) if (!units.has(uid)) E(`包围圈 ${v.id}: 部队 ${uid} 不存在`);
  if (a) for (const k of kfs) if (k.h >= h0 && k.h <= h1 && (pointInMulti(a, k.DE) || pointInMulti(a, k.SU))) W(`包围圈 ${v.id}: 锚点在关键帧 ${k.at} 位于占领区内（包围圈应为占领区的“洞”）`);
});
raw.demarcation.forEach((d, i) => { const v = check(Demarcation, d, `demarcation[${i}]`); if (v) { checkSources(v.sources, `分界线 ${v.id}`); v.line.forEach((p, k) => pos(p, `分界线 ${v.id}[${k}]`)); } });

// ---------- 事件 ----------
const eventIds = new Set<string>();
let prevEv = -Infinity;
raw.events.forEach((e, i) => {
  const v = check(HistEvent, e, `events[${i}]`);
  if (!v) return;
  if (eventIds.has(v.id)) E(`事件 id 重复 ${v.id}`);
  eventIds.add(v.id);
  const h = hours(v.at, `事件 ${v.id}`);
  if (h < prevEv) W(`事件 ${v.id}: 未按时间排序`);
  prevEv = h;
  if (v.endAt && isoToHours(v.endAt) < h) E(`事件 ${v.id}: endAt 早于 at`);
  pos(v.place, `事件 ${v.id}`);
  checkSources(v.sources, `事件 ${v.id}`);
  for (const uid of v.units ?? []) if (!units.has(uid)) W(`事件 ${v.id}: 部队 ${uid} 不存在`);
  const n = [...v.body].length;
  if (n < 60 || n > 170) W(`事件 ${v.id}: 正文 ${n} 字（建议 80–140）`);
});

// ---------- 兵力概况 ----------
if (raw.forces) { const v = check(ForcesSummary, raw.forces, 'forces_summary'); if (v) checkSources(v.sources, 'forces_summary'); }
else W('缺少 src/data/forces_summary.json');

// ---------- 汇总 ----------
const stat = {
  地名: gaz.size, 部队: units.size, 路线: routeIds.size, 关键帧: kfs.length, 包围圈: raw.pockets.length,
  分界线: raw.demarcation.length, 事件: eventIds.size, 装备: equipIds.size, 来源: sourceIds.size,
};
const byEch: Record<string, number> = {};
for (const u of units.values()) byEch[`${u.side}.${u.echelon}`] = (byEch[`${u.side}.${u.echelon}`] ?? 0) + 1;
console.log('统计', stat);
console.log('梯队', byEch);
if (!quiet) warns.forEach((w) => console.log('WARN ', w));
errors.forEach((e) => console.log('ERROR', e));
console.log(`\n结果：${errors.length} 个错误，${warns.length} 个警告`);
process.exit(errors.length ? 1 : 0);
