// 生成 config/frame.json —— 全项目唯一的投影/画布真源（Python 与 TS 共用）
// 运行：node scripts/frame/emit_frame.mjs
import { geoConicConformal } from 'd3-geo';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../config/frame.json');

// 战区底图向南覆盖法国。投影仍以原战区适配，已有机场、航线与动态场的
// 世界坐标不能因新增底图覆盖而移动；只增长画布高度。
const bbox = [-8.5, 44.0, 11.0, 60.5]; // [west, south, east, north]
const projectionFitBbox = [-8.5, 48.0, 11.0, 60.5];
const parallels = [50.0, 58.0];
const centralLon = (projectionFitBbox[0] + projectionFitBbox[2]) / 2;
const centralLat = (projectionFitBbox[1] + projectionFitBbox[3]) / 2;
const rotate = [-centralLon, 0];
const center = [0, centralLat];
const WIDTH = 8192; // 世界单位 = 最高级瓦片像素

// 原战区边界采样只用于稳定 fitWidth；扩展边界只用于求南端高度。
const N = 64;
function boundary(b) {
  const ring = [];
  for (let i = 0; i <= N; i++) ring.push([b[0] + ((b[2] - b[0]) * i) / N, b[1]]);
  for (let i = 0; i <= N; i++) ring.push([b[2], b[1] + ((b[3] - b[1]) * i) / N]);
  for (let i = 0; i <= N; i++) ring.push([b[2] - ((b[2] - b[0]) * i) / N, b[3]]);
  for (let i = 0; i <= N; i++) ring.push([b[0], b[3] - ((b[3] - b[1]) * i) / N]);
  return ring;
}
const feature = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: boundary(projectionFitBbox) }, properties: {} };

const proj = geoConicConformal().parallels(parallels).rotate(rotate).center(center).precision(0);
proj.fitWidth(WIDTH, feature);
// 计算高度
let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
for (const p of boundary(bbox)) {
  const [x, y] = proj(p);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
// 南部经度角点可超出固定宽度；实际资产覆盖同一连续投影矩形。
const HEIGHT = Math.ceil(maxY);
const scale = proj.scale();
const translate = proj.translate();

// km/世界单位：用中心纬度附近 1° 经度测算
const a = proj([centralLon, centralLat]);
const b = proj([centralLon, centralLat + 1]);
const kmPerUnit = 111.19 / Math.hypot(b[0] - a[0], b[1] - a[1]);

const frame = {
  _doc: '由 scripts/frame/emit_frame.mjs 生成，勿手改。d3.geoConicConformal().parallels(parallels).rotate(rotate).center(center).scale(scale).translate(translate)。世界坐标单位=像素@最高级瓦片(宽 width)。',
  projection: { type: 'conicConformal', parallels, rotate, center },
  bbox,
  projectionFitBbox,
  coverageNote: 'Fixed world origin and width from projectionFitBbox; height extends south to 44N. Actual raster rectangle is [0,0,width,height]; source geography/DEM cover all inverse-projected canvas edges.',
  width: WIDTH,
  height: HEIGHT,
  scale,
  translate,
  kmPerUnit,
  tiles: { size: 512, levels: [1024, 2048, 4096, 8192], format: 'webp', path: 'tiles/base/{z}/{x}_{y}.webp' },
  field: { cell: 16, w: Math.ceil(WIDTH / 16), h: Math.ceil(HEIGHT / 16), clampKm: 60 },
  extentCheck: { minX, maxX, minY, maxY },
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(frame, null, 2));
console.log('frame.json written', { WIDTH, HEIGHT, scale, translate, kmPerUnit, minX, maxX, minY, maxY });
