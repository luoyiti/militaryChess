/**
 * 战役包校验：npm run validate -- [--campaign <id> | --all] [--quiet]
 *   ERROR 必须修复（退出码 1）；WARN 需人工复核（--quiet 只打印错误与汇总）。
 * 检查：清单结构 → 数据文件布局 → 每条数据的 schema（engine/schema/zod.ts）→ 引用完整性 → 时间窗与坐标范围
 *      → 轨迹时序与速度 → 控制区多边形 → 照片与静态资源 → 清单里声明的战役专属规则（manifest.validation）。
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ZodType } from 'zod';
import { listCampaignIds, campaignDir, publicDir, readDataFiles, ROOT } from '../lib/campaign-node';
import { ManifestSchema, PlannedManifestSchema, makeDataSchemas, isCalendarIso } from '../../engine/schema/zod';
import { DATA_LAYOUT, unknownDataFiles } from '../../engine/data/db';
import { ECHELON_RANK, type Echelon, type LonLat, type Place, type Pos } from '../../engine/core/types';
import { buildGazetteer, tryResolvePos, haversineKm, ringSelfIntersects } from '../../engine/model/core';
import type { CampaignManifest, FrameConfig } from '../../engine/campaign/types';
import { MODEL_IDS } from '../../engine/three/models/index';
import { SYNTH_IDS } from '../../engine/audio/synth';
import sprite from '../../shared/audio/sfx-sprite.json';
import library from '../../shared/audio/music/library.json';
import { airRules } from './rules/air';

export interface Report { id: string; errors: string[]; warns: string[]; stats: Record<string, number> }
export interface Ctx {
  id: string; m: CampaignManifest; frame: FrameConfig; files: Record<string, unknown>;
  E: (msg: string) => void; W: (msg: string) => void;
  hours: (iso: string) => number; pos: (p: Pos, where: string, strict?: boolean) => LonLat | null;
}

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
const SFX = [...new Set([...Object.keys((sprite as { sprite: object }).sprite), ...SYNTH_IDS()])];
const MUSIC = (library as { id: string }[]).map((t) => t.id);
/** 地面部队日行程上限（km/天，WARN）；manifest.validation.speeds 可覆盖 */
const SPEED: Record<string, number> = { infantry: 45, mountain: 40, border: 45, fortress: 30, reserve: 45, hq: 120, artillery: 45, cavalry: 65, cavalry_mech: 100, light: 100, motorized: 100, armor: 100, naval: 600, marine: 45 };
const MOVE_SPEED: Record<string, number> = { sea: 700, rail: 700, air: 9000 };
const AIR_TYPES = new Set(['air', 'aviation', 'fighter', 'bomber']);

/** 插件或规则在 manifest.validation 中可用的键（其余键报 WARN，避免拼写错误静默失效） */
interface Rules { speeds?: Record<string, number>; slotEmptyBefore?: Record<string, string>; eventCount?: number; bodyLength?: [number, number] }
const RULE_KEYS = new Set(['speeds', 'slotEmptyBefore', 'eventCount', 'bodyLength']);

function check<T>(schema: ZodType<T>, obj: unknown, where: string, E: (m: string) => void, W: (m: string) => void, strictSchema?: ZodType): T | null {
  const r = schema.safeParse(obj);
  if (!r.success) { for (const iss of r.error.issues.slice(0, 4)) E(`${where}: ${iss.path.join('.') || '(根)'} — ${iss.message}`); return null; }
  // 未知字段（多半是拼写错误或旧版字段名）只提示
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && strictSchema === undefined) {
    const known = (schema as unknown as { shape?: Record<string, unknown> }).shape;
    if (known) { const extra = Object.keys(obj).filter((k) => !(k in known)); if (extra.length) W(`${where}: 未知字段 ${extra.join(', ')}`); }
  }
  return r.data;
}

