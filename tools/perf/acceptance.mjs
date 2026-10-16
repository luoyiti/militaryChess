import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const base=arg('--base','http://127.0.0.1:4180'), out=arg('--out','.work/river-perf/acceptance');
const baseline=process.argv.includes('--baseline');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false});
const results={checks:[],errors:[]};
const check=(name,pass,details)=>{results.checks.push({name,pass,details});if(!pass)console.error(name,details);};
const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
await ctx.addInitScript(()=>{let seed=1939;Math.random=()=>((seed=Math.imul(1664525,seed)+1013904223|0)>>>0)/4294967296;});
// Local offline usage: allow local static assets, reject all external network requests.
await ctx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
const page=await ctx.newPage();page.on('pageerror',e=>results.errors.push(e.message));
async function load(id='river-plate-1939',time='1939-12-13T06:20'){
  await page.goto(`${base}/campaigns/${id}/?nointro&t=${time}`);
  await page.waitForFunction(()=>window.__APP_READY__);
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
}
try {
  for(const [name,time,ll,z] of [
    ['raid','1939-10-05T12:00',[-25,-20],1],['battle','1939-12-13T06:20',[-49.5,-34.5],28],
    ['scuttle','1939-12-17T20:54',[-56.25,-34.9],90],['end','1939-12-21T12:00',[-56.25,-34.9],1],
  ]) {
    await load('river-plate-1939',time);
    await page.evaluate(({ll,z})=>window.__app.setZoom(z,...ll),{ll,z});await page.waitForTimeout(400);
    await page.screenshot({path:`${out}/${name}-2d.png`});
    await page.evaluate(()=>window.__app.setMode('3d'));await page.waitForFunction(()=>window.__app.stats().sandbox?.ready);
    await page.waitForTimeout(300);await page.screenshot({path:`${out}/${name}-3d.png`});
    check(`${name}-ready`,await page.evaluate(()=>window.__app.stats().sandbox?.ready));
  }
  if(!baseline){
    await load();
    await page.evaluate(()=>{window.__app.resetScene('1939-12-13T06:20');window.__app.setMode('3d');});
    await page.waitForFunction(()=>window.__app.stats().sandbox?.ready);
    const before=await page.evaluate(()=>{window.__app.store.set({playing:true,director:false});return window.__app.stats();});
    await page.waitForTimeout(1500);
    const during=await page.evaluate(()=>window.__app.stats());
    check('hidden-2d-no-updates',during.performance.updates2d===before.performance.updates2d,{before:before.performance,after:during.performance});
    check('hidden-2d-no-draws',during.naval.renders===before.naval.renders&&during.performance.mapDraws===before.performance.mapDraws);
    // Automated Chrome keeps document visible even when its window is minimized.
    // Exercise the native visibilitychange handler with an explicit test-only visibility input.
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    const paused=await page.evaluate(()=>({hidden:document.hidden,stats:window.__app.stats()}));await page.waitForTimeout(700);
    const paused2=await page.evaluate(()=>window.__app.stats());
    check('visibility-handler-stops-rendering',paused.hidden&&paused.stats.sandbox.frames===paused2.sandbox.frames,{simulatedVisibility:true});
    check('visibility-handler-stops-clock',paused.stats.t===paused2.t);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);
    check('foreground-resumes',await page.evaluate(n=>window.__app.stats().sandbox.frames>n,paused2.sandbox.frames));
    await page.evaluate(()=>{window.__app.store.set({playing:false});window.__app.setTime('1939-12-13T07:26');window.__app.select('gb.ajax');window.__app.setMode('2d');});
    await page.waitForTimeout(400);
    check('return-synchronizes-selection',await page.evaluate(()=>window.__app.stats().naval.selected==='gb.ajax'));
    // A burst of invalidations must produce no more than one naval draw per animation frame.
    const coalescing=await page.evaluate(async()=>{
      window.__app.select(null);await new Promise(r=>setTimeout(r,100));const first=window.__app.stats().naval.renders;
      for(let i=0;i<12;i++)window.__app.setZoom(28+i*.01,-49.5,-34.5);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      return window.__app.stats().naval.renders-first;
    });check('coalesced-draws',coalescing<=2,coalescing);
    await page.evaluate(()=>window.__app.resetScene('1939-12-13T06:20'));await page.waitForTimeout(150);
    const past1=await page.locator('.tl-ev.past').count();
    await page.evaluate(()=>window.__app.resetScene('1939-09-26T00:00'));await page.waitForTimeout(150);
    const fewerPast=await page.locator('.tl-ev.past').count()<past1;
    const exactBoundaries=await page.evaluate(async()=>{
      const app=window.__app, events=app.db.events;
      const times=[events.at(-1).h,events[Math.floor(events.length/2)].h,events[0].h-1,events[0].h];
      for(const t of times){
        app.store.set({t});await new Promise(r=>requestAnimationFrame(r));
        for(const el of document.querySelectorAll('.tl-ev')){
          const event=events.find(e=>e.id===el.dataset.id);
          if(el.classList.contains('past')!==(event.h<=t))return false;
        }
      }
      return true;
    });
    check('reverse-seek-timeline',fewerPast&&exactBoundaries);
    await page.evaluate(()=>window.__app.setZoom(.01));await page.waitForTimeout(150);
    check('minimum-zoom-clamped',await page.evaluate(()=>window.__app.stats().relK>=.55-1e-6));
    for (const z of [1,120]) {
      await page.evaluate(z=>window.__app.setZoom(z,-49.5,-34.5),z);
      for (const direction of [-1,1]) {
        await page.mouse.move(850,400);await page.mouse.down();await page.mouse.move(850+direction*500,550,{steps:15});await page.mouse.up();
      }
      check(`edge-pan-${z}`,await page.evaluate(()=>{const v=window.__app.stats().coverage.view;return [v.x,v.y,v.k].every(Number.isFinite);}));
    }
    await page.evaluate(()=>window.__app.setMode('3d'));await page.waitForTimeout(100);
    await page.evaluate(()=>{for(const [lon,lat] of [[-10,-10],[-56,-35],[-30,-20],[-49.5,-34.5]])window.__app.setCamera(28,lon,lat);});await page.waitForTimeout(1000);
    await page.waitForFunction(()=>window.__app.stats().sandbox.landPending===false);
    check('last-origin-wins',await page.evaluate(()=>{const s=window.__app.stats().sandbox;return Math.abs(s.origin[0]+49.5)<.01&&s.landOrigin.every((v,i)=>Math.abs(v-s.origin[i])<1e-6);}));
    await page.screenshot({path:`${out}/rapid-origin-3d.png`});
    for(const [name,width,height] of [['mobile',390,844],['high-resolution',2560,1440]]){
      await page.setViewportSize({width,height});await load();await page.evaluate(()=>window.__app.setZoom(120,-49.5,-34.5));await page.waitForTimeout(250);
      await page.screenshot({path:`${out}/${name}.png`});check(`${name}-finite`,await page.evaluate(()=>Number.isFinite(window.__app.stats().coverage.view.k)));
    }
    await page.setViewportSize({width:1440,height:900});
    for(const [id,time] of [['britain-1940','1940-09-15T12:00'],['crete-1941','1941-05-25T12:00'],['norway-1940','1940-05-20T12:00']]){
      await load(id,time);await page.screenshot({path:`${out}/${id}.png`});
      check(`${id}-2d`,await page.evaluate(()=>window.__app.stats().coverage.tilesReady>0));
      await page.evaluate(()=>window.__app.setMode('3d'));await page.waitForFunction(()=>window.__app.stats().sandbox!==null);await page.waitForTimeout(500);
      await page.evaluate(()=>window.__app.setMode('2d'));await page.waitForTimeout(200);
      check(`${id}-3d-return`,await page.locator('.map').isVisible());
    }
  }
}catch(error){results.errors.push(String(error));}finally{await writeFile(`${out}/checks.json`,JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results));
if(results.errors.length||results.checks.some(c=>!c.pass))process.exitCode=1;
