# 插件

能用 `campaign.json` 表达的差异都写在清单里；只有**改变引擎行为**、清单无法表达的功能才写成插件。
空战控制场、出击航迹、飞行状态、事件框选镜头、空域叠加层这些能力属于引擎核心（由 `control.mode: "air"`、`director.camera: "frame"`、`data/overlays.json` 配置），插件只负责界面上的专属展示。

## 接口（`engine/plugins/api.ts`）

```ts
import { definePlugin } from '../../engine/plugins/api';

export const myPlugin = (opts: MyOptions) => definePlugin({
  id: 'my-plugin',
  layers: [{ key: 'myLayer', label: '我的图层', default: true }],   // 可选：追加图层开关
  setup(ctx) {                                                       // 界面构建完成后调用，可以是 async
    // ctx.manifest / ctx.db / ctx.store / ctx.clock / ctx.audio / ctx.map / ctx.director
    // ctx.ui.root / ctx.ui.topbarButtons / ctx.ui.briefPane
    return {
      sidebarBrief(pane) {},            // 在作战简报面板追加内容
      replaceBrief(pane) {},            // 整体接管作战简报（须保留 .sb-status 容器）
      sidebarStatus(t, el) { return false; },  // 接管「当前态势」区，返回 true 表示已处理
      topbar(buttons) {},               // 顶栏按钮
      eventCardExtra(e) { return null; },      // 事件卡正文后追加 HTML
      onPresent(e, hold) {},            // 导演展示事件
      onCancel() {},                    // 导演取消 / 时间跳转
      onTime(t) {}, onPlaying(playing) {}, onMute(muted) {},
    };
  },
});
```

在战役的 `campaign.ts` 里启用：

```ts
export default defineCampaign({ manifest, frame, lod, data, plugins: [myPlugin({ … })] });
```

插件自己的数据放在 `data/ext/<插件id>/<名>.json`，运行时在 `ctx.db.ext['<插件id>']['<名>']`；校验不会把它当成未知文件。插件的样式可以放进战役的 `campaign.css`，或在插件里注入。

## 内置插件

### `narration`（`engine/plugins/narration`）

两种旁白：

- `narration({ provider: 'clips' })` — 录制好的讲解片段（克里特）：简报面板里出现讲解列表，读取 `public/campaigns/<id>/audio/narration.json`。
- `narration({ provider: 'tts' })` — 浏览器语音合成（挪威）：顶栏「EN 旁白」开关，事件卡带英文讲解，事件的 `narration` 字段是讲解文本。

### `air`（`engine/plugins/air`）

不列颠空战：作战简报改为双方空军力量卡与空勤人员损失，「当前态势」显示代表编队数与正在出击的编队数。

```ts
air({
  lossLabels: { GB: 'RAF', DE: 'Luftwaffe' },
  statusCells: [['GB', 'units', 'RAF代表中队'], ['DE', 'units', '德军代表大队'], ['GB', 'flying', 'RAF出击编队'], ['DE', 'flying', '德军出击编队']],
})
```

## 什么时候写插件、什么时候改引擎

- 只有一个战役需要、且不影响数据格式 → 插件。
- 多个战役都会用到、或需要新的数据字段（新的移动方式、新的控制区模式、新的叠加层类型）→ 进引擎核心，同时更新 `engine/core/types.ts`、`engine/schema/zod.ts`、[DATA-FORMAT.md](DATA-FORMAT.md) 和测试，并保证缺省值让现有战役的行为不变（`npm test` 与 `npm run validate` 会提醒）。
