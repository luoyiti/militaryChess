# 大西洋海战（1939-09 — 1945-05）史料来源表

> 用途：为 `campaigns/battle-atlantic-1945/data/` 的 sources / oob / events / naval 提供可追溯的来源 id。
> 机器可读副本：[05-sources.json](05-sources.json)（同一批 id、作者、题名、年份、URL 与支撑内容）。
> 核对日期：2026-10-19。核对方式：`pipeline/scripts/verify_sources.py` 逐条探测 URL（状态码 + 响应体字节数，失败重试）；archive.org 条目另以 metadata API 校对著录。照片许可另见 [06-photos.md](06-photos.md)。

## 0. 使用规则

1. **id 规则**：`^[a-z0-9_]+$`，全局唯一，直接写进数据的 `sources: ["roskill_1956"]`。
2. **分层**：每条标 `tier`（官方战史 / 档案一手 / 工具书 / 专著 / 百科旁证）。写成事件正文时，关键数字至少引一条 official 或 archive；百科只用来找线索。
3. **立场标注**：邓尼茨的回忆录与 1946 年自述、Irving 的 PQ-17 一书均带 **立场警示**，不得单独作为事实依据。
4. **口径并列**：同一事实若英方官方（Roskill/Morison）与德方档案（KTB/Rohwer）或 Blair 的修正有出入，数据里的 `confidence` 降一级，并在研究笔记写明两说。
5. **不可达条目（4 条，白名单）**：`nhc_collections`（history.navy.mil 本机 DNS 无法解析）、`frus_1939_v5`（history.state.gov TLS 失败）、`gazette_index`（thegazette.co.uk 返回 202 挑战页）、`bama_rm`（invenio 为 JS 单页应用，只返回框架页）——正文未在本机验证，仅作「出处指引」；引用具体内容时改引可达副本。其余 96 条均实测可达。
6. **复核命令**：`.venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/verify_sources.py`（退出码 0 = 无硬失败；`--json` 输出机器可读结果）。

## 1. 分层统计

| tier | 含义 | 条数 |
|---|---|---|
| `official` | 官方战史 | 20 |
| `archive` | 档案/一手 | 20 |
| `reference` | 工具书 | 26 |
| `secondary` | 专著 | 25 |
| `tertiary` | 百科旁证 | 9 |
| **合计** | | **100** |

## 2. 来源表

### A. 英国官方战史（HMSO / 海军部）

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `roskill_1954` | S. W. Roskill | The War at Sea 1939–1945, Vol. I: The Defensive（英国官方二战史·海军卷） | 1954 | <https://archive.org/details/worldat-sea-1939-1945-vol-1> | 1939-09 至 1941 的护航制度、猎杀群、挪威与法国沦陷后的 U 艇基地；英方官方损失口径。HyperWar 另载部分章节 |
| `roskill_1956` | S. W. Roskill | The War at Sea 1939–1945, Vol. II: The Period of Balance（第 4、8、14 章为大西洋战役） | 1956 | <https://www.ibiblio.org/hyperwar/UN/UK/UK-RN-II/UK-RN-II-14.html> | 1942 年美国水域（第 4 章）、1942 下半年护航战（第 8 章）、1943 年 1–5 月「护航舰的胜利」（第 14 章）：SC 122/HX 229、1943-03 大西洋护航会议、5 月 41 艘 U 艇被击沉与撤出北大西洋 |
| `roskill_1960` | S. W. Roskill | The War at Sea 1939–1945, Vol. III Part 1: The Offensive, 1 June 1943 – 31 May 1944 | 1960 | <https://archive.org/details/war-at-sea-1939-1945-vol-3-part-1> | 1943-06 后比斯开湾攻势、护航航母猎杀群、诺曼底前后的海峡与登陆补给 |
| `roskill_1961` | S. W. Roskill | The War at Sea 1939–1945, Vol. III Part 2: The Offensive, 1 June 1944 – 14 August 1945 | 1961 | <https://archive.org/details/war-at-sea-1939-1945-vol-3-part-2> | 1944–45 挪威海域与最后阶段 U 艇战、德国投降时的 U 艇受降与自沉 |
| `battleatlantic_1946` | Admiralty / HMSO（英国海军部） | The Battle of the Atlantic: The Official Account of the Fight Against the U-Boats, 1939–1945 | 1946 | <https://archive.org/details/battleatlantic> | 战后第一本官方综述：各年损失吨位、护航队规模、击沉 U 艇数与战役分期框架 |
| `behrens_1955` | C. B. A. Behrens | Merchant Shipping and the Demands of War（英国官方二战史·民用卷） | 1955 | <https://archive.org/details/merchant-shipping-demands-of-war> | 商船吨位、船员、运输需求与损失对英国经济的压力；进口吨位与配给 |
| `hancock_gowing_1949` | W. K. Hancock & M. M. Gowing | British War Economy（英国官方二战史·民用卷） | 1949 | <https://archive.org/details/britishwareconom0000wkha> | 战时经济框架：进口削减、船吨分配、1941 与 1942 年吨位危机的政策后果 |
| `medlicott_1952` | W. N. Medlicott | The Economic Blockade, Vol. I（英国官方二战史·民用卷） | 1952 | <https://archive.org/details/economic-blockade-v-1> | 封锁与反封锁的经济逻辑：英国对德封锁与德国以 U 艇反制英国的对称性 |
| `grand_strategy_2` | J. R. M. Butler | Grand Strategy, Vol. II: September 1939 – June 1941（英国官方二战史·战略卷） | 1957 | <https://archive.org/details/grandstrategypri0000coll> | 英美参谋会谈（ABC-1）、1941 年「先德后日」与大西洋护航责任的分配 |
| `grand_strategy_3_1` | J. M. A. Gwyer | Grand Strategy, Vol. III, Part 1: June 1941 – August 1942（英国官方二战史·战略卷） | 1964 | <https://archive.org/details/grand-strategy-vol-3-part-1> | 美国参战前后的大战略：ABC-1 之后的护航责任、1942 年船吨危机与「先德后日」的执行 |
| `grand_strategy_5` | John Ehrman | Grand Strategy, Vol. V: August 1943 – September 1944 | 1956 | <https://archive.org/details/grand-strategy-vol-5> | 1943-08 后盟军战略：比斯开湾、诺曼底与 U 艇战在整体战略中的位置 |

