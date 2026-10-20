# 大西洋海战（1939-09 — 1945-05）战略与战役进程研究笔记

> 任务：R1 / t1。产出研究笔记与机器可读时间线。
> 范围：战略层面与战役进程（护航制度、袭击舰、U 艇基地、狼群、密码战、北极航线、两栖作战的牵动、1943 年转折、1944–45 年收尾）。
> 分工边界：U 艇型号、技术装备参数、逐艇战历属 R2（`02-uboat.*`）；事件、地名、控制区、航迹的数据化属 R3（`03-data.json`）；本笔记只给**候选事件与正文草稿**，不写 `data/` 下的任何 JSON。
> 机器可读数据见同目录 [`01-timeline.json`](01-timeline.json)：**69 个战役窗口内**的事件候选（另 1 条「死光行动」在窗口外，单列 `epilogue`），其中 **35 条**附 80–140 字中文备选正文。

---

## 0. 结论先行

1. **这是一场「运输队 vs 吨位」的消耗战，而不是舰队决战。** 德国从未有能力争夺制海权，只能争夺「航线上的时间与空间」；盟军的胜利标准不是击沉多少 U 艇，而是**让跨大西洋的货物流量始终高于被击沉的速度**。1943 年 5 月之后，U 艇仍然能击沉船只，但已经不能改变流量。
2. **转折不是单点，而是 1943 年 3–5 月四条曲线的交叉**：护航兵力（escort groups / support groups / 护航航母）数量、超远程岸基航空兵覆盖（B-24 关闭中大西洋空白区）、厘米波雷达与 HF/DF 带来的战术优势、以及 1942 年底恢复的 Enigma 破译（1943 年 3 月又有九天盲期）。任何单一因素（尤其「破译决定论」）都无法解释。
3. **德国一方的四次战略误判**：1939 年开战时 U 艇数量不足（57 艘可用，多数是短腿 II 型）；1940 年法国沦陷后把「快乐时光」当成可持续趋势；1942 年把 U 艇撒向美国东岸（战略上正确、战役上被护航制度迅速抵消）；1943 年 3 月后仍以「狼群水面夜袭」对抗已闭合的空中与雷达覆盖。
4. **对战役包的含义**：时间轴应围绕「制度与技术的转折」而不是「单场海战」来分段；1943 年 3–5 月必须放慢播放速度；海战层应优先做**船团 vs 狼群**的多舰对抗，而不是单舰决斗（单舰决斗留给 `data/naval/` 的俾斯麦、沙恩霍斯特、PQ-17 三个片段）。

---

## 1. 时间口径（所有事件已折算为 UTC）

本战役横跨 80 个经度、五个国家的战时时钟，**没有任何一个「叙事当地时间」能覆盖全图**。因此本战役建议：

- `01-timeline.json` 的 `at` 统一用 **UTC**（等价于当时通用的 GMT），`atOriginal` 保存来源写法、`clockBasis` 标原时钟。**唯一例外**是丹麦海峡与俾斯麦最后两战（`e.denmark_strait` / `e.bismarck_sunk`）：来源只给「英舰舰钟」且该条自述「比当地时早四小时」，无法无歧义折成 UTC，故保留原值并标 `clockBasis: "ship"`，另给 `atAlt`（若按 BDST 折算的 UTC 版本）与说明。
- `campaign.json` 的 `time.tzLabel` 建议写「世界时 UTC（GMT）；各来源时钟见事件注记」，`time.utcOffset = 0`，这样 3D 海战沙盘的太阳高度对全图成立。
- 事件标签上同时显示「当地时间」时，用 `mapNote` 或 `narration` 注明（例如「德国时间 01:04」）。

### 1.1 战时时钟速查

| 时钟 | 适用 | 与 UTC 的关系（1939–1945） |
|---|---|---|
| GMT / UTC | 英国海军电文、船团日志、U 艇 KTB 常混用 | 基准 |
| BST / BDST | 1940-02-25 起英国全年拨快一小时（BST）；1941–45 年每年春季再拨快一小时为 BDST，秋季拨回 BST；1945-07-15 退回 BST，1945-10-07 退回 GMT | BST = UTC+1；BDST = UTC+2（夏季） |
| MEZ / MESZ | 德国本土、U 艇 KTB、国防军 | 冬季 MEZ=UTC+1；夏季 MESZ=UTC+2 |
| 舰钟 Zone 时间 | 英舰在大西洋常用 Zone −1/−2（即 UTC−1/−2） | 需逐舰换算，不能默认 GMT |
| 美国东部 EWT/EST | 美国东岸反潜司令部、Drumbeat 事件 | 1942 年全年 EWT=UTC−4 |
| 莫斯科时间 | 北极航线终点、苏方记录 | 战时为 UTC+3（本笔记未直接使用苏方时刻） |

### 1.2 必须注意的三处「日期陷阱」

1. **皇家橡树号**：德方 KTB 记 10 月 14 日 00:58（MEZ），若按 MEZ 折算 UTC 为 **10 月 13 日 23:58**；若来源实为 GMT，则 UTC 仍是 14 日 00:58。本笔记保留来源原值并标 `clockBasis: "unstated"`，在 `notes` 写明两种读法；事件本身的史实（835 人死亡、三雷命中、13 分钟沉没）置信度 high，**时刻折算**置信度 medium。
2. **PQ-17 解散令**：Admiralty 电文时刻（21:11 / 21:23 / 21:36）在英方档案里通常为**英国夏令时**；1942 年 7 月英国处于 **BDST（UTC+2）**，故折 UTC 为 **19:11 / 19:23 / 19:36**。本笔记按 BDST 折算；若改用 BST=UTC+1 则各提前一小时，数据层须择一并注明。
3. **最后两艘商船**：Sneland I（约 22:45）与 Avondale Park（约 23:00）在福斯湾；1945 年 5 月英国仍用 **BDST（UTC+2）**，折 UTC 为 **20:45 / 21:00**，距德国投降生效（8 日 23:01 CET = 22:01Z）约 **25 小时**。许多中英文叙述说「投降前不到一小时」，是把 5 月 7 日的当地钟点与 5 月 8 日的中欧时间混读——**这是本战役需要主动纠正的常见错误**。

---

## 2. 来源表

`id` 供 `data/sources/*.json` 直接引用；`口径` 说明它能支撑什么、不能支撑什么。

