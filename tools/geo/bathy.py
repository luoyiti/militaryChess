"""等深线（可选，geo.config.json 的 sea.isobaths，单位米，负数）：dem.npy（+ dem.insets 的超采样网格）→ ll/isobaths.geojson。

由 vectors.py 在 sea.isobaths 存在时调用。步骤：高斯平滑 → 向量化 marching squares → 线段首尾相接（shapely line_merge）→ Chaikin 圆滑
→ 反算经纬度 → 裁到处理范围并剔除陆地。要素属性 depth 为正的水深米数（-50 → 50）。
dem.insets 子区域内用 4 倍超采样的网格重新提取（浅滩、河口细节），窗口边界处与全图等深线首尾相接。
"""
import json
import os
import numpy as np
import shapely
from shapely.geometry import box
from scipy import ndimage
from common import CFG, WORK, LL, CLIP, fc, feat, dump, log
import proj

SEA = CFG.get('sea') or {}
SMOOTH = float(SEA.get('smooth', 1.1))  # 画布像素


def contour_lines(Z, level):
    """Z（H×W，float）在 level 处的等值线，返回 [N×2 数组]，坐标为网格索引空间（像素中心为整数点）。"""
    a = Z >= level
    tl, tr, br, bl = a[:-1, :-1], a[:-1, 1:], a[1:, 1:], a[1:, :-1]
    case = (tl.astype(np.uint8) << 3) | (tr.astype(np.uint8) << 2) | (br.astype(np.uint8) << 1) | bl.astype(np.uint8)
    jj, ii = np.nonzero((case != 0) & (case != 15))
    if jj.size == 0:
        return []
    cs = case[jj, ii]
    H, W = Z.shape
    # 鞍点（5、10）按格心均值决定连法
    cen = (Z[jj, ii] + Z[jj, ii + 1] + Z[jj + 1, ii + 1] + Z[jj + 1, ii]) / 4 >= level
    # 每种情形的线段：边 T=0 R=1 B=2 L=3
    table = {1: [(3, 2)], 2: [(2, 1)], 3: [(3, 1)], 4: [(0, 1)], 6: [(0, 2)], 7: [(0, 3)], 8: [(0, 3)], 9: [(0, 2)], 11: [(0, 1)], 12: [(3, 1)], 13: [(2, 1)], 14: [(3, 2)]}
    segs = []  # (cell j, cell i, edgeA, edgeB)
    for k, es in table.items():
        m = cs == k
        for ea, eb in es:
            segs.append((jj[m], ii[m], np.full(m.sum(), ea), np.full(m.sum(), eb)))
    for k, (e_hi, e_lo) in {5: (((0, 3), (2, 1)), ((0, 1), (3, 2))), 10: (((0, 1), (3, 2)), ((0, 3), (2, 1)))}.items():
        for center_above, es in ((True, e_hi), (False, e_lo)):
            m = (cs == k) & (cen == center_above)
            for ea, eb in es:
                segs.append((jj[m], ii[m], np.full(m.sum(), ea), np.full(m.sum(), eb)))
    sj = np.concatenate([s[0] for s in segs]); si = np.concatenate([s[1] for s in segs])
    ea = np.concatenate([s[2] for s in segs]); eb = np.concatenate([s[3] for s in segs])
    Zf = Z.astype(np.float64)

    def node(e):
        # 水平边（T/B）连接 (j,i)-(j,i+1)；垂直边（L/R）连接 (j,i)-(j+1,i)
        horiz = (e == 0) | (e == 2)
        j = np.where(e == 2, sj + 1, sj)
        i = np.where(e == 1, si + 1, si)
        i1 = np.where(horiz, i + 1, i)
        j1 = np.where(horiz, j, j + 1)
        z0, z1 = Zf[j, i], Zf[j1, i1]
        t = (level - z0) / np.where(z1 == z0, 1, z1 - z0)
        return np.stack([i + np.where(horiz, t, 0.0), j + np.where(horiz, 0.0, t)], -1)

    p0, p1 = node(ea), node(eb)
    lines = shapely.linestrings(np.stack([p0, p1], 1))
    merged = shapely.line_merge(shapely.multilinestrings(lines))
    return [np.asarray(g.coords) for g in getattr(merged, 'geoms', [merged])]


