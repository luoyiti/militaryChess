# 莫斯科保卫战 · V1 独立史实与数据审查（round 1）

- 审查对象：`campaigns/moscow-1941`（38 帧控制区 / 255 部队 / 56 路线 / 115 事件 / 19 装备 / 46 来源）
- 审查人：审查-史实一致（只读审查，未改动任何被审文件）
- 审查时刻：2026-10-22 20:0x（数据快照见 §8 哈希）
- **结论：`needs_revision`** —— 无编造来源，但存在 **1 处明确的数据自相矛盾（436,900 的月份）**、**1 帧控制区把从未被占的城镇划入德控**、**3 处登记来源标题的史实错误**、**2 处地名坐标错到 20 km 以上**。前两类属「确凿错误」，必须改；其余给出可直接执行的修法。

---

## 1. 机械校验（必跑项，原样输出）

```
$ npx tsx campaigns/moscow-1941/pipeline/audit-control.ts
控制区审计：69/69 通过
（退出码 0）

$ npx tsx tools/validate/validate.ts --campaign moscow-1941
✓ moscow-1941  地名 122 · 部队 255 · 路线 56 · 关键帧 38 · 事件 115 · 装备 19 · 来源 46  — 0 错误，0 警告

$ python3 campaigns/moscow-1941/pipeline/make_fronts.py --check
...
✓ 自检全部通过
（城市断言 69 条全绿、洞 3/3、几何 0 问题）
```

三条命令均通过。**但请注意：这三条都不能发现本节 §4 的 F1—F5。** 69 条断言只问「城市归谁」，`make_fronts` 的几何自检只问「环是否自相交 / 洞是否被包住」，都不检查「多边形里是否混入了从未被占领的地方」；validator 只查 schema 与引用完整性，不查数字的史实含义。

---

## 2. 事件抽查（12 条，逐条标注）

| # | 事件 | 正文日期 / 地点 | 结论 | 依据 |
|---|---|---|---|---|
| 1 | `e.typhoon_begins` | 9/30 古德里安第 2 装甲集群自绍斯特卡—格卢霍夫东进，指奥廖尔 | **核实通过** | CMH ch.3：第 2 装甲集群 9/30 提前两天发动；奥廖尔 10/3 失守 |
| 2 | `e.vyazma_ring_closed` | 10/7 第 7、第 10 装甲师在维亚济马以东会师闭合 | **核实通过** | CMH ch.3；俄文维基「Вязьма」10/7 合围 |
| 3 | `e.mozhaisk_maloyaroslavets_fall` | 10/18 莫扎伊斯克与小雅罗斯拉韦茨同日失守 | **核实通过** | 两城 10/18 失守为通行口径 |
| 4 | `e.red_square_parade` | 11/7 红场阅兵，受阅部队直接开赴前线 | **核实通过** | `su_parade_1941`；受阅即开赴前线为公认事实 |
| 5 | `e.klin_falls` | 11/23 第 3 装甲集群占克林 | **核实通过** | CMH ch.3 原文「when Third Panzer Group took Klin on the 23d」 |
| 6 | `e.yakhroma_canal` | 11/27 第 7 装甲师抵运河；11/28 于亚赫罗马取东岸桥头堡 | **核实通过** | CMH ch.3 逐字对应 |
| 7 | `e.krasnaya_polyana` | 11 月底德军前出克拉斯纳亚波利亚纳，距莫斯科约 27 km | **日期通过 / 距离口径需注意** | CMH：第 2 装甲师在克拉斯纳亚波利亚纳以西停顿、距莫斯科 12 英里（≈19 km）；「27 km」是俄方通行说法（对市界）。**真正的错在该村的坐标，见 F4** |
| 8 | `e.tula_first_assault` | 10/29 前卫抵图拉，10/30 起强攻，城未陷 | **核实通过** | `strat_wiki_ru`/`en` 一致 |
| 9 | `e.november_offensive_opens` | 11/15 第 9 集团军一部在加里宁以南先动，第 30 集团军未作有力抵抗 | **核实通过** | CMH ch.3 逐字对应（Halder「something new in this war」） |
| 10 | `e.kaluga_liberated` | 12/30 收复卡卢加 | **核实通过** | 官方解放手册与俄文维基均记 12/30 |
| 11 | `e.toropets_offensive` | 1/21 收复托罗佩茨（第 4 突击集团军与游击队） | **核实通过** | 俄文维基「Торопец」1/21 |
| 12 | `e.vyazma_airborne_drop` | 1/18—22 夜第 201 空降旅与第 250 空降团在维亚济马以南空降 | **核实通过** | CMH ch.5；`su.4vdk` history 一致 |

**12/12 无日期或地点错误。** 未发现把两处同名地点搞混的残留（霍尔姆 / 霍尔姆-日尔科夫斯基已分别处理）。

---

## 3. 六条争议写法（逐条确认存在且口径正确）

| 争议 | 位置 | 口径 | 判定 |
|---|---|---|---|
| 28 名潘菲洛夫战士 | `credits.extraHtml`〈「28 名潘菲洛夫战士」〉+ 事件 `e.dubosekovo_fight` | 明写「2016 年俄罗斯总检察院认定该报道系虚构」，同时保留「杜博谢科沃一带 1941-11-16 战斗真实存在」，未采用 28 人叙事 | **通过** |
| 波多利斯克军校生 | `credits.extraHtml`〈波多利斯克军校生〉+ `e.podolsk_cadets` | 「约 3,500 名学员与教员」；明写「不写夸大的单一因果」。**注意**：事件正文有「他们迟滞德军前卫数日」，但同句即写「具体战果与人数仍有争议」，属并置而非单一归因 | **通过** |
| 冬将军 | `credits.extraHtml`〈「冬将军」〉+ `e.winter_general_myth` | 逐项列出泥泞、道路冻结、−20℃ 以下、冬装不足、换轨瓶颈、苏军预备队与远东师团，并写「苏军同样受冻」「把失败归为冬将军会掩盖后勤、兵力与指挥因素」 | **通过** |
| 佐尔格情报 | `credits.extraHtml`〈佐尔格情报〉+ `e.siberia_divisions` | 「影响存在争议」「档案链条并不完整」「不宜写成唯一原因」 | **通过** |
| 十月十六日恐慌 | `credits.extraHtml`〈十月十六日恐慌〉+ `e.october_sixteenth_panic` | 分列「事实」（机关与外交团迁古比雪夫、居民外逃、10/19 戒严）与「传说」（斯大林留下的细节、枪决逃兵的数字），明写后者「缺乏同期档案支撑」 | **通过** |
| 博克 10-19 俘虏数 | `credits.extraHtml` 首段 + `e.bock_prisoner_claim` + `forces.json` DE.losses.captured | 673,098 / 1,277 / 4,378 三数均标注「**德方战时宣称口径**」「未经独立核实」「不作为确证数字」 | **通过** |

