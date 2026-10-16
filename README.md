# 作战总台 · 第二次世界大战战役推演合集

复古作战室风格的战役推演：泛黄的参谋地图、棋子、推进箭头、控制区、时间轴、导演模式与 3D 沙盘。
所有战役共用**同一套引擎**，入口是一张铺满屏幕的 1938 年世界地图——作战总台。欧洲之外，地中海与非洲、中国、太平洋战区已经在地图上留好位置；交战各方地位平等，任何阵营都可以是推进方。

| 战役 | 目录 | 时间 |
|---|---|---|
| 九月战役（波兰） | `campaigns/poland-1939` | 1939.8.31 — 10.6 |
| 挪威战役 | `campaigns/norway-1940` | 1940.4.9 — 6.10 |
| 法国战役 | `campaigns/france-1940` | 1940.5.10 — 6.25 |
| 不列颠空战 | `campaigns/britain-1940` | 1940.7.10 — 10.31 |
| 巴尔干战役 | `campaigns/balkans-1941` | 1940.10.28 — 1941.6.1 |
| 克里特岛战役 | `campaigns/crete-1941` | 1941.5.20 — 6.1 |
| 巴巴罗萨行动 | `campaigns/barbarossa-1941` | 1941.6.22 — 12.5 |
| 淞沪会战（筹备中） | `campaigns/shanghai-1937` | 1937.8.13 — 11.26 |
| 阿拉曼战役（筹备中） | `campaigns/el-alamein-1942` | 1942.10.23 — 11.11 |
| 瓜达尔卡纳尔岛战役（筹备中） | `campaigns/guadalcanal-1942` | 1942.8.7 — 1943.2.9 |

「筹备中」的战役只有 `campaign.json`（总台卷宗），在地图上显示为加封的绝密卷宗；补上数据包、把 `status` 改为 `published` 即可开放，不需要的直接删掉目录。

## 快速开始

```bash
npm install
npm run dev          # http://127.0.0.1:5180/ 作战总台；战役在 /campaigns/<id>/
```

构建与本地预览（或双击 `start.command` 打开 `dist/`）：

```bash
npm run build && npm run preview   # http://127.0.0.1:4180/
```

## 作战总台

- **世界地图**：1938 年国界、米勒投影（中央经线 39°E，太平洋完整不被切开），铺满整个屏幕，可拖动、滚轮或双指缩放；顶栏一键切换「全球 / 欧洲 / 地中海与非洲 / 中国 / 太平洋」，分区来自 `hub/world.json`。每个战役一枚火漆印，重叠时自动推开并用引线指回原位，红线在同一分区内按开战日期串起各战役。
- **浮动面板**：顶栏、卷宗面板（左侧，可收起；窄屏为底部抽屉）、电报纸带、图例与缩放按钮都浮在地图之上。
- **交战国筛选**：卷宗索引列出所有战役里出现过的交战国，点选任何一国，地图与纸带只突出它参与的战役并描出它的领土。
- **电报纸带**：拖动或播放 1937-07 至 1945-09 的时间线，各国按阵营着色——轴心国 / 同盟国 / 苏联各有交战国、附庸与合作、占领区三种纹样，另有交战中与中立；殖民地自动继承宗主国。
- **卷宗**：封面照片与署名、行动代号章、交战双方（按清单顺序、按阵营分组）、统计、简介；「进入作战室 · 自动推演」或「自由浏览」。
- **转场**：进入时面板退场，镜头沿平滑缩放曲线推进到战役的开场取景，地图快照和标题卡交给战役页面，战役地图就绪后快照继续放大淡出；返回时从该战区拉远回到离开时的视角。
- 战役清单在构建时从各 `campaign.json` 自动生成，总台代码里没有写死任何战役或阵营。

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` / `build` / `preview` | 开发服务器 / 构建到 `dist/` / 预览构建产物 |
| `npm run typecheck` | 浏览器代码与 Node 工具两套 tsconfig 的类型检查 |
| `npm test` | 引擎与各战役的单元测试（vitest） |
| `npm run validate` | 校验全部战役包（`-- --campaign <id>` 单个，`-- --quiet` 只看错误） |
| `npm run verify` | typecheck + test + validate + build，提交前跑一遍 |
| `npm run new-campaign -- <id> …` | 生成新战役包骨架（见 [docs/NEW-CAMPAIGN.md](docs/NEW-CAMPAIGN.md)） |
| `sh tools/geo/run.sh <id>` | 为战役生成地图资产（投影、底图瓦片、矢量、3D 地形、场掩膜） |
| `npm run hub:map` | 重建总台底图 `public/hub/world1938.topo.json` |
| `npm run fonts` | 按全部界面文字重建并集字体子集（`-- --fetch` 先下载字体原文件） |
| `npm run parity -- <id> --url …` | 与旧版逐项对比（迁移期工具，见 `tools/parity/`） |

Python 工具（地理管线、字体）用 `tools/py.sh` 选择解释器：`$PYTHON_BIN` → 仓库根目录 `.venv` → `python3`。
首次使用：`python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt`。

## 目录

```
index.html  hub/                 作战总台（世界地图、卷宗面板、电报纸带、转场；world.json 为世界形势数据）
engine/                          唯一的推演引擎（2D 地图、3D 沙盘、时间轴、导演、侧栏、音频、插件）
shared/                          所有页面共用的字体子集、音频库与转场幕布（handoff/）
campaigns/<id>/                  战役包：campaign.json + config/ + data/（自动发现）
public/campaigns/<id>/           战役的大体积资产：底图瓦片、矢量、地形、照片、署名
public/hub/                      总台底图
tools/                           校验、地理管线、新建战役、字体、总台底图、parity、Vite 插件
docs/                            架构、数据格式、新建战役、插件
.cache/  .work/                  共享缓存与中间产物（不入库）
```

## 文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 构建、运行时上下文、引擎模块、总台
- [docs/DATA-FORMAT.md](docs/DATA-FORMAT.md) — `campaign.json` 与 `data/**` 的数据格式 v2
- [docs/NEW-CAMPAIGN.md](docs/NEW-CAMPAIGN.md) — 从零做一个新战役：骨架 → 地图 → 数据 → 校验 → 发布
- [docs/PLUGINS.md](docs/PLUGINS.md) — 插件接口与现有插件（旁白、空战）

## 素材与许可

代码之外的素材各有许可：历史底图 historical-basemaps（GPL-3.0，派生边界数据同样按 GPL-3.0 提供）、Natural Earth 与 Terrarium 地形（公有领域 / 开放数据）、
Wikimedia Commons 照片（逐张署名，见各战役的「资料」面板与 `public/campaigns/<id>/credits.json`）、字体（SIL OFL 1.1；Special Elite 为 Apache 2.0）、
音效与音乐（见各战役 `credits.json`）。各战役的详细许可说明在 `campaigns/<id>/docs/LICENSES.md`。
