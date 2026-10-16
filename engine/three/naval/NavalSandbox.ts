/**
 * 3D 海战沙盘（manifest.sandbox.kind = 'naval'）：Gerstner 海面与天空（按 time.utcOffset 计算的太阳高度与昼夜色板）、
 * 海岸、真实舰型模型（航向、摇摆、下沉/自沉）、尾迹与舰首浪、炮口闪光、曳光弹道、水柱、命中火光与黑烟、烟幕、鱼雷航迹、舰载机。
 *
 * 局部切平面 + 浮动原点（geo.ts）：镜头焦点远离原点时整体平移，保证交战海域的精度。
 * 「兵棋比例」下舰船与特效随镜头距离放大（距离不变），「真实比例」为 1:1。
 * 接口与地形沙盘一致（engine/app/start.ts 的 Sandbox）。数据只通过 engine/naval/model.ts 与 engine/model/core.ts 读取。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import type { DB } from '../../data/db';
import type { CameraFrame, CameraFocus, CameraInsets } from '../../app/camera';
import { cameraViewport } from '../../app/camera';
import type { LonLat } from '../../core/types';
import { unitStateAt, type RUnit, type UnitState } from '../../model/core';
import { hoursToDate } from '../../core/time';
import { unproject } from '../../geo/frame';
import { store } from '../../app/store';
import { manifest } from '../../campaign/context';
import { buildInstanceGeometry } from '../models';
import { SHIP_META, type ShipMeta } from '../models/ships';
import { MODEL_SPECS } from '../models/specs';
import {
  bearingDeg, destination, distanceKm, damageAt, hitsBetween, torpedoesAt, smokeAt, sunPosition, shellFlightSec, hash01,
} from '../../naval/model';
import { LocalFrame, courseYaw, bearingVec, relToDist, distToRel, wargameScale, dayPhase } from './geo';
import { shipModelFor, aircraftModelFor, modelScaleFor, terminalAt, sinkProfile, weaponLocal, bob } from './fleet';
import { salvoWindow, scatter, splashHeightM, apexM, flightRealSec, type Salvo } from './gunnery';
import { createOceanUniforms, oceanGeometry, oceanMaterial, skyMaterial, envAt, dirFromAzEl, waveHeight, type Env } from './ocean';
import { loadLand, landMaterial } from './land';
import { LatestRequest } from '../../core/latest';
import { makeAtlas, SpriteBatch, Particles, RibbonBatch, TILE } from './fx';

const DEG = Math.PI / 180;
const KN = 0.514444; // 节 → 米/秒
const LAND_R = 1_200_000; // 陆地裁剪半径（米）
const REORIGIN = 250_000; // 焦点离原点超过此距离时重定原点

interface ShipObj {
  u: RUnit; model: string; mesh: THREE.Mesh; meta: ShipMeta; lengthM: number; beamM: number; k0: number; termH: number | null;
  label: CSS2DObject; el: HTMLDivElement; air: boolean;
  /** 本帧状态 */
  s: UnitState | null; x: number; z: number; yaw: number; k: number; visible: boolean; sinkY: number; inView?: boolean; simVersion?: number; damage?: ReturnType<typeof damageAt>;
}
interface Shell { x0: number; y0: number; z0: number; x1: number; z1: number; t0: number; dur: number; apex: number; calMm: number; k: number }

