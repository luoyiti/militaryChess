#!/usr/bin/env bash
# 法国战役地理管线。只写 france-1940 自己的 public/ 与 .work/。
set -euo pipefail
cd "$(dirname "$0")/../.."
PY="${PY:-.venv/bin/python}"
NODE="${NODE:-node}"
MS=node_modules/.bin/mapshaper
mkdir -p .work/a public/geo public/tiles public/terrain

$NODE scripts/frame/emit_frame.mjs
$NODE scripts/geo/parity.mjs
$PY scripts/geo/proj.py

if [ "${1:-}" != "--skip-dem" ] || [ ! -s .work/a/dem_8192.npy ]; then
  $PY scripts/geo/03_dem.py
fi

$PY scripts/geo/01_borders_1940.py
$PY scripts/geo/02_vectors.py
$NODE scripts/geo/02_project.mjs
( cd .work/a/xy && ../../../$MS -i land.geojson countries1939.geojson rivers.geojson lakes.geojson marsh.geojson forest.geojson combine-files \
    snap -simplify planar interval=0.25 keep-shapes -filter-slivers min-area=2 -filter 'true' remove-empty \
    -o ../../../public/geo/vectors.topo.json format=topojson quantization=100000 )

$PY scripts/geo/04_render.py
$PY scripts/geo/05_masks.py
echo "[geo] done"
ls -la public/geo public/terrain
