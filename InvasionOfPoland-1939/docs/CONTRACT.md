# 数据与模块契约（冻结版 v1）

所有子代理必读。**schema 唯一真值 = `src/schema/index.ts`（zod）**；`config/*`、`src/schema/*`、`src/model/core.ts`、`scripts/validate/*`、本文件对子代理**只读**。需要改契约时，在交付报告里提出，由主代理修改。

## 1. 通用约定
- **坐标**：`[经度, 纬度]`，WGS84 小数度，精确到 0.01°。也可以写地名引用 `"@placeId"`，指向 `src/data/gazetteer/*.json` 中的地名。**优先使用地名引用**，找不到的地名先添加到本代理自己的 gazetteer 分片里。
- **时间**：统一用 CET（当时波兰和德国通用的时间），格式 `"1939-09-01T04:45"`。苏方资料给的是莫斯科时间，需要减 2 小时。时间范围为 1939-08-31T00:00 到 1939-10-06T23:59。
- **地图范围**：13.0–29.5°E，47.3–56.6°N（见 `config/frame.json`）。所有坐标必须落在这个范围内。
- **投影**：`d3.geoConicConformal().parallels([49.5,55]).rotate([-21.25,0]).center([0,52]).scale(41932.62).translate([4096,3555.18])`，世界坐标宽 8192、高 6996，1 世界单位约 0.152 km。Python 端必须与之逐像素一致（参数一律从 `config/frame.json` 读取）。
- **语言**：面向用户的文字一律用简体中文；专有名词在 `orig` 字段中保留原文（波兰文、德文、俄文、斯洛伐克文）。
- **来源**：每条数据都必须有 `sources`（取值为来源 id，定义在 `src/data/sources/*.json`）和 `confidence`（取值 high / medium / low）。核心来源已写在 `sources/core.json`，可直接引用；新增来源写进本代理自己的分片。
- **敏感内容**：不出现卍字；暴行类事件措辞中性、陈述事实并附来源；有争议的事件（如布龙贝格）必须写明存在争议。

## 2. 文件归属（每个代理只能写自己的文件）
| 代理 | 独占写入 |
|---|---|
| A 地理管线 | `scripts/geo/**`、`public/tiles/**`、`public/geo/**`、`public/terrain/**` |
| B1 德国与斯洛伐克 OOB | `src/data/oob/de.json`、`src/data/oob/sk.json`、`src/data/routes/de.json`、`src/data/gazetteer/oob_de.json`、`src/data/sources/oob_de.json` |
| B2 波兰与苏联 OOB | `src/data/oob/pl.json`、`src/data/oob/su.json`、`src/data/routes/pl.json`、`src/data/routes/su.json`、`src/data/gazetteer/oob_pl.json`、`src/data/sources/oob_pl.json` |
| C1 战线 | `src/data/fronts/*.json`、`src/data/pockets.json`、`src/data/demarcation.json`、`src/data/gazetteer/fronts.json`、`src/data/sources/fronts.json` |
| C2 事件 | `src/data/events.json`、`src/data/forces_summary.json`、`src/data/gazetteer/events.json`、`src/data/sources/events.json` |
| D 3D 模型与装备 | `src/three/models/**`、`src/three/viewer/**`、`tests/unit/models.test.ts`、`src/data/equipment.json`、`src/data/gazetteer/equipment.json`、`src/data/sources/equipment.json` |
| E 素材 | `scripts/assets/**`、`scripts/fonts/**`、`public/audio/**`、`public/fonts/**`、`public/photos/**`、`public/credits.json`、`src/audio/synth.ts`、`src/data/sources/assets.json` |
| 主代理 | 其余全部（`src/app`、`src/map2d`、`src/ui`、`src/geo`、`src/three/sandbox`、`src/styles`、`index.html` 等） |

**id 冲突**：地名 id 全局唯一。如果需要的地名已在其他分片中存在，直接引用即可，不要重复定义；同一 id 在不同分片中坐标相差超过 3 km 会被判为错误。

## 3. 自检命令（交付前必须执行）
```bash
cd /Users/yiti/Project/personalDoc/junqi
node_modules/.bin/tsx scripts/validate/validate_data.ts --quiet     # 结构/引用/时间/坐标/速度/阵营一致性
node_modules/.bin/tsx scripts/debug/render_debug.ts --date 1939-09-10T12:00 --out .debug/<代理>_0910.png [--labels] [--region 17,51,23,54.8]
```
执行后用 Read 查看 PNG 做目检。其他代理的文件缺失或出错时产生的 ERROR 不算你的问题；**你负责的文件必须 0 ERROR**。WARN 要逐条看，能修的就修。

