# 大西洋海战 · 照片与影像来源（许可核实）

> 目录：`public/campaigns/battle-atlantic-1945/photos/`（20 张 WebP，宽 ≤ 900 px）
> 索引：[photos/index.json](../../../../public/campaigns/battle-atlantic-1945/photos/index.json)（事件卡按 Commons 文件名取图） · 署名：[credits.json](../../../../public/campaigns/battle-atlantic-1945/credits.json)
> 下载脚本：[pipeline/scripts/fetch_photos.py](../../pipeline/scripts/fetch_photos.py)（`commons.py` 串行限速、429/403 退避）
> 核实日期：2026-10-19。每张图都重新查询 Wikimedia Commons 的 `extmetadata`（LicenseShortName / LicenseUrl / Artist / ImageDescription），只接受 Public Domain / CC0 / CC BY / CC BY-SA。

## 0. 规则与核验结果

1. **只用可确证的许可**：Public Domain（含 PD-UKGov、PD-USGov、Bundesarchiv CC BY-SA 3.0 DE）、CC0、CC BY、CC BY-SA。拒绝 NC、ND、GFDL-only、「合理使用」与作者/许可缺失的图。
2. **许可为 CC BY-SA 的图，本目录的 WebP 派生件按同一许可提供**（`u96-st-nazaire.webp`：CC BY-SA 3.0 DE；`enigma-machine.webp` 为 PD，另见下）。
3. **不裁切、不修饰**：只做等比缩放（最长边压到 900 px 以内）与 WebP 转码；不改变画面内容。
4. **不用未下载成功的图**：脚本对每个文件做 WebP 解码校验（格式、宽度、可解码、体积 > 1 KB），任一失败即整体报错退出。
5. **事件卡与照片的绑定**：`events.json` 里写 `photo.commons`（Commons 文件名），引擎从 `photos/index.json` 取 `src` 与署名；文件名必须是下表第一列的完整 Commons 标题。

**核验统计**：20 张全部通过。许可分布：Public domain 19 张、CC BY-SA 3.0 de 1 张。

| 检查项 | 结果 |
|---|---|
| 数量 12–20 | 20 张 |
| 格式 | 全部 WebP（`PIL.Image.format == WEBP`） |
| 宽度 | 623–900 px（中位 900），无一超过 900 |
| 许可 | 全部为 PD / CC0 / CC BY / CC BY-SA，无 NC/ND |
| 索引字段 | src、title、author、license、licenseUrl、sourceUrl、caption、role、w/h 齐全（另附 kind、originalUrl、sha256 于 credits.json） |
| 可重现 | `fetch_photos.py` 可重复执行；`--verify-only` 只校验不下载 |

## 1. 照片清单

### 开场与 U 艇

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `German submarine U-541 in the Atlantic Ocean on 11 May 1945 (80-G-319661).jpg` | [`u541-surrendered-1945.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/u541-surrendered-1945.webp) | 900×599 | U.S. Naval History and Heritage Command photo 80-G-319661 | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1945 年 5 月 11 日，U-541 在圣文森特角以西海面向英国驱逐舰马尔科姆号投降，照片摄自美军 PBY-5A 卡塔琳娜（美国国家档案馆 80-G-319661）。簿记差异：uboat.net 记投降日为 5 月 12 日于直布罗陀 |
| `Bundesarchiv Bild 101II-MW-3712-04A, St. Nazaire, U-96 einlaufend.jpg` | [`u96-st-nazaire.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/u96-st-nazaire.webp) | 794×501 | Schlemmer | [CC BY-SA 3.0 de](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en) | U-96 驶入圣纳泽尔：船员在码头列队，人群在混凝土掩体顶上看望。这艘 VII C 型艇共执行 11 次巡逻、击沉 27 艘商船，是狼群主力的代表（德国联邦档案馆 Bild 101II-MW-3712-04A，摄影 Schlemmer） |

