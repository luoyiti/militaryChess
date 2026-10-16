"""北方分区推进 / 反击 / 撤退 / 海上撤离箭头 → data/routes/north.json"""
from north_lib import iso, pos, write, load_gaz, resolve

R = []


def route(id, side, unit, style, width, label, wps, sources, conf='medium', **kw):
    r = {'id': 'r.' + id, 'side': side, 'unit': unit, 'style': style, 'widthKm': width}
    r.update(kw)
    if label:
        r['label'] = label
    r['waypoints'] = [{'at': iso(a), 'pos': pos(p)} for a, p in wps]
    r['sources'] = sources
    r['confidence'] = conf
    R.append(r)


S_B = ['north_wiki_ru_baltic_op', 'glantz_leningrad', 'kirchubel_ag']
S_L = ['north_wiki_ru_leningrad_op', 'glantz_leningrad']
S_F = ['north_wiki_ladoga_karelia', 'north_wiki_isthmus_1941', 'north_wiki_east_karelia']

# —— 边境交战 ——
route('de.lvi_dvinsk', 'DE', 'de.8pz', 'main', 24, 'LVI 军奔袭陶格夫匹尔斯',
      [('6.22 03:15', (22.60, 55.08)), ('6.22 20:00', '@ariogala'), ('6.24 12:00', '@ukmerge'), ('6.25 12:00', (25.60, 55.55)), ('6.26 08:00', '@dvinsk')],
      S_B, 'high')
route('de.xli_dvina', 'DE', 'de.1pz', 'main', 24, 'XLI 军经拉塞尼艾抵德维纳河',
      [('6.22 03:15', (21.98, 55.18)), ('6.22 20:00', '@taurage'), ('6.26', (23.15, 55.45)), ('6.28', '@panevezys'), ('6.30', '@jekabpils')],
      S_B + ['north_wiki_raseiniai'], 'high')
route('su.raseiniai_counter', 'SU', 'su.2td', 'counter', 16, '苏第 3 机械化军反击',
      [('6.23 06:00', (24.10, 55.12)), ('6.23 18:00', (23.55, 55.30)), ('6.24 12:00', (23.15, 55.40))],
      ['north_wiki_raseiniai', 'glantz_initial'], 'medium')
route('su.21mk_dvinsk', 'SU', 'su.21mk', 'counter', 16, '第 21 机械化军反击桥头堡',
      [('6.27', (27.30, 56.15)), ('6.28 06:00', (26.90, 56.00)), ('6.28 20:00', (26.65, 55.95))],
      ['north_wiki_ru_baltic_op', 'glantz_initial'], 'medium')
route('de.18a_riga', 'DE', 'de.1id', 'main', 22, '第 18 集团军直取里加',
      [('6.22 03:15', (21.85, 55.40)), ('6.25', (22.90, 55.90)), ('6.27', '@siauliai'), ('6.29 12:00', '@jelgava'), ('7.1', '@riga')],
      S_B, 'high')
route('de.xli_ostrov_pskov', 'DE', 'de.1pz', 'main', 22, 'XLI 军突破斯大林防线',
      [('7.2', (26.00, 56.60)), ('7.3', '@gulbene'), ('7.4 18:00', '@ostrov'), ('7.9', '@pskov')],
      S_B, 'high')

# —— 卢加与索利齐 ——
route('de.xli_luga', 'DE', 'de.6pz', 'main', 20, '转向卢加河下游',
      [('7.10', '@pskov'), ('7.12', (28.70, 58.50)), ('7.14 18:00', '@porechye')], S_L, 'high')
route('de.lvi_soltsy', 'DE', 'de.8pz', 'main', 18, 'LVI 军冒进索利齐',
      [('7.9 18:00', (28.95, 57.05)), ('7.11', '@porkhov'), ('7.13', '@soltsy'), ('7.14 12:00', (30.40, 58.15))],
      S_L + ['north_wiki_ru_soltsy'], 'high', until=iso('7.22'))
route('su.soltsy_counter', 'SU', 'su.11a', 'counter', 16, '索利齐反击',
      [('7.14 06:00', (30.35, 58.45)), ('7.15', (30.28, 58.25)), ('7.16', '@soltsy')],
      ['north_wiki_ru_soltsy', 'glantz_leningrad'], 'high')

# —— 爱沙尼亚与塔林 ——
route('de.estonia', 'DE', 'de.xxvi_ak', 'secondary', 18, '割裂爱沙尼亚',
      [('7.3', '@riga'), ('7.8', '@parnu'), ('7.22', (25.50, 58.80)), ('8.4', '@tapa'), ('8.7', '@kunda')],
      S_L + ['north_wiki_ru_8a'], 'medium')
route('su.tallinn_evac', 'SU', 'su.kbf', 'retreat', 12, '塔林撤退',
      [('8.28 21:00', '@tallinn'), ('8.29 06:00', '@juminda'), ('8.29 18:00', '@gogland'), ('8.30 12:00', '@kronstadt')],
      ['north_wiki_ru_leningrad_op', 'glantz_leningrad'], 'high', movement='sea', role='evacuation')

# —— 列宁格勒接近地 ——
route('de.luga_breakout', 'DE', 'de.1pz', 'main', 24, '突破卢加防线',
      [('8.8 09:00', (29.02, 59.16)), ('8.10', (29.15, 59.27)), ('8.16', '@volosovo'), ('8.21', (29.95, 59.48))], S_L, 'high')
route('de.leningrad_assault', 'DE', 'de.xli_mk', 'main', 20, '强攻列宁格勒南郊',
      [('9.9 06:00', (30.00, 59.56)), ('9.11', (30.05, 59.69)), ('9.13', '@krasnoye_selo'), ('9.16', (30.15, 59.80))], S_L, 'high')
