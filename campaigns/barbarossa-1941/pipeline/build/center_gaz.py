"""中央地段地名（只收 core.json 没有的）与来源。运行：python3 pipeline/build/center_gaz.py"""
from center_lib import write

# id, 中文, 1941 年原名, 别名, lon, lat, kind, rank, country
P = [
    # —— 立陶宛 / 波兰（总督府）/ 白俄罗斯西部 ——
    ('alytus', '阿利图斯', 'Alytus', 'Olita', 24.046, 54.396, 'town', 4, 'SU'),
    ('brest_fortress', '布列斯特要塞', 'Брестская крепость', 'Festung Brest-Litowsk', 23.655, 52.083, 'fort', 4, 'SU'),
    ('kobrin', '科布林', 'Кобрин', 'Kobryn', 24.356, 52.214, 'town', 4, 'SU'),
    ('pruzhany', '普鲁扎内', 'Пружаны', 'Prużana', 24.458, 52.556, 'town', 4, 'SU'),
    ('bereza', '别廖扎', 'Берёза-Картузская', 'Bereza Kartuska', 24.979, 52.537, 'town', 4, 'SU'),
    ('zelva', '泽尔瓦', 'Зельва', 'Zelwa', 24.818, 53.150, 'town', 4, 'SU'),
    ('lida', '利达', 'Лида', 'Lida', 25.285, 53.888, 'town', 3, 'SU'),
    ('stolbtsy', '斯托尔布齐', 'Столбцы', 'Stołpce', 26.744, 53.479, 'town', 4, 'SU'),
    ('dzerzhinsk', '捷尔任斯克', 'Дзержинск', 'Koidanowo', 27.137, 53.683, 'town', 4, 'SU'),
    ('molodechno', '莫洛杰奇诺', 'Молодечно', 'Mołodeczno', 26.865, 54.319, 'town', 4, 'SU'),
    ('oshmyany', '奥什米亚内', 'Ошмяны', 'Oszmiana', 25.936, 54.425, 'town', 4, 'SU'),
    ('radoshkovichi', '拉多什科维奇', 'Радошковичи', 'Radoszkowice', 27.243, 54.154, 'town', 4, 'SU'),
    ('smolevichi', '斯莫列维奇', 'Смолевичи', '', 28.088, 54.030, 'town', 4, 'SU'),
    ('krupki', '克鲁普基', 'Крупки', '', 29.137, 54.320, 'town', 4, 'SU'),
    ('tolochin', '托洛钦', 'Толочин', '', 29.696, 54.411, 'town', 4, 'SU'),
    ('senno', '先诺', 'Сенно', 'Sienno', 29.708, 54.811, 'town', 4, 'SU'),
    ('beshenkovichi', '别申科维奇', 'Бешенковичи', '', 29.457, 55.046, 'town', 4, 'SU'),
    ('ulla', '乌拉', 'Улла', '', 29.257, 55.226, 'crossing', 4, 'SU'),
    ('disna', '季斯纳', 'Дисна', 'Dzisna', 28.215, 55.567, 'town', 4, 'SU'),
    ('gorodok', '戈罗多克', 'Городок', '', 29.993, 55.463, 'town', 4, 'SU'),
    ('surazh', '苏拉日', 'Сураж', '', 30.723, 55.419, 'town', 4, 'SU'),
    ('shklov', '什克洛夫', 'Шклов', '', 30.287, 54.214, 'crossing', 4, 'SU'),
    ('kopys', '科佩斯', 'Копысь', '', 30.293, 54.315, 'crossing', 4, 'SU'),
    ('bykhov', '贝霍夫', 'Быхов', 'Старый Быхов', 30.246, 53.520, 'crossing', 4, 'SU'),
    ('rogachev', '罗加乔夫', 'Рогачёв', '', 30.049, 53.092, 'town', 3, 'SU'),
    ('zhlobin', '日洛宾', 'Жлобин', '', 30.024, 52.892, 'town', 4, 'SU'),
    ('propoisk', '普罗波伊斯克', 'Пропойск', 'Славгород', 31.000, 53.442, 'town', 4, 'SU'),
    ('krichev', '克里切夫', 'Кричев', '', 31.715, 53.712, 'town', 4, 'SU'),
    ('gorki', '戈尔基', 'Горки', '', 30.986, 54.284, 'town', 4, 'SU'),
    # —— 斯摩棱斯克方向 ——
    ('velizh', '韦利日', 'Велиж', '', 31.193, 55.605, 'town', 4, 'SU'),
    ('demidov', '杰米多夫', 'Демидов', '', 31.512, 55.267, 'town', 4, 'SU'),
    ('dukhovshchina', '杜霍夫希纳', 'Духовщина', '', 32.415, 55.196, 'town', 4, 'SU'),
    ('yartsevo', '亚尔采沃', 'Ярцево', '', 32.692, 55.067, 'town', 3, 'SU'),
    ('solovyevo', '索洛维约沃渡口', 'Соловьёвская переправа', '', 32.745, 54.935, 'crossing', 4, 'SU'),
    ('krasny', '克拉斯内', 'Красный', '', 31.426, 54.561, 'town', 4, 'SU'),
    ('pochinok', '波奇诺克', 'Починок', '', 32.440, 54.406, 'town', 4, 'SU'),
    ('dorogobuzh', '多罗戈布日', 'Дорогобуж', '', 33.302, 54.914, 'town', 4, 'SU'),
    ('bely', '别雷', 'Белый', '', 32.938, 55.836, 'town', 4, 'SU'),
    ('kholm_zhirkovsky', '霍尔姆-日尔科夫斯基', 'Холм-Жирковский', '', 33.490, 55.503, 'village', 4, 'SU'),
    ('sychevka', '瑟乔夫卡', 'Сычёвка', '', 34.278, 55.830, 'town', 4, 'SU'),
    ('spas_demensk', '斯帕斯-杰缅斯克', 'Спас-Деменск', '', 34.017, 54.409, 'town', 4, 'SU'),
    ('kirov_kaluga', '基洛夫', 'Киров', 'Песочня', 34.305, 54.085, 'town', 4, 'SU'),
    ('mosalsk', '莫萨利斯克', 'Мосальск', '', 34.985, 54.492, 'town', 4, 'SU'),
    ('yukhnov', '尤赫诺夫', 'Юхнов', '', 35.233, 54.744, 'town', 4, 'SU'),
    ('medyn', '梅登', 'Медынь', '', 35.858, 54.969, 'town', 4, 'SU'),
    ('gzhatsk', '格扎茨克', 'Гжатск', '', 35.005, 55.553, 'town', 4, 'SU'),
    ('borodino', '博罗季诺', 'Бородино', '', 35.823, 55.522, 'village', 4, 'SU'),
    # —— 加里宁 / 莫斯科西北 ——
    ('andreapol', '安德烈亚波尔', 'Андреаполь', '', 32.262, 56.651, 'town', 4, 'SU'),
    ('ostashkov', '奥斯塔什科夫', 'Осташков', '', 33.105, 57.149, 'town', 4, 'SU'),
    ('selizharovo', '谢利扎罗沃', 'Селижарово', '', 33.451, 56.855, 'town', 4, 'SU'),
    ('staritsa', '斯塔里察', 'Старица', '', 34.934, 56.508, 'town', 4, 'SU'),
    ('zubtsov', '祖布佐夫', 'Зубцов', '', 34.584, 56.174, 'town', 4, 'SU'),
    ('torzhok', '托尔若克', 'Торжок', '', 34.979, 57.029, 'town', 4, 'SU'),
    ('lotoshino', '洛托希诺', 'Лотошино', '', 35.644, 56.231, 'village', 4, 'SU'),
    ('solnechnogorsk', '索尔涅奇诺戈尔斯克', 'Солнечногорск', '', 36.981, 56.181, 'town', 4, 'SU'),
    ('istra', '伊斯特拉', 'Истра', '', 36.860, 55.917, 'town', 4, 'SU'),
    ('kryukovo', '克留科沃', 'Крюково', '', 37.180, 55.980, 'village', 4, 'SU'),
    ('krasnaya_polyana', '红波利亚纳', 'Красная Поляна', '', 37.468, 55.993, 'village', 4, 'SU'),
    ('yakhroma', '亚赫罗马', 'Яхрома', '', 37.484, 56.289, 'town', 4, 'SU'),
    ('dmitrov', '德米特罗夫', 'Дмитров', '', 37.520, 56.344, 'town', 4, 'SU'),
    ('khimki', '希姆基', 'Химки', '', 37.445, 55.889, 'town', 4, 'SU'),
    ('zvenigorod', '兹韦尼哥罗德', 'Звенигород', '', 36.855, 55.729, 'town', 4, 'SU'),
    ('ruza', '鲁扎', 'Руза', '', 36.195, 55.701, 'town', 4, 'SU'),
    ('kubinka', '库宾卡', 'Кубинка', '', 36.700, 55.580, 'village', 4, 'SU'),
    ('naro_fominsk', '纳罗-福明斯克', 'Наро-Фоминск', '', 36.734, 55.386, 'town', 4, 'SU'),
    ('borovsk', '博罗夫斯克', 'Боровск', '', 36.486, 55.207, 'town', 4, 'SU'),
    ('vereya', '韦列亚', 'Верея', '', 36.186, 55.343, 'town', 4, 'SU'),
    ('maloyaroslavets', '小雅罗斯拉韦茨', 'Малоярославец', '', 36.462, 55.011, 'town', 4, 'SU'),
    ('podolsk', '波多利斯克', 'Подольск', '', 37.530, 55.380, 'town', 4, 'SU'),
    ('serpukhov', '谢尔普霍夫', 'Серпухов', '', 37.430, 54.930, 'town', 3, 'SU'),
    ('tarusa', '塔鲁萨', 'Таруса', '', 37.179, 54.723, 'town', 4, 'SU'),
    ('aleksin', '阿列克辛', 'Алексин', '', 37.094, 54.514, 'town', 4, 'SU'),
    ('kolomna', '科洛姆纳', 'Коломна', '', 38.785, 55.080, 'town', 4, 'SU'),
    ('ryazan', '梁赞', 'Рязань', '', 39.720, 54.620, 'city', 3, 'SU'),
    # —— 图拉 / 奥廖尔 / 布良斯克 ——
    ('kashira', '卡希拉', 'Кашира', '', 38.152, 54.834, 'town', 4, 'SU'),
    ('venev', '韦尼奥夫', 'Венёв', '', 38.267, 54.354, 'town', 4, 'SU'),
    ('mikhailov', '米哈伊洛夫', 'Михайлов', '', 39.031, 54.231, 'town', 4, 'SU'),
    ('stalinogorsk', '斯大林诺戈尔斯克', 'Сталиногорск', 'Новомосковск', 38.289, 54.011, 'town', 4, 'SU'),
    ('yasnaya_polyana', '亚斯纳亚波良纳', 'Ясная Поляна', '', 37.527, 54.073, 'village', 4, 'SU'),
    ('plavsk', '普拉夫斯克', 'Плавск', '', 37.290, 53.708, 'town', 4, 'SU'),
    ('chern', '切尔恩', 'Чернь', '', 36.912, 53.452, 'village', 4, 'SU'),
    ('mtsensk', '姆岑斯克', 'Мценск', '', 36.547, 53.265, 'town', 4, 'SU'),
    ('bolkhov', '博尔霍夫', 'Болхов', '', 36.003, 53.443, 'town', 4, 'SU'),
    ('belyov', '别廖夫', 'Белёв', '', 36.135, 53.810, 'town', 4, 'SU'),
    ('kozelsk', '科泽利斯克', 'Козельск', '', 35.783, 54.035, 'town', 4, 'SU'),
    ('sukhinichi', '苏希尼奇', 'Сухиничи', '', 35.343, 54.103, 'town', 4, 'SU'),
    ('yefremov', '叶夫列莫夫', 'Ефремов', '', 38.122, 53.149, 'town', 4, 'SU'),
    ('yelets', '叶列茨', 'Елец', '', 38.500, 52.600, 'town', 3, 'SU'),
    ('karachev', '卡拉切夫', 'Карачев', '', 34.985, 53.122, 'town', 4, 'SU'),
    ('kromy', '克罗梅', 'Кромы', '', 35.794, 52.689, 'village', 4, 'SU'),
    ('dmitrovsk', '德米特罗夫斯克', 'Дмитровск-Орловский', '', 35.143, 52.505, 'town', 4, 'SU'),
    ('sevsk', '谢夫斯克', 'Севск', '', 34.493, 52.150, 'town', 4, 'SU'),
    ('trubchevsk', '特鲁布切夫斯克', 'Трубчевск', '', 33.766, 52.578, 'town', 4, 'SU'),
    ('pochep', '波切普', 'Почеп', '', 33.450, 52.928, 'town', 4, 'SU'),
    ('unecha', '乌涅恰', 'Унеча', '', 32.677, 52.846, 'town', 4, 'SU'),
    ('starodub', '斯塔罗杜布', 'Стародуб', '', 32.760, 52.584, 'town', 4, 'SU'),
    # —— 德斯纳河—罗姆内 ——
    ('novgorod_seversky', '诺夫哥罗德-谢韦尔斯基', 'Новгород-Северский', '', 33.263, 51.985, 'crossing', 4, 'SU'),
    ('shostka', '绍斯特卡', 'Шостка', '', 33.480, 51.873, 'town', 4, 'SU'),
    ('glukhov', '格卢霍夫', 'Глухов', '', 33.908, 51.678, 'town', 4, 'SU'),
    ('bakhmach', '巴赫马奇', 'Бахмач', '', 32.821, 51.184, 'town', 4, 'SU'),
    ('romny', '罗姆内', 'Ромны', '', 33.475, 50.751, 'town', 4, 'SU'),
]

