/**
 * 作战总台底图：1938 年世界国界 + 湖泊 + 主要河流 → public/hub/world1938.topo.json
 *   npm run hub:map
 * 输入（未纳入版本库的共享缓存，tools/geo/fetch_raw.py 下载）：
 *   .cache/geo/raw/world_1938.geojson（historical-basemaps，GPL-3.0）
 *   .cache/geo/raw/ne_10m_lakes.geojson、ne_10m_rivers_lake_centerlines.geojson（Natural Earth，公有领域）
 *
 * 处理：
 *  - 修正数据集里的名称（「Chinese warlords」→ China 等）、合并碎块（法属印度支那、沙特阿拉伯）；
 *  - 无名岛屿归属最近的有名国家，少数按历史归属指定（法罗、所罗门、马耳他、塞浦路斯…）；
 *  - 为了让总台时间带显示「瓜分」「分区占领」与战局的局部变化，部分国家按示意线拆成几块：
 *      波兰 → 德占区 / 苏占区（1939-09-28 德苏边界条约）    法国 → 占领区 / 非占领区（1940-06-22 停战分界线）
 *      希腊 → 本土 / 克里特岛      丹麦 → 本土 / 冰岛 / 格陵兰      英属印度 → 印度 / 缅甸      澳大利亚 → 本土 / 新几内亚
 *    带 of 的拆分块共用一条「分界线」，只在两侧状态不同时显示；border: true 的拆分块之间画普通国界。
 *  - 每个国家带 sov（宗主国，来自 SUBJECTO），总台据此让殖民地继承宗主国的阵营。
 * 分界线只用于总台小比例尺示意，精确边界见各战役自己的地图。
 */
import fs from 'node:fs';
import path from 'node:path';
import mapshaper from 'mapshaper';

const ROOT = path.resolve(import.meta.dirname, '../..');
const RAW = path.join(ROOT, '.cache/geo/raw');
const OUT = path.join(ROOT, 'public/hub/world1938.topo.json');
const BBOX = [-180, -60, 180, 85]; // 去掉南极洲

const read = (f) => {
  const p = path.join(RAW, f);
  if (!fs.existsSync(p)) throw new Error(`缺少 ${p}（先运行 tools/geo/fetch_raw.py）`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const fc = (features) => ({ type: 'FeatureCollection', features });
const poly = (ring, props = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] } });

/** 数据集名称修正与合并：原名 → 总台 id */
const RENAME = {
  'Chinese warlords': 'China',
  Cambodia: 'French Indo-China', 'Cochin China': 'French Indo-China', Laos: 'French Indo-China',
  Hejaz: 'Saudi Arabia', Hail: 'Saudi Arabia', "Emirate of Bin Shal'an": 'Saudi Arabia',
  Israel: 'Mandatory Palestine (GB)',
  // 阿拉伯半岛的重复要素：「Yemen (UK)」与「Yemen」、「Oman (British Raj)」与「Muscat and Oman」几何相同；「India」是穆桑代姆半岛
  'Yemen (UK)': 'Yemen', 'Oman (British Raj)': 'Muscat and Oman', India: 'Muscat and Oman',
};
/** 宗主国修正（数据集里缺失或有误的 SUBJECTO） */
const SOV = {
  'French Indo-China': 'France',
  Yemen: '',
  'United Kingdom of Great Britain and Ireland': 'United Kingdom',
};

