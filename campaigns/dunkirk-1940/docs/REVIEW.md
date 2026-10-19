# 敦刻尔克 1940 · 独立审查报告

> 审查人：独立历史审查员（adversarial review）
> 审查对象：`campaigns/dunkirk-1940/`（敦刻尔克大撤退 1940）
> 审查基线（下文所有结论均针对这一版）：
>
> | 文件 | md5 | 最后修改 |
> |---|---|---|
> | `campaign.json` | `ba96a401a02798990745fb22740afbda` | 2026-10-16 17:26 |
> | `data/events.json` | `c8fbeb428180bf61b766731d11444fdb` | 2026-10-16 17:11 |
> | `data/naval/dynamo.json` | `642cae962e4f5eb6a8da0fe8e2744ea8` | — |
> | `data/forces.json` | `19ef29953723b8208ddbeaa93805c7cd` | — |
> | `data/fronts/*.json`（12 帧） | — | 2026-10-16 16:42 |
>
> `npm run validate -- --campaign dunkirk-1940` 在本基线：**0 错误 / 53 警告**（警告全部为图外地名与图外轨迹点，属契约 §3 有意保留）。**本报告不含任何由校验器即可发现的错误** —— 下面每一条都是校验器通过、但史实或逻辑不成立的条目。

---

## 0. 方法与范围（哪些文件审了、哪些没审、为什么）

### 0.1 审了的文件

| 类别 | 文件 | 数量 |
|---|---|---|
| 清单 | `campaign.json`（993 行） | 1 |
| 事件 | `data/events.json` | **82 条**（逐条读正文） |
| 海军 | `data/naval/dynamo.json` | `signals 13 / damage 15 / hits 16 / torpedoes 6 / fire 6 / smoke 3` |
| 序列 | `data/oob/{gb 59, fr 39, be 35, sea 46}.json` | 179 单位（+ de 49，见 §0.2） |
| 路线 | `data/routes/{gb 29, fr 20, be 13, garrisons 7, sea 6}.json` | 75 条 |
| 战线 | `data/fronts/*.json` | 12 帧（逐帧重算几何） |
| 其他 | `data/{gazetteer/places.json 239, overlays.json 36, pockets.json 4, demarcation.json 7, forces.json, equipment.json 29, sources/main.json 97}` | — |
| 文档 | `docs/CONTRACT.md`、`docs/RESEARCH-NOTES.md`（4281 行）、`docs/VERIFICATION.md`（359 行） | 3 |
| 引擎 | `engine/schema/zod.ts`、`engine/ui/eventCard.ts`、`engine/ui/sidebar.ts`、`tools/validate/validate.ts` | 读源码以判断「数据错」还是「渲染问题」 |

### 0.2 **没审的文件（明确排除）**

- **`data/oob/de.json`（49 单位）** —— 按审查指令，德军战斗序列不在本次审查范围（另一名写手仍在写）。本报告中德军单位**仅**在「非德军文件（事件正文、`data/fronts/`、`data/naval/`）引用了它」时才被提及，且只审「引用是否成立」，不审德军单位自身的数据。
- **`data/routes/de.json`** —— 同上，德军路线不在范围。

### 0.3 方法

1. **机械检查**：自写 Node 脚本重算 12 帧战线多边形、判定每个地名/网格点的归属、重算每条轨迹的航段速度（按 `u.ship` 分「节」与「km/天」两套口径）、重算 `data/routes/sea.json` 折线长度并与 `label` 对账；跑 `npm run validate` 作为底线。
2. **史料复核**：以 Wikipedia `?action=raw` 原文、Ellis《The War in France and Flanders》官方战史（`ibiblio.org/hyperwar/UN/UK/UK-NWE-Flanders/` ch.11–16、23）、`zdump` 时区数据库、Nominatim/OSM 地理编码为外部证据。**每条结论都附文件 + 对象 id + 原文片段 + 外部出处。**
3. **不作答的诚实**：无法裁决的列 §3，无法核实的列 §6，已核对无误的列 §5。**没有为了凑数而把「风格偏好」写进 §1。**

### 0.4 审查期间包的变动（重要）

本包在审查过程中**被其他写手持续修改**，属移动靶：

- `data/events.json`：**58 → 82 条**（16:48 与 17:11 两次合并）。本报告全部结论已针对 **82 条**的当前文件重新逐条验证，未沿用 58 条快照。
- `campaign.json`：`status` 由 `draft` → `published`（17:26）。
- `data/oob/de.json`、`data/routes/de.json`：审查中途出现（已排除）。
- **已修正、未回退**（我复核确认）：`marks` 的 `05-26T16:00 加来陷落`（原 19:00）、`time.end = 06-04T14:23`、`naval` 的 `h.cyclone_torp.shooter` 由 `de.s23` 改 `de.s24`、`sig.lancastria` 已删、`gb.havant` 与 `gb.basilisk` 的终态时刻已与 `damage` 对齐。

---

## 1. 事实错误（必须改）

> 判定标准：与可查证的史料直接冲突，或**在自身数据内部算术不成立**。风格问题一律不入本节。

### 1.1 【高】韦克福号死亡人数在算术上不可能成立（自相矛盾且超出任何史料口径）

- **文件/对象**：`data/naval/dynamo.json` → `hits.h.wakeful_torp`（`killed: 733`，`effect` 文本）；同一数字复制到 `damage[ship=gb.wakeful].note` 与 `signals.sig.wakeful_distress.zh`。
- **原文**（`h.wakeful_torp.effect`）：
  > 「S-30 号发射的两条鱼雷命中「韦克福」号……**640 名士兵中约 635 人、以及 98 名舰员丧生**，仅 25 名舰员与 5 名士兵获救——这是撤离行动中单舰死亡人数最多的一次」
  `damage` 记录同时写：「载员 **640 人（维基）／650 人（Ellis 官方战史）两说**，其中约 635 名士兵与 98 名舰员丧生，仅 25 名舰员与 5 名士兵获救」。
  `sig.wakeful_distress.zh` 又写：「约 **640** 名士兵与 **97** 名舰员随舰丧生」（97 ≠ 98）。
- **问题**：
  1. **算术不成立**：640 名士兵 − 5 名生还士兵 = **635 名士兵死亡**（本条自洽）；但舰员呢？`oob/sea.json` 的 `gb.wakeful` 写 `crew: 134`，史料记全舰编制约 110–134 人。若 98 名舰员死亡 + 25 名舰员生还 = **123 人**（可以成立），则**士兵死亡 635 + 舰员死亡 98 = 733**，但同一句里的「640 名士兵」只包含士兵，加上 123 名舰员 = **全舰 763 人**，远超 134 人编制的可能。
  2. 更直接的矛盾：文本说「**640 名士兵中约 635 人**……丧生」，紧随其后又说「仅 5 名士兵获救」——635 + 5 = 640 ✓，所以 635 名士兵死亡本身是自洽的。真正不可能的是**同时**声称「98 名舰员丧生」且「25 名舰员获救」：123 名舰员 + 640 名士兵 = 763 人，而 `damage.note` 自己说全船载员是 640/650。**同一段里 640+123 ≠ 640 或 650。**
  3. **与史料冲突**：Wikipedia `HMS Wakeful (H88)`（原文）：
     > "Casualties were heavy, **only five of the 640 Allied troops** … **plus 25 of *Wakeful*'s crew survived**."
     即生还者 5 名士兵 + 25 名舰员 = 30 人，死亡 = 载员 − 30。若载员 640 名士兵 + 约 110–134 名舰员，**士兵死亡 635、舰员死亡约 85–109**，总数在 720–744 之间但**绝不等同于「640 名士兵中的 635 人加上 98 名舰员」这种把它当同一批人算的写法**。三条记录（`effect`/`note`/`signal`）给出 **733 / 733 / 737**（640+97）三个不同的总数。
- **影响**：`hits.killed` 是引擎实际读取并显示在舰船面板上的字段（`engine/naval/model.ts:151` 求和、`engine/ui/shipPanel.ts:110` 渲染「阵亡 733」）。这是**用户可见的错误数字**。
- **建议改法**：删去把两组人相加得到的「733」。改为分列写法，例如：
  > 「载员 640 名士兵（维基）／650（Ellis）两说；生还者 5 名士兵与 25 名舰员。士兵死亡约 635 人，舰员死亡按编制（110–134 人）计约 85–109 人——**单舰死亡人数为撤离行动之最**，但精确总数史料无定论。」
  `hits.killed` 建议改为 `null`/省略（引擎会按 `?? 0` 处理），或取「约 635 名士兵」这一有据的数字而**不要**再加舰员。
- **出处**：`https://en.wikipedia.org/w/index.php?title=HMS_Wakeful_(H88)&action=raw`（"only five of the 640 Allied troops … plus 25 of Wakeful's crew survived"）。
- **严重度**：**高**（用户可见的错误数字 + 文件内三处互相矛盾）。

### 1.2 【高】`e.dk_air_29may` 把韦克福号写成「清醒号」，并把 S-30 的攻击时刻写作「夜里 11 时」

- **文件/对象**：`data/events.json` → `e.dk_air_29may`（`at: 1940-05-29T16:00`）
- **原文**：
  > 「5 月 29 日德国空军全力压制海峡。凌晨 3 时，格拉夫顿号在敦刻尔克外海被 U-62 的鱼雷击中，**次日自沉**；下午掷弹兵号在港内被炸沉；**夜里 11 时，清醒号**在返航途中被 S-30 的鱼雷击沉，船上六百余人仅少数获救。」
  照片题注（同文件 `photo.caption`）：「皇家海军**清醒号**驱逐舰，5 月 29 日夜被 S-30 击沉」
- **问题（三处）**：
  1. **船名错**：本战役的规范译名是「**韦克福号**」（`data/oob/sea.json` 的 `gb.wakeful.name.zh = "韦克福号"`、`short = "Wakeful"`）。「清醒号」在全包其他 81 条事件与 `oob`/`naval` 中**零出现**，是把 Wakeful 误读成了另一艘船。同一条事件的正文与题注用的是错名，而**它引用的 Commons 文件恰恰是** `File:HMS Wakeful WWII IWM FL 12547.jpg`（照片索引 `public/campaigns/dunkirk-1940/photos/index.json` 该键下 `title: "HMS Wakeful WWII IWM FL 12547"`）——**文件名和题注指的是同一艘船，只有题注译错**。
  2. **时刻错**：`data/naval/dynamo.json` 本包自己的记录是 `h.wakeful_torp.at = 1940-05-29T00:40`、`damage[gb.wakeful].at = 1940-05-29T00:45`，`oob/sea.json` 的 `gb.wakeful` 末点也是 `05-29T00:45`（`note`：「00:45 被德军 S-30 号鱼雷艇击中两条鱼雷（Ramsay 战报 §27）」）。即攻击发生在 **5 月 29 日凌晨 0 时 40 分左右**，而事件正文写「**5 月 29 日夜里 11 时**」——那是 **5 月 29 日的末尾**，与包内三处记录差近 23 小时。（Ramsay 战报 §27 与 Wikipedia 均记该攻击在 28/29 日之交的午夜后。）
  3. **「次日自沉」错**：格拉夫顿号（`gb.grafton`）不是「次日自沉」，而是**当日 05:30 由「伊万霍」号以炮火击沉**。包内 `damage[gb.grafton].note` 自己写着：「……幸存者由「伊万霍」号与运兵船「马利讷斯」号接下，**05:30 由「伊万霍」号炮火击沉**」。Wikipedia `HMS Ivanhoe (D16)`："…took aboard the crew of the badly damaged destroyer HMS *Grafton* and then **scuttled** *Grafton*."
- **影响**：单一事件内三处事实错，且正文与 `naval`/`oob` 数据直接冲突。这条事件 `importance: 1`（最高级），出现在多佛/敦刻尔克锚地主视角的中心位置。
- **建议改法**：
  > 「5 月 29 日德国空军全力压制海峡。**当日凌晨 0 时 40 分**，**韦克福**号在返航途中被 S-30 的鱼雷击沉，船上六百余人仅三十人生还；赶来救援的**格拉夫顿**号随后也被鱼雷命中，**凌晨 5 时 30 分由「伊万霍」号击沉**；下午「格内德」号在港内被炸沉。当日仍有四万七千余人撤出，是行动开始以来最多的一天。」
  题注改为「皇家海军**韦克福**号驱逐舰，5 月 29 日凌晨被 S-30 击沉」。
- **出处**：包内 `data/naval/dynamo.json`、`data/oob/sea.json`；`https://en.wikipedia.org/w/index.php?title=HMS_Ivanhoe_(D16)&action=raw`；`https://en.wikipedia.org/w/index.php?title=HMS_Wakeful_(H88)&action=raw`。
- **严重度**：**高**（船名 + 时刻 + 处置三错，且与包内数据矛盾）。

### 1.3 【高】航线 X 与航线 Y 的「史载」海里数错（51 / 94 应为 55 / 87）

- **文件/对象**：`data/routes/sea.json` → `r.dk_sea_route_x.label`、`r.dk_sea_route_y.label`；`data/overlays.json` → `ov.dk_route_y.note`；`data/events.json` → `e.dk_nv_next_of_kin`（`05-30T07:00`）
- **原文**：
  - `r.dk_sea_route_x.label`：「X 航线 · **史载 51 海里 / 95 km** · 本航迹折线 48 海里 / 88 km」
  - `r.dk_sea_route_y.label`：「Y 航线 · **史载 94 海里 / 175 km** · 本航迹折线 92 海里 / 170 km」
  - `ov.dk_route_y.label`：「Route Y（……**最长约 87 海里**，最险）」← 注意**同一包内 `overlays` 写的是 87**，与 `routes` 的 94 冲突
  - `e.dk_nv_next_of_kin` 正文：「最安全的 X 航线要绕行吕坦让水道与北古德温灯船，**五十一海里**；最长的 Y 航线……**九十四海里**、四小时」
- **问题**：
  - **X 航线**：Wikipedia `Dunkirk evacuation`：「Ships on this route travelled **{{convert|55|nmi|km}}** north out of Dunkirk, proceeded through the Ruytingen Pass, and headed towards the North Goodwin Lightship…」→ **55 海里（约 102 km）**，不是 51。包内 `RESEARCH-NOTES.md:2998` 亦承认「**本笔记未查到 X 的绝对海里数**」，用往返 108 英里间接推出「约 47 海里」——**51 这个数字在包内与包外都无出处**。
  - **Y 航线**：Wikipedia 同段：「The longest of the three was Route Y, a distance of **{{convert|87|nmi|km}}**」；Ellis ch.12 原文：「**Route Z covers thirty-nine sea miles, route Y eighty-seven.**」→ **87 海里（约 161 km）**，不是 94。
  - **94 的来历**：175 km ÷ 1.852 = 94.5 海里。即 **94 是把「175 km」这个 km 口径数字反算成海里的产物**，而 175 km 本身对应的「史载 87 海里」应是 **161 km**。这是一次单位换算把错误固化进了三个文件。
  - 包内 `RESEARCH-NOTES.md:3052` 自己已经记下矛盾：「**与「39 / [约 47] / 87 海里」（≈72 / 87 / 161 km）不一致**」——即**研究笔记已标记过该冲突，但修正没有落到数据里**（`routes/sea.json` 与 `events.json` 仍是 51/94）。
