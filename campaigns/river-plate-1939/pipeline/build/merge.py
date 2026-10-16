"""整合：pipeline/units.json + pipeline/tracks/*.json → data/oob/<阵营>.json；pipeline/events/*.json → data/events.json。
各数据代理只写自己的 tracks/<区段>.json 与 events/<区段>.json（{部队 id: [轨迹点…]} 与 HistEvent[]），同一部队的轨迹按时间合并。
运行：python3 campaigns/river-plate-1939/pipeline/build/merge.py"""
import json, os, sys, glob
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
load = lambda p: json.load(open(p, encoding='utf-8'))
def dump(p, obj):
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, indent=1); f.write('\n')

units = load(P('pipeline/units.json'))
ids = {u['id'] for u in units}
tracks = {}
for f in sorted(glob.glob(P('pipeline/tracks/*.json'))):
    for uid, pts in load(f).items():
        if uid.startswith('_'): continue
        if uid not in ids: sys.exit(f'✗ {os.path.basename(f)}: 部队 {uid} 不在 pipeline/units.json')
        for p in pts: p['_src'] = os.path.basename(f)
        tracks.setdefault(uid, []).extend(pts)
warn = []
for u in units:
    pts = sorted(tracks.get(u['id'], []) + u.get('track', []), key=lambda p: p['at'])
    out = []
    for p in pts:
        if out and out[-1]['at'] == p['at']:
            warn.append(f"{u['id']} {p['at']}: {out[-1].get('_src')} 与 {p.get('_src')} 时刻重复，保留后者")
            out[-1] = p; continue
        out.append(p)
    last = None
    for p in out:
        p.pop('_src', None)
        if p.get('status') == last: p.pop('status')
        elif 'status' in p: last = p['status']
    u['track'] = out
by_side = {}
for u in units: by_side.setdefault(u['side'].lower(), []).append(u)
for f in glob.glob(P('data/oob/*.json')):
    if os.path.basename(f)[:-5] not in by_side: os.remove(f)
for side, us in by_side.items(): dump(P('data/oob', side + '.json'), us)
events = []
for f in sorted(glob.glob(P('pipeline/events/*.json'))): events.extend(load(f))
seen = set()
for e in events:
    if e['id'] in seen: sys.exit(f"✗ 事件 id 重复 {e['id']}")
    seen.add(e['id'])
events.sort(key=lambda e: (e['at'], -e.get('importance', 3)))
if events: dump(P('data/events.json'), events)
for w in warn: print('  WARN', w)
print(f'✓ 部队 {len(units)}（{", ".join(f"{k} {len(v)}" for k, v in by_side.items())}） · 轨迹点 {sum(len(u["track"]) for u in units)} · 事件 {len(events)}')
