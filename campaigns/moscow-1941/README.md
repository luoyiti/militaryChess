# 莫斯科保卫战（moscow-1941）

中文战役包 `moscow-1941`，状态 `published`。回放覆盖 1941 年 9 月 30 日至 1942 年 1 月 31 日：台风行动、维亚济马与布良斯克两大合围、泥泞与莫扎伊斯克防线、十一月攻势、十二月反攻与一月总攻。

## 进入战役

```sh
npm run dev
```

打开 <http://127.0.0.1:5180/campaigns/moscow-1941/>，也可从作战总台（<http://127.0.0.1:5180/>）的欧洲战区卷宗进入。生产构建后 `npm run preview`，地址为 <http://127.0.0.1:4180/campaigns/moscow-1941/>。

## 时空范围

| 项 | 取值 |
|---|---|
| 时间窗 | `1941-09-30T00:00` — `1942-01-31T23:59`（莫斯科时间 UTC+3） |
| 空间 | bbox `30.6—40.4°E / 51.6—58.0°N`；画布 8192×8734（`kmPerUnit` 0.082674） |
| 控制场 | 683×728 格，格距 **0.99 km**（`fieldCell 12`，`clampKm 60`） |
| 阵营 | DE（德国，axis）/ SU（苏联，comintern）；`sideOrder ["SU","DE"]`，DE 占控制区 A 槽 |
| 阶段 | `typhoon` / `mozhaisk` / `november` / `counter` / `january` |
| 总台卷宗 | `hub.order` **13**（全仓唯一）、`region europe`、`stencil MOSCOW 1941` |

画布四边反算约 29.8—41.2°E / 51.5—58.1°N，比名义 bbox 更宽：战线因此**闭到画布之外**（西 27°E、南 50°N、北 59°N），否则上缘会露出一条斜边。细节见 [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md) §2.1。

## 数据规模

| 资产 | 数量 |
|---|---|
| 地名 | 122（`data/gazetteer/{core,north,south}.json`） |
| 部队 | 255（德军 108 / 苏军 147，含军团、师、旅、空降军、民兵师群、防空区） |
| 路线 | 56（26 条德方推进 / 30 条苏方调动） |
| 控制区关键帧 | 38（1941-09-30 — 1942-01-31） |
| 事件 | 115（五阶段各 ≥19 条，importance=1 共 41 条） |
| 装备 | 19 |
| 来源 | 46（战略 9 / 德方 12 / 苏方 15 / 地理与统计 7 / 照片 3） |
| 照片 | 20（Commons，仅 PD / CC BY 4.0 / CC BY-SA 3.0·3.0 de·4.0） |
| 包围圈 | 6（维亚济马、布良斯克、图拉、维亚济马空降、苏希尼奇、姆岑斯克突击） |
| 叠加层 | 17（莫扎伊斯克防线、城防环线、莫斯科运河、防空区、泥泞期） |

## 阅读与操作

- **五章**按 `CONVENTIONS.md` 第 2 节划分：台风行动与两大合围 → 泥泞与莫扎伊斯克防线 → 十一月攻势（克林、图拉、运河）→ 十二月反攻 → 一月总攻。每章有独立镜头中心与缩放。
- **事件卡**正文 80—140 字，可展开「史料依据」与地点；带图的 18 条在卡片内标出拍摄日期与不能证明的内容。日期有异说时在正文或图注里并列，不取单一值。
- **城门态势**插件（侧栏）：上半是「德军前锋距克里姆林宫」——**两套口径并排**：一条按本图关键帧重建的控制区边界量测，一条是文献里某地推进距离的说法表（`data/ext/moscow/front-watch.json`，含 27 / 20 / 55 / 105 km 四说及出处）。两者不合并、不相减。
- **莫斯科每日气温**（同一插件）：WMO 27612（全俄展览中心站）1941-09-30—1942-01-31 共 124 天逐日实测 `tMin/tAvg/tMax/precipMm`，缺测留空不插值；事件卡会带当日气温行。
- **叠加层**都是跨时期参考线（防线、环线、运河、防空区、泥泞期），开关后可与当前日期对照，不代表逐日实际状态。
- **时间轴标记** 11 条，`pace` 五段变速（10-13 起 5×、11-15 起 3×、12-05 起 3.5×、01-07 起 6×/秒·小时）。

