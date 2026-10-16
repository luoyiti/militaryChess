"""历史事件：写 data/events.json。地点缺省取第一个相关舰船在该时刻的位置（读 data/oob，须先跑 merge.py）。
时刻为英方舰钟 Zone +2（UTC−2）；正文 80–140 字。运行：python3 campaigns/river-plate-1939/pipeline/build/events.py"""
import json, os, glob
from datetime import datetime
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
def dump(p, obj):
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, indent=1); f.write('\n')
units = {u['id']: u for f in glob.glob(P('data/oob/*.json')) for u in json.load(open(f, encoding='utf-8'))}
H = lambda iso: datetime.fromisoformat(iso).timestamp() / 3600
def pos_at(uid, at):
    tr = units[uid]['track']; h = H(at)
    if h <= H(tr[0]['at']): return tr[0]['pos']
    for a, b in zip(tr, tr[1:]):
        ha, hb = H(a['at']), H(b['at'])
        if ha <= h <= hb:
            t = (h - ha) / (hb - ha) if hb > ha else 0
            return [round(a['pos'][0] + (b['pos'][0] - a['pos'][0]) * t, 4), round(a['pos'][1] + (b['pos'][1] - a['pos'][1]) * t, 4)]
    return tr[-1]['pos']

HD, AD, WT = 'harwood_despatch', 'admiralty_1940', 'waters_1956'
GS, EX, AJ, AC = 'de.graf_spee', 'gb.exeter', 'gb.ajax', 'nz.achilles'
EV = []
def e(id, at, cat, imp, side, zh, orig, body, src, units=(), place=None, zoom=None, sfx=None, conf='high', prec=None, wide=False):
    ev = {'id': f'e.{id}', 'at': at, 'category': cat, 'importance': imp}
    if prec: ev['precision'] = prec
    if side: ev['side'] = side
    ev['title'] = {'zh': zh, 'orig': orig}
    ev['body'] = body
    ev['place'] = place if place is not None else pos_at(units[0], at)
    if units: ev['units'] = list(units)
    if sfx: ev['sfx'] = sfx
    if zoom: ev['zoomRel'] = zoom
    if wide: ev['wide'] = True
    ev['sources'] = src; ev['confidence'] = conf
    n = len(body)
    assert 70 <= n <= 150, f'{id}: 正文 {n} 字'
    EV.append(ev)

# ---------- 通商破坏 ----------
e('raid_order', '1939-09-26T16:43', 'political', 2, 'DE', '柏林放出袭击舰', 'Handelskrieg freigegeben',
  '施佩伯爵号 8 月 21 日就已悄悄驶出威廉港，在大西洋腹地等了近一个月。9 月 26 日，海军战争指挥部电令它依照《战利品法规》开始截击商船：先停船检查，让船员离船，再将船击沉。补给油船阿尔特马克号随行，按预先编好的「会合线」在洋中接应。',
  ['ktb_skl', 'roskill_1954'], [GS, 'de.altmark'], zoom=3, sfx=['morse'], prec='hour')
e('clement', '1939-09-30T11:00', 'naval', 1, 'DE', '克莱门特号：第一个猎物', 'SS Clement sunk off Pernambuco',
  '伯南布哥东南约 75 海里，布斯公司货轮克莱门特号被一艘军舰拦下。船员乘救生艇离开后，德舰用炮火把它击沉，又以「舍尔海军上将号」的名义电告岸台前来救人。英国海军部由此得知南大西洋有一艘袖珍战列舰，却认错了是哪一艘。',
  ['wiki_en_clement', 'maritimequest', 'roskill_1954'], [GS, 'gb.m_clement'], zoom=7, sfx=['ship_gun', 'morse'], conf='medium', prec='hour')
e('panama', '1939-10-03T12:00', 'political', 3, None, '巴拿马宣言', 'Declaration of Panama',
  '10 月 3 日，美洲 21 国外长在巴拿马宣布：美洲沿岸约 300 海里内为中立安全区，交战国不得在此作战。宣言没有执行手段，英德双方都不承认；但 12 月 13 日的海战正是在这条线以内打响的，事后各国据此联名向英、法、德三国提出抗议。',
  ['panama_declaration', 'frus_1939_v5'], place=[-33.0, -27.0], zoom=1.6, prec='day')