### B. 美国、加拿大官方战史与官方机构

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `mori_battle_atlantic` | Samuel Eliot Morison | History of United States Naval Operations in World War II, Vol. I: The Battle of the Atlantic, September 1939 – May 1943 | 1947 | <https://archive.org/details/battleofatlantic0000mori> | 1941–43 年美国大西洋水域、Drumbeat 期间东岸损失、护航制度在美国的推行、火炬行动的海上准备 |
| `mori_atlantic_won` | Samuel Eliot Morison | History of United States Naval Operations in World War II, Vol. X: The Atlantic Battle Won, May 1943 – May 1945 | 1956 | <https://archive.org/details/atlanticbattlewo0000samu_q0k9> | 1943-05 后猎杀群（Bogue、Card、Guadalcanal）与 U 艇补给艇的覆灭、U-505 俘获、1945 年受降 |
| `king_usnavy_at_war` | Ernest J. King（美国海军作战部长） | U.S. Navy at War, 1941–1945: Official Reports to the Secretary of the Navy | 1946 | <https://archive.org/details/usnavyatwar0000unse> | 美方年度官方报告：大西洋护航责任、猎杀群战果、1942 年东岸危机的官方承认与辩解 |
| `schull_1950` | Joseph Schull | The Far Distant Ships: An Official Account of Canadian Naval Operations in the Second World War | 1950 | <https://archive.org/details/fardistantshipso0000schu> | 加拿大皇家海军（RCN）在大西洋护航中的角色：纽芬兰与哈利法克斯护航队、1943-03 后西北大西洋指挥权、C 组与第 9 护航群 |
| `rcaf_official_2` | W. A. B. Douglas 等（加拿大官方战史） | The Official History of the Royal Canadian Air Force, Vol. II: The Creation of a National Air Force | 1986 | <https://archive.org/details/officialhistoryo0000unse> | 加拿大东岸航空反潜（RCAF 东岸司令部）、Canso/Catalina 与 Liberator 中队在西北大西洋的覆盖 |
| `hinsley_1979` | F. H. Hinsley 等 | British Intelligence in the Second World War, Vol. I: Its Influence on Strategy and Operations | 1979 | <https://archive.org/details/britishintellige00hins_0> | 官方情报史：1941–43 年 Enigma 与 OIC 情报如何影响护航改道；1942-02「Triton」换钥导致的失明 |
| `hinsley_1988` | F. H. Hinsley, E. E. Thomas, C. G. Ransom, R. C. Knight | British Intelligence in the Second World War, Vol. 3 Part 2 | 1988 | <https://archive.org/details/britishintellige0003fhhi> | 1943–44 年情报与反潜：Black May 前后的破译节奏、比斯开湾与德国海军密码 |
| `hyperwar_amh22` | Maurice Matloff 等（美国陆军官方战史） | American Military History, ch. 22: World War II — The War Against Germany and Italy（HyperWar 转录） | 1989 | <https://www.ibiblio.org/hyperwar/AMH/AMH/AMH-22.html> | 美方总体战略叙述：先德后日、火炬行动与 1942 年海上危机的战略背景 |
| `nhc_collections` | Naval History and Heritage Command（美国海军历史与遗产司令部） | NHHC Photographic Collections（80-G 系列与二战专题） | 2026 | <https://www.history.navy.mil/> | 美国海军官方照片与舰史；照片 80-G 编号的权威出处 |

