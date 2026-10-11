"""Check actual emitted offline asset dimensions, terrain samples and sea masks."""
import json,os,sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(__file__))
import proj
from geo_common import ROOT,WORK
F=proj.FRAME
base=Path(ROOT)/'public'
meta=json.loads((base/'tiles/base/meta.json').read_text())
assert (meta['worldWidth'],meta['worldHeight'])==(F['width'],F['height'])
tile_count=0
for level in meta['levels']:
    z,w,h=level['z'],level['width'],level['height']
    for x in range(level['cols']):
        for y in range(level['rows']):
            p=base/f'tiles/base/{z}/{x}_{y}.webp'
            expected=(min(512,w-x*512),min(512,h-y*512))
            with Image.open(p) as im:
                assert im.size==expected,(p,im.size,expected)
                im.verify()
            tile_count+=1
assert tile_count==sum(a['cols']*a['rows'] for a in meta['levels'])
assert len(meta['levels'])==4
for rel,w in [('tiles/overview.webp',2048),('terrain/albedo.webp',4096),('terrain/height.png',1024)]:
    with Image.open(base/rel) as im:
        assert im.size==(w,int(np.ceil(F['height']*w/F['width'])))
terrain=json.loads((base/'terrain/terrain.json').read_text())
a=np.asarray(Image.open(base/'terrain/height.png'),np.float32)
height=(a[...,0]*256+a[...,1])*.25-100
assert terrain['encoding']=='rg16' and height.max()>1200
# Actual mountains versus Channel: catches constant/fake or wrongly projected DEM.
D=np.load(Path(WORK)/'dem_8192.npy',mmap_mode='r')
assert D.shape==(F['height'],F['width'])
# France must remain textured below the former y=8055 raster cutoff. A short
# frame could pass all tile-dimension checks while leaving real rivers on paper.
france_samples=[('Orleans',1.9039,47.9025,50,160),
                ('Puy de Dome',2.9646,45.7723,1100,1600),
                ('Lyon',4.8357,45.764,100,400),
                ('Mont Blanc',6.865,45.832,4000,5000)]
for name,lon,lat,_,_ in france_samples:
    x,y=proj.forward(lon,lat)
    assert 0<=x<F['width'] and 0<=y<F['height'],(name,'outside offline terrain',float(x),float(y))
observed={}
for name,lon,lat,low,high in [('Ben Nevis',-5.0037,56.7969,1100,1600),('Snowdon',-4.076,53.068,900,1300),
                            ('Dover inland',1.27,51.15,0,250),*france_samples]:
    x,y=proj.forward(lon,lat); z=float(D[int(y),int(x)])
    observed[name]=round(z,1)
    assert low<z<high,(name,z)
m=np.fromfile(base/'geo/field_masks.bin',dtype=np.uint8)
assert m.size==F['field']['w']*F['field']['h'] and set(np.unique(m)).issubset({0,16})
m=m.reshape(F['field']['h'],F['field']['w'])
for name,lon,lat,land in [('London',-.1276,51.5072,True),('Channel',.4,50.1,False),('North Sea',3.5,55.5,False),
                          ('IJsselmeer original water',5.3,52.8,False),
                          ('Flevoland before reclamation',5.4,52.5,False),('Oslo inland',10.75,59.94,True),
                          ('Orleans',1.9039,47.9025,True),('Lyon',4.8357,45.764,True),
                          ('Bay of Biscay',-3,46.5,False)]:
    x,y=proj.forward(lon,lat); b=bool(m[int(y//16),int(x//16)]&16)
    assert b==land,(name,b)
topo=json.loads((base/'geo/vectors.topo.json').read_text())
assert set(topo['objects'])=={'land','countries1939','rivers','lakes','marsh','forest'}
assert all(g.get('type') for obj in topo['objects'].values() for g in obj['geometries'])
ids={g['properties']['id'] for g in topo['objects']['countries1939']['geometries']}
assert {'GB','FR','BE','NL','DK','NO','DE'}.issubset(ids)
assert all(g['properties'].get('boundaryRole')=='fixed-national-context' for g in topo['objects']['countries1939']['geometries'])
scale=np.asarray(topo['transform']['scale']); translate=np.asarray(topo['transform']['translate'])
vmin=np.array([np.inf,np.inf]); vmax=-vmin
for arc in topo['arcs']:
    xy=np.cumsum(arc,axis=0)*scale+translate
    vmin=np.minimum(vmin,xy.min(axis=0)); vmax=np.maximum(vmax,xy.max(axis=0))
assert np.all(vmin>=-.01) and np.all(vmax<=np.array([F['width'],F['height']])+.01),('vectors outside raster canvas',vmin,vmax)
report={'frame':[F['width'],F['height']],'tiles':tile_count,'lods':meta['levels'],'field':[F['field']['w'],F['field']['h']],
        'maskValues':[int(n) for n in np.unique(m)],'demSamplesMeters':observed,'terrainElevation':[float(height.min()),float(height.max())],
        'topoObjects':list(topo['objects']),'vectorBounds':[vmin.tolist(),vmax.tolist()],
        'countries':sorted(ids),'offline':True}
json.dump(report,open(Path(WORK)/'verification.json','w'),ensure_ascii=False,indent=2)
print('[verify]',json.dumps(report,ensure_ascii=False),flush=True)
