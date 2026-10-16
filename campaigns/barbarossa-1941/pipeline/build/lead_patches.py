"""整合者对各分区生成结果的补丁（在各分区 builder 之后运行，可重复执行）。
    python3 campaigns/barbarossa-1941/pipeline/build/lead_patches.py

1. 轨迹在战役中途结束、又没有终止状态的部队，引擎会让它停在最后位置直到战役结束：
   按史料补到 12 月 5 日（围城、静止防线）或补上番号撤销的终止状态。
2. 包围圈的 units 字段（包围圈由前线代理建立，部队 id 归各分区代理，这里按部队状态与位置自动关联）。
"""
import glob, json, math, os

CDIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OOB = os.path.join(CDIR, 'data/oob')
END = '1941-12-05T20:00'

# id → 追加的轨迹点（时间须晚于现有末点；已追加过则跳过）
EXTEND = {
    # 第 22 步兵师：11 月起在塞瓦斯托波尔北面围城（第 XXX 军），至战役结束
    'de.22id': [{'at': END, 'pos': [33.673, 44.72], 'status': 'engaged', 'note': '塞瓦斯托波尔围城'}],
    # 第 19 步兵军（第 23 集团军）：9 月起据守卡累利阿筑垒地域（旧国界），战线到 1944 年未变
    'su.19sk': [{'at': END, 'pos': [30.3, 60.25], 'status': 'active', 'note': '据守卡累利阿筑垒地域'}],
    # 第 75 步兵师：基辅会战后随第 6 集团军东进，转往别尔哥罗德以南的北顿涅茨河（Lexikon der Wehrmacht）
    'de.75id': [
        {'at': '1941-09-20T20:00', 'pos': [30.45, 50.47], 'status': 'engaged', 'note': '基辅陷落'},
        {'at': '1941-09-27T20:00', 'pos': [31.3, 50.3], 'status': 'active', 'note': '肃清基辅包围圈后东进'},
        {'at': '1941-10-12T20:00', 'pos': [34.4, 50.1], 'status': 'active'},
        {'at': '1941-10-26T20:00', 'pos': [36.3, 50.3], 'status': 'engaged', 'note': '向别尔哥罗德推进'},
        {'at': '1941-11-05T20:00', 'pos': [36.68, 50.42], 'status': 'active', 'note': '别尔哥罗德以南的北顿涅茨河一线'},
        {'at': END, 'pos': [36.7, 50.4], 'status': 'active'},
    ],
    # 第 111 步兵师：基辅会战（第 LI 军）后在基辅一带作第 6 集团军预备队，11 月调第 17 集团军至波尔塔瓦，12 月在顿涅茨河（第 IV 军）
    'de.111id': [
        {'at': '1941-09-26T20:00', 'pos': [30.62, 50.42], 'status': 'active', 'note': '基辅包围圈肃清'},
        {'at': '1941-10-31T20:00', 'pos': [30.9, 50.3], 'status': 'reserve', 'note': '第 6 集团军预备队'},
        {'at': '1941-11-10T20:00', 'pos': [32.8, 49.9], 'movement': 'rail', 'status': 'reserve'},
        {'at': '1941-11-15T20:00', 'pos': [34.9, 49.6], 'status': 'reserve', 'note': '调归第 17 集团军，波尔塔瓦以东'},
        {'at': '1941-11-28T20:00', 'pos': [36.9, 49.1], 'status': 'active'},
        {'at': END, 'pos': [37.45, 48.95], 'status': 'active', 'note': '顿涅茨河一线（第 IV 军）'},
    ],
    # 西南方面军的坦克师：7 月边境与科罗斯坚激战后残部撤到后方，8 月番号撤销（部分改编为坦克旅；《Боевой состав》1941 年 9 月 1 日已无）
    'su.19td': [{'at': '1941-08-20T20:00', 'pos': [29.6, 51.0], 'status': 'withdrawing', 'note': '第 5 集团军撤过第聂伯河'},
                {'at': '1941-08-28T20:00', 'pos': [30.6, 51.2], 'status': 'disbanded', 'note': '番号撤销，残部补入坦克旅'}],
    'su.40td': [{'at': '1941-08-10T20:00', 'pos': [29.1, 50.9], 'status': 'withdrawing'},
                {'at': '1941-08-20T20:00', 'pos': [30.2, 51.0], 'status': 'disbanded', 'note': '番号撤销，残部补入坦克旅'}],
    'su.43td': [{'at': '1941-08-10T20:00', 'pos': [29.2, 50.85], 'status': 'withdrawing'},
                {'at': '1941-08-20T20:00', 'pos': [30.3, 50.95], 'status': 'disbanded', 'note': '番号撤销，残部改编为第 10 坦克旅'}],
    'su.12td': [{'at': '1941-07-28T20:00', 'pos': [32.5, 49.6], 'status': 'withdrawing', 'note': '第 8 机械化军撤到后方整补'},
                {'at': '1941-08-05T20:00', 'pos': [34.4, 49.6], 'status': 'disbanded', 'note': '番号撤销，残部改编为坦克旅'}],
}

