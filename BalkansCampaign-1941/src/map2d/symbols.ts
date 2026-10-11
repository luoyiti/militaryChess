/**
 * 兵棋棋子（纸板方块 + APP-6 风格兵种符号）SVG 片段生成。
 * 以 (0,0) 为中心，尺寸 S（像素）。德军只用阵营色与铁十字风格，不使用卍字。
 */
import type { Side, UnitType, Echelon, UnitStatus } from '../schema';

export const SIDE_COUNTER: Record<Side, { bg: string; edge: string; text: string; box: string; ink: string }> = {
  DE: { bg: '#56708f', edge: '#2a3a52', text: '#fbf6ea', box: '#f3eee0', ink: '#2a3a52' },
  IT: { bg: '#788054', edge: '#424928', text: '#fbf6ea', box: '#f3eee0', ink: '#424928' },
  HU: { bg: '#85736e', edge: '#4d3435', text: '#fbf6ea', box: '#f3eee0', ink: '#4d3435' },
  BG: { bg: '#866a8e', edge: '#543455', text: '#fbf6ea', box: '#f3eee0', ink: '#543455' },
  GR: { bg: '#2a5a94', edge: '#163864', text: '#fbf6ea', box: '#f3eee0', ink: '#163864' },
  YU: { bg: '#a06145', edge: '#603c2d', text: '#fbf6ea', box: '#f3eee0', ink: '#603c2d' },
  GB: { bg: '#8d7346', edge: '#5c4a28', text: '#fbf6ea', box: '#f3eee0', ink: '#5c4a28' },
  AU: { bg: '#b79845', edge: '#66531f', text: '#fbf6ea', box: '#f3eee0', ink: '#66531f' },
  NZ: { bg: '#438079', edge: '#214a46', text: '#fbf6ea', box: '#f3eee0', ink: '#214a46' },
};

const ECH_MARK: Record<Echelon, string> = { armygroup: 'XXXXX', front: 'XXXXX', army: 'XXXX', corps: 'XXX', division: 'XX', brigade: 'X' };

/** 兵种符号（画在 bw×bh 的方框内，框左上角为 (x,y)） */
function glyph(type: UnitType, x: number, y: number, bw: number, bh: number, ink: string, echelon: Echelon): string {
  const sw = Math.max(1, bw * 0.055);
  const L = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const X = () => L(x, y, x + bw, y + bh) + L(x, y + bh, x + bw, y);
  const diag = () => L(x, y + bh, x + bw, y);
  const oval = () => `<rect x="${x + bw * 0.2}" y="${y + bh * 0.24}" width="${bw * 0.6}" height="${bh * 0.52}" rx="${bh * 0.26}" fill="none" stroke="${ink}" stroke-width="${sw}"/>`;
  const cx = x + bw / 2, cy = y + bh / 2;
  switch (type) {
    case 'infantry': return X();
    case 'airborne': return `<path d="M${x},${cy} Q${cx},${y - bh * 0.5} ${x + bw},${cy} L${cx},${y + bh}Z" fill="none" stroke="${ink}" stroke-width="${sw}"/>`;
    case 'air': return L(x, cy, x + bw, cy) + L(cx, y, cx, y + bh) + L(x + bw * .25, y + bh, x + bw * .75, y + bh);
    case 'armor': return oval();
    case 'motorized': return X() + L(cx, y, cx, y + bh);
    case 'light': return diag() + oval();
    case 'cavalry': return diag();
    case 'cavalry_mech': return diag() + oval();
    case 'mountain': return X() + `<path d="M${cx - bw * 0.14},${y + bh} L${cx},${y + bh * 0.72} L${cx + bw * 0.14},${y + bh}Z" fill="${ink}"/>`;
    case 'artillery': return `<circle cx="${cx}" cy="${cy}" r="${bh * 0.16}" fill="${ink}"/>`;
    case 'border': return X() + L(x + bw * 0.08, y + bh * 0.82, x + bw * 0.92, y + bh * 0.82);
    case 'fortress': {
      const t = bh * 0.22;
      let d = `M${x},${y + t}`;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = x + (bw / n) * i, b = x + (bw / n) * (i + 0.5), c = x + (bw / n) * (i + 1);
        d += ` L${a},${y} L${b},${y} L${b},${y + t} L${c},${y + t}`;
      }
      return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${sw}"/>` + X();
    }
    case 'naval': case 'marine': {
      const r = bh * 0.32;
      return `<path d="M${cx},${cy - r} L${cx},${cy + r} M${cx - r * 0.9},${cy + r * 0.2} Q${cx - r * 0.8},${cy + r * 1.05} ${cx},${cy + r} Q${cx + r * 0.8},${cy + r * 1.05} ${cx + r * 0.9},${cy + r * 0.2} M${cx - r * 0.45},${cy - r * 0.5} L${cx + r * 0.45},${cy - r * 0.5}" fill="none" stroke="${ink}" stroke-width="${sw}"/><circle cx="${cx}" cy="${cy - r * 1.08}" r="${r * 0.22}" fill="none" stroke="${ink}" stroke-width="${sw * 0.8}"/>` + (type === 'marine' ? X().replace(/stroke-width="[^"]+"/g, `stroke-width="${sw * 0.6}" opacity="0.5"`) : '');
    }
    case 'reserve': return X();
    case 'hq':
    default: {
      // 集团军/方面军：粗框 + 旗杆
      const fl = echelon === 'armygroup' || echelon === 'front' ? 0.5 : 0.36;
      return L(x + bw * 0.08, y + bh, x + bw * 0.08, y + bh + bh * fl) + `<text x="${cx}" y="${cy + bh * 0.2}" text-anchor="middle" font-size="${bh * 0.55}" font-family="WB Head, Oswald, sans-serif" font-weight="700" fill="${ink}">HQ</text>`;
    }
  }
}

