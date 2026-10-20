# 大西洋海战（battle-atlantic-1945）

1939 年 9 月 3 日至 1945 年 5 月 8 日的北大西洋战役：德国 U 艇与水面袭击舰对盟军横渡大西洋的商船队与护航体系，
以及盟军以密码破译、雷达、护航航母、远程航空与护航群逐步夺回中大西洋的过程。
本文件记录**地理数据管线**（本战役地图资产的来源、生成方式、投影口径与已知简化）；战役内容的研究与编纂见
[`docs/research/`](docs/research/) 与 [docs/NEW-CAMPAIGN.md](../../docs/NEW-CAMPAIGN.md)、[docs/NAVAL.md](../../docs/NAVAL.md)。

> 状态：`campaign.json` 的 `status` 为 `published`（2026-10-20 发布）。地图资产已按本文件的参数生成并提交（`public/campaigns/battle-atlantic-1945/`）。

## 1. 时钟口径

| 项 | 取值 |
|---|---|
| 战役区间 | 1939-09-03T00:00 — 1945-05-08T23:59（`campaign.json` 的 `time.start` / `time.end`） |
| 时间基准 | **`campaign.json` 的 `T` 一律是 UTC**（引擎的 `initTime()` 按 `Date.UTC` 换算，`docs/DATA-FORMAT.md` §时间） |
| 叙事时钟 | `time.utcOffset = 0`：本战役是横跨六个时区的大洋战争，没有单一「舰钟」可作叙事时钟，故取 UTC 为公共基准 |
| `time.tzLabel` | 在清单里说明这一点，并注明各方原始记录的时钟差异（见下） |
| 3D 沙盘太阳 | `sandbox` 按 `utcOffset = 0` 计算太阳高度，因此沙盘的昼夜对应**北大西洋中部**（约 30°W）的昼夜 |

原始记录各自的时钟（研究组在 `docs/research/` 里逐条标注；转成 `data/` 前**必须统一换算成 UTC**）：

- **英方**：海军部与西部航道司令部用 GMT（= UTC）；舰艇日志常用当地时或 Zone 时，差 ±1–3 小时。
- **德方**：U 艇战报（KTB）用 **MEZ（UTC+1）**，夏季用 MESZ（UTC+2）——`uboat.net` 的日期也按此，
  换算成 UTC 要减 1–2 小时；跨午夜的战果常因此差一天。
- **美方**：舰队与东岸指挥部用 **Zone +5 / EST（UTC−5）**，1942 年起东岸战时用 EWT（UTC−4）。
- **加拿大**：RCN 用 GMT，但哈利法克斯岸台记录混用 AST（UTC−4）。
- 「1943-05-24 Black May 转折」这类以**日**为精度的事件，`at` 取当日的**编排值**（多为 12:00 UTC 或
  战斗窗口的整点），研究稿里的 `precision` 字段（`day` / `hour` / `minute`）说明该时刻的可信粒度。

## 2. 数据从哪里来