### C. 德国海军战争日志（ONI 译本）、元首会议与纽伦堡文件

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `ktb_skl` | Kriegsmarine Seekriegsleitung（德国海军作战部）；美国海军情报局（ONI）译 | War Diary: German Naval Staff Operations Division（Kriegstagebuch der Seekriegsleitung, Part A，ONI 英译本，多卷） | 1948 | <https://archive.org/details/wardiarygermanna11939germ> | 德方逐日作战决策：U 艇部署、狼群组编、与 OKM/元首会议的关系、1943-05 撤出北大西洋的命令链 |
| `fuehrer_conferences` | Adolf Hitler / Erich Raeder / Karl Dönitz；英国海军部 1948 年英译 | Führer Conferences on Naval Affairs, 1939–1945（元首与海军总司令会议记录选编） | 1948 | <https://archive.org/details/brasseys-naval-annual-1948-ocr> | 希特勒与雷德尔/邓尼茨关于 U 艇建造优先权、1943-01 雷德尔辞职、1943-05「潜艇战失败」表态的直接记录 |
| `kdvb_doenitz_1946` | Karl Dönitz（美国海军情报局 ONI 1946 年译印，附审讯记录） | The Conduct of the War at Sea: An Essay by Admiral Karl Doenitz | 1946 | <https://www.ibiblio.org/hyperwar/Germany/KM/WarAtSea/index.html> | 邓尼茨对 U 艇战战略、吨位战、1943-05 撤退理由的自述；ONI 的批判性导言 |
| `nuremberg_imt_blue` | International Military Tribunal（纽伦堡国际军事法庭） | Trial of the Major War Criminals before the International Military Tribunal（「蓝皮卷」42 卷，含判决与邓尼茨案） | 1947 | <https://avalon.law.yale.edu/imt/10-01-46.asp> | 1946-10-01 判决书正文（含对 U 艇战与 Laconia 命令的认定）、邓尼茨量刑理由 |
| `nuremberg_nca` | Office of U.S. Chief of Counsel | Nazi Conspiracy and Aggression（「红皮卷」NCA：C 系列与 UK 系列文件英译） | 1946 | <https://avalon.law.yale.edu/subject_menus/imt.asp> | 德军作战指令、元首令与海军文件（如邓尼茨 1942 年 Laconia 命令）的英译档案集 |
| `uboatarchive_bduktb` | Befehlshaber der Unterseeboote（BdU）；U-boat Archive 英译 | BdU Kriegstagebücher and Standing War Orders（B.d.U. KTB / Stehender Kriegsbefehl） | 1941 | <https://www.uboatarchive.net/BDU/BDUKTB.htm> | 邓尼茨司令部逐日战争日志与「常备作战命令」：狼群编组、巡逻线、无线电静默与攻击准则的一手德文档案英译 |
| `uboatarchive_ktb` | U-boat Archive（多艇 KTB 协作翻译） | U-boat Kriegstagebücher（单艇战争日志英译：U-61、U-106、U-172、U-621、U-636 等） | 2020 | <https://www.uboatarchive.net/KTB/KTBList.htm> | 单艇巡逻日志：下潜/上浮时刻、接触报告、鱼雷消耗、规避深弹，用于校验「某日某艇在何处」 |
| `bama_rm` | Bundesarchiv-Militärarchiv（弗赖堡） | Bestand RM 7（OKM Seekriegsleitung）、RM 8（Kriegswissenschaftliche Abteilung）、RM 97（BdU / U 艇部队） | 2026 | <https://invenio.bundesarchiv.de/> | 德方档案的原始存放与检索系统：KTB、作战命令、U 艇档案；用于标明「原始出处」而非网文 |

### D. 政治文件与伦敦公报

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `avalon_atlantic_charter` | Franklin D. Roosevelt & Winston S. Churchill（Avalon Project 转录） | The Atlantic Charter, 14 August 1941 | 1941 | <https://avalon.law.yale.edu/wwii/atlantic.asp> | 大西洋宪章八条全文：公海自由、民族自决与战后秩序，是「大西洋会议」政治成果的一手文本 |
| `avalon_panama` | American Republics（巴拿马会议；Avalon Project 转录） | Declaration of Panama, 3 October 1939（美洲中立区界线） | 1939 | <https://avalon.law.yale.edu/20th_century/dec99-03.asp> | 美洲中立安全区（西经约 300 海里线）的法律文本：1939–41 年美洲水域交战的法律约束与其后的名存实亡 |
| `frus_1939_v5` | U.S. Department of State | Foreign Relations of the United States, 1939, Vol. V: The American Republics | 1957 | <https://history.state.gov/historicaldocuments/frus1939v05> | 美方外交档案：中立巡逻、巴拿马宣言执行、与英国的护航交涉 |
| `gazette_38038` | Admiral Sir Bruce Fraser（北角海战战报）；The London Gazette | Supplement to The London Gazette, 7 August 1947, No. 38038: Sinking of the German Battlecruiser Scharnhorst, 26 December 1943 | 1947 | <https://www.ibiblio.org/hyperwar/UN/UK/LondonGazette/38038.pdf> | 北极航线 JW.55A/JW.55B 的掩护与沙恩霍斯特号被击沉；直接说明北极护航与本土舰队的关系，及「All times are Zone minus one」的时区惯例 |
| `gazette_37989` | Rear-Admiral H. H. Harwood；The London Gazette | Supplement to The London Gazette, 19 June 1947, No. 37989: The River Plate Battle（1939-12-30 战报） | 1947 | <https://www.ibiblio.org/hyperwar/UN/UK/LondonGazette/37989.pdf> | 1939-12 拉普拉塔河口海战：大西洋海战开战阶段「单独袭击舰」模式的实例，与 1940 年后 U 艇战对比 |
| `gazette_34759` | Admiralty（伦敦公报授勋公告）；naval-history.net 转录 | London Gazette No. 34759（1939-12-22 增刊）等：拉普拉塔河口与阿尔特马克号授勋、商船船长嘉奖 | 1939 | <https://www.naval-history.net/WW2LGGrafSpee.htm> | 开战阶段英方荣誉与商船船员嘉奖原文（Doric Star、Tairoa、Huntsman、Trevanion 等），可作「商船船员」叙事的一手依据 |

### E. 美国海军文件与商船规程

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `oni_204` | U.S. Navy, Office of the Chief of Naval Operations（ONI） | ONI-204: German Naval Vessels（1942-08-13 识别手册） | 1942 | <https://www.ibiblio.org/hyperwar/USN/ref/ONI/ONI-204/index.html> | 1942 年美军对德国舰艇（含 U 艇型号、干舷、指挥塔外形）的识别资料，用于舰船剪影与识别特征 |
| `oni_prien_u47` | Office of Naval Intelligence（ONI）/ Fregattenkapitän Wagner Fürbringer 口述 | ONI Report 155-C-48: Kapitaenleutnant Guenther Prien's (U-47) Attack on Scapa Flow | 1948 | <https://www.ibiblio.org/hyperwar/Germany/KM/Prien.html> | U-47 潜入斯卡帕湾击沉皇家橡树号（1939-10-14）：开战初期 U 艇对本土舰队的直接威胁与舰队基地转移 |
| `maritime_commission` | U.S. Maritime Commission / War Shipping Administration | Wartime Instructions for United States Merchant Vessels（HyperWar 转录） | 1942 | <https://www.ibiblio.org/hyperwar/USN/ref/WarInst-Merch/index.html> | 美国商船战时规程：航行灯、无线电静默、遇袭报告、救生艇操作，支撑「商船船员如何面对 U 艇」的细节 |
| `abandon_ship` | U.S. Navy（HyperWar 转录） | How to Abandon Ship（战时小册子） | 1943 | <https://www.ibiblio.org/hyperwar/USN/ref/AbandonShip/index.html> | 弃船程序与救生筏操作；解释被鱼雷击中后的生还率与救援窗口 |

