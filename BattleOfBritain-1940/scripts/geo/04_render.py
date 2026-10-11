"""Offline parchment / real-DEM map for the Britain theatre.

Same visual grammar as the copied Poland renderer: paper fibres and quiet folds,
hypsometric tint, three-direction terrain shade, engraved coastal water contours,
and approximate woodland/wetland texture. Compose row strips to keep peak memory
bounded on the frame's actual dimensions. Borders, rivers and labels remain editable vectors.
Output contracts: four512px WebP LODs, overview,4096px albedo,1024px rg16 terrain.
"""
import gc, json, math, os, sys, time
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
sys.path.insert(0,os.path.dirname(__file__))
import proj
from geo_common import WORK, ROOT
Image.MAX_IMAGE_PIXELS=None
t0=time.time(); F=proj.FRAME; W,H=F['width'],F['height']
PAL=json.load(open(os.path.join(ROOT,'config/palette.json')))
XY=os.path.join(WORK,'xy'); BLOCK=256

def log(*a): print(f'[render {time.time()-t0:6.1f}s]',*a,flush=True)
def rgb(s):
    return np.array([int(s.lstrip('#')[i:i+2],16) for i in (0,2,4)],np.float32)/255

def raster(name,aa=False):
    scale=2 if aa else 1
    im=Image.new('L',(W*scale,H*scale),0); dr=ImageDraw.Draw(im)
    ps=[]
    for f in json.load(open(os.path.join(XY,name+'.geojson')))['features']:
        g=f['geometry']; cs=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
        for p in cs:
            a=np.array(p[0]); area=abs(np.sum(a[:-1,0]*a[1:,1]-a[1:,0]*a[:-1,1]))/2
            ps.append((area,p))
    for _,p in sorted(ps,key=lambda x:-x[0]):
        dr.polygon([(x*scale,y*scale) for x,y in p[0]],fill=255)
        for ring in p[1:]: dr.polygon([(x*scale,y*scale) for x,y in ring],fill=0)
    if scale>1: im=im.resize((W,H),Image.Resampling.BOX)
    return np.asarray(im).copy()

land=raster('land_render',True); lakes=raster('lakes',True)
marsh=raster('marsh'); forest=raster('forest')
land_m=(land.astype(np.int16)-lakes.astype(np.int16))>127
water_m=~land_m
log('coasts/lakes/forest/wetland rasterized')
# Global distances keep the coastal contours seamless across strips/tiles.
dist=ndimage.distance_transform_edt(water_m).astype(np.float32)
log('coastal distances')
dem=np.load(os.path.join(WORK,'dem_8192.npy'),mmap_mode='r')
assert dem.shape==(H,W)
dsm=np.lib.format.open_memmap(os.path.join(WORK,'dem_smooth.npy'),mode='w+',dtype='float32',shape=(H,W))
for j in range(0,H,BLOCK):
    e=min(H,j+BLOCK); a=max(0,j-16); b=min(H,e+16)
    d=np.where(land_m[a:b],np.maximum(dem[a:b],0),0).astype(np.float32)
    ds1=ndimage.gaussian_filter(d,1); ds3=ndimage.gaussian_filter(d,3)
    low=np.clip((350-ds3)/250,0,1)
    dsm[j:e]=(ds1*(1-low)+ds3*low)[j-a:e-a]
dsm.flush(); del d,ds1,ds3,low
log('real DEM smoothed')

# Small globally sampled paper fields; row-strip composition has no seams.
noise_cache={}
def noise(j,e,scale,seed,aniso=1):
    key=(scale,seed,aniso)
    if key not in noise_cache:
        r=np.random.default_rng(seed)
        a=r.standard_normal((math.ceil(H/scale)+4,math.ceil(W/scale)+4)).astype(np.float32)
        a=ndimage.gaussian_filter(a,(1,aniso)); a/=a.std()+1e-6
        noise_cache[key]=a
    yy,xx=np.meshgrid(np.arange(j,e,dtype=np.float32)/scale+1,np.arange(W,dtype=np.float32)/scale+1,indexing='ij')
    return ndimage.map_coordinates(noise_cache[key],[yy,xx],order=1,mode='nearest')

