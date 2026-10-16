# 敦刻尔克大撤退（dunkirk-1940）· 冻结契约 v1

> 本文是所有写手的**唯一真源**。任何字段、id、时刻、坐标如与本文冲突，以本文为准。
> 需要修改契约时**只能由 Lead 修改本文并广播**，写手不得自行更改共享 id。

## 1. 战役基本设定

| 项 | 值 |
|---|---|
| id | `dunkirk-1940` |
| 目录 | `campaigns/dunkirk-1940/`、`public/campaigns/dunkirk-1940/` |
| 标题 | 敦刻尔克大撤退 / The Dunkirk Evacuation / **发电机行动（Operation Dynamo）** |
| 时段 | `epoch` **1940-05-22T00:00**；`start` 1940-05-26T00:00；`end` **1940-06-04T14:23**（海军部终止电报时刻）；`dataEnd` **1940-06-04T23:59**（epoch 早于 start 是为了容纳加来 5-23、布洛涅 5-22 这两个围城口袋） |
| 叙事时区 | 英国夏令时 BST（UTC+1）；`utcOffset: 1` |
| 播放速率 | `hoursPerSec: 6`；`pace`：05-26 起 6 h/s；05-28T00:00 起 3；05-29T00:00 起 3；06-01T00:00 起 1.5；06-03T20:00 起 0.6 |
| 画布 | `config/frame.json`：4096×3044，`bbox [0.55, 49.92, 4.62, 51.85]`，0.0711 km/单位，场 512×381 |

## 2. 阵营

| id | 前缀 | 名称 | coalition | 控制区槽位 | 掩膜比特（`masks.bits`） |
|---|---|---|---|---|---|
| `DE` | `de` | 德国 | axis | **槽 A** `DE`（德占区） | 1（德国+荷兰，已由德军控制）、6（其余陆地） |
| `GB` | `gb` | 英国 | allies | 槽 B `AL`（同盟国控制）—— **本轮不写入，保持为空** | 2（英国本土） |
| `FR` | `fr` | 法国 | allies | — | 3（法国本土） |
| `BE` | `be` | 比利时 | allies | — | 0（比利时 + 法国，即战区） |

`control`：

```json
{
  "mode": "territory",
  "landBit": 4,
  "theatreBits": [0],
  "slots": [
    { "key": "DE", "label": "德军控制区", "homeBits": [1, 6] },
    { "key": "AL", "label": "（第二占领槽，敦刻尔克战役不用）", "homeBits": [2, 3] }
  ],
  "remainder": { "label": "同盟国控制" }
}
```

- **战区 = 比特 0**（比利时 + 法国）。英、法本土（比特 2、3）是 `homeBits`，不画成占领区。
- 槽 A 的多边形可以粗略越过海岸线：引擎会裁剪到战区陆地。
- **凡写到 `fronts/*.json` 的地方，只写 `"DE"` 槽**；`AL` 槽一律留空。

## 3. 地名 id

全部地名在 `data/gazetteer/places.json`。**写数据只能用这里已有的 id**（`@id`）；需要新地名时报给 Lead，由 Lead 统一追加，避免重复 id 冲突。

关键 id（若需查全部，直接读 places.json）：

- 敦刻尔克市区与港口：`dunkirk` `dunkirk_port` `east_mole` `west_mole` `dunkirk_roads` `malo_les_bains` `fort_des_dunes` `coudekerque` `saint_pol`
- 海滩与滨海村镇：`bray_dunes` `zuydcoote` `leffrinckoucke` `loon_plage` `gravelines` `petit_fort_philippe` `la_panne` `koksijde` `oostduinkerke` `nieuwpoort`
- 内圈城镇：`bergues` `hoymille` `tetegham` `uxem` `ghyvelde` `warhem` `hondschoote` `killem` `rexpoede` `esquelbecq` `wormhout` `ledringhem` `socx` `bollezeele` `spycker` `brouckerque` `bourbourg` `armbouts_cappel` `cappelle_la_grande` `grande_synthe` `fort_mardyck`
- 外围战场：`cassel` `mont_cassel` `hazebrouck` `saint_omer` `watten` `aire_sur_la_lys` `estaires` `merville` `le_paradis` `bethune` `la_bassee` `lille` `armentieres` `bailleul` `nieppe_forest` `mont_des_cats` `mont_noir` `poperinge` `vlamertinge` `ieper` `mesen` `ploegsteert` `comines` `menen` `kortrijk` `waregem` `roeselare` `tielt` `deinze` `gent` `eeklo` `aalter` `maldegem` `ursel` `brugge` `oostende` `zeebrugge` `diksmuide` `veurne` `adinkerke`
- 运河与河流：`lys_river` `yserre` `canal_la_bassee` `lys_canal` `canal_de_la_colme` `canal_de_bergues` `canal_de_dunkerque` `canal_de_la_moere` `aa_river` `scarpe_river` `meuse_river` `brugge_gent_canal` `gent_terneuzen_canal` `nieuport_canal` `les_moeres`
- 英方（出发地）：`dover` `dover_castle` `ramsgate` `margate` `broadstairs` `deal` `the_downs` `sandwich` `sheerness` `thames_estuary` `southend` `harwich` `felixstowe` `kent` `goodwin_sands` `channel_narrows` `ruytingen_bank`
- 机场：`hawkinge` `manston` `hornchurch` `biggin_hill` `north_weald` `debden` `tangmere` `kenley` `dunkirk_airfield` `merville_airfield` `saint_omer_airfield` `abbeville_airfield` `lille_airfield` `cambrai_airfield` `laon_couvron` `ursel`（比）`brussels_airfield`
- 战略后方：`sedan` `stonne` `bulson` `montcornet` `laon` `saint_quentin` `arras` `lens` `douai` `cambrai` `valenciennes` `mons` `brussel` `leuven` `namur` `luik` `maastricht` `aalst` `oudenaarde` `doornik` `ath` `dendermonde` `lokeren` `sint_niklaas` `antwerpen` `terneuzen` `vlissingen` `schelde_estuary`
- 首脑与指挥所：`berlin` `zossen` `paris` `vincennes` `london` `whitehall` `uxbridge` `stanmore`

