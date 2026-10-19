import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { geoConicConformal } from 'd3-geo';
import { ROOT, campaignDir, publicDir } from '../../../tools/lib/campaign-node';
import type { Place } from '../../../engine/core/types';

const dir = campaignDir('leningrad-1941');
const pub = publicDir('leningrad-1941');
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const frame = json(join(dir, 'config/frame.json'));
const geo = json(join(dir, 'config/geo.config.json'));
const masks = readFileSync(join(pub, 'geo/field_masks.bin'));
const projection = geoConicConformal().parallels(frame.projection.parallels)
  .rotate(frame.projection.rotate).center(frame.projection.center)
  .scale(frame.scale).translate(frame.translate);
const valueAt = (ll: [number, number]) => {
  const [x, y] = projection(ll)!;
  return masks[Math.floor(y / frame.field.cell) * frame.field.w + Math.floor(x / frame.field.cell)];
};
const gaz = new Map<string, Place>(json(join(dir, 'data/gazetteer/places.json')).map((p: Place) => [p.id, p]));

describe('列宁格勒 · 地理与可再生资产', () => {
  it('从东普鲁士覆盖完整拉多加湖与斯维里河，配置能精确重算投影', () => {
    expect(frame.bbox).toEqual([20, 54, 36, 62.8]);
    expect(frame.projection).toEqual({ type: 'conicConformal', parallels: [55, 61], rotate: [-28, 0], center: [0, 58.4] });
    expect(frame.width).toBe(8192);
    expect(frame.field.cell).toBe(10);
    expect(frame.kmPerUnit * frame.field.cell).toBeLessThan(1.3);
    expect(execFileSync('node', ['tools/geo/emit_frame.mjs', 'leningrad-1941', '--check'], { cwd: ROOT, encoding: 'utf8' }))
      .toContain('与配置重算结果一致');
  });

  it('1941政治底图把波罗的海、维堡和索尔塔瓦拉归入苏方，东普鲁士与梅梅尔归德方', () => {
    for (const p of [[30.316, 59.939], [28.753, 60.710], [30.693, 61.703], [24.105, 56.949], [24.745, 59.437], [23.904, 54.898]] as [number, number][])
      expect(valueAt(p), p.join(',')).toBe(17);
    for (const p of [[21.88, 55.083], [21.135, 55.713]] as [number, number][])
      expect(valueAt(p), p.join(',')).toBe(18);
    expect(valueAt([24.938, 60.17])).toBe(20);
    expect(geo.masks.bits).toEqual({ '0': ['SU'], '1': ['DE'], '2': ['FI'] });
  });

  it('大湖不作为可占领陆地或陆地六角格，1939参考线不参与国家掩膜', () => {
    expect(valueAt([31.5, 61])).toBe(0);
    expect(valueAt([31.3, 58.2])).toBe(0);
    const correction = json(join(pub, 'geo/field_masks.json')).waterCorrection;
    expect(correction.clearedLakeCells).toBeGreaterThan(30_000);
    const demarcation = json(join(dir, 'data/demarcation.json'));
    expect(demarcation).toHaveLength(1);
    expect(demarcation[0].name.zh).toContain('1939');
    expect(demarcation[0].note).toContain('不参与实时控制区掩膜');
  });

  it('全部瓦片与2D/3D地形真实可解码，尺寸与画幅一致', () => {
    expect(execFileSync('sh', ['tools/py.sh', 'campaigns/leningrad-1941/pipeline/geo/verify_assets.py', '--check'], { cwd: ROOT, encoding: 'utf8' }))
      .toContain('340 tiles');
    expect(masks.byteLength).toBe(frame.field.w * frame.field.h);
    const topology = json(join(pub, 'geo/vectors.topo.json'));
    const labels = (k: string) => topology.objects[k].geometries.map((g: { properties?: { zh?: string } }) => g.properties?.zh);
    expect(labels('lakes')).toEqual(expect.arrayContaining(['拉多加湖', '奥涅加湖', '伊尔门湖']));
    expect(labels('rivers')).toEqual(expect.arrayContaining(['涅瓦河', '斯维里河', '沃尔霍夫河']));
    expect(topology.objects.forest.geometries.length).toBeGreaterThanOrEqual(11);
    expect(topology.objects.marsh.geometries.length).toBeGreaterThanOrEqual(7);
    expect(existsSync(join(dir, 'pipeline/geo/germany1939_reference.geojson'))).toBe(true);
    expect(existsSync(join(dir, 'pipeline/geo/treaty1939_reference.json'))).toBe(true);
  });

  it('港口、铁路端点和战毁村与同名现代地物分开，示意高地明确标注精度', () => {
    expect(gaz.size).toBeGreaterThanOrEqual(120);
    expect(gaz.get('kobona')!.pos[0]).toBeCloseTo(31.555, 2);
    expect(gaz.get('polyany')!.pos[0]).toBeCloseTo(31.455, 2);
    expect(gaz.get('sinyavino')!.pos[1]).toBeLessThan(59.85);
    expect(gaz.get('sinyavino_modern')!.pos[1]).toBeGreaterThan(59.9);
    expect(gaz.get('sinyavino_43_3')!.pos[1]).toBeGreaterThan(gaz.get('sinyavino')!.pos[1]);
    expect(gaz.get('sinyavino_50_1')!.pos[1]).toBeLessThan(gaz.get('sinyavino')!.pos[1]);
    expect(gaz.get('sinyavino_50_1')!.confidence).toBe('low');
    expect(gaz.get('sinyavino_50_1')!.alt).toContain('示意');
    for (const id of ['kobona_harbour', 'shlisselburg_bridge', 'victory_rail_mid', 'russko_vysotskoye', 'kareji', 'oreshek'])
      expect(gaz.get(id)?.sources?.length, id).toBeGreaterThan(0);
    expect(gaz.get('oreshek')!.alt).toContain('岛小于控制场网格');
    const lod = json(join(dir, 'config/lod.json'));
    expect(lod.levels.map((l: { minK: number }) => l.minK)).toEqual([0, 5, 10.5]);
    expect(lod.levels[2].echelons).toEqual(expect.arrayContaining(['brigade', 'regiment', 'ship']));
  });
});