- **建议改法**：`r.dk_sea_route_x.label` 的「史载 51 海里 / 95 km」改为「**史载 55 海里 / 102 km**」；`r.dk_sea_route_y.label` 的「史载 94 海里 / 175 km」改为「**史载 87 海里 / 161 km**」；`ov.dk_route_y.note` 删掉「一说 175 km」或改为「（另一种口径按折线航迹约 170 km）」；`e.dk_nv_next_of_kin` 正文的「五十一海里」「九十四海里」同步改为「五十五海里」「八十七海里」。`CONTRACT.md:276-278` 的 55/95/175 km 表述也应统一（否则契约与数据继续打架）。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw`（Route X 55 nmi、Route Y 87 nmi）；Ellis ch.12 `https://www.ibiblio.org/hyperwar/UN/UK/UK-NWE-Flanders/`（"Route Z covers thirty-nine sea miles, route Y eighty-seven"）；包内 `docs/RESEARCH-NOTES.md:2998, 3052`。
- **严重度**：**高**（三个文件 + 事件正文的同一数字错，且包内已有两说并存的痕迹）。

### 1.4 【高】`e.dk_nv_siroco_sunk` 说西克洛纳号「被**炸**掉舰艏」，实为被**鱼雷**打掉

- **文件/对象**：`data/events.json` → `e.dk_nv_siroco_sunk`（`at: 1940-05-31T02:30`）
- **原文**：
  > 「……同一夜，「西克洛纳」号**被炸掉舰艏**，勉强拖着五节航速回到多佛。」
- **问题**：本包 `data/naval/dynamo.json` 自己的记录是 `hits.h.cyclone_torp`（`target: fr.cyclone`、`shooter: **de.s24**`、`weapon: "tt"` = 鱼雷）与 `torpedoes.t.s24_cyclone`。Wikipedia `French destroyer Cyclone (1925)`：「the German Navy E-boat **S24 hit her with a torpedo, blowing her bow off**… two members of her crew missing」。**「被炸」（炸弹）与「中雷」（鱼雷）是两种完全不同的武器**，而同一段文字的前半句还正确写着「被德军 S-23、S-26 号**鱼雷艇**夹击」——上下文里「鱼雷艇」与「被炸」并列，读者会误以为是空袭。
- **建议改法**：「「西克洛纳」号**被 S-24 号鱼雷艇的鱼雷打掉舰艏**，勉强拖着五节航速回到多佛。」
- **出处**：包内 `data/naval/dynamo.json`（`h.cyclone_torp` / `t.s24_cyclone`）；`https://en.wikipedia.org/w/index.php?title=French_destroyer_Cyclone_(1925)&action=raw`。
- **严重度**：**高**（武器种类错，与包内 `naval` 数据直接矛盾）。

### 1.5 【高】`e.dk_nv_daylight_halted` 把伊万霍号的伤亡（26 人）挂到了阿文特号名下

- **文件/对象**：`data/events.json` → `e.dk_nv_daylight_halted`（`at: 1940-06-01T09:15`）
- **原文**：
  > 「……「基思」号在离港前被炸沉，三十三人阵亡；「巴兹利斯克」号锅炉舱中弹后失去全部动力，正午被第三波空袭击沉；**「阿文特」号被命中上层甲板、二十六人阵亡**；法国「富德罗扬」号也在港外被炸沉。」
- **问题**：**「上层甲板被命中 + 26 人阵亡」是伊万霍号（HMS *Ivanhoe*）的战损，不是阿文特号（HMS *Havant*）的。**
  - Wikipedia `HMS Ivanhoe (D16)`：「…the third detonated **above the upper deck** and flooded the two forward boiler rooms. The bomb **killed 26**, including five soldiers…」（`data/naval/dynamo.json` 的 `h.ivanhoe_bomb.killed = 26` 与此一致，`note` 亦写「08:05 被炸弹命中上层甲板，前锅炉舱进水、26 人阵亡」）。
  - Wikipedia `HMS Havant (H32)`：阿文特号是**机舱中弹两枚、舰底一枚**，`data/naval/dynamo.json` 记 `h.havant_bomb1.killed = 33`（8 名舰员 + 至少 25 名士兵，25 人受伤）。
  - 即：**26 人 ↔ 伊万霍号，33 人 ↔ 阿文特号**，事件把两者互换了，并且把「上层甲板」这个伊万霍号的细节也一并搬到了阿文特号身上。
- **影响**：这条事件是本包唯一描述 6 月 1 日白昼停摆的核心事件（`importance: 1`）。
- **建议改法**：
  > 「……「基思」号在离港前被炸沉，三十三人阵亡；「巴兹利斯克」号锅炉舱中弹后失去全部动力，正午被第三波空袭击沉；**「伊万霍」号被一枚炸弹在上层甲板爆炸、前锅炉舱进水，二十六人阵亡**；**「阿文特」号机舱中弹、三十三人阵亡**；法国「富德罗扬」号也在港外被炸沉。」
- **出处**：`https://en.wikipedia.org/w/index.php?title=HMS_Ivanhoe_(D16)&action=raw`；`https://en.wikipedia.org/w/index.php?title=HMS_Havant_(H32)&action=raw`；包内 `data/naval/dynamo.json`（`h.ivanhoe_bomb` / `h.havant_bomb1`）。
- **严重度**：**高**（舰名与伤亡互换，且 33 人这个数字在本事件中被基思号独占，阿文特号的真实伤亡完全消失）。

### 1.6 【高】`e.dk_daylight_stop` 点名「伊卡洛斯号与温莎号重创」——伊卡洛斯不在序列中，温莎当日的战损也不在 6 月 1 日

- **文件/对象**：`data/events.json` → `e.dk_daylight_stop`（`at: 1940-06-02T07:00`）
- **原文**：
  > 「6 月 1 日是最后一次大规模昼间撤离。当天德国空军集中攻击海峡内的船队，驱逐舰**巴西利斯克号**与基思号被炸沉，**伊卡洛斯号与温莎号重创**，扫雷舰与渡轮损失多艘。」
- **问题（两处）**：
  1. **伊卡洛斯号（HMS *Icarus*, D03）不在 `data/oob/sea.json` 的 46 艘舰船中**（脚本扫描确认 `gb.icarus` 不存在）。Wikipedia `HMS Icarus (D03)` 全文**找不到 6 月 1 日受损的记载**，只在 "She participated in Operation Dynamo" 一句里出现——**「重创」无出处**。
  2. **温莎号（HMS *Windsor*, D42）确实在序列中**，但 Wikipedia `HMS Windsor (D42)` 明确把她的战损记在 **5 月 28 日**：「On **28 May**, *Windsor* herself came under a heavy and sustained attack by **15 German aircraft**, which bombed and strafed her, inflicting **30 casualties** on her crew and causing significant damage, forcing her to return to Dover.」6 月 1 日她的记录是「evacuating **493 troops** on 1 June」（正常运兵，无战损）。**把 5 月 28 日的重创写进 6 月 1 日的事件，是日期错位。**
  3. 另外「6 月 2 日晨 7 时，海军部下令停止在敦刻尔克的撤离作业」这一句**时刻正确**（`dynamo_despatch §65`），但 `marks` 与 `events` 对同一件事用了两个不同措辞（「昼间撤离停止」vs「白昼撤离被迫停止」），见 §4。
- **建议改法**：
  > 「6 月 1 日是最后一次大规模昼间撤离。当天德国空军集中攻击海峡内的船队，「巴兹利斯克」号与「基思」号被炸沉，「伊万霍」号与「阿文特」号战损严重，扫雷舰与渡轮损失多艘。（此前 5 月 28 日，「温莎」号曾在十五架德机的持续攻击下伤亡三十人。）」
  或直接删去伊卡洛斯号与温莎号，改为包内有记录的舰只。
- **出处**：`https://en.wikipedia.org/w/index.php?title=HMS_Icarus_(D03)&action=raw`；`https://en.wikipedia.org/w/index.php?title=HMS_Windsor_(D42)&action=raw`；包内 `data/oob/sea.json`。
- **严重度**：**高**（一名不存在的舰 + 一处日期错位）。

### 1.7 【高】德军「十九个师」与包内三处数字全部冲突，且无出处

- **文件/对象**：`campaign.json` → `title.description`（第 13 行）与 `intro.paragraphs[1]`（第 911 行）
- **原文**：
  - 第 13 行：「……比利时投降，**德军十九个师**压向敦刻尔克桥头堡。」
  - 第 911 行：「……**德军十九个师**从南、东两面压上，卡塞尔、贝尔格、尼乌波特逐村血战。」
- **问题**：包内 `data/forces.json` 对同一件事给了**三个互相不同的数字**，但没有一个是 19：
  - `sides.DE.divisions`：「**约 38 个师**（其中装甲师 6、摩托化师 4）围困敦刻尔克桥头堡」
  - `byPhase["p.launch"].DE.divisions`：「约 **16** 个师」
  - `byPhase["p.crisis"].DE.divisions`：「约 **24** 个师」
  - `byPhase["p.night"].DE.divisions`：「约 **30** 个师」
  「19 个师」在 `docs/RESEARCH-NOTES.md`、`docs/CONTRACT.md`、`data/**` 中**零出处**（全包 grep 只命中 `campaign.json` 这两行与 `forces.json` 的 38）。简介用的是全包唯一一个既不等于 38、也不等于任何 `byPhase` 数字的值。
- **建议改法**：简介是面向用户的入口文案，不宜给单一数字。改为与 `forces.json` 一致的表述：
  > 「德军从南、东两面压上，兵力由初期的约十六个师逐日增至约三十个师……」
  或统一改为「德军**三十余个师**」（对应 `byPhase.p.night`）。**关键是三处（description / intro / forces）必须一致。**
- **出处**：包内 `data/forces.json`（`sides.DE.divisions`、`byPhase.*.DE.divisions`）；全包 grep 确认 19 无其他出处。
- **严重度**：**高**（用户第一眼看到的简介数字与包内数据矛盾）。

### 1.8 【高】`le_paradis` 坐标偏北约 5 km，落在错误 communes 的田地里

- **文件/对象**：`data/gazetteer/places.json` → `le_paradis`（`pos: [2.7, 50.56]`，`zh: "勒帕拉迪"`，`country: "FR"`）
- **问题**：帕拉迪屠杀发生地是 **Lestrem 乡的 Le Paradis 小村**，不是另一个同名地点。
  - Wikipedia `Le Paradis massacre` 信息框：`| location = Le Paradis hamlet, commune of Lestrem, northern France`；坐标 `{{Coord|50|35|42|N|2|38|52|E}}` = **50.5950 / 2.6478**。
  - FR Wikipedia `Massacre du Paradis`：`| lieu = Lestrem, France`；正文「au hameau du Paradis dans la commune française de **Lestrem** (Pas-de-Calais)」。
  - Nominatim/OSM 查询 "Le Paradis, Lestrem, France"：`lat 50.6017353, lon 2.6516291`（`addresstype: hamlet`，`display_name: Le Paradis, Lestrem, Béthune, Pas-de-Calais…`）。
  - Lestrem 本村：`50.6231 / 2.6858`（FR Wikipedia 信息框）；Nominatim 关系 `50.6216 / 2.6858`。
  - 包内值 `50.56 / 2.70` 距屠杀地 **约 5.3 km（正南偏东）**，距 Lestrem 村约 **8.2 km**。这个位置落在 Lestrem 以南、La Bassée 运河一带的**其他 commune**（约在 Violaines / Givenchy-lès-la-Bassée 之间），不在 Lestrem 境内。
- **影响链（5 处引用全部偏移）**：
  - `data/events.json` `e.dk_leparadis.place = "@le_paradis"` —— 事件地图定位点错。
  - `data/oob/gb.json` 两处 track 点（第 139–140 行 `1940-05-25T12:00` 与 `1940-05-27T06:00`，皇家诺福克第 2 营）—— 部队位置错 5 km。
  - `data/oob/de.json` 第 2014 行（德军侧，按 §0.2 不审其自身数据，但**引用的地名是错的**，故列此）。
  - `data/overlays.json` `ov.dk_lys_line.line = ["@armentieres","@estaires","@merville","@le_paradis","@bethune"]` —— **利斯河防线的折线在此处向南拐出一个 5 km 的尖角**，因为真实的 Le Paradis（50.595）比周边的 Merville（50.64）、Estaires（50.64）更靠南，而包内值（50.56）比它们南得多。
  - `data/routes/gb.json` 两处、`data/routes/de.json` 一处（德军路线，不审其自身，但同样受影响）。
- **建议改法**：`"pos": [2.6478, 50.5950]`（屠杀地精确坐标），或若意图是标村中心则 `[2.6516, 50.6017]`。改后 `ov.dk_lys_line` 的折线会自然拉直。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Le_Paradis_massacre&action=raw`；`https://fr.wikipedia.org/w/index.php?title=Massacre_du_Paradis&action=raw`；`https://fr.wikipedia.org/w/index.php?title=Lestrem&action=raw`；`https://nominatim.openstreetmap.org/search?q=Le+Paradis,+Lestrem,+France&format=json`。
- **严重度**：**高**（地名库单点错，被 5 处数据引用，含一条防线折线）。

### 1.9 【中】U-62 的舰型与性能写成了 IX C 型远洋潜艇

- **文件/对象**：`data/oob/sea.json` → `de.u62.ship`
- **原文**：`{"kind":"submarine","class":{"zh":"IX C 型远洋潜艇","orig":"Type IXC U-boat"},"lengthM":76.8,"beamM":6.8,"tonnage":1120,"tonnageKind":"std","maxKn":18.2,"crew":48}`
- **问题**：Wikipedia `German submarine U-62 (1939)` 信息框与正文均为 **Type IIC** 近海潜艇：
  > `|class=Type IIC coastal submarine`
  > 「''U-62'' had a displacement of **{{convert|291|t|LT}} when at the surface** and 341 t while submerged… a **total length of {{convert|43.90|m|ftin}}**, a beam of 4.08 m… a maximum **surface speed of {{convert|12|kn}}** and a maximum submerged speed of 7 kn… a complement of **25**.」
  包内的 `lengthM 76.8 / tonnage 1120 / maxKn 18.2 / crew 48` 是 **IX C 型**的典型数据（IXC：76.8 m、1,120 t、18.2 kn、48 人）。**舰型、吨位、长度、航速、编制五项全错**，误差是「近海小艇」与「远洋大艇」之差（长度差 75%）。
- **影响**：`de.u62` 出现在 `data/events.json` 的两条事件（`e.dk_nv_u69_or_u62`、`e.dk_nv_grafton_torp`）与 `data/naval/dynamo.json` 的 `h.grafton_torp.shooter` 中——**它是击沉格拉夫顿号的争议攻击者**，是本次审查的关键单位之一。其性能数据会被引擎按 `maxKn` 校验航迹（`tools/validate/validate.ts:189-193`），18.2 节的上限会让一条 IXC 的轨迹合法通过，而真实的 IIC（12 节）可能超限。
- **建议改法**：改为 `class: {zh: "II C 型近海潜艇", orig: "Type IIC U-boat"}`、`lengthM: 43.9`、`beamM: 4.08`、`tonnage: 291`、`maxKn: 12`、`crew: 25`。
- **出处**：`https://en.wikipedia.org/w/index.php?title=German_submarine_U-62_(1939)&action=raw`。
- **严重度**：**中**（不是叙事错，但影响引擎校验与舰船卡展示；且 U-62 正好是争议焦点单位）。

### 1.10 【中】`gb.coventry` 与 `gb.keith` 的舰船规格是同级舰的整块复制，两处数值与 Wikipedia 不符

- **文件/对象**：`data/oob/sea.json` → `gb.coventry.ship` 与 `gb.calcutta.ship`；`gb.keith.ship` 与 `gb.basilisk.ship`
- **证据（我逐字段 diff 了 `ship` 对象）**：
  - **`gb.coventry` 与 `gb.calcutta` 的 `ship` 除 `pennant`（D43 vs D82）外全部字段逐字相同**：`kind`、`class`、`lengthM`、`beamM`、`tonnage`、`tonnageKind`、`maxKn`、`crew`、`silhouette`、`weapons`（3 项，含 `atPct` 值）——`JSON.stringify` 比较结果为 `SAME`。
  - **`gb.keith` 与 `gb.basilisk` 的 `ship` 除 `class.zh`（「B 级驱逐舰（驱逐舰分队领舰）」vs「B 级驱逐舰」）外也全部相同**，包括 `tonnage: 1360`、`crew: 138`、`lengthM: 98.5`、`maxKn: 35` 与 6 项 `weapons`。