## 4. 前线时刻表（Lead 用它生成 `data/fronts/`；写手据此摆轨迹）

**德军控制区（槽 `DE`）的南/西界，按时刻**。写法 = 界线上由西向东的锚点（`@id`）；界线以北/以西为德军控制。

| 时刻（at） | 界线锚点（西→东） | 事件 |
|---|---|---|
| `1940-05-26T00:00` | `@gravelines` `@saint_omer` `@cassel` `@hazebrouck` `@armentieres` `@menen` | 加来仍在围城；盟军守格拉沃利讷—利斯河一线 |
| `1940-05-26T00:00` | `@gravelines` `@saint_omer` `@aire_sur_la_lys` `@estaires` `@armentieres` `@menen` `@kortrijk` `@oudenaarde` `@gent` `@terneuzen` | 开战帧：加来仍在围城中（战线在其南侧绕行） |
| `1940-05-27T12:00` | `@gravelines` `@bollezeele` `@cassel` `@mont_des_cats` `@ploegsteert` `@menen` | 德军在维茨哈特、波珀灵厄进攻；盟军退向卡塞尔—黑山 |
| `1940-05-26T16:00` | 同上（加来口袋消失） | 加来守军 16:00 前后投降（`transition: step`） |
| `1940-05-27T12:00` | `@gravelines` `@bollezeele` `@cassel(m)` `@mont_des_cats` `@bailleul` `@menen` `@kortrijk` `@waregem` `@deinze` `@gent` `@terneuzen` | 利斯河防线被突破 |
| `1940-05-28T06:00` | `@bourbourg` `@bollezeele` `@cassel(m)` `@poperinge` `@ieper` `@kortrijk` `@waregem` `@deinze` `@gent` `@terneuzen` | 比利时 04:00 投降；德军进入伊珀尔、波珀灵厄 |
| `1940-05-28T23:00` | `@bourbourg` `@spycker` `@bergues` `@veurne` `@diksmuide` `@tielt` | 英军退入敦刻尔克桥头堡（运河线） |
| `1940-05-29T12:00` | `@bourbourg` `@spycker` `@bergues` `@veurne` `@diksmuide` `@tielt` | 卡塞尔（29 日）陷落；桥头堡初成 |
| `1940-05-30T12:00` | `@bourbourg` `@spycker` `@bergues` `@veurne` `@diksmuide` `@gent` | 桥上阵地试探进攻 |
| `1940-05-31T12:00` | `@bourbourg` `@spycker` `@bergues` `@veurne` `@diksmuide` `@gent` | 里尔法军 35,000 人投降（荣誉受降） |
| `1940-06-01T12:00` | `@loon_plage` `@spycker` `@hoymille` `@ghyvelde` `@adinkerke` `@nieuwpoort` | 德军猛攻贝尔格；东段退向尼乌波特 |
| `1940-06-02T22:00` | `@loon_plage` `@armbouts_cappel` `@hoymille` `@uxem` `@bray_dunes` `@la_panne` … | 贝尔格（2 日夜）陷落（`transition: step`） |
| `1940-06-03T12:00` | `@loon_plage` `@cappelle_la_grande` `@coudekerque` `@malo_les_bains` `@la_panne` | 桥头堡压缩到城郊；夜撤法军 |
| `1940-06-04T10:00` | 整幅画布矩形（无缺口） | 法军 09:00 投降；德军进占敦刻尔克与港区（`transition: step`） |

