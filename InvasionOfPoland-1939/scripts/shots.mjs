// 截图冒烟：node scripts/shots.mjs [baseUrl] [--3d] [--only name]
// 用 Playwright 自带 chromium（swiftshader），收集 console 错误，输出到 .work/shots/
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:5173/';
const with3d = process.argv.includes('--3d');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const outDir = '.work/shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });

const shots = [
  { name: 'intro', url: '', act: async () => {} },
  { name: '0901_full', url: '?nointro&t=1939-09-01T12:00', rel: 1 },
  { name: '0903_full', url: '?nointro&t=1939-09-03T20:00', rel: 1 },
  { name: '0910_full', url: '?nointro&t=1939-09-10T12:00', rel: 1 },
  { name: '0914_mid', url: '?nointro&t=1939-09-14T12:00', rel: 2.6, lon: 20.4, lat: 52.3 },
  { name: '0918_full', url: '?nointro&t=1939-09-18T12:00', rel: 1 },
  { name: '0925_full', url: '?nointro&t=1939-09-25T12:00', rel: 1 },
  { name: '0912_near', url: '?nointro&t=1939-09-12T12:00', rel: 5.5, lon: 20.0, lat: 52.2 },
  { name: '1006_full', url: '?nointro&t=1939-10-06T20:00', rel: 1 },
  { name: 'event_card', url: '?nointro&t=1939-09-01T04:45', event: 'e.westerplatte_attack', wait: 6000 },
  { name: 'unit_card', url: '?nointro&t=1939-09-08T20:00', unit: 'de.4pz', wait: 3500 },
];
if (with3d) shots.push(
  { name: 'sandbox_0918', url: '?nointro&t=1939-09-18T12:00', mode: '3d', wait: 9000 },
  { name: 'sandbox_near', url: '?nointro&t=1939-09-10T12:00', mode: '3d', modeWait: 7000, event: 'e.bzura_counter', wait: 9000 },
);

if (process.argv.includes('--play')) {
  shots.length = 0;
  shots.push({ name: 'play', url: '?nointro&t=1939-08-31T20:00', play: true, wait: 30000 });
}
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
  await page.screenshot({ path: `${outDir}/${s.name}.png` });
  const st = await page.evaluate(() => window.__app?.stats?.() ?? null).catch(() => null);
  console.log(s.name, JSON.stringify(st));
}
writeFileSync(`${outDir}/errors.txt`, errors.join('\n'));
console.log('errors:', errors.length);
for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ', e.slice(0, 300));
await browser.close();
