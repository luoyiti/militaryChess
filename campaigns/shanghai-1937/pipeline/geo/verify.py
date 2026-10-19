"""Read-only asset and geographical-contract checks for this campaign."""
import json
import math
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from shapely.geometry import Point, shape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
os.environ.setdefault('GEO_CAMPAIGN', 'shanghai-1937')
sys.path.insert(0, str(ROOT / 'tools/geo'))
import proj

CDIR = ROOT / 'campaigns/shanghai-1937'
PUBLIC = ROOT / 'public/campaigns/shanghai-1937'
FRAME = proj.FRAME
W, H = FRAME['width'], FRAME['height']
errors = []


def check(ok, message):
    print(('PASS' if ok else 'FAIL') + ' ' + message)
    if not ok:
        errors.append(message)


def read(path):
    return json.loads(path.read_text())


check(FRAME['bbox'] == [120.75, 30.6, 122.1, 31.75], 'frozen bbox')
check((W, H) == (4096, 4060), f'world frame {W} x {H}')
mask_meta = read(PUBLIC / 'geo/field_masks.json')
F = FRAME['field']
check((mask_meta['w'], mask_meta['h'], mask_meta['cell']) == (F['w'], F['h'], F['cell']), 'frame/mask grid dimensions and cell')
check(F['w'] == math.ceil(W / F['cell']) and F['h'] == math.ceil(H / F['cell']), 'grid covers canvas')
masks_raw = np.fromfile(PUBLIC / 'geo/field_masks.bin', dtype=np.uint8)
check(masks_raw.size == F['w'] * F['h'], f'mask byte length {masks_raw.size}')
masks = masks_raw.reshape(F['h'], F['w'])
land = (masks & (1 << 4)) != 0
cn = (masks & 1) != 0
jp = (masks & 2) != 0
check(bool(land.any()) and float(cn.sum()) / land.sum() > 0.98, 'Chinese theatre occupies the Chinese land, not Japanese home land')
check(not bool(jp.any()), 'JP native-home bit is zero throughout this Chinese bbox')
check(not bool((cn & ~land).any()), 'theatre cells are land cells')

places = {p['id']: p for p in read(CDIR / 'data/gazetteer/places.json')}
check(len(places) == 37, '37 stable historical place IDs')
for p in places.values():
    x, y = proj.forward(*p['pos'])
    check(0 <= x < W and 0 <= y < H, f"@{p['id']} inside frame")


def mask_at(pos):
    x, y = proj.forward(*pos)
    return int(masks[min(F['h'] - 1, max(0, int(y / F['cell'])))][min(F['w'] - 1, max(0, int(x / F['cell'])))])


for name in ('zhabei', 'hongkou', 'yangshupu', 'north_station', 'sihang', 'south_station',
             'nanshi', 'baoshan', 'luodian', 'dachang', 'jinshanwei', 'songjiang', 'qingpu'):
    bits = mask_at(places[name]['pos'])
    check(bool(bits & 1), f'@{name} remains combat-theatre land (bits={bits})')
check(bool(mask_at([121.493, 31.409]) & 1), 'documented Baoshan Linjiang Park anchor is land after local DEM repair')
check('Baoshan' in mask_meta['source'], 'mask metadata discloses the local DEM land correction')
for pos in (places['settlement']['pos'], [121.468, 31.230]):
    bits = mask_at(pos)
    check(bool(bits & 16) and not bool(bits & 1) and bool(bits & 64), f'foreign core protected from combat tint at {pos} (bits={bits})')

core = shape(read(HERE / 'foreign-core.geojson')['features'][0]['geometry'])
check(core.is_valid, 'schematic foreign core is valid')
check(core.contains(Point(places['settlement']['pos'])), 'internment region is inside schematic foreign core')
for name in ('sihang', 'hongkou', 'yangshupu', 'nanshi'):
    check(not core.contains(Point(places[name]['pos'])), f'foreign core does not erase @{name}')
