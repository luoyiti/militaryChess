"""Generate real offline surrounding geography in the unchanged Crete projection.

Only writes public/tiles/context, public/terrain/context, public/geo/context.*,
.work/context and geographically addressed Terrarium cache files. Core frame,
SDF, countries, campaign data and base map are never modified.

Run: REQUESTS_CA_BUNDLE=/etc/ssl/cert.pem .venv/bin/python scripts/geo/build_context.py
Reuse verified projected DEM: add --skip-dem. Validate existing output: --verify-only.
"""
import ast
import hashlib
import io
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageDraw
import requests
from scipy import ndimage
import shapely
from shapely.geometry import box, shape, mapping, Point
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT / 'scripts/geo'))
import proj  # Reads the existing core frame; does not emit a new one.

Image.MAX_IMAGE_PIXELS = None
F = proj.FRAME
BOUNDS = [-8192, -10000, 16384, 11000]
ORIGIN = BOUNDS[:2]
WORLD_W, WORLD_H = BOUNDS[2] - BOUNDS[0], BOUNDS[3] - BOUNDS[1]
PIXEL_W = 8192
PIXEL_SCALE = PIXEL_W / WORLD_W
PIXEL_H = math.ceil(WORLD_H * PIXEL_SCALE)
LEVEL_WIDTHS = [1024, 2048, 4096, 8192]
WORK = ROOT / '.work/context'
RAW = ROOT / 'scripts/.cache/raw'
TILES = ROOT / 'public/tiles/context'
TERRAIN = ROOT / 'public/terrain/context'
GEO = ROOT / 'public/geo'
PALETTE = json.loads((ROOT / 'config/palette.json').read_text())
WORK.mkdir(parents=True, exist_ok=True)
t0 = time.monotonic()


def log(*args):
    print(f'[context {time.monotonic() - t0:6.1f}s]', *args, flush=True)


def digest(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''): h.update(b)
    return h.hexdigest()


def core_hashes():
    paths = [ROOT / 'config/frame.json', ROOT / 'public/geo/vectors.topo.json',
             ROOT / 'public/geo/field_masks.bin', ROOT / 'public/geo/field_masks.json']
    paths += list((ROOT / 'public/tiles/base').rglob('*'))
    paths += [ROOT / 'public/tiles/overview.webp']
    paths += [ROOT / 'public/terrain' / n for n in ('albedo.webp', 'height.png', 'terrain.json')]
    return {str(p.relative_to(ROOT)): digest(p) for p in paths if p.is_file()}


def edge_samples(n=512):
    a, b, c, d = BOUNDS
    xs = np.concatenate([np.linspace(a,c,n), np.full(n,c), np.linspace(c,a,n), np.full(n,a)])
    ys = np.concatenate([np.full(n,b), np.linspace(b,d,n), np.full(n,d), np.linspace(d,b,n)])
    return xs, ys


ex, ey = edge_samples()
elon, elat = proj.inverse(ex, ey)
LL_BOUNDS = [float(elon.min() - .15), float(elat.min() - .15),
             float(elon.max() + .15), float(elat.max() + .15)]
LL_CLIP = box(*LL_BOUNDS)
WORLD_CLIP = box(*BOUNDS)
FRAME_HASH = hashlib.sha256(json.dumps(F,sort_keys=True).encode()).hexdigest()
META_SOURCES = [
    {'name':'Natural Earth 1:10m physical geography',
     'url':'https://www.naturalearthdata.com/downloads/10m-physical-vectors/',
     'license':'Public domain', 'layers':['land','coastline','rivers','lakes']},
    {'name':'AWS Terrain Tiles / Terrarium z8',
     'url':'https://registry.opendata.aws/terrain-tiles/',
     'licenseUrl':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
     'attribution':'Mapzen terrain; EU-DEM/Copernicus funded by the European Union; Austria open DGM; USGS SRTM/GMTED2010; NOAA ETOPO1.',
     'tileUrl':'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
     'use':'actual elevation sampled through the unchanged conic conformal projection'},
    {'name':'Existing Crete core map', 'use':'exact world-aligned overlap and a short colour transition; never stretched outside its own extent'},
]


def load_raw(name):
    return json.loads((RAW / name).read_text())['features']


def as_polygons(g):
    if g.is_empty: return []
    if g.geom_type == 'Polygon': return [g]
    if g.geom_type == 'MultiPolygon': return list(g.geoms)
    return [p for a in getattr(g,'geoms',[]) for p in as_polygons(a)]


