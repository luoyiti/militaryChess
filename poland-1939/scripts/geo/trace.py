"""沿 DEM 谷底/山脊的最小代价路径追踪（用于数字化 NE 缺失的河流与界河、山脊国界）。

trace(waypoints, mode='valley'|'ridge') → [(lon,lat), ...]
在世界坐标 DEM(8192 级) 上，相邻航点之间用 8 邻域 Dijkstra 求最小代价路径：
  valley：代价 = 1 + (相对局部最低点高差/4 m)^2    ridge：代价 = 1 + (相对局部最高点落差/6 m)^2
结果按 0.8 世界单位 Douglas-Peucker 简化后反算经纬度。
"""
import os, sys
import numpy as np
from scipy import ndimage, sparse
from scipy.sparse import csgraph
from shapely.geometry import LineString
sys.path.insert(0, os.path.dirname(__file__))
import proj
from geo_common import WORK

_DEM = None


def _dem():
    global _DEM
    if _DEM is None:
        _DEM = np.load(os.path.join(WORK, 'dem_8192.npy'), mmap_mode='r')
    return _DEM


def _segment(p, q, mode, margin=40, win=31):
    dem = _dem()
    (x0, x1), (y0, y1) = sorted([p[0], q[0]]), sorted([p[1], q[1]])
    L = np.hypot(q[0] - p[0], q[1] - p[1])
    m = int(margin + 0.25 * L)
    X0, Y0 = max(0, int(x0) - m), max(0, int(y0) - m)
    X1, Y1 = min(dem.shape[1], int(x1) + m + 1), min(dem.shape[0], int(y1) + m + 1)
    E = np.asarray(dem[Y0:Y1, X0:X1], np.float64)
    if mode == 'valley':
        rel = E - ndimage.minimum_filter(E, size=win)
        c = 1 + (rel / 4.0) ** 2
    else:
        rel = ndimage.maximum_filter(E, size=win) - E
        c = 1 + (rel / 6.0) ** 2
    h, w = c.shape
    idx = np.arange(h * w).reshape(h, w)
    rows, cols, wts = [], [], []
    for dy, dx in [(0, 1), (1, 0), (1, 1), (1, -1)]:
        if dx >= 0:
            a = idx[0:h - dy, 0:w - dx]; b = idx[dy:h, dx:w]
        else:
            a = idx[0:h - dy, -dx:w]; b = idx[dy:h, 0:w + dx]
        a = a.ravel(); b = b.ravel()
        d = np.hypot(dx, dy)
        wt = d * 0.5 * (c.ravel()[a] + c.ravel()[b])
        rows += [a, b]; cols += [b, a]; wts += [wt, wt]
    G = sparse.csr_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(h * w, h * w))
    s = idx[int(round(p[1])) - Y0, int(round(p[0])) - X0]
    t = idx[int(round(q[1])) - Y0, int(round(q[0])) - X0]
    _, pred = csgraph.dijkstra(G, indices=s, return_predecessors=True, min_only=False)
    path = [t]
    while path[-1] != s:
        path.append(pred[path[-1]])
        if path[-1] < 0:
            raise RuntimeError('路径追踪失败')
    path = path[::-1]
    yy, xx = np.divmod(np.array(path), w)
    return np.stack([xx + X0 + 0.5, yy + Y0 + 0.5], 1)


def trace(waypoints, mode='valley', tol=0.8, keep_ends=True, snap=10):
    lon = np.array([p[0] for p in waypoints]); lat = np.array([p[1] for p in waypoints])
    X, Y = proj.forward(lon, lat)
    # 航点吸附到半径 snap 像素内的局部最低(谷)/最高(脊)点
    dem = _dem(); r = snap
    for i in range(len(X)):
        xi, yi = int(X[i]), int(Y[i])
        E = np.asarray(dem[yi - r:yi + r + 1, xi - r:xi + r + 1], np.float64)
        yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
        E = E + 0.15 * np.hypot(xx, yy) * (1 if mode == 'valley' else -1)
        j = np.argmin(E) if mode == 'valley' else np.argmax(E)
        X[i] = xi + xx.ravel()[j] + 0.5; Y[i] = yi + yy.ravel()[j] + 0.5
    pts = []
    for i in range(len(X) - 1):
        seg = _segment((X[i] - 0.5, Y[i] - 0.5), (X[i + 1] - 0.5, Y[i + 1] - 0.5), mode)
        pts.append(seg if i == 0 else seg[1:])
    P = np.vstack(pts)
    # 去掉回头路：像素重复出现时剪掉其间的环
    out, seen = [], {}
    for x, y in P:
        k = (int(x), int(y))
        if k in seen:
            j = seen[k]
            for q in out[j + 1:]:
                seen.pop((int(q[0]), int(q[1])), None)
            out = out[:j + 1]
            continue
        seen[k] = len(out); out.append((x, y))
    P = np.array(out)
    if keep_ends:
        P[0] = [X[0], Y[0]]; P[-1] = [X[-1], Y[-1]]
    # 轻度平滑（去掉像素阶梯），再简化
    if len(P) > 7:
        Ps = P.copy()
        Ps[1:-1] = ndimage.uniform_filter1d(P, 5, axis=0)[1:-1]
        P = Ps
    ls = LineString(P).simplify(tol)
    xy = np.array(ls.coords)
    lo, la = proj.inverse(xy[:, 0], xy[:, 1])
    return [(round(float(a), 5), round(float(b), 5)) for a, b in zip(lo, la)]


if __name__ == '__main__':
    r = trace([(26.37, 48.535), (26.20, 48.85), (26.18, 49.07), (26.14, 49.53)])
    print(len(r), r[:5], r[-3:])