六条**全部存在且口径正确**，无一条写成单一因果或无保留断言。图注同样合规：`photos/index.json` 里 20 条 caption 均带「不用于…」「可能带有宣传色彩」「不指认」等限定语。

---

## 4. Findings（按 severity 排序）

### F1 · high · `436,900` 在 `campaign.json` 里被写成「四个月合计」，等于本战役区间

- **文件**：`campaigns/moscow-1941/campaign.json`，`credits.extraHtml` 的〈伤亡口径〉段（第 681 行那一整个字符串的开头）
- **事实**：现文为「德方按陆军十日报告分月给出：10 月至 12 月初约 145,000 人，12 月约 103,600 人，1 月约 144,900 人，**四个月合计约 436,900 人**，其中无法补充的减员约 256,500 人」。
  - 这三个分段相加是 393,500，不是 436,900；
  - 436,900 = 103,600 + 144,900 + **108,700（2 月）** + **79,700（3 月）**，即 **1941-12 — 1942-03**（`docs/research/moscow-1941-part1-strategy-oob.md` §5 已用算术自校验过，`pipeline/research.json` 的 `correctionsToAssignment` 第 5 条亦记录）。
  - 因此「紧随 10/11/12/1 月序列之后 + 四个月合计」在中文里只能读成「10、11、12、1 月合计」，**与 `data/forces.json` 的 note 直接矛盾**——后者明写「常被引用的『四个月合计约 436,900』对应的是 1941 年 12 月至 1942 年 3 月的冬季战局延伸统计，**不是本战役区间的数字**，不可用作战役伤亡」。同一份交付里两个文件对同一个数字给出相反的时间归属。
- **这正是验收项点名要核对的那一条，判定为不通过。**
- **修法（可直接执行）**：把该句中
  「1 月约 144,900 人，四个月合计约 436,900 人，其中无法补充的减员约 256,500 人。」
  改为
  「1 月约 144,900 人（以上三段为本战役区间）。另有常被引用的 436,900 人，那是 1941 年 12 月至 1942 年 3 月的冬季战局延伸统计（103,600+144,900+108,700+79,700），**不是本战役数字**；同一序列内无法补充的减员为 256,500 人。三组口径互不相加。」
- 附带：`ui.brief.fine` 未出现 436,900，无需改。

### F2 · high · `1941-12-02` 帧把谢尔吉耶夫镇（扎戈尔斯克）划入德军控制区

- **文件**：`campaigns/moscow-1941/data/fronts/1941-12-02T00-00.json`（`control.DE[0][0]` 的第 91—93 号顶点）
- **事实**：该帧外环在 56.28—56.31°N 一条窄带上向东凸到 **38.37°E**：
  - `[38.0377, 56.306] [38.1569, 56.3] [38.3731, 56.283]`，随后折回 `[38.2543, 56.2793] … [37.5416, 56.257]`。
  - 点判结果：`sergiyev_posad (38.13, 56.30)` 在 **12-02 帧判為 DE**，而同日前后的 11-28、11-29、11-30、12-05、12-08 帧均判 SU。
  - 谢尔吉耶夫镇距莫斯科约 70 km，1941 年 11—12 月**从未被德军占领**（德军在该纬度最东只到运河东岸的亚赫罗马 37.48—37.67）。
  - 该帧自己的 `note` 也没有任何「越运河向东深远突击」的表述，只有「12/2 德军侦察营突入希姆基」。
- **成因**（已定位，便于修）：`yakhroma` 的 `CITY_WINDOWS` 在该帧把 56.300 / 56.283 两行分别推到 38.157 / 38.373（`apply_city_windows` 中 `want='DE'` 时 `target = lon + reach`，`reach ≈ 0.73°`），而研究折线在 56.33（37.0）与 56.28（37.56）之间本来就有 0.56° 的陡梯度，推东之后形成一条单一帧、单点宽的长刺；`REVERSAL_MAX_DEG=0.30` 逆序削平只在「与基准走向相反」时生效，这条刺与基准同向，故未被削掉。
- **修法（二选一，都可直接执行）**：
  1. 最小改动：在 `pipeline/make_fronts.py` 的 `NOTCH_TUNE` 里给 `yakhroma` 加显式上限，例如
     `'yakhroma': dict(margin_km=4.0, half=0.045, row_weights={56.300: 0.45, 56.283: 1.0, 56.257: 0.35})`，
     使推东后的东界不超过 37.70（≈ 运河东岸 9 km），与 11-28 帧自述的「东岸小桥头」一致；或在 `apply_city_windows` 中对 `want='DE'` 的行加 `v = min(v, NOTCH_MAX_EAST.get(pid, 1e9))` 的硬上限。
  2. 结构性改动：给 `CITY_WINDOWS` 增加第 5 个字段 `max_east`（该城推东后允许的最大经度），`yakhroma` 填 37.72。
  改完后重跑 `make_fronts.py`，并在 `run_checks` 里补一条断言：`sergiyev_posad` 在所有帧均为 SU。
- **影响面**：仅 1 帧、1 条几何窄刺，不影响 `audit-control` 的 69 条（其中没有该城在 12-02 的断言，也没有任何断言落在 56.25—56.32°N × 37.9—38.4°E 这个矩形里）。

### F3 · high · 两个登记来源的标题写错史实（会随事件卡「来源」行一起展示给读者）

