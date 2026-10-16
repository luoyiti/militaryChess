"""舰船编成与航迹：写 pipeline/units.json 与 pipeline/tracks/{battle,raid,montevideo}.json。
战斗日航迹取自研究稿 docs/research/battle_tracks.json（Harwood 0520 定位 + NID 航迹图数字化 + 推算）；
袭击航程与猎杀群、蒙得维的亚阶段按研究笔记 raid.md / montevideo.md 编排（远洋航段为示意，置信度低）。
叙事时钟 = 英方舰钟 Zone +2（UTC−2）。运行：python3 campaigns/river-plate-1939/pipeline/build/fleet.py"""
import json, os
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
def dump(p, obj):
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, indent=1); f.write('\n')

# ---------- 舰船档案 ----------
def W(id, label, cal, kind, mounts=None, per=None, rng=None, at=None):
    w = {'id': id, 'label': label, 'cal': cal, 'kind': kind}
    if mounts: w['mounts'] = mounts
    if per: w['perMount'] = per
    if rng: w['rangeKm'] = rng
    if at is not None: w['atPct'] = at
    return w

GS_W = [W('A', '前主炮塔「安东」（三联装 28 厘米）', '28 cm SK C/28', 'main', 1, 3, 36.5, 27),
        W('B', '后主炮塔「布鲁诺」（三联装 28 厘米）', '28 cm SK C/28', 'main', 1, 3, 36.5, 76),
        W('sec', '15 厘米副炮（单装 ×8，两舷各 4）', '15 cm SK C/28', 'secondary', 8, 1, 23, 50),
        W('aa', '10.5 厘米高射炮（双联装 ×3）', '10.5 cm SK C/33', 'aa', 3, 2, 17.7, 62),
        W('tt', '53.3 厘米鱼雷发射管（四联装 ×2，后甲板）', '53.3 cm G7a', 'torpedo', 2, 4, 12, 88)]
