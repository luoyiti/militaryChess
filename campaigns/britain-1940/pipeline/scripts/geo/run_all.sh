#!/usr/bin/env bash
# Regenerate Britain geography with portable runtimes and physical local caches.
# Usage: bash scripts/geo/run_all.sh [--skip-dem] [--skip-render]
set -euo pipefail
cd "$(dirname "$0")/../.."
PY="${PYTHON_BIN:-python3}"
NODE="${NODE_BIN:-node}"
MS=node_modules/mapshaper/bin/mapshaper
mkdir -p .work/a scripts/.cache/a public/geo public/tiles public/terrain
# The modern Flevoland geometry removes polders reclaimed after the campaign.
if [ ! -s scripts/.cache/a/flevoland.geojson ]; then
  [ -s scripts/.cache/a/ne_10m_admin_1.zip ] || curl -fLsS -o scripts/.cache/a/ne_10m_admin_1.zip https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip
  mkdir -p scripts/.cache/a/adm1
  unzip -o -q scripts/.cache/a/ne_10m_admin_1.zip -d scripts/.cache/a/adm1
  "$NODE" "$MS" scripts/.cache/a/adm1/ne_10m_admin_1_states_provinces.shp -filter 'adm0_a3==="NLD" && name==="Flevoland"' -filter-fields name,adm0_a3 -o scripts/.cache/a/flevoland.geojson format=geojson
fi
"$NODE" scripts/frame/emit_frame.mjs
"$NODE" scripts/geo/parity.mjs
"$PY" scripts/geo/proj.py
if [[ " $* " != *" --skip-dem "* ]] || [ ! -s .work/a/dem_8192.npy ]; then "$PY" -u scripts/geo/03_dem.py; fi
"$PY" scripts/geo/01_borders_1939.py
"$PY" scripts/geo/02_vectors.py
"$NODE" scripts/geo/02_project.mjs
CANVAS_BBOX="$("$NODE" --input-type=module -e 'import {readFileSync} from "node:fs";const f=JSON.parse(readFileSync("config/frame.json"));console.log([0,0,f.width,f.height].join(","));')"
"$NODE" "$MS" -i .work/a/xy/land.geojson .work/a/xy/countries1939.geojson .work/a/xy/rivers.geojson .work/a/xy/lakes.geojson .work/a/xy/marsh.geojson .work/a/xy/forest.geojson combine-files snap -clip bbox="$CANVAS_BBOX" -simplify planar interval=0.25 keep-shapes -filter-slivers min-area=2 -filter 'true' remove-empty -o public/geo/vectors.topo.json format=topojson quantization=100000
"$NODE" scripts/geo/sanitize_topo.mjs
"$PY" scripts/geo/05_masks.py
if [[ " $* " != *" --skip-render "* ]]; then "$PY" -u scripts/geo/04_render.py; fi
"$NODE" scripts/geo/preview_decode.mjs
"$PY" scripts/geo/preview.py
"$PY" scripts/geo/verify.py
