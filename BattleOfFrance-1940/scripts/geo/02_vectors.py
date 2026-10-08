"""矢量要素（经纬度）→ .work/a/ll/*.geojson，随后由 02_project.mjs（d3 投影）+ mapshaper 量化为 public/geo/vectors.topo.json。
objects：land、countries1939、rivers(name,zh,rank,approx)、lakes(name,zh)、marsh(zh)、forest(zh)。裁剪到 frame.bbox 外扩 1°。
"""
import json, os, sys
import numpy as np
import shapely
from shapely.geometry import shape, box, Polygon, MultiPolygon, LineString, MultiLineString, Point
from shapely.ops import unary_union, linemerge
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from geo_common import *  # noqa
import proj
import manual_lines

F = proj.FRAME
b = F['bbox']
CLIP = box(b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1)
LL = os.path.join(WORK, 'll')
os.makedirs(LL, exist_ok=True)

# ---------------- 河流 ----------------
# NE 名称 → (原名, 中文, rank)
RIV = {
    'Rhine': ('Rhein', '莱茵河', 1), 'Meuse': ('Meuse', '默兹河', 1), 'Maas': ('Meuse', '默兹河', 1),
    'Seine': ('Seine', '塞纳河', 1), 'Loire': ('Loire', '卢瓦尔河', 1), 'Marne': ('Marne', '马恩河', 1),
    'Moselle': ('Moselle', '摩泽尔河', 1), 'Mosel': ('Moselle', '摩泽尔河', 1),
    'Scheldt': ('Escaut', '斯海尔德河', 1), 'Schelde': ('Escaut', '斯海尔德河', 1),
    'Somme': ('Somme', '索姆河', 1), 'Oise': ('Oise', '瓦兹河', 1), 'Aisne': ('Aisne', '埃纳河', 1),
    'Sambre': ('Sambre', '桑布尔河', 2), 'Saone': ('Saone', '索恩河', 2), 'Saône': ('Saone', '索恩河', 2),
    'Rhone': ('Rhone', '罗讷河', 1), 'Rhône': ('Rhone', '罗讷河', 1),
    'Main': ('Main', '美因河', 2), 'IJssel': ('IJssel', '艾瑟尔河', 2), 'Waal': ('Waal', '瓦尔河', 2),
    'Lek': ('Lek', '莱克河', 2), 'Yser': ('Yser', '伊瑟河', 2), 'Lys': ('Lys', '利斯河', 2), 'Leie': ('Lys', '利斯河', 2),
    'Ourthe': ('Ourthe', '乌尔特河', 3), 'Semois': ('Semois', '瑟穆瓦河', 3), 'Semoy': ('Semois', '瑟穆瓦河', 3),
    'Ill': ('Ill', '伊尔河', 3), 'Neckar': ('Neckar', '内卡河', 2), 'Thames': ('Thames', '泰晤士河', 1),
    'Meurthe': ('Meurthe', '默尔特河', 3), 'Scarpe': ('Scarpe', '斯卡尔普河', 3), 'Vesle': ('Vesle', '韦勒河', 3),
    'Ruhr': ('Ruhr', '鲁尔河', 3), 'Lahn': ('Lahn', '兰河', 3), 'Sauer': ('Sauer', '叙尔河', 3),
    'Vistula': ('Wisła', '维斯瓦河', 1), 'Oder': ('Odra', '奥得河', 1), 'Dniester': ('Dniestr', '德涅斯特河', 1),
    'Neman': ('Niemen', '涅曼河', 1), 'Daugava': ('Dźwina', '西德维纳河', 1), 'Danube': ('Dunaj', '多瑙河', 1), 'Donau': ('Dunaj', '多瑙河', 1),
    'Elbe': ('Łaba', '易北河', 1), 'Dnipro': ('Dniepr', '第聂伯河', 1), 'Bug': ('Bug', '布格河', 1), 'Zakhidnyy Buh': ('Bug', '布格河', 1),
    'Narew': ('Narew', '纳雷夫河', 1), 'Warta': ('Warta', '瓦尔塔河', 1), 'Pripyat': ('Prypeć', '普里皮亚季河', 1), 'Prypyat': ('Prypeć', '普里皮亚季河', 1),
    'San': ('San', '桑河', 2), 'Noteć': ('Noteć', '诺泰奇河', 2), 'Drwęca': ('Drwęca', '德尔文察河', 2), 'Wkra': ('Wkra', '弗克拉河', 2),
    'Bzura': ('Bzura', '布祖拉河', 2), 'Pilica': ('Pilica', '皮利察河', 2), 'Wieprz': ('Wieprz', '维普日河', 2), 'Dunajec': ('Dunajec', '杜纳耶茨河', 2),
    'Styr': ('Styr', '斯特尔河', 2), 'Haryn': ('Horyń', '霍伦河', 2), 'Sluch': ('Słucz', '斯卢奇河', 2), 'Neris': ('Wilia', '维利亚河', 2),
    'Prut': ('Prut', '普鲁特河', 2), 'Byarezina': ('Berezyna', '别列津纳河', 2), 'Southern Bug': ('Boh', '南布格河', 2), 'Desna': ('Desna', '杰斯纳河', 2),
    'Morava': ('Morawa', '摩拉瓦河', 2), 'Váh': ('Wag', '瓦赫河', 2), 'Vltava': ('Wełtawa', '伏尔塔瓦河', 2), 'Siret': ('Seret', '锡雷特河', 2),
    'Mures': ('Maros', '穆列什河', 2), 'Sozh': ('Soż', '索日河', 2), 'Velikaya': ('Wielikaja', '大河', 3),
    'Prosna': ('Prosna', '普罗斯纳河', 3), 'Gwda': ('Gwda', '格维达河', 3), 'Łyna': ('Łyna', '维纳河', 3), 'Shchara': ('Szczara', '希恰拉河', 3),
    'Yasyelda': ('Jasiołda', '亚谢尔达河', 3), 'Mukhavyets': ('Muchawiec', '穆哈维茨河', 3), 'Nysa Kłodzka': ('Nysa Kłodzka', '克沃兹科尼斯河', 3),
    'Luzicka Nisa': ('Nysa Łużycka', '尼斯河', 3), 'Bóbr': ('Bóbr', '博布尔河', 3), 'Spree': ('Sprewa', '施普雷河', 3), 'Saale': ('Soława', '萨勒河', 3),
    'Hornád': ('Hornad', '霍尔纳德河', 3), 'Hron': ('Hron', '赫龙河', 3), 'Ipel': ('Ipola', '伊佩尔河', 3), 'Latorytsya': ('Latorica', '拉托里察河', 3),
    'Merkys': ('Mereczanka', '梅尔基斯河', 3), 'Šventoji': ('Święta', '什文托伊河', 3), 'Dysna': ('Dzisna', '季斯纳河', 3), 'Drysa': ('Dryssa', '德里萨河', 3),
    'Ubort': ('Uborć', '乌博尔季河', 3), 'Ptsich': ('Ptycz', '普季奇河', 3), 'Teteriv': ('Teterew', '捷捷列夫河', 3), 'Uzh': ('Uż', '乌日河', 4),
    'Slana': ('Sajó', '绍约河', 3), 'Zagyva': ('Zagyva', '佐吉沃河', 3), 'Mūša': ('Musza', '穆沙河', 3), 'Venta': ('Windawa', '文塔河', 3),
    'Nemunėlis': ('Niemenek', '小涅曼河', 4), 'Aiviekste': ('Ewikszta', '艾维克斯泰河', 4), 'Servač': ('Serwecz', '谢尔瓦奇河', 4), 'Ula': ('Uła', '乌拉河', 4),
    'Dyje': ('Dyja', '迪耶河', 3), 'Svitava': ('Svitava', '斯维塔瓦河', 4), 'Svratka': ('Svratka', '斯夫拉特卡河', 4), 'Sázava': ('Sázava', '萨扎瓦河', 4),
    'Raab': ('Raba', '拉包河', 3), 'Mosoni-Duna': ('Dunaj Moszoński', '莫雄多瑙河', 4), 'Pissa': ('Pissa', '皮萨河(东普鲁士)', 4),
    'Moldova': ('Mołdawa', '摩尔多瓦河', 3), 'Bistrița': ('Bystrzyca', '比斯特里察河', 3), 'Someşul Cald': ('Samosz', '索梅什河', 3),
    'Crisul Alb': ('Keresz', '克里什河', 4), 'Sebes Koros': ('Szybki Keresz', '快克勒什河', 4), 'Gauja': ('Gawia', '高亚河', 3), 'Enns': ('Aniza', '恩斯河', 3),
    'Traun': ('Traun', '特劳恩河', 4), 'Isar': ('Izara', '伊萨尔河', 3), 'Inn': ('Inn', '因河', 2), 'Salzach': ('Salzach', '萨尔察赫河', 3),
    'Mur': ('Mura', '穆尔河', 2), 'Drau': ('Drawa', '德拉瓦河', 2), 'Zala': ('Zala', '佐洛河', 4), 'Olt': ('Olt', '奥尔特河', 2), 'Sio': ('Sió', '希欧河', 4),
    'Soroksari Duna': ('Dunaj Soroksarski', '索罗克沙尔多瑙河', 4), 'Eger': ('Ohrza', '奥赫热河', 3), 'Schwarze Elster': ('Czarna Elstera', '黑埃尔斯特河', 4),
    'Weisse Elster': ('Biała Elstera', '白埃尔斯特河', 4), 'Zwickauer Mulde': ('Mulda', '穆尔德河', 4), 'Main': ('Men', '美因河', 2),
    'Uhlava': ('Úhlava', '乌赫拉瓦河', 4), 'Waldnaab': ('Waldnaab', '瓦尔德纳布河', 4), 'Usha': ('Niemen', '涅曼河', 1),
    'Druts': ('Druć', '德鲁季河', 4), 'Kasplya': ('Kaspla', '卡斯普利亚河', 4), 'Emån': ('Emån', '埃姆河', 4), 'Trotuș': ('Trotuș', '特罗图什河', 4),
    'Synyukha': ('Siniucha', '西纽哈河', 4), 'Ros': ('Roś', '罗西河', 3), 'Iputs': ('Ipuć', '伊普季河', 4), 'Snov': ('Snow', '斯诺夫河', 4),
    'Pronya': ('Pronia', '普罗尼亚河', 4), 'Byesyedz': ('Biesiedź', '别谢季河', 4),
}
UNNAMED_EU = {}
UNNAMED_CL = {}
RENAME_EU = {}