// 示意分界线（自北向南 / 自西南向东）
const PL_LINE = [[23.55, 54.25], [23.05, 53.95], [22.5, 53.62], [21.9, 53.47], [21.88, 53.23], [22.02, 53.03], [22.15, 52.85], [22.25, 52.68], [22.66, 52.4], [23.04, 52.33], [23.63, 52.08], [23.55, 51.55], [23.8, 51.17], [23.9, 50.8], [24.1, 50.42], [23.6, 50.3], [23.1, 50.2], [22.65, 50.12], [22.75, 49.95], [22.77, 49.78], [22.4, 49.65], [22.2, 49.56], [22.33, 49.45], [22.66, 49.0]];
const FR_LINE = [[-1.3, 43.15], [-0.5, 43.89], [-0.25, 44.55], [-0.24, 44.92], [0.35, 45.7], [0.67, 46.02], [0.7, 46.4], [0.99, 47.13], [2.07, 47.22], [2.49, 46.72], [3.33, 46.57], [3.98, 46.48], [4.12, 46.45], [4.86, 46.78], [5.49, 47.09], [5.9, 46.75], [6.13, 46.55]];
// 缅甸与英属印度的界线（自北向南，海上部分把安达曼、尼科巴群岛留在印度一侧）
const BURMA_LINE = [[97.35, 28.2], [96.2, 27.25], [95.15, 26.6], [95.2, 26.0], [94.75, 25.5], [94.6, 24.7], [94.15, 23.85], [93.4, 23.8], [93.1, 22.6], [92.6, 22.0], [92.6, 21.3], [92.27, 20.68], [92.6, 19.6], [93.5, 17.0], [94.0, 15.0], [96.5, 9.0]];
const SPLITS = {
  Poland: { parts: [
    { id: 'Poland (W)', zone: poly([...PL_LINE, [22.66, 48.5], [12, 48.5], [12, 55.5], [23.55, 55.5]]) },
    { id: 'Poland (E)', zone: poly([...PL_LINE, [22.66, 48.5], [30, 48.5], [30, 55.5], [23.55, 55.5]]) },
  ] },
  France: { parts: [
    { id: 'France (N)', zone: poly([...FR_LINE, [9.5, 46.55], [9.5, 52], [-6, 52], [-6, 43.15]]) },
    { id: 'France (S)', zone: poly([...FR_LINE, [9.5, 46.55], [9.5, 41], [-6, 41], [-6, 43.15]]) },
  ] },
  Greece: { parts: [
    // 本土 = 大框挖去克里特框（环沿框的三边绕进去再出来）
    { id: 'Greece', zone: poly([[19, 34], [19, 42], [30, 42], [30, 34], [26.7, 34], [26.7, 35.8], [23.2, 35.8], [23.2, 34]]) },
    { id: 'Greece (Crete)', zone: poly([[23.2, 34], [26.7, 34], [26.7, 35.8], [23.2, 35.8]]) },
  ] },
  Denmark: { border: true, parts: [
    { id: 'Denmark', zone: poly([[3, 53], [16, 53], [16, 58.5], [3, 58.5]]) },
    { id: 'Iceland', zone: poly([[-26, 62.5], [-12, 62.5], [-12, 67.5], [-26, 67.5]]) },
    { id: 'Greenland', zone: poly([[-75, 58], [-28, 58], [-28, 68.5], [-10, 68.5], [-10, 84], [-75, 84]]) },
  ] },
  'British Raj': { border: true, parts: [
    { id: 'British Raj', zone: poly([...BURMA_LINE, [96.5, 5], [55, 5], [55, 40], [97.35, 40]]) },
    { id: 'Burma', zone: poly([...BURMA_LINE, [96.5, 5], [103, 5], [103, 30], [97.35, 30]]) },
  ] },
  Australia: { border: true, parts: [
    { id: 'Australia', zone: poly([[100, -50], [170, -50], [170, -12.5], [144, -12.5], [144, -9.3], [140.8, -9.3], [140.8, 0], [100, 0]]) },
    { id: 'New Guinea (Australia)', zone: poly([[140.8, -9.3], [144, -9.3], [144, -12.5], [160, -12.5], [160, 0], [140.8, 0]]) },
  ] },
};
/** 拆分块的宗主国 */
const PART_SOV = { Iceland: 'Denmark', Greenland: 'Denmark', Burma: 'United Kingdom', 'New Guinea (Australia)': 'Australia' };

