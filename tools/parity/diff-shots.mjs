/**
 * 截图像素对比 + 并排 HTML 报告。
 *   node tools/parity/diff-shots.mjs <baselineDir> <newDir> <outDir> [--threshold 0.02]
 * 每张图：差异像素比例（任一通道差 > 24 视为不同）；输出 diff 热图与 report.html / report.json。
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const [baseDir, newDir, outDir] = process.argv.slice(2);
const ti = process.argv.indexOf('--threshold');
const threshold = ti > 0 ? Number(process.argv[ti + 1]) : 0.02;
fs.mkdirSync(outDir, { recursive: true });
const names = fs.readdirSync(baseDir).filter((f) => f.endsWith('.png')).sort();
const rows = [];
for (const name of names) {
  const bp = path.join(baseDir, name), np = path.join(newDir, name);
  if (!fs.existsSync(np)) { rows.push({ name, missing: true }); continue; }
  const a = PNG.sync.read(fs.readFileSync(bp)), b = PNG.sync.read(fs.readFileSync(np));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const d = new PNG({ width: w, height: h });
  let diff = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ia = (y * a.width + x) * 4, ib = (y * b.width + x) * 4, id = (y * w + x) * 4;
    const delta = Math.max(Math.abs(a.data[ia] - b.data[ib]), Math.abs(a.data[ia + 1] - b.data[ib + 1]), Math.abs(a.data[ia + 2] - b.data[ib + 2]));
    const g = (a.data[ia] + a.data[ia + 1] + a.data[ia + 2]) / 3;
    if (delta > 24) { diff++; d.data[id] = 230; d.data[id + 1] = 30; d.data[id + 2] = 40; d.data[id + 3] = 255; }
    else { d.data[id] = d.data[id + 1] = d.data[id + 2] = 160 + g * 0.35; d.data[id + 3] = 255; }
  }
  fs.writeFileSync(path.join(outDir, `diff-${name}`), PNG.sync.write(d));
  rows.push({ name, ratio: diff / (w * h), sizeMismatch: a.width !== b.width || a.height !== b.height });
}
const fail = rows.filter((r) => r.missing || r.ratio > threshold);
const rel = (p) => path.relative(outDir, p);
const html = `<!doctype html><meta charset="utf-8"><title>Parity report</title>
<style>body{font:13px system-ui;margin:16px;background:#f4efe2}h1{font-size:18px}table{border-collapse:collapse}td{padding:6px;vertical-align:top;border-bottom:1px solid #ccc}img{width:420px;display:block}.bad{color:#b3262e;font-weight:700}</style>
<h1>截图对比：${rows.length} 张，超出阈值 ${(threshold * 100).toFixed(1)}%：${fail.length} 张</h1>
<table><tr><th>名称</th><th>旧版</th><th>统一引擎</th><th>差异</th></tr>
${rows.map((r) => `<tr><td class="${r.missing || r.ratio > threshold ? 'bad' : ''}">${r.name}<br>${r.missing ? '缺失' : (r.ratio * 100).toFixed(2) + '%'}</td><td><img src="${rel(path.join(baseDir, r.name))}"></td><td><img src="${rel(path.join(newDir, r.name))}"></td><td>${r.missing ? '' : `<img src="diff-${r.name}">`}</td></tr>`).join('')}
</table>`;
fs.writeFileSync(path.join(outDir, 'report.html'), html);
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ threshold, rows }, null, 2));
for (const r of rows) console.log(`${r.missing ? 'MISSING' : (r.ratio * 100).toFixed(2).padStart(6) + '%'}  ${r.name}`);
console.log(fail.length ? `✗ ${fail.length} 张超出阈值` : '✓ 全部在阈值内');
process.exit(fail.length ? 1 : 0);
