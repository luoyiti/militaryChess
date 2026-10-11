"""地理管线公共工具（shapely 2）。所有步骤按战役运行：

    sh tools/geo/run.sh <campaignId>      （或 GEO_CAMPAIGN=<id> python tools/geo/<step>.py）

路径约定：
    campaigns/<id>/config/geo.config.json   管线参数（frame / borders / rivers / lakes / forest / marsh / masks）
    campaigns/<id>/config/frame.json         由 emit_frame.mjs 生成的投影
    .cache/geo/raw/                          Natural Earth 与 historical-basemaps 原始矢量（fetch_raw.py 下载，全部战役共用）
    .cache/geo/terrarium/<z>/<x>/<y>.png     DEM 瓦片缓存（共用）
    .work/geo/<id>/                          中间产物（ll/ 经纬度矢量，xy/ 投影后矢量，dem.npy）
    public/campaigns/<id>/                   产物：geo/、tiles/、terrain/
"""
import json
import os
import sys
import numpy as np
import shapely
from shapely.geometry import shape, mapping, box, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def _campaign() -> str:
    cid = os.environ.get('GEO_CAMPAIGN') or (sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else '')
    if not cid or not os.path.exists(os.path.join(ROOT, 'campaigns', cid, 'campaign.json')):
        sys.exit(f'用法：GEO_CAMPAIGN=<id> python {sys.argv[0]}（找不到战役「{cid}」）')
    return cid


CAMPAIGN = _campaign()
CDIR = os.path.join(ROOT, 'campaigns', CAMPAIGN)
CFG = json.load(open(os.path.join(CDIR, 'config', 'geo.config.json')))
RAW = os.path.join(ROOT, '.cache', 'geo', 'raw')
GEO_CACHE = os.path.join(ROOT, '.cache', 'geo')
WORK = os.path.join(ROOT, '.work', 'geo', CAMPAIGN)
PUBLIC = os.path.join(ROOT, 'public', 'campaigns', CAMPAIGN)
LL = os.path.join(WORK, 'll')
XY = os.path.join(WORK, 'xy')
for d in (WORK, LL, XY):
    os.makedirs(d, exist_ok=True)

_b = CFG['frame']['bbox']
# 处理范围：画布四角在圆锥投影下会超出 bbox，默认外扩 3°（geo.config.json 的 region 可覆盖）
REGION = box(*(CFG.get('region') or [_b[0] - 3, _b[1] - 3, _b[2] + 3, _b[3] + 3]))
CLIP = box(_b[0] - 1, _b[1] - 1, _b[2] + 1, _b[3] + 1)


def log(step, *a):
    print(f'[{step}:{CAMPAIGN}]', *a, flush=True)


def raw(name):
    p = os.path.join(RAW, name)
    if not os.path.exists(p):
        sys.exit(f'缺少 {p}：先运行 python tools/geo/fetch_raw.py')
    return json.load(open(p))


def polys(g):
    """只保留面要素，返回 MultiPolygon（可能为空）。"""
    if g is None or g.is_empty:
        return MultiPolygon()
    if isinstance(g, Polygon):
        return MultiPolygon([g])
    if isinstance(g, MultiPolygon):
        return g
    if isinstance(g, GeometryCollection):
        ps = []
        for x in g.geoms:
            ps.extend(polys(x).geoms)
        return MultiPolygon(ps)
    return MultiPolygon()


def clean(g, min_area=0.0):
    g = polys(shapely.make_valid(g))
    if min_area > 0:
        g = MultiPolygon([p for p in g.geoms if p.area >= min_area])
    return g


def ne_land(region=None):
    region = region or REGION
    gs = [shape(f['geometry']) for f in raw('ne_10m_land.geojson')['features']]
    gs = [shapely.make_valid(g).intersection(region) for g in gs if g.intersects(region)]
    return clean(unary_union(gs))


def fc(features):
    return {'type': 'FeatureCollection', 'features': features}


def feat(geom, **props):
    return {'type': 'Feature', 'properties': props, 'geometry': mapping(geom)}


def _round(c, nd):
    if isinstance(c, (list, tuple)):
        if c and isinstance(c[0], (int, float)):
            return [round(float(v), nd) for v in c]
        return [_round(x, nd) for x in c]
    return c


def dump(obj, path, nd=5):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for f in obj['features']:
        f['geometry']['coordinates'] = _round(f['geometry']['coordinates'], nd)
    json.dump(obj, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))


def load(path):
    return json.load(open(path))
