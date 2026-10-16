"""中央地段事件（暂存，由总负责人并入 data/events.json）。运行：python3 pipeline/build/center_events.py"""
from center_lib import iso, write, load_gaz

E = []


def ev(id, at, cat, imp, side, zh, orig, place, body, units, src, conf='high', end=None, prec=None, sfx=None, zoom=None, wide=None):
    e = {'id': id, 'at': iso(at)}
    if end:
        e['endAt'] = iso(end)
    e.update({'category': cat, 'importance': imp})
    if prec:
        e['precision'] = prec
    if side:
        e['side'] = side
    e.update({'title': {'zh': zh, 'orig': orig}, 'body': body,
              'place': place if isinstance(place, str) else [round(place[0], 3), round(place[1], 3)]})
    if units:
        e['units'] = units
    if sfx:
        e['sfx'] = sfx
    if zoom:
        e['zoomRel'] = zoom
    if wide:
        e['wide'] = True
    e['sources'] = src
    e['confidence'] = conf
    E.append(e)


S_B = ['glantz_initial', 'center_wiki_bialystok', 'dra_4']
S_S = ['glantz_derailed', 'center_wiki_smolensk', 'dra_4']
S_T = ['stahel_typhoon', 'center_wiki_vyazma', 'center_lopukhovsky']
S_M = ['stahel_moscow', 'center_shaposhnikov_moscow', 'center_zhukov']

# ======================================================================
# 边境交战
# ======================================================================
ev('e.brest_fortress', '06-22 03:15', 'siege', 1, 'DE', '布列斯特要塞', 'Оборона Брестской крепости', '@brest_fortress',
   '6 月 22 日 3 时 15 分，德军第 45 步兵师在猛烈炮火掩护下突击布列斯特要塞，原计划当天解决。第 6、第 42 步兵师和边防部队余部约 3500 人分散固守内城、北岛和东堡，激战一周，该师阵亡 482 人。29 日东堡遭重磅炸弹轰炸后陷落，零星抵抗延续到 7 月下旬。',
   ['de.45id', 'su.brest_fort', 'de.xii_ak', 'su.28sk'], ['center_wiki_brest', 'center_sandalov', 'glantz_initial'],
   end='06-29 18:00', sfx=['artillery', 'mg', 'explosion'], zoom=7)

ev('e.alytus_bridges', '06-22 18:00', 'battle', 3, 'DE', '阿利图斯涅曼河桥', 'Brücken von Alytus / Олита', '@alytus',
   '第 3 装甲集群的第 7、第 20 装甲师开战当天突破苏瓦乌基突出部前沿，下午完整夺取阿利图斯的两座涅曼河桥梁，随即在东岸与苏第 5 坦克师激战，苏军损失坦克 70 余辆。通道打开后，第 7 装甲师 24 日清晨进入维尔纽斯，比计划提前。',
   ['de.7pz', 'de.20pz', 'de.xxxix_mk'], ['center_hoth', 'glantz_initial', 'lexikon_wehrmacht'],
   conf='medium', sfx=['tank', 'artillery'], zoom=7)

ev('e.grodno_counterstroke', '06-24 06:00', 'battle', 2, 'SU', '格罗德诺反突击', 'Контрудар группы Болдина под Гродно', [23.75, 53.5],
   '西方面军副司令博尔金奉命以第 6、第 11 机械化军和第 6 骑兵军从比亚韦斯托克以东向格罗德诺反突击。第 6 机械化军拥有千余辆坦克，但在德军反坦克炮和俯冲轰炸机打击下损失惨重，又因燃料、弹药耗尽而大批遗弃车辆，25 日反突击失败，突出部内的苏军随即陷入合围。',
   ['su.6mk', 'su.11mk', 'su.6kk', 'su.10a', 'de.viii_ak'], S_B + ['center_boldin'],
   end='06-25 20:00', sfx=['tank', 'stuka'], zoom=6)

ev('e.bialystok_synagogue', '06-27 12:00', 'atrocity', 3, 'DE', '比亚韦斯托克大会堂', 'Spalenie Wielkiej Synagogi w Białymstoku', '@bialystok',
   '6 月 27 日德军进入比亚韦斯托克当天，秩序警察第 309 营在犹太人居住区搜捕、枪杀居民，并把数百名犹太男子驱入大犹太会堂后纵火焚烧。据估计当天遇害者约 2000 人，其中死于会堂者 700 人以上。这是中央集团军群后方针对犹太平民的大规模屠杀的开端。',
   [], ['center_wiki_bialystok', 'dra_4'], conf='medium', prec='day', zoom=7)

