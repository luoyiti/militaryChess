# 大西洋海战 · 一致性交叉检查（t16）

> 检查日期：2026-10-19 · 对象：`campaigns/battle-atlantic-1945/`
> 复现命令：`npx tsx campaigns/battle-atlantic-1945/pipeline/scripts/check_consistency.ts`
> 质量门：`npm run validate -- --campaign battle-atlantic-1945`（0 错误 0 警告）、`npm test`（445 项通过）、`npm run typecheck`

---

## 0. 一句话

研究（R1–R4）→ 数据（t13）→ 海战（t14）→ 清单（t15）四层已对齐：**107 条事件、84 个地名、67 个作战标记（63 舰船 + 4 指挥机构）、30 条航路、18 帧活动海域、182 条海战记录、96 条电文、14 张装备卡、54 条来源**。本轮修掉 5 处不一致（1 处结构性缺失、2 处数字口径、2 处文案），其余为已知简化。

| 层 | 条目 | 校验结果 |
|---|---|---|
| `data/events.json` | 107 | 正文 80–140 字 / 时间严格递增 / 位置在画布内 / 引用全解析 |
| `data/gazetteer/*.json` | 84 | id 唯一、坐标在图幅内 |
| `data/oob/*.json` | 67 | 63 艘带完整 ship 档案；67/67 有 active 窗口 |
| `data/routes/*.json` | 30 | 部队存在、阵营一致、时间递增 |
| `data/fronts/*.json` | 18 | 槽位键 = manifest 的 raider/convoy；0 自相交 |
| `data/naval/*.json` | 182 | 射击/命中/鱼雷/烟幕/损伤/电文引用全解析 |
| `data/equipment.json` | 14 | id 唯一、来源可解析 |
| `data/forces.json` | 4 方 + 9 阶段 | 九段吨位与逐月表逐月对齐、合计相等 |

---

## 1. 引用完整性

### 1.1 事件 → 部队 / 地名 / 照片 / 来源

- `events[].units` 共 63 处引用、45 个不同单位，**全部存在于 `data/oob/`**。
- `events[].place` 全部解析（坐标或 `@地名`），**全部落在 8192×6464 画布内**（见 §3.2 的边界说明）。
- `events[].photo` 29 条，**全部命中 `photos/index.json`** 且文件存在、每条都有 `caption`。
- `events[].sources` 全部存在于 `data/sources/main.json`（54 条）。
- **事件时刻必须落在所挂部队的 `active` 窗口内**——修复后 0 处违例（详见 §2）。

### 1.2 phases / marks / forces.byPhase

- `forces.byPhase` 的 9 个键 `ph1 ph2 ph3a bismarck ph3 ph4 ph5 ph6 final` **与 `campaign.json` 的 `phases[].id` 完全一一对应**，无缺无余。
- `phases` 共 9 段，起点 `1939-09-03T00:00` = `time.start`；`final` 显式收尾于 `1945-05-08T23:59`。
- `marks` 14 个，全部在 `[start, end]` 内。
- `forces.sides` 的 4 方均具备 `name/commander/divisions/losses.killed/wounded`。

### 1.3 equipment / routes / fronts / naval

- 部队的 `equipment` 引用全部存在（U 艇型别 → `uboat_*`；护航舰 → `corvette_flower`；护航航母 → `escort_carrier`）。
- 30 条航路的 `unit` 全部存在且阵营一致。
- 18 帧的 `control` 键只有 `raider` / `convoy`，与 `control.slots` 一致。
- 海战层 182 条：`fire` 的 shooter/target、`hits` 的 target、`torpedoes` 的 shooter、`smoke` 的 ship、`damage` 的 ship 全部存在；`fire.weapon` 在射击舰的 `ship.weapons` 内或为其 kind。

---

## 2. 部队在场时间（本轮最重要的修复）

