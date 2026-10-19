/** 只读复核：使用浏览器同一 SDF 算法，对重要史实位置做独立抽样。
 * npx tsx campaigns/leningrad-1941/pipeline/geo/sample_control.ts
 * 小岛与小于一格的阵地以原始多边形和文字事件为准；本脚本另列岛屿精度，避免将平滑采样误读为史实控制。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCampaign, publicDir } from '../../../../tools/lib/campaign-node';
import { buildDB } from '../../../../engine/data/db';
import { createModel, fieldAt, sample, theaterAt, type KFInput } from '../../../../engine/geo/field/field';
import { fieldCfg, toGrid } from '../../../../engine/geo/field/client';
import { FRAME, GRID } from '../../../../engine/geo/frame';
import { isoToHours } from '../../../../engine/core/time';

const def = loadCampaign('leningrad-1941');
const db = buildDB(def.data, def.manifest);
const masks = new Uint8Array(readFileSync(join(publicDir('leningrad-1941'), 'geo/field_masks.bin')));
const grid = { w: GRID.w, h: GRID.h, cell: GRID.cell };
const kfs: KFInput[] = db.keyframes.map((k) => ({
  h: k.h,
  a: k.a.map((poly) => poly.map((ring) => ring.map(toGrid))),
  b: k.b.map((poly) => poly.map((ring) => ring.map(toGrid))),
  ...(k.transition ? { transition: k.transition } : {}),
}));
const model = createModel(grid, masks, kfs,
  Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)), fieldCfg(def.manifest.control));
type Holder = 'DE' | 'FI' | 'SU' | 'out';
const pairs = new Map<number, [Float32Array, Float32Array]>();
function result(id: string, at: string | number) {
  const h = typeof at === 'number' ? at : isoToHours(at);
  const p = db.gaz.get(id);
  if (!p) throw new Error(`缺少地名 ${id}`);
  const [x, y] = toGrid(p.pos);
  let fields = pairs.get(h);
  if (!fields) { fields = [fieldAt(model, h, 0), fieldAt(model, h, 1)]; pairs.set(h, fields); }
  const theatre = sample(theaterAt(model, h), grid, x, y);
  const de = sample(fields[0], grid, x, y), fi = sample(fields[1], grid, x, y);
  const holder: Holder = theatre >= 0 ? 'out' : de < 0 ? 'DE' : fi < 0 ? 'FI' : 'SU';
  return { id, at, holder, de: +de.toFixed(2), fi: +fi.toFixed(2), theatre: +theatre.toFixed(2),
    landMask: masks[Math.floor(y) * grid.w + Math.floor(x)] };
}

const probes: [string, string, Holder][] = [
  ['riga', '1941-06-22T00:00', 'SU'], ['riga', '1941-07-02T12:00', 'DE'],
  ['kaunas', '1941-06-26T12:00', 'DE'], ['dvinsk', '1941-06-26T12:00', 'DE'],
  ['pskov', '1941-07-10T15:00', 'DE'], ['tallinn', '1941-08-29T12:00', 'DE'],
  ['luga', '1941-08-24T12:00', 'DE'], ['vyborg', '1941-09-01T00:00', 'FI'],
  ['shlisselburg', '1941-09-08T18:00', 'DE'], ['shlisselburg', '1943-01-18T12:00', 'SU'],
  ['rabochiy_5', '1943-01-18T12:00', 'SU'], ['sinyavino_43_3', '1943-09-18T12:00', 'SU'],
  ['sinyavino_50_1', '1943-09-18T12:00', 'DE'], ['tikhvin', '1941-11-10T18:00', 'DE'],
  ['tikhvin', '1941-12-12T12:00', 'SU'], ['kingisepp', '1944-01-31T20:00', 'DE'],
  ['batetskiy', '1944-01-31T20:00', 'DE'], ['volosovo', '1944-01-25T18:00', 'DE'],
  ['volosovo', '1944-01-27T12:00', 'SU'],
];
let failures = 0;
for (const [id, at, expected] of probes) {
  const actual = result(id, at);
  if (actual.holder !== expected) failures++;
  console.log(JSON.stringify({ ...actual, expected, pass: actual.holder === expected }));
}
const constantFailures: unknown[] = [];
for (const kf of db.keyframes) for (const id of ['leningrad', 'oranienbaum']) {
  const actual = result(id, kf.h);
  if (actual.holder !== 'SU') constantFailures.push(actual);
}
console.log(JSON.stringify({ constantCities: ['leningrad', 'oranienbaum'], keyframes: db.keyframes.length, failures: constantFailures }));
for (const at of ['1941-09-12T18:00', '1943-01-11T18:00', '1943-01-18T12:00'])
  console.log(JSON.stringify({ islandPrecision: result('oreshek', at),
    caveat: '小岛无陆地格；平滑采样不能判断守城史。原始几何洞与事件为准。' }));
console.log(JSON.stringify({ failures: failures + constantFailures.length, checked: probes.length + db.keyframes.length * 2 }));
process.exitCode = failures + constantFailures.length ? 1 : 0;
