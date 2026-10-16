"""北方分区事件 → pipeline/events/north.json（由集成者并入 data/events.json）
已由其他分区编写、此处不重复：什利谢利堡陷落、季赫温陷落（center）；考纳斯屠杀、生命之路、首次空袭柏林（strategic）。
"""
import json, os
from north_lib import iso, pos, write, load_gaz, resolve, CAMP

E = []


def ev(id, at, cat, imp, side, zh, orig, body, place, units, sources, conf='medium', end=None, sfx=None, zoom=None,
       precision=None, wide=None):
    e = {'id': 'e.' + id, 'at': iso(at)}
    if end:
        e['endAt'] = iso(end)
    e.update({'category': cat})
    if precision:
        e['precision'] = precision
    e['importance'] = imp
    if side:
        e['side'] = side
    e.update({'title': {'zh': zh, 'orig': orig}, 'body': body, 'place': pos(place)})
    if units:
        e['units'] = units
    if sfx:
        e['sfx'] = sfx
    if zoom:
        e['zoomRel'] = zoom
    if wide:
        e['wide'] = True
    e['sources'] = sources
    e['confidence'] = conf
    E.append(e)


S_B = ['north_wiki_ru_baltic_op', 'glantz_leningrad', 'kirchubel_ag']
S_L = ['north_wiki_ru_leningrad_op', 'glantz_leningrad']

ev('pzgr4_crossing', '6.22 03:15', 'battle', 2, 'DE', '第 4 装甲集群越境', 'Panzergruppe 4 überschreitet die Grenze',
   '6 月 22 日凌晨 3 时 15 分，北方集团军群自东普鲁士和梅梅尔地区攻入立陶宛。第 4 装甲集群的 XLI、LVI 摩托化军在蒂尔西特两侧突破苏第 8、第 11 集团军结合部，LVI 军当天前出 70 余公里，在阿里奥加拉完整夺取杜比萨河公路高架桥。',
   (22.40, 55.20), ['de.pzgr4', 'de.xli_mk', 'de.lvi_mk', 'de.8pz', 'su.8a', 'su.11a'], S_B, 'high', sfx=['artillery', 'tank'], zoom=4)

ev('raseiniai', '6.23 06:00', 'battle', 1, 'SU', '拉塞尼艾坦克战', 'Panzerschlacht bei Raseiniai / Расейнское сражение',
   '6 月 23—26 日，苏第 3、第 12 机械化军在拉塞尼艾反击 XLI 军。第 2 坦克师的 KV 重型坦克让德军反坦克炮几乎失效，冲垮第 6 装甲师一个战斗群，但苏军缺乏空中掩护和燃料，被第 1 装甲师和第 36 摩托化师合围，师长索良金阵亡，西北方面军坦克主力损失殆尽。',
   '@raseiniai', ['de.xli_mk', 'de.1pz', 'de.6pz', 'de.36idmot', 'su.3mk', 'su.2td', 'su.12mk', 'su.23td', 'su.28td'],
   ['north_wiki_raseiniai', 'glantz_initial', 'glantz_leningrad'], 'high', end='6.26 20:00', sfx=['tank', 'explosion'], zoom=6)

ev('raseiniai_kv', '6.24 06:00', 'battle', 3, 'SU', '孤车阻路', 'Der KV bei Raseiniai',
   '6 月 24 日，一辆苏军 KV 坦克（一说 KV-2）停在第 6 装甲师劳斯战斗群桥头堡后方的公路上，击毁卡车纵队和 50 毫米反坦克炮，切断补给约一昼夜。工兵夜间爆破未果，直到 25 日晨德军以坦克在正面佯动、88 毫米高射炮从背后射击，才将其击毁。车组结局说法不一。',
   (23.08, 55.42), ['de.6pz', 'su.2td'], ['north_wiki_raseiniai'], 'medium', end='6.25 08:00', sfx=['tank', 'artillery'], zoom=8)

