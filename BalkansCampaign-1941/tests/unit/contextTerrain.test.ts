import { it, expect } from 'vitest';
import * as THREE from 'three';
import { buildContextGeometry, createContextViewLimiter } from '../../src/three/sandbox/contextTerrain';

it('surrounds the theatre with real terrain strips without overlapping its surface', () => {
  const extent = { origin: [-100, -40] as [number, number], worldWidth: 300, worldHeight: 160 };
  const g = buildContextGeometry(extent, 100, 80, 20, 16, (x, y) => (x + y) * .01);
  const p = g.getAttribute('position'), uv = g.getAttribute('uv'), ix = g.index!;
  for (let i = 0; i < ix.count; i += 3) {
    const indices = [ix.getX(i), ix.getX(i + 1), ix.getX(i + 2)];
    const x = indices.reduce((n, j) => n + p.getX(j), 0) / 3;
    const z = indices.reduce((n, j) => n + p.getZ(j), 0) / 3;
    expect(x > -50 && x < 50 && z > -40 && z < 40).toBe(false);
  }
  expect(uv.count).toBe(p.count);
  expect(g.boundingBox!.min.x).toBe(-150);
  expect(g.boundingBox!.max.x).toBe(150);
  g.dispose();
});

it('constrains a distant 3D camera to a covered ground footprint', () => {
  const extent = { origin: [-8192, -4019] as [number, number], worldWidth: 24576, worldHeight: 16076 };
  const target = new THREE.Vector3(19000, 0, 14000);
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 20, 30000);
  camera.position.set(target.x + 500, 9000, target.z + 10000); camera.lookAt(target);
  const constrain = createContextViewLimiter(camera, target, extent, 8192, 8038, 250, 9000);
  constrain();
  expect(camera.position.distanceTo(target)).toBeLessThanOrEqual(9000.01);
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    ray.setFromCamera(new THREE.Vector2(x, y), camera);
    expect(ray.ray.intersectPlane(plane, hit)).not.toBeNull();
    expect(hit.x).toBeGreaterThanOrEqual(-12288 - .01);
    expect(hit.x).toBeLessThanOrEqual(12288 + .01);
    expect(hit.z).toBeGreaterThanOrEqual(-8038 - .01);
    expect(hit.z).toBeLessThanOrEqual(8038 + .01);
  }
});
