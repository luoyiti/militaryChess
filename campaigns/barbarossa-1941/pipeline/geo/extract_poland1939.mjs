// 从波兰战役已提交的矢量（世界坐标）反投影出 1939-08-31 国界（经纬度）→ pipeline/geo/countries1939_poland.geojson
// 巴巴罗萨的 1941-06-22 国界以它为西段底图（梅梅尔、东普鲁士、但泽、波兰、波罗的海三国），见 borders_1941.py。
//   node campaigns/barbarossa-1941/pipeline/geo/extract_poland1939.mjs
import { geoConicConformal } from 'd3-geo';
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const F = JSON.parse(readFileSync(resolve(ROOT, 'campaigns/poland-1939/config/frame.json'), 'utf8'));
const proj = geoConicConformal().parallels(F.projection.parallels).rotate(F.projection.rotate).center(F.projection.center).scale(F.scale).translate(F.translate);
const topo = JSON.parse(readFileSync(resolve(ROOT, 'public/campaigns/poland-1939/geo/vectors.topo.json'), 'utf8'));
const fc = feature(topo, topo.objects.countries1939);
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const walk = (c) => (typeof c[0] === 'number' ? proj.invert(c).map(r5) : c.map(walk));
for (const f of fc.features) f.geometry.coordinates = walk(f.geometry.coordinates);
const out = resolve(ROOT, 'campaigns/barbarossa-1941/pipeline/geo/countries1939_poland.geojson');
writeFileSync(out, JSON.stringify(fc));
console.log(out, fc.features.map((f) => f.properties.id).join(' '));
