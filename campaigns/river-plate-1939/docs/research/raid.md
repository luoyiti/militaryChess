# 斯佩伯爵海军上将号通商破坏航行与英法猎杀群（1939-08 → 1939-12）研究笔记

> 状态：v1（增量保存稿）。第 0–7 节为已核实内容；标注 `TODO` 的小节在后续版本补完。
> 机器可读数据见同目录 `raid_tracks.json`。
> 约定：坐标 `[lon,lat]`，西经/南纬为负，原始 DMS 与小数并列；时间一律注明时钟（GMT / 英舰 Zone+2 / 德舰 MEZ …）。

## 0. 来源表

| id | 作者 / 机构 | 题名 | 年 | 来源 | 支撑内容 |
|---|---|---|---|---|---|
| `harwood_despatch` | Rear-Adm H. H. Harwood | Despatch “The River Plate Battle”（提交海军部 1939-12-30） | 1947 | London Gazette **No. 37989**, supplement 17 Jun 1947（pub. 19 Jun 1947）；全文转录 naval-history.net/WW2LGGrafSpee.htm；PDF ibiblio.org/hyperwar/UN/UK/LondonGazette/37989.pdf | 哈伍德 12 月作战准备、集中命令、战术电文、0520 位置、时区 “Zone plus 2”。**纠正：任务简报写的 “No. 38017” 有误，本电文是 37989。** |
| `gazette_34815` / `gazette_34857` | London Gazette | 商船船长/报务员嘉奖词（Doric Star、Tairoa、Huntsman、Trevanion） | 1940-03-19 / 1940-05-24 | naval-history.net/WW2LGGrafSpee.htm | 各船被截击经过（RRR 电文、国旗、船员数） |
| `roskill_1954` | S. W. Roskill | *The War at Sea 1939–45*, vol. I “The Defensive”, ch. VI–VII（pp. 112–121, Table 6） | 1954 | archive.org `worldat-sea-1939-1945-vol-1`（OCR 全文） | 猎杀群表（Table 6）、巡航概要、哈伍德集中、增援 |
| `bs26` | Admiralty Naval Staff History | Battle Summary No. 26 “Action with the German Pocket Battleship *Admiral Graf Spee*” 的叙述（转载于 uboat.net 的 HMS Cumberland / HMS Renown 等条目） | 1946 | uboat.net/allies/warships/ship/1175.html, …/4066.html | 斯佩与“阿尔特马克”各次会合日期、各商船位置、英军逐日部署（哈伍德南美分舰队、K/H/X 部队） |
| `ktb_skl` | Seekriegsleitung | *War Diary, German Naval Staff Operations Division, Part A*, vols 1–4（Aug–Dec 1939；ONI 译本） | 1946 | archive.org `wardiarygermanna{1..4}1939germ` | 德方电文原文：26 Sep 授权、10 Oct / 22 Oct / 15 Nov / 2 Dec 电报、阿尔特马克会合线、Doric Star 后判断、13–20 Dec 电报 |
| `naval_history_net` | Gordon Smith / Don Kindell | *Naval Events* 1939 九–十二月逐日（Pt 1/2） | — | naval-history.net/xDKWW2-3909-06SEP01.htm … 3912-09DEC02.htm | 逐日英舰动态、猎杀群编成（Oct-14 附录）、12 Dec 部署表、13–17 Dec 增援 |
| `uboat_net_renown` | uboat.net | HMS Renown / Ark Royal / Cumberland 事件记录（据 ADM 53/199 航海日志） | — | uboat.net/allies/warships/ship/4066.html | K 部队逐日（含 4 Dec 0800 自开普敦起航往 28°S 15°W、17 Dec 抵里约） |
| `wiki_en_spee` / `wiki_de_spee` | Wikipedia EN/DE | *German cruiser Admiral Graf Spee* / *Admiral Graf Spee* | — | en/de.wikipedia.org | 概述、DE 版给出多艘商船位置（引 Bidlingmaier/Rasenack 系） |
| `wiki_en_clement` `wiki_en_africa_shell` `wiki_en_doric_star` `wiki_en_tairoa` | Wikipedia EN | 各船条目 | — | en.wikipedia.org | 船籍/船长/船员数/RRR 细节 |
| `maritimequest` | MaritimeQuest (H. Sochi / Gen. E. R. Dick) | Clement, Newton Beech, Ashlea, Huntsman, Trevanion, Tairoa, Streonshalh, Mapia 页 | 2008 | maritimequest.com/freighters | 船长姓名、船员数、转移日期、德方照片日期 |
| `fus_1939_v5` | US Dept of State | *FRUS 1939, vol. V (American Republics)*, ch. 7 docs 118–169；Declaration of Panama doc 60 | — | history.state.gov/historicaldocuments/frus1939v05/d60, d123, d139, d158–d160, d166–d167 | 中立安全区定义、12-15 美方提议、12-23 联合声明、丘吉尔 12-25 回电、英大使 12-27 谈话 |
| `navweaps_rp` | NavWeaps (Bigelow/Hawes/Leverett) | Orders of Battle – Battle of the River Plate（据 Rohwer & Hümmelchen） | 2017 | navweaps.com/index_oob/OOB_WWII_Atlantic/OOB_WWII_River-Plate.php | 猎杀群另一版本编成；增援到达预定 |
| `hmsajax_org` | HMS Ajax & River Plate Veterans Assoc. | Altmark / Graf Spee / Cumberland 页 | — | hmsajax.org | 阿尔特马克伪装 “Sogne/Oslo”、27 Nov & 6 Dec 会合与囚犯数 |
| `horodyski` | J. M. Horodyski | “Breakout of the Admiral Graf Spee”, Warfare History Network | — | warfarehistorynetwork.com/?p=19842 | 25–26 Sep 会合/电令的另一说法（仅作对照，未核原始） |

