#!/usr/bin/env python3
"""Emit the curated historical campaign. No simulation or alternate-history data.

Sources substantiate dates, formations, equipment and bases. Every animated sortie
is explicitly an illustrative reconstruction; its clock times, altitude and path
are chosen to make a readable teaching sequence, never claimed as an exact track.
"""
from datetime import datetime, timedelta
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parents[2]
T0 = "1940-07-10T00:00"
END = "1940-10-31T23:59"
RAF = "https://www.rafmuseum.org.uk/research/online-exhibitions/history-of-the-battle-of-britain/"
SOURCES = [
    {"id": "raf_battle_overview", "title": "Battle of Britain · 官方纪念、道丁体系与参战人员", "author": "Royal Air Force", "url": "https://www.raf.mod.uk/what-we-do/our-history/anniversaries/battle-of-britain/"},
    {"id": "raf_phases", "title": "不列颠空战五阶段与日期口径", "author": "RAF Museum", "url": RAF + "introduction-to-the-phases-of-the-battle-of-britain"},
    *[{"id": f"raf_phase_{i}", "title": f"不列颠空战第 {i} 阶段", "author": "RAF Museum", "url": RAF + f"the-battle-of-britain-phase-{word}"} for i, word in enumerate(["one", "two", "three", "four", "five"], 1)],
    {"id": "raf_sealion", "title": "Operation Sealion · 入侵前提与计划", "author": "RAF Museum", "url": RAF + "operation-sealion"},
    {"id": "raf_hardest_day", "title": "18 August 1940 · The Hardest Day", "author": "RAF Museum", "url": RAF + "the-hardest-day"},
    {"id": "raf_raf_commanders", "title": "RAF 航空群指挥官与防区职责", "author": "RAF Museum", "url": RAF + "subordinate-raf-commanders"},
    {"id": "raf_german_commanders", "title": "德国航空队指挥官", "author": "RAF Museum", "url": RAF + "subordinate-german-commanders"},
    {"id": "raf_radar", "title": "雷达、观察哨与指挥系统", "author": "RAF Museum", "url": RAF + "radar-the-battle-winner"},
    {"id": "raf_defences", "title": "British Defences · 航空群、扇区与中队", "author": "RAF Museum", "url": RAF + "british-defences"},
    {"id": "raf_defend_guide", "title": "Defend · 战役空勤人员与损失口径", "author": "RAF Museum", "url": "https://www.rafmuseum.org.uk/documents/LargePrintGuides/Defend.pdf"},
    {"id": "dowding_despatch", "title": "Battle of Britain Despatch · 道丁战报，附录 A / E 编制与机场", "author": "Air Chief Marshal Hugh Dowding; introduction Sebastian Cox", "year": 2015, "url": "https://www.raf.mod.uk/what-we-do/centre-for-air-and-space-power-studies/aspr/apr-vol18-iss2-4-pdf"},
    {"id": "tna_hardest_day", "title": "肯利机场袭击、111 中队与战斗报告", "author": "The National Archives", "url": "https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/second-world-war/the-battle-of-britains-hardest-day/"},
    {"id": "raf_northern_skies", "title": "Defending Northern Skies · 15 August 1940 与北方防空", "author": "RAF Historical Society", "year": 1996, "url": "https://www.rafmuseum.org.uk/documents/Research/RAF-Historical-Society-Journals/Journal-16A-Defending-Northern-Skies.pdf"},
    {"id": "raf_bader", "title": "Douglas Bader · 242 中队与 Duxford Wing", "author": "RAF Museum", "url": "https://www.rafmuseum.org.uk/research/online-exhibitions/douglas-bader-fighter-pilot/a-fighter-pilot-again"},
    {"id": "raf_polish", "title": "Poles and Czechoslovaks in the Battle of Britain", "author": "RAF Museum", "year": 2020, "url": "https://www.rafmuseum.org.uk/blog/poles-and-czechoslovaks-in-the-battle-of-britain/"},
    {"id": "raf_303", "title": "303 Squadron · 波兰中队", "author": "RAF Museum", "url": "https://www.rafmuseum.org.uk/research/online-exhibitions/the-polish-air-force-in-world-war-2/303-squadron/"},
    {"id": "iwm_duxford", "title": "Historic Duxford · 19 中队、310 中队与 Duxford Wing", "author": "Imperial War Museums", "year": 2012, "url": "https://www.iwm.org.uk/sites/default/files/press-release/IWMD-PR-2012-05-01-Announcing-Historic-Duxford.pdf"},
    {"id": "iwm_factsheet", "title": "Battle of Britain and Blitz · 战役统计与后续闪电战", "author": "Imperial War Museums", "url": "https://www.iwm.org.uk/sites/default/files/press-release/Battle_of_Britain_and_Blitz_Factsheet.pdf"},
    {"id": "hansard_few", "title": "20 August 1940 · War Situation / Churchill 演说", "author": "UK Parliament, Hansard", "year": 1940, "url": "https://api.parliament.uk/historic-hansard/commons/1940/aug/20/war-situation"},
    {"id": "raf_untold_audio", "title": "Untold Battle of Britain · 英语历史访谈（外部收听参考）", "author": "RAF / RAF Museum / The National Archives", "year": 2020, "url": "https://www.raf.mod.uk/what-we-do/our-history/anniversaries/battle-of-britain/", "license": "仅外链；未发现明确的音频再分发许可，未捆绑录音"},
    {"id": "heritage_gravesend", "title": "Gravesend Airport · 501 中队驻地，Kent Historic Environment Record", "author": "Kent County Council", "url": "https://heritage.kent.gov.uk/Monument/MKE16159"},
    {"id": "rafweb_kenley", "title": "Kenley station ORB 摘录 · 中队转场与卫星机场", "author": "Air of Authority / Malcolm Barrass", "url": "https://www.rafweb.org/Members%20Pages/Unit%20Details/Stations/Kenley.htm"},
    {"id": "rafweb_605", "title": "605 Squadron ORB (AIR 27/2088) 摘录 · Drem / Croydon", "author": "Air of Authority / Malcolm Barrass", "url": "https://www.rafweb.org/Members%20Pages/Unit%20Details/Squadrons/600-1435/No%20605%20Sqn.htm"},
    {"id": "commons_britain_map", "title": "Battle of Britain map.svg · 防区、机场、雷达参考", "author": "Hohum", "year": 2009, "url": "https://commons.wikimedia.org/wiki/File:Battle_of_Britain_map.svg", "license": "Public domain (PD-self)"},
    {"id": "britain_reconstruction", "title": "本作教学重构规则：来源确认日期、编制与驻地；航迹、分时、高度、范围均为示意", "author": "Battle of Britain 1940 campaign authors", "year": 2026, "license": "原创教学数据；每中队显示 12 架、每 Gruppe 显示 30 架仅为代表编队标尺，非历史可用机统计。固定编制树选用代表时期隶属关系，未穷举逐日调动。"},
]
GERMAN = {
    "kg2": ("kampf", "Kampfgeschwader 2"), "kg76": ("kampf", "Kampfgeschwader 76"),
    "kg53": ("kampf", "Kampfgeschwader 53"), "kg26": ("kampf", "Kampfgeschwader 26"),
    "kg30": ("kampf", "Kampfgeschwader 30"), "kg51": ("kampf", "Kampfgeschwader 51"),
    "stg1": ("attack", "Sturzkampfgeschwader 1"), "stg77": ("attack", "Sturzkampfgeschwader 77"),
    "jg26": ("jagd", "Jagdgeschwader 26"), "jg53": ("jagd", "Jagdgeschwader 53"),
    "zg26": ("zerstorer", "Zerstörergeschwader 26"), "zg76": ("zerstorer", "Zerstörergeschwader 76"),
}
for key, (path, title) in GERMAN.items():
    SOURCES.append({"id": "holm_" + key, "title": title + " · 编制与驻地汇编（辅助核对）", "author": "Michael Holm", "url": f"https://www.ww2.dk/air/{path}/{key}.htm"})

