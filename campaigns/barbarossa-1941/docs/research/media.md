# 研究日志 · 媒体代理（装备、兵力、战略事件、照片、清单文字）

## 产出与重建方法

| 文件 | 内容 | 生成方式 |
|---|---|---|
| `data/equipment.json` | 34 张装备卡（德 15、苏 16、罗/匈/意各 1） | `pipeline/scripts/assets/media_equipment.py` → `build_media_data.py` |
| `data/forces.json` | 7 方兵力与损失 + `byPhase`（5 个阶段） | `media_forces.py` → `build_media_data.py` |
| `pipeline/events/strategic.json` | 28 个战略、政治与暴行事件 | `media_events.py` → `build_media_data.py` |
| `data/sources/media.json` | 57 个来源（id 均以 `media_` 开头） | 手写 |
| `public/campaigns/barbarossa-1941/photos/` + `index.json`，`credits.json` 的 `photos` 段 | 97 张 webp（800 px 宽，6.6 MB） | `fetch_photos.py` |
| `pipeline/scripts/assets/extra_photos.json` | 照片池 68 张（按主题，含中文说明；role：intro / intro_fallback / cover / pool） | 手写 |
| `pipeline/scripts/assets/exclude_photos.json` | 人工排除（卍字） | 手写 |
| `pipeline/manifest/texts.json`、`docs/research/manifest-texts.md` | 给整合者的清单文字 | 手写 |

```bash
.venv/bin/python campaigns/barbarossa-1941/pipeline/scripts/assets/build_media_data.py   # 写三个 JSON，检查字数/来源/地名/坐标
.venv/bin/python campaigns/barbarossa-1941/pipeline/scripts/assets/fetch_photos.py       # 收集全部 photo.commons，核许可、下载、转 webp、写 index 与 credits
npm run validate -- --campaign barbarossa-1941
```

`fetch_photos.py` 扫描 `data/events.json`、`pipeline/events/*.json`（所有分区代理的草稿）、`data/equipment.json`、照片池、`pipeline/manifest/texts.json` 与 `campaign.json` 的 `intro.photo/photoFallback`。可重复执行：已有 webp 直接跳过，未被引用的 webp 会删除（`--keep-unused` 保留）。整合者或分区代理给更多事件加了 `photo: { commons, caption }` 之后，重新运行即可；若有被拒的数据照片（不存在、许可不符、人工排除），脚本以退出码 1 结束并列出来源。

## 照片：许可与内容规则

- 许可经 Commons API `extmetadata`（LicenseShortName / Artist / LicenseUrl）核实，只收公有领域、CC0、CC BY、CC BY-SA；本次 97 张无一被拒。主要来源：德国联邦档案馆（CC BY-SA 3.0 DE）、RIA Novosti 档案（CC BY-SA 3.0）、波兰国家数字档案馆藏德方宣传连照片（公有领域）、苏联/俄罗斯公有领域照片（哈尔杰伊、洛辛、卡拉什尼科夫、马尔科夫-格林贝格、韦利克扎宁等）、荷兰国家档案馆 Spaarnestad（CC0）、芬兰战时照片档案 SA-kuva（公有领域 / CC BY 4.0）、匈牙利 Fortepan（CC BY-SA 3.0）、俄罗斯国防部与莫斯科市档案（CC BY 4.0）。
- 沿用其他战役的规则：画面不出现卍字。逐张目检后排除 3 张（见 `exclude_photos.json`）：JG 54 的 Bf 109（垂尾卍字）、Ju 88 空中照（垂尾卍字）、斯维尔德洛夫广场展出的德机（垂尾卍字）；另删去 1 张带网站水印的疏散照片。飞机卡改用看不到垂尾的照片（Bf 109 维护照、Ju 88 总装线）。
- 暴行类事件只用纪念碑或文件（娘子谷纪念碑、“政委命令”首页），不用遇难者照片；考纳斯、卡缅涅茨-波多利斯基、内务部监狱屠杀不配图。
- 开场照片：`File:German troops crossing the Soviet border.jpg`（约翰内斯·黑勒，PK 637，公有领域）；备用：`File:Początek wojny niemiecko-radzieckiej (2-646).jpg`。
- 总台封面：`photos/rian-archive-669663-soviet-troops-head-to-front-lines-af-0505de.webp`（加拉宁，1941-11-07 红场阅兵后开赴前线的部队，CC BY-SA 3.0）。
- 池中缺口：没有找到许可清楚的 1941 年塞瓦斯托波尔照片（Commons 上多为 1942 年德方照片或克里米亚战争图像）；斯维尔河一线也没有，用 10 月 1 日芬军攻占彼得罗扎沃茨克的阅兵照片代替。

