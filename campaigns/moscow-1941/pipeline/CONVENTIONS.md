# 莫斯科保卫战 · 全队共享约定（由队长冻结，成员只读）

本文件是 `campaigns/moscow-1941` 的**接口契约**。任何成员都不得改动本文件的既定取值；发现必须改动时，先报告队长。

## 1. 战役基本参数（已定，勿改）

| 项 | 取值 |
|---|---|
| 战役 id | `moscow-1941`（目录 `campaigns/moscow-1941/`，资产 `public/campaigns/moscow-1941/`） |
| 中文名 / 英文 / 原文 / 代号 | 莫斯科保卫战 / The Battle of Moscow / Битва за Москву / 台风行动 |
| 时间窗 | `epoch` `1941-09-30T00:00`，`start` `1941-09-30T00:00`，`end` / `dataEnd` `1942-01-31T23:59` |
| 叙事时区 | **莫斯科时间 UTC+3**（`tzLabel`），`utcOffset: 3`。所有 `at` 字段用此时间。来源给出柏林时间时按「柏林 = 莫斯科 − 2 小时」（1941-10-01 起中欧时间 CET 为 UTC+1；10 月前中欧夏令时为 UTC+2，即柏林 = 莫斯科 − 1，须逐条核对后再换算） |
| 阵营 | `DE`（德国，axis，prefix `de`，控制区 A 槽=推进方）、`SU`（苏联，comintern，prefix `su`）；`sideOrder: ["SU","DE"]` |
| 画布 | `bbox [30.6, 51.6, 40.4, 58.0]`，parallels `[52.5, 57]`，rotate `[-35.5, 0]`，center `[0, 54.8]`，width 8192 → **8192×8734**，`kmPerUnit` 0.082674，`field {cell:12, w:683, h:728}` |
| 控制区 | `mode: territory`；`landBit 4`；`theatreBits [0]`；`slots[0] = DE`（`homeBits: []`，画布内无德国本土）；`remainder` = 苏军控制区 |
| 掩膜 | bit0 = 1938 年苏联（= 整个战区），bit4 = 陆地，bit6 = 其余陆地。**全画布 497224 格同属 bit0 与 bit4**：画布内没有中立国，任何一格只要在陆地掩膜里就是战区，没有德军时归苏方 |

坐标系：世界坐标 = `frame.scale`/`translate` 下的投影像素，`x` 向右、`y` 向下，范围 `0..8192 × 0..8734`。地名「经纬度 → 世界坐标」对照表已生成：`campaigns/moscow-1941/pipeline/place-inventory.json` 与 `.work/moscow-build/places-xy.json`。**战线、路线、事件都用 `@地名id` 或经纬度书写，禁止手写世界坐标。**

## 2. 五个阶段（`campaign.json` 的 `phases`，队长在清单任务中落笔；成员按此分区）

| id | from | 名称 | 覆盖内容 |
|---|---|---|---|
| `typhoon` | 1941-09-30T00:00 | 台风行动：维亚济马与布良斯克 | 9/30 奥廖尔方向开攻，10/2 主攻，10/6—10/13 两大合围 |
| `mozhaisk` | 1941-10-13T00:00 | 泥泞与莫扎伊斯克防线 | 10/13 维亚济马陷落、10/10 西方面军重组、10/14 加里宁、10/18 莫扎伊斯克与小雅罗斯拉韦茨、10/19 戒严、10/27 沃洛科拉姆斯克、10 月泥泞期 |
| `november` | 1941-11-15T00:00 | 十一月攻势：克林、图拉与运河 | 11/15—16 第二波攻势、11/20—25 克林与索尔涅奇诺戈尔斯克、11/23—27 伊斯特拉、11/27—28 亚赫罗马与运河、11/30 克拉斯纳亚波利亚纳、图拉围攻、12/2 希姆基侦察 |
| `counter` | 1941-12-05T00:00 | 十二月反攻 | 12/5 加里宁方面军与西方面军反攻、12/8—15 解围、12/15—16 克林与加里宁收复、12/17—25 撤退、12/30 卡卢加收复 |
| `january` | 1942-01-07T00:00 | 一月总攻：勒热夫与维亚济马 | 1/8 勒热夫—维亚济马总攻、1/17—24 维亚济马空降、1/21 托罗佩茨、1/29 苏希尼奇、1/31 阶段终点 |

## 3. 地名 id（122 条，已写入 `data/gazetteer/{core,north,south}.json`，只可增补、不可改名）