def write(path, obj):
    dst = ROOT / path
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

PLACES = []
def place(pid, zh, orig, lon, lat, kind="airfield", rank=4, country="GB", sources=None):
    PLACES.append({"id": pid, "zh": zh, "orig": orig, "pos": [lon, lat], "kind": kind, "rank": rank, "country": country, "sources": sources or ["dowding_despatch", "commons_britain_map"], "confidence": "medium"})

def make_places():
    for args in [
        ("london", "伦敦", "London", -.1276, 51.5074, "capital", 1),
        ("dover", "多佛", "Dover", 1.313, 51.126, "port", 2),
        ("portsmouth", "朴次茅斯", "Portsmouth", -1.089, 50.799, "port", 2),
        ("southampton", "南安普敦", "Southampton", -1.404, 50.91, "port", 2),
        ("portland", "波特兰海军基地", "Portland Harbour", -2.442, 50.584, "port", 3),
        ("newcastle", "纽卡斯尔", "Newcastle upon Tyne", -1.612, 54.978, "city", 2),
        ("sunderland", "桑德兰", "Sunderland", -1.382, 54.904, "city", 3),
        ("driffield", "德里菲尔德", "RAF Driffield", -.48, 54.009),
        ("bristol", "布里斯托尔", "Bristol", -2.588, 51.455, "city", 2),
        ("plymouth", "普利茅斯", "Plymouth", -4.142, 50.376, "port", 2),
        ("edinburgh", "爱丁堡", "Edinburgh", -3.19, 55.953, "city", 2),
        ("bentley_priory", "本特利修道院", "RAF Bentley Priory", -.34, 51.637, "town", 3),
        ("uxbridge", "阿克斯布里奇", "RAF Uxbridge", -.46, 51.544, "town", 3),
        ("rudloe_manor", "鲁德洛庄园", "RAF Rudloe Manor", -2.234, 51.415, "town", 3),
        ("watnall", "沃特诺", "RAF Watnall", -1.252, 53.003, "town", 3),
        ("kenton_bar", "肯顿巴尔", "RAF Kenton Bar", -1.654, 55.009, "town", 3),
        ("hornchurch", "霍恩彻奇", "RAF Hornchurch", .204, 51.54),
        ("rochford", "罗奇福德", "RAF Rochford", .7, 51.571),
        ("north_weald", "诺斯威尔德", "RAF North Weald", .153, 51.721),
        ("kenley", "肯利", "RAF Kenley", -.091, 51.303),
        ("croydon", "克罗伊登", "RAF Croydon", -.124, 51.354),
        ("biggin_hill", "比金山", "RAF Biggin Hill", .034, 51.331),
        ("gravesend", "格雷夫森德", "RAF Gravesend", .396, 51.421),
        ("tangmere", "唐米尔", "RAF Tangmere", -.704, 50.847),
        ("middle_wallop", "米德尔沃洛普", "RAF Middle Wallop", -1.569, 51.149),
        ("st_eval", "圣埃瓦尔", "RAF St Eval", -4.991, 50.478),
        ("duxford", "达克斯福德", "RAF Duxford", .124, 52.09),
        ("fowlmere", "福尔米尔", "RAF Fowlmere", .063, 52.078),
        ("northolt", "诺索尔特", "RAF Northolt", -.418, 51.554),
        ("acklington", "阿克灵顿", "RAF Acklington", -1.678, 55.313),
        ("usworth", "阿斯沃思", "RAF Usworth", -1.462, 54.933),
        ("leconfield", "莱肯菲尔德", "RAF Leconfield", -.442, 53.877),
        ("drem", "德雷姆", "RAF Drem", -2.784, 56.0),
        ("catterick", "卡特里克", "RAF Catterick", -1.645, 54.359),
        ("coltishall", "科尔蒂歇尔", "RAF Coltishall", 1.358, 52.755),
        ("debden", "德布登", "RAF Debden", .277, 51.991),
        ("kirton_lindsey", "柯顿林赛", "RAF Kirton-in-Lindsey", -.581, 53.459),
        ("turnhouse", "特恩豪斯", "RAF Turnhouse", -3.361, 55.951),
        ("exeter", "埃克塞特", "RAF Exeter", -3.414, 50.734),
        ("hawkinge", "霍金吉", "RAF Hawkinge", 1.166, 51.101),
        ("manston", "曼斯顿", "RAF Manston", 1.346, 51.342),
        ("wapping", "沃平港区", "Wapping, London Docks", -.057, 51.506, "port", 3),
        ("dover_strait", "多佛海峡", "Straits of Dover", 1.55, 51.08, "region", 3),
        ("channel_convoy", "海峡护航航道", "English Channel convoy lanes", .9, 50.94, "region", 4),
        ("peewit_area", "皮维特船队战区", "Convoy CW9 / Peewit area", -1.8, 50.32, "region", 4),
        ("north_sea", "北海来袭方向", "North Sea approach", -.3, 55.5, "region", 4),
    ]:
        place(*args)
    for args in [
        ("brussels", "布鲁塞尔", "Bruxelles / Luftflotte 2 HQ", 4.352, 50.846, "city", 2, "BE"),
        ("paris", "巴黎", "Paris / Luftflotte 3 HQ", 2.35, 48.857, "capital", 2, "FR"),
        ("oslo", "奥斯陆", "Oslo / Luftflotte 5 HQ", 10.752, 59.914, "capital", 2, "NO"),
        ("epinoy", "埃皮努瓦", "Cambrai-Épinoy", 3.156, 50.221, "airfield", 4, "FR", ["holm_kg2"]),
        ("cormeilles", "科尔梅伊昂韦克桑", "Cormeilles-en-Vexin", 2.042, 49.096, "airfield", 4, "FR", ["holm_kg76", "raf_hardest_day"]),
        ("lille_nord", "里尔北机场", "Lille-Nord / Marcq-en-Barœul", 3.075, 50.687, "airfield", 4, "FR", ["holm_kg53"]),
        ("sola", "斯塔万格索拉", "Stavanger-Sola", 5.638, 58.877, "airfield", 3, "NO", ["holm_kg26"]),
        ("forus", "斯塔万格福鲁斯", "Stavanger-Forus", 5.716, 58.876, "airfield", 4, "NO", ["holm_zg76"]),
        ("aalborg_west", "奥尔堡西机场", "Aalborg-West", 9.849, 57.093, "airfield", 3, "DK", ["holm_kg30"]),
        ("gilze_rijen", "希尔泽雷延", "Gilze-Rijen", 4.931, 51.568, "airfield", 4, "NL", ["holm_kg30"]),
        ("beauvais", "博韦", "Beauvais-Tillé", 2.112, 49.453, "airfield", 4, "FR", ["holm_kg26"]),
        ("paris_orly", "巴黎奥利", "Paris-Orly", 2.36, 48.726, "airfield", 4, "FR", ["holm_kg51"]),
        ("villaroche", "维拉罗什", "Melun-Villaroche", 2.671, 48.604, "airfield", 4, "FR", ["holm_kg51"]),
        ("falaise", "法莱斯", "Falaise", -.191, 48.9, "airfield", 4, "FR", ["holm_stg1"]),
        ("maltot", "马尔托", "Maltot", -.424, 49.106, "airfield", 4, "FR", ["holm_stg77"]),
        ("audembert", "奥当贝尔", "Audembert", 1.734, 50.864, "airfield", 4, "FR", ["holm_jg26"]),
        ("brest_poulmic", "布雷斯特普尔米克", "Brest-Poulmic", -4.427, 48.284, "airfield", 4, "FR", ["holm_jg53"]),
        ("le_touquet", "勒图凯埃塔普勒", "Le Touquet-Étaples", 1.625, 50.518, "airfield", 4, "FR", ["holm_jg53"]),
        ("yvrench", "伊夫朗什", "Yvrench", 2.002, 50.18, "airfield", 4, "FR", ["holm_zg26"]),
    ]:
        place(*args)
    for pid, zh, orig, x, y in [
        ("radar_dover", "多佛雷达站", "Dover Chain Home", 1.368, 51.136),
        ("radar_rye", "赖伊雷达站", "Rye Chain Home", .617, 50.953),
        ("radar_pevensey", "佩文西雷达站", "Pevensey Chain Home", .36, 50.825),
        ("radar_ventnor", "文特诺雷达站", "Ventnor Chain Home", -1.212, 50.601),
        ("radar_poling", "波林雷达站", "Poling Chain Home", -.565, 50.83),
        ("radar_bawdsey", "鲍德西雷达站", "Bawdsey Chain Home", 1.413, 51.993),
        ("radar_dunkirk", "肯特敦刻尔克雷达站", "Dunkirk, Kent Chain Home", .963, 51.292),
        ("radar_ottercops", "奥特科普斯莫斯雷达站", "Ottercops Moss Chain Home", -2.119, 55.196),
    ]:
        place(pid, zh, orig, x, y, "radar", 4, "GB", ["raf_radar", "raf_northern_skies", "commons_britain_map"])

