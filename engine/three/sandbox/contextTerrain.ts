import * as THREE from 'three';

export interface TerrainExtent {
  origin: [number, number];
  worldWidth: number;
  worldHeight: number;
}

/** Four non-overlapping strips surround the campaign rectangle; UVs refer to one real map. */
export function buildContextGeometry(
  extent: TerrainExtent,
  coreWidth: number,
  coreHeight: number,
  coreSegmentsX: number,
  coreSegmentsY: number,
  heightAt: (wx: number, wy: number) => number,
): THREE.BufferGeometry {
  const [x0, y0] = extent.origin;
  const x1 = x0 + extent.worldWidth, y1 = y0 + extent.worldHeight;
  if (!(x0 < 0 && y0 < 0 && x1 > coreWidth && y1 > coreHeight)) throw new Error('周边地形范围没有完整包住战区');
  const step = coreWidth / 160;
  const axis = (a: number, b: number, segments = Math.ceil((b - a) / step)) =>
    Array.from({ length: segments + 1 }, (_, i) => a + (b - a) * i / segments);
  const coreX = axis(0, coreWidth, coreSegmentsX), coreY = axis(0, coreHeight, coreSegmentsY);
  const northY = axis(y0, 0), southY = axis(coreHeight, y1);
  // The inner boundaries have exactly the same vertices as the core mesh, preventing cracks.
  const allY = [...northY.slice(0, -1), ...coreY, ...southY.slice(1)];
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const patch = (xs: number[], ys: number[]) => {
    const offset = positions.length / 3, cols = xs.length;
    for (const wy of ys) for (const wx of xs) {
      positions.push(wx - coreWidth / 2, heightAt(wx, wy), wy - coreHeight / 2);
      uv.push((wx - x0) / extent.worldWidth, 1 - (wy - y0) / extent.worldHeight);
    }
    for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
      const a = offset + j * cols + i, b = a + 1, c = a + cols, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  };
  patch(axis(x0, 0), allY);
  patch(axis(coreWidth, x1), allY);
  patch(coreX, northY);
  patch(coreX, southY);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Keep the ground footprint within the real map, adjusting distance before constraining pan. */
export function createContextViewLimiter(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  extent: TerrainExtent,
  coreWidth: number,
  coreHeight: number,
  minDistance: number,
  defaultMaxDistance: number,
) {
  const padding = 100;
  const bounds = new THREE.Box2(
    new THREE.Vector2(extent.origin[0] - coreWidth / 2 + padding, extent.origin[1] - coreHeight / 2 + padding),
    new THREE.Vector2(extent.origin[0] + extent.worldWidth - coreWidth / 2 - padding, extent.origin[1] + extent.worldHeight - coreHeight / 2 - padding),
  );
  const corners = [new THREE.Vector2(-1, -1), new THREE.Vector2(-1, 1), new THREE.Vector2(1, -1), new THREE.Vector2(1, 1)];
  const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3(), point = new THREE.Vector2(), footprint = new THREE.Box2();
  const offset = new THREE.Vector3(), boundsSize = bounds.getSize(new THREE.Vector2()), footprintSize = new THREE.Vector2();
  const projectGround = () => {
    camera.updateMatrixWorld();
    footprint.makeEmpty();
    for (const corner of corners) {
      raycaster.setFromCamera(corner, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) footprint.expandByPoint(point.set(hit.x, hit.z));
    }
    return !footprint.isEmpty();
  };
  return () => {
    if (!projectGround()) return defaultMaxDistance;
    footprint.getSize(footprintSize);
    const distance = camera.position.distanceTo(target);
    const fitsAt = distance * Math.min(boundsSize.x / Math.max(1, footprintSize.x), boundsSize.y / Math.max(1, footprintSize.y));
    const maxDistance = Math.max(minDistance, Math.min(defaultMaxDistance, fitsAt * 0.97));
    if (distance > maxDistance) {
      offset.subVectors(camera.position, target).setLength(maxDistance);
      camera.position.copy(target).add(offset);
      projectGround();
    }
    const dx = footprint.min.x < bounds.min.x ? bounds.min.x - footprint.min.x : footprint.max.x > bounds.max.x ? bounds.max.x - footprint.max.x : 0;
    const dz = footprint.min.y < bounds.min.y ? bounds.min.y - footprint.min.y : footprint.max.y > bounds.max.y ? bounds.max.y - footprint.max.y : 0;
    if (dx || dz) {
      target.x += dx; target.z += dz;
      camera.position.x += dx; camera.position.z += dz;
      camera.updateMatrixWorld();
    }
    return maxDistance;
  };
}
