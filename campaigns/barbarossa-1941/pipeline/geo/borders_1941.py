"""1941-06-22 开战时国界 → .work/geo/barbarossa-1941/ll/countries1939.geojson（图层名沿用 countries1939）。

由通用管线 tools/geo/borders.py 通过 geo.config.json 的 borders.script 调用（也可单独运行）：
    GEO_CAMPAIGN=barbarossa-1941 sh tools/py.sh campaigns/barbarossa-1941/pipeline/geo/borders_1941.py

做法：以 Natural Earth 1:10m 现代国界为底（与海岸线一致），只在 1941 年与今天不同的地段替换：
  1. 苏德边界：1939-09-28《德苏边界友好条约》分界线（取自波兰战役 data/demarcation.json 的 d.treaty_0928）。
     今波兰境内线东侧（比亚韦斯托克、沃姆扎、桑河东岸的普热梅希尔）→ 苏联；线西侧 → 德国（总督府与并入区）。
  2. 东普鲁士：今加里宁格勒州 → 德国；梅梅尔地区（今立陶宛克莱佩达一带，1939-03 并入德国）取波兰战役
     1939-08-31 国界中德国与今立陶宛的重叠部分（pipeline/geo/countries1939_poland.geojson，由 extract_poland1939.mjs 反投影）。
  3. 苏联（1941）= 今俄罗斯欧洲部分 + 白俄罗斯 + 乌克兰 + 摩尔多瓦 + 波罗的海三国（1940 年并入）
     － 喀尔巴阡乌克兰（1939-03 起属匈牙利）＋ 汉科租借区（1940《莫斯科和约》，至 1941-12-02 撤离）。
     苏罗边界（1940-06 比萨拉比亚、北布科维纳与赫尔察）与今摩尔多瓦/乌克兰—罗马尼亚国界一致；
     苏芬边界（1940-03《莫斯科和约》）与今芬俄国界一致（佩琴加在图外）。
  4. 匈牙利（1941）= 巴尔干战役已修补的 1940 年匈牙利（含北特兰西瓦尼亚、喀尔巴阡乌克兰），见
     campaigns/balkans-1941/pipeline/geo/balkans1940.geojson；罗马尼亚 = 今罗马尼亚 － 北特兰西瓦尼亚；
     斯洛伐克 = 今斯洛伐克 － 1938/1939 年割让给匈牙利的南部与东部地带。
其余国家按今国界（瑞典、挪威、保加利亚、土耳其、南斯拉夫各国合并为 YU）。结果裁到 Natural Earth 陆地。
"""
import json, os, sys
import shapely
from shapely.geometry import shape, Polygon, LineString, MultiPolygon, box
from shapely.ops import unary_union, split

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../../..'))
sys.path.insert(0, os.path.join(ROOT, 'tools/geo'))
os.environ.setdefault('GEO_CAMPAIGN', 'barbarossa-1941')
from common import CFG, LL, REGION, raw, clean, ne_land, fc, feat, dump, log  # noqa: E402

ZH = (CFG.get('borders') or {}).get('zh', {})
land = ne_land()

# ---------- 现代国界 ----------
mod = {}
for f in raw('ne_10m_admin_0_countries.geojson')['features']:
    p = f['properties']
    a3 = p.get('ADM0_A3') or p.get('adm0_a3')
    if not f['geometry']:
        continue
    g = shape(f['geometry'])
    if g.intersects(REGION):
        g = clean(shapely.make_valid(g).intersection(REGION))
        mod[a3] = clean(unary_union([mod[a3], g])) if a3 in mod else g
U = lambda *codes: clean(unary_union([mod[c] for c in codes if c in mod]))
log('borders', '现代国家：', ' '.join(sorted(mod)))

# ---------- 历史参照 ----------
pl39 = {f['properties']['id']: clean(shapely.make_valid(shape(f['geometry'])))
        for f in json.load(open(os.path.join(HERE, 'countries1939_poland.geojson')))['features']}
bk40 = {f['properties']['id']: clean(shapely.make_valid(shape(f['geometry'])))
        for f in json.load(open(os.path.join(ROOT, 'campaigns/balkans-1941/pipeline/geo/balkans1940.geojson')))['features']}
dem = {d['id']: d for d in json.load(open(os.path.join(ROOT, 'campaigns/poland-1939/data/demarcation.json')))}
line = [tuple(p) for p in dem['d.treaty_0928']['line']]


