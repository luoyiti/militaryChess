/** 3D 模型注册表：每个模型都能构建，卡片版与实例版的三角形预算、真实尺寸（MODEL_SPECS）与原点约定。 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MODEL_IDS, MODEL_SPECS, buildModel, buildInstanceGeometry, countTriangles } from '../../engine/three/models/index';

const size = (o: THREE.Object3D | THREE.BufferGeometry) => {
  const bb = o instanceof THREE.BufferGeometry ? (o.computeBoundingBox(), o.boundingBox!) : new THREE.Box3().setFromObject(o);
  return { bb, s: bb.getSize(new THREE.Vector3()) };
};
const rel = (a: number, b: number) => Math.abs(a - b) / b;

describe('3D 模型注册表', () => {
  it('每个已注册模型都有尺寸规格', () => {
    expect(MODEL_IDS().filter((id) => !MODEL_SPECS[id])).toEqual([]);
  });
  for (const id of MODEL_IDS()) {
    describe(id, () => {
      const spec = MODEL_SPECS[id];
      it('卡片版：可构建、≤20k 三角形、尺寸误差 <5%、原点在底面中心', () => {
        const g = buildModel(id);
        const tri = countTriangles(g);
        expect(tri).toBeGreaterThan(spec.kind === 'naval' || spec.kind === 'air' ? 10 : 100);
        expect(tri).toBeLessThanOrEqual(20000);
        const { bb, s } = size(g);
        expect(rel(s.x, spec.lengthM), `长 ${s.x.toFixed(2)} vs ${spec.lengthM}`).toBeLessThan(0.05);
        expect(rel(s.z, spec.widthM), `宽 ${s.z.toFixed(2)} vs ${spec.widthM}`).toBeLessThan(0.05);
        expect(rel(s.y, spec.heightM), `高 ${s.y.toFixed(2)} vs ${spec.heightM}`).toBeLessThan(0.05);
        expect(Math.abs(bb.min.y)).toBeLessThan(1e-3);
        expect(Math.abs(bb.min.x + bb.max.x) / 2).toBeLessThan(1e-3);
        expect(Math.abs(bb.min.z + bb.max.z) / 2).toBeLessThan(1e-3);
      });
      it('实例版：单一几何、≤1.5k 三角形（舰船 ≤3k）、带 color、尺寸误差 <5%', () => {
        const geo = buildInstanceGeometry(id);
        expect(geo.index).toBeNull();
        expect(geo.getAttribute('position').count / 3).toBeLessThanOrEqual(spec.kind === 'naval' ? 3000 : 1500);
        const col = geo.getAttribute('color');
        expect(col).toBeTruthy();
        expect(col.count).toBe(geo.getAttribute('position').count);
        expect(geo.getAttribute('normal')).toBeTruthy();
        for (const v of col.array as Float32Array) expect(Number.isFinite(v)).toBe(true);
        const { s } = size(geo);
        expect(rel(s.x, spec.lengthM)).toBeLessThan(0.05);
        expect(rel(s.z, spec.widthM)).toBeLessThan(0.05);
        expect(rel(s.y, spec.heightM)).toBeLessThan(0.05);
      });
    });
  }
});