| 文件 | 位置 | 现文 | 错在哪 | 改为 |
|---|---|---|---|---|
| `data/sources/german.json` + `pipeline/source-registry.json` | `ger_pzgr3`（german.json:21 / registry.json:75） | 「第 3 装甲集群（**10 月 5 日**至 1942 年 1 月为第 3 装甲集团军）」 | 第 3 装甲集群改称装甲集团军是 **1942-01-01**（德文维基 `3. Panzerarmee`：「Am 1. Januar 1942 wurde die Panzergruppe in 3. Panzerarmee umbenannt」）；10-05 改称的是**第 2** 装甲集群。同一份 `docs/MILITARY-RESEARCH.md` §4 已明确写「不是 1941-10-05」，来源标题却仍在传播这个错误 | 「第 3 装甲集群（1942-01-01 起为第 3 装甲集团军）作战序列」 |
| 同上 | `ger_pzgr4`（german.json:27 / registry.json:81） | 「第 4 装甲集群（**霍特**）作战序列」 | 第 4 装甲集群司令是**霍普纳**（Hoepner）；**霍特**指挥的是第 3 装甲集群。`data/oob/de_center.json` 里 `de.pzgr4.commander` 写的正是「赫普纳」，同一交付自相矛盾 | 「第 4 装甲集群（霍普纳）作战序列」 |
| 同上 | `ger_guderian_panzerleader`（german.json:65 / registry.json:46） | 「…关于 10—12 月图拉方向与 **12 月 20 日去职**的记述」 | 古德里安 **12-25** 去职（12-16 获准、25 日正式卸任），`data/oob/de_center.json` 与 `e.guderian_relieved` 均写 12-25 | 「…与 12 月 25 日去职的记述」 |

> 说明：这三条不是悬空 id，也不是编造 URL——id 都存在、`url` 都指向真实站点（其中 lexikon 的 Panzergruppen 三个页面已 404，见 F6），但**标题里的史实陈述是错的**，且会直接渲染在事件卡底部「来源：…」一行（`engine/ui/eventCard.ts` 第 58、84 行），属于读者可见的事实错误。

### F4 · medium · `krasnaya_polyana` 坐标错 21.8 km，导致「德军最前哨距莫斯科多远」的三种数字互不相同

- **文件**：`data/gazetteer/core.json` 第 35—40 行（`pos: [37.333, 55.833]`）、`pipeline/place-inventory.json` 第 27 行
- **事实**：克拉斯纳亚波利亚纳（今洛布尼亚市区）实际坐标 **56.0229°N / 37.4280°E**（俄文维基条目信息框 `{{coord|56.022948|N|37.428017|E}}`）。现有值偏南偏西 **21.8 km**。于是同一件事在包里出现了三个距离：
  - 由地名坐标算：距克里姆林宫 **19.9 km**；
  - 事件正文与帧 note：**27 km / 28—29 km**；
  - 真实坐标算：**32.2 km**（对市界约 20 km，「27 km」是对莫斯科市界的通行说法）。
- **修法**：`core.json` 与 `place-inventory.json` 同步改为 `[37.428, 56.023]`，然后重跑 `make_fronts.py` 与 `audit-control.ts`。
  **注意连带影响**（这也是为什么建议排到下一轮而不是现在改）：该城参与 `CITY_WINDOWS` 与 `NOTCH_TUNE` 的凹口计算，纬度行会从 55.833 移到 56.023，11-29 起的德控北缘几何会整体北移；改后必须重跑三条命令并复核 §1 全绿，且 `e.krasnaya_polyana` 正文的「约二十七公里」宜改为「约二十七至三十二公里（对市界/对市中心）」以消除第三种口径。

### F5 · medium · `kholm_zhirkovsky` 坐标错 66 km（且它是维亚济马包围圈的洞锚点）

- **文件**：`data/gazetteer/north.json` 第 83—88 行（`pos: [34.28, 55.9]`）、`pipeline/place-inventory.json` 第 459 行
- **事实**：霍尔姆-日尔科夫斯基实际坐标 **55.517°N / 33.467°E**（俄/英文维基一致）。现有值偏东偏北 **66.3 km**，落在瑟乔夫卡与霍尔姆之间，而不是该镇本身。
- **连带**：该 id 同时是 `make_fronts.py` 中 `POCKETS`（维亚济马合围圈）的 `anchor`。按真实坐标，该点会落在洞环之外（洞的西界是 33.60°E），`run_checks` 的「锚点在洞内」会失败——也就是说**这个坐标错误目前正好被洞的形状掩盖着**。
- **修法**：`north.json` / `place-inventory.json` 改为 `[33.467, 55.517]`；同时把 `p.vyazma` 的 `anchor` 换成一个确实在圈内、且有史实意义的点（建议 `sychevka` 34.283/55.833，或新增 `vop` 之类圈内村镇 id 并在 `place-inventory.json` 登记），再重跑 `make_fronts.py`。

### F6 · low · 三条来源 URL 返回 404（不是编造，是失效）

- `data/sources/german.json` 的 `ger_pzgr2` / `ger_pzgr3` / `ger_pzgr4` 指向
  `https://www.lexikon-der-wehrmacht.de/Gliederungen/Panzergruppen/{2,3,4}Panzergruppe.htm` → 均 **404**（同站 `Heeresgruppen/HeeresgruppeMitte.htm`、`Armeen/4Armee.htm`、`Armeen/9Armee.htm`、`Luftflotten/Luftflotte2.htm` 均 **200**，说明站点结构与命名已变）。
- `su_krivosheev` 指向 `https://www.soldat.ru/doc/casualties/book/` → **404**（`https://www.soldat.ru/doc/casualties/` 为 200）。
- **判定**：这三条不是编造（域名与栏目真实存在，只是叶子页改名/下线），但既已在 `pipeline/research.json` 的 `accessLimitations` 里承认「二手转引层级」，就应在来源条目里显式写明「链接已失效，仅作转引定位」。**修法**：改 `url` 为 200 的上级目录页，并在 `title` 末尾加「（原链接已失效，经二手转述）」。

### F7 · low · `dukhovshchina` 坐标错 33 km

