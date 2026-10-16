# 拉普拉塔河口海战（river-plate-1939）

1939 年 9 月 26 日至 12 月 21 日：施佩伯爵号的南大西洋袭击航程、英法猎杀群、12 月 13 日的白昼炮战与尾随、蒙得维的亚的 72 小时与自沉。第一个使用海战引擎（[docs/NAVAL.md](../../docs/NAVAL.md)）的战役。

## 时钟

叙事时钟是英方舰钟 **Zone +2（UTC−2）**——哈伍德战报、英国海军部 1940 年小册子与新西兰官方史都用它，德方记录与之相差不过几分钟。蒙得维的亚 1939 年 12 月是 UTC−3（乌拉圭夏令时），**当地时间 = 舰钟 − 1 小时**：自沉在舰钟 20:54，即当地 19:54，早于乌拉圭规定的 20:00 期限。研究依据见 `docs/research/battle.md` §2 与 `docs/research/montevideo.md` §0–1。

## 数据从哪里来

| 文件 | 生成方式 |
|---|---|
| `docs/research/*.md`、`battle_tracks.json`、`ships.json` | 研究笔记：来源表、逐分钟时间线、争议点；战斗日航迹按哈伍德 05:20 定位（34°34′S 49°17′W）+ N.I.D. 航迹图数字化 + 推算 |
| `pipeline/build/fleet.py` | 舰船编成（`pipeline/units.json`）与三段航迹（`pipeline/tracks/{battle,raid,montevideo}.json`）；远洋航程为示意 |
| `pipeline/build/merge.py` | 合并为 `data/oob/<阵营>.json` |
| `pipeline/build/naval.py` | `data/naval/*.json`：射击、命中、鱼雷、烟幕、损伤、电文 |
| `pipeline/build/reference.py` | 来源、地名、控制区关键帧（英方研判的袭击舰海域 / 猎杀群警戒海域）、泛美安全区、装备、兵力 |
| `pipeline/build/events.py` | `data/events.json`（45 条，地点缺省取相关舰船当时的位置；须先跑 merge.py） |
| `pipeline/scripts/fetch_photos.py` | Commons 照片（核实许可）→ `public/campaigns/river-plate-1939/photos/` |

全部重建：

```bash
cd campaigns/river-plate-1939 && python3 pipeline/build/fleet.py && python3 pipeline/build/merge.py && python3 pipeline/build/naval.py && python3 pipeline/build/reference.py && python3 pipeline/build/events.py
```

## 已知的简化

- 袭击航程、阿尔特马克号与猎杀群的远洋航迹只按会合与截击地点连线（置信度 low），不是逐日船位。
- 施佩伯爵号被 6 英寸弹命中的时刻多为示意（`precision: approx`），德方只给出总数（8 英寸 2 发、6 英寸 18 发）。
- 抛锚时刻取英国海军部 1940 年的 00:10，哈伍德战报作 00:50；施佩伯爵号 07:22 的鱼雷按德方记述只计 1 条。争议见研究笔记 §7。
- 法国 X 舰队以迪普莱号一舰代表；3D 借用郡级重巡洋舰模型。
