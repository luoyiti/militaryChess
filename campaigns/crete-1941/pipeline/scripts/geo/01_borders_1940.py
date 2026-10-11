"""1941 Crete land mask. Engine retains countries1939 object name for compatibility."""
from geo_common import *
mod=ne_countries()
# Crete and its immediate offshore islands only; surrounding islands remain context.
crete=clean(mod['GRC'].intersection(box(23.35,34.7,26.5,35.85)))
features=[feat(crete,id='GR',zh='克里特岛（希腊）')]
dump(fc(features),os.path.join(WORK,'countries1939.geojson'))
dump(fc(features),os.path.join(ROOT,'public/geo/crete1941.geojson'))
print('[borders] Crete',crete.area)