// 无名岛屿按最近的有名国家归属；以下例外按历史归属指定（要素中心 [lon, lat] 落在框内）
const ISLAND_OVERRIDES = [
  { box: [-8, 61, -6, 63], id: 'Faroe Islands', sov: 'Denmark' },
  { box: [19.3, 59.8, 21, 60.6], id: 'Finland' }, // 奥兰群岛
  { box: [155.6, -12.5, 163, -6.4], id: 'Solomon Islands', sov: 'United Kingdom' },
  { box: [14.1, 35.7, 14.7, 36.1], id: 'Malta', sov: 'United Kingdom' },
  { box: [32.2, 34.5, 34.7, 35.8], id: 'Cyprus', sov: 'United Kingdom' },
  { box: [36.5, 26, 47.5, 32.5], id: 'Saudi Arabia' }, // 内志北部
];
/** 数据集里退化成线的国家：按示意轮廓从周边（同在陆地上的）要素中切出 */
const CARVE = [
  { id: 'Jordan', sov: 'United Kingdom', zone: poly([[35.55, 32.75], [36.85, 32.33], [38.8, 33.37], [39.3, 32.23], [37.0, 31.5], [38.0, 30.5], [37.5, 30.0], [36.5, 29.5], [34.95, 29.35], [35.4, 30.9], [35.55, 31.8]]) },
  { id: 'Kuwait', sov: 'United Kingdom', zone: poly([[46.55, 29.1], [47.1, 30.1], [48.0, 30.05], [48.5, 29.5], [48.45, 28.53], [47.67, 28.53]]) },
];
/** 数据集里缺失的岛屿（小比例尺示意轮廓） */
const ADD = [
  poly([[14.18, 36.05], [14.26, 36.08], [14.35, 36.03], [14.4, 35.97], [14.57, 35.87], [14.52, 35.8], [14.4, 35.83], [14.33, 35.92], [14.18, 36.02]], { id: 'Malta', sov: 'United Kingdom' }),
  poly([[32.27, 35.04], [32.42, 34.76], [32.75, 34.65], [33.04, 34.67], [33.63, 34.92], [34.08, 34.96], [33.98, 35.06], [34.25, 35.42], [34.59, 35.69], [33.92, 35.42], [33.32, 35.34], [32.92, 35.4], [32.95, 35.18], [32.42, 35.1]], { id: 'Cyprus', sov: 'United Kingdom' }),
];

const run = (cmd, files) => mapshaper.applyCommands(cmd, files);
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

// 1) 1938 国界：去掉南极洲，修复几何，修正名称
const clipped = await geo(`-i w.json -clean -clip bbox=${BBOX.join(',')} -filter-slivers min-area=20km2`, { 'w.json': read('world_1938.geojson') });
const named = [], unnamed = [];
for (const f of clipped.features) {
  const n = f.properties.NAME;
  if (!n) { unnamed.push(f); continue; }
  const id = RENAME[n] ?? n;
  const subj = f.properties.SUBJECTO;
  const sov = SOV[id] ?? (subj && subj !== n ? (SOV[subj] ?? subj) : undefined);
  if (CARVE.some((c) => c.id === id)) continue; // 退化要素，下面重新切出
  named.push({ type: 'Feature', properties: { id, sov: sov || undefined }, geometry: f.geometry });
}

// 2) 无名岛屿归属
const sample = named.map((f) => ({ id: f.properties.id, sov: f.properties.sov, pts: vertices(f).filter((_, i) => i % 3 === 0) }));
const islands = [];
for (const f of unnamed) {
  const [x0, y0, x1, y1] = bboxOf(f);
  const c = [(x0 + x1) / 2, (y0 + y1) / 2];
  const o = ISLAND_OVERRIDES.find(({ box }) => c[0] >= box[0] && c[0] <= box[2] && c[1] >= box[1] && c[1] <= box[3]);
  let id = o?.id, sov = o?.sov;
  if (!id) {
    let best = Infinity;
    for (const s of sample) for (const p of s.pts) { const d = (p[0] - c[0]) ** 2 * Math.cos((c[1] * Math.PI) / 180) ** 2 + (p[1] - c[1]) ** 2; if (d < best) { best = d; id = s.id; sov = s.sov; } }
  }
  islands.push({ type: 'Feature', properties: { id, sov }, geometry: f.geometry });
}
let all = [...named, ...islands];

