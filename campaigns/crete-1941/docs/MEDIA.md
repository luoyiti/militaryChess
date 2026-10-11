# 克里特岛版本媒体来源

保留法国版本原有照片、音乐、音效和字体。本版本补充的 6 张克里特岛历史照片与 1 张地图逐字节复用本地 `BalkansCampaign-1941` 已归档媒体；未改动该目录。2026-10-11 重新读取 Commons 的照片说明、作者与许可，以及地图出版信息。照片详情写入 `public/photos/index.json` 与 `public/credits.json`，地图详情写入 `public/history/index.json`。

## 战场照片

| 文件 | 内容与日期 | 作者／档案 | 来源 |
| --- | --- | --- | --- |
| `photos/balkans/airdrop.webp` | 1941-05-20，德军伞兵与 Ju 52 | Australian armed forces；AWM P00149.004 | [Commons](https://commons.wikimedia.org/wiki/File:German_paratroopers_and_Ju_52_over_Crete_1941.jpg) |
| `photos/balkans/maleme-airfield.webp` | 1941 年 5 月，马莱迈机场的 Ju 52 | RAF；英国官方战史 | [Commons](https://commons.wikimedia.org/wiki/File:Maleme_airfield_Crete_with_Ju_52s_1941.jpg) |
| `photos/balkans/ju52-burning.webp` | 1941 年 5 月，被防空火力击中的 Ju 52 | Royal Navy official photographer；IWM A 4154 | [Commons](https://commons.wikimedia.org/wiki/File:Junkers_Ju_52_burning_over_Crete_1941.jpg) |
| `photos/balkans/fortysecond-street.webp` | 约 1941-05-26，四十二街路牌；不是反击瞬间 | 佚名；AWM P03731.001 | [Commons](https://commons.wikimedia.org/wiki/File:Australian_sign_at_Forty_Second_Street_on_Crete_1941_(AWM_P03731_001).jpg) |
| `photos/balkans/crete-evacuation-tea.webp` | 克里特撤离官兵抵达埃及后领取茶水；不强行确定拍摄日 | L. B. Davies／No. 1 AFPU；IWM E 3295 | [Commons](https://commons.wikimedia.org/wiki/File:The_Battle_For_Crete,_20_-_31_May_1941_E3295.jpg) |
| `photos/balkans/crete-alexandria-arrival.webp` | 1941-06-01，澳新军抵达亚历山大港 | George Silk；AWM C29331 | [Commons](https://commons.wikimedia.org/wiki/File:ANZAC_troops_arriving_in_Alexandria_after_the_Crete_campaign_7477379.JPG) |

各照片 Commons 文件页列为公共领域（澳大利亚作品保护期届满、英国政府旧照片或官方战史）。索引保留原作者、来源、许可链接、原图 URL 和归档文件 SHA-256。照片沿用此前的 WebP 转换，无新增裁切或内容修改。`commons` 键直接匹配事件卡 `eventCard.ts` 的现有照片查找方式。

## 历史地图

`history/crete-1941.jpg`：*The Seizure of Crete (Operation MERKUR)*，美国陆军 1953 年 *The German Campaigns in the Balkans (Spring 1941)* 第 7 图。美国联邦政府作品，公共领域（美国）。[出版来源与图目录](https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/index.html)。

这是战后官方战史中的概略地图，适合作为档案阅读材料；不是 1941 年实时指挥图，也不用于替代推演的地理底图。保留原比例尺、图例和边缘标注。

## 英语讲解

新增 `audio/narration.json` 和 5 个 `audio/narration/crete-*.mp3` 文件，总长约 94.5 秒。使用已安装的 macOS Daniel（en-GB）语音生成，并经 FFmpeg 转为单声道 44.1 kHz／96 kbps MP3。**这是现代合成英语讲解，不是历史录音，也未克隆历史人物的声音。** 英文文本是本项目依据下列资料编写的简短概要；全文、来源、时长和 SHA-256 均在 manifest 中。

| 阶段 ID | 时间轴锚点 | 讲解内容 | 史料 |
| --- | --- | --- | --- |
| `landing` | 1941-05-20 08:00 | 空降开始与首日抵抗 | [NZ History，days 1–3](https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-1-3) |
| `maleme` | 1941-05-21 18:00 | 马莱迈空运与次晨反攻 | [NZ History，days 1–3](https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-1-3) |
| `west` | 1941-05-24 12:00 | 西部战线后退与加拉塔斯战斗 | [NZ History，days 4–6](https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-4-6) |
| `retreat` | 1941-05-27 12:00 | 四十二街与南撤 | [NZ History，days 7–9](https://nzhistory.govt.nz/war/the-battle-for-crete/retreat-days-7-9) |
| `aftermath` | 1941-06-01 12:00 | 最后一夜撤离后的被俘与逃脱 | [NZ History，capitulation and capture](https://nzhistory.govt.nz/war/the-battle-for-crete/capitulation-capture) |

以上时刻为阶段播放锚点，不代表史料中每句叙述的精确发生时分。原有钢琴配乐和战场音效继续保留；这些也不是克里特战役现场录音。重新生成旁白：`python3 scripts/assets/crete_narration.py`（需 macOS、Daniel 语音与 FFmpeg）。

验证：6 张照片 SHA-256 与来源项目归档一致；历史地图已目视检查；5 段 MP3 均通过 FFmpeg 完整解码，时长 18.3–19.3 秒。网页按钮与浏览器音频播放由主项目集成验证。
