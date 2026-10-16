# 敦刻尔克 1940 · 研究笔记

> 为「敦刻尔克大撤退 1940」战旗推演战役编写的逐时逐日史实底稿。
> 供战役写手（OOB / 轨迹 / 事件文案 / 地图标注）直接引用。
> 编制日期：2026 年（研究窗口见 §6）。所有时刻除注明外均为 **BST（英国夏令时，UTC+1）**；
> 涉及德军文件的原件时刻多为 **CET（中欧时间，UTC+1）**，两者在 1940 年 5–6 月恰好相同，故数值可直接互通。

---

## 0. 使用方法与置信度说明

### 0.1 本笔记的定位

本笔记**不是**一篇叙事史，而是**可引用的证据汇编**。它的用途有三：

1. 为 `data/events.json` 的每条事件提供**作者、时刻、地点、数字**四要素；
2. 为 `data/oob/*.json` 与 `data/routes/*.json` 的部队位置与推进速度提供**日粒度锚点**；
3. 为 `config` 里的 `marks`、阶段文案与图例提供**经过核对的时间轴**。

### 0.2 来源标注约定

每个事实后以圆括号标注来源 id，例如：

- `（dynamo_despatch）` —— Ramsay 海军中将《发电机行动》正式战报（London Gazette 1947-07-17，档案全文见 §6）；
- `（ellis_1953 ch.14）` —— 英国官方战史 Ellis 第 14 章；本笔记的 `ellis_1953 ch.N` 一律指
  `https://www.ibiblio.org/hyperwar/UN/UK/UK-NWE-Flanders/UK-NWE-Flanders-N.html`；
- `（wiki:Dunkirk_evacuation）` —— 维基百科条目 raw wikitext；`wiki:` 前缀一律表示维基来源；
- `（frieser_2005 pp.287–296）` —— 二次文献，页码按原书；
- `（CAB 65/13）` —— 英国国家档案馆档号；
- `（halder_diary 1940-05-24）` —— 日记类来源，标注条目日期。

### 0.3 置信度分级

| 级别 | 含义 | 典型情形 |
|---|---|---|
| **high** | 有一手档案或两部以上独立来源互证，且数字/时刻无冲突 | Dynamo 启动令 18:57；每日登船人数表 |
| **medium** | 有单一权威来源，或两部来源在小数位/分钟上有出入 | 各驱逐舰沉没的具体分钟 |
| **low** | 仅见于回忆录、战后转述，或来源之间**互相矛盾且无法裁决** | 停止前进令的「政治动机」类说法 |

**凡本笔记写「不确定」处，均为经查证后仍无法定论，或来源互相矛盾。**
**本笔记不填补任何空缺数字。**凡原来源未给出的分钟，一律写「时刻不详」。

### 0.4 三种口径必须分清（写手最易出错处）

这是本笔记反复强调的一点，因为在敦刻尔克研究里，**同一个「每日数字」至少有三种互不相同的口径**：

1. **登船数（embarkation）**：在敦刻尔克上船的人数；
2. **抵英数（disembarkation / landed in U.K.）**：在英国港口下船的人数——**比登船日晚 6–24 小时**，
   且因伤员、转运、船只在途而数字不同；
3. **战斗序列口径（ établie / ration strength）**：某日某时某部队的在编人数。

本笔记 §2 中的「每日登船数」采用维基表格（经 Ramsay 战报附录 II 校验），
而 §2.9 单列 Ramsay 战报附录 II 的**抵英数**，两者差额已注明。**写手引用时必须写明用的是哪一口径。**

### 0.5 与 `docs/CONTRACT.md` 的冲突（重要，请 Lead 裁决）

研究过程中发现契约 §4 前线时刻表与 §11.2 时间轴标记**至少有四处与史料不符**，详见 §1.9 与 §2.11。
最严重的一处是：契约写 `06-01T12:00 昼间撤离停止`，而 Ramsay 战报明确记载
**海军部下令 6 月 2 日 07:00 停止**、**6 月 1 日是最后一次大规模昼间撤离**（dynamo_despatch §65）。
契约另写 `05-26T19:00 加来陷落`，而加来守军在 **16:00 前后**即已崩溃（wiki:Siege_of_Calais_(1940)）。
建议 Lead 复核后统一。

---

## 1. 逐时逐日时间线（1940-05-25 — 06-04）

### 1.0 前置：5 月 23–24 日的战略决定（本战役的「原因」）

虽然本战役的 `epoch` 定在 5 月 25 日 00:00，但**停止前进令（Haltebefehl）发生在 5 月 23–24 日**，
它是整个敦刻尔克事件的直接前提。为免写手误引，此处先逐时列出。

**5 月 23 日（星期四）**

- **傍晚约 18:00** —— A 集团军群（Rundstedt）向第 4 集团军（Kluge）下达指示：装甲部队**不得越过运河线**
  （Canal Line，即 Lens–Béthune–Aire–St Omer–Gravelines 一线）。这是**停止前进令的原始出处**。
  Ellis 判断：该决定「在希特勒到达之前一天就已由 Rundstedt 作出」（ellis_1953 ch.9，confidence: **high**）。
- **18:10** —— Rundstedt 亲自告知 Hoth 集群参谋长：集团军明日**基本停止**，「必须整顿并恢复秩序，
  当前战线务必守住」（ellis_1953 App.II p.348 引德军第 4 集团军战时日志，confidence: **high**）。
- **18:10（另一条，同时刻不同文件）** —— 第 4 集团军战时日志记载：
  「第 4 集团军明日将大体上按 Colonel-General von Rundstedt 之命停止前进」。
  **该条目时刻 18:10 是本笔记能给出的「停止前进令」最精确的下达时刻**（ellis_1953 Supplement p.347，
  引 AOK 4 KTB，confidence: **high**）。
- **当日晚** —— Rundstedt 与 Kluge 谈话，Kluge 说「部队会很高兴明天能整顿一下」，Rundstedt 同意
  （ellis_1953 Supplement p.347，confidence: **high**）。

**5 月 24 日（星期五）**

- **约 11:30** —— 希特勒飞抵 A 集团军群司令部 Charleville，与 Rundstedt 会面。
  希特勒「完全同意」用步兵在 Arras 以东进攻、装甲部队停在已到达的
  Lens–Béthune–Aire–St Omer–Gravelines 一线上；并强调「无论如何必须把装甲部队保存下来供未来作战使用」，
  且「进一步压缩包围圈只会产生限制空军活动的极不希望的结果」（ellis_1953 ch.9
  引 A 集团军群战时日志，confidence: **high**）。
  → **注意**：这是**背书（endorsement）**，不是**下令（issuance）**。停止前进令的原始决定权在 Rundstedt。
- **约 12:42** —— Rundstedt 以「元首命令」（By the Führer's orders）形式发出下述命令，**未加密发报**，
  被英国皇家空军 Y 情报网截获：
  「西北方向 Arras 之攻击应限于 Lens–Béthune–Aire–St Omer–Gravelines 一线。**运河不得越过。**」
  （wiki:Dunkirk_evacuation 引截获记录；ellis_1953 ch.9 亦载同一命令，confidence: **high**）。
- **当日** —— 希特勒签发**第 13 号元首指令（Führerweisung Nr. 13）**。指令要求歼灭
  「被困于敦刻尔克口袋中的法、英、比部队」，并令空军阻止英军渡海逃脱
  （wiki:Battle_of_Dunkirk 引 Bond 1990 pp.104–105；hitler_weisung13，confidence: **high** 之于「内容」）。
  → **不确定**：第 13 号指令的**具体签发分钟**与**OKW/OKH 文件编号**（如 `OKW WFSt Op Nr. 33021/40 g.K.`
  一类）在本笔记查证范围内**未能从可信来源核实**。维基与 Ellis 均只写「5 月 24 日」。
  **请勿在战役数据中编造该编号。**
- **20:00** —— 陆军总司令（von Brauchitsch）自 OKW 返回（halder_diary 1940-05-24 条，ellis_1953 App.II p.350，
  confidence: **medium**，因该条在附录中的日期归属需按页面顺序推断）。
- **20:20** —— 下达命令，**撤销前一日之命令**，改令在
  Dünkirchen–Estaires–Lille–Roubaix–Ostende 地域实施合围；「无所阻挡的快速左翼，
  **应元首明确要求，被叫停**」（halder_diary，ellis_1953 App.II p.350，confidence: **medium**）。
  → 此条与 18:10 条目**并非矛盾**：前者是 A 集团军群对第 4 集团军的下令，
  后者是 OKH 层面对指挥关系的调整与合围任务的重申。
- **当日晚** —— 第 4 集团军（Kluge）告知 Hoth 集群「明日大体停止」，
  并令 Kleist 集群「就地整顿、清理局势」（ellis_1953 ch.9，confidence: **high**）。

**5 月 25 日（星期六）**

- **全天** —— 装甲部队**基本静止**。哈尔德日记抱怨「OKH 在未告知元首与 OKW 的情况下，
  把第 4 集团军及一批后方师转隶 B 集团军群」，希特勒「非常不满」，认为这「在军事上和心理上都是错的」
  （halder_diary，ellis_1953 App.II p.349，confidence: **high**）。
- **当日** —— 第 4 集团军库战日志中出现一句为后世反复引用的抱怨：
  「这里有一种印象，今天什么都没发生，没有人再对敦刻尔克感兴趣。城市与港口必须被炮击，
  **必须阻止登船，必须制造恐慌**」（ellis_1953 ch.15 引 AOK 4 KTB，confidence: **high**）。
- **当日** —— 博克（Bock）的 B 集团军群并不急于充当「锤子」。其关注点在比利时，
  希望通过在比军与英军之间打开缺口来迂回英军侧翼，从而**把英军与 Ostend 分开**
  ——德方认为 Ostend 是**最便于撤退的港口**（ellis_1953 Supplement p.347–348，confidence: **medium**）。
  → 这一条对理解「德军为何没有全力扑向敦刻尔克」很有价值，写手可用于德军侧叙事。
- **盟军侧** —— 英军开始向敦刻尔克方向收缩。利斯河（Lys）防线仍在，但比军已现疲态。
- **英军** —— 第 5 师与第 50 师被派往 Comines–Ypres 之间的缺口（ellis_1953 ch.11，confidence: **high**）。
- **比军** —— 利斯河战役（Battle of the Lys）自 5 月 24 日开始，25 日英军意识到反攻已不可能，
  开始向敦刻尔克撤退（wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
- **06:30** —— 英军第 12 皇家枪骑兵团（12th Royal Lancers）奉命开赴利斯河以北，
  掩护英军第 2 军左翼并恢复与比军的接触（wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **当日** —— 比利时国王利奥波德三世向部队发布命令：「无论发生什么，我将与你们共命运」
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **当日** —— 比军第 5、第 17 团部分士兵在 Meigem 未战即交出桥头堡，违抗军官命令；
  有一处出现士兵射杀上级（wiki:Battle_of_the_Lys_(1940)，confidence: **low**，仅单一来源）。
- **当日** —— 阿登猎兵（Chasseurs Ardennais）在 Vinkt 村成功击退德军第 56 步兵师多次进攻
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **当夜起** —— 比军在 Roeselare–Ypres 铁路线上并排停放 2,000 节车皮，作为临时防坦克障碍
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **当日** —— 英军第 48 师第 145 旅仍据守 Cassel（孤立据点）（ellis_1953 ch.14，confidence: **high**）。
- **当日** —— 第 44 师在 Mont des Cats 阵地（ellis_1953 ch.14，confidence: **high**）。
- **当日** —— 英国战时内阁与军方高层对「是否撤退」仍在犹豫；丘吉尔此前（5-22）仍要求向南反攻
  （wiki:Dunkirk_evacuation，confidence: **high**）。

> **写手提示**：`epoch = 1940-05-25T00:00` 时刻，德军装甲主力**停在运河线上静止**。
> 这解释了为什么战役第一帧的德军控制区南界是 Gravelines–Saint-Omer–Cassel–Hazebrouck–Armentières–Menen
> 一带（见 CONTRACT §4）——与 Ellis 所载 5 月 25 日态势一致。

---

### 1.1 5 月 26 日（星期日）—— 「发电机」启动

**战略层面**

- **上午** —— Gort 通知陆军大臣：已将第 5、第 50 师派去填补比军北撤造成的缺口
  （ellis_1953 ch.11，confidence: **high**）。
- **上午** —— Gort 与 Pownall 前往 Blanchard 司令部，得知法方**已取消**向南反攻计划
  （命令于前一日午夜前发出，未及送达 Gort）。Blanchard 第 30 号作战命令要求
  「第一集团军、BEF 与比利时军队应逐步在 **Aa 运河、Lys、Canal de Dérivation** 一线后方重新集结，
  以形成一个**掩护敦刻尔克的桥头堡**。此桥头堡应**不存退意**地坚守」
  （ellis_1953 ch.11 引 Blanchard 第 30 号作战命令全文，confidence: **high**）。
  → 这意味着「向敦刻尔克撤退」在 5 月 26 日上午已是**英法共同的正式决定**，
  而非英军单方面抛弃盟友。
- **上午** —— 英国陆军部电令 Gort：「你现在的唯一任务是**尽可能多地把部队撤往英国**」
  （ellis_1953 ch.11 引 Eden 电报，confidence: **high**）。
  → 这是「政治决定」的精确落点。注意 Ellis 表述为「in case smallest doubt」，
  即该电是**消除歧义**用的，此前已有授权。
- **全天** —— 英国各地教堂举行祈祷；威斯敏斯特大教堂举行由乔治六世出席的特别礼拜，
  坎特伯雷大主教为「我们在法国身处险境的士兵」祈祷。当日被宣布为**全国祈祷日**
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → 可作战役「政治/气氛」事件。
- **全天** —— 第 2 师为保持走廊畅通付出重大代价，被削弱至**旅级规模**，但成功；
  第 1、3、4、42 师当日沿走廊撤出，法国第一集团军约三分之一亦撤出
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。

**Dynamo 启动（本战役最关键的单一时刻）**

- **15:00** —— **在收到正式命令之前**，personnel vessels（人员运输船）已开始从多佛派往敦刻尔克。
  两船每四小时一班的节奏已与 BEF 商定；首船于 **22:30** 返回多佛，卸下 **1,312** 人
  （dynamo_despatch §1，confidence: **high**）。
- **18:57** —— **英国海军部下令「发电机行动开始」（Operation "Dynamo" is to commence）**。
  这是本战役的 `start` 时刻。Ramsay 战报原文：
  「Admiralty ordered Operation "Dynamo" to commence at **1857**.」
  （dynamo_despatch §1，confidence: **high** —— 一手档案，时刻精确到分）。
  → Ellis 的表述为「在这个星期日晚间，5 月 26 日，**将近七点**之前，海军部发出了那道
  影响整场战争进程的信号」（ellis_1953 ch.11，confidence: **high**）。
  两者一致，**18:57 可放心引用**。
  → **不确定**：维基称「刚过 19:00 丘吉尔下令启动 Dynamo」（wiki:Dunkirk_evacuation）——
  这与 18:57 的海军部命令**不完全一致**（下令主体不同：海军部 vs 丘吉尔）。
  本笔记采信 Ramsay 一手战报，**18:57 为准**；「丘吉尔下令」的说法置信度 **low**。
- **18:57 之后两小时** —— **第一艘船即已驶向敦刻尔克**
  （ellis_1953 ch.12：「the first vessel sailed for Dunkirk two hours after the Admiralty made the signal」，
  confidence: **high**）。
- **当日** —— 此时**已有 28,000 人**（多为非战斗人员与后方勤务部队）离岸
  （wiki:Dunkirk_evacuation，confidence: **medium**）。Ellis 给出的口径为：
  Dynamo 开始前经英船撤出 **26,402 名英军（含 4,992 名伤员）与 1,534 名盟军**
  （ellis_1953 ch.16，confidence: **high**）。
  → 两者接近但不相等，写手择一并注明。
- **当日** —— 初期的计划是**两天内撤出 45,000 人**，之后预计德军将阻断撤退
  （dynamo_despatch §10，ellis_1953 ch.12，confidence: **high**）。
- **整个 26 日** —— 只有 **4,247 人**在英港口上岸（dynamo_despatch App.II，confidence: **high**）。
  → 其中 2,287 人由人员运输船运出。

**海军组织**

- **13:45** —— S.N.O.（敦刻尔克高级海军军官）Tennant 上校率**12 名军官、160 名水兵**的
  海军海滩与码头分队，乘 **HMS Wolfhound** 离开多佛
  （dynamo_despatch §4，confidence: **high**）。
- **16:00–18:00** —— Wolfhound 在驶往敦刻尔克途中遭俯冲轰炸机**每半小时一次**的攻击
  （dynamo_despatch §4，confidence: **high**）。
- **当日晚** —— SNO Dunkirk 抵埠后立即报告：
  「港口整日被炸，正在燃烧。**只能从港东侧海滩 A.B.C.D. 登船**。把所有船只与客船派往该处锚泊。」
  发报时刻 **20:05/27**（dynamo_despatch §8，confidence: **high**）。
  → **注意**：该电文的时间戳为 2005/27，即 **27 日 20:05**，而非 26 日。
  Ramsay 战报中该段确实排在「Monday, 27th May」项下。写手若做「26 日港口被毁」事件，
  请勿把此电文挂到 26 日。
- **当日** —— Ramsay 手上**只有 4 艘比利时客船**和 Dover 司令部的海军小艇（漂网渔船、摩托艇）。
  唯一能直接从海滩载人的是来自 Ramsgate 的摩托艇
  （dynamo_despatch §2，confidence: **high**）。

**空军**

- **当日** —— Fighter Command 奉命自 05:00 至天黑尽可能连续覆盖敦刻尔克空域，
  16 个中队参与，多数中队当日出动两到三次（ellis_1953 ch.12，confidence: **high**）。
- **当日** —— 约 **200 架次**出动，英方损失 **6 架**；德方战时日志称自身损失 37 架、伤 7 架，
  其中大部分在敦刻尔克地区（ellis_1953 ch.11，confidence: **medium**，
  因德方数字来自其自身战时日志的自报）。
- **当日** —— 德军把**第 13 号指令**落实为空中行动：两个航空队（Luftflotte 2 与 3）均参与
  （ellis_1953 ch.16，confidence: **high**）。

**加来（Calais）—— 本日结束**

- **05:00** —— 德军炮兵恢复轰击。多支炮兵部队自布洛涅调来，Schaal 可用火炮数量**翻倍**
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **08:00** —— Nicholson 准将向英国报告：士兵精疲力竭，最后一批坦克已被击毁，饮水短缺，
  增援可能已属徒劳，德军已进入城北
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **08:30–09:00** —— 旧城与城堡遭炮兵及**多达 100 架**飞机攻击，随后步兵进攻；
  德军火炮与 **StG 77、StG 2** 又对城堡猛攻三十分钟
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **13:30 前后** —— 德军开始突破；Bastion 11 被占（法国志愿兵弹药耗尽）
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **14:30** —— 德军最终攻占相关据点（wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **15:30** —— 第 1 来复枪旅（1st RB）残部在 Bastion No. 1 周边最后抵抗后被压倒
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **16:00** —— **新防线崩溃**，第 2 国王皇家步枪团（2nd KRRC）接到「各自逃命」命令。
  法军指挥官 Le Tellier 投降（wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
  → **本笔记采信的「加来陷落时刻」= 5 月 26 日 16:00 前后**（范围 15:30–17:00）。
  → **不确定**：Guderian 战后写作称英军在某时刻投降、俘获 20,000 人（含英军人数被抹去）
  （wiki:Siege_of_Calais_(1940)），与英方记载（英军被俘 3,500 人）差距极大。
  **以英方数字为准，Guderian 数字置信度 low。**
  → **与契约冲突**：CONTRACT §11.2 写 `05-26T19:00 加来陷落`，**晚于史料 3 小时**。建议改为 16:00。
- **当夜** —— 法国海军炮手在 **22:30–23:30** 之间破坏大部分火炮并前往码头登船；
  Lambertye 拒绝离开，约 50 名志愿者留下坚守 Bastion 11
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **当日** —— 皇家空军在加来附近出动 **200 架次**，损失 6 架战斗机
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **次日** —— 小型海军船只进入港口，撤出约 **440 人**
  （wiki:Battle_of_France；wiki:Siege_of_Calais_(1940)，confidence: **medium**）。

---

### 1.2 5 月 27 日（星期一）—— 第一个完整撤退日；东防波堤被发现

**地面战（德军进攻 Axis）**

- **08:00** —— Hoth 集群自 Béthune–La Bassée 地域向东北方向对 Armentières–Lille 发起主攻，
  企图切断法国第一集团军大部（ellis_1953 ch.12，confidence: **high**）。
- **上午** —— Kleist 集群在西北方向推进，目标是进入能炮击敦刻尔克的距离；
  **主攻**在更南面，自 St Omer 指向 Robecq，企图突向 Poperinghe–Kemmel 一线
  与 B 集团军群会师（ellis_1953 ch.12，confidence: **high**）。
- **全天** —— 法军在 Gravelines 以南遭重击，日终被迫后撤；**夜间法军撤出 Gravelines 与 Aa 河**，
  占领沿运河由 **Mardick 经 Spycker 至 Bergues** 的防线。
  **德军由此把对海峡海岸的控制推进到距敦刻尔克四英里以内**，港口及其接近水道进入炮兵射程
  （ellis_1953 ch.12，confidence: **high**）。
  → 这是**本战役德军控制区西界的关键一天**，对应契约 §4 的 `05-27T12:00` 帧（大致吻合）。
- **10:00** —— 德军对 **Cassel** 的主攻自南与东南方向开始，全天持续
  （ellis_1953 ch.12，confidence: **high**）。
- **全天** —— 第 48 师正面：Arneke 遭猛攻，双方伤亡惨重；**Ledringhem** 由第 5 格洛斯特郡团
  坚守至入夜；德军一纵队绕过 **Wormhoudt** 以北
  （ellis_1953 ch.12，confidence: **high**）。
- **19:00** —— **Zuytpeene** 被德军攻占（第 2 格洛斯特郡团一个连被削弱至只剩数人）；
  Bavinchove 亦失守，德军抵达 Cassel 所在糖面包山的西麓，
  从此德军迫击炮可自由覆盖全镇，而其自身被山体等高线遮蔽于英军炮火之外
  （ellis_1953 ch.12，confidence: **high**）。
- **全天** —— 第 48 师在 **Hondegham** 方向：皇家骑炮第 5 团 K 连与第 2 探照灯团一个排苦战终日，
  弹药将尽时由第 1 法夫与福法尔义勇骑兵中队解围。该部属 **Norman 准将的第 1 轻装甲侦察旅**，
  此后数日发挥重要作用（ellis_1953 ch.12，confidence: **high**）。
- **全天** —— 德军以坦克与步兵猛攻 **Hazebrouck**（ellis_1953 ch.12，confidence: **high**）。
- **中午 12:00** —— 德军在 Ypres 以南以**三个师**发起全面进攻，伊珀尔—科米讷运河
  （Ypres–Comines Canal）之战（英方战史称 Battle of Wytschaete）进入最激烈阶段
  （wiki:Battle_of_Dunkirk；wiki:Battle_of_the_Ypres–Comines_Canal，confidence: **high**）。
- **当日** —— 能见度因林地与城镇地形而极差；英军**营级以下无无线电**，电话线已被切断，
  通信极差。德军使用渗透战术（infiltration tactics）楔入英军阵地
  （wiki:Battle_of_Dunkirk 引 Thompson，confidence: **high**）。
- **下午** —— 英军战线被迫后退，南、北两面均被突破逾一英里；
  自下午晚些时候起英军发起一系列反冲击：第 2 卡梅伦团（第 13 旅）在中央，
  第 6 黑卫士团、第 13/18 皇家轻骑兵团、第 1/7 与第 8 皇家沃里克郡团及皇家工兵在更南面
  （wiki:Battle_of_the_Ypres–Comines_Canal，confidence: **high**）。
- **随后** —— 布鲁克自第 1 师借调第 3 掷弹兵卫队与第 2 北斯塔福德郡团，在南部再发起反冲击。
  结果：**德军第 31 步兵师**在中央的进攻被遏止，**第 61 步兵师**在南部几乎被逐回运河一线；
  但北部**德军第 18 步兵师**继续沿伊珀尔南侧推进
  （wiki:Battle_of_the_Ypres–Comines_Canal，confidence: **high**）。
- **当日** —— 英军第 5 师（Franklyn 少将）承受最猛烈攻击。当日 04:00 德军在猛烈炮火、
  迫击炮与机枪火掩护下开始进攻（ellis_1953 ch.13 记 28 日 04:00；
  wiki:Battle_of_Dunkirk 记 27 日中午全面进攻，两者为不同波次，confidence: **high**）。
- **当夜** —— 布鲁克命第 3 师（蒙哥马利）向左延伸战线，从而**腾出第 4 师的第 10、第 11 旅**
  增援 Messines 岭的第 5 师。第 10 旅先到，发现德军已推进到逼近英军野战炮兵阵地之处；
  两个旅合力肃清岭上德军，至 28 日已在 Wytschaete 以东稳固设防
  （wiki:Battle_of_Dunkirk，confidence: **high**）。
- **当日** —— 英军第 50 师一部在 **Poperinghe** 遭空袭。**卢夫特瓦夫对该处交通拥堵
  轰炸了整整两小时，摧毁或瘫痪约 80% 的车辆**；28/29 日夜又有一轮空袭，以照明弹
  与燃烧车辆的火光照明。第 44 师因此丢弃几乎全部火炮与卡车
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **当日** —— 德军第 6 装甲师若在 Poperinghe 攻击第 44 师，很可能将其歼灭并连带切断
  第 3、第 50 师。历史学家 Julian Thompson 称其未这样做「令人震惊」——
  该师被吸引去围攻附近的 **Cassel**（wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → 这是「德军错失战机」系列中最具体的一例，适合做德军侧叙事事件。

**Le Paradis 屠杀（战争罪行）**

- **黎明** —— 武装党卫军「骷髅」师（SS-Division Totenkopf）自 Bois de Paqueaut 出击，
  攻击 **Le Cornet Malo**。英军顽强防守最终被压倒；德军阵亡 4 名军官与 150 名士兵，
  另有 480 名士兵与 18 名军官负伤（wiki:Le_Paradis_massacre，confidence: **high**）。
- **11:30** —— 皇家诺福克团第 2 营与旅部的**最后一次**无线电联络
  （wiki:Le_Paradis_massacre，confidence: **high**）。
- **17:15** —— 被围于 Cornet Farm（Le Paradis 外）的守军**弹药耗尽**。
  SS-Standartenführer Hans Friedemann Götze（骷髅师第 3 团团长）在战斗中阵亡
  （wiki:Le_Paradis_massacre，confidence: **high**）。
- **随后** —— 少校 Lisle Ryder 下令投降。**99 名幸存者**举白旗走出牛棚，
  却向 SS-Hauptsturmführer **Fritz Knöchlein** 的部队投降（并非与其交战的那支）
  （wiki:Le_Paradis_massacre，confidence: **high**）。
- **稍后** —— 俘虏被押至一座谷仓旁排成一列，被两挺机枪扫射；
  Knöchlein 随后令士兵用刺刀刺杀仍有气息者。**仅两人重伤幸存**
  （wiki:Le_Paradis_massacre；ellis_1953 ch.12 记「约一百名皇家诺福克团士兵」，
  confidence: **high**）。
  → Ellis 的叙述：德军**在同一日**的作战被这一暴行「染上污点」，
  并明确指出「这些 SS 部队由纳粹党组建，不属于正规陆军」，
  同时强调「陆军当局虽在事发时即获完整报告，却未予惩处」（ellis_1953 ch.12，confidence: **high**）。
  → **Knöchlein 战后被英国军事法庭判处死刑，1949 年执行**
  （wiki:Le_Paradis_massacre，confidence: **high**）。
  → 建议作为 `category: "atrocity"` 事件，`importance: 2`。

**海军：东防波堤（East Mole）的发现与 27 日的失败**

- **全天** —— 卢夫特瓦夫对敦刻尔克**进行了 12 次空袭**，摧毁大部分城区，
  使船坞与港口危险到无法使用（ellis_1953 ch.12，confidence: **high**）。
- **当日** —— 德机投下 **15,000 枚高爆弹与 30,000 枚燃烧弹**，摧毁油罐、重创港口；
  估计**约 1,000 名平民丧生**，占当时城内剩余人口的三分之一
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— **Tennant 上校判定港口暂时不能使用**，向多佛报告：
  **只有外防波堤与海滩可以使用**，要求立即派出所有可用船只，因为
  「明晚的撤离前景未定」（ellis_1953 ch.12 引 SNO 电文，confidence: **high**）。
  → **这是「东防波堤」成为主通道的起点**：不是因为有人预见到它好用，
  而是因为**港口本身被炸毁了**。
- **后果** —— 关于「港口已停止使用」的消息引发**误传**，称敦刻尔克已落入德军之手，
  警告在各船之间口耳相传，不仅要求避开敦刻尔克，还要求**返回英国**。
  到午夜只有 **7,669 人**上岸，其中约三分之二来自在港口停用前已进港的船只
  （ellis_1953 ch.12，confidence: **high**）。
  → **7,669** 是 Dynamo 第一天的官方数字（dynamo_despatch App.II 亦支持，
  维基表格列为 5 月 27 日总数，confidence: **high**）。
- **全天** —— 被派往海滩的兵力：防空巡洋舰 **HMS Calcutta**、2 艘运输船、**9 艘驱逐舰**、
  4 艘扫雷舰、17 艘漂网渔船，以及少量荷兰 skoots（自荷兰逃出的摩托沿岸船），
  全部被要求用自身小艇从岸上摆渡人员
  （ellis_1953 ch.12；dynamo_despatch §9–10，confidence: **high**）。
- **当日** —— **第一艘驶离多佛的船是武装登船检查船 Mona's Isle**。
  她在一次空袭中靠泊敦刻尔克港，装上 **1,420 人**；离港返航时
  在 Gravelines 与 Les Hemmes 之间被岸炮夹叉，随后遭飞机猛烈扫射。
  抵达多佛（5 月 27 日中午）时船上已有 **23 人死亡、60 人受伤**
  （ellis_1953 ch.12，confidence: **high**）。
  → 极佳的「第一天」叙事素材。
- **当日** —— 5 艘当天上午出发的运输船在法国海岸外被炮击严重，**未能抵达敦刻尔克即空船返回多佛**
  （ellis_1953 ch.12，confidence: **high**）。
- **当日** —— Kalisz 号被 KG 54 击沉（8,000 吨法国海军轮船 —— 记载为 **Aden** 号，
  8,033 GRT，5 月 27 日沉没）
  （wiki:Kampfgeschwader_54；wiki:List_of_ships_involved_in_the_Dunkirk_evacuation，
  confidence: **high**）。
- **当日** —— Ju 87 击沉运兵船 **Côte d'Azur**（法国邮船，在首航前即被炸沉）
  （wiki:Dunkirk_evacuation；dynamo_despatch App.IV，confidence: **high**）。

**航线变更（Route Z → Route Y）**

- **当日** —— 由于加来于 26 日傍晚失守，**Route Z（南路，39 海里）**的船只必须接近到
  距加来数英里处，再向东驶过德军炮台所在海岸，因此**白天不可用**。
  一条**北向替代航线 Route Y（87 海里）**被扫雷后启用，但**航程增加一倍以上**
  （ellis_1953 ch.12，confidence: **high**）。
- **当日** —— Ramsay 报告海军部：多佛—敦刻尔克常规航道在白天因 Les Hemmes 至 Gravelines
  一带岸炮火力而不可行；必须改走 **Zuydecoote Pass**，
  **往返航程由 80 英里增至 172 英里**，整体流量因而放慢。该航道在清扫之前就不得不用
  （dynamo_despatch §3，confidence: **high**）。
- **当日** —— 开始扫雷开辟一条自 **North Goodwin 至 Ruytingen Pass** 再入敦刻尔克锚地的航道，
  **往返航程由 172 英里缩短至 108 英里**
  （dynamo_despatch §3，confidence: **high**）。
  → **这是 Route X 的诞生过程**，写手可用于海军线叙事。

**空军（5 月 27 日）**

- **全天** —— Fighter Command 自 05:00 至天黑尽量连续覆盖；多数中队出动 2–3 次，
  编队规模自 9 架至 20 架不等，几乎总是遭遇远为优势的敌机
  （ellis_1953 ch.12，confidence: **high**）。
- **具体战例** —— 第 74 中队 11 架对德军 10 架轰炸机 + 20 架战斗机；
  第 145 中队 5 架对 12 架轰炸机及大编队战斗机；
  第 601 中队 9 架对 10 架轰炸机 + 20 架战斗机；
  **约 19:00**，第 56 与第 610 中队 20 架与近两倍于己的德军战斗机交战
  （ellis_1953 ch.12，confidence: **high**）。
- **当日** —— **14 架喷火与飓风未能返航**；德方战时日志称当日共损失 **38 架**；
  英方当日昼夜合计损失 **20 架**（ellis_1953 ch.12，confidence: **medium**，
  因德方数字为自报）。
- **当日** —— No. 11 Group 出动 **22 次巡逻、287 架次**，编队最大 20 架
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— 英方宣称击落 38 架，自身损失 14 架
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— 德军损失最重的单位是 **KG 2** 与 **KG 3**；德军共损失 **23 架 Do 17**。
  KG 1 与 KG 4 轰炸海滩与港口（wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— **KG 2 在整个西线战役中最惨的一天就是 5 月 27 日**：
  少校 Werner Kreipe 的 **III./KG 2 在敦刻尔克上空被皇家空军战斗机击落 27 架 Do 17 中的 11 架**
  （wiki:Kampfgeschwader_2，confidence: **high**）。
  → 这是本战役中德军单一单位单日损失最具体的数字，非常适合做空军侧事件。

---

### 1.3 5 月 28 日（星期二）—— 比利时投降；东防波堤正式启用

**比利时投降（本战役最重要的政治时刻之一）**

- **17:00（5 月 27 日）** —— 利奥波德三世决定派副总参谋长 **Olivier Derousseaux 少将**
  前往德军第 18 集团军司令部（wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
- **20:00（5 月 27 日）** —— 比军司令部发出最后一道撤退命令
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **22:00（5 月 27 日）** —— Derousseaux 带回答复：
  「元首要求**无条件放下武器**」（wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
- **23:00（5 月 27 日）** —— 利奥波德在全体参谋支持下接受该要求，
  **同意自 04:00 起停火**（wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
- **04:00（5 月 28 日）** —— **比利时军队投降生效**（布鲁塞尔时间/中欧时间，与 BST 同值）。
  （wiki:Battle_of_the_Lys_(1940)；wiki:German_invasion_of_Belgium_(1940)；
  wiki:Leopold_III_of_Belgium，confidence: **high**）。
- **06:00（5 月 28 日）** —— Roeselare–Ypres 一线的部队**最终收到投降令**，
  该处战斗持续至此时（wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
- **08:00 前后** —— 比军投降的消息对外扩散。**法方反应极为激烈**：
  巴黎的法国总理 Paul Reynaud 谴责利奥波德的投降；
  比利时首相 Hubert Pierlot 通过法国电台宣布国王的决定**违宪**
  （「不仅是军事决定，也是政治决定，而国王未经大臣建议即行事」），
  由此产生 `impossibilité de régner`（无法视事）的法理状态，
  比利时流亡政府（先在巴黎，后迁伦敦）继续抗战
  （wiki:Leopold_III_of_Belgium，confidence: **high**）。
- **11:30** —— 英国下议院：**Roger Keyes 爵士向战时内阁为比利时防御作战作了有力辩护**，
  这使英方的官方反应保持克制
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **medium**）。
- **当日** —— 英方对投降的即时反应并不体面。Gort 愤怒；
  庞纳尔（Pownall，BEF 参谋长）被问及是否撤离比利时人时，据报回答：
  「我们他妈的一点也不在乎比利时人怎么样」（"We don't care a bugger what happens to the Belgians"）
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **low**，单一来源转述，但流传甚广）。
  → 可用于争议条目 §3.5。
- **当日** —— 利奥波德选择**留在比利时**、自请五年软禁。他对政府建议的答复是：
  「我已决定留下。同盟国的事业已经失败。」
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **high**）。
- **当日** —— 英国报纸已开始称其为「叛徒国王」「鼠王」；
  《每日镜报》刊登利奥波德照片，标题「每个女人现在都鄙视的那张脸」
  （wiki:Leopold_III_of_Belgium，confidence: **medium**）。
- **6 月 4 日** —— 丘吉尔在下议院就比利时投降发表著名谴责：
  「他在最后一刻，在我们已经出动之后……突然**未经事先协商、几乎未给通知、
  未听取大臣建议**，以其个人行为派全权代表向德军投降，交出军队并暴露了我们整个侧翼与退路。」
  （wiki:Leopold_III_of_Belgium 引 Hansard 1940-06-04，confidence: **high**）。
  → 同时注意：丘吉尔 1949 年在回忆录中缓和了措辞，
  称「当时我说的那些话已载入记录，经过慎重考虑，我不认为有理由改变……
  所幸这一祸害被避免了，最终一切都好转了。我无需说，
  当时我说的任何话都不能被解释为对利奥波德国王个人勇气或荣誉的指责。」
  （wiki:Leopold_III_of_Belgium，confidence: **high**）。
- **比利时伤亡（10–28 日）** —— 阵亡 **6,093**、负伤 **15,850**、失踪 500 余人；
  被俘约 **200,000** 人，其中 **2,000 人死于囚禁**；损失飞机 112 架
  （wiki:Battle_of_France 引 Ellis 1993 p.255 与 Dear & Foot 2005 p.96，confidence: **high**）。
- **利斯河战役（24–28 日）伤亡** —— 比利时在整场入侵中共 80,000 伤亡，
  其中 **40,000 发生在 5 月 25 至 27 日之间**
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
  → 这是「利斯河战役是比利时 18 天战役中最血腥一役」的依据。

**地面：填补比军缺口**

- **11:00（5 月 28 日）** —— 距比利时投降仅数小时后，**德军先头部队已抵达 Nieuport 与海岸之间的
  桥头堡防线**。第 12 皇家枪骑兵团（负责掩护暴露侧翼）以相当代价击退德军首批巡逻队，
  但当日稍后更多德军抵达防线（ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 英军第 3、第 4、第 50 师被派去填补比军留下的缺口；
  在展开过程中**一头撞上企图迂回 Gort 部队的德军第 256 步兵师**。
  第 12 皇家枪骑兵团的装甲车在 **Nieuwpoort** 城内阻止了德军
  （wiki:Battle_of_Dunkirk，confidence: **high**）。
- **当日** —— 桥头堡全线混乱交战。英军指挥与控制「瓦解」，
  德军把防线向内压向敦刻尔克（wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **当日** —— 德军在 **Nieuport** 夺占一座未被炸毁的桥梁并建立小型桥头堡，
  但当日后续所有攻击均被击退（ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 比利时投降使 **La Panne 海滩** 很快将处于德军炮火之下。
  布鲁克下令第 4 师尽速进入桥头堡；但第 10、第 11 旅已配属给大为削弱的第 5 师，
  只有第 12 旅可立即行动，且要到 **29 日晨**才能到达，其接防亦须等到夜间
  ——因为运河旁的开阔平地在白昼无法实施换防。
  **第 4 师当夜接防 Wulpen 至 Nieuport Bains 一线**
  （ellis_1953 ch.13，confidence: **high**）。
- **04:00 起** —— 英军第 5 师（Franklyn）继续在 Warneton–St Eloi 一线承受猛攻。
  第 3 掷弹兵卫队与第 2 北斯塔福德郡团在炮兵与机枪支援下整日苦战、寸土不让。
  战斗于漫长的白昼结束后，第 5 师两个旅各只剩约 **600 人**
  （ellis_1953 ch.13，confidence: **high**）。
  → 极具体的「消耗」数字，适合做英军侧事件。
- **当夜** —— 第 5 师按计划撤至 **Yser** 一线，第 42 师在此与之会合；
  第 50 师撤向自 Poperinghe 向东北的一线，第 3 师右翼相应后摆
  （ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 法军第 2 轻机械化师（2e DLM）已移至 **Loo 运河**之后；
  自布鲁日附近开来的**法军第 60 步兵师在 Yser 河的河曲中被击溃**，
  残部由第 2 轻机械化师与英军（据守 Furnes–Nieuport 运河）收拢
  （ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 德军第 3、第 4、第 7 装甲师与摩托化「骷髅」师在攻击英军第 2 师；
  第 44 师当面是德军第 8 装甲师、第 6 装甲师一部与摩托化「维京」师。
  均属 A 集团军群第 4 集团军的 Kleist 与 Hoth 集群
  （ellis_1953 ch.12，confidence: **high**）。
  → 这些是**德军装甲师在敦刻尔克战役窗口内的实际位置**，写手应据此摆放 5 月 28 日轨迹。
- **当日** —— 德军 XXXXI 摩托化军战时日志：
  「每一处阵地都爆发激战——尤其在每个村庄、甚至每栋房屋内。
  因此本军在东向或东北方向都未能取得显著进展。人员与装备伤亡惨重。
  敌军作战顽强，**战至最后一人仍坚守岗位**；若被炮火逐出一处阵地，
  他们很快又在另一处出现继续战斗。敌军炮兵似有极佳观察。」
  （ellis_1953 ch.12 引 XXXXI 军 KTB，confidence: **high**）。
- **当日** —— 德国 XXXIX 摩托化军（Hoth 集群）结论：
  「正如所料，被迫在运河南岸停留两天，在 5 月 27 日产生了两个结果：
  （1）部队在跨越 La Bassée 运河进攻时伤亡相当大，该运河已被敌军顽强设防；
  （2）已无时间有效拦截自 Lille 地区向西逃往海峡的英法部队洪流。」
  （ellis_1953 ch.12 引 XXXIX 军 KTB，confidence: **high**）。
  → **这是德方自己对「停止前进令」代价的最直接评估**，争议条目 §3.1 必引。

**海军：东防波堤正式投入**

- **凌晨** —— **Tennant 上校请求派船进入防波堤**：该防波堤**在前一夜被发现
  可以作为港口码头的实用替代品**（ellis_1953 ch.13，confidence: **high**）。
  → **本笔记采信的「东防波堤价值被发现」时刻 = 5 月 27 日夜（27/28 夜）**。
  → **不确定**：维基称 Tennant「最初下令从海滩撤离，当发现太慢后，
  改道至两道石砌与混凝土防波堤（东、西防波堤）以及海滩」，
  但**未给出具体时刻**（wiki:Dunkirk_evacuation，confidence: **medium**）。
  → 维基另称克劳斯顿（Clouston）于 5 月 27 日在多佛「抽签赢得东防波堤」（wiki:James_Campbell_Clouston，
  confidence: **medium**）。三条来源一致指向 27 日，可放心用「5 月 27 日夜 — 28 日凌晨」表述。
- **当日** —— 驱逐舰 **Mackay、Montrose、Vimy、Worcester、Sabre、Anthony** 全部进港靠泊，
  装走大量人员；其他舰只在海滩装载（ellis_1953 ch.13，confidence: **high**）。
- **07:09** —— SNO Dunkirk 请求「所有船只都到敦刻尔克来」。Ramsay **不能接受**此请求，
  因为**必须同时维持海滩与港口的装载**，且敦刻尔克受制于
  「沿东防波堤通往登船点的**狭窄跳板所造成的瓶颈**」
  （dynamo_despatch §23，confidence: **high**）。
  → **这是东防波堤「瓶颈」性质的最权威一手描述**，工程细节见 §4.2。
- **07:00** —— SNO Dunkirk 报告港口登船速率达**每小时 2,000 人**
  （dynamo_despatch §24，confidence: **high**）。
- **09:30** —— 延迟的人员运输船开始自敦刻尔克返回，全天持续不断
  （dynamo_despatch §25，confidence: **high**）。
- **15:55** —— Ramsay 以电报向 SNO Dunkirk 传达当夜撤离计划：
  **东码头（East Pier）**使用 3 艘医院船、7 艘人员运输船与 2 艘驱逐舰；
  海滩方面（La Panne 至敦刻尔克以东 1.5 英里）分配约 20 艘驱逐舰、
  19 艘明轮与舰队扫雷舰、17 艘漂网渔船、20–40 艘 skoots、5 艘沿岸船、
  12 艘摩托艇、2 艘拖船、28 艘划艇与救生艇；驱逐舰实施连续往返
  （dynamo_despatch §16，confidence: **high**）。
  → **注意**：Ramsay 战报中该泊位通篇写作 **East Pier（东码头）**，
  与 **East Mole（东防波堤）** 指同一构筑物。写手在文案中如用「东防波堤」，
  英文对应可用 East Mole / East Pier 并注明。
- **当日** —— 由于人员运输船白天停用，须增加夜间在敦刻尔克港内处理的量；
  Ramsay 询问 SNO 能否让人员运输船**靠泊港内**——他手上唯一的资料显示
  **「港口入口的东码头是此类船只唯一合适的泊位，且英军士兵可以从那里上船」**
  （dynamo_despatch §17，confidence: **high**）。
- **当日** —— **HMS Windsor** 在南 Goodwin 灯船附近遭 **15 架轰炸机在 10 架战斗机掩护下**攻击，
  重创，**30 人伤亡**（ellis_1953 ch.13，confidence: **high**）。
- **当日** —— **Brighton Belle** 载 350 名士兵返航，在规避空袭时撞上 Gull 灯浮标附近的沉船残骸，
  沉没；船员与所载士兵均被附近船只救起，**无人员损失**
  （ellis_1953 ch.13，confidence: **high**）。
- **当夜 / 早间** —— **Queen of the Channel** 被炸沉（dynamo_despatch §12，
  载于 28 日凌晨条目，confidence: **high**）；**Maid of Orleans** 等数船被炸伤或炮伤
  （ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 由于上述损失，决定**人员在运输船不再于白昼全时段使用**，
  只有军舰或较小船只继续连续使用（ellis_1953 ch.13，confidence: **high**）。
  → 这是「夜航」阶段的开端，早于契约所写的 6 月 1 日。
- **当日** —— 两艘漂网渔船 **Boy Roy** 与 **Paxton** 被炸至必须抢滩；
  一艘 skoot 被击中后弃船。这些荷兰船**载有陆军急需的弹药、食品与饮水**
  （ellis_1953 ch.13，confidence: **high**）。
- **当日** —— **海滩严重缺水**。水面与食物直到**两天后**才送达 Malo 海滩
  （ellis_1953 ch.13，confidence: **high**）。
  → 与 5 月 29 日 Mona's Queen 号「装载水罐驶往敦刻尔克」的记载互相印证（见 §1.4）。
- **当日** —— 医院船 **Isle of Thanet** 在 27 日下午被加来炮台炮击受损
  （dynamo_despatch §12，confidence: **high**）。
- **当日** —— **一次空袭**中 6 艘 skoots 在距海岸约 10 英里处被一艘返航 skoot 告知
  「敦刻尔克已落入德军之手、撤退已停止」，因而折返，**延误超过 24 小时**
  （dynamo_despatch §109，confidence: **high**）。
  → 与 27 日的误传相呼应，可做「谣言」主题事件。

**空军（5 月 28 日）**

- **全天** —— 德国轰炸机主力**大部分被用于攻击撤退中的敌军**，故当日对敦刻尔克的空中干扰较少
  （ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 空军参谋长要求各作战司令部「今日作出最大努力，援助陆军与海军的同袍」；
  Fighter Command 奉命「自拂晓至天黑以连续的大编队巡逻确保敦刻尔克海滩
  （两侧各三英里）的掩护」。但由于兵力不足，实际只能以**双中队规模**巡逻，
  间隔比前一日（单中队）略长（ellis_1953 ch.13，confidence: **high**）。
- **当日** —— **321 架次**出动，**创当时单日纪录**。第 213、229、242、616 中队各出动三次，
  其余多数两次（ellis_1953 ch.13，confidence: **high**）。
- **当日** —— 英军损失 **13 架战斗机**；德方战时日志称损失 22 架、伤 6 架
  （ellis_1953 ch.13，confidence: **medium**）。
- **当日** —— 维基给出的数字为「**11 次巡逻、321 架次**，宣称击落 23 架，损失 13 架」，
  与 Ellis 的 321 架次/13 架损失一致，宣称数不同（23 vs Ellis 未给）
  （wiki:Dunkirk_evacuation，confidence: **high** 之于 321 与 13）。
- **当日** —— SNO Dunkirk 当日结束时电告：
  **「战斗机掩护极其宝贵……轰炸只是零星发生」**
  （ellis_1953 ch.13，confidence: **high**）。
  → 这是对「RAF 什么都没做」这一士兵怨言的最有力反证。
- **当日** —— 卢夫特瓦夫在敦刻尔克上空的出击减少，注意力转向比利时港口
  **Ostend 与 Nieuwpoort**；敦刻尔克上空天气不利于俯冲与低空轰炸
  （wiki:Dunkirk_evacuation，confidence: **medium**）。

---

### 1.4 5 月 29 日（星期三）—— 最血腥的海军日；Wakeful / Grafton / Grenade

**夜间的连环沉没（本笔记最精确的一组时刻）**

- **23:00（5 月 28 日）** —— **HMS Wakeful** 在 **Bray 海滩**装完部队后，
  经 **Zuydecoote Pass 与北航道（North Channel）** 驶往多佛。
  接近 **Kwinte Whistle 浮标**时航速 20 节，开始**每四分钟转向 40 度**的之字航行
  （dynamo_despatch §27，confidence: **high**）。
- **00:45（5 月 29 日）** —— **两条鱼雷航迹被观察到，一条未中，另一条命中舯部。
  Wakeful 断为两半，两段在 15 秒内沉没**，各自以舯部着于浅底、
  舰首舰尾高高翘出水面。**船上所有部队随舰沉没**；部分舰员浮出水面
  （dynamo_despatch §27，confidence: **high** —— 时刻精确到分）。
  → 攻击者：德军 **E-boat（S-boat）S-30**（wiki:HMS_Wakeful；
  wiki:Dunkirk_evacuation 引 Atkin 1990 pp.170–71，confidence: **high**）。
  → **伤亡**：**640 名盟军部队中仅 5 人幸存**
  —— 皇家工兵上尉 Brian Leslie Lynch Abdy Collins、皇家工兵工兵 Michael Frazer、
  皇家陆军勤务团的 Stanley Patrick 与 H.F.R. Ruddell、
  皇家坦克团的 James "Jim" Kane —— **另有 25 名舰员幸存**
  （wiki:HMS_Wakeful_(H88)，confidence: **high**）。
  → **不确定**：Ellis 记 Wakeful 载 **650** 人（ellis_1953 ch.14），
  维基记 **640** 人（wiki:HMS_Wakeful）。**范围 640–650，写手择一并注明。**
- **约 30 分钟后** —— 摩托漂网渔船 **Nautilus** 与 **Comfort** 抵达并开始救起幸存者；
  随后扫雷舰 **Gossamer**（载 420 名自敦刻尔克撤出的部队）加入救援
  （dynamo_despatch §27；ellis_1953 ch.14，confidence: **high**）。
- **稍后** —— **HMS Grafton**（载 800 名部队）与漂网渔船 **Lydd**（载 300 人）抵达。
  两者均放下小艇搜寻 Wakeful 的幸存者。此刻距鱼雷攻击已过去**两小时**，
  天仍很黑（ellis_1953 ch.14，confidence: **high**）。
- **02:50** —— **Grafton 被鱼雷命中**。Ramsay 战报原文：
  「就在那一刻，**0250**，GRAFTON 被鱼雷击中，COMFORT 被掀起在空中，
  WAKEFUL 的舰长被抛入海中。」
  （dynamo_despatch §27，confidence: **high** —— 时刻精确到分）。
  → 攻击者：**德国潜艇 U-62**（wiki:HMS_Grafton；wiki:Dunkirk_evacuation 引 English 1993 p.95）。
  → **不确定（重要矛盾）**：**Ellis 官方战史写的是 U-69**：
  「后来得知 Grafton 是被敌潜艇 **U.69** 击沉的」（ellis_1953 ch.14）。
  维基采信 **U-62**。**两者矛盾，无法裁决。写手请写「U-62（一作 U-69）」。**
  → Grafton 被命中舰尾，引发二次爆炸损伤舰桥，**舰长（Commander G. E. Pechell 级职）当场阵亡**，
  另有一名军官、**13 名水兵与食品部经理**阵亡。舰体折断但仍漂浮足够久，
  全部幸存者由驱逐舰 **Ivanhoe** 与运输船 **Malines** 救起。
  Ivanhoe 以舰炮击沉 Grafton（wiki:HMS_Grafton_(H89)，confidence: **high**）。
- **同一时刻** —— **Comfort** 被爆炸掀起，Wakeful 的舰长**第二次**被抛入海中。
  Comfort 全速转弯时，**Lydd 与 Grafton 误以为她是敌舰而向其开火**；
  据信 **Comfort 全体船员除一人外、以及 Wakeful 幸存者除四人外全部死亡**。
  Lydd 随后撞沉 Comfort（dynamo_despatch §27，confidence: **high**）。
  → Ellis 版本：Lydd 撞沉 Comfort，**只有一名 Comfort 船员与四名自 Wakeful 救起的士兵幸存**
  （ellis_1953 ch.14，confidence: **high**）。
- **05:00 后 / 天亮时** —— Wakeful 的舰长**第二次**被救起时已在水中游泳 **5 小时**
  —— 自其本舰被命中算起（ellis_1953 ch.14，confidence: **high**）。
  → 这是一段极具冲击力的细节：**舰长亲历本舰被雷、被抛入海、被友舰误击、
  再被抛入海，五小时后生还**。

**白天的海军与空袭**

- **05:30** —— **SS Mona's Queen** 号（马恩岛汽船公司，CAPT. Holkham 指挥）
  自多佛满载**水罐**驶往敦刻尔克（因海滩部队严重缺水），
  在敦刻尔克港外触**磁性水雷**，**两分钟内沉没**
  （wiki:SS_Mona's_Queen_(1934)，confidence: **high**）。
  → 该船此前战绩：首航（5 月 27 日夜）即带回 **1,200 名士兵**；
  5 月 28 日在法国海岸外遭岸炮射击但未受损
  （wiki:SS_Mona's_Queen_(1934)，confidence: **high**）。
  → 与 5 月 28 日「缺水」记录、5 月 28 日 skoot 载水被击中的记录**互相印证**。
- **上午** —— **HMS Jaguar、Gallant、Grenade** 经新中航道（Route X）派往敦刻尔克，
  以**试探岸炮反应**，为把该航道作为长北航道的替代方案做准备。
  **Grenade 抵达敦刻尔克，报告岸炮未开火，但遭猛烈轰炸**
  （dynamo_despatch §28，confidence: **high**）。
- **约 12:00** —— 三艘驱逐舰在接近敦刻尔克时遭俯冲轰炸机攻击，
  **Gallant 受损**。至少实施六次攻击；**一架敌机被舰炮击落**，其余被战斗机击落
  （dynamo_despatch §28，confidence: **high**）。
- **约 13:00** —— HMS Malcolm 报告敦刻尔克遭大量飞机猛烈轰炸；
  下午轰炸延伸至 Bray 外海的船只（dynamo_despatch §28，confidence: **high**）。
- **下午** —— **Route X 对驱逐舰开放**，但小船仍走北航道经 Zuydecoote Pass
  （dynamo_despatch §28，confidence: **high**）。
- **中午前后** —— **Nieuport 附近的德军岸炮开始间歇炮击 Zuydecoote Pass**；
  局势正朝着「新中航道成为唯一可行的白昼接近敦刻尔克与海滩的路线」发展
  （dynamo_despatch §28，confidence: **high**）。
- **12:00** —— **HMS Calcutta** 得以靠上 La Panne 海滩用小艇接人，
  **自各扫雷舰上接下 1,200 名部队**，随后驶往 Sheerness；扫雷舰留下继续装载
  （dynamo_despatch §28，confidence: **high**）。
- **16:00** —— **对东防波堤（East Mole Pier）的大规模空袭开始**，
  以俯冲轰炸为主，**连续持续两个多小时**。同时 Bray 外海船只亦遭攻击。
  攻击间断持续到 **20:00** 之后，目标不仅包括敦刻尔克，
  还包括 Bray 外海船只、Zuydecoote Pass 内的船只以及 Route X 南端的船只
  （dynamo_despatch §30，confidence: **high** —— 时刻精确到小时级）。
  → Ellis 版本：**「约下午三点半开始，持续到约八点，四次升到高潮」**
  （ellis_1953 ch.14，confidence: **high**）。
  → **两条来源差半小时（15:30 vs 16:00）。写手可写「15:30–16:00 之间开始，
  持续至 20:00 前后」。**
- **16:00 时东防波堤的泊位实况（最详细的一手清单）** ——
  **内侧（inner side of the Eastern Arm）**：驱逐舰 **Grenade** 与 **Jaguar**；
  其前方 3 艘拖网渔船；再前方 3 艘拖网渔船，之后是 **Canterbury**；
  Canterbury 之前还有一艘法国驱逐舰。
  **外侧（outside of the Eastern Arm）**：运输船 **Fenella** 与 Grenade、Jaguar 相对；
  **Crested Eagle** 与那 6 艘拖网渔船相对。
  此外 **Malcolm** 与 **Verity** 也在港内
  （dynamo_despatch §30，confidence: **high**）。
  → Ellis 补充：外侧另有客船 **Fenella** 与 **Crested Eagle**；
  **共 11 艘英船靠在防波堤旁**（ellis_1953 ch.14，confidence: **high**）。
- **当日下午的结果（Ellis 的一手清单）** ——
  11 艘英船中，**Grenade、Fenella、Crested Eagle、Polly Johnson、Calvi**
  受损严重，当即或不久后沉没；**Jaguar 与 Canterbury** 虽返回本土，
  但**此后再不能参与 Dynamo**。
  **18:00 时港内只剩下燃烧与下沉中的船只**。
  一份报告送达 Ramsay 称入口已被堵塞，一段时间内所有船只被引向海滩——
  **但这是误报**，经过艰苦努力所有沉船均被移出航道
  （ellis_1953 ch.14，confidence: **high**）。
  → **「18:00 港口只剩燃烧与沉没的船只」是本日最强的画面素材。**
- **同日下午（海滩与外海）** —— 驱逐舰 **Gallant、Greyhound、Intrepid、Saladin**
  与护卫舰 **Bideford** 均受重创；客船 **Normania** 与 **Lorina** 沉没；
  商船 **Clan Macalister**（自英国运来 8 艘突击登陆艇）与武装登船检查船
  **King Orry** 沉没，另有许多较小船只沉没或受损
  （ellis_1953 ch.14，confidence: **high**）。
- **Gracie Fields 号（明轮扫雷舰）的完整故事** —— 载约 **750** 名自 La Panne 海滩上船的部队，
  启程返航后不久**舯部中弹**。上层甲板被蒸汽笼罩，**引擎无法停车**，
  舵卡在一定角度上，于是以约 **6 节**速度**原地打转**。
  两艘 schuyts 仍冒险靠上，尽可能多地接下部队。
  随后扫雷舰 **Pangbourne** 抵达——她在 Bray 海滩装人时已被近失弹
  **两侧夹击，13 人阵亡、11 人受伤，罗经被打坏**——仍靠上 Gracie Fields 又接下 **80** 人。
  此后由另一艘返航船引导，Pangbourne 拖带 Gracie Fields 再次启程返英。
  **在次日凌晨的黑暗中 Gracie Fields 开始下沉**，Pangbourne 砍断拖缆并接下其船员。
  该舰被弃，但船员与他们自海滩运来的部队都安全抵英
  （ellis_1953 ch.14，confidence: **high**）。
  → 维基对 Gracie Fields 的记载不同：称其「被直接命中、起火、**伤亡惨重**地沉没」
  （wiki:Dunkirk_evacuation，confidence: **low**）。
  **Ellis 的版本更详细且明确指出船员与部队安全抵英，本笔记采信 Ellis。**
- **当日** —— 维基另记：**两艘拖网渔船在空袭中「粉碎」（disintegrated）**；
  **客轮在码头沉没，船上 600 人但全部下船**；
  **明轮汽船被直接命中、起火、伤亡惨重地沉没**；
  **两艘铁路公司所属船只被毁**
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— 五次德军大规模空袭中**只有两次**遭到皇家空军战斗机抗击；
  英军出动 9 次巡逻，损失 **16 架战斗机**。
  德军损失 **11 架 Ju 87 被击落或击伤**
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— Ellis 的一手统计：**16 个中队参战，损失 19 架战斗机**；
  各中队宣称击落大量敌机，但卢夫特瓦夫当日**只承认损失 18 架**；
  另一方面德方（错误地）宣称击落英机 **68 架**
  （ellis_1953 ch.14，confidence: **high**）。
  → **「19 架 vs 16 架」的来源差异已在上面注明。**
- **当日** —— Ellis 对空战评价的总结（可用于文案）：
  「敌人的攻击**无法被阻止**，因为他的兵力远多于与他作战的中队。
  但他的攻击被干扰、被打散到如此程度，以致**他未能达成意图**。
  他既不能削弱陆军防御，也不能阻止海军的行动。」
  （ellis_1953 ch.14，confidence: **high**）。
- **当日** —— Vice-Admiral Dover 向 Fighter Command 发电：
  「高级海军军官的报告称**你的协助极为宝贵**。我对你出色的配合深表感激。
  仅此一点就给了我们成功的机会……」
  （ellis_1953 ch.14，confidence: **high**）。
  → 可用于「RAF 是否被误解」的争议条目 §3.6（本笔记新增条目）。
- **当日** —— 两个遭炮击的驱逐舰 **Montrose** 与 **Mackay** 分别因碰撞与搁浅受损；
  **Mona's Queen** 触磁性水雷爆炸（ellis_1953 ch.14，confidence: **high**）。
  → 关于水雷：Ellis 指出「敌方飞机此时正在多佛与敦刻尔克的接近水域布设磁性水雷」，
  整个撤退期间**只有另一艘船**因同样原因被毁
  （ellis_1953 ch.14，confidence: **high**）。
- **当日** —— 皇家海军当日以舰炮击落敌机 **4 架**（dynamo_despatch App.III，confidence: **high**）。
- **当日** —— **47,310 人抵英**（dynamo_despatch App.II 记 50,331；维基表记 47,310）。
  **Ramsay 战报 §93 亦称「47,310 人在午夜前登岸英国」**
  （dynamo_despatch §「If the previous records...」段，confidence: **high**）。
  → **两个数字（47,310 与 50,331）分属「登船」与「抵英」口径，见 §2.9。**
- **当日** —— **驱逐舰损失导致海军部撤走 8 艘最优秀的驱逐舰**用于本土防御
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— 法方首次有部队经英舰撤出：**655 人**（dynamo_despatch App.IV，confidence: **high**）。

---

### 1.5 5 月 30 日（星期四）—— 最大规模海滩撤离日；卡塞尔陷落前夕

**地面战**

- **中午 12:00 前** —— **几乎全部撤退中的英军部队均进入桥头堡周界**，敌军紧逼四周。
  自此全部焦点集中在敦刻尔克桥头堡
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 桥头堡守军构成：**I 军**负责英军防区西半部（敦刻尔克至法国边界）；
  **II 军**负责东半部（边界至 Nieuport 海岸）；**III 军**正前往海滩撤离或已回国。
  但地图无法显示的是：**图上任何一师都不完整，全部大幅减员**。
  I 军的第 1 师缺三个营（被调去支援 II 军在伊珀尔方向的战斗）；
  第 42 师只有第 126 旅尚能作战；第 46 师自开战以来只有 6 个营真正归 Gort 指挥。
  第 2 师只剩第 5 旅拼成的一个混成连。
  II 军的第 5 与第 23 师已无力再战，部分营仅余一个正常连的兵力
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是「敦刻尔克守军实际兵力」的最权威描述，写手务必引用。**
- **当日** —— 德军报告：「桥头堡由英军据守，他们**极为顽固地反击**」
  （ellis_1953 ch.15 引德军战时日志，confidence: **high**）。
- **当日** —— 许多地方地面浸水，守军**无法挖掘工事**，因而部分单位在炮击中伤亡惨重
  （ellis_1953 ch.15，confidence: **high**）。
  → 这是「佛兰德低地」地形对防御影响的关键证据，见 §4。
- **当日** —— 德军当日只作**一次**认真的突破尝试：
  炮火准备后试图在 **Furnes（弗尔讷）以北**越过运河，
  该处由第 3 师第 7 近卫旅与第 8 旅据守。攻击被击退，
  但第 4 皇家伯克郡团（此时约相当一个连）伤亡惨重，
  一个第 1 冷溪近卫团连被派去接管其部分阵地
  （ellis_1953 ch.15，confidence: **high**）。
- **约 22:00** —— 德军再次进攻并**成功越过运河**。
  但冷溪近卫团反冲击，把他们逐回对岸，恢复战线
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 德军指挥层的混乱：5 月 29 日 A 集团军群战时日志记第 4 集团军
  「因敌军极为顽固的抵抗」而进展甚微。第 4 集团军询问能否**经 Bergues 以机动兵力**
  攻击敦刻尔克，但因担心重大损失而作罢。
  改令 **Kleist 集群收拢，以便用 10 厘米炮炮击敦刻尔克**
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 第 4 集团军战时日志记载，集团军司令部作战参谋对 Kleist 集群抱怨：
  「这里有印象，**今天什么都没发生，没有人再对敦刻尔克感兴趣**。
  城市与港口必须被炮击，必须阻止登船，**必须制造恐慌**」
  （ellis_1953 ch.15，confidence: **high**）。
  → **注意**：Ellis 将这句话系于 5 月 30 日段落，前引 5 月 25 日条目亦有类似抱怨，
  两者可能为同一则日志的转述与追述。**写手引用时请注明「5 月 25 日 / 30 日记载」并择一。**
- **约 15:00** —— A 集团军群告知第 4 集团军：OKH 已批准对敦刻尔克发起攻击。
  接电军官答复说第 4 集团军准备进攻，但 **B 集团军群的第 6 集团军也必须参加，
  而第 6 集团军显然已撤下去休整了！**
  Rundstedt 的参谋长随后询问第 4 集团军是否知道 Kleist 集群已通知
  Richthofen 的 **VIII 航空军**，他们打算当日下午攻击敦刻尔克。
  答复是此事现已得知；但相反地，Kleist 集群**请求轰炸敦刻尔克**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是德军陆空协同混乱的最佳证据。**
- **随后** —— 第 4 集团军命令 Kleist 集群「从两翼攻击敦刻尔克，直抵海岸，然后继续向东追击」。
  Kleist 集群参谋长答复：**其部队不稳定，因为该地无法使用坦克**。
  他被告知「**依更高层命令，敦刻尔克的登船必须最终被制止**……」。
  第 4 集团军司令亲自介入下令：
  「**所有部队立即开往敦刻尔克以东的海岸**……告诉师长，他**今天必须抵达海岸**。」
  （ellis_1953 ch.15，confidence: **high**）。
- **稍后** —— Kleist 集群报告：其第 20 摩托化师「正向 **Bray Dunes** 推进……
  左翼在 **Bergues** 前方并在 **Gravelines**，在运河上，**无法前进**。
  敦刻尔克的筑垒桥头堡挡在他们面前」
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是第 20 摩托化师在 5 月 30 日的精确位置**，写手可直接用。
- **当日** —— 由于中型炮兵**前一日已耗尽弹药**，德军此时只能用轻炮射击敦刻尔克
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是「德军炮兵为何迟迟不能压制港口」的关键后勤原因。**
- **当日** —— **指挥关系重大变更**：对敦刻尔克的全部作战行动改归 B 集团军群的
  **第 18 集团军（von Küchler）** 指挥。其下辖 **IX、X、XIV、XXVI 军**，
  含第 **14、18、56、216、254、256 步兵师**，加上正在开来的第 **61 步兵师**；
  另有第 **9、11 摩托化旅**、摩托化「大德意志」团，
  以及作为预备队的第 **20 摩托化师**与 **SS「阿道夫·希特勒」团**。
  **交接于 5 月 31 日 02:00 生效**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是本战役德军 OOB 最权威的一手段落，写手应据此校正 CONTRACT §5.1。**
- **当日** —— A 集团军群自此不再对敦刻尔克攻击负有责任；**Rundstedt 如愿以偿**。
  他的真实任务在其部队抵达海岸、切断英军交通线、夺取海峡港口时即已完成。
  此后他的方针是**为即将到来的南向攻势保存装甲部队**——
  这一方针「经希特勒确认，但陆军总司令 Brauchitsch 与其自己的下属指挥官起初都不喜欢」。
  Ellis 的评断：虽然 Rundstedt 未能在 Gort 调回部队防守之前攻击运河线
  （即 BEF 后方）**显然是错失了一个机会**，
  但此后**不把他的装甲部队用于攻击敦刻尔克，是稳健而合乎军人本分的方针**。
  理由：沼泽地形不适合装甲；不到一周他就必须准备越过 Somme–Aisne 线向南进攻；
  而且**他已损失近百分之五十的装甲兵力**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是官方战史对争议条目 §3.1 的核心判断，权威性极高。**
- **当日** —— **Cassel 守军**：撤退休命令**直到 29 日晨六点**才送达守军指挥官，
  此时该镇已被包围、德军在两翼深度突入，白天无法移动。
  稍后与第 48 师师部恢复无线电联络，接令**坚守至入夜再撤**
  （ellis_1953 ch.14，confidence: **high**）。
  → **注意**：这段在 Ellis 中属第 14 章（29 日）。Cassel 的撤离在 **29 日 21:30**：
  「该部于**九点半**开始行动」（ellis_1953 ch.14，confidence: **high**）。
- **29 日 21:30** —— Cassel 守军以第 4 牛津郡与白金汉郡轻步兵团为前卫，
  其后是旅部、炮兵与工兵，再后是第 2 格洛斯特郡团，
  最后是两个步兵营的混合 carrier 排与第 1 东约克郡义勇骑兵团残部组成后卫。
  **出发后不久前导部队即遭遇敌军**。天亮后一连串战斗导致各单位失散，
  随着白昼推移，许多人阵亡、负伤或被零散俘虏。
  **只有少数人抵达敦刻尔克**
  （ellis_1953 ch.14，confidence: **high**）。
- **当日** —— Ellis 对 Cassel 据守的评价：该镇位于五条重要公路交汇处，
  包括这一翼通往敦刻尔克的主干道。**在整个最关键的日子里，它阻止了敌军使用该路，
  并迫使相当规模的兵力集中在一场徒劳的攻取上。**
  通过在整个 29 日牵制大量敌军，Cassel 守军帮助削弱了敌军对正撤向海岸的
  英军侧翼的攻击（ellis_1953 ch.14，confidence: **high**）。
- **当日** —— 德军第 6 装甲师**围攻 Cassel** 而未能歼灭 Poperinghe 的第 44 师
  （见 §1.2）。
- **当日** —— 第 44 师残部于**上午 10 点前**分成两路纵队出发，
  虽遭炮击但未被纠缠；大幅减员后于次日抵达海滩登船
  （ellis_1953 ch.14，confidence: **high**）。

**海军（5 月 30 日）**

- **里程碑** —— **这是整个行动中唯一一天「海滩上船人数（29,512）多于港口（24,311）」**
  （ellis_1953 ch.15，confidence: **high**；维基表格一致）。
- **当日** —— 另有 **15 艘法国船只**抵达并进入敦刻尔克：
  2 艘驱逐舰、3 艘鱼雷艇、2 艘扫雷舰、4 艘拖网渔船、1 艘拖船与 3 艘渔船
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 一艘海军军官架起**扩音器**，向缓慢沿防波堤移动的部队喊话：
  「**想想你们的弟兄，孩子们，你们越快上船，就能多救他们一些人！**」
  部队闻言**开始小跑，并沿整个东臂持续了两个多小时，在这段时间内登船逾 15,000 人**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是东防波堤「流速管理」的最佳例证，可作为事件文案。**
- **当日** —— 有军官认为「那天早上错失了一个大好机会，
  因为雾与低能见度限制了敌方活动」
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 敦刻尔克有 7 艘驱逐舰、1 艘客船与 3 艘漂网渔船抵达东防波堤岸端
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 航运损失**小得多，只有 2 艘驱逐舰受损**
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— **53,823 人**在午夜前安全抵英，为**迄今单日最高**
  （ellis_1953 ch.15；dynamo_despatch App.II 记 53,227，confidence: **high**）。
- **至 5 月 30 日午夜累计** —— **126,606 人**抵英；
  其中 **77,412 人来自港口，49,194 人来自海滩**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这两个累计数字非常重要，写手可用作 5 月 30 日帧的「进度条」。**

**空军（5 月 30 日）**

- **当日** —— 云层与低能见度使空中作战极为困难；Fighter Command 以**三或四个中队规模**
  频繁巡逻，遇到的所有敌轰炸机均被驱离
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 英军布伦海姆轰炸机轰炸敦刻尔克以南的德军部队；
  夜间威灵顿轰炸机试图干扰德军向敦刻尔克的运动，但受恶劣天气限制
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— **9 次巡逻，未遭遇德军编队**（wiki:Dunkirk_evacuation，confidence: **medium**）。
- **当日** —— 卢夫特瓦夫击沉 1 艘运输船、击伤 12 艘，自身损失 **17 架**；
  英方宣称击落 38 架（有争议）。**皇家空军与舰队航空兵损失 28 架**
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
  → **不确定**：Ellis 将「德方军需总监承认损失 17 架（毁与伤）；
  卢夫特瓦夫报告只损失 1 架喷火，但英方各型飞机（含轰炸机）当日实际损失 28 架」
  系于第 15 章（涵盖 30 与 31 日）的靠后位置，**具体归属 30 日还是 31 日存疑**
  （ellis_1953 ch.15，confidence: **low** 之于日期归属）。
  **写手如使用 28 架这一数字，请写「5 月 30–31 日」并注明日期归属不确定。**
- **当日** —— 卢夫特瓦夫当日出击次数少（wiki 与 Ellis 一致），
  原因是天气不佳与机组疲惫（halder_diary 5 月 24 日已指出卢夫特瓦夫依赖天气、
  机组在两周战斗后已疲惫 —— wiki:Dunkirk_evacuation，confidence: **medium**）。

---

### 1.6 5 月 31 日（星期五）—— Gort 离岸；里尔口袋投降；单日最高纪录

**地面战**

- **02:00** —— 第 18 集团军对敦刻尔克的指挥权交接**正式生效**
  （ellis_1953 ch.15，confidence: **high**）。
- **凌晨** —— 德军在 **Nieuport** 几乎突破。情势危急到
  **两名英军营长亲自操作一挺布伦机枪，一名上校射击、另一名装弹**
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **数小时后** —— 英军在 **Furnes（弗尔讷）** 附近溃退。
  第 3 师第 2 冷溪近卫营急调增援。近卫团**枪毙了一些逃跑的士兵**，
  并用刺刀把其他人挡了回去，恢复了秩序。英军返回阵地，击退德军进攻
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → **「枪毙逃兵」这一细节来源单一，置信度 low–medium，若使用请注明。**
- **下午** —— 德军在 **Bulskamp** 附近运河处突破周界，
  但运河对岸的沼泽地面与**达勒姆轻步兵团**的零星火力阻止了他们
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **入夜** —— 德军在 **Nieuwpoort** 集结准备再次进攻。
  **18 架皇家空军轰炸机**在德军仍在集结时发现他们，
  以一次准确轰炸将其驱散（wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → Ellis 版本：**傍晚**，舰队航空兵 6 架 **Albacore** 与 **18 架布伦海姆**轰炸
  Nieuport 的德军及其后方集结部队。敌军集结被打破，
  在第 4 师撤往海滩之前未再发起进攻
  （ellis_1953 ch.15，confidence: **high**）。
  → **「18 架布伦海姆 + 6 架 Albacore」是更精确的编成，建议采用。**
- **当日** —— 冯·屈希勒（von Küchler）接掌敦刻尔克全部德军。他的计划很简单：
  **6 月 1 日 11:00 全线发起总攻**。
  奇怪的是，冯·屈希勒**忽略了一份无线电截获**，
  该截获显示英军正放弃战线东端、向敦刻尔克本身撤退
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → **「6 月 1 日 11:00 总攻」是德军侧最关键的单一时刻，写手务必使用。**
- **当日** —— 冯·屈希勒的计划与 Ellis 记载的第 18 集团军 OOB 一致（见 §1.5）。
- **当夜（5 月 31 日/6 月 1 日）** —— **Marcus Ervine-Andrews 上尉**
  （第 1 东兰开夏团，第 1 步兵师）赢得维多利亚十字勋章：
  其连队奉命防守「一片 1,000 码见方的地域」，在黎明德军越过
  **Canal de Bergues** 进攻时，他带志愿者冲上一座谷仓屋顶，
  用步枪射杀 **17 名**敌军，又用布伦机枪射杀更多。
  谷仓被击毁起火后，他把伤员送往后方，并率剩余 **8 人**撤回。
  勋章公告于 **1940 年 7 月 30 日**在 London Gazette 增刊发表
  （wiki:Marcus_Ervine-Andrews；ellis_1953 ch.16，confidence: **high**）。
  → Ellis 记其获勋的战况为「the 1st East Lancashire Regiment could not prevent
  some of the enemy from crossing the canal, but they were stopped from making progress
  till the East Lancashire had retired to the Canal des Chats」
  （ellis_1953 ch.16，confidence: **high**）。
  → **这是本战役仅有的英军 VC 之一，适合做高 `importance` 事件。**
- **当日** —— **里尔口袋（Lille pocket）**：法军第 4 军与第 5 军（约 **40,000 人**）
  被四个德军步兵师加三个装甲师围攻。
  Molinié 将军与第 15 摩托化步兵师（Juin 指挥）自 5 月 28 日起在里尔郊区**逐屋战斗**
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **5 月 29 日** —— 法国第 15 摩托化步兵师（15e DIM）投降
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **5 月 31 日/6 月 1 日午夜（周五/周六）** —— 因食物与弹药将尽，
  **Molinié 与 Aizier 上校谈判投降，敌对行动于午夜结束**。
  **Molinié、另一名将军与约 35,000 名部队在里尔大广场（Grand Place）向德军投降**
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **投降时** —— 德军指挥官 **Alfred Wäger 将军**允许法军**享有战争荣誉（honours of war）**：
  守军列队通过大广场，德军士兵立正致敬。
  **Wäger 因此受到申斥**
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
  → **里尔守军是 1940 年战役中唯一被授予战争荣誉的守军**，
  也是两次世界大战中德国仅授予此荣誉的两支法国守军之一
  （另一支是 1916 年凡尔登的 Fort Vaux 守军）
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **当日** —— 里尔口袋的俘虏数字：维基信息框记 **约 34,957 人**被俘、
  300 门炮、100 辆装甲车辆（wiki:Siege_of_Lille_(1940)，confidence: **high**）。
  Lloyd Clark（2016）记「七名将军、若干[数字被抹去]与[数字被抹去]车辆」。
  正文另称「Molinié、另一名将军与 35,000 名部队」（wiki:Siege_of_Lille_(1940)）。
  → **不确定**：**34,957 / 35,000 / 40,000（四舍五入的军级建制数）/ 「4 万余人」**
  四种口径并存。**建议写手写「约 35,000 人（一说 34,957）」并注明。**
- **契约对照** —— CONTRACT §4 `05-31T12:00` 帧注「里尔法军 35,000 人投降（荣誉受降）」。
  **时刻应为 5 月 31 日/6 月 1 日午夜，而非 12:00。** 建议把该事件的 `at`
  改为 `1940-06-01T00:00`，或在前一帧之后另加事件。
- **当日** —— 里尔口袋的意义：**丘吉尔**称里尔防御是「卓越的贡献」，
  使德军推进迟滞四天，让 BEF 得以自敦刻尔克逃脱；
  **Shirer** 称其「帮助被围的英法部队在港口周围多坚守两到三天，
  从而至少多救出 100,000 人」
  （wiki:Siege_of_Lille_(1940)，confidence: **medium**，属后世评价）。
  → **这是「法军殿后救了英军」这一争议条目 §3.3 的关键论据。**
- **当日** —— **Gort 移交指挥权，由 Alexander 少将接掌殿后部队**
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → Gort 的具体离岸时刻**来源未给到分钟**。
  Ellis 记 Gort 的司令部于 **5 月 28 日下午**抵达 La Panne
  （ellis_1953 ch.14，confidence: **high**）；
  维基记 Gort 于 **5 月 31 日**与 68,014 人一同撤离
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **5 月 28 日下午** —— **Gort 的司令部抵达 La Panne**，并发布命令规定撤离顺序：
  **III 军第一，II 军第二，I 军承担殿后之荣誉**
  （ellis_1953 ch.14，confidence: **high**）。
  → **这是「撤离优先权」的最权威一手依据，争议条目 §3.3 必引。**
- **当日** —— Ellis 指出：原先「或许能撤出 45,000 人」的预期，
  已转变为「BEF 大部分可以撤出」的日益增长的希望。
  因此海军的任务从「迅速撤出一部分」扩展为
  「持续努力把全军带回家」
  （ellis_1953 ch.14，confidence: **high**）。
- **当日** —— Gort 收到国王乔治六世的慰问电，并即向部队颁布；
  Gort 复电致谢（ellis_1953 ch.14，confidence: **high**）。
- **当日深夜** —— Gort 收到首相的**私人**电文：
  「如果你与我们的一切通信被切断，且在你判断中敦刻尔克与海滩的一切撤退
  在每一次重新打开的努力失败之后已最终被阻止，
  **那么你将成为判断何时不再能对敌人造成进一步损害的唯一裁决者**。
  H.M.G. 确信英国陆军的声誉在你手中是安全的。」
  （ellis_1953 ch.14，confidence: **high**）。
  → **这是一份极具分量的「授权自行决定投降」电文，是本战役最被低估的文件之一。**
- **当日下午** —— 在英政府决定「尽可能撤出 BEF」并通知法国最高统帅部**三天之后**，
  **Weygand 将军才授权尽可能撤出法国第一集团军**。
  此时 Dynamo 已进行至 26 日以来，**已有 70,000 余名英军登船**
  （ellis_1953 ch.14，confidence: **high**）。
  → **「70,000 英军先于法军获授权」是争议条目 §3.3 最硬的数据。**
- **当日下午** —— 4 艘法国鱼雷艇与 2 艘法国扫雷舰抵达协助法军登船，
  随后数日更多法国船只抵达（ellis_1953 ch.14，confidence: **high**）。
- **当日** —— Weygand 电报经 Howard-Vyse 使团送达英国陆军部，
  要求**四到五个英国师**参加敦刻尔克防御。此要求含义不明
  （ellis_1953 ch.15，confidence: **high**）。
- **当日上午** —— 海滩作业因**向岸风与恶劣海况**几乎不可能；
  报告称敌军炮火使在近海或防船坞旁久留都变得危险
  （ellis_1953 ch.15，confidence: **high**）。
- **11:00 前后** —— 因上述海况，**客船派遣暂停至天黑**；
  但作为补偿，小艇此时已数以百计地抵达
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— 在东部桥头堡被放弃之前，**La Panne** 形势变得严峻：
  待撤人员远多于可载船只，敌军对海滩与海上船只的炮火稳步增强。
  经商定，**La Panne 剩余的约 6,000 人步行前往敦刻尔克**
  （ellis_1953 ch.15，confidence: **high**）。
  → Ellis 的注脚极具画面感：「该师官兵不会忘记**沿松散沙滩的十英里跋涉**，
  尽管他们感激地记得，当跋涉在（至少是敦刻尔克的）防波堤上结束时，
  他们登上了那些船」（ellis_1953 ch.15，confidence: **high**）。
  → **「十英里沙滩行军」是极佳的事件文案素材。**
- **当日** —— **68,014 人在午夜前抵英——整个行动中单日最高数字**
  （ellis_1953 ch.15；dynamo_despatch App.II 记 64,141，confidence: **high**）。
- **当日** —— Ellis 记录了一处「好运」的轶事：
  「我们在一艘驶入敦刻尔克途中被炸沉的汽船上交了好运，
  由于水很浅她只下沉了几英尺，还很体贴地保持直立。
  在一个最糟糕的日子里，当对防波堤与接近防波堤的船只进行非常密集的俯冲轰炸时，
  **对这艘搁在沙洲上的废船进行了不下 24 次攻击**。
  我们估计**她为国家节省了约一百万英镑的船运**。」
  （ellis_1953 ch.15，confidence: **high**）。
- **当日** —— Ellis 的重要总结：**整个撤退期间天气晴好、海面平静；
  只有三天海上起了小浪，使海滩小艇作业困难、一度完全不可能。
  如果天气恶劣、海面汹涌，「敦刻尔克」很可能作为一场巨大悲剧被记住。**
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是「敦刻尔克奇迹」中「天气」这一常被忽略因素的最权威陈述。**
- **当日** —— 皇家海军当日以舰炮击落敌机 **11 架**，为 5 月 27 日以来最高
  （dynamo_despatch App.III，confidence: **high**）。
- **当日** —— 法军经英舰撤出数跃升至 **14,874 人**（dynamo_despatch App.IV，confidence: **high**）。

---

### 1.7 6 月 1 日（星期六）—— 最惨重的海军损失；昼间撤离的终章

**总体态势**

- **当日晨** —— **BEF 约 39,000 人**仍在收缩后的英军防区内
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 法军据守西面一个缩小的防区，其部队与英军在 **Bergues 运河**会合。
  英军自此据守桥头堡的南面，而东面沿法国边境至海岸，此时由**法国第 12 摩托化步兵师**
  据守，**英军第 50 师**在其后方支援。其他法军部队位于
  英军 **Bergues–Furnes 运河**防线后方的中间阵地
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 法军约 **50,000 人**在防御阵地上；另有 **80,000 人**已在沙丘中集结待撤，
  其中 **30,000 人**已经上船。此后统计认为还有约 **20,000 人**
  分散在小股部队中，未计入法方统计
  （ellis_1953 ch.16，confidence: **high**）。
  → **这是桥头堡法军兵力的最权威分解，写手务必引用。**
- **当日** —— Alexander 与 Abrial 海军上将会商。Abrial 认为可以进一步收缩桥头堡，
  并守住一条自 **Bergues 经 Uxem、Ghyvelde 至 Basse Plaine**、
  再沿法国边境至海岸的防线（即上文「中间阵地」）。
  **Alexander 认为此提议不可行**：海军与军事形势的危险每小时都在增加；
  如此进一步收缩，所守之线将离敦刻尔克与海滩太近，
  敌军的近距炮火将使继续撤离变得不可能。
  他认为英军殿后部队**还能守住现阵地二十四小时（但不能再多）**，
  因此提议在**即将到来的 6 月 1 日/2 日夜间**完成全部剩余部队的撤离
  （ellis_1953 ch.16，confidence: **high**）。
  → **这是「6 月 1 日夜是英军最后机会」这一判断的原始依据。**
- **当日** —— Abrial 把两种对立意见报告 Weygand，Alexander 则报告英国陆军大臣。
  **陆军大臣答复**：「你应尽快撤出你的部队，与法军**五十五十地对等**，
  目标是在 **6 月 1 日/2 日夜间**完成。**你必须把这一明确指示告知法方。**」
  （ellis_1953 ch.16，confidence: **high**）。
  → **「50–50」是英方对「抛下法军」指控的正式书面回应，争议条目 §3.3 必引。**
- **当日** —— Abrial 在见到该电文后同意：**英军现有防线守至 6 月 1 日午夜**，
  之后部队在黑暗掩护下撤往海滩。同时法军继续撤离，
  并由法军据守他所指的中间阵地（**Uxem–Ghyvelde–Basse Plaine**），
  英军可经此撤退，只留下高射炮、反坦克炮与无法撤走的人员
  （ellis_1953 ch.16，confidence: **high**）。
- **事后评估** —— Ellis 的判断：Alexander 认为中间阵地守不住的看法，
  源于他「知道英军所剩无几」且「不了解法军还有多少可用」。
  实际结果是**法军又战斗了约两天，击退德军进攻，
  使约 10,000 名英军与约 70,000 名法军得以撤往英国**。
  因此 Alexander **低估了可以坚守的时间**，
  但他把前方阵地多守了二十四小时、迟滞了德军对中间阵地的进攻
  （ellis_1953 ch.16，confidence: **high**）。
  → **「10,000 英军 + 70,000 法军」是法军殿后价值的量化，争议条目 §3.3 核心。**

**地面战（6 月 1 日）**

- **全天** —— 英军在其「运河上的最后一天」苦战。炮击与迫击炮轰击不停，
  各单位伤亡惨重（ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 德军主攻方向为 **Bergues** 与 **Hoymille**（第 46 师防区），
  以及第 1 师正面的 **1st East Lancashire、2nd Coldstream Guards、
  1st Duke of Wellington's** 各团防区
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— **Hoymille**：攻击穿透第 2 沃里克郡团一个连的正面。
  按旅部命令，其右翼的 **1st Loyals** 撤出 Bergues 城本身，
  退至该镇北郊的运河一线（ellis_1953 ch.16，confidence: **high**）。
- **15:00 前后** —— 英军自该处对已越过运河（在沃里克郡团阵地）的德军实施反冲击。
  地面因放水而浸透，只能缓慢移动；敌军机枪火力猛烈。
  **反冲击失败，各连于 17:00 回到出发线**
  （ellis_1953 ch.16，confidence: **high**）。
- **17:30** —— Loyal 团团长不满意，下令以「更凌厉的行动」再次进攻。
  这一次**把敌人逐退，并在运河岸上重建了战线**
  （ellis_1953 ch.16，confidence: **high**）。
- **更东面** —— **1st East Lancashire Regiment** 未能阻止部分敌军越过运河，
  但敌军未能取得进展，直到东兰开夏团撤至 **Canal des Chats**
  （ellis_1953 ch.16，confidence: **high**）。
- **当夜** —— 英军全部撤至法军据守的中间阵地之后。**至 6 月 2 日晨，
  他们已全部抵达海岸准备撤离**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 冷溪近卫团未遭攻击，守住运河上的原战线，两翼后折（refused）。
  其右翼的第 5 边境团亦撤至 Canal des Chats，
  左翼的第 1 威灵顿公爵团因激战被迫退至附近堤坝之后
  （ellis_1953 ch.16，confidence: **high**）。
- **11:00** —— 冯·屈希勒计划的全线总攻时刻（wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → **本笔记未找到该总攻实际发起或被取消的明确记载。置信度 medium，请写手注明。**

**海军：本日最惨重的损失**

- **04:00 后** —— 敌军空袭自**凌晨四点过后不久**开始
  —— 事实上敌机整夜都在试图轰炸使用港口的船只
  （ellis_1953 ch.16，confidence: **high**）。
- **05:00** —— 自敦刻尔克至 La Panne 的**整个区域**爆发猛烈轰炸与机枪扫射
  （dynamo_despatch §64，confidence: **high**）。
- **05:00 后** —— 英军第一个巡逻编队奉命在五点后到达该空域，**一到达便陷入激战**
  （ellis_1953 ch.16，confidence: **high**）。
- **06:00、09:00、10:00、11:00 稍后** —— 后续巡逻相继抵达，**全部卷入战斗**
  （ellis_1953 ch.16，confidence: **high**）。
- **08:30–09:00** —— **第二轮大规模空袭**，几乎每艘在海岸外的船只都遭密集轰炸与扫射，
  观察到**编队规模达 30 架与 40 架**
  （dynamo_despatch §64，confidence: **high**）。
- **在此期间** —— **HMS Basilisk** 在 La Panne 外海被打瘫，后在挣扎返航途中沉没；
  **HMS Keith、HMS Salamander 与 HMS Skipjack** 在沿海岸西移时遭猛烈轰炸
  （Bray 与 La Panne 海滩此时已被清空），**Keith 被击中起火，Skipjack 沉没。
  Keith 被弃舰，最终沉没。Keith 上几乎所有部队与两舰舰员均被其他船只救起**
  （dynamo_despatch §64，confidence: **high**）。
- **09:45** —— **HMS Keith 沉没**（wiki:HMS_Keith，confidence: **high**）。
  → 经过：**第一次攻击打坏其舵机**；随后一次攻击**一枚炸弹沿后烟囱落下，
  在 2 号锅炉舱内爆炸**，杀死舱内所有人并引发火灾。
  全舰失去动力，抛锚，下达弃舰令。
  **三名军官与 33 名水兵阵亡；八名军官与 123 名水兵获救**
  （wiki:HMS_Keith，confidence: **high**）。
  → Keith 是 **Rear-Admiral Wake-Walker 的旗舰**
  （ellis_1953 ch.16；wiki:HMS_Keith，confidence: **high**）。
  → **这是本战役中救援比例最高的一艘沉舰：阵亡 36 人 / 获救 131 人。**
- **约 12:00** —— **HMS Basilisk 被第三次攻击击沉于浅水中**
  （wiki:HMS_Basilisk_(H11)，confidence: **high**）。
  → 经过：6 月 1 日晨返回 La Panne 装载部队，遭德军轰炸机**三次攻击**。
  **第一波中一枚炸弹在 3 号锅炉舱内爆炸，杀死全部锅炉与机舱人员，
  使蒸汽管路破裂，全部机械失效**；同一次攻击的近失弹
  使舰体侧面与上甲板扭曲。为减轻上部重量，**抛弃了鱼雷与深水炸弹**。
  法国渔船 **Jolie Mascotte** 试图拖带，第二次攻击使法船放弃拖带。
  **第三次攻击约在中午**将 Basilisk 击沉于浅水中，
  位置 **51°08′N 2°18′E**。Jolie Mascotte 与驱逐舰 **Whitehall**
  救起 **8 名军官与 123 名水兵**。Whitehall 随后以舰炮与鱼雷摧毁残骸
  （wiki:HMS_Basilisk_(H11)，confidence: **high**）。
- **当日晨** —— **HMS Havant** 已装载 500 名部队，随后靠上**当日上午被德军俯冲轰炸机
  打瘫的驱逐舰 Ivanhoe**，把 Ivanhoe 上全部部队与伤员接下，
  在猛烈空袭下驶往多佛。**不久后 Stuka 以两枚炸弹命中 Havant 的机舱，
  第三枚在其舰体下方爆炸。8 名舰员阵亡、25 人负伤，至少 25 名士兵阵亡。**
  舰体严重受损，拖带失败后由扫雷舰**自沉**
  （wiki:HMS_Havant_(H32)，confidence: **high**）。
  → Havant 自 5 月 29 日加入 Dynamo 至 6 月 1 日**共救出逾 2,300 人**
  （wiki:HMS_Havant_(H32)，confidence: **high**）。
- **10:00–10:40** —— **第三次空袭自敦刻尔克上空开始，并沿 Route X 向外延伸很远**，
  发生于此时段内，**中午又恢复**
  （dynamo_despatch §64，confidence: **high**）。
- **中午** —— 日间活动中段双方空中活动出现**沉寂**
  （ellis_1953 ch.16，confidence: **high**）。
- **15:00 后不久** —— 英军巡逻编队再次投入战斗，**海岸司令部的巡逻队介入协助**
  （ellis_1953 ch.16，confidence: **high**）。
- **15:50** —— **又一轮空袭针对敦刻尔克港及其内全部船只，持续半个多小时**
  （dynamo_despatch §64，confidence: **high**）。
- **16:00** —— 英军飞机发现敌军正在发起新的攻击，**海岸司令部巡逻队再次加入战斗**
  （ellis_1953 ch.16，confidence: **high**）。
- **17:00、18:00、20:00 后不久** —— 另有三批巡逻编队全部与敌交战，
  此后能见度下降，空中作战减少
  （ellis_1953 ch.16，confidence: **high**）。
- **18:00** —— Vice-Admiral 收到敦刻尔克如下电报：
  「**船只这里的形势变得非常棘手；自 05:30 起已有超过 100 架轰炸机攻击这里的船只，
  伤亡很多。已指示白天不得有船只出航。因此运输船的撤离于 0300 停止。
  如果周界守得住，将于明天（星期日）夜完成撤离，包括大部分法国人。将军同意。**」
  （dynamo_despatch §64，confidence: **high** —— 电文全文，极重要）。
  → **「自 05:30 起超过 100 架轰炸机」是本日空袭强度的最硬数字。**
- **当日下午** —— 除空袭规模外，**Route X 在 5 号浮标附近遭岸炮射击，海上交通被严重打断**。
  炮火看来准确，据信有若干法国船只被击沉。
  两艘在该海域的法国驱逐舰**拦停了自英国经 X 航道驶来的英舰**，
  显然对白昼撤离构成了非常严重的威胁
  （dynamo_despatch §65，confidence: **high**）。
- **中午后不久** —— Nore 总司令提请海军部注意当日驱逐舰伤亡不断上升，
  **建议白天停止在法国海岸外使用驱逐舰**
  （dynamo_despatch §65，confidence: **high**）。
- **当日下午** —— 上述种种情形的汇总，导致**海军部指示 Vice-Admiral Dover
  于 6 月 2 日（星期日）07:00 停止敦刻尔克的撤离**，并于
  **当夜或 6 月 2 日 17:30** 视情况恢复。
  **因此 6 月 2 日 07:00 至 17:30 之间将无船驶往敦刻尔克**
  （dynamo_despatch §65，confidence: **high**）。
  → **这是「昼间撤离停止」的准确时刻。契约 §11.2 写 `06-01T12:00` 与此冲突，建议更正。**
- **当日** —— 尽管有敌军行动，**24 小时内仍有逾 60,000 名部队在英国登岸**
  （dynamo_despatch §66，confidence: **high**）。
  → **其中海军舰只承担了 70% 的运输量**
  （dynamo_despatch §66，confidence: **high**）。
- **当日** —— Ramsay 报告：**多数幸存船只已不间断运作至少五天，
  官兵已接近完全精疲力竭的状态**
  （dynamo_despatch §66，confidence: **high**）。
- **当日** —— 敌方**岸炮首次以 10 厘米炮**对敦刻尔克构成威胁（见 §1.5）；
  桥头堡收缩使敌军可把炮火移到能覆盖港口、海滩与海上接近水道的阵地
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 沉没或重创的船只（Ellis 的一手清单）：
  **驱逐舰领舰 Keith（挂 Wake-Walker 少将旗）、驱逐舰 Basilisk 与 Havant、
  扫雷舰 Skipjack（载有大量部队）、法国 Foudroyant、
  客船 Brighton Queen 与 Scotia（均满载法国士兵）全部沉没；
  Prague（载 3,000 名部队）与许多其他船只严重受损**
  （ellis_1953 ch.16，confidence: **high**）。
  → **BNS「Brighton Queen」与「Scotia」的伤亡细节**：
  Brighton Queen 沉没时船上约有 **700 名法国与摩洛哥部队**；
  扫雷舰 **Saltash** 救起约 **400 名幸存者**，并报告：
  「法国部队表现得沉着而明智，尽管**其中近一半人在爆炸中阵亡**。」
  Scotia 被命中时船上有约 **2,000 名法国部队**，被**至少四枚炸弹**击中；
  驱逐舰 **Esk** 自敦刻尔克驶出接走近 **1,000 人**，
  **Worcester** 与小艇又救起许多。
  但 **28 名船员与 200–300 名部队丧生**。
  **两船共约 2,700 人，约 2,100 人获救**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— **Skipjack** 的悲剧：她已在 **Malo 海滩**装载部队**三个多小时**，
  持续遭轰炸与机枪扫射，**船上约 275 人几乎全部在下层甲板掩护**。
  **船沉时他们没有任何逃生的机会，只有少数幸存者被附近两艘船救起**
  （ellis_1953 ch.16，confidence: **high**）。
  → Ellis 的评断：「由此产生一个信念：**在被其他船只救起的船上，
  人员损失的比例要大得多。**」
  （原文为「a large proportion of the men on ships which were saved by others and brought
  to England」，语义略有歧义；本笔记按上下文理解为
  「Skipjack 这类被炸沉、需他人救援的船，生还比例反而更低」，
  confidence: **medium** 之于该句释读）
- **当日** —— 英军当日 **64,429 人**抵英，其中 **47,081 人来自港口，17,348 人来自海滩**。
  **这是整个行动中第二高的单日数字**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 皇家空军当日**损失 31 架飞机**；
  但**德方回执承认损失 10 架战斗机与 19 架轰炸机，
  另有 13 架严重受损——即当日共有 42 架敌机被击落或失去战斗力**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 皇家空军出动**八次战斗机扫荡，每次三到四个中队**；
  海岸司令部在北 Goodwin 与法国海岸之间巡逻。
  但由于**无人能预知敌军攻击的时机，不可避免存在我方飞机不在该空域的时刻**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 皇家海军当日以舰炮击落敌机 **13 架**，为整个行动最高
  （dynamo_despatch App.III，confidence: **high**）。
  → **行动全程舰炮击落敌机 35 架（另 21 架重伤但未见确定坠毁）**，
  分日：27 日 4、28 日 3、29 日 4、30 日 0（飞行条件恶劣，敌机活动少）、
  31 日 11、6 月 1 日 13（dynamo_despatch App.III，confidence: **high**）。
- **当日** —— 法军经英舰撤出数达 **35,013 人**，为整个行动最高
  （dynamo_despatch App.IV，confidence: **high**）。
  → **这印证了「6 月 1 日是法军撤离的高峰日」。
- **当日** —— 医院船方面的最后努力失败：
  **10:30** 敦刻尔克以明文发出紧急请求：
  「伤员情况危急，医院船应在白天进入。相信日内瓦公约会得到光荣遵守，
  敌方会克制不攻击。」
  Ramsay 决定派出两艘医院船：**Worthing 于 13:00 出航，Paris 于 17:00 出航**。
  **14:40**，反潜巡逻队以无线电话报告 Worthing 在横渡海峡约三分之二处**正遭轰炸**。
  她返回英国，报告遭 **12 架容克飞机**攻击；无人员伤亡，
  但船板开裂并有轻微损伤，须回港加油。
  **19:15** Paris 报告遭轰炸、重创、引擎失效，位置与 Worthing 遭袭处相同；
  **19:47** 发出 SOS。拖船被派往援助。
  **最后一次以医院船自敦刻尔克撤离伤员的尝试就此化为乌有。
  Paris 随后于午夜稍后在法国海岸外 10 英里的 W 浮标处沉没。**
  （dynamo_despatch §80，confidence: **high**）。
  → **这是本笔记中最完整、最具悲剧张力的一段一手续事，强烈建议做成事件。**

---

### 1.8 6 月 2 日（星期日）—— 夜航；英军殿后部队离岸

- **0200** —— 一份来自 **LYDD**（在敦刻尔克海滩外）的电报被收到：
  「**准将告诉我，总司令说殿后 BEF 必须从（防波堤以东的）海滩登船，
  因为防波堤上法军拥塞。防波堤上仍有相当数量的英军部队。
  军方预计还有更多人到那里。殿后部队预计 0230 前抵达海滩。**」
  Vice-Admiral 据此命令所有已知在敦刻尔克港外的船只
  尽力从海滩接走殿后部队，必要时留在 0300 之后。
  **由于在途与加密的时间损耗，担心这份电报只能送达很少仍在海岸的船只**
  ——除非它们已自行决定在原先规定的 0300 撤离时刻之后留下
  （dynamo_despatch §76，confidence: **high**）。
  → **「英军殿后部队改从海滩而非防波堤登船」是 6 月 2 日凌晨的关键调整。
- **0200** —— **海军部授权把自敦刻尔克港以驱逐舰进行的撤离延长至 0700**，
  运输船（另有规定）
  （dynamo_despatch §76，confidence: **high**）。
- **0700** —— **海军部指示的撤离暂停生效**。6 月 2 日 07:00 至 17:30 之间无船前往敦刻尔克
  （dynamo_despatch §65，confidence: **high**）。
- **6 月 2 日凌晨至 0300** —— 前一夜的撤离持续进行；
  **I 军许多在夜间抵达海滩的人员得以撤出**。
  **但 Ramsay 停止了白昼撤离，以避免重演前一日的损失**
  （ellis_1953 ch.16，confidence: **high**）。
  → **契约 §11.2 写 `06-01T12:00 昼间撤离停止`，实际时刻为 6 月 2 日 07:00。**
- **当日** —— 据守中间阵地的法军在多处遭攻击，
  其右翼虽被击退，但反冲击暂时阻止了敌军前进
  （ellis_1953 ch.16，confidence: **high**）。
- **当日** —— 一支**海军爆破分队**对港口设施实施爆破，
  并安排好在最后一次撤离后封锁港口入口
  （ellis_1953 ch.16，confidence: **high**）。
- **当夜（预期为最后一夜）** —— 行动计划经过精心筹划。
  **横渡海峡的行动约于 17:00 开始**（dynamo_despatch §81 记 **17:00**），
  派出 **11 艘驱逐舰、13 艘客船**，另有扫雷舰、漂网渔船、skoots 与大量小艇，
  并加入法国与比利时分队
  （ellis_1953 ch.16，confidence: **high**）。
  → **Ramsay 战报给出的编成为**：**13 艘人员运输船、2 艘大型补给运输船、
  11 艘驱逐舰（原文写作 "ix destroyers"，OCR 存疑）、5 艘明轮扫雷舰、
  9 艘舰队扫雷舰、1 艘特种勤务船、9 艘漂网渔船、6 艘 skoots、2 艘武装游艇、
  1 艘炮艇，以及大量拖船、救生艇等**，或以有组织拖带、或自由前往。
  **法方编成不详，据信为 6 艘小型驱逐舰、4 艘 avisos 与约 120 艘渔船**
  （dynamo_despatch §81，confidence: **high** 之于清单，
  **low** 之于「11 艘驱逐舰」的 OCR 读法）。
  → **不确定**：Ellis 记 11 艘驱逐舰，Ramsay 战报 OCR 作 "ix"（9 或 11）。
  **写手请写「约 9–11 艘驱逐舰」。**
- **当夜** —— **Rear-Admiral Wake-Walker 在一艘摩托艇上于港内指挥船只**；
  **Tennant 上校——他在所有这些艰苦日子里一直担任敦刻尔克高级海军军官
  ——在岸上指挥作业**
  （ellis_1953 ch.16，confidence: **high**）。
- **当夜** —— 船只抵达后装载迅速，接走了夜间抵达港口或海滩的全部人员；
  **但前来的法国部队比预计的少，许多被派去接运他们的船只空载返航**
  （ellis_1953 ch.16，confidence: **high**）。
- **6 月 3 日凌晨** —— 撤离持续。**当大约三点钟天亮、当夜行动结束时，
  已没有更多英军部队需要运走**
  （ellis_1953 ch.16，confidence: **high**）。
- **6 月 3 日凌晨（数小时内）** —— **Alexander 将军与 Tennant 上校本人乘船驶往英国**
  （ellis_1953 ch.16，confidence: **high**）。
  → **不确定**：维基称 **6 月 3 日 10:50，Tennant 向 Ramsay 发信号
  「行动完成。正返回多佛」**（wiki:Battle_of_Dunkirk，confidence: **medium**）。
  这与 Ellis 的「6 月 3 日凌晨启航」不完全一致
  （10:50 是发电时刻，可能在其抵达多佛后发出）。
  **两说并存，写手可写「6 月 3 日凌晨离岸；10:50 发出『行动完成』信号」。**
- **2330（6 月 2 日）** —— **SNO Dunkirk 报告：「B.E.F. 已撤离。」**
  （dynamo_despatch §84，confidence: **high**）。
  → 维基的表述为「刚过 6 月 2 日午夜，Ramsay 收到信号：『[B.E.F.] 已撤离』」
  （wiki:Battle_of_Dunkirk 注），与 Ramsay 战报的 2330 一致。
- **6 月 2 日 15:38** —— SNO Dunkirk 情况报告：
  「法军仍守住前线，唯 Bergues 以东地区德军已在两英里正面上突入两英里。
  1500 正在实施反冲击。港内无动静。目前形势尚有希望。」
  （dynamo_despatch §82，confidence: **high**）。
  → **这是桥头堡最后阶段最精确的法军战线状况报告。**
- **6 月 2 日 21:45** —— 得知人员运输船中第一艘 **ROYAL DAFFODIL**
  在出航途中于 North Goodwin 灯船附近被炸，已返回 Ramsgate
  （dynamo_despatch §83，confidence: **high**）。
- **6 月 2 日 22:00** —— 得知已装载的船只正驶离敦刻尔克
  （dynamo_despatch §83，confidence: **high**）。
- **当日** —— 英军当日 **26,256 人**（另见 §2.9 的口径差异）。
- **当日** —— **皇家空军与美国方面对 6 月 2 日的记载很少**：
  Ramsay 战报未给 6 月 2 日的舰炮击落数字（App.III 注明
  「6 月 1 日之后撤离只在黄昏与黎明之间进行」）。

---

### 1.9 6 月 3 日（星期一）—— 法军独守；最后两夜

- **0030** —— Rear-Admiral Dover 自敦刻尔克报告：**四艘船已靠泊，但没有任何法国部队**。
  （dynamo_despatch §85，confidence: **high**）。
- **0115** —— 再次报告：「**很多船，但接不到部队。**」
  （dynamo_despatch §85，confidence: **high**）。
- **0312** —— 敦刻尔克报告：**所有船只正在离开，阻塞船已进入**
  （dynamo_despatch §85，confidence: **high**）。
- **原因分析** —— 船只返英后得知，**法国部队的人流在午夜稍后即逐渐消失**。
  有一艘船**等了两个半小时**才装完其载荷，而正常只需半小时。
  推想的解释是：原定 6 月 2 日下午实施的**一次法军反冲击被迫推迟到傍晚**，
  这无疑打乱了部队向后方的输送。
  **结果是 6 月 3 日午夜至 0300 之间，约 10,000 人的运载能力被空置**
  （dynamo_despatch §85，confidence: **high**）。
  → **这是一个「10,000 个空位」的具体损失数字，非常有说服力。**
- **当日** —— B 集团军群的情况报告记载**法军为每一栋房屋、每一尺土地而战**，
  但尽管有反冲击，其防御仍被压回 **Dunkirk–Furnes 运河**一线。
  **敌军距海滩已不足两英里**
  （ellis_1953 ch.16，confidence: **high**）。
  → **「距海滩不足两英里」是 6 月 3 日的关键空间事实。**
- **当日下午** —— **Abrial 海军上将在与 Fagalde 将军、de la Laurencie 将军等人的会议上
  决定：即将到来的夜间必须完成最后的法军撤离**
  （ellis_1953 ch.16，confidence: **high**）。
- **当日全天** —— 当夜撤离未受敌军行动干扰
  （dynamo_despatch §86，confidence: **high**）。
- **当日上午** —— 在多佛举行会议以改善 6 月 3 日/4 日夜间安排。
  总计划不变，但为英船使用**新外港的西码头（West Pier in the New Outer Port）**作了准备，
  因为**法方船只不足以充分利用这一宝贵泊位**。
  同样，一些原在 Malo 海滩作业的摩托艇此次被派入 **Quay Felix Faure**
  （dynamo_despatch §86，confidence: **high**）。
- **当日** —— **无法获得「当夜将是行动终点」的任何保证**；
  同时由于舰船官兵逐渐耗竭而产生相当大的忧虑，
  **这种耗竭在驱逐舰部队尤为明显**
  （dynamo_despatch §86，confidence: **high**）。
- **当夜** —— 海军行动随天黑重新开始，**动用五十艘船**。
  港口非常拥挤，但秩序得到维持，尽一切努力迅速装载剩余法军。
  **有些部队到码头太晚，因总体混乱而未能与控制组接上头**
  （ellis_1953 ch.16，confidence: **high**）。
- **至午夜** —— **26,476 人**已登船（ellis_1953 ch.16，confidence: **high**）。
  → **注意与维基表格（6 月 3 日 26,746）的差异。见 §2.9。**
- **当夜（6 月 3 日/4 日）** —— **三艘阻塞船由驱逐舰 Shikari 引导驶往敦刻尔克**。
  **一艘在敦刻尔克外触雷，另两艘在航道中自沉，位置紧接前一夜沉没的同类船只**
  （ellis_1953 ch.16，confidence: **high**）。
- **当夜** —— **Shikari 在装载 383 名法国部队后，成为最后一艘驶离敦刻尔克的船**
  （ellis_1953 ch.16，confidence: **high**）。
  → **注**：Ellis 原文此处有一处排版符号「[2]]」，本笔记按上下文理解为注脚标记。
  → **与 Ramsay 战报对照**：**Express 与 Shikari 是最后驶离敦刻尔克的两艘船，
  时间分别为 0318 与 0340，共载约 1,000 名部队与英国码头分队**
  （dynamo_despatch §90，confidence: **high**）。
  → **两说并存**：Ellis 只提 Shikari，Ramsay 提 Express 与 Shikari 两艘。
  **写手可写「Express（0318）与 Shikari（0340）为最后两艘离港船只」。**

---

### 1.10 6 月 4 日（星期二）—— 终局

- **0200 后** —— 一艘摩托艇上的指挥官报告。
- **0318** —— **HMS Express 驶离敦刻尔克**
  （dynamo_despatch §90，confidence: **high**）。
- **0320** —— 指挥官 **H. R. Troup** 记录了法军最后的景象，**这是本笔记中最动人的一手记录**：
  「**约 1,000 人分四列站在码头中途，将军及其参谋在约三十英尺外；
  在检阅了部队之后——他们的面孔在晨光中难以辨认，
  身后的火焰映出他们的钢盔——军官们咔哒一声立正、敬礼，
  然后转过身来，与我一同步行下到船上，我们于 0320 离开。**」
  （ellis_1953 ch.16 引 Commander H. R. Troup 报告，confidence: **high**）。
  → **建议作为整个战役 `importance: 3` 的收官事件。**
- **0340** —— **HMS Shikari 作为最后一艘船驶离**，共载约 1,000 名部队与英国码头分队
  （dynamo_despatch §90，confidence: **high**）。
- **最后一夜之后** —— **一批较大的摩托艇继续在敦刻尔克港内作业，
  直到遭到已突入敦刻尔克某些地点的德军步兵的轻武器射击才离开**
  （dynamo_despatch §111，confidence: **high**）。
  → **这是「德军进入敦刻尔克市区」的最早时刻线索，但未给具体时间，写「时刻不详」。**
- **当夜** —— **Abrial 海军上将、Fagalde 将军、de la Laurencie 将军与 Berthélemy 将军
  已在夜间渡海赴英**；在多佛，Ramsay 与 Abrial 讨论了**能否再坚持一夜**继续撤离，
  尽管过去九天的紧张已严重损耗人员与船只。
  **但这位法国海军上将认为进一步撤离不可能，因为敌人正在从四面八方逼近**
  （ellis_1953 ch.16，confidence: **high**）。
- **09:00** —— **剩余的法国部队于当日晨九点投降。**
  **关于其人数没有权威记录。最详细的估计是约 40,000 人**
  （ellis_1953 ch.16，confidence: **high** 之于 09:00；**medium** 之于 40,000）。
  → **契约 §4 的 `06-04T09:00` 帧与此完全一致，可放心使用。**
  → **不确定的数字范围**：40,000（Ellis「最详细的估计」）／
  35,000（wiki:Battle_of_Dunkirk「Wehrmacht 俘获约 35,000 人，几乎全是法国人」）／
  30,000–40,000（wiki:Battle_of_Dunkirk「其余 30,000 至 40,000 人被留在敦刻尔克周界内」）／
  40,000（wiki:Dunkirk_evacuation「剩余的 40,000 名法国部队于 6 月 4 日投降」）。
  **写手请写「约 40,000 人（一说 35,000）」并注明。**
- **当日上午** —— **10:30，救援船队被下令解散**（「the fleet of rescue ships was ordered
  to disperse」）（ellis_1953 ch.16，confidence: **high**）。
- **10:20** —— **德军在多佛（应为敦刻尔克）码头升起卐字旗**
  ——即从那么多英法部队逃离的码头
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **1100** —— **法方海军部同意行动告终**。此时统计得知**前一夜共撤离 27,000 人**；
  **Admiral Nord（Abrial）同意该行动应视为已完成**，
  并指出**敦刻尔克的全部弹药已用尽**，留下的人数不多，
  主要是非战斗人员
  （dynamo_despatch §91，confidence: **high**）。
  → **「全部弹药已用尽」是法军投降的直接军事原因，极重要。**
- **14:23** —— **海军部电报正式终止「发电机行动」**
  （dynamo_despatch §91，confidence: **high** —— 时刻精确到分）。
  → Ellis 的表述：「6 月 4 日上午十点三十分，救援船队被下令解散，
  **发电机行动由当日 14:23 的海军部电报正式终结**」
  （ellis_1953 ch.16，confidence: **high**）。**两者一致。**
  → **契约 §11.2 写 `end 1940-06-04T12:00`、marks 写 `06-04T12:00 行动结束`。
  建议把 marks 改为 `06-04T14:23`（或至少注明实际终止时刻）。**
- **当日** —— 英军当日 **26,175 人**（一说 27,689 人抵英，见 §2.9）。
- **6 月 5 日** —— **皇家空军快艇在 Goodwin/Boulogne 一线以南搜索，
  救起 33 名法国部队与 2 名海军士兵**。
  此外，法国部队被巡逻艇救起并送至多佛、Margate 与 Ramsgate。
  **另有部队乘法国与比利时拖网渔船抵达，总数约另加 1,100 人**
  （dynamo_despatch §92，confidence: **high**）。
  → **「6 月 5 日又救回约 1,100 人」是 Dynamo 正式结束后的追加数字，写手勿漏。**
- **6 月 5 日** —— 德军宣布「敦刻尔克已陷落！40,000 名法国与英国部队是昔日大军仅存者。
  缴获的物资不可估量。世界历史上最伟大的战役已经结束。」
  OKW 宣称此役为「**史上最伟大的歼灭战**」
  （wiki:Dunkirk_evacuation，confidence: **high** 之于引文）。
  → **这是极佳的「德方宣传 vs 实际」对照素材。**
- **6 月 5 日** —— **Fall Rot（红色方案）开始**，德军向南转入对法国剩余部分的攻势
  （wiki:Battle_of_Dunkirk，confidence: **high**）。

---

### 1.11 时间线小结：契约需修正的四处

| 契约原文 | 史料实际 | 来源 | 建议 |
|---|---|---|---|
| `05-26T19:00 加来陷落` | **16:00**（范围 15:30–17:00） | wiki:Siege_of_Calais_(1940) | 改为 `05-26T16:00` |
| `05-29T12:00 卡塞尔陷落` | 守军 **29 日 21:30** 突围，**30 日凌晨**才被判定失守 | ellis_1953 ch.14 | 改为 `05-30T06:00` 或注明「29 日夜突围」 |
| `05-31T12:00 里尔法军投降` | **5-31/06-01 午夜** | wiki:Siege_of_Lille_(1940) | 改为 `06-01T00:00` |
| `06-01T12:00 昼间撤离停止` | **06-02T07:00** 海军部令停；**06-01 是最后一次大规模昼间撤离** | dynamo_despatch §65 | 改为 `06-02T07:00` |
| `marks` 的 `06-04T12:00 行动结束` | **06-04T14:23** 海军部电报 | dynamo_despatch §91；ellis_1953 ch.16 | 改为 `06-04T14:23` |
| `start 1940-05-26T00:00` | 与史料一致（Dynamo 令在 18:57，但当日凌晨即已进入战役窗口） | dynamo_despatch §1 | 无需修改 |

**另需注意**：CONTRACT §4 的 `05-27T12:00` 帧写「德军在维茨哈特、波珀灵厄进攻」——
史料显示维茨哈特（Wytschaete）方向的全面进攻始于 **5 月 27 日中午 12:00**
（wiki:Battle_of_Dunkirk），Poperinghe 的交通拥堵空袭亦在 27 日（ellis_1953 ch.12，
wiki:Battle_of_Dunkirk 记「两小时轰炸」）。**该帧与史料吻合。**

---

## 2. 数字与口径

### 2.0 总原则：同一件事至少有三种数字

**写手在 `data/forces.json` 的 `note` 字段里，必须写明该数字属于哪一种口径。**
本笔记把口径分为：

- **【登船】** —— 在敦刻尔克（海滩或港口）上船的人数；
- **【抵英】** —— 在英国港口下船的人数；
- **【建制】** —— 某部队的编制人数；
- **【累计】** —— 自行动开始至某时刻的总和。

Ramsay 战报附录 II 的表头原文即为
「**Daily List of Disembarkation in U.K. Ports**」（在英国各港下船之每日清单），
并注明「**此清单不完整，因若干船只未记录其总数**」与
「**6 月 1 日之后撤离仅限夜间**」
（dynamo_despatch App.II，confidence: **high**）。
→ **这是「登船数」与「抵英数」不一致的制度性原因，不是史料错误。**

### 2.1 总撤离人数

| 数字 | 口径 | 来源 | 置信度 |
|---|---|---|---|
| **338,226** | 抵英总数（Dynamo 官方） | dynamo_despatch App.II；ellis_1953 ch.16；wiki:Dunkirk_evacuation | **high** |
| **308,888** | 其中由**受 Ramsay 指挥的船只**运出者 | ellis_1953 ch.16 | **high** |
| **约 330,000** | Ramsay 战报正文的概数（「some 330,000 troops reached safety」） | dynamo_despatch 首段 | **high** |
| **336,000** | 「多于 336,000」 | wiki:Little_Ships_of_Dunkirk | medium |
| **338,000** | 「约 338,000」 | wiki:Battle_of_Dunkirk | high |

- **Ramsay 战报正文**：「行动期间约 **330,000** 名部队在自敦刻尔克港入口
  及其以东绵延 10 英里的海滩撤离后安全抵达英国」
  （dynamo_despatch，confidence: **high**）。
  → **正文概数与附录精确数（338,226）并存，非矛盾。**
- **308,888 与 338,226 的差额 = 29,338 人**：
  由不受 Ramsay 直接指挥的船只（主要为法方船只与部分英方独立行动船只）运出。
  **这个差额在中文资料里极少被提及，写手可善用。**
- **不确定**：维基称「861 艘船、其中 243 艘沉没」
  （wiki:Dunkirk_evacuation 引其自建表格；wiki:Battle_of_Dunkirk 亦引同一组数字），
  但同一条目的船只统计表**同时**给出「英方 693 艘（沉 226）/ 盟方 168 艘（沉 17）
  / 总计 861 艘（沉 243）」，**且该表「受损」列在三处写「Unknown」**。
  **「243 艘沉没」与 Ellis 的「228 艘损失、45 艘重创」互不相同**（见 §2.7）。
  写手如引用 861/243，请注明来源为维基表格。

### 2.2 按国籍分解

| 国别 | 数字 | 口径/来源 | 置信度 |
|---|---|---|---|
| 英国及帝国部队 | **约 198,000**（CONTRACT §10 引） | 通说 | medium |
| 英国 | **215,000** | wiki:Battle_of_Dunkirk 引 Lord 1982 p.148 | medium |
| 英国 | **约 218,000** | 由 338,226 − 123,095（法）≈ 215,131，与上条一致 | 推算，**low** |
| 法国 | **123,095** | dynamo_despatch App.IV（**权威一手**） | **high** |
| 法国 | **123,000** | wiki:Battle_of_Dunkirk 引 Lord 1982 p.148 | high |
| 法国（其中由英舰运出） | **102,250** | wiki:Battle_of_Dunkirk 引 Lord 1982 p.148 | medium |
| 法国（由法舰运出） | **20,525** | dynamo_despatch App.IV | **high** |
| 比利时 | **15,000–16,000**（经敦刻尔克） | CONTRACT §10 | medium |
| 比利时 | **约 33,000**（经比利时各港另计） | CONTRACT §10 | medium |
| 荷兰 | 少量（**未查到确切数字**） | wiki:Dunkirk_evacuation 仅称「a small number of Dutch soldiers」 | **low** |
| 波兰 | 少量（**未查到确切数字**） | wiki:Dunkirk_evacuation 列举波兰为参战方但未给人数 | **low** |
| 印度 | 「数百名」非武装骡夫（皇家印度陆军勤务团 K-6 运输部队 6 个单位中的 4 个；3 个成功撤离，1 个被俘） | wiki:Dunkirk_evacuation | medium |
| 塞浦路斯 | 骡夫（**人数不详**） | wiki:Dunkirk_evacuation | low |
| 塞内加尔/摩洛哥 | 少量（**人数不详**） | wiki:Dunkirk_evacuation；ellis_1953 ch.16 提到 Brighton Queen 上的摩洛哥部队 | low |
| 「其他盟国」合计 | **139,997**（法+波+比+荷等） | wiki:Battle_of_Dunkirk | medium |

- **Ellis 给出的法方权威分日表（dynamo_despatch App.IV，confidence: high）**：

| 抵英日期 | 由法船运出 | 法英船只合计 |
|---|---|---|
| 5 月 27 日 | 0 | 0 |
| 5 月 28 日 | 0 | 0 |
| 5 月 29 日 | 655 | 655 |
| 5 月 30 日 | 5,444 | 8,616 |
| 5 月 31 日 | 4,032 | 14,874 |
| 6 月 1 日 | 2,765 | **35,013** |
| 6 月 2 日 | 905 | 16,049 |
| 6 月 3 日 | 4,235 | 19,803 |
| 6 月 4 日 | 2,349 | 26,989 |
| 6 月 5 日 | 140 | 1,096 |
| **合计** | **20,525** | **123,095** |

  → **这是本笔记中关于法军撤离最可靠的一张表，强烈建议写手直接用于法军侧叙事。**
  → **注意**：6 月 4 日「26,989」与维基表格的「26,175」相差 814；
    6 月 2 日「16,049」与维基表格的「26,256」相差 10,207。
    这是**抵英口径**（Ramsay）与**登船口径**（维基表格）的差异，见 §2.9。

- **不确定**：**比利时与波兰的撤离人数在本次查证中未能找到可靠的一手分国数字。**
  维基与 Ellis 均未给出。CONTRACT §10 的「比利时 15,000–16,000」来源为
  `belgian_evac_1940`，本笔记**未能独立核实该来源**。**请写手标注为 medium 并注明出处。**

### 2.3 海滩 vs 港口

| 口径 | 海滩 | 港口 | 合计 |
|---|---|---|---|
| Dynamo 全程（维基表格） | **98,671** | **239,555** | 338,226 |
| Ellis 的表述 | 「**近 100,000** 人自海滩吊运」 | —— | —— |
| Ellis 的相片说明（第 13 章插图） | 「**约 96,000** 人」自海滩运出 | 「**逾 206,000** 人」自东防波堤运回 | —— |
| 至 5 月 30 日午夜累计 | **49,194** | **77,412** | **126,606** |
| Ramsay：海滩小艇的贡献 | 「自一片开阔海滩直接吊运**多于 100,000** 名盟军部队」 | —— | —— |
| Ramsay：东防波堤 | —— | 「几乎所有部队自东防波堤上船」 | —— |

来源：wiki:Dunkirk_evacuation 表格（high）；
ellis_1953 ch.16（high）；ellis_1953 ch.13 插图说明（high）；
ellis_1953 ch.15（high）；dynamo_despatch §93（high）。

- **不确定（重要）**：**「海滩 98,671 / 港口 239,555」与
  「约 96,000 / 逾 206,000」是两组不同数字，差约 2,700 与 33,000。**
  前者出自每日表格逐日相加，后者出自 Ellis 的相片说明
  （该说明写于战后，可能用的是较早的统计）。
  **本笔记建议采用前者（98,671 / 239,555），并在 note 中注明后一组数字存在。**
- **「近 200,000 人自东防波堤上船」**（wiki:Dunkirk_evacuation）
  与 Ellis 的「逾 206,000」接近但不等。**范围 200,000–206,000。**
- **Ramsay 的权威表述**：「约 **400** 艘小艇（自荷兰 skoots 到 30 英尺摩托艇）
  在不同时间出发前往佛兰德海岸。此外还有数十艘划艇、商船救生艇、
  海军快艇与捕鲸艇被拖带送出。**只有一部分**——尤其是划艇——成功抵达海岸
  并实际参与撤离，能留在海岸超过一个时段的更少。
  尽管如此，这些小艇连同皇家海军舰只自身的划艇与动力艇，
  **在 5 月 27 日 16:00 至 6 月 2 日 04:00 之间，
  负责从一片浅水开阔海滩直接吊运了超过 100,000 名盟军部队**」
  （dynamo_despatch §93，confidence: **high**）。
  → **「5-27 16:00 至 6-02 04:00」这一段精确的时间区间，是本笔记中
  「海滩作业期」的最权威定义，写手可用于海军层的时间轴。**

### 2.4 每日登船数（维基表格，经 Ramsay 附录校核）

| 日期 | 海滩 | 港口 | 合计 | Ramsay 附录 II（抵英） |
|---|---|---|---|---|
| 5 月 26 日 | — | — | —（**维基表未列**） | **4,247** |
| 5 月 27 日 | — | 7,669 | **7,669** | 5,718（OCR 存疑，见下） |
| 5 月 28 日 | 5,930 | 11,874 | **17,804** | 18,527 |
| 5 月 29 日 | 13,752 | 33,558 | **47,310** | 50,331 |
| 5 月 30 日 | 29,512 | 24,311 | **53,823** | 53,227 |
| 5 月 31 日 | 22,942 | 45,072 | **68,014** | 64,141 |
| 6 月 1 日 | 17,348 | 47,081 | **64,429** | 61,557（OCR 存疑） |
| 6 月 2 日 | 6,695 | 19,561 | **26,256** | 23,604 |
| 6 月 3 日 | 1,870 | 24,876 | **26,746** | 29,641 |
| 6 月 4 日 | 622 | 25,553 | **26,175** | 27,689 |
| **合计** | **98,671** | **239,555** | **338,226** | —— |

来源：wiki:Dunkirk_evacuation 表格（confidence: **high**，与 dynamo_despatch §「47,310」段、
ellis_1953 ch.15、ch.16 的日数字互证）；
Ramsay 附录 II 的数字系自 OCR 文本转录，confidence: **medium**（见下）。

- **校核结果**：维基表格的 **5-29（47,310）、5-30（53,823）、5-31（68,014）、6-1（64,429）**
  四个数字与 Ellis 的日数字**完全一致**
  （ellis_1953 ch.14 记 47,310；ch.15 记 53,823 与 68,014；ch.16 记 64,429，均 confidence: **high**）。
  → **这四个数字可以放心引用。**
- **不确定**：**Ramsay 附录 II 的抵英数字自 OCR 转录，存在明显的识别错误**
  （如「5,7 l8」= 5,718？「6 i ,557」= 61,557 或 64,557？「n.327」= 11,327？）。
  **本笔记保留 OCR 原样并标注，不建议写手直接引用附录 II 的分日数字；
  建议只用其总额（338,226 → 实际为各日相加）与法军分表（App.IV，该表 OCR 较清晰）。**
- **6 月 4 日**：维基表格记 **26,175**；Ramsay 战报 §91 记前一夜撤离 **27,000** 人；
  Ramsay 附录 II 记 6 月 4 日抵英 **27,689**。
  → **范围 26,175 – 27,689。写手请写明口径。**
- **6 月 3 日**：维基表格记 **26,746**；Ramsay 战报 §91 记「前一夜共撤离 27,000 人」
  （该「前一夜」指 6 月 3/4 夜，即 6 月 4 日凌晨）；
  Ellis 记「至午夜 26,476 人已登船」（6 月 3 日 24:00 前）。
  → **三个数字 26,476 / 26,746 / 27,000 非常接近，写手可写「约 26,500–27,000」。**
- **5 月 26 日**：维基表格**未列**（因其表格标称「27 May – 4 June」）。
  但 Dynamo 官方命令在 5 月 26 日 18:57 下达，且 Ramsay 战报明确记当日有
  **4,247 人**抵英（dynamo_despatch App.II）。**写手如做 5 月 26 日事件，可用 4,247。**
  → **CONTRACT §10 的每日登船表从 5-27 开始，遗漏了 5-26，建议补充。**

### 2.5 累计进度锚点（极适合做「进度条」）

| 时刻 | 累计抵英 | 其中海滩 | 其中港口 | 来源 |
|---|---|---|---|---|
| 5-26 18:57（Dynamo 令下时） | 之前已有 26,402 英军 + 1,534 盟军经英船撤出 | —— | —— | ellis_1953 ch.16 |
| 5-28 末（Wevgand 授权法军撤离时） | **逾 70,000 英军已登船** | —— | —— | ellis_1953 ch.14 |
| 5-30 24:00 | **126,606** | **49,194** | **77,412** | ellis_1953 ch.15 |
| 行动结束 | **338,226** | 98,671 | 239,555 | ellis_1953 ch.16 |

- **Ellis 的官方分解（dynamo_despatch 引 Ellis 或 Ellis ch.16，confidence: high）**：
  「在发电机行动中，当行动开始三天后 Weygand 将军授权法军全面撤离、
  英国政府下令平等分享设施之时，**已有 58,583 名英军与 814 名盟军被带回**。
  此后又有 **139,782 名英军与 139,097 名盟军**被带走。
  行动结束时共撤出 **338,226 人**——其中 **308,888 人**在
  Ramsay 海军上将指挥的船上。**近 100,000 人自海滩吊运。**
  英军伤亡 **8,061** 人；盟军伤亡 **1,230** 人。」
  （ellis_1953 ch.16，confidence: **high**）。
  → **组数字是本笔记中最权威的「阶段性分解」，强烈建议写手用于阶段文案。**
  → **注意**：「英军伤亡 8,061 / 盟军 1,230」是**撤离过程中的船上伤亡**
    （即登船后遭空袭等所致），与 BEF 战役总伤亡 68,111 是**完全不同的口径**。
    **切勿混用。**

### 2.6 人员损失

**英军（BEF）**

| 数字 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| **68,111** | 战役总伤亡（阵亡、伤重死、失踪、负伤、被俘）——官方 | ellis_1953 ch.23 | **high** |
| **+599** | 另因伤与疾病死亡 | ellis_1953 ch.23 | **high** |
| **68,000** | 战役总伤亡（约） | wiki:Dunkirk_evacuation | high |
| **3,500** | 阵亡 | wiki:Dunkirk_evacuation；wiki:Battle_of_Dunkirk | medium |
| **13,053** | 负伤 | wiki:Dunkirk_evacuation | medium |
| **约 40,000** | 被俘 | wiki:Dunkirk_evacuation | medium |
| **40,000–41,000** | 被俘（Sean Longden 估计） | wiki:Battle_of_Dunkirk 引 Longden | medium |
| **66,426**（阵亡 11,014 / 伤 14,074 / 失踪与被俘 41,338） | Sebag-Montefiore 的分项 | wiki:Battle_of_France 引 Sebag-Montefiore 2006 p.506 | medium |
| **3,500–5,000 死 / 16,815 伤 / 47,959 失踪或被俘** | Frieser 与 French 的分项 | wiki:Battle_of_France 引 Frieser 1995 p.400 | medium |
| **8,061** | **撤离过程中**（登船后）英军伤亡 | ellis_1953 ch.16 | **high** |

- **不确定（重要矛盾）**：
  **「68,111（Ellis 官方）」与「66,426（Sebag-Montefiore）」相差 1,685**，
  且分项差异更大（阵亡 3,500 vs 11,014）。
  **原因**：Ellis 的 68,111 是「killed in action, died of wounds, missing, wounded
  and prisoners of war」的**合并计**，未分项；
  Sebag-Montefiore 的分项含「died of wounds」11,014，
  与 wiki 的「3,500 killed」**不同口径**（3,500 应为「killed in action」而不含伤重死）。
  **写手请务必写明口径。本笔记推荐使用 Ellis 的 68,111 作为总数。**
- **「每七名自敦刻尔克逃出的士兵中有一人成为战俘」**（wiki:Dunkirk_evacuation
  引 Longden 2009 p.361，confidence: **medium**）。
  → 这是一个很好的「比例」表述，适合文案。

**法军**

| 数字 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| **1,230** | **撤离过程中**盟军伤亡 | ellis_1953 ch.16 | **high** |
| **约 16,000** | 撤离期间阵亡的法国士兵 | wiki:Battle_of_Dunkirk | medium |
| **50,000** | 6 月 1 日在防御阵地上的法军 | ellis_1953 ch.16 | **high** |
| **80,000** | 6 月 1 日已在沙丘中集结待撤者（其中 30,000 已上船） | ellis_1953 ch.16 | **high** |
| **约 20,000** | 另有分散小股未计入法方统计者 | ellis_1953 ch.16 | **high** |
| **约 40,000** | 6 月 4 日投降者（「最详细的估计」） | ellis_1953 ch.16 | **medium** |
| **约 35,000** | 被 Wehrmacht 俘获者（「几乎全是法国人」） | wiki:Battle_of_Dunkirk | medium |
| **75,000** | 6 月 2–4 日夜撤出的法国部队 | wiki:Dunkirk_evacuation | medium |
| **约 70,000** | 法军殿后所掩护撤离的法军人数 | ellis_1953 ch.16 | **high** |
| **34,957** | **里尔口袋**被俘法军 | wiki:Siege_of_Lille_(1940) 信息框 | high |
| **约 35,000** | 里尔口袋投降人数 | wiki:Siege_of_Lille_(1940) 正文 | high |

**比军**

| 数字 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| **6,093** | 阵亡 | wiki:Battle_of_France 引 Ellis 1993 p.255；Dear & Foot 2005 p.96 | **high** |
| **15,850** | 负伤 | 同上 | **high** |
| **500+** | 失踪 | 同上 | **high** |
| **约 200,000** | 被俘（其中 **2,000 人死于囚禁**） | 同上 | **high** |
| **112** | 损失飞机 | wiki:Battle_of_France 引 Hooton 2007 p.52 | medium |
| **80,000** | 整场入侵中的比军总伤亡（其中 **40,000 在 5-25 至 5-27**） | wiki:Battle_of_the_Lys_(1940) | medium |

**德军（Heeresarzt 口径）**

| 数字 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| **27,074** | 阵亡（**整个法国战役 5-10 至 6-22**） | wiki:Battle_of_France 引 Frieser 1995 p.400 | **high** |
| **111,034** | 负伤 | 同上 | **high** |
| **18,384** | 失踪 | 同上 | **high** |
| **156,547** | 德军总伤亡 | wiki:Battle_of_France | medium |
| **46,059** | 德军 1944 年统计的陆军死亡数（含伤重死与失踪后改判死亡） | wiki:Battle_of_France 引 Overmans 2004 p.54 | medium |
| **1,129** | 空军阵亡 | wiki:Battle_of_France 引 Hooton 2010 p.73 | medium |
| **3,200** | Groehler 统计的空军死亡与失踪 | wiki:Battle_of_France 引 Groehler 1981 p.246 | medium |

- **不确定（极其重要）**：
  **上述所有德军数字都是「整个法国战役」的数字，不是「敦刻尔克」的数字。**
  **本笔记在查证范围内未能找到「敦刻尔克桥头堡战斗」单独的德军伤亡数字。**
  **请写手在 `data/forces.json` 中明确写「德军数字为法国战役全程口径，
  敦刻尔克阶段单独数字未查到」。**
- **Heeresarzt（陆军军医总监）数字的可靠性**：
  Overmans 2004 指出 1944 年德军自己的统计显示陆军死亡可能高达 46,059 人，
  远高于通行的 27,074。**两者差异源于「伤重死」与「失踪后改判死亡」是否计入。**
  **写手请同时给出两个数字并注明。**

### 2.7 装备损失

**英军（**权威一手数据，Ellis 官方战史第 23 章**）**

| 项目 | 运往法国（1939-09 至 1940-05） | 消耗、损毁或遗留 | 带回英国 |
|---|---|---|---|
| 火炮 | **2,794** 门 | **2,472** 门 | **322** 门 |
| 车辆 | **68,618** 辆 | **63,879** 辆 | **4,739** 辆 |
| 摩托车 | **21,081** 辆 | **20,548** 辆 | **533** 辆 |
| 弹药 | **109,000** 吨 | **76,697** 吨 | **32,303** 吨 |
| 补给与物资 | **449,000** 吨 | **415,940** 吨 | **33,060** 吨 |
| 汽油 | **166,000** 吨 | **164,929** 吨 | **1,071** 吨 |

（ellis_1953 ch.23，confidence: **high** —— 这是本笔记中最权威的装备损失表）。

- **坦克** —— 「**只有 13 辆轻型坦克与 9 辆巡洋坦克被带回英国**」
  （ellis_1953 ch.23，confidence: **high**）。
  → **合计 22 辆。**
- **坦克（另一口径）** —— 「运往法国的 **445 辆**英国坦克几乎全部被遗弃」
  （wiki:Dunkirk_evacuation，confidence: **medium**；CONTRACT §10 亦引此数）。
  → **与上面「13 + 9 = 22 辆带回」并不矛盾**（445 − 22 = 423 辆损失）。
- **维基的另一组数字（含法军装备）** —— 遗弃于法国者包括：
  **880 门野战炮、310 门大口径火炮、约 500 门高射炮、约 850 门反坦克炮、
  11,000 挺机枪、近 700 辆坦克、20,000 辆摩托车、45,000 辆汽车与卡车**
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → **注意**：此处「近 700 辆坦克」与「445 辆英国坦克」**口径不同**
  （前者或含法军），写手**切勿混用**。
- **另一组数字** —— 「损失包括 **180,000 支步枪、10,700 挺布伦机枪、
  509 门两磅反坦克炮、509 辆巡洋坦克与 180 辆步兵坦克**」
  （wiki:Battle_of_France 引 Fennell 2019 p.115，confidence: **medium**）。
- **不确定**：**CONTRACT §10 写「火炮 2,472 门、摩托车 20,000 辆、
  其他车辆近 65,000 辆、坦克 445 辆」——这与 Ellis 的官方数字
  （2,472 / 20,548 / 63,879 / 445）完全吻合。可直接使用。**

### 2.8 船只损失

**Ramsay 战报的权威统计（dynamo_despatch App.I，confidence: high）**

- **驱逐舰**：参战 **41 艘**（含外国舰只），其中 **6 艘沉没、23 艘受损**。
  → **注意**：**「6 艘沉没」与维基的「6 艘英国驱逐舰沉没」一致**，
  但 **Ramsay 的「41 艘」是包含波兰「Błyskawica」等外国舰只的总数**，
  而维基表格的「驱逐舰 39 艘」只算英国船只。
  **两者不矛盾：39 艘英国 + 2 艘其他（如波兰）≈ 41 艘。**
- **沉没的英国驱逐舰（Ellis 与 Ramsay 一致）**：
  **Basilisk、Grafton、Grenade**（均 5 月 29 日）；
  **Keith、Havant** 与 **Wakeful**（后者的沉没日期在 Ramsay 附录中
  列为与其他两艘同栏，实际为 **5 月 29 日 00:45**）。
  （dynamo_despatch App.I；ellis_1953 ch.14、ch.16，confidence: **high**）。
  → **不确定（重要）**：**Ramsay 附录 I 的排版使 Grafton / Grenade / Wakeful
  三者的「沉没日期」栏共用了一个「sunk 29th May」的标记**
  （OCR 文本中呈现为三行后接一个 "it it it"）。
  **结合 Ellis 与维基，三艘均沉于 5 月 29 日，本笔记采信此说（confidence: high）。**
- **受损驱逐舰清单（Ramsay 附录 I，confidence: high，OCR 存疑处已注明）**：
  Anthony（5-30）、Express（5-31）、Gallant（5-29）、Greyhound（5-29）、
  Harvester（5-31）、Icarus（5-31）、Impulsive（5-31）、Intrepid（5-29）、
  Ivanhoe（6-1）、Jaguar（5-29）、Malcolm（5-31 与 6-2）、Montrose（5-29）、
  Sabre（5-30 与 6-2）、Saladin（5-29）、Scimitar（5-31）、Venomous（6-1）、
  Vimy（6-1）、Vivacious（6-1）、Whitehall（6-1）、Windsor（5-28）、
  Wolfhound（5-29）、Wolsey（5-31）、Worcester（5-30）。
  → **共 23 艘，与「23 艘受损」完全吻合，可作为受损清单的可信版本。**
- **沉没的其他英国主要船只（Ramsay 附录 I 明列）**：
  **Guardship / 武装登船检查船**：**King Orry**（5-27 受损、**5-30 沉没**）；
  **Mona's Isle**（5-27 与 6-1 受损）。
  **扫雷舰**：**Brighton Belle**、**Devonia**（受损/沉没，具体日期 OCR 不清）。
  **Corvette**：**Guillemot**（**6 月 1 日沉没**）。
  → **注意**：**Ramsay 附录把 Guillemot 列为 6 月 1 日沉没的 corvette。**
  维基与 Ellis 未提及该舰。**写手如使用请标注 confidence: medium。**
- **Ellis 的总结数字**：
  「**228 艘船损失，另有 45 艘重创**，此外还有相当数量的较小船只与小艇」
  （ellis_1953 ch.16，confidence: **high**）。
  → **这是本笔记采信的「船只损失总数」口径。**
- **维基的总结数字**：
  「**6 艘英国与 3 艘法国驱逐舰沉没，另有 9 艘大型船只沉没。
  此外 19 艘驱逐舰受损。逾 200 艘英国与盟国船只被击沉，数目相近者受损**」
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
  → **「228 / 45」与「逾 200 / 相近数目」接近但不相等。写手请择一并注明。**
- **海军部撤走驱逐舰** —— 「5 月 29 日损失 19 艘英法海军舰只加 3 艘大型征用船只之后，
  **海军部撤走了他们最好的 8 艘驱逐舰**以备本土防御」
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
  → **「8 艘」是一个具体且易被忽略的数字，适合做海军侧事件。**
- **法国海军损失（dynamo_despatch App.IV(b)，confidence: high）**：
  - 驱逐舰：**BOURRASQUE 与 FOUDROYANT 被炸弹击沉；SIROCCO 被鱼雷击沉**；
  - **CYCLONE 被鱼雷重创，MISTRAL 被炸弹重创**；
  - 拖网渔船等：**EMILE DESCHAMPS 与 DUPERRE、漂网渔船 PIERRE MARIE
    以及另外 15 艘小艇被击沉**，其中包括**受法军指挥的荷兰游艇 DEMOG I**；
  - 法国邮船：**COTE D'AZUR 在其首航前即被炸弹击沉**。
  → **注意**：维基称 Bourrasque「5 月 30 日在 Nieuport 外触雷」，
  而 Ramsay 战报称其「被炸弹击沉」。**两者矛盾。**
  维基另称 **Siroco「5 月 31 日被 E-boat S-23 与 S-26 击沉」**，
  与 Ramsay 的「被鱼雷击沉」一致（E-boat 即发射鱼雷）。
  **本笔记采信：Bourrasque 为触雷或炸弹（两说并存，confidence: low）；
  Siroco 为鱼雷（confidence: high）。**
  → **Le Foudroyant「6 月 1 日在海滩外被空袭击沉」**（wiki:Dunkirk_evacuation），
  与 Ramsay 的「被炸弹击沉」一致（confidence: **high**）。
- **法国军舰参战清单（dynamo_despatch App.IV(a)，confidence: high）**：
  **驱逐舰 9 艘**：BRANLEBAS、BOUCLIER、INCOMPRISE、BOURRASQUE、SIROCCO、
  CYCLONE、FLORE、FOUDROYANT、MISTRAL；
  **avisos 4 艘**：AMIENS、BELFORT、ARRAS、AMIRAL MOUCHEZ；
  **快速摩托艇 3 艘**；**猎潜艇 3 艘**；**辅助扫雷舰 6 艘**；
  **小型货船 3 或 4 艘**（向敦刻尔克运送弹药，返航时载运部队）；
  **拖网渔船、漂网渔船及其他小艇 167 艘**（自布洛涅至瑟堡之间的法国海岸集中，
  主要在海滩作业）；
  另有法国邮船 **COTE D'ARGENT、COTE D'AZUR、NEWHAVEN、ROUEN**
  转归 Vice-Admiral Dover 指挥，与英国人员运输船并排使用。
  → **这是一份完整的法国海军参战清单，写手应据此建立 `data/oob/sea.json` 的法方舰船。**

### 2.9 「登船」与「抵英」两套分日数字的对照（写手最易出错处）

| 日期 | 登船（维基表） | 抵英（Ramsay App.II） | 差额 |
|---|---|---|---|
| 5-26 | （未列） | 4,247 | —— |
| 5-27 | 7,669 | 5,718（OCR 存疑） | —— |
| 5-28 | 17,804 | 18,527 | +723 |
| 5-29 | 47,310 | 50,331 | +3,021 |
| 5-30 | 53,823 | 53,227 | −596 |
| 5-31 | 68,014 | 64,141 | −3,873 |
| 6-1 | 64,429 | 61,557（OCR 存疑） | −2,872 |
| 6-2 | 26,256 | 23,604 | −2,652 |
| 6-3 | 26,746 | 29,641 | +2,895 |
| 6-4 | 26,175 | 27,689 | +1,514 |

→ **差额达 ±3,900 人，说明「当日登船」与「当日抵英」是两件事。**
**写手在事件文案中如写「某日撤出 X 人」，请统一使用「登船」口径（维基表／Ellis 日数字），
并在 `note` 中注明。**

### 2.10 空军损失

**皇家空军（RAF）**

| 数字 | 口径 | 来源 | 置信度 |
|---|---|---|---|
| **145** | Dynamo 九天内 RAF 损失（其中至少 **42** 架喷火） | wiki:Dunkirk_evacuation 引 Atkin 1990 p.206 | medium |
| **177** | RAF **毁与伤**（5-26 至 6-3 九天） | ellis_1953 ch.16 | **high** |
| **106** | Liddell Hart 统计的 RAF 在敦刻尔克损失 | wiki:Battle_of_Dunkirk | low |
| **177 / 240** | MacDonald 1986 的英/德损失 | wiki:Battle_of_Dunkirk | low |
| **28** | RAF 与舰队航空兵在 **5-30 或 5-31** 的损失 | wiki:Dunkirk_evacuation；ellis_1953 ch.15 | medium（**日期归属存疑**） |
| **931** | RAF 在**整个法国战役**（5-10 至 6-22）损失的飞机 | ellis_1953 ch.23 | **high** |
| **1,526** | RAF 在整个法国战役的人员伤亡 | ellis_1953 ch.23 | **high** |
| **138** | 英国在 **5-26 至 6-1** 期间的飞机损失 | wiki:German_invasion_of_Belgium_(1940) | medium |
| **344** | 英国在 **5-12 至 5-25** 期间的飞机损失 | 同上 | medium |

- **分日 RAF 出击/损失（Ellis 官方战史，confidence: high）**：

| 日期 | 出动 | 损失 | 备注 |
|---|---|---|---|
| 5-26 | 约 **200** 架次 | **6** 架 | 德方称自损 37 架、伤 7 架 |
| 5-27 | 16 个中队；多数中队 2–3 次巡逻 | **14** 架（喷火+飓风未返航） | 英方昼夜合计 **20** 架；德方称自损 **38** 架 |
| 5-28 | **321** 架次（**创当时单日纪录**） | **13** 架 | 德方称自损 22 架、伤 6 架 |
| 5-29 | 16 个中队 | **19** 架 | 德方承认损失 **18** 架；德方（错误地）宣称击落英机 **68** 架 |
| 5-30 | 三或四中队规模频繁巡逻；仅遇零星敌机 | **2 艘驱逐舰受损**（非飞机） | 云层与低能见度使空战极困难 |
| 5-31 | —— | **28** 架（含轰炸机；**日期归属存疑**） | 德方军需总监承认损 17 架（毁+伤） |
| 6-1 | **八次扫荡，每次三到四个中队** | **31** 架 | 德方承认损失 **10 架战斗机 + 19 架轰炸机**，另 **13 架**重创 = **42 架** |
| 6-2 | 无有效记载（夜间撤离） | —— | —— |
| 6-3 | 无有效记载（夜间撤离） | —— | —— |

来源：ellis_1953 ch.11（5-26）、ch.12（5-27）、ch.13（5-28）、ch.14（5-29）、
ch.15（5-30/31）、ch.16（6-1），均 confidence: **high**。

- **不确定（重要）**：
  **「RAF 损失 145 架 vs 177 架 vs 106 架」三个数字无法统一。**
  - **145**（Atkin）：Dynamo **九天**的损失；
  - **177**（Ellis）：Dynamo 九天的**毁与伤**（不含伤则为更小数字）；
  - **106**（Liddell Hart）：口径不明。
  **本笔记推荐使用 Ellis 的 177（毁与伤），并同时给出 145 作为对照。
  写手请注明口径。**
- **No. 11 Group 的数据** —— 「5 月 27 日：**22 次巡逻、287 架次**，
  编队最大 20 架」（wiki:Dunkirk_evacuation，confidence: **medium**）。
  → **这是本次查证中唯一找到的 No. 11 Group 单日架次数字。**
  **本笔记未能找到 No. 11 Group 在 5-26 至 6-4 期间的完整分日架次表。**
  **请写手不要编造，只用 5-27 的 287 架次与 Ellis 给出的「16 个中队」「321 架次」等数字。**
- **「支持发电机行动的飞行超过 3,500 架次」**（wiki:Dunkirk_evacuation，confidence: **medium**）。
- **「整个行动中只有两天半是适合飞行的好天气」**
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
  → **这是解释 Luftwaffe 未能达成目标的关键因素，与 Ellis 的「天气晴好海面平静」
  （对海军有利）并不矛盾：对海军有利的晴朗天气，正是对空军有利的天气；
  维基的「两天半」指的是「适合俯冲与低空轰炸」的天气。写手请勿混淆。**

**德国空军（Luftwaffe）**

| 数字 | 口径 | 来源 | 置信度 |
|---|---|---|---|
| **156** | Dynamo 九天行动中的损失 | wiki:Dunkirk_evacuation 引 Atkin 1990 p.206 | medium |
| **240** | 同一时期德军在法比上空的毁与伤（各种原因） | ellis_1953 ch.16 | **high** |
| **35**（另 21 架重伤） | **6 天（5-27 至 6-1）内被皇家海军舰炮击落者** | dynamo_despatch App.III | **high** |
| **1,236–1,428** | **整个法国战役**损失的飞机 | wiki:Battle_of_France 引 Frieser 1995 p.400 | medium |
| **28%** | 卢夫特瓦夫前线兵力损失比例（整个法国战役） | 同上 | medium |

- **舰炮击落敌机的分日数字（dynamo_despatch App.III，confidence: high）**：

| 日期 | 击落 | 备注 |
|---|---|---|
| 5-27 | **4** | —— |
| 5-28 | **3** | —— |
| 5-29 | **4** | —— |
| 5-30 | **0** | 原文注：当日飞行条件恶劣，敌机出动很少 |
| 5-31 | **11** | —— |
| 6-1 | **13** | —— |
| **合计** | **35** | 另 **21** 架受重创、观察到陷入困境但未见确定坠毁 |

  → **这是本笔记中最干净、最可引用的一组防空战果数字。**
  → 原文注：「6 月 1 日之后，撤离只在黄昏与黎明之间进行」，
    故 6-2、6-3 无数据。

- **各联队（Geschwader）在敦刻尔克的角色（详见 §4.6）**：
  - **KG 2（Holzhammer）**：I./KG 2 于 **5 月 21–31 日**支援敦刻尔克地面作战；
    **III./KG 2 在 5 月 27 日损失 27 架 Do 17 中的 11 架**
    ——「KG 2 在整个西线战役中最惨的一天」（wiki:Kampfgeschwader_2，confidence: **high**）；
  - **KG 3**：自 5 月底起轰炸海峡内的港口与盟军船只，
    以阻止英法撤军，「至少到 5 月 27 日，也许到 6 月初」；
    **5 月 25 日卢夫特瓦夫开始对敦刻尔克的首轮大规模攻击，
    投下 320 枚炸弹，摧毁船闸与内外港设施；当日空战使德军损失 30 架飞机，
    KG 3 损失 12 架 Do 17**（wiki:Kampfgeschwader_3，confidence: **medium**）；
  - **KG 54**：「在敦刻尔克战役与加来围城战中参与，
    **自 5 月 27 日至 6 月 2 日对敦刻尔克实施特别猛烈的攻击**」；
    II./KG 54「自 **5 月 24 日至 6 月 2 日**加强对敦刻尔克的攻击，
    在此期间损失 **6 架**飞机」；
    **KG 54 于 5 月 27 日击沉 8,000 吨法国海军轮船 Aden**；
    III./KG 54 亦以敦刻尔克为轰炸重点，「6 月 1 日宣称击伤一艘驱逐舰」，
    随后调回德国（wiki:Kampfgeschwader_54，confidence: **high**）；
  - **StG 2（Immelmann）**：属 **VIII 航空军**——「一个专业的对地攻击军」，
    在 Fall Gelb 阶段支援 A 集团军群（并支援 B 集团军群）；
    参与加来、布洛涅与敦刻尔克（wiki:Sturzkampfgeschwader_2，confidence: **high**）；
  - **JG 26、JG 27、ZG 26**：为轰炸机护航并争夺制空权。
    **JG 27 在敦刻尔克战役中，Stab 与 I. Gruppe 一直作战到战役结束，
    宣称击落 22 架敌机、自身损失 1 架**；
    **6 月 2 日 JG 27 宣称击落 7 架 RAF 战斗机**，
    当日 Fighter Command 实际损失 10 架战斗机、1 架受损
    （wiki:Jagdgeschwader_27，confidence: **high**）。
    → **「宣称 7 架 vs 实际 10 架」说明德方宣称数低于实际战果，
      这是罕见的「低报」案例，可用于讨论战果统计的可靠性。**
  - **JG 2、JG 26、JG 51、ZG 26、ZG 76、LG 1** 亦参与
    （wiki:Jagdgeschwader_27 逐一列举，confidence: **medium**）。

- **不确定（重要）**：
  **本笔记未能找到敦刻尔克时段内 Luftwaffe 按机型（Do 17 / He 111 / Ju 88 / Ju 87）
  分列的损失数字。** 仅有：
  「德军损失 23 架 Do 17（5 月 27 日）」（wiki:Dunkirk_evacuation，confidence: medium）；
  「11 架 Ju 87 被击落或击伤（5 月 29 日）」（wiki:Dunkirk_evacuation，confidence: medium）。
  **请写手不要编造分机型数字。**

### 2.11 `data/forces.json` 建议写法

本笔记建议 Lead 在 `data/forces.json` 的 `note` 字段中固定写入以下口径说明：

```
总撤离 338,226 = 登船口径（Dynamo 官方）
  其中 308,888 由 Ramsay 指挥之船只运出
  海滩 98,671 / 港口 239,555
  英国约 215,000（一说 198,000 英国及帝国）
  法国 123,095（法舰 20,525 + 英舰 102,570）
  比利时 15,000–16,000（另约 33,000 经比利时港口，另一口径）
Dynamo 开始前另有 26,402 英军（含 4,992 伤员）+ 1,534 盟军 已撤出
Dynamo 结束后 6 月 5 日又救回约 1,100 人
BEF 战役伤亡 68,111（+599 伤病死）
装备：火炮 2,472 / 车辆 63,879 / 摩托 20,548 / 汽油 164,929 吨
船只：228 艘损失、45 艘重创（一说逾 200 沉、相近数受损）
RAF：177 毁与伤（一说 145 损失）
Luftwaffe：240（法比上空毁与伤）／156（Dynamo 九天）—— 两说
德军人员：27,074 阵亡 / 111,034 伤 / 18,384 失踪（法国战役全程，非敦刻尔克单独）
```


---

## 3. 争议问题

> **写手注意**：本节每条的「证据强度」评级是本笔记的**判断**，不是来源本身的说法。
> 用它来决定 `confidence` 字段，并在 `body` 中避免把 **low** 级说法写成定论。

### 3.1 停止前进令（Haltebefehl）的真实原因

这是敦刻尔克研究中最古老、最政治化的问题。**必须先厘清一件事实**：
**「停止前进令」不是一道命令，而是至少四份文件、在两个层级、跨越 5 月 23–24 日的叠加。**

| 时刻 | 层级 | 内容 | 来源 | 置信度 |
|---|---|---|---|---|
| 5-23 约 18:10 | **A 集团军群 → 第 4 集团军** | 装甲部队不得越过运河线 | AOK 4 KTB；ellis_1953 Supplement p.347 | **high** |
| 5-23 18:10 | **A 集团军群 → Hoth 集群** | 「明日基本停止，必须整顿」 | ellis_1953 App.II p.348 | **high** |
| 5-23 晚 | **Rundstedt + Kluge 谈话** | Kluge 提「部队会很高兴明天整顿一下」，Rundstedt 同意 | ellis_1953 Supplement p.347 | **high** |
| 5-23 夜 | **第 4 集团军 → Hoth / Kleist** | 「Hoth 集群明日大体停止；Kleist 集群亦停止，以清理局势并收拢」 | ellis_1953 ch.9 引 A 集团军群指示 | **high** |
| **5-24 约 11:30** | **希特勒 → Rundstedt（口头背书）** | 「完全同意」；强调保存装甲、压缩包围圈会限制空军 | A 集团军群 KTB；ellis_1953 ch.9 | **high** |
| **5-24 约 12:42** | **Rundstedt → 第 4 集团军（以「元首命令」名义，未加密）** | 「运河线不得越过」 | 英国 Y 情报网截获；ellis_1953 ch.9 | **high** |
| **5-24 当日** | **希特勒 → OKW** | **第 13 号元首指令**：歼灭口袋内法英比部队；空军阻止英军渡海 | hitler_weisung13；wiki:Battle_of_Dunkirk 引 Bond 1990 | **high**（内容）／**low**（编号与分钟） |
| **5-24 20:20** | **OKH** | 撤销前一日命令，改令合围 Dünkirchen–Estaires–Lille–Roubaix–Ostend；「快速左翼应元首明确要求被叫停」 | halder_diary，ellis_1953 App.II p.350 | medium |
| **5-26 下午 15:30** | **希特勒** | 下令装甲集群继续前进；但多数部队又用了约 **16 小时**才开始进攻 | wiki:Dunkirk_evacuation | medium |
| **5-26 晚** | —— | 停止前进令**解除** | wiki:Battle_of_Dunkirk | medium |

→ **本笔记采信的核心结论（Ellis 官方战史的判断，confidence: high）**：
**「5 月 24 日在运河线上停止装甲部队这一决定（在前一天作出、并得到希特勒背书），
最初是 Rundstedt 的决定。」**
Ellis 的原文甚至更尖锐：「Rundstedt 看出，如果他想在意见与 OKH 不同时按自己的方式行事，
就必须让事情看起来是『奉元首之命』。」
（ellis_1953 ch.9，confidence: **high**）。

#### 各方说法与证据强度

**① Rundstedt 的建议 / 保存装甲（**证据最强**）**

- **Rundstedt 本人的理由（5 月 23 日黄昏）** —— Ellis 依据德军战时日志重构为四条：
  1. 必须考虑南北两路盟军协同行动的可能性；
  2. **收拢机动部队、巩固德军北翼至关重要**；Arras 与 Cambrai 附近的英法攻击已强调此需要；
  3. **XIX 军迄今未能拿下布洛涅与加来，Somme 侧翼的防御尚未稳固**，
     故 Kleist 与 Hoth 集群的先头部队**应阻止敌军使用运河线，但不应越过它**；
  4. 装甲师已遭严重损耗（Ellis 前文第 151 页记：**Rundstedt 已损失近 50% 的装甲兵力**），
     且不久将需要用于南向攻势。
  （ellis_1953 ch.9 与 Supplement p.347，confidence: **high**）。
- **Rundstedt 在纽伦堡的证词** —— 依 `rundstedt_nuremberg` 来源，
  他战后表示怀疑希特勒想「帮助英国人」，
  依据是希特勒在访问其司令部时对不列颠帝国的称赞
  （wiki:Battle_of_Dunkirk，confidence: **medium** 之于「他说过」；
  **low** 之于「该说法为真」）。
  → **不确定**：**本笔记未能查到 Rundstedt 纽伦堡证词的具体卷页与日期。**
  `rundstedt_nuremberg` 来源在 `main.json` 中标注为
  「Trial of the Major War Criminals ... Vol. XXXIV — Rundstedt interrogation and
  defence documents」（IMT 1948）。**请写手引用时只写该来源 id，不要编造页码。**
- **Rundstedt 的「转折点」评语** —— 「这是他后来所称的『战争中最大的转折点之一』」
  （wiki:Battle_of_Dunkirk 引 Taylor & Mayer 1974 p.60；Shirer 1959 p.877；Atkin 1990 p.120，
  confidence: **medium**）。
- **Ellis 的官方评价（backing）** ——
  「此后不把他的装甲部队用于攻击敦刻尔克，是稳健而合乎军人本分的方针」；
  理由：沼泽地形不适合装甲；不到一周他就必须准备越过 Somme–Aisne 线向南进攻；
  他已损失近半装甲兵力；「**把更多装甲浪费在攻击敦刻尔克上会显出判断力不佳**」
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是本笔记中支持「保存装甲说」的最强证据。**

**② 戈林争功（**证据中等，且被 Halder 本人修正**）**

- **哈尔德日记 5 月 30 日** ——
  「**Brauchitsch 很愤怒……如果我们的装甲没有被拦住，
  口袋本来会在海岸边被封闭。恶劣天气使卢夫特瓦夫无法起飞，
  我们现在只能站着看着无数敌军在我们鼻子底下逃往英国。**」
  （halder_diary 1940-05-30，转引自 wiki:Battle_of_Dunkirk 引 Shirer 1959 p.883，
  confidence: **high** 之于引文）。
  → **这是最有力的「德军高层事后认为停止前进令是错误」的一手证据。**
- **哈尔德 1957 年 7 月的信** ——
  「在此后数日中……逐渐清楚，**希特勒的决定主要受戈林影响**。
  对这位独裁者来说，陆军那种他因缺乏军事教育而无法理解其风险与成功前景的快速运动，
  变得几乎是不祥的。他不断被一种即将发生逆转的焦虑感所压迫……」
  （halder_diary / Shirer 1959 p.879，confidence: **medium** ——
  这是**战后 17 年**的回忆，非当时记录）。
  → **写手请注意：这是哈尔德 1957 年的追述，而不是 1940 年的日记。
  它与同一位作者 1940 年 5 月 30 日的日记（上条）在归因上并不完全一致：
  5 月 30 日他把责任归于「装甲被拦住」，1957 年他把责任归于「戈林影响希特勒」。
  两者可以并存（戈林促成希特勒背书，希特勒的命令固化了下属的决定），
  但写手不应把它们当作同一层级的证据。**
- **戈林请求由空军消灭敦刻尔克敌军** ——
  「卢夫特瓦夫指挥官赫尔曼·戈林请求获得摧毁敦刻尔克被围部队的机会。
  盟军的覆灭因此最初被交给空军，而德国步兵则在 B 集团军群中整编」
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **戈林的说辞本身** —— 本笔记**未能查到戈林请求的原始文件**（如 OKW 记录或空军文件）。
  **请写手不要为戈林的请求编造时刻或文件编号。**
- **反证（重要）** —— 哈尔德在 1940 年 5 月 24 日的日记中已指出：
  **卢夫特瓦夫依赖天气，且机组在两周战斗后已疲惫**
  （halder_diary，wiki:Dunkirk_evacuation 引，confidence: **high**）。
  → **即德军最高参谋层当时就知道空军无法独力完成歼灭任务。**
  → 5 月 30 日的哈尔德日记（恶劣天气使卢夫特瓦夫无法起飞）**印证了这一预判**。

**③ 地形与补给（**证据强**）**

- **地形** —— 「敦刻尔克周边地形被认为不适合装甲」
  （wiki:Battle_of_Dunkirk，confidence: **medium**）；
  Ellis：「**沼泽地形不适合使用装甲**」（ellis_1953 ch.15，confidence: **high**）；
  希特勒「熟悉佛兰德的沼泽，因为他经历过第一次世界大战」，表示同意
  （wiki:Battle_of_Dunkirk，confidence: **medium**）。
- **德军前线指挥官的独立证词** —— **XXXXI 摩托化军战时日志（5 月 27 日）**：
  「当面对顽强防守的、部分筑垒的野战阵地，尤其是设了路障的村庄时，
  **装甲师并不那么合适**，因为它没有足够的步兵兵力，
  而坦克对于大量设置好的反坦克武器而言是良好的目标」
  （ellis_1953 ch.12 引 XXXXI 军 KTB，confidence: **high**）。
  → **这是「沼泽地形说」最有力的一手证据**：出自**实际在敦刻尔克方向上作战的
  德军装甲军**，而非事后回忆。
- **Kleist 集群参谋长的当场证词（5 月 30 日）** ——
  当第 4 集团军命其「从两翼攻击敦刻尔克，直抵海岸」时，
  Kleist 集群参谋长答复：**「其部队不稳定，因为该地无法使用坦克」**
  （ellis_1953 ch.15，confidence: **high**）。
  → **再次印证：德军前线坚称该地形不适合坦克。**
- **补给** —— Ellis 指出 Kleist 与 Hoth 集群的先进部队**应阻止敌军使用运河线但不应越过**，
  理由之一是「Somme 侧翼的防御尚未稳固」，且「XIX 军迄今未能拿下布洛涅与加来」
  （ellis_1953 ch.9，confidence: **high**）。
- **弹药耗尽的硬证据（5 月 30 日）** ——
  **德军中型炮兵在前一日已耗尽弹药**，只能用轻炮射击敦刻尔克
  （ellis_1953 ch.15，confidence: **high**）。
  → **这是「补给说」最具体、最硬的一条证据，且时间点在停止前进令之后，
    说明补给问题不是借口而是持续存在的实际约束。**
- **希特勒当场的第三条理由** —— 他「强调这一看法，坚持认为
  **无论如何必须把装甲部队保存下来供未来作战使用**，
  而且**进一步压缩包围圈只会产生限制空军活动的极不希望的结果**」
  （ellis_1953 ch.9 引 A 集团军群 KTB，confidence: **high**）。
  → **注意**：这条同时支持「保存装甲」与「给空军让路」两说，
    且**由希特勒当场说出**，不是事后追述。

**④ 希特勒的政治考虑（**证据最弱**）**

- **支持方** ——
  - 希特勒 1945 年 2 月 26 日政治遗嘱中抱怨丘吉尔
    「完全无法领会」他在敦刻尔克放过 BEF 的「运动家精神」
    （wiki:Battle_of_Dunkirk 引 Bond 1990 pp.104–105，confidence: **high** 之于「他这么说了」）；
  - **Jeschonnek 转述**：「元首想免去英国人一次屈辱的失败」
    （wiki:Battle_of_Dunkirk 引 Kilzer 2000 p.63，confidence: **low** ——
    转述的转述，且 Kilzer 该书主题为阴谋论）；
  - 希特勒对一位密友说：「**每一个英国人的血都太宝贵，不能流。
    我们两个民族在种族与传统上属于一体。这就是、也一直是我的目标，
    即使我的将军们无法领会。**」
    （wiki:Battle_of_Dunkirk 引 Kilzer 2000 p.63，confidence: **low**）；
  - **Liddell Hart 的结论**：希特勒相信一旦英军离开欧洲大陆，他们就再也不会回来
    （wiki:Dunkirk_evacuation，confidence: **low–medium**，属后世推断）；
  - **Rundstedt 战后**称怀疑希特勒想「帮助英国人」
    （见上，confidence: **low**）。
- **反对方（**证据强，本笔记采信**）** ——
  **Brian Bond 的权威反驳**：
  「如今很少有历史学家接受这样一种看法，即希特勒的行为受到
  『放过英国人、希望他们随后接受妥协和平』这一愿望的影响。
  诚然，他在 1945 年 2 月 26 日的政治遗嘱中哀叹丘吉尔
  『完全无法领会』他在敦刻尔克没有歼灭 BEF 时所抱的『运动家精神』，
  但这与当时的记录**几乎完全不符**。
  **第 13 号指令由最高统帅部于 5 月 24 日发布，
  明确要求歼灭口袋中的法国、英国与比利时部队，
  同时命令卢夫特瓦夫阻止英国部队渡海逃脱。**」
  （wiki:Battle_of_Dunkirk 引 Bond 1990 pp.104–105，confidence: **high**）。
  → **这是本争议中最有力的一段论证，因为它用同一天的文件反驳了战后的说法。**
- **Guderian 的反驳** —— 他在 1950 年（英译本 1952 年）回应丘吉尔《最光辉的时刻》中
  「希特勒为希望英国提出和平试探而命令装甲部队在敦刻尔克外停止」的说法，
  **否认了这一点**（wiki:Siege_of_Calais_(1940)，confidence: **high** 之于「他否认了」）。
- **Ellis 的判断** —— 他指出：
  「这一点以及同类问题在关于『德国战役的策划与实施』的补编中有更充分的讨论」，
  并明确写道：**「Rundstedt 和希特勒知道真相，
  而希特勒只是太急于显得自己是作战的指挥者」**
  （ellis_1953 ch.9，confidence: **high**）。
  → **即：『元首命令』这一标签，部分是 Rundstedt 借希特勒之名以对抗 OKH 的手段。**

#### 本笔记的裁决

| 说法 | 证据强度 | 建议 `confidence` |
|---|---|---|
| Rundstedt 主动建议、保存装甲 | **强**（德军战时日志 + Ellis 官方战史 + Rundstedt 事后自认） | **high** |
| 地形不适合装甲 + 补给约束 | **强**（XXXXI 军 KTB + Kleist 集群参谋长当场答复 + 弹药耗尽记录） | **high** |
| 空军（戈林）争功 | **中**（戈林请求见诸记载；但「戈林影响希特勒」主要来自哈尔德 1957 年追述） | **medium** |
| 希特勒的「政治考虑」/ 有意放走英军 | **弱**（唯一同时代证据是第 13 号指令，而它**反驳**此说） | **low** |

→ **写手写事件时的建议措辞**：
「停止前进令的真正原因至今仍有争论。主流解释是
**Rundstedt 出于保存装甲兵力、掩护暴露侧翼与沼泽地形不适于坦克的考虑而主动建议**，
希特勒于 5 月 24 日予以背书；
**保存装甲以备南向的『红色方案』是其中最有力的动机**。
『希特勒有意放走英军以促成和平』的说法缺乏同时代证据，
且与同日发布的第 13 号指令（要求歼灭口袋内盟军）相矛盾。
戈林建议由空军解决的说法见于记载，但其对希特勒决策的影响程度仍有争议。」

- **不确定**：**本笔记未能查到 Korth（1958）与 Jacobsen（1957）两部专著的具体页码与论点。**
  `main.json` 中已登记：
  - `korth_1958` —— Rolf Korth（前 Kleist 装甲集群 Ia）《Der Halte-Befehl vor Dünkirchen》，
    *Wehrwissenschaftliche Rundschau* 8 (1958)；
  - `jacobsen_1957` —— Hans-Adolf Jacobsen《Dünkirchen 1940: Die deutsche Führung und der
    Haltebefehl》。
  **通说认为：Korth 作为 Kleist 集群的作战参谋，其论述倾向于证明
  停止前进令来自希特勒/OKW 而非装甲集群自身；
  Jacobsen 则强调希特勒与 Rundstedt 的互动。
  但本笔记未能核实原文，故不给出论点与页码。**
  **请写手如需引用 Korth / Jacobsen，只写来源 id，不要编造页码。**
- **不确定**：**Frieser 的确切页码。** 维基对 Frieser 的引用见于
  `Frieser 2005 p.287`（`Battle_of_France.wiki` 中的引用列表）
  与 wiki:Battle_of_Dunkirk 的 `Frieser 2005 pp.291–292`
  （用于支持「逾 330,000 名盟军经敦刻尔克撤出」）。
  **CONTRACT 中出现的「frieser_2005 pp.287–296」范围合理，
  但本笔记未能逐一核实该范围内每页的具体论点。**
- **Frieser 的 Arras 论证（可用）** ——
  「2005 年，Karl-Heinz Frieser 写道，5 月 21 日法英在 Arras 的反击对德军产生了
  **不成比例的影响**，因为德军高级指挥官对侧翼安全感到忧虑。
  Kleist 感到『严重威胁』，并告知哈尔德他必须等危机解决后才能继续。
  Kluge 命令坦克停止，这一命令得到 A 集团军群司令 Rundstedt 的支持。
  5 月 22 日，当英法攻击被击退后，Rundstedt 下令必须先恢复 Arras 的局势，
  才能继续向布洛涅与加来推进。而在 OKW，恐慌更为严重，
  希特勒于 5 月 22 日联系 A 集团军群，
  命令所有机动部队在 Arras 两侧及更西面作战；步兵部队在城东作战。」
  （wiki:Siege_of_Calais_(1940) 引 Frieser 2005，confidence: **high**）。
  → **这为「Arras 反击造成的心理冲击是停止前进令远端原因之一」提供了学术支持。
  但在战役数据中呈现时，请注意这是 Frieser 的解释，不是定论。**

### 3.2 谁该为加来守军的牺牲负责

**事实链（先厘清，再争论）**

| 时刻 | 事件 | 来源 | 置信度 |
|---|---|---|---|
| 5-24 03:00 | 陆军部电 Nicholson：加来将被撤离；卸货完毕后非战斗人员登船 | wiki:Siege_of_Calais_(1940) | medium |
| 5-24 18:00 | 陆军部告 Nicholson：战斗部队须等到 **5 月 25 日** | 同上 | medium |
| 5-24（更早） | **Ironside（CIGS）** 电 Nicholson：**Fagalde 将军（法方海峡港口司令）已禁止撤离**，加来守军必须遵从；因港口已失去意义，Nicholson 应**自选最佳阵地继续战斗**；弹药会送来，但**无增援** | 同上 | medium |
| 5-24 22:30–23:30 | 法国海军炮手破坏火炮、前往码头登船；Lambertye 拒绝离开，约 50 名志愿者留下 | 同上 | medium |
| 5-24 夜 | **Somerville 海军中将**渡海会见 Nicholson；Nicholson 称若有更多火炮可再守一段时间；双方同意港内船只应返回 | 同上 | medium |
| 5-25 09:00 | Schaal 派市长 André Gerschell 劝降，Nicholson 拒绝 | 同上 | medium |
| 5-25 中午 | Schaal 再次劝降，并因使者延误而把期限延至某时，再次被拒 | 同上 | medium |
| 5-25 下午 | 德军军官携一名被俘法军军官与一名比利时士兵，打着白旗要求投降，Nicholson 拒绝 | 同上 | medium |
| 5-25 全天 | 加来守军继续抵抗；RAF 出动大量架次 | 同上 | medium |
| **5-26 08:00** | Nicholson 报告：士兵精疲力竭、坦克全失、缺水、增援无望、德军已入城北 | 同上 | medium |
| **5-26 16:00** | 防线崩溃，下达「各自逃命」；Le Tellier 投降 | 同上 | medium |
| **5-27 晨** | 英军仍守码头；约 440 人被小型海军船只撤出 | 同上；wiki:Battle_of_France | medium |

**争论的核心问题：Nicholson 是否收到过「可以撤退」的命令？**

- **本方查证到的答案**：
  1. **5 月 24 日 03:00 确实有一道「加来将被撤离」的电文**，
     但仅限**非战斗人员**；战斗部队须等到 5 月 25 日
     （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
  2. **随后 Ironside 的电文明确告知：Fagalde 已禁止撤离，守军必须遵从**
     （同上，confidence: **medium**）。
     → **这道电文是「不能撤」的正式依据，来自英方最高军职（CIGS）转述法方命令。**
  3. **5 月 26 日，15 艘小型海军船只拖带小艇在港外待命，可载约 1,800 人**；
     **其中一些船只未获撤离令即驶入加来港，另有一艘船还送来另一道
     「令 Nicholson 继续战斗」的命令**
     （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
     → **即：撤离能力存在（1,800 人的运力），但命令是「继续战斗」。**
  4. **5 月 24 日夜 Somerville 与 Nicholson 会面后，「双方同意港内船只应返回」**
     （同上，confidence: **medium**）。
  5. **5 月 26 日撤退的尝试**：皇家海军派出小型船只，**撤出约 440 人**
     （wiki:Battle_of_France；wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
     → **说明「撤」在技术上一直可行到最后一刻。**
- **不确定**：**本笔记未能查到「5 月 25 日战斗部队可以撤离」这一承诺是否被正式履行。**
  维基仅记 5-24 18:00 的电文说「须等到 25 日」，
  而 5-24 更早的 Ironside 电文又说法方禁止撤离。**两电关系与先后顺序不明。**
- **丘吉尔与战时内阁的取舍（本笔记查到的证据）**：
  - **Churchill 的公开立场**：他在《最光辉的时刻》中回应 Guderian 的质疑，
    暗示事情与停止前进令有关；**Guderian 否认**，
    并写道**加来的防御是英勇的，但对敦刻尔克事态的进程没有影响**
    （wiki:Siege_of_Calais_(1940)，confidence: **high** 之于「他说了什么」）。
  - **Ellis 的判断（与 Guderian 相反）**：
    「1966 年，英国官方历史学家 Lionel Ellis 写道，
    **加来与布洛涅的防御牵制了三个装甲师**，
    使其无法用于对付法国第一集团军与 BEF；
    当德军攻占这些港口并重新编组时，
    **III 军（Ronald Adam 中将）已西移并封锁了通往敦刻尔克的道路。**」
    （wiki:Siege_of_Calais_(1940) 引 Ellis，confidence: **high**）。
    → **这是「加来的牺牲有价值」的最权威论述。**
  - **英方内部的因果链（关键）**：
    「**关于英国人抛弃法国人的指控，可能影响了丘吉尔
    下令加来守军战斗到底。这一决定是有争议的，
    因为加来的英军在迟滞德军向敦刻尔克推进之后本可被撤离。**」
    （wiki:Battle_of_Boulogne，confidence: **medium**）。
    → **这是把布洛涅、加来、敦刻尔克三件事连起来的关键一句：
    布洛涅的「先撤」造成了政治后果，加来因此不能撤。**
  - **Nicholson 的结局** —— 「Nicholson 准将始终未能表达他的看法，
    因为他于 **1943 年 6 月 26 日**在囚禁中去世，年仅 44 岁」
    （wiki:Siege_of_Calais_(1940)，confidence: **high**）。
    → **「他从未能为自己辩护」是本节最有分量的一句。**
  - **Hoskyns 中校** —— 第 1 来复枪旅旅长，**5 月 25 日**受致命伤，
    在英国去世（wiki:Siege_of_Calais_(1940)，confidence: **high**）。
    → **注**：维基在「Casualties」段写作「5 月 25 日」，
      但在正文另处写作「5 月 25 日」（原文两处不一致，OCR 有 "25 June" 之误），
      **本笔记采信 5 月 25 日**（因正文明确记其于 5-25 15:30 前后被迫击炮弹击中）。
  - **Lambertye 的结局** —— 法国分遣队指挥官 Charles de Lambertye，
    **5 月 26 日在巡视加来防御时心脏病发去世**
    （wiki:Siege_of_Calais_(1940)，confidence: **high**）。
    → **即：他在投降当日去世，与加来共存亡。**
- **争议的双方立场总结**：

| 立场 | 论据 | 证据强度 |
|---|---|---|
| **丘吉尔/战时内阁应为牺牲负责** | 有明确记载称「抛弃法国人的指控可能影响了丘吉尔下令守到底」；撤离能力（1,800 人）一直存在；Nicholson 未能自辩 | **medium** |
| **法方（Fagalde）禁止撤离是直接原因** | Ironside 电文明确转述 Fagalde 的禁令；Nicholson 收到后必须遵从 | **medium–high** |
| **加来的抵抗有重大战略价值** | Ellis：牵制三个装甲师；使 III 军得以西移封锁通往敦刻尔克的道路 | **high**（官方战史） |
| **加来的抵抗无战略价值** | Guderian：英勇但对事态进程无影响 | **medium** |

→ **写手建议措辞**：
「加来守军没有得到撤离授权。**5 月 24 日，CIGS Ironside 电告 Nicholson，
法方海峡港口司令 Fagalde 已禁止撤离，守军必须遵从**；
同日虽有一道「加来将被撤离」的电文，但仅适用于非战斗人员。
**5 月 26 日，15 艘可载 1,800 人的海军船只已在港外待命，却送来另一道「继续战斗」的命令。**
英国官方战史家 Ellis 后来判断，**加来与布洛涅的防御牵制了三个德军装甲师**，
使 III 军得以西移封锁通往敦刻尔克的道路。
但也有记载称，**正是布洛涅「先撤」所造成的『英国人抛弃法国人』的指控，
可能促使丘吉尔下令加来守军战至最后**——
这一决定至今仍有争议，因为加来守军在迟滞德军后本可被撤离。
Nicholson 准将于 1943 年死于囚禁，从未能为自己辩护。」
（confidence: **medium**）

### 3.3 法军被「抛下」的争议

**事实链**

| 时刻 | 事件 | 来源 | 置信度 |
|---|---|---|---|
| **5-26 上午** | 英国陆军部电 Gort：「**你现在的唯一任务是尽可能多地把部队撤往英国**」 | ellis_1953 ch.11 | **high** |
| **5-26 上午** | Blanchard 第 30 号作战命令：英法比三军应形成**掩护敦刻尔克的桥头堡**，「**不存退意**」地坚守 | ellis_1953 ch.11 | **high** |
| **5-26 下午** | **在英政府决定告知法方三天之后的 5 月 29 日下午**，Weygand 才授权撤出法国第一集团军 | ellis_1953 ch.14 | **high** |
| **5-29 下午（Weygand 授权的确切文本表述）** | 「本日下午，在英国政府决定尽可能撤出 BEF 并通知法国最高统帅部三天之后，Weygand 将军授权尽可能撤出法国第一集团军」 | ellis_1953 ch.14 | **high** |
| **5-29 下午** | 此时**已有逾 70,000 名英军登船** | ellis_1953 ch.14 | **high** |
| **5-28 下午** | Gort 发布撤离顺序命令：**III 军第一、II 军第二、I 军殿后** | ellis_1953 ch.14 | **high** |
| **5-31** | 英陆军大臣：「与法军**五十五十地对等**，目标 6-01/02 夜完成」 | ellis_1953 ch.16 | **high** |
| **6-01** | 英方当日撤出 64,429 人，其中**法军 35,013 人** | dynamo_despatch App.IV | **high** |
| **6-01** | 法军约 50,000 人在阵地，80,000 人在沙丘待撤（30,000 已上船），另约 20,000 分散未计 | ellis_1953 ch.16 | **high** |
| **6-02 至 6-04** | 法军独守，掩护约 **10,000 英军与约 70,000 法军**撤离 | ellis_1953 ch.16 | **high** |
| **6-03 午夜至 0300** | **约 10,000 人的运载能力被空置**（法军未能抵达） | dynamo_despatch §85 | **high** |
| **6-04 09:00** | 剩余法军投降，**约 40,000 人**（一说 35,000） | ellis_1953 ch.16 | **medium** |

**Darlan 5 月 31 日的干预（争议的关键节点）**

- **丘吉尔的说法（这是唯一的一手依据）**：
  「据丘吉尔记载，**法国海军上将达尔朗最初曾下令英国部队应获优先权，
  但在 5 月 31 日，他在巴黎的一次会议上介入，下令撤离应**平等进行**，
  且**英国人应组成殿后**。」
  （wiki:Dunkirk_evacuation 引 Churchill 1949，confidence: **high** 之于丘吉尔如此写道；
  **medium** 之于是否为史实）。
- **不确定（重要）**：
  **本笔记未能在 Ellis 官方战史或 Ramsay 战报中找到「Darlan 5 月 31 日干预」的对应记载。**
  Ellis 记载的是**英国陆军大臣**在 5 月 31 日发出「五十五十」的指示
  （ellis_1953 ch.16，confidence: **high**）。
  **两种记载可能指的是不同的会议（英方内阁层面 vs 巴黎盟军层面），
  也可能是同一决定的两个侧面。写手请同时呈现，不要合并成一条。**
- **Darlan 干预的实际执行** ——
  「**事实上，最终在掩护最后撤离后投降的 35,000 人，
  主要是法国第 2 轻机械化师与第 68 步兵师的士兵。
  他们的抵抗使撤离行动得以延长至 6 月 4 日**，
  当日又有 **26,175 名法国人**被运往英国。」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → **注意**：此处的 **35,000** 对应的是「掩护最后撤离的殿后部队」，
    与 §2.6 中 6-04 投降总数 **40,000** 略有差异（35,000 为战斗部队，40,000 含非战斗人员）。

**英方撤离优先权的实际执行（支持英方辩护的证据）**

1. **英方确实在撤离顺序上把法军放在最后，但这是军事逻辑**：
   III 军第一、II 军第二、I 军殿后（ellis_1953 ch.14）——
   **殿后是英军自己的部队，不是法军。**
2. **5 月 31 日之后英方书面承诺「五十五十」**（ellis_1953 ch.16）。
3. **6 月 1 日法军撤离数（35,013）是整个行动的最高单日值**
   （dynamo_despatch App.IV），**超过任何一天的英军数字**。
   → **6 月 1 日当天，法军实际上是撤离的主力。**
4. **6 月 2 日凌晨 02:00，英军殿后部队被命令改从海滩（而非防波堤）登船，
   正是因为「防波堤上法军拥塞」**（dynamo_despatch §76）。
   → **即：英方在最后一刻为法军让出了防波堤。这是极强的反证材料。**
5. **6 月 3 日，英方把新外港的西码头让给法方使用，
   因为「法方船只不足以充分利用这一宝贵泊位」**（dynamo_despatch §86）。
   → **即：英方主动让出泊位容量。**
6. **6 月 4 日，英方在法方认为不可能继续的情况下又问了一次**
   （Ramsay 与 Abrial 在多佛讨论「能否再坚持一夜」），
   **是法方自己回答说「不可能」**（ellis_1953 ch.16）。
7. **法舰运力不足是硬约束**：
   法国海军共投入 **9 艘驱逐舰、4 艘 avisos、3 艘快速摩托艇、3 艘猎潜艇、
   6 艘辅助扫雷舰、167 艘拖网渔船与漂网渔船等**
   （dynamo_despatch App.IV(a)，confidence: **high**）——
   与英国投入的 **861 艘船（一说 693 艘英国船）**相比，
   **法方运力客观上远小于英方**，这是法军撤出较少的**结构性原因**，
   而不（只）是意愿问题。

**支持法方愤懑的证据**

1. **英方政策的单方面性** ——
   「在法国，**英国单方面决定通过敦刻尔克而非向南反击来撤离**，
   以及**皇家海军在撤离英国部队时优先于法国人的观感**，
   引起了一些尖锐的怨恨。」
   （wiki:Dunkirk_evacuation，confidence: **high**）。
2. **英国在未告知法比的情况下开始计划 Dynamo**（5 月 20 日）：
   「**未告知法国人**，英国于 5 月 20 日开始计划发电机行动」；
   「5 月 26 日，Anthony Eden 告诉 Gort 他可能需要『向西打回去』，
   **并命令他准备撤离计划，但不告知法国人或比利时人**」
   （wiki:Dunkirk_evacuation；wiki:Battle_of_Dunkirk，confidence: **high**）。
   → **「不告知盟友」这一点证据强度高，且极具政治分量。**
3. **法军伤亡与被俘数** —— 见 §2.6。
   **法军约 16,000 人阵亡，约 35,000–40,000 人被俘**；
   **而英军在该阶段的阵亡为 3,500 人**（wiki 口径）。
   → **若这些数字口径可比（存疑，见下），则法军阵亡数约为英军的 4.6 倍。**
4. **Ellis 本人的坦承（官方战史中的罕见自省）** ——
   「对这个非凡壮举的民族自豪感、以及对英国人的远见、技巧与勇气
   （他们使如此多人免于死亡或被俘、并把他们安全带回故乡）的持久感激，
   **不应使我们忘记或低估法国所起的作用**。
   一旦桥头堡被包围，**法军就据守着从敦刻尔克到 Mardick 的较小西段直到最后**；
   虽然英军各师主要负责防御那个包含宝贵海滩的较大东段直到 6 月 1 日，
   **但在随后两天里，是法国部队掩护了撤离**。」
   （ellis_1953 ch.16，confidence: **high**）。
   → **这是官方战史对法军贡献的最明确肯定，写手务必引用。**
5. **Ellis 对法军处境的体察** ——
   「对法国人来说，敦刻尔克意味着不同的东西。
   被运到英国的法国士兵确实避免了向敌人投降这一主要灾难，
   但为了做到这一点，**他们离开了家和法国，去面对——在他们看来——
   在一个陌生而（虽则友好）的国度里无限期的流亡。**
   一位自敦刻尔克启航的法国人写出了许多人的心声：
   『我们脚下的法国，像一块磨破的布，
   对我们的脚步来说太小而被拒绝。……
   春天的芬芳，沙子不知道：
   五月就这样死在北方的沙丘中。』」
   （ellis_1953 ch.16，confidence: **high**）。
   → **这段诗与 Ellis 的评语是本节最好的收束材料。**

**本笔记的裁决**

| 指控 | 证据强度 | 说明 |
|---|---|---|
| 「英方优先撤自己人」 | **部分成立，证据强** | 撤离顺序（III→II→I）确实先英后法；Dynamo 计划未告知法方 |
| 「英方刻意抛弃法军」 | **不成立，反证强** | 5-31 书面「五十五十」；6-1 法军撤出 35,013（单日最高）；6-2 英军为法军让出防波堤；6-3 英方让出西码头；6-4 英方又问一次 |
| 「法军撤出较少是英方意愿所致」 | **不成立，结构性原因强** | 法方运力远小于英方（9 艘驱逐舰 vs 39 艘）；Weygand 迟至 5-29 才授权 |
| 「法军承担了不成比例的殿后代价」 | **成立，证据强** | 6-02 至 6-04 法军独守；掩护 10,000 英军 + 70,000 法军；40,000 人被俘 |

### 3.4 「敦刻尔克奇迹」的史学批评：英国战时宣传与「必要的神话」

- **丘吉尔的自我校正（最权威的一手证据）** ——
  5 月 28 日，丘吉尔在下议院警告应预期「**艰难而沉重的消息**」；
  事后他把结果称为「奇迹」，而英国报界把撤退呈现为「**灾难化为胜利**」，
  成功到丘吉尔不得不在 **6 月 4 日**的下议院演讲中提醒全国：
  「**我们必须非常小心，不要把这次解脱赋予胜利的属性。战争不是靠撤退赢得的。**」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → **这三句话的次序（先警告 → 报纸欢呼 → 首相降温）本身就是「神话」形成过程的最好证据。**
- **宣传机器的具体机制** ——
  「由于战时审查制度与维持英国士气的愿望，
  敦刻尔克正在展开的灾难的全貌最初并未被公开。」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → 配合 5 月 26 日的**全国祈祷日**（威斯敏斯特大教堂特别礼拜、
  坎特伯雷大主教祈祷、「confirming to the public their suspicion of the
  desperate plight of the troops」），可以看到官方叙事的完整操作链。
- **战时意识形态分野（本节最有价值的发现）** ——
  「在英国国内，关于敦刻尔克撤退的呈现存在着尖锐的意识形态分歧。
  **左翼与自由派的当时记述，如作家 J. B. Priestley 与记者 Hilda Marchant，
  倾向于只聚焦于敦刻尔克，把它描绘为『人民战争』的开端，
  普通民众团结起来拯救 BEF。**
  **与之相对，保守派的当时记述把敦刻尔克仅仅描绘为更广泛的
  『港口之战』的一部分，其中也包括布洛涅之战与加来围城。**
  保守派的『港口之战』记述倾向于聚焦英国军队（尤其是陆军）
  在绝境中的专业精神与勇敢，把它们描绘为英国武德的象征。
  **1940 年初的保守派报刊更倾向于报道加来之战**
  ——在那里，**Claude Nicholson 准将在被告知从加来逃脱已不可能后仍选择继续战斗**
  ——而不是敦刻尔克撤退。
  **『人民战争』解读的胜利——它把与之竞争的『港口之战』解读
  在 1940 年的大众记忆中完全抹去——主要归因于电影**，
  因为电影制作者选择聚焦敦刻尔克撤退，而忽略了法国海岸沿线的其他战斗。」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → **这段是本笔记中最有分量的史学批评材料。写手可据此为战役增加
  「叙事之争」的元层面事件，或至少在 `docs` 中说明为何本战役选此视角。**
- **Priestley 的原始材料** —— BBC 档案存有
  **J. B. Priestley 的「Postscript」广播，1940 年 6 月 5 日**
  （wiki:Dunkirk_evacuation 参考文献，confidence: **high** 之于其存在）。
  → **不确定**：本笔记**未获取该广播的文本内容**。
  **写手如引用 Priestley 的原话，请先取得广播稿，不要转述二手概括。**
- **「必要的神话」（the necessary myth）** ——
  `main.json` 中登记有 **Gregory Blaxland《Destination Dunkirk》/《Dunkirk: The Necessary Myth》**
  （`blaxland_1980`）。
  → **不确定**：**本笔记未能查到 Blaxland 该书的具体论点、章节与页码。**
  「必要的神话」这一概念通常指：1940 年英国需要一个能凝聚人心的胜利叙事，
  而敦刻尔克被选中承担这一功能。
  **请写手如需引用，只写来源 id，不要编造页码或原文。**
- **当代史学对「奇迹」框架的批评（可从数据直接推出）** ——
  写手可用以下**本笔记已核实的数据**自行构成批评：
  1. 撤出 338,226 人，但**遗弃了 2,472 门火炮、63,879 辆车辆、
     20,548 辆摩托车、164,929 吨汽油**（ellis_1953 ch.23）；
  2. **BEF 战役伤亡 68,111 人**（ellis_1953 ch.23），
     另有约 40,000 人被俘（wiki）；
  3. **228 艘船损失、45 艘重创**（ellis_1953 ch.16）；
  4. **法军约 16,000 人阵亡、40,000 人被俘**（wiki）；
  5. **敦刻尔克城区 90% 被毁**（wiki:Battle_of_Dunkirk）。
  → **「奇迹」是「从失败中救出人」的奇迹，不是胜利的奇迹。
    这是数据本身支持的判断，不需要依赖任何二次文献。**
- **Andrew Roberts 的评语（可用于文案）** ——
  「**关于敦刻尔克撤退的混乱，最能说明问题的是：
  关于它的两本最好的书分别叫《奇怪的失败》与《奇怪的胜利》。**」
  （wiki:Dunkirk_evacuation，confidence: **high**）。

### 3.5 比利时投降的争议

（事实链已在 §1.3 详列，此处只做争议梳理）

**利奥波德三世的立场与决定**

- **决策过程** ——
  - **5 月 24 日** —— 利奥波德最后一次会见大臣。大臣们力劝国王随政府离境。
    **首相 Pierlot 提醒他：投降是比利时政府的决定，而不是国王的决定。**
    国王表示他已决定留在比利时与部队共存，无论结果如何。
    大臣们把这理解为「他将要在希特勒指导下建立一个新政府」，
    可能是叛国行为（wiki:Leopold_III_of_Belgium，confidence: **high**）。
  - **国王的理由** ——
    「他认为如果离开国家，自己可能会被视为逃兵：
    『**他决心留在自己的军队和人民中间，与他们共命运。**』」
    （wiki:Leopold_III_of_Belgium，confidence: **high**）。
  - **5 月 25 日** —— 利奥波德电告英王乔治六世：比军正被压垮，
    「**如果我们的军队被包围，我们给予盟军的援助将告终止**」
    （wiki:Leopold_III_of_Belgium，confidence: **high**）。
    → **这是「提前警告」的直接证据，对反驳「突然投降」的指控极为重要。**
  - **5 月 26 日中午** —— 比军司令部告知法国驻比军使团团长 Champon 将军：
    「**陆军已几乎达到其忍耐的极限**」
    （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
  - **5 月 26 日 18:00** —— 法军 Blanchard 将军亲自告知利奥波德：
    英军正在里尔—伊珀尔一线进一步后撤
    （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
  - **5 月 27 日 17:00** —— 利奥波德决定派 Derousseaux 少将前往德军第 18 集团军司令部
    （wiki:Battle_of_the_Lys_(1940)，confidence: **high**）。
  - **5 月 27 日 22:00** —— 答复：「元首要求无条件放下武器」
    （同上，confidence: **high**）。
  - **5 月 27 日 23:00** —— 利奥波德在全体参谋支持下接受，同意 **04:00 停火**
    （同上，confidence: **high**）。
  - **5 月 28 日 04:00** —— 投降生效；**06:00** 一线部队最终收到命令
    （同上，confidence: **high**）。

**比军处境的客观数据（支持「投降不可避免」）**

- 撤退不可行：**已无自然障碍物**；卢夫特瓦夫已摧毁大部分通往敦刻尔克的铁路网，
  **只剩三条公路**：Bruges–Torhout–Diksmuide、Bruges–Gistel–Nieupoort、
  Bruges–Ostend–Nieuwpoort。在德军拥有制空权的情况下使用这些撤退轴线
  **不可能不遭受损失**（wiki:German_invasion_of_Belgium_(1940)，confidence: **high**）。
- 供水被破坏切断，煤气与电力供应被切断；运河被排干用作剩余弹药与食品的堆放处
  （同上，confidence: **high**）。
- **剩余总面积仅 1,700 平方公里**，挤满了军队与约 **300 万平民**
  （同上，confidence: **high**）。
- **比利时在整场入侵中共 80,000 伤亡，其中 40,000 发生在 5 月 25–27 日之间**
  （wiki:Battle_of_the_Lys_(1940)，confidence: **medium**）。
- **比利时历史学家 Francis Balace 认为投降不可避免，因为比军已无法再与德军作战。
  连丘吉尔也承认他们的处境危急。**
  事实上，**丘吉尔在 5 月 27 日（投降前一天）致 Gort 的电报中写道：
  「我们是在要求他们为我们牺牲自己。」**
  （wiki:Leopold_III_of_Belgium，confidence: **high**）。
  → **这句「我们是在要求他们为我们牺牲自己」是本争议中最有力的英方自认，
    写手务必引用。**

**英方与法方的反应**

- **英方反应（官方克制，但私下愤怒）** ——
  - **官方克制的原因**：**5 月 28 日 11:30，Roger Keyes 爵士向战时内阁
    为比利时的防御作战作了有力辩护**
    （wiki:German_invasion_of_Belgium_(1940)，confidence: **medium**）。
  - **Gort 愤怒**；**Pownall（BEF 参谋长）**被问及是否撤离比利时人时，
    据报回答「我们他妈的一点也不在乎比利时人怎么样」
    （同上，confidence: **low**）。
  - **英军认为比利时「背叛」** ——
    「英法两国声称比利时人背叛了联盟」（wiki:German_invasion_of_Belgium_(1940)，
    confidence: **medium**）。
  - **但对「未事先警告」的指控站不住脚** ——
    「主要抱怨是比利时人没有事先警告他们的处境已严重到必须投降。
    **这类说法在很大程度上是不公正的。盟军是知道的，
    并且在 5 月 25 日通过与比利时人的接触私下承认了后者已濒于崩溃。**」
    （wiki:German_invasion_of_Belgium_(1940)，confidence: **high**）。
    → **这是本争议中最关键的一段裁决性论述。**
  - **英方对「抵抗不力」的指控同样多半错误** ——
    「比利时军队与战线的瓦解，引起了许多来自英方的错误指责。
    **事实上，比利时人多次在英军撤退之后仍然坚守。**
    一个例子是接管斯海尔德（Scheldt）防线——
    他们接替了英国第 44 步兵师，使其得以从他们的行列中撤退。」
    （wiki:German_invasion_of_Belgium_(1940)，confidence: **medium**）。
- **法方反应（激烈）** ——
  - 法国总理 **Paul Reynaud** 谴责利奥波德的投降为**叛国**
    （wiki:Leopold_III_of_Belgium，confidence: **high**）。
  - **佛兰德历史学家 Valaers 与 Van Goethem 写道，利奥波德三世成了
    「Reynaud 的替罪羊」，因为 Reynaud 很可能已经知道法国战役已经输了**
    （wiki:Leopold_III_of_Belgium，confidence: **medium**）。
  - 比利时首相 **Pierlot** 通过法国电台宣布国王的决定**违宪**，
    由此产生 `impossibilité de régner`（无法视事），
    比利时流亡政府继续抗战（同上，confidence: **high**）。
  - 一群在巴黎的比利时难民在阿尔贝国王雕像前留言，
    谴责其子为「**你不配的继承者**」（同上，confidence: **medium**）。
- **英国报界的情绪化攻击** ——
  英国报纸称他为「**叛徒国王**」与「**鼠王**」；
  《每日镜报》刊登利奥波德照片，标题「**每个女人现在都鄙视的那张脸**」
  （wiki:Leopold_III_of_Belgium，confidence: **medium**）。
- **丘吉尔的双重记录（极重要）** ——
  - **6 月 4 日下议院谴责**（全文已引于 §1.3）；
  - **1949 年回忆录中的缓和**：「关于利奥波德国王，
    我当时在下议院所用的话都在记录中，经过慎重考虑，
    我不认为有任何理由改变它们……
    所幸这一祸害被避免了，最终一切都好转了。
    **我无需说，我当时所说的任何话都不能被解释为对利奥波德国王
    个人勇气或荣誉的指责。**」
    （wiki:Leopold_III_of_Belgium，confidence: **high**）。
  → **写手可用这组对照呈现「战时宣传 vs 战后修正」的典型模式。**
- **关键法理区分（写手的定性要点）** ——
  「法国与比利时的大臣们都把利奥波德的行为称为叛国，
  **但他们不知道真实情况：利奥波德并没有与希特勒签署协议以组建合作政府，
  而是以比利时武装部队总司令的身份无条件投降。**」
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **high**）。
  → **这一区分决定了事件的 `category` 应是 `surrender` 而非 `political` 中的「通敌」。**

**本笔记的裁决**

| 指控 | 证据强度 | 结论 |
|---|---|---|
| 利奥波德「突然、无预警投降」 | **不成立** | 5-25 电告英王；5-26 中午告知法方「已达忍耐极限」；比军处境各方均知 |
| 利奥波德「为自己保王位而通敌」 | **不成立** | 他是以总司令身份无条件投降；他拒绝与纳粹合作，被软禁五年 |
| 利奥波德「违宪行事」 | **成立** | 投降是政府决定而非国王决定；Pierlot 的 `impossibilité de régner` 有法理依据 |
| 比军「抵抗不力」 | **不成立** | 比军在英军撤退后仍多次坚守；利斯河战役是 18 天战役中最血腥者 |
| 英方「有权抱怨」 | **弱** | 丘吉尔 5-27 亲笔承认「我们是在要求他们为我们牺牲自己」 |

### 3.6 本笔记新增的第六个争议：皇家空军在敦刻尔克是否失职

**这一条虽未列入任务清单，但史料显示它在本战役中极为突出，且直接关系到
「士兵对 RAF 的怨言」这一易于做成事件的主题，故补入。**

- **士兵的指控** ——
  「士兵们在等待运输时被轰炸与扫射，**大多不知道皇家空军为保护他们所做的努力，
  因为大多数空战发生在远离海滩的地方**。
  结果，许多英国士兵痛苦地指责飞行员**什么也没做**，
  据报道，一些陆军部队在返回英国后还上前辱骂皇家空军人员。」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
- **反证（证据极强，且来自海军与陆军本身）** ——
  1. **Vice-Admiral Dover 于 5 月 29 日致 Fighter Command 的电文**：
     「高级海军军官的报告称**你的协助极为宝贵**。我对你出色的配合深表感激。
     **仅此一点就给了我们成功的机会**……」
     （ellis_1953 ch.14，confidence: **high**）。
  2. **SNO Dunkirk 于 5 月 28 日结束时电告**：
     「**战斗机掩护极其宝贵……轰炸只是零星发生**」
     （ellis_1953 ch.13，confidence: **high**）。
  3. **陆军本身也承认** —— 5 月 29 日「陆军在向海岸战斗的过程中
     **在很大程度上摆脱了空袭**，并报告『今天轰炸很少』」
     （ellis_1953 ch.14，confidence: **high**）。
  4. **Ellis 的总结论证** ——
     「**敌人的攻击无法被阻止，因为他的兵力远多于与他作战的中队。
     但他的攻击被干扰、被打散到如此程度，以致他未能达成意图。
     他既不能削弱陆军的防御，也不能阻止海军的行动。
     他被阻止实现其目标这一事实，就是皇家空军成就的最好证明。**」
     （ellis_1953 ch.14，confidence: **high**）。
  5. **Ellis 对「数字不能说明成就」的警告** ——
     「必须始终认识到，准确评估与分配敌人的空中损失
     即使不是不可能，也是困难的。参与交战的飞机中，
     可能有不止一架有充分理由声称取得战果；
     而且在整个发电机行动期间，
     陆上的高射炮以及港口与海上舰只的火力也击落了一些敌机。
     **但损失并不是衡量战斗成就的真正标准。**」
     （ellis_1953 ch.14，confidence: **high**）。
  6. **皇家空军自身的努力规模** —— 5 月 26 日 16 个中队；
     5 月 27 日 16 个中队；5 月 28 日 **321 架次（创当时纪录）**；
     5 月 29 日 16 个中队；6 月 1 日 **八次扫荡，每次三到四个中队**；
     全程**逾 3,500 架次**（ellis_1953 ch.11–16；wiki:Dunkirk_evacuation）。
  7. **代价** —— RAF 在 Dynamo 九天损失 **145–177 架**飞机
     （wiki:Atkin；ellis_1953 ch.16）。
- **结构性原因（解释为何士兵觉得「没有空军」）** ——
  - **滞空时间限制**：RAF 战斗机自英国本土基地起飞，
    在敦刻尔克上空的**滞空时间极为有限**（这是本战役的经典约束）；
    **不确定**：本笔记**未能查到该限制的确切分钟数**
    （常被引用的「约 40 分钟」或「15 分钟」在本笔记查证范围内
    **未在 Ellis 或 Ramsay 战报中找到明确表述**）。
    **请写手不要编造该数字。**
  - **Ellis 的表述**：「要连续且以强大兵力飞行，超出了可用兵力之所能」
    （ellis_1953 ch.13，confidence: **high**）。
  - **巡逻编队规模**：从单中队到双中队，再到三、四中队，最大 20–44 架
    （ellis_1953 ch.12、ch.13、ch.14，confidence: **high**）。
  - **地理原因**：空战多发生在海滩之外的海上与高空，
    士兵在地面看不到（wiki:Dunkirk_evacuation，confidence: **high**）。
- **本笔记的裁决**：
  **「RAF 失职」的指控不成立，证据强度高（海军与陆军的书面感谢即为反证）；
  但士兵的感受是真实的，其成因是结构性的（滞空时间、巡逻间隔、
  空战发生地的视觉不可见性）。
  写手若做此事件，应把「指控」与「反驳」并置，
  并用 `confidence: high` 表述 RAF 的实际贡献，
  用 `confidence: high` 表述士兵怨言的存在。**

---

## 4. 地形与工程

### 4.1 敦刻尔克桥头堡的运河线：各段名称与守备部队

**总览** —— 桥头堡呈**半圆形（semicircular）**，
**法军据守西段，英军据守东段**（wiki:Battle_of_Dunkirk，confidence: **high**）。
全线「**自东面的 Nieuwpoort 起，经 Veurne、Bulskamp、Bergues，
至西面的 Gravelines**」，沿比利时海岸展开
（wiki:Battle_of_Dunkirk，confidence: **high**）。

**各段名称、走向与守备部队（按 1940 年 5 月的实际用法）**

| 段 | 1940 年 5 月的名称（英文/法文/荷文对照） | 走向与位置 | 守备部队（按时间） | 来源 | 置信度 |
|---|---|---|---|---|---|
| **西段** | **Aa 运河**（Canal de l'Aa / 荷文无对应） | 自 **Gravelines** 向东南，构成桥头堡西界 | **法军**（含法第 68 步兵师等）；5-27 夜法军撤出 Gravelines 与 Aa 河后，改守 Mardick–Spycker–Bergues 运河线 | ellis_1953 ch.12；wiki:Battle_of_Dunkirk | **high** |
| **西北段** | **Mardyck 运河**（Canal de Mardick） | 自 **Fort Mardyck / Mardick** 起，向东南接 Spycker | **法军**（Abrial 的西段） | ellis_1953 ch.12（「Mardick through Spycker to Bergues」）；ellis_1953 ch.16（「from Dunkirk to Mardick」） | **high** |
| **中段（南面）** | **Bergues 运河**（Canal de Bergues） | 经 **Spycker → Bergues** 一线，构成桥头堡南面 | **英军 I 军**（6-1 由第 46 师、第 1 师据守；**2nd Warwickshire、1st Loyals、2nd Coldstream Guards、1st Duke of Wellington's、1st East Lancashire** 等营） | ellis_1953 ch.12、ch.16；wiki:Battle_of_Dunkirk（「Bergues Canal」） | **high** |
| **中段（Bergues 以东）** | **Bergues–Furnes 运河**（Bergues–Furnes Canal） | 自 Bergues 向东北至 **Furnes（弗尔讷）** | **英军**；6-1 法军中间阵地在「英国 Bergues–Furnes 运河防线」之后 | ellis_1953 ch.16 | **high** |
| **东北段** | **Furnes 运河 / Furnes–Nieuport 运河**（Furnes–Nieuport Canal / Canal de Furnes） | 自 **Furnes** 沿法国—比利时边界向东北至 **Nieuport（尼乌波特）** 与海岸 | **英军第 3 师、第 4 师**；5-30 该段由第 7 近卫旅与第 8 旅据守；5-28 夜第 4 师接防 **Wulpen 至 Nieuport Bains** | ellis_1953 ch.13、ch.15 | **high** |
| **东段（临海）** | **Yser 运河 / 伊瑟河**（Yser / 荷文 IJzer） | 自 **Nieuport** 沿海岸向西南 | **英军第 5 师、第 42 师**（5-28 夜撤至 Yser 一线）；法军第 2 轻机械化师在 **Loo 运河**之后 | ellis_1953 ch.13 | **high** |
| **Moëres 运河** | **Canal de la Moère / Moeres**（les Moères 低地） | **Bergues 周边的低洼沼泽区**，属桥头堡内线水利系统 | 与 Bergues 防线关联；**具体守备部队未查到** | ellis_1953 未直接命名；CONTRACT §3 列有 `canal_de_la_moere` 与 `les_moeres` | **low** |
| **内线** | **Canal des Chats** | **Bergues 以北**，6-1 英军撤退后的下一道线 | **英军**（1st East Lancashire、5th Border 撤至此） | ellis_1953 ch.16 | **high** |
| **内线（法军）** | **中间阵地（intermediate line）** | **Bergues → Uxem → Ghyvelde → Basse Plaine**，再沿法国边界至海岸 | **法军**（Abrial 5-31 提出，6-1 午夜起由法军据守，掩护英军撤退） | ellis_1953 ch.16 | **high** |
| **6-3 最后防线** | **Dunkirk–Furnes 运河**（Dunkirk–Furnes Canal） | 6-3 法军被压回此线，**敌军距海滩不足两英里** | **法军** | ellis_1953 ch.16 | **high** |

**关键澄清（写手极易出错）**

- **「Bergues 运河」与「Bergues–Furnes 运河」是两段，不是一段。**
  Ellis 在同一页中并列使用：英军「据守桥头堡的南面（southern face）」，
  而东面「沿法国边界至海岸，由法国第 12 摩托化步兵师据守，
  英军第 50 师在其后方支援」，
  另有法军「在英军 **Bergues–Furnes 运河**防线后方的**中间阵地**上」
  （ellis_1953 ch.16，confidence: **high**）。
- **「Furnes 运河」中段由英军、东段由法军**：
  Ellis 记 5 月 28 日「法军第 60 步兵师……被英军（据守 **Furnes–Nieuport 运河**）收拢」
  （ellis_1953 ch.13）——即该运河由**英军**据守；
  而 6 月 1 日法军据守**中间阵地**（Uxem–Ghyvelde–Basse Plaine）
  （ellis_1953 ch.16）。**两处不矛盾，是不同日期。**
- **「Aa 运河」与「Canal de la Colme」「Canal de la Basse」** ——
  CONTRACT §3 列出 `canal_la_bassee`、`lys_canal`、`canal_de_la_colme`、
  `canal_de_bergues`、`canal_de_dunkerque`、`canal_de_la_moere`、`aa_river`。
  **本笔记确认：Aa 河（`aa_river`）在 5-27 夜后即为法军西界；
  Canal de Bergues（`canal_de_bergues`）为英军南面；
  「Canal de la Moère」（`canal_de_la_moere`）与 les Moères（`les_moeres`）
  在 Ellis 中未直接命名，仅作为 Bergues 周边的沼泽低地出现。
  写手如使用这两个 id，请在注中写明「命名依契约，Ellis 未直接使用该名称」。**
- **不确定** —— **CONTRACT §4 的 `05-28T23:00` 帧写「英军退入敦刻尔克桥头堡（运河线）」，
  锚点为 `@bourbourg` `@spycker` `@bergues` `@veurne` `@diksmuide` `@tielt`。
  史料支持 Spycker、Bergues、Veurne 三点；Bourbourg 在 5-27 夜至 5-30 期间
  为德军推进轴线之一（第 20 摩托化师方向），Diksmuide 与 Tielt 在比利时境内，
  5-28 时已为德军控制。该帧合理。**

### 4.2 东防波堤（East Mole）

**基本数据**

| 项目 | 数据 | 来源 | 置信度 |
|---|---|---|---|
| **长度** | **1,600 码（约 1,463 米，约 0.91 英里）** | ellis_1953 ch.14：「the long, narrow, eastern mole, **jutting out for 1,600 yards**」 | **high** |
| 长度（另一口径） | 「**近一英里**」（nearly a mile） | wiki:Dunkirk_evacuation | medium |
| **宽度** | **不确定** —— 本笔记**未查到确切宽度**。Ellis 称其为「狭窄的步行道」（narrow gangway）；Ramsay 称其为「瓶颈」（bottle-neck） | ellis_1953 ch.14；dynamo_despatch §23 | **low**（仅有定性描述） |
| **水深** | **不确定** —— 本笔记**未查到东防波堤旁的准确水深**。可用的间接信息：敦刻尔克海滩为「浅水」（shoal waters），大船无法靠近岸边 | dynamo_despatch §93；wiki:Dunkirk_evacuation | **low** |
| **结构** | **建于混凝土防波堤上的狭窄木板步道**（a narrow wooden walkway mounted on a concrete breakwater） | wiki:James_Campbell_Clouston | medium |
| **原始用途** | **建造目的是作为防波堤（breakwater），而不是为船只提供泊位** | ellis_1953 ch.14：「It was built as a breakwater, not to provide berthing for ships」 | **high** |
| **为何不适合靠泊** | 「**它毫无防御地裸露在外**……它经常被击中，但木板步道上的缺口很快就被修补」 | ellis_1953 ch.14 | **high** |
| **瓶颈效应** | 「敦刻尔克受制于**沿东防波堤通往登船点的狭窄跳板所形成的瓶颈**」 | dynamo_despatch §23 | **high** |

**谁发现了它的价值**

- **5 月 27 日夜（27/28 夜）** —— 「**该防波堤在前一夜被发现可以作为港口码头的实用替代品**」
  （ellis_1953 ch.13，confidence: **high**）。
  → **即：发现者是敦刻尔克现场的海军人员（Tennant 的岸勤分队），
  而不是多佛或伦敦的参谋。**
- **5 月 28 日晨** —— **Tennant 上校请求派船进入防波堤**
  （ellis_1953 ch.13，confidence: **high**）。
- **发现它的契机是负面的** —— 5 月 27 日 Tennant 判定港口本身已被炸到不能用，
  报告「**只有外防波堤与海滩可以使用**」
  （ellis_1953 ch.12，confidence: **high**）。
  → **所以「东防波堤的发现」严格说是「港口被炸毁后的唯一剩余选项被识别出来」，
  不是一个侦察发现**。这一点在常见叙事中常被简化，写手可据实呈现。
- **Ramsay 的判断（5 月 28 日）** —— 他手上「唯一的资料」显示
  **「港口入口的东码头是此类船只唯一合适的泊位，且英军士兵可以从那里上船」**
  （dynamo_despatch §17，confidence: **high**）。
  → **「唯一的资料」这一措辞说明 Ramsay 手上关于该防波堤可用性的信息本来就很少。**
- **不确定** —— **「谁先提出用东防波堤」在本笔记中未能定论。**
  - Ellis 归功于现场发现（5-27 夜）与 Tennant 的请求（5-28 晨）；
  - wiki:Dunkirk_evacuation 归功于 **Tennant**（「Tennant 最初下令从海滩撤离，
    当发现太慢后，改道至东、西防波堤以及海滩」）；
  - wiki:James_Campbell_Clouston 记 **Clouston 于 5 月 27 日「抽签赢得东防波堤」**
    的指挥权（即被分配负责该处，而非发现其价值）。
  **三个来源不矛盾但侧重不同。写手可写「5 月 27 日夜由现场海军人员发现其可用性，
  Tennant 于 28 日晨正式请求使用」。**

**每日登船人数（东防波堤）**

- **不确定** —— **本笔记未能查到「东防波堤」与「港口」的严格分日分解。**
  维基表格把「港口（Harbour）」作为一个整体列（见 §2.4），
  而东防波堤是港口登船的主要途径。
- **可用的替代数据**：
  - **「在接下来一周里，近 200,000 名部队自东防波堤登船」**
    （wiki:Dunkirk_evacuation，confidence: **medium**）；
  - **「逾 206,000 人自该防波堤被带回」**（ellis_1953 ch.13 插图说明，
    confidence: **high**）；
  - **港口总登船 239,555 人**（维基表格，confidence: **high**）。
  → **即：东防波堤贡献约 200,000–206,000 人，
    占港口总量（239,555）的约 84–86%。**这是可以直接引用的推算。
- **登船速率** —— **每小时 2,000 人**（dynamo_despatch §24，记 5 月 28 日 07:00
  SNO Dunkirk 的报告；wiki:James_Campbell_Clouston 记 Tennant 于 5 月 28 日
  估计 Clouston 正以该速率把人送走；ellis_1953 ch.13 亦记该速率）。
  → **「5 月 28 日 07:00，2,000 人/小时」是一个三方互证的硬数据，confidence: high。**
- **5 月 30 日的爆发速率** —— 一名海军军官用扩音器喊话后，
  **部队沿整个东臂小跑持续两个多小时，期间登船逾 15,000 人**
  （ellis_1953 ch.15，confidence: **high**）。
  → **即 5 月 30 日某时段速率约 7,000 人/小时以上，远高于常态。**

**Clouston 中校的组织工作**

- **身份** —— **Commander James Campbell Clouston**（1900-08-31 – **1940-06-03**），
  加拿大蒙特利尔人，英国皇家海军军官，
  在敦刻尔克撤退中担任**防波堤指挥官（pier-master）**
  （wiki:James_Campbell_Clouston，confidence: **high**）。
- **任命过程** —— 1940 年 5 月，**Isis 号在坞修理期间，
  Clouston 被配属给由 Tennant 上校指挥的、由 8 名军官与 160 名士兵组成的海军岸勤分队**。
  该分队于 **5 月 27 日** 乘驱逐舰自多佛启航。
  **三名军官抽牌决定任务分配。Clouston 抽到了东防波堤**
  ——「一条架在混凝土防波堤上的狭窄木板步道，不是为船只使用而设计的，
  但它是港口中唯一没有被卢夫特瓦夫严重轰炸的部分」
  （wiki:James_Campbell_Clouston，confidence: **high**）。
  → **「抽牌」这一细节极为生动，且是全篇中唯一一处该分队任务分配方式的记载。**
- **工作方式** —— 「在接下来的五天里，Clouston 组织并调节人员沿防波堤流向等泊船只的流动。
  **手拿扩音器，他喊出指令，使人流与船流相匹配。**
  Tennant 在 5 月 28 日估计，Clouston 正以**每小时 2,000 人**的速率把人送走。」
  （wiki:James_Campbell_Clouston，confidence: **high**）。
- **恢复秩序的原话（本笔记中最生动的一手引语之一）** ——
  当惊慌的士兵开始试图离开码头时，
  Clouston 与身边一名下级军官**举起左轮手枪**，说道：
  「**我们是来带你们回英国的。我这里有一、二、三、四、五、六发子弹，
  而且我枪法不差。我身后这位中尉枪法更好。所以这够对付你们 12 个人了。
  现在给我下到那些该死的船上去！**」
  （wiki:James_Campbell_Clouston，confidence: **high**）。
- **牺牲经过（本笔记中最完整的一段殉难记录）** ——
  - **6 月 1 日** —— Clouston 返回多佛向 Ramsay 海军中将述职
    （wiki:James_Campbell_Clouston，confidence: **high**）。
  - **6 月 2 日 15:30** —— **Clouston 与一支增援的码头分队
    乘两艘皇家空军摩托艇（编号 243 与 270）离开多佛**，
    前往参加撤离的最后一夜
    （dynamo_despatch §79，confidence: **high** —— 时刻精确到分）。
  - **在 Gravelines 外海** —— 两艇遭 **8 架 Ju 87「斯图卡」**以机枪与小炸弹攻击。
    **243 号被一枚近失弹击伤。270 号在十分钟内持续规避攻击，
    随后折返 243 号处；但 Clouston 在水中，指示 270 号继续前进。**
    驱逐舰奉命搜寻幸存者，**只找到两人**。
    **其中一人说，他看到 Clouston 已经死在水里。**
    （dynamo_despatch §79，confidence: **high**）。
  - **更详细的版本（来自 wiki，含更多人物）** ——
    两艇被击中后，Clouston 与其艇员 clinging to wreckage。
    **当另一艘艇试图救起幸存者时，Clouston 命令该艇继续前往敦刻尔克，
    并拒绝被救起，想与自己的部下留在一起。**
    一名法国联络官报告说一英里外有一艘空救生艇漂浮，
    **Sub-Lieutenant Solomon** 请求允许游过去把它带回来。
    Clouston 批准了，并决定一同前往。
    **尽管他是个游泳好手，Clouston 已精疲力竭，游回了其他人抓着的残骸处。**
    「**Clouston 的部下们唱歌、谈论往事，
    而 Clouston 则用关于救援即将到来的善意谎言鼓励他们，
    直到他与部下最终因精疲力竭与体温过低而死去。
    只有一个人，一等兵 Carmaham，幸存下来。**
    Solomon 到达了那艘空救生艇，但无法回到其他人那里。」
    （wiki:James_Campbell_Clouston，confidence: **medium**
    —— 细节丰富但可能来自回忆录式转述）。
  - **1940 年 7 月 11 日** —— Clouston **被追授「通报嘉奖」（Mention in Despatches）**
    （wiki:James_Campbell_Clouston，confidence: **high**）。
  - **埋葬地** —— 德国下萨克森州 **Becklingen 战争公墓**
    （wiki:James_Campbell_Clouston，confidence: **high**）。
  → **注**：**Ramsay 战报记载的事件日期是 6 月 2 日 15:30 出发**，
    **而 wiki:James_Campbell_Clouston 的叙述把同一事件放在
    「6 月 2 日下午」**——两者一致。
    但 **wiki 的日期条目（`death_date`）为 1940 年 6 月 3 日**，
    这是**死亡日期**（在水中挣扎至死），与出发日期（6 月 2 日）不矛盾。
    **写手请注意区分「6 月 2 日出发」与「6 月 3 日死亡」。**

**东防波堤上的其他关键人物**

- **Captain William George Tennant**（1890-01-02 – 1963-07-26），
  绰号「**Dunkirk Joe**」，**S.N.O. Dunkirk（敦刻尔克高级海军军官）**，
  在整个行动期间负责岸上指挥
  （wiki:William_Tennant_(Royal_Navy_officer)；ellis_1953 ch.16，confidence: **high**）。
  → **5 月 26 日 13:45 率 12 名军官与 160 名士兵乘 HMS Wolfhound 自多佛出发**
    （dynamo_despatch §4，confidence: **high**）。
  → **6 月 3 日凌晨与 Alexander 将军一同驶往英国**（ellis_1953 ch.16）。
- **Rear-Admiral Frederic Wake-Walker** —— 撤离部队司令；
  **HMS Keith 为其旗舰**；6 月 2 日夜「**在一艘摩托艇上于港内指挥船只**」
  （wiki:HMS_Keith；ellis_1953 ch.16，confidence: **high**）。
- **Commander H. R. Troup** —— 自**中心码头（centre pier）**指挥撤离，
  记录了 6 月 4 日 03:20 法军最后离岸的场景
  （ellis_1953 ch.16，confidence: **high**）。
- **Commander G. O. Maund** —— 6 月 1 日夜「乘一艘由荷兰海军军官指挥、
  配荷兰海军船员的摩托艇前往港口入口，引导所有船只进港就位」
  （dynamo_despatch §73，confidence: **high**）。
- **Captain J. Howson** —— 5 月 29 日 16:00 率 7 名军官与若干士兵的增援海滩分队乘
  HMS Sabre 前往敦刻尔克（dynamo_despatch §29，confidence: **high**）。
- **Captain E. Bush** —— 被派往 HMS Hebe 担任海滩外海上的 S.N.O.
  （dynamo_despatch §29，confidence: **high**）。
- **准将（Brigadier）** —— 6 月 2 日凌晨 02:00 通过 LYDD 传话，
  告知英军殿后部队必须改从海滩登船（dynamo_despatch §76，
  **姓名未在 Ramsay 战报中给出**，confidence: **high** 之于事实，
  **low** 之于身份）。

### 4.3 海滩各段

**总览**

- **「海滩」的定义** —— Ramsay 战报反复使用的表述为
  「**自敦刻尔克港入口向东绵延 10 英里的海滩**」
  （dynamo_despatch 首段，confidence: **high**）；
  更精确的作业区间表述为「**敦刻尔克以东 1.5 英里**」
  （dynamo_despatch §16、§68、§72，confidence: **high**）。
  → **注意这两个数字不同：前者是「海滩总长约 10 英里」，
  后者是「最后一夜集中作业的那一段长 1.5 英里」。写手勿混。**
- **Ellis 的表述** —— 「海滩自敦刻尔克沿海岸延伸至 **La Panne** 及更远处，
  约 **96,000** 人自此被带回英国」
  （ellis_1953 ch.13 插图说明，confidence: **high**）。

**各段（自西南向东北）**

| 段 | 位置与性质 | 关键事实与时刻 | 来源 | 置信度 |
|---|---|---|---|---|
| **Malo-les-Bains（马洛莱班）** | 敦刻尔克市区东郊，**紧邻东防波堤岸端** | **6 月 1 日最后仍在我方手中的唯一海滩**（「the only beach (Male les Bains) which now remained in our hands」）；**Skipjack 在此装载部队三个多小时后被炸沉，船上约 275 人几乎全部在下层甲板，几无逃生机会**；水与食物直到 **5 月 30 日**才送达 | ellis_1953 ch.16（三处），confidence: **high** | **high** |
| **Bray-Dunes（布赖迪讷）** | 敦刻尔克以东约 8 km，法比边界法国一侧 | **Wakeful 于 5 月 28 日 23:00 在此装载约 640–650 名部队后驶往多佛**；**5 月 28 日 18:30 Grafton 报告「Bray 海滩上还有数千名部队，且还有更多人在到达」**；Pangbourne 在此装人时被近失弹**两侧夹击，13 人阵亡、11 人受伤，罗经损坏**；**士兵用废弃车辆在低潮时打入沙滩、以沙袋锚固、再用木板走道连起来，搭建了临时栈桥** | ellis_1953 ch.14；dynamo_despatch §18、§28、§103；wiki:Dunkirk_evacuation | **high** |
| **Zuydcoote（聚德科特）** | Bray-Dunes 东北，法国境内 | **Zuydcoote Pass（聚德科特水道）** 是 Route Y 的关键隘口；**5 月 29 日中午前后 Nieuport 附近德军岸炮开始间歇炮击该水道**，使其「太窄，无法给船只提供合理的闯过火网的机会」 | dynamo_despatch §3、§7、§28、§30 | **high** |
| **La Panne（拉帕讷，比利时 De Panne）** | 法比边界比利时一侧 | **5 月 29 日 Grafton 曾在此与 Bray 撤出逾 1,600 人**；**Gracie Fields 载约 750 名自 La Panne 海滩上船的部队后被击中**；**5 月 31 日 La Panne 剩余约 6,000 人步行 10 英里前往敦刻尔克**；**Calcutta 于 5 月 29 日中午前后靠上 La Panne 海滩，自各扫雷舰接下 1,200 人**；**5 月 28 日比利时投降后，La Panne 海滩很快将被德军炮火覆盖** | ellis_1953 ch.13、ch.14、ch.15；dynamo_despatch §28 | **high** |
| **De Panne（德帕讷）** | 即 La Panne 的荷文名，同一地点 | **士兵在 De Panne（比利时）与 Bray-Dunes 用废弃车辆搭建临时栈桥**；**Medway Queen 首航自 De Panne 海滩以救生艇接下约 600 名士兵** | wiki:Dunkirk_evacuation；wiki:PS_Medway_Queen | **high** |

**海滩作业的困难（按来源逐条列出）**

1. **浅滩 / 浅水** —— 「敦刻尔克海滩的浅水区使任何大船都无法靠近岸边」；
   「**连小船也必须在距水线约 [某距离] 处停下，等待士兵涉水出来**」
   （ellis_1953 ch.12；wiki:Dunkirk_evacuation，confidence: **high**）。
   → **不确定**：维基原文该处的具体距离被模板吞掉了，本笔记**无法给出确切米数**。
2. **沙洲** —— 「**Ruytingen 与 Dyck 水道受法国雷区遮蔽**」
   （dynamo_despatch §28，confidence: **high**）；
   Ellis 记一艘被炸沉的汽船「**搁在沙洲上**」（sitting on the sand bank），
   成为诱饵吸收了 **24 次空袭**
   （ellis_1953 ch.15，confidence: **high**）。
3. **潮汐** —— 「**随着潮水上涨，天气有望好转、海浪有望减小**」
   （dynamo_despatch §23，confidence: **high**）；
   「**后续撤离者不得不等待小艇随潮水漂回岸边**才能使用」
   （wiki:Dunkirk_evacuation，confidence: **high**）。
4. **海浪 / 碎浪（surf）** —— 「海滩上中等的碎浪降低了登船速率，
   使小艇艇员精疲力竭——他们大多是『只志愿参加敌对行动』的评级兵，
   使整个行动缓慢而困难」（dynamo_despatch §12，confidence: **high**）；
   「**海上起了涌浪，使海滩上掀起碎浪，导致许多小艇在缺乏经验士兵的手中倾覆**」
   （ellis_1953 ch.13，confidence: **high**）；
   「**整个撤退期间只有三天海上起了小浪，使海滩小艇作业困难、一度完全不可能**」
   （ellis_1953 ch.15，confidence: **high**）。
5. **离岸障碍物** —— 「**被遗弃在高潮线以下的废弃卡车被证明是小艇的严重危险**」；
   「**另一大麻烦是近岸大量的漂浮草绳**……
   以及部队在撤离途中抛弃的军装外套等装备。
   **大量小型动力艇因这类绳索与衣物缠住螺旋桨而暂时失去战斗力，
   通常在失控时倾覆沉没。**」
   （dynamo_despatch §99，confidence: **high**）。
   → **「漂浮草绳缠螺旋桨」是一个极具体、罕见的工程细节，写手可用于海军层文案。**
6. **缺水** —— 见 §1.3 与 §1.4。
7. **组织问题** —— 「在最初几天，在战斗部队到达之前，
   **军事训练不足、指挥不到位、海军海滩分队不足与小艇短缺，
   导致后方地区来的人员中出现混乱场面**；
   法军部队不愿遵从英军命令，加剧了混乱。
   **没有驾船经验的人员的无能与熟练水手的短缺，
   有时导致小艇的浪费性损失**，失误与挫折也不少。
   **但所有这一切都被克服了。**」
   （ellis_1953 ch.16，confidence: **high**）。
   → **这是官方战史对「混乱」的最权威承认与限定，写手引用时务必带上最后一句。**

### 4.4 三条航线（Route X / Y / Z）

**各航线的海里数、单程时间与风险**

| 维度 | **Route Z（南路）** | **Route X（中路）** | **Route Y（北路）** |
|---|---|---|---|
| **海里数** | **39 海里**（ellis_1953 ch.12，confidence: **high**） | 本笔记**未查到 X 的绝对海里数**。可用间接数据：**往返由 172 英里缩短至 108 英里**（即往返 108 英里 = 单程约 54 英里 ≈ 47 海里）（dynamo_despatch §3） | **87 海里**（ellis_1953 ch.12，confidence: **high**） |
| **单程时间** | **约 2 小时**（因 Y 为 4 小时且是 Z 的两倍 ——「using this route increased the sailing time to four hours, double the time required for Route Z」，wiki:Dunkirk_evacuation） | 介于两者之间 | **约 4 小时**（wiki:Dunkirk_evacuation，confidence: **medium**） |
| **往返里程（Ramsay 口径）** | **80 英里**（常规多佛—敦刻尔克航道） | **108 英里**（经扫雷后）；**172 英里**（在此之前的 Zuydecoote Pass 绕行） | **172 英里**（与 Zuydecoote Pass 绕行同值） |
| **走向** | 紧贴法国海岸（经加来外海），最短路程 | **自敦刻尔克向北 26 海里**，经 **Ruytingen Pass**，驶向 **North Goodwin 灯船**，再向南绕过 **Goodwin Sands** 到多佛（wiki:Dunkirk_evacuation） | 沿法国海岸至 **Bray-Dunes**，转向东北至 **Kwinte 浮标**，在此作约 **135 度**转向，向西驶至 North Goodwin 灯船，再向南绕 Goodwin Sands 到多佛（wiki:Dunkirk_evacuation） |
| **主要风险** | **岸炮**（加来、Gravelines、Les Hemmes 一带）；**白天完全不可用** | **水雷**（「穿越英吉利海峡中一段布雷特别密集的水域」）；**沙洲**；**1 日之后 Gravelines 岸炮** | **德国水面舰艇（E-boat / MTB）**；**潜艇**；**卢夫特瓦夫**；**Nieuport 岸炮**（5 月 29 日起威胁 Zuydecoote Pass） |
| **使用时段** | 行动开始时**只能夜间使用**（dynamo_despatch §7(d)）；5 月 28 日起「**凡自多佛前往敦刻尔克的船只，只要从 6 号加来浮标到敦刻尔克一段能在黑暗中通过，均应使用南路 Z**」（dynamo_despatch §17） | **5 月 29 日下午 16:06 全面启用**。此前：**5 月 29 日下午起对驱逐舰开放**；**16:06「新 X 航道已完全扫清，Vice-Admiral 令所有船只使用 X 航道，并注意航行安全」**（dynamo_despatch §28） | **5 月 27 日启用**（Route Z 因加来失守而白天不可用后）（ellis_1953 ch.12） |
| **何时失效** | —— | **6 月 1 日 15:00 后**，Gravelines 附近的德军炮台把 X 航道进入敦刻尔克锚地的出口置于炮火之下；**与敌机攻击的结果一并导致白昼交通完全中止**（dynamo_despatch §7(d) 与 §65） | **5 月 29 日中午前后**，Nieuport 附近德军岸炮开始间歇炮击 Zuydecoote Pass（dynamo_despatch §28） |

**各风险的具体证据**

- **岸炮（Shore Artillery）** —— Ramsay 的权威总结：
  「行动开始时，发现**南路 Z 受加来附近炮台的火力威胁，因此只能夜间使用**。
  **北路 Y 后来也只能夜间使用**——当 Nieuport 附近的炮台把火力转向
  **Zuydecoote Pass** 时，该水道**太窄，无法为船只提供合理的闯过火网的机会**。
  到这时 X 航道已可使用，且**在 6 月 1 日星期六下午，
  格拉沃利讷附近的德军炮台把 X 航道进入敦刻尔克锚地的出口置于炮火之下之前，
  X 航道一直不受炮火威胁**。
  这与敌方空袭的结果一并，**导致了白昼交通的完全中止**。」
  （dynamo_despatch §7(d)，confidence: **high**）。
  → **这是三条航线命运最完整的一手叙述，强烈建议写手整体引用。**
- **水雷** —— 「敌机此时正在多佛与敦刻尔克的接近水域布设磁性水雷」；
  **整个撤退期间只有一艘其他船只因同样原因被毁**（除 Mona's Queen 外）
  （ellis_1953 ch.14，confidence: **high**）。
- **E-boat / MTB** —— 「（c）MTB 攻击。**在使用北路 Y 期间，
  这些攻击造成 4 起伤亡，即两艘驱逐舰与两艘拖网渔船。**
  当中路 X（向西南再远 26 海里）投入使用后，
  **敌方 MTB 部队未能跟进**，尽管夜间无护航的连续交通流
  与停泊在敦刻尔克锚地的船只，对任何有进取心的指挥官来说都是诱人的目标。」
  （dynamo_despatch §7(c)，confidence: **high**）。
  → **「E-boat 攻击造成 4 起伤亡（2 驱逐舰 + 2 拖网渔船）」是具体的战损数字。**
  → **同时注意：Ramsay 说「敌方 MTB 部队未能跟进」——
    这是英方对其反制措施（改走 X 航道）成功的评估。**
- **潜艇** —— 「U 艇似乎没有造成任何伤亡。
  据信存在的那一艘不太可能越过北路 Y 更远处。
  **它很可能布设了系泊水雷，据信这导致了两艘反潜拖网渔船的损失。**」
  （dynamo_despatch §7(e)，confidence: **high**）。
  → **注意**：Ellis 记载 Grafton 被「U.69」击沉（ellis_1953 ch.14），
    而维基记载为「U-62」（wiki:HMS_Grafton）。
    **Ramsay 战报说「U 艇似乎没有造成任何伤亡」，
    这与 Grafton / Wakeful 的实际损失明显不符**
    —— Ramsay 的报告成文于 1940 年 6 月 18 日，
    当时对 Grafton 沉没原因的判断可能尚未确定。
    **写手引用 Ramsay 的 U 艇结论时，必须同时指出 Grafton 沉没原因的争议。**
- **空袭** —— 见 §1.4 与 §1.7。

**航线图与图例**

- Ellis 官方战史包含 **地图 xii「Sea Routes from Dunkirk」（自敦刻尔克的海上航线）**
  与 **地图 xiii「Dunkirk Harbour」（敦刻尔克港）**
  （ellis_index，confidence: **high**）。
- Ramsay 战报附录含航线图（原文注：「**关于 X、Y、Z 三条航线见图**」）
  （dynamo_despatch §7 脚注，confidence: **high**）。
- **不确定** —— **CONTRACT §7 给出的航线公里数
  （Z 55 km / X 95 km / Y 175 km）为直线距离换算，
  与「39 / [约 47] / 87 海里」（≈72 / 87 / 161 km）不一致。**
  **写手请以海里数为准，或注明 CONTRACT 的数字是地图上的示意长度。**

### 4.5 德国空军使用的机场

**确定的信息**

| 单位 | 机场 | 距敦刻尔克 | 来源 | 置信度 |
|---|---|---|---|---|
| **Stab./KG 54、I./KG 54** | **Quakenbrück**（德国西北部） | 约 400 km（**远距离**，须转场） | wiki:Kampfgeschwader_54 | **high** |
| **II./KG 54** | **Varrelbusch**（德国）→ 5 月 17 日转 **Gütersloh** | 约 400 km | wiki:Kampfgeschwader_54 | medium |
| **III./KG 54** | **Cologne（科隆）与 Ostheim** | 约 350 km | wiki:Kampfgeschwader_54 | **high** |
| **JG 27（Stab 与 I. Gruppe）** | 5 月 22 日后「**迁入加来海峡（Pas de Calais）周边的基地**」 | **约 30–60 km** | wiki:Jagdgeschwader_27 | **high** |
| **JG 27 的 III. Gruppe** | **Guînes**（加来附近） | 约 30 km | wiki:Jagdgeschwader_27 | medium |
| **JG 1（配属 JG 27）** | 自 **Monchy-Breton** 前沿机场起飞 | 约 70 km | wiki:Siege_of_Calais_(1940) | medium |
| **JG 2** | 「**也驻扎在附近的南方**」 | 不详 | wiki:Siege_of_Calais_(1940) | low |
| **VIII 航空军（Richthofen）** | 支援 A 集团军群（并支援 B 集团军群） | —— | wiki:Sturzkampfgeschwader_2；wiki:Jagdgeschwader_27 | **high** |
| **KG 3** | 「6 月时其各 Gruppe 位于不明基地。**可能仍从德国境内起飞**」 | 约 400+ km | wiki:Kampfgeschwader_3 | medium |

- **不确定（重要）** —— **本笔记未能找到一份完整的「德国空军用于敦刻尔克作战的机场清单
  及其与敦刻尔克的准确公里数」。**
  已知的确定机场只有：**Quakenbrück、Varrelbusch、Gütersloh、Cologne/Ostheim（KG 54）；
  Guînes、Monchy-Breton（JG 27/JG 1）；Pas de Calais 周边的未具名机场（JG 27）。**
  → **CONTRACT §3 列有 `merville_airfield`、`saint_omer_airfield`、`lille_airfield`、
    `cambrai_airfield`、`laon_couvron`、`ursel`（比）、`brussels_airfield`。
    本笔记未能核实这些机场在 5 月 26 日–6 月 4 日期间具体由哪些 Luftwaffe 单位使用。
    写手如使用，请在 note 中标注不确定。**
- **可用的间接信息** ——
  - **KG 54 的 I. Gruppe 在 5 月 20–26 日轰炸了 Norrent-Fontes 与 St. Omer 的机场**
    （wiki:Kampfgeschwader_54）——**这些是盟军机场，不是德军基地**，
    但说明 **St. Omer 机场在 5 月下旬易手**。
  - **StG 2 的 I./StG 2 在 10 月（1939）位于 Cologne（科隆），属第 8 航空军**
    （wiki:Sturzkampfgeschwader_2）——**1939 年的位置，不代表 1940 年 5 月**。
    **写手切勿把 1939 年的基地用于 1940 年 5 月。**
  - **JG 27 的 I./JG 27 在 5 月 10 日位于 Mönchengladbach**
    （wiki:Jagdgeschwader_27）——同样为 5 月 10 日的位置。

### 4.6 皇家空军从英国本土出击的机场与滞空时间限制

**确定的机场（CONTRACT §3 已列出，本笔记核对可用性）**

| 机场 | 在 5 月 26 日–6 月 4 日的角色 | 来源 | 置信度 |
|---|---|---|---|
| **Hawkinge**（肯特，距敦刻尔克最近的前沿机场，约 65 km 直线） | RAF 战斗机前进机场 | CONTRACT §3；terraine_1985；franks_2006 | medium |
| **Manston**（肯特） | 前沿机场，曾被轰炸 | 同上 | medium |
| **Biggin Hill、Hornchurch、North Weald、Debden、Tangmere、Kenley** | No. 11 Group 主力基地 | 同上；wiki:No._11_Group_RAF | **high**（作为 No. 11 Group 基地） |
| **Dover（Dover 指挥部）** | Ramsay 的指挥部所在地（**Dover Castle 地下**） | ellis_1953 ch.12；wiki:Bertram_Ramsay | **high** |

- **Ramsay 指挥部的准确位置** ——
  「**这项计划由多佛城堡地下的海军司令部内的 Bertram Ramsay 海军中将主持**，
  他在行动进行期间就在那里向丘吉尔汇报」
  （wiki:Dunkirk_evacuation，confidence: **high**）。
  → **对应 CONTRACT §3 的 `dover_castle` 与 `dover`。**
- **不确定** —— **本笔记未能查到 5 月 26 日–6 月 4 日期间
  No. 11 Group 各中队逐日的基地分配表。**
  Ellis 给出了参与的中队编号（见下），但**未给出各中队的基地**。
  **请写手不要编造中队与机场的对应关系。**

**参与的中队（Ellis 与维基给出的编号）**

- **Ellis 明确列出的中队**：**第 74、145、601、56、610 中队**（5 月 27 日战斗）；
  **第 213、229、242、616 中队**（5 月 28 日各出动三次）
  （ellis_1953 ch.12、ch.13，confidence: **high**）。
- **维基提到**：**第 92 中队**（5 月 20 日在加来击落 4 架 Bf 109）；
  **第 17、605、54、264 中队**（加来）；
  **第 151 中队**（5 月 22 日 06:00 在加来与布洛涅之间击落一架 Ju 88）
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **CONTRACT §5.2 已列出的中队**：第 1、17、19、32、54、64、74、92、145、213、222、
  601、605 中队。**本笔记未逐一核实其是否都参与了 Dynamo。**
  **写手如全部使用，请在 note 中标注「按契约列出，未逐一核实参战」。**

**滞空时间限制**

- **Ellis 的定性表述** ——
  「**要连续且以强大兵力飞行，超出了可用兵力之所能**」
  （ellis_1953 ch.13，confidence: **high**）。
- **Ramsay 的定性表述** ——
  「**皇家空军的资源不足以提供持续空中掩护**，
  只能在 Vice-Admiral 估计船只最集中的时段提供持续战斗机保护，
  在不那么重要的时段则放弃全面掩护」
  （dynamo_despatch §24，confidence: **high**）。
  → **即：RAF 采用的是「按需覆盖」而非「全程覆盖」，这是资源限制下的主动取舍。**
- **空战发生地的视觉不可见性（士兵怨言的成因）** ——
  「**大多数空战发生在远离海滩的地方**」（wiki:Dunkirk_evacuation，confidence: **high**）。
- **不确定（极其重要）** ——
  **常被引用的「敦刻尔克上空的滞空时间约 40 分钟」或「15 分钟」
  这一数字，本笔记未能在 Ellis 官方战史、Ramsay 战报
  或任何可核实来源中找到明确表述。**
  **请写手绝对不要编造该分钟数。** 可用的替代表述：
  「自英国本土基地起飞的战斗机在敦刻尔克上空的滞空时间极为有限，
  因此只能以有限的巡逻编队间歇覆盖（ellis_1953 ch.13；dynamo_despatch §24）」。

### 4.7 其他工程细节

- **敦刻尔克港口结构** ——
  「一条狭窄的堤道把海滩与长长的东防波堤连接起来。
  该防波堤保护着入口航道，航道经灯塔通往港口的主要船坞与码头。
  **逾 206,000 人自该防波堤被带回。**
  这张照片显示，当船只通过狭窄航道、在外港机动、
  或在部队登船时停靠在防波堤旁时，它们是多么残酷地暴露在敌方轰炸机
  与岸基火炮之下。」
  （ellis_1953 ch.13 插图说明，confidence: **high**）。
  → **「狭窄的堤道连接海滩与东防波堤」是理解海滩与防波堤关系的关键，
    也是 CONTRACT §3 中 `east_mole`、`west_mole`、`dunkirk_port`、
    `dunkirk_roads`、`fort_des_dunes` 等地名的作用所在。**
- **港口设施的爆破** —— **6 月 2 日**一支海军爆破分队对港口设施实施爆破，
  并安排好在最后一次撤离后封锁港口入口
  （ellis_1953 ch.16，confidence: **high**）。
- **阻塞船** —— **6 月 3 日夜**，三艘阻塞船由 **Shikari** 引导驶往敦刻尔克；
  **一艘在敦刻尔克外触雷，另两艘在航道中自沉，
  位置紧接前一夜沉没的同类船只**（ellis_1953 ch.16，confidence: **high**）。
- **禁航措施** —— 康沃尔方面，6 月 10 日「**HMS ......（Garnon-Williams 上校）
  护送三艘阻塞船前往迪耶普。两艘沉在接近航道中，
  第三艘在港外触雷，未能沉在内港入口**」
  （wiki:Operation_Aerial，confidence: **high**）——**这是迪耶普，非敦刻尔克，
  但显示了同一套港口封锁战术，可作对照。**
- **Ramsgate 的后勤量（极具体的工程/后勤数据）** ——
  - **约 1,000 张海图**由 Ramsgate 海军控制处发给参与船只，
    其中约 **600 张**为那些既无平行尺又无分规的指挥官预先标好航线，
    另有约 **500 套航线指示**；
  - **5 月 26 日至 6 月 4 日期间，在 Ramsgate 处理各种故障
    （动力、发动机、电气）的船只达 170 艘**，
    其中包括荷兰 skoots、拖船、漂网渔船、拖网渔船、
    摩托驳船、渡轮浮筒以及各种类型的摩托艇；
  - **所有小艇最初都没有武装。75 艘较大的摩托艇、skoots 与拖船
    在 Ramsgate 装了路易斯轻机枪防空**，这些武器在行动期间视需要在船只之间转移；
    **23 名路易斯机枪手自伦敦抵达，另有 2 名军官与 12 名皇家陆军勤务团学员**
    在 Ramsgate 受雇从事该勤务。
  - **当英国战斗部队在后期被撤离时，士兵们总是架起并操作他们的布伦机枪
    作为所乘船只的防空武器。**
  （dynamo_despatch §96，confidence: **high**）。
  → **「75 艘船装了路易斯机枪」「170 艘船在 Ramsgate 修过」
    「1,000 张海图、600 张预先标好航线」是一组极佳的「后勤即战斗」数据。**
- **小艇的适航性问题（技术细节）** ——
  - 「**许多船完全不适合在开阔海滩作业**。例如，
    一支由 **6 艘泰晤士河口 Bawley 渔船**组成的船队自 Southend 被护送过来，
    **5 月 31 日 19:30 抵达敦刻尔克海滩，
    但由于涌浪与许多近岸障碍物（如半沉的卡车），
    被认为不可能让这些船抢滩。**
    Bawley 船因此绕到敦刻尔克港东码头外侧，
    开始向停在港口入口外的空 skoots 摆渡。
    **码头外侧的涌浪使登船作业过于困难**，
    于是 Bawley 船驶入敦刻尔克港内，主要在内港作业——**而内港正遭猛烈炮击**。
    所有 Bawley 船都装满了人，**约 6 月 1 日 03:00 离港**。
    **6 月 1 日 09:30 抵达 Ramsgate 时，这些船已损坏到不适于继续使用。**」
    （dynamo_despatch §97，confidence: **high**）。
    → **「6 艘 Bawley 船、5-31 19:30 到、6-1 03:00 离、6-1 09:30 到、
      损坏不可再用」是一段完整的、可精确引用的一手记录。**
  - 「这些船的船员行为堪称典范。**他们都是自愿者，在一天之内被紧急派往敦刻尔克，
    他们中可能没有一个人曾在炮火下待过，也肯定没有一个人受过海军纪律约束。
    这些船是泰晤士河口的渔船，从未离开过河口，
    只有一名船员此前到过比 Ramsgate 更远的地方。
    尽管如此，在一位皇家海军志愿后备队少尉的指挥下，
    他们在炮火与飞机攻击下，日夜保持着完美的队形，
    所有命令都被极其勤勉地执行。**」
    （dynamo_despatch §97，confidence: **high**）。
  - **航行工具之简陋** ——
    「**罗经精度可疑，除了一支铅笔之外没有任何导航仪器**，
    一旦某艘船与主船队失去联系，
    **在海峡的强潮流中正确找到陆地**的机会微乎其微。
    **许多小艇连罗经都没有**，
    但所有安全离开佛兰德海岸的船都设法抵达英国海岸加油，
    其中大多数又出发重复这一冒险。
    **发生过小艇试图进入加来而非敦刻尔克的案例，
    他们在那里受到了德国人的热烈接待**；
    还有一个案例是在 Gravelines 与加来之间找到陆地，
    指挥官少尉登陆后**发现有必要在离开前往正确目的地敦刻尔克之前
    射杀两名德国士兵**。」
    （dynamo_despatch §98，confidence: **high**）。
    → **「一支铅笔、没有罗经」是本笔记中最有力的「小船」意象。**
  - **最有效的小艇类型** ——
    「在可用的动力艇中，**最有用、最合适的是 A.L.C.（突击登陆艇）、
    M.L.C.（机械化车辆登陆艇）以及小型的皇家全国救生艇协会救生艇。**
    **高速勤务摩托艇，如 Dolphin 号与 Excellent 号的艇，
    以及皇家空军的水上飞机供应艇，被证明不适合在背风岸的浅水中作业**，
    因为它们的螺旋桨与舵易损，且低速时操纵性差。」
    （dynamo_despatch §104，confidence: **high**）。
  - **最佳民用船只表现** ——
    「在民用船员操作的船只中，**表现最好者之一是
    伦敦消防队的消防浮船 Massey Shaw。**
    其全部志愿船员都是伦敦消防队或辅助消防队的成员，
    **在他们的精良船只上完成了 4 次往返海滩。**
    还应提到**皇家全国救生艇协会 Ramsgate 与 Margate 救生艇的船员**，
    他们把救生艇开到了敦刻尔克。」
    （dynamo_despatch §105，confidence: **high**）。
  - **「一只 35 英尺摩托艇摆渡了 600 人上运输船，并直接载运 420 人回英国」**
    （dynamo_despatch §99，confidence: **high**）。
  - **Javelin 与 Jaguar 的艇（5 月 28 日）** ——
    「**当它们的两艘摩托艇与两艘捕鲸艇最初在近海搁浅时，
    被士兵们冲上去并弄翻。秩序恢复后，必须把艇里的水舀出去、
    重新启动湿了的发动机，此后这几艘艇在持续的轰炸攻击中
    于短时间内装载了 700 名部队。**」
    （dynamo_despatch §103，confidence: **high**）。
  - **荷兰 skoots（40 艘）** ——
    「**一支重要船队由 40 艘荷兰摩托沿岸船组成**（本报告中称为 skoots），
    **其中 21 艘在 Tilbury 与 Sheerness 服役，19 艘在 Poole。**
    所有这些船最终都抵达佛兰德海岸，并以不同程度的效果作业，
    通常取决于其奇特发动机在海军司炉兵操作下的可靠性。
    **它们太大，除了在最有利的条件下不能用作抢滩船，
    因此主要用作小艇与近海军舰之间的中介，以减少划艇必须航行的距离**，
    并定期在滩头作业停止或接收军舰暂时减少时满载返回英国。
    **其中一些 skoots 在行动过程中运送了 1,000 名以上的部队。**」
    （dynamo_despatch §110，confidence: **high**）。
  - **参战人员的疲劳** —— 「**约 30 名海军军官与 320 名士兵
    在不同时期被派往敦刻尔克的码头分队与岸上信号站以及海滩分队。
    一大批人在不间断的空袭下连续工作七天，没有换班或休息。**」
    （dynamo_despatch §112，confidence: **high**）。
  - **空袭下小艇的纪律** ——
    「在这些火力下，**没有发生过小艇在岸上还能看到船只时停止工作的情况**，
    小艇向西移动远离火区，**只在岸上军事形势要求时才发生**。」
    （dynamo_despatch §94 末段，confidence: **high**，OCR 略有残缺）。
  - **最后一次撤离时仍在港内作业的摩托艇** ——
    「值得注意的是，在最后两艘驱逐舰于 **0340** 离开之后，
    **一批较大的摩托艇继续在敦刻尔克港内作业，
    直到它们遭到已突入敦刻尔克某些地点的德军部队的轻武器射击才离开。**」
    （dynamo_despatch §111，confidence: **high**）。


---

## 5. 人物与细节

> **本节格式**：每条给出 **[时刻] · [地点] · [人物全名与军衔] · [事实] · [来源] · [置信度]**。
> 标注「★」者为本笔记认为最适合直接改写为事件文案的素材。

### 5.1 指挥层（英方）

**★ Captain William George Tennant（坦南特上校，后为海军上将）**

- **全名与军衔**：William George Tennant，**Captain, Royal Navy**（最终军衔 Admiral），
  1890-01-02 生于 Upton-upon-Severn，1963-07-26 卒于伍斯特。
  绰号「**Dunkirk Joe**」（wiki:William_Tennant，confidence: **high**）。
- **职务**：**S.N.O. Dunkirk（敦刻尔克高级海军军官）**，即 Force A 的岸上总指挥。
- **时刻线**：
  - **5-26 13:45** —— 率 **12 名军官与 160 名士兵**的海军海滩与码头分队，
    乘 **HMS Wolfhound** 自多佛启航
    （dynamo_despatch §4，confidence: **high**）。
  - **5-26 16:00–18:00** —— 途中遭俯冲轰炸机**每半小时一次**的攻击
    （dynamo_despatch §4，confidence: **high**）。
  - **5-26 20:05** —— 抵埠后立即发报：港口整日被炸、正在燃烧，
    **只能从港东侧海滩 A.B.C.D. 登船**
    （dynamo_despatch §8，confidence: **high**）。
  - **5-27** —— 判定港口已不可用，报告**只有外防波堤与海滩可以使用**，
    要求立即派出所有可用船只，因为「明晚的撤离前景未定」
    （ellis_1953 ch.12，confidence: **high**）。
  - **5-28 晨** —— **请求派船进入东防波堤**
    （ellis_1953 ch.13，confidence: **high**）。
  - **5-28 07:00** —— 其报告确立了 **2,000 人/小时**的登船速率
    （dynamo_despatch §24，confidence: **high**）。
  - **6-2 夜** —— **在岸上指挥作业**（Wake-Walker 在摩托艇上指挥船只）
    （ellis_1953 ch.16，confidence: **high**）。
  - **6-3 凌晨** —— **与 Alexander 将军一同驶往英国**
    （ellis_1953 ch.16，confidence: **high**）。
- **★ 文案要点**：他是在**港口被炸毁的那一刻**做出关键判断的人。
  他的价值不在于「发现了防波堤很好用」，而在于
  **在港口被判定不可用之后，没有让撤退停下来**。

**★ Commander James Campbell Clouston（克劳斯顿中校）**

- 详见 §4.2。**核心素材**：
  - **5-27** 与另两名军官**抽牌**，抽到东防波堤（wiki:James_Campbell_Clouston）。
  - **「我这里有六发子弹……我身后这位中尉枪法更好。所以这够对付你们 12 个人了。
    现在给我下到那些该死的船上去！」**（同上）。
  - **6-2 15:30** 乘皇家空军摩托艇 243、270 号自多佛出发；
    在 Gravelines 外海遭 8 架 Ju 87 攻击；
    **把救生机会让给部下，命令另一艘艇继续前往敦刻尔克**；
    **6-3 与部下一起死于精疲力竭与体温过低**
    （dynamo_despatch §79；wiki:James_Campbell_Clouston）。
  - **1940-07-11 追授通报嘉奖**；葬于 Becklingen 战争公墓。

**Rear-Admiral Frederic Wake-Walker（韦克-沃克少将）**

- 职务：**撤离部队司令（Rear-Admiral, Dover）**，
  **以 HMS Keith 为旗舰**（wiki:HMS_Keith；ellis_1953 ch.16，confidence: **high**）。
- **6-1 09:45** —— **Keith 沉没，他被迫转移到其他船只**
  （wiki:HMS_Keith，confidence: **high**）。
- **6-2 夜** —— **在一艘摩托艇上于港内亲自指挥船只交通**
  （ellis_1953 ch.16，confidence: **high**）。
- **★ 文案要点**：一个少将在自己的旗舰被炸沉后的第二天夜里，
  **坐在一条摩托艇上指挥**。

**Admiral Sir Bertram Home Ramsay（拉姆齐海军中将）**

- 职务：**Vice-Admiral, Dover（多佛海军中将）**，「发电机行动」的总策划与总指挥。
- **指挥部** —— **多佛城堡地下的海军司令部**；
  **在行动进行期间就在那里向丘吉尔汇报**
  （wiki:Dunkirk_evacuation，confidence: **high**）。
- **5-20** —— 在多佛召开第一次会议，考虑大规模撤离的可能性，
  「如果——当时看来不太可能——有此需要」
  （ellis_1953 ch.12，confidence: **high**）。
- **5-23（星期四）** —— 通知所有相关方：若下令，该行动将被称为「**Dynamo**」
  （ellis_1953 ch.11，confidence: **high**）。
- **5-26 18:57** —— 收到海军部命令（dynamo_despatch §1，confidence: **high**）。
- **6-4 14:23** —— 收到海军部终止行动的电报（dynamo_despatch §91，confidence: **high**）。
- **★ 文案要点**：他有一个**六天的准备期**（5-20 至 5-26），
  而 Ellis 明确指出这一点：
  「那种认为最终成功是**即兴创作**的胜利的解读，**在很大程度上是错误的**。
  5 月 19 日就已预见到撤离可能成为必要。
  当发电机行动于 26 日开始，皇家海军已有**六天**时间制定初步计划……
  **敦刻尔克的胜利不是即兴创作的因素，而是纪律与良好组织的表现。**」
  （ellis_1953 ch.16，confidence: **high**）。

**★ Field Marshal Viscount Gort（戈特子爵，陆军元帅）**

- 职务：**BEF 总司令（Commander-in-Chief）**。
- **5-25 下午约 18:00** —— 在得知比军崩溃与东北翼受威胁后，
  **决定把原拟用于向南反攻的第 5 师调往北面，防守伊珀尔—科米讷运河**
  （wiki:Battle_of_the_Ypres–Comines_Canal，confidence: **high**）。
  → **这个决定被广泛认为是挽救了 BEF 的关键决定之一。**
- **5-26 上午** —— 在未与法方协商的情况下，**把第 5 与第 50 师派去填补比军缺口**
  （ellis_1953 ch.11，confidence: **high**）。
- **5-28 下午** —— **司令部抵达 La Panne**，发布撤离顺序：
  **III 军第一、II 军第二、I 军殿后**
  （ellis_1953 ch.14，confidence: **high**）。
- **5-29 晚** —— 收到首相私人电文（授权其自行判断何时停止抵抗）
  （ellis_1953 ch.14，confidence: **high**）。
- **5-31** —— **移交指挥权给 Alexander，本人离岸**
  （wiki:Dunkirk_evacuation，confidence: **medium**）。
- **给 Eden 的信**（5 月 25 日前）：
  「**我必须不向你隐瞒，即使在最好的情况下，BEF 的很大一部分及其装备
  也将不可避免地损失掉。**」
  （wiki:Battle_of_Dunkirk，confidence: **high**）。
- **★ 文案要点**：5 月 25 日 18:00 的那个决定
  ——**放弃向南反攻、转向北面堵缺口**——是整个撤退得以成立的起点。

**★ Lieutenant-General Alan Brooke（布鲁克中将，后为陆军元帅）**

- 职务：**II 军军长**，负责伊珀尔—科米讷运河的阻击。
- **5-27** —— **命蒙哥马利第 3 师向左延伸战线**，
  从而**腾出第 4 师的第 10、第 11 旅**增援 Messines 岭的第 5 师
  （wiki:Battle_of_Dunkirk，confidence: **high**）。
- **5-27** —— **从第 1 师借调第 3 掷弹兵卫队与第 2 北斯塔福德郡团**
  用于南部反冲击（wiki:Battle_of_the_Ypres–Comines_Canal，confidence: **high**）。
- **★ 其战时日记（Ellis 引用）** —— Ellis 记：
  「这两天的战斗对参战部队意味着什么已经说明。
  对军长意味着什么，可以从布鲁克将军这两天关键日子的日记摘录中看出。」
  （ellis_1953 ch.13，confidence: **high**）。
  → **不确定**：**本笔记未能取得该日记摘录的完整文本**
    （Ellis 原文该处排版断裂，OCR 未完整捕获）。
    **写手如需引用日记原文，请查阅 `brooke_2001` 来源，不要转述本笔记。**
- **★ Ellis 的评断（极高评价）** ——
  「**布鲁克将军以高超的技巧按一个敌人未能严重打乱的计划指挥作战。
  它之所以成功，是因为他指挥下的部队以与他领导相称的坚定勇气作战。**」
  （ellis_1953 ch.13，confidence: **high**）。
- **★ 历史定位** ——
  「**第 5 师在伊珀尔—科米讷正面的坚定防御
  击败了三个德军师的进攻，肯定挽救了 II 军，
  也肯定挽救了英国远征军。**」
  （ellis_1953 ch.13，confidence: **high**）。

**Major-General Harold Alexander（亚历山大少将）**

- 职务：**I 军军长**，5 月 31 日接掌 BEF 指挥，负责殿后。
- **6-1** —— 与 Abrial 海军上将会商。**认为 Abrial 提出的进一步收缩桥头堡的建议不可行**，
  理由是防线将离敦刻尔克与海滩太近，敌军的近距炮火将使继续撤离变得不可能。
  他认为英军殿后**还能守二十四小时（但不能再多）**，
  提议在**6 月 1 日/2 日夜间**完成剩余部队撤离
  （ellis_1953 ch.16，confidence: **high**）。
- **6-3 凌晨** —— **与 Tennant 上校一同驶往英国**
  （ellis_1953 ch.16，confidence: **high**）。
- **★ 历史裁决（Ellis 的评断，含批评）** ——
  「**亚历山大认为中间阵地守不住的看法，
  是基于他知道英军所剩无几，以及他不了解法军还有多少可用。
  实际结果是法军又战斗了两天，击退了德军的进攻，
  使约 10,000 名英军与约 70,000 名法军得以撤往英国。
  因此亚历山大低估了可以坚守的时间**，
  但他把前方阵地多守了二十四小时、迟滞了德军对中间阵地的进攻。」
  （ellis_1953 ch.16，confidence: **high**）。
  → **这是官方战史对一位高级将领罕见的「有功亦有过」的具体评价。**
- **★ 最后信号** —— 6 月 2 日午夜前，Ramsay 收到信号：
  「**[B.E.F.] 已撤离**」（wiki:Battle_of_Dunkirk 注；
  dynamo_despatch §84 记 6-2 **2330**，confidence: **high**）。

**★ Lieutenant-General Sir Ronald Adam（亚当中将）**

- 职务：**III 军军长**，**负责组织敦刻尔克桥头堡**。
- **5-27 07:30** —— 在 **Cassel** 出席会议，与会者包括
  **Abrial 海军上将、Fagalde 将军（法国第 16 军）、Blanchard 将军（第一集团军群）、
  Koeltz 将军（代表 Weygand）**。
  会前他与 Fagalde 拟定了**自 Gravelines 至 Nieuport 的桥头堡防御计划**：
  **法军负责敦刻尔克以西，英军负责敦刻尔克至 Nieuport**。
  「**没有讨论比利时军队被纳入的可能性，因为其情况不明**」
  （ellis_1953 ch.12，confidence: **high**）。
- **5-29** —— 任务完成，**次晨驶往英国**（ellis_1953 ch.14，confidence: **high**）。
- **★ Ellis 的评价（官方战史对后勤/组织工作的最高评价）** ——
  「**亚当少将对敦刻尔克桥头堡的组织工作起了作用**，
  尽管随着战斗部队不断涌入，其效率日益下降……
  **交通问题在良好的组织下已基本解决。**」
  （ellis_1953 ch.13，confidence: **high**）。
  → 配合 Ellis ch.16 的「胜利不是即兴创作而是纪律与组织」，
    这批材料足以支撑「组织者」这一叙事线。

**★ Lieutenant-General Sir Ronald Adam 的副手：Gort 的撤离命令**
（见 §5.1 Gort 条）

### 5.2 指挥层（法方与比、德方）

**★ Amiral Jean-Marie Charles Abrial（阿布里亚尔海军上将）**

- 职务：**敦刻尔克法军最高指挥（commandant supérieur des forces françaises de Dunkerque）**
  （wiki:Dunkirk_evacuation；ellis_1953 ch.12，confidence: **high**）。
- **5-27 07:30** —— 出席 Cassel 会议（ellis_1953 ch.12，confidence: **high**）。
- **6-1** —— 向 Weygand 报告 Alexander 与自己的对立意见
  （ellis_1953 ch.16，confidence: **high**）。
- **6-1 之后** —— 同意**英军现有防线守至 6 月 1 日午夜**，
  之后由**法军据守中间阵地**（Uxem–Ghyvelde–Basse Plaine）掩护英军撤退
  （ellis_1953 ch.16，confidence: **high**）。
- **6-3 下午** —— 与 Fagalde、de la Laurencie 等人会议，
  **决定当夜必须完成最后的法军撤离**
  （ellis_1953 ch.16，confidence: **high**）。
- **6-3 夜** —— **渡海赴英**（ellis_1953 ch.16，confidence: **high**）。
- **6-4 上午** —— 在多佛与 Ramsay 讨论**能否再坚持一夜**；
  **他认为进一步撤离不可能，因为敌人正从四面八方逼近**
  （ellis_1953 ch.16，confidence: **high**）。
- **★ 其关键判断（6-4 1100）** ——
  「**Admiral Nord 同意该行动应视为已完成，
  并指出敦刻尔克的全部弹药已用尽，留下的人数不多，主要是非战斗人员。**」
  （dynamo_despatch §91，confidence: **high**）。
  → **「全部弹药已用尽」是法军投降的直接军事原因，
    也是「法军不是不想打，而是打不下去了」的最硬证据。**

**★ Général Jean-Baptiste Molinié（莫利涅将军）**

- 职务：**里尔口袋法军指挥官**（法国第 4 军与第 5 军，约 40,000 人）
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **运气与情报** —— 里尔守军**幸运地**因为一支巡逻队
  **俘获了德军第 253 步兵师师长 Fritz Kühne 中将，
  并缴获了显示德军包围该城部队位置的文件**。
  **Molinié 用这些情报规划了 5 月 28 日的突围**
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
  → **★ 这是一个极罕见的、极具体的「缴获地图」情节，非常适合做事件。**
- **5-28 至 5-31** —— 「Molinié 与第一集团军五个师在里尔郊区**逐屋战斗**，
  德军部队试图通过缺口以及被困城中的众多平民难民之间渗透进法军防御」
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **5-31/6-1 午夜** —— **与 Aizier 上校谈判投降**；
  「**Molinié、另一名将军与约 35,000 名部队在里尔大广场向德军投降**」
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **★ 战争荣誉（本战役中最具仪式感的场景）** ——
  「德军指挥官 **Alfred Wäger 将军**允许法军享有**战争荣誉（honours of war）**；
  **守军列队通过大广场，德军士兵立正致敬**——
  这一礼遇使 Wäger **受到申斥**」
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **★ 唯一性** —— 「里尔守军是 1940 年战役中**唯一**被授予战争荣誉的守军，
  也是两次世界大战中德国仅授予此荣誉的**两支**法国守军之一
  （另一支是 1916 年凡尔登的 Fort Vaux 守军）」
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **战后评价** ——
  - **丘吉尔**：里尔防御是「**卓越的贡献**」，
    使德军推进迟滞**四天**，让 BEF 得以自敦刻尔克逃脱
    （wiki:Siege_of_Lille_(1940)，confidence: **medium**）。
  - **Shirer（1969）**：「**帮助被围的英法部队在港口周围多坚守两到三天，
    从而至少多救出 100,000 人**」
    （wiki:Siege_of_Lille_(1940)，confidence: **medium**）。
  - **另有记载**：「虽然完全被切断且兵力远逊，
    法军仍在 Molinié 将军指挥下战斗了四天，
    **从而牵制了七个德军师**使其无法参与对敦刻尔克的进攻，
    **并拯救了估计 100,000 名盟军部队**」
    （wiki:Battle_of_Dunkirk，confidence: **medium**）。

**★ Général Alphonse Juin（朱安将军）**

- 职务：**法国第 15 摩托化步兵师（15e DIM）师长**，隶属里尔口袋
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
- **5-29** —— **第 15 摩托化步兵师投降**
  （wiki:Siege_of_Lille_(1940)，confidence: **high**）。
  → **★ 这是里尔口袋崩溃的第一个明确时刻。**
- **历史后续** —— Juin 后来成为法国元帅、北约中欧盟军司令。
  → **不确定**：本笔记**未查证其被俘后的具体经历**。写手如需展开请另查。

**★ 利奥波德三世（Léopold III，比利时国王）**

- 详见 §1.3 与 §3.5。
- **★ 核心素材**：
  - **5-24**：「他决心留在自己的军队和人民中间，与他们共命运」。
  - **5-25**：电告英王乔治六世：「如果我们的军队被包围，
    我们给予盟军的援助将告终止。」——**提前警告**。
  - **5-27 23:00**：接受无条件投降，同意 04:00 停火。
  - **5-28 04:00**：投降生效。
  - **★ 丘吉尔 5-27 致 Gort 电报**：「**我们是在要求他们为我们牺牲自己。**」
    ——**英方在投降前一天的自认。**
  - **★ 战后**：被英国报纸称为「叛徒国王」「鼠王」；
    **1950 年返国引发暴动，1951 年退位。**

**Général Raoul Van Overstraeten（范·奥弗斯特拉滕将军）**

- 职务：**利奥波德国王的侍从武官（aide de camp）兼实际上的军事顾问**
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **high**）。
- **5-24** —— 当丘吉尔与 Weygand 在 5 月 24 日把他们的意图告知利奥波德与
  Van Overstraeten 时，后者「**惊呆了**」
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **medium**）。
- **角色** —— 「Van Overstraeten 介入并表示比利时第 10 步兵师不能移动。
  相反，英国人应该进一步向南移动，完全避开布鲁塞尔。」
  **布鲁克认为 Overstraeten 对形势与 BEF 的部署一无所知**
  （wiki:German_invasion_of_Belgium_(1940)，confidence: **medium**）。
- **5-27** —— 转达比方立场：「**比利时人相信，
  保护英国左翼最有效的方式，就是比利时军队的部署，
  以及他们已经在伊瑟河前方 50 公里正面上战斗了四天的这场战斗。**」
  （ellis_1953 ch.12 引 Van Overstraeten 电文，confidence: **high**）。
- **★ 文案要点**：他是比军「不撤到伊瑟河」这一决定的实际推动者，
  也是英比关系恶化的焦点人物之一。

**★ Generaloberst Gerd von Rundstedt（龙德施泰特上将）**

- 职务：**A 集团军群司令（Heeresgruppe A）**。
- **5-23 约 18:10** —— **下达停止前进令的原始指示**（见 §1.0、§3.1）。
- **5-24 约 11:30** —— 在 Charleville 接待希特勒，获其**背书**。
- **5-24 约 12:42** —— 以「**元首命令**」名义发出未加密电报。
- **★ Ellis 对其动机的判断** ——
  「Rundstedt 看出，如果他要在意见与 OKH 不同时按自己的方式行事，
  **就必须让事情看起来是『奉元首之命』**。」
  （ellis_1953 ch.9，confidence: **high**）。
- **5-30 / 5-31** —— **A 集团军群自此不再对敦刻尔克攻击负责；
  『Rundstedt 如愿以偿』**（ellis_1953 ch.15，confidence: **high**）。
- **★ 战后评语** —— 称停止前进令是「**战争中最大的转折点之一**」
  （wiki:Battle_of_Dunkirk 引 Taylor & Mayer 1974 p.60，confidence: **medium**）。
- **★ 纽伦堡证词** —— 表示怀疑希特勒想「帮助英国人」
  （`rundstedt_nuremberg`；wiki:Battle_of_Dunkirk，confidence: **low** 之于该说法本身）。

**★ Generaloberst Franz Halder（哈尔德上将）**

- 职务：**陆军总参谋长（Chef des Generalstabs des Heeres）**。
- **5-23/24** —— 日记记录其对 OKH 把第 4 集团军转隶 B 集团军群的反对，
  以及「operation order …… **未经我签名发出，以表示我对该命令及其时机的不赞成**」
  （halder_diary；ellis_1953 Supplement p.348，confidence: **high**）。
- **5-24** —— 日记记载希特勒同意保存装甲、给空军让路的理由
  （ellis_1953 ch.9 转述，confidence: **high**）。
- **5-24/25** —— 日记记载「**无所阻挡的快速左翼，
  应元首明确要求，被叫停**」（ellis_1953 App.II p.350，confidence: **medium**）。
- **★ 5-30 日记（最著名的一条）** ——
  「**Brauchitsch 很愤怒……如果我们的装甲没有被拦住，
  口袋本来会在海岸边被封闭。恶劣天气使卢夫特瓦夫无法起飞，
  我们现在只能站着看着无数敌军在我们鼻子底下逃往英国。**」
  （halder_diary 1940-05-30，转引 Shirer 1959 p.883，confidence: **high**）。
- **★ 5-24 日记中关于空军的预判（重要，且被 5-30 印证）** ——
  哈尔德指出**卢夫特瓦夫依赖天气，且机组在两周战斗后已疲惫**
  （halder_diary，wiki:Dunkirk_evacuation 引，confidence: **high**）。
- **★ 1957 年 7 月的信（战后追述，需与日记区别）** ——
  「希特勒的决定**主要受戈林影响**」
  （Shirer 1959 p.879，confidence: **medium** —— **战后 17 年的回忆**）。

**★ Generaloberst Günther von Kluge（克鲁格上将）**

- 职务：**第 4 集团军司令（Armeeoberkommando 4）**。
- **5-23 晚** —— 与 Rundstedt 谈话时提出「**部队会很高兴明天能整顿一下**」，
  Rundstedt 同意（ellis_1953 Supplement p.347，confidence: **high**）。
- **★ 5-23 18:10** —— **第 4 集团军战时日志记「第 4 集团军明日将大体上
  按 Colonel-General von Rundstedt 之命停止前进」**
  ——**这是「停止前进令」最精确的下达时刻**
  （ellis_1953 Supplement p.347，confidence: **high**）。
- **5-30** —— 第 4 集团军作战参谋对 Kleist 集群抱怨：
  「**今天什么都没发生，没有人再对敦刻尔克感兴趣。
  城市与港口必须被炮击，必须阻止登船，必须制造恐慌。**」
  （ellis_1953 ch.15，confidence: **high**）。
- **5-30 15:00 后** —— **第 4 集团军司令亲自介入下令**：
  「**所有部队立即开往敦刻尔克以东的海岸……
  告诉师长，他今天必须抵达海岸。**」
  （ellis_1953 ch.15，confidence: **high**）。

**★ General der Infanterie Ferdinand Schaal（沙尔中将）**

- 职务：**第 10 装甲师师长（10. Panzer-Division）**，加来围攻的执行者。
- **5-22 12:40** —— **XIX 军对加来的攻击直到此时才获授权**
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
  → **Guderian 的抱怨：因这一延误，
    第 1、第 2 装甲师在 Canche 河上**静止了约五个小时**
    （ellis_1953 ch.10 引 XIX 军战时日志，confidence: **high**）。**
- **5-24 16:00** —— 命令第 10 装甲师主力
  （第 90 装甲团两个坦克营 + 第 86 步枪团两个步兵营 + 一个中型炮兵营）
  自 Marquise 沿主路向 Coquelles 周边高地推进
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **5-24 19:00** —— 报告：**三分之一的装备、车辆与人员成为伤亡，
  半数坦克损失**（wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
  → **★ 这是「加来守军给德军造成多大损失」的最硬数字。**
- **5-25 09:00** —— **派市长 André Gerschell 劝降，被 Nicholson 拒绝**
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **5-25 中午** —— **再次劝降，并把期限延长，再被拒绝**
  （同上，confidence: **medium**）。
- **5-25 晚** —— **XIX 军参谋长 Walther Nehring 上校建议把最后攻击推迟到 5 月 27 日**
  （以便调来更多兵力）；**Schaal 宁可进攻，
  以免给英国人时间派遣增援**
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
- **★ 5-26 的期限威胁** —— Schaal 被告知：
  **如果该港在 14:00 前未投降，该师将被撤回，
  直到卢夫特瓦夫把该城夷平**
  （wiki:Siege_of_Calais_(1940)，confidence: **medium**）。
  → **与 Guderian 的命令一致**：「如果加来在 5 月 26 日 14:00 前未陷落，
    他将撤回第 10 装甲师并要求卢夫特瓦夫摧毁该城」
    （wiki:Battle_of_France，confidence: **high**）。
- **★ 时间上的讽刺** ——
  「**最终法英两国弹药耗尽，德军得以在大约 13:30 突入这座设防城市，
  比 Schaal 的最后期限早了 30 分钟。**」
  （wiki:Battle_of_France，confidence: **high**）。

**★ SS-Hauptsturmführer Fritz Knöchlein（克诺希莱因党卫队上尉）**

- 职务：**党卫军第 3「骷髅」师第 2 步兵团第 14 连（14./SS-Infanterie-Regiment 2）连长**。
- **5-27 17:15 后** —— 在 **Le Paradis** 外的谷仓旁，
  **下令用两挺机枪射杀 99 名皇家诺福克团第 2 营战俘，
  随后令士兵用刺刀刺杀幸存者**。
  **仅两人重伤幸存**（wiki:Le_Paradis_massacre，confidence: **high**）。
- **★ 其上级在战斗中的结局** ——
  **SS-Standartenführer Hans Friedemann Götze
  （骷髅师第 3 团团长）在 Le Cornet Malo 战斗中阵亡**
  （wiki:Le_Paradis_massacre，confidence: **high**）。
- **★ 战后审判** ——
  「战争结束后，Knöchlein 因在该屠杀中的角色
  被英国军事法庭定罪，**两名幸存者作为对他不利的证人出庭**。
  因下令屠杀，Knöchlein 被判处死刑，**于 1949 年被处决**。」
  （wiki:Le_Paradis_massacre，confidence: **high**）。
- **★ Ellis 的官方战史记载（附重要限定）** ——
  Ellis 详细记录了屠杀经过（见 §1.2），并写道：
  「**就德国陆军而言，公平地说，这些 SS 部队是由纳粹党组建的，
  不属于正规陆军**，尽管其许多军官曾是正规军人。
  但同样值得注意的是，**陆军当局虽在事发时即获完整报告，却未予惩处。**」
  （ellis_1953 ch.12，confidence: **high**）。
  → **这两句限定语非常重要：既不以 SS 之罪株连国防军，
  也明确指出国防军知情不办。**

### 5.3 有姓名、有具体时刻的舰船故事

**★ HMS Wakeful（H88）—— 5 月 29 日 00:45**
（详见 §1.4）

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **Admiralty W 级驱逐舰**，1917 年 1 月 17 日开工，1917 年 10 月 6 日下水，1917 年 12 月 16 日服役 | wiki:HMS_Wakeful | **high** |
| 满载部队 | **640 人**（wiki）/ **650 人**（ellis_1953 ch.14） | 两说 | medium |
| **5-27** | **装载 631 名盟军部队**；返航多佛途中遭空袭，**水线以下受轻伤**；仍返回敦刻尔克继续撤离 | wiki:HMS_Wakeful | **high** |
| **5-28** | **装载 640 名盟军部队** | 同上 | **high** |
| **5-28 23:00** | 自 **Bray 海滩**启航赴多佛，经 **Zuydecoote Pass 与北航道** | dynamo_despatch §27 | **high** |
| 航速与规避 | 接近 **Kwinte Whistle 浮标**时 **20 节**，**每四分钟转向 40 度** | dynamo_despatch §27 | **high** |
| **5-29 00:45** | **两条鱼雷航迹；一条未中，一条命中舯部。舰体断为两半，两段 15 秒内沉没** | dynamo_despatch §27 | **high** |
| 攻击者 | **德军 E-boat（S-boat）S-30** | wiki:HMS_Wakeful；wiki:Dunkirk_evacuation 引 Atkin | **high** |
| 伤亡 | **640 名部队中仅 5 人幸存**：皇家工兵上尉 **Brian Leslie Lynch Abdy Collins**、皇家工兵工兵 **Michael Frazer**、皇家陆军勤务团 **Stanley Patrick** 与 **H.F.R. Ruddell**、皇家坦克团 **James "Jim" Kane**；**另 25 名舰员幸存** | wiki:HMS_Wakeful | **high** |
| 舰长 | **两次被抛入海中**，第二次在游泳 **5 小时**后（自本舰被命中算起）被救起 | ellis_1953 ch.14 | **high** |
| ★ 文案要点 | **640 人上船，5 人生还。**这是整个行动中单舰人员损失最惨重的事件之一 | —— | —— |

**★ HMS Grafton（H89）—— 5 月 29 日 02:50**
（详见 §1.4）

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **G 级驱逐舰**，1934-08-30 开工，1935-09-18 下水，1936-03-20 服役；John I. Thornycroft & Company, Woolston 建造 | wiki:HMS_Grafton | **high** |
| 舰训 | *Decus pretutis pretium*（「荣誉是勇气的奖赏」） | 同上 | **high** |
| **5-26** | 加来围城期间，**护送轻巡洋舰为第 30 摩托化旅提供舰炮支援** | 同上 | **high** |
| **5-27** | **自 La Panne 与 Bray 海滩撤出逾 1,600 名部队** | 同上 | **high** |
| **5-28 18:30** | **报告「Bray 海滩上还有数千名部队，且还有更多人在到达」** | dynamo_despatch §18 | **high** |
| **5-29 晨** | **停下来救援 Wakeful 的幸存者** | wiki:HMS_Grafton | **high** |
| **5-29 02:50** | **在 Nieuport 外海救援 Wakeful 幸存者时，舰尾被鱼雷命中** | dynamo_despatch §27 | **high** |
| 攻击者 | **德国潜艇 U-62**（wiki）/ **U-69**（ellis_1953 ch.14）—— **两说，无法裁决** | 两说 | **low** |
| 损伤 | **严重损毁，并引发二次爆炸损伤舰桥，舰长与另一名军官当场阵亡；13 名水兵与食品部经理亦阵亡。舰体折断但仍漂浮足够久，全部幸存者获救** | wiki:HMS_Grafton | **high** |
| 救援 | **800 名部队（含重伤员）由自敦刻尔克返航的客船 Malines 接下**；驱逐舰 **Ivanhoe** 救起其余幸存者 | ellis_1953 ch.14；wiki:HMS_Grafton | **high** |
| 结局 | **Ivanhoe 以舰炮击沉 Grafton**（因损毁过重无法拖带） | wiki:HMS_Grafton | **high** |
| ★ 附带的悲剧 | **同一时刻，漂网渔船 Comfort 被爆炸掀起；Lydd 与 Grafton 误以为她是敌舰而开火；Lydd 随后撞沉 Comfort。据信 Comfort 船员除一人外、Wakeful 幸存者除四人外全部死亡** | dynamo_despatch §27；ellis_1953 ch.14 | **high** |

**★ HMS Grenade（H86）—— 5 月 29 日**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **G 级驱逐舰**，1934-10-03 开工，1935-11-12 下水，1936-03-28 服役；造价 **£252,560**（不含政府提供之装备） | wiki:HMS_Grenade | **high** |
| **挪威战役** | 1940 年 4 月参与；5 月 3 日 **在 Bittern 号前部弹药库被 Ju 87 炸弹命中爆炸后靠帮救援**，救起 36 名水兵（其中 20 人在抵达 Scapa Flow 前死亡）；**Grenade 自身有 4 人被近失弹破片击伤** | 同上 | **high** |
| **5-29 上午** | **与 Jaguar、Gallant 经新中航道（Route X）派往敦刻尔克，以试探岸炮反应** | dynamo_despatch §28 | **high** |
| **5-29 中午前后** | 三舰在接近敦刻尔克时遭俯冲轰炸机攻击，**Gallant 受损**；至少六次攻击，一架敌机被舰炮击落 | 同上 | **high** |
| **5-29 抵达** | **报告岸炮未开火，但遭猛烈轰炸** | 同上 | **high** |
| **5-29 约 16:00 起** | **靠泊东防波堤内侧（与 Jaguar 相邻）时遭大规模空袭** | dynamo_despatch §30 | **high** |
| **结局** | **被 Ju 87「斯图卡」俯冲轰炸机击沉**；与 Fenella、Crested Eagle、Polly Johnson、Calvi 同批沉没或重创 | wiki:Dunkirk_evacuation 引 English 1993 p.99；ellis_1953 ch.14 | **high** |
| ★ 文案要点 | **Grenade 在 5-29 中午刚刚「证明」Route X 是安全的（岸炮未开火），四小时后就被击沉在防波堤旁。** | —— | —— |

**★ HMS Keith（D06）—— 6 月 1 日 09:45**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **驱逐舰领舰（destroyer leader）**，1929-10-01 开工，1930-07-10 下水，1931-03-20 完工；Vickers-Armstrongs, Barrow 建造；**编制 175 人** | wiki:HMS_Keith | **high** |
| 命名 | 取自 **Lord Keith** | 同上 | **high** |
| **5-30/31 夜** | **加入发电机行动，自敦刻尔克运 992 名盟军部队至多佛** | 同上 | **high** |
| **5-31 上午** | **返回 De Panne，成为 Rear-Admiral Frederic Wake-Walker 的旗舰** | 同上 | **high** |
| **6-1 上午** | **遭空袭。第一次攻击打坏舵机；随后一次攻击中一枚炸弹沿后烟囱落下，在 2 号锅炉舱内爆炸，杀死舱内所有人并引发火灾。全舰失去动力，抛锚，下达弃舰令** | 同上 | **high** |
| **6-1 09:45** | **沉没**（位置 51°08′N 2°18′E 附近，与 Basilisk 相同区域） | 同上 | **high** |
| 伤亡 | **3 名军官与 33 名水兵阵亡；8 名军官与 123 名水兵获救** | 同上 | **high** |
| ★ 文案要点 | **伤亡比 36 : 131。这是本战役中救援比例最高的一艘沉舰**——因为其他船只就近施救 | —— | —— |

**★ HMS Basilisk（H11）—— 6 月 1 日约 12:00**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **B 级驱逐舰**，约 1930 年建造 | wiki:HMS_Basilisk | **high** |
| **5-30** | **自 Western Approaches Command 转调支援敦刻尔克撤离** | 同上 | **high** |
| **5-31** | **两次往返多佛，共撤出 695 人** | 同上 | **high** |
| **6-1 上午** | **返回 La Panne 装载更多部队，遭德军轰炸机三次攻击。第一波中一枚炸弹在 3 号锅炉舱内爆炸，杀死全部锅炉与机舱人员，使蒸汽管路破裂，全部机械失效；同一次攻击的近失弹使舰体侧面与上甲板扭曲** | 同上 | **high** |
| 减重措施 | **抛弃鱼雷与深水炸弹以减轻上部重量** | 同上 | **high** |
| 拖带尝试 | **法国渔船 Jolie Mascotte 试图拖带；第二次攻击使法船放弃拖带** | 同上 | **high** |
| **约 12:00** | **第三次攻击将 Basilisk 击沉于浅水中**（位置 51°08′N 2°18′E） | 同上 | **high** |
| 救援 | **Jolie Mascotte 与驱逐舰 Whitehall 救起 8 名军官与 123 名水兵** | 同上 | **high** |
| 残骸处理 | **Whitehall 随后以舰炮与鱼雷摧毁残骸** | 同上 | **high** |
| ★ 文案要点 | **一艘法国渔船在德军俯冲轰炸下试图拖走一艘英国驱逐舰——两次。第二次被迫放弃。最后还是那艘法船救起了大半舰员。** | —— | —— |

**★ HMS Havant（H32）—— 6 月 1 日**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 舰级 | **H 级驱逐舰**，原为巴西海军订购，舰名 **Javary**；1938-03-30 开工，1939-07-17 下水；**1939-09-05 被英国购入**，1939-12-19 服役 | wiki:HMS_Havant | **high** |
| 建造 | **J. Samuel White, Cowes** | 同上 | **high** |
| **5-29** | **加入敦刻尔克撤离** | 同上 | **high** |
| **5-29 至 6-1** | **共救出逾 2,300 人** | 同上 | **high** |
| **6-1 晨** | **已装载 500 名部队，随后靠上一早被德军俯冲轰炸机打瘫的驱逐舰 Ivanhoe，把其全部部队与伤员接下，在猛烈空袭下驶往多佛** | 同上 | **high** |
| **随后** | **Stuka 以两枚炸弹命中 Havant 的机舱，第三枚在其舰体下方爆炸** | 同上 | **high** |
| 伤亡 | **8 名舰员阵亡、25 人负伤；至少 25 名士兵阵亡** | 同上 | **high** |
| 结局 | **严重受损，拖带失败后由扫雷舰自沉** | 同上 | **high** |
| ★ 文案要点 | **Havant 在三天内救出逾 2,300 人，最后因为靠帮救援另一艘被打瘫的驱逐舰而死。** | —— | —— |

**★ HMS Ivanhoe（D16）**

- **5-29 02:50 后** —— 救起 Grafton 的幸存者，**并以舰炮击沉 Grafton**
  （wiki:HMS_Grafton，confidence: **high**）。
- **6-1 上午** —— **被德军俯冲轰炸机打瘫**；其全部部队与伤员由 Havant 接下
  （wiki:HMS_Havant，confidence: **high**）。
- Ramsay 附录 I 记其 **6 月 1 日受损**（dynamo_despatch App.I，confidence: **high**）。
- ★ 文案要点：**一艘驱逐舰在三天内先击沉了自己的姊妹舰，然后自己被炸瘫，
  被另一艘姐妹舰救走人员。**

**★ HMS Shikari（D30）与 HMS Express —— 6 月 4 日 03:18 / 03:40**

- **6-3 夜** —— **Shikari 引导三艘阻塞船驶往敦刻尔克**
  （ellis_1953 ch.16，confidence: **high**）。
- **6-4 03:40** —— **Shikari 在装载 383 名法国部队后，
  成为最后一艘驶离敦刻尔克的船**（ellis_1953 ch.16，confidence: **high**）。
- **6-4 03:18** —— **Express 是倒数第二艘离港的船**
  （dynamo_despatch §90，confidence: **high**）。
- **两船共载约 1,000 名部队与英国码头分队**
  （dynamo_despatch §90，confidence: **high**）。
- **6-4** —— **Shikari 在最后航程中遭一次空袭**，但除此之外未受干扰
  （dynamo_despatch §90，confidence: **high**）。
- ★ 文案要点：**Shikari 先引导阻塞船进去，再装载 383 名法军，
  然后作为最后一艘船驶离。Express 在前 22 分钟离开。**

**★ PS Medway Queen（梅德韦女王号明轮汽船）—— 纪录 7 次往返、7,000 人**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 绰号 | **「敦刻尔克的女英雄」（The Heroine of Dunkirk）** | wiki:PS_Medway_Queen | **high** |
| **★ 纪录** | **7 次往返——任何参与撤离的商船中最多**；**救出逾 7,000 人** | 同上 | **high** |
| **首航** | **约 600 名士兵自 De Panne 海滩以救生艇接下，再摆渡上船** | 同上 | **high** |
| **首航返航** | **抵达多佛时恰逢空袭，她在港外击落一架德国飞机**；**Brighton Belle 撞上沉船残骸开始下沉，Medway Queen 无损失救起其全部乘客与船员**，并严重超载地驶入港口 | 同上 | **high** |
| **第二航次** | **直接从海滩接下约 450 名士兵**——「这需要更多技巧，但快得多」；**士兵用一种涂油袋子的技巧来掩盖他们特有的尾迹以躲避巡逻飞机** | 同上 | **high** |
| **后续航次** | **穿过受损的敦刻尔克港，从混凝土码头或防波堤上接人**；**人员在 Ramsgate 而非多佛下船** | 同上 | **high** |
| **★ 第七航次（6-3）** | **「6 月 3 日星期一，Vice Admiral Ramsey 下令所有船只必须在次日凌晨 2 点 30 分前离开敦刻尔克。这是 Medway Queen 的第七次航次。她正停在敦刻尔克的防波堤旁，一艘系在她尾后的驱逐舰被爆炸推向前方，撞碎了她的右舷明轮罩，她受到相当严重的损伤。Medway Queen 载着 400 名法国士兵一瘸一拐地回到多佛。」** | 同上 | **high** |
| **★ 被误报沉没** | **「抵达多佛后，Medway Queen 的船员发现海军部已报告他们的船已沉没（消息在英国各地报道）；海军部于次日晨发布了更正。」** | 同上 | **high** |
| 荣誉 | **船员获得 7 项嘉奖：2 枚杰出服务十字勋章、3 枚杰出服务勋章、2 次通报嘉奖**；**击落 3 架敌机** | 同上 | **high** |
| **★ 战后奇闻** | **1963 年她最后一次航行后被安排到比利时拆船。比利时拆船商在发现他要拆的船是「敦刻尔克的女英雄」后拒绝继续**（据报道他认为没有人敢毁掉这样一艘英勇而重要的船） | 同上 | **high** |
| Ramsay 附录 | **MEDWAY QUEEN 列入扫雷舰名单**（dynamo_despatch App.I，confidence: **high**） | —— | —— |
| ★ 文案要点 | **一艘明轮汽船跑了 7 趟，救了 7,000 人，被海军部宣布沉没，然后自己开回了多佛。
  60 年后，一个比利时拆船商拒绝拆她。** | —— | —— |

**★ HMT Sundowner（森德勒号游艇）与 Charles Lightoller**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| **★ 人物** | **Charles Herbert Lightoller** —— **泰坦尼克号沉没中最高级别的生还军官**；时年 **66 岁**，已退休 | wiki:Sundowner_(yacht) | **high** |
| **5-31** | **Sundowner 被海军部征用，派往敦刻尔克协助撤离。Lightoller 自愿驾驶，随行有其长子 Roger 与 18 岁的海童军 Gerald Ashcroft** | 同上 | **high** |
| **6-1 10:00** | **自 Ramsgate 港出发**，与另外五艘船一同横渡海峡 | 同上 | **high** |
| 途中 | **救起机动游艇 Westerly 的船员（该船故障并起火）** | 同上 | **high** |
| 抵敦刻尔克 | **Lightoller 意识到码头太高，于是靠上一艘驱逐舰开始接人** | 同上 | **high** |
| **★ 载运量** | **75 人挤进舱内，另 55 人在甲板，共 130 人** | 同上 | **high** |
| 返航 | **返回 Ramsgate，途中以规避动作躲开敌机火力**；「**最大的危险是被快速行驶的驱逐舰尾浪掀翻**」 | 同上 | **high** |
| 结局 | **卸下部队后准备再返法国装第二趟，但此时只允许能跑 20 节的船继续参与** | 同上 | **high** |
| 后续 | Lightoller 1952 年去世；其妻 Sylvia 继续驾驶 Sundowner，**1965 年 25 周年时由她掌舵率领小船队重返敦刻尔克** | 同上 | **high** |
| ★ 文案要点 | **泰坦尼克号上生还的最高级别军官，66 岁，驾自家游艇去敦刻尔克，
  用一艘本来载几个人的船装了 130 名士兵回来。** | —— | —— |

**★ SS Mona's Queen（莫娜女王号）—— 5 月 29 日 05:30**

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 船东 | **马恩岛汽船公司（Isle of Man Steam Packet Company）** | wiki:SS_Mona's_Queen | **high** |
| 指挥官 | **Captain Radcliffe Duggan**（后临时由 **Capt. Holkham** 接替） | 同上 | **high** |
| **★ 首航（5-27 夜）** | **是首批完成往返的船只之一；在 Duggan 船长指挥下于 5 月 27 日夜间返回多佛，载有 1,200 名部队** | 同上 | **high** |
| **5-28** | **再度出海，在法国海岸外遭岸炮射击但逃脱损伤** | 同上 | **high** |
| **★ 5-29 凌晨（约 05:30）** | **自多佛启航赴敦刻尔克，满载水罐（因敦刻尔克海滩部队缺水）。在敦刻尔克港外触磁性水雷，于 05:30 沉没。Mona's Queen 在两分钟内沉没。** | 同上 | **high** |
| 与缺水记录的呼应 | **这与 ellis_1953 ch.13 记「水与食物直到 5 月 30 日才送达 Malo 海滩」、
  以及 dynamo_despatch §15 记「海滩严重缺水的关切」完全吻合** | —— | **high** |
| 纪念 | **2010-05-29 其右舷锚被打捞上来，运回马恩岛，成为 Port St Mary 的 Kallow Point 永久纪念碑的核心** | 同上 | **high** |
| ★ 文案要点 | **她是去送水的。她在港口外两分钟内沉没。** | —— | —— |

**★ RMS Lancastria（兰卡斯特里亚号）—— 6 月 17 日 15:50**
（**注意：不属于 Dynamo，属 Operation Aerial 尾声。CONTRACT §7 已列为「尾声」用途。**）

| 项目 | 内容 | 来源 | 置信度 |
|---|---|---|---|
| 性质 | **英国远洋班轮，被征用为运兵船（HMT Lancastria）** | wiki:RMS_Lancastria | **high** |
| 舰长 | **Captain Rudolph Sharp** | 同上 | **high** |
| **6-17 04:00** | **在 Charpentier Roads 锚泊，距圣纳泽尔约 [若干] 西南，周围约三十艘商船** | 同上 | **high** |
| 载运决定 | Sharp 答复可载 **3,000 人「在紧要关头」**；他被告知应尽可能多载，「**不必考虑国际法的限制**」 | 同上 | **high** |
| **6-17 13:50** | 空袭中附近的 **Oronsay**（20,000 吨东方班轮）舰桥被德机炸弹命中。**Lancastria 本可离港，驱逐舰舰长也建议她离开；但 Sharp 决定等 Oronsay 一同出发**（以免无驱逐舰护航而遭潜艇攻击） | 同上 | **high** |
| **★ 6-17 15:50** | **新一轮空袭由来自 Kampfgeschwader 30 的 Junkers Ju 88 轰炸机发起。Lancastria 被三枚或可能四枚炸弹命中。** | 同上 | **high** |
| 命中部位 | 一说一枚炸弹穿入其唯一烟囱（多数幸存者如此报告）；但**轮机军官 Frank Brogden 的证词相反**——一枚炸弹落在烟囱附近并进入 4 号货舱，另两枚落在 2 号与 3 号货舱，第四枚落在左舷附近，**撕裂燃油舱** | 同上 | **high** |
| **★ 16:12** | **该船在被命中后二十分钟内沉没**，几乎没有时间让其他船只反应 | 同上 | **high** |
| 幸存者 | **2,477 名幸存者**，其中约 100 人在 2011 年仍在世 | 同上 | **high** |
| **★ 死亡人数（多口径）** | **Lancastria 协会列名 1,738 人**；**普遍认为死亡人数不少于 3,500 人**（其中至少 1,000 名平民难民）；**Fenby（2005）称估计从不足 4,000 到多达 7,000 人**；**现代估计为 4,000–7,000 人** | 同上 | medium |
| **★ Ellis 的官方战史数字（与上面差异极大）** | **「下午三点四十五分……Lancastria 号，船上已有 5,800 名部队（其中包括许多皇家空军人员），被严重击中并起火，十五分钟内沉没，损失惨重。近 3,000 人丧生。」** | ellis_1953 ch.21 | **high** 之于 Ellis 如此记载 |
| **★ 不确定（重要矛盾）** | **Ellis 记「5,800 人上船、近 3,000 人丧生、15 分钟内沉没」；
  wiki 记「16:12 沉没（被击中后 20 分钟内）、死亡 4,000–7,000、幸存 2,477」。
  两组数字无法调和。写手请同时给出两说，并标明 Ellis 为官方战史口径。** | 两说 | **low** |
| Ellis 的困惑 | 「**为什么损失了这么多生命，是有些神秘的。**诚然船上没有足够的救生衣来应付已登船的异常多的人数，而且该船燃油在周围水面上形成了一层油膜。但获救的船长作证说船上没有恐慌，而且该船沉没缓慢，当时附近有相当数量的小艇。**无疑其中许多正忙于自保以应对持续四十五分钟的空袭，以致未能意识到 Lancastria 船员处境的紧迫**，但这并不能完全解释为何生命损失如此之大。」 | ellis_1953 ch.21 | **high** |
| 新闻封锁 | **丘吉尔下令通过 D-Notice 审查制度封锁该沉没事件的消息**；**该消息最终由 Press Association 于 7 月 25 日在美国《纽约时报》上打破**，次日在英国由《苏格兰人报》报道，**距沉没已超过五周** | wiki:RMS_Lancastria | **high** |
| **★ 不确定** | **2022 年 David Worsfold 的出版物反驳了关于 D-Notice 与丘吉尔试图制造沉默阴谋的说法。** 写手如使用「丘吉尔封锁消息」，请注明存在争议 | 同上 | medium |
| ★ 文案要点 | **这是英国海事史上单船死亡人数最多的事件，被封锁了五周。
  它发生在 Dynamo 结束十三天之后——**提醒读者：敦刻尔克不是结局。** | —— | —— |

**★ SS Brighton Belle 与 TSS Scotia —— 6 月 1 日**

- **5-28** —— **Brighton Belle 载 350 名士兵返航，在规避空袭时撞上 Gull 灯浮标附近的沉船残骸而沉没**；
  **船员与所载士兵全部由附近船只救起，无人员损失**
  （ellis_1953 ch.13，confidence: **high**）。
- **★ 6-1** —— **Brighton Queen 沉没时船上约有 700 名法国与摩洛哥部队**。
  扫雷舰 **Saltash** 救起约 **400 名幸存者**，并报告：
  「**法国部队表现得沉着而明智，尽管其中近一半人在爆炸中阵亡。**」
  （ellis_1953 ch.16，confidence: **high**）。
- **★ 6-1** —— **Scotia 被命中时船上有约 2,000 名法国部队，被至少四枚炸弹击中。
  驱逐舰 Esk 自敦刻尔克驶出接走近 1,000 人，Worcester 与小艇又救起许多。
  但 28 名船员与 200–300 名部队丧生。两船共约 2,700 人，约 2,100 人获救。**
  （ellis_1953 ch.16，confidence: **high**）。
- **★ Ramsay 附录 I 的记载差异** ——
  Ramsay 附录把 **BRIGHTON BELLE 与 DEVONIA 列为扫雷舰**，
  日期栏 OCR 不清（dynamo_despatch App.I，confidence: **medium**）。
  **注意：Ellis 记「Brighton Belle」沉于 5-28 因撞沉船，
  而 Ramsay 附录把「Brighton Belle」列为扫雷舰（沉没日期 OCR 不清）。
  另 wiki 与 Ellis ch.16 记 6-1 沉没的是「Brighton Queen」。**
  → **不确定**：**「Brighton Belle」与「Brighton Queen」是两艘不同的船，
  分别沉于 5-28 与 6-1。写手请勿混淆。**

**★ Gracie Fields（格雷西·菲尔兹号明轮扫雷舰）—— 5 月 29 日**
（详见 §1.4）

- **载约 750 名自 La Panne 海滩上船的部队**；
  **启程返航后不久舯部中弹**；**上层甲板被蒸汽笼罩，引擎无法停车，
  舵卡在一定角度上，以约 6 节速度原地打转**
  （ellis_1953 ch.14，confidence: **high**）。
- **两艘 schuyts 靠上接下尽可能多的人**；
  **Pangbourne 号（自身已有 13 人阵亡、11 人受伤、罗经损坏）靠上又接下 80 人**，
  随后拖带 Gracie Fields 返英（ellis_1953 ch.14，confidence: **high**）。
- **次日凌晨** —— **Gracie Fields 开始下沉，Pangbourne 砍断拖缆并接下其船员。
  该舰被弃，但船员与他们自海滩运来的部队都安全抵英**
  （ellis_1953 ch.14，confidence: **high**）。
- **★ 不确定（重要）** ——
  **Ramsay 附录 I 记「GRACIE FIELDS … (sunk 28th May)」，
  与 Ellis 的「5-29 下午被击中、5-30 凌晨沉没」不一致。**
  （dynamo_despatch App.I，OCR 日期栏可能错位）。
  **本笔记采信 Ellis 的叙述（confidence: high），并注明 Ramsay 附录作 28 日。**
- **★ Ramsay 附录的 OCR 交叉印证** ——
  Ramsay 附录 I 在扫雷舰栏中把
  **GRACIE FIELDS、SKIPJACK、WAVERLEY** 三艘与日期配对，
  但 OCR 呈现为 `GRACIE FIELDS ... (sunk 28th May) SKIPJACK . ( „ 31st „ ) WAVERLEY ( „ 28th „ )`，
  **日期与舰名的对应关系显然错位**（Skipjack 确实沉于 6-1，非 5-31）。
  **写手请勿使用 Ramsay 附录 I 的这些日期。**

**★ Massey Shaw（梅西·肖号，伦敦消防队消防浮船）**

- **Ramsay 的权威记载** ——
  「在民用船员操作的船只中，**表现最好者之一是伦敦消防队的消防浮船
  Massey Shaw。其全部志愿船员都是伦敦消防队或辅助消防队的成员，
  在他们的精良船只上完成了 4 次往返海滩。**」
  （dynamo_despatch §105，confidence: **high**）。
- **不确定** —— **本笔记未能查到 Massey Shaw 撤出人数的确切数字。**
  常见说法为约 500–600 人，但**本笔记未能在可核实来源中找到**。
  **请写手不要使用未经核实的人数。**

**★ Lady of Mann（曼恩夫人号）**

- **不确定** ——
  **本笔记未能在 Ellis 官方战史、Ramsay 战报或任何已获取来源中
  找到「Lady of Mann」在敦刻尔克的具体记载。**
  Ramsay 附录 I 中列有马恩岛汽船公司的多艘船只
  （如 **MONA'S ISLE、MONA'S QUEEN、BEN-MY-CHREE、TYNWALD、FENELLA、
  KING ORRY、SNAEFELL** 等，dynamo_despatch App.I），
  **但本笔记未能确认「Lady of Mann」是否在其中**（OCR 文本破损严重）。
  **请写手如需使用该船，自行核实来源，不要基于本笔记编造其事迹。**

**★ 其他被 Ramsay 附录 I 明列的著名船只（可用于扩充）**

- **人员运输船 / 客船**：**ROYAL DAFFODIL**（6-2 受损）、
  **CANTERBURY**（5-29 受损）、**MAID OF ORLEANS**（受损）、
  **PRAGUE**（6-1 载 3,000 部队、严重受损）、
  **SCOTIA**、**BRIGHTON QUEEN**、**FENELLA**、**CRESTED EAGLE**、
  **MONA'S ISLE**、**KING ORRY**、**LLANTHONY**、**LORMONT**、
  **ST HELIER**、**ST JULIEN**、**ISLE OF THANET**（医院船）。
- **扫雷舰**：**SALTASH、EMPEROR OF INDIA、MEDWAY QUEEN、SANDOWN、
  FITZROY、NIGER、SNAEFELL、GLEN AVON、WAVERLEY、GRACIE FIELDS、SKIPJACK**。
- **Corvette**：**GUILLEMOT**（6-1 沉没）、**KINGFISHER**。
- **Sloop / 炮舰**：**BIDEFORD**。
- **拖网渔船 / 漂网渔船**：**LYDD、COMFORT、NAUTILUS、GOSSAMER、
  POLLY JOHNSON、CALVI、BOY ROY、PAXTON** 等。
- **★ 有价值的背景事实（Ramsay 列举的船名）** ——
  Ellis 用一整段船名来营造「拼凑起来的船队」的意象：
  「**Royal Sovereign 在那里，印度皇帝号也在那里，还有几艘女王号；
  Princess Elizabeth 与 Princess Maud 在那里，
  还有 Duchess of Fife、Lord Howard 与 Lord Howe，
  著名的 Gracie Fields 与鲜为人知的 Polly Johnson。
  Our Bairns 与 The Boys 在那里，还有 Girl Pamela 与 A Yorkshire Lass。
  从坎特伯雷到比迪福德、从伍斯特到邓多克，许多城镇都参与了，
  足球界则由 Blackburn Rovers 与 Spurs 代表。
  Wakeful、Gallant 与 Intrepid 在那里，代表它们全体的精神；
  而作为它们所为之辛劳的自由与所激励的希望之象征，
  那里有一份 Golden Gift 与一个 Silver Dawn。**」
  （ellis_1953 ch.14，confidence: **high**）。
  → **★ 这是官方战史中罕见的文学笔法，极适合作为战役文案或总台卷宗的引文。**

### 5.4 地面战斗中的个人

**★ Captain Harold Marcus Ervine-Andrews（厄文-安德鲁斯上尉）VC**

- **全名与军衔**：Harold Marcus Ervine-Andrews，
  **Captain, 1st Battalion, East Lancashire Regiment, 1st Infantry Division**；
  时年 **28 岁**；1911-07-29 生于爱尔兰卡文郡 Keadue；1995-03-30 卒
  （wiki:Marcus_Ervine-Andrews，confidence: **high**）。
- **★ 时刻与行动** ——
  **5 月 31 日夜 / 6 月 1 日**，在敦刻尔克附近：
  - 其连队奉命防守**「一片 1,000 码见方的地域」**；
  - 已严重兵力不足且处于德军猛烈火力之下；
  - **敌军于黎明进攻并越过 Canal de Bergues**；
  - **Ervine-Andrews 带连里的志愿者冲上一座谷仓，
    从屋顶用步枪射杀 17 名敌军，又用布伦机枪射杀更多**；
  - **谷仓被击毁并起火后，他把伤员送往后方，并率剩余 8 人撤回。**
  （wiki:Marcus_Ervine-Andrews，confidence: **high**）。
- **★ 授勋公告** ——
  **1940 年 7 月 30 日**在 London Gazette 增刊发表
  （wiki:Marcus_Ervine-Andrews，confidence: **high**）。
- **★ Ellis 的战况描述** ——
  「更东面，第 1 东兰开夏团未能阻止部分敌军越过运河，
  但敌军未能取得进展，直到东兰开夏团撤至 Canal des Chats。
  **东兰开夏团的 H. M. Ervine-Andrews 上尉因此次行动获授维多利亚十字勋章。**」
  （ellis_1953 ch.16，confidence: **high**）。
- **★ 战后** —— 战后试图返回故乡卡文郡，**被当地 IRA 成员赶走**；
  先居北爱尔兰 Whiteabbey，后定居康沃尔；后晋升**中校**；
  自 1955 年起参与 Leonard Cheshire 基金会
  （wiki:Marcus_Ervine-Andrews，confidence: **high**）。
- **★ 文案要点**：**一个 28 岁的上尉，在谷仓屋顶上用步枪打死了 17 个德国人，
  然后带着剩下的 8 个人撤了回来。**

### 5.5 可供拍照/选图的具体场景清单

写手与摄影/美术可在 `public/campaigns/dunkirk-1940/photos/` 中优先寻找以下场景：

| # | 场景 | 时刻 | 视觉要素 | 来源 |
|---|---|---|---|---|
| 1 | 东防波堤上排队的部队 | 5-28 至 6-1 | 狭窄木板步道、钢盔、等待的船、远处燃烧的油罐 | ellis_1953 ch.14、ch.16 |
| 2 | 6 月 1 日 18:00 的港口：燃烧与沉没中的船只 | 6-1 18:00 | 烟火、倾斜的船体、防波堤 | ellis_1953 ch.14 |
| 3 | 海滩上的长队与涉水登船 | 5-29 至 5-31 | 齐胸深的水、士兵扛着装备、小艇 | wiki:Dunkirk_evacuation |
| 4 | 敦刻尔克城内燃烧的油罐 | 5-27 起 | 巨大的黑色烟柱（Ellis 与 Ramsay 均提及） | ellis_1953 ch.16 |
| 5 | 加来旧城的废墟 | 5-26 下午 | 倒塌的建筑、德军坦克过桥 | wiki:Siege_of_Calais_(1940) |
| 6 | 里尔大广场的法军受降队列 | 5-31/6-1 午夜 | 列队行进的法军、立正致敬的德军 | wiki:Siege_of_Lille_(1940) |
| 7 | 6 月 4 日 03:20 码头上法军的最后敬礼 | 6-4 03:20 | 晨光中难以辨认的面孔、身后的火焰映出钢盔 | ellis_1953 ch.16（Troup 报告） |
| 8 | 被遗弃的装备与车辆 | 5-30 至 6-4 | 成排的卡车、火炮、沙滩上的杂物 | ellis_1953 ch.23 |
| 9 | 士兵用废弃车辆搭的临时栈桥（Bray-Dunes / De Panne） | 5-29 至 5-31 | 打上沙滩的卡车与木板的组合 | wiki:Dunkirk_evacuation |
| 10 | 多佛码头下船的部队 | 5-27 至 6-4 | 密集的人群、担架、茶与食物 | ellis_1953 插图；wiki:Dunkirk_evacuation |
| 11 | 德军进入敦刻尔克升起卐字旗 | 6-4 10:20 | 码头、旗帜、废墟 | wiki:Battle_of_Dunkirk |
| 12 | Le Paradis 的谷仓（战后纪念碑） | —— | 战争罪行的物质遗存 | wiki:Le_Paradis_massacre |

- **★ 官方战史的插图清单（可用于选图参考）** ——
  Ellis 官方战史含以下相关照片
  （ellis_index，confidence: **high**）：
  - `img/UK-NWE-Flanders-1.jpg` —— **General the Viscount Gort**
  - `img/UK-NWE-Flanders-8.jpg` —— **Vice-Admiral Sir Bertram H. Ramsay**
  - `img/UK-NWE-Flanders-9.jpg` —— **Dunkirk: the outer harbour**（敦刻尔克外港）
  - `img/UK-NWE-Flanders-11.jpg` —— **Colonel-Generals von Brauchitsch, von Bock and von Rundstedt**
  - `maps/UK-NWE-Flanders-5.jpg` —— **Situation on the evening of 26th May, 1940**
  - `maps/UK-NWE-Flanders-6.jpg` —— **Situation on the evening of 27th May, 1940**
  - `maps/UK-NWE-Flanders-7.jpg` —— **The Withdrawal to the Coast**（向海岸的撤退）
  - `maps/UK-NWE-Flanders-8.jpg` —— **Situation on the evening of 28th May, 1940**
  - `maps/UK-NWE-Flanders-9.jpg` —— **Situation on the evening of 29th May, 1940**
  - `maps/UK-NWE-Flanders-10.jpg` —— **Situation on the evening of 30th May, 1940**
  - `maps/UK-NWE-Flanders-11.jpg` —— **Situation on the evening of 1st June, 1940**
  - `maps/UK-NWE-Flanders-xii.jpg` —— **Sea Routes from Dunkirk**（自敦刻尔克的海上航线）
  - `maps/UK-NWE-Flanders-xiii.jpg` —— **Dunkirk Harbour**（敦刻尔克港）
  → **★ 这一组「每日傍晚态势图」（26、27、28、29、30 日与 6 月 1 日）
    是校验 `data/fronts/*.json` 各帧的最佳一手依据。**
    **强烈建议 Lead 与写手逐帧对照这六张图。**
  → **版权提示**：Ellis 官方战史为**公有领域**（Crown copyright，
    英国政府作品，已过版权期；HyperWar 亦声明为公有领域）。
    **照片与地图的使用仍请核对 `public/campaigns/dunkirk-1940/photos/credits.json` 的署名要求。**


---

## 6. 来源清单

**访问日期**：除另注明外，全部来源的访问日期为 **2026-10-16**（本笔记编制日）。
**抓取方式**：维基来源使用
`curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=<条目>&action=raw"`；
官方战史使用 `curl` 抓取 HyperWar 的 HTML 后以自编 node 脚本去除标签与解码实体。

### 6.1 一手档案 / 官方出版物（公有领域）

| 来源 id | 全称 | URL | 访问日期 | 置信度 |
|---|---|---|---|---|
| **dynamo_despatch** | Ramsay, Vice-Admiral Sir Bertram H. *The Evacuation of the Allied Armies from Dunkirk and Neighbouring Beaches*（Operation "Dynamo" 战报，1940-06-18 呈海军部；London Gazette 增刊，1947-07-17，第 38016 期第 3299 页起） | 全文（OCR）：`https://archive.org/download/RamsayDespatchCopy/Ramsay%20Despatch%20-%20Copy_djvu.txt`<br>原刊：`https://www.thegazette.co.uk/London/issue/38016/supplement/3299` | 2026-10-16 | **high** |
| **ellis_1953** | Ellis, Major L. F. *The War in France and Flanders 1939–1940*（History of the Second World War, United Kingdom Military Series）, HMSO, 1953 | 索引：`https://www.ibiblio.org/hyperwar/UN/UK/UK-NWE-Flanders/`<br>各章：`.../UK-NWE-Flanders-<N>.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.8** | 同上，第 VIII 章「The Canal Line, 23rd May」 | `.../UK-NWE-Flanders-8.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.9** | 同上，第 IX 章「24th May and 25th May, 1940」 | `.../UK-NWE-Flanders-9.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.10** | 同上，第 X 章「Defence of the Channel Ports, 22nd May to …」 | `.../UK-NWE-Flanders-10.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.11** | 同上，第 XI 章「The Decision to Evacuate, 26th May, 1940」 | `.../UK-NWE-Flanders-11.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.12** | 同上，第 XII 章「Dunkirk, Bethune and Ypres, 27th May, 1940」 | `.../UK-NWE-Flanders-12.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.13** | 同上，第 XIII 章「After the Belgian Surrender, 28th May, 1940」 | `.../UK-NWE-Flanders-13.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.14** | 同上，第 XIV 章「The Final Withdrawal, 29th May, 1940」 | `.../UK-NWE-Flanders-14.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.15** | 同上，第 XV 章「The Defence of the Bridgehead, 30th May and 31st May, 1940」 | `.../UK-NWE-Flanders-15.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.16** | 同上，第 XVI 章「Last Days at Dunkirk, 1st June to 4th June, 1940」 | `.../UK-NWE-Flanders-16.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.21** | 同上，第 XXI 章（含 Lancastria 沉没记载） | `.../UK-NWE-Flanders-21.html` | 2026-10-16 | **high** |
| **ellis_1953 ch.23** | 同上，第 XXIII 章「Conduct and Consequences of the Campaign」（伤亡与装备损失总表） | `.../UK-NWE-Flanders-23.html` | 2026-10-16 | **high** |
| **ellis_1953 App.II** | 同上，附录 II「French and German Texts quoted in translation」（含 Halder 日记、AOK 4 KTB、A 集团军群 KTB 德文原文摘录） | `.../UK-NWE-Flanders-II.html` | 2026-10-16 | **high** |
| **ellis_1953 Supplement** | 同上，补编「The Planning and Conduct of the German Campaign」 | `.../UK-NWE-Flanders-Supplement.html` | 2026-10-16 | **high** |

- **★ `dynamo_despatch` 的重要提示（写手必读）** ——
  本笔记使用的是 **Internet Archive 的 OCR 全文**（`Ramsay Despatch - Copy_djvu.txt`，
  130,884 字节，4,589 行）。
  **该 OCR 存在明显的识别错误**，已知的问题包括：
  1. **附录 II 的分日数字表严重错乱**（如「5,7 l8」「6 i ,557」「n.327」「i,797」）；
  2. **附录 I 中「日期」栏与「舰名」栏错位**（如 Gracie Fields / Skipjack / Waverley 三行）；
  3. 正文中偶有「i£ miles」（应为 1½ miles）、「mad」（应为 made）、
     「tne」（应为 the）等。
  **本笔记在引用时已逐处标注 OCR 存疑。写手若需精确数字，
  请以 `ellis_1953` 的对应章节为首选，Ramsay 战报为交叉验证。**
  **原刊（thegazette.co.uk）在本次访问中返回 HTTP 202 且内容为空，
  未能核对原始排版。**

### 6.2 维基百科条目（wikitext raw）

| 来源 id | 条目 | URL（`action=raw`） | 大小 | 置信度 |
|---|---|---|---|---|
| **wiki:Dunkirk_evacuation** | Dunkirk evacuation | `https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw` | 66 KB | **high**（数字与表格）／medium（叙述性判断） |
| **wiki:Battle_of_Dunkirk** | Battle of Dunkirk | `...title=Battle_of_Dunkirk&action=raw` | 48 KB | medium–high |
| **wiki:Battle_of_France** | Battle of France | `...title=Battle_of_France&action=raw` | 181 KB | **high**（伤亡数字表） |
| **wiki:German_invasion_of_Belgium_(1940)** | German invasion of Belgium (1940) | `...title=German_invasion_of_Belgium_(1940)&action=raw` | 117 KB | **high** |
| **wiki:Battle_of_the_Lys_(1940)** | Battle of the Lys (1940) | `...title=Battle_of_the_Lys_(1940)&action=raw` | 16 KB | medium |
| **wiki:Battle_of_the_Ypres–Comines_Canal** | Battle of the Ypres–Comines Canal | `...title=Battle_of_the_Ypres-Comines_Canal&action=raw` | 13 KB | **high** |
| **wiki:Siege_of_Calais_(1940)** | Siege of Calais (1940) | `...title=Siege_of_Calais_(1940)&action=raw` | 68 KB | **high**（逐时叙述） |
| **wiki:Battle_of_Boulogne** | Battle of Boulogne | `...title=Battle_of_Boulogne&action=raw` | 41 KB | **high** |
| **wiki:Siege_of_Lille_(1940)** | Siege of Lille (1940) | `...title=Siege_of_Lille_(1940)&action=raw` | 17 KB | **high** |
| **wiki:Leopold_III_of_Belgium** | Leopold III of Belgium | `...title=Leopold_III_of_Belgium&action=raw` | 39 KB | **high** |
| **wiki:Le_Paradis_massacre** | Le Paradis massacre | `...title=Le_Paradis_massacre&action=raw` | —— | **high** |
| **wiki:Operation_Aerial** | Operation Aerial | `...title=Operation_Aerial&action=raw` | 64 KB | **high** |
| **wiki:Little_Ships_of_Dunkirk** | Little Ships of Dunkirk | `...title=Little_Ships_of_Dunkirk&action=raw` | 31 KB | medium |
| **wiki:List_of_ships_involved_in_the_Dunkirk_evacuation** | List of ships involved in the Dunkirk evacuation | `...title=List_of_ships_involved_in_the_Dunkirk_evacuation&action=raw` | 74 KB | **high**（逐船表，含指挥官与撤出人数） |
| **wiki:James_Campbell_Clouston** | James Campbell Clouston | `...title=James_Campbell_Clouston&action=raw` | 12 KB | medium（细节丰富但多为转述） |
| **wiki:William_Tennant_(Royal_Navy_officer)** | William Tennant (Royal Navy officer) | `...title=William_Tennant_(Royal_Navy_officer)&action=raw` | 15 KB | **high** |
| **wiki:HMS_Grafton_(H89)** | HMS Grafton (H89) | `...title=HMS_Grafton_(H89)&action=raw` | 9.7 KB | **high** |
| **wiki:HMS_Wakeful_(H88)** | HMS Wakeful (H88) | `...title=HMS_Wakeful_(H88)&action=raw` | 8.6 KB | **high** |
| **wiki:HMS_Grenade_(H86)** | HMS Grenade (H86) | `...title=HMS_Grenade_(H86)&action=raw` | 10 KB | **high** |
| **wiki:HMS_Keith** | HMS Keith | `...title=HMS_Keith&action=raw` | 12 KB | **high**（含 09:45 沉没时刻） |
| **wiki:HMS_Havant_(H32)** | HMS Havant (H32) | `...title=HMS_Havant_(H32)&action=raw` | 8.4 KB | **high** |
| **wiki:HMS_Basilisk_(H11)** | HMS Basilisk (H11) | `...title=HMS_Basilisk_(H11)&action=raw` | 11 KB | **high** |
| **wiki:PS_Medway_Queen** | PS Medway Queen | `...title=PS_Medway_Queen&action=raw` | 26 KB | **high** |
| **wiki:SS_Mona's_Queen_(1934)** | SS Mona's Queen (1934) | `...title=SS_Mona's_Queen_(1934)&action=raw` | 20 KB | **high**（含 05:30 触雷时刻） |
| **wiki:Sundowner_(yacht)** | Sundowner (yacht) | `...title=Sundowner_(yacht)&action=raw` | 11 KB | **high** |
| **wiki:RMS_Lancastria** | RMS Lancastria | `...title=RMS_Lancastria&action=raw` | 40 KB | **high** |
| **wiki:Marcus_Ervine-Andrews** | Marcus Ervine-Andrews | `...title=Marcus_Ervine-Andrews&action=raw` | 9.7 KB | **high** |
| **wiki:Kampfgeschwader_2** | Kampfgeschwader 2 | `...title=Kampfgeschwader_2&action=raw` | 16 KB | **high**（含 5-27 III./KG 2 损失 11/27） |
| **wiki:Kampfgeschwader_3** | Kampfgeschwader 3 | `...title=Kampfgeschwader_3&action=raw` | 48 KB | medium |
| **wiki:Kampfgeschwader_54** | Kampfgeschwader 54 | `...title=Kampfgeschwader_54&action=raw` | 65 KB | **high** |
| **wiki:Sturzkampfgeschwader_2** | Sturzkampfgeschwader 2 | `...title=Sturzkampfgeschwader_2&action=raw` | 96 KB | medium（1940 年 5 月的基地信息稀少） |
| **wiki:Jagdgeschwader_27** | Jagdgeschwader 27 | `...title=Jagdgeschwader_27&action=raw` | 136 KB | **high** |
| **wiki:Jagdgeschwader_26** | Jagdgeschwader 26 | `...title=Jagdgeschwader_26&action=raw` | 115 KB | medium（本笔记未深入挖掘） |
| **wiki:Zerstörergeschwader_26** | Zerstörergeschwader 26 | `...title=Zerstörergeschwader_26&action=raw` | 83 KB | medium（本笔记未深入挖掘） |
| **wiki:No._11_Group_RAF** | No. 11 Group RAF | `...title=No._11_Group_RAF&action=raw` | 24 KB | medium（**未含 Dynamo 分日架次**） |

- **★ 使用维基来源时的重要提示** ——
  1. **维基本身不是一手史料。** 本笔记在引用维基时，
     尽量同时给出其所引的原始文献（如 `Ellis 1993 p.255`、
     `Frieser 1995 p.400`、`Lord 1982 p.148`、`Atkin 1990 pp.170–71`）。
     **写手若能取得这些原始文献，应优先引用原始文献。**
  2. **维基的 `sfn` 模板在 raw wikitext 中给出页码**，
     但本笔记**未逐页核对原书**。
     凡本笔记写「引 X 书 p.N」处，均为**转引**，confidence 相应降一档。
  3. **维基条目的信息框数字常与正文不一致。**
     本笔记在遇到此类情况时已明确标注（如里尔的 34,957 vs 35,000）。

### 6.3 `data/sources/main.json` 中已登记但本笔记未直接使用的来源

以下来源已在战役的 `main.json` 中登记，但**本笔记在本次查证中未直接获取其原文**。
写手如需引用，**请只写来源 id，不要编造页码或原文**：

| 来源 id | 说明 | 本笔记的状态 |
|---|---|---|
| `korth_1958` | Korth《Der Halte-Befehl vor Dünkirchen》 | **未获取原文**，未给页码 |
| `frieser_2005` / `blitzkrieg_legend` | Frieser《The Blitzkrieg Legend》/《Blitzkrieg-Legende》 | **未获取原书**；仅通过 `wiki:Siege_of_Calais_(1940)` 与 `wiki:Battle_of_France` 转引 |
| `jacobsen_1957` | Jacobsen《Dünkirchen 1940》 | **未获取原文** |
| `halder_diary` | Halder 战时日记（Jacobsen 编） | **未获取原书**；通过 `ellis_1953 App.II` 的德文原文摘录与 `wiki:Battle_of_Dunkirk` 所引 Shirer 转引 |
| `rundstedt_nuremberg` | IMT 纽伦堡卷宗第 XXXIV 卷 | **未获取原文**，未给页码 |
| `guderian_1951` | Guderian《Erinnerungen eines Soldaten》 | **未获取原书**；仅通过 `wiki:Siege_of_Calais_(1940)` 转引其否认丘吉尔说法的部分 |
| `blaxland_1980` | Blaxland《Dunkirk: The Necessary Myth》 | **未获取原书**，「必要的神话」的具体论点与页码未查到 |
| `lord_1982` | Lord《The Miracle of Dunkirk》 | **未获取原书**；通过维基转引（`p.148`、`pp.267–269`） |
| `sebag_2006` | Sebag-Montefiore《Dunkirk: Fight to the Last Man》 | **未获取原书**；通过维基转引（`p.250`、`p.506`） |
| `atkin_1990` | Atkin《Pillar of Fire》 | **未获取原书**；通过维基转引（`p.120`、`p.206`、`pp.170–71`、`pp.204–05`） |
| `thompson_1956` | Thompson《Dunkirk: Retreat to Victory》 | **未获取原书** |
| `divine_1940` | Divine《Dunkirk》（1940 年目击记） | **未获取原书** |
| `levine_2017` | Levine《Dunkirk: The History Behind the Major Motion Picture》 | **未获取原书** |
| 其余约 75 项 | —— | **本笔记未使用** |

- **★ 好消息（Lead 可考虑直接采用）** ——
  **Internet Archive 上有若干可借阅/检索的版本**，本次已确认存在：
  - `miracleofdunkirk0000lord`（Lord 1982/1983/1984/1998）、
  - `dunkirkfighttola0000seba`（Sebag-Montefiore 2006/2007/2015/2017）、
  - `miracleofdunkirk0000char`（2015 年版）。
  **本笔记尝试使用 Internet Archive 的 search-inside API 检索这些书，
  但该 API 在本次访问中未返回可用结果（三个端点均无输出）。
  如需引用原书页码，需通过正常借阅流程或图书馆获取。**

### 6.4 本笔记的核查方法与限度

**方法**

1. **优先抓取一手档案**：Ramsay 战报（`dynamo_despatch`）与
   Ellis 官方战史（`ellis_1953` 各章）作为主干，
   维基仅用于补充与交叉验证。
2. **对同一事实强制找第二个来源**。
   凡只找到一个来源的事实，confidence 一律降至 medium 或 low。
3. **OCR 疑点逐一标注**。
   `dynamo_despatch` 的附录 I 与附录 II 存在系统性的 OCR 错乱，
   本笔记在引用时逐处说明，**未用「看起来合理」的方式填补**。
4. **矛盾即并列，不作裁决**（除非有官方战史支持）。
   已知的并列矛盾包括：
   - Grafton 的攻击者：U-62（维基）vs U-69（Ellis）；
   - 6 月 4 日投降人数：约 40,000（Ellis）vs 35,000（维基）；
   - RAF 损失：145（Atkin）vs 177（Ellis）；
   - 船只损失：228/45（Ellis）vs 逾 200/相近（维基）；
   - Lancastria 死亡：近 3,000 / 5,800 人上船（Ellis）
     vs 4,000–7,000 / 2,477 幸存（维基）；
   - Gracie Fields 沉没日期：5-29 被击中、5-30 凌晨沉没（Ellis）
     vs 5-28（Ramsay 附录 OCR）；
   - Bourrasque 沉没原因：触雷（维基）vs 炸弹（Ramsay）。
5. **不填补空缺**。凡三层来源均未给出的数字（如英国空军在敦刻尔克的
   滞空分钟数、比利时与波兰的分国撤离人数、Luftwaffe 分机型损失、
   East Mole 的宽度与水深），本笔记明确写「不确定」或「未查到」。

**限度（须向 Lead 与写手明确）**

1. **本笔记只使用了免费可得来源。**
   `main.json` 中登记的绝大多数二次文献（专著）**未获取原文**。
   因此本笔记**不能**替代对 Korth、Jacobsen、Frieser、Blaxland、
   Lord、Sebag-Montefiore 等原书的核查。
2. **德军侧的时间线主要依赖 Ellis 官方战史转引的德文战时日志**
   （经 `ellis_1953 App.II` 与 `Supplement`）。
   这些摘录是**英方选择与翻译过的**，可能存在取舍偏差。
   德军各装甲师的**逐日精确位置**（到城镇名）在本笔记中
   只能做到 5 月 27–31 日的主要节点，**5 月 25–26 日与 6 月 1–4 日的
   德军装甲师位置颗粒度不足**。
3. **空中作战的分日数据**在英方一侧较完整（Ellis 逐章给出），
   在德方一侧**极不完整**，仅有零散的联队记载。
   **任何「Luftwaffe 每日出击架次」的数字都是本笔记没有的。**
4. **法军与比军的内部指挥细节**（如法军各师的逐日位置）
   在本笔记中仅覆盖到师级的主要节点，**未能做到逐时**。
5. **`web_search` 工具在本次会话中不可用**（缺少 API key），
   因此本笔记**未能进行独立的网络检索**，
   所有来源均来自任务书中给出的清单与维基的条目内链。
   这意味着**可能存在本笔记未发现的、更权威的专门研究**。

### 6.5 未查清的问题清单（供 Lead 决策是否需要补研）

| # | 问题 | 已尝试的途径 | 状态 |
|---|---|---|---|
| 1 | **第 13 号元首指令的 OKW/OKH 文件编号与签发分钟** | 维基两个条目、Ellis 附录 II、Führer 指令网站（跨域重定向失败） | **未查到**。只有日期（5-24） |
| 2 | **「停止前进令」在 Korth、Jacobsen 两部专著中的具体论点与页码** | 维基检索、Internet Archive 元数据 | **未查到** |
| 3 | **比利时、波兰、荷兰各国经敦刻尔克撤离的确切人数** | 维基三个条目、Ellis 全部相关章节、Ramsay 战报 | **未查到**。只有法国的 123,095 是权威数字 |
| 4 | **RAF 战斗机在敦刻尔克上空的滞空时间限制（分钟数）** | Ellis 全部章节、Ramsay 战报、wiki:No._11_Group_RAF | **未查到**。常被引用的「40 分钟」无法核实 |
| 5 | **No. 11 Group 在 5-26 至 6-4 的逐日出击架次与损失** | wiki:No._11_Group_RAF、Ellis 各章 | **仅查到 5-27（22 次巡逻、287 架次）与 Ellis 的逐日文字描述**，无完整表格 |
| 6 | **Luftwaffe 在敦刻尔克时段的分机型损失** | wiki:KG 2/3/54、StG 2、JG 26/27、ZG 26 | **未查到**。只有 5-27 的「23 架 Do 17」与 5-29 的「11 架 Ju 87」 |
| 7 | **德军用于敦刻尔克的完整机场清单及与敦刻尔克的准确距离** | wiki:各联队条目、Ellis | **仅查到 Quakenbrück、Varrelbusch、Gütersloh、Cologne/Ostheim、Guînes、Monchy-Breton**，其余不详 |
| 8 | **东防波堤的宽度与水深** | Ellis ch.14、Ramsay 战报、wiki 三个条目 | **未查到**。只有长度 1,600 码与「狭窄」的定性描述 |
| 9 | **德军在敦刻尔克桥头堡战斗中的单独人员伤亡** | wiki:Battle_of_France、Ellis ch.23 | **未查到**。所有德军数字均为法国战役全程口径 |
| 10 | **各装甲师（第 1、2、6、8、9、10）在 5-25/26 与 6-1 至 6-4 的逐日精确位置** | Ellis ch.9、ch.12、ch.15、ch.16 | **部分查到**（5-27 至 5-31 的主要节点），但两端颗粒度不足 |
| 11 | **Rundstedt 纽伦堡证词的卷页** | 维基转引 | **未查到** |
| 12 | **Priestley 1940-06-05 BBC 广播的原话** | 维基参考文献（仅给出 BBC 档案链接） | **未获取文本** |
| 13 | **Blaxland「必要的神话」的具体论点与页码** | 维基、Internet Archive | **未查到** |
| 14 | **Darlan 5-31 干预的原始文件** | Ellis ch.16、Ramsay 战报 | **未查到**。只有丘吉尔《最光辉的时刻》的转述 |
| 15 | **Massey Shaw 号撤出人数的确切数字** | Ramsay 战报 §105（仅记 4 次往返）、wiki:Little_Ships | **未查到确切人数** |
| 16 | **Lady of Mann 号在敦刻尔克的具体事迹** | Ramsay 附录 I（OCR 破损）、Ellis、wiki | **未查到** |
| 17 | **RAF 各中队与具体机场的对应关系（5-26 至 6-4）** | Ellis、wiki:No._11_Group_RAF | **未查到** |
| 18 | **Frieser 2005 在 pp.287–296 范围内的逐页论点** | 维基转引 | **未逐页核实** |

---

## 附：本笔记中被反复引用的关键数字速查表

| 数字 | 含义 | 来源 | 置信度 |
|---|---|---|---|
| **18:57** | 1940-05-26 海军部下令「发电机行动开始」的时刻 | dynamo_despatch §1 | **high** |
| **18:10** | 1940-05-23 第 4 集团军日志记「明日大体停止」的时刻（停止前进令） | ellis_1953 Supplement p.347 | **high** |
| **11:30** | 1940-05-24 希特勒抵达 Charleville 背书停止前进令 | ellis_1953 ch.9 | **high** |
| **12:42** | 1940-05-24 Rundstedt 以「元首命令」发出未加密电报，被英方截获 | wiki:Dunkirk_evacuation | **high** |
| **16:00** | 1940-05-26 加来防线崩溃 | wiki:Siege_of_Calais_(1940) | medium |
| **00:45** | 1940-05-29 HMS Wakeful 被 S-30 鱼雷击中断为两半 | dynamo_despatch §27 | **high** |
| **02:50** | 1940-05-29 HMS Grafton 被鱼雷命中 | dynamo_despatch §27 | **high** |
| **05:30** | 1940-05-29 SS Mona's Queen 触磁性水雷，两分钟内沉没 | wiki:SS_Mona's_Queen_(1934) | **high** |
| **16:00** | 1940-05-29 对东防波堤的大规模空袭开始（Ellis 作 15:30） | dynamo_despatch §30 | **high** |
| **04:00** | 1940-05-28 比利时军队投降生效 | wiki:Battle_of_the_Lys_(1940) | **high** |
| **00:00** | 1940-05-31/06-01 里尔口袋法军投降（Wäger 授予战争荣誉） | wiki:Siege_of_Lille_(1940) | **high** |
| **09:45** | 1940-06-01 HMS Keith 沉没 | wiki:HMS_Keith | **high** |
| **12:00** | 1940-06-01 HMS Basilisk 在浅水中被击沉 | wiki:HMS_Basilisk_(H11) | **high** |
| **18:00** | 1940-06-01 SNO 电文：「自 05:30 起超过 100 架轰炸机」 | dynamo_despatch §64 | **high** |
| **07:00** | 1940-06-02 海军部令停止敦刻尔克撤离（至 17:30） | dynamo_despatch §65 | **high** |
| **15:30** | 1940-06-02 Clouston 乘 RAF 摩托艇 243/270 自多佛出发 | dynamo_despatch §79 | **high** |
| **23:30** | 1940-06-02 SNO 报告「B.E.F. 已撤离」 | dynamo_despatch §84 | **high** |
| **03:18 / 03:40** | 1940-06-04 Express / Shikari 作为最后两艘船驶离敦刻尔克 | dynamo_despatch §90 | **high** |
| **03:20** | 1940-06-04 法军最后一批在码头敬礼后离岸（Troup 报告） | ellis_1953 ch.16 | **high** |
| **09:00** | 1940-06-04 剩余法军投降（约 40,000 人） | ellis_1953 ch.16 | **high**（时刻）／medium（人数） |
| **10:20** | 1940-06-04 德军在敦刻尔克码头升起卐字旗 | wiki:Battle_of_Dunkirk | medium |
| **11:00** | 1940-06-04 法方海军部同意行动告终（前一夜撤出 27,000 人） | dynamo_despatch §91 | **high** |
| **14:23** | 1940-06-04 海军部电报正式终止「发电机行动」 | dynamo_despatch §91；ellis_1953 ch.16 | **high** |
| **338,226** | 总撤离人数（抵英口径） | ellis_1953 ch.16；dynamo_despatch App.II | **high** |
| **98,671 / 239,555** | 海滩 / 港口登船数 | wiki:Dunkirk_evacuation 表格 | **high** |
| **308,888** | 其中由 Ramsay 指挥之船只运出者 | ellis_1953 ch.16 | **high** |
| **2,000 人/小时** | 东防波堤的常态登船速率（1940-05-28 07:00） | dynamo_despatch §24；ellis_1953 ch.13 | **high** |
| **1,600 码** | 东防波堤长度 | ellis_1953 ch.14 | **high** |
| **39 / 87 海里** | Route Z / Route Y 的航程 | ellis_1953 ch.12 | **high** |
| **68,111** | BEF 战役总伤亡（5-10 至 6-22） | ellis_1953 ch.23 | **high** |
| **2,472 / 63,879 / 20,548** | 损失的火炮 / 车辆 / 摩托车 | ellis_1953 ch.23 | **high** |
| **228 / 45** | 损失的船只 / 重创的船只 | ellis_1953 ch.16 | **high** |
| **6 / 23 / 41** | 沉没 / 受损 / 参战的驱逐舰 | dynamo_despatch App.I | **high** |
| **177 / 240** | RAF 毁与伤 / Luftwaffe 在法比上空的毁与伤 | ellis_1953 ch.16 | **high** |
| **35** | 6 天（5-27 至 6-1）内被皇家海军舰炮击落的敌机 | dynamo_despatch App.III | **high** |
| **27,074 / 111,034 / 18,384** | 德军在法国战役全过程的阵亡 / 负伤 / 失踪 | wiki:Battle_of_France 引 Frieser 1995 p.400 | medium |

---

**（研究笔记完）**

> **致 Lead**：本笔记在编制过程中发现 `docs/CONTRACT.md` §4、§11.2
> 有四处时刻需要修正（见 §1.11 的对照表），
> 且 §10 的每日登船表遗漏了 5 月 26 日。
> 另有 §3.6（RAF 是否失职）为本笔记新增的争议条目，建议纳入战役文案。
> 如需要，本笔记可继续扩充德军各装甲师的逐日位置颗粒度
> 与法军各师的逐日位置颗粒度。