e('hunting_groups', '1939-10-05T12:00', 'political', 1, 'GB', '八个猎杀群', 'Hunting groups F–N',
  '为了对付袭击舰，英法两国组成八个猎杀群：南美东岸的 G 群、弗里敦的 K 群（声望号与皇家方舟号）、达喀尔的 X 群、好望角的 H 群，以及印度洋与加勒比海的各群，共动用 3 艘航空母舰、2 艘战列巡洋舰和十余艘巡洋舰。南大西洋太大，它们大多在扑空。',
  ['roskill_1954', 'naval_history_net'], ['gb.admiralty', 'gb.force_g', 'gb.force_k', 'fr.dupleix'], place=[-18.0, -12.0], zoom=1.4, prec='day', wide=True)
e('newton_beech', '1939-10-05T13:00', 'naval', 3, 'DE', '牛顿·比奇号被俘', 'Newton Beech captured',
  '施佩伯爵号横越大西洋，出现在开普敦—弗里敦航线上，截获货轮牛顿·比奇号。德方把它改作关押俘虏的捕获船，又用缴获的马可尼发报机发出假的「潜艇袭击」电文，故意报错位置，搅乱英方判断。三天后，这艘跑不快的捕获船被凿沉。',
  ['maritimequest', 'ktb_skl'], [GS, 'gb.m_newton_beech'], zoom=7, sfx=['morse'], conf='medium', prec='hour')
e('ashlea', '1939-10-07T12:00', 'naval', 3, 'DE', '阿什利号沉没', 'SS Ashlea sunk',
  '两天后，载糖回国的阿什利号也被截停。船长波廷杰与船员被带上袭击舰，货船随后被爆破装药与炮火击沉。施佩伯爵号整个袭击航程击毁九艘商船、五万总吨，却没有一名船员丧生——这在两次世界大战的海上袭击战里都很少见。',
  ['maritimequest', 'wiki_en_graf_spee'], [GS, 'gb.m_ashlea'], zoom=7, sfx=['ship_gun'], conf='medium', prec='hour')
e('altmark_rv', '1939-10-15T12:00', 'movement', 2, 'DE', '洋中会合：阿尔特马克号', 'Rendezvous with Altmark',
  '10 月 15 日，施佩伯爵号押着俘获的猎人号，在大西洋腹地与阿尔特马克号会合。两船并排航行，用软管输送柴油，再把三艘商船的船员送进油船货舱。阿尔特马克号伪装成挪威船，前后为袭击舰加油九次，成了一座漂浮的监狱。猎人号 17 日被炸沉。',
  ['bs26', 'hmsajax_org', 'wiki_de_altmark'], [GS, 'de.altmark', 'gb.m_huntsman'], zoom=6, conf='medium', prec='day')
e('trevanion', '1939-10-22T12:00', 'naval', 2, 'DE', '特雷瓦尼恩号的求救电报', 'Trevanion: “RRR”',
  '非洲西南海域，货轮特雷瓦尼恩号被拦下时，报务员不顾警告，一遍遍发出「RRR」——遭袭击舰攻击的国际信号。德舰开炮打掉了天线，但电报已被收到。英国人第一次知道袭击舰到了好望角航线上。施佩伯爵号则转身南下，准备绕过非洲。',
  ['gazette_34815', 'ktb_skl'], [GS, 'gb.m_trevanion'], zoom=6, sfx=['morse', 'ship_gun'], conf='medium', prec='hour')
e('indian', '1939-11-03T00:00', 'movement', 3, 'DE', '绕过好望角', 'Into the Indian Ocean',
  '为了把猎杀群引开，朗斯多夫远在好望角以南绕过非洲，进入印度洋，在德班与洛伦索马贵斯之间的航线外搜索了十几天，却几乎不见船影——英国已让商船改走远离海岸的航线。舰上的柴油与补给日渐紧张，阿拉多水上飞机也坏了。',
  ['ktb_skl', 'roskill_1954'], [GS], zoom=2.6, conf='medium', prec='day')
