// 截图冒烟：node scripts/shots.mjs [baseUrl] [--3d] [--only name]
// 用 Playwright 自带 chromium（swiftshader），收集 console 错误，输出到 .work/shots/
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:4193/';
const with3d = process.argv.includes('--3d');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const outDir = '.work/shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({channel:'chrome', headless:true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });

const shots = [
  {name:'intro',url:''},
  ...['1940-07-10T12:00','1940-08-13T12:00','1940-08-15T12:00','1940-08-18T12:00','1940-09-07T12:00','1940-09-15T12:00','1940-10-31T18:00'].map((at)=>({name:at.slice(5,10).replace('-','')+'_full',url:'?nointro&t='+at,rel:1})),
  {name:'eagle_day',url:'?nointro&t=1940-08-13T12:00',event:'e.eagle_day',wait:5000},
  {name:'spitfire_card',url:'?nointro&t=1940-09-15T12:00',unit:'gb.19_sqn',wait:2500},
];
if(with3d)shots.push({name:'sandbox',url:'?nointro&t=1940-09-15T12:00',mode:'3d',wait:6500});

if (process.argv.includes('--play')) {
  shots.length = 0;
  shots.push({ name: 'play', url: '?nointro&t=1940-07-10T00:00', play: true, wait: 30000 });
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
