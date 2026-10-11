"""SDF 场掩膜 → public/campaigns/<id>/geo/field_masks.bin（Uint8，w×h = frame.field，行主序，格心世界坐标 ((i+0.5)*cell, (j+0.5)*cell)）。
比特由 geo.config.json 的 masks 决定，须与 campaign.json 的 control（landBit、theatreBits、slots[].homeBits、deferred）一致：
    "masks": { "landBit": 4, "bits": { "0": ["PL"], "1": ["DE"] }, "otherLandBit": 6, "air": false }
air = true（空战）时只写陆地位。
"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
from common import CFG, XY, PUBLIC, load, log
import proj

M = CFG.get('masks') or {}
F = proj.FRAME['field']
w, h, cell = F['w'], F['h'], F['cell']
land = shapely.make_valid(shape(load(os.path.join(XY, 'land_render.geojson'))['features'][0]['geometry']))
countries = {f['properties']['id']: shapely.make_valid(shape(f['geometry'])) for f in load(os.path.join(XY, 'countries1939.geojson'))['features']}
jj, ii = np.mgrid[0:h, 0:w]
X, Y = (ii + 0.5) * cell, (jj + 0.5) * cell
L = shapely.contains_xy(land, X, Y)
land_bit = int(M.get('landBit', 4))
m = (L.astype(np.uint8) << land_bit)
named = np.zeros((h, w), bool)
if not M.get('air'):
    for bit, cids in (M.get('bits') or {}).items():
        missing = [c for c in cids if c not in countries]
        if missing:
            log('masks', f'警告：比特 {bit} 的国家 {missing} 不在 countries1939 中')
        g = unary_union([countries[c] for c in cids if c in countries])
        a = shapely.contains_xy(g, X, Y) & L
        named |= a
        m |= (a.astype(np.uint8) << int(bit))
    if M.get('otherLandBit') is not None:
        m |= ((L & ~named).astype(np.uint8) << int(M['otherLandBit']))
os.makedirs(os.path.join(PUBLIC, 'geo'), exist_ok=True)
m.astype(np.uint8).tofile(os.path.join(PUBLIC, 'geo', 'field_masks.bin'))
meta = {'w': w, 'h': h, 'cell': cell, 'dtype': 'uint8', 'order': 'row-major (j*w+i)', 'cellCenter': '((i+0.5)*cell, (j+0.5)*cell) 世界坐标',
        'bits': {str(land_bit): '陆地', **{str(k): '+'.join(v) for k, v in (M.get('bits') or {}).items()}, **({str(M['otherLandBit']): '其余陆地'} if M.get('otherLandBit') is not None else {})},
        'source': 'tools/geo/masks.py：countries1939 + Natural Earth 陆地，经 d3 投影后点内判定'}
json.dump(meta, open(os.path.join(PUBLIC, 'geo', 'field_masks.json'), 'w'), ensure_ascii=False, indent=1)
log('masks', f'{w}×{h}', {k: int(((m >> k) & 1).sum()) for k in range(8)})
