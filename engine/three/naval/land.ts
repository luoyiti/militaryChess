/**
 * 海岸与陆地：geo/vectors.topo.json 的 land（2D 世界坐标）→ 经纬度（一次）→ 局部切平面，
 * 裁剪到焦点周围的正方形（Sutherland–Hodgman），ShapeUtils 三角化顶面，海岸线处加竖直岸壁（低矮拉伸）。
 */
import { SpatialIndex, type Bounds } from '../../geo/spatial';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { MultiPolygon, Polygon } from 'geojson';
import type { LonLat } from '../../core/types';
import type { LocalFrame } from './geo';

export type LLPolygon = LonLat[][]; // 外环 + 内环

/** Broad phase in longitude/latitude; wrapping polygons are conservatively retained. */
export function indexLand(polys: LLPolygon[]) {
  const wrapping: LLPolygon[] = [];
  const entries: { value: LLPolygon; bounds: Bounds }[] = [];
  for (const poly of polys) {
    const ring = poly[0]; if (!ring?.length) continue;
    const xs=ring.map(p=>p[0]), ys=ring.map(p=>p[1]);
    const bounds: Bounds = [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    if(bounds[2]-bounds[0]>180) wrapping.push(poly); else entries.push({value:poly,bounds});
  }
  const index = new SpatialIndex(entries, 5);
  return { query(frame: LocalFrame, radius: number) {
    const dx=radius/frame.kx, dy=radius/frame.kz;
    const found = new Set(wrapping);
    for(const shift of [-360,0,360]) for(const poly of index.query([frame.lon0-dx+shift,frame.lat0-dy,frame.lon0+dx+shift,frame.lat0+dy])) found.add(poly);
    return [...found];
  } };
}

/** 读取陆地多边形（经纬度）；unproject = 2D 世界坐标 → 经纬度 */
export async function loadLand(url: string, unproject: (xy: readonly number[]) => LonLat): Promise<LLPolygon[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} 加载失败（${r.status}）`);
  const topo = (await r.json()) as Topology;
  const obj = topo.objects.land as GeometryCollection | undefined;
  if (!obj) return [];
  const fc = feature(topo, obj) as unknown as { features: { geometry: Polygon | MultiPolygon | null }[] };
  const out: LLPolygon[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const p of polys) out.push(p.map((ring) => ring.map((xy) => unproject(xy))));
  }
  return out;
}

/** 多边形环裁剪到轴对齐正方形 [-R, R]²（Sutherland–Hodgman，凸裁剪窗） */
export function clipRing(ring: number[][], R: number): number[][] {
  let pts = ring;
  const edges: [number, number][] = [[0, 1], [0, -1], [1, 1], [1, -1]]; // [轴, 方向]：x ≤ R, x ≥ -R, z ≤ R, z ≥ -R
  for (const [ax, sg] of edges) {
    if (pts.length < 3) return [];
    const inside = (p: number[]) => sg * p[ax] <= R;
    const out: number[][] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const t = (sg * R - a[ax]) / (b[ax] - a[ax]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    pts = out;
  }
  return pts.length >= 3 ? pts : [];
}

/** 去掉过密的点（米），并去除首尾重复点 */
function simplify(ring: number[][], minStep: number): number[][] {
  const out: number[][] = [];
  for (const p of ring) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minStep) out.push(p);
  }
  if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < minStep) out.pop();
  return out;
}

/**
 * 陆地几何（单位高度 1，沙盘按需缩放 y）：顶面 + 岸壁。radius = 裁剪半径（米），minStep = 简化步长（米）。
 * 位置属性为局部切平面坐标（x 东，z 南）。
 */
export function buildLandGeometry(polys: LLPolygon[], frame: LocalFrame, radius: number, minStep: number): THREE.BufferGeometry | null {
  const pos: number[] = [];
  const shade: number[] = []; // 1 = 顶面，0 = 岸壁底
  const onBox = (p: number[]) => Math.abs(Math.abs(p[0]) - radius) < 1 || Math.abs(Math.abs(p[1]) - radius) < 1;
  for (const poly of polys) {
    // 先用外环的经纬度包围盒快速剔除
    const outer = poly[0];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const rings = poly.map((ring) => ring.map((ll) => { const x = frame.x(ll), z = frame.z(ll); return [x, z]; }));
    for (const [x, z] of rings[0]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; }
    if (!outer.length || maxX < -radius || minX > radius || maxZ < -radius || minZ > radius) continue;
    const clipped = rings.map((r) => simplify(clipRing(r, radius), minStep)).filter((r) => r.length >= 3);
    if (!clipped.length || clipped[0].length < 3) continue;
    const contour = clipped[0].map(([x, z]) => new THREE.Vector2(x, z));
    const holes = clipped.slice(1).map((r) => r.map(([x, z]) => new THREE.Vector2(x, z)));
    let tris: number[][];
    try { tris = THREE.ShapeUtils.triangulateShape(contour, holes); } catch { continue; }
    const all = [...contour, ...holes.flat()];
    for (const [a, b, c] of tris) {
      // 顶面朝上（三角形绕向按法线校正）
      const A = all[a], Bv = all[b], C = all[c];
      const cross = (Bv.x - A.x) * (C.y - A.y) - (Bv.y - A.y) * (C.x - A.x);
      const order = cross > 0 ? [A, C, Bv] : [A, Bv, C];
      for (const p of order) { pos.push(p.x, 1, p.y); shade.push(1); }
    }
    // 岸壁（裁剪窗边界上的边不画）
    for (const ring of clipped) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        if (onBox(a) && onBox(b)) continue;
        pos.push(a[0], -0.4, a[1], b[0], -0.4, b[1], b[0], 1, b[1], a[0], -0.4, a[1], b[0], 1, b[1], a[0], 1, a[1]);
        shade.push(0, 0, 1, 0, 1, 1);
        // 双面：反向再画一次（外环与内环绕向不一，省去判断）
        pos.push(a[0], -0.4, a[1], b[0], 1, b[1], b[0], -0.4, b[1], a[0], -0.4, a[1], a[0], 1, a[1], b[0], 1, b[1]);
        shade.push(0, 1, 0, 0, 1, 1);
      }
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTop', new THREE.Float32BufferAttribute(shade, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** 陆地材质：纸色/土色按世界坐标噪声变化，岸壁较暗 */
export function landMaterial(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aTop; varying float vTop; varying vec2 vXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTop = aTop; vXZ = (modelMatrix * vec4(position, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vTop; varying vec2 vXZ;
        float lh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float ln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(lh(i), lh(i+vec2(1,0)), f.x), mix(lh(i+vec2(0,1)), lh(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float n = ln(vXZ / 38000.0) * 0.6 + ln(vXZ / 9000.0) * 0.3 + ln(vXZ / 2200.0) * 0.1;
          vec3 paper = vec3(0.62, 0.55, 0.40), grass = vec3(0.42, 0.45, 0.30), earth = vec3(0.52, 0.42, 0.30);
          vec3 c = mix(paper, grass, smoothstep(0.35, 0.75, n));
          c = mix(c, earth, smoothstep(0.62, 0.9, ln(vXZ / 15000.0 + 7.3)) * 0.5);
          diffuseColor.rgb = mix(c * 0.55, c, smoothstep(0.0, 1.0, vTop));
        }`);
  };
  m.customProgramCacheKey = () => 'naval-land';
  return m;
}
