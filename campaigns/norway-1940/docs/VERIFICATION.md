# 实际验证结果

本项目独立副本完成；没有修改波兰原目录。

## 环境与结果

- Node.js 24.19.0；`npm ci --offline`成功安装328个依赖包。
- `npm run verify`：两套TypeScript配置通过；4个测试文件、52项测试通过；史料数据0错误、0警告；Vite生产构建通过。
- 使用已有Playwright依赖与本机Google Chrome。Browser插件未提供，采用项目已有的Playwright验证路径。未安装另一套地图引擎或浏览器。
- 开发URL `http://127.0.0.1:5191/`；生产URL `http://127.0.0.1:4191/`。
- 真实桌面1600×1000与窄屏430×932，生产构建21组交互检查通过；页面错误、控制台error、失败请求与HTTP缺失资源均为0。
- 原项目557个源码与运行资产文件SHA-256与复制前清单一致；运行资源全部来自新项目。

## 生产浏览器检查

| 检查 | 结果 |
|---|---|
| intro enters the actual map | 通过 |
| page identity, content and loaded geography | 通过 |
| region south | 通过 |
| region central | 通过 |
| region narvik | 通过 |
| region sea | 通过 |
| region all | 通过 |
| wheel zoom and drag pan | 通过 |
| event jump synchronizes map, date and card | 通过 |
| date input jumps | 通过 |
| speed, playback and pause | 通过 |
| timeline scrubbing pauses and clears stale card | 通过 |
| layers toggle actual engine state | 通过 |
| OOB search opens unit card and inherited model viewer | 通过 |
| sources and licenses | 通过 |
| all 38 event cards and date seeks | 通过 |
| director triggers and holds a real event | 通过 |
| audio mute and optional English narration controls | 通过 |
| inherited Three.js sandbox renders | 通过 |
| 430px responsive map and event card | 通过 |
| no app console errors, failed requests or missing resources | 通过 |

证据：`.work/shots/verification.json`、`.work/browser-production.log`；截图`intro.png`、`national.png`、`central.png`、`narvik.png`、`narvik-event.png`、`mobile.png`、`mobile-event.png`、`sandbox.png`。

## 修复与复测

- 空海/空路线原先写出单独的SVG“ M ”命令：过滤未成线点列，增加回归测试；生产浏览器不再报SVG错误。
- 原侧栏clip-path裁掉外侧展开按钮：取消裁剪，手机真实点击展开/收起通过。
- 手机日期栏挤压和档案遮住焦点：改三行控制布局，档案开启时预留上方地图空间，截图目检通过。
- 点击地图事件原先只开档案未定位事件时间：统一seek、暂停及清理旧导演驻留/卡片；38个事件逐一通过。
- 导演驻留、速度/暂停、回拖、日期跳转、图层、序列搜索、档案模型、资料许可均从实际UI操作验证。
- 3D软件渲染原约5 fps：自动简化网格/像素分辨率并关闭阴影；最终软件渲染样本约13 fps、17个实例。硬件GPU帧率未在该自动化环境测量，2D为默认视图。
- 音效资源加载和静音/解除静音状态通过；旁白开关通过。未对系统实际音频输出或英语语音音色做听音验收；语音可用性取决于系统。

## 史实与表达边界

按事件校验了4月9日的多港口突袭、两次纳尔维克海战、中部各港撤运日期、RAF冰湖部署、比耶克维克、5月28日夺城、Alphabet、政府流亡、Glorious和本土结束。真实数据测试验证纳尔维克控制场在5月28日从DE转为AL。

单位为代表性分遣队/舰艇/部队，控制区为主要据点及交通走廊。日级事件的时分仅为编排。周边现代背景国界和概化海岸、高程精度、符号化3D模型、波兰海军未逐舰列出等限制见README及HISTORY。没有把局部据点控制表述成全挪威逐小时精确前线。
