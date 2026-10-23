/** 莫斯科保卫战（1941—42）战役包入口：清单 + 投影配置 + 数据 + 插件。 */
import { defineCampaign, type CampaignManifest } from '../../engine/campaign/define';
import manifest from './campaign.json';
import frame from './config/frame.json';
import lod from './config/lod.json';
import { moscow } from './plugins/moscow';
import './campaign.css';

export default defineCampaign({
  manifest: manifest as unknown as CampaignManifest,
  frame: frame as never,
  lod,
  data: import.meta.glob('./data/**/*.json', { eager: true, import: 'default' }),
  // 展示插件：城门态势（德军前锋距克里姆林宫的几何估算 + 文献说法）与莫斯科逐日气温。
  // 只做展示，不改数据格式；数据在 data/ext/moscow/。
  plugins: [moscow()],
});
