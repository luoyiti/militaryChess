import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5180';
const tag = process.argv[3] ?? 'dev';
const out = `output/playwright/leningrad-1941/${tag}`;
await mkdir(out, { recursive: true });
const report = { base, viewport: [1440, 900], dpr: 2, browser: 'System Chrome, headed, hardware rendering', browserPlugin: 'Browser plugin not available; repository Playwright workflow used', errors: [], warnings: [], checks: [], scenes: [], performance: [], loops: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: false });
report.browserVersion = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); else if (m.type() === 'warning') report.warnings.push(m.text()); });
page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) report.errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });
const save = () => writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
const check = (name, evidence) => report.checks.push({ name, pass: true, evidence });
const settle = () => page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.allSettled(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});
async function scene(at, center = [30.7, 59.85], zoom = 4.8) {
  const before = await page.evaluate(({ at, center, zoom }) => { const a = window.__app, old = a.stats(); a.resetScene(at); a.setCamera(zoom, ...center); return { n: old.geomCount, t: old.t }; }, { at, center, zoom });
  if (await page.evaluate(t => window.__app.stats().t !== t, before.t)) await page.waitForFunction(n => window.__app.stats().geomCount > n, before.n, { timeout: 60000 });
  await settle();
}
async function sample(mode, speed) {
  await scene('1944-01-14T12:00', [30.15, 59.5], 3.8);
  const result = await page.evaluate(async ({ speed }) => {
    const app = window.__app, frames = []; let previous = performance.now(), start = previous;
    app.store.set({ playing: true, speed, director: false });
    await new Promise(resolve => { const frame = now => { frames.push(now - previous); previous = now; if (now - start < 3500) requestAnimationFrame(frame); else resolve(); }; requestAnimationFrame(frame); });
    app.store.set({ playing: false }); frames.sort((a, b) => a - b);
    return { frames: frames.length, p50: frames[Math.floor(frames.length * .5)], p95: frames[Math.floor(frames.length * .95)], max: Math.max(...frames), stats: app.stats() };
  }, { speed });
  report.performance.push({ mode, speed, ...result });
  console.log(`${mode} ${speed}x P95 ${result.p95.toFixed(1)}ms`);
}
try {
  await page.goto(`${base}/campaigns/leningrad-1941/?nointro`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__APP_READY__ === true, null, { timeout: 90000 });
  assert.match(await page.title(), /列宁格勒围城战/);
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  const data = await page.evaluate(() => { const a = window.__app; return { campaign: a.campaign, events: a.db.events.length, units: a.db.units.size, places: a.db.gaz.size, sources: a.db.sources.size, keyframes: a.db.keyframes.length }; });
  assert.equal(data.campaign, 'leningrad-1941'); assert.ok(data.events >= 98 && data.units >= 85 && data.places >= 100 && data.sources >= 60 && data.keyframes >= 40);
  report.data = data;
  report.renderer = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return gl.getParameter(e.UNMASKED_RENDERER_WEBGL); });
  assert.doesNotMatch(report.renderer, /SwiftShader|llvmpipe/i);
  check('页面身份、有效内容及硬件渲染', { data, renderer: report.renderer });
  for (const s of [
    ['prelude','1941-06-22T12:00',[27.9,58.5],1.1], ['encirclement','1941-09-08T20:00',[30.55,59.9],4.8],
    ['winter','1941-11-22T12:00',[31.1,60.0],5], ['lyuban','1942-06-25T12:00',[31.25,58.9],5],
    ['iskra','1943-01-18T20:00',[31.17,59.92],11], ['corridor','1943-09-18T12:00',[31.15,59.88],10],
    ['liberation','1944-01-27T20:00',[30.25,59.65],4],
  ]) {
    await scene(s[1],s[2],s[3]); await page.screenshot({ path: `${out}/${s[0]}.png` });
    const stats = await page.evaluate(() => window.__app.stats()); assert.equal(stats.coverage.tileErrors, 0);
    report.scenes.push({ name:s[0], at:s[1], stats }); await save();
  }
  await scene('1941-06-22T12:00'); assert.equal(await page.locator('.siege-rations').count(), 0);
  await scene('1941-11-20T12:00'); assert.match(await page.locator('.siege-rations').innerText(), /250[\s\S]*125/);
  await page.locator('.siege-civic>summary').click();
  await scene('1941-11-21T12:00'); assert.equal(await page.locator('.siege-civic').getAttribute('open'), null);
  await scene('1941-12-25T12:00'); assert.match(await page.locator('.siege-rations').innerText(), /350[\s\S]*200/);
  await scene('1942-12-25T12:00');
  let layers = await page.evaluate(() => window.__app.store.get().layers);
  assert.equal(layers.siegeWaterVisible, true); assert.equal(layers.siegeIceVisible, true); assert.equal(layers.siegeRailVisible, false);
  assert.equal(layers.siegeWaterShortVisible, true); assert.equal(layers.siegeWaterLongVisible, false);
  assert.equal(await page.locator('.ov-siegeWaterShortVisible').evaluate(el => getComputedStyle(el).display), 'inline');
  assert.equal(await page.locator('.ov-siegeWaterLongVisible').evaluate(el => getComputedStyle(el).display), 'none');
  await scene('1941-09-12T12:00');
  layers = await page.evaluate(() => window.__app.store.get().layers);
  assert.equal(layers.siegeWaterLongVisible, true); assert.equal(layers.siegeWaterShortVisible, false);
  await scene('1943-02-07T12:00'); assert.equal(await page.evaluate(() => window.__app.store.get().layers.siegeRailVisible), true);
  await page.getByLabel('交通线路显示模式').selectOption('history');
  await scene('1941-09-08T12:00'); assert.equal(await page.getByLabel('交通线路显示模式').inputValue(), 'history');
  assert.equal(await page.evaluate(() => window.__app.store.get().layers.siegeRailVisible), true);
  await page.getByRole('button', { name:'图例', exact:true }).click(); await page.locator('input[data-l="logistics"]').uncheck();
  await scene('1943-02-07T12:00');
  layers = await page.evaluate(() => window.__app.store.get().layers); assert.equal(layers.logistics, false); assert.equal(layers.siegeRailVisible, false);
  await page.locator('input[data-l="logistics"]').check(); await page.getByRole('button', { name:'简报', exact:true }).click();
  await page.getByLabel('交通线路显示模式').selectOption('time');
  await scene('1944-01-31T12:00'); assert.match(await page.locator('.siege-heading').innerText(), /872天/);
  check('分类口粮、回跳、重叠航季、图层偏好与折叠状态', '通过UI切换模式及总开关；章节重建后偏好保留，解围后计时固定');
  await page.evaluate(() => window.__app.openEvent('e.ration_125g'));
  await page.locator('.event-card .ec-body.done').waitFor();
  assert.match(await page.locator('.event-card .ec-date').innerText(), /当日/);
  await page.locator('.siege-evidence>summary').click(); assert.ok(await page.locator('.siege-evidence').innerText().then(t => t.length > 150));
  assert.ok(await page.locator('.event-card .ec-src a').count() > 0);
  await page.screenshot({ path:`${out}/evidence.png` }); await page.locator('.event-card .card-close').click();
  await page.evaluate(() => window.__app.openEvent('e.iskra_linkup'));
  await page.locator('.event-card .ec-body.done').waitFor();
  await page.locator('.siege-evidence>summary').click();
  assert.match(await page.locator('.siege-evidence').innerText(), /走廊/);
  assert.match(await page.locator('.siege-statistics').innerText(), /302,800/);
  assert.match(await page.locator('.siege-statistics').innerText(), /不可恢复/);
  await page.locator('.siege-photo-evidence>summary').click();
  assert.match(await page.locator('.siege-photo-evidence').innerText(), /Dmitriy Kozlov/);
  assert.match(await page.locator('.siege-photo-evidence').innerText(), /WebP/);
  await page.screenshot({path:`${out}/iskra-evidence.png`});
  await page.locator('.event-card .card-close').click();
  await page.locator('[data-chapter="iskra"]').click(); await settle();
  assert.match(await page.locator('.tb-phase').innerText(), /火花/);
  await page.getByRole('button', { name:'战斗序列', exact:true }).click();
  await page.getByPlaceholder('搜索部队 / 指挥官…').fill('第67集团军'); assert.ok(await page.locator('.sb-tree').innerText().then(t=>t.includes('第67集团军')));
  await page.evaluate(() => window.__app.select('su.67a'));
  await page.locator('.unit-card:not(.hidden)').waitFor();
  assert.match(await page.locator('.unit-card h2').innerText(), /67/);
  assert.match(await page.locator('.unit-card .uc-hist').innerText(), /1942/);
  await page.screenshot({path:`${out}/unit-card.png`});
  await page.locator('.unit-card .card-close').click();
  await page.getByRole('button', { name:'简报', exact:true }).click();
  check('事件档案、来源展开、章节与部队搜索', '日精度、史料链接和深入阅读可操作');
  await scene('1943-01-18T20:00',[31.17,59.92],8);
  await page.getByRole('button',{name:'3D 沙盘',exact:true}).click();
  await page.waitForFunction(() => window.__app.stats().sandbox?.ready && window.__app.stats().sandbox.calls > 0, null, {timeout:90000});
  await page.evaluate(() => window.__app.setCamera(7,31.17,59.92)); await settle();
  await page.screenshot({path:`${out}/sandbox.png`}); report.sandbox=await page.evaluate(()=>window.__app.stats().sandbox);
  assert.ok(report.sandbox.tris > 0); check('3D沙盘',report.sandbox);
  await page.getByRole('button', { name:'图例', exact:true }).click();
  await page.locator('input[data-l="logistics"]').uncheck();
  await scene('1943-02-07T12:00', [31.17,59.92], 7);
  assert.equal(await page.evaluate(() => window.__app.store.get().layers.siegeRailVisible), false);
  await page.getByRole('button',{name:'作战地图',exact:true}).click(); await settle();
  assert.equal(await page.locator('.ov-siegeWaterShortVisible').evaluate(el => getComputedStyle(el).display), 'none');
  await page.locator('input[data-l="logistics"]').check();
  await page.getByRole('button',{name:'3D 沙盘',exact:true}).click(); await settle();
  await sample('3d',1); await sample('3d',8);
  await page.getByRole('button',{name:'作战地图',exact:true}).click(); await sample('2d',1); await sample('2d',8);
  const cdp=await context.newCDPSession(page); await cdp.send('Performance.enable');
  for(let loop=0;loop<3;loop++) {
    for(const at of ['1941-06-22T12:00','1941-11-22T12:00','1943-01-18T12:00','1944-01-27T20:00']) await scene(at,[30.7,59.85],4.8);
    await page.evaluate(()=>window.__app.setMode('3d')); await settle(); await page.evaluate(()=>window.__app.setMode('2d')); await settle();
    await cdp.send('HeapProfiler.collectGarbage'); const m=await cdp.send('Performance.getMetrics');
    report.loops.push({loop:loop+1,mainHeapBytes:m.metrics.find(x=>x.name==='JSHeapUsedSize')?.value,stats:await page.evaluate(()=>window.__app.stats())}); await save();
  }
  await cdp.detach(); check('连续跳时、1×/8×播放与三轮切换','已采集帧间隔及主线程堆；Worker的有界关键帧缓存不计入此堆指标');
  const soakCDP = await context.newCDPSession(page); await soakCDP.send('Performance.enable');
  const endTime = await page.evaluate(() => { window.__app.resetScene('1944-01-31T23:59'); return window.__app.store.get().t; });
  report.fullPlaybacks = [];
  for (let cycle = 1; cycle <= 3; cycle++) {
    await scene('1941-06-22T00:00', [27.9,58.5], 1.1);
    const started = Date.now();
    await page.evaluate(() => window.__app.store.set({speed:8,director:false,playing:true}));
    await page.waitForFunction(end => window.__app.store.get().t >= end - .01, endTime, {timeout:120000,polling:200});
    await page.evaluate(() => window.__app.store.set({playing:false})); await settle();
    await soakCDP.send('HeapProfiler.collectGarbage'); const metrics = await soakCDP.send('Performance.getMetrics');
    const result = {cycle,elapsedMs:Date.now()-started,mainHeapBytes:metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value,stats:await page.evaluate(()=>window.__app.stats())};
    report.fullPlaybacks.push(result); await save(); console.log(`Full 8x playback ${cycle}: ${result.elapsedMs}ms; main heap ${result.mainHeapBytes}`);
  }
  await soakCDP.detach(); check('三轮完整8×回放','每轮从1941年6月22日播放至1944年1月31日；结束后GC采样，不跳过中间阶段');
  await page.setViewportSize({width:390,height:844}); await page.goto(`${base}/campaigns/leningrad-1941/?nointro`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__APP_READY__,null,{timeout:90000}); assert.equal(await page.locator('.sidebar.collapsed').count(),1);
  await scene('1943-01-18T12:00',[31.17,59.92],6); await page.screenshot({path:`${out}/mobile-map.png`});
  await page.locator('.sb-collapse').click(); await page.locator('.siege-panel').scrollIntoViewIfNeeded(); await page.screenshot({path:`${out}/mobile-panel.png`});
  const mobile=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth})); assert.ok(mobile.width <= mobile.viewport+1); report.mobile=mobile;
  check('窄屏布局',mobile);
  await page.setViewportSize({width:1440,height:900}); await page.goto(`${base}/campaigns/leningrad-1941/`,{waitUntil:'networkidle'});
  await page.locator('.intro').waitFor(); await settle(); await page.screenshot({path:`${out}/intro.png`});
  await page.getByRole('button',{name:'进入作战室 · 自动推演',exact:true}).click(); await page.locator('.intro').waitFor({state:'detached'});
  await page.locator('.event-card .ec-body.done').waitFor(); assert.match(await page.locator('.event-card .ec-title').innerText(),/北方集团军群/);
  check('开场与导演推演','开场进入后自动呈现夏季序章首个事件');
  await page.evaluate(()=>window.__app.resetScene('1944-01-27T20:00')); await page.getByRole('button',{name:'资料',exact:true}).click();
  await page.getByRole('heading',{name:'资料来源与许可',exact:true}).waitFor(); assert.ok(await page.locator('.src-list li').count()>=60);
  check('来源与许可面板',{sourceCount:await page.locator('.src-list li').count()});
  await page.goto(`${base}/`,{waitUntil:'networkidle'}); await page.getByRole('button',{name:'列宁格勒围城战',exact:true}).click();
  const enter=page.getByRole('link',{name:'自由浏览',exact:true}); assert.match(await enter.getAttribute('href'),/campaigns\/leningrad-1941/);
  await settle(); await page.screenshot({path:`${out}/hub.png`}); await enter.click();
  await page.waitForFunction(()=>window.__APP_READY__,null,{timeout:90000}); check('总台卷宗进入战役',await page.url());
  await page.locator('.tb-back').click(); await page.getByRole('button',{name:'列宁格勒围城战',exact:true}).waitFor();
  check('返回导航','由战役工具栏返回作战总台');
  assert.equal(report.errors.length,0,report.errors.join('\n')); check('控制台与本地资源健康','无页面异常、控制台错误或HTTP失败');
} catch(error) { report.failure=error.stack; console.error(error); await page.screenshot({path:`${out}/failure.png`}).catch(()=>{}); process.exitCode=1; }
finally { await save(); console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,failure:report.failure,performance:report.performance.map(({mode,speed,p95,max})=>({mode,speed,p95,max})),loops:report.loops.map(({loop,mainHeapBytes})=>({loop,mainHeapBytes})),fullPlaybacks:report.fullPlaybacks?.map(({cycle,elapsedMs,mainHeapBytes})=>({cycle,elapsedMs,mainHeapBytes}))},null,2)); await browser.close(); }