export interface CounterSpec { side: Side; type: UnitType; echelon: Echelon; label: string; size: number }

/** 返回棋子的 SVG 内部片段（不含外层 <g>） */
export function counterSVG(c: CounterSpec): string {
  const S = c.size;
  const w = S, h = S * 0.9;
  const col = SIDE_COUNTER[c.side];
  const x0 = -w / 2, y0 = -h / 2;
  const bw = w * 0.6, bh = h * 0.36;
  const bx = -bw / 2, by = y0 + h * 0.2;
  const isHQ = c.type === 'hq';
  const label = c.label.length > 9 ? c.label.slice(0, 9) : c.label;
  const fs = label.length > 6 ? h * 0.19 : h * 0.23;
  return [
    // 纸板厚度阴影
    `<rect class="c-shadow" x="${x0 + 1.6}" y="${y0 + 2}" width="${w}" height="${h}" rx="2.5" fill="rgba(40,28,12,0.45)"/>`,
    `<rect class="c-body" x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2.5" fill="${col.bg}" stroke="${col.edge}" stroke-width="1"/>`,
    `<rect x="${x0 + 1.5}" y="${y0 + 1.5}" width="${w - 3}" height="${h - 3}" rx="1.5" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.8"/>`,
    // 梯队标记
    `<text x="0" y="${y0 + h * 0.165}" text-anchor="middle" font-size="${h * 0.14}" font-family="WB Head, Oswald, sans-serif" fill="${col.text}" letter-spacing="-0.3">${ECH_MARK[c.echelon]}</text>`,
    // 兵种方框
    `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${col.box}" stroke="${col.ink}" stroke-width="${isHQ ? 1.6 : 1.1}"/>`,
    glyph(c.type, bx, by, bw, bh, col.ink, c.echelon),
    // 番号
    `<text x="0" y="${y0 + h * 0.9}" text-anchor="middle" font-size="${fs}" font-family="WB Head, Oswald, 'WB Serif SC', sans-serif" font-weight="700" fill="${col.text}">${escapeXml(label)}</text>`,
  ].join('');
}

/** 状态覆盖层 */
export function statusOverlay(status: UnitStatus, S: number): string {
  const h = S * 0.9, w = S;
  switch (status) {
    case 'engaged':
      return `<g transform="translate(${w / 2 - 2},${-h / 2 + 2})"><path d="M0,-6 L1.8,-1.8 L6,-1.5 L2.6,1.2 L3.8,5.6 L0,3 L-3.8,5.6 L-2.6,1.2 L-6,-1.5 L-1.8,-1.8Z" fill="#f2b233" stroke="#7a2a0a" stroke-width="0.8"/></g>`;
    case 'encircled':
      return `<rect x="${-w / 2 - 4}" y="${-h / 2 - 4}" width="${w + 8}" height="${h + 8}" rx="6" fill="none" stroke="#c0282f" stroke-width="1.6" stroke-dasharray="3 2.2"/>`;
    case 'withdrawing':
      return `<path d="M${-w / 2 - 2},${h / 2 + 5} l-5,0 l2,-2.4 m-2,2.4 l2,2.4" stroke="#3a2a14" stroke-width="1.3" fill="none"/>`;
    case 'destroyed': case 'surrendered': case 'interned': case 'disbanded':
      return `<g opacity="0.85"><line x1="${-w / 2}" y1="${-h / 2}" x2="${w / 2}" y2="${h / 2}" stroke="#1a1208" stroke-width="2"/><line x1="${-w / 2}" y1="${h / 2}" x2="${w / 2}" y2="${-h / 2}" stroke="#1a1208" stroke-width="2"/></g>`;
    default: return '';
  }
}

export const STATUS_ZH: Record<UnitStatus, string> = {
  reserve: '预备', active: '行动中', engaged: '交战中', encircled: '被合围', withdrawing: '撤退中',
  destroyed: '被歼灭', surrendered: '已投降', interned: '越境被拘留', disbanded: '已解散',
};
export const TYPE_ZH: Record<UnitType, string> = {
  hq: '指挥部', armor: '装甲', light: '轻装（机械化）', motorized: '摩托化步兵', infantry: '步兵', mountain: '山地步兵',
  cavalry: '骑兵', cavalry_mech: '摩托化骑兵', border: '边防', fortress: '要塞/筑垒', naval: '海军', marine: '海岸防御', artillery: '炮兵', reserve: '预备队', airborne: '空降部队', air: '航空部队',
};
export const ECH_ZH: Record<Echelon, string> = { armygroup: '集团军群/统帅部', front: '方面军', army: '集团军', corps: '军/作战集群', division: '师', brigade: '旅' };
export const SIDE_ZH: Record<Side, string> = { DE: '德国', IT: '意大利', HU: '匈牙利', BG: '保加利亚', GR: '希腊', YU: '南斯拉夫', GB: '英国', AU: '澳大利亚', NZ: '新西兰' };

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