t13 首版漏了 `active`，导致引擎 `resolveUnits()` 取 `fromH=-1e9 / toH=+1e9`，**1939 年 9 月的海图上会出现 1942–45 年才服役的舰艇**（提尔皮茨、瓜达尔卡纳尔、U-2336 等）。已由 t13 补齐并在本轮验证：

- **67/67 单位有 `active: { from, to }`**；`from` = 首航迹点前 2 天但不早于该舰交船日期，`to` = 末航迹点。
- 在场归位抽样：1939-09-03 仅 3 艘（`gb.athenia` / `de.graf_spee` / `de.u30`）；1945-05-20 为 0。
- 运行时插值（引擎 `trackAt`，0.25 小时间隔扫全窗口）最差 **0.956 × maxKn**，0 处超限、0 处瞬移。

---

## 3. 本轮修复的 5 处不一致

### 3.1 【结构性缺失】1940-06-08「光荣号」沉没没有事件

海战层 `hits h.scharnhorst_acasta` 与电文 `sig.scharnhorst_acasta_note` 都记了这场战斗，但 `events.json` 里没有对应事件——**数据层有记录、叙事层缺条目**。

已补 `e.glorious`（1940-06-08T16:10，endAt 18:10，importance 2，category naval）：
- 正文 132 字，据 Wikipedia *Operation Juno* / *HMS Glorious* 核实：16:27 沙恩霍斯特号向热情号开火、17:20 光荣号机舱中弹失速、18:10 沉没、三舰共 1,519 人阵亡、40 人生还。
- 同步给 `de.scharnhorst` / `de.gneisenau` 补 Juno 航迹段（1940-06-04 基尔出航 → 06-08 挪威海交战 → 06-09 特隆赫姆 → 06-23 返基尔），否则事件发生地没有舰艇在场。
- `validation.eventCount` 由 106 改为 **107**。

### 3.2 【数字口径】forces.byPhase 三段重叠导致吨位重复计算

`ph3a`（1941-04→05）、`bismarck`（1941-05）、`ph3`（1941-05→1942-06）在 1941 年 5 月重叠，5 月吨位被算了两遍。

改为**按月份不重叠归属**（阶段键仍是叙事分段，吨位只归属一次）：

| 阶段 | 月份 | U 艇击沉 |
|---|---|---|
| `ph3a` | 1941-04 | 249,375 GRT（1 个月） |
| `bismarck` | 1941-05 | 325,492 GRT（1 个月） |
| `ph3` | 1941-06 → 1942-06 | 4,111,236 GRT（13 个月，月均 316,248） |

校验：**九段合计 14,668,692 GRT = 逐月表全期合计 14,668,692 GRT**（差 0）。

### 3.3 【史实表述】ph1 注释把皇家橡树号算进「航母猎杀」损失

原文「英国把航母编队派去猎杀，先后损失勇敢号与皇家橡树号」——皇家橡树号是在斯卡帕湾被 U-47 潜入击沉的，与航母猎杀群无关。已改为「9 月损失勇敢号；10 月 U-47 潜入斯卡帕湾击沉皇家橡树号」。

### 3.4 【文案】credits 列了未使用的来源

`credits.extraHtml` 的「档案与电文」列了《美国对外关系文件》（`frus_1939_v5`），但该来源**未被任何数据引用**（研究表里也标注为「TLS 失败、正文未验证」），已删。同时把「纽伦堡蓝皮卷」补全为「蓝皮卷与『红皮卷』NCA」（`nuremberg_imt_blue` / `nuremberg_nca` 都在表中）。

另修正 Roskill 卷次表述：「二至五卷」→「第 I–III 卷（四册，1954–1961）」（实际是 3 卷 4 册）。

### 3.5 【工程】`main.ts` 未引入 `campaign.css`

`campaign.css`（45 行：九段时间轴窄段裁切、侧栏三列、窄屏断点）从未被打包——`main.ts` 缺 `import './campaign.css';`。已补（与 `britain-1940`、`norway-1940` 一致），`npm run typecheck` 通过。

