/** 部队档案卡：卷宗风格，含军标、指挥官、隶属链、实力、装备（点击切换 3D 模型）、简史、当前状态。 */
import type { DB } from '../data/db';
import { unitStateAt, isTerminal, type RUnit } from '../model/core';
import { counterSVG, STATUS_ZH, ECH_ZH, TYPE_ZH, SIDE_ZH, FLIGHT_ZH, escapeXml } from '../map2d/symbols';
import { photoFor, cleanAuthor } from './eventCard';
import type { ModelId } from '../core/types';
import { fmtDate, stripYear } from '../core/time';
import { manifest } from '../campaign/context';
import { shipHeadSVG, shipSectionHTML, ShipPanel } from './shipPanel';

/** 卡片上的 3D 模型名（无对应装备时）；战役可在 manifest.ui.modelLabels 覆盖 */
const MODEL_LABELS: Record<string, string> = {
  inf_de: '德军步兵班（示意）', para_de: '德军伞兵（简化模型）', inf_gr: '希军步兵（简化模型）', inf_gb: '英军步兵（简化模型）', inf_nz: '新西兰步兵（简化模型）',
  inf_au: '澳军步兵（简化模型）', inf_it: '意军步兵（简化模型）', inf_pl: '步兵班（示意，非该国制服）', inf_su: '步兵班（示意）', inf_sk: '步兵班（示意）',
  cav_pl: '骑兵（示意）', cav_su: '骑兵（示意）', art_gun: '野战炮',
  inf_allied: '盟军步兵符号模型', navy_token: '海军符号模型（非实际舰型）', air_token: '航空符号模型（非实际机型）',
};
const yearOf = (s: string) => (manifest().ui.cardYear === 'keep' ? s : stripYear(s));
/** 符号化模型（不代表真实舰型/机型/制服）：卡片上附说明 */
const SYMBOLIC_MODELS = new Set(['navy_token', 'air_token', 'inf_allied']);

type Viewer = { show(id: ModelId): void; dispose(): void };

export class UnitCard {
  el: HTMLElement;
  current: RUnit | null = null;
  private viewer: Viewer | null = null;
  private viewerLoading: Promise<void> | null = null;
  /** 舰船档案（unit.ship）：损伤图与命中记录随时间刷新 */
  private shipPanel: ShipPanel | null = null;
  onUnit: (id: string) => void = () => {};
  onFollow: (id: string) => void = () => {};
  onClose: () => void = () => {};

  constructor(parent: HTMLElement, private db: DB) {
    this.el = document.createElement('div');
    this.el.className = 'unit-card paper hidden';
    parent.appendChild(this.el);
  }

  private chain(u: RUnit): RUnit[] {
    const out: RUnit[] = [];
    let p = u.parent ? this.db.units.get(u.parent) : undefined;
    while (p) { out.unshift(p); p = p.parent ? this.db.units.get(p.parent) : undefined; }
    return out;
  }

  private modelFor(u: RUnit): ModelId | null {
    if (u.model) return u.model;
    for (const q of u.equipment ?? []) { const e = this.db.equipment.get(q.id); if (e?.model) return e.model; }
    // 上级取下属中装甲单位的模型
    for (const c of u.children) { const cu = this.db.units.get(c); if (cu?.model && ['armor', 'light', 'cavalry_mech'].includes(cu.type)) return cu.model; }
    for (const c of u.children) { const cu = this.db.units.get(c); if (cu?.model) return cu.model; }
    return null;
  }

