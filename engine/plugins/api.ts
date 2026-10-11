/**
 * 插件接口：只有改变引擎行为、无法用 campaign.json 表达的功能才写成插件（见 docs/PLUGINS.md）。
 * 插件在 boot() 中、app 模块构建完成后调用 setup(ctx)，返回的钩子由引擎在相应时机调用。
 */
import type { CampaignManifest } from '../campaign/types';
import type { DB, REvent } from '../data/db';

export interface EngineCtx {
  manifest: CampaignManifest;
  db: DB;
  store: typeof import('../app/store').store;
  clock: typeof import('../app/clock').clock;
  audio: typeof import('../audio/audio').audio;
  map: import('../map2d/MapView').MapView;
  director: import('../app/director').Director;
  /** 界面挂载点 */
  ui: { root: HTMLElement; topbarButtons: HTMLElement; briefPane: HTMLElement };
}

export interface PluginHooks {
  /** 在作战简报面板追加内容（如克里特英文讲解） */
  sidebarBrief?(pane: HTMLElement): void;
  /** 顶栏按钮（如挪威「EN 旁白」开关） */
  topbar?(buttons: HTMLElement): void;
  /** 事件卡正文后追加的 HTML */
  eventCardExtra?(e: REvent): string | null;
  /** 导演展示事件时 */
  onPresent?(e: REvent, hold: boolean): void;
  /** 导演取消 / 时间跳转时 */
  onCancel?(): void;
  onTime?(t: number): void;
  onPlaying?(playing: boolean): void;
  onMute?(muted: boolean): void;
}

export interface CampaignPlugin {
  id: string;
  /** 插件追加的图层开关 */
  layers?: { key: string; label: string; default?: boolean }[];
  setup(ctx: EngineCtx): PluginHooks | void | Promise<PluginHooks | void>;
}

export function definePlugin(p: CampaignPlugin): CampaignPlugin { return p; }
