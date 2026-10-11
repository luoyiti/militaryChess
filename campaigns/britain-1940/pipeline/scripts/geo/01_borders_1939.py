"""Fixed national context for the July–October 1940 Battle of Britain theatre.

The legacy filename / TopoJSON name countries1939 is retained for the renderer.
Borders identify countries before occupation; they are not ownership or air-control
polygons. Austria is included in Germany. Fine coastlines are Natural Earth 10m;
Dutch land reclaimed after 1940 is removed by historical_geo.py. The map shows a
dated, generalized geographic context, not annexation claims or a changing front.
"""
import json, os, sys
import shapely
from shapely.geometry import Point
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *
from historical_geo import land1940, remove_post1940_polders

COUNTRIES = {
    'GB': ('英国', 'United Kingdom', ['GBR', 'IMN', 'JEY', 'GGY'], '英国与王室属地；属地的法律地位不同'),
    'IE': ('爱尔兰', 'Ireland', ['IRL'], '中立国'),
    'FR': ('法国', 'France', ['FRA'], '法国北部已被德国占领；边线为固定国家背景'),
    'BE': ('比利时', 'Belgium', ['BEL'], '德国占领下的比利时；边线不表示控制权'),
    'NL': ('荷兰', 'Netherlands', ['NLD'], '德国占领下的荷兰；海岸按1940圩田范围校正'),
    'DE': ('德国', 'Germany', ['DEU', 'AUT'], '德国含1938年并入的奥地利；占领区仍以国家背景区分'),
    'DK': ('丹麦', 'Denmark', ['DNK'], '德国占领下的丹麦；边线不表示控制权'),
    'NO': ('挪威', 'Norway', ['NOR'], '德国占领下的挪威；边线不表示控制权'),
    'SE': ('瑞典', 'Sweden', ['SWE'], '中立国'),
    'LU': ('卢森堡', 'Luxembourg', ['LUX'], '德国占领下的卢森堡'),
    'CH': ('瑞士', 'Switzerland', ['CHE'], '中立国'),
    'IT': ('意大利', 'Italy', ['ITA'], '战区边缘背景'),
    'CS': ('捷克地区', 'Czech lands', ['CZE'], '战区画布外缘的概化地理背景'),
    'PL': ('波兰', 'Poland', ['POL'], '战区画布外缘的概化地理背景'),
}
mod = ne_countries()
land = land1940()
out = {}
for cid, (zh, name, ids, note) in COUNTRIES.items():
    g = clean(unary_union([mod[k] for k in ids if k in mod]).intersection(land), 1e-7)
    if cid == 'NL':
        g = clean(remove_post1940_polders(g))
        # NE land/country outlines contain fragments of the present lake's bed.
        # They must not leave an obsolete modern shore crossing the1940 water.
        ijssel = unary_union([shape(f['geometry']) for f in raw('ne_10m_lakes.geojson')['features']
                              if f['properties'].get('name') == 'IJsselmeer'])
        g = clean(g.difference(ijssel))
    if not g.is_empty:
        out[cid] = g

features = []
for cid, g in sorted(out.items()):
    zh, name, _, note = COUNTRIES[cid]
    features.append(feat(g, id=cid, zh=zh, name=name, date='1940-07-10',
                         boundaryRole='fixed-national-context', note=note,
                         source='Natural Earth 1:10m; dated contextual adaptation'))
dump(fc(features), os.path.join(WORK, 'countries1939.geojson'))
dump(fc(features), os.path.join(ROOT, 'public/geo/countries1940.geojson'))
dump(fc([feat(out['GB'], id='GB', zh='英国', date='1940-07-10',
              note=COUNTRIES['GB'][3], source='Natural Earth 1:10m')]),
     os.path.join(ROOT, 'public/geo/britain1940.geojson'))
labels = [
    {'id': 'GB', 'zh': '英国', 'name': 'UNITED KINGDOM', 'pos': [-3.0, 54.55], 'rank': 1},
    {'id': 'IE', 'zh': '爱尔兰', 'name': 'IRELAND', 'pos': [-8.0, 53.1], 'rank': 2},
    {'id': 'FR', 'zh': '法国', 'name': 'FRANCE', 'pos': [2.2, 48.5], 'rank': 1},
    {'id': 'BE', 'zh': '比利时', 'name': 'BELGIUM', 'pos': [4.65, 50.6], 'rank': 2},
    {'id': 'NL', 'zh': '荷兰', 'name': 'NETHERLANDS', 'pos': [5.95, 52.3], 'rank': 2},
    {'id': 'DE', 'zh': '德国', 'name': 'GERMANY', 'pos': [8.9, 51.25], 'rank': 1},
    {'id': 'DK', 'zh': '丹麦', 'name': 'DENMARK', 'pos': [9.45, 56.35], 'rank': 2},
    {'id': 'NO', 'zh': '挪威', 'name': 'NORWAY', 'pos': [7.2, 59.25], 'rank': 1},
    {'id': 'SE', 'zh': '瑞典', 'name': 'SWEDEN', 'pos': [13.2, 59.0], 'rank': 2},
    {'id': 'LU', 'zh': '卢森堡', 'name': 'LUXEMBOURG', 'pos': [6.0, 49.8], 'rank': 3},
]
json.dump(labels, open(os.path.join(ROOT, 'public/geo/country_labels.json'), 'w'), ensure_ascii=False, indent=2)
tests = json.load(open(os.path.join(os.path.dirname(__file__), 'border_testpoints.json')))['points']
errors = []
for name, lon, lat, expected in tests:
    got = [cid for cid, g in out.items() if g.contains(Point(lon, lat))]
    if expected not in got:
        errors.append((name, expected, got))
assert not errors, f'Incorrect national context: {errors}'
print('[borders] fixed1940 countries', {k: len(g.geoms) for k, g in out.items()}, flush=True)
print(f'[borders] {len(tests)} geographic test points passed; GB outline exported', flush=True)
