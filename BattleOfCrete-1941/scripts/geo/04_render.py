"""复古参谋部地图风格底图渲染（世界坐标 8192×6996，一次性合成后下采样出各级瓦片）。

图层：泛黄纸张（纤维噪声/污渍/暗角/折痕）→ 分层设色 → 多方向柔和晕渲（主光 315°，辅光 270°/0°，按坡度调制，平原保持干净）
     → 海洋/湖泊（按离岸距离加深 + 雕版水波纹线）→ 沼泽横线点纹 → 森林小树点 → 海岸墨线。
不含国界、河流、文字。
输出：public/tiles/base/{z}/{x}_{y}.webp（z0..3，512px，边缘瓦片不补齐）、meta.json、public/tiles/overview.webp（宽 2048）、
     public/terrain/albedo.webp（宽 4096，无晕渲）、public/terrain/height.png（宽 1024，rg16）、terrain.json。
"""
import json, math, os, sys, time, shutil
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
import proj
from geo_common import WORK, ROOT

t0 = time.time()
F = proj.FRAME
W, H = F['width'], F['height']
PAL = json.load(open(os.path.join(ROOT, 'config/palette.json')))
XY = os.path.join(WORK, 'xy')
rng = np.random.default_rng(1939)


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def log(*a):
    print(f'[render {time.time() - t0:5.1f}s]', *a, flush=True)


# ---------- 栅格化矢量 ----------
def raster(name, filt=None, scale=1):
    img = Image.new('L', (W * scale, H * scale), 0)
    dr = ImageDraw.Draw(img)
    fcj = json.load(open(os.path.join(XY, name + '.geojson')))
    polys = []
    for f in fcj['features']:
        if filt and not filt(f['properties']):
            continue
        g = f['geometry']
        cs = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for p in cs:
            ext = np.array(p[0])
            area = abs(np.sum(ext[:-1, 0] * ext[1:, 1] - ext[1:, 0] * ext[:-1, 1])) / 2
            polys.append((area, p))
    polys.sort(key=lambda x: -x[0])
    for _, p in polys:
        dr.polygon([(x * scale, y * scale) for x, y in p[0]], fill=255)
        for hole in p[1:]:
            dr.polygon([(x * scale, y * scale) for x, y in hole], fill=0)
    a = np.asarray(img, np.float32) / 255
    if scale > 1:
        a = a.reshape(H, scale, W, scale).mean((1, 3))
    return a


land = raster('land_render', scale=2)
lakes = raster('lakes', scale=2)
marsh = raster('marsh')
forest = raster('forest')
water = np.clip(1 - land + lakes, 0, 1)  # 抗锯齿覆盖率
land_m = water < 0.5
log('栅格化完成')

# ---------- DEM ----------
dem = np.load(os.path.join(WORK, 'dem_8192.npy')).astype(np.float32)
dem_land = np.where(land_m, np.maximum(dem, 0), 0).astype(np.float32)
# 平原去噪：低地更强平滑（Terrarium 在平原有林冠/条带噪声），山区保留细节
d_s1 = ndimage.gaussian_filter(dem_land, 1.0)
d_s3 = ndimage.gaussian_filter(dem_land, 3.0)
wlow = np.clip((350 - d_s3) / 250, 0, 1)
dsm = d_s1 * (1 - wlow) + d_s3 * wlow
log('DEM 平滑完成')

# ---------- 纸张 ----------
paper = hexrgb(PAL['paper']['base']); plight = hexrgb(PAL['paper']['light']); pdark = hexrgb(PAL['paper']['dark'])


