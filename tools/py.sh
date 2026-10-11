#!/bin/sh
# 统一的 Python 入口：优先 $PYTHON_BIN，其次仓库根目录 .venv（pip install -r tools/requirements.txt），最后系统 python3。
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -n "$PYTHON_BIN" ]; then PY="$PYTHON_BIN"
elif [ -x "$ROOT/.venv/bin/python" ]; then PY="$ROOT/.venv/bin/python"
else PY="python3"; fi
exec "$PY" "$@"
