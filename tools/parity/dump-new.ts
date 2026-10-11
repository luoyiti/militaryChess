/**
 * 用统一引擎的代码导出战役包的确定性状态，格式与 dump-legacy.ts 相同，供 compare.ts 对比。
 *   npx tsx tools/parity/dump-new.ts <campaignId> <legacyState.json> <out.json>
 * 采样时刻取自旧版导出（同一组 ISO 时刻）。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadCampaign, publicDir } from '../lib/campaign-node';
import { buildDB } from '../../engine/data/db';
import { unitStateAt, routeProgress } from '../../engine/model/core';
import { isoToHours } from '../../engine/core/time';
import { project, GRID, FRAME } from '../../engine/geo/frame';
import { createModel, frontGeometry, type KFInput } from '../../engine/geo/field/field';
import { fieldCfg } from '../../engine/geo/field/client';
import { summarizeGeometry, roundState } from './common';

const [id, legacyPath, outPath] = process.argv.slice(2);
if (!id || !legacyPath || !outPath) throw new Error('usage: dump-new.ts <campaignId> <legacyState.json> <out.json>');
const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
const c = loadCampaign(id);
const db = buildDB(c.data, c.manifest);

const isos = Object.keys(legacy.states);
const ids = [...db.units.keys()].sort();
const states: Record<string, Record<string, unknown>> = {};
for (const iso of isos) {
  const h = isoToHours(iso);
  const row: Record<string, unknown> = {};
  for (const uid of ids) { const s = unitStateAt(uid, db.units, h); if (s) row[uid] = roundState(s); }
  states[iso] = row;
}
const routes: Record<string, Record<string, unknown>> = {};
for (const iso of isos) {
  const h = isoToHours(iso);
  const row: Record<string, unknown> = {};
  for (const r of db.routes) { const p = routeProgress(r, h); if (p.length) row[r.id] = [p.length, ...p[p.length - 1].map((v) => Math.round(v * 1e5) / 1e5)]; }
  routes[iso] = row;
}

const toG = (ll: readonly number[]) => { const [x, y] = project(ll); return [x / GRID.cell, y / GRID.cell]; };
const kfs: KFInput[] = db.keyframes.map((k) => ({
  h: k.h,
  a: k.a.map((poly) => poly.map((ring) => ring.map(toG))),
  b: k.b.map((poly) => poly.map((ring) => ring.map(toG))),
  ...(k.transition ? { transition: k.transition } : {}),
}));
const buf = readFileSync(resolve(publicDir(id), 'geo/field_masks.bin'));
const masks = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
const clamp = Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell));
const model = createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, masks, kfs, clamp, fieldCfg(c.manifest.control));
const geometry: Record<string, unknown> = {};
for (const iso of Object.keys(legacy.geometry)) {
  const g = frontGeometry(model, isoToHours(iso));
  geometry[iso] = summarizeGeometry({ fillA: g.fills.a, fillB: g.fills.b, fillRest: g.fills.rest, frontA: g.fronts.a, frontB: g.fronts.b, contact: g.fronts.contact });
}

const out = {
  campaign: id,
  counts: {
    places: db.gaz.size, units: db.units.size, routes: db.routes.length, events: db.events.length, pockets: db.pockets.length,
    demarcation: db.demarcation.length, equipment: db.equipment.size, sources: [...db.sources.keys()].length, keyframes: db.keyframes.length,
  },
  events: db.events.map((e) => ({ id: e.id, at: e.at, ll: e.ll.map((v) => Math.round(v * 1e6) / 1e6), zoomRel: e.zoomRel ?? null, wide: !!e.wide, importance: e.importance })),
  keyframes: db.keyframes.map((k) => k.at),
  states, routes, geometry,
};
mkdirSync(dirname(resolve(outPath)), { recursive: true });
writeFileSync(resolve(outPath), JSON.stringify(out));
console.log(`${id}: ${ids.length} units × ${isos.length} times, ${Object.keys(geometry).length} geometry samples`);