UNITS = []
def stationary(uid, side, echelon, parent, zh, orig, short, base, sources, commander=None, history=None):
    u = {"id": uid, "side": side, "echelon": echelon, "type": "hq", "parent": parent, "name": {"zh": zh, "orig": orig, "short": short}, "base": "@" + base, "track": [{"at": T0, "pos": "@" + base, "status": "active", "flightPhase": "at_base", "altitudeM": 0, "note": "固定指挥部；位置不随下属飞机飞行"}, {"at": END, "pos": "@" + base, "flightPhase": "at_base", "altitudeM": 0}], "sources": sources, "confidence": "high", "history": history or "此固定指挥节点用于展示航空指挥层级。下属仅选取有来源的代表中队或大队，未穷举完整战斗序列，也不代表指挥部本身执行飞行。"}
    if commander: u["commander"] = {"zh": commander, "orig": commander}
    UNITS.append(u)
    return u

def leaf(uid, side, parent, zh, orig, short, model, base, history, sources, from_at=T0, to_at=END):
    count = 12 if side == "GB" else 30
    u = {"id": uid, "side": side, "echelon": "squadron" if side == "GB" else "gruppe", "type": "fighter" if model in ["spitfire", "hurricane", "bf109", "bf110"] else "bomber", "parent": parent, "name": {"zh": zh, "orig": orig, "short": short}, "model": model, "base": "@" + base, "strength": {"aircraft": count}, "equipment": [{"id": model, "count": count}], "active": {"from": from_at, "to": to_at}, "track": [{"at": from_at, "pos": "@" + base, "status": "active", "flightPhase": "at_base", "altitudeM": 0}], "history": history + "显示机数为代表编队标尺；航迹、钟点与高度为教学重构，不是逐架作战记录。", "sources": sources + ["britain_reconstruction"], "confidence": "medium"}
    UNITS.append(u)
    return u

