"""海战数据：写 data/naval/{battle,raid,montevideo}.json（射击、命中、鱼雷、烟幕、损伤、电文）。
时刻为英方舰钟 Zone +2（UTC−2）；依据 docs/research/battle.md §4–5、raid.md、montevideo.md。
电文 text 为原文；原文未见、只有转述的写成方括号内的英文摘要。运行：python3 campaigns/river-plate-1939/pipeline/build/naval.py"""
import json, os
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
def dump(p, obj):
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, indent=1); f.write('\n')
D = '1939-12-13T'
GS, EX, AJ, AC = 'de.graf_spee', 'gb.exeter', 'gb.ajax', 'nz.achilles'
HD, AD, WT = 'harwood_despatch', 'admiralty_1940', 'waters_1956'

def F(id, sh, tg, w, a, b, src, conf='medium', **kw): return {'id': f'f.{id}', 'shooter': sh, 'target': tg, 'weapon': w, 'from': D + a if len(a) == 5 else a, 'to': D + b if len(b) == 5 else b, **kw, 'sources': src, 'confidence': conf}
fire = [
 # 施佩伯爵号：开战时一座炮塔打埃克塞特号、一座打第一分队，随即集中于埃克塞特号；06:30 后后炮塔转向第一分队
 F('gs_a_ex', GS, EX, 'A', '06:18', '06:41', [HD, WT, 'kaack_2010'], 'high', note='首次齐射落在埃克塞特号前方约 300 码，第三次齐射夹叉'),
 F('gs_b_aj', GS, AJ, 'B', '06:18', '06:22', [HD], note='开战时后炮塔射向第一分队'),
 F('gs_b_ex', GS, EX, 'B', '06:22', '06:30', [HD, AD], note='两座炮塔集中射击埃克塞特号'),
 F('gs_b_fd', GS, AJ, 'B', '06:30', '06:56', [HD, AD], note='一座 28 厘米炮塔转向第一分队，阿贾克斯号三次被夹叉'),
 F('gs_sec_fd', GS, AC, 'sec', '06:30', '06:58', [HD], 'medium', note='15 厘米副炮交替射击两艘轻巡洋舰，散布大、无效'),
 F('gs_a_ex2', GS, EX, 'A', '06:45', '07:00', [HD, 'atwill_1977'], 'low', note='在烟幕间隙继续追打转向西行的埃克塞特号，落点偏远'),
 F('gs_b_fd2', GS, AC, 'B', '07:00', '07:16', [HD], 'low'),
 F('gs_a_ex3', GS, EX, 'A', '07:16', '07:20', [HD], 'low', note='在烟幕下急转，一度直指受创的埃克塞特号'),
 F('gs_ab_aj', GS, AJ, 'A', '07:20', '07:40', [HD], 'high', note='打开全部射界，28 厘米炮集中射击第一分队；阿贾克斯号在 11,000 码被夹叉'),
 F('gs_b_aj2', GS, AJ, 'B', '07:20', '07:40', [HD], 'high'),
 F('gs_sec_fd2', GS, AC, 'sec', '07:20', '07:40', [HD], 'medium', note='副炮射击散乱偏高'),
 # 埃克塞特号
 F('ex_a', EX, GS, 'A', '06:20', '06:38', [HD, WT], 'high', note='18,700 码开火，发射 8 次齐射后 B 炮塔被毁'),
 F('ex_b', EX, GS, 'B', '06:20', '06:24', [HD], 'high'),
 F('ex_y', EX, GS, 'Y', '06:22', '07:29', [HD, AD, 'atwill_1977'], 'high', note='Y 炮塔局部控制射击，直到进水断电'),
 # 第一分队
 F('ac_main', AC, GS, 'A', '06:21', '07:40', [HD, WT, 'nzhistory_battle'], 'high', note='全战超过 200 次齐射；06:46 射击控制电台失灵后改为独立射击'),
 F('ac_b', AC, GS, 'B', '06:21', '07:40', [HD, WT], 'high'),
 F('ac_x', AC, GS, 'X', '06:21', '07:40', [HD, WT], 'high', note='X 炮塔一门炮全战打出 287 发'),
 F('ac_y', AC, GS, 'Y', '06:21', '07:40', [HD, WT], 'high'),
 F('aj_a', AJ, GS, 'A', '06:23', '07:40', [HD, WT], 'high', note='A 炮塔连续射击 81 分钟'),
 F('aj_b', AJ, GS, 'B', '06:23', '07:40', [HD], 'high'),
 F('aj_x', AJ, GS, 'X', '06:23', '07:25', [HD], 'high', note='06:37 弹射飞机时 X、Y 炮塔正向前方射击'),
 F('aj_y', AJ, GS, 'Y', '06:23', '07:25', [HD], 'high'),
 # 尾随阶段的零星交火
 F('gs_a_ac_1005', GS, AC, 'A', '10:05', '10:07', [HD, WT], 'high', rounds=6, note='阿喀琉斯号追得太近（23,000 码），施佩伯爵号以前炮塔两次三发齐射'),
 F('gs_b_aj_1915', GS, AJ, 'B', '19:15', '19:17', [HD, AD], 'high', rounds=6, note='约 26,000 码两次齐射，第二次落在阿贾克斯号转向的尾迹里'),
 F('gs_b_ac_2055', GS, AC, 'B', '20:55', '20:59', [HD, WT], 'high', rounds=9, note='日落后对着西天剪影射击，第三次齐射很近'),
 F('ac_a_2055', AC, GS, 'A', '20:56', '21:00', [HD, WT], 'high', note='还击 5 次齐射后在烟幕中转开'),
 F('gs_b_ac_2132', GS, AC, 'B', '21:32', '21:44', [HD, AD], 'medium', rounds=9, note='21:32、21:40、21:43 三次单发齐射，阿喀琉斯号不还击以免暴露'),
]