ev('e.minsk_falls', '06-28 12:00', 'battle', 1, 'DE', '明斯克陷落', 'Einnahme von Minsk', '@minsk',
   '6 月 28 日，霍特的第 20 装甲师从北面攻入白俄罗斯首府明斯克，古德里安的第 17 装甲师前一天已抵达城西南，两个装甲集群会师，比亚韦斯托克—明斯克包围圈闭合。苏第 3、第 10 集团军主力和第 13 集团军一部被围，西方面军中央被撕开一个宽约 300 公里的缺口。',
   ['de.20pz', 'de.17pz', 'de.pzgr3', 'de.pzgr2', 'su.13a', 'su.2sk', 'su.100sd'], S_B + ['center_hoth', 'center_guderian'],
   sfx=['tank', 'explosion', 'siren'], zoom=4)

ev('e.borisov_bridge', '07-01 06:00', 'battle', 3, 'DE', '鲍里索夫大桥', 'Beresina-Brücke bei Borissow', '@borisov',
   '7 月 1 日清晨，第 18 装甲师突袭鲍里索夫，在苏军工兵起爆前夺取别列津纳河大桥。2–3 日克赖泽尔的莫斯科第 1 摩托化步兵师以 T-34 和 BT 坦克反击桥头，此后沿明斯克—莫斯科公路在克鲁普基、托洛钦逐段阻击，为第聂伯河防线赢得约一周时间。',
   ['de.18pz', 'su.1msd', 'de.xlvii_mk'], S_S + ['center_isaev_kotly'],
   conf='medium', end='07-03 20:00', sfx=['tank', 'explosion'], zoom=7)

ev('e.lepel_counterstroke', '07-06 05:00', 'battle', 2, 'SU', '列佩利反突击', 'Лепельский контрудар', '@senno',
   '第 20 集团军以第 5、第 7 机械化军共约 1500 辆坦克，从维捷布斯克—奥尔沙之间向列佩利方向反突击，企图打击第 3 装甲集群侧翼。部队仓促投入，缺乏空中掩护和侦察，在先诺一带与第 7、第 17 装甲师迎头相撞，又遭俯冲轰炸机反复打击，至 10 日损失坦克 830 余辆。',
   ['su.5mk', 'su.7mk', 'su.20a', 'de.7pz', 'de.17pz', 'de.12pz'], S_S + ['center_wiki_lepel'],
   end='07-10 20:00', sfx=['tank', 'stuka', 'artillery'], zoom=5)

ev('e.bialystok_minsk_end', '07-09 12:00', 'surrender', 2, 'DE', '明斯克包围圈肃清', 'Kesselschlacht bei Białystok und Minsk', [26.3, 53.6],
   '7 月 9 日前后，比亚韦斯托克、新格鲁多克和明斯克以西的几个包围圈相继被肃清。德方战报称俘虏约 32.4 万人，缴获和击毁坦克 3332 辆、火炮 1809 门。西方面军 44 个师中约 24 个全军覆没，司令巴甫洛夫已于 6 月 30 日被撤职。',
   ['su.3a', 'su.10a', 'de.2a', 'de.9a', 'de.4a'], S_B + ['krivosheev'],
   prec='day', sfx=['march', 'typewriter'], zoom=3)

ev('e.vitebsk_falls', '07-09 20:00', 'battle', 3, 'DE', '维捷布斯克失守', 'Einnahme von Witebsk', '@vitebsk',
   '7 月 8 日第 20 装甲师在乌拉建立德维纳河桥头，9 日晚进入维捷布斯克，城市陷入大火。科涅夫的第 19 集团军刚从乌克兰调来，边下火车边于 11–13 日反攻，未能夺回城市。德军由此打通了德维纳河与第聂伯河之间通往斯摩棱斯克的“陆桥”。',
   ['de.20pz', 'de.xxxix_mk', 'su.19a', 'su.153sd'], S_S + ['center_hoth'],
   sfx=['tank', 'explosion'], zoom=6)

ev('e.dnieper_crossing', '07-10 06:00', 'battle', 2, 'DE', '强渡第聂伯河', 'Dnjepr-Übergang bei Bychow, Schklow und Kopys', '@shklov',
   '古德里安不等步兵跟上，决定以装甲部队直接强渡第聂伯河。7 月 10 日 XXIV 摩托化军在旧贝霍夫渡河，11 日 XLVI、XLVII 摩托化军在什克洛夫、科佩斯渡河，绕过坚守莫吉廖夫的苏第 61 步兵军，向斯摩棱斯克、叶利尼亚和罗斯拉夫尔方向突进。',
   ['de.xxiv_mk', 'de.xlvi_mk', 'de.xlvii_mk', 'de.3pz', 'de.10pz', 'de.29idmot', 'su.13a'], S_S + ['center_guderian'],
   end='07-11 18:00', sfx=['artillery', 'engine'], zoom=5)

