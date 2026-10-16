"""北方分区（north）构建工具：轨迹简写、部队/路线/事件构造、地名解析与自检。

用法：各 north_*.py 引入本模块；`python3 north_all.py` 依次生成全部北方数据文件。
轨迹简写：T('7.14 18:00', '@luga', 'engaged', '夺取卢加河桥头', 'rail')
  - 第 1 项时刻：'M.D HH:MM'（1941 年，柏林夏令时）或 'M.D'（缺省 20:00）
  - 第 2 项位置：'@地名' 或 (lon, lat)
  - 其余字符串：状态（active engaged …）、移动方式（rail sea land air）或注记（其他中文）
"""
import json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAMP = os.path.normpath(os.path.join(HERE, '../..'))
DATA = os.path.join(CAMP, 'data')
STATUSES = {'reserve', 'active', 'engaged', 'encircled', 'withdrawing', 'destroyed', 'surrendered', 'interned',
            'disbanded', 'evacuated', 'ineffective', 'inactive'}
TERMINAL = {'destroyed', 'surrendered', 'interned', 'disbanded', 'evacuated', 'ineffective', 'inactive'}
MOVES = {'rail', 'sea', 'land', 'air'}
SPEED = {'infantry': 45, 'mountain': 40, 'border': 45, 'fortress': 30, 'reserve': 45, 'hq': 120, 'artillery': 45,
         'cavalry': 65, 'cavalry_mech': 100, 'light': 100, 'motorized': 100, 'armor': 100, 'naval': 600, 'marine': 45,
         'airborne': 60}
MOVE_SPEED = {'sea': 700, 'rail': 700}


def iso(s):
    """'6.22 03:15' → '1941-06-22T03:15'；'6.22' → 20:00；已是 ISO 的原样返回"""
    if re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$', s):
        return s
    m = re.match(r'^(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$', s.strip())
    if not m:
        raise ValueError('bad time ' + s)
    mo, d = int(m.group(1)), int(m.group(2))
    h, mi = (int(m.group(3)), int(m.group(4))) if m.group(3) else (20, 0)
    return f'1941-{mo:02d}-{d:02d}T{h:02d}:{mi:02d}'


def pos(p):
    if isinstance(p, str):
        assert p.startswith('@'), p
        return p
    return [round(float(p[0]), 3), round(float(p[1]), 3)]


def T(at, p, *rest):
    pt = {'at': iso(at), 'pos': pos(p)}
    for r in rest:
        if r is None:
            continue
        if r in STATUSES:
            pt['status'] = r
        elif r in MOVES:
            pt['movement'] = r
        else:
            pt['note'] = r
    return pt


def track(*pts):
    return [p if isinstance(p, dict) else T(*p) for p in pts]


def name(zh, orig, short):
    return {'zh': zh, 'orig': orig, 'short': short}


def cmd(zh, orig=None):
    c = {'zh': zh}
    if orig:
        c['orig'] = orig
    return c


def unit(id, side, echelon, type, parent, nm, commander=None, track=(), history='', sources=(), confidence='medium',
         model=None, strength=None, equipment=None, active_from=None, display=None):
    u = {'id': id, 'side': side, 'echelon': echelon, 'type': type, 'parent': parent, 'name': nm}
    if commander:
        u['commander'] = commander
    if model:
        u['model'] = model
    if strength:
        u['strength'] = strength
    if equipment:
        u['equipment'] = [{'id': k, 'count': v} if v else {'id': k} for k, v in equipment]
    tr = [p if isinstance(p, dict) else T(*p) for p in track]
    if active_from:
        u['active'] = {'from': iso(active_from)}
    elif tr and tr[0]['at'] > '1941-06-22T03:15':
        u['active'] = {'from': tr[0]['at']}
    u['track'] = tr
    if display:
        u['display'] = display
    u['history'] = history
    u['sources'] = list(sources)
    u['confidence'] = confidence
    return u