rivers = []  # (geom, props)


def add_river(g, orig, zh, rank, approx=False, src='NE'):
    g = g.intersection(CLIP)
    if g.is_empty:
        return
    if g.geom_type == 'MultiLineString':
        g = linemerge(g)
    for l in getattr(g, 'geoms', [g]):
        if l.geom_type == 'LineString' and l.length > 0.005 and not (l.is_ring and len(l.coords) < 12):
            rivers.append((l, dict(name=orig, zh=zh, rank=rank, approx=approx, src=src)))


cl = raw('ne_10m_rivers_lake_centerlines.geojson')['features']
eu = raw('ne_10m_rivers_europe.geojson')['features']
cl_geoms = {}
for i, f in enumerate(cl):
    if not f['geometry']:
        continue
    g = shape(f['geometry'])
    if not g.intersects(CLIP):
        continue
    n = f['properties'].get('name')
    info = RIV.get(n) if n else UNNAMED_CL.get(i)
    if not info:
        continue
    if n == 'Dniester':
        pass
    cl_geoms.setdefault(info[0], []).append(g)
    add_river(g, *info)
cl_union = {k: unary_union(v).buffer(0.03) for k, v in cl_geoms.items()}
for i, f in enumerate(eu):
    if not f['geometry']:
        continue
    g = shape(f['geometry'])
    if not g.intersects(CLIP):
        continue
    n = f['properties'].get('name')
    if n in RENAME_EU:
        info = RENAME_EU[n]
    elif n:
        info = RIV.get(n)
    else:
        info = UNNAMED_EU.get(i)
    if not info:
        continue
    if info[0] in cl_union:  # 与 centerlines 重复的部分去掉
        g = g.difference(cl_union[info[0]])
    add_river(g, *info)

