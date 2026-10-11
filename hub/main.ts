/**
 * 作战总台入口：地图桌（hub/map.ts）+ 档案夹（hub/dossier.ts）+ 电报纸带（hub/tape.ts）。
 * 战役清单来自 virtual:campaign-catalog —— 新增 campaigns/<id>/campaign.json 后自动出现在地图上。
 */
import './hub.css';
import catalog from 'virtual:campaign-catalog';
import occupation from './occupation.json';
import type { Topology } from 'topojson-specification';
import { HubMap } from './map';
import { Tape } from './tape';
import { Dossier } from './dossier';
import { sound } from './sound';
import { dayOf } from './dates';
import type { CatalogEntry, OccupationData, Status } from './types';

const occ = occupation as unknown as OccupationData;
const entries = (catalog as CatalogEntry[]).filter((c) => c.hub?.pin);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth < 760;

document.body.classList.add('hub');
const root = document.getElementById('hub')!;
root.innerHTML = `
  <header class="hub-top">
    <div class="brand"><span class="brand-mark">39<i>—</i>41</span><div><b>作战总台</b><small>WAR ROOM · 欧洲战场推演档案</small></div></div>
    <div class="hub-tools">
      <button class="tool sound" type="button"></button>
      <button class="tool about" type="button">关于</button>
    </div>
  </header>
  <main class="table">
    <div class="sheet-wrap"><div class="sheet">
      <div class="cartouche"><b>欧洲形势图</b><span>1938 年国界 · 战区与卷宗</span></div>
      <details class="map-legend"></details>
      <i class="tack tl"></i><i class="tack tr"></i><i class="tack bl"></i><i class="tack br"></i>
    </div></div>
  </main>`;
const table = root.querySelector('.table') as HTMLElement;
const sheetWrap = root.querySelector('.sheet-wrap') as HTMLElement;
const sheet = root.querySelector('.sheet') as HTMLElement;

const soundBtn = root.querySelector('.tool.sound') as HTMLButtonElement;
const paintSound = () => { soundBtn.textContent = sound.enabled ? '音效 · 开' : '音效 · 关'; soundBtn.setAttribute('aria-pressed', String(sound.enabled)); };
paintSound();
soundBtn.onclick = () => { sound.toggle(); paintSound(); sound.play('ui_click', 0.4); };
addEventListener('pointerdown', () => sound.unlock(), { once: true });
addEventListener('keydown', () => sound.unlock(), { once: true });

const published = entries.filter((c) => c.status === 'published');
const params = new URLSearchParams(location.search);
const dParam = params.get('d');
const initialDay = dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam) ? dayOf(dParam) : Math.max(...published.map((c) => dayOf(c.time.end)), dayOf(occ.window.start));

const dossier = new Dossier(table, entries);
const tape = new Tape(root, entries, occ, initialDay, reduced);

