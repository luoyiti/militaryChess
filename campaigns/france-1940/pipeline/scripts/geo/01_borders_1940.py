"""1940-05-10 西欧国界。

本图幅里，法国、比利时、荷兰、卢森堡与德国西界和今天一致
（阿尔萨斯-洛林属法国，欧本-马尔梅迪属比利时），所以直接用 NE 10m 的海岸。
写出的对象文件仍叫 countries1939.geojson，供现有引擎读取。
另写 public/geo/france1940.geojson：法比荷卢的并集，给数据校验用。
"""
import os
import sys

from shapely.ops import unary_union

sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *  # noqa: E402,F403

ID = {
    'FRA': ('FR', '法国'),
    'BEL': ('BE', '比利时'),
    'NLD': ('NL', '荷兰'),
    'LUX': ('LU', '卢森堡'),
    'DEU': ('DE', '德国'),
    'GBR': ('GB', '英国'),
    'CHE': ('CH', '瑞士'),
    'ITA': ('IT', '意大利'),
}

mod = ne_countries()
feats = []
theater = []
for a3, (cid, zh) in ID.items():
    g = mod.get(a3)
    if g is None or g.is_empty:
        print('[borders] 缺少', a3)
        continue
    g = clean(g.intersection(REGION), 1e-6)
    if g.is_empty:
        print('[borders] 裁空', a3)
        continue
    feats.append(feat(g, id=cid, zh=zh))
    if cid in ('FR', 'BE', 'NL', 'LU'):
        theater.append(g)
    print('[borders]', cid, f'{g.area:.3f}')

os.makedirs(WORK, exist_ok=True)
dump(fc(feats), os.path.join(WORK, 'countries1939.geojson'), nd=4)
th = clean(unary_union(theater), 1e-6)
out = os.path.join(ROOT, 'public/geo/france1940.geojson')
os.makedirs(os.path.dirname(out), exist_ok=True)
dump(fc([feat(th, id='THEATER', zh='法比荷卢')]), out, nd=4)
print('[borders] 写出', len(feats), '国；战区', out)
