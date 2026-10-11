#!/bin/bash
# 双击启动作战总台：用 Python 静态服务器打开 dist/（总台与全部已发布战役）。
# 首次使用需要先在终端里运行：npm install && npm run build
cd "$(dirname "$0")/dist" || { echo "未找到 dist/，请先运行 npm install && npm run build"; read; exit 1; }
PORT=4180
( sleep 1.5; open "http://127.0.0.1:$PORT/" ) &
python3 -m http.server $PORT --bind 127.0.0.1