- `data/gazetteer/north.json`：`[32.41, 55.5]`，实际约 **55.20°N / 32.40°E**（杜霍夫希纳在 55.2 纬度带）。该点被 `data/routes/main.json` 第 19 行用作 `r.…` 的一个途经点，错位会让第 3 装甲集群的出发段整体北移 33 km。
- **修法**：改为 `[32.40, 55.20]`，重跑 `make_fronts.py`（该点不参与 `CITY_WINDOWS`，几何影响仅限路线）。

### F8 · low · 口径与可读性建议（不影响判定）

1. `data/forces.json` 的 `sides.DE.divisions` 写「3 个装甲集群（第 2、第 3、第 4）」，而 `byPhase.mozhaisk/november` 已改称「第 2 装甲集团军」——同一文件内两种称法并存。建议在 `divisions` 后加括注「（第 2 装甲集群 10-05 起称第 2 装甲集团军；第 3、第 4 至 1942-01-01 才改称）」，与 `docs/MILITARY-RESEARCH.md` §4 对齐。
2. `e.kholm_pocket`（1/23）写「包围圈由空运维持，直到五月才被德军解围」。这句话本身**清楚**（主语是霍尔姆的德军守备队，解围方是德军），且已写明是围困的延续，**建议保留**；若求更稳，可加一句「（本战役窗口在 1/31 结束，此处为后续结局）」。
3. `city-ledger.json` 的 5 条 `knownLineMismatches` 复核后确认是 25 行剖面的结构性限制（我独立用多边形点判复核了 177 条状态点，**22 条与帧多边形不一致**，其中 5 条已登记，其余 17 条是「帧日期滞后半日到数日」造成的（例如 `klin` 12-15T12:00 记 SU 而最近帧是 12-14），属关键帧网格粒度的必然结果，**不是史实错误**，不需修。

---

## 5. 伤亡与口径复核

| 项 | 位置 | 内容 | 判定 |
|---|---|---|---|
| 苏方防御阶段 | `forces.json` `sides.SU.losses.killed/wounded` | 514,338 / 143,941，注明「typhoon+mozhaisk+november 三阶段合计（截至 1941-12-05）」 | **通过**（阶段归属正确） |
| 苏方反攻阶段 | 同上 `losses.captured` 字段 | 139,586 / 231,369，注明「counter 阶段（截至 1942-01-07，不含 1 月）」 | **通过** |
| 苏方 1 月阶段 | `byPhase.january.SU.losses` 与 `note` | 「1942 年 1 月阶段苏军伤亡未核定，留空不插值」「本包不推算、不插值」 | **通过（留空未插值）** |
| 德方三段 | `sides.DE.losses` | 145,000（10 月—12 月初，含 32,100/5,400/98,800）、103,600（12 月）、144,900（1 月） | **通过** |
| 德方 436,900 | `forces.json` note | 「对应 1941 年 12 月至 1942 年 3 月，不是本战役区间」 | **通过** |
| 德方 436,900 | `campaign.json` `credits.extraHtml` | 「…1 月约 144,900 人，四个月合计约 436,900 人」 | **不通过 → F1** |
| 博克宣称 | 两处 + 事件 | 均标「德方战时宣称口径」 | **通过** |
| 多口径合并 | 全文 | 未发现把任两组相加或被写成单一数字；`byPhase` 各阶段 `note` 都写了「不可相加/不可比较」 | **通过** |

> `ui.brief.fine`（118 字）只写 514,338 / 143,941 与「两方不合并相加」「博克数字是德方战时口径」，未提及 436,900，**本身没有错**。

---

## 6. 指挥去职日复核

| 人物 | 要求 | 实际落点 | 判定 |
|---|---|---|---|
| 博克 | 1941-12-19 | `forces.json` commander「12 月 19 日由克鲁格接任」；`de.hgr_center`；`e.brauchitsch_bock_relieved`（12-19T18:00） | **正确** |
| 古德里安 | 1941-12-25 | `de.pzgr2.commander`「12 月 25 日去职」；`e.guderian_relieved`（at=12-26T22:00，正文「十二月二十六日…被解除」，与「12-25 决定、12-26 生效」的通行说法一致） | **正确**（但来源标题写 12-20，见 F3） |
| 霍普纳 | 1942-01-08 | `de.pzgr4.commander`「1942 年 1 月 8 日去职」；`data/fronts/1941-12-28` 的 note 还专门写了「霍普纳的免职为 1942-01-08，勿与 12/25 混为一谈」 | **正确** |
| 施特劳斯 | 1942-01-14/16 | `de.9a.commander`「1942 年 1 月 14—16 日去职」 | **正确** |

四个日期**全部正确**，且英文维基「并入 12-25」的错误说法没有被采纳。

---

## 7. 来源纪律复核

- **抽查 8 条事件的 `sources`**（`e.campaign_opens` / `e.mtsensk_ambush` / `e.vyazma_ring_closed` / `e.red_square_parade` / `e.klin_falls` / `e.november_toll` / `e.kaluga_liberated` / `e.winter_general_myth`）：**32 个引用全部命中** `data/sources/*.json` 的已登记 id，0 悬空；每个 id 的 `title` 所描述的内容与正文所述相符（唯一的例外是 F3 那三条标题本身写错了史实）。
- **编造检查**：全包 `data/`、`pipeline/` 未出现 `ф.`／`оп.`／`RGVA`／`ЦАМО`／`NARA`／roll 号／`p. 数字` 之类伪造档号；URL 全部是真实站点（404 的三条是失效而非虚构，见 F6）；无自造页码。
- 46 条来源**全部被引用**，`validate` 0 警告与此一致。
- 18 张事件照片：`photo.commons` 均为 `photos/index.json` 的 20 个键之一，WebP 实体文件全部存在且 >100 字节，0 缺失。

---

## 8. 几何复核

- `audit-control.ts` **69/69**（见 §1）。
- 抽查 3 帧（11-30、12-02、12-17）的多边形自相交与洞语义：
  - 38 帧外环 **全部 0 处自相交**（我独立用 O(n²) 线段相交检测复核，与 `make_fronts` 自检一致）；
  - 洞：10-07/10-10/10-12 帧含维亚济马圈与布良斯克圈 2 个洞，10-14 起维亚济马洞消失，1942-01-23 起托罗佩茨走廊洞出现——**洞的出现/消失与 `pockets.json`、`WEDGES` 的起止一致**；
  - 洞内锚点在引擎场里判为 SU、洞外判 DE（用仓库 `engine/geo/field` 实测 10-07 的 `trubchevsk`=SU、`bryansk`=DE）。
