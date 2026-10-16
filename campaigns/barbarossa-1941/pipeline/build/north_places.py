"""北方分区地名（只收 core.json 没有的）与来源 → data/gazetteer/north.json、data/sources/north.json
坐标取自 OpenStreetMap Nominatim（2026 年检索，取村镇中心），3 位小数。
"""
from north_lib import write

# id, zh, orig（1941 年官方名）, alt, lon, lat, kind, rank, country
P = [
 # —— 立陶宛 / 拉脱维亚 ——
 ('taurage', '陶拉格', 'Таураге', 'Tauragė / Tauroggen', 22.290, 55.253, 'town', 4, 'SU'),
 ('jurbarkas', '尤尔巴尔卡斯', 'Юрбаркас', 'Jurbarkas / Georgenburg', 22.765, 55.078, 'town', 4, 'SU'),
 ('ariogala', '阿里奥加拉', 'Арёгала', 'Ariogala / Eiragola', 23.483, 55.263, 'crossing', 4, 'SU'),
 ('skaudvile', '斯考德维莱', 'Скаудвиле', 'Skaudvilė', 22.578, 55.408, 'village', 4, 'SU'),
 ('kelme', '凯尔梅', 'Кельме', 'Kelmė / Kelmy', 22.931, 55.629, 'town', 4, 'SU'),
 ('kedainiai', '凯代尼艾', 'Кедайняй', 'Kėdainiai', 23.976, 55.289, 'town', 4, 'SU'),
 ('ukmerge', '乌克梅尔格', 'Укмерге', 'Ukmergė / Wilkomir', 24.760, 55.248, 'town', 4, 'SU'),
 ('panevezys', '帕内韦日斯', 'Паневежис', 'Panevėžys / Ponewesch', 24.358, 55.734, 'town', 3, 'SU'),
 ('plunge', '普伦盖', 'Плунге', 'Plungė', 21.853, 55.914, 'town', 4, 'SU'),
 ('jelgava', '叶尔加瓦', 'Елгава', 'Jelgava / Mitau', 23.729, 56.652, 'town', 3, 'SU'),
 ('liepaja', '利耶帕亚', 'Лиепая', 'Liepāja / Libau', 21.007, 56.505, 'port', 3, 'SU'),
 ('ventspils', '文茨皮尔斯', 'Вентспилс', 'Ventspils / Windau', 21.564, 57.390, 'port', 4, 'SU'),
 ('jekabpils', '叶卡布皮尔斯', 'Екабпилс', 'Jēkabpils / Jakobstadt（对岸克鲁斯特皮尔斯）', 25.869, 56.496, 'crossing', 4, 'SU'),
 ('livani', '利瓦尼', 'Ливаны', 'Līvāni / Lievenhof', 26.178, 56.353, 'town', 4, 'SU'),
 ('rezekne', '雷泽克内', 'Резекне', 'Rēzekne / Rositten', 27.331, 56.506, 'town', 4, 'SU'),
 ('gulbene', '古尔贝内', 'Гулбене', 'Gulbene / Schwanenburg', 26.751, 57.176, 'town', 4, 'SU'),
 ('valga', '瓦尔加', 'Валга', 'Valga / Walk', 26.032, 57.777, 'town', 4, 'SU'),
 # —— 爱沙尼亚 ——
 ('parnu', '派尔努', 'Пярну', 'Pärnu / Pernau', 24.503, 58.387, 'port', 3, 'SU'),
 ('tartu', '塔尔图', 'Тарту', 'Tartu / Dorpat', 26.729, 58.378, 'town', 3, 'SU'),
 ('viljandi', '维尔扬迪', 'Вильянди', 'Viljandi / Fellin', 25.588, 58.365, 'town', 4, 'SU'),
 ('turi', '蒂里', 'Тюри', 'Türi', 25.425, 58.810, 'town', 4, 'SU'),
 ('tapa', '塔帕', 'Тапа', 'Tapa / Taps', 25.963, 59.262, 'town', 4, 'SU'),
 ('rakvere', '拉克韦雷', 'Раквере', 'Rakvere / Wesenberg', 26.362, 59.348, 'town', 4, 'SU'),
 ('kunda', '孔达', 'Кунда', 'Kunda', 26.529, 59.506, 'port', 4, 'SU'),
 ('kuressaare', '库雷萨雷', 'Кингисепп（萨列马岛）', 'Kuressaare / Arensburg（1952 年前苏方称 Kingissepa）', 22.485, 58.253, 'port', 4, 'SU'),
 ('sorve', '瑟尔韦半岛', 'Сырве', 'Sõrve / Sworbe', 22.056, 57.912, 'region', 4, 'SU'),
 ('kardla', '凯尔德拉', 'Кярдла', 'Kärdla（希乌马岛）', 22.748, 58.999, 'town', 4, 'SU'),
 ('juminda', '尤明达角', 'Юминда', 'Juminda（雷区）', 25.508, 59.634, 'region', 4, 'SU'),
 ('gogland', '戈格兰岛', 'Гогланд', 'Suursaari / Hogland', 26.983, 60.058, 'region', 4, 'SU'),
 # —— 列宁格勒州南部 / 普斯科夫 / 诺夫哥罗德 ——
 ('opochka', '奥波奇卡', 'Опочка', 'Opotschka', 28.657, 56.712, 'town', 4, 'SU'),
 ('gdov', '格多夫', 'Гдов', 'Gdow', 27.815, 58.743, 'town', 4, 'SU'),
 ('porkhov', '波尔霍夫', 'Порхов', 'Porchow', 29.559, 57.759, 'town', 4, 'SU'),
 ('dno', '德诺', 'Дно', 'Dno', 29.970, 57.827, 'town', 4, 'SU'),
 ('soltsy', '索利齐', 'Сольцы', 'Solzy', 30.310, 58.119, 'town', 4, 'SU'),
 ('shimsk', '希姆斯克', 'Шимск', 'Schimsk', 30.725, 58.212, 'town', 4, 'SU'),
 ('strugi_krasnye', '斯特鲁吉-克拉斯内', 'Струги Красные', 'Strugi Krasnyje', 29.112, 58.269, 'village', 4, 'SU'),
 ('porechye', '波列奇耶', 'Поречье', 'Poretschje（卢加河桥头堡）', 28.847, 59.267, 'crossing', 4, 'SU'),
 ('bolshoi_sabsk', '大萨布斯克', 'Большой Сабск', 'Bolschoi Sabsk（卢加河桥头堡）', 29.005, 59.137, 'crossing', 4, 'SU'),
 ('volosovo', '沃洛索沃', 'Волосово', 'Wolossowo', 29.493, 59.444, 'village', 4, 'SU'),
 ('krasnogvardeysk', '红卫城', 'Красногвардейск', 'Гатчина / Gatschina', 30.128, 59.568, 'town', 3, 'SU'),
 ('krasnoye_selo', '红村', 'Красное Село', 'Krasnoje Selo', 30.085, 59.735, 'town', 4, 'SU'),
 ('pushkin', '普希金', 'Пушкин', 'Царское Село / Puschkin', 30.400, 59.715, 'town', 4, 'SU'),
 ('kolpino', '科尔皮诺', 'Колпино', 'Kolpino', 30.600, 59.750, 'town', 4, 'SU'),
 ('pulkovo', '普尔科沃高地', 'Пулковские высоты', 'Pulkowo', 30.332, 59.771, 'region', 4, 'SU'),
 ('uritsk', '乌里茨克', 'Урицк', 'Лигово / Ligowo', 30.174, 59.834, 'town', 4, 'SU'),
 ('strelna', '斯特列利纳', 'Стрельна', 'Strelna', 30.058, 59.853, 'village', 4, 'SU'),
 ('peterhof', '彼得霍夫', 'Петергоф', 'Peterhof', 29.908, 59.882, 'town', 4, 'SU'),
 ('ropsha', '罗普沙', 'Ропша', 'Ropscha', 29.868, 59.732, 'village', 4, 'SU'),
 ('koporye', '科波里耶', 'Копорье', 'Koporje', 29.045, 59.704, 'village', 4, 'SU'),
 ('siverskaya', '西韦尔斯卡亚', 'Сиверская', 'Siwerskaja', 30.070, 59.352, 'village', 4, 'SU'),
 ('tosno', '托斯诺', 'Тосно', 'Tossno', 30.877, 59.541, 'town', 4, 'SU'),
 ('lyuban', '留班', 'Любань', 'Ljuban', 31.249, 59.350, 'town', 4, 'SU'),
 ('mga', '姆加', 'Мга', 'Mga', 31.061, 59.757, 'village', 4, 'SU'),
 ('sinyavino', '锡尼亚维诺', 'Синявино', 'Sinjawino', 31.073, 59.908, 'village', 4, 'SU'),
 ('nevsky_pyatachok', '涅瓦河小块地', 'Невский пятачок', 'Московская Дубровка（涅瓦河左岸桥头堡）', 30.950, 59.840, 'crossing', 4, 'SU'),
 ('chudovo', '丘多沃', 'Чудово', 'Tschudowo', 31.667, 59.120, 'town', 4, 'SU'),
 ('kirishi', '基里希', 'Кириши', 'Kirischi', 32.011, 59.450, 'village', 4, 'SU'),
 ('gruzino', '格鲁济诺', 'Грузино', 'Grusino（沃尔霍夫河渡口）', 31.882, 59.148, 'crossing', 4, 'SU'),
 ('malaya_vishera', '小维舍拉', 'Малая Вишера', 'Malaja Wischera', 32.219, 58.844, 'town', 4, 'SU'),
 ('budogoshch', '布多戈希', 'Будогощь', 'Budogoschtsch', 32.445, 59.286, 'village', 4, 'SU'),
 ('voybokalo', '沃伊博卡洛', 'Войбокало', 'Woibokalo', 31.772, 59.884, 'village', 4, 'SU'),
 ('osinovets', '奥西诺韦茨', 'Осиновец', 'Осиновецкий маяк（「生命之路」西岸）', 31.081, 60.119, 'port', 4, 'SU'),
 ('kobona', '科博纳', 'Кобона', 'Kobona（「生命之路」东岸）', 31.773, 60.021, 'port', 4, 'SU'),
 ('valdai', '瓦尔代', 'Валдай', 'Waldai', 33.254, 57.979, 'town', 4, 'SU'),
 ('molvotitsy', '莫尔沃季齐', 'Молвотицы', 'Molwotizy', 32.330, 57.411, 'village', 4, 'SU'),
 ('lychkovo', '雷奇科沃', 'Лычково', 'Lytschkowo', 32.407, 57.918, 'village', 4, 'SU'),
 ('lushno', '卢日诺', 'Лужно', 'Luschno', 32.547, 57.814, 'village', 4, 'SU'),
 ('lyubnitsa', '柳布尼察', 'Любница', 'Ljubniza（第 34 集团军司令部）', 32.694, 57.973, 'village', 4, 'SU'),
 ('ramushevo', '拉穆舍沃', 'Рамушево', 'Ramuschewo（洛瓦季河渡口）', 31.619, 57.833, 'village', 4, 'SU'),
 ('utorgosh', '乌托尔戈什', 'Уторгош', 'Utorgosch', 30.239, 58.277, 'village', 4, 'SU'),
 ('parfino', '帕尔菲诺', 'Парфино', 'Parfino', 31.650, 57.971, 'village', 4, 'SU'),
 # —— 卡累利阿地峡 / 拉多加卡累利阿 / 东卡累利阿 ——
 ('terijoki', '泰里约基', 'Териоки', 'Terijoki / 今泽列诺戈尔斯克', 29.707, 60.197, 'town', 4, 'SU'),
 ('beloostrov', '白岛', 'Белоостров', 'Valkeasaari', 30.014, 60.144, 'village', 4, 'SU'),
 ('kexholm', '凯克斯霍尔姆', 'Кексгольм', 'Käkisalmi / 今普里奥焦尔斯克', 30.125, 61.039, 'town', 4, 'SU'),
 ('hiitola', '希托拉', 'Хийтола', 'Hiitola', 29.693, 61.239, 'village', 4, 'SU'),
 ('lahdenpohja', '拉赫登波赫亚', 'Лахденпохья', 'Lahdenpohja', 30.204, 61.518, 'town', 4, 'SU'),
 ('koivisto', '科伊维斯托', 'Койвисто', 'Koivisto / Björkö', 28.617, 60.367, 'port', 4, 'SU'),
 ('taipale', '泰帕莱', 'Тайпале', 'Taipale', 30.506, 60.627, 'village', 4, 'SU'),
 ('antrea', '安特雷亚', 'Антреа', 'Antrea / 今卡缅诺戈尔斯克', 29.130, 60.953, 'village', 4, 'SU'),
 ('valaam', '瓦拉姆岛', 'Валаам', 'Valamo', 30.959, 61.378, 'region', 4, 'SU'),
 ('vartsila', '韦尔齐莱', 'Värtsilä', 'Вяртсиля', 30.696, 62.176, 'village', 4, 'FI'),
 ('ilomantsi', '伊洛曼齐', 'Ilomantsi', 'Иломантси', 30.932, 62.673, 'village', 4, 'FI'),
 ('lappeenranta', '拉彭兰塔', 'Lappeenranta', 'Villmanstrand', 28.186, 61.058, 'town', 4, 'FI'),
 ('koirinoja', '科伊里诺亚', 'Койриноя', 'Koirinoja', 31.413, 61.651, 'village', 4, 'SU'),
 ('pitkyaranta', '皮特基亚兰塔', 'Питкяранта', 'Pitkäranta', 31.474, 61.572, 'town', 4, 'SU'),
 ('salmi', '萨尔米', 'Салми', 'Salmi', 31.867, 61.369, 'village', 4, 'SU'),
 ('loimola', '洛伊莫拉', 'Лоймола', 'Loimola', 31.740, 61.980, 'village', 4, 'SU'),
 ('suojarvi', '苏奥亚尔维', 'Суоярви', 'Suojärvi', 32.374, 62.089, 'village', 4, 'SU'),
 ('vidlitsa', '维德利察', 'Видлица', 'Vitele', 32.480, 61.344, 'village', 4, 'SU'),
 ('tuloksa', '图洛克萨河', 'Тулокса', 'Tuulos（1941 年 7—9 月芬军前沿）', 32.691, 61.260, 'river', 4, 'SU'),
 ('olonets', '奥洛涅茨', 'Олонец', 'Aunus', 32.975, 60.979, 'town', 4, 'SU'),
 ('svirstroy', '斯维里斯特罗伊', 'Свирьстрой', 'Syväri（斯维里河 2 号水电站）', 33.725, 60.800, 'crossing', 4, 'SU'),
 ('podporozhye', '波德波罗日耶', 'Подпорожье', 'Podporožje', 34.162, 60.914, 'village', 4, 'SU'),
 ('voznesenye', '沃兹涅谢尼耶', 'Вознесенье', 'Voznesenje（斯维里河口）', 35.477, 61.015, 'village', 4, 'SU'),
 ('pryazha', '普里亚扎', 'Пряжа', 'Prääsä', 33.622, 61.693, 'village', 4, 'SU'),
]

