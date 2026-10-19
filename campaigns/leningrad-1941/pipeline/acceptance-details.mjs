import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:4180';
const out=`output/playwright/leningrad-1941/${process.argv[3]??'production-final'}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
const result={checks:[],errors:[]};
page.on('pageerror',e=>result.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
try {
 await page.goto(`${base}/campaigns/leningrad-1941/?nointro`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__APP_READY__);
 for(const [id,zoom] of [['north',1.1],['city',5],['iskra',11],['volkhov',3.5]]) {
  await page.locator(`[data-region="${id}"]`).click();
  await page.waitForFunction(z=>Math.abs(window.__app.stats().relK-z)<.05,zoom);
 }
 result.checks.push('四个镜头入口按钮均达到配置缩放');
 await page.getByLabel('跳转日期',{exact:true}).fill('1941-11-20');
 await page.getByLabel('跳转日期',{exact:true}).dispatchEvent('change');
 await page.waitForFunction(()=>document.querySelector('.siege-rations')?.textContent.includes('250'));
 result.checks.push('日期输入实际跳转并更新分类配给');
 await page.evaluate(()=>{window.__app.resetScene('1943-01-18T12:00');window.__app.select('de.spz502');});
 await page.locator('.unit-card:not(.hidden)').waitFor();
 assert.match(await page.locator('.unit-card .uc-tab').innerText(),/作战分队/);
 assert.match(await page.locator('.unit-card h2').innerText(),/502/);
 result.checks.push('502重装甲营采用通用分队层级，不标为整团');
 await page.locator('.unit-card .card-close').click();
 await page.goto(`${base}/campaigns/leningrad-1941/`,{waitUntil:'networkidle'});
 await page.locator('.intro').waitFor(); await page.evaluate(()=>document.fonts.ready);
 const title=await page.locator('.intro h1').evaluate(el=>({height:el.offsetHeight,lineHeight:parseFloat(getComputedStyle(el).lineHeight)}));
 assert.ok(title.height <= title.lineHeight+1);
 assert.match(await page.locator('.siege-cover-credit').innerText(),/Boris Kudoyarov/);
 result.checks.push('开场中文标题完整一行，封面完整摄影署名可读');
 await page.screenshot({path:`${out}/intro-detail.png`});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}/campaigns/leningrad-1941/?nointro`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__APP_READY__);
 await page.evaluate(()=>window.__app.openEvent('e.iskra_linkup'));
 await page.locator('.event-card .ec-body.done').waitFor();
 await page.locator('.siege-evidence>summary').click();
 await page.locator('.siege-statistics').scrollIntoViewIfNeeded();
 const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,tableRight:document.querySelector('.siege-statistics table').getBoundingClientRect().right}));
 assert.ok(layout.width<=layout.viewport+1);assert.ok(layout.tableRight<=layout.viewport);
 result.mobile=layout;result.checks.push('390像素窄屏事件卡、军事统计表无横向溢出');
 await page.screenshot({path:`${out}/mobile-evidence.png`});
 assert.equal(result.errors.length,0,result.errors.join('\n'));
} catch(e) { result.failure=e.stack;process.exitCode=1; }
finally { await writeFile(`${out}/details.json`,JSON.stringify(result,null,2)+'\n'); console.log(result);await browser.close(); }
