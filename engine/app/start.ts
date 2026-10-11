/** 战役页面主程序：组装地图、图层、界面、导演、3D 沙盘与插件。由 boot() 在上下文初始化后动态导入。 */
import type { Topology } from 'topojson-specification';
import { getDB, type REvent } from '../data/db';
import { store } from './store';
import { clock } from './clock';
import { Director } from './director';
import { MapView } from '../map2d/MapView';
import { StaticLayers } from '../map2d/staticLayers';
import { DynamicLayers } from '../map2d/dynamicLayers';
import { UnitsLayer } from '../map2d/units';
import { FxLayer } from '../map2d/fx';
import { FieldClient, fieldCfg, type GeomResult } from '../geo/field/client';
import { project } from '../geo/frame';
import { unitStateAt } from '../model/core';
import { Timeline } from '../ui/timeline';
import { ChapterTimeline } from '../ui/timelineChapters';
import { Sidebar } from '../ui/sidebar';
import { EventCard, loadPhotoIndex, eventCardExtras } from '../ui/eventCard';
import { UnitCard } from '../ui/unitCard';
import { showIntro } from '../ui/intro';
import { showCredits } from '../ui/credits';
import { audio } from '../audio/audio';
import { isoToHours, isIso, T_START, T_END } from '../core/time';
import { PHASES, phaseAt } from '../core/phases';
import type { CampaignDef } from '../campaign/types';
import type { PluginHooks } from '../plugins/api';
import type { CameraFrame, CameraFocus } from './camera';
import { ECHELON_RANK } from '../core/types';

interface Sandbox {
  show(): void; hide(): void; setTime(t: number): void; setFields(g: GeomResult): void;
  flyTo(ll: [number, number], rel: number, ms?: number): void; flyToFrame(frame: CameraFrame, ms?: number): void; cameraFocus(): CameraFocus; cancelFlight(): void; onManual(fn: () => void): void;
  select(id: string | null): void; resize(): void; stats(): Record<string, unknown>;
}

const div = (cls: string, parent: HTMLElement) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };

