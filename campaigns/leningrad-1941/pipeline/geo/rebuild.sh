#!/bin/sh
# 独立、可再生的本战役地图：公共地理管线 + 本地大湖掩膜修正。
set -eu
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"
sh tools/geo/run.sh leningrad-1941 "$@"
GEO_CAMPAIGN=leningrad-1941 sh tools/py.sh campaigns/leningrad-1941/pipeline/geo/mask_lakes.py
sh tools/py.sh campaigns/leningrad-1941/pipeline/geo/verify_assets.py