| id | 作者/机构 | 题名 | 年 | 链接 | 支撑内容与口径 |
|---|---|---|---|---|---|
| `roskill_v1` | S. W. Roskill | *The War at Sea 1939–1945*, vol. I: The Defensive | 1954 | ibiblio.org/hyperwar/UN/UK/UK-RN-I/ | 英国官方战史。第 7 章（1939 年大洋战）与第 14/18/21/22/25 章；**HyperWar 仅第 7 章有全文，其余为占位页**，引用时需注意。 |
| `roskill_v2` | S. W. Roskill | *The War at Sea*, vol. II: The Period of Balance | 1956 | ibiblio.org/hyperwar/UN/UK/UK-RN-II/ | 第 4 章（1942 年美国水域）、第 8 章（1942 年第二次护航战）、第 14 章（1943 年护航的胜利）。本笔记 1942–43 年数字主要据此。 |
| `uboat_net` | Guðmundur Helgason | uboat.net：艇、巡逻、战果、被袭记录 | 1995– | uboat.net/boats/ | 逐艇日期/时刻/位置/吨位，含 KTB 摘录与战后修订（FDS/NHB）。**时刻多为德方 MEZ**。 |
| `wiki_boa` | Wikipedia EN | Battle of the Atlantic | — | en.wikipedia.org/wiki/Battle_of_the_Atlantic | 综述与统计口径；引用其转引的 Blair/Roskill。仅作交叉核对。 |
| `wiki_u30` | Wikipedia EN | German submarine U-30 (1936) | — | en.wikipedia.org/wiki/German_submarine_U-30_(1936) | U-30 八次巡逻、7 月 7 日进驻洛里昂、雅典娜号后续处置。 |
| `wiki_u320` | Wikipedia EN | German submarine U-320 | — | en.wikipedia.org/wiki/German_submarine_U-320 | U-320 被 210 中队加泰林纳机重创后自沉（条目日期 5-08）。 |
| `wiki_reuben` | Wikipedia EN | USS Reuben James (DD-245) | — | en.wikipedia.org/wiki/USS_Reuben_James_(DD-245) | 1941-10-31 被 U-552 击沉，100 人死亡。 |
| `wiki_arctic` | Wikipedia EN | Arctic convoys of World War II | — | en.wikipedia.org/wiki/Arctic_convoys_of_World_War_II | 北极航线总览（78 个船团、约 1,400 艘商船）。 |
| `wiki_151wing` | Wikipedia EN | No. 151 Wing RAF | — | en.wikipedia.org/wiki/No._151_Wing_RAF | 德维希行动编成：6 艘商船 + 油轮 + 荷兰船；15 架装箱飓风，24 架由 Argus 飞往瓦延加。 |
| `wiki_sneland` | Wikipedia EN | SS Sneland I | — | en.wikipedia.org/wiki/SS_Sneland_I | Sneland I 约 22:45 被击沉、7 人死亡。 |
| `wiki_athenia` | Wikipedia EN | SS Athenia (1922) | — | en.wikipedia.org/wiki/SS_Athenia_(1922) | 雅典娜号：19:40 命中、1,418 人在船、117 死（98 乘客+19 船员）、28 名美国人。 |
| `wiki_royal_oak` | Wikipedia EN | HMS Royal Oak (08) | — | en.wikipedia.org/wiki/HMS_Royal_Oak_(08) | 1939-10-14 00:58 发射、01:04 首雷、01:16 三雷、01:29 沉没；835 死（2019 年核定）。 |
| `wiki_courageous` | Wikipedia EN | HMS Courageous (50) | — | en.wikipedia.org/wiki/HMS_Courageous_(50) | 1939-09-17 傍晚被 U-29 击沉，519 死。 |
| `wiki_rawalpindi` | Wikipedia EN | HMS Rawalpindi | — | en.wikipedia.org/wiki/HMS_Rawalpindi | 1939-11-23 16:07 发现、17:03 开火、17:16 沉没；238 死、37 俘。 |
| `wiki_sc7` | Wikipedia EN | Convoy SC 7 | — | en.wikipedia.org/wiki/Convoy_SC_7 | 35 艘、20 沉（含掉队者 21）、79,592 GRT；18/19 夜六小时沉 16 艘。 |
| `wiki_hx79` | Wikipedia EN | Convoy HX 79 | — | en.wikipedia.org/wiki/Convoy_HX_79 | 49 艘、12 沉、75,069 GRT；德方宣称 17 艘。 |
| `wiki_hx72` | Wikipedia EN | Convoy HX 72 | — | en.wikipedia.org/wiki/Convoy_HX_72 | 43 艘、11 沉 2 伤；1940-09-21/22。 |
| `wiki_hx84` | Wikipedia EN | Convoy HX 84 | — | en.wikipedia.org/wiki/Convoy_HX_84 | 1939-11-05：09:40 放机、12:05 发现船团、Jervis Bay 抵抗 20 分钟。 |
| `wiki_scheer` | Wikipedia EN | German cruiser Admiral Scheer | — | en.wikipedia.org/wiki/German_cruiser_Admiral_Scheer | 1940-10-31 夜穿丹麦海峡；整役击沉 113,223 GRT；1941-02 印度洋。 |
| `wiki_berlin` | Wikipedia EN | Operation Berlin (Atlantic) | — | en.wikipedia.org/wiki/Operation_Berlin_(Atlantic) | 1941-01-22 → 03-22，两舰击沉/捕获 22 艘；2/8 与 3/7–8 三次放弃攻击船团。 |
| `wiki_bismarck` | Wikipedia EN | German battleship Bismarck | — | en.wikipedia.org/wiki/German_battleship_Bismarck | 05:52 开火、06:00 胡德爆炸、27 日 08:47–10:39 最后战斗、114 人生还；自沉与战沉的争论。 |
| `wiki_denmark` | Wikipedia EN | Battle of the Denmark Strait | — | en.wikipedia.org/wiki/Battle_of_the_Denmark_Strait | 丹麦海峡交战的战术细节与时刻（英舰 BST）。 |
| `wiki_pq17` | Wikipedia EN | Convoy PQ 17 | — | en.wikipedia.org/wiki/Convoy_PQ_17 | 35 艘、11 艘到达；4 日 21:11/21:23/21:36 三电；7 月 5 日德水面部队出动取消。 |
| `wiki_torch` | Wikipedia EN | Operation Torch | — | en.wikipedia.org/wiki/Operation_Torch | 1942-11-08 登陆；25 艘大西洋 U 艇西调、北大西洋仅余 10 艘。 |
| `wiki_ons5` | Wikipedia EN | Convoy ONS 5 | — | en.wikipedia.org/wiki/Convoy_ONS_5 | 43 艘、16 护航舰、30+ U 艇、13 商船沉、6 U 艇沉；4/28–5/6。 |
| `wiki_hx229` | Wikipedia EN | Convoys HX 229/SC 122 | — | en.wikipedia.org/wiki/Convoys_HX_229/SC_122 | 22 艘（13+9）、146,000 GRT、361 名海员死、仅损失 U-384。 |
| `wiki_blackmay` | Wikipedia EN | Black May (World War II) | — | en.wikipedia.org/wiki/Black_May_(World_War_II) | 1943 年 5 月：41 艘 U 艇沉（全战区），大西洋 34 艘；3 月 120 艘商船沉没（大西洋 82 艘）。 |
| `wiki_biscay` | Wikipedia EN | Battle of the Bay of Biscay | — | en.wikipedia.org/wiki/Battle_of_the_Bay_of_Biscay | 1943 年比斯开湾攻势（Derange/Musketry/Seaslug）与 Do 217 + Hs 293。 |
| `wiki_scharnhorst` | Wikipedia EN | German battleship Scharnhorst | — | en.wikipedia.org/wiki/German_battleship_Scharnhorst | 北角海战 1943-12-26：08:40 雷达接触、19:45 沉没（CET）、36 人生还。 |
| `wiki_deadlight` | Wikipedia EN | Operation Deadlight | — | en.wikipedia.org/wiki/Operation_Deadlight | 156 艘投降、116 艘被凿沉；1945-11-17 → 1946-02-11。 |
| `wiki_charter` | Wikipedia EN | Atlantic Charter | — | en.wikipedia.org/wiki/Atlantic_Charter | 1941-08-09 会面、08-14 公布；无正式签署文本。 |
| `wiki_panama` | Wikipedia EN | Pan-American Security Zone | — | en.wikipedia.org/wiki/Pan-American_Security_Zone | 1939-10 巴拿马宣言；1941-04-18 扩至西经 26°。 |
| `wiki_iceland` | Wikipedia EN | Iceland in World War II | — | en.wikipedia.org/wiki/Iceland_in_World_War_II | 1940-05-10 英军登陆；1941-07-07 防务移交美国。 |
| `wiki_betasom` | Wikipedia EN | BETASOM | — | en.wikipedia.org/wiki/BETASOM | 1940-08 波尔多开基；最多约 30 艘；1943-09 后被德军接管。 |
| `wiki_dfb` | Wikipedia EN | Destroyers-for-bases deal | — | en.wikipedia.org/wiki/Destroyers-for-bases_deal | 1940-09-02 换文；50 艘驱逐舰（43 英、7 加）。 |
| `wiki_laconia` | Wikipedia EN | Laconia incident | — | en.wikipedia.org/wiki/Laconia_incident | 1942-09-12 22:00 被击；9-17 救援会合；随后「拉科尼亚命令」。 |
| `wiki_u2336` | Wikipedia EN | German submarine U-2336 | — | en.wikipedia.org/wiki/German_submarine_U-2336 | 1945-05-07 击沉 Sneland I、Avondale Park；1946-01-03 被 Deadlight 击沉。 |
| `wiki_last45` | Wikipedia EN | Actions of 7–8 May 1945 | — | en.wikipedia.org/wiki/Actions_of_7–8_May_1945 | 1945 年前五个月 125 次巡逻；5-5 仅 29 艘在海上；U-320 为最后一艘战沉。 |
| `wiki_secondhappy` | Wikipedia EN | Second Happy Time | — | en.wikipedia.org/wiki/Second_Happy_Time | 1942-01-14 U-123 击沉 Norness；5 月墨西哥湾 115 艘；6 月 122 艘。 |
| `wiki_caribbean`（备而未用） | Wikipedia EN | Battle of the Caribbean | — | en.wikipedia.org/wiki/Battle_of_the_Caribbean | 加勒比与墨西哥湾航运战、1942-05 起编组护航。 |
| `wiki_losses` | Wikipedia EN | Losses during the Battle of the Atlantic | — | en.wikipedia.org/wiki/Losses_during_the_Battle_of_the_Atlantic | 逐月商船吨位（按 U 艇/飞机/军舰/水雷分列）与 U 艇月损失；口径为 GRT。 |
| `wiki_channel` | Wikipedia EN | Channel Dash | — | en.wikipedia.org/wiki/Channel_Dash | 1942-02-11 23:00 三舰离布雷斯特，12 日过多佛。 |
| `wiki_tiger` | Wikipedia EN | Exercise Tiger | — | en.wikipedia.org/wiki/Exercise_Tiger | 1944-04-28 01:30–03:30，749 名美军死；登陆演习与 E 艇。 |
| `wiki_leuthen` | Wikipedia EN | Wolfpack Leuthen | — | en.wikipedia.org/wiki/Wolfpack_Leuthen | 1943-09-15 → 09-24 对 ONS 18/ON 202：6 商船+3 护航舰，损失 3 艇。 |
| `wiki_hg76` | Wikipedia EN | Convoy HG 76 | — | en.wikipedia.org/wiki/Convoy_HG_76 | 1941-12-19 → 12-23，Audacity 与 36 护航群，首次明确的护航胜利。 |
| `wiki_u505` | Wikipedia EN | German submarine U-505 | — | en.wikipedia.org/wiki/German_submarine_U-505 | 1944-06-04 被 TG 22.3 捕获（与 `wiki_deadlight` 互证）。 |
| `wiki_normandy` | Wikipedia EN | Normandy landings | — | en.wikipedia.org/wiki/Normandy_landings | 1944-06-06 登陆与海况、舰船规模 5,339 艘。 |
| `hyperwar_notes`（说明性，不作数据来源） | HyperWar Foundation | 各卷转录说明 | — | ibiblio.org/hyperwar/ | 说明 Roskill 卷 I/III 未完成转录；引用时不可把占位页当正文。 |
| `naval_history_net`（备而未用） | Gordon Smith / Don Kindell | Naval Events 逐日（1939–45） | — | naval-history.net/xDKWW2-… | 逐日英舰动态；本笔记只用于交叉核对少数日期，未逐条引用。 |