## 史实口径要点

本包的原则是：**数字并列各说，失败写成多因，传闻标明是传闻。**

- **伤亡多口径不合并**。苏方防御阶段（1941-09-30—12-05）不可恢复 514,338、卫生减员 143,941（克里沃舍耶夫口径，三阶段合并统计，阶段内未分列）；反攻阶段（至 1942-01-07）139,586 / 231,369。德方按陆军十日报告分月：10 月至 12 月初约 145,000、12 月 103,600、1 月 144,900；另有西方研究按月口径（10-01—01-10 合计 174,194）。常被引用的「四个月合计 436,900」对应 1941-12—1942-03 的冬季战局延伸，**不是本战役区间的数字**。1942 年 1 月苏军伤亡未核定，`byPhase.january` 留空不插值。两方统计对象不同，**不可相加、不可相减**。
- **「28 名潘菲洛夫战士」**。1941-11-16 第 316 步兵师（11-18 起第 8 近卫步兵师）在杜博谢科沃的真实战斗成立，但「全部 28 人」的报道经 1980—2000 年代档案核实后被推翻，2016 年俄罗斯总检察院认定系虚构。事件卡写明争议，不采用「28 人全部牺牲」叙事。
- **「冬将军」不是唯一解释**。10 月泥泞、11 月道路冻结、12 月 −20℃ 以下低温、德军冬装与防冻准备不足、铁路换轨与补给瓶颈、苏军预备队与远东师团投入共同决定战局；苏军同样受冻。把失败归为严寒会掩盖后勤、兵力与指挥因素。
- **博克的俘获数是德方战时宣称口径**。1941-10-19 命令宣称俘 673,098 人、坦克 1,277 辆、火炮 4,378 门，与当代研究并列，不作为确证数字。
- **波多利斯克军校生**按研究口径写「约 3,500 名学员与教员」，不写「两千五百人挡住德军两周」这类夸大，也不把他们说成阻止德军的唯一原因。
- **佐尔格情报的影响存在争议**。远东师团西调有档案依据，但把调动完全归因于一份情报，会把总参谋部的多源判断与既有动员计划简化成单一原因。
- **十月十六日恐慌**要区分事实与传说：政府机构与外交团 10-15—16 东迁古比雪夫、部分居民外逃、10-19 戒严是事实；「斯大林留下」的细节、内务部队「枪决逃兵」的具体数字多来自事后回忆，涉及处写「常见说法」。
- **霍尔姆（1942-01）不是苏军被围**：那是德军守备队被围至 5 月 5 日，`pockets.json` 不收录，只作事件节点，避免与维亚济马式合围混淆。
- **装备 `count` 一律为空**：来源能给出的都是类别合计（158 架中型与俯冲轰炸机、172 架战斗机、7,600 门火炮与迫击炮），把它们填到单型号上会造成误读，故留空并把类别语境写进 `desc`。

## 研究文档索引

