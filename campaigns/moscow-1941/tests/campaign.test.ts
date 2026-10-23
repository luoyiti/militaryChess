/**
 * 莫斯科保卫战包结构与卷宗身份。
 *
 * 只断言「性质」而不是具体顶点数、具体部队数之类的易变数字：战线几何正在复核，
 * 帧内点序可能重排，但「38 帧、不自相交、文件名=at、洞在外环内」这些不变量必须一直成立。
 * 史实口径与争议写法见 history.test.ts，控制区归属见 geography.test.ts。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { openCampaign } from '../../../tests/helpers';
import { campaignDir, publicDir, listCampaignIds } from '../../../tools/lib/campaign-node';
import { ManifestSchema } from '../../../engine/schema/zod';
import { isoToHours, H_END, T_START, T_END } from '../../../engine/core/time';
import { PHASES } from '../../../engine/core/phases';
import { GRID, FRAME } from '../../../engine/geo/frame';
import { MODEL_IDS } from '../../../engine/three/models';
import { ringSelfIntersects, resolvePos, pointInRing } from '../../../engine/model/core';
import { ECHELON_RANK } from '../../../engine/core/types';
import type { ControlKeyframe, Equipment, HistEvent, Place, Pocket, Route, Unit } from '../../../engine/core/types';

const { def, db, m } = openCampaign('moscow-1941');
const dir = campaignDir(m.id);
const pub = publicDir(m.id);
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const files = def.data as Record<string, unknown>;
const byDir = (dirName: string) => Object.entries(files).filter(([k]) => k.includes(`/data/${dirName}/`)).flatMap(([, v]) => v as unknown[]);

const rawUnits = byDir('oob') as Unit[];
const rawEvents = files['./data/events.json'] as HistEvent[];
const rawRoutes = byDir('routes') as Route[];
const rawPockets = files['./data/pockets.json'] as Pocket[];
const rawFronts = byDir('fronts') as ControlKeyframe[];
const rawPlaces = byDir('gazetteer') as Place[];
const rawEquipment = files['./data/equipment.json'] as Equipment[];
const photoIndex = json(join(pub, 'photos/index.json')) as Record<string, { src: string; license: string; sourceUrl: string; caption: string; title: string; author: string }>;
const credits = json(join(pub, 'credits.json')) as { photos: unknown[]; extraHtml?: string };
const frameCfg = json(join(dir, 'config/frame.json'));
const geo = json(join(dir, 'config/geo.config.json'));

describe('莫斯科保卫战 · 卷宗身份与清单', () => {
  it('清单通过 schema，身份与总台卷宗号不变', () => {
    expect(ManifestSchema.safeParse(m).success).toBe(true);
    expect(m.id).toBe('moscow-1941');
    // 已发布：status 必须是 published（draft 仍能通过 validate，但不能出现在总台可进入列表里）
    expect(m.status).toBe('published');
    expect(m.title.zh).toBe('莫斯科保卫战');
    expect(m.title.codename).toBe('台风行动');
    // 卷宗编号（总台页签「卷宗 No.NN」）必须唯一：曾经与 barbarossa-1941、leningrad-1941 都是 9，
    // 总台上会出现三个「No.09」。这里扫全仓清单断言唯一性，不只是断「正整数」。
    expect(Number.isInteger(m.hub.order)).toBe(true);
    expect(m.hub.order).toBeGreaterThan(0);
    const orders = new Map<number, string[]>();
    for (const dir of listCampaignIds()) {
      const other = JSON.parse(readFileSync(join(campaignDir(dir), 'campaign.json'), 'utf8')) as { hub?: { order?: number } };
      const n = other.hub?.order;
      if (typeof n !== 'number') continue;
      orders.set(n, [...(orders.get(n) ?? []), dir]);
    }
    const order = m.hub.order!;
    expect(orders.get(order), `卷宗编号 ${order} 被多个战役占用`).toEqual([m.id]);
    expect(m.hub.region).toBe('europe');
    expect(m.hub.stencil).toBe('MOSCOW 1941');
    expect(m.hub.pin).toEqual([37.617, 55.755]);
    expect(m.hub.theatre?.bbox).toEqual([30.6, 51.6, 40.4, 58]);
  });

  it('两个阵营、前缀、控制槽与战区比特', () => {
    expect(m.sides.map((s) => s.id)).toEqual(['DE', 'SU']);
    expect(m.sides.map((s) => s.prefix)).toEqual(['de', 'su']);
    expect(m.sideOrder).toEqual(['SU', 'DE']);
    expect(m.control.mode).toBe('territory');
    expect(m.control.landBit).toBe(4);
    expect(m.control.theatreBits).toEqual([0]);
    expect(m.control.slots.map((s) => s.key)).toEqual(['DE']);
    expect(m.control.slots[0].homeBits ?? []).toEqual([]);
    // 画布内没有德国本土：占领区只能来自 fronts 多边形
    expect(geo.masks.bits['0']).toEqual(['SU']);
  });

  it('时间窗、时区与变速分段', () => {
    expect(m.time.epoch).toBe('1941-09-30T00:00');
    expect(m.time.start).toBe('1941-09-30T00:00');
    expect(m.time.end).toBe('1942-01-31T23:59');
    expect(m.time.dataEnd).toBe(m.time.end);
    expect(m.time.utcOffset).toBe(3);
    expect(m.time.tzLabel).toContain('UTC+3');
    expect(T_START).toBe(isoToHours('1941-09-30T00:00'));
    expect(H_END).toBe(isoToHours('1942-01-31T23:59'));
    const pace = m.time.pace ?? [];
    expect(pace.length).toBeGreaterThanOrEqual(3);
    let prev = -Infinity;
    for (const c of pace) {
      const h = isoToHours(c.from);
      expect(h, c.from).toBeGreaterThan(prev);
      // 第一段可以从战役起点开始；其余必须严格落在窗口内部
      if (prev !== -Infinity) expect(h).toBeGreaterThan(T_START);
      expect(h).toBeLessThan(T_END);
      expect(c.hoursPerSec).toBeGreaterThan(0);
      prev = h;
    }
  });

  it('五个阶段与 CONVENTIONS 第 2 节一致，顺序与时间都正确', () => {
    expect(m.phases.map((p) => p.id)).toEqual(['typhoon', 'mozhaisk', 'november', 'counter', 'january']);
    expect(m.phases.map((p) => p.from)).toEqual([
      '1941-09-30T00:00', '1941-10-13T00:00', '1941-11-15T00:00', '1941-12-05T00:00', '1942-01-07T00:00',
    ]);
    for (const p of m.phases) {
      expect(p.name.length, p.id).toBeGreaterThan(3);
      expect(p.sub.length, p.id).toBeGreaterThan(20);
      expect(p.center, p.id).toBeDefined();
      expect(p.zoom, p.id).toBeGreaterThan(0);
    }
    expect(PHASES.map((p) => p.id)).toEqual(m.phases.map((p) => p.id));
    expect(PHASES.at(-1)!.to).toBeGreaterThanOrEqual(H_END);
  });

  it('时间轴标记按时间升序、落在时间窗内、同名不重复', () => {
    const marks = m.marks ?? [];
    expect(marks.length).toBeGreaterThanOrEqual(8);
    let prev = -Infinity;
    const labels = new Set<string>();
    for (const [iso, label] of marks) {
      const h = isoToHours(iso);
      expect(h, iso).toBeGreaterThan(prev);
      expect(h).toBeGreaterThanOrEqual(T_START);
      expect(h).toBeLessThanOrEqual(H_END);
      expect(labels.has(label), label).toBe(false);
      labels.add(label);
      prev = h;
    }
  });

  it('没有生成器占位符', () => {
    const blob = JSON.stringify(files) + JSON.stringify(m);
    expect(blob).not.toMatch(/todo_source|theatre_center|待补|（待补/);
  });
});

describe('莫斯科保卫战 · 数据规模与校验契约', () => {
  it('manifest.validation 锁定事件数与正文长度', () => {
    expect(m.validation?.eventCount).toBe(115);
    expect(db.events).toHaveLength(115);
    const [lo, hi] = (m.validation?.bodyLength ?? [80, 140]) as [number, number];
    expect(lo).toBeGreaterThanOrEqual(80);
    expect(hi).toBeLessThanOrEqual(140);
    expect(lo).toBeLessThan(hi);
    for (const e of rawEvents) {
      const n = [...e.body].length;
      expect(n, `${e.id} 正文 ${n} 字`).toBeGreaterThanOrEqual(lo);
      expect(n, `${e.id} 正文 ${n} 字`).toBeLessThanOrEqual(hi);
    }
  });

  it('数据规模与登记表一致（地名 122 / 部队 255 / 路线 56 / 帧 38 / 装备 19 / 来源 46 / 包围圈 6 / 叠加层 17）', () => {
    expect(db.gaz.size).toBe(122);
    expect(rawUnits).toHaveLength(255);
    expect(db.routes).toHaveLength(56);
    expect(db.keyframes).toHaveLength(38);
    expect(db.equipment.size).toBe(19);
    expect(db.sources.size).toBe(46);
    expect(db.pockets).toHaveLength(6);
    expect(db.overlays).toHaveLength(17);
    // 双方编制都有实质规模，不是一边倒的样张
    const de = rawUnits.filter((u) => u.side === 'DE').length;
    const su = rawUnits.filter((u) => u.side === 'SU').length;
    expect(de).toBeGreaterThanOrEqual(100);
    expect(su).toBeGreaterThanOrEqual(140);
    expect(de + su).toBe(255);
  });

  it('地名 id 唯一、坐标在画布内、都有来源', () => {
    const ids = new Set<string>();
    for (const p of rawPlaces) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(p.pos[0]).toBeGreaterThan(29);
      expect(p.pos[0]).toBeLessThan(42);
      expect(p.pos[1]).toBeGreaterThan(51);
      expect(p.pos[1]).toBeLessThan(59);
      expect((p.sources ?? []).length, p.id).toBeGreaterThan(0);
      for (const s of p.sources ?? []) expect(db.sources.has(s), `${p.id}/${s}`).toBe(true);
    }
    for (const id of ['moscow', 'kremlin', 'tula', 'kaluga', 'klin', 'kalinin', 'vyazma', 'bryansk', 'mozhaisk', 'kholm_zhirkovsky', 'trubchevsk', 'toropets'])
      expect(db.gaz.has(id), id).toBe(true);
  });

  it('装备图的 count 一律为空（类别合计不能当单型号数）', () => {
    for (const q of rawEquipment) {
      expect(q.count ?? null, `${q.id} 不应把类别合计写成单型号数量`).toBeNull();
      // CONVENTIONS §6 的写作规范是 60—140 字（与事件 bodyLength 同源），按契约下限断言
      expect([...q.desc].length, q.id).toBeGreaterThanOrEqual(60);
      expect([...q.desc].length, q.id).toBeLessThanOrEqual(140);
      expect(q.sources.length, q.id).toBeGreaterThan(0);
    }
  });
});

describe('莫斯科保卫战 · 引用完整性', () => {
  it('部队：前缀、上级同阵营、梯队不倒挂、轨迹严格递增、模型已注册', () => {
    const ids = new Set(rawUnits.map((u) => u.id));
    const models = new Set(MODEL_IDS());
    const labels = new Set(Object.keys(m.ui.modelLabels ?? {}));
    for (const u of rawUnits) {
      const prefix = m.sides.find((s) => s.id === u.side)!.prefix;
      expect(u.id.startsWith(prefix + '.'), u.id).toBe(true);
      if (u.parent) {
        const p = rawUnits.find((x) => x.id === u.parent);
        expect(p, `${u.id} 的上级 ${u.parent}`).toBeDefined();
        expect(p!.side, `${u.id} 与上级阵营`).toBe(u.side);
        expect(ECHELON_RANK[p!.echelon], `${u.id} 梯队高于上级`).toBeLessThanOrEqual(ECHELON_RANK[u.echelon]);
      }
      const t = (u.track ?? []).map((k) => isoToHours(k.at));
      for (let i = 1; i < t.length; i++) expect(t[i], `${u.id} track[${i}]`).toBeGreaterThan(t[i - 1]);
      if (u.model) {
        expect(models.has(u.model), `${u.id} model ${u.model}`).toBe(true);
        expect(labels.has(u.model), `${u.id} model ${u.model} 未在 ui.modelLabels 说明`).toBe(true);
      }
      for (const eq of u.equipment ?? []) expect(db.equipment.has(eq.id), `${u.id}/${eq.id}`).toBe(true);
      for (const s of u.sources) expect(db.sources.has(s), `${u.id}/${s}`).toBe(true);
    }
    // 末级部队必须有轨迹（军团级可为 container 取下属质心）
    for (const u of rawUnits) {
      const kids = rawUnits.filter((x) => x.parent === u.id);
      if (!kids.length) expect((u.track ?? []).length, `${u.id} 末级部队缺轨迹`).toBeGreaterThan(0);
    }
    expect(ids.size).toBe(255);
  });

  it('路线：部队存在且同阵营、时间严格递增、起点不晚于战争开始太久', () => {
    const seen = new Set<string>();
    for (const r of rawRoutes) {
      expect(seen.has(r.id), r.id).toBe(false);
      seen.add(r.id);
      const u = db.units.get(r.unit);
      expect(u, `${r.id} 的部队 ${r.unit}`).toBeDefined();
      expect(u!.side, `${r.id} 阵营`).toBe(r.side);
      let prev = -Infinity;
      for (const w of r.waypoints) {
        const h = isoToHours(w.at);
        expect(h, `${r.id} waypoint ${w.at}`).toBeGreaterThan(prev);
        expect(h).toBeGreaterThanOrEqual(T_START - 24);
        expect(h).toBeLessThanOrEqual(H_END + 24);
        prev = h;
      }
      expect(r.waypoints.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('包围圈：end > start、锚点可解析、部队存在、都在时间窗内', () => {
    for (const p of rawPockets) {
      expect(isoToHours(p.end), p.id).toBeGreaterThan(isoToHours(p.start));
      expect(p.start >= '1941-09-30T00', p.id).toBe(true);
      expect(p.end <= '1942-01-31T23:59', p.id).toBe(true);
      expect(() => resolvePos(p.anchor, db.gaz), p.id).not.toThrow();
      for (const uid of p.units ?? []) expect(db.units.has(uid), `${p.id}/${uid}`).toBe(true);
      expect(['surrendered', 'broke_out', 'relieved', 'destroyed', 'handed_over']).toContain(p.fate);
    }
  });

  it('事件：部队引用存在、照片已索引、来源存在、位置可解析', () => {
    for (const e of rawEvents) {
      expect(e.id.startsWith('e.'), e.id).toBe(true);
      expect(() => resolvePos(e.place, db.gaz), `${e.id} place`).not.toThrow();
      for (const uid of e.units ?? []) expect(db.units.has(uid), `${e.id}/${uid}`).toBe(true);
      for (const s of e.sources) expect(db.sources.has(s), `${e.id}/${s}`).toBe(true);
      if (e.photo?.commons) expect(photoIndex, `${e.id} 照片`).toHaveProperty(e.photo.commons);
    }
    // 事件引用的部队集合覆盖了主要编制，不是只挂几个样板
    const refs = new Set(rawEvents.flatMap((e) => e.units ?? []));
    expect(refs.size).toBeGreaterThanOrEqual(45);
  });

  it('叠加层：图层都在 ui.extraLayers 登记，图例顺序包含全部额外图层', () => {
    const extra = (m.ui.extraLayers ?? []).map((l) => l.key);
    const order = m.ui.layerOrder ?? [];
    expect(extra.length).toBeGreaterThanOrEqual(5);
    const usedLayers = new Set(db.overlays.map((o) => o.layer));
    for (const layer of usedLayers) expect(extra, `叠加层图层 ${layer}`).toContain(layer);
    for (const key of extra) {
      expect(usedLayers.has(key), `额外图层 ${key} 没有任何 overlays 条目`).toBe(true);
      expect(order, `layerOrder 缺 ${key}`).toContain(key);
    }
    for (const [id, label] of m.ui.extraLayers!.map((l) => [l.key, l.label] as const)) {
      expect(label.length, id).toBeGreaterThan(2);
      expect(db.overlays.some((o) => o.layer === id), id).toBe(true);
    }
  });

  it('控制区关键帧：38 帧、文件名=at、升序、环不自相交、洞在外环内', () => {
    expect(rawFronts).toHaveLength(38);
    const sorted = [...rawFronts].sort((a, b) => a.at.localeCompare(b.at));
    expect(sorted[0].at).toBe('1941-09-30T00:00');
    expect(sorted.at(-1)!.at).toBe('1942-01-31T00:00');
    let prev = -Infinity;
    for (const k of sorted) {
      const h = isoToHours(k.at);
      expect(h).toBeGreaterThan(prev);
      prev = h;
      expect(Object.keys(files).some((p) => p.endsWith('/fronts/' + k.at.replace(':', '-') + '.json')), k.at).toBe(true);
      expect(k.sources.length, k.at).toBeGreaterThan(0);
      // 关键帧里的坐标是 Pos（可写 '@地名'），先解析成经纬度再判几何
      for (const [slot, polys] of Object.entries(k.control)) {
        for (const poly of polys ?? []) {
          expect(poly.length, `${k.at} ${slot}`).toBeGreaterThanOrEqual(1);
          const rings = poly.map((ring) => ring.map((p) => resolvePos(p, db.gaz)));
          for (const [ri, ring] of rings.entries()) {
            expect(ring.length, `${k.at} ${slot} 环 ${ri} 点数`).toBeGreaterThanOrEqual(3);
            expect(ringSelfIntersects(ring), `${k.at} ${slot} 环 ${ri} 自相交`).toBeNull();
          }
          for (const [hi, hole] of rings.slice(1).entries()) {
            for (const v of hole) expect(pointInRing(v, rings[0]), `${k.at} ${slot} 洞 ${hi} 顶点越出外环`).toBe(true);
          }
        }
      }
    }
  });

  it('照片三件套一致：index.json、实体文件、credits.json', () => {
    expect(Object.keys(photoIndex).length).toBe(20);
    // credits.json 的 photos 是索引的精简投影（不含 caption/尺寸/审计注），
    // 逐条核对「同一张照片、同一作者、同一许可、同一原页」，不强求字段全等
    expect(credits.photos).toHaveLength(Object.keys(photoIndex).length);
    const bySrc = new Map(Object.values(photoIndex).map((p) => [p.src, p]));
    const byCommons = new Map(Object.entries(photoIndex));
    for (const c of credits.photos as { file: string; commons: string; author: string; license: string; sourceUrl: string }[]) {
      const src = c.file ?? byCommons.get(c.commons)?.src;
      const p = bySrc.get(src ?? '');
      expect(p, `credits 里的 ${c.file ?? c.commons} 不在 index.json`).toBeDefined();
      expect(c.author).toBe(p!.author);
      expect(c.license).toBe(p!.license);
      expect(c.sourceUrl).toBe(p!.sourceUrl);
    }
    const allowed = [/^Public domain$/, /^CC BY 4\.0$/, /^CC BY-SA 3\.0$/, /^CC BY-SA 3\.0 de$/, /^CC BY-SA 4\.0$/];
    for (const [commons, p] of Object.entries(photoIndex)) {
      expect(commons).toMatch(/^File:/);
      expect(p.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(allowed.some((re) => re.test(p.license)), `${commons} 许可 ${p.license}`).toBe(true);
      const fp = join(pub, p.src);
      expect(existsSync(fp), p.src).toBe(true);
      expect(statSync(fp).size, p.src).toBeGreaterThan(10_000);
      expect(p.caption.length, commons).toBeGreaterThan(10);
    }
    const srcs = new Set(Object.values(photoIndex).map((p) => p.src));
    expect(srcs.has(m.hub.cover as string)).toBe(true);
    expect(Object.keys(photoIndex)).toContain((m.intro as { photo?: string }).photo);
    expect(Object.keys(photoIndex)).toContain((m.intro as { photoFallback?: string }).photoFallback);
  });

  it('静态资源齐备：掩膜尺寸、矢量层、瓦片、地形与 credits', () => {
    const masks = readFileSync(join(pub, 'geo/field_masks.bin'));
    expect(masks.byteLength).toBe(GRID.w * GRID.h);
    expect(masks.byteLength).toBe(683 * 728);
    expect(masks.byteLength).toBe(frameCfg.field.w * frameCfg.field.h);
    // 画布内全是苏联领土 + 陆地（bit0|bit4 = 17），没有中立国
    for (const v of masks) expect(v).toBe(17);
    for (const f of ['geo/vectors.topo.json', 'geo/field_masks.json', 'tiles/base/meta.json', 'terrain/terrain.json', 'credits.json'])
      expect(existsSync(join(pub, f)), f).toBe(true);
  });
});