- **与 Wikipedia 的差异**：

  | 项 | 包内 | Wikipedia | 判定 |
  |---|---|---|---|
  | `gb.coventry` 吨位 | **4,290** | **4,190 t**（`HMS Coventry (D43)` 信息框：`\|displacement=4,190 tons`） | ❌ 错 100 t |
  | `gb.coventry` 编制 | **400** | **327**（同条目：`\|complement=327`） | ❌ 错 73 人 |
  | `gb.calcutta` 吨位 | 4,290 | 4,290 t standard（`HMS Calcutta (D82)`） | ✅ |
  | `gb.calcutta` 编制 | 400 | 330–350（信息框）/ 432（正文引 Conway） | ⚠️ 口径差异，可接受 |
  | `gb.keith` 吨位 | **1,360** | **1,400 t**（`HMS Keith`：`displaced 1,400 LT at standard load`） | ❌ 错 40 t |
  | `gb.keith` 编制 | **138** | **175**（同条目：`The ship's complement was 175 officers and men`；领舰编制大于普通舰） | ❌ 错 37 人 |
  | `gb.basilisk` 吨位 | 1,360 | 1,360 t（`HMS Basilisk (H11)`：`displaced 1,360 LT at standard load`） | ✅ |
  | `gb.basilisk` 编制 | 138 | 134 / 142 wartime | ⚠️ 介于两者，可接受 |

- **问题**：
  1. **Coventry 与 Calcutta 虽然同属 C 级 Carlisle 组，但 1936 年改装防空巡洋舰时取舍不同**（Coventry 的编制 327、排水 4,190 t，Calcutta 为 330–350 / 4,290 t）。把两舰写成完全相同的数值，是**在同级舰之间复制粘贴**，其中一舰必然错。
  2. **Keith 是 B 级驱逐舰的「分队领舰」（flotilla leader）**，`class.zh` 自己都写了「（驱逐舰分队领舰）」——领舰通常**更重、编制更大**（1,400 t / 175 人 vs Basilisk 的 1,360 t / 142 人）。包内却给它与 Basilisk 完全相同的 1,360 t / 138 人，**与它自己声明的「领舰」身份矛盾**。
- **影响**：`ship.crew` 会被舰船面板与战损比照使用；`tonnage` 会显示在舰船卡上。这两艘舰都在 `data/events.json` 中有专门事件（`gb.coventry` 参与防空掩护、`gb.keith` 于 06-01 被炸沉且 `h.keith_bomb.killed = 33`——33 人占 175 编制的 19%，占 138 编制的 24%，会影响读者对伤亡比例的判断）。
- **建议改法**：`gb.coventry` → `tonnage: 4190`、`crew: 327`；`gb.keith` → `tonnage: 1400`、`crew: 175`。**`weapons` 数组（6 项/3 项，含 `atPct`）也应逐舰复核**——我没有逐项核对武器配置，只确认了两组对象完全相同这一事实（见 §6.11）。
- **出处**：`https://en.wikipedia.org/w/index.php?title=HMS_Coventry_(D43)&action=raw`（`|displacement=4,190 tons`、`|complement=327`）；`https://en.wikipedia.org/w/index.php?title=HMS_Keith&action=raw`（`displaced 1,400 LT`、`complement was 175`）；`https://en.wikipedia.org/w/index.php?title=HMS_Basilisk_(H11)&action=raw`（`displaced 1,360 LT`、`complement was 134 … increased to 142`）；`https://en.wikipedia.org/w/index.php?title=HMS_Calcutta_(D82)&action=raw`。
- **严重度**：**中**（4 个数值错，且错误的成因是可识别的系统性复制粘贴，可能波及其他同级舰）。

### 1.11 【中】`e.dk_de_lille_honours` 说韦格被「撤职」，史料只记「被训斥」

- **文件/对象**：`data/events.json` → `e.dk_de_lille_honours`（`at: 1940-06-01T10:00`）
- **原文**：
  > 「……此举在德军内部引来非议，希特勒六月二日在康布雷得知后勃然大怒，**将韦格撤职**，理由是这延误了向敦刻尔克的推进。」
- **问题**：
  - Wikipedia `Siege of Lille (1940)`：「…a compliment for which **Wäger was reprimanded**.」（`{{sfn|Fermer|2013|p=208}}`）——**reprimanded = 申斥/训斥，不是撤职**。
  - 德文 Wikipedia `Alfred Wäger`（更细）：「Als Hitler am 2. Juni bei seiner Ankunft in Cambrai davon erfuhr, war er außer sich und **ließ Wäger maßregeln**.」——`maßregeln` = 惩戒/训斥。
  - 德文条目信息框另记：Wäger 的 XXVII 军军长任期是 **1939-11-06 至 1941-12-23**——即 **1940 年 6 月他并未去职**，如果他 6 月 2 日被撤职，任期不可能延续到 1941 年底。
  - 事件后半句「理由是这延误了向敦刻尔克的推进」也是**添加的因果**：两条来源都只说希特勒愤怒/训斥，无「延误推进」这一理由。
- **影响**：这是一条 `side: "DE"`、`category: "surrender"` 的事件，会给读者「一位军长因礼节被免职」的错误印象。
- **建议改法**：
  > 「……此举在德军内部引来非议。希特勒六月二日抵达康布雷得知后勃然大怒，**将韦格严加训斥**（一说受到惩戒）。这是 1940 年战役中唯一一次给予敌方守军荣誉受降的处置。」——删去「撤职」与「延误推进」。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Siege_of_Lille_(1940)&action=raw`；`https://de.wikipedia.org/w/index.php?title=Alfred_W%C3%A4ger&action=raw`。
- **严重度**：**中**（人物处置的性质错，且与信息框任期自相矛盾）。

### 1.12 【中】`e.dk_daylight_stop` 与 `e.dk_nv_daylight_halted` 把「36 小时的白昼停摆」写成「6 月 2 日起只剩夜间」，但同一包内 `dynamo_despatch §65` 说的是 6 月 2 日 07:00 **完全**停止撤离作业

- **文件/对象**：`data/events.json` → `e.dk_daylight_stop`（`06-02T07:00`）、`e.dk_nv_daylight_halted`（`06-01T09:15`）；`campaign.json` → `marks`（`06-02T07:00 昼间撤离停止`）
- **原文**：
  - `e.dk_nv_daylight_halted`：「当天撤出六万四千余人后，拉姆齐下令**此后只在夜间撤离**。」
  - `e.dk_daylight_stop`：「6 月 2 日晨 7 时，海军部下令**停止在敦刻尔克的撤离作业**，此后只剩夜间航运。」
  - `campaign.json` mark：`["1940-06-02T07:00", "昼间撤离停止"]`
- **问题**：三处措辞指向**三个不同的事件**：① 6 月 1 日「只在夜间」（白昼停、夜间继续）② 6 月 2 日 07:00「停止撤离作业」（全部停）③ mark 叫「**昼间**撤离停止」（只白昼停）。而包内 `docs/RESEARCH-NOTES.md` 与 `dynamo_despatch §65` 的原始记录是 **6 月 2 日 07:00 停止白昼作业、夜间继续**（Wikipedia `Dunkirk evacuation`：「A further 64,429 Allied soldiers departed on 1 June, before the increasing air attacks **prevented further daylight evacuation**」，且 6 月 2 日夜、3 日夜仍有 26,256 / 26,746 人撤离）。
  因此 `e.dk_daylight_stop` 的「**停止在敦刻尔克的撤离作业**」在字面上是**错的**——6 月 2 日与 3 日夜里还撤了五万三千人。这句与紧随其后的「此后只剩夜间航运」也自相矛盾（既已「停止作业」，何来「夜间航运」？）。
- **建议改法**：`e.dk_daylight_stop` 改为「海军部下令**停止白昼撤离作业**，此后只在夜间航运」；`e.dk_nv_daylight_halted` 的「此后只在夜间撤离」是 6 月 1 日当时的正确措辞，可保留，但建议与本条区分（一个是 6 月 1 日的战术调整，一个是 6 月 2 日的正式命令）。mark 措辞「昼间撤离停止」**正确**，无需改。
- **出处**：包内 `docs/RESEARCH-NOTES.md`（`dynamo_despatch §65`）；`https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw`。
- **严重度**：**中**（措辞导致的语义错，且句内自相矛盾）。

### 1.13 【中】`campaign.json` 的 `tzLabel` 说比利时当地时间与英国相同——1940-05-20 起比利时为 UTC+2

- **文件/对象**：`campaign.json` → `time.tzLabel`
- **原文**：`"英国夏令时 BST（UTC+1）· 与法国、比利时当地时间相同"`
- **问题**：1940 年 5–6 月的实际时区（`zdump -v` 实测）：
  | 时区 | 1940-05-26 至 06-04 的偏移 | 名称 |
  |---|---|---|
  | `Europe/London` | **UTC+1**（自 1940-02-25 02:00 UT 起） | BST |
  | `Europe/Paris` | **UTC+1**（WEST）（至 1940-06-14 22:00 UT 起改 CEST UTC+2） | WEST |
  | `Europe/Brussels` | **UTC+2**（CEST，**自 1940-05-20 02:00 UT 起**） | CEST |
  即**英国与法国在战役全程同为 UTC+1，比利时自 5 月 20 日起比它们快一小时**。「与法国、比利时当地时间相同」对法国成立、对**比利时成立不了**。
- **影响**：`utcOffset: 1` 本身对英法叙事是合理的（`engine/core/time.ts` 中 `utcOffset` 仅作叙事标注，不参与计算）。问题只在 `tzLabel` 这句说明性文案——它是**用户可见的口径声明**，且**比利时投降（05-28 04:00）、比利时各单位的时刻**都以本地钟点出现在事件与轨迹中。
- **建议改法**：改为「**英国夏令时 BST（UTC+1）· 1940 年 5 月 20 日起比利时已改用中欧夏令时（UTC+2），比英法快一小时**；本包时刻统一按 BST / 法国 WEST（UTC+1）书写，比利时侧时刻已在正文注明。」
  若不做详细说明，至少删去「、比利时」三字。
- **出处**：`zdump -v Europe/London`、`zdump -v Europe/Paris`、`zdump -v Europe/Brussels`（本机 tzdata 实测，上方表格即原始输出）。
- **严重度**：**中**（口径声明错，影响所有比利时侧时刻的解读）。

### 1.14 【低】「三十九艘驱逐舰」与「近七百艘小船」的数目在包内有两种口径

- **文件/对象**：`campaign.json` → `intro.paragraphs[2]`、`hub.blurb`
- **原文**：
  - `intro`：「英国海军出动 **39 艘驱逐舰**、上百艘扫雷舰与拖网渔船，加上**近七百艘**征用的游艇、明轮船与泰晤士驳船」
  - `hub.blurb`：「**三十九艘驱逐舰**与**近七百艘小船**往返加来海峡」
- **核对**：
  - **39 艘驱逐舰**：Wikipedia `Dunkirk evacuation` line 49：「Many troops were able to embark … onto **39 British Royal Navy destroyers**, four Royal Canadian Navy destroyers, at least three French Navy destroyers…」；line 132：「The Royal Navy provided the anti-aircraft cruiser HMS *Calcutta*, **39 destroyers**, and many other craft.」→ **39 是「英方驱逐舰」的准确数字** ✅ 表述无误。
  - **「近七百艘」**：Wikipedia 同条目 line 49 说「a hastily assembled fleet of **over 800 vessels**」；包内 `docs/RESEARCH-NOTES.md:1560` 记录「**英方 693 艘**（沉 226）/ 盟方 168 艘（沉 17）」。**693（英方）与 800+（总数）是两个口径**，而 intro 的「近七百艘征用的游艇、明轮船与泰晤士驳船」把 693 这个**英方全部船只数**说成了「小艇数」——**小艇实际约 400 艘**（Wikipedia：「by 31 May nearly **four hundred small craft** were voluntarily … taking part」；包内 `e.dk_nv_small_ships` 自己也写「到三十一日已有**近四百艘小艇**自发渡海」）。
- **问题**：「近七百艘小船」与同包 `e.dk_nv_small_ships` 的「近四百艘小艇」相差近一倍，且把 693 的「英方船只总数」误用作「小艇数」。
- **建议改法**：改为「英国海军出动 39 艘驱逐舰、上百艘扫雷舰与拖网渔船，加上**近四百艘**征用的游艇、明轮船与泰晤士驳船（各方投入船只总数逾八百艘）」。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw`；包内 `data/events.json` `e.dk_nv_small_ships`、`docs/RESEARCH-NOTES.md:1560`。
- **严重度**：**低**（数字口径混用，未到「事实错」，但同一包内两处自相矛盾，见 §2）。

### 1.15 【低】`e.dk_nv_la_panne_shuttle` 的「一千八百五十六人」与本包/史料的 1,200 人不同

- **文件/对象**：`data/events.json` → `e.dk_nv_la_panne_shuttle`（`at: 1940-05-28T19:00`）
- **原文**：
  > 「防空巡洋舰「加尔各答」号在拉帕讷海滩外抛锚，由扫雷舰「火蜥蜴」号、「萨顿」号与拖船「爪哇」号及八艘小船把士兵一船船摆渡过来，**共接上一千八百五十六人**。」
- **问题**：Wikipedia `HMS Calcutta (D82)`：「She evacuated **656 troops on the night of 27/28 May** 1940, when she operated off La Panne, and a further **1,200 troops on the night of 28/29 May**.」包内 `docs/RESEARCH-NOTES.md:684` 记录 `dynamo_despatch §28` 的说法：「**12:00 —— HMS Calcutta 得以靠上 La Panne 海滩用小艇接人，自各扫雷舰上接下 1,200 名部队**，随后驶往 Sheerness」。
  即 **1,200（或 656 + 1,200 分两夜）**，与事件标题「接运一千八百人」及正文的**1,856** 都不吻合。`1,856` 在包内与两条来源中均**无出处**。
- **建议改法**：若指 28/29 夜，改为「**一千二百人**」；若想合并两夜则写「两夜共约一千八百五十人（656 + 1,200）」，并明确说这是**两夜合计**——当前的写法（单次驳运 1,856）在史料中找不到对应。
- **出处**：`https://en.wikipedia.org/w/index.php?title=HMS_Calcutta_(D82)&action=raw`；包内 `docs/RESEARCH-NOTES.md:684`。
- **严重度**：**低**（数字无出处，但与 1,200+656 之和接近，属口径不清）。

### 1.16 【中】`e.dk_nv_darkest_day` 把「整个行动中 19 艘驱逐舰**受伤**」写成了「当天损失十九艘**军舰**」

- **文件/对象**：`data/events.json` → `e.dk_nv_darkest_day`（`at: 1940-05-29T16:02`，`importance: 3`）
- **原文**：
  > 「施图卡俯冲轰炸机让这一天成了海军最惨的日子……当天英法共损失**十九艘军舰**与三艘大型征用船。」