> 未能访问/未使用：nzhistory.govt.nz（403）、nzhistory.net.nz（域名已被垃圾站接管，内容不可用）、Pope 1956 / Millington-Drake 1964 / Bidlingmaier / Rasenack / Grove 2000 纸本（本稿未直接查阅；凡与之相关的说法均间接来自 Wikipedia DE 引注，置信度相应降低）。

---

## A. 斯佩号航程（1939-08-21 → 1939-12-13）

### A.1 时间线（要点）

| 日期 | 事件 | 来源 | 置信 |
|---|---|---|---|
| 5 Aug | “阿尔特马克”（Kpt Heinrich Dau，11,000 GRT 油轮，1939-08-14 入役）离德国前往美国 Port Arthur, Texas 装柴油（约 9,400 t）；名义货主往 Rotterdam | `ktb_skl`(KTB 5 Aug 条)；`hmsajax_org` | 高 |
| 19 Aug 0730 | 阿尔特马克报告“离开 Port Arthur 后开始回程，避开商船航线”；23 Aug 令其“前往预定等待海域”（加那利群岛西南） | `ktb_skl` | 高 |
| 21 Aug 2100 | 斯佩由 Wilhelmshaven 起航（舰长 KzS Hans Langsdorff）；经法罗–冰岛水道入大西洋；同日 Westerwald（供 Deutschland）22 Aug 离港 | `ktb_skl`、`roskill_1954`、`wiki_de_spee` | 高 |
| 28 Aug 1100 | 斯佩电报：位置“亚速尔群岛西北”，要求 1 Sep 在“会合线 II”与阿尔特马克会合 | `ktb_skl` | 高（位置仅为方位描述） |
| 1 Sep | 首次与阿尔特马克会合（加那利群岛西南 / 佛得角附近）；柴油补给；将多余物（数艘小艇、可燃油漆、2 门 2cm 高炮）移给阿尔特马克 | `wiki_en_spee`、`bs26`、`wiki_de_altmark` | 中（日期高，位置低） |
| 3–4 Sep | 英法宣战；柏林令斯佩/Deutschland“暂缓、后撤”（等待政治形势明朗约一周） | `ktb_skl` | 高 |
| 11 Sep | 斯佩舰载机（Arado Ar 196）发现英重巡 **Cumberland** 在约 30 浬外、成拦截航向（该舰正由 Freetown 驶 Rio，8 Sep 离 Freetown、15 Sep 抵 Rio）；用信号灯警告，斯佩与阿尔特马克高速东撤；Cumberland 未发现飞机 | `roskill_1954`、`bs26`、`hmsajax_org` | 高（事件）/低（位置） |
| 13 Sep, 20 Sep | 再次会合加油（BS26）；Horodyski 称 25 Sep 为“第二次会合”并收到电令 | `bs26` / `horodyski` | 中/低，**有争议** |
| 26 Sep | 柏林电令（1743/26、1822/26 无线电）：恢复对商船战，依《战利品法规》行动；对法国船禁令暂留至 10 月中旬 | `ktb_skl`、`roskill_1954` | 高 |
| 29 Sep 2330 | 斯佩报告：机器可用，重柴油“9?,500 t”，制冷用碳酸气和北极油仅够到 11 月底 | `ktb_skl` | 高 |
| 30 Sep | **Clement** 被截并击沉（见 B） | 多 | 高 |
| 5–10 Oct | Newton Beech(5)、Ashlea(7)、Huntsman(10) | 多 | 高 |
| 10 Oct | 斯佩向柏林报告：“六天内在方格 FN；拿获 HUNTSMAN，击沉 NEWTON BEECH 与 ASHLEA；船员已接收；用 Marconi 发报机仿英国程序，以‘带潜艇的袖珍战列舰’名义发出；前往 ALTMARK” | `ktb_skl` | 高 |
| 15–18 Oct | 与阿尔特马克会合（~16°S 17°W 一带）；16 Oct 拿获船 Huntsman 加入；17 Oct 沉 Huntsman；17–18 Oct 三船船员移交 | `bs26`、`wiki_de_spee`、`maritimequest` | 高（日期）/中（位置） |
| 22 Oct | **Trevanion** 被击沉；斯佩追击另一不明船 Nalon（失败） | `ktb_skl`、`naval_history_net` | 高 |
| 22 Oct | 斯佩报告剩余重柴油 8,000 t（≈初始 2/3），1 月需长期进坞，拟突破返德；下一步向阿尔特马克补给 | `ktb_skl` | 高 |
| 21–22 Oct | 柏林建议：若敌航母群集结使成果无望，可暂转印度洋（电报 1314/22） | `ktb_skl` | 高 |
| 28 Oct | 与阿尔特马克会合于 Tristan da Cunha 附近（Roskill：开普敦以西很远）；随后依柏林/本舰判断转入印度洋 | `bs26`、`roskill_1954` | 中 |
| ~3 Nov → 15 Nov | 在 Durban 周边航线“搜索十二天”，几无英船（航线已远离平时航线） | `ktb_skl`（15 Nov 报告） | 高 |
| 15 Nov | 击沉小油轮 **Africa Shell**（见 B）；斯佩报告“船载机已失修”；此后要求阿尔特马克把会合线 4 向东移 700 浬 | `ktb_skl` | 高 |
| 14/16 Nov | 拦停荷兰船（EN/Roskill/BS26：16 Nov **Mapia**；DE wiki：14 Nov 夜“Holland”）并放行 | 多 | **有争议**，见 B.3 |
| 17–26 Nov | 绕好望角回大西洋（EN wiki）；船员在舰桥加装假炮塔、在弹射器后加假烟囱 | `wiki_en_spee` | 中 |
| 27–29 Nov | 与阿尔特马克会合于 Tristan da Cunha 东北约 300 浬；27 个船长/高级船员（及伤员）回转至斯佩 | `bs26`、`roskill_1954`、`hmsajax_org`、`maritimequest` | 高（日期）/低（位置） |
| 30 Nov | SKL：由舰长自决继续作战或回程；若回程应在 12 月新月期（10–15 Dec）越过 Bahia–Freetown 狭口 | `ktb_skl` | 高 |
| 2 Dec | **Doric Star**（19°15'S 05°05'E）击沉；RRR 1530/2 GMT 被南大西洋总司令收到；斯佩同日报告“辅机基座发现裂纹”，将继续作战；SKL 预计 6 Dec 在圣赫勒拿西南千浬补给 | `ktb_skl`、`bs26` | 高 |
| 3 Dec | 05:18（雷达接触）**Tairoa**（20°20'S 03°05'E）；另有“不明船”0500 GMT RRR 在 Doric 位置西南 170 浬 | `wiki_en_tairoa`、`naval_history_net`、`harwood_despatch` | 高 |
| 6 Dec | 第 9 次、最后一次加油；移交约 140 名囚犯（Doric Star+Tairoa）；英方事后据战俘供词报告会合点 **23°S 26°W** | `ktb_skl`(16 Dec)、`wiki_de_spee`、`hmsajax_org` | 中 |
| 6 Dec 黄昏 | 对阿尔特马克做探照灯演练时发现一艘无灯船（挪威货轮），斯佩未拦截，该船即以短波电告伦敦 | `wiki_de_spee` | 中 |
| 7 Dec 傍晚 | 拿获并击沉 **Streonshalh**（25°01'S 27°50'W），缴获蒙得维的亚—南大西洋航运资料和 Cumberland 11-09 新涂装照片；船员全留舰上 | `maritimequest`、`wiki_en_spee` | 高 |
| 7→13 Dec | 径向拉普拉塔河口；Arado 于 11/12 Dec 故障无法修复，伪装物同时拆除 | `wiki_en_spee`(12 Dec)/`wiki_es`(11 Dec) | 中（日期有 1 日分歧） |
| 13 Dec | 战斗（另有分工，不在本稿）；1305 向阿尔特马克发“Independent”；1937 报“15 发命中，厨房与存粮被毁，进蒙得维的亚” | `ktb_skl`、`harwood_despatch` | 高 |