e('africa_shell', '1939-11-15T10:00', 'naval', 2, 'DE', '非洲壳牌号：印度洋的佯动', 'Africa Shell sunk off Zavora',
  '莫桑比克扎沃拉角外，施佩伯爵号击沉了只有 706 总吨的小油轮非洲壳牌号——就在葡萄牙领海的边上。船长多夫抗议无效，被带上袭击舰。这是它在印度洋唯一的战果，却达到了目的：英方把注意力转向东非，它则悄悄折回大西洋。',
  ['wiki_en_africa_shell', 'wiki_en_dove', 'ktb_skl'], [GS, 'gb.m_africa_shell'], zoom=6, sfx=['ship_gun'], prec='hour')
e('disguise', '1939-11-27T12:00', 'movement', 3, 'DE', '伪装成战列巡洋舰', 'Dummy turret and funnel',
  '折返途中，舰员用帆布和木料在舰桥前加装假炮塔、在弹射器后加装假烟囱，让施佩伯爵号远看像一艘英国战列巡洋舰，12 月初被截的商船船员看到的就是这副模样。11 月 27 日，它在特里斯坦—达库尼亚东北与阿尔特马克号再次会合，把船长们接回舰上。',
  ['wiki_en_graf_spee', 'bs26', 'gazette_34815'], [GS, 'de.altmark'], zoom=5, conf='medium', prec='day')
e('doric_star', '1939-12-02T13:30', 'naval', 1, 'DE', '多里克之星号的「RRR」', 'Doric Star: “RRR 1915S 0505E”',
  '蓝星公司的冷藏船多里克之星号满载冻肉自新西兰回国。被截时报务员冒着炮火发出「RRR」和船位，南大西洋司令部收到了。朗斯多夫明知行踪暴露，仍想再猎一次大船。远在拉普拉塔河口外，哈伍德准将把这份电报的位置标上海图，开始计算。',
  ['wiki_en_doric_star', 'bs26', HD], [GS, 'gb.m_doric_star'], zoom=5, sfx=['morse', 'ship_gun'], prec='hour')
e('tairoa', '1939-12-03T04:00', 'naval', 3, 'DE', '泰罗阿号', 'SS Tairoa sunk',
  '次日清晨，袭击舰又截住了泰罗阿号。报务员同样发报求救，德舰开炮打掉电台，三名船员受伤——这是整个袭击航程中商船上唯一的人员伤亡。施佩伯爵号随即高速西驶，横越大西洋，准备最后一次与阿尔特马克号会合。',
  ['wiki_en_tairoa', 'naval_history_net'], [GS, 'gb.m_tairoa'], zoom=6, sfx=['ship_gun'], conf='medium', prec='hour')
e('harwood_appr', '1939-12-03T12:00', 'political', 1, 'GB', '哈伍德的判断', 'Harwood’s appreciation',
  '哈伍德推算：袭击舰若驶向南美，最早 12 日到里约热内卢，12 或 13 日到拉普拉塔河口。河口的粮食与肉类航运最值钱，也最诱人。他决定把能调动的三艘巡洋舰——埃克塞特号、阿贾克斯号、阿喀琉斯号——12 日集中到河口以东，坎伯兰号留在福克兰检修。他赌对了。',
  [HD, 'roskill_1954'], [AJ, 'gb.force_g'], zoom=2.6, prec='day')
e('altmark_last', '1939-12-06T18:00', 'movement', 3, 'DE', '最后一次加油', 'Last rendezvous with Altmark',
  '12 月 6 日，施佩伯爵号与阿尔特马克号最后一次会合，加满柴油，把多里克之星号与泰罗阿号的约 140 名船员转到油船上。此后近三百名英国商船船员被关在阿尔特马克号的货舱里，直到 1940 年 2 月才在挪威峡湾被英国驱逐舰哥萨克人号救出。',
  ['wiki_de_graf_spee', 'hmsajax_org', 'ktb_skl'], [GS, 'de.altmark'], zoom=5, conf='medium', prec='day')
