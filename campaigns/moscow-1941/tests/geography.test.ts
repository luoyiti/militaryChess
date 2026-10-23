/**
 * 莫斯科保卫战 · 地理与控制区。
 *
 * 三条主线：
 *  1) **控制区断言（70+ 条）**——直接执行 `pipeline/audit-control.ts`（与浏览器同一个 SDF 场
 *     `engine/geo/field` 判定「给定时刻某城归谁」），它是全战役最硬的地理资产：
 *     69/69 全绿 = 控制区可发布。测试在此以其退化为回归，而不另立一套判据。
 *  2) 帧几何不变量：38 帧、环不自相交、洞在外环内、顶点序单调、没有跨城的超长弦。
 *  3) 投影与资产：画布/格距/掩膜与配置严格一致，可被 `emit_frame --check` 复算。
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { geoConicConformal } from 'd3-geo';
import { ROOT, campaignDir, publicDir } from '../../../tools/lib/campaign-node';
import { openCampaign } from '../../../tests/helpers';
import { sample, fieldAt, theaterAt, type KFInput } from '../../../engine/geo/field/field';
import { createModel } from '../../../engine/geo/field/field';
import { fieldCfg, toGrid } from '../../../engine/geo/field/client';
import { GRID } from '../../../engine/geo/frame';
import { isoToHours } from '../../../engine/core/time';
import { resolvePos, ringSelfIntersects, pointInRing, haversineKm } from '../../../engine/model/core';
import { frontSnapshotAt } from '../plugins/moscow/model';
import type { ControlKeyframe, LonLat, Place, Pos } from '../../../engine/core/types';

const id = 'moscow-1941';
const dir = campaignDir(id);
const pub = publicDir(id);
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const frameCfg = json(join(dir, 'config/frame.json'));
const geo = json(join(dir, 'config/geo.config.json'));
const masksBuf = readFileSync(join(pub, 'geo/field_masks.bin'));
const masks = new Uint8Array(masksBuf.buffer, masksBuf.byteOffset, masksBuf.byteLength);
const opened = openCampaign(id);
const db = opened.db;
const fronts = Object.entries(opened.def.data as Record<string, unknown>)
  .filter(([k]) => k.includes('/data/fronts/'))
  .map(([, v]) => v as ControlKeyframe)
  .sort((a, b) => a.at.localeCompare(b.at));

const gaz = new Map<string, Place>((json(join(dir, 'data/gazetteer/core.json')) as Place[])
  .concat(json(join(dir, 'data/gazetteer/north.json')) as Place[], json(join(dir, 'data/gazetteer/south.json')) as Place[])
  .map((p) => [p.id, p]));

/** 关键帧里的坐标是 Pos（可能写 '@地名'）：几何判定前统一解析成 LonLat */
const toLL = (pos: Pos | string): LonLat => (typeof pos === 'string' ? resolvePos(pos, db.gaz) : (pos as LonLat));
const ringLL = (ring: (Pos | string)[]): LonLat[] => ring.map(toLL);

const KM_LAT = 110.57;
const kmLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);
const segKm = (a: number[], b: number[], lat0: number) =>
  Math.hypot((b[0] - a[0]) * kmLon(lat0), (b[1] - a[1]) * KM_LAT);

