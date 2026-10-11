import './styles/main.css';
import type { Topology } from 'topojson-specification';
import { getDB, type REvent } from './data/db';
import { store, T_START, PHASES, phaseAt } from './app/store';
import { mountNarration } from './ui/narration';
import { clock } from './app/clock';
import { Director } from './app/director';
import { MapView } from './map2d/MapView';
import { StaticLayers } from './map2d/staticLayers';
import { DynamicLayers } from './map2d/dynamicLayers';
import { UnitsLayer } from './map2d/units';
import { FxLayer } from './map2d/fx';
import { FieldClient, type GeomResult } from './geo/field/client';
import { project } from './geo/frame';
import { unitStateAt } from './model/core';
import { Timeline } from './ui/timeline';
import { Sidebar } from './ui/sidebar';
import { EventCard, loadPhotoIndex } from './ui/eventCard';
import { UnitCard } from './ui/unitCard';
import { showIntro } from './ui/intro';
import { showCredits } from './ui/credits';
import { audio } from './audio/audio';
import { isoToHours } from './schema';

interface Sandbox {
  show(): void; hide(): void; setTime(t: number): void; setFields(g: GeomResult): void;
  flyTo(ll: [number, number], rel: number): void; select(id: string | null): void; resize(): void; stats(): Record<string, unknown>;
}

const div = (cls: string, parent: HTMLElement) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };

