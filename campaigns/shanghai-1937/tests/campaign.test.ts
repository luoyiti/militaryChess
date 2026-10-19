/** 淞沪包的结构、叙事口径及运行时可见性约束；史实独立复核另见history.test.ts。 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';
import { fieldAt, sample, theaterAt } from '../../../engine/geo/field/field';
import { toGrid } from '../../../engine/geo/field/client';
import { campaignDir, publicDir } from '../../../tools/lib/campaign-node';
import { ManifestSchema } from '../../../engine/schema/zod';
import { isoToHours } from '../../../engine/core/time';
import { pointInMulti, ringSelfIntersects, unitStateAt } from '../../../engine/model/core';
import { MODEL_IDS } from '../../../engine/three/models';
import type { ControlKeyframe, HistEvent, LonLat, Unit } from '../../../engine/core/types';

const { def, db, m } = openCampaign('shanghai-1937');
const files = def.data as Record<string, unknown>;
const rawUnits = Object.entries(files).filter(([k]) => k.includes('/oob/')).flatMap(([, v]) => v as Unit[]);
const events = files['./data/events.json'] as HistEvent[];
const fronts = Object.entries(files).filter(([k]) => k.includes('/fronts/')).map(([, v]) => v as ControlKeyframe).sort((a, b) => a.at.localeCompare(b.at));
const state = (id: string, at: string) => unitStateAt(id, db.units, isoToHours(at));
const pos = (id: string) => db.gaz.get(id)!.pos;
const controlAt = (at: string) => db.keyframes.filter((k) => k.h <= isoToHours(at)).at(-1)!.a;
const foreignCore = JSON.parse(readFileSync(join(campaignDir(m.id), 'pipeline/geo/foreign-core.geojson'), 'utf8')).features[0].geometry.coordinates[0] as LonLat[];
const photoIndex = JSON.parse(readFileSync(join(publicDir(m.id), 'photos/index.json'), 'utf8')) as Record<string, { src: string; license: string; sourceUrl: string }>;

describe('淞沪包结构与卷宗身份', () => {
  it('完整清单合法，原卷宗身份与中国战区映射不变', () => {
    expect(ManifestSchema.safeParse(m).success).toBe(true);
    expect(m.hub.order).toBe(10);
    expect(m.hub.pin).toEqual([121.47, 31.23]);
    expect(m.hub.stencil).toBe('SHANGHAI 1937');
    expect(m.hub.labelAt).toBe('e');
    expect(m.sides.map((s) => s.id)).toEqual(['JP', 'CN']);
    expect(m.sideOrder).toEqual(['CN', 'JP']);
    expect(m.control.slots.map((s) => s.key)).toEqual(['JP']);
    expect(m.control.theatreBits).toEqual([0]);
    const geo = JSON.parse(readFileSync(join(campaignDir(m.id), 'config/geo.config.json'), 'utf8'));
    expect(geo.borders.ids.China).toBe('CN');
    expect(geo.masks.bits['0']).toEqual(['CN']);
    expect(geo.masks.bits['1']).not.toContain('CN');
    expect(def.frame.bbox).toEqual([120.75, 30.6, 122.1, 31.75]);
    expect(m.hub.theatre?.bbox).toEqual(def.frame.bbox);
  });

  it('狭义会战时窗、中文日期、章节事件与时区一致', () => {
    expect(m.time.start).toBe('1937-08-13T09:00');
    expect(m.time.end).toBe('1937-11-12T23:59');
    expect(m.time.dataEnd).toBe(m.time.end);
    expect(m.time.tzLabel).toBe('UTC+8');
    expect(m.time.utcOffset).toBe(8);
    expect(m.ui.brief.sub2).toContain('1937.11.12');
    expect(m.intro.dates).toContain('11月12日');
    expect(m.intro.paragraphs[0]).toContain('8月9日虹桥机场大山事件后紧张升级');
    for (let i = 0; i < m.phases.length; i++) {
      const from = m.phases[i].from, until = m.phases[i + 1]?.from ?? m.time.end;
      expect(events.some((e) => e.at >= from && e.at <= until), m.phases[i].id).toBe(true);
    }
    expect(fronts[0].at).toBe(m.time.start);
    expect(fronts.at(-1)?.at).toBe(m.time.end);
    for (const e of events) expect(e.at <= m.time.end && (e.endAt ?? e.at) <= m.time.end, e.id).toBe(true);
  });

  it('来源可解析，无生成器占位符，中文事件80—140字且保留日精度提示', () => {
    expect(JSON.stringify({ manifest: m, data: files })).not.toMatch(/todo_source|theatre_center|待补|待定/);
    expect(events).toHaveLength(25);
    expect(m.ui.precisionStyle).toBe('note');
    const objects = [...rawUnits, ...events, ...fronts, ...db.routes, ...db.equipment.values(), ...db.pockets, ...db.demarcation, db.forces];
    for (const o of objects) {
      expect(o.sources.length).toBeGreaterThan(0);
      for (const source of o.sources) expect(db.sources.has(source), source).toBe(true);
    }
    for (const e of events) {
      expect([...e.body].length, e.id).toBeGreaterThanOrEqual(80);
      expect([...e.body].length, e.id).toBeLessThanOrEqual(140);
      expect(e.precision, e.id).toBe('day');
      expect(e.confidence, e.id).toMatch(/^(high|medium|low)$/);
    }
  });
});

describe('部队时空与指挥关系', () => {
  it('每个节点显式active.from，所有轨迹与路线明确为示意', () => {
    for (const u of rawUnits) {
      expect(u.active?.from, u.id).toBeTruthy();
      expect(u.schematic, u.id).toBe(true);
      expect(state(u.id, '1937-08-13T00:00'), u.id).toBeNull();
      if (u.parent) expect(db.units.has(u.parent), u.id).toBe(true);
      for (let i = 0; i < u.track.length; i++) {
        expect(u.track[i].at >= u.active!.from!, u.id).toBe(true);
        expect(u.track[i].at <= m.time.end, u.id).toBe(true);
        expect(u.track[i].note, u.id).toBeTruthy();
        if (i) expect(u.track[i].at > u.track[i - 1].at, u.id).toBe(true);
      }
    }
    for (const r of db.routes) expect(r.schematic, r.id).toBe(true);
  });

  it('陆军增援与守备分队不从首轨迹回溯到开局', () => {
    for (const id of ['jp.3div', 'jp.11div']) {
      expect(state(id, '1937-08-22T23:59'), id).toBeNull();
      expect(state(id, '1937-08-23T00:00'), id).not.toBeNull();
    }
    for (const id of ['jp.10army', 'jp.6div', 'jp.18div', 'jp.114div', 'jp.kunisaki']) {
      expect(state(id, '1937-11-04T23:59'), id).toBeNull();
      expect(state(id, '1937-11-05T00:00'), id).not.toBeNull();
    }
    for (const id of ['jp.9div', 'jp.13div', 'jp.101div']) {
      expect(state(id, '1937-09-30T23:59'), id).toBeNull();
      expect(db.units.get(id)!.history).toMatch(/保守|编排/);
    }
    expect(state('cn.36div', '1937-08-13T12:00')).toBeNull();
    expect(state('cn.sihang_detachment', '1937-10-26T23:59')).toBeNull();
    expect(state('cn.sihang_detachment', '1937-10-27T00:00')?.ll).toEqual(pos('sihang'));
    expect(db.units.has('jp.16div')).toBe(false);
  });

  it('稀疏阶段标记在位置证据窗后淡出，不把未知后续写成冻结驻地或覆灭', () => {
    const windows = [
      ['cn.98div', '1937-09-18T23:59'], ['cn.11div', '1937-09-12T23:59'],
      ['cn.51div', '1937-09-30T23:59'], ['cn.18div', '1937-10-27T23:59'],
      ['cn.21army', '1937-10-26T23:59'],
    ];
    for (const [id, until] of windows) {
      const u = db.units.get(id)!;
      expect(u.active?.to, id).toBe(until);
      expect(state(id, until)?.fade, id).toBe(1);
      const fading = unitStateAt(id, db.units, isoToHours(until) + 24);
      expect(fading?.fade, id).toBeCloseTo(0.5);
      expect(fading?.status, id).toMatch(/^(engaged|withdrawing)$/);
      expect(unitStateAt(id, db.units, isoToHours(until) + 49), id).toBeNull();
      expect(u.history, id).toMatch(/证据窗/);
      expect(u.history, id).toMatch(/不是.*史实日期/);
      for (const at of ['1937-11-05T00:00', m.time.end]) expect(state(id, at), `${id} ${at}`).toBeNull();
    }
    expect(state('cn.15army', '1937-11-05T00:00')).toBeNull();
    expect(state('cn.88div', m.time.end)?.status).toBe('withdrawing');
    expect(m.ui.legend.after).toContain('消失不代表部队停战、撤退或覆灭');
  });

  it('两军保持平级，海军不挂陆军，守备分队与母师结局分离', () => {
    expect(db.units.get('jp.10army')?.parent).toBeNull();
    expect(db.units.get('jp.shanghai_army')?.parent).toBeNull();
    expect(db.units.get('jp.central_china')?.active?.from).toBe('1937-11-07T00:00');
    expect(db.units.get('jp.shanghai_marines')?.parent).toBe('jp.third_fleet');
    expect(db.units.get('cn.sihang_detachment')?.parent).toBe('cn.88div');
    expect(state('cn.sihang_detachment', '1937-10-31T12:00')?.status).toBe('interned');
    expect(state('cn.88div', '1937-10-31T12:00')?.status).toBe('withdrawing');
    expect(state('cn.baoshan_battalion', '1937-09-07T12:00')?.status).toBe('destroyed');
    expect(state('cn.98div', '1937-09-07T12:00')?.status).not.toBe('destroyed');
  });

  it('四行在日级切换前不插值漂入租界，南侧责任说明不伪造集团军驻地', () => {
    for (const at of ['1937-10-30T12:00', '1937-10-31T00:00', '1937-10-31T06:00', '1937-10-31T11:59']) {
      const u = state('cn.sihang_detachment', at)!;
      expect(u.ll, at).toEqual(pos('sihang'));
      expect(u.status, at).toBe('encircled');
    }
    const hold = db.units.get('cn.sihang_detachment')!.track.find((p) => p.h === isoToHours('1937-10-31T11:59'))!;
    expect(hold.note).toContain('显示哨点');
    expect(hold.note).toContain('不是史实撤离实钟');
    expect(state('cn.sihang_detachment', '1937-10-31T12:00')?.ll).toEqual(pos('settlement'));
    const army = db.units.get('cn.8army')!;
    expect(army.display).toBe('container');
    expect(army.track).toEqual([]);
    for (const at of [m.time.start, '1937-11-05T00:00', m.time.end]) expect(state(army.id, at), at).toBeNull();
    expect(army.history).toContain('不绘地图棋子');
    for (const [id, at] of [['p.baoshan', '1937-09-07T12:00'], ['p.sihang', '1937-10-31T12:00']]) {
      const pocket = db.pockets.find((p) => p.id === id)!, h = isoToHours(at);
      expect(pocket.h1, id).toBeCloseTo(h - 1 / 60);
      expect(h > pocket.h1 && h <= pocket.h1 + 6, id).toBe(true);
      expect(db.pockets.filter((p) => h >= p.h0 && h <= p.h1).includes(pocket), id).toBe(false);
      expect(pocket.note, id).toContain('显示哨点');
      expect(pocket.note, id).toContain('非史实钟点');
    }
  });
});

describe('控制几何、路线语义与照片', () => {
  it('登陆目标帧采用step，金山卫在11月5日前不被提前染占', () => {
    for (const at of ['1937-08-23T00:00', '1937-11-05T00:00']) expect(fronts.find((k) => k.at === at)?.transition).toBe('step');
    for (const f of db.keyframes.filter((k) => k.at < '1937-11-05T00:00')) expect(pointInMulti(pos('jinshanwei'), f.a), f.at).toBe(false);
    expect(pointInMulti(pos('jinshanwei'), controlAt('1937-11-05T00:00'))).toBe(true);
    expect(pointInMulti(pos('chuanshakou'), controlAt('1937-08-23T00:00'))).toBe(true);
    for (const f of db.keyframes) for (const poly of f.a) for (const ring of poly) expect(ringSelfIntersects(ring), f.at).toBeNull();
  });

  it('外国守备核心与羁留点始终非日占，末帧洞与地图唯一环完全同源', () => {
    for (const f of db.keyframes) expect(pointInMulti(pos('settlement'), f.a), f.at).toBe(false);
    const last = db.keyframes.at(-1)!;
    expect(last.a.some((poly) => poly.slice(1).some((ring) => JSON.stringify(ring) === JSON.stringify(foreignCore)))).toBe(true);
    expect(pointInMulti(pos('nanshi'), last.a)).toBe(true);
    expect(pointInMulti(pos('kunshan'), last.a)).toBe(false);
    expect(m.ui.extraLayers?.some((l) => l.key === 'historical_geography' && l.default)).toBe(true);
  });

  it('真实场掩膜与SDF仍保持登陆前空场、核心排除和末帧华界控制', () => {
    const field = fieldModelFor({ def, db, m });
    const valueAt = (ll: LonLat, at: string) => {
      const h = isoToHours(at), [x, y] = toGrid(ll);
      return Math.max(sample(fieldAt(field, h, 0), field.grid, x, y), sample(theaterAt(field, h), field.grid, x, y));
    };
    const value = (id: string, at: string) => valueAt(pos(id), at);
    expect(field.masks.some((v) => (v & (1 << 1)) !== 0)).toBe(false);
    for (const at of ['1937-08-23T00:00', '1937-08-28T12:00', '1937-09-06T23:59', '1937-09-07T11:59']) {
      expect(value('baoshan', at), `宝山县城 ${at}`).toBeGreaterThan(0);
    }
    expect(value('baoshan', '1937-09-07T12:00')).toBeLessThan(0);
    for (const id of ['jp.11div', 'cn.98div']) {
      const at = '1937-08-23T00:00', ll = state(id, at)!.ll, [x, y] = toGrid(ll);
      const mask = field.masks[Math.floor(y) * field.grid.w + Math.floor(x)];
      expect(mask & (1 << m.control.landBit), id).not.toBe(0);
      expect(mask & (1 << m.control.theatreBits[0]), id).not.toBe(0);
      expect(valueAt(ll, at) * (id.startsWith('jp.') ? -1 : 1), id).toBeGreaterThan(0);
    }
    expect(value('jinshanwei', '1937-11-04T23:59')).toBeGreaterThan(0);
    expect(value('jinshanwei', '1937-11-05T00:00')).toBeLessThan(0);
    expect(value('settlement', m.time.end)).toBeGreaterThan(0);
    expect(value('nanshi', m.time.end)).toBeLessThan(0);
    expect(value('kunshan', m.time.start)).toBeGreaterThan(0);
    for (const id of ['sihang', 'baoshan']) {
      const [x, y] = toGrid(pos(id));
      const mask = field.masks[Math.floor(y) * field.grid.w + Math.floor(x)];
      expect(mask & (1 << m.control.landBit), id).not.toBe(0);
      expect(mask & (1 << m.control.theatreBits[0]), id).not.toBe(0);
    }
  }, 60_000);

  it('北川沙海运与陆上方向共享地域显示点，不把地名锚点冒充精测滩头', () => {
    const landing = db.routes.find((r) => r.id === 'r.north_chuansha_sealift')!;
    const inland = db.routes.find((r) => r.id === 'r.luodian_axis')!;
    const ll = state('jp.11div', '1937-08-23T00:00')!.ll;
    expect(ll).toEqual([121.353, 31.477]);
    expect(landing.wps.at(-1)?.ll).toEqual(ll);
    expect(inland.wps[0].ll).toEqual(ll);
    expect(ll).not.toEqual(pos('chuanshakou'));
    expect(state('cn.98div', '1937-08-23T00:00')?.ll).not.toEqual(pos('shizilin'));
    for (const id of ['jp.11div', 'cn.98div']) {
      expect(db.units.get(id)!.track[0].note, id).toContain('显示点');
      expect(db.units.get(id)!.track[0].note, id).toContain('不是');
      expect(db.units.get(id)!.history, id).toContain('不是');
    }
  });

  it('海上登陆路径为sea虚线，不能冒充陆上箭头；撤退方向中文可辨', () => {
    const sea = db.routes.filter((r) => r.role === 'landing');
    expect(sea).toHaveLength(3);
    for (const r of sea) {
      expect(r.movement, r.id).toBe('sea');
      expect(r.confidence, r.id).toBe('low');
    }
    expect(db.routes.some((r) => r.style === 'retreat' && r.label?.includes('向青浦、昆山西撤'))).toBe(true);
  });

  it('只复用已注册通用模型，军人伤亡未捏造拆分', () => {
    for (const u of rawUnits) {
      expect(MODEL_IDS()).toContain(u.model);
      expect(['inf_allied', 'navy_token', 'air_token']).toContain(u.model);
    }
    for (const q of db.equipment.values()) {
      expect([...q.desc].length, q.id).toBeGreaterThanOrEqual(60);
      expect([...q.desc].length, q.id).toBeLessThanOrEqual(140);
      expect(MODEL_IDS()).toContain(q.model);
    }
    for (const side of ['CN', 'JP']) {
      expect(db.forces.sides[side]?.men).toBeNull();
      expect(db.forces.sides[side]?.losses.killed).toContain('未核');
      expect(db.forces.sides[side]?.note).toContain('累计');
    }
  });

  it('配乐只复用共享曲库并低音量播放，现代背景与1937实录明确区分', () => {
    expect(m.audio.music.map((cue) => cue.track)).toEqual(['operations', 'elegy']);
    expect(m.audio.music[0].from).toBe(m.time.start);
    expect(m.audio.music[1].from).toBe('1937-11-09T18:00');
    expect(m.audio.musicVol).toBe(0.28);
    expect(m.credits.extraHtml).toContain('不是1937年现场录音');
    const libraryDir = join(campaignDir(m.id), '../../shared/audio/music');
    const library = JSON.parse(readFileSync(join(libraryDir, 'library.json'), 'utf8')) as { id: string; files: string[]; license: string; licenseUrl?: string; sourceUrl?: string }[];
    const credits = JSON.parse(readFileSync(join(publicDir(m.id), 'credits.json'), 'utf8'));
    expect(credits.music).toHaveLength(2);
    for (const [i, cue] of m.audio.music.entries()) {
      const track = library.find((q) => q.id === cue.track)!;
      expect(track, cue.track).toBeTruthy();
      for (const file of track.files) {
        expect(statSync(join(libraryDir, file)).size, file).toBeGreaterThan(100);
        expect(credits.music[i].file, file).toContain(file);
      }
      expect(credits.music[i].title).toContain('非1937实录');
      expect(credits.music[i].author).toBeTruthy();
      expect(credits.music[i].license).toBe(track.license);
      if (track.licenseUrl) expect(credits.music[i].licenseUrl).toBe(track.licenseUrl);
      if (track.sourceUrl) expect(credits.music[i].sourceUrl).toBe(track.sourceUrl);
    }
  });

  it('照片均来自已核索引、本地文件与署名，排除错期素材', () => {
    expect(Object.keys(photoIndex)).toHaveLength(3);
    for (const [key, photo] of Object.entries(photoIndex)) {
      expect(statSync(join(publicDir(m.id), photo.src)).size, key).toBeGreaterThan(100);
      expect(photo.license, key).toBeTruthy();
      expect(photo.sourceUrl, key).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
    for (const e of events) if (e.photo) expect(photoIndex[e.photo.commons], e.id).toBeTruthy();
    expect(photoIndex[m.intro.photo!]).toBeTruthy();
    expect(Object.values(photoIndex).some((p) => p.src === m.hub.cover)).toBe(true);
    expect(JSON.stringify(events)).not.toMatch(/AWM.*096905|Shanghai1937IJA.hangzhou/i);
    const credits = JSON.parse(readFileSync(join(publicDir(m.id), 'credits.json'), 'utf8'));
    expect(credits.photos).toEqual(Object.values(photoIndex));
    expect(m.credits.sections).toContainEqual(['地理署名', 'geography']);
  });
});