EX_W = [W('A', 'A 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 22),
        W('B', 'B 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 30),
        W('Y', 'Y 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 82),
        W('aa', '4 英寸高射炮（单装 ×4）', '4 in QF Mk V', 'aa', 4, 1, 15, 55),
        W('tt_s', '右舷鱼雷发射管（三联装）', '21 in Mk VII', 'torpedo', 1, 3, 12, 58),
        W('tt_p', '左舷鱼雷发射管（三联装）', '21 in Mk VII', 'torpedo', 1, 3, 12, 58)]
LE_W = [W('A', 'A 炮塔（双联装 6 英寸）', '6 in BL Mk XXIII', 'main', 1, 2, 23.3, 20),
        W('B', 'B 炮塔（双联装 6 英寸）', '6 in BL Mk XXIII', 'main', 1, 2, 23.3, 27),
        W('X', 'X 炮塔（双联装 6 英寸）', '6 in BL Mk XXIII', 'main', 1, 2, 23.3, 75),
        W('Y', 'Y 炮塔（双联装 6 英寸）', '6 in BL Mk XXIII', 'main', 1, 2, 23.3, 84),
        W('aa', '4 英寸高射炮（单装 ×4）', '4 in QF Mk V', 'aa', 4, 1, 15, 55),
        W('tt_p', '左舷鱼雷发射管（四联装）', '21 in Mk IX', 'torpedo', 1, 4, 12, 60),
        W('tt_s', '右舷鱼雷发射管（四联装）', '21 in Mk IX', 'torpedo', 1, 4, 12, 60)]
CO_W = [W('A', 'A 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 21),
        W('B', 'B 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 28),
        W('X', 'X 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 74),
        W('Y', 'Y 炮塔（双联装 8 英寸）', '8 in BL Mk VIII', 'main', 1, 2, 26.5, 82),
        W('aa', '4 英寸高射炮', '4 in QF Mk V', 'aa', 4, 2, 15, 55)]
RE_W = [W('A', 'A 炮塔（双联装 15 英寸）', '15 in BL Mk I', 'main', 1, 2, 33, 25),
        W('B', 'B 炮塔（双联装 15 英寸）', '15 in BL Mk I', 'main', 1, 2, 33, 32),
        W('Y', 'Y 炮塔（双联装 15 英寸）', '15 in BL Mk I', 'main', 1, 2, 33, 80),
        W('sec', '4.5 英寸两用炮（双联装 ×10）', '4.5 in QF Mk I', 'secondary', 10, 2, 18.7, 52)]

def ship(kind, cls_zh, cls_orig, L, B, t, tk, kn, crew=None, sil=None, pennant=None, weapons=None):
    s = {'kind': kind, 'class': {'zh': cls_zh, 'orig': cls_orig}, 'lengthM': L, 'beamM': B, 'tonnage': t, 'tonnageKind': tk, 'maxKn': kn}
    if pennant: s['pennant'] = pennant
    if crew: s['crew'] = crew
    if sil: s['silhouette'] = sil
    if weapons: s['weapons'] = weapons
    return s

U = []
def unit(id, side, ech, typ, parent, zh, orig, short, src, conf='high', **kw):
    u = {'id': id, 'side': side, 'echelon': ech, 'type': typ, 'parent': parent, 'name': {'zh': zh, 'orig': orig, 'short': short}}
    u.update(kw); u['track'] = []; u['sources'] = src; u['confidence'] = conf
    U.append(u); return u

SHIPSRC = ['wiki_en_graf_spee', 'navweaps_28cm']
# 德方
unit('de.skl', 'DE', 'command', 'hq', None, '德国海军战争指挥部', 'Seekriegsleitung (SKL)', 'SKL', ['ktb_skl'],
     commander={'zh': '雷德尔海军元帅', 'orig': 'Großadmiral Erich Raeder'}, display='container',
     history='柏林的海军最高指挥机构。9 月 26 日授权施佩伯爵号开始对商船作战，此后以无线电与「会合线」遥控袭击舰与补给船，12 月 16 日下达「不得在乌拉圭被拘留」的指令。')
unit('de.graf_spee', 'DE', 'ship', 'naval', 'de.skl', '施佩伯爵海军上将号', 'Panzerschiff Admiral Graf Spee', 'Graf Spee',
     ['wiki_en_graf_spee', 'wiki_de_graf_spee', 'navweaps_28cm', 'harwood_despatch', 'admiralty_track_chart'],
     commander={'zh': '朗斯多夫上校', 'orig': 'Kapitän zur See Hans Langsdorff'}, model='graf_spee',
     strength={'men': 1100, 'guns': 6},
     ship=ship('pocket_battleship', '德意志级装甲舰（「袖珍战列舰」）', 'Deutschland-Klasse Panzerschiff', 186, 21.65, 11887, 'std', 28.5, 1100, 'graf_spee', weapons=GS_W),
     history='1936 年服役的柴油动力装甲舰，航程远、火力强于任何能追上它的巡洋舰。1939 年 8 月 21 日出港潜入南大西洋，9 月 26 日起截击英国商船九艘（共约 5 万总吨），未杀一人。12 月 13 日在拉普拉塔河口与哈伍德的三艘巡洋舰交战受创，驶入蒙得维的亚；17 日黄昏自沉。',
     modelNote='1939 年 12 月状态：塔式舰桥顶部为 Seetakt 雷达天线，舰艏涂有假舰艏浪；战前加装的假烟囱与假炮塔已于 12 月 11–12 日拆除。')
unit('de.altmark', 'DE', 'ship', 'naval', 'de.skl', '阿尔特马克号补给油船', 'Trossschiff Altmark', 'Altmark',
     ['wiki_en_altmark', 'wiki_de_altmark', 'hmsajax_org', 'ktb_skl'], 'medium',
     commander={'zh': '道船长', 'orig': 'Kapitän Heinrich Dau'}, model='tanker',
     ship=ship('tanker', '迪特马申级补给油船', 'Dithmarschen-Klasse Trossschiff', 178.3, 22.3, 10698, 'grt', 21, 133, 'tanker'),
     history='施佩伯爵号的补给与「监狱船」。按预先编好的会合线在大西洋腹地等待，前后为袭击舰加油九次，接收被击沉商船的船员约三百人。伪装成挪威船「Sogne」。1940 年 2 月在挪威约辛峡湾被英舰「哥萨克人」号登临，船上俘虏获救。')
unit('de.tacoma', 'DE', 'ship', 'naval', None, '塔科马号', 'Dampfer Tacoma (HAPAG)', 'Tacoma',
     ['gub_uy_archivo', 'frus_1939_v5', 'harwood_despatch'], 'medium', model='merchant',
     ship=ship('merchant', '德国货轮（汉堡—美洲航运公司）', 'Frachtdampfer, Hamburg-Amerika Linie', 140, 18, 8268, 'grt', 12, None, 'merchant'),
     active={'from': '1939-12-14T00:00'},
     history='滞留蒙得维的亚的德国货轮。12 月 17 日下午接收施佩伯爵号的大部分舰员，随舰驶出港外，自沉后被乌拉圭海军押回港内，月底被宣布为交战国辅助船并遭扣留。')

# 英方与英联邦
unit('gb.admiralty', 'GB', 'command', 'hq', None, '英国海军部', 'Admiralty', 'Admiralty', ['roskill_1954'],
     commander={'zh': '第一海务大臣庞德海军元帅', 'orig': 'Admiral of the Fleet Sir Dudley Pound'}, display='container',
     history='10 月 5 日确认南大西洋有袭击舰后，海军部与法国海军组成八个「猎杀群」（F–N 舰队），动用 3 艘航空母舰、2 艘战列巡洋舰与十余艘巡洋舰，分驻各航运要冲。')
unit('gb.force_g', 'GB', 'group', 'naval', 'gb.admiralty', '南美分舰队（G 舰队）', 'South America Division (Force G)', 'Force G',
     ['harwood_despatch', 'roskill_1954'], commander={'zh': '哈伍德准将', 'orig': 'Commodore Henry Harwood'}, display='container',
     history='南美洲东岸的英国巡洋舰分队，负责拉普拉塔河口至里约热内卢的航运。哈伍德判断袭击舰会在 12 月 12–13 日前后到达河口，提前集中三舰迎击。')
unit('gb.exeter', 'GB', 'ship', 'naval', 'gb.force_g', '埃克塞特号', 'HMS Exeter', 'Exeter',
     ['wiki_en_exeter', 'navweaps_8in', 'atwill_1977', 'cussen_diary', 'harwood_despatch', 'admiralty_track_chart'],
     commander={'zh': '贝尔上校', 'orig': 'Captain F. S. Bell'}, model='exeter', strength={'men': 630, 'guns': 6},
     ship=ship('heavy_cruiser', '约克级重巡洋舰', 'York-class heavy cruiser', 175.3, 17.7, 8390, 'std', 32, 630, 'york', '68', EX_W),
     history='1931 年服役的重巡洋舰，6 门 8 英寸炮。12 月 13 日单独从西侧夹击，吸引了施佩伯爵号大部分 28 厘米炮火：A、B 炮塔被毁，舰桥人员几乎全部死伤，阵亡 61 人。凭借 Y 炮塔坚持射击到 07:30，随后退出，16 日抵达福克兰群岛斯坦利港。')
unit('gb.ajax', 'GB', 'ship', 'naval', 'gb.force_g', '阿贾克斯号', 'HMS Ajax', 'Ajax',
     ['wiki_en_ajax', 'navweaps_6in', 'harwood_despatch', 'admiralty_track_chart'],
     commander={'zh': '伍德豪斯上校', 'orig': 'Captain C. H. L. Woodhouse'}, model='leander', strength={'men': 570, 'guns': 8},
     ship=ship('light_cruiser', '利安德级轻巡洋舰', 'Leander-class light cruiser', 169, 17, 6985, 'std', 32.5, 570, 'leander', '22', LE_W),
     history='哈伍德准将的旗舰。与阿喀琉斯号组成第一分队从东侧集中射击，07:25 被一发延期引信 28 厘米弹打哑 X、Y 两座炮塔，07:40 主桅被打断。此后与阿喀琉斯号一路尾随施佩伯爵号到蒙得维的亚。')
unit('gb.seafox', 'GB', 'squadron', 'air', 'gb.ajax', '阿贾克斯号的「海狐」水上飞机', 'Fairey Seafox (718 Catapult Flight, HMS Ajax)', 'Seafox',
     ['harwood_despatch', 'faaoa_lewin', 'wiki_en_seafox'], model='seafox',
     active={'from': '1939-12-13T06:37', 'to': '1939-12-13T09:12'},
     commander={'zh': '卢因上尉（飞行员）、卡尼上尉（观察员）', 'orig': 'Lt E. D. G. Lewin / Lt R. E. N. Kearney'},
     history='06:37 在炮战中弹射升空，为第一分队校正弹着，07:31 报告「鱼雷来袭，将从你舰前方通过」。共飞行 2 小时 35 分钟，是英国舰载机首次在海战中为舰炮观测。卢因因此获颁优异服务十字勋章。')
unit('nz.achilles', 'NZ', 'ship', 'naval', 'gb.force_g', '阿喀琉斯号', 'HMS Achilles (New Zealand Division)', 'Achilles',
     ['wiki_en_achilles', 'waters_1956', 'harwood_despatch', 'admiralty_track_chart'],
     commander={'zh': '帕里上校', 'orig': 'Captain W. E. Parry'}, model='leander', strength={'men': 550, 'guns': 8}, active={'from': '1939-10-22T00:00'},
     ship=ship('light_cruiser', '利安德级轻巡洋舰', 'Leander-class light cruiser', 169, 17, 7030, 'std', 32.5, 550, 'leander', '70', LE_W),
     history='皇家海军新西兰分队的巡洋舰，舰员多为新西兰人，战斗中升新西兰军旗。06:40 一发近失弹的弹片射入射击指挥塔，4 人阵亡。白昼战斗后紧贴施佩伯爵号右后方尾随，夜间追到距其 5 海里。')
unit('gb.cumberland', 'GB', 'ship', 'naval', 'gb.force_g', '坎伯兰号', 'HMS Cumberland', 'Cumberland',
     ['wiki_en_cumberland', 'harwood_despatch', 'uboat_net_renown'],
     commander={'zh': '法洛菲尔德上校', 'orig': 'Captain W. H. G. Fallowfield'}, model='county', strength={'men': 680, 'guns': 8},
     ship=ship('heavy_cruiser', '肯特级重巡洋舰', 'County (Kent)-class heavy cruiser', 192, 20.8, 9750, 'std', 31.5, 680, 'county', '57', CO_W),
     history='哈伍德分舰队的第四艘巡洋舰，海战当日在福克兰群岛自行检修，闻讯后全速北上，航行 34 小时于 14 日 22:00 抵达河口，成为封锁蒙得维的亚时唯一的 8 英寸炮舰。')
unit('gb.force_k', 'GB', 'group', 'naval', 'gb.admiralty', 'K 舰队（猎杀群）', 'Force K', 'Force K',
     ['roskill_1954', 'uboat_net_renown'], 'medium', display='container',
     commander={'zh': '韦尔斯中将', 'orig': 'Vice-Admiral L. V. Wells'},
     history='以战列巡洋舰声望号与航空母舰皇家方舟号组成的最强猎杀群，驻弗里敦与伯南布哥之间。12 月初移往开普敦，海战后奉命驰援拉普拉塔，但直到 17 日才到里约热内卢加油；英国的宣传让德方相信它们已在河口外。')
unit('gb.renown', 'GB', 'ship', 'naval', 'gb.force_k', '声望号', 'HMS Renown', 'Renown', ['wiki_en_renown', 'uboat_net_renown'], 'medium',
     model='renown', active={'from': '1939-10-12T00:00'}, ship=ship('battlecruiser', '声望级战列巡洋舰（1939 年重建）', 'Renown-class battlecruiser', 242, 31.2, 32000, 'std', 30, 1200, 'renown', '72', RE_W))
unit('gb.ark_royal', 'GB', 'ship', 'naval', 'gb.force_k', '皇家方舟号', 'HMS Ark Royal', 'Ark Royal', ['wiki_en_ark_royal', 'uboat_net_renown'], 'medium',
     model='ark_royal', active={'from': '1939-10-12T00:00'}, ship=ship('carrier', '皇家方舟号航空母舰', 'Aircraft carrier Ark Royal', 243.8, 28.9, 22000, 'std', 30.75, 1580, 'ark_royal', '91'))
unit('gb.dorsetshire', 'GB', 'ship', 'naval', 'gb.admiralty', '多塞特郡号', 'HMS Dorsetshire', 'Dorsetshire', ['wiki_en_dorsetshire', 'nh_kindell_1939_12'], 'medium',
     model='county', ship=ship('heavy_cruiser', '诺福克级重巡洋舰', 'County (Norfolk)-class heavy cruiser', 192, 20.1, 9975, 'std', 32.3, 710, 'county', '40', CO_W),
     active={'from': '1939-12-13T00:00'})
unit('gb.shropshire', 'GB', 'ship', 'naval', 'gb.admiralty', '什罗普郡号', 'HMS Shropshire', 'Shropshire', ['wiki_en_shropshire', 'nh_kindell_1939_12'], 'medium',
     model='county', ship=ship('heavy_cruiser', '伦敦级重巡洋舰', 'County (London)-class heavy cruiser', 192.8, 20.1, 9830, 'std', 32.3, 710, 'county', '73', CO_W),
     active={'from': '1939-12-15T00:00'})
unit('fr.dupleix', 'FR', 'ship', 'naval', None, '迪普莱号（X 舰队）', 'Croiseur lourd Dupleix (Force X)', 'Dupleix', ['roskill_1954', 'navweaps_rp'], 'low',
     model='county', ship=ship('heavy_cruiser', '絮弗伦级重巡洋舰', 'Croiseur lourd classe Suffren', 194, 19.3, 10000, 'std', 30, 750, 'county'),
     active={'from': '1939-10-12T00:00'},
     history='法国海军以达喀尔为基地的重巡洋舰，与福煦号及英国航母竞技神号组成 X 舰队，在塞内加尔与巴西之间的大西洋狭窄处巡逻搜索袭击舰。',
     modelNote='3D 借用英国郡级重巡洋舰模型示意。')
unit('gb.mn', 'GB', 'group', 'naval', None, '英国商船（被截击）', 'British merchant ships intercepted by Graf Spee', 'Merchant Navy',
     ['wiki_en_graf_spee', 'maritimequest'], display='container',
     history='施佩伯爵号在 1939 年 9 月 30 日至 12 月 7 日间截击并击沉英国商船九艘，共 50,089 总吨。朗斯多夫按《战利品法规》先让船员离船，无一人死亡；船员先关在袭击舰上，后转往阿尔特马克号。')

MERCH = [  # id, 中文名, 原名, 总吨, 船长, 拦截时刻, 拦截位置, 沉没时刻, 沉没位置, 接近点(时刻, 位置), 历史, 来源
 ('clement', '克莱门特号', 'SS Clement (Booth Line)', 5051, 'F. C. P. Harris',
  '1939-09-30T11:00', [-34.08, -9.08], '1939-09-30T15:00', [-34.1, -9.1], ('1939-09-30T03:00', [-34.95, -8.4]),
  '从伯南布哥驶往巴伊亚的布斯公司货轮，9 月 30 日成为施佩伯爵号的第一个猎物。船员乘救生艇离开，袭击舰随后以「舍尔海军上将号」的名义电告伯南布哥岸台前来救人，让英国人一度以为来的是另一艘袖珍战列舰。', ['wiki_en_clement', 'maritimequest']),
 ('newton_beech', '牛顿·比奇号', 'SS Newton Beech', 4651, 'J. Robison',
  '1939-10-05T13:00', [-6.5, -9.58], '1939-10-08T12:00', [-4.6, -9.3], ('1939-10-05T05:00', [-5.6, -10.6]),
  '从开普敦驶往弗里敦途中被截，先作为关押俘虏的捕获船随袭击舰航行三天，因航速太慢于 10 月 8 日被凿沉。报务员发出的求救电文被德方以假报文搅乱。', ['maritimequest', 'ktb_skl']),
 ('ashlea', '阿什利号', 'SS Ashlea', 4222, 'C. Pottinger',
  '1939-10-07T12:00', [-3.47, -9.87], '1939-10-07T15:00', [-3.5, -9.9], ('1939-10-07T04:00', [-2.7, -10.7]),
  '载糖从德班驶往英国，10 月 7 日被截。船长波廷杰后来成为被俘船长们的代表，12 月 21 日赴布宜诺斯艾利斯参加朗斯多夫的葬礼。', ['maritimequest', 'ktb_skl']),
 ('huntsman', '猎人号', 'SS Huntsman (Harrison Line)', 8196, 'A. H. Brown',
  '1939-10-10T12:00', [-5.25, -8.5], '1939-10-17T12:00', [-17.2, -16.2], ('1939-10-10T04:00', [-4.4, -9.4]),
  '哈里森公司货轮，满载茶叶与杂货自加尔各答驶来。被俘后由捕获船员押往大西洋腹地与阿尔特马克号会合，船员与物资转移完毕后于 10 月 17 日被炸沉。', ['maritimequest', 'bs26']),
 ('trevanion', '特雷瓦尼恩号', 'SS Trevanion', 5299, 'J. N. Edwards',
  '1939-10-22T12:00', [4.03, -19.67], '1939-10-22T15:00', [4.0, -19.7], ('1939-10-22T04:00', [4.8, -20.6]),
  '载精矿从澳大利亚驶往弗里敦，被截时报务员坚持发出「RRR」求救信号，被德舰开炮制止。英国人由此第一次确知袭击舰已转到非洲西南海域。', ['ktb_skl', 'gazette_34815']),
 ('africa_shell', '非洲壳牌号', 'MV Africa Shell', 706, 'P. G. G. Dove',
  '1939-11-15T10:00', [35.02, -24.8], '1939-11-15T12:00', [35.05, -24.82], ('1939-11-15T04:00', [34.2, -25.4]),
  '一艘小油轮，在莫桑比克扎沃拉角外被截击——就在葡萄牙领海边缘。这是袭击舰在印度洋的唯一战果，意在把英国猎杀群吸引到东非。船长多夫后来与朗斯多夫成了朋友。', ['wiki_en_africa_shell', 'wiki_en_dove']),
 ('doric_star', '多里克之星号', 'MV Doric Star (Blue Star Line)', 10086, 'W. Stubbs',
  '1939-12-02T13:30', [5.08, -19.25], '1939-12-02T16:00', [5.1, -19.3], ('1939-12-02T05:00', [6.3, -20.4]),
  '蓝星公司冷藏船，载冻肉、羊毛与奶制品自新西兰回国。报务员冒着炮火发出「RRR」与位置，被南大西洋司令部收到——这份电报让哈伍德判断袭击舰下一步会去拉普拉塔河口。', ['wiki_en_doric_star', 'harwood_despatch']),
 ('tairoa', '泰罗阿号', 'SS Tairoa (Shaw Savill)', 7983, 'W. B. S. Starr',
  '1939-12-03T04:00', [3.08, -20.33], '1939-12-03T08:00', [3.1, -20.35], ('1939-12-02T20:00', [4.0, -21.3]),
  '多里克之星号被击沉的第二天清晨被截，报务员同样发出了求救信号，德舰开炮打掉电台，三名船员受伤——这是袭击航程中唯一的人员受伤。', ['wiki_en_tairoa', 'naval_history_net']),
 ('streonshalh', '斯特雷翁沙尔号', 'SS Streonshalh', 3895, 'J. Robinson',
  '1939-12-07T17:00', [-27.83, -25.02], '1939-12-07T20:00', [-27.85, -25.05], ('1939-12-07T07:00', [-29.2, -26.6]),
  '载小麦从蒙得维的亚驶往弗里敦，是施佩伯爵号的最后一个猎物。德方从船上缴获的文件里得知拉普拉塔河口的商船往来，以及坎伯兰号新涂装的照片，坚定了朗斯多夫前往河口的决心。', ['maritimequest', 'wiki_en_graf_spee']),
]
for mid, zh, orig, grt, master, at, pos, sunk, spos, appr, hist, src in MERCH:
    u = unit(f'gb.m_{mid}', 'GB', 'ship', 'naval', 'gb.mn', zh, orig, orig.split(' (')[0].replace('SS ', '').replace('MV ', ''), src, 'medium',
             commander={'zh': f'船长 {master}', 'orig': f'Master {master}'}, model='merchant',
             ship=ship('merchant' if grt > 2000 else 'tanker', '英国商船' if grt > 2000 else '英国小型油轮', 'British merchant ship', 130 if grt > 6000 else 115 if grt > 3000 else 60, 17 if grt > 6000 else 15 if grt > 3000 else 10, grt, 'grt', 12, None, 'merchant' if grt > 2000 else 'tanker'),
             active={'from': appr[0]}, history=hist)
    u['_merch'] = (at, pos, sunk, spos, appr)

# ---------- 战斗日航迹（研究稿） ----------
R = json.load(open(P('docs/research/battle_tracks.json'), encoding='utf-8'))
IDMAP = {'graf_spee': 'de.graf_spee', 'exeter': 'gb.exeter', 'ajax': 'gb.ajax', 'achilles': 'nz.achilles', 'seafox': 'gb.seafox'}
FLIGHT = {'launched': 'outbound', 'spotting': 'engaged', 'scouting': 'engaged', 'returning': 'returning', 'recovered': 'returning'}
def status_of(st, t):
    if st in ('engaged', 'turning away'): return 'engaged'
    if st == 'withdrawing': return 'withdrawing'
    if st == 'damaged': return 'engaged' if t < '1939-12-13T07:41' else 'withdrawing'
    return 'active'
battle = {}
for key, pts in R['ships'].items():
    uid = IDMAP[key]; out = []
    for p in pts:
        q = {'at': p['t'], 'pos': [round(p['lon'], 4), round(p['lat'], 4)]}
        if uid == 'gb.seafox':
            q['flightPhase'] = FLIGHT.get(p['status'], 'engaged'); q['altitudeM'] = 0 if p['status'] in ('launched', 'recovered') else 600
            q['status'] = 'active'
        else:
            q['status'] = status_of(p['status'], p['t'])
            if p.get('course') is not None: q['course'] = round(p['course']) % 360
            if p.get('speedKn') is not None: q['speedKn'] = round(min(p['speedKn'], 33), 1)
        if p.get('note'): q['note'] = p['note'][:120]
        out.append(q)
    battle[uid] = out
# 埃克塞特号 13 日之后的点归入战斗区段（研究稿已含 16 日抵斯坦利港）
dump(P('pipeline/tracks/battle.json'), battle)

# ---------- 袭击航程与猎杀群（示意） ----------
def T(*pts, status=None):
    out = []
    for p in pts:
        at, pos = p[0], p[1]
        q = {'at': at, 'pos': pos}
        for k, v in (p[2] if len(p) > 2 else {}).items(): q[k] = v
        out.append(q)
    return out
A, E, WD, D = {'status': 'active'}, {'status': 'engaged'}, {'status': 'withdrawing'}, {'status': 'destroyed'}
def n(s, **k): return {'note': s, **k}
raid = {}
raid['de.graf_spee'] = T(
 ('1939-09-26T00:00', [-23.0, -13.0], n('在大西洋腹地的等待海域，接到柏林恢复对商船作战的电令（位置示意）', status='active')),
 ('1939-09-29T00:00', [-31.0, -10.4], n('向巴西航线西行')),
 ('1939-09-30T11:00', [-34.08, -9.08], n('伯南布哥东南截击克莱门特号', status='engaged')),
 ('1939-09-30T16:00', [-33.6, -9.2], n('以「舍尔海军上将号」名义发电后东返', status='active')),
 ('1939-10-03T00:00', [-15.0, -9.6], n('横越大西洋，转向开普敦—弗里敦航线')),
 ('1939-10-05T13:00', [-6.5, -9.58], n('截获牛顿·比奇号', status='engaged')),
 ('1939-10-05T18:00', [-6.0, -9.7], n('押着捕获船东行', status='active')),
 ('1939-10-07T12:00', [-3.47, -9.87], n('击沉阿什利号', status='engaged')),
 ('1939-10-07T16:00', [-3.8, -9.6], {'status': 'active'}),
 ('1939-10-08T12:00', [-4.6, -9.3], n('凿沉牛顿·比奇号')),
 ('1939-10-10T12:00', [-5.25, -8.5], n('截获猎人号', status='engaged')),
 ('1939-10-10T18:00', [-6.0, -9.2], n('押着猎人号南下会合', status='active')),
 ('1939-10-15T12:00', [-17.0, -16.0], n('与阿尔特马克号会合加油，转移俘虏（至 18 日）')),
 ('1939-10-18T12:00', [-16.6, -16.4], n('离开会合点东行')),
 ('1939-10-22T12:00', [4.03, -19.67], n('击沉特雷瓦尼恩号', status='engaged')),
 ('1939-10-22T16:00', [3.6, -20.2], {'status': 'active'}),
 ('1939-10-28T12:00', [-11.5, -35.0], n('特里斯坦—达库尼亚附近与阿尔特马克号会合，随后转入印度洋')),
 ('1939-10-29T12:00', [-10.5, -35.6]),
 ('1939-11-03T00:00', [18.0, -40.0], n('远在好望角以南绕过非洲')),
 ('1939-11-06T00:00', [31.0, -35.5], n('在德班—洛伦索马贵斯航线外搜索十二天，几乎不见船影')),
 ('1939-11-11T00:00', [38.5, -28.5]),
 ('1939-11-15T10:00', [35.3, -24.85], n('莫桑比克扎沃拉角外击沉非洲壳牌号', status='engaged')),
 ('1939-11-15T14:00', [35.6, -25.2], {'status': 'active'}),
 ('1939-11-16T10:00', [36.5, -26.6], n('拦停荷兰货轮马皮亚号后放行')),
 ('1939-11-19T00:00', [33.0, -35.0], n('折返南行，舰员加装假炮塔与假烟囱，伪装成英国战列巡洋舰')),
 ('1939-11-22T00:00', [20.0, -39.0]),
 ('1939-11-25T00:00', [5.0, -36.5]),
 ('1939-11-27T12:00', [-7.5, -33.5], n('与阿尔特马克号会合（至 29 日），接回船长与高级船员')),
 ('1939-11-29T12:00', [-6.8, -32.8]),
 ('1939-12-02T13:30', [5.08, -19.25], n('击沉多里克之星号；对方发出 RRR 求救', status='engaged')),
 ('1939-12-02T17:00', [4.6, -19.6], {'status': 'active'}),
 ('1939-12-03T04:00', [3.08, -20.33], n('击沉泰罗阿号', status='engaged')),
 ('1939-12-03T09:00', [2.4, -20.6], n('高速西驶', status='active')),
 ('1939-12-06T18:00', [-26.0, -23.0], n('最后一次（第九次）加油，移交约 140 名俘虏')),
 ('1939-12-07T06:00', [-26.3, -23.6]),
 ('1939-12-07T17:00', [-27.83, -25.02], n('击沉斯特雷翁沙尔号', status='engaged')),
 ('1939-12-07T21:00', [-28.3, -25.3], n('径向拉普拉塔河口', status='active')),
 ('1939-12-10T00:00', [-37.0, -29.8], n('阿拉多水上飞机故障无法修复；伪装物拆除')),
 ('1939-12-12T12:00', [-45.6, -33.1]),
)
raid['de.altmark'] = T(
 ('1939-09-26T00:00', [-24.0, -13.6], n('在等待海域游弋（位置示意）', status='active')),
 ('1939-10-10T00:00', [-18.5, -15.5]),
 ('1939-10-15T12:00', [-17.05, -16.05], n('与施佩伯爵号会合（15–18 日），接收三艘商船船员')),
 ('1939-10-18T18:00', [-17.3, -16.6]),
 ('1939-10-26T00:00', [-13.5, -31.0]),
 ('1939-10-28T12:00', [-11.55, -35.05], n('特里斯坦—达库尼亚附近会合')),
 ('1939-10-30T00:00', [-12.5, -33.5]),
 ('1939-11-20T00:00', [-9.0, -32.0]),
 ('1939-11-27T12:00', [-7.55, -33.55], n('会合（27–29 日），船长们转回施佩伯爵号')),
 ('1939-11-30T00:00', [-10.5, -30.5]),
 ('1939-12-06T18:00', [-26.05, -23.05], n('最后一次会合：加油并接收多里克之星号、泰罗阿号船员')),
 ('1939-12-07T06:00', [-25.8, -23.6]),
 ('1939-12-14T00:00', [-24.0, -32.0], n('闻海战消息后躲入南大西洋偏僻海域（位置示意）')),
 ('1939-12-21T18:00', [-21.0, -37.0]),
)
for u in U:
    if '_merch' not in u: continue
    at, pos, sunk, spos, appr = u.pop('_merch')
    pts = [(appr[0], appr[1], {'status': 'active', 'note': '航行于商船航线'}), (at, pos, {'status': 'engaged', 'note': '被施佩伯爵号截停'})]
    if u['id'] in ('gb.m_newton_beech', 'gb.m_huntsman'):
        pts.append((f'{at[:11]}{int(at[11:13]) + 5:02d}:00', [pos[0] - (0.5 if 'newton' in u['id'] else 0.75), pos[1] - (0.1 if 'newton' in u['id'] else 0.7)], {'status': 'active', 'note': '被俘，由德方捕获船员押运'}))
        if 'huntsman' in u['id']: pts.append(('1939-10-15T12:00', [-17.1, -16.1], {'note': '在会合点向阿尔特马克号转移船员与货物'}))
    pts.append((sunk, spos, {'status': 'destroyed', 'note': '被击沉（爆破或炮击）'}))
    raid[u['id']] = T(*pts)
raid['gb.ajax'] = T(
 ('1939-09-26T00:00', [-55.6, -35.4], n('在拉普拉塔河口外巡逻（位置示意）', status='active')),
 ('1939-10-12T00:00', [-47.0, -26.2], n('巡逻里约—桑托斯航线')),
 ('1939-10-30T00:00', [-54.6, -35.6]),
 ('1939-11-20T00:00', [-50.5, -31.5]),
 ('1939-12-03T00:00', [-55.4, -35.5], n('哈伍德在河口外接到多里克之星号遇袭的消息')),
 ('1939-12-10T00:00', [-55.0, -35.9], n('与阿喀琉斯号会合')),
 ('1939-12-12T07:00', [-51.9, -35.3], n('三舰在河口以东约 150 海里会合，演练战术')),
)
raid['nz.achilles'] = T(
 ('1939-10-22T00:00', [-68.3, -52.6], n('经麦哲伦海峡由太平洋进入大西洋（位置示意）', status='active')),
 ('1939-10-28T00:00', [-56.0, -36.2], n('加入哈伍德的南美分舰队')),
 ('1939-11-20T00:00', [-45.0, -25.2], n('巡逻里约热内卢外海')),
 ('1939-12-03T00:00', [-43.6, -23.6]),
 ('1939-12-10T00:00', [-54.9, -35.95], n('奉命南下与旗舰会合')),
 ('1939-12-12T07:00', [-51.93, -35.33]),
)
raid['gb.exeter'] = T(
 ('1939-09-26T00:00', [-48.5, -28.5], n('与坎伯兰号组成 G 猎杀群，巡逻巴西南部航线（位置示意）', status='active')),
 ('1939-10-20T00:00', [-52.0, -33.5]),
 ('1939-11-25T00:00', [-57.85, -51.69], n('在福克兰群岛斯坦利港检修')),
 ('1939-12-09T08:00', [-57.8, -51.65], n('提前结束检修，北上与旗舰会合')),
 ('1939-12-12T07:00', [-51.95, -35.36]),
)
raid['gb.cumberland'] = T(
 ('1939-09-26T00:00', [-43.3, -23.4], n('9 月 15 日起驻里约热内卢方向（位置示意）', status='active')),
 ('1939-10-15T00:00', [-50.0, -30.5]),
 ('1939-11-15T00:00', [-53.5, -35.0]),
 ('1939-12-05T00:00', [-57.86, -51.7], n('在斯坦利港自行检修')),
 ('1939-12-13T12:00', [-57.82, -51.66], n('收到交战消息后自行出港，全速北上')),
 ('1939-12-14T22:00', [-55.3, -35.6], n('航行 34 小时抵达河口，与阿贾克斯号、阿喀琉斯号会合')),
)
raid['gb.renown'] = T(
 ('1939-10-12T00:00', [-13.6, 8.0], n('K 猎杀群进驻弗里敦（位置示意）', status='active')),
 ('1939-10-24T00:00', [-27.0, -4.0], n('搜索圣保罗岩—伯南布哥一线')),
 ('1939-11-06T00:00', [-13.6, 8.1]),
 ('1939-11-18T00:00', [-14.0, -14.0], n('南下搜索圣赫勒拿海域')),
 ('1939-11-30T00:00', [18.3, -33.85], n('抵达开普敦')),
 ('1939-12-04T08:00', [18.2, -34.0], n('自开普敦出发，前往南纬 28° 西经 15° 拦截')),
 ('1939-12-09T00:00', [-15.0, -28.0]),
 ('1939-12-13T12:00', [-24.0, -25.5], n('接到海战消息，转向里约热内卢')),
 ('1939-12-17T12:00', [-43.1, -22.95], n('抵里约热内卢加油')),
 ('1939-12-18T06:00', [-42.5, -23.4], n('出海，转而搜索阿尔特马克号')),
 ('1939-12-21T18:00', [-31.0, -16.0]),
)
raid['gb.ark_royal'] = [dict(p, pos=[round(p['pos'][0] + 0.18, 3), round(p['pos'][1] - 0.12, 3)]) for p in raid['gb.renown']]
for p in raid['gb.ark_royal']: p.pop('note', None)
raid['gb.dorsetshire'] = T(
 ('1939-12-13T00:00', [18.43, -34.19], n('自西蒙斯敦出发驰援', status='active')),
 ('1939-12-18T00:00', [-17.0, -38.0], n('改派福克兰群岛')),
 ('1939-12-21T18:00', [-37.0, -45.0]),
)
raid['gb.shropshire'] = T(
 ('1939-12-15T00:00', [18.35, -33.85], n('自开普敦出发，23 日抵里约', status='active')),
 ('1939-12-21T18:00', [-24.0, -27.0]),
)
raid['fr.dupleix'] = T(
 ('1939-10-12T00:00', [-17.5, 14.6], n('X 猎杀群驻达喀尔（位置示意）', status='active')),
 ('1939-10-25T00:00', [-27.0, 1.0], n('巡逻非洲—巴西狭窄处')),
 ('1939-11-10T00:00', [-17.6, 14.5]),
 ('1939-11-28T00:00', [-24.0, -2.0]),
 ('1939-12-12T00:00', [-17.6, 14.55]),
 ('1939-12-21T18:00', [-22.0, 6.0]),
)
dump(P('pipeline/tracks/raid.json'), raid)

# ---------- 蒙得维的亚（14–21 日） ----------
WRECK = [-56.2983, -34.9717]   # 34°58′18″S 56°17′54″W
mv = {}
mv['de.graf_spee'] = T(
 ('1939-12-14T12:00', [-56.215, -34.925], n('停泊蒙得维的亚外锚地，乌方准许停留 72 小时（至 17 日 20:00 当地时间）', status='active', course=250, speedKn=0)),
 ('1939-12-17T19:05', [-56.215, -34.925], n('起锚', course=250, speedKn=0)),
 ('1939-12-17T19:15', [-56.225, -34.935], n('驶离防波堤（当地 18:15），塔科马号随后', course=230, speedKn=6)),
 ('1939-12-17T19:50', [-56.27, -34.958], n('驶向西南浅水区', course=235, speedKn=6)),
 ('1939-12-17T20:10', [-56.296, -34.97], n('在蒙得维的亚西南约 6 海里抛锚，舰员转移到塔科马号与阿根廷拖船', course=240, speedKn=0)),
 ('1939-12-17T20:54', WRECK, n('自沉：两组弹药库先后爆炸，舰体燃烧数日', status='destroyed', course=240, speedKn=0)),
)
mv['de.tacoma'] = T(
 ('1939-12-14T00:00', [-56.21, -34.905], n('停在蒙得维的亚港内', status='active', course=270, speedKn=0)),
 ('1939-12-17T19:20', [-56.22, -34.912], n('离港跟随施佩伯爵号，船上已有 700 余名舰员', course=230, speedKn=6)),
 ('1939-12-17T20:15', [-56.29, -34.962], n('靠近施佩伯爵号接收最后一批人员', course=240, speedKn=0)),
 ('1939-12-17T20:40', [-56.285, -34.955], n('驶离；舰员随后转乘阿根廷拖船驶往布宜诺斯艾利斯', course=60, speedKn=6)),
 ('1939-12-17T21:40', [-56.22, -34.928], n('被乌拉圭海军押回港内', course=40, speedKn=0)),
 ('1939-12-21T18:00', [-56.21, -34.906], n('滞留港内，月底被扣留', speedKn=0)),
)
mv['gb.ajax'] = T(
 ('1939-12-14T08:00', [-55.0, -35.45], n('在英格利希浅滩以东巡逻，封锁河口北航道', status='active')),
 ('1939-12-15T12:00', [-55.9, -36.1], n('从奥林索斯号补给油船加油 200 吨')),
 ('1939-12-16T00:30', [-56.25, -36.2], n('分舰队在圣安东尼奥角外会合')),
 ('1939-12-16T06:00', [-55.7, -35.55], n('放飞机侦察港口，飞机在惠斯尔浮标附近遭射击')),
 ('1939-12-17T12:00', [-55.3, -35.35]),
 ('1939-12-17T19:20', [-55.65, -35.25], n('闻施佩伯爵号出港，以 25 节驶向惠斯尔浮标', course=290, speedKn=25)),
 ('1939-12-17T20:54', [-56.08, -35.1], n('飞机报告「施佩伯爵号已自爆」', course=300, speedKn=20)),
 ('1939-12-17T21:30', [-56.2, -35.04], n('在约 4 海里外驶过燃烧的残骸', course=290, speedKn=12)),
 ('1939-12-18T12:00', [-55.6, -35.6], n('离开河口前往福克兰群岛')),
 ('1939-12-21T18:00', [-58.6, -47.5]),
)
mv['nz.achilles'] = T(
 ('1939-12-14T08:00', [-55.5, -35.15], n('在河口北岸外巡逻', status='active')),
 ('1939-12-16T00:30', [-56.2, -36.23]),
 ('1939-12-17T12:00', [-55.45, -35.2]),
 ('1939-12-17T19:20', [-55.7, -35.18], n('随旗舰驶向惠斯尔浮标', course=290, speedKn=25)),
 ('1939-12-17T20:54', [-56.12, -35.06], dict(course=300, speedKn=20)),
 ('1939-12-17T21:30', [-56.22, -35.02], dict(course=290, speedKn=12)),
 ('1939-12-18T12:00', [-55.8, -35.6], n('离开河口，21 日抵福克兰卸下伤员')),
 ('1939-12-21T12:00', [-57.85, -51.66], n('抵斯坦利港')),
)
mv['gb.cumberland'] = T(
 ('1939-12-15T10:00', [-55.85, -35.05], n('按哈伍德指示白天在蒙得维的亚外显露身影', status='active')),
 ('1939-12-16T00:30', [-56.22, -36.26]),
 ('1939-12-17T12:00', [-55.5, -35.3]),
 ('1939-12-17T19:20', [-55.75, -35.27], dict(course=290, speedKn=25)),
 ('1939-12-17T20:54', [-56.05, -35.14], dict(course=300, speedKn=20)),
 ('1939-12-17T21:30', [-56.17, -35.08], dict(course=290, speedKn=12)),
 ('1939-12-21T18:00', [-55.4, -35.6], n('继续在河口外警戒')),
)
dump(P('pipeline/tracks/montevideo.json'), mv)

dump(P('pipeline/units.json'), U)
print(f'✓ 舰船 {len(U)} · 战斗航迹 {sum(map(len, battle.values()))} 点 · 袭击 {sum(map(len, raid.values()))} 点 · 蒙得维的亚 {sum(map(len, mv.values()))} 点')