def as_lines(g):
    if g.is_empty: return []
    if g.geom_type in ('LineString','LinearRing'): return [g]
    return [p for a in getattr(g,'geoms',[]) for p in as_lines(a)]


def project(g):
    # Clip-generated latitude/longitude edges need intermediate vertices before
    # a conic projection; otherwise long southern edges become false sea wedges.
    g=shapely.segmentize(g,.10)
    return shapely.transform(g,lambda c: np.column_stack(proj.forward(c[:,0],c[:,1])))


def feature(g, **props):
    return {'type':'Feature','properties':props,'geometry':mapping(g)}


def write_fc(name, features):
    p = WORK / (name + '.geojson')
    p.write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
    return p


def context_vectors():
    # Physical geography only: no modern country borders or former-Yugoslav splits.
    land_ll = []
    for f in load_raw('ne_10m_land.geojson'):
        g = shape(f['geometry'])
        if g.intersects(LL_CLIP): land_ll.append(shapely.make_valid(g).intersection(LL_CLIP))
    land = shapely.make_valid(project(unary_union(land_ll))).intersection(WORLD_CLIP)
    coast = []
    for f in load_raw('ne_10m_coastline.geojson'):
        g = shape(f['geometry'])
        if g.intersects(LL_CLIP):
            g = project(g.intersection(LL_CLIP)).intersection(WORLD_CLIP)
            coast += [feature(l, source='NE 10m') for l in as_lines(g) if l.length > 1]

    # Reuse the campaign river translations without importing the executable pipeline.
    river_info = {}
    for n in ast.parse((ROOT / 'scripts/geo/02_vectors.py').read_text()).body:
        if isinstance(n,ast.Assign) and any(isinstance(a,ast.Name) and a.id=='RIV' for a in n.targets):
            river_info = ast.literal_eval(n.value)
    river_info.update({'Rhine':('Rhine','莱茵河',1),'Nile':('Nile','尼罗河',1),
                       'Volga':('Volga','伏尔加河',1),'Ural':('Ural','乌拉尔河',1),
                       'Dnieper':('Dnieper','第聂伯河',1),'Dnipro':('Dnieper','第聂伯河',1),
                       'Seine':('Seine','塞纳河',1),'Loire':('Loire','卢瓦尔河',1),
                       'Rhone':('Rhone','罗讷河',1),'Rhône':('Rhone','罗讷河',1),
                       'Don':('Don','顿河',1),'Tigris':('Tigris','底格里斯河',1),
                       'Euphrates':('Euphrates','幼发拉底河',1)})
    rivers = []
    cl_buffers = {}
    for source in ('ne_10m_rivers_lake_centerlines.geojson','ne_10m_rivers_europe.geojson'):
        for f in load_raw(source):
            if not f.get('geometry'): continue
            g=shape(f['geometry'])
            if not g.intersects(LL_CLIP): continue
            pr=f['properties']; name=pr.get('name') or ''
            info=river_info.get(name)
            rank=info[2] if info else min(4,max(1,int(pr.get('scalerank') or 2)))
            if not name or rank > 3: continue
            g=project(g.intersection(LL_CLIP)).intersection(WORLD_CLIP)
            original=info[0] if info else name
            if source.endswith('europe.geojson') and original in cl_buffers:
                g=g.difference(unary_union(cl_buffers[original]))
            for l in as_lines(g):
                if l.length>6:
                    rivers.append(feature(l,name=original,zh=info[1] if info else '',rank=rank,approx=False,source='NE 10m'))
                    if not source.endswith('europe.geojson'): cl_buffers.setdefault(original,[]).append(l.buffer(14))
    # Keep the complete historical core river set, including its labelled approximations.
    manual = ROOT / '.work/a/rivers_ll.geojson'
    if manual.exists():
        core_box=box(0,0,F['width'],F['height'])
        exterior=[]
        for f in rivers:
            g=shape(f['geometry']).difference(core_box)
            exterior += [feature(l,**f['properties']) for l in as_lines(g) if l.length>1]
        for f in json.loads(manual.read_text())['features']:
            g=project(shape(f['geometry'])).intersection(core_box)
            exterior += [feature(l,**f['properties']) for l in as_lines(g) if l.length>1]
        rivers=exterior

    # Do not introduce the large modern reservoirs into a 1941 regional atlas.
    post_names={'Lake Nasser','Lake Tisza','Batak','Iskar','Jrebchevo','Lake Kremaston',
                'Plastiras (Tavropos)','Dam','Kuybyshevskoye Vodokhranilishche',
                'Rybinskoye Vodokhranilishche','Tsimlyanskoye Vodokhranilishche',
                'Kakhovskoye Vodokhranilishche'}
    post_points=[(20.31,42.13),(19.64,42.05),(18.44,42.82),(17.03,43.68),
                 (21.95,40.22),(24.10,41.70),(25.53,41.64),(29.37,41.04),
                 (28.39,38.69),(26.74,43.06),(31.50,49.89),(27.60,49.43),
                 (29.11,47.36),(27.19,47.92),(26.06,47.01)]
    lakes = []
    kept_ll = []
    for source in ('ne_10m_lakes.geojson','ne_10m_lakes_europe.geojson'):
        for f in load_raw(source):
            if not f.get('geometry'): continue
            pr=f['properties']; g=shape(f['geometry'])
            if not g.intersects(LL_CLIP): continue
            c=g.centroid
            if pr.get('featurecla')=='Reservoir' or pr.get('name') in post_names: continue
            if any(abs(c.x-x)<.055 and abs(c.y-y)<.055 for x,y in post_points): continue
            g=shapely.make_valid(g).intersection(LL_CLIP)
            if any(g.intersection(h).area > g.area*.5 for h in kept_ll): continue
            kept_ll.append(g)
            q=shapely.make_valid(project(g)).intersection(WORLD_CLIP)
            if not q.is_empty: lakes.append(feature(q,name=pr.get('name') or '',source='NE 10m'))
    core_lakes=ROOT/'.work/a/ll/lakes.geojson'
    if core_lakes.exists():
        core_box=box(0,0,F['width'],F['height'])
        exterior=[]
        for f in lakes:
            g=shape(f['geometry']).difference(core_box)
            if not g.is_empty: exterior.append(feature(g,**f['properties']))
        for f in json.loads(core_lakes.read_text())['features']:
            g=project(shape(f['geometry'])).intersection(core_box)
            if not g.is_empty: exterior.append(feature(g,**f['properties']))
        lakes=exterior
    features = {'land':[feature(land,source='NE 10m')], 'coast':coast,
                'rivers':rivers, 'lakes':lakes}
    files=[write_fc(name,fs) for name,fs in features.items()]
    args=[str(ROOT/'node_modules/.bin/mapshaper'),'-i',*[str(p) for p in files],
          'combine-files','-simplify','planar','interval=1','keep-shapes',
          '-clean','-o',str(GEO/'context.topo.json'),'format=topojson','quantization=200000']
    subprocess.run(args,check=True)
    log('physical vectors', {n:len(fs) for n,fs in features.items()})
    return features


