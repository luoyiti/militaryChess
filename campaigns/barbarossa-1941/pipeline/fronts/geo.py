"""fronts 管线的地理辅助：河流折线截取、战区（1941 年苏联）多边形、简单投影。

河流取自 Natural Earth 1:10m（.cache/geo/raw/，tools/geo/fetch_raw.py 下载），截取后的折线缓存到
pipeline/fronts/rivers_cache.json，构建脚本只读缓存，保证没有原始数据时也能复现。
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../../..'))
CAMP = os.path.abspath(os.path.join(HERE, '../..'))
RAW = os.path.join(ROOT, '.cache/geo/raw')
CACHE = os.path.join(HERE, 'rivers_cache.json')

# 河流 → Natural Earth 中的名称（两个文件合并）
RIVER_NAMES = {
    'dnieper': ['Dnepr', 'Dnipro', 'Dnepre'],
    'dvina': ['Daugava'],
    'desna': ['Desna'],
    'volkhov': ['Volkhov'],
    'neva': ['Neva'],
    'svir': ['Svir'],
    'luga': ['Luga'],
    'oka': ['Oka'],
    'narva': ['Narva'],
    'velikaya': ['Velikaya'],
    'shelon': ['Shelon', 'Shelon`'],
    'msta': ['Msta'],
    'sozh': ['Sozh'],
    'seym': ['Seym'],
    'donets': ['Seversky Donets', 'Donets'],
    'prut': ['Prut'],
    'dniester': ['Dniester'],
    'bug_s': ['Southern Bug'],
    'pripyat': ['Pripyat', 'Prypyat'],
    'teterev': ['Teteriv'],
    'berezina': ['Byarezina'],
    'ros': ['Ros'],
    'sluch': ['Sluch'],
    'emajogi': ['Emajõgi'],
    'volga': ['Volga'],
    'oskol': ['Oskol'],
    'vazuza': ['Vazuza'],
    'drut': ['Druts'],
    'iput': ['Iputs'],
    'pronya': ['Pronya'],
    'bug_w': ['Zakhidnyy Buh', 'Bug'],
    'snov': ['Snov'],
    'ptich': ['Ptsich'],
    'styr': ['Styr'],
    'horyn': ['Haryn'],
    'kasplya': ['Kasplya'],
    'tvertsa': ['Tvertsa'],
    'shosha': ['Shosha'],
    'vuoksi': ['Vuoksi'],
}


def _extract_rivers():
    from shapely.geometry import shape, box, MultiLineString, LineString
    from shapely.ops import linemerge, unary_union
    B = box(17, 42, 45, 65)
    out = {}
    feats = []
    for fn in ('ne_10m_rivers_europe.geojson', 'ne_10m_rivers_lake_centerlines.geojson'):
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            raise SystemExit(f'缺少 {p}（先运行 python tools/geo/fetch_raw.py），且没有 {CACHE}')
        for f in json.load(open(p))['features']:
            n = f['properties'].get('name')
            if f['geometry'] and n:
                feats.append((n, shape(f['geometry'])))
    for key, names in RIVER_NAMES.items():
        gs = [g.intersection(B) for n, g in feats if n in names]
        gs = [g for g in gs if not g.is_empty]
        if not gs:
            continue
        u = unary_union(gs)
        m = linemerge(u) if hasattr(u, 'geoms') else u
        parts = list(m.geoms) if hasattr(m, 'geoms') else [m]
        out[key] = [[[round(x, 4), round(y, 4)] for x, y in p.coords] for p in parts if isinstance(p, LineString)]
    json.dump(out, open(CACHE, 'w'), separators=(',', ':'))
    return out


_RIV = None


def _chain(parts, tol=15.0):
    """把端点相距 < tol km 的河段首尾相接（Natural Earth 的河流在湖泊、水库处断开）。"""
    parts = [list(p) for p in parts if len(p) >= 2]
    while True:
        best = None
        for i in range(len(parts)):
            for j in range(len(parts)):
                if i == j:
                    continue
                for ri in (False, True):
                    for rj in (False, True):
                        a = parts[i][0] if ri else parts[i][-1]
                        b = parts[j][-1] if rj else parts[j][0]
                        d = km(a, b)
                        if d < tol and (best is None or d < best[0]):
                            best = (d, i, j, ri, rj)
        if best is None:
            return parts
        _, i, j, ri, rj = best
        A = parts[i][::-1] if ri else parts[i]
        B = parts[j][::-1] if rj else parts[j]
        merged = A + B
        parts = [p for k, p in enumerate(parts) if k not in (i, j)] + [merged]


def rivers():
    global _RIV
    if _RIV is None:
        raw_ = json.load(open(CACHE)) if os.path.exists(CACHE) else _extract_rivers()
        _RIV = {k: _chain(v) for k, v in raw_.items()}
    return _RIV


def km(a, b):
    """两点大圆距离（km）"""
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dl = math.radians(b[0] - a[0])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dl / 2) ** 2
    return 2 * 6371 * math.asin(min(1, math.sqrt(h)))


def _local(p, lat0):
    return (p[0] * math.cos(math.radians(lat0)) * 111.32, p[1] * 110.57)


def river(name, a, b, step=12.0, offset=0.0):
    """截取河流 name 上最接近 a、b 两点之间的河段（按 a→b 方向），按约 step km 重采样。
    offset（km）> 0 时向行进方向的右侧平移（用于把战线放在某一岸）。"""
    from shapely.geometry import LineString, Point
    lat0 = (a[1] + b[1]) / 2
    best = None
    for part in rivers()[name]:
        L = LineString([_local(p, lat0) for p in part])
        pa, pb = Point(_local(a, lat0)), Point(_local(b, lat0))
        d = L.distance(pa) + L.distance(pb)
        if best is None or d < best[0]:
            best = (d, L)
    if best is None:
        raise KeyError(name)
    d, L = best
    if d > 60:
        raise ValueError(f'河流 {name}：端点离河道过远（{d:.0f} km）{a} {b}')
    sa, sb = L.project(Point(_local(a, lat0))), L.project(Point(_local(b, lat0)))
    n = max(2, int(abs(sb - sa) / step) + 1)
    pts = [L.interpolate(sa + (sb - sa) * i / (n - 1)) for i in range(n)]
    xy = [(p.x, p.y) for p in pts]
    if offset:
        sh = []
        for i, (x, y) in enumerate(xy):
            x0, y0 = xy[max(0, i - 1)]
            x1, y1 = xy[min(len(xy) - 1, i + 1)]
            dx, dy = x1 - x0, y1 - y0
            ln = math.hypot(dx, dy) or 1
            sh.append((x + dy / ln * offset, y - dx / ln * offset))
        xy = sh
    k = math.cos(math.radians(lat0)) * 111.32
    return [[round(x / k, 3), round(y / 110.57, 3)] for x, y in xy]


# ---------------- 战区（1941-06-22 苏联）与陆地 ----------------
_TH = None


def theatre():
    """苏联 1941 年国界多边形（shapely），取自地理管线中间产物 .work/geo/barbarossa-1941/ll/countries1939.geojson"""
    global _TH
    if _TH is None:
        from shapely.geometry import shape
        p = os.path.join(ROOT, '.work/geo/barbarossa-1941/ll/countries1939.geojson')
        fs = json.load(open(p))['features']
        _TH = {f['properties']['id']: shape(f['geometry']) for f in fs}
    return _TH


# ---------------- 地名 ----------------
_GAZ = None


def gazetteer():
    global _GAZ
    if _GAZ is None:
        _GAZ = {}
        d = os.path.join(CAMP, 'data/gazetteer')
        for fn in sorted(os.listdir(d)):
            if fn.endswith('.json'):
                for p in json.load(open(os.path.join(d, fn))):
                    _GAZ.setdefault(p['id'], p)
    return _GAZ


def resolve(p):
    if isinstance(p, str):
        return gazetteer()[p[1:]]['pos']
    return p


# ---------------- 场掩膜（与浏览器同一投影：d3.geoConicConformal） ----------------
_FR = None


def frame():
    global _FR
    if _FR is None:
        fr = json.load(open(os.path.join(CAMP, 'config/frame.json')))
        mpath = os.path.join(ROOT, 'public/campaigns/barbarossa-1941/geo/field_masks.bin')
        masks = open(mpath, 'rb').read() if os.path.exists(mpath) else None
        y0, y1 = (math.radians(v) for v in fr['projection']['parallels'])
        tany = lambda y: math.tan((math.pi / 2 + y) / 2)  # noqa: E731
        n = math.log(math.cos(y0) / math.cos(y1)) / math.log(tany(y1) / tany(y0))
        f = math.cos(y0) * tany(y0) ** n / n

        def raw(lam, phi):
            r = f / tany(phi) ** n
            return r * math.sin(n * lam), f - r * math.cos(n * lam)
        rot = fr['projection']['rotate'][0]
        cx, cy = raw(math.radians(fr['projection']['center'][0]), math.radians(fr['projection']['center'][1]))
        k, (tx, ty) = fr['scale'], fr['translate']

        def proj(ll):
            px, py = raw(math.radians(ll[0] + rot), math.radians(ll[1]))
            return tx + k * (px - cx), ty - k * (py - cy)
        _FR = dict(proj=proj, masks=masks, w=fr['field']['w'], h=fr['field']['h'], cell=fr['field']['cell'], kmPerUnit=fr['kmPerUnit'])
    return _FR


def mask_at(ll):
    """该点所在场格子的比特掩码（bit0 = 苏联战区，bit4 = 陆地…）；没有掩膜文件时返回 None"""
    F = frame()
    if F['masks'] is None:
        return None
    x, y = F['proj'](ll)
    i, j = int(x // F['cell']), int(y // F['cell'])
    if not (0 <= i < F['w'] and 0 <= j < F['h']):
        return 0
    return F['masks'][j * F['w'] + i]


def is_theatre(ll):
    m = mask_at(ll)
    return bool(m & 1) if m is not None else None


# ---------------- 湖岸 ----------------
_LAKES = None
LAKE_NAMES = {'ladoga': 'Lake Ladoga', 'onega': 'Lake Onega', 'peipus': 'Lake Peipus', 'ilmen': "Lake Il'Men'"}
LAKE_CACHE = os.path.join(HERE, 'lakes_cache.json')


def lakes():
    global _LAKES
    if _LAKES is None:
        if os.path.exists(LAKE_CACHE):
            _LAKES = json.load(open(LAKE_CACHE))
        else:
            from shapely.geometry import shape
            d = json.load(open(os.path.join(RAW, 'ne_10m_lakes.geojson')))
            _LAKES = {}
            for k, n in LAKE_NAMES.items():
                gs = [shape(f['geometry']) for f in d['features'] if f['properties'].get('name') == n]
                g = max((p for gg in gs for p in (gg.geoms if hasattr(gg, 'geoms') else [gg])), key=lambda p: p.area)
                _LAKES[k] = [[round(x, 4), round(y, 4)] for x, y in g.exterior.coords]
            json.dump(_LAKES, open(LAKE_CACHE, 'w'), separators=(',', ':'))
    return _LAKES


def shore(lake, a, b, via, off=2.5, step=6.0):
    """湖岸 a→b（经过靠近 via 的那一段），向湖内偏 off km，约每 step km 一点"""
    from shapely.geometry import LineString, Point, Polygon
    lat0 = (a[1] + b[1]) / 2
    ring = [_local(p, lat0) for p in lakes()[lake]]
    poly = Polygon(ring)
    inner = poly.buffer(-off) if off > 0 else poly
    if inner.geom_type == 'MultiPolygon':
        inner = max(inner.geoms, key=lambda p: p.area)
    L = LineString(list(inner.exterior.coords))
    P = lambda q: Point(_local(q, lat0))  # noqa: E731
    sa, sb, sv = L.project(P(a)), L.project(P(b)), L.project(P(via))
    n = L.length

    def arc(s0, s1):  # 沿正方向 s0→s1
        d = (s1 - s0) % n
        k = max(2, int(d / step) + 1)
        return [L.interpolate((s0 + d * i / (k - 1)) % n) for i in range(k)]
    fwd_has_via = ((sv - sa) % n) < ((sb - sa) % n)
    pts = arc(sa, sb) if fwd_has_via else arc(sb, sa)[::-1]
    k = math.cos(math.radians(lat0)) * 111.32
    return [[round(p.x / k, 3), round(p.y / 110.57, 3)] for p in pts]
