# 许可与署名

本项目复制用户已有波兰战役的程序与设计，独立适配挪威数据；原程序作者及其许可归属不因改编改变。以下仅说明使用的第三方资产与数据，不擅自重授原程序许可。

## 地理

- **Natural Earth 1:10m**：行政背景、陆地、河流、湖泊、海岸；公共领域。[使用条款](https://www.naturalearthdata.com/about/terms-of-use/)。原项目缓存复制至新目录独立处理。周边现代边界只作定位；本图未使用原波兰派生历史边界。
- **Mapzen / AWS Terrain Tiles (Terrarium)**：新的北欧z6真实高程。[数据目录](https://registry.opendata.aws/terrain-tiles/)；按 [Joerd高程源署名表](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) 保留署名。GMTED2010 / USGS、EU-DEM / European Environment Agency、SRTM / NASA 与其他原始提供者见该表，不能把所有高程一概重授为CC0。
- 地图纸纹、分层设色、瓦片和3D贴图由复制的原项目地理渲染代码生成；控制区为依据史料撰写的示意几何。

## 历史内容

中文事件/单位说明和英语旁白为基于公开史料撰写的摘要，未复制整页战史。主要参考挪威武装部队/国家档案、英国政府官方战史T. K. Derry《The Campaign in Norway》(HMSO,1952，HyperWar转录)、RAF Museum、纳尔维克战争博物馆。完整页面URL见 `src/data/sources/campaign.json` 与 `research/HISTORY.md`。

## 三张历史照片

通过Wikimedia Commons已核实的公共领域文件页复用：N108（Geoffrey Keating / IWM）、A33、A38（British official photographs / IWM）。Commons标注英国政府作品版权到期 **PD-UKGov**；来源、图注和许可链接在 `public/photos/index.json` / `public/credits.json`，页面也保留。5月2日N108照片说明撤离准备，不把它改标成5月3日拍摄。未将其他IWM网页图片自动视为可自由使用。

## 字体与音效

延用原项目本地字体：Noto Serif SC、LXGW WenKai、Oswald、Stardos Stencil（SIL OFL 1.1），Special Elite（Apache-2.0）。继承的通用音效为CC0/公共领域素材及程序合成；逐项作者、源链接、许可见 `public/credits.json`。未复制原波兰专属音乐。浏览器英语语音为可选合成能力，不是1940年实录。

## 程序库

d3 / topojson-client（ISC）、Three.js / howler.js / Zod（MIT）、GSAP（Standard No-Charge License），详见各依赖随附许可。其余开发依赖保留原项目版本与许可文件。
