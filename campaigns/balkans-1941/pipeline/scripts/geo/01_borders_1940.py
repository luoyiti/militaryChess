"""1940-10-28 巴尔干国界：历史归属与NE 10m海岸合成。
1938 historical-basemaps提供意属伊斯特里亚/里耶卡和1938年匈牙利轮廓。
北特兰西瓦尼亚南界、扎达尔飞地为战役级数字化近似。
AL保留独立轮廓并注明意占；不能成为不可收复的Axis home mask。
countries1939是引擎兼容对象名；国家层独立于1941年控制区变化。
"""
import json, os, sys
import shapely
from shapely.geometry import Point, Polygon, shape
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *  # noqa

ZH = {'DE':'德国（含奥地利）','IT':'意大利','HU':'匈牙利','YU':'南斯拉夫王国',
      'AL':'阿尔巴尼亚（意占）','GR':'希腊','BG':'保加利亚','RO':'罗马尼亚',
      'TR':'土耳其','SK':'斯洛伐克','SU':'苏联','CH':'瑞士','PROT':'波希米亚-摩拉维亚保护国'}
MODERN = {'DE':['DEU','AUT'],'IT':['ITA'],'HU':['HUN'],
          'YU':['SVN','HRV','BIH','SRB','MNE','MKD','KOS'],
          'AL':['ALB'],'GR':['GRC'],'BG':['BGR'],'RO':['ROU'],'TR':['TUR'],
          'SK':['SVK'],'SU':['UKR','MDA'],'CH':['CHE'],'PROT':['CZE']}
HISTMAP = {'Germany':'DE','Italy':'IT','Hungary':'HU','Yugoslavia':'YU',
           'Albania':'AL','Greece':'GR','Bulgaria':'BG','Romania':'RO',
           'Turkey':'TR','Czechoslovakia':'SK','Switzerland':'CH','USSR':'SU','Soviet Union':'SU'}
mod = ne_countries()
land = ne_land()
cur = {k:clean(unary_union([mod[a] for a in ids if a in mod])) for k,ids in MODERN.items()}
cur = {k:v for k,v in cur.items() if not v.is_empty}
hist = {}
for f in raw('world_1938.geojson')['features']:
    k = HISTMAP.get(f['properties'].get('NAME'))
    g = shape(f['geometry'])
    if k and g.intersects(REGION):
        hist[k] = clean(unary_union([hist.get(k,MultiPolygon()),clean(g.intersection(REGION))]))
# 沿岸扩展只用于历史意属沿岸归属，其余稳定国境采用NE精细线。
hp = fill_partition(hist, REGION, step=0.025)

def paint(g,cid):
    g = clean(g.intersection(land),1e-8)
    if g.is_empty: return
    for k in list(cur):
        if k != cid: cur[k] = clean(cur[k].difference(g))
    cur[cid] = clean(unary_union([cur.get(cid,MultiPolygon()),g]))

# 恢复意属伊斯特里亚/里耶卡；统一南斯拉夫不显示现代内部国界。
paint(hp['IT'].intersection(cur['YU']),'IT')
# Zara市及近郊飞地，按现代海岸裁剪。
zara = Polygon([(15.203,44.098),(15.263,44.091),(15.294,44.109),
                (15.283,44.143),(15.251,44.171),(15.215,44.154)])
paint(zara.intersection(mod['HRV']),'IT')
# 意属十二群岛完整岛屿组件；包括Astypalaia/Kinaros/Levitha，不含Samos/Ikaria。
dodecanese=[]
for p in polys(mod['GRC']).geoms:
    c=p.representative_point()
    if 26.20 <= c.x <= 29.80 and 35.15 <= c.y <= 37.52: dodecanese.append(p)
paint(unary_union(dodecanese),'IT')
# 第一次维也纳裁决；喀尔巴阡鲁塞尼亚1939年3月归匈牙利。
paint(hist['HU'].intersection(mod.get('SVK',MultiPolygon())),'HU')
adm1=load_fc(os.path.join(CACHE_A,'ne_10m_admin_1_region.geojson'))
zak=unary_union([shape(f['geometry']) for f in adm1['features']
                if f['properties'].get('adm0_a3')=='UKR'
                and f['properties'].get('name_en')=='Zakarpattia'])
paint(zak,'HU')
# 北特兰西瓦尼亚：依历史图的城镇/山脊关系数字化南界，非地籍精度。
transylvania_south=[
 (21.50,46.66),(21.74,46.71),(22.10,46.56),(22.46,46.49),(22.64,46.46),
 (22.74,46.61),(23.04,46.56),(23.24,46.56),(23.39,46.63),(23.58,46.65),
 (23.79,46.66),(24.01,46.61),(24.23,46.53),(24.37,46.39),(24.58,46.33),
 (24.76,46.32),(24.93,46.29),(25.06,46.12),(25.19,46.04),(25.33,46.13),
 (25.48,45.98),(25.66,45.73),(25.88,45.67),(26.00,45.72),(26.20,45.81),
 (26.43,45.87),(26.41,46.07),(26.27,46.33),(26.27,46.53),(26.09,46.61),
 (25.97,46.80),(25.90,46.97),(25.75,47.11),(25.50,47.25),(25.30,47.52),
 (25.00,47.66),(24.90,47.78),(24.90,50.0),(20.0,50.0),(20.0,46.66)]