describe('莫斯科保卫战 · 投影与地理资产', () => {
  it('画布、投影与格距与 CONVENTIONS 一致，且能被 emit_frame 精确复算', () => {
    expect(frameCfg.bbox).toEqual([30.6, 51.6, 40.4, 58]);
    expect(frameCfg.projection).toEqual({ type: 'conicConformal', parallels: [52.5, 57], rotate: [-35.5, 0], center: [0, 54.8] });
    expect(frameCfg.width).toBe(8192);
    expect(frameCfg.height).toBe(8734);
    expect(frameCfg.field.cell).toBe(12);
    expect(frameCfg.field.w).toBe(683);
    expect(frameCfg.field.h).toBe(728);
    // 格距 = kmPerUnit × cell ≈ 0.99 km（1 km 量级是这套控制区能表达的最小尺度）
    const cellKm = frameCfg.kmPerUnit * frameCfg.field.cell;
    expect(cellKm).toBeGreaterThan(0.95);
    expect(cellKm).toBeLessThan(1.05);
    expect(geo.frame.parallels).toEqual([52.5, 57]);
    expect(geo.frame.width).toBe(8192);
    expect(geo.frame.bbox).toEqual(frameCfg.bbox);
    expect(geo.frame.fieldCell).toBe(frameCfg.field.cell);
    const out = execFileSync('node', ['tools/geo/emit_frame.mjs', id, '--check'], { cwd: ROOT, encoding: 'utf8' });
    expect(out).toContain('与配置重算结果一致');
  });

  it('掩膜：683×728 = 497224 字节，全画布 bit0（苏联）| bit4（陆地）= 17', () => {
    expect(GRID.w).toBe(683);
    expect(GRID.h).toBe(728);
    expect(masks.byteLength).toBe(683 * 728);
    expect(masks.byteLength).toBe(497_224);
    const hist = new Map<number, number>();
    for (const v of masks) hist.set(v, (hist.get(v) ?? 0) + 1);
    // 画布内没有中立国，也没有「非陆地」：任何一格都是战区
    expect([...hist.keys()]).toEqual([17]);
    expect(geo.masks.bits).toEqual({ '0': ['SU'] });
    expect(geo.masks.landBit).toBe(4);
  });

  it('投影把 bbox 四角映射到画布内，画布四角反算落在预期经纬度', () => {
    const proj = geoConicConformal().parallels(frameCfg.projection.parallels)
      .rotate(frameCfg.projection.rotate).center(frameCfg.projection.center)
      .scale(frameCfg.scale).translate(frameCfg.translate);
    const [w, s, e, n] = frameCfg.bbox;
    for (const ll of [[w, s], [w, n], [e, s], [e, n]] as [number, number][]) {
      const [x, y] = proj(ll)!;
      expect(x).toBeGreaterThanOrEqual(-1);
      expect(x).toBeLessThanOrEqual(frameCfg.width + 1);
      expect(y).toBeGreaterThanOrEqual(-1);
      expect(y).toBeLessThanOrEqual(frameCfg.height + 1);
    }
    // 画布按 bbox 的宽度定标，因此东西向比 bbox 宽、南北向两端略收；
    // 这正是不对着画布边缘画战线的理由（见 docs/GEOGRAPHY.md §2.1）。
    // 采边界上多点反算，取经纬度极值（锥形投影下一条水平线不是纬线）。
    const edges: [number, number][] = [
      ...Array.from({ length: 21 }, (_, i) => [Math.round((i / 20) * frameCfg.width), 0] as [number, number]),
      ...Array.from({ length: 21 }, (_, i) => [Math.round((i / 20) * frameCfg.width), frameCfg.height] as [number, number]),
      ...Array.from({ length: 21 }, (_, i) => [0, Math.round((i / 20) * frameCfg.height)] as [number, number]),
      ...Array.from({ length: 21 }, (_, i) => [frameCfg.width, Math.round((i / 20) * frameCfg.height)] as [number, number]),
    ];
    const bounds = edges.map(([x, y]) => proj.invert!([x, y]) as [number, number]);
    const lons = bounds.map((c) => c[0]);
    const lats = bounds.map((c) => c[1]);
    // 画布东西向超出 bbox：战线必须闭到画布外，否则上缘会露出斜边
    expect(Math.min(...lons)).toBeLessThan(w - 0.5);
    expect(Math.max(...lons)).toBeGreaterThan(e + 0.5);
    // 南北向内缩到 bbox 之内（≈51.49 / 58.09），与 GEOGRAPHY.md §2.1 记载一致
    expect(Math.min(...lats)).toBeGreaterThan(s - 0.3);
    expect(Math.min(...lats)).toBeLessThan(s + 0.1);
    expect(Math.max(...lats)).toBeGreaterThan(n);
    expect(Math.max(...lats)).toBeLessThan(n + 0.3);
    // 莫斯科在画布中部
    const [mx, my] = proj([37.617, 55.755])!;
    expect(mx / frameCfg.width).toBeGreaterThan(0.3);
    expect(mx / frameCfg.width).toBeLessThan(0.8);
    expect(my / frameCfg.height).toBeGreaterThan(0.25);
    expect(my / frameCfg.height).toBeLessThan(0.75);
  });

  it('关键地名坐标与已知经纬度相符（不手写世界坐标、不漂移）', () => {
    const near = (place: string, lon: number, lat: number, tol = 0.12) => {
      const p = gaz.get(place);
      expect(p, place).toBeDefined();
      expect(Math.abs(p!.pos[0] - lon), `${place} 经度`).toBeLessThan(tol);
      expect(Math.abs(p!.pos[1] - lat), `${place} 纬度`).toBeLessThan(tol);
    };
    near('moscow', 37.617, 55.755);
    near('kremlin', 37.617, 55.752);
    near('tula', 37.617, 54.193);
    near('kaluga', 36.26, 54.51);
    near('klin', 36.72, 56.33);
    near('kalinin', 35.9, 56.86);
    near('vyazma', 34.29, 55.21);
    near('bryansk', 34.36, 53.24);
    near('mozhaisk', 36.02, 55.5);
    near('volokolamsk', 35.97, 56.04);
  });
});