# NE 10m 没有单独标出瓦兹河、埃纳河。按城镇走向给一条示意折线。
add_river(LineString([(4.15, 49.95), (3.55, 49.60), (2.83, 49.42), (2.35, 49.15), (2.09, 48.99)]),
          'Oise', '瓦兹河', 2, approx=True, src='城镇走向示意')
add_river(LineString([(4.95, 49.28), (4.40, 49.40), (3.80, 49.40), (3.32, 49.38), (2.90, 49.42)]),
          'Aisne', '埃纳河', 2, approx=True, src='城镇走向示意')
print('[vectors] 河流段数', len(rivers))
names = sorted({(p['rank'], p['name'], p['zh']) for _, p in rivers})
dump(fc([feat(g, **p) for g, p in rivers]), os.path.join(LL, 'rivers.geojson'))
dump(fc([feat(g, **p) for g, p in rivers]), os.path.join(WORK, 'rivers_ll.geojson'))

# 必需清单核对
req = json.load(open(os.path.join(os.path.dirname(__file__), 'required_rivers.json')))['rivers']
have = {p['name'] for _, p in rivers}
missing = [r['orig'] for r in req if r['orig'] not in have]
manual = sorted({p['name'] for _, p in rivers if p['approx']})
print('[vectors] 必需河流缺失：', missing or '无')
print('[vectors] 手工数字化/近似：', manual)

