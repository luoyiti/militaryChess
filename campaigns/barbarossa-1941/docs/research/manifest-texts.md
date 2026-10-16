# 清单文字（媒体代理 → 整合者）

机读版本：`pipeline/manifest/texts.json`（键名对应 `campaign.json` 的路径，`phases` 按阶段 id 给出 `sub`）。
整合者把这些字段合并进 `campaign.json` 即可；本文件说明取舍和需要整合者顺手修改的地方。

## 合并清单

| campaign.json 路径 | 来源（texts.json） | 说明 |
|---|---|---|
| `title.sub` `title.description` | `title` | 副题改为「巴巴罗萨行动 · 东线战旗推演」 |
| `intro.*` | `intro` | 全部替换「待补」占位；`photo` / `photoFallback` 是 Commons 文件名，已在 `photos/index.json` |
| `ui.brief.title/sub/sub2/fine` | `ui.brief` | **同时请设 `ui.brief.byPhase: true` 和 `ui.brief.notes: "details"`**，否则 `forces.byPhase` 不显示（validator 现有 5 条 WARN 即因此） |
| `phases[i].sub` | `phases.<id>` | 五个阶段的副题，替换「待补」 |
| `marks` | `marks` | 9 个时间轴标记（柏林时间） |
| `map.labels` | `map.labels` | 国家/地区大字 12 个，海域与地形 9 个 |
| `hub.codename/codenameOrig/cover/blurb` | `hub` | `codenameOrig` 建议改为简洁的 `BARBAROSSA`；封面见下 |
| `credits.geodata` `credits.sections` | `credits` | 加了 CShapes 一行与 1941 边界脚本说明 |
| `audio.music/intensity/introSting/introMusic` | `audio` | 只用共享曲库 id |

## 开场档案（intro）

- **stamp**：`GEHEIM · СЕКРЕТНО · 绝密`（德、俄、中三语）
- **kicker**：`作战档案 No. 1941/VI`
- **en**：`Operation Barbarossa · Unternehmen Barbarossa`
- **paragraphs**：两段——开战（时间、规模、盟国、三路目标）与战役弧线（五大包围圈 → 列宁格勒被围、基辅等城失守 → 泥泞严寒 → 12 月 5 日反攻）。数字取常见值：约 300 万人（东线陆军 305 万）、三千余辆坦克（詹茨 3,332 辆 + 指挥坦克）。
- **how**：含 `{units}` `{keyframes}` `{pockets}` `{events}` 四个占位，句式与波兰战役一致。
- **note**：加了时区提示「时间为柏林时间（莫斯科时间 +1 小时）」。
- **照片**：`File:German troops crossing the Soviet border.jpg`（约翰内斯·黑勒摄，宣传连 637，公有领域；画面为步兵炮与马车经过苏联国界界桩，远处浓烟）。竖幅，开场相框最大高度 300 px，适合。
  备用：`File:Początek wojny niemiecko-radzieckiej (2-646).jpg`（波兰国家数字档案馆藏德方照片，公有领域；德军经立陶宛边境哨卡越境）。

## 侧栏简报（ui.brief）

- `fine` 说明了三种口径：苏方「不可挽回损失」（克里沃舍耶夫：阵亡、伤重不治、非战斗死亡、失踪与被俘），德方陆军卫生报告与哈尔德日记的累计伤亡，以及分阶段数字的含义。
- 侧栏伤亡表只显示 `killed` / `captured` 字段第一个括号前的部分（≤ 22 字），`forces.json` 已按此把关键数字写在最前面，例如「不可挽回 58.9 万（…）」「伤亡合计 52.3 万（…）」，避免把累计伤亡误读成阵亡。
- 七方并列时兵力条较多；`sideOrder` 可考虑 `["DE","FI","RO","HU","SK","IT","SU"]`。`byPhase` 各阶段只给有可靠数字的方（多为 DE、SU，台风阶段另有罗马尼亚敖德萨损失），其余方在该阶段不显示。

## 阶段副题（phases[].sub）

| id | sub |
|---|---|
| border | 明斯克合围，杜布诺坦克战，波罗的海三国沦陷，德军强渡西德维纳河 |
| smolensk | 斯摩棱斯克鏖战，叶利尼亚突出部，乌曼合围，卢加防线与敖德萨被围 |
| kiev | 基辅大包围，列宁格勒遭封锁，塔林撤退，德军叩开克里米亚门户 |
| typhoon | 维亚济马—布良斯克合围，泥泞期，莫扎伊斯克防线，哈尔科夫与季赫温失守 |
| moscow | 冻土上的最后攻势，罗斯托夫光复，季赫温反击，红军转入反攻 |

