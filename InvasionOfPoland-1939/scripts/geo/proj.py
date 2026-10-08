"""d3.geoConicConformal 的 numpy 复刻（正算/反算），参数一律取自 config/frame.json。

d3 管线：经纬度(度) → 弧度 → rotate(λ+δλ, 包裹到 [-π,π]) → conicConformalRaw → scaleTranslate
  x = tx + k*(x_raw - cx),  y = ty - k*(y_raw - cy)，其中 (cx,cy) = raw(center)（center 在旋转后坐标系中取）。
"""
import json
import os
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FRAME = json.load(open(os.path.join(ROOT, 'config', 'frame.json')))

_P = FRAME['projection']
_R = np.pi / 180
_phi0, _phi1 = _P['parallels'][0] * _R, _P['parallels'][1] * _R
_dlam = _P['rotate'][0] * _R
_K = FRAME['scale']
_TX, _TY = FRAME['translate']


def _tany(y):
    return np.tan((np.pi / 2 + y) / 2)


_cy0 = np.cos(_phi0)
_N = np.log(_cy0 / np.cos(_phi1)) / np.log(_tany(_phi1) / _tany(_phi0))
_F = _cy0 * _tany(_phi0) ** _N / _N


def _raw(lam, phi):
    r = _F / _tany(phi) ** _N
    return r * np.sin(_N * lam), _F - r * np.cos(_N * lam)


def _raw_inv(x, y):
    fy = _F - y
    r = np.sign(_N) * np.sqrt(x * x + fy * fy)
    lam = np.arctan2(x, np.abs(fy)) * np.sign(fy)
    return lam / _N, 2 * np.arctan((_F / r) ** (1 / _N)) - np.pi / 2


_CX, _CY = _raw(_P['center'][0] * _R, _P['center'][1] * _R)


def _wrap(l):
    return np.where(l > np.pi, l - 2 * np.pi, np.where(l < -np.pi, l + 2 * np.pi, l))


def forward(lon, lat):
    """经纬度(度) → 世界坐标 (x, y)，y 向下。"""
    lon = np.asarray(lon, dtype=np.float64)
    lat = np.asarray(lat, dtype=np.float64)
    lam = _wrap(lon * _R + _dlam)
    x, y = _raw(lam, lat * _R)
    return _TX + _K * (x - _CX), _TY - _K * (y - _CY)


def inverse(X, Y):
    """世界坐标 → 经纬度(度)。"""
    X = np.asarray(X, dtype=np.float64)
    Y = np.asarray(Y, dtype=np.float64)
    x = (X - _TX) / _K + _CX
    y = -(Y - _TY) / _K + _CY
    lam, phi = _raw_inv(x, y)
    return _wrap(lam - _dlam) / _R, phi / _R


W, H = FRAME['width'], FRAME['height']

if __name__ == '__main__':
    import sys
    # 一致性校验：对比 parity.mjs 用 d3 投影的结果
    ref = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '.work/a/parity.json')))
    lon = np.array([r['ll'][0] for r in ref]); lat = np.array([r['ll'][1] for r in ref])
    dx = np.array([r['xy'][0] for r in ref]); dy = np.array([r['xy'][1] for r in ref])
    px, py = forward(lon, lat)
    err = np.hypot(px - dx, py - dy)
    ilon, ilat = inverse(dx, dy)
    ierr = np.hypot(ilon - lon, ilat - lat)
    print(f'[parity] 地名点数 {len(ref)}  正算最大误差 {err.max():.3e} 世界单位  平均 {err.mean():.3e}')
    print(f'[parity] 反算最大误差 {ierr.max():.3e} 度')
    # 画布四角/四边中点反算（供 DEM 覆盖范围参考）
    cx, cy = inverse([0, W, 0, W, W / 2, W / 2], [0, 0, H, H, 0, H])
    print('[parity] 画布角点经纬度', [(round(a, 3), round(b, 3)) for a, b in zip(cx, cy)])
    assert err.max() < 0.5, '投影误差超限'
