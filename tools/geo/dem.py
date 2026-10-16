"""DEM：AWS Terrarium 高程瓦片（缓存于 .cache/geo/terrarium）→ 拼接 → 按 frame 投影反算 + 双三次样条重采样到世界坐标。
输出 .work/geo/<id>/dem.npy（float32，米，W×H）。geo.config.json 的 dem.zoom 选瓦片级别（缺省 9 ≈ 190 m/像素）。
可选 dem.insets: [{ "bbox": [w, s, e, n], "zoom": 9, "ss": 4, "feather": 0.25 }]：只对子区域下载更高级别的瓦片，在 dem.npy 里羽化混入；
同时把子区域按 ss 倍超采样的网格写到 dem_inset<k>.npy（登记在 dem_insets.json，等深线提取用）。缺省不启用。
    GEO_CAMPAIGN=<id> python tools/geo/dem.py [--download-only]
"""
import io, math, os, sys, time
import numpy as np
import requests
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from common import CFG, GEO_CACHE, WORK, log
import proj

Z = int((CFG.get('dem') or {}).get('zoom', 9))
CACHE = os.path.join(GEO_CACHE, 'terrarium', str(Z))
OUT = os.path.join(WORK, 'dem.npy')
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
N = 2 ** Z


def lon2x(lon):
    return (np.asarray(lon) + 180) / 360 * N


def lat2y(lat):
    r = np.radians(np.asarray(lat))
    return (1 - np.arcsinh(np.tan(r)) / np.pi) / 2 * N


W, H = proj.W, proj.H
lon0, lat0, lon1, lat1 = proj.canvas_lonlat_bounds(0.1)
X0, X1 = int(math.floor(lon2x(lon0))), int(math.floor(lon2x(lon1)))
Y0, Y1 = int(math.floor(lat2y(lat1))), int(math.floor(lat2y(lat0)))
log('dem', f'经度 {lon0:.2f}–{lon1:.2f} 纬度 {lat0:.2f}–{lat1:.2f} → z{Z} 瓦片 x {X0}..{X1} y {Y0}..{Y1} 共 {(X1 - X0 + 1) * (Y1 - Y0 + 1)} 张')


