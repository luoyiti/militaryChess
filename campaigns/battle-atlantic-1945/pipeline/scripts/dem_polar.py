"""大西洋海战的地理管线：DEM（Terrarium z5）→ .work/geo/battle-atlantic-1945/dem.npy。

为什么不直接用 `sh tools/geo/run.sh battle-atlantic-1945` 的 dem 步
---------------------------------------------------------------
本战役的画布是北大西洋全幅圆锥（`config/geo.conframe.bbox = [-85,-12,45,78]`），
`frame.json` 的 8192×6464 画布四边反算到约 100°W–140°E、36°S–88°N：
**画布上缘正中的像素落在北纬 88.6°**，而 Web Mercator（EPSG:3857）只到 ±85.0511°，
`tools/geo/dem.py` 用 `lat2y()` 算出 z5 的 `Y0 = -7`，于是会去请求
`terrarium/5/x/-7.png … y=-1.png` —— S3 一律返回 404，`fetch()` 重试 6 次后抛
`RuntimeError: 下载失败`，整条管线在这一步中止（frame / fetch / borders / vectors 之前都已成功）。

本脚本与 `tools/geo/dem.py` 的算法逐行一致（Terrarium 瓦片 → 拼接 → 按 `config/frame.json`
反算经纬度 → 三次样条重采样到世界坐标，`order=3, prefilter=False`），只有一处不同：
**瓦片行范围钳到 y ≥ 0**，超出 85.05°N 的极区由 `map_coordinates(mode='nearest')`
按 85°N 的最北一行外推。影响面：画布 512×404 的场网格里第 0–2 行、以及底图上缘中央
约 0.6% 的像素（`.work` 复算：51712 个采样像素中 325 个落在 85.05°N 以北），全部在北冰洋，
不涉及任何战场、航线与陆地；等深线在该处沿用 85°N 边缘的深度，视觉上是上缘的平直收口。

上游（会下载 440 张 z5 瓦片到 `.cache/geo/terrarium/5/`，全部战役共用）：
    .venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/dem_polar.py
之后照常跑管线的其余步骤（dem 由本脚本产出，故跳过）：
    sh tools/geo/run.sh battle-atlantic-1945 --skip-dem
若只想重算矢量（改了 borders / rivers / lakes / sea 等）：
    sh tools/geo/run.sh battle-atlantic-1945 --skip-dem --from borders

产物 `.work/geo/battle-atlantic-1945/dem.npy` 属本地中间产物（`.work/` 在 .gitignore 里），
提交的是它生成的 `public/campaigns/battle-atlantic-1945/{geo,tiles,terrain}`。
"""
import io
import math
import os
import sys
import time

import numpy as np
import requests
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..'))
CAMPAIGN = 'battle-atlantic-1945'
os.environ.setdefault('GEO_CAMPAIGN', CAMPAIGN)
sys.path.insert(0, os.path.join(ROOT, 'tools', 'geo'))

Z = 5
CACHE = os.path.join(ROOT, '.cache', 'geo', 'terrarium', str(Z))
OUT = os.path.join(ROOT, '.work', 'geo', CAMPAIGN, 'dem.npy')
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
N = 2 ** Z

import proj  # noqa: E402  （读 campaigns/<id>/config/frame.json）

lon2x = lambda lon: (np.asarray(lon, dtype=np.float64) + 180) / 360 * N
lat2y = lambda lat: (1 - np.arcsinh(np.tan(np.radians(np.asarray(lat, dtype=np.float64)))) / np.pi) / 2 * N


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
        except Exception:  # noqa: BLE001 — 网络错误重试
            pass
        time.sleep(1.5 * (k + 1))
    raise RuntimeError(f'下载失败 {x},{y}')


def main():
    from concurrent.futures import ThreadPoolExecutor

    W, H = proj.W, proj.H
    lon0, lat0, lon1, lat1 = proj.canvas_lonlat_bounds(0.1)
    X0, X1 = int(math.floor(lon2x(lon0))), int(math.floor(lon2x(lon1)))
    # ← 与 tools/geo/dem.py 的唯一区别：行范围钳到 Web Mercator 上限（y ≥ 0）
    Y0, Y1 = max(0, int(math.floor(lat2y(lat1)))), int(math.floor(lat2y(lat0)))
    jobs = [(x, y) for x in range(X0, X1 + 1) for y in range(Y0, Y1 + 1)]
    print(f'[dem:{CAMPAIGN}] 经度 {lon0:.2f}–{lon1:.2f} 纬度 {lat0:.2f}–{lat1:.2f} → '
          f'z{Z} 瓦片 x {X0}..{X1} y {Y0}..{Y1} 共 {len(jobs)} 张（钳到 85.05°N）', flush=True)
    t0 = time.time()
    with ThreadPoolExecutor(12) as pool:
        res = list(pool.map(fetch, jobs))
    print(f'[dem:{CAMPAIGN}] 下载 {res.count("ok")} 张，缓存命中 {res.count("cache")} 张，{time.time() - t0:.0f}s', flush=True)

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
        # mode='nearest'：85.05°N 以北按最北一行外推（见模块文档）
        dem[j0:j1] = ndimage.map_coordinates(coef, [(lat2y(lat) - Y0) * TW - 0.5, (lon2x(lon) - X0) * TW - 0.5],
                                             order=3, prefilter=False, mode='nearest')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    np.save(OUT, dem)
    print(f'[dem:{CAMPAIGN}] 写出 {OUT} {dem.shape} {dem.min():.0f}–{dem.max():.0f} m', flush=True)


if __name__ == '__main__':
    main()
