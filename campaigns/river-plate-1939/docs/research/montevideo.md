# 蒙得维的亚与余波（1939-12-14 → 12-21）研究笔记

> 研究代理：MONTEVIDEO & AFTERMATH。本文件为**增量版本 1**（先写已核实内容，随后在同一文件内补充）。
> 约定：坐标 `[lon, lat]`，西、南为负；每条事实标来源 id；时间一律注明时钟。置信度：高/中/低。
> 标有「(经搜索摘要，未直接取得原文)」的条目是通过搜索引擎摘要得到的二手转述，后续需核对原件。

---

## 0. 本轮最重要的发现（先看这里）

1. **自沉时刻：蒙得维的亚当地时间约 19:54–19:55，而不是常见的 “20:54 / 20:55”。**
   - 哈伍德战报（`harwood_despatch`，“All times throughout this report are in the time of **Zone plus 2**”）：阿贾克斯号舰载机 **2054** 报告 “GRAF SPEE has blown herself up”。Zone +2 即 GMT−2，所以 2054 Z+2 = 22:54 GMT。
   - 美国驻乌公使威尔逊的电报（`frus_1939_v5` d138）：“Graf Spee blown up **7:55 o’clock**, 7 miles off shore, both magazine groups exploded”；该电报在华盛顿收到时间为 12 月 17 日 **6:30 p.m.**（EST，UTC−5 = 23:30 GMT = 当地 20:30）。若爆炸在当地 20:55，则爆炸发生在电报被收到之后，不可能。因此当地时间 19:55 成立。
   - 《伦敦新闻画报》(ILN)：“7.55 p.m. (local time)”(经搜索摘要)；德文维基：“19:52 Uhr”（`wiki_de_ags`）；蒙得维的亚日落约 19:5x（需另算）。
   - 结论：**英军 Zone+2 的 20:54 = 当地 19:54（UTC−3）= 22:54 GMT = 柏林 MEZ 23:54**。维基英文 / kbismarck / 许多网站写的 “20:55 / 2055” 是把英国舰上时间误当成当地时间。置信度：**高**。
2. **乌拉圭最后通牒的截止是“当地时间 17 日 20:00”**（`frus_1939_v5` d133：“leave by 8 o’clock tomorrow night or be interned”）。自沉发生在截止前约 5 分钟。德军日志中朗斯多夫写下的“17 日 2000 时退役”（海军协会网页引用，Bordzeit）与此吻合。
3. **离港时间有分歧**：哈伍德写 “left harbour at 1815”（Zone+2 = 当地 17:15？），但德文维基 18:15、NZHistory 6.17 pm、UP 电讯“18.19”、Trove 报道“比最后通牒到期早 101 分钟起锚”(=18:19)(后三者经搜索摘要) 都指向**当地 18:15–18:19**。我倾向：哈伍德此处引用的是岸上报告的当地时间（未换算），**离开防波堤约 18:15–18:20 当地**（中）。从离港到爆炸约 1 h 35 min。
4. **英方时钟 = Zone +2 (UTC−2)**；乌拉圭、阿根廷 1939-12 都是夏令时 UTC−3（tzdata，见 §1）；德国 MEZ = UTC+1；英国本土 GMT。哈伍德战报以 Zone+2 书写——这与 13 日海战各方时间的对齐问题直接相关（战斗研究员需注意）。
5. **柏林指示全文已找到**（`fuehrer_conf_161239`）：12 月 16 日 13:00 雷德尔向希特勒报告；17:07 发出无线电 1347/16（“不得在乌拉圭被拘留；若自沉，须设法有效破坏”）；12 月 17 日 00:40 再发 2239/16 重申。
6. 哈伍德战报的刊登期号：我取到的是 **London Gazette 37989**（增刊，1947-06-19 出版，封面日期 “of Tuesday the 17th of June 1947”，pp.2759–2766）。简报写的 “38017” 我未能核实，请其他研究员以 37989 为准或再核。

---

## 1. 时钟与换算（必读）

| 时钟 | 与 UTC | 说明 | 依据 |
|---|---|---|---|
| **LT** 蒙得维的亚 / 布宜诺斯艾利斯当地时间 | UTC−3 | 乌拉圭自 1939-10-01 起夏令（标准时为 UTC−3:30，夏令后合 UTC−3）；阿根廷自 1939-11-01 起夏令（标准 UTC−4 → UTC−3）。两地 12 月同为 UTC−3 | `tzdata`（本机 zdump 输出）；威尔逊电报算术验证 |
| **Z+2** 英国皇家海军舰上时间（哈伍德战报） | UTC−2 | GMT = 舰上时间 + 2 h；**LT = Z+2 − 1 h** | `harwood_despatch` 开头 |
| **MEZ** 柏林 | UTC+1 | 冬令；**MEZ = LT + 4 h** | 标准 |
| **GMT** 伦敦 | UTC+0 | 英国夏令时 1939-11-19 结束 | 标准（需核对日期） |
| **EST** 华盛顿 | UTC−5 | | FRUS 电报“received”时间 |
| 德舰 “Bordzeit” | 未定 | 迹象：港内几日大概率用当地 UTC−3（德文维基 19:52 / 18:15）；13 日海战当天德方记载的时刻与英方 Z+2 几乎重合，说明战斗时间要么被统一成英方时间，要么德舰当时也用 UTC−2。**待战斗研究员定论** | `wiki_de_ags`、`kbismarck_gs` |

换算速查（LT → 其他）：LT 19:55 = Z+2 20:55（注意：英方实际记 2054）= 22:55 GMT = MEZ 23:55 = EST 17:55。

---

## 2. 来源表