def H(id, at, sh, tg, w, loc, eff, sev, src, conf='medium', **kw): return {'id': f'h.{id}', 'at': D + at, 'shooter': sh, 'target': tg, **({'weapon': w} if w else {}), 'location': loc, 'effect': eff, 'severity': sev, **kw, 'sources': src, 'confidence': conf}
hits = [
 H('ex_near', '06:23', GS, EX, 'A', '右舷舰中部（近失弹）', '28 厘米弹在右舷近失爆炸，弹片杀死右舷鱼雷发射管全组，打坏通信、烟囱与探照灯；两架「海象」水上飞机被弹片击毁，随后推下海', 2, [HD, 'atwill_1977'], 'high'),
 H('ex_b', '06:24', GS, EX, 'A', 'B 炮塔正面', 'B 炮塔被直接命中，两门 8 英寸炮报废，塔内约八人阵亡；弹片扫过舰桥，除舰长与另两人外全部死伤，舵轮室通信被毁', 1, [HD, 'atwill_1977'], 'high', gunsOut=['B']),
 H('ex_fwd', '06:27', GS, EX, 'A', '艏楼与锚链舱', '两发 28 厘米弹命中舰艏，锚与前甲板炸裂、起火，艏部多舱进水', 2, ['atwill_1977', HD], 'medium'),
 H('gs_8in', '06:28', EX, GS, 'A', '舰体中部（装甲甲板）', '一发 8 英寸弹穿过上层建筑与甲板，在机舱上方爆炸，打坏燃油与润滑油净化设备——施佩伯爵号从此无法长途返航', 2, ['kaack_2010', WT], 'low', precision='approx'),
 H('ex_a', '06:38', GS, EX, 'A', 'A 炮塔正面装甲', 'A 炮塔被击中报废', 1, [HD], 'high', gunsOut=['A']),
 H('ex_cpo', '06:38', GS, EX, 'A', '左舷上甲板 → 士官舱平台', '一发 28 厘米弹从左舷上甲板入舰，穿过两道舱壁在士官舱平台爆炸，引起大火；4 英寸弹药库因水管破裂进水；罗经复示器全毁，舰长改用小艇罗经操舰', 1, [HD, 'atwill_1977'], 'high', killed=20),
 H('ex_wt', '06:39', GS, EX, None, '电报室与右舷 1 号 4 英寸炮', '一发 28 厘米弹穿过军械室与电报室（5 名电报员阵亡），在右舷 1 号 4 英寸炮炮管上爆炸，引燃备用弹药；见习军官卡梅伦等人把发烫的炮弹扔下海', 2, ['atwill_1977', 'nh_kindell_casualties'], 'medium', killed=5),
 H('gs_6in_bow', '06:40', AC, GS, 'A', '舰艏（水线以上）', '6 英寸弹在舰艏打出约 6×6 英尺的大洞；朗斯多夫被弹片擦伤，随后被气浪掀倒，昏迷数分钟', 2, [WT, 'kaack_2010', 'avalanche_werbaneth'], 'low', precision='approx'),
 H('ac_dct', '06:40', GS, AC, 'A', '舰桥正横的海面（近失弹）', '28 厘米弹在舰桥正横水面炸开，弹片射入射击指挥塔：4 人阵亡、3 人重伤，炮术长沃什伯恩被震晕，帕里舰长腿部受伤', 3, [HD, WT, 'nzhistory_battle'], 'high', killed=4, wounded=9),
 H('gs_8in_2', '06:45', EX, GS, 'Y', '前桅塔', '第二发 8 英寸弹命中塔式舰桥上部（德方自计全战被 8 英寸弹命中 2 发）', 3, [WT], 'low', precision='approx'),
 H('gs_6in_galley', '07:10', AJ, GS, 'A', '上层建筑与厨房', '6 英寸弹打毁除司令厨房外的全部厨房，面粉与给养舱进水，淡水设备损坏', 3, [WT, 'kaack_2010'], 'low', precision='approx'),
 H('gs_fire', '07:20', AJ, GS, 'B', '舰中部', '舰中部起火（哈伍德观察到）；德方统计全战被 6 英寸弹命中 18 发', 2, [HD, WT], 'medium'),
 H('gs_6in_rf', '07:32', AC, GS, 'A', '主炮测距仪与副炮', '一座主炮测距仪与两门 15 厘米副炮被打坏', 3, [WT], 'low', precision='approx'),
 H('aj_xy', '07:25', GS, AJ, 'B', '后上层建筑 → X 炮塔座圈', '一发延期引信 28 厘米弹从后上层建筑入舰，穿过数间舱室与 X 炮塔座圈，在准将卧舱爆炸；弹底碎片卡死 Y 炮塔的回转齿条，X、Y 炮塔同时报废；X 塔 4 人阵亡、6 人受伤', 2, [HD], 'high', gunsOut=['X', 'Y'], killed=4, wounded=6),
 H('aj_mast', '07:40', GS, AJ, 'A', '主桅', '最后一次齐射打断主桅，天线被毁，数人受伤', 3, [HD], 'high'),
]

