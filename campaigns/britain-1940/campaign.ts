/** 不列颠空战（1940）战役包入口：清单 + 投影配置 + 数据 + 空战插件。 */
import { defineCampaign, type CampaignManifest } from '../../engine/campaign/define';
import manifest from './campaign.json';
import frame from './config/frame.json';
import lod from './config/lod.json';
import { air } from '../../engine/plugins/air';

export default defineCampaign({
  manifest: manifest as unknown as CampaignManifest,
  frame: frame as never,
  lod,
  data: import.meta.glob('./data/**/*.json', { eager: true, import: 'default' }),
  plugins: [air({
    lossLabels: { GB: 'RAF', DE: '德国空军' },
    aircraftFallback: { GB: '战斗机', DE: '混合机群' },
    statusCells: [['GB', 'units', 'RAF代表中队'], ['DE', 'units', '德军代表大队'], ['GB', 'flying', 'RAF出击编队'], ['DE', 'flying', '德军出击编队']],
  })],
});
