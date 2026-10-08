#!/usr/bin/env bash
# E 素材全流程（可重复执行；已下载内容走 scripts/.cache/e/ 缓存）
#   照片 → 音效 → sprite → 音乐 → credits → 字体下载 → 字体子集（最后执行，以覆盖 credits/photos 中的字符）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PY="${PY:-/Users/yiti/.workbuddy/binaries/python/envs/default/bin/python}"
cd "$ROOT"
"$PY" scripts/assets/fetch_photos.py
"$PY" scripts/assets/fetch_audio.py
bash scripts/assets/build_sfx_sprite.sh
"$PY" scripts/assets/fetch_music.py
"$PY" scripts/assets/build_credits.py
"$PY" scripts/fonts/fetch_fonts.py
"$PY" scripts/fonts/subset.py "$@"
