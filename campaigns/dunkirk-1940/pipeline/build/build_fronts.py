"""生成 data/fronts/*.json（德军控制区关键帧）。

    sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/build_fronts.py

模型（见 docs/CONTRACT.md §4）：槽 A「DE」= 德军控制区。
1940-05-26 时，本图幅内除「佛兰德桥头堡」（自格拉沃利讷沿 Aa 运河—利斯河—斯海尔德河
围出的滨海佛兰德）以外的比、法陆地都已在德军手中。因此每个关键帧给出**一个不自交的外环**：
一个包住整幅画布的大矩形，在上边缘（北海一侧）向下「咬」出一块缺口 —— 缺口即以当日战线
为界的桥头堡。引擎把占领区裁剪到战区陆地（比利时 + 法国本土），英国与海峡不会着色；
荷兰（掩膜比特 1）是槽 A 的本土比特，自动并入德军控制区。

战线锚点全部用 data/gazetteer/places.json 的 id（`@id`），本脚本在生成时用 shapely
把 `@id` 解析成经纬度、检查环的自交与有效性，并逐帧核对「哪些地方必须在德军控制区内、
哪些必须在桥头堡内」，避免把坏几何写进数据。

时刻与界线依 docs/CONTRACT.md §4。
"""
from __future__ import annotations

import json
import os
import sys

from shapely.geometry import LinearRing, Point, Polygon

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
CDIR = os.path.join(ROOT, 'campaigns/dunkirk-1940')
OUT = os.path.join(CDIR, 'data/fronts')
GAZ = json.load(open(os.path.join(CDIR, 'data/gazetteer/places.json'), encoding='utf-8'))
POS = {p['id']: tuple(p['pos']) for p in GAZ}

SRC = ['ellis_1953', 'frieser_2005', 'guderian_ktb', 'kleist_ktb', 'hyperwar_dunkirk', 'sebag_2006']

# 包住画布 bbox [0.55, 49.92, 4.62, 51.85] 并留出余量的大矩形
W, S, E, N = -1.6, 48.3, 6.6, 52.9
# 缺口西缘相对战线最西锚点的偏移：略向西，使最西锚点本身落在缺口的岸线上
WEST_DX = -0.07
# 缺口东缘相对战线最东锚点的偏移：略向东，使缺口在斯海尔德河口以外收口
EAST_DX = 0.42

# 每帧的内/外点核对：CHECK_INSIDE 必须在德军控制区内；CHECK_OUTSIDE 必须在桥头堡（缺口）内
CHECK_INSIDE = ['lille', 'arras', 'saint_quentin', 'cambrai', 'mons', 'brussel', 'antwerpen']
CHECK_OUTSIDE = ['dunkirk', 'dunkirk_port', 'malo_les_bains', 'la_panne', 'bray_dunes', 'nieuwpoort']

# 缺口边缘的修正点（字面经纬度）：用来绕开仍在盟军手里的据点，使它们留在缺口（桥头堡）内。
#   加来：1940-05-26T18:00 之前仍在围城中 → 战线在其南侧绕行
CAL_POCKET = [[1.72, 51.03], [1.87, 50.90]]
#   卡塞尔（2.487, 50.801）：1940-05-29 夜陷落之前仍在盟军手中 → 战线在其南侧绕行
CASSEL_POCKET = [[2.42, 50.775], [2.57, 50.755]]
CASSEL_POCKET_W = [[2.36, 50.775]] + CASSEL_POCKET
#   贝尔格（2.433, 50.969）：1940-06-02 夜陷落之前仍在盟军手中 → 战线在其南侧绕行
BERGUES_POCKET = [[2.40, 50.915], [2.50, 50.925]]

