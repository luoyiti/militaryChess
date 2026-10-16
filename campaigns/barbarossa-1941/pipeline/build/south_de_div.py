"""德国南方集团军群：装甲、摩托化、山地与主要步兵师（south 代理）。"""
from south_lib import unit, near, mid, detrack
import south_de_hq

S = ('south_lexikon_div', 'lexikon_wehrmacht', 'kirchubel_ag')
PZ = ('pz3', None), ('pz4', None), ('pz2', None)


def build():
    C = {u['id']: u for u in south_de_hq.build()}
    U = []

    def pz(uid, zh, orig, short, par, cmd, men, tanks, trk, hist, conf='medium', src=S + ('stahel_kiev',), model='pz3', equip=PZ, frm=None, typ='armor'):
        U.append(unit(uid, 'DE', 'division', typ, par, zh, orig, short, cmd=cmd, men=men, tanks=tanks, model=model, equip=equip, frm=frm, trk=trk, hist=hist, src=src, conf=conf))

    # ================= 装甲师 =================
    pz('de.9pz', '第 9 装甲师', '9. Panzer-Division', '9.Pz', 'de.xlviii_mk', ('胡比基', 'Alfred Ritter von Hubicki'), 14000, 143,
       (('6.27', near('radekhov', -0.4, 0.0), 'a', '作为第 XIV 摩托化军预备队跟进'), ('7.1', 'zolochev', 'e', '攻占佐洛乔夫'), ('7.2', near('tarnopol', 0.03, 0.0), 'e', '攻占捷尔诺波尔'),
        ('7.7', near('podvolochisk', 0.1, 0.0), 'e', '突破斯大林防线'), ('7.12', [28.4, 49.8], 'e'), ('7.16', 'belaya_tserkov', 'e', '攻占白采尔科维'), ('7.24', near('monastyrishche', 0.35, 0.1), 'e'),
        ('7.31', 'olshanka', 'e', '攻占奥利尚卡'), ('8.2', near('podvysokoye', 0.15, -0.15), 'e', '在辛纽哈河与第 1 山地师会合'), ('8.9', near('olshanka', 0.1, 0.05), 'a'),
        ('8.16', near('krivoi_rog', 0.0, 0.03), 'e', '攻占克里沃罗格'), ('8.20', near('dnepropetrovsk', -0.4, -0.15), 'e', '进抵第聂伯河'), ('9.8', near('kryukov', -0.1, -0.05), 'a'),
        ('9.11', near('kremenchug', 0.1, 0.15), 'e', '在克列缅丘格渡第聂伯河'), ('9.13', near('khorol', 0.05, -0.1), 'e'), ('9.15', near('lokhvitsa', -0.05, -0.12), 'e', '与第 2 装甲集群会师，封闭基辅口袋'),
        ('9.21', near('lokhvitsa', -0.1, -0.08), 'e'), ('9.26', near('romny', 0.1, -0.1), 'a', '北调'), ('9.30', near('glukhov', 0.3, -0.25), 'e', '“台风”行动右翼'),
        ('10.5', near('dmitriev_lg', -0.1, 0.0), 'e'), ('10.14', near('dmitriev_lg', 0.25, 0.0), 'e', '陷入泥泞'), ('10.28', near('fatezh', 0.0, -0.05), 'a'),
        ('11.2', near('kursk', 0.0, 0.0), 'e', '攻占库尔斯克'), ('11.18', near('kursk', 0.4, 0.08), 'e'), ('11.27', near('shchigry', 0.0, 0.0), 'e', '攻势在希格雷受阻'), ('12.5', near('shchigry', 0.05, 0.05), 'e')),
       '第 9 装甲师刚打完巴尔干战役，6 月底作为第 XIV 摩托化军的一部投入，7 月 1 日攻占佐洛乔夫、2 日攻占捷尔诺波尔，16 日攻占白采尔科维，随后南折封闭乌曼口袋东南面。8 月 16 日攻占克里沃罗格，9 月 11 日在克列缅丘格渡河，15 日在洛赫维察以南与第 2 装甲集群会师。'
       '9 月下旬随第 XLVIII 摩托化军北上参加“台风”行动，11 月 2 日攻占库尔斯克，此后在希格雷受阻。')
    pz('de.11pz', '第 11 装甲师', '11. Panzer-Division', '11.Pz', 'de.xlviii_mk', ('克吕韦尔', 'Ludwig Crüwell'), 14500, 175,
       (('6.22/03:15', near('sokal', 0.02, -0.03), 'e', '在索卡尔渡布格河'), ('6.23', near('radekhov', 0.03, 0.03), 'e', '在拉杰霍夫击退苏军第 10 坦克师'), ('6.24', near('berestechko', 0.0, 0.0), 'e', '夺取斯特里河渡口'),
        ('6.25', 'dubno', 'e', '攻占杜布诺'), ('6.27', near('ostrog', 0.0, 0.0), 'e', '前出奥斯特罗格，后方遭波佩尔集群突袭'), ('6.30', near('ostrog', 0.15, -0.05), 'e'),
        ('7.4', near('shepetovka', 0.05, -0.08), 'e', '向舍佩托夫卡突破'), ('7.7', near('berdichev', 0.0, 0.0), 'e', '攻占别尔基切夫'), ('7.15', near('berdichev', 0.05, -0.03), 'e', '击退“别尔基切夫集群”，伤亡约 2,000 人'),
        ('7.17', near('tetiev', 0.3, 0.1), 'e', '向东南突进约 70 公里'), ('7.18', [30.19, 49.39], 'e', '渡罗斯河占斯塔维谢'), ('7.26', near('uman', 0.1, 0.25), 'e'),
        ('8.2', near('uman', 0.35, 0.05), 'e', '乌曼口袋东面'), ('8.9', near('uman', 0.3, 0.1), 'a'), ('8.20', near('belaya_tserkov', 0.0, 0.0), 'a', '北调第 6 集团军'),
        ('8.23', near('okuninovo', -0.03, 0.0), 'e', '一说其战斗群夺取奥库尼诺沃第聂伯河大桥'), ('9.6', near('gornostaipol', 0.05, -0.02), 'e', '在戈尔诺斯塔伊波尔作战'), ('9.15', near('okuninovo', 0.15, 0.0), 'e', '基辅包围战北面'),
        ('9.22', [31.2, 50.75], 'e'), ('9.26', [31.5, 50.85], 'a', '北调第 4 装甲集群'), ('10.2', near('roslavl', 0.1, 0.0), 'e', '“台风”行动'), ('10.6', near('spas_demensk', 0.1, 0.05), 'e'),
        ('10.9', near('vyazma', 0.05, -0.2), 'e', '维亚济马口袋南缘'), ('10.18', near('gzhatsk', 0.1, -0.05), 'a'), ('10.30', near('ruza', -0.25, 0.0), 'a', '泥泞停顿'),
        ('11.16', near('istra', -0.6, -0.05), 'e', '向伊斯特拉进攻'), ('11.26', near('istra', 0.0, 0.0), 'e', '攻占伊斯特拉一带'), ('12.2', near('istra', 0.3, 0.05), 'e'), ('12.5', near('istra', 0.35, 0.06), 'e', '进攻停顿')),
       '第 11 装甲师是第 1 装甲集群的矛头，6 月 23 日在拉杰霍夫击退苏军第 10 坦克师，25 日攻占杜布诺，此后承受苏军机械化军的反复反击，后方一度被波佩尔集群切断。7 月 7 日攻占别尔基切夫，击退“别尔基切夫集群”后向东南突进，参加乌曼合围。'
       '9 月在基辅以北的戈尔诺斯塔伊波尔一带作战，随后北调第 4 装甲集群参加“台风”行动，11 月攻向伊斯特拉。师长 8 月起先后由安格恩、埃泽贝克、10 月起舍勒接任。',
       'medium', S + ('stahel_kiev', 'stahel_typhoon'))
    pz('de.13pz', '第 13 装甲师', '13. Panzer-Division', '13.Pz', 'de.iii_mk', ('罗特基尔希', 'Friedrich-Wilhelm von Rothkirch und Panthen'), 14000, 147,
       (('6.22/03:15', [24.05, 50.84], 'e', '在乌斯季卢格渡布格河'), ('6.23', near('vladimir_volynsky', 0.05, 0.02), 'e'), ('6.26', 'lutsk', 'e', '清晨攻入卢茨克'),
        ('6.28', 'rovno', 'e', '攻占罗夫诺'), ('7.2', [26.88, 50.62], 'e', '科列茨'), ('7.5', near('novograd_volynsky', 0.02, 0.0), 'e', '突破斯大林防线'), ('7.9', 'zhitomir', 'e', '攻占日托米尔'),
        ('7.11', near('irpen', -0.05, -0.03), 'e', '进抵基辅以西 15 公里的伊尔平河'), ('7.20', near('fastov', 0.05, 0.08), 'e', '守卫“日托米尔走廊”'), ('7.29', near('belaya_tserkov', 0.1, -0.05), 'e'),
        ('8.6', near('korsun', -0.2, 0.0), 'e'), ('8.16', near('kirovograd', 0.3, 0.0), 'a'), ('8.25', near('dnepropetrovsk', -0.03, 0.01), 'e', '夺取第聂伯河大桥'),
        ('9.25', near('dnepropetrovsk', 0.08, 0.05), 'e', '桥头堡防御'), ('10.3', near('orekhov', -0.2, 0.25), 'e', '亚速海战役'), ('10.8', near('mariupol', 0.05, 0.03), 'e'),
        ('10.17', near('taganrog', 0.05, 0.03), 'e'), ('10.30', near('sambek', -0.03, 0.08), 'a'), ('11.17', [39.25, 47.42], 'e', '向罗斯托夫进攻'), ('11.21', near('rostov', 0.0, 0.03), 'e', '攻占罗斯托夫'),
        ('11.29', near('chaltyr', 0.0, 0.03), 'w', '撤出罗斯托夫'), ('12.2', near('mius_mouth', 0.08, 0.08), 'w'), ('12.5', near('mius_mouth', 0.03, 0.08), 'e')),
       '第 13 装甲师 6 月 22 日在乌斯季卢格渡布格河，26 日清晨攻入卢茨克，28 日占罗夫诺，7 月 9 日攻占日托米尔，11 日前锋进抵基辅以西的伊尔平河，但未奉命强攻基辅。8 月 25 日夺取第聂伯罗彼得罗夫斯克大桥，10 月经马里乌波尔、塔甘罗格东进，11 月 21 日攻入罗斯托夫，29 日撤出。')
    pz('de.14pz', '第 14 装甲师', '14. Panzer-Division', '14.Pz', 'de.iii_mk', ('屈恩', 'Friedrich Kühn'), 14000, 147,
       (('6.22/03:15', [24.1, 50.75], 'e', '在弗拉基米尔-沃伦斯基以南渡布格河'), ('6.24', near('voinitsa', -0.1, -0.05), 'e', '击退苏军第 22 机械化军'), ('6.26', near('lutsk', 0.03, -0.03), 'e'),
        ('6.29', near('mlynov', 0.05, 0.08), 'e'), ('7.3', [26.6, 50.5], 'e'), ('7.9', near('zhitomir', -0.2, -0.05), 'e'), ('7.14', near('fastov', -0.3, -0.05), 'e'),
        ('7.22', near('belaya_tserkov', -0.2, 0.0), 'e'), ('7.29', near('tetiev', 0.2, -0.2), 'e'), ('8.1', near('pervomaisk', 0.2, 0.25), 'e', '击溃苏军新锐第 223 步兵师'),
        ('8.9', near('novoukrainka', -0.2, 0.0), 'a'), ('8.20', near('krivoi_rog', 0.5, 0.15), 'a'), ('8.28', near('dnepropetrovsk', -0.3, -0.25), 'a'), ('9.8', near('kryukov', 0.08, -0.05), 'a'),
        ('9.12', near('kremenchug', 0.2, 0.2), 'e', '突出克列缅丘格桥头堡'), ('9.16', near('mirgorod', -0.05, -0.1), 'e'), ('9.22', near('lubny', 0.25, -0.05), 'e'),
        ('9.27', near('novomoskovsk', 0.0, 0.05), 'a', '南调'), ('10.4', near('orekhov', 0.2, -0.05), 'e', '亚速海战役'), ('10.9', near('chernigovka', 0.1, 0.1), 'e'),
        ('10.18', near('mariupol', 0.6, 0.35), 'e'), ('10.30', near('matveev_kurgan', 0.1, -0.05), 'a'), ('11.17', [39.35, 47.48], 'e'), ('11.21', near('rostov', -0.1, 0.06), 'e'),
        ('11.29', [39.35, 47.36], 'w'), ('12.5', near('matveev_kurgan', 0.08, -0.12), 'e', '米乌斯河防线')),
       '第 14 装甲师开战时与第 13 装甲师组成第 III 摩托化军的第一梯队，6 月 24 日击退苏军第 22 机械化军的反击，随后经日托米尔东进，8 月 1 日在佩尔沃迈斯克以北击溃苏军第 223 步兵师。9 月从克列缅丘格桥头堡北上参加基辅合围，10 月参加亚速海战役，11 月进攻罗斯托夫北面。', 'medium')
    pz('de.16pz', '第 16 装甲师', '16. Panzer-Division', '16.Pz', 'de.xlviii_mk', ('胡贝', 'Hans-Valentin Hube'), 14500, 146,
       (('6.25', near('radekhov', 0.05, -0.05), 'a', '跟进第 11 装甲师'), ('6.27', near('berestechko', 0.15, -0.05), 'e'), ('6.29', near('kremenets', -0.05, 0.08), 'e', '抗击第 8 机械化军'),
        ('7.3', near('ostrog', -0.05, -0.15), 'e'), ('7.7', near('starokonstantinov', 0.3, 0.1), 'e'), ('7.12', near('berdichev', -0.25, -0.1), 'e'), ('7.16', 'kazatin', 'e', '攻占卡扎京'),
        ('7.17', near('kazatin', 0.6, -0.05), 'e', '前卫夺取罗西车站'), ('7.25', near('tetiev', 0.1, -0.3), 'e'), ('7.31', near('novoarkhangelsk', 0.0, -0.15), 'e'),
        ('8.3', near('pervomaisk', 0.03, 0.03), 'e', '与匈牙利快速军会合，攻占佩尔沃迈斯克'), ('8.10', near('voznesensk', 0.0, 0.05), 'e'), ('8.16', near('nikolaev', 0.03, 0.04), 'e', '攻占尼古拉耶夫'),
        ('8.28', near('krivoi_rog', -0.4, -0.1), 'a'), ('9.9', near('kryukov', -0.05, 0.0), 'a'), ('9.12', near('kremenchug', 0.05, 0.25), 'e'), ('9.13', near('lubny', 0.0, -0.03), 'e', '攻占卢布内'),
        ('9.18', near('lubny', 0.05, 0.02), 'e', '包围圈东壁'), ('9.24', near('orzhitsa', 0.15, 0.1), 'e'), ('10.2', near('kremenchug', 0.6, -0.4), 'a', '南调'),
        ('10.10', near('pologi', 0.3, 0.1), 'e'), ('10.22', near('stalino', 0.0, -0.3), 'e'), ('11.6', [38.55, 47.85], 'e'), ('12.5', near('kuibyshevo', -0.05, 0.03), 'e', '米乌斯河上游')),
       '第 16 装甲师由胡贝指挥，6 月下旬在杜布诺—克列梅涅茨一带抗击苏军第 8 机械化军，7 月 16 日攻占卡扎京，8 月 3 日在佩尔沃迈斯克与匈牙利快速军会合封闭乌曼口袋，16 日攻占尼古拉耶夫。9 月 12 日从克列缅丘格桥头堡北上，13 日攻占卢布内，构成基辅口袋的东壁。10 月南调顿巴斯。', 'medium')

    # ================= 摩托化步兵师 =================
    pz('de.16idmot', '第 16 摩托化步兵师', '16. Infanterie-Division (mot.)', '16.ID(m)', 'de.xlviii_mk', ('亨里齐', 'Sigfrid Henrici'), 14000, None,
       (('6.26', near('berestechko', 0.0, 0.08), 'a'), ('6.28', near('mlynov', -0.05, -0.05), 'e', '切断波佩尔集群后路'), ('7.2', near('dubno', 0.1, -0.05), 'e'), ('7.6', near('ostrog', 0.3, -0.1), 'a'),
        ('7.12', near('berdichev', -0.2, 0.08), 'e'), ('7.20', near('kazatin', 0.5, -0.1), 'e'), ('7.31', near('talnoye', 0.0, 0.0), 'e', '攻占塔利诺耶'), ('8.2', near('novoarkhangelsk', 0.0, 0.0), 'e', '乌曼口袋东壁'),
        ('8.9', near('novoarkhangelsk', 0.05, 0.05), 'a'), ('8.20', near('voznesensk', 0.2, -0.05), 'a'), ('9.2', near('krivoi_rog', -0.2, 0.2), 'a'), ('9.13', near('kremenchug', 0.0, 0.35), 'e'),
        ('9.20', near('khorol', 0.0, 0.1), 'e'), ('9.27', near('romny', 0.2, 0.0), 'a', '北调'), ('10.2', near('putivl', 0.6, 0.1), 'e', '“台风”行动'), ('10.12', near('rylsk', 0.3, 0.0), 'e'),
        ('10.28', near('lgov', 0.2, 0.0), 'a'), ('11.10', near('kursk', -0.1, -0.15), 'e'), ('11.28', near('tim', -0.2, 0.0), 'e'), ('12.5', near('tim', -0.1, 0.02), 'e')),
       '第 16 摩托化步兵师 6 月 27–28 日插入姆雷诺夫—杜布诺之间，切断突入杜布诺的苏军波佩尔集群，7 月末攻占塔利诺耶和新阿尔汉格尔斯克，构成乌曼口袋东壁。9 月参加基辅合围，随后随第 XLVIII 摩托化军北上，经雷利斯克、利戈夫推进到库尔斯克以东。',
       'medium', S + ('south_wiki_brody_ru', 'south_wiki_uman'), 'sdkfz231', (('sdkfz251', None),), None, 'motorized')
    pz('de.25idmot', '第 25 摩托化步兵师', '25. Infanterie-Division (mot.)', '25.ID(m)', 'de.iii_mk', ('克勒斯纳', 'Erich-Heinrich Clößner'), 14000, None,
       (('6.27', near('lutsk', -0.2, -0.05), 'a', '加入第 III 摩托化军'), ('7.3', near('rovno', 0.2, 0.0), 'e'), ('7.9', near('novograd_volynsky', 0.5, -0.15), 'e'), ('7.16', near('zhitomir', 0.5, 0.05), 'e'),
        ('7.24', near('fastov', -0.1, 0.1), 'e', '抗击第 5 集团军对走廊的反击'), ('8.2', near('belaya_tserkov', 0.2, -0.15), 'e'), ('8.12', near('korsun', -0.3, -0.25), 'a'),
        ('8.25', near('kirovograd', 0.9, 0.0), 'a'), ('9.10', near('kryukov', 0.15, -0.1), 'a'), ('9.13', near('kremenchug', 0.25, 0.35), 'e'), ('9.18', near('mirgorod', 0.1, -0.05), 'e'),
        ('9.27', near('romny', 0.4, -0.2), 'a', '北调'), ('10.2', near('putivl', 0.5, -0.05), 'e', '“台风”行动右翼'), ('10.15', near('rylsk', 0.2, -0.1), 'e'), ('10.28', near('lgov', 0.1, -0.1), 'a'),
        ('11.15', near('kursk', 0.3, -0.25), 'e'), ('12.5', near('tim', -0.3, -0.05), 'e')),
       '第 25 摩托化步兵师 6 月底加入第 III 摩托化军，7 月在日托米尔—法斯托夫“走廊”抗击苏军第 5、26 集团军的侧击，9 月从克列缅丘格桥头堡北上参加基辅合围，随后随第 XLVIII 摩托化军参加“台风”行动右翼，推进到库尔斯克以东。',
       'low', S, 'sdkfz231', (('sdkfz251', None),), None, 'motorized')
    pz('de.60idmot', '第 60 摩托化步兵师', '60. Infanterie-Division (mot.)', '60.ID(m)', 'de.iii_mk', ('埃伯哈特', 'Friedrich-Georg Eberhardt'), 13000, None,
       (('7.12', near('rovno', 0.0, -0.1), 'a', '从巴尔干调来'), ('7.22', near('zhitomir', 0.4, -0.15), 'e'), ('8.4', near('boguslav', 0.0, 0.05), 'e'), ('8.16', near('kirovograd', 0.2, 0.15), 'a'),
        ('8.27', near('dnepropetrovsk', 0.03, 0.05), 'e', '第聂伯罗彼得罗夫斯克桥头堡'), ('9.25', near('dnepropetrovsk', 0.1, 0.1), 'e'), ('10.4', near('orekhov', 0.0, 0.2), 'e'),
        ('10.12', near('mariupol', 0.2, 0.15), 'a'), ('10.25', near('taganrog', 0.3, 0.15), 'e'), ('11.17', [39.2, 47.45], 'e'), ('11.21', near('rostov', -0.07, 0.04), 'e', '攻入罗斯托夫'),
        ('11.29', near('chaltyr', -0.1, 0.05), 'w'), ('12.5', near('sambek', -0.05, 0.12), 'e')),
       '第 60 摩托化步兵师 7 月中旬从巴尔干调到第 1 装甲集群，8 月下旬在第聂伯罗彼得罗夫斯克桥头堡与苏军第 6 集团军苦战一个月，10 月经马里乌波尔东进，11 月 21 日参加攻占罗斯托夫，随后撤往米乌斯河。',
       'low', S, 'sdkfz231', (('sdkfz251', None),), '7.12', 'motorized')
    pz('de.lssah', '“警卫旗队”摩托化旅', 'SS-Division (mot.) Leibstandarte SS Adolf Hitler', 'LSSAH', 'de.iii_mk', ('迪特里希', 'Josef „Sepp“ Dietrich'), 10800, None,
       (('6.30', near('sokal', 0.1, 0.0), 'a', '跟进第 1 装甲集群'), ('7.4', near('rovno', -0.2, -0.1), 'a'), ('7.8', near('novograd_volynsky', 0.0, -0.15), 'e'), ('7.13', near('zhitomir', 0.3, -0.05), 'e'),
        ('7.22', near('belaya_tserkov', -0.4, -0.2), 'e'), ('7.31', near('uman', 0.05, 0.1), 'e', '乌曼包围战'), ('8.8', near('novoarkhangelsk', -0.1, -0.2), 'a'), ('8.16', near('nikolaev', 0.4, 0.3), 'e'),
        ('8.20', near('kherson', 0.05, 0.03), 'e', '攻占赫尔松'), ('9.2', near('berislav', 0.05, -0.03), 'e', '第聂伯河渡口'), ('9.16', near('perekop', 0.3, 0.2), 'e', '侦察彼列科普地峡'),
        ('9.27', near('melitopol', -0.15, -0.1), 'e', '诺盖草原'), ('10.4', near('melitopol', -0.1, -0.05), 'e', '转入追击'), ('10.7', near('osipenko', 0.0, 0.03), 'e', '与第 1 装甲集团军会合'), ('10.8', near('mariupol', -0.02, 0.0), 'e', '攻占马里乌波尔'),
        ('10.17', near('taganrog', -0.03, 0.02), 'e', '攻占塔甘罗格'), ('10.30', near('sambek', 0.02, 0.03), 'a'), ('11.17', [39.25, 47.36], 'e'), ('11.21', near('rostov', 0.02, -0.02), 'e', '夺取顿河大桥'),
        ('11.28', near('rostov', -0.02, 0.0), 'e'), ('11.29', near('chaltyr', 0.05, -0.02), 'w'), ('12.2', near('mius_mouth', 0.05, 0.03), 'w'), ('12.5', near('mius_mouth', 0.02, 0.04), 'e')),
       '“警卫旗队”由迪特里希指挥，1941 年为加强摩托化旅（约 1 万人），7 月在日托米尔一带作战，参加乌曼包围战，8 月 20 日攻占赫尔松，9 月转隶第 11 集团军在诺盖草原作战，10 月 8 日攻占马里乌波尔、17 日攻占塔甘罗格，11 月 21 日在罗斯托夫夺取顿河大桥，29 日随第 III 摩托化军撤出。',
       'medium', S + ('kirchubel_ag',), 'inf_de', (('sdkfz251', None), ('stug3', None)), '6.30', 'motorized')
    pz('de.ss_wiking', '党卫队“维京”师', 'SS-Division (mot.) Wiking', 'SS-W', 'de.xiv_mk', ('施泰纳', 'Felix Steiner'), 19000, None,
       (('6.29', near('radekhov', -0.3, -0.1), 'a', '跟进第 XIV 摩托化军'), ('7.1', near('zolochev', 0.05, -0.05), 'e'), ('7.2', near('tarnopol', 0.0, -0.05), 'e'), ('7.9', near('starokonstantinov', -0.1, -0.2), 'e'),
        ('7.16', near('berdichev', 0.0, -0.2), 'e'), ('7.25', near('belaya_tserkov', 0.3, -0.25), 'e'), ('8.6', near('korsun', 0.0, -0.1), 'e'), ('8.22', near('kirovograd', 1.0, 0.1), 'a'),
        ('8.30', near('dnepropetrovsk', 0.1, -0.08), 'e', '第聂伯罗彼得罗夫斯克桥头堡'), ('9.27', near('novomoskovsk', 0.05, -0.08), 'e'), ('10.5', near('pologi', -0.3, 0.3), 'e'),
        ('10.14', near('stalino', -0.4, -0.35), 'e'), ('10.28', near('kuibyshevo', -0.2, -0.05), 'e', '进抵米乌斯河'), ('11.17', [39.4, 47.66], 'e', '图兹洛夫河一线'),
        ('11.27', [39.45, 47.6], 'e'), ('12.1', [39.05, 47.68], 'w'), ('12.5', near('kuibyshevo', 0.0, -0.06), 'e')),
       '党卫队“维京”师由施泰纳指挥，吸收了北欧和荷兰志愿兵，6 月底投入，7 月初在佐洛乔夫、捷尔诺波尔一带作战期间参与屠杀犹太居民。此后在第 III、XIV 摩托化军编成内作战，8 月底至 9 月在第聂伯罗彼得罗夫斯克桥头堡苦战，10 月进入顿巴斯，11 月在图兹洛夫河一线掩护罗斯托夫攻势北翼。',
       'medium', S, 'inf_de', (('sdkfz251', None),), '6.29', 'motorized')

    # ================= 山地师 =================
    pz('de.1gd', '第 1 山地师', '1. Gebirgs-Division', '1.GD', 'de.xlix_gk', ('兰茨', 'Hubert Lanz'), 14000, None,
       (('6.22/03:15', [22.97, 49.9], 'e', '渡桑河'), ('6.25', [23.15, 49.88], 'e'), ('6.28', near('yavorov', 0.05, -0.05), 'e'), ('6.30/04:00', 'lvov', 'e', '清晨攻入利沃夫'), ('7.4', [25.05, 49.6], 'a'),
        ('7.10', [26.5, 49.3], 'a'), ('7.13', [27.4, 49.15], 'e', '突破斯大林防线'), ('7.17', near('vinnitsa', 0.0, -0.05), 'e', '炮击南布格河桥'), ('7.24', near('gaisin', 0.1, -0.15), 'e'),
        ('7.31', 'golovanevsk', 'e', '攻占戈洛瓦涅夫斯克'), ('8.2', near('podvysokoye', 0.1, -0.15), 'e', '在辛纽哈河与第 9 装甲师会合'), ('8.7', near('podvysokoye', 0.02, -0.05), 'e', '绿色布拉马森林战斗'),
        ('8.20', near('novoukrainka', 0.3, -0.25), 'a'), ('9.5', [33.6, 47.8], 'a'), ('9.20', near('nikopol', 0.3, -0.15), 'a'), ('9.28', near('melitopol', -0.15, 0.25), 'e', '诺盖草原'),
        ('10.7', near('bolshoy_tokmak', 0.4, -0.1), 'e'), ('10.20', near('stalino', 0.0, 0.03), 'e', '攻占斯大林诺'), ('11.10', [38.1, 47.95], 'e'), ('12.5', [38.5, 48.0], 'e')),
       '第 1 山地师由兰茨指挥，6 月 22 日在普热梅希尔以北渡桑河，30 日清晨攻入利沃夫，随后突破斯大林防线，7 月 31 日攻占戈洛瓦涅夫斯克，8 月 2 日在辛纽哈河与第 9 装甲师会合，封闭乌曼口袋南面，在“绿色布拉马”森林一带反复击退突围的苏军。秋季转战诺盖草原，10 月 20 日前后攻占斯大林诺。',
       'medium', S + ('south_wiki_uman',), 'inf_de', None, None, 'mountain')
    pz('de.4gd', '第 4 山地师', '4. Gebirgs-Division', '4.GD', 'de.xlix_gk', ('埃格尔泽尔', 'Karl Eglseer'), 13000, None,
       (('6.22/03:15', near('sanok', 0.2, 0.1), 'r', '第 17 集团军预备队'), ('6.29', near('mostiska', 0.2, 0.0), 'a'), ('7.4', near('lvov', 0.3, -0.1), 'a'), ('7.10', [26.3, 49.4], 'a'),
        ('7.16', near('bar', -0.2, 0.0), 'e'), ('7.21', near('bratslav', -0.2, 0.1), 'e'), ('7.26', near('gaisin', -0.05, -0.25), 'e', '击败苏军第 18 机械化军'), ('8.3', near('golovanevsk', 0.0, 0.05), 'e'),
        ('8.8', near('podvysokoye', -0.05, -0.08), 'e'), ('8.20', near('novoukrainka', 0.2, -0.35), 'a'), ('9.5', [33.5, 47.7], 'a'), ('9.20', near('nikopol', 0.4, -0.25), 'a'),
        ('9.28', near('melitopol', 0.1, 0.25), 'e', '诺盖草原防御'), ('10.7', near('bolshoy_tokmak', 0.2, -0.05), 'e'), ('10.22', near('stalino', 0.35, -0.2), 'e'), ('11.10', [38.25, 47.9], 'e'),
        ('12.5', [38.55, 47.92], 'e')),
       '第 4 山地师开战时为第 17 集团军预备队，7 月加入第 XLIX 山地军，25–27 日在盖辛以南击败苏军第 18 机械化军，参加乌曼合围。9 月下旬在梅利托波尔以北的诺盖草原抵挡苏军第 9、18 集团军的反攻，10 月随山地军进入顿巴斯，冬季守米乌斯河。',
       'low', S + ('south_wiki_uman',), 'inf_de', None, None, 'mountain')

    # ================= 步兵师（沿所属军的路线平移，关键点单独给出） =================
    def inf(uid, zh, orig, short, par, cmd, base, dx, dy, extra=(), hist='', conf='low', src=S, until=None, since=None, typ='infantry', frm=None, men=16000):
        trk = detrack(C[base], dx, dy, since=since, until=until) if base else []
        pts = {t[0]: t for t in trk}
        for e in extra:
            pts[e[0] if '/' in e[0] else e[0] + '/20:00'] = e
        from south_lib import iso
        trk = sorted(pts.values(), key=lambda t: iso(t[0]))
        U.append(unit(uid, 'DE', 'division', typ, par, zh, orig, short, cmd=cmd, men=men, model='inf_de', frm=frm, trk=tuple(trk), hist=hist, src=src, conf=conf))

    inf('de.57id', '第 57 步兵师', '57. Infanterie-Division', '57.ID', 'de.lv_ak', ('布吕姆', 'Oskar Blümm'), 'de.lv_ak', 0.05, -0.05,
        (('6.28', near('brody', 0.05, 0.12), 'e', '承受第 8 机械化军反击'), ('10.24', near('kharkov', 0.0, 0.0), 'e', '攻入哈尔科夫')),
        '第 57 步兵师开战时配属第 XLVIII 摩托化军跟进，6 月 28 日在布罗迪以北与第 75 师一起承受苏军第 8 机械化军的反击，随后在第 LV 军编成内东进，10 月 24 日攻入哈尔科夫。', 'medium', S + ('south_wiki_brody_en',))
    inf('de.75id', '第 75 步兵师', '75. Infanterie-Division', '75.ID', 'de.lv_ak', ('哈默', 'Ernst Hammer'), 'de.lv_ak', -0.05, 0.08,
        (('6.28', near('dubno', -0.05, -0.08), 'e', '与第 16 摩托化师合围波佩尔集群'), ('7.2', near('dubno', 0.05, -0.05), 'e')),
        '第 75 步兵师 6 月 27–28 日被调入杜布诺以南的缺口，与第 16 摩托化师等切断突入杜布诺的苏军波佩尔集群，随后随第 LV 军经旧康斯坦丁诺夫东进至基辅以西，秋季参加哈尔科夫方向推进。', 'low', S + ('south_wiki_brody_ru',), until='9.1')
    inf('de.111id', '第 111 步兵师', '111. Infanterie-Division', '111.ID', 'de.xxix_ak', ('施塔普夫', 'Otto Stapf'), 'de.xxix_ak', -0.15, 0.05,
        (('6.26', near('mlynov', -0.08, 0.0), 'e', '在姆雷诺夫切断苏军第 40 坦克师'), ('6.28', near('dubno', -0.02, 0.05), 'e', '自姆雷诺夫逼近杜布诺')),
        '第 111 步兵师 6 月下旬在姆雷诺夫与苏军第 19 机械化军的第 40 坦克师激战，随后从北面逼近杜布诺，参与围歼波佩尔集群，此后随第 XXIX 军东进至基辅方向。', 'low', S + ('south_wiki_brody_ru',), until='9.20')
    inf('de.299id', '第 299 步兵师', '299. Infanterie-Division', '299.ID', 'de.xxix_ak', ('莫泽', 'Willi Moser'), 'de.xxix_ak', 0.05, 0.08,
        (('6.27', near('olyka', 0.0, 0.0), 'e', '在奥雷卡—奥斯特罗热茨侧击苏军第 35 坦克师'), ('6.30', near('klevan', -0.05, 0.0), 'e')),
        '第 299 步兵师 6 月 26–27 日沿奥斯特罗热茨—奥雷卡方向推进，攻击苏军第 9 机械化军第 35 坦克师的西翼，此后随第 XXIX 军东进，7 月底进抵基辅西南的筑垒带。', 'low', S + ('south_wiki_brody_ru',))
    inf('de.44id', '第 44 步兵师', '44. Infanterie-Division', '44.ID', 'de.xvii_ak', ('西贝特', 'Friedrich Siebert'), 'de.xxix_ak', -0.1, -0.05,
        (('9.5', [30.0, 51.0], 'e', '转隶第 XVII 军'), ('9.16', [30.42, 50.62], 'e', '从北面进攻基辅'), ('9.20', near('kiev', 0.15, 0.08), 'e'), ('10.10', [34.0, 50.45], 'a'),
         ('10.25', near('kharkov', 0.1, 0.25), 'e'), ('12.5', [36.8, 50.45], 'a')),
        '第 44 步兵师开战时为第 1 装甲集群强渡布格河，随后掩护装甲集群北翼，9 月转隶第 XVII 军从北面进攻基辅，秋季进抵哈尔科夫以北。', 'low', S, until='8.30')
    inf('de.62id', '第 62 步兵师', '62. Infanterie-Division', '62.ID', 'de.xvii_ak', ('凯纳', 'Walter Keiner'), 'de.xvii_ak', 0.1, -0.08, (),
        '第 62 步兵师在第 XVII 军编成内由柳博姆渡布格河，经科韦利、萨尔内东进，8 月参加对科罗斯坚的进攻，秋季随第 6 集团军向哈尔科夫推进。', 'low')
    inf('de.71id', '第 71 步兵师', '71. Infanterie-Division', '71.ID', 'de.xxix_ak', ('哈特曼', 'Alexander von Hartmann'), 'de.iv_ak', 0.05, 0.05,
        (('8.12', near('goloseevo', -0.12, -0.05), 'e', '调入基辅西南'), ('9.16', near('goloseevo', -0.06, -0.02), 'e'), ('9.19', near('kiev', 0.0, -0.02), 'e', '攻入基辅'),
         ('10.10', near('poltava', 0.3, 0.3), 'a'), ('10.28', near('kharkov', 0.1, -0.1), 'a'), ('12.5', near('kharkov', 0.15, -0.05), 'a')),
        '第 71 步兵师开战时属第 IV 军，经拉瓦-鲁斯卡亚攻向利沃夫，8 月调到基辅西南面归第 XXIX 军，9 月 19 日与第 95、296 步兵师攻入基辅，秋季东调哈尔科夫地区。', 'medium', S + ('stahel_kiev',), until='8.5')
    inf('de.95id', '第 95 步兵师', '95. Infanterie-Division', '95.ID', 'de.xxix_ak', ('西克斯特', 'Hans-Heinrich Sixt von Armin'), 'de.xxix_ak', 0.04, 0.06,
        (('9.19', near('kiev', -0.03, 0.03), 'e', '攻入基辅'), ('9.30', near('kiev', 0.05, 0.03), 'a', '基辅城防'), ('10.20', near('kursk', -0.4, -0.3), 'a'), ('11.2', near('kursk', 0.05, -0.03), 'e', '与第 9 装甲师攻占库尔斯克'),
         ('12.5', near('kursk', 0.25, 0.0), 'a')),
        '第 95 步兵师 7 月作为第二梯队跟进，8 月起在基辅西南面与苏军第 37 集团军对峙，9 月 19 日攻入基辅，随后北调，11 月 2 日与第 9 装甲师攻占库尔斯克。', 'low', S + ('stahel_kiev',), since='7.14', until='9.16', frm='7.14')
    inf('de.296id', '第 296 步兵师', '296. Infanterie-Division', '296.ID', 'de.xvii_ak', ('施特默尔曼', 'Wilhelm Stemmermann'), 'de.iv_ak', -0.05, 0.08,
        (('8.15', near('goloseevo', -0.25, -0.15), 'e'), ('9.16', [30.35, 50.52], 'e', '从西北进攻基辅'), ('9.19', near('kiev', -0.03, 0.05), 'e', '攻入基辅'),
         ('10.12', [33.6, 50.5], 'a'), ('10.28', near('belgorod', -0.3, -0.2), 'a'), ('12.5', near('belgorod', -0.1, -0.25), 'a')),
        '第 296 步兵师开战时属第 IV 军攻向利沃夫，7 月转隶第 6 集团军，9 月归第 XVII 军从西北面进攻基辅，19 日攻入城区，秋季推进到别尔哥罗德一带。', 'low', S + ('stahel_kiev',), until='8.1')
    inf('de.24id', '第 24 步兵师', '24. Infanterie-Division', '24.ID', 'de.iv_ak', ('特陶', 'Hans von Tettau'), 'de.iv_ak', -0.08, -0.06, (),
        '第 24 步兵师在第 IV 军编成内经拉瓦-鲁斯卡亚攻向利沃夫，7 月经捷尔诺波尔以北东进，8 月守卡涅夫—切尔卡瑟之间的第聂伯河，秋季东进顿巴斯。', 'low')
    inf('de.125id', '第 125 步兵师', '125. Infanterie-Division', '125.ID', 'de.xliv_ak', ('施奈德', 'Willi Schneckenburger'), 'de.xliv_ak', 0.08, -0.08,
        (('7.25', near('gaisin', 0.0, 0.0), 'e', '攻占盖辛'), ('10.31', near('artemovsk', -0.4, 0.0), 'e')),
        '第 125 步兵师 7 月 25 日攻占盖辛，切断第 6、12 集团军向南的退路，参加乌曼合围，此后随第 XLIV 军经切尔卡瑟、波尔塔瓦东进到北顿涅茨河。', 'low', S + ('south_wiki_uman',), since='7.5')
    inf('de.97lid', '第 97 轻步兵师', '97. leichte Infanterie-Division', '97.le', 'de.lii_ak', ('弗雷特-皮科', 'Maximilian Fretter-Pico'), 'de.lii_ak', 0.08, 0.05, (),
        '第 97 轻步兵师在第 LII 军编成内突破加利西亚边境工事和斯大林防线，参加乌曼合围，8 月底在杰里耶夫卡强渡第聂伯河，秋季推进到北顿涅茨河。', 'low', typ='mountain')
    inf('de.100lid', '第 100 轻步兵师', '100. leichte Infanterie-Division', '100.le', 'de.lii_ak', ('桑内', 'Werner Sanne'), 'de.lii_ak', -0.06, -0.05,
        (('8.6', near('golovanevsk', -0.08, -0.05), 'e', '阻截苏军南向突围'),),
        '第 100 轻步兵师随第 LII 军东进，8 月 6–7 日在戈洛瓦涅夫斯克以南阻截苏军第 6 集团军的突围纵队，秋季随第 17 集团军推进到巴拉克列亚。', 'low', typ='mountain')
    inf('de.101lid', '第 101 轻步兵师', '101. leichte Infanterie-Division', '101.le', 'de.lv_ak', ('马克斯', 'Erich Marcks'), 'de.lii_ak', 0.12, -0.1,
        (('9.30', near('poltava', -0.1, 0.05), 'a'), ('10.22', near('kharkov', -0.15, -0.1), 'e'), ('10.24', near('kharkov', 0.03, -0.04), 'e', '攻入哈尔科夫'), ('12.5', near('kharkov', 0.3, -0.1), 'a')),
        '第 101 轻步兵师开战时属第 LII 军，师长马克斯首日负伤失去一条腿。8 月底在杰里耶夫卡强渡第聂伯河，10 月归第 LV 军，24 日参加攻占哈尔科夫。', 'low', S, until='9.22', typ='mountain')
    inf('de.68id', '第 68 步兵师', '68. Infanterie-Division', '68.ID', 'de.xlix_gk', ('布劳恩', 'Georg Braun'), 'de.xlix_gk', -0.1, 0.08,
        (('8.25', near('kirovograd', 0.2, 0.2), 'a'), ('9.15', near('kremenchug', 0.0, 0.05), 'a'), ('10.10', near('poltava', 0.4, 0.1), 'a'), ('10.25', near('kharkov', -0.05, 0.03), 'e', '进驻哈尔科夫'),
         ('11.14', near('kharkov', 0.0, 0.0), 'a', '师长布劳恩被延时地雷炸死'), ('12.5', near('kharkov', 0.0, 0.0), 'a', '哈尔科夫卫戍')),
        '第 68 步兵师在第 XLIX 山地军编成内参加利沃夫和乌曼方向作战，秋季北调担任哈尔科夫卫戍，11 月 14 日苏军撤退时预埋的无线电遥控炸弹炸毁师部，师长布劳恩身亡，德军随即在城内处决大批人质。', 'low', S, until='8.10')
    # ---- 第 11 集团军 ----
    inf('de.22id', '第 22 步兵师', '22. Infanterie-Division', '22.ID', 'de.xxx_ak', ('施蓬内克', 'Hans Graf von Sponeck'), 'de.xxx_ak', 0.08, 0.05,
        (('8.30', near('berislav', 0.05, -0.05), 'e', '强渡第聂伯河建立桥头堡'), ('9.26', near('melitopol', -0.45, -0.1), 'e'), ('10.24', near('ishun', 0.08, 0.02), 'e', '伊顺阵地'),
         ('11.12', near('sevastopol', 0.15, 0.12), 'e', '塞瓦斯托波尔北面')),
        '第 22 步兵师（空降步兵师）开战时为第 11 集团军预备队，8 月 30 日在别里斯拉夫附近强渡第聂伯河建立南面桥头堡，10 月参加伊顺突破，11 月进抵塞瓦斯托波尔北面。师长施蓬内克 10 月升任第 XLII 军军长。', 'low', S, until='10.20')
    inf('de.46id', '第 46 步兵师', '46. Infanterie-Division', '46.ID', 'de.liv_ak', ('希默', 'Kurt Himer'), 'de.liv_ak', 0.1, 0.05,
        (('9.26', near('perekop', 0.05, -0.05), 'e', '突破土耳其墙'), ('10.22', near('ishun', 0.05, 0.05), 'e'), ('11.3', near('feodosia', -0.2, 0.08), 'e', '追击至刻赤'), ('11.16', near('kerch', 0.0, 0.0), 'e', '攻占刻赤'),
         ('12.5', near('kerch', -0.1, 0.0), 'a', '守刻赤半岛')),
        '第 46 步兵师 9 月 24–26 日参加突破彼列科普土耳其墙，10 月参加伊顺突破，11 月随第 XLII 军追击苏军第 51 集团军，16 日攻占刻赤，此后独守刻赤半岛。', 'medium', S + ('south_wiki_crimea_ru',), until='9.24')
    inf('de.73id', '第 73 步兵师', '73. Infanterie-Division', '73.ID', 'de.liv_ak', ('比内克', 'Bruno Bieler'), 'de.liv_ak', -0.08, 0.05,
        (('9.24', near('perekop', -0.05, 0.02), 'e', '强攻彼列科普'), ('9.27', near('armyansk', -0.03, 0.0), 'e', '攻占亚美尼亚斯克'), ('10.24', near('ishun', -0.1, 0.03), 'e'),
         ('11.5', near('ak_monai', -0.2, 0.0), 'e'), ('11.15', near('kerch', -0.15, 0.05), 'e'), ('11.25', near('genichesk', 0.2, 0.25), 'a', '北调米乌斯河方向'), ('12.5', near('taganrog', -0.15, 0.08), 'e', '加强米乌斯河防线')),
        '第 73 步兵师 9 月 24 日在彼列科普地峡打头阵，27 日攻占亚美尼亚斯克，10 月参加伊顺突破，11 月随第 XLII 军追击到刻赤，月底北调塔甘罗格方向，加强第 1 装甲集团军的米乌斯河防线。', 'medium', S + ('south_wiki_crimea_ru',), until='9.20')
    inf('de.50id', '第 50 步兵师', '50. Infanterie-Division', '50.ID', 'de.liv_ak', ('霍利特', 'Karl-Adolf Hollidt'), 'de.liv_ak', 0.04, -0.06,
        (('9.25', near('perekop', 0.12, 0.0), 'e'),),
        '第 50 步兵师在第 LIV 军编成内从雅西经基希讷乌、尼古拉耶夫推进到彼列科普，参加突破土耳其墙和伊顺阵地，11 月进抵塞瓦斯托波尔外围。', 'low')
    inf('de.132id', '第 132 步兵师', '132. Infanterie-Division', '132.ID', 'de.liv_ak', ('辛茨尼希', 'Fritz Lindemann'), 'de.liv_ak', -0.06, -0.08, (),
        '第 132 步兵师 7 月起作为增援投入第 11 集团军，在第 LIV 军编成内参加彼列科普、伊顺突破和 11 月对塞瓦斯托波尔的第一次强攻。', 'low', since='7.20', frm='7.24')
    inf('de.170id', '第 170 步兵师', '170. Infanterie-Division', '170.ID', 'de.liv_ak', ('维特克', 'Walter Wittke'), 'de.liv_ak', 0.12, -0.03,
        (('10.24', near('ishun', 0.15, 0.0), 'e'), ('11.4', near('feodosia', 0.0, 0.03), 'e', '攻占费奥多西亚'), ('11.14', near('kerch', -0.08, -0.05), 'e'), ('11.25', near('feodosia', 0.0, 0.0), 'a'),
         ('12.5', near('sevastopol', 0.25, 0.12), 'e', '调回塞瓦斯托波尔')),
        '第 170 步兵师在第 LIV 军编成内从雅西攻向基希讷乌，此后随第 11 集团军推进到彼列科普，10 月参加伊顺突破，11 月随第 XLII 军向刻赤追击，月底调回塞瓦斯托波尔准备 12 月攻势。', 'low', until='10.20')
    inf('de.198id', '第 198 步兵师', '198. Infanterie-Division', '198.ID', 'de.xxx_ak', ('勒蒂希', 'Otto Röttig'), 'de.xxx_ak', -0.06, 0.06,
        (('9.28', near('dnepropetrovsk', 0.15, 0.0), 'e', '调入第聂伯罗彼得罗夫斯克桥头堡'), ('10.10', near('pavlograd', 0.0, -0.2), 'e'), ('10.25', near('stalino', -0.3, 0.2), 'e'), ('12.5', near('artemovsk', -0.1, -0.35), 'e')),
        '第 198 步兵师开战时与罗马尼亚师一起组成第 XXX 军，7 月 2 日渡普鲁特河，8 月进抵南布格河，9 月调入第聂伯罗彼得罗夫斯克桥头堡归第 III 摩托化军，秋季东进顿巴斯。', 'low', until='9.10')
    return U
