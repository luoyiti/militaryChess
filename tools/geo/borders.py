"""战役开始时的国界 → .work/geo/<id>/ll/countries1939.geojson（经纬度；图层名沿用 countries1939，含义是「开战时国界」）。

缺省做法：historical-basemaps world_1938 中与处理范围相交的国家，按 geo.config.json 的 borders.ids 把 NAME 映射成短 id
（未映射的国家用 NAME 生成 id），borders.merge 可把多个 NAME 并入一个 id（如 1938 年后的吞并），最后裁到 Natural Earth 陆地。
需要逐段修补边界的战役（如波兰战役的 1939-08-31 国界）在 borders.script 里指定自己的脚本，管线改为运行它。

可选的补充（缺省不启用，不影响既有战役）：
  borders.carve: [{ "from": "<1938 NAME>", "ne": "<Natural Earth ADMIN>", "id": "<新 id>", "zh": "…" }]
      从 1938 年的某个国家里切出与 Natural Earth 现代国界重合的部分，另立为一个 id（如从南非联邦切出西南非洲托管地）
  borders.ne: { "<Natural Earth ADMIN>": "<id>" }
      1938 数据里没有的孤立岛屿（福克兰、南乔治亚、圣赫勒拿……）：取该 ADMIN 多边形中不与既有国家相接的部分并入 id
"""
import os, re, runpy, sys
from shapely.geometry import shape
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
from common import CFG, CDIR, LL, REGION, raw, clean, ne_land, fc, feat, dump, log

B = CFG.get('borders') or {}
if B.get('script'):
    script = os.path.join(CDIR, B['script'])
    log('borders', '使用战役自带脚本', script)
    runpy.run_path(script, run_name='__main__')
    sys.exit(0)

ids = B.get('ids', {})
zh = B.get('zh', {})
merge = {name: target for target, names in (B.get('merge') or {}).items() for name in names}
slug = lambda name: re.sub(r'[^A-Z]', '', name.upper())[:4] or 'XX'
parts = {}
for f in raw('world_1938.geojson')['features']:
    name = f['properties'].get('NAME')
    if not name or not f['geometry']:
        continue
    g = shape(f['geometry'])
    if not g.intersects(REGION):
        continue
    cid = ids.get(merge.get(name, name)) or ids.get(name) or slug(merge.get(name, name))
    g = clean(g.intersection(REGION))
    parts[cid] = clean(unary_union([parts[cid], g])) if cid in parts else g
for c in B.get('carve') or []:
    src = ids.get(merge.get(c['from'], c['from'])) or ids.get(c['from']) or slug(c['from'])
    ne_poly = next((shape(f['geometry']) for f in raw('ne_10m_admin_0_countries.geojson')['features'] if f['properties'].get('ADMIN') == c['ne']), None)
    if src not in parts or ne_poly is None:
        log('borders', f'警告：carve {c} 找不到来源')
        continue
    ne_poly = clean(ne_poly)
    cut = clean(parts[src].intersection(ne_poly))
    parts[src] = clean(parts[src].difference(ne_poly))
    parts[c['id']] = clean(unary_union([parts[c['id']], cut])) if c['id'] in parts else cut
    if c.get('zh'):
        zh[c['id']] = c['zh']
if B.get('ne'):
    existing = unary_union(list(parts.values()))
    near = existing.buffer(0.02)
    for f in raw('ne_10m_admin_0_countries.geojson')['features']:
        cid = B['ne'].get(f['properties'].get('ADMIN'))
        if not cid or not f['geometry']:
            continue
        g = shape(f['geometry'])
        if not g.intersects(REGION):
            continue
        extra = [p for p in clean(g.intersection(REGION).difference(existing)).geoms if p.area > 2e-4 and not p.intersects(near)]
        if extra:
            g = clean(unary_union(extra))
            parts[cid] = clean(unary_union([parts[cid], g])) if cid in parts else g
land = ne_land()
out = []
for cid, g in sorted(parts.items()):
    g = clean(g.intersection(land), 1e-6)
    if not g.is_empty:
        out.append(feat(g, id=cid, zh=zh.get(cid, cid)))
dump(fc(out), os.path.join(LL, 'countries1939.geojson'))
log('borders', f'{len(out)} 个国家：', ', '.join(f['properties']['id'] for f in out))
