"""南翼推进/反击/突围/海运路线（data/routes/south.json）。"""
from south_lib import iso, pos_out, near, mid

K = ('kirchubel_ag', 'stahel_kiev')
BR = ('south_wiki_brody_ru', 'south_wiki_brody_en')
UM = ('south_wiki_uman', 'kirchubel_ag')


def R(rid, side, unit, style, width, label, pts, src, conf='medium', movement=None, role=None):
    r = {'id': rid, 'side': side, 'unit': unit, 'style': style, 'widthKm': width}
    if movement:
        r['movement'] = movement
    if role:
        r['role'] = role
    r['label'] = label
    r['waypoints'] = [{'at': iso(t), 'pos': pos_out(p)} for t, p in pts]
    r['sources'] = list(src)
    r['confidence'] = conf
    return r


def build():
    return [
        # ---- 边境交战 ----
        R('r.de.xlviii_dubno', 'DE', 'de.11pz', 'main', 24, '第 XLVIII 摩托化军突向杜布诺',
          [('6.22/03:15', 'sokal'), ('6.23', 'radekhov'), ('6.24', 'berestechko'), ('6.25', 'dubno'), ('6.27', 'ostrog'), ('7.4', near('shepetovka', 0.05, -0.08)), ('7.7', 'berdichev')],
          BR + K, 'high'),
        R('r.de.iii_zhitomir', 'DE', 'de.13pz', 'main', 24, '第 III 摩托化军经卢茨克、日托米尔直逼基辅',
          [('6.22/03:15', [24.05, 50.84]), ('6.23', 'vladimir_volynsky'), ('6.26', 'lutsk'), ('6.28', 'rovno'), ('7.5', 'novograd_volynsky'), ('7.9', 'zhitomir'), ('7.11', 'irpen')],
          BR + K, 'high'),
        R('r.su.8mk_brody', 'SU', 'su.8mk', 'counter', 20, '第 8 机械化军向别列斯捷奇科反击',
          [('6.24/06:00', near('yavorov', 0.1, 0.0)), ('6.25/14:00', near('brody', -0.1, 0.05)), ('6.26', near('brody', 0.0, 0.12)), ('6.27', near('berestechko', 0.02, -0.08))],
          BR, 'high'),
        R('r.su.popel_dubno', 'SU', 'su.34td', 'counter', 12, '波佩尔集群突入杜布诺',
          [('6.27/14:00', near('dubno', -0.1, -0.15)), ('6.27/22:00', near('dubno', -0.03, -0.05)), ('6.28', near('dubno', 0.0, -0.02))],
          BR, 'high'),
        R('r.su.19mk_dubno', 'SU', 'su.19mk', 'counter', 16, '第 19 机械化军自东北攻向杜布诺',
          [('6.22/12:00', near('berdichev', 0.0, 0.05)), ('6.24/20:00', near('mlynov', 0.15, 0.08)), ('6.26/18:00', near('dubno', 0.02, 0.06))],
          BR, 'high'),
        R('r.su.22mk_voinitsa', 'SU', 'su.22mk', 'counter', 14, '第 22 机械化军沃伊尼察反击',
          [('6.22/12:00', 'rovno'), ('6.23', near('lutsk', -0.2, 0.05)), ('6.24', 'voinitsa')], BR, 'high'),
        R('r.ro.mtn_bukovina', 'RO', 'ro.mtn_corps', 'secondary', 18, '罗马尼亚山地军收复北布科维纳',
          [('7.2', near('radauti', 0.1, 0.05)), ('7.3', near('storozhinets', 0.0, -0.05)), ('7.5', 'chernovtsy'), ('7.9', 'khotin'), ('7.17', near('mogilev_podolsky', -0.5, -0.02))],
          ('south_axworthy', 'kirchubel_ag'), 'medium'),
        R('r.de.xxx_bessarabia', 'DE', 'de.xxx_ak', 'main', 20, '第 11 集团军渡普鲁特河（“慕尼黑”行动）',
          [('7.2', near('sculeni', 0.1, 0.0)), ('7.9', 'beltsy'), ('7.18', near('soroca', 0.0, -0.05)), ('8.4', [29.7, 47.9]), ('8.18', [31.55, 47.05]), ('8.31', 'berislav')],
          ('south_lexikon_korps', 'kirchubel_ag'), 'medium'),
        R('r.ro.4a_odessa', 'RO', 'ro.4a', 'main', 22, '罗马尼亚第 4 集团军进逼敖德萨',
          [('7.4', near('husi', 0.3, 0.05)), ('7.16', 'kishinev'), ('7.26', near('bender', -0.1, 0.05)), ('8.6', near('bender', 0.4, -0.05)), ('8.13', near('odessa', -0.3, 0.05))],
          ('south_wiki_odessa_ru', 'south_axworthy'), 'medium'),
        # ---- 乌曼 ----
        R('r.de.xiv_uman', 'DE', 'de.9pz', 'main', 22, '第 XIV 摩托化军突破斯大林防线、南折乌曼',
          [('7.2', 'tarnopol'), ('7.7', near('podvolochisk', 0.1, 0.0)), ('7.16', 'belaya_tserkov'), ('7.24', near('monastyrishche', 0.35, 0.1)), ('7.31', 'olshanka'), ('8.2', near('podvysokoye', 0.15, -0.15))],
          UM, 'high'),
        R('r.de.xlix_uman', 'DE', 'de.1gd', 'main', 18, '第 XLIX 山地军经文尼察包抄乌曼',
          [('6.30', 'lvov'), ('7.13', [27.4, 49.15]), ('7.17', 'vinnitsa'), ('7.24', near('gaisin', 0.1, -0.15)), ('7.31', 'golovanevsk'), ('8.2', near('podvysokoye', 0.1, -0.15))],
          UM, 'high'),
        R('r.de.xlviii_pervomaisk', 'DE', 'de.16pz', 'secondary', 18, '第 16 装甲师南下佩尔沃迈斯克',
          [('7.16', 'kazatin'), ('7.25', near('tetiev', 0.1, -0.3)), ('7.31', near('novoarkhangelsk', 0.0, -0.15)), ('8.3', 'pervomaisk')], UM, 'high'),
        R('r.hu.mobile_pervomaisk', 'HU', 'hu.mobile_corps', 'main', 16, '匈牙利快速军经日梅林卡、图利钦至佩尔沃迈斯克',
          [('7.3', 'kolomyja'), ('7.14', near('kamenets_podolsky', 0.05, 0.05)), ('7.19', 'bar'), ('7.22', 'zhmerinka'), ('7.23', 'tulchin'), ('8.3/15:00', near('pervomaisk', -0.04, 0.0))],
          ('south_szeghy_2009', 'south_wiki_gyorshadtest'), 'high'),
        R('r.su.6a_breakout', 'SU', 'su.6a', 'breakout', 10, '第 6 集团军向南突围',
          [('8.6/20:00', near('podvysokoye', -0.05, 0.0)), ('8.7/04:00', near('golovanevsk', 0.0, 0.03))], UM, 'medium'),
        R('r.su.26a_counter', 'SU', 'su.26a', 'counter', 14, '第 26 集团军自卡涅夫向白采尔科维反击',
          [('7.15', near('kanev', -0.6, 0.05)), ('7.18', near('boguslav', 0.1, 0.15)), ('7.21', near('belaya_tserkov', 0.25, -0.1))], K, 'medium'),
        # ---- 敖德萨 ----
        R('r.su.157sd_odessa', 'SU', 'su.157sd', 'secondary', 8, '第 157 步兵师海运增援敖德萨',
          [('9.15/18:00', 'novorossiysk'), ('9.17/12:00', 'odessa')], ('south_wiki_odessa_ru',), 'high', 'sea', 'reinforcement'),
        R('r.su.grigorievka_landing', 'SU', 'su.bsf', 'counter', 6, '格里戈里耶夫卡登陆',
          [('9.21/14:00', 'sevastopol'), ('9.22/01:30', 'grigorievka')], ('south_wiki_odessa_ru',), 'high', 'sea', 'landing'),
        R('r.su.odessa_evac', 'SU', 'su.primorsk', 'retreat', 10, '敖德萨守军海运撤往塞瓦斯托波尔',
          [('10.15/22:00', 'odessa'), ('10.16/05:30', near('odessa', 0.6, -0.4)), ('10.17/12:00', 'sevastopol')], ('south_wiki_odessa_ru', 'south_wiki_odessa_en'), 'high', 'sea', 'evacuation'),
        # ---- 基辅 ----
        R('r.de.xvii_kiev_north', 'DE', 'de.xvii_ak', 'secondary', 18, '第 6 集团军自北面包抄基辅',
          [('9.5', [29.95, 50.95]), ('9.10', 'okuninovo'), ('9.16', [30.42, 50.62]), ('9.20', near('brovary', 0.05, 0.0))], K + ('south_lexikon_korps',), 'medium'),
        R('r.de.16pz_lubny', 'DE', 'de.16pz', 'main', 22, '第 16 装甲师从克列缅丘格突向卢布内',
          [('9.12', near('kremenchug', 0.05, 0.1)), ('9.13/06:00', near('khorol', -0.1, -0.1)), ('9.13/20:00', 'lubny')], K, 'high'),
        R('r.de.9pz_lokhvitsa', 'DE', 'de.9pz', 'main', 20, '第 9 装甲师北上洛赫维察会师',
          [('9.11', near('kremenchug', 0.1, 0.15)), ('9.13', near('khorol', 0.05, -0.1)), ('9.15', near('lokhvitsa', -0.05, -0.12))], K + ('south_lexikon_div',), 'high'),
        R('r.su.kirponos_breakout', 'SU', 'su.5a', 'breakout', 8, '西南方面军指挥部突围',
          [('9.18', near('piryatin', 0.0, 0.0)), ('9.19', near('piryatin', 0.3, 0.0)), ('9.20/06:00', 'shumeikovo')], K, 'medium'),
        # ---- 亚速海、克里米亚 ----
        R('r.de.liv_crimea', 'DE', 'de.liv_ak', 'main', 20, '第 11 集团军突破彼列科普与伊顺',
          [('9.24', near('perekop', 0.0, 0.03)), ('9.27', 'armyansk'), ('10.18', near('ishun', -0.05, 0.08)), ('10.28', near('ishun', 0.0, -0.1)), ('11.1', [33.65, 45.15]),
           ('11.11', near('sevastopol', 0.18, 0.08))], ('south_lexikon_korps', 'south_wiki_crimea_ru', 'kirchubel_ag'), 'high'),
        R('r.de.46id_kerch', 'DE', 'de.46id', 'secondary', 14, '向刻赤追击',
          [('10.29', near('ishun', 0.1, -0.15)), ('11.1', near('dzhankoy', 0.0, 0.0)), ('11.3', near('feodosia', -0.2, 0.08)), ('11.10', 'ak_monai'), ('11.16', 'kerch')],
          ('south_wiki_crimea_ru', 'kirchubel_ag'), 'medium'),
        R('r.su.51a_kerch', 'SU', 'su.51a', 'retreat', 14, '第 51 集团军退向刻赤',
          [('10.29', near('dzhankoy', 0.1, -0.15)), ('11.4', near('feodosia', 0.1, 0.05)), ('11.9', 'ak_monai'), ('11.14', near('kerch', -0.05, 0.0))], ('south_wiki_crimea_ru',), 'high'),
        R('r.su.kerch_evac', 'SU', 'su.51a', 'retreat', 6, '第 51 集团军残部渡刻赤海峡',
          [('11.16/22:00', near('kerch', 0.12, -0.02)), ('11.17/08:00', 'taman')], ('south_wiki_crimea_ru',), 'medium', 'sea', 'evacuation'),
        R('r.su.primorsk_sevastopol', 'SU', 'su.primorsk', 'retreat', 12, '滨海集团军翻山退入塞瓦斯托波尔',
          [('10.28', near('ishun', 0.0, -0.1)), ('10.31', near('simferopol', -0.3, 0.2)), ('11.4', near('bakhchisarai', 0.35, -0.1)), ('11.9', near('sevastopol', 0.08, 0.0))],
          ('south_wiki_crimea_ru',), 'high'),
        R('r.su.nogai_counter', 'SU', 'su.18a', 'counter', 20, '第 9、18 集团军诺盖草原反攻',
          [('9.26', near('melitopol', 0.2, 0.35)), ('9.28', near('melitopol', -0.25, 0.15)), ('9.30', near('melitopol', -0.45, 0.1))], ('south_wiki_18a_ru', 'south_lexikon_korps'), 'medium'),
        R('r.de.14pz_azov', 'DE', 'de.14pz', 'main', 22, '第 1 装甲集团军南下亚速海',
          [('9.30', 'novomoskovsk'), ('10.4', near('orekhov', 0.2, -0.05)), ('10.6', near('chernigovka', 0.15, 0.2)), ('10.9', near('chernigovka', 0.1, 0.1))],
          ('south_lexikon_korps', 'kirchubel_ag'), 'medium'),
        R('r.de.lssah_azov', 'DE', 'de.lssah', 'main', 18, '“警卫旗队”沿亚速海岸东进',
          [('10.4', near('melitopol', 0.2, 0.0)), ('10.7', 'osipenko'), ('10.8', 'mariupol'), ('10.17', 'taganrog')], ('kirchubel_ag', 'south_lexikon_div'), 'high'),
        # ---- 哈尔科夫、库尔斯克、顿巴斯 ----
        R('r.de.lv_kharkov', 'DE', 'de.lv_ak', 'main', 20, '第 6 集团军攻向哈尔科夫',
          [('10.4', 'poltava'), ('10.16', [35.4, 49.75]), ('10.22', near('kharkov', -0.15, -0.12)), ('10.24', 'kharkov')], ('south_lexikon_korps', 'kirchubel_ag'), 'high'),
        R('r.de.xlviii_kursk', 'DE', 'de.9pz', 'main', 20, '第 XLVIII 摩托化军“台风”行动右翼至库尔斯克',
          [('9.30', near('glukhov', 0.3, -0.25)), ('10.5', near('dmitriev_lg', -0.1, 0.0)), ('10.28', near('fatezh', 0.0, -0.05)), ('11.2', 'kursk'), ('11.27', 'shchigry')],
          ('south_lexikon_div', 'stahel_typhoon'), 'medium'),
        R('r.it.csir_donbas', 'IT', 'it.pasubio', 'secondary', 14, '意大利远征军从南布格河到顿巴斯',
          [('8.10', near('voznesensk', -0.05, 0.15)), ('8.21', 'verkhnedneprovsk'), ('9.23', 'tsarichanka'), ('9.30', near('petrikovka', 0.0, 0.03)), ('10.11', 'pavlograd'),
           ('10.29', [37.9, 48.25]), ('11.2', 'gorlovka')], ('south_wiki_csir_it',), 'medium'),
        # ---- 罗斯托夫 ----
        R('r.de.rostov', 'DE', 'de.lssah', 'main', 18, '第 III 摩托化军攻占罗斯托夫',
          [('11.17', [39.25, 47.36]), ('11.19', [39.45, 47.3]), ('11.21', 'rostov')], ('south_wiki_rostov_ru', 'kirchubel_ag'), 'high'),
        R('r.su.37a_rostov', 'SU', 'su.37a_2', 'counter', 26, '第 37 集团军自北向罗斯托夫后方突击',
          [('11.17', near('krasny_sulin', -0.1, -0.05)), ('11.24', near('darievka', 0.35, 0.05)), ('11.29', near('sultan_saly', -0.05, 0.25)), ('12.2', near('darievka', 0.0, -0.05))],
          ('south_wiki_rostov_ru',), 'medium'),
        R('r.su.56a_rostov', 'SU', 'su.56a', 'counter', 16, '第 56 集团军踏冰渡顿河收复罗斯托夫',
          [('11.27', 'bataysk'), ('11.29', 'rostov'), ('12.2', near('chaltyr', -0.2, 0.0)), ('12.5', near('sambek', 0.08, 0.02))], ('south_wiki_rostov_ru',), 'high'),
        R('r.de.rostov_retreat', 'DE', 'de.iii_mk', 'retreat', 22, '第 1 装甲集团军退往米乌斯河',
          [('11.28', 'rostov'), ('11.29', near('chaltyr', -0.1, 0.0)), ('11.30', 'sambek'), ('12.2', near('mius_mouth', 0.05, 0.08))], ('south_wiki_rostov_ru', 'kirchubel_ag'), 'high'),
    ]
