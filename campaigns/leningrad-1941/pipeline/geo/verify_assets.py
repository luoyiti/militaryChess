"""验证全套瓦片、地形、掩膜及历史边界参照点，并保存可核查的处理元数据。
加 --check 只验证，不写元数据。所有路径固定为本战役。
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
CAMPAIGN = ROOT / 'campaigns/leningrad-1941'
PUBLIC = ROOT / 'public/campaigns/leningrad-1941'
sys.path.insert(0, str(ROOT / 'tools/geo'))
import os
os.environ.setdefault('GEO_CAMPAIGN', 'leningrad-1941')
import proj  # noqa: E402

read = lambda p: json.loads(p.read_text())
frame = read(CAMPAIGN / 'config/frame.json')
tiles = read(PUBLIC / 'tiles/base/meta.json')
terrain = read(PUBLIC / 'terrain/terrain.json')
masks_meta = read(PUBLIC / 'geo/field_masks.json')
assert frame['width'] == tiles['worldWidth'] == terrain['worldWidth'] == 8192
assert frame['height'] == tiles['worldHeight'] == terrain['worldHeight']
total_tiles = 0
for level in tiles['levels']:
    for y in range(level['rows']):
        for x in range(level['cols']):
            path = PUBLIC / f"tiles/base/{level['z']}/{x}_{y}.webp"
            with Image.open(path) as image:
                assert image.size == (min(512, level['width'] - x * 512), min(512, level['height'] - y * 512)), path
                image.verify()
            total_tiles += 1
for path, size in [('tiles/overview.webp', (2048, tiles['levels'][1]['height'])),
                   ('terrain/height.png', (terrain['width'], terrain['height'])),
                   ('terrain/albedo.webp', (terrain['albedo']['width'], terrain['albedo']['height']))]:
    with Image.open(PUBLIC / path) as image:
        assert image.size == size, path
        image.verify()
f = frame['field']
assert (f['w'], f['h'], f['cell']) == (masks_meta['w'], masks_meta['h'], masks_meta['cell'])
mask = np.fromfile(PUBLIC / 'geo/field_masks.bin', dtype=np.uint8)
assert len(mask) == f['w'] * f['h']
assert masks_meta['bits']['0'] == 'SU' and masks_meta['bits']['1'] == 'DE' and masks_meta['bits']['2'] == 'FI'
checks = {'列宁格勒': ([30.316, 59.939], 17), '维堡': ([28.753, 60.710], 17),
          '索尔塔瓦拉': ([30.693, 61.703], 17), '里加': ([24.105, 56.949], 17),
          '塔林': ([24.745, 59.437], 17), '考纳斯': ([23.904, 54.898], 17),
          '蒂尔西特': ([21.88, 55.083], 18), '梅梅尔': ([21.135, 55.713], 18),
          '赫尔辛基': ([24.938, 60.17], 20), '拉多加湖': ([31.5, 61], 0), '伊尔门湖': ([31.3, 58.2], 0)}
for name, (point, expected) in checks.items():
    x, y = proj.forward(*point)
    value = int(mask[int(y // f['cell']) * f['w'] + int(x // f['cell'])])
    assert value == expected, (name, point, value, expected)
topo = read(PUBLIC / 'geo/vectors.topo.json')
names = lambda k: [g.get('properties', {}).get('zh') for g in topo['objects'][k]['geometries']]
assert {'拉多加湖', '奥涅加湖', '伊尔门湖'} <= set(names('lakes'))
assert {'涅瓦河', '斯维里河', '沃尔霍夫河'} <= set(names('rivers'))
report = {'campaign': 'leningrad-1941', 'checked': '2026-10-18', 'frame': frame,
          'tiles': total_tiles, 'maskCells': len(mask), 'maskCounts': {str(b): int(((mask >> b) & 1).sum()) for b in [0, 1, 2, 4, 6]},
          'countryAndLakeChecks': checks, 'vectorCounts': {k: len(o.get('geometries', [])) for k, o in topo['objects'].items()},
          'frameSha256': hashlib.sha256((CAMPAIGN / 'config/frame.json').read_bytes()).hexdigest(),
          'rebuild': 'sh campaigns/leningrad-1941/pipeline/geo/rebuild.sh',
          'sources': ['https://www.naturalearthdata.com/', 'https://registry.opendata.aws/terrain-tiles/',
                      'https://github.com/aourednik/historical-basemaps', 'https://nakanune.rusarchives.ru/en/node/214',
                      'https://www.maanmittauslaitos.fi/en/e-services/karelian-maps', 'https://www.openstreetmap.org/copyright'],
          'limits': ['政治底图为1941-06-22，实时控制以战线帧为准。', '1940年苏芬界在本画幅内以现代边界近似，汉科租借区概略处理。',
                     '林区/沼泽为依据地形概括的示意范围；非1941年地籍或植被调查。', '旧国界、战毁聚落和局部高地有明示的示意精度；约1.28公里的控制场不能解析街区或单个工事。']}
if '--check' not in sys.argv:
    (PUBLIC / 'geo/geography.meta.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f"✓ geography: {total_tiles} tiles; {len(mask)} mask cells; {len(checks)} country/lake probes; terrain and named waters complete")
