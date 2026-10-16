# 拉普拉塔河口海战（1939-12-13）及尾随追踪 · 战斗研究笔记（草稿 v1，持续补充）

> 状态说明：本文件在研究中途先行落盘（v1），随后会补充轨迹/火力数据与更多交叉验证。
> 配套机器可读表：`battle_tracks.json`（航迹）、`battle_fire.json`（火力/命中/鱼雷/烟幕/飞机/信号）。
> 所有时间默认为「英国舰队舰钟时间 = Zone +2（比格林尼治慢 2 小时）」，见第 2 节。

## 1. 来源表

| id | 作者 | 题目 | 年份 | 网址 | 支撑内容 |
|---|---|---|---|---|---|
| `harwood_despatch` | Rear Adm. H. H. Harwood | "The River Plate Battle"（致海军部公文，1939-12-30 签署；**London Gazette 增刊第 37989 号**，增刊日期 1947-06-17，刊于 1947-06-19）。注：任务说明里的 “38017” 有误，实际为 37989 | 1947 | https://www.ibiblio.org/hyperwar/UN/UK/LondonGazette/37989.pdf ；全文转录 https://www.naval-history.net/WW2LGGrafSpee.htm 、https://kbismarck.com/river-plate-battle.html | 英方主时间线、0520 定位、各舰开火/转向/鱼雷/飞机/追踪事件、“All times … Zone plus 2” |
| `admiralty_1940` | Admiralty（NID/HMSO） | *The Battle of the River Plate. An account of events before, during and after the action up to the self-destruction of the Admiral Graf Spee*（据 Harwood 及三舰舰长报告编成） | 1940 | https://archive.org/details/battleriverplate （PDF/OCR 已读） | “ship's time kept by the Squadron … two hours slow on GMT”；天气；0632 Exeter 右舷鱼雷、航速 28 节、0010 抛锚；**附 NID 战斗航迹图（Enclosure 2，N.I.D. March 1940）与河口图** |
| `admiralty_track_chart` | N.I.D. | "Action between H.M. Ships 'Ajax', 'Exeter' and 'Achilles' and 'Admiral Graf Spee' 13th December 1939"（`admiralty_1940` 附图） | 1940 | 同上，PDF 第 18 页 | 每 10 分钟时刻刻度（6.14/6.20/6.26/6.36/6.46/6.56/7.06/7.16/7.26/7.36/7.46/7.56）、比例尺、指北、风向、烟幕位置、范围线（10 / 8½ / 6 / 5 英里）——本研究航迹的相对几何基础 |
| `waters_1956` | S. D. Waters | *The Royal New Zealand Navy*, ch. 4 "The Battle of the River Plate"（NZ 官方二战史） | 1956 | http://nzetc.victoria.ac.nz/tm/scholarly/tei-WH2Navy-c4.html （经 Wayback 读取） | Achilles 视角；0520 位置“距 Santa Maria 角正东 240 海里、距蒙得维的亚约 340 海里”；日出 0556；德方报告（2 发 8 英寸 + 18 发 6 英寸命中；36 阵亡；306 发 28cm 剩余≈40%）；Ajax 823 发、Achilles >200 齐射；后半日追踪细节（1942、2013、2317 等） |
| `atwill_1977` | Lt R. Atwill DSM RN | "HMS Exeter at the Battle of River Plate", *Naval Historical Review* | 1977 | https://www.navyhistory.org.au/hms-exeter-at-the-battle-of-river-plate/ （4 页） | Exeter 视角：0500 破晓战位、命中部位与效果、0700 状态、损管 |
| `cussen_diary` | Surg Cdr J. Cussen（经 S. G. Bennett 整理） | "The Battle of the River Plate: Excerpts from the Diary of Surgeon Commander Jack Cussen RN, PMO of HMS Exeter", JMVH 27(3) | 2019 | https://www.jmvh.org/article/the-battle-of-the-river-plate-excerpts-from-the-diary-of-surgeon-commander-jack-cussen-rn-pmo-of-hms-exeter | Exeter 伤亡/医务；“Secure” 约 0520 |
| `kaack_2010` | H.-J. Kaack | “Führungsentscheidung in einer Grenzsituation: KzS Langsdorff vor und in Montevideo 1939”（引 OKM《Untersuchungsbericht》1945, BA-MA RM 8/1901；Diggins、Wattenberg 回忆；Millington-Drake） | 2010 | http://www.mkbug.de/vortrag.pdf | **德方时间**：0600 “Klar Schiff zum Gefecht”，第一阶段 0617–0638，0715 Exeter 退出，0730 战斗间歇；Langsdorff 受伤/昏迷；约 2230 见蒙得维的亚灯火；“午夜”抛锚；损伤摘要 |
| `usni_cambareri_1983` | C. S. Cambareri | "Scuttle the Graf Spee!", USNI *Proceedings* 109/6 | 1983 | https://www.usni.org/magazines/proceedings/1983/june/scuttle-graf-spee （Wayback） | 引 Graf Spee 航海日志：“About 0634 the Exeter turned sharply away after heavy hits…” |
| `pope_1956` | Dudley Pope | *The Battle of the River Plate*（美版 *Graf Spee: The Life and Death of a Raider*） | 1956 | archive.org 仅限借阅（未能全文读取） | 仅经二手引用（0552 德方见桅、Shakespeare 事件等）；**未直接核对页码** |
| `millington_drake_1964` | Sir E. Millington-Drake | *The Drama of Graf Spee and the Battle of the Plate: A Documentary Anthology 1914–1964* | 1964 | archive.org 仅限借阅 | 经 Kaack 间接引用；未直接读取 |
| `rasenack_1957` | F. W. Rasenack | *Panzerschiff „Admiral Graf Spee“: Kampf, Sieg und Untergang; Tagebuch-Aufzeichnungen* | 1957 | archive.org 仅限借阅 | 德方日记；**未能全文读取**，德方时间改由 `kaack_2010`、`waters_1956` 间接取得 |
| `wiki_en_river_plate` | Wikipedia EN | “Battle of the River Plate” | 2026 访问 | https://en.wikipedia.org/wiki/Battle_of_the_River_Plate | 汇总；**错误**：0520 位置写作 48°17′W（despatch 为 49°17′W）；锚泊 00:10 |
| `wiki_de_river_plate` | Wikipedia DE | “Gefecht vor dem Río de la Plata”（基于 Konstam） | 2026 访问 | https://de.wikipedia.org/wiki/Seeschlacht_vor_dem_R%C3%ADo_de_la_Plata | 德方 0552 见桅（≈17 nm）、0600 提速、1815 [sic] 开火距离 18 200 m 等；多处细节含混 |
| `wiki_es_river_plate` / `wiki_it_river_plate` / `wiki_ru_river_plate` / `wiki_fr_river_plate` | Wikipedia ES/IT/RU/FR | 同名条目 | 2026 访问 | es/it/ru/fr.wikipedia.org | 仅作旁证（脚注稀少；ES 称 0530 见桅、0617 开火；IT 称“24.00 抛锚”） |
| `nzhistory_battle` | NZ History (Manatū Taonga) | “Battle of the River Plate – The battle” | 2022 | https://nzhistory.govt.nz/war/battle-of-river-plate/the-battle | Achilles 命中、>200 齐射、82 分钟战斗 |
| `el_observador_2019` | El Observador (Montevideo) | “El Graf Spee en la trampa de Montevideo” | 2019 | https://www.elobservador.com.uy/nota/el-graf-spee-en-la-trampa-de-montevideo-201912231730 | 乌拉圭媒体：“0:50 del jueves 14” 抛锚；Langsdorff 约 3:30 上岸 |
| `tzdb_southamerica` | IANA tz database | `southamerica` 文件，Uruguay/Argentina 规则 | 现行 | https://github.com/eggert/tz/blob/main/southamerica | 1939-12 乌拉圭 UTC−3（标准 −3:30＋夏令 0:30） |
| `nh_kindell_casualties` | D. Kindell / naval-history.net | 皇家海军伤亡名单与荣誉（含 Washbourn、Cameron 嘉奖词） | — | https://www.naval-history.net/WW2LGGrafSpee.htm | 逐人名单（13 Dec: Achilles 4，Ajax 7，Exeter 61 含 DOW） |
| `faaoa_lewin` | Fleet Air Arm Officers' Assoc.; Wikipedia “Duncan Lewin” | “On this day 13 December 1939” | — | https://www.fleetairarmoa.org/news/on-this-day-13-december-1939 | Ajax 的 Seafox（718 Catapult Flight）：飞行员 Lt E. D. G. Lewin，观察员 Lt R. E. N. Kearney |
| `hmsajax_org` | HMS Ajax & River Plate Veterans Assoc. | “The Battle of the River Plate – Battle Description” | — | https://hmsajax.org/the-battle-of-the-river-plate | 概述 |
| `orlopdeck_chronology` | J. R. Richards | “A Chronology of the Battle of the River Plate”（SIMILE 时间线；说明“描述多用交战双方的当地时区 GMT−2，时间轴标 GMT”） | 2016 | https://orlopdeck.net/BRP/Battle_of_the_River_Plate_timeline.html | 仅页面说明可读（XML 数据 403，无法取得） |
| `avalanche_werbaneth` | J. P. Werbaneth | “The Voyage of the Graf Spee, Part 2”, Golden Journal 43 | 2021 | https://www.avalanchepress.com/graf_spee_2.php | 旁证（Shakespeare 1103、McCall 对损伤的估计：船壳 8 处小洞 + 艏部 6×6 英尺洞） |

