# 列宁格勒战役军事研究、数据口径与不确定性记录

研究核对日期：2026-10-18。战役显示时间统一为莫斯科叙事时间 MSK / UTC+3；日期字符串无时区后缀，这是引擎的本地叙事时钟约定，不是 UTC。

本记录只覆盖军事与战略序章数据。居民生存、食品、人口、音乐和照片的独立考证由相应研究记录补充。相邻战役文件仅作 ID、格式和草稿参考，没有修改 `barbarossa-1941` 或其他战役，也没有把其维基、Nominatim 或无页码书名引用直接当作已核史证。

## 一、范围与研究方法

- 战略序章从1941-06-22开始，依次呈现波罗的海撤退、卢加阻击、芬兰两路进攻和塔林撤离。围城开始仍为1941-09-08，不能把序章天数加进872天围城。
- 1943-01-18是打通陆上走廊；1944-01-27是完全解除围城。交通抢修、恢复通车、解除炮击威胁和夺回铁路节点也不是同一个事件。
- 结束于1944-01-31，不向前倒填金吉谢普2月1日、巴捷茨卡亚2月12日及1944年夏季芬兰方向战果。
- 优先使用档案原件目录、政府条约文本、官方博物馆与军史，以及具页码的学术研究。官方战史仍是战后研究，不标作战时原始文书；回忆录、宣传叙事和地方展陈的精确数字不自动相互背书。
- 章节正文与可提取PDF重点核对；目录只用于它能够直接证明的日期、标题、文种和档案号，不以目录代替未读的指令全文。2026年国防大学研究和Finlex页面经Python内存读取核对，未因网页抽取器403/只返回界面壳就假称全文不可读。

## 二、战略序章的十二个节点

| 日期（MSK） | 节点 | 主要证据及采用边界 |
|---|---|---|
| 1941-06-22 | 德军北方战区入侵 | 拉脱维亚占领博物馆年表确认开战；美国陆军CMH第二章pp.32–33说明第18集团军沿海、第16集团军东翼、第4装甲集群居中的任务。 |
| 1941-06-26 | 陶格夫匹尔斯被占 | 市政府纪念地说明确认日期；不由该页推定夺桥突击队具体时刻与战果。 |
| 1941-07-01 | 里加被占 | 拉脱维亚占领博物馆年表；不把拉脱维亚全境被占和里加城被占合为一天。 |
| 1941-07-09 | 普斯科夫被占 | 普斯科夫博物馆常设展；7月4日奥斯特罗夫筑垒地域战斗另由胜利博物馆合作馆资料支持。 |
| 1941-07-10 | 卢加主要战斗开始 | 列宁格勒州博物馆专题，防御带贯穿纳尔瓦湾至伊尔门湖方向；不是一条已经完全建成的连续钢筋混凝土墙。 |
| 1941-07-10 16:00 | 卡累利阿集团军进攻 | 芬兰军事历史学会2011年讲稿p.1原记芬兰当地15:00。1941年芬兰为UTC+2，换算本战役MSK UTC+3为16:00，OOB、路线、关键帧和事件同时转换。 |
| 1941-07-14 | 索尔齐反突击 | 索尔齐市政府历史支持日期、第70和202师参与及短期后退；城镇仍于19日被占，不能画成稳定战略反攻。 |
| 1941-07-31 | 芬兰第II军向湖岸进攻 | 学会《地峡的攻占》p.4；不能让第IV军同时在维堡已经完成八月底的攻势。 |
| 1941-08-19 | 诺夫哥罗德全城被占 | 诺夫哥罗德档案集PDFp.6。16日克里姆林宫等局部战斗不等于全城战斗结束。 |
| 1941-08-24 | 卢加城失守 | 圣彼得堡档案专题引战后调查文书，城市占领期1941.8.24–1944.2.12；军队随后继续突围。 |
| 1941-08-28–29 | 塔林主航渡 | 中央海军博物馆援引原始航渡报告标题；救援等行动延续至9月7日，不把所有舰船写成28日21时统一出港。 |
| 1941-08-29 | 维堡被芬军占领 | 芬兰军事历史学会遗址资料；先头进入、城区清理、苏军撤退和31日阅兵须区分。 |