def TP(id, at, sh, cnt, tg, res, src, conf='high', **kw): return {'id': f't.{id}', 'at': D + at, 'shooter': sh, 'count': cnt, 'target': tg, **kw, 'result': res, 'sources': src, 'confidence': conf}
torpedoes = [
 TP('ex_stbd', '06:32', EX, 3, GS, '施佩伯爵号随即左转 150° 并施放烟幕，鱼雷落空', [HD, AD], spreadDeg=6),
 TP('ex_port', '06:43', EX, 3, GS, '在大角度右转后由左舷发射，未命中', [HD, AD], 'medium', spreadDeg=6),
 TP('gs_aj', '07:22', GS, 1, AJ, '德方记述：鱼雷齐射时本舰正急左转，只有一条离管；07:31 海狐号报告「鱼雷来袭」，哈伍德转向正南规避', [WT, HD], 'low', speedKn=30),
 TP('aj_port', '07:24', AJ, 4, GS, '9,000 码由左舷发射；施佩伯爵号立即左转约 130° 并施放烟幕，三分钟后才恢复西北航向', [HD, AD], spreadDeg=5),
]

def S(id, ship, a, b, src, persist=25, w=0.8, kind='screen', note=None, conf='medium'):
    s = {'id': f's.{id}', 'ship': ship, 'from': D + a, 'to': D + b, 'kind': kind, 'widthKm': w, 'persistMin': persist, 'driftDeg': 315}
    if note: s['note'] = note
    s['sources'] = src; s['confidence'] = conf; return s