## 4. 部队 id 规范与必用 id 清单
格式为 `side.代号`，全部小写，可用字符：`[a-z0-9_.]`。
- **德军**
  - 集团军群：`de.ag_nord`、`de.ag_sud`
  - 集团军：`de.3a`、`de.4a`、`de.8a`、`de.10a`、`de.14a`
  - 步兵军：`de.{罗马数字}_ak`，如 `de.i_ak`、`de.xxi_ak`
  - 摩托化军：`de.xiv_mk`、`de.xv_mk`、`de.xvi_mk`、`de.xix_mk`（古德里安）、`de.xxii_mk`（克莱斯特）
  - 临时军级集群：`de.korps_wodrig`、`de.korps_brand`、`de.korps_kaupisch`
  - 装甲师：`de.1pz` … `de.5pz`、`de.10pz`、`de.pz_kempf`
  - 轻装师：`de.1le` … `de.4le`
  - 摩托化步兵师：`de.2id_mot`、`de.13id_mot`、`de.20id_mot`、`de.29id_mot`
  - 步兵师：`de.{n}id`，如 `de.21id`
  - 山地师：`de.1geb`、`de.2geb`、`de.3geb`
  - 其他：`de.1kav`（第 1 骑兵旅）、`de.lssah`、`de.brig_eberhardt`（但泽）、`de.brig_netze`、`de.ss_germania` 等
  - 海军：`de.schleswig_holstein`（echelon=brigade，type=naval）
- **斯洛伐克**：`sk.bernolak`（集团军）、`sk.1d`、`sk.2d`、`sk.3d`、`sk.kalinciak`（快速集群）
- **波兰**
  - 统帅部：`pl.gnw`（echelon=armygroup）
  - 方面军：`pl.front_polnocny`、`pl.front_poludniowy`
  - 集团军：`pl.modlin`、`pl.pomorze`、`pl.poznan`、`pl.lodz`、`pl.krakow`、`pl.karpaty`、`pl.prusy`、`pl.lublin`、`pl.warszawa`、`pl.malopolska`
  - 独立作战集群（echelon=army）：`pl.sgo_narew`、`pl.sgo_polesie`、`pl.wyszkow`
  - 作战集群（echelon=corps）：`pl.og_{名称}`，如 `pl.og_czersk`、`pl.og_bielsko`、`pl.og_slask`
  - 步兵师：`pl.{n}dp`（`pl.1dp` … `pl.55dp`，含后备师）；山地步兵师：`pl.21dpg`、`pl.22dpg`
  - 骑兵旅：`pl.bk_wolynska`、`pl.bk_pomorska`、`pl.bk_mazowiecka`、`pl.bk_krakowska`、`pl.bk_wielkopolska`、`pl.bk_podolska`、`pl.bk_nowogrodzka`、`pl.bk_wilenska`、`pl.bk_kresowa`、`pl.bk_podlaska`、`pl.bk_suwalska`
  - 摩托化部队：`pl.10bk`（第 10 摩托化骑兵旅，马切克）、`pl.wbpm`（华沙装甲摩托化旅）
  - 山地旅：`pl.1bg`、`pl.2bg`、`pl.3bg`
  - 海岸防御：`pl.low`（滨海陆上防御）、`pl.hel`（赫尔筑垒地域）
  - 边防：`pl.kop_*`
- **苏军**
  - 方面军：`su.bel_front`、`su.ukr_front`
  - 集团军：`su.3a`、`su.4a`、`su.10a`、`su.11a`、`su.5a`、`su.6a`、`su.12a`
  - 骑兵机械化集群：`su.kmg_dzerzhinsky`
  - 军级：`su.15tk`、`su.25tk`、`su.2kk`、`su.4kk`、`su.5kk`、`su.6kk`、`su.3kk`
  - 旅级：`su.29ltb` 等

**梯队（echelon）**：`armygroup/front` 只用于树结构和标签；`army` 为 LOD0；`corps` 为 LOD1；`division/brigade` 为 LOD2。子单位的梯队必须严格低于上级，唯一例外是 division 可以下辖 brigade。