## 三、重要史实修正与实现约束

| 主题 | 采用的判断 | 数据落实与证据 |
|---|---|---|
| 战前国界 | 1940年和约后维堡、地峡和拉多加湖西北岸属苏联；1939年线只能作为历史参考线 | Finlex和约第2条及附图、第4条汉科租借；地理代理重建1941年掩膜。 |
| 芬兰作用 | 部分地段越过1939旧界；有德芬战略协同，也有芬兰统帅部的政治、损失与军事限制 | 国防大学2026年pp.108–111；Kulomaa论文pp.64–132。避免“从未越界”或“曼纳海姆单独拯救城市”的单因叙事。 |
| 斯维里河 | 局部南岸桥头堡存在，但洛杰伊诺耶波列未克；德芬没有在湖南岸陆上会师 | 学会2011斯维里讲稿pp.3–4。轨迹、路线和FI控制区保留城市苏控。 |
| 奥列舍克 | 岸上什利谢利堡被占期间岛上要塞仍由苏军坚守 | 什利谢利堡博物馆与圣彼得堡历史博物馆。德国占领多边形保留孔洞，并有独立事件。 |
| 1941年11月指挥 | 梅列茨科夫11月7日接任第4集团军；季赫温11月8日失守 | CMH第三章pp.50–58。纠正旧稿先失守、再任命的顺序。 |
| 第67集团军 | 1942年10月才以该番号出现 | `su.neva_group`与`su.67a`独立窗口，1941年涅瓦桥头堡事件引用前身。 |
| 第2突击集团军 | 六月战役组织瓦解，七月恢复机关及部队；不能无缝延续旧符号 | `su.2sh_a`与`su.2sh_rebuilt`分开；7月14/15日两份指令有ЦАМО档案号。 |
| 柳班通道 | 3月19日前后被切断，3月下旬重开；5月30–31日再闭，6月下旬灾难 | CMH第VIII、IX、XII章；两个口袋窗口与3月27日、5月31日关键帧分别表达，不长期误封通道。 |
| 六月损失 | 阵亡、被俘、失踪、脱出统计的范围和时间不同 | 不把“3万人死亡+3万人被俘”或另一处“合计3万人”并存；删去没有共同口径的精确总数。 |
| 1942年锡尼亚维诺梯队 | 第8集团军先攻，第IV近卫步兵军随后投入，第2突击集团军9月5日起投入后续梯队 | CMH第XX章；删除未核实的“第VI、IV近卫军同时主攻”说法，并将旧稿9月7日锚点更正。 |
| 北极光 | 是筹备中的全面攻城计划，没有按原方案执行 | CMH第XX章；苏军攻势打乱计划，不据此宣称苏军已知其完整情报与精确时间表。 |
| 火花计划 | 初次批准为1942.12.2第170696号；12.8第170703号另有后续任务 | 总统图书馆认证副本目录、州科研图书馆印刷pp.10–11。旧稿日期和编号不再混用。 |
| 火花地图 | 1943.1.18出现会师和走廊，不等到1.20、不提前平滑打开 | 原1.20结果帧改为1.18，结果帧使用step。工人村5采用独立地理代理的纪念地实测锚点。 |
| 1943年2月 | 红博尔和斯梅尔德尼亚有局部推进，但更大包围目标未达 | 州科研图书馆第三章、CMH1943年章节。地图与正文都不宣称整个南线已经解放。 |
| 1943年9月高地 | 43.3等局部高地被取，主要50.1高地仍属德军 | 州科研图书馆印刷pp.48–49明确否定50.1已克；不是铁路从此绝对安全。 |
| 基里希与西班牙撤离 | 基里希桥头堡10月3–6日撤离/清理，与稍后蓝色师团撤离不同 | 分为独立节点，原ID保留用于基里希，新ID展示西班牙主力退出与留驻军团。 |
| 奥拉宁鲍姆增援 | 数周分批调运；德军注意到海上交通变化 | 中央海军博物馆、CMH《Stalingrad to Berlin》第X章；撤掉“完全不知情”和单次夜运完成全部调动。 |
| 1944年1月14日 | 第2突击集团军09:35开始炮火准备，不能与步兵冲击混为同一秒 | 中央海军博物馆胜利展。1月15日第42集团军另从普尔科沃进攻。 |
| 诺夫哥罗德南翼 | 横越伊尔门湖北部至西岸特罗伊察、旧拉科莫、兹德里诺加地带 | 档案集PDFpp.13–14、193；不是舍隆河口，装备为螺旋桨雪橇而非气垫雪橇。 |
| 1月19日会师 | 第2突击与第42集团军在俄国维索茨科耶附近接触，红村和罗普沙同阶段解放 | 中央海军博物馆；不把1月17日接近罗普沙写成已经完成19日成果。 |
| 沃洛索沃 | 1月27日，不能与26日红卫城/托斯诺合并 | 相关军史与解放日期核对，关键帧25日DE/27日SU。 |
| 金吉谢普/巴捷茨卡亚 | 分别2月1日、2月12日，均在本包之外 | 金吉谢普博物馆、诺夫哥罗德档案集PDFp.28。所有SU轨迹和路线止于接近地；1月31日两地仍DE。 |
| 莫德尔 | 1月31日接替屈希勒尔 | CMH1944年章pp.257–258。删除17日等事件中提前出现的集团军群司令身份。 |
| 芬军机关 | 1942年初改为地峡、奥洛涅茨、马塞尔卡等集群 | Tynkkynen论文pp.16–32。1941年机关仅追踪其进攻窗口，不把显示结束日冒称正式撤销日；1942年6月后用观察截面展示新集群。 |

