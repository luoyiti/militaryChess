# 敦刻尔克大撤退（dunkirk-1940）

1940 年 5 月 26 日 18:57，英国海军部下令启动**发电机行动**。九昼夜之后，33 万 8 千人在德国空军的炸弹下从佛兰德海岸撤回英国——
从一条本不适合靠泊的东防波堤、从马洛莱班到拉帕讷的沙滩、从三条通往多佛的航线。

本战役按小时重现敦刻尔克桥头堡的形成、收缩与陷落，以及海峡两岸的海空行动。

| 内容 | 数量 |
|---|---|
| 部队 | 德军装甲/摩托化/步兵军与师、英国远征军各军师与 RAF 中队、法军北方军群与桥头堡骨干、比利时陆军 |
| 战线关键帧 | 12（`data/fronts/`，5-26 00:00 至 6-04 10:00） |
| 包围圈 | 加来、布洛涅、里尔、敦刻尔克四个口袋（`data/pockets.json`） |
| 路线 | 陆上推进与撤退、三条撤离航线 X / Y / Z、海滩驳运（`data/routes/`） |
| 事件 | `data/events.json`（分区草稿在 `pipeline/events/`） |
| 舰船 | `data/oob/sea.json` + `data/naval/dynamo.json`（射击、命中、鱼雷、损伤、电文） |
| 装备 / 兵力 / 来源 / 地名 / 照片 | `data/equipment.json` · `data/forces.json` · 97 条来源 · 239 个地名 · 46 张公有领域照片 |

时间为**英国夏令时 BST（UTC+1）**，与法国、比利时当地时间相同。

## 目录

- `campaign.json`：阵营、控制区槽位、阶段（发电机启动 / 桥头堡与海滩 / 夜航与殿后）、时间轴标记、简报、图例、导演、配乐、总台卷宗。
- `config/geo.config.json`：取景（斜轴圆锥，旋转 −2.58°，标准纬线 50.9/51.3 夹住海峡两岸）、1940 年 5 月国界（`pipeline/geo/borders_1940.py`）、掩膜比特、河流与林区。
- `data/`：见 [docs/DATA-FORMAT.md](../../docs/DATA-FORMAT.md)。
- `docs/CONTRACT.md`：**冻结的界面契约**（阵营 id、部队 id、地名 id、阶段、槽位、文件归属、勘误）。
- `docs/RESEARCH-NOTES.md`：**史料研究笔记**（逐时逐日时间线、数字口径、争议问题、地形与工程、人物细节、来源清单）。
- `docs/VERIFICATION.md`：独立验证报告。
- `pipeline/`：离线脚本（地图、战线、事件合并、照片、地名裁剪）。
- `tests/`：战役测试（`campaign.test.ts` 覆盖与引用、`history.test.ts` 史实交叉验证）。

## 重新生成数据

```bash
sh tools/geo/run.sh dunkirk-1940                                     # 地图资产（frame→…→masks）
sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/build_fronts.py  # 12 个控制区关键帧
sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/merge_events.py  # 合并事件草稿 → data/events.json
.venv/bin/python campaigns/dunkirk-1940/pipeline/assets/fetch_photos.py  # 照片与署名
sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/prune_gazetteer.py  # 地名使用报告（默认不写回）
```

## 检查

```bash
npm run validate -- --campaign dunkirk-1940
npx vitest run campaigns/dunkirk-1940
npm run verify
```

## 数据边界（重要）

- **控制区**：德军控制区（槽 A）以「包住画布的大矩形 + 桥头堡缺口」表达，引擎裁剪到战区陆地（比利时 + 法国本土）。英国与海峡不会着色；荷兰（掩膜比特 1）是德军本土比特。
- **第二占领槽（AL）在本战役不使用**，`manifest.validation.slotEmptyBefore` 已声明。
- **桥头堡缺口**由 12 个关键帧的战线锚点决定；加来、贝尔格、敦刻尔克的陷落使用 `transition: "step"`，避免关键帧之间线性插值把据点提前「染成」德军。
- 地图上的部队位置按战史逐日布点，**不是实测阵地图**；德军本土集结地（柏林、佐森、科布伦茨等）有意保留为**图外轨迹点**。