> 未能使用：Blair *Hitler's U-Boat War*（纸本）、Roskill vol. III（HyperWar 未收录全文）、英国海军部 ADM 系列原件、德国 KTB 影印件。凡涉及这三类的一手细节，置信度均下调并标注「转引」。

---

## 3. 战略主线：五个阶段

| 阶段 | 时间 | 德方逻辑 | 盟方应对 | 标志 |
|---|---|---|---|---|
| Ⅰ 袭击舰与被迫护航 | 1939-09 → 1940-05 | 水面袭击舰 + 少量 U 艇，按捕获法作战 | 巡洋舰巡逻、猎杀群、初步远洋护航 | 雅典娜号、皇家橡树、拉瓦尔品第 |
| Ⅱ 法国基地与「快乐时光」 | 1940-06 → 1941-03 | 拿下比斯开湾港口，U 艇航程缩短 1/3；狼群成型 | 永久护航群、冰岛基地、租借驱逐舰 | SC 7 / HX 79、HX 84、HX 112 |
| Ⅲ 全域扩张与美军入场 | 1941-04 → 1942-06 | 打美国东岸、加勒比、北极航线 | 大西洋宪章、美洲安全区、NEF/MOEF、火炬 | Drumbeat、PQ-17、HG 76 |
| Ⅳ 转折 | 1942-07 → 1943-05 | 集中打中大西洋空白区 | 护航航母、超远程航空兵、支援群、厘米波雷达 | HX 229/SC 122、ONS 5、Black May |
| Ⅴ 反攻与终局 | 1943-06 → 1945-05 | 通气管、电艇、声自导鱼雷；本土基地失守 | 猎杀群、比斯开湾封锁、诺曼底海域控制 | 北角、诺曼底、最后巡逻 |

