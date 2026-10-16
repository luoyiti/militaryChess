#!/usr/bin/env python3
"""巴巴罗萨行动（媒体代理）：生成 data/equipment.json、data/forces.json、pipeline/events/strategic.json。

数据定义在同目录的 media_equipment.py / media_forces.py / media_events.py；本脚本只做排序、长度与引用检查后写出。
用法（仓库根目录）：.venv/bin/python campaigns/barbarossa-1941/pipeline/scripts/assets/build_media_data.py
写完后运行 fetch_photos.py 下载新引用的照片，再 npm run validate -- --campaign barbarossa-1941。
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from media_equipment import EQUIPMENT  # noqa: E402
from media_events import EVENTS  # noqa: E402
from media_forces import BY_PHASE, SIDES, SOURCES  # noqa: E402

CDIR = HERE.parents[2]
ISO = re.compile(r"^1941-(0[6-9]|1[0-2])-\d\dT\d\d:\d\d$")
SIDE_IDS = {"DE", "FI", "RO", "HU", "SK", "IT", "SU"}


def source_ids() -> set[str]:
    ids: set[str] = set()
    for f in (CDIR / "data/sources").glob("*.json"):
        ids |= {s["id"] for s in json.loads(f.read_text("utf-8"))}
    return ids


def gazetteer_ids() -> set[str]:
    ids: set[str] = set()
    for f in (CDIR / "data/gazetteer").glob("*.json"):
        ids |= {p["id"] for p in json.loads(f.read_text("utf-8"))}
    return ids


def write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"写出 {path.relative_to(CDIR)}")


def main() -> int:
    srcs, gaz = source_ids(), gazetteer_ids()
    problems: list[str] = []

    def check_sources(where: str, ids: list[str]) -> None:
        for s in ids:
            if s not in srcs:
                problems.append(f"{where}: 未知来源 {s}")

    # 装备
    seen = set()
    for q in EQUIPMENT:
        n = len(q["desc"])
        if not 60 <= n <= 140:
            problems.append(f"装备 {q['id']}: desc {n} 字（要求 60–140）")
        if q["id"] in seen:
            problems.append(f"装备 id 重复 {q['id']}")
        seen.add(q["id"])
        if q["side"] not in SIDE_IDS:
            problems.append(f"装备 {q['id']}: 阵营 {q['side']}")
        check_sources(f"装备 {q['id']}", q["sources"])

    # 事件
    ev = sorted(EVENTS, key=lambda e: e["at"])
    ids = set()
    for e in ev:
        n = len(e["body"])
        if not 80 <= n <= 140:
            problems.append(f"事件 {e['id']}: 正文 {n} 字（要求 80–140）")
        if len(e["title"]["zh"]) > 14:
            problems.append(f"事件 {e['id']}: 标题超过 14 字")
        if e["id"] in ids:
            problems.append(f"事件 id 重复 {e['id']}")
        ids.add(e["id"])
        for k in ("at", "endAt"):
            if k in e and not ISO.match(e[k]):
                problems.append(f"事件 {e['id']}: {k} 格式 {e[k]}")
        p = e["place"]
        if isinstance(p, str):
            if p[1:] not in gaz:
                problems.append(f"事件 {e['id']}: 地名 {p} 不在地名表")
        elif not (20 <= p[0] <= 42 and 44 <= p[1] <= 62):
            problems.append(f"事件 {e['id']}: 坐标 {p} 在地图框外")
        check_sources(f"事件 {e['id']}", e["sources"])

    # 兵力
    check_sources("forces", SOURCES)
    forces = {"sides": SIDES, "byPhase": BY_PHASE, "sources": SOURCES}

    for p in problems:
        print("[问题]", p)
    write(CDIR / "data/equipment.json", EQUIPMENT)
    write(CDIR / "data/forces.json", forces)
    write(CDIR / "pipeline/events/strategic.json", ev)
    print(f"装备 {len(EQUIPMENT)} 张，事件 {len(ev)} 个，兵力 {len(SIDES)} 方 / {len(BY_PHASE)} 个阶段；问题 {len(problems)} 个")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