`pipeline/place-inventory.json` 是唯一真源（含中文名、原名、经纬度、kind、rank）。常用 id：

- 莫斯科与近郊：`moscow` `kremlin` `krasnaya_polyana` `khimki` `mytishchi` `pushkino` `yakhroma` `dmitrov` `klin` `solnechnogorsk` `istra` `volokolamsk` `mozhaisk` `borodino` `naro_fominsk` `maloyaroslavets` `podolsk` `kubinka` `zvenigorod` `serpukhov` `kashira` `kolomna` `noginsk` `orekhovo_zuevo` `sergiyev_posad` `yegoryevsk` `ramenskoye` `lyubertsy` `vnukovo` `monino` `bykovo` `pereslavl` `voskresensk`
- 北/西：`kalinin` `torzhok` `staritsa` `rzhev` `zubtsov` `kholm_zhirkovsky` `sychevka` `gzhatsk` `vyazma` `lotoshino` `shakhovskaya` `yaropolets` `konakovo` `kimry` `kashin` `bezhetsk` `vyshny_volochek` `bologoye` `toropets` `kholm` `staraya_russa` `demyansk` `ostashkov` `selizharovo` `velizh` `demidov` `rudnya` `dukhovshchina` `yartsevo` `safonovo` `dorogobuzh` `smolensk` `moscow_canal` `ivankovo_res` `volga_r` `valdai` `lama_r`
- 南：`tula` `shchekino` `aleksin` `kaluga` `tarusa` `sukhinichi` `kozelsk` `belyov` `peremyshl` `venyov` `ryazan` `skopin` `mikhailov` `novomoskovsk` `medyn` `yukhnov` `mosalsk` `spas_demensk` `kirov_kaluga` `lyudinovo` `zhizdra` `bryansk` `dyatkovo` `karachev` `navlya` `trubchevsk` `sevsk` `orel` `mtsensk` `bolkhov` `novosil` `yefremov` `yelets` `livny` `kursk` `lgov` `fatezh` `shchigry` `tim` `kastornoye` `voronezh` `oka_r` `moskva_r` `protva_r` `ruza_r` `istra_r` `nara_r` `seversky_donets` `smolensk_heights` `meshchera` `losiny_ostrov`

新增地名必须：`id` 小写字母数字下划线、加进 `pipeline/place-inventory.json` 与对应 `data/gazetteer/*.json`、坐标落在 bbox 内、`sources` 引用来源 id。

## 4. 来源 id（46 条，已写入 `data/sources/*.json`）

- `data/sources/strategic.json`：`strat_okh_35` `strat_cmh_tomoscow` `strat_cmh_counter1` `strat_cmh_counter2` `strat_cmh_blitz` `strat_wiki_en` `strat_wiki_ru` `strat_zh_wiki` `strat_okh_taifun_order`
- `data/sources/german.json`：`ger_hgr_center` `ger_4a` `ger_9a` `ger_pzgr3` `ger_pzgr4` `ger_pzgr2` `ger_bock_diary` `ger_halder_diary` `ger_la_8flieger` `ger_weiss_101` `ger_guderian_panzerleader` `ger_winter_equipment`
- `data/sources/soviet.json`：`su_krivosheev` `su_zhukov_memoirs` `su_vasilevsky` `su_rokossovsky` `su_katukov` `su_belov` `su_pvo_moscow` `su_opolcheniye` `su_28_panfilov` `su_podolsk` `su_siberia` `su_parade_1941` `su_special_moscow` `su_cmd_konev` `su_cmd_zhukov_wf`
- `data/sources/geography.json`：`geo_naturalearth` `geo_histbasemaps` `geo_terrarium` `geo_moscow_plan` `stat_soviet_10_12` `stat_german_10_12` `stat_casualty_debate`
- `data/sources/photos.json`：`pho_commons` `pho_rian` `pho_bundesarchiv`

**纪律**：不得编造 URL、页码、档号；引用的每一条都必须真实存在于上述文件，或由成员在 `data/sources/` 增补后再引用（增补需在 `pipeline/source-registry.json` 同步登记）。回忆录（朱可夫、罗科索夫斯基、古德里安等）可作指挥视角，但数字必须与档案/研究交叉。

## 5. 部队 id 命名（硬约定，事件、路线、包围圈都按此引用）

`<prefix>.<name>`，`name` 只用于小写字母数字下划线：