### 航空反潜与护航

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `A Short Sunderland Mk I flying boat of No. 210 Squadron RAF based at Oban in Scotland, patrols over a Canadian troop convoy on its way to Greenock, 31 July 1940. CH832.jpg` | [`sunderland-convoy-1940.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/sunderland-convoy-1940.webp) | 900×648 | Stanley Devon | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1940 年 7 月 31 日，第 210 中队的桑德兰 Mk I（L2163「DA-G」）在苏格兰奥本外海为驶往格里诺克的加拿大运兵船队 TC.6 提供掩护（帝国战争博物馆 CH 832，摄影 Stanley Devon） |
| `German submarine U-243 under attack by Sunderland aircraft of No. 10 Squadron RAAF in the Bay of Biscay, 8 July 1944 (AWM 135145).jpg` | [`u243-sunderland-attack.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/u243-sunderland-attack.webp) | 640×464 | RAAF Photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1944 年 7 月 8 日，澳大利亚皇家空军第 10 中队的两架桑德兰在比斯开湾以西约 170 海里攻击 U-243；深水炸弹在艇尾激起水柱（澳大利亚战争纪念馆 AWM 135145） |
| `The Battle of the Atlantic 1939-1945 CH14001.jpg` | [`liberator-leigh-light.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/liberator-leigh-light.webp) | 800×539 | Miller (F/O), Royal Air Force official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 海岸司令部的一架解放者停在康沃尔圣埃瓦尔机场，机身被利式探照灯（Leigh Light）照亮。这种机载探照灯 1942 年起让夜间反潜从几乎无效变为有效（帝国战争博物馆 CH 14001） |
| `An aerial view of a convoy in the Atlantic, 1941. Two escorts can be seen in the foreground. C2647.jpg` | [`convoy-aerial-1941.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/convoy-aerial-1941.webp) | 900×625 | Royal Air Force official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年北大西洋护航队的空中俯瞰：商船排成纵队，两艘护航舰在前方两侧（英国帝国战争博物馆 C 2647，皇家空军摄） |
| `A convoy conference in progress, August 1942. A11796.jpg` | [`convoy-conference-1942.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/convoy-conference-1942.webp) | 900×680 | Coote, R G G (Lt), Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1942 年 8 月，一次出航前的护航队会议：商船船长与护航舰军官在同一张桌前核对队位、信号与应急程序；墙上贴着「No Smoking」告示（帝国战争博物馆 A 11796） |
| `Destroyers on Convoy Escort Duty, October 1941 A5914.jpg` | [`destroyers-escort-1941.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/destroyers-escort-1941.webp) | 800×627 | Royal Navy official photographer, Smith, J H (Lt) | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年 10 月，老式 V 级驱逐舰 HMS Vanity（D 式迷彩）在护航队前方警戒；背景是商船队。位置据信在诺福克郡谢林厄姆外海（帝国战争博物馆 A 5914） |

### 护航航母与猎杀群

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `HMS AUDACITY, 1941. FL1204.jpg` | [`hms-audacity.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/hms-audacity.webp) | 900×652 | Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年的护航航母 HMS Audacity。它由德国商船汉诺威号改装，是英国第一艘护航航母；1941 年 12 月 21 日在护航 HG-76 时被 U-751 击沉（帝国战争博物馆 FL 1204） |
| `HMS Biter (D97) underway c1943.jpg` | [`hms-biter.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/hms-biter.webp) | 800×620 | Lt. S.J. Beadell, Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 护航航母 HMS Biter 由商船改装，甲板上停着 Martlet 战斗机与剑鱼攻击机；1943–44 年它随猎杀群在中大西洋作战（帝国战争博物馆，摄影 S. J. Beadell） |
| `HMS Starling (U66) underway 1943.jpg` | [`hms-starling.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/hms-starling.webp) | 757×554 | J. Hall, Ministry of Defence Foxhill Collection of Ship Photographs | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1943 年的 HMS Starling。这艘改进型黑天鹅级单桅帆船是沃克上校第 2 护航群的旗舰，1944 年 1 月随群在北大西洋作战（帝国战争博物馆，J. Hall 收藏） |

### 指挥、地图与人物

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `The Operations Room at Derby House in Liverpool, the headquarters of the Commander-in-Chief Western Approaches, September 1944. A25746.jpg` | [`western-approaches-plot.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/western-approaches-plot.webp) | 900×671 | Parnall, C H (Lt), Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1944 年 9 月，利物浦德比大厦西部海口司令部作战室：巨大的态势板上标着最新船位，一名皇家海军妇女服务队标图员正在梯子上修改标记（帝国战争博物馆 A 25746） |
| `The war in Western Europe and Battle of the Atlantic.jpg` | [`map-west-point-atlantic.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/map-west-point-atlantic.webp) | 900×677 | Edward J. Krasnoborski | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 西点军校《美国战争地图集》第 46 图：轴心扩张（1939-09 至 1942-08）与同盟国反攻（1942-11 至 1944-06）的范围；左下角图例用符号标出各时段被 U 艇击沉的船只位置（最后一段至 1943 年 5 月） |
| `Nazi Personalities- Grossadmiral Karl Doenitz (1891-1984) A14899.jpg` | [`doenitz-portrait.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/doenitz-portrait.webp) | 623×799 | Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 卡尔·邓尼茨，1935–1943 年任潜艇部队司令（BdU），1943 年 1 月接任海军总司令，1945 年 5 月成为德国国家元首（帝国战争博物馆 A 14899） |