def make_units():
    stationary("gb.fighter_command", "GB", "command", None, "RAF 战斗机司令部", "RAF Fighter Command", "Fighter Cmd", "bentley_priory", ["dowding_despatch", "raf_battle_overview"], "休·道丁 Hugh Dowding", "战斗机司令部设于本特利修道院。雷达情报在过滤室汇总，再交航空群决定出击；扇区负责直接引导中队，观察哨补充越过海岸后的跟踪。它体现情报、通信、地勤和飞行员共同构成的防空体系。")
    groups = [(10, "英格兰西南及威尔士", "rudloe_manor", "昆廷·布兰德 Quintin Brand"), (11, "伦敦及英格兰东南", "uxbridge", "基思·帕克 Keith Park"), (12, "英格兰中部及东部", "watnall", "特拉福德·利马洛里 Trafford Leigh-Mallory"), (13, "英格兰北部及苏格兰", "kenton_bar", "理查德·索尔 Richard Saul")]
    for n, region, base, cmd in groups:
        stationary(f"gb.group{n}", "GB", "air_group", "gb.fighter_command", f"第 {n} 航空群 · {region}", f"No. {n} Group", f"{n} Group", base, ["raf_raf_commanders", "dowding_despatch"], cmd)
    sectors = [("middle_wallop", 10), ("hornchurch", 11), ("north_weald", 11), ("kenley", 11), ("tangmere", 11), ("biggin_hill", 11), ("northolt", 11), ("duxford", 12), ("coltishall", 12), ("leconfield", 13), ("acklington", 13), ("usworth", 13), ("drem", 13)]
    gaz = {p["id"]: p for p in PLACES}
    for pid, group in sectors:
        stationary("gb.sector_" + pid, "GB", "sector", f"gb.group{group}", gaz[pid]["zh"] + "扇区", gaz[pid]["orig"] + " Sector", gaz[pid]["orig"].replace("RAF ", ""), pid, ["dowding_despatch", "commons_britain_map"], history="本作按代表时期把中队归入扇区。扇区从航空群接收任务，并通过无线电引导拦截；实际转场可能跨防区，本树不重写每日完整隶属关系。固定机场符号代表指挥节点，不会跟随飞机出击。")
    for n, base, cmd in [(2, "brussels", "阿尔贝特·凯塞林 Albert Kesselring"), (3, "paris", "胡戈·施佩勒 Hugo Sperrle"), (5, "oslo", "汉斯-于尔根·施通普夫 Hans-Jürgen Stumpff")]:
        stationary(f"de.luftflotte{n}", "DE", "air_fleet", None, f"第 {n} 航空队", f"Luftflotte {n}", f"Luftflotte {n}", base, ["raf_german_commanders", "commons_britain_map"], cmd, history="航空队指挥节点固定在战役代表司令部所在地。轰炸机与护航战斗机从各机场出动；航空队本身不沿航迹移动。战役后期单位转场与调遣仅选择有出处的代表动作。")
    gb_leaves = [
        (54, "hornchurch", "spitfire", "rochford", "由罗奇福德／霍恩彻奇参加海峡护航与东南防空。战役初期的 Spitfire 中队承担船队掩护；9 月初转到卡特里克休整。", ["dowding_despatch", "raf_phase_1"]),
        (56, "north_weald", "hurricane", "north_weald", "诺斯威尔德的 Hurricane 中队参与海峡防空及东南拦截。代表出击显示从内陆基地爬升、进入交战空域再返航的过程。", ["dowding_despatch", "raf_phase_2"]),
        (64, "kenley", "spitfire", "kenley", "肯利的 Spitfire 中队在机场受袭阶段作战，8 月 19 日与北方来的第 616 中队轮换。北方基地提供人员恢复与训练空间。", ["dowding_despatch", "rafweb_kenley"]),
        (111, "kenley", "hurricane", "croydon", "使用肯利的卫星机场克罗伊登。8 月 18 日的原始战斗报告记录其 Hurricane 拦截低空 Do 17；9 月转往苏格兰休整。", ["tna_hardest_day", "raf_hardest_day", "rafweb_kenley"]),
        (501, "biggin_hill", "hurricane", "middle_wallop", "第 501 中队从法国撤回后重建，7 月 25 日驻格雷夫森德，9 月 10 日转肯利。它的 Hurricane 中队持续承担东南防空。", ["heritage_gravesend", "rafweb_kenley", "dowding_despatch"]),
        (601, "tangmere", "hurricane", "tangmere", "驻唐米尔的第 601 中队以 Hurricane 作战，保护南岸港口、船队和机场。其出击用于说明南岸扇区的近距离拦截与地勤周转。", ["dowding_despatch", "raf_phase_2"]),
        (609, "middle_wallop", "spitfire", "middle_wallop", "第 609 西赖丁中队在米德尔沃洛普使用 Spitfire，掩护朴次茅斯、南安普敦和南岸。它代表第 10 航空群支援东南主战区的力量。", ["dowding_despatch", "raf_phase_2", "commons_britain_map"]),
        (19, "duxford", "spitfire", "duxford", "第 19 中队是首个接收 Spitfire 的 RAF 中队。达克斯福德及卫星机场福尔米尔保障其出击，9 月参加支援伦敦防空的大编队行动。", ["iwm_duxford", "dowding_despatch"]),
        (242, "coltishall", "hurricane", "coltishall", "道格拉斯·巴德在 1940 年 6 月接掌损失严重的第 242 中队。8 月底转向达克斯福德协同作战，是后来 Duxford Wing 的核心中队之一。", ["raf_bader", "iwm_duxford", "dowding_despatch"]),
        (303, "northolt", "hurricane", "northolt", "第 303 波兰中队在诺索尔特以 Hurricane 作战，8 月底投入战斗，波兰飞行员的经验成为重要补充。10 月中旬转赴莱肯菲尔德休整。", ["raf_polish", "raf_303"]),
        (72, "acklington", "spitfire", "acklington", "第 72 中队起初驻北方阿克灵顿。8 月 15 日，第 13 航空群抵御跨北海袭击；随后该中队南调，体现防区间的轮换和补充。", ["dowding_despatch", "raf_northern_skies"]),
        (607, "usworth", "hurricane", "usworth", "第 607 达勒姆郡辅助中队在法国作战后重建，以 Hurricane 从阿斯沃思参加北方防空。8 月 15 日与北方体系共同抵御德国航空队来袭。", ["dowding_despatch", "raf_northern_skies"]),
        (605, "drem", "hurricane", "drem", "第 605 中队在德雷姆恢复战力，7 月 30 日重新投入作战。9 月 7 日飞行员与飞机南调克罗伊登，支援伦敦及东南防空。", ["rafweb_605", "dowding_despatch", "raf_northern_skies"]),
        (616, "leconfield", "spitfire", "leconfield", "第 616 南约克郡辅助中队在莱肯菲尔德使用 Spitfire。8 月 15 日参与北海来袭方向的战斗，8 月 19 日转肯利替换第 64 中队。", ["raf_northern_skies", "rafweb_kenley", "dowding_despatch"]),
        (234, "middle_wallop", "spitfire", "st_eval", "第 234 中队原在康沃尔圣埃瓦尔使用 Spitfire，8 月中旬来到米德尔沃洛普，在第 10 航空群方向承担拦截，后返回西南地区休整。", ["dowding_despatch", "raf_phase_3"]),
    ]
    for n, sector, model, base, history, sources in gb_leaves:
        leaf(f"gb.{n}_sqn", "GB", "gb.sector_" + sector, f"RAF 第 {n} 中队", f"No. {n} Squadron RAF", f"{n} Sqn", model, base, history, sources, "1940-08-02T00:00" if n == 303 else T0)
    de_leaves = [
        ("i_kg2", 2, "kg2", "I./KG 2", "第 2 轰炸联队第 I 大队", "do17", "epinoy", "第 2 轰炸联队的 Do 17Z 大队驻埃皮努瓦，代表早期海峡航道及后续东南方向的轰炸任务。驻地表与机型可核对，航迹并无逐架记录。"),
        ("iii_kg76", 2, "kg76", "III./KG 76", "第 76 轰炸联队第 III 大队", "do17", "cormeilles", "第 76 轰炸联队的 Do 17Z 大队驻科尔梅伊。8 月 18 日其第 9 中队低空攻击肯利，遭 Hurricane 拦截；此处以大队级代表符号说明行动。"),
        ("ii_kg53", 2, "kg53", "II./KG 53", "第 53 轰炸联队第 II 大队", "he111", "lille_nord", "第 53 轰炸联队的 He 111 大队从里尔北机场出动。它代表伦敦阶段的大型双发轰炸编队；飞机生产、可用率和单次出动数不能直接等同。"),
        ("i_kg26", 5, "kg26", "I./KG 26", "第 26 轰炸联队第 I 大队", "he111", "sola", "第 26 轰炸联队的 He 111 从挪威方向跨北海出击。8 月 15 日北方进攻受挫后，该大队于 9 月转往法国博韦，继续参与西线空战。"),
        ("i_kg30", 5, "kg30", "I./KG 30", "第 30 轰炸联队第 I 大队", "ju88", "aalborg_west", "第 30 轰炸联队的 Ju 88 大队驻奥尔堡西机场，代表 8 月 15 日从丹麦袭向德里菲尔德的北海行动；9 月转驻希尔泽雷延。"),
        ("i_kg51", 3, "kg51", "I./KG 51", "第 51 轰炸联队第 I 大队", "ju88", "paris_orly", "第 51 轰炸联队的 Ju 88 大队从法国中北部出动，8 月初从巴黎奥利转驻维拉罗什，承担南岸港口和机场方向的攻击。"),
        ("iii_stg1", 3, "stg1", "III./St.G. 1", "第 1 俯冲轰炸联队第 III 大队", "ju87", "falaise", "第 1 俯冲轰炸联队第 III 大队以 Ju 87R 驻法莱斯，7 月 9 日由航空母舰训练单位改称。其代表航线说明对海峡航道及港口的俯冲攻击。"),
        ("i_stg77", 3, "stg77", "I./St.G. 77", "第 77 俯冲轰炸联队第 I 大队", "ju87", "maltot", "第 77 俯冲轰炸联队的 Ju 87B 大队驻马尔托。Ju 87 对南岸机场和雷达的攻击损失严重，8 月中旬后减少在主要昼间攻势中的使用。"),
        ("i_jg26", 2, "jg26", "I./JG 26", "第 26 战斗联队第 I 大队", "bf109", "audembert", "第 26 战斗联队的 Bf 109E 大队从奥当贝尔参加护航与战斗。靠近多佛海峡的基地缩短往返距离，但战斗与护航仍受到燃油限制。"),
        ("iii_jg53", 2, "jg53", "III./JG 53", "第 53 战斗联队第 III 大队", "bf109", "brest_poulmic", "第 53 战斗联队第 III 大队使用 Bf 109E，7 月至 8 月驻布雷斯特普尔米克，8 月 24 日后转勒图凯。本作在东南出击前明确显示转场。"),
        ("i_zg26", 2, "zg26", "I./ZG 26", "第 26 驱逐机联队第 I 大队", "bf110", "yvrench", "第 26 驱逐机联队的 Bf 110 大队从法国北部基地出击。双发战斗机航程较长，却在近距格斗中处于劣势，8 月 18 日该大队损失严重。"),
        ("i_zg76", 5, "zg76", "I./ZG 76", "第 76 驱逐机联队第 I 大队", "bf110", "forus", "第 76 驱逐机联队第 I 大队从斯塔万格福鲁斯以 Bf 110 护航北海轰炸编队。8 月 15 日受挫后，其后续夜战改编不在本作扩展范围内。"),
    ]
    for uid, fleet, wing, orig, zh, model, base, history in de_leaves:
        wid = "de.wing_" + wing
        stationary(wid, "DE", "wing", f"de.luftflotte{fleet}", zh.split("第 I")[0].split("第 III")[0].split("第 II")[0], GERMAN[wing][1], wing.upper(), base, ["holm_" + wing, "raf_german_commanders"])
        src = ["holm_" + wing, "raf_northern_skies" if fleet == 5 else "raf_phase_3"]
        if uid == "iii_kg76": src += ["raf_hardest_day", "tna_hardest_day"]
        leaf("de." + uid, "DE", wid, zh, orig, orig, model, base, history, src, "1940-07-12T00:00" if uid == "ii_kg53" else T0, "1940-08-31T23:59" if uid == "i_zg76" else END)

