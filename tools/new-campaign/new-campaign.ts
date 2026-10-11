/**
 * 新建战役包：npm run new-campaign -- <id> --title <中文名> --en <English title> --start <ISO> --end <ISO>
 *                                      --bbox <西,南,东,北> --sides <ID:中文名:阵营[:1938年国名+…],…> [选项]
 * 选项：--orig <原文名> --codename <行动代号> --pin <经,纬> --status draft|planned（缺省 draft）
 *       --width 8192|4096（画布宽，缺省 8192）--force（覆盖已存在的目录）
 * 阵营：axis | allies | comintern | neutral。第一个阵营是进攻方（控制区 A 槽），与之对立的阵营的国家构成战区。
 * 1938 年国名取自 historical-basemaps world_1938（如 Germany、USSR、Poland），用于国界映射与场掩膜。
 *
 * 生成 campaigns/<id>/（清单、入口、配置、能通过校验的最小数据）与 public/campaigns/<id>/（署名、照片索引）。
 * 地图资产随后由 sh tools/geo/run.sh <id> 生成。status=planned 只写总台卷宗所需的清单。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/campaign-node';
import { isCalendarIso } from '../../engine/schema/zod';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true) ?? '';
const opt = (k: string, d?: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const die = (msg: string): never => { console.error(`✗ ${msg}\n\n用法：npm run new-campaign -- <id> --title 中文名 --en "English" --start 1941-06-22T03:00 --end 1941-12-05T23:59 --bbox 22,45,42,61 --sides "DE:德国:axis:Germany,SU:苏联:comintern:USSR"`); process.exit(2); };

if (!/^[a-z0-9]+(-[a-z0-9]+)*-\d{4}$/.test(id)) die(`战役 id「${id}」须形如 <地名>-<年份>（小写连字符，如 barbarossa-1941）`);
const title = opt('title') ?? die('缺少 --title');
const en = opt('en') ?? die('缺少 --en');
const start = opt('start') ?? die('缺少 --start');
const end = opt('end') ?? die('缺少 --end');
for (const [k, v] of [['start', start], ['end', end]]) if (!isCalendarIso(v)) die(`--${k} 须为 YYYY-MM-DDTHH:mm`);
if (end <= start) die('--end 须晚于 --start');
const bbox = (opt('bbox') ?? die('缺少 --bbox')).split(',').map(Number) as [number, number, number, number];
if (bbox.length !== 4 || bbox.some((v) => !Number.isFinite(v)) || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) die('--bbox 须为 西,南,东,北（经纬度）');
const status = (opt('status', 'draft') as 'draft' | 'planned');
if (!['draft', 'planned'].includes(status)) die('--status 只能是 draft 或 planned（发布前在 campaign.json 里改为 published）');
const width = Number(opt('width', '8192'));
const year = start.slice(0, 4);
const COALITIONS = ['axis', 'allies', 'comintern', 'neutral'] as const;
type Coalition = (typeof COALITIONS)[number];
const sides = (opt('sides') ?? die('缺少 --sides')).split(',').map((s) => {
  const [sid, name, coalition, names] = s.split(':');
  if (!/^[A-Z]{2,4}$/.test(sid ?? '')) die(`阵营 id「${sid}」须为 2–4 个大写字母`);
  if (!name) die(`阵营 ${sid} 缺少中文名`);
  if (!COALITIONS.includes(coalition as Coalition)) die(`阵营 ${sid} 的阵营类别「${coalition}」须为 ${COALITIONS.join(' / ')}`);
  return { id: sid, name, coalition: coalition as Coalition, countries: names ? names.split('+') : [] };
});
if (sides.length < 2) die('--sides 至少两方');
const dir = join(ROOT, 'campaigns', id), pub = join(ROOT, 'public/campaigns', id);
if (existsSync(dir) && !args.includes('--force')) die(`campaigns/${id} 已存在（--force 覆盖）`);

// ---------- 配色：同阵营依次取色 ----------
const PALETTE: Record<Coalition, { bg: string; edge: string; main: string; dark: string }[]> = {
  axis: [{ bg: '#56708f', edge: '#2a3a52', main: '#3a5887', dark: '#1f3558' }, { bg: '#6d8a9c', edge: '#36505e', main: '#4a7a8c', dark: '#2c4c58' }, { bg: '#8a8f6a', edge: '#4d5236', main: '#788054', dark: '#4d5236' }, { bg: '#8e7f98', edge: '#4f4458', main: '#7d6a8e', dark: '#4f4458' }],
  allies: [{ bg: '#b8443f', edge: '#6e1f1f', main: '#b3262e', dark: '#7a1a1f' }, { bg: '#2a5a94', edge: '#163864', main: '#1f4e89', dark: '#163864' }, { bg: '#8d7346', edge: '#5c4a28', main: '#8a7044', dark: '#5c4a28' }, { bg: '#438079', edge: '#24504a', main: '#438079', dark: '#24504a' }],
  comintern: [{ bg: '#a0683a', edge: '#5e3a1c', main: '#8f5a2b', dark: '#5e3a1c' }, { bg: '#9c4a3a', edge: '#5a251c', main: '#8a3f30', dark: '#5a251c' }],
  neutral: [{ bg: '#8a8273', edge: '#4a453f', main: '#6f685c', dark: '#4a453f' }],
};
const used: Record<string, number> = {};
const sideDefs = sides.map((s) => {
  const p = PALETTE[s.coalition][(used[s.coalition] = (used[s.coalition] ?? -1) + 1) % PALETTE[s.coalition].length];
  const rgba = (hex: string, a: number) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
  return {
    id: s.id, prefix: s.id.toLowerCase(), name: s.name, coalition: s.coalition,
    counter: { bg: p.bg, edge: p.edge, text: '#f4efe2', box: '#eef0ea', ink: p.dark },
    css: { main: p.main, dark: p.dark },
    arrow: { fill: rgba(p.main, 0.62), stroke: p.dark },
    sandbox: p.main,
  };
});

const attacker = sides[0];
const theatreSides = sides.filter((s) => s.coalition !== attacker.coalition && s.coalition !== 'neutral');
const allyOfAttacker = sides.filter((s) => s.coalition === attacker.coalition);
const cx = +((bbox[0] + bbox[2]) / 2).toFixed(3), cy = +((bbox[1] + bbox[3]) / 2).toFixed(3);
const center: [number, number] = [cx, cy];
const epoch = `${start.slice(0, 10)}T00:00`;
const fmtDate = (iso: string) => `${Number(iso.slice(0, 4))}.${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
const zhDate = (iso: string) => `${Number(iso.slice(0, 4))}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;
const accent = sideDefs.find((s) => s.coalition !== attacker.coalition)?.css ?? sideDefs[1].css;
const codename = opt('codename', title)!;
const pin = (opt('pin')?.split(',').map(Number) as [number, number] | undefined) ?? center;
const write = (p: string, data: string | object) => { mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n'); };
const fill = (tpl: string, vars: Record<string, string>) => readFileSync(join(ROOT, 'tools/templates/campaign', tpl), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

const hub = {
  order: 99,
  codename,
  codenameOrig: opt('orig')?.toUpperCase(),
  pin,
  labelAt: 's',
  theatre: { bbox },
  blurb: `（待补）${title}的一句话简介：何时、谁对谁、战役的转折与结局，五六十字为宜。`,
};

// ---------- 筹备中：只写总台卷宗 ----------
if (status === 'planned') {
  write(join(dir, 'campaign.json'), {
    schemaVersion: 2, id, status, title: { mark: year, zh: title, sub: `${codename} · 筹备中`, en, orig: opt('orig'), codename },
    time: { epoch, start, end, tzLabel: '（待定）' },
    sides: sides.map((s, i) => ({ id: s.id, name: s.name, coalition: s.coalition, css: { main: sideDefs[i].css.main } })),
    hub,
  });
  console.log(`✓ campaigns/${id}/campaign.json（筹备中，只出现在总台）`);
  process.exit(0);
}

// ---------- 清单 ----------
const manifest = {
  schemaVersion: 2,
  id,
  status,
  title: {
    mark: year, zh: title, sub: `${codename} · 战旗推演`, en, orig: opt('orig'), codename,
    html: `${year} · ${title} — 战旗推演`,
    description: `${year} 年${title}复古作战室风格战旗推演：部队推进、战线变化、时间轴与事件档案。`,
    favicon: accent.main,
  },
  time: { epoch, start, end, dataEnd: end, tzLabel: '（待补：叙事时区）' },
  sides: sideDefs,
  control: {
    mode: 'territory',
    landBit: 4,
    theatreBits: [0],
    slots: [{ key: attacker.id, label: `${attacker.name}控制区`, homeBits: [1] }],
    remainder: { label: `${theatreSides.map((s) => s.name).join('、') || '守方'}控制` },
  },
  phases: [{ id: 'p1', from: epoch, name: '第一阶段', short: '第一阶段', sub: '（待补：阶段说明）' }],
  marks: [[start, '开战']],
  theme: { accent: accent.main, accentDark: accent.dark, accentTint: 'rgba(0,0,0,.06)', theatreBorder: accent.main, theatreHalo: 'rgba(0,0,0,.14)', restFill: 'rgba(0,0,0,.05)' },
  map: {
    fit: 'frame',
    home3d: center,
    focus: center,
    hexKm: 18,
    theatreCountries: theatreSides.map((s) => s.id),
    labels: { countries: [], waters: [] },
    returnZoom: 1.15,
  },
  sandbox: { exaggeration: 6, figScale: 17, target: center },
  director: { returnTo: 'point', returnCenter: center, defaultZoom: [1.9, 2.6] },
  audio: { music: [], intensity: [{ from: epoch, value: 0.1 }, { from: start, value: 0.6 }], introSting: 'fanfare' },
  ui: {
    layers: {},
    chapterNav: 'none',
    brief: { title: `${year} ${title}`, sub: opt('orig') ?? en, sub2: `${fmtDate(start)} — ${fmtDate(end)}`, fine: '（待补：兵力数字的口径说明）' },
    status: {
      cells: [
        { sides: theatreSides.map((s) => s.id), metric: 'act', label: `${theatreSides[0]?.name ?? '守方'}单位在战` },
        { sides: theatreSides.map((s) => s.id), metric: 'enc', label: '被合围', cls: 'enc' },
        { sides: theatreSides.map((s) => s.id), metric: 'out', label: '已投降或撤出', cls: 'out' },
        { sides: allyOfAttacker.map((s) => s.id), metric: 'act', label: `${attacker.name}单位在战` },
      ],
    },
    legend: {
      counters: sides.map((s) => [s.id, 'infantry', 'division', `${s.name}步兵`]),
      items: ['<i class="lg-fill a"></i>' + `${attacker.name}控制区`, '<i class="lg-fill"></i>守方控制', '<i class="lg-front"></i>战线（接触线）', '<i class="lg-pocket"></i>包围圈'],
    },
  },
  intro: {
    stamp: 'GEHEIM · SECRET · 绝密',
    kicker: `作战档案 No. ${year}`,
    title,
    en,
    dates: `${zhDate(start)} — ${zhDate(end).slice(5)}`,
    paragraphs: ['（待补）战役背景：一两段，交代起因、双方部署与战役结局。'],
    how: '共 {units} 支部队、{events} 个历史事件、{keyframes} 个战线关键帧。位置为示意，不是实测阵地图。',
    note: '建议开启声音 · 支持鼠标滚轮缩放、拖动平移 · 历史示意图，边界与位置为近似',
  },
  credits: {
    geodata: [
      '<b>historical-basemaps world_1938</b>（A. Ourednik 等）— GPL-3.0',
      '<b>Natural Earth 1:10m</b>（河流、湖泊、海岸、陆地）— 公有领域',
      '<b>Terrain Tiles (Terrarium)</b> — Mapzen / AWS Open Data；SRTM、GMTED2010、ETOPO1 等',
    ],
  },
  hub,
};

// ---------- 地理管线参数 ----------
const span = bbox[3] - bbox[1];
const round = (v: number) => Math.round(v * 2) / 2;
const ids = Object.fromEntries(sides.flatMap((s) => s.countries.map((n) => [n, s.id])));
const geo = {
  _doc: '地理管线参数（sh tools/geo/run.sh <id>）。frame 段决定投影与画布，改动后需重新生成全部地图资产并核对已有坐标。',
  frame: {
    bbox,
    parallels: [round(bbox[1] + span / 6), round(bbox[3] - span / 6)],
    rotate: [-cx, 0],
    center: [0, cy],
    width,
    tileLevels: [1024, 2048, 4096, 8192].filter((l) => l <= width),
    fieldCell: width >= 8192 ? 16 : 8,
    clampKm: 60,
  },
  borders: { source: 'world_1938', ids, zh: Object.fromEntries(sides.map((s) => [s.id, s.name])), merge: {} },
  masks: { landBit: 4, bits: { 0: theatreSides.map((s) => s.id), 1: allyOfAttacker.map((s) => s.id) }, otherLandBit: 6 },
  // 小战区收录更细的支流（Natural Earth scalerank 越大越小）
  rivers: { maxRank: span < 6 ? 10 : span < 15 ? 8 : 6, names: {} },
  lakes: { maxRank: 4, zh: {}, drop: [] },
  forest: [],
  marsh: [],
};

// ---------- 最小数据（通过校验） ----------
const src = ['todo_source'];
const data: Record<string, unknown> = {
  'sources/main.json': [{ id: 'todo_source', title: '（待补）主要参考资料' }],
  'gazetteer/places.json': [{ id: 'theatre_center', zh: '战区中心（示意）', orig: 'Theatre centre', pos: center, kind: 'region', rank: 1 }],
  [`fronts/${start.replace(':', '-')}.json`]: { at: start, control: {}, note: '开战时（待补）', sources: src, confidence: 'low' },
  'events.json': [{ id: 'e.start', at: start, category: 'political', importance: 1, title: { zh: `${title}开始` }, body: `（待补）${zhDate(start)}，${title}开始。正文写清楚时间、地点、双方与结果，八十到一百四十字为宜，并在 sources 中注明出处。`, place: '@theatre_center', sources: src, confidence: 'low' }],
  'equipment.json': [],
  'pockets.json': [],
  'demarcation.json': [],
  'forces.json': {
    sides: Object.fromEntries(sides.map((s) => [s.id, { name: s.name, commander: '（待补）', men: null, divisions: '（待补）', tanks: null, aircraft: null, guns: null, losses: { killed: '—', wounded: '—' } }])),
    sources: src,
  },
};
sides.forEach((s, i) => {
  const a = (i / sides.length) * Math.PI * 2;
  const pos: [number, number] = [+(cx + Math.cos(a) * (bbox[2] - bbox[0]) * 0.15).toFixed(3), +(cy + Math.sin(a) * span * 0.15).toFixed(3)];
  data[`oob/${s.id.toLowerCase()}.json`] = [{ id: `${s.id.toLowerCase()}.hq`, side: s.id, echelon: 'army', type: 'hq', parent: null, name: { zh: `${s.name}指挥部（示意）`, short: s.id }, track: [{ at: start, pos, status: 'active' }], sources: src, confidence: 'low' }];
});

write(join(dir, 'campaign.json'), JSON.parse(JSON.stringify(manifest)));
write(join(dir, 'config/geo.config.json'), geo);
write(join(dir, 'config/lod.json'), readFileSync(join(ROOT, 'campaigns/crete-1941/config/lod.json'), 'utf8'));
for (const [p, v] of Object.entries(data)) write(join(dir, 'data', p), v as object);
const vars = { id, title, year, status, html: manifest.title.html, description: manifest.title.description, faviconEnc: encodeURIComponent(accent.main) };
write(join(dir, 'campaign.ts'), fill('campaign.ts.tmpl', vars));
write(join(dir, 'main.ts'), fill('main.ts.tmpl', vars));
write(join(dir, 'index.html'), fill('index.html.tmpl', vars));
write(join(dir, 'README.md'), fill('README.md.tmpl', vars));
write(join(pub, 'credits.json'), readFileSync(join(ROOT, 'tools/templates/campaign/credits.json'), 'utf8'));
write(join(pub, 'photos/index.json'), {});

console.log(`✓ campaigns/${id}/（草稿）与 public/campaigns/${id}/ 已生成
下一步：
  1. 核对 campaigns/${id}/config/geo.config.json（国界映射：${Object.keys(ids).join('、') || '未指定 1938 年国名，掩膜只有陆地'}）
  2. sh tools/geo/run.sh ${id}            # 生成投影、底图瓦片、矢量、3D 地形与场掩膜
  3. 补数据与清单文字（见 campaigns/${id}/README.md）
  4. npm run validate -- --campaign ${id}
  5. npm run dev → http://127.0.0.1:5180/campaigns/${id}/ （总台在开发模式下会显示草稿）`);
