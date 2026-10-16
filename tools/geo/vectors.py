"""矢量要素（经纬度）→ .work/geo/<id>/ll/*.geojson；随后 project.mjs 用 d3 投影、mapshaper 量化为 public/campaigns/<id>/geo/vectors.topo.json。
图层：land、land_render（覆盖整个画布）、countries1939、rivers(name,zh,rank)、lakes(name,zh)、marsh(zh)、forest(zh)。
geo.config.json：
  rivers: { maxRank: 6, names: { "<NE 名>": ["原名", "中文", 显示级别 1-4] } }   未命名的河流只画不标注
  lakes:  { maxRank: 4, zh: { "<NE 名>": "中文" }, drop: [[lon, lat], …], keep: ["<NE 名>"] }
          drop：剔除战后才建成的水库（按质心）；Natural Earth 标为 Reservoir 的水体缺省不画（多为战后水库），
          keep 列出其中的天然湖泊或战前水库（如伊尔门湖）。不画的水库里的湖心线按河道画出，河流不会断开。
  forest / marsh: [{ zh, name, blobs: [[lon, lat, rxKm, ryKm, 旋转°, 种子], …] }]  林区/沼泽的近似轮廓
"""
import os, sys
import numpy as np
import shapely
from shapely.geometry import shape, box, Polygon
from shapely.ops import unary_union, linemerge
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from common import CFG, LL, CLIP, raw, clean, ne_land, fc, feat, dump, load, log
import proj

RIV = CFG.get('rivers') or {}
LAK = CFG.get('lakes') or {}

# ---------- 陆地 ----------
land = clean(ne_land().intersection(CLIP), 1e-6)
dump(fc([feat(land)]), os.path.join(LL, 'land.geojson'))
lo0, la0, lo1, la1 = proj.canvas_lonlat_bounds(1.0)
dump(fc([feat(clean(ne_land(box(lo0, la0, lo1, la1)), 1e-6))]), os.path.join(LL, 'land_render.geojson'))

# ---------- 国界（borders.py 已生成，裁到处理范围） ----------
cpath = os.path.join(LL, 'countries1939.geojson')
countries = [feat(clean(clean(shape(f['geometry'])).intersection(CLIP), 1e-6), **f['properties']) for f in load(cpath)['features']]
dump(fc([c for c in countries if c['geometry']['coordinates']]), cpath)

# ---------- 湖泊 ----------
drop = LAK.get('drop', [])
keep = set(LAK.get('keep', []))
geoms = []
for fn in ['ne_10m_lakes.geojson', 'ne_10m_lakes_europe.geojson']:
    for f in raw(fn)['features']:
        p = f['properties']
        if not f['geometry'] or (p.get('featurecla') == 'Reservoir' and p.get('name') not in keep) or p.get('scalerank', 0) > LAK.get('maxRank', 6):
            continue
        g = shape(f['geometry'])
        if not g.intersects(CLIP):
            continue
        c = g.centroid
        if any(abs(c.x - a) < 0.05 and abs(c.y - b) < 0.05 for a, b in drop):
            continue
        g = clean(g.intersection(CLIP))
        if g.is_empty or any(g.intersection(h).area > 0.5 * g.area for h, _ in geoms):
            continue
        geoms.append((g, p.get('name') or ''))
dump(fc([feat(g, name=n, zh=LAK.get('zh', {}).get(n, '')) for g, n in geoms]), os.path.join(LL, 'lakes.geojson'))
lakes_u = unary_union([g for g, _ in geoms]) if geoms else Polygon()
log('vectors', f'湖泊 {len(geoms)} 个')


# ---------- 河流 ----------
names = RIV.get('names', {})
max_rank = RIV.get('maxRank', 6)
rivers = []


def add(g, name, zh, rank):
    g = g.intersection(CLIP)
    if g.is_empty:
        return
    if g.geom_type == 'MultiLineString':
        g = linemerge(g)
    for l in getattr(g, 'geoms', [g]):
        if l.geom_type == 'LineString' and l.length > 0.005:
            rivers.append((l, dict(name=name, zh=zh, rank=rank)))


