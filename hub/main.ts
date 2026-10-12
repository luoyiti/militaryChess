/**
 * 作战总台入口：全屏世界地图（hub/map.ts）+ 浮动面板——顶栏与战区切换、卷宗面板（hub/dossier.ts）、
 * 电报纸带（hub/tape.ts）、图例与缩放按钮；进入 / 返回战役的转场见 hub/transition.ts。
 * 战役清单来自 virtual:campaign-catalog —— 新增 campaigns/<id>/campaign.json 后自动出现在地图上。
 */
import './hub.css';
import catalog from 'virtual:campaign-catalog';
import worldData from './world.json';
import type { Topology } from 'topojson-specification';
import { HubMap, type Insets } from './map';
import { Tape } from './tape';
import { Dossier } from './dossier';
import { sound } from './sound';
import { dayOf, yearOf } from './dates';
import { enterCampaign, saveHubView, savedHubView, takeReturn, pullBack, clearVeil } from './transition';
import { parseStatus, type CatalogEntry, type WorldData } from './types';

const world = worldData as unknown as WorldData;
const entries = (catalog as CatalogEntry[]).filter((c) => c.hub?.pin);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth < 760;
const y0 = yearOf(dayOf(world.window.start)), y1 = yearOf(dayOf(world.window.end));

document.body.classList.add('hub');
const root = document.getElementById('hub')!;
root.innerHTML = `
  <div class="stage" tabindex="-1"></div>
  <div class="paper-fx" aria-hidden="true"></div>
  <header class="hud-top">
    <div class="brand hud"><span class="brand-mark">${String(y0).slice(2)}<i>—</i>${String(y1).slice(2)}</span><div><b>作战总台</b><small>WAR ROOM · 第二次世界大战战役推演档案</small></div></div>
    <nav class="regions hud" aria-label="战区分区"></nav>
    <div class="hud-tools hud">
      <button class="tool sound" type="button"></button>
      <button class="tool about" type="button">关于</button>
    </div>
  </header>
  <div class="map-ctrl hud" role="group" aria-label="地图缩放">
    <button type="button" data-zoom="in" title="放大（+）" aria-label="放大">+</button>
    <button type="button" data-zoom="out" title="缩小（−）" aria-label="缩小">−</button>
    <button type="button" data-zoom="all" title="全部卷宗（0）" aria-label="显示全部卷宗">⌖</button>
  </div>
  <details class="map-legend hud"></details>`;
const stage = root.querySelector('.stage') as HTMLElement;
const hudTop = root.querySelector('.hud-top') as HTMLElement;

const soundBtn = root.querySelector('.tool.sound') as HTMLButtonElement;
const paintSound = () => { soundBtn.textContent = sound.enabled ? '音效 · 开' : '音效 · 关'; soundBtn.setAttribute('aria-pressed', String(sound.enabled)); };
paintSound();
soundBtn.onclick = () => { sound.toggle(); paintSound(); sound.play('ui_click', 0.4); };
addEventListener('pointerdown', () => sound.unlock(), { once: true });
addEventListener('keydown', () => sound.unlock(), { once: true });

const published = entries.filter((c) => c.status === 'published');
const params = new URLSearchParams(location.search);
const dParam = params.get('d');
const returning = takeReturn(entries);