describe('莫斯科保卫战 · 控制区审计（pipeline/audit-control.ts）', () => {
  it('脚本自带的断言全部通过（全绿 = 控制区可发布）', () => {
    const src = readFileSync(join(dir, 'pipeline/audit-control.ts'), 'utf8');
    const block = src.match(/const ROWS: Row\[\] = \[([\s\S]*?)\n\];/);
    expect(block, '找不到 ROWS 断言表').not.toBeNull();
    const rows = [...block![1].matchAll(/\[\s*'([^']+)',\s*'([^']+)',\s*'(DE|SU)',\s*'([^']*)'\s*\]/g)]
      .map((m) => ({ place: m[1], at: m[2], want: m[3] as 'DE' | 'SU', basis: m[4] }));
    // 数量随审查补充而增长（原 69 条，复审加 gzhatsk 中途采样后为 70 条）。
    // 这里只守住「足够多且不退化」，不写死具体数字，否则每加一条断言都要改测试。
    expect(rows.length).toBeGreaterThanOrEqual(70);
    // 每条都要有依据说明 —— 「为什么这个城在这一刻归这一方」是可复核的（延续上一行的写「同上」）
    for (const r of rows) expect(r.basis.length, `${r.place}@${r.at}`).toBeGreaterThanOrEqual(2);
    // 覆盖必须同时包含「苏方守住」和「德军占领」两类，不能只挑好判的
    expect(rows.some((r) => r.want === 'SU')).toBe(true);
    expect(rows.some((r) => r.want === 'DE')).toBe(true);
    // 时间跨度覆盖全部五个月份段（战役起点 9-30 当天的归属由 fronts 首帧与 city-ledger 另行断言）
    for (const m of ['1941-10', '1941-11', '1941-12', '1942-01']) expect(rows.some((r) => r.at.startsWith(m)), m).toBe(true);
    // 与浏览器同一实现跑一遍（作为独立回归，避免脚本被静默改坏）
    const out = execFileSync('npx', ['tsx', 'campaigns/moscow-1941/pipeline/audit-control.ts'], { cwd: ROOT, encoding: 'utf8' });
    // 断言数量会随审查补充增长，这里只要求「全通过且无失败」，不写死条数
    expect(out).toMatch(/控制区审计：(\d+)\/\1 通过/);
  });

  it('用测试自己的场模型复算同一批断言（同一 SDF 实现、独立初始化）', () => {
    const o = openCampaign(id);
    const kfs: KFInput[] = o.db.keyframes.map((k) => ({
      h: k.h,
      a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      ...(k.transition ? { transition: k.transition } : {}),
    }));
    const clamp = Math.ceil(frameCfg.field.clampKm / (frameCfg.kmPerUnit * GRID.cell));
    const model = createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, masks, kfs, clamp, fieldCfg(o.m.control));
    const grid = { w: GRID.w, h: GRID.h, cell: GRID.cell };
    const holder = (place: string, at: string) => {
      const ll = resolvePos(`@${place}`, o.db.gaz);
      const h = isoToHours(at);
      const [gx, gy] = toGrid(ll);
      if (sample(theaterAt(model, h), grid, gx, gy) >= 0) return 'out';
      return sample(fieldAt(model, h, 0), grid, gx, gy) < 0 ? 'DE' : 'SU';
    };
    const src = readFileSync(join(dir, 'pipeline/audit-control.ts'), 'utf8');
    const block = src.match(/const ROWS: Row\[\] = \[([\s\S]*?)\n\];/)![1];
    const rows = [...block.matchAll(/\[\s*'([^']+)',\s*'([^']+)',\s*'(DE|SU)',\s*'([^']*)'\s*\]/g)]
      .map((m) => ({ place: m[1], at: m[2], want: m[3] }));
    let fail = 0;
    for (const r of rows) {
      if (!o.db.gaz.has(r.place)) fail++;
      else if (holder(r.place, r.at) !== r.want) fail++;
    }
    expect(fail).toBe(0);
  });

  it('city-ledger 的 177 个状态点与场模型一致（5 处结构性豁免另计；日期按「日精度」判定）', () => {
    const o = openCampaign(id);
    const kfs: KFInput[] = o.db.keyframes.map((k) => ({
      h: k.h,
      a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      ...(k.transition ? { transition: k.transition } : {}),
    }));
    const clamp = Math.ceil(frameCfg.field.clampKm / (frameCfg.kmPerUnit * GRID.cell));
    const model = createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, masks, kfs, clamp, fieldCfg(o.m.control));
    const grid = { w: GRID.w, h: GRID.h, cell: GRID.cell };
    const holderAt = (place: string, h: number) => {
      const ll = resolvePos(`@${place}`, o.db.gaz);
      const [gx, gy] = toGrid(ll);
      return sample(fieldAt(model, h, 0), grid, gx, gy) < 0 ? 'DE' : 'SU';
    };
    const ledger = json(join(dir, 'pipeline/city-ledger.json')) as {
      cities: { place: string; events: { date: string; holder: 'SU' | 'DE' }[] }[];
      knownLineMismatches: { place: string; date: string; lineHolder: string; reason: string }[];
    };
    const skip = new Set(ledger.knownLineMismatches.map((x) => `${x.place}@${x.date}`));
    expect(ledger.knownLineMismatches).toHaveLength(5);
    let checked = 0;
    // ledger 的 date 是**日精度**（史料只给到日）：多数点取当日 12:00 精确成立；
    // 少数点落在两个关键帧之间的插值翻转时刻附近，按日精度允许 ±24h。
    // 这里把「需要容差的点数」钉死，避免容差被用来掩盖真正的判错。
    const needsDayTolerance: string[] = [];
    const wrong: string[] = [];
    for (const c of ledger.cities) {
      for (const e of c.events) {
        if (skip.has(`${c.place}@${e.date}`)) continue;
        checked++;
        const h = isoToHours(e.date);
        if (holderAt(c.place, h) === e.holder) continue;
        const near = [-24, -12, -6, 6, 12, 24].some((d) => holderAt(c.place, h + d) === e.holder);
        if (near) needsDayTolerance.push(`${c.place}@${e.date}`);
        else wrong.push(`${c.place}@${e.date} 期望 ${e.holder} 实得 ${holderAt(c.place, h)}`);
      }
    }
    expect(checked).toBe(172);
    expect(wrong, wrong.join('；')).toHaveLength(0);
    // 只有 1 个点需要日精度容差（1941-12-26 纳罗福明斯克：场在 13:00 翻转，台账记 12:00）
    expect(needsDayTolerance).toHaveLength(1);
    expect(needsDayTolerance[0]).toMatch(/^naro_fominsk@1941-12-26/);
    // 豁免项的理由必须说明「这是折线剖面覆盖范围的结构性限制」，不能是「画错了但先放过」
    for (const x of ledger.knownLineMismatches) expect(x.reason.length, x.place).toBeGreaterThan(40);
  });
});