ev('e.buinichi', '07-12 06:00', 'battle', 3, 'SU', '布伊尼奇原野', 'Буйничское поле', [30.27, 53.85],
   '莫吉廖夫南郊，第 172 步兵师第 388 步兵团（库捷波夫上校）在布伊尼奇原野依托反坦克壕和炮兵，击退德军装甲部队的多次冲击，苏方称击毁坦克 39 辆。战地记者西蒙诺夫的报道使这场防御战广为人知，莫吉廖夫此后一直坚守到 7 月 26 日。',
   ['su.172sd', 'su.61sk'], ['center_wiki_mogilev', 'glantz_derailed'],
   conf='medium', prec='day', sfx=['artillery', 'tank'], zoom=8)

ev('e.rogachev_zhlobin', '07-13 04:00', 'battle', 2, 'SU', '罗加乔夫—日洛宾反攻', 'Рогачёвско-Жлобинская операция', '@rogachev',
   '7 月 13 日，第 21 集团军第 63 步兵军在第聂伯河西岸发起反攻，收复罗加乔夫和日洛宾，一度向博布鲁伊斯克推进。这是战争初期红军少有的收复城市的进攻，迫使德军第 2 集团军把 LIII 军等多个步兵师投入该方向，减轻了斯摩棱斯克方向的压力。',
   ['su.21a', 'su.63sk', 'su.154sd', 'de.liii_ak', 'de.10idmot'], ['center_wiki_rogachev', 'glantz_derailed'],
   end='07-20 20:00', sfx=['artillery', 'rifle'], zoom=6)

ev('e.smolensk_falls', '07-16 12:00', 'battle', 1, 'DE', '斯摩棱斯克陷落', 'Einnahme von Smolensk', '@smolensk',
   '7 月 15 日晚第 7 装甲师攻占亚尔采沃，切断斯摩棱斯克以东公路；16 日第 29 摩托化步兵师攻入斯摩棱斯克，与守城的第 16 集团军巷战至 19 日。第 16、第 20 集团军和第 19 集团军一部陷入城北的包围圈，只剩第聂伯河上的索洛维约沃渡口与后方相连。',
   ['de.29idmot', 'de.7pz', 'de.10pz', 'su.16a', 'su.20a', 'su.19a'], S_S + ['center_guderian', 'center_hoth'],
   sfx=['artillery', 'mg', 'explosion'], zoom=4)

ev('e.timoshenko_counteroffensive', '07-23 05:00', 'battle', 2, 'SU', '铁木辛哥反突击', 'Контрнаступление оперативных групп Западного фронта', [32.6, 54.8],
   '为解救斯摩棱斯克包围圈，西方面军以预备队集团军组成卡恰洛夫、霍缅科、马斯连尼科夫、加里宁等战役集群，7 月 23 日起从罗斯拉夫尔、别雷、托罗佩茨和亚尔采沃方向向心反突击。各集群缺乏协同，进展有限，但迫使德军装甲部队转入防御，消耗了中央集团军群的兵力。',
   ['su.28a', 'su.30a', 'su.29a', 'su.og_rokossovsky', 'su.f_w'], S_S + ['erickson_road'],
   end='07-31 20:00', sfx=['artillery', 'tank'], zoom=3)

ev('e.mogilev_falls', '07-26 22:00', 'siege', 2, 'DE', '莫吉廖夫失守', 'Оборона Могилёва', '@mogilev',
   '被围近两周的莫吉廖夫在第 VII 军步兵的进攻下陷落。守城的第 61 步兵军和第 20 机械化军弹药耗尽，26 日夜奉命突围，大部在突围中被歼，第 172 步兵师师长罗曼诺夫负伤被俘。莫吉廖夫的坚守牵制了德军数个步兵师，打乱了中央集团军群的进度。',
   ['su.61sk', 'su.172sd', 'su.20mk', 'de.vii_ak', 'de.7id', 'de.23id'], ['center_wiki_mogilev', 'glantz_derailed'],
   end='07-27 12:00', sfx=['artillery', 'mg'], zoom=6)

ev('e.roslavl_pocket', '08-03 12:00', 'battle', 3, 'DE', '罗斯拉夫尔合围', 'Kesselschlacht bei Roslawl', '@roslavl',
   '8 月 1 日古德里安以 XXIV 摩托化军和第 VII 军从南北两面合围罗斯拉夫尔附近的卡恰洛夫集群，3 日占罗斯拉夫尔，德方称俘虏约 3.8 万人。卡恰洛夫中将 4 日在突围中阵亡，却被第 270 号命令错误地指为投敌，直到 1953 年才恢复名誉。',
   ['de.xxiv_mk', 'de.vii_ak', 'de.3pz', 'de.4pz', 'su.28a'], S_S + ['center_guderian'],
   sfx=['tank', 'artillery'], zoom=6)