async function boot() {
  const topo = (await fetch('hub/world1938.topo.json').then((r) => { if (!r.ok) throw new Error(`${r.status} hub/world1938.topo.json`); return r.json(); })) as Topology;
  const map = new HubMap(stage, topo, entries, world);
  const saved = savedHubView(map);
  const defaultDay = Math.max(...published.map((c) => dayOf(c.time.end)), dayOf(world.window.start));
  const initialDay = dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam) ? dayOf(dParam) : returning && saved ? saved.day : defaultDay;
  const tape = new Tape(root, entries, world, initialDay, reduced);
  const dossier = new Dossier(root, entries, world, (c) => map.regionOf(c));
  // 卷宗面板：记住用户的选择；没有记录时，宽度不足 1100px 默认收起，把地图让出来
  let pref: string | null = null;
  try { pref = localStorage.getItem('warroom:panel'); } catch { /* ignore */ }
  if (!narrow() && (pref === 'collapsed' || (!pref && innerWidth < 1100))) { dossier.setCollapsed(true); try { localStorage.removeItem('warroom:panel'); } catch { /* ignore */ } }
  document.body.classList.toggle('panel-collapsed', dossier.collapsed);

  // 地图上可用于取景的区域：扣除顶栏、纸带与卷宗面板
  const insets = (): Insets => {
    const H = innerHeight;
    const top = hudTop.getBoundingClientRect().bottom + 6;
    const bottom = H - tape.el.getBoundingClientRect().top + 6;
    const r = dossier.el.getBoundingClientRect();
    const left = narrow() || dossier.collapsed ? 16 : Math.max(16, r.right + 8);
    return { top, right: narrow() ? 8 : 20, bottom, left };
  };
  map.insets = insets;
  // 浮动面板的实际高度写进 CSS 变量（卷宗面板、缩放按钮与图例据此避开纸带和顶栏）
  new ResizeObserver(() => {
    root.style.setProperty('--tape-h', `${tape.el.offsetHeight}px`);
    root.style.setProperty('--top-h', `${hudTop.offsetHeight}px`);
  }).observe(tape.el);
  new ResizeObserver(() => root.style.setProperty('--top-h', `${hudTop.offsetHeight}px`)).observe(hudTop);
  buildLegend();

  // ---------- 战区分区 ----------
  const nav = root.querySelector('.regions') as HTMLElement;
  const count = (id: string) => entries.filter((c) => map.regionOf(c) === id).length;
  nav.innerHTML = `<button type="button" data-region="world">全球<small>${entries.length}</small></button>` +
    world.theatres.map((r) => `<button type="button" data-region="${r.id}" title="${r.en}">${r.zh}<small>${count(r.id)}</small></button>`).join('');
  const flyRegion = (id: string) => {
    const rect = id === 'world' ? map.allRect() : map.regionRect(id);
    if (rect) void map.flyTo(map.fitTransform(rect, { maxK: id === 'world' ? 2 : 4, pad: id === 'world' ? 16 : 28 }));
  };
  nav.querySelectorAll<HTMLButtonElement>('[data-region]').forEach((b) => (b.onclick = () => { flyRegion(b.dataset.region!); sound.play('ui_click', 0.3); }));
  const markRegion = () => { const cur = map.currentRegion(); nav.querySelectorAll<HTMLElement>('[data-region]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === cur))); };
  map.onView = (moving) => { if (!moving) markRegion(); };

  // ---------- 缩放按钮与键盘 ----------
  root.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) => (b.onclick = () => {
    const z = b.dataset.zoom;
    if (z === 'all') flyRegion('world');
    else { const ins = insets(); void map.zoomAround(z === 'in' ? 2 : 0.5, (ins.left + innerWidth - ins.right) / 2, (ins.top + innerHeight - ins.bottom) / 2); }
  }));

  let leaving = false;
  const showCampaign = (c: CatalogEntry) => {
    const changed = dossier.current?.id !== c.id;
    dossier.show(c);
    map.highlight(c.id);
    tape.highlight(c.id);
    if (changed) sound.play('paper', 0.22, 250);
    if (narrow()) dossier.toggleSheet(true);
  };
  const closeDossier = () => { dossier.showIndex(); map.highlight(null); tape.highlight(null); };
  const enter = async (c: CatalogEntry, nointro = false) => {
    if (c.status === 'planned' || !c.playable) { showCampaign(c); dossier.shake(); sound.play('stamp', 0.35); return; }
    if (leaving) return;
    leaving = true;
    sound.play('stamp', 0.6);
    tape.pause();
    map.highlight(c.id);
    saveHubView(map, c.id, tape.day);
    document.body.classList.add('leaving');
    await enterCampaign(map, c, c.href + (nointro ? '?nointro' : '?tour'), reduced);
  };
  // 浏览器后退到仍在往返缓存中的总台：撤掉幕布，拉远回离开时的视角
  window.addEventListener('pageshow', (ev: PageTransitionEvent) => {
    if (!ev.persisted) return;
    takeReturn(entries); // 记号已经用不上了（页面状态原样恢复）
    leaving = false;
    clearVeil();
    document.body.classList.remove('leaving');
    map.base.labelAlpha = 1;
    const s = savedHubView(map);
    void map.flyTo(s?.t ?? map.fitTransform(map.allRect(), { maxK: 2 }));
  });

  map.onHover = (c) => { if (c && !leaving) showCampaign(c); };
  map.onFocus = (c) => showCampaign(c);
  // 鼠标：悬停看卷宗、点击进入；触屏：先点开卷宗，再点一次进入
  map.onActivate = (c, viaTouch) => (!viaTouch || dossier.current?.id === c.id ? enter(c) : showCampaign(c));
  dossier.onEnter = (c, free) => enter(c, free);
  dossier.onPick = (c) => { showCampaign(c); map.ensureVisible(c); map.pins.get(c.id)?.el.focus({ preventScroll: true }); };
  dossier.onClose = closeDossier;
  dossier.onFilter = (n) => { const ids = n ? n.campaigns : null; map.setFilter(ids, n?.countries ?? []); tape.setFilter(ids); };
  dossier.onToggle = (collapsed) => { document.body.classList.toggle('panel-collapsed', collapsed); };
  tape.onChange = (day) => map.setDay(day);
  tape.onSpan = (c) => { tape.set(dayOf(c.time.start)); showCampaign(c); map.ensureVisible(c); };
  tape.onType = () => sound.play('typewriter', 0.12, 70);
  map.setDay(tape.day, false);

  // ---------- 初始镜头 ----------
  const region = params.get('region');
  // 全部卷宗放不下时（窗口较窄），先框住可以进入的战役
  const fitsAll = () => { const r = map.allRect(), ins = insets(); return (r[2] - r[0]) * map.minK <= innerWidth - ins.left - ins.right - 32; };
  const home = () => (region && map.regionRect(region) ? map.fitTransform(map.regionRect(region)!, { maxK: 4 })
    : map.fitTransform(fitsAll() ? map.allRect() : map.allRect(entries.filter((c) => c.playable)), { maxK: 2, pad: 16 }));
  if (returning) {
    document.body.classList.add('returning');
    if (saved?.selected) { const c = entries.find((x) => x.id === saved.selected); if (c) showCampaign(c); }
    requestAnimationFrame(() => document.body.classList.remove('returning'));
    void pullBack(map, returning, saved?.t ?? home(), reduced).then(markRegion);
  } else {
    void map.flyTo(home(), 0).then(markRegion);
    map.intro(reduced);
  }
  requestAnimationFrame(() => tape.keepCursorVisible()); // 窄屏纸带横向滚动到当前日期

  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    const t = ev.target as HTMLElement;
    if (t.closest('input, textarea')) return;
    if (ev.key === 'Escape') { if (!closeModal()) { closeDossier(); dossier.toggleSheet(false); } }
    else if (ev.key === ' ' && !t.closest('button, a, [role="button"], [role="slider"]')) { ev.preventDefault(); tape.isPlaying ? tape.pause() : tape.play(); }
    else if ((ev.key === '+' || ev.key === '=') && !ev.metaKey && !ev.ctrlKey) void map.zoomAround(2);
    else if ((ev.key === '-' || ev.key === '_') && !ev.metaKey && !ev.ctrlKey) void map.zoomAround(0.5);
    else if (ev.key === '0' && !ev.metaKey && !ev.ctrlKey) flyRegion('world');
  });
  (window as unknown as { __hub: unknown }).__hub = {
    map, tape, dossier, entries,
    setDay: (iso: string) => tape.set(dayOf(iso)),
    status: (id: string) => map.statusOf(id),
    region: (id: string) => flyRegion(id),
    enter: (id: string, free = false) => { const c = entries.find((x) => x.id === id); if (c) void enter(c, free); },
  };
}

