/** 用真实 SDF 场查询某地某时的控制方：npx tsx campaigns/barbarossa-1941/pipeline/fronts/probe.ts "lon,lat|@id" ISO [...] */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCampaign, publicDir } from '../../../../tools/lib/campaign-node';
import { buildDB } from '../../../../engine/data/db';
import { createModel, fieldAt, theaterAt, sample, type KFInput } from '../../../../engine/geo/field/field';
import { fieldCfg, toGrid } from '../../../../engine/geo/field/client';
import { resolvePos } from '../../../../engine/model/core';
import { isoToHours } from '../../../../engine/core/time';
import { FRAME, GRID } from '../../../../engine/geo/frame';

const def = loadCampaign('barbarossa-1941');
const db = buildDB(def.data, def.manifest);
const buf = readFileSync(join(publicDir('barbarossa-1941'), 'geo/field_masks.bin'));
const kfs: KFInput[] = db.keyframes.map((k) => ({
  h: k.h,
  a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
  b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
  ...(k.transition ? { transition: k.transition } : {}),
}));
const model = createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), kfs,
  Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)), fieldCfg(def.manifest.control));
const g = { w: GRID.w, h: GRID.h, cell: GRID.cell };
const km = FRAME.kmPerUnit * GRID.cell;
const argv = process.argv.slice(2);
const args = argv.filter((a) => a !== "--pockets");
for (let i = 0; i + 1 < args.length; i += 2) {
  const p = args[i], at = args[i + 1];
  const ll = p.startsWith('@') ? resolvePos(p, db.gaz) : (p.split(',').map(Number) as [number, number]);
  const h = isoToHours(at);
  const [gx, gy] = toGrid(ll);
  const de = sample(fieldAt(model, h, 0), g, gx, gy), fi = sample(fieldAt(model, h, 1), g, gx, gy), th = sample(theaterAt(model, h), g, gx, gy);
  const who = de < 0 && th < 0 ? 'DE' : fi < 0 && th < 0 ? 'FI' : th < 0 ? 'SU' : 'out';
  console.log(`${p} ${at} → ${who}  (de ${(de * km).toFixed(1)}km fi ${(fi * km).toFixed(1)}km th ${(th * km).toFixed(1)}km) ll=${ll}`);
}

// --pockets：与 tests/campaign.test.ts 相同的包围圈锚点检查（列出全部不合格项）
if (argv.includes("--pockets")) {
  const H_END = isoToHours(def.manifest.time.end);
  const hold = (ll: [number, number], h: number) => {
    const [gx, gy] = toGrid(ll);
    const de = sample(fieldAt(model, h, 0), g, gx, gy), fi = sample(fieldAt(model, h, 1), g, gx, gy), th = sample(theaterAt(model, h), g, gx, gy);
    return de < 0 && th < 0 ? 'DE' : fi < 0 && th < 0 ? 'FI' : th < 0 ? 'SU' : 'out';
  };
  for (const p of (def.data['./data/pockets.json'] ?? []) as { id: string; start: string; end: string; anchor: string | [number, number]; fate: string }[]) {
    const a = isoToHours(p.start), b = isoToHours(p.end);
    const ll = resolvePos(p.anchor as never, db.gaz) as [number, number];
    const mid = isoToHours(new Date(Date.UTC(1941, 5, 22) + ((a + b) / 2) * 3600e3).toISOString().slice(0, 16));
    const m = hold(ll, mid);
    let after = '-';
    if (['surrendered', 'destroyed'].includes(p.fate) && b + 72 <= H_END) after = hold(ll, isoToHours(new Date(Date.UTC(1941, 5, 22) + (b + 72) * 3600e3).toISOString().slice(0, 16)));
    const ok = m === 'SU' && (after === '-' || after === 'DE' || after === 'FI');
    console.log(`${ok ? 'ok ' : 'BAD'} ${p.id.padEnd(20)} mid=${m} after=${after} ll=${ll}`);
  }
}
