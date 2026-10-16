"""匈牙利：喀尔巴阡集群与快速军（south 代理）。"""
from south_lib import unit, near, mid

SRC = ('south_szeghy_2009', 'south_wiki_gyorshadtest', 'kirchubel_ag')

# 快速军军部轨迹（Andaházi Szeghy 2009 第二章）
MOB = (
    ('6.30', 'korosmezo', 'r', '在喀尔巴阡山口集结'),
    ('7.1/06:00', near('tatar_pass', 0.05, 0.05), 'e', '喀尔巴阡集群越过鞑靼山口'),
    ('7.3', near('kolomyja', 0.0, 0.0), 'a', '经科洛梅亚、戈罗坚卡指向德涅斯特河'),
    ('7.7', near('zalishchyky', 0.05, 0.0), 'a', '进抵德涅斯特河'),
    ('7.11', near('kamenets_podolsky', -0.35, 0.15), 'a', '经斯卡拉越过旧国界'),
    ('7.14', near('kamenets_podolsky', 0.05, 0.05), 'a', '在卡缅涅茨-波多利斯基集结'),
    ('7.19', near('bar', 0.0, 0.0), 'e', '向巴尔进攻'),
    ('7.22', near('zhmerinka', 0.0, 0.0), 'e', '日梅林卡两日激战'),
    ('7.23', near('tulchin', 0.0, 0.0), 'e', '攻占图利钦'),
    ('7.26', near('bratslav', 0.1, -0.1), 'e', '突破图利钦—布拉茨拉夫一线'),
    ('7.31', near('golovanevsk', -0.3, -0.1), 'e'),
    ('8.3/15:00', near('pervomaisk', -0.04, 0.0), 'e', '在佩尔沃迈斯克以西与德军第 16 装甲师会合'),
    ('8.8', near('pervomaisk', 0.1, -0.1), 'a'),
    ('8.12', near('nikolaev', 0.2, 0.25), 'e', '布格河与因古尔河之间的尼古拉耶夫战斗'),
    ('8.16', near('nikolaev', 0.05, 0.03), 'e', '随德军进入尼古拉耶夫'),
    ('8.28', near('krivoi_rog', 0.0, 0.0), 'r', '在克里沃罗格休整'),
    ('9.1', near('zaporozhye', -0.25, -0.05), 'e', '接防扎波罗热河曲的第聂伯河防线'),
    ('9.20', near('zaporozhye', -0.2, -0.05), 'e', '扎波罗热对岸 55 公里防区'),
    ('10.6', near('zaporozhye', -0.22, -0.05), 'a'),
    ('10.13', near('dnepropetrovsk', 0.25, 0.0), 'a', '经第聂伯罗彼得罗夫斯克大桥渡河'),
    ('10.20', [36.2, 48.6], 'e', '泥泞中向顿涅茨河推进'),
    ('10.26', [36.9, 48.85], 'e', '前出至彼得罗波列一线'),
    ('11.5', near('izium', -0.15, -0.1), 'e', '肃清伊久姆附近苏军后卫'),
    ('11.12', near('izium', -0.4, -0.15), 'a', '由德军第 257 步兵师接防'),
    ('11.15', [36.3, 48.75], 'w', '奉命撤出前线'),
    ('11.23', near('dnepropetrovsk', 0.05, 0.0), 'r', '在第聂伯罗彼得罗夫斯克集结待运'),
    ('11.29', near('dnepropetrovsk', -0.05, 0.02), 'N', '分批经文尼察、科洛梅亚回国'),
)


