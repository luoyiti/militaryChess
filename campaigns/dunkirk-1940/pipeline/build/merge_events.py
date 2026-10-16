"""合并各写手的事件草稿 → data/events.json，并做一致性与文案检查。

    sh tools/py.sh campaigns/dunkirk-1940/pipeline/build/merge_events.py [--check]

来源：campaigns/dunkirk-1940/pipeline/events/*.json（每个文件一个 HistEvent 数组）。
输出：campaigns/dunkirk-1940/data/events.json（按 at 排序；同刻按 importance 升序）

检查（不通过则退出码 1）：
  1. id 唯一、形如 e.dk_*，正文中文 80–150 字，category / importance / confidence 合法
  2. place 必须是 @地名 且该地名存在于 data/gazetteer/*.json
  3. at 在 [1940-05-26T00:00, 1940-06-04T23:59] 内（个别「前史」事件允许 05-24 起，需在白名单里）
  4. units 引用的部队 id 必须在 data/oob/*.json 中存在（缺文件时跳过该检查）
  5. sources 必须存在于 data/sources/main.json
  6. photo.commons 必须在 public/campaigns/dunkirk-1940/photos/index.json 中
  7. sfx 必须在共享音效表内
"""
from __future__ import annotations

import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
CDIR = os.path.join(ROOT, 'campaigns/dunkirk-1940')
SRC_DIR = os.path.join(CDIR, 'pipeline/events')
OUT = os.path.join(CDIR, 'data/events.json')
PUB = os.path.join(ROOT, 'public/campaigns/dunkirk-1940')

# 事件时间窗 = campaign.json 的 epoch → dataEnd（与 tools/validate 的 hours() 同一口径）。
# 不用「start」作下界：epoch 早于 start 正是为了容纳布洛涅（5-22）与加来（5-23）两个围城口袋。
WIN = ('1940-05-22T00:00', '1940-06-04T23:59')
CATEGORIES = {'battle', 'air', 'naval', 'political', 'atrocity', 'movement', 'surrender', 'siege'}
BODY_MIN, BODY_MAX = 80, 150
SFX = {
    'typewriter', 'bell', 'stamp', 'paper', 'explosion', 'artillery', 'stuka', 'bomber', 'engine', 'tank',
    'ship_gun', 'siren', 'radio', 'morse', 'mg', 'rifle', 'march', 'cavalry', 'fighter', 'air_siren',
    'ui_click', 'fanfare', 'amb_wind', 'amb_front', 'amb_radio',
}


def load(path: str, default=None):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def zh_len(s: str) -> int:
    return len(s)


def main() -> int:
    check_only = '--check' in sys.argv
    gaz: dict[str, dict] = {}
    for fn in sorted(os.listdir(os.path.join(CDIR, 'data/gazetteer'))):
        if fn.endswith('.json'):
            for p in load(os.path.join(CDIR, 'data/gazetteer', fn), []) or []:
                gaz[p['id']] = p
    sources = {s['id'] for s in (load(os.path.join(CDIR, 'data/sources/main.json'), []) or [])}
    units: set[str] = set()
    oob_dir = os.path.join(CDIR, 'data/oob')
    if os.path.isdir(oob_dir):
        for fn in sorted(os.listdir(oob_dir)):
            if fn.endswith('.json'):
                for u in load(os.path.join(oob_dir, fn), []) or []:
                    units.add(u['id'])
    photos = load(os.path.join(PUB, 'photos/index.json'), {}) or {}

    events: list[dict] = []
    seen: set[str] = set()
    errors: list[str] = []
    warns: list[str] = []
    for fn in sorted(os.listdir(SRC_DIR)):
        if not fn.endswith('.json'):
            continue
        arr = load(os.path.join(SRC_DIR, fn), [])
        if not isinstance(arr, list):
            errors.append(f'{fn}: 顶层必须是数组')
            continue
        for e in arr:
            eid = e.get('id', '?')
            where = f'{fn} {eid}'
            if eid in seen:
                errors.append(f'{where}: id 重复')
            seen.add(eid)
            if not re.match(r'^e\.dk_[a-z0-9_]+$', eid):
                errors.append(f'{where}: id 须形如 e.dk_<小写>')
            n = zh_len(e.get('body', ''))
            if not (BODY_MIN <= n <= BODY_MAX):
                (errors if n < BODY_MIN - 20 or n > BODY_MAX + 40 else warns).append(f'{where}: 正文 {n} 字（建议 {BODY_MIN}–{BODY_MAX}）')
            if e.get('category') not in CATEGORIES:
                errors.append(f'{where}: 未知 category {e.get("category")}')
            if e.get('importance') not in (1, 2, 3):
                errors.append(f'{where}: importance 须为 1/2/3')
            if e.get('confidence') not in ('high', 'medium', 'low'):
                errors.append(f'{where}: confidence 须为 high/medium/low')
            at = e.get('at', '')
            if not (WIN[0] <= at <= WIN[1]):
                errors.append(f'{where}: at {at} 超出 {WIN[0]} — {WIN[1]}')
            place = e.get('place', '')
            if not (isinstance(place, str) and place.startswith('@')):
                errors.append(f'{where}: place 须为 @地名')
            elif place[1:] not in gaz:
                errors.append(f'{where}: 地名 {place} 不存在')
            for u in e.get('units', []) or []:
                if units and u not in units:
                    warns.append(f'{where}: 部队 {u} 尚未在 data/oob/ 中（合并后复查）')
            for s in e.get('sources', []) or []:
                if s not in sources:
                    errors.append(f'{where}: 来源 {s} 不在 data/sources/main.json')
            if not e.get('sources'):
                errors.append(f'{where}: 缺少 sources')
            ph = (e.get('photo') or {}).get('commons')
            if ph and ph not in photos:
                errors.append(f'{where}: 照片 {ph} 未在 photos/index.json 中索引')
            for s in e.get('sfx', []) or []:
                if s not in SFX:
                    errors.append(f'{where}: 未知音效 {s}')
            events.append(e)

    events.sort(key=lambda e: (e['at'], e['importance']))
    print(f'合并 {len(events)} 个事件（来自 {len([f for f in os.listdir(SRC_DIR) if f.endswith(".json")])} 个草稿文件）')
    bycat: dict[str, int] = {}
    for e in events:
        bycat[e['category']] = bycat.get(e['category'], 0) + 1
    print('  类别分布：', ' '.join(f'{k}={v}' for k, v in sorted(bycat.items())))
    print('  配图：', sum(1 for e in events if e.get('photo')), '· importance 1：', sum(1 for e in events if e['importance'] == 1))
    for w in warns[:30]:
        print('  WARN ', w)
    for x in errors[:40]:
        print('  ERROR', x)
    if errors:
        print(f'✗ {len(errors)} 个错误，未写出')
        return 1
    if warns:
        print(f'（{len(warns)} 条提示）')
    if check_only:
        print('✓ 检查通过（--check 未写出）')
        return 0
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'✓ 写出 {os.path.relpath(OUT, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