**未能获取的关键来源**：Admiralty Battle Summary（编号待证；未在线检索到 “No. 26” 的原件）、Exeter / Ajax / Achilles 舰长各自报告全文、Langsdorff 战报与 Graf Spee KTB 原文（BA-MA RM 97 / RM 8/1901）、Jurens, “Under the Guns: Battle Damage to Graf Spee”（*Warship 2018*）、Zimm 战术分析（*Warship 2018*）、Pope/Rasenack/Millington-Drake 全文。凡仅得二手者在表中已标明。

## 2. 钟表、时区、天气

### 2.1 各方时钟（结论）

| 时钟 | 与 UTC 关系 | 证据 |
|---|---|---|
| **英国舰队舰钟（Zone +2）** | UTC − 2 h（即“慢于格林尼治 2 小时”）| `harwood_despatch`：“All times throughout this report are in the time of Zone plus 2, except where otherwise stated”；`admiralty_1940`：“all the times given are the ships time kept by the Squadron. This was two hours slow on Greenwich Mean Time” |
| **德国 Graf Spee 舰钟** | **与英国舰钟相同（≈ UTC−2）**，两侧报告的绝对时刻互相吻合，差 ≤ 1–3 分钟 | ① 德方 OKM 调查报告：第一阶段 0617–0638（`kaack_2010`）↔ 英方 0618 开火/0637 GS 转向；② 德方 0552 见桅 ≈ 17 nm（`wiki_de_river_plate`）↔ 本研究用英方 0614 位置倒推得 0552 双方相距 17.1 nm（见 §6.3 检验）；③ GS 航海日志 “About 0634 the Exeter turned sharply away”（`usni_cambareri_1983`）↔ 英方 0632–0638 Exeter 转向；④ 日出 0556 与天文计算吻合（见下）。若德舰用 UTC−3，则所有德方时刻会晚整 1 小时，与 0614/0617 的同步观测矛盾 |
| 德国本土 MEZ | UTC + 1 h | = 舰钟 + 3 h（例：舰钟 0618 = 0818 GMT = 0918 MEZ） |
| 蒙得维的亚当地时间 | **UTC − 3 h**（乌拉圭 1923–1942 标准 UTC−3:30，1939-10-01 起夏令 +0:30，至 1940-03 止；`tzdb_southamerica`）| = 舰钟 − 1 h（例：舰钟 0010 = 当地 14 日 23:10 前一晚！）|
| 布宜诺斯艾利斯 | UTC − 3 h（1939 夏令）| = 舰钟 − 1 h |