e('streonshalh', '1939-12-07T17:00', 'naval', 2, 'DE', '最后一个猎物', 'SS Streonshalh sunk',
  '12 月 7 日傍晚，施佩伯爵号击沉了自蒙得维的亚出航的小货轮斯特雷翁沙尔号。缴获的文件显示拉普拉塔河口商船云集，护航薄弱。朗斯多夫决定去那里截击一支船队，然后趁新月夜突破回国。他不知道，三艘英国巡洋舰正在河口外等着他。',
  ['maritimequest', 'wiki_en_graf_spee'], [GS, 'gb.m_streonshalh'], zoom=6, sfx=['ship_gun'], prec='hour')
e('concentration', '1939-12-12T07:00', 'movement', 2, 'GB', '三舰会合', 'Force G concentrates',
  '12 日清晨，三舰在河口以东约 150 海里会合。哈伍德发出作战方针：一旦遭遇袖珍战列舰，不论昼夜立即进攻；白天分成两队，埃克塞特号与两艘轻巡洋舰从不同方向夹击，迫使敌舰分散火力，也便于从侧面校正弹着。当天各舰反复演练这一战术。',
  [HD], [AJ, AC, EX], zoom=8, sfx=['bell'], prec='hour')

# ---------- 海战（13 日） ----------
D = '1939-12-13T'
e('sighting', D + '06:14', 'naval', 1, 'GB', '「我认为那是一艘袖珍战列舰」', '“I think it is a pocket battleship”',
  '05:52，施佩伯爵号的瞭望员先看见了桅顶，朗斯多夫以为是护航船队的驱逐舰，下令全速迎上去。06:14，阿贾克斯号发现西北方的烟迹，派埃克塞特号前出查看。两分钟后，埃克塞特号打出灯光信号：「我认为那是一艘袖珍战列舰。」各舰升起战旗。',
  [HD, AD, 'wiki_de_river_plate'], [AJ, EX, GS], zoom=45, sfx=['bell'], prec='minute')
e('open_fire', D + '06:18', 'battle', 1, 'DE', '开火', 'Graf Spee opens fire',
  '06:18，施佩伯爵号在约 19,800 码处首先开火，一座炮塔打埃克塞特号，另一座打两艘轻巡洋舰。埃克塞特号 06:20 还击，阿喀琉斯号、阿贾克斯号相继开火。哈伍德的战术奏效，英舰分在两侧，德舰只得分散火力；但 28 厘米炮弹很快集中到了最大的威胁——埃克塞特号身上。',
  [HD, WT, 'kaack_2010'], [GS, EX], zoom=70, sfx=['ship_gun', 'artillery'], prec='minute')
e('exeter_b', D + '06:24', 'battle', 1, 'DE', '埃克塞特号的舰桥', 'Exeter’s B turret and bridge hit',
  '06:24，一发 28 厘米炮弹击中埃克塞特号的 B 炮塔，弹片横扫舰桥：除舰长贝尔与另外两人外，舰桥上的人全部死伤，舵轮室通信被切断。贝尔改到后部指挥位，靠一串传令兵把命令喊到舵机舱。此前一发近失弹已杀死右舷鱼雷手，打烂了两架水上飞机。',
  [HD, 'atwill_1977'], [EX], zoom=90, sfx=['explosion'], prec='minute')
e('gs_turn', D + '06:34', 'naval', 2, 'DE', '鱼雷与烟幕', 'Graf Spee turns away under smoke',
  '06:32，埃克塞特号用局部控制射出右舷三条鱼雷。施佩伯爵号随即向左转了约 150°，在烟幕中改向西北，鱼雷落空。德方日志写道：埃克塞特号遭重创后急转开去，只剩一座炮塔在射击。与此同时，第一分队已提速到 28 节，从东面继续逼近。',
  [HD, AD, 'usni_cambareri_1983'], [GS, EX], zoom=75, sfx=['ship_gun'], conf='medium', prec='minute')
e('seafox', D + '06:37', 'air', 2, 'GB', '海狐升空', 'Ajax launches her Seafox',
  '06:37，阿贾克斯号在 X、Y 炮塔向前方开火的同时弹射起飞「海狐」水上飞机，炮口风吹得飞机剧烈摇晃。飞行员卢因与观察员卡尼此后在战场上空盘旋两个半小时，为第一分队校正弹着——这是英国舰载机第一次在海战中担任炮兵观测。',
  [HD, 'faaoa_lewin'], ['gb.seafox', AJ], zoom=85, sfx=['engine'], prec='minute')