| id | 作者 / 标题 | 年 | URL | 支撑 |
|---|---|---|---|---|
| `harwood_despatch` | H. H. Harwood, “The River Plate Battle”（战报，1939-12-30 呈交），London Gazette 增刊 37989, 1947-06-19, pp.2759–2766 | 1947 | https://thegazette.co.uk/London/issue/37989/supplement/2759/data.pdf （…/2763/、/2764/ 等） | 英方一手：Zone+2；12-14…17 日调度；Ashworth、Dunster Grange 出港；Tacoma 转移；2054 爆炸报告；晋升信号 |
| `frus_1939_v5` | *Foreign Relations of the United States, 1939, vol. V (The American Republics)*, docs 118–169（Wilson、Armour、Caffery、Bowers、Hull 往来电报） | 1957 | https://history.state.gov/historicaldocuments/frus1939v05/d121 …d165 | 美方一手：到港、48/72 h、17 日 20:00 截止、7:55 爆炸、坦科马、1,040 人、泛美声明时间 |
| `fuehrer_conf_161239` | “Report of the Commander in Chief, Navy, to the Fuehrer on 16 December 1939, at 1300”，*Fuehrer Conferences on Matters Dealing with the German Navy 1939*（ONI 译本 / Brassey’s） | 1948/1990 | https://kbismarck.com/fuhrer-conference-16-12-39.html | 德方一手：朗斯多夫电文、雷德尔回电全文与发送时间 |
| `wiki_de_ags` | de.wikipedia “Admiral Graf Spee”（引用 ADAP D VIII 朗曼电报） | — | https://de.wikipedia.org/wiki/Admiral_Graf_Spee | 18:15 离港、19:52 爆炸、朗曼 12-16 09:00 / 12-22 电报 |
| `wiki_en_river_plate` | en.wikipedia “Battle of the River Plate”（引 Millington-Drake 1965 pp.226–228；Landsborough 2016；Woodman 2008） | — | https://en.wikipedia.org/wiki/Battle_of_the_River_Plate | 概述、伤亡表、德方 61 名俘虏被释放 |
| `wiki_en_ags` | en.wikipedia “German cruiser Admiral Graf Spee” | — | https://en.wikipedia.org/wiki/German_cruiser_Admiral_Graf_Spee | 残骸坐标 34°58′18″S 56°17′54″W、20:55、水深、俘虏 6+9+25+21 |
| `wiki_en_langsdorff` | en.wikipedia “Hans Langsdorff”（引 Pope 1987 p.194） | — | https://en.wikipedia.org/wiki/Hans_Langsdorff | 20 Dec 自杀、Chacarita 墓地、11 日信件 |
| `wiki_es_ags` | es.wikipedia “Admiral Graf Spee” | — | https://es.wikipedia.org/wiki/Admiral_Graf_Spee | 西语书目：Campos 2002、Aguiar Godiño 2002、Darnau 1989、Leicht 2009、Medina Soca 1969 |
| `kbismarck_gs` | José M. Rico, “The Admiral Graf Spee” 年表 | 2019 | https://kbismarck.com/graf-spee.html | 袭击年表、指挥官名单、2055/34°58′18″S 56°17′57″W |
| `nh_kindell_1939_12` | Don Kindell, “Naval Events, December 1939” Part 1/2 (naval-history.net) | — | https://naval-history.net/xDKWW2-3912-09DEC01.htm 、…DEC02.htm | 各分舰队动向：Cumberland 2200/14、Dorsetshire、Shropshire、Ark Royal/Renown 抵里约 17 日 等 |
| `navweaps_oob` | NavWeaps “Orders of Battle — Battle of the River Plate” | — | https://navweaps.com/index_oob/OOB_WWII_Atlantic/OOB_WWII_River-Plate.php | 5 Oct 猎杀群 F–Y；援军态势；伤亡 |
| `hmsajax_langsdorff` | HMS Ajax & River Plate Veterans Association “Kapitän zur See Hans Langsdorff” | 2019 | https://www.hmsajax.org/captain-hans-langsdorff | 14 日下午释放俘虏；15 日葬礼；花圈铭文；1055 人；Hotel de Inmigrantes；家庭信息 |
| `wiki_en_dove` | en.wikipedia “Patrick Dove (sea captain)” | — | https://en.wikipedia.org/wiki/Patrick_Dove_(sea_captain) | 多夫生平；Africa Shell 15 Nov 1939 被俘 |
| `time_1940` | *Time* “World War: Voluntary Elimination” | 1940-01 | https://time.com/archive/6762642/world-war-voluntary-elimination/ | 1,039 人拘禁、朗斯多夫最后两日 |
| `ww2diario_blog` | “Diario de guerra”（西语纳粹视角博客，二手，转述当时报刊） | 2009 | http://ww2diario.blogspot.com/2009/12/ | 61/62 名俘虏构成、15 日葬礼人数、致大使信件文本（**二手，仅作线索**） |
| `tzdata` | IANA tz database（本机 zdump） | — | — | 乌拉圭 / 阿根廷 1939 夏令 |
| `gub_uy_archivo` | 乌拉圭教科文部档案目录 “Archivo Acorazado Admiral Graf von Spee / Vapor Tacoma” | 2025 | https://www.gub.uy/ministerio-educacion-cultura/sites/ministerio-educacion-cultura/files/2025-11/GRAF%20SPEE%20y%20TACOMA.pdf | 12-30 令 Tacoma 为辅助船；1940-01-23 拘禁令；乘员名册（目录级信息） |
| *(经搜索摘要)* `maritimequest` `paperspast` `silverfox175` | MaritimeQuest 每日事件页；Papers Past（Auckland Star 1939-12-21/23）；silverfox175 博客 | — | maritimequest.com/daily_event_archive/2005/dec/17_admiral_graf_spee.htm ；paperspast.natlib.govt.nz/newspapers/AS19391221.2.53 | 离港≈18:30、一座“Tacoma”转乘阿根廷拖船、领海内争议、葬礼与波廷杰（均为二手摘要） |
| *(经搜索摘要，未取得原文)* `elobservador_2019` | El Observador (UY), “El Graf Spee en la trampa de Montevideo”, 2019-12-24 | 2019 | https://www.elobservador.com.uy/nota/el-graf-spee-en-la-trampa-de-montevideo-201912231730 | 15 日 36 具遗体由 320 名同伴、乌海军与警察护送至 Cementerio del Norte |
| *(同上)* `usni_1949` | USNI *Proceedings* 1949-04 “Discussions, Comments and Notes”（读者来信，转引 ONI 译本） | 1949 | https://www.usni.org/magazines/proceedings/1949/april/discussions-comments-and-notes | 同一批电报（与 `fuehrer_conf_161239` 互证） |
| *(同上)* `iln_1939` | *Illustrated London News* 1939-12-30，“7.55 p.m. (local time)” | 1939 | https://images.ourontario.ca/ajax/2305394/page/3 | 当地 7.55 pm |
| *(同上)* `up_chile_1939` | United Press 电讯，智利报纸（prensahistorica.udec.cl） | 1939 | https://prensahistorica.udec.cl/bitstreams/2551705f-4150-49bc-9cd3-9fa20c1eaf2d/download | 离港“18.19”；1 号锚 17.10 起；大爆炸标“20.50” |
| *(书，未直接查阅)* `millington_drake_1964` | E. Millington-Drake, *The Drama of Graf Spee and the Battle of the Plate*, Peter Davies | 1964 | — | 外交主线（经 `wiki_en_river_plate` 转引 pp.226–228） |
| *(书，未直接查阅)* `pope_1956` | Dudley Pope, *The Battle of the River Plate*（英国版 1956；美国版书名 *Graf Spee*）| 1956 | — | 通行叙事；时间多沿用英方舰上时间 |
| *(书)* `grove_2000` | Eric Grove, *The Price of Disobedience* | 2000 | — | 反思；Wikipedia 转引 |
| *(书)* `uruguay_antecedentes_1940` | Uruguay, Ministerio de Relaciones Exteriores, *Antecedentes relativos al hundimiento del acorazado “Admiral Graf Spee” y a la internación del barco mercante “Tacoma”*, Montevideo, El Siglo Ilustrado | 1940 | （FRUS d121 注释引用；英文版 “Uruguayan Blue Book”, Hutchinson） | 乌方官方文献汇编，**应优先找原件** |
| *(书)* `adap_d_viii` | *Akten zur Deutschen Auswärtigen Politik 1918–1945*, Serie D, Bd. VIII (1961)；英译 *DGFP D VIII* | — | archive.org 有受限借阅版 | 朗曼电报 M 7007，p.427、p.441 |

