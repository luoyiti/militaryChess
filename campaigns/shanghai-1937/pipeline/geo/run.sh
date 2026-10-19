#!/bin/sh
# Campaign-local insertion point for the existing shared geographic tools.
#   sh campaigns/shanghai-1937/pipeline/geo/run.sh [--skip-dem]
# Do not run tools/new-campaign again. A plain shared geo/run.sh rebuild would
# omit the post-vectors supplements; use this reproducible wrapper instead.
set -eu
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
ID=shanghai-1937
export GEO_CAMPAIGN="$ID"
PY="$ROOT/tools/py.sh"
node "$ROOT/tools/geo/emit_frame.mjs" "$ID"
sh "$PY" "$ROOT/tools/geo/fetch_raw.py"
if [ "${1:-}" = "--skip-dem" ] && [ -s "$ROOT/.work/geo/$ID/dem.npy" ]; then
  printf '%s\n' '[dem:shanghai-1937] Reusing existing projected DEM (--skip-dem)'
else
  sh "$PY" "$ROOT/tools/geo/dem.py"
fi
sh "$PY" "$ROOT/tools/geo/borders.py"
sh "$PY" "$ROOT/tools/geo/vectors.py"
sh "$PY" "$ROOT/campaigns/$ID/pipeline/geo/supplement.py"
node "$ROOT/tools/geo/project.mjs" "$ID"
sh "$PY" "$ROOT/tools/geo/render.py"
sh "$PY" "$ROOT/tools/geo/masks.py"
sh "$PY" "$ROOT/campaigns/$ID/pipeline/geo/supplement.py" --mask-metadata
sh "$PY" "$ROOT/campaigns/$ID/pipeline/geo/verify.py"
