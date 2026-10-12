/**
 * 总台数据的一致性：hub/world.json（阵营时间表、地名、电报、分区）与总台底图、各战役清单相互对得上。
 * 新增战区或扩展时间窗时，这些测试会指出拼错的国家 id、越界的日期与不存在的分区。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listCampaignIds } from '../../tools/lib/campaign-node';
import { isCalendarIso } from '../../engine/schema/zod';
import { manifestOf } from '../helpers';
import { parseStatus, type WorldData } from '../../hub/types';

const ROOT = join(import.meta.dirname, '../..');
const world = JSON.parse(readFileSync(join(ROOT, 'hub/world.json'), 'utf8')) as WorldData;
const topo = JSON.parse(readFileSync(join(ROOT, 'public/hub/world1938.topo.json'), 'utf8')) as { objects: { countries: { geometries: { properties: { id: string; sov?: string } }[] } } };
const ids = new Set(topo.objects.countries.geometries.map((g) => g.properties.id));
const day = (d: string) => Date.parse(`${d}T00:00Z`);
const start = day(world.window.start), end = day(world.window.end);
/** 时间表里允许的「虚拟国家」：拆分后不在底图上、只供殖民地继承的宗主国 */
const virtual = new Set(['France']);

describe('hub/world.json', () => {
  it('状态写法合法、阵营存在，日期在时间窗内且按先后排列', () => {
    for (const [id, list] of Object.entries(world.countries)) {
      expect(ids.has(id) || virtual.has(id), `未知国家 id：${id}`).toBe(true);
      let prev = -Infinity;
      for (const ch of list) {
        expect(isCalendarIso(`${ch.from}T00:00`), `${id} ${ch.from}`).toBe(true);
        const { kind, bloc } = parseStatus(ch.status);
        expect(kind === 'neutral' && ch.status !== 'neutral', `${id} 的状态 ${ch.status} 无法解析`).toBe(false);
        if (bloc) expect(world.blocs[bloc], `${id} 的阵营 ${bloc}`).toBeTruthy();
        expect(day(ch.from)).toBeGreaterThanOrEqual(prev);
        expect(day(ch.from), `${id} ${ch.from} 晚于时间窗`).toBeLessThanOrEqual(end);
        if (ch.source) expect(world.sources[ch.source], `${id} 引用了不存在的来源 ${ch.source}`).toBeTruthy();
        prev = day(ch.from);
      }
    }
  });

  it('电报按日期排列且都在时间窗内', () => {
    let prev = -Infinity;
    for (const d of world.dispatches) {
      expect(isCalendarIso(`${d.date}T00:00`), d.date).toBe(true);
      expect(day(d.date)).toBeGreaterThanOrEqual(prev);
      expect(day(d.date) >= start && day(d.date) <= end, `${d.date} ${d.text}`).toBe(true);
      prev = day(d.date);
    }
  });

  it('地名、宗主国与交战国引用的国家都在底图上', () => {
    for (const L of world.labels) if (L.id !== '@sea') expect(ids.has(L.id), `地名 ${L.zh} 的 id ${L.id}`).toBe(true);
    for (const [k, v] of Object.entries(world.sovereign)) { expect(ids.has(k), k).toBe(true); expect(ids.has(v) || virtual.has(v), v).toBe(true); }
    for (const [code, n] of Object.entries(world.nations)) {
      for (const c of n.countries) expect(ids.has(c), `${code} → ${c}`).toBe(true);
      if (n.alias) expect(world.nations[n.alias], `${code} 的别名 ${n.alias}`).toBeTruthy();
    }
  });

  it('分区 id 唯一，取景框合法', () => {
    const seen = new Set<string>();
    for (const t of world.theatres) {
      expect(seen.has(t.id)).toBe(false);
      seen.add(t.id);
      const [x0, y0, x1, y1] = t.view;
      expect(x1 > x0 && y1 > y0 && y0 >= -50 && y1 <= 80).toBe(true);
    }
  });
});

describe('战役的总台卷宗', () => {
  const regions = new Set(world.theatres.map((t) => t.id));
  for (const id of listCampaignIds()) {
    it(`${id}：分区、战区国家与时间窗`, () => {
      const m = manifestOf(id);
      if (m.hub.region) expect(regions.has(m.hub.region), `hub.region ${m.hub.region}`).toBe(true);
      for (const c of m.hub.theatre?.countries ?? []) expect(ids.has(c), `hub.theatre.countries ${c}`).toBe(true);
      // 时间带只画窗口内的战役：现有战役都应落在窗口里
      expect(day(m.time.start.slice(0, 10)) >= start && day(m.time.end.slice(0, 10)) <= end, `${m.time.start}—${m.time.end} 超出 ${world.window.start}—${world.window.end}`).toBe(true);
      // 阵营代码有中文名（交战国筛选用），或至少有 sides[].name
      for (const s of m.sides) expect(world.nations[s.nation ?? s.id] || s.name, `${id} 的阵营 ${s.id}`).toBeTruthy();
    });
  }
});
