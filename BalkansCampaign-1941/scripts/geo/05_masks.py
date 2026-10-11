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


# 初始活动战区为GR+AL，YU由worker于1941-04-06启用。
# AL不是不可收复的Axis home；bit1/2/3为空，允许希军反攻收复AL。
BITS = {0: ('希腊与阿尔巴尼亚战区', ['GR', 'AL']), 5: ('延后启用南斯拉夫战区', ['YU'])}
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
        'bits': {'0': '战区：1940-10-28的希腊与阿尔巴尼亚（引擎比特名沿用PL）', '1': '未用；AL可收复', '2': '未用',
                 '3': '未用（SU槽）', '4': '陆地', '5': '南斯拉夫（1941-04-06启用）', '6': '其他陆地（背景国家，不参与占领填色）'},
        'deferred': {'5': '1941-04-06T00:00'},
        'date': '1940-10-28', 'bbox': proj.FRAME['bbox'],
        'source': 'balkans1940.geojson / countries1939兼容对象 + NE 10m land'}
json.dump(meta, open(os.path.join(ROOT, 'public/geo/field_masks.json'), 'w'), ensure_ascii=False, indent=1)
cnt = {k: int(((m >> k) & 1).sum()) for k in range(7)}
print('[masks] 写出', w, 'x', h, '各比特格数', cnt)