## 装备卡：数字与口径

- **德军坦克**（1941-06-22 东线，詹茨 / 福尔奇克）：I 号 410、II 号 746、35(t) 149、38(t) 623、III 号 965（其中约 707 辆 50 mm 炮、259 辆 37 mm 炮）、IV 号 439，合计 3,332；另有指挥坦克约 230 辆。38(t) 另有 754/772 的说法（含指挥型），35(t) 另有 155/160 的说法——卡片写「一说」。突击炮 259 辆（利特克，11 个营 + 5 个独立连）。
- **苏军坦克**（谢因统计，1941-06-01，全军 / 西部军区，经 Tank Archives 转引）：T-34 892 / 832、KV-1 370 / 337、KV-2 134 / 132、T-28 481 / 424、T-35 59 / 51、T-26（各型）8,747 / 4,221、BT-7 与 BT-7M 5,260 / 3,287、T-40 132 / 115。`count` 取西部军区数字。卡片说明这是 6 月 1 日数字，到 22 日 T-34、KV 又有交付。
- 拉塞尼艾的 KV（6 月 23–24 日阻滞第 6 装甲师劳斯战斗群）多数记载为 KV-2，少数说是 KV-1，卡片按 KV-2。
- 喀秋莎首次齐射：1941-07-14 奥尔沙站，弗廖罗夫上尉连（莫斯科时间 15:15）。ZiS-3：第 92 厂 1941 年下半年先行生产，1942-02 正式列装；1941 年师属主力是 F-22USV。
- `m1931_122` 取 122 mm 加农炮 M1931/37（A-19），照片用同口径的 M-30 榴弹炮（博物馆实物），说明里注明。
- 匈牙利快速军：约 95 辆“托尔迪”与 65 辆 L3（35M）；意大利远征军：61 辆 L3/35；罗马尼亚：126 辆 R-2（即 LT vz.35），模型用 `pz35t`。
- 3D 模型：已注册的 `pz2 pz3 pz4 pz35t pz38t stug3 t26 bt7 t34 kv1 bf109 ju87 he111 ju88` 都已挂上；KV-2、T-28、T-35、T-40、BA-10 与火炮没有对应模型。schema 没有“重型坦克”“强击机”类别：KV、T-35、突击炮记作 `tank_medium`，伊尔-2 记作 `bomber`，Sd.Kfz. 251 记作 `armored_car`。

## 兵力与损失（forces.json）

