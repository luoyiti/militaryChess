/**
 * 3D 沙盘：真实高程地形（夸张系数）+ 纸质反照率贴图 + SDF 着色的占领区/发光战线 + 实例化手办部队 + 推进丝带 + CSS2D 标注 + 运镜。
 * 世界坐标：x3 = wx - W/2, z3 = wy - H/2（与 2D 世界坐标同源），y 向上。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import type { DB } from '../../data/db';
import { W, H, KM, project, GRID } from '../../geo/frame';
import type { GeomResult } from '../../geo/field/client';
import { bitsMask } from '../../geo/field/field';
import { unitStateAt, routeProgress, isTerminal, type RUnit } from '../../model/core';
import { buildInstanceGeometry, hasModel } from '../models';
import type { LonLat, ModelId } from '../../core/types';
import { ECHELON_RANK } from '../../core/types';
import { isoToHours } from '../../core/time';
import { phaseAt } from '../../core/phases';
import { SIDE_COUNTER } from '../../map2d/symbols';
import { isContainer, hiddenInTransit } from '../../map2d/units';
import { store } from '../../app/store';
import { manifest, sideDef } from '../../campaign/context';
import { slotStyle } from '../../campaign/theme';
import { buildContextGeometry, createContextViewLimiter, type TerrainExtent } from './contextTerrain';

interface Terrain extends TerrainExtent { w: number; h: number; elev: Float32Array }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

async function loadTerrain(base = 'terrain', requireExtent = false): Promise<Terrain> {
  const response = await fetch(`${base}/terrain.json`);
  if (!response.ok) throw new Error(`${base}/terrain.json 加载失败（${response.status}）`);
  const meta = await response.json();
  const origin: [number, number] = meta.origin ?? [0, 0];
  const worldWidth: number = meta.worldWidth ?? (requireExtent ? NaN : W);
  const worldHeight: number = meta.worldHeight ?? (requireExtent ? NaN : H);
  if (!Array.isArray(origin) || origin.length !== 2 || !origin.every(Number.isFinite) || !(worldWidth > 0) || !(worldHeight > 0)
      || !Number.isFinite(meta.scale) || meta.scale <= 0 || !Number.isFinite(meta.offset) || (meta.encoding && meta.encoding !== 'rg16')) {
    throw new Error(`${base} 地形元数据无效`);
  }
  if (requireExtent && (origin[0] >= 0 || origin[1] >= 0 || origin[0] + worldWidth <= W || origin[1] + worldHeight <= H)) {
    throw new Error('周边地形与战区世界坐标不匹配');
  }
  const img = await loadImage(`${base}/height.png`);
  if (img.width < 2 || img.height < 2 || ((meta.width ?? meta.w) && (meta.width ?? meta.w) !== img.width) || ((meta.height ?? meta.h) && (meta.height ?? meta.h) !== img.height)) {
    throw new Error(`${base} 高程图尺寸与元数据不一致`);
  }
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const elev = new Float32Array(c.width * c.height);
  for (let i = 0; i < elev.length; i++) elev[i] = (d[i * 4] * 256 + d[i * 4 + 1]) * meta.scale + meta.offset;
  return { w: c.width, h: c.height, elev, origin, worldWidth, worldHeight };
}

function elevAt(t: Terrain, wx: number, wy: number): number {
  const x = Math.max(0, Math.min(t.w - 1.001, ((wx - t.origin[0]) / t.worldWidth) * t.w - 0.5));
  const y = Math.max(0, Math.min(t.h - 1.001, ((wy - t.origin[1]) / t.worldHeight) * t.h - 0.5));
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const e = t.elev, w = t.w;
  return e[j * w + i] * (1 - fx) * (1 - fy) + e[j * w + i + 1] * fx * (1 - fy) + e[(j + 1) * w + i] * (1 - fx) * fy + e[(j + 1) * w + i + 1] * fx * fy;
}

const hex = (c: string) => Number.parseInt(c.slice(1), 16);
const vec3 = (v: readonly number[]) => `vec3(${v.map((x) => x.toFixed(3)).join(', ')})`;

export function createSandbox(host: HTMLElement, db: DB) {
  const m = manifest();
  const cfg = m.sandbox ?? {};
  const EXAG = cfg.exaggeration ?? 3; // 高程夸张
  const FIG_SCALE = cfg.figScale ?? 17; // 手办放大倍数（世界单位/米）
  const toY = (meters: number) => (Math.max(0, meters) / 1000 / KM) * EXAG; // 米 → 世界单位
  const withContext = !!m.map.contextTiles;
  /** 3D 底座/丝带阵营色：manifest.sides[].sandbox，缺省棋子底色 */
  const SIDE_COLOR: Record<string, number> = Object.fromEntries(m.sides.map((sd) => [sd.id, hex(sd.sandbox ?? SIDE_COUNTER[sd.id].bg)]));
  const slotA = slotStyle(m, 0), slotB = slotStyle(m, 1);
  const deferred = (m.control.deferred ?? []).map((d) => ({ mask: bitsMask(d.bits), h: isoToHours(d.from) }));
  const deferredMask = deferred.reduce((acc, d) => acc | d.mask, 0);
  const theatreMask = bitsMask(m.control.theatreBits) & ~deferredMask;
  const landMask = 1 << m.control.landBit;
  const expandedAt = (t: number) => (deferred.length ? (deferred.every((d) => t >= d.h) ? 1 : 0) : 1);
  const restTint = cfg.restTint ?? [0.9, 0.95, 1.06];
  const restStrength = cfg.restStrength ?? 0.55;
  const airHeight = cfg.airRoute?.height ?? 170, airWidth = cfg.airRoute?.width ?? 0.2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  // 软件渲染（SwiftShader / llvmpipe）时降低像素比、关闭阴影、减少地形分段
  const gl = renderer.getContext();
  const glInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const software = /SwiftShader|llvmpipe|software/i.test(glInfo ? String(gl.getParameter(glInfo.UNMASKED_RENDERER_WEBGL)) : '');
  renderer.setPixelRatio(software && cfg.softwareFallback ? 0.8 : Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = !(software && cfg.softwareFallback);
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const labelR = new CSS2DRenderer();
  labelR.domElement.style.position = 'absolute';
  labelR.domElement.style.left = '0';
  labelR.domElement.style.top = '0';
  labelR.domElement.style.pointerEvents = 'none';
  host.appendChild(labelR.domElement);
  const hint = document.createElement('div');
  hint.className = 'sb3-hint';
  hint.textContent = '左键拖动旋转 · 右键平移 · 滚轮缩放 · 点击部队标签查看档案' + (software && cfg.softwareFallback ? ' · 软件渲染精简模式' : '');
  host.appendChild(hint);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a241b);
  scene.fog = new THREE.Fog(0x3a3024, ...(cfg.fog ?? [5200, 12000]));
  const camera = new THREE.PerspectiveCamera(38, 1, 20, 30000);
  camera.position.set(0, 2300, 2600);
  const controls = new OrbitControls(camera, labelR.domElement);
  labelR.domElement.style.pointerEvents = 'auto';
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Keep all viewport rays below the horizon so distant panning stays over real geography.
  controls.maxPolarAngle = Math.PI * (withContext ? 0.36 : 0.44);
  controls.minDistance = 250;
  controls.maxDistance = 9000;
  controls.target.set(...(worldTo3(...project(cfg.target ?? phaseAt(store.get().t).center ?? m.map.home3d), 0)));
  { const t0 = controls.target; camera.position.set(t0.x + 300, 2100, t0.z + 2300); }
  controls.screenSpacePanning = false;

  // 灯光：暖色低角度主光 + 冷色天光
  const hemi = new THREE.HemisphereLight(0xfff2d6, 0x4a3a24, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0a8, 2.6);
  sun.position.set(-3000, 3600, -2200);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -2200; sc.right = 2200; sc.top = 2200; sc.bottom = -2200; sc.near = 100; sc.far = 12000;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  // 桌面（纸/木）
  const table = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, H * 2), new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.95 }));
  table.rotation.x = -Math.PI / 2;
  table.position.y = -40;
  table.receiveShadow = true;
  scene.add(table);

  // 场纹理（DE/SU 距离，RG 通道；0.5 = 0 距离）
  const clampCells = 12;
  const fieldData = new Uint8Array(GRID.w * GRID.h * 4);
  const fieldTex = new THREE.DataTexture(fieldData, GRID.w, GRID.h, THREE.RGBAFormat);
  fieldTex.magFilter = THREE.LinearFilter;
  fieldTex.minFilter = THREE.LinearFilter;
  fieldTex.needsUpdate = true;
  let masksTex: THREE.DataTexture | null = null;

  const uniforms = {
    uField: { value: fieldTex },
    uMask: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uControl: { value: store.get().layers.control ? 1 : 0 },
    uFront: { value: store.get().layers.front ? 1 : 0 },
    uExpanded: { value: expandedAt(store.get().t) },
    uClamp: { value: clampCells },
    uCell: { value: GRID.cell },
    uFieldSize: { value: new THREE.Vector2(GRID.w, GRID.h) },
    uWorld: { value: new THREE.Vector2(W, H) },
  };

  let terrainMesh: THREE.Mesh | null = null;
  let terrain: Terrain | null = null;
  let contextMesh: THREE.Mesh | null = null;
  let contextTerrain: Terrain | null = null;
  let contextStatus: 'loading' | 'ready' | 'error' = 'loading';
  let contextError: string | null = null;
  let limitContextView: (() => number) | null = null;
  const contextAssets = (withContext ? Promise.all([
    loadTerrain('terrain/context', true),
    new THREE.TextureLoader().loadAsync('terrain/context/albedo.webp'),
  ]) : Promise.resolve(null)).catch((error: unknown) => {
    contextStatus = 'error';
    contextError = error instanceof Error ? error.message : String(error);
    hint.textContent = '周边地形加载失败，当前只显示战区；刷新后重试。';
    console.error('3D 周边地形加载失败', error);
    return null;
  });
  const ready = (async () => {
    const [t, albedo, masks] = await Promise.all([
      loadTerrain(),
      new THREE.TextureLoader().loadAsync('terrain/albedo.webp'),
      fetch('geo/field_masks.bin').then((r) => r.arrayBuffer()),
    ]);
    terrain = t;
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mk = new Uint8Array(masks);
    const md = new Uint8Array(GRID.w * GRID.h * 4);
    // R = 始终有效的战区，G = 延迟启用的战区，B = 陆地
    for (let i = 0; i < mk.length; i++) { const v = mk[i]; md[i * 4] = v & theatreMask ? 255 : 0; md[i * 4 + 1] = v & deferredMask ? 255 : 0; md[i * 4 + 2] = v & landMask ? 255 : 0; md[i * 4 + 3] = 255; }
    masksTex = new THREE.DataTexture(md, GRID.w, GRID.h, THREE.RGBAFormat);
    masksTex.magFilter = THREE.LinearFilter; masksTex.minFilter = THREE.LinearFilter; masksTex.needsUpdate = true;
    uniforms.uMask.value = masksTex;
    // 地形网格
    const segX = software && cfg.softwareFallback ? 160 : cfg.segments ?? 560, segY = Math.round((560 * H) / W);
    const geo = new THREE.PlaneGeometry(W, H, segX, segY);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + W / 2, wy = pos.getZ(i) + H / 2;
      pos.setY(i, toY(elevAt(t, wx, wy)));
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ map: albedo, roughness: 0.93, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWorldXZ;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldXZ = (modelMatrix * vec4(transformed,1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec2 vWorldXZ;
        uniform sampler2D uField; uniform sampler2D uMask; uniform float uTime; uniform float uExpanded; uniform float uControl; uniform float uFront; uniform float uClamp; uniform float uCell;
        uniform vec2 uFieldSize; uniform vec2 uWorld;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 wp = vWorldXZ + uWorld * 0.5;
          vec2 fuv = wp / (uFieldSize * uCell);
          vec4 f = texture2D(uField, fuv);
          vec4 m = texture2D(uMask, fuv);
          float theater = max(m.r, m.g * uExpanded);
          float dDE = (f.r - 0.5) * 2.0 * uClamp; // 格子
          float dSU = (f.g - 0.5) * 2.0 * uClamp;
          float px = fwidth(dDE) + 1e-4;
          float inDE = smoothstep(px, -px, dDE) * theater * uControl;
          float inSU = smoothstep(px, -px, dSU) * theater * (1.0 - inDE) * uControl;
          float hatch = step(0.78, fract((wp.x + wp.y) / 30.0));
          float cross2 = max(step(0.8, fract((wp.x + wp.y) / 34.0)), step(0.8, fract((wp.x - wp.y) / 34.0)));
          vec3 deCol = ${vec3(slotA.sandboxFill)};
          vec3 suCol = ${vec3(slotB.sandboxFill)};
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * 0.72, deCol, 0.42 + 0.35 * hatch), inDE);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * 0.75, suCol, 0.4 + 0.35 * cross2), inSU);
          // 同盟国仍控制的战区：很淡的冷色，避免盖住地形
          float inPL = theater * (1.0 - inDE) * (1.0 - inSU);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * ${vec3(restTint)}, inPL * ${restStrength.toFixed(3)} * uControl);
          // 战线发光带
          float lineDE = 1.0 - smoothstep(0.15, 0.75, abs(dDE));
          float lineSU = 1.0 - smoothstep(0.15, 0.75, abs(dSU));
          float glow = (1.0 - smoothstep(0.0, 2.2, abs(dDE))) * 0.5 + (1.0 - smoothstep(0.0, 2.2, abs(dSU))) * 0.5;
          float pulse = 0.75 + 0.25 * sin(uTime * 3.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, ${vec3(slotA.sandboxLine)}, lineDE * theater * uFront);
          diffuseColor.rgb = mix(diffuseColor.rgb, ${vec3(slotB.sandboxLine)}, lineSU * theater * uFront);
          diffuseColor.rgb += vec3(1.0, 0.5, 0.15) * glow * theater * 0.32 * pulse * uFront;
        }`);
    };
    terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    scene.add(terrainMesh);
    // 侧面裙边
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(W, 40, H), new THREE.MeshStandardMaterial({ color: 0xcdbb90, roughness: 1 }));
    skirt.position.y = -22; // 与海平面分离，避免同深度闪烁
    scene.add(skirt);
    const context = await contextAssets;
    if (context) {
      const [ct, contextAlbedo] = context;
      contextTerrain = ct;
      contextAlbedo.colorSpace = THREE.SRGBColorSpace;
      contextAlbedo.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const contextGeo = buildContextGeometry(ct, W, H, segX, segY, (wx, wy) => {
        const coreEdge = ((Math.abs(wx) < 1e-6 || Math.abs(wx - W) < 1e-6) && wy >= 0 && wy <= H)
          || ((Math.abs(wy) < 1e-6 || Math.abs(wy - H) < 1e-6) && wx >= 0 && wx <= W);
        return toY(elevAt(coreEdge ? t : ct, wx, wy));
      });
      const contextMat = new THREE.MeshStandardMaterial({ map: contextAlbedo, roughness: 0.93, metalness: 0 });
      contextMesh = new THREE.Mesh(contextGeo, contextMat);
      contextMesh.receiveShadow = true;
      contextMesh.castShadow = false;
      scene.add(contextMesh);
      scene.fog = new THREE.Fog(0x3a3024, 9000, 26000);
      limitContextView = createContextViewLimiter(camera, controls.target, ct, W, H, controls.minDistance, 9000);
      controls.maxDistance = limitContextView();
      contextStatus = 'ready';
    }
    buildLabels();
    buildRoutes();
  })().catch((err) => { hint.textContent = '3D 地形加载失败，请返回作战地图'; console.error(err); });

  function worldTo3(wx: number, wy: number, y: number): [number, number, number] { return [wx - W / 2, y, wy - H / 2]; }
  function groundY(wx: number, wy: number) { return terrain ? toY(elevAt(terrain, wx, wy)) : 0; }

  // ---------- 标注 ----------
  const labelObjs: CSS2DObject[] = [];
  function buildLabels() {
    for (const p of db.places) {
      if (p.rank > 2 || ['forest', 'river', 'region'].includes(p.kind)) continue;
      const [wx, wy] = project(p.pos);
      const el = document.createElement('div');
      el.className = `sb3-label r${p.rank}`;
      el.textContent = p.zh;
      const o = new CSS2DObject(el);
      o.position.set(...worldTo3(wx, wy, groundY(wx, wy) + 30));
      scene.add(o);
      labelObjs.push(o);
    }
  }

  // ---------- 推进丝带 ----------
  interface Ribbon { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; r: DB['routes'][number]; total: number; cumH: number[] }
  const ribbons: Ribbon[] = [];
  function buildRoutes() {
    for (const r of db.routes) {
      const pts = r.wps.map((w) => project(w.ll));
      // 加密
      const dense: number[][] = [];
      const hs: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 40));
        for (let k = 0; k < n; k++) { const t = k / n; dense.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); hs.push(r.wps[i].h + (r.wps[i + 1].h - r.wps[i].h) * t); }
      }
      dense.push(pts[pts.length - 1]); hs.push(r.wps[r.wps.length - 1].h);
      const width = (r.widthKm / KM) * (r.movement === 'air' ? airWidth : 0.2);
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      let acc = 0;
      const cum = [0];
      for (let i = 1; i < dense.length; i++) { acc += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]); cum.push(acc); }
      for (let i = 0; i < dense.length; i++) {
        const a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0];
        const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
        const taper = Math.min(1, cum[i] / (acc * 0.2 + 1)) * 0.6 + 0.4;
        for (const s of [-1, 1]) {
          const x = dense[i][0] + nx * width * taper * s, y = dense[i][1] + ny * width * taper * s;
          pos.push(...worldTo3(x, y, (r.movement === 'air' ? airHeight : r.movement === 'sea' ? 8 : groundY(x, y) + 6)));
          uv.push(acc > 0 ? cum[i] / acc : 0, (s + 1) / 2);
        }
        if (i < dense.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      const col = new THREE.Color(SIDE_COLOR[r.side]);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uProg: { value: 0 }, uCol: { value: col }, uTime: uniforms.uTime, uOp: { value: 1 }, uDashes: { value: r.movement === 'air' ? 1 : r.movement === 'sea' ? 2 : 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uProg; uniform vec3 uCol; uniform float uTime; uniform float uOp; uniform float uDashes;
          void main(){ if(vUv.x>uProg) discard; if(uDashes > 0.5 && fract(vUv.x * 42.0) > (uDashes > 1.5 ? 0.65 : 0.35)) discard; float edge=1.0-smoothstep(0.35,0.5,abs(vUv.y-0.5));
            float flow=0.8+0.2*step(0.5,fract(vUv.x*30.0-uTime*0.6));
            float head=smoothstep(uProg-0.03,uProg,vUv.x);
            gl_FragColor=vec4(mix(uCol,vec3(1.0,0.92,0.75),head*0.6), (0.3*flow+head*0.5)*edge*uOp); }`,
      });
      const mesh = new THREE.Mesh(g, mat);
      mesh.renderOrder = 2;
      scene.add(mesh);
      ribbons.push({ mesh, mat, r, total: acc, cumH: hs.map((h, i) => (acc > 0 ? cum[i] / acc : 0) + h * 0) });
      (ribbons[ribbons.length - 1] as Ribbon & { hs: number[]; uvs: number[] }).hs = hs;
      (ribbons[ribbons.length - 1] as Ribbon & { hs: number[]; uvs: number[] }).uvs = cum.map((c) => (acc > 0 ? c / acc : 0));
    }
  }

  // ---------- 部队（按模型分组 InstancedMesh） ----------
  const MAX_PER = 180;
  const groups = new Map<ModelId, THREE.InstancedMesh>();
  const baseGeo = new THREE.CylinderGeometry(1, 1.08, 0.16, 20);
  const baseMesh = new THREE.InstancedMesh(baseGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), 400);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);
  const unitMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.08, flatShading: true });
  function groupFor(m: ModelId) {
    let g = groups.get(m);
    if (!g) {
      g = new THREE.InstancedMesh(buildInstanceGeometry(m), unitMat, MAX_PER);
      g.castShadow = true;
      g.count = 0;
      g.frustumCulled = false;
      scene.add(g);
      groups.set(m, g);
    }
    return g;
  }
  const unitLabels = new Map<string, CSS2DObject>();
  const modelOf = (u: RUnit): ModelId => {
    if (u.model) return u.model;
    if (cfg.typeModels?.[u.type]) return cfg.typeModels[u.type];
    for (const q of u.equipment ?? []) { const e = db.equipment.get(q.id); if (e?.model) return e.model; }
    for (const c of u.children) { const cu = db.units.get(c); if (cu?.model) return cu.model; }
    const fallback = sideDef(u.side).defaultModel ?? `inf_${u.side.toLowerCase()}`;
    return hasModel(fallback) ? fallback : 'inf_de';
  };
  let selected: string | null = null;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const tmpC = new THREE.Color();
  let T = store.get().t;
  let showEch = 2; // 3D 中默认显示到师级

  function updateUnits() {
    if (!terrain) return;
    for (const g of groups.values()) g.count = 0;
    baseMesh.count = 0;
    if (!store.get().layers.units) { for (const L of unitLabels.values()) L.visible = false; return; }
    let bi = 0;
    const seen = new Set<string>();
    const dist = camera.position.distanceTo(controls.target);
    showEch = dist > 5200 ? 0 : dist > 2600 ? 1 : 2;
    const visit = (u: RUnit) => {
      const r = ECHELON_RANK[u.echelon];
      if (T < u.fromH - 1 || T > u.toH + 48) return;
      const kids = u.children.map((c) => db.units.get(c)!).filter((c) => c && T >= c.fromH - 1 && T <= c.toH + 48);
      if (r < 0 || (kids.length && isContainer(u))) { kids.forEach(visit); return; }
      if (r >= showEch || !kids.length) { place(u); return; }
      kids.forEach(visit);
    };
    const place = (u: RUnit) => {
      const s = unitStateAt(u.id, db.units, T);
      if (!s || s.fade < 0.05 || hiddenInTransit(u, s, 'sandbox')) return;
      const [wx, wy] = project(s.ll);
      const y = groundY(wx, wy);
      const m = modelOf(u);
      const symbolic = (u.type === 'naval' || u.type === 'air') && !cfg.typeModels?.[u.type] && !u.model;
      const g = groupFor(m);
      if (g.count >= MAX_PER) return;
      const ech = ECHELON_RANK[u.echelon];
      const sc = FIG_SCALE * (ech === 0 ? 1.7 : ech === 1 ? 1.35 : 1.1) * (0.35 + 0.65 * s.fade);
      // 朝向：经纬度 heading → 世界坐标（北 = -z）
      const heading = s.moving ? s.heading : Math.PI * (sideDef(u.side).restHeading ?? (u.side === 'DE' ? 0 : 1));
      const dx = Math.cos(heading), dy = -Math.sin(heading);
      tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dy, dx));
      tmpP.set(...worldTo3(wx, wy, y + 0.2 * sc));
      tmpS.set(sc, sc, sc);
      tmpM.compose(tmpP, tmpQ, tmpS);
      if (!symbolic) g.setMatrixAt(g.count, tmpM);
      const dead = isTerminal(s.status);
      if (!symbolic) { g.setColorAt(g.count, tmpC.set(dead ? 0x888888 : 0xffffff)); g.count++; }
      // 底座
      if (bi < 400) {
        const br = sc * 1.75;
        tmpM.compose(tmpP.set(...worldTo3(wx, wy, y + 0.05 * sc)), new THREE.Quaternion(), tmpS.set(br, sc, br));
        baseMesh.setMatrixAt(bi, tmpM);
        baseMesh.setColorAt(bi, tmpC.set(dead ? 0x777777 : SIDE_COLOR[u.side]));
        bi++;
      }
      // 标签
      let L = unitLabels.get(u.id);
      if (!L) {
        const el = document.createElement('div');
        el.className = `sb3-unit side-${u.side}`;
        el.textContent = u.name.short ?? u.name.zh;
        el.title = u.name.zh;
        el.addEventListener('click', (ev) => { ev.stopPropagation(); store.set({ selectedUnit: u.id }); });
        L = new CSS2DObject(el);
        unitLabels.set(u.id, L);
        scene.add(L);
      }
      L.visible = true;
      L.element.classList.toggle('sel', u.id === selected);
      L.element.classList.toggle('dead', dead);
      L.element.style.opacity = String(s.fade);
      L.position.set(...worldTo3(wx, wy, y + sc * 3.6 + 12));
      seen.add(u.id);
    };
    db.roots.forEach(visit);
    for (const [id, L] of unitLabels) if (!seen.has(id)) L.visible = false;
    for (const g of groups.values()) { g.instanceMatrix.needsUpdate = true; if (g.instanceColor) g.instanceColor.needsUpdate = true; }
    baseMesh.count = bi;
    baseMesh.instanceMatrix.needsUpdate = true;
    if (baseMesh.instanceColor) baseMesh.instanceColor.needsUpdate = true;
  }

  function updateRibbons() {
    for (const rb of ribbons as (Ribbon & { hs: number[]; uvs: number[] })[]) {
      const hs = rb.hs, uvs = rb.uvs;
      const h0 = hs[0], h1 = hs[hs.length - 1];
      let prog = 0;
      if (T >= h1) prog = 1;
      else if (T > h0) { let i = 0; while (i < hs.length - 1 && hs[i + 1] <= T) i++; const t = (T - hs[i]) / Math.max(1e-6, hs[i + 1] - hs[i]); prog = uvs[i] + (uvs[i + 1] - uvs[i]) * t; }
      rb.mat.uniforms.uProg.value = prog;
      let op = T <= h1 + 12 ? 1 : Math.max(0, 1 - (T - h1 - 12) / 48);
      if (rb.r.untilH !== undefined && T > rb.r.untilH) op = 0;
      if (store.get().layers.routesFull) { prog = 1; op = Math.max(.25, op); rb.mat.uniforms.uProg.value = prog; }
      rb.mat.uniforms.uOp.value = op;
      rb.mesh.visible = (store.get().layers.routes || store.get().layers.routesFull) && prog > 0 && op > 0.01;
    }
    void routeProgress;
  }

  // Prefer unit labels and suppress overlapping city/formation names.
  // Hidden labels remain in layout so they can reappear when the camera moves.
  function declutterLabels() {
    const occupied: DOMRect[] = [];
    const labels = [...unitLabels.entries()]
      .filter(([, l]) => l.visible && l.element.style.display !== 'none')
      .sort(([a], [b]) => (a === selected ? -1 : b === selected ? 1 : ECHELON_RANK[db.units.get(a)!.echelon] - ECHELON_RANK[db.units.get(b)!.echelon]))
      .map(([, l]) => l);
    for (const l of [...labels, ...labelObjs]) {
      const el = l.element;
      if (!l.visible || el.style.display === 'none') { el.style.visibility = 'hidden'; continue; }
      const r = el.getBoundingClientRect();
      const overlaps = occupied.some((p) => r.left < p.right + 4 && r.right > p.left - 4 && r.top < p.bottom + 3 && r.bottom > p.top - 3);
      el.style.visibility = overlaps ? 'hidden' : 'visible';
      if (!overlaps && r.width > 0) occupied.push(r);
    }
  }

  // ---------- 渲染循环 ----------
  let running = false;
  let raf = 0;
  let frames = 0, fpsT = performance.now(), fps = 0;
  let unitsDirty = true;
  const t0clock = performance.now();
  function resize() {
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    renderer.domElement.style.width = r.width + 'px';
    renderer.domElement.style.height = r.height + 'px';
    labelR.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  let lastDist = 0;
  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    uniforms.uTime.value = (performance.now() - t0clock) / 1000;
    controls.update();
    if (limitContextView) controls.maxDistance = limitContextView();
    for (const L of labelObjs) L.visible = store.get().layers.cities;
    const d = camera.position.distanceTo(controls.target);
    if (Math.abs(d - lastDist) > 150) { lastDist = d; unitsDirty = true; }
    if (unitsDirty) { unitsDirty = false; updateUnits(); updateRibbons(); }
    // 阴影相机跟随视点
    sun.target.position.copy(controls.target);
    sun.position.copy(controls.target).add(new THREE.Vector3(-2600, 3400, -1900));
    const span = Math.min(4200, Math.max(900, d * 0.9));
    sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.updateProjectionMatrix();
    renderer.render(scene, camera);
    labelR.render(scene, camera);
    declutterLabels();
    frames++;
    const now = performance.now();
    if (now - fpsT > 1000) { fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; }
  }

  store.on((s, ch) => { if (ch.has('layers')) { unitsDirty = true; uniforms.uControl.value = s.layers.control ? 1 : 0; uniforms.uFront.value = s.layers.front ? 1 : 0; } });

  return {
    show() { if (running) return; running = true; resize(); ready.then(() => { unitsDirty = true; }); loop(); host.classList.remove('hidden'); },
    hide() { running = false; cancelAnimationFrame(raf); },
    setTime(t: number) { T = t; uniforms.uExpanded.value = expandedAt(t); unitsDirty = true; },
    setFields(g: GeomResult) {
      if (!g.fA || !g.fB) return;
      const n = GRID.w * GRID.h;
      for (let i = 0; i < n; i++) {
        const a = Math.max(-clampCells, Math.min(clampCells, g.fA[i]));
        const b = Math.max(-clampCells, Math.min(clampCells, g.fB[i]));
        fieldData[i * 4] = Math.round((a / clampCells / 2 + 0.5) * 255);
        fieldData[i * 4 + 1] = Math.round((b / clampCells / 2 + 0.5) * 255);
        fieldData[i * 4 + 3] = 255;
      }
      fieldTex.needsUpdate = true;
    },
    flyTo(ll: LonLat | [number, number], rel: number) {
      const [wx, wy] = project(ll);
      const y = groundY(wx, wy);
      const target = new THREE.Vector3(...worldTo3(wx, wy, y));
      const dist = Math.max(500, 6400 / Math.max(1, rel));
      const dir = camera.position.clone().sub(controls.target).normalize();
      dir.y = Math.max(0.55, dir.y); dir.normalize();
      const camTo = target.clone().add(dir.multiplyScalar(dist));
      gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { unitsDirty = true; } });
      gsap.to(camera.position, { x: camTo.x, y: camTo.y, z: camTo.z, duration: 1.8, ease: 'power2.inOut' });
    },
    select(id: string | null) { selected = id; unitsDirty = true; },
    resize,
    stats() {
      let inst = 0; for (const g of groups.values()) inst += g.count;
      return { fps: Math.round(fps), instances: inst, groups: groups.size, calls: renderer.info.render.calls, tris: renderer.info.render.triangles,
        ready: !!terrainMesh && (!withContext || contextStatus === 'ready'), contextReady: !!contextMesh, contextStatus, contextError,
        contextOrigin: contextTerrain?.origin, contextWorld: contextTerrain ? [contextTerrain.worldWidth, contextTerrain.worldHeight] : null,
        maxDistance: controls.maxDistance };
    },
  };
}
