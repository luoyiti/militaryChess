/** Node 端加载战役包（校验、parity、测试共用）：读取 campaign.json / config / data，并初始化引擎上下文。 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import type { CampaignDef } from '../../engine/campaign/types';
import { initCampaign } from '../../engine/campaign/context';
import { initTime } from '../../engine/core/time';
import { initPhases } from '../../engine/core/phases';
import { initFrame } from '../../engine/geo/frame';
import { setSides } from '../../engine/map2d/symbols';

export const ROOT = resolve(import.meta.dirname, '../..');
export const campaignDir = (id: string) => join(ROOT, 'campaigns', id);
export const publicDir = (id: string) => join(ROOT, 'public/campaigns', id);
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

/** data/** 下全部 JSON，键与浏览器端 import.meta.glob 一致（'./data/oob/de.json'） */
export function readDataFiles(id: string): Record<string, unknown> {
  const base = campaignDir(id);
  const out: Record<string, unknown> = {};
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.json')) out['./' + relative(base, p).split('\\').join('/')] = readJson(p);
    }
  };
  walk(join(base, 'data'));
  return out;
}

export function loadCampaign(id: string, opts: { init?: boolean } = { init: true }): CampaignDef {
  const dir = campaignDir(id);
  const def: CampaignDef = {
    manifest: readJson(join(dir, 'campaign.json')),
    frame: readJson(join(dir, 'config/frame.json')),
    lod: readJson(join(dir, 'config/lod.json')),
    data: readDataFiles(id),
    plugins: [],
  };
  if (opts.init !== false) {
    initCampaign(def);
    initTime(def.manifest.time);
    initFrame(def.frame);
    initPhases(def.manifest.phases);
    setSides(def.manifest.sides);
  }
  return def;
}

export function listCampaignIds(): string[] {
  const dir = join(ROOT, 'campaigns');
  return readdirSync(dir).filter((d) => existsSync(join(dir, d, 'campaign.json'))).sort();
}