- **德国**：东线陆军约 305 万人（格兰茨、DRZW 第 4 卷），约 153 个师（19 个装甲师、15 个摩托化步兵师含党卫军）；坦克 3,350、作战飞机 2,770（格兰茨；贝里斯特伦计全部飞机约 4,400）、火炮 7,200（克拉克；含反坦克炮与迫击炮另有 2 万余门的说法）。损失：陆军卫生报告至 1941-12-31 阵亡 186,452、负伤 655,179、失踪 40,157（含挪威集团军，英文维基据 Askey 2014）；哈尔德日记 11-30 累计 743,112（平均兵力 320 万的 23%）；施塔赫尔计 1941 年全年 830,903。坦克全损 2,735 辆 + 突击炮 104 辆（利特克）；飞机全损约 2,800 架（贝里斯特伦）。
- **分阶段德方节点**（可靠程度不一，均在 `note` 中写明）：7 月单月阵亡约 6.3 万（施塔赫尔《基辅 1941》）；7 月 31 日累计约 21.3 万（来源单一，标「一说」）；8 月底约 41 万（标「一说」）；9 月 28 日累计 522,833（格兰茨引德方）；11 月 30 日 743,112（哈尔德）。边境交战与台风阶段没有可靠的单独数字，写「—」。
- **苏联**：西部军区约 268 万–290 万人、170 个师与 2 个旅；坦克 12,223（谢因，西部军区全部坦克含待修）；飞机 7,133（格兰茨，一说 9,100 以上）。克里沃舍耶夫 1941 年（6-22 至 12-31）：不可挽回 3,137,673（阵亡与伤重不治 566,852、非战斗死亡 235,339、失踪与被俘 2,335,482），卫生减员 1,336,147；坦克 20,500、作战飞机 17,900（贝里斯特伦连同非战斗损失约 21,200）、火炮与迫击炮约 10.1 万。德方统计 1941 年俘虏约 335 万，至 1942 年 2 月约 200 万死亡（施特赖特）。
- **克里沃舍耶夫战役表**（用于 byPhase）：波罗的海 75,202 / 13,284；白俄罗斯 341,073 / 76,717；西乌克兰 172,323 / 69,271；斯摩棱斯克会战 486,171 / 273,803；基辅 616,304 / 84,240；列宁格勒防御 214,078 / 130,848；敖德萨 16,578 / 24,690；顿巴斯—罗斯托夫防御 143,313 / 17,263；莫斯科防御 514,338 / 143,941；罗斯托夫进攻 15,264 / 17,847（不可挽回 / 卫生）。第三季度（至 9-30）累计 2,129,677 / 687,626。白俄罗斯、斯摩棱斯克、基辅、莫斯科四项已与俄文维基核对；其余取自克里沃舍耶夫表格的常见引用，可信度中等。
- **德方战果公报**（标为“德方称”）：比亚韦斯托克—明斯克约 32.4 万（豪普特据博克命令计 287,704）；斯摩棱斯克约 31 万；乌曼约 10.3 万；基辅约 66.5 万；维亚济马—布良斯克 673,098（博克 10-19 命令）。
- **台风与莫斯科阶段的兵力快照**：10-01 中央集团军群约 100 万人、1,700 辆坦克（一说可用约 1,000）、14,000 门火炮、950 架飞机，对苏方三个方面军 125 万人、990 辆坦克、7,600 门火炮、677 架飞机；12-05 苏方反攻三个方面军 110 万人、774 辆坦克、7,652 门火炮迫击炮、约 1,000 架飞机，对苏方估计的中央集团军群 170.8 万人、1,170 辆坦克、13,500 门火炮、615 架飞机（苏方数字偏高）。
- **盟国**：芬兰动员约 53 万、野战部队约 47.5 万、16 个师，1941 年阵亡与失踪 26,355、伤亡约 7.5 万（维赫维莱宁）；罗马尼亚第 3、4 集团军 325,685 人，1941 年阵亡失踪至少 3.9 万、伤亡 11.4 万以上，敖德萨围城 92,545（阵亡 17,729、负伤 63,345、失踪 11,471，阿克斯沃西）；匈牙利喀尔巴阡集群约 4.5 万、快速军伤亡约 4,400；斯洛伐克约 4.1 万–4.5 万，伤亡数字可信度低；意大利远征军 6.2 万人，至年底伤亡约 8,700（含冻伤，基尔丘贝尔 2013）。

## 战略事件：要点与有争议之处

（全部为柏林时间；莫斯科时刻减 1 小时换算）