export function validateCampaign(id: string): Report {
  const errors: string[] = [], warns: string[] = [];
  const E = (msg: string) => errors.push(msg), W = (msg: string) => warns.push(msg);
  const dir = campaignDir(id), pub = publicDir(id);
  const raw = readJson<Record<string, unknown>>(join(dir, 'campaign.json'));
  const stats: Record<string, number> = {};
  if (raw.id !== id) E(`campaign.json: id「${raw.id}」须与目录名一致`);

  // ---------- 筹备中：只检查总台卷宗 ----------
  if (raw.status === 'planned') {
    check(PlannedManifestSchema, raw, 'campaign.json', E, W, PlannedManifestSchema);
    hubChecks(raw as unknown as CampaignManifest, E, W, null);
    return { id, errors, warns, stats };
  }
  const m = check(ManifestSchema, raw, 'campaign.json', E, W, ManifestSchema) as unknown as CampaignManifest | null;
  if (!m) return { id, errors, warns, stats };
  for (const f of ['config/frame.json', 'config/lod.json', 'campaign.ts', 'main.ts', 'index.html']) if (!existsSync(join(dir, f))) E(`缺少 ${f}`);
  if (errors.length) return { id, errors, warns, stats };
  const frame = readJson<FrameConfig & { field: { w: number; h: number } }>(join(dir, 'config/frame.json'));
  const files = readDataFiles(id);
  const rules = (m.validation ?? {}) as Rules;
  for (const k of Object.keys(rules)) if (!RULE_KEYS.has(k)) W(`manifest.validation.${k}: 未知规则（可用：${[...RULE_KEYS].join('、')}）`);

  // ---------- 清单交叉检查 ----------
  const t0 = isoH(m.time.epoch), tStart = isoH(m.time.start), tEnd = isoH(m.time.dataEnd ?? m.time.end);
  if (!(t0 <= tStart && tStart < isoH(m.time.end))) E('time: 须满足 epoch ≤ start < end');
  const sideIds = new Set(m.sides.map((s) => s.id));
  if (sideIds.size !== m.sides.length) E('sides: 阵营 id 重复');
  if (new Set(m.sides.map((s) => s.prefix)).size !== m.sides.length) E('sides: 部队 id 前缀重复');
  for (const s of m.sideOrder ?? []) if (!sideIds.has(s)) E(`sideOrder: 未知阵营 ${s}`);
  for (const [a, b] of m.parentExceptions ?? []) if (!sideIds.has(a) || !sideIds.has(b)) E(`parentExceptions: 未知阵营 ${a}/${b}`);
  let prevPhase = -Infinity;
  for (const p of m.phases) { const h = isoH(p.from); if (h < prevPhase) E(`phases: ${p.id} 未按时间排序`); if (h > tEnd) E(`phases: ${p.id} 晚于战役结束`); prevPhase = h; }
  for (const c of m.audio.music) if (!MUSIC.includes(c.track)) E(`audio.music: 未知曲目 ${c.track}（可用：${MUSIC.join('、')}）`);
  for (const k of ['introMusic', 'bedTrack'] as const) { const t = (m.audio as Record<string, unknown>)[k]; if (typeof t === 'string' && !MUSIC.includes(t)) E(`audio.${k}: 未知曲目 ${t}`); }
  for (const r of (m.director as { sirens?: { sfx: string }[] }).sirens ?? []) if (!SFX.includes(r.sfx)) E(`director.sirens: 未知音效 ${r.sfx}`);
  for (const s of m.sides) if (s.defaultModel && !MODEL_IDS().includes(s.defaultModel)) E(`sides.${s.id}.defaultModel: 未注册的模型 ${s.defaultModel}`);
  if (m.control.mode === 'territory' && !m.control.theatreBits.length) E('control.theatreBits: 领土模式至少需要一个战区比特');

  // ---------- 数据文件布局 ----------
  for (const k of unknownDataFiles(files)) E(`${k}: 不认识的数据文件（布局见 docs/DATA-FORMAT.md；插件数据放 data/ext/<插件>/）`);
  const pick = (re: RegExp) => Object.keys(files).filter((k) => re.test(k)).sort();
  for (const [name, re] of [['gazetteer', DATA_LAYOUT.gazetteer], ['oob', DATA_LAYOUT.oob], ['fronts', DATA_LAYOUT.fronts], ['sources', DATA_LAYOUT.sources]] as const) if (!pick(re).length) E(`data/${name}/ 下没有任何 JSON`);
  for (const f of ['events', 'equipment', 'forces']) if (!files[`./data/${f}.json`]) E(`缺少 data/${f}.json`);

  const S = makeDataSchemas(m, { models: MODEL_IDS(), sfx: SFX });
  const [W0, S0, E0, N0] = frame.bbox;
  const padX = (E0 - W0) * 0.1, padY = (N0 - S0) * 0.1;
  const inFrame = (ll: LonLat, pad = false) => ll[0] >= W0 - (pad ? padX : 0) && ll[0] <= E0 + (pad ? padX : 0) && ll[1] >= S0 - (pad ? padY : 0) && ll[1] <= N0 + (pad ? padY : 0);
  const hours = (iso: string, where = '') => { const h = isoH(iso); if (where && (h < t0 || h > tEnd + 24)) E(`${where}: 时间 ${iso} 超出战役时间窗 ${m.time.epoch} — ${m.time.dataEnd ?? m.time.end}`); return h; };

  // ---------- 来源 ----------
  const sourceIds = new Set<string>();
  for (const k of pick(DATA_LAYOUT.sources)) (files[k] as unknown[]).forEach((s, i) => { const v = check(S.Source, s, `${k}[${i}]`, E, W); if (v) { if (sourceIds.has(v.id)) E(`来源 id 重复 ${v.id}`); sourceIds.add(v.id); } });
  const usedSources = new Set<string>();
  const srcs = (ids: string[] | undefined, where: string) => { for (const sid of ids ?? []) { usedSources.add(sid); if (!sourceIds.has(sid)) E(`${where}: 来源 ${sid} 不在 data/sources/`); } };

  // ---------- 地名 ----------
  const placeLists: Place[][] = pick(DATA_LAYOUT.gazetteer).map((k) => (files[k] as unknown[]).map((p, i) => check(S.Place, p, `${k}[${i}]`, E, W) as Place | null).filter((p): p is Place => !!p));
  const { gaz, conflicts } = buildGazetteer(...placeLists);
  conflicts.forEach(E);
  for (const p of gaz.values()) { if (!inFrame(p.pos, true)) W(`地名 ${p.id} 远在地图范围外 ${p.pos}`); srcs(p.sources, `地名 ${p.id}`); }
  const pos = (p: Pos, where: string, strict = true): LonLat | null => {
    const ll = tryResolvePos(p, gaz);
    if (!ll) { E(`${where}: 无法解析位置 ${JSON.stringify(p)}`); return null; }
    if (strict && !inFrame(ll, true)) E(`${where}: 坐标超出地图范围 ${ll}`);
    return ll;
  };
  const ctx: Ctx = { id, m, frame, files, E, W, hours, pos };

  // ---------- 装备 ----------
  const equipIds = new Set<string>();
  ((files['./data/equipment.json'] as unknown[]) ?? []).forEach((q, i) => {
    const v = check(S.Equipment, q, `equipment[${i}]`, E, W);
    if (!v) return;
    if (equipIds.has(v.id)) E(`装备 id 重复 ${v.id}`);
    equipIds.add(v.id);
    srcs(v.sources, `装备 ${v.id}`);
  });

  // ---------- 控制区关键帧 ----------
  const fronts: { at: string; h: number; control: Record<string, LonLat[][][]> }[] = [];
  for (const k of pick(DATA_LAYOUT.fronts)) {
    const v = check(S.ControlKeyframe, files[k], k, E, W);
    if (!v) continue;
    const expect = `./data/fronts/${v.at.replace(':', '-')}.json`;
    if (k !== expect) E(`${k}: 文件名应为 ${expect.slice(2)}`);
    srcs(v.sources, k);
    const control: Record<string, LonLat[][][]> = {};
    for (const [slot, polys] of Object.entries(v.control)) {
      control[slot] = (polys ?? []).map((poly, pi) => poly.map((ring, ri) => {
        const r = ring.map((p, j) => pos(p, `${k} ${slot}[${pi}][${ri}][${j}]`, false) ?? ([0, 0] as LonLat));
        const x = ringSelfIntersects(r);
        if (x) E(`${k} ${slot}[${pi}] 环 ${ri} 自相交（边 ${x[0]} 与 ${x[1]}）`);
        return r;
      }));
    }
    fronts.push({ at: v.at, h: hours(v.at, k), control });
  }
  fronts.sort((a, b) => a.h - b.h);
  if (fronts.length && fronts[0].h > tStart) W(`第一个控制区关键帧 ${fronts[0].at} 晚于战役开始，开局前无控制区`);
  for (const [slot, iso] of Object.entries(rules.slotEmptyBefore ?? {})) for (const f of fronts) if (f.h < isoH(iso) && f.control[slot]?.length) E(`fronts/${f.at}: ${iso} 之前 ${slot} 槽应为空`);

  // ---------- 部队 ----------
  type U = { id: string; side: string; echelon: Echelon; type: string; parent: string | null; track: { at: string; pos: Pos; status?: string; movement?: string; flightPhase?: string }[]; equipment?: { id: string }[]; name: { short?: string }; sources: string[]; base?: Pos };
  const units = new Map<string, U>();
  for (const k of pick(DATA_LAYOUT.oob)) (files[k] as unknown[]).forEach((u, i) => {
    const v = check(S.Unit, u, `${k}[${i}]`, E, W) as U | null;
    if (!v) return;
    if (units.has(v.id)) E(`部队 id 重复 ${v.id}`);
    units.set(v.id, v);
  });
  const exceptions = new Set((m.parentExceptions ?? []).map(([a, b]) => `${a}>${b}`));
  const speeds = { ...SPEED, ...(rules.speeds ?? {}) };
  for (const u of units.values()) {
    const where = `部队 ${u.id}`;
    srcs(u.sources, where);
    const side = m.sides.find((s) => s.id === u.side);
    if (side && !u.id.startsWith(side.prefix + '.')) E(`${where}: id 前缀须为 ${side.prefix}.（阵营 ${u.side}）`);
    if (!u.name.short) W(`${where}: 缺少 name.short（棋子标签）`);
    if (u.base) pos(u.base, `${where}.base`);
    if (u.parent) {
      const p = units.get(u.parent);
      if (!p) E(`${where}: 上级 ${u.parent} 不存在`);
      else {
        if (p.side !== u.side && !exceptions.has(`${u.side}>${p.side}`)) E(`${where}: 与上级 ${p.id} 阵营不一致（如属允许的跨阵营隶属，写入 manifest.parentExceptions）`);
        if (ECHELON_RANK[p.echelon] > ECHELON_RANK[u.echelon]) W(`${where}: 梯队 ${u.echelon} 高于上级 ${p.id}（${p.echelon}）`);
      }
    }
    for (const q of u.equipment ?? []) if (!equipIds.has(q.id)) W(`${where}: 装备 ${q.id} 不在 equipment.json`);
    let prevH = -Infinity, prevLL: LonLat | null = null, offMap = 0;
    u.track.forEach((p, i) => {
      const h = hours(p.at, `${where}.track[${i}]`);
      if (h <= prevH) E(`${where}.track[${i}]: 时间未严格递增 ${p.at}`);
      // 离场集结 / 撤离目的地可以在图外（引擎按图边裁剪），只汇总提示
      const ll = pos(p.pos, `${where}.track[${i}]`, false);
      if (ll && !inFrame(ll, true)) offMap++;
      if (ll && prevLL && h > prevH && !AIR_TYPES.has(u.type) && !p.flightPhase) {
        const prev = u.track[i - 1];
        const days = Math.max((h - prevH) / 24, 1 / 24);
        const v = haversineKm(prevLL, ll) / days;
        const lim = MOVE_SPEED[prev?.movement ?? ''] ?? speeds[u.type] ?? 60;
        if (v > lim * 1.15) W(`${where}.track[${i}]: 速度 ${v.toFixed(0)} km/天，超过 ${prev?.movement ?? u.type} 上限 ${lim}`);
      }
      prevH = h; if (ll) prevLL = ll;
    });
    if (offMap) W(`${where}: ${offMap} 个轨迹点在地图范围外（离场集结或撤离去向）`);
  }
  for (const u of units.values()) {
    const seen = new Set<string>();
    let c: U | undefined = u;
    while (c?.parent) { if (seen.has(c.id)) { E(`部队编制树存在环：${u.id}`); break; } seen.add(c.id); c = units.get(c.parent); }
  }

  // ---------- 路线 ----------
  const routeIds = new Set<string>();
  for (const k of pick(DATA_LAYOUT.routes)) (files[k] as unknown[]).forEach((r, i) => {
    const v = check(S.Route, r, `${k}[${i}]`, E, W);
    if (!v) return;
    if (routeIds.has(v.id)) E(`路线 id 重复 ${v.id}`);
    routeIds.add(v.id);
    const u = units.get(v.unit);
    if (!u) E(`路线 ${v.id}: 部队 ${v.unit} 不存在`);
    else if (u.side !== v.side) E(`路线 ${v.id}: 阵营 ${v.side} 与部队 ${u.id}（${u.side}）不一致`);
    srcs(v.sources, `路线 ${v.id}`);
    let prev = -Infinity;
    v.waypoints.forEach((w, j) => { const h = hours(w.at, `路线 ${v.id}[${j}]`); if (h <= prev) E(`路线 ${v.id}[${j}]: 时间未严格递增`); prev = h; pos(w.pos, `路线 ${v.id}[${j}]`, v.movement !== 'air' && v.movement !== 'sea'); });
  });

  // ---------- 包围圈 / 分界线 / 叠加层 ----------
  ((files['./data/pockets.json'] as unknown[]) ?? []).forEach((p, i) => {
    const v = check(S.Pocket, p, `pockets[${i}]`, E, W);
    if (!v) return;
    srcs(v.sources, `包围圈 ${v.id}`);
    pos(v.anchor, `包围圈 ${v.id}`);
    if (hours(v.end, `包围圈 ${v.id}`) <= hours(v.start, `包围圈 ${v.id}`)) E(`包围圈 ${v.id}: end 不晚于 start`);
    for (const uid of v.units ?? []) if (!units.has(uid)) E(`包围圈 ${v.id}: 部队 ${uid} 不存在`);
  });
  ((files['./data/demarcation.json'] as unknown[]) ?? []).forEach((d, i) => { const v = check(S.Demarcation, d, `demarcation[${i}]`, E, W); if (v) { srcs(v.sources, `分界线 ${v.id}`); v.line.forEach((p, j) => pos(p, `分界线 ${v.id}[${j}]`, false)); } });
  ((files['./data/overlays.json'] as unknown[]) ?? []).forEach((o, i) => {
    const v = check(S.Overlay, o, `overlays[${i}]`, E, W);
    if (!v) return;
    srcs(v.sources, `叠加层 ${v.id}`);
    const layers = new Set([...(m.ui as { extraLayers?: { key: string }[] }).extraLayers?.map((l) => l.key) ?? [], 'demarcation', 'labels', 'rivers']);
    if (!layers.has(v.layer)) W(`叠加层 ${v.id}: 图层 ${v.layer} 不在 ui.extraLayers 中，无法单独开关`);
  });

  // ---------- 事件 ----------
  const photos = existsSync(join(pub, 'photos/index.json')) ? readJson<Record<string, { src: string }>>(join(pub, 'photos/index.json')) : {};
  const eventIds = new Set<string>();
  const [bMin, bMax] = rules.bodyLength ?? [60, 170];
  let prevEv = -Infinity;
  ((files['./data/events.json'] as unknown[]) ?? []).forEach((e, i) => {
    const v = check(S.HistEvent, e, `events[${i}]`, E, W);
    if (!v) return;
    if (eventIds.has(v.id)) E(`事件 id 重复 ${v.id}`);
    eventIds.add(v.id);
    const h = hours(v.at, `事件 ${v.id}`);
    if (h < prevEv) W(`事件 ${v.id}: 未按时间排序`);
    prevEv = h;
    if (v.endAt && hours(v.endAt, `事件 ${v.id}`) < h) E(`事件 ${v.id}: endAt 早于 at`);
    pos(v.place, `事件 ${v.id}`);
    srcs(v.sources, `事件 ${v.id}`);
    for (const uid of v.units ?? []) if (!units.has(uid)) W(`事件 ${v.id}: 部队 ${uid} 不存在`);
    const n = [...v.body].length;
    if (n < bMin || n > bMax) W(`事件 ${v.id}: 正文 ${n} 字（建议 ${bMin}–${bMax}）`);
    if (v.photo) {
      const ph = photos[v.photo.commons];
      if (!ph) E(`事件 ${v.id}: 照片 ${v.photo.commons} 未在 photos/index.json 中索引`);
      else if (!existsSync(join(pub, ph.src)) || statSync(join(pub, ph.src)).size < 100) E(`事件 ${v.id}: 照片文件缺失 ${ph.src}`);
    }
  });
  if (rules.eventCount !== undefined && eventIds.size !== rules.eventCount) E(`事件数 ${eventIds.size}，manifest.validation.eventCount 要求 ${rules.eventCount}`);

  // ---------- 兵力概况 ----------
  const forces = files['./data/forces.json'] ? check(S.ForcesSummary, files['./data/forces.json'], 'forces', E, W) : null;
  if (forces) {
    srcs(forces.sources, 'forces');
    const usesPhases = !!(m.ui as { brief?: { byPhase?: boolean } }).brief?.byPhase;
    for (const ph of Object.keys(forces.byPhase ?? {})) {
      if (!usesPhases) { W(`forces.byPhase.${ph}: 未启用 ui.brief.byPhase，这部分数据不会显示`); continue; }
      if (!m.phases.some((p) => p.id === ph)) E(`forces.byPhase: 未知阶段 ${ph}`);
    }
  }

  // ---------- 静态资源 ----------
  for (const f of ['geo/vectors.topo.json', 'geo/field_masks.bin', 'tiles/base/meta.json', 'terrain/terrain.json', 'terrain/albedo.webp', 'terrain/height.png', 'credits.json']) if (!existsSync(join(pub, f))) E(`缺少静态资源 public/campaigns/${id}/${f}`);
  if (existsSync(join(pub, 'geo/field_masks.bin'))) { const n = statSync(join(pub, 'geo/field_masks.bin')).size; if (n !== frame.field.w * frame.field.h) E(`geo/field_masks.bin 大小 ${n} ≠ field ${frame.field.w}×${frame.field.h}`); }
  if (existsSync(join(pub, 'geo/vectors.topo.json'))) {
    const topo = readJson<{ objects: Record<string, { geometries: { properties?: { id?: string } }[] }> }>(join(pub, 'geo/vectors.topo.json'));
    for (const key of ['land', 'countries1939', 'rivers', 'lakes']) if (!topo.objects[key]) E(`geo/vectors.topo.json 缺少图层 ${key}`);
    const cids = new Set(topo.objects.countries1939?.geometries.map((g) => g.properties?.id) ?? []);
    for (const c of m.map.theatreCountries) if (!cids.has(c)) E(`map.theatreCountries: ${c} 不在 vectors.topo.json 的 countries1939 中`);
  }
  if (m.control.mode === 'air') airRules(ctx, units as never, pick(DATA_LAYOUT.routes).flatMap((k) => files[k] as never[]));
  hubChecks(m, E, W, photos);

  const unused = [...sourceIds].filter((s) => !usedSources.has(s));
  if (unused.length) W(`有 ${unused.length} 个来源未被引用：${unused.slice(0, 6).join('、')}${unused.length > 6 ? '…' : ''}`);
  Object.assign(stats, { 地名: gaz.size, 部队: units.size, 路线: routeIds.size, 关键帧: fronts.length, 事件: eventIds.size, 装备: equipIds.size, 来源: sourceIds.size });
  return { id, errors, warns, stats };
}