- **问题**：Wikipedia `Dunkirk evacuation` 的两个数字**都不支持这个说法**：
  - 「Six British and three French destroyers **were sunk**, along with nine other major vessels. In addition, **19 destroyers were damaged**.」（`{{sfn|Murray|Millett|2000|p=81}}`）——**这是整个「发电机行动」九天的累计数，不是 5 月 29 日当天的数**；而且 **19 是「受伤」，不是「损失」**。
  - 5 月 29 日当天的实际损失（Wikipedia 同日段落 + Ellis ch.14）：**Grenade 被炸沉**（加上 28/29 日之交的 Wakeful 与 Grafton），另有 **Mistral 被炸成重伤、Jaguar 与 Verity 重创、两艘拖网渔船被毁**——**当天沉没的军舰是三艘驱逐舰**，不是十九艘。
  - **「十九艘军舰」若指全行动的沉没总数也不对**：全行动沉没的是「6 艘英方驱逐舰 + 3 艘法方驱逐舰」= **9 艘驱逐舰**，另加 9 艘其他大型船只。
  - 因此「十九艘军舰」**在任何一种口径下都不成立**：它既不是当天的沉没数（3 艘），也不是全行动的沉没数（9 艘驱逐舰），而是**把「全行动 19 艘驱逐舰受伤」错记为「当天 19 艘军舰损失」**。
- **建议改法**：
  > 「……当天英法共**损失三艘驱逐舰、多艘大型船只被击沉，另有数十艘船只受损**。整个行动中英法共损失九艘驱逐舰、另有十九艘驱逐舰受损。」
- **出处**：`https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw`（累计数与 29 日段落）；Ellis ch.14（`https://www.ibiblio.org/hyperwar/UN/UK/UK-NWE-Flanders/`：「Of the eleven British ships against the mole the *Grenade*, *Fenella*, *Crested Eagle*, *Polly Johnson* and *Calvi* were so damaged that they sank at once or shortly afterwards」）。
- **严重度**：**中**（数字的口径（当天 vs 全行动）与性质（沉没 vs 受伤）双重错位）。

---

## 2. 内部矛盾

> 判定标准：包内两个文件（或同一文件的两处）对同一件事的说法不能同时为真。**本节不含纯粹的风格差异。**

### 2.1 【高】战线关键帧：贝尔格在 05-31 帧被划入德军控制区，而 06-01 帧又退回盟军——与该帧自己的 `note` 直接矛盾

- **文件/对象**：`data/fronts/1940-05-31T12-00.json`、`data/fronts/1940-06-01T12-00.json`
- **几何证据**（我重算 `control.DE[0][0]` 环，对 `@bergues` = `[2.4333, 50.9686]` 做点内判定与边界距计算）：

  | 关键帧 | 贝尔格归属 | 到战线距离 |
  |---|---|---|
  | 05-30T12:00 | 盟军 | 7.7 km |
  | **05-31T12:00** | **德军** | **0.0 km**（恰在环上） |
  | **06-01T12:00** | **盟军** | 5.5 km |
  | 06-02T22:00 | 德军 | 1.3 km |

- **矛盾点**：
  1. `06-01T12:00.json` 的 `note` 写「**德军猛攻贝尔格**；东段退向尼乌波特—拉帕讷」——**攻**贝尔格，说明贝尔格**尚未失守**，与 05-31 帧已把它划入德军控制区矛盾。
  2. 同一帧的 `pipeline/build/build_fronts.py` 源码里，`BERGUES_POCKET = [[2.40, 50.915], [2.50, 50.925]]` 的注释明确写：「**贝尔格（2.433, 50.969）：1940-06-02 夜陷落之前仍在盟军手中 → 战线在其南侧绕行**」——**生成脚本自己声明贝尔格在 6 月 2 夜之前属盟军**，但 05-31 帧的锚点列表 `['bourbourg','spycker','bergues','veurne',…]` **直接把 `bergues` 当作战线锚点**（即边界穿过贝尔格），使该点落到德军一侧。
  3. 包内 `campaign.json` `marks` 也把「**贝尔格陷落**」定在 `1940-06-02T22:00`，`data/fronts/1940-06-02T22-00.json` 的 `note` 写「贝尔格 2 日夜陷落」。**唯一说贝尔格 5 月 31 日就在德军手里的，只有那一帧的几何。**
- **建议改法**：`05-31T12:00` 帧的锚点去掉 `bergues`，改为 `BERGUES_POCKET` 绕行（与 05-30 帧同法），或直接沿用 05-30 帧的锚点列表。这样贝尔格会在 05-30 → 05-31 → 06-01 三帧保持盟军归属，到 06-02T22:00 再切换。
- **出处**：包内三个文件（`data/fronts/1940-05-31T12-00.json`、`1940-06-01T12-00.json`、`1940-06-02T22-00.json`）+ `pipeline/build/build_fronts.py` 第 48 行 `BERGUES_POCKET` 注释 + `campaign.json` `marks`。
- **严重度**：**高**（战线上出现「失守 → 收复 → 再失守」的来回，且生成脚本的注释与之直接冲突）。

### 2.2 【中】战线关键帧：05-30 帧把北段海岸线从阿丁凯尔一带「退回」到荷兰边界附近，与 `note` 无关且无史料依据

- **文件/对象**：`data/fronts/1940-05-29T12-00.json` → `1940-05-30T12-00.json`
- **几何证据**（0.02° 网格重算，`control.DE[0][0]`）：

  | 关键帧 | 德军控制网格数 | 相对上帧 |
  |---|---|---|
  | 05-29T12:00 | 4,323 | — |
  | **05-30T12:00** | **4,332** | **失去 284 格 / 得到 327 格** |
  | 05-31T12:00 | 4,349 | 失去 0 / 得到 17 |

  「失去 284 格」的包围盒 = `[2.18, 50.92, 2.38, 51.88]` —— 即**敦刻尔克以东至荷兰边界的整条北海海岸带**（经度 2.18–2.38、纬度延伸到 51.88），全部由德军控制**退回**盟军侧。
- **原因（可定位）**：
  - `05-29` 帧东端锚点：`…,"@vlamertinge",[2.57,50.755],[2.42,50.775],"@cappelle_la_grande",[2.36,50.775],"@spycker",**[2.247,52.9]**`
  - `05-30` 帧东端锚点：`…,"@veurne","@cassel","@spycker","@bourbourg",**[2.127,52.9]**`
  即收纳口从经度 **2.247** 退到 **2.127**（西移 0.12°，约 8.4 km），于是 2.127–2.247 之间的海岸带整体从 DE 槽掉出。而这两帧之间德军的实际态势是**向东推进**（`@veurne`、`@diksmuide` 首次进入 `05-30` 帧的锚点列表，比利时海岸已全在德军手中）。
- **矛盾点**：`05-30T12:00.json` 的 `note` 是「卡塞尔与格拉沃利讷失守；德军试探桥头堡，利斯运河一线反复争夺」——**完全没提北段海岸**，而几何上发生了一次 284 格的「撤退」。同样地，`05-29T12:00.json` 的 `note` 说「桥头堡收缩到贝尔格—弗尔讷运河一线」，暗示**德军已到弗尔讷**（`@veurne` = 2.66/51.07，在 2.247 以东），却把 DE 槽的东端锚点放在 2.247——**帧的几何比它的 note 保守**，到下一帧又突然西移。
- **建议改法**：`05-30T12:00` 帧的收纳经度改为与 05-29 帧一致或更东（如 `[2.9, 52.9]`，与 `@veurne` 的经度相称），使北段海岸保持德军控制；同时在 `note` 中把「东段」纳入描述。
- **出处**：包内 `data/fronts/1940-05-29T12-00.json`、`1940-05-30T12-00.json`（环顶点逐点对照）；`data/overlays.json` 无对应项；`docs/CONTRACT.md §4` 表中 `05-30T12:00` 一行的锚点写的是 `@bourbourg @spycker @bergues @veurne @diksmuide @gent`（**不含任何收纳经度**，也未说明东端）。
- **严重度**：**中**（用户会看到战线在地图上「倒退」，但帧的 `note` 未提及、史料也不支持）。

### 2.3 【中】战线关键帧：05-27 / 05-28 的格拉沃利讷归属在「盟军 — 德军」之间来回一次

- **文件/对象**：`data/fronts/1940-05-27T12-00.json`（格拉沃利讷 = 盟军）→ `1940-05-28T06-00.json`（= 德军）
- **几何证据**：
  - `05-27T12:00` 环第 15 点 = `[2.128, 50.986]`，第 16 点 = `[2.058, 52.900]`；`@gravelines` = `[2.1278, 50.9864]` 落在**环上**（距离 0.0 km），点内判定为**盟军侧**。
  - `05-28T06:00` 环第 14 点 = `[2.197, 50.947]`，第 15 点 = `[2.127, 52.900]`；同一地点**距离 0.0 km** 但**点内判定为德军侧**——因为它正好落在两条不同走向的边上。
- **问题**：`@gravelines` 被用作锚点意味着战线**穿过**该点，此时点内判定是**边界上的字面巧合**（两个帧给出相反结果，都因为点正好在环上）。而 `05-30T12:00.json` 的 `note` 又写「卡塞尔**与格拉沃利讷失守**」——即**直到 5 月 30 日才宣布格拉沃利讷失守**，但几何上 5 月 28 日就已经是德军控制。Wikipedia `Siege of Lille (1940)` 记「During the morning of 27 May, the 1st Panzer Division attacked Gravelines … cut off the garrison」（5 月 27 日上午进攻，尚未占领）；`docs/RESEARCH-NOTES.md` 无「格拉沃利讷陷落时刻」条目。
- **定性**：这是**锚点放在边界上**导致的判定不稳定，属于**数据一致性缺陷**而非史实错。但用户会看到格拉沃利讷的颜色在 5-27 → 5-28 之间翻转，而 `note` 说到 5-30 才「失守」。
- **建议改法**：不要把 `@gravelines` 同时作为锚点又作为归属判据。要么把该帧的收纳点东移（让格拉沃利讷明确落在德军侧），要么把「格拉沃利讷失守」从 `05-30` 帧的 `note` 中删去（若采纳前者），并统一三帧的表述。
- **出处**：包内三个帧文件（环顶点逐点对照）；`https://en.wikipedia.org/w/index.php?title=Siege_of_Lille_(1940)&action=raw`。
- **严重度**：**中**（可视化上出现归属翻转，根源是锚点与判据重合）。

### 2.4 【中】韦克福号伤亡在三个文件里给三个不同的数：733 / 737 / 自洽的 635

见 §1.1。这里是**跨文件矛盾**的清单：

| 文件 / 对象 | 声称的舰员死亡 | 声称的士兵死亡 | 合计 |
|---|---|---|---|
| `data/naval/dynamo.json` `hits.h.wakeful_torp` | **98** | 约 635 | **`killed: 733`** |
| `data/naval/dynamo.json` `damage[gb.wakeful].note` | **98** | 约 635 | （同 733，但含 640/650 两说） |
| `data/naval/dynamo.json` `signals.sig.wakeful_distress.zh` | **97** | 约 640 | 约 737 |
| `data/oob/sea.json` `gb.wakeful.ship.crew` | （编制 **134**） | — | — |
| `data/oob/sea.json` `gb.wakeful.track[8].note` | **97**（未写，但抄 `damage`） | 640/650 两说 | — |

**「约 640 名士兵与 97 名舰员随舰丧生」这一句本身就是错的**：若 640 名士兵中有 5 人生还，则士兵死亡 635；97 名舰员死亡 + 25 名舰员生还 = 122 名舰员——而全船编制只有 134 人（`oob` 自记），加上 640 名士兵共 774 人。**同一包内的四个数字无法自洽。**

### 2.5 【中】`e.dk_nv_peak_30_31`（05-30T12:00）引用 05-31 的登船数字

- **文件/对象**：`data/events.json` → `e.dk_nv_peak_30_31`（`at: 1940-05-30T12:00`）
- **原文**：「**五月三十日撤出 53,823 人**……**三十一日戈特勋爵本人离开**……这两天运量达到整个行动的顶峰」
- **矛盾点**：事件时刻是 **5 月 30 日 12:00**，正文却已经知道 5 月 31 日（当天尚未结束）的戈特离场与「这两天」的合计。这与 `docs/VERIFICATION.md §2.3` 记录的同类问题一致（该文件当时列为「待人工裁决」）。
- **定性**：**这是叙事口径问题**（日记式事件按天发布，回顾当夜时会把次日数字写进同一段），**不是数字错误**——53,823 与 68,014 两个数字本身都与 CONTRACT §10 一致。但**「三十一日戈特勋爵本人离开」这句在 05-30T12:00 时刻是未发生的事**，属提前引用。
- **建议改法**：把 `e.dk_nv_peak_30_31` 的 `at` 移到 `1940-05-31T23:59`，或把「三十一日戈特勋爵本人离开」一句删去（该内容已由 `e.dk_evac_peak`（05-31T12:00）与 `e.dk_nv_gort_leaves`（05-31T23:30）承载，**三处重复**）。
- **出处**：包内 `data/events.json` 三条事件；`docs/CONTRACT.md §10`（每日登船表）；`docs/VERIFICATION.md §2.3`。
- **严重度**：**中**（同一事实在三条事件里三写，且有两条是提前引用）。

### 2.6 【中】`e.dk_de_18th_army_command` 的「六月一日上午十一时全线总攻」与 6 月 1 日的实际经过不符，且与包内三条事件的时间线冲突

- **文件/对象**：`data/events.json` → `e.dk_de_18th_army_command`（`at: 1940-05-31T02:00`）
- **原文**：「……屈希勒随即下令**六月一日上午十一时全线总攻**。」
- **包内冲突**：
  - `e.dk_nv_daylight_halted`（06-01T09:15）：「「基思」号在离港前被炸沉……「阿文特」号被命中上层甲板」——**空袭在 09:00–09:15 已经在打**，而 `data/naval/dynamo.json` 的 `h.keith_bomb.at = 06-01T09:15`、`h.havant_bomb1.at = 06-01T09:05`、`h.basilisk_bomb1.at = 06-01T08:00`——**三次战损都早于 11:00**。
  - `e.dk_daylight_stop`（06-02T07:00）：「6 月 1 日是最后一次大规模昼间撤离。当天德国空军集中攻击海峡内的船队」——攻击在上午已开始，与「11 时总攻」不符。
- **史料**：Ellis ch.16 记 6 月 1 日的空袭「began about half past three in the afternoon」是 **5 月 29 日**的事（见 §5 的核对记录）；6 月 1 日的空袭在 `dynamo_despatch` 中自清晨起。我没有找到「6 月 1 日 11:00 全线总攻」这条命令的出处——`docs/RESEARCH-NOTES.md:836-838` 只记了「第 18 集团军下辖 IX、X、XIV、XXVI 军」与「第 9、11 摩托化旅、大德意志团」，**未记 11:00 总攻**。
- **建议改法**：删去「屈希勒随即下令六月一日上午十一时全线总攻」一句，或改为无时刻的表述（如「屈希勒随即部署对桥头堡的总攻」），以免与包内 09:05–09:15 的战损时刻冲突。
- **出处**：包内 `data/naval/dynamo.json`（三条 `hits` 的 `at`）、`data/events.json`（两条 6 月 1 日事件）；`docs/RESEARCH-NOTES.md:830-840`（无 11:00 记录）。
- **严重度**：**中**（命令时刻与包内战损时刻直接冲突）。

### 2.7 【低】`e.dk_lille_fall` 把荣誉受降的批准者写成冯·克鲁格，`e.dk_de_lille_honours` 写成韦格

- **文件/对象**：`data/events.json` → `e.dk_lille_fall`（`at: 1940-05-31T23:59`）与 `e.dk_de_lille_honours`（`at: 1940-06-01T10:00`）
- **原文**：
  - `e.dk_lille_fall`：「……德军**第 4 集团军司令冯·克鲁格**以荣誉受降礼相待，守军在军乐声中列队出城。」
  - `e.dk_de_lille_honours`：「……**第 XXVII 军军长韦格**批准给予「荣誉受降」……」
