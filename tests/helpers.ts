/** 测试共用：在 Node 中打开一个战役（与浏览器 boot() 相同的初始化顺序），构建数据库与 SDF 场模型。 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCampaign, listCampaignIds, campaignDir, publicDir } from '../tools/lib/campaign-node';
import { buildDB, type DB } from '../engine/data/db';
import { store } from '../engine/app/store';
import { audio } from '../engine/audio/audio';
import { createModel, type KFInput, type FieldModel } from '../engine/geo/field/field';
import { fieldCfg, toGrid } from '../engine/geo/field/client';
import { FRAME, GRID } from '../engine/geo/frame';
import type { CampaignDef } from '../engine/campaign/types';

export const manifestOf = (id: string) => JSON.parse(readFileSync(join(campaignDir(id), 'campaign.json'), 'utf8'));
/** 有数据包的战役（不含筹备中的） */
export const PUBLISHED = listCampaignIds().filter((id) => manifestOf(id).status !== 'planned');

export interface Opened { def: CampaignDef; db: DB; m: CampaignDef['manifest'] }
/** 初始化战役上下文 + 状态 + 音频配置，返回独立构建的数据库（不经 getDB 缓存，便于同一文件切换战役） */
export function openCampaign(id: string): Opened {
  const def = loadCampaign(id);
  store.init(def.manifest, def.manifest.ui.extraLayers ?? []);
  audio.configure(def.manifest.audio);
  return { def, db: buildDB(def.data, def.manifest), m: def.manifest };
}

/** 与 field worker 相同的输入构建 SDF 场模型（需先 openCampaign） */
export function fieldModelFor(o: Opened): FieldModel {
  const buf = readFileSync(join(publicDir(o.def.manifest.id), 'geo/field_masks.bin'));
  const masks = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const kfs: KFInput[] = o.db.keyframes.map((k) => ({
    h: k.h,
    a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
    b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
    ...(k.transition ? { transition: k.transition } : {}),
  }));
  const clamp = Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell));
  return createModel({ w: GRID.w, h: GRID.h, cell: GRID.cell }, masks, kfs, clamp, fieldCfg(o.m.control));
}

/** 世界坐标多边形集合的面积（km²，洞扣除） */
export function areaKm2(polys: number[][][][]): number {
  let a = 0;
  for (const poly of polys) poly.forEach((ring, k) => {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a += (k === 0 ? 1 : -1) * Math.abs(s / 2);
  });
  return a * FRAME.kmPerUnit ** 2;
}
