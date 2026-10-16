/**
 * 部队卡的舰船档案（unit.ship）：要目（舰级、舷号、排水量、尺度、航速、编制、主炮）、侧视损伤图（炮塔按 atPct，
 * 打哑的武器划红叉，命中部位、起火、横倾、完好度）、当前航向航速、累计伤亡与命中记录。随时间刷新（UnitCard.updateTime）。
 */
import type { DB } from '../data/db';
import type { RUnit } from '../model/core';
import { unitStateAt } from '../model/core';
import { damageAt, type DamageView, type RHit } from '../naval/model';
import { hoursToDate } from '../core/time';
import { escapeXml } from '../map2d/symbols';
import { shipLayout, silhouetteSVG, calLabel, hitLocation, type ShipLayout, type ShipPalette } from '../map2d/navalSilhouettes';
import { sideDef } from '../campaign/context';
import '../styles/naval.css';

const p2 = (n: number) => String(n).padStart(2, '0');
const hhmm = (h: number) => { const d = hoursToDate(h); return `${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}`; };
const TONNAGE_ZH = { std: '标准排水量', full: '满载排水量', grt: '总登记吨' } as const;
const KIND_ZH: Record<string, string> = {
  battleship: '战列舰', battlecruiser: '战列巡洋舰', pocket_battleship: '装甲舰（袖珍战列舰）', carrier: '航空母舰', heavy_cruiser: '重巡洋舰',
  light_cruiser: '轻巡洋舰', destroyer: '驱逐舰', submarine: '潜艇', auxiliary: '辅助舰船', tanker: '油船 / 补给舰', merchant: '商船', liner: '客轮', tug: '拖船', boat: '小艇',
};

function paletteOf(u: RUnit): ShipPalette {
  try {
    const s = sideDef(u.side);
    return { fill: s.counter.bg, edge: s.counter.edge, deck: '#d9cfb6', ink: '#231d14', paper: '#f1e8d0' };
  } catch { return { fill: '#6b6253', edge: '#3b3226', deck: '#d9cfb6', ink: '#231d14', paper: '#f1e8d0' }; }
}

/** 部队卡标题处的俯视剪影 */
export function shipHeadSVG(u: RUnit, t?: number, db?: DB): string {
  if (!u.ship) return '';
  const lay = shipLayout(u.ship);
  const out = db && t !== undefined ? damageAt(db.naval, u.id, t).gunsOut : undefined;
  return silhouetteSVG(lay, paletteOf(u), 118, 34, out);
}

/** 舰船要目 + 动态部分的容器 */
export function shipSectionHTML(u: RUnit): string {
  const sh = u.ship;
  if (!sh) return '';
  const ws = sh.weapons ?? [];
  const battery = (kind: string) => {
    const g = new Map<string, number>();
    for (const w of ws.filter((x) => x.kind === kind)) { const k = calLabel(w) || w.cal; g.set(k, (g.get(k) ?? 0) + (w.mounts ?? 1) * (w.perMount ?? 1)); }
    return [...g.entries()].map(([c, n]) => `${n} × ${escapeXml(c)}`).join('，');
  };
  const main = battery('main'), sec = battery('secondary'), tt = battery('torpedo');
  const cell = (label: string, v: string, small = '') => `<div><label>${label}</label><span>${v}${small ? `<small>${small}</small>` : ''}</span></div>`;
  return `<div class="uc-ship" data-ship="${escapeXml(u.id)}">
    <div class="sp-grid">
      ${cell('舰种', KIND_ZH[sh.kind] ?? sh.kind, sh.flag ? `船旗：${escapeXml(sh.flag)}` : '')}
      ${sh.class ? cell('舰级', escapeXml(sh.class.zh), escapeXml(sh.class.orig ?? '')) : ''}
      ${sh.pennant ? cell('舷号', escapeXml(sh.pennant)) : ''}
      ${sh.tonnage ? cell(TONNAGE_ZH[sh.tonnageKind ?? 'std'], `${sh.tonnage.toLocaleString('en-US')} ${sh.tonnageKind === 'grt' ? '总吨' : '吨'}`) : ''}
      ${sh.lengthM ? cell('尺度', `${sh.lengthM}${sh.beamM ? ` × ${sh.beamM}` : ''} 米`, sh.beamM ? '舰长 × 舰宽' : '舰长') : ''}
      ${sh.maxKn ? cell('最大航速', `${sh.maxKn} 节`) : ''}
      ${sh.crew ? cell('编制', `约 ${sh.crew.toLocaleString('en-US')} 人`) : ''}
      ${main ? cell('主炮', main) : ''}
      ${sec ? cell('副炮', sec) : ''}
      ${tt ? cell('鱼雷', tt) : ''}
    </div>
    <div class="sp-diagram"></div>
    <div class="sp-now"></div>
    <div class="sp-note"></div>
    <div class="sp-log"></div>
  </div>`;
}

