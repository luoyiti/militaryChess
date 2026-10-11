"""Inspect the generated raster together with decoded runtime TopoJSON vectors.

Creates overview, Channel, France, northern-Britain, Netherlands, and Norway crops in
.work/a. Country/rivers/place labels are overlays here, never baked into tiles.
"""
import json, os, sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,os.path.dirname(__file__))
import proj
from geo_common import WORK,ROOT
Image.MAX_IMAGE_PIXELS=None
TC=os.path.join(WORK,'topo_check')
# Inspect the actual shipped tiles, including their natural edge dimensions.
meta=json.load(open(os.path.join(ROOT,'public/tiles/base/meta.json')))
level=meta['levels'][-1]
base=Image.new('RGB',(level['width'],level['height']))
for x in range(level['cols']):
    for y in range(level['rows']):
        with Image.open(os.path.join(ROOT,f'public/tiles/base/{level["z"]}/{x}_{y}.webp')) as tile:
            base.paste(tile,(x*meta['tileSize'],y*meta['tileSize']))
font_path='/System/Library/Fonts/Hiragino Sans GB.ttc'
fonts={}
def font(sz):
    if sz not in fonts: fonts[sz]=ImageFont.truetype(font_path,sz)
    return fonts[sz]
def load(k): return json.load(open(os.path.join(TC,k+'.geojson')))['features']
def rings(g):
    if not g: return []
    t=g['type']; c=g['coordinates']
    if t=='Polygon': return c
    if t=='MultiPolygon': return [r for p in c for r in p]
    if t=='LineString': return [c]
    if t=='MultiLineString': return c
    return []
def render(name,x0,y0,x1,y1,out_w):
    s=out_w/(x1-x0)
    # Match MapView's paper outside available imagery; keeping an unclamped crop
    # makes a source coverage gap visible instead of hiding it in this preview.
    crop=Image.new('RGB',(int(x1-x0),int(y1-y0)),'#d8cba8')
    bx0,by0=max(0,int(x0)),max(0,int(y0))
    bx1,by1=min(base.width,int(x1)),min(base.height,int(y1))
    if bx1>bx0 and by1>by0:
        crop.paste(base.crop((bx0,by0,bx1,by1)),(bx0-int(x0),by0-int(y0)))
    im=crop.resize((out_w,int((y1-y0)*s)),Image.Resampling.LANCZOS)
    dr=ImageDraw.Draw(im,'RGBA')
    P=lambda cs:[((x-x0)*s,(y-y0)*s) for x,y in cs]
    lw=max(1,int(round(1.2*s)))
    for f in load('rivers'):
        for r in rings(f['geometry']): dr.line(P(r),fill=(79,122,138,220),width=max(1,int(lw*(2.2-.4*f['properties']['rank']))))
    for f in load('countries1939'):
        col=(165,75,70,220) if f['properties']['id']=='GB' else (93,80,65,170)
        for r in rings(f['geometry']): dr.line(P(r),fill=col,width=lw+1)
    labels=json.load(open(os.path.join(ROOT,'public/geo/country_labels.json')))
    for p in labels:
        x,y=proj.forward(*p['pos'])
        if x0<x<x1 and y0<y<y1:
            X,Y=(x-x0)*s,(y-y0)*s
            sz=21 if p['rank']==1 else 15
            dr.text((X,Y),p['zh'],font=font(sz),fill=(70,58,48,220),anchor='mm',stroke_width=2,stroke_fill=(234,224,197,220))
    seen=set()
    for f in load('rivers'):
        zh=f['properties'].get('zh'); rank=f['properties']['rank']
        if not zh or zh in seen or rank>2: continue
        rs=rings(f['geometry'])
        if not rs: continue
        cs=rs[0]; m=cs[len(cs)//2]
        if x0<m[0]<x1 and y0<m[1]<y1:
            seen.add(zh); dr.text(((m[0]-x0)*s+3,(m[1]-y0)*s),zh,font=font(12),fill=(43,82,99,220))
    gzdir=os.path.join(ROOT,'src/data/gazetteer')
    places=[]
    for fn in sorted(os.listdir(gzdir)):
        if fn.endswith('.json'): places.extend(json.load(open(os.path.join(gzdir,fn))))
    for p in places:
        if p.get('rank',9)>2 or not isinstance(p.get('pos'),list): continue
        x,y=proj.forward(*p['pos'])
        if x0<x<x1 and y0<y<y1:
            X,Y=(x-x0)*s,(y-y0)*s
            dr.ellipse((X-2,Y-2,X+2,Y+2),fill=(40,34,28,255))
            dr.text((X+5,Y-12),p.get('zh',p.get('orig',p['id'])),font=font(13),fill=(35,30,25,230),stroke_width=1,stroke_fill=(234,224,197,200))
    out=os.path.join(WORK,'preview_'+name+'.png'); im.save(out)
    print('[preview]',out,im.size,flush=True)
def reg(w,s,e,n):
    x,y=proj.forward([w,e,w,e],[s,s,n,n])
    return max(0,min(x)),max(0,min(y)),min(proj.W,max(x)),min(proj.H,max(y))
render('overview',0,0,proj.W,proj.H,2048)
render('channel',*reg(-5.6,49,3.5,53),1800)
# Fixed coordinates cross the former y=8055 cutoff and compare the same area
# before/after a geographic regeneration.
render('france_south',1800,7200,7000,9400,1600)
render('northern_britain',*reg(-8.5,54,2,60.5),1500)
render('netherlands',*reg(3.2,51,6.9,54),1400)
render('norway',*reg(4.3,57.3,12.8,60.7),1600)
