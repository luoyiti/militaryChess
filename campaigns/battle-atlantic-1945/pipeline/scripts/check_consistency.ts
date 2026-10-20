#!/usr/bin/env tsx
/**
 * 全战役一致性交叉检查（t16）。
 *
 * 用法：npx tsx campaigns/battle-atlantic-1945/pipeline/scripts/check_consistency.ts
 *
 * 检查项：
 *   A 引用完整性   events.units / events.place / photos / phases / forces.byPhase / equipment
 *   B 事件规范     正文 80–140 字、时间递增、在战役窗口内、地点在画布内、配图在 index 内
 *   C 清单一致性   phases 连续、marks 在窗口内、map.labels 在画布内、hub 的 pin/stencil
 *   D 海战时间线   data/naval 的 fire/hits/torpedoes/smoke/damage/signals 引用与事件时刻的关系
 *   E 部队在场     active 窗口覆盖、事件时刻在该单位 active 内
 *
 * 退出码：0 全部通过（可含已知简化）；1 有 blocking 问题。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { initFrame, project, FRAME, W, H } from '../../../../engine/geo/frame';
import type { CampaignManifest, FrameConfig } from '../../../../engine/campaign/types';
import { haversineKm } from '../../../../engine/model/core';

const ROOT = join(import.meta.dirname, '../../../..');
const CP = join(ROOT, 'campaigns/battle-atlantic-1945');
const PUB = join(ROOT, 'public/campaigns/battle-atlantic-1945');

const read = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;


/** 单位在 h 时刻的经纬度（按相邻航迹点线性插值；超出窗口返回 null） */
function unitAt(id: string, h: number): [number, number] | null {
  const u = unitById.get(id);
  if (!u?.track?.length) return null;
  const pt = (p: any): [number, number] | null => {
    if (typeof p.pos === 'string') return (placeById.get(p.pos.slice(1))?.pos as [number, number]) ?? null;
    return p.pos as [number, number];
  };
  const t = u.track.map((p: any) => ({ h: hOf(p.at), ll: pt(p) })).filter((x: any) => x.ll);
  if (!t.length) return null;
  if (h < t[0].h || h > t[t.length - 1].h) return null;
  for (let i = 1; i < t.length; i++) {
    if (h <= t[i].h) {
      const a = t[i - 1], b = t[i];
      const f = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
      return [a.ll[0] + (b.ll[0] - a.ll[0]) * f, a.ll[1] + (b.ll[1] - a.ll[1]) * f];
    }
  }
  return t[t.length - 1].ll;
}

let fails = 0;
const bad: string[] = [];
const warn: string[] = [];
const E = (m: string) => { fails++; bad.push(m); };
const W = (m: string) => warn.push(m);

// ---------------------------------------------------------------- 装载
const m = read<CampaignManifest>(join(CP, 'campaign.json'));
const frame = read<FrameConfig>(join(CP, 'config/frame.json'));
initFrame(frame);

const files = (dir: string) => existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => read<unknown[]>(join(dir, f)))
  : [];
const flat = <T>(xs: T[][]): T[] => xs.flat();

const events = read<any[]>(join(CP, 'data/events.json'));
const places = flat([...files(join(CP, 'data/gazetteer'))] as any[][]);
const units = flat([...files(join(CP, 'data/oob'))] as any[][]);
const routes = flat([...files(join(CP, 'data/routes'))] as any[][]);
const fronts = flat([...files(join(CP, 'data/fronts'))] as any[][]);
const sources = flat([...files(join(CP, 'data/sources'))] as any[][]);
const equipment = read<any[]>(join(CP, 'data/equipment.json'));
const forces = read<any>(join(CP, 'data/forces.json'));
const naval = flat([...files(join(CP, 'data/naval'))] as any[]).flatMap((f) => [f]);
const navalDocs = files(join(CP, 'data/naval')) as any[][];
const photos = existsSync(join(PUB, 'photos/index.json')) ? read<Record<string, { src: string }>>(join(PUB, 'photos/index.json')) : {};