export async function start(c: CampaignDef) {
  const m = c.manifest;
  const db = getDB();
  const app = document.getElementById('app')!;
  const mapEl = div('map', app);
  const sandboxEl = div('sandbox hidden', app);
  const ui = div('ui', app);
  const map = new MapView(mapEl);
  const photosP = loadPhotoIndex();
  const [topo, contextTopo] = await Promise.all([
    fetch('geo/vectors.topo.json').then((r) => r.json() as Promise<Topology>),
    m.map.contextTiles ? fetch('geo/context.topo.json').then((r) => r.json() as Promise<Topology>) : Promise.resolve(undefined),
    map.loadTiles('tiles/base/meta.json', 'tiles/base'),
    photosP,
  ]);
  const st = new StaticLayers(map, topo, db, contextTopo);
  const dyn = new DynamicLayers(map, st, db);
  const units = new UnitsLayer(map, db);
  const fx = new FxLayer(map);
  const field = new FieldClient(db.keyframes, 'geo/field_masks.bin', fieldCfg(m.control));
  const home3d = m.map.home3d;
  const focus = m.map.focus ?? home3d;

  // ---------- 顶栏 ----------
  const top = div('topbar', ui);
  top.innerHTML = `
    <a class="tb-back" href="../../" title="返回作战总台">‹ 总台</a>
    <div class="tb-title"><span class="tb-mark">${m.title.mark}</span><div><b>${m.title.zh}</b><small>${m.title.sub}</small></div></div>
    <div class="tb-phase"></div>
    <div class="tb-btns">
      <div class="seg"><button data-mode="2d" class="on">作战地图</button><button data-mode="3d">3D 沙盘</button></div>
      <button class="tb-home" title="回到全图（H）">⌂</button>
      <button class="tb-sound" title="声音">🔊</button>
      <button class="tb-credits" title="资料来源与许可">资料</button>
      <button class="tb-full" title="全屏">⛶</button>
    </div>`;
  const phaseEl = top.querySelector('.tb-phase') as HTMLElement;
  const btns = top.querySelector('.tb-btns') as HTMLElement;
  top.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => (b.onclick = () => store.set({ mode: b.dataset.mode as '2d' | '3d' })));
  const goHome = () => { manualCamera = true; director.cancelReturn(); store.set({ followUnit: false }); if (store.get().mode === '2d') map.home(); else sandbox?.flyTo(home3d, 1); };
  (top.querySelector('.tb-home') as HTMLElement).onclick = goHome;
  const soundBtn = top.querySelector('.tb-sound') as HTMLButtonElement;
  soundBtn.onclick = async () => { if (!audio.unlocked) await audio.init(); store.set({ muted: !store.get().muted }); };
  (top.querySelector('.tb-credits') as HTMLElement).onclick = () => showCredits(ui, db);
  // 音量面板（manifest.audio.volumePanel）：背景音乐与音效分开调节
  let volume: HTMLElement | null = null;
  if (m.audio.volumePanel) {
    const volumeBtn = document.createElement('button'); volumeBtn.className = 'tb-volume'; volumeBtn.textContent = '音量'; volumeBtn.title = '调节背景音乐与音效音量'; soundBtn.after(volumeBtn);
    volume = div('audio-panel paper hidden', ui);
    volume.innerHTML = `<b>作战室声音</b><label>背景音乐 <input aria-label="背景音乐音量" type="range" min="0" max="1" step="0.01" value="${store.get().musicVol}" data-vol="musicVol"/></label><label>音效 <input aria-label="音效音量" type="range" min="0" max="1" step="0.01" value="${store.get().sfxVol}" data-vol="sfxVol"/></label><small>${m.audio.mode === 'bed' ? '纯器乐背景 · 事件音效' : '配乐 · 战场氛围与事件音效'}</small>`;
    volumeBtn.onclick = () => volume!.classList.toggle('hidden');
    volume.querySelectorAll<HTMLInputElement>('input').forEach((input) => (input.oninput = () => { const v = Number(input.value); store.set(input.dataset.vol === 'musicVol' ? { musicVol: v } : { sfxVol: v }); }));
  }
  (top.querySelector('.tb-full') as HTMLElement).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => undefined));

  const sidebar = new Sidebar(ui, db);
  sidebar.extraLayers = c.plugins.flatMap((p) => p.layers ?? []);
  const timeline = m.ui.chapterNav === 'timeline' ? new ChapterTimeline(ui, db) : new Timeline(ui, db);
  const cards = div('cards', ui);
  const eventCard = new EventCard(cards, db);
  const unitCard = new UnitCard(cards, db);
  const banner = div('phase-banner', ui);
  const director = new Director(db, map, eventCard, fx, dyn);
  // 实时占位（manifest.map.liveInsets）：侧栏右缘 / 时间轴高度随界面测量
  if (m.map.liveInsets) {
    Object.defineProperty(map.insets, 'left', { get: () => (sidebar.el.classList.contains('collapsed') ? 30 : sidebar.el.getBoundingClientRect().right + 16) });
    Object.defineProperty(map.insets, 'bottom', { get: () => timeline.el.getBoundingClientRect().height + 18 });
  }
  /** 用户手动操作过镜头：切换 2D/3D 时保留当前视角，不再自动框选 */
  let manualCamera = false;
  map.onManual(() => { manualCamera = true; director.cancelReturn(); store.set({ followUnit: false }); });
  const unitZoom = (echelonRank: number) => { const z = m.map.unitZoom ?? [2.2, 3.4, 5]; return z[Math.max(0, Math.min(2, echelonRank))]; };

  // 章节导航（manifest.ui.chapterNav = 'sidebar'）；分阶段简报重建后重新挂载
  const mountChapterNav = () => {
    const nav = sidebar.el.querySelector('.chapter-nav');
    if (!nav) return;
    nav.innerHTML = PHASES.map((p) => `<button data-chapter="${p.id}" title="${p.sub}">${p.short}</button>`).join('');
    nav.querySelectorAll<HTMLButtonElement>('button').forEach((b) => (b.onclick = () => {
      const p = PHASES.find((x) => x.id === b.dataset.chapter)!;
      clock.release(); store.set({ t: p.from, playing: false, selectedEvent: null, selectedUnit: null, followUnit: false });
      eventCard.hide(); unitCard.hide();
      const center = p.center ?? focus, zoom = p.zoom ?? 1;
      if (store.get().mode === '2d') map.flyTo(center, zoom, 900); else sandbox?.flyTo(center, zoom);
    }));
  };
  mountChapterNav();
  const markChapter = (t: number) => sidebar.el.querySelectorAll<HTMLButtonElement>('.chapter-nav button').forEach((b) => b.classList.toggle('on', b.dataset.chapter === phaseAt(t).id));

  // 右侧卡片占位：运镜时把目标放在未被遮挡的区域中心
  Object.defineProperty(map.insets, 'right', {
    get: () => {
      const open = [...cards.children].filter((el) => !el.classList.contains('hidden'));
      if (!open.length) return 20;
      const left = Math.min(...open.map((el) => el.getBoundingClientRect().left));
      return Math.max(20, window.innerWidth - left + 16);
    },
  });

  // ---------- 交互 ----------
  const selectUnit = (id: string | null, fly = true) => {
    if (fly) manualCamera = false;
    store.set({ selectedUnit: id, followUnit: id ? store.get().followUnit : false });
    if (!id) return;
    const u = db.units.get(id);
    if (!u) return;
    const s = unitStateAt(id, db.units, store.get().t);
    if (fly && s) {
      const rel = unitZoom(ECHELON_RANK[u.echelon]);
      if (store.get().mode === '2d') map.flyTo(s.ll, Math.max(map.relK, rel), 1000);
      else sandbox?.flyTo(s.ll, rel);
    }
    sidebar.revealUnit(id);
  };
  units.onSelect = (id) => selectUnit(id, false);
  sidebar.onUnit = (id) => selectUnit(id, true);
  eventCard.onUnit = (id) => selectUnit(id, true);
  unitCard.onUnit = (id) => selectUnit(id, true);
  unitCard.onFollow = (id) => { store.set({ followUnit: true }); selectUnit(id, true); };
  unitCard.onClose = () => { if (store.get().selectedUnit) store.set({ selectedUnit: null, followUnit: false }); };
  eventCard.onClose = () => { store.set({ selectedEvent: null }); dyn.selectedEvent = null; dyn.setTime(store.get().t); clock.release(); };
  eventCard.onNav = (d) => timeline.stepEvent(d);
  const openEvent = (e: REvent) => { manualCamera = false; clock.release(); store.set({ t: e.h, playing: false }); director.present(e, false); };
  timeline.onEventPick = openEvent;
  sidebar.onEvent = (id) => { const e = db.events.find((x) => x.id === id); if (e) { director.cancel(); store.set({ playing: false }); clock.seek(e.h); director.present(e, false); } };
  // 跳转式时间轴广播的 campaign-seek：清空卡片与导演队列
  window.addEventListener('campaign-seek', () => { director.cancel(); eventCard.hide(); unitCard.hide(); store.set({ selectedUnit: null, selectedEvent: null, followUnit: false }); });

  // 战区视角按钮（manifest.map.regions）
  if (m.map.regions?.length) {
    const regions = div('region-nav paper', ui);
    regions.setAttribute('aria-label', '战区视角');
    regions.innerHTML = `<span>战区</span>${m.map.regions.map((r, i) => `<button data-region="${r.id}" class="${i === 0 ? 'on' : ''}">${r.label}</button>`).join('')}`;
    regions.querySelectorAll<HTMLButtonElement>('[data-region]').forEach((btn) => (btn.onclick = () => {
      const r = m.map.regions!.find((x) => x.id === btn.dataset.region)!;
      store.set({ followUnit: false });
      if (store.get().mode === '2d') { if (r.zoom <= 1) map.home(); else map.flyTo(r.center, r.zoom, 950); }
      else sandbox?.flyTo(r.center, r.zoom);
      regions.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === btn));
    }));
  }
  // 右下角读图条（manifest.map.mapKey）
  if (m.map.mapKey) div('map-key paper', ui).innerHTML = m.map.mapKey;
  if (timeline instanceof ChapterTimeline) timeline.onChapter = (p) => {
    director.cancel();
    eventCard.hide(); unitCard.hide();
    store.set({ selectedEvent: null, selectedUnit: null, followUnit: false });
    const center = p.center ?? focus, zoom = p.zoom ?? 1;
    if (store.get().mode === '2d') map.flyTo(center, window.innerWidth < 760 ? Math.min(zoom, m.map.mobileZoomCap ?? 4) : zoom, 900);
    else ensureSandbox().then((sb) => sb.flyTo(center, zoom));
  };
  dyn.onEventClick = openEvent;
  mapEl.addEventListener('click', () => { if (store.get().selectedUnit) selectUnit(null); });

  // ---------- 场几何 ----------
  let lastReq = -1e9;
  const requestField = (t: number, force = false) => {
    if (!force && Math.abs(t - lastReq) < 0.15) return;
    lastReq = t;
    field.request(t, store.get().mode === '3d');
  };
  let geomCount = 0;
  field.onGeom((g) => { dyn.setGeometry(g); if (g.fA) sandbox?.setFields(g); geomCount++; });
  field.whenReady().then(() => {
    st.buildHex(field.masks);
    st.groups.hex.style.display = store.get().layers.hex ? '' : 'none';
    requestField(store.get().t, true);
    field.warm();
  });

  map.onView((v, zooming) => {
    st.update(v);
    dyn.updateView(v, zooming);
    units.updateView(v);
    map.root.classList.toggle('is-zooming', zooming);
  });

  // ---------- 3D 沙盘（懒加载；失败时退回 2D） ----------
  let sandbox: Sandbox | null = null;
  let sandboxLoading: Promise<Sandbox> | null = null;
  const ensureSandbox = () => {
    if (!sandboxLoading) sandboxLoading = import('../three/sandbox/Sandbox').then((mod) => {
      sandbox = mod.createSandbox(sandboxEl, db, m.map.liveInsets ? () => map.insets : undefined) as Sandbox;
      director.onEvent3D = (e) => sandbox!.flyTo(e.ll, director.zoomFor(e));
      if (m.director.camera === 'frame') director.onCamera3D = (frame, ms) => sandbox!.flyToFrame(frame, ms);
      sandbox.onManual(() => { manualCamera = true; director.cancelReturn(); store.set({ followUnit: false }); });
      return sandbox;
    });
    return sandboxLoading;
  };

  /** 2D/3D 切换后的镜头：选中部队 → 当前事件框选 → 沿用上一视图的焦点（frame 运镜模式） */
  const syncCamera = (mode: '2d' | '3d', previous?: CameraFocus) => {
    const s = store.get();
    if (!manualCamera && s.selectedUnit) {
      const u = db.units.get(s.selectedUnit), state = unitStateAt(s.selectedUnit, db.units, s.t);
      if (u && state) { const rel = unitZoom(ECHELON_RANK[u.echelon]); if (mode === '2d') map.flyTo(state.ll, rel, 0); else sandbox?.flyTo(state.ll, rel, 0); return; }
    }
    if (!manualCamera && s.selectedEvent) {
      const e = db.events.find((x) => x.id === s.selectedEvent);
      if (e) { const frame = director.frameFor(e); if (mode === '2d') map.flyToFrame(frame, 0); else sandbox?.flyToFrame(frame, 0); return; }
    }
    if (previous) { if (mode === '2d') map.flyTo(previous.ll, previous.relZoom, 0); else sandbox?.flyTo(previous.ll, previous.relZoom, 0); }
  };
  const frameCamera = m.director.camera === 'frame';
  let lastMode: '2d' | '3d' = '2d';

  // ---------- 插件 ----------
  const hooks: PluginHooks[] = [];
  for (const p of c.plugins) {
    const h = await p.setup({ manifest: m, db, store, clock, audio, map, director, ui: { root: ui, topbarButtons: btns, briefPane: sidebar.briefPane } });
    if (h) hooks.push(h);
  }
  const briefOwner = hooks.find((h) => h.replaceBrief);
  if (briefOwner) sidebar.briefOverride = (pane) => briefOwner.replaceBrief!(pane);
  const statusOwner = hooks.find((h) => h.sidebarStatus);
  if (statusOwner) sidebar.statusOverride = (t, el) => statusOwner.sidebarStatus!(t, el);
  if (briefOwner || statusOwner) sidebar.rebuildBrief();
  sidebar.briefRebuilt = (pane) => { mountChapterNav(); markChapter(store.get().t); for (const h of hooks) h.sidebarBrief?.(pane); };
  for (const h of hooks) {
    h.topbar?.(btns);
    h.sidebarBrief?.(sidebar.briefPane);
    if (h.eventCardExtra) eventCardExtras.push(h.eventCardExtra);
    if (h.onPresent) director.presentHooks.push(h.onPresent);
    if (h.onCancel) director.cancelHooks.push(h.onCancel);
  }
  sidebar.start();

  // ---------- 状态响应 ----------
  let lastPhase = '';
  store.on((s, ch) => {
    if (ch.has('selectedEvent') && s.selectedEvent) manualCamera = false;
    if (ch.has('musicVol')) audio.setMusicVol(s.musicVol);
    if (ch.has('sfxVol')) audio.setSfxVol(s.sfxVol);
    if (ch.has('t')) {
      dyn.setTime(s.t);
      units.setTime(s.t);
      requestField(s.t);
      if (s.selectedUnit) dyn.showTrack(db.units.get(s.selectedUnit) ?? null, s.t);
      unitCard.updateTime(s.t);
      sandbox?.setTime(s.t);
      const p = phaseAt(s.t);
      markChapter(s.t);
      if (p.name !== lastPhase) {
        const first = lastPhase === '';
        lastPhase = p.name;
        phaseEl.innerHTML = `<b>${p.name}</b>`;
        if (!first && s.playing) showBanner(p.name, p.sub);
      }
      for (const h of hooks) h.onTime?.(s.t);
    }
    if (ch.has('playing')) for (const h of hooks) h.onPlaying?.(s.playing);
    if (ch.has('selectedUnit')) {
      units.selected = s.selectedUnit;
      units.setTime(s.t);
      sandbox?.select(s.selectedUnit);
      const u = s.selectedUnit ? db.units.get(s.selectedUnit) ?? null : null;
      dyn.showTrack(u, s.t);
      if (u) unitCard.show(u, s.t); else if (unitCard.current) unitCard.hide();
    }
    if (ch.has('layers')) {
      const L = s.layers;
      dyn.setVisible('control', L.control); dyn.setVisible('front', L.front); dyn.setVisible('routes', L.routes);
      dyn.setVisible('routesFull', L.routesFull); dyn.setVisible('pockets', L.pockets); dyn.setVisible('demarcation', L.demarcation);
      dyn.setVisible('events', L.events);
      units.setVisible(L.units);
      st.setVisible('cities', L.cities); st.setVisible('rivers', L.rivers); st.setVisible('forest', L.forest);
      st.groups.hex.style.display = L.hex ? '' : 'none';
      for (const layer of st.overlayGroups.keys()) st.setOverlayVisible(layer, L[layer] !== false);
      map.terrainOpacity = L.terrain ? 1 : 0.35;
      map.schedule();
    }
    if (ch.has('muted')) {
      audio.setMuted(s.muted); soundBtn.textContent = s.muted ? '🔇' : '🔊';
      for (const h of hooks) h.onMute?.(s.muted);
    }
    if (ch.has('mode')) {
      const previous = frameCamera ? (lastMode === '3d' ? sandbox?.cameraFocus() : map.cameraFocus) : undefined;
      lastMode = s.mode;
      if (frameCamera) { map.cancelFlight(); sandbox?.cancelFlight(); }
      top.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === s.mode));
      if (s.mode === '3d') {
        mapEl.classList.add('hidden'); sandboxEl.classList.remove('hidden');
        document.body.classList.add('mode-3d');
        ensureSandbox()
          .then((sb) => {
            if (store.get().mode !== '3d') return;
            sb.show(); sb.setTime(store.get().t);
            const p = phaseAt(store.get().t);
            if (frameCamera) { sb.select(store.get().selectedUnit); syncCamera('3d', previous); }
            else if (m.ui.sandboxPhaseFocus && p.center) sb.flyTo(p.center, Math.min(p.zoom ?? 1, 4.8));
            requestField(store.get().t, true);
          })
          .catch((err) => { console.error('3D 沙盘加载失败', err); store.set({ mode: '2d' }); });
      } else {
        sandbox?.hide(); sandboxEl.classList.add('hidden'); mapEl.classList.remove('hidden');
        document.body.classList.remove('mode-3d');
        map.resize();
        if (frameCamera) syncCamera('2d', previous);
      }
    }
  });

  function showBanner(title: string, sub: string) {
    banner.innerHTML = `<div class="pb-inner"><div class="pb-t">${title}</div><div class="pb-s">${sub}</div></div>`;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    audio.play('stamp', { volume: 0.8 });
  }

  // ---------- 每帧：特效、跟随、战斗闪光 ----------
  const battleSfx = m.audio.battleSfx ?? ['artillery', 'mg'];
  let battleAcc = 0;
  clock.onTick((dt, now) => {
    const s = store.get();
    director.tick();
    if (s.mode !== '2d') return;
    if (s.playing && !clock.holding) {
      battleAcc += dt * s.speed;
      if (battleAcc > 700) {
        battleAcc = 0;
        const engaged = units.shownItems.filter((it) => it.s.status === 'engaged' || it.s.status === 'encircled');
        for (const it of engaged.slice(0, 10)) {
          if (Math.random() > 0.55) continue;
          const [wx, wy] = project(it.s.ll);
          fx.battle(wx, wy, 60, 2);
        }
        if (engaged.length && Math.random() < 0.35) audio.play(battleSfx.length > 1 && Math.random() >= 0.6 ? battleSfx[1] : battleSfx[0], { volume: 0.18, throttleMs: 2500 });
      }
    }
    fx.draw(now);
    if (s.followUnit && s.selectedUnit && !map.isAnimating) {
      const st2 = unitStateAt(s.selectedUnit, db.units, s.t);
      if (st2) {
        const [sx, sy] = map.llToScreen(st2.ll);
        const cx = map.insets.left + (map.width - map.insets.left - map.insets.right) / 2;
        const cy = map.insets.top + (map.height - map.insets.top - map.insets.bottom) / 2;
        if (Math.hypot(sx - cx, sy - cy) > 40) {
          const [wx, wy] = project(st2.ll);
          const [cwx, cwy] = map.toWorld(cx, cy);
          map.flyToWorld(cwx + (wx - cwx) * 0.08, cwy + (wy - cwy) * 0.08, map.relK, 0);
        }
      }
    }
  });

  // ---------- 键盘 ----------
  window.addEventListener('keydown', (ev) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((ev.target as HTMLElement).tagName)) return;
    const s = store.get();
    if (ev.code === 'Space') { ev.preventDefault(); timeline.togglePlay(); }
    else if (ev.key === 'ArrowRight') timeline.stepEvent(1);
    else if (ev.key === 'ArrowLeft') timeline.stepEvent(-1);
    else if (ev.key === '.') clock.seek(s.t + 6);
    else if (ev.key === ',') clock.seek(s.t - 6);
    else if (ev.key.toLowerCase() === 'h') goHome();
    else if (ev.key.toLowerCase() === 'm') store.set({ mode: s.mode === '2d' ? '3d' : '2d' });
    else if (ev.key === 'Escape') {
      const modal = ui.querySelector('.modal');
      if (modal) modal.remove();
      else if (volume && !volume.classList.contains('hidden')) volume.classList.add('hidden');
      else if (unitCard.current) unitCard.hide(); else if (eventCard.current) eventCard.hide();
    }
  });
  const sidebarInset = () => (sidebar.el.classList.contains('collapsed') ? 30
    : typeof m.map.sidebarInset === 'number' ? m.map.sidebarInset : sidebar.el.getBoundingClientRect().width + 20);
  window.addEventListener('sidebar-toggle', () => {
    if (!m.map.liveInsets) map.insets.left = sidebarInset();
    map.resize();
  });

  // ---------- 启动 ----------
  phaseEl.innerHTML = `<b>${phaseAt(store.get().t).name}</b>`;
  markChapter(store.get().t);
  const params = new URLSearchParams(location.search);
  const tParam = params.get('t');
  // ?t=YYYY-MM-DDTHH:mm 直接跳到指定时刻（夹在可播放区间内；格式错误时忽略）
  store.set({ t: tParam && isIso(tParam) ? Math.max(T_START, Math.min(T_END, isoToHours(tParam))) : T_START });
  if (!m.map.liveInsets) map.insets.left = sidebarInset();
  map.resize();
  if (!(timeline instanceof ChapterTimeline)) map.home(0);
  // 章节式时间轴更高：运镜中心按时间轴高度留白（全图缩放仍按初次适配，窗口尺寸变化时再重新适配）
  if (timeline instanceof ChapterTimeline) {
    const fitInsets = () => { map.insets.top = window.innerWidth < 760 ? 104 : 64; map.insets.bottom = timeline.el.getBoundingClientRect().height + 26; };
    fitInsets();
    window.addEventListener('resize', () => { fitInsets(); map.resize(); });
  }
  store.setLayer('units', true);
  dyn.setTime(store.get().t);
  units.setTime(store.get().t);
  for (const layer of st.overlayGroups.keys()) st.setOverlayVisible(layer, store.get().layers[layer] !== false);
  st.update(map.view);
  if (m.map.initialView) map.flyTo(m.map.initialView.center, m.map.initialView.zoom, 0);
  clock.start();

  const enter = async (tour: boolean) => {
    await audio.init();
    store.set({ started: true, director: tour });
    audio.sting();
    if (tour && m.ui.tourOpensFirstEvent && db.events[0]) window.setTimeout(() => director.present(db.events[0], true), 1800);
    window.setTimeout(() => {
      if (m.audio.introMusic) audio.playMusic(m.audio.introMusic, 4000);
      audio.startAmbience();
      director.updateMusic(store.get().t);
    }, 1500);
    if (tour) {
      window.setTimeout(() => {
        showBanner(PHASES[0].name, PHASES[0].sub);
        store.set({ playing: true });
      }, 1800);
    }
  };
  if (params.has('nointro')) store.set({ started: true, director: false });
  else showIntro(ui, db, enter);

  // ---------- 测试钩子（parity / QA 脚本使用） ----------
  const w = window as unknown as Record<string, unknown>;
  w.__app = {
    campaign: m.id,
    setTime: (iso: string) => store.set({ t: isoToHours(iso), playing: false }),
    setZoom: (rel: number, lon?: number, lat?: number) => (lon != null && lat != null ? map.flyTo([lon, lat], rel, 0) : rel === 1 ? map.home(0) : map.flyTo(focus, rel, 0)),
    setMode: (mode: '2d' | '3d') => store.set({ mode }),
    select: (id: string | null) => selectUnit(id, false),
    openEvent: (id: string) => { const e = db.events.find((x) => x.id === id); if (e) openEvent(e); },
    stats: () => ({ units: units.stats, lod: units.level, relK: map.relK, geomCount, t: store.get().t, coverage: map.coverage(), sandbox: sandbox?.stats() ?? null }),
    store,
    db,
  };
  field.whenReady().then(() => { w.__APP_READY__ = true; });
}
