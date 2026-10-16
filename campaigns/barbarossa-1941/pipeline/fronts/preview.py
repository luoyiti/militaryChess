"""关键帧预览图（PIL）：战区、河流、DE/FI 多边形与易手地点（绿 = 一致，红 = 不一致）。

    python3 campaigns/barbarossa-1941/pipeline/fronts/preview.py 1941-07-16 [--bbox 26,52,36,57] [--out /tmp/x.png] [--w 1400]
"""
import argparse
import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import Point

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402
import check_fronts as cf  # noqa: E402

# Lambert 等角圆锥（与 frame 相同的标准纬线与中央经线）
P1, P2, L0, F0 = math.radians(47), math.radians(59), 31.0, math.radians(53)
n = math.log(math.cos(P1) / math.cos(P2)) / math.log(math.tan(math.pi / 4 + P2 / 2) / math.tan(math.pi / 4 + P1 / 2))
Fk = math.cos(P1) * math.tan(math.pi / 4 + P1 / 2) ** n / n
r0 = Fk / math.tan(math.pi / 4 + F0 / 2) ** n


def lcc(lon, lat):
    r = Fk / math.tan(math.pi / 4 + math.radians(lat) / 2) ** n
    th = n * math.radians(lon - L0)
    return r * math.sin(th), r0 - r * math.cos(th)


def font(sz):
    for p in ('/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/STHeiti Light.ttc', '/Library/Fonts/Arial Unicode.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('at')
    ap.add_argument('--bbox', default='20,44,42,62.5')
    ap.add_argument('--out', default=None)
    ap.add_argument('--w', type=int, default=1400)
    ap.add_argument('--labels', action='store_true', help='标注全部地点名')
    a = ap.parse_args()
    x0, y0, x1, y1 = map(float, a.bbox.split(','))
    corners = [lcc(x, y) for x in (x0, x1, (x0 + x1) / 2) for y in (y0, y1)]
    X0, X1 = min(c[0] for c in corners), max(c[0] for c in corners)
    Y0, Y1 = min(c[1] for c in corners), max(c[1] for c in corners)
    W = a.w
    H = int(W * (Y1 - Y0) / (X1 - X0))
    S = W / (X1 - X0)

    def P(ll):
        x, y = lcc(ll[0], ll[1])
        return ((x - X0) * S, (Y1 - y) * S)

    img = Image.new('RGB', (W, H), (205, 222, 235))
    d = ImageDraw.Draw(img, 'RGBA')
    th = geo.theatre()

    def fillgeom(g, col, outline=None, width=1):
        gs = g.geoms if hasattr(g, 'geoms') else [g]
        for p in gs:
            if p.geom_type != 'Polygon':
                continue
            d.polygon([P(c) for c in p.exterior.coords], fill=col, outline=outline)
            for h in p.interiors:
                d.polygon([P(c) for c in h.coords], fill=(205, 222, 235))
    for cid, g in th.items():
        fillgeom(g, (238, 230, 205) if cid == 'SU' else (215, 212, 205))
    # 湖泊
    from shapely.geometry import shape as _shape
    for f in json.load(open(os.path.join(geo.RAW, 'ne_10m_lakes.geojson')))['features']:
        g = _shape(f['geometry'])
        if g.bounds[2] < x0 - 1 or g.bounds[0] > x1 + 1 or g.bounds[3] < y0 - 1 or g.bounds[1] > y1 + 1:
            continue
        for p in (g.geoms if hasattr(g, 'geoms') else [g]):
            d.polygon([P(c) for c in p.exterior.coords], fill=(170, 200, 230))
    # 河流
    for name, parts in geo.rivers().items():
        for part in parts:
            d.line([P(c) for c in part], fill=(70, 120, 200), width=2 if name in ('dnieper', 'dvina', 'volga', 'don', 'desna', 'dniester') else 1)
    kf = [k for k in cf.load_keyframes() if k[0].startswith(a.at)]
    if not kf:
        sys.exit(f'没有关键帧 {a.at}')
    at, slots, raw, fn = kf[0]
    su = th['SU']
    for slot, col, ln in (('DE', (200, 40, 40, 90), (150, 0, 0)), ('FI', (40, 90, 200, 90), (0, 40, 150))):
        if slot not in slots:
            continue
        area = slots[slot][1].intersection(su)
        fillgeom(area, col)
        for poly in slots[slot][2]:
            for ring in poly:
                pts = [P(geo.resolve(p)) for p in ring]
                d.line(pts + [pts[0]], fill=ln + (120,), width=1)
    # 国界
    for cid, g in th.items():
        gs = g.geoms if hasattr(g, 'geoms') else [g]
        for p in gs:
            d.line([P(c) for c in p.exterior.coords], fill=(120, 110, 90), width=1)
    # 地点
    f = font(13)
    DE = slots['DE'][1] if 'DE' in slots else None
    FI = slots['FI'][1] if 'FI' in slots else None
    DEs = slots['DE'][0] if 'DE' in slots else None
    for c in json.load(open(os.path.join(HERE, 'captures.json'))):
        ll = geo.resolve(c['pos'])
        if not (x0 <= ll[0] <= x1 and y0 <= ll[1] <= y1):
            continue
        t = cf.holder_at(c['hist'], at)
        p = Point(ll)
        inDE = bool(DE and DE.contains(p))
        inFI = bool(FI and FI.contains(p))
        dDE = cf.dist_km_to_boundary(DE, p) if DE else 1e9
        dFI = cf.dist_km_to_boundary(FI, p) if FI else 1e9
        ok = {'DE': inDE or dDE < 10, 'FI': inFI or dFI < 10, 'SU': (not inDE or dDE < 10) and (not inFI or dFI < 10),
              'SUP': (not inDE or dDE < 10) and bool(DEs and DEs.contains(p))}[t]
        col = {'DE': (160, 0, 0), 'FI': (0, 60, 180), 'SU': (0, 120, 0), 'SUP': (200, 120, 0)}[t]
        X, Y = P(ll)
        r = 4 if ok else 7
        d.ellipse([X - r, Y - r, X + r, Y + r], fill=col if ok else (255, 0, 255), outline=(0, 0, 0))
        if not ok or a.labels:
            d.text((X + 6, Y - 8), c['zh'], fill=(0, 0, 0) if ok else (200, 0, 120), font=f)
    d.text((10, 10), f'{at}  {raw.get("note", "")[:60]}', fill=(0, 0, 0), font=font(18))
    out = a.out or os.path.join(os.environ.get('TMPDIR', '/tmp'), f'front_{at.replace(":", "-")}.png')
    img.save(out)
    print(out)


if __name__ == '__main__':
    main()