def fetch_dem(skip=False):
    zoom=8; n=2**zoom; tile_size=256
    def lon2x(lon): return (np.asarray(lon)+180)/360*n
    def lat2y(lat): return (1-np.arcsinh(np.tan(np.radians(np.asarray(lat))))/np.pi)/2*n
    x0,x1=int(math.floor(lon2x(LL_BOUNDS[0]))),int(math.floor(lon2x(LL_BOUNDS[2])))
    y0,y1=int(math.floor(lat2y(LL_BOUNDS[3]))),int(math.floor(lat2y(LL_BOUNDS[1])))
    key={'frameSha256':FRAME_HASH,'bounds':BOUNDS,'pixelSize':[PIXEL_W,PIXEL_H],'zoom':zoom}
    dp=WORK/'dem.npy';mp=WORK/'dem.meta.json'
    if skip and dp.exists() and mp.exists() and json.loads(mp.read_text()).get('key')==key:
        log('verified context DEM cache')
        return np.load(dp),json.loads(mp.read_text())
    cache=ROOT/f'scripts/.cache/a/terrarium/{zoom}'
    url='https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    jobs=[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]
    log('real DEM region',LL_BOUNDS,'z8 tiles',len(jobs),(x0,x1,y0,y1))
    def fetch(xy):
        x,y=xy;p=cache/str(x)/f'{y}.png'
        if p.exists() and p.stat().st_size>100:
            with Image.open(p) as im: im.verify()
            return 'cache'
        p.parent.mkdir(parents=True,exist_ok=True)
        last=''
        for i in range(5):
            try:
                r=requests.get(url.format(z=zoom,x=x,y=y),timeout=35)
                r.raise_for_status()
                with Image.open(io.BytesIO(r.content)) as im: im.verify()
                tmp=p.with_suffix('.tmp');tmp.write_bytes(r.content);tmp.replace(p)
                return 'downloaded'
            except Exception as e:
                last=str(e);time.sleep(min(2*(i+1),8))
        raise RuntimeError(f'Terrarium {x}/{y}: {last}')
    results=[]
    with ThreadPoolExecutor(12) as pool:
        for i,r in enumerate(pool.map(fetch,jobs),1):
            results.append(r)
            if i%200==0 or i==len(jobs): log('DEM source tiles',i,'/',len(jobs))
    mosaic=np.empty(((y1-y0+1)*tile_size,(x1-x0+1)*tile_size),np.float32)
    for x,y in jobs:
        a=np.asarray(Image.open(cache/str(x)/f'{y}.png').convert('RGB'),np.float32)
        mosaic[(y-y0)*tile_size:(y-y0+1)*tile_size,(x-x0)*tile_size:(x-x0+1)*tile_size]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
    coef=ndimage.spline_filter(mosaic.astype(np.float64),order=3)
    dem=np.empty((PIXEL_H,PIXEL_W),np.float32)
    wx=ORIGIN[0]+(np.arange(PIXEL_W)+.5)/PIXEL_SCALE
    for j0 in range(0,PIXEL_H,256):
        j1=min(PIXEL_H,j0+256)
        xx,yy=np.meshgrid(wx,ORIGIN[1]+(np.arange(j0,j1)+.5)/PIXEL_SCALE)
        lon,lat=proj.inverse(xx,yy)
        sx=(lon2x(lon)-x0)*tile_size-.5;sy=(lat2y(lat)-y0)*tile_size-.5
        dem[j0:j1]=ndimage.map_coordinates(coef,[sy,sx],order=3,prefilter=False,mode='nearest')
    info={'key':key,'sourceUrl':url,'sourceZoom':zoom,'sourceTileCount':len(jobs),
          'downloaded':results.count('downloaded'),'cacheHits':results.count('cache'),
          'tileExtent':{'x':[x0,x1],'y':[y0,y1]},'geographicEnvelope':LL_BOUNDS,
          'minElev':float(dem.min()),'maxElev':float(dem.max()),
          'resampling':'bicubic at projected pixel centres; no core stretching'}
    np.save(dp,dem);mp.write_text(json.dumps(info,indent=2))
    log('projected context DEM',dem.shape,info['minElev'],info['maxElev'])
    return dem,info


