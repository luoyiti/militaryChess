"""center 代理的数据构建辅助函数（中央地段）。

轨迹用紧凑文本 DSL 书写，每行一个航点：
    MM-DD HH:MM | 位置 | 状态 | 注记 | 移动方式
位置：'@placeId' 或 'lon,lat'；状态/注记/移动方式可省略或留空。时间为柏林时间（CEST）。
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CAMP = os.path.normpath(os.path.join(HERE, '..', '..'))
YEAR = 1941

STATUSES = {'reserve', 'active', 'engaged', 'encircled', 'withdrawing', 'destroyed', 'surrendered',
            'interned', 'disbanded', 'evacuated', 'ineffective', 'inactive'}
MOVES = {'land', 'sea', 'air', 'rail'}


def iso(s):
    """'06-22 03:15' / '06-22' → '1941-06-22T03:15'（缺省 12:00）"""
    s = s.strip()
    m = re.match(r'^(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$', s)
    if not m:
        raise ValueError(f'bad time {s!r}')
    mo, d, h, mi = m.group(1), m.group(2), m.group(3) or '12', m.group(4) or '00'
    return f'{YEAR}-{mo}-{d}T{int(h):02d}:{mi}'


def pos(s):
    s = s.strip()
    if s.startswith('@'):
        return s
    a, b = s.split(',')
    return [round(float(a), 3), round(float(b), 3)]


def track(text):
    out = []
    for raw in text.strip().splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = [p.strip() for p in line.split('|')]
        while len(parts) < 5:
            parts.append('')
        t, p, st, note, mv = parts[:5]
        pt = {'at': iso(t), 'pos': pos(p)}
        if st:
            if st not in STATUSES:
                raise ValueError(f'bad status {st!r} in {line!r}')
            pt['status'] = st
        if note:
            pt['note'] = note
        if mv:
            if mv not in MOVES:
                raise ValueError(f'bad movement {mv!r} in {line!r}')
            pt['movement'] = mv
        out.append(pt)
    return out


def unit(id, side, echelon, type, parent, zh, orig, short, cmd=None, men=None, tanks=None, guns=None,
         eq=None, model=None, active_from=None, tr='', hist='', src=None, conf='medium', display=None):
    u = {'id': id, 'side': side, 'echelon': echelon, 'type': type, 'parent': parent,
         'name': {'zh': zh, 'orig': orig, 'short': short}}
    if cmd:
        u['commander'] = {'zh': cmd[0], 'orig': cmd[1]}
    st = {}
    if men:
        st['men'] = men
    if tanks:
        st['tanks'] = tanks
    if guns:
        st['guns'] = guns
    if st:
        u['strength'] = st
    if eq:
        u['equipment'] = [{'id': e[0], 'count': e[1]} if len(e) > 1 and e[1] else {'id': e[0]} for e in eq]
    if model:
        u['model'] = model
    t = track(tr) if tr else []
    if active_from:
        u['active'] = {'from': iso(active_from)}
    elif t and t[0]['at'] > '1941-06-22T03:15':
        # 晚到的部队：active.from 与首个航点一致
        u['active'] = {'from': t[0]['at']}
    u['track'] = t
    if display:
        u['display'] = display
    if hist:
        u['history'] = hist
    u['sources'] = src or ['wiki_barbarossa_oob']
    u['confidence'] = conf
    return u


def write(rel, data):
    path = os.path.join(CAMP, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'wrote {rel}: {len(data)} items')


def load_gaz():
    import glob
    g = {}
    for fn in sorted(glob.glob(os.path.join(CAMP, 'data', 'gazetteer', '*.json'))):
        for p in json.load(open(fn, encoding='utf-8')):
            g.setdefault(p['id'], p['pos'])
    return g
