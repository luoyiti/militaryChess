/** 空战模式（control.mode = 'air'）专属检查：飞行速度、出击时长、空战掩膜只含陆地位。源自不列颠空战的旧版校验。 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Ctx } from '../validate';
import type { LonLat, Pos } from '../../../engine/core/types';
import { haversineKm } from '../../../engine/model/core';
import { publicDir } from '../../lib/campaign-node';

const MAX_KMH = 800; // 1940 年代战斗机/轰炸机巡航与俯冲都不可能超过
const MAX_SORTIE_H = 6;

type Track = { at: string; pos: Pos; flightPhase?: string }[];
export function airRules(c: Ctx, units: Map<string, { id: string; track: Track }>, routes: { id: string; role?: string; waypoints: { at: string; pos: Pos }[] }[]) {
  for (const u of units.values()) {
    let prev: { h: number; ll: LonLat | null; phase?: string } | null = null;
    for (const p of u.track) {
      const h = c.hours(p.at), ll = c.pos(p.pos, `${u.id}`, false);
      if (prev && ll && prev.ll && h > prev.h && !(prev.phase === 'at_base' && p.flightPhase === 'at_base')) {
        const km = haversineKm(prev.ll, ll), dt = h - prev.h;
        if (km > 1 && dt > MAX_SORTIE_H) c.E(`${u.id}: ${p.at} 前的飞行段跨 ${dt.toFixed(1)} 小时（空中阶段应拆成多段）`);
        if (km > 1 && km / dt > MAX_KMH) c.E(`${u.id}: ${p.at} 前的飞行速度 ${(km / dt).toFixed(0)} km/h 超过 ${MAX_KMH}`);
      }
      prev = { h, ll, phase: p.flightPhase };
    }
  }
  for (const r of routes) {
    const w = r.waypoints;
    for (let i = 1; i < w.length; i++) {
      const a = c.pos(w[i - 1].pos, r.id, false), b = c.pos(w[i].pos, r.id, false), dt = c.hours(w[i].at) - c.hours(w[i - 1].at);
      if (a && b && dt > 0 && haversineKm(a, b) / dt > MAX_KMH) c.E(`${r.id}[${i}]: 航线速度 ${(haversineKm(a, b) / dt).toFixed(0)} km/h 超过 ${MAX_KMH}`);
    }
    if (r.role && w.length > 1 && c.hours(w[w.length - 1].at) - c.hours(w[0].at) > MAX_SORTIE_H) c.E(`${r.id}: 出击任务超过 ${MAX_SORTIE_H} 小时`);
  }
  const masks = join(publicDir(c.id), 'geo/field_masks.bin');
  if (existsSync(masks)) {
    const land = 1 << c.m.control.landBit;
    for (const b of readFileSync(masks)) if (b !== 0 && b !== land) { c.E(`geo/field_masks.bin: 空战模式的掩膜只应含陆地位（${land}），发现 ${b}`); break; }
  }
}
