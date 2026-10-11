// 生成 campaigns/<id>/config/frame.json —— 战役唯一的投影/画布真源（浏览器、Node 工具与 Python 管线共用）
//   node tools/geo/emit_frame.mjs <campaignId> [--out path] [--check]
// 参数来自 campaigns/<id>/config/geo.config.json 的 frame 段：
//   bbox [w,s,e,n]（底图覆盖范围）、fitBbox?（只用于 fitWidth 的范围，缺省 = bbox；用于扩展画布高度而不移动既有坐标）、
//   parallels、rotate、center（d3.geoConicConformal 参数）、width（世界单位 = 最高级瓦片像素）、
//   tileLevels、fieldCell、clampKm、kmProbe?（测 km/单位 的经纬度，缺省 [-rotate[0], center[1]]）、extra?（原样写入的附加字段）
import { geoConicConformal } from 'd3-geo';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const id = process.argv[2];
if (!id) { console.error('用法：node tools/geo/emit_frame.mjs <campaignId> [--out path] [--check]'); process.exit(2); }
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const dir = resolve(ROOT, 'campaigns', id, 'config');
const C = JSON.parse(readFileSync(resolve(dir, 'geo.config.json'), 'utf8')).frame;
const { bbox, parallels, rotate, center } = C;
const fitBbox = C.fitBbox ?? bbox;
const WIDTH = C.width ?? 8192;
const cell = C.fieldCell ?? 16;

const N = 64;
function boundary(b) {
  const ring = [];
  for (let i = 0; i <= N; i++) ring.push([b[0] + ((b[2] - b[0]) * i) / N, b[1]]);
  for (let i = 0; i <= N; i++) ring.push([b[2], b[1] + ((b[3] - b[1]) * i) / N]);
  for (let i = 0; i <= N; i++) ring.push([b[2] - ((b[2] - b[0]) * i) / N, b[3]]);
  for (let i = 0; i <= N; i++) ring.push([b[0], b[3] - ((b[3] - b[1]) * i) / N]);
  return ring;
}
const proj = geoConicConformal().parallels(parallels).rotate(rotate).center(center).precision(0);
proj.fitWidth(WIDTH, { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: boundary(fitBbox) }, properties: {} });
let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
for (const p of boundary(bbox)) {
  const [x, y] = proj(p);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const HEIGHT = Math.ceil(maxY);
const probe = C.kmProbe ?? [-rotate[0], center[1]];
const a = proj(probe), b = proj([probe[0], probe[1] + 1]);
const kmPerUnit = 111.19 / Math.hypot(b[0] - a[0], b[1] - a[1]);

const frame = {
  _doc: '由 tools/geo/emit_frame.mjs 根据 config/geo.config.json 生成，勿手改。d3.geoConicConformal().parallels(parallels).rotate(rotate).center(center).scale(scale).translate(translate)。世界坐标单位=像素@最高级瓦片(宽 width)。',
  projection: { type: 'conicConformal', parallels, rotate, center },
  bbox,
  ...(C.fitBbox ? { projectionFitBbox: C.fitBbox } : {}),
  ...(C.extra ?? {}),
  width: WIDTH,
  height: HEIGHT,
  scale: proj.scale(),
  translate: proj.translate(),
  kmPerUnit,
  tiles: { size: 512, levels: C.tileLevels ?? [1024, 2048, 4096, 8192].filter((l) => l <= WIDTH), format: 'webp', path: 'tiles/base/{z}/{x}_{y}.webp' },
  field: { cell, w: Math.ceil(WIDTH / cell), h: Math.ceil(HEIGHT / cell), clampKm: C.clampKm ?? 60 },
  extentCheck: { minX, maxX, minY, maxY },
};
const out = arg('--out') ?? resolve(dir, 'frame.json');
if (process.argv.includes('--check')) {
  const cur = JSON.parse(readFileSync(resolve(dir, 'frame.json'), 'utf8'));
  const strip = (f) => { const { _doc, ...rest } = f; void _doc; return rest; };
  const same = isDeepStrictEqual(JSON.parse(JSON.stringify(strip(frame))), strip(cur));
  console.log(`${same ? '✓' : '✗'} ${id}: frame.json ${same ? '与配置重算结果一致' : '与配置重算结果不同'}`);
  if (!same) for (const k of Object.keys({ ...strip(frame), ...strip(cur) })) if (!isDeepStrictEqual(JSON.parse(JSON.stringify(frame[k] ?? null)), cur[k] ?? null)) console.log('   ', k, JSON.stringify(cur[k]), '→', JSON.stringify(frame[k]));
  process.exit(same ? 0 : 1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(frame, null, 2));
console.log(`${out}：${WIDTH}×${HEIGHT}，${kmPerUnit.toFixed(4)} km/单位，场 ${frame.field.w}×${frame.field.h}`);