## 四、部队、数字和地图表达

OOB为88条代表性记录，不是双方所有参与部队的穷尽编制表。战略序章重点为集团军群、方面军、集团军和关键军。师旅级符号仅补充已展开的局部战斗。上下级混计会重复计算人员，故没有依据符号数量反推兵力。第250师及其留驻军团、民兵师及后继番号、旧第61坦克旅及改称近卫阶段，也不作为同一时期两支独立满编单位累加。

所有部队均有显示窗口，窗口并不自动等同正式组建/撤销日期。若整个窗口的隶属发生过变化，采用独立根节点及历史说明，避免以静态父节点虚构两年多不变的指挥关系。保留的装甲/步兵外观只是符号。未注册的虎式专用模型不以四号坦克冒充；第1航空队使用通用航空标记；未核实的装备数量全部撤去。

`forces.json`按九阶段分别列部队范围、观察日期和指挥关系。未经同口径核定的兵力、坦克、飞机、火炮和伤亡保留空值或明确说明，不把整个方面军的总兵力、单次攻击兵力、累计轮换人数和城市居民混在同一个数字里。图标统计仅表示该时刻本包可见的代表性记录。

48个控制关键帧中新增10个前奏状态和2个柳班通道状态。所有后续帧持续保留波罗的海与爱沙尼亚占领背景，不在每次列宁格勒近景变化后把后方重置为苏控。画框南缘和东南缘只是选定北方战区的截取背景，不推演中央集团军群或整个巴巴罗萨战场。路线均显式标为战役轴线示意，不据箭头自动涂占领区。

奥列舍克岛小于约1.28公里控制格网。原始德国多边形孔洞及事件/地名正确，但水体掩膜上的岛点可能取到邻近南岸的微小符号距离值，不能把这种插值当成德国占领要塞的史证，也不能为了测试通过而扩大岛屿或把湖水涂成陆地。