| 文档 | 内容 |
|---|---|
| [docs/research/moscow-1941-part1-strategy-oob.md](../../docs/research/moscow-1941-part1-strategy-oob.md) | 战略决策链、第 35 号指令、台风目标与兵力时间表、10-12 预期与落空、10-07 受降令 |
| [docs/research/moscow-1941-part2-battle-course.md](../../docs/research/moscow-1941-part2-battle-course.md) | 逐阶段战役进程、71 行节点表、65 个强制节点全覆盖 |
| [docs/MILITARY-RESEARCH.md](docs/MILITARY-RESEARCH.md) | 编制与装备事实表：145 条部队、18 件装备卡、类别口径与来源背书说明 |
| [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md) | 投影与画布、格距 0.99 km 的精度含义、战线构造（净空量、凹口、长边细分、洞）、38 帧一览、3 处洞自检、69 条城市断言全表、已知偏差 |
| [docs/QA.md](docs/QA.md) | 已知问题（K1 配乐 404、K2 顶点交错、K3 城郊净空）、已验证项、气温口径 |
| [pipeline/CONVENTIONS.md](pipeline/CONVENTIONS.md) | 全队共享约定：参数、阶段、地名与来源命名空间、部队 id、数据格式、校验红线 |
| [pipeline/research.json](pipeline/research.json) | 13 条来源读取记录 + 对任务的订正（含 436,900 的月份归属、台风发起日三说） |
| [pipeline/orbat.json](pipeline/orbat.json) | 编制与装备事实表（92.7 KB） |
| [pipeline/front-lines.json](pipeline/front-lines.json) | 38 帧 × 25 点接触线（战线的**唯一真源**，生成器只读不改） |
| [pipeline/city-ledger.json](pipeline/city-ledger.json) | 56 城 / 177 个状态点 / 31 条异说 + 5 条结构性豁免（`knownLineMismatches`） |
| [pipeline/event-ledger.csv](pipeline/event-ledger.csv) | 115 行 × 15 列逐事件证据台账 |
| [pipeline/photo-evidence.json](pipeline/photo-evidence.json) | 照片逐张核验与拒绝清单（`excluded`） |
| [pipeline/source-registry.json](pipeline/source-registry.json) | 46 条来源登记表 |
| [pipeline/audit-control.ts](pipeline/audit-control.ts) | **69 条控制区断言**：与本图同一 SDF 场判定「某时刻某城归谁」，全绿 = 控制区可发布 |

## 资产复现

```bash
cd /Users/yiti/Project/militaryChess

sh tools/geo/run.sh moscow-1941                     # 地图资产：投影 → DEM → 国界 → 矢量 → 瓦片 → 掩膜
python3 campaigns/moscow-1941/pipeline/make_fronts.py          # 重建 38 帧战线 + 自检 + 刷新 docs/GEOGRAPHY.md
python3 campaigns/moscow-1941/pipeline/make_fronts.py --check  # 只自检，不写盘
npx tsx campaigns/moscow-1941/pipeline/audit-control.ts        # 69 条控制区断言（退出码 0 = 全绿）
python3 campaigns/moscow-1941/pipeline/fetch_photos.py         # 重抓照片与索引（需网络，幂等）
node tools/geo/emit_frame.mjs moscow-1941 --check              # frame.json 与配置重算一致
npm run fonts                                                  # 重建字体子集（新战役汉字字形）
npx tsx tools/validate/validate.ts --campaign moscow-1941      # 0 错误 0 警告
```

`make_fronts.py` 是幂等的：连跑两次，`data/fronts/*.json` 与 `docs/GEOGRAPHY.md` 逐字节相同。它只读 `pipeline/front-lines.json`，所有史实校正（占领窗口、净空量、凹口、洞、长边细分）都发生在生成器内并记录进 `docs/GEOGRAPHY.md`。

## 验证

```bash
npx vitest run campaigns/moscow-1941/tests    # 72 项：结构 18 / 史实 36 / 地理 18
npm run verify                                # typecheck + 全仓测试 + 全仓校验 + 生产构建
```

测试的三条主线：

- `tests/campaign.test.ts` —— 清单结构与引用完整性：schema、时间窗、五阶段、`eventCount=115`、`bodyLength`、数据规模、地名/部队/路线/包围圈/事件/照片的交叉引用、`extraLayers` 与 `overlays.json` 图层对齐、帧文件名 = `at`、环不自相交、洞在外环内。只断言**性质**（不写死顶点数），以便战线复核期间不误红。
- `tests/history.test.ts` —— 史实与叙事口径：五阶段覆盖（各 ≥12 条、importance=1 各 ≥3）、事件升序与证据台账逐条对齐、关键节点日期（9-30 / 10-2 / 10-7 / 10-13 / 10-14 / 10-18 / 10-19 / 10-27 / 11-7 / 11-15 / 11-23 / 11-28 / 11-30 / 12-5 / 12-6 / 12-15 / 12-16 / 12-30 / 1-8 / 1-18 / 1-21 / 1-29 / 1-31）、争议写法存在性（28 潘菲洛夫 / 冬将军 / 博克宣称数 / 波多利斯克 / 佐尔格 / 十月十六日恐慌）、伤亡多口径未被合并、编制变更不跨阶段；另用**独立射线法**复核 city-ledger 的 172 个非豁免状态点。
- `tests/geography.test.ts` —— 地理与控制区：**直接执行 `audit-control.ts` 的 69 条断言**，并用测试自己的 `createModel` 复算一遍（双保险）；`city-ledger` 172 点与 SDF 场一致；38 帧几何不变量（不自相交、洞在外环内、洞只出现在存续期、面积随战役进程先增后减、首末帧距离、**11-27—12-08 边界距克里姆林宫 ≥12 km**）；投影与画布可被 `emit_frame --check` 复算；掩膜 683×728 = 497224 字节且全画布 `bit0|bit4 = 17`；插件护栏只在真出问题时报警。