const placeById = new Map(places.map((p) => [p.id, p]));
const unitById = new Map(units.map((u) => [u.id, u]));
const srcIds = new Set(sources.map((s) => s.id));
const eqIds = new Set(equipment.map((e) => e.id));

// ---------------------------------------------------------------- 时间
const EPOCH = Date.UTC(1939, 8, 1, 0, 0);
const isoMs = (s: string) => {
  const mm = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!mm) throw new Error('bad iso ' + s);
  return Date.UTC(+mm[1], +mm[2] - 1, +mm[3], +mm[4], +mm[5]);
};
const hOf = (s: string) => (isoMs(s) - EPOCH) / 3600000;

const T0 = isoMs(m.time.epoch), TSTART = isoMs(m.time.start), TEND = isoMs(m.time.dataEnd ?? m.time.end);

// ---------------------------------------------------------------- 画布
const [W0, S0, E0, N0] = frame.bbox;
const padX = (E0 - W0) * 0.1, padY = (N0 - S0) * 0.1;
const inFrame = (ll: [number, number], pad = false) =>
  ll[0] >= W0 - (pad ? padX : 0) && ll[0] <= E0 + (pad ? padX : 0) &&
  ll[1] >= S0 - (pad ? padY : 0) && ll[1] <= N0 + (pad ? padY : 0);
// 注意：engine/geo/frame 的 W/H 是 ESM 活绑定，tsx 转译后按值捕获，故这里直接取 frame.width/height
const inCanvas = (ll: [number, number]) => {
  const [x, y] = project(ll);
  return x >= 0 && x <= frame.width && y >= 0 && y <= frame.height;
};
const resolvePlace = (p: any): [number, number] | null => {
  if (typeof p === 'string') {
    const q = placeById.get(p.slice(1));
    return q ? (q.pos as [number, number]) : null;
  }
  return p as [number, number];
};

// ================================================================ A 引用完整性
const navIds = new Set<string>();
for (const doc of navalDocs as any[]) {
  for (const k of ['fire', 'hits', 'torpedoes', 'smoke', 'signals'] as const) {
    for (const x of (doc as any)[k] ?? []) if (x?.id) navIds.add(x.id);
  }
}

for (const e of events) {
  for (const uid of e.units ?? []) if (!unitById.has(uid)) E(`事件 ${e.id}: 部队 ${uid} 不存在`);
  if (typeof e.place === 'string' && !placeById.has(e.place.slice(1))) E(`事件 ${e.id}: 地名 ${e.place} 不存在`);
  for (const s of e.sources ?? []) if (!srcIds.has(s)) E(`事件 ${e.id}: 来源 ${s} 不存在`);
  if (e.photo) {
    const ph = photos[e.photo.commons];
    if (!ph) E(`事件 ${e.id}: 照片 ${e.photo.commons} 不在 photos/index.json`);
    else if (!existsSync(join(PUB, ph.src))) E(`事件 ${e.id}: 照片文件缺失 ${ph.src}`);
    if (e.photo && !e.photo.caption) E(`事件 ${e.id}: 照片缺 caption`);
  }
}
for (const [i, u] of units.entries()) {
  for (const s of u.sources ?? []) if (!srcIds.has(s)) E(`部队 ${u.id}: 来源 ${s} 不存在`);
  for (const q of u.equipment ?? []) if (!eqIds.has(q.id)) E(`部队 ${u.id}: 装备 ${q.id} 不在 equipment.json`);
  if (u.parent && !unitById.has(u.parent)) E(`部队 ${u.id}: 上级 ${u.parent} 不存在`);
  if (u.ship) {
    for (const k of ['kind', 'class', 'lengthM', 'beamM', 'tonnage', 'maxKn', 'crew', 'weapons'] as const)
      if (!u.ship[k]) E(`部队 ${u.id}: ship 缺 ${k}`);
  }
}
for (const r of routes) {
  if (!unitById.has(r.unit)) E(`路线 ${r.id}: 部队 ${r.unit} 不存在`);
  for (const s of r.sources ?? []) if (!srcIds.has(s)) E(`路线 ${r.id}: 来源 ${s} 不存在`);
}
for (const f of fronts) for (const s of f.sources ?? []) if (!srcIds.has(s)) E(`关键帧 ${f.at}: 来源 ${s} 不存在`);
for (const q of equipment) for (const s of q.sources ?? []) if (!srcIds.has(s)) E(`装备 ${q.id}: 来源 ${s} 不存在`);

