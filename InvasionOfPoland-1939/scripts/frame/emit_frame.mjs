// 生成 config/frame.json —— 全项目唯一的投影/画布真源（Python 与 TS 共用）
// 运行：node scripts/frame/emit_frame.mjs
import { geoConicConformal } from 'd3-geo';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../config/frame.json');

// 地图范围（经纬度）：覆盖德国东部、东普鲁士、立陶宛南部、白俄罗斯西部、罗马尼亚北部
const bbox = [13.0, 47.3, 29.5, 56.6]; // [west, south, east, north]
const parallels = [49.5, 55.0];
const rotate = [-21.25, 0];
const center = [0, 52.0];
const WIDTH = 8192; // 世界单位 = 最高级瓦片像素

// 用 bbox 边界采样点做 fitWidth，保证整个经纬度矩形落入画布
const ring = [];
const N = 64;
for (let i = 0; i <= N; i++) ring.push([bbox[0] + ((bbox[2] - bbox[0]) * i) / N, bbox[1]]);
for (let i = 0; i <= N; i++) ring.push([bbox[2], bbox[1] + ((bbox[3] - bbox[1]) * i) / N]);
for (let i = 0; i <= N; i++) ring.push([bbox[2] - ((bbox[2] - bbox[0]) * i) / N, bbox[3]]);
for (let i = 0; i <= N; i++) ring.push([bbox[0], bbox[3] - ((bbox[3] - bbox[1]) * i) / N]);
const feature = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: ring }, properties: {} };

const proj = geoConicConformal().parallels(parallels).rotate(rotate).center(center).precision(0);
proj.fitWidth(WIDTH, feature);
// 计算高度
let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
for (const p of ring) {
  const [x, y] = proj(p);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
// fitWidth 会让 minX≈0, maxX≈WIDTH，minY≈0
const HEIGHT = Math.ceil(maxY);
const scale = proj.scale();
const translate = proj.translate();

// km/世界单位：用中心纬度附近 1° 经度测算
const a = proj([21.25, 52]);
const b = proj([21.25, 53]);
const kmPerUnit = 111.19 / Math.hypot(b[0] - a[0], b[1] - a[1]);

const frame = {
  _doc: '由 scripts/frame/emit_frame.mjs 生成，勿手改。d3.geoConicConformal().parallels(parallels).rotate(rotate).center(center).scale(scale).translate(translate)。世界坐标单位=像素@最高级瓦片(宽 width)。',
  projection: { type: 'conicConformal', parallels, rotate, center },
  bbox,
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