### F. 严肃专著（含立场标注）

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `doenitz_memoir_1958` | Karl Dönitz | Memoirs: Ten Years and Twenty Days（德文原题 Zehn Jahre und Zwanzig Tage） | 1958 | <https://archive.org/details/memoirstenyearst0000doni> | U 艇部队建设、狼群战术形成、与希特勒的冲突、1943-05 决策的个人视角 |
| `blair_1996` | Clay Blair | Hitler's U-Boat War, Vol. 1: The Hunters, 1939–1942 | 1996 | <https://archive.org/details/hitlersuboatwarh0000blai_w0c3> | 以德方档案为主轴的逐艇逐月叙述；对盟军官方战史数字的修正（尤其 1942 年东岸与 1942 下半年） |
| `blair_1998` | Clay Blair | Hitler's U-Boat War, Vol. 2: The Hunted, 1942–1945 | 1998 | <https://archive.org/details/hitlersuboatwarh0000blai> | 1943–45 年：Black May、比斯开湾、通气管、1944–45 年最后一波巡逻与投降 |
| `dimbleby_2015` | Jonathan Dimbleby | The Battle of the Atlantic: How the Allies Won the War | 2015 | <https://archive.org/details/battleofatlantic0000dimb> | 近年综合叙述：把大西洋战役与租借、斯大林格勒、北非战场的战略联动写在一起；叙事结构可参考，细节需回档案 |
| `milner_2005` | Marc Milner | The Battle of the Atlantic | 2005 | <https://archive.org/details/battleofatlantic0000miln> | 加拿大视角的简明战役史：护航制度、RCN 的扩张与 1943 年后的专业化 |
| `milner_1985` | Marc Milner | North Atlantic Run: The Royal Canadian Navy and the Battle for the Convoys | 1985 | <https://archive.org/details/northatlanticrun00miln> | RCN 护航群 1941–43 年的具体战例（SC 42、ONS 154 等）与训练、装备不足 |
| `terraine_1989` | John Terraine | Business in Great Waters: The U-Boat Wars, 1916–1945 | 1989 | <https://archive.org/details/businessingreatw0000adri> | 把两次大战的 U 艇战连成一条线，强调护航与航空兵力；英国视角的综合叙述 |
| `van_der_vat_1988` | Dan van der Vat | The Atlantic Campaign: World War II's Great Struggle at Sea | 1988 | <https://archive.org/details/atlanticcampaign00vand> | 战役全景（含密码战与政治层面）；「谁赢得大西洋战役」的争论梳理 |
| `mulligan_1999` | Timothy P. Mulligan | Neither Sharks nor Wolves: The Men of Nazi Germany's U-Boat Arm, 1939–1945 | 1999 | <https://archive.org/details/neithersharksnor0000mull> | U 艇艇员的来源、训练、士气与伤亡率（约四分之三阵亡），支撑「人」的层面叙事 |
| `gannon_1990` | Michael Gannon | Operation Drumbeat: The Dramatic True Story of Germany's First U-Boat Attacks Along the American Coast in World War II | 1990 | <https://archive.org/details/operationdrumbea00gann> | 1942 年 1–6 月美国东岸（Paukenschlag）的逐艇叙述，尤其 U-123 的巡逻 |
| `padfield_1984` | Peter Padfield | Dönitz: The Last Führer | 1984 | <https://archive.org/details/bwb_KU-109-399> | 邓尼茨传记（批判性）：U 艇部队建设、与纳粹政权的关系、纽伦堡；对回忆录的祛魅 |
| `peillard_1983` | Léonce Peillard | The Laconia Affair | 1983 | <https://archive.org/details/laconiaaffair0000peil> | 1942-09-12 Laconia 事件：U-156 救援、盟军空袭、邓尼茨「Laconia 命令」的来龙去脉 |
| `woodman_1994` | Richard Woodman | The Arctic Convoys, 1941–1945 | 1994 | <https://archive.org/details/arcticconvoys1940000wood_a9c1> | 北极航线（PQ/QP、JW/RA）完整叙述、PQ-17 与 JW-51B 细节，及与北大西洋主战场的资源竞争 |
| `irving_1969` | David Irving | The Destruction of Convoy PQ.17 | 1969 | <https://archive.org/details/destructionofcon0000irvi> | PQ-17 的争议叙述；仅作「争议如何被构造」的案例 |
| `kahn_1991` | David Kahn | Seizing the Enigma: The Race to Break the German U-Boat Codes, 1939–1943 | 1991 | <https://archive.org/details/seizingenigmarac0000kahn> | U-110（1941-05-09）、U-559（1942-10-30）等缴获与破译的关键节点 |
| `sebag_2000` | Hugh Sebag-Montefiore | Enigma: The Battle for the Code | 2000 | <https://archive.org/details/enigmabattleforc0000seba_c6j4> | 恩尼格玛破译的人员与行动细节（含 U-110 缴获）；对 Bletchley 作用的评估 |
| `beesly_1977` | Patrick Beesly | Very Special Intelligence: The Story of the Admiralty's Operational Intelligence Centre, 1939–1945 | 1977 | <https://archive.org/details/veryspecialintel00bees> | 海军部作战情报中心（OIC）的运作与罗杰·温；护航改道决策的内部视角 |
| `winton_1983` | John Winton | Convoy: The Defence of Sea Trade, 1890–1990 | 1983 | <https://archive.org/details/isbn_0718121635> | 护航制度的长期演变与 1939–45 年的组织细节（队形、信号、护航群轮换） |
| `rohwer_critical` | Jürgen Rohwer | The Critical Convoy Battles of March 1943 | 1977 | <https://archive.org/details/criticalconvoyba00jurg> | 1943-03 SC 122/HX 229 的逐时分析（德英档案对照），狼群战术的高峰与双方情报失误 |
| `roessler_uboot` | Eberhard Rössler | The U-Boat: The Evolution and Technical History of German Submarines | 1981 | <https://archive.org/details/bwb_P9-EIZ-548> | U 艇型号技术参数（VII、IX、XXI、XXIII 的尺度、排水量、航速、潜深、鱼雷数） |
| `naval_history_net` | Gordon Smith / Don Kindell 等 | Naval-History.Net — Battle of the Atlantic, Part 1 (1939–1942) | 2026 | <https://www.naval-history.net/WW2CampaignsAtlanticDev.htm> | 按月编排的战役进程（1939-09 至 1942-12）：护航制度、猎杀群、狼群、雷达与武器对抗；引 Roskill 与官方战史 |
| `nh_atlantic_2` | Gordon Smith / Don Kindell 等 | Naval-History.Net — Battle of the Atlantic, Part 2 (1943–1945) | 2026 | <https://www.naval-history.net/WW2CampaignsAtlanticDev2.htm> | 1943–45 年逐月进程：1943-03 大西洋护航会议与指挥区划分、Black May、比斯开湾、诺曼底、1945 年受降 |
| `nh_pq17` | Gordon Smith 等 | Naval-History.Net — Convoy PQ.17（俄罗斯护航队专题） | 2026 | <https://www.naval-history.net/Cr03-53-00PQ17.htm> | PQ-17（1942-06-27 出发、7-04 散队）的逐日记录与损失清单 |
| `nh_pq18` | Gordon Smith 等 | Naval-History.Net — Convoy PQ.18 | 2026 | <https://www.naval-history.net/Cr03-54-00PQ18.htm> | PQ-18（1942-09）在护航航母与更强掩护下的对比，说明 1942 年北极护航的转折 |
| `nh_normandy` | Gordon Smith 等 | Naval-History.Net — Normandy Landings, June 1944 | 2026 | <https://www.naval-history.net/WW2CampaignsNormandy.htm> | 诺曼底登陆的海军侧：登陆舰队、护航、扫雷与 U 艇反制 |