控制区多边形由 `pipeline/build/build_fronts.py` 由这张表生成（每帧一个粗略多边形：包住画布的大矩形 + 桥头堡缺口）。
锚点带 `(m)` 表示是「支点绕行点」（卡塞尔、贝尔格等仍在盟军手中的据点，战线从其南侧绕过，用字面经纬度写）。
**上表与 `data/fronts/` 实际文件一一对应**；脚本每次运行都会重算几何并检查自交、有效性、以及「哪些地方必须在德军控制区内／必须在桥头堡内」。

## 5. 部队 id 与编制（写手必须用这些 id）

### 5.1 德军（DE）

```
de.ob_west        OKW / 西线总司令
de.hgr_a          A 集团军群（Rundstedt）—— Kleist 装甲集群与第 4 集团军均隶属之
de.hgr_b          B 集团军群（von Bock）
de.a18            第 18 集团军（von Küchler）
de.a6             第 6 集团军（von Reichenau）
de.a4             第 4 集团军（von Kluge）
de.pg_kleist      Kleist 装甲集群（von Kleist，隶属 A 集团军群，独立作战层级）
de.xix            XIX 摩托化军（Guderian）
de.xli            XLI 摩托化军（Reinhardt）
de.xiv            XIV 摩托化军（von Wietersheim）
de.xxvi           XXVI 军（Wodrig）
de.ix             IX 军（Geyer）
de.viii           VIII 军（Heitz）—— 5-24 停止前进令中点名等待的步兵军之一
de.ii             II 军（Strauss）
de.x              X 军（Christian Hansen 炮兵上将）
de.xliii?         —— 不用
de.1pz            第 1 装甲师（Kirchner）
de.2pz            第 2 装甲师（Veiel）
de.6pz            第 6 装甲师（Kempf）
de.8pz            第 8 装甲师（Kuntzen）
de.10pz           第 10 装甲师（Schaal）
de.9pz            第 9 装甲师（Hubicki，随 18 集团军）
de.gd             「大德意志」摩托化步兵团
de.2id_mot        第 2 摩托化步兵师
de.13id_mot       第 13 摩托化步兵师
de.20id_mot       第 20 摩托化步兵师
de.29id_mot       第 29 摩托化步兵师
de.sstk           SS「骷髅」师
de.3id            第 3 步兵师
de.23id           第 23 步兵师
de.24id           第 24 步兵师
de.32id           第 32 步兵师
de.61id           第 61 步兵师
de.216id          第 216 步兵师
de.253id          第 253 步兵师
de.254id          第 254 步兵师
de.256id          第 256 步兵师
de.267id          第 267 步兵师
de.lw2            第 2 航空队（Kesselring，指挥部）
de.lw3            第 3 航空队（Sperrle，指挥部）
de.viii_fk        VIII 航空军（von Richthofen）
de.kg2            KG 2「霍尔茨豪尔」轰炸机联队
de.kg3            KG 3「闪电」轰炸机联队
de.kg54           KG 54「黑狮」轰炸机联队
de.stg2           StG 2「殷麦曼」俯冲轰炸机联队
de.jg26           JG 26「施拉格特」战斗机联队
de.jg27           JG 27 战斗机联队
de.zg26           ZG 26 重型战斗机联队
```

### 5.2 英国远征军（GB）

```
gb.ghq            BEF 总司令部（Lord Gort VC）
gb.i_corps        I 军（Dill → Barker）
gb.ii_corps       II 军（Brooke）
gb.iii_corps      III 军（Adam）
gb.1div           第 1 师
gb.2div           第 2 师
gb.3div           第 3 师（Montgomery）
gb.4div           第 4 师
gb.5div           第 5 师
gb.42div          第 42（东兰开夏）师
gb.44div          第 44（本土郡）师
gb.46div          第 46（北米德兰）师
gb.48div          第 48（南米德兰）师
gb.50div          第 50（诺森伯兰）摩托化师
gb.23div          第 23（诺森伯兰）师
gb.12div          第 12（东部）师
gb.1armd          第 1 装甲师（Evans）
gb.51div          第 51（高地）师（索姆河以南，圣瓦莱里被俘）
gb.30bde          第 30 步兵旅（加来，Nicholson）
gb.20gds_bde      第 20 近卫旅（布洛涅，Fox-Pitt）
gb.beauman        Beauman 师（临时编成）
gb.polforce       Polforce（波兰旅级）
gb.12lancers      第 12 枪骑兵团
gb.mg_bn          机枪营群（第 1/7 米德尔塞克斯等）
gb.iaf            「坚固」防线部队/要塞群
gb.raf_ac         RAF 驻法航空队（Air Component，Bowhill 指挥部）
gb.11group        RAF 第 11 大队（Park）
gb.no1sqn         第 1 中队（飓风）
gb.no17sqn        第 17 中队（飓风）
gb.no19sqn        第 19 中队（喷火）
gb.no32sqn        第 32 中队（飓风）
gb.no54sqn        第 54 中队（喷火）
gb.no64sqn        第 64 中队（喷火）
gb.no74sqn        第 74 中队（喷火）
gb.no92sqn        第 92 中队（喷火）
gb.no145sqn       第 145 中队（飓风）
gb.no213sqn       第 213 中队（飓风）
gb.no222sqn       第 222 中队（喷火）
gb.no601sqn       第 601 中队（飓风）
gb.no605sqn       第 605 中队（飓风）
gb.dover_cmd      Dover 指挥部（Ramsay 海军中将，指挥部）
gb.force_a        Force A / 海滩海军岸勤（Tennant 上校）
```