- `make_fronts.py` 现在的产物与重跑结果**逐帧一致**（0 帧差异），幂等成立。
- **已知不算问题**（按队长裁定不记 finding）：`data/fronts/` 11-27—12-08 的顶点交错已由 G2 修毕（本次复核这 8 帧最大画布内边长 25—27 km，无上百公里长弦）；`city-ledger` 5 条 `knownLineMismatches`；配乐 `elegy` 404。

---

## 9. 数据快照（复核所依据的版本）

```
md5 data/fronts/1941-12-02T00-00.json      dd975021fab590fd40b518e8e9bb0716
md5 pipeline/make_fronts.py                1283e2736ac2dae443031ed6cb5776ab
md5 data/events.json                       85e1cfd5f512b9fb46715748b781111c
md5 campaign.json                          b0d8b961c2014497cbf914b3836eeaca
md5 data/gazetteer/core.json               6c864feacb8764725503e6b66ec0544c
md5 data/forces.json                       2221d09b2a1dd0675860d63a7b4032dd
mtime data/fronts/*.json                   2026-10-22 19:44:52（G2 最后一次重跑）
```

> 审查期间 `data/fronts/*.json` 与 `make_fronts.py` 被 G2 连续重跑过多次（19:12 → 19:37 → 19:44），本节哈希之后的改动**不在本次审查范围内**。F2 已在 19:44 版本（`md5 dd9750…`）上复核确认仍存在。

---

## 10. 结论

**`needs_revision`。**

- **必须修（blocker/high）**：F1（436,900 的月份写成本战役四个月合计，与 `forces.json` 正面矛盾，且是验收点名项）、F2（12-02 帧把谢尔吉耶夫镇划入德控）、F3（三条来源标题的史实错误：第 3 装甲集群改称日、第 4 装甲集群司令、古德里安去职日）。
- **建议下一轮修（medium）**：F4（克拉斯纳亚波利亚纳坐标 21.8 km）、F5（霍尔姆-日尔科夫斯基坐标 66 km + 包围圈锚点）。
- **可选（low）**：F6 失效链接、F7 杜霍夫希纳坐标、F8 三处口径统一建议。

**没有编造来源，没有一处事件日期/地点错误，六条争议写法全部合规，四个去职日全部正确，69 条控制区断言全绿。** 已发布状态若要回滚代价很大，但 F1 是一句话的文本修正、F2 是一个参数或一行硬上限、F3 是三条标题字符串，三者都不触碰已通过验收的几何与事件正文，**修复成本远低于留着它们的代价**。

---
---

# 莫斯科保卫战 · V1 独立史实与数据审查（round 2）

- 复审对象：round 1 的 F1—F8 修复结果 + 修复引入的新变化
- 审查人：审查-史实一致（只读复审，未改动任何被审文件）
- 数据快照：`data/fronts/1941-10-12T00-00.json` md5 `5d8e9cb9…`、`make_fronts.py` md5 `0ce7b1ca…`、`campaign.json` md5 `fcb79d49…`、`data/gazetteer/core.json` md5 `e5e498ca…`
- **结论：`needs_revision`** —— F1、F2、F3、F4、F6、F7、F8 **全部改对并验证通过**；但 **F4/F5 的坐标修正引入了一处新的史实回归（N1）**：`1941-10-12` 帧把 10 月 9 日即已被德军占领、此后一直德占到 1943 年的**格扎茨克判为苏方**。这属「确凿史实错误 + 数据自相矛盾」，按判据必须记 finding。

---

## 1. 三条机械校验（重跑，原样输出）

```
$ npx tsx tools/validate/validate.ts --campaign moscow-1941
✓ moscow-1941  地名 122 · 部队 255 · 路线 56 · 关键帧 38 · 事件 115 · 装备 19 · 来源 46  — 0 错误，0 警告

$ npx tsx campaigns/moscow-1941/pipeline/audit-control.ts
控制区审计：69/69 通过

$ python3 campaigns/moscow-1941/pipeline/make_fronts.py --check
关键帧 38 帧（带洞 7 帧）；洞 3 处；城市断言 82 条
...
✓ 自检全部通过

$ npx vitest run campaigns/moscow-1941/tests
Test Files 3 passed (3) | Tests 72 passed (72)
```

四条全绿。**但这四条同样抓不到 N1**——原因见 §4。

---

## 2. F1—F8 逐条复核（round 1 的 findings 是否真的改对）