async function boot() {
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'fonts/fonts.css';
  document.head.appendChild(fontLink);
  const db = getDB();
  const app = document.getElementById('app')!;
  const mapEl = div('map', app);
  const sandboxEl = div('sandbox hidden', app);
  const ui = div('ui', app);
  const map = new MapView(mapEl);
  const photosP = loadPhotoIndex();
  const [topo, contextTopo] = await Promise.all([
    fetch('geo/vectors.topo.json').then((r) => r.json() as Promise<Topology>),
    fetch('geo/context.topo.json').then((r) => r.json() as Promise<Topology>),
    map.loadTiles('tiles/base/meta.json', 'tiles/base'),
    photosP,
  ]);
  const st = new StaticLayers(map, topo, db, contextTopo);
  const dyn = new DynamicLayers(map, st, db);
  const units = new UnitsLayer(map, db);
  const fx = new FxLayer(map);
  const field = new FieldClient(db.keyframes, 'geo/field_masks.bin');

  // ---------- 顶栏 ----------
  const top = div('topbar', ui);
  top.innerHTML = `
    <div class="tb-title"><span class="tb-mark">1941</span><div><b>克里特岛战役</b><small>水星行动 · 战旗推演</small></div></div>
    <div class="tb-phase"></div>
    <div class="tb-btns">
      <div class="seg"><button data-mode="2d" class="on">作战地图</button><button data-mode="3d">3D 沙盘</button></div>
      <button class="tb-home" title="回到全图（H）">⌂</button>
      <button class="tb-sound" title="声音">🔊</button>
      <button class="tb-credits" title="资料来源与许可">资料</button>
      <button class="tb-full" title="全屏">⛶</button>
    </div>`;
  const phaseEl = top.querySelector('.tb-phase') as HTMLElement;
  top.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => (b.onclick = () => store.set({ mode: b.dataset.mode as '2d' | '3d' })));
  (top.querySelector('.tb-home') as HTMLElement).onclick = () => (store.get().mode === '2d' ? map.home() : sandbox?.flyTo([24.62, 35.23], 1));
  const soundBtn = top.querySelector('.tb-sound') as HTMLButtonElement;
  soundBtn.onclick = () => store.set({ muted: !store.get().muted });
  (top.querySelector('.tb-credits') as HTMLElement).onclick = () => showCredits(ui, db);
  (top.querySelector('.tb-full') as HTMLElement).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => undefined));

  const sidebar = new Sidebar(ui, db);
  const timeline = new Timeline(ui, db);
  const chapterNav = sidebar.el.querySelector('.chapter-nav')!;
  chapterNav.innerHTML = PHASES.map(p => `<button data-chapter="${p.id}" title="${p.sub}">${p.short}</button>`).join('');
  chapterNav.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => {
    const p = PHASES.find(x => x.id === b.dataset.chapter)!;
    clock.release(); store.set({ t: p.from, playing: false, selectedEvent: null, selectedUnit: null, followUnit: false });
    eventCard.hide(); unitCard.hide();
    if (store.get().mode === '2d') map.flyTo(p.center, p.zoom, 900); else sandbox?.flyTo(p.center, p.zoom);
  });
  mountNarration(sidebar.el.querySelector('[data-p="brief"]') as HTMLElement).catch(() => {});
  const cards = div('cards', ui);
  const eventCard = new EventCard(cards, db);
  const unitCard = new UnitCard(cards, db);
  const banner = div('phase-banner', ui);
  const director = new Director(db, map, eventCard, fx, dyn);
  // 右侧卡片占位：运镜时把目标放在未被遮挡的区域中心
  Object.defineProperty(map.insets, 'right', {
    get: () => {
      const open = [...cards.children].filter((c) => !c.classList.contains('hidden'));
      if (!open.length) return 20;
      const left = Math.min(...open.map((c) => c.getBoundingClientRect().left));
      return Math.max(20, window.innerWidth - left + 16);
    },
  });

  // ---------- 交互 ----------
  const selectUnit = (id: string | null, fly = true) => {
    store.set({ selectedUnit: id, followUnit: id ? store.get().followUnit : false });
    if (!id) return;
    const u = db.units.get(id)!;
    const s = unitStateAt(id, db.units, store.get().t);
    if (fly && s) {
      const rel = u.echelon === 'army' ? 2.2 : u.echelon === 'corps' ? 3.4 : 5;
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
  const openEvent = (e: REvent) => { clock.release(); store.set({ t: e.h, playing: false }); director.present(e, false); };
  timeline.onEventPick = openEvent;
  dyn.onEventClick = openEvent;
  mapEl.addEventListener('click', () => { if (store.get().selectedUnit) selectUnit(null); });

  // ---------- 场几何 ----------
  let lastReq = -1e9;
  const requestField = (t: number, force = false) => {
    if (!force && Math.abs(t - lastReq) < 0.15) return;
    lastReq = t;
    field.request(t, store.get().mode === '3d');
  };
  field.onGeom((g) => { dyn.setGeometry(g); if (g.fDE) sandbox?.setFields(g); geomCount++; });
  let geomCount = 0;
  field.whenReady().then(() => { st.buildHex(field.masks); requestField(store.get().t, true); field.warm(); });

  map.onView((v, zooming) => {
    st.update(v);
    dyn.updateView(v, zooming);
    units.updateView(v);
    map.root.classList.toggle('is-zooming', zooming);
  });

  // ---------- 3D 沙盘（懒加载） ----------
  let sandbox: Sandbox | null = null;
  let sandboxLoading: Promise<Sandbox> | null = null;
  const ensureSandbox = () => {
    if (!sandboxLoading) sandboxLoading = import('./three/sandbox/Sandbox').then((m) => {
      sandbox = m.createSandbox(sandboxEl, db) as Sandbox;
      director.onEvent3D = (e) => sandbox!.flyTo(e.ll, director.zoomFor(e));
      return sandbox;
    });
    return sandboxLoading;
  };

  // ---------- 状态响应 ----------
  let lastPhase = '';
  store.on((s, ch) => {
    if (ch.has('t')) {
      dyn.setTime(s.t);
      units.setTime(s.t);
      requestField(s.t);
      if (s.selectedUnit) dyn.showTrack(db.units.get(s.selectedUnit) ?? null, s.t);
      sandbox?.setTime(s.t);
      const p = phaseAt(s.t);
      chapterNav.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.classList.toggle('on',b.dataset.chapter===p.id));
      if (p.name !== lastPhase) {
        const first = lastPhase === '';
        lastPhase = p.name;
        phaseEl.innerHTML = `<b>${p.name}</b>`;
        if (!first && s.playing) showBanner(p.name, p.sub);
      }
    }
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
      map.terrainOpacity = L.terrain ? 1 : 0.35;
      map.schedule();
    }
    if (ch.has('muted')) { audio.setMuted(s.muted); soundBtn.textContent = s.muted ? '🔇' : '🔊'; }
    if (ch.has('mode')) {
      top.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === s.mode));
      if (s.mode === '3d') {
        mapEl.classList.add('hidden'); sandboxEl.classList.remove('hidden');
        document.body.classList.add('mode-3d');
        ensureSandbox().then((sb) => { sb.show(); sb.setTime(store.get().t); requestField(store.get().t, true); });
      } else {
        sandbox?.hide(); sandboxEl.classList.add('hidden'); mapEl.classList.remove('hidden');
        document.body.classList.remove('mode-3d');
        map.resize();
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
        if (engaged.length && Math.random() < 0.35) audio.play(Math.random() < 0.6 ? 'artillery' : 'mg', { volume: 0.18, throttleMs: 2500 });
      }
    }
    if (fx.busy) fx.draw(now); else fx.draw(now);
    if (s.followUnit && s.selectedUnit) {
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
    if ((ev.target as HTMLElement).tagName === 'INPUT') return;
    const s = store.get();
    if (ev.code === 'Space') { ev.preventDefault(); timeline.togglePlay(); }
    else if (ev.key === 'ArrowRight') timeline.stepEvent(1);
    else if (ev.key === 'ArrowLeft') timeline.stepEvent(-1);
    else if (ev.key === '.') clock.seek(s.t + 6);
    else if (ev.key === ',') clock.seek(s.t - 6);
    else if (ev.key.toLowerCase() === 'h') { if (s.mode === '2d') map.home(); else sandbox?.flyTo([24.62,35.23],1); }
    else if (ev.key.toLowerCase() === 'm') store.set({ mode: s.mode === '2d' ? '3d' : '2d' });
    else if (ev.key === 'Escape') { if (unitCard.current) unitCard.hide(); else if (eventCard.current) eventCard.hide(); }
  });
  window.addEventListener('sidebar-toggle', () => {
    map.insets.left = sidebar.el.classList.contains('collapsed') ? 30 : 340;
    map.resize();
  });

  // ---------- 启动 ----------
  phaseEl.innerHTML = `<b>${phaseAt(store.get().t).name}</b>`;
  chapterNav.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.classList.toggle('on',b.dataset.chapter===phaseAt(store.get().t).id));
  const params = new URLSearchParams(location.search);
  const tParam = params.get('t');
  store.set({ t: tParam ? isoToHours(tParam) : T_START });
  map.insets.left = sidebar.el.classList.contains('collapsed') ? 30 : 340;
  map.resize();
  store.setLayer('units', true);
  dyn.setTime(store.get().t);
  units.setTime(store.get().t);
  st.update(map.view);
  clock.start();

  const enter = async (tour: boolean) => {
    await audio.init();
    store.set({ started: true, director: tour });
    audio.play('fanfare');
    window.setTimeout(() => { audio.playMusic('advance', 4000); audio.startAmbience(); director.updateMusic(store.get().t); }, 1500);
    if (tour) {
      window.setTimeout(() => {
        showBanner(PHASES[0].name, PHASES[0].sub);
        store.set({ playing: true });
      }, 1800);
    }
  };
  if (params.has('nointro')) store.set({ started: true, director: false });
  else showIntro(ui, enter);

  // ---------- 测试钩子 ----------
  const w = window as unknown as Record<string, unknown>;
  w.__app = {
    setTime: (iso: string) => store.set({ t: isoToHours(iso), playing: false }),
    setZoom: (rel: number, lon?: number, lat?: number) => (lon != null && lat != null ? map.flyTo([lon, lat], rel, 0) : rel === 1 ? map.home(0) : map.flyTo([24.62, 35.23], rel, 0)),
    setMode: (m: '2d' | '3d') => store.set({ mode: m }),
    select: (id: string | null) => selectUnit(id, false),
    openEvent: (id: string) => { const e = db.events.find((x) => x.id === id); if (e) openEvent(e); },
    stats: () => ({ units: units.stats, lod: units.level, relK: map.relK, geomCount, t: store.get().t, coverage: map.coverage(), sandbox: sandbox?.stats() ?? null }),
    store,
  };
  field.whenReady().then(() => { (window as unknown as Record<string, unknown>).__APP_READY__ = true; });
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<div class="fatal">加载失败：${String(e?.message ?? e)}</div>`);
});
