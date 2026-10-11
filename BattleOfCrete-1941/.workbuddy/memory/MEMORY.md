# 项目记忆：1939 波兰战役战旗推演（junqi）

- 端口约定：dev 5188、preview 4188（5173 被用户另一个项目 ~/WorkBuddy/typing 占用，勿动）。
- 契约：docs/CONTRACT.md（id 规范、关键帧语义、文件归属）；schema 唯一真值 src/schema/index.ts；投影真源 config/frame.json（勿手改，scripts/frame/emit_frame.mjs 生成）。
- 数据修改后必跑：npm run verify；目检：npx tsx scripts/debug/render_debug.ts --date <ISO>、node scripts/shots.mjs http://127.0.0.1:4188/ [--3d|--play]。
- 素材再生成：bash scripts/assets/run_all.sh（照片/音效/字体子集；改 UI 文案后需重跑 scripts/fonts/subset.py）；地图：bash scripts/geo/run_all.sh。
- 内容规范：时间统一 CET；不出现卍字（含卍字照片已排除）；有争议事件须注明；页面声明「历史示意图」。
- 用户偏好：复古作战室风格、2D 主图 + 3D 模型卡 + 3D 沙盘、部队到师级。
- 线上发布：已发布为静态站点 https://poland-1939-wargame.app.workbuddy.host/ ；发布时直传 dist 目录（static），勿发布项目根（沙箱会重装依赖）。更新线上需先本地 npm run verify 再重新部署。