# 改既有轨迹点的状态：(部队, 时刻) → 状态
SET_STATUS = {
    # 第 154 步兵师（第 63 步兵军）8 月中旬在日洛宾以东被围，22 日前后仍在突围途中
    ('su.154sd', '1941-08-22T12:00'): 'encircled',
    # 第 3 集团军 8 月下旬在戈梅利以东与第 21 集团军一起陷入半包围
    ('su.3a', '1941-08-27T12:00'): 'encircled',
}
# 插入轨迹点（按时间排序；同一时刻已有点则跳过）
INSERT = {
    'su.154sd': [{'at': '1941-08-28T12:00', 'pos': [32.4, 53.0], 'status': 'withdrawing', 'note': '突围至布良斯克方面军防线'}],
    # 第 9 集团军：德军 9 月 12–14 日从别里斯拉夫登陆场突入诺盖草原后，退守莫洛奇纳亚河（梅利托波尔）一线
    'su.9a': [{'at': '1941-09-16T20:00', 'pos': [35.15, 46.86], 'status': 'withdrawing', 'note': '退守莫洛奇纳亚河一线'}],
}

EARLY = '1941-06-22T12:00'


def load_all():
    files = {}
    for f in sorted(glob.glob(os.path.join(OOB, '*.json'))):
        files[f] = json.load(open(f))
    return files