→ **注意**：乌拉圭/阿根廷媒体若写“0:50”或“午夜”，多半是直接转引 Harwood 的舰钟时刻，并非当地钟；用当地钟则同一事件应早 1 小时。

### 2.2 日出、天气、海况

- 日出：**0556**（舰钟；`waters_1956`）。独立天文核算（34.5°S，49.2°W，12 月 13 日，含大气折射）≈ 07:58 UTC = 0558 舰钟 ✓。日落：**2048**（`admiralty_1940`、`waters_1956`）；Plate 口 54–56°W 天文日落 ≈ 2044–2049 ✓。
- 破晓：战斗岗位演练约 0500–0540；“with the last of the dawn”；0540 解除战位（`waters_1956`）。
- 天气：“fine and clear, with extreme visibility”；**东南风“fairly strong breeze”**，低涌浪同向（SE），“slight sea”；晴空无云（`admiralty_1940`、`waters_1956`、`atwill_1977`）。航迹图风向箭头指向 NW（风自 SE 来）✓。
- 能见度极佳（“extreme visibility”）：GS 控制塔在远距离清晰可见，便于尾随（`harwood_despatch` ¶41）。
- 当晚：落日后残照、20 余海里外低云与烟幕使目视困难（2200 后）；Achilles 转向南使 GS 轮廓衬于蒙得维的亚灯光（`admiralty_1940`）。

### 2.3 推荐叙事时钟

**推荐：以 Harwood 公文的“英国舰钟 Zone +2（UTC−2）”为唯一叙事时钟**，理由：(1) 公文/Admiralty/NZ 官方史全部使用；(2) 德方时刻与之同步（见上）；(3) 战役转场与航迹图 NID 刻度同钟。换算规则：

```
UTC          = 叙事时间 + 2 h
蒙得维的亚当地 = 叙事时间 − 1 h   （仅用于展示“当地时间”时）
MEZ（柏林）    = 叙事时间 + 3 h
JSON 中 "t": "1939-12-13T06:14" 即舰钟 0614；跨午夜事件写作 "1939-12-14T00:10"
```

## 3. 位置基准（摘要，详见 `battle_tracks.json` 与 §6）