def build():
    U = []
    U.append(unit('hu.carpathian_group', 'HU', 'army', 'hq', 'de.17a', '喀尔巴阡集群', 'Kárpát-csoport', 'KárpCs',
                  cmd=('松鲍特海伊', 'Szombathelyi Ferenc'), men=40000, model='inf_hu',
                  trk=(('6.27', near('korosmezo', -0.05, 0.0), 'r', '匈牙利 6 月 27 日对苏宣战'),
                       ('7.1/06:00', near('tatar_pass', 0.0, 0.0), 'e', '越过喀尔巴阡山'),
                       ('7.4', near('kolomyja', -0.05, 0.05), 'a'), ('7.7', near('stanislav', 0.1, -0.15), 'a'),
                       ('7.9', near('stanislav', 0.05, -0.1), 'X', '集群撤销，快速军改归德军指挥')),
                  hist='喀尔巴阡集群由松鲍特海伊指挥，约 4 万人，辖第 VIII 军（第 1 山地旅、第 8 边防旅）和米克洛什的快速军。匈牙利在 6 月 26 日卡绍遭轰炸后于 27 日对苏宣战，7 月 1 日集群越过鞑靼山口等喀尔巴阡山口，攻击苏军第 12 集团军，进至德涅斯特河。'
                       '因步兵旅跟不上进度，7 月 9 日集群撤销，快速军直接归南方集团军群指挥，步兵旅转为加利西亚—波多利亚的占领部队。',
                  src=SRC, conf='medium'))
    U.append(unit('hu.1mtn_bde', 'HU', 'brigade', 'mountain', 'hu.carpathian_group', '第 1 山地旅', '1. hegyidandár', '1.Hgy',
                  model='inf_hu',
                  trk=(('6.29', near('korosmezo', 0.0, 0.03), 'r'), ('7.1/06:00', near('tatar_pass', 0.0, 0.02), 'e', '突破鞑靼山口'),
                       ('7.3', near('delyatin', 0.0, 0.0), 'a'), ('7.6', near('stanislav', 0.0, -0.05), 'a', '进驻斯坦尼斯拉夫地区'),
                       ('7.20', near('stanislav', 0.05, 0.0), 'a', '担任占领勤务'), ('8.20', near('stanislav', 0.05, 0.02), 'N', '返国')),
                  hist='第 1 山地旅属喀尔巴阡集群的第 VIII 军，7 月 1 日越过鞑靼山口，经杰利亚京进入东加利西亚，此后在斯坦尼斯拉夫一带担任占领勤务，8 月起陆续撤回匈牙利。',
                  src=SRC, conf='low'))
    U.append(unit('hu.8border_bde', 'HU', 'brigade', 'border', 'hu.carpathian_group', '第 8 边防旅', '8. határvadászdandár', '8.Hv',
                  model='inf_hu',
                  trk=(('6.29', near('korosmezo', 0.15, 0.05), 'r'), ('7.1/06:00', near('tatar_pass', 0.15, 0.05), 'e'),
                       ('7.4', near('kolomyja', 0.05, -0.05), 'a'), ('7.8', near('sniatyn', 0.0, 0.0), 'a', '控制德涅斯特河以南地区'),
                       ('8.20', near('sniatyn', 0.0, 0.02), 'N', '返国')),
                  hist='第 8 边防旅属喀尔巴阡集群，7 月 1 日越过喀尔巴阡山，经科洛梅亚进至斯尼亚滕—德涅斯特河一线，此后转为占领部队，8 月起撤回国内。',
                  src=SRC, conf='low'))
    U.append(unit('hu.mobile_corps', 'HU', 'corps', 'motorized', 'de.17a', '快速军', 'Gyorshadtest', 'Gyors',
                  cmd=('米克洛什', 'Dálnoki Miklós Béla'), men=25000, tanks=160, model='inf_hu',
                  trk=MOB,
                  hist='匈牙利快速军由米克洛什指挥，辖第 1、2 摩托化旅和第 1 骑兵旅，约 2.5 万人，装备 95 辆托尔迪轻型坦克和 65 辆 CV-35 超轻型坦克。7 月 1 日随喀尔巴阡集群越山，9 日归德军指挥，经卡缅涅茨-波多利斯基、日梅林卡、图利钦向东，8 月 3 日在佩尔沃迈斯克与德军第 16 装甲师会合，封闭乌曼口袋。'
                       '8 月中旬参加尼古拉耶夫战斗，8 月 30 日至 10 月 6 日守扎波罗热河曲的第聂伯河，10 月在泥泞中推进到伊久姆附近的北顿涅茨河，11 月 15 日撤出前线回国。1941 年共阵亡约 2,700 人，托尔迪坦克损失八成。',
                  src=SRC, conf='high'))
    U.append(unit('hu.1mot_bde', 'HU', 'brigade', 'motorized', 'hu.mobile_corps', '第 1 摩托化旅', '1. gépkocsizó dandár', '1.Gk',
                  cmd=('马约尔', 'Major Jenő'), men=7000, model='inf_hu', equip=(('toldi', 95), ('l3', 65)),
                  trk=(('6.30', near('korosmezo', 0.05, -0.03), 'r'), ('7.1/06:00', near('tatar_pass', 0.03, 0.0), 'e'), ('7.4', near('kolomyja', 0.05, 0.05), 'a'),
                       ('7.8', near('zalishchyky', 0.0, 0.03), 'a'), ('7.14', near('kamenets_podolsky', 0.1, 0.1), 'a'), ('7.21', near('bar', 0.25, 0.05), 'e'),
                       ('7.24', near('tulchin', 0.1, 0.05), 'e'), ('8.1', near('golovanevsk', -0.15, -0.25), 'e'), ('8.4', near('pervomaisk', -0.1, 0.02), 'e'),
                       ('8.12', near('nikolaev', 0.3, 0.3), 'e', '尼古拉耶夫战斗'), ('8.17', near('nikolaev', 0.08, 0.05), 'a'), ('8.28', near('krivoi_rog', 0.05, 0.03), 'r'),
                       ('9.2', near('zaporozhye', -0.15, -0.08), 'e', '第聂伯河防御'), ('10.6', near('zaporozhye', -0.12, -0.08), 'a'), ('10.14', near('dnepropetrovsk', 0.35, -0.05), 'a'),
                       ('10.22', [36.35, 48.65], 'e'), ('10.28', [37.0, 48.88], 'e'), ('11.5', near('izium', -0.2, -0.12), 'e'), ('11.13', near('izium', -0.45, -0.2), 'w'),
                       ('11.23', near('dnepropetrovsk', 0.06, 0.01), 'r'), ('12.2', near('vinnitsa', 0.0, 0.0), 'N', '经文尼察回国')),
                  hist='第 1 摩托化旅由马约尔少将指挥，随快速军越过喀尔巴阡山，7 月下旬在巴尔、日梅林卡、图利钦作战，8 月参加乌曼合围和尼古拉耶夫战斗，秋季守第聂伯河，10 月在泥泞中推进到伊久姆附近，11 月撤回国内。',
                  src=SRC, conf='medium'))
    U.append(unit('hu.2mot_bde', 'HU', 'brigade', 'motorized', 'hu.mobile_corps', '第 2 摩托化旅', '2. gépkocsizó dandár', '2.Gk',
                  cmd=('弗勒什', 'Vörös János'), men=7000, model='inf_hu', equip=(('toldi', 95), ('l3', 65)),
                  trk=(('6.30', near('korosmezo', -0.05, 0.03), 'r'), ('7.1/06:00', near('tatar_pass', -0.03, 0.03), 'e'), ('7.4', near('kolomyja', -0.05, 0.0), 'a'),
                       ('7.8', near('zalishchyky', -0.05, 0.05), 'a'), ('7.14', near('kamenets_podolsky', 0.0, 0.15), 'a'), ('7.19', near('bar', -0.05, -0.03), 'e', '向巴尔进攻'),
                       ('7.21', near('zhmerinka', 0.0, -0.03), 'e', '日梅林卡激战'), ('7.23', near('tulchin', -0.05, 0.03), 'e'), ('7.30', near('golovanevsk', -0.25, -0.2), 'e'),
                       ('8.3/15:00', near('pervomaisk', -0.05, 0.0), 'e', '前锋进至佩尔沃迈斯克以西 3 公里'), ('8.12', near('nikolaev', 0.15, 0.35), 'e'),
                       ('8.17', near('nikolaev', 0.0, 0.05), 'a'), ('8.28', near('krivoi_rog', -0.05, 0.0), 'r'), ('9.2', near('zaporozhye', -0.3, -0.03), 'e'),
                       ('10.6', near('zaporozhye', -0.28, -0.03), 'a'), ('10.15', near('dnepropetrovsk', 0.45, 0.0), 'a'), ('10.24', [36.6, 48.75], 'e'),
                       ('11.4', near('izium', -0.1, -0.15), 'e', '击退苏军小规模反击'), ('11.12', near('izium', -0.4, -0.25), 'w'), ('11.23', near('dnepropetrovsk', 0.03, -0.02), 'r'),
                       ('12.4', near('vinnitsa', 0.05, 0.0), 'N', '经文尼察回国')),
                  hist='第 2 摩托化旅由弗勒什准将指挥，7 月 19 日起向巴尔、日梅林卡进攻，8 月 3 日前锋进至佩尔沃迈斯克以西，与德军会合封闭乌曼口袋，随后参加尼古拉耶夫战斗和第聂伯河防御，10–11 月推进至伊久姆以南，11 月中旬撤出。',
                  src=SRC, conf='medium'))
    U.append(unit('hu.1cav_bde', 'HU', 'brigade', 'cavalry', 'hu.mobile_corps', '第 1 骑兵旅', '1. lovasdandár', '1.Lov',
                  cmd=('沃陶伊', 'Vattay Antal'), men=6000, model='inf_hu',
                  trk=(('6.30', near('korosmezo', 0.1, 0.0), 'r'), ('7.2', near('tatar_pass', 0.08, 0.1), 'a'), ('7.5', near('kolomyja', 0.15, 0.05), 'a'),
                       ('7.11', near('kamenets_podolsky', -0.35, 0.12), 'a', '经米哈尔恰桥渡德涅斯特河，在斯卡拉越过旧国界'), ('7.15', near('kamenets_podolsky', 0.15, 0.05), 'a'),
                       ('7.23', near('tulchin', -0.1, -0.05), 'e', '在久林协同摩托化旅'), ('8.2', near('golovanevsk', -0.4, -0.15), 'e'), ('8.8', near('pervomaisk', -0.25, -0.1), 'a'),
                       ('8.20', near('voznesensk', 0.1, 0.05), 'a'), ('8.30', near('nikopol', 0.15, 0.0), 'e', '第聂伯河防御'), ('9.25', near('nikopol', 0.2, 0.02), 'e'),
                       ('10.7', near('nikopol', 0.1, 0.1), 'w', '首批撤出前线'), ('10.20', near('krivoi_rog', 0.0, 0.05), 'r'), ('11.5', near('vinnitsa', -0.1, 0.0), 'N', '回国')),
                  hist='第 1 骑兵旅由沃陶伊指挥，7 月 11 日经米哈尔恰桥渡德涅斯特河、在斯卡拉越过旧国界，7 月下旬配合摩托化旅在图利钦一带作战，8 月参加乌曼和布格河方向的追击，秋季在尼科波尔—扎波罗热之间守第聂伯河，10 月起作为快速军首批部队撤回国内。',
                  src=SRC, conf='medium'))
    return U
