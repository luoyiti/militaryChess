#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""事件正文「距莫斯科 / 距克里姆林宫」距离断言审计。

背景：`data/events.json` 里同时存在四种距离口径，混用会产生互相矛盾的数字
（例如克拉斯纳亚波利亚纳一处曾并存 19.9 / 27 / 32.2 km 三个值）。本脚本把
每条含距离断言的事件取 `place` 地名坐标算大圆距离，与正文里的数字比对。

口径分类（只有「点距」要求数值吻合）：
  point      点距  —— 事件 place 的地名坐标到 @kremlin 的直线距离
  boundary   市界  —— 到 1941 年莫斯科市界的距离（1935—1960 年市界面积约 326 km²）
  band       带距  —— 防线带宽度、前沿区间，非单点
  road       公路  —— 公路里程或更靠前的前哨测量点，只能作「常见说法」并列

用法：
  python3 campaigns/moscow-1941/pipeline/audit-distances.py
  python3 campaigns/moscow-1941/pipeline/audit-distances.py --json   # 机器可读

退出码：0 = 无不一致；1 = 存在点距断言与实测不符（warn 级），或数据读取失败。
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

CAMPAIGN = Path(__file__).resolve().parent.parent          # campaigns/moscow-1941
DATA = CAMPAIGN / "data"
KREMLIN = (37.617, 55.752)                                  # @kremlin 坐标
EARTH_R = 6371.0088

# 中文数字 → 整数（事件正文用汉字写数字）
_CN_DIGIT = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
             "六": 6, "七": 7, "八": 8, "九": 9}


def cn2int(s: str) -> int | None:
    """解析「十九」「八十五」「两百」「六十」这类中文数词；阿拉伯数字直接转。"""
    s = s.strip()
    if s.isdigit():
        return int(s)
    if not s:
        return None
    # 两百 / 二百
    if s.startswith("两"):
        s = "二" + s[1:]
    if "百" in s:
        head, _, tail = s.partition("百")
        hundreds = _CN_DIGIT.get(head, 1) if head else 1
        rest = 0
        if tail:
            if tail == "十":
                rest = 10
            elif "十" in tail:
                rest = _CN_digit_under_100(tail) or 0
            else:
                rest = _CN_DIGIT.get(tail, 0)
        return hundreds * 100 + rest
    if "十" in s:
        return _CN_digit_under_100(s)
    return _CN_DIGIT.get(s)


def _CN_digit_under_100(s: str) -> int | None:
    """「十九」「二十五」「六十」→ int。"""
    if "十" not in s:
        return _CN_DIGIT.get(s)
    head, _, tail = s.partition("十")
    tens = _CN_DIGIT.get(head, 1) if head else 1
    ones = _CN_DIGIT.get(tail, 0) if tail else 0
    return tens * 10 + ones


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1 = a
    lon2, lat2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R * math.asin(math.sqrt(h))


def load_gazetteer() -> dict[str, dict]:
    gaz: dict[str, dict] = {}
    for name in ("core", "north", "south"):
        path = DATA / "gazetteer" / f"{name}.json"
        if not path.exists():
            continue
        for place in json.loads(path.read_text(encoding="utf-8")):
            gaz[place["id"]] = place
    return gaz


def load_events() -> list[dict]:
    return json.loads((DATA / "events.json").read_text(encoding="utf-8"))


