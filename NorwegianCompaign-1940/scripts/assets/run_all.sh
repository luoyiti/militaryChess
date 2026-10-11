#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ASSET_PYTHON="${ASSET_PYTHON:-python3}"
"$ASSET_PYTHON" scripts/assets/fetch_norway_photos.py