### G. 工具书、数据库与检索入口

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `rohwer_chronology` | Jürgen Rohwer & Gerhard Hümmelchen | Chronology of the War at Sea, 1939–1945（德文原版 Chronik des Seekrieges） | 1968 | <https://archive.org/details/chronologyofwara0000rohw_v7p9> | 逐日海战年表（双方）：U 艇出航/返航/沉没日期、护航队编号与交战，交叉核对时刻的首选工具书 |
| `rohwer_axis_successes` | Jürgen Rohwer | Axis Submarine Successes, 1939–1945 | 1983 | <https://archive.org/details/axissubmarinesuc0000rohw> | 逐条商船损失（船名、吨位、时刻、位置、加害 U 艇），是「每月吨位」统计的底账 |
| `wynn_uboats` | Kenneth G. Wynn | U-Boat Operations of the Second World War, Vol. 1–2 | 1997 | <https://archive.org/details/isbn_9781840675252> | 逐艇作战记录（巡逻次数、击沉、结局），校验「U-xxx 于某日沉没于某海域」 |
| `hague_convoy` | Arnold Hague（与 John K. Burgess、Don Kindell 合作） | Arnold Hague Convoy Database（27,892 个护航队、322,483 条船舶动态） | 2026 | <https://www.convoyweb.org.uk/hague/index.html> | 护航队编号、日期、起止港与护航舰名单（HX/SC/ONS/ON/PQ/JW 等），校验「某队某日在哪里」的权威数据库 |
| `uboat_net` | Guðmundur Helgason 等 | uboat.net — The U-boats（逐艇档案、巡逻记录、指挥官与结局） | 2026 | <https://uboat.net/boats/> | 每艘 U 艇的建造厂、服役/沉没日期与位置、指挥官、击沉记录；代表艇的主数据源 |
| `uboat_net_types` | Guðmundur Helgason 等 | uboat.net — U-boat Types（II、VII、IX、X、XIV、XXI、XXIII 型技术页） | 2026 | <https://uboat.net/types/> | 各型 U 艇的排水量、主尺度、航速、潜深、鱼雷数与艇员编制 |
| `uboat_net_ops` | Guðmundur Helgason 等 | uboat.net — Operations（Drumbeat、狼群、护航战、布雷、Monsun） | 2026 | <https://uboat.net/ops/> | 各作战阶段总览：Paukenschlag（Drumbeat）、狼群列表、护航战索引、地中海与印度洋分遣；逐月在航数与损失曲线 |
| `uboat_net_technical` | Guðmundur Helgason 等 | uboat.net — Technical（Enigma、通气管、雷达告警、FW-200、基地与船厂） | 2026 | <https://uboat.net/technical/> | 技术对抗的时间线：Enigma M3/M4 与钥匙网、通气管改装、Metox/Naxos、FW-200 侦察、法国基地 |
| `uboat_net_allies` | Guðmundur Helgason 等 | uboat.net — Allied Warships（逐舰战历，含护航航母与护卫舰） | 2026 | <https://uboat.net/allies/warships/> | 盟军护航舰艇（Bogue、Card、Guadalcanal、Starling、Biter 等）的战历与 U 艇战果 |
| `uboat_net_fates` | Guðmundur Helgason 等 | uboat.net — U-boat Fates（损失年报、1943-05 清单、自沉、投降、Deadlight） | 2026 | <https://uboat.net/fates/> | 逐月在役与损失、1943-05 被击沉逐艇清单、1945 年「彩虹」自沉与投降港、战后 Deadlight 凿沉 |
| `uboat_net_men` | Guðmundur Helgason 等 | uboat.net — The Men（邓尼茨、指挥官名录、艇员伤亡） | 2026 | <https://uboat.net/men/> | 邓尼茨履历与纽伦堡判决、指挥官任期（克雷奇默、吕特、托普、舍普克等） |
| `uboat_net_glossary` | Guðmundur Helgason 等 | uboat.net — Glossary（BdU、FdU、KTB、Rudeltaktik 等术语） | 2026 | <https://uboat.net/glossary.htm> | 德方术语的英文对照，供中文术语表定名 |
| `nh_convoy_escorts` | Don Kindell（据 Arnold Hague 整理） | Naval-History.Net — Convoy Escort Movements of Royal and Dominion Navy Warships（1,218 艘舰） | 2026 | <https://www.naval-history.net/xDKEscorts00Contents.htm> | 逐舰护航履历：某舰在某年某月护送某队，编成与航迹的核对底册 |
| `nh_daily_1939` | Don Kindell | Naval-History.Net — World War 2 at Sea, Daily (1939–1942) | 2026 | <https://www.naval-history.net/xDKWW2-3900Intro.htm> | 逐日海战记录（含 U 艇击沉商船、护航舰行动），用于事件卡的日期与地点 |
| `nh_war_diaries` | Don Kindell | Naval-History.Net — Admiralty War Diaries（海军部战争日记转录） | 2026 | <https://www.naval-history.net/xDKWarDiaries-Contents.htm> | 海军部逐日战争日记：护航队动态、潜艇警报与命令，英方一手记录 |
| `nh_ship_histories` | Gordon Smith 等 | Naval-History.Net — 1,000 Warship Service Histories | 2026 | <https://www.naval-history.net/xGM-aContents.htm> | 逐舰战历（Biter、Audacity、Starling、Kite 等），供舰船卡与事件核实 |
| `nh_maps` | Gordon Smith 等 | Naval-History.Net — Campaign and Battle Maps（含大西洋护航航线图） | 2026 | <https://www.naval-history.net/Map00Index.htm> | 战役地图索引：北大西洋航线、比斯开湾、北极航线；作为控制区几何的参考（非精确底图） |
| `nh_rn_losses` | Gordon Smith 等 | Naval-History.Net — Battles, Major Warship Losses | 2026 | <https://www.naval-history.net/NAVAL1939-45RN.htm> | 逐舰损失日期、位置与原因，校验「某舰某日沉没」 |
| `nh_honours` | Gordon Smith 等 | Naval-History.Net — Royal Navy, Royal Marine, Single-Ship Battle Honours 1939–45 | 2026 | <https://www.naval-history.net/WW2CampaignsRNHons.htm> | 战功荣誉（含「Atlantic 1939–45」战役荣誉的授予条件），解释为何许多舰艇都带该荣誉 |
| `hyperwar_uk_official` | HyperWar Foundation | United Kingdom Official Histories（英国官方二战史在线索引：Roskill、Behrens、Hancock & Gowing、Hinsley 等） | 2026 | <https://www.ibiblio.org/hyperwar/UN/UK/index.html> | 英国官方战史在线目录与卷次（含 Roskill 第 I、II 卷正文）；核对版本、章节与转写来源的入口 |
| `hyperwar_eto` | HyperWar Foundation | European Theater of Operations — Battle of the Atlantic（专题索引） | 2026 | <https://www.ibiblio.org/hyperwar/ETO/Atlantic/index.html> | 大西洋战役专题页：ONI 的德国海军文件、美国商船战时规程、USCG 北大西洋与格陵兰巡逻专题 |
| `hyperwar_germany_km` | HyperWar Foundation | The Kriegsmarine in World War II（德方资料索引） | 2026 | <https://www.ibiblio.org/hyperwar/Germany/KM/index.html> | ONI 的德方文件索引：邓尼茨文章、Prien/U-47 报告、印度洋 U 艇、ONI-204；德方一手材料在英文世界的入口 |
| `hyperwar_london_gazette` | HyperWar Foundation | London Gazette Despatches（PDF 在线副本） | 2026 | <https://www.ibiblio.org/hyperwar/UN/UK/LondonGazette/37989.pdf> | 伦敦公报战报 PDF 的在线副本（37989 拉普拉塔、38038 沙恩霍斯特），可下载核对原文、时间说明与页码 |
| `navweaps` | Tony DiGiulian 等 | NavWeaps — Naval Weapons of the World（各国舰炮、鱼雷、引信技术页） | 2026 | <https://www.navweaps.com/> | 舰炮与鱼雷的技术参数（射程、射速、弹重），用于舰船卡武备 |
| `nara_catalog` | U.S. National Archives and Records Administration | NARA Catalog（RG 38 海军、RG 80 海军人事等；照片 80-G 系列） | 2026 | <https://catalog.archives.gov/search?q=battle%20of%20the%20atlantic> | 美方档案检索入口：80-G 海军照片、作战报告、潜艇战记录；照片署名与馆藏号核对 |
| `tzdb_europe` | IANA tz database（eggert/tz） | europe（Berlin、London、Paris 等时区规则，含 1940–45 战时夏令时） | 2026 | <https://github.com/eggert/tz/blob/main/europe> | 德国 MEZ/MESZ 与英国 GMT/BST 的历史换算规则（含 1940 年「双倍夏令时」） |
| `tzdb_northamerica` | IANA tz database（eggert/tz） | northamerica（Newfoundland、Halifax、Eastern 等时区规则） | 2026 | <https://github.com/eggert/tz/blob/main/northamerica> | 北美东岸（哈利法克斯、纽芬兰、纽约）在 1942 年「战时时间」下的换算，解释 Drumbeat 期间的时刻差异 |
| `gazette_index` | The Gazette（英国官方公告网） | The Gazette — London Gazette 档案检索（1665 至今，可按编号与日期定位增刊） | 2026 | <https://www.thegazette.co.uk/> | 检索与核对任何伦敦公报编号（如 34759、37989、38038） |