# ---------------- 陆地、国家、湖泊 ----------------
land = ne_land().intersection(CLIP)
land = clean(land, 1e-6)
dump(fc([feat(land)]), os.path.join(LL, 'land.geojson'))
# 渲染用陆地（覆盖整个画布，画布角点超出 bbox±1°）
dump(fc([feat(clean(ne_land().intersection(box(-8, 42, 14, 56)), 1e-6))]), os.path.join(LL, 'land_render.geojson'))
C = load_fc(os.path.join(WORK, 'countries1939.geojson'))
cf = []
for f in C['features']:
    g = clean(shape(f['geometry']).intersection(CLIP), 1e-6)
    if not g.is_empty:
        cf.append(feat(g, id=f['properties']['id'], zh=f['properties']['zh']))
dump(fc(cf), os.path.join(LL, 'countries1939.geojson'))

LAKEZH = {'Śniardwy': '希尼亚尔德维湖', 'Mamry': '马姆雷湖', 'Balaton': '巴拉顿湖', 'Narach': '纳拉奇湖', 'Lake Balaton': '巴拉顿湖',
          'Neusiedler See': '新锡德尔湖', 'Lubāns': '卢巴纳斯湖', 'Drūkšiai': '德鲁克希艾湖', 'Vänern': '维纳恩湖', 'Vättern': '韦特恩湖',
          'Dysnai': '季斯纳湖', 'Müritz': '米里茨湖', 'Rāznas': '拉兹纳斯湖', 'Kiev Reservoir': '基辅水库'}
# 1939 年后建成的水库（NE 中多标为 Lake）：按质心剔除，避免时代错误
RESERVOIRS_POST1939 = [(18.87, 49.93), (31.50, 49.89), (27.60, 49.43), (14.39, 51.63), (25.44, 56.61), (27.39, 53.99), (27.12, 54.50),
                       (26.99, 52.84), (27.56, 52.79), (23.82, 52.93), (27.97, 52.41), (19.40, 52.62), (19.93, 51.44), (18.68, 51.81),
                       (26.59, 50.30), (29.12, 48.74), (19.56, 49.41), (22.47, 49.37), (27.21, 48.59), (14.18, 49.52), (16.63, 48.90),
                       (29.11, 47.36), (14.09, 48.71), (19.53, 49.11), (22.01, 48.80), (27.19, 47.92), (26.06, 47.01), (20.64, 47.61),
                       (29.85, 53.50), (30.16, 51.37)]