海军的**舰船**单位另列，见 §7。

### 5.3 法国（FR）

```
fr.gqg_nord      北方集团军群 / 北方军（Billotte → Blanchard，指挥部）
fr.abrial        北方法国部队最高指挥（Abrial 海军上将，敦刻尔克）
fr.1ca          第 1 军（Prioux）
fr.2ca          第 2 军
fr.3ca          第 3 军
fr.4ca          第 4 军
fr.5ca          第 5 军（Lille 口袋）
fr.16ca         第 16 军（Fagalde）
fr.12dim        第 12 摩托化步兵师（Janssen）
fr.25dim        第 25 摩托化步兵师
fr.1dim         第 1 摩托化步兵师
fr.15dim        第 15 摩托化步兵师
fr.1di          第 1 步兵师
fr.2dlm         第 2 轻型机械化师（4 June 投降）
fr.3dlm         第 3 轻型机械化师
fr.4dina        第 4 北非步兵师
fr.21di         第 21 步兵师
fr.60di         第 60 步兵师
fr.68di         第 68 步兵师（4 June 投降）
fr.262di        第 262 步兵师（Lutfalla，贝尔格—敦刻尔克核心阵地）
fr.110ri        第 110 步兵团
fr.127ri        第 127 步兵团
fr.137ri        第 137 步兵团
fr.1rtm         第 1 摩洛哥步兵团
fr.sect_fort    佛兰德要塞区（Secteur Fortifié de Flandres）
fr.marine       敦刻尔克海军守备队
fr.aerienne     法国空军北部部队（Armée de l'Air / Zone d'Opérations Aériennes Nord）
```

### 5.4 比利时（BE）

```
be.ghq            比利时陆军总司令部（Léopold III / Michiels）
be.1ca            第 1 军
be.2ca            第 2 军
be.3ca            第 3 军
be.4ca            第 4 军
be.5ca            第 5 军
be.6ca            第 6 军
be.7ca            第 7 军
be.1div … be.18div  第 1–18 步兵师（只写实际出现在战役窗口内的：4、5、6、7、9、10、11、12、13、15、16、17、18 等）
be.chasseurs      阿登猎兵师
be.cav            骑兵军（2 个骑兵师）
be.air            比利时航空队（Aéronautique Militaire）
```

## 6. 文件归属（写手只写自己的文件，绝不改别人的）

| 文件 | 归属 | 说明 |
|---|---|---|
| `campaign.json` | **Lead** | 清单、阶段、图例、简报、导演、总台卷宗 |
| `data/fronts/*.json` | **Lead** | 控制区关键帧（按 §4 时刻表） |
| `data/gazetteer/places.json` | **Lead** | 地名 |
| `data/sources/*.json` | **Lead** | 来源 |
| `data/oob/de.json` | 写手 A（德军） | 德军编制与轨迹 |
| `data/routes/de.json` | 写手 A | 德军推进路线 |
| `data/oob/gb.json`、`data/routes/gb.json` | 写手 B（英军） | BEF 编制、路线、加来/布洛涅守军 |
| `data/oob/fr.json`、`data/routes/fr.json` | 写手 C（法比） | 法军编制与路线 |
| `data/oob/be.json`、`data/routes/be.json` | 写手 C | 比军编制与路线 |
| `data/events.json` | **Lead 合并**；写手交到 `pipeline/events/<分区>.json` | 见 §8 |
| `data/naval/*.json`、`data/oob/sea.json`、`data/routes/sea.json` | 写手 D（海军） | 舰船与海战数据 |
| `data/equipment.json` | 写手 D | 装备卡 |
| `data/forces.json` | 写手 D | 兵力概况（数字口径来自研究） |
| `data/pockets.json` | 写手 A（德军） | 包围圈 |
| `data/demarcation.json` | Lead | 分界线 |
| `data/overlays.json` | 写手 B | 防线、机场、雷达圈等叠加层 |
| `campaigns/dunkirk-1940/tests/*.test.ts` | 写手 E（验证） | 战役测试 |
| `public/campaigns/dunkirk-1940/photos/*`、`index.json`、`credits.json` | 写手 E | 照片与署名 |

