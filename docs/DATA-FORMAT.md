# 数据格式 v2

一个战役包 = `campaigns/<id>/`：

```
campaign.json            清单（schemaVersion 2）
campaign.ts  main.ts  index.html   入口（由 new-campaign 生成，通常不用改）
campaign.css             可选：本战役专属的样式微调
config/frame.json        投影与画布（tools/geo/emit_frame.mjs 生成，勿手改）
config/geo.config.json   地理管线参数
config/lod.json          棋子分级显示
data/                    史实数据（下文）
pipeline/  docs/  tests/ 离线脚本、文档、战役测试
parity.accepted.json     迁移期的旧版对比记录（新战役不需要）
```

大体积资产在 `public/campaigns/<id>/`：`geo/`（矢量、场掩膜）、`tiles/`、`terrain/`、`photos/`（含 `index.json` 署名索引）、`audio/`、`credits.json`。

校验：`npm run validate -- --campaign <id>`。结构由 `engine/schema/zod.ts` 定义，运行时类型在 `engine/core/types.ts`。

## 通用约定

| 项 | 约定 |
|---|---|
| 时间 | `'YYYY-MM-DDTHH:mm'`，战役的叙事时区（`time.tzLabel` 说明），按 UTC 计算相对小时；必须是真实日历日期 |
| 坐标 | `[经度, 纬度]`（WGS84 小数度），或地名引用 `'@placeId'`（指向 `data/gazetteer/`） |
| 阵营 | `campaign.json` 的 `sides[].id`（2–4 个大写字母），部队 id 前缀为 `sides[].prefix`：`de.7pz` |
| 来源 | 几乎所有对象都有 `sources: string[]`，引用 `data/sources/*.json` 的 id；`confidence: high/medium/low` |
| 中文 | 名称对象 `{ zh, orig?, short? }`：`orig` 为当时原文，`short` 为棋子上的短标签 |

## campaign.json

| 段 | 内容 |
|---|---|
| `id` `status` | id 须与目录名一致，形如 `<地名>-<年份>`；status：`published` / `draft`（只在开发服务器）/ `planned`（只在总台） |
| `title` | 年份章、中文名、副题、英文名、原文名、行动代号、页面标题与描述、图标色 |
| `time` | `epoch`（相对小时的零点）、`start` / `end`（可播放区间）、`dataEnd`、`tzLabel`、`hoursPerSec` |
| `sides` | 每方：`id` `prefix` `name` `coalition`（axis/allies/comintern/neutral）、棋子配色 `counter`、页面色 `css`、箭头色、3D 色、缺省模型、导演飞机颜色与入场方向 |
| `control` | `mode`（territory / air）、`landBit`、`theatreBits`、`deferred`（延迟并入战区的比特与时刻）、`slots`（1–2 个占领槽：`key` 对应 fronts 文件里的键、图例文字、本土比特、纹样与配色）、`remainder`（剩余战区） |
| `phases` `marks` | 阶段（开始时刻、名称、简称、说明、可选镜头中心）、时间轴标记 |
| `theme` | 主题色、战区国界色、剩余战区底色 |
| `map` | 全图适配（整个画布或经纬度框）、3D 起始中心、六角格尺寸、加粗边界的国家、国家与海域大字、地名引线偏移、区域按钮、实时占位等 |
| `sandbox` | 3D：高程夸张、手办尺寸、镜头、雾、软件渲染回退 |
| `director` | 运镜方式（point / frame）、驻留后的回位方式、驻留时长、缺省缩放、警报规则 |
| `audio` | 配乐时间表或单曲底乐、战场氛围强度曲线、开场号角、音效别名、音量面板 |
| `ui` | 图层开关、章节导航、时间轴选项、简报/态势/图例/战斗序列的文字与布局、部队模型说明 |
| `intro` `credits` | 开场档案文字（可用 `{units}` `{events}` `{keyframes}` 等占位）、资料面板的地理数据说明 |
| `hub` | 总台卷宗：行动代号（中文与原文；没有代号的战役写通行名称）、火漆印位置、模板字（`stencil`，缺省取 `title.en`）与方位、分区（`region`，缺省按火漆印位置）、战区轮廓（总台底图国家 id 或经纬度框）、封面照片、简介、嵌套于哪个战役 |
| `validation` | 战役专属校验规则：`speeds`（日行程上限）、`slotEmptyBefore`（某槽在某时刻之前须为空）、`eventCount`、`bodyLength` |

所有可选字段的缺省值与含义见 `engine/campaign/types.ts`。

## data/ 目录约定

| 路径 | 内容 |
|---|---|
| `sources/*.json` | `Source[]`：`{ id, title, author?, year?, url?, license? }` |
| `gazetteer/*.json` | `Place[]`：`{ id, zh, orig, alt?, pos, kind, rank(1–4), country? }`，kind：capital/city/town/village/fort/port/crossing/region/forest/river/airfield/sea/radar |
| `oob/*.json` | `Unit[]`，每方一个文件为宜 |
| `routes/*.json` | `Route[]` |
| `fronts/<时刻>.json` | 一个控制区关键帧；文件名 = `at` 把冒号换成连字符，如 `1940-05-10T05-00.json` |
| `events.json` | `HistEvent[]`，按时间排序 |
| `pockets.json` | `Pocket[]` 包围圈 |
| `demarcation.json` | `Demarcation[]` 分界线 |
| `overlays.json` | `Overlay[]` 静态叠加层（空域分区、雷达圈、防线） |
| `equipment.json` | `Equipment[]` 装备卡 |
| `forces.json` | 兵力概况 |
| `ext/<插件>/<名>.json` | 插件自有数据，原样交给插件（`db.ext[插件][名]`） |