---

## 3. 时间线（按 LT 排序；括号内给出其他时钟）

### 3.1 13 日夜 → 14 日：入港与首日

| 时间 | 事件 | 来源 | 置信 |
|---|---|---|---|
| 13 Dec 23:50 LT（= 0050 Z+2, 14 Dec；02:50 GMT） | 斯佩在英格利希浅滩（English Bank）以北通过，**锚泊于蒙得维的亚外锚地 (Montevideo roads / ante-port)**；威尔逊称“about midnight”；阿贾克斯、阿喀琉斯尾随至领海边缘 | `harwood_despatch` ¶51；`frus_1939_v5` d121 | 高 |
| 14 Dec 上午（LT） | 威尔逊亲赴现场：斯佩距岸约 **200 码**；阵亡 36、舰上伤员 48；已有 1 名伤员送入军医院；乌方海事当局口头允许 **48 小时**，可因修理延长（乌拉圭法律不区分战损与自然损伤）；美国国务院法律顾问 Hackworth 认为国际法仅 24 小时 | `frus_1939_v5` d121、d122 | 高 |
| 14 Dec 下午（LT） | 朗斯多夫释放英国商船俘虏，交给英国领事（`hmsajax_langsdorff`：“afternoon of 14 December”）。人数：**61**（6 名船长 + 9 名轮机长 + 25 名高级船员 + 21 名水手，`wiki_en_ags`）或 **62**（博客写 26 名军官）。|`wiki_en_ags`；`hmsajax_langsdorff`；`ww2diario_blog` | 中（人数）/高（日期） |
| 14 Dec | 英国公使米林顿-德雷克正式要求乌方：若斯佩逗留超过 24 小时则予以扣留，理由是舰仍适航（经搜索摘要，转自 Wikipedia 类文本） | `wiki_en_ags`（搜索摘要） | 中 |
| 14 Dec | 哈伍德请公使“用一切办法拖延斯佩出航”，建议**让英国船只出港，援引 24 小时规则** | `harwood_despatch` ¶53 | 高 |
| 14 Dec 21:00 LT（= 2200 Z+2） | **“坎伯兰”号**从福克兰航行 34 小时抵普拉塔河口，与阿贾克斯、阿喀琉斯会合 | `harwood_despatch` ¶55；`nh_kindell_1939_12` | 高 |
| 15 Dec（巴西外长 Aranha 12-15 向美国大使透露） | 乌拉圭政府决定就如何处置斯佩，在《巴拿马宣言》框架内同美、巴、阿三国政府协商 | `frus_1939_v5` d124 | 高 |

### 3.2 15 日（周五）

