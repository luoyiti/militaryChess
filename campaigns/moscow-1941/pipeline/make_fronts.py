#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""莫斯科保卫战：控制区关键帧生成器（data/fronts/*.json）。

    python3 campaigns/moscow-1941/pipeline/make_fronts.py            # 生成帧 + 自检 + 刷新 docs/GEOGRAPHY.md
    python3 campaigns/moscow-1941/pipeline/make_fronts.py --check    # 只自检，不写盘
    python3 campaigns/moscow-1941/pipeline/make_fronts.py --quiet    # 只报错

数据来源
========
- **战线**：`pipeline/front-lines.json`（研究-战线进程交付，38 帧，每帧 25 点自北向南的接触线）。
  本脚本把它重采样到固定纬度梯子 `LATS`，按 `GUARDS` 做有记录的修正，然后闭合为多边形。
- **合围圈**：`pipeline/front-lines.json` 的 `pockets`（维亚济马、布良斯克）+ 本脚本的 `CORRIDORS`（托罗佩茨走廊）。
- **投影**：`config/frame.json`（由 `tools/geo/emit_frame.mjs` 生成）。

几何约定
========
每帧的 `control.DE` 是「截至该时刻德军控制的全部苏联领土」的快照（不是增量）。
外环 = 战线以西的闭区域：

    战线（自 NORTH 到 SOUTH）→ (WEST, SOUTH) → (WEST, NORTH) → 回到战线北端

WEST=27°E 与 59°N / 50°N 都落在画布反算范围（约 29.76—41.24°E / 51.49—58.09°N）之外，
所以闭合边全部在画布外，栅格化时被画布自然裁切，不会留下未着色的楔形或斜边。
因为掩膜 bit0（苏联）铺满全画布，「多边形 ∩ 战区」就是完整占领区。

洞（`[外环, 洞…]`）= 德军控制区里的**非德军**飞地：
- 苏军被围的合围圈（维亚济马、布良斯克）；
- 苏军突入德军后方的**走廊**（1942 年 1 月的托罗佩茨走廊）。
德军的霍尔姆守备队（1942-01-22 起被围）仍属德军控制区，由战线本身表达，**不是洞** ——
本引擎里洞恒表示「非德军控制」。

