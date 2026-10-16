"""1940-05-26 开战时国界 → .work/geo/dunkirk-1940/ll/countries1939.geojson（图层名沿用 countries1939）。

由通用管线 tools/geo/borders.py 通过 geo.config.json 的 borders.script 调用：
    GEO_CAMPAIGN=dunkirk-1940 sh tools/py.sh campaigns/dunkirk-1940/pipeline/geo/borders_1940.py

做法：以 Natural Earth 1:10m 现代国界为底。本图幅（0.55–4.62°E、49.92–51.85°N）内 1940 年 5 月
与今天不同的只有两点，都不影响绘制：
  1. 卢森堡（5.7–6.5°E）1940-05-10 当天被占领、1942 年并入德国，但它在画布东缘之外；
  2. 荷兰 1940-05-15 投降、泽兰省战至 17 日，5 月 26 日时全境已由德军控制 —— 因此 NL 与 DE 同归
     「德军控制」比特（masks.bits 的 1），其余（BE、FR、GB）为战区。
现代比荷法德边界与 1940 年一致（欧本—马尔梅迪 1920 年即已归比利时），故直接取 NE 现代多边形，
裁到处理范围并去掉与陆地不相接的碎片。
"""
import os
import sys

import shapely
from shapely.geometry import shape
from shapely.ops import unary_union

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../../tools/geo'))
os.environ.setdefault('GEO_CAMPAIGN', 'dunkirk-1940')
from common import CFG, LL, REGION, raw, clean, ne_land, fc, feat, dump, log  # noqa: E402

ZH = (CFG.get('borders') or {}).get('zh', {})
# Natural Earth ADMIN → 战役国家 id（1940 年 5 月状态）
MAP = {
    'Germany': 'DE',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'France': 'FR',
    'United Kingdom': 'GB',
}

parts: dict[str, shapely.MultiPolygon] = {}
for f in raw('ne_10m_admin_0_countries.geojson')['features']:
    admin = f['properties'].get('ADMIN')
    cid = MAP.get(admin)
    if not cid or not f['geometry']:
        continue
    g = shape(f['geometry'])
    if not g.intersects(REGION):
        continue
    g = clean(shapely.make_valid(g).intersection(REGION))
    parts[cid] = clean(unary_union([parts[cid], g])) if cid in parts else g

land = ne_land()
out = []
for cid in sorted(parts):
    g = clean(parts[cid].intersection(land), 1e-6)
    if not g.is_empty:
        out.append(feat(g, id=cid, zh=ZH.get(cid, cid)))
dump(fc(out), os.path.join(LL, 'countries1939.geojson'))
log('borders', f'{len(out)} 个国家：', ', '.join(f['properties']['id'] for f in out))
