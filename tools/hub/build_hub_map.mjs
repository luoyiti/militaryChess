/**
 * 作战总台底图：1938 年欧洲国界 + 湖泊 + 主要河流 → public/hub/europe1938.topo.json
 *   npm run hub:map
 * 输入（未纳入版本库的共享缓存，tools/geo/fetch_raw.py 下载）：
 *   .cache/geo/raw/world_1938.geojson（historical-basemaps，GPL-3.0）
 *   .cache/geo/raw/ne_10m_lakes.geojson、ne_10m_rivers_lake_centerlines.geojson（Natural Earth，公有领域）
 * 为了让总台时间带能显示「瓜分」与「分区占领」，三个国家按示意线拆成两块：
 *   波兰 → 德占区 / 苏占区（1939-09-28 德苏边界条约，大致沿皮萨河—纳雷夫河—布格河—桑河）
 *   法国 → 占领区 / 非占领区（1940-06-22 停战分界线）
 *   希腊 → 本土 / 克里特岛
 * 分界线只用于总台小比例尺示意，精确边界见各战役自己的地图。
 */
import fs from 'node:fs';
import path from 'node:path';
import mapshaper from 'mapshaper';

const ROOT = path.resolve(import.meta.dirname, '../..');
const RAW = path.join(ROOT, '.cache/geo/raw');
const OUT = path.join(ROOT, 'public/hub/europe1938.topo.json');
const BBOX = [-32, 25, 80, 78]; // 比总台图幅（hub/map.ts 的 EXTENT）大，投影后图框四角仍有底图

const read = (f) => {
  const p = path.join(RAW, f);
  if (!fs.existsSync(p)) throw new Error(`缺少 ${p}（先运行 tools/geo/fetch_raw.py，或从旧战役的 scripts/.cache/raw 复制）`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const fc = (features) => ({ type: 'FeatureCollection', features });
const poly = (ring, props = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] } });

// 示意分界线（自北向南 / 自西南向东）
const PL_LINE = [[23.55, 54.25], [23.05, 53.95], [22.5, 53.62], [21.9, 53.47], [21.88, 53.23], [22.02, 53.03], [22.15, 52.85], [22.25, 52.68], [22.66, 52.4], [23.04, 52.33], [23.63, 52.08], [23.55, 51.55], [23.8, 51.17], [23.9, 50.8], [24.1, 50.42], [23.6, 50.3], [23.1, 50.2], [22.65, 50.12], [22.75, 49.95], [22.77, 49.78], [22.4, 49.65], [22.2, 49.56], [22.33, 49.45], [22.66, 49.0]];
const FR_LINE = [[-1.3, 43.15], [-0.5, 43.89], [-0.25, 44.55], [-0.24, 44.92], [0.35, 45.7], [0.67, 46.02], [0.7, 46.4], [0.99, 47.13], [2.07, 47.22], [2.49, 46.72], [3.33, 46.57], [3.98, 46.48], [4.12, 46.45], [4.86, 46.78], [5.49, 47.09], [5.9, 46.75], [6.13, 46.55]];
const SPLITS = {
  Poland: [
    { id: 'Poland (W)', zone: poly([...PL_LINE, [22.66, 48.5], [12, 48.5], [12, 55.5], [23.55, 55.5]]) },
    { id: 'Poland (E)', zone: poly([...PL_LINE, [22.66, 48.5], [30, 48.5], [30, 55.5], [23.55, 55.5]]) },
  ],
  France: [
    { id: 'France (N)', zone: poly([...FR_LINE, [9.5, 46.55], [9.5, 52], [-6, 52], [-6, 43.15]]) },
    { id: 'France (S)', zone: poly([...FR_LINE, [9.5, 46.55], [9.5, 41], [-6, 41], [-6, 43.15]]) },
  ],
  Greece: [
    // 本土 = 大框挖去克里特框（环沿框的三边绕进去再出来）
    { id: 'Greece', zone: poly([[19, 34], [19, 42], [30, 42], [30, 34], [26.7, 34], [26.7, 35.8], [23.2, 35.8], [23.2, 34]]) },
    { id: 'Greece (Crete)', zone: poly([[23.2, 34], [26.7, 34], [26.7, 35.8], [23.2, 35.8]]) },
  ],
};
// 无名岛屿按最近的有名国家归属；以下例外按历史归属指定（[lon, lat] 落在框内）
const ISLAND_OVERRIDES = [
  { box: [-8, 61, -6, 63], id: 'Denmark' }, // 法罗群岛
  { box: [19.3, 59.8, 21, 60.6], id: 'Finland' }, // 奥兰群岛
];

async function run(cmd, files) {
  const out = await mapshaper.applyCommands(cmd, files);
  return out;
}
const geo = async (cmd, files) => {
  const g = JSON.parse(Object.values(await run(cmd + ' -o format=geojson out.json', files))[0]);
  g.features = g.features.filter((f) => f.geometry); // 裁剪后范围外的要素几何为空
  return g;
};