| 时间 | 事件 | 来源 | 置信 |
|---|---|---|---|
| 15 Dec 上午（LT） | **葬礼**：36 具遗体由斯佩登陆，葬于**北公墓 (Cementerio del Norte)**，有德水手约 320 人、乌拉圭海军学员与警察列队护送；朗斯多夫行传统海军礼，旁人行纳粹礼；英国商船船长们献花圈（铭文：“To the memory of brave men of the sea from their comrades of the British Merchant Service”） | `harwood_despatch` ¶59（“landed a funeral party this morning”）；`hmsajax_langsdorff`；`elobservador_2019`（摘要） | 高（日期）/中（人数） |
| 15 Dec | 哈伍德得知斯佩“被准许延期至 **72 小时**”；斯佩中弹 60–70 发 | `harwood_despatch` ¶59 | 高 |
| 15 Dec **1900**（哈伍德原文；若为 Z+2 则 = 18:00 LT；若为岸上报告的当地时间则 = 19:00 LT，**时钟存疑**） | 英国船 **Ashworth** 驶出蒙得维的亚；斯佩“接受”此后 24 小时内不得出港（海牙第十三公约第 16 条） | `harwood_despatch` ¶59 | 高（事实）/低（时钟） |
| 15 Dec 时间组 1135/15（时钟未注） | 哈伍德发出政策信号：“My object destruction…”；让 Cumberland 白天在蒙得维的亚外露面 | `harwood_despatch` ¶57 | 高 |
| 15 Dec | 阿贾克斯从 Olynthus 加油 200 吨（缆绳在恶劣天气中断裂）；12-17 Achilles 再加油 | `harwood_despatch` ¶58、¶69；`wiki_en_river_plate` | 高 |
| 15 Dec | 美国务院发出泛美联合声明草案（circular 15 Dec 1 p.m.）；巴西外长 Aranha 提议“拘禁至战争结束” | `frus_1939_v5` d124、d125、d127 | 高 |

### 3.3 16 日（周六）

| 时间 | 事件 | 来源 | 置信 |
|---|---|---|---|
| 16 Dec 约 01:00（时钟未注） | 朗斯多夫发电报给海军总部，建议“出到中立海界为止，如可能杀向布宜诺斯艾利斯”；请求决定是否自沉或拘禁 | `wiki_de_ags`（“nachts um 1 Uhr”）；`fuehrer_conf_161239` | 中 |
| 16 Dec 09:00 | **朗曼（德国公使）致外交部电 (ADAP D VIII M 7007, p.427)**：优势重兵已由舰上确认，突围回国无望；14 天宽限也无济于事；与海军武官一致认为**拘禁是最糟方案，哪怕在浅水的拉普拉塔河中炸沉并拘禁舰员也优先**；理由弹药耗尽；乌总统“私下希望德潜艇尽快来炸破英国封锁” | `wiki_de_ags`（转引 ADAP） | 中（原文未直接看到） |
| 16 Dec 00:30 Z+2 | 英国舰队在 San Antonio 外海汇合；阿贾克斯清晨放飞机侦察港口，**在 Whistle Buoy 附近遭射击**；08:30 回航；英方一度以为斯佩要趁雾突围 | `harwood_despatch` ¶60–62 | 高 |
| 16 Dec 02:19 Z+2 | 海军部电 0219/16：哈伍德可在**三海里线以外任何地方**与斯佩交战 | `harwood_despatch` ¶63 | 高 |
| 16 Dec 13:00 MEZ（= 09:00 LT） | **雷德尔向希特勒汇报**（在场：约德尔少将、普特卡默中校）：斯佩至少需两周才适航，乌拉圭只给 72 小时；乌拉圭“不可靠、无力捍卫中立”，**在蒙得维的亚拘禁不可考虑**；可考虑突入较强的阿根廷；希特勒同意 | `fuehrer_conf_161239` | **高** |
| 16 Dec 15:00 起 LT | 乌外长 **瓜尼 (Guani)** 与德公使朗曼谈话 3 小时：要求德方保证斯佩“在 20:00 前离开或接受拘禁”，朗曼拒绝；瓜尼愿向总统提议由海军专家委员会再检查，但须德方预先承诺接受结论，被拒 | `frus_1939_v5` d133 | 高 |
| 16 Dec **1700**（哈伍德原文；Z+2 = 16:00 LT，或当地 17:00 LT，时钟存疑） | 英国船 **Dunster Grange** 出港，英方再次要求“延长斯佩等待期”；同时传闻修理“进展极快” | `harwood_despatch` ¶66 | 高 |
| 16 Dec 17:07 MEZ（= 13:07 LT） | **雷德尔无线电 1347/16 发往斯佩**：(1) 尽一切办法争取延长在中立水域的时间；(2) 同意突围至布宜诺斯艾利斯之建议；(3) **不得在乌拉圭被拘禁**；如自沉，**设法有效破坏** | `fuehrer_conf_161239` | **高** |
| 16 Dec 时间组 1615/16 | 哈伍德对各舰发出“Appreciation”：不在 Whistle Buoy 附近动手（政治上不可行）；用 Cumberland 机侦察 | `harwood_despatch` ¶65 | 高 |
| 16 Dec 海军秘书信号时间组 1717/16（哈伍德于“dog watches”即 16–20 时间收到） | 哈伍德得知：**晋升海军少将（自 13 Dec 起）**、KCB；帕里、伍德豪斯、贝尔三位舰长获 CB（战报原文：“honours … bestowed”）。哈伍德当晚向各舰通报 | `harwood_despatch` ¶67 | 高 |
| 16 Dec 21:00 LT | 瓜尼召见威尔逊：英国公使一天内多次到访，坚持不得延期；英方抗议斯佩向阿贾克斯飞机开了一发高射炮（瓜尼斥为荒谬）；瓜尼郑重告知美方：若 17 日 20:00 前斯佩既未离去又拒绝拘禁，乌拉圭**没有军事力量强制拘禁**，也将通知阿、巴 | `frus_1939_v5` d133 | 高 |
| 17 Dec 00:40 MEZ（= 16 Dec 20:40 LT） | **雷德尔无线电 2239/16**：“公使报告无法延长期限，故 1347/16 第 2、3 项继续有效。” | `fuehrer_conf_161239` | **高** |

### 3.4 17 日（周日）——离港与自沉