ev('e.smolensk_breakout', '08-04 00:00', 'battle', 2, 'SU', '索洛维约沃渡口突围', 'Соловьёвская переправа', '@solovyevo',
   '罗科索夫斯基集群和利久科夫支队死守第聂伯河上的索洛维约沃、拉奇诺渡口，8 月 1–4 日被围的第 16、第 20 集团军在德军炮火和空袭下夜渡第聂伯河，部分人员和装备突出包围。5 日包围圈被肃清，德方宣称在斯摩棱斯克共俘虏约 31 万人、缴获坦克 3205 辆。',
   ['su.16a', 'su.20a', 'su.og_rokossovsky', 'su.1msd', 'de.7pz'], S_S + ['center_rokossovsky'],
   end='08-05 20:00', sfx=['artillery', 'stuka', 'rifle'], zoom=6)

ev('e.dukhovshchina_offensive', '08-17 05:00', 'battle', 3, 'SU', '杜霍夫希纳进攻', 'Духовщинская наступательная операция', '@dukhovshchina',
   '科涅夫的第 19 集团军和霍缅科的第 30 集团军 8 月 17 日起向杜霍夫希纳方向进攻，第 161 步兵师在苏军炮火和坦克冲击下几乎被打垮，第 9 集团军被迫投入预备队并调第 7 装甲师回援。苏军伤亡远大于德军，但这次进攻与叶利尼亚战役一起表明中央集团军群已无力继续东进。',
   ['su.19a', 'su.30a', 'de.161id', 'de.viii_ak', 'de.7pz'], S_S,
   conf='medium', end='09-10 20:00', sfx=['artillery', 'tank'], zoom=6)

ev('e.gomel_falls', '08-19 12:00', 'battle', 3, 'DE', '戈梅利失守', 'Einnahme von Gomel', '@gomel',
   '8 月 12 日德军第 2 集团军从北面和西面向戈梅利进攻，第 63 步兵军在罗加乔夫—日洛宾一带被围，军长彼得罗夫斯基 17 日在突围中阵亡。19 日戈梅利失守，第 21 集团军向南退却，中央方面军随之瓦解，古德里安的右翼由此敞开了通往乌克兰北部的道路。',
   ['de.2a', 'de.xiii_ak', 'de.xliii_ak', 'su.21a', 'su.63sk', 'su.f_central'], ['center_wiki_rogachev', 'glantz_derailed'],
   prec='day', sfx=['artillery', 'explosion'], zoom=6)

ev('e.turn_south_decision', '08-23 18:00', 'political', 2, 'DE', '转向基辅的决定', 'Wendung nach Süden', [21.49, 54.08],
   '陆军总司令部和博克主张集中力量直取莫斯科，希特勒却在 8 月 21 日下令优先夺取乌克兰和克里米亚。23 日古德里安飞到“狼穴”力陈东进，结果反被说服接受南下任务。第 2 装甲集群和第 2 集团军随即转向基辅，莫斯科方向的进攻推迟了一个多月。',
   ['de.pzgr2', 'de.hgr_mitte', 'de.2a'], ['center_guderian', 'center_bock_ktb', 'stahel_kiev'],
   sfx=['typewriter', 'paper'], zoom=3)

ev('e.velikie_luki', '08-26 12:00', 'battle', 3, 'DE', '大卢基合围', 'Schlacht um Welikije Luki', '@velikie_luki',
   '8 月 22 日 LVII 摩托化军的第 19、第 20 装甲师与第 9 集团军步兵从南北夹击大卢基，26 日攻占该城，苏第 22 集团军主力在城东被围，德方称俘虏约 3 万人。29 日德军进至托罗佩茨，中央集团军群北翼与北方集团军群之间的缺口由此基本封闭。',
   ['de.lvii_mk', 'de.19pz', 'de.20pz', 'de.xxiii_ak', 'su.22a'], S_S,
   conf='medium', sfx=['tank', 'artillery'], zoom=6)

ev('e.novgorod_seversky', '08-26 06:00', 'battle', 3, 'DE', '杰斯纳河木桥', 'Desna-Brücke bei Nowgorod-Sewerski', '@novgorod_seversky',
   '古德里安南下的第二天，莫德尔第 3 装甲师的一个战斗群突袭诺夫哥罗德-谢韦尔斯基，夺取杰斯纳河上长约 700 米的木桥，苏军爆破未能成功。这座桥为第 2 装甲集群打开了通往科诺托普和罗姆内的道路，也使布良斯克方面军沿杰斯纳河阻击的计划落空。',
   ['de.3pz', 'de.xxiv_mk', 'su.13a'], ['center_guderian', 'stahel_kiev'],
   conf='medium', sfx=['tank', 'explosion'], zoom=7)