ev('liepaja', '6.23 06:00', 'siege', 2, 'DE', '利耶帕亚保卫战', 'Оборона Лиепаи',
   '德第 291 步兵师开战当天即推进到斯库奥达斯，切断利耶帕亚与内地的联系。6 月 23—29 日，苏第 67 步兵师与海军基地人员、拉脱维亚工人武装坚守这座军港，'
   '师长杰达耶夫阵亡。港内无法出海的潜艇和驱逐舰「列宁」号自行炸沉。29 日城市失守，部分守军经海路和陆路突围。',
   '@liepaja', ['de.291id', 'su.67sd', 'su.kbf'], S_B, 'high', end='6.29 12:00', sfx=['artillery', 'ship_gun'], zoom=6)

ev('dvinsk_bridges', '6.26 08:00', 'battle', 1, 'DE', '陶格夫匹尔斯大桥', 'Handstreich auf Dünaburg',
   '6 月 26 日清晨，曼施坦因 LVI 军的第 8 装甲师在 4 天内推进约 300 公里，突然出现在陶格夫匹尔斯，在乔装的勃兰登堡部队配合下完整夺取德维纳河公路桥和铁路桥。苏军依托德维纳河的第二道防线尚未成形即被突破，随后的反击也未能夺回大桥。',
   '@dvinsk', ['de.lvi_mk', 'de.8pz', 'su.5vdk', 'su.21mk'], S_B, 'high', sfx=['tank', 'explosion'], zoom=6)

ev('dvinsk_counter', '6.28 06:00', 'battle', 3, 'SU', '桥头堡反击', 'Контрудар под Даугавпилсом',
   '6 月 28 日，列柳申科的第 21 机械化军和第 5 空降军从东北、东面反击陶格夫匹尔斯桥头堡，一度迫使第 8 装甲师收缩阵地。苏军坦克不足百辆，又缺乏炮兵和空中支援，29 日反击失败。7 月 2 日，第 4 装甲集群从桥头堡继续北进。',
   (26.70, 55.97), ['su.21mk', 'su.42td', 'su.46td', 'su.5vdk', 'de.8pz', 'de.ss_totenkopf', 'de.3idmot'], S_B, 'medium',
   end='6.29 20:00', sfx=['tank', 'artillery'], zoom=6)

ev('riga_falls', '7.1 06:00', 'battle', 2, 'DE', '里加失守', 'Einnahme von Riga',
   '6 月 29 日，德第 1 步兵师的拉施先遣战斗群突进到里加，试图夺取道加瓦河大桥，苏军炸毁桥梁，城内爆发激烈巷战，圣彼得教堂在战火中焚毁。'
   '苏第 8 集团军主力退过道加瓦河北撤。7 月 1 日德第 18 集团军完全占领拉脱维亚首都里加。',
   '@riga', ['de.1id', 'de.i_ak', 'de.18a', 'su.8a'], S_B, 'medium', precision='day', sfx=['mg', 'explosion'], zoom=6)

ev('ostrov', '7.4 18:00', 'battle', 2, 'DE', '奥斯特罗夫争夺战', 'Бои за Остров',
   '7 月 4 日，第 1 装甲师冲到奥斯特罗夫，完整夺取维利卡亚河大桥，突破旧国界上的斯大林防线。5 日苏第 3 坦克师和第 111 步兵师反击，一度把德军逐出城区，KV 坦克再次令德军吃惊。6 日德军重夺城市，苏军坦克损失大半，通往普斯科夫的道路随之打开。',
   '@ostrov', ['de.1pz', 'de.xli_mk', 'su.3td', 'su.111sd', 'su.1mk'], S_B, 'high', end='7.6 20:00', sfx=['tank', 'artillery'], zoom=6)

