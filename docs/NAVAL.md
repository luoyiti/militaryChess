# 海战引擎

拉普拉塔河口海战（`campaigns/river-plate-1939`）是第一个海战战役。海战能力属于**引擎核心**（以后的海战——瓜达尔卡纳尔、丹麦海峡、中途岛——都能直接用），由数据驱动：给部队加 `ship` 档案、在 `data/naval/*.json` 写射击与命中，引擎就会把舰船画成剪影、按航向曲线插值航迹、重放炮火、鱼雷与烟幕。

## 1. 模块

| 模块 | 职责 |
|---|---|
| `engine/core/types.ts` | `ShipInfo` / `ShipWeapon`（部队的舰船档案）、`TrackPoint.course` / `speedKn`、海战数据 `NavalData`（`FirePeriod` `NavalHit` `TorpedoLaunch` `SmokeScreen` `DamageState` `Signal`） |
| `engine/model/core.ts` | 舰船航迹：`unit.ship` 存在时海上航段用**三次 Hermite 曲线**插值（端点切线取该点的航向/航速，缺省用相邻点中心差分），`UnitState` 带 `courseDeg` 与 `speedKn` |
| `engine/naval/model.ts` | 纯函数：解析 `data/naval/*.json`（`db.naval`）；`engagementsAt`（当前射击、距离、方位）、`salvosBetween`（确定性齐射时刻）、`damageAt`（损伤状态 + 命中累计的打哑武器与伤亡）、`torpedoesAt`、`smokeAt`、`trackSamples`（尾迹、航迹图）、`signalsUntil`、`bearingDeg` / `destination` / `rangeLabel`、`sunPosition` |
| `engine/core/time.ts` | 变速播放：`manifest.time.pace` 分段设定每秒推进的小时数；`timeToU` / `uToTime` 让时间轴按播放时长展开（数周的航行与分钟级的交火在同一条轴上） |
| `engine/map2d/naval.ts` | 2D 海战层（见 §4） |
| `engine/ui/signals.ts` | 电文纸带：`signals` 按时间逐条打出（原文 + 中文） |
| `engine/three/naval/` | 3D 海战沙盘（`manifest.sandbox.kind = "naval"`，见 §5） |
| `engine/three/models/ships.ts` | 舰船与舰载机模型（`registerModel`，`specs.ts` 写明真实尺寸） |

## 2. 数据

### 舰船档案 `unit.ship`

```json
{ "id": "de.graf_spee", "side": "DE", "echelon": "ship", "type": "naval", "parent": null,
  "name": { "zh": "施佩伯爵海军上将号", "orig": "Admiral Graf Spee", "short": "Graf Spee" },
  "model": "graf_spee",
  "ship": { "kind": "pocket_battleship", "class": { "zh": "德意志级装甲舰", "orig": "Deutschland-Klasse" },
            "lengthM": 186, "beamM": 21.65, "tonnage": 12340, "tonnageKind": "std", "maxKn": 28.5, "crew": 1150,
            "silhouette": "graf_spee",
            "weapons": [ { "id": "A", "label": "前主炮塔「安东」", "cal": "28 cm SK C/28", "kind": "main",
                           "mounts": 1, "perMount": 3, "rangeKm": 36.5, "atPct": 26 }, … ] },
  "track": [ { "at": "1939-12-13T06:14", "pos": [-49.62, -34.27], "course": 155, "speedKn": 19 }, … ] }
```

- `kind`：battleship battlecruiser pocket_battleship carrier heavy_cruiser light_cruiser destroyer submarine auxiliary tanker merchant liner tug boat
- `weapons[].id` 被 `fire.weapon`、`hits.gunsOut`、`damage.gunsOut` 引用；`atPct` 是自舰艏起的位置百分比（损伤图上画炮塔）；`rangeKm` 画射程圈
- `silhouette`：2D 俯视剪影样式（缺省按 `kind`）
- 轨迹点的 `course`（度，真北顺时针）与 `speedKn`（节）可选；有 `ship` 的部队缺省 `movement: "sea"`。分钟级的战斗航迹建议每 2–5 分钟一点并写出航向，转向处加点
- 校验：舰船按节检查航段速度（上限 `maxKn`，缺省 33 节），不受地面部队「每天」口径影响

### 海战数据 `data/naval/*.json`

每个文件是一个 `NavalData` 对象，多个文件合并：

```json
{ "fire":      [ { "id": "f.gs_exeter_1", "shooter": "de.graf_spee", "target": "gb.exeter", "weapon": "A",
                   "from": "1939-12-13T06:18", "to": "1939-12-13T06:40", "rounds": 60, "sources": […], "confidence": "medium" } ],
  "hits":      [ { "id": "h.exeter_b", "at": "1939-12-13T06:24", "shooter": "de.graf_spee", "target": "gb.exeter", "weapon": "A",
                   "location": "B 炮塔", "effect": "…", "killed": 30, "severity": 1, "gunsOut": ["B"], "sources": […], "confidence": "medium" } ],
  "torpedoes": [ { "id": "t.exeter_stbd", "at": "…", "shooter": "gb.exeter", "count": 3, "target": "de.graf_spee", "result": "…", … } ],
  "smoke":     [ { "id": "s.graf_spee_1", "ship": "de.graf_spee", "from": "…", "to": "…", "kind": "screen", "persistMin": 25, … } ],
  "damage":    [ { "ship": "gb.exeter", "at": "…", "integrity": 0.45, "speedKn": 20, "gunsOut": ["A", "B"], "fire": true, "listDeg": 7, "note": "…", … } ],
  "signals":   [ { "id": "sig.ajax_smoke", "at": "…", "from": "gb.ajax", "kind": "report", "text": "…", "zh": "…", … } ] }
```

