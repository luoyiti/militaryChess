"""中央地段推进/反击/突围箭头。运行：python3 pipeline/build/center_routes.py → data/routes/center.json"""
from center_lib import iso, pos, write

R = []


def route(id, side, unit, style, width, label, wps, src, conf='medium'):
    w = []
    for line in wps.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        t, p = [x.strip() for x in line.split('|')[:2]]
        w.append({'at': iso(t), 'pos': pos(p)})
    R.append({'id': id, 'side': side, 'unit': unit, 'style': style, 'widthKm': width, 'label': label,
              'waypoints': w, 'sources': src, 'confidence': conf})


DE, SU = 'DE', 'SU'
S0 = ['glantz_initial', 'center_wiki_bialystok', 'kirchubel_ag']
S1 = ['glantz_derailed', 'center_wiki_smolensk', 'kirchubel_ag']
ST = ['stahel_typhoon', 'center_wiki_vyazma', 'center_lopukhovsky']
SM = ['center_shaposhnikov_moscow', 'stahel_moscow']

# ======================================================================
# 德军：边境交战
# ======================================================================
route('r.de.pzgr3_minsk', DE, 'de.xxxix_mk', 'main', 28, '第 3 装甲集群北钳：阿利图斯—维尔纽斯—明斯克', '''
06-22 03:15 | 23.30,54.25
06-22 20:00 | @alytus
06-24 06:00 | @vilnius
06-26 12:00 | @molodechno
06-28 12:00 | @minsk
''', S0 + ['center_hoth'], 'high')

route('r.de.pzgr2_minsk', DE, 'de.xlvii_mk', 'main', 28, '第 2 装甲集群南钳：斯洛尼姆—明斯克', '''
06-22 03:15 | 23.42,52.25
06-23 18:00 | @pruzhany
06-25 12:00 | @slonim
06-27 12:00 | @baranovichi
06-28 12:00 | @dzerzhinsk
06-29 12:00 | 27.55,53.80
''', S0 + ['center_guderian'], 'high')

route('r.de.xxiv_bobruisk', DE, 'de.xxiv_mk', 'main', 25, 'XXIV 摩托化军：布列斯特—博布鲁伊斯克—第聂伯河', '''
06-22 03:15 | 23.62,51.94
06-23 18:00 | @kobrin
06-24 18:00 | @bereza
06-26 18:00 | @slutsk
06-28 12:00 | @bobruisk
07-10 06:00 | @bykhov
07-15 12:00 | @propoisk
07-20 12:00 | @krichev
''', S0 + ['center_guderian'], 'high')

# ======================================================================
# 德军：斯摩棱斯克交战
# ======================================================================
route('r.de.xlvii_smolensk', DE, 'de.29idmot', 'main', 25, 'XLVII 摩托化军：鲍里索夫—科佩斯—斯摩棱斯克', '''
06-30 12:00 | 27.80,53.90
07-01 06:00 | @borisov
07-05 12:00 | @krupki
07-07 12:00 | @tolochin
07-12 12:00 | @kopys
07-15 12:00 | @krasny
07-16 12:00 | @smolensk
''', S1 + ['center_guderian'], 'high')

route('r.de.xlvi_yelnya', DE, 'de.10pz', 'main', 22, 'XLVI 摩托化军：什克洛夫—叶利尼亚', '''
07-11 12:00 | @shklov
07-14 12:00 | @gorki
07-18 12:00 | @pochinok
07-20 12:00 | @yelnya
''', S1 + ['center_wiki_yelnya'], 'high')

route('r.de.xxxix_yartsevo', DE, 'de.7pz', 'main', 25, 'XXXIX 摩托化军：列佩利—维捷布斯克—亚尔采沃', '''
07-03 12:00 | 28.30,54.30
07-04 12:00 | @lepel
07-07 12:00 | @ulla
07-09 20:00 | @vitebsk
07-13 18:00 | @demidov
07-15 20:00 | @yartsevo
''', S1 + ['center_hoth'], 'high')

route('r.de.lvii_nevel', DE, 'de.19pz', 'secondary', 18, 'LVII 摩托化军：季斯纳—涅韦尔—大卢基', '''
07-03 12:00 | 27.50,55.10
07-06 12:00 | @disna
07-13 12:00 | @gorodok
07-16 12:00 | @nevel
07-19 18:00 | @velikie_luki
''', S1, 'medium')

route('r.de.roslavl', DE, 'de.xxiv_mk', 'secondary', 18, '罗斯拉夫尔合围', '''
07-30 12:00 | @krichev
08-01 12:00 | 32.40,53.80
08-03 12:00 | @roslavl
''', S1 + ['center_guderian'], 'high')

