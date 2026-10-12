# 新建一个战役

以「巴巴罗萨行动」为例。整个流程不需要改引擎或总台的代码。

## 0. 准备

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt   # 地理管线与字体工具
```

## 1. 生成骨架

```bash
npm run new-campaign -- barbarossa-1941 --title 巴巴罗萨行动 --en "Operation Barbarossa" \
  --orig "Unternehmen Barbarossa" --codename 巴巴罗萨行动 \
  --start 1941-06-22T03:15 --end 1941-12-05T23:59 \
  --bbox 20,44,42,61 \
  --sides "DE:德国:axis:Germany,FI:芬兰:axis:Finland,RO:罗马尼亚:axis:Romania,SU:苏联:comintern:USSR" \
  --force    # 已有筹备中的清单时覆盖
```

- `--sides` 每项 `阵营id:中文名:阵营类别[:1938年国名+…]`，阵营类别为 `axis` / `allies` / `comintern` / `neutral`。**第一个阵营是推进方**（控制区 A 槽，任何阵营都可以——太平洋的美国、阿拉曼的英联邦、淞沪的日本），与之对立的阵营的国家构成战区。1938 年国名取自 historical-basemaps 的 world_1938（Germany、USSR、Empire of Japan、China…），用于国界映射与场掩膜。
- `--width 4096` 画布更小、管线更快（小战区可以用）；缺省 8192。
- `--status planned` 只写总台卷宗所需的清单，战役先以「绝密 · 筹备中」的加封卷宗出现在总台上（参考 `campaigns/shanghai-1937`、`el-alamein-1942`、`guadalcanal-1942`）。
- `--region europe|med|china|pacific` 指定总台分区（缺省按火漆印位置判断）。

生成的内容：`campaign.json`（草稿，带全部缺省设置）、入口文件、`config/geo.config.json`、`config/lod.json`、能通过校验的最小数据（一个来源、一个地名、每方一个指挥部、开战关键帧、一个事件、兵力表），以及 `public/campaigns/<id>/` 的署名与照片索引。`campaigns/<id>/README.md` 是待办清单。

## 2. 地图资产

先核对 `config/geo.config.json`：

| 段 | 说明 |
|---|---|
| `frame` | 投影与画布：`bbox`、标准纬线、中央经线、画布宽、瓦片级别、场网格。改动后要重新生成全部资产并检查已有坐标 |
| `borders` | 开战时国界：`ids`（1938 年国名 → 阵营/国家 id）、`merge`（把几个 1938 年国家并成一个 id，如被吞并的领土）、`zh`；需要逐段修补的国界写进战役自己的脚本，在 `borders.script` 指向它 |
| `masks` | 场掩膜比特，须与 `campaign.json` 的 `control` 一致：`landBit`、`bits`（比特 → 国家 id；战区比特写进 `control.theatreBits`，进攻方本土写进 `slots[0].homeBits`）、`otherLandBit` |
| `rivers` / `lakes` | Natural Earth 的级别上限、中文名对照（只有带中文名的河流会被标注）、要剔除的战后水库 |
| `forest` / `marsh` | 林区与沼泽的近似轮廓：`[经度, 纬度, 东西半径km, 南北半径km, 旋转°, 随机种子]` |

然后：

```bash
sh tools/geo/run.sh barbarossa-1941          # frame → fetch → dem → borders → vectors → project → render → masks
sh tools/geo/run.sh barbarossa-1941 --skip-dem --from vectors   # 只改了矢量参数时
```

首次运行会下载 Natural Earth、world_1938 与 DEM 瓦片到 `.cache/geo/`（所有战役共用，之后走缓存）。产物：`config/frame.json`、`public/campaigns/<id>/geo/`（矢量与场掩膜）、`tiles/`（纸质底图瓦片）、`terrain/`（3D 地形贴图与高度图）。

## 3. 数据

格式见 [DATA-FORMAT.md](DATA-FORMAT.md)。建议顺序：

1. `data/sources/` 史料来源——之后所有数据都通过 `sources` 引用它们。
2. `data/gazetteer/` 地名：中文名、当时原名、坐标、级别（1 首都 … 4 村镇），轨迹与事件里用 `@id` 引用。
3. `data/oob/` 编制与轨迹：先集团军/军级骨架，再补师级；轨迹点写清状态变化（被围、撤退、投降）。
4. `data/fronts/` 控制区关键帧：开战、每个转折点各一帧；突然的变化（登陆、空降）用 `transition: "step"`。
5. `data/events.json`：每个事件 80–140 字，`importance` 1/2 的事件会在导演模式下驻留讲解；配 `photo` 时把照片放进 `public/campaigns/<id>/photos/` 并在 `index.json` 写署名。
6. `data/routes/`、`pockets.json`、`demarcation.json`、`equipment.json`、`forces.json`。

再完善 `campaign.json`：阶段（`phases`，可设镜头中心）、时间轴标记、侧栏简报与图例文字、国家与海域大字（`map.labels`）、导演警报与配乐（`audio.music` 用共享曲库的 id：polonaise、elegy、hejnal、operations）、开场文字、资料面板的地理数据说明。需要清单无法表达的行为时写插件（[PLUGINS.md](PLUGINS.md)）。

## 4. 校验与预览

```bash
npm run validate -- --campaign barbarossa-1941     # 错误必须修，警告逐条复核
npm run dev                                         # http://127.0.0.1:5180/campaigns/barbarossa-1941/
```

开发服务器里草稿也会出现在总台上（<http://127.0.0.1:5180/>）。战役专属的史实约束可以写进 `campaign.json` 的 `validation`（如某个占领槽在某时刻之前必须为空），也可以写成 `campaigns/<id>/tests/*.test.ts`（参考克里特与巴尔干的测试，用 `tests/helpers.ts` 的 `openCampaign(id)` 打开战役）。

## 5. 总台卷宗

`campaign.json` 的 `hub`：

- `pin` 火漆印位置；`stencil` 地图上的模板字（拉丁字母大写，缺省为 `title.en` 去掉冠词后大写），`labelAt` 模板字的方位（n/s/e/w）。
- `codename` / `codenameOrig` 卷宗上的代号章（中文 / 原文）。没有行动代号的战役写通行名称，代号属于哪一方都可以——总台不预设哪个阵营在前。
- `region` 总台分区（`hub/world.json` 的 `theatres`：europe、med、china、pacific），缺省按火漆印落在哪个分区的取景框内。新战区（如东非、阿留申）需要单独的分区时，在 `theatres` 里加一项即可，顶栏自动出现。
- `theatre`：用总台底图的国家 id 勾出战区（`{"countries": ["USSR"]}`，可用 id 见 `public/hub/world1938.topo.json`，波兰、法国、希腊、丹麦、英属印度、澳大利亚已按示意线拆分），或经纬度框（`{"bbox": [...]}`，`kind: "air"` 画成点线空域）。
- `cover` 封面照片（必须在 `photos/index.json` 里，总台会显示它的署名），`blurb` 一句话简介，`parent` 嵌套于哪个战役。

电报纸带的时间窗是 1937-07-07 至 1945-09-02，各国的阵营状态与电报在 `hub/world.json`。战役涉及的国家如果还没有时间表（或需要更细的变化），在 `countries` 里补上状态变化并注明来源（`sources`）；阵营代码不在 `nations` 里时，交战国筛选用 `sides[].name` 显示，补一项可以合并别名（如 UK → GB）。`npm test` 会检查拼错的国家 id、越界的日期与不存在的分区。

从总台进入战役的转场不需要任何配置：推进终点取 `map.fit` 的经纬度框（缺省为 `frame.bbox`），幕布由构建插件自动注入页面。

## 6. 发布

```bash
npm run fonts          # 新文字的字形补进共享字体子集
```

把 `status` 改成 `published`，然后 `npm run verify`（类型检查、测试、全部战役校验、构建）。构建产物里会多出 `dist/campaigns/<id>/`，总台自动出现可进入的卷宗。