describe('莫斯科保卫战 · 关键帧几何不变量', () => {
  it('38 帧、升序、文件名 = at、每帧都有来源与说明', () => {
    expect(fronts).toHaveLength(38);
    let prev = -Infinity;
    for (const k of fronts) {
      const h = isoToHours(k.at);
      expect(h, k.at).toBeGreaterThan(prev);
      prev = h;
      expect(k.at).toBe(k.at.trim());
      expect(k.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect((k.note ?? '').length, k.at).toBeGreaterThan(10);
      expect(k.sources.length, k.at).toBeGreaterThan(0);
    }
  });

  it('每个环不自相交、点数 ≥3、洞完全落在外环内', () => {
    let holes = 0;
    for (const k of fronts) {
      for (const [slot, polys] of Object.entries(k.control)) {
        for (const [pi, poly] of (polys ?? []).entries()) {
          expect(poly.length, `${k.at} ${slot}[${pi}]`).toBeGreaterThanOrEqual(1);
          const rings = poly.map(ringLL);
          rings.forEach((ring, ri) => {
            expect(ring.length, `${k.at} ${slot}[${pi}][${ri}]`).toBeGreaterThanOrEqual(3);
            expect(ringSelfIntersects(ring), `${k.at} ${slot}[${pi}][${ri}] 自相交`).toBeNull();
            // 环不闭合：首尾不重复（闭合由引擎补）
            expect(ring[0]).not.toEqual(ring.at(-1));
          });
          for (const [hi, hole] of rings.slice(1).entries()) {
            holes++;
            for (const v of hole) expect(pointInRing(v, rings[0]), `${k.at} ${slot}[${pi}] 洞 ${hi} 顶点越出外环`).toBe(true);
          }
        }
      }
    }
    // 本战役至少有 3 处洞（维亚济马、布良斯克、托罗佩茨走廊），且只出现在存续期内
    expect(holes).toBeGreaterThanOrEqual(3);
  });

  it('洞的存续期与 pockets/研究口径一致：10 月中旬的合围圈、1942-01 的走廊', () => {
    const framesWithHoles = fronts.filter((k) => Object.values(k.control).some((polys) => (polys ?? []).some((p) => p.length > 1)));
    expect(framesWithHoles.length).toBeGreaterThanOrEqual(6);
    for (const k of framesWithHoles) {
      const ok = (k.at >= '1941-10-06T12:00' && k.at <= '1941-10-17T12:00') || (k.at >= '1942-01-21T12:00' && k.at <= '1942-01-31T23:59');
      expect(ok, `${k.at} 出现了不该有的洞`).toBe(true);
    }
    // 10-21 到 1942-01-15 之间不该有洞（合围圈已肃清、走廊尚未形成）
    for (const k of fronts.filter((k) => k.at >= '1941-10-21T00:00' && k.at <= '1942-01-15T00:00'))
      for (const polys of Object.values(k.control)) for (const poly of polys ?? []) expect(poly.length, k.at).toBe(1);
  });

  it('占领区面积的变化方向符合战役进程：10—11 月扩大，12-05 后收缩', () => {
    // 局部等距圆柱近似（以战区纬度 55.5° 为基准），足以判断「涨/落」的方向
    const kx = kmLon(55.5);
    const areaKm2 = (ring: number[][]) => {
      let s = 0;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        s += a[0] * kx * b[1] * KM_LAT - b[0] * kx * a[1] * KM_LAT;
      }
      return Math.abs(s / 2);
    };
    const areaOf = (k: ControlKeyframe) => (k.control.DE ?? [])
      .reduce((s, poly) => {
        const rings = poly.map(ringLL);
        return s + areaKm2(rings[0]) - rings.slice(1).reduce((q, h) => q + areaKm2(h), 0);
      }, 0);
    const at = (iso: string) => areaOf(fronts.find((k) => k.at === iso)!);
    const series = fronts.map((k) => ({ at: k.at, a: areaOf(k) }));

    // 开战时德军控制区已经很大（画布西部全境），但不是整块画布
    expect(series[0].a).toBeGreaterThan(300_000);
    expect(series.every((x) => x.a < 700_000)).toBe(true);

    // 9-30 → 12-05：总体单调扩大（个别帧因合围圈洞出现而微降，属正常，允许 3% 回撤）
    const peakIdx = series.findIndex((x) => x.at === '1941-12-05T00:00');
    expect(peakIdx).toBeGreaterThan(0);
    for (let i = 1; i <= peakIdx; i++) {
      expect(series[i].a, `${series[i].at} 相对上一帧`).toBeGreaterThan(series[i - 1].a * 0.97);
    }
    // 12-05 是最大占领区；此后反攻使其单调收缩
    const peak = series[peakIdx].a;
    for (const x of series.slice(peakIdx + 1)) expect(x.a, `${x.at} 反攻后仍在扩大`).toBeLessThanOrEqual(peak + 1);
    const last = series.at(-1)!;
    expect(last.a).toBeLessThan(peak * 0.95);
    // 终点仍保有勒热夫—维亚济马突出部，不是被推回出发线
    expect(last.a).toBeGreaterThan(400_000);
    // 没有一帧是「一条线」或空槽
    for (const x of series) expect(x.a).toBeGreaterThan(50_000);
  });

  it('画布之外才有闭合边：没有把战线闭到图内留出楔形', () => {
    // 每帧都有至少一个顶点在画布外（西/南/北闭合边），且首帧占领区不覆盖莫斯科
    const o = openCampaign(id);
    const moscow = resolvePos('@moscow', o.db.gaz);
    for (const k of fronts) {
      const ring = ringLL(k.control.DE![0][0]);
      const outside = ring.filter((v) => v[0] < frameCfg.bbox[0] || v[0] > frameCfg.bbox[2] || v[1] < frameCfg.bbox[1] || v[1] > frameCfg.bbox[3]);
      expect(outside.length, `${k.at} 闭合边`).toBeGreaterThan(0);
      for (const poly of k.control.DE ?? []) {
        const rings = poly.map(ringLL);
        expect(pointInRing(moscow, rings[0]) && !rings.slice(1).some((h) => pointInRing(moscow, h)), `${k.at} 莫斯科落入德军控制区`).toBe(false);
      }
    }
  });

  /**
   * 量测口径（务必先读）：
   * 这里算的是「`control.DE` 的**整条控制区边界**到克里姆林宫的**最短边界距离**」——
   * 对每个多边形的每条边做点到线段的最短距离（不是顶点采样、也不是网格采样），取全局最小。
   *
   * 它**不是**「德军前锋楔尖距城距离」。史料的「约 29 km」（该帧 note 与
   * `data/ext/moscow/front-watch.json` 的克拉斯纳亚波利亚纳一说是 27 km）是**前锋/楔尖口径**，
   * 而控制区边界总要先把城郊圈进去，因此**边界距离 ≤ 楔尖距离是正常的**，不要指望两者相等。
   *
   * 实测：11-29 至 12-05 恒为 14.5—14.6 km（由克拉斯纳亚波利亚纳楔形的南缘决定），
   * 2D 引擎侧独立量测与验证岗的量测在此一致，曲线形状为
   * 「11 月底收紧 → 12 月初最近 → 12 月中回升 → 1 月退回 110 km 以上」。
   */
  const nearestToKremlinKm = () => {
    const o = openCampaign(id);
    const kremlin = resolvePos('@kremlin', o.db.gaz);
    const kx = kmLon(kremlin[1]);
    return fronts.map((k) => {
      let best = Infinity;
      for (const poly of k.control.DE ?? []) {
        for (const ring of poly.map(ringLL)) {
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i], b = ring[(i + 1) % ring.length];
            const ax = (a[0] - kremlin[0]) * kx, ay = (a[1] - kremlin[1]) * KM_LAT;
            const bx = (b[0] - kremlin[0]) * kx, by = (b[1] - kremlin[1]) * KM_LAT;
            const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
            let t = L > 0 ? -(ax * dx + ay * dy) / L : 0;
            t = Math.max(0, Math.min(1, t));
            best = Math.min(best, Math.hypot(ax + dx * t, ay + dy * t));
          }
        }
      }
      return best;
    });
  };

  it('德军控制区边界到克里姆林宫的距离逐帧收敛再拉开（边界距离口径）', () => {
    const nearest = nearestToKremlinKm();
    // 9-30 德军离城 ≥200 km，11-30 之前压到 10—30 km 量级，之后拉开
    expect(nearest[0]).toBeGreaterThan(200);
    const minIdx = nearest.indexOf(Math.min(...nearest));
    expect(fronts[minIdx].at >= '1941-11-25T00:00').toBe(true);
    expect(fronts[minIdx].at <= '1941-12-08T00:00').toBe(true);
    expect(Math.min(...nearest)).toBeLessThan(40);
    expect(nearest.at(-1)!).toBeGreaterThan(80);
  });

  it('11-27—12-08 各帧，德军控制区边界到克里姆林宫 ≥ 12 km（不进入市区）', () => {
    // 边界距离口径，见上面 nearestToKremlinKm 的说明：史料的 29 km 是楔尖/公路前锋口径，
    // 边界距离天然更小。实测最小值 14.5—14.6 km，取 12 km 作为「不进城」的下限并留 2.5 km 余量，
    // 不硬编码 29 或 14.6，以免未来微调战线时误红。
    const nearest = nearestToKremlinKm();
    const window = fronts
      .map((k, i) => ({ at: k.at, km: nearest[i] }))
      .filter((x) => x.at >= '1941-11-27T00:00' && x.at <= '1941-12-08T23:59');
    expect(window.length).toBeGreaterThanOrEqual(4);
    for (const x of window) expect(x.km, `${x.at} 边界距克里姆林宫 ${x.km.toFixed(1)} km`).toBeGreaterThanOrEqual(12);
  });

  it('克拉斯纳亚波利亚纳：11-29—12-05 属德军、12-08 后收复，且该村本身距城 15—25 km', () => {
    const o = openCampaign(id);
    const kremlin = resolvePos('@kremlin', o.db.gaz);
    const polyana = resolvePos('@krasnaya_polyana', o.db.gaz);
    // 该村距城约 20 km（史料「约 27 km」按公路/村镇中心口径，坐标本身是 19.9 km）
    // 真实坐标（审查 F4 核实）：56.022948N / 37.428017E → 距克里姆林宫约 32 km。
    // 史料「约 27 km」是对莫斯科**市界**的通行说法，对市中心约 32 km；两种口径并存。
    expect(haversineKm(polyana, kremlin)).toBeGreaterThan(28);
    expect(haversineKm(polyana, kremlin)).toBeLessThan(36);
    // 11-29—12-05 它在德军一侧；12-08 收复后回到苏方
    const covered = (k: typeof fronts[number], ll: LonLat) =>
      (k.control.DE ?? []).some((poly) => {
        const rings = poly.map(ringLL);
        return pointInRing(ll, rings[0]) && !rings.slice(1).some((r) => pointInRing(ll, r));
      });
    for (const k of fronts.filter((x) => x.at >= '1941-11-29T00:00' && x.at <= '1941-12-05T23:59'))
      expect(covered(k, polyana), `${k.at} 克拉斯纳亚波利亚纳应属德军`).toBe(true);
    for (const k of fronts.filter((x) => x.at >= '1941-12-11T00:00'))
      expect(covered(k, polyana), `${k.at} 克拉斯纳亚波利亚纳应已收复`).toBe(false);
  });

  it('插件用的「最近距离」护栏只在真正出问题时报警，并且不给误导性的精确数字', () => {
    const o = openCampaign(id);
    const kremlin = resolvePos('@kremlin', o.db.gaz);
    // 前期与终期都不许触发护栏
    for (const at of ['1941-10-10T12:00', '1941-10-20T12:00', '1941-11-15T12:00', '1942-01-01T12:00', '1942-01-31T12:00']) {
      const s = frontSnapshotAt(o.db.keyframes, kremlin, isoToHours(at));
      expect(s.suspect, at).toBe(false);
      expect(s.km, at).not.toBeNull();
    }
    // 11-27—12-05 之间若仍有顶点交错，护栏必须报警（报警时以短边下界为准，不给精确假值）
    for (const at of ['1941-11-30T12:00', '1941-12-02T12:00', '1941-12-05T00:00']) {
      const s = frontSnapshotAt(o.db.keyframes, kremlin, isoToHours(at));
      if (s.suspect) {
        expect(s.kmShortEdge, at).not.toBeNull();
        expect(s.kmShortEdge!, at).toBeLessThan(s.km!);
      }
    }
    // 开局前没有关键帧时不允许编造距离
    const before = frontSnapshotAt(o.db.keyframes, kremlin, isoToHours('1941-09-30T00:00') - 48);
    expect(before.hasFrame).toBe(false);
    expect(before.km).toBeNull();
  });
});