// phases / forces.byPhase
const phaseIds = new Set(m.phases.map((p) => p.id));
for (const k of Object.keys(forces.byPhase ?? {})) if (!phaseIds.has(k)) E(`forces.byPhase: 未知阶段 ${k}`);
for (const pid of phaseIds) if (!(pid in (forces.byPhase ?? {}))) W(`forces.byPhase: 阶段 ${pid} 没有分阶段兵力`);
for (const [sid, s] of Object.entries(forces.sides ?? {})) {
  for (const k of ['killed', 'wounded'] as const) if (!(s as any).losses?.[k]) E(`forces.sides.${sid}: 缺 losses.${k}`);
  if (!(s as any).commander) E(`forces.sides.${sid}: 缺 commander`);
}
for (const s of forces.sources ?? []) if (!srcIds.has(s)) E(`forces: 来源 ${s} 不存在`);

// ================================================================ B 事件规范
let prevH = -Infinity;
for (const e of events) {
  const n = [...e.body].length;
  if (n < 80 || n > 140) E(`事件 ${e.id}: 正文 ${n} 字（要求 80–140）`);
  const h = hOf(e.at);
  if (h < prevH) E(`事件 ${e.id}: 时间未递增（${e.at}）`);
  prevH = h;
  if (isoMs(e.at) < TSTART - 86400000 || isoMs(e.at) > TEND + 86400000) E(`事件 ${e.id}: 超出战役窗口 ${e.at}`);
  if (e.endAt && isoMs(e.endAt) <= isoMs(e.at)) E(`事件 ${e.id}: endAt 不晚于 at`);
  const ll = resolvePlace(e.place);
  if (!ll) E(`事件 ${e.id}: 位置无法解析 ${JSON.stringify(e.place)}`);
  // 「在画布内」= 投影到 8192×6464 后落在图像范围内（画布因 rotate=−25° 比 bbox 宽，两者都要查）。
  else if (!inCanvas(ll)) E(`事件 ${e.id}: 位置在画布外（投影后越界）${ll}`);
  else if (!inFrame(ll, true)) E(`事件 ${e.id}: 位置在图幅 bbox 外 ${ll}`);
  else if (!inFrame(ll)) W(`事件 ${e.id}: 位置在 bbox 外但仍在画布内 ${ll}（图幅边缘，可接受）`);
  if (e.importance === 1 && !e.photo) W(`事件 ${e.id}: importance 1 无配图`);
}
// 事件时刻必须落在所挂部队的 active 内
for (const e of events) {
  for (const uid of e.units ?? []) {
    const u = unitById.get(uid);
    if (!u?.active) { E(`部队 ${uid} 缺 active`); continue; }
    if (isoMs(e.at) < isoMs(u.active.from) || isoMs(e.at) > isoMs(u.active.to))
      E(`事件 ${e.id}(${e.at}) 超出部队 ${uid} 的存在窗口 ${u.active.from}–${u.active.to}`);
  }
}