## 5. 部队轨迹语义
- `track` 按时间升序排列。每个点的 `status` 从该时刻起生效，后续点省略 status 时沿用上一个值。
- 师/旅级**必须**有轨迹，一般 6–20 个点：开战位置、每次重要机动、战斗地点、最终结局。军级建议写轨迹（取军部或主力位置）；集团军可以不写，不写时由程序自动取下属单位的质心，写了则取集团军主力中心。
- 行军速度上限（km/天）：步兵 40、骑兵 60、摩托化或装甲 90。长途机动要拆成多个点。
- 波兰部队被合围时 status 设为 `encircled`；突围或撤退时设为 `withdrawing`；最终结局用 `destroyed`、`surrendered`、`interned`（越境进入罗马尼亚、匈牙利、立陶宛或拉脱维亚被拘留）或 `disbanded`。结局点之后程序会让棋子在 48 小时内淡出。
- **9/17 之前不在战场上的部队**（苏军全部；9/4 组建的卢布林集团军等）必须设置 `active.from`，否则会在开战时就显示出来。苏军的第一个点放在苏联境内的出发位置，时间为 1939-09-17T03:00（CET）。
- `name.short` 是棋子上的标签，**必填**，不超过 8 个字符，例如 `4.Pz`、`XIX`、`7 DP`、`Wołyń`、`15 TK`。

## 6. 战线关键帧语义（C1）
- 每个关键帧写成一个文件：`src/data/fronts/<时刻，把 ':' 换成 '-'>.json`，时刻清单见 `config/keyframes.json`，共 23 个。
- `DE`：该时刻**德军（含斯洛伐克）在 1939 年波兰疆域内（含但泽）的全部占领区**，每一帧写全量，不写增量。
  - 多边形可以自由越出波兰国界，伸进德国、东普鲁士、斯洛伐克境内，建议伸出 20–60 km，这样国境附近的边缘会比较干净；程序只取波兰境内的部分。
  - 多边形的内环（holes）表示被合围的波兰包围圈，例如华沙、莫德林、布祖拉、拉多姆、利沃夫。
- `SU`：苏军在波兰境内的占领区，规则与 DE 相同，可以伸进苏联境内。9/17 03:00 之前必须为空数组。
- 两者都没覆盖的波兰领土即为波兰控制区。**德苏占领区在波兰境内不得重叠。**
- 顶点间距 8–30 km。战线沿河流展开时（维斯瓦河、纳雷夫河、布格河、桑河、布祖拉河、维普日河等）应加密顶点，贴合河道走向。
- 环不得自相交。首尾不必重复。
- 太小的据点（维斯特普拉特、但泽邮局）不必画进多边形，由事件标记表示。
- 9/20 以后德军按分界线后撤，德占区会缩小，这是正常的。

## 7. 事件、装备、素材
- 事件 `body` 为 80–140 字的中文。`photo.commons` 填 Wikimedia Commons 的**真实文件名**，如 `File:Bundesarchiv Bild 183-S55480, Polen, Westerplatte, Beschuss.jpg`，务必核实文件存在，且许可为公有领域、CC0、CC BY 或 CC BY-SA。
- 音效 id 见 `SFX_IDS`，照片会由 E 的脚本统一下载。
- 装备 `model` 取值见 `MODEL_IDS`。
- **装备 id 清单**（D 负责在 `equipment.json` 里定义；B1/B2 在部队的 `equipment` 字段中引用）：
  - 德国：`pz1`、`pz2`、`pz3`、`pz4`、`pz35t`、`pz38t`、`sdkfz231`、`sdkfz222`、`pak36`、`lefh18`、`ju87`、`he111`、`do17`、`bf109`、`bf110`、`schleswig_holstein`
  - 波兰：`7tp`、`tks`、`vickers_e`、`r35`、`wz34`、`wz29_ursus`、`pzl_p11`、`pzl_p7`、`pzl37`、`pzl23`、`wz35_atr`、`bofors_wz36`、`wz97_75mm`、`orp_orzel`
  - 苏联：`t26`、`bt7`、`bt5`、`t37`、`t28`、`ba10`、`i16`、`sb2`
  - 斯洛伐克：`lt35`
  
  允许在清单之外新增，但要在报告中列出。
- **临时文件**：一律写到 `.work/<代理名>/`（例如 `.work/b1/`）；下载缓存写到 `scripts/.cache/<代理名>/`。不要写到项目的其他位置。
- **可选地理对象**（由 A 提供）：`forest`（主要森林，如图霍拉森林、坎皮诺斯森林、比亚沃维耶扎森林、奥古斯图夫森林，属性 `zh`）。