| id | 修复位置 | 我的独立核验 | 判定 |
|---|---|---|---|
| **F1** | `campaign.json` `credits.extraHtml`〈伤亡口径〉 | 现文「…1 月约 144,900 人（以上三段为本战役区间）。另有常被引用的 436,900 人，那是 1941 年 12 月至 1942 年 3 月的冬季战局延伸统计（103,600+144,900+108,700+79,700），不是本战役数字；同一序列内无法补充的减员为 256,500 人。三组口径互不相加。」**算术复核**：145,000+103,600+144,900 = 393,500 ≠ 436,900（旧错误已消除）；103,600+144,900+108,700+79,700 = **436,900** ✓。全文件「四个月」出现 **0** 次。与 `forces.json` note 完全一致 | **通过** |
| **F2** | `make_fronts.py:455` `MAX_EAST_DEG = {'yakhroma': 37.70}` + 5 条 `sergiyev_posad` 断言 | 逐帧射线法复算 **38/38 帧**：`sergiyev_posad (38.133,56.300)` 落入 DE 的帧数 **0**。另核：11-28—12-08 桥头仍存在（37.45—37.60 判 DE，37.70 起 SU），未因上限而误删 | **通过** |
| **F3** | `data/sources/german.json` + `pipeline/source-registry.json` | 双文件同步且文本正确：`ger_pzgr3`→「1942-01-01 起为第 3 装甲集团军」；`ger_pzgr4`→「（霍普纳）」；`ger_guderian_panzerleader`→「12 月 25 日去职」。全仓「12 月 20 日去职」出现 **0** 次 | **通过** |
| **F4** | `core.json` + `place-inventory.json` → `[37.428, 56.023]`；改用 `WEDGES` 楔形 | 坐标与真实值（56.0229/37.4280）偏差 **0.01 km**；距克里姆林宫 **32.2 km**（与史料 29 km 量级吻合）。楔形多边形 11-29—12-08 正确出现、12-11 消失，5/5 帧锚点判德方 | **通过** |
| **F5** | `north.json` + `place-inventory.json` → `[33.467, 55.517]`；`p.vyazma` anchor→`sychevka` | 坐标与真实值偏差 **0.00 km**；anchor 已换、`end=1941-10-13T12:00` 与洞同窗；洞 3/3 全过 | **通过（但见 N1）** |
| **F6** | 三条 URL → `lexikon-der-wehrmacht.de/inhaltsverzeichnis1.htm`；`su_krivosheev` → `soldat.ru/doc/casualties/` | `curl` 实测两条 **均 200**；title 均附「原链接已失效，经二手转述」 | **通过** |
| **F7** | `dukhovshchina` → `[32.4, 55.2]` | 与 `place-inventory.json` 同步，值正确（杜霍夫希纳 55.20°N）；`mtsensk` 未被误改（仍 `[36.547, 53.265]`） | **通过** |
| **F8** | `forces.json` `sides.DE.divisions` | 已加「（第 2 装甲集群 1941-10-05 起称第 2 装甲集团军；第 3、第 4 装甲集群至 1942-01-01 才改称装甲集团军）」，与 `MILITARY-RESEARCH.md` §4 及同文件 `byPhase` 对齐 | **通过** |
| **F4 后半** | `e.krasnaya_polyana` 正文 | 已改为「对莫斯科市界约二十公里、对克里姆林宫约三十二公里……战史常见的『二十七公里』按公路里程与更靠前的前哨点计算」，127 字（在 80—140 内），三种口径已调和 | **通过** |

**8 条 + 1 条后续，全部按 round 1 的要求改对了。**

---

## 3. 新增 finding

### N1 · high · `1941-10-12` 帧把格扎茨克判为苏方（F4/F5 坐标修正引入的回归）

- **文件**：`campaigns/moscow-1941/data/fronts/1941-10-12T00-00.json`（外环在 55.55°N 处东界 = 34.783°E）
- **事实**：格扎茨克（`gzhatsk`，34.99°E / 55.55°N）**1941-10-09 被党卫军「帝国」师占领，此后一直德占到 1943-03-06**。但当前 10-12 帧把它判为 **SU**。
- **三重矛盾**（同一交付内部）：
  1. `data/events.json` 的 `e.gzhatsk_outer_ring`（10-09）明写「党卫军『帝国』师先遣队夺取格扎茨克」；
  2. `pipeline/city-ledger.json` 的 `gzhatsk`：`1941-10-09 DE → 1942-01-31 DE`，**中途无任何翻转**；
  3. `make_fronts.py` 自己的 `CITY_WINDOWS` 中 `('gzhatsk', '1941-10-09T00:00', None, …)` 意为「10-09 起恒德」——**生成器声明了却没能做到**。
- **量化**：55.55°N 处德控东界 10-10 为 35.10°E、**10-12 回缩到 34.78°E**、10-14 又回到 35.64°E。即在 10-10→10-12 之间西退 **20.0 km**、10-12→10-14 之间东进 **54.2 km**，形成一个只存在于单帧的 20 km 深凹口，把城（距该帧东界 13.0 km 以东）甩到苏方。
- **引擎层后果**：用仓库 `engine/geo/field` 逐日采样，格扎茨克 10/9—10/20 为 `DE DE SU SU SU DE DE DE DE DE DE DE`，**翻转 2 次**（史实应为 0 次）——即 10-11、10-12、10-13 三天城内显示为苏方。
- **成因（已定位到具体代码）**：`apply_city_windows` 的「凹口优先权」选择器在 55.550°N 这一行上看走了眼。
  ```
  row 55.550: gzhatsk dist=0.000 pri=0     → score  0.000
              mozhaisk dist=0.044 pri=0.9   → score -0.019   ← 胜出
  ```
  `NOTCH_PRIORITY = {'mozhaisk': 0.9}` 让 `mozhaisk` 的权重在 0.9×半宽 ≈ 0.063° 的范围内**压过纬度完全相同**的 `gzhatsk`（`0.044 - 0.9×0.07 = -0.019 < 0`）。于是格扎茨克自己那一行被 `mozhaisk` 接管，按「mozhaisk 此刻属苏方」的净空量把战线拉回 34.783°E，城就落到东界以东。
  `NOTCH_PRIORITY` / `NOTCH_ROW_WEIGHTS` 是 round 1 之后新增的机制（round-1 快照 `mf_1945.py` 中 `NOTCH_PRIORITY` 出现 **0** 次），所以这是**修复引入的回归**，round 1 快照里 10-10/10-12/10-14 三帧 `gzhatsk` 均判 DE、无此问题。
- **为何四条机械校验都没抓到**：`CHECKS`（82 条）里 `gzhatsk` 只有 `1942-01-31` 一条；`audit-control.ts`（69 条）里 `gzhatsk` 也只有 `1942-01-31` 一条；`validate` 与 `vitest` 不查单个城镇的逐帧归属。**三条断言集都恰好没有覆盖 10-12 这个点。**
- **修法（已实测验证，二选一）**：
  1. **改优先权（最小、已验证）**：把 `pipeline/make_fronts.py:474` 的 `NOTCH_PRIORITY = {'mozhaisk': 0.9}` 改为 `NOTCH_PRIORITY = {}`（或 `{'mozhaisk': 0.0}`）。我实测 `mozhaisk` 取 0.0 后：
     - `gzhatsk` 10-12 恢复为 **DE**；
     - `mozhaisk` 自己的轨迹仍是 `SU → 10-18 DE → 1942-01-23 SU`（**未受影响**，其翻转点不变）；
     - `audit-control` 69 条 **0 违规**；生成器 82 条自检 **全过**；洞 3/3、突出部 5/5 全过；
     - 同时把 5 处 `CITY_WINDOWS` 违规降到 3 处（另 2 处 `kholm_zhirkovsky@10-05`、`gzhatsk@10-12` 一并消失）。
  2. **补断言（必做，无论选哪个修法）**：在 `pipeline/make_fronts.py` 的 `CHECKS` 里补 `('gzhatsk', '格扎茨克', '1941-10-12T00:00', 'DE', '10-09 失守后恒德占')`，并在 `pipeline/audit-control.ts` 的 `ROWS` 里补 `['gzhatsk', '1941-10-12T12:00', 'DE', '10-09 失守，1943-03 才收复']`。这样同类回归下次会被直接抓住。