| 时间（LT） | 事件 | 来源 | 置信 |
|---|---|---|---|
| 17 Dec 白天 | 德方销毁机密设备（测距仪、雷达“Seetakt”等）、弹药分散布置爆破装药；舰钟、军旗等运上岸；借来的焊接设备全部退还（上午） | `harwood_despatch` ¶70；`maritimequest`（搜索摘要） | 中 |
| 14:40 LT（= 1540 Z+2） | 英方获信号：斯佩正向德国货船 **Tacoma**（8,268 GRT，德国货轮；船公司待核）转移 300–400 人 | `harwood_despatch` ¶71 | 高（若 Z+2；若引用岸上报告则 15:40） |
| 16:20 LT（= 1720 Z+2） | 已有 **700 余人**连同行李、部分补给转移；有迹象表明斯佩要自沉 | 同上 | 同上 |
| 约 17:05–17:10 LT | 开始起锚；一号锚离底（UP 电讯，“17.05/17.10”）| `up_chile_1939`（搜索摘要） | 低 |
| **约 18:15–18:20 LT** | **斯佩离港**，缓缓向西/西南驶出；Tacoma 随后。哈伍德：“left harbour at 1815”；德文维基 18:15；NZHistory 6.17 pm；UP 18.19；Trove “比最后通牒到期早 101 分钟”（=18:19）。英舰队同时驶向 Whistle Buoy 并增速至 25 节 | `harwood_despatch` ¶72；`wiki_de_ags`；其余摘要 | 中 |
| 18:30 起 | 约 20 万～50 万人聚集海岸观看（数字差异极大，见 §9） | 多源 | 低 |
| 离港后（时间未见记载） | 斯佩在蒙得维的亚西南约 **6–7 海里**的浅水处抛锚（哈伍德：“some six miles south-west of Montevideo”；威尔逊：“7 miles off shore”；ILN：“five miles off”）。Tacoma 靠近，舰员（德方各源：约 900–1,000 人，其中约 40–43 人留舰）转乘 Tacoma 与随后到达的**阿根廷拖船（含 Gigante、Coloso）和驳船**；Tacoma 随后被乌海军押回蒙得维的亚，4 名最后离舰者由其救起并被乌方扣押 | `harwood_despatch`；`frus_1939_v5` d140；`wiki_en_ags` | 高（总框架）/中（细节） |
| **19:54–19:55 LT**（= 2054 Z+2） | **自沉爆炸**，两个弹药库组先后爆炸；阿贾克斯机报 “GRAF SPEE has blown herself up”；英舰队其后近距（约 4 nm）通过，见其“从头到尾燃烧，火焰几乎高达指挥塔顶” | `harwood_despatch` ¶74–76；`frus_1939_v5` d138；`iln_1939` | **高** |
| 20:00 LT | 乌拉圭最后通牒截止 | `frus_1939_v5` d133 | 高 |
| 20:00（Bordzeit） | 朗斯多夫要求记入航海日志：“Admiral Graf Spee 于 1939 年 12 月 17 日 20:00 退役”(经 hmsajax 页面引用) | `hmsajax_langsdorff` | 中 |
| 17 Dec 夜 | 阿根廷方面的拖船与驳船载舰员驶向布宜诺斯艾利斯（沿拉普拉塔河北岸/深水航道），18 日抵达 | `frus_1939_v5` d140、d141 | 高 |

### 3.5 18–21 日

| 时间 | 事件 | 来源 | 置信 |
|---|---|---|---|
| 17/18 Dec | 斯佩残骸燃烧约 3 天（德文维基）；NZ 时代报道称“两天” | `wiki_de_ags`；`wiki_en_ags` | 中 |
| 18 Dec LT 午后 | 舰员抵布宜诺斯艾利斯；Time：官员安置在 Hotel de Inmigrantes 附近（毗邻海军船坞）并保留佩剑和手枪；总人数 **1,040**（FRUS）/ 1,039（Time）/ 1,055（hmsajax，含到后增补？） | `frus_1939_v5` d141、d140；`time_1940`；`hmsajax_langsdorff` | 高 |
| 18 Dec 17:00 LT | 威尔逊：乌方扣押 4 名最后撤离者；德公使向乌外交部递交抗议照会，朗斯多夫致公使的信也被公开，措辞攻击乌方“屈服于英压”，公众因葬礼场面而生的同情大减 | `frus_1939_v5` d140 | 高 |
| 18 Dec 起 | 乌外长官方报告称斯佩沉于**领海内**（Auckland Star 21 Dec，经摘要）；此点有争议 | `paperspast`（摘要） | 低 |
| 19 Dec | 阿根廷外交部确认决定拘禁舰长、军官与全体水兵；人数 1,040；地点未定（“perplexed”） | `frus_1939_v5` d141 | 高 |
| 19 Dec 夜 → 20 Dec 凌晨 | **朗斯多夫自杀**：晚间视察三组水兵并与军官谈话约 3 小时、与每人握手，回房（Hotel de Inmigrantes / 海军军械库内“Naval Hotel”）写信给妻子、父母、大使；躺在**舰上军旗（帝国海军旧战旗）**上以手枪自射头部；次晨被副官发现。信署 19 Dec | `time_1940`；`wiki_en_langsdorff`；`hmsajax_langsdorff`；`ww2diario_blog` | 高（日期）/中（具体钟点未见） |
| 20 Dec | 阿根廷总统行政令：拘禁斯佩全体官兵（Armour 电 302, 20 Dec 4 p.m.） | `frus_1939_v5` d140 脚注 | 高 |
| 21 Dec | **葬礼**：布宜诺斯艾利斯 Cementerio Alemán（Chacarita 内德国区）。约一千名德国水兵列队走进阿根廷海军军械库告别；英商船船长代表（C. Pottinger，经 18 位被囚船长推选，Ashlea 船长）参加；献花圈；Hitler 电报由大使宣读(经摘要) | `hmsajax_langsdorff`；`silverfox175`/Auckland Star (摘要) | 中 |
| 21 Dec | 瓜尼接受阿根廷草案“原则上”，保留对末段规则的意见；乌总统与部长会议反对末段措施 | `frus_1939_v5` d155、d163 | 高 |
| 22 Dec | 朗曼致外交部电：要求制止 DNB 关于英国水手在斯佩亡者墓前“恶劣行为”的不实报道，南美报刊盛赞英国水手的骑士风度（德国宣传造假） | `wiki_de_ags`（引 ADAP p.441） | 中 |
| 22 Dec | 雷德尔命令：德国军舰“战至最后一发炮弹……”（德文维基称为朗斯多夫自杀两天后） | `wiki_de_ags` | 中 |
| 23 Dec 17:00（巴拿马时间）| 巴拿马总统向三交战国转交**美洲 21 国联合声明（抗议安全区被侵犯）**；美国务院同日公布；乌拉圭在**当地 19:00** 公布并声明“原则接受”并保留 | `frus_1939_v5` d160、d163、d164 | 高 |