export function createNavalSandbox(host: HTMLElement, db: DB, getInsets?: () => CameraInsets) {
  const m = manifest();
  const nav = db.naval;
  const utcOffset = m.time.utcOffset ?? 0;
  const wakeMin = m.naval?.wakeMin ?? 6;
  const startLL = (m.sandbox?.target ?? m.map.home3d) as LonLat;
  const frame = new LocalFrame(startLL);

  // ---------- 渲染器 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  const labelR = new CSS2DRenderer();
  Object.assign(labelR.domElement.style, { position: 'absolute', left: '0', top: '0' });
  host.appendChild(labelR.domElement);
  const hint = document.createElement('div');
  hint.className = 'sb3-hint';
  hint.textContent = '左键拖动旋转 · 右键平移 · 滚轮缩放 · 点击舰名查看档案';
  host.appendChild(hint);
  const hud = document.createElement('div');
  hud.className = 'nv3-hud';
  host.appendChild(hud);
  const hudTime = document.createElement('span');
  hud.appendChild(hudTime);
  const scaleBtn = document.createElement('button');
  scaleBtn.type = 'button';
  scaleBtn.className = 'nv3-scale';
  hud.appendChild(scaleBtn);
  let wargame = true;
  const setScaleLabel = () => { scaleBtn.textContent = wargame ? '兵棋比例（舰船放大）' : '真实比例 1:1'; scaleBtn.title = '切换舰船显示比例；距离始终为真实距离'; };
  setScaleLabel();
  scaleBtn.addEventListener('click', () => { wargame = !wargame; setScaleLabel(); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 1e7);
  const controls = new OrbitControls(camera, labelR.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 40;
  controls.maxDistance = 2_600_000;
  controls.screenSpacePanning = false;
  controls.target.set(0, 0, 0);
  camera.position.set(-9000, 7000, 16000);
  const manualListeners: (() => void)[] = [];
  controls.addEventListener('start', () => { cancelFlight(); for (const fn of manualListeners) fn(); });

  // ---------- 天空、海面、光照 ----------
  const U = createOceanUniforms();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMaterial(U));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);
  const ocean = new THREE.Mesh(oceanGeometry(150, 180), oceanMaterial(U, true));
  ocean.frustumCulled = false;
  scene.add(ocean);
  const sunL = new THREE.DirectionalLight(0xffffff, 2);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.6);
  scene.add(sunL, sunL.target, hemi);
  let env: Env = envAt(20);

  // 陆地
  const landMat = landMaterial();
  let land: THREE.Mesh | null = null;
  let landReady = false, geometryReady = false;
  const landRequests = new LatestRequest();
  const landWorker = new Worker(new URL('./land.worker.ts', import.meta.url), { type: 'module' });
  let landOrigin: [number, number] = [frame.lon0, frame.lat0];
  let landBusy = false;
  let pendingLand: { type: 'build'; id: number; origin: number[]; radius: number; step: number } | null = null;
  let resolveLand: () => void;
  const ready = new Promise<void>(resolve => { resolveLand = resolve; });
  const flushLand = () => { if (landReady && !landBusy && pendingLand) { landBusy=true; landWorker.postMessage(pendingLand); pendingLand=null; } };
  function rebuildLand() {
    // Keep old geometry in its geographic position until its replacement arrives.
    if (land) { land.position.x=frame.x(landOrigin); land.position.z=frame.z(landOrigin); land.scale.x=frame.kx / new LocalFrame(landOrigin).kx; }
    pendingLand={type:'build',id:landRequests.next(),origin:[frame.lon0,frame.lat0],radius:LAND_R,step:700};
    flushLand();
  }
  landWorker.onmessage = (ev) => {
    const data = ev.data;
    if (data.type === 'ready') { landReady=true; flushLand(); return; }
    landBusy=false;
    if (data.type === 'error') { console.warn('[naval3d] 海岸生成失败',data.error); resolveLand(); }
    else if (landRequests.accepts(data.id)) {
      if (land) { scene.remove(land); land.geometry.dispose(); land=null; }
      if(data.position) {
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.BufferAttribute(data.position,3));
        geometry.setAttribute('normal',new THREE.BufferAttribute(data.normal,3));
        geometry.setAttribute('aTop',new THREE.BufferAttribute(data.top,1));
        geometry.computeBoundingSphere(); land=new THREE.Mesh(geometry,landMat);land.scale.y=40;land.position.y=-6;scene.add(land);
      }
      landOrigin=[frame.lon0,frame.lat0]; geometryReady=true; resolveLand();
    }
    flushLand();
  };
  landWorker.onerror = () => { console.warn('[naval3d] 海岸工作线程不可用'); landBusy=false; resolveLand(); };
  void loadLand('geo/vectors.topo.json',xy=>unproject(xy as [number,number])).then(polys=>{landWorker.postMessage({type:'init',polys});rebuildLand();}).catch(error=>{console.warn('[naval3d] 海岸加载失败',error);resolveLand();});

  // ---------- 特效批次 ----------
  const atlas = makeAtlas();
  const fog = { color: U.uFogCol.value, density: U.uFogDensity };
  const alphaB = new SpriteBatch(6000, atlas, false, fog);
  const addB = new SpriteBatch(3000, atlas, true, fog);
  alphaB.mesh.renderOrder = 4; addB.mesh.renderOrder = 5;
  const parts = new Particles(7000);
  const ribbons = new RibbonBatch(24000, { uTime: U.uTime, uScale: U.uScale, uFogCol: U.uFogCol, uFogDensity: U.uFogDensity });
  scene.add(ribbons.mesh, alphaB.mesh, addB.mesh);
  const shells: Shell[] = [];

  // ---------- 舰船与舰载机 ----------
  const shipMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.08 });
  const ships: ShipObj[] = [];
  const geoCache = new Map<string, THREE.BufferGeometry>();
  const modelQueue = [...db.units.values()].sort((a,b)=>{
    const rank=(u: RUnit)=>{const state=unitStateAt(u.id,db.units,store.get().t);return state?distanceKm(startLL,state.ll):1e9;};
    return rank(a)-rank(b);
  });
  const shipById = new Map<string, ShipObj>();
  let modelsDone = false;
  async function buildFleet() {
  for (const u of modelQueue) {
    const shipModel = shipModelFor(u);
    const airModel = shipModel ? null : aircraftModelFor(u);
    const model = shipModel ?? airModel;
    if (!model || !u.track.length) continue;
    let geo = geoCache.get(model);
    if (!geo) { geo = buildInstanceGeometry(model); geoCache.set(model, geo); }
    const mesh = new THREE.Mesh(geo, shipMat);
    mesh.rotation.order = 'YXZ';
    mesh.visible = false;
    scene.add(mesh);
    const spec = MODEL_SPECS[model];
    const meta = SHIP_META[model] ?? { draftM: 0, deck: [[-1, 1], [1, 1]], funnels: [], bridge: [0, 1, 0], mastTop: spec?.heightM ?? 4 };
    const el = document.createElement('div');
    el.className = `sb3-unit side-${u.side}`;
    el.textContent = u.name.short ?? u.name.zh;
    el.title = u.name.zh;
    el.addEventListener('click', (ev) => { ev.stopPropagation(); store.set({ selectedUnit: u.id }); });
    const label = new CSS2DObject(el);
    scene.add(label);
    const object: ShipObj = {
      u, model, mesh, meta: meta as ShipMeta, lengthM: (spec?.lengthM ?? 100), beamM: spec?.widthM ?? 15, k0: shipModel ? modelScaleFor(u, model) : 1,
      termH: terminalAt(u), label, el, air: !!airModel, s: null, x: 0, z: 0, yaw: 0, k: 1, visible: false, sinkY: 0,
    };
    ships.push(object); shipById.set(u.id,object);
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  modelsDone=true;
  }
  // Start after construction so the first frame is not blocked by building every fleet model.
  setTimeout(()=>void buildFleet(),0);

  // ---------- 状态 ----------
  let T = store.get().t;
  let lastT = T;
  let selected: string | null = null;
  let running = false, raf = 0;
  let frames = 0, fpsT = performance.now(), fps = 0;
  let lastFrame = performance.now();
  const t0 = performance.now();
  let tSec = 0;
  let totalFrames = 0;
  let envKey = '';
  let simVersion = 0;
  let viewW = 1, viewH = 1;

  function resize() {
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    renderer.domElement.style.width = r.width + 'px';
    renderer.domElement.style.height = r.height + 'px';
    labelR.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(1, r.height);
    viewW = r.width; viewH = r.height;
    updateViewport();
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  let viewportKey='';
  function updateViewport() {
    if (!getInsets) return;
    const v = cameraViewport(viewW, viewH, getInsets());
    const key=[viewW,viewH,v.x,v.y,v.width,v.height].join(',');
    if(key===viewportKey)return;viewportKey=key;
    camera.setViewOffset(viewW, viewH, viewW / 2 - (v.x + v.width / 2), viewH / 2 - (v.y + v.height / 2), viewW, viewH);
  }

  // ---------- 镜头 ----------
  function cancelFlight() { gsap.killTweensOf(controls.target); gsap.killTweensOf(camera.position); }
  const camDist = () => camera.position.distanceTo(controls.target);
  /** 焦点远离原点：整体平移（镜头、粒子、炮弹），重建陆地 */
  function reorigin(ll: LonLat) {
    const dx = frame.x(ll), dz = frame.z(ll);
    frame.set(ll);
    camera.position.x -= dx; camera.position.z -= dz;
    controls.target.x -= dx; controls.target.z -= dz;
    parts.shift(dx, dz);
    for (const s of shells) { s.x0 -= dx; s.z0 -= dz; s.x1 -= dx; s.z1 -= dz; }
    rebuildLand();
  }
  function moveCamera(ll: LonLat, dist: number, ms: number) {
    cancelFlight();
    // 远距离飞行：先把原点移到目的地附近，再在局部坐标里补间
    if (Math.hypot(frame.x(ll), frame.z(ll)) > REORIGIN) reorigin(ll);
    const [tx, tz] = frame.toXZ(ll);
    const dir = camera.position.clone().sub(controls.target).normalize();
    dir.y = Math.max(0.32, Math.min(0.85, dir.y));
    dir.normalize();
    const d = Math.max(controls.minDistance, Math.min(controls.maxDistance, dist));
    const to = new THREE.Vector3(tx, 0, tz).add(dir.multiplyScalar(d));
    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms / 1000;
    if (duration <= 0) { controls.target.set(tx, 0, tz); camera.position.copy(to); controls.update(); return; }
    gsap.to(controls.target, { x: tx, y: 0, z: tz, duration, ease: 'power2.inOut' });
    gsap.to(camera.position, { x: to.x, y: to.y, z: to.z, duration, ease: 'power2.inOut' });
  }
  // 初始镜头：交战海域斜视
  camera.position.set(-9000, 9000, 18000);

  // ---------- 每帧：太阳与环境 ----------
  const sunDir = new THREE.Vector3();
  function updateEnv() {
    const key = `${T}:${controls.target.x}:${controls.target.z}:${frame.lon0}:${frame.lat0}`;
    if(key === envKey) return;
    envKey = key;
    const focus = frame.toLL(controls.target.x, controls.target.z);
    const utcMs = hoursToDate(T).getTime() - utcOffset * 3600_000;
    const sp = sunPosition(focus, utcMs);
    env = envAt(sp.elevation, env);
    dirFromAzEl(sp.azimuth, sp.elevation, sunDir);
    U.uSunDir.value.copy(sunDir);
    U.uZenith.value.copy(env.zenith); U.uHorizon.value.copy(env.horizon); U.uGround.value.copy(env.ground); U.uSunGlow.value.copy(env.sunGlow);
    U.uSunCol.value.copy(env.sunCol); U.uSunI.value = env.sunI; U.uDeep.value.copy(env.deep); U.uScatter.value.copy(env.scatter);
    U.uFogCol.value.copy(env.horizon); U.uNight.value = env.night; U.uStars.value = env.stars;
    U.uMoonDir.value.set(0, -1, 0); // 1939 年 12 月中旬近新月（德方计划利用的无月夜）
    renderer.toneMappingExposure = env.exposure;
    sunL.color.copy(env.sunCol); sunL.intensity = Math.max(0.05, env.sunI) * (sp.elevation > -2 ? 1 : 0.35);
    sunL.position.copy(controls.target).addScaledVector(sp.elevation > -2 ? sunDir : new THREE.Vector3(0.3, 1, 0.2).normalize(), 50_000);
    sunL.target.position.copy(controls.target);
    hemi.color.copy(env.hemiSky); hemi.groundColor.copy(env.hemiGround); hemi.intensity = env.hemiI;
    const d = hoursToDate(T);
    const p2 = (n: number) => String(n).padStart(2, '0');
    const morning = d.getUTCHours() < 12;
    const text = `${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} · ${dayPhase(sp.elevation, morning)} · 太阳高度 ${Math.round(sp.elevation)}°`;
    if(hudTime.textContent !== text) hudTime.textContent=text;
  }

  // ---------- 每帧：舰船 ----------
  function shipScale(dist: number) { return wargame ? wargameScale(dist, 3, 90) : 1; }
  const shipFrustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();
  const shipSphere = new THREE.Sphere();
  const effectSphere = new THREE.Sphere();
  alphaB.visible = addB.visible = (x,y,z,radius) => {
    effectSphere.center.set(x,y,z); effectSphere.radius=radius;
    return shipFrustum.intersectsSphere(effectSphere);
  };
  function updateShips(dist: number) {
    camera.updateMatrixWorld();
    shipFrustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const base = shipScale(dist);
    for (const o of ships) {
      if(o.simVersion !== simVersion) {
        o.s=unitStateAt(o.u.id,db.units,T);o.damage=damageAt(nav,o.u.id,T);o.simVersion=simVersion;
      }
      const s = o.s;
      if (!s || s.fade <= 0.03) { o.visible = false; o.mesh.visible = false; o.label.visible = false; continue; }
      const [x, z] = frame.toXZ(s.ll);
      o.x = x; o.z = z;
      let course = s.courseDeg;
      if (course === undefined) {
        const s2 = unitStateAt(o.u.id, db.units, T + 0.02);
        course = s2 && distanceKm(s.ll, s2.ll) > 0.001 ? bearingDeg(s.ll, s2.ll) : 0;
      }
      o.yaw = courseYaw(course);
      const k = (o.air ? Math.min(base, 12) : base) * o.k0;
      o.k = k;
      let y = 0, roll = 0, pitch = 0, sinkY = 0;
      if (o.air) {
        y = (s.altitudeM ?? 500) * Math.min(1.6, Math.max(1, base / 6));
        roll = Math.sin(tSec * 0.6 + o.lengthM) * 6;
      } else {
        const b = bob(o.u.id, tSec, s.speedKn ?? 0, o.lengthM);
        roll = b.roll; pitch = b.pitch;
        const wave = waveHeight(x, z, U.uTime.value, U.uScale.value, 0.6);
        y = -o.meta.draftM * k + (b.heave + wave * 0.5) * Math.min(k, 3);
        if (o.termH !== null && T >= o.termH) {
          const sp = sinkProfile(T - o.termH, s.fade, o.meta, o.meta.mastTop);
          if (sp.gone) { o.visible = false; o.mesh.visible = false; o.label.visible = false; continue; }
          sinkY = sp.sink * k; y -= sinkY; roll += sp.listDeg; pitch += sp.pitchDeg;
        } else {
          const dmg = o.damage!;
          if (dmg.state?.listDeg) roll += dmg.state.listDeg;
        }
      }
      o.sinkY = sinkY;
      o.visible = true;
      o.mesh.visible = true;
      o.mesh.position.set(x, y, z);
      o.mesh.rotation.set(roll * DEG, o.yaw, pitch * DEG);
      o.mesh.scale.setScalar(k);
      shipSphere.center.copy(o.mesh.position); shipSphere.radius=Math.max(o.lengthM*k*10,(s.speedKn ?? 0)*1852*wakeMin/60+o.lengthM*k*3,2000);
      o.inView=shipFrustum.intersectsSphere(shipSphere);
      o.label.visible = o.inView;
      o.label.position.set(x, y + (o.meta.mastTop + 6) * k + (o.air ? 30 : 0), z);
      const sel=o.u.id===selected, dead=s.status==='destroyed'||s.status==='inactive';
      if(o.el.classList.contains('sel')!==sel)o.el.classList.toggle('sel',sel);
      if(o.el.classList.contains('dead')!==dead)o.el.classList.toggle('dead',dead);
    }
  }
  /** 模型坐标（自龙骨，+X 舰艏）→ 世界坐标 */
  const tmpV = new THREE.Vector3();
  function shipPoint(o: ShipObj, lx: number, ly: number, lz = 0): THREE.Vector3 {
    tmpV.set(lx, ly, lz).applyEuler(o.mesh.rotation).multiplyScalar(o.k);
    return tmpV.add(o.mesh.position);
  }

  // ---------- 每帧：尾迹、舰首浪、鱼雷 ----------
  const strip = new Float32Array(6 * 40);
  function updateRibbons() {
    ribbons.begin();
    const N = 16;
    for (const o of ships) {
      if (!o.visible || !o.inView || o.air || !o.s || (o.s.speedKn ?? 0) < 2 || o.sinkY > 0) continue;
      const kn = o.s.speedKn ?? 0;
      const beam = (o.u.ship?.beamM ?? o.beamM) * o.k;
      let n = 0, along = 0, px = 0, pz = 0;
      for (let i = 0; i < N; i++) {
        const h = T - (i / (N - 1)) * (wakeMin / 60);
        const s = i === 0 ? o.s : unitStateAt(o.u.id, db.units, h);
        if (!s) break;
        let [x, z] = frame.toXZ(s.ll);
        if (i === 0) { const st = shipPoint(o, -o.lengthM * 0.48, 0); x = st.x; z = st.z; }
        if (i > 0) along += Math.hypot(x - px, z - pz);
        px = x; pz = z;
        const f = i / (N - 1);
        const b = n * 6;
        strip[b] = x; strip[b + 1] = z; strip[b + 2] = 0.4 * Math.min(o.k, 4); strip[b + 3] = beam * (0.55 + f * 2.6);
        strip[b + 4] = Math.min(1, kn / 18) * (1 - f) * 0.95; strip[b + 5] = along;
        n++;
      }
      if (n > 1) ribbons.strip(strip, n, 0);
      // 舰首浪：艏到舰中的短带
      let m2 = 0;
      for (let i = 0; i < 6; i++) {
        const f = i / 5;
        const p = shipPoint(o, o.lengthM * (0.5 - f * 0.45), 0);
        const b = m2 * 6;
        strip[b] = p.x; strip[b + 1] = p.z; strip[b + 2] = 0.5 * Math.min(o.k, 4); strip[b + 3] = beam * (0.45 + f * 0.35);
        strip[b + 4] = Math.min(1, kn / 22) * (0.9 - f * 0.6); strip[b + 5] = f * o.lengthM * o.k;
        m2++;
      }
      ribbons.strip(strip, m2, 2);
    }
    if (store.get().layers.gunfire !== false) {
      for (const tr of torpedoesAt(nav, db.units, T)) {
        const n = tr.launch.count, spread = tr.launch.spreadDeg ?? 4;
        const brg = bearingDeg(tr.from, tr.to), km = distanceKm(tr.from, tr.to);
        for (let i = 0; i < n; i++) {
          const b2 = brg + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0);
          const segs = 10;
          for (let j = 0; j <= segs; j++) {
            const f = (j / segs) * tr.frac;
            const ll = destination(tr.from, b2, km * f);
            const [x, z] = frame.toXZ(ll);
            const b = j * 6;
            strip[b] = x; strip[b + 1] = z; strip[b + 2] = 0.3; strip[b + 3] = 2.2 * Math.min(shipScale(camDist()), 5);
            strip[b + 4] = (tr.done ? 0.2 : 0.45) * (0.3 + 0.7 * (j / segs)); strip[b + 5] = km * 1000 * f;
          }
          ribbons.strip(strip, segs + 1, 1);
        }
      }
    }
    ribbons.end();
  }

  // ---------- 炮火 ----------
  function fireSalvo(sv: Salvo, now: number, rate: number) {
    const a = shipById.get(sv.fire.shooter), b = shipById.get(sv.fire.target);
    if (!a || !b || !a.visible || !b.visible || !a.s || !b.s) return;
    const aft = sv.weapon ? (sv.weapon.atPct ?? 30) > 50 : false;
    const [lx, ly] = weaponLocal(a.meta, a.lengthM, sv.weapon, aft);
    const muzzle = shipPoint(a, lx, ly).clone();
    const km = distanceKm(a.s.ll, b.s.ll);
    const big = Math.min(2.2, sv.calMm / 150);
    // 炮口闪光与硝烟
    const ks = a.k;
    parts.spawn({ x: muzzle.x, y: muzzle.y, z: muzzle.z, life: 0.22, s0: 28 * big * ks, s1: 46 * big * ks, r: 1, g: 0.78, b: 0.42, a: 1, tile: TILE.flash, additive: true, fin: 0, fout: 0.2 });
    for (let i = 0; i < 3; i++) parts.spawn({ x: muzzle.x, y: muzzle.y, z: muzzle.z, vy: 4 * ks, life: 3.5, s0: 18 * big * ks, s1: 70 * big * ks, r: 0.62, g: 0.6, b: 0.56, a: 0.55, tile: TILE.puff, drag: 0.6, fin: 0.05, fout: 0.3 });
    // 落点：目标在弹着时刻附近的位置 + 散布
    const brg = bearingDeg(a.s.ll, b.s.ll);
    const [ux, uz] = bearingVec(brg);
    const spreadAlong = Math.max(80, km * 1000 * 0.012), spreadAcross = Math.max(40, km * 1000 * 0.004);
    const dur = flightRealSec(shellFlightSec(km, sv.calMm), rate);
    for (let i = 0; i < sv.shells; i++) {
      const sc = scatter(sv.key, i);
      const x1 = b.x + ux * sc.along * spreadAlong - uz * sc.across * spreadAcross;
      const z1 = b.z + uz * sc.along * spreadAlong + ux * sc.across * spreadAcross;
      shells.push({ x0: muzzle.x, y0: muzzle.y, z0: muzzle.z, x1, z1, t0: now + i * 0.06, dur, apex: apexM(km) * Math.min(1, 0.4 + ks / 30), calMm: sv.calMm, k: b.k });
    }
  }
  function splash(x: number, z: number, calMm: number, k: number) {
    const h = splashHeightM(calMm) * Math.min(k, 6);
    const w = h * 0.22;
    parts.spawn({ x, y: 0, z, vy: h * 0.9, life: 2.6, s0: w, s1: w * 2.4, r: 0.92, g: 0.95, b: 0.97, a: 0.95, tile: TILE.spray, grav: h * 0.75, drag: 0.2, fin: 0.02, fout: 0.45 });
    for (let i = 0; i < 4; i++) parts.spawn({ x: x + (i - 1.5) * w * 0.3, y: 0, z: z + ((i * 7) % 3 - 1) * w * 0.3, vy: h * (0.35 + i * 0.12), vx: (i - 1.5) * w * 0.2, life: 2.2, s0: w * 0.5, s1: w * 1.2, r: 0.9, g: 0.93, b: 0.95, a: 0.8, tile: TILE.spray, grav: h * 0.6, fin: 0.02, fout: 0.5 });
    parts.spawn({ x, y: 1, z, life: 3, s0: w * 0.8, s1: w * 4, r: 0.85, g: 0.9, b: 0.92, a: 0.5, tile: TILE.puff, fin: 0.1, fout: 0.3 });
  }
  function explosion(o: ShipObj, key: string, sev: number) {
    const along = (hash01(key, 1) - 0.5) * o.lengthM * 0.7;
    const p = shipPoint(o, along, o.meta.deck[0]?.[1] ?? 8).clone();
    const s = (sev === 1 ? 1.6 : sev === 2 ? 1.2 : 0.8) * o.k;
    parts.spawn({ x: p.x, y: p.y, z: p.z, life: 0.5, s0: 30 * s, s1: 90 * s, r: 1, g: 0.65, b: 0.3, a: 1, tile: TILE.flash, additive: true, fin: 0, fout: 0.25 });
    for (let i = 0; i < 6; i++) parts.spawn({ x: p.x, y: p.y, z: p.z, vx: (hash01(key, i + 3) - 0.5) * 30 * s, vy: (8 + hash01(key, i + 9) * 18) * s, vz: (hash01(key, i + 15) - 0.5) * 30 * s, life: 1.4, s0: 6 * s, s1: 2 * s, r: 1, g: 0.8, b: 0.4, a: 1, tile: TILE.dot, additive: true, grav: 20 * s, fin: 0, fout: 0.6 });
    for (let i = 0; i < 4; i++) parts.spawn({ x: p.x, y: p.y, z: p.z, vy: 6 * s, life: 6, s0: 25 * s, s1: 120 * s, r: 0.12, g: 0.11, b: 0.1, a: 0.75, tile: TILE.puff, drag: 0.4, fin: 0.05, fout: 0.35 });
  }
  function updateShells(now: number) {
    const showFire = store.get().layers.gunfire !== false;
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      const f = (now - s.t0) / s.dur;
      if (f < 0) continue;
      if (f >= 1) { if (showFire) splash(s.x1, s.z1, s.calMm, s.k); shells.splice(i, 1); continue; }
      if (!showFire) continue;
      const x = s.x0 + (s.x1 - s.x0) * f, z = s.z0 + (s.z1 - s.z0) * f;
      const y = s.y0 * (1 - f) + 4 * s.apex * f * (1 - f);
      const sz = Math.max(6, camDist() * 0.0035) * Math.min(1.6, s.calMm / 200);
      addB.push(x, y, z, sz, 1, 0.82, 0.5, 0.95, TILE.dot);
      // 曳光尾
      for (let j = 1; j <= 3; j++) {
        const g = Math.max(0, f - j * 0.012);
        addB.push(s.x0 + (s.x1 - s.x0) * g, s.y0 * (1 - g) + 4 * s.apex * g * (1 - g), s.z0 + (s.z1 - s.z0) * g, sz * (1 - j * 0.2), 1, 0.6, 0.3, 0.5 - j * 0.12, TILE.dot);
      }
    }
  }

  // ---------- 烟：烟囱、起火、烟幕 ----------
  let smokeAcc = 0;
  function emitSmoke(dt: number) {
    smokeAcc += dt;
    if (smokeAcc < 0.12) return;
    smokeAcc = 0;
    for (const o of ships) {
      if (!o.visible || o.air || !o.s) continue;
      const kn = o.s.speedKn ?? 0;
      const dmg = o.termH !== null && T >= o.termH ? null : damageAt(nav, o.u.id, T);
      const burning = (o.termH !== null && T >= o.termH && T - o.termH < 30) || !!dmg?.fire;
      for (const f of o.meta.funnels) {
        if (kn < 1 && !burning) break;
        const p = shipPoint(o, f[0], f[1], f[2]).clone();
        parts.spawn({ x: p.x, y: p.y, z: p.z, vy: 3 * o.k, life: 7, s0: 5 * o.k, s1: 30 * o.k, r: 0.3, g: 0.29, b: 0.28, a: 0.35, tile: TILE.puff, drag: 0.5, fin: 0.05, fout: 0.3 });
      }
      if (burning) {
        const along = (Math.random() - 0.5) * o.lengthM * 0.5;
        const p = shipPoint(o, along, o.meta.deck[1]?.[1] ?? 8).clone();
        parts.spawn({ x: p.x, y: p.y, z: p.z, vy: 5 * o.k, life: 0.9, s0: 10 * o.k, s1: 18 * o.k, r: 1, g: 0.55, b: 0.2, a: 0.9, tile: TILE.flash, additive: true, fin: 0.05, fout: 0.4 });
        parts.spawn({ x: p.x, y: p.y + 4 * o.k, z: p.z, vy: 7 * o.k, life: 10, s0: 14 * o.k, s1: 90 * o.k, r: 0.1, g: 0.09, b: 0.08, a: 0.65, tile: TILE.puff, drag: 0.35, fin: 0.04, fout: 0.3 });
      }
    }
  }
  function drawSmokeScreens() {
    for (const { puffs } of smokeAt(nav, db.units, T)) {
      for (const p of puffs) {
        const [x, z] = frame.toXZ(p.ll);
        const w = p.widthKm * 1000;
        alphaB.push(x, w * 0.22, z, w * 1.1, 0.82, 0.83, 0.84, p.alpha * 0.55, TILE.puff, (x + z) * 0.001);
        alphaB.push(x, w * 0.5, z, w * 0.8, 0.88, 0.88, 0.88, p.alpha * 0.35, TILE.puff, (x - z) * 0.001);
      }
    }
  }

  // ---------- 主循环 ----------
  let lastSim = T;
  function loop() {
    if (!running || document.hidden) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    tSec = (now - t0) / 1000;
    U.uTime.value = tSec;
    if (getInsets) updateViewport();
    // 跟随选中舰船
    const st = store.get();
    if (st.followUnit && st.selectedUnit) {
      const o = shipById.get(st.selectedUnit);
      if (o?.visible) { const dx = (o.x - controls.target.x) * 0.08, dz = (o.z - controls.target.z) * 0.08; controls.target.x += dx; controls.target.z += dz; camera.position.x += dx; camera.position.z += dz; }
    }
    controls.update();
    if (!gsap.isTweening(controls.target) && Math.hypot(controls.target.x, controls.target.z) > REORIGIN) reorigin(frame.toLL(controls.target.x, controls.target.z));
    const dist = camDist();
    const near=Math.max(0.5,dist/4000), far=Math.max(200_000,dist*60);
    if(camera.near!==near || camera.far!==far){camera.near=near;camera.far=far;camera.updateProjectionMatrix();}
    // 海面网格跟随镜头；波浪在兵棋比例下随舰船放大
    const R = Math.max(60_000, dist * 40);
    ocean.position.set(camera.position.x, 0, camera.position.z);
    ocean.scale.set(R, 1, R);
    U.uScale.value = Math.min(4, Math.max(1, shipScale(dist) / 3));
    U.uFade.value = Math.max(4000, dist * 2.5);
    U.uFogDensity.value = 1 / Math.max(70_000, dist * 7);
    sky.position.copy(camera.position);
    sky.scale.setScalar(camera.far * 0.9);
    updateEnv();
    updateShips(dist);
    // 炮火（只在正向连续播放时放出；跳转时清空）
    const dT = T - lastSim;
    if (dT > 0 && dT < 0.5) {
      const rate = dT / Math.max(dt, 1e-3);
      for (const sv of salvoWindow(nav, db.units, lastSim, T, rate)) fireSalvo(sv, now / 1000, rate);
      for (const hit of hitsBetween(nav, lastSim, T)) { const o = shipById.get(hit.target); if (o?.visible) explosion(o, hit.id, hit.severity); }
    } else if (dT !== 0) { shells.length = 0; parts.clear(); }
    lastSim = T;
    updateShells(now / 1000);
    emitSmoke(dt);
    parts.update(dt, -4.2 * Math.min(shipScale(dist), 6), -4.2 * Math.min(shipScale(dist), 6));
    alphaB.begin(); addB.begin();
    drawSmokeScreens();
    parts.write(alphaB, addB);
    alphaB.end(); addB.end();
    updateRibbons();
    renderer.render(scene, camera);
    labelR.render(scene, camera);
    frames++; totalFrames++;
    if (now - fpsT > 1000) { fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; }
  }

  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(raf); lastFrame=performance.now();lastSim=T;shells.length=0;parts.clear();
    if(!document.hidden && running) loop();
  });

  // 初始焦点
  moveCamera(startLL, relToDist(28), 0);

  return {
    show() { if (running) return; running = true; host.classList.remove('hidden'); resize(); lastFrame = performance.now(); lastSim = T; loop(); },
    hide() { running = false; cancelAnimationFrame(raf); },
    setTime(t: number) { if(t!==T) { T=t;simVersion++; } },
    setFields() { /* 海战沙盘不画控制区 */ },
    flyTo(ll: LonLat | [number, number], rel: number, ms = 1800) { moveCamera(ll as LonLat, relToDist(rel), ms); },
    flyToFrame(f: CameraFrame, ms = 1800) {
      if (!f.points.length) return;
      let lon = 0, lat = 0;
      for (const p of f.points) { lon += p[0]; lat += p[1]; }
      const c: LonLat = [lon / f.points.length, lat / f.points.length];
      let span = 0;
      for (const p of f.points) span = Math.max(span, distanceKm(c, p) * 1000);
      const fit = span / Math.tan((camera.fov / 2) * DEG) * 1.25;
      moveCamera(c, Math.max(relToDist(f.maxZoom), fit, 3000), ms);
    },
    cameraFocus(): CameraFocus { return { ll: frame.toLL(controls.target.x, controls.target.z), relZoom: distToRel(camDist()) }; },
    cancelFlight,
    onManual(fn: () => void) { manualListeners.push(fn); },
    select(id: string | null) { selected = id; },
    resize,
    stats() {
      return {
        landOrigin: [...landOrigin], landPending: landBusy || !!pendingLand, frames: totalFrames, memory: { ...renderer.info.memory }, modelsDone, fps: Math.round(fps), ships: ships.filter((s) => s.visible).length, particles: parts.alive, shells: shells.length,
        calls: renderer.info.render.calls, tris: renderer.info.render.triangles, ready: geometryReady && modelsDone, origin: [frame.lon0, frame.lat0],
        wargame, dist: Math.round(camDist()),
      };
    },
    /** 测试用：等待海岸加载 */
    ready,
  };
}
