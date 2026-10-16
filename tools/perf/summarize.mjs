import { readFile, writeFile } from 'node:fs/promises';
const [beforePath='.work/river-perf/before/report.json',afterPath='.work/river-perf/after/report.json',output='.work/river-perf/summary.md']=process.argv.slice(2);
const before=JSON.parse(await readFile(beforePath,'utf8')),after=JSON.parse(await readFile(afterPath,'utf8'));
const fixed=n=>Number(n).toFixed(1), max=a=>Math.max(...a);
const checks=[];
const check=(name,pass,detail)=>checks.push({name,pass,detail});
check('完整采样',after.seconds>=30&&after.samples.length===19,`${after.samples.length}/19 groups, ${after.seconds}s each`);
check('硬件渲染',!!after.gpu&&!/unknown|swiftshader|software|llvmpipe/i.test(after.gpu),after.gpu);
check('首屏',after.cold.length>=5&&after.cold.filter(c=>c.readyMs<=3000).length>=4,after.cold.map(c=>fixed(c.readyMs)).join(', ')+' ms');
check('首次 3D',after.cold.length>=5&&after.cold.filter(c=>c.first3d<=2000).length>=4,after.cold.map(c=>fixed(c.first3d)).join(', ')+' ms');
check('模式切换',after.switches.length>=20&&after.switches.every(s=>s.ms<=300),`最大 ${fixed(max(after.switches.map(s=>s.ms)))} ms`);
const switch3d=after.switches.filter(s=>s.mode==='3d'&&s.resources&&Number.isFinite(s.heapBytes));
if(switch3d.length>=10){
  check('模式切换 GPU 资源',switch3d.every(s=>s.resources.geometries===switch3d[0].resources.geometries&&s.resources.textures===switch3d[0].resources.textures),JSON.stringify(switch3d.at(-1).resources));
  check('模式切换 retained heap',switch3d.at(-1).heapBytes-switch3d[0].heapBytes<=1024**2,`${fixed(switch3d[0].heapBytes/1024**2)} → ${fixed(switch3d.at(-1).heapBytes/1024**2)} MiB (GC 后，同为 3D)`);
}
const rows=[];
for(const s of after.samples){
  const b=before.samples.find(x=>x.name===s.name);
  const budget=s.name.includes('3d')?33:25;
  const longs=s.longTasks.filter(t=>t.ms>100);
  check(s.name,s.p95<=budget&&longs.length===0,`P95 ${fixed(s.p95)} ms; >100ms long tasks ${longs.length}`);
  rows.push(`| ${s.name} | ${b?fixed(b.p95):'—'} | ${fixed(s.p95)} | ${fixed(s.max)} | ${longs.length} |`);
}
const metric=(s,name)=>s.metrics.metrics.find(m=>m.name===name)?.value??0;
let memory='未运行十分钟持续测试。';
if(after.soak.length>=11){
  const steady=after.soak.slice(2), heaps=steady.map(s=>metric(s,'JSHeapUsedSize'));
  const first=heaps[0],last=heaps.at(-1), grow=last-first;
  const resources=steady.map(s=>s.stats.sandbox?.memory);
  const stableResources=resources.every(r=>r&&r.geometries===resources[0].geometries&&r.textures===resources[0].textures);
  check('持续播放 retained heap',grow<=Math.max(2*1024**2,first*.1),`${fixed(first/1024**2)} → ${fixed(last/1024**2)} MiB (GC 后，2–10 分钟)`);
  check('持续播放 GPU 资源',stableResources,JSON.stringify(resources));
  memory=`GC 后 retained heap：${fixed(first/1024**2)} → ${fixed(last/1024**2)} MiB（第 2–10 分钟）；GPU resources：${JSON.stringify(resources.at(-1))}。`;
}else check('十分钟持续播放',false,`${after.soak.length} samples`);
check('页面错误',after.errors.length===0,after.errors.join('; ')||'无');
const text=`# River Plate 性能测量\n\nGPU：${after.gpu}。生产预览：${after.base}；1440×900，DPR 2；每组 ${after.seconds} 秒。\n\n`+
`| 场景 | 优化前 P95 ms | 优化后 P95 ms | 优化后最长帧 ms | >100ms 主线程长任务 |\n|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\n`+
`初次基线的缩放/旋转操作只覆盖采样窗口的一部分；优化后持续操作整个窗口，因此交互项不能作为等负载的百分比改善证明。播放场景使用相同脚本和参数。帧间隔由 rAF 采样，不能单独证明 GPU 呈现延迟。\n\n${memory}\n\n`+
`## 验收\n\n${checks.map(c=>`- ${c.pass?'PASS':'FAIL'} ${c.name}：${c.detail}`).join('\n')}\n`;
await writeFile(output,text);
await writeFile(output.replace(/\.md$/,'.json'),JSON.stringify(checks,null,2));
console.log(text);
if(checks.some(c=>!c.pass))process.exitCode=1;