def raster_polygons(fs):
    im=Image.new('L',(PIXEL_W,PIXEL_H),0);dr=ImageDraw.Draw(im)
    ps=sorted([p for f in fs for p in as_polygons(shape(f['geometry']))],key=lambda p:-p.area)
    def coords(r): return [((x-ORIGIN[0])*PIXEL_SCALE,(y-ORIGIN[1])*PIXEL_SCALE) for x,y in r.coords]
    for p in ps:
        dr.polygon(coords(p.exterior),fill=255)
        for r in p.interiors: dr.polygon(coords(r),fill=0)
    return np.asarray(im,np.float32)/255


def rgb(h):
    h=h.lstrip('#');return np.array([int(h[i:i+2],16) for i in (0,2,4)],np.float32)/255


def aligned_core_image(path,source_scale=1):
    src=Image.open(path).convert('RGB')
    return np.asarray(src.transform((PIXEL_W,PIXEL_H),Image.Transform.AFFINE,
        (source_scale/PIXEL_SCALE,0,ORIGIN[0]*source_scale,
         0,source_scale/PIXEL_SCALE,ORIGIN[1]*source_scale),
        resample=Image.Resampling.BICUBIC),np.float32)


def align_existing_core(img,path,source_scale=1):
    # Exact geographic overlap; fade only the colour offset beyond the core edge.
    core=aligned_core_image(path,source_scale)
    cx0=int(math.ceil(-ORIGIN[0]*PIXEL_SCALE-.5));cx1=int(math.ceil((F['width']-ORIGIN[0])*PIXEL_SCALE-.5))
    cy0=int(math.ceil(-ORIGIN[1]*PIXEL_SCALE-.5));cy1=int(math.ceil((F['height']-ORIGIN[1])*PIXEL_SCALE-.5))
    diff=core[cy0:cy1,cx0:cx1]-img[cy0:cy1,cx0:cx1].astype(np.float32)
    diff=ndimage.gaussian_filter(diff,(4,4,0))
    # Retain actual physical geography outside: only low-frequency colour calibration.
    diff=np.clip(diff,-50,50)
    xs=np.arange(PIXEL_W);ys=np.arange(PIXEL_H)
    ix=np.clip(xs-cx0,0,cx1-cx0-1);iy=np.clip(ys-cy0,0,cy1-cy0-1)
    dx=np.maximum(np.maximum(cx0-xs,xs-(cx1-1)),0)
    dy=np.maximum(np.maximum(cy0-ys,ys-(cy1-1)),0)
    fade=np.exp(-(dy[:,None]**2+dx[None,:]**2)/(110**2)).astype(np.float32)
    out=np.clip(img.astype(np.float32)+diff[iy[:,None],ix[None,:]]*fade[...,None],0,255).astype(np.uint8)
    out[cy0:cy1,cx0:cx1]=np.clip(core[cy0:cy1,cx0:cx1],0,255).astype(np.uint8)
    log('world-aligned core overlap',cx0,cy0,cx1,cy1)
    return out


