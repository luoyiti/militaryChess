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
 'Danube': ('Danube','多瑙河',1), 'Donau': ('Danube','多瑙河',1),
 'Sava': ('Sava','萨瓦河',1), 'Drina': ('Drina','德里纳河',1),
 'Morava': ('Morava','摩拉瓦河',1), 'Drau': ('Drava','德拉瓦河',1),
 'Mur': ('Mura','穆拉河',2), 'Tisa': ('Tisza','蒂萨河',1),
 'Drin': ('Drin','德林河',1), 'Beli Drim': ('White Drin','白德林河',2),
 'Bojana': ('Bojana','博亚纳河',2), 'Aoos': ('Vjosa','维约萨河',1),
 'Devoll': ('Devoll','德沃尔河',2), 'Haliacmon': ('Aliakmon','阿利阿克蒙河',1),
 'Strymnas': ('Strymon','斯特鲁马河',1), 'Strimonas': ('Strymon','斯特鲁马河',1),
 'Evros': ('Maritsa','埃夫罗斯河',1), 'Maritsa': ('Maritsa','马里察河',1),
 'Mesta': ('Nestos','奈斯托斯河',1), 'Acheloos': ('Acheloos','阿赫洛奥斯河',2),
 'Loudias': ('Loudias','卢迪亚斯河',3), 'Enipefs': ('Enipeas','埃尼佩阿斯河',3),
 'Crna': ('Crna','茨尔纳河',2), 'Bregalnica': ('Bregalnica','布雷加尔尼察河',2),
 'Treska': ('Treska','特雷斯卡河',2), 'Sitnica': ('Sitnica','锡特尼察河',3),
 'Nišava': ('Nisava','尼沙瓦河',2), 'Beli Timok': ('Timok','蒂莫克河',2),
 'Golijska Moravica': ('West Morava','西摩拉瓦河',2),
 'Neretva': ('Neretva','内雷特瓦河',2), 'Vrbas': ('Vrbas','弗尔巴斯河',2),
 'Bosna': ('Bosna','波斯纳河',2), 'Una': ('Una','乌纳河',2),
 'Kupa': ('Kupa','库帕河',2), 'Lim': ('Lim','利姆河',3),
 'Morača': ('Moraca','莫拉查河',2), 'Ljubljanica': ('Ljubljanica','卢布尔雅尼察河',3),
 'Levi Iskar': ('Iskar','伊斯克尔河',2), 'Yantra': ('Yantra','扬特拉河',2),
 'Ogosta': ('Ogosta','奥戈斯塔河',3), 'Tundzha': ('Tundzha','登萨河',2),
 'Arda': ('Arda','阿尔达河',2), 'Kamchiya': ('Kamchiya','卡姆奇亚河',3),
 'Olt': ('Olt','奥尔特河',2), 'Mures': ('Mures','穆列什河',2),
 'Prut': ('Prut','普鲁特河',1), 'Siret': ('Siret','锡雷特河',2),
 'Dniester': ('Dniester','德涅斯特河',1), 'Jiu': ('Jiu','日乌河',3),
 'Ialomita': ('Ialomita','雅洛米察河',3), 'Ialomița': ('Ialomita','雅洛米察河',3),
 'Argeș': ('Arges','阿尔杰什河',3), 'Buzău': ('Buzau','布泽乌河',3),
 'Bistrița': ('Bistrita','比斯特里察河',3), 'Bistrita': ('Bistrita','比斯特里察河',3),
 'Someşul Cald': ('Somes','索梅什河',3), 'Someșul Mare': ('Somes','索梅什河',3),
 'Timiş': ('Timis','蒂米什河',3), 'Trotuș': ('Trotus','特罗图什河',3),
 'Vedea': ('Vedea','韦代亚河',3), 'Borcea': ('Borcea','博尔恰河',3),
 'Bratul Chillia': ('Chilia','基利亚水道',2),
 'Bratul Sfintu Gheorghe': ('Sfantu Gheorghe','圣乔治水道',2),
 'Bratul Sulina': ('Sulina','苏利纳水道',2),
 'Po': ('Po','波河',2), 'Piave': ('Piave','皮亚韦河',3),
 'Adige': ('Adige','阿迪杰河',2), 'Tevere': ('Tiber','台伯河',2),
 'Ofanto': ('Ofanto','奥凡托河',3), 'Reno': ('Reno','雷诺河',3),
 'Arno': ('Arno','阿尔诺河',3), 'Volturno': ('Volturno','沃尔图诺河',3),
 'Enns': ('Enns','恩斯河',3), 'Inn': ('Inn','因河',2), 'Salzach': ('Salzach','萨尔察赫河',3),
 'Traun': ('Traun','特劳恩河',3), 'Raab': ('Raba','拉包河',3),
 'Zala': ('Zala','佐洛河',3), 'Sio': ('Sio','希欧河',4),
 'Sakarya': ('Sakarya','萨卡里亚河',2), 'Gediz': ('Gediz','盖迪兹河',3),
 'Byk Menderes': ('Buyuk Menderes','大门德列斯河',2),
 'Büyük Menderes': ('Buyuk Menderes','大门德列斯河',2),
 'Küçük Menderes': ('Kucuk Menderes','小门德列斯河',3),
 'Susurluk': ('Susurluk','苏苏尔卢克河',3), 'Ergene': ('Ergene','埃尔盖内河',3),
}
UNNAMED_EU = {}
UNNAMED_CL = {490: ('Tisza','蒂萨河',1)}
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