ev('e.yelnya_offensive', '08-30 07:00', 'battle', 1, 'SU', '叶利尼亚攻势', 'Ельнинская наступательная операция', '@yelnya',
   '朱可夫指挥预备队方面军第 24 集团军从北、东、南三面向叶利尼亚突出部进攻。德军第 IX 军伤亡惨重，9 月 5 日夜撤出突出部，6 日苏军进入叶利尼亚。这是红军在战争中第一次成功的战役级进攻，9 月 18 日参战的 4 个步兵师成为红军第一批近卫师。',
   ['su.24a', 'su.100sd', 'su.127sd', 'su.153sd', 'su.161sd', 'su.f_res', 'de.ix_ak', 'de.292id', 'de.137id'],
   ['center_wiki_yelnya', 'center_zhukov', 'glantz_derailed'],
   end='09-06 18:00', sfx=['artillery', 'rifle', 'bell'], zoom=5)

ev('e.bryansk_front_counter', '08-30 06:00', 'battle', 3, 'SU', '罗斯拉夫尔—新济布科夫进攻', 'Рославльско-Новозыбковская операция', '@pochep',
   '斯大林要求叶廖缅科“打垮古德里安”，布良斯克方面军 8 月 30 日起以第 50、第 3、第 13 集团军和航空兵集群向南下的第 2 装甲集群侧翼反突击，第 108 坦克师在波切普以北冲击 XLVII 摩托化军。进攻缺乏兵力和协同，至 9 月 12 日停止，未能阻止德军南下。',
   ['su.f_bry', 'su.50a', 'su.3a', 'su.13a', 'su.108td', 'de.xlvii_mk', 'de.17pz'], ['center_eremenko', 'stahel_kiev'],
   conf='medium', end='09-12 20:00', sfx=['tank', 'bomber'], zoom=5)

ev('e.shlisselburg_falls', '09-08 12:00', 'battle', 2, 'DE', '什利谢利堡陷落', 'Einnahme von Schlüsselburg', '@shlisselburg',
   '从中央集团军群北调的 XXXIX 摩托化军 8 月下旬攻占丘多沃、柳班，30 日第 20 摩托化步兵师抵达涅瓦河并占姆加站。9 月 8 日该师攻占拉多加湖畔的什利谢利堡，列宁格勒与后方的最后一条陆上交通被切断，此后只能依靠拉多加湖水运和空运。',
   ['de.20idmot', 'de.xxxix_mk', 'de.12pz'], ['glantz_leningrad', 'center_wiki_18idmot'],
   prec='day', sfx=['artillery', 'explosion'], zoom=6)

ev('e.lokhvitsa_linkup', '09-14 18:20', 'battle', 2, 'DE', '洛赫维察会师', 'Zusammenschluss bei Lochwiza', '@lokhvitsa',
   '9 月 14 日傍晚，莫德尔第 3 装甲师的先头部队经罗姆内南下，在洛赫维察与第 1 装甲集群第 16 装甲师的部队会师（一说 15 日在卢布内一带完全合拢），基辅以东的包围圈闭合。苏西南方面军第 5、第 21、第 26、第 37 集团军等主力被围，德军步兵随后从西面压缩包围圈。',
   ['de.3pz', 'de.pzgr2', 'de.xxiv_mk', 'su.21a'], ['stahel_kiev', 'center_wiki_kiev', 'center_guderian'],
   sfx=['tank', 'radio'], zoom=5)

# ======================================================================
# 台风行动
# ======================================================================
ev('e.typhoon_guderian', '09-30 05:00', 'battle', 2, 'DE', '古德里安提前出击', 'Angriff der Panzergruppe 2 auf Orel', '@glukhov',
   '为利用尚好的道路，第 2 装甲集群比中央集团军群主力提前两天，于 9 月 30 日清晨从格卢霍夫—绍斯特卡地区发起进攻，当天就在布良斯克方面军左翼的叶尔马科夫集群与第 13 集团军之间突破，次日攻占谢夫斯克，装甲部队直指奥廖尔。',
   ['de.pzgr2', 'de.xxiv_mk', 'de.xlvii_mk', 'su.og_yermakov', 'su.13a'], ['center_wiki_bryansk', 'center_guderian', 'stahel_typhoon'],
   sfx=['tank', 'artillery', 'stuka'], zoom=5)

ev('e.typhoon_begins', '10-02 05:30', 'battle', 1, 'DE', '台风行动开始', 'Unternehmen Taifun', [33.3, 55.0],
   '10 月 2 日 5 时 30 分，中央集团军群以第 2、第 3、第 4 三个装甲集群和第 2、第 4、第 9 集团军共约 190 万人向莫斯科发起总攻，希特勒称之为“今年最后一次大规模决战”。第 3、第 4 装甲集群当天就在杜霍夫希纳以北和罗斯拉夫尔—莫斯科公路两侧撕开防线。',
   ['de.hgr_mitte', 'de.pzgr3', 'de.9a', 'de.4a', 'de.xl_mk', 'su.f_w', 'su.f_res', 'su.30a', 'su.43a'], S_T + ['center_bock_ktb'],
   sfx=['artillery', 'stuka', 'tank'], zoom=2, wide=True)

