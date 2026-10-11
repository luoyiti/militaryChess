# 巴尔干战役 · 许可与署名

## 地理数据
| 数据 | 用途 | 许可 |
|---|---|---|
| Natural Earth 1:10m | 河流、湖泊、海岸、陆地、城市参考 | 公有领域 |
| historical-basemaps `world_1938.geojson`（André Ourednik 等） | 1939 年国界基础，经修补后派生出 `public/geo/poland1939.geojson` 和 `vectors.topo.json` 中的 `countries1939` | **GPL-3.0**：上述派生边界数据同样按 GPL-3.0 提供 |
| CShapes 2.0（ETH Zürich ICR） | 边界校核参考 | CC BY-NC-SA 4.0 |
| Terrain Tiles / Terrarium（Mapzen，AWS Open Data） | 高程晕渲与 3D 地形 | 署名要求见 https://github.com/tilezen/joerd/blob/master/docs/attribution.md（SRTM、GMTED2010、ETOPO1、EU-DEM 等） |

## 史料
事件、编制、部队简史与装备说明是依据官方战史撰写的中文摘要。主要来源：
- 希腊陆军军事历史资料（品都斯、科尔察、希马拉、春季攻势），文本事实用于独立重建；原PDF作为资料链接。
- 美国陆军 DA Pam 20-260《The German Campaigns in the Balkans (Spring 1941)》（1953）；三张历史战役地图保存在public/history。
- 澳大利亚战争纪念馆官方战史《Greece, Crete and Syria》（1953），作为交叉核对来源。
- 新西兰官方克里特战史与NZ On Screen《Return from Crete》（1941）外链。

历史国界以Historical Basemaps的1938版本为原料，修正至1940-10-28；保留GPL-3.0署名与许可。CShapes只用于交叉校核。自然地形资料与高程来源见public/geo/geo_pipeline.meta.json，细节近似见balkans1940.meta.json。

完整来源列表见src/data/sources与页面内「资料」。

## 照片、音效、音乐
逐项署名与许可见 `public/credits.json`：
- **照片**：巴尔干事件使用新取得的Wikimedia Commons战役照片，逐项许可、作者及原始URL见credits.json。原参考项目照片保留在素材库中，未用于冒充巴尔干战场。
- **音效**：取自 CC0 或公有领域素材，部分用程序合成。
- **音乐**：复用肖邦作品Musopen公有领域录音与克拉科夫号角，作为作战室界面配乐；不作为巴尔干战场同期录音。英语同期档案以原片入口提供。

## 字体
| 字体 | 许可 |
|---|---|
| Noto Serif SC、LXGW WenKai（霞鹜文楷）、Oswald、Stardos Stencil | SIL Open Font License 1.1 |
| Special Elite | Apache License 2.0 |

以上字体均按页面实际用到的字符做了子集化。

## 程序库
d3（ISC）、three.js（MIT）、GSAP（Standard No-Charge License）、howler.js（MIT）、topojson-client（ISC）、zod（MIT）、milsymbol（MIT，仅开发期使用）。