route('r.de.lvii_vluki', DE, 'de.lvii_mk', 'main', 22, '大卢基—托罗佩茨', '''
08-21 12:00 | 30.80,55.85
08-24 12:00 | 30.90,56.10
08-26 12:00 | @velikie_luki
08-29 12:00 | @toropets
''', S1, 'medium')

route('r.de.gomel', DE, 'de.xliii_ak', 'secondary', 18, '第 2 集团军攻占戈梅利', '''
08-10 12:00 | @zhlobin
08-15 12:00 | 30.50,52.60
08-19 12:00 | @gomel
''', S1 + ['center_wiki_rogachev'], 'medium')

# ======================================================================
# 德军：转向基辅、XXXIX 军北上
# ======================================================================
route('r.de.guderian_kiev', DE, 'de.3pz', 'main', 32, '古德里安南下：德斯纳河—罗姆内—洛赫维察', '''
08-22 12:00 | @starodub
08-26 06:00 | @novgorod_seversky
09-03 12:00 | 33.25,51.60
09-07 12:00 | @konotop
09-10 06:00 | @romny
09-14 18:00 | @lokhvitsa
''', ['stahel_kiev', 'center_wiki_kiev', 'center_guderian'], 'high')

route('r.de.xxxix_leningrad', DE, 'de.xxxix_mk', 'main', 22, 'XXXIX 摩托化军：丘多沃—柳班—姆加—什利谢利堡', '''
08-19 12:00 | @novgorod
08-21 12:00 | 31.68,59.10
08-26 12:00 | 31.25,59.35
08-30 12:00 | 31.06,59.75
09-08 12:00 | @shlisselburg
''', ['glantz_leningrad', 'center_wiki_18idmot'], 'medium')

route('r.de.tikhvin', DE, 'de.12pz', 'main', 22, '季赫温攻势', '''
10-16 12:00 | 31.90,59.17
10-23 12:00 | 32.47,59.29
10-31 12:00 | 33.05,59.50
11-08 12:00 | @tikhvin
''', ['center_wiki_tikhvin', 'glantz_leningrad'], 'high')

# ======================================================================
# 德军：台风行动
# ======================================================================
route('r.de.typhoon_north', DE, 'de.7pz', 'main', 30, '台风行动北钳：杜霍夫希纳—维亚济马', '''
10-02 05:30 | 32.60,55.40
10-04 12:00 | @kholm_zhirkovsky
10-06 12:00 | 34.00,55.40
10-07 10:00 | @vyazma
''', ST + ['center_hoth'], 'high')

route('r.de.typhoon_south', DE, 'de.10pz', 'main', 30, '台风行动南钳：罗斯拉夫尔公路—尤赫诺夫—维亚济马', '''
10-02 05:30 | 33.30,54.25
10-04 12:00 | 34.30,54.45
10-05 18:00 | @yukhnov
10-07 10:00 | @vyazma
''', ST, 'high')

route('r.de.mozhaisk', DE, 'de.xl_mk', 'secondary', 22, '格扎茨克—博罗季诺—莫扎伊斯克', '''
10-08 12:00 | @vyazma
10-09 12:00 | @gzhatsk
10-14 12:00 | @borodino
10-18 12:00 | @mozhaisk
''', ST + ['center_wiki_mozhaisk'], 'high')

route('r.de.maloyaroslavets', DE, 'de.lvii_mk', 'secondary', 20, 'LVII 摩托化军：尤赫诺夫—梅登—小雅罗斯拉韦茨', '''
10-06 12:00 | 34.50,54.40
10-10 12:00 | @yukhnov
10-14 12:00 | @medyn
10-18 12:00 | @maloyaroslavets
''', ST + ['center_wiki_mozhaisk'], 'medium')

route('r.de.orel', DE, 'de.4pz', 'main', 30, '古德里安：格卢霍夫—奥廖尔—姆岑斯克', '''
09-30 05:00 | @glukhov
10-01 18:00 | @sevsk
10-02 18:00 | @kromy
10-03 18:00 | @orel
10-06 12:00 | 36.35,53.15
10-11 12:00 | @mtsensk
''', ['center_wiki_bryansk', 'center_wiki_mtsensk', 'center_guderian'], 'high')

route('r.de.bryansk', DE, 'de.17pz', 'main', 22, 'XLVII 摩托化军：德米特罗夫斯克—卡拉切夫—布良斯克', '''
09-30 05:00 | 33.85,51.95
10-02 12:00 | 34.40,52.20
10-04 12:00 | @dmitrovsk
10-05 18:00 | @karachev
10-06 12:00 | @bryansk
''', ['center_wiki_bryansk', 'center_guderian'], 'high')

route('r.de.tula', DE, 'de.xxiv_mk', 'main', 22, '埃伯巴赫战斗群：姆岑斯克—普拉夫斯克—图拉', '''
10-23 12:00 | @mtsensk
10-24 12:00 | @chern
10-26 12:00 | @plavsk
10-29 12:00 | @yasnaya_polyana
10-30 12:00 | 37.60,54.13
''', ['center_wiki_tula', 'center_guderian'], 'high')