- 德军：`de.hgr_center` `de.4a` `de.9a` `de.2a` `de.pzgr3` `de.pzgr4` `de.pzgr2` `de.3pz`/`de.4pz` 之类**不用于军团以上**；军：`de.vii_corps` `de.ix_corps` `de.xx_corps` `de.xxxx_corps` `de.pz5_korps` `de.pz9_korps` `de.pz20_korps` `de.pz40_korps` `de.pz46_korps` `de.pz57_korps`；师：`de.pz2` `de.pz6` `de.pz7` `de.pz10` `de.pz11` `de.pz17` `de.pz18` `de.pz19` `de.pz20` `de.pz5`、`de.id6` `de.id7` `de.id23` `de.id26` `de.id31` `de.id34` `de.id52` `de.id78` `de.id86` `de.id87` `de.id98` `de.id106` `de.id110` `de.id129` `de.id137` `de.id162` `de.id197` `de.id251` `de.id252` `de.id258` `de.id263` `de.id268` `de.id292` `de.id293`、`de.ss_reich`（党卫军"帝国"师）、`de.luftflotte2`（第 2 航空队）、`de.fliegerkorps8`（第 8 航空军）
- 苏军：`su.front_w`（西方面军）`su.front_reserve`（预备方面军）`su.front_bryansk`（布良斯克方面军）`su.front_kalinin`（加里宁方面军）`su.front_sw`（西南方面军）；集团军 `su.16a` `su.19a` `su.20a` `su.22a` `su.29a` `su.30a` `su.31a` `su.33a` `su.43a` `su.49a` `su.50a` `su.3a` `su.13a` `su.5a` `su.10a` `su.1sh_a`（第 1 突击）`su.61a` `su.4a` `su.2gv_kk`（近卫骑兵第 2 军）；师/旅 `su.316id`（第 316 步兵师，11/18 起第 8 近卫）`su.78id` `su.93id` `su.32id` `su.238id` `su.365id` `su.18id` `su.5id` `su.9id` `su.1gv_tbr`（第 1 近卫坦克旅，11/11 前为 `su.4tbr`）`su.1gv_kd` `su.2gv_kd` `su.4vdk`（空降第 4 军）`su.pvo_moscow`（莫斯科防空）`su.moscow_militia`（民兵师群）`su.nkvd_div`（内务人民委员部师）

> 说明：本节是**可用命名空间与写法参照**，不是必须全部实现的清单。未被 `pipeline/unit-ids.json` 采用的条目（如 `de.xxxx_corps`、`de.pz5_korps`、`de.pz9_korps`、`de.pz20_korps`、`su.4a`）可以忽略；以 `pipeline/unit-ids.json` 为最终事实。

**新建部队 id 必须登记**：`pipeline/unit-ids.json`（成员 D1 创建，事件任务据此引用）。上级可以是 `echelon: army`/`corps` 且 `display: "container"`；不能重复计入兵力。

## 6. 数据格式要点（与 `docs/DATA-FORMAT.md` 一致，摘录高频项）

- 事件：`{ id: "e.<小写下划线>", at, endAt?, category: battle|air|naval|political|atrocity|movement|surrender|siege, precision?: day|hour|minute, importance: 1|2|3, side?, title: {zh, orig?}, body: 中文 80–140 字, place: "@id"|经纬度, units?: [], photo?: {commons: "File:...", caption}, sfx?: [], zoomRel?, wide?, narration?, mapNote?, sources: [], confidence: high|medium|low }`
  - 正文长度按 `[...body].length` 计（含中文字符与标点），**必须落在 80–140**；
  - `photo.commons` 必须在 `public/campaigns/moscow-1941/photos/index.json` 里有条目；
  - 事件按 `at` 升序排列。
- 部队：`{ id, side, echelon, type, parent, name: {zh, orig?, short}, commander?: {zh, orig?}, strength?, equipment?: [{id,count}], model?, active?: {from?,to?}, track: [{at, pos, status?, note?, movement?}], history?, base?, display?: "container", sources, confidence }`
  - `echelon`：armygroup / front / command / army / air_fleet / air_group / corps / sector / wing / division / brigade / regiment / group / ship / squadron / gruppe
  - `type`：hq armor light motorized infantry mountain cavalry cavalry_mech border fortress naval marine artillery reserve airborne air aviation fighter bomber
  - `track` 时间严格递增；`status`：reserve active engaged encircled withdrawing destroyed surrendered interned disbanded evacuated ineffective inactive
  - 末级部队必须有 `track[0]`；军团级可用 `display: "container"` + 无 track（取下属质心）
  - 速度校验：步兵 ≤45 km/天、装甲/摩托化 ≤100、骑兵 ≤65、铁路/海运 ≤700（警告线，超出会 WARN）
