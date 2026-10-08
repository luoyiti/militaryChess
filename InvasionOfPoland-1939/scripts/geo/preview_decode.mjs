// 验收用：用 topojson-client 解码 public/geo/vectors.topo.json → .work/a/topo_check/*.geojson（世界坐标）
import { feature } from 'topojson-client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const topo = JSON.parse(readFileSync(resolve(ROOT, 'public/geo/vectors.topo.json'), 'utf8'));
const out = resolve(ROOT, '.work/a/topo_check');
mkdirSync(out, { recursive: true });
for (const k of Object.keys(topo.objects)) {
  const fc = feature(topo, topo.objects[k]);
  writeFileSync(resolve(out, k + '.geojson'), JSON.stringify(fc));
  console.log('[decode]', k, fc.features.length);
}
