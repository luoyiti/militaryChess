"""国界诊断图：用法 python diag_borders.py name lon0 lat0 lon1 lat1 [宽px]  → .work/a/diag_<name>.png
画 countries1939（填色+边界）、NE 河流、检验点（绿=正确，红=错误）。"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import shape as _shape, Point, box
import shapely
shape = lambda g: shapely.make_valid(_shape(g))
sys.path.insert(0, os.path.dirname(__file__))
import proj
from geo_common import WORK, RAW, ROOT

name, a, b, c, d = sys.argv[1], *map(float, sys.argv[2:6])
Wpx = int(sys.argv[6]) if len(sys.argv) > 6 else 1400
xs, ys = proj.forward([a, c, a, c], [b, b, d, d])
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
s = Wpx / (x1 - x0)
Hpx = int((y1 - y0) * s)
img = Image.new('RGB', (Wpx, Hpx), (200, 215, 225))
DEMBG = os.environ.get('DEM') == '1'
if DEMBG:
    dem = np.load(os.path.join(WORK, 'dem_8192.npy'), mmap_mode='r')
    from scipy import ndimage
    gx, gy = np.meshgrid(x0 + (np.arange(Wpx) + 0.5) / s, y0 + (np.arange(Hpx) + 0.5) / s)
    e = ndimage.map_coordinates(np.asarray(dem[int(y0) - 2:int(y1) + 3, int(x0) - 2:int(x1) + 3]), [gy - int(y0) + 2 - 0.5, gx - int(x0) + 2 - 0.5], order=1)
    dy_, dx_ = np.gradient(e)
    hs = np.clip(0.6 + (-dx_ + dy_) * s * 0.02, 0, 1)
    t = np.clip(e / 1800, 0, 1)
    rgb = np.stack([hs * (200 + 40 * t), hs * (215 - 60 * t), hs * (190 - 100 * t)], -1)
    rgb[e <= 0] = (170, 190, 210)
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
dr = ImageDraw.Draw(img, 'RGBA')
font = ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', 13)
COL = {'PL': (240, 200, 200), 'DE': (190, 200, 225), 'DZG': (230, 230, 150), 'SK': (170, 215, 215), 'PROT': (160, 170, 210), 'HU': (210, 230, 180),
       'RO': (235, 215, 170), 'SU': (215, 190, 170), 'LT': (220, 235, 200), 'LV': (200, 225, 235), 'EE': (230, 220, 240)}


def P(coords):
    x, y = proj.forward(coords[:, 0], coords[:, 1])
    return list(zip((x - x0) * s, (y - y0) * s))


bb = box(a - 1, b - 1, c + 1, d + 1)
C = json.load(open(os.path.join(WORK, 'countries1939.geojson')))
for f in C['features']:
    g = shape(f['geometry']).intersection(bb)
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        dr.polygon(P(np.array(p.exterior.coords)), fill=COL.get(f['properties']['id'], (225, 225, 225)) + ((60,) if DEMBG else (255,)))
if DEMBG:
    for lo in np.arange(np.floor(a * 10) / 10, c + 0.01, 0.1):
        dr.line(P(np.array([[lo, b], [lo, d]])), fill=(0, 0, 0, 110 if abs(lo * 2 - round(lo * 2)) < 1e-6 else 40), width=1)
        dr.text(P(np.array([[lo, d]]))[0], f'{lo:.1f}', fill=(0, 0, 0), font=font)
    for la in np.arange(np.floor(b * 10) / 10, d + 0.01, 0.1):
        dr.line(P(np.array([[a, la], [c, la]])), fill=(0, 0, 0, 110 if abs(la * 2 - round(la * 2)) < 1e-6 else 40), width=1)
        dr.text(P(np.array([[a, la]]))[0], f'{la:.1f}', fill=(0, 0, 0), font=font)
for f in C['features']:
    g = shape(f['geometry']).intersection(bb)
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        dr.line(P(np.array(p.exterior.coords)), fill=(60, 40, 40, 255), width=2)
extra = sys.argv[7:] if len(sys.argv) > 7 else []
rivfiles = ['ne_10m_rivers_lake_centerlines.geojson', 'ne_10m_rivers_europe.geojson']
for fn in rivfiles:
    for f in json.load(open(os.path.join(RAW, fn)))['features']:
        if not f['geometry']:
            continue
        g = shape(f['geometry'])
        if not g.intersects(bb):
            continue
        for l in getattr(g, 'geoms', [g]):
            dr.line(P(np.array(l.coords)), fill=(40, 90, 200, 200), width=2)
if os.path.exists(os.path.join(WORK, 'rivers_ll.geojson')):
    for f in json.load(open(os.path.join(WORK, 'rivers_ll.geojson')))['features']:
        g = shape(f['geometry'])
        if not g.intersects(bb):
            continue
        for l in getattr(g, 'geoms', [g]):
            dr.line(P(np.array(l.coords)), fill=(0, 160, 220, 230), width=2)
if os.path.exists(os.path.join(WORK, 'traced.json')):
    for k, l in json.load(open(os.path.join(WORK, 'traced.json')))['lines'].items():
        dr.line(P(np.array(l)), fill=(220, 0, 200, 230), width=2)
T = json.load(open(os.path.join(os.path.dirname(__file__), 'border_testpoints.json')))['points']
G = {f['properties']['id']: shape(f['geometry']) for f in C['features']}
for nm, lon, lat, exp in T:
    if not (a <= lon <= c and b <= lat <= d):
        continue
    ok = G.get(exp) is not None and G[exp].contains(Point(lon, lat))
    (px, py), = P(np.array([[lon, lat]]))
    col = (0, 150, 0) if ok else (220, 0, 0)
    dr.ellipse([px - 4, py - 4, px + 4, py + 4], fill=col)
    dr.text((px + 5, py - 8), f'{nm}:{exp}', fill=col, font=font)
out = os.path.join(WORK, f'diag_{name}.png')
img.save(out)
print(out, img.size)