> 附带观察（同一机制、严重度低，不单独开 finding）：`CITY_WINDOWS` 与帧多边形之间目前还有 **3 处**口径差——`volokolamsk@10-27`、`venyov@11-25`、`yakhroma@11-27` 均判 SU 而窗口判 DE。但 my round-1 快照里这 3 处**完全一样**，且都是「关键帧日期比城市翻转日早半天到一天」的网格粒度所致（10-27 帧是 00:00，失守是当日白天），**属既有行为、不是本次回归**，且 82 条 `CHECKS` 与 69 条 `audit` 都刻意避开了这些点（用 10-31 / 11-30 / 11-28 等更晚的帧断言）。**不记 finding**，仅记录在此。

### N2 · low · round-1 报告 F7 的描述有一处小瑕疵（不影响结论）

round 1 的 F7 正文说「`dukhovshchina` 坐标 [32.41,55.5]」，但 `fixRequired` 里给的正确值是 `[32.40, 55.20]`，两处纬度写法不一致（正文写 `55.5`，修法写 `55.20`）。实际修复采用了正确的 `[32.4, 55.2]`，**结果是对的**。这是 round 1 报告的表述瑕疵，不影响本轮判定，记录以免后续误读。

---

## 4. 六条争议写法 / 伤亡口径 / 去职日 / 来源纪律（复检）

- **六条争议写法**：`credits.extraHtml` 的六段（潘菲洛夫、波多利斯克、冬将军、佐尔格、十月十六日恐慌、博克俘虏数）经本轮复查**未被修复动作改动、口径仍正确**。`e.krasnaya_polyana` 改动后仍保留「战史常见的『二十七公里』按公路里程与更靠前的前哨点计算」的异说并列。
- **伤亡口径**：`forces.json` 与 `credits.extraHtml` 现**完全一致**（F1 修复后）；1 月苏军伤亡仍留空未插值；博克数字仍标德方战时宣称。
- **四个去职日**：博克 12-19、古德里安 12-25、霍普纳 1942-01-08、施特劳斯 1942-01-14/16 —— 本轮复检**仍全部正确**，且 `ger_guderian_panzerleader` 的标题已同步为 12-25。
- **来源纪律**：F6 修复后 46 条来源的 URL 全部为真实站点（失效者已改为目录页并标注）；无编造档号。

---

## 5. 结论

**`needs_revision`。**

- **F1—F8 以及 F4 后半，9 项全部修复到位**，我逐条独立复核通过（含算术自校验、38 帧逐帧射线法、坐标与维基值比对、URL 实测 HTTP 200）。
- **但 F4/F5 的坐标修正引入了 1 处新的 high 级回归（N1）**：`1941-10-12` 帧把格扎茨克判为苏方，与该城 10-09 失守、此后恒德占至 1943 年的史实冲突，也与包内的事件正文、`city-ledger`、生成器自己的 `CITY_WINDOWS` 三重矛盾。引擎层实测 10-11—10-13 三天城内显示苏方，属玩家可见的错误。
- **修法极小且已实测**：`NOTCH_PRIORITY` 由 `{'mozhaisk': 0.9}` 改为 `{}`（一行），`mozhaisk` 自身轨迹与 69 条审计全部不受影响；再补两条 `gzhatsk@10-12` 断言防回归。
- 若该条修复并补断言后重跑三条命令全绿，**我预期 round 3 可以直接判 pass**——除 N1 外，本轮未发现任何其他确凿史实错误、编造来源或数据矛盾。

---

# Round 3 · N1 修复后的复核（队长代执行）

> round 2 判 `needs_revision` 的唯一理由是新出现的 N1 回归（格扎茨克 10-11—10-13 误判苏方）。
> N1 已由工程-地理战线修复，本轮由队长直接复核并代记，理由：round 2 已明确「修完 N1 并补断言后重跑全绿，预期 round 3 可直接判 pass」，且复核项是**机械可验证**的。

## 1. N1 修复内容

| 项 | 内容 |
|---|---|
| 成因 | `make_fronts.py` 的 `NOTCH_PRIORITY = {'mozhaisk': 0.9}` 在 55.550°N 行使 mozhaisk 压过纬度相同的 gzhatsk（dist=0.000），抢走其纬度行 |
| 修法（实际） | 删除 `NOTCH_PRIORITY`；新增 `_apply_row_weight_pushes()`，在归属循环之后让城市**整形自己纬度带内的行**，不再抢别人的行。**比 round 2 建议的「设为 `{}`」更彻底**——实测直接设 `{}` 会让 `mozhaisk@10-16` 回退 |
| 防回归 | `CHECKS` 82 → **103 条**：为 9 个「恒占（`to=None`）」城市各补中途采样点（mtsensk / dmitrov / kholm / smolensk / serpukhov / kashira / kolomna / ryazan / ostashkov），加 gzhatsk 3 条；`audit-control.ts` 加 `gzhatsk@1941-10-12 = DE` → 69 → **70 条** |

## 2. 复核（队长实跑，引擎 SDF 逐日）

```
gzhatsk  : DDDDDDDDDD   10-09 → 01-31 恒德占，0 次翻转   ✓（修前 10-11—10-13 为 SU）
mozhaisk : SSSSSSSDDS   10-16 前 SU → 10-18 起 DE → 01-23 收复   ✓（未回退）
```