  show(u: RUnit, t: number) {
    this.current = u;
    const s = unitStateAt(u.id, this.db.units, t);
    const chain = this.chain(u);
    const kids = u.children.map((c) => this.db.units.get(c)!).filter(Boolean);
    const model = this.modelFor(u);
    const eq = (u.equipment ?? []).map((q) => ({ q, e: this.db.equipment.get(q.id) })).filter((x) => x.e);
    const st = u.strength;
    const events = this.db.events.filter((e) => e.units?.includes(u.id));
    const lastPt = u.track[u.track.length - 1];
    const fate = lastPt && isTerminal(lastPt.status) ? `${STATUS_ZH[lastPt.status]}（${yearOf(fmtDate(lastPt.h, false))}）` : '';
    this.el.innerHTML = `
      <button class="card-close" title="关闭">×</button>
      <div class="uc-tab side-${u.side}">${SIDE_ZH[u.side]} · ${ECH_ZH[u.echelon]}</div>
      <div class="uc-head">
        ${u.ship ? shipHeadSVG(u) : `<svg class="uc-counter" viewBox="-26 -24 52 48" width="78" height="72">${counterSVG({ side: u.side, type: u.type, echelon: u.echelon, label: u.name.short ?? '', size: 44 })}</svg>`}
        <div class="uc-titles">
          <h2>${escapeXml(u.name.zh)}</h2>
          <div class="uc-orig">${escapeXml(u.name.orig ?? '')}</div>
          <div class="uc-type">${TYPE_ZH[u.type]}${u.schematic ? ' · 分遣队 / 聚合标记' : ''}${s ? ` · <span class="st st-${s.status}">${s.flightPhase ? FLIGHT_ZH[s.flightPhase] : STATUS_ZH[s.status]}</span>` : ''}</div>
        </div>
      </div>
      ${chain.length ? `<div class="uc-chain">${chain.map((p) => `<button class="lnk" data-u="${p.id}">${escapeXml(p.name.short ?? p.name.zh)}</button>`).join('<span>›</span>')}<span>›</span><b>${escapeXml(u.name.short ?? u.name.zh)}</b></div>` : ''}
      <div class="uc-grid">
        ${u.commander ? `<div><label>指挥官</label><span>${escapeXml(u.commander.zh)}<small>${escapeXml(u.commander.orig ?? '')}</small></span></div>` : ''}
        ${st?.men ? `<div><label>兵力</label><span>约 ${st.men.toLocaleString()} 人</span></div>` : ''}
        ${st?.tanks ? `<div><label>坦克/装甲车</label><span>${st.tanks} 辆</span></div>` : ''}
        ${st?.guns ? `<div><label>火炮</label><span>${st.guns} 门</span></div>` : ''}
        ${st?.aircraft ? `<div><label>编队飞机</label><span>约 ${st.aircraft} 架（示意编制）</span></div>` : ''}
        ${fate ? `<div><label>结局</label><span>${fate}</span></div>` : ''}
      </div>
      ${u.ship ? shipSectionHTML(u) : ''}
      ${model ? `<div class="uc-model"><div class="uc-model-view"></div><div class="uc-model-cap"><span class="uc-model-name"></span><span class="hint">拖动旋转 · 滚轮缩放</span></div></div>` : ''}
      ${eq.length ? `<div class="uc-eq"><label>主要装备</label>${eq.map(({ q, e }) => `<button class="eq ${e!.model ? 'has3d' : ''}" data-m="${e!.model ?? ''}" data-e="${e!.id}" title="${escapeXml(e!.desc)}">${escapeXml(e!.name.zh)}${q.count ? ` <b>×${q.count}</b>` : ''}</button>`).join('')}</div>` : ''}
      <div class="uc-eq-detail"></div>
      ${u.history ? `<div class="uc-hist"><label>战史</label><p>${escapeXml(u.history)}</p></div>` : ''}
      ${kids.length ? `<div class="uc-kids"><label>下辖（${kids.length}）</label>${kids.map((k) => `<button class="chip side-${k.side}" data-u="${k.id}">${escapeXml(k.name.short ?? k.name.zh)}</button>`).join('')}</div>` : ''}
      ${events.length ? `<div class="uc-evs"><label>相关事件</label>${events.map((e) => `<div class="uc-ev"><span>${yearOf(fmtDate(e.h, false)).replace(/ 星期./, '')}</span>${escapeXml(e.title.zh)}</div>`).join('')}</div>` : ''}
      <div class="uc-foot"><button class="uc-follow">🎯 镜头跟随</button><span class="uc-src">来源：${u.sources.map((id) => escapeXml(this.db.sources.get(id)?.title ?? id)).join('；')}${u.confidence !== 'high' ? `（可信度：${u.confidence === 'medium' ? '中' : '低'}）` : ''}</span></div>`;
    this.el.classList.remove('hidden', 'enter');
    void this.el.offsetWidth;
    this.el.classList.add('enter');
    const shipEl = this.el.querySelector('.uc-ship') as HTMLElement | null;
    this.shipPanel = u.ship && shipEl ? new ShipPanel(shipEl, u, this.db) : null;
    this.shipPanel?.update(t);
    (this.el.querySelector('.card-close') as HTMLElement).onclick = () => this.hide();
    (this.el.querySelector('.uc-follow') as HTMLElement).onclick = () => this.onFollow(u.id);
    this.el.querySelectorAll<HTMLElement>('[data-u]').forEach((b) => (b.onclick = () => this.onUnit(b.dataset.u!)));
    this.el.querySelectorAll<HTMLElement>('.eq').forEach((b) => (b.onclick = () => {
      const e = this.db.equipment.get(b.dataset.e!)!;
      if (b.dataset.m) this.showModel(b.dataset.m as ModelId, e.name.zh);
      this.showEquipment(e.id);
      this.el.querySelectorAll('.eq').forEach((x) => x.classList.toggle('on', x === b));
    }));
    if (model && SYMBOLIC_MODELS.has(model)) this.el.querySelector('.uc-model-cap')?.insertAdjacentHTML('afterend', '<div class="model-note">示意棋子：不作为实际舰型、机型或制服复原。</div>');
    if (model) {
      const eqWithModel = eq.find((x) => x.e!.model === model);
      this.showModel(model, eqWithModel?.e!.name.zh ?? this.modelLabel(model));
    } else this.disposeViewer();
  }

