/** 不列颠空战：1940 型飞机模型的尺寸、圆徽可见性与装备数据。 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { existsSync, readFileSync } from 'node:fs';
import { makeDataSchemas } from '../../../engine/schema/zod';
import { MODEL_IDS } from '../../../engine/three/models/index';
import { SYNTH_IDS } from '../../../engine/audio/synth';
import { manifestOf } from '../../../tests/helpers';
type ModelId = string;
const { Equipment, Source } = makeDataSchemas(manifestOf('britain-1940'), { models: MODEL_IDS(), sfx: SYNTH_IDS() });
import { MODEL_SPECS, buildModel, buildInstanceGeometry, countTriangles } from '../../../engine/three/models/index';

// Independent acceptance dimensions for the 1940 variants: length, span, overall height in metres.
const AIRCRAFT: [ModelId, number, number, number][] = [
  ['spitfire', 9.12, 11.23, 3.86], ['hurricane', 9.84, 12.19, 3.96],
  ['bf109', 8.64, 9.87, 3.4], ['bf110', 12.65, 16.27, 3.5],
  ['he111', 16.4, 22.6, 4], ['do17', 15.8, 18, 4.56],
  ['ju87', 11.1, 13.8, 4.23], ['ju88', 14.36, 18.25, 5.07],
];

function expectBounds(bb: THREE.Box3, length: number, span: number, height: number) {
  const size = bb.getSize(new THREE.Vector3());
  for (const [actual, expected] of [[size.x, length], [size.z, span], [size.y, height]]) {
    expect(Math.abs(actual - expected) / expected).toBeLessThan(.05);
  }
  expect(Math.abs(bb.min.y)).toBeLessThan(.001);
  expect(Math.abs(bb.min.x + bb.max.x)).toBeLessThan(.002);
  expect(Math.abs(bb.min.z + bb.max.z)).toBeLessThan(.002);
}

describe('1940 飞机模型接受条件', () => {
  for (const [id, length, span, height] of AIRCRAFT) {
    it(`${id} 以真实米制尺寸构建两级细节，符合沙盘单几何和底面原点契约`, () => {
      expect(MODEL_SPECS[id]).toBeDefined();
      expect(MODEL_SPECS[id].kind).toBe('aircraft');
      const displayed = buildModel(id);
      expect(countTriangles(displayed)).toBeGreaterThan(100);
      expect(countTriangles(displayed)).toBeLessThanOrEqual(20000);
      expectBounds(new THREE.Box3().setFromObject(displayed), length, span, height);
      const instance = buildInstanceGeometry(id);
      expect(instance.index).toBeNull();
      expect(instance.getAttribute('position').count / 3).toBeLessThanOrEqual(1500);
      expect(instance.getAttribute('color').count).toBe(instance.getAttribute('position').count);
      for (const name of ['position', 'normal', 'color']) {
        expect(Array.from(instance.getAttribute(name).array).every(Number.isFinite)).toBe(true);
      }
      instance.computeBoundingBox();
      expectBounds(instance.boundingBox!, length, span, height);
    });
  }

  for (const id of ['spitfire', 'hurricane'] as const) {
    it(`${id} 的沙盘圆徽位于机翼上表面，缩放后不会被机翼遮住`, () => {
      const geo = buildInstanceGeometry(id), colors = geo.getAttribute('color'), positions = geo.getAttribute('position');
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      mesh.updateMatrixWorld();
      const ray = new THREE.Raycaster(), vertex = new THREE.Vector3();
      const span = MODEL_SPECS[id].widthM;
      let checked = 0;
      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        if (Math.abs(vertex.z) < span * .25 || colors.getZ(i) <= colors.getY(i) * 1.2 || colors.getZ(i) <= colors.getX(i) * 1.3) continue;
        ray.set(new THREE.Vector3(vertex.x, vertex.y + 100, vertex.z), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObject(mesh)[0];
        expect(hit).toBeDefined();
        expect(hit.point.y - vertex.y).toBeLessThan(.015);
        checked++;
      }
      expect(checked).toBeGreaterThan(10);
    });
  }

  it('每种装备绑定同名模型，只有英国/德国阵营，1940 型别和来源可解析', () => {
    const equipment = Equipment.array().parse(JSON.parse(readFileSync(new URL('../data/equipment.json', import.meta.url), 'utf8')));
    expect(equipment).toHaveLength(8);
    expect(equipment.map(q => q.model).sort()).toEqual(AIRCRAFT.map(([id]) => id).sort());
    const sourcePath = new URL('../data/sources/equipment.json', import.meta.url);
    expect(existsSync(sourcePath)).toBe(true);
    const sources = Source.array().parse(JSON.parse(readFileSync(sourcePath, 'utf8')));
    const sourceIds = new Set(sources.map(source => source.id));
    for (const q of equipment) {
      expect(q.id).toBe(q.model);
      expect(['GB', 'DE']).toContain(q.side);
      expect((q as Record<string, unknown>).count1939).toBeUndefined(); // v2 统一为 count
      expect(q.desc.length).toBeGreaterThanOrEqual(60);
      expect(q.desc.length).toBeLessThanOrEqual(140);
      expect(q.sources.every(id => sourceIds.has(id))).toBe(true);
    }
    expect(equipment.find(q => q.id === 'spitfire')!.name.orig).toMatch(/Mk I/);
    expect(equipment.find(q => q.id === 'ju88')!.name.orig).toMatch(/A-1/);
  });
});