### 3.1 吨位战的经济学

- 英国在 1939 年需要**每周超过 100 万吨**进口物资（`wiki_boa` 转引）。U 艇只要让「沉没吨位 + 受损占坞吨位」接近补充吨位，就能造成战略效果；1940 年底有约 **200 万总吨（占可用船队 13%）在修理中**（`wiki_boa`）。
- 邓尼茨的战前计算：300 艘 VII 型、每月 100 万吨，一年可扼杀英国（`wiki_boa`）。**实际从未接近**：1941 年月均约 18 万吨（Roskill 口径，`roskill_v2` 第 4 章），1942 年峰值月约 70 万吨（`wiki_losses`：1942-06 为 700,235 GRT），但美国同年下水商船超过 1,100 万总吨（`wiki_boa`）。
- 因此「1942 年盟军形势严重但不危急」是本战役的叙事基调；**避免把 1942 年写成溃败**。

---

## 4. 分年进程

### 4.1 1939-09 → 1940-05：袭击舰阶段与护航制度的诞生

**开战当日的两条线**：3 日 11:00 BST（10:00Z）英国宣战，17:00 法国宣战；同日 19:40，U-30（Lemp）在罗卡尔岩以南约 60 海里击沉客轮**雅典娜号**，1,418 人在船，117 死，其中 28 名美国公民（`wiki_athenia`）。德方否认，KTB 被篡改，直到 1946 年纽伦堡才承认（`wiki_athenia`；`wiki_u30` 同源）。**这是整场海战的第一天，也是「无限制潜艇战」争议的起点**。

**猎杀群的失败**：英国把航母编队派去「猎潜」，9 月 14 日 U-39 攻击皇家方舟号，鱼雷提前爆炸，U-39 被护航驱逐舰击沉（战争第一艘 U 艇损失）；9 月 17 日傍晚 U-29（Schuhart）击沉**勇敢号**，519 死（`wiki_courageous`）。自此航母退出反潜巡逻——**这是「护航优先于猎杀」的第一个教训**，但皇家海军直到 1941 年才真正制度化。

**护航制度**：1939 年 9 月起英国从本土向外逐步建立船团制，先沿海、再西经 15°、再远洋（`wiki_boa`、`roskill_v1` 第 7 章）。**争议**：HX 1 的首航日期在二手文献中常写 9 月 16 日，但本笔记未能在可访问的一手/半一手来源中核实，故 `01-timeline.json` **不收录该事件**，只在笔记中提示数据层若使用须标注 low。

**斯卡帕湾**：10 月 14 日 U-47（Prien）潜入斯卡帕湾，00:58 发射、01:04 首雷命中、01:16 三雷、01:29 沉没；835 死（`wiki_royal_oak`）。战术意义大于战略意义：英国本土舰队被迫分散，反潜部署与斯卡帕湾防务彻底重做。

**袭击舰**：11 月 23 日，沙恩霍斯特/格奈森瑙在法罗群岛以北截住**拉瓦尔品第号**（16:07 发现、17:03 开火、17:16 沉没，238 死；`wiki_rawalpindi`）。这是「单舰 vs 战列巡洋舰」的典型：护航 AMC 用命换时间。1940 年上半年德国水面舰队集中于挪威，大西洋上没有袭击舰（`wiki_boa`）。

**挪威与冰岛**：1940-04-09 威悉演习；1940-05-10 英军登陆冰岛（`wiki_iceland`）。冰岛此后成为中大西洋护航与航空兵的关键跳板——**这是地图上必须画出来的「基地链」**：斯卡帕湾—冰岛—纽芬兰。

### 4.2 1940-06 → 1941-03：法国基地与「快乐时光」

**最大的战略变量是地理，不是战术**：1940 年 6 月法国投降，德国获得布雷斯特、洛里昂、圣纳泽尔、拉罗谢尔、波尔多。U 艇从比斯开湾出航，绕过英国北部的时间从约一周缩短到一天，**在航时间占比从约 1/3 提高到 2/3**（通行估计，`wiki_boa` 与 `roskill_v2` 均如此表述）。7 月初 U-30 成为第一艘进入洛里昂的 U 艇（`wiki_u30`）。意大利 1940-08 在波尔多设 BETASOM（`wiki_betasom`）。

**「快乐时光」**：1940 年 6–10 月盟军被击沉 270 余艘（`wiki_boa`）。9 月 21/22 日 HX 72 被四艇狼群攻击，43 艘中 11 沉 2 伤（`wiki_hx72`）；10 月 18/19 日 **SC 7**（35 艘，20 沉，79,592 GRT）与 **HX 79**（49 艘，12 沉，75,069 GRT）在 48 小时内被击沉 28 艘，U 艇无一损失（`wiki_sc7`、`wiki_hx79`）。这是整场战役**单日损失最惨的两天**，也是「永久护航群」改革的直接原因。

