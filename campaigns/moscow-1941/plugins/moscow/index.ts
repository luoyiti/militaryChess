/**
 * 莫斯科保卫战展示插件：城门态势（德军控制区边界距克里姆林宫的近似直线距离 + 文献说法）与逐日气温。
 *
 * 只做展示：不改数据格式，不改引擎行为。数据来自 `data/ext/moscow/`：
 *  - `weather.json`     莫斯科站（WMO 27612）逐日实测气温，缺测留空；
 *  - `front-watch.json` 文献中「德军前锋最远到哪儿」的说法表（含距离与出处）。
 *
 * 距离一律写成「近似」：一条来自本图按关键帧重建的控制区边界（几何口径），一条来自史料记载的某地推进距离
 * （文献口径）。两个数字并排显示但含义不同，面板里明确说明，不合并、不插值、不取平均。
 */
import { definePlugin } from '../../../../engine/plugins/api';
import type { REvent } from '../../../../engine/data/db';
import { escapeXml } from '../../../../engine/map2d/symbols';
import { hoursToIso } from '../../../../engine/core/time';
import { resolvePos } from '../../../../engine/model/core';
import {
  campaignDay, fmtTemp, frontSnapshotAt, frostDays, latestReport, recentLows, sparkPath, weatherAt,
  type FrontReport, type FrontWatchDoc, type WeatherDoc,
} from './model';

const MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${y} 年 ${MONTHS[m - 1]}月 ${d} 日`;
};
const shortDay = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

export interface MoscowPluginOptions {
  /** 观测目标（默认克里姆林宫），写 `@地名` 或经纬度 */
  target?: string;
  /** 面板标题 */
  title?: string;
}

export function moscow(opts: MoscowPluginOptions = {}) {
  return definePlugin({
    id: 'moscow',
    setup(ctx) {
      const weather = (ctx.db.ext.moscow?.weather ?? {}) as WeatherDoc;
      const watch = (ctx.db.ext.moscow?.['front-watch'] ?? {}) as FrontWatchDoc;
      const days = [...(weather.days ?? [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      const reports = [...(watch.reports ?? [])].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
      const target = resolvePos(opts.target ?? '@kremlin', ctx.db.gaz);
      const startIso = ctx.manifest.time.start;
      const panelTitle = opts.title ?? '城门态势';

      let panel: HTMLElement | null = null;
      let lastKey = '';

      const sourcesOf = (ids: string[] | undefined) => {
        const items = [...new Set(ids ?? [])].map((id) => {
          const s = ctx.db.sources.get(id);
          if (!s) return '';
          const label = escapeXml(s.title);
          const link = s.url && /^https?:\/\//.test(s.url)
            ? `<a href="${escapeXml(s.url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
            : label;
          return `<li>${link}</li>`;
        }).filter(Boolean).join('');
        return items ? `<details class="mx-sources"><summary>史料依据</summary><ul>${items}</ul></details>` : '';
      };

      const reportHtml = (r: FrontReport | null) => {
        if (!r) return '<p class="mx-caption">截至当前时刻，史料说法表中还没有对应的记载条目。</p>';
        const alt = (r.kmAlt ?? []).length ? `（另有 ${(r.kmAlt ?? []).map((v) => `${v} km`).join('、')} 的写法）` : '';
        return `<div class="mx-report">
          <div class="mx-report-head"><b>${escapeXml(r.label)}</b><span>${r.km} km${alt}</span></div>
          <p>${escapeXml(r.text)}</p>
          <p class="mx-caption">文献说法 · ${dayLabel(r.at)} · 置信度 ${{ high: '高', medium: '中', low: '低' }[r.confidence ?? 'medium'] ?? '中'}</p>
          ${sourcesOf(r.sources)}
        </div>`;
      };

      const render = (t: number, force = false) => {
        if (!panel?.isConnected) return;
        const at = hoursToIso(t);
        const day = campaignDay(startIso, at);
        const dayKey = at.slice(0, 10);
        if (!force && lastKey === dayKey) return;
        lastKey = dayKey;

        const snap = frontSnapshotAt(ctx.db.keyframes, target, t);
        const report = latestReport(reports, at);
        const today = weatherAt(days, at);
        const lows = recentLows(days, at, 14);
        const frost = frostDays(days, at);
        const path = sparkPath(lows.map(([, v]) => v));
        const lo = lows.length ? Math.min(...lows.map(([, v]) => v)) : null;
        const hi = lows.length ? Math.max(...lows.map(([, v]) => v)) : null;

        const frameDate = escapeXml(snap.at?.slice(0, 10).replaceAll('-', '.') ?? '');
        const distanceLine = snap.km == null
          ? snap.hasFrame
            ? `<p class="mx-caption">按 ${frameDate} 的战线关键帧，德军控制区为空——此时画布内尚无德军控制区，无法给出前锋距离。</p>`
            : '<p class="mx-caption">当前时刻之前还没有控制区关键帧，无法按图估算距离。</p>'
          : snap.suspect
            ? `<div class="mx-distance is-suspect"><b>—</b><span>km</span><em>不给数</em></div>
               <p class="mx-caution">这一帧的控制区多边形在莫斯科附近出现<b>顶点顺序交错</b>：东西两侧的顶点被交错排进同一个环，形成横穿城郊的长弦。按整条边界量测会得到 ${snap.km} km，剔除超长边后又只有约 ${snap.kmShortEdge} km，两个值互相矛盾，说明问题在<b>多边形顶点顺序</b>而不是史料。既然量不准，这里<b>不给数字</b>，免得以一个精确的样子误导。</p>
               <p class="mx-caption">当日前锋请以下方<b>文献说法</b>与该帧自带的说明文字为准。该缺陷已记录在案、待战线数据复核后修正；本面板不会为此改动引擎或他人数据。</p>`
            : `<div class="mx-distance"><b>${snap.km}</b><span>km</span></div>
               <p class="mx-caption">按本图 ${frameDate} 的控制区重建，取德军控制区边界到克里姆林宫的<b>最近直线距离</b>（近似）。战线为按史料重建的近似示意，误差在数公里量级，不能当作逐日实测前线。</p>`;

        panel.innerHTML = `
          <div class="mx-heading"><h3>${escapeXml(panelTitle)}</h3><span>第 ${day} 天</span></div>
          <div class="mx-block">
            <h4>德军前锋距克里姆林宫</h4>
            ${distanceLine}
            ${reportHtml(report)}
            <p class="mx-caution">几何估算与文献说法是两套口径：前者按本图重建的控制区边界量测，后者是史料记载的某地推进距离（测量点、直线或公路里程常未说明）。两者不合并、不相减。</p>
          </div>
          <div class="mx-block">
            <h4>莫斯科每日气温 · 站 27612</h4>
            ${today ? `<div class="mx-weather">
                <div><span>最低</span><strong>${fmtTemp(today.tMin)}</strong></div>
                <div><span>平均</span><strong>${fmtTemp(today.tAvg)}</strong></div>
                <div><span>最高</span><strong>${fmtTemp(today.tMax)}</strong></div>
                <div><span>降水</span><strong>${today.precipMm.toFixed(1)}<small>mm</small></strong></div>
              </div>
              <p class="mx-caption">${dayLabel(today.date)} · 单位 ℃（实测日值，未插值）</p>`
              : `<p class="mx-caption">该日站点无实测日值，留空不补。</p>`}
            ${path ? `<figure class="mx-spark"><svg viewBox="0 0 132 26" role="img" aria-label="最近 14 日最低气温走势"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
              <figcaption>最近 ${lows.length} 日最低气温 ${fmtTemp(lo)} … ${fmtTemp(hi)} ℃（${shortDay(lows[0][0])}—${shortDay(lows[lows.length - 1][0])}）</figcaption></figure>` : ''}
            <p class="mx-caption">自 ${dayLabel(startIso)} 起，日最低气温 ≤ −20℃ 的日数：<b>${frost}</b> 天。</p>
            <p class="mx-caution">这里只给观测站的日值：单日极值与战场体感（风寒、着装、野外露宿）不同，也不能单独用来解释战役进程。严寒对双方同时起作用，苏军同样受冻。</p>
            <details class="mx-meta"><summary>数据与口径</summary>
              <p>${escapeXml(weather.meta?.sourceTitle ?? '莫斯科逐日气温')}</p>
              <p>${escapeXml(weather.meta?.sourceNote ?? '')}</p>
              ${weather.meta?.sourceUrl ? `<p><a href="${escapeXml(weather.meta.sourceUrl)}" target="_blank" rel="noopener noreferrer">原站月报</a></p>` : ''}
            </details>
          </div>`;

        for (const el of panel.querySelectorAll<HTMLDetailsElement>('details')) {
          if (el.dataset.open === '1') el.open = true;
        }
      };

      const mount = (pane: HTMLElement) => {
        pane.querySelectorAll('.mx-panel').forEach((el) => el.remove());
        panel = document.createElement('section');
        panel.className = 'mx-panel';
        panel.setAttribute('aria-label', panelTitle);
        panel.addEventListener('toggle', (event) => {
          const el = event.target;
          if (el instanceof HTMLDetailsElement) el.dataset.open = el.open ? '1' : '0';
        }, true);
        const status = pane.querySelector('.sb-status');
        if (status) status.after(panel); else pane.append(panel);
        render(ctx.store.get().t, true);
      };

      return {
        sidebarBrief(pane: HTMLElement) { mount(pane); },
        onTime(t: number) { render(t); },
        eventCardExtra(e: REvent) {
          const day = weatherAt(days, e.at);
          if (!day) return null;
          return `<p class="mx-event-weather">当日莫斯科气温 ${fmtTemp(day.tMin)} / ${fmtTemp(day.tAvg)} / ${fmtTemp(day.tMax)} ℃（最低／平均／最高，站 27612）${
            day.precipMm >= 0.1 ? `，降水 ${day.precipMm.toFixed(1)} mm` : ''
          }</p>`;
        },
      };
    },
  });
}

export default moscow;
