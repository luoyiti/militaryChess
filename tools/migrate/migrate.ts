/**
 * 旧版独立战役 → 统一战役包（一次性迁移工具）。
 *   npx tsx tools/migrate/migrate.ts <legacyDir> <campaignId>
 * 搬运并规范化：
 *   src/data/**      → campaigns/<id>/data/**（数据契约 v2：control 槽、zoomRel/wide、count、country、precision、movement/role …）
 *   config/frame.json, lod.json → campaigns/<id>/config/；palette.json → pipeline/geo/（仅地图渲染管线使用）
 *   public/**        → public/campaigns/<id>/**（去掉共享的字体、音效、配乐与仅供校验的战区 geojson）
 *   scripts/ docs/ tests/ README LICENSES → campaigns/<id>/pipeline|docs|tests
 * 不修改旧目录；重复运行会覆盖目标中的同名文件。
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const [legacyArg, id] = process.argv.slice(2);
if (!legacyArg || !id) throw new Error('usage: migrate.ts <legacyDir> <campaignId>');
const L = resolve(ROOT, legacyArg);
const C = join(ROOT, 'campaigns', id);
const P = join(ROOT, 'public/campaigns', id);

type Json = any;
const read = (p: string): Json => JSON.parse(readFileSync(p, 'utf8'));
const write = (p: string, v: unknown) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 1) + '\n'); };
const ls = (d: string) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.json')).sort() : []);

// ---------- 每个战役的迁移选项 ----------
interface Opts {
  zoom: 'index' | 'interp' | 'raw'; // 旧版 event.zoom 语义
  precisionDefault?: 'day' | 'minute'; // 旧 schema 缺省精度
  secondSlot?: 'SU' | 'AL';
  air?: boolean; // 不列颠：airframes → fronts（raids / interceptions）
  containerUnits?: string[]; // 旧版写死的「展开下属」部队
  pocketShort?: [string, string]; // 包围圈短名替换（旧版写死的 replace）
  theatreGeo?: string[]; // 仅校验使用的战区 geojson（移到 pipeline/geo）
  dropPublic?: string[]; // 未被使用的公共文件（相对 public/）
}
const OPTS: Record<string, Opts> = {
  'crete-1941': { zoom: 'interp', precisionDefault: 'day', containerUnits: ['de.7air_crete', 'nz.2d_crete'], pocketShort: ['孤立空降群', '空降群'], theatreGeo: ['geo/crete1941.geojson'], dropPublic: ['geo/france1940.geojson', 'history/index.json'] },
  'balkans-1941': { zoom: 'raw', precisionDefault: 'day', pocketShort: ['孤立空降群', '空降群'], theatreGeo: ['geo/balkans1940.geojson'], dropPublic: ['geo/france1940.geojson', 'geo/poland1939.geojson'] },
  'france-1940': { zoom: 'index', theatreGeo: ['geo/france1940.geojson'] },
  'poland-1939': { zoom: 'index', theatreGeo: ['geo/poland1939.geojson'] },
  'norway-1940': { zoom: 'index', secondSlot: 'AL', theatreGeo: ['geo/norway1940.geojson'] },
  'britain-1940': { zoom: 'raw', air: true, theatreGeo: ['geo/britain1940.geojson', 'geo/countries1940.geojson', 'geo/country_labels.json', 'geo/credits.json'] },
};
const O = OPTS[id];
if (!O) throw new Error('未知战役 id：' + id);

// ---------- 规范化 ----------
const ZOOM_REL = [1, 1, 1.35, 1.9, 2.6, 3.4, 4.4, 5.6, 7];
const interp = (v: number) => {
  const z = Math.max(1, Math.min(8, v));
  const lo = Math.floor(z), hi = Math.ceil(z);
  return ZOOM_REL[lo] + (ZOOM_REL[hi] - ZOOM_REL[lo]) * (z - lo);
};
const round3 = (v: number) => Math.round(v * 1000) / 1000;

function event(e: Json): Json {
  const out: Json = { ...e };
  if (e.zoom !== undefined) {
    out.zoomRel = round3(O.zoom === 'raw' ? Math.max(1, Math.min(8, e.zoom)) : interp(e.zoom));
    if (e.zoom <= 1.5) out.wide = true;
  }
  delete out.zoom;
  const prec = e.precision ?? e.timePrecision ?? O.precisionDefault;
  delete out.timePrecision;
  if (prec && prec !== 'minute') out.precision = prec; else delete out.precision;
  return out;
}

function equipment(q: Json): Json {
  const out: Json = { ...q };
  const n = q.count ?? q.countCampaign ?? q.count1940 ?? q.count1939;
  delete out.count1939; delete out.count1940; delete out.countCampaign;
  if (n !== undefined) out.count = n;
  return out;
}

function place(p: Json): Json {
  const out: Json = { ...p };
  const c = p.country ?? p.country1940 ?? p.country1939;
  delete out.country1939; delete out.country1940;
  if (c !== undefined) out.country = c;
  return out;
}

const MODE: Record<string, string> = { land: 'land', naval: 'sea', sea: 'sea', air: 'air', rail: 'rail' };
function unit(u: Json): Json {
  const out: Json = { ...u, track: u.track.map((p: Json) => {
    const q: Json = { ...p };
    if (p.mode) { q.movement = MODE[p.mode]; delete q.mode; }
    return q;
  }) };
  if (O.containerUnits?.includes(u.id)) out.display = 'container';
  return out;
}

const KIND: Record<string, { movement: string; role?: string }> = {
  land: { movement: 'land' }, naval: { movement: 'sea' }, air: { movement: 'air' },
  evacuation: { movement: 'sea', role: 'evacuation' }, landing: { movement: 'sea', role: 'landing' },
};
function route(r: Json): Json {
  const out: Json = { ...r };
  if (r.kind) { Object.assign(out, KIND[r.kind] ?? {}); delete out.kind; }
  if (O.air && r.role) { out.movement = 'air'; out.fadeHours = r.fadeHours ?? 0.25; }
  if (out.movement === 'land') delete out.movement;
  return out;
}

function front(k: Json): Json {
  const control: Json = {};
  if (O.air) {
    if (k.raids?.length) control.raids = k.raids;
    if (k.interceptions?.length) control.interceptions = k.interceptions;
  } else {
    if (k.DE?.length) control.DE = k.DE;
    const second = O.secondSlot ?? 'SU';
    if (k[second]?.length) control[second] = k[second];
  }
  const out: Json = { at: k.at, control };
  if (k.transition) out.transition = k.transition;
  for (const key of ['note', 'sources', 'confidence']) if (k[key] !== undefined) out[key] = k[key];
  return out;
}

// ---------- 数据 ----------
const SD = join(L, 'src/data');
const D = join(C, 'data');
for (const f of ls(join(SD, 'gazetteer'))) write(join(D, 'gazetteer', f), read(join(SD, 'gazetteer', f)).map(place));
for (const f of ls(join(SD, 'oob'))) write(join(D, 'oob', f), read(join(SD, 'oob', f)).map(unit));
for (const f of ls(join(SD, 'routes'))) write(join(D, 'routes', f), read(join(SD, 'routes', f)).map(route));
for (const f of ls(join(SD, 'sources'))) write(join(D, 'sources', f), read(join(SD, 'sources', f)));
const whitelist: string[] = read(join(L, 'config/keyframes.json')).keyframes;
const frontDir = join(SD, O.air ? 'airframes' : 'fronts');
const frontFiles = ls(frontDir);
const ats = frontFiles.map((f) => read(join(frontDir, f)).at as string);
const missing = whitelist.filter((a) => !ats.includes(a)), extra = ats.filter((a) => !whitelist.includes(a));
if (missing.length || extra.length) throw new Error(`keyframes.json 与关键帧文件不一致：缺 ${missing} 多 ${extra}`);
for (const f of frontFiles) write(join(D, 'fronts', f), front(read(join(frontDir, f))));
write(join(D, 'events.json'), read(join(SD, 'events.json')).map(event));
write(join(D, 'equipment.json'), (existsSync(join(SD, 'equipment.json')) ? read(join(SD, 'equipment.json')) : []).map(equipment));
const pockets = (existsSync(join(SD, 'pockets.json')) ? read(join(SD, 'pockets.json')) : []).map((p: Json) => {
  if (O.pocketShort && p.name.zh.includes(O.pocketShort[0])) return { ...p, name: { ...p.name, short: p.name.zh.replace(O.pocketShort[0], O.pocketShort[1]) } };
  return p;
});
write(join(D, 'pockets.json'), pockets);
write(join(D, 'demarcation.json'), (existsSync(join(SD, 'demarcation.json')) ? read(join(SD, 'demarcation.json')) : []).map((d: Json) => (d.id.includes('0928') ? { ...d, style: 'final' } : d)));
write(join(D, 'forces.json'), read(join(SD, 'forces_summary.json')));
if (existsSync(join(SD, 'airspace.json'))) {
  // 不列颠：空域分区与雷达 → 通用叠加层
  const a = read(join(SD, 'airspace.json'));
  const overlays = [
    ...(a.groups ?? []).map((g: Json) => ({ id: `ov.${g.id}`, layer: 'demarcation', kind: 'polygon', label: g.label, polygons: g.polygons, style: 'sector' })),
    ...(a.radar ?? []).map((r: Json) => ({ id: `ov.${r.id}`, layer: 'radar', kind: 'range', label: r.label, pos: r.pos, rangeKm: r.rangeKm, style: 'radar' })),
  ];
  write(join(D, 'overlays.json'), overlays);
}
if (existsSync(join(SD, 'fragments'))) cpSync(join(SD, 'fragments'), join(C, 'pipeline/fragments'), { recursive: true });

// ---------- 配置 ----------
mkdirSync(join(C, 'config'), { recursive: true });
cpSync(join(L, 'config/frame.json'), join(C, 'config/frame.json'));
cpSync(join(L, 'config/lod.json'), join(C, 'config/lod.json'));
if (existsSync(join(L, 'config/palette.json'))) cpSync(join(L, 'config/palette.json'), join(C, 'pipeline/geo/palette.json'));
if (existsSync(join(L, 'config/scenario.json'))) cpSync(join(L, 'config/scenario.json'), join(C, 'pipeline/legacy-scenario.json'));

// ---------- 公共资源 ----------
const SHARED = new Set(['fonts', 'audio/sfx.webm', 'audio/sfx.m4a', 'audio/sfx.json', 'audio/music', 'audio/music.json', 'tiles/overview.webp']);
const theatre = new Set(O.theatreGeo ?? []);
const drop = new Set(O.dropPublic ?? []);
const PUB = join(L, 'public');
function copyPublic(rel: string) {
  const src = join(PUB, rel);
  if (SHARED.has(rel) || drop.has(rel)) return;
  if (theatre.has(rel)) { cpSync(src, join(C, 'pipeline/geo', basename(rel))); return; }
  if (statSync(src).isDirectory()) { for (const f of readdirSync(src)) if (f !== '.DS_Store') copyPublic(rel ? `${rel}/${f}` : f); return; }
  mkdirSync(dirname(join(P, rel)), { recursive: true });
  cpSync(src, join(P, rel));
}
for (const f of readdirSync(PUB)) if (f !== '.DS_Store') copyPublic(f);

// ---------- 管线脚本、文档、测试 ----------
const tracked = (rel: string) => existsSync(join(L, rel));
if (tracked('scripts')) cpSync(join(L, 'scripts'), join(C, 'pipeline/scripts'), {
  recursive: true,
  filter: (s) => !/\/(\.cache|__pycache__)(\/|$)|\.DS_Store$|\.pyc$/.test(s),
});
if (tracked('docs')) cpSync(join(L, 'docs'), join(C, 'docs'), { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
if (tracked('research')) cpSync(join(L, 'research'), join(C, 'docs/research'), { recursive: true });
for (const f of ['README.md', 'LICENSES.md']) if (tracked(f)) cpSync(join(L, f), join(C, 'docs', f === 'README.md' ? 'LEGACY-README.md' : f));
if (tracked('tests')) cpSync(join(L, 'tests'), join(C, 'pipeline/legacy-tests'), { recursive: true });

console.log(`迁移完成：${legacyArg} → campaigns/${id}（数据）+ public/campaigns/${id}（资源）`);