def parse(t): return datetime.fromisoformat(t)
def iso(t): return t.strftime("%Y-%m-%dT%H:%M")
def ll(pos): return GAZ[pos[1:]]["pos"] if isinstance(pos, str) else pos
def distance(a, b):
    ax, ay = map(math.radians, ll(a)); bx, by = map(math.radians, ll(b))
    q = math.sin((by-ay)/2)**2 + math.cos(ay)*math.cos(by)*math.sin((bx-ax)/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(q)))

ROUTES = []
MISSIONS = []
def sortie(uid, day, target, tag, role, source, via=None, altitude=None, attack_minute=12*60):
    u = UNIT_MAP[uid]
    base = base_at(u, day + "T00:00")
    objective = "@" + target if isinstance(target, str) else target
    if via is None:
        a, b = ll(base), ll(objective)
        via = [round(a[0]*.45+b[0]*.55, 5), round(a[1]*.45+b[1]*.55, 5)]
        if distance(base, objective) < 70:
            # Local defence includes a short circuit before reaching the target;
            # a direct base-to-base line would leave aircraft hovering on takeoff.
            via = [round(b[0]+.25, 5), round(b[1]+.15, 5)]
    fighter = u["model"] in ["spitfire", "hurricane", "bf109", "bf110"]
    speed = 380 if fighter else 260 if u["model"] != "ju87" else 240
    altitude = altitude or (5500 if fighter else 4000)
    d1 = max(1, math.ceil(distance(base, via)/speed*60))
    d2 = max(1, math.ceil(distance(via, objective)/speed*60))
    attack = parse(day + "T00:00") + timedelta(minutes=attack_minute)
    depart = attack - timedelta(minutes=d1+d2)
    if depart.date() != attack.date(): raise ValueError("sortie should close same day")
    x, y = ll(objective)
    bend = [round(x+.055, 5), round(y+.02, 5)]
    circuit = 1 if fighter else .55 if u["model"] == "ju87" else .65
    loiter1 = [round(x+.22*circuit, 5), round(y+.18*circuit, 5)]
    loiter2 = [round(x-.18*circuit, 5), round(y+.12*circuit, 5)]
    return_via = [round(ll(via)[0]+.08, 5), round(ll(via)[1]-.035, 5)]
    r1 = max(1, math.ceil(distance(bend, return_via)/speed*60))
    r2 = max(1, math.ceil(distance(return_via, base)/speed*60))
    leave = attack + timedelta(minutes=12)
    land = leave + timedelta(minutes=r1+r2)
    pts = [
        {"at": iso(depart-timedelta(minutes=1)), "pos": base, "flightPhase": "at_base", "status": "active", "altitudeM": 0, "note": "出击前停机；此后钟点与航迹为教学重构"},
        {"at": iso(depart), "pos": base, "flightPhase": "outbound", "status": "active", "altitudeM": 0},
        {"at": iso(depart+timedelta(minutes=d1)), "pos": via, "flightPhase": "outbound", "altitudeM": altitude},
        {"at": iso(attack), "pos": objective, "flightPhase": "engaged", "status": "engaged", "altitudeM": altitude, "note": "代表交战位置及高度为示意，不是精确历史航迹"},
        {"at": iso(attack+timedelta(minutes=4)), "pos": loiter1, "flightPhase": "engaged", "altitudeM": altitude, "note": "教学交战回旋，避免飞机悬停；不是精确历史盘旋轨迹"},
        {"at": iso(attack+timedelta(minutes=8)), "pos": loiter2, "flightPhase": "engaged", "altitudeM": max(100, altitude-300)},
        {"at": iso(leave), "pos": bend, "flightPhase": "returning", "status": "withdrawing", "altitudeM": max(1500, altitude-600)},
        {"at": iso(leave+timedelta(minutes=r1)), "pos": return_via, "flightPhase": "returning", "altitudeM": max(500, altitude-2000)},
        {"at": iso(land), "pos": base, "flightPhase": "at_base", "status": "active", "altitudeM": 0, "note": "当日返航完成；直到下一出击一直停在基地"},
        {"at": iso(land+timedelta(minutes=1)), "pos": base, "flightPhase": "at_base", "altitudeM": 0},
    ]
    u["track"].extend(pts)
    sources = list(dict.fromkeys([source, *u["sources"], "britain_reconstruction"]))
    for suffix, points, route_role, style in [("out", pts[1:4], role, "counter" if role == "intercept" else "secondary" if role == "escort" else "main"), ("back", pts[3:9], "return", "retreat")]:
        ROUTES.append({"id": f"r.{tag}.{uid}.{suffix}", "side": u["side"], "unit": uid, "role": route_role, "style": style, "widthKm": 5 if fighter else 8, "fadeHours": .25, "illustrative": True, "label": {"raid": "袭击 · 重构", "escort": "护航 · 重构", "intercept": "拦截 · 重构", "return": "返航 · 重构"}[route_role], "waypoints": [{"at": p["at"], "pos": p["pos"]} for p in points], "sources": sources, "confidence": "low"})
    MISSIONS.append({"tag": tag, "unit": uid, "role": role, "start": iso(depart), "engaged": iso(attack), "end": iso(land), "base": base})

RELOCATIONS = {
    "gb.54_sqn": [("1940-07-24", "hornchurch"), ("1940-09-03", "catterick")],
    "gb.64_sqn": [("1940-08-19", "leconfield"), ("1940-10-15", "coltishall")],
    "gb.111_sqn": [("1940-09-09", "drem")],
    "gb.501_sqn": [("1940-07-25", "gravesend"), ("1940-09-10", "kenley")],
    "gb.242_sqn": [("1940-08-30", "duxford")],
    "gb.303_sqn": [("1940-10-11", "leconfield")],
    "gb.72_sqn": [("1940-08-31", "croydon"), ("1940-09-10", "biggin_hill"), ("1940-10-14", "coltishall")],
    "gb.607_sqn": [("1940-08-28", "tangmere"), ("1940-10-09", "turnhouse")],
    "gb.605_sqn": [("1940-09-07", "croydon")],
    "gb.616_sqn": [("1940-08-19", "kenley"), ("1940-09-03", "coltishall"), ("1940-09-11", "kirton_lindsey")],
    "gb.234_sqn": [("1940-08-14", "middle_wallop"), ("1940-09-07", "st_eval")],
    "de.i_kg26": [("1940-09-01", "beauvais")],
    "de.i_kg30": [("1940-09-01", "gilze_rijen")],
    "de.i_kg51": [("1940-08-01", "villaroche")],
    "de.iii_jg53": [("1940-08-24", "le_touquet")],
}

def base_at(u, at):
    base = u["base"]
    for date, pid in RELOCATIONS.get(u["id"], []):
        if date + "T00:00" <= at: base = "@" + pid
    return base

