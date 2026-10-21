/** 武汉会战包的结构、叙事口径及运行时可见性约束；史实独立复核另见 history.test.ts。 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { openCampaign, fieldModelFor } from '../../../tests/helpers';
import { campaignDir, publicDir } from '../../../tools/lib/campaign-node';
import { ManifestSchema } from '../../../engine/schema/zod';
import { isoToHours } from '../../../engine/core/time';
import { MODEL_IDS } from '../../../engine/three/models';
import type { ControlKeyframe, HistEvent, LonLat, Unit } from '../../../engine/core/types';

const { def, db, m } = openCampaign('wuhan-1938');
const files = def.data as Record<string, unknown>;
const rawUnits = Object.entries(files).filter(([k]) => k.includes('/oob/')).flatMap(([, v]) => v as Unit[]);
const events = files['./data/events.json'] as HistEvent[];
const fronts = Object.entries(files).filter(([k]) => k.includes('/fronts/')).map(([, v]) => v as ControlKeyframe).sort((a, b) => a.at.localeCompare(b.at));
const photoIndex = JSON.parse(readFileSync(join(publicDir(m.id), 'photos/index.json'), 'utf8')) as Record<string, { src: string; license: string; sourceUrl: string }>;
const credits = JSON.parse(readFileSync(join(publicDir(m.id), 'credits.json'), 'utf8')) as { photos: unknown[] };

describe('武汉会战包结构与卷宗身份', () => {
  it('完整清单合法，卷宗身份与中国战区映射不变', () => {
    expect(ManifestSchema.safeParse(m).success).toBe(true);
    expect(m.id).toBe('wuhan-1938');
    expect(m.hub.order).toBe(11);
    expect(m.hub.pin).toEqual([114.28, 30.58]);
    expect(m.hub.stencil).toBe('WUHAN 1938');
    expect(m.hub.region).toBe('china');
    expect(m.sides.map((s) => s.id)).toEqual(['JP', 'CN']);
    expect(m.sideOrder).toEqual(['CN', 'JP']);
    expect(m.control.slots.map((s) => s.key)).toEqual(['JP']);
    expect(m.control.theatreBits).toEqual([0]);
    const geo = JSON.parse(readFileSync(join(campaignDir(m.id), 'config/geo.config.json'), 'utf8'));
    expect(geo.borders.ids['Chinese warlords']).toBe('CN');
    expect(geo.masks.bits['0']).toEqual(['CN']);
    expect(def.frame.bbox).toEqual([112, 28, 118.5, 33.5]);
    expect(m.hub.theatre?.bbox).toEqual(def.frame.bbox);
  });

  it('时窗覆盖前奏至三镇易手，时区与阶段正确', () => {
    expect(m.time.start).toBe('1938-02-18T00:00');
    expect(m.time.end).toBe('1938-10-27T23:59');
    expect(m.time.dataEnd).toBe(m.time.end);
    expect(m.time.tzLabel).toBe('UTC+8');
    expect(m.time.utcOffset).toBe(8);
    expect(m.phases.map((p) => p.id)).toEqual(['prelude', 'upriver', 'fortresses', 'race', 'attrition', 'encirclement', 'abandon']);
    expect(m.phases.length).toBe(7);
  });

  it('所有数据不含生成器占位符', () => {
    const blob = JSON.stringify(files) + JSON.stringify(m);
    expect(blob).not.toMatch(/todo_source|theatre_center|待补|待定|（待补/);
  });

  it('部队模型在白名单内（通用象征，非1938制服复原）', () => {
    const allowed = new Set(['inf_allied', 'navy_token', 'air_token', 'art_gun']);
    for (const u of rawUnits) {
      const model = u.model ?? m.sides.find((s) => s.id === u.side)?.defaultModel;
      expect(allowed.has(model as string), `${u.id} model ${model}`).toBe(true);
      expect(MODEL_IDS()).toContain(model as string);
    }
  });

  it('日方推进方在 A 槽，中方为战区；日方师团与中方军级编制齐备', () => {
    const jpDiv = rawUnits.filter((u) => u.side === 'JP' && u.echelon === 'division').map((u) => u.id);
    for (const id of ['jp.div6', 'jp.div9', 'jp.div27', 'jp.div101', 'jp.div106', 'jp.div3', 'jp.div10', 'jp.div13', 'jp.div16', 'jp.div116'])
      expect(jpDiv, id).toContain(id);
    expect(rawUnits.some((u) => u.id === 'jp.hata')).toBe(true);
    const cnKey = rawUnits.map((u) => u.id);
    for (const id of ['cn.army71', 'cn.army74', 'cn.army2t', 'cn.army27', 'cn.army17', 'cn.zhongshan', 'cn.air4', 'cn.soviet', 'cn.madang', 'cn.tianjia'])
      expect(cnKey, id).toContain(id);
  });

  it('照片三件套一致：index.json、本地文件、credits.json', () => {
    expect(credits.photos).toEqual(Object.values(photoIndex));
    for (const [commons, p] of Object.entries(photoIndex)) {
      expect(commons).toMatch(/^File:/);
      expect(p.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      const fp = join(publicDir(m.id), p.src);
      expect(statSync(fp).size, p.src).toBeGreaterThan(1000);
    }
    // hub.cover 与 intro.photo 必须在 index 中
    const srcs = new Set(Object.values(photoIndex).map((p) => p.src));
    expect(srcs.has(m.hub.cover as string)).toBe(true);
    const commonsSet = new Set(Object.keys(photoIndex));
    expect(commonsSet.has((m.intro as { photo?: string }).photo ?? '')).toBe(true);
  });

  it('事件配图全部在 photos/index.json', () => {
    for (const e of events) {
      if (e.photo?.commons) expect(photoIndex, `${e.id} photo`).toHaveProperty(e.photo.commons);
    }
  });

  it('fronts 帧名与 at 一致、22 帧、登陆突变用 step', () => {
    expect(fronts.length).toBe(22);
    for (const k of fronts) {
      const expected = k.at.replace(/:/g, '-') + '.json';
      expect(Object.keys(files).some((p) => p.endsWith('/fronts/' + expected)), expected).toBe(true);
    }
    const stepFrames = fronts.filter((k) => k.transition === 'step').map((k) => k.at);
    for (const at of ['1938-02-18T00:00', '1938-06-12T00:00', '1938-07-26T00:00', '1938-10-12T00:00', '1938-10-25T00:00'])
      expect(stepFrames, at).toContain(at);
  });
});
