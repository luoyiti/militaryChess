"""参考数据：data/sources、data/gazetteer、data/fronts、data/overlays.json、data/equipment.json、data/forces.json。
来源表汇总自 docs/research/*.md 的来源节。运行：python3 campaigns/river-plate-1939/pipeline/build/reference.py"""
import json, os, glob, math
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
def dump(p, obj):
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, indent=1); f.write('\n')

# ---------- 来源 ----------
S = [
 ('harwood_despatch', 'The River Plate Battle（哈伍德致海军部战报，1939-12-30；London Gazette 增刊第 37989 号）', 'Rear-Admiral Sir Henry Harwood', 1947, 'https://www.naval-history.net/WW2LGGrafSpee.htm'),
 ('admiralty_1940', 'The Battle of the River Plate: An Account of Events before, during and after the Action（附 N.I.D. 航迹图）', 'Admiralty / HMSO', 1940, 'https://archive.org/details/battleriverplate'),
 ('admiralty_track_chart', 'Action between H.M. Ships Ajax, Exeter and Achilles and Admiral Graf Spee, 13th December 1939（N.I.D. 航迹图）', 'Naval Intelligence Division', 1940, 'https://archive.org/details/battleriverplate'),
 ('waters_1956', 'The Royal New Zealand Navy, ch. 4 “The Battle of the River Plate”（新西兰官方二战史）', 'S. D. Waters', 1956, 'http://nzetc.victoria.ac.nz/tm/scholarly/tei-WH2Navy-c4.html'),
 ('atwill_1977', 'HMS Exeter at the Battle of River Plate（Naval Historical Review）', 'Lt R. Atwill DSM RN', 1977, 'https://www.navyhistory.org.au/hms-exeter-at-the-battle-of-river-plate/'),
 ('cussen_diary', 'Excerpts from the Diary of Surgeon Commander Jack Cussen RN, PMO of HMS Exeter（JMVH 27/3）', 'J. Cussen / S. G. Bennett', 2019, 'https://www.jmvh.org/article/the-battle-of-the-river-plate-excerpts-from-the-diary-of-surgeon-commander-jack-cussen-rn-pmo-of-hms-exeter'),
 ('kaack_2010', 'Führungsentscheidung in einer Grenzsituation: KzS Langsdorff vor und in Montevideo 1939', 'H.-J. Kaack', 2010, 'http://www.mkbug.de/vortrag.pdf'),
 ('usni_cambareri_1983', 'Scuttle the Graf Spee!（USNI Proceedings 109/6）', 'C. S. Cambareri', 1983, 'https://www.usni.org/magazines/proceedings/1983/june/scuttle-graf-spee'),
 ('roskill_1954', 'The War at Sea 1939–1945, vol. I: The Defensive（第 6–7 章，表 6 猎杀群）', 'S. W. Roskill', 1954, 'https://archive.org/details/worldat-sea-1939-1945-vol-1'),
 ('bs26', 'Battle Summary No. 26: Action with the German Pocket Battleship Admiral Graf Spee（经 uboat.net 转引）', 'Admiralty Naval Staff History', 1946, 'https://uboat.net/allies/warships/ship/1175.html'),
 ('ktb_skl', 'War Diary of the German Naval Staff, Operations Division, Part A, vols. 1–4（1939 年 8–12 月，ONI 译本）', 'Seekriegsleitung', 1946, 'https://archive.org/details/wardiarygermanna11939germ'),
 ('fuehrer_conf_161239', 'Report of the C-in-C, Navy, to the Fuehrer, 16 December 1939, 1300（Fuehrer Conferences on Naval Affairs）', 'ONI / Brassey’s', 1948, 'https://kbismarck.com/fuhrer-conference-16-12-39.html'),
 ('frus_1939_v5', 'Foreign Relations of the United States, 1939, vol. V: The American Republics（第 7 章，文件 118–169）', 'U.S. Department of State', 1957, 'https://history.state.gov/historicaldocuments/frus1939v05/d121'),
 ('naval_history_net', 'Naval Events, September–December 1939（逐日）', 'Gordon Smith / Don Kindell', None, 'https://www.naval-history.net/xDKWW2-3912-09DEC01.htm'),
 ('nh_kindell_1939_12', 'Naval Events, December 1939, Part 1–2', 'Don Kindell', None, 'https://naval-history.net/xDKWW2-3912-09DEC02.htm'),
 ('nh_kindell_casualties', 'Royal Navy casualties and honours, River Plate（含沃什伯恩、卡梅伦嘉奖词）', 'Don Kindell / naval-history.net', None, 'https://www.naval-history.net/WW2LGGrafSpee.htm'),
 ('gazette_34815', 'London Gazette 34815 / 34857：商船船长与报务员嘉奖词（多里克之星号、泰罗阿号、猎人号、特雷瓦尼恩号）', 'London Gazette', 1940, 'https://www.naval-history.net/WW2LGGrafSpee.htm'),
 ('uboat_net_renown', 'HMS Renown / Ark Royal / Cumberland 事件记录（据航海日志）', 'uboat.net', None, 'https://uboat.net/allies/warships/ship/4066.html'),
 ('navweaps_rp', 'Orders of Battle – Battle of the River Plate', 'NavWeaps', 2017, 'https://navweaps.com/index_oob/OOB_WWII_Atlantic/OOB_WWII_River-Plate.php'),
 ('navweaps_28cm', 'Germany 28 cm/52 (11") SK C/28', 'NavWeaps (T. DiGiulian)', None, 'https://www.navweaps.com/Weapons/WNGER_11-52_skc28.php'),
 ('navweaps_8in', 'Britain 8"/50 (20.3 cm) BL Mark VIII', 'NavWeaps', None, 'https://www.navweaps.com/Weapons/WNBR_8-50_mk8.php'),
 ('navweaps_6in', 'Britain 6"/50 (15.2 cm) BL Mark XXIII', 'NavWeaps', None, 'https://www.navweaps.com/Weapons/WNBR_6-50_mk23.php'),
 ('hmsajax_org', 'The Battle of the River Plate; Altmark; Cumberland（老兵协会网站）', 'HMS Ajax & River Plate Veterans Association', None, 'https://hmsajax.org/the-battle-of-the-river-plate'),
 ('hmsajax_langsdorff', 'Kapitän zur See Hans Langsdorff', 'HMS Ajax & River Plate Veterans Association', 2019, 'https://www.hmsajax.org/captain-hans-langsdorff'),
 ('faaoa_lewin', 'On this day 13 December 1939（Ajax 的 Seafox 机组）', 'Fleet Air Arm Officers’ Association', None, 'https://www.fleetairarmoa.org/news/on-this-day-13-december-1939'),
 ('nzhistory_battle', 'Battle of the River Plate – The battle', 'NZ History, Manatū Taonga', 2022, 'https://nzhistory.govt.nz/war/battle-of-river-plate/the-battle'),
 ('avalanche_werbaneth', 'The Voyage of the Graf Spee, Part 2', 'J. P. Werbaneth', 2021, 'https://www.avalanchepress.com/graf_spee_2.php'),
 ('el_observador_2019', 'El Graf Spee en la trampa de Montevideo', 'El Observador (Montevideo)', 2019, 'https://www.elobservador.com.uy/nota/el-graf-spee-en-la-trampa-de-montevideo-201912231730'),
 ('time_1940', 'World War: Voluntary Elimination', 'Time', 1940, 'https://time.com/archive/6762642/world-war-voluntary-elimination/'),
 ('iln_1939', 'Illustrated London News, 30 December 1939', 'Illustrated London News', 1939, 'https://images.ourontario.ca/ajax/2305394/page/3'),
 ('gub_uy_archivo', 'Archivo Acorazado Admiral Graf von Spee / Vapor Tacoma（档案目录）', 'Ministerio de Educación y Cultura, Uruguay', 2025, 'https://www.gub.uy/ministerio-educacion-cultura/'),
 ('maritimequest', 'Admiral Graf Spee 与被击沉商船各页（Clement、Newton Beech、Ashlea、Huntsman、Trevanion、Streonshalh）', 'MaritimeQuest', 2008, 'https://www.maritimequest.com/'),
 ('tzdb_southamerica', 'tz database: southamerica（乌拉圭、阿根廷 1939 年夏令时）', 'IANA', None, 'https://github.com/eggert/tz/blob/main/southamerica'),
 ('wiki_en_river_plate', 'Battle of the River Plate', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Battle_of_the_River_Plate'),
 ('wiki_de_river_plate', 'Gefecht vor dem Río de la Plata', 'Wikipedia (de)', None, 'https://de.wikipedia.org/wiki/Seeschlacht_vor_dem_R%C3%ADo_de_la_Plata'),
 ('wiki_en_graf_spee', 'German cruiser Admiral Graf Spee', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/German_cruiser_Admiral_Graf_Spee'),
 ('wiki_de_graf_spee', 'Admiral Graf Spee', 'Wikipedia (de)', None, 'https://de.wikipedia.org/wiki/Admiral_Graf_Spee'),
 ('wiki_de_ags', 'Admiral Graf Spee（引 ADAP D VIII 朗曼电报）', 'Wikipedia (de)', None, 'https://de.wikipedia.org/wiki/Admiral_Graf_Spee'),
 ('wiki_en_langsdorff', 'Hans Langsdorff', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Hans_Langsdorff'),
 ('wiki_en_altmark', 'German tanker Altmark', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/German_tanker_Altmark'),
 ('wiki_de_altmark', 'Altmark (Schiff, 1938)', 'Wikipedia (de)', None, 'https://de.wikipedia.org/wiki/Altmark_(Schiff,_1938)'),
 ('wiki_en_exeter', 'HMS Exeter (68)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Exeter_(68)'),
 ('wiki_en_ajax', 'HMS Ajax (22)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Ajax_(22)'),
 ('wiki_en_achilles', 'HMS Achilles (70)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Achilles_(70)'),
 ('wiki_en_cumberland', 'HMS Cumberland (57)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Cumberland_(57)'),
 ('wiki_en_renown', 'HMS Renown (1916)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Renown_(1916)'),
 ('wiki_en_ark_royal', 'HMS Ark Royal (91)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Ark_Royal_(91)'),
 ('wiki_en_dorsetshire', 'HMS Dorsetshire (40)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Dorsetshire_(40)'),
 ('wiki_en_shropshire', 'HMS Shropshire (73)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/HMS_Shropshire_(73)'),
 ('wiki_en_seafox', 'Fairey Seafox', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Fairey_Seafox'),
 ('wiki_en_ar196', 'Arado Ar 196', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Arado_Ar_196'),
 ('wiki_en_walrus', 'Supermarine Walrus', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Supermarine_Walrus'),
 ('wiki_en_clement', 'SS Clement', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/SS_Clement'),
 ('wiki_en_africa_shell', 'MV Africa Shell', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/MV_Africa_Shell'),
 ('wiki_en_doric_star', 'MV Doric Star', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/MV_Doric_Star'),
 ('wiki_en_tairoa', 'SS Tairoa', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/SS_Tairoa'),
 ('wiki_en_dove', 'Patrick Dove (sea captain)', 'Wikipedia', None, 'https://en.wikipedia.org/wiki/Patrick_Dove_(sea_captain)'),
 ('panama_declaration', 'Declaration of Panama, 3 October 1939（美洲中立安全区界线）', 'Meeting of the Foreign Ministers of the American Republics', 1939, 'https://history.state.gov/historicaldocuments/frus1939v05/d60'),
 ('natural_earth', 'Natural Earth 1:10m 海岸线与陆地', 'Natural Earth', None, 'https://www.naturalearthdata.com/'),
]
sources = []
for id, title, author, year, url in S:
    s = {'id': id, 'title': title}
    if author: s['author'] = author
    if year: s['year'] = year
    if url: s['url'] = url
    sources.append(s)
for f in glob.glob(P('data/sources/*.json')): os.remove(f)
dump(P('data/sources/main.json'), sources)

# ---------- 地名 ----------
G = [
 ('montevideo', '蒙得维的亚', 'Montevideo', [-56.19, -34.905], 'capital', 1, 'UY'),
 ('buenos_aires', '布宜诺斯艾利斯', 'Buenos Aires', [-58.38, -34.6], 'capital', 1, 'AR'),
 ('rio', '里约热内卢', 'Rio de Janeiro', [-43.17, -22.91], 'capital', 1, 'BR'),
 ('recife', '伯南布哥（累西腓）', 'Pernambuco (Recife)', [-34.88, -8.05], 'port', 2, 'BR'),
 ('bahia', '巴伊亚', 'Bahia (Salvador)', [-38.5, -12.97], 'port', 3, 'BR'),
 ('santos', '桑托斯', 'Santos', [-46.33, -23.96], 'port', 3, 'BR'),
 ('freetown', '弗里敦', 'Freetown', [-13.23, 8.48], 'port', 2, 'GB'),
 ('dakar', '达喀尔', 'Dakar', [-17.44, 14.69], 'port', 2, 'FR'),
 ('cape_town', '开普敦', 'Cape Town', [18.42, -33.92], 'port', 2, 'ZA'),
 ('simonstown', '西蒙斯敦', 'Simon’s Town', [18.43, -34.19], 'port', 3, 'ZA'),
 ('durban', '德班', 'Durban', [31.03, -29.86], 'port', 3, 'ZA'),
 ('lourenco_marques', '洛伦索马贵斯', 'Lourenço Marques', [32.57, -25.97], 'port', 3, 'PT'),
 ('zavora', '扎沃拉角', 'Ponta da Zavora', [35.52, -24.52], 'region', 4, 'PT'),
 ('port_stanley', '斯坦利港', 'Port Stanley', [-57.85, -51.69], 'port', 2, 'GB'),
 ('st_helena', '圣赫勒拿岛', 'St Helena (Jamestown)', [-5.72, -15.92], 'port', 3, 'GB'),
 ('tristan', '特里斯坦—达库尼亚', 'Tristan da Cunha', [-12.28, -37.11], 'region', 3, 'GB'),
 ('ascension', '阿森松岛', 'Ascension Island', [-14.36, -7.95], 'region', 4, 'GB'),
 ('st_paul_rocks', '圣保罗岩', 'St Peter and St Paul Rocks', [-29.35, 0.92], 'region', 4, 'BR'),
 ('punta_del_este', '埃斯特角', 'Punta del Este', [-54.95, -34.97], 'town', 3, 'UY'),
 ('cabo_santa_maria', '圣玛丽亚角', 'Cabo Santa María', [-54.15, -34.67], 'region', 4, 'UY'),
 ('lobos', '洛沃斯岛', 'Isla de Lobos', [-54.88, -35.03], 'region', 4, 'UY'),
 ('punta_negra', '黑角', 'Punta Negra', [-55.23, -34.9], 'region', 4, 'UY'),
 ('english_bank', '英格利希浅滩', 'English Bank (Banco Inglés)', [-55.95, -35.18], 'region', 4, None),
 ('whistle_buoy', '惠斯尔浮标', 'Whistle Buoy', [-56.235, -34.98], 'region', 4, None),
 ('cabo_san_antonio', '圣安东尼奥角', 'Cabo San Antonio', [-56.68, -36.31], 'region', 4, 'AR'),
 ('wreck', '施佩伯爵号残骸', 'Wreck of Admiral Graf Spee', [-56.2983, -34.9717], 'region', 4, 'UY'),
]
places = []
for id, zh, orig, pos, kind, rank, country in G:
    p = {'id': id, 'zh': zh, 'orig': orig, 'pos': pos, 'kind': kind, 'rank': rank}
    if country: p['country'] = country
    p['sources'] = ['natural_earth'] if kind in ('capital', 'port', 'town') else ['harwood_despatch'] if id in ('english_bank', 'whistle_buoy', 'cabo_santa_maria', 'lobos', 'punta_negra', 'cabo_san_antonio') else ['wiki_en_graf_spee']
    p['confidence'] = 'high' if kind in ('capital', 'port', 'town') else 'medium'
    places.append(p)
dump(P('data/gazetteer/places.json'), places)

# ---------- 控制区关键帧（英方研判的袭击舰活动海域 / 猎杀群警戒海域） ----------
def circle(lon, lat, rkm, n=28):
    k = rkm / 111.32
    return [[round(lon + k * math.cos(2 * math.pi * i / n) / math.cos(math.radians(lat)), 3), round(lat + k * math.sin(2 * math.pi * i / n), 3)] for i in range(n)]
C = lambda *a: [circle(*a)]
G_COAST = [[[-57.5, -38.5], [-53.0, -39.0], [-44.0, -31.0], [-38.5, -24.5], [-39.5, -20.5], [-42.5, -21.5], [-48.0, -25.8], [-54.0, -33.5], [-57.8, -35.0]]]
PLATE = [[[-55.3, -34.95], [-54.4, -35.3], [-55.0, -36.6], [-56.5, -36.6], [-56.6, -35.9], [-56.05, -35.25]]]
K = lambda *a: C(*a)
frames = [
 ('1939-09-26T00:00', {}, None, '开战三周，英国人尚不知道南大西洋里有一艘袖珍战列舰。', ['roskill_1954'], 'high'),
 ('1939-09-30T16:00', {'raider': [C(-33.5, -9.5, 650)]}, 'step', '克莱门特号在伯南布哥外被击沉：袭击舰出现在巴西航线上（英方一度以为是舍尔海军上将号）。', ['roskill_1954', 'wiki_en_clement'], 'medium'),
 ('1939-10-05T12:00', {'raider': [C(-28.0, -11.0, 1300)], 'hunt': [G_COAST, K(-26.0, -3.0, 850), K(-19.0, 10.0, 600), K(16.5, -35.0, 650)]}, 'step', '海军部与法国海军组成猎杀群：G 群守南美东岸，K 群在弗里敦—伯南布哥狭窄处，X 群驻达喀尔，H 群守好望角。范围为示意。', ['roskill_1954', 'naval_history_net'], 'low'),
 ('1939-10-22T14:00', {'raider': [C(3.5, -19.0, 750)], 'hunt': [G_COAST, K(-24.0, -8.0, 950), K(-19.0, 10.0, 600), K(15.0, -33.0, 750)]}, 'step', '特雷瓦尼恩号的求救电报把袭击舰定位在非洲西南海域，K 群南移搜索圣赫勒拿一带。', ['gazette_34815', 'roskill_1954'], 'medium'),
 ('1939-11-15T14:00', {'raider': [C(35.5, -25.5, 550)], 'hunt': [G_COAST, K(-19.0, 10.0, 600), K(16.0, -34.0, 800), K(-15.0, -16.0, 900)]}, 'step', '非洲壳牌号在莫桑比克沿岸被击沉：袭击舰现身印度洋。这正是朗斯多夫想要的——把猎杀群引向东非。', ['wiki_en_africa_shell', 'ktb_skl'], 'medium'),
 ('1939-12-02T16:00', {'raider': [C(5.0, -20.0, 800)], 'hunt': [G_COAST, K(-19.0, 10.0, 600), K(14.0, -31.0, 900)]}, 'step', '多里克之星号的「RRR」：袭击舰回到了圣赫勒拿与开普敦之间。K 群自开普敦出发拦截，哈伍德则判断它下一步会去南美。', ['harwood_despatch', 'bs26'], 'medium'),
 ('1939-12-07T12:00', {'raider': [C(-12.0, -24.0, 1400)], 'hunt': [[circle(-52.0, -35.2, 420)], K(-43.0, -24.0, 260), K(-14.0, -27.0, 900)]}, None, '哈伍德把分舰队集中在拉普拉塔河口外；K 群在南大西洋中部徒劳搜索。袭击舰已不知去向。', ['harwood_despatch', 'uboat_net_renown'], 'low'),
 ('1939-12-13T06:00', {}, 'step', '交战开始：此后态势由舰船航迹、射击与命中直接表示。', ['harwood_despatch'], 'high'),
 ('1939-12-14T01:00', {'raider': [C(-56.215, -34.925, 9)], 'hunt': [PLATE]}, 'step', '施佩伯爵号停泊蒙得维的亚；英国巡洋舰在河口外封锁南北两条航道。', ['harwood_despatch'], 'high'),
 ('1939-12-17T21:00', {'hunt': [PLATE]}, 'step', '施佩伯爵号自沉，英舰在河口外又警戒了数日。', ['harwood_despatch'], 'high'),
 ('1939-12-19T00:00', {}, None, '猎杀行动结束。', ['nh_kindell_1939_12'], 'medium'),
]
for f in glob.glob(P('data/fronts/*.json')): os.remove(f)
for at, ctl, tr, note, src, conf in frames:
    k = {'at': at, 'control': ctl}
    if tr: k['transition'] = tr
    k.update({'note': note, 'sources': src, 'confidence': conf})
    dump(P('data/fronts', at.replace(':', '-') + '.json'), k)

# ---------- 叠加层：泛美安全区 ----------
def rhumb(a, b, n=24): return [[round(a[0] + (b[0] - a[0]) * i / n, 3), round(a[1] + (b[1] - a[1]) * i / n, 3)] for i in range(n + 1)]
line = rhumb([-59, 20], [-24, 5], 12)[:-1] + rhumb([-24, 5], [-24, -20], 4)[:-1] + rhumb([-24, -20], [-57, -58], 24)
dump(P('data/overlays.json'), [
 {'id': 'ov.panama_zone', 'layer': 'zones', 'kind': 'line', 'label': '泛美中立安全区界线（1939 年 10 月 3 日《巴拿马宣言》）', 'line': line, 'style': 'neutral', 'sources': ['panama_declaration']},
])

# ---------- 装备 ----------
EQ = [
 ('gun_28cm', 'DE', '28 厘米 SK C/28 舰炮', '28 cm SK C/28', 'gun', None, '300 kg', '施佩伯爵号的六门主炮，分装两座三联装炮塔。炮弹重 300 千克，射程 36.5 公里，比英国巡洋舰的 8 英寸炮远约 10 公里——朗斯多夫本可在射程外慢慢打，却选择了迎头冲上去。', ['navweaps_28cm'], 6),
 ('gun_8in', 'GB', '8 英寸 Mk VIII 舰炮', '8 in BL Mk VIII', 'gun', None, '116 kg', '埃克塞特号与坎伯兰号的主炮。炮弹重约 116 千克，射程约 26.5 公里，是英方唯一能有效击穿施佩伯爵号装甲的火炮；埃克塞特号的两发命中打坏了它的燃油净化设备。', ['navweaps_8in'], 6),
 ('gun_6in', 'GB', '6 英寸 Mk XXIII 舰炮', '6 in BL Mk XXIII', 'gun', None, '50.8 kg', '利安德级轻巡洋舰的主炮，每舰八门。炮弹轻、穿甲力弱，但射速快，阿贾克斯号与阿喀琉斯号合计命中约 18 发，打坏了施佩伯爵号的上层建筑、厨房与测距仪。', ['navweaps_6in'], 16),
 ('torpedo_21in', 'GB', '21 英寸鱼雷', '21 in Mk VII / Mk IX torpedo', 'torpedo', None, None, '英国巡洋舰舷侧的三联装或四联装发射管所用的鱼雷。海战中埃克塞特号两次各射出 3 条、阿贾克斯号射出 4 条，都被施佩伯爵号及时转向避开。', ['harwood_despatch'], 10),
 ('ar196', 'DE', 'Ar 196 A-1 水上侦察机', 'Arado Ar 196 A-1', 'seaplane', 2, None, '施佩伯爵号舰中部弹射器上的水上侦察机，负责在地平线外搜寻商船与敌舰。9 月 11 日曾发现坎伯兰号，使袭击舰及时避开；12 月 11–12 日发动机故障无法修复，海战当天不能起飞。', ['wiki_en_ar196', 'wiki_en_graf_spee'], 1),
 ('seafox', 'GB', '费尔雷「海狐」水上侦察机', 'Fairey Seafox', 'seaplane', 2, None, '阿贾克斯号搭载的双座侦察机，最高时速约 200 公里。12 月 13 日在炮战中弹射升空，为第一分队校正弹着、报告鱼雷航迹；17 日黄昏又飞临蒙得维的亚上空，报告了施佩伯爵号的自沉。', ['wiki_en_seafox', 'faaoa_lewin'], 1),
 ('walrus', 'GB', '超级马林「海象」水陆两栖机', 'Supermarine Walrus', 'seaplane', 4, None, '埃克塞特号原载两架。06:23 一发 28 厘米近失弹的弹片打穿机身、油箱漏油，为防起火被舰员推下海，埃克塞特号因此失去了自己的空中观测。', ['harwood_despatch', 'wiki_en_walrus'], 2),
]
eq = []
for id, side, zh, orig, cls, crew, shell, desc, src, cnt in EQ:
    e = {'id': id, 'side': side, 'name': {'zh': zh, 'orig': orig}, 'class': cls}
    if crew: e['crew'] = crew
    if shell: e['gun'] = f'弹重 {shell}'
    if cnt: e['count'] = cnt
    if id in ('ar196', 'seafox', 'walrus'): e['model'] = id
    e['desc'] = desc; e['sources'] = src; eq.append(e)
dump(P('data/equipment.json'), eq)

# ---------- 兵力与损失 ----------
dump(P('data/forces.json'), {
 'sides': {
  'DE': {'name': '德国海军', 'commander': '朗斯多夫上校', 'men': 1100, 'divisions': '装甲舰 1 艘（施佩伯爵号）、补给油船 1 艘（阿尔特马克号）', 'guns': 6,
         'losses': {'killed': '36（12 月 13 日）；舰长 20 日自杀', 'wounded': '约 60', 'captured': '约 1,040 人被阿根廷拘留，另有数十人留在乌拉圭'},
         'note': '施佩伯爵号 12 月 17 日自沉。大口径炮数为 28 厘米主炮。'},
  'GB': {'name': '英国皇家海军', 'commander': '哈伍德准将（12 月 13 日起晋升少将）', 'men': 1200, 'divisions': '重巡洋舰 1 艘（埃克塞特号）、轻巡洋舰 1 艘（阿贾克斯号），另有坎伯兰号 14 日到达', 'guns': 14,
         'losses': {'killed': '68（埃克塞特号 61、阿贾克斯号 7）', 'wounded': '约 25'},
         'note': '海战当日参战的三舰中两艘属英国，阿喀琉斯号另列。袭击航程中九艘英国商船被击沉（50,089 总吨），商船船员无人死亡。'},
  'NZ': {'name': '皇家海军新西兰分队', 'commander': '帕里上校', 'men': 550, 'divisions': '轻巡洋舰 1 艘（阿喀琉斯号）', 'guns': 8,
         'losses': {'killed': '4', 'wounded': '9'}, 'note': '新西兰官方史：阵亡 4 人（其中 2 名新西兰人），伤军官 2、士兵 7。'},
 },
 'sources': ['harwood_despatch', 'waters_1956', 'kaack_2010', 'nh_kindell_casualties', 'frus_1939_v5', 'wiki_en_river_plate'],
})
print('✓ 来源', len(sources), '地名', len(places), '关键帧', len(frames), '装备', len(eq))