ev('e.orel_falls', '10-03 18:00', 'battle', 2, 'DE', '奥廖尔失守', 'Einnahme von Orel', '@orel',
   '10 月 3 日傍晚，第 4 装甲师埃伯巴赫装甲旅冲入奥廖尔，城内毫无防备，电车仍在运行，工厂设备来不及撤运。奥廖尔是布良斯克方面军的后方枢纽，它的失守切断了第 3、第 13、第 50 集团军的补给线，古德里安从东面迂回布良斯克方面军的态势就此形成。',
   ['de.4pz', 'de.xxiv_mk'], ['center_wiki_bryansk', 'center_guderian'],
   sfx=['tank', 'siren'], zoom=6)

ev('e.mtsensk', '10-06 08:00', 'battle', 2, 'SU', '姆岑斯克伏击', 'Бои под Мценском', [36.35, 53.15],
   '卡图科夫的第 4 坦克旅在奥廖尔—姆岑斯克公路两侧以 T-34 设伏，10 月 6 日在第一武士村一带伏击第 4 装甲师的装甲旅，德军损失严重。古德里安事后承认 T-34 明显优于德国坦克。第 1 近卫步兵军在姆岑斯克坚持到 10 日，为图拉防御赢得了时间。',
   ['su.4tbr', 'su.1gvsk', 'de.4pz'], ['center_wiki_mtsensk', 'center_katukov', 'center_guderian'],
   end='10-10 20:00', sfx=['tank', 'artillery'], zoom=7)

ev('e.bryansk_pocket', '10-06 12:00', 'battle', 2, 'DE', '布良斯克包围圈', 'Kesselschlacht bei Brjansk', '@bryansk',
   '10 月 6 日第 17 装甲师从东南突入布良斯克，夺取杰斯纳河大桥，与从西面推进的第 2 集团军会合。布良斯克方面军被分割成两个包围圈：第 50 集团军在布良斯克以北，第 3、第 13 集团军在特鲁布切夫斯克以南。叶廖缅科 13 日负伤被空运撤出，被围部队月底以小股突围。',
   ['de.17pz', 'de.2a', 'de.xlvii_mk', 'su.50a', 'su.3a', 'su.13a', 'su.f_bry'], ['center_wiki_bryansk', 'center_eremenko', 'stahel_typhoon'],
   sfx=['tank', 'explosion'], zoom=5)

ev('e.vyazma_pocket', '10-07 10:00', 'battle', 1, 'DE', '维亚济马包围圈', 'Kesselschlacht bei Wjasma', '@vyazma',
   '10 月 7 日，第 3 装甲集群的第 7 装甲师与第 4 装甲集群的第 10 装甲师在维亚济马以东会师，第 19、第 20、第 24、第 32 集团军和博尔金集群被围于维亚济马以西。连同布良斯克方向，苏军约 60 余万人被围，通往莫斯科的道路一时几乎无兵可守。',
   ['de.7pz', 'de.10pz', 'de.pzgr3', 'de.xl_mk', 'su.19a', 'su.20a', 'su.24a', 'su.32a', 'su.og_boldin'], S_T,
   sfx=['tank', 'radio'], zoom=4)

ev('e.zhukov_west_front', '10-10 12:00', 'political', 2, 'SU', '朱可夫接掌西方面军', 'Жуков — командующий Западным фронтом', '@mozhaisk',
   '10 月 10 日，从列宁格勒召回的朱可夫奉命统一指挥西方面军和预备队方面军残部，科涅夫改任副司令。朱可夫把从各地抽调的部队部署到沃洛科拉姆斯克、莫扎伊斯克、小雅罗斯拉韦茨、卡卢加一线的莫扎伊斯克防线，以争取远东和后方部队到达的时间。',
   ['su.f_w', 'su.f_res', 'su.5a_2', 'su.16a', 'su.43a', 'su.49a'], ['center_zhukov', 'center_wiki_mozhaisk', 'erickson_road'],
   sfx=['morse', 'typewriter'], zoom=4)

ev('e.vyazma_end', '10-12 12:00', 'surrender', 2, 'SU', '维亚济马突围失败', 'Прорыв из Вяземского котла', [34.1, 55.3],
   '10 月 10 日第 20 集团军突围失败；11–12 日卢金指挥第 19、第 32 集团军和博尔金集群在维亚济马以北突围，一度打开缺口，博尔金等部分人员脱出。13 日维亚济马地区的有组织抵抗结束，卢金重伤被俘，拉库京阵亡。被围部队牵制了德军约 28 个师。',
   ['su.19a', 'su.32a', 'su.20a', 'su.24a', 'su.og_boldin'], S_T,
   end='10-13 20:00', sfx=['mg', 'artillery'], zoom=6)