/** 卡片的动态部分：损伤图、航向航速、伤亡、命中记录 */
export class ShipPanel {
  private lay: ShipLayout;
  private sig = '';
  private nowText = '';
  private nowEl: HTMLElement | null;
  private shownHits = new Set<string>();
  constructor(readonly el: HTMLElement, readonly u: RUnit, readonly db: DB) {
    this.lay = shipLayout(u.ship!);
    this.nowEl = el.querySelector('.sp-now');
  }

  update(t: number) {
    const u = this.u, nav = this.db.naval;
    const dmg = damageAt(nav, u.id, t);
    const s = unitStateAt(u.id, this.db.units, t);
    // 航向 / 航速 / 伤亡（每次刷新）
    const now = this.nowEl;
    if (now) {
      const parts: string[] = [];
      if (s?.courseDeg !== undefined) parts.push(`航向 <b>${String(Math.round(s.courseDeg) % 360).padStart(3, '0')}°</b>`);
      if (s?.speedKn !== undefined) parts.push(`航速 <b>${Math.round(s.speedKn)}</b> 节`);
      if (dmg.speedKn !== undefined && (u.ship?.maxKn === undefined || dmg.speedKn < u.ship.maxKn)) parts.push(`<span class="sp-warn">受损限速 ${dmg.speedKn} 节</span>`);
      if (dmg.killed || dmg.wounded) parts.push(`<span class="sp-warn">阵亡 ${dmg.killed}${dmg.wounded ? ` · 受伤 ${dmg.wounded}` : ''}</span>`);
      const text = parts.join('');
      if (text !== this.nowText) { this.nowText = text; now.innerHTML = text; }
    }
    const sig = `${dmg.hits.length}|${dmg.state?.h ?? ''}|${[...dmg.gunsOut].join(',')}|${dmg.fire}|${this.scored(t).length}`;
    if (sig === this.sig) return;
    const first = this.sig === '';
    this.sig = sig;
    (this.el.querySelector('.sp-diagram') as HTMLElement).innerHTML = this.diagram(dmg);
    (this.el.querySelector('.sp-note') as HTMLElement).textContent = dmg.state?.note ?? '';
    const log = this.el.querySelector('.sp-log') as HTMLElement;
    const scored = this.scored(t);
    const row = (h: RHit, i: number, mine: boolean) => {
      const other = this.db.units.get(mine ? h.target : h.shooter ?? '');
      const isNew = !first && !this.shownHits.has(h.id);
      this.shownHits.add(h.id);
      const who = other ? `（${escapeXml(other.name.short ?? other.name.zh)}）` : '';
      const loss = [h.killed ? `阵亡 ${h.killed}` : '', h.wounded ? `受伤 ${h.wounded}` : ''].filter(Boolean).join('，');
      return `<div class="sp-hit sv${h.severity}${isNew ? ' new' : ''}"><span>${hhmm(h.h)}</span><span>${mine ? '' : `<em>${i + 1}</em>`}${escapeXml(h.location ?? '')}${h.location ? ' · ' : ''}${escapeXml(h.effect)}${mine ? '' : who}${loss ? ` <small>${loss}</small>` : ''}${mine ? ` <small>→ ${who.replace(/[（）]/g, '')}</small>` : ''}</span></div>`;
    };
    log.innerHTML = `<label>中弹记录（${dmg.hits.length}）</label>${dmg.hits.length ? dmg.hits.map((h, i) => row(h, i, false)).join('') : '<div class="sp-none">尚无中弹</div>'}`
      + (scored.length ? `<label style="margin-top:6px">本舰命中（${scored.length}）</label>${scored.map((h, i) => row(h, i, true)).join('')}` : '');
  }

  private scored(t: number): RHit[] { return this.db.naval.hits.filter((h) => h.shooter === this.u.id && h.h <= t); }