| 项 | 内容 | 来源 / 置信度 |
|---|---|---|
| 0520 编队位置 | **34°34′S 49°17′W**（−34.567, −49.283），航向 060、14 节（Ajax 先导，Achilles、Exeter 依次） | `harwood_despatch` ¶9；高（Wikipedia EN 的 48°17′W 为笔误） |
| 地标旁证 | “距 Cape Santa Maria 正东 240 海里、距蒙得维的亚约 340 海里”；Admiralty 河口图注：“Pursuit of Graf Spee began 240 miles to eastward of Cape Santa Maria” | `waters_1956`、`admiralty_1940`；Santa Maria 角 34°40′S 54°09′W 以东 240′ ≈ 49°17′W ✓ |
| 0614 英舰位置（推算） | 由 0520 定位按 060°/14 节航行并计入 0520–0540 演练的净进度，≈ **34°28.5′S 49°05.5′W**（±3 nm） | 推算；中 |
| GS 首次发现时位置 | 航迹图相对 Ajax 方位 **319°、距 10.9 nm**（0614），与公文“smoke bearing 320”吻合 → ≈ 34°19′S 49°14′W | 推算；中 |
| 战斗区 | 34°S 49°W 附近，纵向约 25 海里；0800 时 FD “距首次发现点西北约 20 海里”（`waters_1956`） | 中 |
| 终点 | 蒙得维的亚外锚地（Rada exterior），≈ 34°55′S 56°13′W；2248 时 GS 在 Whistle Buoy 以东约 7 nm | 见 §6 |

## 4. 逐分钟叙事时间线（舰钟 Zone +2；日期 1939-12-13，除非注明）

置信度：H 高 / M 中 / L 低。“B”＝英方，“G”＝德方。