ev('e.borodino_mozhaisk', '10-13 08:00', 'battle', 2, 'SU', '博罗季诺与莫扎伊斯克', 'Бои на Бородинском поле', '@borodino',
   '刚从远东调来的第 32 步兵师在 1812 年的博罗季诺战场上迎战第 XL 摩托化军，与第 10 装甲师和党卫军帝国师激战 5 天，帝国师师长豪塞尔重伤。18 日德军攻占莫扎伊斯克，同日 LVII 军攻占小雅罗斯拉韦茨，莫扎伊斯克防线中段被突破。',
   ['su.32sd', 'su.5a_2', 'de.10pz', 'de.ss_reich', 'de.xl_mk', 'de.19pz'], ['center_wiki_mozhaisk', 'stahel_typhoon'],
   end='10-18 18:00', sfx=['artillery', 'tank'], zoom=6)

ev('e.tula_holds', '10-30 06:00', 'siege', 2, 'DE', '图拉保卫战', 'Оборона Тулы', '@tula',
   '10 月 29 日古德里安的先头部队进抵图拉南郊，30 日起以约 100 辆坦克沿奥廖尔公路连续突击。第 50 集团军残部、内务部第 156 团、图拉工人团和高射炮兵依托城区顽强防守，德军三天未能攻入，图拉成为第 2 装甲集团军北上莫斯科道路上拔不掉的钉子。',
   ['su.50a', 'su.tula_wr', 'su.154sd', 'de.xxiv_mk', 'de.3pz', 'de.4pz', 'de.gd_rgt'], ['center_wiki_tula', 'center_guderian'],
   end='11-01 20:00', sfx=['artillery', 'tank', 'mg'], zoom=6)

ev('e.tikhvin_falls', '11-08 23:00', 'battle', 2, 'DE', '季赫温陷落', 'Einnahme von Tichwin', '@tikhvin',
   'XXXIX 摩托化军 10 月 16 日起在格鲁济诺渡沃尔霍夫河，冒着泥泞经布多戈希、西托姆利亚推进。11 月 8–9 日夜，第 18 摩托化步兵师第 51 团兵不血刃进入季赫温，切断了通往拉多加湖畔沃尔霍夫斯特罗伊的铁路，列宁格勒的湖上补给线受到严重威胁。',
   ['de.18idmot', 'de.12pz', 'de.xxxix_mk'], ['center_wiki_tikhvin', 'center_wiki_18idmot', 'glantz_leningrad'],
   sfx=['tank', 'march'], zoom=6)

ev('e.second_offensive', '11-15 06:00', 'battle', 2, 'DE', '第二阶段攻势', 'Zweite Phase des Unternehmens Taifun', [36.2, 56.2],
   '地面冻结后，德军恢复对莫斯科的进攻。11 月 15 日第 3 装甲集群在加里宁以南攻击第 30 集团军，16 日第 4 装甲集群在沃洛科拉姆斯克以东攻击第 16 集团军。第 316 步兵师在杜博谢科沃等地顽强抵抗，“二十八勇士”的故事后被证明多有虚构，但该师确实迟滞了德军。',
   ['de.pzgr3', 'de.2pz', 'de.7pz', 'su.30a', 'su.16a', 'su.316sd'], S_M + ['center_wiki_klin'],
   sfx=['tank', 'artillery', 'stuka'], zoom=4)

ev('e.klin_solnechnogorsk', '11-23 12:00', 'battle', 3, 'DE', '克林与索尔涅奇诺戈尔斯克', 'Klin und Solnetschnogorsk', '@klin',
   '11 月 23 日第 3 装甲集群从南北两面迂回攻占克林，24 日德军越过伊斯特拉水库攻占索尔涅奇诺戈尔斯克，第 30 集团军与第 16 集团军之间出现缺口。苏军最高统帅部急调第 1 突击集团军和新编第 20 集团军到莫斯科以北，填补德米特罗夫—希姆基一线。',
   ['de.7pz', 'de.14idmot', 'de.v_ak', 'su.30a', 'su.16a'], ['center_wiki_klin'] + S_M,
   end='11-24 20:00', prec='day', sfx=['tank', 'explosion'], zoom=5)

ev('e.kashira', '11-25 18:00', 'battle', 2, 'DE', '卡希拉', 'Бои под Каширой', '@kashira',
   '古德里安绕过图拉，第 17 装甲师 24 日从东面绕过韦尼奥夫，25 日前卫抵达卡希拉南郊，距奥卡河大桥仅数公里，被高射炮营和第 173 步兵师挡住。27 日别洛夫的骑兵军会同第 112 坦克师反击，30 日把德军逐回莫尔德韦斯，这是古德里安在莫斯科南面到达的最远点。',
   ['de.17pz', 'de.xlvii_mk', 'su.2kk', 'su.112td', 'su.49a'], ['center_wiki_tula', 'center_belov', 'center_guderian'],
   end='11-30 20:00', sfx=['tank', 'cavalry', 'artillery'], zoom=6)

