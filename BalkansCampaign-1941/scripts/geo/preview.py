"""验收预览：在底图瓦片合成图上叠加 vectors.topo.json（解码后）的国界/河流/沼泽/森林轮廓与地名，输出 .work/a/preview_*.png"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
import proj
from geo_common import WORK, ROOT
Image.MAX_IMAGE_PIXELS = None
TC = os.path.join(WORK, 'topo_check')
base = Image.open(os.path.join(WORK, 'base_8192.png')).convert('RGB')
font_cache = {}


def font(sz):
    if sz not in font_cache:
        font_cache[sz] = ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', sz)
    return font_cache[sz]


def load(k):
    return json.load(open(os.path.join(TC, k + '.geojson')))['features']


def rings(g):
    if g is None:
        return []
    if g['type'] == 'Polygon':
        return g['coordinates']
    if g['type'] == 'MultiPolygon':
        return [r for p in g['coordinates'] for r in p]
    if g['type'] == 'LineString':
        return [g['coordinates']]
    if g['type'] == 'MultiLineString':
        return g['coordinates']
    return []


def render(name, x0, y0, x1, y1, out_w, labels=True):
    s = out_w / (x1 - x0)
    im = base.crop((int(x0), int(y0), int(x1), int(y1))).resize((out_w, int((y1 - y0) * s)), Image.LANCZOS)
    dr = ImageDraw.Draw(im, 'RGBA')
    P = lambda cs: [((x - x0) * s, (y - y0) * s) for x, y in cs]
    lw = max(1, int(round(out_w / (x1 - x0) * 1.2)))
    for f in load('rivers'):
        r = f['properties']['rank']
        col = (79, 122, 138, 230) if not f['properties'].get('approx') else (160, 60, 160, 230)
        for l in rings(f['geometry']):
            dr.line(P(l), fill=col, width=max(1, int(lw * (2.2 - 0.4 * r))))
    for f in load('countries1939'):
        cid = f['properties']['id']
        col = {'GR': (154, 49, 49, 255), 'YU': (56, 110, 84, 255), 'AL': (126, 87, 49, 255),
               'IT': (136, 105, 46, 255), 'DE': (47, 79, 127, 255), 'HU': (84, 107, 57, 255),
               'BG': (115, 78, 122, 255), 'RO': (111, 104, 47, 255)}.get(cid, (90, 80, 60, 255))
        for l in rings(f['geometry']):
            dr.line(P(l), fill=col, width=lw + 1)
    for k, col in (('marsh', (40, 110, 120, 200)), ('forest', (60, 110, 40, 200))):
        for f in load(k):
            for l in rings(f['geometry']):
                dr.line(P(l), fill=col, width=1)
    if labels:
        seen = set()
        for f in load('rivers'):
            zh = f['properties']['zh']
            if zh in seen or f['properties']['rank'] > 3:
                continue
            cs = rings(f['geometry'])[0]
            m = cs[len(cs) // 2]
            if x0 < m[0] < x1 and y0 < m[1] < y1:
                seen.add(zh)
                dr.text(((m[0] - x0) * s + 3, (m[1] - y0) * s), zh, fill=(30, 70, 110), font=font(max(11, int(12 * min(2, lw)))))
        gz = []
        gz_dir = os.path.join(ROOT, 'src/data/gazetteer')
        for fn in sorted(os.listdir(gz_dir)):
            if fn.endswith('.json'):
                gz.extend(json.load(open(os.path.join(gz_dir, fn))))
        for p in gz:
            if p.get('rank', 9) > 2:
                continue
            x, y = proj.forward(*p['pos'])
            if x0 < x < x1 and y0 < y < y1:
                X, Y = (x - x0) * s, (y - y0) * s
                dr.ellipse([X - 3, Y - 3, X + 3, Y + 3], fill=(20, 20, 20))
                dr.text((X + 5, Y - 14), p['zh'], fill=(20, 20, 20), font=font(13))
    im.save(os.path.join(WORK, f'preview_{name}.png'))
    print('preview', name, im.size)


def reg(lon0, lat0, lon1, lat1):
    xs, ys = proj.forward([lon0, lon1, lon0, lon1], [lat0, lat0, lat1, lat1])
    return min(xs), min(ys), max(xs), max(ys)


W, H = proj.W, proj.H
render('overview', 0, 0, W, H, 2048, labels=True)
render('epirus', *reg(19.3, 38.9, 22.3, 41.3), 1400)
render('yugoslavia', *reg(13.5, 40.8, 23.1, 46.7), 1400)
render('greece', *reg(19.4, 36.4, 26.6, 42.0), 1400)
render('crete', *reg(23.3, 34.7, 26.5, 35.8), 1800)