- **问题**：两条事件对**同一件事**给出两个不同的批准者。史料（Wikipedia `Siege of Lille (1940)`）：「The German commander, General **Alfred Wäger**, allowed the French the honours of war」；德文 Wikipedia 也是 Wäger。克鲁格（von Kluge）是第 4 集团军司令，**在 A 集团军群序列中确实是 Wäger 的上级**，但两条史料都没把荣誉受降记在他名下。**两说并非「两说」，而是同一个事实的两种归属，其中一个是错的。**
- **建议改法**：`e.dk_lille_fall` 改为「德军**第 XXVII 军军长韦格**以荣誉受降礼相待」（与 `e.dk_de_lille_honours` 统一）；若确要提克鲁格，应写成「其上级第 4 集团军未加阻止」之类的从属关系，而不是把批准权归他。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Siege_of_Lille_(1940)&action=raw`；`https://de.wikipedia.org/w/index.php?title=Alfred_W%C3%A4ger&action=raw`。
- **严重度**：**低**（两条事件互相矛盾，但其中一条与史料一致，读者若只读一条不会错）。

### 2.8 【低】`e.dk_lille_fall` 说里尔被「七个德国师（含**两个**装甲师）」合围，`docs/CONTRACT.md §10` 与史料说「含**三个**装甲师」

- **文件/对象**：`data/events.json` → `e.dk_lille_fall`（`at: 1940-05-31T23:59`）
- **原文**：「法国第 1 军在里尔被**七个德国师（含两个装甲师）**合围」
- **核对**：Wikipedia `Dunkirk evacuation` line 47：「the remaining 40,000 men of the French First Army fought a delaying action against seven German divisions, **including three armoured divisions**」；`Siege_of_Lille_(1940)` 信息框：`|strength2 = 4 infantry divisions / **3 panzer divisions**`。
- **问题**：**七个师含三个装甲师**，事件写「两个」。同一包内 `docs/CONTRACT.md §10` 只写「法军 35,000 余人 5-31 投降」，未给师数，**所以这个错在包内没有对照物可发现**。
- **建议改法**：「七个德国师（含**三个**装甲师）」。
- **出处**：`https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw`；`https://en.wikipedia.org/w/index.php?title=Siege_of_Lille_(1940)&action=raw`。
- **严重度**：**低**（单一数字错，不影响叙事）。

---

## 3. 疑似错误但无法裁决（列出两说）

> 这些条目**不能判定为错**：两条来源（或包内两处数据）各有依据，我无法在离线条件下裁决。**建议保留现状并在正文中明示两说**——本包在多数条目里已经这么做了，这是很好的做法。

### 3.1 韦克福号载员：640 人（Wikipedia）vs 650 人（Ellis 官方战史）

- 包内 `data/naval/dynamo.json` `damage[gb.wakeful].note` 已明示「载员 640 人（维基）／650 人（Ellis 官方战史）两说」。**这是诚实且正确的处置。**
- 两说：Wikipedia `HMS Wakeful (H88)`「only five of the **640** Allied troops … plus 25 of Wakeful's crew survived」；Ellis ch.14 的相关段落（`dynamo_despatch §27`）用 650。
- **注意**：无论取 640 还是 650，`hits.killed = 733` 都不成立（见 §1.1），所以**载员的两说不影响 §1.1 的判定**。

### 3.2 击沉格拉夫顿号的攻击者：U-62（Wikipedia）vs U-69（Ellis 官方战史）

- 包内 `data/events.json` `e.dk_nv_u69_or_u62` 已把两说并列写明：「维基百科记 U-62 号，Ellis 的英国官方战史记 U-69 号。两艇当日都在敦刻尔克以北海域活动，德方战报也不足以裁决。」**这是本次审查中最好的一条处置**，应保留。
- `data/naval/dynamo.json` 的 `h.grafton_torp.shooter = "de.u62"` 取了其中一说；`damage[gb.grafton].note` 也注明两说。**建议**：`shooter` 是单选字段，建议在 `note` 中继续保持两说说明（现已做到），不必改 `shooter`。
- 但注意：`e.dk_air_29may`（§1.2）在另一条事件里**单方面采信 U-62 且无「两说」提示**——建议在该条正文中加上「（一说 U-69）」。

### 3.3 阿布基尔号沉没位置：Westhinder 灯船（WreckSite）vs Noordhinder 灯船（RAFCommands）

- Wikipedia `SS Abukir`：「an E-boat, *S-34* … attacked her off Nieuwpoort near the **Westhinder**<ref name=WreckSite/> or the **Noordhinder**<ref name=RAFCommands/> lightvessel.」（**原文自带两说与两个不同的脚注**）
- 包内：`data/naval/dynamo.json` 的 `t.s34_abukir` 与相关 `hits` 记录（若引用位置）——我核对时未见包内对该位置的单方面主张。`data/events.json` 中相关事件提到「尼乌波特外海」而未指定灯船。**处置得当，无需改。**
- 另：Wikipedia 记 `S-34` 于 **01:15 hrs on 28 May** 攻击，包内 `t.s34_abukir` 记 `at: 1940-05-28T01:30`——**差 15 分钟**。Wikipedia 的 01:15 出自 `The Gazette`（根西岛报纸），包内的 01:30 应有其他来源（`data/naval/dynamo.json` 的 `t.s34_abukir.sources` 含 `national_archives_dynamo` 等）。**这 15 分钟无法裁决，属两说。**

### 3.4 6 月 4 日「行动终止」的时刻：10:30（舰队解散）vs 14:23（海军部正式终止电报）

- Ellis ch.16 原文（一次说清两件事）：
  > "At **ten-thirty in the morning of June the 4th the fleet of rescue ships was ordered to disperse** and Operation Dynamo was **officially ended by an Admiralty message timed 2.23 p.m.** on that day."
- 包内两处各取一个时刻：
  - `campaign.json` `time.end` 与 `marks`：`14:23`（正式终止）✅
  - `data/events.json` `e.dk_nv_operation_end`（`at: 1940-06-04T10:30`）标题「行动结束」、正文「上午十点三十分，拉姆齐海军中将在多佛**宣布「发电机行动」终止**」
- **两说均出自同一条官方记录**，且包内已有 `e.dk_french_final`（`06-04T09:00`）正确地写「**下午 2 时 23 分**，海军部电报正式终止发电机行动」。所以 `e.dk_nv_operation_end` 的 10:30 并非错，但它把「舰队奉命解散」说成了「拉姆齐宣布行动终止」。
- **建议**：不必改时刻，改措辞——「上午十点三十分，多佛指挥部下令救援船队解散；**当日下午 2 时 23 分，海军部电报正式终止「发电机行动」**」。这样与 `time.end`、`marks`、`e.dk_french_final` 三处一致。**我把它列入 §3 而非 §1，因为 10:30 是真实存在的官方节点。**

### 3.5 卡塞尔陷落时刻：5 月 29 日夜（守军突围）vs 5 月 30 日晨（mark 取值）

- 包内 `campaign.json` `marks`：`[1940-05-30T06:00, 卡塞尔陷落]`；`data/fronts/1940-05-29T12-00.json` 的 `note` 写「**卡塞尔当夜陷落**」。
- `docs/RESEARCH-NOTES.md:2067` 附近记录「5-26 下午 15:30 希特勒下令继续前进」等，未见卡塞尔的确切陷落时刻条目。包内两处自相差约 8–18 小时（29 日夜 → 30 日 06:00）。
- **两说**：突围发生在 **5 月 29 日 21:30**（包内 `e.dk_cassel_laststand` 正文写「于 5 月 29 日 21 时 30 分沿公路向敦刻尔克突围」），德军完全控制城镇的时刻可以是当夜稍后或次日清晨。**两者可以并存**（「守军当夜突围」+「德军次日晨确认占领」），但 `marks` 与 `note` 的措辞应统一。
- **建议**：`05-29T12:00` 帧的 `note` 改为「卡塞尔守军当夜突围，城镇于次日晨被德军占领」，与 `marks` 的 05-30T06:00 对齐。

### 3.6 贝尔格陷落：6 月 2 日夜（包内）vs 6 月 1 日（Ellis 的一种读法）

- 包内：`mars` = `06-02T22:00`；`data/fronts/1940-06-02T22-00.json` `note` = 「贝尔格 2 日夜陷落」；`e.dk_bergues_fall` 与 `e.dk_de_bergues_assault`（均 `06-02T22:00`）。
- Ellis ch.16 描述 6 月 1 日在贝尔格与 Hoymille 的战斗，以及英军在入夜后**退到法军中间阵地之后**、到 6 月 2 日晨已在海岸边——这**支持**「贝尔格在 6 月 1 日夜至 2 日失去」，包内的 6 月 2 日夜**略有偏晚**，但不是硬冲突（战斗持续到 2 日，法军可能仍据守部分城区）。
- **定性**：作为 §3 的候选，但**优先级低于 §2.1**（§2.1 是包内自相矛盾，与史料无关即可判定）。

### 3.7 `e.dk_nv_siroco_sunk` 的 `place: "@the_downs"` 与正文「韦斯特欣德灯船附近」不符

- **文件/对象**：`data/events.json` → `e.dk_nv_siroco_sunk`（`at: 1940-05-31T02:30`，`place: "@the_downs"`）
- **矛盾**：`@the_downs` = `[1.44, 51.24]`（唐斯锚地，英国 Deal 外海），而正文说「在**韦斯特欣德灯船**附近被德军 S-23、S-26 号鱼雷艇夹击」。**West Hinder 灯船位于比利时海岸外的浅滩**（约在 51.4°N / 2.6–2.7°E 一带），距唐斯锚地约 **90 km 以上**。
- **为何列 §3 而非 §1**：`data/oob/sea.json` 的 `fr.sirocco` 末点已正确写为 `[1.92, 51.42]`（贴近 West Hinder 的实际位置，且 `note` 写「在韦斯特欣德灯船附近被 S-23、S-26 号鱼雷击中」），说明**舰船轨迹是对的**。问题只是事件的 `place` 字段（地图定位点）取了一个远处的锚地。**我无法确定 `@the_downs` 是「有意取一个图内可点击的锚点」还是「写错了地点」**——因为 West Hinder 灯船**不在 `data/gazetteer/places.json` 的 239 条地名中**（我确认 `west_hinder` 与 `kwinte_bank` 都不存在），写手可能是**被迫**用一个图内锚点。

  → **这同时说明一个数据缺口**：`data/events.json` 在别处也提到「Kwinte 浮标」（`sig.wakeful_distress.zh`、`e.dk_nv_next_of_kin`）与「西欣德灯船」（`r.dk_sea_route_y.label` 写「西欣德灯船」），但**这两个关键航标都没有地名条目**，导致事件只能借用地名或写裸经纬度。

- **建议**：要么在 `data/gazetteer/places.json` 中补 `west_hinder`（灯船原位置，可由史料查得）与 `kwinte_bank`，然后把 `e.dk_nv_siroco_sunk.place` 改为 `"@west_hinder"`；要么保留 `@the_downs` 但在正文首句明示「事件卡片定位在唐斯锚地，实际沉没位置在韦斯特欣德灯船附近」。
- **出处**：包内 `data/gazetteer/places.json`（无 `west_hinder`）、`data/oob/sea.json` `fr.sirocco.track`、`data/events.json` `e.dk_nv_siroco_sunk`。
- **严重度**：列为 §3，因为**无法裁决「有意取锚点」还是「地点写错」**，且真正的缺口是地名库缺航标条目。

### 3.8 `e.dk_nv_la_panne_shuttle` 的「加尔各答号在拉帕讷」与 Wikipedia 的「一说是夜间」

- Wikipedia `HMS Calcutta (D82)`：「She evacuated 656 troops **on the night of 27/28 May** 1940, when she operated off La Panne, and a further 1,200 troops **on the night of 28/29 May**.」→ **两夜都是「夜间」**。
- 包内 `e.dk_nv_la_panne_shuttle` 的 `at` 是 `1940-05-28T19:00`（傍晚，勉强算「入夜前」），正文说「抛锚……把士兵一船船摆渡过来」——与「夜间撤离」相容但不完全一致。`docs/RESEARCH-NOTES.md:684` 引 `dynamo_despatch §28` 记 **12:00**（**正午**）：「HMS Calcutta 得以靠上 La Panne 海滩用小艇接人，**自各扫雷舰上接下 1,200 名部队**」——**这是白天的记录**。
- **两说**：Wikipedia（夜间，分两夜 656 + 1,200）vs `dynamo_despatch §28`（正午，1,200）。**无法裁决**，且数字（1,856）也与两者都不符（见 §1.15）。
- **建议**：`at` 保留 `19:00`（傍晚，处于两说之间），正文改用以 `dynamo_despatch` 为据的 1,200，并在 `sourceNote` 中注明两说。

---

## 4. 中文与文案问题（错别字、译名不一致、语句不通）

> **本节全部是文案层面**，不是史实错。但译名不一致会**直接影响读者辨认同一条船**，故列在最前。

### 4.1 【重要】同一艘船在包内有两个中文名（5 组）

| 规范译名（`data/oob/sea.json`） | 别处出现的错名 / 异名 | 出现位置 |
|---|---|---|
| **韦克福号**（`gb.wakeful`） | **清醒号** | `data/events.json` `e.dk_air_29may.body` + 同条 `photo.caption`；`public/campaigns/dunkirk-1940/photos/index.json` 中 `File:HMS Wakeful WWII IWM FL 12547.jpg` 的 `caption` |
| **格内德号**（`gb.grenade`） | **掷弹兵号** | `data/events.json` `e.dk_air_29may.body` |
| **巴兹利斯克号**（`gb.basilisk`） | **巴西利斯克号** | `data/events.json` `e.dk_daylight_stop.body` |
| **阿文特号**（`gb.havant`） | （无错名，但见 §1.5 的伤亡互换） | — |

**Nieuwpoort 的中文名分裂**（单独说明，因为这是本包内**规模最大**的一处不一致）：

- **地名库的规范名是「纽波特」**：`data/gazetteer/places.json` → `{id: "nieuwpoort", zh: "纽波特", pos: [2.75, 51.1333]}`。地图标注、`labelHubs`、`e.dk_de_nieuport_bridgehead` 的标题「**纽波特**：抢下一座未炸毁的桥」都用它。
- **但全包出现了 **18 处「尼乌波特」**（与规范名冲突），分布如下：

  | 文件 | 「纽波特」（规范） | 「尼乌波特」（异名） |
  |---|---|---|
  | `campaign.json` | 0 | **2**（`intro.paragraphs[1]`、`map.regions[east].label`） |
  | `data/events.json` | 4 | **3**（`e.dk_nv_bourrasque_mine` 标题 + 正文 ×2） |
  | `data/pockets.json` | 1 | 0 |
  | `data/oob/gb.json` | 4 | 0 |
  | `data/oob/de.json` | 9 | 0 |
  | `data/oob/fr.json` / `be.json` / `sea.json` | 0 | 1 / 1 / 2 |
  | `data/fronts/1940-06-01T12-00.json` | 0 | **1**（`note`：「东段退向**尼乌波特**—拉帕讷」） |
  | `data/routes/gb.json` | 2 | 2 |
  | `data/routes/be.json` | 0 | 1 |
  | `data/naval/dynamo.json` | 0 | **4** |
  | **合计** | **22** | **18** |

- **为什么这是问题**：`data/fronts/1940-06-01T12-00.json` 的 `note` 写「东段退向**尼乌波特**—拉帕讷」，而同一帧的锚点用的是 `@nieuwpoort`（引擎按 `places.json` 渲染为「**纽波特**」）。**同一条战线的说明文字与地图上的地名标注会不一致。** 「尼乌波特」是更贴近荷兰语 Nieuwpoort 的音译，「纽波特」是英文 Newport 式的旧译；两者都不是错译，但**必须二选一**。
- **建议**：以 `places.json` 为准（**纽波特**），把 18 处「尼乌波特」全部替换。若要改用「尼乌波特」（更准确），则需同时改 `places.json`、`oob/gb.json`、`oob/de.json`、`pockets.json` 共 14 处 —— **改成少数派不划算，建议统一到「纽波特」。**