| # | 时间 | 事件 | 来源 | 置信 |
|---|---|---|---|---|
| 1 | 12-12 0700 | 三舰会合；Harwood 1200 发“policy”信号；1813 补充 ZMM 信号；晚间演练 | `harwood_despatch` ¶6–8 | H |
| 2 | 0500 | 破晓战位；Exeter 号手吹“Action Stations”（常规演练） | `atwill_1977` | M |
| 3 | 0520 | 编队位置 34°34′S 49°17′W；Harwood 利用“最后的曙光”演练机动信号 | `harwood_despatch` ¶9 | H |
| 4 | ~0520 | Exeter 军医：“Secure”约 0520 | `cussen_diary` | M |
| 5 | 0530 | （ES 维基称 GS 瞭望员此时见两根桅杆；多数来源作 0552）| `wiki_es_river_plate` | L |
| 6 | 0540 | 战位解除；舰队重组单列纵队 Ajax–Achilles–Exeter，航向 060（平均 NE by E 之字），14 节 | `waters_1956`、`harwood_despatch` ¶9 | H |
| 7 | **0552** | G：GS 瞭望员见桅顶（≈17 nm），Langsdorff 以为是护航船队（Highland Monarch 等）；0552 分辨出一艘重巡（Exeter）及两艘“驱逐舰” | `wiki_de_river_plate`（Konstam）、`wiki_es_river_plate`、Werbaneth | M |
| 8 | 0556 | 日出，晴空 | `waters_1956` | H |
| 9 | 0600 | G：“Klar Schiff zum Gefecht”；Langsdorff 命令提速（柴油机即时加速，至约 24 节），直接迎击 | `kaack_2010`、`wiki_de_river_plate` | M |
| 10 | **0614** | B：Ajax 瞭望发现烟，**方位 320**（“just abaft the port beam”）；Exeter 受命前出查看 | `harwood_despatch` ¶9；`admiralty_1940` | H |
| 11 | 0615 | Exeter 起转向 NW 前出（预定计划）；各舰进入战位，Achilles 升新西兰军旗 | `atwill_1977`、`waters_1956` | M |
| 12 | 0616 | Exeter 灯光信号：“I think it is a pocket battleship”；升 N 旗（敌在视） | `harwood_despatch` ¶9 | H |
| 13 | 0617–0618 | **GS 开火**：一座炮塔打 Exeter，另一座打 Ajax；首次齐射（3 发）落在 Exeter 前方约 300 码；射距约 19 800 码。G：OKM 第一阶段自 0617；B：0618 | `harwood_despatch`、`waters_1956`、`kaack_2010` | H（0618）|
| 14 | 0618 | FD（Ajax、Achilles）同时转 340° 缩短距离；Exeter 出列，转向西（初始约 280°）；全舰增速 | `harwood_despatch` ¶10 | H |
| 15 | 0620 | **Exeter 开火**（A、B 炮塔，射距 18 700 码≈9½ nm）| `harwood_despatch`、`waters_1956` | H |
| 16 | ~0622 | Exeter Y 炮塔可射击后开火（开火后约 2½ 分钟） | `admiralty_1940` | M |
| 17 | 0621 | **Achilles 开火** | `harwood_despatch` | H |
| 18 | 0623 | **Ajax 开火**；Ajax/Achilles 先“单舰射击”，约 0625 W/T 联络后转“集中射击” | `harwood_despatch` ¶10–12 | H |
| 19 | 0623 | GS 第三齐射夹叉 Exeter：一发在右舷舰中部近失，杀死右舷鱼雷发射管全组，毁通信、烟囱与探照灯，两架 Walrus 被弹片击毁，被手推下海；另有 2 人在 CPO 浴室阵亡 | `harwood_despatch` ¶14；`atwill_1977` | H |
| 20 | 0624 | Exeter 发射 8 次齐射后遭 28cm 直射弹命中：先有一发穿过 B 炮塔后甲板/病房出舷未爆；随即 **B 炮塔前部被命中**（炮塔与两门 8 英寸报废，炮塔内约 7–8 人阵亡），弹片扫过舰桥：除舰长与另两人外全部死伤，舵轮室通信被毁 | `harwood_despatch` ¶15；`atwill_1977` | H |
| 21 | 0624–0630 | Exeter 舰长 Bell 改由后部指挥位指挥，通信全断，改用传令链指挥后舵位；舰向右偏，鱼雷长 Lt Cdr C. J. Smith 自行下令拉回左舵；另受前部 2 发 28cm 命中（锚与前甲板炸裂；起火） | `harwood_despatch` ¶16；`atwill_1977` | H |
| 22 | ~0625 | Ajax/Achilles 与 Ajax 飞机 W/T 联络建立；转集中射击 | `harwood_despatch` ¶12 | M |
| 23 | 0630 | GS 将一座 28cm 塔转向 FD；副炮交替打 Ajax/Achilles（无效果）；Exeter 压力暂减 | `harwood_despatch` ¶18；`admiralty_1940` | H |
| 24 | ~0631 | Ajax 被 28cm 夹叉 3 次；FD 小幅转向规避 | `harwood_despatch` ¶18 | H |
| 25 | 0632 | **Exeter 右舷鱼雷**（局部控制）放出（转回西航向时）| `harwood_despatch` ¶21 | H |
| 26 | 0632–0634 | Admiralty 1940 称 GS 此时（约 0632）已 150° 向左转并施放烟幕，故 Exeter 鱼雷落空；Harwood 公文写作 **0637** 转向 | `admiralty_1940` vs `harwood_despatch` | 争议 |
| 27 | 0634 | FD 回转向左缩短距离；**敌情报告**由 Ajax 发出（0634，补充 0640/0646/0722）| `harwood_despatch` ¶10、¶20 | H |
| 28 | ~0634 | G：GS 日志“Exeter 重创后急转开去，仅一座炮塔还在射击，施烟幕暂时看不见” | `usni_cambareri_1983` | M |
| 29 | 0636 | FD 航速已达 28 节（14 节开始仅 20 分钟）| `admiralty_1940` | H |
| 30 | **0637** | GS 向左转约 150°，在烟幕下转向西北；**Ajax 弹射 Seafox**（Lt Lewin/Lt Kearney；X、Y 炮塔向前射击，飞机受炮口风冲击剧烈摆动）；FD 先转北再转西，暂失 A 弧 | `harwood_despatch` ¶19、¶21；`admiralty_1940` | H |
| 31 | ~0638 | **Exeter 大角度右转**，欲发射左舷鱼雷；转向中连中 2 发 28cm：一发击中 **A 炮塔**前装甲（A 塔报废）；另一发自左舷上甲板下入舰，穿两道舱壁在 CPO 平台爆炸，大火，4 英寸弹药库因水管破裂被淹；罗经复示器全毁，Bell 用小艇罗经 | `harwood_despatch` ¶22–23；`atwill_1977` | H |
| 32 | ~0638 | 28cm 弹同时穿越军械办公室与舰桥电报室（5 名电报员阵亡），在右 1 号 4 英寸炮炮管上爆炸，引燃备用弹药箱（Mid. Cameron、AB Gwilliam 将热弹抛海）| `atwill_1977`；`nh_kindell_casualties`（嘉奖词）| M |
| 33 | ~0640 | Seafox 观察员：“Exeter completely disappeared in smoke and flame … emerged and re-entered the action” | `admiralty_1940` | H |
| 34 | ~0643 | **Exeter 左舷鱼雷**发射（观察员/简报预期 0643；Admiralty：转向后“尽快”发射）；随后 Exeter 向 NE 靠拢 FD，约 0645 再转西 | `harwood_despatch` ¶22；`admiralty_1940` | M |
| 35 | **0640** | 28cm 直射弹在 Achilles 舰桥正横水面炸裂：弹片杀死 DCT 内 4 人（其中 2 名新西兰人；另 3 重伤），炮术长 Lt Washbourn 受伤震晕，Parry 舰长腿部轻伤、Chief Yeoman Martinson 受伤；ACP 接管；Parry 一度喊停火；数分钟后 DCT 恢复 | `harwood_despatch` ¶24；`waters_1956`；`nzhistory_battle` | H |
| 36 | ~0646 | Achilles 射击控制 W/T 失灵 → 改个别控制；此后约 20 分钟双舰射击无效（飞机把 Achilles 的短弹报告误作 Ajax，Ajax 越打越远） | `harwood_despatch` ¶24–25 | H |
| 37 | 0650 | Exeter 转向西；右倾约 7°，艏部多舱进水（艏楼下一发 28cm），仅 Y 塔局部控制射击，GS 对 Exeter 的炮弹落点偏远 | `harwood_despatch` ¶27 | H |
| 38 | 0654 | Seafox 首份空中观测报告 | `harwood_despatch` ¶19 | H |
| 39 | 0656 | FD 转向西北打开 A 弧；GS 频繁变向并自 0700 起大量施烟幕（含 chloro-sulphonic 装置与烟雾浮标）| `harwood_despatch` ¶26 | H |
| 40 | 0700 | Exeter 状态：仅 Y 塔、仅 1 门 4 英寸可射；无电话；舰桥、DCT、TS 毁；艏沉约 4 英尺；右倾约 8°；W/T 天线被毁 | `atwill_1977` | M |
| 41 | 0708–0710 | GS 距 FD 仍 16 000 码（约 8 nm）；Harwood 决定放弃 A 弧、转向西，Ajax/Achilles 全速接近 | `harwood_despatch` ¶28 | H |
| 42 | **0716** | GS 在烟幕下向左急转（直指受创 Exeter），4 分钟后又转 NW | `harwood_despatch` ¶29 | H |
| 43 | 0720 | GS 转向 NW、打开 A 弧，28cm 全部对 FD；Ajax 在 11 000 码被夹叉 3 次；副炮散乱偏高；FD 转右舷以使全炮可射；GS 舰中部起火 | `harwood_despatch` ¶29–30 | H |
| 44 | ~0722 | G：GS 欲射鱼雷齐射，但舰正急左转，仅发出 1 条 | `waters_1956`（引德方记述）| M |
| 45 | **0724** | **Ajax 右转，射出 4 条鱼雷（左舷管，9 000 码）**；GS 立即左转约 130°并施烟幕，3 分钟后恢复 NW | `harwood_despatch` ¶32；`admiralty_1940` | H |
| 46 | **0725** | **Ajax 被 28cm 延期引信弹命中**：自后上层建筑入舰，穿数间舱室与 X 炮塔座圈，爆于 Commodore 卧舱；弹底部件击中 Y 炮座卡死训练齿条 → **X、Y 塔同时报废**；X 塔 4 人阵亡 6 人伤（延迟 42 英尺）| `harwood_despatch` ¶31、¶93 | H |
| 47 | ~0725 | Seafox 飞近 GS 观察受创情况，受高炮射击后退出 | `admiralty_1940` | M |
| 48 | 0728 | FD 转 ~260° 继续逼近 | `harwood_despatch` ¶34 | H |
| 49 | ~0730 | Exeter Y 塔因进水失电，停止射击；Exeter 落后 | `harwood_despatch` ¶33；`atwill_1977` | H |
| 50 | 0731 | Seafox：“Torpedoes approaching, they will pass ahead of you.”；Harwood 转 180°（南）规避，令 Achilles 从 Ajax 尾后穿过 | `harwood_despatch` ¶34 | H |
| 51 | 0732 | GS 转西并大量施烟、之字航行；Achilles 射击“特别准确” | `harwood_despatch` ¶35 | H |
| 52 | 0736 | GS 转西南，所有火炮对 FD | `harwood_despatch` ¶35 | H |
| 53 | **0738** | 距离降至 **8 000 码**；传来 Ajax 弹药只剩 20%、仅 3 门炮可用（B 塔一座提弹机故障）的报告（后证实仅 A 塔） | `harwood_despatch` ¶36、¶38 | H |
| 54 | **0740** | Harwood 决定脱离日间战斗：Ajax/Achilles 在烟幕下转向东；同时 GS 一发末轮 28cm 打断 Ajax 主桅，天线被毁（数人伤）；**Exeter 转向东南低速退出**；GS 不追，约 0740 转向直指拉普拉塔，稳定航向约 270°，约 22–23 节 | `harwood_despatch` ¶36–39；`waters_1956` | H |
| 55 | 0746 | 脱离 6 分钟后 Harwood 再转西，令 Achilles 在 A 区（GS 右后）、Ajax 在 B 区（左后）尾随，距约 15 海里 | `harwood_despatch` ¶40 | H |
| 56 | 0800 | 状态：GS 西逃；Ajax 在其左后，Achilles 右后，各距约 15 nm；Exeter 已出视距；FD 约在首次发现点西北 20 海里处 | `admiralty_1940`；`waters_1956` | H |
| 57 | 0807 | Achilles 奉命播发 GS 位置/航向/航速（Ajax 天线未修复）；此后每小时由 Ajax 播发 | `harwood_despatch` ¶41 | H |
| 58 | 0814 | Exeter 已在东南方视距外，Harwood 令飞机通知其靠拢 | `waters_1956` | M |
| 59 | ~0900 | G：Langsdorff 巡视上甲板，评估 36 死 60 伤；决定去蒙得维的亚 | `kaack_2010` | M |
| 60 | 0910 | 飞机报告“Exeter is badly damaged, but is joining you as best she can” | `waters_1956` | M |
| 61 | **0912** | Ajax 回收 Seafox（升空共 2 小时 35 分）| `harwood_despatch` ¶42；`waters_1956` | H |
| 62 | 0930 | G：Langsdorff 召集军官，宣布去 Montevideo（IT 维基）| `wiki_it_river_plate` | L |
| 63 | 0946 | Harwood 令 Cumberland（福克兰）全速开往河口；其舰长 Fallowfield 已于 1200 自行出港 | `harwood_despatch` ¶43 | H |
| 64 | **1005** | Achilles 高估 GS 速度，接近至 23 000 码；GS 转向以前炮塔齐射两次 3 发（第一轮甚短，第二轮落于舷侧）；Achilles 在烟幕下全速转开 | `harwood_despatch` ¶43；`waters_1956` | H |
| 65 | 1017 | Harwood 向海军部报告 GS 情况（1700 再报）| `harwood_despatch` ¶41 | H |
| 66 | 1103–1104 | 发现一艘停车喷汽的商船，近 GS；数分钟后 GS 以战前呼号向 Ajax 发 W/T：“please pick up lifeboats of English steamer” | `harwood_despatch` ¶44 | H |
| 67 | ~1115 | Ajax 接近该商船：英轮 **Shakespeare**（5 029 GRT），救生艇仍吊在架上，答称无需援助；随即移向南翼 | `harwood_despatch` ¶44；`waters_1956` | H |
| 68 | 1105 | Exeter 信号：所有炮塔失能，艏部淹至 14 号隔舱壁，仍可航行 18 节；Harwood 令其以不伤隔舱壁的速度去福克兰 | `harwood_despatch` ¶44 | H |
| 69 | 1347 | Harwood 告知驻布宜诺斯艾利斯海军武官：GS 正直驶拉普拉塔 | `harwood_despatch` ¶44 | H |
| 70 | 1543 | Achilles：“Enemy in sight 297”，称疑似 8 英寸巡洋舰；1559 更正：英船 **Delane**（流线型烟囱似 Blücher 级）| `harwood_despatch` ¶45 | H |
| 71 | 1902 | Harwood 令 Achilles 若 GS 过 Lobos 以西则跟进；Ajax 去英国浅滩以南 | `harwood_despatch` ¶47 | H |
| 72 | **1915** | GS 转向并向 Ajax 两次齐射（约 26 000 码/13 nm）；Ajax 在烟幕中转开；第一轮短而在线，第二轮落于转向尾迹（另有来源作 1852）| `harwood_despatch` ¶46；`admiralty_1940` | H（1915）/争议 |
| 73 | 1942 | GS 大幅转向西北（Achilles 连续规避，未开火），Achilles 增速进入 | `waters_1956` | M |
| 74 | ~2000 | Ajax 在 Lobos 岛外（距 English Bank 约 50 nm）转向西南 | `waters_1956` | M |
| 75 | **2048** | 日落；GS 轮廓衬西天，距 Achilles 约 12½ nm；Achilles 转西北利用余晖 | `admiralty_1940` | H |
| 76 | 2055 | GS 在烟幕中转向，对 Achilles 三次齐射（22 000 码）；第三发很近；Achilles 回 5 次齐射并转避、施烟；位置刚过 Punta Negra；随后以 30 节转西 | `harwood_despatch` ¶48；`waters_1956` | H |
| 77 | ~2115 | 乌拉圭炮舰 *Uruguay* 靠近 Ajax，随后被抛下 | `harwood_despatch` ¶49 | H |
| 78 | 2126 | GS 再施烟幕；2132、2140、2143 对 Achilles 单发齐射（Achilles 不回射，以免暴露）| `harwood_despatch` ¶50；`admiralty_1940` | H |
| 79 | 2200–2202 | Achilles 已追到距 GS 5 海里；判断其将过英国浅滩北侧 | `harwood_despatch` ¶51 | H |
| 80 | 2213 | Achilles 转南使 GS 衬于蒙得维的亚灯光；GS 位于 Whistle Buoy 以东约 7 nm 时（2248）确认入港 | `waters_1956`；`admiralty_1940` | H |
| 81 | ~2230 | G：蒙得维的亚灯光入视；无引水员无拖船入港，由战俘商船船长引航 | `kaack_2010` | M |
| 82 | 2248 | GS 约在 Whistle Buoy 以东 7 nm | `admiralty_1940` | H |
| 83 | 2317 / 2350 | Harwood 令 Achilles/Ajax 脱离（Achilles 收到信号 2317；公文称 2350 下令撤出河口并划分巡逻区）| `waters_1956` vs `harwood_despatch` ¶52 | 争议 |
| 84 | 14-12 0010 / 0050 | **GS 在蒙得维的亚外锚地抛锚**：Admiralty 1940 “ten minutes past midnight”（与 EN 维基 00:10 一致）；Harwood 公文“0050”（El Observador 同）；德方“午夜”（Kaack）。推荐 **0010**（见 §7）| 见 §7 | M |
| 85 | 14-12 ~0330 | Langsdorff 上岸会见乌方 | `el_observador_2019` | M |