def main():
    files = load_all()
    units = {u['id']: (f, u) for f, us in files.items() for u in us}
    touched = set()
    for uid, pts in EXTEND.items():
        if uid not in units:
            print(f'  跳过 {uid}：不存在')
            continue
        f, u = units[uid]
        last = u['track'][-1]['at'] if u['track'] else ''
        new = [p for p in pts if p['at'] > last]
        if not new:
            continue
        u['track'].extend(new)
        touched.add(f)
        print(f'  {uid}：补 {len(new)} 个轨迹点（{new[0]["at"][:10]} → {new[-1]["at"][:10]}）')
    for (uid, at), st in SET_STATUS.items():
        f, u = units[uid]
        for p in u['track']:
            if p['at'] == at and p.get('status') != st:
                p['status'] = st
                touched.add(f)
    for uid, pts in INSERT.items():
        f, u = units[uid]
        have = {p['at'] for p in u['track']}
        new = [p for p in pts if p['at'] not in have]
        if new:
            u['track'] = sorted(u['track'] + new, key=lambda p: p['at'])
            touched.add(f)
    # 开战时不在前线、第一个轨迹点晚于开战日的部队：没有 active.from 时引擎会让它从开战起就停在第一个点（往往已深入苏联境内），
    # 改为在第一次投入时登场
    late = []
    for f, us in files.items():
        for u in us:
            if u['track'] and u['track'][0]['at'] > EARLY and not (u.get('active') or {}).get('from'):
                u.setdefault('active', {})['from'] = u['track'][0]['at']
                late.append(u['id'])
                touched.add(f)
    if late:
        print(f'  {len(late)} 支后续投入的部队补 active.from：{" ".join(late[:12])}{" …" if len(late) > 12 else ""}')
    for f in touched:
        json.dump(files[f], open(f, 'w'), ensure_ascii=False, indent=1)

    # ---------- 包围圈关联部队：存续期间处于 encircled 状态、且离锚点不远的苏军部队 ----------
    pp = os.path.join(CDIR, 'data/pockets.json')
    pockets = json.load(open(pp))
    gaz = {}
    for g in glob.glob(os.path.join(CDIR, 'data/gazetteer/*.json')):
        for p in json.load(open(g)):
            gaz[p['id']] = p['pos']
    pos = lambda p: gaz[p[1:]] if isinstance(p, str) else p
    km = lambda a, b: math.hypot((a[0] - b[0]) * 111.3 * math.cos(math.radians(a[1])), (a[1] - b[1]) * 110.6)
    # 部队每一段连续的「被合围」轨迹（一次被围经历）投票给同一时刻存续、距离最近的包围圈（160 km 以内），得票最多者为它所在的包围圈
    from collections import Counter
    # 小包围圈（要塞、港口、桥头堡）的半径：避免把附近另一次合围的部队算进来
    RADIUS = {'p.brest_fortress': 20, 'p.liepaja': 25, 'p.mogilev': 50, 'p.odessa': 50, 'p.tallinn': 40, 'p.hanko': 25,
              'p.sevastopol': 45, 'p.oranienbaum': 40, 'p.saaremaa': 40, 'p.hiiumaa': 40, 'p.roslavl': 60, 'p.velikie_luki': 60}
    members = {pk['id']: set() for pk in pockets}
    for uid, (f, u) in units.items():
        if u['side'] != 'SU' or u['echelon'] in ('front', 'armygroup', 'command'):
            continue
        status, votes = None, Counter()
        for p in u['track'] + [{'at': '9999', 'pos': [0, 0], 'status': 'active'}]:
            if p.get('status'):
                status = p['status']
            if status != 'encircled':
                if votes:
                    members[votes.most_common(1)[0][0]].add(uid)
                votes = Counter()
                continue
            ll = pos(p['pos'])
            live = [pk for pk in pockets if pk['start'][:10] <= p['at'][:10] <= pk['end'][:10]
                    and km(ll, pos(pk['anchor'])) < RADIUS.get(pk['id'], 160)]
            if live:
                votes[min(live, key=lambda pk: km(ll, pos(pk['anchor'])))['id']] += 1
    # 围城与桥头堡（守军状态不是「被合围」）手工指定
    MANUAL = {'p.odessa': ['su.primorsk', 'su.25sd', 'su.95sd', 'su.421sd'], 'p.sevastopol': ['su.primorsk', 'su.25sd', 'su.95sd', 'su.bsf'],
              'p.hanko': ['su.hanko'], 'p.oranienbaum': ['su.8a'], 'p.hiiumaa': ['su.moonsund'], 'p.tallinn': ['su.kbf']}
    for k, ids in MANUAL.items():
        if k in members:
            members[k] |= {i for i in ids if i in units}
    rank = {'army': 0, 'corps': 1, 'division': 2, 'brigade': 3, 'regiment': 4}
    for pk in pockets:
        hits = sorted(members[pk['id']], key=lambda i: (rank.get(units[i][1]['echelon'], 5), i))
        if hits:
            pk['units'] = hits[:14]
        else:
            pk.pop('units', None)
        print(f'  {pk["id"]:20} {len(hits)} 支部队：{" ".join(hits[:8])}')
    json.dump(pockets, open(pp, 'w'), ensure_ascii=False, indent=1)



def fold_phase_forces():
    """简报用全战役七方对比表（manifest ui.brief.byPhase=false）：媒体代理的分阶段数字只有德苏两方、口径不一，
    并入两方的口径说明（note），避免出现只列两方的阶段表。"""
    fp = os.path.join(CDIR, 'data/forces.json')
    f = json.load(open(fp))
    # 整合者补引的通史（总体兵力与战役走向的交叉核对）
    for sid in ('stahel_barbarossa', 'clark_barbarossa', 'wiki_ru_vov1941'):
        if sid not in f['sources']:
            f['sources'].append(sid)
    bp = f.pop('byPhase', None)
    if not bp:
        json.dump(f, open(fp, 'w'), ensure_ascii=False, indent=1)
        return
    names = {'border': '边境交战', 'smolensk': '斯摩棱斯克与乌曼', 'kiev': '基辅与列宁格勒', 'typhoon': '台风行动', 'moscow': '兵临莫斯科'}
    for side in ('DE', 'SU'):
        rows = []
        for ph, v in bp.items():
            x = v.get(side)
            if not x:
                continue
            l = x['losses']
            parts = [f'阵亡 {l["killed"]}' if side == 'DE' else l['killed']] if l.get('killed') and l['killed'] != '—' else []
            if l.get('captured') and l['captured'] != '—':
                parts.append(f'被俘 {l["captured"]}')
            if parts:
                rows.append(f'{names.get(ph, ph)}：{"；".join(parts)}')
        if rows:
            f['sides'][side]['note'] = f['sides'][side].get('note', '') + ' 分阶段损失（口径见各项）——' + ' · '.join(rows) + '。'
    json.dump(f, open(fp, 'w'), ensure_ascii=False, indent=1)
    print('  forces：分阶段数字并入德苏两方说明')


if __name__ == '__main__':
    main()
    fold_phase_forces()