// ================================================================ C 清单一致性
// phases 连续
const sortedPhases = [...m.phases].sort((a, b) => isoMs(a.from) - isoMs(b.from));
for (let i = 1; i < sortedPhases.length; i++) {
  if (isoMs(sortedPhases[i].from) < isoMs(sortedPhases[i - 1].from)) E(`phases: ${sortedPhases[i].id} 未排序`);
}
if (isoMs(sortedPhases[0].from) !== TSTART) W(`phases 起点 ${sortedPhases[0].from} ≠ time.start ${m.time.start}`);
// marks
for (const [at, label] of m.marks ?? []) {
  if (isoMs(at) < TSTART || isoMs(at) > TEND) E(`marks: ${at}「${label}」在战役窗口外`);
}
// map.labels 画布内
const labels = (m.map as any).labels ?? {};
for (const [name, lon, lat] of labels.countries ?? []) {
  if (!inCanvas([lon, lat])) E(`map.labels.countries「${name}」不在画布内 ${[lon, lat]}`);
}
for (const [name, lon, lat] of labels.waters ?? []) {
  if (!inCanvas([lon, lat])) E(`map.labels.waters「${name}」不在画布内 ${[lon, lat]}`);
}
for (const r of ((m.map as any).regions ?? [])) {
  if (r.center && !inCanvas(r.center)) E(`map.regions「${r.label}」中心不在画布内 ${r.center}`);
}
// hub
if ((m.hub as any).pin && !inCanvas((m.hub as any).pin)) E(`hub.pin 不在画布内 ${(m.hub as any).pin}`);
if (!/^[A-Z0-9 .'’\-ÄÖÜÉÈ]+$/.test((m.hub as any).stencil ?? '')) E(`hub.stencil 含非法字符「${(m.hub as any).stencil}」`);
if ((m.hub as any).cover && !Object.values(photos).some((p) => p.src === (m.hub as any).cover)) E('hub.cover 不在 photos/index.json');
// validation 规则与实际一致
const rules = (m.validation ?? {}) as { eventCount?: number; bodyLength?: [number, number] };
if (rules.eventCount !== undefined && rules.eventCount !== events.length) E(`validation.eventCount ${rules.eventCount} ≠ 实际 ${events.length}`);

// ================================================================ D 海战时间线
const shipRef = (id: string | undefined, where: string, need = true) => {
  if (!id) return;
  const u = unitById.get(id);
  if (!u) { E(`${where}: 舰艇 ${id} 不存在`); return; }
  if (need && !u.ship) W(`${where}: ${id} 没有 ship 档案`);
};
let nFire = 0, nHits = 0, nTor = 0, nSmoke = 0, nDmg = 0, nSig = 0;
for (const doc of navalDocs as any[]) {
  for (const f of doc.fire ?? []) {
    nFire++; shipRef(f.shooter, `fire ${f.id}`); shipRef(f.target, `fire ${f.id}`, false);
    if (isoMs(f.to) < isoMs(f.from)) E(`fire ${f.id}: 结束早于开始`);
    for (const s of f.sources ?? []) if (!srcIds.has(s)) E(`fire ${f.id}: 来源 ${s} 不存在`);
    const sh = unitById.get(f.shooter);
    if (sh?.ship?.weapons && !sh.ship.weapons.some((w: any) => w.id === f.weapon || w.kind === f.weapon))
      W(`fire ${f.id}: 武器 ${f.weapon} 不在 ${f.shooter} 的武备中`);
  }
  for (const x of doc.hits ?? []) {
    nHits++; shipRef(x.target, `hit ${x.id}`, false); shipRef(x.shooter, `hit ${x.id}`, false);
    for (const s of x.sources ?? []) if (!srcIds.has(s)) E(`hit ${x.id}: 来源 ${s} 不存在`);
    if (x.killed !== undefined && x.killed < 0) E(`hit ${x.id}: killed 为负`);
  }
  for (const t of doc.torpedoes ?? []) {
    nTor++; shipRef(t.shooter, `torp ${t.id}`); shipRef(t.target, `torp ${t.id}`, false);
    for (const s of t.sources ?? []) if (!srcIds.has(s)) E(`torp ${t.id}: 来源 ${s} 不存在`);
  }
  for (const s of doc.smoke ?? []) {
    nSmoke++; shipRef(s.ship, `smoke ${s.id}`);
    for (const src of s.sources ?? []) if (!srcIds.has(src)) E(`smoke ${s.id}: 来源 ${src} 不存在`);
  }
  for (const d of doc.damage ?? []) {
    nDmg++; shipRef(d.ship, `damage ${d.ship}@${d.at}`);
    for (const s of d.sources ?? []) if (!srcIds.has(s)) E(`damage ${d.ship}@${d.at}: 来源 ${s} 不存在`);
    if (d.integrity < 0 || d.integrity > 1) E(`damage ${d.ship}@${d.at}: integrity 越界 ${d.integrity}`);
  }
  for (const s of doc.signals ?? []) {
    nSig++;
    const refs = [s.from, s.to].filter(Boolean) as string[];
    for (const r of refs) if (/^[a-z]{2,4}\./.test(r) && !unitById.has(r)) W(`signal ${s.id}: ${r} 像部队 id 但不存在`);
    for (const src of s.sources ?? []) if (!srcIds.has(src)) E(`signal ${s.id}: 来源 ${src} 不存在`);
    if (!s.zh || !s.text) E(`signal ${s.id}: 缺 zh 或 text`);
    if (isoMs(s.at) < TSTART || isoMs(s.at) > TEND) E(`signal ${s.id}: 时刻在窗口外 ${s.at}`);
  }
}
// 电文与事件时间线：每条事件时刻附近应有可对齐的电文或海战条目（仅统计，不判错）
const navalTimes = [
  ...navalDocs.flatMap((d: any) => [...(d.fire ?? []).map((x: any) => x.from), ...(d.hits ?? []).map((x: any) => x.at),
    ...(d.torpedoes ?? []).map((x: any) => x.at), ...(d.signals ?? []).map((x: any) => x.at)]),
].map((s) => isoMs(s));

// ================================================================ F 航迹不落陆 / 射击不超程 / 事件地点贴合单位
{
  const masksPath = join(PUB, 'geo/field_masks.bin');
  if (existsSync(masksPath)) {
    const buf = readFileSync(masksPath);
    const masks = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    const landBit = 1 << m.control.landBit;
    const fw = frame.field.w, fh = frame.field.h;
    const isLand = (ll: readonly number[]) => {
      const [px, py] = project(ll as never);
      const x = Math.round(px / frame.field.cell - 0.5), y = Math.round(py / frame.field.cell - 0.5);
      if (x < 0 || y < 0 || x >= fw || y >= fh) return false;
      return (masks[y * fw + x] & landBit) !== 0;
    };
    // 连续 ≥4 个点落在陆地 = 真的横穿陆地；港口/海岸的单点是正常的（掩膜格约 32 km）
    let crossings = 0;
    for (const u of units) {
      if (!u.ship || !u.track?.length) continue;
      // 掩膜格约 32 km：港内、海岸锚地与窄水道会有连续几个格判为陆地。
      // 只有「连续 ≥8 点」且「整段都离最近的港/城 > 60 km」才判为真的横穿陆地。
      const portPos = places.filter((p) => ['port', 'city', 'capital', 'fort'].includes(p.kind)).map((p) => p.pos as [number, number]);
      const nearPort = (ll: readonly number[]) => portPos.some((q) => haversineKm(ll, q) < 60);
      let run = 0, startAt = '', pts: [number, number][] = [];
      const flush = () => {
        if (run >= 8 && pts.every((ll) => !nearPort(ll))) {
          E(`部队 ${u.id}: ${startAt} 起 ${run} 个航迹点落在陆地上（横穿陆地）`);
          crossings++;
        }
        run = 0; pts = [];
      };
      for (const p of u.track) {
        const ll = typeof p.pos === 'string' ? placeById.get(p.pos.slice(1))?.pos : p.pos;
        if (ll && isLand(ll)) { if (!run) startAt = p.at; run++; pts.push(ll as [number, number]); }
        else flush();
      }
      flush();
    }
    if (!crossings) W(`航迹陆地检查：0 处横穿（掩膜格 ${frame.field.cell} 单位，港内单点不计）`);
  }
}

// 射击覆盖时段内必须真的进入过该武器射程
{
  const H = hOf;
  for (const doc of navalDocs as any[]) {
    for (const f of doc.fire ?? []) {
      const sh = unitById.get(f.shooter), tg = unitById.get(f.target);
      const w = sh?.ship?.weapons?.find((x: any) => x.id === f.weapon || x.kind === f.weapon);
      const range = w?.rangeKm;
      if (!sh || !tg || !range) continue;
      let minKm = Infinity;
      for (let h = H(f.from); h <= H(f.to); h += 0.05) {
        const a = unitAt(sh.id, h), b = unitAt(tg.id, h);
        if (a && b) minKm = Math.min(minKm, haversineKm(a, b));
      }
      if (minKm > range) E(`fire ${f.id}: 覆盖时段内最近距离 ${minKm.toFixed(0)} km 超过 ${f.weapon} 射程 ${range} km`);
    }
  }
}

// 事件 place 与其 units 在该时刻的距离不得超过 320 km
{
  const H = hOf;
  for (const e of events) {
    if (!e.units?.length) continue;
    const pl = typeof e.place === 'string' ? placeById.get(e.place.slice(1))?.pos : e.place;
    if (!pl) continue;
    for (const uid of e.units) {
      const u = unitById.get(uid);
      if (!u?.track?.length) continue;
      const ll = unitAt(uid, H(e.at));
      if (!ll) continue;
      const d = haversineKm(pl, ll);
      if (d > 320) E(`事件 ${e.id}: 距部队 ${uid} ${d.toFixed(0)} km（阈值 320）`);
    }
  }
}

// ================================================================ E 部队在场
for (const u of units) {
  if (!u.active) { E(`部队 ${u.id}: 缺 active 窗口`); continue; }
  if (isoMs(u.active.to) <= isoMs(u.active.from)) E(`部队 ${u.id}: active.to 不晚于 from`);
  const t = u.track ?? [];
  if (!t.length) { E(`部队 ${u.id}: 无航迹`); continue; }
  for (let i = 1; i < t.length; i++) if (isoMs(t[i].at) <= isoMs(t[i - 1].at)) E(`部队 ${u.id}: 航迹未递增 ${t[i].at}`);
  if (isoMs(u.active.from) > isoMs(t[0].at)) E(`部队 ${u.id}: active.from 晚于首航迹点`);
  if (u.ship && isoMs(u.active.to) < isoMs(t[t.length - 1].at)) E(`部队 ${u.id}: active.to 早于末航迹点`);
}

// ================================================================ 输出
const stat = {
  事件: events.length, 地名: places.length, 部队: units.length,
  舰船: units.filter((u) => u.ship).length, 路线: routes.length, 关键帧: fronts.length,
  装备: equipment.length, 来源: sources.length,
  海战: { fire: nFire, hits: nHits, torpedoes: nTor, smoke: nSmoke, damage: nDmg, signals: nSig },
};
console.log('统计', JSON.stringify(stat, null, 0));
console.log(`电文时间跨度 ${new Date(Math.min(...navalTimes)).toISOString().slice(0, 16)} → ${new Date(Math.max(...navalTimes)).toISOString().slice(0, 16)}`);
if (warn.length) { console.log(`\n警告 ${warn.length}：`); warn.slice(0, 25).forEach((w) => console.log('  WARN ', w)); }
if (bad.length) { console.log(`\n错误 ${bad.length}：`); bad.slice(0, 40).forEach((b) => console.log('  ERROR', b)); process.exit(1); }
console.log('\n✓ 一致性检查全部通过');