- 莫洛托夫广播：莫斯科 12:15 → 柏林 11:15。斯大林 7 月 3 日讲话：莫斯科 06:30 → 05:30。红场阅兵：莫斯科 08:00 → 07:00。
- 斯洛伐克 6 月 22 日由图卡宣布断交宣战，快速集群 24–25 日越境（斯洛伐克军事史研究所文章）；“斯洛伐克远征集团军群”是 9 月以后的编制，不用于 6 月。
- 卡绍轰炸：飞机身份至今有争议，正文写“身份不明”“匈牙利政府认定是苏联所为”。
- 内务部监狱屠杀：利沃夫三座监狱约 3,000–4,000 人；整体规模估计差异很大，正文只写利沃夫的数字，可信度 medium。
- 第聂伯水电站大坝：8 月 18 日晚炸毁（一说 19 日），溃坝死亡人数从数千到数万众说纷纭，正文明确写“不明”，可信度 low。RIA 档案中那张被炸大坝照片摄于 1943 年（德军撤退时第二次炸毁），未使用。
- 卡缅涅茨-波多利斯基：耶克尔恩报告 23,600 人，其中约 1.4 万–1.6 万为被匈牙利驱逐的外籍犹太人。
- 娘子谷：特别行动队报告 33,771 人；执行者为第 4a 特遣队与警察第 45、第 303 营及乌克兰辅警。
- 克列夏季克爆炸：9 月 24 日起；烧毁建筑数目各说不一（数百栋），正文写“数百栋”。
- 佐尔格与远东部队：常见的“佐尔格情报直接促成远东师西调”说法被高估，正文写“在多方情报支持下”，调动规模写“十余个步兵师和坦克师”，没有采用“18 个师、1,700 辆坦克、1,500 架飞机”的流行数字。
- 莫斯科首次空袭：约 195 架，苏方称击落 22 架、市民死亡约 130 人。首次空袭柏林：8 月 7–8 日夜，15 架 DB-3 起飞、5 架到达柏林；至 9 月初共约十次，损失近 20 架。
- 列宁格勒：11 月 20 日配给降至工人 250 克、其他居民 125 克；22 日首批卡车车队上冰；12 月饿死 5 万余人。

## 与其他代理可能重叠的事件

写入时各分区的 `pipeline/events/*.json` 尚无内容，以下事件发生在分区内，整合时请查重（保留一方即可）：`e.kaunas_pogrom`（北）、`e.nkvd_prison_massacres`（南，利沃夫）、`e.dniprohes_blown`（南，扎波罗热）、`e.khreshchatyk_blasts` 与 `e.babi_yar`（南，基辅）、`e.leningrad_ice_road`（北，拉多加湖）、`e.counteroffensive_begins`（中，12 月 5 日；本条写的是全局综述，若中区另有加里宁方面军出击的战斗事件，可降为 importance 2 或合并）。

## 主要参考（URL）

- 英文维基：Operation Barbarossa、Aerial warfare during Operation Barbarossa、Commissar Order、Kaunas pogrom、Kamianets-Podilskyi massacre、Babi Yar、Bombing of Kassa、Continuation War、NKVD prisoner massacres、Order No. 270、Moscow Conference (1941)、1941 October Revolution Parade、Road of Life、Richard Sorge、German mistreatment of Soviet prisoners of war、Italian Expeditionary Corps in Russia、Slovak Expeditionary Army Group、Gyorshadtest。
- 俄文维基：Белостокско-Минское сражение（克里沃舍耶夫数字、32.4 万与 287,704 战俘）、Битва за Москву（博克 10-19 命令 673,098）、Киевская стратегическая оборонительная операция（665,000）、Смоленское сражение (1941)、Выступление Молотова / Сталина по радио、Московская паника 1941 года、Бомбардировки Москвы в 1941 году、Бомбардировки Берлина советской авиацией в 1941 году。
- Tank Archives《Common Questions: Red Army AFVs in 1941》https://www.tankarchives.com/2015/07/common-questions-red-army-afvs-in.html （谢因 1941-06-01 统计表）。
- 斯洛伐克军事史研究所（vhu.sk）关于 1941 年斯洛伐克快速集群的文章（宣战与越境日期）。
- 书目：Glantz & House《When Titans Clashed》、Stahel《Kiev 1941》《Operation Typhoon》《The Battle for Moscow》、DRZW Bd. 4、Krivosheev《Soviet Casualties and Combat Losses》、Bergström《Barbarossa: The Air Battle》、Jentz《Panzertruppen》、Liedtke《Enduring the Whirlwind》、Axworthy《Third Axis, Fourth Ally》、Vehviläinen《Finland in the Second World War》、Streit《Keine Kameraden》、Braithwaite《Moscow 1941》、Reid《Leningrad》、Halder《Kriegstagebuch》Bd. III。

## 待解决

- 德军边境交战（6.22–7.9）与台风阶段（9.30–11.14）的伤亡没有找到可靠的分阶段数字，`byPhase` 中写「—」；7 月 31 日与 8 月 31 日的累计数只有单一来源，标「一说」。
- 斯洛伐克与匈牙利 1941 年阵亡数缺少可靠来源。
- 地图大字坐标需在开发服务器上目视微调。