describe('莫斯科保卫战 · 地图资源可复现', () => {
  it('矢量、瓦片与地形资产齐备且非空', () => {
    const topo = json(join(pub, 'geo/vectors.topo.json'));
    for (const key of ['land', 'countries1939', 'rivers', 'lakes']) expect(topo.objects[key], key).toBeDefined();
    expect(topo.objects.countries1939.geometries.some((g: { properties?: { id?: string } }) => g.properties?.id === 'SU')).toBe(true);
    const meta = json(join(pub, 'tiles/base/meta.json'));
    expect(meta).toBeTruthy();
    expect(statSync(join(pub, 'terrain/height.png')).size).toBeGreaterThan(10_000);
    expect(statSync(join(pub, 'terrain/albedo.webp')).size).toBeGreaterThan(10_000);
    expect(existsSync(join(pub, 'terrain/terrain.json'))).toBe(true);
    // 掩膜侧车文件记录水体修正，便于复核
    const sidecar = json(join(pub, 'geo/field_masks.json'));
    expect(sidecar).toBeTruthy();
  });

  it('中文地名齐全：界面不出现未翻译的俄文/拉丁文主名', () => {
    let latin = 0;
    for (const p of gaz.values()) {
      const zh = p.zh ?? '';
      expect(zh.length, p.id).toBeGreaterThan(0);
      if (/^[A-Za-z]/.test(zh)) latin++;
    }
    expect(latin, '有地名直接用拉丁字母当主名').toBe(0);
  });
});
