"""地理管线公共工具（shapely 2）。"""
import json
import os
import numpy as np
import shapely
from shapely.geometry import shape, mapping, box, Polygon, MultiPolygon, LineString, Point, GeometryCollection
from shapely.ops import unary_union

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RAW = os.path.join(ROOT, 'scripts/.cache/raw')
CACHE_A = os.path.join(ROOT, 'scripts/.cache/a')
WORK = os.path.join(ROOT, '.work/a')
os.makedirs(WORK, exist_ok=True)

# 法国战役画布外扩：低地国家、法国北部与中部、莱茵河西岸、海峡
REGION = box(-6.0, 43.5, 12.0, 55.5)


def load_fc(path):
    return json.load(open(path))


def raw(name):
    return load_fc(os.path.join(RAW, name))


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
            m = polys(x)
            ps.extend(m.geoms)
        return MultiPolygon(ps)
    return MultiPolygon()


def clean(g, min_area=0.0):
    g = shapely.make_valid(g)
    g = polys(g)
    if min_area > 0:
        g = MultiPolygon([p for p in g.geoms if p.area >= min_area])
    return g


def ne_countries():
    """NE 10m 现代国家（ADM0_A3 → 几何），裁剪到 REGION。"""
    out = {}
    for f in raw('ne_10m_admin_0_countries.geojson')['features']:
        g = shape(f['geometry'])
        if not g.intersects(REGION):
            continue
        k = f['properties']['ADM0_A3']
        g = shapely.make_valid(g).intersection(REGION)
        out[k] = polys(unary_union([out[k], g])) if k in out else polys(g)
    return out


def ne_land():
    gs = [shape(f['geometry']) for f in raw('ne_10m_land.geojson')['features']]
    gs = [shapely.make_valid(g).intersection(REGION) for g in gs if g.intersects(REGION)]
    return clean(unary_union(gs))


def sample_boundary(g, step):
    pts = []
    for p in polys(g).geoms:
        for ring in [p.exterior, *p.interiors]:
            L = ring.length
            n = max(4, int(L / step))
            d = np.linspace(0, L, n, endpoint=False)
            pts.extend(shapely.get_coordinates(shapely.line_interpolate_point(ring, d)))
    return np.array(pts)


def fill_partition(parts, clip, step=0.02, tol=0.01):
    """把 dict{id: MultiPolygon} 扩展为覆盖 clip 的完整剖分：未覆盖区域（海、缝隙）归最近海岸所属国家（Voronoi）。"""
    ids = list(parts)
    allu = unary_union([parts[k] for k in ids])
    P, L = [], []
    for i, k in enumerate(ids):
        pts = sample_boundary(parts[k], step)
        if len(pts) == 0:
            continue
        others = unary_union([parts[j] for j in ids if j != k])
        # 去掉与邻国共享的陆界点，只保留"海岸"点
        near = shapely.dwithin(shapely.points(pts), others, tol) if not others.is_empty else np.zeros(len(pts), bool)
        pts = pts[~near]
        P.append(pts)
        L.extend([i] * len(pts))
    P = np.vstack(P)
    L = np.array(L)
    # 去重
    P, ui = np.unique(np.round(P, 7), axis=0, return_index=True)
    L = L[ui]
    mp = shapely.multipoints(P)
    cells = shapely.voronoi_polygons(mp, extend_to=clip)
    cells = list(cells.geoms)
    # voronoi_polygons 输出顺序不保证与输入一致 → 用包含关系匹配
    cell_arr = np.array(cells, dtype=object)
    tree = shapely.STRtree(cell_arr)
    idx_pt, idx_cell = tree.query(shapely.points(P), predicate='intersects')
    lab_of_cell = np.full(len(cells), -1)
    lab_of_cell[idx_cell] = L[idx_pt]
    gap = clip.difference(allu)
    out = {}
    for i, k in enumerate(ids):
        cs = [cells[c] for c in np.nonzero(lab_of_cell == i)[0]]
        ext = unary_union(cs).intersection(gap) if cs else MultiPolygon()
        out[k] = clean(unary_union([parts[k], ext]).intersection(clip))
    return out


def fc(features):
    return {'type': 'FeatureCollection', 'features': features}


def feat(geom, **props):
    return {'type': 'Feature', 'properties': props, 'geometry': mapping(geom)}


def round_geojson(obj, nd=5):
    def r(c):
        if isinstance(c, (list, tuple)):
            if c and isinstance(c[0], (int, float)):
                return [round(float(v), nd) for v in c]
            return [r(x) for x in c]
        return c
    if obj['type'] == 'FeatureCollection':
        for f in obj['features']:
            f['geometry']['coordinates'] = r(f['geometry']['coordinates'])
    elif obj['type'] == 'Feature':
        obj['geometry']['coordinates'] = r(obj['geometry']['coordinates'])
    return obj


def dump(obj, path, nd=5):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(round_geojson(obj, nd), open(path, 'w'), ensure_ascii=False, separators=(',', ':'))


def dem_sampler():
    """返回 f(lon, lat) → 高程（米），基于 .work/a/dem_8192.npy + 投影（双线性）。DEM 不存在时返回 None。"""
    p = os.path.join(WORK, 'dem_8192.npy')
    if not os.path.exists(p):
        return None
    import proj
    from scipy import ndimage
    dem = np.load(p, mmap_mode='r')
    dem = np.asarray(dem)

    def f(lon, lat):
        x, y = proj.forward(lon, lat)
        return ndimage.map_coordinates(dem, [np.asarray(y) - 0.5, np.asarray(x) - 0.5], order=1, mode='nearest')
    return f
