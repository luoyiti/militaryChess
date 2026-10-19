"""1937 Shanghai theatre mask, not the 1938 occupation map.

All Natural Earth land inside this Chinese theatre remains CN theatre land.
Only a conservative, explicitly schematic foreign-defended city core is left
outside the combat-control mask. It is not a sovereign international country,
not the whole International Settlement, and not an exact 1937 defence line.
Japan's native home mask is intentionally empty in this bbox. Japanese local
positions and advances belong in time-dependent fronts, never in homeBits.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'tools/geo'))
from common import LL, REGION, clean, dump, fc, feat, log, ne_land
from shapely.geometry import shape

core_feature = json.loads((HERE / 'foreign-core.geojson').read_text())['features'][0]
land = ne_land(REGION)
core = clean(shape(core_feature['geometry']).intersection(land))
china = clean(land.difference(core))
dump(fc([
    feat(china, id='CN', zh='中国战区', approx=True,
         note='1937 Chinese theatre; not 1938 Japanese occupation'),
    feat(core, id='INT', zh='外国守备核心（近似）', approx=True,
         note='Not a sovereign border or complete settlement boundary'),
]), str(Path(LL) / 'countries1939.geojson'))
log('borders', '1937 CN theatre + schematic foreign-defended core; JP home land absent by design')