ev('pskov_falls', '7.9 12:00', 'battle', 2, 'DE', '普斯科夫陷落', 'Einnahme von Pleskau',
   '7 月 8 日，苏第 41 步兵军在维利卡亚河的防线被突破，普斯科夫西半部失守；9 日 XLI 军从东面绕过城市，第 36 摩托化步兵师进城。第 118 步兵师退往格多夫，师长格洛瓦茨基后因弃城被枪决。波罗的海沿岸战役至此结束，德军距列宁格勒已不足 300 公里。',
   '@pskov', ['de.36idmot', 'de.xli_mk', 'su.41sk', 'su.118sd'], S_B, 'high', sfx=['artillery', 'stamp'], zoom=5)

ev('karelia_offensive', '7.10 02:00', 'battle', 2, 'FI', '芬军进攻拉多加卡累利阿', 'Hyökkäys Laatokan Karjalaan',
   '7 月 10 日凌晨，芬兰卡累利阿集团军在韦尔齐莱至伊洛曼齐一线发起进攻，主攻由塔尔韦拉的 VI 军担任。拉古斯上校的第 1 猎兵旅率先突破，'
   '16 日推进约 110 公里，在科伊里诺亚抵达拉多加湖岸，把苏第 7 集团军截为两段。21 日芬军占萨尔米，24 日在图洛克萨河停止前进。',
   (31.10, 61.95), ['fi.karelian_army', 'fi.vi_ak', 'fi.1jpr', 'su.7a', 'su.168sd'], ['north_wiki_ladoga_karelia'], 'high',
   end='7.24 20:00', sfx=['artillery', 'march'], zoom=4)

ev('luga_bridgeheads', '7.14 18:00', 'battle', 2, 'DE', '卢加河桥头堡', 'Brückenköpfe an der Luga',
   'XLI 军在卢加正面受阻后转向西北，沿林间小道奔袭约 180 公里，7 月 14 日第 6 装甲师一个营在波列奇耶夺得卢加河桥头，15 日第 1 装甲师在大萨布斯克也夺得桥头。这里距列宁格勒约 100 公里，但步兵跟不上，装甲师在桥头堡等了三周多。',
   '@porechye', ['de.6pz', 'de.1pz', 'de.xli_mk', 'su.191sd', 'su.og_luga'], S_L, 'high', sfx=['tank'], zoom=6)

ev('soltsy', '7.14 06:00', 'battle', 2, 'SU', '索利齐反击', 'Контрудар под Сольцами',
   '7 月 13 日，曼施坦因的第 8 装甲师冒进到索利齐，侧翼完全暴露。14 日起苏第 11 集团军从南北两面反击，第 21 坦克师和第 70 步兵师切断其后路，16 日收复索利齐。第 8 装甲师在 SS「骷髅」师接应下突围，后撤约 40 公里，LVI 军的进攻因此停顿。',
   '@soltsy', ['su.11a', 'su.70sd', 'su.21td', 'de.8pz', 'de.lvi_mk', 'de.ss_totenkopf'], ['north_wiki_ru_soltsy', 'glantz_leningrad'], 'high',
   end='7.18 20:00', sfx=['tank', 'artillery'], zoom=6)

ev('kunda', '8.7 18:00', 'battle', 3, 'DE', '孔达：爱沙尼亚被截断', 'Durchbruch zur Küste bei Kunda',
   '7 月 22 日起，德第 18 集团军在派德—蒂里结合部突破苏第 8 集团军防线，第 11 步兵军在楚德湖岸被截断，德方称俘 8794 人。德军随后攻占塔帕、拉克韦雷，'
   '8 月 7 日在孔达抵达芬兰湾，把爱沙尼亚一分为二：第 10 步兵军被困在塔林方向，集团军主力向纳尔瓦退却。',
   '@kunda', ['de.xxvi_ak', 'de.61id', 'su.8a', 'su.10sk', 'su.11sk'], S_L + ['north_wiki_ru_8a'], 'medium', precision='day', sfx=['mg', 'march'], zoom=5)

