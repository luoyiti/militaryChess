# 大西洋海战 · 数据表说明（R3 / t3）

> 机器可读：[`03-data.json`](03-data.json)（约 200 KB，含 `forces.monthlySeries` 69 行逐月损失表）
> 上游：[`01-strategy.md`](01-strategy.md)、[`01-timeline.json`](01-timeline.json)、[`05-sources.json`](05-sources.json)、[`06-photos.md`](06-photos.md)
> 下游：`campaigns/battle-atlantic-1945/data/`（由工程-数据 负责）
> 本文件**不写** `data/` 下任何 JSON；只说明数据表的构成、口径与转换要点。

---

## 0. 一句话

`03-data.json` 给出**可直接转成 `data/` 五个目录的四类数据**：106 条战役窗口内事件（含 106 条 80–140 字正文）、84 个地名、18 帧控制区关键帧（`raider` / `convoy` 两槽位）、24 艘代表舰艇的示意航迹；外加 `forces.byPhase` 的分阶段吨位与损失素材。另有 1 条 epilogue（死光行动）与 1 条 backgroundEvent（拉普拉塔河口，图幅外）。

| 段 | 条数 | 目标位置 |
|---|---|---|
| `events` | 106 | `data/events.json` |
| `epilogue` | 1 | 不进 `data/events.json`（时间窗外） |
| `backgroundEvents` | 1 | 不进 `data/events.json`（图幅外） |
| `places` | 84 | `data/gazetteer/*.json` |
| `fronts` | 18 帧 | `data/fronts/<时刻>.json` |
| `units` | 24 | `data/oob/*.json` |
| `forces` | 1 结构 | `data/forces.json` |

---

## 1. 事件（`events`）

### 1.1 分布

| 维度 | 分布 |
|---|---|
| 时间跨度 | 1939-09-03T10:00 → 1945-05-07T20:45（UTC） |
| 多日事件 | 21 条带 `endAt`（船团战、北极航线、登陆等），`endAt` 均晚于 `at` |
| category | naval 44、political 34、movement 12、air 10、surrender 4、atrocity 2（窗口内 106 条） |
| importance | 1 级 11 条、2 级 62 条、3 级 33 条（窗口内） |
| side | DE 49、GB 43、US 12、CA 2 |
| precision | day 73、minute 21、hour 14 |
| confidence | high 90、medium 18 |
| 正文 | **106 条全部 80–140 字**（脚本逐条断言，无例外） |
| `endAt` | 21 条（均为跨日事件），全部 `endAt > at` |
| 配图 | 21 条带 `photoSuggestion`，全部命中 `photos/index.json` 的 20 张已核实照片 |

**importance 1 的 11 条**（导演模式全程驻留，建议总数不超过 12 条）：法国停战与比斯开湾基地、SC 7、鼓点行动、火炬行动、华盛顿大西洋护航会议、HX 229/SC 122、罗斯福抽调 B-24、ONS 5、黑色五月、诺曼底、德国投降。

### 1.2 字段约定

```jsonc
{
  "id": "e.sc7",
  "at": "1940-10-18T20:00",          // UTC；day 精度的时分是编排值
  "precision": "hour",                // day | hour | minute
  "category": "naval",                // battle|air|naval|political|atrocity|movement|surrender|siege
  "importance": 1,                    // 1 战役级 / 2 重要 / 3 一般
  "side": "DE",
  "title": { "zh": "…", "orig": "…" },
  "body": "…",                        // 严格 80–140 汉字
  "place": [-13.000, 57.000],         // 事件点，不是舰队位置
  "unitsSuggestion": ["de.u46"],      // 只含 03-data.units 中存在的 id
  "unitsMentioned": ["gb.rodney"],    // 文字提及但未建档案的舰艇（可选）
  "photoSuggestion": "…",             // Commons 文件名（不含 File:），或 null
  "sfx": ["explosion", "radio"],      // 引擎音效 id（已校验）
  "zoomRel": 8,                       // 1 = 全图
  "sources": ["roskill_1954", "…"],   // 05-sources.json 的 id
  "confidence": "high"
}
```