def noise(scale, aniso=1.0, seed=0):
    r = np.random.default_rng(seed)
    sh = (H // scale + 8, W // scale + 8)
    n = r.standard_normal(sh).astype(np.float32)
    n = ndimage.gaussian_filter(n, (1.0, aniso))
    n = ndimage.zoom(n, scale, order=1)[:H, :W]
    return n / (n.std() + 1e-6)


fib = 0.5 * noise(1, 6.0, 1) + 0.35 * noise(2, 3.0, 2)            # 横向纤维
mott = 0.6 * noise(48, 1.0, 3) + 0.4 * noise(160, 1.0, 4)          # 大尺度斑驳
grain = rng.standard_normal((H, W)).astype(np.float32)
tone = 0.010 * fib + 0.011 * mott + 0.006 * grain
# 污渍：若干柔和水渍（深色晕圈 + 内部略浅）+ 细小霉斑
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
stain = np.zeros((H, W), np.float32)
for k in range(9):
    cx, cy = rng.uniform(0.05, 0.95) * W, rng.uniform(0.05, 0.95) * H
    r0 = rng.uniform(180, 700)
    d = np.hypot((xx - cx) / r0, (yy - cy) / (r0 * rng.uniform(0.6, 1.2)))
    ring = np.exp(-((d - 1) / 0.06) ** 2) * 0.7 + np.exp(-(d / 0.9) ** 4) * 0.35
    stain += ring * rng.uniform(0.4, 1.0)
del d, ring
fox = np.zeros((H, W), np.float32)
for k in range(260):
    cx, cy = int(rng.uniform(0, W)), int(rng.uniform(0, H))
    rr = rng.uniform(2, 9)
    x0, x1, y0, y1 = max(0, cx - 30), min(W, cx + 30), max(0, cy - 30), min(H, cy + 30)
    fox[y0:y1, x0:x1] += np.exp(-((xx[y0:y1, x0:x1] - cx) ** 2 + (yy[y0:y1, x0:x1] - cy) ** 2) / (2 * rr * rr)) * rng.uniform(0.3, 1)
stain = ndimage.gaussian_filter(stain, 3) * (0.6 + 0.4 * (mott > 0))
# 暗角
vx, vy = (xx / W - 0.5) * 2, (yy / H - 0.5) * 2
vig = np.clip((np.maximum(np.abs(vx) ** 3, np.abs(vy) ** 3) * 0.6 + (vx ** 2 + vy ** 2) * 0.12), 0, 1)
# 折痕：三等分，暗线 + 一侧亮边，沿线强弱起伏
fold = np.zeros((H, W), np.float32); foldhl = np.zeros((H, W), np.float32)
for fx in (W / 3, 2 * W / 3):
    wob = fx + 3 * noise(64, 1, int(fx))[:, 0:1]
    dd = xx - wob
    var = 0.75 + 0.25 * noise(90, 1, int(fx) + 7)[:, 0:1]
    fold += np.exp(-(dd / 1.6) ** 2) * var + np.exp(-(dd / 14) ** 2) * 0.25 * var
    foldhl += np.exp(-((dd - 4) / 3) ** 2) * var
for fy in (H / 3, 2 * H / 3):
    wob = fy + 3 * noise(64, 1, int(fy))[0:1, :]
    dd = yy - wob
    var = 0.75 + 0.25 * noise(90, 1, int(fy) + 9)[0:1, :]
    fold += np.exp(-(dd / 1.6) ** 2) * var + np.exp(-(dd / 14) ** 2) * 0.25 * var
    foldhl += np.exp(-((dd - 4) / 3) ** 2) * var
del xx, yy, vx, vy, dd
log('纸张纹理完成')

# ---------- 分层设色（陆地） ----------
R = PAL['relief']
stops = [(-10, hexrgb(PAL['paper']['light']) * 0.5 + hexrgb(R['low']) * 0.5), (60, hexrgb(R['low'])), (180, hexrgb(R['low']) * 0.7 + hexrgb(R['mid']) * 0.3),
         (350, hexrgb(R['mid'])), (700, hexrgb(R['mid']) * 0.45 + hexrgb(R['high']) * 0.55), (1100, hexrgb(R['high'])), (1700, hexrgb(R['peak'])),
         (2600, hexrgb(R['peak']) * 0.85 + hexrgb(PAL['paper']['light']) * 0.15)]
ev = np.array([s[0] for s in stops], np.float32)
hyps = np.stack([np.interp(dsm, ev, [s[1][c] for s in stops]) for c in range(3)], -1).astype(np.float32)
log('分层设色完成')

# ---------- 晕渲 ----------
Z = 3.2  # 垂直夸张（世界 1 单位 ≈ 152 m）
cellm = F['kmPerUnit'] * 1000
gy, gx = np.gradient(dsm * Z / cellm)
slope = np.hypot(gx, gy)


def shade(az, alt):
    az, alt = math.radians(az), math.radians(alt)
    lx, ly, lz = math.sin(az) * math.cos(alt), -math.cos(az) * math.cos(alt), math.sin(alt)
    # 表面法线 (-gx, -gy, 1)（y 向下）
    return ((-gx * lx) + (-gy * ly) + lz) / np.sqrt(gx * gx + gy * gy + 1)


flat = math.sin(math.radians(45))
hs = 0.62 * shade(315, 45) + 0.20 * shade(270, 50) + 0.18 * shade(0, 55)
delta = hs - flat
# 平原不脏：小起伏压制；山区加强
relief_w = np.clip(slope / 0.08, 0, 1) ** 0.7
delta = np.sign(delta) * np.maximum(np.abs(delta) - 0.012, 0) * (0.35 + 0.65 * relief_w)
del gx, gy
log('晕渲完成')

# ---------- 水体 ----------
sea = 1 - land  # 海
wat_b = water >= 0.5
dist_sea = ndimage.distance_transform_edt(wat_b).astype(np.float32)        # 水中离岸距离
wcol_sea = hexrgb(PAL['water']['sea']); wdeep = hexrgb(PAL['water']['seaDeep']); wlake = hexrgb(PAL['water']['lake']); wline = hexrgb(PAL['water']['line'])
deep_t = np.clip(dist_sea / 900, 0, 1) ** 0.8
wcol = wcol_sea[None, None, :] * (1 - deep_t[..., None]) + wdeep[None, None, :] * deep_t[..., None]
is_lake = (lakes > 0.5) & wat_b
wcol[is_lake] = wlake
# 雕版水波纹：离岸等距细线，间距逐渐增大、向外渐淡；沿岸线方向略有断续
waves = np.zeros((H, W), np.float32)
dists = []
d = 5.0
for k in range(14):
    dists.append(d); d += 5.5 + 0.9 * k
brk = np.clip(0.75 + 0.5 * noise(24, 1.0, 11), 0, 1)
for k, dk in enumerate(dists):
    a = 0.60 * (1 - k / len(dists)) ** 1.3
    waves += a * np.exp(-((dist_sea - dk) / 0.62) ** 2)
waves *= np.where(is_lake, 0.8, 1.0) * brk
waves = np.clip(waves, 0, 0.75)
# 湖泊只画 3 条
lake_cut = is_lake & (dist_sea > dists[2] + 2)
waves[lake_cut] = 0
del brk
log('水波纹完成')

# ---------- 沼泽与森林纹样 ----------
def marsh_tex():
    t = np.zeros((H, W), np.float32)
    per_y, per_x = 9, 17
    rows = np.arange(H) % per_y
    r2 = np.random.default_rng(5)
    offs = r2.integers(0, per_x, size=H // per_y + 2)
    lens = r2.integers(5, 10, size=H // per_y + 2)
    for j in range(0, H, per_y):
        o, L = offs[j // per_y], lens[j // per_y]
        x = (np.arange(W) + o) % per_x
        t[j] = (x < L).astype(np.float32)
        t[j + 1 if j + 1 < H else j] += 0.35 * (x < L)
    # 小草丛（每隔若干条短横线上方加 2 根短竖）
    for j in range(4, H, per_y * 2):
        for i in range((j * 7) % per_x, W, per_x * 3):
            t[max(0, j - 3):j, i + 2] = 0.8; t[max(0, j - 2):j, i + 4] = 0.8
    return ndimage.gaussian_filter(t, 0.45)


def tree_tex():
    t = np.zeros((H, W), np.float32)
    sp = 11
    r2 = np.random.default_rng(7)
    ys, xs = np.mgrid[sp // 2:H:sp, sp // 2:W:sp]
    ys = (ys + r2.integers(-3, 4, ys.shape)).ravel(); xs = (xs + r2.integers(-3, 4, xs.shape)).ravel()
    ok = (ys > 2) & (ys < H - 3) & (xs > 2) & (xs < W - 3)
    ys, xs = ys[ok], xs[ok]
    t[ys, xs] = 1; t[ys - 1, xs] = 0.8; t[ys + 1, xs] = 0.6; t[ys, xs - 1] = 0.8; t[ys, xs + 1] = 0.8
    t[ys - 2, xs] = 0.5
    t[ys + 2, xs] = 0.45  # 树干
    return ndimage.gaussian_filter(t, 0.5)


mt = marsh_tex() * ndimage.gaussian_filter(marsh, 2.0) * land_m
ft = tree_tex() * np.clip(ndimage.gaussian_filter(forest, 4.0) * 1.4 - 0.2, 0, 1) * land_m
forest_tint = ndimage.gaussian_filter(forest, 7.0) * land_m
log('纹样完成')


# ---------- 合成 ----------
def compose(with_shade=True, paper_amt=1.0):
    img = np.empty((H, W, 3), np.float32)
    # 陆地：纸色与分层色混合（低地基本即纸色）
    base = paper[None, None, :] * 0.35 + hyps * 0.65
    base = base * (1 + tone[..., None] * paper_amt)
    if with_shade:
        base = base * (1 + 0.95 * delta[..., None]) + 0.10 * np.maximum(delta, 0)[..., None] * (plight - base)
    # 森林淡绿褐色调 + 小树点
    fcol = np.array([0.76, 0.78, 0.58], np.float32)
    base = base * (1 - 0.22 * forest_tint[..., None]) + fcol * 0.22 * forest_tint[..., None]
    tcol = np.array([0.42, 0.47, 0.30], np.float32)
    base = base * (1 - 0.34 * ft[..., None]) + tcol * 0.34 * ft[..., None]
    mcol = np.array([0.36, 0.47, 0.49], np.float32)
    marsh_t = ndimage.gaussian_filter(marsh, 6.0) * land_m
    base = base * (1 - 0.07 * marsh_t[..., None]) + np.array([0.62, 0.70, 0.66], np.float32) * 0.07 * marsh_t[..., None]
    base = base * (1 - 0.55 * mt[..., None]) + mcol * 0.55 * mt[..., None]
    # 水
    wc = wcol * (1 + 0.6 * tone[..., None] * paper_amt)
    wc = wc * (1 - waves[..., None]) + wline * waves[..., None]
    a = water[..., None]
    img = base * (1 - a) + wc * a
    # 海岸墨线
    coast = np.exp(-((dist_sea - 1.0) / 0.9) ** 2) * wat_b + np.clip(ndimage.gaussian_filter((~wat_b).astype(np.float32), 0.8) * wat_b * 0, 0, 1)
    ink = hexrgb('#4f6563')
    img = img * (1 - 0.55 * coast[..., None]) + ink * 0.55 * coast[..., None]
    # 纸张：污渍、霉斑、暗角、折痕（对全图）
    stc = np.array([0.80, 0.68, 0.45], np.float32)
    img = img * (1 - 0.07 * stain[..., None] * paper_amt) + stc * 0.07 * stain[..., None] * paper_amt
    img = img * (1 - 0.22 * np.clip(fox, 0, 1)[..., None] * paper_amt) + np.array([0.62, 0.47, 0.30]) * 0.22 * np.clip(fox, 0, 1)[..., None] * paper_amt
    img = img * (1 - 0.30 * vig[..., None] * paper_amt) + pdark * 0.30 * vig[..., None] * paper_amt
    fc_ = hexrgb(PAL['paper']['fold'])
    img = img * (1 - 0.28 * np.clip(fold, 0, 1)[..., None] * paper_amt) + fc_ * 0.28 * np.clip(fold, 0, 1)[..., None] * paper_amt
    img = img + 0.035 * np.clip(foldhl, 0, 1)[..., None] * paper_amt
    return np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)


full = compose(True)
log('合成完成')
Image.fromarray(full).save(os.path.join(WORK, 'base_8192.png'))

# ---------- 瓦片 ----------
TD = os.path.join(ROOT, 'public/tiles/base')
os.makedirs(TD, exist_ok=True)
T = F['tiles']['size']
meta = {'tileSize': T, 'format': 'webp', 'path': 'tiles/base/{z}/{x}_{y}.webp', 'worldWidth': W, 'worldHeight': H,
        'note': '边缘瓦片不补齐（尺寸 < 512）；每级 scale = width / worldWidth；图像像素 (px,py) ↔ 世界坐标 (px/scale, py/scale)', 'levels': []}
im_full = Image.fromarray(full)
for z, wz in enumerate(F['tiles']['levels']):
    hz = math.ceil(H * wz / W)
    im = im_full if wz == W else im_full.resize((wz, hz), Image.LANCZOS)
    cols, rows = math.ceil(wz / T), math.ceil(hz / T)
    shutil.rmtree(os.path.join(TD, str(z)), ignore_errors=True)
    os.makedirs(os.path.join(TD, str(z)), exist_ok=True)
    for x in range(cols):
        for y in range(rows):
            im.crop((x * T, y * T, min(wz, (x + 1) * T), min(hz, (y + 1) * T))).save(os.path.join(TD, str(z), f'{x}_{y}.webp'), 'WEBP', quality=82, method=6)
    meta['levels'].append({'z': z, 'width': wz, 'height': hz, 'cols': cols, 'rows': rows, 'scale': wz / W})
    log(f'z{z} {wz}×{hz} {cols}×{rows} 瓦片')
json.dump(meta, open(os.path.join(TD, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
im_full.resize((2048, math.ceil(H * 2048 / W)), Image.LANCZOS).save(os.path.join(ROOT, 'public/tiles/overview.webp'), 'WEBP', quality=82, method=6)
del im_full

# ---------- 3D 地形：albedo（无晕渲）/ height ----------
TR = os.path.join(ROOT, 'public/terrain')
os.makedirs(TR, exist_ok=True)
alb = compose(False, paper_amt=0.45)
Image.fromarray(alb).resize((4096, math.ceil(H * 4096 / W)), Image.LANCZOS).save(os.path.join(TR, 'albedo.webp'), 'WEBP', quality=82, method=6)
del alb
hw = 1024; hh = math.ceil(H * hw / W); f = W // hw
e = np.where(land_m, dem, np.minimum(dem, -1.0))
e = np.clip(e, -60, None)
pad = np.pad(e, ((0, hh * f - H), (0, 0)), mode='edge')
eh = pad.reshape(hh, f, hw, f).mean((1, 3))
v = np.clip(np.round((eh + 100) * 4), 0, 65535).astype(np.uint16)
rgb = np.zeros((hh, hw, 3), np.uint8); rgb[..., 0] = v >> 8; rgb[..., 1] = v & 255
Image.fromarray(rgb, 'RGB').save(os.path.join(TR, 'height.png'), optimize=True)
json.dump({'width': hw, 'height': hh, 'worldWidth': W, 'worldHeight': H, 'encoding': 'rg16', 'scale': 0.25, 'offset': -100,
           'minElev': float(np.round(eh.min(), 1)), 'maxElev': float(np.round(eh.max(), 1)),
           'formula': 'elev_m = (R*256+G)*scale + offset；海面以下截断到 -60 m；像素 (i,j) 覆盖世界坐标 [i*8,(i+1)*8)×[j*8,(j+1)*8)',
           'albedo': {'src': 'terrain/albedo.webp', 'width': 4096, 'height': math.ceil(H * 4096 / W)}},
          open(os.path.join(TR, 'terrain.json'), 'w'), ensure_ascii=False, indent=1)
log('地形输出完成', hw, hh, float(eh.min()), float(eh.max()))