check(places['chuanshakou']['pos'][1] > 31.45 and places['chuanshakou']['pos'][0] < 121.4, 'Chuanshakou is northern Luojing, not Pudong Chuansha')
check(places['north_station']['pos'][0] > 121.46 and places['south_station']['pos'][1] < 31.22, 'historic stations are not the present-day main stations')

waterways = {f['properties']['id']: shape(f['geometry']) for f in read(HERE / 'waterways.geojson')['features']}
check(all(g.is_valid and not g.is_empty for g in waterways.values()), 'three usable approximate river lines')
sihang = Point(places['sihang']['pos'])
river = waterways['suzhou_creek']
nearest = river.interpolate(river.project(sihang))
check(nearest.y < sihang.y and sihang.distance(nearest) < 0.002, 'Sihang Warehouse on the north bank of the schematic Suzhou Creek')
check(waterways['huangpu'].distance(waterways['suzhou_creek']) < 0.00001, 'Suzhou Creek joins Huangpu')
check(waterways['huangpu'].distance(waterways['wenzaobang']) < 0.0005, 'Wenzaobang joins Huangpu within its illustrative width')

topo = read(PUBLIC / 'geo/vectors.topo.json')
check(topo['type'] == 'Topology', 'vectors.topo.json is TopoJSON')
check(all(k in topo['objects'] for k in ('land', 'countries1939', 'rivers', 'lakes', 'forest', 'marsh')), 'all required vector layers')
river_geoms = topo['objects']['rivers']['geometries']
check({'huangpu', 'suzhou_creek', 'wenzaobang'}.issubset({g.get('properties', {}).get('id') for g in river_geoms}), 'three key rivers survive projection and simplification')
country_ids = {g.get('properties', {}).get('id') for g in topo['objects']['countries1939']['geometries']}
check(country_ids == {'CN', 'INT'}, '1938 occupation polygons are not used as 1937 borders')

meta = read(PUBLIC / 'tiles/base/meta.json')
check((meta['worldWidth'], meta['worldHeight']) == (W, H), 'tile/world dimensions')
tiles = 0
for level, target_width in zip(meta['levels'], FRAME['tiles']['levels']):
    width, height = target_width, math.ceil(H * target_width / W)
    check((level['width'], level['height']) == (width, height), f"tile level z{level['z']} dimensions")
    for x in range(level['cols']):
        for y in range(level['rows']):
            path = PUBLIC / 'tiles/base' / str(level['z']) / f'{x}_{y}.webp'
            with Image.open(path) as im:
                expected = (min(512, width - x * 512), min(512, height - y * 512))
                check(im.size == expected, f'tile z{level["z"]}/{x}_{y} {im.size}')
            tiles += 1
check(tiles == 84, '84 complete paper-map tiles')
with Image.open(PUBLIC / 'tiles/overview.webp') as im:
    check(im.size == (2048, 2030), 'overview image 2048 x 2030')
terrain = read(PUBLIC / 'terrain/terrain.json')
check((terrain['worldWidth'], terrain['worldHeight']) == (W, H), 'terrain/world dimensions')
check(terrain['encoding'] == 'rg16' and terrain['scale'] == 0.25 and terrain['offset'] == -100, 'terrain height encoding')
with Image.open(PUBLIC / 'terrain/height.png') as im:
    check(im.mode == 'RGB' and im.size == (terrain['width'], terrain['height']) == (1024, 1015), 'height image 1024 x 1015 RGB')
with Image.open(PUBLIC / 'terrain/albedo.webp') as im:
    check(im.size == (terrain['albedo']['width'], terrain['albedo']['height']) == (W, H), 'albedo image 4096 x 4060')
check(len(read(PUBLIC / 'credits.json').get('geography', [])) >= 6, 'public geographical attribution and limitations exist')
print(f'\n{len(errors)} errors; {tiles} tiles; mask {F["w"]}x{F["h"]}; terrain heights {terrain["minElev"]}..{terrain["maxElev"]} m')
sys.exit(1 if errors else 0)