- 路线：`{ id: "r.<...>", side, unit, style: main|secondary|counter|retreat|breakout, widthKm, movement?, role?, until?, fadeHours?, label?, waypoints: [{at, pos}...], sources, confidence }`
- 控制关键帧：`data/fronts/<at 冒号换连字符>.json`，`{ at, transition?: "smooth"|"step", control: { DE: [多边形...] }, note, sources, confidence }`，多边形 = `[外环, 洞...]`，环不闭合、≥3 点、不自相交；**槽内是「截至该时刻的全部占领区」**，不是增量。
- 包围圈：`{ id: "p.<...>", name: {zh}, start, end, anchor: "@id", fate: surrendered|broke_out|relieved|destroyed|handed_over, units?, note?, sources }`；`anchor` 必须在包围圈内（场模型校验：包围期间锚点须在苏方「洞」里）。
- 叠加层：`{ id, layer, kind: polygon|range|line, label?, polygons? | pos+rangeKm? | line?, style?, sources? }`；`layer` 必须在 `campaign.json` 的 `ui.extraLayers` 里登记。
- 装备：`{ id, side, name: {zh, orig?}, class, crew?, weightT?, armorMm?: [min,max], gun?, speedKmh?, count?, model?, photo?, desc: 60–140 字, sources }`；`class` 枚举见 schema（tank_light / tank_medium / tankette / armored_car / fighter / bomber / dive_bomber / ship / gun / small_arms / transport / glider / seaplane / torpedo）。
- 兵力：`{ sides: { DE: { name, commander, men?, divisions, tanks?, aircraft?, guns?, losses: {killed, wounded, captured?}, note? }, SU: {...} }, byPhase?: { <phase id>: {...} }, sources }`；数字缺省或 `null` 显示「—」。

## 7. 可用 3D 模型 id（`engine/three/models/index.ts` 已注册，**不得新增**）

`pz1 pz2 pz3 pz4 pz35t pz38t sdkfz231 stug3 7tp tks wz34 t26 bt7 t34 kv1 inf_de inf_pl inf_su inf_sk cav_pl cav_su art_gun inf_it inf_gr inf_yu inf_gb inf_au inf_hu inf_bg inf_nz para_de inf_fi inf_ro inf_allied navy_token air_token spitfire hurricane bf109 bf110 he111 do17 ju87 ju88 graf_spee exeter leander county renown ark_royal tanker merchant ar196 seafox walrus`

- 德军 → `pz3` `pz4` `pz38t` `stug3` `sdkfz231` `inf_de` `art_gun` `ju87` `bf109` `he111` `ju88` `do17` `bf110`
- 苏军 → `t34` `kv1` `t26` `bt7` `inf_su` `cav_su` `art_gun`
- 未建模装备（T-60、Il-2、MiG-3、BM-13 等）用 `inf_su`/`art_gun`/`air_token` 表示，并在 `ui.modelLabels` 说明「通用符号，不是型号码复原」。

## 8. 可用音效 id

sprite：`typewriter bell stamp paper explosion artillery stuka bomber engine tank ship_gun siren radio morse mg rifle march cavalry ui_click fanfare amb_wind amb_front amb_radio`
合成器追加：`fighter air_siren`（其余同名）

## 9. 校验红线（`tools/validate/validate.ts`）

- 事件正文 80–140、事件数须等于 `manifest.validation.eventCount`；
- 每帧文件名必须 = `at` 冒号换连字符；
- 多边形环不得自相交；`slotEmptyBefore` 之前槽必须为空；
- 轨迹时间严格递增、速度不超限；
- 部队 id 前缀必须是本阵营 `prefix`；上级必须存在且同阵营；
- 路线引用的部队必须存在且同阵营；
- 包围圈 `end > start`、`anchor` 必须可解析；
- `map.theatreCountries` 的 id 必须在 `vectors.topo.json` 的 `countries1939` 里（本战役只有 `SU`）；
- 事件引用的照片必须在 `photos/index.json` 且有实体文件；
- 静态资源必须存在（`geo/vectors.topo.json`、`geo/field_masks.bin`、`tiles/base/meta.json`、`terrain/*`、`credits.json`）；
- `hub.region` 必须是 `europe`；`hub.cover` 必须在 `photos/index.json` 中；
- 未被引用的来源会计 WARN，最终要**零警告**。