route('de.oranienbaum_cut', 'DE', 'de.1id', 'secondary', 14, '抵芬兰湾',
      [('9.8', (29.75, 59.68)), ('9.14', (29.98, 59.80)), ('9.16', '@strelna')], S_L, 'high')
route('de.novgorod', 'DE', 'de.21id', 'main', 18, '希姆斯克突击群',
      [('8.10 04:00', '@shimsk'), ('8.14', (31.00, 58.45)), ('8.16', '@novgorod'), ('8.20', '@chudovo')], S_L, 'high')

# —— 旧鲁萨与杰米扬斯克 ——
route('su.34a_counter', 'SU', 'su.34a', 'counter', 20, '第 34 集团军旧鲁萨反击',
      [('8.12 05:00', (31.80, 57.75)), ('8.13', (31.30, 57.75)), ('8.14', (30.90, 57.85)), ('8.15', (30.75, 57.85))],
      ['north_wiki_ru_34a', 'glantz_leningrad'], 'high', until=iso('8.26'))
route('de.lvi_flank', 'DE', 'de.lvi_mk', 'counter', 18, '曼施坦因侧击',
      [('8.18', (30.10, 57.80)), ('8.19 06:00', (30.50, 57.78)), ('8.20', (30.90, 57.80)), ('8.22', (31.30, 57.80)), ('8.25', (31.55, 57.82))],
      ['north_wiki_ru_34a', 'north_wiki_ru_leningrad_op'], 'high')
route('de.demyansk', 'DE', 'de.ii_ak', 'secondary', 18, '合围杰米扬斯克',
      [('9.1', '@kholm'), ('9.5', (31.90, 57.45)), ('9.8', '@demyansk'), ('9.12', (32.70, 57.20))], S_L, 'medium')

# —— 沃尔霍夫与季赫温 ——
route('de.malaya_vishera', 'DE', 'de.8pz', 'secondary', 16, '攻向小维舍拉',
      [('10.18', (31.95, 59.15)), ('10.21', (32.10, 58.95)), ('10.23 20:00', '@malaya_vishera')],
      ['north_wiki_ru_tikhvin_def'], 'high', until=iso('11.22'))
route('su.52a_counter', 'SU', 'su.52a', 'counter', 16, '收复小维舍拉',
      [('11.12', (32.55, 58.80)), ('11.16', (32.38, 58.83)), ('11.20', '@malaya_vishera')], ['north_wiki_ru_tikhvin_def'], 'high')
route('su.ice_road', 'SU', 'su.f_len', 'secondary', 6, '「生命之路」冰上运输线',
      [('11.22 06:00', '@kobona'), ('11.22 18:00', '@osinovets')], ['glantz_leningrad'], 'high', role='supply')

# —— 芬兰战线 ——
route('fi.ladoga', 'FI', 'fi.1jpr', 'main', 20, '直插拉多加湖',
      [('7.10 02:00', (30.95, 62.10)), ('7.13', (31.30, 61.90)), ('7.16', '@koirinoja'), ('7.21', '@salmi'), ('7.24', '@tuloksa')], S_F, 'high')
route('fi.svir', 'FI', 'fi.vi_ak', 'main', 20, '进抵斯维里河',
      [('9.4 05:00', '@tuloksa'), ('9.5', '@olonets'), ('9.7', (33.50, 60.80)), ('9.22', '@podporozhye')], S_F, 'high')
route('fi.petrozavodsk', 'FI', 'fi.11d', 'secondary', 16, '攻向彼得罗扎沃茨克',
      [('9.4', (32.80, 61.35)), ('9.8', '@pryazha'), ('9.28', (34.25, 61.75)), ('10.1', '@petrozavodsk')], S_F, 'high')
route('fi.isthmus_east', 'FI', 'fi.ii_ak', 'main', 18, '拉多加湖西岸',
      [('7.31 04:00', (29.30, 61.30)), ('8.11', '@hiitola'), ('8.21', '@kexholm'), ('9.7', (30.30, 60.35))], S_F, 'high')
route('fi.vyborg', 'FI', 'fi.iv_ak', 'main', 18, '收复维堡',
      [('8.22 04:00', (28.60, 60.85)), ('8.24', (28.65, 60.62)), ('8.29', '@vyborg'), ('9.2', '@koivisto'), ('9.9', (29.80, 60.20))], S_F, 'high')
route('su.hanko_evac', 'SU', 'su.hanko', 'retreat', 10, '汉科撤离',
      [('12.2 18:00', '@hanko'), ('12.3 12:00', (24.50, 59.75)), ('12.4 06:00', '@gogland'), ('12.5 12:00', '@kronstadt')],
      ['glantz_leningrad'], 'medium', movement='sea', role='evacuation')

# —— 台风行动中的北方部队 ——
route('de.xli_kalinin', 'DE', 'de.1pz', 'main', 18, 'XLI 军冲向加里宁',
      [('10.10', (34.28, 55.83)), ('10.11', (34.59, 56.17)), ('10.13', (35.64, 56.23)), ('10.14 18:00', '@kalinin')],
      ['north_wiki_ru_kalinin_def', 'stahel_typhoon'], 'medium')


def build():
    gaz = load_gaz()
    for r in R:
        for w in r['waypoints']:
            resolve(w['pos'], gaz)
    ids = [r['id'] for r in R]
    assert len(ids) == len(set(ids))
    write('data/routes/north.json', R)


if __name__ == '__main__':
    build()