# 逐条口径标注。key = 事件 id；未列出者若含距离断言则按 body 关键词自动归类。
CALIBER = {
    "e.krasnaya_polyana": {"caliber": "boundary+point",
                           "expected": {"boundaryKm": 20, "kremlinKm": 32, "roadKm": 27},
                           "note": "对市界约 20 km（实测 16—20）、对克里姆林宫约 32 km（实测 32.4）；27 km 是公路/更前哨点口径，非直线。"},
    "e.klin_falls": {"caliber": "point", "expected": {"kremlinKm": 85},
                     "note": "克林城点 85.8 km；60 km 是此后数日前锋推进到的位置。"},
    "e.solnechnogorsk_falls": {"caliber": "point", "expected": {"kremlinKm": 60},
                               "note": "城点 62.0 km。"},
    "e.yakhroma_canal": {"caliber": "point", "expected": {"kremlinKm": 60},
                         "note": "亚赫罗马 59.6 km。"},
    "e.khimki_reconnaissance": {"caliber": "point", "expected": {"kremlinKm": 19},
                                "note": "希姆基 18.8 km；对市界仅约 6.6 km。"},
    "e.yukhnov_falls": {"caliber": "point", "expected": {"kremlinKm": 200},
                        "note": "187.9 km，取整「约两百公里」，偏差 6.4% 可接受。"},
    "e.moscow_zone_defense": {"caliber": "band", "expected": {},
                              "note": "三道防线的带距 15—20 km，非点距。"},
    "e.naro_fominsk_street": {"caliber": "band", "expected": {},
                              "note": "「前沿」区间 50—70 km，城点 68.5 km 落在区间内。"},
    "e.nara_line_holds": {"caliber": "band", "expected": {},
                          "note": "CMH「center thirty-five miles」=56.3 km；正文写的是战线中线，非纳拉河点名（74.2 km）。"},
}

# 点距断言的容差：取整写法的合理误差（如 187.9 → 约 200）
TOLERANCE_KM = 15.0

DIST_RE = re.compile(r"([一二三四五六七八九十百两零\d]+)\s*公里")
NEAR_RE = re.compile(r"距|距离|外|对[^。]{0,12}公里")


def body_numbers(body: str) -> list[int]:
    out: list[int] = []
    for raw in DIST_RE.findall(body):
        n = cn2int(raw)
        if n is not None:
            out.append(n)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="审计事件正文的距离断言")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    gaz = load_gazetteer()
    events = load_events()

    rows: list[dict] = []
    problems: list[str] = []

    for ev in events:
        body = ev["body"]
        if "公里" not in body or not NEAR_RE.search(body):
            continue

        place = ev["place"]
        if isinstance(place, list):
            lonlat = (place[0], place[1])
        elif isinstance(place, str) and place.startswith("@"):
            pid = place[1:]
            if pid not in gaz:
                problems.append(f"{ev['id']}: 地名 {pid} 不在 gazetteer")
                continue
            lonlat = tuple(gaz[pid]["pos"])
        else:
            problems.append(f"{ev['id']}: 无法解析 place {place!r}")
            continue

        kremlin_km = haversine(lonlat, KREMLIN)
        meta = CALIBER.get(ev["id"], {})
        caliber = meta.get("caliber", "point")
        nums = body_numbers(body)

        # 点距：正文须有一个数字与实测吻合（容差内）
        ok = True
        if caliber in ("point", "boundary+point") and nums:
            ok = any(abs(n - kremlin_km) <= TOLERANCE_KM for n in nums)
            if not ok:
                problems.append(
                    f"{ev['id']}: 点距断言 {nums} km 与实测 {kremlin_km:.1f} km 相差超过 {TOLERANCE_KM:.0f} km"
                )

        rows.append({
            "event": ev["id"],
            "at": ev["at"],
            "place": place,
            "kremlinKm": round(kremlin_km, 1),
            "claimsKm": nums,
            "caliber": caliber,
            "verdict": "pass" if ok else "mismatch",
            "note": meta.get("note", ""),
        })

    if args.json:
        print(json.dumps({"checked": len(rows), "problems": problems, "rows": rows},
                         ensure_ascii=False, indent=2))
    else:
        print(f"距离断言审计：共 {len(rows)} 条事件含距离断言\n")
        width = max((len(r["event"]) for r in rows), default=10)
        for r in rows:
            mark = "✓" if r["verdict"] == "pass" else "✗"
            print(f"  {mark} {r['event']:<{width}}  {r['kremlinKm']:>6.1f} km  "
                  f"正文 {str(r['claimsKm']):<18} [{r['caliber']}]")
            if r["note"]:
                print(f"      {r['note']}")
        if problems:
            print("\n不一致：")
            for p in problems:
                print("  ✗", p)
        else:
            print("\n全部通过：点距断言均与地名坐标实测吻合，带距/市界/公路口径已逐条标注。")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
