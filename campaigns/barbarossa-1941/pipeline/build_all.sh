#!/bin/sh
# 巴巴罗萨行动：从各分区的 builder 重新生成全部数据（可重复运行，不联网）。
#   sh campaigns/barbarossa-1941/pipeline/build_all.sh
# 顺序：核心地名 → 战线关键帧/包围圈/防线 → 中央 → 南方 → 北方（北方部队轨迹按关键帧校正，须在战线之后）
#      → 装备与战略事件 → 整合者补丁 → 合并事件 → 校验。照片下载另行运行 pipeline/scripts/assets/fetch_photos.py。
set -e
C="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$C/../.." && pwd)"
PY="sh $ROOT/tools/py.sh"
cd "$ROOT"
$PY "$C/pipeline/build/core_gazetteer.py"
$PY "$C/pipeline/fronts/build_fronts.py"
$PY "$C/pipeline/fronts/build_extras.py"
for s in center_gaz center_de center_su center_routes center_events; do (cd "$C/pipeline/build" && $PY "$s.py"); done
$PY "$C/pipeline/build/south_build.py"
(cd "$C/pipeline/build" && $PY north_all.py)
(cd "$C/pipeline/scripts/assets" && $PY build_media_data.py)
$PY "$C/pipeline/build/lead_patches.py"
$PY "$C/pipeline/build/event_photos_src.py"
$PY "$C/pipeline/build/merge_events.py"
npm run validate -- --campaign barbarossa-1941 --quiet