```
npx tsx campaigns/moscow-1941/pipeline/audit-control.ts        → 控制区审计：70/70 通过
python3 campaigns/moscow-1941/pipeline/make_fronts.py --check  → ✓ 自检全部通过（103 条 · 洞 3/3 · 突出部 5/5）
npx tsx tools/validate/validate.ts --campaign moscow-1941      → 0 错误 0 警告
npx vitest run campaigns/moscow-1941/tests                     → 3 files / 72 passed
npx vitest run（全库）                                          → 35 files / 573 passed
npx tsc --noEmit（两个 tsconfig）                               → 均通过
npx tsx tools/validate/validate.ts --all --quiet               → 16 战役全 0 错误
npm run build                                                  → 通过（685.66 kB / gzip 138.30 kB）
```

## 3. 结论

**`pass`。**

- round 1 的 F1—F8 + F4 后半（9 项）已全部修复并经 round 2 独立复核通过；
- round 2 的唯一阻塞项 N1 已修复，且**两条相关轨迹同时正确**（gzhatsk 恒德占、mozhaisk 未回退）；
- 断言从 69 + 82 增至 **70 + 103**，其中 9 个「恒占」城市的中途采样点是**针对这次回归类型新增的结构性防护**；
- 未发现任何未修复的确凿史实错误、编造来源或数据自相矛盾。

**遗留（不阻塞发布，已在 `docs/QA.md` 与本节记录）**：
1. `CITY_WINDOWS` 与帧多边形 3 处网格粒度差（`volokolamsk@10-27`、`venyov@11-25`、`yakhroma@11-27`）—— 关键帧 00:00 早于当日白天的失守，属既有行为，断言刻意避开这些点；
2. `city-ledger.json` 的 5 条 `knownLineMismatches`（结构性限制，以 city-ledger 为准）；
3. 配乐 `elegy` 首次播放 404（引擎 `audio.ts` 预载策略，跨 9 战役既有缺陷，见 QA 的 K1）。

---

## Round 3 · 独立复核（审查-史实一致，非代记）

> 队长已在上一节代记了 round 3 的结论。本节是审查员本人对同一批数据的**独立重跑与判断**，不引用队长的输出，只写我自己量到的结果。目的是让「pass」这个结论有一个可追溯的独立来源。

### 1. 我实跑的校验

```
npx tsx campaigns/moscow-1941/pipeline/audit-control.ts        → 控制区审计：70/70 通过
python3 campaigns/moscow-1941/pipeline/make_fronts.py --check  → 关键帧 38 帧（带洞 7 帧）；洞 3 处；城市断言 103 条；✓ 自检全部通过
npx tsx tools/validate/validate.ts --campaign moscow-1941      → 0 错误 0 警告
npx vitest run campaigns/moscow-1941/tests                     → 3 files / 72 passed
```

### 2. N1 是否真的修好（我自己用引擎 SDF 逐日采样）

```
gzhatsk  10-09 → 1942-01-31   DDDDDD…（全 D）  flips = 0    ✓ 修前 10-11—10-13 为 S
mozhaisk 10-14 → 1942-02-05   SSS + 100×D + 57×S  flips = 2  ✓ 首次转德 10-17、最后德占 01-17
```

- **gzhatsk 0 次翻转**，与「10-09 失守、1943-03 才收复」一致；
- **mozhaisk 未回退**：关键帧判定仍是 `10-14 SU / 10-16 SU / 10-18 DE / 10-21 DE`，与 round-1 快照**逐帧一致**；逐日翻转点落在 10-17（10-16 与 10-18 两帧的平滑插值中点），这是关键帧网格的固有产物，不是错误，且 `audit-control` 只在 `10-16T12:00=SU`、`11-20T12:00=DE` 两端断言，避开了中点。

### 3. 回归扫描（round 2 → round 3，全部 122 地名 × 38 帧）

判定发生变化的位置共 **7 处**，逐条核对后**全部是修复目标本身，无新增回归**：

| 帧 | 城市 | round2 | round3 | 性质 |
|---|---|---|---|---|
| 1941-10-05 | kholm_zhirkovsky | DE | SU | 窗口起点是 10-06，10-05 帧判苏方**正确**（round2 是早了一帧，本次一并纠正） |
| 1941-11-29 / 11-30 / 12-02 / 12-05 / 12-08 | krasnaya_polyana | SU | DE | F4 坐标修正 + 楔形的预期结果，**正确** |
| 1941-12-02 | sergiyev_posad | DE | SU | F2 修复目标，**正确** |

`gzhatsk` 在 10-12 的修复未使任何其他城市翻面。

### 4. 断言覆盖是否补到位

- `CHECKS` 82 → **103 条**：9 个「恒占（`to=None`）」城市（mtsensk / dmitrov / kholm / smolensk / serpukhov / kashira / kolomna / ryazan / ostashkov）各补了中途采样点，`gzhatsk` 由 1 条增至 **5 条**（10-12 / 10-16 / 12-02 / 1942-01-31 等），覆盖了 round 2 指出的缺口；
- `audit-control.ts` 69 → **70 条**，新增 `['gzhatsk','1941-10-12T12:00','DE','10-09 失守，1943-03 才收复']`；
- 生成器内含 **103 条**断言、洞 3/3、突出部 5/5，全部通过。

### 5. 遗留（不阻塞）

- `CITY_WINDOWS` 与帧多边形仍有 **3 处**网格粒度差（`volokolamsk@10-27`、`venyov@11-25`、`yakhroma@11-27`）。我比对了 round-1 快照：这 3 处**与 round 1 完全相同**，属既有行为（关键帧 00:00 早于当日白天的失守时刻），不是任何一轮修复引入的回归；103 条 `CHECKS` 与 70 条 `audit` 均刻意用更晚的帧断言，避开了这些点。
- F6 的失效链接已改为目录页并标注；无编造 URL、页码、档号。

### 6. 结论

**`pass`。**

round 1 的 F1—F8 + F4 后半（9 项）已全部修复；round 2 的唯一阻塞项 N1（格扎茨克 10-11—10-13 误判苏方）已修复且**未引入新回归**（122×38 全量扫描仅 7 处变化，全部正确）；断言覆盖从 69+82 增至 **70+103**，并针对本次回归类型补了结构性防护。未发现任何未修复的确凿史实错误、编造来源或数据自相矛盾。
