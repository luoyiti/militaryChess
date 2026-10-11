"""Small, documented 1940 coast corrections on the Natural Earth substrate.

The Noordoostpolder (1942), Oostelijk Flevoland (1957), and Zuidelijk Flevoland
(1968) did not exist in the campaign. Flevoland admin-1 removes their modern
land; the pre-existing small islands Urk and Schokland are schematic outlines.
Dates: Rijkswaterstaat, https://www.rijkswaterstaat.nl/water/waterbeheer/bescherming-tegen-het-water/100-jaar-zuiderzeewet
This is a cartographic reconstruction; the real modern DEM remains unmodified.
"""
import os
from functools import lru_cache
from shapely.geometry import shape, Point, Polygon
from shapely.ops import unary_union
from geo_common import CACHE_A, load_fc, ne_land, clean

@lru_cache(maxsize=1)
def polder_mask():
    return clean(unary_union([shape(f['geometry']) for f in load_fc(os.path.join(CACHE_A, 'flevoland.geojson'))['features']]))

@lru_cache(maxsize=1)
def historic_islands():
    # The two islands are deliberately generalized at theatre-map scale.
    urk = Point(5.597,52.662).buffer(0.008)
    schokland = Polygon([(5.767,52.635),(5.777,52.636),(5.780,52.664),(5.775,52.678),(5.769,52.675)])
    return clean(unary_union([urk,schokland]))

def remove_post1940_polders(g):
    return clean(unary_union([g.difference(polder_mask()),historic_islands()]))

@lru_cache(maxsize=1)
def land1940():
    return remove_post1940_polders(ne_land())
