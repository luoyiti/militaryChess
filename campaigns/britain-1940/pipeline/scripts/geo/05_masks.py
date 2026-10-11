"""Offline geographic mask: only bit4=land; air-control fields may overlap at sea.

Uint8 row-major, one cell-center sample per frame.field cell. No country,
occupation, front, or allegiance semantics are encoded in this static mask.
"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape
from shapely.ops import unary_union
sys.path.insert(0,os.path.dirname(__file__))
import proj
from geo_common import WORK, ROOT
F=proj.FRAME['field']; w,h,cell=F['w'],F['h'],F['cell']
land=shapely.make_valid(shape(json.load(open(os.path.join(WORK,'xy/land_render.geojson')))['features'][0]['geometry']))
lakes=unary_union([shapely.make_valid(shape(f['geometry'])) for f in json.load(open(os.path.join(WORK,'xy/lakes.geojson')))['features']])
land=land.difference(lakes)
jj,ii=np.mgrid[0:h,0:w]
L=shapely.contains_xy(land,(ii+.5)*cell,(jj+.5)*cell)
m=(L.astype(np.uint8)<<4)
m.tofile(os.path.join(ROOT,'public/geo/field_masks.bin'))
json.dump({'w':w,'h':h,'cell':cell,'dtype':'uint8','order':'row-major (j*w+i)',
 'cellCenter':'((i+0.5)*cell,(j+0.5)*cell) world coordinates','bits':{'4':'陆地'},
 'airFields':'空战强度与拦截区不按陆地/国别裁切，允许双方重叠并跨越海面。',
 'source':'Natural Earth 10m with 1940 Dutch coast correction; D3 projected cell-center test'},
 open(os.path.join(ROOT,'public/geo/field_masks.json'),'w'),ensure_ascii=False,indent=2)
assert set(np.unique(m)).issubset({0,16})
print('[masks]',w,'x',h,'land cells',int(L.sum()),'sea cells',int((~L).sum()),'only bit4',flush=True)
