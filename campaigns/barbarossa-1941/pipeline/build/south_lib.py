"""南翼（south 代理）数据构建公共库。

用法：python3 campaigns/barbarossa-1941/pipeline/build/south_build.py
- 时间写作 'M.D' 或 'M.D/HH:MM'（柏林时间，1941 年），缺省 20:00。
- 位置写作本地地名键（P 表；若在 core 或 south 地名库中则输出 '@id'，否则输出坐标）、
  [lon, lat]，或 near('kiev', dlon, dlat)。
- 状态缩写：a active · e engaged · c encircled · w withdrawing · r reserve ·
  D destroyed · S surrendered · I ineffective · X disbanded · V evacuated · N inactive
"""
import json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
CAMP = os.path.abspath(os.path.join(HERE, '..', '..'))
DATA = os.path.join(CAMP, 'data')

CORE = {p['id']: p for p in json.load(open(os.path.join(DATA, 'gazetteer', 'core.json'), encoding='utf-8'))}
# 其他代理的地名库（同 id 直接引用，不重复发布）
OTHER = {}
for _f in sorted(os.listdir(os.path.join(DATA, 'gazetteer'))):
    if _f.endswith('.json') and _f not in ('core.json', 'south.json'):
        try:
            for _p in json.load(open(os.path.join(DATA, 'gazetteer', _f), encoding='utf-8')):
                OTHER.setdefault(_p['id'], _p)
        except Exception:
            pass

STATUS = {'a': 'active', 'e': 'engaged', 'c': 'encircled', 'w': 'withdrawing', 'r': 'reserve',
          'D': 'destroyed', 'S': 'surrendered', 'I': 'ineffective', 'X': 'disbanded', 'V': 'evacuated', 'N': 'inactive'}

# ---------------------------------------------------------------------------
# 本地地名表：key -> (lon, lat, zh, orig, kind, rank, country, publish?)
# publish=True 的条目写入 data/gazetteer/south.json（core 已有的不重复）。
# ---------------------------------------------------------------------------
PLACES = {}


def place(key, lon, lat, zh=None, orig=None, kind='town', rank=4, country='SU', pub=False, alt=None):
    PLACES[key] = dict(lon=lon, lat=lat, zh=zh, orig=orig, kind=kind, rank=rank, country=country, pub=pub, alt=alt)


def near(key, dlon=0.0, dlat=0.0):
    lon, lat = coords(key)
    return [round(lon + dlon, 3), round(lat + dlat, 3)]


def coords(key):
    if isinstance(key, (list, tuple)):
        return float(key[0]), float(key[1])
    if key in PLACES:
        p = PLACES[key]
        return p['lon'], p['lat']
    if key in CORE:
        return tuple(CORE[key]['pos'])
    if key in OTHER:
        return tuple(OTHER[key]['pos'])
    raise KeyError(f'未知地名键 {key}')


def mid(a, b, f=0.5):
    (x1, y1), (x2, y2) = coords(a), coords(b)
    return [round(x1 + (x2 - x1) * f, 3), round(y1 + (y2 - y1) * f, 3)]


def pos_out(key):
    if isinstance(key, (list, tuple)):
        return [round(float(key[0]), 3), round(float(key[1]), 3)]
    if key in CORE:
        return '@' + key
    if key in OTHER and (key not in PLACES or hav(OTHER[key]['pos'], (PLACES[key]['lon'], PLACES[key]['lat'])) < 3):
        return '@' + key
    if key in PLACES:
        p = PLACES[key]
        if p['pub']:
            return '@' + key
        return [round(p['lon'], 3), round(p['lat'], 3)]
    raise KeyError(f'未知地名键 {key}')


TRE = re.compile(r'^(\d{1,2})\.(\d{1,2})(?:/(\d{1,2}):(\d{2}))?$')


def iso(t):
    m = TRE.match(t)
    if not m:
        raise ValueError(f'时间格式错误 {t}')
    mo, d, h, mi = int(m.group(1)), int(m.group(2)), m.group(3), m.group(4)
    h = int(h) if h is not None else 20
    mi = int(mi) if mi is not None else 0
    return f'1941-{mo:02d}-{d:02d}T{h:02d}:{mi:02d}'


def track(*pts):
    out = []
    for p in pts:
        t, pos = p[0], p[1]
        st = p[2] if len(p) > 2 else None
        note = p[3] if len(p) > 3 else None
        mv = p[4] if len(p) > 4 else None
        q = {'at': iso(t), 'pos': pos_out(pos)}
        if st:
            q['status'] = STATUS.get(st, st)
        if note:
            q['note'] = note
        if mv:
            q['movement'] = mv
        out.append(q)
    return out


def unit(uid, side, echelon, typ, parent, zh, orig, short, cmd=None, men=None, tanks=None, guns=None,
         model=None, equip=None, frm=None, trk=(), hist='', src=('kirchubel_ag',), conf='medium', display=None):
    u = {'id': uid, 'side': side, 'echelon': echelon, 'type': typ, 'parent': parent,
         'name': {'zh': zh, 'orig': orig, 'short': short}}
    if cmd:
        u['commander'] = {'zh': cmd[0], 'orig': cmd[1]}
    st = {}
    if men: st['men'] = men
    if tanks: st['tanks'] = tanks
    if guns: st['guns'] = guns
    if st: u['strength'] = st
    if equip:
        u['equipment'] = [{'id': k, 'count': v} if v else {'id': k} for k, v in equip]
    if model:
        u['model'] = model
    if frm:
        u['active'] = {'from': iso(frm)}
    u['track'] = track(*trk) if trk else []
    if display:
        u['display'] = display
    u['history'] = hist
    u['sources'] = list(src)
    u['confidence'] = conf
    return u


def hav(a, b):
    (lon1, lat1), (lon2, lat2) = a, b
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def gazetteer_out(sources=('south_wiki_places',)):
    out = []
    for k, p in PLACES.items():
        if not p['pub'] or k in CORE or k in OTHER:
            continue
        e = {'id': k, 'zh': p['zh'], 'orig': p['orig']}
        if p['alt']:
            e['alt'] = p['alt']
        e.update({'pos': [round(p['lon'], 3), round(p['lat'], 3)], 'kind': p['kind'], 'rank': p['rank'], 'country': p['country'],
                  'sources': list(sources)})
        out.append(e)
    return out


def iso_h(s):
    import datetime as _dt
    d = _dt.datetime.strptime(s, '%Y-%m-%dT%H:%M')
    return (d - _dt.datetime(1941, 6, 22)).total_seconds() / 3600.0


def detrack(u, dx=0.0, dy=0.0, since=None, until=None, notes=False):
    """把已构建部队的轨迹转回元组（可平移），用于下属师沿用军的推进路线。since/until 为 'M.D' 字符串（含端点）。"""
    import datetime as _dt
    def key(t):
        m = TRE.match(t)
        return iso(t)
    lo = iso(since) if since else None
    hi = iso(until) if until else None
    out = []
    for p in u['track']:
        if lo and p['at'] < lo: continue
        if hi and p['at'] > hi: continue
        d = _dt.datetime.strptime(p['at'], '%Y-%m-%dT%H:%M')
        t = f'{d.month}.{d.day}/{d.hour:02d}:{d.minute:02d}'
        ll = coords(p['pos'][1:]) if isinstance(p['pos'], str) else p['pos']
        tup = [t, [round(ll[0] + dx, 3), round(ll[1] + dy, 3)], p.get('status')]
        if notes and p.get('note'): tup.append(p['note'])
        out.append(tuple(tup))
    return out