## 8. 前端接口契约
- **D 模型**：`src/three/models/index.ts` 导出以下接口：
  ```ts
  export const MODEL_SPECS: Record<ModelId, { label: string; lengthM: number; widthM: number; heightM: number; kind: 'tank'|'car'|'infantry'|'cavalry'|'gun' }>;
  export function buildModel(id: ModelId): THREE.Group;              // 卡片展示版，≤ 20k 三角形，带材质与徽标
  export function buildInstanceGeometry(id: ModelId): THREE.BufferGeometry; // 沙盘实例版，≤ 1.5k 三角形，合并为单一几何，顶点色（color 属性），不依赖纹理
  ```
  约定：单位为米，原点在车底中心，+X 朝前，+Y 朝上。
  - `src/three/viewer/ModelViewer.ts`：`new ModelViewer(container: HTMLElement)`，方法 `.show(id: ModelId)`、`.dispose()`。内部懒创建并复用**单例** WebGLRenderer，页面上最多存在 1 个；带 OrbitControls、复古暖色光照、自动缓慢旋转。
- **E 音频**：
  - `public/audio/sfx.json`：`{ "src": ["audio/sfx.webm","audio/sfx.m4a"], "sprite": { "<SfxId 或 amb_*>": [startMs, durMs] 或 [startMs, durMs, true] } }`，与 howler sprite 格式一致。
  - `public/audio/music.json`：`[{ id, title, composer, performer, src:[...], license, sourceUrl }]`。
  - `src/audio/synth.ts` 导出：
    ```ts
    export function playSynth(ctx: AudioContext, out: AudioNode, id: SfxId, opts?: { gain?: number; pan?: number }): { stop(): void };
    export function startAmbience(ctx: AudioContext, out: AudioNode): { setIntensity(x: number): void; stop(): void };
    ```
    所有 SfxId 都必须有合成实现，作为素材缺失时的兜底。
- **E 照片**：`public/photos/index.json` 的结构为 `{ "<File:... Commons 文件名>": { src: "photos/<slug>.webp", w, h, title, author, license, licenseUrl, sourceUrl } }`。
- **E 字体**：`public/fonts/fonts.css` 定义以下字体族：
  - `'WB Serif SC'`：思源宋体 / Noto Serif SC，400 与 700 两个字重
  - `'WB Hand'`：霞鹜文楷，用于地图上的铅笔手写注记
  - `'WB Typewriter'`：Special Elite
  - `'WB Stencil'`：Stardos Stencil
  - `'WB Head'`：Oswald
  
  子集化脚本为 `scripts/fonts/subset.py`，扫描 `src/**`、`index.html` 和 `public/credits.json` 中出现的字符，可重复执行。
- **A 地理产物**：
  - `public/geo/vectors.topo.json`：**已投影到世界坐标**的量化 TopoJSON，包含 objects：`land`、`sea`（可选）、`countries1939`（属性 `id`：DE/PL/DZG/SK/PROT/HU/RO/LT/LV/SU/…，`zh`：中文名）、`rivers`（属性 `name`、`zh`、`rank` 1–4）、`lakes`、`marsh`（波列西耶沼泽等）。
  - `public/geo/poland1939.geojson`：**经纬度**，1939-08-31 时的波兰国界，不含但泽。
  - `public/geo/field_masks.bin`：Uint8 数组，尺寸 w×h 按 `frame.field` 取（512×438），行主序，每个格心的世界坐标为 `((i+0.5)*16, (j+0.5)*16)`。各比特含义：bit0 = 波兰，bit1 = 德国本土（含东普鲁士、梅梅尔、保护国），bit2 = 斯洛伐克，bit3 = 苏联，bit4 = 陆地，bit5 = 但泽，bit6 = 其他中立国陆地。
  - `public/geo/field_masks.json`：上述掩膜的元数据。
  - `public/tiles/base/{z}/{x}_{y}.webp`：z = 0..3，每级宽度见 `frame.tiles.levels`，瓦片 512 px。内容只含纸张、晕渲、分层设色、海洋与湖泊（含水波纹线），**不含**国界、河流与文字。
  - `public/terrain/height.png`：宽 1024，高按画幅比例。编码为 R 存高 8 位、G 存低 8 位，`v = R*256+G`，`elev_m = v/4 - 100`。
  - `public/terrain/albedo.webp`：宽 4096，内容同瓦片但**不含晕渲**。
  - `public/terrain/terrain.json`：地形元数据。