- **最严重的是「清醒号」**：这不是译名异体，而是**把 Wakeful 认成了另一艘船**（「清醒」在字面上对应 "wakeful" 的语义，但与全包规范译名「韦克福」完全脱节）。同一份数据的照片题注也用了错名，所以**照片和正文会一起错**（见 §1.2）。
- **建议**：以 `data/oob/sea.json` 与 `data/gazetteer/places.json` 为唯一规范，统一替换全部 5 组。建议加一条 CI 检查（或在 `docs/CONTRACT.md` 中列为硬约束）：**「事件正文中出现的所有 `「…」号` 舰名，必须能在 `data/oob/sea.json` 的 `name.zh` 中精确匹配」**。我按这条规则扫描 82 条事件，得到 **8 个不匹配项**（见 §4.2）。

### 4.2 【重要】事件正文提到、但 `data/oob/sea.json` 中不存在的舰名（8 个）

按上述规则扫描 `data/events.json` 全部 82 条事件正文/标题/题注中的 `「…」号`：

| 事件中的名称 | 出现事件 | 是否有 OOB 条目 |
|---|---|---|
| 万基舍尔号 | `e.dk_nv_mona_queen_water` | **无**（HMS *Vanquisher*，Wikipedia 有该舰，且"Survivors from Mona's Queen … about to be rescued by Vanquisher"） |
| 火蜥蜴号 | `e.dk_nv_la_panne_shuttle` | **无**（HMS *Salamander*） |
| 爪哇号 | `e.dk_nv_la_panne_shuttle` | **无**（拖船 *Java*） |
| 猎狼犬号 | `e.dk_nv_tennant_mole` | **无**（HMS *Wolfhound*，Tennant 乘该舰抵达） |
| 白厅号 | `e.dk_nv_jolie_mascotte` | **无**（HMS *Whitehall*，Wikipedia 确认救起 Basilisk 的 8 名军官与 123 名舰员） |
| 美丽的吉祥物号 | `e.dk_nv_jolie_mascotte` | **无**（法国渔船 *Jolie Mascotte*） |
| 美洲豹号 | `e.dk_nv_darkest_day` | **无**（HMS *Jaguar*） |
| 泰坦尼克号 | `e.dk_nv_lancastria_epilogue` | **无**（作为比较对象出现，**合理**） |

- **定性**：这**不必然是错误**——事件可以引用不在精选 46 艘 OOB 内的舰船（契约 §7 明确说「不必逐条建 40 艘驱逐舰」）。但其中 **万基舍尔号（Vanquisher）、白厅号（Whitehall）、美洲豹号（Jaguar）三艘是「有明确战果的关键配角」**：
  - *Vanquisher* 救起了 Mona's Queen 的幸存者（包内 `h.mona_queen_mine.effect` 也这么写，**但 `data/oob/sea.json` 里没有这艘船**）；
  - *Whitehall* 救起了 Basilisk 的 8 名军官与 123 名舰员，并**用炮火与鱼雷击沉了 Basilisk 的残骸**；
  - *Jaguar* 是 5 月 29 日东防波堤内与 Grenade 并靠的驱逐舰（Ellis ch.14 明确点名）。
  **读者点击这些舰名时，引擎无法高亮任何单位**（`engine/ui/eventCard.ts:71` 的 `units` 数组若为空则不渲染 chip）。
- **建议**：至少把 **Vanquisher、Whitehall、Jaguar** 补入 `data/oob/sea.json`（若写手时间允许）；或在这三条事件的 `units` 中挂上已有的相关单位（如 `e.dk_nv_jolie_mascotte` 挂 `gb.basilisk`）。**若都不做，至少不要在这几条事件的正文里把这三艘船写成「关键救难者」却不提供单位链接。**

### 4.3 译名用字不统一的其他项

| 项 | 一处写法 | 另一处写法 | 位置 |
|---|---|---|---|
| West Hinder 灯船 | 「**韦斯特欣德**灯船附近」 | 「**西欣德**灯船」 | 前者：`data/events.json` `e.dk_nv_siroco_sunk.body`；后者：`data/routes/sea.json` `r.dk_sea_route_y.label`（「向东北经 Kwinte 浮标与**西欣德**灯船折向西」） |
| Kwinte 浮标 | 「Kwinte 浮标」（拉丁） | 同上 | `sig.wakeful_distress.zh`、`r.dk_sea_route_y.label`——**两处都用拉丁原名，未译**，与全包其余地名的中文化不一致（`places.json` 里其他浅滩都有中文，如 `ruytingen_bank` = 「吕坦让浅滩」） |

- **说明**：`west_hinder` / `kwinte_bank` 都不在 `data/gazetteer/places.json` 中（见 §3.7），所以写手只能自创译名——**这是 §3.7 那个地名缺口的直接后果**。
- **建议**：在 `places.json` 中补两条（`west_hinder` = 「韦斯特欣德灯船」、`kwinte_bank` = 「Kwinte 浅滩 / 昆特浅滩」），然后全包统一。

### 4.4 语句与标点

1. **`data/naval/dynamo.json` `damage[gb.grafton].note`**：「……舰体折断、舰桥二次爆炸；攻击者一作 U-62（维基），一作 U-69（Ellis 官方战史），两说无法裁决。」——**「一作……一作……」是文言残留，与全包的白话风格不符**。建议改「攻击者一说为 U-62（维基），一说为 U-69（Ellis 官方战史）」。
2. **`data/events.json` `e.dk_daylight_stop`**：「……此后只剩夜间航运，由法军殿后掩护。」——**「航运」用词不当**（此处是军事撤离，不是商业航运），且与同句的「停止撤离作业」自相矛盾（见 §1.12）。建议改「此后只在夜间继续撤离，由法军殿后掩护」。
3. **`data/events.json` `e.dk_german_claim`**（`at: 1940-06-04T20:00`）起首即写「**6 月 5 日**，希特勒宣称……」——**事件时刻是 6 月 4 日 20:00，正文第一句就是 6 月 5 日**。这是 82 条事件中**唯一一条「正文首句日期晚于事件时刻」**的（我用正则扫过全部 82 条的日期提及，18 条有跨日引用，但其余 17 条都是回溯过去或句式内明确标注，唯此条是向前引用次日且未加说明）。建议改为「次日（6 月 5 日），希特勒宣称……」或把 `at` 移到 6 月 5 日。
4. **`campaign.json` `intro.paragraphs[0]`**：「5 月 24 日希特勒下令装甲部队停止前进，**盟军赢得三昼夜喘息**。」——「三昼夜」：停止令 **5 月 24 日**下达、**5 月 26 日 15:30** 解除（`e.dk_stophalt_lift` 与 `e.dk_de_resume_attack` 都写 26 日 15:30；Wikipedia 亦记 26 日）。**24 日到 26 日 15:30 不足三昼夜**（约 2.5 昼夜）。包内 `e.dk_stophalt_lift.body` 自己也写「**三天停滞**已让盟军得以加固敦刻尔克外围」——「三天」与「三昼夜」在中文里都可指「三个整天」，但 24→26 只有两天多。**这是可以商榷的措辞**（若把 24 日、25 日、26 日各算一整「天」，则「三天」可立），但「三昼夜」偏紧。建议统一为「**约两天半的喘息**」或「赢得了两天多的时间」。
5. **`campaign.json` `intro.paragraphs[1]`**：「**尼乌波特**逐村血战」——错名，见 §4.1。
6. **`campaign.json` `intro.paragraphs[1]`**：「加来在 **26 日黄昏**陷落」——`marks` 已修正为 `16:00`（下午四点，不是黄昏）。包内 `e.dk_calais_fall.body` 写「26 日 **15 时**总攻开始，**16 时前后**城西防线崩溃」。**「黄昏」与 16:00 不符**（5 月底法国北部日落约 21:00）。建议改「26 日下午」。
7. **`data/events.json` `e.dk_nv_la_panne_shuttle`** 标题「加尔各答号在拉帕讷**接运一千八百人**」与正文「共接上**一千八百五十六人**」——标题取整为「一千八百」，正文给 1,856；**数字本身无出处**（见 §1.15），标题与正文的取整关系本身没问题。
8. **`data/events.json` `e.dk_nv_darkest_day`** 的「当天英法共损失**十九艘军舰**」——**这是数字口径与性质的双重错位**，已归入 **§1.16**（不是文案问题）。同条事件的「靠在外舷的「**美洲豹**」号锅炉舱失能、**十三人阵亡**」——Wikipedia `HMS Jaguar (F34)` 与包内数据未给 Jaguar 的 13 人阵亡（Ellis ch.14 只记 Jaguar「badly damaged」；`docs/RESEARCH-NOTES.md` 未记 13 人）。**「十三人阵亡」我未能核实**（见 §6.7）。

### 4.5 文案重复（同一事实在 3 条事件里三写）

- **5 月 31 日 68,014 人**：`e.dk_evac_peak`（05-31T12:00）、`e.dk_nv_peak_30_31`（05-30T12:00）、`e.dk_nv_gort_leaves`（05-31T23:30）、`data/naval/dynamo.json` 的某条 `signal` 都写了这个数字。
- **6 月 4 日 338,226 人**：`e.dk_french_final`、`e.dk_nv_operation_end`、`data/naval/dynamo.json` 的终止令 `signal` 三处都写（**这是全包最重要的数字，重复是合理的**）。
- **戈特离开**：`e.dk_evac_peak`（05-31T12:00）、`e.dk_nv_peak_30_31`（05-30T12:00，**提前**）、`e.dk_nv_gort_leaves`（05-31T23:30）三处。
- **建议**：`e.dk_nv_peak_30_31` 与 `e.dk_nv_gort_leaves` 功能重叠，且前者有提前引用问题（§2.5）。可考虑合并或删去 `e.dk_nv_peak_30_31` 的「三十一日戈特勋爵本人离开」半句。

### 4.6 英文对照（`title.orig`）的缺失

- 82 条事件中，**56 条有 `title.orig`（英文或德文对照）**，26 条完全没有（新合并的 24 条中有相当部分带 `[德文]` 对照，如 `e.dk_de_canal_line_held` 的 `[Dritter Tag am Haltebefehl]`）。
- **定性**：这是**风格不统一**，不是错误。但 `e.dk_air_29may`、`e.dk_nv_siroco_sunk` 等**重要事件缺英文对照**，而 `e.dk_calais_fall`（`importance: 1`）也没有。**建议**至少给全部 `importance: 1` 的事件补齐——**24 条最高级事件中有 14 条没有对照标题**。

---

## 5. 我核对了但确认无误的重要条目（简短列表）

> 以下每一条我都**实际重算/查证过**，未发现问题。列出来是为了说明覆盖面，也为了让后续修改者知道这些**不要动**。

### 5.1 日期与星期

- **全包无任何「星期X / 周X」表述**（`grep -rno "星期[一二三四五六日天]\|周[一二三四五六日天]"` 在 `campaign.json`、`data/**` 中**零命中**；仅 `docs/RESEARCH-NOTES.md` 有，那是研究笔记不是产品数据）。因此**不存在星期错**。
- **唯一一处隐含星期**：`data/events.json` `e.dk_prayer_sunday`（`at: 1940-05-26T11:00`，标题「全国祈祷日」）。史料：Wikipedia `Dunkirk evacuation` line 93「A special service attended by King George VI was held in Westminster Abbey on **26 May**, which was declared a **national day of prayer**.」**1940-05-26 确为星期日**，与「祈祷日」事件相符 ✅。
- **`marks` 11 条全部按时间升序**，且与 `phases`（`p.launch 05-26T00:00→05-28T00:00`、`p.crisis 05-28T00:00→06-01T00:00`、`p.night 06-01T00:00→06-04T14:23`）边界相容 ✅。
- **`time` 各字段自洽**：`epoch 05-22` < `start 05-26` < `end 06-04T14:23` < `dataEnd 06-04T23:59` ✅。`e.dk_stophalt` 位于 `1940-05-24T12:45`（早于 `start` 但在 `epoch` 之后）——这是**有意设计**（`epoch` 就是为赛前事件预留的），不是错 ✅。

### 5.2 每日登船数字（与 CONTRACT §10 / Wikipedia Thompson 2011 p.306 逐项一致）

| 日期 | 包内数字 | 我的核对 |
|---|---|---|
| 05-27 | 7,669 | ✅ |
| 05-28 | 17,804 | ✅ |
| 05-29 | 47,310 | ✅ |
| 05-30 | 53,823 | ✅ |
| 05-31 | 68,014 | ✅ |
| 06-01 | 64,429 | ✅ |
| 06-02 | 26,256 | ✅ |
| 06-03 | 26,746 | ✅ |
| 06-04 | 26,175 | ✅ |
| **合计** | **338,226** | ✅ 九项相加 = 338,226 |
| 海滩 / 港口 | 98,671 / 239,555 | ✅ 相加 = 338,226 |

- **中文数字解析我逐条验证**（`campaign.json` 与 `data/events.json` 的「六万八千零一十四」= 68,014、「四万七千余」= 47,310 量级 ✅）。`docs/VERIFICATION.md §1.2` 记录了该文件作者曾在 `cnNum` 上犯过 `二十万 → 210000` 的解析错并已修正——我**独立复核了修正后的解析**，`campaign.json` 简介里的「三十三万八千人」= 338,000 量级 ✅。
- **没有一条事件提前引用次日的登船数字**（我用 9 个数字 × 82 条事件交叉扫描，命中 0 条）——**这一点比 `docs/VERIFICATION.md §2.3` 记录的状态更好**（该文件当时发现 3 条，现已修复或该判定口径不同）。

### 5.3 舰船性能（抽查 12 艘）

| 舰 | 包内 `tonnage` / `lengthM` / `maxKn` | Wikipedia | 结论 |
|---|---|---|---|
| `gb.wakeful` Wakeful | 1,100 / 95.1 / 34 | 1,100 t / 300 ft (91.4 m) / 34 kn | ✅ |
| `gb.grafton` Grafton | 1,350 / 98.5 / 36 | 1,350 t / 323 ft (98.5 m) / 36 kn | ✅ |
| `gb.grenade` Grenade | 1,350 / 98.5 / 36 | 1,350 t / 323 ft / 36 kn | ✅ |
| `gb.havant` Havant | 1,350 / 98.5 / 36 | 1,350 t / 323 ft / 36 kn | ✅ |
| `gb.basilisk` Basilisk | 1,360 / 98.5 / 35 | **1,360 t** / 323 ft / 35 kn | ✅ 吨位经 Wikipedia 信息框确证 |
| `gb.ivanhoe` Ivanhoe | 1,370 / 98.5 / 35 | 1,370 t / 323 ft / 35.5 kn | ✅（35 与 35.5 的取整） |
| `gb.calcutta` Calcutta | 4,290 / 137.2 / 29 | **4,290 t** / 451 ft 6 in (137.2 m) / 29 kn | ✅ |
| `gb.mona_queen` Mona's Queen | 2,756 GRT / 105.8 / 22 | 2,756 GRT / 347 ft (105.8 m) / 22 kn | ✅ |
| `de.s30` S-30 | 100 / 34.9 / 39 | 1939 型 S 艇约 100 t / 34.9 m / 39 kn | ✅ 合理 |
| `gb.keith` Keith | 1,360 / 98.5 / 35 | **1,400 t / 323 ft / 35 kn / 编制 175** | ❌ 吨位与编制错 → **§1.10** |
| `gb.coventry` Coventry | 4,290 / 137.2 / 29 | **4,190 t / 450 ft (137.2 m) / 29 kn / 编制 327** | ❌ 吨位与编制错 → **§1.10** |
| `gb.medway_queen` Medway Queen | 316 GRT / 48.8 / 13 | 316 GRT ✅；长度与航速未取得确证 | ⚠️ 见 §6.4 |