# NE 10m缺失的关键河谷：据战役参考图和河谷城镇数字化，明确标为近似。
add_river(LineString([(20.915,41.8),(21.03,41.80),(21.18,41.94),(21.43,41.995),
          (21.64,41.87),(21.72,41.77),(21.78,41.70),(21.86,41.51),
          (22.02,41.43),(22.18,41.40),(22.28,41.35),(22.39,41.25),
          (22.49,41.14),(22.52,41.00),(22.56,40.89),(22.66,40.80),
          (22.64,40.70),(22.70,40.61),(22.72,40.52)]),
          'Vardar','瓦尔达尔河',1,approx=True,src='战役参考图河谷城镇数字化')
add_river(LineString([(20.64,39.91),(20.64,39.80),(20.58,39.74),(20.47,39.73),
          (20.37,39.69),(20.29,39.64),(20.22,39.58),(20.18,39.53)]),
          'Kalamas','卡拉马斯河',2,approx=True,src='战役参考图河谷数字化')
add_river(LineString([(21.94,38.94),(22.06,38.94),(22.15,38.91),(22.28,38.89),
          (22.42,38.88),(22.54,38.86),(22.62,38.85)]),
          'Spercheios','斯佩尔希奥斯河',2,approx=True,src='战役参考图河谷数字化')
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
dump(fc([feat(clean(ne_land().intersection(REGION), 1e-6))]), os.path.join(LL, 'land_render.geojson'))
C = load_fc(os.path.join(WORK, 'countries1939.geojson'))
cf = []
for f in C['features']:
    g = clean(shape(f['geometry']).intersection(CLIP), 1e-6)
    if not g.is_empty:
        cf.append(feat(g, id=f['properties']['id'], zh=f['properties']['zh']))
dump(fc(cf), os.path.join(LL, 'countries1939.geojson'))

LAKEZH = {'Lake Balaton':'巴拉顿湖','Lake Skadar':'斯库台湖','Neusiedlersee':'新锡德尔湖',
 'Limni Ioanninon':'约阿尼纳湖','Límni Kastorías':'卡斯托里亚湖','Dojran Lake':'多伊兰湖',
 'Limni Vegoritis':'韦戈里蒂斯湖','Limni Vilvi':'沃尔维湖','Limni Korinia':'科罗尼亚湖',
 'Limni Trikhonis':'特里霍尼斯湖','Límni Vistonída':'维斯托尼达湖','Limni Kerkinis':'凯尔基尼湖',
 'Iliki Limni':'伊利基湖','Wörthersee':'沃尔特湖','Lake Ohrid':'奥赫里德湖',
 'Great Prespa':'大普雷斯帕湖','Small Prespa':'小普雷斯帕湖'}
POST1940_NAMES = {'Lake Tisza','Batak','Iskar','Jrebchevo','Lake Kremaston',
                  'Plastiras (Tavropos)','Dam'}
UNNAMED_LAKES = {('ne_10m_lakes.geojson',665):'Lake Ohrid',
                ('ne_10m_lakes.geojson',752):'Great Prespa',
                ('ne_10m_lakes.geojson',753):'Small Prespa'}