（以上 85 条；更精细的 Exeter/Ajax/Achilles 转向与 GS 每次转向已并入 `battle_tracks.json` 的 note 字段。）

## 5. 命中、伤亡与损伤（摘要）

### 5.1 Exeter（Capt F. S. Bell）
- 命中：约 **7 发 28cm** 直接命中 + 多次近失弹片（Wikipedia/多数来源；公文列举：B 塔、A 塔、舰中部/CPO 平台、艏楼、锚处等；Atwill：病房穿透 1、B 塔 1、艏部 2、A 塔 1、CPO 平台 1、军械室/电报室 1）。
- 效果：A、B 炮塔报废；舰桥、DCT、TS 毁；Walrus ×2 毁并抛海；右倾 7–8°，艏沉约 4 英尺；仅 Y 塔局部控制射至约 0730；返福克兰，**2 月后改道回国修理**。
- 伤亡：当日阵亡 **61**（含当日死伤员 DOW 共 61 人，据 Kindell 名单 13 日条目；其后又有 DOW 7 人，总计约 68）。官方 NZ 史：军官 5 + 士兵 56 阵亡，23 伤（`waters_1956`）；Cussen：“5 officers and 50 ratings dead, two missing, 82 wounded”（口径不同）。
- 抵达斯坦利港：12-16 正午（`waters_1956`）。