/** 总台卷宗：战区国家须存在于总台底图，封面须有署名，嵌套战役须存在 */
function hubChecks(m: CampaignManifest, E: (s: string) => void, W: (s: string) => void, photos: Record<string, { src: string }> | null) {
  const topoPath = join(ROOT, 'public/hub/europe1938.topo.json');
  if (existsSync(topoPath) && m.hub?.theatre?.countries) {
    const ids = new Set(readJson<{ objects: { countries: { geometries: { properties: { id: string } }[] } } }>(topoPath).objects.countries.geometries.map((g) => g.properties.id));
    for (const c of m.hub.theatre.countries) if (!ids.has(c)) E(`hub.theatre.countries: 「${c}」不在总台底图中（可用 id 见 public/hub/europe1938.topo.json）`);
  }
  if (!m.hub?.theatre) W('hub.theatre 未设置：总台以 frame.bbox 作战区轮廓');
  if (m.hub?.parent && !existsSync(join(campaignDir(m.hub.parent), 'campaign.json'))) E(`hub.parent: 战役 ${m.hub.parent} 不存在`);
  if (m.hub?.cover && photos) { if (!Object.values(photos).some((p) => p.src === m.hub.cover)) E(`hub.cover: ${m.hub.cover} 不在 photos/index.json 中（总台需要它的署名）`); }
  else if (m.status !== 'planned' && !m.hub?.cover) W('hub.cover 未设置：总台卷宗不显示封面照片');
}

function isoH(iso: string) {
  if (!isCalendarIso(iso)) return NaN;
  const [d, t] = iso.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return Date.UTC(y, mo - 1, da, h, mi) / 3_600_000;
}

// ---------- 命令行 ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const ci = args.indexOf('--campaign');
  const ids = ci >= 0 ? [args[ci + 1]] : listCampaignIds();
  let failed = 0;
  for (const id of ids) {
    if (!existsSync(join(campaignDir(id), 'campaign.json'))) { console.log(`✗ ${id}: campaigns/${id}/campaign.json 不存在`); failed++; continue; }
    const r = validateCampaign(id);
    const stat = Object.entries(r.stats).map(([k, v]) => `${k} ${v}`).join(' · ');
    console.log(`${r.errors.length ? '✗' : '✓'} ${id}  ${stat || '（筹备中，只检查卷宗）'}  — ${r.errors.length} 错误，${r.warns.length} 警告`);
    if (!quiet) r.warns.forEach((w) => console.log('    WARN ', w));
    r.errors.forEach((e) => console.log('    ERROR', e));
    if (r.errors.length) failed++;
  }
  process.exit(failed ? 1 : 0);
}
