import { definePlugin } from '../../../../engine/plugins/api';
import { hoursToIso, isoToHours } from '../../../../engine/core/time';
import { escapeXml } from '../../../../engine/map2d/symbols';
import { photoFor, type PhotoMeta } from '../../../../engine/ui/eventCard';
import { latestAt, reconcileLayers, siegeAt, transportAt, type CivicRecord, type ComparisonMode, type EvidenceNote, type LogisticsRoute, type MilitaryStatistics, type RationRecord } from './model';

const STATE_LABELS = { regular: '常规运输', restricted: '受限或试行', uncertain: '时效未确定' };
const dayLabel = (iso: string) => iso.slice(0, 10).replaceAll('-', '.');
type AuditedPhoto = PhotoMeta & { auditNote?: string; modifications?: string };

export function siegeLife() {
  return definePlugin({
    id: 'siege',
    setup(ctx) {
      const data = ctx.db.ext.siege ?? {};
      const rations = (data.rations ?? []) as RationRecord[];
      const routes = (data.logistics ?? []) as LogisticsRoute[];
      const mapRoutes = [...routes, ...((data['map-windows'] ?? []) as LogisticsRoute[])];
      const civic = (data.civic ?? []) as CivicRecord[];
      const notes = new Map([...((data.notes ?? []) as EvidenceNote[]), ...((data['military-notes'] ?? []) as EvidenceNote[])].map((n) => [n.eventId, n]));
      const statistics = new Map(((data.statistics ?? []) as MilitaryStatistics[]).map((s) => [s.eventId, s]));
      let mode: ComparisonMode = 'time';
      let panel: HTMLElement | null = null;
      let lastRender = '';
      const detailState = new Map<string, boolean>();
      const rememberDetails = () => panel?.querySelectorAll<HTMLDetailsElement>('details[data-section]').forEach((el) => detailState.set(el.dataset.section!, el.open));

      const sources = (ids: string[], section: string) => {
        const list = [...new Set(ids)].map((id) => {
          const s = ctx.db.sources.get(id);
          if (!s) return '';
          const label = escapeXml(s.title);
          const link = s.url && /^https?:\/\//.test(s.url) ? `<a href="${escapeXml(s.url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
          return `<li>${link}${s.year ? ` · ${s.year}` : ''}</li>`;
        }).join('');
        return list ? `<details class="siege-sources" data-section="${section}"><summary>史料依据</summary><ul>${list}</ul></details>` : '';
      };

      const reconcile = () => {
        const layers = reconcileLayers(ctx.store.get().layers, mapRoutes, hoursToIso(ctx.store.get().t), mode);
        if (layers) ctx.store.set({ layers });
      };

      const render = (t: number, force = false) => {
        if (!panel?.isConnected) return;
        const at = hoursToIso(t);
        const enabled = ctx.store.get().layers.logistics !== false;
        const key = `${at.slice(0, 10)}:${mode}:${enabled}`;
        if (!force && lastRender === key) return;
        lastRender = key;
        rememberDetails();
        const state = siegeAt(at), ration = latestAt(rations, at), city = latestAt(civic, at);
        const transport = routes.map((route) => {
          const segment = transportAt(route, at);
          if (!segment) return mode === 'history' ? `<li class="siege-transport reference"><b>${escapeXml(route.label)}</b><span>跨时期线路 · 此时无已核实通行记录</span></li>` : '';
          return `<li class="siege-transport ${segment.state}"><div><b>${escapeXml(route.label)}</b><em>${STATE_LABELS[segment.state]}</em></div><p>${escapeXml(segment.note)}</p>${sources(segment.sources, `transport-${route.id}`)}</li>`;
        }).join('');
        const grams = (value: number) => `<strong>${value}</strong><small>克</small>`;
        const anchors = [
          ['e.ration_125g', '125克面包'], ['e.road_of_life_opens', '冰道运输'],
          ['e.leningrad_symphony', '围城交响曲'], ['e.road_of_victory_train', '首列抵城'],
        ].filter(([id]) => ctx.db.events.some((e) => e.id === id));
        panel.innerHTML = `
          <div class="siege-heading"><h3>围城生活</h3><span>${state.day === null ? '战略序章' : state.stage === 'lifted' ? '872天' : `第${state.day}天`}</span></div>
          <div class="siege-state ${state.stage}"><b>${state.label}</b><p>${state.detail}</p></div>
          <h4>每日面包配给标准</h4>
          ${ration ? `<div class="siege-rations" aria-label="分类面包配给"><div><span>普通工人</span>${grams(ration.workers)}</div><div><span>职员</span>${grams(ration.employees)}</div><div><span>受供养者</span>${grams(ration.dependents)}</div><div><span>儿童</span>${grams(ration.children)}</div></div><p class="siege-caption">${dayLabel(ration.from)}起 · ${escapeXml(ration.note)}</p>${sources(ration.sources, 'rations')}` : '<p class="siege-caption">尚未实施本套配给卡标准；数值留空。</p>'}
          <p class="siege-caution">配给标准不代表实际领取量，也不等于全部每日食物。特殊工种、军人另有标准。</p>
          <h4>交通联系</h4>
          <label class="siege-mode">线路显示<select aria-label="交通线路显示模式"><option value="time"${mode === 'time' ? ' selected' : ''}>随时间</option><option value="history"${mode === 'history' ? ' selected' : ''}>全期对照 · 跨时期线路</option></select></label>
          ${!enabled ? '<p class="siege-caption">地图交通图层已关闭；可在图例中重新开启。</p>' : ''}
          ${mode === 'history' ? '<p class="siege-caution">全期对照展示各时期线路，不表示它们在当前日期同时通行。</p>' : ''}
          <ul class="siege-transports">${transport || '<li class="siege-caption">此时没有已核实的湖上运输窗口；不代表城市与外界完全没有联系。</li>'}</ul>
          <p class="siege-caution">线路为近似示意；换季可能重叠。本图呈现有据可查的运输阶段，非逐日通行记录。长短水路分别过滤；1943年长线恢复日未定，不套用短线日期。</p>
          ${city ? `<details class="siege-civic" data-section="civic"${detailState.get('civic') !== false ? ' open' : ''}><summary>${escapeXml(city.title)}</summary><p>${escapeXml(city.body)}</p>${sources(city.sources, 'civic-sources')}</details>` : ''}
          <div class="siege-jumps">${anchors.map(([id, label]) => `<button data-siege-event="${id}">${label}</button>`).join('')}</div>`;
        for (const el of panel.querySelectorAll<HTMLDetailsElement>('details[data-section]')) if (detailState.has(el.dataset.section!)) el.open = detailState.get(el.dataset.section!)!;
      };

      // The master preference survives automatic filtering; changes to effective bits settle after one notification.
      ctx.store.on((_state, changed) => {
        if (changed.has('layers')) { reconcile(); render(ctx.store.get().t); }
      });
      reconcile();
      return {
        sidebarBrief(pane) {
          rememberDetails();
          pane.querySelectorAll('.siege-panel').forEach((el) => el.remove());
          panel = document.createElement('section');
          panel.className = 'siege-panel';
          panel.setAttribute('aria-label', '围城生活');
          panel.addEventListener('toggle', (event) => {
            const target = event.target;
            if (target instanceof HTMLDetailsElement && target.dataset.section) detailState.set(target.dataset.section, target.open);
          }, true);
          const status = pane.querySelector('.sb-status');
          if (status) status.after(panel); else pane.append(panel);
          panel.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLSelectElement)) return;
            mode = target.value === 'history' ? 'history' : 'time';
            reconcile(); render(ctx.store.get().t, true);
          });
          panel.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-siege-event]') : null;
            const e = target && ctx.db.events.find((item) => item.id === target.dataset.siegeEvent);
            if (!e) return;
            ctx.director.cancel(); ctx.clock.release();
            ctx.store.set({ playing: false, selectedUnit: null, followUnit: false });
            ctx.clock.seek(isoToHours(e.at)); ctx.director.present(e, false);
          });
          render(ctx.store.get().t, true);
        },
        onTime(t) { reconcile(); render(t); },
        eventCardExtra(e) {
          const note = notes.get(e.id);
          const photo = e.photo ? photoFor(e.photo.commons) as AuditedPhoto | null : null;
          const stat = statistics.get(e.id);
          const table = stat ? `<div class="siege-statistics"><b>${escapeXml(stat.title)}</b><p>${escapeXml(stat.period)} · 单位：人／减员记录</p><table><thead><tr><th>范围</th><th>开始兵力</th><th>不可恢复</th><th>卫生减员</th></tr></thead><tbody>${stat.rows.map((r) => `<tr><th>${escapeXml(r.label)}</th><td>${r.initial.toLocaleString('zh-CN')}</td><td>${r.irrecoverable.toLocaleString('zh-CN')}</td><td>${r.sanitary.toLocaleString('zh-CN')}</td></tr>`).join('')}</tbody></table><p>${escapeXml(stat.scope)}</p><p>${escapeXml(stat.definition)}</p>${sources(stat.sources, `statistics-${e.id}`)}</div>` : '';
          const evidence = note || stat ? `<details class="siege-evidence"><summary>深入阅读 · 史料与分歧</summary>${note?.paragraphs.map((p) => `<p>${escapeXml(p)}</p>`).join('') ?? ''}${table}${sources(note?.sources ?? [], `event-${e.id}`)}</details>` : '';
          const photoLink = (url: string | undefined, label: string) => url && /^https?:\/\//.test(url) ? `<a href="${escapeXml(url)}" target="_blank" rel="noopener noreferrer">${escapeXml(label)}</a>` : escapeXml(label);
          const attribution = photo ? `<details class="siege-photo-evidence"><summary>照片署名与校订</summary><p>${escapeXml(photo.caption ?? '')}</p><p>${escapeXml(photo.author ?? '作者未详')}</p><p>${photoLink(photo.sourceUrl, '原始作品页面')} · ${photoLink(photo.licenseUrl, photo.license ?? '许可见原页')}</p><p>${escapeXml(photo.auditNote ?? '')}</p><p>${escapeXml(photo.modifications ?? '')}</p></details>` : '';
          return evidence || attribution ? evidence + attribution : null;
        },
      };
    },
  });
}