  /** 卡片打开时随时间刷新状态行（含海上/空中转移） */
  updateTime(t: number) {
    if (!this.current) return;
    const s = unitStateAt(this.current.id, this.db.units, t);
    this.shipPanel?.update(t);
    const el = this.el.querySelector('.uc-type');
    if (!el) return;
    const transit = this.current.ship ? '' : s?.movement === 'sea' ? ' · 海上转移' : s?.movement === 'air' ? ' · 空中转移' : s?.movement === 'rail' ? ' · 铁路机动' : '';
    if (s?.flightPhase) { const label = el.querySelector('.st'); if (label) label.textContent = FLIGHT_ZH[s.flightPhase]; return; }
    const status = s ? `<span class="st st-${s.status}">${STATUS_ZH[s.status]}</span>${transit}` : t < this.current.fromH ? '尚未部署' : '已退出本战区';
    const html = `${TYPE_ZH[this.current.type]}${this.current.schematic ? ' · 分遣队 / 聚合标记' : ''} · ${status}`;
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  private modelLabel(m: ModelId): string {
    for (const e of this.db.equipment.values()) if (e.model === m) return e.name.zh;
    return manifest().ui.modelLabels?.[m] ?? MODEL_LABELS[m] ?? m;
  }

  private showEquipment(id: string) {
    const e = this.db.equipment.get(id);
    const box = this.el.querySelector('.uc-eq-detail') as HTMLElement;
    if (!e || !box) return;
    const ph = photoFor(e.photo?.commons);
    const spec = [
      e.crew ? `乘员 ${e.crew}` : '', e.weightT ? `${e.weightT} 吨` : '', e.armorMm ? `装甲 ${e.armorMm[0]}–${e.armorMm[1]} mm` : '',
      e.gun ? `武器 ${e.gun}` : '', e.speedKmh ? `${e.speedKmh} km/h` : '', e.count ? `参战约 ${e.count}` : '',
    ].filter(Boolean).join(' · ');
    box.innerHTML = `<div class="eqd">${ph ? `<img src="${ph.src}" alt=""/>` : ''}<div><b>${escapeXml(e.name.zh)}</b> <small>${escapeXml(e.name.orig ?? '')}</small><div class="eqd-spec">${spec}</div><p>${escapeXml(e.desc)}</p>${ph ? `<div class="credit">照片：${escapeXml(cleanAuthor(ph.author))} · ${escapeXml(ph.license ?? '')}</div>` : ''}</div></div>`;
  }

  private async showModel(id: ModelId, label: string) {
    const host = this.el.querySelector('.uc-model-view') as HTMLElement | null;
    if (!host) return;
    (this.el.querySelector('.uc-model-name') as HTMLElement).textContent = label;
    if (!this.viewerLoading) {
      this.viewerLoading = import('../three/viewer/ModelViewer').then((m) => {
        this.viewerCtor = m.ModelViewer as unknown as new (el: HTMLElement) => Viewer;
      });
    }
    await this.viewerLoading;
    if (!this.el.contains(host)) return;
    this.viewer?.dispose();
    this.viewer = new this.viewerCtor!(host);
    this.viewer.show(id);
  }
  private viewerCtor: (new (el: HTMLElement) => Viewer) | null = null;

  private disposeViewer() { this.viewer?.dispose(); this.viewer = null; }

  hide() {
    this.el.classList.add('hidden');
    this.disposeViewer();
    this.current = null;
    this.shipPanel = null;
    this.onClose();
  }
}
