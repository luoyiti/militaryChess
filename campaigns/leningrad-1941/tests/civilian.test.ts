import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = <T>(name: string): T => JSON.parse(readFileSync(resolve(root, name), 'utf8')) as T;
type Cited = { sources: string[] };
type Ration = Cited & { from: string; workers: number; employees: number; dependents: number; children: number; note: string };
type Segment = Cited & { from: string; until?: string; state: 'regular' | 'restricted' | 'uncertain'; note: string };
type Route = { id: string; key: string; label: string; segments: Segment[] };
type Event = Cited & { id: string; at: string; precision: string; body: string; photo?: { commons: string; caption: string } };
type Photo = { src: string; author: string; sourceUrl: string; license: string; licenseUrl: string; caption: string; date: string; dateStatus: string; auditNote: string };
const rations = read<Ration[]>('data/ext/siege/rations.json');
const routes = read<Route[]>('data/ext/siege/logistics.json');
const civic = read<(Cited & { from: string; title: string; body: string })[]>('data/ext/siege/civic.json');
const notes = read<(Cited & { eventId: string; paragraphs: string[] })[]>('data/ext/siege/notes.json');
const sources = read<{ id: string; title: string; url: string }[]>('data/sources/civilian.json');
const events = read<Event[]>('pipeline/civilian-events.json');
const photographs = read<Record<string, Photo>>('../../public/campaigns/leningrad-1941/photos/index.json');

const rationOn = (day: string) => rations.filter((row) => row.from <= `${day}T23:59`).at(-1);
const segmentOn = (id: string, day: string) => routes.find((route) => route.id === id)?.segments.find((segment) =>
  segment.from <= `${day}T12:00` && (!segment.until || `${day}T12:00` < segment.until));

