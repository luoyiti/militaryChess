#!/bin/sh
# 地理管线：为一个战役生成地图资产（有缓存，可重复运行）。
#   sh tools/geo/run.sh <campaignId> [--skip-dem] [--from <step>]
# 步骤：frame → fetch → dem → borders → vectors → project → render → masks
#   frame   config/geo.config.json → config/frame.json（投影与画布）
#   fetch   Natural Earth + world_1938 → .cache/geo/raw/（全部战役共用）
#   dem     Terrarium 高程瓦片 → .work/geo/<id>/dem.npy
#   borders 开战时国界（world_1938 + 映射；或战役自带的 borders.script）
#   vectors 陆地、河流、湖泊、森林、沼泽（经纬度）
#   project d3 投影 + mapshaper → public/campaigns/<id>/geo/vectors.topo.json
#   render  纸质底图瓦片、总览图、3D 地形贴图与高度图
#   masks   SDF 场掩膜 field_masks.bin
# Python 由 tools/py.sh 选择（$PYTHON_BIN → .venv → python3），依赖见 tools/requirements.txt。
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ID="$1"; shift || true
[ -n "$ID" ] && [ -f "$ROOT/campaigns/$ID/config/geo.config.json" ] || { echo "用法：sh tools/geo/run.sh <campaignId> [--skip-dem] [--from <step>]（需要 campaigns/<id>/config/geo.config.json）"; exit 2; }
SKIP_DEM=0; FROM=frame; FORCE=0
while [ $# -gt 0 ]; do case "$1" in --skip-dem) SKIP_DEM=1;; --from) FROM="$2"; shift;; --force) FORCE=1;; esac; shift; done
# 由定制管线生成资产的既有战役（geo.config.json 含 legacy）：只校验投影，不覆盖已提交的底图
if grep -q '"legacy"' "$ROOT/campaigns/$ID/config/geo.config.json" && [ $FORCE = 0 ]; then
  echo "campaigns/$ID 的地图资产来自定制管线（见 geo.config.json 的 legacy）。只校验投影；确需用通用管线重建请加 --force。"
  exec node "$ROOT/tools/geo/emit_frame.mjs" "$ID" --check
fi
PY="sh $ROOT/tools/py.sh"
export GEO_CAMPAIGN="$ID"
cd "$ROOT"
started=0
step() { [ "$1" = "$FROM" ] && started=1; [ $started = 1 ]; }
step frame   && node tools/geo/emit_frame.mjs "$ID"
step fetch   && $PY tools/geo/fetch_raw.py
step dem     && { if [ $SKIP_DEM = 1 ] && [ -s ".work/geo/$ID/dem.npy" ]; then echo "[dem:$ID] 跳过（--skip-dem）"; else $PY tools/geo/dem.py; fi; }
step borders && $PY tools/geo/borders.py
step vectors && $PY tools/geo/vectors.py
step project && node tools/geo/project.mjs "$ID"
step render  && $PY tools/geo/render.py
step masks   && $PY tools/geo/masks.py
echo "✓ 地理资产已生成：public/campaigns/$ID/{geo,tiles,terrain}"
