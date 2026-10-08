/**
 * 3D 沙盘：真实高程地形（夸张系数）+ 纸质反照率贴图 + SDF 着色的占领区/发光战线 + 实例化手办部队 + 推进丝带 + CSS2D 标注 + 运镜。
 * 世界坐标：x3 = wx - W/2, z3 = wy - H/2（与 2D 世界坐标同源），y 向上。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import type { DB } from '../../data/db';
import { W, H, KM, project } from '../../geo/frame';
import { GRID, type GeomResult } from '../../geo/field/client';
import { unitStateAt, routeProgress, type RUnit } from '../../model/core';
import { buildInstanceGeometry } from '../models';
import type { LonLat, ModelId } from '../../schema';
import { ECHELON_RANK } from '../../schema';
import { store } from '../../app/store';

const EXAG = 9; // 高程夸张
const toY = (m: number) => (Math.max(0, m) / 1000 / KM) * EXAG; // 米 → 世界单位
const FIG_SCALE = 17; // 手办放大倍数（世界单位/米）

interface Terrain { w: number; h: number; elev: Float32Array }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

async function loadTerrain(): Promise<Terrain> {
  const meta = await fetch('terrain/terrain.json').then((r) => r.json());
  const img = await loadImage('terrain/height.png');
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const elev = new Float32Array(c.width * c.height);
  for (let i = 0; i < elev.length; i++) elev[i] = (d[i * 4] * 256 + d[i * 4 + 1]) * meta.scale + meta.offset;
  return { w: c.width, h: c.height, elev };
}

function elevAt(t: Terrain, wx: number, wy: number): number {
  const x = Math.max(0, Math.min(t.w - 1.001, (wx / W) * t.w - 0.5));
  const y = Math.max(0, Math.min(t.h - 1.001, (wy / H) * t.h - 0.5));
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const e = t.elev, w = t.w;
  return e[j * w + i] * (1 - fx) * (1 - fy) + e[j * w + i + 1] * fx * (1 - fy) + e[(j + 1) * w + i] * (1 - fx) * fy + e[(j + 1) * w + i + 1] * fx * fy;
}

const SIDE_COLOR: Record<string, number> = { DE: 0x3a5887, FR: 0x1f4e89, GB: 0x8a7044, BE: 0xa6843c, NL: 0xc46a2a };

export function createSandbox(host: HTMLElement, db: DB) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
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
  hint.textContent = '左键拖动旋转 · 右键平移 · 滚轮缩放 · 点击部队标签查看档案';
  host.appendChild(hint);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a241b);
  scene.fog = new THREE.Fog(0x3a3024, 5200, 12000);
  const camera = new THREE.PerspectiveCamera(38, 1, 20, 30000);
  camera.position.set(0, 2300, 2600);
  const controls = new OrbitControls(camera, labelR.domElement);
  labelR.domElement.style.pointerEvents = 'auto';
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minDistance = 250;
  controls.maxDistance = 9000;
  controls.target.set(...(worldTo3(...project([4.3, 50.0]), 0)));
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
  const table = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, H * 3), new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.95 }));
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
    uClamp: { value: clampCells },
    uCell: { value: GRID.cell },
    uFieldSize: { value: new THREE.Vector2(GRID.w, GRID.h) },
    uWorld: { value: new THREE.Vector2(W, H) },
  };

  let terrainMesh: THREE.Mesh | null = null;
  let terrain: Terrain | null = null;
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
    for (let i = 0; i < mk.length; i++) { const v = mk[i]; md[i * 4] = v & 1 ? 255 : 0; md[i * 4 + 1] = v & 32 ? 255 : 0; md[i * 4 + 2] = v & 16 ? 255 : 0; md[i * 4 + 3] = 255; }
    masksTex = new THREE.DataTexture(md, GRID.w, GRID.h, THREE.RGBAFormat);
    masksTex.magFilter = THREE.LinearFilter; masksTex.minFilter = THREE.LinearFilter; masksTex.needsUpdate = true;
    uniforms.uMask.value = masksTex;
    // 地形网格
    const segX = 560, segY = Math.round((560 * H) / W);
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
        uniform sampler2D uField; uniform sampler2D uMask; uniform float uTime; uniform float uClamp; uniform float uCell;
        uniform vec2 uFieldSize; uniform vec2 uWorld;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 wp = vWorldXZ + uWorld * 0.5;
          vec2 fuv = wp / (uFieldSize * uCell);
          vec4 f = texture2D(uField, fuv);
          vec4 m = texture2D(uMask, fuv);
          float theater = max(m.r, m.g);
          float dDE = (f.r - 0.5) * 2.0 * uClamp; // 格子
          float dSU = (f.g - 0.5) * 2.0 * uClamp;
          float px = fwidth(dDE) + 1e-4;
          float inDE = smoothstep(px, -px, dDE) * theater;
          float inSU = smoothstep(px, -px, dSU) * theater * (1.0 - inDE);
          float hatch = step(0.78, fract((wp.x + wp.y) / 30.0));
          float cross2 = max(step(0.8, fract((wp.x + wp.y) / 34.0)), step(0.8, fract((wp.x - wp.y) / 34.0)));
          vec3 deCol = vec3(0.18, 0.32, 0.62);
          vec3 suCol = vec3(0.62, 0.34, 0.12);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * 0.72, deCol, 0.42 + 0.35 * hatch), inDE);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * 0.75, suCol, 0.4 + 0.35 * cross2), inSU);
          // 同盟国仍控制的战区：很淡的冷色，避免盖住地形
          float inPL = m.r * (1.0 - inDE) * (1.0 - inSU);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 0.95, 1.06), inPL * 0.55);
          // 战线发光带
          float lineDE = 1.0 - smoothstep(0.15, 0.75, abs(dDE));
          float lineSU = 1.0 - smoothstep(0.15, 0.75, abs(dSU));
          float glow = (1.0 - smoothstep(0.0, 2.2, abs(dDE))) * 0.5 + (1.0 - smoothstep(0.0, 2.2, abs(dSU))) * 0.5;
          float pulse = 0.75 + 0.25 * sin(uTime * 3.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.2, 0.36), lineDE * theater);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.18, 0.06), lineSU * theater);
          diffuseColor.rgb += vec3(1.0, 0.5, 0.15) * glow * theater * 0.32 * pulse;
        }`);
    };
    terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    scene.add(terrainMesh);
    // 侧面裙边
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(W, 40, H), new THREE.MeshStandardMaterial({ color: 0xcdbb90, roughness: 1 }));
    skirt.position.y = -20;
    scene.add(skirt);
    buildLabels();
    buildRoutes();
  })();

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
      const width = (r.widthKm / KM) * 0.2;
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
          pos.push(...worldTo3(x, y, groundY(x, y) + 6));
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
        uniforms: { uProg: { value: 0 }, uCol: { value: col }, uTime: uniforms.uTime, uOp: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uProg; uniform vec3 uCol; uniform float uTime; uniform float uOp;
          void main(){ if(vUv.x>uProg) discard; float edge=1.0-smoothstep(0.35,0.5,abs(vUv.y-0.5));
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
    for (const q of u.equipment ?? []) { const e = db.equipment.get(q.id); if (e?.model) return e.model; }
    for (const c of u.children) { const cu = db.units.get(c); if (cu?.model) return cu.model; }
    return u.side === 'DE' ? 'inf_de' : 'inf_pl';
  };
  let selected: string | null = null;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const tmpC = new THREE.Color();
  let T = store.get().t;
  let showEch = 2; // 3D 中默认显示到师级

  function updateUnits() {
    if (!terrain) return;
    for (const g of groups.values()) g.count = 0;
    let bi = 0;
    const seen = new Set<string>();
    const dist = camera.position.distanceTo(controls.target);
    showEch = dist > 5200 ? 0 : dist > 2600 ? 1 : 2;
    const visit = (u: RUnit) => {
      const r = ECHELON_RANK[u.echelon];
      if (T < u.fromH - 1 || T > u.toH + 48) return;
      const kids = u.children.map((c) => db.units.get(c)!).filter((c) => c && T >= c.fromH - 1 && T <= c.toH + 48);
      if (r < 0) { kids.forEach(visit); return; }
      if (r >= showEch || !kids.length) { place(u); return; }
      kids.forEach(visit);
    };
    const place = (u: RUnit) => {
      const s = unitStateAt(u.id, db.units, T);
      if (!s || s.fade < 0.05) return;
      const [wx, wy] = project(s.ll);
      const y = groundY(wx, wy);
      const m = modelOf(u);
      const g = groupFor(m);
      if (g.count >= MAX_PER) return;
      const ech = ECHELON_RANK[u.echelon];
      const sc = FIG_SCALE * (ech === 0 ? 1.7 : ech === 1 ? 1.35 : 1.1) * (0.35 + 0.65 * s.fade);
      // 朝向：经纬度 heading → 世界坐标（北 = -z）
      const heading = s.moving ? s.heading : (u.side === 'DE' ? 0 : Math.PI);
      const dx = Math.cos(heading), dy = -Math.sin(heading);
      tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-dy, dx));
      tmpP.set(...worldTo3(wx, wy, y + 0.2 * sc));
      tmpS.set(sc, sc, sc);
      tmpM.compose(tmpP, tmpQ, tmpS);
      g.setMatrixAt(g.count, tmpM);
      const dead = ['destroyed', 'surrendered', 'interned', 'disbanded'].includes(s.status);
      g.setColorAt(g.count, tmpC.set(dead ? 0x888888 : 0xffffff));
      g.count++;
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
      const op = T <= h1 + 12 ? 1 : Math.max(0, 1 - (T - h1 - 12) / 48);
      rb.mat.uniforms.uOp.value = op;
      rb.mesh.visible = prog > 0 && op > 0.01;
    }
    void routeProgress;
  }

  // ---------- 渲染循环 ----------
  let running = false;
  let raf = 0;
  let frames = 0, fpsT = performance.now(), fps = 0;
  let unitsDirty = true;
  const t0clock = performance.now();
  function resize() {
    const r = host.getBoundingClientRect();
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
    frames++;
    const now = performance.now();
    if (now - fpsT > 1000) { fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; }
  }

  return {
    show() { if (running) return; running = true; resize(); ready.then(() => { unitsDirty = true; }); loop(); host.classList.remove('hidden'); },
    hide() { running = false; cancelAnimationFrame(raf); },
    setTime(t: number) { T = t; unitsDirty = true; },
    setFields(g: GeomResult) {
      if (!g.fDE || !g.fSU) return;
      const n = GRID.w * GRID.h;
      for (let i = 0; i < n; i++) {
        const a = Math.max(-clampCells, Math.min(clampCells, g.fDE[i]));
        const b = Math.max(-clampCells, Math.min(clampCells, g.fSU[i]));
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
      return { fps: Math.round(fps), instances: inst, groups: groups.size, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, ready: !!terrainMesh };
    },
  };
}
