# 许可、署名与重构范围

## 1940 不列颠空战地理背景

| 数据 | 用途 | 许可或署名 |
|---|---|---|
| Natural Earth 1:10m physical / cultural vectors | 国家、海岸、河流、湖泊与城市参考；固定地理背景 | 公有领域，见 [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) |
| Mapzen Terrarium Terrain Tiles / AWS Open Data | 全战区高程、晕渲与 3D 地形 | 各底层数据许可与署名见 [Terrain Tiles attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) |
| Copernicus / EU-DEM | 欧洲地形数据的底层来源 | Europe terrain data produced using Copernicus data and information funded by the European Union — EU-DEM layers |
| Kartverket | 挪威地形数据的底层来源 | Norway terrain data © Kartverket |
| Environment Agency | 英国地形数据的底层来源 | United Kingdom terrain data © Environment Agency copyright and/or database right 2015 |
| NOAA ETOPO1；USGS SRTM / GMTED2010 | 全球地形数据的底层来源 | Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration; SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey |
| Rijkswaterstaat：100 jaar Zuiderzeewerken | 荷兰围海造陆日期校核；移除 1940 年尚未形成的圩田 | 作为事实参考，未复制其地图或文章；见 [Rijkswaterstaat](https://www.rijkswaterstaat.nl/water/waterbeheer/bescherming-tegen-het-water/100-jaar-zuiderzeewet) |
| Hohum：Battle of Britain map.svg（2009） | 防区、机场与雷达参考图；不是交互地图底图 | Public domain / PD-self；保存在 `public/maps/battle-of-britain-map.svg`，见 [Commons 原页](https://commons.wikimedia.org/wiki/File:Battle_of_Britain_map.svg) |

完整地理来源另见 `public/geo/credits.json`。现代高程用于地形表达；防区、森林和湿地等专题轮廓经过概化。固定国界不因空袭而改变。

## 历史资料与教学表达

事件、编制简史、基地与装备说明为依据所列资料撰写的原创中文摘要，不是博物馆文章的复制。主要来源为 RAF Museum、RAF 官方历史、道丁战报、RAF Historical Society 北方防空专题、Imperial War Museums 与 The National Archives；德国驻地以 Michael Holm 编制表辅助核对。逐条来源见 `src/data/sources/*.json`。

- 15 个里程碑覆盖英国官方时段 **1940-07-10 至 1940-10-31**。未知钟点不作为史实呈现，事件采用日期精度。
- 航迹、分钟级动画、高度、袭击／拦截区域和雷达圆环均为**教学重构**，不是逐架航迹、精确探测保证或领土控制。它们有独立来源项 `britain_reconstruction` 和较低置信度。
- 编制树展示四个代表航空群、三个航空队及 27 个代表中队／大队，未穷举每日隶属和全部部队。每 RAF 中队 12 架、每德国 Gruppe 30 架为代表标尺，不能当作实际可用机数。历史总量、单次出动数、累计架次与棋子数量有不同口径。
- 原波兰战役数据归档在 `archive/poland-1939`，不参与英国数据库。其旧历史边界派生文件保留原有 GPL-3.0 等许可；英国的新 Natural Earth 背景不因归档存在而重新标为 GPL。

## 新增照片

以下四张照片已核对 Commons 文件页的主体、日期和许可，缩小、转 WebP 并本地解码验证。完整署名保存在 `public/photos/index.json` 与 `public/credits.json`。

| 文件 | 图像内容与署名 | 许可 |
|---|---|---|
| `public/photos/britain-hu54418.webp` | 1940 年 7 月 29 日，霍金吉第 32 中队飞行员与 Hurricane；摄影者未知，IWM HU 54418。背景照片，未冒充所选中队或事件现场 | 公有领域，PD-UKGov / PD-scan；[原页](https://commons.wikimedia.org/wiki/File:The_Battle_of_Britain_HU54418.jpg) |
| `public/photos/britain-ch1372.webp` | 1940 年 9 月，第 19 中队 Spitfire 在福尔米尔加油；Stanley Arthur Devon，RAF official photographer，IWM CH 1372 | 公有领域，PD-UKGov / PD-scan；[原页](https://commons.wikimedia.org/wiki/File:A_Spitfire_of_No._19_Squadron_is_refuelled_at_Fowlmere,_near_Duxford,_September_1940._CH1372.jpg) |
| `public/photos/britain-bundesarchiv-0620.webp` | 1940 年 **8 月**，比利时／法国的德国飞行员与飞机；**Bundesarchiv, Bild 101I-342-0620-07A / Seuffert / CC-BY-SA 3.0**；已缩小并转 WebP | **CC BY-SA 3.0 DE**，此派生 WebP 同许可；[许可](https://creativecommons.org/licenses/by-sa/3.0/de/) · [原页](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_101I-342-0620-07A,_Belgien-Frankreich,_Flieger_vor_Flugzeug.jpg) |
| `public/photos/britain-he111-wapping.webp` | 1940 年 9 月 7 日，He 111 飞越伦敦沃平；German Air Force photographer，IWM Collection | 公有领域；[原页](https://commons.wikimedia.org/wiki/File:Heinkel_He_111_over_Wapping,_East_London.jpg) |

源项目已有照片与逐项许可证全部保留。1939 波兰、博物馆展品或其他战区图像若作为装备参考，保留原拍摄地和年代，不能当作 1940 英国事件现场。新增素材可由 `scripts/assets/fetch_britain_media.py` 重建，该脚本保留原索引。

## 音频与音乐

原音效 sprite 和音乐文件保留，逐项许可见 `public/credits.json`。其中肖邦公有领域录音和克拉科夫号角是波兰场景遗产，并非英国战役默认音乐。

英国战役的战斗机、空袭警报和机场氛围由程序合成，用于交互氛围，不声称为原始战地录音。既有 `bomber` 等音效保留原作者与许可，现代音效不能称为历史录音。

RAF / RAF Museum / The National Archives 的 **Untold Battle of Britain** 英语历史节目仅提供外部收听参考，见 `public/audio/historical-references.json`。未发现明确的录音再分发许可，因此未捆绑该节目或丘吉尔演说录音；无冒充历史人物的生成旁白。

## 字体与程序库

| 字体 | 许可 |
|---|---|
| Noto Serif SC、LXGW WenKai（霞鹜文楷）、Oswald、Stardos Stencil | SIL Open Font License 1.1 |
| Special Elite | Apache License 2.0 |

字体按本作实际用字重新子集化，原许可证保留。

d3（ISC）、three.js（MIT）、GSAP（Standard No-Charge License）、howler.js（MIT）、topojson-client（ISC）、zod（MIT）、milsymbol（MIT，仅开发期使用）。

## 原创器乐背景（声音修复）

`public/audio/music/operations-room.wav` 为本项目原创64秒器乐循环，使用钢琴与弦乐音色，无人声、无无线电片段。生成源码为 `scripts/assets/build_britain_music.py`；相位和包络周期化，支持连续播放。原版音效与音乐素材继续保留署名和许可，默认背景不再播放无线电静电或随机噪声。