route('r.de.klin_yakhroma', DE, 'de.7pz', 'main', 22, '第 3 装甲集群：克林—罗加乔沃—亚赫罗马', '''
11-15 06:00 | 35.90,56.40
11-20 12:00 | 36.40,56.40
11-23 12:00 | @klin
11-26 12:00 | 37.10,56.43
11-28 06:00 | @yakhroma
''', SM + ['center_wiki_klin'], 'high')

route('r.de.krasnaya_polyana', DE, 'de.2pz', 'main', 22, '第 4 装甲集群：索尔涅奇诺戈尔斯克—红波利亚纳', '''
11-16 06:00 | 36.10,55.98
11-21 12:00 | 36.50,56.10
11-24 12:00 | @solnechnogorsk
11-28 12:00 | 37.30,56.05
11-30 18:00 | @krasnaya_polyana
''', SM + ['center_wiki_klin'], 'medium')

route('r.de.istra', DE, 'de.ss_reich', 'secondary', 18, '鲁扎—伊斯特拉—列宁诺', '''
11-16 12:00 | 36.40,55.80
11-23 12:00 | 36.70,55.88
11-27 12:00 | @istra
12-02 12:00 | 37.05,55.88
''', SM, 'medium')

route('r.de.kashira', DE, 'de.17pz', 'main', 22, '第 2 装甲集团军：绕过图拉指向卡希拉', '''
11-18 12:00 | 37.80,53.85
11-21 16:00 | 38.15,53.97
11-24 12:00 | 38.35,54.35
11-25 18:00 | 38.15,54.78
''', ['center_wiki_tula', 'center_guderian'], 'high')



route('r.de.naro_fominsk', DE, 'de.258id', 'secondary', 14, '纳罗-福明斯克突击', '''
12-01 06:00 | @naro_fominsk
12-02 12:00 | 36.95,55.55
''', SM, 'medium')


# ======================================================================
# 苏军：反突击与突围
# ======================================================================
route('r.su.boldin_grodno', SU, 'su.6mk', 'counter', 22, '博尔金集群反突击格罗德诺', '''
06-23 06:00 | 23.40,53.25
06-24 12:00 | 23.65,53.50
06-25 12:00 | 23.75,53.55
''', S0 + ['center_boldin'], 'high')

route('r.su.10a_breakout', SU, 'su.10a', 'breakout', 25, '第 10 集团军向斯洛尼姆突围', '''
06-26 12:00 | 23.80,53.20
06-28 12:00 | 24.60,53.20
06-30 12:00 | @zelva
07-02 12:00 | 25.20,53.15
''', S0, 'medium')

route('r.su.lepel_5mk', SU, 'su.5mk', 'counter', 22, '列佩利反突击：第 5 机械化军', '''
07-06 06:00 | 30.40,54.50
07-07 12:00 | 30.00,54.65
07-08 12:00 | @senno
''', S1 + ['center_wiki_lepel'], 'high')

route('r.su.lepel_7mk', SU, 'su.7mk', 'counter', 22, '列佩利反突击：第 7 机械化军', '''
07-06 06:00 | 30.10,54.85
07-07 12:00 | 29.70,54.95
07-08 12:00 | @beshenkovichi
''', S1 + ['center_wiki_lepel'], 'high')

route('r.su.vitebsk', SU, 'su.19a', 'counter', 18, '第 19 集团军反攻维捷布斯克', '''
07-11 06:00 | 30.55,55.05
07-12 12:00 | 30.35,55.12
07-13 12:00 | 30.25,55.17
''', S1, 'medium')

route('r.su.rogachev', SU, 'su.63sk', 'counter', 22, '罗加乔夫—日洛宾反攻', '''
07-13 03:00 | 30.20,52.95
07-14 12:00 | @rogachev
07-17 12:00 | 29.80,53.10
07-20 12:00 | 29.60,53.12
''', ['center_wiki_rogachev', 'glantz_derailed'], 'high')

route('r.su.kachalov', SU, 'su.28a', 'counter', 22, '卡恰洛夫集群向斯摩棱斯克突击', '''
07-23 06:00 | 32.90,54.00
07-25 12:00 | 32.70,54.15
07-28 12:00 | @pochinok
''', S1, 'high')

route('r.su.khomenko', SU, 'su.30a', 'counter', 20, '霍缅科集群向杜霍夫希纳反突击', '''
07-24 06:00 | 32.50,55.70
07-27 12:00 | 32.30,55.45
08-01 12:00 | 32.30,55.35
''', S1, 'medium')