### A.2 路线与“会合线”机制
- SKL 与斯佩事先编制“会合线 (rendezvous line) 1…4”，用无线电静默+预设坐标线约会，无需电报定位。已见的调整：约 26 Oct 斯佩令阿尔特马克把会合线 2 向西移 600 浬；15 Nov 令把会合线 4 向东移 700 浬。（`ktb_skl`）
- 斯佩 13 Dec 前的补给次数：官方 DE wiki 记 6 Dec 为“第九次也是最后一次”加油（1 Sep, 11 Sep, 13 Sep, 20 Sep?, 15–18 Oct, 28 Oct, 27–29 Nov, 6 Dec … 与 BS26 的清单约略吻合）。

### A.3 伪装与名称
- 在被截击商船眼里：接近时挂**法国商船旗/法国国旗**，在约 1–2 链处降下并升纳粹战旗（Huntsman、Trevanion、Newton Beech）。
- Clement 后以“Admiral Scheer”呼号发电，故英方起初以为是 Scheer。
- 十月份用 Marconi 机仿英国式“潜艇袭击”报文（S-S-S-S/T-T-T-T）并报假经纬度与“Newton Beech”名（Huntsman 事件）。
- 12 月 Doric Star、Tairoa 见到的是**加装假第二烟囱和假炮塔**的斯佩，粗略似 *Renown/Repulse*，舰上自称 *Deutschland*（Gazette 嘉奖词）。
- 12 Dec（或 11 Dec）后，伪装物拆除以免妨碍战斗。
- 舰载机：Arado 196（备机 1，搭载于舰中央弹射器）。11 Sep 侦察 Cumberland；30 Sep 对 Clement 扫射；22 Oct 发现 Trevanion；15 Nov 电报称“船载机失修”（11 月稍修复；2 Dec 又用于发现 Doric Star）；11/12 Dec 彻底故障，战斗时不可用。

### A.4 TODO
- 逐日位置表见 raid_tracks.json（`graf_spee`）；markdown 版另列于附录 A.5。

---

（以下各节将在后续版本完善：B 商船表、C 阿尔特马克、D 猎杀群及各舰航迹、E 哈伍德部署、F 泛美安全区、G 海域控制区建议、争议点汇总）