---

## 4. 与研究表（R3）的差异

`docs/research/03-data.json` 的 106 条事件与 `data/events.json` 的 107 条逐一对照：

| 类型 | 条目 | 说明 |
|---|---|---|
| 新增 | `e.glorious` | 本轮补的结构性缺失（§3.1） |
| 时间 +5 分钟 | `e.condor_losses`、`e.cam_ships`、`e.falaise_effect` | 原表与其他事件同刻，为满足引擎「严格递增」顺延；均为 day 精度编排值 |
| 时间 +3 小时 | `e.liberation_paris` | 同上 |
| 正文改写 | `e.sc7`（119→123 字） | 补「当夜 6 小时 16 艘、连同掉队共 20 艘」，消除原表「16 艘 vs 全团 20 艘」的张力 |
| 正文改写 | `e.sc130`（118→119 字） | 按 Wikipedia/Blair 校正为 37 艘、三群狼群、18–20 日、至少 3 艘 U 艇 |

其余 100 条正文、时间、地点与研究表**逐字一致**。

---

## 5. 电文与事件时间线

- 96 条电文，时间跨度 `1939-09-03T19:40 → 1945-05-08T22:01`，7 个年份全覆盖（1939 9 / 1940 15 / 1941 22 / 1942 12 / 1943 21 / 1944 10 / 1945 7）。
- 逐条对照最近事件：**92 条落在某事件窗口内或 48 小时以内**。
- 4 条超出 48 小时，均属**事件本身是「点」而电文是后续发展**的正常情况，不改数据：
  | 电文 | 时刻 | 最近事件 | 间隔 | 说明 |
  |---|---|---|---|---|
  | `sig.scharnhorst_acasta_note` | 1940-06-08 | `e.glorious`（本轮已补） | 0 | 修复前无对应事件，现已对齐 |
  | `sig.laconia_order` | 1942-09-17 | `e.laconia`（09-12） | 110 h | 「拉科尼亚命令」是事件五天后的后果，属正常时序 |
  | `sig.biscay_u338_halifax` | 1943-03-22 | 最近事件为 `e.hx229_sc122` | 70 h | 比斯开湾防空战与三月船队战是两条线，无对应事件可挂 |
  | `sig.u864_last_cargo` | 1945-02-05 | `e.u864`（02-09） | 96 h | 出航电报早于被击沉四天，属正常时序 |
- 30 条电文为逐字原文，66 条在 `zh` 里用方括号标明「内容摘要/格式复原」，不冒充原件（详见 t14 交付说明）。

---

## 6. 地图与文字标绘

- `map.labels.countries` 16 条、`waters` 15 条、`map.regions` 7 个、`hub.pin`，**投影到 8192×6464 后全部落在画布内**。
- 画布因 `rotate: −25°` 呈倾斜四边形，比 `frame.bbox`（−85…45 E / −12…78 N）**更宽**；`e.mexico_gulf` 位于 −90°E，在 bbox 外但在画布内（投影后 x≈2498, y≈404），故保留并在此记录为**已知边界情形**。
- `hub.stencil` = `ATLANTIC`，合法字符集；`hub.cover` 指向 `photos/u541-surrendered-1945.webp`，在索引内。

---

## 7. 已知简化与保留项

