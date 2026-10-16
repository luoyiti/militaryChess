// d3-geo（与浏览器完全相同的投影）把 .work/geo/<id>/ll/*.geojson 逐点投影到世界坐标 → .work/geo/<id>/xy/，
// 再用 mapshaper 合并、化简、量化为 public/campaigns/<id>/geo/vectors.topo.json。
//   node tools/geo/project.mjs <campaignId>
import { geoConicConformal } from 'd3-geo';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mapshaper from 'mapshaper';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const id = process.argv[2];
const F = JSON.parse(readFileSync(resolve(ROOT, 'campaigns', id, 'config/frame.json'), 'utf8'));
const proj = geoConicConformal().parallels(F.projection.parallels).rotate(F.projection.rotate).center(F.projection.center).scale(F.scale).translate(F.translate);
const LL = resolve(ROOT, '.work/geo', id, 'll'), XY = resolve(ROOT, '.work/geo', id, 'xy');
mkdirSync(XY, { recursive: true });
const r2 = (v) => Math.round(v * 100) / 100;
const walk = (c) => (typeof c[0] === 'number' ? proj(c).map(r2) : c.map(walk));
const layers = ['land', 'countries1939', 'rivers', 'lakes', 'marsh', 'forest'];
// 可选图层：海战战役的等深线（geo.config.json 的 sea.isobaths）
if (existsSync(resolve(LL, 'isobaths.geojson'))) layers.push('isobaths');
const files = {};
for (const name of [...layers, 'land_render']) {
  const fc = JSON.parse(readFileSync(resolve(LL, name + '.geojson'), 'utf8'));
  for (const f of fc.features) f.geometry.coordinates = walk(f.geometry.coordinates);
  writeFileSync(resolve(XY, name + '.geojson'), JSON.stringify(fc));
  if (layers.includes(name)) files[name + '.geojson'] = fc;
  console.log(`[project:${id}]`, name, fc.features.length);
}
const out = resolve(ROOT, 'public/campaigns', id, 'geo/vectors.topo.json');
mkdirSync(dirname(out), { recursive: true });
const res = await mapshaper.applyCommands(
  `-i ${layers.map((l) => l + '.geojson').join(' ')} combine-files snap -simplify planar interval=0.25 keep-shapes -filter-slivers min-area=2 -filter 'true' remove-empty target=* -o target=* format=topojson quantization=100000 out.topo.json`,
  files,
);
// 量化后退化为空的要素（极短的河段等）mapshaper 仍会输出为 type: null，浏览器端不处理空几何，这里去掉
const topo = JSON.parse(Object.values(res)[0]);
for (const o of Object.values(topo.objects)) if (o.geometries) o.geometries = o.geometries.filter((g) => g.type);
writeFileSync(out, JSON.stringify(topo));
console.log(`[project:${id}] →`, out);
