#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
GEO_PYTHON="${GEO_PYTHON:-python3}"
node scripts/frame/emit_frame.mjs
"$GEO_PYTHON" scripts/geo/prepare_norway.py
node scripts/geo/02_project.mjs
node node_modules/mapshaper/bin/mapshaper -i .work/a/xy/land.geojson .work/a/xy/countries1939.geojson .work/a/xy/rivers.geojson .work/a/xy/lakes.geojson .work/a/xy/forest.geojson .work/a/xy/marsh.geojson combine-files -o force format=topojson public/geo/vectors.topo.json
"$GEO_PYTHON" scripts/geo/05_masks.py
"$GEO_PYTHON" scripts/geo/03_dem.py
"$GEO_PYTHON" scripts/geo/04_render.py
