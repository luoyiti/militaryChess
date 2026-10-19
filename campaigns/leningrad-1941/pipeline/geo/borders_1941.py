"""1941-06-22 北方战区政治边界；仅写本战役中间产物。

用 Natural Earth 的海岸一致国界恢复 1941 年的波罗的海、东普鲁士、梅梅尔和
1940 年苏芬和约边界。参照资产已随本战役保存，不读取或修改其他战役。
  GEO_CAMPAIGN=leningrad-1941 sh tools/py.sh campaigns/leningrad-1941/pipeline/geo/borders_1941.py
现代芬俄边界在本画幅内近似 1940 年界；佩察莫、萨拉北段在画幅外。
汉科为租借区的概略范围；海岛与海岸服从 Natural Earth，非海上国界测绘图。
"""
import json
import math
import os
import sys
from pathlib import Path

import shapely
from shapely.geometry import Polygon, MultiPolygon, box, shape
from shapely.ops import unary_union

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'tools/geo'))
os.environ.setdefault('GEO_CAMPAIGN', 'leningrad-1941')
from common import CFG, LL, REGION, raw, clean, ne_land, fc, feat, dump, log  # noqa: E402

mod = {}
for f in raw('ne_10m_admin_0_countries.geojson')['features']:
    if not f['geometry']:
        continue
    g = shape(f['geometry'])
    if g.intersects(REGION):
        cid = f['properties'].get('ADM0_A3') or f['properties'].get('adm0_a3')
        g = clean(g.intersection(REGION))
        mod[cid] = clean(unary_union([mod[cid], g])) if cid in mod else g


def union(*codes):
    return clean(unary_union([mod[c] for c in codes if c in mod]))


line = json.loads((HERE / 'treaty1939_reference.json').read_text())['line']


def extend(a, b, km=60):
    dx = (b[0] - a[0]) * math.cos(math.radians(b[1]))
    dy = b[1] - a[1]
    length = math.hypot(dx, dy) or 1
    return [b[0] + dx / length * km / 111 / math.cos(math.radians(b[1])), b[1] + dy / length * km / 111]


edges = [extend(line[1], line[0])] + line + [extend(line[-2], line[-1])]
west = clean(Polygon(edges + [[edges[-1][0], 47], [12, 47], [12, 57], [edges[0][0], 57]]))
assert west.contains(shapely.Point(21, 52.23)), '德苏分界线闭合方向错误'
poland = union('POL')
poland_west, poland_east = clean(poland.intersection(west)), clean(poland.difference(west))
reference = json.loads((HERE / 'germany1939_reference.geojson').read_text())
germany39 = clean(unary_union([shape(f['geometry']) for f in reference['features']]))
russia = union('RUS')
east_prussia = clean(russia.intersection(box(17, 53.5, 23, 56)))
lithuania = union('LTU')
memel = clean(germany39.buffer(.002).intersection(lithuania), 1e-6)
hanko = Polygon([[22.70, 59.70], [23.30, 59.70], [23.33, 59.86], [23.16, 59.96], [22.95, 59.98], [22.70, 59.90]])
countries = {
    'DE': clean(unary_union([union('DEU'), poland_west, east_prussia, memel])),
    'SU': clean(unary_union([russia.difference(east_prussia), union('BLR', 'UKR', 'EST', 'LVA'),
                            lithuania.difference(memel), poland_east, hanko.intersection(union('FIN'))])),
    'FI': clean(union('FIN').difference(hanko)),
    'SE': union('SWE'), 'NO': union('NOR'), 'DK': union('DNK'),
}
land = ne_land()
taken = MultiPolygon()
result = {}
for cid in ['DE', 'FI', 'SU', 'SE', 'NO', 'DK']:
    g = clean(countries[cid].difference(taken).intersection(land), 1e-6)
    if not g.is_empty:
        result[cid] = g
        taken = clean(unary_union([taken, g]))
# 沿岸原始数据的细缝分配给近邻；不跨越国家边界大块吞并未知地带。
for gap in clean(land.difference(taken), 1e-7).geoms:
    p = gap.representative_point()
    nearest = min(result, key=lambda c: result[c].distance(p))
    if result[nearest].distance(p) < .3:
        result[nearest] = clean(unary_union([result[nearest], gap]))
zh = CFG['borders']['zh']
dump(fc([feat(g, id=cid, zh=zh.get(cid, cid)) for cid, g in result.items()]), os.path.join(LL, 'countries1939.geojson'))
log('borders', '1941-06-22 北方战区：', ', '.join(result))
for name, point, expected in [
    ('列宁格勒', (30.316, 59.939), 'SU'), ('维堡', (28.753, 60.710), 'SU'),
    ('索尔塔瓦拉', (30.693, 61.703), 'SU'), ('里加', (24.105, 56.949), 'SU'),
    ('塔林', (24.745, 59.437), 'SU'), ('考纳斯', (23.904, 54.898), 'SU'),
    ('蒂尔西特', (21.88, 55.083), 'DE'), ('梅梅尔', (21.13, 55.71), 'DE'),
    ('赫尔辛基', (24.938, 60.17), 'FI'),
]:
    assert result[expected].buffer(.003).covers(shapely.Point(point)), f'{name} 不在 {expected} 中'
log('borders', '9 个历史边界参照点通过')