### H. 维基百科（旁证，逐条注明）

| id | 作者 | 题名 | 年份 | URL | 支撑内容 |
|---|---|---|---|---|---|
| `wiki_en_atlantic` | Wikipedia EN | Battle of the Atlantic | 2026 | <https://en.wikipedia.org/wiki/Battle_of_the_Atlantic> | 总览、数字汇总与争议点的快速索引；仅作旁证，凡引用必回一手来源 |
| `wiki_en_black_may` | Wikipedia EN | Black May (World War II) | 2026 | <https://en.wikipedia.org/wiki/Black_May_%28World_War_II%29> | 1943 年 5 月逐日战况与「41 艘」数字，交叉 Roskill 第 14 章 |
| `wiki_en_ons5` | Wikipedia EN | Convoy ONS 5 | 2026 | <https://en.wikipedia.org/wiki/Convoy_ONS_5> | ONS 5（1943-04-29 至 05-06）的编成、交战与损失 |
| `wiki_en_midgap` | Wikipedia EN | Mid-Atlantic gap | 2026 | <https://en.wikipedia.org/wiki/Mid-Atlantic_gap> | 「中大西洋空白区」的地理范围与闭合时间（1943 年护航航母与 VLR Liberator） |
| `wiki_en_escort_carrier` | Wikipedia EN | Escort carrier | 2026 | <https://en.wikipedia.org/wiki/Escort_carrier> | 护航航母（CVE）的起源、Bogue 级与 MAC/CAM 船的区别 |
| `wiki_en_enigma` | Wikipedia EN | Enigma machine | 2026 | <https://en.wikipedia.org/wiki/Enigma_machine> | 恩尼格玛的结构、转子与钥匙网；M4 四转子（1942-02 起用于 U 艇） |
| `wiki_en_u110` | Wikipedia EN | German submarine U-110 (1940) | 2026 | <https://en.wikipedia.org/wiki/German_submarine_U-110_%281940%29> | U-110（1941-05-09）被 HMS Bulldog 俘获、恩尼格玛与密码表被缴的经过 |
| `wiki_en_type_vii` | Wikipedia EN | Type VII submarine | 2026 | <https://en.wikipedia.org/wiki/Type_VII_submarine> | VII 型各亚型参数与建造数量 |
| `wiki_de_atlantikschlacht` | Wikipedia DE | Atlantikschlacht | 2026 | <https://de.wikipedia.org/wiki/Atlantikschlacht> | 德方视角的战役分期与术语（Geleitzugschlacht、Rudeltaktik） |

