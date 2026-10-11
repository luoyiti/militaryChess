/**
 * 引擎入口：campaigns/<id>/main.ts 调用 boot(campaign)。
 * 顺序很重要：先初始化战役上下文（清单、时间纪元、投影、阵营、主题、状态），再动态导入 app 模块，
 * 保证任何模块读取战役常量时都已初始化。
 */
import './styles/main.css';
import type { CampaignDef } from './campaign/types';
import { initCampaign } from './campaign/context';
import { applyTheme } from './campaign/theme';
import { initTime } from './core/time';
import { initPhases } from './core/phases';
import { initFrame } from './geo/frame';
import { setSides, overrideLabels } from './map2d/symbols';
import { store } from './app/store';
import { audio } from './audio/audio';

export async function boot(c: CampaignDef) {
  try {
    const m = c.manifest;
    initCampaign(c);
    initTime(m.time);
    initFrame(c.frame);
    initPhases(m.phases);
    setSides(m.sides, { counterSideCode: m.display?.counterSideCode });
    overrideLabels(m.ui.labels);
    applyTheme(m);
    store.init(m, c.plugins.flatMap((p) => p.layers ?? []));
    audio.configure(m.audio);
    const { start } = await import('./app/start');
    await start(c);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    document.body.insertAdjacentHTML('beforeend', `<div class="fatal">加载失败：${msg}<br/><a href="../../">返回作战总台</a></div>`);
  }
}

export { defineCampaign } from './campaign/define';
export type { CampaignDef, CampaignManifest } from './campaign/types';
