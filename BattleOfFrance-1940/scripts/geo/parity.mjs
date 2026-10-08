// 用 d3-geo 投影全部 gazetteer 地名，写出 .work/a/parity.json，供 proj.py 比对
import { geoConicConformal } from 'd3-geo';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const F = JSON.parse(readFileSync(resolve(ROOT, 'config/frame.json'), 'utf8'));
const proj = geoConicConformal().parallels(F.projection.parallels).rotate(F.projection.rotate).center(F.projection.center).scale(F.scale).translate(F.translate);
const out = [];
const dir = resolve(ROOT, 'src/data/gazetteer');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  for (const p of JSON.parse(readFileSync(resolve(dir, f), 'utf8'))) if (p?.pos) out.push({ id: p.id, ll: p.pos, xy: proj(p.pos) });
}
// 额外加画布角附近的网格点
for (let lon = -4; lon <= 10; lon += 2) for (let lat = 45; lat <= 54; lat += 2) out.push({ id: `g${lon}_${lat}`, ll: [lon, lat], xy: proj([lon, lat]) });
mkdirSync(resolve(ROOT, '.work/a'), { recursive: true });
writeFileSync(resolve(ROOT, '.work/a/parity.json'), JSON.stringify(out));
console.log('[parity.mjs] 写出点数', out.length);