paper=rgb(PAL['paper']['base']); plight=rgb(PAL['paper']['light']); pdark=rgb(PAL['paper']['dark'])
R=PAL['relief']; stops=[(-10,rgb(PAL['paper']['light'])*.5+rgb(R['low'])*.5),(60,rgb(R['low'])),
 (180,rgb(R['low'])*.7+rgb(R['mid'])*.3),(350,rgb(R['mid'])),(700,rgb(R['mid'])*.45+rgb(R['high'])*.55),
 (1100,rgb(R['high'])),(1700,rgb(R['peak'])),(2600,rgb(R['peak'])*.85+plight*.15)]
ev=np.array([t[0] for t in stops],np.float32)
sea_col=rgb(PAL['water']['sea']); deep_col=rgb(PAL['water']['seaDeep']); lake_col=rgb(PAL['water']['lake']); wave_col=rgb(PAL['water']['line'])
coast_col=rgb('#4f6563'); fold_col=rgb(PAL['paper']['fold'])
rng=np.random.default_rng(1940)
stains=[(rng.uniform(.05,.95)*W,rng.uniform(.05,.95)*H,rng.uniform(180,700),rng.uniform(.6,1.2),rng.uniform(.4,1)) for _ in range(9)]
foxes=[(rng.uniform(0,W),rng.uniform(0,H),rng.uniform(2,9),rng.uniform(.3,1)) for _ in range(200)]
fibre=ndimage.gaussian_filter1d(np.random.default_rng(1).standard_normal(H).astype(np.float32),.7)
fibre/=fibre.std()+1e-6
wave_dist=[]; value=5
for k in range(14): wave_dist.append(value); value+=5.5+.9*k

def smooth_mask(a,j,e,sigma):
    halo=math.ceil(4*sigma); start=max(0,j-halo); end=min(H,e+halo)
    return ndimage.gaussian_filter(a[start:end].astype(np.float32)/255,sigma)[j-start:e-start]

