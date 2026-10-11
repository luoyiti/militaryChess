# 巴尔干战役 · 1940—1941

复用波兰与法国版本的作战室界面、D3地图引擎、Three.js沙盘、部队模型、声音与导演编排，独立呈现1940年10月28日至1941年6月1日的希意战争、南斯拉夫/希腊本土战役和克里特战役。

## 运行

```bash
npm install
npm run dev                 # http://127.0.0.1:5194/
npm run build
npm run preview             # http://127.0.0.1:4194/
```

构建后也可以双击 `start.command`。页面通过本地HTTP服务运行，不能用file://直接打开。地图、字体、照片、音效与配乐均为本地资源；资料页的史料网站和英语档案原片入口需要联网。

## 浏览

- 六个章节入口会跳转日期并聚焦对应战区；底部总时间轴始终覆盖完整战役。
- 点击密集事件圆点，选择具体事件；卡片含中文说明、日期精度、关联部队、照片与来源。
- 鼠标滚轮缩放、拖动平移；全景显示集团军/军团，放大显示关键师与旅。
- 空格播放/暂停；左右键逐事件；逗号/句号进退6小时；H回全图；M切换3D；Esc关闭卡片。
- 战斗序列支持搜索、档案和部队跟随；图例页可开关控制区、战线、推进方向、完整路线、包围圈、事件、地名、河流、森林、地形与六角格。
- 导演模式自动驻留重要事件；声音在进入作战室后解锁，顶栏可静音。

URL：`?nointro`跳过开场；`?t=1941-04-12T12:00`定位指定绘图时间。统一使用固定UTC+2；只有日级史料的事件显示日期，精确到分钟的事件另显示时间。

## 连续地图覆盖

主战区高精度地图外另有同投影的离线周边地理背景，包含西地中海、阿尔卑斯、黑海与北非。缩小和拖动镜头会保持整个视口位于真实地图数据内；核心部队、战线和历史边界的位置不变。地图低分辨率层先完整加载，高精度瓦片随后补充。

## 历史与地理精度

固定历史国界、动态控制区、动态战线分别绘制。底图保持1940年开战时的南斯拉夫统一国界、意占阿尔巴尼亚轮廓、意属伊斯特里亚/扎达尔/多德卡尼斯。希军反攻能够收复阿尔巴尼亚的控制区；南斯拉夫战区4月6日启用；克里特登陆前不出现德军控制区。

国界与地形使用已有管线重新生成。战线及路线依据官方战史按关键节点重建，节点之间进行动画插值；这些位置是战役级示意。分散空降、海运和陆上推进使用不同线型。赴埃及的海路在图幅边缘标明图外目的地。

主要史料：希腊陆军军事历史资料、美国陆军 DA Pam 20-260《The German Campaigns in the Balkans》、澳大利亚官方战史《Greece, Crete and Syria》、新西兰官方克里特战史。具体链接保存在数据来源中，并可在页面「资料」和事件卡内访问。

## 再生成与验证

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/requirements.txt
bash scripts/geo/run_all.sh
.venv/bin/python scripts/geo/build_context.py
npm run campaign
.venv/bin/python scripts/fonts/subset.py --force
.venv/bin/python scripts/geo/verify_geo.py
npm run verify
npm run shots -- --3d
```

`scripts/seed_campaign.py`也是战役数据生成入口。截图命令使用机器已有的Playwright Chromium或Chrome，输出到系统临时目录，可用`BALKANS_SHOTS_DIR`指定位置。

全部代码和素材生成限定在本目录，两个参考项目保持不变。来源、字体、音乐及照片许可见 `LICENSES.md` 和 `public/credits.json`；地理生成细节见 `public/geo/geo_pipeline.meta.json`。
