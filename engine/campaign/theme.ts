/** 由 campaign.json 生成页面主题：阵营 CSS 变量（.side-XX { --side; --side-d }）、主题色、占领槽纹样与图例。 */
import type { CampaignManifest, SlotDef } from './types';

/** 槽位缺省样式（与旧版 DE / SU 两槽一致） */
export const SLOT_DEFAULTS: Required<Pick<SlotDef, 'pattern' | 'legend' | 'line' | 'sandboxFill' | 'sandboxLine'>>[] = [
  {
    pattern: { size: 9, svg: `<rect width="9" height="9" fill="rgba(58,88,135,0.13)"/><path d="M-2,2 L2,-2 M0,9 L9,0 M7,11 L11,7" stroke="rgba(38,64,110,0.55)" stroke-width="1.1"/>` },
    legend: 'repeating-linear-gradient(-45deg, rgba(38,64,110,.6) 0 1.5px, rgba(58,88,135,.15) 1.5px 6px)',
    line: '#1f3558',
    sandboxFill: [0.18, 0.32, 0.62],
    sandboxLine: [0.12, 0.2, 0.36],
  },
  {
    pattern: { size: 10, svg: `<rect width="10" height="10" fill="rgba(150,84,34,0.14)"/><path d="M0,10 L10,0 M-2,2 L2,-2 M8,12 L12,8 M0,0 L10,10 M-2,8 L2,12 M8,-2 L12,2" stroke="rgba(120,62,20,0.45)" stroke-width="0.9"/>` },
    legend: 'repeating-linear-gradient(45deg, rgba(120,62,20,.5) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(120,62,20,.5) 0 1px, rgba(150,84,34,.15) 1px 5px)',
    line: '#8a4518',
    sandboxFill: [0.62, 0.34, 0.12],
    sandboxLine: [0.32, 0.18, 0.06],
  },
];

export function slotStyle(m: CampaignManifest, i: 0 | 1) {
  const s = m.control.slots[i];
  return { ...SLOT_DEFAULTS[i], ...(s ?? {}) } as SlotDef & (typeof SLOT_DEFAULTS)[number];
}

export function themeCSS(m: CampaignManifest): string {
  const t = m.theme;
  const a = slotStyle(m, 0), b = slotStyle(m, 1);
  const root = {
    '--accent': t.accent, '--accent-d': t.accentDark, '--accent-tint': t.accentTint,
    '--theatre-border': t.theatreBorder, '--theatre-halo': t.theatreHalo, '--rest-fill': t.restFill,
    '--slot-a-line': a.line, '--slot-b-line': b.line,
    '--slot-a-legend': a.legend, '--slot-b-legend': b.legend,
    '--slot-b-opacity': String(b.opacity ?? 1),
  };
  const lines = [`:root{${Object.entries(root).map(([k, v]) => `${k}:${v}`).join(';')}}`];
  for (const s of m.sides) lines.push(`.side-${s.id}{--side:${s.css.main};--side-d:${s.css.dark}}`);
  return lines.join('\n');
}

export function applyTheme(m: CampaignManifest) {
  const style = document.createElement('style');
  style.dataset.campaign = m.id;
  style.textContent = themeCSS(m);
  document.head.appendChild(style);
  document.documentElement.dataset.campaign = m.id;
}