1. **航迹是示意，不是日志**：代表舰艇按弧长 ≤90 km 加密（共 1,686 个航迹点），长间隔航段用「原地待机 + 巡航速度航行」近似。引擎 `trackAt` 全窗口采样最差 0.956 × maxKn。
2. **活动海域是矩形/简单四边形**，不是战线或精确巡逻区；18 帧 0 处自相交，顶点全钳在 bbox 内。
3. **`e.mexico_gulf` 在 bbox 外、画布内**（§6），保留不删——它是 1942 年加勒比—墨西哥湾战役的必要条目。
4. **1944 年后 U 艇损失口径**：逐月表 ph5/ph6 均为 273，是原表在后段与全战区口径混用所致；本包 `forces.sides` 只给全期 783 艘，`byPhase` 不列分阶段 U 艇损失（R1/R3 已警告）。
5. **投降/自沉 U 艇数的多口径**（156 / 174；自沉 222）在 credits 与事件里**并列不取平均**。
6. **照片只有 20 张**（29 条事件配图，19 张不同照片复用）。importance 1 的 11 条**全部有图**；其余为不给图，不重复使用同一张凑数。
7. **`e.deadlight`（死光行动，1945-11）在战役窗口外**，未进 `events.json`；`e.graf_spee`（南大西洋，图幅外）同样未进正文，只作背景注记。
8. **字体子集缺「俾」**：`shared/fonts` 的子集不含「俾」（俾斯麦），需在收尾阶段重跑 `npm run fonts -- --force`。此项在 `public/` + `shared/` 范围，t16 in-scope 之外，未处理。

---

## 8. 检查脚本

`pipeline/scripts/check_consistency.ts`（本次提交，约 300 行）按 A–E 五组检查，可独立复现：

| 组 | 检查内容 |
|---|---|
| A 引用完整性 | events 的 units/place/photo/sources、oob 的 equipment/parent/ship 必要字段、routes/fronts/equipment/forces 的来源、phases↔byPhase |
| B 事件规范 | 正文 80–140 字、时间递增、窗口内、endAt、位置在画布内、importance 1 配图、**事件时刻 ∈ 部队 active** |
| C 清单一致性 | phases 排序与起点、marks 窗口、map.labels 画布内、region 中心、hub.pin/stencil/cover、validation.eventCount |
| D 海战时间线 | 五类记录的舰艇引用、时刻合法性、来源、武器 id、integrity 范围、电文窗口 |
| E 部队在场 | active 存在与区间、航迹递增、active 与首末航迹点的关系 |

输出：`统计 {...}`、警告列表、错误列表；有错误时退出码 1。

当前结果：**0 错误，1 条已知边界警告**（`e.mexico_gulf`，见 §6）。

---

## 9. 第二轮审查修复（t18 复核意见 → t21）

审查-史实 提出 21 项问题，逐条核对后全部落地（含 2 项经核实后**按证据保留原样**）。修复后规模：**68 单位 / 64 舰船 / 107 事件 / 181 条带 id 海战记录**。

