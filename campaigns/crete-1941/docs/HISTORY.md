# 克里特岛战役：数据与史料说明

本项目独立复用法国/波兰战役引擎与资产，并将已有巴尔干战役中的克里特章节整理为专门战役。时间为1941年5月20日00:00至6月1日23:59。生成入口为 `python3 scripts/seed_campaign.py`，只写本项目数据和关键帧列表。

## 图面约定

- 上午马莱迈、干尼亚空降与下午雷西姆诺、伊拉克利翁空降分别标注；第5山地师从21日起空运。首日零散空降据点不等于夺取机场。
- 第22营、20营、28毛利营等战斗在所属旅卡和事件说明中交代。德国四个团级空降群沿用引擎旅级符号，简称标识实际团号；地区分遣队及国别树是导航编组，不宣称另有正规军部。
- 第5山地师轨迹表示北岸作战重心，东进点代表先头分遣队；第100山地团南追单列，避免把全师画成先东进再横穿全岛返西。后者的快速东进因此仍会触发步兵速度复核提示。
- 伊拉克利翁海撤走海路绕岛东端；南岸斯法基亚通过白山山道到达。希腊驻岛部队不自动随英联邦部队撤至埃及。
- 战线是概略控制范围，须裁到克里特陆地。运输机和舰船不产生地面占领。SU为继承引擎保留槽，始终为空；DE槽合并显示轴心控制，包括东部意军登陆区。
- 20日07:59以前无轴心控制区；雷西姆诺机场保留守军控制洞直到30日；斯法基亚保留至31日最后一夜海撤。6月1日全岛着色表示有组织战役结束，山区仍有人逃脱和抵抗。
- 位置是地名或防区重心，路线为说明性线段，不声称精确战术轨迹。事件的 day 为日期精度，hour 为约略时段；08:00首批空降也是约数。未知兵力与装备数量存为null，不可当作0或重复累计。

## 已在线核对的史料（2026-10-11）

1. [NZHistory：第1—3天](https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-1-3)：四处空降、107高地撤出、21日空运、22日反攻。
2. [NZHistory：第4—6天](https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-4-6)：普拉塔尼亚斯、加拉塔斯及25日晚约20时反击。
3. [NZHistory：第7—9天](https://nzhistory.govt.nz/war/the-battle-for-crete/retreat-days-7-9)：四十二街与向南撤退。
4. [NZHistory：第10—12天](https://nzhistory.govt.nz/war/the-battle-for-crete/evacuation-days-10-12)：海撤、雷西姆诺30日投降、第100山地团追击及后卫战。
5. [NZHistory：投降与被俘](https://nzhistory.govt.nz/war/the-battle-for-crete/capitulation-capture)：6月1日残留守军与后续逃脱。
6. [NZHistory：概览](https://nzhistory.govt.nz/war/the-battle-for-crete/overview)：新西兰死亡671人、被俘2180人。不同页面对伊拉克利翁撤离人数有约4000与6000之差，事件不写死该总数。
7. [Australian War Memorial：Greece, Crete and Syria](https://www.awm.gov.au/collection/C1417307)，Gavin Long，1953，第10—14章：官方战史及雷西姆诺、伊拉克利翁与撤退地图入口。
8. [美国陆军战史：Operation MERKUR](https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-4.html)，George E. Blau，1953：组织序列、空海运输及约25000人的入侵编组。此数字不是20日同时登岛人数。页面为HyperWar保存的美国陆军出版物。

事件保留来源ID。中文为事实性改写；照片、档案地图及英语音轨性质见 `docs/MEDIA.md` 和资产清单。

## 验证

`node --import tsx scripts/validate/validate_data.ts` 检查数据结构、引用、时间、坐标、战线与编组。

`npx vitest run tests/campaign.test.ts` 检查六方部队、四处空降、机场不同结局、最终海撤、希腊守军结局与出处引用。