**水面袭击舰的高峰与终结**：1940-10-31 夜舍尔号穿丹麦海峡；11-05 攻击 HX 84，Jervis Bay 独自迎战 20 分钟，船团散开，舍尔击沉 5 艘（另 1 艘由空军击沉），整役 113,223 GRT，是二战最成功的水面袭击舰（`wiki_scheer`、`wiki_hx84`）。1941-01-22 → 03-22「柏林行动」，沙恩霍斯特/格奈森瑙击沉或捕获 22 艘，但三次因英国战列舰护航而放弃攻击船团（`wiki_berlin`）——**战列舰护航船团是 1941 年盟军最有效的「反袭击舰」手段**。

**1941 年 3 月：第一次真正的护航胜利**。HX 112 战斗中，U-100 被瓦诺克号雷达发现后撞沉（03:18），U-99 被沃克号深弹重创后自沉（03:43），邓尼茨一周内失去三王牌（Prien 于 3 月 7 日随 U-47 失踪，`uboat_net`）。**注意**：这不是「雷达决定论」——HX 112 的护航群是刚成立的常设第 3 护航群，战术协同才是关键（`roskill_v2`、`wiki_boa`）。

### 4.3 1941-04 → 1941-12：美国入场前的「灰色战争」

- **1941-03-11 租借法案**；**04-18 美洲安全区扩至西经 26°**（`wiki_panama`）；**07-07 冰岛防务移交美国**（`wiki_iceland`）；**09-04 格雷尔号事件、09-11 「见即击沉」、10-17 科尔尼号被击伤、10-31 鲁本·詹姆斯号被击沉**（`wiki_boa`；后两条事件在 `01-timeline.json` 中标 medium，因未取得美方原始档案）。
- **05-09 U-110 被俘**：斗牛犬号与奥布雷蒂亚号迫使 U-110 上浮，缴获 Enigma 与双字母表，此后数周 U 艇通信可读（`wiki_boa`、`uboat_net`）。
- **05-24 丹麦海峡**：05:52 胡德号开火（英舰舰钟；该条注明舰钟比当地时早四小时），06:00 被俾斯麦号第五次齐射击穿弹药库，1,418 人中 3 人生还；**05-27 08:47–10:39（英舰舰钟）** 最后战斗，俾斯麦自沉与战沉并存的结论（`wiki_bismarck`、`wiki_denmark`）。**战略后果**：希特勒禁止水面舰队再进入大西洋，海军资源全面转向 U 艇。
- **06-13 纽芬兰护航部队（NEF）成立**（5 月 23 日海军部请求，6 月 13 日 Murray 就任），加拿大承担西经 35° 以西（`wiki_boa`）。**这是「全程护航」的制度化**。
- **08-09 → 08-14 大西洋会议与《大西洋宪章》**（`wiki_charter`）。军事意义有限，政治意义极大：它把美国从「中立巡逻」推向「非交战国同盟」。
- **08-21 → 08-31 第一次北极航线（Dervish）**；此后 PQ/QP 系列开通（`wiki_pq17` 背景章）。北极航线把「护航」变成「三方协同 + 岸基航空兵 + 水面掩护」的复合问题。
- **12-19 → 12-23 HG 76**：Audacity 护航航母 + 沃克第 36 护航群，5 艘 U 艇换 3 艘商船 + 1 艘驱逐舰 + 1 艘护航航母，**第一次明确的船团防御胜利**（`wiki_hg76`；该条目导言作「两艘商船」、Aftermath 作「三艘」，本笔记取三艘）。

### 4.4 1942：Drumbeat、加勒比、PQ-17 与火炬

**Drumbeat（鼓点行动）**：12-12 决定、01-02 五艘 IX 型出航（原定 12 艘，被上级砍半，另 3 艘被改派地中海）（`roskill_v2` 第 4 章）。**01-13 抵美国近海，01-14 凌晨 U-123 在长岛外海击沉挪威油轮 Norness**（`wiki_secondhappy`）。1 月前两周 13 艘约 10 万吨；2 月东岸海域单月超过该数；3 月东岸 28 艘 159,340 GRT、墨西哥湾与加勒比 15 艘 92,321 GRT，其中 57% 是油轮（`roskill_v2`）。**争议**：金氏（Ernest King）拒绝立即实行沿岸护航与灯火管制，是「驱逐舰不足」还是「判断错误」，本笔记并列两说，倾向「资源约束 + 判断失误并存」（medium）。

**加勒比与墨西哥湾**：1942 年 5 月墨西哥湾被击沉 115 艘（101 艘单独航行），6 月 122 艘（108 艘单独航行）（`wiki_secondhappy`）。**05-14 第一支美国沿岸船团**从汉普顿锚地驶往基韦斯特（`wiki_boa`）；此后逐段闭合，7 月 19 日邓尼茨撤走东岸最后一批 U 艇（`wiki_boa`）。

**PQ-17**：06-27 从赫瓦尔峡湾出航，35 艘；07-04 21:11/21:23/21:36（BDST=UTC+2）三道电令，船团解散；24 艘沉没，11 艘到达，损失 3,350 辆车辆、430 辆坦克、210 架飞机、约 153 名海员（`wiki_pq17`）。**争议**：庞德（Dudley Pound）的决定是「谨慎」还是「惊慌」；本笔记采用「情报不完整 + 恐惧提尔皮茨」的解释，但指出提尔皮茨当日仍在阿尔塔峡湾，德军水面部队 7 月 5 日出动后即取消（`wiki_pq17`）。

**拉科尼亚事件**：09-12 22:00 U-156 击沉拉科尼亚号，随后救援、被美军 B-24 攻击，09-17 会合维希法国舰艇；邓尼茨随即下达「拉科尼亚命令」（`wiki_laconia`）。**这是本战役必须处理的政治—伦理节点**，数据层宜用 `category: "atrocity"` 或 `political`，正文保持克制。

**火炬行动**：11-08 登陆；邓尼茨把 25 艘大西洋 U 艇西调，北大西洋只余 10 艘，护航战「几乎停摆」（`wiki_torch`）。**战略含义**：两栖作战与护航战共享同一批驱逐舰与护航航母——这是 1942 年底盟军最大的资源矛盾。

**11-19 霍顿接任西部航道司令部**，设立不承担固定船团责任的「支援群」（support groups），并推广「按住」战术（`wiki_boa`）。这是 1943 年 5 月胜利的组织前提。

### 4.5 1943：会议、三月船队战、Black May、比斯开湾