e('exeter_a', D + '06:38', 'battle', 1, 'DE', '只剩一座炮塔', 'Exeter’s A turret knocked out',
  '06:38，埃克塞特号转向准备发射左舷鱼雷时又中两弹：A 炮塔被毁，另一发钻进舰内，在士官舱平台爆炸起火，4 英寸弹药库进水。罗经全毁，贝尔用一只小艇罗经操舰。观察员报告它「完全淹没在烟与火里」，片刻后它又冲了出来，靠 Y 炮塔继续射击。',
  [HD, AD, 'atwill_1977'], [EX], zoom=90, sfx=['explosion'], prec='minute')
e('achilles_dct', D + '06:40', 'battle', 2, 'NZ', '阿喀琉斯号的指挥塔', 'Splinters in Achilles’ director',
  '06:40，一发 28 厘米弹在阿喀琉斯号舰桥正横的海面炸开，弹片射入射击指挥塔，4 人阵亡，其中两名是新西兰人；炮术长沃什伯恩被震晕，帕里舰长腿部受伤。几分钟后指挥塔恢复射击，但射击控制电台随即失灵，两艘轻巡洋舰的弹着混在一起，约二十分钟几乎打不中。',
  [HD, WT, 'nzhistory_battle'], [AC], zoom=90, sfx=['explosion'], prec='minute')
e('smoke', D + '07:00', 'naval', 3, 'DE', '烟幕下的施佩伯爵号', 'Smoke and zigzags',
  '07:00 前后，施佩伯爵号频繁变向，用化学发烟器和烟雾浮标大量施放烟幕。此前埃克塞特号的一发 8 英寸弹已打坏它的燃油与润滑油净化设备——这一发不起眼的命中，后来决定了它不能长途返航。东南风把烟幕吹向西北，英舰只能在烟幕的间隙里射击。',
  [HD, 'kaack_2010', WT], [GS], zoom=70, conf='medium', prec='minute')
e('ajax_torp', D + '07:24', 'naval', 2, 'GB', '阿贾克斯号的鱼雷', 'Ajax fires torpedoes; X and Y turrets lost',
  '07:24，第一分队把距离缩短到约 9,000 码，阿贾克斯号转向射出四条鱼雷，施佩伯爵号立即左转避开。一分钟后，一发延期引信的 28 厘米弹从后上层建筑钻入阿贾克斯号，穿过 X 炮塔座圈爆炸，X、Y 两座炮塔同时被打哑。海狐号随后报告：「鱼雷来袭，将从你舰前方通过。」',
  [HD, AD], [AJ, GS], zoom=80, sfx=['explosion'], prec='minute')
e('exeter_out', D + '07:30', 'battle', 2, 'GB', '埃克塞特号退出', 'Exeter falls out of the action',
  '07:30，埃克塞特号的 Y 炮塔因进水断电，最后一座炮塔也哑了。它艏部下沉、右倾 8°，大火仍在燃烧，阵亡 61 人。贝尔只得转向东南缓缓退出。11:05 它报告还能以 18 节航行，哈伍德令其前往福克兰群岛；16 日正午，它驶入斯坦利港。',
  [HD, 'atwill_1977', WT], [EX], zoom=55, prec='minute')
e('break_off', D + '07:40', 'battle', 1, 'GB', '哈伍德脱离战斗', 'Harwood breaks off the day action',
  '07:38，距离已缩短到 8,000 码，却传来阿贾克斯号弹药只剩两成、仅三门炮可用的报告（后证实有误）。07:40，哈伍德决定在烟幕下转向东，暂时脱离，等天黑再寻战机。最后一次齐射打断了阿贾克斯号的主桅。施佩伯爵号没有追击，转向西方，驶向拉普拉塔河。',
  [HD, WT], [AJ, AC, GS], zoom=60, sfx=['ship_gun'], prec='minute')