## 五、精度与尚未核定事项

| 项目 | 当前做法 | 不应宣称 |
|---|---|---|
| 事件时间 | 除已核定并统一换算的三个时钟节点外用day；日内12:00是叙事排序锚点 | 准确知道所有战斗起止分钟。 |
| 芬兰进攻 | 当地15:00 UTC+2换成MSK16:00 UTC+3 | 直接把当地15:00放进莫斯科时钟。 |
| 连续过程 | 交接、海运、冬季局部行动等保留阶段说明 | 一张卡片的日子就是全部部队同时完成的时刻。 |
| 虎式初战 | 八月底至九月初阶段性展示，车辆号和初次故障数撤去 | 8月29日某分钟以及确定车辆数已经独立证实。 |
| 虎式100号 | 保留旧ID兼容，但正文不把未核车号、完整状态与缴获日当确定战果 | 1月17日的旧稿细节已证实。 |
| 西班牙团营 | 保留蓝色师团与军团的可辨阶段，避免细分未核团长与伤亡 | 个别营“几乎全灭”的比例、原始行军日志和每个团的逐日位置均已核对。 |
| 反炮兵体系 | 用1943年春夏持续发展的叙事锚点 | 全部机构在5月15日同一天正式成立。 |
| 50.1高地 | 点位为有明确方位关系的战术区域，保留DE控制；43.3有地面纪念地锚点 | 50.1点是测绘级峰顶坐标。 |
| 地名消歧 | 旧锡尼亚维诺村与现代同名镇分列；乌斯季托斯诺与乌斯季伊若拉分开 | 用现代聚落坐标替代1943年被毁战场村庄。 |
| 不明旧村名 | 移除`@aprikosov`、`@krvino`，柳班林沼活动用明确的示意坐标 | 它们已经由独立地名证据定位。 |

## 六、来源目录与阅读范围

下列条目与`data/sources/military.json` ID一致。无确定出版年的网页不虚填2026作为出版年；研究核对日期见本记录开头。