- **`unitsSuggestion` 只含 `03-data.units` 里存在的 24 个 id**；凡指向未建档案的舰艇（`de.gneisenau`、`gb.rodney`、`de.u100` 等）已移入同一事件的 `unitsMentioned`，共 23 条事件带此字段。工程-数据 可以二选一：扩 OOB，或只当文字提及。
- **`place` 全部是图幅内坐标**（−85…45 E，−12…78 N），且已按 10% 余量检查。唯一的例外（拉普拉塔河口）已移入 `backgroundEvents`。
- **`sfx` 只用引擎已注册的 id**：`explosion / ship_gun / radio / morse / typewriter / bomber / fighter / engine / siren / bell / fanfare / march / artillery / stamp / paper / ui_click / stuka / tank / cavalry / rifle / mg / air_siren`（`shared/audio/sfx-sprite.json` + `engine/audio/synth.ts`）。**没有 `torpedo`**——鱼雷命中统一用 `explosion + ship_gun` 近似。
- **`photoSuggestion` 为 null 的事件不配图**，不要为了「都有图」而重复使用同一张。

### 1.3 与 `01-timeline.json` 的关系

`01-timeline.json` 是**战略叙事**的 70 条主干；`03-data.json` 的 106 条是在其基础上：
- 保留全部主干（id 略有重命名，见下）；
- 增补 36 条**地方性/技术性**事件（护航会议细节、单个船团战、装备与战术、基地后勤等）；
- 全部补齐 80–140 字正文（timeline 只有 35 条带正文）。

**重命名对照**（若下游已按 timeline 的 id 建过档，按右列替换）：

| timeline | 03-data |
|---|---|
| `e.uk_declares_war` | `e.war_declared` |
| `e.u39_ark_royal` + `e.courageous` | 合并为 `e.hunter_groups` + 保留 `e.courageous` |
| `e.raiding_authorized` | `e.raiding_rules` |
| `e.graf_spee_scuttle` | 并入 `e.graf_spee`（背景事件） |
| `e.weseruebung` / `e.iceland_landing` | 同名保留 |
| `e.hg76` / `e.nef` / `e.moef`（新） | 同名 / 新增 |
| `e.atlantic_convoy_conference` | `e.atlantic_conference` |
| `e.hx229_sc122` | 同名保留 |
| `e.black_may` | 同名保留 |
| `e.deadlight` | 移入 `epilogue` |

其余 id 逐条保留，可直接对照。

---

## 2. 地名（`places`）

### 2.1 概况

84 条，`kind` 分布：port 43、sea 19、region 11、city 5、capital 4、airfield 1、fort 1；`rank`：1 级 26、2 级 37、3 级 17、4 级 4。

```jsonc
{
  "id": "liverpool",
  "zh": "利物浦",
  "orig": "Liverpool",
  "pos": [-2.992, 53.408],
  "dms": ["2°59′31.2″W", "53°24′28.8″N"],   // 反算值，仅作文档
  "dmsNote": "由十进制坐标反算（WGS84），来源表述见 note",
  "note": "53°24′N 2°59′W；西部海口司令部（德比大厦）驻地",
  "kind": "city",
  "rank": 1,
  "country": "GB",
  "confidence": "high",
  "sources": ["roskill_1954"]
}
```

- **`orig` 用 1939–45 年当时的写法**：`Hvalfjörður`、`Færøerne`、`Мурманск`、`Câmara de Lobos` 式的本地名，不用现代英文名。
- **`dms` 是反算的**，`note` 里才是来源的原始表述（如「53°24′N 2°59′W」）。若两者冲突，以 `note` 为准，并把 `confidence` 降到 medium。
- **`country` 用 1938 年政治实体**：`NF`（纽芬兰自治领）、`IS`（冰岛）、`GL`（格陵兰）、`—`（公海/无归属海域）。
- 地名 id 与 `01-timeline.json` 的 `placeNote` 不重复：timeline 用文字标注，本表才是可引用的 `@id`。