def info(props):
    n = props.get('name') or ''
    if n in names:
        return names[n]
    r = props.get('scalerank', 9)
    return [n, '', int(min(4, max(1, r - 3)))]


center = []
for f in raw('ne_10m_rivers_lake_centerlines.geojson')['features']:
    p = f['properties']
    if not f['geometry'] or p.get('scalerank', 99) > max_rank:
        continue
    g = shape(f['geometry'])
    if p.get('featurecla') == 'Lake Centerline':
        # 湖心线只保留不在已画湖泊里的部分（被剔除或未收录的水库）
        g = g.difference(lakes_u.buffer(0.01)) if not lakes_u.is_empty else g
        if g.is_empty:
            continue
    if g.intersects(CLIP):
        center.append(g)
        add(g, *info(p))
near = unary_union(center).buffer(0.03) if center else None
for f in raw('ne_10m_rivers_europe.geojson')['features']:
    p = f['properties']
    if not f['geometry'] or p.get('scalerank', 99) > max_rank + 2:
        continue
    g = shape(f['geometry'])
    if not g.intersects(CLIP):
        continue
    if near is not None:
        g = g.difference(near)  # 与 centerlines 重复的段去掉
    add(g, *info(p))
dump(fc([feat(g, **p) for g, p in rivers]), os.path.join(LL, 'rivers.geojson'))
log('vectors', f'河流 {len(rivers)} 段，其中有中文名 {sum(1 for _, p in rivers if p["zh"])} 段')

# ---------- 森林 / 沼泽（近似轮廓） ----------
def blob1(lon, lat, rx, ry, rot, rng, n=36, rough=0.32):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    r = 1 + rough * (rng.random(n) - 0.5) * 2
    r = ndimage.uniform_filter1d(r, 3, mode='wrap') + 0.12 * (rng.random(n) - 0.5)
    x, y = rx * r * np.cos(t), ry * r * np.sin(t)
    c, s = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    return Polygon(zip(lon + (c * x - s * y) / (111.32 * np.cos(np.radians(lat))), lat + (s * x + c * y) / 110.57)).buffer(0)


def blob(lon, lat, rx, ry, rot=0.0, seed=0):
    """主椭圆 + 4 个卫星斑块（确定性随机），开运算圆滑。"""
    rng = np.random.default_rng(seed)
    ps = [blob1(lon, lat, rx, ry, rot, rng)]
    kx = 1 / (111.32 * np.cos(np.radians(lat)))
    for _ in range(4):
        a, d = rng.uniform(0, 2 * np.pi), rng.uniform(0.45, 0.85)
        ps.append(blob1(lon + np.cos(a) * rx * d * kx, lat + np.sin(a) * ry * d / 110.57, rx * rng.uniform(0.3, 0.55), ry * rng.uniform(0.3, 0.55), rng.uniform(0, 180), rng))
    return unary_union(ps).buffer(-0.012).buffer(0.018).buffer(-0.006)


for layer in ('forest', 'marsh'):
    feats = []
    for item in CFG.get(layer) or []:
        g = clean(unary_union([blob(*b) for b in item['blobs']]).intersection(land).difference(lakes_u))
        if not g.is_empty:
            feats.append(feat(g, zh=item.get('zh', ''), name=item.get('name', ''), approx=True))
    dump(fc(feats), os.path.join(LL, f'{layer}.geojson'))
    log('vectors', f'{layer} {len(feats)} 处')

# ---------- 等深线（可选：geo.config.json 的 sea.isobaths，海战战役用） ----------
if (CFG.get('sea') or {}).get('isobaths'):
    import bathy
    bathy.write_isobaths(land)
elif os.path.exists(os.path.join(LL, 'isobaths.geojson')):
    os.remove(os.path.join(LL, 'isobaths.geojson'))
