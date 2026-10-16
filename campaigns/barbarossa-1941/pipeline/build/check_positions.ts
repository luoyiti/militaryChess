/**
 * 部队位置与控制区一致性检查：轴心国部队不应深入苏方控制区，苏军（未被合围）不应深入轴心国占领区。
 * 每天 20:00 抽样，用与浏览器相同的 SDF 场（同 tests/helpers 的 fieldModelFor）判断部队所在格子属于哪一方。
 *   npx tsx campaigns/barbarossa-1941/pipeline/build/check_positions.ts [--km 25] [--side DE] [--file north] [--all]
 * 只是提示：前线附近的推进与渗透是正常的，阈值缺省 25 km；被合围、已覆灭的部队与集团军群/方面军不检查。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCampaign, publicDir } from '../../../../tools/lib/campaign-node';
import { buildDB } from '../../../../engine/data/db';
import { createModel, fieldAt, theaterAt, sample, type KFInput } from '../../../../engine/geo/field/field';
import { fieldCfg, toGrid } from '../../../../engine/geo/field/client';
import { unitStateAt } from '../../../../engine/model/core';
import { isoToHours, hoursToDate } from '../../../../engine/core/time';
import { FRAME, GRID } from '../../../../engine/geo/frame';
import { ECHELON_RANK, TERMINAL_STATUSES } from '../../../../engine/core/types';

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const KM = Number(opt('km') ?? 25);
const onlySide = opt('side');
const showAll = args.includes('--all');

const def = loadCampaign('barbarossa-1941');
const o = { def, m: def.manifest, db: buildDB(def.data, def.manifest) };
const buf = readFileSync(join(publicDir('barbarossa-1941'), 'geo/field_masks.bin'));
const kfs: KFInput[] = o.db.keyframes.map((k) => ({
  h: k.h,
  a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
  b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
  ...(k.transition ? { transition: k.transition } : {}),
}));
const model = createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), kfs,
  Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)), fieldCfg(o.m.control));
const kmPerCell = FRAME.kmPerUnit * GRID.cell;
const lim = KM / kmPerCell;
const g = { w: GRID.w, h: GRID.h, cell: GRID.cell };

// 部队来自哪个文件（便于把问题交给对应的代理）
const fileOf = new Map<string, string>();
for (const [k, v] of Object.entries(o.def.data)) if (k.includes('/oob/')) for (const u of v as { id: string }[]) fileOf.set(u.id, k.split('/').pop()!.replace('.json', ''));

const h0 = isoToHours('1941-06-22T20:00'), h1 = isoToHours(o.m.time.end);
type Hit = { id: string; file: string; at: string; km: number; why: string; ll: [number, number] };
const hits = new Map<string, Hit[]>();
for (let h = h0; h <= h1; h += 24) {
  const fA = fieldAt(model, h, 0), fB = fieldAt(model, h, 1), T = theaterAt(model, h);
  for (const u of o.db.units.values()) {
    if (ECHELON_RANK[u.echelon] < 0) continue;
    if (onlySide && u.side !== onlySide) continue;
    const s = unitStateAt(u.id, o.db.units, h);
    if (!s || s.fade < 0.9 || TERMINAL_STATUSES.includes(s.status)) continue;
    if (s.movement === 'sea' || s.movement === 'air') continue;
    const [gx, gy] = toGrid(s.ll);
    const dT = sample(T, g, gx, gy), dA = sample(fA, g, gx, gy), dB = sample(fB, g, gx, gy);
    let why = '', d = 0;
    if (u.side !== 'SU') {
      // 在苏联战区内、且离两个占领区都超过阈值
      if (dT < -lim && dA > lim && dB > lim) { why = '轴心国部队位于苏方控制区'; d = Math.min(dA, dB); }
    } else if (s.status !== 'encircled') {
      if (dA < -lim) { why = '苏军（未标被合围）位于轴心国占领区'; d = -dA; }
      else if (dB < -lim) { why = '苏军（未标被合围）位于芬兰占领区'; d = -dB; }
    }
    if (!why) continue;
    const list = hits.get(u.id) ?? [];
    list.push({ id: u.id, file: fileOf.get(u.id) ?? '?', at: hoursToDate(h).toISOString().slice(0, 16), km: Math.round(d * kmPerCell), why, ll: [+s.ll[0].toFixed(2), +s.ll[1].toFixed(2)] });
    hits.set(u.id, list);
  }
}
const byFile = new Map<string, number>();
const rows = [...hits.values()].sort((a, b) => b.length - a.length);
for (const list of rows) byFile.set(list[0].file, (byFile.get(list[0].file) ?? 0) + 1);
console.log(`阈值 ${KM} km；${rows.length} 支部队有可疑位置（按文件：${[...byFile].map(([f, n]) => `${f} ${n}`).join('，') || '无'}）`);
for (const list of rows.slice(0, showAll ? rows.length : 60)) {
  const worst = list.reduce((a, b) => (b.km > a.km ? b : a));
  console.log(`  ${list[0].file.padEnd(9)} ${list[0].id.padEnd(22)} ${String(list.length).padStart(3)} 天，最远 ${String(worst.km).padStart(4)} km @ ${worst.at} ${JSON.stringify(worst.ll)} — ${worst.why}（首次 ${list[0].at.slice(0, 10)}，末次 ${list.at(-1)!.at.slice(0, 10)}）`);
}
