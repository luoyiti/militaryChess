"""控制区关键帧与地点易手表的一致性检查。

    python3 campaigns/barbarossa-1941/pipeline/fronts/check_fronts.py [--tol 10] [--at 1941-07-16] [-v]

对每个关键帧时刻 t：
  - captures.json 中 t 时已被 DE 攻占的地点须在 DE 多边形内，FI 同理；
  - 仍属苏方（SU）的地点须在 DE / FI 多边形之外；SUP（内陆被围据点）须位于 DE 多边形的洞里（在外环内、多边形外）；
  - 容差 tol km：距多边形边界不足 tol 的地点视为「在线上」，不报错；
  - data/pockets.json 中处于存续期的包围圈，其 anchor 须在 DE 的洞里（濒海据点只要求不在占领区内）。
另外检查环自相交、洞是否落在外环内、DE 与 FI 在苏联战区内是否重叠。
退出码：有错误时为 1。
"""
import argparse
import glob
import json
import os
import sys

from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union
import shapely

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402

CAMP = geo.CAMP
COASTAL_POCKETS = {'p.tallinn', 'p.odessa', 'p.sevastopol', 'p.hanko', 'p.oranienbaum', 'p.moonsund', 'p.liepaja', 'p.kilpola', 'p.gdov', 'p.saaremaa', 'p.hiiumaa'}  # 背靠海、湖的包围圈不要求是洞


def ring_ll(ring):
    return [tuple(geo.resolve(p)) for p in ring]


def poly_geom(poly):
    """[外环, 洞…] → shapely（奇偶规则，与浏览器的扫描线填充一致）"""
    shell = shapely.make_valid(Polygon(ring_ll(poly[0])))
    g = shell
    for h in poly[1:]:
        g = g.symmetric_difference(shapely.make_valid(Polygon(ring_ll(h))))
    return shell, g


def load_keyframes():
    kfs = []
    for fn in sorted(glob.glob(os.path.join(CAMP, 'data/fronts/*.json'))):
        k = json.load(open(fn))
        slots = {}
        for slot, polys in (k.get('control') or {}).items():
            shells, areas = [], []
            for poly in polys:
                s, a = poly_geom(poly)
                shells.append(s)
                areas.append(a)
            slots[slot] = (unary_union(shells), unary_union(areas), polys)
        kfs.append((k['at'], slots, k, fn))
    kfs.sort(key=lambda x: x[0])
    return kfs


def holder_at(hist, t):
    h = 'SU'
    for at, who in hist:
        if at <= t:
            h = who
    return h


