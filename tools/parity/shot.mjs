/**
 * 单页截图（人工检查用）：
 *   node tools/parity/shot.mjs <url> <out.png> [--size 1440x900] [--wait 2500] [--eval "js"] [--reduced]
 * 与 capture.mjs 相同的浏览器参数（Chrome 通道、软件渲染），便于和对比截图一致。
 */
import { chromium } from '@playwright/test';

const [url, out] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const [w, h] = arg('--size', '1440x900').split('x').map(Number);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: process.argv.includes('--reduced') ? 'reduce' : 'no-preference', hasTouch: w < 760, isMobile: w < 760 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(arg('--wait', '2500')));
const js = arg('--eval', null);
if (js) { await page.evaluate(js); await page.waitForTimeout(Number(arg('--after', '800'))); }
await page.screenshot({ path: out, fullPage: process.argv.includes('--full') });
if (errors.length) console.log('页面错误：\n' + errors.join('\n'));
console.log(out);
await browser.close();