places = []
for pid, zh, orig, alt, lon, lat, kind, rank, country in P:
    p = {'id': pid, 'zh': zh, 'orig': orig}
    if alt:
        p['alt'] = alt
    p.update({'pos': [lon, lat], 'kind': kind, 'rank': rank, 'country': country})
    places.append(p)

S = [
    ('center_guderian', 'Erinnerungen eines Soldaten', 'Heinz Guderian', 1951, None),
    ('center_bock_ktb', 'Zwischen Pflicht und Verweigerung: Das Kriegstagebuch', 'Fedor von Bock（Klaus Gerbet 编）', 1995, None),
    ('center_hoth', 'Panzer-Operationen: Die Panzergruppe 3 und der operative Gedanke der deutschen Führung, Sommer 1941', 'Hermann Hoth', 1956, None),
    ('center_haupt', 'Heeresgruppe Mitte 1941–1945', 'Werner Haupt', 1968, None),
    ('center_zhukov', 'Воспоминания и размышления', 'Г. К. Жуков', 1969, 'http://militera.lib.ru/memo/russian/zhukov1/index.html'),
    ('center_rokossovsky', 'Солдатский долг', 'К. К. Рокоссовский', 1968, 'http://militera.lib.ru/memo/russian/rokossovsky/index.html'),
    ('center_sandalov', 'Пережитое / Боевые действия войск 4-й армии в начальный период Великой Отечественной войны', 'Л. М. Сандалов', 1961, 'http://militera.lib.ru/memo/russian/sandalov1/index.html'),
    ('center_boldin', 'Страницы жизни', 'И. В. Болдин', 1961, 'http://militera.lib.ru/memo/russian/boldin/index.html'),
    ('center_eremenko', 'В начале войны', 'А. И. Ерёменко', 1964, 'http://militera.lib.ru/memo/russian/eremenko_ai2/index.html'),
    ('center_lelyushenko', 'Москва — Сталинград — Берлин — Прага', 'Д. Д. Лелюшенко', 1970, 'http://militera.lib.ru/memo/russian/lelyushenko/index.html'),
    ('center_katukov', 'На острие главного удара', 'М. Е. Катуков', 1974, 'http://militera.lib.ru/memo/russian/katukov/index.html'),
    ('center_belov', 'За нами Москва', 'П. А. Белов', 1963, 'http://militera.lib.ru/memo/russian/belov_pa/index.html'),
    ('center_isaev_kotly', 'Котлы 41-го. История ВОВ, которую мы не знали', 'А. В. Исаев', 2005, None),
    ('center_lopukhovsky', 'Вяземская катастрофа 41-го года', 'Л. Н. Лопуховский', 2006, None),
    ('center_shaposhnikov_moscow', 'Битва за Москву: Московская операция Западного фронта 16 ноября 1941 г. – 31 января 1942 г.', 'Под ред. Б. М. Шапошникова', 1943, 'http://militera.lib.ru/h/moscow_battle/index.html'),
    ('center_wiki_bialystok', 'Kesselschlacht bei Białystok und Minsk（德文维基百科）', None, None, 'https://de.wikipedia.org/wiki/Kesselschlacht_bei_Białystok_und_Minsk'),
    ('center_wiki_brest', 'Defense of Brest Fortress / Оборона Брестской крепости（英、俄文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Defense_of_Brest_Fortress'),
    ('center_wiki_lepel', 'Лепельский контрудар（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Лепельский_контрудар'),
    ('center_wiki_mogilev', 'Оборона Могилёва（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Оборона_Могилёва'),
    ('center_wiki_smolensk', 'Battle of Smolensk (1941)（英文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Battle_of_Smolensk_(1941)'),
    ('center_wiki_yelnya', 'Yelnya offensive / Ельнинская операция（英、俄文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Yelnya_offensive'),
    ('center_wiki_rogachev', 'Рогачёвско-Жлобинская операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Рогачёвско-Жлобинская_операция'),
    ('center_wiki_kiev', 'Battle of Kiev (1941)（英文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Battle_of_Kiev_(1941)'),
    ('center_wiki_typhoon', 'Battle of Moscow / Operation Typhoon（英文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Battle_of_Moscow'),
    ('center_wiki_vyazma', 'Вяземская операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Вяземская_операция'),
    ('center_wiki_bryansk', 'Орловско-Брянская оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Орловско-Брянская_оборонительная_операция'),
    ('center_wiki_mtsensk', 'Battle of Mtsensk（英文维基百科）', None, None, 'https://en.wikipedia.org/wiki/Battle_of_Mtsensk'),
    ('center_wiki_tula', 'Тульская оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Тульская_оборонительная_операция'),
    ('center_wiki_kalinin', 'Калининская оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Калининская_оборонительная_операция'),
    ('center_wiki_klin', 'Клинско-Солнечногорская оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Клинско-Солнечногорская_оборонительная_операция'),
    ('center_wiki_mozhaisk', 'Можайско-Малоярославецкая оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Можайско-Малоярославецкая_оборонительная_операция'),
    ('center_wiki_tikhvin', 'Тихвинская оборонительная операция（俄文维基百科）', None, None, 'https://ru.wikipedia.org/wiki/Тихвинская_оборонительная_операция'),
    ('center_wiki_18idmot', '18. Infanterie-Division (Wehrmacht)（德文维基百科）', None, None, 'https://de.wikipedia.org/wiki/18._Infanterie-Division_(Wehrmacht)'),
]
sources = []
for sid, title, author, year, url in S:
    s = {'id': sid, 'title': title}
    if author:
        s['author'] = author
    if year:
        s['year'] = year
    if url:
        s['url'] = url
    sources.append(s)

if __name__ == '__main__':
    ids = [p['id'] for p in places]
    assert len(ids) == len(set(ids)), 'dup place id'
    write('data/gazetteer/center.json', places)
    write('data/sources/center.json', sources)