describe('列宁格勒平民资料的史实约束', () => {
  it('保留无记录期和身份差别，配给值不插值', () => {
    expect(rationOn('1941-06-22')).toBeUndefined();
    expect(rationOn('1941-07-18')).toMatchObject({ workers: 800, employees: 600, dependents: 400, children: 400 });
    expect(rationOn('1941-09-11')).toMatchObject({ workers: 500, employees: 300, dependents: 250, children: 300 });
    expect(rationOn('1941-11-19')?.workers).toBe(300);
    expect(rationOn('1941-11-20')).toMatchObject({ workers: 250, employees: 125, dependents: 125, children: 125 });
    expect(rationOn('1941-12-24')?.children).toBe(125);
    expect(rationOn('1941-12-25')).toMatchObject({ workers: 350, employees: 200 });
    expect(rationOn('1942-01-24')).toMatchObject({ workers: 400, employees: 300, dependents: 250, children: 250 });
    expect(rationOn('1943-02-23')).toMatchObject({ workers: 600, employees: 500, dependents: 400, children: 400 });
  });

  it('各时间表为已排序的离散记录，路线采用不含结束日的窗口', () => {
    for (const rows of [rations, civic]) {
      expect(rows.map((row) => row.from)).toEqual(rows.map((row) => row.from).sort());
      expect(new Set(rows.map((row) => row.from)).size).toBe(rows.length);
      for (const row of rows) expect(row.from).toMatch(/^\d{4}-\d\d-\d\dT00:00$/);
    }
    for (const route of routes) {
      expect(route.key).toMatch(/^siege(?:Ice|Water|Rail|Pipeline|Cable)Visible$/);
      expect(route.segments.map((segment) => segment.from)).toEqual(route.segments.map((segment) => segment.from).sort());
      for (const segment of route.segments) {
        expect(['regular', 'restricted', 'uncertain']).toContain(segment.state);
        if (segment.until) expect(segment.until > segment.from).toBe(true);
        expect(segment.note.length).toBeGreaterThan(12);
      }
    }
  });

  it('冰道分级开放，容许水冰交叠，铁路不提前出现', () => {
    expect(segmentOn('ladoga-ice', '1941-11-20')?.state).toBe('restricted');
    expect(segmentOn('ladoga-ice', '1941-11-22')?.state).toBe('regular');
    expect(segmentOn('ladoga-ice', '1942-04-24')?.state).toBe('restricted');
    expect(segmentOn('ladoga-ice', '1942-04-25')).toBeUndefined();
    expect(segmentOn('ladoga-ice', '1942-12-25')?.state).toBe('regular');
    expect(segmentOn('ladoga-water', '1942-12-25')?.state).toBe('restricted');
    expect(segmentOn('victory-rail', '1943-02-06')).toBeUndefined();
    expect(segmentOn('victory-rail', '1943-02-07')?.state).toBe('regular');
    expect(segmentOn('ladoga-water', '1943-08-01')).toBeDefined();
    expect(segmentOn('ladoga-water', '1943-12-15')?.state).toBe('uncertain');
    expect(segmentOn('ladoga-water', '1943-12-15')?.note).toContain('未核实');
  });

  it('油管与电缆区分工程节点，湖上铁路计划不被记成已通车', () => {
    expect(segmentOn('ladoga-pipeline', '1942-06-17')).toBeUndefined();
    expect(segmentOn('ladoga-pipeline', '1942-06-18')?.state).toBe('regular');
    expect(segmentOn('ladoga-cable', '1942-09-22')).toBeUndefined();
    expect(segmentOn('ladoga-cable', '1942-09-23')?.state).toBe('regular');
    expect(events.find((event) => event.id === 'e.second_winter_ice_road')?.body).toContain('没有形成');
    expect(events.find((event) => event.id === 'e.ladoga_pipeline')?.at).toBe('1942-06-18T00:00');
    expect(events.find((event) => event.id === 'e.savicheva_diary_may')?.at).toBe('1942-05-13T00:00');
  });

  it('每条事件、背景与时间记录均引用可解析的真实资料条目', () => {
    const ids = new Set(sources.map((source) => source.id));
    expect(ids.size).toBe(sources.length);
    for (const source of sources) {
      expect(source.title).not.toMatch(/待补|todo|placeholder/i);
      expect(new URL(source.url).protocol).toBe('https:');
    }
    for (const record of [...rations, ...civic, ...notes, ...events, ...routes.flatMap((route) => route.segments)]) {
      expect(record.sources.length).toBeGreaterThan(0);
      for (const id of record.sources) expect(ids.has(id), id).toBe(true);
    }
    const knownEvents = new Set([...read<Event[]>('data/events.json'), ...events].map((event) => event.id));
    for (const note of notes) expect(knownEvents.has(note.eventId), note.eventId).toBe(true);
  });

  it('事件采用日精度与80—140字正文，保留旧ID并去除错配现场照', () => {
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    for (const event of events) {
      expect(event.precision).toBe('day');
      expect([...event.body].length).toBeGreaterThanOrEqual(80);
      expect([...event.body].length).toBeLessThanOrEqual(140);
      if (event.photo) expect(photographs[event.photo.commons]).toBeDefined();
    }
    for (const id of ['e.first_shelling', 'e.badayev_fire', 'e.ladoga_first_barges', 'e.ration_125g', 'e.road_of_life_opens', 'e.kosygin_evacuation', 'e.leningrad_symphony']) {
      expect(events.find((event) => event.id === id)?.photo).toBeUndefined();
    }
  });

  it('39张图均记录来源与日期审计，并保留俄新社要求的署名', () => {
    expect(Object.keys(photographs)).toHaveLength(39);
    for (const [name, photo] of Object.entries(photographs)) {
      expect(existsSync(resolve(root, '../../public/campaigns/leningrad-1941', photo.src)), name).toBe(true);
      expect(photo.author.length).toBeGreaterThan(0);
      expect(new URL(photo.sourceUrl).hostname).toBe('commons.wikimedia.org');
      expect(photo.license.length).toBeGreaterThan(0);
      expect(new URL(photo.licenseUrl).protocol).toBe('https:');
      expect(['verified', 'conflict', 'unresolved']).toContain(photo.dateStatus);
      expect(photo.auditNote.trim().length).toBeGreaterThan(0);
      if (name.startsWith('File:RIAN archive')) expect(photo.author).toMatch(/^RIA Novosti archive, image #\d+ \/.+CC-BY-SA 3.0$/);
    }
    expect(photographs['File:RIAN archive 310 Foodstuffs for Leningrad.jpg'].caption).toContain('驳船');
    expect(photographs['File:RIAN archive 637341 Wood procurement in Leningrad, October 1941.jpg'].dateStatus).toBe('conflict');
    expect(photographs['File:RIAN archive 762 In besieged Leningrad.jpg'].caption).toContain('遗体');
  });
});
