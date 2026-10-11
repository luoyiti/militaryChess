/**
 * 调试渲染：把某一时刻的战线关键帧 / 部队位置 / 路线 / 包围圈 / 事件画到简易底图上，输出 PNG 供目检。
 * 用法：npx tsx scripts/debug/render_debug.ts --date 1940-05-28T12:00 [--out .debug/0910.png] [--labels] [--region x0,y0,x1,y1(经纬度)]
 * 依赖：scripts/.cache/raw/*.geojson（Natural Earth + world_1938）与本机 Google Chrome（headless 截图）。
 */
import { geoConicConformal, geoPath } from 'd3-geo';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadAll } from '../validate/load_node';
import { isoToHours, type LonLat, type Place, type Unit, type Route } from '../../src/schema';
import { buildGazetteer, resolveUnits, unitStateAt, resolveRoutes, routeProgress, tryResolvePos } from '../../src/model/core';

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const date = arg('--date', '1940-05-28T12:00')!;
const out = resolve(ROOT, arg('--out', `.debug/${date.replace(/[:]/g, '-')}.png`)!);
const labels = argv.includes('--labels');
const region = arg('--region');
const h = isoToHours(date);

const raw = loadAll();
const F = raw.frame;
const proj = geoConicConformal().parallels(F.projection.parallels).rotate(F.projection.rotate).center(F.projection.center).scale(F.scale).translate(F.translate);
let vb = [0, 0, F.width, F.height];
if (region) {
  const [a, b, c, d] = region.split(',').map(Number);
  const pts = [[a, b], [c, b], [c, d], [a, d]].map((p) => proj(p as [number, number])!);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  vb = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}
const S = vb[2] / 1600; // 屏幕 1px 对应的世界单位
const path = geoPath(proj);
const [W0, S0, E0, N0] = F.bbox;
const cache = (f: string) => JSON.parse(readFileSync(resolve(ROOT, 'scripts/.cache/raw', f), 'utf8'));
const bboxHit = (g: any) => {
  let hit = false;
  const walk = (c: any) => { if (hit) return; if (typeof c[0] === 'number') { if (c[0] > W0 - 2 && c[0] < E0 + 2 && c[1] > S0 - 2 && c[1] < N0 + 2) hit = true; return; } c.forEach(walk); };
  if (g) walk(g.coordinates);
  return hit;
};

const parts: string[] = [];
parts.push(`<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#bcd3dc"/>`);
// 国家
const w38 = cache('world_1938.geojson');
const countryFill: Record<string, string> = { Poland: '#efe3c4', Germany: '#d9d6cc', USSR: '#e2cfc2', Lithuania: '#e6e1d0', Latvia: '#e6e1d0', Romania: '#e6e1d0', Hungary: '#e6e1d0', Czechoslovakia: '#dcdcd4' };
for (const f of w38.features) {
  if (!bboxHit(f.geometry)) continue;
  const d = path(f);
  if (d) parts.push(`<path d="${d}" fill="${countryFill[f.properties?.NAME] ?? '#e8e4d8'}" stroke="#555" stroke-width="${1.2 * S}"/>`);
}
// 河流
if (existsSync(resolve(ROOT, 'scripts/.cache/raw/ne_10m_rivers_europe.geojson'))) {
  for (const file of ['ne_10m_rivers_lake_centerlines.geojson', 'ne_10m_rivers_europe.geojson']) {
    for (const f of cache(file).features) {
      if (!bboxHit(f.geometry)) continue;
      const d = path(f);
      if (d) parts.push(`<path d="${d}" fill="none" stroke="#4d7ea8" stroke-width="${1.1 * S}" opacity="0.8"/>`);
    }
  }
}
// 数据
const { gaz } = buildGazetteer(...raw.gazetteer.map((g) => g.items as Place[]));
const P = (p: any): [number, number] | null => { const ll = tryResolvePos(p, gaz); return ll ? (proj(ll as [number, number]) as [number, number]) : null; };