# 1939 年后建成的水库（NE 中多标为 Lake）：按质心剔除，避免时代错误
RESERVOIRS_POST1939 = [(20.31,42.13),(19.64,42.05),(18.44,42.82),(17.03,43.68),
                       (21.95,40.22),(24.10,41.70),(25.53,41.64),(29.37,41.04),
                       (28.39,38.69),(26.74,43.06),(18.87, 49.93), (31.50, 49.89), (27.60, 49.43), (14.39, 51.63), (25.44, 56.61), (27.39, 53.99), (27.12, 54.50),
                       (26.99, 52.84), (27.56, 52.79), (23.82, 52.93), (27.97, 52.41), (19.40, 52.62), (19.93, 51.44), (18.68, 51.81),
                       (26.59, 50.30), (29.12, 48.74), (19.56, 49.41), (22.47, 49.37), (27.21, 48.59), (14.18, 49.52), (16.63, 48.90),
                       (29.11, 47.36), (14.09, 48.71), (19.53, 49.11), (22.01, 48.80), (27.19, 47.92), (26.06, 47.01), (20.64, 47.61),
                       (29.85, 53.50), (30.16, 51.37)]
LAKEZH.update({'Zalew Wislany': '维斯瓦潟湖', 'Kaliningradskiy Zaliv': '维斯瓦潟湖', 'Jezioro Łebsko': '文布斯克湖', 'Gopło': '戈普沃湖',
               'Jezioro Dąbie': '东比湖', 'Miedwie': '米耶德维湖', 'Drawsko': '德拉夫斯科湖', 'Dysnai': '季斯纳湖', 'Neusiedlersee': '新锡德尔湖'})
lk = []
dropped = 0
for fn in ['ne_10m_lakes.geojson', 'ne_10m_lakes_europe.geojson']:
    for idx, f in enumerate(raw(fn)['features']):
        g = shape(f['geometry'])
        if f['properties'].get('featurecla') == 'Reservoir' or f['properties'].get('name') in POST1940_NAMES:
            continue
        c = g.centroid
        if any(abs(c.x - a) < 0.05 and abs(c.y - bb_) < 0.05 for a, bb_ in RESERVOIRS_POST1939):
            dropped += 1
            continue
        if g.intersects(CLIP):
            n = f['properties'].get('name') or UNNAMED_LAKES.get((fn,idx),'')
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
 ('迪纳拉山地林区','Dinaric forests',[blob(16.7,44.2,110,35,-47,1),blob(18.55,43.3,95,28,-45,2)]),
 ('品都斯山地林区','Pindus forests',[blob(20.65,40.23,75,25,-66,3),blob(21.45,39.37,58,23,-56,4)]),
 ('罗多彼山地林区','Rhodope forests',[blob(24.45,41.58,90,30,4,5)]),
 ('奥林匹斯山地林区','Olympus forests',[blob(22.33,40.13,22,18,-20,6)]),
 ('克里特山地林区','Crete mountain woodland',[blob(23.96,35.28,24,12,-15,7),blob(24.88,35.21,21,12,2,8)]),
]
forest_feats = []
for zh, orig, ps in FOREST:
    g = clean(unary_union(ps).intersection(land).difference(lakes_u))
    forest_feats.append(feat(g, zh=zh, name=orig, approx=True, src='主要山地林区示意，非1940植被调查'))
dump(fc(forest_feats), os.path.join(LL, 'forest.geojson'))

# 沼泽：包络多边形内 DEM 平坦低洼处（高于 9 km 邻域最低点 < 4 m）→ 16 单位网格 → 平滑多边形
MARSH_ENV = [('多瑙河三角洲湿地','Danube Delta',
              Polygon([(28.54,45.02),(29.78,44.91),(30.13,45.55),(29.11,45.67),(28.54,45.02)]))]
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
# 阿姆夫拉基亚湾、卡拉马斯河口：主要湿地示意，避免替代成France沼泽。
for zh, orig, g in [
    ('阿姆夫拉基亚湾湿地','Ambracian wetlands',blob(20.85,39.12,17,7,0,21)),
    ('卡拉马斯河口湿地','Kalamas delta',blob(20.19,39.56,8,5,18,22))]:
    g = clean(g.intersection(land).difference(lakes_u))
    marsh_feats.append(feat(g,zh=zh,name=orig,approx=True,src='主要河口湿地示意'))
dump(fc(marsh_feats), os.path.join(LL, 'marsh.geojson'))
print('[vectors] 经纬度矢量写出', LL)