nt=clean(Polygon(transylvania_south).intersection(mod['ROU']))
paint(nt,'HU')
# 南多布罗加1940年9月国界等于现代BG/RO界；SU现代区域表示
# 1940年6月被吞并的比萨拉比亚、北布科维纳与赫尔察。
out={k:clean(shapely.set_precision(g.intersection(land),1e-5),1e-8)
     for k,g in cur.items() if not g.is_empty}
for k,g in out.items(): assert g.is_valid and not g.is_empty,f'国界无效 {k}'
for i,a in enumerate(out):
    for b in list(out)[i+1:]:
        assert out[a].intersection(out[b]).area < 1e-5,f'国界叠占 {a}/{b}'
CHECKS={
 'Pula':(13.85,44.87,'IT'),'Rijeka':(14.442,45.328,'IT'),
 'Zara':(15.237,44.125,'IT'),'Trieste':(13.776,45.650,'IT'),
 'Ljubljana':(14.505,46.056,'YU'),'Zagreb':(15.981,45.815,'YU'),
 'Sarajevo':(18.414,43.856,'YU'),'Belgrade':(20.46,44.80,'YU'),
 'Podgorica':(19.26,42.43,'YU'),'Skopje':(21.43,41.99,'YU'),
 'Pristina':(21.16,42.66,'YU'),'Tirana':(19.819,41.328,'AL'),
 'Ioannina':(20.856,39.666,'GR'),'Athens':(23.735,37.985,'GR'),
 'Chania':(24.018,35.504,'GR'),'Rhodes':(28.10,36.30,'IT'),
 'Astypalaia':(26.354,36.565,'IT'),'Samos':(26.827,37.746,'GR'),
 'Vienna':(16.374,48.209,'DE'),'Dobrich':(27.827,43.571,'BG'),
 'Cluj':(23.590,46.770,'HU'),'Oradea':(21.933,47.047,'HU'),
 'Brasov':(25.592,45.643,'RO'),'Sighisoara':(24.794,46.219,'RO')}
for name,(x,y,expected) in CHECKS.items():
    owners=[k for k,g in out.items() if g.covers(Point(x,y))]
    assert owners == [expected],f'{name}: {owners} != {expected}'
meta={
 'date':'1940-10-28','objectCompatibility':'countries1939',
 'description':'1940年开战时历史国家轮廓；与动态战线、占领区独立。',
 'sources':[
  {'id':'historical-basemaps-1938','url':'https://github.com/aourednik/historical-basemaps/blob/master/geojson/world_1938.geojson','license':'GPL-3.0','usage':'意属伊斯特里亚/里耶卡历史边界，匈牙利1938年扩张'},
  {'id':'ne-10m','url':'https://www.naturalearthdata.com/','license':'Public domain','usage':'高精海岸、稳定国界、合并南斯拉夫及完整岛屿'},
  {'id':'cshapes-2','url':'https://icr.ethz.ch/data/cshapes/','license':'CC BY-NC-SA 4.0','usage':'独立国家与日期交叉核对；二战临时占领不能直接从该数据照抄'},
  {'id':'us-army-balkans','url':'https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-1.html','license':'US government public domain','usage':'1940年罗马尼亚领土变化，北特兰西瓦尼亚南界数字化近似'},
  {'id':'hungary-boundaries-map','url':'https://mek.oszk.hu/06100/06153/06153.pdf','usage':'Hungary boundaries 1914–1945参考图'}],
 'approximateSegments':['北特兰西瓦尼亚1940年南界','扎达尔飞地市郊界','1938底图伊斯特里亚陆界'],
 'notes':['AL为意占阿尔巴尼亚，保持独立轮廓；不得永久填入Axis home mask。',
          'YU统一王国轮廓，无现代前南斯拉夫各国内部界。',
          'DE包含奥地利；意大利包含伊斯特里亚、里耶卡、扎达尔与十二群岛。',
          '国家层固定1940-10-28；后续占领由战区控制多边形表示。'],
 'checks':len(CHECKS),'northTransylvaniaAreaDeg2':round(nt.area,5)}
features=[feat(g,id=k,zh=ZH[k],date='1940-10-28',
               sources=['ne-10m','historical-basemaps-1938','cshapes-2','us-army-balkans'],
               confidence='approx' if k in ('IT','HU','RO') else 'high',
               occupiedBy='IT' if k=='AL' else None) for k,g in out.items()]
data=fc(features);data['meta']=meta
dump(data,os.path.join(WORK,'countries1939.geojson'),nd=5)
dump(data,os.path.join(ROOT,'public/geo/balkans1940.geojson'),nd=5)
json.dump(meta,open(os.path.join(ROOT,'public/geo/balkans1940.meta.json'),'w'),ensure_ascii=False,indent=2)
print('[borders] 1940-10-28:',{k:round(v.area,3) for k,v in out.items()})
print('[borders] 关键归属校验',len(CHECKS),'点通过；北特兰西瓦尼亚',round(nt.area,3),'deg²')
print('[borders] .work/a/countries1939.geojson + public/geo/balkans1940.geojson')