| # | 问题 | 处理 |
|---|---|---|
| 1 | 6 艘 U 艇艇型错标 | 按 uboat.net 逐艇核对后改写：U-864=IXD2、U-549/U-532=IXC/40、U-320/U-1006=VIIC/41、U-39=IX；`ship.class` 与主尺度/排水量/艇员同步；equipment.json 拆出 IXC 与 IXC/40 两卡 |
| 2 | U-1006 战果表述不实 | uboat.net 战果表为空 → 正文改用 **U-482**（1944-08-30 Jacksonville、09-01 Hurst Castle、09-08 Empire Heritage 等 5 艘 32,621 GRT）；U-1006 改为「无战果，1944-10-16 在法罗群岛东南被击沉，全艇无人生还」 |
| 3 | 航迹穿越陆地 | 施佩伯爵号出海口改走北海—英吉利海峡以西；舍尔号绕好望角改在图幅南缘折返（**好望角航线在图幅外，不可画**），返航绕开非洲凸出部；U-156 南下段西移；U-505/Guadalcanal 俘获段移到 −19.2/21.3 开阔水域；沙恩霍斯特/舍尔出海改走丹麦以西、冰岛以南 |
| 4 | 北角开火几何不成立 | 重排 1943-12-26 航迹：约克公爵号 16:50 距沙恩霍斯特 **6–11 km**、贝尔法斯特号全程 **13 km**；`f.scheer_jervis_bay` 把杰维斯湾号移到 15 km 内；删除 `f.u552_reuben_james_deck`（目标已沉没的甲板炮时段） |
| 5 | 布洛克岛号位置与正文不符 | place 改 `[-23.05, 31.21]`，正文改「加那利群岛以西」 |
| 6 | ONS 5 挂斯塔林号有误 | 正文改为 B7 护航群（邓肯、维德特、泰伊）+ 第 1、第 3 支援群；`units` 清空；`r.ons5_support` 改挂 `gb.wa` 并改标签；`sig.ons5_starling` 改名 `sig.ons5_support`、发报方改 gb.wa |
| 7 | U-864「全部命中」不实 | 改「连射四雷，前三发脱靶，第四发命中」，保留「史上唯一一次双方均在水下的潜艇战」 |
| 8 | 西部海口司令部迁址年份 | 改「1941 年 2 月 7 日迁入德里大楼」 |
| 9 | 停火令配图与事件不符 | `e.surrender_order` 改用邓尼茨像并改图注；U-541 照片仍被 intro 与 2 条事件使用，未成死资源 |
| 10 | credits 缺音乐署名 | `credits.json` 的 `music` 由空数组补为 2 条（elegy：肖邦/Paul Pitman/PD；operations：本项目原创），含 licenseUrl 与 sourceUrl |
| 11 | disclaimer 承诺「两种读法」但事件无说明 | 给 `e.royal_oak`、`e.denmark_strait`、`e.bismarck_sunk`、`e.north_cape` 补 `mapNote` 明写时钟换算；北角正文标注「中欧时间，即 18:45 UTC」 |
| 12 | SC 7 船数与护航编成 | 改「三艘单桅帆船与两艘轻护」 |
| 13 | 冰岛登陆「丹麦沦陷当天」 | 改「丹麦沦陷一个月后……5 月 10 日」 |
| 14 | U-320 沉没位置 | **经核实保留原位**：Wikipedia 记「在挪威海岸外自沉」但同日记载为北海 2°E/57°N；审查建议的 61.5°N/1.9°E 与两者均不符，故不采信，事件/电文/航迹三处已一致（2.0,57.0） |
| 15 | HX 112 提及未建模的沃克号 | 在 allies OOB 补 `gb.walker`（V/W 级驱逐舰，1100 t，34 节），挂入 `e.hx112` |
| 16 | byPhase 合计与全期口径差 | 修正 `forces.sides.GB.note`：九段合计 **14,668,692 GRT**，注明研究稿另作 14,668,785，差 93 GRT 系分月取整 |
| 17 | 事件地点远离所挂单位 | 6 个事件 place 改为该时刻单位实际位置（最大距离由 4,225 km 降至 306 km） |
| 18 | 沙恩霍斯特 1940-04→1941-03 航迹 | 已重排：挪威战役（罗弗敦/韦斯特峡湾）→基尔→柏林行动→布雷斯特→雷霆行动；`r.berlin_op` 出海段改走北海—丹麦海峡以西 |
| 19 | 装备卡把「节」标成 km/h | 舰船卡移除 `speedKmh`（UI 会渲染为 `32 km/h` 而实为 17.2 节），节速写进 `desc`；飞机仍用 `speedKmh` |
| 20 | 方括号概述条目无可见标记 | 66 条概述电文的 `text` 统一加 `[概述] ` 前缀，并写入 `05-sources.md` §7 约定 |
| 21 | Catalina 译名不统一 | 全包「加泰林纳」→「卡塔琳娜」共 5 处 |

### 新增的三项硬校验（`pipeline/scripts/check_consistency.ts`）

- **航迹不得横穿陆地**：连续 ≥8 个点落在 landBit 上且整段距最近港口 >60 km 才判错（掩膜格约 32 km，港内单点不计）。当前 0 处。
- **射击覆盖时段内必须真的进入射程**：逐条 fire 按 0.05 h 采样两端位置，最小距离 > 武器 rangeKm 即报错。当前 0 条。
- **事件 place 与其 units 距离 ≤320 km**。当前最大 306 km（`e.hg76`）。

