/**
 * 3D 沙盘：真实高程地形（夸张系数）+ 纸质反照率贴图 + SDF 着色的占领区/发光战线 + 实例化手办部队 + 推进丝带 + CSS2D 标注 + 运镜。
 * 世界坐标：x3 = wx - W/2, z3 = wy - H/2（与 2D 世界坐标同源），y 向上。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import type { DB } from '../../data/db';
import { W, H, KM, project, unproject } from '../../geo/frame';
import { GRID, type GeomResult } from '../../geo/field/client';
import { unitStateAt, routeProgress, routeOpacity, type RUnit } from '../../model/core';
import { projectedHeading } from '../../model/flight';
import { SCENARIO } from '../../app/scenario';
import { buildInstanceGeometry } from '../models';
import type { LonLat, ModelId } from '../../schema';
import { ECHELON_RANK } from '../../schema';
import { store } from '../../app/store';
import { cameraViewport, frameBounds, type CameraFrame, type CameraFocus, type CameraInsets } from '../../app/camera';

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

const SIDE_COLOR: Record<string, number> = { GB:0xb3262e, DE: 0x3a5887, SK: 0x4a7a8c, PL: 0xb3262e, SU: 0x8f5a2b };

export function createSandbox(host: HTMLElement, db: DB, getInsets: () => CameraInsets = () => ({ left: 0, right: 0, top: 0, bottom: 0 })) {
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
  const camera = new THREE.PerspectiveCamera(38, 1, 20, 45000);
  camera.position.set(0, 2300, 2600);
  const controls = new OrbitControls(camera, labelR.domElement);
  labelR.domElement.style.pointerEvents = 'auto';
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minDistance = 250;
  controls.maxDistance = 22000;
  controls.target.set(...(worldTo3(...project(SCENARIO.focus), 0)));
  { const t0 = controls.target; camera.position.set(t0.x + 300, 2100, t0.z + 2300); }
  controls.screenSpacePanning = false;
  const manualListeners: (() => void)[] = [];
  let cameraFrame: CameraFrame | null = null;
  controls.addEventListener('start', () => {
    cancelFlight();
    cameraFrame = null;
    store.set({ followUnit: false });
    for (const fn of manualListeners) fn();
  });

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
  const fieldData = new Uint8Array(GRID.w * GRID.h * 4).fill(255);
  const fieldTex = new THREE.DataTexture(fieldData, GRID.w, GRID.h, THREE.RGBAFormat);
  fieldTex.magFilter = THREE.LinearFilter;
  fieldTex.minFilter = THREE.LinearFilter;
  fieldTex.needsUpdate = true;
  let masksTex: THREE.DataTexture | null = null;

  const uniforms = {
    uField: { value: fieldTex },
    uControl: { value:1 }, uFront:{ value:1 },
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
        uniform vec2 uFieldSize; uniform vec2 uWorld; uniform float uControl; uniform float uFront;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 wp = vWorldXZ + uWorld * 0.5;
          vec2 fuv = wp / (uFieldSize * uCell);
          vec4 f = texture2D(uField, fuv);
          vec4 m = texture2D(uMask, fuv);
          float theater = 1.0; // 空战场跨越陆地与海面
          float dDE = (f.r - 0.5) * 2.0 * uClamp; // 格子
          float dSU = (f.g - 0.5) * 2.0 * uClamp;
          float px = fwidth(dDE) + 1e-4;
          float inDE = smoothstep(px, -px, dDE) * theater;
          float inSU = smoothstep(px, -px, dSU) * theater;
          float hatch = step(0.78, fract((wp.x + wp.y) / 30.0));
          float cross2 = max(step(0.8, fract((wp.x + wp.y) / 34.0)), step(0.8, fract((wp.x - wp.y) / 34.0)));
          vec3 deCol = vec3(0.18, 0.32, 0.62);
          vec3 suCol = vec3(0.68,0.13,0.17);
          diffuseColor.rgb = mix(diffuseColor.rgb,deCol,inDE * (.09+.08*hatch) * uControl);
          diffuseColor.rgb = mix(diffuseColor.rgb,suCol,inSU * (.07+.07*cross2) * uControl);
          // 空战模式没有剩余领土归属
          float inPL = 0.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 0.93, 0.9), inPL * 0.6);
          // 战线发光带
          float lineDE = 1.0 - smoothstep(0.15, 0.75, abs(dDE));
          float lineSU = 1.0 - smoothstep(0.15, 0.75, abs(dSU));
          float glow = (1.0 - smoothstep(0.0, 2.2, abs(dDE))) * 0.5 + (1.0 - smoothstep(0.0, 2.2, abs(dSU))) * 0.5;
          float pulse = 0.75 + 0.25 * sin(uTime * 3.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.2, 0.36), lineDE * theater * uFront);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55,0.14,0.17), lineSU * theater * uFront);
          diffuseColor.rgb += vec3(1.0, 0.5, 0.15) * glow * theater * 0.12 * pulse * uFront;
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
    buildAirspace();
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

  const sectorGroup=new THREE.Group(), radarGroup=new THREE.Group(); scene.add(sectorGroup,radarGroup);
  function buildAirspace() {
    const line=(pts:number[][],group:THREE.Group,color:number,dashed:boolean)=>{
      const geo=new THREE.BufferGeometry().setFromPoints(pts.map(([x,y])=>new THREE.Vector3(...worldTo3(x,y,groundY(x,y)+10))));
      const mat=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity:.45,dashSize:35,gapSize:20}):new THREE.LineBasicMaterial({color,transparent:true,opacity:.35});
      const obj=new THREE.Line(geo,mat);obj.computeLineDistances();group.add(obj);
    };
    for(const g of db.airspace.groups)for(const p of g.polygons)for(const r of p){const pts=r.map(project);line([...pts,pts[0]],sectorGroup,0x8d3b3e,true);}
    for(const r of db.airspace.radar){const [x,y]=project(r.pos),radius=r.rangeKm/KM;line(Array.from({length:65},(_,i)=>[x+radius*Math.cos(i/64*Math.PI*2),y+radius*Math.sin(i/64*Math.PI*2)]),radarGroup,0x92585b,false);}
    sectorGroup.visible=store.get().layers.demarcation;radarGroup.visible=store.get().layers.radar;
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
  const unitInstances = new Map<string, { mesh: THREE.InstancedMesh; index: number; model: ModelId; phase?: string }>();
  const modelOf = (u: RUnit): ModelId => {
    if (u.model) return u.model;
    for (const q of u.equipment ?? []) { const e = db.equipment.get(q.id); if (e?.model) return e.model; }
    for (const c of u.children) { const cu = db.units.get(c); if (cu?.model) return cu.model; }
    return u.side === 'GB' ? 'spitfire' : u.side === 'DE' ? 'bf109' : u.side === 'SU' ? 'inf_su' : u.side === 'SK' ? 'inf_sk' : 'inf_pl';
  };
  let selected: string | null = null;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const tmpC = new THREE.Color();
  let T = store.get().t;
  let showEch = 2; // 3D 中默认显示到师级

  function updateUnits() {
    if (!terrain) return;
    unitInstances.clear();
    for (const g of groups.values()) g.count = 0;
    if(!store.get().layers.units){for(const L of unitLabels.values())L.visible=false;baseMesh.count=0;return;}
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
      let y = groundY(wx, wy);
      const m = modelOf(u);
      const g = groupFor(m);
      if (g.count >= MAX_PER) return;
      const ech = ECHELON_RANK[u.echelon];
      const sc = FIG_SCALE * (ech === 0 ? 1.7 : ech === 1 ? 1.35 : 1.1) * (0.35 + 0.65 * s.fade);
      const airborne=!!s.flightPhase && s.flightPhase!=='at_base';
      if(airborne)y+=Math.max(sc*6.5,(s.altitudeM ?? 2500)/1000/KM*4); // 飞机手办与高度采用可读的视觉放大
      // 投影后的 +X 机头；Three 绕 Y 轴的 +X 方向为 (cos(yaw), -sin(yaw))。
      const yaw = s.moving ? -projectedHeading(s.ll, s.heading) : (u.side === 'SU' ? Math.PI : u.side === 'PL' ? Math.PI * 0.6 : 0);
      tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      tmpP.set(...worldTo3(wx, wy, y + 0.2 * sc));
      tmpS.set(sc, sc, sc);
      tmpM.compose(tmpP, tmpQ, tmpS);
      g.setMatrixAt(g.count, tmpM);
      unitInstances.set(u.id, { mesh: g, index: g.count, model: m, phase: s.flightPhase });
      const dead = ['destroyed', 'surrendered', 'interned', 'disbanded'].includes(s.status);
      g.setColorAt(g.count, tmpC.set(dead ? 0x888888 : 0xffffff));
      g.count++;
      // 底座
      if (bi < 400 && !airborne) {
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
      L.element.dataset.flight=s.flightPhase ?? 'hq'; L.element.dataset.lon=s.ll[0].toFixed(5); L.element.dataset.lat=s.ll[1].toFixed(5);
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
      const full=store.get().layers.routesFull;
      const op = full ? .25 : routeOpacity(rb.r,T);
      if(full)rb.mat.uniforms.uProg.value=1;
      rb.mat.uniforms.uOp.value = op;
      rb.mesh.visible = (full || (store.get().layers.routes && prog > 0)) && op > 0.01;
    }
    void routeProgress;
  }

  // ---------- 渲染循环 ----------
  let running = false;
  let raf = 0;
  let frames = 0, fpsT = performance.now(), fps = 0;
  let unitsDirty = true;
  const t0clock = performance.now();
  let viewWidth = 1, viewHeight = 1, viewportKey = '';
  function updateViewport() {
    const v = cameraViewport(viewWidth, viewHeight, getInsets());
    const key = `${v.x}/${v.y}/${v.width}/${v.height}`;
    if (key !== viewportKey) {
      viewportKey = key;
      // 把沙盘焦点移到地图与卡片之间的可见区域，同 2D 镜头的中心。
      camera.setViewOffset(viewWidth, viewHeight, viewWidth / 2 - (v.x + v.width / 2), viewHeight / 2 - (v.y + v.height / 2), viewWidth, viewHeight);
    }
    return v;
  }
  function resize() {
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    viewWidth = r.width; viewHeight = r.height; viewportKey = '';
    renderer.setSize(r.width, r.height, false);
    renderer.domElement.style.width = r.width + 'px';
    renderer.domElement.style.height = r.height + 'px';
    labelR.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(1, r.height);
    updateViewport();
  }
  new ResizeObserver(resize).observe(host);
  let lastDist = 0;
  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    uniforms.uTime.value = (performance.now() - t0clock) / 1000;
    updateViewport();
    controls.update();
    const state=store.get();
    if(state.followUnit&&state.selectedUnit){const s=unitStateAt(state.selectedUnit,db.units,T);if(s){const [x,z]=project(s.ll);const target=new THREE.Vector3(...worldTo3(x,z,groundY(x,z)));const shift=target.sub(controls.target).multiplyScalar(.08);camera.position.add(shift);controls.target.add(shift);}}

    const d = camera.position.distanceTo(controls.target);
    (scene.fog as THREE.Fog).near = Math.max(5200, d * .9);
    (scene.fog as THREE.Fog).far = Math.max(12000, d * 2);
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

  store.on((s,ch)=>{if(ch.has('layers')){unitsDirty=true;uniforms.uControl.value=s.layers.control?1:0;uniforms.uFront.value=s.layers.front?1:0;sectorGroup.visible=s.layers.demarcation;radarGroup.visible=s.layers.radar;}});

  function cancelFlight() {
    gsap.killTweensOf(controls.target);
    gsap.killTweensOf(camera.position);
  }
  function cameraDirection() {
    const dir = camera.position.clone().sub(controls.target).normalize();
    dir.y = Math.max(.55, dir.y);
    return dir.normalize();
  }
  function moveCamera(target: THREE.Vector3, dist: number, ms: number) {
    cancelFlight();
    updateViewport();
    const camTo = target.clone().add(cameraDirection().multiplyScalar(Math.min(controls.maxDistance, dist)));
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms / 1000;
    if (duration <= 0) {
      controls.target.copy(target); camera.position.copy(camTo); controls.update(); unitsDirty = true;
      return;
    }
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration, ease: 'power2.inOut', onUpdate: () => { unitsDirty = true; } });
    gsap.to(camera.position, { x: camTo.x, y: camTo.y, z: camTo.z, duration, ease: 'power2.inOut' });
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
    flyTo(ll: LonLat | [number, number], rel: number, ms = 1800) {
      cameraFrame = null;
      const [wx, wy] = project(ll);
      const y = groundY(wx, wy);
      const target = new THREE.Vector3(...worldTo3(wx, wy, y));
      moveCamera(target, Math.max(500, 6400 / Math.max(.55, rel)), ms);
    },
    flyToFrame(frame: CameraFrame, ms = 1800) {
      const [wx, wy] = frameBounds(frame).center;
      const target = new THREE.Vector3(...worldTo3(wx, wy, groundY(wx, wy)));
      const viewport = updateViewport();
      const pad = Math.min(56, viewport.width * .12, viewport.height * .12);
      const dir = cameraDirection();
      const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
      const up = dir.clone().cross(right);
      const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const tanX = tanY * camera.aspect * (viewport.width - pad * 2) / viewWidth;
      const availableY = tanY * (viewport.height - pad * 2) / viewHeight;
      let dist = Math.max(500, 6400 / Math.max(.55, frame.maxZoom));
      for (const ll of frame.points) {
        const [x, y] = project(ll);
        const p = new THREE.Vector3(...worldTo3(x, y, groundY(x, y))).sub(target);
        dist = Math.max(dist, p.dot(dir) + Math.max(Math.abs(p.dot(right)) / tanX, Math.abs(p.dot(up)) / availableY));
      }
      moveCamera(target, dist, ms);
      cameraFrame = frame;
    },
    cameraFocus(): CameraFocus {
      return { ll: unproject([controls.target.x + W / 2, controls.target.z + H / 2]), relZoom: 6400 / camera.position.distanceTo(controls.target) };
    },
    cancelFlight,
    onManual(fn: () => void) { manualListeners.push(fn); },
    select(id: string | null) { selected = id; unitsDirty = true; },
    resize,
    stats() {
      let inst = 0; for (const g of groups.values()) inst += g.count;
      const focus = controls.target.clone().project(camera);
      // 读取已提交的实例矩阵，供沙盘检查位置和 +X 机头是否沿实际飞行方向。
      const aircraft = [...unitInstances].filter(([, entry]) => entry.phase).map(([unit, entry]) => {
        const matrix = new THREE.Matrix4(); entry.mesh.getMatrixAt(entry.index, matrix);
        const position = new THREE.Vector3().setFromMatrixPosition(matrix);
        const nose = new THREE.Vector3(1, 0, 0).transformDirection(matrix);
        return { unit, model: entry.model, phase: entry.phase, world: [position.x + W / 2, position.z + H / 2],
          position: position.toArray(), nose: nose.toArray() };
      });
      return { fps: Math.round(fps), instances: inst, groups: groups.size, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, ready: !!terrainMesh,
        aircraft,
        camera: { ll: unproject([controls.target.x + W / 2, controls.target.z + H / 2]), distance: camera.position.distanceTo(controls.target), screen: [(focus.x + 1) * viewWidth / 2, (1 - focus.y) * viewHeight / 2],
          points: cameraFrame?.points.map((ll) => { const [x, y] = project(ll); const p = new THREE.Vector3(...worldTo3(x, y, groundY(x, y))).project(camera); return [(p.x + 1) * viewWidth / 2, (1 - p.y) * viewHeight / 2]; }) ?? [] } };
    },
  };
}