不认识的文件会被校验报错，避免数据放错位置后静默失效。

### Unit（部队）

```json
{ "id": "de.7pz", "side": "DE", "echelon": "division", "type": "armor", "parent": "de.xv",
  "name": { "zh": "第7装甲师", "orig": "7. Panzer-Division", "short": "7.Pz" },
  "commander": { "zh": "隆美尔" }, "model": "pz38t", "strength": { "men": 14000, "tanks": 218 },
  "equipment": [{ "id": "pz38t", "count": 91 }], "active": { "from": "1940-05-10T00:00" },
  "track": [{ "at": "1940-05-10T05:00", "pos": "@prum", "status": "active" },
            { "at": "1940-05-13T16:00", "pos": [4.88, 50.27], "status": "engaged" }],
  "history": "单位卡简史…", "sources": ["frieser"], "confidence": "medium" }
```

- `echelon`：armygroup / front / command（只作标签与树） · army / air_fleet / air_group · corps / sector / wing · division / brigade / regiment / group / ship / squadron / gruppe
- `type`：hq armor light motorized infantry mountain cavalry cavalry_mech border fortress naval marine artillery reserve airborne air aviation fighter bomber
- `track[]`：时间严格递增；`status` 从该点起生效（reserve active engaged encircled withdrawing destroyed surrendered interned disbanded evacuated ineffective inactive，后七种为终止状态，之后淡出）；`movement`（land/sea/air/rail）表示从该点到下一点的移动方式；空战用 `flightPhase`（at_base/outbound/engaged/returning）与 `altitudeM`
- 上级单位可以没有轨迹（取下属质心）；`display: "container"` 表示有下属时不作为棋子显示；`base` 为空军基地；`schematic` 表示位置是编排示意

### Route（推进路线）

`{ id: "r.…", side, unit, style: main|secondary|counter|retreat|breakout, widthKm, movement?, role?, until?, fadeHours?, label?, waypoints: [{ at, pos }…], sources, confidence }`
陆上路线画成渐进箭头；`movement` 为 sea / air 时画成虚线航迹。`role` 是语义角色（landing、evacuation、raid、escort、intercept…），空战出击按角色重放编队。

### ControlKeyframe（控制区关键帧）

```json
{ "at": "1940-05-15T12:00", "control": { "DE": [[[ [4.9, 50.3], "@sedan", … ]]] },
  "transition": "step", "note": "色当突破", "sources": ["frieser"], "confidence": "medium" }
```

`control` 的键是 `campaign.json` 的 `control.slots[].key`，值是多边形数组（多边形 = `[外环, 洞…]`，环不必闭合，至少 3 点，不得自相交）。缺省的槽为空。程序会把占领区裁剪到战区陆地（空战模式除外），所以多边形可以粗略地越过海岸线。

### HistEvent（事件）

`{ id: "e.…", at, endAt?, category: battle|air|naval|political|atrocity|movement|surrender|siege, importance: 1|2|3, precision?: day|hour|minute, side?, title, body（中文 80–140 字）, place, units?, photo?: { commons: "File:…", caption }, sfx?, zoomRel?, wide?, narration?, mapNote?, airAction?, sources, confidence }`

- `importance` 1 和 2 在导演模式下驻留讲解（4× 以上速度只驻留 1）
- `photo.commons` 必须在 `public/campaigns/<id>/photos/index.json` 中有署名条目
- `zoomRel` 为相对全图的缩放；`wide: true` 表示事件覆盖全线
- `sfx` 为音效 id（共享 sprite 与合成器：typewriter bell stamp paper explosion artillery stuka bomber engine tank ship_gun siren radio morse mg rifle march cavalry fighter air_siren…）

### 其他

- **Pocket**：`{ id: "p.…", name, start, end, anchor（须在包围圈内）, fate: surrendered|broke_out|relieved|destroyed|handed_over, units?, sources }`
- **Demarcation**：`{ id, name, at, until?, line: Pos[], style?: pact|final, sources }`
- **Overlay**：`{ id, layer, kind: polygon|range|line, label?, polygons? | pos+rangeKm? | line?, style? }`，`layer` 对应 `ui.extraLayers` 中的图层开关
- **Equipment**：`{ id, side, name, class, crew?, weightT?, armorMm?, gun?, speedKmh?, count?, model?, photo?, desc（60–140 字）, sources }`
- **forces.json**：`{ sides: { <阵营>: { name, commander, men?, divisions, tanks?, aircraft?, guns?, losses: { killed, wounded, captured?, tanks?, aircraft? }, note? } }, byPhase?: { <阶段 id>: { … } }, sources }`；数字缺省或 `null` 显示为「—」；`byPhase` 需要 `ui.brief.byPhase` 才会显示

## 3D 模型

`model` 与 `sides[].defaultModel` 必须是已注册的模型（`engine/three/models/`）：坦克与装甲车（pz1–pz4、pz35t、pz38t、sdkfz231、7tp、tks、wz34、t26、bt7）、步兵与骑兵（inf_de、inf_pl、inf_su、inf_gb、inf_gr…、cav_pl、cav_su、para_de）、火炮 art_gun、示意标记（navy_token、air_token、inf_allied）、1940 年飞机（spitfire、hurricane、bf109、bf110、he111、do17、ju87、ju88）。新模型用 `registerModel(id, def, spec)` 注册并在 `specs.ts` 写明真实尺寸，`tests/engine/models.test.ts` 会检查三角形预算与尺寸误差。
