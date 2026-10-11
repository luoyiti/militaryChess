# 作战总台 · 二战欧洲战场推演合集（1939—1941）

复古作战室风格的战役推演：泛黄的参谋地图、棋子、推进箭头、控制区、时间轴、导演模式与 3D 沙盘。
六场战役共用**同一套引擎**，入口是一张 1938 年欧洲地图桌——作战总台。

| 战役 | 目录 | 时间 |
|---|---|---|
| 九月战役（波兰） | `campaigns/poland-1939` | 1939.8.31 — 10.6 |
| 挪威战役 | `campaigns/norway-1940` | 1940.4.9 — 6.10 |
| 法国战役 | `campaigns/france-1940` | 1940.5.10 — 6.25 |
| 不列颠空战 | `campaigns/britain-1940` | 1940.7.10 — 10.31 |
| 巴尔干战役 | `campaigns/balkans-1941` | 1940.10.28 — 1941.6.1 |
| 克里特岛战役 | `campaigns/crete-1941` | 1941.5.20 — 6.1 |
| 巴巴罗萨行动（筹备中） | `campaigns/barbarossa-1941` | 1941.6.22 — 12.5 |

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

- **地图桌**：1938 年国界的欧洲形势图，每个战役一枚火漆印，红线按开战日期串起各战役；悬停查看卷宗，点击进入作战室。
- **电报纸带**：拖动或播放 1939-09 至 1941-12 的时间线，各国按当时状态着色（轴心国、被占领、交战中、苏联控制、维希法国……），德苏分界线与法国停战分界线随之出现，纸带上打出当时的电报。
- **卷宗**：封面照片与署名、行动代号章、交战方、统计（部队、事件、态势帧、照片）、简介；「进入作战室 · 自动推演」或「自由浏览」。
- 战役清单在构建时从各 `campaign.json` 自动生成，总台代码里没有写死任何战役。

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
| `npm run hub:map` | 重建总台底图 `public/hub/europe1938.topo.json` |
| `npm run fonts` | 按全部界面文字重建并集字体子集（`-- --fetch` 先下载字体原文件） |
| `npm run parity -- <id> --url …` | 与旧版逐项对比（迁移期工具，见 `tools/parity/`） |

Python 工具（地理管线、字体）用 `tools/py.sh` 选择解释器：`$PYTHON_BIN` → 仓库根目录 `.venv` → `python3`。
首次使用：`python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt`。

## 目录

```
index.html  hub/                 作战总台（地图桌、档案夹、电报纸带）
engine/                          唯一的推演引擎（2D 地图、3D 沙盘、时间轴、导演、侧栏、音频、插件）
shared/                          所有页面共用的字体子集与音频库（打包为带哈希的资源）
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