- `mil_cmh_decision_2` — [美国陆军军史《Moscow to Stalingrad》：1941年北方集团军群战略轴线，pp.25–46（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-2.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_3` — [美国陆军军史《Moscow to Stalingrad》：季赫温，pp.50–58（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-3.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_4` — [美国陆军军史《Moscow to Stalingrad》：1941年冬北线反攻（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-4.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_8` — [美国陆军军史《Moscow to Stalingrad》：柳班攻势与苏军指挥，pp.143–155（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-8.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_9` — [美国陆军军史《Moscow to Stalingrad》：猛兽行动，pp.190–192（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-9.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_12` — [美国陆军军史《Moscow to Stalingrad》：第2突击集团军覆灭，pp.255–260（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-12.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_decision_20` — [美国陆军军史《Moscow to Stalingrad》：北极光计划与锡尼亚维诺，pp.408–420（HyperWar全文转录）](https://www.ibiblio.org/hyperwar/USA/USA-EF-Decision/USA-EF-Decision-20.html)；Earl F. Ziemke / Magna E. Bauer；U.S. Army Center of Military History，1987。
- `mil_cmh_defeat_10` — [美国陆军军史《Stalingrad to Berlin》：1943年姆加战役与奥拉宁鲍姆增援侦察](https://www.ibiblio.org/hyperwar/USA/USA-EF-Defeat/USA-EF-Defeat-10.html)；Earl F. Ziemke；U.S. Army Center of Military History，1968。
- `mil_cmh_defeat_12` — [美国陆军军史《Stalingrad to Berlin》：1944年列宁格勒—诺夫哥罗德攻势；莫德尔1月31日接任，pp.249–265](https://www.ibiblio.org/hyperwar/USA/USA-EF-Defeat/USA-EF-Defeat-12.html)；Earl F. Ziemke；U.S. Army Center of Military History，1968。
- `mil_garf_siege` — [俄罗斯国家档案馆：列宁格勒围城档案展导言；1941.9.8围城、1943.1.18突破、1944.1.27完全解围](https://statearchive.ru/blokada/pred.html)；ГАРФ / Российское историческое общество。
- `mil_prlib_iskra` — [总统图书馆：火花行动两方面军会师与封锁突破](https://www.prlib.ru/news/2074282)；Президентская библиотека。
- `mil_prlib_directive170696` — [大本营第170696号指令，1942.12.2；ЦАМО Ф.3 Оп.11556 Д.10 Л.352（已核目录，未以目录代替全文）](https://www.prlib.ru/item/1936531)；Ставка ВГК；Президентская библиотека，1942。
- `mil_secondshock_rebuild` — [1942.7.15第994116号重建第2突击集团军指令；ЦАМО Ф.48а Оп.3408 Д.72 Л.32（档案目录）](https://docs.historyrussia.org/ru/nodes/214705-direktiva-stavki-vgk-locale-nil-994116-komanduyuschemu-voyskami-volhovskogo-fronta-o-vosstanovlenii-2-y-udarnoy-armii-15-iyulya-1942-g)；Ставка ВГК；Электронная библиотека исторических документов，1942。
- `mil_secondshock_command` — [1942.7.14第170510号恢复第2突击集团军机关和部队指令；ЦАМО Ф.48а Оп.3408 Д.72 Л.25（档案目录）](https://docs.historyrussia.org/ru/nodes/214702-direktiva-stavki-vgk-locale-nil-170510-komanduyuschemu-voyskami-volhovskogo-fronta-o-vosstanovlenii-upravleniya-i-chastey-2-y-udarnoy-armii-14-iyulya-1942-g)；Ставка ВГК；ЭБИД，1942。
- `mil_reglib_1943` — [《Победа под Ленинградом》修订版：1943年7–8月姆加、9月15–19日高地战；印刷pp.48–49明确50.1高地未取](https://www.reglib.ru/books/25/get-file)；Ленинградская областная универсальная научная библиотека，2023。
- `mil_ganino_2025` — [《От оккупации к освобождению》档案文献集：诺夫哥罗德1941.8.19、1944.1.14/20；巴捷茨卡亚1944.2.12](https://ganino53.ru/tinybrowser/ot-okkupacii-k-osvobozhdeniyu.pdf)；Новгородские государственные архивы，2025。
- `mil_naval_1944` — [中央海军博物馆胜利展：奥拉宁鲍姆海运、第2突击集团军1月14日09:35炮击、1月19日会师](https://navalmuseum.ru/main_exposition/victory)；Центральный военно-морской музей。
- `mil_naval_tallinn` — [中央海军博物馆塔林撤离专题：主航渡1941.8.28–29，救援行动延续至9.7](https://navalmuseum.ru/news?id=1945)；Центральный военно-морской музей。
- `mil_latvia_museum` — [拉脱维亚占领博物馆年表：1941.6.22开战、7.1里加陷落；区分苏联与纳粹占领](https://okupacijasmuzejs.lv/lv/vesture/latvijas-okupacijas-vesture/pirma-padomju-okupacija)；Latvijas Okupācijas muzejs。
- `mil_daugavpils_city` — [陶格夫匹尔斯市纪念地说明：1941.6.26德军占领与当地犹太居民遭遇](https://www.visitdaugavpils.lv/en/turisma-objekts/pieminas-akmens-daugavpils-geto-ieslodzitajiem/)；Daugavpils valstspilsētas pašvaldība。
- `mil_pskov_museum` — [普斯科夫博物馆常设展：1941.7.9占领日期与原始占领文物](https://museumpskov.ru/expositions?slug=ekspozicziya_pskovskij_kraj_v_gody_velikoj_otechestvennoj_vojny)；Псковский музей-заповедник。
- `mil_ostrov_museum` — [胜利博物馆合作馆“斯大林防线”：1941.7.4奥斯特罗夫筑垒地域战斗](https://territoriyapobedi.ru/severo-zapadnyij-federalnyij-okrug/pskovskaya-oblast/partner-2612/)；Музей Победы / Военно-исторический музей «Линия Сталина»。
- `mil_luga_museum` — [列宁格勒州博物馆卢加防线专题展：1941.7.10开始主要战斗](https://www.lenoblmus.ru/tekushchie-vystavki/pervye-boi-na-luzhskom-rubezhe-k-80-letiyu-nachala-geroicheskoy-oborony)；ГБУК ЛО «Музейное агентство»。
- `mil_luga_archive` — [圣彼得堡档案专题：卢加1941.8.24–1944.2.12被占；含ЦГАИПД СПб Ф.Р-76 Оп.4 Д.4 Л.1–13](https://spbarchives.ru/zv2023-7)；Архивный комитет Санкт-Петербурга。
- `mil_soltsy_city` — [索尔齐市历史：1941.7.14反突击、第70和202师、7.19开始占领](https://www.adminsoltcy.ru/nash-okrug.html)；Администрация Солецкого муниципального округа。
- `mil_finn_svir_2011` — [芬兰军事历史学会讲稿：1941.7.10 15:00进攻、斯维里河与洛杰伊诺耶波列未克](https://www.sshs.fi/content/uploads/2023/02/Pysaytetaankohyokkays_Syvarille.pdf)；Mikko Karjalainen / Suomen Sotahistoriallinen Seura，2011。
- `mil_finn_isthmus_2011` — [《Kannaksen valtaus elo-syyskuussa 1941》：第II军7.31进攻、地峡指挥与目标](https://www.sshs.fi/content/uploads/2023/02/SSHS_Kannaksen_valtaus_16112011_kotisivuille.pdf)；Suomen Sotahistoriallinen Seura，2011。
- `mil_fndu_2026` — [《Mannerheim’s Art of War》pp.108–111：德芬军事协同、芬军目标与政治军事限制](https://www.doria.fi/bitstream/handle/10024/195022/Mannerheims_Art_of_War_web.pdf?isAllowed=y&sequence=1)；Mikko Karjalainen / Toni Mononen；Finnish National Defence University，2026。
- `mil_finn_journal34` — [《Sotahistoriallinen Aikakauskirja 34》：Tynkkynen pp.16–32（1942年初司令部重组）；Kulomaa pp.64–132（卡累利阿筑垒地域）](https://www.sshs.fi/content/uploads/2023/02/ShAik34-14_001-317net.pdf)；Sotamuseo / Suomen Sotahistoriallinen Seura，2014。
- `mil_finlex_1940` — [1940年莫斯科和约：第2条新国界与附图、第4条汉科30年租借](https://www.finlex.fi/fi/valtiosopimukset/sopimussarja/1940/3)；Suomen säädöskokoelman sopimussarja 3/1940；Finlex，1940。
- `mil_vyborg_sshs` — [芬兰军事历史学会维堡遗址目录：1941.8.29夺取维堡](https://www.sotahistoriallisetkohteet.fi/app/sights/list/-/country/9/area/105/)；Suomen Sotahistoriallinen Seura。
- `mil_kingisepp_museum` — [金吉谢普博物馆：解放日期1944.2.1，不能提前到1月31日](https://www.lenoblmus.ru/node/1151)；ГБУК ЛО «Музейное агентство»。
- `mil_oreshek_museum` — [什利谢利堡博物馆：奥列舍克要塞守军在城市被占期间继续抵抗](https://www.lenoblmus.ru/index.php/news/spektakl-shlisselburg-i-krepost-oreshek-v-gody-voyny-zapiski-ochevidcev)；ГБУК ЛО «Музейное агентство»。
- `mil_prlib_salute` — [总统图书馆历史日历：1944.1.27完全解围与324门炮24次齐射](https://www.prlib.ru/history/618980)；Президентская библиотека。
- `mil_cmh_atlas_1941` — [美国陆军官方研究《The German Campaign in Russia》制图目录：Chart2/Map6–8；Map9为计划而非实况](https://www.ibiblio.org/hyperwar/USA/DAP-Russia/index.html)；George E. Blau；Department of the Army Pamphlet20-261a，1955。
- `mil_spb_oreshek` — [圣彼得堡历史博物馆：奥列舍克1941.9.8—1943.1.18近500天防守](https://www.spbmuseum.ru/themuseum/news/56034/?lang_ui=en)；Государственный музей истории Санкт-Петербурга，2025。

## 七、验证证据

`tests/history.test.ts`使用项目`tests/helpers.ts`初始化真实战役数据库，检查三种围城节点、火花指令、芬兰时间换算、梅列茨科夫任命、前身/重建单位、后方占领连续性、季赫温、两处高地、破围帧日期、二月战果边界、芬军斯维里河界限、奥列舍克原始几何、伊尔门湖北部路线及装备替代问题。

独立地理代理在48帧与重点地点执行115项SDF抽样，列宁格勒/奥拉宁鲍姆持续苏控、季赫温反攻、火花湖南岸走廊、43.3/50.1及一月底西进边界均通过。奥列舍克原始孔洞另行核对通过；格网下岛屿的水体插值限制如上保留。最终测试执行结果在主代理整合后记录，不能用草稿文件存在代替浏览器验收。

## 八、火花行动的兵力与军事减员

此次另核读克里沃舍耶夫等《Великая Отечественная без грифа секретности. Книга потерь》（2010），印刷第118页表，统计期间明确为**1943年1月12—30日**。独联体国家间统计委员会2025年官方汇编第69页最末行复载相同总数；主代理另读取该PDF原页，核对表头、期间与列序。

| 苏方原表范围 | 开始兵力 | 不可恢复减员 | 卫生减员 | 减员合计 |
|---|---:|---:|---:|---:|
| 列宁格勒方面军参战部分 | 133,300 | 12,320 | 28,944 | 41,264 |
| 沃尔霍夫方面军参战部分 | 169,500 | 21,620 | 52,198 | 73,818 |
| 合计 | 302,800 | 33,940 | 81,142 | 115,082 |

原表包括第67集团军及第13航空集团军飞行人员，以及第2突击集团军、第8集团军有关部队及第14航空集团军飞行人员，**不是两个方面军全部兵力**。不可恢复减员包含失踪、被俘等，不等于阵亡；卫生减员包含伤病和冻伤，不等于负伤。原书第50—56页讨论分类和重复减员记录，因此减员记录合计不能自动当作独立个人清点。

资料ID：`mil_krivosheev_2010` — [原书全文/OCR，第118页及第50—56页](https://djvu.online/file/WTH5Q9KGNsFuK)；`mil_cisstat_2025` — [官方PDF，第69页，文献依据第246页第30项](https://new.cisstat.org/documents/20143/1057534/sb-80year-pobeda.pdf/1a066a17-d320-d06c-ccee-12e7c045ead9)。后者属于同一统计研究传统的官方复载，不能称为两套独立清点。置信度为高（原表数字及分类），不外推为不存在的逐日序列。

数据在`forces.byPhase.iskra.SU`和`data/ext/siege/statistics.json`呈现，会师事件的深入阅读显示全期军事表，并明确不是截至1月18日的即时累计。德军没有配造同定义对称数字。1944年原书第139—141页的列宁格勒—诺夫哥罗德统计覆盖1月14日至3月1日，超出本包结束时间，未用作一月损失。平民死亡另见城市生活档案，二者不相加。
