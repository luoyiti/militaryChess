"""地名裁剪报告：找出「远在画布外」与「从未被引用」的地名。

    sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/prune_gazetteer.py            # 只报告（默认）
    sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/prune_gazetteer.py --apply     # 写回 places.json

读：`campaigns/dunkirk-1940/data/gazetteer/places.json`、`campaigns/dunkirk-1940/config/frame.json` 的 bbox。

两类报告：
  1. **框外地名**：`pos` 落在 bbox 外 > PAD_DEG（1°）的方向上 —— `npm run validate` 会
     对这些地名报 `W 地名 <id> 远在地图范围外`（validate 的判据是 bbox 各向外扩 10%）。
  2. **未被引用的地名**：扫描 `data/**/*.json` 与 `campaign.json` 里所有形如 `"@<id>"` 的字符串
     （事件 `place`、轨迹 `pos`、路线 `waypoints`、多边形锚点……一律覆盖）。

安全约定：**默认只输出报告，不删任何东西**。`--apply` 也只会删除同时满足
「bbox 外 > 1°」**且**「全库无任何引用」的地名，并在写回前打印将删条目、写回后重新报告。

退出码：0 = 无「框外且未被引用」的地名；1 = 存在这类（可安全删除但不自动删）的地名。
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
CDIR = os.path.join(ROOT, 'campaigns/dunkirk-1940')
PLACES = os.path.join(CDIR, 'data/gazetteer/places.json')
FRAME = os.path.join(CDIR, 'config/frame.json')
DATA = os.path.join(CDIR, 'data')
MANIFEST = os.path.join(CDIR, 'campaign.json')

# validate 的框外判据是 bbox 外扩 10%（padX/padY）。这里报告「> PAD_DEG 度」的则必然超限。
PAD_DEG = 1.0

REF_RE = re.compile(r'^@([A-Za-z0-9_]+)$')


def load(path: str, default=None):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f, strict=False)
    except FileNotFoundError:
        return default


def walk_strings(node, out: list[str]) -> None:
    """递归收集 JSON 里所有字符串（键与值都收，避免漏掉以地名做键的写法）。"""
    if isinstance(node, str):
        out.append(node)
    elif isinstance(node, list):
        for v in node:
            walk_strings(v, out)
    elif isinstance(node, dict):
        for k, v in node.items():
            out.append(k)
            walk_strings(v, out)


def json_files() -> list[str]:
    out = []
    for dirpath, _dirs, names in os.walk(DATA):
        for n in sorted(names):
            if n.endswith('.json'):
                out.append(os.path.join(dirpath, n))
    if os.path.exists(MANIFEST):
        out.append(MANIFEST)
    return sorted(out)


def outside_deg(pos, bbox) -> tuple[float, str]:
    """返回 (超出 bbox 的度数, 方向描述)；在框内或仅在框内则为 (0, '')。"""
    w, s, e, n = bbox
    lon, lat = pos[0], pos[1]
    dx = max(w - lon, lon - e, 0.0)
    dy = max(s - lat, lat - n, 0.0)
    d = max(dx, dy)
    if d <= 0:
        return 0.0, ''
    bits = []
    if lon < w:
        bits.append(f'西 {w - lon:.2f}°')
    if lon > e:
        bits.append(f'东 {lon - e:.2f}°')
    if lat < s:
        bits.append(f'南 {s - lat:.2f}°')
    if lat > n:
        bits.append(f'北 {lat - n:.2f}°')
    return d, '/'.join(bits)


def main() -> int:
    apply = '--apply' in sys.argv
    quiet = '--quiet' in sys.argv

    places = load(PLACES, [])
    if not places:
        print(f'✗ 读不到地名库 {PLACES}')
        return 2
    frame = load(FRAME, {})
    bbox = frame.get('bbox')
    if not bbox or len(bbox) != 4:
        print(f'✗ {FRAME} 缺少 bbox')
        return 2

    # ---------- 引用扫描 ----------
    refs: dict[str, list[str]] = defaultdict(list)
    scanned = json_files()
    for path in scanned:
        doc = load(path)
        if doc is None:
            continue
        strings: list[str] = []
        walk_strings(doc, strings)
        rel = os.path.relpath(path, CDIR)
        for s in strings:
            m = REF_RE.match(s)
            if m:
                refs[m.group(1)].append(rel)

    known = {p['id']: p for p in places}
    unknown = sorted({i for i in refs if i not in known})

    # ---------- 报告 ① 框外 ----------
    far_out = []      # > PAD_DEG
    near_out = []     # 0 < 超出 ≤ PAD_DEG
    for p in places:
        d, why = outside_deg(p.get('pos', [0, 0]), bbox)
        if d > PAD_DEG:
            far_out.append((p, d, why))
        elif d > 0:
            near_out.append((p, d, why))
    far_out.sort(key=lambda t: -t[1])
    near_out.sort(key=lambda t: -t[1])

    # ---------- 报告 ② 未引用 ----------
    unused = [p for p in places if p['id'] not in refs]

    # ---------- 可安全删除 = 框外 > 1° 且未引用 ----------
    prunable = [p for p, _d, _w in far_out if p['id'] not in refs]

    if not quiet:
        w, s, e, n = bbox
        print(f'地名裁剪报告 · dunkirk-1940')
        print(f'  地名库      {os.path.relpath(PLACES, ROOT)}：{len(places)} 条')
        print(f'  画布 bbox   [{w}, {s}, {e}, {n}]（外扩 {PAD_DEG}° 视为「远在框外」）')
        print(f'  扫描数据    {len(scanned)} 个 JSON（data/**/*.json + campaign.json）')
        print(f'  被引用地名  {len([i for i in refs if i in known])} 条 / 引用次数 {sum(len(v) for v in refs.values())}')
        print()

        print(f'① 框外 > {PAD_DEG}° 的地名：{len(far_out)} 条  ← validate 会 WARN「远在地图范围外」')
        for p, d, why in far_out:
            mark = '可删' if p['id'] not in refs else f'在用×{len(refs[p["id"]])}'
            print(f'   {p["id"]:<22} {p.get("zh", ""):<10} {p["pos"]}  超出 {d:.2f}°（{why}） [{mark}]')
        print()

        print(f'   框外 ≤ {PAD_DEG}°（validate 的 10% 外扩内，通常只 WARN 不报错）：{len(near_out)} 条')
        for p, d, why in near_out:
            print(f'   {p["id"]:<22} {p.get("zh", ""):<10} {p["pos"]}  超出 {d:.2f}°（{why}）')
        print()

        print(f'② 从未被任何数据引用的地名：{len(unused)} 条')
        for p in unused:
            d, why = outside_deg(p.get('pos', [0, 0]), bbox)
            tag = f'框外 {d:.2f}°（{why}）' if d > 0 else '框内'
            print(f'   {p["id"]:<22} {p.get("zh", ""):<10} rank={p.get("rank")} kind={p.get("kind", ""):<9} {tag}')
        print()

        if unknown:
            print(f'⚠ data/ 里引用了地名库中不存在的地名：{len(unknown)} 个')
            for i in unknown:
                print(f'   @{i}  ← {", ".join(sorted(set(refs[i])))}')
            print()

        print(f'③ 「框外 > {PAD_DEG}° 且未被引用」= 可安全删除：{len(prunable)} 条')
        for p in prunable:
            print(f'   {p["id"]:<22} {p.get("zh", "")}')
        print()
        print('默认只报告，不写入。加 --apply 才会从 places.json 删除上面 ③ 的条目。')

    if not apply:
        return 1 if prunable else 0

    if not prunable:
        print('没有可安全删除的地名，未写回。')
        return 0

    drop = {p['id'] for p in prunable}
    keep = [p for p in places if p['id'] not in drop]
    with open(PLACES, 'w', encoding='utf-8') as f:
        json.dump(keep, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'已写回 {os.path.relpath(PLACES, ROOT)}：{len(places)} → {len(keep)} 条，删除 '
          f'{len(drop)} 条：{", ".join(sorted(drop))}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