def compose(j,e,with_shade=True,paper_amt=1):
    yy,xx=np.meshgrid(np.arange(j,e,dtype=np.float32),np.arange(W,dtype=np.float32),indexing='ij')
    ds=np.asarray(dsm[j:e])
    hyps=np.stack([np.interp(ds,ev,[t[1][c] for t in stops]) for c in range(3)],axis=-1).astype(np.float32)
    mott=.6*noise(j,e,48,3)+.4*noise(j,e,160,4)
    grain=np.random.default_rng(1940+j).standard_normal((e-j,W)).astype(np.float32)
    tone=.010*fibre[j:e,None]+.011*mott+.006*grain
    base=(paper*.35+hyps*.65)*(1+tone[...,None]*paper_amt)
    if with_shade:
        a=max(0,j-1); b=min(H,e+1)
        gy,gx=np.gradient(np.asarray(dsm[a:b])*3.2/(F['kmPerUnit']*1000))
        gx=gx[j-a:e-a]; gy=gy[j-a:e-a]
        norm=np.sqrt(gx*gx+gy*gy+1)
        def shade(az,alt):
            az,alt=math.radians(az),math.radians(alt)
            return (-gx*math.sin(az)*math.cos(alt)+gy*math.cos(az)*math.cos(alt)+math.sin(alt))/norm
        delta=.62*shade(315,45)+.20*shade(270,50)+.18*shade(0,55)-math.sin(math.radians(45))
        rw=np.clip(np.hypot(gx,gy)/.08,0,1)**.7
        delta=np.sign(delta)*np.maximum(abs(delta)-.012,0)*(.35+.65*rw)
        base=base*(1+.95*delta[...,None])+.10*np.maximum(delta,0)[...,None]*(plight-base)
    ftint=smooth_mask(forest,j,e,7)*land_m[j:e]
    ftex=np.zeros((e-j,W),np.float32)
    # Deterministic little tree glyphs, anchored in world space.
    for row in range((j//11)*11+5,e,11):
        if row<j or row>=e: continue
        offset=(row*7)%11
        for dy,dx,alpha in [(0,0,1),(-1,0,.8),(1,0,.6),(0,-1,.8),(0,1,.8),(-2,0,.5),(2,0,.45)]:
            y=row+dy-j
            if 0<=y<e-j: ftex[y,5+offset+dx:W-3:11]=alpha
    ftex=ndimage.gaussian_filter(ftex,.5)*np.clip(smooth_mask(forest,j,e,4)*1.4-.2,0,1)*land_m[j:e]
    base=base*(1-.22*ftint[...,None])+np.array([.76,.78,.58],np.float32)*.22*ftint[...,None]
    base=base*(1-.34*ftex[...,None])+np.array([.42,.47,.30],np.float32)*.34*ftex[...,None]
    mtint=smooth_mask(marsh,j,e,6)*land_m[j:e]
    mtex=(((yy.astype(np.int32)%9)==0)&((xx.astype(np.int32)+yy.astype(np.int32)*3)%17<7)).astype(np.float32)
    mtex=ndimage.gaussian_filter(mtex,.45)*smooth_mask(marsh,j,e,2)*land_m[j:e]
    base=base*(1-.07*mtint[...,None])+np.array([.62,.70,.66],np.float32)*.07*mtint[...,None]
    base=base*(1-.55*mtex[...,None])+np.array([.36,.47,.49],np.float32)*.55*mtex[...,None]
    dd=dist[j:e]
    deep=np.clip(dd/900,0,1)**.8
    wc=sea_col*(1-deep[...,None])+deep_col*deep[...,None]
    is_lake=(lakes[j:e]>127)&water_m[j:e]
    wc[is_lake]=lake_col
    waves=np.zeros((e-j,W),np.float32)
    for k,dk in enumerate(wave_dist):
        waves+=.60*(1-k/len(wave_dist))**1.3*np.exp(-((dd-dk)/.62)**2)
    waves*=np.clip(.75+.5*noise(j,e,24,11),0,1)*np.where(is_lake,.8,1)
    waves=np.clip(waves,0,.75); waves[is_lake&(dd>wave_dist[2]+2)]=0
    wc=wc*(1+.6*tone[...,None]*paper_amt)
    wc=wc*(1-waves[...,None])+wave_col*waves[...,None]
    water=np.clip(1-land[j:e].astype(np.float32)/255+lakes[j:e].astype(np.float32)/255,0,1)[...,None]
    im=base*(1-water)+wc*water
    coast=np.exp(-((dd-1)/.9)**2)*water_m[j:e]
    im=im*(1-.55*coast[...,None])+coast_col*.55*coast[...,None]
    stain=np.zeros((e-j,W),np.float32)
    for cx,cy,rr,aniso,alpha in stains:
        d=np.hypot((xx-cx)/rr,(yy-cy)/(rr*aniso))
        stain+=(np.exp(-((d-1)/.06)**2)*.7+np.exp(-(d/.9)**4)*.35)*alpha
    stain*=.6+.4*(mott>0)
    im=im*(1-.07*stain[...,None]*paper_amt)+np.array([.80,.68,.45],np.float32)*.07*stain[...,None]*paper_amt
    fox=np.zeros((e-j,W),np.float32)
    for cx,cy,rr,alpha in foxes:
        if j-30<cy<e+30:
            fox+=np.exp(-((xx-cx)**2+(yy-cy)**2)/(2*rr*rr))*alpha
    im=im*(1-.22*np.clip(fox,0,1)[...,None]*paper_amt)+np.array([.62,.47,.30],np.float32)*.22*np.clip(fox,0,1)[...,None]*paper_amt
    vx,vy=(xx/W-.5)*2,(yy/H-.5)*2
    vig=np.clip(np.maximum(abs(vx)**3,abs(vy)**3)*.6+(vx*vx+vy*vy)*.12,0,1)
    im=im*(1-.30*vig[...,None]*paper_amt)+pdark*.30*vig[...,None]*paper_amt
    fold=np.zeros((e-j,W),np.float32); fhl=np.zeros_like(fold)
    for fx in (W/3,2*W/3):
        wob=fx+3*np.sin(yy/311+fx); dd=xx-wob
        var=.75+.25*np.sin(yy/163+fx)
        fold+=(np.exp(-(dd/1.6)**2)+np.exp(-(dd/14)**2)*.25)*var
        fhl+=np.exp(-((dd-4)/3)**2)*var
    for fy in (H/3,2*H/3):
        wob=fy+3*np.sin(xx/311+fy); dd=yy-wob
        var=.75+.25*np.sin(xx/163+fy)
        fold+=(np.exp(-(dd/1.6)**2)+np.exp(-(dd/14)**2)*.25)*var
        fhl+=np.exp(-((dd-4)/3)**2)*var
    im=im*(1-.28*np.clip(fold,0,1)[...,None]*paper_amt)+fold_col*.28*np.clip(fold,0,1)[...,None]*paper_amt
    im+=.035*np.clip(fhl,0,1)[...,None]*paper_amt
    return np.clip(im*255+.5,0,255).astype(np.uint8)

full=np.lib.format.open_memmap(os.path.join(WORK,'base_rgb.npy'),mode='w+',dtype='uint8',shape=(H,W,3))
albedo=np.lib.format.open_memmap(os.path.join(WORK,'albedo_rgb.npy'),mode='w+',dtype='uint8',shape=(H,W,3))
for j in range(0,H,BLOCK):
    e=min(H,j+BLOCK)
    full[j:e]=compose(j,e,True,1)
    albedo[j:e]=compose(j,e,False,.45)
    if j%1024==0 or e==H: log('composed rows',e,'/',H)
full.flush(); albedo.flush(); gc.collect()
im_full=Image.fromarray(full)
im_full.save(os.path.join(WORK,'base_8192.png'))
log('full base image saved')
TD=os.path.join(ROOT,'public/tiles/base'); os.makedirs(TD,exist_ok=True)
T=F['tiles']['size']; meta={'tileSize':T,'format':'webp','path':'tiles/base/{z}/{x}_{y}.webp','worldWidth':W,'worldHeight':H,
 'note':'Edge tiles are not padded; world position=(pixel/scale). All assets are offline.','levels':[]}
for z,wz in enumerate(F['tiles']['levels']):
    hz=math.ceil(H*wz/W); im=im_full if wz==W else im_full.resize((wz,hz),Image.Resampling.LANCZOS)
    cols,rows=math.ceil(wz/T),math.ceil(hz/T); path=os.path.join(TD,str(z)); os.makedirs(path,exist_ok=True)
    for x in range(cols):
        for y in range(rows):
            im.crop((x*T,y*T,min(wz,(x+1)*T),min(hz,(y+1)*T))).save(os.path.join(path,f'{x}_{y}.webp'),'WEBP',quality=82,method=6)
    meta['levels'].append({'z':z,'width':wz,'height':hz,'cols':cols,'rows':rows,'scale':wz/W})
    log('LOD',z,wz,hz,cols*rows,'tiles')
json.dump(meta,open(os.path.join(TD,'meta.json'),'w'),ensure_ascii=False,indent=2)
im_full.resize((2048,math.ceil(H*2048/W)),Image.Resampling.LANCZOS).save(os.path.join(ROOT,'public/tiles/overview.webp'),'WEBP',quality=82,method=6)
TR=os.path.join(ROOT,'public/terrain'); os.makedirs(TR,exist_ok=True)
Image.fromarray(albedo).resize((4096,math.ceil(H*4096/W)),Image.Resampling.LANCZOS).save(os.path.join(TR,'albedo.webp'),'WEBP',quality=82,method=6)
hw=1024; hh=math.ceil(H*hw/W); factor=W//hw
height=np.zeros((hh,hw),np.float32)
for y in range(hh):
    j=y*factor; e=min(H,j+factor)
    a=np.where(land_m[j:e],np.maximum(dem[j:e],0),np.minimum(dem[j:e],-1))
    a=np.clip(a,-60,None)
    if e-j<factor: a=np.pad(a,((0,factor-(e-j)),(0,0)),mode='edge')
    height[y]=a.reshape(factor,hw,factor).mean((0,2))
v=np.clip(np.round((height+100)*4),0,65535).astype(np.uint16)
rgb_h=np.zeros((hh,hw,3),np.uint8); rgb_h[...,0]=v>>8; rgb_h[...,1]=v&255
Image.fromarray(rgb_h).save(os.path.join(TR,'height.png'),optimize=True)
source=json.load(open(os.path.join(WORK,'dem_source.json')))
json.dump({'width':hw,'height':hh,'worldWidth':W,'worldHeight':H,'encoding':'rg16','scale':.25,'offset':-100,
 'minElev':float(np.round(height.min(),1)),'maxElev':float(np.round(height.max(),1)),
 'formula':'elev_m=(R*256+G)*scale+offset; sea clamped at -60m; source mean over8x8 world pixels',
 'albedo':{'src':'terrain/albedo.webp','width':4096,'height':math.ceil(H*4096/W)},
 'demSource':source},open(os.path.join(TR,'terrain.json'),'w'),ensure_ascii=False,indent=2)
log('terrain exported',hw,hh,'elevation',float(height.min()),float(height.max()))