### 2.2 转换到 `data/gazetteer/`

建议按地理分两个文件，避免单文件过大：

| 文件 | 内容 | 条数 |
|---|---|---|
| `data/gazetteer/atlantic.json` | 英国、爱尔兰、法国、比斯开湾、冰岛、法罗、格陵兰、北美东岸 | 约 45 |
| `data/gazetteer/wide.json` | 加勒比、南大西洋、挪威与北极、德国、海域 | 约 39 |

`dms` / `dmsNote` / `note` 三个字段**不进入** `Place` schema（多余字段会被 validator 当作 WARN 的「未知字段」），转换时删掉，把关键信息并进 `alt` 或另存 `docs/research/03-geo.md` 的附录。

---

## 3. 控制区关键帧（`fronts`）

### 3.1 设计

两槽位：**`raider`**（袭击舰/狼群活动海域）与 **`convoy`**（护航与空中掩护海域）。因为本战役是跨洋的空海对抗，`campaign.json` 的 `control.mode` 应为 **`air`**，多边形跨海、可重叠、粗粒度。

18 帧，覆盖：

| 帧 | 时间 | 叙事节点 | raider 多边形 | convoy 多边形 |
|---|---|---|---|---|
| 1 | 1939-09-03 | 开战 | 2 | 2 |
| 2 | 1939-11-15 | 施佩伯爵号在南大西洋 | 2 | 3 |
| 3 | 1940-06-25 | 法国停战 | 2 | 3 |
| 4 | 1940-10-19 | SC 7 / HX 79 | 1 | 3 |
| 5 | 1941-01-01 | 快乐时光 + 舍尔号 | 2 | 3 |
| 6 | 1941-03-20 | HX 112 之后 | 1 | 2 |
| 7 | 1941-07-01 | NEF 全程护航 | 1 | 2 |
| 8 | 1942-01-20 | Drumbeat | 2 | 2 |
| 9 | 1942-05-20 | 加勒比与墨西哥湾 | 1 | 2 |
| 10 | 1942-07-10 | PQ-17 与北极 | 3 | 2 |
| 11 | 1942-11-05 | 火炬前夜 | 2 | 2 |
| 12 | 1943-03-16 | HX 229 / SC 122 | 1 | 1 |
| 13 | 1943-05-24 | Black May | 2 | 2 |
| 14 | 1943-09-20 | Leuthen | 1 | 2 |
| 15 | 1944-03-01 | 比斯开湾封锁 | 2 | 2 |
| 16 | 1944-06-06 | 诺曼底 | 2 | 2 |
| 17 | 1944-09-01 | 基地失守 | 1 | 2 |
| 18 | 1945-05-08 | 终局 | 1 | 1 |

### 3.2 几何口径

- 每帧 = `{ at, control: { raider: [[多边形]], convoy: [[多边形]] }, note, sources, confidence }`，多边形 = `[环]`，环 = `[[lon,lat]…]`。
- **全部为矩形或简单四边形**，**0 处自相交**（已用 `engine/model/core.ts` 的 `ringSelfIntersects` 同算法逐环校验）。
- 粗粒度：一个多边形动辄跨 20–30 个经度，**不是战线**。`note` 里写明该帧的叙事含义。
- 转换要点：
  - 文件名 = `at` 把冒号换成连字符（`1943-03-16T00-00.json`），validator 会强制。
  - `control` 的键必须与 `campaign.json` 的 `control.slots[].key` 一致（应为 `raider` / `convoy`）。
  - 槽位 `label` 建议：「袭击舰与狼群活动海域」「护航与空中掩护海域」。
  - 帧之间用 `transition: "smooth"`；1942-11-05 → 1943-03-16 的空白区收缩可以给 `"step"` 以强调突变。