ev('luga_offensive', '8.8 09:00', 'battle', 2, 'DE', '突破卢加防线', 'Angriff aus den Luga-Brückenköpfen',
   '8 月 8 日，XLI 军以第 1、第 6 装甲师、第 36 摩托化步兵师和第 1 步兵师从卢加河桥头堡出击。苏军民兵师和第 191 步兵师顽强抵抗，起初进展缓慢，9 日第 1 装甲师打开缺口。14 日德军切断红卫城—金吉谢普铁路，16 日占沃洛索沃，卢加防线西段崩溃。',
   (29.05, 59.20), ['de.xli_mk', 'de.1pz', 'de.6pz', 'de.36idmot', 'de.1id', 'su.191sd', 'su.2dno'], S_L, 'high', sfx=['artillery', 'tank', 'stuka'], zoom=6)

ev('staraya_russa_counter', '8.12 05:00', 'battle', 2, 'SU', '旧鲁萨反击', 'Контрудар под Старой Руссой',
   '8 月 12 日，新到的苏第 34 集团军与第 11 集团军从旧鲁萨以南出击，向西北突入约 40 公里，14 日切断旧鲁萨—德诺铁路，德 X 军几乎被围。曼施坦因率 SS「骷髅」师和第 3 摩托化步兵师南下，19 日起侧击，25 日第 34 集团军退过洛瓦季河。',
   (31.20, 57.80), ['su.34a', 'su.11a', 'su.262sd', 'su.25kd', 'de.x_ak', 'de.lvi_mk', 'de.ss_totenkopf', 'de.3idmot', 'de.290id'],
   ['north_wiki_ru_34a', 'north_wiki_ru_leningrad_op', 'glantz_leningrad'], 'high', end='8.25 20:00', sfx=['tank', 'stuka'], zoom=5)

ev('novgorod_falls', '8.16 06:00', 'battle', 2, 'DE', '诺夫哥罗德陷落', 'Einnahme von Nowgorod',
   '8 月 10 日，德 I 军与 XXVIII 军组成的希姆斯克突击群在伊尔门湖西北发起进攻，次日占希姆斯克，苏第 48 集团军防线崩溃。16 日清晨，第 126 步兵师第 424 团在俯冲轰炸机支援下攻占诺夫哥罗德克里姆林。古城此后长期处在前线，许多中世纪教堂毁于战火。',
   '@novgorod', ['de.i_ak', 'de.126id', 'de.11id', 'de.21id', 'su.48a'], S_L, 'high', sfx=['artillery', 'stuka'], zoom=6)

ev('kingisepp_narva', '8.17 12:00', 'battle', 3, 'DE', '金吉谢普与纳尔瓦失守', 'Падение Кингисеппа и Нарвы',
   '8 月 17 日，德第 1 步兵师从东面、第 58 步兵师从南面攻入金吉谢普；同日苏军放弃纳尔瓦，第 291 步兵师自西面进城。苏第 8 集团军残部沿芬兰湾南岸东撤到科波里耶高地，'
   '卢加防线西段全部丢失。20 日德第 18 集团军前出到纳尔瓦地峡，与第 4 装甲集群连成一片。',
   '@kingisepp', ['de.1id', 'de.58id', 'de.291id', 'su.8a', 'su.191sd'], S_L + ['north_wiki_ru_8a'], 'high', sfx=['artillery', 'march'], zoom=5)

ev('chudovo', '8.20 12:00', 'battle', 3, 'DE', '十月铁路被切断', 'Einnahme von Tschudowo',
   '8 月 20 日，德第 21 步兵师攻占丘多沃，切断列宁格勒通往莫斯科的十月铁路，26 日推进到沃尔霍夫河畔的格鲁济诺。与此同时，从中央集团军群调来的 XXXIX 摩托化军经留班、托斯诺北进，'
   '8 月 25 日占留班，31 日占姆加，列宁格勒通往内地的最后一条铁路也被切断。',
   '@chudovo', ['de.21id', 'de.i_ak'], S_L, 'high', sfx=['explosion', 'stamp'], zoom=5)