LAKEZH.update({'Zalew Wislany': '维斯瓦潟湖', 'Kaliningradskiy Zaliv': '维斯瓦潟湖', 'Jezioro Łebsko': '文布斯克湖', 'Gopło': '戈普沃湖',
               'Jezioro Dąbie': '东比湖', 'Miedwie': '米耶德维湖', 'Drawsko': '德拉夫斯科湖', 'Dysnai': '季斯纳湖', 'Neusiedlersee': '新锡德尔湖'})
lk = []
dropped = 0
for fn in ['ne_10m_lakes.geojson', 'ne_10m_lakes_europe.geojson']:
    for f in raw(fn)['features']:
        g = shape(f['geometry'])
        if f['properties'].get('featurecla') == 'Reservoir':
            continue
        c = g.centroid
        if any(abs(c.x - a) < 0.05 and abs(c.y - bb_) < 0.05 for a, bb_ in RESERVOIRS_POST1939):
            dropped += 1
            continue
        if g.intersects(CLIP):
            n = f['properties'].get('name') or ''
            lk.append((clean(g.intersection(CLIP)), n))
# 去重：europe 与 10m 重叠
geoms = []
for g, n in lk:
    if any(g.intersection(h).area > 0.5 * g.area for h, _ in geoms):
        continue
    geoms.append((g, n))
dump(fc([feat(g, name=n, zh=LAKEZH.get(n, '')) for g, n in geoms if not g.is_empty]), os.path.join(LL, 'lakes.geojson'))
lakes_u = unary_union([g for g, _ in geoms])
print('[vectors] 湖泊', len(geoms), '（剔除 1939 年后水库', dropped, '处 + NE Reservoir 类）')


# ---------------- 沼泽（DEM 推导 + 包络）与森林（手工近似） ----------------
def blob1(lon, lat, rx_km, ry_km, rot, rng, n=36, rough=0.32):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    r = 1 + rough * (rng.random(n) - 0.5) * 2
    r = ndimage.uniform_filter1d(r, 3, mode='wrap') + 0.12 * (rng.random(n) - 0.5)
    x = rx_km * r * np.cos(t); y = ry_km * r * np.sin(t)
    c, s = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    xr, yr = c * x - s * y, s * x + c * y
    return Polygon(zip(lon + xr / (111.32 * np.cos(np.radians(lat))), lat + yr / 110.57)).buffer(0)


def blob(lon, lat, rx_km, ry_km, rot=0.0, seed=0):
    """近似林区轮廓：主椭圆 + 3–4 个卫星斑块（确定性随机），再做开运算圆滑。"""
    rng = np.random.default_rng(seed)
    ps = [blob1(lon, lat, rx_km, ry_km, rot, rng)]
    kx = 1 / (111.32 * np.cos(np.radians(lat)))
    for _ in range(4):
        a = rng.uniform(0, 2 * np.pi); d = rng.uniform(0.45, 0.85)
        ox, oy = np.cos(a) * rx_km * d, np.sin(a) * ry_km * d
        ps.append(blob1(lon + ox * kx, lat + oy / 110.57, rx_km * rng.uniform(0.3, 0.55), ry_km * rng.uniform(0.3, 0.55), rng.uniform(0, 180), rng))
    g = unary_union(ps)
    return g.buffer(-0.012).buffer(0.018).buffer(-0.006)


