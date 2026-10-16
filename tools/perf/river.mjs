/** Hardware Chrome performance/visual acceptance. No SwiftShader, throttling or quality reduction.
 * node tools/perf/river.mjs --base http://127.0.0.1:4180 --out .work/river-perf/after
 * --seconds 30 --cold 5 (defaults); --soak adds 20 switches + ten-minute playback.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const base = arg('--base', 'http://127.0.0.1:4180'), out = arg('--out', '.work/river-perf/after');
const seconds = Number(arg('--seconds', '30')), cold = Number(arg('--cold', '5'));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false });
const report = { base, seconds, viewport: [1440, 900], dpr: 2, cold: [], samples: [], switches: [], errors: [], soak: [] };
const save = () => writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
const route = '/campaigns/river-plate-1939/';
async function context() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    window.__longTasks = [];
    new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, ms: e.duration })))).observe({ type: 'longtask', buffered: true });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  return { ctx, page };
}
async function mode(page, mode) {
  return page.evaluate(async mode => {
    const start = performance.now(); window.__app.setMode(mode);
    await new Promise((resolve, reject) => {
      const check = () => {
        const s = window.__app.stats().sandbox;
        if (mode === '2d' || (s?.ready && (s.frames === undefined || s.frames > 0))) requestAnimationFrame(() => requestAnimationFrame(resolve));
        else if (performance.now() - start > 20000) reject(new Error('3D readiness timeout'));
        else requestAnimationFrame(check);
      }; requestAnimationFrame(check);
    });
    return performance.now() - start;
  }, mode);
}
async function sample(page, name, action) {
  const only=arg('--only',''); if(only && !name.includes(only))return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const before = await cdp.send('Performance.getMetrics');
  const measuring = page.evaluate(async ms => {
    const start = performance.now(), values = []; let last = start;
    await new Promise(resolve => { const tick = now => { values.push(now - last); last = now; if (now - start < ms) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); });
    values.sort((a,b) => a-b);
    return { frames: values.length, p50: values[Math.floor(values.length*.5)], p95: values[Math.floor(values.length*.95)], max: Math.max(...values), longTasks: window.__longTasks.filter(t => t.start >= start), stats: window.__app.stats() };
  }, seconds * 1000);
  if (action) { const until=Date.now()+seconds*1000; do { await action(); } while(Date.now()<until); }
  const result = await measuring;
  const after = await cdp.send('Performance.getMetrics');
  const old = Object.fromEntries(before.metrics.map(m => [m.name, m.value]));
  result.metrics = Object.fromEntries(after.metrics.filter(m => /Duration|JSHeapUsedSize|Nodes/.test(m.name)).map(m => [m.name, /Duration/.test(m.name) ? m.value - (old[m.name] ?? 0) : m.value]));
  await cdp.detach(); report.samples.push({ name, ...result }); await save();
  console.log(`${name}: p95=${result.p95.toFixed(1)}ms max=${result.max.toFixed(1)}ms`);
}
try {
  for (let i = 0; i < cold; i++) {
    const { ctx, page } = await context();
    const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.goto(base + route + (i % 2 ? '' : '?nointro'));
    await page.waitForFunction(() => window.__APP_READY__ && window.__app?.stats().coverage.tilesReady > 0);
    const ready = await page.evaluate(() => ({ readyMs: window.__app.stats().performance?.mapReadyMs ?? performance.now(), paints: performance.getEntriesByType('paint').map(e => ({ name:e.name, ms:e.startTime })) }));
    await page.locator('.intro').evaluateAll(els => els.forEach(el => el.remove()));
    const first3d = await mode(page, '3d');
    report.cold.push({ ...ready, first3d }); await save(); await ctx.close();
  }
  const { ctx, page } = await context();
  await page.goto(base + route + '?nointro'); await page.waitForFunction(() => window.__APP_READY__);
  report.gpu = await page.evaluate(() => { const gl=document.createElement('canvas').getContext('webgl'); const e=gl?.getExtension('WEBGL_debug_renderer_info'); return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'; });
  for (const [name, time, ll, zoom] of [
    ['raid','1939-10-05T12:00',[-25,-20],1], ['battle','1939-12-13T06:20',[-49.5,-34.5],28],
    ['scuttle','1939-12-17T20:54',[-56.25,-34.9],90], ['end','1939-12-21T12:00',[-56.25,-34.9],1],
  ]) {
    for (const view of ['2d','3d']) {
      await page.evaluate(({time,ll,zoom})=>{ const a=window.__app;a.store.set({playing:false,director:false,selectedEvent:null});a.setTime(time);a.setZoom(zoom,...ll); }, {time,ll,zoom});
      await mode(page, view); await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${name}-${view}.png`, timeout: 15000 });
      if (name === 'battle') await sample(page, `${name}-${view}-paused`);
      for (const speed of name === 'battle' ? [1,8] : [1]) {
        await page.evaluate(speed=>window.__app.store.set({playing:true,director:false,speed}),speed);
        await sample(page, `${name}-${view}-${speed}x`);
        await page.evaluate(()=>window.__app.store.set({playing:false}));
      }
    }
  }
  await mode(page,'2d');
  await page.evaluate(()=>window.__app.setTime('1939-12-13T06:20'));
  for (const zoom of [1,6,10,28,90,120]) {
    await page.evaluate(z=>window.__app.setZoom(z,-49.5,-34.5),zoom);
    await sample(page,`zoom-${zoom}`, async()=>{
      for(let i=0;i<6;i++){await page.mouse.move(850,400);await page.mouse.down();await page.mouse.move(1050,500,{steps:20});await page.mouse.up();await page.mouse.wheel(0,i%2?180:-180);await page.waitForTimeout(150);}
    });
  }
  await mode(page,'3d');
  await sample(page,'3d-orbit',async()=>{for(let i=0;i<8;i++){await page.mouse.move(800,380);await page.mouse.down();await page.mouse.move(1000,450,{steps:20});await page.mouse.up();await page.mouse.wheel(0,i%2?180:-180);}});
  const switchCdp=await ctx.newCDPSession(page);
  await switchCdp.send('Performance.enable');
  for(let i=0;i<20;i++) {
    const view=i%2?'3d':'2d', ms=await mode(page,view);
    await switchCdp.send('HeapProfiler.collectGarbage');
    const metrics=await switchCdp.send('Performance.getMetrics');
    report.switches.push({mode:view,ms,heapBytes:metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value,resources:await page.evaluate(()=>window.__app.stats().sandbox.memory)});
  }
  await switchCdp.detach();
  if(process.argv.includes('--soak')) {
    await page.evaluate(()=>{window.__app.setTime('1939-12-13T06:20');window.__app.store.set({playing:true,director:false,speed:1});window.__soakLoops=0;window.__soakTimer=setInterval(()=>{if(!window.__app.store.get().playing){window.__app.resetScene('1939-12-13T06:20');window.__app.store.set({playing:true,director:false,speed:1});window.__soakLoops++;}},250);});
    const cdp=await ctx.newCDPSession(page);await cdp.send('Performance.enable');
    for(let i=0;i<=10;i++){if(i)await page.waitForTimeout(60000);await cdp.send('HeapProfiler.collectGarbage');report.soak.push({minute:i,metrics:await cdp.send('Performance.getMetrics'),stats:await page.evaluate(()=>({...window.__app.stats(),soakLoops:window.__soakLoops}))});await save();console.log(`soak ${i}/10`);}
    await cdp.detach();
  }
  await save(); await ctx.close();
} finally { await save(); await browser.close(); }