ev('luga_pocket', '8.24 18:00', 'battle', 3, 'DE', '卢加包围圈', 'Лужский котёл',
   '苏军坚守卢加一个多月，8 月 24 日 SS 警察师付出重大伤亡攻占卢加。27 日德第 96 步兵师在诺温卡与南下的第 8 装甲师、东面的第 122 步兵师会合，卢加集群的第 70、111、177、235 步兵师和两个民兵师被围。9 月中旬包围圈被肃清，只有少数人员冲出。',
   (30.05, 58.90), ['su.41sk', 'su.70sd', 'su.111sd', 'su.177sd', 'su.235sd', 'de.ss_polizei', 'de.96id', 'de.8pz', 'de.122id'], S_L, 'medium',
   end='9.15 20:00', sfx=['artillery', 'mg'], zoom=6)

ev('tallinn_evacuation', '8.28 21:00', 'naval', 1, 'SU', '塔林撤退', 'Таллинский переход',
   '8 月 28 日塔林失守前夕，波罗的海舰队以 200 余艘舰船载运守军和平民撤往喀琅施塔得。船队穿越尤明达角附近的密集雷区，夜间被迫停航，又遭德军飞机和鱼雷艇攻击，数十艘舰船沉没，死亡人数多数估计在 1 万人以上。主力战舰大多抵达喀琅施塔得，成为城防的海上炮台。',
   '@juminda', ['su.kbf', 'su.10sk', 'su.10sd', 'de.xlii_ak', 'de.217id'], ['north_wiki_tallinn_evac'] + S_L, 'medium',
   end='8.30 12:00', sfx=['ship_gun', 'explosion', 'bomber'], zoom=4)

ev('vyborg', '8.29 12:00', 'battle', 2, 'FI', '芬军收复维堡', 'Viipurin takaisinvaltaus',
   '8 月 22 日，芬兰 IV 军向卡累利阿地峡西部进攻，24 日第 8 师横渡维堡湾，切断维堡以南的沿海公路。28 日苏第 43、115、123 步兵师在波尔兰皮被围，29 日芬军进入维堡。9 月 1 日包围圈肃清，苏第 43 师师长被俘，部分残部经科伊维斯托由海路撤出。',
   '@vyborg', ['fi.iv_ak', 'fi.8d', 'fi.12d', 'su.23a', 'su.43sd', 'su.115sd', 'su.123sd'], ['north_wiki_isthmus_1941'], 'high',
   sfx=['artillery', 'march'], zoom=5)

ev('svir', '9.7 12:00', 'battle', 2, 'FI', '芬军抵斯维里河', 'Syvärille',
   '9 月 4 日，芬兰 VI 军在图洛克萨河发起新攻势，5 日拉古斯集群占奥洛涅茨，7 日在洛杰伊诺耶波列附近抵达斯维里河，切断摩尔曼斯克铁路。曼纳海姆拒绝在斯维里河以南与德军会师、'
   '合围列宁格勒，只在南岸建立宽约 40 公里的桥头堡；卡累利阿地峡上的芬军也在 9 日停在旧国界附近。',
   '@lodeynoye_pole', ['fi.vi_ak', 'fi.1jpr', 'fi.5d', 'fi.17d', 'su.7a'], ['north_wiki_east_karelia', 'north_wiki_isthmus_1941'], 'high',
   sfx=['march', 'artillery'], zoom=4)

ev('demyansk', '9.8 12:00', 'battle', 3, 'DE', '杰米扬斯克合围', 'Einnahme von Demjansk',
   '8 月 30 日起，德第 16 集团军以 X 军、LVI 军和自霍尔姆出击的 II 军向东南进攻，中央集团军群的 LVII 摩托化军从南面配合。9 月 8 日德军占杰米扬斯克，苏第 27、34、11 集团军各一部在洛瓦季河与波拉河间被围，德方称俘约 3.5 万人。',
   '@demyansk', ['de.ii_ak', 'de.x_ak', 'de.lvi_mk', 'de.30id', 'de.12id', 'su.27a', 'su.34a'], S_L, 'medium', sfx=['tank', 'march'], zoom=5)