smoke = [
 S('gs_0634', GS, '06:34', '06:41', [AD, 'usni_cambareri_1983'], 20, note='躲避埃克塞特号鱼雷时向左转向，在烟幕下转向西北'),
 S('gs_0700', GS, '07:00', '07:20', [HD], 30, 1.0, note='大量施放烟幕（化学发烟器与烟雾浮标），频繁变向'),
 S('gs_0724', GS, '07:24', '07:30', [HD, AD], 20, note='规避阿贾克斯号的鱼雷'),
 S('gs_0732', GS, '07:32', '07:40', [HD], 25, note='转向西南，之字航行并施放烟幕'),
 S('aj_0740', AJ, '07:40', '07:46', [HD], 25, note='第一分队在烟幕掩护下转向东脱离'),
 S('ac_0740', AC, '07:40', '07:46', [HD], 25),
 S('ac_1005', AC, '10:06', '10:12', [HD, WT], 20, note='被齐射后在烟幕下全速转开'),
 S('aj_1915', AJ, '19:15', '19:20', [HD], 20),
 S('ac_2056', AC, '20:56', '21:02', [HD, WT], 25),
 S('gs_2126', GS, '21:26', '21:34', [HD, AD], 30),
]

def DS(ship, at, integ, note, src, **kw): return {'ship': ship, 'at': at if 'T' in at else D + at, 'integrity': integ, **kw, 'note': note, 'sources': src}
damage = [
 DS(EX, '06:24', 0.75, 'B 炮塔被毁，舰桥人员几乎全部死伤，改由后部指挥位操舰', [HD], gunsOut=['B']),
 DS(EX, '06:27', 0.65, '舰艏中弹起火，艏部进水', ['atwill_1977'], gunsOut=['B'], fire=True),
 DS(EX, '06:38', 0.45, 'A 炮塔被毁；士官舱平台大火，4 英寸弹药库进水，罗经全毁', [HD, 'atwill_1977'], gunsOut=['A', 'B'], fire=True, listDeg=5),
 DS(EX, '06:50', 0.4, '右倾约 7°，艏沉，仅 Y 炮塔局部控制射击', [HD], gunsOut=['A', 'B'], fire=True, listDeg=7, speedKn=28),
 DS(EX, '07:00', 0.35, '只剩 Y 炮塔与 1 门 4 英寸炮能射击；电话全断，艏沉约 4 英尺，右倾约 8°', ['atwill_1977'], gunsOut=['A', 'B'], fire=True, listDeg=8, speedKn=24),
 DS(EX, '07:30', 0.3, 'Y 炮塔进水断电，全部主炮失效，退出战斗', [HD, 'atwill_1977'], gunsOut=['A', 'B', 'Y'], fire=True, listDeg=8, speedKn=20),
 DS(EX, '11:05', 0.35, '火势控制；艏部淹至 14 号隔舱壁，可以 18 节航行。奉命前往福克兰群岛', [HD], gunsOut=['A', 'B', 'Y'], listDeg=6, speedKn=18),
 DS(AC, '06:40', 0.92, '射击指挥塔被弹片击中，4 人阵亡；数分钟后恢复', [HD, WT]),
 DS(AJ, '07:25', 0.75, 'X、Y 炮塔被毁，剩 A、B 两座炮塔', [HD], gunsOut=['X', 'Y']),
 DS(AJ, '07:40', 0.7, '主桅被打断，天线损毁；传来弹药只剩 20% 的报告（后证实只限 A 炮塔）', [HD], gunsOut=['X', 'Y']),
 DS(GS, '06:28', 0.9, '燃油与润滑油净化设备被 8 英寸弹打坏', ['kaack_2010', WT]),
 DS(GS, '06:40', 0.85, '舰艏中弹开洞；朗斯多夫两次负伤', [WT, 'kaack_2010']),
 DS(GS, '07:20', 0.75, '舰中部起火；厨房与给养舱被毁', [HD, WT], fire=True),
 DS(GS, '07:40', 0.7, '全战被命中约 20 发（8 英寸 2 发、6 英寸 18 发），阵亡 36 人、伤 60 人；28 厘米弹只剩约 40%（306 发）', [WT, 'kaack_2010'], fire=True, speedKn=23),
 DS(GS, '09:00', 0.72, '火已扑灭；朗斯多夫巡视全舰后决定驶往蒙得维的亚修理', ['kaack_2010'], speedKn=23),
]