---

## 4. 舰艇与航迹（`units`）

### 4.1 24 个代表单位

| id | 舰名 | 类型 | maxKn | 航迹点 | 用途 |
|---|---|---|---|---|---|
| `de.bismarck` | 俾斯麦号 | battleship | 30.1 | 10 | 莱茵演习 → 丹麦海峡 → 沉没 |
| `de.scharnhorst` | 沙恩霍斯特号 | battlecruiser | 31.5 | 8 | 拉瓦尔品第 → 北角 |
| `de.admiral_scheer` | 舍尔号 | pocket_battleship | 28.3 | 6 | HX 84 → 印度洋 → 返德 |
| `de.admiral_hipper` | 希佩尔号 | heavy_cruiser | 32.5 | 5 | WS 5A → SLS 64 |
| `de.graf_spee` | 施佩伯爵号 | pocket_battleship | 28.5 | 4 | 背景（图幅外作战） |
| `de.u30` | U-30 | submarine | 17.2 | 5 | 雅典娜号 → 洛里昂 |
| `de.u47` | U-47 | submarine | 17.9 | 7 | 斯卡帕湾 → 失踪 |
| `de.u99` | U-99 | submarine | 17.7 | 4 | 王牌 → HX 112 自沉 |
| `de.u123` | U-123 | submarine | 18.2 | 4 | 鼓点行动第一艇 |
| `de.u552` | U-552 | submarine | 17.7 | 3 | 鲁本·詹姆斯号 |
| `de.u156` | U-156 | submarine | 18.2 | 3 | 拉科尼亚号 |
| `de.u505` | U-505 | submarine | 18.2 | 3 | 1944 被俘 |
| `de.u2336` | U-2336 | submarine | 12.5 | 3 | 最后两艘商船 |
| `gb.hood` | 胡德号 | battlecruiser | 31.0 | 3 | 丹麦海峡 |
| `gb.courageous` | 勇敢号 | carrier | 30.0 | 3 | 1939-09-17 |
| `gb.rawalpindi` | 拉瓦尔品第号 | auxiliary | 17.0 | 3 | 1939-11-23 |
| `gb.jervis_bay` | 杰维斯湾号 | auxiliary | 15.0 | 3 | HX 84 |
| `gb.audacity` | 大胆号 | carrier | 15.0 | 3 | HG 76 |
| `gb.starling` | 斯塔林号 | destroyer(sloop) | 19.4 | 4 | 沃克第 2 护航群 |
| `gb.duke_of_york` | 约克公爵号 | battleship | 28.3 | 3 | 北角 |
| `gb.petard` | 佩塔德号 | destroyer | 36.8 | 3 | U-559 缴获 |
| `us.reuben_james` | 鲁本·詹姆斯号 | destroyer | 35.0 | 3 | 1941-10-31 |
| `us.guadalcanal` | 瓜达尔卡纳尔号 | carrier | 19.0 | 3 | 俘获 U-505 |
| `ca.escort` | 加拿大护航群（示意） | destroyer | 16.0 | 5 | 西段护航示意 |

### 4.2 航迹口径

- **逐周/逐月示意**，不是日志级复原；`course` / `speedKn` 由相邻两点的方位角与距离反算，已四舍五入。
- **所有航段速度 ≤ maxKn**（脚本对 24 个单位逐点断言；德国 U 艇 maxKn 取水面航速，实际巡航 10–12 节）。
- 所有航迹点都在图幅内、都在战役时间窗内、时间严格递增。
- `status` 只用 `active / engaged / destroyed / interned`；`destroyed` 后引擎按终止状态淡出。
- **`ship` 档案的必要字段**（供给 `data/oob` 时照抄，缺一项 validator 就 WARN）：
  `kind`（`SHIP_KINDS` 枚举）、`class.zh/orig`、`lengthM`、`beamM`、`tonnage` + `tonnageKind`（`std`/`full`/`grt`）、`maxKn`、`crew`、`silhouette`。
