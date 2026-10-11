/**
 * Deterministic screenshot capture for parity checks (legacy baseline or unified build).
 *   node tools/parity/capture.mjs --url http://127.0.0.1:4401/ --state .baselines/<fork>/state.json --out <dir> [--no3d]
 * Times come from the legacy state dump (8 keyframe-spread instants), so legacy and new runs shoot the same moments.
 * Playwright is resolved from root node_modules, or from PW_FROM (absolute path to @playwright/test/index.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const { chromium } = await import(process.env.PW_FROM ? pathToFileURL(process.env.PW_FROM).href : '@playwright/test');

const url = String(args.url);
const out = path.resolve(String(args.out));
const state = JSON.parse(fs.readFileSync(String(args.state), 'utf8'));
fs.mkdirSync(out, { recursive: true });

const kf = state.keyframes;
const pick = (n) => [...new Set(Array.from({ length: n }, (_, i) => kf[Math.round((i * (kf.length - 1)) / (n - 1))]))];
const times = pick(Math.min(8, kf.length));

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await context.addInitScript(() => {
  let s = 0x2f6b9a31;
  Math.random = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
if (args.hide) await context.addInitScript((sel) => {
  addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = `${sel}{display:none!important}`; document.head.appendChild(st); });
}, String(args.hide));
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack ?? e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

const sep = url.includes('?') ? '&' : '?';
await page.goto(`${url}${sep}nointro`);
await page.waitForFunction(() => window.__APP_READY__, null, { timeout: 90_000 });
await page.waitForTimeout(1500);

const geom = () => page.evaluate(() => window.__app.stats().geomCount ?? 0);
async function settle(prevGeom, ms = 900) {
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) { if ((await geom()) > prevGeom) break; await page.waitForTimeout(120); }
  await page.waitForTimeout(ms);
}

const report = { url, times, shots: [], errors };
async function shot(name) {
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  const stats = await page.evaluate(() => { const s = window.__app.stats(); return { relK: s.relK, lod: s.lod, units: s.units, t: s.t }; });
  report.shots.push({ name, stats });
}

for (const [i, iso] of times.entries()) {
  for (const rel of [1, 3]) {
    const g = await geom();
    await page.evaluate(([iso, rel]) => { window.__app.setTime(iso); window.__app.setZoom(rel); }, [iso, rel]);
    await settle(g);
    await shot(`2d-${String(i).padStart(2, '0')}-${iso.replace(/:/g, '')}-z${rel}`);
  }
}
if (!args.no3d) {
  for (const iso of [times[1] ?? times[0], times[times.length - 2] ?? times[0]]) {
    const g = await geom();
    await page.evaluate((iso) => { window.__app.setTime(iso); window.__app.setMode('3d'); }, iso);
    await settle(g, 6000);
    await shot(`3d-${iso.replace(/:/g, '')}`);
  }
  await page.evaluate(() => window.__app.setMode('2d'));
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(`${report.shots.length} shots → ${out}; ${errors.length} errors`);
await browser.close();