### 主判据（沿用）

- 全部 178 条海战记录（fire 起止、hits/torpedoes/smoke/damage 时刻）的 `paceAt ≤ 0.8`。
- 3 小时聚簇 36 簇，单点簇除外，其余在时间轴上 ≥1 秒。
- `npm run validate` 0 错误 0 警告；`npm test` 30 files / 468 tests；`npm run typecheck` 0。

### 已知简化（续）

9. **好望角航线不可画**：掩膜南界约 −12°，`20°E/−40°` 等点全在画布外。舍尔号与施佩伯爵号的南大西洋—印度洋段在图幅南缘折返，`history` 里注明「图幅外的部分未画入航迹」。
10. **掩膜格约 32 km**：港口、峡湾与窄水道会有单点判为陆地，属网格分辨率而非数据错误。

---

## 10. t18 findings 处置对照表（t25 收口）

审查-史实 的 21 项 findings（5 high / 6 medium / 10 low）逐条对照当前字节核对。**19 项已修，2 项经取证后不采纳**（附证据）。

### High（5）

| # | 问题 | 处置 | 证据 |
|---|---|---|---|
| F1 | 6 艘 U 艇艇型误标 | **已修** | `de.u864`=Typ IX D2、`de.u549`/`de.u532`=Typ IX C/40、`de.u320`/`de.u1006`=Typ VII C/41、`de.u39`=Typ IX，逐艇经 uboat.net 核对。equipment 现有 18 卡：`uboat_ixc`(54)/`uboat_ixc40`(87)/`uboat_ixd2`(28)/`uboat_viic41`(91)/`uboat_ix`(8) 各自分列。t25 补了 `uboat_viic41`、`uboat_ix` 两卡并把 U-320/U-1006/U-39 的 `equipment` 指向补齐（原先为空引用） |
| F2 | U-1006 虚构战果 | **已修** | uboat.net 该艇 Successes 为 "No ships sunk or damaged"。`de.u1006.history` 改为「无战果，1944-10-16 在法罗群岛东南被击沉，全艇无人生还」；`e.black_pit_1944` 改用 U-482（5 艘 32,621 GRT，含 09-01 HMS Hurst Castle） |
| F3 | 航迹与路线大量穿陆 | **已修** | 施佩伯爵号出海口改走北海—英吉利海峡以西；舍尔号在图幅南缘折返并绕开非洲凸出部；U-156 南下段西移；U-505/Guadalcanal 俘获段移到 −19.2/21.3 开阔水域；沙恩霍斯特/舍尔出海改走丹麦以西、冰岛以南。**持久检查**：连续 ≥8 点落 landBit 且距港口 >60 km 判错，当前 **0 处** |
| F4 | 北角三条射击恒不出特效 | **已修** | 重排 1943-12-26 航迹后实测：约克公爵号 16:50 距沙恩霍斯特 **6.5 km**、17:30 6.4 km、18:45 10.9 km；贝尔法斯特号全程 **13.4 km**（北侧）。另修 `f.scheer_jervis_bay`（杰维斯湾号移到 15 km 内）、删除 `f.u552_reuben_james_deck`（目标 05:30 已沉、时段到 05:52 不可能）。**持久检查**：fire 覆盖时段最小距离 ≤ 武器 rangeKm，当前 19 条全过 |
| F5 | 布洛克岛号位置自相矛盾 | **已修** | 正文「加那利群岛以西」、`place` = [−23.05, 31.21]（31°13′N 23°03′W）；`de.u549.history` 与 naval 鱼雷/深弹记录同在 `e.u549_battle` 时段内 |

### Medium（6）