// 关键帧（取 ≤ 时刻的最近一帧）
const kf = raw.fronts.map((f) => f.item).filter((k) => k?.at && isoToHours(k.at) <= h).sort((a, b) => isoToHours(a.at) - isoToHours(b.at)).pop();
const polyD = (poly: any[][]) => poly.map((ring) => 'M' + ring.map((p) => P(p)?.map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
if (kf) {
  for (const poly of kf.DE ?? []) parts.push(`<path d="${polyD(poly)}" fill="#2f4f7f" fill-opacity="0.28" fill-rule="evenodd" stroke="#1d3557" stroke-width="${2.5 * S}"/>`);
  for (const poly of kf.AL ?? []) parts.push(`<path d="${polyD(poly)}" fill="#8a4b1f" fill-opacity="0.3" fill-rule="evenodd" stroke="#6b3410" stroke-width="${2.5 * S}"/>`);
}
// 分界线
for (const d of raw.demarcation) {
  if (isoToHours(d.at) > h || (d.until && isoToHours(d.until) < h)) continue;
  parts.push(`<path d="M${d.line.map((p: any) => P(p)?.join(',')).join('L')}" fill="none" stroke="#000" stroke-dasharray="${8 * S},${5 * S}" stroke-width="${2 * S}"/>`);
}
// 路线
const routes = resolveRoutes(raw.routes as Route[], gaz);
const sideColor: Record<string, string> = { DE: '#1d3557', SK: '#3a7ca5', NO: '#b3262e', AL: '#8a4b1f' };
for (const r of routes) {
  const pr = routeProgress(r, h);
  const full = r.wps.map((w) => proj(w.ll as [number, number])!.join(',')).join('L');
  parts.push(`<path d="M${full}" fill="none" stroke="${sideColor[r.side]}" stroke-opacity="0.25" stroke-width="${2 * S}" stroke-dasharray="${4 * S},${4 * S}"/>`);
  if (pr.length > 1) parts.push(`<path d="M${pr.map((ll) => proj(ll as [number, number])!.join(',')).join('L')}" fill="none" stroke="${sideColor[r.side]}" stroke-width="${4 * S}" stroke-linecap="round"/>`);
}
// 包围圈
for (const p of raw.pockets) {
  if (isoToHours(p.start) > h || isoToHours(p.end) < h) continue;
  const xy = P(p.anchor);
  if (xy) parts.push(`<circle cx="${xy[0]}" cy="${xy[1]}" r="${10 * S}" fill="none" stroke="#b3262e" stroke-width="${3 * S}"/><text x="${xy[0] + 12 * S}" y="${xy[1]}" font-size="${13 * S}" fill="#b3262e">${p.name.zh}</text>`);
}
// 城市
for (const p of gaz.values()) {
  if (p.rank > 2 && !labels) continue;
  const xy = proj(p.pos as [number, number])!;
  parts.push(`<circle cx="${xy[0]}" cy="${xy[1]}" r="${2.5 * S}" fill="#222"/><text x="${xy[0] + 4 * S}" y="${xy[1] - 3 * S}" font-size="${(p.rank <= 2 ? 12 : 9) * S}" fill="#222">${p.zh}</text>`);
}
// 部队
const allUnits = raw.units.flatMap((g) => g.items) as Unit[];
let runits;
try { runits = resolveUnits(allUnits, gaz); } catch (e) { console.error('部队解析失败', (e as Error).message); runits = new Map(); }
let shown = 0;
for (const u of runits.values()) {
  if (u.echelon === 'armygroup' || u.echelon === 'front') continue;
  const s = unitStateAt(u.id, runits, h);
  if (!s || s.fade < 0.1) continue;
  const xy = proj(s.ll as [number, number])!;
  const r = (u.echelon === 'army' ? 9 : u.echelon === 'corps' ? 6.5 : 4.5) * S;
  const dead = ['destroyed', 'surrendered', 'interned', 'disbanded'].includes(s.status);
  parts.push(`<rect x="${xy[0] - r}" y="${xy[1] - r * 0.7}" width="${2 * r}" height="${1.4 * r}" fill="${dead ? '#999' : sideColor[u.side]}" stroke="#fff" stroke-width="${0.8 * S}" opacity="${s.fade}"/>`);
  if (u.echelon !== 'division' && u.echelon !== 'brigade' || labels) parts.push(`<text x="${xy[0] + r + 2 * S}" y="${xy[1] + 3 * S}" font-size="${(u.echelon === 'army' ? 11 : 8) * S}" fill="${sideColor[u.side]}" font-weight="bold">${u.name.short ?? u.name.zh}</text>`);
  shown++;
}
// 当日事件
const day = date.slice(0, 10);
for (const e of raw.events) {
  if (!String(e.at).startsWith(day)) continue;
  const xy = P(e.place);
  if (xy) parts.push(`<path d="M${xy[0]},${xy[1] - 9 * S}L${xy[0] + 8 * S},${xy[1] + 6 * S}L${xy[0] - 8 * S},${xy[1] + 6 * S}Z" fill="#f4a300" stroke="#000" stroke-width="${S}"/><text x="${xy[0] + 10 * S}" y="${xy[1] + 12 * S}" font-size="${11 * S}" fill="#7a4a00">${e.title.zh}</text>`);
}
parts.push(`<text x="${vb[0] + 20 * S}" y="${vb[1] + 40 * S}" font-size="${28 * S}" font-weight="bold" fill="#111">${date}  关键帧:${kf?.at ?? '无'}  单位:${shown}</text>`);

const Hh = Math.round((1600 * vb[3]) / vb[2]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="1600" height="${Hh}" font-family="PingFang SC, sans-serif">${parts.join('')}</svg>`;
mkdirSync(dirname(out), { recursive: true });
const htmlPath = out.replace(/\.png$/, '.html');
writeFileSync(htmlPath, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">${svg}</body></html>`);
await screenshot(htmlPath, out, 1600, Hh);
console.log('写出', out, '单位', shown);

/** 截图：优先 Playwright + 系统 Chrome（独立临时配置目录，避免与正在运行的 Chrome 冲突而卡死）；失败再退回命令行 headless。 */
async function screenshot(html: string, png: string, w: number, hgt: number) {
  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: 'chrome', headless: true, timeout: 60000 });
    const page = await browser.newPage({ viewport: { width: w, height: hgt } });
    await page.goto('file://' + html, { timeout: 60000 });
    await page.screenshot({ path: png, timeout: 60000 });
    await browser.close();
    return;
  } catch (e) {
    console.warn('Playwright 截图失败，退回命令行 headless：', (e as Error).message.split('\n')[0]);
  }
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const tmp = resolve(ROOT, '.debug/.chrome-profile');
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${tmp}`, `--window-size=${w},${hgt}`, `--screenshot=${png}`, 'file://' + html], { stdio: 'ignore', timeout: 60000 });
}
