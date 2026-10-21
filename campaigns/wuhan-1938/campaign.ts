/** 武汉会战（1938）战役包入口：清单 + 投影配置 + 数据 + 插件。由 npm run new-campaign 生成。 */
import { defineCampaign, type CampaignManifest } from '../../engine/campaign/define';
import manifest from './campaign.json';
import frame from './config/frame.json';
import lod from './config/lod.json';

export default defineCampaign({
  manifest: manifest as unknown as CampaignManifest,
  frame: frame as never,
  lod,
  data: import.meta.glob('./data/**/*.json', { eager: true, import: 'default' }),
  plugins: [], // 例：narration({ provider: 'tts' })、air()，见 docs/PLUGINS.md
});