function buildLegend() {
  const host = root.querySelector('.map-legend') as HTMLDetailsElement;
  host.open = innerWidth >= 1440 && innerHeight >= 880;
  const hexA = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const sw = (status: string) => {
    const { kind, bloc } = parseStatus(status);
    const c = bloc ? world.blocs[bloc].color : '#b3262e';
    const bg = kind === 'member' ? hexA(c, 0.42)
      : kind === 'aligned' ? `radial-gradient(circle, ${hexA(c, 0.75)} 1px, transparent 1.4px) 0 0 / 6px 6px, ${hexA(c, 0.14)}`
        : kind === 'occupied' ? `repeating-linear-gradient(135deg, ${hexA(c, 0.62)} 0 1.4px, transparent 1.4px 4.2px), ${hexA(c, 0.2)}`
          : `repeating-linear-gradient(45deg, rgba(179,38,46,.5) 0 1px, transparent 1px 5px), repeating-linear-gradient(135deg, rgba(179,38,46,.5) 0 1px, transparent 1px 5px), rgba(179,38,46,.14)`;
    return `<i class="sw"><b style="background:${bg}"></b></i>`;
  };
  const kinds = world.kinds;
  host.innerHTML = `
    <summary>图例</summary>
    <table class="lg-blocs"><thead><tr><th></th><th title="${kinds.member.desc}">交战国</th><th title="${kinds.aligned.desc}">附庸 / 合作</th><th title="${kinds.occupied.desc}">占领区</th></tr></thead><tbody>
    ${Object.entries(world.blocs).map(([id, b]) => `<tr><th>${b.zh}</th><td>${sw(id)}</td><td>${sw(`${id}-aligned`)}</td><td>${sw(`${id}-occupied`)}</td></tr>`).join('')}
    </tbody></table>
    <div class="lg-grid">
      <span title="${kinds.contested.desc}">${sw('contested')}${kinds.contested.zh}</span>
      <span title="${kinds.neutral.desc}"><i class="sw neutral"></i>${kinds.neutral.zh}</span>
      <span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="lg-theatre" d="M1 6H21"/></svg>战区</span>
      <span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="lg-split" d="M1 6H21"/></svg>分界线</span>
      <span><svg viewBox="0 0 22 12" aria-hidden="true"><circle class="lg-wax" cx="11" cy="6" r="5"/></svg>可进入</span>
      <span><svg viewBox="0 0 22 12" aria-hidden="true"><circle class="lg-wax sealed" cx="11" cy="6" r="5"/></svg>筹备中</span>
    </div>`;
}