**写手 E（验证）不做业务数据写入**，只做测试、照片、`npm run fonts` 与校验复核。

## 7. 海军层（写手 D）

海战层由引擎自动启用（存在 `unit.ship` 或 `data/naval/*.json` 即可）。建议：

- `data/oob/sea.json`：舰船单位，`echelon: "ship"`、`type: "naval"`、`ship: {...}`。
  必写（有史可考的关键舰）：`gb.malaya`（防空巡洋舰，HMS Malaya？—— 实为 **HMS Calcutta / HMS Coventry** 防空巡洋舰）、
  `gb.wakeful` `gb.grafton` `gb.grenade` `gb.havant` `gb.basilisk` `gb.keith` `gb.ivanhoe` `gb.esk` `gb.express` `gb.shikari` `gb.winchelsea` `gb.wolsey` `gb.whitshed` `gb.sabre` `gb.venomous` `gb.mackay` `gb.montrose` `gb.vimy` `gb.vega` `gb.windsor`；
  扫雷舰 `gb.halcyon`；运输船 `gb.lancastria`（6 月 17 日，圣纳泽尔，用于尾声）；拖船/小艇用 `gb.mas}` 等。
  **简化原则**：不必逐条建 40 艘驱逐舰；建 8–14 艘关键舰 + 若干代表船（drifter、trawler、paddle steamer、little ship）。
- `data/naval/dynamo.json`：`signals`（电文纸带：Dynamo 启动令、Tennant「把船靠上防波堤」、撤退终止令、Churchill 电报）+ `damage`（Grafton 被鱼雷、Grenade 被炸沉、Havant 自沉、Wakeful 被 S-30 击沉）+ `hits`（29 日空袭）。
- 海战战役建议 `naval.tacticalZoom: 9`、`map.maxZoom: 60`、`map.hexKm: 0`（跨海战区）。
- 航线（`data/routes/sea.json`）：**Route Z**（敦刻尔克→加来沿岸→多佛，55 km，最短）、
  **Route X**（经 Ruytingen Pass→North Goodwin 灯船→绕古德温沙洲南行，95 km，最安全）、
  **Route Y**（沿法国海岸至 Bray-Dunes→东北至 Kwinte 浮标→转向西至 North Goodwin，175 km，最险）。
  三条路线都要有 26 日起的多条平行航迹（可用 3–6 条不同船的代表航迹）。

## 8. 事件（写手分区交稿，Lead 合并）

**id 必须唯一、以 `e.dk_` 开头**，分区前缀：

- 写手 A（德军/阿登/推进）：`e.dk_de_*`
- 写手 B（英军/加来/布洛涅/空中）：`e.dk_gb_*`
- 写手 C（法比/里尔口袋）：`e.dk_fr_*`、`e.dk_be_*`
- 写手 D（海上/撤离小艇）：`e.dk_nv_*`
- Lead（总纲、政治、投降）：`e.dk_*`

验收：`body` 为**中文 80–140 字**；`at` 在 1940-05-26T00:00 – 1940-06-04T23:59；`place` 必须是 `@现有地名`；
`category ∈ battle|air|naval|political|atrocity|movement|surrender|siege`；`importance ∈ 1|2|3`；
`sources` 引用 `data/sources/main.json` 的 id；`confidence ∈ high|medium|low`。
写手把事件写到 `campaigns/dunkirk-1940/pipeline/events/<分区>.json`（数组），Lead 合并进 `data/events.json` 后删除临时文件。

## 9. 硬性校验约束（写手自检清单）

1. `sources` 至少 1 条且 id 必须在 `data/sources/main.json` 中真实存在（**不能用没写的 id**）。
2. `place` / `pos` 只能用 `@id` 或 `[lon, lat]`；`@id` 必须存在于地名库。
3. 轨迹时间**严格递增**；地面部队日行程：步兵 ≤45、摩托化/装甲 ≤100、hq ≤120 km/天（引擎按 WARN 报）。
4. 路线 `waypoints` 至少 2 点、时间严格递增；id 形如 `r.dk_*`（`^r\.[a-z0-9_.-]+$`）。
5. 部队 id 前缀必须与阵营一致；`parent` 必须存在且阵营一致。
6. `unit.name.short` 必填（棋子标签）。
7. 事件正文长度 80–140 字（`manifest.validation.bodyLength` 可放宽，但尽量守住）。
8. 关键帧文件名 = `at` 的冒号换成连字符（Lead 负责）。
9. 3D `model` 只能用已注册 id（见 `engine/three/models/specs.ts`；步兵用 `inf_gb`/`inf_de`，英军装甲用 `pz1` 示意、法军用 `inf_pl` 示意）。
10. 任何 JSON 都要能被 `node -e "require(...)"` 解析（无注释、无尾逗号）。

