# 武汉会战（wuhan-1938）

1938年2月18日—10月27日，抗战初期最大规模会战的中文历史推演。

- **时间窗**：以 2·18 武汉首次空战为前奏起点，6·11 日军通告溯江作战为会战主体开端，10·25 弃守—10·27 三镇全陷结束。
- **空间**：豫皖赣鄂四省，bbox 112.0—118.5°E / 28.0—33.5°N，8192 大画布。
- **阵营**：JP（日本，推进方 A 槽）/ CN（中国）；`sideOrder: ["CN","JP"]`。

## 待办清单（生成器模板，已完成项打勾）

- [x] `config/geo.config.json`：borders 用 `world_1938`，ids 把 **Chinese warlords → CN**（源数据无 "China"）、Empire of Japan → JP；masks bits 0=CN、1=JP；rivers 补长江/汉水/赣江/黄河/淮河中文名；lakes 补鄱阳湖/洞庭湖/梁子湖/巢湖/洪泽湖/太湖；forest 大别山/幕阜山/庐山三处、marsh 黄泛区。
- [x] 地图资产：`sh tools/geo/run.sh wuhan-1938`（含 DEM z9，华中 110 张瓦片）。
- [x] `data/sources`（26）、`data/gazetteer`（88）、`data/oob`（jp 19 + cn 47）、`data/fronts`（22 帧，`pipeline/make_fronts.py` 生成）、`data/events.json`（34）、`data/routes`（6）、`pockets`（万家岭）、`demarcation`（3）、`overlays`（黄泛区+阻塞线）、`equipment`（8）、`forces.json`。
- [x] `campaign.json` 全字段（7 阶段、16 marks、pace、map.labels、audio、intro、credits、hub order 11、validation）。
- [x] 照片：`pipeline/fetch_photos.py` 抓 Commons 原图 11 张 → webp + `photos/index.json` + `photo-evidence.json`；`credits.json` 的 photos/geography/music 已同步。
- [x] `npm run validate -- --campaign wuhan-1938` → 0 错误 0 警告。

## 史实口径要点（写入 intro/credits/tests）

- **伤亡多口径并列**：日方官方《中国事变陆军作战史》约 3.1—3.5 万；日方部队史推算 5.5—7 万另加战病 10 万+；学界 5/7/10/15/20 万+ 诸说并存；中方战时战报 25.6 万系高估。中方军委会统计自身伤亡 254,628 人，官方通说约 40 万。面板不取单一数字。
- **万家岭**：中方「歼敌万余」 vs 日方人马现员表推算「自定员除名约 6500—6600 人」（不含轻伤现地住院者），两口径并列；「张灵甫奇袭张古山」无同期电报佐证，不采用。
- **日期异说**：安庆 12/13 日、湖口 4/5 日、太湖—宿松—黄梅（7/26—8/4 逐次 vs 8/3 同陷）、潢川 16—19 日间，取多数中方档案与《畑俊六日誌》交叉后的日期，事件注记标异说。
- **首帧 1937 战线**：南京—芜湖以东为 1937 年淞沪、南京战事形成的出发概势（另行绘制，非 world_1938 政治图），非精确界线。
- **花园口**：标 `atrocity`；决堤为国民政府自决（当时宣传为日机轰炸，档案解密后证实）；军事效果有易劳逸「推迟三个月」说 vs 马仲廉「时间表未变」修正说，并列。
- **毒气战**：日军奉最高统帅部命令使用（吉见义明/松野诚也档案），标 `atrocity`，潢川 835 枚赤筒有日方自认。
- **地名对照**：广济=今武穴梅川镇、星子=今庐山市、鄂城=今鄂州、应山=今广水、经扶=今新县、箬溪=今武宁鲁溪镇、马头镇（瑞昌）≠马当（彭泽/东至）。宜昌、南京在画布边缘代表点。

## 资产复现

```bash
sh tools/geo/run.sh wuhan-1938                 # 地图资产（--skip-dem --from vectors 可快速重建矢量）
.venv/bin/python campaigns/wuhan-1938/pipeline/make_fronts.py     # 重建 fronts 22 帧
.venv/bin/python campaigns/wuhan-1938/pipeline/fetch_photos.py    # 重抓照片（需网络）
npm run validate -- --campaign wuhan-1938
```

研究底稿：`docs/research/wuhan-1938-part1-strategy-oob.md`、`docs/research/wuhan-1938-part2-battle-course.md`；读取记录 `pipeline/research.json`。