def SG(id, at, frm, kind, text, zh, src, conf='high', to=None):
    s = {'id': f'sig.{id}', 'at': at if 'T' in at else D + at, 'from': frm}
    if to: s['to'] = to
    s.update({'kind': kind, 'text': text, 'zh': zh, 'sources': src, 'confidence': conf}); return s
signals = [
 SG('harwood_policy', '1939-12-12T12:00', AJ, 'order', 'My policy with three cruisers in company versus one pocket battleship. Attack at once by day or night.',
    '我对付一艘袖珍战列舰的方针：三舰同行，无论昼夜，立即进攻。白天分作两队，第一分队与埃克塞特号分开，以便侧向校正弹着。', [HD]),
 SG('ajax_smoke', '06:14', AJ, 'report', '[Smoke bearing 320 — Exeter to close and investigate]', '左舷正横后方 320° 发现烟迹，命令埃克塞特号前出查看。', [HD, AD]),
 SG('exeter_pb', '06:16', EX, 'signal', 'I think it is a pocket battleship.', '我认为那是一艘袖珍战列舰。', [HD], to=AJ),
 SG('ajax_enemy', '06:34', AJ, 'report', '[Enemy report: one pocket battleship, position, course and speed — amplified 0640, 0646, 0722]', '向海军部与南大西洋各舰发出敌情报告：一艘袖珍战列舰，位置、航向、航速；06:40、06:46、07:22 补报。', [HD]),
 SG('seafox_exeter', '06:40', 'gb.seafox', 'report', 'Exeter completely disappeared in smoke and flame … emerged and re-entered the action.', '海狐号观察员：埃克塞特号完全淹没在烟与火里……又冲了出来，重新加入战斗。', [AD], 'medium'),
 SG('seafox_torp', '07:31', 'gb.seafox', 'report', 'Torpedoes approaching. They will pass ahead of you.', '鱼雷来袭，将从你舰前方通过。', [HD], to=AJ),
 SG('harwood_break', '07:40', AJ, 'order', '[Break off the day action; shadow from astern — Achilles on the starboard quarter, Ajax on the port quarter]', '停止白昼战斗，转入尾随：阿喀琉斯号在敌右后方，阿贾克斯号在左后方，保持约 15 海里。', [HD]),
 SG('achilles_bcast', '08:07', AC, 'radio', '[Broadcast: Graf Spee position, course 270, speed 22]', '阿喀琉斯号代替天线被毁的旗舰，向各方播发施佩伯爵号的位置、航向与航速；此后每小时一次。', [HD]),
 SG('harwood_cumberland', '09:46', AJ, 'order', '[Cumberland to proceed to the Plate at full speed]', '命令福克兰群岛的坎伯兰号全速开往拉普拉塔河口。', [HD], to='gb.cumberland'),
 SG('gs_lifeboats', '11:04', GS, 'signal', 'Please pick up lifeboats of English steamer.', '请救起英国轮船的救生艇。——施佩伯爵号以战前呼号向阿贾克斯号发报（那艘莎士比亚号其实并未放艇）。', [HD], to=AJ),
 SG('exeter_state', '11:05', EX, 'report', '[All turrets out of action; flooded forward to No. 14 bulkhead; can steam 18 knots]', '全部炮塔失效，艏部淹至 14 号隔舱壁，尚能以 18 节航行。哈伍德令其前往福克兰群岛。', [HD], to=AJ),
 SG('achilles_delane', '15:43', AC, 'report', 'Enemy in sight 297.', '发现敌舰，方位 297。——16 分钟后更正：是流线型烟囱的英国商船德莱恩号。', [HD]),
 SG('gs_skl', '19:37', GS, 'radio', '[To SKL: 15 hits, galleys and provisions destroyed — entering Montevideo]', '致海军战争指挥部：中弹 15 发，厨房与存粮被毁，驶入蒙得维的亚。', ['ktb_skl'], 'medium', to='de.skl'),
 SG('harwood_withdraw', '23:50', AJ, 'order', '[Withdraw from the estuary; Achilles to patrol north of English Bank, Ajax to the south]', '撤出河口，划分巡逻区：阿喀琉斯号守英格利希浅滩以北，阿贾克斯号守以南，防止施佩伯爵号夜间突围。', [HD]),
]