## 10. 数值口径（引用时写进 `forces.json` 的 note）

- 总撤离人数 **338,226**（其中英国及帝国部队约 198,000；法国约 123,000，其中约 102,250 由英舰运出；比利时约 15,000–16,000 经敦刻尔克撤出，另约 33,000 经比利时港口撤出）。
- 每日登船：5-27 7,669；5-28 17,804；5-29 47,310；5-30 53,823；5-31 68,014；6-1 64,429；6-2 26,256；6-3 26,746；6-4 26,175。
  海滩 98,671 / 港口 239,555。
- BEF 战役伤亡（5-10 至 6-22）：约 68,000，其中阵亡 3,500、负伤 13,053、其余被俘/失踪；被俘约 40,000。
- 装备损失：火炮 2,472 门、摩托车 20,000 辆、其他车辆近 65,000 辆、坦克 445 辆几乎全部。
- 船只：英方驱逐舰沉 6 艘、法方驱逐舰沉 3 艘；其他大型船只沉 9 艘；驱逐舰伤 19 艘；200 余艘英方与盟方船只被击沉、数目相近者受伤。
- 空军：RAF 损失 145 架（喷火至少 42 架）；Luftwaffe 在 9 天行动中损失 156 架。
- 加来守军 4,000（30 步兵旅 + 皇家坦克团 + 来复枪旅等），4 天抵抗后 5-26 投降。
- 里尔口袋：法军 35,000 余人 5-31 投降，受荣誉受降。
- 敦刻尔克桥头堡最终被俘法军约 40,000 人（6-4）。

## 11. 增补与冻结决定（Lead）

### 11.1 阶段 id（campaign.json 已冻结，`forces.byPhase` 用这三个键）

| id | from | to | name / short / sub |
|---|---|---|---|
| `p.launch` | 1940-05-26T00:00 | 1940-05-28T00:00 | 第一阶段 · 发电机启动 / 发电机启动 / 加来陷落；第一批部队从敦刻尔克港登船 |
| `p.crisis` | 1940-05-28T00:00 | 1940-06-01T00:00 | 第二阶段 · 桥头堡与海滩 / 桥头堡与海滩 / 比利时投降、利斯河防线崩溃；东防波堤成为主通道，卡塞尔与贝尔格血战 |
| `p.night`  | 1940-06-01T00:00 | 1940-06-04T12:00 | 第三阶段 · 夜航与殿后 / 夜航与殿后 / 昼间撤离被迫停止；法军殿后部队坚守到 6 月 4 日上午投降 |

### 11.2 时刻与时段（campaign.json 已冻结）

- `epoch` **1940-05-22T00:00** · `start` 1940-05-26T00:00 · `end` **1940-06-04T14:23** · `dataEnd` **1940-06-04T23:59**
- `tzLabel` 英国夏令时 BST（UTC+1）· `utcOffset` 1 · `hoursPerSec` 6
- `pace`：05-26 起 6 / 05-27T06:00 起 4 / 05-28 起 3 / 05-29 起 2.4 / 05-31 起 1.8 / 06-01 起 1.2 / 06-02T20:00 起 0.8 / 06-03T20:00 起 0.5
- `marks`（时间轴，11 条，已按时间排序；同时为 fronts 文件名的一手对照）：
  | 时刻 | 标签 | 对应 `data/fronts/` 文件 |
  |---|---|---|
  | 1940-05-26T16:00 | 加来陷落 | `1940-05-26T16-00.json` |
  | 1940-05-26T18:57 | 发电机启动 | （`1940-05-26T00-00.json` 为开战帧） |
  | 1940-05-28T04:00 | 比利时投降 | `1940-05-28T06-00.json` |
  | 1940-05-28T22:00 | 退入桥头堡 | `1940-05-28T23-00.json` |
  | 1940-05-30T06:00 | 卡塞尔陷落 | `1940-05-30T12-00.json` |
  | 1940-05-31T23:59 | 里尔口袋投降（5-31/06-01 午夜停火；`fr.5ca` 等 12 个单位的终态时刻为 05-31T12:00 —— 图上归入当日关键帧，史实停火在午夜） | `1940-05-31T12-00.json` |
  | 1940-06-01T12:00 | 最后的昼间撤离 | `1940-06-01T12-00.json` |
  | 1940-06-02T07:00 | 昼间撤离停止 | （在 `1940-06-01T12-00` 与 `1940-06-02T22-00` 之间插值） |
  | 1940-06-02T22:00 | 贝尔格陷落 | `1940-06-02T22-00.json`（`transition: step`） |
  | 1940-06-04T09:00 | 法军投降 | `1940-06-04T10-00.json`（`transition: step`） |
  | 1940-06-04T14:23 | 行动终止 | （末帧之后） |