**01-14 → 01-24 卡萨布兰卡**：确定「先欧后亚」、加大反潜资源；**03-01 华盛顿大西洋护航会议**（Atlantic Convoy Conference）：美国提出退出北大西洋船团护航，改由英加承担，自己接手中南大西洋油船航线并派出一支护航航母支援群；分界移到西经 47°，加拿大成立西北大西洋司令部，新安排 4 月 1 日生效（`roskill_v2` 第 14 章）。**闭幕日期各说不一**，本笔记只采用「3 月 1 日开幕」。**这是本战役最重要的「会议」事件**，但中文资料常与 1941 年大西洋会议、1943 年 5 月 Trident 混淆。

**三月船队战**：03-05 起 UGS 6、HX 228、SC 121 连续交战；**03-16 → 03-19 HX 229/SC 122**，90 艘商船、16 艘护航舰、38 艘 U 艇，22 艘商船沉（13+9）、146,000 GRT、361 名海员死，仅损失 U-384（`wiki_hx229`）。3 月全月盟军沉船 120 艘 693,000 长吨，其中大西洋 82 艘 476,000 长吨（`wiki_blackmay`）。**这是整场战役的盟军最低点**；英国一度讨论放弃船团制（`wiki_boa` 转引 Roskill/Blair）。

**Black May**：04-28 → 05-06 ONS 5，43 艘、16 艘护航舰、30 余艘 U 艇，13 艘商船沉、6 艘 U 艇沉（`wiki_ons5`）；两周后 SC 130 至少 3 艘 U 艇被击沉而船团无损失；05-24 邓尼茨撤出北大西洋航线，承认「我们输掉了大西洋战役」（`wiki_boa`）。5 月全战区 41 艘 U 艇被击沉（大西洋 34 艘），占 U 艇部队作战实力的约 25%（`wiki_blackmay`）。

**为什么是 5 月**：① 护航航母与支援群到位；② 1943-03-18 罗斯福下令从太平洋抽调 60 架 B-24，超远程航空兵关闭空白区（`wiki_boa`）；③ 厘米波 ASV III 雷达使 Metox（米波）失效；④ 3 月 10 日 Enigma 增设密钥造成的 9 天盲期结束后，Bletchley 恢复读报；⑤ 加拿大护航舰与训练体系改善（`roskill_v2`）。

**比斯开湾攻势**：04-13 起 Operation Derange，75 架远程飞机用 ASV III 雷达巡逻 U 艇出入航道；德军让 U 艇上浮对空作战，「高炮艇」失败，5 月 5 艘被击沉、7 艘被迫返航（`wiki_boa`、`wiki_biscay`）。8 月起盟军获得亚速尔群岛基地，空白区彻底闭合（`wiki_boa`）。

**9 月 Leuthen 狼群**：09-15 → 09-24 对 ONS 18/ON 202，击沉 6 艘商船 + 3 艘护航舰，损失 3 艘 U 艇；此后 Rossbach/Schlieffen/Siegfried 等狼群再无所获，11 月邓尼茨解散狼群战术（`wiki_leuthen`、`wiki_boa`）。

**12-26 北角海战**：沙恩霍斯特出击 JW 55B，08:40 被贝尔法斯特雷达发现，19:45（CET）沉没，1,968 人中 36 人生还（`wiki_scharnhorst`）。**水面舰队的最后一击**；此后德国海军只剩 U 艇。

### 4.6 1944：通气管、诺曼底与基地失守

- **战略态势**：1944 年 1 月大西洋 U 艇巡逻 41 次，5 月降至 10 次；可用艇从 121 降至 89（`wiki_boa` 转引 Blair）。邓尼茨把希望寄托在 XXI/XXIII 型电艇与通气管（Schnorchel）。
- **06-04 U-505 被俘**（TG 22.3），缴获 Enigma 与密码本——与 1941 年 U-110 并列的两次「密码战俘获」（`wiki_u505`、`wiki_deadlight`）。
- **06-06 诺曼底**：大西洋行动暂停，36 艘 U 艇（后增 7 艘）出击，13 艘被击沉，仅击沉 5,339 艘参战舰船中的 8 艘；无通气管的艇被迫召回，随后 11 艘通气管艇从挪威赶来，击沉 2 艘、损失 7 艘（`wiki_boa`）。**这是「通气管 + 近岸」也救不了战略颓势的证明**。
- **08–09 基地失守**：布雷斯特 9 月、波尔多 8 月被盟军收复；洛里昂、圣纳泽尔、拉罗谢尔被围但守到战争结束，已无法出击，30 艘 U 艇撤往挪威（`wiki_boa`）。**地图上应把「比斯开湾基地群」作为一个整体图层，随 1944 年 8–9 月逐一点灭**。
- **04-28 老虎演习**：莱姆湾 E 艇夜袭，749 名美军死亡（`wiki_tiger`）。它与大西洋海战的关系是「登陆前的海上威胁」，可作为 1944 年章节的注脚。

### 4.7 1945：最后巡逻与投降

> 补充：1945-05-04 邓尼茨下令全部 U 艇停火，但命令未送达每一艘艇（U-2336 即未收到，`wiki_u2336`）；5-05 起执行「彩虹」自沉。

- **最后五个月**：U 艇部队向大西洋派出 125 次巡逻，主要在英近岸；到 5 月 5 日只剩 29 艘在海上（`wiki_last45`）。VII 型通气管艇 113 次巡逻、损失 65 艘；IX 型 19 次赴美洲、损失 9 艘；XXIII 型 5 艘 7 次巡逻；XXI 型仅 1 艘出海且未交战（`wiki_boa`）。
- **05-07**：U-2336 在福斯湾击沉 Sneland I（约 22:45 BDST）与 Avondale Park（约 23:00 BDST），9 人死亡（`wiki_u2336`、`wiki_last45`）；同日 U-320 被加泰林纳机重创，次日自沉，是最后一艘战沉的 U 艇（`wiki_last45`）。
- **05-05 起「彩虹」自沉**：222 艘 U 艇被己方凿沉（`wiki_boa`）；**05-08 23:01（CET）投降生效**。
- **战后**：156 艘投降（`wiki_deadlight` 口径）与 174 艘（`wiki_boa` 口径）并存——差别在于是否计入在海上、在远东及被日军接收的艇；116 艘在 1945-11-17 → 1946-02-11 的「死光行动」中被凿沉（`wiki_deadlight`）。**这两个数字必须并列写，不能只取一个**。死光行动在战役时间窗之外，`01-timeline.json` 把它单列在 `epilogue`，不进入 `events`。