battle = {'fire': fire, 'hits': hits, 'torpedoes': torpedoes, 'smoke': smoke, 'damage': damage, 'signals': signals}

raid = {'signals': [
 SG('skl_0926', '1939-09-26T16:43', 'de.skl', 'radio', '[Resume war against merchant shipping according to prize regulations; French ships still to be spared]', '恢复对商船作战，依《战利品法规》行事；暂不攻击法国船只。（无线电 1743/26，柏林时间）', ['ktb_skl', 'roskill_1954'], to=GS),
 SG('clement_rrr', '1939-09-30T11:30', 'gb.m_clement', 'distress', 'RRR 0905S 3405W', '「RRR」——遭袭击舰攻击，位置南纬 9°05′、西经 34°05′。', ['wiki_en_clement', 'maritimequest'], 'medium'),
 SG('gs_pernambuco', '1939-09-30T15:30', GS, 'radio', '[To Pernambuco radio, signing as "Admiral Scheer": lifeboats of steamer Clement at sea, please pick up]', '施佩伯爵号以「舍尔海军上将号」的名义电告伯南布哥岸台，请其救起克莱门特号的救生艇——英国人因此以为来的是舍尔号。', ['wiki_en_graf_spee', 'roskill_1954'], 'medium'),
 SG('admiralty_hunt', '1939-10-05T12:00', 'gb.admiralty', 'order', '[Formation of hunting groups F–N in the Atlantic and Indian Oceans]', '海军部与法国海军组成八个猎杀群：南美东岸的 G 群（坎伯兰号、埃克塞特号）、弗里敦的 K 群（声望号、皇家方舟号）、开普敦的 H 群、达喀尔的 X 群等。', ['roskill_1954', 'naval_history_net']),
 SG('gs_skl_1010', '1939-10-10T18:00', GS, 'radio', '[To SKL: six days in square FN; captured Huntsman, sunk Newton Beech and Ashlea; crews taken over; proceeding to Altmark]', '致柏林：六天来在 FN 方格作战，俘获猎人号，击沉牛顿·比奇号与阿什利号，船员已接收；前往阿尔特马克号。', ['ktb_skl'], to='de.skl'),
 SG('trevanion_rrr', '1939-10-22T12:10', 'gb.m_trevanion', 'distress', '[RRR — raider attack, position 19°40′S 04°02′E]', '「RRR」——报务员在炮火下坚持发报，英国人第一次得知袭击舰到了非洲西南海域。', ['gazette_34815', 'ktb_skl'], 'medium'),
 SG('gs_skl_1022', '1939-10-22T20:00', GS, 'radio', '[To SKL: 8,000 t heavy oil remaining; dockyard period needed in January; intend to break back home]', '致柏林：剩余重柴油 8,000 吨，一月需进坞修理，拟在此之前突破返国。', ['ktb_skl'], to='de.skl'),
 SG('gs_skl_1115', '1939-11-15T18:00', GS, 'radio', '[To SKL: Africa Shell sunk; ship\'s aircraft unserviceable; rendezvous line 4 to be moved 700 miles east]', '致柏林：击沉非洲壳牌号；舰载机失修；请阿尔特马克号把第 4 会合线东移 700 海里。', ['ktb_skl'], to='de.skl'),
 SG('doric_rrr', '1939-12-02T13:30', 'gb.m_doric_star', 'distress', 'RRR 1915S 0505E', '「RRR」——南纬 19°15′、东经 5°05′。南大西洋总司令在格林尼治时间 15:30 收到。', ['ktb_skl', 'bs26', HD]),
 SG('tairoa_rrr', '1939-12-03T04:10', 'gb.m_tairoa', 'distress', '[RRR — raider, position 21°38′S 03°13′E]', '「RRR」——又一艘商船在多里克之星号西南约 170 海里处报告遭袭。', ['wiki_en_tairoa', HD], 'medium'),
 SG('harwood_appr', '1939-12-03T12:00', AJ, 'order', '[Appreciation: raider may be expected off Rio de Janeiro on 12 December, off the Plate on 12 or 13 December, Falkland Islands on 14 December]', '哈伍德的判断：袭击舰若驶向南美，最早 12 日到里约热内卢，12 或 13 日到拉普拉塔河口，14 日到福克兰群岛。他认定河口是要害，下令三舰 12 日在河口外集中。', [HD]),
]}

