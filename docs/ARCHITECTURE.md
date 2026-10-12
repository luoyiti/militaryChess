# 架构

一个引擎、一套战役包格式、一个总台入口。新增战役 = 新增一个 `campaigns/<id>/` 目录，构建时自动发现。

## 1. 构建：一个 Vite 多页应用

- `vite.config.ts` 以 `appType: 'mpa'`、`base: './'` 构建：入口是根目录 `index.html`（总台）加上每个可构建战役的 `campaigns/<id>/index.html`。产物里所有路径都是相对路径，`dist/` 可以放在任意子目录下用静态服务器打开。
- **战役发现**（`tools/vite/catalog.ts`）：扫描 `campaigns/*/campaign.json`。
  - `published`：构建并出现在总台；`draft`：只在开发服务器里出现；`planned`：只在总台显示加封卷宗，没有页面。
  - 提供虚拟模块 `virtual:campaign-catalog`：每个战役的标题、时间、交战方、总台卷宗（`hub`）、封面署名，以及构建时统计的部队/事件/态势帧/照片数（永远与数据一致）。
  - 开发时 `/campaigns/<id>` 自动 301 到带斜杠的地址；新增、删除或修改清单会刷新目录并重载页面。
  - 每个战役页面内联注入转场幕布 `shared/handoff/`（`<head>` 里的样式与 View Transition 声明、`<body>` 开头的脚本），保证从总台进入时第一帧就是总台交来的画面。
- **大体积资产**在 `public/campaigns/<id>/`（瓦片、矢量、地形、照片、署名），由 Vite 自带的 public 目录服务并原样复制。战役页面与它的资产同一路径，所以页面内的相对请求（`geo/vectors.topo.json`、`tiles/base/…`、`photos/index.json`）不需要任何改写。
- **共享资源**在 `shared/`：字体子集（`fonts.css` 由引擎 CSS `@import`）、音效 sprite 与音乐库（`?url` 导入），打包后带内容哈希，所有页面共用一份缓存。

## 2. 运行时上下文：`boot()`

引擎模块**不得静态导入任何战役的 JSON**（测试 `tests/engine/boundaries.test.ts` 强制检查）。战役页面的 `main.ts` 只有一行 `boot(campaign)`，顺序是：

```
initCampaign(def)        清单、阵营表（engine/campaign/context.ts）
initTime(manifest.time)  纪元、播放区间、每秒小时数（engine/core/time.ts）
initFrame(frame)         投影、画布尺寸、km/单位、SDF 网格（engine/geo/frame.ts）
initPhases(phases)       阶段 / 章节（engine/core/phases.ts）
setSides / overrideLabels  棋子配色、阵营中文名、梯队标签（engine/map2d/symbols.ts）
applyTheme(manifest)     生成 CSS 变量：.side-XX、--accent、控制区槽位样式（engine/campaign/theme.ts）
store.init / audio.configure
await import('./app/start')   构建界面；插件在这里 setup
```

取值都用 ES 模块的 `export let` 活绑定或在构造函数里读取，因此「导入所有模块而不初始化」不会抛错，「初始化之前就取值」会立即抛出明确的错误。Node 端（校验、测试、parity）用 `tools/lib/campaign-node.ts` 的 `loadCampaign(id)` 走同样的初始化。

## 3. 引擎模块

| 目录 | 职责 |
|---|---|
| `engine/core/` | 运行时类型（数据格式 v2）、时间换算（带日历校验）、阶段 |
| `engine/campaign/` | 清单类型 `CampaignManifest`、上下文、主题 CSS |
| `engine/data/db.ts` | 把 `data/**` 的 JSON 按目录约定解析为可查询的数据库（地名解析、部队树、关键帧、事件、叠加层、插件数据 `ext/`） |
| `engine/model/` | 轨迹插值（陆、海、铁路、空中飞行阶段）、路线进度与淡出、出击航迹（`flight.ts`） |
| `engine/geo/` | 投影与画布、SDF 控制区场（Web Worker 计算；两个占领槽 a/b + 剩余战区，支持延迟战区、step 过渡、空战模式） |
| `engine/map2d/` | 2D 纸质地图：瓦片底图、静态矢量与地名、动态层（控制区、战线、箭头、包围圈、分界线）、棋子、特效 |
| `engine/three/` | 3D 沙盘（three.js，按需加载）：地形、控制区着色、部队手办与模型库 |
| `engine/ui/` | 侧栏（简报 / 战斗序列 / 图例）、时间轴（普通与章节式）、事件卡、部队卡、开场、资料面板 |
| `engine/app/` | 状态 store、播放时钟、导演（驻留、运镜、音效、特效、配乐）、镜头框选、主程序 `start.ts` |
| `engine/audio/` | 音效 sprite + 程序化合成回退、配乐（按时间表切换或单曲底乐） |
| `engine/plugins/` | 插件接口与内置插件（`narration`、`air`），见 [PLUGINS.md](PLUGINS.md) |
| `engine/schema/zod.ts` | 数据格式的 zod 校验（**只在 Node 使用**，不进入浏览器包） |