---

## 5. 争议点并列与取舍

| # | 争议 | 版本 A | 版本 B | 本笔记取舍 |
|---|---|---|---|---|
| 1 | 雅典娜号死亡人数 | 117（98 乘客+19 船员，`wiki_athenia`） | 112（`uboat_net` 早期统计）；德国宣传称「英国自沉」 | 取 117，注明统计口径；「英国自沉」说作为宣传谎言记录 |
| 2 | 皇家橡树号日期 | 10-14 00:58（来源未注时区） | 若为德方 MEZ，则 UTC 为 10-13 23:58 | 事件保留 00:58 并标 `clockBasis: unstated`，同时给 `atAlt: 10-13T23:58` 与说明；数据层须择一 |
| 3 | 皇家橡树号死亡 | 835（2019 年核定） | 833 / 786（旧统计） | 取 835 |
| 4 | SC 7 沉没数 | 20/35（`wiki_sc7`） | 21/35（计入掉队被击沉者） | 取 20，正文注明「连同掉队者共 21」 |
| 5 | HX 79 沉没数 | 12 艘 75,069 GRT（Rohwer） | 德方宣称 17 艘 | 取 12；宣称值作为宣传战注记 |
| 6 | 胡德号死亡 | 1,415 / 1,418 / 1,419 | 3 人生还 | 取 1,418、3 生还（`wiki_bismarck`） |
| 7 | 俾斯麦号沉没原因 | 英军鱼雷 + 炮火 | 德方自沉（Oels 09:30 下令） | 并列：自沉加速了必然的沉没；不写「唯一原因」 |
| 8 | PQ-17 损失 | 24/35 沉没、11 到达（`wiki_pq17`） | 25 艘（把重创后放弃者计入） | 取 24，注明另有 1 艘重创弃船 |
| 9 | 1943 年 5 月 U 艇损失 | 41 艘（全战区，`wiki_losses` 月表） | 43 艘（`wiki_boa` 正文）/ 34 艘（大西洋） | 取「全战区 41、大西洋约 34」，正文不用单一数字 |
| 10 | 1943 年 5 月商船损失 | 58 艘（全战区）/ 34 艘 134,000 GRT（大西洋） | 有些叙述只写大西洋 | 取大西洋口径 34 艘，附全战区数 |
| 11 | ONS 5 战果 | 13 商船、6 U 艇（`wiki_ons5`） | 12 商船、7 U 艇（部分德方统计） | 取 13/6，注明「一说 12/7」 |
| 12 | 北角海战时刻 | 19:45 CET（`wiki_scharnhorst`） | 19:45 GMT（部分英方叙述） | 取 CET=18:45Z，并在 `notes` 标注 |
| 13 | 最后两艘商船与投降的间隔 | 约 25 小时（20:45Z → 22:01Z，按 BDST 折算） | 「不到一小时」（混读 5-07 当地钟点与 5-08 中欧时间） | **取约 25 小时**，并在正文中解释这个常见错误 |
| 14 | 投降 U 艇数 | 156（`wiki_deadlight`） | 174（`wiki_boa`） | 两者并列，说明口径 |
| 15 | 自沉 U 艇数 | 222（`wiki_boa`） | 216 / 224（不同统计） | 取 222，标 medium |
| 16 | 破译的贡献 | Hastings：1941 年挽救 150–200 万吨 | Hessler（德方）：失败首因是雷达 | 并列；本笔记认为「1943 年 5 月是雷达+航空+护航组织+情报的合力」 |
| 17 | 金氏拒绝沿岸护航 | 批评者：判断错误 | 辩护者：驱逐舰不足、太平洋优先 | 并列，倾向「资源约束 + 判断失误并存」 |

---

## 6. 给数据层的对接建议

### 6.1 `phases` 建议（6 段）

| id | 起 | 止 | 名称 | 说明 |
|---|---|---|---|---|
| `ph1` | 1939-09-03 | 1940-06-21 | 袭击舰与猎杀群 | 护航制度草创；斯卡帕湾；拉瓦尔品第 |
| `ph2` | 1940-06-22 | 1941-03-31 | 法国基地与快乐时光 | SC 7/HX 79；舍尔；柏林行动；HX 112 |
| `ph3` | 1941-04-01 | 1942-06-30 | 美国入场与全域扩张 | 大西洋宪章；NEF；北极航线；Drumbeat；PQ-17 |
| `ph4` | 1942-07-01 | 1943-05-31 | 转折 | 火炬；HX 229/SC 122；ONS 5；Black May |
| `ph5` | 1943-06-01 | 1944-06-05 | 反攻 | 比斯开湾；Leuthen；北角；护航航母猎杀群 |
| `ph6` | 1944-06-06 | 1945-05-08 | 终局 | 诺曼底；基地失守；通气管；最后巡逻；投降 |

**播放速度**：`ph4` 需放慢（3 月船队战与 ONS 5 各用 1–2 分钟真实时间），`ph1`/`ph6` 可快。

### 6.2 控制区两槽位（`raider` / `convoy`）

- `raider`：1939 年分散的袭击舰航线 → 1940-07 后以比斯开湾为顶点的扇面 → 1942 年西扩至美国东岸与加勒比 → 1943-05 后收缩至中大西洋与比斯开湾 → 1944-08 后消失（只剩挪威—英国近岸）。
- `convoy`：1939 年只在本土接近航道 → 1941 年冰岛—纽芬兰全线 → 1942 年加勒比与北极支线 → 1943 年空白区被航空圈覆盖 → 1944 年诺曼底滩头海域 → 1945 年福斯湾—北海。
- 两者在 1943 年 3–4 月的「空白区」应有明显重叠，这是叙事高点。

### 6.3 `importance` 分配（建议）

- **importance 1（10 条，`01-timeline.json` 现状）**：法国停战与比斯开湾基地、SC 7、Drumbeat、火炬、华盛顿护航会议、HX 229/SC 122、ONS 5、Black May、诺曼底、德国投降。数据层若要压到 5–6 条，建议保留「法国基地、Drumbeat、华盛顿会议、HX 229/SC 122、Black May、投降」。
- **importance 2（`01-timeline.json` 中 46 条）**：雅典娜、皇家橡树、SC 7/HX 79、HX 84、HX 112、大西洋宪章、PQ-17、火炬、ONS 5、比斯开湾、诺曼底、北角等；数据层若要收紧，可按「每年 4–6 条」重排。
- **importance 3（13 条）**：其余技术与次要节点。