## 10. 文件作用域（避免并行冲突）

| 成员 | 只能写 |
|---|---|
| 研究-战略编制 | `docs/research/moscow-1941-part1-*.md`、`pipeline/research.json`（与战线进程协作，只追加自己的段落） |
| 研究-战线进程 | `docs/research/moscow-1941-part2-*.md`、`pipeline/front-lines.json` |
| 工程-地理战线 | `pipeline/make_fronts.py`、`data/fronts/*.json` |
| 工程-编制数据 | `data/oob/*.json`、`data/routes/*.json`、`data/pockets.json`、`data/overlays.json`、`data/equipment.json`、`data/forces.json`、`pipeline/unit-ids.json`（可增补 `data/gazetteer/` 与 `data/sources/`，改后同步 `pipeline/*-registry.json`） |
| 工程-事件史料 | `data/events.json` |
| 工程-清单总台 | `campaign.json`、`campaign.ts`、`main.ts`、`index.html`、`campaign.css`、`plugins/**`、`data/ext/**`、`public/campaigns/moscow-1941/photos/**`、`public/campaigns/moscow-1941/credits.json`、`pipeline/fetch_photos.py`、`pipeline/photo-evidence.json` |
| 审查-史实一致 | 只读；报告写 `docs/REVIEW.md` |
| 验证-集成发布 | `tests/**`、`docs/**`（含 `campaigns/moscow-1941/docs/**`）、`README.md`、`shared/fonts/**`（经 `npm run fonts`） |

**禁止**：改 `engine/**`、`hub/**`、`tools/**`、其他战役目录、`package.json`。

## 11. 常用命令

```bash
cd /Users/yiti/Project/militaryChess
node tools/geo/emit_frame.mjs moscow-1941     # 只重算 frame.json（改 geo.config.json 的 frame 后）
sh tools/geo/run.sh moscow-1941 --skip-dem --from vectors   # 只重建矢量/tiles/masks
npx tsx tools/validate/validate.ts --campaign moscow-1941   # 单战役校验（最常用）
npx vitest run campaigns/moscow-1941/tests                  # 战役测试
npm run dev                                                 # 5180 预览
```

## 12. 史实争议的写法（强制）

- **伤亡**：并列口径，不取单一数字。苏方防御阶段不可恢复 514,338 / 卫生 143,941（克里沃舍耶夫）；德方 10 月—12 月初约 145,000，12 月 103,600，1 月 144,900，四个月合计约 436,900（德军十日报告）；博克 1941-10-19 命令宣称俘 673,098 人、坦克 1,277 辆、火炮 4,378 门——写明这是**德方战时宣称口径**，与当代研究并列。
- **「28 名潘菲洛夫战士」**：必须写明 2016 年俄总检察院认定该报道系虚构，但 1941-11-16 第 316 步兵师在杜博谢科沃一带的战斗真实存在；不采用「全部 28 人」叙事作为史实。
- **波多利斯克军校生**：人数与战果多有不实，按研究口径写「约 3,500 名学员与教员」，不写夸大的「阻止了德军两天」单一因果。
- **「冬将军」**：不能把失败归为单一严寒。要写：10 月泥泞、11 月道路冻结、12 月 −20℃ 以下（12/5 前后莫斯科 −25℃ 量级）、德军冬装与防冻准备不足、铁路补给瓶颈、苏军预备队与远东师团、苏军同样受冻。
- **佐尔格情报**：写「影响存在争议」，不写成唯一原因。
- **十月十六日恐慌**：区分事实（政府机构与外交团迁古比雪夫、部分居民外逃、10/19 戒严）与传说（「斯大林留下」的细节）。
- **红场阅兵 11/7**：写实况（受阅部队直接开赴前线、斯大林讲话引用亚历山大·涅夫斯基等历史人物）。
- **日期异说**：同一事件有多个日期时，`at` 取多数档案口径，并在 `mapNote` 或 `body` 中写明异说。

## 13. 质量门槛

- `npx tsx tools/validate/validate.ts --campaign moscow-1941` **0 错误 0 警告**；
- 事件正文全部 80–140 字；
- 每个重要节点的事件 `importance` 与阶段匹配（每阶段至少 3 条 importance 1）；
- 不编造 URL、页码、档号；无法核实的细节写成「常见说法」「争议」或直接删除。
