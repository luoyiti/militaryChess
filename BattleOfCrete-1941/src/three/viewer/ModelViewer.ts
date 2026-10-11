/**
 * 单位卡 3D 模型查看器（CONTRACT §8）。
 * - 懒创建并复用**单例** WebGLRenderer：页面上最多 1 个 WebGL 上下文；多个 ModelViewer 之间按最近一次 show() 抢占画布。
 * - OrbitControls（限制俯仰、阻尼）、复古暖光（暖主光 + 冷补光 + 半球光）、纸色圆形底座接收软阴影、缓慢自动旋转。
 * - ResizeObserver 适配容器；容器隐藏/页面不可见时停止渲染循环。
 * - dispose() 只解绑容器与释放本实例资源，保留单例 renderer 供后续复用。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelId } from '../../schema';
import { buildModel, MODEL_SPECS } from '../models';

let R: THREE.WebGLRenderer | null = null;
let owner: ModelViewer | null = null;

function getRenderer(): THREE.WebGLRenderer {
  if (!R) {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.3;
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFShadowMap;
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.setClearColor(0x000000, 0);
    R.domElement.style.display = 'block';
    R.domElement.style.width = '100%';
    R.domElement.style.height = '100%';
    R.domElement.style.touchAction = 'none';
  }
  return R;
}

function disposeObject(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      // CanvasTexture 由 decals 模块缓存复用，这里不释放纹理
      mat.dispose();
    }
  });
}

export interface ModelViewerOptions { autoRotate?: boolean; rotateSpeed?: number; background?: string | null }

export class ModelViewer {
  readonly container: HTMLElement;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.05, 200);
  private controls: OrbitControls | null = null;
  private model: THREE.Group | null = null;
  private base: THREE.Group;
  private key: THREE.DirectionalLight;
  private ro: ResizeObserver;
  private io: IntersectionObserver | null = null;
  private raf = 0;
  private inView = true;
  private disposed = false;
  private idleTimer = 0;
  private size = 5;
  private opts: Required<ModelViewerOptions>;
  private onVis = () => this.kick();

  constructor(container: HTMLElement, opts: ModelViewerOptions = {}) {
    this.container = container;
    this.opts = { autoRotate: opts.autoRotate ?? true, rotateSpeed: opts.rotateSpeed ?? 0.9, background: opts.background ?? null };
    if (this.opts.background) this.scene.background = new THREE.Color(this.opts.background);

    // 复古暖光
    const hemi = new THREE.HemisphereLight(0xf6ead0, 0x5a4c38, 1.5);
    this.scene.add(hemi);
    this.key = new THREE.DirectionalLight(0xffdcae, 3.0);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.02;
    this.key.shadow.radius = 4;
    this.scene.add(this.key, this.key.target);
    const fill = new THREE.DirectionalLight(0xa9bdd6, 0.75);
    fill.position.set(-6, 4, -5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe9c4, 0.5);
    rim.position.set(-2, 6, 8);
    this.scene.add(rim);

    this.base = this.makeBase();
    this.scene.add(this.base);

    this.ro = new ResizeObserver(() => { this.resize(); this.kick(); });
    this.ro.observe(container);
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver((es) => { this.inView = es.some((e) => e.isIntersecting); this.kick(); });
      this.io.observe(container);
    }
    document.addEventListener('visibilitychange', this.onVis);
  }

  private makeBase(): THREE.Group {
    const g = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.02, 0.06, 72),
      new THREE.MeshStandardMaterial({ color: 0xe9dcbc, roughness: 0.95, metalness: 0 }),
    );
    top.position.y = -0.03;
    top.receiveShadow = true;
    const edge = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 1.05, 0.05, 72),
      new THREE.MeshStandardMaterial({ color: 0x6b5a40, roughness: 0.8, metalness: 0.05 }),
    );
    edge.position.y = -0.085;
    edge.receiveShadow = true;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 0.935, 96),
      new THREE.MeshBasicMaterial({ color: 0x8a7654, transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    g.add(top, edge, ring);
    return g;
  }

  /** 显示指定模型 */
  show(id: ModelId): void {
    if (this.disposed) throw new Error('ModelViewer 已 dispose');
    if (this.model) { this.scene.remove(this.model); disposeObject(this.model); }
    const m = buildModel(id);
    this.model = m;
    this.scene.add(m);
    const sp = MODEL_SPECS[id];
    const footprint = Math.hypot(sp.lengthM, sp.widthM);
    this.size = Math.max(footprint, sp.heightM * 1.2);
    const r = footprint * 0.62 + 0.25;
    this.base.scale.set(r, 1, r);
    // 阴影相机贴合模型
    const s = this.size;
    const cam = this.key.shadow.camera;
    cam.left = -s; cam.right = s; cam.top = s; cam.bottom = -s; cam.near = 0.1; cam.far = s * 8;
    cam.updateProjectionMatrix();
    this.key.position.set(s * 1.2, s * 1.9, s * 0.9);
    this.key.target.position.set(0, sp.heightM * 0.3, 0);
    // 相机：按实际包围球取景
    const bb = new THREE.Box3().setFromObject(m);
    const sph = bb.getBoundingSphere(new THREE.Sphere());
    const vf = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const aspect = Math.max(0.5, this.container.clientWidth / Math.max(1, this.container.clientHeight));
    const hf = Math.atan(Math.tan(vf) * aspect);
    const dist = sph.radius / Math.sin(Math.min(vf, hf)) * 0.92;
    const ty = sph.center.y * 0.9;
    this.camera.position.set(dist * 0.66, ty + dist * 0.38, dist * 0.62);
    this.camera.near = dist / 50; this.camera.far = dist * 10;
    this.camera.updateProjectionMatrix();
    this.attach();
    this.controls!.target.set(0, ty, 0);
    this.controls!.minDistance = dist * 0.45;
    this.controls!.maxDistance = dist * 2.2;
    this.controls!.update();
    this.kick();
  }

  private attach(): void {
    const r = getRenderer();
    if (owner !== this) {
      owner?.detach();
      owner = this;
    }
    if (r.domElement.parentElement !== this.container) this.container.appendChild(r.domElement);
    if (!this.controls) {
      const c = new OrbitControls(this.camera, r.domElement);
      c.enableDamping = true;
      c.dampingFactor = 0.08;
      c.enablePan = false;
      c.minPolarAngle = Math.PI * 0.12;
      c.maxPolarAngle = Math.PI * 0.46;
      c.autoRotate = this.opts.autoRotate;
      c.autoRotateSpeed = this.opts.rotateSpeed;
      c.addEventListener('start', () => { c.autoRotate = false; window.clearTimeout(this.idleTimer); this.kick(); });
      c.addEventListener('end', () => {
        window.clearTimeout(this.idleTimer);
        this.idleTimer = window.setTimeout(() => { c.autoRotate = this.opts.autoRotate; this.kick(); }, 3000);
      });
      c.addEventListener('change', () => this.kick());
      this.controls = c;
    }
    this.resize();
  }

  private detach(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.clearTimeout(this.idleTimer);
    this.controls?.dispose();
    this.controls = null;
    if (R && R.domElement.parentElement === this.container) this.container.removeChild(R.domElement);
    if (owner === this) owner = null;
  }

  private resize(): void {
    if (owner !== this || !R) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (w < 2 || h < 2) return;
    R.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private canRender(): boolean {
    return owner === this && !this.disposed && this.inView && document.visibilityState !== 'hidden'
      && this.container.isConnected && this.container.clientWidth > 1 && this.container.clientHeight > 1;
  }

  /** 启动（或保持）渲染循环；不满足条件时自动停止 */
  private kick(): void {
    if (this.raf || !this.canRender()) return;
    const loop = () => {
      // OrbitControls.update() emits change synchronously. Keep the current RAF
      // marked active until the next one is scheduled to avoid duplicate loops.
      if (!this.canRender() || !R) { this.raf = 0; return; }
      this.controls?.update();
      R.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** 解绑容器、释放本实例资源；单例 renderer 保留 */
  dispose(): void {
    if (this.disposed) return;
    this.detach();
    this.disposed = true;
    this.ro.disconnect();
    this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.model) disposeObject(this.model);
    disposeObject(this.base);
    this.model = null;
  }
}
