"""合并各分区的事件草稿 pipeline/events/*.json → data/events.json（按时间排序）。
同 id 的事件只保留一份（先到先得，并打印冲突）；同一天、同一地点、标题相近的事件提示可能重复。
    python3 campaigns/barbarossa-1941/pipeline/build/merge_events.py
"""
import glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CDIR = os.path.abspath(os.path.join(HERE, '../..'))
ORDER = ['lead', 'strategic', 'north', 'center', 'south']  # 冲突时优先保留的来源

files = sorted(glob.glob(os.path.join(CDIR, 'pipeline/events/*.json')), key=lambda f: (ORDER.index(os.path.basename(f)[:-5]) if os.path.basename(f)[:-5] in ORDER else 99, f))
seen, out = {}, []
for f in files:
    area = os.path.basename(f)[:-5]
    try:
        evs = json.load(open(f))
    except json.JSONDecodeError as e:
        sys.exit(f'{f}: {e}')
    for e in evs:
        if e['id'] in seen:
            print(f'  重复 id {e["id"]}：保留 {seen[e["id"]]}，丢弃 {area}')
            continue
        seen[e['id']] = area
        out.append(e)
    print(f'{area:10} {len(evs):3} 条')
out.sort(key=lambda e: (e['at'], -(4 - e['importance'])))

# 整合者挂的照片（pipeline/build/event_photos.json，由 event_photos_src.py 从媒体代理的照片池生成）：只补给还没有照片的事件
photos = json.load(open(os.path.join(HERE, 'event_photos.json')))
used = {e['photo']['commons'] for e in out if e.get('photo')}
added = 0
for e in out:
    ph = photos.get(e['id'])
    if ph and not e.get('photo') and ph['commons'] not in used:
        e['photo'] = ph
        used.add(ph['commons'])
        added += 1
missing = [k for k in photos if k not in seen]
print(f'照片：补 {added} 张' + (f'；映射里的事件不存在：{missing}' if missing else ''))

# 可能的重复：同一天、标题有两个以上相同汉字片段
def grams(s):
    return {s[i:i + 2] for i in range(len(s) - 1)}
for i, a in enumerate(out):
    for b in out[i + 1:]:
        if b['at'][:10] != a['at'][:10]:
            break
        if seen[a['id']] != seen[b['id']] and len(grams(a['title']['zh']) & grams(b['title']['zh'])) >= 2:
            print(f'  可能重复：{a["id"]}（{seen[a["id"]]}）≈ {b["id"]}（{seen[b["id"]]}）')

json.dump(out, open(os.path.join(CDIR, 'data/events.json'), 'w'), ensure_ascii=False, indent=1)
imp = {k: sum(1 for e in out if e['importance'] == k) for k in (1, 2, 3)}
print(f'→ data/events.json：{len(out)} 条（重要度 1/2/3：{imp[1]}/{imp[2]}/{imp[3]}）')
