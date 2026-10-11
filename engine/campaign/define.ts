/** 战役包入口：campaigns/<id>/campaign.ts 调用 defineCampaign({...}) 并默认导出。 */
import type { CampaignInput, CampaignDef } from './types';

export function defineCampaign(input: CampaignInput): CampaignDef {
  if (input.manifest.schemaVersion !== 2) throw new Error(`campaign.json schemaVersion 须为 2（${input.manifest.id}）`);
  return { ...input, plugins: input.plugins ?? [] };
}
export type { CampaignInput, CampaignDef, CampaignManifest } from './types';
