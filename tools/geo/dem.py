"""DEM：AWS Terrarium 高程瓦片（缓存于 .cache/geo/terrarium）→ 拼接 → 按 frame 投影反算 + 双三次样条重采样到世界坐标。
输出 .work/geo/<id>/dem.npy（float32，米，W×H）。geo.config.json 的 dem.zoom 选瓦片级别（缺省 9 ≈ 190 m/像素）。
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
np.save(OUT, dem)
log('dem', f'写出 {OUT} {dem.shape}  {dem.min():.0f}–{dem.max():.0f} m')
