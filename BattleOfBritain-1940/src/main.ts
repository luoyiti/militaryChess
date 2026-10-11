import './styles/main.css';
import type { Topology } from 'topojson-specification';
import { getDB, type REvent } from './data/db';
import { store, T_START, T_END, PHASES, phaseAt } from './app/store';
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
import { isoToHours, ISO, ECHELON_RANK } from './schema';
import { SCENARIO } from './app/scenario';
import type { CameraFrame, CameraFocus } from './app/camera';

interface Sandbox {
  show(): void; hide(): void; setTime(t: number): void; setFields(g: GeomResult): void;
  flyTo(ll: [number, number], rel: number, ms?:number): void; flyToFrame(frame:CameraFrame,ms?:number):void; cameraFocus():CameraFocus; cancelFlight():void; onManual(fn:()=>void):void; select(id: string | null): void; resize(): void; stats(): Record<string, unknown>;
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
  const [topo] = await Promise.all([
    fetch('geo/vectors.topo.json').then((r) => r.json() as Promise<Topology>),
    map.loadTiles('tiles/base/meta.json', 'tiles/base'),
    photosP,
  ]);
  const st = new StaticLayers(map, topo, db);
  const dyn = new DynamicLayers(map, st, db);
  const units = new UnitsLayer(map, db);
  const fx = new FxLayer(map);
  const field = new FieldClient(db.keyframes, 'geo/field_masks.bin');