route('r.su.smolensk_breakout', SU, 'su.20a', 'breakout', 20, '第 16、第 20 集团军经索洛维约沃渡口突围', '''
08-01 12:00 | 32.30,54.85
08-03 12:00 | 32.60,54.90
08-04 12:00 | @solovyevo
08-05 12:00 | 32.95,54.95
''', S1 + ['center_rokossovsky'], 'high')

route('r.su.dukhovshchina', SU, 'su.19a', 'counter', 22, '杜霍夫希纳进攻', '''
08-17 06:00 | 32.65,55.25
08-22 12:00 | 32.45,55.22
09-08 12:00 | 32.40,55.22
''', S1, 'medium')

route('r.su.yelnya_north', SU, 'su.100sd', 'counter', 18, '叶利尼亚攻势：北钳', '''
08-30 06:00 | 33.15,54.68
09-03 12:00 | 33.05,54.62
09-05 12:00 | 33.00,54.57
''', ['center_wiki_yelnya', 'center_zhukov'], 'high')

route('r.su.yelnya_south', SU, 'su.24a', 'counter', 18, '叶利尼亚攻势：南钳', '''
08-30 06:00 | 33.35,54.50
09-03 12:00 | 33.15,54.50
09-06 12:00 | @yelnya
''', ['center_wiki_yelnya', 'center_zhukov'], 'high')

route('r.su.bryansk_counter', SU, 'su.108td', 'counter', 20, '布良斯克方面军：罗斯拉夫尔—新济布科夫进攻', '''
08-30 06:00 | 33.60,53.35
09-02 12:00 | 33.35,53.15
09-06 12:00 | 33.40,53.05
''', ['center_eremenko', 'stahel_kiev'], 'medium')

route('r.su.kholm_zhirkovsky', SU, 'su.og_boldin', 'counter', 18, '博尔金集群在霍尔姆-日尔科夫斯基反突击', '''
10-03 06:00 | 33.75,55.45
10-04 12:00 | 33.55,55.45
10-05 12:00 | @kholm_zhirkovsky
''', ST + ['center_boldin'], 'medium')

route('r.su.vyazma_breakout', SU, 'su.19a', 'breakout', 18, '卢金集群在维亚济马以北突围', '''
10-10 18:00 | 34.00,55.20
10-11 12:00 | 34.10,55.30
10-12 12:00 | 34.30,55.45
''', ST, 'medium')

route('r.su.3a_breakout', SU, 'su.3a', 'breakout', 20, '第 3 集团军由特鲁布切夫斯克突围', '''
10-08 22:00 | @trubchevsk
10-15 12:00 | 34.40,52.40
10-22 12:00 | 35.30,52.45
10-27 12:00 | 36.00,52.50
''', ['center_wiki_bryansk', 'boe_1941'], 'medium')

route('r.su.50a_breakout', SU, 'su.50a', 'breakout', 20, '第 50 集团军向别廖夫突围', '''
10-10 12:00 | 34.60,53.40
10-16 12:00 | 35.20,53.50
10-20 12:00 | 35.60,53.60
10-24 12:00 | @belyov
''', ['center_wiki_bryansk', 'boe_1941'], 'medium')

route('r.su.13a_breakout', SU, 'su.13a', 'breakout', 18, '第 13 集团军由谢夫斯克方向突围', '''
10-07 12:00 | 34.50,52.30
10-12 12:00 | 35.00,52.20
10-18 12:00 | 36.00,52.20
''', ['center_wiki_bryansk', 'boe_1941'], 'medium')

route('r.su.kalinin_raid', SU, 'su.21tbr', 'counter', 10, '第 21 坦克旅突袭加里宁', '''
10-17 04:00 | 36.10,56.95
10-17 10:00 | @kalinin
10-17 18:00 | 35.80,56.85
''', ['center_wiki_kalinin'], 'low')

route('r.su.kashira', SU, 'su.2kk', 'counter', 18, '别洛夫骑兵军卡希拉反击', '''
11-27 06:00 | 38.15,54.82
11-28 12:00 | 38.20,54.70
11-30 12:00 | 38.28,54.58
''', ['center_belov', 'center_wiki_tula'], 'high')

route('r.su.yakhroma', SU, 'su.1ua', 'counter', 16, '第 1 突击集团军在亚赫罗马反击', '''
11-29 06:00 | 37.65,56.32
11-29 18:00 | @yakhroma
11-30 12:00 | 37.38,56.30
''', SM + ['center_wiki_klin'], 'medium')

route('r.su.kalinin_offensive', SU, 'su.31a', 'counter', 18, '加里宁方面军反攻：第 31 集团军渡伏尔加河', '''
12-05 03:00 | 36.10,56.80
12-05 23:00 | 35.98,56.74
''', SM + ['center_wiki_kalinin'], 'medium')


if __name__ == '__main__':
    ids = [r['id'] for r in R]
    assert len(ids) == len(set(ids))
    write('data/routes/center.json', R)
