/** 波兰九月战役（1939）战役包入口：清单 + 投影配置 + 数据 + 插件。 */
import { defineCampaign, type CampaignManifest } from '../../engine/campaign/define';
import manifest from './campaign.json';
import frame from './config/frame.json';
import lod from './config/lod.json';

export default defineCampaign({
  manifest: manifest as unknown as CampaignManifest,
  frame: frame as never,
  lod,
  data: import.meta.glob('./data/**/*.json', { eager: true, import: 'default' }),
});
