#!/usr/bin/env bash
# Portable font pipeline. Set PY to an interpreter with requirements.txt installed if needed.
set -euo pipefail
FONT_PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FONT_PY="${PY:-python3}"
cd "$FONT_PROJECT_ROOT"
export PYTHONPATH="$FONT_PROJECT_ROOT/scripts/.cache/e/fonts/python${PYTHONPATH:+:$PYTHONPATH}"
"$FONT_PY" scripts/fonts/fetch_fonts.py
"$FONT_PY" scripts/fonts/subset.py "$@"
"$FONT_PY" scripts/fonts/verify.py