### 11.3 控制区掩膜（`geo.config.json` 的 `masks`，已定稿）

```
masks: { landBit: 4, bits: { "0": ["BE","FR"], "1": ["DE","NL"], "2": ["GB"], "3": [] }, otherLandBit: 6 }
```

- 比特 0 = 战区（比利时 + 法国）→ `theatreBits: [0]`
- 比特 1 = 德军本土（德国 + 荷兰；荷兰 1940-05-15 已投降、5-26 时在德军控制下）→ `slots[0].homeBits: [1, 6]`
- 比特 2 = 英国本土 → `slots[1].homeBits`（该槽在本战役不使用）
- 比特 3 = 法国本土：**刻意留空**，因为法国西部仍是盟军控制区，不能被当作德军本土并入控制区。法国本土只在战区比特 0 中（因此德军占领区可以铺到法国土地上）。
- 比特 6 = 其余陆地（画布内不与上面重复的陆地）

### 11.4 边界脚本

`config/geo.config.json` 的 `borders.script` = `pipeline/geo/borders_1940.py`：以 Natural Earth 现代国界为底
（1940 年 5 月本图幅内法、比、荷、德边界与今日一致；卢森堡在画布外），映射为 DE / NL / BE / FR / GB 五个 id。

### 11.5 界面图层键（写手写 `overlays.json` 只能用这三个）

`defences`（桥头堡与防线，默认开）、`airbases`（机场与雷达，默认关）、`evacuation`（撤离航线示意，默认开）。

### 11.6 冻结的额外约定

- 舰船 `name.short` 用拉丁短名（`Grafton`），中文名放 `name.zh`。
- 英舰 `parent: "gb.dover_cmd"`；法舰 `parent: "fr.marine"`（`fr.marine` 由法军写手在 `data/oob/fr.json` 创建，跨文件引用允许）；德方 E-boat / U-boat `parent: null`。
- `gb.force_a`（Tennant 海滩岸勤）由英军写手在 `data/oob/gb.json` 创建，海军写手只引用、不重复创建。
- 事件 `sfx` 只能取：`typewriter bell stamp paper explosion artillery stuka bomber engine tank ship_gun siren radio morse mg rifle march cavalry fighter air_siren ui_click fanfare amb_wind amb_front amb_radio`。
- 3D `model` 只能取 `engine/three/models/specs.ts` 的 id；可用：`pz1 pz2 pz3 pz4 pz35t pz38t sdkfz231 stug3 7tp tks wz34 t26 bt7 t34 kv1 inf_de inf_pl inf_su inf_sk cav_pl cav_su art_gun inf_it inf_gr inf_yu inf_gb inf_au inf_hu inf_bg inf_nz para_de inf_fi inf_ro inf_allied navy_token air_token spitfire hurricane bf109 bf110 he111 do17 ju87 ju88 graf_spee exeter leander county renown ark_royal tanker merchant ar196 seafox walrus`。
- 舰船剪影 `ship.silhouette` 只能取：`graf_spee york leander county battlecruiser battleship dunkerque carrier tanker merchant liner destroyer submarine tug boat`（省略则按 `kind` 取缺省）。

### 11.7 勘误（v2 · Lead 核对维基与官方战史后更正）

1. **`de.pg_kleist` 隶属 A 集团军群，不属于第 4 集团军，也不属于 B 集团军群。**
   出处：`Battle_of_France`（"the XLI Korps and the XIX Korps were united with the XIV Korps … on a special independent operational level in *Panzergruppe Kleist*"）；
   `4th_Army_(Wehrmacht)`（"By 24 May 1940 the 4th Army was subordinated to Army Group A … Rundstedt would have lost all the armored units (Panzergruppe Kleist, Panzergruppe Guderian)"）。
   → 编制树：`de.ob_west` → `de.hgr_a`（A 集团军群，Rundstedt）→ `de.pg_kleist` → `de.xix`/`de.xli`/`de.xiv`；`de.a4` 亦属 A 集团军群。
   同时保留 `de.hgr_b`（B 集团军群，von Bock）→ `de.a18` / `de.a6`。
2. **第 X 军军长是 Christian Hansen（炮兵上将）**，非 von Vietinghoff。出处：`X_Army_Corps_(Wehrmacht)` commanders："Artillery General Christian Hansen, 15 October 1939 – May 1942"。
3. **第 II 军与第 VIII 军（`de.ii`、`de.viii`）是 5 月 24 日停止前进令中点名等待的步兵军。**
   出处：`4th_Army_(Wehrmacht)` — the halting order "according to which the attack on the encircled Allied troops at Dunkirk was to be delayed until the infantry units (II Corps, VIII Corps) had caught up"。
   → 5 月 28 日以后压向桥头堡的德军主力是这些步兵军 + 第 9 装甲师。