---

## 4. 外交与国际法

### 4.1 海牙第十三公约（1907）条文（FRUS d122 引述）

- 第 12 条：无另行规定时，交战国军舰不得在中立国港口、锚地或领水停留超过 **24 小时**。
- 第 14 条：仅因**损伤或气象**可延长；原因消失后须立即离去。
- 第 16 条：交战国军舰在**敌方商船离港后 24 小时内**不得离开中立港。（英国人据此让 Ashworth 15 日 1900、Dunster Grange 16 日 1700 出港——哈伍德所记钟点是 Z+2 还是当地时间存疑。若为当地时间，Dunster Grange 的 24 小时在 17 日 17:00 届满，斯佩 18:15 起航恰在其后。）
- 第 17 条：仅许进行“使其适航所绝对必要”的修理，**不得增加战斗力**；修理是否必要由**当地中立国当局**决定，并须尽快完成。
- 1928 哈瓦那公约第 9 条与美国 1939-09-05 中立公告：**敌火造成的损伤不得修理**。
- 《巴拿马总宣言》（1939-10-03）第 3(d) 款：军舰在美洲共和国港口的停留限制。
- 乌拉圭依据 1939-09-05 的中立法令，并以“72 小时”为期：从逻辑上看，24 h + 48 h 修理宽限，对应 17 日 20:00 截止（若自 14 日 20:00 起算）。**不同来源把 72 小时归于第 12、14 或 17 条，说法不一** → 最稳妥的表述：依第 17 条乌当局裁量、给 72 h。

### 4.2 英方策略（米林顿-德雷克）

- 初期（14 日）：要求立即驱逐或拘禁斯佩；伦敦告知附近无强力英舰后，转为**拖延**：安排英、法商船以 24 小时间隔离港（Ashworth 15 日 1900；Dunster Grange 16 日 1700，钟点见 §3 注）。哈伍德战报只明确提到这两艘；“每天一艘”说法出自二手叙述。
- 欺骗：BBC / 电台暗示 Renown、Ark Royal 已在附近；暗示在布宜诺斯艾利斯订燃油；传言“Dunkerque”到达（`wiki_de_ags`）。实际可用重炮舰仅 Cumberland（14 日 21:00 LT 到）；Renown、Ark Royal 17 日才到里约，Dorsetshire 在 17 日转向，Shropshire 抵里约 23 日（`nh_kindell_1939_12`）。
- 哈伍德 16 日决定不在 Whistle Buoy 附近动手（“politically impossible”），转而夜间巡逻英格利希浅滩以东。

### 4.3 乌拉圭

- 总统 **阿尔弗雷多·巴尔多米尔 (Alfredo Baldomir)** 与部长会议决定 72 h；外长 **阿尔韦托·瓜尼 (Alberto Guani)** 承受英德双重压力（`frus_1939_v5` d133、d135）。瓜尼 12-16 日对威尔逊坦言乌无力强制拘禁。
- 乌拉圭海军专家委员会受命检查损伤（`frus_1939_v5` d133 提到 “committee of naval experts”）；其成员名单尚未找到（见缺口）。
- 12-30：乌拉圭政府宣布 Tacoma 为“交战国舰队辅助船”，24 小时内离港，否则扣留；1940-01-23 乌行政令拘禁斯佩与 Tacoma 人员（`gub.uy` 档案目录）。

### 4.4 泛美层面

- 12-14/15 日：美国务院起草联合声明；巴西外长 Aranha 倾向强硬（拘禁至战争结束）；阿根廷外长 Cantilo 加入“英国船只在美洲水域也有违规”；智利外长 Ortega 同意预防性声明（`frus_1939_v5` d124–d134）。
- 12-19 日：Aranha 建议加入关于斯佩“进入并自沉于拉普拉塔河水域”的措辞（d141、d148、d158）。
- 12-23 日 17:00 巴拿马时间：声明转交英、法、德；乌拉圭 19:00 当地发布并声明“原则接受+保留”（d160、d163）。

---

## 5. 德国决策链（时序）

1. 14 日：朗斯多夫要求 14 天修理期；乌方答 72 h。
2. 15/16 日：舰上观察（炮术长 Ascher）判断外面有 Renown、Ark Royal（实为英国虚张声势，`wiki_de_ags`）。
3. 16 日（约 01:00）：朗斯多夫致电 SKL（原文见 `fuehrer_conf_161239`）：突围无望；建议出到中立界线，必要时杀向布宜诺斯艾利斯；请求在“自沉（河口水浅）”与“拘禁”之间裁决。
4. 16 日 09:00：朗曼电报赞同爆破而非拘禁。
5. 16 日 13:00 MEZ：雷德尔-希特勒会商：希特勒反对拘禁，“尤其是因为斯佩有可能在突围中击中英舰”。
6. 16 日 17:07 MEZ：1347/16 发往斯佩（见 §3.3）。
7. 17 日 00:40 MEZ：2239/16 重申。
8. 争议：希特勒是否“命令”自沉？现有证据（海军总部档案、美海军 ONI 译本）显示是**由指挥官选择**，希特勒仅表示不准被拘禁；但事后新闻稿措辞称“元首已命令”(`usni_1949` 摘要)。海军总部与朗斯多夫之间无电话往来（同上）。