### 6.4 `data/naval/` 的四个海战片段（供 R3/工程-海战参考）

1. **丹麦海峡 + 俾斯麦最后一战**（1941-05-24 / 05-27）：单舰对抗，适合 `fire/hits/torpedoes/damage`。
2. **HX 229/SC 122**（1943-03-16 → 19）：多艇对多舰，适合 `signals`（德方接触报告、英方支援群电报）+ `torpedoes` + `damage`。
3. **ONS 5**（1943-04-28 → 05-06）：夜间水面狼群，适合烟幕、照明弹（用 `signals` + `fire` 近似）。
4. **北角**（1943-12-26）：雷达射击与鱼雷，适合 `fire`（雷达火控）+ `torpedoes` + `damage`。

> 注意：`data/naval/` 只接受 `fire/hits/torpedoes/smoke/damage/signals` 六类，**没有「雷达接触」「深弹」的专用类型**；深弹可用 `hits`（`weapon` 留空、`effect` 写「深水炸弹」）近似，雷达接触写进 `signals` 并在 `note` 说明。

### 6.5 术语统一

- 船团：**HX（哈利法克斯—英国快船团）、SC（悉尼—英国慢船团）、ON/ONS（英国—北美空载）、PQ/QP/JW/RA（北极）、UGS/UGF（美国—地中海）、SLS/HG（塞拉利昂/直布罗陀）**。中文写「HX 229 船团」「SC 122 船团」。
- 舰名保留原文：`HMS Hood` 写「胡德号（HMS Hood）」；U 艇写「U-47」。
- 行动代号：`Paukenschlag` 写「鼓点行动（Paukenschlag）」；`Rheinübung` 写「莱茵演习（Rheinübung）」；`Cerberus` 写「雷霆行动（Operation Cerberus，通称「海峡冲刺」）」。
- 数字：商船吨位一律注 **GRT**，军舰注标准排水量；U 艇损失按「艘」不按吨。

---

## 7. 统计口径速查（数据层可直接引用）

| 指标 | 数值 | 口径/来源 |
|---|---|---|
| 商船被 U 艇击沉总吨位 | 14,668,785 GRT | 逐月表合计（`wiki_losses`） |
| 商船损失（全战区） | 约 3,500 艘 | `wiki_boa` 信息框 |
| 盟军军舰损失 | 175 艘 | `wiki_boa`（含其他战区） |
| U 艇损失 | 783 艘 | `wiki_boa`；另有 785/793 说 |
| U 艇人员死亡 | 约 30,000 | `wiki_boa` |
| 英国商船海员死亡 | 约 36,000 | `wiki_boa` |
| 皇家海军死亡 | 约 36,200 | `wiki_boa` |
| 海岸司令部反潜飞行损失 | 741 架 | `wiki_boa` |
| 1943-03 盟军沉船 | 120 艘 693,000 长吨（大西洋 82 艘 476,000） | `wiki_blackmay` |
| 1943-05 U 艇损失 | 41 艘（大西洋 34） | `wiki_blackmay` / `wiki_losses` |
| 投降 U 艇 | 156（`wiki_deadlight`）/ 174（`wiki_boa`） | 口径不同，并列 |
| 自沉 U 艇 | 222（`wiki_boa`） | medium |

### 7.1 关键月份吨位（GRT，`wiki_losses`）

| 月份 | 被 U 艇击沉 | 被飞机击沉 | 被军舰/袭击舰击沉 | 被水雷击沉 |
|---|---|---|---|---|
| 1939-09 | 153,879 | 0 | 5,051 | 29,537 |
| 1940-10 | 352,407 | 8,752 | 32,134 | 32,548 |
| 1941-06 | 310,143 | 61,414 | 17,759 | 15,326 |
| 1942-06 | 700,235 | 54,769 | 48,474 | 19,936 |
| 1942-11 | 729,160 | 53,868 | 19,178 | 992 |
| 1943-03 | 627,377 | 65,128 | 0 | 884 |
| 1943-05 | 264,853 | 20,942 | 0 | 1,568 |
| 1944-06 | 57,875 | 9,008 | 1,812 | 24,654 |
| 1945-05 | 11,439 | 7,176 | 0 | 0 |

**读法**：1943 年 3 月仍是高峰，5 月腰斩，1944 年 6 月已降到峰值的 8%。这张表可以直接做成导演模式的「吨位曲线」叠加层。

---

## 8. 缺口与待核实

1. **HX 1 首航日期**（常写 1939-09-16）未在可访问来源中核实，暂不收录。
2. **英国 1941 年全年「见即击沉」前后的美方档案**（罗斯福讲话原文、海军作战部长命令）未取得，相关事件置信度 medium。
3. **邓尼茨 1943-05-24「我们输掉了大西洋战役」的原话**只见于二手转引（Costello & Hughes），未找到德方原文；引用时写「据……转引」。
4. **1943-03-01 大西洋护航会议**的逐日议程与闭幕日期未取得一手记录，只有 Roskill 的概述（3 月 1 日开幕、4 月 1 日新安排生效）；该条置信度 medium。
5. **北角海战 19:45** 的时区（CET vs GMT）未能在英方战报中核实，按德方叙述取 CET。
6. **「彩虹」自沉 222 艘**与 Deadlight 的 116 艘之间存在口径差（前者含所有战区、后者仅移交英国的艇），数据层不要相加。
7. **意大利 BETASOM 战果**（32 艘艇、109 艘船、593,864 GRT）来自 `wiki_boa` 转引 Giorgerini，未独立核实，若用须标 medium。
8. **中国战场/太平洋对照**：本笔记不涉及；总台卷宗若需「同时期其他战区」注记，另行补。

---

## 9. 交付说明

- 本文件：战略叙事、来源表、争议表、数据对接建议。
- [`01-timeline.json`](01-timeline.json)：**69 个战役窗口内**事件候选（+1 条 `epilogue`），UTC 时刻 + `atOriginal`/`clockBasis` 原时钟 + `atAlt`（仅三处时区争议）+ 坐标 + 建议 category/importance/side/units + **35 条** 80–140 字中文正文草稿 + 每条 `sources`/`confidence`/`notes`，另含 `frameNote`（图幅越界提示）、`nominalTime`（day 精度的编排时刻）与 `caveats`（口径提醒）。
- 未写 `data/` 下任何文件；未改 `campaign.json`。
