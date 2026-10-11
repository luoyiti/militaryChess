/** 当前战役上下文（每个页面只加载一个战役）。boot() 最先调用 initCampaign()；之前读取会抛错。 */
import type { CampaignDef, CampaignManifest, SideDef } from './types';
import type { Side } from '../core/types';

let current: CampaignDef | null = null;
const sideMap = new Map<Side, SideDef>();

export function initCampaign(c: CampaignDef) {
  current = c;
  sideMap.clear();
  for (const s of c.manifest.sides) sideMap.set(s.id, s);
}

export function campaign(): CampaignDef {
  if (!current) throw new Error('战役上下文未初始化（initCampaign）');
  return current;
}
export const manifest = (): CampaignManifest => campaign().manifest;

export function sideDef(id: Side): SideDef {
  const s = sideMap.get(id);
  if (!s) throw new Error(`未在 campaign.json 中声明的阵营 ${id}`);
  return s;
}
/** 兵力表、图例、序列树的阵营顺序 */
export const sideOrder = (): Side[] => manifest().sideOrder ?? manifest().sides.map((s) => s.id);
export const sidesOf = (coalition: SideDef['coalition']): Side[] => manifest().sides.filter((s) => s.coalition === coalition).map((s) => s.id);