- **`model` 一律用 `navy_token`**：本战役没有为这些舰艇注册 3D 模型，`navy_token` 是引擎自带的符号化舰船标记。**不要**写 `bismarck`、`type_vii` 这类不存在的模型 id——validator 会报 ERROR。
- **`silhouette` 只能用已有键**：`battleship`、`battlecruiser`、`carrier`、`county`、`destroyer`、`graf_spee`、`leander`、`liner`、`merchant`、`submarine`、`tanker`、`tug`、`boat`、`dunkerque`、`york`。U 艇一律 `submarine`，AMC 用 `merchant`（视觉上接近），花级/单桅帆船用 `destroyer`（引擎没有轻护剪影）。
- **`type` 用 `naval`**（`UNIT_TYPES` 里有 `naval`），`echelon` 用 `ship`，`parent: null`。

### 4.3 上架到 `data/naval/` 的四个片段（建议）

| 片段 | 单位 | 可写的海战类型 |
|---|---|---|
| 丹麦海峡 + 俾斯麦最后一战 | `de.bismarck`, `gb.hood`, `gb.duke_of_york`（示意） | `fire`/`hits`/`damage`/`signals` |
| HX 229 / SC 122 | 无单舰档案，用 `signals` + `hits` 泛指 | `signals`/`hits` |
| ONS 5 | `gb.starling`（示意） | `signals`/`hits`/`sources` |
| 北角 | `de.scharnhorst`, `gb.duke_of_york` | `fire`/`hits`/`torpedoes` |

> `data/naval/` 的 `fire.shooter/target` 必须是 `data/oob` 里存在的 id。上面四个片段里只有丹麦海峡与北角能落到具体舰艇；HX 229 与 ONS 5 建议只写 `signals`（德方接触报告、英方支援群电报）与少量 `hits`，不要编造舰对舰射击。

---

## 5. 分阶段兵力与损失（`forces.byPhase`）

吨位来自逐月损失表（`monthlySeries`，`wiki_en_atlantic` / `Losses during the Battle of the Atlantic` 口径，全部为 GRT）；**只采用 U 艇分项**，因为 1940 年 6 月后的 `total` 列在该表里缺项，不能直接相加。

| 阶段 | 月份 | U 艇击沉（GRT） | 月均 | U 艇损失 |
|---|---|---|---|---|
| ph1 袭击舰与猎杀群 | 1939-09 → 1940-06 | 1,136,926 | 113,693 | 23 |
| ph2 法国基地与快乐时光 | 1940-07 → 1941-03 | 2,036,973 | 226,330 | 14 |
| ph3 美国入场与全域扩张 | 1941-04 → 1942-06 | 4,686,103 | 312,407 | 51 |
| ph4 转折 | 1942-07 → 1943-05 | 4,967,910 | 451,628 | 159 |
| ph5 反攻 | 1943-06 → 1944-06 | 1,268,870 | 97,605 | 273 |
| ph6 终局 | 1944-07 → 1945-05 | 571,910 | 51,992 | 273 |

**注意**：ph5 与 ph6 的 U 艇损失数相同（273），是逐月表在后段缺项造成的（该表的「German submarines lost」列在 1944 年 7 月后与全战区口径混用）。**不要**用它作为分阶段 U 艇损失；改用 `01-strategy.md` §7 的全期总数（783 艘）或 `uboat.net/fates` 的年度清单。

`forces.sides` 给的是全期口径（商船约 3,500 艘、军舰 175 艘、U 艇 783 艘、德国 U 艇人员约 30,000 死亡），**不能与 byPhase 相加**；`byPhase` 只用于导演模式的阶段对比条。

