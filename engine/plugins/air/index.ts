/**
 * 空战插件（不列颠空战）：作战简报改为双方空军力量卡与空勤人员损失；「当前态势」显示代表编队数与正在出击的编队数。
 * 空战的其他能力（空战控制场、出击航线、飞行状态、事件框选镜头、空域叠加层）属于引擎核心，由 campaign.json 配置。
 */
import { definePlugin } from '../api';
import { unitStateAt } from '../../model/core';
import { SIDE_ZH, escapeXml } from '../../map2d/symbols';
import { sideOrder } from '../../campaign/context';

export interface AirPluginOptions {
  /** 伤亡表里各方的简称（如 GB → RAF） */
  lossLabels?: Record<string, string>;
  /** 无飞机数时显示的机群类型 */
  aircraftFallback?: Record<string, string>;
  /** 态势格：[阵营, 统计（units=代表编队 / flying=出击中）, 文字] */
  statusCells: [string, 'units' | 'flying', string][];
  fine?: string;
}

export function air(opts: AirPluginOptions) {
  return definePlugin({
    id: 'air',
    setup: ({ db, manifest }) => ({
      replaceBrief(pane) {
        const B = manifest.ui.brief;
        const sides = sideOrder().filter((k) => db.forces.sides[k]);
        pane.innerHTML = `
      <div class="brief-title"><div class="stamp-top">${B.stamp ?? '绝密 · 作战简报'}</div><h1>${B.title}</h1><div class="sub">${B.sub}</div><div class="sub2">${B.sub2}</div></div>
      <div class="sb-status"></div>
      <h3>交战双方</h3>
      <div class="fc-sides">${sides.map((side) => { const f = db.forces.sides[side]; return `<div class="fc-side"><i class="sw side-${side}"></i><b>${SIDE_ZH[side]}</b><small>${escapeXml(f.commander)}</small></div>`; }).join('')}</div>
      <h3>作战力量</h3>
      ${sides.map((side) => { const f = db.forces.sides[side]; return `<div class="air-strength side-${side}"><b>${SIDE_ZH[side]}</b><span>${escapeXml(f.divisions)}</span><strong>${f.aircraft != null ? f.aircraft.toLocaleString() : opts.aircraftFallback?.[side] ?? '机群'} <small>${f.aircraft != null ? '架' : '参战类型'}</small></strong><p>${escapeXml(f.note ?? '')}</p></div>`; }).join('')}
      <h3>战役损失</h3>
      <table class="losses"><tr><th></th><th>全战役空勤人员损失</th></tr>${sides.map((side) => `<tr><td><i class="sw side-${side}"></i>${opts.lossLabels?.[side] ?? SIDE_ZH[side]}</td><td>${escapeXml(db.forces.sides[side].losses.killed)}</td></tr>`).join('')}</table>
      <p class="fine">${opts.fine ?? B.fine}</p>`;
      },
      sidebarStatus: (() => {
        let lastKey = '';
        const leaves = db.unitList.filter((u) => u.type === 'fighter' || u.type === 'bomber');
        return (t: number, el: HTMLElement) => {
          const key = String(Math.floor(t * 60));
          if (key === lastKey) return true;
          lastKey = key;
          const flying = leaves.filter((u) => { const s = unitStateAt(u.id, db.units, t); return s?.flightPhase && s.flightPhase !== 'at_base'; });
          const n = (side: string, what: 'units' | 'flying') => (what === 'units' ? leaves : flying).filter((u) => u.side === side).length;
          el.innerHTML = `<h3>当前空战态势</h3><div class="st-grid">${opts.statusCells.map(([side, what, label]) => `<div><b>${n(side, what)}</b><span>${label}</span></div>`).join('')}</div>`;
          return true;
        };
      })(),
    }),
  });
}