### 5.2 Ajax
- 1 发 28cm 延期弹（0725）使 X、Y 塔失能；1 发（0740）打断主桅并毁天线；7 阵亡（Kindell 名单 7 人），受伤约 15（1 军官 + 14 士兵）。
- 弹药：A 塔连续射击 81 分钟，约 300 发；全舰约 823 发 6 英寸（`waters_1956`，含“about 300 rounds out of a total of 823 rounds” 的表述，口径需谨慎）。

### 5.3 Achilles
- 近失弹片击中 DCT：4 阵亡（Grant、Milburn、Shaw、Stennett 均列 13 日），其他受伤；2 名新西兰籍；Washbourn 获 DSO。总伤：军官 2 + 士兵 7 伤（`waters_1956`）。
- 射击：>200 个齐射；X 塔 287 发（Sgt Saunders 报告）；各炮约 60–80 发后炮管复进迟滞。

### 5.4 Graf Spee（德方自述，经 `waters_1956` 引述）
- 命中：**2 发 8 英寸 + 18 发 6 英寸**（德方自计 20 发）；英方后期估计全日被命中“60–70 次”实为猜测。
- 伤亡：1 军官 + 35 水兵阵亡（共 36），60 伤（Kaack 同；其他来源 37 死 57 伤、36 死 58 伤、56 伤，口径不同）。
- 主要损伤：艏部大洞（6×6 英尺，水线上，因 15cm/20.3cm 弹）；燃油/润滑油净化设备（Treib- und Schmierölreinigungsanlage）失效；除司令厨房外所有厨房毁；面粉/给养舱进水；淡水设备毁；一架水上飞机毁（战前即不能用）；失去一座主炮测距仪、二门副炮；6 门 28cm 仍可用。
- 弹药：**28cm 剩余 306 发 ≈ 原基数 40%**（德方）；副炮 15cm 剩余 >50%。
- Langsdorff：受弹片轻伤，后在 0638–0700 之间被气浪掀倒昏迷数分钟（Kaack/Diggins）。

