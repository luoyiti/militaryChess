"""DEM：下载 AWS Terrarium z9 原始高程瓦片（缓存），拼接，按 frame 投影反算 + 双三次样条重采样到英国战区。
输出 .work/a/dem_8192.npy（float32，米，海面以下保留原值）。
覆盖范围 = 当前画布四边反算经纬度外扩 0.1°。全部产物可离线读取。
"""
import os, io, math, sys, time, json
import numpy as np
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
import proj

Z = 9
CACHE = os.path.join(proj.ROOT, 'scripts/.cache/a/terrarium', str(Z))
OUT = os.path.join(proj.ROOT, '.work/a/dem_8192.npy')
URL = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
MIRRORS = [URL, 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', 'https://elevation-tiles-prod-eu.s3.eu-central-1.amazonaws.com/terrarium/{z}/{x}/{y}.png']
N = 2 ** Z


def lon2x(lon):
    return (np.asarray(lon) + 180) / 360 * N


def lat2y(lat):
    r = np.radians(np.asarray(lat))
    return (1 - np.arcsinh(np.tan(r)) / np.pi) / 2 * N


# 画布边界反算
W, H = proj.W, proj.H
ex = np.concatenate([np.linspace(0, W, 200), np.full(200, W), np.linspace(0, W, 200), np.zeros(200)])
ey = np.concatenate([np.zeros(200), np.linspace(0, H, 200), np.full(200, H), np.linspace(0, H, 200)])
elon, elat = proj.inverse(ex, ey)
lon0, lon1 = elon.min() - 0.1, elon.max() + 0.1
lat0, lat1 = elat.min() - 0.1, elat.max() + 0.1
X0, X1 = int(math.floor(lon2x(lon0))), int(math.floor(lon2x(lon1)))
Y0, Y1 = int(math.floor(lat2y(lat1))), int(math.floor(lat2y(lat0)))
print(f'[dem] 经度 {lon0:.2f}–{lon1:.2f} 纬度 {lat0:.2f}–{lat1:.2f} → 瓦片 x {X0}..{X1} y {Y0}..{Y1} 共 {(X1-X0+1)*(Y1-Y0+1)} 张', flush=True)


def fetch(xy):
    x, y = xy
    p = os.path.join(CACHE, str(x), f'{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 100:
        return 'cache'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    error = 'unknown'
    for k in range(6):
        try:
            r = requests.get(MIRRORS[k % len(MIRRORS)].format(z=Z, x=x, y=y), timeout=(10,20))
            error = f'HTTP {r.status_code}, {len(r.content)} bytes'
            if r.status_code == 200 and len(r.content) > 100:
                Image.open(io.BytesIO(r.content)).verify()
                with open(p + '.tmp', 'wb') as f:
                    f.write(r.content)
                os.replace(p + '.tmp', p)
                return 'ok'
        except Exception as e:  # noqa
            error = type(e).__name__
        time.sleep(1.5 * (k + 1))
    raise RuntimeError(f'下载失败 {x},{y}: {error}')


jobs = [(x, y) for x in range(X0, X1 + 1) for y in range(Y0, Y1 + 1)]
res, failures = [], []
with ThreadPoolExecutor(12) as ex_:
    for done in as_completed([ex_.submit(fetch, j) for j in jobs]):
        try:
            res.append(done.result())
        except Exception as error:
            failures.append(str(error))
        count = len(res) + len(failures)
        if count % 100 == 0 or count == len(jobs):
            print(f'[dem] 已验证 {count}/{len(jobs)} 瓦片；待重试 {len(failures)}', flush=True)
print(f'[dem] 下载 {res.count("ok")} 张，缓存命中 {res.count("cache")} 张', flush=True)
if failures:
    raise RuntimeError("Terrarium tiles failed; rerun to retry missing tiles: " + "; ".join(failures))

if '--download-only' in sys.argv:
    sys.exit(0)

# 拼接
TW = 256
mos = np.zeros(((Y1 - Y0 + 1) * TW, (X1 - X0 + 1) * TW), np.float32)
for x, y in jobs:
    a = np.asarray(Image.open(os.path.join(CACHE, str(x), f'{y}.png')).convert('RGB'), np.float32)
    e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    mos[(y - Y0) * TW:(y - Y0 + 1) * TW, (x - X0) * TW:(x - X0 + 1) * TW] = e
print('[dem] 拼接', mos.shape, f'高程 {mos.min():.0f}–{mos.max():.0f} m')

# 双三次样条（order=3）重采样：世界像素中心 (i+0.5, j+0.5) → 经纬度 → 墨卡托瓦片像素
coef = ndimage.spline_filter(mos.astype(np.float64), order=3)
dem = np.zeros((H, W), np.float32)
xs = np.arange(W) + 0.5
for j0 in range(0, H, 512):
    j1 = min(H, j0 + 512)
    XX, YY = np.meshgrid(xs, np.arange(j0, j1) + 0.5)
    lon, lat = proj.inverse(XX, YY)
    px = (lon2x(lon) - X0) * TW - 0.5
    py = (lat2y(lat) - Y0) * TW - 0.5
    dem[j0:j1] = ndimage.map_coordinates(coef, [py, px], order=3, prefilter=False, mode='nearest')
np.save(OUT, dem)
json.dump({'provider': 'Mapzen/Terrarium Terrain Tiles on AWS', 'urlTemplate': URL, 'officialMirrors': MIRRORS,
           'source': 'https://registry.opendata.aws/terrain-tiles/', 'zoom': Z,
           'tiles': {'x': [X0, X1], 'y': [Y0, Y1], 'count': len(jobs)},
           'bbox': [float(lon0), float(lat0), float(lon1), float(lat1)],
           'frameBbox': proj.FRAME['bbox'], 'shape': [H, W], 'resampling': 'cubic spline (order=3)',
           'minElev': float(dem.min()), 'maxElev': float(dem.max()),
           'note': '真实现代高程；地貌用于1940历史背景，不代表1940精确植被/建筑表面。'},
          open(os.path.join(proj.ROOT, '.work/a/dem_source.json'), 'w'), ensure_ascii=False, indent=2)
print(f'[dem] 写出 {OUT} {dem.shape}  {dem.min():.0f}–{dem.max():.0f} m（世界 1 单位 ≈ {proj.FRAME["kmPerUnit"]*1000:.0f} m，直接在 8192 级双三次重采样）', flush=True)
