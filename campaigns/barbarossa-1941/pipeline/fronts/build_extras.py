"""巴巴罗萨 1941：包围圈（data/pockets.json）、筑垒地域与防线叠加层（data/overlays.json）、分界线（data/demarcation.json）

    python3 campaigns/barbarossa-1941/pipeline/fronts/build_extras.py

包围圈的存续期与 build_fronts.py 中的「洞」一一对应（check_fronts.py 核对 anchor 是否落在洞里）；
units 字段留空，由整合者按各代理的部队 id 填写。
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402

DATA = os.path.join(geo.CAMP, 'data')


def P(pid, zh, orig, start, end, anchor, fate, note, sources):
    return {'id': pid, 'name': {'zh': zh, 'orig': orig}, 'start': start, 'end': end, 'anchor': anchor, 'fate': fate, 'note': note, 'sources': sources}


POCKETS = [
    P('p.brest_fortress', '布列斯特要塞', 'Брестская крепость', '1941-06-22T04:00', '1941-06-30T12:00', [23.655, 52.083], 'destroyed',
      '开战即被德第 45 步兵师包围，守军为苏第 6、42 步兵师各一部与边防、内务部队约 9000 人；6/29 东堡被 1800 公斤炸弹击毁后有组织抵抗结束，德方称俘约 7000 人，零星抵抗延续到 7 月下旬（加夫里洛夫少校 7/23 负伤被俘）。',
      ['fronts_wiki_en_brest_fortress', 'fronts_glantz_atlas_border', 'dra_4']),
    P('p.liepaja', '利耶帕亚', 'Liepāja / Libau', '1941-06-25T00:00', '1941-06-29T18:00', [21.06, 56.51], 'destroyed',
      '海军基地与苏第 67 步兵师被德第 291 步兵师围困，6/27 守军向北突围失败，6/29 德军入城，残部抵抗至 7/1。',
      ['fronts_wiki_ru_baltic_op', 'fronts_glantz_atlas_border']),
    P('p.bialystok', '比亚韦斯托克—沃尔科维斯克包围圈', 'Białystok–Wołkowysk', '1941-06-28T12:00', '1941-07-01T12:00', [24.30, 53.15], 'destroyed',
      '德第 9、4 集团军 6/28 在泽尔瓦会师，苏第 10 集团军与第 3 集团军一部被围于沃尔科维斯克以西；与新格鲁多克包围圈合计，德方称俘 32.4 万人、缴获坦克 3332 辆，苏西方面军 6/22–7/9 不可恢复损失约 34.1 万人。',
      ['fronts_wiki_en_bialystok_minsk', 'krivosheev', 'fronts_isaev_kotly']),
    P('p.minsk', '明斯克—新格鲁多克包围圈', 'Minsk–Nowogródek', '1941-06-28T18:00', '1941-07-08T20:00', [26.35, 53.80], 'destroyed',
      '霍特与古德里安的装甲钳 6/28 在明斯克合拢，苏第 3、10、13 集团军残部被围于明斯克以西的新格鲁多克与纳利博基森林，德步兵军逐步压缩，7/8–9 抵抗基本结束，部分人员化整为零转入敌后。',
      ['fronts_wiki_en_bialystok_minsk', 'krivosheev', 'fronts_isaev_kotly']),
    P('p.raseiniai', '拉塞尼艾（苏第 2 坦克师）', 'Raseiniai', '1941-06-25T12:00', '1941-06-27T12:00', [23.20, 55.42], 'destroyed',
      '苏第 3 机械化军第 2 坦克师在杜比萨河一线反击第 4 装甲集群，以 KV 坦克一度阻滞第 6 装甲师；6/25 起被第 1、6 装甲师与第 36 摩托化步兵师合围，燃料弹药耗尽，6/26–27 被歼，师长索良金阵亡。',
      ['fronts_wiki_ru_baltic_op', 'fronts_glantz_atlas_border', 'glantz_initial']),
    P('p.gdov', '格多夫（苏第 118 步兵师）', 'Гдов', '1941-07-17T12:00', '1941-07-22T12:00', [27.75, 58.80], 'destroyed',
      '德第 XXXVIII 军 7/17 攻占格多夫，苏第 118 步兵师一部被围于楚德湖东北岸，至 7/22 被肃清，余部沿湖岸向纳尔瓦方向突出。',
      ['fronts_wiki_ru_leningrad_op', 'glantz_leningrad']),
    P('p.kilpola', '基尔波拉—拉赫登波赫亚（拉多加湖西北岸）', 'Kilpola / Lahdenpohja', '1941-08-11T12:00', '1941-08-23T12:00', [30.25, 61.20], 'broke_out',
      '芬兰第 II 军 8 月上旬在拉赫登波赫亚抵拉多加湖，苏第 23 集团军第 168 步兵师等部被压至湖岸岛屿与半岛（基尔波拉岛一带）；拉多加湖区舰队 8 月中下旬分批将其经瓦拉姆岛撤往卡累利阿地峡，重装备大多遗弃。',
      ['fronts_wiki_en_finn_karelia_1941', 'fronts_mannerheim_finland']),
    P('p.porlampi', '波尔兰皮包围圈（维堡东南）', 'Porlampi / Порлампи', '1941-08-29T00:00', '1941-09-01T12:00', [28.80, 60.55], 'destroyed',
      '芬兰第 IV 军 8/29 攻占维堡后在其东南切断沿海公路，苏第 43、115、123 步兵师被围于波尔兰皮一带森林，9/1 前后被肃清；一部经科伊维斯托由海路撤出，芬方称俘约 9000 人（一说）。',
      ['fronts_wiki_en_finn_karelia_1941', 'fronts_raunio_kilin']),
    P('p.mogilev', '莫吉廖夫', 'Могилёв', '1941-07-16T12:00', '1941-07-26T18:00', [30.33, 53.89], 'destroyed',
      '苏第 61 步兵军（第 172 步兵师等）在第聂伯河两岸坚守莫吉廖夫，7/16 前后被德第 VII 军与古德里安后续部队包围，7/26 夜突围失败，城市陷落；德方称俘 3.5 万人。布伊尼奇田野之战即发生于此。',
      ['fronts_wiki_ru_mogilev', 'fronts_glantz_smolensk_atlas']),
    P('p.smolensk', '斯摩棱斯克包围圈', 'Смоленский котёл', '1941-07-27T12:00', '1941-08-05T12:00', [32.35, 54.90], 'destroyed',
      '苏第 16、20 集团军与第 19 集团军一部在斯摩棱斯克东北被围，7/27 第 20 摩托化步兵师与第 17 装甲师封闭索洛维约沃渡口；罗科索夫斯基集群反复冲击，部分部队夜间渡过第聂伯河撤出。德方称连同罗斯拉夫尔共俘约 31 万人。',
      ['fronts_wiki_en_smolensk', 'glantz_derailed', 'fronts_glantz_smolensk_atlas']),
    P('p.roslavl', '罗斯拉夫尔包围圈（卡恰洛夫集群）', 'Рославль', '1941-08-02T12:00', '1941-08-05T12:00', [32.45, 54.05], 'destroyed',
      '古德里安 8/1 发起罗斯拉夫尔战役，合围向斯摩棱斯克反攻的第 28 集团军卡恰洛夫集群（三个步兵师与第 104 坦克师），卡恰洛夫中将 8/4 在斯塔林卡附近阵亡；德方称俘 3.8 万人。',
      ['glantz_derailed', 'fronts_glantz_smolensk_atlas', 'fronts_isaev_kotly']),
    P('p.uman', '乌曼包围圈', 'Уманский котёл', '1941-08-02T18:00', '1941-08-08T18:00', [30.45, 48.50], 'surrendered',
      '第 1 装甲集群与第 17 集团军 8/2 在佩尔沃迈斯克会师，苏第 6、12 集团军与第 18 集团军一部被围于乌曼以南的波德维索科耶（「绿门」林区）；两位集团军司令穆济琴科、波涅杰林被俘。德方称俘 10.3 万人，苏方统计约 6.5 万人未能突围。',
      ['fronts_wiki_en_uman', 'fronts_isaev_kotly', 'stahel_kiev']),
    P('p.odessa', '敖德萨', 'Одесса', '1941-08-13T00:00', '1941-10-16T06:00', '@odessa', 'broke_out',
      '罗马尼亚第 4 集团军 8/5 起围攻，8/13 陆上联系被切断；独立滨海集团军依托海运坚守 73 天，9/22 格里戈里耶夫卡登陆后一度击退东段之敌。因克里米亚告急，10/1–16 约 8.6 万人经海路撤往塞瓦斯托波尔。罗方伤亡约 9 万人。',
      ['fronts_wiki_en_odessa', 'fronts_axworthy_romania']),
    P('p.tallinn', '塔林', 'Tallinn / Reval', '1941-08-07T18:00', '1941-08-28T12:00', '@tallinn', 'broke_out',
      '德军 8/7 在昆达抵芬兰湾后，苏第 8 集团军第 10 步兵军与波罗的海舰队陆战队被隔断在塔林；8/27–28 舰队携守军撤往喀琅施塔得，在尤明达角雷区损失大批舰船，死亡人数一说逾 1.2 万人。',
      ['fronts_wiki_en_tallinn_evac', 'fronts_wiki_en_estonia_1941']),
    P('p.luga', '卢加包围圈', 'Лужский котёл', '1941-08-25T00:00', '1941-09-15T12:00', [30.05, 59.02], 'destroyed',
      '8/24 卢加失守后，卢加集群南段（第 41 步兵军等）约 4.3 万人被围于卢加以北的森林沼泽，坚持到 9 月中旬，约 2 万人被俘，余部小股突回列宁格勒。',
      ['fronts_wiki_ru_leningrad_op', 'glantz_leningrad']),
    P('p.velikie_luki', '大卢基包围圈', 'Великие Луки', '1941-08-23T00:00', '1941-08-27T12:00', [31.10, 56.55], 'broke_out',
      '第 LVII 摩托化军 8/22 起合围苏第 22 集团军第 51、62 步兵军，8/26 攻占大卢基；被围部队向东北托罗佩茨方向突围，损失惨重，德方称俘约 3 万人。',
      ['glantz_derailed', 'fronts_glantz_smolensk_atlas']),
    P('p.kiev', '基辅包围圈', 'Киевский котёл', '1941-09-14T18:00', '1941-09-26T12:00', [32.55, 50.10], 'destroyed',
      '9/14 第 3 装甲师与第 9 装甲师在洛赫维察会师，西南方面军第 5、21、26、37 集团军被围；9/19 基辅陷落，9/20 方面军司令基尔波诺斯在舒梅伊科沃阵亡。德方称俘 66.5 万人，苏方统计西南方面军不可恢复损失约 61.6 万人。',
      ['fronts_wiki_en_kiev', 'stahel_kiev', 'krivosheev']),
    P('p.oranienbaum', '奥拉宁鲍姆桥头堡', 'Ораниенбаумский плацдарм', '1941-09-16T18:00', '1941-12-06T23:59', [29.45, 59.85], 'relieved',
      '德军 9/16 在乌里茨克抵芬兰湾，苏第 8 集团军被隔断在奥拉宁鲍姆—彼得戈夫以西的滨海地带，依托喀琅施塔得要塞炮火坚守，桥头堡一直保持到 1944 年 1 月解围。',
      ['glantz_leningrad', 'fronts_wiki_ru_leningrad_op']),
    P('p.saaremaa', '萨列马岛—瑟尔韦半岛', 'Saaremaa / Sõrve', '1941-08-28T12:00', '1941-10-05T12:00', [22.08, 57.95], 'surrendered',
      '塔林失守后蒙海峡群岛守军（约 2.3 万人，一说）孤悬敌后；德第 61 步兵师 9/14 登陆穆胡岛，9/21 攻占库雷萨雷，残部退守瑟尔韦半岛至 10/5 投降。',
      ['fronts_wiki_en_beowulf']),
    P('p.hiiumaa', '希乌马岛', 'Hiiumaa / Dagö', '1941-08-28T12:00', '1941-10-21T12:00', [22.62, 58.90], 'surrendered',
      '德军 10/12 在希乌马岛登陆，守军抵抗到 10/21，部分人员乘船撤往汉科；蒙海峡群岛战役中德方称共俘约 1.5 万人。',
      ['fronts_wiki_en_beowulf']),
    P('p.vyazma', '维亚济马包围圈', 'Вяземский котёл', '1941-10-07T12:00', '1941-10-13T12:00', [33.75, 55.10], 'destroyed',
      '第 7、10 装甲师 10/7 在维亚济马以东会师，西方面军与预备队方面军的第 16（司令部撤出）、19、20、24、32 集团军与博尔金集群被围，卢金中将受伤被俘；与布良斯克合计德方称俘 67.3 万人，苏方估计两地损失约 50–60 万人。',
      ['fronts_wiki_en_vyazma', 'stahel_typhoon', 'fronts_isaev_kotly']),
    P('p.bryansk_north', '布良斯克北包围圈', 'Брянский котёл (северный)', '1941-10-06T12:00', '1941-10-17T12:00', [34.25, 53.50], 'broke_out',
      '第 17 装甲师 10/6 攻占布良斯克，苏第 50 集团军被围于布良斯克以北的森林，集团军司令彼得罗夫少将在突围中负伤身亡，残部向东突出。',
      ['fronts_wiki_en_vyazma', 'stahel_typhoon', 'fronts_glantz_atlas_moscow']),
    P('p.bryansk_south', '布良斯克南包围圈', 'Брянский котёл (южный)', '1941-10-06T12:00', '1941-10-23T12:00', [33.85, 52.55], 'broke_out',
      '苏第 3、13 集团军被围于特鲁布切夫斯克—纳夫利亚之间，10 月中下旬分批向东南突围，在法捷日—德米特罗夫斯克一线重新建立防线，损失大量重装备。',
      ['fronts_wiki_en_vyazma', 'stahel_typhoon', 'fronts_glantz_atlas_moscow']),
    P('p.chernigovka', '切尔尼戈夫卡包围圈', 'Черниговка', '1941-10-06T12:00', '1941-10-11T00:00', [36.20, 47.20], 'destroyed',
      '第 1 装甲集团军自第聂伯罗彼得罗夫斯克桥头堡南下，10/6–7 抵亚速海别尔江斯克，苏南方面军第 18 集团军与第 9 集团军一部被围于切尔尼戈夫卡一带，集团军司令斯米尔诺夫中将阵亡；德方称俘 6.5 万人。',
      ['fronts_wiki_en_azov', 'fronts_isaev_kotly']),
    P('p.sevastopol', '塞瓦斯托波尔', 'Севастополь', '1941-10-30T12:00', '1941-12-06T23:59', '@sevastopol', 'surrendered',
      '德第 11 集团军 10/30 起围攻要塞区，滨海集团军从敖德萨、伊顺方向经山路退入，与黑海舰队陆战队共守；11 月第一次强攻被击退，围城持续到 1942 年 7 月初要塞才陷落（结局一栏指 1942 年）。',
      ['fronts_wiki_en_sevastopol', 'fronts_wiki_en_crimea']),
    P('p.hanko', '汉科', 'Hanko / Hangö', '1941-06-25T12:00', '1941-12-02T12:00', [23.05, 59.85], 'broke_out',
      '1940 年租借给苏联的汉科海军基地（约 2.5 万人）开战后被芬军封锁，守军顶住了 7 月初的进攻；10 月底至 12/2 分批经海路撤往列宁格勒，途中「约瑟夫·斯大林」号运输船触雷。芬军 12/4 进入。',
      ['fronts_wiki_en_hanko', 'fronts_mannerheim_finland']),
]


def L(oid, label, line, sources):
    return {'id': oid, 'layer': 'fortlines', 'kind': 'line', 'label': label, 'line': line, 'style': 'fortline', 'sources': sources}


MOL = ['fronts_wiki_ru_molotov_line', 'fronts_melnikov_ur']
STA = ['fronts_wiki_ru_stalin_line', 'fronts_melnikov_ur']
OVERLAYS = [
    # ---- 「莫洛托夫防线」：1940–1941 年新国境筑垒地域（大多未完工）
    L('fl.molotov_telsiai', '莫洛托夫防线 · 泰尔希艾筑垒地域', [[21.25, 56.00], [21.55, 55.75], [21.95, 55.55]], MOL),
    L('fl.molotov_kaunas', '莫洛托夫防线 · 考纳斯筑垒地域', [[22.65, 55.15], [22.85, 54.85], [23.00, 54.55]], MOL),
    L('fl.molotov_grodno', '莫洛托夫防线 · 格罗德诺筑垒地域', [[23.50, 54.05], [23.60, 53.85], [23.65, 53.65], [23.55, 53.45]], MOL),
    L('fl.molotov_osowiec', '莫洛托夫防线 · 奥索维茨筑垒地域', [[22.60, 53.60], [22.55, 53.45], [22.35, 53.30]], MOL),
    L('fl.molotov_zambrow', '莫洛托夫防线 · 赞布鲁夫筑垒地域', [[22.10, 53.15], [22.25, 52.95], [22.55, 52.75]], MOL),
    L('fl.molotov_brest', '莫洛托夫防线 · 布列斯特筑垒地域', [[23.00, 52.42], [23.40, 52.27], [23.65, 52.05], [23.70, 51.80]], MOL),
    L('fl.molotov_vladimir', '莫洛托夫防线 · 弗拉基米尔-沃伦斯基筑垒地域', [[24.05, 51.10], [24.20, 50.90], [24.20, 50.70]], MOL),
    L('fl.molotov_strumilov', '莫洛托夫防线 · 斯特鲁米洛夫筑垒地域', [[24.15, 50.42], [24.30, 50.28], [24.30, 50.10]], MOL),
    L('fl.molotov_rava', '莫洛托夫防线 · 拉瓦-鲁斯卡筑垒地域', [[23.30, 50.30], [23.65, 50.27], [23.95, 50.30]], MOL),
    L('fl.molotov_przemysl', '莫洛托夫防线 · 普热梅希尔筑垒地域', [[22.80, 49.95], [22.88, 49.78], [22.65, 49.65], [22.45, 49.45]], MOL),
    # ---- 「斯大林防线」：1928–1938 年旧国境筑垒地域
    L('fl.stalin_karelian', '斯大林防线 · 卡累利阿筑垒地域', [[29.98, 60.15], [30.10, 60.30], [30.35, 60.42], [30.70, 60.45]], STA),
    L('fl.stalin_pskov', '斯大林防线 · 普斯科夫筑垒地域', [[28.05, 57.95], [28.10, 57.75], [28.15, 57.60]], STA),
    L('fl.stalin_ostrov', '斯大林防线 · 奥斯特罗夫筑垒地域', [[28.10, 57.48], [28.20, 57.30], [28.30, 57.15]], STA),
    L('fl.stalin_sebezh', '斯大林防线 · 谢别日筑垒地域', [[28.20, 56.48], [28.30, 56.30], [28.38, 56.12]], STA),
    L('fl.stalin_polotsk', '斯大林防线 · 波洛茨克筑垒地域', [[28.10, 55.72], [28.45, 55.42], [28.70, 55.25]], STA),
    L('fl.stalin_minsk', '斯大林防线 · 明斯克筑垒地域', [[26.95, 54.32], [27.15, 53.95], [27.35, 53.70]], STA),
    L('fl.stalin_slutsk', '斯大林防线 · 斯卢茨克筑垒地域', [[27.05, 53.25], [27.10, 52.95], [27.30, 52.70]], STA),
    L('fl.stalin_mozyr', '斯大林防线 · 莫济里筑垒地域', [[27.70, 52.20], [28.10, 51.95], [28.55, 51.70]], STA),
    L('fl.stalin_korosten', '斯大林防线 · 科罗斯坚筑垒地域', [[27.95, 51.20], [28.15, 50.95], [28.30, 50.70]], STA),
    L('fl.stalin_novograd', '斯大林防线 · 新沃伦斯克筑垒地域', [[27.40, 50.85], [27.55, 50.60], [27.50, 50.35]], STA),
    L('fl.stalin_shepetovka', '斯大林防线 · 舍佩托夫卡与旧康斯坦丁诺夫筑垒地域', [[27.05, 50.30], [27.15, 50.05], [27.35, 49.80]], STA),
    L('fl.stalin_letichev', '斯大林防线 · 列季切夫筑垒地域', [[27.40, 49.60], [27.70, 49.38], [27.80, 49.10]], STA),
    L('fl.stalin_mogilev_yampol', '斯大林防线 · 莫吉廖夫-波多利斯基与亚姆波尔筑垒地域', [[27.55, 48.55], [27.85, 48.45], [28.10, 48.35], [28.40, 48.15]], STA),
    L('fl.stalin_rybnitsa', '斯大林防线 · 雷布尼察筑垒地域', [[28.70, 47.98], [28.95, 47.75], [29.10, 47.60]], STA),
    L('fl.stalin_tiraspol', '斯大林防线 · 蒂拉斯波尔筑垒地域', [[29.35, 47.15], [29.65, 46.85], [29.90, 46.55]], STA),
    L('fl.stalin_kiev', '基辅筑垒地域（伊尔片河一线）', [[30.25, 50.72], [30.15, 50.50], [30.22, 50.33], [30.45, 50.24], [30.70, 50.28]], STA + ['fronts_wiki_en_kiev']),
    # ---- 1941 年夏秋新建防线
    L('fl.luga_line', '卢加防线（1941 年 7 月）', geo.river('luga', [28.40, 59.66], [29.84, 58.74], step=12) + [[30.10, 58.60], [30.45, 58.45], [30.85, 58.30], [31.15, 58.35]],
      ['fronts_wiki_ru_luga_line', 'fronts_wiki_ru_leningrad_op']),
    L('fl.rzhev_vyazma', '勒热夫—维亚济马防线（1941 年 7–10 月）', [[33.10, 57.10], [33.40, 56.60], [33.75, 56.05], [33.90, 55.55], [34.05, 55.15], [34.30, 54.80], [34.40, 54.40], [34.35, 54.05]],
      ['fronts_wiki_ru_rzhev_vyazma_line']),
    L('fl.mozhaisk', '莫扎伊斯克防线（1941 年 10 月）', [[35.95, 56.10], [35.95, 55.80], [35.90, 55.55], [36.10, 55.30], [36.35, 55.05], [36.30, 54.70], [36.25, 54.45]],
      ['fronts_wiki_ru_mozhaisk_line', 'fronts_glantz_atlas_moscow']),
    L('fl.moscow_canal', '莫斯科防御区 · 莫斯科—伏尔加运河防线', [[37.52, 56.34], [37.47, 56.20], [37.48, 56.05], [37.45, 55.90]],
      ['fronts_wiki_ru_moscow_zone', 'fronts_glantz_atlas_moscow']),
    L('fl.moscow_zone', '莫斯科防御区 · 主防御地带', [[37.45, 55.90], [37.25, 55.82], [37.22, 55.62], [37.42, 55.48], [37.70, 55.45], [37.95, 55.55]],
      ['fronts_wiki_ru_moscow_zone', 'fronts_glantz_atlas_moscow']),
    L('fl.perekop', '彼列科普土耳其壁与伊顺阵地', [[33.62, 46.17], [33.90, 46.14], [34.00, 45.98], [33.70, 45.95]], ['fronts_wiki_en_crimea']),
]


def dump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'{len(obj)} → {path}')


if __name__ == '__main__':
    ids = [p['id'] for p in POCKETS]
    assert len(ids) == len(set(ids))
    for p in POCKETS:
        assert p['start'] < p['end'], p['id']
    dump(os.path.join(DATA, 'pockets.json'), POCKETS)
    dump(os.path.join(DATA, 'overlays.json'), OVERLAYS)
    dump(os.path.join(DATA, 'demarcation.json'), [])
