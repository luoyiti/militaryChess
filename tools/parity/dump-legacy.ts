/**
 * Dump the deterministic state of a LEGACY fork using that fork's own model/field code.
 * Run with the fork's tsx so its node_modules resolve:
 *   <fork>/node_modules/.bin/tsx tools/parity/dump-legacy.ts <forkDir> <out.json>
 * Output keys are absolute ISO minutes (not hours), so they compare across epochs.
 *
 * 旧版分叉目录已在 M6 删除；baseline 已导出在 .baselines/<fork>/state.json（npm run parity 直接使用）。
 * 如需重新导出旧版状态，先从标签 pre-merge 取回旧代码：
 *   git worktree add ../war-room-legacy pre-merge && (cd ../war-room-legacy/<fork> && npm ci)
 *   ../war-room-legacy/<fork>/node_modules/.bin/tsx tools/parity/dump-legacy.ts ../war-room-legacy/<fork> <out.json>
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarizeGeometry, roundState, isoFromMs, sampleIsos } from './common';

const [forkArg, outArg] = process.argv.slice(2);
if (!forkArg || !outArg) throw new Error('usage: dump-legacy.ts <forkDir> <out.json>');
const FORK = resolve(forkArg);
const imp = (rel: string) => import(pathToFileURL(resolve(FORK, rel)).href);
const json = (rel: string, fb?: unknown) => {
  const p = resolve(FORK, rel);
  if (!existsSync(p)) { if (fb !== undefined) return fb; throw new Error('missing ' + rel); }
  return JSON.parse(readFileSync(p, 'utf8'));
};
const dirJson = (rel: string): { file: string; data: any }[] => {
  const p = resolve(FORK, rel);
  if (!existsSync(p)) return [];
  return readdirSync(p).filter((f) => f.endsWith('.json')).sort().map((f) => ({ file: f, data: json(`${rel}/${f}`) }));
};

const { geoConicConformal } = await imp('node_modules/d3-geo/src/index.js');
const schema = await imp('src/schema/index.ts');
const core = await imp('src/model/core.ts');
const field = await imp('src/geo/field/field.ts');
const isoToHours: (s: string) => number = schema.isoToHours;

const frame = json('config/frame.json');
const kfWhitelist: string[] = json('config/keyframes.json').keyframes;
const gazLists = dirJson('src/data/gazetteer').map((x) => x.data);
const { gaz } = core.buildGazetteer(...gazLists);
const unitsRaw = dirJson('src/data/oob').flatMap((x) => x.data);
const units: Map<string, any> = core.resolveUnits(unitsRaw, gaz);
// 与旧版 db.ts 一致：子单位按梯队与 id 排序（影响上级单位的朝向取值）
for (const u of units.values()) {
  u.children.sort((a: string, b: string) => {
    const ua = units.get(a), ub = units.get(b);
    return schema.ECHELON_RANK[ua.echelon] - schema.ECHELON_RANK[ub.echelon] || ua.id.localeCompare(ub.id, 'en', { numeric: true });
  });
}
const routes = core.resolveRoutes(dirJson('src/data/routes').flatMap((x) => x.data), gaz);
const events: any[] = json('src/data/events.json', []);
const pockets: any[] = json('src/data/pockets.json', []);
const demarcation: any[] = json('src/data/demarcation.json', []);
const equipment: any[] = json('src/data/equipment.json', []);
const sources = dirJson('src/data/sources').flatMap((x) => x.data);
const airMode = dirJson('src/data/airframes').length > 0;
const frontFiles = (airMode ? dirJson('src/data/airframes') : dirJson('src/data/fronts')).map((x) => x.data).filter((k) => kfWhitelist.includes(k.at));
frontFiles.sort((a, b) => isoToHours(a.at) - isoToHours(b.at));

// epoch in ms such that iso(h) = epoch + h*3600e3
const refIso = frontFiles[0]?.at ?? events[0].at;
const epochMs = Date.parse(refIso + ':00Z') - isoToHours(refIso) * 3_600_000;
const H = (iso: string) => isoToHours(iso);

// ---------- sample times ----------
const kfIsos = frontFiles.map((k) => k.at as string);
const evIsos = events.map((e) => e.at as string);
const allIsos = [...kfIsos, ...evIsos].sort();
const isos = sampleIsos(kfIsos, allIsos[0], allIsos[allIsos.length - 1], 48);

// ---------- unit states ----------
const ids = [...units.keys()].sort();
const states: Record<string, Record<string, unknown>> = {};
for (const iso of isos) {
  const h = H(iso);
  const row: Record<string, unknown> = {};
  for (const id of ids) {
    const s = core.unitStateAt(id, units, h);
    if (s) row[id] = roundState(s);
  }
  states[iso] = row;
}

// ---------- routes ----------
const routeProg: Record<string, Record<string, unknown>> = {};
for (const iso of isos) {
  const h = H(iso);
  const row: Record<string, unknown> = {};
  for (const r of routes) {
    const p = core.routeProgress(r, h);
    if (p.length) row[r.id] = [p.length, ...p[p.length - 1].map((v: number) => Math.round(v * 1e5) / 1e5)];
  }
  routeProg[iso] = row;
}

// ---------- field geometry ----------
const proj = geoConicConformal().parallels(frame.projection.parallels).rotate(frame.projection.rotate)
  .center(frame.projection.center).scale(frame.scale).translate(frame.translate).precision(0.1);
const grid = { w: frame.field.w, h: frame.field.h, cell: frame.field.cell };
const toG = (p: unknown) => { const [x, y] = proj(core.resolvePos(p, gaz))!; return [x / grid.cell, y / grid.cell]; };
const conv = (polys: any[]) => polys.map((poly: any) => poly.map((ring: any) => ring.map(toG)));
const masksBuf = readFileSync(resolve(FORK, 'public/geo/field_masks.bin'));
const masks = new Uint8Array(masksBuf.buffer, masksBuf.byteOffset, masksBuf.byteLength);
const clamp = Math.ceil(frame.field.clampKm / (frame.kmPerUnit * grid.cell));
const secondKey = frontFiles.some((k) => 'AL' in k) ? 'AL' : 'SU';
let model: any;
if (airMode) {
  model = field.createAirModel(grid, masks, frontFiles.map((k) => ({ h: H(k.at), raids: conv(k.raids ?? []), interceptions: conv(k.interceptions ?? []) })), clamp);
} else {
  const kfs = frontFiles.map((k) => ({ h: H(k.at), DE: conv(k.DE ?? []), [secondKey]: conv(k[secondKey] ?? []), ...(k.transition ? { transition: k.transition } : {}) }));
  const isBalkans = FORK.includes('Balkans');
  model = isBalkans ? field.createModel(grid, masks, kfs, clamp, H('1941-04-06T00:00')) : field.createModel(grid, masks, kfs, clamp);
}
const geoIsos: string[] = [];
for (let i = 0; i < kfIsos.length; i++) {
  geoIsos.push(kfIsos[i]);
  if (i + 1 < kfIsos.length) geoIsos.push(isoFromMs((Date.parse(kfIsos[i] + ':00Z') + Date.parse(kfIsos[i + 1] + ':00Z')) / 2));
}
const geometry: Record<string, unknown> = {};
for (const iso of geoIsos) {
  const g = field.frontGeometry(model, H(iso));
  const fills = g.fills, fronts = g.fronts;
  const second = fills.SU ?? fills.AL;
  geometry[iso] = summarizeGeometry({
    fillA: fills.DE, fillB: second, fillRest: fills.PL ?? fills.NO ?? [],
    frontA: fronts.DE, frontB: fronts.SU ?? fronts.AL, contact: fronts.contact,
  });
}

const out = {
  fork: FORK.split('/').pop(),
  epochIso: isoFromMs(epochMs),
  counts: {
    places: gaz.size, units: units.size, routes: routes.length, events: events.length, pockets: pockets.length,
    demarcation: demarcation.length, equipment: equipment.length, sources: sources.length, keyframes: frontFiles.length,
  },
  events: events.map((e) => ({ id: e.id, at: e.at, ll: core.resolvePos(e.place, gaz).map((v: number) => Math.round(v * 1e6) / 1e6), zoom: e.zoom ?? null, importance: e.importance })),
  keyframes: kfIsos,
  states,
  routes: routeProg,
  geometry,
};
mkdirSync(dirname(resolve(outArg)), { recursive: true });
writeFileSync(resolve(outArg), JSON.stringify(out));
console.log(`${out.fork}: ${ids.length} units × ${isos.length} times, ${geoIsos.length} geometry samples, air=${airMode}`);