战役之间的差异全部写在 `campaign.json` 里：阵营与配色、控制区模式与掩膜比特、阶段、地图适配与标注、3D 参数、导演运镜方式与警报、配乐与战场氛围、侧栏简报与图例、开场与资料文字、总台卷宗。字段说明见 `engine/campaign/types.ts` 的注释与 [DATA-FORMAT.md](DATA-FORMAT.md)。

## 4. 控制区（SDF 场）

每个关键帧 `data/fronts/<时刻>.json` 给出各槽位的多边形。Worker 把多边形栅格化到 `frame.field` 网格并求有符号距离场，相邻关键帧之间对距离场线性插值（`transition: "step"` 时保持上一帧），再用 marching squares 生成平滑的占领区与接触线。场掩膜 `geo/field_masks.bin` 的每个比特标记一类格子：陆地、战区（`control.theatreBits`）、各槽位的本土（`slots[].homeBits`，占领区并入本土）、延迟启用的战区（`control.deferred`）。空战模式（`control.mode: "air"`）下两个槽位是可以重叠、跨越海面的原始区域。

## 5. 作战总台

`hub/` 是一个独立页面，地图铺满屏幕，其余界面都是浮在地图上的面板：

| 模块 | 职责 |
|---|---|
| `geo.ts` | 米勒圆柱投影（中央经线 39°E，切口在 141°W，太平洋战区完整），世界坐标与经纬度框换算 |
| `basemap.ts` | Canvas 底图：几何一次性投影成 Path2D，每帧只换变换矩阵；阵营着色、国界与分界线、河湖、经纬网、地名避让、图框刻度、转场快照 |
| `map.ts` | SVG 覆盖层（战区、火漆印避让与引线、模板字、红线）、d3-zoom 镜头与 van Wijk 平滑飞行、阵营时间表（殖民地继承宗主国）、分区取景 |
| `dossier.ts` | 卷宗面板：索引（交战国筛选、按分区排列）与卷宗页 |
| `tape.ts` | 电报纸带：时间窗来自 `world.json`，跨度条颜色取发起方阵营 |
| `transition.ts` | 进入 / 返回战役的转场（见下） |

**数据**：`virtual:campaign-catalog` 与 `hub/world.json`——时间窗、阵营（`blocs`，id 与 `sides[].coalition` 一致）、各国状态时间表（`countries`）、分区（`theatres`）、交战国代码表（`nations`）、补充的宗主国（`sovereign`）、地名、电报与来源。状态写法 `<阵营>` / `<阵营>-aligned` / `<阵营>-occupied` / `contested` / `neutral`，没有时间表的殖民地继承宗主国的交战国与附庸状态。`tests/hub/world.test.ts` 检查它与底图、各战役清单对得上。

**底图** `public/hub/world1938.topo.json` 由 `tools/hub/build_hub_map.mjs` 从 world_1938 生成：修正数据集里的名称与重复要素，波兰、法国、希腊、丹麦（冰岛、格陵兰）、英属印度（缅甸）、澳大利亚（新几内亚）按示意线拆分，补上缺失的马耳他与塞浦路斯，每个国家带宗主国 `sov`。

**转场**：
1. 进入：浮动面板退场，镜头推进到战役页面开场的取景（`catalog.view`，按战役页面的侧栏 / 顶栏 / 时间轴留白计算；超过底图精度的部分记为 `zs`），同时预取战役页面的入口模块与首屏数据；
2. 截取地图快照，与标题卡一起写进 `sessionStorage`（`shared/handoff/handoff.js` 的 `save`），铺上幕布后跳转（`?tour` 自动推演，`?nointro` 自由浏览）；
3. 战役页面 `<body>` 开头的内联脚本在第一帧画出同一张幕布；`engine/app/start.ts` 等底图瓦片与第一帧控制区就位后调用 `reveal()`，快照按 `zs` 继续放大、模糊、淡出，随后开始自动推演；
4. 返回：战役页面在离开时留下 `warroom:return`，总台从该战役的推进终点开始，拉远到离开前保存的视角（浏览器后退与往返缓存同样处理）。

支持跨页 View Transition 的浏览器会把两张相同的幕布交叉淡入淡出；不支持的浏览器也一样衔接，因为幕布本身就在两个页面里。

## 6. 质量保障

- `npm run validate`：清单与数据的结构、引用、时间窗、坐标范围、轨迹时序与速度、多边形自相交、照片与资产完整性，以及清单里声明的战役专属规则（`manifest.validation`）。
- `npm test`：引擎（场模型、模型库、时间、移动、视图约束、边界检查、音频库）与各战役（`campaigns/<id>/tests/`）的单元测试。
- `npm run parity -- <id> --url http://127.0.0.1:5180/campaigns/<id>/`：逐时刻比较部队状态与控制区几何（始终对照旧版导出的 `.baselines/<旧目录>/state.json`），并对确定性截图做像素差异（`tools/parity/`）。迁移期截图对照旧版画面；M7 升级后 `parity.accepted.json` 的 `baseline` 指向升级后的统一引擎画面（`shots-m7`），用于回归检查，接受的差异写在同一文件里。