def get_core_base():
    # Stitch public tiles rather than depend on an ignored, possibly stale .work image.
    meta=json.loads((ROOT/'public/tiles/base/meta.json').read_text())
    lev=max(meta['levels'],key=lambda q:q['width'])
    im=Image.new('RGB',(lev['width'],lev['height']))
    for x in range(lev['cols']):
        for y in range(lev['rows']):
            im.paste(Image.open(ROOT/f'public/tiles/base/{lev["z"]}/{x}_{y}.webp').convert('RGB'),(x*512,y*512))
    p=WORK/'core-public-base.png';im.save(p);return p


def pad_image(im):
    pad=Image.new('RGB',(im.width,im.height+8));pad.paste(im)
    row=im.crop((0,im.height-1,im.width,im.height))
    for y in range(im.height,im.height+8): pad.paste(row,(0,y))
    return pad


def scaled_image(padded,width):
    height=math.ceil(WORLD_H*width/WORLD_W);ratio=PIXEL_W/width
    return padded.resize((width,height),Image.Resampling.LANCZOS,box=(0,0,width*ratio,height*ratio))


def render(features,dem,dem_meta):
    land=raster_polygons(features['land']);lakes=raster_polygons(features['lakes'])
    water=np.clip(1-land+lakes,0,1);land_m=water<.5
    d=np.where(land_m,np.maximum(dem,0),0).astype(np.float32)
    smooth1=ndimage.gaussian_filter(d,.65);smooth3=ndimage.gaussian_filter(d,1.15)
    wlow=np.clip((350-smooth3)/250,0,1);e=smooth1*(1-wlow)+smooth3*wlow
    paper=rgb(PALETTE['paper']['base']);plight=rgb(PALETTE['paper']['light'])
    relief=PALETTE['relief']
    stops=[(-10,(rgb(PALETTE['paper']['light'])+rgb(relief['low']))*.5),
           (60,rgb(relief['low'])),(180,rgb(relief['low'])*.7+rgb(relief['mid'])*.3),
           (350,rgb(relief['mid'])),(700,rgb(relief['mid'])*.45+rgb(relief['high'])*.55),
           (1100,rgb(relief['high'])),(1700,rgb(relief['peak'])),
           (2600,rgb(relief['peak'])*.85+plight*.15)]
    hyps=np.stack([np.interp(e,[s[0] for s in stops],[s[1][c] for s in stops]) for c in range(3)],-1).astype(np.float32)
    pixel_m=F['kmPerUnit']*1000/PIXEL_SCALE
    gy,gx=np.gradient(e*3.2/pixel_m);slope=np.hypot(gx,gy)
    def shade(az,alt):
        az,alt=math.radians(az),math.radians(alt)
        lx,ly,lz=math.sin(az)*math.cos(alt),-math.cos(az)*math.cos(alt),math.sin(alt)
        return (-gx*lx-gy*ly+lz)/np.sqrt(gx*gx+gy*gy+1)
    hs=.62*shade(315,45)+.20*shade(270,50)+.18*shade(0,55)
    delta=hs-math.sin(math.radians(45))
    relief_w=np.clip(slope/.08,0,1)**.7
    delta=np.sign(delta)*np.maximum(np.abs(delta)-.012,0)*(.35+.65*relief_w)
    rng=np.random.default_rng(1941)
    grain=rng.standard_normal((PIXEL_H,PIXEL_W)).astype(np.float32)
    coarse=rng.standard_normal((math.ceil(PIXEL_H/48)+1,math.ceil(PIXEL_W/48)+1)).astype(np.float32)
    coarse=ndimage.zoom(ndimage.gaussian_filter(coarse,1),48,order=1)[:PIXEL_H,:PIXEL_W]
    tone=.006*grain+.009*coarse/(coarse.std()+1e-6)
    dist=ndimage.distance_transform_edt(water>=.5).astype(np.float32)/PIXEL_SCALE
    t=np.clip(dist/900,0,1)**.8
    sea=rgb(PALETTE['water']['sea']);deep=rgb(PALETTE['water']['seaDeep']);lake=rgb(PALETTE['water']['lake'])
    wc=sea*(1-t[...,None])+deep*t[...,None]
    wc[(lakes>.5)&(water>=.5)]=lake
    wave=np.zeros_like(water);dk=5
    for k in range(14):
        wave += .60*(1-k/14)**1.3*np.exp(-((dist-dk)/1.3)**2)
        dk += 5.5+.9*k
    wave=np.clip(wave,0,.65)
    wc=wc*(1-wave[...,None])+rgb(PALETTE['water']['line'])*wave[...,None]
    wc*=1+.6*tone[...,None]
    coast=np.exp(-((dist-1.0)/1.5)**2)*(water>=.5)
    def compose(shading):
        base=paper*.35+hyps*.65;base*=1+tone[...,None]
        if shading: base=base*(1+.95*delta[...,None])+.10*np.maximum(delta,0)[...,None]*(plight-base)
        img=base*(1-water[...,None])+wc*water[...,None]
        img=img*(1-.55*coast[...,None])+rgb('#4f6563')*.55*coast[...,None]
        return np.clip(img*255+.5,0,255).astype(np.uint8)
    base=compose(True);albedo=compose(False)
    # Thin river ink is physical geography; the vector layer can sharpen it when zoomed.
    for arr in (base,albedo):
        im=Image.fromarray(arr);dr=ImageDraw.Draw(im)
        for f in features['rivers']:
            for line in as_lines(shape(f['geometry'])):
                cs=[((x-ORIGIN[0])*PIXEL_SCALE,(y-ORIGIN[1])*PIXEL_SCALE) for x,y in line.coords]
                dr.line(cs,fill=(97,134,141),width=1)
        arr[:]=np.asarray(im)
    log('physical geography rendered',base.shape)
    core_base=get_core_base()
    base=align_existing_core(base,core_base)
    albedo=align_existing_core(albedo,ROOT/'public/terrain/albedo.webp',.5)
    Image.fromarray(base).save(WORK/'overview-full.png')
    TILES.mkdir(parents=True,exist_ok=True);TERRAIN.mkdir(parents=True,exist_ok=True)
    padded=pad_image(Image.fromarray(base))
    levels=[]
    for z,width in enumerate(LEVEL_WIDTHS):
        im=scaled_image(padded,width);height=im.height;cols,rows=math.ceil(width/512),math.ceil(height/512)
        level_dir=TILES/str(z);shutil.rmtree(level_dir,ignore_errors=True);level_dir.mkdir()
        for x in range(cols):
            for y in range(rows):
                im.crop((x*512,y*512,min(width,(x+1)*512),min(height,(y+1)*512))).save(level_dir/f'{x}_{y}.webp','WEBP',quality=85,method=6)
        levels.append({'z':z,'width':width,'height':height,'cols':cols,'rows':rows,
                       'scale':width/WORLD_W,'rightEdgeWidth':width-(cols-1)*512,
                       'bottomEdgeHeight':height-(rows-1)*512})
        log('tiles',z,width,height,cols*rows)
    scaled_image(padded,2048).save(TILES/'overview.webp','WEBP',quality=85,method=6)
    alb=scaled_image(pad_image(Image.fromarray(albedo)),4096)
    alb.save(TERRAIN/'albedo.webp','WEBP',quality=85,method=6)
    hw=1024;hh=math.ceil(WORLD_H*hw/WORLD_W);step=PIXEL_W//hw
    elev=np.where(land_m,dem,np.minimum(dem,-1.0));elev=np.maximum(elev,-60)
    padded_e=np.pad(elev,((0,hh*step-PIXEL_H),(0,0)),mode='edge')
    eh=padded_e.reshape(hh,step,hw,step).mean((1,3))
    v=np.clip(np.round((eh+100)*4),0,65535).astype(np.uint16)
    enc=np.zeros((hh,hw,3),np.uint8);enc[...,0]=v>>8;enc[...,1]=v&255
    Image.fromarray(enc).save(TERRAIN/'height.png',optimize=True)
    terrain={'origin':ORIGIN,'bounds':BOUNDS,'worldWidth':WORLD_W,'worldHeight':WORLD_H,
             'width':hw,'height':hh,'encoding':'rg16','scale':.25,'offset':-100,
             'pixelWorldSize':WORLD_W/hw,'minElev':round(float(eh.min()),2),'maxElev':round(float(eh.max()),2),
             'formula':'elev_m=(R*256+G)*0.25-100; world=(originX+i*24,originY+j*24); bottom fractional row padded at edge',
             'albedo':{'src':'terrain/context/albedo.webp','width':alb.width,'height':alb.height},
             'projection':F['projection'],'frameSha256':FRAME_HASH,'sources':META_SOURCES}
    (TERRAIN/'terrain.json').write_text(json.dumps(terrain,ensure_ascii=False,indent=2))
    metadata={'origin':ORIGIN,'bounds':BOUNDS,'worldWidth':WORLD_W,'worldHeight':WORLD_H,
              'tileSize':512,'format':'webp','path':'tiles/context/{z}/{x}_{y}.webp','levels':levels,
              'overview':'tiles/context/overview.webp','vector':'geo/context.topo.json',
              'projection':F['projection'],'frameSha256':FRAME_HASH,'geographicEnvelope':LL_BOUNDS,
              'sources':META_SOURCES,'elevation':dem_meta,
              'coordinateConvention':'image pixels map to unchanged core world=(originX+x/level.scale,originY+y/level.scale)',
              'constraints':['Physical geography only; no modern country borders or Yugoslav internal divisions.',
                             'All surrounding pixels use real projected NE land/water and Terrarium elevation.',
                             'Existing core map appears only at its true world extent; low-frequency colour offset fades outside that extent.',
                             'Core frame, SDF, campaign coordinates, base tiles and core 3D assets remain byte-identical.']}
    (TILES/'meta.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
    topo=json.loads((GEO/'context.topo.json').read_text())
    (GEO/'context.meta.json').write_text(json.dumps({'origin':ORIGIN,'bounds':BOUNDS,'frameSha256':FRAME_HASH,
        'objects':{n:len(o['geometries']) for n,o in topo['objects'].items()},
        'sourceFeatureCounts':{n:len(fs) for n,fs in features.items()},'sources':META_SOURCES,'geographicEnvelope':LL_BOUNDS,
        'note':'All geometry is preprojected into unchanged core world coordinates; origin is for images only.'},ensure_ascii=False,indent=2))
    log('3D context',hw,hh,terrain['minElev'],terrain['maxElev'])


def verify():
    meta=json.loads((TILES/'meta.json').read_text())
    assert meta['origin']==ORIGIN and meta['bounds']==BOUNDS
    count=0
    for lev in meta['levels']:
        assert lev['scale']==lev['width']/WORLD_W
        assert lev['height']==math.ceil(WORLD_H*lev['scale'])
        files=list((TILES/str(lev['z'])).glob('*.webp'))
        assert len(files)==lev['cols']*lev['rows']
        for x in range(lev['cols']):
            for y in range(lev['rows']):
                with Image.open(TILES/str(lev['z'])/f'{x}_{y}.webp') as im:
                    assert im.size==(min(512,lev['width']-512*x),min(512,lev['height']-512*y))
                    im.verify()
                count+=1
    terrain=json.loads((TERRAIN/'terrain.json').read_text())
    with Image.open(TERRAIN/'height.png') as im:
        assert im.size==(terrain['width'],terrain['height']);im.verify()
    with Image.open(TERRAIN/'albedo.webp') as im:
        assert im.size==(terrain['albedo']['width'],terrain['albedo']['height']);im.verify()
    decode_code="import fs from'node:fs';import{feature}from'topojson-client';let t=JSON.parse(fs.readFileSync('public/geo/context.topo.json','utf8')),o={};for(let n of Object.keys(t.objects))o[n]=feature(t,t.objects[n]);process.stdout.write(JSON.stringify(o));"
    decoded=json.loads(subprocess.run(['node','--input-type=module','-e',decode_code],text=True,capture_output=True,check=True).stdout)
    assert set(decoded)=={'land','coast','rivers','lakes'},'Context must contain physical geography only'
    vector_counts={n:len(fc['features']) for n,fc in decoded.items()}
    for n,fc in decoded.items():
        for f in fc['features']:
            if f.get('geometry'): assert shape(f['geometry']).is_valid,f'Invalid context {n} geometry'
    # Compare the rendered land topology to the original geographic source,
    # including southern corners. This catches curved clipping edges becoming
    # straight chords after projection even when their geometry stays valid.
    land_ll=unary_union([shapely.make_valid(shape(f['geometry'])) for f in load_raw('ne_10m_land.geojson')])
    land_xy=unary_union([shape(f['geometry']) for f in decoded['land']['features']])
    world_points=[(BOUNDS[0]+2,BOUNDS[1]+2),(BOUNDS[2]-2,BOUNDS[1]+2),
                  (BOUNDS[0]+2,BOUNDS[3]-2),(BOUNDS[2]-2,BOUNDS[3]-2)]
    world_points += [(ORIGIN[0]+(i+.5)*WORLD_W/16,ORIGIN[1]+(j+.5)*WORLD_H/11)
                     for i in range(16) for j in range(11)]
    for x,y in world_points:
        lon,lat=proj.inverse(x,y)
        assert land_ll.covers(Point(lon,lat))==land_xy.covers(Point(x,y)),f'Physical land mismatch world {x}/{y}'
    # Verify corners, centre and core landmarks through the same D3 projection used by the UI.
    pts=[(BOUNDS[0],BOUNDS[1]),(BOUNDS[2],BOUNDS[1]),(BOUNDS[0],BOUNDS[3]),(BOUNDS[2],BOUNDS[3]),
         ((BOUNDS[0]+BOUNDS[2])/2,(BOUNDS[1]+BOUNDS[3])/2),(0,0),(F['width'],F['height'])]
    checks=[]
    for x,y in pts:
        lon,lat=proj.inverse(x,y);fx,fy=proj.forward(lon,lat)
        assert math.hypot(fx-x,fy-y)<1e-6
        checks.append({'world':[x,y],'lonlat':[float(lon),float(lat)]})
    code="import{geoConicConformal}from'd3-geo';import fs from'node:fs';let a=JSON.parse(fs.readFileSync(0,'utf8')),f=a.frame,p=geoConicConformal().parallels(f.projection.parallels).rotate(f.projection.rotate).center(f.projection.center).scale(f.scale).translate(f.translate);process.stdout.write(JSON.stringify(a.points.map(q=>p(q.lonlat))));"
    r=subprocess.run(['node','--input-type=module','-e',code],input=json.dumps({'frame':F,'points':checks}),text=True,capture_output=True,check=True)
    xy=json.loads(r.stdout)
    err=max(math.hypot(a[0]-b['world'][0],a[1]-b['world'][1]) for a,b in zip(xy,checks))
    assert err<1e-6
    # Fresh NE geography must be visible at each side; imagery is neither empty nor repeated core tiles.
    for z in [3]:
        lev=meta['levels'][z]
        for x,y in [(0,0),(lev['cols']-1,0),(0,lev['rows']-1),(lev['cols']-1,lev['rows']-1),(8,5)]:
            a=np.asarray(Image.open(TILES/str(z)/f'{x}_{y}.webp'))
            assert a.mean()>40 and a.std()>.05,f'empty context tile {x}/{y}'
    report={'verifiedTileCount':count,'worldBounds':BOUNDS,'worldOrigin':ORIGIN,
            'D3ProjectionMaxError':err,'projectionChecks':checks,'terrainSize':[terrain['width'],terrain['height']],
            'terrainElevationRange':[terrain['minElev'],terrain['maxElev']],
            'coreFrameSha256':FRAME_HASH,'geographicEnvelope':LL_BOUNDS,
            'noCountryBorders':True,'realElevationTiles':meta['elevation']['sourceTileCount'],
            'physicalVectorCounts':vector_counts,'sourceLandChecks':len(world_points)}
    (GEO/'context.verify.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    log('verification passed',count,'tiles; D3 error',err)
    return report


if __name__=='__main__':
    assert F['width']==8192 and F['bbox']==[23.35,34.7,26.5,35.85]
    before=core_hashes()
    if '--verify-only' not in sys.argv:
        features=context_vectors()
        dem,dem_meta=fetch_dem('--skip-dem' in sys.argv)
        render(features,dem,dem_meta)
    report=verify()
    after=core_hashes()
    assert after==before,'Core geography mutated while generating context'
    report['coreAssetsByteIdentical']=True
    (GEO/'context.verify.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    log('core geography byte-identical',len(before),'files')