def chaikin(c, n=2):
    closed = np.allclose(c[0], c[-1])
    for _ in range(n):
        if len(c) < 3:
            break
        q = 0.75 * c[:-1] + 0.25 * c[1:]
        r = 0.25 * c[:-1] + 0.75 * c[1:]
        mid = np.empty((2 * len(q), 2))
        mid[0::2], mid[1::2] = q, r
        c = np.vstack([mid, mid[:1]]) if closed else np.vstack([c[:1], mid, c[-1:]])
    return c


def depth_factor(depth):
    """深水的 DEM 噪声大：平滑半径与最小线长随水深增大（50 m 以浅 1 倍，5000 m 约 4 倍）。"""
    return 1 + 3 * float(np.clip(np.log10(max(depth, 50) / 50) / 2, 0, 1))


def isobath_features(land_ll):
    levels = [float(v) for v in SEA['isobaths']]
    dem = np.load(os.path.join(WORK, 'dem.npy')).astype(np.float32)
    insets = json.load(open(os.path.join(WORK, 'dem_insets.json'))) if os.path.exists(os.path.join(WORK, 'dem_insets.json')) else []
    hi_raw = [(m, np.load(os.path.join(WORK, f'dem_inset{m["k"]}.npy'))) for m in insets]
    out = []
    for lv in levels:
        f = depth_factor(-lv)
        sm = ndimage.gaussian_filter(dem, SMOOTH * f, mode='nearest')
        hi = [(m, ndimage.gaussian_filter(h, SMOOTH * f * m['ss'], mode='nearest')) for m, h in hi_raw]
        lines = [chaikin(c + 0.5) for c in contour_lines(sm, lv)]  # 画布世界坐标（像素中心 +0.5）
        geoms = [shapely.linestrings(c) for c in lines if len(c) >= 2]
        main = shapely.multilinestrings(geoms) if geoms else shapely.MultiLineString()
        parts = [main]
        for m, h in hi:
            x0, y0, ss = m['x0'], m['y0'], m['ss']
            rect = box(x0, y0, x0 + m['w'], y0 + m['h'])
            parts[0] = shapely.difference(parts[0], rect) if not parts[0].is_empty else parts[0]
            hl = []
            for c in contour_lines(h, lv):
                c = chaikin(c, 1)
                hl.append(shapely.linestrings(np.stack([x0 + (c[:, 0] + 0.5) / ss, y0 + (c[:, 1] + 0.5) / ss], -1)))
            if hl:
                parts.append(shapely.intersection(shapely.multilinestrings(hl), rect))
        gl = [g for p in parts if not p.is_empty for g in getattr(p, 'geoms', [p]) if g.geom_type == 'LineString']
        if not gl:
            continue
        merged = shapely.line_merge(shapely.multilinestrings(gl))
        # 世界坐标 → 经纬度，裁到处理范围，去掉陆地
        def to_ll(g):
            x, y = np.asarray(g.coords).T
            lon, lat = proj.inverse(x, y)
            return shapely.linestrings(np.stack([lon, lat], -1))
        ll = [to_ll(g) for g in getattr(merged, 'geoms', [merged]) if g.length > 0]
        mls = shapely.multilinestrings(ll)
        mls = shapely.intersection(mls, CLIP)
        mls = shapely.difference(mls, land_ll)
        n_before = len(getattr(mls, 'geoms', [mls]))
        minlen = 0.15 * f * f  # 度：剔除碎屑（深水更严）
        keep = [g for g in getattr(mls, 'geoms', [mls]) if g.geom_type == 'LineString' and g.length >= minlen]
        log('vectors', f'等深线 {-lv:.0f} m：{len(keep)}/{n_before} 条')
        for g in keep:
            out.append(feat(g, depth=int(-lv)))
    return out


def write_isobaths(land_ll):
    feats = isobath_features(land_ll)
    dump(fc(feats), os.path.join(LL, 'isobaths.geojson'))
    log('vectors', f'等深线共 {len(feats)} 条')
