"""场掩膜：public/geo/field_masks.bin（Uint8，w×h = frame.field，行主序，格心世界坐标 ((i+0.5)*cell, (j+0.5)*cell)）。
用已投影(d3)的 countries1939 / land_render 做点内判定（shapely.contains_xy）。"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
import proj
from geo_common import WORK, ROOT

F = proj.FRAME['field']
w, h, cell = F['w'], F['h'], F['cell']
XY = os.path.join(WORK, 'xy')
C = {f['properties']['id']: shapely.make_valid(shape(f['geometry'])) for f in json.load(open(os.path.join(XY, 'countries1939.geojson')))['features']}
land = shapely.make_valid(shape(json.load(open(os.path.join(XY, 'land_render.geojson')))['features'][0]['geometry']))
jj, ii = np.mgrid[0:h, 0:w]
X, Y = (ii + 0.5) * cell, (jj + 0.5) * cell


def inside(g):
    return shapely.contains_xy(g, X, Y)


BITS = {0: ('波兰', ['PL']), 1: ('德国本土（含东普鲁士、梅梅尔、波希米亚-摩拉维亚保护国）', ['DE', 'PROT']), 2: ('斯洛伐克', ['SK']),
        3: ('苏联', ['SU']), 5: ('但泽自由市', ['DZG'])}
m = np.zeros((h, w), np.uint8)
L = inside(land)
m |= (L.astype(np.uint8) << 4)
named = np.zeros((h, w), bool)
for bit, (_, ids) in BITS.items():
    g = unary_union([C[k] for k in ids if k in C])
    a = inside(g) & L
    named |= a
    m |= (a.astype(np.uint8) << bit)
m |= ((L & ~named).astype(np.uint8) << 6)
m.tofile(os.path.join(ROOT, 'public/geo/field_masks.bin'))
meta = {'w': w, 'h': h, 'cell': cell, 'dtype': 'uint8', 'order': 'row-major (j*w+i)', 'cellCenter': '((i+0.5)*cell, (j+0.5)*cell) 世界坐标',
        'bits': {'0': 'PL 波兰（1939-08-31，含扎奥尔杰）', '1': 'DE 德国本土（含东普鲁士、梅梅尔、奥地利、苏台德、波希米亚-摩拉维亚保护国）', '2': 'SK 斯洛伐克',
                 '3': 'SU 苏联', '4': '陆地', '5': 'DZG 但泽自由市', '6': '其他中立国陆地（立陶宛、拉脱维亚、罗马尼亚、匈牙利、瑞典、丹麦等）'},
        'source': 'countries1939（scripts/geo/01_borders_1939.py）+ NE 10m land，经 d3 投影后点内判定'}
json.dump(meta, open(os.path.join(ROOT, 'public/geo/field_masks.json'), 'w'), ensure_ascii=False, indent=1)
cnt = {k: int(((m >> k) & 1).sum()) for k in range(7)}
print('[masks] 写出', w, 'x', h, '各比特格数', cnt)