## 已知限制

1. **配乐 `elegy` 首次播放 404 —— 引擎既有缺陷，跨 9 个战役，本轮不修**。`engine/audio/audio.ts` 只对 `introMusic` 预载，其余曲目 `preload: false` + `html5: true`；Howler 对未加载过的 html5 Howl 首次 `play()` 会把整个 `src` 数组拼成一个地址请求。表现为 `404 /shared/audio/music/elegy.webm,/shared/audio/music/elegy.m4a`，之后该曲静默。本战役 `operations`（开场与主要战斗阶段）正常，`elegy`（泥泞期与十二月反攻段）首次切换时失效；画面、史料、事件卡、插件全部不受影响。修法见 [docs/QA.md](docs/QA.md) K1。
2. **城郊控制区的精度以 `city-ledger.json` 为准**。`pipeline/city-ledger.json` 记录 5 条 `knownLineMismatches`（维亚济马 10-07 的「合围圈闭合 vs 城区沦陷」取义差异；利夫内、韦尼奥夫、杰米扬斯克的折线剖面覆盖范围限制）。这些是**结构性简化**，不是画错；按城市断言时以 ledger 为准，或按其中的 `lineHolder`。详见 [docs/QA.md](docs/QA.md) A2 与 [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md) §7。
3. **「德军前锋距克里姆林宫」按两套口径并列显示**。侧栏插件给的是「本图 `control.DE` 整条控制区边界到克里姆林宫的**最短边界距离**」（11-29—12-05 恒为约 15 km，由克拉斯纳亚波利亚纳楔形的南缘决定）；史料里的「约 29 km」与 `front-watch.json` 的 27 km 是**前锋楔尖/公路口径**。控制区边界先把城郊圈进去，所以边界距离 ≤ 楔尖距离是正常的，面板里写明「误差在数公里量级，不能当作逐日实测前线」。测试的硬断言取 ≥12 km（实测最小 14.5 km）。详见 [docs/QA.md](docs/QA.md) K3。
4. **战线是南北单值折线**，画不出南北向回折的狭窄走廊；托罗佩茨走廊（1942-01）与两大合围圈用**洞**表达。格距 0.99 km 是硬下限：师级态势可见、营级不可见，图上锯齿是网格不是史实细节。
5. **叠加层是跨时期示意**（莫扎伊斯克防线、城防环线、运河、防空区、泥泞期），不代表逐日实际状态。
6. **3D 沙盘为编制示意**，不是装备与制服的精确复原；`ui.modelLabels` 已逐条说明哪些是通用符号（T-60、Il-2、MiG-3、BM-13 未建模，用 `air_token`/`inf_su`/`art_gun` 表示）。
7. **气温是观测站日值**，与战场体感（风寒、着装、野外露宿）不同，不能单独解释战役进程。
8. **照片全部来自 Wikimedia Commons**，德方照片多出自宣传连，原始说明可能带宣传色彩或地点错误，按档案馆标注引用并注明；现代重演、上色、绘制态势图一律拒绝。

实现遵循仓库 [docs/NEW-CAMPAIGN.md](../../docs/NEW-CAMPAIGN.md)，扩展仅在本战役的插件（`plugins/moscow/`）与 `data/ext/moscow/` 内，共享引擎接口保持一致。音乐使用共享曲库，字体使用共享子集（`npm run fonts` 重建）。