def extend(pts, km=60):
    """把分界线两端沿末段方向各延长 km，保证完全切开今波兰。"""
    import math
    def ext(a, b):
        dx, dy = (b[0] - a[0]) * math.cos(math.radians(b[1])), b[1] - a[1]
        n = math.hypot(dx, dy) or 1
        return (b[0] + dx / n * km / 111 / math.cos(math.radians(b[1])), b[1] + dy / n * km / 111)
    return [ext(pts[1], pts[0])] + pts + [ext(pts[-2], pts[-1])]


# 分界线以西的半平面：分界线 + 远西闭合
L = extend(line)
west = Polygon(L + [(L[-1][0], 47.0), (12.0, 47.0), (12.0, 57.0), (L[0][0], 57.0)])
if not west.is_valid:
    west = shapely.make_valid(west)
west = clean(west)
# 闭合方向检查：华沙须在西侧
if not west.contains(shapely.Point(21.0, 52.23)):
    sys.exit('分界线西侧多边形方向错误')

POL = U('POL')
pl_west = clean(POL.intersection(west))
pl_east = clean(POL.difference(west))

# 东普鲁士北部（今加里宁格勒州）：俄罗斯在 23°E 以西的部分
RUS = U('RUS')
kaliningrad = clean(RUS.intersection(box(17, 53.5, 23.0, 56)))
rus_main = clean(RUS.difference(kaliningrad))
LTU = U('LTU')
memel = clean(pl39['DE'].buffer(0.002).intersection(LTU), 1e-6)

HU = bk40['HU']
hanko = Polygon([(22.70, 59.70), (23.30, 59.70), (23.33, 59.86), (23.16, 59.96), (22.95, 59.98), (22.70, 59.90)])

C = {}
C['DE'] = clean(unary_union([U('DEU', 'AUT'), pl_west, kaliningrad, memel]))
C['PROT'] = U('CZE')
C['HU'] = clean(unary_union([U('HUN'), HU]))
C['SK'] = clean(U('SVK').difference(HU))
C['RO'] = clean(U('ROU').difference(HU))
C['SU'] = clean(unary_union([rus_main, U('BLR', 'UKR', 'MDA', 'EST', 'LVA'), LTU.difference(memel), pl_east,
                             hanko.intersection(U('FIN'))]).difference(HU))
C['FI'] = clean(U('FIN').difference(hanko))
C['SE'] = U('SWE')
C['NO'] = U('NOR')
C['BG'] = U('BGR')
C['TR'] = U('TUR')
C['YU'] = U('SRB', 'MNE', 'BIH', 'HRV', 'SVN', 'MKD', 'KOS')
C['DK'] = U('DNK')
C['GE'] = U('GEO', 'ARM', 'AZE')  # 外高加索（苏联加盟共和国，地图南缘外）
if not C['GE'].is_empty:
    C['SU'] = clean(unary_union([C['SU'], C.pop('GE')]))
else:
    C.pop('GE')
C['KZ'] = U('KAZ')
if not C['KZ'].is_empty:
    C['SU'] = clean(unary_union([C['SU'], C.pop('KZ')]))
else:
    C.pop('KZ')

# 去重叠（优先级：先列的保留）
order = ['DE', 'HU', 'RO', 'SK', 'FI', 'SU', 'PROT', 'SE', 'NO', 'BG', 'TR', 'YU', 'DK']
taken = MultiPolygon()
out = []
for cid in order:
    g = C.get(cid)
    if g is None or g.is_empty:
        continue
    g = clean(g.difference(taken).intersection(land), 1e-6)
    taken = clean(unary_union([taken, g]))
    if not g.is_empty:
        out.append((cid, g))

# 陆地空隙（现代国界与陆地之间的细缝）：并入最近的国家
gap = clean(land.difference(taken), 1e-7)
filled = 0
geoms = dict(out)
for p in gap.geoms:
    c = p.representative_point()
    best = min(geoms, key=lambda k: geoms[k].distance(c))
    if geoms[best].distance(c) < 0.3:
        geoms[best] = clean(unary_union([geoms[best], p]))
        filled += 1
dump(fc([feat(geoms[cid], id=cid, zh=ZH.get(cid, cid)) for cid in order if cid in geoms]), os.path.join(LL, 'countries1939.geojson'))
log('borders', f'1941-06-22 国界：{len(geoms)} 个国家，补缝 {filled} 处 →', os.path.join(LL, 'countries1939.geojson'))
for cid in order:
    if cid in geoms:
        b = geoms[cid].bounds
        log('borders', f'  {cid:5} {ZH.get(cid, cid):12} [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}]')
