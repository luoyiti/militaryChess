"""把内陆湖区从本战役的陆地控制场移除；不修改共享管线或别的战役。

Natural Earth 陆地层的内陆湖泊由独立 lakes 层表达。通用掩膜不扣除此层，
列宁格勒的大湖会被当作苏联陆地；本地后处理按同一投影的真实湖岸纠正。
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import shape
from shapely.ops import unary_union

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'tools/geo'))
os.environ.setdefault('GEO_CAMPAIGN', 'leningrad-1941')
from common import XY, PUBLIC, CDIR  # noqa: E402

frame = json.loads((Path(CDIR) / 'config/frame.json').read_text())
f = frame['field']
mask_file = Path(PUBLIC) / 'geo/field_masks.bin'
mask = np.fromfile(mask_file, dtype=np.uint8).reshape(f['h'], f['w'])
lakes = json.loads((Path(XY) / 'lakes.geojson').read_text())['features']
water = unary_union([shapely.make_valid(shape(lake['geometry'])) for lake in lakes])
j, i = np.mgrid[0:f['h'], 0:f['w']]
inside = shapely.contains_xy(water, (i + .5) * f['cell'], (j + .5) * f['cell'])
mask[inside] = 0
mask.tofile(mask_file)
meta_file = mask_file.with_suffix('.json')
meta = json.loads(meta_file.read_text())
meta['waterCorrection'] = {'clearedLakeCells': int(inside.sum()), 'source': 'Natural Earth lakes, projected with this campaign frame',
                           'script': 'pipeline/geo/mask_lakes.py', 'note': '拉多加湖、伊尔门湖等湖区不视为可占领陆地；岸线与岛屿仍受场网格分辨率限制。'}
meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
print(f'[lakes:leningrad-1941] {inside.sum()} 个湖区网格已从陆地/国家掩膜移除')
