"""由已审阅的本地证据重建地名；不联网、不读取其他战役、不改写史料或军史文件。"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAMPAIGN = HERE.parents[1]
seed = json.loads((HERE / 'gazetteer-seed.json').read_text())
defs = json.loads((HERE / 'gazetteer-definitions.json').read_text())
lookups = json.loads((HERE / 'gazetteer-lookups.json').read_text())
gaz = {p['id']: p for p in seed}
evidence = {}
# 人工区分同名河流、村庄、行政范围、铁路站与战时旧址。
selected = {'kobona': 1, 'polyany': 1, 'pavlovsk': 1, 'podberezye': 1,
            'konigsberg': 1, 'beloostrov': 0, 'lembolovo': 1, 'tortolovo': 1,
            'kunda': 1, 'leningrad': 1, 'narva': 1, 'oranienbaum': 1,
            'porechye': 1, 'pushkin': 1, 'krasnoye_selo': 1, 'strelna': 1,
            'sestroretsk': 1, 'vartsila': 1}
skip = {'rabochiy_1', 'rabochiy_8', 'lipka', 'porechye_mga', 'sinyavino'}
for place_id in sorted(set(gaz) | set(defs)):
    if place_id in defs:
        gaz[place_id] = {**gaz.get(place_id, {}), **defs[place_id]}
    records = lookups.get(place_id, {}).get('results', [])
    n = selected.get(place_id, 0)
    if records and place_id not in skip and n < len(records):
        row = records[n]
        gaz[place_id]['pos'] = [float(row['lon']), float(row['lat'])]
        gaz[place_id]['sources'] = ['geo_osm']
        gaz[place_id]['confidence'] = 'high'
        evidence[place_id] = {'url': f"https://www.openstreetmap.org/{row['osm_type']}/{row['osm_id']}",
                              'identity': row.get('display_name'), 'checked': '2026-10-18'}


def override(place_id, pos, sources, note, confidence='medium', url=None):
    gaz[place_id]['pos'] = pos
    gaz[place_id]['sources'] = sources
    gaz[place_id]['confidence'] = confidence
    gaz[place_id]['alt'] = note
    evidence[place_id] = {'pos': pos, 'note': note, 'checked': '2026-10-18', 'url': url}


municipal = 'https://special.kirovsk-reg.ru/history/putevoditel_po_KMRLO/pamyatniki/_pamyatniki'
override('oreshek', [31.0387628, 59.9541652], ['geo_osm', 'geo_oreshek'],
         '奥列霍维岛要塞博物馆范围点；与南岸什利谢利堡城和渡口区分。岛小于控制场网格，守城史以事件与原始几何洞为准',
         confidence='high', url='https://www.spbmuseum.ru/themuseum/news/56034/?lang_ui=en')
override('sinyavino', [31.1116784, 59.8371875], ['geo_osm', 'geo_sinyavino'],
         '战毁旧锡尼亚维诺村遗址；与北侧现代同名镇分开', url='https://www.openstreetmap.org/node/1640978891')
override('sinyavino_43_3', [31.1275449, 59.8459170], ['geo_osm', 'geo_sinyavino'],
         '以43.3高地纪念区定位；不是精密复测的1930年代等高点', url='https://www.openstreetmap.org/way/137872367')
override('sinyavino_50_1', [31.111, 59.828], ['geo_sinyavino'],
         '依据旧村教堂以南的相对位置绘制约1公里范围示意；未将现代纪念碑冒充实测峰顶', confidence='low',
         url='https://dtdm.spb.ru/museum/qr0001.html')
override('rabochiy_1', [31.077, 59.907], ['geo_kirov_memorials'],
         '战时第1工人村地区示意；具体村界已消失，不与纳济亚同号工人村混同', confidence='low', url=municipal)
override('rabochiy_8', [31.164, 59.888], ['geo_kirov_memorials'],
         '战时第8工人村地区示意；约2公里定位误差，不作为单格控制断言的依据', confidence='low', url=municipal)
override('rabochiy_5', [31 + 7/60 + 33.388/3600, 59 + 52/60 + 30.144/3600], ['geo_osm', 'geo_kirov_memorials'],
         '第5工人村/VIMT旧址与1943年会师纪念点；定位为遗址范围', url=municipal)
override('lipka', [31 + 11/60 + 41.806/3600, 59 + 54/60 + 27.716/3600], ['geo_kirov_memorials'],
         '利普卡战毁村旧址纪念点，区别于贡托瓦亚利普卡', url=municipal)
override('gontovaya_lipka', [31 + 13/60 + 55.128/3600, 59 + 49/60 + 36.264/3600], ['geo_kirov_memorials'],
         '贡托瓦亚利普卡战毁村纪念地，区别于拉多加湖岸利普卡', url=municipal)
override('porechye_mga', [31 + 17/60 + 8.052/3600, 59 + 45/60 + 43.891/3600], ['geo_kirov_memorials'],
         '姆加方向旧波列奇耶/纳济亚河前线纪念点，区别于卢加河同名桥头堡', url=municipal)
override('voronovo', [31 + 18/60 + 33.937/3600, 59 + 45/60 + 8.532/3600], ['geo_osm', 'geo_kirov_memorials'],
         '战毁沃罗诺沃村旧址防线纪念点', url=municipal)
override('kobona_harbour', [31 + 32/60 + 59.604/3600, 60 + 1/60 + 19.812/3600], ['geo_kirov_memorials'],
         '科博纳湖岸港区生命之路纪念点；不使用同名河流的几何中心', url=municipal)
override('shlisselburg_bridge', [31 + 31.446/3600, 59 + 56/60 + .485/3600], ['geo_kirov_memorials'],
         '1943年涅瓦河铁路渡桥所在位置的纪念点', url=municipal)
override('victory_rail_mid', [31 + 20/60 + 7.771/3600, 59 + 52/60 + 47.777/3600], ['geo_kirov_memorials'],
         '普里拉多日斯基东北侧胜利之路铁路旧线纪念点；线路整体为概略走向', url=municipal)
override('nevsky_pyatachok', [30.95419, 59.838228], ['geo_osm', 'geo_kirov_memorials'],
         '涅瓦河左岸桥头堡旧址；不是对岸涅瓦杜布罗夫卡镇中心', url=municipal)
override('voibokalo', [31 + 46/60 + 1.686/3600, 59 + 52/60 + 50.477/3600], ['geo_kirov_memorials'],
         '沃伊博卡洛车站生命之路纪念点；区别于北侧科博纳港', url=municipal)
# 未以现代站台替换的历史地区名，保留可核查的代表位置与相应精度说明。
override('korpiselka', [31.458, 62.677], ['geo_karelia1939'],
         '战时科尔皮塞尔凯村/道路节点范围示意，位于1940年边界苏方；不是今芬兰同名大区中心', confidence='low',
         url='https://www.maanmittauslaitos.fi/en/e-services/karelian-maps')
override('lyubolyady', [30.835468, 58.611397], ['geo_osm'],
         '诺夫哥罗德西北柳博利亚德村；地区内另有同名村与车站，部队位置为地区代表点', confidence='medium',
         url='https://nominatim.openstreetmap.org/search?q=Люболяды&format=jsonv2')
override('ilmen_north', [31.3, 58.45], ['geo_natural_earth'],
         '伊尔门湖北部水域参考点，非1944年南集团具体登陆点', url='https://www.naturalearthdata.com/')
for target, source in {'voibokalo': 'voybokalo', 'volkhov': 'volkhovstroy'}.items():
    if target not in gaz and source in gaz:
        gaz[target] = {**gaz[source], 'id': target}
    elif source in lookups and lookups[source]['results']:
        row = lookups[source]['results'][0]
        gaz[target] = {**gaz.get(target, {}), **gaz.get(source, {}), 'id': target,
                       'pos': [float(row['lon']), float(row['lat'])]}
    evidence[target] = {'aliasOf': source}
for place_id, p in gaz.items():
    p.setdefault('sources', ['geo_osm'])
    p.setdefault('confidence', 'medium')
    if 'pos' not in p:
        raise ValueError(f'地名尚未确认坐标：{place_id}')
    if not (20 <= p['pos'][0] <= 36 and 54 <= p['pos'][1] <= 62.8):
        raise ValueError(f'地名超出本战役画幅：{place_id} {p["pos"]}')
out = CAMPAIGN / 'data/gazetteer/places.json'
out.write_text(json.dumps(sorted(gaz.values(), key=lambda p: (p['rank'], p['id'])), ensure_ascii=False, indent=2) + '\n')
(HERE / 'gazetteer-provenance.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'{len(gaz)} 个地名 → {out}')