def fetch(xy):
    x, y = xy
    p = os.path.join(CACHE, str(x), f'{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 100:
        return 'cache'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    for k in range(6):
        try:
            r = requests.get(URL.format(z=Z, x=x, y=y), timeout=30)
            if r.status_code == 200 and len(r.content) > 100:
                Image.open(io.BytesIO(r.content)).verify()
                with open(p + '.tmp', 'wb') as f:
                    f.write(r.content)
                os.replace(p + '.tmp', p)
                return 'ok'
        except Exception:  # noqa: BLE001 - 网络错误重试
            pass
        time.sleep(1.5 * (k + 1))
    raise RuntimeError(f'下载失败 {x},{y}')


jobs = [(x, y) for x in range(X0, X1 + 1) for y in range(Y0, Y1 + 1)]
with ThreadPoolExecutor(8) as pool:
    res = list(pool.map(fetch, jobs))
log('dem', f'下载 {res.count("ok")} 张，缓存命中 {res.count("cache")} 张')


# ---------- 可选：子区域高精度 DEM（dem.insets） ----------
INSETS = (CFG.get('dem') or {}).get('insets') or []


def inset_tiles(ins):
    z = int(ins['zoom']); n = 2 ** z
    w, s_, e, nn = ins['bbox']
    pad = 0.05
    l2x = lambda lon: (lon + 180) / 360 * n
    l2y = lambda lat: (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    xa, xb = int(math.floor(l2x(w - pad))), int(math.floor(l2x(e + pad)))
    ya, yb = int(math.floor(l2y(nn + pad))), int(math.floor(l2y(s_ - pad)))
    return z, xa, xb, ya, yb


def fetch_z(z, x, y):
    p = os.path.join(GEO_CACHE, 'terrarium', str(z), str(x), f'{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 100:
        return 'cache'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    for k in range(6):
        try:
            r = requests.get(URL.format(z=z, x=x, y=y), timeout=30)
            if r.status_code == 200 and len(r.content) > 100:
                Image.open(io.BytesIO(r.content)).verify()
                with open(p + '.tmp', 'wb') as f:
                    f.write(r.content)
                os.replace(p + '.tmp', p)
                return 'ok'
        except Exception:  # noqa: BLE001
            pass
        time.sleep(1.5 * (k + 1))
    raise RuntimeError(f'下载失败 z{z} {x},{y}')


for _i, _ins in enumerate(INSETS):
    _z, _xa, _xb, _ya, _yb = inset_tiles(_ins)
    _jobs = [(x, y) for x in range(_xa, _xb + 1) for y in range(_ya, _yb + 1)]
    with ThreadPoolExecutor(16) as pool:
        _res = list(pool.map(lambda xy: fetch_z(_z, *xy), _jobs))
    log('dem', f'子区域 {_i} z{_z} {_ins["bbox"]}：{len(_jobs)} 张（新下载 {_res.count("ok")}）')
if '--download-only' in sys.argv:
    sys.exit(0)

TW = 256
mos = np.zeros(((Y1 - Y0 + 1) * TW, (X1 - X0 + 1) * TW), np.float32)
for x, y in jobs:
    a = np.asarray(Image.open(os.path.join(CACHE, str(x), f'{y}.png')).convert('RGB'), np.float32)
    mos[(y - Y0) * TW:(y - Y0 + 1) * TW, (x - X0) * TW:(x - X0 + 1) * TW] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
coef = ndimage.spline_filter(mos.astype(np.float64), order=3)
dem = np.zeros((H, W), np.float32)
xs = np.arange(W) + 0.5
for j0 in range(0, H, 512):
    j1 = min(H, j0 + 512)
    XX, YY = np.meshgrid(xs, np.arange(j0, j1) + 0.5)
    lon, lat = proj.inverse(XX, YY)
    dem[j0:j1] = ndimage.map_coordinates(coef, [(lat2y(lat) - Y0) * TW - 0.5, (lon2x(lon) - X0) * TW - 0.5], order=3, prefilter=False, mode='nearest')

def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def inset_weight(lon, lat, bbox, feather):
    w, s_, e, nn = bbox
    d = np.minimum(np.minimum(lon - w, e - lon), np.minimum(lat - s_, nn - lat))
    return smoothstep(d / feather)


insets_meta = []
for _i, _ins in enumerate(INSETS):
    z, xa, xb, ya, yb = inset_tiles(_ins)
    ss = int(_ins.get('ss', 4)); feather = float(_ins.get('feather', 0.25)); n = 2 ** z
    mosi = np.zeros(((yb - ya + 1) * TW, (xb - xa + 1) * TW), np.float32)
    for x in range(xa, xb + 1):
        for y in range(ya, yb + 1):
            a = np.asarray(Image.open(os.path.join(GEO_CACHE, 'terrarium', str(z), str(x), f'{y}.png')).convert('RGB'), np.float32)
            mosi[(y - ya) * TW:(y - ya + 1) * TW, (x - xa) * TW:(x - xa + 1) * TW] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    coef_i = ndimage.spline_filter(mosi.astype(np.float64), order=3)
    l2x = lambda lon: (np.asarray(lon) + 180) / 360 * n
    l2y = lambda lat: (1 - np.arcsinh(np.tan(np.radians(np.asarray(lat)))) / np.pi) / 2 * n
    bw, bs, be, bn = _ins['bbox']
    # 窗口：子区域边界（含羽化外延）投影后的外接矩形，取整
    ex = np.concatenate([np.linspace(bw, be, 100), np.full(100, be), np.linspace(be, bw, 100), np.full(100, bw)])
    ey = np.concatenate([np.full(100, bs), np.linspace(bs, bn, 100), np.full(100, bn), np.linspace(bn, bs, 100)])
    px_, py_ = proj.forward(ex, ey)
    x0, x1 = max(0, int(math.floor(px_.min())) - 1), min(W, int(math.ceil(px_.max())) + 1)
    y0, y1 = max(0, int(math.floor(py_.min())) - 1), min(H, int(math.ceil(py_.max())) + 1)
    wnd_w, wnd_h = x1 - x0, y1 - y0
    # 超采样网格（世界单位 1/ss）上的子区域 DEM
    gx = x0 + (np.arange(wnd_w * ss) + 0.5) / ss
    gy = y0 + (np.arange(wnd_h * ss) + 0.5) / ss
    hi_raw = np.zeros((wnd_h * ss, wnd_w * ss), np.float32)
    w_hi = np.zeros_like(hi_raw)
    for r0 in range(0, wnd_h * ss, 512):
        r1 = min(wnd_h * ss, r0 + 512)
        XX, YY = np.meshgrid(gx, gy[r0:r1])
        lon, lat = proj.inverse(XX, YY)
        hi_raw[r0:r1] = ndimage.map_coordinates(coef_i, [(l2y(lat) - ya) * TW - 0.5, (l2x(lon) - xa) * TW - 0.5], order=3, prefilter=False, mode='nearest')
        w_hi[r0:r1] = inset_weight(lon, lat, _ins['bbox'], feather)
    # 基础 DEM 双线性上采样到超采样网格，与子区域按权重混合
    base_win = dem[y0:y1, x0:x1].astype(np.float32)
    base_up = ndimage.zoom(base_win, ss, order=1, mode='nearest', grid_mode=True)[:wnd_h * ss, :wnd_w * ss]
    hi = (base_up * (1 - w_hi) + hi_raw * w_hi).astype(np.float32)
    # 画布分辨率：块平均后与基础 DEM 混合
    blk = hi_raw.reshape(wnd_h, ss, wnd_w, ss).mean((1, 3))
    w_lo = w_hi.reshape(wnd_h, ss, wnd_w, ss).mean((1, 3))
    dem[y0:y1, x0:x1] = (base_win * (1 - w_lo) + blk * w_lo).astype(np.float32)
    np.save(os.path.join(WORK, f'dem_inset{_i}.npy'), hi)
    insets_meta.append({'k': _i, 'x0': x0, 'y0': y0, 'w': wnd_w, 'h': wnd_h, 'ss': ss, 'bbox': _ins['bbox'], 'zoom': z})
    log('dem', f'子区域 {_i}：窗口 {wnd_w}×{wnd_h} 像素 ×{ss}，高程 {hi.min():.0f}–{hi.max():.0f} m')
if insets_meta:
    import json
    json.dump(insets_meta, open(os.path.join(WORK, 'dem_insets.json'), 'w'))
elif os.path.exists(os.path.join(WORK, 'dem_insets.json')):
    os.remove(os.path.join(WORK, 'dem_insets.json'))
np.save(OUT, dem)
log('dem', f'写出 {OUT} {dem.shape}  {dem.min():.0f}–{dem.max():.0f} m')
