"""验证实际巴尔干地图产物：投影、国界、掩膜、每张瓦片与3D高程。
运行 .venv/bin/python scripts/geo/verify_geo.py 。不改变应用数据。
"""
import json, math, os, subprocess, sys
from pathlib import Path
import numpy as np
import shapely
from shapely.geometry import shape, Point
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT / 'scripts/geo'))
import proj

F = proj.FRAME
assert F['bbox'] == [12.5, 34.5, 29.5, 48.0]
subprocess.run(['node', 'scripts/geo/parity.mjs'],check=True)
subprocess.run([sys.executable, 'scripts/geo/proj.py'],check=True)
subprocess.run(['node', 'scripts/geo/preview_decode.mjs'],check=True)
vector_counts = {}
for name in ('land','countries1939','rivers','lakes','marsh','forest'):
    fc=json.loads((ROOT / f'.work/a/topo_check/{name}.geojson').read_text())
    vector_counts[name]=len(fc['features'])
    for f in fc['features']:
        if not f.get('geometry'): continue
        g=shape(f['geometry'])
        if name != 'rivers': assert g.is_valid,f'{name} {f["properties"]}: {shapely.is_valid_reason(g)}'

country_data=json.loads((ROOT / 'public/geo/balkans1940.geojson').read_text())
countries={f['properties']['id']:shape(f['geometry']) for f in country_data['features']}
checks=json.loads((ROOT / 'scripts/geo/border_testpoints.json').read_text())['points']
for name,x,y,cid in checks:
    assert countries[cid].covers(Point(x,y)),f'归属错误 {name}/{cid}'
assert len(countries['YU'].geoms) > 0

field=F['field']
m=np.fromfile(ROOT / 'public/geo/field_masks.bin',dtype=np.uint8)
assert len(m)==field['w']*field['h']
mask_counts={str(bit):int(np.count_nonzero(m & (1 << bit))) for bit in range(7)}
assert mask_counts['1']==mask_counts['2']==mask_counts['3']==0
assert not np.any((m & 1) & ((m >> 5)&1))
land=(m & 16)!=0
named=((m & 1)!=0) | ((m & 32)!=0)
assert np.array_equal((m & 64)!=0,land & ~named)
for name,x,y,bit in [('Tirana',19.819,41.328,0),('Athens',23.735,37.985,0),
                      ('Chania',24.018,35.504,0),('Belgrade',20.46,44.80,5),
                      ('Zagreb',15.981,45.815,5),('Sofia',23.322,42.697,6),
                      ('Rhodes',28.10,36.30,6)]:
    px,py=proj.forward(x,y);cell=int(py/field['cell'])*field['w']+int(px/field['cell'])
    assert m[cell] & (1 << bit),f'场掩膜错误 {name}'

meta=json.loads((ROOT / 'public/tiles/base/meta.json').read_text())
assert meta['worldWidth']==F['width'] and meta['worldHeight']==F['height']
tile_count=0
for lev in meta['levels']:
    assert lev['width'] in F['tiles']['levels']
    for x in range(lev['cols']):
        for y in range(lev['rows']):
            p=ROOT / f'public/tiles/base/{lev["z"]}/{x}_{y}.webp'
            with Image.open(p) as im:
                assert im.size == (min(512,lev['width']-512*x),min(512,lev['height']-512*y))
                im.verify()
            tile_count+=1
assert len(list((ROOT / 'public/tiles/base').rglob('*.webp')))==tile_count
terrain=json.loads((ROOT / 'public/terrain/terrain.json').read_text())
assert (terrain['worldWidth'],terrain['worldHeight'])==(F['width'],F['height'])
with Image.open(ROOT / 'public/terrain/height.png') as im:
    assert im.size==(terrain['width'],terrain['height'])
    rgb=np.asarray(im,dtype=np.uint16)
e=(rgb[...,0]*256+rgb[...,1])*terrain['scale']+terrain['offset']
assert np.isfinite(e).all() and 2000 < e.max() < 4000 and e.min()>=-60
samples={}
for name,lon,lat in [('Olympus',22.358,40.085),('Pindus',20.929,40.090),
                      ('Crete White Mountains',24.032,35.288),('Chania',24.018,35.504)]:
    px,py=proj.forward(lon,lat)
    ix=int(px*terrain['width']/F['width']);iy=int(py*terrain['height']/F['height'])
    samples[name]=float(e[iy,ix])
assert samples['Olympus']>2000 and samples['Pindus']>1500
assert samples['Crete White Mountains']>1500 and -5<=samples['Chania']<300
with Image.open(ROOT / 'public/terrain/albedo.webp') as im:
    assert im.size==(terrain['albedo']['width'],terrain['albedo']['height']); im.verify()
with Image.open(ROOT / 'public/tiles/overview.webp') as im:
    assert im.size==(2048,math.ceil(F['height']*2048/F['width'])); im.verify()

summary={'campaign':'BalkansCampaign-1941','bbox':F['bbox'],
         'worldSize':[F['width'],F['height']],'kmPerWorldUnit':F['kmPerUnit'],
         'vectorFeatures':vector_counts,'historicalOwnershipChecks':len(checks),
         'maskSize':[field['w'],field['h']],'maskCellCounts':mask_counts,
         'verifiedTiles':tile_count,'tileLevels':meta['levels'],
         'terrainSize':[terrain['width'],terrain['height']],
         'terrainElevationRange':[float(e.min()),float(e.max())],
         'elevationSamples':samples,
         'sources':country_data['meta']['sources'],
         'notes':['全部矢量多边形拓扑有效；投影一致性由parity脚本验证。',
                  '0=GR+AL，5=YU（1941-04-06启用）；AL可被希军反攻收复。',
                  '森林/湿地及NE缺失的三条河谷为标明来源的战役级示意。']}
(ROOT / 'public/geo/geo_pipeline.meta.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in summary.items() if k not in ('sources','tileLevels')},ensure_ascii=False,indent=2))
print('[verify_geo] 全部通过')
