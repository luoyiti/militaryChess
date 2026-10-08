// 用 d3-geo（与前端完全相同的投影）把 .work/a/ll/*.geojson 逐点投影到世界坐标 → .work/a/xy/*.geojson
// 再由 run_all.sh 调 mapshaper 合并、量化为 public/geo/vectors.topo.json
import { geoConicConformal } from 'd3-geo';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const F = JSON.parse(readFileSync(resolve(ROOT, 'config/frame.json'), 'utf8'));
const proj = geoConicConformal().parallels(F.projection.parallels).rotate(F.projection.rotate).center(F.projection.center).scale(F.scale).translate(F.translate);
const LL = resolve(ROOT, '.work/a/ll'), XY = resolve(ROOT, '.work/a/xy');
mkdirSync(XY, { recursive: true });
const r2 = (v) => Math.round(v * 100) / 100;
const walk = (c) => (typeof c[0] === 'number' ? proj(c).map(r2) : c.map(walk));
for (const name of ['land', 'land_render', 'countries1939', 'rivers', 'lakes', 'marsh', 'forest']) {
  const fc = JSON.parse(readFileSync(resolve(LL, name + '.geojson'), 'utf8'));
  for (const f of fc.features) f.geometry.coordinates = walk(f.geometry.coordinates);
  writeFileSync(resolve(XY, name + '.geojson'), JSON.stringify(fc));
  console.log('[project]', name, fc.features.length);
}