def ring_self_intersects(r):
    n = len(r)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    for i in range(n):
        a, b = r[i], r[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = r[j], r[(j + 1) % n]
            d1, d2, d3, d4 = cross(c, d, a), cross(c, d, b), cross(a, b, c), cross(a, b, d)
            if ((d1 > 0 > d2) or (d1 < 0 < d2)) and ((d3 > 0 > d4) or (d3 < 0 < d4)):
                return (i, j)
    return None


def dist_km_to_boundary(geom, pt):
    """点到区域边界的近似距离（km）"""
    if geom.is_empty:
        return 1e9
    d = geom.boundary.distance(pt)  # 度
    return d * 111.0 * 0.75  # 中高纬近似（经度方向缩短），偏保守


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tol', type=float, default=10.0)
    ap.add_argument('--at', default=None, help='只检查以此开头的关键帧')
    ap.add_argument('-v', action='store_true')
    a = ap.parse_args()

    caps = json.load(open(os.path.join(HERE, 'captures.json')))
    pockets = json.load(open(os.path.join(CAMP, 'data/pockets.json')))
    th = geo.theatre()
    su = th['SU']
    errors, warns = 0, 0
    kfs = load_keyframes()
    for at, slots, raw, fn in kfs:
        if a.at and not at.startswith(a.at):
            continue
        msgs = []
        # 环自相交、洞在外环内
        for slot, (_, _, polys) in slots.items():
            for pi, poly in enumerate(polys):
                rings = [ring_ll(r) for r in poly]
                for ri, r in enumerate(rings):
                    x = ring_self_intersects(r)
                    if x:
                        msgs.append(('E', f'{slot}[{pi}] 环 {ri} 自相交（边 {x[0]}–{x[1]}，约 {r[x[0]]}）'))
                shell = Polygon(rings[0])
                for ri, r in enumerate(rings[1:], 1):
                    if not shell.contains(Polygon(r)):
                        msgs.append(('E', f'{slot}[{pi}] 洞 {ri} 不在外环内（{r[0]}）'))
        DEs, DE = (slots['DE'][0], slots['DE'][1]) if 'DE' in slots else (Polygon(), Polygon())
        FIs, FI = (slots['FI'][0], slots['FI'][1]) if 'FI' in slots else (Polygon(), Polygon())
        ov = DE.intersection(FI).intersection(su)
        if not ov.is_empty and ov.area > 0.002:
            msgs.append(('W', f'DE 与 FI 在苏联战区内重叠 {ov.area:.3f} 平方度（FI 让位于 DE）@ {ov.representative_point().coords[0]}'))
        # 地点
        for c in caps:
            t = holder_at(c['hist'], at)
            p = Point(geo.resolve(c['pos']))
            inDE, inFI = DE.contains(p), FI.contains(p)
            inHole = DEs.contains(p) and not inDE
            dDE, dFI = dist_km_to_boundary(DE, p), dist_km_to_boundary(FI, p)
            bad = None
            if t == 'DE' and not inDE and dDE > a.tol:
                bad = f'应属 DE，但在多边形外（距边界 {dDE:.0f} km）'
            elif t == 'FI' and not inFI and dFI > a.tol:
                bad = f'应属 FI，但在多边形外（距边界 {dFI:.0f} km）'
            elif t == 'SU' and ((inDE and dDE > a.tol) or (inFI and dFI > a.tol)):
                bad = f'应属苏方，但在{"DE" if inDE else "FI"}多边形内（深 {dDE if inDE else dFI:.0f} km）'
            elif t == 'SUP':
                if inDE and dDE > a.tol:
                    bad = f'应为被围苏军据点（洞），但在 DE 多边形内（深 {dDE:.0f} km）'
                elif not inDE and not inHole:
                    bad = '应为被围苏军据点（洞），但不在 DE 外环内（未被合围）'
            if bad:
                msgs.append(('E', f'{c["id"]}（{c["zh"]}）{bad}'))
            elif a.v and min(dDE, dFI) < a.tol:
                msgs.append(('I', f'{c["id"]} 在线上（{t}，距 DE 边界 {dDE:.0f} km）'))
        # 包围圈
        for pk in pockets:
            if not (pk['start'] <= at <= pk['end']):
                continue
            p = Point(geo.resolve(pk['anchor']))
            inDE, inFI = DE.contains(p), FI.contains(p)
            inHole = (DEs.contains(p) and not inDE) or (FIs.contains(p) and not inFI)
            if inDE or inFI:
                msgs.append(('E', f'包围圈 {pk["id"]} 的 anchor 在{"DE" if inDE else "FI"} 占领区内'))
            elif pk['id'] not in COASTAL_POCKETS and not inHole:
                msgs.append(('E', f'包围圈 {pk["id"]} 的 anchor 不在 DE 的洞里（包围圈尚未在多边形上合拢）'))
        ne = sum(1 for m in msgs if m[0] == 'E')
        nw = sum(1 for m in msgs if m[0] == 'W')
        errors += ne
        warns += nw
        print(f'{at}  {"OK" if not ne else f"{ne} 错误"}{f"，{nw} 警告" if nw else ""}  （DE {DE.area:.1f}°²，FI {FI.area:.2f}°²，洞 {sum(len(p) - 1 for p in slots.get("DE", (0, 0, []))[2])}）')
        for lvl, m in msgs:
            if lvl != 'I' or a.v:
                print(f'   {lvl} {m}')
    print(f'共 {len(kfs)} 个关键帧，{len(caps)} 个地点：{errors} 个错误，{warns} 个警告')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
