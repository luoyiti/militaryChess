/** 视图约束：2D 背景瓦片覆盖（任何缩放与拖动都不露边）、3D 周边地形条带与远景限位、事件缩放取 zoomRel。 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { clampViewport, coverageScale, visibleWorld } from '../../engine/map2d/coverage';
import { buildContextGeometry, createContextViewLimiter } from '../../engine/three/sandbox/contextTerrain';
import { Director } from '../../engine/app/director';
import type { REvent } from '../../engine/data/db';
import { openCampaign } from '../helpers';

const bounds = [-8192, -4019, 16384, 12057] as const;
describe('2D 连续地理覆盖', () => {
  for (const size of [{ width: 1024, height: 551 }, { width: 1600, height: 950 }, { width: 3440, height: 1440 }, { width: 390, height: 844 }]) {
    it(`${size.width}×${size.height} 下缩小与远距拖动后四边仍被覆盖`, () => {
      for (const view of [{ k: 0.0001, x: 0, y: 0 }, { k: 0.25, x: -200000, y: 300000 }, { k: 1.2, x: 200000, y: -300000 }]) {
        const v = clampViewport(view, size, bounds);
        const [x0, y0, x1, y1] = visibleWorld(v, size);
        expect(x0).toBeGreaterThanOrEqual(bounds[0] - 1e-6);
        expect(y0).toBeGreaterThanOrEqual(bounds[1] - 1e-6);
        expect(x1).toBeLessThanOrEqual(bounds[2] + 1e-6);
        expect(y1).toBeLessThanOrEqual(bounds[3] + 1e-6);
        expect(v.k).toBeGreaterThanOrEqual(coverageScale(size, bounds));
      }
    });
  }
  it('合法的视图保持不变', () => {
    const size = { width: 1200, height: 800 }, v = { k: 0.25, x: -600, y: -200 };
    expect(clampViewport(v, size, bounds)).toEqual(v);
  });
});

describe('3D 周边地形', () => {
  it('周边条带包围战区且不与战区表面重叠', () => {
    const extent = { origin: [-100, -40] as [number, number], worldWidth: 300, worldHeight: 160 };
    const g = buildContextGeometry(extent, 100, 80, 20, 16, (x, y) => (x + y) * 0.01);
    const p = g.getAttribute('position'), uv = g.getAttribute('uv'), ix = g.index!;
    for (let i = 0; i < ix.count; i += 3) {
      const idx = [ix.getX(i), ix.getX(i + 1), ix.getX(i + 2)];
      const x = idx.reduce((n, j) => n + p.getX(j), 0) / 3, z = idx.reduce((n, j) => n + p.getZ(j), 0) / 3;
      expect(x > -50 && x < 50 && z > -40 && z < 40).toBe(false);
    }
    expect(uv.count).toBe(p.count);
    expect(g.boundingBox!.min.x).toBe(-150);
    expect(g.boundingBox!.max.x).toBe(150);
    g.dispose();
  });
  it('远景相机被限制在有地形覆盖的范围内', () => {
    const extent = { origin: [-8192, -4019] as [number, number], worldWidth: 24576, worldHeight: 16076 };
    const target = new THREE.Vector3(19000, 0, 14000);
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 20, 30000);
    camera.position.set(target.x + 500, 9000, target.z + 10000); camera.lookAt(target);
    createContextViewLimiter(camera, target, extent, 8192, 8038, 250, 9000)();
    expect(camera.position.distanceTo(target)).toBeLessThanOrEqual(9000.01);
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      expect(ray.ray.intersectPlane(plane, hit)).not.toBeNull();
      expect(hit.x).toBeGreaterThanOrEqual(-12288 - 0.01);
      expect(hit.x).toBeLessThanOrEqual(12288 + 0.01);
      expect(hit.z).toBeGreaterThanOrEqual(-8038 - 0.01);
      expect(hit.z).toBeLessThanOrEqual(8038 + 0.01);
    }
  });
});

describe('导演缩放', () => {
  it('事件的 zoomRel 原样作为相对缩放；缺省按重要度取 manifest.director.defaultZoom', () => {
    openCampaign('balkans-1941');
    const director = Object.create(Director.prototype) as Director;
    expect(director.zoomFor({ zoomRel: 5.2, importance: 1 } as REvent)).toBe(5.2);
    expect(Number.isFinite(director.zoomFor({ importance: 2 } as REvent))).toBe(true);
  });
});
