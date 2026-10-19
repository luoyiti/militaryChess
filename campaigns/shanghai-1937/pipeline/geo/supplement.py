"""Add explicitly approximate, campaign-local rivers after generic vectors.py.

Natural Earth has only one unnamed, coarse Suzhou/Huangpu connector in this
urban theatre. Retain its western reach, replace its urban reach with the
labelled anchor schematics in waterways.geojson, and cut illustrative river
water out of land/country masks so the same geometry reaches 2D and 3D.
Run only after generic vectors.py; pipeline/geo/run.sh guarantees that order.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from shapely import affinity, transform
from shapely.geometry import box, shape
from shapely.ops import unary_union

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'tools/geo'))
from common import CLIP, LL, PUBLIC, WORK, clean, dump, fc, feat, load, log, raw
import proj

if '--mask-metadata' in sys.argv:
    path = Path(PUBLIC) / 'geo/field_masks.json'
    meta = json.loads(path.read_text())
    meta['source'] = 'tools/geo/masks.py: campaign CN/INT countries and Natural Earth land, with local DEM-supported Baoshan land repair and explicitly schematic river corridors; see pipeline/geo/evidence.json'
    meta['approximation'] = 'Modern physical geography, not measured 1937 coast or river banks. Foreign-defended core is a conservative schematic inset, not whole concessions or exact defence lines. JP native-home bit is intentionally zero in this Chinese bbox.'
    path.write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n')
    sys.exit(0)

# Natural Earth's 1:10m coast puts the documented Baoshan old-town / Linjiang
# Park region in water. Repair only this small modern land neighbourhood from
# the already-cached DEM, sampled at approximately its native 250m spacing.
# This is NOT a reconstruction of the 1937 shoreline or old city walls.
bounds = [121.46, 31.39, 121.505, 31.43]
xs, ys = proj.forward([bounds[0], bounds[2]], [bounds[1], bounds[3]])
stride = 8
x0, x1 = max(0, int(min(xs)) // stride * stride), min(proj.W, int(max(xs)) + stride)
y0, y1 = max(0, int(min(ys)) // stride * stride), min(proj.H, int(max(ys)) + stride)
dem = np.load(str(Path(WORK) / 'dem.npy'), mmap_mode='r')
patch_cells = []
for y in range(y0, y1, stride):
    for x in range(x0, x1, stride):
        right, bottom = min(x + stride, proj.W), min(y + stride, proj.H)
        lon, lat = proj.inverse((x + right) / 2, (y + bottom) / 2)
        if bounds[0] <= lon <= bounds[2] and bounds[1] <= lat <= bounds[3] and dem[y:bottom, x:right].mean() >= 1.0:
            patch_cells.append(box(x, y, right, bottom))
patch = clean(transform(unary_union(patch_cells), lambda xy: np.column_stack(proj.inverse(xy[:, 0], xy[:, 1]))))
base_land = shape(load(str(Path(LL) / 'land_render.geojson'))['features'][0]['geometry'])
patch = clean(unary_union([p for p in patch.geoms if p.intersects(base_land)]))
if patch.is_empty:
    raise RuntimeError('Baoshan DEM-supported land repair did not connect to Natural Earth land')
log('supplement', 'Baoshan modern land repair from cached DEM >=1m; 250m sample cells, not 1937 shore survey')

items = json.loads((HERE / 'waterways.geojson').read_text())['features']
# Widths are illustrative display corridors, not historical bank surveys.
kx = 111.32 * math.cos(math.radians(31.2))
ky = 110.57
water_parts = []
rivers = []
for item in items:
    line = shape(item['geometry'])
    p = item['properties']
    corridor_km = affinity.scale(line, xfact=kx, yfact=ky, origin=(0, 0)).buffer(
        p['displayWidthKm'] / 2, quad_segs=4, cap_style='round', join_style='round')
    corridor = affinity.scale(corridor_km, xfact=1 / kx, yfact=1 / ky, origin=(0, 0))
    water_parts.append(corridor)
    rivers.append(feat(line.intersection(CLIP), **p))

# The unchanged upstream NE geometry is kept, not redrawn from memory.
for item in raw('ne_10m_rivers_lake_centerlines.geojson')['features']:
    if item['properties'].get('rivernum') != 582:
        continue
    upstream = shape(item['geometry']).intersection(box(120.6, 30.45, 121.302745, 31.9))
    if not upstream.is_empty:
        rivers.append(feat(upstream, id='wusong_upstream', name='Wusong River',
                           zh='吴淞江', rank=2, approx=True, source='Natural Earth 1:10m rivernum 582'))
water = clean(unary_union(water_parts))
dump(fc(rivers), str(Path(LL) / 'rivers.geojson'))

# One shared water geometry governs the paper map, terrain albedo and SDF masks.
for name in ('land', 'land_render', 'countries1939'):
    collection = load(str(Path(LL) / f'{name}.geojson'))
    out = []
    for item in collection['features']:
        geometry = shape(item['geometry'])
        if name != 'countries1939' or item['properties'].get('id') == 'CN':
            geometry = unary_union([geometry, patch])
        geometry = clean(geometry.difference(water))
        if not geometry.is_empty:
            out.append(feat(geometry, **item['properties']))
    dump(fc(out), str(Path(LL) / f'{name}.geojson'))

lakes = load(str(Path(LL) / 'lakes.geojson'))['features']
for item, corridor in zip(items, water_parts):
    p = item['properties']
    lakes.append(feat(clean(corridor.intersection(CLIP)), name=p['name'], zh='',
                      approx=True, waterway=p['id'], note='Illustrative river corridor, not a lake'))
dump(fc(lakes), str(Path(LL) / 'lakes.geojson'))

# Export the same source ring for the visible overlay. Fronts use its original
# ring too; data provenance is kept in evidence.json and the public credits.
core = json.loads((HERE / 'foreign-core.geojson').read_text())['features'][0]
overlay = [{
    'id': 'foreign_defended_core', 'layer': 'historical_geography', 'kind': 'polygon',
    'label': '外国守备核心（近似）：不是全部租界或精确1937外防线，也不表示免于炮击；虹口、杨树浦不在豁免区。',
    'polygons': [core['geometry']['coordinates']], 'style': 'sector',
    'sources': core['properties']['sources'],
}]
(ROOT / 'campaigns/shanghai-1937/data/overlays.json').write_text(
    json.dumps(overlay, ensure_ascii=False, indent=2) + '\n')
log('supplement', f'{len(rivers)} named river reaches; water shared by 2D/3D/masks; foreign-core overlay emitted')