M = '1939-12-1'
mvd = {'signals': [
 SG('uy_48h', '1939-12-14T13:00', '乌拉圭海事当局', 'diplomatic', '[Uruguayan maritime authorities: 48 hours permitted, extendable for repairs]', '乌拉圭海事当局口头准许停留 48 小时，可因修理延长；朗斯多夫要求 14 天。', ['frus_1939_v5'], 'medium', to=GS),
 SG('harwood_delay', '1939-12-14T18:00', AJ, 'diplomatic', '[To British Minister: delay Graf Spee\'s departure by every means — sail British ships, invoke the 24-hour rule]', '哈伍德请英国公使米林顿-德雷克用一切办法拖延施佩伯爵号出港：让英国商船出港，援引「24 小时规则」。', [HD], to='英国公使'),
 SG('uy_72h', '1939-12-15T12:00', '乌拉圭政府', 'diplomatic', '[Uruguay extends the stay to 72 hours — to expire 20:00 local time, 17 December]', '乌拉圭政府把停留期延长到 72 小时，至 17 日当地时间 20:00 届满，否则拘留。', [HD, 'frus_1939_v5'], to=GS),
 SG('harwood_object', '1939-12-15T11:35', AJ, 'order', 'My object destruction.', '我的目标：歼灭。——哈伍德致各舰的方针电（时间组 1135/15）：坎伯兰号白天在蒙得维的亚外显露身影。', [HD], 'medium'),
 SG('langsdorff_skl', '1939-12-16T02:00', GS, 'radio', 'Strategic position off Montevideo: besides the cruisers and destroyers, Ark Royal and Renown. Close blockade at night. Escape into open sea and break-through to home waters hopeless.',
    '蒙得维的亚外的态势：除巡洋舰与驱逐舰外还有皇家方舟号与声望号，夜间严密封锁，冲向大洋、突破回国无望。拟驶到中立水域边界，若能以剩余弹药打出一条路就去布宜诺斯艾利斯。请决定：河口水浅仍应自沉，还是宁可被拘留？', ['fuehrer_conf_161239'], 'high', to='de.skl'),
 SG('adm_0219', '1939-12-16T02:19', 'gb.admiralty', 'order', '[You may engage Graf Spee anywhere outside the three-mile limit]', '海军部 0219/16：可在三海里领海线以外的任何地点与施佩伯爵号交战。', [HD], to=AJ),
 SG('raeder_1347', '1939-12-16T14:07', 'de.skl', 'radio', '1. Attempt by all means to extend the time in neutral waters in order to guarantee freedom of action as long as possible. 2. Approved: Fight your way through to Buenos Aires if possible. 3. No internment in Uruguay. Attempt effective destruction if ship is scuttled.',
    '一、尽一切办法延长在中立水域的时间，以尽可能保持行动自由。二、同意：如有可能，杀出一条路去布宜诺斯艾利斯。三、不得在乌拉圭被拘留。若自沉，务求彻底破坏。——雷德尔（无线电 1347/16，柏林时间 17:07）', ['fuehrer_conf_161239'], to=GS),
 SG('harwood_kcb', '1939-12-16T18:30', 'gb.admiralty', 'signal', '[His Majesty has been graciously pleased to appoint Commodore Harwood KCB and promote him Rear-Admiral; Captains Bell, Woodhouse and Parry CB]', '国王授予哈伍德巴斯勋章（KCB）并晋升海军少将（自 13 日起），贝尔、伍德豪斯、帕里三位舰长获 CB 勋位。哈伍德当晚通报各舰。', [HD], to=AJ),
 SG('raeder_2239', '1939-12-16T21:40', 'de.skl', 'radio', 'As Envoy reports impossibility of extending time limit, instructions 2 and 3 of radiogram 1347/16 remain in force.', '公使报告无法延长期限，故 1347/16 号电第二、三项继续有效。（无线电 2239/16，柏林时间 17 日 00:40）', ['fuehrer_conf_161239'], to=GS),
 SG('tacoma_transfer', '1939-12-17T15:40', '岸上情报', 'report', '[Report from shore: Graf Spee transferring 300–400 men to German ship Tacoma]', '岸上报告：施佩伯爵号正把三四百人转到德国货轮塔科马号上；17:20 又报已转移 700 余人及行李。', [HD], 'medium', to=AJ),
 SG('gs_sailing', '1939-12-17T19:15', '岸上情报', 'report', '[Graf Spee left harbour, proceeding west; Tacoma following]', '施佩伯爵号出港西行，塔科马号跟随。分舰队以 25 节驶向惠斯尔浮标，各舰进入战位。', [HD, 'wiki_de_ags'], to=AJ),
 SG('ajax_blown', '1939-12-17T20:54', 'gb.ajax', 'report', 'Graf Spee has blown herself up.', '施佩伯爵号已经自爆。——阿贾克斯号飞机报告（当地时间 19:54）。', [HD, 'frus_1939_v5'], to=AJ),
 SG('langsdorff_log', '1939-12-17T21:00', GS, 'signal', '[Log entry: Admiral Graf Spee decommissioned 17 December 1939, 20:00]', '朗斯多夫令记入航海日志：「施佩伯爵海军上将号于 1939 年 12 月 17 日 20:00 退役。」', ['hmsajax_langsdorff'], 'medium'),
 SG('langsdorff_letter', '1939-12-20T02:00', '朗斯多夫', 'diplomatic', '[Letter to the German Ambassador, Buenos Aires, dated 19 Dec: he alone bears responsibility for the scuttling and will prove by his death that the fighting services of the Third Reich are ready to die for the honour of the flag]',
    '朗斯多夫留给驻阿根廷大使的信：自沉的责任由他一人承担，他将以死证明德国军人愿为军旗的荣誉而死。随后在布宜诺斯艾利斯的寓所中自杀。', ['wiki_en_langsdorff', 'time_1940'], 'medium', to='德国驻阿根廷大使'),
]}

dump(P('data/naval/battle.json'), battle)
dump(P('data/naval/raid.json'), raid)
dump(P('data/naval/montevideo.json'), mvd)
print('✓ 射击', len(fire), '命中', len(hits), '鱼雷', len(torpedoes), '烟幕', len(smoke), '损伤', len(damage), '电文', len(signals) + len(raid['signals']) + len(mvd['signals']))