| 类型 | 含义与画法 |
|---|---|
| `fire` | 射击时段。播放时按武器的齐射间隔（缺省按口径：28 cm 30 秒、8 英寸 20 秒、6 英寸 12 秒，可写 `salvoSec`）放出炮口闪光、弹道与目标周围的水柱；画面密度按当前播放速度封顶。暂停时画射击线与距离标注 |
| `hits` | 命中：目标闪光、起火；`gunsOut` 打哑的武器在部队卡损伤图上划掉；`severity` 1 致命/重创 2 严重 3 轻伤 |
| `torpedoes` | 鱼雷齐射：从发射舰当时位置沿 `bearing`（缺省瞄准目标在航程中点时刻的位置）按 `spreadDeg` 扇形航行，速度 `speedKn`（缺省 30 节）、射程 `rangeKm`（缺省 12 km） |
| `smoke` | 烟幕：沿施放舰在 `[from, to]` 的航迹铺设，结束后 `persistMin` 分钟内变淡消散，`driftDeg` 随风漂移 |
| `damage` | 损伤状态：从 `at` 起生效到下一条（完整度、最大航速、打哑武器、起火、横倾）；部队卡显示损伤图与命中记录 |
| `signals` | 电文与信号：原文 `text` + 中文 `zh`，`kind`：signal distress radio order report diplomatic |

id 前缀：射击 `f.`、命中 `h.`、鱼雷 `t.`、烟幕 `s.`、电文 `sig.`，全战役唯一。

## 3. 清单

| 字段 | 含义 |
|---|---|
| `time.pace` | `[{ from, hoursPerSec }]` 变速播放（覆盖 `time.hoursPerSec`），时间轴按播放时长展开并在放慢的时段补小时刻度 |
| `time.utcOffset` | 叙事时钟相对 UTC 的小时数，3D 沙盘据此算太阳高度（黎明的交火、夜间入港） |
| `map.maxZoom` | 最大相对缩放（缺省 16）；从大洋全图放大到分钟级交火需要 80–120 |
| `map.hexKm` | 海战战役建议写 `0`：不画陆地六角格（跨大洋的战区有数万个六角格，放大后拖慢绘制） |
| `naval` | `tacticalZoom`（剪影开始按真实舰长放大的缩放，缺省 10）、`shipPx`、`trackTicks`（航迹图刻度分钟数）、`fleetTicks`、`wakeMin`、`chartGrid`（海图网格出现的缩放）、`rangeUnit`（yd/km/nm）、`shellColor`、`signals` |
| `sandbox.kind` | `"naval"`：3D 按钮打开海战沙盘 |
| `ui.extraLayers` | 海战层读取的图层开关：`tracks`（航迹图）、`gunfire`（炮火与鱼雷）、`ranges`（射程圈）、`chart`（海图网格） |

变速播放时，2D 事件标记的显示窗口按播放时长换算（`time.hoursPerSec` 下的 2 小时前 / 16–30 小时后），分钟级交火中的事件不会同时铺满战场。舰载机（`type: "air"` 且上级是舰船，用 `active.to` 标出回收时刻）回收后 15 分钟内消失。

海战战役的控制区用 `control.mode: "air"`（两个可重叠、跨越海面的原始区域，如「袭击舰活动海域」与「搜索群警戒海域」）。

## 4. 2D 海战层

- **舰船剪影**：俯视轮廓按舰种与 `silhouette` 绘制（炮塔、烟囱、舰桥、弹射器），随航向旋转；低于 `tacticalZoom` 时是固定大小的「标绘棋子」，之上按真实舰长放大（夹在 `shipPx` 内）；阵营色舰体、舰名标签、航速矢量；终止状态（沉没、自沉）后淡出并留下残骸标记
- **尾迹与航迹图**：舰尾白色尾迹（`wakeMin` 分钟）；航迹图图层画出至今的完整航迹与时刻刻度（战术缩放下每 `trackTicks` 分钟一个「0620」式标注，大洋缩放下每 `fleetTicks` 小时一个日期标注），仿英方战报的航迹图
- **炮火**：炮口闪光 → 弹道（带抛物线高度感的弧线与曳光）→ 目标周围的水柱（口径决定大小，偶尔跨射），命中时火光与黑烟，起火的舰船持续冒烟；暂停时画射击线与距离（码）
- **鱼雷**：细虚线航迹与雷头气泡
- **烟幕**：沿航迹铺开的灰白烟团，随时间变淡变宽
- **射程圈**：选中舰船时画出各武器的最大射程
- **海图网格**：放大后出现经纬度分格（度/分标注）与海里比例尺

## 5. 3D 海战沙盘

`sandbox.kind = "naval"`（`engine/three/naval/NavalSandbox.ts` 编排 `ocean` `land` `fleet` `gunnery` `fx` `geo` 各模块）：海面（Gerstner 波浪着色器、远景雾、按 `time.utcOffset` 计算的太阳与天光，夜间有星光与月色）、海岸与港口（陆地多边形与高程）、真实舰型模型（`model`）、尾迹与舰首浪、炮口闪光、弹道曳光、水柱、命中火光与黑烟、烟幕粒子、鱼雷航迹、舰载机；镜头可环绕、跟随选中舰船，或回到交战海域总览。位置使用压缩比例（舰船模型放大，距离不变）以便同屏看到整场交战，可在「兵棋比例 / 真实比例」间切换。局部切平面以镜头焦点为原点，焦点移出 250 公里时整体平移（浮动原点）；炮火只在正向连续播放时按 `gunnery.salvoWindow` 放出，跳转时清空。