4. **地名 id**：`saint_omer_airfield` 在 `places.json` 中实为 **`st_omer_airfield`**。
5. **空军中队的 `base` 只能用图内机场**（`@hawkinge`、`@manston`）；其余本土机场（Hornchurch / Biggin Hill / North Weald / Debden / Tangmere / Kenley）写进第一个 track 点并在 `history` 说明。
6. **`gb.dover_cmd` 与 `gb.force_a` 由英军写手在 `data/oob/gb.json` 创建**（海军写手只引用）。法舰的 parent 是 `fr.marine`，由法军写手创建。
7. **Dynamo 启动 1940-05-26 18:57；行动结束令 1940-06-04 10:30。**
8. **`manifest.validation.bodyLength` 放宽到 [80, 175]**（政治与战史类事件常需交代背景）。

### 11.8 各写手实际新增的部队 id（v2 · 交付后回填，权威以 `data/oob/` 为准）

派单时的 §5 清单不完整；以下为**实际交付**中新增、且已通过校验的 id。**后续任何引用请以本节 + `data/oob/*.json` 为准。**

**德军（写手 A）新增 3**：`de.hgr_a`（A 集团军群，Rundstedt）· `de.viii`（第 VIII 军，Heitz）· `de.xxvii`（第 XXVII 军，Wäger —— 里尔口袋围攻部队，253/267 师归它）
（编制树：`de.ob_west` → `de.hgr_a` → `de.pg_kleist` → `de.xix`/`de.xli`/`de.xiv`，以及 `de.a4` → `de.ii`/`de.viii`/`de.xv`；`de.hgr_b` → `de.a18`/`de.a6` → `de.ix`/`de.x`/`de.xxvi`/`de.xxvii`。共 49 支。）

**英军（写手 B）新增 18 个旅**：`gb.1gds_bde` `gb.2bde` `gb.4bde` `gb.6bde` `gb.7gds_bde` `gb.8bde` `gb.10bde` `gb.11bde` `gb.13bde` `gb.17bde` `gb.25bde` `gb.125bde` `gb.132bde` `gb.139bde` `gb.144bde` `gb.145bde` `gb.150bde` `gb.151bde`
（共 59 支；`gb.dover_cmd`、`gb.force_a` 按 §11.6 由此写手创建。）

**法军（写手 C）新增 12**：`fr.32di` `fr.4di` `fr.1dmar` `fr.2dina` `fr.5dina` `fr.art_lourde` `fr.grca_18` `fr.pionniers_616` `fr.gb_i12` `fr.gb_ii12` `fr.gc_iii3` `fr.1ca_det`（第 1 军脱出支队，brigade；`fr.1ca` 本体 5-31 投降，支队 6-01 撤出）
（共 39 支。）

**比军（写手 C）新增 11**：`be.1div` `be.2div` `be.3div` `be.8div` `be.chass_cycl` `be.ghq_evac` `be.4div_rem` `be.7div_rem` `be.art_evac` `be.genie_evac` `be.cav_evac`
（共 35 支；后 6 个是「投降后仍撤到英国」的单位，终态 `evacuated`。）

**海军（写手 D）46 艘舰船**（`echelon: "ship"`，全在 `data/oob/sea.json`）：
- 指挥/防空：`gb.calcutta` `gb.coventry`
- 英驱逐舰 20：`gb.wakeful` `gb.grafton` `gb.grenade` `gb.havant` `gb.basilisk` `gb.keith` `gb.ivanhoe` `gb.esk` `gb.express` `gb.shikari` `gb.winchelsea` `gb.wolsey` `gb.whitshed` `gb.sabre` `gb.venomous` `gb.mackay` `gb.montrose` `gb.vimy` `gb.vega` `gb.windsor`
- 扫雷/辅助：`gb.halcyon` `gb.sutton` `gb.massey_shaw`
- 商船/客轮/小艇：`gb.mona_queen` `gb.lady_of_mann` `gb.aden` `gb.cote_d_azur` `gb.brighton_belle` `gb.ferry` `gb.medway_queen` `gb.little_ship_sundowner` `gb.lancastria`
- 法方 6：`fr.bourrasque` `fr.sirocco` `fr.foudroyant` `fr.cyclone` `fr.mistral` `fr.leopard`（parent `fr.marine`）
- 德方 6：`de.s30` `de.s23` `de.s26` `de.s24` `de.s34` `de.u62`

**装备卡（写手 D）29 张**，含 4 张自建海军卡：`ship_destroyer` `ship_aa_cruiser` `ship_minesweeper` `ship_tug`。

**事件分区**：`pipeline/events/lead.json`（总纲/政治/海军史综）· `naval.json`（海上，29 条）· `gb.json`（英军/加来/布洛涅/空战，10 条）· `de.json`（德军视角，约 8–10 条）。