---

## 6. 伤亡与损失（供战斗/汇总页使用）

| 舰 | 阵亡 | 伤 | 来源 |
|---|---|---|---|
| Admiral Graf Spee | **36**（`wiki_en_river_plate`、`navweaps_oob`；Kindell 写 37 / 57 伤） | 60（含朗斯多夫）；Wilson 12-14：舰上 48 伤 + 1 上岸 | 多源 |
| HMS Exeter | **61**（通行数；Kindell 当日名单为 4 名军官 + 56 名士兵 = 60，另有后续死亡者）| 23（德文维基 / NavWeaps）；Kindell 点名 4 名军官 + 20 名士兵 ≈ 24 | `nh_kindell_1939_12`；`navweaps_oob` |
| HMS Ajax | 7 | 5（NavWeaps）/ 2（Kindell）| 差异需查 |
| HMNZS Achilles | 4 | 3 | `nh_kindell_1939_12` |
| 英方合计 | 72 | 28（`wiki_en_river_plate`） | |

商船俘虏：斯佩袭击期间未造成商船人员死亡（9 艘，总 50,089 GRT）；14 日在蒙得维的亚释放的是仍在舰上的 61–62 人，其余约 299 人在 Altmark 上，因 12 月 6 日最后一次会合后被留在 Altmark，直到 1940-02-16 “Altmark 事件”获救。

---

## 7. 后续：舰员、增援与英方行踪

- 德舰员：约 1,040 人在阿根廷被拘禁（`frus_1939_v5` d141）；后续散布于 Rosario（至少 92 人）、Sierra de la Ventana 的 Club Hotel、**Villa General Belgrano**（`wiki_en_river_plate`）；约 40 人（含 4 名最后离舰者）、约 28 名住院伤员和 5 名电台人员留在乌拉圭；Tacoma 船员亦被拘（`gub.uy` 目录；`hmsajax_langsdorff`）。
- 1945-04-10 阿根廷对德宣战后他们转为战俘；1946-02-16 811 人 + 乌拉圭 34 人乘 HMT Highland Monarch 遣返德国（由 HMS Ajax 护航）(`hmsajax_langsdorff`)。
- Exeter：13 日 07:29（Kindell）退出；**16 日抵福克兰群岛 Port Stanley**（Kindell），后返英国德文港大修 13 个月（`wiki_en_river_plate`）。
- Cumberland：14 日 21:00 LT 加入；18 日后继续在蒙得维的亚外海，24 日回福克兰。
- Achilles：18 日离普拉塔，21 日到福克兰卸伤员，24 日回；Ajax 18 日后离普拉塔去福克兰。
- Ark Royal / Renown：12 月 13 日从开普敦方向奉命赴普拉塔；**17 日抵里约、加油后再出海**，听闻自沉后转搜 Altmark，24 日抵弗里敦（`nh_kindell_1939_12`）。
- Neptune：在桑托斯加油；Dorsetshire：13 日自西蒙斯敦出发，**18 日被改派福克兰**；Shropshire：15 日自开普敦出发，23 日抵里约（`nh_kindell_1939_12`；NavWeaps 的“off the Plate 19 Dec”为计划值）。
- 英国驱逐舰 Hardy/Hero/Hostile 22 日晨抵普拉塔。

---

## 8. 人物表

