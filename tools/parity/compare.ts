/**
 * 对比旧版与统一引擎的状态导出。退出码 0 = 一致（或仅有 parity.accepted.json 中登记的差异）。
 *   npx tsx tools/parity/compare.ts <legacyState.json> <newState.json> [acceptedJson]
 */
import { readFileSync, existsSync } from 'node:fs';

const [a, b, acceptedPath] = process.argv.slice(2);
const L = JSON.parse(readFileSync(a, 'utf8'));
const N = JSON.parse(readFileSync(b, 'utf8'));
const accepted: { state?: string[] } = acceptedPath && existsSync(acceptedPath) ? JSON.parse(readFileSync(acceptedPath, 'utf8')) : {};
const problems: string[] = [];
const note = (s: string) => { if (problems.length < 60) problems.push(s); else if (problems.length === 60) problems.push('…'); };

// 计数（统一引擎的来源去重后计数，可能少于旧版的原始条数）
for (const k of Object.keys(L.counts)) {
  if (k === 'sources' || k === 'equipment') continue;
  if (L.counts[k] !== N.counts[k]) note(`counts.${k}: ${L.counts[k]} → ${N.counts[k]}`);
}
// 关键帧时刻
if (JSON.stringify(L.keyframes) !== JSON.stringify(N.keyframes)) note('keyframe times differ');
// 事件：时刻、坐标、导演缩放（旧语义 → zoomRel）
const ZOOM_REL = [1, 1, 1.35, 1.9, 2.6, 3.4, 4.4, 5.6, 7];
const evN = new Map(N.events.map((e: any) => [e.id, e]));
for (const e of L.events) {
  const n: any = evN.get(e.id);
  if (!n) { note(`event missing ${e.id}`); continue; }
  if (n.at !== e.at || n.ll.join() !== e.ll.join()) note(`event ${e.id} time/place differ`);
  if (e.zoom != null && n.zoomRel == null) note(`event ${e.id} lost zoom`);
  if (e.zoom != null && Number.isInteger(e.zoom) && n.zoomRel !== ZOOM_REL[e.zoom] && Math.abs(n.zoomRel - e.zoom) > 1e-9) note(`event ${e.id} zoom ${e.zoom} → ${n.zoomRel}`);
}
// 部队状态（旧版状态里没有 movement 时视为「未建模」，只比较前 6 项）
const norm = (v: any[] | undefined, legacyMovement: boolean) => (v ? (legacyMovement ? [...v.slice(0, 6), v[6] ?? 'land'] : v.slice(0, 6)) : v);
let diffs = 0;
const legacyHasMovement = Object.values(L.states).some((row: any) => Object.values(row).some((v: any) => v[6] != null));
for (const iso of Object.keys(L.states)) {
  const ls = L.states[iso], ns = N.states[iso] ?? {};
  for (const id of new Set([...Object.keys(ls), ...Object.keys(ns)])) {
    const x = JSON.stringify(norm(ls[id], legacyHasMovement)), y = JSON.stringify(norm(ns[id], legacyHasMovement));
    if (x !== y && !accepted.state?.includes(id)) { diffs++; note(`state ${iso} ${id}: ${x} → ${y}`); }
  }
}
// 路线进度
for (const iso of Object.keys(L.routes)) {
  if (JSON.stringify(L.routes[iso]) !== JSON.stringify(N.routes[iso])) note(`routes differ at ${iso}`);
}
// 控制区几何
for (const iso of Object.keys(L.geometry)) {
  const x = JSON.stringify(L.geometry[iso]), y = JSON.stringify(N.geometry[iso]);
  if (x !== y) note(`geometry ${iso}: ${x.slice(0, 160)} → ${y.slice(0, 160)}`);
}
if (problems.length) {
  console.log(`✗ ${problems.length} difference(s)${diffs ? `（部队状态 ${diffs}）` : ''}`);
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}
console.log(`✓ state parity: ${Object.keys(L.states).length} instants × units, ${Object.keys(L.geometry).length} geometry samples, ${L.events.length} events identical`);