ev('e.yakhroma', '11-28 06:00', 'battle', 2, 'DE', '亚赫罗马运河桥', 'Brückenkopf Jachroma', '@yakhroma',
   '11 月 28 日凌晨，第 7 装甲师曼陀菲尔战斗群突袭亚赫罗马，完整夺取莫斯科—伏尔加运河上的大桥，在东岸建立桥头堡，突破了莫斯科北面最后一道水障。刚刚到达的第 1 突击集团军先头部队 29 日反击，德军被迫退回西岸，这个桥头堡只存在了一天多。',
   ['de.7pz', 'su.1ua', 'su.30a'], ['center_wiki_klin'] + S_M,
   end='11-29 18:00', sfx=['tank', 'explosion'], zoom=7)

ev('e.zoya', '11-29 10:00', 'atrocity', 3, 'DE', '卓娅之死', 'Казнь Зои Космодемьянской', [36.62, 55.53],
   '11 月 29 日，第 197 步兵师第 332 步兵团在鲁扎以南的彼得里谢沃村公开绞杀了 18 岁的莫斯科女学生、游击队员卓娅·科斯莫杰米扬斯卡娅。她因执行焚烧德军驻地的任务被捕，受刑后至死未供出同伴。1942 年初她的事迹见报，此后成为苏联最著名的战争英雄之一。',
   ['de.197id'], S_M, conf='medium', prec='day', zoom=8)

ev('e.krasnaya_polyana', '11-30 18:00', 'battle', 2, 'DE', '红波利亚纳', 'Krasnaja Poljana', '@krasnaya_polyana',
   '11 月 30 日，第 2 装甲师攻占莫斯科以北的红波利亚纳，距克里姆林宫约 30 公里，侦察部队一度进至希姆基附近。德军打算在这里部署重炮轰击莫斯科，但部队已筋疲力尽，严寒中缺乏冬装。12 月初新编第 20 集团军和第 1 突击集团军反击，红波利亚纳成为德军进攻的终点。',
   ['de.2pz', 'de.v_ak', 'de.35id', 'su.20a_2', 'su.1ua', 'su.16a'], S_M + ['center_wiki_klin'],
   conf='medium', sfx=['artillery', 'tank'], zoom=7)

ev('e.naro_fominsk', '12-01 06:00', 'battle', 3, 'DE', '纳罗-福明斯克突击', 'Наро-Фоминский прорыв', '@naro_fominsk',
   '12 月 1 日，第 4 集团军以第 XX 军在纳罗-福明斯克南北发起最后突击，第 258 步兵师突破第 33 集团军防线，2 日前锋抵尤什科沃—布尔采沃；北面第 292 步兵师在阿库洛沃被第 32 步兵师挡住。朱可夫调集预备队反击，4 日德军被迫退回出发阵地。',
   ['de.xx_ak', 'de.258id', 'de.292id', 'su.33a', 'su.32sd', 'su.1msd'], S_M,
   conf='medium', end='12-04 18:00', sfx=['artillery', 'mg'], zoom=6)


ev('e.kalinin_volga', '12-05 03:00', 'battle', 2, 'SU', '加里宁方面军渡伏尔加河', 'Калининская наступательная операция', [35.98, 56.76],
   '12 月 5 日凌晨，科涅夫的加里宁方面军在严寒中率先转入反攻：第 31 集团军在加里宁东南冰封的伏尔加河上强渡，攻击德军第 XXVII 军的第 162 步兵师；第 29 集团军在城西出击，进展有限。德军第 9 集团军在加里宁的防线开始动摇，莫斯科反攻自北翼揭开序幕。',
   ['su.31a', 'su.29a', 'su.f_kalinin', 'su.5sd', 'de.xxvii_ak', 'de.162id', 'de.129id', 'de.9a'], ['center_wiki_kalinin', 'center_shaposhnikov_moscow'],
   conf='medium', end='12-05 23:00', sfx=['artillery', 'rifle'], zoom=6)


def check():
    E.sort(key=lambda e: e['at'])
    gaz = load_gaz()
    import json, os, glob
    ids = set()
    for f in glob.glob(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'oob', '*.json')):
        ids |= {u['id'] for u in json.load(open(f, encoding='utf-8'))}
    prev = ''
    for e in E:
        n = len(e['body'])
        flag = '' if 80 <= n <= 140 else '  <-- 长度'
        print(f"{e['id']:<30} {e['at']} imp{e['importance']} {n}{flag}")
        if isinstance(e['place'], str):
            assert e['place'][1:] in gaz, e['place']
        for u in e.get('units', []):
            if u not in ids:
                print('   missing unit', u)
        assert e['at'] >= prev, e['id']
        prev = e['at']
        assert len(e['title']['zh']) <= 14, e['title']['zh']
    print(len(E), 'events;', sum(1 for e in E if e['importance'] == 1), 'importance-1')


if __name__ == '__main__':
    check()
    write('pipeline/events/center.json', E)
