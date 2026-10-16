"""意大利驻俄远征军 CSIR（south 代理）。"""
from south_lib import unit, near, place

SRC = ('south_wiki_csir_it', 'south_messe_1947', 'kirchubel_ag')

place('maramarossziget', 23.920, 47.930, '马拉马罗什锡盖特', 'Máramarossziget', 'town', 4, 'HU')
place('verkhnedneprovsk', 34.330, 48.655, '上第聂伯罗夫斯克', 'Верхнеднепровск', 'town', 4, 'SU')
place('tsarichanka', 34.480, 48.940, '察里琴卡', 'Царичанка', 'village', 4, 'SU')
place('nikitovka', 38.040, 48.360, '尼基托夫卡', 'Никитовка', 'village', 4, 'SU', True)
place('khatsapetovka', 38.270, 48.300, '哈采佩托夫卡', 'Хацапетовка', 'village', 4, 'SU')


def build():
    U = []
    U.append(unit('it.csir', 'IT', 'corps', 'hq', 'de.pzgr1', '意大利驻俄远征军', 'Corpo di Spedizione Italiano in Russia', 'CSIR',
                  cmd=('梅塞', 'Giovanni Messe'), men=62000, model='inf_it',
                  frm='7.25',
                  trk=(('7.25', near('maramarossziget', 0.1, 0.0), 'r', '216 列军列运抵喀尔巴阡山下'), ('8.3', near('suceava', 0.3, 0.1), 'r', '在罗马尼亚北部集结'),
                       ('8.14', [29.4, 47.8], 'a', '归克莱斯特装甲集群指挥'), ('8.24', [31.8, 47.85], 'a'), ('9.2', [33.4, 48.35], 'a'),
                       ('9.15', near('verkhnedneprovsk', 0.0, -0.05), 'a', '第聂伯河右岸'), ('9.30', near('petrikovka', -0.05, 0.05), 'e', '彼得里科夫卡合围'),
                       ('10.11', near('pavlograd', 0.0, 0.05), 'e', '协同攻占巴甫洛格勒'), ('10.21', near('stalino', 0.0, 0.05), 'e', '斯大林诺'),
                       ('11.3', near('gorlovka', -0.05, -0.03), 'e', '戈尔洛夫卡'), ('11.20', near('gorlovka', 0.0, -0.05), 'a'), ('12.5', near('gorlovka', 0.05, -0.05), 'e', '冬季阵地')),
                  hist='意大利驻俄远征军由梅塞指挥（原任津加莱斯 7 月中旬病倒），约 6.2 万人，辖“帕苏比奥”“都灵”两个汽车运输步兵师和第 3 快速师“阿梅德奥·德·奥斯塔亲王”。7 月 10 日至 8 月 5 日用 216 列军列运抵喀尔巴阡山下，许多部队随后徒步或骑马行军数百公里。'
                       '8 月中旬归克莱斯特指挥，9 月 28–30 日在第聂伯河弯的彼得里科夫卡合围苏军，10 月参加攻占巴甫洛格勒和斯大林诺，11 月 2 日攻占戈尔洛夫卡，此后在顿巴斯越冬。',
                  src=SRC, conf='high'))
    U.append(unit('it.pasubio', 'IT', 'division', 'motorized', 'it.csir', '“帕苏比奥”汽车运输步兵师', '9ª Divisione fanteria autotrasportabile "Pasubio"', 'Pasubio',
                  cmd=('乔瓦内利', 'Vittorio Giovanelli'), men=11000, model='inf_it', frm='7.20',
                  trk=(('7.20', near('maramarossziget', 0.2, -0.05), 'r'), ('7.30', near('suceava', 0.5, 0.0), 'a', '应马肯森要求紧急开赴前线'), ('8.5', [29.3, 47.8], 'a'),
                       ('8.10', near('voznesensk', -0.05, 0.15), 'a', '抵达沃兹涅先斯克以北的布格河'), ('8.13', near('voznesensk', -0.3, 0.05), 'e', '“两河之战”：在波克罗夫斯科耶击败一个苏军团'),
                       ('8.18', [32.9, 48.1], 'a'), ('8.21', near('verkhnedneprovsk', 0.0, 0.0), 'a', '进抵第聂伯河'), ('9.21', near('verkhnedneprovsk', 0.12, 0.12), 'e', '全军发起进攻'),
                       ('9.23', 'tsarichanka', 'e', '在察里琴卡夺取奥列利河桥头堡'), ('9.30', near('petrikovka', 0.0, 0.03), 'e', '彼得里科夫卡合围完成'),
                       ('10.11', near('pavlograd', 0.05, 0.0), 'e'), ('10.20', [37.4, 48.1], 'a'), ('10.29', [37.9, 48.25], 'e'), ('11.2', 'gorlovka', 'e', '巷战攻占戈尔洛夫卡'),
                       ('11.8', 'nikitovka', 'e', '第 80 团在尼基托夫卡被围'), ('11.13', near('nikitovka', 0.02, -0.02), 'e', '解围'), ('12.5', near('khatsapetovka', -0.03, 0.0), 'e', '哈采佩托夫卡战斗开始')),
                  hist='“帕苏比奥”师是远征军的先头师，7 月 30 日应马肯森要求紧急开赴前线，8 月 10 日抵达沃兹涅先斯克以北的布格河，12–13 日在波克罗夫斯科耶一带打赢意军在苏联的首战“两河之战”。9 月下旬渡奥列利河，30 日在彼得里科夫卡与德军合围苏军。11 月 2 日经巷战攻占戈尔洛夫卡，第 80 团在尼基托夫卡被围数日后突围。',
                  src=SRC, conf='medium'))
    U.append(unit('it.torino', 'IT', 'division', 'infantry', 'it.csir', '“都灵”汽车运输步兵师', '52ª Divisione fanteria autotrasportabile "Torino"', 'Torino',
                  cmd=('曼齐', 'Luigi Manzi'), men=11000, model='inf_it', frm='7.28',
                  trk=(('7.28', near('maramarossziget', 0.25, 0.05), 'r'), ('8.5', near('suceava', 0.2, 0.15), 'a', '大部徒步行军'), ('8.16', [28.3, 47.75], 'a'),
                       ('8.27', [30.6, 47.85], 'a'), ('9.5', near('verkhnedneprovsk', -0.15, -0.08), 'a', '非摩托化部队抵达第聂伯河'), ('9.28', near('petrikovka', -0.2, -0.05), 'e'),
                       ('9.30', near('petrikovka', -0.05, -0.04), 'e', '彼得里科夫卡合围'), ('10.12', near('pavlograd', -0.1, -0.05), 'a'), ('10.22', [37.2, 47.95], 'a'),
                       ('11.10', [37.8, 48.15], 'e'), ('11.19', [37.95, 48.2], 'e'), ('12.5', [38.0, 48.22], 'e')),
                  hist='“都灵”师名为汽车运输师，实际大部靠徒步行军，8 月从罗马尼亚北部一路走到第聂伯河，9 月 5 日非摩托化部队才抵达河岸。9 月底参加彼得里科夫卡合围，10 月随远征军东进顿巴斯，11 月在斯大林诺—戈尔洛夫卡一带作战。',
                  src=SRC, conf='medium'))
    U.append(unit('it.celere', 'IT', 'division', 'cavalry', 'it.csir', '第 3 快速师', '3ª Divisione celere "Principe Amedeo Duca d\'Aosta"', '3.Celere',
                  cmd=('马拉扎尼', 'Mario Marazzani'), men=8000, model='inf_it', frm='7.25',
                  trk=(('7.25', near('maramarossziget', 0.15, 0.05), 'r'), ('8.5', near('suceava', 0.4, 0.05), 'a'), ('8.15', [28.9, 47.75], 'a'), ('8.25', [31.5, 47.9], 'a'),
                       ('9.10', near('verkhnedneprovsk', 0.05, -0.05), 'a'), ('9.30', near('petrikovka', 0.08, 0.0), 'e', '彼得里科夫卡合围'), ('10.11', near('pavlograd', 0.05, 0.08), 'e'),
                       ('10.20', near('stalino', -0.03, 0.03), 'e', '第 3 狙击兵团夺取斯大林诺西北车站'), ('11.1', 'rykovo', 'e', '狙击兵攻占雷科沃'), ('11.20', near('rykovo', 0.05, -0.05), 'e'),
                       ('12.5', near('rykovo', 0.05, -0.08), 'e')),
                  hist='第 3 快速师下辖萨沃亚骑兵团、诺瓦拉枪骑兵团和第 3 狙击兵团，是远征军机动性最强的部队。9 月底参加彼得里科夫卡合围，10 月 20 日第 3 狙击兵团夺取斯大林诺西北车站，11 月 1 日攻占雷科沃，此后在顿巴斯防守，12 月底承受苏军“圣诞战役”的冲击。',
                  src=SRC, conf='medium'))
    return U