---

## 6. 转换到 `data/` 的检查清单

1. **`events.json`**：从 `events` 直接映射；`place` 若是地名 id 需改成 `"@id"`，否则保留坐标；`photoSuggestion` → `photo.commons` 并补 `caption`；`title` 补 `short`（≤8 字）。
2. **`gazetteer/*.json`**：删 `dms`/`dmsNote`/`note`；`orig` 必填；`kind` 必须在 `Place` 枚举内（本表用的 `sea`/`port`/`city`/`capital`/`region`/`airfield`/`fort` 全部合法）。
3. **`fronts/*.json`**：文件名、槽位键、`sources` 三项最容易出错；多边形已校验不自相交，但**不要**再做旋转或镜像。
4. **`oob/*.json`**：`model: "navy_token"`；`ship.silhouette` 只用上列 15 个键；`parent: null`；`track` 已按 `course`/`speedKn` 写好，直接可用。
5. **`forces.json`**：`byPhase` 的键要与 `campaign.json` 的 `phases[].id` 一致（ph1…ph6）。
6. 跑 `npm run validate -- --campaign battle-atlantic-1945`；事件正文长度、来源解析、舰速、多边形自相交这四项本表已自检，剩下来自 `campaign.json` 的交叉检查。

---

## 7. 已知简化与风险

1. **航迹是示意，不是日志**：代表舰艇每个航段只有 2–5 个点，`course`/`speedKn` 是反算值。若审查要求「逐日复原」，需另做（每条艇的 KTB 都在 `uboatarchive_ktb`，但工作量大一个数量级）。
2. **`ca.escort` 是合成单位**：加拿大护航群没有单一舰名，用一艘花级轻护代表。数据层若要严格，可改成 `display: "container"` 的群。
3. **控制区多边形是矩形**：视觉上是「海域块」，不是等时线。1943-03-16 与 1943-05-24 两帧的对比是本战役的叙事高点，转换时不要为了好看把矩形改成复杂多边形——引擎的 `air` 模式对粗粒度多边形渲染更快。
4. **`photoSuggestion` 只覆盖 21 条**：20 张照片要覆盖 106 条事件不可能也不必要；导演模式只在 importance 1/2 的事件驻留，重点事件有图即可。
5. **`e.graf_spee`（拉普拉塔河口）在 `backgroundEvents`**：它的纬度 −34.4° 在图幅南界之外。如果总台卷宗需要这条，作为 `hub` 的文字注记，不要塞进 `events`。
6. **1944 年后的 U 艇损失数口径混乱**：见 §5 的说明。

---

## 8. 自检记录

| 检查 | 结果 |
|---|---|
| events ≥ 90 | 106（窗口内）+ 1 epilogue + 1 background |
| 正文 80–140 字 | 106/106 通过（逐条 `len()` 断言） |
| 事件 id 唯一、时间递增 | 通过（脚本排序 + 断言） |
| `unitsSuggestion` 全部可解析 | 通过（不存在的 id 已移入 `unitsMentioned`） |
| `endAt` 合法性 | 21/21 通过 |
| `sources` 全部可解析 | 44 个不同来源 id，全部在 `05-sources.json` 的 98 条内 |
| `sfx` 全部是引擎 id | 通过（对照 sprite + synth 两张表） |
| `photoSuggestion` 全部命中索引 | 通过（对照 `photos/index.json` 的 20 个键） |
| 地名 60–100 | 84 |
| 地名坐标在图幅内 | 84/84（10% 余量检查） |
| 控制区帧 12–20 | 18 |
| 多边形自相交 | 0（同 `ringSelfIntersects` 算法） |
| 舰艇 maxKn | 24/24 单位的所有航段均 ≤ maxKn |
| 航迹时间窗与顺序 | 24/24 通过 |
| `silhouette` / `model` 合法 | 通过（15 个剪影键 + `navy_token`） |
