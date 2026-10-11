#!/usr/bin/env python3
"""Combine independently authored mainland/Crete data without retaining France fragments."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'src/data'

def read(p):
    return json.loads(p.read_text())

def write(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n')

def unique(items, kind):
    out = {}
    for item in items:
        key = item['id']
        if key in out and out[key] != item:
            raise ValueError(f'conflicting {kind} id: {key}')
        out[key] = item
    return list(out.values())

parts = [read(DATA / 'fragments' / f'{name}.json') for name in ['mainland', 'crete']]
for name in ['events', 'pockets', 'equipment']:
    items = unique([item for part in parts for item in part.get(name, [])], name)
    if name == 'events':
        items.sort(key=lambda e: (e['at'], e['importance'], e['id']))
    write(DATA / f'{name}.json', items)
write(DATA / 'demarcation.json', [])
force = {'sides': {}, 'byPhase': {}, 'sources': []}
for i, part in enumerate(parts):
    f = part.get('forces', {})
    if i == 0: force['sides'].update(f.get('sides', {}))
    force['byPhase'].update(f.get('byPhase', {}))
    force['sources'] += f.get('sources', [])
force['sources'] = list(dict.fromkeys(force['sources']))
write(DATA / 'forces_summary.json', force)

# Repeated runs are stable: islandDE retains the authored island-only polygon list.
files = sorted((DATA / 'fronts').glob('*.json'))
mainland = [read(p) for p in files if read(p)['at'] < '1941-05-20T00:00']
if not mainland:
    raise ValueError('mainland control frames must be generated first')
base = mainland[-1]
for p in files:
    frame = read(p)
    if frame['at'] >= '1941-05-20T00:00':
        island = frame.get('islandDE', frame['DE'])
        frame['islandDE'] = island
        frame['DE'] = base['DE'] + island
        frame['sources'] = list(dict.fromkeys(base['sources'] + frame['sources']))
        write(p, frame)
write(ROOT / 'config/keyframes.json', {'_doc': '巴尔干控制区关键帧，统一绘图时间 UTC+2。', 'keyframes': [read(p)['at'] for p in files]})

manifest = ROOT / '.work/crete-assets.json'
if manifest.exists():
    assets = read(manifest)
    # Both dictionary and list authoring forms are supported at this integration boundary.
    photos = assets.get('photos', [])
    index = read(ROOT / 'public/photos/index.json')
    if isinstance(photos, dict):
        index.update(photos)
    else:
        for ph in photos:
            key = ph.get('commons', ph.get('file', ''))
            if key and not key.startswith('File:'):
                key = 'File:' + key
            if key:
                index[key] = ph
    write(ROOT / 'public/photos/index.json', index)
    credits = read(ROOT / 'public/credits.json')
    credits['photos'] = list(photos.values()) if isinstance(photos, dict) else photos
    music = read(ROOT / 'public/audio/music.json')
    credits['music'] = music
    write(ROOT / 'public/credits.json', credits)
    mapping = dict(assets.get('eventPhotos', {}))
    known = {'e.korce_liberation': 'Greek Forces in Korce.JPG', 'e.belgrade_bombing': 'Bundesarchiv Bild 141-1005, Belgrad, Zerstörungen.jpg', 'e.athens_falls': 'Bundesarchiv Bild 146-1979-123-32, Athen, Einmarsch deutscher Truppen.jpg', 'e.winter_front': 'Italian soldiers in Albania, December 1940.jpg', 'e.kalamata': 'Troops evacuated from Greece arriving in Alexandria 7477380.jpg'}
    for eid, file in known.items():
        ph = next((x for x in assets.get('mainlandCandidates', []) if x['commons'] == 'File:' + file), None)
        if ph: mapping[eid] = {'commons': ph['commons'], 'caption': ph['caption']}
    if mapping:
        events = read(DATA / 'events.json')
        for event in events:
            if event['id'] in mapping:
                event['photo'] = mapping[event['id']]
        write(DATA / 'events.json', events)
print('Merged', {kind: len(read(DATA / f'{kind}.json')) for kind in ['events', 'pockets', 'equipment']}, 'fronts', len(files))
