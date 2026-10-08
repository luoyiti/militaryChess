# 许可与署名

## 地理数据
| 数据 | 用途 | 许可 |
|---|---|---|
| Natural Earth 1:10m | 河流、湖泊、海岸、陆地、城市参考 | 公有领域 |
| historical-basemaps `world_1938.geojson`（André Ourednik 等） | 1939 年国界基础，经修补后派生出 `public/geo/poland1939.geojson` 和 `vectors.topo.json` 中的 `countries1939` | **GPL-3.0**：上述派生边界数据同样按 GPL-3.0 提供 |
| CShapes 2.0（ETH Zürich ICR） | 边界校核参考 | CC BY-NC-SA 4.0 |
| Terrain Tiles / Terrarium（Mapzen，AWS Open Data） | 高程晕渲与 3D 地形 | 署名要求见 https://github.com/tilezen/joerd/blob/master/docs/attribution.md（SRTM、GMTED2010、ETOPO1、EU-DEM 等） |

## 史料
事件、部队简史和装备说明均为依据所列来源撰写的中文摘要。主要来源：
- 美国陆军部 DA Pam 20-255（1956，公有领域）
- Zaloga《Poland 1939》等著作
- 英语、波兰语、德语维基百科相关条目（CC BY-SA 4.0）

完整来源列表见 `src/data/sources/*.json`，页面内「资料」页也可查看。

## 照片、音效、音乐
逐项署名与许可见 `public/credits.json`：
- **照片**：90 张，均来自 Wikimedia Commons，许可为公有领域、CC BY 或 CC BY-SA，其中包括 Bundesarchiv 的 CC BY-SA 3.0 DE 照片。
- **音效**：取自 CC0 或公有领域素材，部分用程序合成。
- **音乐**：肖邦作品的 Musopen 公有领域录音；克拉科夫号角 Hejnał mariacki 为公有领域录音。

## 字体
| 字体 | 许可 |
|---|---|
| Noto Serif SC、LXGW WenKai（霞鹜文楷）、Oswald、Stardos Stencil | SIL Open Font License 1.1 |
| Special Elite | Apache License 2.0 |

以上字体均按页面实际用到的字符做了子集化。

## 程序库
d3（ISC）、three.js（MIT）、GSAP（Standard No-Charge License）、howler.js（MIT）、topojson-client（ISC）、zod（MIT）、milsymbol（MIT，仅开发期使用）。