e('shadow', D + '08:07', 'movement', 2, 'GB', '尾随', 'Shadowing Graf Spee',
  '施佩伯爵号以约 22 节西逃，阿喀琉斯号在其右后方、阿贾克斯号在左后方，各隔约 15 海里紧紧跟住，阿喀琉斯号代替天线被毁的旗舰播发敌舰位置。德舰上，朗斯多夫清点损失：36 人阵亡、60 人受伤，主炮弹药只剩四成，厨房与燃油净化设备被毁。他决定驶往蒙得维的亚修理。',
  [HD, WT, 'kaack_2010'], [GS, AJ, AC], zoom=22, prec='minute')
e('shakespeare', D + '11:04', 'naval', 3, 'DE', '「请救起英国轮船的救生艇」', '“Please pick up lifeboats of English steamer”',
  '11:04，前方出现一艘停车喷汽的商船。施佩伯爵号用战前的呼号向阿贾克斯号发报：「请救起英国轮船的救生艇。」阿贾克斯号赶过去，发现那是英国商船莎士比亚号，救生艇好好地挂在吊架上，船长说不需要帮助——这或许是朗斯多夫拖住追兵的一个小计。',
  [HD, WT], [GS, AJ], zoom=30, sfx=['morse'], prec='minute')
e('cumberland', D + '12:00', 'movement', 3, 'GB', '坎伯兰号北上', 'Cumberland leaves the Falklands',
  '交战报告传到福克兰群岛，正在斯坦利港检修的坎伯兰号提前出港，全速北上。它航行 34 小时，于 14 日 22:00 抵达拉普拉塔河口，与阿贾克斯号、阿喀琉斯号会合。在此后几天的封锁里，它是哈伍德手中唯一一艘装备 8 英寸炮的巡洋舰。',
  [HD, 'uboat_net_renown'], ['gb.cumberland'], zoom=4, conf='medium', prec='hour')
e('dusk', D + '20:55', 'battle', 3, 'DE', '黄昏的齐射', 'Exchanges at dusk',
  '傍晚，施佩伯爵号两次回身向追得太近的英舰齐射，19:15 的第二次齐射落在阿贾克斯号转向的尾迹里。20:48 日落，施佩伯爵号的轮廓衬在西天的晚霞上，阿喀琉斯号趁机靠近，20:55 双方又交火一轮。此后德舰每隔一阵打一发，英舰不再还击，以免暴露位置。',
  [HD, AD, WT], [GS, AC], zoom=30, sfx=['ship_gun'], prec='minute')
e('arrival', '1939-12-14T00:10', 'naval', 1, 'DE', '驶入蒙得维的亚', 'Graf Spee anchors in Montevideo roads',
  '22:00 前后，阿喀琉斯号追到距施佩伯爵号 5 海里处，看着它从英格利希浅滩北侧驶入河口。没有引水员和拖船，德舰靠一名被俘的商船船长引航，于 14 日凌晨在蒙得维的亚外锚地抛锚（英方舰钟 00:10，哈伍德战报作 00:50）。英舰在领海外停下，开始封锁。',
  [AD, HD, 'kaack_2010', 'tzdb_southamerica'], [GS, AC], place='@montevideo', zoom=30, sfx=['bell'], conf='medium', prec='minute')

# ---------- 蒙得维的亚 ----------
e('prisoners', '1939-12-14T15:00', 'political', 2, 'DE', '释放俘虏', 'British prisoners released',
  '14 日下午，朗斯多夫释放了舰上关押的 61 名英国商船船长与船员，他们上岸后说德国舰长待人彬彬有礼。乌拉圭海事当局只准施佩伯爵号停留 48 小时修理，朗斯多夫要求两周。德国公使朗曼与英国公使米林顿-德雷克同时向乌拉圭政府施压，方向正好相反。',
  ['frus_1939_v5', 'hmsajax_langsdorff', 'wiki_en_graf_spee'], [GS], place='@montevideo', zoom=30, conf='medium', prec='day')