// 2b) 切出退化的国家
const intersects = (f, z) => { const a = bboxOf(f), b = bboxOf(z); return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]; };
for (const c of CARVE) {
  const near = all.filter((f) => intersects(f, c.zone));
  const inside = await geo('-i a.json -i z.json -clip target=a z', { 'a.json': fc(near), 'z.json': fc([c.zone]) });
  const outside = await geo('-i a.json -i z.json -erase target=a z', { 'a.json': fc(near), 'z.json': fc([c.zone]) });
  if (!inside.features.length) throw new Error(`切出 ${c.id} 失败：示意轮廓内没有陆地`);
  all = [...all.filter((f) => !near.includes(f)), ...outside.features, ...inside.features.map((f) => ({ type: 'Feature', properties: { id: c.id, sov: c.sov }, geometry: f.geometry }))];
}
all.push(...ADD);

// 3) 按示意线拆分
const out = [];
for (const [name, { parts, border }] of Object.entries(SPLITS)) {
  const src = fc(all.filter((f) => f.properties.id === name));
  if (!src.features.length) throw new Error(`world_1938 中找不到 ${name}`);
  for (const part of parts) {
    const piece = await geo('-i c.json -i z.json -clip target=c z', { 'c.json': src, 'z.json': fc([part.zone]) });
    const sov = PART_SOV[part.id] ?? src.features[0].properties.sov;
    for (const f of piece.features) out.push({ type: 'Feature', properties: { id: part.id, of: border ? undefined : name, sov }, geometry: f.geometry });
  }
}
for (const f of all) if (!SPLITS[f.properties.id]) out.push(f);
for (const { parts } of Object.values(SPLITS)) for (const p of parts) if (!out.some((f) => f.properties.id === p.id)) throw new Error(`拆分后 ${p.id} 为空，检查分区多边形`);

// 4) 湖泊与主要河流：全球取大河大湖，欧洲多取一级（战后修建的水库一律剔除）
const EUROPE = [-12, 35, 45, 72];
const inBox = (f, b) => { const [x0, y0, x1, y1] = bboxOf(f); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; return cx >= b[0] && cx <= b[2] && cy >= b[1] && cy <= b[3]; };
const lakes = read('ne_10m_lakes.geojson').features.filter((f) => f.properties.featurecla !== 'Reservoir' && f.geometry && (f.properties.scalerank <= 2 || (f.properties.scalerank <= 3 && inBox(f, EUROPE))));
const rivers = read('ne_10m_rivers_lake_centerlines.geojson').features.filter((f) => f.properties.featurecla === 'River' && f.geometry && (f.properties.scalerank <= 5 || (f.properties.scalerank <= 6 && inBox(f, EUROPE))));
const lakeF = lakes.map((f) => ({ type: 'Feature', properties: { name: f.properties.name }, geometry: f.geometry }));
const riverF = rivers.map((f) => ({ type: 'Feature', properties: { rank: f.properties.scalerank }, geometry: f.geometry }));

// 5) 拓扑：共享边界 → 化简河湖 → 陆地（国家合并）→ TopoJSON
const result = await run([
  '-i countries.json lakes.json rivers.json combine-files',
  '-simplify 12% weighted keep-shapes target=lakes,rivers',
  '-filter-slivers min-area=30km2 target=countries',
  '-dissolve id copy-fields=of,sov target=countries',
  '-dissolve target=countries + name=land',
  '-o format=topojson target=* quantization=200000 out.topo.json',
].join(' '), { 'countries.json': fc(out), 'lakes.json': fc(lakeF), 'rivers.json': fc(riverF) });
const topo = JSON.parse(Object.values(result)[0]);
topo.bbox = BBOX;
topo.meta = {
  generated: 'tools/hub/build_hub_map.mjs',
  sources: ['historical-basemaps world_1938（A. Ourednik 等，GPL-3.0）', 'Natural Earth 1:10m lakes / rivers（公有领域）'],
  splits: Object.fromEntries(Object.entries(SPLITS).map(([k, v]) => [k, v.parts.map((p) => p.id)])),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(topo));
const ids = [...new Set(out.map((f) => f.properties.id))].sort();
console.log(`${path.relative(ROOT, OUT)}：${(fs.statSync(OUT).size / 1024).toFixed(0)} KB；${ids.length} 个国家/分区，${lakeF.length} 个湖泊，${riverF.length} 段河流`);
console.log(ids.join(', '));