  /** 侧视损伤图（舰艏朝右） */
  private diagram(dmg: DamageView): string {
    const lay = this.lay, pal = paletteOf(this.u);
    const W = 360, X0 = 10, LEN = 300, WL = 74;
    const fb = lay.spec.freeboard ?? [0.05, 0.032, 0.028];
    const HV = 1.7; // 干舷夸大
    const x = (f: number) => X0 + (1 - f) * LEN;
    const deck = (f: number) => {
      const v = f < 0.35 ? fb[0] + (fb[1] - fb[0]) * Math.pow(f / 0.35, 0.7) : fb[1] + (fb[2] - fb[1]) * ((f - 0.35) / 0.65);
      return WL - v * LEN * HV;
    };
    const n = (v: number) => v.toFixed(1);
    let svg = '';
    // 海面
    svg += `<path d="M0,${WL + 0.5} H${W}" stroke="#3d6470" stroke-width="1"/>`;
    let wave = `M0,${WL + 5}`;
    for (let i = 0; i < W; i += 12) wave += ` q3,-2 6,0 t6,0`;
    svg += `<path d="${wave}" fill="none" stroke="rgba(61,100,112,.35)" stroke-width=".8"/>`;
    // 舰体（剖面）
    const pts: string[] = [];
    for (let i = 0; i <= 20; i++) { const f = i / 20; pts.push(`${n(x(f))},${n(deck(f))}`); }
    const bowTop = `${n(x(0))},${n(deck(0))}`;
    const civil = !!lay.spec.civil;
    const hull = `M${bowTop} L${pts.slice(1).join(' L')} Q${n(x(1) + 4)},${n(WL - 4)} ${n(x(0.985))},${WL} L${n(x(0.04))},${WL} Q${n(x(0.01))},${n(WL - 6)} ${bowTop} Z`;
    svg += `<path d="${hull}" fill="${pal.fill}" stroke="${pal.edge}" stroke-width="1.1" stroke-linejoin="round"/>`;
    svg += `<path d="M${n(x(0.035))},${WL - 1.5} H${n(x(0.985))}" stroke="#1d160c" stroke-width="2"/>`; // 水线涂装
    if (!civil) svg += `<path d="M${n(x(0.08))},${n(deck(0.08) + 4)} L${pts.slice(2, 19).map((p) => { const [a, b] = p.split(','); return `${a},${n(Number(b) + 4)}`; }).join(' L')}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`;
    // 上层建筑
    const supH = (h: number) => h * LEN;
    for (const b of lay.blocks) {
      if (b.kind === 'hatch' || b.kind === 'boat' || b.kind === 'forecastle') continue;
      const f0 = 0.5 - Math.max(b.x0, b.x1), f1 = 0.5 - Math.min(b.x0, b.x1);
      const base = Math.min(deck(f0), deck(f1)), h = supH(b.h ?? 0.04);
      if (b.kind === 'tower') {
        const xm = (x(f0) + x(f1)) / 2, wd = Math.abs(x(f1) - x(f0));
        svg += `<path d="M${n(x(f1))},${n(base)} L${n(xm + wd * 0.18)},${n(base - h)} L${n(xm - wd * 0.18)},${n(base - h)} L${n(x(f0))},${n(base)} Z" fill="${pal.paper}" stroke="${pal.edge}" stroke-width=".9"/>`;
        svg += `<rect x="${n(xm - wd * 0.32)}" y="${n(base - h - 4)}" width="${n(wd * 0.64)}" height="4" fill="${pal.ink}"/>`;
        svg += `<path d="M${n(xm)},${n(base - h - 4)} V${n(base - h - 14)}" stroke="${pal.ink}" stroke-width="1"/>`;
      } else {
        svg += `<rect x="${n(x(f1))}" y="${n(base - h)}" width="${n(Math.abs(x(f0) - x(f1)))}" height="${n(h)}" fill="${pal.paper}" stroke="${pal.edge}" stroke-width=".8"/>`;
        if (b.kind === 'bridge') svg += `<rect x="${n(x(f1) + 2)}" y="${n(base - h - 4)}" width="${n(Math.abs(x(f0) - x(f1)) * 0.55)}" height="4" fill="${pal.paper}" stroke="${pal.edge}" stroke-width=".7"/>`;
      }
    }
    // 烟囱（略后倾）
    for (const fn of lay.funnels) {
      const f = 0.5 - fn.x, w = Math.max(5, fn.len * LEN), h = supH(fn.h ?? 0.07), base = deck(f), cx = x(f), rake = h * 0.12;
      svg += `<path d="M${n(cx + w / 2)},${n(base)} L${n(cx + w / 2 - rake)},${n(base - h)} L${n(cx - w / 2 - rake)},${n(base - h)} L${n(cx - w / 2)},${n(base)} Z" fill="${pal.ink}"/>`;
      svg += `<path d="M${n(cx + w / 2 - rake)},${n(base - h + 3)} H${n(cx - w / 2 - rake)}" stroke="rgba(240,232,212,.5)" stroke-width="1"/>`;
    }
    // 桅杆
    for (const mx of lay.masts) {
      const f = 0.5 - mx, base = deck(f);
      svg += `<path d="M${n(x(f))},${n(base)} V${n(base - LEN * 0.12)} M${n(x(f) - 5)},${n(base - LEN * 0.095)} H${n(x(f) + 5)}" stroke="${pal.ink}" stroke-width="1"/>`;
    }
    // 弹射器
    if (lay.catapult) {
      const f = 0.5 - lay.catapult.x, base = deck(f) - 3, hl = (lay.catapult.len * LEN) / 2;
      svg += `<path d="M${n(x(f) - hl)},${n(base)} H${n(x(f) + hl)}" stroke="${pal.ink}" stroke-width="1.6"/><path d="M${n(x(f) - 3)},${n(base - 3)} h7 M${n(x(f))},${n(base - 5)} v4" stroke="${pal.ink}" stroke-width="1.2"/>`;
    }
    // 武器（炮塔、副炮、鱼雷管）
    const out = dmg.gunsOut;
    const cross = (cx: number, cy: number, r: number) => `<path d="M${n(cx - r)},${n(cy - r)} L${n(cx + r)},${n(cy + r)} M${n(cx - r)},${n(cy + r)} L${n(cx + r)},${n(cy - r)}" stroke="#f6eedb" stroke-width="3.6" stroke-linecap="round"/><path d="M${n(cx - r)},${n(cy - r)} L${n(cx + r)},${n(cy + r)} M${n(cx - r)},${n(cy + r)} L${n(cx + r)},${n(cy - r)}" stroke="#c0222b" stroke-width="1.9" stroke-linecap="round"/>`;
    const crossed = new Set<string>();
    for (const tr of lay.turrets) {
      const f = 0.5 - tr.x;
      if (tr.small) {
        if (tr.y < 0) continue; // 侧视只画一舷
        const bx = x(f), by = deck(f) - 3;
        svg += `<rect x="${n(bx - 2.5)}" y="${n(by - 2.5)}" width="5" height="4" fill="${pal.ink}"/><path d="M${n(bx + 2)},${n(by - 1)} h4" stroke="${pal.ink}" stroke-width=".9"/>`;
        if (tr.id && out.has(tr.id) && !crossed.has(tr.id)) { crossed.add(tr.id); svg += cross(bx, by - 1, 4); }
        continue;
      }
      const tw = Math.max(11, tr.d * LEN * 1.15), th = 6, lift = tr.sup ? 6 : 0;
      const base = deck(f) - lift, cx = x(f), dir = tr.aft ? -1 : 1;
      if (lift) svg += `<rect x="${n(cx - tw * 0.32)}" y="${n(base)}" width="${n(tw * 0.64)}" height="${lift}" fill="${pal.paper}" stroke="${pal.edge}" stroke-width=".7"/>`;
      const bl = Math.max(9, tr.barrel * LEN);
      svg += `<path d="M${n(cx + dir * tw * 0.4)},${n(base - th * 0.55)} l${n(dir * bl)},${n(-bl * 0.06)}" stroke="${pal.ink}" stroke-width="${tr.calMm >= 250 ? 2 : 1.5}"/>`;
      svg += `<path d="M${n(cx - tw / 2)},${n(base)} V${n(base - th + 1.5)} Q${n(cx - tw / 2)},${n(base - th)} ${n(cx - tw / 2 + 2)},${n(base - th)} H${n(cx + tw / 2 - 1)} L${n(cx + tw / 2)},${n(base)} Z" fill="${pal.ink}" ${dir < 0 ? `transform="translate(${n(2 * cx)},0) scale(-1,1)"` : ''}/>`;
      if (tr.id) svg += `<text x="${n(cx)}" y="${n(base - th - 3)}" text-anchor="middle" class="sp-tid" font-size="8.5" font-family="WB Typewriter, Special Elite, monospace" fill="${out.has(tr.id) ? '#a8262d' : '#4a3e2c'}">${escapeXml(tr.id)}</text>`;
      if (tr.id && out.has(tr.id)) svg += cross(cx, base - th / 2, 5.2);
    }
    for (const tb of lay.tubes) {
      if (tb.y < 0) continue;
      const f = 0.5 - tb.x, bx = x(f), by = deck(f) - 2.5;
      svg += `<rect x="${n(bx - 5)}" y="${n(by - 1.5)}" width="10" height="3" fill="${pal.ink}"/>`;
    }
    const tubeW = (this.u.ship?.weapons ?? []).filter((w) => w.kind === 'torpedo' && out.has(w.id));
    for (const w of tubeW) { const f = (w.atPct ?? 55) / 100; svg += cross(x(f), deck(f) - 3, 4); }
    // 命中部位（编号与下方记录对应）
    const marks = new Map<number, number[]>();
    dmg.hits.forEach((h, i) => {
      const f = hitLocation(h.location, h.gunsOut, lay);
      if (f === null) return;
      const key = Math.round(f * 40);
      marks.set(key, [...(marks.get(key) ?? []), i + 1]);
    });
    for (const [key, ids] of marks) {
      const f = key / 40, cx = x(f), cy = (deck(f) + WL) / 2;
      svg += `<path d="${burst(cx, cy, 6.5, 3)}" fill="#c0222b" stroke="#f6eedb" stroke-width=".8"/>`;
      svg += `<text x="${n(cx)}" y="${n(WL + 13)}" text-anchor="middle" font-size="8.5" font-family="WB Typewriter, Special Elite, monospace" fill="#a8262d">${ids.join('·')}</text>`;
      svg += `<path d="M${n(cx)},${n(cy + 6)} V${n(WL + 4)}" stroke="rgba(168,38,45,.5)" stroke-width=".7" stroke-dasharray="1.5 1.5"/>`;
    }
    // 起火：火焰与烟
    if (dmg.fire) {
      const last = dmg.hits[dmg.hits.length - 1];
      const f = (last && hitLocation(last.location, last.gunsOut, lay)) ?? 0.45, cx = x(f), base = deck(f);
      svg += `<g class="sp-fire"><ellipse cx="${n(cx - 14)}" cy="${n(base - 30)}" rx="16" ry="8" fill="rgba(48,40,32,.35)"/><ellipse cx="${n(cx - 6)}" cy="${n(base - 20)}" rx="10" ry="6" fill="rgba(48,40,32,.45)"/>`
        + `<path d="M${n(cx)},${n(base)} c-6,-4 -5,-10 -1,-15 c0,5 3,6 4,3 c1,-4 4,-6 6,-9 c0,6 5,9 2,16 c3,-1 4,-3 4,-5 c2,5 0,9 -4,10 Z" fill="#e8762a" stroke="#a8262d" stroke-width=".8"/>`
        + `<path d="M${n(cx + 2)},${n(base)} c-3,-3 -2,-6 0,-8 c1,3 3,3 3,1 c2,2 2,5 0,7 Z" fill="#ffd36a"/></g>`;
    }
    // 横倾（艉视剖面）
    const list = dmg.state?.listDeg ?? 0;
    let listSvg = '';
    if (list) {
      const cx = W - 22, cy = 40;
      listSvg = `<g transform="translate(${cx},${cy})"><path d="M-14,10 H14" stroke="#3d6470" stroke-width="1"/><g transform="rotate(${-list})"><path d="M-10,-4 L10,-4 L8,6 Q0,11 -8,6 Z" fill="${pal.fill}" stroke="${pal.edge}" stroke-width=".9"/><rect x="-3" y="-12" width="6" height="8" fill="${pal.paper}" stroke="${pal.edge}" stroke-width=".7"/></g></g>`;
    }
    const integ = Math.round(dmg.integrity * 100);
    const col = dmg.integrity >= 0.75 ? '#3f6b45' : dmg.integrity >= 0.45 ? '#b07a1e' : '#a8262d';
    const outList = [...out].filter((id) => lay.turrets.some((t) => t.id === id) || (this.u.ship?.weapons ?? []).some((w) => w.id === id));
    const outLbl = outList.map((id) => (this.u.ship?.weapons ?? []).find((w) => w.id === id)?.label ?? id);
    return `<svg viewBox="0 0 ${W} 92" aria-label="侧视损伤图">${svg}${listSvg}</svg>
      <div class="sp-cap"><span class="sp-integrity">完好度 <i style="--v:${integ}%;--c:${col}"></i> ${integ}%</span><span>${list ? `${list > 0 ? '右' : '左'}倾 ${Math.abs(list)}°` : ''}${dmg.fire ? `${list ? ' · ' : ''}<b style="color:#a8262d">起火</b>` : ''}</span></div>
      ${outLbl.length ? `<div class="sp-cap"><span style="color:#a8262d">失去战斗力：${outLbl.map(escapeXml).join('、')}</span></div>` : ''}`;
  }
}

/** 星形爆点 */
function burst(cx: number, cy: number, r: number, r2: number): string {
  let d = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r2 : r * (i % 4 === 0 ? 1 : 0.78);
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + 'Z';
}