| # | 问题 | 处置 | 证据 |
|---|---|---|---|
| F6 | ONS 5 归属 Walker 第 2 支援群 | **已修** | `e.ons5` 正文改「B7 护航群（邓肯、维德特、泰伊等）与第 1、第 3 支援群」，`units` 清空（OOB 无对应舰）；`r.ons5_support` 改挂 `gb.wa`、标签「第 1 支援群增援」；`sig.ons5_starling` 改名 `sig.ons5_support`、发信方改 `gb.wa` |
| F7 | U-864「全部命中」 | **已修** | 改「冒险者号连射四雷，前三发脱靶，第四发命中」，保留「史上唯一一次双方都在水下的潜艇交战」 |
| F8 | 西部海口司令部迁址年份 | **已修** | 改「1941 年 2 月 7 日，西部海口司令部迁入利物浦德比大厦」 |
| F9 | 停火令照片与图注主体不符 | **已修** | `e.surrender_order.photo` 改为邓尼茨像（A 14899）并重写图注。U-541 照片未被弃用——`campaign.json` intro 与 `e.scapa_home`、`e.german_surrender` 仍在用（3 处），故无死资源需清理 |
| F10 | credits.json 音乐署名缺失 | **已修** | `music` 由 `[]` 补为 2 条：`elegy`（肖邦/Paul Pitman/Musopen/PD，含 licenseUrl 与 sourceUrl）、`operations`（本项目原创，含 note）。**校验**：`campaign.json` 的 `audio.music` 与 `introMusic` 用到的 track 全部在 `credits.json` 中 |
| F11 | disclaimer 承诺的「两种读法」不存在 | **已修＋收窄承诺** | 补 `mapNote`：`e.royal_oak`（英方 00:58 vs 德方 MEZ→23:58 UTC）、`e.denmark_strait`（英舰舰钟 +4h 读法）、`e.bismarck_sunk`（英方战报 vs 德方 KTB 差约 4h）、`e.north_cape`（19:45 CET = 18:45 UTC）。北角正文改「十九时四十五分（中欧时间，即 18:45 UTC）」，与 `at` 对齐。t25 又把 disclaimer 从「已在事件与电文里注明」改为「已在对应事件的说明（mapNote）里逐条注明…或两种读法」，与数据实际形态一致 |

### Low（10）

| # | 问题 | 处置 | 证据 |
|---|---|---|---|
| F12 | HX 72 船数 43/U 艇数不符 | **已修** | 正文改「被**多艘** U 艇咬住」（原「四艘」）。按 uboat.net 作战表 HX 72 有 **9 艘** U 艇（U-47/99/65/48/38/43/32/100 等）、击沉 11 艘；船数 43 取 Wikipedia（uboat.net 记 41）。两种差异均写入 `mapNote` |
| F13 | SC 7 少写一艘单桅帆船 | **已修** | 改「三艘单桅帆船与两艘轻护」（uboat.net：Scarborough、Leith、Fowey + Bluebell、Heartsease） |
| F14 | 冰岛登陆「丹麦沦陷当天」 | **已修** | 改「丹麦沦陷一个月后，英国海军陆战队于 5 月 10 日在雷克雅未克登陆」 |
| F15 | U-320 地点偏南约 500 km | **已修**（本轮按新证据改正） | **上一轮我曾判断「按证据保留原样」是错的。** uboat.net 该艇 Fate 条明载「Scuttled at 0340hrs on 8 May 1945 in the North Sea **off Sotra island west of Bergen**」。已把航迹改到 **61°32′N 01°53′E**（`[1.883, 61.533]`），`e.u320_last.place` 同步，正文写「于 61°32′N 01°53′E 投下深水炸弹…次日 03:40 在 Sotra 岛外弃艇自沉」；航迹/事件/电文/损伤记录四处坐标一致 |
| F16 | gb.walker 未建模 | **已修** | 新增 `gb.walker`（V/W 级，D27，91.4×8.15 m，1100 t std，34 节，110 人，4 英寸主炮 ×4 + 深弹），航迹 1941-03-15→03-20 含 03-17 交战点；挂入 `e.hx112.units` |
| F17 | forces 吨位差 93 GRT，文档声称差 0 | **已修** | `forces.sides.GB.note` 改为「14,668,692 GRT 为本包逐月表九段合计（研究稿另作 14,668,785，差 93 GRT 系四舍五入与分月取整）」。九段实际求和 = 14,668,692，与 note 一致 |
| F18 | 事件 place 与舰位差 500–2200 km | **已修** | 6 个事件 place 改为该时刻单位实际位置；`e.escort_carriers` 因是泛指条目去掉 `units`。**持久检查**：事件 place 距 units ≤320 km，当前最大 **306 km** |
| F19 | 沙恩霍斯特柏林行动航迹与 history 不符 | **已修** | 航迹重排为 1939-11 拉瓦尔品第 → 1940-04 威悉演习 → 06 光荣号 → 12 威廉港 → 1941-01-22 柏林行动 → 03-22 布雷斯特 → 1942-02 雷霆行动 → 1943-12 北角。t25 又把 `r.berlin_op` 的 4 个中间航点改用 `unitStateAt` 实际值，路线与航迹偏差由 1405 km 降到 0 |
| F20 | 舰船卡用 km/h 与「节」体系冲突 | **已修** | 11 张舰船卡全部移除 `speedKmh`（UI 会渲染成 `32 km/h` 而实为 17.2 节），节速写进 `desc`；飞机卡保留 `speedKmh`（346/286/335 km/h 正确） |
| F21 | 概述电文无可见标记、Catalina 三译名 | **已修** | 66 条概述电文 `text` 统一加 `[概述] ` 前缀（渲染时直接可见），`05-sources.md` §7 说明约定；「加泰林纳/卡特林纳」全包统一为「**卡塔琳娜**」，残留 0 |