FOREST = [
    ('阿登森林', 'Ardennes', [blob(5.35, 50.05, 62, 38, 18, 1), blob(5.9, 49.75, 28, 18, -10, 2)]),
    ('阿尔贡森林', 'Argonne', [blob(5.05, 49.15, 22, 12, 8, 3)]),
    ('贡比涅森林', 'Forêt de Compiègne', [blob(2.85, 49.38, 16, 10, 0, 4)]),
]
forest_feats = []
for zh, orig, ps in FOREST:
    g = clean(unary_union(ps).intersection(land).difference(lakes_u))
    forest_feats.append(feat(g, zh=zh, name=orig, approx=True))
dump(fc(forest_feats), os.path.join(LL, 'forest.geojson'))

# 沼泽：包络多边形内 DEM 平坦低洼处（高于 9 km 邻域最低点 < 4 m）→ 16 单位网格 → 平滑多边形
MARSH_ENV = []
dem = np.load(os.path.join(WORK, 'dem_8192.npy'), mmap_mode='r')
cell = 16
D = np.asarray(dem[::1, ::1][:(dem.shape[0] // cell) * cell, :(dem.shape[1] // cell) * cell], np.float32)
Dc = D.reshape(D.shape[0] // cell, cell, D.shape[1] // cell, cell).mean((1, 3))
Dc_s = ndimage.gaussian_filter(Dc, 1.0)
rel = Dc_s - ndimage.minimum_filter(Dc_s, size=9)
gy, gx = np.gradient(Dc_s)
flat = (rel < 7.0) & (np.hypot(gx, gy) < 2.2)
jj, ii = np.mgrid[0:Dc.shape[0], 0:Dc.shape[1]]
lon_c, lat_c = proj.inverse((ii + 0.5) * cell, (jj + 0.5) * cell)
marsh_feats = []
for zh, orig, env in MARSH_ENV[:1]:
    m = flat & shapely.contains_xy(env, lon_c, lat_c)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_closing(m, iterations=2)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.nonzero(sizes >= 12)[0])
    js, is_ = np.nonzero(keep)
    boxes = [box(i * cell, j * cell, (i + 1) * cell, (j + 1) * cell) for i, j in zip(is_, js)]
    u = unary_union(boxes).buffer(10, join_style='round').buffer(-14, join_style='round').simplify(4)
    polys_xy = [p for p in polys(u).geoms if p.area > 12 * cell * cell]
    # 回到经纬度
    out = []
    for p in polys_xy:
        def to_ll(cs):
            a = np.array(cs); lo, la = proj.inverse(a[:, 0], a[:, 1]); return list(zip(lo, la))
        out.append(Polygon(to_ll(p.exterior.coords), [to_ll(r.coords) for r in p.interiors]).buffer(0))
    g = clean(unary_union(out).intersection(land).difference(lakes_u))
    marsh_feats.append(feat(g, zh=zh, name=orig, approx=True))
    print(f'[vectors] 沼泽 {zh}: {len(g.geoms)} 块, 面积 {g.area * 111 * 70:.0f} km²(约)')
# 比布扎/纳雷夫上游沼泽：河道两侧缓冲带（谷底宽 3–10 km）
for zh, orig, env in MARSH_ENV[1:]:
    rl = unary_union([g for g, p in rivers if p['name'] in ('Biebrza', 'Narew')]).intersection(env.buffer(0.08))
    g = rl.buffer(0.045).buffer(-0.015).intersection(env.buffer(0.03))
    g = clean(g.intersection(land).difference(lakes_u).simplify(0.004))
    marsh_feats.append(feat(g, zh=zh, name=orig, approx=True))
    print(f'[vectors] 沼泽 {zh}: {len(g.geoms)} 块')
if not marsh_feats:
    g = clean(blob(1.75, 50.12, 10, 4, -8, 21).intersection(land).difference(lakes_u))
    if not g.is_empty:
        marsh_feats.append(feat(g, zh='索姆河下游低地', name='Somme marshes', approx=True))
dump(fc(marsh_feats), os.path.join(LL, 'marsh.geojson'))
print('[vectors] 经纬度矢量写出', LL)