async function boot() {
  const topo = (await fetch('hub/europe1938.topo.json').then((r) => { if (!r.ok) throw new Error(`${r.status} hub/europe1938.topo.json`); return r.json(); })) as Topology;
  const map = new HubMap(sheet, topo, entries, occ, narrow() ? 720 : 1000);
  sheet.style.setProperty('--aspect', String(map.width / map.height));
  buildLegend();

  // 地图纸按比例放进桌面可用区域
  const fit = () => {
    if (narrow()) { sheet.style.width = ''; sheet.style.height = ''; return; }
    const r = sheetWrap.getBoundingClientRect();
    const aspect = map.width / map.height;
    const w = Math.min(r.width, r.height * aspect);
    sheet.style.width = `${Math.floor(w)}px`;
    sheet.style.height = `${Math.floor(w / aspect)}px`;
  };
  new ResizeObserver(fit).observe(sheetWrap);
  fit();

  let leaving = false;
  const showCampaign = (c: CatalogEntry, scroll = false) => {
    const changed = dossier.current?.id !== c.id;
    dossier.show(c);
    map.highlight(c.id);
    tape.highlight(c.id);
    if (changed) sound.play('paper', 0.22, 250);
    if (scroll && narrow()) dossier.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  const closeDossier = () => { dossier.showIndex(); map.highlight(null); tape.highlight(null); };
  const enter = async (c: CatalogEntry, nointro = false) => {
    if (c.status === 'planned' || !c.playable) { showCampaign(c); dossier.shake(); sound.play('stamp', 0.35); return; }
    if (leaving) return;
    leaving = true;
    sound.play('stamp', 0.6);
    tape.pause();
    map.highlight(c.id);
    document.body.classList.add('leaving');
    const url = c.href + (nointro ? '?nointro' : '');
    if (!reduced) await map.zoomTo(c.id, 1100);
    location.href = url;
  };
  // 从战役页返回（往返缓存）时恢复地图
  window.addEventListener('pageshow', (ev: PageTransitionEvent) => { if (ev.persisted) { leaving = false; document.body.classList.remove('leaving'); map.resetZoom(); } });

  map.onHover = (c) => { if (c) showCampaign(c); };
  map.onFocus = (c) => showCampaign(c);
  // 鼠标：悬停看卷宗、点击进入；触屏：先点开卷宗，再点一次进入
  map.onActivate = (c, viaTouch) => (!viaTouch || dossier.current?.id === c.id ? enter(c) : showCampaign(c, true));
  dossier.onEnter = (c, free) => enter(c, free);
  dossier.onPick = (c) => { showCampaign(c); map.pins.get(c.id)?.focus({ preventScroll: true }); };
  dossier.onClose = closeDossier;
  tape.onChange = (day) => map.setDay(day);
  tape.onSpan = (c) => { tape.set(dayOf(c.time.start)); showCampaign(c); };
  tape.onType = () => sound.play('typewriter', 0.12, 70);
  map.setDay(tape.day, false);
  map.intro(reduced);
  requestAnimationFrame(() => tape.keepCursorVisible()); // 窄屏纸带横向滚动到当前日期

  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    const t = ev.target as HTMLElement;
    if (ev.key === 'Escape') { if (!closeModal()) closeDossier(); }
    else if (ev.key === ' ' && !t.closest('button, a, input, [role="button"]')) { ev.preventDefault(); tape.isPlaying ? tape.pause() : tape.play(); }
  });
  (window as unknown as { __hub: unknown }).__hub = { map, tape, dossier, entries, setDay: (iso: string) => tape.set(dayOf(iso)), status: (id: string) => map.statusOf(id) };
}

function buildLegend() {
  const host = root.querySelector('.map-legend') as HTMLDetailsElement;
  host.open = innerWidth >= 1280 && innerHeight >= 760;
  const order: Status[] = ['axis', 'axis-ally', 'occupied', 'contested', 'allied', 'soviet', 'vichy'];
  const sw = (cls: string) => `<svg viewBox="0 0 22 12" aria-hidden="true"><rect class="country ${cls}" width="22" height="12"/></svg>`;
  host.innerHTML = `
    <summary>图例</summary><div class="lg-grid">
    ${order.map((s) => `<span title="${occ.statuses[s].desc}">${sw(`st-${s}`)}${occ.statuses[s].zh}</span>`).join('')}
    <span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="lg-theatre" d="M1 6H21"/></svg>战区</span>
    <span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="lg-split" d="M1 6H21"/></svg>分界线</span>
    <span><svg viewBox="0 0 22 12" aria-hidden="true"><circle class="lg-wax" cx="11" cy="6" r="5"/></svg>可进入的卷宗</span></div>`;
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
  const src = Object.values(occ.sources).map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join('、');
  modal.innerHTML = `<div class="hub-modal-card">
    <button type="button" class="dz-close" aria-label="关闭">×</button>
    <h2>关于作战总台</h2>
    <p>六场战役共用同一套推演引擎：每个战役是 <code>campaigns/&lt;id&gt;/</code> 下的一个数据包（<code>campaign.json</code> + 标准化数据），总台在构建时自动发现它们并放上地图。新增战役的流程见 <code>docs/NEW-CAMPAIGN.md</code>。</p>
    <h3>底图与时间带</h3>
    <ul>
      <li>1938 年国界：historical-basemaps <code>world_1938</code>（A. Ourednik 等，GPL-3.0）；河流湖泊：Natural Earth（公有领域）。</li>
      <li>波兰德苏分界线、法国停战分界线为小比例尺示意；部分割让领土只写在注释中，不改变整国着色。</li>
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
  sheet.insertAdjacentHTML('beforeend', `<div class="hub-error">底图加载失败：${String(err.message ?? err)}<br>请运行 <code>npm run hub:map</code> 生成 public/hub/europe1938.topo.json。</div>`);
});
