// Topology quantization can collapse very short vector fragments. Runtime
// labels expect real geometry; remove collapsed records while retaining arcs.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const file = resolve(root, 'public/geo/vectors.topo.json');
const topo = JSON.parse(readFileSync(file, 'utf8'));
let removed = 0;
function keep(g) {
  if (!g || !g.type) { removed++; return false; }
  if (g.type === 'GeometryCollection') {
    g.geometries = g.geometries.filter(keep);
    if (!g.geometries.length) { removed++; return false; }
  }
  return true;
}
for (const obj of Object.values(topo.objects)) {
  if (obj.type === 'GeometryCollection') obj.geometries = obj.geometries.filter(keep);
}
writeFileSync(file, JSON.stringify(topo));
console.log('[topo] Removed', removed, 'collapsed geometries');
