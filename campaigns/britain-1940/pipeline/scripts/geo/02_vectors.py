"""Natural Earth vectors for the Britain theatre, in WGS84 before D3 projection.

Land/coasts and named rivers are sourced geometry. Small forest/wetland envelopes
are explicitly approximate cartographic context; modern reservoirs are excluded.
The lake/land substrate omits Dutch polders first reclaimed after 1940.
"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape, box, Point
from shapely.ops import unary_union, linemerge
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *
from historical_geo import land1940, polder_mask, historic_islands
import proj

# Entire actual conic canvas, not only the lon/lat contract rectangle.
CLIP = REGION
LL = os.path.join(WORK, 'll')
os.makedirs(LL, exist_ok=True)
RIV = {
 'Thames': ('Thames','泰晤士河',1), 'Severn': ('Severn','塞文河',1), 'Trent': ('Trent','特伦特河',2),
 'Tay': ('Tay','泰河',2), 'Tweed': ('Tweed','特威德河',2), 'Tyne': ('Tyne','泰恩河',2),
 'Great Ouse': ('Great Ouse','大乌斯河',3), 'Wye': ('Wye','怀河',2), 'Aire': ('Aire','艾尔河',3),
 'Swale': ('Swale','斯韦尔河',3), 'Ness': ('Ness','尼斯河',3), 'Shannon': ('Shannon','香农河',2),
 'Suir': ('Suir','苏尔河',3), 'Barrow': ('Barrow','巴罗河',3), 'Blackwater': ('Blackwater','黑水河',3),
 'Annalee': ('Annalee','安纳利河',4), 'Seine': ('Seine','塞纳河',1), 'Loire': ('Loire','卢瓦尔河',1),
 'Somme': ('Somme','索姆河',2), 'Marne': ('Marne','马恩河',2), 'Yonne': ('Yonne','约讷河',3),
 'Oise': ('Oise','瓦兹河',2), 'Aube': ('Aube','奥布河',3), 'Eure': ('Eure','厄尔河',3),
 'Orne': ('Orne','奥恩河',3), 'Vilaine': ('Vilaine','维莱讷河',3), 'Mayenne': ('Mayenne','马耶讷河',3),
 'Sarthe': ('Sarthe','萨尔特河',3), 'Cher': ('Cher','谢尔河',3), 'Saône': ('Saône','索恩河',2),
 'Schelde': ('Scheldt','斯海尔德河',1), 'Maas': ('Meuse','默兹河',1),
 'Rhein': ('Rhine','莱茵河',1), 'Rhin': ('Rhine','莱茵河',1), 'Rhine': ('Rhine','莱茵河',1),
 'Lek': ('Lek','莱克河',2), 'Nederrijn': ('Nederrijn','下莱茵河',2), 'Waal': ('Waal','瓦尔河',2),
 'IJssel': ('IJssel','艾瑟尔河',2), 'Ems': ('Ems','埃姆斯河',2), 'Weser': ('Weser','威悉河',1),
 'Elbe': ('Elbe','易北河',1), 'Mosel': ('Moselle','摩泽尔河',2), 'Main': ('Main','美因河',2),
 'Ruhr': ('Ruhr','鲁尔河',3), 'Lippe': ('Lippe','利珀河',3), 'Neckar': ('Neckar','内卡河',3),
 'Saale': ('Saale','萨勒河',3), 'Aller': ('Aller','阿勒河',3), 'Sarre': ('Saar','萨尔河',3),
 'Sûre': ('Sauer','绍尔河',3), 'Berkel': ('Berkel','贝尔克尔河',4), 'Vecht': ('Vecht','费赫特河',3),
 'Donau': ('Danube','多瑙河',1), 'Inn': ('Inn','因河',2), 'Isar': ('Isar','伊萨尔河',3),
 'Glomma': ('Glomma','格罗马河',1), 'Otta': ('Otta','奥塔河',3), 'Rena': ('Rena','雷纳河',3),
 'Begna': ('Begna','贝格纳河',3), 'Lågen': ('Lågen','洛根河',3),
 'Hallingdalselva': ('Hallingdalselva','哈灵达尔河',3), 'Vorma': ('Vorma','沃尔马河',3),
 'Göta': ('Göta älv','约塔河',2), 'Gta lv': ('Göta älv','约塔河',2),
 'Dalälven': ('Dalälven','达尔河',2), 'Klarlven': ('Klarälven','克拉尔河',2),
 'Ljusnan': ('Ljusnan','尤斯南河',3), 'Ljungan': ('Ljungan','永安河',3),
 'Västerdal': ('Västerdalälven','西达尔河',3), 'Motala strm': ('Motala ström','穆塔拉河',3),
}
river_features, cl_geoms = [], {}
def add_river(g, info):
    if g.is_empty: return
    if g.geom_type == 'MultiLineString': g = linemerge(g)
    name, zh, rank = info
    for line in getattr(g,'geoms',[g]):
        if line.geom_type == 'LineString' and line.length > .005:
            river_features.append(feat(line,name=name,zh=zh,rank=rank,approx=False,src='Natural Earth 10m'))
for filename in ['ne_10m_rivers_lake_centerlines.geojson','ne_10m_rivers_europe.geojson']:
    for f in raw(filename)['features']:
        if not f['geometry']: continue
        g = shape(f['geometry'])
        info = RIV.get(f['properties'].get('name'))
        if not info or not g.intersects(CLIP): continue
        g = g.intersection(CLIP)
        if filename.endswith('centerlines.geojson'):
            cl_geoms.setdefault(info[0],[]).append(g)
        elif info[0] in cl_geoms:
            g = g.difference(unary_union(cl_geoms[info[0]]).buffer(.014))
        add_river(g,info)
dump(fc(river_features),os.path.join(LL,'rivers.geojson'))
dump(fc(river_features),os.path.join(WORK,'rivers_ll.geojson'))
have = {f['properties']['name'] for f in river_features}
required = json.load(open(os.path.join(os.path.dirname(__file__),'required_rivers.json')))['rivers']
assert all(r['orig'] in have for r in required), 'Missing required theatre rivers'
print('[vectors] river segments',len(river_features),'named rivers',len(have),flush=True)

land = clean(land1940().intersection(CLIP),1e-7)
dump(fc([feat(land,source='Natural Earth 10m; 1940 Dutch coast correction')]),os.path.join(LL,'land.geojson'))
dump(fc([feat(land)]),os.path.join(LL,'land_render.geojson'))
C=load_fc(os.path.join(WORK,'countries1939.geojson'))
dump(C,os.path.join(LL,'countries1939.geojson'))
LAKE_ZH={'IJsselmeer':'艾瑟尔湖','Lauwerszee':'劳沃斯海湾','Loch Ness':'尼斯湖','Loch Lomond':'洛蒙德湖',
          'Lough Neagh':'内湖','Lough Derg':'德格湖','Lough Corrib':'科里布湖','Lough Ree':'里湖',
          'Vänern':'维纳恩湖','Vättern':'韦特恩湖','Mjøsa':'米约萨湖','Mjosa':'米约萨湖'}
lakes=[]
for fn in ['ne_10m_lakes.geojson','ne_10m_lakes_europe.geojson']:
    for f in raw(fn)['features']:
        if not f['geometry'] or f['properties'].get('featurecla')=='Reservoir': continue
        g=shape(f['geometry'])
        if not g.intersects(CLIP): continue
        name=f['properties'].get('name') or ''
        g=clean(g.intersection(CLIP))
        if name=='IJsselmeer':
            g=clean(unary_union([g,polder_mask()]).difference(historic_islands()))
        # Lauwerszee was still an open tidal inlet in 1940 (closed only in 1969).
        if name=='Lauwerszee': continue
        if not g.is_empty and not any(g.intersection(h).area > .5*g.area for h,_ in lakes):
            lakes.append((g,name))
dump(fc([feat(g,name=n,zh=LAKE_ZH.get(n,''),src='Natural Earth 10m',date='1940-context') for g,n in lakes]),os.path.join(LL,'lakes.geojson'))
lakes_union=unary_union([g for g,_ in lakes])
print('[vectors] natural lakes',len(lakes),'(modern reservoirs excluded)',flush=True)

# Schematic historic woodland/wetland context, never claims of surveyed1940 cover.
def ellipse(lon,lat,rx_km,ry_km):
    t=np.linspace(0,2*np.pi,48,endpoint=False)
    from shapely.geometry import Polygon
    return Polygon(zip(lon+rx_km*np.cos(t)/(111.32*np.cos(np.radians(lat))),lat+ry_km*np.sin(t)/110.57))
FORESTS=[
 ('New Forest','新森林',-1.65,50.85,14,12),('Forest of Dean','迪恩森林',-2.55,51.80,10,12),
 ('The Weald','威尔德林地',.25,51.03,34,12),('Epping Forest','埃平森林',.05,51.69,4,8),
 ('Sherwood Forest','舍伍德森林',-1.07,53.21,8,13),('Forest of Arden','阿登林地',4.8,49.9,33,19),
 ('Forêt d\'Eawy','埃维森林',1.27,49.72,7,12),('Forêt de Compiègne','贡比涅森林',2.9,49.35,12,10),
 ('Teutoburger Wald','条顿堡森林',8.2,51.93,34,10),('Black Forest','黑森林',8.15,48.2,24,40),
]
forests=[]
for name,zh,lon,lat,rx,ry in FORESTS:
    g=clean(ellipse(lon,lat,rx,ry).intersection(land).difference(lakes_union))
    if not g.is_empty: forests.append(feat(g,name=name,zh=zh,approx=True,src='named historic woodland; schematic envelope'))
dump(fc(forests),os.path.join(LL,'forest.geojson'))

# DEM-derived flat subareas within named wetland envelopes on the field grid.
dem=np.load(os.path.join(WORK,'dem_8192.npy'),mmap_mode='r')
cell=16
h,w=dem.shape[0]//cell,dem.shape[1]//cell
Dc=np.asarray(dem[:h*cell,:w*cell]).reshape(h,cell,w,cell).mean((1,3))
Ds=ndimage.gaussian_filter(Dc,1)
gy,gx=np.gradient(Ds)
flat=(Ds-ndimage.minimum_filter(Ds,size=9)<7)&(np.hypot(gx,gy)<2.5)&(Ds<45)
jj,ii=np.mgrid[0:h,0:w]
lon,lat=proj.inverse((ii+.5)*cell,(jj+.5)*cell)
MARSHES=[('Norfolk Broads','诺福克湿地',1.54,52.66,22,23),('Somerset Levels','萨默塞特低地',-2.95,51.13,21,18),
         ('Pevensey Levels','佩文西低地',.36,50.84,9,5),('Coastal Friesland','弗里斯兰沿岸湿地',5.48,53.15,19,9)]
marsh=[]
for name,zh,lo,la,rx,ry in MARSHES:
    env=ellipse(lo,la,rx,ry)
    m=flat&shapely.contains_xy(env,lon,lat)
    m=ndimage.binary_closing(ndimage.binary_opening(m),iterations=1)
    labs,n=ndimage.label(m); sizes=ndimage.sum(m,labs,range(1,n+1))
    js,is_=np.nonzero(np.isin(labs,1+np.nonzero(sizes>=4)[0]))
    u=unary_union([box(i*cell,j*cell,(i+1)*cell,(j+1)*cell) for i,j in zip(is_,js)])
    out=[]
    for p in polys(u.buffer(8).buffer(-10).simplify(4)).geoms:
        def to_ll(cs):
            a=np.array(cs); x,y=proj.inverse(a[:,0],a[:,1]); return list(zip(x,y))
        from shapely.geometry import Polygon
        out.append(Polygon(to_ll(p.exterior.coords),[to_ll(r.coords) for r in p.interiors]).buffer(0))
    g=clean(unary_union(out).intersection(land).difference(lakes_union))
    if not g.is_empty: marsh.append(feat(g,name=name,zh=zh,approx=True,src='DEM flat lowlands within schematic named wetland envelope'))
dump(fc(marsh),os.path.join(LL,'marsh.geojson'))
print('[vectors] woodland envelopes',len(forests),'wetlands',len(marsh),flush=True)