## 3. 重点条目的取舍说明

### 3.1 为什么以 Roskill + ONI 译本 KTB 为主轴

- **英方**：Roskill 三卷是英国官方二战史的海军卷，写法上把「战略—护航组织—战术」串起来，且其脚注指向 Admiralty 档案；HyperWar 有第 II 卷全文（含第 14 章 1943 年 1–5 月），可直接引章节。
- **德方**：`ktb_skl` 是德国海军作战部战争日志的 ONI 英译本（1948 年），是能在网上读到全文的德方最高层逐日记录；`uboatarchive_bduktb` 补充 BdU 层级的逐日日志与「常备作战命令」。两者合起来能对照「谁下了什么命令、哪一天」。
- **为什么不用 Doenitz 回忆录当事实来源**：他写作时正为纽伦堡判决与战后形象经营，日期与数字多有不确（例如对 1943 年 5 月撤退原因的叙述把责任推向技术劣势而不提密码失明）。本书只用来取「德方语气与自我叙述」。

### 3.2 数字口径的三套体系

| 口径 | 代表来源 | 用途 |
|---|---|---|
| 英国官方（HMSO） | `roskill_1954` `roskill_1956` `battleatlantic_1946` `behrens_1955` | 每月同盟国商船损失吨位、护航队规模、U 艇击沉数 |
| 德方档案 | `ktb_skl` `rohwer_axis_successes` `rohwer_chronology` `wynn_uboats` | 逐艇击沉与损失、狼群编成、U 艇出航/返航 |
| 修正派 | `blair_1996` `blair_1998` `rohwer_critical` | 对上面两套的逐条校正（尤其 1942 年东岸与 1943 年 3 月） |

**操作规则**：事件正文里出现吨位或艘数时，用「约」并给出区间；`forces.json` 的统计写清是哪一套口径；差额超过 10% 时在研究笔记里并列两说。

### 3.3 照片与档案的对应

照片的馆藏号（IWM A 28521、80-G-319661 等）与来源表里的官方机构条目对应：IWM 照片的许可与署名见 [06-photos.md](06-photos.md)；80-G 系列以 `nara_catalog` 与 `nhc_collections` 为出处指引。

## 4. 已知缺口

