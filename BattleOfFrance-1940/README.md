# 1940 · 法国战役 — 战旗推演

复古作战室风格的 1940 年法国战役基础版（5 月 10 日黄色方案 → 6 月 25 日停战生效）。

引擎、字体、音效和地图绘制管线来自旁边的 `poland-1939`。本目录是独立副本，不改波兰战役的代码。

这一版故意做小：26 支部队（集团军和四支装甲师）、10 个战线关键帧、12 条推进箭头、3 个包围圈、20 条事件。位置是示意。意大利阿尔卑斯战线和法国南部不在图内。

## 运行

```bash
npm install
npm run dev          # http://127.0.0.1:5190/
```

已经执行过 `npm run build` 时，也可以双击 `start.command`，它会打开 `http://127.0.0.1:4190/`。

不能直接双击 `index.html`。`file://` 下浏览器会拦截数据加载。

URL 参数：`?nointro` 跳过开场，`?t=1940-05-20T20:00` 跳到指定时刻（德国夏令时）。

## 操作

滚轮缩放，拖动平移。空格播放。左右方向键跳事件。`,` `.` 进退 6 小时。`H` 回到全图。`M` 切换 3D 沙盘。点击棋子或时间轴圆点打开档案。

## 重新生成

```bash
bash scripts/geo/run_all.sh          # 地图、高程、瓦片、掩膜
.venv/bin/python scripts/seed_campaign.py
npm run validate:data
```

地理脚本使用本目录的 `.venv`（需要 shapely、numpy、pillow、scipy、requests）。