- **其余 8 艘的吨位、长度、航速全部与 Wikipedia 一致**，包括容易写错的 o/a 长度口径（`gb.wakeful` 的 95.1 m 对应 300 ft，而非某些资料的 312 ft lwl）✅。
- **`gb.basilisk` 的 1,360 t**：我最初怀疑它抄自 Keith，实际 Wikipedia 信息框明确写 `|displacement={{convert|1360|LT|t|lk=on}} (standard)`——**包内是对的**，错的是 Keith（1,400 t）。这条我单列出来，因为它说明了「同级舰数值相同」**不必然是复制粘贴**，须逐舰查证（§1.10 的两组中，Basilisk 与 Calcutta 是对的，Keith 与 Coventry 是错的）。

### 5.4 海军战损记录（`data/naval/dynamo.json`）

- **16 条 `hits` 的 `shooter` / `target` 全部解析到 `data/oob/*.json` 中的真实单位 id** ✅（脚本校验）。
- **6 条 `torpedoes` 的 `shooter` / `target` 全部解析成功**，且 `t.s23_sirocco`（S-23 与 S-26 夹击）与 Wikipedia `French destroyer Siroco (1925)`「torpedoed and sunk by the German S-boats *S-23* and *S-26* off West Hinder light vessel on 31 May 1940」一致 ✅。
- **`t.s24_cyclone` / `h.cyclone_torp` 的射手已从 `de.s23` 修正为 `de.s24`**（`docs/VERIFICATION.md §2.4` 记录了这个修正）。我复核 Wikipedia `French destroyer Cyclone (1925)`：「the German Navy E-boat **S24** hit her with a torpedo, blowing her bow off」✅ **修正正确且已生效**。
- **沉舰终态与 `damage` 时刻的一致性**（我逐舰对账 14 艘 `status: destroyed` 的单位）：

  | 舰 | `track` 终态 | `damage.at` | 结论 |
  |---|---|---|---|
  | `gb.grafton` | 05-29T05:30 | 05-29T02:50 | ✅ **不是错**：02:50 中雷、05:30 自沉，包内 `note` 明确写「05:30 由伊万霍号炮火击沉」 |
  | `fr.bourrasque` | 05-30T06:00 | 05-30T04:30 | ⚠️ 见 §6（60–90 分钟差；包内 `note` 已声明「一说同日更早，无分钟级定论」） |
  | `gb.basilisk` | 06-01T12:00 | 06-01T12:00 | ✅（08:00 首次中弹、12:00 沉没，两条 `damage` 记录已对齐） |
  | 其余 11 艘 | 与 `damage.at` 完全一致 | — | ✅ |
- **`h.havant_bomb1`（09:05）与 `gb.havant` 终态（09:05）已对齐** ✅（`docs/VERIFICATION.md §2.4` 的修正已生效）。
- **`h.keith_bomb`（33 人阵亡，09:15）** 与 Wikipedia `HMS Keith`「Three officers and **33 ratings** were killed」一致 ✅。
- **`h.ivanhoe_bomb`（26 人，含 5 名士兵，两枚近失 + 一枚在上层甲板爆炸，前部两个锅炉舱进水，由 Speedwell 与 Havant 接走人员，靠 3 号锅炉自航回多佛）** 与 Wikipedia `HMS Ivanhoe (D16)` 逐句一致 ✅。
- **`h.bourrasque_mine`（约 500 人丧生，1,100 余名官兵与士兵）** 与 Wikipedia `French destroyer Bourrasque` 一致 ✅。
- **`sig.lancastria` 已删除**（原 `at: 1940-06-17T15:50` 超出 `dataEnd` 会触发 validate ERROR），`gb.lancastria` 单位保留、尾声由 `e.dk_nv_lancastria_epilogue` 承载 ✅ **处置正确**。
- **`e.dk_nv_lancastria_epilogue` 的 16,243 GRT / 约 3,500 人丧生** 与 Wikipedia `RMS Lancastria` 一致 ✅（并正确标注「此为窗口内的追述」）。

### 5.5 地名与坐标（抽查 25 条，24 条零误差）

逐条与 Wikipedia 信息框 / Nominatim 对照，**误差 0.0 km**：`dunkirk [2.3768,51.0344]`、`east_mole [2.3722,51.0478]`、`malo_les_bains [2.4048,51.0464]`、`bray_dunes [2.5233,51.0778]`、`la_panne [2.59,51.0967]`、`nieuwpoort [2.75,51.1333]`、`bergues [2.4333,50.9686]`、`cassel [2.4872,50.8006]`、`gravelines [2.1278,50.9864]`、`calais [1.8587,50.9513]`、`boulogne [1.6147,50.7264]`、`lille [3.0667,50.6333]`（0.8 km，取市中心）、`dover [1.3134,51.1279]`、`ramsgate [1.4185,51.3354]`、`goodwin_sands [1.5,51.25]`、`ruytingen_bank [2.2,51.1]`、`yserre [2.68,51]`、`lys_river [3.05,50.79]`、`saint_omer [2.2553,50.7483]`、`hazebrouck [2.5389,50.7239]`、`hondschoote [2.5853,50.9794]`、`wormhout [2.4667,50.8833]`、`diksmuide [2.8667,51.0333]`、`oostende [2.9167,51.2333]`。
**唯一例外**：`le_paradis`（见 §1.8）。

### 5.6 战线关键帧的其余检查

- **只有 `DE` 槽被写入，`AL` 恒为空** ✅ 符合 `docs/CONTRACT.md §2`。
- **`1940-06-04T10:00` 帧是完整画布矩形**（4 个顶点 `[-1.6,48.3] [6.6,48.3] [6.6,52.9] [-1.6,52.9]`），即**法军投降后敦刻尔克已在德军控制区内** ✅ ——**这是任务要求专门检查的一项，通过**。
- **`1940-06-01T12:00` 帧的东段确实移动到尼乌波特—阿丁凯尔一带**（锚点含 `adinkerke`、`nieuwpoort`；`adinkerke` 与 `ghyvelde` 在 06-01 → 06-02 之间转入德军）✅ ——**与比利时投降后的东段变化一致，通过**。
- **12 帧多边形全部无自交、全部有效**（`build_fronts.py` 生成时已校验，我另用 shoelace/PIP 复核）✅。
- **`@veurne`、`@diksmuide`、`@tielt`、`@adinkerke`、`@ghyvelde`、`@nieuwpoort` 的转手时刻全部单调**（无「收复」现象）✅。
- **`05-28T23:00` 帧的 `note`「英军退入敦刻尔克桥头堡（运河线）；卡塞尔仍在盟军手中」与几何一致**（`cassel` 该帧仍为盟军，直到 05-30 帧才转手）✅。

### 5.7 引用完整性（脚本全量校验）

- **所有 `@place` 引用可解析**（`data/**` + `campaign.json` 中无悬空地名引用）✅。
- **所有 `source` id 可解析**（82 条事件 + 全部数据文件的 `sources` 数组**无未知 id**；`validate` 提示「17 个来源未被引用」是**反向问题**——定义了但没用到，不是错误）✅。
- **无重复单位 id、无缺失 parent、每个单位都有 `name.short`** ✅。
- **所有 `track` 时间戳严格递增** ✅（`validate` 0 错误）。
- **状态字段全部在枚举内**（`active 653 / withdrawing 94 / evacuated 54 / engaged 503 / encircled 19 / destroyed 14 / surrendered 59 / disbanded 2 / ineffective 3 / reserve 20`）——**`encircled` 19 个与 `ui.status.cells` 的「被围法军」度量（`metric: "enc"`）相容**（18 个在 `fr.json`、1 个在 `gb.json`）✅。
- **`data/events.json` 的时间范围**：全部 82 条在 `[epoch, dataEnd]` 内（最早 `1940-05-22T09:00`，最晚 `1940-06-04T23:59`）✅。
- **所有 `e.dk_*` 导演引用可解析，除了 `e.dk_air_1jun`**（见 §6）。
- **`data/overlays.json` 36 条**：`layers = defences 12 / airbases 19 / evacuation 5`，`kind ∈ {line, range}`，`style` 全部在枚举内 ✅。
- **`ui.legend.counters` 9 项与 `data/oob/*.json` 逐一对照**：8 项命中（`DE/armor/division` 6 个、`DE/motorized/division` 5 个、`DE/infantry/division` 10 个、`GB/infantry/division` 14 个、`GB/fighter/squadron` 13 个、`FR/infantry/division` 11 个、`BE/infantry/division` 18 个、`GB/naval/ship` 34 个）；**`DE/hq/army` 命中 0 个**——但 `DE` 侧确有 `DE|infantry|army` 3 个（集团军）与 `DE|armor|army` 1 个（装甲集群）。**图例画的是「集团军指挥部」符号，实际 OOB 中的集团军是 `infantry/army` 与 `armor/army` 类型**——图例符号与数据不完全对应（属 `data/oob/de.json` 侧，按 §0.2 不深审，仅记录）⚠️。
- **`ui.legend.items` 的「三条撤离航线（X / Y / Z）」与数据相符**：`data/routes/sea.json` 确有 `r.dk_sea_route_x/y/z` 三条 + `data/overlays.json` 的 `ov.dk_route_x/y/z` 三条覆盖层 ✅ ——**任务要求专门检查的「图例说有、数据是否真有」这一项通过**。
- **`ui.legend.items` 的「包围圈（加来、布洛涅、里尔、敦刻尔克）」与 `data/pockets.json` 的 4 个口袋一一对应** ✅。
- **`ui.status.cells` 5 项的 `metric` 全部在引擎支持范围内**（`out`/`act`/`enc`）✅。
- **`map.labels.countries` 5 条中 4 条在 `hub.theatre.bbox [0.55,49.92,4.62,51.85]` 内，第 5 条「德国」在 `[6.05,51.65]`**（框外，作为方向标注合理）✅；`map.labels.waters` 7 条中 6 条在框内，「阿登讷」在 `[4.85,50.05]`（框外，作为方向标注合理）✅。
- **`map.mapKey`「德军控制区（斜线）· 敦刻尔克桥头堡（红）· 三条撤离航线（X / Y / Z）· 东防波堤为主要登船点」** 与 `control.slots`（DE + AL 空槽）、`theme`、`routes/sea.json` 一致 ✅。

### 5.8 通行证：速度校验（我修正了自己的一次误判）

- 我第一版脚本用 `u.mode` / `p.mode` 判断运输方式，得出「87 条超速」的结论——**这是我的脚本错**：引擎与校验器读的是 **`track[].movement`** 字段（`tools/validate/validate.ts:198`：`MOVE_SPEED[prev?.movement ?? '']`）。
- 按正确字段重算：**陆上速度违规 0 条 / 海上航速违规 0 条** ✅。10 条跨海峡的后勤支队（`fr.1ca_det`、`fr.16ca`、`fr.3dlm`、`fr.110ri`、`be.*_evac`）都正确写了 `"movement": "sea"`，因此「8 小时从敦刻尔克到多佛」在引擎口径下是**合法的海运段**，不是建模缺陷。**这一条从「疑似问题」转为「确认无误」。**
- 结论：**`validation.speeds`（infantry 52 / motorized 110 / armor 110 / hq 140 / cavalry 70 / artillery 55 / reserve 52）与全部 228 个单位的轨迹相容** ✅。

### 5.9 其他确认无误项

- **`data/routes/sea.json` 三条航线的折线长度与自身 label 的「本航迹折线」数字一致**：Z = 计算 43.6 海里 / 80.7 km（label「折线 44 海里 / 81 km」✅）、X = 47.5 海里 / 88.0 km（label「折线 48 海里 / 88 km」✅）、Y = 92.0 海里 / 170.3 km（label「折线 92 海里 / 170 km」✅）。**三条的「折线」数字全部准确**——错的只是「史载」数字（§1.3）。
- **`data/events.json` 82 条正文长度全部在 `[80, 175]` 区间内**（0 条违规）✅ 符合 `validation.bodyLength`。
- **`data/events.json` 无 `side` 缺失以外的异常**：`side` 分布 `GB 22 / DE 21 / undefined 33 / BE 1 / FR 5`，其中 33 条 `side` 为 `undefined`（**JSON 中不存在该键**，`zod` 的 `side: Side.optional()` 允许）——引擎 `engine/ui/eventCard.ts:76` 的 `e.side ? … : ''` 会**不渲染阵营标签**。这是**有意设计**（海军事件不属于单一交战方），不是错 ✅。
- **`data/demarcation.json` 7 条**：`d.dk_perimeter`（05-28T22:00 → 06-04T09:00）、`d.dk_canal_line`（06-01T00:00 → 06-04T09:00）、`d.dk_final_line`（06-03T00:00 → 06-04T09:00）、`d.dk_lys_line`（05-26T00:00 → 05-28T06:00）、三条航线（05-26T20:00 → 06-04T10:30）——**时间窗全部自洽、`line` 锚点全部可解析** ✅。
- **`data/pockets.json` 4 个口袋**（`p.dk_boulogne`、`p.dk_calais`、`p.dk_lille`、`p.dk_dunkirk`）的 `anchor` 与 `start`/`end` 全部可解析且在窗口内 ✅。
- **`docs/CONTRACT.md §4` 的关键帧锚点表与实际文件的一致性问题**：契约表有**两行都标 `1940-05-26T00:00`**（一行是加来围城版、一行是「开战帧」版），且多帧的锚点与文件不同（如 `05-28T23:00` 契约写 `@bourbourg @spycker @bergues @veurne @diksmuide @tielt`，文件实际为 `['bourbourg','spycker'] + CASSEL_POCKET + ['vlamertinge','ieper','tielt','deinze','gent','terneuzen']`）。**契约自称「上表与 `data/fronts/` 实际文件一一对应」，实际并不对应。** 这属**文档滞后**（契约是冻结文档，文件后来被 `build_fronts.py` 重写过），建议在契约 §4 加一行说明「实际锚点以 `pipeline/build/build_fronts.py` 的 `FRAMES` 为准」。**这条我列在 §5 而非 §1/§2，因为它是「文档与实现的差异」，而用户看到的是文件（文件本身自洽）。**

---

## 6. 未能核实的点

> 以下条目我**穷尽了本机可用的检索手段**（Wikipedia 多语言 `?action=raw`、Ellis 官方战史 ch.11–16/23、`zdump`、Nominatim/OSM、naval-history.net）仍无法确认，或**来源本身互相冲突且我无第三方可裁决**。列出以待有更多史料时复核。

### 6.1 West Hinder 灯船的精确坐标（无法取得）