function bboxOf(f) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c) => { if (typeof c[0] === 'number') { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(walk); };
  walk(f.geometry.coordinates);
  return b;
}
function vertices(f) { const v = []; const walk = (c) => { if (typeof c[0] === 'number') v.push(c); else c.forEach(walk); }; walk(f.geometry.coordinates); return v; }

// 1) 1938 国界：裁到总台范围，修复几何
const clipped = await geo(`-i w.json -clean -clip bbox=${BBOX.join(',')} -filter-slivers min-area=20km2`, { 'w.json': read('world_1938.geojson') });
const named = clipped.features.filter((f) => f.properties.NAME);
const unnamed = clipped.features.filter((f) => !f.properties.NAME);

// 2) 无名岛屿归属最近的有名国家（顶点距离，构建期一次性计算）
const sample = named.map((f) => ({ id: f.properties.NAME, pts: vertices(f).filter((_, i) => i % 4 === 0) }));
for (const f of unnamed) {
  const [x0, y0, x1, y1] = bboxOf(f);
  const c = [(x0 + x1) / 2, (y0 + y1) / 2];
  const o = ISLAND_OVERRIDES.find(({ box }) => c[0] >= box[0] && c[0] <= box[2] && c[1] >= box[1] && c[1] <= box[3]);
  let id = o?.id;
  if (!id) {
    let best = Infinity;
    for (const s of sample) for (const p of s.pts) { const d = (p[0] - c[0]) ** 2 * Math.cos((c[1] * Math.PI) / 180) ** 2 + (p[1] - c[1]) ** 2; if (d < best) { best = d; id = s.id; } }
  }
  f.properties = { NAME: id };
}
const all = [...named, ...unnamed].map((f) => ({ type: 'Feature', properties: { id: f.properties.NAME }, geometry: f.geometry }));

// 3) 按示意线拆分
const out = [];
for (const [name, parts] of Object.entries(SPLITS)) {
  const src = fc(all.filter((f) => f.properties.id === name));
  if (!src.features.length) throw new Error(`world_1938 中找不到 ${name}`);
  for (const part of parts) {
    const piece = await geo('-i c.json -i z.json -clip target=c z', { 'c.json': src, 'z.json': fc([part.zone]) });
    for (const f of piece.features) out.push({ type: 'Feature', properties: { id: part.id, of: name }, geometry: f.geometry });
  }
}
for (const f of all) if (!SPLITS[f.properties.id]) out.push(f);
for (const parts of Object.values(SPLITS)) for (const p of parts) if (!out.some((f) => f.properties.id === p.id)) throw new Error(`拆分后 ${p.id} 为空，检查分区多边形`);

// 4) 湖泊与主要河流（排除中东、北非水系）
const nearEast = (f) => { const [x0, y0, x1, y1] = bboxOf(f); return (x0 + x1) / 2 > 30 && (y0 + y1) / 2 < 41.5 || (y0 + y1) / 2 < 33; };
const lakes = read('ne_10m_lakes.geojson').features.filter((f) => f.properties.scalerank <= 3 && f.properties.name !== 'Rybinsk Reservoir');
const rivers = read('ne_10m_rivers_lake_centerlines.geojson').features.filter((f) => f.properties.scalerank <= 6 && f.properties.featurecla !== 'Lake Centerline');
const lakesC = await geo(`-i l.json -clip bbox=${BBOX.join(',')}`, { 'l.json': fc(lakes) });
const riversC = await geo(`-i r.json -clip bbox=${BBOX.join(',')}`, { 'r.json': fc(rivers) });
const lakeF = lakesC.features.filter((f) => !nearEast(f)).map((f) => ({ ...f, properties: { name: f.properties.name } }));
const riverF = riversC.features.filter((f) => !nearEast(f)).map((f) => ({ ...f, properties: { name: f.properties.name, rank: f.properties.scalerank } }));

// 5) 拓扑：共享边界 → 化简 → 陆地（国家合并）→ TopoJSON
const result = await run([
  '-i countries.json lakes.json rivers.json combine-files',
  '-simplify 40% weighted keep-shapes target=countries,lakes,rivers',
  '-filter-slivers min-area=40km2 target=countries',
  '-dissolve id copy-fields=of target=countries',
  '-dissolve target=countries + name=land',
  '-o format=topojson target=* quantization=100000 out.topo.json',
].join(' '), { 'countries.json': fc(out), 'lakes.json': fc(lakeF), 'rivers.json': fc(riverF) });
const topo = JSON.parse(Object.values(result)[0]);
topo.bbox = BBOX;
topo.meta = {
  generated: 'tools/hub/build_hub_map.mjs',
  sources: ['historical-basemaps world_1938（A. Ourednik 等，GPL-3.0）', 'Natural Earth 1:10m lakes / rivers（公有领域）'],
  splits: Object.fromEntries(Object.entries(SPLITS).map(([k, v]) => [k, v.map((p) => p.id)])),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(topo));
const ids = [...new Set(out.map((f) => f.properties.id))].sort();
console.log(`${path.relative(ROOT, OUT)}：${(fs.statSync(OUT).size / 1024).toFixed(0)} KB；${ids.length} 个国家/分区，${lakeF.length} 个湖泊，${riverF.length} 段河流`);
console.log(ids.join(', '));