ev('leningrad_assault', '9.9 06:00', 'battle', 1, 'DE', '兵临列宁格勒城下', 'Angriff auf Leningrad / Штурм Ленинграда',
   '9 月 9 日，XLI 军与 XXXVIII、L 军向列宁格勒发起最后强攻。11 日德军占杜德霍夫高地，12 日红村、13 日红卫城失守，16 日抵芬兰湾，18 日占普希金。朱可夫 13 日到任，以严令和反击稳住普尔科沃一线；第 4 装甲集群奉命南调，攻城改为围困。',
   '@pulkovo', ['de.xli_mk', 'de.1pz', 'de.6pz', 'de.36idmot', 'de.58id', 'de.l_ak', 'su.42a', 'su.55a'], S_L, 'high',
   end='9.19 20:00', sfx=['artillery', 'tank', 'stuka'], zoom=5)

ev('oranienbaum', '9.16 12:00', 'battle', 3, 'DE', '奥拉宁鲍姆桥头堡', 'Ораниенбаумский плацдарм',
   '9 月 16 日，德第 1 步兵师在斯特列利纳抵达芬兰湾，把苏第 8 集团军隔在城西的海岸地带。17 日苏军向红村反击失败，23 日放弃彼得霍夫。依托喀琅施塔得要塞和舰炮，'
   '苏军守住了以奥拉宁鲍姆为中心、宽约 65 公里的桥头堡，一直坚持到 1944 年列宁格勒解围。',
   '@oranienbaum', ['su.8a', 'de.1id', 'de.291id', 'de.xxxviii_ak'], S_L + ['north_wiki_ru_8a'], 'high', sfx=['ship_gun', 'artillery'], zoom=6)

ev('nevsky_pyatachok', '9.20 03:00', 'battle', 3, 'SU', '涅瓦河小块地', 'Невский пятачок',
   '为配合第 54 集团军从东面打通封锁，9 月 19—20 日夜苏第 115 步兵师和海军陆战第 4 旅在莫斯科杜布罗夫卡附近强渡涅瓦河，在左岸夺得宽约 2 公里、纵深不足 1 公里的桥头堡。第 54 集团军受阻于锡尼亚维诺，桥头堡无法扩大，却被反复增援死守，伤亡极为惨重。',
   '@nevsky_pyatachok', ['su.115sd', 'su.og_neva', 'su.54a'], S_L, 'medium', sfx=['mg', 'artillery'], zoom=7)

ev('kronstadt_raid', '9.21 10:00', 'air', 2, 'DE', '喀琅施塔得空袭', 'Luftangriffe auf Kronstadt',
   '9 月 21—23 日，德国空军第 2 俯冲轰炸机联队集中攻击停泊在喀琅施塔得的波罗的海舰队。23 日，战列舰「马拉」号被汉斯-乌尔里希·鲁德尔等人投下的 1 吨重炸弹击中，'
   '前部弹药库爆炸，舰艏炸断，坐沉港内，数百名水兵死亡。残存的后部主炮塔修复后仍作为固定炮台参加城防。',
   '@kronstadt', ['su.kbf'], ['north_wiki_marat', 'bergstrom_barbarossa', 'glantz_leningrad'], 'high', end='9.23 18:00', sfx=['stuka', 'explosion', 'siren'], zoom=6)