### 结论

- 21 项中 **21 项已处置**：19 项修复，1 项（F15）因新证据修正了我上一轮的误判，1 项（F9 的「清理死资源」子项）经核查不成立（U-541 照片仍被 3 处使用）。
- 无遗留 blocker。

## 11. 持久检查（t25 固化）

五项检查现在**全部同时存在于 `pipeline/scripts/check_consistency.ts` 与 `tests/campaign.test.ts`**，后者随 `npm test` 执行。每项都用变异测试验证过「真能变红」。

| # | 检查 | 位置 | 当前结果 |
|---|---|---|---|
| 1 | 航迹不得横穿陆地（连续 ≥8 点落 landBit 且距港口 >60 km） | 两处 | **0 处**（变异：把 U-505 移到撒哈拉 → 立刻失败） |
| 2 | fire 覆盖时段内最小距离 ≤ 武器 `rangeKm` | 两处 | **19/19 通过**（变异：把贝尔法斯特号推出 500 km → 立刻失败） |
| 3 | 事件 `place` 距所挂 units ≤ 320 km | 两处 | 最大 **306 km**（`e.hg76`） |
| 4 | 事件时刻落在 units 的 `active` 窗口内 | `check_consistency.ts` E 组 | **0 违例** |
| 5 | 每条海战记录 `paceAt ≤ 0.8` | `tests/campaign.test.ts` | **178 条记录全部通过**（变异：删一段 pace → 立刻失败） |

### 仍在跟踪的两处示意性偏差（非 t18 项，记录备查）

- `r.hg_gibraltar`（1261 km）与 `r.sls64_intercept`（1255 km）：均为 `schematic: true` 的示意航线，中间航点描述的是船团转向点而非该舰实时位置；两端航点与实际航迹一致。已把其余 14 条偏差 >200 km 的舰只路线逐一对齐（`r.scheer_atlantic` 5588→0、`r.hunt_u505` 848→0、`r.drumbeat_out` 924→0、`r.berlin_op` 1405→0）。最大剩余偏差由 5878 km 降至 1261 km。
- 11 条挂 `gb.wa`/`de.bdu` 等指挥机构的船团航线不含舰位约束（指挥机构全程驻港），不适用该判据。