def add_relocations():
    for uid, moves in RELOCATIONS.items():
        u = UNIT_MAP[uid]
        old = u["base"]
        for day, pid in moves:
            target = "@" + pid
            at = parse(day + "T06:00")
            duration = max(2, math.ceil(distance(old, target)/320*60))
            # A short, explicitly schematic ferry, surrounded by stationary points.
            a, b = ll(old), ll(target)
            mid = [(a[0]+b[0])/2, (a[1]+b[1])/2]
            u["track"] += [
                {"at": iso(at-timedelta(minutes=1)), "pos": old, "status": "active", "flightPhase": "at_base", "altitudeM": 0},
                {"at": iso(at), "pos": old, "status": "active", "flightPhase": "outbound", "altitudeM": 0, "note": "代表转场日；06:00 与飞行过程为示意。仅月级明确的德国调动以月初播放。"},
                {"at": iso(at+timedelta(minutes=duration//2)), "pos": mid, "flightPhase": "outbound", "altitudeM": 2200},
                {"at": iso(at+timedelta(minutes=duration)), "pos": target, "status": "active", "flightPhase": "at_base", "altitudeM": 0},
                {"at": iso(at+timedelta(minutes=duration+1)), "pos": target, "flightPhase": "at_base", "altitudeM": 0},
            ]
            old = target

PHOTO_KEYS = {
    "raf": "File:The Battle of Britain HU54418.jpg",
    "ground": "File:A Spitfire of No. 19 Squadron is refuelled at Fowlmere, near Duxford, September 1940. CH1372.jpg",
    "de": "File:Bundesarchiv Bild 101I-342-0620-07A, Belgien-Frankreich, Flieger vor Flugzeug.jpg",
    "london": "File:Heinkel He 111 over Wapping, East London.jpg",
}
PHOTO_CAPTIONS = {
    "raf": "1940 年 7 月 29 日，第 32 中队飞行员在霍金吉休息；战役背景照片。",
    "ground": "1940 年 9 月，福尔米尔的地勤为第 19 中队 Spitfire 加油；背景照片。",
    "de": "1940 年 8 月，比利时／法国的德国飞行员；西线部署背景照片。",
    "london": "1940 年 9 月 7 日，He 111 飞越伦敦沃平和泰晤士河港区。",
}
EVENTS = []
def event(eid, date, title, orig, body, pos, units, sources, photo="raf", political=False, importance=2, end=None):
    e = {"id": "e." + eid, "at": date + "T12:00", "category": "political" if political else "air", "importance": importance, "side": "GB" if eid in ["the_few", "battle_of_britain_day", "campaign_end"] else "DE", "title": {"zh": title, "orig": orig}, "body": body, "place": "@" + pos, "units": units, "timePrecision": "day", "photo": {"commons": PHOTO_KEYS[photo], "caption": PHOTO_CAPTIONS[photo]}, "sfx": ["radio"] if political else ["fighter", "bomber", "air_siren"], "zoom": 1.8 if pos == "north_sea" else 2.8, "sources": sources, "confidence": "high"}
    if not political: e["airAction"] = "mixed"
    if end: e["endAt"] = end + "T23:59"
    if not 80 <= len(body) <= 140: raise ValueError((eid, len(body)))
    EVENTS.append(e)

def make_events():
    event("convoy_battles", "1940-07-10", "海峡船队战：战役起点", "Channel convoy battles", "德国空军围绕英吉利海峡的商船航道发动袭击，RAF 从沿岸与内陆机场起飞拦截。英国将这一天视为不列颠空战的正式起点；此前零星空袭已经发生。海面救援、护航距离和飞行员损耗，很快成为持续作战的重要问题。", "channel_convoy", ["gb.54_sqn", "gb.56_sqn", "de.i_kg2"], ["raf_phase_1", "dowding_despatch"], importance=1)
    event("sealion_directive", "1940-07-16", "第 16 号指令：海狮行动", "Führer Directive No. 16 / Operation Sealion", "希特勒发布第十六号指令，要求准备跨海入侵英国的海狮行动。计划把削弱英国空军列为渡海的必要前提，海军与陆军准备也须配合。接下来的袭击逐渐扩大，但指令本身不等于已经取得制空权，更不意味着登陆开始。", "dover_strait", ["gb.fighter_command", "de.luftflotte2", "de.luftflotte3"], ["raf_sealion", "raf_phase_2"], photo="de", political=True)
    event("convoy_peewit", "1940-08-08", "皮维特船队遭袭", "Convoy CW9 / Peewit", "代号皮维特的 CW9 船队成为海峡攻势焦点，德国轰炸机和俯冲轰炸机反复攻击分散的商船，RAF 中队赶往南岸拦截。船队损失与双方空战显示德国企图以航运目标迫使英国战斗机迎战，也暴露护航与救援的困难。", "peewit_area", ["gb.601_sqn", "gb.609_sqn", "de.i_stg77", "de.iii_stg1", "de.i_zg26"], ["raf_phase_2"], photo="de", importance=1)
    event("radar_attacks", "1940-08-12", "雷达与沿海机场受袭", "Attacks on radar and coastal airfields", "德国空军集中攻击南岸雷达站和机场，文特诺等站点受损，肯利等机场也遭袭击。雷达、观察哨与电话网络并非单一装置，修复和替代报告使防空体系继续运作。它的关键作用是争取预警时间，而非保证所有来袭都能发现。", "radar_ventnor", ["gb.64_sqn", "gb.56_sqn", "de.i_kg51", "de.i_jg26"], ["raf_phase_2", "raf_radar", "dowding_despatch"], photo="de")
    event("eagle_day", "1940-08-13", "鹰日：主要攻势展开", "Adlertag / Eagle Day", "因天气推迟的鹰日攻势展开，德国编队袭向 RAF 机场、航空工业与南岸港口，希望迅速消耗战斗机司令部。目标辨识、天气和命令协调却造成混乱，英军仍不断起飞拦截。此后作战重点转向压迫东南机场与指挥设施。", "southampton", ["gb.609_sqn", "gb.601_sqn", "de.i_kg51", "de.i_kg2", "de.i_zg26"], ["raf_phase_3", "dowding_despatch"], photo="de", importance=1)
    event("northern_raids", "1940-08-15", "跨北海袭击：北方防空经受考验", "Luftflotte 5 raids on northern England", "第五航空队从挪威和丹麦越过北海，袭向英格兰东北及德里菲尔德，误判北方防御已被南调削弱。第十三航空群依靠预警与分层指挥组织拦截，迫使编队付出严重损失。北方中队的作用说明战役并不局限于伦敦和海峡。", "north_sea", ["gb.72_sqn", "gb.607_sqn", "gb.605_sqn", "gb.616_sqn", "de.i_kg26", "de.i_kg30", "de.i_zg76"], ["raf_northern_skies", "raf_german_commanders", "dowding_despatch"], photo="de", importance=1)
    event("hardest_day", "1940-08-18", "最艰难的一天", "The Hardest Day", "德国编队攻击肯利、比金山、南岸机场和波林雷达，英国战斗机奋力拦截。肯利遭到低空 Do 17 袭击，机场设施与地勤也承受打击。双方付出高昂飞机损失，Ju 87 在强大防空中的脆弱性尤为明显，机场修复成为持续作战关键。", "kenley", ["gb.111_sqn", "gb.64_sqn", "gb.234_sqn", "de.iii_kg76", "de.i_stg77", "de.i_zg26"], ["raf_hardest_day", "tna_hardest_day"], photo="ground", importance=1)
    event("the_few", "1940-08-20", "丘吉尔赞颂少数人", "Churchill's 'The Few' speech", "丘吉尔在下院评述战局，赞颂飞行员在空中的牺牲与贡献，少数人的称呼由此广为人知。演说发生时攻势尚未结束，机场仍面临压力。战役的延续也依靠雷达人员、观察哨、地勤、工厂工人以及来自多国的飞行员共同支撑。", "london", ["gb.fighter_command", "gb.group11"], ["hansard_few", "raf_battle_overview"], photo="raf", political=True)
    event("berlin_retaliation", "1940-08-24", "伦敦遭炸与柏林报复空袭", "London bombing and RAF retaliation against Berlin", "八月二十四日至二十六日，伦敦受炸与 RAF 轰炸柏林相继发生，使城市目标与政治报复更受关注。东南机场战仍在继续，轰炸重心并未一夜完全改变。动画选择同期伦敦方向的代表拦截；远程柏林行动以文字说明，未伪造精确航迹。", "london", ["gb.56_sqn", "gb.501_sqn", "de.ii_kg53", "de.i_jg26"], ["raf_phase_3", "raf_phase_4", "iwm_factsheet"], photo="london", end="1940-08-26")
    event("airfields_crisis", "1940-08-31", "机场与飞行员承受重压", "Pressure on sector stations and fighter pilots", "持续空袭使东南机场、扇区通信和飞行员轮换承受重压，比金山等设施受损，需要地勤迅速修复。训练补充与跨防区调动同样重要。RAF 仍维持作战能力，新投入的波兰等中队增援防空；战果宣称则应与实际损失区分。", "biggin_hill", ["gb.303_sqn", "gb.501_sqn", "gb.616_sqn", "de.i_kg2", "de.iii_kg76", "de.iii_jg53"], ["raf_phase_3", "raf_polish", "dowding_despatch"], photo="ground", importance=1)
    event("london_blitz", "1940-09-07", "伦敦港区遭大规模袭击", "Black Saturday / Start of the London Blitz", "德国空军以大型轰炸编队攻击伦敦东区港口和工业区，夜间袭击接续，闪电战由此展开。目标转向首都使部分机场获得修复间隙，但伦敦防空与平民付出沉重代价。RAF 调集东南及邻近防区中队拦截，空中消耗战仍未结束。", "wapping", ["gb.501_sqn", "gb.303_sqn", "gb.19_sqn", "de.ii_kg53", "de.iii_kg76", "de.i_jg26"], ["raf_phase_4", "iwm_factsheet"], photo="london", importance=1)
    event("battle_of_britain_day", "1940-09-15", "不列颠空战日", "Battle of Britain Day", "德国再次以大型昼间编队袭向伦敦，RAF 第十一航空群与邻近航空群协同迎击，达克斯福德方向也派出增援。袭击未能摧毁英国防空，德军损失沉重。战后这一天成为纪念高峰，但战斗随后仍持续，夸大的当日击落宣称不能当作实损。", "london", ["gb.303_sqn", "gb.19_sqn", "gb.242_sqn", "gb.605_sqn", "gb.72_sqn", "de.ii_kg53", "de.iii_kg76", "de.iii_jg53"], ["raf_phase_4", "raf_bader", "raf_polish", "dowding_despatch"], photo="ground", importance=1)
    event("sealion_postponed", "1940-09-17", "海狮行动推迟", "Operation Sealion postponed", "英国战斗机司令部仍能抵抗，德国未取得入侵所需的制空条件，希特勒把海狮行动继续推迟。天气、渡海准备与海军风险也制约计划。推迟登陆不意味着空袭终止：伦敦夜袭和较小规模的昼间战斗、战斗轰炸任务仍然延续。", "dover_strait", ["gb.fighter_command", "de.luftflotte2", "de.luftflotte3"], ["raf_sealion", "raf_phase_4"], photo="de", political=True, importance=1)
    event("last_daylight_raid", "1940-10-29", "末期昼间袭击与战斗轰炸", "Late October daylight fighter-bomber raids", "十月末，德国更多使用小编队与携弹战斗机发动昼间袭击，大型夜间轰炸仍继续。高空快速接近使拦截更困难，RAF 调整巡逻与预警。二十九日代表战役末期仍有交战的事实，而非所有昼间飞行的最后一天，更不是闪电战的终点。", "portsmouth", ["gb.609_sqn", "gb.56_sqn", "de.i_jg26", "de.iii_jg53", "de.i_kg51"], ["raf_phase_5", "dowding_despatch"], photo="de")
    event("campaign_end", "1940-10-31", "官方战役时段结束", "Official end of the Battle of Britain period", "英国采用七月十日至十月三十一日作为不列颠空战的官方时段。RAF 保存了可持续的防空力量，德国未实现击败战斗机司令部并支援入侵的目标。这个日期是纪念与统计边界，伦敦及其他城市的夜间轰炸仍持续到次年，战争远未结束。", "bentley_priory", ["gb.fighter_command", "gb.group10", "gb.group11", "gb.group12", "gb.group13"], ["raf_battle_overview", "raf_phases"], photo="raf", political=True, importance=1)

def make_sorties():
    plans = [
        ("convoy_battles", "1940-07-10", "channel_convoy", "raf_phase_1", [("de.i_kg2", "raid"), ("gb.54_sqn", "intercept"), ("gb.56_sqn", "intercept")]),
        ("convoy_peewit", "1940-08-08", "peewit_area", "raf_phase_2", [("de.i_stg77", "raid"), ("de.iii_stg1", "raid"), ("de.i_zg26", "escort"), ("gb.601_sqn", "intercept"), ("gb.609_sqn", "intercept")]),
        ("radar_attacks", "1940-08-12", "radar_ventnor", "raf_phase_2", [("de.i_kg51", "raid"), ("gb.64_sqn", "intercept"), ("gb.601_sqn", "intercept")]),
        ("eagle_day", "1940-08-13", "southampton", "raf_phase_3", [("de.i_kg51", "raid"), ("de.i_zg26", "escort"), ("gb.609_sqn", "intercept"), ("gb.601_sqn", "intercept")]),
        ("eagle_day_east", "1940-08-13", "manston", "raf_phase_3", [("de.i_kg2", "raid"), ("de.i_jg26", "escort"), ("gb.56_sqn", "intercept")]),
        ("northern_raids", "1940-08-15", "newcastle", "raf_northern_skies", [("de.i_kg26", "raid"), ("de.i_zg76", "escort"), ("gb.72_sqn", "intercept"), ("gb.607_sqn", "intercept"), ("gb.605_sqn", "intercept")]),
        ("northern_raids_south", "1940-08-15", "driffield", "raf_northern_skies", [("de.i_kg30", "raid"), ("gb.616_sqn", "intercept")]),
        ("hardest_day", "1940-08-18", "kenley", "raf_hardest_day", [("de.iii_kg76", "raid"), ("de.i_zg26", "escort"), ("gb.111_sqn", "intercept"), ("gb.64_sqn", "intercept")]),
        ("hardest_day_south", "1940-08-18", "radar_poling", "raf_hardest_day", [("de.i_stg77", "raid"), ("gb.234_sqn", "intercept"), ("gb.609_sqn", "intercept")]),
        ("berlin_retaliation", "1940-08-24", "wapping", "raf_phase_3", [("de.ii_kg53", "raid"), ("de.i_jg26", "escort"), ("gb.56_sqn", "intercept"), ("gb.501_sqn", "intercept")]),
        ("airfields_crisis", "1940-08-31", "biggin_hill", "raf_phase_3", [("de.i_kg2", "raid"), ("de.iii_kg76", "raid"), ("de.iii_jg53", "escort"), ("gb.303_sqn", "intercept"), ("gb.501_sqn", "intercept"), ("gb.616_sqn", "intercept")]),
        ("london_blitz", "1940-09-07", "wapping", "raf_phase_4", [("de.ii_kg53", "raid"), ("de.iii_kg76", "raid"), ("de.i_jg26", "escort"), ("gb.501_sqn", "intercept"), ("gb.303_sqn", "intercept"), ("gb.19_sqn", "intercept")]),
        ("battle_of_britain_day", "1940-09-15", "london", "raf_phase_4", [("de.ii_kg53", "raid"), ("de.iii_kg76", "raid"), ("de.iii_jg53", "escort"), ("gb.303_sqn", "intercept"), ("gb.19_sqn", "intercept"), ("gb.242_sqn", "intercept"), ("gb.605_sqn", "intercept"), ("gb.72_sqn", "intercept")]),
        ("last_daylight_raid", "1940-10-29", "portsmouth", "raf_phase_5", [("de.i_kg51", "raid"), ("gb.609_sqn", "intercept")]),
        ("last_daylight_raid_east", "1940-10-29", "dover_strait", "raf_phase_5", [("de.i_jg26", "raid"), ("de.iii_jg53", "escort"), ("gb.56_sqn", "intercept")]),
    ]
    for tag, day, objective, source, units in plans:
        for uid, role in units:
            alt = 500 if tag == "hardest_day" and uid == "de.iii_kg76" else None
            sortie(uid, day, objective, tag, role, source, altitude=alt)
    for u in UNITS:
        if u["type"] == "hq": continue
        end = u["active"]["to"]
        u["track"].append({"at": end, "pos": base_at(u, end), "status": "active", "flightPhase": "at_base", "altitudeM": 0})
        u["track"].sort(key=lambda p: p["at"])
        for a, b in zip(u["track"], u["track"][1:]):
            if a["at"] >= b["at"]: raise ValueError("track collision: " + u["id"] + " " + a["at"])

def poly(points): return [points]
def make_airspace():
    groups = [
        {"id": "gb.group10", "label": "10 Group · 西南／威尔士（防区示意）", "polygons": [poly([[-6.7,50],[-5.6,53],[-2.35,53.1],[-1.3,51.5],[-1.6,50.5],[-4.3,49.8]])]},
        {"id": "gb.group11", "label": "11 Group · 伦敦／东南（防区示意）", "polygons": [poly([[-1.6,50.5],[-1.3,51.5],[.2,52.1],[1.9,52.1],[2,50.9],[.4,50.6]])]},
        {"id": "gb.group12", "label": "12 Group · 中部／东部（防区示意）", "polygons": [poly([[-2.35,53.1],[-1.95,53.8],[.3,53.8],[1.9,52.1],[.2,52.1],[-1.3,51.5]])]},
        {"id": "gb.group13", "label": "13 Group · 北部／苏格兰（防区示意）", "polygons": [poly([[-5.9,53.8],[-6.6,57.8],[-3.9,60.2],[.2,59.3],[.3,53.8],[-1.95,53.8]]), poly([[-8.2,54],[-8.1,55.4],[-5.3,55.5],[-5.3,54]])]},
    ]
    radar = [{"id": p["id"], "label": p["zh"] + " · 示意范围", "pos": "@"+p["id"], "rangeKm": 120, "sources": p["sources"], "confidence": "low"} for p in PLACES if p["kind"] == "radar"]
    write("src/data/airspace.json", {"groups": groups, "radar": radar, "sources": ["commons_britain_map", "raf_defences", "raf_radar"], "confidence": "low", "note": "固定行政防区按参考图概化，非领土控制线。雷达圆环仅供解释早期预警，非真实探测保证；探测受高度、海面、地形、天气及设备状态影响。"})
    south = poly([[-2.9,49.6],[1.9,49.7],[2.15,51.65],[.3,52.0],[-1.9,51.15]])
    southeast = poly([[.4,50.05],[2.2,50.15],[1.7,52.0],[-.5,51.9],[-.8,50.95]])
    london = poly([[.1,50.4],[1.8,50.2],[1.4,51.8],[-.5,51.9],[-1,51.1]])
    north = poly([[-1.9,53.8],[1.4,54.0],[10.2,57.2],[6.4,59.2],[-.4,56.0],[-2,55.3]])
    north_intercept = poly([[-2.1,53.8],[-.1,53.9],[1,55.8],[-.8,56.4],[-2.3,55.2]])
    frames = []
    def emit(at, raids, interceptions, sources, note):
        frame = {"at": at, "raids": raids, "interceptions": interceptions, "sources": sources + ["britain_reconstruction"], "confidence": "low", "note": note}
        write("src/data/airframes/"+at.replace(":", "-")+".json", frame)
        frames.append(at)
    empty_note = "无持续占领区；非出击期间留空。教学空战范围并非飞机或雷达的精确覆盖。"
    emit(T0, [], [], ["raf_phases"], empty_note)
    for e in EVENTS:
        at = e["at"]
        if e["category"] != "air":
            emit(at, [], [], e["sources"], empty_note)
            continue
        raid = north if e["id"] == "e.northern_raids" else london if e["id"] in ["e.london_blitz", "e.battle_of_britain_day", "e.berlin_retaliation"] else southeast if e["id"] in ["e.airfields_crisis", "e.hardest_day", "e.convoy_battles"] else south
        intercept = north_intercept if e["id"] == "e.northern_raids" else raid
        emit(iso(parse(at)-timedelta(hours=1)), [], [], e["sources"], empty_note)
        emit(at, [raid], [intercept], e["sources"], "代表袭击与拦截空域可在陆地、海峡及北海重叠；范围、钟点为教学概化，不是精确航迹，也不改变任何地面国界。")
        emit(iso(parse(at)+timedelta(hours=1)), [], [], e["sources"], empty_note)
    emit(END, [], [], ["raf_phases"], empty_note)
    write("config/keyframes.json", {"_doc": "空战示意关键帧，BST 本地钟面；src/data/airframes/。无领土占领插值。未知作战分时均为教学重构，事件日期按史料。", "keyframes": sorted(set(frames))})

def make_forces():
    write("src/data/forces_summary.json", {"sides": {
        "GB": {"name": "皇家空军战斗机司令部", "commander": "休·道丁 Hugh Dowding", "men": 2945, "divisions": "4 个代表航空群；15 个代表中队", "tanks": 0, "guns": 0, "asOf": "1940-07-10 至 10-31 · 全战役时段", "losses": {"killed": "544 名 RAF 空勤人员阵亡", "wounded": "未提供统一口径", "aircraft": "不混合实损、严重受损与击落宣称"}, "note": "Hurricane 与 Spitfire 是主要昼间战斗机。RAF 官方确认全战役有 2,945 名空勤人员获战役资格，544 人阵亡；不是同一时刻兵力。本作 180 架的代表编队标尺不等于历史可用机总量。"},
        "DE": {"name": "德国空军西线航空力量", "commander": "赫尔曼·戈林；凯塞林、施佩勒、施通普夫", "men": 0, "divisions": "3 个代表航空队；12 个代表大队", "tanks": 0, "guns": 0, "asOf": "1940 年夏秋 · 参战方向与机型说明", "losses": {"killed": "未采用混合伤亡总量作为阵亡数", "wounded": "未提供统一口径", "aircraft": "击落宣称与核查实损须区分"}, "note": "参战机型含 Bf 109、Bf 110、He 111、Do 17、Ju 88 与 Ju 87。RAF Museum 提及约 2,600 名德国空勤人员损失，未作单一阵亡数。本作 360 架为选编标尺，未声称是航空队全数或当日可用机数。"}
    }, "sources": ["raf_battle_overview", "raf_defend_guide", "iwm_factsheet", "raf_phases", "dowding_despatch", "britain_reconstruction"]})

def main():
    global GAZ, UNIT_MAP
    make_places()
    GAZ = {p["id"]: p for p in PLACES}
    make_units()
    UNIT_MAP = {u["id"]: u for u in UNITS}
    make_events()
    add_relocations()
    make_sorties()
    make_airspace()
    make_forces()
    write("src/data/gazetteer/britain.json", PLACES)
    write("src/data/oob/raf.json", [u for u in UNITS if u["side"] == "GB"])
    write("src/data/oob/luftwaffe.json", [u for u in UNITS if u["side"] == "DE"])
    write("src/data/routes/sorties.json", ROUTES)
    write("src/data/events.json", EVENTS)
    write("src/data/sources/britain.json", SOURCES)
    write("scripts/.cache/britain/sorties-manifest.json", {"note": "Schematic sorties; not historical clock times or precise tracks.", "missions": MISSIONS})
    print(f"{len(EVENTS)} events, {len(PLACES)} places, {len(UNITS)} units ({sum(u['type'] != 'hq' for u in UNITS)} leaves), {len(MISSIONS)} sorties, {len(ROUTES)} routes")

if __name__ == "__main__":
    main()