// ---------- 关于 ----------
let modal: HTMLElement | null = null;
function closeModal() { if (!modal) return false; modal.remove(); modal = null; return true; }
(root.querySelector('.tool.about') as HTMLElement).onclick = () => {
  closeModal();
  modal = document.createElement('div');
  modal.className = 'hub-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '关于作战总台');
  const src = Object.values(world.sources).map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join('、');
  modal.innerHTML = `<div class="hub-modal-card">
    <button type="button" class="dz-close" aria-label="关闭">×</button>
    <h2>关于作战总台</h2>
    <p>所有战役共用同一套推演引擎：每个战役是 <code>campaigns/&lt;id&gt;/</code> 下的一个数据包（<code>campaign.json</code> + 标准化数据），总台在构建时自动发现它们并放上世界地图。交战各方地位平等——任何阵营都可以是推进方，交战国筛选可以从任何一国的视角浏览。新增战役的流程见 <code>docs/NEW-CAMPAIGN.md</code>。</p>
    <h3>底图与时间带</h3>
    <ul>
      <li>1938 年国界：historical-basemaps <code>world_1938</code>（A. Ourednik 等，GPL-3.0），按示意线拆分了波兰、法国、希腊、丹麦、英属印度与澳大利亚；河流湖泊：Natural Earth（公有领域）。米勒圆柱投影，中央经线 39°E。</li>
      <li>阵营着色以国家 / 殖民地为单位，是小比例尺示意：局部占领（如中国、苏联西部、新几内亚）显示为整片“交战中”，详情写在各条目的注释里。</li>
      <li>时间带依据：${src}。</li>
    </ul>
    <h3>卷宗封面</h3>
    <ul>${entries.filter((c) => c.cover?.credit).map((c) => `<li>${c.title.zh}：${c.cover!.credit!.author} · ${c.cover!.credit!.url ? `<a href="${c.cover!.credit!.url}" target="_blank" rel="noopener">${c.cover!.credit!.license}</a>` : c.cover!.credit!.license}</li>`).join('')}</ul>
    <p class="muted">各战役的完整资料来源与素材许可见战役内的「资料」面板。</p>
  </div>`;
  modal.addEventListener('click', (ev) => { if (ev.target === modal || (ev.target as HTMLElement).closest('.dz-close')) closeModal(); });
  document.body.appendChild(modal);
  (modal.querySelector('.dz-close') as HTMLElement).focus();
};

boot().catch((err) => {
  console.error(err);
  root.insertAdjacentHTML('beforeend', `<div class="hub-error">底图加载失败：${String(err.message ?? err)}<br>请运行 <code>npm run hub:map</code> 生成 public/hub/world1938.topo.json。</div>`);
});