## 6. 推算方法与一致性（详见 `battle_tracks.json` 与脚本检验）

（本节将在 v2 中补充数字化方法、绝对定位推算、各时刻舰间距离对照与脚本输出。）

## 7. 争议点（已知）

1. **GS 抛锚时间**：0010（Admiralty 1940、EN 维基）／0050（Harwood 公文、El Observador）／午夜（Kaack 德方、IT 维基）。倾向 **0010 舰钟**（德方“2230 见灯→午夜抛锚”时间合理；Harwood 的 2350“撤出”与 0050 恰好一小时间隔，疑与 0010/2310 在转录中出现 40 分钟偏差；NZ 官方史 Achilles 2317 收到撤出信号、午夜后不久抛锚）。置信中。
2. **烟首次发现 0614 vs 0610**（Gregory 转写作 0610；EN 维基 06:10）：取 0614（公文、Admiralty、Waters）。
3. **GS 开火 0617 vs 0618**：德 0617，英 0618；Achilles 0621 vs 0622（Cambareri）。
4. **GS 150° 转向 0632 vs 0637**：Admiralty 1940 写 Exeter 鱼雷发射时 GS 已转向；公文写 0637。航迹图 GS 的 6.36 附近出现转向（6.36 刻度在东端回转点）。取：烟幕下 0632–0637 之间转向，主转向 0634–0637。
5. **FD 0656 转向**：公文“hauled round to the north-westward at 0656”，Admiralty 1940 称“altered course to starboard … bring all guns to bear”。
6. **1852 vs 1915**（GS 对 Ajax 的晚间齐射）：公文与 Waters 作 1915；Cambareri/Werbaneth 作 1852。取 1915。
7. **Exeter 伤亡数**：61（官方/Kindell 13 日）／64–68（含后来 DOW）／“5 官 50 兵 + 2 失踪 + 82 伤”（Cussen）。
8. **公文编号**：任务书写 38017，实为 37989。

---
（v1 完成；v2 将补：绝对航迹数字化、射击时段表、鱼雷/烟幕/飞机细节、脚本检验结果、更多 GS 命中细节、推荐叙事钟的使用示例。）
