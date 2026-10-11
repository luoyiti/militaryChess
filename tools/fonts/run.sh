#!/bin/sh
# npm run fonts [-- --fetch] [-- --force]：（可选）下载字体原文件，然后重建并集子集
DIR="$(cd "$(dirname "$0")" && pwd)"
for a in "$@"; do [ "$a" = "--fetch" ] && { sh "$DIR/../py.sh" "$DIR/fetch_fonts.py" || exit 1; }; done
exec sh "$DIR/../py.sh" "$DIR/subset.py" "$@"
