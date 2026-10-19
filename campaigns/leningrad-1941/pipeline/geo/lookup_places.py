"""补充地名的可审阅坐标证据。每秒至多一次 Nominatim 查询，只写本目录缓存。

人工审阅 gazetteer-lookups.json 后把选中的位置写入 data/gazetteer；此脚本不自动
把同名村庄、战后纪念碑或现代聚落当作战时地点。
"""
import json
import time
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
queries = json.loads((HERE / 'gazetteer-queries.json').read_text())
cache_file = HERE / 'gazetteer-lookups.json'
cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
for place_id, spec in queries.items():
    if place_id in cache:
        continue
    lon, lat = spec['anchor']
    params = {'q': spec['q'], 'format': 'jsonv2', 'limit': 4, 'bounded': 1,
              'viewbox': f'{lon-.45},{lat+.3},{lon+.45},{lat-.3}'}
    try:
        r = requests.get('https://nominatim.openstreetmap.org/search', params=params,
                         headers={'User-Agent': 'MilitaryChessHistoricalMap/1.0 (local geography research)'}, timeout=25)
        r.raise_for_status()
        rows = r.json()
        cache[place_id] = {'query': params, 'checked': '2026-10-18', 'results': [
            {k: row[k] for k in ['osm_type', 'osm_id', 'lat', 'lon', 'category', 'type', 'name', 'display_name'] if k in row}
            for row in rows]}
        cache_file.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n')
        print(place_id, [(row.get('name'), row.get('lon'), row.get('lat'), row.get('type')) for row in rows], flush=True)
    except (requests.RequestException, ValueError) as e:
        print(place_id, type(e).__name__, str(e), flush=True)
    time.sleep(1.1)
