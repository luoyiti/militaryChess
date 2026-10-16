"""南翼数据构建入口：python3 campaigns/barbarossa-1941/pipeline/build/south_build.py

输出：data/oob/south_de.json south_su.json ro.json hu.json it.json sk.json、data/routes/south.json、
data/gazetteer/south.json、data/sources/south.json、pipeline/events/south.json，并做速度与引用自检。
"""
import importlib, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import south_lib as L
import south_places  # noqa: F401  注册地名
from south_sources import SOURCES


def opt(mod, fn='build'):
    try:
        m = importlib.import_module(mod)
    except ModuleNotFoundError as e:
        if e.name == mod:
            return []
        raise
    return getattr(m, fn)()


SPEED = {'infantry': 45, 'mountain': 40, 'hq': 120, 'cavalry': 65, 'cavalry_mech': 100, 'motorized': 100, 'armor': 100,
         'fortress': 30, 'border': 45, 'reserve': 45, 'artillery': 45, 'marine': 45, 'airborne': 45, 'naval': 600, 'light': 100}
MOVE = {'rail': 700, 'sea': 700, 'air': 9000}


def selfcheck(units, routes, events):
    ids = {u['id'] for u in units}
    warn = []
    for u in units:
        prev = None
        for i, p in enumerate(u['track']):
            ll = L.coords(p['pos'][1:]) if isinstance(p['pos'], str) else p['pos']
            h = L.iso_h(p['at']) if hasattr(L, 'iso_h') else None
            if prev:
                ph, pll, pmv = prev
                days = max((h - ph) / 24, 1 / 24)
                v = L.hav(pll, ll) / days
                lim = MOVE.get(pmv or '', SPEED.get(u['type'], 60))
                if v > lim * 1.15:
                    warn.append(f"速度 {u['id']}[{i}] {p['at']} {v:.0f} km/天 > {lim}")
                if h <= ph:
                    warn.append(f"时间不递增 {u['id']}[{i}] {p['at']}")
            prev = (h, ll, p.get('movement'))
    for r in routes:
        if r['unit'] not in ids:
            warn.append(f"路线 {r['id']} 部队 {r['unit']} 不在南翼文件中（需他人提供）")
    for e in events:
        n = len(e['body'])
        if n < 80 or n > 140:
            warn.append(f"事件 {e['id']} 正文 {n} 字")
        for uid in e.get('units', []):
            if uid not in ids:
                warn.append(f"事件 {e['id']} 引用非南翼部队 {uid}")
    return warn


def main():
    de = opt('south_de_hq') + opt('south_de_div')
    su = opt('south_su_hq') + opt('south_su_div')
    ro = opt('south_ro')
    hu = opt('south_hu')
    it = opt('south_it')
    sk = opt('south_sk')
    routes = opt('south_routes')
    events = opt('south_events')
    D = L.DATA
    L.dump(os.path.join(D, 'oob', 'south_de.json'), de)
    L.dump(os.path.join(D, 'oob', 'south_su.json'), su)
    for name, arr in (('ro', ro), ('hu', hu), ('it', it), ('sk', sk)):
        L.dump(os.path.join(D, 'oob', f'{name}.json'), arr)
    L.dump(os.path.join(D, 'routes', 'south.json'), routes)
    L.dump(os.path.join(D, 'gazetteer', 'south.json'), L.gazetteer_out())
    L.dump(os.path.join(D, 'sources', 'south.json'), SOURCES)
    L.dump(os.path.join(L.CAMP, 'pipeline', 'events', 'south.json'), sorted(events, key=lambda e: e['at']))
    units = de + su + ro + hu + it + sk
    w = selfcheck(units, routes, events)
    print(f'部队 {len(units)}（DE {len(de)} · SU {len(su)} · RO {len(ro)} · HU {len(hu)} · IT {len(it)} · SK {len(sk)}）'
          f' 路线 {len(routes)} 事件 {len(events)} 地名 {len(L.gazetteer_out())}')
    for x in w:
        print('  ', x)


if __name__ == '__main__':
    main()