- **影响**：验证 `data/oob/sea.json` 的 `fr.sirocco` 末点 `[1.92,51.42]` 与 `de.s24` 末点 `[1.55,51.15]` 是否落在合理位置。
- **已尝试且失败**：英文 Wikipedia `West_Hinder`、`West_Hinder_(lightship)`、荷兰文 Wikipedia `Westhinder` 全部返回 **1929 字节的错误页**（与之前 `HMS_Keith`、`HMS_Sundowner` 等遇到的是同一类 Wikimedia 拒绝页）；Wikidata 按猜测的 Q 号查询返回了一个无关条目（*Mordellaria africana*，说明 Q 号猜错）。
- **可用的间接证据**：Wikipedia `French destroyer Siroco (1925)` 只说 "off West Hinder light vessel"，无坐标；`SS Abukir` 条目说 "off Nieuwpoort near the Westhinder or the Noordhinder lightvessel"——**「off Nieuwpoort」暗示灯船在尼乌波特（2.75/51.13）以北的海上**。包内 `fr.sirocco` 末点 `[1.92,51.42]` 距尼乌波特约 90 km 西北，**偏西**；`de.s24` 末点 `[1.55,51.15]` 距尼乌波特约 84 km 西，**更像是「英吉利海峡中部」而非「比利时海岸外的浅滩」**。
- **我的判断（未定论）**：两舰的末点可能**偏西了 50–80 km**。但**我无法确认 West Hinder 的坐标**，所以**不作判定**，也不写进 §1。建议有网络条件时查 `https://en.wikipedia.org/wiki/West_Hinder_(lightship)`（若该条目存在）或荷兰/比利时水道测量资料，然后复核 `data/oob/sea.json` 中 `fr.sirocco.track[6].pos` 与 `de.s24.track[1].pos`。

### 6.2 `e.dk_air_1jun` —— `campaign.json` 引用了一个不存在的事件 id

- **文件/对象**：`campaign.json` 第 595 行（`director.sirens[0].events` 数组）
- **原文**：`{"events": ["e.dk_air_27may", "e.dk_air_29may", "**e.dk_air_1jun**"], "sfx": "air_siren", "volume": 0.5}`
- **事实**：`e.dk_air_1jun` 在 `data/events.json`（82 条）中**不存在**；在 `pipeline/events/naval.json`（29 条）与 `pipeline/events/lead.json`（29 条）中也**都不存在**；全包 grep 只命中 `campaign.json` 这一处。
- **为何无法裁决**：`director.sirens` 的匹配逻辑我读了 `engine/app/director.ts:184`（`for (const r of m.director.sirens ?? []) if (sirenMatches(r, e))`）——**这是一次「事件 → 规则」的匹配**，即按规则去匹配**已经存在的事件**，**而不是按 id 去查找事件**。所以一个不存在的 id 在数组里**不会导致运行时报错**，只是**永远不会命中**。因此：
  - **不是崩溃性 bug**；
  - 但**意图上的空转**：写手显然想给 6 月 1 日的空袭配警报音（6 月 1 日是最后一次大规模昼间撤离，空袭最猛），但**该事件不存在**，于是 6 月 1 日的空袭没有警报音——而 5 月 27 日与 29 日有。
- **两种读法**：（a）写手忘记写 `e.dk_air_1jun` 这条事件；（b）写手删掉了该事件但没清理 `campaign.json` 的引用。**我无法判断哪种**，但**两种都需要处理**。
- **建议**：若 6 月 1 日应有空袭事件，补写该事件（并让它被 siren 规则命中）；若不补，从 `director.sirens[0].events` 中删去 `"e.dk_air_1jun"`。**我倾向补写**——因为 6 月 1 日是「白昼撤离被迫停止」的日子（`e.dk_nv_daylight_halted`），却没有任何一条以空袭为主体的事件。

### 6.3 `gb.calcutta` / `gb.basilisk` / `gb.coventry` / `gb.keith` 的**武器配置**（`weapons` 数组）

- 我已确证 `gb.coventry.ship` 与 `gb.calcutta.ship` **除 `pennant` 外逐字段相同**（见 §1.10），`gb.keith.ship` 与 `gb.basilisk.ship` **除 `class.zh` 外逐字段相同**。其中 **`weapons` 数组（各 3 项 / 6 项，含 `mounts`、`perMount`、`rangeKm`、`atPct`）也完全相同。**
- **但这两组舰的武器配置在历史上并不相同**：
  - Wikipedia `HMS Calcutta (D82)` 记其防空改装后的武备为 **4 英寸 QF Mk V 高射炮**（`data/oob/sea.json` 写的是 `4 in QF Mk V`，与之一致 ✅）；
  - Wikipedia `HMS Coventry (D43)` 信息框记「(as built): 5 × BL 6 inch Mk XII … 2 × 3 inch …」——**这是建成时**的配置；她 1936 年做了与 Calcutta **不同的**防空改装。我没有取到 Coventry 改装后的确切的 4 英寸炮座数。
  - B 级两舰：Wikipedia 记 B 级设计武备为 **4 × 单装 4 英寸炮 + 2 磅砰砰炮 + 8 具 21 英寸鱼雷管（四联装 ×2）**，与包内的 6 项（A/B/X/Y + tt + aa）在**炮位数上相符** ✅，但 `gb.keith` 作为领舰是否与 Basilisk 完全一致，我未取得确证。
- **未能核实**：两组 `weapons` 数组是否各自正确。**建议**写手对 `gb.coventry` 与 `gb.keith` 的武备逐项复核（至少改掉与 Calcutta / Basilisk 完全相同的 `atPct` 值——那是**射界百分比**，逐舰不同才是正常的）。

### 6.4 `gb.medway_queen` 的长度与航速

- 包内：`lengthM: 48.8`、`maxKn: 13`、`tonnage: 316`（grt）。
- Wikipedia `PS Medway Queen`：`|tonnage = {{GRT|316}}` ✅（吨位确认，且信息框有注释「previous version was 134 tonnes」，说明这一项被修正过）。
- **未能核实**：48.8 m 与 13 节。48.8 m = 160 ft，而 Medway Queen 的长度在 ADLS（Association of Dunkirk Little Ships）等资料中常记为 **179 ft 9 in（54.8 m）**——**若如此，包内 48.8 m 偏短 6 m**。我在 Wikipedia 该条目（25,856 字节）中抓 `length` / `speed` 字段未命中，故**没有确证**，不入 §1。

### 6.5 `de.s30` 的吨位与长度

- 包内：`tonnage: 100`（std）、`lengthM: 34.9`、`maxKn: 39`。
- 1939 型 S 艇的公开数据通常为 **92–100 t / 34.9 m / 39.5 kn**，与包内相符。但我**未找到逐艇（S-30）的 Wikipedia 条目或权威数据表**来逐字确认，故列为未核实。

### 6.6 `fr.bourrasque` 的沉没时刻（04:30 vs 06:00）

- **包内矛盾**：`data/naval/dynamo.json` `damage[fr.bourrasque].at = 05-30T04:30`（`note` 明说「时刻一说 5 月 30 日 04:30 触雷，一说同日更早，无分钟级定论，此处取 04:30」）；而 `data/oob/sea.json` `fr.bourrasque.track` 有**两个**相关点：`04:30 status: "engaged"`（「在尼乌波特外海触雷，又被岸炮击中」）与 `06:00 status: "destroyed"`（「舰体断裂沉没，约 500 人丧生」）。
- **我的判断**：`04:30` = 触雷，`06:00` = 沉没，**两者可以并存**（触雷后舰体断裂但需要时间沉没，Wikipedia 记 Bourrasque 在触雷后又遭岸炮射击）。**包内的 `note` 措辞（「04:30 触雷」）与此相容，故这不是错误。** 但 `docs/VERIFICATION.md §2.4` 曾把同类问题（basilisk）作为缺陷修正，**这艘舰的 90 分钟差未被同样处理**——[建议] 若统一口径，把 `fr.bourrasque` 的 `damage.at` 与 `track` 终态的对齐方式写成与 `gb.basilisk` 相同的注释。
- **为何列 §6**：我**未能找到 Bourrasque 沉没时刻的权威值**（Wikipedia 该条目 11,400 字节，我抓 `mine|sank|hours|casualt` 未命中沉没时刻）。包内「无分钟级定论」的自述是诚实的。

### 6.7 `e.dk_nv_darkest_day` 的「美洲豹号……十三人阵亡」

- 包内 `e.dk_nv_darkest_day`（05-29T16:02）称 Jaguar 号「锅炉舱失能、**十三人阵亡**」。
- Wikipedia `HMS Jaguar (F34)`：5 月 29 日「near missed by four bombs, which severed a steam pipe, which disabled her engines and knocking out her steering. She was towed clear of a wreck by the destroyer HMS *Express*… Later that day, *Jaguar* managed to restore power and returned to Dover under her own steam.」——**未提任何阵亡**。Ellis ch.14 只记 Jaguar「badly damaged」。`docs/RESEARCH-NOTES.md` 无 13 人记录。
- **未能核实**：「十三人阵亡」可能出自 `dildy_2010`（该事件的 `sources` 含 `dildy_2010`），但**我无法访问该书**。**建议**写手复核该数字的出处；若无出处，删去。

### 6.8 `e.dk_nv_la_panne_shuttle` 的 1,856 与「火蜥蜴号 / 萨顿号 / 爪哇号」

- 1,856 人无出处（见 §1.15）。
- 「扫雷舰「火蜥蜴」号、「萨顿」号与拖船「爪哇」号」：Wikipedia `HMS Calcutta (D82)` 只说 Calcutta 自行用小艇接人，**未提这三艘辅助船**。`dynamo_despatch §28` 记「自各扫雷舰上接下 1,200 名部队」——**「各扫雷舰」是模糊复数，未点名**。**这三艘船的参与我未能核实。**

### 6.9 `docs/VERIFICATION.md` 的独立复核

- 我通读了该文件（359 行），它是一份**高质量的验证报告**（含 8 处作者自我纠错记录，方法论诚实）。它记录的 57 passed / 0 failed、validate 0 错误 53 警告与我的实测一致 ✅。
- **但该文件本身不在我的审查范围之外的部分**：§2.3（事件正文提前引用次日数字，3 条，待人工裁决）在我审查的 82 条版本中**只找到 1 条**（`e.dk_nv_peak_30_31`，见 §2.5），其余 2 条已被修复或口径不同。**我无法确认是「已修」还是「判定口径变了」**，故记录在此。
- 另：该文件 §2.1 指出 `data/oob/gb.json` 13 个 RAF 中队的中文名模板重复（`第 第 1 中队 中队`），**我复核当前文件——该问题已不存在** ✅（已修复）。

### 6.10 我**未能完成的核对**（诚实记录）

| 项 | 原因 |
|---|---|
| `data/routes/{gb,fr,be,garrisons}.json` 的**逐条路线内容** | 只做了结构性校验（id 唯一、`unit` 存在、`waypoints` 时间递增、`side` 与单位一致）。**75 条路线的地缘合理性（路线是否走了合理的地形、是否与 `data/fronts/` 的控制区冲突）未逐条核对。** |
| `data/oob/de.json` 与 `data/routes/de.json` 的**自身数据** | 按指令排除（§0.2）。 |
| `data/equipment.json` 29 张装备卡的**技术参数** | 未抽查（如 `hurricane_mk1`、`spitfire_mk1` 的性能值）。 |
| `data/sources/main.json` 97 条来源的**书目准确性** | 未逐条核对（如 `frieser_2005`、`sebag_2006` 的页码与版本）。 |
| `data/overlays.json` 36 条覆盖层的**几何正确性** | 只核对了 `ov.dk_route_x/y/z` 三条与航线数据的对应；其余 33 条（防线、机场、雷达）未逐条核算。 |
| `campaign.json` 的 `audio`（音乐/强度曲线）、`sandbox`、`theme`、`credits` | 未审（非史实内容）。 |
| 照片（`public/campaigns/dunkirk-1940/photos/`）的**逐张内容准确性** | 未逐张查看；只核对了 `photos/index.json` 与事件 `photo.commons` 键的对应关系，并发现 Wakeful 题注的船名错（§1.2）。 |

---

## 附录 A：本次审查产出的可复核命令

```bash
# 校验器（底线）
cd /Users/yiti/Project/militaryChess && npx tsx tools/validate/validate.ts --only dunkirk-1940
# → ✓ dunkirk-1940  地名 239 · 部队 228 · 路线 105 · 关键帧 12 · 事件 82 · 装备 29 · 来源 97 · 海战条目 44  — 0 错误，53 警告

# 时区（§1.12）
zdump -v Europe/London | grep 1940
zdump -v Europe/Paris  | grep 1940
zdump -v Europe/Brussels | grep 1940

# 地名（§1.8）
curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=Le_Paradis_massacre&action=raw" | grep -i "Coord\|Lestrem"
curl -s -A "junqi-wargame/0.1 (educational)" "https://nominatim.openstreetmap.org/search?q=Le+Paradis,+Lestrem,+France&format=json&limit=3"

# 航线海里数（§1.3）
curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=Dunkirk_evacuation&action=raw" | grep -o "Route [XYZ][^.]\{0,160\}"

# 舰船（§1.1、§1.9、§5.3）
curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=HMS_Wakeful_(H88)&action=raw" | grep -i "640\|surviv"
curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=German_submarine_U-62_(1939)&action=raw" | grep -i "Type IIC\|291\|43.90\|12 kn"
curl -s -A "junqi-wargame/0.1 (educational)" "https://en.wikipedia.org/w/index.php?title=HMS_Coventry_(D43)&action=raw" | grep -i "displacement\|4,19"
```

## 附录 B：审查统计

| 项 | 数量 |
|---|---|
| 读过的事件 | **82 / 82（100%）** —— 逐条读正文，非抽样 |
| 读过的战线关键帧 | **12 / 12**（逐帧重算多边形几何、逐地名判定归属） |
| 核实的舰船数据 | 12 艘规格 + 16 条 `hits` + 6 条 `torpedoes` + 15 条 `damage` + 13 条 `signals` |
| 核实的地名 | 25 条（**24 条零误差，1 条错 5.3 km**） |
| 核实的每日登船数字 | **9 / 9 全部一致**（且合计 338,226 自洽） |
| **§1 事实错误** | **16 条**（高 **8** / 中 **6** / 低 **2**） |
| **§2 内部矛盾** | **8 条**（高 **1** / 中 **5** / 低 **2**） |
| **§3 无法裁决** | **8 条** |
| **§4 中文与文案** | **6 组**（译名 5 组 + 语句 8 处 + 重复 4 组 + 对照缺失 1 项） |
| **§5 确认无误** | **9 组**（含 24 条地名、9 艘舰规格、9 个登船数字、全部引用完整性、速度校验通行） |
| **§6 未能核实** | **10 组** |

### 高严重度条目一览（8 条，供快速处理）

| # | 一句话 |
|---|---|
| 1.1 | 韦克福号 `killed: 733` **算术不成立**（640 名士兵 + 98 名舰员 = 738 > 全船编制），且三处文件给 733/737/635 三个数 |
| 1.2 | `e.dk_air_29may` 把韦克福号写成「**清醒号**」、把 00:40 的攻击写成「夜里 11 时」、把当日自沉写成「次日自沉」 |
| 1.3 | 航线 X 的「史载 51 海里」应为 **55**、Y 的「94 海里」应为 **87**（94 是 175 km 的错误反算） |
| 1.4 | `e.dk_nv_siroco_sunk` 说西克洛纳号「被**炸**掉舰艏」，实为被 **S-24 的鱼雷**打掉 |
| 1.5 | `e.dk_nv_daylight_halted` 把**伊万霍号**的 26 人伤亡挂到**阿文特号**名下（两舰伤亡互换） |
| 1.6 | `e.dk_daylight_stop` 点名「**伊卡洛斯号**与温莎号重创」——伊卡洛斯**不在序列中**；温莎的战损在 **5 月 28 日**而非 6 月 1 日 |
| 1.7 | 简介两处「德军**十九个师**」与 `data/forces.json` 的 38 / 16 / 24 / 30 全部冲突，且「19」在包内零出处 |
| 1.8 | `le_paradis` 坐标偏北 **5.3 km**，落在 Lestrem 以外的 commune，连带 5 处引用（含一条防线折线）偏移 |
| 2.1 | 战线 **05-31 帧把贝尔格划入德军**，06-01 帧又退回盟军——与两帧的 `note`、`marks` 及 `build_fronts.py` 自己的注释**全部矛盾** |