# ---------- 关键帧表：front = 当日战线，自加来海峡（西）向斯海尔德河口（东）依次书写 ----------
FRAMES: list[dict] = [
    dict(at='1940-05-26T00:00', note='开战：装甲部队止步于 Aa 运河—利斯河一线，加来仍在围城中',
         front=CAL_POCKET + ['gravelines', 'saint_omer', 'aire_sur_la_lys', 'estaires', 'armentieres',
                             'menen', 'kortrijk', 'oudenaarde', 'gent', 'terneuzen'],
         outside=['calais', 'dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-26T16:00', note='加来守军 16:00 前后投降，加来口袋消失；战线未动',
         front=['gravelines', 'saint_omer', 'aire_sur_la_lys', 'estaires', 'armentieres', 'menen',
                'kortrijk', 'oudenaarde', 'gent', 'terneuzen'],
         inside=['calais'],
         outside=['dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium',
         # 口袋陷落是突变：用 step 过渡，避免与上一帧之间线性插值把加来提前「染成」德军
         transition='step'),
    dict(at='1940-05-27T12:00', note='利斯河防线被突破，德军向卡塞尔—黑山推进',
         front=['gravelines', 'bollezeele'] + CASSEL_POCKET + ['mont_des_cats', 'bailleul', 'menen',
                'kortrijk', 'waregem', 'deinze', 'gent', 'terneuzen'],
         outside=['cassel', 'dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-28T06:00', note='比利时军 04:00 停止抵抗；德军进入伊珀尔、波珀灵厄',
         front=['bourbourg', 'bollezeele'] + CASSEL_POCKET + ['poperinge', 'ieper', 'kortrijk',
                'waregem', 'deinze', 'gent', 'terneuzen'],
         outside=['cassel', 'dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-28T23:00', note='英军退入敦刻尔克桥头堡（运河线）；卡塞尔仍在盟军手中',
         front=['bourbourg', 'spycker'] + CASSEL_POCKET + ['vlamertinge', 'ieper', 'tielt', 'deinze',
                'gent', 'terneuzen'],
         outside=['cassel', 'dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-29T12:00', note='卡塞尔当夜陷落；桥头堡收缩到贝尔格—弗尔讷运河一线',
         front=['cappelle_la_grande'] + CASSEL_POCKET_W + ['spycker', 'vlamertinge', 'ieper',
                'tielt', 'deinze', 'gent', 'terneuzen'],
         outside=['cassel', 'dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-30T12:00', note='卡塞尔与格拉沃利讷失守；德军试探桥头堡，利斯运河一线反复争夺',
         front=['bourbourg', 'spycker', 'cassel', 'veurne', 'diksmuide', 'tielt', 'deinze',
                'gent', 'terneuzen'],
         outside=['dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-05-31T12:00', note='里尔法军 35,000 人投降；桥头堡仍据守运河线',
         front=['bourbourg', 'spycker', 'bergues', 'veurne', 'diksmuide', 'tielt', 'deinze',
                'gent', 'terneuzen'],
         outside=['dunkirk', 'la_panne', 'oostende', 'brugge'],
         confidence='medium'),
    dict(at='1940-06-01T12:00', note='德军猛攻贝尔格；东段退向尼乌波特—拉帕讷',
         front=['loon_plage', 'grande_synthe', 'spycker'] + BERGUES_POCKET + ['ghyvelde', 'adinkerke',
                'nieuwpoort', 'oostende', 'brugge', 'eeklo', 'terneuzen'],
         outside=['bergues', 'dunkirk', 'la_panne'],
         confidence='medium'),
    dict(at='1940-06-02T22:00', note='贝尔格 2 日夜陷落；桥头堡只剩敦刻尔克近郊与海岸带',
         front=['loon_plage', 'armbouts_cappel', 'hoymille', 'uxem',
                'bray_dunes', 'la_panne', 'nieuwpoort', 'oostende', 'brugge', 'eeklo', 'terneuzen'],
         outside=['dunkirk', 'tetegham', 'la_panne'],
         confidence='medium',
         transition='step'),
    dict(at='1940-06-03T12:00', note='桥头堡压缩到城郊；夜航撤出法军',
         front=['loon_plage', 'fort_mardyck', 'saint_pol', 'coudekerque', 'tetegham', 'uxem',
                'bray_dunes', 'la_panne', 'nieuwpoort', 'oostende', 'brugge', 'eeklo', 'terneuzen'],
         outside=['dunkirk', 'dunkirk_port', 'la_panne'],
         confidence='medium'),
    dict(at='1940-06-04T10:00', note='法军 09:00 投降；德军进占敦刻尔克与港区，桥头堡消失',
         transition='step',
         front=[],
         inside=['dunkirk', 'dunkirk_port', 'malo_les_bains', 'bergues', 'gravelines', 'la_panne',
                 'nieuwpoort', 'oostende', 'brugge'],
         confidence='high'),
]


def coord(pt) -> tuple[float, float]:
    """锚点可以是地名 id（str）或字面经纬度（[lon, lat]）。"""
    return tuple(POS[pt]) if isinstance(pt, str) else (float(pt[0]), float(pt[1]))


def label(pt) -> str:
    return '@' + pt if isinstance(pt, str) else f'{pt[0]},{pt[1]}'


def _ends(front: list) -> tuple[tuple[float, float], tuple[float, float]]:
    """缺口的两缘：取战线 x 的极值再外扩，保证缺口始终包住整条战线（不会与外环相交）。"""
    pts = [coord(a) for a in front]
    return (min(p[0] for p in pts) + WEST_DX, N), (max(p[0] for p in pts) + EAST_DX, N)


def ordered(front: list) -> list:
    """战线是一条自西向东的界线：按经度排序，避免手动书写顺序造成的折返与自交。"""
    return sorted(front, key=lambda a: coord(a)[0])


def ring_coords(front: list[str]) -> list[list]:
    """外环（`@id` 与经纬度混合）：大矩形 → 缺口东缘 → 战线（自东向西）→ 缺口西缘 → 左上。"""
    if not front:  # 无缺口：整幅矩形
        return [[W, S], [E, S], [E, N], [W, N]]
    front = ordered(front)
    west, east = _ends(front)
    coords: list[list] = [[W, S], [E, S], [E, N], list(east)]
    coords += [label(a) if isinstance(a, str) else list(coord(a)) for a in reversed(front)]
    coords += [list(west), [W, N]]
    return coords


def numeric_ring(front: list) -> list[tuple[float, float]]:
    if not front:
        return [(W, S), (E, S), (E, N), (W, N), (W, S)]
    west, east = _ends(front)
    return [(W, S), (E, S), (E, N), east] + list(reversed([coord(a) for a in front])) + [west, (W, N), (W, S)]


def validate(fr: dict) -> None:
    front, where = fr['front'], fr['at']
    front = ordered(front)
    ring = numeric_ring(front)
    lr = LinearRing(ring)
    if not lr.is_simple:
        raise SystemExit(f'✗ {where}: 外环自交')
    poly = Polygon(ring)
    if not poly.is_valid or poly.area <= 0:
        raise SystemExit(f'✗ {where}: 多边形无效（area={poly.area:.4f}）')
    xs = [coord(a)[0] for a in front]
    for i in range(1, len(xs)):
        if xs[i] < xs[i - 1] - 1e-9:
            raise SystemExit(f'✗ {where}: 战线锚点 {label(front[i])} 相对 {label(front[i - 1])} 西移（x 不单调）')
    for cid in CHECK_INSIDE + fr.get('inside', []):
        if cid in POS and not poly.contains(Point(POS[cid])):
            raise SystemExit(f'✗ {where}: {cid} 未落在德军控制区内')
    if front:  # front 为空 = 桥头堡已消失，全境归德军，此时不再检查「必须在缺口内」
        for cid in CHECK_OUTSIDE + fr.get('outside', []):
            if cid in POS and poly.contains(Point(POS[cid])):
                raise SystemExit(f'✗ {where}: {cid} 落在德军控制区内（应为桥头堡或英方领土）')


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(os.listdir(OUT)):
        if f.endswith('.json'):
            os.remove(os.path.join(OUT, f))
    for fr in FRAMES:
        validate(fr)
        coords = ring_coords(fr['front'])
        obj = {
            'at': fr['at'],
            'control': {'DE': [[coords]]},
            'note': fr['note'],
            **({'transition': fr['transition']} if fr.get('transition') else {}),
            'sources': SRC,
            'confidence': fr['confidence'],
        }
        name = fr['at'].replace(':', '-') + '.json'
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
            json.dump(obj, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
        print(f'  {name}  {len(coords):2d} 顶点  {fr["note"]}')
    print(f'✓ {len(FRAMES)} 个控制区关键帧 → {os.path.relpath(OUT, ROOT)}（不自交、有效性、内外点全部通过）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