e('funeral_mvd', '1939-12-15T10:00', 'political', 2, 'DE', '北公墓的葬礼', 'Funeral at the Cementerio del Norte',
  '15 日上午，36 名阵亡的德国水兵安葬在蒙得维的亚北公墓，约三百名舰员列队送葬。朗斯多夫行的是传统海军礼，而不是纳粹举手礼。获释的英国商船船长们也来献上花圈。同一天，乌拉圭把停留期延长到 72 小时，至 17 日当地时间 20:00 届满。',
  [HD, 'hmsajax_langsdorff', 'el_observador_2019'], [GS], place='@montevideo', zoom=30, sfx=['bell'], conf='medium', prec='day')
e('bluff', '1939-12-15T19:00', 'political', 2, 'GB', '拖延与虚张声势', 'Delay and deception',
  '英国援军远在千里之外——声望号和皇家方舟号 17 日才能到里约。米林顿-德雷克转而拖延德舰出港：让英国商船阿什沃思号离港，援引「交战国军舰须在敌方商船离港 24 小时后才可出港」的规定。英国电台与外交渠道则放出风声，暗示强大的舰队已在河口外集结。',
  [HD, 'wiki_de_ags', 'nh_kindell_1939_12'], ['gb.cumberland', 'gb.renown'], place='@montevideo', zoom=8, conf='medium', prec='hour')
e('langsdorff_report', '1939-12-16T02:00', 'political', 1, 'DE', '「突破回国无望」', '“Break-through to home waters hopeless”',
  '16 日凌晨，朗斯多夫向柏林报告：炮术长从测距仪里认出了声望号和皇家方舟号（其实是英国宣传的效果），夜间封锁严密，冲向大洋、突破回国已经无望。他建议驶到中立水域边界，弹药允许就杀向布宜诺斯艾利斯，并请求决定：在水浅的河口自沉，还是宁可被拘留？',
  ['fuehrer_conf_161239', 'wiki_de_ags'], [GS, 'de.skl'], place='@montevideo', zoom=30, sfx=['morse'], prec='hour')
e('berlin', '1939-12-16T14:07', 'political', 2, 'DE', '柏林的回电', 'Radiogram 1347/16',
  '柏林时间 16 日 13:00，雷德尔向希特勒汇报，希特勒反对在乌拉圭被拘留，希望施佩伯爵号哪怕冲出去也要打伤英舰。17:07 发出的 1347/16 号电写道：尽量延长停留；同意杀向布宜诺斯艾利斯；不得在乌拉圭被拘留；若自沉，务求彻底破坏。最后的决定仍留给了舰长。',
  ['fuehrer_conf_161239'], [GS, 'de.skl'], place='@montevideo', zoom=30, sfx=['morse'], prec='minute')
e('harwood_kcb', '1939-12-16T18:30', 'political', 3, 'GB', '哈伍德晋升', 'Harwood knighted and promoted',
  '16 日傍晚，海军部来电：国王授予哈伍德巴斯勋章并晋升海军少将，追溯至 13 日；贝尔、伍德豪斯、帕里三位舰长获 CB 勋位。哈伍德通报各舰，同时下达新部署：不在惠斯尔浮标附近动手，那在政治上不可行；夜间在英格利希浅滩以东巡逻，等它出来。',
  [HD], [AJ, 'gb.force_g'], zoom=20, prec='hour')
e('tacoma', '1939-12-17T15:40', 'political', 2, 'DE', '转移舰员', 'Crew transferred to Tacoma',
  '17 日下午，岸上报告施佩伯爵号正把数百人转到德国货轮塔科马号上，到 17:20 已转移七百多人和行李。测距仪、雷达等机密设备被拆毁，弹药间分散布置了爆破装药。大批蒙得维的亚市民和各国记者聚集在海岸边，等着看一场海战。',
  [HD, 'gub_uy_archivo', 'frus_1939_v5'], ['de.tacoma', GS], place='@montevideo', zoom=30, conf='medium', prec='hour')
e('departure', '1939-12-17T19:15', 'naval', 1, 'DE', '最后的出港', 'Graf Spee sails',
  '当地时间 18:15，施佩伯爵号起锚驶出防波堤，缓缓向西，塔科马号跟在后面。英国三艘巡洋舰进入战位，以 25 节驶向惠斯尔浮标。在蒙得维的亚西南约 6 海里的浅水处，施佩伯爵号停了下来，舰员陆续转乘塔科马号和赶来的阿根廷拖船，只留下几十人布置炸药。',
  [HD, 'wiki_de_ags', 'frus_1939_v5'], [GS, 'de.tacoma', AJ, AC, 'gb.cumberland'], zoom=30, sfx=['bell'], conf='medium', prec='minute')