### 大西洋会议

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `Winston Churchill with Franklin D. Roosevelt on board USS Augusta (CA-31) on 9 August 1941 (NH 67201).jpg` | [`churchill-roosevelt-1941.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/churchill-roosevelt-1941.webp) | 900×721 | 佚名 | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年 8 月 9 日，丘吉尔与罗斯福在纽芬兰阿真舍湾的美国重巡洋舰奥古斯塔号上会面；《大西洋宪章》随后于 8 月 14 日公布（美国海军 NH 67201） |
| `President Roosevelt and Winston Churchill seated on the quarterdeck of HMS PRINCE OF WALES for a Sunday service during the Atlantic Conference, 10 August 1941. A4816.jpg` | [`atlantic-conference-service-1941.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/atlantic-conference-service-1941.webp) | 900×641 | Leslie Cornish Priest | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年 8 月 10 日，罗斯福与丘吉尔在威尔士亲王号战列舰后甲板参加礼拜，身后是美国海军金上将与斯塔克上将；大西洋会议在此舰与奥古斯塔号之间往返举行（帝国战争博物馆 A 4816） |

### 密码战

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `U-110 and HMS Bulldog.jpg` | [`u110-and-bulldog.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/u110-and-bulldog.webp) | 760×316 | Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1941 年 5 月 9 日，U-110 在冰岛以南攻击 OB-318 后被护航舰逼出水面；驱逐舰 HMS Bulldog 靠帮，恩尼格玛机与密码表落入英军之手（皇家海军官方照片） |
| `EnigmaMachine.jpg` | [`enigma-machine.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/enigma-machine.webp) | 900×1200 | Karsten Sperling , http://spiff.de/photo | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 恩尼格玛密码机（伦敦帝国战争博物馆藏）。U 艇自 1942 年 2 月起换用四转子 M4，一度让盟军破译失明十个月（摄影 Karsten Sperling，公有领域） |

### 商船损失与诺曼底