# ---------- 地名 ----------
def load_gaz():
    gaz = {}
    gdir = os.path.join(DATA, 'gazetteer')
    for f in sorted(os.listdir(gdir)):
        if f.endswith('.json'):
            try:
                for p in json.load(open(os.path.join(gdir, f), encoding='utf-8')):
                    gaz.setdefault(p['id'], p)
            except Exception:
                pass
    return gaz


def hav(a, b):
    R = 6371.0
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dl = math.radians(b[0] - a[0])
    dp = la2 - la1
    h = math.sin(dp / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def hours(s):
    y, mo, d = int(s[0:4]), int(s[5:7]), int(s[8:10])
    import datetime
    t = datetime.datetime(y, mo, d, int(s[11:13]), int(s[14:16]))
    return (t - datetime.datetime(1941, 6, 22)).total_seconds() / 3600


def resolve(p, gaz):
    if isinstance(p, str):
        g = gaz.get(p[1:])
        if not g:
            raise KeyError('unknown place ' + p)
        return g['pos']
    return p


def check_units(units, gaz, label=''):
    """与校验器相同的速度规则 + 时间递增 + 地名解析，提前在构建时报出"""
    n = 0
    for u in units:
        prev = None
        for i, p in enumerate(u['track']):
            try:
                ll = resolve(p['pos'], gaz)
            except KeyError as e:
                print(f'  ! {u["id"]}.track[{i}]: {e}')
                n += 1
                continue
            h = hours(p['at'])
            if prev:
                ph, pll, pp = prev
                if h <= ph:
                    print(f'  ! {u["id"]}.track[{i}]: 时间未递增 {p["at"]}')
                    n += 1
                days = max((h - ph) / 24, 1 / 24)
                v = hav(pll, ll) / days
                lim = MOVE_SPEED.get(pp.get('movement', ''), SPEED.get(u['type'], 60))
                if v > lim * 1.15:
                    print(f'  ~ {u["id"]}.track[{i}] {p["at"]}: {v:.0f} km/天 > {lim}')
                    n += 1
            prev = (h, ll, p)
            if p.get('status') in TERMINAL and i != len(u['track']) - 1:
                print(f'  ! {u["id"]}.track[{i}]: 终止状态后仍有轨迹点')
    return n


def write(relpath, obj):
    path = os.path.join(CAMP, relpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'wrote {relpath} ({len(obj) if isinstance(obj, list) else 1})')


def registered_models():
    idx = os.path.normpath(os.path.join(CAMP, '../../engine/three/models/index.ts'))
    try:
        src = open(idx, encoding='utf-8').read()
    except Exception:
        return None
    ids = set(re.findall(r"^\s*'?([a-z0-9_]+)'?\s*:\s*\{\s*scheme", src, re.M))
    return ids


# 模型尚未登记时的回退（t34 / kv1 / inf_fi 由 models 代理补充）
MODEL_FALLBACK = {'t34': 'bt7', 'kv1': 't26', 'inf_fi': 'inf_de', 'inf_ro': 'inf_de'}


def fix_models(units):
    reg = registered_models()
    if not reg:
        return
    for u in units:
        m = u.get('model')
        if m and m not in reg and m in MODEL_FALLBACK:
            u['model'] = MODEL_FALLBACK[m]


# ---------- 与战线关键帧对齐（fronts 代理的 data/fronts/*.json） ----------
def _kx(lat):
    return 111.32 * math.cos(math.radians(lat))


def _in_ring(pt, r):
    x, y = pt
    c = False
    n = len(r)
    for i in range(n):
        x1, y1 = r[i]
        x2, y2 = r[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def _in_poly(pt, poly):
    return _in_ring(pt, poly[0]) and not any(_in_ring(pt, h) for h in poly[1:])


def _nearest_on_rings(pt, polys):
    """返回 (距离 km, 最近边界点)"""
    kx, ky = _kx(pt[1]), 110.57
    px, py = pt[0] * kx, pt[1] * ky
    best = (1e9, None)
    for poly in polys:
        for r in poly:
            n = len(r)
            for i in range(n):
                ax, ay = r[i][0] * kx, r[i][1] * ky
                bx, by = r[(i + 1) % n][0] * kx, r[(i + 1) % n][1] * ky
                dx, dy = bx - ax, by - ay
                t = 0.0 if dx == dy == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
                qx, qy = ax + t * dx, ay + t * dy
                d = math.hypot(px - qx, py - qy)
                if d < best[0]:
                    best = (d, (qx / kx, qy / ky))
    return best


def load_fronts(gaz, slots=('DE', 'FI')):
    out = []
    fdir = os.path.join(DATA, 'fronts')
    for f in sorted(os.listdir(fdir)):
        if not f.endswith('.json'):
            continue
        try:
            k = json.load(open(os.path.join(fdir, f), encoding='utf-8'))
        except Exception:
            continue
        polys = []
        for s in slots:
            for poly in k.get('control', {}).get(s, []) or []:
                polys.append([[resolve(p, gaz) for p in ring] for ring in poly])
        out.append((k['at'], polys))
    out.sort()
    return out


def _state_at(u, at):
    """at 时刻的插值位置、生效状态、所在区段（移动方式）"""
    tr = u['track']
    if not tr or at < tr[0]['at']:
        return None, None, None
    st = None
    for p in tr:
        if p['at'] <= at:
            st = p.get('status', st)
    for i in range(len(tr) - 1):
        a, b = tr[i], tr[i + 1]
        if a['at'] <= at <= b['at']:
            return (i, a, b), st, a.get('movement')
    return (len(tr) - 1, tr[-1], None), st, tr[-1].get('movement')


def snap_soviet_to_fronts(units, gaz, min_km=10.0, max_km=70.0, margin_km=6.0, verbose=True):
    """苏军部队（非 encircled、非海运/铁路途中）若在某关键帧时刻落入轴心国控制区超过 min_km，
    在该时刻插入（或改写同一时刻的）轨迹点，把它推到战线外 margin_km 处。超过 max_km 的只报告不改。"""
    fronts = load_fronts(gaz)
    fixed, report = 0, []
    for at, polys in fronts:
        if not polys or at <= '1941-06-22T03:15':
            continue
        h = hours(at)
        for u in units:
            if u['side'] != 'SU' or u['echelon'] in ('front', 'armygroup', 'command') or not u['track']:
                continue
            seg, st, mv = _state_at(u, at)
            if seg is None or st in TERMINAL or st == 'encircled' or mv in ('rail', 'sea'):
                continue
            i, a, b = seg
            pa = resolve(a['pos'], gaz)
            if b is None:
                p = pa
            else:
                pb = resolve(b['pos'], gaz)
                ha, hb = hours(a['at']), hours(b['at'])
                t = 0 if hb == ha else (h - ha) / (hb - ha)
                p = [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]
            if not any(_in_poly(p, poly) for poly in polys):
                continue
            d, q = _nearest_on_rings(p, polys)
            if d < min_km:
                continue
            if d > max_km:
                report.append(f'{at} {u["id"]} 深入轴心国控制区 {d:.0f} km（未自动修正）')
                continue
            kx = _kx(p[1])
            vx, vy = (q[0] - p[0]) * kx, (q[1] - p[1]) * 110.57
            nrm = math.hypot(vx, vy) or 1
            newp = None
            for extra in (margin_km, margin_km * 2, margin_km * 4):
                cand = [q[0] + vx / nrm * extra / kx, q[1] + vy / nrm * extra / 110.57]
                if not any(_in_poly(cand, poly) for poly in polys):
                    newp = cand
                    break
            if not newp:
                report.append(f'{at} {u["id"]} 无法推出控制区')
                continue
            newp = [round(newp[0], 3), round(newp[1], 3)]
            # 同一时刻已有点则改写位置，否则插入
            hit = next((x for x in u['track'] if x['at'] == at), None)
            if hit:
                hit['pos'] = newp
                hit.setdefault('note', '') if False else None
            else:
                npnt = {'at': at, 'pos': newp}
                u['track'].insert(i + 1, npnt)
            fixed += 1
    if verbose:
        print(f'  战线对齐：修正 {fixed} 处', *(['\n  ' + r for r in report] if report else []))
    return fixed, report


# 1940 年莫斯科和约后的芬苏边界（粗略折线，自芬兰湾向北）；其西/北为芬兰本土
FI_BORDER_1940 = [(27.75, 60.53), (28.35, 60.85), (28.95, 61.12), (29.40, 61.35), (29.60, 61.48), (29.90, 61.72),
                  (30.35, 61.98), (30.75, 62.18), (31.25, 62.45), (31.55, 62.90), (31.60, 63.50)]


def _fi_home(p):
    x, y = p
    if y < 60.45:
        return x < 27.0 and y > 59.7   # 汉科前线（芬兰本土一侧）
    for (x1, y1), (x2, y2) in zip(FI_BORDER_1940, FI_BORDER_1940[1:]):
        if y1 <= y <= y2:
            bx = x1 + (x2 - x1) * (y - y1) / (y2 - y1)
            return x < bx
    return y > 63.5


def _de_home(p):
    # 东普鲁士与梅梅尔地区（开战前德国领土），粗略
    return (p[0] < 22.90 and p[1] < 55.30) or (p[0] < 21.30 and p[1] < 55.95)


def snap_axis_to_fronts(units, gaz, min_km=12.0, max_km=60.0, margin_km=5.0, verbose=True):
    """轴心国部队若在关键帧时刻位于苏方控制区（不在本土）超过 min_km，把位置拉回到控制区内 margin_km 处。"""
    fronts = load_fronts(gaz)
    fixed, report = 0, []
    for at, polys in fronts:
        if not polys or at < '1941-06-23T00:00':
            continue
        h = hours(at)
        for u in units:
            if u['side'] not in ('DE', 'FI') or u['echelon'] in ('front', 'armygroup', 'command') or not u['track']:
                continue
            seg, st, mv = _state_at(u, at)
            if seg is None or st in TERMINAL or mv in ('rail', 'sea'):
                continue
            i, a, b = seg
            pa = resolve(a['pos'], gaz)
            if b is None:
                p = pa
            else:
                pb = resolve(b['pos'], gaz)
                ha, hb = hours(a['at']), hours(b['at'])
                t = 0 if hb == ha else (h - ha) / (hb - ha)
                p = [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]
            if _de_home(p) or _fi_home(p) or p[1] > 61.9 and p[0] > 32.5 and u['side'] == 'FI' and False:
                continue
            if any(_in_poly(p, poly) for poly in polys):
                continue
            d, q = _nearest_on_rings(p, polys)
            if d < min_km:
                continue
            if d > max_km:
                report.append(f'{at} {u["id"]} 位于苏方控制区 {d:.0f} km（未自动修正）')
                continue
            kx = _kx(p[1])
            vx, vy = (q[0] - p[0]) * kx, (q[1] - p[1]) * 110.57
            nrm = math.hypot(vx, vy) or 1
            newp = None
            for extra in (margin_km, margin_km * 2, margin_km * 4):
                cand = [q[0] + vx / nrm * extra / kx, q[1] + vy / nrm * extra / 110.57]
                if any(_in_poly(cand, poly) for poly in polys):
                    newp = cand
                    break
            if not newp:
                report.append(f'{at} {u["id"]} 无法拉回控制区')
                continue
            newp = [round(newp[0], 3), round(newp[1], 3)]
            hit = next((x for x in u['track'] if x['at'] == at), None)
            if hit:
                hit['pos'] = newp
            else:
                u['track'].insert(i + 1, {'at': at, 'pos': newp})
            fixed += 1
    if verbose:
        print(f'  战线对齐（轴心国）：修正 {fixed} 处', *(['\n  ' + r for r in report] if report else []))
    return fixed, report