1. **Admiralty Battle Summary 系列**（如 BS 26 之外的北大西洋分册）未在线上找到可引原文；相关叙述改引 Roskill 与 Admiralty War Diaries。
2. **德国联邦档案馆（Bundesarchiv-Militärarchiv）的具体卷宗号**（RM 7 / RM 97 下的文件名）未逐条核对，凡引用档案号处均标「据二手文献转引」。
3. **FRUS 1941 年卷**未取得正文（本机 TLS 失败）；大西洋会议的美方外交记录改引 Avalon 的《大西洋宪章》全文与 `dimbleby_2015` 的二手叙述。
4. **英国国家档案馆（TNA）ADM 系列的原始护航报告**（ADM 199 等）需付费下载，未纳入；相关细节以 `nh_war_diaries` 转录与 Roskill 脚注为准。
5. **U 艇艇员的个人回忆**（如口述史）只选了 `mulligan_1999` 的统计性研究，未逐本纳入回忆录，避免以个人记忆替代档案。

## 5. 按数据文件的使用建议

下游（t13 数据、t14 海战）按下表挑来源，避免「一条来源打天下」：

| 目标文件 | 首选来源 | 备注 |
|---|---|---|
| `data/sources/main.json` | 本表全部 100 条（按 `id/title/author/year/url` 投影） | 引擎的 `Source` schema 只认 `id/title/author/year/url/license`；`supports`、`tier`、`note`、`holdings` 留在研究文档里 |
| `data/oob/*.json`（U 艇） | `uboat_net` `uboat_net_types` `wynn_uboats` `roessler_uboot` `rohwer_chronology` | 艇号、型号、服役/沉没日期、指挥官、击沉数 |
| `data/oob/*.json`（护航舰与航母） | `nh_ship_histories` `uboat_net_allies` `roskill_1956` `schull_1950` | 舰级、战历、所属护航群 |
| `data/oob/*.json`（商船与油轮） | `rohwer_axis_successes` `uboat_net` `hague_convoy` | 单船吨位与损失日期；商船船长嘉奖见 `gazette_34759` |
| `data/gazetteer/places.json` | `nh_maps` `roskill_1956`（地图）`hague_convoy` | 港口与海域坐标；护航队起止港 |
| `data/routes/*.json` | `hague_convoy` `nh_convoy_escorts` `roskill_1956` | 航线走向与队号（HX/SC/ONS/ON/PQ/JW） |
| `data/fronts/*.json` | `roskill_1956` `nh_maps` `uboat_net_ops` `uboat_net_combat_strength` | 狼群活动海域与空中掩护半径 |
| `data/events.json` | 逐年：`roskill_1954`（1939–41）`roskill_1956`（42–43）`mori_battle_atlantic` `mori_atlantic_won`（美方）`ktb_skl`（德方）`fuehrer_conferences`（决策） | 关键数字至少一条 official/archive |
| `data/naval/*.json`（射击/命中） | `roskill_1956` `rohwer_critical` `uboatarchive_ktb` `nh_pq17` | 时刻与战果；德方角度用 KTB |
| `data/naval/*.json`（signals 电文） | `ktb_skl` `uboatarchive_bduktb` `uboatarchive_admiralty` `fuehrer_conferences` `avalon_atlantic_charter` | 原文 + 中文译文；电文时刻注明原始时钟 |
| `data/equipment.json` | `roessler_uboot` `uboat_net_types` `navweaps` `uboat_net_technical` | 型号参数与技术对抗装备（Metox、通气管、Leigh Light、刺猬弹） |
| `data/forces.json` | `roskill_1954` `roskill_1956` `rohwer_axis_successes` `uboat_net_combat_strength` `uboat_net_fates` | 吨位与艘数注明口径；逐月在航 U 艇数 |

**投影脚本**（把研究表变成引擎可读的 `data/sources/main.json`，由 t13 执行）：

```bash
python3 - <<'EOF'
import json, pathlib
src = json.load(open("campaigns/battle-atlantic-1945/docs/research/05-sources.json"))["sources"]
keys = ("id", "title", "author", "year", "url")
out = [{k: s[k] for k in keys if k in s} for s in src]
pathlib.Path("campaigns/battle-atlantic-1945/data/sources/main.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
EOF
```

## 6. 引用示例

```json
{ "id": "e.black_may", "at": "1943-05-24T12:00", "category": "naval", "importance": 1,
  "title": { "zh": "黑色五月：邓尼茨撤出北大西洋" },
  "body": "……", "sources": ["roskill_1956", "ktb_skl", "fuehrer_conferences"], "confidence": "high" }
```

```json
{ "id": "de.u96", "side": "DE", "echelon": "ship", "type": "naval",
  "name": { "zh": "U-96", "orig": "U-96" }, "ship": { "kind": "submarine", "maxKn": 17.7 },
  "sources": ["uboat_net", "roessler_uboot", "wynn_uboats"], "confidence": "high" }
```


## 7. 电文原文与概述的标记约定

`data/naval/signals.json` 的 `text` 字段有两种性质，必须在数据里可分辨：

| 前缀 | 条数 | 含义 |
|---|---|---|
| （无前缀） | 30 | **逐字原文**：从档案、KTB 译本、伦敦公报或已出版电文集逐字抄录 |
| `[概述] ` | 66 | **内容摘要或格式复原**：原文未取得，按战史叙述还原要点，**不冒充原件** |

约定（2026-10 补充）：

- 概述条目的 `text` 以 `[概述] ` 开头，后面仍用方括号包住摘要本身，例如
  `[概述] [SSS … Athenia torpedoed … require immediate assistance]`。
  这样在电文纸带（`engine/ui/signals.ts`）里原文行会直接显示出「概述」二字，读者不必猜。
- 每条概述条目的 `zh` 末尾都注明「方括号内为…」，与 `text` 的前缀互为印证。
- 逐字原文条目不加上前缀，并在 `zh` 中说明出处（如「PQ 17 三道电令」「拉科尼亚命令全文」）。
- 引擎侧不解析该前缀，它只是数据层的可见约定；若将来要在 UI 上加「概述」徽标，
  按 `text.startsWith('[概述]')` 判断即可。
