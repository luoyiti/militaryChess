"""斯洛伐克远征军（south 代理）。"""
from south_lib import unit, near, place

SRC = ('south_wiki_sk_rapid', 'south_wiki_sk_army', 'kirchubel_ag')

place('medzilaborce', 21.905, 49.270, '梅济拉博尔采', 'Medzilaborce', 'town', 4, 'SK')
place('lesko', 22.330, 49.470, '莱斯科', 'Lisko', 'town', 4, 'DE')
place('gorodok_pod', 26.580, 49.170, '戈罗多克', 'Городок', 'village', 4, 'SU')
place('khodosovka', 30.530, 50.270, '霍多索夫卡', 'Ходосовка', 'village', 4, 'SU')
place('ukrainka', 30.750, 50.150, '乌克兰卡', 'Украинка', 'village', 4, 'SU')
place('kumshatsky', 38.880, 47.560, '库姆沙茨基', 'Кумшацкий', 'village', 4, 'SU')


def build():
    U = []
    U.append(unit('sk.army_group', 'SK', 'army', 'hq', 'de.17a', '斯洛伐克远征军集团', 'Slovenská armádna skupina', 'SlArmSk',
                  cmd=('恰特洛什', 'Ferdinand Čatloš'), men=45000, model='inf_sk',
                  trk=(('6.23', near('medzilaborce', 0.05, 0.05), 'r', '6 月 23 日对苏宣战'), ('6.26', near('lesko', 0.0, 0.0), 'a', '越过前苏联边界'),
                       ('7.3', near('sambor', 0.0, 0.0), 'a'), ('7.20', near('lvov', -0.1, -0.15), 'a', '跟随第 17 集团军'), ('8.10', near('lvov', -0.15, -0.2), 'X', '集团解散，组建快速师与保安师')),
                  hist='斯洛伐克远征军集团由国防部长恰特洛什亲自指挥，约 4.5 万人，辖第 1、2 步兵师和皮尔福塞克快速集群，6 月下旬从梅济拉博尔采一带越过喀尔巴阡山，经莱斯科、桑博尔跟随德军第 17 集团军推进，但步兵师缺乏机动能力。8 月集团解散，主力回国，留下快速师和保安师。',
                  src=SRC, conf='medium'))
    U.append(unit('sk.1id', 'SK', 'division', 'infantry', 'sk.army_group', '斯洛伐克第 1 步兵师', '1. pešia divízia', 'SK 1.PD',
                  model='inf_sk',
                  trk=(('6.24', near('medzilaborce', 0.15, 0.1), 'r'), ('6.28', near('lesko', 0.15, 0.05), 'a'), ('7.8', near('sambor', 0.15, 0.05), 'a'),
                       ('7.25', near('lvov', -0.05, -0.25), 'a'), ('8.10', near('lvov', -0.1, -0.3), 'X', '解散改编')),
                  hist='斯洛伐克第 1 步兵师 6 月下旬越境，在第 17 集团军后方经莱斯科、桑博尔向利沃夫方向行军，未参加大规模战斗，8 月远征军集团改组时撤销，部分兵员编入快速师。',
                  src=SRC, conf='low'))
    U.append(unit('sk.2id', 'SK', 'division', 'infantry', 'sk.army_group', '斯洛伐克第 2 步兵师', '2. pešia divízia', 'SK 2.PD',
                  model='inf_sk',
                  trk=(('6.24', near('medzilaborce', -0.1, 0.1), 'r'), ('6.29', near('lesko', -0.05, 0.1), 'a'), ('7.10', near('sambor', 0.05, 0.15), 'a'),
                       ('7.28', near('lvov', -0.25, -0.2), 'a'), ('8.10', near('lvov', -0.3, -0.25), 'X', '解散改编')),
                  hist='斯洛伐克第 2 步兵师随远征军集团越境，担任第 17 集团军后方警戒，8 月集团改组时撤销，兵员一部组成保安师。',
                  src=SRC, conf='low'))
    U.append(unit('sk.rapid_bde', 'SK', 'brigade', 'motorized', 'de.17a', '皮尔福塞克快速旅', 'Rýchla brigáda (Pilfousek)', 'Pilf',
                  cmd=('皮尔福塞克', 'Rudolf Pilfousek'), men=4000, model='pz35t', equip=(('pz35t', None), ('pz38t', None)),
                  trk=(('6.24', near('medzilaborce', 0.25, 0.15), 'r', '在梅济拉博尔采组建快速集群'), ('6.25', [22.45, 49.5], 'e', '越过桑河，首战伤亡 7 人'),
                       ('6.27', near('sanok', 0.0, 0.0), 'a', '肃清萨诺克一带工事'), ('7.2', near('sambor', 0.05, 0.05), 'r', '在桑博尔休整'),
                       ('7.7', near('lvov', 0.0, 0.0), 'a', '扩编为快速旅'), ('7.11', near('tarnopol', 0.0, 0.0), 'a'), ('7.15', 'gorodok_pod', 'a', '进抵旧国界'),
                       ('7.20', near('vinnitsa', -0.25, 0.05), 'a'), ('7.22', near('lipovets', 0.0, 0.0), 'e', '利波韦茨战斗，损失惨重'),
                       ('7.24', near('ilintsy', 0.0, 0.0), 'I', '撤至伊林齐，失去战斗力')),
                  hist='快速集群由皮尔福塞克上校指挥，6 月 25 日越过桑河向沃伊特科瓦推进，7 月 7 日扩编为快速旅，经利沃夫、捷尔诺波尔东进。7 月 22 日在文尼察以东的利波韦茨对苏军阵地发动进攻，遭到重大伤亡，次日苏军才撤离该镇。恰特洛什随即宣布该旅不宜再战，撤至伊林齐休整，8 月并入新组建的快速师。',
                  src=SRC, conf='medium'))
    U.append(unit('sk.rapid_div', 'SK', 'division', 'motorized', 'de.pzgr1', '斯洛伐克快速师', 'Rýchla divízia', 'SK RD',
                  cmd=('图拉内茨', 'Jozef Turanec'), men=8415, model='inf_sk', frm='8.20',
                  trk=(('8.20', near('ilintsy', 0.03, 0.02), 'r', '以快速旅和远征军余部组建'), ('9.14', mid_kh(), 'a', '接防霍多索夫卡—乌克兰卡的第聂伯河右岸'),
                       ('9.28', near('ukrainka', 0.05, 0.0), 'a'), ('10.10', near('belaya_tserkov', 0.5, -0.4), 'a', '南调顿巴斯，车辆大多陷入泥泞'),
                       ('10.25', near('kirovograd', 0.6, 0.1), 'a'), ('11.8', near('dnepropetrovsk', 0.1, -0.1), 'a'), ('11.20', near('mariupol', 0.1, 0.1), 'a'),
                       ('11.28', near('kumshatsky', -0.1, -0.05), 'e', '在库姆沙茨基一带接防'), ('12.5', near('kumshatsky', -0.05, -0.08), 'e', '退守米乌斯河防线')),
                  hist='快速师 8 月以快速旅和远征军余部组建，8,415 人，先由图拉内茨上校、11 月 27 日起由马拉尔上校指挥。9 月 14 日接防基辅以南霍多索夫卡至乌克兰卡之间的第聂伯河右岸，基辅陷落后南调顿巴斯，车辆大多陷在秋季泥泞中。11 月部署在塔甘罗格以北，12 月退守米乌斯河。',
                  src=SRC, conf='medium'))
    U.append(unit('sk.security_div', 'SK', 'division', 'infantry', 'de.hgr_sued', '斯洛伐克保安师', 'Zaisťovacia divízia', 'SK ZD',
                  model='inf_sk', frm='8.20',
                  trk=(('8.20', near('zhitomir', -0.3, -0.1), 'a', '组建，担任后方警戒'), ('10.1', near('zhitomir', -0.2, -0.05), 'a'), ('12.5', near('zhitomir', -0.2, -0.05), 'a')),
                  hist='保安师 8 月以远征军集团留下的部队组建，在乌克兰西部日托米尔一带的后方地区担任交通线警戒和清剿任务，不参加正面作战。',
                  src=SRC, conf='low'))
    return U


def mid_kh():
    from south_lib import mid
    return mid('khodosovka', 'ukrainka', 0.5)