ev('petrozavodsk', '10.1 18:00', 'battle', 2, 'FI', '彼得罗扎沃茨克陷落', 'Äänislinnan valtaus',
   '芬兰 VII 军分两路攻向卡累利阿-芬兰共和国首府：第 11 师 9 月 8 日占普里亚扎，10 月 1 日抵达城郊，第 1 师随后入城，苏第 7 集团军的守军沿湖岸北撤。芬方把该城改名为 Äänislinna，并在当地设立关押俄罗斯族居民的集中营。',
   '@petrozavodsk', ['fi.vii_ak', 'fi.11d', 'fi.1d', 'su.7a', 'su.272sd'], ['north_wiki_east_karelia'], 'high', sfx=['march', 'stamp'], zoom=5)

ev('moonsund', '9.14 05:00', 'battle', 3, 'DE', '蒙海峡群岛战役', 'Unternehmen Beowulf / Оборона Моонзунда',
   '8 月间，苏军远程轰炸机曾从萨列马岛机场多次空袭柏林。9 月 14 日起，德 XLII 军以第 61 步兵师为主实施渡海作战，先后登陆穆胡岛和萨列马岛，10 月 5 日歼灭退守瑟尔韦半岛的守军，'
   '12—21 日又攻占希乌马岛。约 2.4 万名守军大部阵亡或被俘，少数人撤往汉科。',
   (22.60, 58.40), ['de.xlii_ak', 'de.61id', 'su.moonsund'], ['north_wiki_beowulf'] + S_L, 'medium', end='10.21 20:00', sfx=['ship_gun', 'artillery'], zoom=5)

ev('kalinin_falls', '10.14 18:00', 'battle', 2, 'DE', '加里宁失守', 'Einnahme von Kalinin',
   '台风行动打开维亚济马缺口后，第 3 装甲集群转向东北。第 1 装甲师经瑟乔夫卡、祖布佐夫、洛托希诺疾进，10 月 14 日冲入加里宁，夺取伏尔加河大桥。'
   '德军随即沿铁路向托尔若克推进，企图与北方集团军群会合，但先遣群在梅德诺耶附近被瓦图京的战役集群截断歼灭，北上计划落空。',
   '@kalinin', ['de.1pz', 'de.xli_mk', 'de.36idmot'], ['north_wiki_ru_kalinin_def', 'stahel_typhoon'], 'medium', sfx=['tank', 'explosion'], zoom=5)

ev('volkhov_crossing', '10.16 06:00', 'battle', 2, 'DE', '季赫温攻势开始', 'Angriff über den Wolchow',
   '10 月 16 日，德 I 军第 11、第 21 步兵师在格鲁济诺附近强渡沃尔霍夫河，XXXIX 摩托化军随即跟进：第 12 装甲师和第 20 摩托化师攻向布多戈希，第 8 装甲师和第 18 摩托化师攻向小维舍拉。德军企图经季赫温北上与芬军会师，形成第二道封锁圈。',
   '@gruzino', ['de.i_ak', 'de.11id', 'de.21id', 'de.8pz', 'su.52a', 'su.288sd', 'su.267sd'], ['north_wiki_ru_tikhvin_def', 'glantz_leningrad'], 'high',
   sfx=['artillery', 'tank'], zoom=5)

ev('tikhvin_counteroffensive', '11.19 06:00', 'battle', 2, 'SU', '季赫温反攻', 'Тихвинская наступательная операция',
   '11 月 8 日季赫温失守后，梅列茨科夫接掌第 4 集团军，把部队编为北、东、南三个战役集群，从列宁格勒空运和自远东调来的师陆续到达。11 月 19 日苏军转入反攻，'
   '在严寒和深雪中逐步收紧对季赫温德军的包围，切断其补给线。12 月 9 日苏军收复季赫温，德军被迫退回沃尔霍夫河。',
   '@tikhvin', ['su.4a_2', 'su.60td', 'su.44sd', 'su.92sd', 'su.65sd', 'su.191sd', 'de.8pz'], ['north_wiki_ru_tikhvin_def', 'glantz_leningrad'], 'high',
   sfx=['artillery', 'march'], zoom=5)