S = [
 {'id': 'north_wiki_ru_baltic_op', 'title': 'Прибалтийская стратегическая оборонительная операция（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/Прибалтийская_оборонительная_операция', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_leningrad_op', 'title': 'Ленинградская стратегическая оборонительная операция（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/Ленинградская_стратегическая_оборонительная_операция', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_raseiniai', 'title': 'Battle of Raseiniai（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Battle_of_Raseiniai', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_soltsy', 'title': 'Контрудар под Сольцами（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/Контрудар_под_Сольцами', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_34a', 'title': '34-я армия (СССР)（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/34-я_армия_(СССР)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_8a', 'title': '8-я армия (СССР)（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/8-я_армия_(СССР)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_11a', 'title': '11-я армия (СССР)（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/11-я_армия_(СССР)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_tikhvin_def', 'title': 'Тихвинская оборонительная операция（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/Тихвинская_оборонительная_операция', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_kalinin_def', 'title': 'Калининская оборонительная операция（俄文维基百科）', 'url': 'https://ru.wikipedia.org/wiki/Калининская_оборонительная_операция', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ladoga_karelia', 'title': 'Finnish invasion of Ladoga Karelia（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Finnish_invasion_of_Ladoga_Karelia', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_isthmus_1941', 'title': 'Finnish reconquest of the Karelian Isthmus (1941)（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Finnish_reconquest_of_the_Karelian_Isthmus_(1941)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_east_karelia', 'title': 'Finnish invasion of East Karelia (1941)（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Finnish_invasion_of_East_Karelia_(1941)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_de_pzgr4', 'title': 'Panzergruppe 4（德文维基百科）', 'url': 'https://de.wikipedia.org/wiki/Panzergruppe_4', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_de_divisions', 'title': '德文维基百科德军各师条目（1. / 6. / 8. Panzer-Division、3. Infanterie-Division (mot.) 等）', 'url': 'https://de.wikipedia.org/wiki/1._Panzer-Division_(Wehrmacht)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_ru_divisions', 'title': '俄文维基百科苏军各师、军条目（«…-я стрелковая дивизия»、«…-й механизированный корпус» 等）', 'url': 'https://ru.wikipedia.org/wiki/Список_стрелковых_дивизий_СССР_(1941—1945)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_rumbula', 'title': 'Rumbula massacre（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Rumbula_massacre', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_tallinn_evac', 'title': 'Soviet evacuation of Tallinn（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Soviet_evacuation_of_Tallinn', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_hanko', 'title': 'Battle of Hanko (1941)（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Battle_of_Hanko_(1941)', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_marat', 'title': 'Soviet battleship Marat（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Soviet_battleship_Marat', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_beowulf', 'title': 'Operation Beowulf（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Operation_Beowulf', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_wiki_blue_division', 'title': 'Blue Division（英文维基百科）', 'url': 'https://en.wikipedia.org/wiki/Blue_Division', 'license': 'CC BY-SA 4.0'},
 {'id': 'north_nominatim', 'title': 'OpenStreetMap Nominatim 地名检索（坐标）', 'url': 'https://nominatim.openstreetmap.org/', 'license': 'ODbL 1.0'},
]


def build():
    places = []
    for (i, zh, orig, alt, lon, lat, kind, rank, country) in P:
        p = {'id': i, 'zh': zh, 'orig': orig}
        if alt:
            p['alt'] = alt
        p.update({'pos': [lon, lat], 'kind': kind, 'rank': rank, 'country': country, 'sources': ['north_nominatim']})
        places.append(p)
    ids = [p['id'] for p in places]
    assert len(ids) == len(set(ids)), 'dup place ids'
    write('data/gazetteer/north.json', places)
    write('data/sources/north.json', S)
    return places


if __name__ == '__main__':
    build()
