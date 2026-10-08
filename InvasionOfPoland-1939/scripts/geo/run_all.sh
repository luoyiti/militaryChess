#!/usr/bin/env bash
# 地理管线一键重跑（有缓存、结果确定）。用法：bash scripts/geo/run_all.sh [--skip-dem]
set -euo pipefail
cd "$(dirname "$0")/../.."
PY=/Users/yiti/.workbuddy/binaries/python/envs/default/bin/python
NODE=/Users/yiti/.workbuddy/binaries/node/versions/22.22.2-3/bin/node
MS=node_modules/.bin/mapshaper
mkdir -p .work/a scripts/.cache/a public/geo public/tiles public/terrain

# 0. 外部矢量缓存（CShapes 2.0 历史国界、NE 10m 一级行政区）
[ -s scripts/.cache/a/CShapes-2.0.geojson ] || curl -sL -o scripts/.cache/a/CShapes-2.0.geojson https://icr.ethz.ch/data/cshapes/CShapes-2.0.geojson
if [ ! -s scripts/.cache/a/ne_10m_admin_1_region.geojson ]; then
  [ -s scripts/.cache/a/ne_10m_admin_1.zip ] || curl -sL -o scripts/.cache/a/ne_10m_admin_1.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip
  mkdir -p scripts/.cache/a/adm1 && unzip -o -q scripts/.cache/a/ne_10m_admin_1.zip -d scripts/.cache/a/adm1
  $MS scripts/.cache/a/adm1/ne_10m_admin_1_states_provinces.shp -filter '["UKR","BLR","LTU","POL","SVK","CZE","HUN","ROU","MDA","LVA","RUS","DEU","AUT"].indexOf(adm0_a3)>=0' \
    -filter-fields adm0_a3,name,name_en,iso_3166_2 -o scripts/.cache/a/ne_10m_admin_1_region.geojson format=geojson
fi

# 1. 投影一致性（d3 vs numpy）
$NODE scripts/geo/parity.mjs
$PY scripts/geo/proj.py

# 2. DEM（Terrarium z9，缓存于 scripts/.cache/a/terrarium）
if [ "${1:-}" != "--skip-dem" ] || [ ! -s .work/a/dem_8192.npy ]; then $PY scripts/geo/03_dem.py; fi

# 3. 国界 → 4. 矢量（经纬度）→ d3 投影 → mapshaper 量化
$PY scripts/geo/01_borders_1939.py
$PY scripts/geo/02_vectors.py
$NODE scripts/geo/02_project.mjs
( cd .work/a/xy && ../../../$MS -i land.geojson countries1939.geojson rivers.geojson lakes.geojson marsh.geojson forest.geojson combine-files \
    snap -simplify planar interval=0.25 keep-shapes -filter-slivers min-area=2 -filter 'true' remove-empty \
    -o ../../../public/geo/vectors.topo.json format=topojson quantization=100000 )

# 5. 瓦片 / overview / 3D 地形 → 6. 场掩膜
$PY scripts/geo/04_render.py
$PY scripts/geo/05_masks.py
ls -la public/geo public/terrain public/tiles
