#!/usr/bin/env python3
"""按累积里程碑生成 fronts/*.json（控制区关键帧）。

fronts 的 control 槽是「截至该时刻的全部控制区」，因此用累积多边形列表：
每个里程碑追加一块新的概势多边形。坐标为作战地域示意，不是逐村确占。
生成后可单独重跑；输出 UTF-8 JSON。
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTS = os.path.join(HERE, '..', 'data', 'fronts')

# 出发阵地：1937 年淞沪、南京战事形成的概势（南京—芜湖以东），非精确界线
START_1937 = [[118.5, 31.2], [118.5, 33.5], [116.8, 33.5], [117.0, 32.9], [117.4, 32.4], [117.7, 32.1], [117.95, 31.75], [117.9, 31.35], [118.15, 31.15], [118.5, 31.2]]

# 各方向累积多边形（key 为里程碑 id，value 为多边形外环）
POLYS = {
    'start1937': START_1937,
    'anqing': [[117.2, 30.35], [117.35, 30.5], [117.28, 30.72], [117.02, 30.82], [116.82, 30.68], [116.85, 30.45], [117.0, 30.32], [117.2, 30.35]],
    'qianshan': [[117.3, 30.3], [117.5, 30.55], [117.15, 31.05], [116.75, 31.0], [116.42, 30.82], [116.5, 30.5], [116.9, 30.28], [117.3, 30.3]],
    'madang': [[116.85, 29.9], [117.0, 29.95], [116.95, 30.15], [116.6, 30.2], [116.5, 29.98], [116.6, 29.88], [116.85, 29.9]],
    'hukou': [[116.9, 29.85], [116.6, 30.15], [116.3, 30.05], [116.05, 29.85], [116.1, 29.6], [116.4, 29.55], [116.75, 29.6], [116.9, 29.85]],
    'jiujiang': [[116.95, 29.8], [116.6, 30.15], [116.3, 30.05], [115.95, 29.85], [115.9, 29.6], [116.2, 29.5], [116.6, 29.5], [116.95, 29.65], [116.95, 29.8]],
    'xiaochikou': [[116.0, 29.55], [116.1, 29.75], [115.85, 29.85], [115.7, 29.7], [115.75, 29.55], [116.0, 29.55]],
    'taihu': [[116.4, 30.75], [116.5, 30.45], [116.3, 30.1], [115.9, 30.05], [115.85, 30.45], [116.1, 30.8], [116.4, 30.75]],
    'ruichang': [[116.1, 29.45], [116.15, 29.8], [115.6, 29.9], [115.45, 29.6], [115.6, 29.4], [116.1, 29.45]],
    'xingzi': [[116.1, 29.2], [116.2, 29.5], [115.9, 29.55], [115.75, 29.3], [115.9, 29.15], [116.1, 29.2]],
    'luan': [[116.75, 31.55], [116.9, 31.85], [116.5, 32.1], [116.2, 31.85], [116.15, 31.4], [116.45, 31.25], [116.75, 31.55]],
    'huoshan': [[116.55, 31.2], [116.7, 31.5], [116.35, 31.65], [116.1, 31.4], [116.2, 31.1], [116.55, 31.2]],
    'huangmei': [[116.15, 30.0], [116.3, 30.1], [116.2, 30.3], [115.85, 30.3], [115.75, 30.05], [115.9, 29.85], [116.15, 30.0]],
    'guangji': [[115.85, 30.15], [116.0, 30.2], [115.95, 30.5], [115.6, 30.55], [115.45, 30.3], [115.55, 30.1], [115.85, 30.15]],
    'fujinshan': [[116.0, 31.7], [116.2, 32.0], [115.85, 32.15], [115.6, 31.95], [115.55, 31.7], [115.8, 31.55], [116.0, 31.7]],
    'shangcheng': [[115.7, 31.6], [115.9, 31.8], [115.6, 32.0], [115.35, 31.85], [115.3, 31.6], [115.5, 31.45], [115.7, 31.6]],
    'gushi_huangchuan': [[115.9, 32.0], [116.1, 32.2], [115.5, 32.3], [115.0, 32.15], [114.95, 31.95], [115.4, 31.9], [115.9, 32.0]],
    'luoshan': [[114.95, 32.1], [114.9, 32.3], [114.45, 32.35], [114.3, 32.1], [114.55, 32.0], [114.95, 32.1]],
    'matou_fuchi': [[115.75, 29.7], [115.9, 29.85], [115.6, 29.95], [115.35, 29.8], [115.45, 29.65], [115.75, 29.7]],
    'tianjiazhen': [[115.5, 29.8], [115.65, 29.95], [115.4, 30.1], [115.15, 29.95], [115.2, 29.75], [115.5, 29.8]],
    'wanjialing': [[115.75, 29.5], [115.85, 29.7], [115.55, 29.75], [115.4, 29.55], [115.55, 29.45], [115.75, 29.5]],
    'ruoxi': [[115.35, 29.3], [115.5, 29.45], [115.2, 29.55], [115.0, 29.35], [115.15, 29.2], [115.35, 29.3]],
    'xinyang': [[114.35, 32.05], [114.4, 32.3], [114.0, 32.35], [113.85, 32.1], [114.05, 31.95], [114.35, 32.05]],
    'yangxin_daye': [[115.4, 29.7], [115.35, 29.95], [114.95, 30.15], [114.7, 29.9], [114.85, 29.65], [115.15, 29.6], [115.4, 29.7]],
    'huangpi': [[114.6, 30.7], [114.75, 30.9], [114.4, 31.0], [114.15, 30.8], [114.25, 30.6], [114.6, 30.7]],
    'wuhan': [[114.45, 30.45], [114.6, 30.6], [114.5, 30.75], [114.15, 30.7], [114.1, 30.5], [114.3, 30.4], [114.45, 30.45]],
}

# 里程碑序列：(at, transition, [追加的多边形 key], note, sources, confidence)
FRAMES = [
    ('1938-02-18T00:00', 'step', ['start1937'],
     '1938年2月会战前奏开始时，南京、芜湖及以东已于1937年淞沪、南京战事中沦陷，此为日军溯江出发阵地的概势示意，非精确界线。',
     ['senshi_chugoku', 'mackinnon_wuhan_1996'], 'low'),
    ('1938-06-12T00:00', 'step', ['start1937', 'anqing'],
     '6月12日波田支队溯江在安庆下游登陆，安庆当日—次日陷落（日期有12/13日两说，取多数中方档案与登陆当日口径）；第6师团陆上已占舒城、桐城，指向潜山。登陆为日级 step，不表示逐镇确占。',
     ['danganju_youxue_14', 'sushengxiong_hata', 'zhwiki_wuhan'], 'medium'),
    ('1938-06-18T00:00', None, ['start1937', 'qianshan'],
     '6月17日第6师团占潜山，安庆—潜山走廊打通；6月18日大本营《大陆命第119号》下达汉口作战准备命令。',
     ['senshi_chugoku', 'zhwiki_wuhan'], 'medium'),
    ('1938-06-26T00:00', 'step', ['start1937', 'qianshan', 'madang'],
     '6月26日拂晓日军放毒气后在娘娘庙、牛山矶登陆迂回，马当要塞当日陷落（舰队6月29日扫雷后始通封锁线，二者分属不同日期）。马当失守后蒋介石震怒，后以增援迟缓罪枪决第167师师长薛蔚英。',
     ['danganju_youxue_14', 'zhwiki_wuhan', 'tan_feicheng_2010'], 'medium'),
    ('1938-07-04T00:00', None, ['start1937', 'qianshan', 'hukou'],
     '7月4日（《畑俊六日誌》作5日）湖口失守，波田支队与第106师团合攻；守军第26师撤退时船少，1300余非战斗人员多溺亡鄱阳湖。',
     ['danganju_youxue_14', 'sushengxiong_hata', 'zhwiki_wuhan'], 'medium'),
    ('1938-07-26T00:00', 'step', ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou'],
     '7月22—23日波田支队冒雨在九江东南姑塘登陆（step），7月26日晚九江陷落，同日江北小池口失守、第6师团占太湖。张发奎因九江速败被责令交出指挥权，赣北实归薛岳。',
     ['danganju_youxue_14', 'sushengxiong_hata', 'zhwiki_wuhan', 'mackinnon_wuhan_1996'], 'medium'),
    ('1938-08-04T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei'],
     '8月初江北第6师团连下宿松（8/1）、黄梅（8/4）（太湖7/26陷落，日期采日方战史系统；英文维基8月3日同陷三地说不取）。南岸日军占九江—湖口全线，指向瑞昌。',
     ['kangzhan_yanjiu_gongfang', 'zhwiki_wuhan'], 'medium'),
    ('1938-08-24T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi'],
     '8月24日瑞昌失守（波田支队8/10登陆、第9师团8/16加入后攻陷）；8月20日第101师团渡鄱阳湖在星子登陆（8/21星子失守）；南浔线金官桥第106师团受创停攻。',
     ['danganju_youxue_14', 'zhwiki_wuhan', 'er_shi_guan_minglu'], 'medium'),
    ('1938-08-28T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan'],
     '8月27—28日第2军自合肥分两路西进：北路第10师团8/28占六安，南路第13师团8/28—29占霍山转叶家集——大别山北麓战事展开。中方8/27—28一度收复太湖、宿松，8/30日军增援反攻后退守广济。',
     ['zhwiki_wuhan', 'er_shi_guan_minglu', 'kangzhan_yanjiu_gongfang'], 'medium'),
    ('1938-09-06T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji'],
     '9月6日广济失陷（9/8中方一度反攻收复县城一部，旋得旋失；同日武穴失陷）。广济方向日军施放毒气报复，中方2000余人中毒伤亡。',
     ['zhwiki_wuhan', 'danganju_youxue_14'], 'medium'),
    ('1938-09-11T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan'],
     '9月2—11日富金山战役：第71军宋希濂部阻击第13师团十昼夜，9/11主阵地失守，日军被迫调第16师团加入。中方称毙伤日军数千（日方65联队补充记录亦惨重），口径见事件注记。',
     ['zhwiki_fujinshan', 'danganju_youxue_14', 'kangzhan_yanjiu_gongfang'], 'medium'),
    ('1938-09-16T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng'],
     '9月16日日军占商城，守军撤往大别山小界岭—沙窝一线续阻——此线为武汉会战北线唯一未被突破的战略防线，直至10月下旬。',
     ['zhwiki_wuhan', 'zhwiki_fujinshan'], 'medium'),
    ('1938-09-19T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan'],
     '9月16—19日潢川攻防：张自忠第59军苦战约十二昼夜，9/17日军第2军第2号瓦斯部队对潢川东门发射835枚赤筒毒气弹（日方《支那事变化学战例证集》第52例自认）；约9/19潢川失守（确切日期有16—19日间诸说）。9/21日军占罗山。',
     ['zhwiki_wuhan', 'danganju_youxue_14'], 'medium'),
    ('1938-09-24T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi'],
     '9月24日江南马头镇、富池口（半壁山）失守——田家镇失去南岸犄角；守军第54军血战八昼夜后失守，第18师师长李芳郴弃职潜逃。',
     ['danganju_youxue_14', 'zhwiki_wuhan'], 'medium'),
    ('1938-09-29T00:00', 'step', ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen'],
     '9月29日田家镇要塞陷落，长江门户洞开。日方部队史载步兵第13联队在此攻防死伤3000余人，几乎全联队覆没；核心阵地守军大部殉国。',
     ['danganju_youxue_14', 'zhwiki_wuhan', 'pengpai_sunshi'], 'medium'),
    ('1938-10-05T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi'],
     '10月5日第27师团占箬溪，转向西北；第106师团9月底孤军深入万家岭被合围，10月7日起中方总攻。',
     ['zhwiki_wuhan', 'danganju_youxue_15'], 'medium'),
    ('1938-10-10T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing'],
     '10月10日（双十节）万家岭大捷：第106师团主力被歼，仅约1500残部突围；日方人马现员表推算该师团及配属在战役期间自定员除名约6500—6600人。日军10/9起空投军官约200名补充。',
     ['danganju_youxue_15', 'zhwiki_wanjialing', 'pengpai_sunshi'], 'high'),
    ('1938-10-12T00:00', 'step', ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing', 'xinyang'],
     '10月12日第2军（第10、第3师团）占信阳，推进至武胜关方向，从北面对武汉形成包围；胡宗南第17军团撤守。',
     ['zhwiki_wuhan', 'danganju_youxue_14', 'mackinnon_wuhan_1996'], 'medium'),
    ('1938-10-22T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing', 'xinyang', 'yangxin_daye'],
     '10月22日阳新、大冶、鄂城方向要点相继失守，第9师团与波田支队向武昌急进企图截断粤汉铁路。',
     ['zhwiki_wuhan', 'danganju_youxue_14'], 'medium'),
    ('1938-10-24T00:00', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing', 'xinyang', 'yangxin_daye', 'huangpi'],
     '10月24日第6师团占黄陂（汉口以北约30公里）直逼横店；同日军事委员会正式下令放弃武汉，蒋介石飞离；中山舰在金口战沉。10/21广州沦陷，外援线断。',
     ['zhwiki_wuhan', 'danganju_youxue_14', 'mackinnon_wuhan_1996'], 'medium'),
    ('1938-10-25T00:00', 'step', ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing', 'xinyang', 'yangxin_daye', 'huangpi', 'wuhan'],
     '10月25日中国军队按预定计划整师撤退完毕、放弃武汉（中方以此日为会战结束；武汉每年10月25日鸣防空警报纪念）；当日下午日军自汉口东北角入城，汉口沦陷。',
     ['zhwiki_wuhan', 'mackinnon_wuhan_1996', 'danganju_youxue_14'], 'high'),
    ('1938-10-27T23:59', None, ['start1937', 'qianshan', 'hukou', 'jiujiang', 'xiaochikou', 'taihu', 'huangmei', 'ruichang', 'xingzi', 'luan', 'huoshan', 'guangji', 'fujinshan', 'shangcheng', 'gushi_huangchuan', 'luoshan', 'matou_fuchi', 'tianjiazhen', 'ruoxi', 'wanjialing', 'xinyang', 'yangxin_daye', 'huangpi', 'wuhan'],
     '10月26日第6师团全占汉口、波田支队占武昌，10月27日第116师团占汉阳——武汉三镇全陷，会战结束。11月2日畑俊六乘军舰抵武汉，3日（明治天皇生日）日军主力进驻汉口庆祝。',
     ['zhwiki_wuhan', 'enwiki_wuhan', 'mackinnon_wuhan_1996'], 'high'),
]


def fname(at: str) -> str:
    return at.replace(':', '-') + '.json'


def main() -> None:
    os.makedirs(FRONTS, exist_ok=True)
    # 清除生成器占位之外由本脚本管理的帧（重写全部）
    for at, transition, keys, note, sources, confidence in FRAMES:
        polys = [POLYS[k] for k in keys]
        doc = {
            'at': at,
            'control': {'JP': [[list(pt) for pt in ring] for ring in polys]},
            'note': note,
            'sources': sources,
            'confidence': confidence,
        }
        if transition:
            # 放在 at 之后以保持 JSON 可读
            doc = {'at': at, 'transition': transition, 'control': doc['control'],
                   'note': note, 'sources': sources, 'confidence': confidence}
        path = os.path.join(FRONTS, fname(at))
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)
        print('wrote', os.path.basename(path), f'({len(polys)} polys)')


if __name__ == '__main__':
    sys.exit(main())
