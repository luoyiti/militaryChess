"""Reuse the source project's LL → D3 XY → TopoJSON/raster pipeline.

Natural Earth 10m provides modern physical geography. Norway/Sweden's shared
border is suitable for the campaign; other neighboring borders are background
orientation only, not a reconstruction of the 1940 Finland/USSR settlement.
"""
import json
from pathlib import Path
import shapely
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'scripts/.cache/raw'
OUT = ROOT / '.work/a/ll'
OUT.mkdir(parents=True, exist_ok=True)
REGION = box(-9, 50, 36, 75)

def read(name):
    return json.loads((RAW / name).read_text())['features']

def feat(g, props=None):
    return {'type': 'Feature', 'properties': props or {}, 'geometry': mapping(g)}

def write(name, features):
    (OUT / (name + '.geojson')).write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False))

ids = {'NOR': 'NO', 'SWE': 'SE', 'FIN': 'FI', 'DNK': 'DK', 'DEU': 'DE', 'GBR': 'UK', 'RUS': 'RU', 'POL': 'PL'}
countries = []
for f in read('ne_10m_admin_0_countries.geojson'):
    code = f['properties']['ADM0_A3']
    g = shapely.make_valid(shape(f['geometry']))
    if code not in ids or not g.intersects(REGION): continue
    g = g.intersection(REGION).simplify(0.003, preserve_topology=True)
    countries.append(feat(g, {'id': ids[code], 'name': f['properties'].get('NAME', code)}))
write('countries1939', countries)  # Existing topology key retained as an engine interface.
norway = next(f for f in countries if f['properties']['id'] == 'NO')
(ROOT / 'public/geo').mkdir(parents=True, exist_ok=True)
(ROOT / 'public/geo/norway1940.geojson').write_text(json.dumps(norway, ensure_ascii=False))

land = unary_union([shapely.make_valid(shape(f['geometry'])).intersection(REGION)
                    for f in read('ne_10m_land.geojson') if shape(f['geometry']).intersects(REGION)])
land = land.simplify(0.002, preserve_topology=True)
write('land', [feat(land)])
write('land_render', [feat(land)])
for name, source in [('lakes', 'ne_10m_lakes.geojson'), ('rivers', 'ne_10m_rivers_lake_centerlines.geojson')]:
    fs = []
    for f in read(source):
        g = shapely.make_valid(shape(f['geometry']))
        if g.is_empty or not g.intersects(REGION): continue
        g = g.intersection(REGION).simplify(0.002, preserve_topology=True)
        if g.is_empty or g.geom_type not in ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']: continue
        n = f['properties'].get('name', '')
        zh = {'Glomma': '格洛马河', 'Lagen': '洛根河', 'Gudbrandsdalslagen': '古德布兰河'}.get(n, '')
        fs.append(feat(g, {'rank': max(2, int(f['properties'].get('scalerank', 4))), 'zh': zh}))
    write(name, fs)
write('forest', [])
write('marsh', [])
print('Prepared Natural Earth northern Europe: countries', len(countries), 'physical geography clipped independently.')
