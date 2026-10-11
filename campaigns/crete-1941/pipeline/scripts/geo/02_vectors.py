"""Reuse Natural Earth coast/water sources and the France projected-vector engine for Crete."""
from geo_common import *
import proj
LL=os.path.join(WORK,'ll');os.makedirs(LL,exist_ok=True)
b=proj.FRAME['bbox'];CLIP=box(b[0]-1,b[1]-1,b[2]+1,b[3]+1)
land=clean(ne_land().intersection(CLIP))
for name in ['land','land_render']:
 dump(fc([feat(shapely.segmentize(land,.025),source='Natural Earth 1:10m')]),os.path.join(LL,name+'.geojson'))
dump(load_fc(os.path.join(WORK,'countries1939.geojson')),os.path.join(LL,'countries1939.geojson'))
RIV = {'Tavronitis': ('Tavronitis','塔夫罗尼蒂斯河',1),'Geropotamos': ('Geropotamos','耶罗波塔莫斯河',2)}
rivers=[]
for source in ['ne_10m_rivers_lake_centerlines.geojson','ne_10m_rivers_europe.geojson']:
 for f in raw(source)['features']:
  if not f.get('geometry'):continue
  g=shape(f['geometry'])
  if not g.intersects(CLIP):continue
  g=g.intersection(CLIP);pr=f['properties'];name=pr.get('name') or ''
  rivers.append(feat(g,name=name,zh=RIV.get(name,('','',3))[1],rank=3,approx=False,source='Natural Earth 1:10m'))
# Short coastal watercourses omitted at Natural Earth's global scale. Generalized
# river courses aid orientation; they do not claim survey-level channel accuracy.
for name,zh,points in [('Tavronitis','塔夫罗尼蒂斯河',[(23.832,35.431),(23.822,35.450),(23.817,35.478),(23.826,35.501),(23.817,35.527)]),('Platanias','普拉塔尼亚斯河',[(23.900,35.454),(23.891,35.478),(23.897,35.510),(23.904,35.518)])]:
 rivers.append(feat(LineString(points),name=name,zh=zh,rank=1,approx=True,source='generalized orientation line'))
dump(fc(rivers),os.path.join(LL,'rivers.geojson'));dump(fc(rivers),os.path.join(WORK,'rivers_ll.geojson'))
lakes=[]
for f in raw('ne_10m_lakes.geojson')['features']:
 if not f.get('geometry'):continue
 g=shape(f['geometry']);pr=f['properties']
 if g.intersects(CLIP) and pr.get('featurecla')!='Reservoir':
  g=clean(g.intersection(CLIP))
  if not g.is_empty:lakes.append(feat(g,name=pr.get('name') or '',zh='',source='Natural Earth 1:10m'))
for name,features in [('lakes',lakes),('forest',[]),('marsh',[])]:dump(fc(features),os.path.join(LL,name+'.geojson'))
print('[vectors]',len(rivers),'rivers',len(lakes),'lakes')
