"""1939-08-31 国界（shapely）。

步骤：
 1. 底图：CShapes 2.0 在 1939-08-31 有效的国家多边形（scripts/.cache/a/CShapes-2.0.geojson）。
 2. 捷克斯洛伐克按现代 CZ/SK/UA 的 Voronoi 区域拆为 保护国(PROT) / 斯洛伐克(SK) / 喀尔巴阡乌克兰(→HU)；奥地利并入 DE。
 3. 与 1939 年一致的边段用 NE 10m 现代边界替换（沿现代界线两侧走廊重新赋值）。
 4. 手工面/折线修补（border_manual.py）：扎奥尔杰、斯洛伐克北部割让地、东斯洛伐克条带、梅梅尔、但泽、波立线、
    喀尔巴阡主脊（DEM 吸附）、德涅斯特河/兹布鲁奇河/西德维纳河/切列莫什河等界河。
 5. Voronoi 补缝，裁剪到 NE 10m 陆地。
输出：public/geo/poland1939.geojson（不含但泽）、.work/a/countries1939.geojson（经纬度，id+zh）。
"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, Point, box
from shapely.ops import unary_union, split, substring, linemerge
sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *  # noqa
import border_manual as BM

ZH = {'DE': '德国', 'PL': '波兰', 'DZG': '但泽自由市', 'SK': '斯洛伐克', 'PROT': '波希米亚-摩拉维亚保护国', 'HU': '匈牙利',
      'RO': '罗马尼亚', 'LT': '立陶宛', 'LV': '拉脱维亚', 'EE': '爱沙尼亚', 'SU': '苏联', 'SE': '瑞典', 'DK': '丹麦',
      'IT': '意大利', 'YU': '南斯拉夫', 'CH': '瑞士', 'BG': '保加利亚', 'FI': '芬兰', 'NO': '挪威'}

# ---------- 1. CShapes 底图 ----------
cs = json.load(open(os.path.join(CACHE_A, 'CShapes-2.0.geojson')))
D = (1939, 8, 31)
CSMAP = {'Germany (Prussia)': 'DE', 'Austria': 'DE', 'Poland': 'PL', 'Czechoslovakia': 'CS', 'Hungary': 'HU', 'Rumania': 'RO',
         'Russia (Soviet Union)': 'SU', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE', 'Sweden': 'SE', 'Denmark': 'DK',
         'Italy/Sardinia': 'IT', 'Yugoslavia': 'YU', 'Switzerland': 'CH', 'Bulgaria': 'BG', 'Finland': 'FI', 'Norway': 'NO'}
cur = {}
for f in cs['features']:
    p = f['properties']
    if not ((p['gwsyear'], p['gwsmonth'], p['gwsday']) <= D <= (p['gweyear'], p['gwemonth'], p['gweday'])):
        continue
    g = shape(f['geometry'])
    if not g.intersects(REGION):
        continue
    k = CSMAP.get(p['cntry_name'])
    if k is None:
        print('  [warn] 未映射 CShapes 国家', p['cntry_name'])
        continue
    g = clean(g.intersection(REGION))
    cur[k] = clean(unary_union([cur[k], g])) if k in cur else g
print('[borders] CShapes 底图', sorted(cur))

# ---------- 现代 NE 国家及其 Voronoi 扩展 ----------
mod = ne_countries()
mod = {k: v for k, v in mod.items() if not v.is_empty}
print('[borders] NE 现代国家', len(mod))
vor_path = os.path.join(WORK, 'ne_vor.json')
if os.path.exists(vor_path):
    V = {k: clean(shape(g)) for k, g in json.load(open(vor_path)).items()}
else:
    V = fill_partition(mod, REGION, step=0.03)
    json.dump({k: shapely.geometry.mapping(g) for k, g in V.items()}, open(vor_path, 'w'))


def paint(geom, cid):
    geom = clean(geom)
    if geom.is_empty:
        return
    for k in list(cur):
        if k != cid:
            cur[k] = clean(cur[k].difference(geom))
    cur[cid] = clean(unary_union([cur.get(cid, MultiPolygon()), geom]))


def vmask(keys):
    return unary_union([V[k] for k in keys if k in V])


# ---------- 2. 捷克斯洛伐克拆分 ----------
CS = cur.pop('CS')
paint(CS.intersection(vmask(['CZE', 'DEU', 'AUT'])), 'PROT')
paint(CS.intersection(vmask(['SVK', 'HUN'])), 'SK')
# CShapes 捷克斯洛伐克越入现代波兰的部分：西里西亚段(<18.2°E)当时属德国，其余（切申/塔特拉/斯皮什）属波兰
csp = CS.intersection(vmask(['POL']))
paint(csp.intersection(box(0, 0, 18.2, 90)), 'DE')
paint(csp.difference(box(0, 0, 18.2, 90)), 'PL')
paint(CS.intersection(vmask(['UKR', 'ROU'])), 'HU')

# ---------- 3. 现代边界走廊替换 ----------
# (现代A, 现代B, 1939 A 侧, 1939 B 侧, 走廊半宽°, 可选裁剪框)
MODERN = [
    ('POL', 'SVK', 'PL', 'SK', 0.12, None),
    ('CZE', 'SVK', 'PROT', 'SK', 0.10, None),
    ('SVK', 'AUT', 'SK', 'DE', 0.08, None),
    ('AUT', 'HUN', 'DE', 'HU', 0.10, None),
    ('HUN', 'ROU', 'HU', 'RO', 0.10, None),
    ('UKR', 'ROU', 'HU', 'RO', 0.08, box(22.0, 47.5, 24.62, 48.3)),
    ('POL', 'LTU', 'PL', 'LT', 0.10, None),
    ('LTU', 'RUS', 'LT', 'DE', 0.10, None),
    ('LTU', 'LVA', 'LT', 'LV', 0.10, None),
    ('BLR', 'LVA', 'PL', 'LV', 0.10, box(26.0, 55.0, 27.70, 57.0)),
    ('BLR', 'LVA', 'SU', 'LV', 0.10, box(27.70, 55.0, 30.0, 57.0)),
    ('RUS', 'LVA', 'SU', 'LV', 0.10, None),
    ('RUS', 'EST', 'SU', 'EE', 0.10, None),
    ('LVA', 'EST', 'LV', 'EE', 0.10, None),
    ('DEU', 'DNK', 'DE', 'DK', 0.10, None),
    ('HUN', 'SRB', 'HU', 'YU', 0.10, None),
    ('HUN', 'HRV', 'HU', 'YU', 0.10, None),
    ('ROU', 'SRB', 'RO', 'YU', 0.10, None),
    ('AUT', 'SVN', 'DE', 'YU', 0.10, None),
    ('AUT', 'ITA', 'DE', 'IT', 0.10, None),
    ('AUT', 'CHE', 'DE', 'CH', 0.10, None),
    ('DEU', 'CHE', 'DE', 'CH', 0.10, None),
]
for a, b, xa, xb, w, clipb in MODERN:
    if a not in mod or b not in mod:
        continue
    seam = mod[a].buffer(0.004).intersection(mod[b].buffer(0.004))
    if seam.is_empty:
        print('  [warn] 无共享边界', a, b)
        continue
    Z = seam.buffer(w)
    if clipb is not None:
        Z = Z.intersection(clipb)
    paint(V[a].intersection(Z), xa)
    paint(V[b].intersection(Z), xb)
print('[borders] 现代边界走廊替换完成')

# ---------- 4. 手工修补 ----------
dem = dem_sampler()


def snap_ridge(pts, radius=0.05, n=21, mode='max'):
    """把折线顶点沿法向在 ±radius° 内吸附到 DEM 局部最高(ridge)/最低(valley)。"""
    if dem is None:
        return pts
    P = np.array(pts, float)
    out = [tuple(P[0])]
    for i in range(1, len(P) - 1):
        t = P[i + 1] - P[i - 1]
        t[0] *= np.cos(np.radians(P[i, 1]))
        nrm = np.array([-t[1], t[0]]) / (np.hypot(*t) + 1e-12)
        nrm[0] /= np.cos(np.radians(P[i, 1]))
        s = np.linspace(-radius, radius, n)
        cand = P[i][None, :] + s[:, None] * nrm[None, :]
        e = dem(cand[:, 0], cand[:, 1])
        e = e - 30 * np.abs(s) / radius  # 轻微偏好原位置
        j = int(np.argmax(e) if mode == 'max' else np.argmin(e + 60 * np.abs(s) / radius))
        out.append(tuple(cand[j]))
    out.append(tuple(P[-1]))
    return out


def line_override(name, left, right, half_w, masks, pts):
    L = LineString(pts)
    corr = L.buffer(half_w, cap_style='flat', join_style='round')
    if masks:
        corr = corr.intersection(vmask(masks))
    # 延长线两端以保证切分成功
    p0, p1 = np.array(pts[0]), np.array(pts[1])
    q0, q1 = np.array(pts[-1]), np.array(pts[-2])
    e0 = p0 + (p0 - p1) / np.linalg.norm(p0 - p1) * half_w * 1.5
    e1 = q0 + (q0 - q1) / np.linalg.norm(q0 - q1) * half_w * 1.5
    LL = LineString([tuple(e0), *pts, tuple(e1)])
    parts = split(clean(corr), LL)
    lp, rp = [], []
    for g in parts.geoms:
        c = g.representative_point()
        # 判定左右：取折线上最近点的切向与 (c - 最近点) 的叉积
        d = LL.project(c)
        a = np.array(LL.interpolate(max(0, d - 1e-4)).coords[0]); b = np.array(LL.interpolate(min(LL.length, d + 1e-4)).coords[0])
        q = np.array(LL.interpolate(d).coords[0])
        cr = (b - a)[0] * (c.y - q[1]) - (b - a)[1] * (c.x - q[0])
        (lp if cr > 0 else rp).append(g)
    paint(unary_union(lp), left)
    paint(unary_union(rp), right)
    return L


# 乌克兰：现代州界 = 1939 年苏波/苏罗/波捷边界（1939-40 年苏联按原波兰省界设州：利沃夫、斯坦尼斯拉夫、捷尔诺波尔、罗夫诺、沃伦；
# 捷尔诺波尔|赫梅利尼茨基 = 兹布鲁奇河；切尔诺夫策 = 北布科维纳+霍京（1939 属罗）；外喀尔巴阡 = 喀尔巴阡乌克兰）
adm1 = json.load(open(os.path.join(CACHE_A, 'ne_10m_admin_1_region.geojson')))
OBL = {'Volyn': 'PL', 'Rivne': 'PL', 'Lviv': 'PL', 'Ivano-Frankivsk': 'PL', 'Ternopil': 'PL', 'Zakarpattia': 'HU', 'Chernivtsi': 'RO',
       'Zhytomyr': 'SU', 'Khmelnytskyi': 'SU', 'Vinnytsia': 'SU', 'Kyiv': 'SU', 'Chernihiv': 'SU', 'Cherkasy': 'SU', 'Kirovohrad': 'SU',
       'Grodno': 'PL', 'Brest': 'PL', 'Gomel': 'SU', 'Mahilioŭ': 'SU'}
ADM1 = {}
for f in adm1['features']:
    pr = f['properties']
    if pr['adm0_a3'] in ('UKR', 'BLR') and (pr['name_en'] or pr['name']) in OBL:
        k = pr['name_en'] or pr['name']
        g = clean(shape(f['geometry']))
        ADM1[k] = clean(unary_union([ADM1[k], g])) if k in ADM1 else g
for k, g in ADM1.items():
    # 向海/国界外侧延伸时仍限定在该现代国家 Voronoi 区内；州界按陆地，外侧交给后续补缝
    paint(g.intersection(vmask(['UKR' if k not in ('Grodno', 'Brest', 'Gomel', 'Mahilioŭ') else 'BLR'])), OBL[k])
print('[borders] 乌克兰/白俄罗斯州界赋值完成')

for name, cid, masks, poly in BM.PATCHES:
    paint(Polygon(poly).intersection(vmask(masks)), cid)
for name, left, right, w, masks, pts in BM.LINES:
    line_override(name, left, right, w, masks, pts)


def ne_river(name, clipbox, src='ne_10m_rivers_europe.geojson', south_to_north=True):
    gs = [shape(f['geometry']) for f in raw(src)['features'] if f['properties'].get('name') == name and f['geometry']]
    g = unary_union(gs).intersection(clipbox)
    if g.geom_type == 'MultiLineString':
        g = linemerge(g)
    if g.geom_type == 'MultiLineString':
        g = max(g.geoms, key=lambda x: x.length)
    c = list(g.coords)
    if (c[0][1] > c[-1][1]) == south_to_north:
        c = c[::-1]
    return c


# 普罗斯纳河（普拉什卡—上西里西亚戈茹夫段）为波德界河：西岸德、东岸波
line_override('普罗斯纳河', 'DE', 'PL', 0.05, ['POL'], ne_river('Prosna', box(18.25, 50.97, 18.60, 51.15)))
print('[borders] 手工修补完成')

# ---------- 5. 补缝 + 裁陆地 ----------
land = ne_land()
full = fill_partition(cur, REGION, step=0.02)
out = {k: clean(shapely.set_precision(clean(v.intersection(land), 1e-7), 1e-5), 1e-7) for k, v in full.items()}
out = {k: v for k, v in out.items() if not v.is_empty}
# 碎片清理：面积 < 1e-3°²（约 7 km²）且与他国相邻的碎块并入共享边界最长的邻国；孤岛保留
for it in range(2):
    moves = []
    for k, g in out.items():
        for p in g.geoms:
            if p.area >= 1e-3:
                continue
            best, bl = None, 0.0
            pb = p.buffer(1e-4)
            for j, h in out.items():
                if j == k:
                    continue
                if pb.intersects(h):
                    l = pb.intersection(h).area
                    if l > bl:
                        best, bl = j, l
            if best:
                moves.append((k, best, p))
    for k, j, p in moves:
        out[k] = clean(out[k].difference(p.buffer(1e-9)))
        out[j] = clean(unary_union([out[j], p]))
    print(f'[borders] 碎片清理第 {it+1} 轮：并入 {len(moves)} 块')
out = {k: v for k, v in out.items() if not v.is_empty}

feats = [feat(g, id=k, zh=ZH.get(k, k)) for k, g in sorted(out.items())]
dump(fc(feats), os.path.join(WORK, 'countries1939.geojson'))
pl = out['PL']
dump(fc([feat(pl, id='PL', zh='波兰', date='1939-08-31', note='1939-08-31 波兰国界（含扎奥尔杰与 1938-11 斯洛伐克割让地，不含但泽自由市）；海岸线取 NE 10m land')]),
     os.path.join(ROOT, 'public/geo/poland1939.geojson'))
print('[borders] 输出国家', {k: len(v.geoms) for k, v in out.items()})

# ---------- 自检 ----------
T = json.load(open(os.path.join(os.path.dirname(__file__), 'border_testpoints.json')))['points']
bad = 0
for name, lon, lat, exp in T:
    pt = Point(lon, lat)
    got = [k for k, g in out.items() if g.contains(pt)]
    got = got[0] if got else '-'
    if got != exp:
        g = out.get(exp)
        dkm = g.distance(pt) * 111 * np.cos(np.radians(lat)) if g is not None else -1
        tag = '近界' if 0 <= dkm < 3 else '错误'
        bad += tag == '错误'
        print(f'  [{tag}] {name}: 期望 {exp} 实得 {got}（距期望国 {dkm:.1f} km）')
print(f'[borders] 检验点 {len(T)} 个，错误 {bad} 个')