自检
====
把每帧栅格化到 683×728 的场网格（格距 0.992 km），按 `engine/geo/field/field.ts` 的规则
（有符号距离 → 关键帧插值 → 双线性采样）判定「给定时刻某地归谁」，逐条与城市易手断言比对，
结果写进 `docs/GEOGRAPHY.md`。
"""
import json
import math
import os
import sys

# 不要在 pipeline/ 里留 __pycache__：验证与审查任务会扫目录。
# 本模块被 import 时（自检、审计、测试都会 import 它）默认会写出 .pyc，这里关掉。
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
CAMP = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(CAMP, 'data', 'fronts')
DOC = os.path.join(CAMP, 'docs', 'GEOGRAPHY.md')
FRONT_LINES = os.path.join(HERE, 'front-lines.json')
FRAME = json.load(open(os.path.join(CAMP, 'config', 'frame.json')))

GAZ = {}
for _f in ('core', 'north', 'south'):
    for _p in json.load(open(os.path.join(CAMP, 'data', 'gazetteer', _f + '.json'))):
        GAZ[_p['id']] = _p

W, H = FRAME['width'], FRAME['height']
CELL = FRAME['field']['cell']
GW, GH = FRAME['field']['w'], FRAME['field']['h']
KM_PER_UNIT = FRAME['kmPerUnit']
CELL_KM = KM_PER_UNIT * CELL                             # 0.9921 km
CLAMP = math.ceil(FRAME['field']['clampKm'] / CELL_KM)   # 61 格

# ---------- 投影：d3.geoConicConformal 的纯 Python 复刻（与 tools/geo/proj.py 同源） ----------
_R = math.pi / 180
_P = FRAME['projection']
_PHI0, _PHI1 = _P['parallels'][0] * _R, _P['parallels'][1] * _R
_DLAM = _P['rotate'][0] * _R
_K = FRAME['scale']
_TX, _TY = FRAME['translate']


def _tany(y):
    return math.tan((math.pi / 2 + y) / 2)


_CY0 = math.cos(_PHI0)
_N = math.log(_CY0 / math.cos(_PHI1)) / math.log(_tany(_PHI1) / _tany(_PHI0))
_F = _CY0 * _tany(_PHI0) ** _N / _N


def _raw(lam, phi):
    r = _F / _tany(phi) ** _N
    return r * math.sin(_N * lam), _F - r * math.cos(_N * lam)


def _raw_inv(x, y):
    fy = _F - y
    r = math.copysign(math.sqrt(x * x + fy * fy), _N)
    lam = math.atan2(x, abs(fy)) * (1 if fy >= 0 else -1)
    return lam / _N, 2 * math.atan((_F / r) ** (1 / _N)) - math.pi / 2


_CX, _CY = _raw(_P['center'][0] * _R, _P['center'][1] * _R)


def _wrap(l):
    while l > math.pi:
        l -= 2 * math.pi
    while l < -math.pi:
        l += 2 * math.pi
    return l


def project(ll):
    """经纬度 → 世界坐标（px @ width 8192，y 向下）"""
    x, y = _raw(_wrap(ll[0] * _R + _DLAM), ll[1] * _R)
    return _TX + _K * (x - _CX), _TY - _K * (y - _CY)


def unproject(xy):
    x = (xy[0] - _TX) / _K + _CX
    y = -(xy[1] - _TY) / _K + _CY
    lam, phi = _raw_inv(x, y)
    return _wrap(lam - _DLAM) / _R, phi / _R


def to_grid(ll):
    x, y = project(ll)
    return x / CELL, y / CELL


def canvas_bounds():
    """画布四边的反算经纬度范围"""
    lons, lats = [], []
    for i in range(0, int(W) + 1, 64):
        for p in ((i, 0), (i, H)):
            lon, lat = unproject(p)
            lons.append(lon)
            lats.append(lat)
    for j in range(0, int(H) + 1, 64):
        for p in ((0, j), (W, j)):
            lon, lat = unproject(p)
            lons.append(lon)
            lats.append(lat)
    return min(lons), min(lats), max(lons), max(lats)


def inside_canvas(ll, pad=0.0):
    """经纬度是否落在画布内（pad 为世界坐标余量，负数=内缩）"""
    x, y = project(ll)
    return -pad <= x <= W + pad and -pad <= y <= H + pad


CANVAS = canvas_bounds()
WEST = 27.0            # 西侧闭合经线（< 画布西界）
SOUTH = 50.0           # 南侧闭合纬线（< 画布南界）
NORTH = 59.0           # 北侧闭合纬线（> 画布北界）


# ---------- 时间 ----------
def _days_from_civil(y, m, d):
    y -= m <= 2
    era = (y if y >= 0 else y - 399) // 400
    yoe = y - era * 400
    doy = (153 * (m + (-3 if m > 2 else 9)) + 2) // 5 + d - 1
    doe = yoe * 365 + yoe // 4 - yoe // 100 + doy
    return era * 146097 + doe - 719468


def hours(iso):
    """与 engine/core/time.ts 的 isoToHours 一致（UTC 绝对小时）"""
    d, t = iso.split('T')
    y, mo, da = (int(v) for v in d.split('-'))
    hh, mi = (int(v) for v in t.split(':'))
    return _days_from_civil(y, mo, da) * 24 + hh + mi / 60.0


# ---------- 战线：front-lines.json → 纬度梯子 ----------
# 采样行为固定纬度；每行注释给出该纬度附近的关键地物。行距与研究折线的 25 个顶点对应，
# 另在画布外补 59.0 / 58.3 / 50.5 / 50.0 四行用于闭合。
# 采样行 = 基础行 + 所有被断言城市的纬度 + 所有洞的锚点纬度。
# 城市必须有自己的一行，这样「该多少度、战线就落在多少度」是精确的，不依赖相邻行插值。
LATS_BASE = [
    59.00,      # 画布北缘之外（闭合边）
    58.30,      # 画布北缘外推
    57.80,      # 画布北界附近
    57.55,      # 博洛戈耶 57.87 / 维什尼沃洛乔克 57.58
    57.15,      # 霍尔姆 57.15
    56.86,      # 加里宁 56.86
    56.50,      # 托罗佩茨 56.50 / 斯塔里察 56.51
    56.33,      # 克林 56.33 / 德米特罗夫 56.35
    56.18,      # 索尔涅奇诺戈尔斯克 56.18
    56.03,      # 沃洛科拉姆斯克 56.03
    55.90,      # 霍尔姆-日尔科夫斯基 55.90 / 希姆基 55.89
    55.833,     # 克拉斯纳亚波利亚纳 55.833（城郊最前哨）
    55.82,      # 克拉斯纳亚波利亚纳平台的收拢行
    55.80,      # 城郊过渡行（莫斯科防御圈北缘）
    55.78,      # 城郊过渡行
    55.755,     # 莫斯科 55.755
    55.514,     # 莫扎伊斯克凹口过渡行（把 55.517→55.510 的落差摊开）
    55.512,     # 同上
    55.51,      # 莫扎伊斯克 55.51
    55.39,      # 纳罗福明斯克 55.39
    55.21,      # 维亚济马 55.21
    55.01,      # 小雅罗斯拉韦茨 55.01 / 梅登 54.97
    54.75,      # 尤赫诺夫 54.75 / 塔鲁萨 54.72
    54.52,      # 卡卢加 54.52
    54.20,      # 图拉 54.20
    53.80,      # 别廖夫 53.81
    53.50,      # 佳季科沃 53.59 / 博尔霍夫 53.44
    53.24,      # 布良斯克 53.24
    52.97,      # 奥廖尔 52.97
    52.58,      # 特鲁布切夫斯克 52.58
    52.15,      # 谢夫斯克 52.15
    51.74,      # 库尔斯克 51.74
    51.60,      # front-lines 南端
    51.00,
    50.50,
    50.00,      # 画布南缘之外（闭合边）
]

# ---------- 飞地：单值南北战线表达不了的区域 ----------
# 本战役的战线是「经度随纬度单值变化」的折线（研究交付的 25 点接触线），只能表达
# 「德西苏东」这一种拓扑。被德军团团围住的苏方区域它表达不了，生成器用「飞地」补上，
# 一律写成同一多边形的**洞**（`[外环, 洞…]`）—— 本引擎里洞恒表示「非德军控制」。
#
#   · 苏军被围的**合围圈**：直接取自 `front-lines.json` 的 `pockets`（维亚济马、布良斯克）。
#   · 苏军突入德军后方的**走廊/突出部**：本文件的 `WEDGES`（1942 年 1 月托罗佩茨走廊）。
#
# 洞只在存续期的帧上出现，且必须完全落在该帧外环内（几何自检逐顶点断言）。
# 洞的环。`anchor` 是自检锚点，必须在**洞内**（= 苏方）；若锚点城市本身在德军手里，
# 环就不能包住它 —— 那属于「合围圈闭合点」的语义，围的是圈内的苏军集团，不是城市。
POCKETS = [
    # 维亚济马合围圈（10-07 10:30 闭合 — 10-13 投降）：圈在维亚济马城以南、瑟乔夫卡以西，
    # 围住的是西方方面军第 19、20、24、32 集团军主力；维亚济马城本身是闭合点（德军占领）。
    # 锚点用 `sychevka`（瑟乔夫卡）而不是 `kholm_zhirkovsky`：
    # 霍尔姆-日尔科夫斯基的真实坐标是 55.517°N / 33.467°E（审查 F5 核实，俄文维基一致），
    # 落在本圈外环以西约 1 km 之外；此前用的是错误坐标（偏东偏北 66 km）才「恰好」落在圈内，
    # 也就是说洞的锚点校验一直被坐标错误掩盖着。瑟乔夫卡在圈内，且是合围圈东缘的要点。
    dict(id='p.vyazma', anchor='sychevka', name='维亚济马合围圈',
         start='1941-10-07T12:00', end='1941-10-13T12:00',
         ring=[[33.62, 54.60], [34.30, 54.58], [34.55, 54.80], [34.52, 55.20],
               [34.90, 55.86], [34.52, 56.14], [33.86, 56.10], [33.60, 55.60],
               [33.54, 55.10], [33.50, 54.86]],
         note='第 7 装甲师（第 3 装甲集群）与第 10 装甲师（第 4 装甲集群）10 月 7 日 10 时 30 分'
              '在维亚济马会师，西方方面军第 19、20、24、32 集团军与博尔金集群被围于维亚济马以南、'
              '瑟乔夫卡以西；被围部队 10 月 13 日起大规模投降。'),
    # 布良斯克合围圈（10-06 — 10-17）：圈在布良斯克城以南、特鲁布切夫斯克周边，
    # 围住布良斯克方面军第 3、13 集团军；布良斯克城本身 10-06 即被第 17 装甲师攻占（德军控制）。
    dict(id='p.bryansk', anchor='trubchevsk', name='布良斯克合围圈',
         start='1941-10-06T12:00', end='1941-10-17T12:00',
         ring=[[33.42, 52.68], [34.10, 52.44], [34.78, 52.58], [34.90, 52.92],
               [34.35, 53.06], [33.62, 52.94], [33.32, 52.82]],
         note='第 17 装甲师 10 月 6 日攻占布良斯克，10 月 9 日第 167 步兵师与其会合，'
              '布良斯克方面军第 3、13 集团军被围于布良斯克以南、特鲁布切夫斯克周边；'
              '被围部队 10 月中下旬成批向东突围。'),
    # 托罗佩茨走廊：苏军 1942 年 1 月突破后**收复**的区域，属「德军控制区里的苏方飞地」，
    # 因此是洞（POCKETS），不是德控突出部（WEDGES）。这一点很容易搞反：
    # 走廊是苏方深入德军后方，不是德军深入苏方。
    dict(id='p.toropets_corridor', anchor='toropets', name='托罗佩茨走廊',
         start='1942-01-21T12:00', end='1942-01-31T23:59',
         ring=[[30.60, 55.92], [32.50, 55.92], [32.72, 56.30], [32.40, 56.66],
               [31.92, 56.80], [31.22, 56.82], [30.66, 56.58], [30.48, 56.20]],
         note='西北方面军第 3、4 突击军 1 月 9 日起自奥斯塔什科夫以西突破，16 日占安德烈亚波尔，'
              '21 日收复托罗佩茨，随后前出至大卢基—勒热夫铁路；走廊把德军第 16 集团军与'
              '中央集团军群的接合部割裂，是 1942 年 1 月战线最显著的苏方突出部。'),
]

WEDGES = [
    # 克拉斯纳亚波利亚纳前哨（1941-11-29 — 12-06）。
    # 这是德军沿公路伸向莫斯科的**窄楔**，史实前锋抵「距克里姆林宫约 29 km」处。
    # 若用「把整条纬线推东」来表达，控制区边界就会在城郊段逼近克里姆林宫
    # （实测会算成 5.7—7.4 km），与史实矛盾。正确表达是主线保持在城以西约 30 km，
    # 另用一个小多边形表示这条东伸的楔子——楔尖距城约 28—30 km。
    dict(id='w.krasnaya_polyana', anchor='krasnaya_polyana', name='克拉斯纳亚波利亚纳前哨',
         start='1941-11-29T00:00', end='1941-12-11T00:00',
         ring=[[36.86, 56.10], [37.30, 56.09], [37.52, 56.02], [37.47, 55.92],
               [37.24, 55.90], [36.90, 55.98]],
         note='11 月末德军第 4 装甲集群沿沃洛科拉姆斯克公路东伸，占领克拉斯纳亚波利亚纳'
              '（今洛布尼亚一部），前锋抵距克里姆林宫约 29 km 处；12 月 3—5 日苏军反击后逐退。'),

]



# ---------- 修正层：按史实占领窗口校正城市归属 ----------
# 研究交付的单值战线是「概略接触线」，在若干经纬度上与城市的真实易手日期差几天到几周，
# 个别城市（库尔斯克）还会在 1942 年 1 月被错误地划回苏方。生成器按史实占领窗口
# （`CITY_WINDOWS`）逐帧校正：若城市落在错误的一侧，就在它的纬度带把战线局部推移，
# 使城市落到正确的一侧。推移只影响锚点附近 NOTCH_HALF_DEG 内的少数采样行，权重线性衰减，
# 因此外环仍是纬度的单值函数，不会自相交。
#
# 每条窗口：(地名 id, 德军占领开始, 德军占领结束; None = 到战役结束一直是德军)
# 窗口之外一律判为苏方。`note` 写史实依据。
CITY_WINDOWS = [
    ('kaluga', '1941-10-13T00:00', '1941-12-30T00:00', '10 月 13 日失守，12 月 30 日收复'),
    ('klin', '1941-11-23T00:00', '1941-12-15T00:00', '11 月 23 日失守，12 月 15 日收复'),
    ('kalinin', '1941-10-14T00:00', '1941-12-16T00:00', '10 月 14 日失守，12 月 16 日收复'),
    ('vyazma', '1941-10-13T00:00', None, '10 月 7 日合围圈闭合，13 日后全城沦陷，1943 年 3 月才收复'),
    ('bryansk', '1941-10-06T12:00', None, '10 月 6 日失守，1943 年 9 月才收复'),
    ('orel', '1941-10-03T00:00', None, '10 月 3 日失守，1943 年 8 月才收复'),
    ('kursk', '1941-11-03T00:00', None, '11 月 3 日失守，1943 年 2 月才收复'),
    ('mozhaisk', '1941-10-18T00:00', '1942-01-20T00:00', '10 月 18 日失守，1942 年 1 月 20 日收复'),
    ('volokolamsk', '1941-10-27T00:00', '1941-12-20T00:00', '10 月 27 日失守，12 月 20 日收复'),
    ('maloyaroslavets', '1941-10-18T00:00', '1942-01-02T00:00', '10 月 18 日失守，1942 年 1 月 2 日收复'),
    # —— 审查前审计（audit-control.ts）补充的 8 城 ——
    ('istra', '1941-11-26T00:00', '1941-12-10T00:00', '11 月 26 日被第 4 装甲集群攻占，12 月 10 日收复'),
    # 史实（俄文维基「莫斯科战役」）：德军占领克拉斯纳亚波利亚纳后「вышли на расстояние чуть более
    # 29 км от Кремля」，是本战役德军最接近莫斯科处。该村站点坐标距克里姆林宫约 19.9 km，
    # 29 km 指的是德军**前锋线**（在村以西），不是村中心——两者口径不同，不要混用。

    ('aleksin', '1941-11-15T00:00', '1941-12-17T00:00', '11 月被占，12 月 17 日收复'),
    ('yefremov', '1941-11-20T00:00', '1941-12-13T00:00', '11 月 20 日德军第 18 装甲师占领，12 月 13 日收复'),
    ('mtsensk', '1941-10-11T00:00', None, '10 月 11 日失守，直至 1943 年 7 月 20 日才收复'),
    ('kozelsk', '1941-10-08T00:00', '1941-12-28T00:00', '10 月 8 日失守，12 月 28 日由别洛夫集群收复'),
    ('belyov', '1941-10-24T00:00', '1941-12-31T00:00', '10 月 24 日失守，12 月 31 日收复'),
    ('solnechnogorsk', '1941-11-22T00:00', '1941-12-12T00:00', '11 月 22 日失守，12 月 12 日收复'),
    ('dmitrov', None, None, '全程未被攻占（德军只到运河东岸的亚赫罗马桥头）'),
    # 利夫内：俄文维基「莫斯科战役」——「26 ноября немцы захватили Ливны」；
    # 叶列茨—利夫内反攻（12-06 起）中第 34 摩托步兵旅 12-07 被派往利夫内纵深迂回，
    # 12 月中旬该方向德军被逐退（布良斯克方面军 1 月初推进至利夫内西北）。
    ('livny', '1941-11-26T00:00', '1941-12-15T00:00', '11 月 26 日被德军第 2 集团军占领，12 月中旬由叶列茨—利夫内反攻收复'),
    # 韦尼奥夫：俄文维基「Венёв」——「Две недели город находился в оккупации」，
    # 别洛夫第 1 近卫骑兵军 12 月 9 日收复（战役总条目亦载「9 декабря завладели городом Венёв」）。
    ('venyov', '1941-11-25T00:00', '1941-12-09T00:00', '11 月 25 日左右被占（被占两周），12 月 9 日由别洛夫第 1 近卫骑兵军收复'),
    ('sukhinichi', '1941-10-08T00:00', '1942-01-29T00:00', '10 月上旬失守，1942 年 1 月 29 日收复'),
    ('naro_fominsk', '1941-12-01T00:00', '1941-12-26T00:00', '12 月 1 日失守，12 月 26 日收复'),
    ('yakhroma', '1941-11-27T00:00', '1941-12-07T00:00',
     '11 月 27—28 日夜德军渡莫斯科运河占领亚赫罗马，12 月 7 日由第 1 突击集团军收复'),
    ('rzhev', '1941-10-14T00:00', None, '10 月 14 日失守，1943 年 3 月才收复'),
    ('gzhatsk', '1941-10-09T00:00', None, '10 月上旬失守，1943 年 3 月才收复'),
    ('yukhnov', '1941-10-05T00:00', '1942-03-05T00:00', '10 月上旬失守，1942 年 3 月才收复'),
    ('kholm_zhirkovsky', '1941-10-06T00:00', None, '第 7 装甲师 10 月 6—7 日经此南下，此后为德军后方'),
    ('toropets', '1941-09-30T00:00', '1942-01-21T00:00', '1942 年 1 月 21 日由第 4 突击军收复'),
    ('kholm', '1941-09-30T00:00', None, '守备队 1942 年 1 月 22 日起被围，坚守至 5 月 5 日'),
    ('smolensk', '1941-09-30T00:00', None, '7 月中旬即被德军占领'),
    ('moscow', None, None, '全程苏方'),
    ('tula', None, None, '全程苏方（11 月三面包围但未被攻下）'),
    ('serpukhov', None, None, '全程苏方'),
    ('kashira', None, None, '全程苏方'),
    ('kolomna', None, None, '全程苏方'),
    ('ryazan', None, None, '全程苏方'),
    ('ostashkov', None, None, '全程苏方'),
]
WINDOW = {w[0]: w for w in CITY_WINDOWS}
# 字典推导会静默覆盖重复项 —— 让重复定义在生成阶段就报错，而不是悄悄丢掉一条窗口。
_dup = [k for k, n in __import__('collections').Counter(w[0] for w in CITY_WINDOWS).items() if n > 1]
assert not _dup, f'CITY_WINDOWS 有重复定义（后一条会覆盖前一条）：{_dup}'
assert len(WINDOW) == len(CITY_WINDOWS), 'CITY_WINDOWS 有重复的城市 id'

# 突变时刻：控制场的状态在这些帧上发生不连续变化（合围圈闭合/消除、攻势起点、反攻起点），
# 标成 step 以免引擎在两帧之间把「洞缓慢生长」或「战线平滑滑动」画出来。
STEP_FRAMES = {
    '1941-10-02T00:00',   # 台风主攻开始
    '1941-10-07T00:00',   # 维亚济马合围圈闭合
    '1941-10-14T00:00',   # 维亚济马被围部队投降、合围圈消除
    '1941-11-15T00:00',   # 十一月攻势开始
    '1941-12-05T00:00',   # 十二月反攻开始
    '1942-01-08T00:00',   # 勒热夫—维亚济马总攻开始
}

# 余量（clearance）的取法 —— 这是本生成器最关键的一条设计。
#
# 引擎在关键帧之间对**有符号距离场**做线性插值，所以城市「翻面」的时刻落在
#      f = c_A / (c_A + c_B)
# （c_A、c_B 是前后两个关键帧上城市到战线的净空量），而不是真实日期。要让它落在真实日期
# T_flip 上，就必须满足 c_A : c_B = (T_flip - K1) : (K2 - T_flip)。
#
# 因此生成器对每个城市的每个关键帧，把净空量取为
#      c = CLEAR_DAYS_PER_KM_UNIT × |t - T_flip|   （夹在 [CLEAR_MIN_KM, CLEAR_MAX_KM]）
# 即「离翻转时刻越远，城市离战线越深」。这样任一城市在任一时刻的归属都与
# `CITY_WINDOWS` 的史实日期一致，而不仅仅是关键帧上一致。
CLEAR_SCALE_KM_PER_DAY = 11.0  # 每天时间距离对应的净空量（km）
                               # 取值要与 clear_km 的下限配合：翻转通常发生在「离它最近的那个关键帧」
                               # 之后约 1/3 区间处，净空比约 1:2。11 km/天 让 2 天的间隔产生约 22 km
                               # 净空，足以让插值出的翻转点落在史实日期一侧。
CLEAR_MIN_KM = 8.0             # 最小净空（km）：≈8 个场格。
                               # 曾是 2.0：城市会正好骑在战线边缘（mozhaisk 在 10-16 帧净空仅 3.0 km），
                               # 双线性采样把 SDF≈0 的点抹到错误一侧，翻面时刻被提前 22 小时。
CLEAR_MAX_KM = 55.0            # 最大净空（km）：离翻转时刻很远时，城市最多离战线这么深。
                               # 注意上限不能压得太小：插值出来的翻转时刻依赖两侧净空之比，
                               # 净空不足会让翻转点漂回错误一侧（审计会抓到）。
                               # 「相邻且期望相反、相距很近」的两城所导致的**长弦**，
                               # 由下面的 `_subdivide_long_edges()` 在闭合阶段解决，而不是靠压低净空。


def clear_km(pid, h):
    """该城市在时刻 h 应离开战线多远（km）：离最近的翻转时刻越远越深。

    **单位**：`hours()` 与 `WINDOW` 边界都以**小时**计，而 `CLEAR_SCALE_KM_PER_DAY`
    是 km/**天**，所以必须先除以 24 换成天再乘。

    这里曾经漏了 /24：`d * 11` 在 5 小时后就超过 `CLEAR_MAX_KM`，于是**任何**有翻转边界的
    城市都恒取 55 km，整条「净空量正比于到翻转时刻的时间距离」的机制实际从未生效。
    后果是克拉斯纳亚波利亚纳那一行被恒定推东 0.88°（37.333+55/62.5=38.213），
    在 55.833°N 凸出一个越过莫斯科经度的尖角，使「德军前锋距克里姆林宫」算成 5.7 km
    （史实约 20—30 km）。城市归属断言全绿却抓不到，因为那 69 条只问「城市归谁」。
    """
    _pid, a, b, _why = WINDOW[pid]
    bounds = [hours(x) for x in (a, b) if x]
    if not bounds:
        return CLEAR_MAX_KM
    d_hours = min(abs(h - x) for x in bounds)
    days = d_hours / 24.0                 # 小时 → 天（单位换算必须显式）
    # 在**翻转时刻本身**净空必须为 0（城市正好落在线上），否则关键帧之间插值出的
    # 过零点会整体偏移。CLEAR_MIN 只用于「非翻转帧」防止退化，因此这里区分：
    if d_hours < 0.5:
        return 0.0
    km = max(CLEAR_MIN_KM, min(CLEAR_MAX_KM, days * CLEAR_SCALE_KM_PER_DAY))
    return max(km, MIN_CLEAR_KM.get(pid, 0.0))


# 凹口半宽与余量的逐城覆盖。默认值适用于「邻城期望相同」的城市；
# 下面这些城市与期望相反的邻城贴得极近，必须用更窄的凹口，且让战线在凹口边缘
# **渐变**（而不是在相邻两行之间垂直跳变），否则城市会正好骑在“墙”上，场采样会判错。
NOTCH_HALF_DEG = 0.07   # 凹口半宽（纬度，≈8 km）：必须小于「相距最近且期望相反」的两城纬度差
NOTCH_SLOPE = 1.60      # 收拢斜率（度/度）

NOTCH_TUNE = {
    # 布良斯克（53.24，10-06 前属苏）紧邻姆岑斯克（53.265，10-11 后属德）：
    # 两城纬度只差 0.025°，必须用单行窄口 + 收窄余量，避免在城所在纬度形成垂直墙。
    # 克拉斯纳亚波利亚纳（55.833）紧贴莫斯科（55.755）——纬度只差 0.078°（≈8.7 km）。
    # 若用默认 ±0.07° 凹口，它的推移会盖住 55.80/55.78 两行，把战线在 0.03° 内拉低 1.2°，
    # 斜边切过城郊（12-02 那帧最近距离塌到 5.3 km）。
    # 用 3 行窄平台，只作用在 55.83 一行附近，莫斯科那两行不受影响。

    # 布良斯克（53.24）紧邻姆岑斯克（53.265，期望相反的邻城）。若只在它自己那一行推移，
    # 会形成一条**比一格还窄的尖钉**（0.025°≈2.8 km ≈ 3 格），场采样在尖顶附近
    # 会被双线性插值抹平，城市正好骑在尖顶上就判不准。所以用一组 4 行、带权重的平台，
    # 让城市落在平台中部而不是顶点：权重 0.25 / 1.0 / 1.0 / 0.25。
    'bryansk': dict(margin_km=9.0, row_weights={53.265: 0.05, 53.252: 0.35, 53.240: 1.0,
                                                53.228: 1.0, 53.215: 0.75, 53.202: 0.35,
                                                53.190: 0.10}),
}
HOLE_PAD_KM = 3.0       # 洞与外环之间至少留的余量
HOLE_PAD_MAX_DEG = 0.45 # 洞向外影响的纬度范围


def _km_per_deg_lon(lat):
    return 111.32 * math.cos(math.radians(lat))


def city_side(pid, h):
    """该时刻这座城市在史实上属谁：'DE' | 'SU'"""
    _, a, b, _ = WINDOW[pid]
    if a is None:
        return 'SU'
    if h < hours(a):
        return 'SU'
    if b is not None and h >= hours(b):
        return 'SU'
    return 'DE'


# 推东硬上限（经度）：`want='DE'` 的城市，其凹口推送后的战线不得超过这个经度。
#
# 为什么需要它：`yakhroma`(37.483, 56.283) 在 11-27—12-07 判德控，净空可达 55 km，
# 会把 56.283 行推到 38.37°E —— 那里是**谢尔吉耶夫镇（38.13, 56.30）**，距莫斯科约 70 km，
# 1941 年从未被德军占领。而这条刺与基准折线同向，`REVERSAL_MAX_DEG` 的反向削平管不到它。
# 硬上限把推送钳在运河东岸（约 37.70），既保留亚赫罗马桥头，又不波及任何未被占城镇。
MAX_EAST_DEG = {'yakhroma': 37.70}

# 逐城最小净空（km）：用于「离边界恰好一个采样格、网格双线性会判反」的城市。
# `mozhaisk` 在 10-16 帧的净空正好 22 km，而该处战线是斜边，1 km 格距下
# 四个采样顶点跨越边界（-0.38/+0.61 格），插值结果落在 ±0.1 km 的临界带。
# 抬到 30 km 后城市稳落在苏方。
MIN_CLEAR_KM = {'mozhaisk': 30.0}

# 逐城凹口「行权重」：限定推移只作用在指定纬度行上，避免把相邻行一起拉低形成刀锋。
# `mozhaisk`(55.506) 与 55.510 两行只差 0.004°，若两行都推 30 km，
# 会在 0.011° 内形成 0.73° 的经度落差，城市正好坐在那条刀刃上，
# 1 km 网格的双线性采样跨越刀刃 -> 判定不稳（实测 10-16 12:00 判反）。
# 只推城市自己那一行，并让北侧邻行保持原值，落差被摊到 0.004°→不成立；
# 因此改为**逐行权重**，在城市行给 1.0、邻行给 0.5/0.2 平滑过渡。
# 权重沿纬度**向北平滑扩展**：最近的边界不是城市自己那一行，而是北侧行斜下来的那条边。
# 只推 55.506 行时，55.517(36.282)→55.510 的斜边仍从城市旁 0.8 km 处穿过，
# 引擎的 SDF（到最近边界）只有 0.7 km，双线性采样必判反。
# 因此把 55.517 及以上几行一起西推，让整条斜边西移，城市才真正离开边界。
# 凹口优先权：数值越大越优先（按 `dist - pri*half` 比较，等效于扩大其势力半径）。
NOTCH_PRIORITY = {}

NOTCH_ROW_WEIGHTS = {
    # mozhaisk(55.506) 需要 55.510/55.506 两行同权（相差仅 0.004°=440m），
    # 且北侧 55.512/55.514/55.517 也要带动 —— 那几行本归 kholm_zhirkovsky(DE)，
    # 若不带动，会从 36.29 斜插到 35.55，形成贴住城市的墙。
    'mozhaisk': {55.517: 0.85, 55.514: 0.9, 55.512: 0.95,
                 55.510: 1.0, 55.506: 1.0},
}


def apply_city_windows(tab, h):
    """按 CITY_WINDOWS 在城市的纬度带局部推移战线。

    对每一行，找纬度上最近的窗口，然后把该行的经度调整到满足该城市在时刻 h 的
    **净空量**（`clear_km()`，离翻转时刻越远越深）。净空量是**无条件施加**的：
    即使城市本来就在正确的一侧，也要保证它有足够的深度，否则引擎在关键帧之间
    做场插值时，翻面时刻会漂到中点而不是史实日期。

    凹口半宽 `NOTCH_HALF_DEG` 内线性收拢到 0，边缘处战线回到原值，不会形成垂直墙。
    """
    base = list(tab)
    out = []
    for i, lat in enumerate(LATS):
        pick = None
        for pid, _a, _b, _why in CITY_WINDOWS:
            p = GAZ[pid]['pos']
            dist = abs(lat - p[1])
            half = NOTCH_TUNE.get(pid, {}).get('half', NOTCH_HALF_DEG)
            if dist > half:
                continue
            # 凹口优先权：部分城市必须「压过」纬度更近的邻居才能维持判定。
            # `mozhaisk`(55.506) 的北邻行 55.517 与 `kholm_zhirkovsky`(55.517) 同纬度，
            # 按「最近者胜」会被后者抢走，导致 mozhaisk 的斜边上移、城市贴边被判反。
            pri = NOTCH_PRIORITY.get(pid, 0)
            if pick is None or (dist - pri * NOTCH_HALF_DEG) < pick[0]:
                pick = (dist - pri * NOTCH_HALF_DEG, pid)
        v = base[i]
        if pick is not None:
            pid = pick[1]
            p = GAZ[pid]['pos']
            want = city_side(pid, h)
            dlon = _km_per_deg_lon(p[1])
            tune = NOTCH_TUNE.get(pid, {})
            km = tune.get('margin_km', clear_km(pid, h))
            rw = tune.get('row_weights') or NOTCH_ROW_WEIGHTS.get(pid)
            if rw:
                # 显式给定每行的权重（布良斯克）：形成一个 4 行宽的平台，
                # 城市落在平台中部，避免「单行尖钉」被网格采样抹平。
                w = rw.get(round(lat, 3), 0.0)
            else:
                half = tune.get('half', NOTCH_HALF_DEG)
                w = 1.0 if half <= 0 else max(0.0, 1.0 - pick[0] / half)
            reach = (km / dlon) * w
            target = p[0] + reach if want == 'DE' else p[0] - reach
            v = max(v, target) if want == 'DE' else min(v, target)
            # 推东硬上限：不允许把战线推到「从未被占领的城镇」以东
            if want == 'DE' and pid in MAX_EAST_DEG:
                v = min(v, MAX_EAST_DEG[pid])
        out.append(v)
    out = _apply_row_weight_pushes(out, h)
    return _keep_base_monotone(base, out)


def _apply_row_weight_pushes(tab, h):
    """显式 `NOTCH_ROW_WEIGHTS` 的第二遍：城市可以整形自己纬度带内的行，
    不受「最近者胜」的行归属限制。

    为什么需要第二遍：`mozhaisk`(55.506) 的北侧几行（55.512—55.517）在纬度上更贴近
    `kholm_zhirkovsky`(55.517, 德控)，归属规则会把它们判给后者。但若不一起西推，
    战线就会从 36.30 斜插到 35.55，在 0.8 km 内形成一道贴住 mozhaisk 的墙
    （实测城市距边界仅 0.58 km，10-16 误判为德方）。
    """
    res = list(tab)
    for pid, rw in NOTCH_ROW_WEIGHTS.items():
        if pid not in WINDOW:
            continue
        p = GAZ[pid]['pos']
        want = city_side(pid, h)
        dlon = _km_per_deg_lon(p[1])
        km = NOTCH_TUNE.get(pid, {}).get('margin_km', clear_km(pid, h))
        for lat, w in rw.items():
            if lat not in LATS:
                continue
            i = LATS.index(lat)
            reach = (km / dlon) * w
            target = p[0] + reach if want == 'DE' else p[0] - reach
            res[i] = max(res[i], target) if want == 'DE' else min(res[i], target)
    return res


MAX_EDGE_KM = 28.0        # 外环里超过这个长度的边会被细分（画布外闭合边除外）
EDGE_STEP_KM = 8.0        # 细分步长（km）：取 8 km（≈8 格），保证任意边都 < 28 km，
                          # 城郊带（55.75—55.92°N）内的边也压在 30 km 以下

REVERSAL_MAX_DEG = 0.30   # 反向折返的允许上限（度，≈33 km）；超过就削平，避免上百 km 的弦


def _keep_base_monotone(base, out):
    """削掉「城市窗口制造出来的、与原始折线走向相反的大幅折返」。

    背景：这是「同一纬度带经度来回跳、产生上百 km 长弦」的根子。
    例：`kholm_zhirkovsky`(55.900) 的城市本来就在德控纵深里，窗口不需要推它；
    但它的邻居 `istra`(55.921) 与 `krasnaya_polyana`(55.833) 被推向东 0.8—1.4°。
    于是梯子变成「东—西—东」，闭合出的多边形就在 55.75—55.92°N 横穿城郊。

    **两条铁律（改这个函数前务必先读）**

    1. **小幅反向必须保留。** 凹口的正常收拢本来就是反向的一小段；只有
       幅度超过 `REVERSAL_MAX_DEG`（0.30°）的反向才削。把这个阈值调小
       （例如 0.05°）会让凹口失效，城市立刻被判到错误一侧——试过一次，
       图拉、维亚济马、布良斯克同时判错。
    2. **城市自己那一行的约束优先。** 由某个窗口拥有的行直接跳过限幅：
       限幅是平滑，平滑绝不能覆盖城市归属。第一版漏了这条，
       结果图拉那一行被上游的 `venyov` 推东量带着走，被削到 38.8°E。

    base 本身就是折返的地方（南段的叶列茨突出部）保持原样，不强行拉直——
    那里的折返是史实形态，不是缺陷。
    """
    res = list(out)
    for i in range(1, NR):
        # 这一行若由某个窗口拥有，城市归属优先于平滑：绝不覆盖它自己的约束。
        if _row_owner(mf_lats_lat(i)) is not None:
            continue
        step = res[i] - res[i - 1]
        base_step = base[i] - base[i - 1]
        if base_step > 1e-9 and step < -REVERSAL_MAX_DEG:
            res[i] = res[i - 1] - REVERSAL_MAX_DEG
        elif base_step < -1e-9 and step > REVERSAL_MAX_DEG:
            res[i] = res[i - 1] + REVERSAL_MAX_DEG
    return res


def _row_owner(lat):
    """该纬度行由哪个城市窗口拥有（最近者）；没有返回 None"""
    pick = None
    for pid, _a, _b, _why in CITY_WINDOWS:
        q = GAZ[pid]['pos']
        d = abs(lat - q[1])
        half = NOTCH_TUNE.get(pid, {}).get('half', NOTCH_HALF_DEG)
        if d <= half and (pick is None or d < pick[0]):
            pick = (d, pid)
    return None if pick is None else pick[1]


def mf_lats_lat(i):
    return LATS[i]


def make_room_for_holes(tab, rings):
    """把外环推到所有洞以东（必要时），保证洞完全落在外环内。

    洞 = 德军控制区里的苏方飞地，它在东西方向上必须整体位于战线以西。
    若某个洞的最东顶点比该纬度处的战线还靠东，就把战线推到洞东侧 + 1 格，
    洞才真正「被德军包围」。只影响洞覆盖的纬度行及其两侧的收拢带。
    """
    if not rings:
        return tab
    out = list(tab)
    for ring in rings:
        lat0 = min(q[1] for q in ring)
        lat1 = max(q[1] for q in ring)
        for i, lat in enumerate(LATS):
            pad = 0.0 if lat0 <= lat <= lat1 else NOTCH_SLOPE * min(abs(lat - lat0), abs(lat - lat1))
            if pad > HOLE_PAD_MAX_DEG:
                continue
            # 该纬度上洞的最东经度（对环做线性插值太复杂，这里取覆盖该纬度的边）
            east = None
            n = len(ring)
            for k in range(n):
                a, b = ring[k], ring[(k + 1) % n]
                lo, hi = min(a[1], b[1]), max(a[1], b[1])
                if lo - 1e-9 <= lat <= hi + 1e-9:
                    if abs(b[1] - a[1]) < 1e-12:
                        cand = max(a[0], b[0])
                    else:
                        t = (lat - a[1]) / (b[1] - a[1])
                        cand = a[0] + (b[0] - a[0]) * t
                    east = cand if east is None else max(east, cand)
            if east is None:
                continue
            need = east + (HOLE_PAD_KM + NOTCH_SLOPE * 0) / _km_per_deg_lon(lat)
            if out[i] < need:
                out[i] = need
    return out


def _lon_at(tab, lat):
    if lat >= LATS[0]:
        return tab[0]
    if lat <= LATS[-1]:
        return tab[-1]
    for i in range(len(LATS) - 1):
        if LATS[i] >= lat >= LATS[i + 1]:
            t = (LATS[i] - lat) / (LATS[i] - LATS[i + 1])
            return tab[i] + (tab[i + 1] - tab[i]) * t
    return tab[-1]


def load_front_lines():
    """读研究交付的战线；缺失或结构不对时给出明确错误"""
    if not os.path.exists(FRONT_LINES):
        sys.exit(f'缺少 {os.path.relpath(FRONT_LINES, CAMP)}：本脚本以它为战线的唯一真源。'
                 f'先等「研究-战线进程」交付，或从 git 恢复该文件。')
    d = json.load(open(FRONT_LINES))
    frames = d['frames']
    assert len(frames) >= 30, f'front-lines.json 只有 {len(frames)} 帧，至少要 30 帧'
    for f in frames:
        assert 'at' in f and 'line' in f and len(f['line']) >= 3, f'front-lines 帧结构不对：{f.get("at")}'
        lats = [q[1] for q in f['line']]
        assert all(lats[i] > lats[i + 1] for i in range(len(lats) - 1)), \
            f'{f["at"]} 的 line 纬度非严格递减，无法作为单值战线'
    return d


# ---------- 关键帧 ----------
def _dedupe(ring):
    """去掉重复顶点与「三点共线且方向相同」的中间点（采样行很密，战线上常有近乎重复的点）。

    只删经度单调段内部的点，四舍五入到 1e-4° 后完全相同的相邻点一律删掉。
    返回的环仍不闭合（首尾不重复）。
    """
    out = []
    for q in ring:
        if out and abs(out[-1][0] - q[0]) < 1e-4 and abs(out[-1][1] - q[1]) < 1e-4:
            continue
        out.append(q)
    # 去掉与前后点共线的中间点
    res = []
    n = len(out)
    for i, q in enumerate(out):
        if 0 < i < n - 1:
            a, b = out[i - 1], out[i + 1]
            # 面积判据：三点共线且 b 在 a、q 的同侧
            area = (q[0] - a[0]) * (b[1] - a[1]) - (q[1] - a[1]) * (b[0] - a[0])
            if abs(area) < 1e-9:
                continue
        res.append(q)
    return res


def _subdivide_long_edges(ring, max_km=MAX_EDGE_KM, step_km=EDGE_STEP_KM,
                          keep_first=0, keep_last=1):
    """把外环里过长的边按 step_km 细分。

    为什么需要它：战线是「纬度梯子」，相邻采样行理论上只有几 km 间距；但有两类边会很长：

    1. **原始折线本身的陡段**：研究交付的接触线在个别纬度跨得很开（例如加里宁一段
       57.15°N→56.86°N 经度从 32.6°E 跳到 36.3°E，那是真实的东西向拉直，不是缺陷），
       直接把两行连起来就会出现上百 km 的弦。
    2. **相邻且期望相反的两城**：克拉斯纳亚波利亚纳(55.833, DE) 与莫斯科(55.755, SU) 只差
       0.078° 却要跨 1.3°E；两行之间隔着一条长边。

    细分只是**沿边插点**，不改变多边形形状（点落在原线段上），因此不影响任何点内判定；
    它消除的是「长弦」这种几何痕迹——M1 的「德军前锋距克里姆林宫」按边求交时，
    长弦会横穿城郊给出错误的距离。

    闭合边（画布外角点连出的三条边）不参与细分：`keep_first`/`keep_last` 给出「纯战线段」
    的索引区间 [keep_first, keep_last]，只有这段里的边才细分。
    """
    out = []
    n = len(ring)
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        out.append(a)
        if not (keep_first <= i < keep_last):
            continue
        L = _seg_km(a, b)
        if L <= max_km:
            continue
        k = int(math.ceil(L / step_km))
        for j in range(1, k):
            t = j / k
            out.append([round(a[0] + (b[0] - a[0]) * t, 4),
                        round(a[1] + (b[1] - a[1]) * t, 4)])
    return out


def _seg_km(a, b):
    k = 111.32 * math.cos(math.radians((a[1] + b[1]) / 2))
    return math.hypot((a[0] - b[0]) * k, (a[1] - b[1]) * 110.57)


# ---- 调参护栏：几个常量之间存在硬约束，改坏了会「静默」出错，所以在此断言 ----
assert MAX_EDGE_KM > EDGE_STEP_KM >= CELL_KM * 4, \
    '细分步长须大于 4 个场格且小于上限，否则细分无意义或插点过稀'
assert NOTCH_HALF_DEG > 0 and REVERSAL_MAX_DEG > 2.0 * NOTCH_HALF_DEG, \
    (f'REVERSAL_MAX_DEG({REVERSAL_MAX_DEG}) 必须大于 2×NOTCH_HALF_DEG({2 * NOTCH_HALF_DEG})：'
     '反向限幅只能削「凹口收拢以外」的异常折返，阈值调小会把凹口削平、城市判到错误一侧')
# 净空量必须正比于「到翻转时刻的时间距离」，且上下限留出足够动态范围，
# 否则关键帧之间的插值翻转点会漂到错误一侧（试过把上限压到 22 km，审计立刻 67/69）。
assert CLEAR_MAX_KM >= 4.0 * CLEAR_MIN_KM, \
    '净空上限须至少是最小值的 4 倍，否则时间距离无法映射成足够的净空差'
# 护栏必须比较「换算后的日增量」，而不是两个原始常量：
# 曾经的写法 `CLEAR_MAX_KM > CLEAR_SCALE_KM_PER_DAY`（55 > 11）通过，
# 但真正的日增量是 ×24，5 小时就撞上限 —— 那条断言对单位错误完全无效。
assert CLEAR_MAX_KM > CLEAR_SCALE_KM_PER_DAY * 2.0, \
    '按天换算后一天增量必须远小于上限，否则净空恒被截断、退化成常数'


def build_frames(fl):
    """返回 [(at, dict)]；dict 即写入磁盘的 JSON 内容"""
    out = []
    for f in fl['frames']:
        at = f['at']
        h = hours(at)
        # 洞 = 德军控制区里的**非德军**飞地（苏军被围的合围圈 / 苏军走廊）
        holes = [x['ring'] for x in POCKETS if hours(x['start']) <= h < hours(x['end'])]
        # 楔子 = 德军在苏控区里伸出的**德控**突出部 → 独立多边形，不是洞
        spurs = [w['ring'] for w in WEDGES if hours(w['start']) <= h < hours(w['end'])]
        tab = apply_city_windows(resample(f['line']), h)
        tab = make_room_for_holes(tab, holes)
        outer = _dedupe([[round(lon, 4), lat] for lat, lon in zip(LATS, tab)])
        # 「纯战线段」= 外环里除最后三个闭合顶点之外的部分；闭合边不细分
        outer = _subdivide_long_edges(outer, keep_first=0, keep_last=len(outer) - 1)
        outer += [[WEST, SOUTH], [WEST, NORTH]]
        poly = [outer]
        for ring in holes:                                   # 合围圈 / 苏军走廊 → 洞
            poly.append([[round(float(q[0]), 4), round(float(q[1]), 4)] for q in ring])
        polys = [poly]
        for ring in spurs:                                   # 德控突出部 → 独立多边形
            polys.append([[[round(float(q[0]), 4), round(float(q[1]), 4)] for q in ring]])
        obj = {'at': at, 'control': {'DE': polys}}
        if f.get('transition'):
            obj['transition'] = f['transition']
        elif at in STEP_FRAMES:
            obj['transition'] = 'step'
        obj['note'] = f.get('note', '')
        obj['sources'] = list(dict.fromkeys(f.get('sources') or ['strat_cmh_tomoscow']))
        obj['confidence'] = f.get('confidence', 'medium')
        out.append((at, obj))
    return out



# 采样行 = 基础行 ∪ 所有被断言城市的纬度 ∪ 所有洞锚点的纬度。
# 城市必须有自己的一行：这样「城市在该纬度应当归谁」的判定不依赖相邻行的插值，边界是精确的。
_ENCLAVE_ANCHORS = [w['anchor'] for w in WEDGES] + [p['anchor'] for p in POCKETS]
# 洞的每个顶点纬度也必须是采样行：`make_room_for_holes` 只在采样行上推战线，
# 若洞的东顶点落在两行之间，那一行推不到位，洞就会越出外环。
_HOLE_LATS = [round(q[1], 3) for grp in (WEDGES, POCKETS) for e in grp for q in e['ring']]
# NOTCH_TUNE 里显式列出的收拢行也必须是采样行
_TUNE_LATS = [round(r, 3) for td in NOTCH_TUNE.values() for r in td.get('row_weights', {})]
_EXTRA_LATS = sorted({round(GAZ[p]['pos'][1], 3) for p in WINDOW}
                     | {round(GAZ[a]['pos'][1], 3) for a in _ENCLAVE_ANCHORS}
                     | set(_HOLE_LATS) | set(_TUNE_LATS))
LATS = sorted(set(round(x, 3) for x in LATS_BASE) | set(_EXTRA_LATS), reverse=True)
NR = len(LATS)

def resample(line):
    """研究交付的 25 点折线（纬度严格递减）→ LATS 上的经度梯子（端点常值外推）"""
    pts = sorted(((float(q[1]), float(q[0])) for q in line), reverse=True)
    lat0, lat1 = pts[0][0], pts[-1][0]
    tab = []
    for lat in LATS:
        if lat >= lat0:
            tab.append(pts[0][1])
        elif lat <= lat1:
            tab.append(pts[-1][1])
        else:
            for i in range(len(pts) - 1):
                a, b = pts[i], pts[i + 1]
                if a[0] >= lat >= b[0]:
                    t = (a[0] - lat) / (a[0] - b[0])
                    tab.append(a[1] + (b[1] - a[1]) * t)
                    break
    return tab


# ---------- 几何工具 ----------
def ring_self_intersects(ring):
    n = len(ring)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = ring[j], ring[(j + 1) % n]
            d1, d2, d3, d4 = cross(c, d, a), cross(c, d, b), cross(a, b, c), cross(a, b, d)
            if ((d1 > 0 > d2) or (d1 < 0 < d2)) and ((d3 > 0 > d4) or (d3 < 0 < d4)):
                return (i, j)
    return None


def point_in_ring(p, ring):
    """奇偶规则（与 field.ts 的扫描线填充一致）"""
    x, y = p
    inside = False
    n = len(ring)
    for i in range(n):
        a, b = ring[i - 1], ring[i]
        if (a[1] > y) != (b[1] > y):
            if x < a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]):
                inside = not inside
    return inside


def seg_dist_km(p, a, b, lat):
    """点到线段的距离（km），经度按 cos(lat) 缩放"""
    k = _km_per_deg_lon(lat)
    px, py = p[0] * k, p[1] * 110.57
    ax, ay = a[0] * k, a[1] * 110.57
    bx, by = b[0] * k, b[1] * 110.57
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0.0 if L == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def poly_contains(poly, p):
    inside = False
    for ring in poly:
        if point_in_ring(p, ring):
            inside = not inside
    return inside


def poly_edge_km(poly, p):
    """p 到该多边形**任一边界**（外环或洞）的距离（km）

    洞的边同样是控制区边界：在洞里时最近边界就是洞边。所以这里对所有环取最小。
    """
    best = float('inf')
    for ring in poly:
        n = len(ring)
        for i in range(n):
            d = seg_dist_km(p, ring[i - 1], ring[i], p[1])
            if d < best:
                best = d
    return best


_poly_boundary_km = poly_edge_km


class FieldModel:
    """「时刻 → 某点处德军控制的有符号距离」，复刻 engine/geo/field/field.ts。

    真实引擎在网格上用 EDT 求格单位有符号距离；这里用解析距离（km）近似，
    格心误差 ≤ 1 格，只影响关键帧之间的插值过渡，不改变任一关键帧时刻的归属。
    """

    def __init__(self, frames):
        # 关键帧多边形保持经纬度（解析距离要在经纬度空间里算，经度按 cos(lat) 缩放）
        self.kfs = [(hours(at), obj['control']['DE'], obj.get('transition'))
                    for at, obj in frames]

    def sdf_grid(self, k, x, y):
        """网格坐标处的有符号距离（格单位，内负外正）。

        注意：洞是外环的一部分（`[外环, 洞…]`），奇偶规则下洞内为「外」。
        距离必须取「到最近边界」——**洞的边也是边界**，所以这里对每个多边形整体求最小边距，
        不能只对外环求。
        """
        polys = self.kfs[k][1]
        if not polys:
            return CLAMP
        ll = unproject((x * CELL, y * CELL))
        inside = any(poly_contains(poly, ll) for poly in polys)
        d = min(_poly_boundary_km(poly, ll) for poly in polys) / CELL_KM
        v = -(d - 0.5) if inside else (d - 0.5)
        return max(-CLAMP, min(CLAMP, v))

    def value_grid(self, h, x, y):
        ks = self.kfs
        if h <= ks[0][0]:
            return self.sdf_grid(0, x, y)
        if h >= ks[-1][0]:
            return self.sdf_grid(len(ks) - 1, x, y)
        i = 0
        while i < len(ks) - 2 and ks[i + 1][0] <= h:
            i += 1
        if ks[i + 1][2] == 'step':
            return self.sdf_grid(i, x, y)
        t = (h - ks[i][0]) / (ks[i + 1][0] - ks[i][0])
        return self.sdf_grid(i, x, y) * (1 - t) + self.sdf_grid(i + 1, x, y) * t

    def sdf_km(self, h, ll):
        """双线性采样后的有符号距离（km，负 = 德军一侧）——与引擎 sample() 同算法"""
        gx, gy = to_grid(ll)
        x = max(0.0, min(GW - 1.001, gx - 0.5))
        y = max(0.0, min(GH - 1.001, gy - 0.5))
        i, j = int(math.floor(x)), int(math.floor(y))
        fx, fy = x - i, y - j
        v = (self.value_grid(h, i, j) * (1 - fx) * (1 - fy)
             + self.value_grid(h, i + 1, j) * fx * (1 - fy)
             + self.value_grid(h, i, j + 1) * (1 - fx) * fy
             + self.value_grid(h, i + 1, j + 1) * fx * fy)
        return v * CELL_KM

    def holder(self, h, ll):
        """'DE' | 'SU'（本战役掩膜 bit0 铺满画布，战区处处有效）"""
        return 'DE' if self.sdf_km(h, ll) < 0 else 'SU'


# ---------- 城市归属断言 ----------
# (地名 id, 中文, 时刻, 期望控制方, 史实依据)
CHECKS = [
    # ===== 合同点名的七座城市 =====
    # 莫斯科：全程苏方
    ('moscow', '莫斯科', '1941-09-30T00:00', 'SU', '开战时苏方'),
    ('moscow', '莫斯科', '1941-10-16T00:00', 'SU', '十月危机中未被攻占'),
    ('moscow', '莫斯科', '1941-12-02T00:00', 'SU', '德军最接近时距城约 30 km'),
    ('moscow', '莫斯科', '1941-12-05T00:00', 'SU', '反攻前夜'),
    ('moscow', '莫斯科', '1942-01-31T00:00', 'SU', '战役终点'),
    # 图拉：全程苏方（11 月三面包围但未被攻下）
    ('tula', '图拉', '1941-09-30T00:00', 'SU', '开战时苏方'),
    ('tula', '图拉', '1941-10-30T00:00', 'SU', '古德里安首次强攻失败'),
    ('tula', '图拉', '1941-11-25T00:00', 'SU', '三面包围但未被攻下'),
    ('tula', '图拉', '1941-12-05T00:00', 'SU', '反攻前夜'),
    ('tula', '图拉', '1942-01-31T00:00', 'SU', '战役终点'),
    # 卡卢加：10-13 失守，12-30 收复
    ('kaluga', '卡卢加', '1941-10-05T00:00', 'SU', '10 月 13 日前的苏方'),
    ('kaluga', '卡卢加', '1941-10-18T00:00', 'DE', '10 月 13 日失守'),
    ('kaluga', '卡卢加', '1941-11-30T00:00', 'DE', '德军占领期'),
    ('kaluga', '卡卢加', '1941-12-28T00:00', 'DE', '12 月 30 日前仍在德军手中'),
    ('kaluga', '卡卢加', '1942-01-03T00:00', 'SU', '12 月 30 日收复'),
    ('kaluga', '卡卢加', '1942-01-31T00:00', 'SU', '战役终点'),
    # 克林：11-23 失守，12-15 收复
    ('klin', '克林', '1941-11-15T00:00', 'SU', '11 月 23 日前的苏方'),
    ('klin', '克林', '1941-11-25T00:00', 'DE', '11 月 23 日失守'),
    ('klin', '克林', '1941-12-11T00:00', 'DE', '12 月 15 日前的德军占领期'),
    ('klin', '克林', '1941-12-17T00:00', 'SU', '12 月 15 日收复'),
    ('klin', '克林', '1942-01-31T00:00', 'SU', '战役终点'),
    # 加里宁：10-14 失守，12-16 收复
    ('kalinin', '加里宁', '1941-10-10T00:00', 'SU', '10 月 14 日前的苏方'),
    ('kalinin', '加里宁', '1941-10-18T00:00', 'DE', '10 月 14 日失守'),
    ('kalinin', '加里宁', '1941-12-02T00:00', 'DE', '德军占领期'),
    ('kalinin', '加里宁', '1941-12-20T00:00', 'SU', '12 月 16 日收复'),
    ('kalinin', '加里宁', '1942-01-31T00:00', 'SU', '战役终点'),
    # 维亚济马：10-7 合围圈闭合，10-13 后为德军
    ('vyazma', '维亚济马', '1941-10-05T00:00', 'SU', '10 月 7 日合围圈闭合前的苏方'),
    ('vyazma', '维亚济马', '1941-10-16T00:00', 'DE', '10 月 13 日后（合围圈消除）'),
    ('vyazma', '维亚济马', '1941-11-30T00:00', 'DE', '德军占领期'),
    ('vyazma', '维亚济马', '1942-01-31T00:00', 'DE', '战役终点仍在德军手中'),
    # 布良斯克：10-6 失守
    ('bryansk', '布良斯克', '1941-10-03T00:00', 'SU', '10 月 6 日前的苏方'),
    ('bryansk', '布良斯克', '1941-10-10T00:00', 'DE', '10 月 6 日失守'),
    ('bryansk', '布良斯克', '1941-11-30T00:00', 'DE', '德军占领期'),
    ('bryansk', '布良斯克', '1942-01-31T00:00', 'DE', '战役终点仍在德军手中'),
    # ===== 其余关键节点（同一套窗口模型，防止回归）=====
    ('kholm_zhirkovsky', '霍尔姆-日尔科夫斯基', '1941-10-03T00:00', 'SU', '10 月 6 日前的苏方'),
    ('kholm_zhirkovsky', '霍尔姆-日尔科夫斯基', '1941-10-18T00:00', 'DE', '第 7 装甲师 10/6—7 经此南下'),
    ('toropets', '托罗佩茨', '1941-12-02T00:00', 'DE', '德军占领期'),
    ('toropets', '托罗佩茨', '1942-01-15T00:00', 'DE', '1 月 21 日前的德军占领'),
    ('toropets', '托罗佩茨', '1942-01-31T00:00', 'SU', '1 月 21 日由第 4 突击军收复'),
    ('kholm', '霍尔姆', '1942-01-31T00:00', 'DE', '守备队被围但坚守至 5 月 5 日'),
    ('ostashkov', '奥斯塔什科夫', '1941-12-02T00:00', 'SU', '始终未被攻占'),
    ('orel', '奥廖尔', '1941-10-02T00:00', 'SU', '10 月 3 日前的苏方'),
    ('orel', '奥廖尔', '1941-10-10T00:00', 'DE', '10 月 3 日失守'),
    ('orel', '奥廖尔', '1942-01-31T00:00', 'DE', '战役终点仍在德军手中'),
    ('kursk', '库尔斯克', '1941-10-31T00:00', 'SU', '11 月 3 日前的苏方'),
    ('kursk', '库尔斯克', '1941-11-10T00:00', 'DE', '11 月 3 日失守'),
    ('kursk', '库尔斯克', '1942-01-31T00:00', 'DE', '至 1943 年 2 月才被收复'),
    ('mozhaisk', '莫扎伊斯克', '1941-10-16T00:00', 'SU', '10 月 18 日前的苏方'),
    # 格扎茨克 10-09 被帝国师占领后恒德占（1943-03-06 才收复），中途无翻转。
    # 此前 82 条断言里它只有 1942-01-31 一个采样点，所以「中途误翻」抓不到
    # （10-11—10-13 曾因 NOTCH_PRIORITY 抢行而误判为苏方）。恒占城市必须有中途采样点。
    ('gzhatsk', '格扎茨克', '1941-10-12T00:00', 'DE', '10-09 失守后恒德占（1943-03 才收复）'),
    ('gzhatsk', '格扎茨克', '1941-10-16T00:00', 'DE', '同上'),
    ('gzhatsk', '格扎茨克', '1941-12-02T00:00', 'DE', '同上'),

    # ---- 「恒占」城市的中途采样点 ----
    # 教训：只在首尾各放一条断言的恒占城市，中途误翻永远抓不到
    # （gzhatsk 10-11—10-13 误判就是这样漏过去的）。
    # 下面给每个 to=None 的城市补一个中段采样点。
    ('mtsensk', '姆岑斯克', '1941-11-15T00:00', 'DE', '10-11 失守后恒德占至 12 月反攻'),
    ('mtsensk', '姆岑斯克', '1941-12-02T00:00', 'DE', '同上'),
    ('dmitrov', '德米特罗夫', '1941-11-30T00:00', 'SU', '全程苏方（德军止于运河东岸）'),
    ('dmitrov', '德米特罗夫', '1941-12-02T00:00', 'SU', '同上'),
    ('kholm', '霍尔姆', '1941-12-02T00:00', 'DE', '德军守备队据守，1 月起被围但仍属德控'),
    ('kholm', '霍尔姆', '1941-11-15T00:00', 'DE', '同上'),
    ('smolensk', '斯摩棱斯克', '1941-12-02T00:00', 'DE', '7 月失守后恒德占'),
    ('smolensk', '斯摩棱斯克', '1942-01-15T00:00', 'DE', '同上'),
    ('serpukhov', '谢尔普霍夫', '1941-12-02T00:00', 'SU', '全程苏方'),
    ('serpukhov', '谢尔普霍夫', '1942-01-15T00:00', 'SU', '同上'),
    ('kashira', '卡希拉', '1941-12-02T00:00', 'SU', '全程苏方'),
    ('kashira', '卡希拉', '1942-01-15T00:00', 'SU', '同上'),
    ('kolomna', '科洛姆纳', '1941-11-30T00:00', 'SU', '全程苏方'),
    ('kolomna', '科洛姆纳', '1942-01-15T00:00', 'SU', '同上'),
    ('ryazan', '梁赞', '1941-12-02T00:00', 'SU', '全程苏方'),
    ('ryazan', '梁赞', '1941-11-15T00:00', 'SU', '同上'),
    ('ostashkov', '奥斯塔什科夫', '1941-11-15T00:00', 'SU', '全程苏方（12-02 已有一条）'),
    ('ostashkov', '奥斯塔什科夫', '1942-01-15T00:00', 'SU', '同上'),
    ('mozhaisk', '莫扎伊斯克', '1941-10-21T00:00', 'DE', '10 月 18 日失守'),
    ('mozhaisk', '莫扎伊斯克', '1942-01-28T00:00', 'SU', '1 月 20 日收复'),
    ('volokolamsk', '沃洛科拉姆斯克', '1941-10-21T00:00', 'SU', '10 月 27 日前的苏方'),
    ('volokolamsk', '沃洛科拉姆斯克', '1941-11-06T00:00', 'DE', '10 月 27 日失守'),
    ('volokolamsk', '沃洛科拉姆斯克', '1941-12-24T00:00', 'SU', '12 月 20 日收复'),
    ('naro_fominsk', '纳罗福明斯克', '1941-11-21T00:00', 'SU', '12 月 1 日前的苏方'),
    ('naro_fominsk', '纳罗福明斯克', '1941-12-05T00:00', 'DE', '12 月 1 日失守'),
    ('naro_fominsk', '纳罗福明斯克', '1941-12-31T00:00', 'SU', '12 月 26 日收复'),
    ('yakhroma', '亚赫罗马', '1941-11-25T00:00', 'SU', '11 月 27 日前的苏方'),
    ('yakhroma', '亚赫罗马', '1941-11-28T00:00', 'DE', '11 月 27—28 日德军渡莫斯科运河'),
    ('yakhroma', '亚赫罗马', '1941-12-11T00:00', 'SU', '12 月 6 日桥头堡被拔除'),
    ('serpukhov', '谢尔普霍夫', '1941-11-30T00:00', 'SU', '始终未被攻占'),
    ('kashira', '卡希拉', '1941-11-30T00:00', 'SU', '德军抵近但未攻占'),
    ('kolomna', '科洛姆纳', '1941-12-02T00:00', 'SU', '始终未被攻占'),
    ('ryazan', '梁赞', '1942-01-31T00:00', 'SU', '始终未被攻占'),
    ('smolensk', '斯摩棱斯克', '1941-12-02T00:00', 'DE', '7 月中旬即为德军占领'),
    ('rzhev', '勒热夫', '1941-12-02T00:00', 'DE', '10 月 14 日失守'),
    ('rzhev', '勒热夫', '1942-01-31T00:00', 'DE', '德军坚守至 1943 年 3 月'),
    ('gzhatsk', '格扎茨克', '1942-01-31T00:00', 'DE', '德军坚守至 1943 年 3 月'),
    ('yukhnov', '尤赫诺夫', '1942-01-31T00:00', 'DE', '德军坚守至 1942 年 3 月'),
    ('maloyaroslavets', '小雅罗斯拉韦茨', '1941-11-30T00:00', 'DE', '10 月 18 日失守，1942 年 1 月 2 日收复'),
    # 叶列茨—利夫内突出部（1941 年 11 月末第 2 集团军向东北插入，12 月被叶列茨反攻削平）
    ('livny', '利夫内', '1941-11-20T12:00', 'SU', '11 月 26 日前的苏方'),
    ('livny', '利夫内', '1941-11-30T12:00', 'DE', '11 月 26 日被第 2 集团军占领'),
    ('livny', '利夫内', '1941-12-20T12:00', 'SU', '叶列茨—利夫内反攻后收复'),
    ('venyov', '韦尼奥夫', '1941-11-20T12:00', 'SU', '11 月 25 日前的苏方'),
    ('venyov', '韦尼奥夫', '1941-11-30T12:00', 'DE', '11 月 25 日左右被占（被占两周）'),
    ('venyov', '韦尼奥夫', '1941-12-10T12:00', 'SU', '12 月 9 日由别洛夫第 1 近卫骑兵军收复'),
    ('yefremov', '叶夫列莫夫', '1941-11-25T12:00', 'DE', '11 月 22 日被占'),
    ('mikhailov', '米哈伊洛夫', '1941-11-30T12:00', 'SU', '12 月 7 日由第 328 步兵师收复，此前未被占'),
    # 谢尔吉耶夫镇（扎戈尔斯克）距莫斯科约 70 km，1941 年从未被德军占领。
    # 审查 F2 发现 12-02 帧曾因亚赫罗马的推东长刺把它划入德控，这里在多个时点锁死。
    ('sergiyev_posad', '谢尔吉耶夫镇', '1941-11-25T00:00', 'SU', '从未被占领'),
    ('sergiyev_posad', '谢尔吉耶夫镇', '1941-11-30T00:00', 'SU', '从未被占领'),
    ('sergiyev_posad', '谢尔吉耶夫镇', '1941-12-02T00:00', 'SU', '从未被占领'),
    ('sergiyev_posad', '谢尔吉耶夫镇', '1941-12-05T00:00', 'SU', '从未被占领'),
    ('sergiyev_posad', '谢尔吉耶夫镇', '1941-12-10T00:00', 'SU', '从未被占领'),
]


# 德军控制区边界到克里姆林宫的最近距离下限（km）。
# 这是「城市归属」断言抓不到的一类错误：69 条归属断言只问「某城归谁」，
# 不管控制区边界长什么样。净空量的单位错误（小时忘了除 24）会让城市仍判对，
# 却把边界恒定推东，使最近距离算成 5.7 km（史实 20—30 km）。只有距离曲线能抓住它。
# 下限 = 德军前锋线不得进入莫斯科市区。
#
# 口径说明（很关键）：`krasnaya_polyana` 站点坐标距克里姆林宫约 19.9 km，而史料说德军
# 「вышли на расстояние чуть более 29 км от Кремля」——29 km 指的是**前锋线**（村以西的
# 实际接触线），不是村中心。地图上的「德控边界」即前锋线，所以它到克里姆林宫应比 19.9 km
# 更远，而不是更近。取 12 km 是「前锋线不进入市区（市区半径约 10 km）」的下限。
APPROACH_MIN_KM = 12.0
APPROACH_FRAMES = ('1941-11-30T00:00', '1941-12-02T00:00', '1941-12-05T00:00')


def approach_report(frames):
    """每一帧德军控制区边界到克里姆林宫的最近距离（km）"""
    krem = GAZ['kremlin']['pos']
    rows = []
    for at, obj in frames:
        ring = obj['control']['DE'][0][0]
        best = min(seg_dist_km(krem, ring[i - 1], ring[i], krem[1])
                   for i in range(len(ring)))
        rows.append(dict(at=at, km=best))
    return rows


def run_checks(model):
    rows = []
    for pid, zh, at, want, why in CHECKS:
        ll = GAZ[pid]['pos']
        h = hours(at)
        km = model.sdf_km(h, ll)
        got = 'DE' if km < 0 else 'SU'
        rows.append(dict(id=pid, zh=zh, at=at, want=want, got=got, ok=(got == want),
                         why=why, pos=ll, km=km))
    return all(r['ok'] for r in rows), rows


def hole_report(frames, model):
    """洞：存续期内锚点必须在外环内、在洞里、且场判为苏方"""
    meta = []
    for p in POCKETS:
        meta.append(dict(id=p['id'], anchor=p['anchor'], kind='合围圈',
                         name=p['name'], start=p['start'], end=p['end'], note=p['note']))
    rows = []
    for hm in meta:
        ll = GAZ[hm['anchor']]['pos']
        h0, h1 = hours(hm['start']), hours(hm['end'])
        total = hit = 0
        for at, obj in frames:
            h = hours(at)
            if not (h0 <= h < h1):
                continue
            total += 1
            poly = obj['control']['DE'][0]
            if point_in_ring(ll, poly[0]) and any(point_in_ring(ll, r) for r in poly[1:]) \
                    and model.holder(h, ll) == 'SU':
                hit += 1
        rows.append(dict(hm, zh=GAZ[hm['anchor']]['zh'], total=total, hit=hit,
                         ok=(total > 0 and hit == total)))
    return rows


def spur_report(frames, model):
    """德控突出部（WEDGES）：存续期内锚点必须判为德方"""
    rows = []
    for w in WEDGES:
        ll = GAZ[w['anchor']]['pos']
        h0, h1 = hours(w['start']), hours(w['end'])
        total = hit = 0
        for at, obj in frames:
            h = hours(at)
            if not (h0 <= h < h1):
                continue
            total += 1
            if model.holder(h, ll) == 'DE':
                hit += 1
        rows.append(dict(id=w['id'], anchor=w['anchor'], name=w['name'],
                         start=w['start'], end=w['end'], note=w['note'],
                         zh=GAZ[w['anchor']]['zh'], total=total, hit=hit,
                         ok=(total > 0 and hit == total)))
    return rows


def geometry_report(frames):
    """每帧：洞数、自相交、洞是否越出外环、闭合顶点是否落在画布内"""
    rows = []
    errs = []
    for at, obj in frames:
        holes = 0
        for pi, poly in enumerate(obj['control']['DE']):
            outer = poly[0]
            if len(outer) < 3:
                errs.append(f'{at} DE[{pi}] 外环点数 {len(outer)} < 3')
            x = ring_self_intersects(outer)
            if x:
                errs.append(f'{at} DE[{pi}] 外环自相交 边 {x[0]}/{x[1]}')
            # 只有**主线多边形**（DE[0]）有「闭合到画布外」的边；
            # DE[1..] 是德控突出部（楔子），完全在画布内，不适用这条检查。
            if pi == 0:
                for k in range(len(outer) - 3, len(outer)):
                    if inside_canvas(outer[k]):
                        errs.append(f'{at} DE[{pi}] 闭合顶点 {outer[k]} 落在画布内')
            for ri in range(1, len(poly)):
                holes += 1
                ring = poly[ri]
                if len(ring) < 3:
                    errs.append(f'{at} DE[{pi}] 洞 {ri} 点数 {len(ring)} < 3')
                xi = ring_self_intersects(ring)
                if xi:
                    errs.append(f'{at} DE[{pi}] 洞 {ri} 自相交 边 {xi[0]}/{xi[1]}')
                for q in ring:
                    if not point_in_ring(q, outer):
                        errs.append(f'{at} DE[{pi}] 洞 {ri} 顶点越出外环 {q}')
                        break
        rows.append(dict(at=at, holes=holes, transition=obj.get('transition') or 'smooth',
                         confidence=obj['confidence'], sources=len(obj['sources'])))
    return errs, rows


# ---------- 写盘 ----------
def write_fronts(frames):
    os.makedirs(OUT, exist_ok=True)
    want = set()
    for at, obj in frames:
        name = at.replace(':', '-') + '.json'
        want.add(name)
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write('\n')
    removed = []
    for fn in sorted(os.listdir(OUT)):
        if fn.endswith('.json') and fn not in want:
            os.remove(os.path.join(OUT, fn))
            removed.append(fn)
    return removed


# ---------- 文档 ----------
def render_doc(frames, geo_rows, check_rows, hole_rows, bounds, geo_errs, fl):
    west, south, east, north = bounds
    ok_city = all(r['ok'] for r in check_rows)
    ok_hole = all(r['ok'] for r in hole_rows)

    def ctbl(rows):
        out = ['| 地名 | 时刻（莫斯科） | 期望 | 实得 | 结论 | 距战线 | 依据 |',
               '|---|---|---|---|---|---|---|']
        for r in rows:
            d = f"{abs(r['km']):.0f} km {'内（德方）' if r['km'] < 0 else '外（苏方）'}"
            out.append(f"| {r['zh']} | {r['at'].replace('T', ' ')} | {r['want']} | {r['got']} | "
                       f"{'通过' if r['ok'] else '**失败**'} | {d} | {r['why']} |")
        return '\n'.join(out)

    def htbl(rows):
        out = ['| 洞 | 类别 | 名称 | 锚点地名 | 存续期 | 命中帧 | 结论 |',
               '|---|---|---|---|---|---|---|']
        for r in rows:
            end = r['end'] if r['end'].startswith('2999') else r['end']
            span = (f"{r['start'].replace('T', ' ')} — "
                    f"{'战役结束' if end.startswith('2999') else end.replace('T', ' ')}")
            out.append(f"| `{r['id']}` | {r.get('kind', '')} | {r['name']} | "
                       f"{r['zh']}（`{r['anchor']}`） | {span} | "
                       f"{r['hit']}/{r['total']} | {'通过' if r['ok'] else '**失败**'} |")
        return '\n'.join(out)

    ftbl = ['| # | 关键帧 | 过渡 | 洞 | 置信度 | 来源数 |', '|---|---|---|---|---|---|']
    for i, r in enumerate(geo_rows, 1):
        ftbl.append(f"| {i} | {r['at'].replace('T', ' ')} | {r['transition']} | {r['holes']} | "
                    f"{r['confidence']} | {r['sources']} |")

    north_out = sum(1 for x in LATS if x > north)
    south_out = sum(1 for x in LATS if x < south)
    hnotes = '\n'.join(f"- **{r['name']}**（{r['start'][:10]} 起）：{r['note']}" for r in hole_rows)
    hole_frames = sum(1 for r in geo_rows if r['holes'] > 0)
    return f"""# 莫斯科保卫战 · 地理与战线精度说明

> 本文件由 `campaigns/moscow-1941/pipeline/make_fronts.py` 生成，重跑生成器即刷新全部自检表。
> 地图资产（投影、底图、掩膜）由 `sh tools/geo/run.sh moscow-1941` 生成，与战线数据同源。

## 1. 坐标系与投影

| 项 | 取值 |
|---|---|
| 投影 | `d3.geoConicConformal`，parallels `{FRAME['projection']['parallels']}`，rotate `{FRAME['projection']['rotate']}`，center `{FRAME['projection']['center']}` |
| 画布 | `{W}×{H}` 世界单位（px @ 最高级瓦片），`scale` {FRAME['scale']:.3f}，`translate` [{FRAME['translate'][0]:.3f}, {FRAME['translate'][1]:.3f}] |
| 名义 bbox | `[{FRAME['bbox'][0]}, {FRAME['bbox'][1]}, {FRAME['bbox'][2]}, {FRAME['bbox'][3]}]`（西、南、东、北） |
| 画布反算范围 | **{west:.2f}—{east:.2f}°E，{south:.2f}—{north:.2f}°N** |
| km/单位 | {KM_PER_UNIT:.6f} |
| 场网格 | `cell {CELL}`，`{GW}×{GH}` 格，格距 **{CELL_KM:.3f} km**，`clampKm {FRAME['field']['clampKm']}` → SDF 截断 {CLAMP} 格 |
| 掩膜 | `geo/field_masks.bin` = {GW}×{GH} = {GW * GH} 字节，全画布 bit0（苏联）\\|bit4（陆地）= 17，画布内无中立国 |
| 关键帧 | **{len(frames)} 帧**，{frames[0][0].replace('T', ' ')} — {frames[-1][0].replace('T', ' ')}（莫斯科时间 UTC+3） |

## 2. 边界与「格距 0.99 km」的精度含义

### 2.1 画布四角超出 bbox，战线必须闭合到画布外

`emit_frame.mjs` 用 bbox 的边界点集 `fitWidth` 定标，再按投影后的实际范围决定画布高度，因此画布四边的
反算经纬度（{west:.2f}°E—{east:.2f}°E / {south:.2f}°N—{north:.2f}°N）比名义 bbox
（{FRAME['bbox'][0]}—{FRAME['bbox'][2]}°E / {FRAME['bbox'][1]}—{FRAME['bbox'][3]}°N）更宽、更高。

`pipeline/front-lines.json` 的折线端点纬度是 **58.0 / 51.6**，其中 **58.0°N 仍落在画布内**
（画布北界 {north:.2f}°N）。直接闭合会在画布上缘露出一条斜边。生成器因此把战线
**向北常值外推到 {NORTH:.0f}°N、向南外推到 {SOUTH:.0f}°N**，再向西闭合到 **{WEST:.0f}°E**：

```
战线（自 {NORTH:.0f}°N 到 {SOUTH:.0f}°N）
  → ({WEST:.0f}°E, {SOUTH:.0f}°N)    # 南缘，在画布外
  → ({WEST:.0f}°E, {NORTH:.0f}°N)    # 西缘，在画布外
  → 回到战线北端                      # 北缘，在画布外
```

{NR} 行固定纬度（`LATS`）里，{north_out} 行在画布北界以北、{south_out} 行在画布南界以南，
闭合边因此全部落在画布外。栅格化时被画布自然裁切，**角落不会留下未着色的楔形，上缘也不会露出斜边**。
几何自检对每帧断言「闭合顶点必须落在画布外」（见 §6）。

### 2.2 {CELL_KM:.3f} km 是硬下限

控制区不是矢量实时求交，而是先在 `{GW}×{GH}` 的场网格上栅格化（`engine/geo/field/field.ts` 的
`rasterize` → `sdf`：扫描线填充 + 精确欧氏距离变换），再做关键帧插值、双线性采样。因此：

- **位置误差 ±{CELL_KM / 2:.2f} km**：任何地物在场网格上都有半格量化误差，多边形边界是 ±1 格的锯齿。
- **面积误差**：一格 {CELL_KM:.2f} km 见方；40 km 宽的战线，单格位移对应约 2.5% 的占领面积误差。
- **可分辨尺度**：{CELL_KM:.2f} km 小于当时一个步兵师的防御正面（10—20 km），
  所以师级态势可见、营级不可见；图上的「锯齿」是网格，不是史实细节。
- **时间误差**：关键帧之间按有符号距离场线性插值，战线近似匀速平移。真实机动不是匀速的
  （10 月 7—13 日维亚济马合围圈的收缩、11 月 15—30 日的突击、12 月反攻的加速都不是），
  中间时刻是插值近似。研究交付的关键帧已加密到 1—3 天一帧，插值区间短，误差可控。
- **定位口径**：本战役的战线是**战役级示意图**，标定到 ±10—15 km（约 10—15 格）。
  `note` 里的地名与日期是史实，多边形位置是示意。

### 2.3 掩膜特例

`geo.config.json` 把整个画布计入 `bit0`（1938 年苏联）与 `bit4`（陆地），画布内没有中立国，
所以「德军控制区之外 = 苏军控制区」恒成立，`remainder` 槽不需要任何数据。

## 3. 战线怎么构造

1. **唯一真源**：`pipeline/front-lines.json`（研究-战线进程交付，{len(fl['frames'])} 帧，每帧 25 点、
   纬度自 58.0 严格递减到 51.6 的接触线）。生成器把它线性重采样到 {NR} 行固定纬度梯子。
2. **每帧是全量快照**：`control.DE` 是「截至该时刻德军控制的全部苏联领土」，不是增量。
3. **史实占领窗口校正（`CITY_WINDOWS`）**：研究交付的是「概略接触线」，在若干纬度上与城市真实易手
   日期差几天到几周（例如 11 月 21 日克林已在德军手中、12 月 11 日却仍判德军；库尔斯克 11 月 3 日
   失守后，1 月又被划回苏方）。生成器按 **{len(CITY_WINDOWS)} 条**史实占领窗口逐帧校正，
   窗口集合带去重断言（重复定义在生成时报错，不会静默覆盖）。

   **净空量（clearance）的取法是这套机制的关键。** 引擎在关键帧之间对*有符号距离场*做线性插值，
   所以城市「翻面」的时刻由两侧净空量之比决定，而不是由关键帧本身决定：`f = c_前 / (c_前 + c_后)`。
   要让翻转落在史实日期上，净空量就必须正比于「到翻转时刻的时间距离」。因此每个城市的每个时刻取
   `c = {CLEAR_SCALE_KM_PER_DAY:.0f} km/天 × |t − T_flip|`，夹在 {CLEAR_MIN_KM:.0f}—{CLEAR_MAX_KM:.0f} km。
   这样**不只是关键帧上对，任意时刻都对** —— 权威审计脚本正是按「关键帧之间」的 12:00 采样，
   这一步是它能 69/69 的原因。

   推移只影响锚点所在纬度附近的少数采样行（默认 ±{NOTCH_HALF_DEG}°，凹口内权重线性收拢到 0）。
   两个相邻且期望相反的城市（德米特罗夫 56.35 与克林 56.333、叶列茨 52.58 与利夫内 52.43、
   伊斯特拉 55.92 与克拉斯诺亚波利亚纳 55.83）由 `NOTCH_TUNE` 逐城收窄凹口；
   布良斯克（53.24）与姆岑斯克（53.265）纬度只差 0.025°，用一组 7 行、带权重的平台，
   让城市落在平台中部而不是「单行尖钉」的顶点（尖钉窄于一格，会被网格采样抹平）。
   **「哪些城市在哪个时刻归谁」以 `CITY_WINDOWS` 为准，并由生成器逐条自检。**
4. **反向折返限幅（`_keep_base_monotone`）**：城市窗口的局部推移可能压在原始折线本来就
   「反着走」的段上，制造出**新的**折返。典型例子：`kholm_zhirkovsky`(55.900) 的城市
   本来就在德控纵深、窗口不需要推它，但相邻的 `istra`(55.921) 与 `krasnaya_polyana`(55.833)
   被推向东 0.8—1.4°，于是梯子变成「东—西—东」。
   生成器只削「与 base 走向相反且幅度 > {REVERSAL_MAX_DEG}°」的折返；**小幅反向必须保留**
   （凹口的正常收拢），且**城市自己那一行的约束优先**（窗口拥有的行不参与限幅），
   否则会把城市判到错误一侧。
   注意：南段的叶列茨突出部是 base 自身的真实折返，原样保留。

5. **长边细分（`_subdivide_long_edges`）**：闭合前把外环里超过 {MAX_EDGE_KM:.0f} km 的边
   按 {EDGE_STEP_KM:.0f} km 插点。原因是有两类边天生很长：
   ① 研究折线本身的陡段（加里宁一段 57.15°N→56.86°N 经度从 32.6°E 跳到 36.3°E，
   那是真实的东西向拉直）；
   ② 相邻且期望相反、相距极近的两城（克拉斯纳亚波利亚纳 55.833/37.333 为德控，
   莫斯科 55.755/37.617 为苏控，纬度只差 0.078° 却要横跨 1.3°E）。
   细分只沿边插点、不改变形状，因此不影响任何点内判定；它消除的是**几何痕迹**——
   否则「德军前锋距克里姆林宫」按边求交会得到 6 km 这种假数（该帧 note 自述 28—29 km）。
   **画布外的三条闭合边不细分**。

6. **「恒占」城市必须有中途采样点**（复审 N1 的教训）：
   82 条断言里 `gzhatsk` 只有 1942-01-31 一条，`CITY_WINDOWS` 里另有一批 `to=None` 的
   恒占城市（姆岑斯克、斯摩棱斯克、霍尔姆、德米特罗夫、谢尔普霍夫、卡希拉、科洛姆纳、梁赞、
   奥斯塔什科夫）也只有一两条。**只守首尾的断言抓不到「中途误翻」**——
   格扎茨克 10-11—10-13 三天被误判为苏方（它 10-09 失守后恒德占至 1943-03），
   没有任何一条断言覆盖那段。现已给每个恒占城市补了中段采样点（10 月中/12 月初/1 月中）。

7. **改地名坐标会连带改掉凹口（最容易踩的坑）**：凹口是按**纬度行**定义的，
   城市坐标一动，它落进的行、以及「哪一行归谁」都会变。
   本战役踩过两次：
   - `krasnaya_polyana` 从 55.833 修正到 56.023（F4）后不再落在原来的行上，
     最终改为用独立的**楔形多边形**（`WEDGES`）表达，彻底不参与凹口逻辑；
   - `kholm_zhirkovsky` 从 (34.28,55.9) 修正到真实坐标 (33.467,55.517)（F5）后，
     与 `mozhaisk` 的过渡行 55.517 **同纬度**，按「最近者胜」把该行从 mozhaisk 手里抢走，
     使 mozhaisk 的斜边上移、城市贴边，10-16 判反。
     解法是 `NOTCH_PRIORITY`（凹口优先权）与 `NOTCH_ROW_WEIGHTS`（逐行权重）。
   **改坐标后必须重跑 `--check` 与 `audit-control.ts`，并检查 `_row_owner()` 的归属是否变化。**

8. **采样行包含所有被约束的纬度**：`LATS` = 基础行 ∪ 所有城市纬度 ∪ 所有洞的锚点纬度与顶点纬度。
   城市必须有自己的一行，判定才不依赖相邻行的插值；洞的顶点纬度也必须是采样行，
   否则「给洞让位」的推移会漏掉那一行（这正是最初维亚济马洞越出外环的原因）。
9. **洞 = 德军控制区里的非德军飞地**（`[外环, 洞…]`），本战役有两类：
   - 苏军被围的**合围圈**（`POCKETS`：维亚济马圈围住维亚济马以南、瑟乔夫卡以西的西方方面军主力；
     布良斯克圈围住布良斯克以南、特鲁布切夫斯克周边的第 3、13 集团军）；
   - 苏军突入德军后方的**走廊**（`WEDGES`：1942 年 1 月的托罗佩茨走廊）。
   洞只在存续期的帧上出现，且必须完全落在外环内（几何自检逐顶点断言）。
   注意：**合围圈的闭合点（城市本身）属于德军，不是洞的锚点** —— 维亚济马圈的锚点是
   霍尔姆-日尔科夫斯基，布良斯克圈的锚点是特鲁布切夫斯克。
   `make_room_for_holes()` 负责在该帧把战线推到洞以东，保证洞真的「被德军包围」。
10. **不是洞的**：1942 年 1 月被围的**德军**霍尔姆守备队仍属德军控制区，由战线本身表达
   （战线在该段位于霍尔姆以西），不写成洞 —— 本引擎里洞恒表示「非德军控制」。

## 4. 关键帧一览

{chr(10).join(ftbl)}

带洞的帧共 **{hole_frames}** 个。

## 5. 洞（合围圈与走廊）自检

存续期内，锚点必须同时满足：在外环内、在洞里、场判定为苏方。

{htbl(hole_rows)}

{hnotes}

## 6. 关键城市归属自检

判定方法：把每帧多边形按与引擎相同的扫描线规则栅格化到 `{GW}×{GH}` 网格，按
`engine/geo/field/field.ts` 的规则求有符号距离（内负外正，截断 {CLAMP} 格），关键帧之间按时间线性插值
（`step` 帧保持上一帧），再在查询点做双线性采样，负值即德军控制。本机复刻用解析距离近似网格 EDT，
格心处误差 ≤ 1 格（≈1 km）。「距战线」为查询点到最近边界的距离。

共 **{len(check_rows)}** 条断言，**{'全部通过' if ok_city else '存在失败项'}**；
几何自检 **{len(geo_errs)}** 项问题。

{ctbl(check_rows)}

## 7. 与史实的已知偏差（已知并接受）

| 项 | 处理 | 理由 |
|---|---|---|
| 战线是南北单值折线 | 画不出南北向回折的狭窄走廊 | 保证外环简单、可复现、可自检；战役级示意图够用 |
| 图拉的三面包围 | 按占领窗口判为苏方（德军只绕城东进，未攻城成功） | 图拉从未被攻占；德军绕城的部队由部队符号与路线表示 |
| 莫斯科的最近接近 | 全程判为苏方；战线在该纬度带向西让出 {CLEAR_MAX_KM:.0f} km | 12 月初德军距城约 30 km，战线不切城 |
| 维亚济马、布良斯克合围圈 | 洞的锚点是圈内苏军集团所在的城镇（霍尔姆-日尔科夫斯基、特鲁布切夫斯克），**不是城市本身** | 两城在合围当日即被德军占领，是被围苏军集团的「闭合点」，不属于洞 |
| 霍尔姆-日尔科夫斯基（1942） | 本战役不写洞 | 研究交付的 `front-lines.json` 里的同名圈是 1942 年 7 月「赛德利茨」行动，超出本战役时间窗 |
| 托罗佩茨走廊 | 1942-01-21 起以洞表示苏军突破走廊 | 走廊是南北向窄楔，单值战线无法表达；写成洞后战线与走廊各自正确 |
| 库尔斯克 / 奥廖尔 | 1941-11-03 / 10-03 后判为德军，直到战役终点 | 两城直到 1943 年才被收复 |
| 12 月反攻深度 | 12-16 克林、12-17 加里宁、12-20 沃洛科拉姆斯克、12-30 卡卢加，1 月底抵勒热夫—格扎茨克—尤赫诺夫 | 与 `strat_cmh_counter1/2` 的分期一致 |
| 南翼 51.6°N 以南 | 战线取南端常值外推 | 该带不是莫斯科战役主战场，只作背景 |

## 8. 生成器自检与复现

```bash
cd /Users/yiti/Project/militaryChess
python3 campaigns/moscow-1941/pipeline/make_fronts.py          # 重新生成全部帧 + 自检 + 刷新本文件
python3 campaigns/moscow-1941/pipeline/make_fronts.py --check  # 只自检，不写盘
npx tsx tools/validate/validate.ts --campaign moscow-1941      # 引擎侧校验
node tools/geo/emit_frame.mjs moscow-1941 --check              # 投影一致性
```

- **幂等**：同样的输入产生逐字节相同的 `data/fronts/*.json`，并删除不在清单里的旧帧。
- **几何自检**：每帧检查点数、自相交、洞是否越出外环、**闭合顶点是否落在画布内**（{len(geo_errs)} 项问题）。
- **城市归属自检**：{len(check_rows)} 条断言（§6），{'全部通过' if ok_city else '存在失败项'}。
- **洞自检**：{len(hole_rows)} 处洞（§5），{'全部通过' if ok_hole else '存在失败项'}。
"""


def main():
    args = sys.argv[1:]
    check_only = '--check' in args
    quiet = '--quiet' in args
    fl = load_front_lines()
    frames = build_frames(fl)
    geo_errs, geo_rows = geometry_report(frames)
    model = FieldModel(frames)
    ok_city, check_rows = run_checks(model)
    hole_rows = hole_report(frames, model)
    spur_rows = spur_report(frames, model)
    approach_rows = approach_report(frames)
    bad_approach = [r for r in approach_rows
                    if r['at'] in APPROACH_FRAMES and r['km'] < APPROACH_MIN_KM]

    if not check_only:
        removed = write_fronts(frames)
        if removed and not quiet:
            print(f'删除过期帧：{", ".join(removed)}')
        os.makedirs(os.path.dirname(DOC), exist_ok=True)
        with open(DOC, 'w', encoding='utf-8') as f:
            f.write(render_doc(frames, geo_rows, check_rows, hole_rows, CANVAS, geo_errs, fl))

    bad_city = [r for r in check_rows if not r['ok']]
    bad_hole = [r for r in hole_rows if not r['ok']]
    bad_spur = [r for r in spur_rows if not r['ok']]
    if not quiet:
        print(f'关键帧 {len(frames)} 帧（带洞 {sum(1 for r in geo_rows if r["holes"] > 0)} 帧）；'
              f'洞 {len(hole_rows)} 处；城市断言 {len(check_rows)} 条')
        print(f'画布反算范围 {CANVAS[0]:.2f}—{CANVAS[2]:.2f}°E，{CANVAS[1]:.2f}—{CANVAS[3]:.2f}°N；'
              f'格距 {CELL_KM:.3f} km')
        for e in geo_errs:
            print(f'  ✗ 几何 {e}')
        for r in check_rows:
            print(f"  {'✓' if r['ok'] else '✗'} {r['zh']:<12s} {r['at'][:16]} 期望 {r['want']} "
                  f"实得 {r['got']}  距战线 {r['km']:+.0f} km{'' if r['ok'] else '   ← ' + r['why']}")
        for r in hole_rows:
            print(f"  {'✓' if r['ok'] else '✗'} 洞 {r['name']}：{r['hit']}/{r['total']} 帧锚点在洞内")
        for r in spur_rows:
            print(f"  {'✓' if r['ok'] else '✗'} 突出部 {r['name']}：{r['hit']}/{r['total']} 帧锚点为德军")
    if not quiet:
        for r in approach_rows:
            mark = '  <== 低于下限 %.0f km' % APPROACH_MIN_KM if r['at'] in APPROACH_FRAMES \
                and r['km'] < APPROACH_MIN_KM else ''
            print(f'    距克里姆林宫 {r["at"][:16]}  {r["km"]:6.1f} km{mark}')
    if geo_errs or bad_city or bad_hole or bad_spur or bad_approach:
        msg = f'几何 {len(geo_errs)} 项、城市 {len(bad_city)} 条、洞 {len(bad_hole)} 处、突出部 {len(bad_spur)} 处'
        if bad_approach:
            msg += f'、最近距离 {len(bad_approach)} 帧低于 {APPROACH_MIN_KM:.0f} km'
        print(f'✗ 自检失败：{msg}', file=sys.stderr)
        return 1
    if not quiet:
        print('✓ 自检全部通过')
    return 0


if __name__ == '__main__':
    sys.exit(main())