| 文件（Commons 标题） | 本地文件 | 尺寸 | 作者 | 许可 | 中文说明 |
|---|---|---|---|---|---|
| `Allied tanker torpedoed.jpg` | [`dixie-arrow-torpedoed.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/dixie-arrow-torpedoed.webp) | 900×650 | U.S. Navy (photo 80-G-43376) | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1942 年 3 月 26 日晨，美国油轮 Dixie Arrow 在哈特拉斯角外被 U-71 鱼雷击中，船体燃烧断裂，当晚沉没；33 名船员中 22 人获救（美国国家档案馆 80-G-43376） |
| `The Mulberry artificial harbour at Arromanches in Normandy, June 1944. A24675.jpg` | [`mulberry-arromanches.webp`](../../../../public/campaigns/battle-atlantic-1945/photos/mulberry-arromanches.webp) | 900×607 | Allen, E E (Lt), Royal Navy official photographer | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | 1944 年 6 月，诺曼底阿罗芒什的桑葚人工港 B 开始运转；跨海峡补给的成败直接决定登陆后能否站稳（帝国战争博物馆 A 24675） |

## 2. 逐张说明（可替换方案与注意事项）

### `u541-surrendered-1945`

- **Commons**：[German submarine U-541 in the Atlantic Ocean on 11 May 1945 (80-G-319661).jpg](https://commons.wikimedia.org/wiki/File:German_submarine_U-541_in_the_Atlantic_Ocean_on_11_May_1945_(80-G-319661).jpg)
- **作者 / 许可**：U.S. Naval History and Heritage Command photo 80-G-319661 · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×599（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `b221ce1d4e93a191…`
- **用途（role）**：`intro` · 归类 `uboat`
- **说明**：1945 年 5 月 11 日，U-541 在圣文森特角以西海面向英国驱逐舰马尔科姆号投降，照片摄自美军 PBY-5A 卡塔琳娜（美国国家档案馆 80-G-319661）。簿记差异：uboat.net 记投降日为 5 月 12 日于直布罗陀
- **注意**：美国海军 80-G 系列（NHHC 编号）。画面是从卡塔琳娜舷窗/机翼下拍摄的 U-541，机翼阴影在右上角——**不要裁掉**，它是「航空反潜」的语境。U-541 于 1945-05-11 向 HMS Malcolm 投降，投降时艇上悬挂白旗/黑旗。

### `u96-st-nazaire`

- **Commons**：[Bundesarchiv Bild 101II-MW-3712-04A, St. Nazaire, U-96 einlaufend.jpg](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_101II-MW-3712-04A,_St._Nazaire,_U-96_einlaufend.jpg)
- **作者 / 许可**：Schlemmer · [CC BY-SA 3.0 de](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en)
- **尺寸**：794×501（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `eb9bc1695a538902…`
- **用途（role）**：`uboat` · 归类 `uboat`
- **说明**：U-96 驶入圣纳泽尔：船员在码头列队，人群在混凝土掩体顶上看望。这艘 VII C 型艇共执行 11 次巡逻、击沉 27 艘商船，是狼群主力的代表（德国联邦档案馆 Bild 101II-MW-3712-04A，摄影 Schlemmer）
- **注意**：德国联邦档案馆 Bild 101II-MW-3712-04A，摄影 Schlemmer。**许可为 CC BY-SA 3.0 DE**：署名须写「Bundesarchiv, Bild 101II-MW-3712-04A / Schlemmer / CC-BY-SA 3.0」。本图常被误标为 U-96 的「返回母港」，Commons 标题为 `einlaufend`（进港），据此写「驶入圣纳泽尔」。

### `sunderland-convoy-1940`

- **Commons**：[A Short Sunderland Mk I flying boat of No. 210 Squadron RAF based at Oban in Scotland, patrols over a Canadian troop convoy on its way to Greenock, 31 July 1940. CH832.jpg](https://commons.wikimedia.org/wiki/File:A_Short_Sunderland_Mk_I_flying_boat_of_No._210_Squadron_RAF_based_at_Oban_in_Scotland,_patrols_over_a_Canadian_troop_convoy_on_its_way_to_Greenock,_31_July_1940._CH832.jpg)
- **作者 / 许可**：Stanley Devon · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×648（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `390e7c0d46735005…`
- **用途（role）**：`air` · 归类 `air`
- **说明**：1940 年 7 月 31 日，第 210 中队的桑德兰 Mk I（L2163「DA-G」）在苏格兰奥本外海为驶往格里诺克的加拿大运兵船队 TC.6 提供掩护（帝国战争博物馆 CH 832，摄影 Stanley Devon）
- **注意**：帝国战争博物馆 CH 832，摄影 Stanley Devon。1940-07-31，第 210 中队桑德兰 Mk I（L2163「DA-G」）为加拿大运兵船队 TC.6 护航。**这是运兵船队，不是反潜战例**，标注时不要写成「击沉 U 艇」。

### `u243-sunderland-attack`

- **Commons**：[German submarine U-243 under attack by Sunderland aircraft of No. 10 Squadron RAAF in the Bay of Biscay, 8 July 1944 (AWM 135145).jpg](https://commons.wikimedia.org/wiki/File:German_submarine_U-243_under_attack_by_Sunderland_aircraft_of_No._10_Squadron_RAAF_in_the_Bay_of_Biscay,_8_July_1944_(AWM_135145).jpg)
- **作者 / 许可**：RAAF Photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：640×464（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `8b4bce91ba2685dc…`
- **用途（role）**：`air` · 归类 `air`
- **说明**：1944 年 7 月 8 日，澳大利亚皇家空军第 10 中队的两架桑德兰在比斯开湾以西约 170 海里攻击 U-243；深水炸弹在艇尾激起水柱（澳大利亚战争纪念馆 AWM 135145）
- **注意**：澳大利亚战争纪念馆 AWM 135145（RAAF 摄）。深水炸弹水柱在艇尾，U-243 尚未下沉——这是**攻击瞬间**，不是击沉瞬间。原图仅 640 px 宽，是本批里分辨率最低的一张，事件卡里建议小尺寸使用。

### `liberator-leigh-light`

- **Commons**：[The Battle of the Atlantic 1939-1945 CH14001.jpg](https://commons.wikimedia.org/wiki/File:The_Battle_of_the_Atlantic_1939-1945_CH14001.jpg)
- **作者 / 许可**：Miller (F/O), Royal Air Force official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：800×539（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `f58f78c0f6a17313…`
- **用途（role）**：`air` · 归类 `air`
- **说明**：海岸司令部的一架解放者停在康沃尔圣埃瓦尔机场，机身被利式探照灯（Leigh Light）照亮。这种机载探照灯 1942 年起让夜间反潜从几乎无效变为有效（帝国战争博物馆 CH 14001）
- **注意**：帝国战争博物馆 CH 14001，摄影 F/O Miller。**夜间地面照**：解放者停在圣埃瓦尔，机身被 Leigh Light 照得发白。这不是空中作战照，caption 必须说明是地面试验/待命场景。

### `convoy-aerial-1941`

- **Commons**：[An aerial view of a convoy in the Atlantic, 1941. Two escorts can be seen in the foreground. C2647.jpg](https://commons.wikimedia.org/wiki/File:An_aerial_view_of_a_convoy_in_the_Atlantic,_1941._Two_escorts_can_be_seen_in_the_foreground._C2647.jpg)
- **作者 / 许可**：Royal Air Force official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×625（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `2cb02afd03f86e09…`
- **用途（role）**：`convoy` · 归类 `convoy`
- **说明**：1941 年北大西洋护航队的空中俯瞰：商船排成纵队，两艘护航舰在前方两侧（英国帝国战争博物馆 C 2647，皇家空军摄）
- **注意**：帝国战争博物馆 C 2647，皇家空军摄。1941 年北大西洋护航队的空中俯瞰，两艘护航舰在前景。**未标注具体队号与日期（只到年）**，不要编造 HX/SC 编号。

### `convoy-conference-1942`

- **Commons**：[A convoy conference in progress, August 1942. A11796.jpg](https://commons.wikimedia.org/wiki/File:A_convoy_conference_in_progress,_August_1942._A11796.jpg)
- **作者 / 许可**：Coote, R G G (Lt), Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×680（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `c9bd301895a856d1…`
- **用途（role）**：`convoy` · 归类 `convoy`
- **说明**：1942 年 8 月，一次出航前的护航队会议：商船船长与护航舰军官在同一张桌前核对队位、信号与应急程序；墙上贴着「No Smoking」告示（帝国战争博物馆 A 11796）
- **注意**：帝国战争博物馆 A 11796，摄影 Lt R. G. G. Coote。1942 年 8 月的护航队会议（船长与护航舰军官同桌）。墙上「No Smoking」告示可辨。可用于「护航制度如何运作」的解释性事件卡。

### `destroyers-escort-1941`

- **Commons**：[Destroyers on Convoy Escort Duty, October 1941 A5914.jpg](https://commons.wikimedia.org/wiki/File:Destroyers_on_Convoy_Escort_Duty,_October_1941_A5914.jpg)
- **作者 / 许可**：Royal Navy official photographer, Smith, J H (Lt) · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：800×627（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `4f5ec60b50e39118…`
- **用途（role）**：`escort` · 归类 `escort`
- **说明**：1941 年 10 月，老式 V 级驱逐舰 HMS Vanity（D 式迷彩）在护航队前方警戒；背景是商船队。位置据信在诺福克郡谢林厄姆外海（帝国战争博物馆 A 5914）
- **注意**：帝国战争博物馆 A 5914，摄影 Lt J. H. Smith。HMS Vanity（老式 V 级驱逐舰，D 式迷彩）在护航队前方。**位置为「据信」在诺福克谢林厄姆外海**，不是北大西洋中部，caption 里已注明「据信」。

### `hms-audacity`

- **Commons**：[HMS AUDACITY, 1941. FL1204.jpg](https://commons.wikimedia.org/wiki/File:HMS_AUDACITY,_1941._FL1204.jpg)
- **作者 / 许可**：Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×652（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `3b772cb320697875…`
- **用途（role）**：`carrier` · 归类 `carrier`
- **说明**：1941 年的护航航母 HMS Audacity。它由德国商船汉诺威号改装，是英国第一艘护航航母；1941 年 12 月 21 日在护航 HG-76 时被 U-751 击沉（帝国战争博物馆 FL 1204）
- **注意**：帝国战争博物馆 FL 1204。Audacity 原为德国商船 Hannover，改装成英国第一艘护航航母；1941-12-21 在 HG-76 护航中被 U-751 击沉。**它是「商船改装」的典型**，与后来的 Bogue 级不同。

### `hms-biter`

- **Commons**：[HMS Biter (D97) underway c1943.jpg](https://commons.wikimedia.org/wiki/File:HMS_Biter_(D97)_underway_c1943.jpg)
- **作者 / 许可**：Lt. S.J. Beadell, Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：800×620（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `2b34d05fdf5d7d53…`
- **用途（role）**：`carrier` · 归类 `carrier`
- **说明**：护航航母 HMS Biter 由商船改装，甲板上停着 Martlet 战斗机与剑鱼攻击机；1943–44 年它随猎杀群在中大西洋作战（帝国战争博物馆，摄影 S. J. Beadell）
- **注意**：帝国战争博物馆，摄影 Lt S. J. Beadell。Biter 也是商船改装（原 Rio Parana），甲板上是 Martlet 与剑鱼。1943–44 年随猎杀群行动。

### `hms-starling`

- **Commons**：[HMS Starling (U66) underway 1943.jpg](https://commons.wikimedia.org/wiki/File:HMS_Starling_(U66)_underway_1943.jpg)
- **作者 / 许可**：J. Hall, Ministry of Defence Foxhill Collection of Ship Photographs · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：757×554（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `3a410b59f464e666…`
- **用途（role）**：`escort` · 归类 `escort`
- **说明**：1943 年的 HMS Starling。这艘改进型黑天鹅级单桅帆船是沃克上校第 2 护航群的旗舰，1944 年 1 月随群在北大西洋作战（帝国战争博物馆，J. Hall 收藏）
- **注意**：帝国战争博物馆，J. Hall / 国防部 Foxhill 舰船照片收藏。改进型黑天鹅级单桅帆船，沃克上校第 2 护航群旗舰。**注意舰种是 sloop（单桅帆船），不是驱逐舰**，中文写「单桅帆船/护卫舰」时须与舰船卡一致。

### `western-approaches-plot`

- **Commons**：[The Operations Room at Derby House in Liverpool, the headquarters of the Commander-in-Chief Western Approaches, September 1944. A25746.jpg](https://commons.wikimedia.org/wiki/File:The_Operations_Room_at_Derby_House_in_Liverpool,_the_headquarters_of_the_Commander-in-Chief_Western_Approaches,_September_1944._A25746.jpg)
- **作者 / 许可**：Parnall, C H (Lt), Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×671（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `4878c9ac3c26c050…`
- **用途（role）**：`command` · 归类 `command`
- **说明**：1944 年 9 月，利物浦德比大厦西部海口司令部作战室：巨大的态势板上标着最新船位，一名皇家海军妇女服务队标图员正在梯子上修改标记（帝国战争博物馆 A 25746）
- **注意**：帝国战争博物馆 A 25746，摄影 Lt C. H. Parnall。1944-09 利物浦德比大厦作战室；画面里是巨大的船位态势板与梯子上的 WRNS 标图员。**这是 1944 年的作战室，不是 1943 年 5 月的同一房间**，用于「指挥体系」而非「黑色五月」的现场图。

### `map-west-point-atlantic`

- **Commons**：[The war in Western Europe and Battle of the Atlantic.jpg](https://commons.wikimedia.org/wiki/File:The_war_in_Western_Europe_and_Battle_of_the_Atlantic.jpg)
- **作者 / 许可**：Edward J. Krasnoborski · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×677（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `ac5946358645e9f4…`
- **用途（role）**：`map` · 归类 `map`
- **说明**：西点军校《美国战争地图集》第 46 图：轴心扩张（1939-09 至 1942-08）与同盟国反攻（1942-11 至 1944-06）的范围；左下角图例用符号标出各时段被 U 艇击沉的船只位置（最后一段至 1943 年 5 月）
- **注意**：美国西点军校《美国战争地图集》第 46 图（Edward J. Krasnoborski 绘，1959）。美国政府作品，公有领域。图上同时有「轴心扩张」「同盟国反攻」与「大西洋战役击沉点」三套符号，**是战后教学地图，不是当时的作战图**，caption 已注明。

### `doenitz-portrait`

- **Commons**：[Nazi Personalities- Grossadmiral Karl Doenitz (1891-1984) A14899.jpg](https://commons.wikimedia.org/wiki/File:Nazi_Personalities-_Grossadmiral_Karl_Doenitz_(1891-1984)_A14899.jpg)
- **作者 / 许可**：Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：623×799（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `696e07e35a8a8dec…`
- **用途（role）**：`leaders` · 归类 `leaders`
- **说明**：卡尔·邓尼茨，1935–1943 年任潜艇部队司令（BdU），1943 年 1 月接任海军总司令，1945 年 5 月成为德国国家元首（帝国战争博物馆 A 14899）
- **注意**：帝国战争博物馆 A 14899，皇家海军官方摄影。半身像，海军上将制服。**用作战犯/敌方统帅肖像时须加「德国海军总司令」的说明**，不要只写名字。

### `churchill-roosevelt-1941`

- **Commons**：[Winston Churchill with Franklin D. Roosevelt on board USS Augusta (CA-31) on 9 August 1941 (NH 67201).jpg](https://commons.wikimedia.org/wiki/File:Winston_Churchill_with_Franklin_D._Roosevelt_on_board_USS_Augusta_(CA-31)_on_9_August_1941_(NH_67201).jpg)
- **作者 / 许可**：佚名 · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×721（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `a762b9c861cbffbb…`
- **用途（role）**：`conference` · 归类 `conference`
- **说明**：1941 年 8 月 9 日，丘吉尔与罗斯福在纽芬兰阿真舍湾的美国重巡洋舰奥古斯塔号上会面；《大西洋宪章》随后于 8 月 14 日公布（美国海军 NH 67201）
- **注意**：美国海军 NH 67201。1941-08-09 奥古斯塔号上：丘吉尔、罗斯福，罗斯福之子 Elliott（陆军上尉）与 Franklin Jr.（海军少尉）在侧。**这是会议首日**，宪章 8-14 才公布。

### `atlantic-conference-service-1941`

- **Commons**：[President Roosevelt and Winston Churchill seated on the quarterdeck of HMS PRINCE OF WALES for a Sunday service during the Atlantic Conference, 10 August 1941. A4816.jpg](https://commons.wikimedia.org/wiki/File:President_Roosevelt_and_Winston_Churchill_seated_on_the_quarterdeck_of_HMS_PRINCE_OF_WALES_for_a_Sunday_service_during_the_Atlantic_Conference,_10_August_1941._A4816.jpg)
- **作者 / 许可**：Leslie Cornish Priest · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×641（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `26487bf4f0e6ab22…`
- **用途（role）**：`conference` · 归类 `conference`
- **说明**：1941 年 8 月 10 日，罗斯福与丘吉尔在威尔士亲王号战列舰后甲板参加礼拜，身后是美国海军金上将与斯塔克上将；大西洋会议在此舰与奥古斯塔号之间往返举行（帝国战争博物馆 A 4816）
- **注意**：帝国战争博物馆 A 4816，摄影 Leslie Cornish Priest。1941-08-10 威尔士亲王号后甲板礼拜，身后是金上将与斯塔克上将。**这是礼拜场景，不是签约场景**——大西洋宪章没有签字仪式。

### `u110-and-bulldog`

- **Commons**：[U-110 and HMS Bulldog.jpg](https://commons.wikimedia.org/wiki/File:U-110_and_HMS_Bulldog.jpg)
- **作者 / 许可**：Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：760×316（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `e9ce7b05496c0917…`
- **用途（role）**：`enigma` · 归类 `enigma`
- **说明**：1941 年 5 月 9 日，U-110 在冰岛以南攻击 OB-318 后被护航舰逼出水面；驱逐舰 HMS Bulldog 靠帮，恩尼格玛机与密码表落入英军之手（皇家海军官方照片）
- **注意**：皇家海军官方照片。1941-05-09 U-110 被逼出水面，HMS Bulldog 靠帮；恩尼格玛与密码表由此缴获。**画面里 U-110 已在下沉/被弃**，不是「战斗进行中」。

### `enigma-machine`

- **Commons**：[EnigmaMachine.jpg](https://commons.wikimedia.org/wiki/File:EnigmaMachine.jpg)
- **作者 / 许可**：Karsten Sperling , http://spiff.de/photo · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×1200（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `9be95c50c52a8885…`
- **用途（role）**：`enigma` · 归类 `enigma`
- **说明**：恩尼格玛密码机（伦敦帝国战争博物馆藏）。U 艇自 1942 年 2 月起换用四转子 M4，一度让盟军破译失明十个月（摄影 Karsten Sperling，公有领域）
- **注意**：摄影 Karsten Sperling（PD-self）。伦敦帝国战争博物馆藏的恩尼格玛，木箱打开、面板可见。**这是三转子商用/陆军型的展示机**；U 艇 1942-02 起用四转子 M4，两者外观近似但不能说「这就是 U 艇那台」。

### `dixie-arrow-torpedoed`

- **Commons**：[Allied tanker torpedoed.jpg](https://commons.wikimedia.org/wiki/File:Allied_tanker_torpedoed.jpg)
- **作者 / 许可**：U.S. Navy (photo 80-G-43376) · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×650（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `e63a19c0139d744a…`
- **用途（role）**：`loss` · 归类 `loss`
- **说明**：1942 年 3 月 26 日晨，美国油轮 Dixie Arrow 在哈特拉斯角外被 U-71 鱼雷击中，船体燃烧断裂，当晚沉没；33 名船员中 22 人获救（美国国家档案馆 80-G-43376）
- **注意**：美国国家档案馆 80-G-43376。1942-03-26 油轮 Dixie Arrow 在哈特拉斯角外被 U-71 击沉，船体断裂燃烧。**这是美国东岸「第二次欢乐时光」的标志性照片**，与 Drumbeat 事件卡配对。

### `mulberry-arromanches`

- **Commons**：[The Mulberry artificial harbour at Arromanches in Normandy, June 1944. A24675.jpg](https://commons.wikimedia.org/wiki/File:The_Mulberry_artificial_harbour_at_Arromanches_in_Normandy,_June_1944._A24675.jpg)
- **作者 / 许可**：Allen, E E (Lt), Royal Navy official photographer · [Public domain](https://creativecommons.org/publicdomain/mark/1.0/)
- **尺寸**：900×607（本地 WebP，最长边 ≤ 900 px）· sha256 前 16 位 `a3034df558795a16…`
- **用途（role）**：`normandy` · 归类 `normandy`
- **说明**：1944 年 6 月，诺曼底阿罗芒什的桑葚人工港 B 开始运转；跨海峡补给的成败直接决定登陆后能否站稳（帝国战争博物馆 A 24675）
- **注意**：帝国战争博物馆 A 24675，摄影 Lt E. E. Allen。1944-06 阿罗芒什桑葚 B 港开始运转。**它是登陆后的补给设施，不是登陆当日**；与「诺曼底与海峡」事件卡配对，说明跨海峡补给的脆弱性。

## 3. 已考虑但未采用的图（附理由）

| 候选 | 理由 |
|---|---|
| `File:Battle of the Atlantic (WW2) - German submarines lost-en.svg` | 现代统计图（CC BY-SA 3.0），数字口径为制作者自绘；统计图应由本项目按来源表自行生成，以免二次引用失真 |
| `File:The battle of the Atlantic 1941 map.svg` | 现代重绘示意图（CC BY-SA 4.0）。虽是可靠的地理示意，但**不是档案地图**；本战役已有西点军校的官方战役图，且控制区几何由本项目自绘 |
| `File:U-Boat 110, a general view looking aft (8770771018).jpg` | Tyne & Wear 档案的 **1918 年 UB-110**，与 1941 年的 U-110 同名不同艇，极易误用 |
| `File:Karl Dönitz.jpg` | 许可为 PD 但**作者与出处字段为空**，Commons 上无可靠来源链；改用 IWM A 14899（皇家海军官方摄影） |
| `File:Bundesarchiv Bild 146-1976-127-06A, Karl Dönitz.jpg` | Heinrich Hoffmann 摄，许可 CC BY-SA 3.0 DE 可用；但原图仅 480 px 宽，且 Hoffmann 为希特勒御用摄影师，来源说明成本更高 |
| `File:WW2 German Navy U-boat ... U-BOAT SURRENDER LISAHALLY 1945.jpg` 系列 | 文件名与元数据混乱、作者与年代不明，许可无法逐条确证 |
| `File:Enigma Machine at NSA.jpg` | 许可 PD 但仅 450×600，且与已选的 `EnigmaMachine.jpg` 重复；保留分辨率更高的后者 |
| `File:Kenngruppenheft.jpg` | CC BY-SA 3.0，内容极佳（U-505 缴获的识别组手册），但画面是纯文字表格，缩到 900 px 后几乎不可读；改用「护航队会议」补足制度叙事 |
| IWM / NHHC 官网原图直链 | 本机 DNS 无法解析 `history.navy.mil`，IWM 站点对自动化请求返回 403；改用 Commons 上同编号（A 25746、80-G-319661 等）的公版副本，并在署名中保留馆藏号 |

## 4. 复现与校验

```bash
# 下载并重建索引（已存在且合规的 webp 跳过下载）
.venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/fetch_photos.py

# 只校验，不下载（CI/审查用）
.venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/fetch_photos.py --verify-only
```

脚本行为：

- 批量查询 `action=query&prop=imageinfo&iiprop=url|size|mime|extmetadata`，`iiurlwidth=1000` 取缩略图；
- `commons.license_ok()` 过滤许可（拒绝 NC/ND/GFDL-only/合理使用）；
- 下载后转 RGB、等比缩到 ≤ 900 px、`WEBP quality=82 method=6`；
- 解码回读校验格式与宽度；目录里出现未登记的 webp 会报错（避免残留死图）；
- 索引只保留脚本管理的条目，`credits.json` 的 `photos` 段由同一批数据生成（含 sha256，便于逐字节复核）。

## 5. 与事件卡的对接

`data/events.json` 的事件这样引用（`photo.commons` 必须是下表第一列的**完整 Commons 标题**，含 `File:` 前缀与扩展名）：

```json
{ "id": "e.drumbeat", "at": "1942-03-26T12:00", "category": "naval",
  "photo": { "commons": "File:Allied tanker torpedoed.jpg",
             "caption": "1942 年 3 月 26 日，油轮 Dixie Arrow 在哈特拉斯角外被 U-71 击沉" } }
```

引擎侧：`engine/ui/eventCard.ts` 的 `loadPhotoIndex()` 读取 `photos/index.json`，`photoFor(commons)` 按文件名取 `src`、`author`、`license`、`sourceUrl`；缺图时卡片静默不显示照片，不会报错。

**建议配对**（事件 → 照片）：

| 事件/主题 | 照片（slug） |
|---|---|
| 1939-09 开战与封锁 | `destroyers-escort-1941` |
| 1940-07 加拿大运兵船队 TC.6 | `sunderland-convoy-1940` |
| 1941 年护航队与空中掩护 | `convoy-aerial-1941` |
| 1941-05-09 U-110 被俘 | `u110-and-bulldog` |
| 1941-05 起的密码战 | `enigma-machine` |
| 1941-08-09/10 大西洋会议 | `churchill-roosevelt-1941` |
| 1941-08-10 礼拜（会议场景） | `atlantic-conference-service-1941` |
| 1941-12-21 Audacity 被击沉 | `hms-audacity` |
| 1942 Drumbeat 美国东岸 | `dixie-arrow-torpedoed` |
| 1942-08 护航队会议（制度） | `convoy-conference-1942` |
| 1943-03 大西洋护航会议 | `western-approaches-plot` |
| 1943-04 ONS 5 / 猎杀群 | `hms-biter` |
| 1943-05 黑色五月与胜利统计 | `hms-starling` |
| 1943-05 战役总图（档案地图） | `map-west-point-atlantic` |
| 1944-06 诺曼底与跨海峡补给 | `mulberry-arromanches` |
| 1944-07-08 U-243 被桑德兰攻击 | `u243-sunderland-attack` |
| 1944 夜间反潜（Leigh Light） | `liberator-leigh-light` |
| 1945-05 受降（开场/收束） | `u541-surrendered-1945` |
| 邓尼茨人物卡 | `doenitz-portrait` |