| 资产 | 来源与生成方式 |
|---|---|
| 投影与画布 `config/frame.json` | `tools/geo/emit_frame.mjs` 从 `config/geo.config.json` 的 `frame` 段算出（d3 `geoConicConformal`）。画布 8192×6464，场网格 512×404 |
| 国界 `countries1939` | [historical-basemaps](https://github.com/aourednik/historical-basemaps) 的 `world_1938.geojson`（A. Ourednik 等，GPL-3.0），156 个 NAME 映射为 138 个短 id，加上 3 个切出的 id（`IS` / `GL` / `SWA`）与 16 个 Natural Earth 补充项，最终画出 142 个政治实体；殖民地、自治领、托管地尽量各给独立 id 与中文名（冰岛 `IS`、格陵兰 `GL`、法罗 `FO`、纽芬兰自治领 `NF`、意属东非 `IEA`、西南非洲 `SWA` 等） |
| 陆地、湖泊、河流 | [Natural Earth](https://www.naturalearthdata.com/) 1:10m（公有领域）：`ne_10m_land`、`ne_10m_lakes` + `_europe`、`ne_10m_rivers_lake_centerlines` + `_europe` |
| 补充岛屿 | Natural Earth 的 `ne_10m_admin_0_countries`：1938 数据集未收录的百慕大、马耳他、塞浦路斯、海峡群岛、马恩岛、圣皮埃尔和密克隆、佛得角、库拉索与阿鲁巴等，按「不与既有国家相接的部分」并入对应 id |
| 高程与水深 | [Terrain Tiles (Terrarium)](https://registry.opendata.aws/terrain-tiles/)（Mapzen / AWS Open Data，含 SRTM、GMTED2010、ETOPO1），`dem.zoom = 5`，约 4.6 km/像素 |
| 底图瓦片、3D 地形 | `tools/geo/render.py` 由上面的陆地/湖泊/森林矢量 + DEM 合成：泛黄纸张、分层设色、晕渲、水深设色、雕版水波纹、海岸墨线 |
| 等深线 `isobaths` | 同一 DEM 高斯平滑后 marching squares 提取（`tools/geo/bathy.py`），10 级：−5、−10、−20、−50、−200、−1000、−2000、−3000、−4000、−5000 m |

署名同时写在 `public/campaigns/battle-atlantic-1945/credits.json` 与 `campaign.json` 的 `credits.geodata`。

## 3. 投影与画布口径

```jsonc
// config/geo.config.json 的 frame 段
"bbox": [-85, -12, 45, 78],      // 85°W–45°E、12°S–78°N
"parallels": [25, 62],           // 标准纬线：夹住中大西洋（40–55°N）与 U 艇主战区（30–50°N）
"rotate": [-25, 0],              // 中央经线 25°W
"center": [0, 36],
"width": 8192,
"tileLevels": [1024, 2048, 4096, 8192],
"fieldCell": 16,
"clampKm": 60,
"kmProbe": [-25, 30]             // → frame.json 的 kmPerUnit = 1.9964 km
```

- **比例尺**：`kmPerUnit = 1.996`（在 25°W 30°N 处；赤道 1.33、0° 1.58、25°N 1.95、36°N 2.03、50°N 2.04、
  62°N 1.94、78°N 1.56 km/单位）。标准纬线之间比例误差 <1%，战场带（30–55°N）±4%，北极航线略缩小。
- **画布四角**：圆锥投影下画布是**外接矩形**，比 `bbox` 大——四边反算到约 **100°W–140°E、36°S–88°N**，
  上缘中央越过北极圈直到 88.6°N（圆锥顶点本身在画布上缘之上）。`region` / `clip` 因此取
  `[-102,-39,142,90]` / `[-101,-38,141,89]`，让矢量与 DEM 覆盖整个画布，避免边缘露白或矢量被裁掉。
  画布上缘左右两角是「圆锥之外」的空区，底图上呈纸张色——这是圆锥投影的正常结果（与 `river-plate-1939` 相同）。
- **极区外推**：`dem.zoom = 5` 的 Terrarium 瓦片只到 85.0511°N（Web Mercator 上限），而画布上缘到 88.6°N。
  见 §5「已知简化」第 1 条。
- 画布单位 = 最高级瓦片（8192 宽）的像素。所有 `data/` 里的坐标仍然是**经纬度**，引擎用 `frame.json` 投影。

## 4. 重建方式

前置：`npm install`；Python 用 `tools/py.sh` 选的解释器（`.venv` 或系统 `python3`），依赖见 `tools/requirements.txt`。

```bash
# 0) 原始矢量（首次；之后走 .cache/geo/raw/ 缓存）
.venv/bin/python tools/geo/fetch_raw.py

# 1) DEM：本战役专用脚本（画布到 88.6°N，通用 dem.py 会因 404 中止，见 §5）
.venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/dem_polar.py

# 2) 其余全部步骤：frame → fetch → borders → vectors → project → render → masks
sh tools/geo/run.sh battle-atlantic-1945 --skip-dem
```

常用变体：

```bash
# 只改了 borders / rivers / lakes / sea（不动 DEM）——最快的重算路径，约 1.5 分钟
sh tools/geo/run.sh battle-atlantic-1945 --skip-dem --from borders

# 只校验投影（frame.json 是否与 geo.config.json 重算一致）
node tools/geo/emit_frame.mjs battle-atlantic-1945 --check
```

产物（`public/campaigns/battle-atlantic-1945/`）：

| 路径 | 内容 |
|---|---|
| `geo/vectors.topo.json` | 7 个图层：`land`、`countries1939`（142 个 id）、`rivers`（767 段，463 段有中文名）、`lakes`（117 个，35 个有中文名）、`marsh`、`forest`、`isobaths`（6638 条） |
| `geo/field_masks.bin` + `.json` | SDF 场掩膜，512×404，格 16 世界单位（32 km）。空战模式只写陆地位 4（`air: true`） |
| `tiles/base/{0..3}/…webp` + `meta.json` | 四级底图瓦片：1024×808、2048×1616、4096×3232、8192×6464，共 284 张；`tiles/overview.webp` |
| `terrain/albedo.webp`、`height.png`、`terrain.json` | 3D 沙盘贴图（4096×3232 无晕渲 albedo）与 rg16 高度图（1024×808，`elev_m = (R*256+G)*0.25 − 100`） |
| `config/frame.json` | 投影真源（由 `geo.config.json` 生成，勿手改） |

改 `geo.config.json` 的 `frame` 段会让**既有经纬度坐标的视觉位置变化**（`frame.json` 的 `scale`/`translate` 变），
所以 `data/` 一旦开始铺数据就不要再动 `frame`；只改 `borders` / `rivers` / `lakes` / `sea` 是安全的。

## 5. 已知简化

1. **85°N 以北的 DEM 是外推的**。Terrarium 瓦片止于 Web Mercator 上限 85.0511°N，而画布上缘到 88.6°N。
   `pipeline/scripts/dem_polar.py` 与 `tools/geo/dem.py` 算法相同，只把瓦片行范围钳到 `y ≥ 0`，
   85°N 以北按最北一行**最近邻外推**。影响：场网格（512×404，格 16）的**第 0–22 行**（共 1222 格，
   占 0.59%）与底图上缘中央约 **0.6%** 的像素（复算：51712 个采样像素中 325 个在北纬 85.05° 以北），
   全部在北冰洋——没有战场、航线与陆地；
   该处的 −1000/−2000 m 等深线是 85°N 边缘形态的平直延续，不应据此判读北冰洋水深。
   通用 `tools/geo/dem.py` 在此战役会请求 `y = −7…−1` 的瓦片、6 次重试后抛 `RuntimeError` 中止，故改用专用脚本。
2. **国界是 1938 年的静态政治边界，不是 1939–1945 的实时占领线**。`world_1938` 里波兰未瓜分、捷克斯洛伐克
   独立、阿尔巴尼亚独立、法国本土完整；德国 1938 年的边界（含奥地利、苏台德）也不等于 1940 年的版图。
   本战役的主战场在海上，陆上国界只是海图底衬，**不作为任何战果或控制区的依据**；`control` 用 `air` 模式
   （`raider` / `convoy` 两个跨海区域），本来就不读国界。若将来要画陆上占领区，需要逐段修补国界
   （参考 `campaigns/poland-1939`、`leningrad-1941` 的 `borders.script`）。
3. **殖民地按宗主国合并**。`borders.merge` 把同一政治实体的飞地并成一块（意属东非三省、卢安达-乌隆迪、
   法属赤道非洲与法属刚果、南非联邦与瓦尔维斯湾、沙特阿拉伯与汉志/海尔、也门与亚丁保护地等）。
   英帝国拆得较细（英国本土 `GB`、加拿大 `CA`、纽芬兰自治领 `NF`、南非 `ZA`、英属印度 `IN`、埃及 `EG`、
   英埃苏丹 `SD`、各非洲殖民地单独 id），因为总台卷宗与战区着色需要区分自治领与殖民地；法国殖民地同理。
   西属撒哈拉与里奥德奥罗合并为 `SAH`，葡属几内亚 `PTG` 单列。
4. **小岛与极区海岸是 1:10m 精度**。百慕大（0.006 平方度）、马耳他、海峡群岛这类岛在 8192 宽的画布上只有几个
   像素，`borders.py` 的 `min_area` 过滤会保留它们，但形状不可细看；法罗、冰岛、格陵兰取自 Natural Earth 现代
   边界（海岸线 1940 年代与今日差别可忽略，但冰盖边缘与冰川末端已有变化）。
5. **水深是 ETOPO1 量级的粗网格（z5 ≈ 4.6 km/像素）**。等深线不是航海图：大陆架边缘（200 m）与陆坡的位置
   可用于叙事，但不能当作战术水深；近岸浅水（5/10/20 m）在大洋尺度上被过度平滑。等深线额外做了
   `sea.smooth = 3.4` 像素的高斯平滑并按水深加大最小线长，以压掉 DEM 噪声生成的碎屑。
6. **河流只画主干**（`maxRank = 6`，欧洲子集 `maxRank + 2`），湖泊只保留 `maxRank ≤ 4` 且有中文名或
   明确列在 `keep` 里的天然水体；战后建成的水库（Natural Earth 标 `Reservoir`）缺省不画。
   海图上真正要紧的河口（塞纳、卢瓦尔、加龙、易北、威悉、莱茵/瓦尔/莱克/艾瑟尔、泰晤士、默西一带、
   圣劳伦斯、哈得孙、德拉瓦、切萨皮克湾诸河、尼罗、尼日尔、刚果、亚马孙、拉普拉塔诸河）都有中文名。
7. **没有林区与沼泽轮廓**（`forest: []`、`marsh: []`）。陆上不是本战役的战场，铺林区纹样只会让海图变脏。
8. **底图是风格化海图，不是实测地图**：纸张纤维、污渍、折痕、水波纹都是渲染效果；海岸墨线在放大到
   单舰战术尺度（`maxZoom` 120）时会出现 1:10m 折线的棱角，判读岸线请以矢量 `land` 为准。
9. **战术标绘距离 ≠ 真实交战距离**。2D 海战层按「标绘比例」绘制舰位与弹道：为了让同一屏幕里容得下
   整场交战，舰船剪影按真实舰长放大、舰队间距按压缩比例呈现（3D 沙盘可在「兵棋比例 / 真实比例」间切换）。
   因此屏幕上量出的两舰间距不能当作射程或命中距离判读——真实距离请看舰船卡与海战层的距离标注
   （`naval.rangeUnit` = `nm`）。射程圈是按真实 `rangeKm` 画的，可作为参照。
10. **电文纸带的摘要标注规则**。`data/naval/signals.json` 的 `text` 是逐字原文（多为德方 KTB 与英方战报），
    `zh` 是中文译文或摘要。凡方括号包裹的段（如 `〔概述〕…`）是**编者摘要**而非逐字原文，用于补齐
    上下文、单位换算或存疑说明；无方括号的部分才是原文转写。查证原文请以 `sources` 指向的档案为准。
11. **审查遗留的 3 条低severity 待办**（数据已冻结，暂不改，详见 [`docs/research/00-CONSISTENCY.md`](docs/research/00-CONSISTENCY.md) §10–11）：
    - **R1** 五艘舰（沙恩霍斯特、格奈森瑙、欧根亲王、U-29 等）的**航段插值**仍有约 1100 km 穿越陆地
      （连续 4–7 个采样点落在陆地，未达测试阈值「连续 ≥8 点」）。航迹点本身已在海上，是 Hermite 曲线
      在长航段上的过冲；影响的是中间插值帧的舰位，不影响事件与战果。改法：加密这些长航段的关键点。
    - **R2** `data/naval/signals.json:467` 的「卡特林纳」应为「卡塔琳娜」（Catalina，PBY 水上飞机）。
      全包其余 7 处均作「卡塔琳娜」，仅此一处不一致，属文案笔误。
    - **R3** 沙恩霍斯特 1941–42 的**路线**已对齐到布雷斯特实际舰位，但其**本体航迹**（`oob/de.json`）
      在该段仍是修正前的形态；两者表述一致、坐标略有差异。

## 6. 清单（战役包其余部分）

- [x] `config/geo.config.json`：国界映射（`ids` 156 条 → 138 个 id / `merge` 16 组 35 项 / `carve` 3 项 / `ne` 16 项）、
      掩膜（`air: true`，只写陆地位 4）、河流 166 条中文名、湖泊 50 条中文名、等深线 10 级
- [x] 生成地图资产并逐张校验可读（四级 284 张瓦片尺寸与 `meta.json` 一致，掩膜字节数 = 512×404）
- [x] `data/sources/`：54 条史料来源，所有数据通过 `sources` 引用
- [x] `data/gazetteer/`：84 个地名（中文、当时原名、坐标、级别）
- [x] `data/oob/`：68 个部队（63 艘舰船 + 指挥机构），带 `active` 在场窗口与逐段航迹
- [x] `data/fronts/`：18 帧控制区关键帧（`raider` / `convoy` 两槽位）
- [x] `data/events.json`（107 条）、`data/routes/`（30 条）、`data/naval/`（181 条海战条目 = fire 19 / hits 44 / torpedoes 8 / smoke 14 / signals 96，
      另有 60 条 `damage` 损伤状态）、
      `data/overlays.json`（4 条 `zones`：巴拿马安全区、中大西洋空白区、比斯开湾封锁线）、
      `data/equipment.json`（18 张装备卡）、`data/forces.json`、`data/credits.json`
- [x] `campaign.json`：9 个阶段（`phases`）、14 个时间轴标记（`marks`）、97 段变速播放（`time.pace`，
      1× 约 34.6 分钟，逐场战斗放慢）、简报与图例文字、导演警报与配乐、总台卷宗（`hub`，`region: atlantic`）
- [x] `npm run fonts` 重建字体子集（本文案缺字 0，含「俾」）
- [x] 把 `status` 改为 `published`，`npm run verify` 全绿（typecheck / test / validate / build）

## 7. 发布说明

- **状态**：`campaign.json` 的 `status` 为 `published`，战役出现在作战总台的卷宗列表（`hub.order = 12`，
  分区 `atlantic`，模板字 `ATLANTIC`，封面 `photos/convoy-aerial-1941.webp`）。
- **总台分区**：`hub.region = atlantic` 依赖 `hub/world.json` 的 `theatres` 中有 `atlantic` 一条
  （`view: [-75, -48, 30, 40]`）；若在其他分支上该分区缺失，总台会报错，需一并带上。
- **战区内轮廓**：`hub.theatre` 是 35 点的 `sea` 多边形（北大西洋—挪威海—北极航线—比斯开湾），
  不依赖总台底图的国家 id，因此不受 `world_1938` 国界改动影响。
- **核查**：`npm run validate -- --campaign battle-atlantic-1945` 0 错误 0 警告；
  `npm test` 30 个文件 / 471 项全绿（含本战役 `tests/campaign.test.ts` 的 26 项）；
  `npm run verify` 产出 `dist/campaigns/battle-atlantic-1945/`。
- **重建顺序**：地图资产见 §4；数据与文案由 `data/` 直接维护，`pipeline/scripts/check_consistency.ts`
  可单独跑一致性检查（A–E 五组）。
- **已知遗留**：见 §5 第 11 条（R1–R3 三条低severity 待办，数据已冻结未改）。

