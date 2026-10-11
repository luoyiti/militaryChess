// 截图冒烟：node scripts/shots.mjs [baseUrl] [--3d] [--only name]
// 用 Playwright 自带 chromium（swiftshader），收集 console 错误，输出到 .work/shots/
import { chromium } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:4194/';
const with3d = process.argv.includes('--3d');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const outDir = process.env.BALKANS_SHOTS_DIR || join(tmpdir(), 'balkans-1941-shots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ ...(existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }), args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });

const shots = [
  { name: 'intro', url: '', act: async () => {} },
  { name: 'invasion', url: '?nointro&t=1940-10-28T12:00', rel: 2.9, lon: 20.5, lat: 40.0 },
  { name: 'counterattack', url: '?nointro&t=1940-12-22T12:00', rel: 3, lon: 20.2, lat: 40.4 },
  { name: 'winter', url: '?nointro&t=1941-03-09T12:00', rel: 3, lon: 20.2, lat: 40.4 },
  { name: 'yugoslavia', url: '?nointro&t=1941-04-12T12:00', rel: 1.7, lon: 20.7, lat: 43.1 },
  { name: 'evacuation', url: '?nointro&t=1941-04-25T12:00', rel: 2.9, lon: 23.1, lat: 37.7 },
  { name: 'crete', url: '?nointro&t=1941-05-23T12:00', rel: 6.8, lon: 24.6, lat: 35.2 },
  { name: 'final', url: '?nointro&t=1941-06-01T20:00', rel: 1 },
];
if (with3d) shots.push({ name: 'sandbox_crete', url: '?nointro&t=1941-05-25T12:00', mode: '3d', wait: 8000 });

if (process.argv.includes('--play')) {
  shots.length = 0;
  shots.push({ name: 'play', url: '?nointro&t=1940-10-28T00:00', play: true, wait: 30000 });
}
try {
for (const s of shots) {
  if (only && s.name !== only) continue;
  await page.goto(base + s.url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__APP_READY__ === true || document.querySelector('.intro'), null, { timeout: 60000 }).catch(() => errors.push('ready timeout ' + s.name));
  await page.waitForTimeout(800);
  if (s.rel) await page.evaluate(([r, lon, lat]) => window.__app.setZoom(r, lon, lat), [s.rel, s.lon, s.lat]);
  if (s.mode) { await page.evaluate((m) => window.__app.setMode(m), s.mode); await page.waitForTimeout(s.modeWait ?? 0); }
  if (s.event) await page.evaluate((id) => window.__app.openEvent(id), s.event);
  if (s.unit) await page.evaluate((id) => window.__app.select(id), s.unit);
  if (s.play) await page.evaluate(() => { window.__app.store.set({ director: true, speed: 4, playing: true }); });
  await page.waitForTimeout(s.wait ?? 2200);
  await page.screenshot({ path: `${outDir}/${s.name}.png`, animations: 'disabled', timeout: 60000 });
  const st = await page.evaluate(() => window.__app?.stats?.() ?? null).catch(() => null);
  console.log(s.name, JSON.stringify(st));
}
} finally {
writeFileSync(`${outDir}/errors.txt`, errors.join('\n'));
console.log('errors:', errors.length);
for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ', e.slice(0, 300));
await browser.close();
}
