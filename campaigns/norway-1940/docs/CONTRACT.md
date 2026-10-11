# 挪威战役数据契约

继承原波兰引擎的 Zod / JSON / 地名引用机制；唯一结构真源为 `src/schema/index.ts`。

- 全部新内容仅在 `NorwegianCompaign-1940/`。不修改 `InvasionOfPoland-1939/`；不引用原目录运行时源文件/资产。
- WGS84 `[经度, 纬度]` 或 `@place_id`；共享投影参数见 `config/frame.json`。地理锚点不代表精确战斗/舰位。
- 时间 `1940-MM-DDTHH:mm`，4月9日至6月10日。时轴按事件日编排；`timePrecision=day` 的时分不作历史确证。
- 国家 `DE / NO / UK / FR / PL`；单位前缀小写对应国家。聚合分遣队 `schematic=true`；舰艇/航空/团级梯队不伪装成陆军旅。
- 轨迹保留原 smoothstep；活动窗口用于增援和离场。`mode=rail/naval/air` 标明运输性质。`evacuated` 撤离战区，`inactive` 部署结束，`ineffective` 重创后失去完整战斗能力，均按原淡出机制处理。
- `Route.kind=land/naval/landing/air/evacuation`；路线端点、交通走廊与航向为概略。原 `routeProgress`、箭头几何及时间驱动继续使用。
- 控制关键帧 `DE / AL`；AL合并挪威和其他盟军的据点。`transition=step` 防止登陆/夺城提前出现；山谷推进可用smooth。只裁剪到挪威陆地掩膜，不涂中立瑞典或海域。
- 保留内部 `countries1939` TopoJSON对象名和掩膜位布局以复用原渲染接口；内容已替换为挪威地理，名称不是1939年数据声明。
- 每条单位、路线、事件、控制状态有 `sources` 和可信度；来源ID小写。事件照片必须存在本地索引且有许可；英语旁白只能标为原创合成摘要。
- `npm run verify` 与 `npm run shots` 用于结构/实际运行验收。原项目只读基线在 `docs/poland-baseline.json`。