## 时间轴标记（marks）

开战 06-22 03:15 · 明斯克失守 06-28 · 斯摩棱斯克 07-16 · 列宁格勒被围（什利谢利堡）09-08 · 基辅陷落 09-19 · 台风行动 10-02 05:30 · 莫斯科戒严 10-19 · 罗斯托夫光复 11-29 · 莫斯科反攻 12-05。均为柏林时间；只知日期的取示意时刻。

## 地图大字（map.labels）

格式：国家 `[名称, 经, 纬, 字号, 最小相对缩放]`；海域/山脉 `[名称, 经, 纬, 字号, 是否山脉, 最小相对缩放]`。

- 国家与地区：苏 联（大字，置于梁赞—坦波夫一带，避开莫斯科、图拉地名）、芬 兰、罗 马 尼 亚、匈 牙 利、斯 洛 伐 克、东 普 鲁 士、波 兰 总 督 府，以及苏联境内的乌 克 兰、白 俄 罗 斯、立 陶 宛、拉 脱 维 亚、爱 沙 尼 亚。后五个在 1941 年是苏联的加盟共和国（波罗的海三国 1940 年被吞并），作为地区名用小字、较大缩放才出现。
- 海域与地形：波 罗 的 海、芬 兰 湾、里 加 湾、黑 海、亚 速 海、普 里 皮 亚 季 沼 泽（地区，`mountain=false`）、喀 尔 巴 阡 山 脉、瓦 尔 代 丘 陵、顿 涅 茨 岭（山地，`mountain=true`）。湖泊（拉多加湖、奥涅加湖、伊尔门湖、楚德湖）由矢量图层自动标注，不在此重复。
- 坐标是按经纬度估的，需要在开发服务器上看一眼是否压到城市名或海岸线（尤其「黑 海」「波 罗 的 海」靠近地图边缘）。

## 总台卷宗（hub）

- `codename` 巴巴罗萨行动；`codenameOrig` `BARBAROSSA`。
- `cover`：`photos/rian-archive-669663-soviet-troops-head-to-front-lines-af-0505de.webp`——1941 年 11 月 7 日红场阅兵后直接开赴前线的部队（阿纳托利·加拉宁摄，RIA Novosti，CC BY-SA 3.0）。横幅，适合总台 4:3 裁切；画面是雪中莫斯科大街上的坦克与士兵，概括了战役以莫斯科城下的转折收尾。备选封面：`File:Prigionieri Armata Rossa sacca di Kiev.jpg`（基辅包围圈战俘长队，公有领域）、`File:Początek wojny niemiecko-radzieckiej (2-646).jpg`（越境）。
- `blurb`（58 字）：德军三百万人沿千公里战线越境，包围圈接连吞没数百万红军；列宁格勒被围，基辅陷落，攻势终在莫斯科城下被严寒与反攻所阻。

## 资料面板（credits）

geodata 四行：Natural Earth、world_1938（注明按 `pipeline/geo/borders_1941.py` 修补为开战时边界）、CShapes 2.0（CC BY-NC-SA 4.0；地理管线脚本并不直接读取 CShapes，这一行与波兰战役一样表示核对边界时的参考，若 fronts / 边界脚本作者没有参考它请删去）、Terrarium 地形瓦片。`sections` 与波兰相同（照片、音效、音乐、字体）；`credits.json` 的 `photos` 段由 `fetch_photos.py` 生成（96 张），`music` 段目前为空——共享曲库的署名若需要出现在本战役面板里，由整合者按其他战役的做法补上。

## 配乐（audio）

共享曲库只有 polonaise（肖邦波兰舞曲）、elegy（肖邦葬礼进行曲）、hejnal（克拉科夫号角）、operations（原创作战室器乐）。前三首都带波兰语境，本战役建议：

- `music`：06-22 起 `operations` → 09-19 12:00（基辅陷落、随后娘子谷）`elegy` → 10-02 05:00（台风行动）回到 `operations`。也可以改用 `mode: "bed"` + `bedTrack: "operations"` 单曲循环。
- `intensity`：开战 0.8，斯摩棱斯克阶段 0.6，基辅 0.65，台风 0.75，10 月下旬泥泞期 0.45，11 月 15 日第二次攻势 0.6，12 月 5 日反攻 0.8。
- `introSting`：`radio`（电台杂音，呼应莫洛托夫的广播；缺省的 `fanfare` 与 `hejnal` 都是克拉科夫号角，不宜用于本战役）；`introMusic`：`operations`。