ev('malaya_vishera', '11.20 12:00', 'battle', 3, 'SU', '收复小维舍拉', 'Освобождение Малой Вишеры',
   '10 月 23 日，德第 8 装甲师攻占小维舍拉，但在沼泽森林中补给困难、兵力分散。11 月 12 日起，得到第 259 步兵师和骑兵第 25 师增援的苏第 52 集团军转入反击，'
   '20 日收复小维舍拉，把德军逐回沃尔霍夫河一线。这是苏军在北方战线上较早取得的成功反击之一。',
   '@malaya_vishera', ['su.52a', 'su.267sd', 'su.25kd', 'de.8pz'], ['north_wiki_ru_tikhvin_def'], 'high', sfx=['artillery', 'mg'], zoom=6)

ev('rumbula', '11.30 06:00', 'atrocity', 2, 'DE', '伦布拉大屠杀', 'Rumbulas slaktiņš',
   '11 月 30 日，党卫队与德国警察在拉脱维亚辅助警察协助下，把里加犹太人隔离区的居民分批押往城东南的伦布拉森林枪杀，当天约 1.3 万人遇害；12 月 8 日又有约 1 万人被杀。'
   '行动由党卫队高级领袖耶克尔恩指挥，是大屠杀中规模最大的枪杀之一。',
   (24.24, 56.89), None, ['north_wiki_rumbula'], 'high', zoom=6)

ev('hanko_evacuation', '12.2 18:00', 'naval', 2, 'SU', '汉科撤离', 'Эвакуация Ханко',
   '10 月 26 日起，坚守了 164 天的汉科基地分批撤离。12 月 2 日最后一批船队离港，守军共约 2.2 万人撤往喀琅施塔得和列宁格勒，成为城防的生力军。'
   '3 日夜，载有约 5600 人的运兵船「约瑟夫·斯大林」号在芬兰湾触雷，数千人罹难或被俘。12 月 4 日芬军进入汉科。',
   '@hanko', ['su.hanko', 'fi.hanko_grp', 'su.kbf'], ['north_wiki_hanko', 'glantz_leningrad'], 'medium', sfx=['ship_gun', 'explosion'], zoom=5)

ev('medvezhyegorsk', '12.5 12:00', 'battle', 3, 'FI', '攻占梅德韦日耶戈尔斯克', 'Karhumäen valtaus',
   '12 月 5 日，芬军以三路钳形攻势攻占奥涅加湖北端的铁路枢纽梅德韦日耶戈尔斯克（芬方称卡尔胡迈基），次日又占波韦涅茨，切断白海—波罗的海运河。'
   '随后曼纳海姆下令停止进攻，芬军在斯维里河、奥涅加湖一线转入长达两年半的阵地战。同一天，苏军在莫斯科城下发起反攻。',
   (34.47, 62.90), ['fi.karelian_army', 'fi.8d', 'fi.1jpr', 'fi.grp_oinonen', 'de.163id'], ['north_wiki_east_karelia'], 'high',
   sfx=['artillery', 'march'], zoom=5)


def build():
    gaz = load_gaz()
    ids = set()
    for d in ('oob',):
        for f in os.listdir(os.path.join(CAMP, 'data', d)):
            if f.endswith('.json'):
                try:
                    ids |= {u['id'] for u in json.load(open(os.path.join(CAMP, 'data', d, f), encoding='utf-8'))}
                except Exception:
                    pass
    E.sort(key=lambda e: e['at'])
    for e in E:
        resolve(e['place'], gaz)
        n = len(e['body'])
        flag = '' if 80 <= n <= 140 else '  <-- 长度'
        if flag or len(e['title']['zh']) > 14:
            print(f"  {e['id']}: 正文 {n} 字，标题 {len(e['title']['zh'])} 字{flag}")
        for u in e.get('units', []):
            if u not in ids:
                print(f"  ! {e['id']}: 部队 {u} 不存在")
    assert len({e['id'] for e in E}) == len(E)
    write('pipeline/events/north.json', E)


if __name__ == '__main__':
    build()
