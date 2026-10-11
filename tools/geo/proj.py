"""d3.geoConicConformal 的 numpy 复刻（正算/反算），参数取自 campaigns/<id>/config/frame.json。

d3 管线：经纬度(度) → 弧度 → rotate(λ+δλ, 包裹到 [-π,π]) → conicConformalRaw → scaleTranslate
  x = tx + k*(x_raw - cx),  y = ty - k*(y_raw - cy)，其中 (cx,cy) = raw(center)。
"""
import json
import os
import numpy as np
from common import CDIR

FRAME = json.load(open(os.path.join(CDIR, 'config', 'frame.json')))
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
    lam = _wrap(np.asarray(lon, dtype=np.float64) * _R + _dlam)
    x, y = _raw(lam, np.asarray(lat, dtype=np.float64) * _R)
    return _TX + _K * (x - _CX), _TY - _K * (y - _CY)


def inverse(X, Y):
    """世界坐标 → 经纬度(度)。"""
    x = (np.asarray(X, dtype=np.float64) - _TX) / _K + _CX
    y = -(np.asarray(Y, dtype=np.float64) - _TY) / _K + _CY
    lam, phi = _raw_inv(x, y)
    return _wrap(lam - _dlam) / _R, phi / _R


W, H = FRAME['width'], FRAME['height']


def canvas_lonlat_bounds(pad=0.1):
    """画布四边反算的经纬度范围（DEM、底图覆盖用）。"""
    ex = np.concatenate([np.linspace(0, W, 200), np.full(200, W), np.linspace(0, W, 200), np.zeros(200)])
    ey = np.concatenate([np.zeros(200), np.linspace(0, H, 200), np.full(200, H), np.linspace(0, H, 200)])
    lon, lat = inverse(ex, ey)
    return lon.min() - pad, lat.min() - pad, lon.max() + pad, lat.max() + pad
