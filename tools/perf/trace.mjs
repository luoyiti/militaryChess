/** Focused CPU/render trace, kept separate from the untraced performance gate. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const base = arg('--base', 'http://127.0.0.1:4180');
const out = arg('--out', '.work/river-perf/trace');
const mode = arg('--mode', '2d'), seconds = Number(arg('--seconds', '10'));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(base + '/campaigns/river-plate-1939/?nointro');
  await page.waitForFunction(() => window.__APP_READY__);
  await page.evaluate(mode => {
    window.__app.resetScene('1939-12-13T06:20');
    window.__app.setCamera(28, -49.5, -34.5);
    window.__app.setMode(mode);
  }, mode);
  if (mode === '3d') await page.waitForFunction(() => window.__app.stats().sandbox?.ready);
  await page.waitForTimeout(500);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReturnAsStream' });
  await page.evaluate(() => window.__app.store.set({ playing: true, director: false, speed: 8 }));
  await page.waitForTimeout(seconds * 1000);
  const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  const { stream } = await complete;
  let raw = '';
  for (;;) {
    const part = await cdp.send('IO.read', { handle: stream });
    raw += part.base64Encoded ? Buffer.from(part.data, 'base64').toString('utf8') : part.data;
    if (part.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  await writeFile(`${out}/${mode}.trace.json`, raw);
  const events = JSON.parse(raw).traceEvents;
  const durations = {};
  for (const name of ['FunctionCall', 'EvaluateScript', 'Layout', 'UpdateLayoutTree', 'PrePaint', 'Paint', 'Layerize']) {
    const spans = events.filter(e => e.name === name && e.ph === 'X');
    durations[name] = { count: spans.length, totalMs: spans.reduce((sum, e) => sum + e.dur / 1000, 0), maxMs: Math.max(0, ...spans.map(e => e.dur / 1000)) };
  }
  const summary = { base, mode, seconds, durations, note: 'Trace instrumentation adds overhead. Event durations can overlap; do not sum categories into total frame time. Paint records CPU paint work, not GPU presentation latency.' };
  await writeFile(`${out}/${mode}.summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally { await browser.close(); }