e('scuttle', '1939-12-17T20:54', 'naval', 1, 'DE', '自沉', 'Admiral Graf Spee scuttled',
  '当地时间 19:54，日落时分，两组弹药库先后爆炸，施佩伯爵号在浓烟与火柱中坐沉在七八米深的浅水里，上层建筑仍露出水面，燃烧了好几天。阿贾克斯号的飞机报告：「施佩伯爵号已经自爆。」距乌拉圭规定的最后期限只差几分钟。英舰驶过残骸时，舰员们静静地看着。',
  [HD, 'frus_1939_v5', 'iln_1939', 'tzdb_southamerica'], [GS, AJ], place='@wreck', zoom=40, sfx=['explosion'], prec='minute')

# ---------- 余波 ----------
e('internment', '1939-12-18T14:00', 'political', 3, 'DE', '舰员到达布宜诺斯艾利斯', 'Crew interned in Argentina',
  '拖船与驳船载着一千多名德国舰员驶往布宜诺斯艾利斯，18 日抵达。阿根廷政府决定将他们拘禁，军官被安置在海军船坞旁的移民旅馆，保留了佩剑。乌拉圭则扣下了最后离舰的 4 人。大多数舰员此后在阿根廷度过了整场战争。',
  ['frus_1939_v5', 'time_1940', 'hmsajax_langsdorff'], place='@buenos_aires', zoom=20, prec='day')
e('langsdorff', '1939-12-20T08:00', 'political', 1, 'DE', '朗斯多夫之死', 'Death of Hans Langsdorff',
  '19 日晚，朗斯多夫与部下逐一握手告别，回到房间写下给妻子、父母和大使的信：自沉的责任由他一人承担。他躺在旧帝国海军的军旗上开枪自尽，次日清晨被副官发现。整个袭击航程中，他没有让一个商船船员丧命。',
  ['wiki_en_langsdorff', 'time_1940', 'hmsajax_langsdorff'], place='@buenos_aires', zoom=20, conf='medium', prec='day')
e('funeral_ba', '1939-12-21T12:00', 'political', 2, None, '最后的送行', 'Langsdorff’s funeral',
  '21 日，朗斯多夫被安葬在布宜诺斯艾利斯的德国公墓，约一千名舰员列队送葬。曾被关在施佩伯爵号上的阿什利号船长波廷杰代表英国商船船长们献上花圈。两天后，美洲 21 国联合抗议交战国在安全区内作战。在「假战」的冬天，这场海战成了英国第一个振奋人心的胜利。',
  ['hmsajax_langsdorff', 'frus_1939_v5'], place='@buenos_aires', zoom=20, sfx=['bell'], conf='medium', prec='day')

IDX = json.load(open(os.path.join(ROOT, '..', '..', 'public', 'campaigns', 'river-plate-1939', 'photos', 'index.json'), encoding='utf-8'))
PHOTO = {'raid_order': 'File:Panzerschiff Admiral Graf Spee in 1936.jpg', 'harwood_appr': 'File:Rear Admiral Henry Harwood on HMNZS Achilles.jpg',
         'altmark_last': 'File:Altmark in Jøssingfjord.jpg', 'exeter_out': "File:Exeter'sDamage1939.jpg", 'cumberland': 'File:HMS Cumberland (57).jpg',
         'funeral_mvd': 'File:Hans Langsdorff.jpg', 'scuttle': 'File:The "Graf Spee," scuttled off Montevideo - NARA - 197095.jpg'}
for v in EV:
    f = PHOTO.get(v['id'][2:])
    if f and f in IDX: v['photo'] = {'commons': f, 'caption': IDX[f]['caption']}
EV.sort(key=lambda v: v['at'])
dump(P('data/events.json'), EV)
print('✓ 事件', len(EV), '· 1 级', sum(v['importance'] == 1 for v in EV))