  // ---------- 顶栏 ----------
  const top = div('topbar', ui);
  top.innerHTML = `
    <div class="tb-title"><span class="tb-mark">1940</span><div><b>不列颠空战</b><small>英伦上空的决战 · 战旗推演</small></div></div>
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
  (top.querySelector('.tb-home') as HTMLElement).onclick = () => {manualCamera=true;director.cancelReturn();store.set({followUnit:false});if(store.get().mode==='2d')map.home();else sandbox?.flyTo([-1.25,54.25],1);};
  const soundBtn = top.querySelector('.tb-sound') as HTMLButtonElement;
  soundBtn.onclick = async () => { await audio.init(); audio.startAmbience(); store.set({ muted: !store.get().muted }); };
  const volumeBtn=document.createElement('button'); volumeBtn.className='tb-volume'; volumeBtn.textContent='音量'; volumeBtn.title='调节背景音乐与音效音量'; soundBtn.after(volumeBtn);
  const volume=div('audio-panel paper hidden',ui); volume.innerHTML=`<b>作战室声音</b><label>背景音乐 <input aria-label="背景音乐音量" type="range" min="0" max="1" step="0.01" value="${store.get().musicVol}" data-vol="musicVol"/></label><label>音效 <input aria-label="音效音量" type="range" min="0" max="1" step="0.01" value="${store.get().sfxVol}" data-vol="sfxVol"/></label><small>纯器乐背景 · 事件音效</small>`;
  volumeBtn.onclick=()=>volume.classList.toggle('hidden');
  volume.querySelectorAll<HTMLInputElement>('input').forEach((input)=>input.oninput=()=>{const v=Number(input.value);store.set(input.dataset.vol==='musicVol'?{musicVol:v}:{sfxVol:v});});
  (top.querySelector('.tb-credits') as HTMLElement).onclick = () => showCredits(ui, db);
  (top.querySelector('.tb-full') as HTMLElement).onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => undefined));

  const sidebar = new Sidebar(ui, db);
  const timeline = new Timeline(ui, db);
  if(window.innerWidth<900){sidebar.el.classList.add('collapsed');(sidebar.el.querySelector('.sb-collapse') as HTMLElement).textContent='›';}
  Object.defineProperty(map.insets,'left',{get:()=>sidebar.el.classList.contains('collapsed')?30:sidebar.el.getBoundingClientRect().right+16});
  Object.defineProperty(map.insets,'bottom',{get:()=>timeline.el.getBoundingClientRect().height+18});
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
  let manualCamera=false;
  map.onManual(()=>{manualCamera=true;director.cancelReturn();store.set({followUnit:false});});
  const selectUnit = (id: string | null, fly = true) => {
    if(fly)manualCamera=false;
    store.set({ selectedUnit: id, followUnit: id ? store.get().followUnit : false });
    if (!id) return;
    const u = db.units.get(id)!;
    const s = unitStateAt(id, db.units, store.get().t);
    if (fly && s) {
      const rel = ECHELON_RANK[u.echelon]===0 ? 2.2 : ECHELON_RANK[u.echelon]===1 ? 3.4 : 5.8;
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
  const openEvent = (e: REvent) => { manualCamera=false;clock.release();store.set({playing:false});clock.seek(e.h);director.present(e,false); };
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
      sandbox = m.createSandbox(sandboxEl, db,()=>map.insets) as Sandbox;
      director.onCamera3D=(frame,ms)=>sandbox!.flyToFrame(frame,ms);
      sandbox.onManual(()=>{manualCamera=true;director.cancelReturn();store.set({followUnit:false});});
      return sandbox;
    });
    return sandboxLoading;
  };

  const syncCamera=(mode:'2d'|'3d',previous?:CameraFocus)=>{
    const s=store.get();
    if(!manualCamera&&s.selectedUnit){const u=db.units.get(s.selectedUnit),state=unitStateAt(s.selectedUnit,db.units,s.t);if(u&&state){const rel=ECHELON_RANK[u.echelon]===0?2.2:ECHELON_RANK[u.echelon]===1?3.4:5.8;if(mode==='2d')map.flyTo(state.ll,rel,0);else sandbox?.flyTo(state.ll,rel,0);return;}}
    if(!manualCamera&&s.selectedEvent){const e=db.events.find((e)=>e.id===s.selectedEvent);if(e){const frame=director.frameFor(e);if(mode==='2d')map.flyToFrame(frame,0);else sandbox?.flyToFrame(frame,0);return;}}
    if(previous){if(mode==='2d')map.flyTo(previous.ll,previous.relZoom,0);else sandbox?.flyTo(previous.ll,previous.relZoom,0);}
  };
  let lastMode:'2d'|'3d'='2d';
  // ---------- 状态响应 ----------
  let lastPhase = '';
  store.on((s, ch) => {
    if(ch.has('selectedEvent')&&s.selectedEvent)manualCamera=false;
    if (ch.has('t')) {
      dyn.setTime(s.t);
      units.setTime(s.t);
      requestField(s.t,!s.playing);
      if (s.selectedUnit) dyn.showTrack(db.units.get(s.selectedUnit) ?? null, s.t);
      sandbox?.setTime(s.t);
      unitCard.updateStatus(s.t);
      const p = phaseAt(s.t);
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
      st.groups.radar.style.display=L.radar?'':'none';
      units.setVisible(L.units);
      st.setVisible('cities', L.cities); st.setVisible('rivers', L.rivers); st.setVisible('forest', L.forest);
      st.groups.hex.style.display = L.hex ? '' : 'none';
      map.terrainOpacity = L.terrain ? 1 : 0.35;
      map.schedule();
    }
    if(ch.has('playing')&&!s.playing)requestField(s.t,true);
    if(ch.has('musicVol'))audio.setMusicVol(s.musicVol);
    if(ch.has('sfxVol'))audio.setSfxVol(s.sfxVol);
    if (ch.has('muted')) { audio.setMuted(s.muted); soundBtn.textContent = s.muted ? '🔇' : '🔊'; }
    if (ch.has('mode')) {
      const previous=lastMode==='3d'?sandbox?.cameraFocus():map.cameraFocus;lastMode=s.mode;map.cancelFlight();sandbox?.cancelFlight();
      top.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === s.mode));
      if (s.mode === '3d') {
        mapEl.classList.add('hidden'); sandboxEl.classList.remove('hidden');
        document.body.classList.add('mode-3d');
        ensureSandbox().then((sb)=>{if(store.get().mode!=='3d')return;sb.show();sb.setTime(store.get().t);sb.select(store.get().selectedUnit);syncCamera('3d',previous);requestField(store.get().t,true);});
      } else {
        sandbox?.hide(); sandboxEl.classList.add('hidden'); mapEl.classList.remove('hidden');
        document.body.classList.remove('mode-3d');
        map.resize();syncCamera('2d',previous);
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
        if (engaged.length && Math.random() < 0.35) audio.play('mg', { volume: 0.18, throttleMs: 2500 });
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
    if ((ev.target as HTMLElement).tagName === 'INPUT' && ev.key !== 'Escape') return;
    const s = store.get();
    if (ev.code === 'Space') { ev.preventDefault(); timeline.togglePlay(); }
    else if (ev.key === 'ArrowRight') timeline.stepEvent(1);
    else if (ev.key === 'ArrowLeft') timeline.stepEvent(-1);
    else if (ev.key === '.') clock.seek(s.t + 6);
    else if (ev.key === ',') clock.seek(s.t - 6);
    else if (ev.key.toLowerCase() === 'h') {manualCamera=true;director.cancelReturn();store.set({followUnit:false});if(s.mode==='2d')map.home();else sandbox?.flyTo([-1.25,54.25],1);}
    else if (ev.key.toLowerCase() === 'm') store.set({ mode: s.mode === '2d' ? '3d' : '2d' });
    else if (ev.key === 'Escape') { const modal=ui.querySelector('.modal'); if(modal)modal.remove(); else if(!volume.classList.contains('hidden'))volume.classList.add('hidden'); else if (unitCard.current) unitCard.hide(); else if (eventCard.current) eventCard.hide(); }
  });
  let wasNarrow=window.innerWidth<900;
  window.addEventListener('resize',()=>{const narrow=window.innerWidth<900;if(narrow&&!wasNarrow){sidebar.el.classList.add('collapsed');(sidebar.el.querySelector('.sb-collapse') as HTMLElement).textContent='›';map.resize();}wasNarrow=narrow;});
  window.addEventListener('sidebar-toggle', () => {
    // 面板尺寸由动态insets读取，收起后只触发重新适配。
    map.resize();
  });

  // ---------- 启动 ----------
  const params = new URLSearchParams(location.search);
  const tParam = params.get('t');
  store.set({ t: tParam && ISO.safeParse(tParam).success ? Math.max(T_START,Math.min(isoToHours(tParam),T_END)) : T_START });
  store.setLayer('units', true);
  dyn.setTime(store.get().t);
  units.setTime(store.get().t);
  st.update(map.view);
  map.flyTo(SCENARIO.focus,SCENARIO.focusZoom,0);
  clock.start();

  const enter = async (tour: boolean) => {
    await audio.init();
    store.set({ started: true, director: tour });
    audio.setMusicVol(store.get().musicVol); audio.setSfxVol(store.get().sfxVol);
    audio.play('paper',{volume:.15});
    window.setTimeout(() => { audio.startAmbience(); director.updateMusic(store.get().t); }, 600);
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
    setTime: (iso: string) => { clock.release();clock.seek(isoToHours(iso));store.set({ playing: false }); },
    setZoom: (rel: number, lon?: number, lat?: number) => (lon != null && lat != null ? map.flyTo([lon, lat], rel, 0) : rel === 1 ? map.home(0) : map.flyTo(SCENARIO.focus, rel, 0)),
    setMode: (m: '2d' | '3d') => store.set({ mode: m }),
    select: (id: string | null) => selectUnit(id, false),
    openEvent: (id: string) => { const e = db.events.find((x) => x.id === id); if (e) openEvent(e); },
    stateAt: (id:string) => unitStateAt(id,db.units,store.get().t),
    events: db.events.map((e)=>({id:e.id,at:e.at,title:e.title.zh,ll:e.ll})),
    stats: () => ({ units: units.stats, fx:fx.stats(), lod: units.level, relK: map.relK, geomCount, fieldH:field.last?.h, t: store.get().t, sandbox: sandbox?.stats() ?? null }),
    store,
  };
  field.whenReady().then(() => { (window as unknown as Record<string, unknown>).__APP_READY__ = true; });
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<div class="fatal">加载失败：${String(e?.message ?? e)}</div>`);
});