| 中文 | 原名 | 1939-12 职务 | 简历 |
|---|---|---|---|
| 汉斯·朗斯多夫 | Hans Wilhelm Langsdorff (1894-03-20 Bergen auf Rügen – 1939-12-20 Buenos Aires) | 装甲舰“海军上将施佩伯爵”号舰长，Kapitän zur See | 1912 年入伍，日德兰参战；1937 年任海军少将 Boehm 参谋长，1938-11 起任斯佩舰长；以人道对待俘虏闻名；12-17 命令自沉，12-20 自杀（`hmsajax_langsdorff`、`wiki_en_langsdorff`） |
| 亨利·哈伍德 | Henry Harwood | 南美分舰队司令（准将，12 月 13 日起晋升海军少将，KCB） | 指挥 Ajax；决定将三舰分兵；17 日率队迫近 Whistle Buoy（`harwood_despatch` ¶67） |
| 弗雷德里克·S·贝尔 | F. S. Bell | HMS Exeter 舰长，CB | 重伤舰长，13 日 07:29 退出（Kindell） |
| 查尔斯·H·L·伍德豪斯 | C. H. L. Woodhouse | HMS Ajax 舰长，CB | 指挥旗舰，回收水上飞机（战报 ¶76） |
| 威廉·E·帕里 | W. E. Parry | HMNZS Achilles 舰长，CB（新西兰） | 夜间贴近斯佩到 5 海里（战报 ¶51） |
| W·H·G·法洛菲尔德 | W. H. G. Fallowfield | HMS Cumberland 舰长 | 14 日 21:00 LT 抵达 |
| 卢因 | Lieutenant Lewin（Ajax 舰载机飞行员，全名待核） | Ajax 的 Walrus/Seafox 飞行员 | 17 日报告“Graf Spee 自炸”；战报称“excellent recovery… almost dark”（战报 ¶76） |
| L·N·希尔 | Capt. L. N. Hill, RFA | RFA Olynthus 舰长 | 为 Ajax、Achilles 海上加油 |
| 帕特里克·多夫 | Patrick G. G. “Paddy” Dove (1896–1957) | MV Africa Shell 船长，被俘者之一 | 1939-11-15 被俘；与朗斯多夫交好；著 *I Was Graf Spee’s Prisoner* (1940)（`wiki_en_dove`） |
| C·波廷杰 | Capt. Charles Pottinger | SS Ashlea 船长 | 作为 18 位被囚船长代表赴布宜诺斯艾利斯参加葬礼（经摘要） |
| 尤金·米林顿-德雷克 | Sir Eugen Millington-Drake (1889–1972) | 驻乌拉圭英国公使（1934–41） | 外交拖延主线 |
| 亨利·麦考尔 | Capt. Henry McCall | 英国驻阿根廷海军武官（飞往蒙得维的亚协助） | 待核（经 Pope） |
| 埃德温·C·威尔逊 | Edwin C. Wilson | 美国驻乌拉圭公使 | FRUS 电报作者 |
| 奥托·朗曼 | Otto Langmann | 德国驻乌拉圭公使 | 谈判、12-16 电报；12-22 电报 |
| 阿尔韦托·瓜尼 | Alberto Guani | 乌拉圭外长 | 周旋于英德之间 |
| 阿尔弗雷多·巴尔多米尔 | Alfredo Baldomir | 乌拉圭总统（1938–43） | |
| 埃德蒙·冯·特尔曼 | Edmund Freiherr von Thermann | 德国驻阿根廷大使 | 朗斯多夫遗书收信人（`time_1940`） |
| 迪特里希·尼布尔 | Dietrich Niebuhr | 德国驻阿根廷海军武官 | 朗曼电报中“海军武官”（待核姓名） |
| 埃里希·雷德尔 | Erich Raeder | 海军总司令 | 1347/16 无线电署名 |
| 阿道夫·希特勒 / 约德尔 / 普特卡默 | Adolf Hitler; Alfred Jodl; Karl-Jesko von Puttkamer | 元首；国防军统帅部作战厅长；海军副官 | 16 日 13:00 会议在场（`fuehrer_conf_161239`） |
| 保罗·阿舍尔 | Paul Ascher | 斯佩第一炮术长，Fregattenkapitän | 误认 Renown / Ark Royal 的一方（`wiki_de_ags`） |
| 瓦尔特·凯 | Walter Kay | 斯佩副舰长 (Erster Offizier) | `kbismarck_gs` |
| 卡尔·克莱普 | Karl Klepp | 轮机长 | `kbismarck_gs` |
| 尤尔根·瓦滕贝格 | Jürgen Wattenberg (1900–1995) | 导航官 | 后逃出拘禁，1940-05 返德，改任 U-162 艇长 (`wikipedia` 瓦滕贝格条) |
| 海因里希·道 | Heinrich Dau | Altmark 舰长 | 事后北上被 Cossack 拦截（1940-02-16） |
| 何塞·M·坎蒂洛 / 奥斯瓦尔多·阿拉尼亚 / 阿卜拉罕·奥尔特加 | José M. Cantilo (AR); Osvaldo Aranha (BR); Abraham Ortega (CL) | 阿、巴、智外长 | 泛美声明 |
| 罗伯特·M·奥尔蒂斯 | Roberto M. Ortiz | 阿根廷总统 | 签署 20 日拘禁令（待核） |

---

## 9. 有争议或待核之处

1. **自沉时刻**：当地 19:54–19:55（高）。其他 20:54/20:55 为英方 Zone+2。另见 TIME-Life、OneTubeRadio 所写 “8:55 PM” = 误把 Z+2 当当地。
2. **离港时间**：当地 18:15–18:20（中）vs 哈伍德 1815（若 Z+2 → 17:15 当地）。
3. **围观人数**：20,000（多个英文网站）/ “quarter of a million”（maritimequest）/ 500,000（Trove 电讯）。20,000 可能是指码头附近；全市海岸线高估值可能是新闻夸张。我取：数万至十数万，**低**。
4. **自沉位置与领海**：残骸 34°58′18″S 56°17′54″W（`wiki_en_ags`）/ 56°17′57″W（`kbismarck_gs`）；距蒙得维的亚防波堤约 5.5–6 海里；乌拉圭官方称沉于领海内，美洲国家文件称“in waters of the River Plate”。残骸水深约 7–8 m（`wiki_en_river_plate`），另见 11 m（`wiki_en_ags`）。
5. **被释放俘虏人数**：61（6+9+25+21）vs 62（6+9+26+21）。
6. **朗斯多夫自杀时刻**：现有文献只说“19 日晚至 20 日凌晨”，`time_1940` 说副官“次日早晨”发现。地点：Hotel de Inmigrantes（移民旅馆，近 Dársena Norte / 海军船坞）。
7. **葬礼日期**：21 日（hmsajax、IWM、NHHC 照片 NH 85636），德文维基说“三天后”（模糊）。
8. **“72 小时”依据**：第 12/14/17 条说法不一；起算点（14 日 20:00？）待乌方原始文件确认。
9. **留在乌拉圭人数**：六名军官（含高级军医）+ 五名电台人员 + 28 名住院水兵 + 4 名最后离舰者（hmsajax、FRUS）。
10. **泛美抗议**日期：美国务院 12-23 公布；巴拿马总统 12-23 17:00（巴拿马时间）发出。

---

## 10. 缺口与下一步

- 乌拉圭《Antecedentes…》1940 原件、阿根廷《La Nación》《La Prensa》12-18/19/21 日版面、《El País》《El Día》；
- 乌海军专家委员会成员名单与检查报告；
- Pope、Millington-Drake 原文页码；
- ADAP D VIII 朗曼电报原文（M 7007, pp.427/441）；
- 拖船 Coloso、Gigante 与驳船名称（目前只确认 “Gigante”；FRUS 说“tugs and lighters”）；
- 战斗当日各方时钟问题交战斗研究员。
