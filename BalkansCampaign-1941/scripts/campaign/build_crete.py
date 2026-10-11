#!/usr/bin/env python3
"""Build the Crete chapter and optionally fetch its documented archive assets.

All paths are relative to this isolated BalkansCampaign-1941 workspace.
The JSON build needs only the standard library; --assets also needs Pillow.
Front files contain Crete only. The root assembler adds the final mainland DE.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
START = "1941-04-30T00:00"
END = "1941-06-01T23:59"
US = "cr_usarmy"
NZ1 = "cr_nz_first"
NZ2 = "cr_nz_middle"
NZ3 = "cr_nz_retreat"
NZ4 = "cr_nz_evac"
NZ5 = "cr_nz_capture"
AWM = "cr_awm"
NAVY = "cr_cunningham"


def write(rel: str, data) -> None:
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def at(day: str | int, hour: str = "12:00") -> str:
    if isinstance(day, str) and day.startswith("1941-"):
        return day if "T" in day else day + "T" + hour
    return f"1941-05-{int(day):02d}T{hour}"


def T(day, place, status="active", movement=None, hour="12:00", note=None):
    p = {"at": at(day, hour), "pos": "@" + place if isinstance(place, str) else place, "status": status}
    if movement:
        p["movement"] = movement
    if note:
        p["note"] = note
    return p


def U(uid, side, echelon, kind, zh, short, parent=None, track=None, model=None,
      begin=START, finish=END, commander=None, history="", sources=None):
    u = {"id": uid, "side": side, "echelon": echelon, "type": kind, "parent": parent,
         "name": {"zh": zh, "short": short}, "active": {"from": begin, "to": finish},
         "track": track or [], "history": history, "sources": sources or [US, AWM],
         "confidence": "medium"}
    if model:
        u["model"] = model
    if commander:
        u["commander"] = {"zh": commander}
    return u


def build_sources():
    return [
        {"id": US, "title": "The German Campaigns in the Balkans (Spring 1941), Part IV: Operation MERKUR",
         "author": "U.S. Army, George E. Blau", "year": 1953,
         "url": "https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-4.html",
         "license": "U.S. federal government work; Public domain in the United States"},
        {"id": AWM, "title": "Greece, Crete and Syria, chapters 10–14",
         "author": "Gavin Long / Australian War Memorial", "year": 1953,
         "url": "https://www.awm.gov.au/collection/C1417307"},
        {"id": NZ1, "title": "The Battle for Crete: days 1–3", "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-1-3",
         "license": "Text CC BY-NC 3.0 NZ; factual chronology independently retold"},
        {"id": NZ2, "title": "The Battle for Crete: days 4–6", "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/the-battle-day-4-6",
         "license": "Text CC BY-NC 3.0 NZ; factual chronology independently retold"},
        {"id": NZ3, "title": "The Battle for Crete: retreat, days 7–9", "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/retreat-days-7-9",
         "license": "Text CC BY-NC 3.0 NZ; factual chronology independently retold"},
        {"id": NZ4, "title": "The Battle for Crete: evacuation, days 10–12", "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/evacuation-days-10-12",
         "license": "Text CC BY-NC 3.0 NZ; factual chronology independently retold"},
        {"id": NZ5, "title": "The Battle for Crete: capitulation and capture", "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/capitulation-capture",
         "license": "Text CC BY-NC 3.0 NZ; factual chronology independently retold"},
        {"id": NAVY, "title": "The Battle of Crete — Admiral Cunningham's despatch of 4 August 1941",
         "author": "Admiral Sir Andrew B. Cunningham / The London Gazette", "year": 1948,
         "url": "https://www.ibiblio.org/hyperwar/UN/UK/LondonGazette/38296.pdf"},
        {"id": "cr_nz_overview", "title": "The Battle for Crete: overview",
         "author": "Manatū Taonga — Ministry for Culture and Heritage",
         "url": "https://nzhistory.govt.nz/war/the-battle-for-crete/overview"},
        {"id": "cr_archive_film", "title": "Return from Crete (1941)", "author": "New Zealand National Film Unit", "year": 1941,
         "url": "https://www.nzonscreen.com/videos/return-from-crete-1941/",
         "license": "Archive film external link; no media file bundled"},
        {"id": "cr_italian_history", "title": "L'Italia in guerra: il secondo anno 1941, p. 459",
         "author": "Ministero della Difesa, Italia", "year": 1991,
         "url": "https://musei.difesa.it/allegati/Convegno%201991%20-%20l%20Italia%20in%20guerra%20il%20secondo%20anno%201941/files/basic-html/page459.html"},
    ]


def build_places():
    rows = [
        ("athens_airfields", "雅典地区机场", "Athens airfields (Eleusis)", [23.534, 38.063], "region", 3, "GR"),
        ("rhodes", "罗得岛（意占）", "Rodi", [28.229, 36.444], "port", 3, "IT"),
        ("milos", "米洛斯岛", "Milos", [24.446, 36.726], "port", 3, "GR"),
        ("tavronitis", "塔夫罗尼蒂斯河口", "Tavronitis", [23.819, 35.529], "river", 4, "GR"),
        ("maleme_airfield", "马莱迈机场", "Maleme aerodrome", [23.831, 35.530], "fort", 2, "GR"),
        ("maleme", "马莱迈", "Maleme", [23.846, 35.522], "village", 3, "GR"),
        ("hill107", "107高地", "Point 107", [23.840, 35.518], "fort", 4, "GR"),
        ("platanias", "普拉塔尼亚斯", "Platanias", [23.909, 35.515], "village", 3, "GR"),
        ("galatas", "加拉塔斯", "Galatas", [23.963, 35.500], "village", 2, "GR"),
        ("prison_valley", "监狱谷地", "Prison Valley / Aghya", [23.953, 35.474], "region", 4, "GR"),
        ("alikianos", "阿利基亚诺斯", "Alikianou", [23.913, 35.453], "village", 4, "GR"),
        ("chania", "干尼亚", "Canea", [24.018, 35.513], "city", 2, "GR"),
        ("perivolia_west", "佩里沃利亚（干尼亚）", "Perivolia, Canea", [23.994, 35.472], "village", 4, "GR"),
        ("souda", "苏达湾", "Suda Bay", [24.074, 35.488], "port", 2, "GR"),
        ("fortysecond", "四十二街", "42nd Street / Tsikalaria", [24.065, 35.476], "region", 4, "GR"),
        ("stilos", "斯蒂洛斯", "Stilos", [24.129, 35.431], "village", 4, "GR"),
        ("askifou", "阿斯基富高原", "Askifou Plain", [24.171, 35.290], "region", 3, "GR"),
        ("imvros", "伊姆布罗斯隘口", "Imvros", [24.168, 35.251], "crossing", 4, "GR"),
        ("komitadhes", "科米塔德斯", "Komitadhes", [24.173, 35.209], "village", 4, "GR"),
        ("sfakia", "斯法基亚撤离港", "Sphakia", [24.137, 35.201], "port", 2, "GR"),
        ("sfakia_roads", "斯法基亚外海", "Off Sphakia", [24.137, 35.174], "region", 4, None),
        ("retimo", "雷西姆诺", "Retimo", [24.475, 35.370], "town", 2, "GR"),
        ("retimo_airfield", "雷西姆诺机场", "Retimo aerodrome / Pigi", [24.613, 35.372], "fort", 3, "GR"),
        ("perivolia_east", "佩里沃利亚（雷西姆诺）", "Perivolia, Retimo", [24.508, 35.367], "village", 4, "GR"),
        ("heraklion", "伊拉克利翁", "Heraklion", [25.134, 35.339], "city", 2, "GR"),
        ("heraklion_airfield", "伊拉克利翁机场", "Heraklion aerodrome", [25.179, 35.339], "fort", 3, "GR"),
        ("heraklion_port", "伊拉克利翁港", "Heraklion harbour", [25.138, 35.348], "port", 3, "GR"),
        ("sitia", "锡蒂亚", "Sitia", [26.104, 35.208], "port", 3, "GR"),
        ("ierapetra", "耶拉派特拉", "Ierapetra", [25.742, 35.008], "port", 3, "GR"),
        ("kissamos", "卡斯泰利", "Kastelli Kissamou", [23.653, 35.494], "town", 3, "GR"),
        ("interception", "北岸海运截击区", "Waters north of Canea", [23.92, 35.80], "region", 4, None),
        ("egypt_edge", "赴埃及（图外）", "To Alexandria, Egypt (off-map)", [25.110, 34.510], "region", 3, None),
        ("egypt_east_edge", "赴埃及东部航路（图外）", "To Alexandria via eastern Crete (off-map)", [26.900, 34.510], "region", 4, None),
    ]
    return [{"id": "cr_" + p, "zh": z, "orig": o, "pos": ll, "kind": k, "rank": r, **({"country1939": c} if c else {})}
            for p, z, o, ll, k, r, c in rows]


def build_units():
    # HQs stay at documented command locations; task groups use brigade-level
    # symbols without claiming that an ad-hoc group was an established brigade.
    air_start = at(20, "06:00")
    evac4 = [T(28, "cr_askifou", "withdrawing"), T(30, "cr_sfakia", "withdrawing", "sea", "23:00"),
             T(31, "cr_egypt_edge", "withdrawing", "sea", "12:00", "埃及在图外，图幅南缘终止")]
    evac5 = [T(27, "cr_fortysecond", "engaged"), T(28, "cr_stilos", "withdrawing"),
             T(29, "cr_askifou", "engaged"), T(30, "cr_komitadhes", "withdrawing"),
             T(31, "cr_sfakia", "withdrawing", "sea", "23:00"),
             T("1941-06-01", "cr_egypt_edge", "withdrawing", "sea", "10:00", "主力离岛；留下者另见投降事件")]
    herak_sea = [T(28, "cr_heraklion_port", "withdrawing", "sea", "23:00"),
                T(29, [26.48, 35.48], "withdrawing", "sea", "04:00"),
                T(29, [26.60, 35.01], "withdrawing", "sea", "09:00"),
                T(29, "cr_egypt_east_edge", "withdrawing", "sea", "18:00", "绕东端后赴埃及，非穿岛航线")]
    return [
        U("de.xi_air_crete", "DE", "corps", "hq", "第11航空军", "XI空军", track=[T(20, "cr_athens_airfields"), T("1941-06-01", "cr_athens_airfields")],
          begin=air_start, commander="库尔特·施图登特",
          history="第11航空军负责“水星”行动的空降与空运组织，使用希腊大陆机场作为出发基地。地图上的四个空降战斗群和山地增援显示实际战区分工，军部位置保留在大陆机场区。"),
        U("de.7air_crete", "DE", "division", "airborne", "第7航空师（空降）", "7空降", "de.xi_air_crete",
          begin=air_start, history="德国主要伞兵师。各空降群20日在四处目标附近降落，首日损失严重，未能按计划夺取全部机场。师长苏斯曼在入侵飞行中身亡，随后战斗由各地区指挥官组织。"),
        U("de.maleme_crete", "DE", "brigade", "airborne", "马莱迈空降战斗群", "马莱迈群", "de.xi_air_crete",
          [T(20, "cr_athens_airfields", "active", "air", "06:00"), T(20, "cr_tavronitis", "engaged", hour="08:00"),
           T(21, "cr_maleme_airfield", "engaged"), T(23, "cr_platanias", "engaged"),
           T(25, "cr_galatas", "engaged"), T(28, "cr_chania", "active")], "para_de", begin=air_start,
          history="以伞兵突击团为骨干的西部登陆群，首先在塔夫罗尼蒂斯河床附近立足。夺取马莱迈机场及107高地后接应山地部队，再沿北岸向加拉塔斯推进。战斗群采用旅级概略符号。"),
        U("de.chania_crete", "DE", "brigade", "airborne", "干尼亚空降战斗群", "干尼亚群", "de.7air_crete",
          [T(20, "cr_athens_airfields", "active", "air", "06:00"), T(20, "cr_prison_valley", "engaged", hour="08:00"),
           T(24, "cr_prison_valley", "engaged"), T(25, "cr_galatas", "engaged"), T(28, "cr_souda", "active")],
          "para_de", begin=air_start, history="第3伞兵团等部队在干尼亚与监狱谷地附近降落，遭新西兰及希腊守军阻击。早期孤立据点与马莱迈方向逐渐会合，随后压迫干尼亚—苏达防线。"),
        U("de.retimo_crete", "DE", "brigade", "airborne", "雷西姆诺空降战斗群", "雷西姆诺群", "de.7air_crete",
          [T(20, "cr_athens_airfields", "active", "air", "13:00"), T(20, "cr_perivolia_east", "encircled", hour="16:00"),
           T(28, "cr_perivolia_east", "encircled"), T(29, "cr_retimo", "engaged"), T(30, "cr_retimo_airfield", "active")],
          "para_de", begin=at(20, "13:00"), history="第2伞兵团的雷西姆诺战斗群在下午空降后未能夺取机场，长期分散在城东和机场附近据点，受澳大利亚与希腊军队围攻。29日与从西部推进的德军接触。"),
        U("de.heraklion_crete", "DE", "brigade", "airborne", "伊拉克利翁空降战斗群", "伊拉克利翁群", "de.7air_crete",
          [T(20, "cr_athens_airfields", "active", "air", "13:00"), T(20, [25.098, 35.326], "encircled", hour="16:00"),
           T(27, [25.105, 35.319], "encircled"), T(28, [25.110, 35.330], "engaged"),
           T(29, "cr_heraklion_airfield", "active"), T(30, "cr_heraklion", "active")],
          "para_de", begin=at(20, "13:00"), history="第1伞兵团的东部战斗群首日遭重创，未拿下港口和机场。当地英、澳、希军持续守住防区，直到28—29日夜间海撤后，德军才得以控制伊拉克利翁主要设施。"),
        U("de.5mountain_crete", "DE", "division", "mountain", "第5山地师", "5山地", "de.xi_air_crete",
          [T(21, "cr_athens_airfields", "active", "air", "12:00"), T(21, "cr_maleme_airfield", "engaged", hour="16:00"),
           T(24, "cr_platanias", "engaged"), T(25, "cr_alikianos", "engaged"),
           T(28, "cr_souda", "engaged"), T(29, "cr_retimo", "active", note="东进分遣队作战重心，非全师步行里程"), T(30, "cr_heraklion", "active", note="北岸追击分遣队位置，部队分散行动"),
           T("1941-06-01", "cr_imvros", "active")], "inf_de", begin=at(21), commander="尤利乌斯·林格尔",
          history="21日起由运输机陆续送入马莱迈。山地步兵沿北岸及山径压迫守军侧后，增援改变了西部力量对比。轨迹代表师的作战重心，南追和东进分遣队并非整师依次走完同一路线。"),
        U("de.viii_air_crete", "DE", "corps", "air", "第8航空军（空中支援）", "VIII航空", track=[T(20, "cr_athens_airfields", movement="air"), T("1941-06-01", "cr_athens_airfields", movement="air")],
          begin=at(20, "00:00"), commander="沃尔弗拉姆·冯·里希特霍芬",
          history="负责对克里特守军和周边皇家海军舰艇实施空中攻击。飞机从希腊大陆及附近岛屿基地出动。此标识是航空部队组织位置，不作为岛上地面步兵显示。"),
        U("de.sea_convoy_crete", "DE", "brigade", "naval", "轴心海运增援船队", "增援船队", "de.xi_air_crete",
          [T(21, "cr_milos", "active", "sea"), T(21, "cr_interception", "engaged", "sea", "23:00"),
           T(22, "cr_milos", "disbanded", "sea")], begin=at(21), finish=at(22, "23:59"),
          history="载运山地部队和重装备的机帆船队由希腊岛屿南下，21—22日夜在克里特北部海域遭皇家海军截击。船队未按计划在西部建立海运增援通道，残部撤回。", sources=[US, NAVY]),
        U("nz.creforce_crete", "NZ", "army", "hq", "克里特盟军总司令部", "Creforce",
          track=[T("1941-04-30", "cr_souda"), T(27, "cr_stilos", "withdrawing"),
                 T(30, "cr_sfakia", "withdrawing", "air", "23:00"), T(31, "cr_egypt_edge", "withdrawing", "air")],
          finish=at(31, "23:59"), commander="伯纳德·弗赖伯格",
          history="弗赖伯格自4月30日统率岛上盟军。英国、澳大利亚、希腊部队在序列树中按本国组织并列列出，作战上接受Creforce指挥。30—31日夜总司令及部分参谋由飞行艇撤往埃及。", sources=[AWM, NZ3, NZ4]),
        U("nz.2d_crete", "NZ", "division", "infantry", "新西兰第2师（克里特）", "NZ第2师", "nz.creforce_crete",
          commander="爱德华·帕蒂克", history="从希腊大陆撤到克里特后，第2师各旅主要守卫马莱迈、加拉塔斯及干尼亚西部。缺少重装备和运输车辆，持续伤亡使防线收缩；后期通过白山山路前往斯法基亚。", sources=[AWM, NZ1, NZ3]),
        U("nz.5b_crete", "NZ", "brigade", "infantry", "新西兰第5步兵旅", "NZ第5旅", "nz.2d_crete",
          [T("1941-04-30", "cr_maleme"), T(20, "cr_hill107", "engaged"), T(22, "cr_platanias", "withdrawing"),
           T(24, "cr_galatas", "engaged")] + evac5, "inf_nz", commander="詹姆斯·哈格斯特",
          history="第5旅承担马莱迈防御，所属第22营控制机场附近107高地。机场丢失后旅逐步东撤；第28毛利营参加马莱迈反攻和四十二街战斗，残部最终由南岸撤离。", sources=[AWM, NZ1, NZ3, NZ4]),
        U("nz.4b_crete", "NZ", "brigade", "infantry", "新西兰第4步兵旅", "NZ第4旅", "nz.2d_crete",
          [T("1941-04-30", "cr_chania"), T(20, "cr_galatas", "engaged"), T(25, "cr_galatas", "engaged"),
           T(26, "cr_perivolia_west", "withdrawing")] + evac4, "inf_nz",
          finish=at(31, "23:59"), commander="林赛·英格利斯",
          history="第4旅在干尼亚—加拉塔斯地域阻击德军。25日反攻暂时收复村庄，却无力长期维持防线。撤退时在阿斯基富高原提供掩护，30—31日夜间主力搭舰离岛。", sources=[AWM, NZ2, NZ4]),
        U("nz.10b_crete", "NZ", "brigade", "infantry", "新西兰第10混合旅", "NZ第10旅", "nz.2d_crete",
          [T(20, "cr_galatas", "engaged"), T(25, "cr_galatas", "engaged"), T(27, "cr_stilos", "withdrawing")],
          "inf_nz", begin=at(20, "00:00"), finish=at(27, "23:59"), commander="霍华德·基彭伯格",
          history="由骑兵、非步兵人员及希腊协同部队构成的混合防区编组，在加拉塔斯附近作战。后期编组已破碎，人员随主力南撤；不将其显示为整建制独立撤离船队。", sources=[AWM, NZ1, NZ2, NZ3]),
        U("au.crete_force", "AU", "corps", "hq", "澳大利亚驻克里特部队", "澳军驻岛",
          history="澳军从大陆撤离后分布于雷西姆诺、伊拉克利翁和干尼亚—苏达地域。这里以国别组织总览并列各分遣队，不代表另设的独立澳军军部。作战指挥属于Creforce及各防区。"),
        U("au.19b_crete", "AU", "brigade", "infantry", "澳大利亚第19步兵旅（主力）", "澳第19旅", "au.crete_force",
          [T("1941-04-30", "cr_souda"), T(23, "cr_souda", "engaged"), T(27, "cr_fortysecond", "engaged"),
           T(28, "cr_stilos", "withdrawing"), T(30, "cr_imvros", "engaged"),
           T(31, "cr_sfakia", "withdrawing", "sea", "23:00"),
           T("1941-06-01", "cr_egypt_edge", "withdrawing", "sea", "10:00")], "inf_au", commander="乔治·维西",
          history="旅的干尼亚—苏达部队与新西兰第5旅共同执行后卫任务，27日在四十二街反击。第2/7营等在伊姆布罗斯道路附近继续掩护撤退，部分主力赶上最后一夜的海撤。", sources=[AWM, NZ3, NZ4]),
        U("au.retimo_crete", "AU", "brigade", "infantry", "雷西姆诺澳军分遣队", "澳军雷西姆诺", "au.crete_force",
          [T("1941-04-30", "cr_retimo_airfield"), T(20, "cr_retimo_airfield", "engaged"),
           T(28, "cr_retimo_airfield", "encircled"), T(30, "cr_retimo_airfield", "surrendered")], "inf_au",
          commander="伊恩·坎贝尔", history="以第2/1、第2/11营为骨干，与希腊守军共同守卫雷西姆诺机场。防区长期未被伞兵夺取，但与撤离指挥部失去有效联系，30日多数守军投降，另有人员进入山区。"),
        U("au.heraklion_crete", "AU", "brigade", "infantry", "伊拉克利翁澳军分遣队", "澳军伊拉克利翁", "au.crete_force",
          [T("1941-04-30", "cr_heraklion_airfield"), T(20, "cr_heraklion_airfield", "engaged")] + herak_sea,
          "inf_au", finish=at(29, "23:59"),
          history="第2/4营等澳军在英第14旅指挥的伊拉克利翁防区作战，协同英国与希腊部队击退伞兵。28—29日夜随防区部队从港口撤离，归航舰队遭受空袭。"),
        U("gb.crete_force", "GB", "corps", "hq", "英国驻克里特部队", "英军驻岛",
          history="英国陆军和皇家海军陆战队分布于苏达及伊拉克利翁防区。国别树保留这些分遣队，Creforce统一指挥地面战斗；海军的拦截、补给与撤离行动另由地中海舰队组织。"),
        U("gb.14b_crete", "GB", "brigade", "infantry", "英国第14步兵旅", "英第14旅", "gb.crete_force",
          [T("1941-04-30", "cr_heraklion"), T(20, "cr_heraklion_airfield", "engaged")] + herak_sea,
          "inf_gb", finish=at(29, "23:59"), history="负责伊拉克利翁防区，与澳军第2/4营和希腊守军配合。德军首日空降没有夺取港口与机场。英联邦守军直到收到海撤命令，才在28—29日夜间离开。"),
        U("gb.suda_crete", "GB", "brigade", "marine", "苏达英国守备与陆战队", "英军苏达", "gb.crete_force",
          [T("1941-04-30", "cr_souda"), T(24, "cr_souda", "engaged"), T(28, "cr_stilos", "withdrawing"),
           T(30, "cr_imvros", "engaged"), T(31, "cr_sfakia", "withdrawing"),
           T("1941-06-01", "cr_sfakia", "surrendered")], "inf_gb",
          history="苏达防区的英国守备和皇家海军陆战队人员在后期南撤，后卫掩护斯法基亚港口。轨迹末段代表未能搭舰离岛的残留部队，已撤离人员不重复计入投降。", sources=[AWM, NZ3, NZ4, NZ5]),
        U("gb.mediterranean_crete", "GB", "army", "naval", "皇家海军地中海舰队", "皇家海军",
          track=[T(20, "cr_interception", movement="sea"), T(22, [23.80, 35.95], "engaged", "sea"),
                 T(24, [23.20, 35.50], "active", "sea"), T(27, [23.20, 35.02], "active", "sea"),
                 T(28, "cr_sfakia_roads", "withdrawing", "sea"), T("1941-06-01", "cr_egypt_edge", "withdrawing", "sea")],
          begin=at(20, "00:00"), commander="安德鲁·坎宁安",
          history="拦截轴心海运船队后，舰队持续遭受德军空袭。撤离阶段以夜间进入港口的巡洋舰和驱逐舰运走守军，并将伤员送往埃及。海上坐标表示作战海域，不模拟整支舰队精确位置。", sources=[NAVY, AWM, NZ4]),
        U("gr.crete_force", "GR", "corps", "hq", "希腊克里特守备部队", "希军驻岛",
          history="希腊部队及克里特当地人员协助盟军守住四个防区。各地守军装备、弹药和训练程度不一，部分部队长期与伞兵交战。这里按地域编组显示，不把地区分队误称为统一正规师。"),
        U("gr.west_crete", "GR", "brigade", "infantry", "希腊西部守备分队", "希军西部", "gr.crete_force",
          [T("1941-04-30", "cr_galatas"), T(20, "cr_alikianos", "engaged"),
           T(25, "cr_alikianos", "engaged"), T(28, "cr_stilos", "withdrawing"),
           T("1941-06-01", "cr_sfakia", "surrendered")], "inf_gr",
          history="西部希腊部队与当地人员在加拉塔斯、监狱谷地和阿利基亚诺斯一带抵抗空降及山地步兵。符号为防区分组；1日状态代表被俘残部，另有人员继续在山区逃避搜捕。"),
        U("gr.retimo_crete", "GR", "brigade", "infantry", "希腊雷西姆诺守备分队", "希军雷西姆诺", "gr.crete_force",
          [T("1941-04-30", "cr_retimo"), T(20, "cr_retimo", "engaged"),
           T(28, "cr_retimo_airfield", "encircled"), T(30, "cr_retimo_airfield", "surrendered")], "inf_gr",
          history="希腊守军与坎贝尔指挥的澳军合作，在雷西姆诺防区持续围攻孤立伞兵。未及时收到南撤安排，随后随着德军地面部队到达而失去继续有组织抵抗的条件。"),
        U("gr.heraklion_crete", "GR", "brigade", "infantry", "希腊伊拉克利翁守备分队", "希军伊拉克利翁", "gr.crete_force",
          [T("1941-04-30", "cr_heraklion"), T(20, "cr_heraklion", "engaged"),
           T(28, "cr_heraklion", "engaged"), T(30, "cr_heraklion", "surrendered")], "inf_gr",
          history="当地希腊部队协同英联邦守军保卫伊拉克利翁。海军撤走英联邦主力后，仍留在岛上的希腊部队面临投降或分散进入山区，不将其全部标成已经海撤。"),
        U("it.sitia_crete", "IT", "brigade", "infantry", "意大利锡蒂亚登陆支队", "意军锡蒂亚",
          track=[T(27, "cr_rhodes", "active", "sea"), T(28, "cr_sitia", "active", hour="18:00"),
                 T(30, "cr_ierapetra", "active"), T("1941-06-01", "cr_sitia", "active")],
          model="inf_it", begin=at(27), history="意军支队从罗得岛出发，28日在锡蒂亚湾登陆，随后向岛东部和耶拉派特拉方向移动。此行动发生在德军西部突破之后，与20日的四处德国空降分开呈现。", sources=[US, "cr_italian_history"]),
    ]


def R(rid, side, uid, style, label, track, movement="land", until=END, width=5):
    return {"id": "r.cr_" + rid, "side": side, "unit": uid, "style": style,
            "label": label, "movement": movement, "until": until, "widthKm": width,
            "waypoints": [{"at": p["at"], "pos": p["pos"]} for p in track],
            "sources": [US, AWM], "confidence": "medium"}


def build_routes(units):
    ids = {u["id"]: u for u in units}
    rs = []
    for rid, uid, first, last in [
        ("air_maleme", "de.maleme_crete", 0, 1), ("air_chania", "de.chania_crete", 0, 1),
        ("air_retimo", "de.retimo_crete", 0, 1), ("air_heraklion", "de.heraklion_crete", 0, 1),
        ("air_mountain", "de.5mountain_crete", 0, 1),
    ]:
        u = ids[uid]
        rs.append(R(rid, "DE", uid, "main", "山地增援空运" if "mountain" in rid else u["name"]["zh"] + "空降",
                    u["track"][first:last + 1], "air", at(22, "23:59"), 4))
    for rid, uid, label in [
        ("west_advance", "de.maleme_crete", "马莱迈—加拉塔斯推进"),
        ("central_advance", "de.chania_crete", "谷地空降群会合"),
        ("mountain_east", "de.5mountain_crete", "山地部队北岸东进（作战重心）"),
    ]:
        tr = ids[uid]["track"][1:]
        if uid == "de.5mountain_crete":
            tr = tr[:-1]  # Do not imply an entire division turned back to Sfakia.
        rs.append(R(rid, "DE", uid, "main", label, tr))
    rs += [
        R("south_pursuit", "DE", "de.5mountain_crete", "secondary", "山地分遣队向南追击",
          [T(29, "cr_stilos"), T(30, "cr_askifou"), T(31, "cr_imvros"), T("1941-06-01", "cr_sfakia")]),
        R("maleme_counter", "NZ", "nz.5b_crete", "counter", "22日马莱迈反攻",
          [T(22, "cr_platanias", hour="01:00"), T(22, "cr_maleme", hour="06:00"),
           T(22, "cr_platanias", hour="18:00")], until=at(23, "00:00"), width=3),
        R("galatas_counter", "NZ", "nz.4b_crete", "counter", "加拉塔斯夜间反击",
          [T(25, "cr_chania", hour="20:00"), T(25, "cr_galatas", hour="22:00")], until=at(26, "12:00"), width=3),
        R("nz_retreat", "NZ", "nz.5b_crete", "retreat", "新军经白山南撤",
          [T(26, "cr_chania"), T(27, "cr_fortysecond"), T(28, "cr_stilos"),
           T(29, "cr_askifou"), T(30, "cr_komitadhes"), T(31, "cr_sfakia")], width=4),
        R("au_retreat", "AU", "au.19b_crete", "retreat", "澳军后卫与南撤",
          [T(27, "cr_fortysecond"), T(28, "cr_stilos"), T(29, "cr_askifou"), T(30, "cr_imvros"), T(31, "cr_sfakia")], width=4),
        R("sfakia_evacuation", "GB", "gb.mediterranean_crete", "retreat", "赴埃及海撤（图外）",
          [T(28, "cr_sfakia_roads", hour="23:00"), T(29, [24.14, 35.04], hour="04:00"),
           T(29, "cr_egypt_edge", hour="12:00")], "sea", width=5),
        R("heraklion_evacuation", "GB", "gb.14b_crete", "retreat", "伊拉克利翁海撤，绕岛东端",
          ids["gb.14b_crete"]["track"][-4:], "sea", at(30, "00:00"), 5),
        R("axis_convoy", "DE", "de.sea_convoy_crete", "secondary", "海运增援遭截击",
          ids["de.sea_convoy_crete"]["track"][:2], "sea", at(22, "23:59"), 4),
        R("italian_landing", "IT", "it.sitia_crete", "secondary", "意军从罗得岛登陆",
          ids["it.sitia_crete"]["track"][:2], "sea", at(29, "23:59"), 4),
        R("italian_east", "IT", "it.sitia_crete", "secondary", "岛东部登陆支队推进",
          ids["it.sitia_crete"]["track"][1:3], width=4),
    ]
    return rs


def area(points):
    return [points]


def rect(w, s, e, n):
    return area([[w, s], [e, s], [e, n], [w, n]])


def build_fronts():
    # Small, disconnected airheads. Retimo and Heraklion retain separate western
    # and eastern pockets instead of being painted from a sweeping coastal line.
    maleme0 = rect(23.807, 35.517, 23.827, 35.537)
    prison0 = rect(23.941, 35.462, 23.966, 35.482)
    retimo_w = rect(24.499, 35.353, 24.521, 35.374)
    retimo_e = rect(24.642, 35.359, 24.663, 35.378)
    herak_w = rect(25.090, 35.313, 25.113, 35.338)
    herak_e = rect(25.202, 35.314, 25.224, 35.335)
    east_pockets = [retimo_w, retimo_e, herak_w, herak_e]
    maleme1 = area([[23.802, 35.535], [23.864, 35.535], [23.873, 35.518], [23.848, 35.505], [23.817, 35.505]])
    west22 = area([[23.790, 35.548], [23.891, 35.546], [23.902, 35.515], [23.890, 35.493], [23.832, 35.485], [23.796, 35.510]])
    west24 = area([[23.575, 35.680], [23.815, 35.660], [23.938, 35.537], [23.946, 35.513],
                   [23.984, 35.475], [23.947, 35.448], [23.893, 35.420], [23.600, 35.400], [23.530, 35.520]])
    west26 = area([[23.530, 35.730], [23.940, 35.730], [23.992, 35.537], [24.014, 35.503],
                   [24.016, 35.471], [23.956, 35.435], [23.860, 35.405], [23.525, 35.340]])
    west28 = area([[23.510, 35.735], [24.320, 35.735], [24.451, 35.401], [24.452, 35.330],
                   [24.281, 35.300], [24.183, 35.359], [24.156, 35.427], [24.094, 35.430],
                   [23.955, 35.352], [23.510, 35.260]])
    sitia28 = rect(26.05, 35.170, 26.17, 35.253)
    west29 = area([[23.500, 35.735], [24.671, 35.735], [24.703, 35.361], [24.654, 35.287],
                   [24.314, 35.260], [24.220, 35.299], [24.171, 35.329], [24.105, 35.326],
                   [23.951, 35.249], [23.500, 35.220]])
    # The Retimo aerodrome garrison remains isolated until 30 May, even
    # after west-coast forces reach the surrounding district on the 29th.
    retimo_hold = rect(24.585, 35.350, 24.636, 35.396)
    west29_hold = west29 + [retimo_hold[0]]
    herak29 = rect(24.970, 35.232, 25.295, 35.480)
    east29 = area([[25.990, 35.420], [26.490, 35.420], [26.490, 34.925], [25.830, 34.925],
                   [25.773, 35.065], [25.940, 35.195]])
    north31 = area([[23.49, 35.735], [26.49, 35.735], [26.49, 34.925], [25.55, 34.925],
                    [25.15, 35.03], [24.66, 35.17], [24.38, 35.23], [24.23, 35.265],
                    [24.17, 35.249], [24.11, 35.250], [23.89, 35.240], [23.49, 35.210]])
    # A rectangle is intentionally intersected with the engine's land mask:
    # only Crete is inside this extent, not the mainland or Gavdos.
    all_crete = rect(23.49, 34.925, 26.49, 35.735)
    stages = [
        (at(20, "07:59"), [], "空降尚未开始；克里特没有任何轴心控制区。"),
        (at(20), [maleme0, prison0], "上午登陆仅在塔夫罗尼蒂斯与监狱谷地形成零散据点，四防区尚未失守。"),
        (at(20, "18:00"), [maleme0, prison0] + east_pockets, "下午空降后新增雷西姆诺及伊拉克利翁孤立据点；三座机场仍未全部被德军控制。"),
        (at(21, "18:00"), [maleme1, prison0] + east_pockets, "德军利用马莱迈机场接收山地增援；中、东部空降群仍孤立。"),
        (at(22, "18:00"), [west22, prison0] + east_pockets, "马莱迈反攻失败，西部机场桥头堡扩大；雷西姆诺、伊拉克利翁守军继续抵抗。"),
        (at(24), [west24] + east_pockets, "西部空降与山地部队向普拉塔尼亚斯、加拉塔斯及监狱谷地会合，北岸推进未扫过全岛。"),
        (at(26), [west26] + east_pockets, "加拉塔斯反击后盟军继续东撤；干尼亚以东和苏达地区尚有防御。"),
        (at(28, "23:59"), [west28, sitia28] + east_pockets, "干尼亚、苏达失守；盟军越过白山南撤。意军在东端锡蒂亚登陆，两个东方防区仍分别收束。"),
        (at(29, "18:00"), [west29_hold, herak29, east29, retimo_e], "西部增援抵达雷西姆诺，伊拉克利翁海撤后被德军占领；南岸后卫仍掩护登舰。"),
        (at(30, "11:59"), [west29_hold, herak29, east29, retimo_e], "雷西姆诺机场防区仍作为被隔离守军控制的洞保留。"),
        (at(30), [west29, herak29, east29, retimo_e], "雷西姆诺守军投降后，机场防区并入轴心控制区。"),
        (at(31), [north31], "北岸交通线及东部已失去有组织盟军防御；斯法基亚及白山撤离通道仍保留，山区不表示逐处清剿完毕。"),
        (at("1941-06-01"), [all_crete], "残留盟军有组织抵抗结束。控制图代表战役结局，仍有个人逃脱与山区抵抗。"),
        (END, [all_crete], "克里特战役结束；大陆控制区由汇总器保持，海上撤离目的地为图外埃及。"),
    ]
    return [{"at": d, "DE": polys, "SU": [], "note": n, "sources": [US, AWM, NZ1, NZ2, NZ3, NZ4, NZ5],
             "confidence": "high" if not polys else "medium"} for d, polys, n in stages]


PHOTO = {
    "airdrop": "File:German paratroopers and Ju 52 over Crete 1941.jpg",
    "maleme": "File:Maleme airfield Crete with Ju 52s 1941.jpg",
    "ju52": "File:Junkers Ju 52 burning over Crete 1941.jpg",
    "fortysecond": "File:Australian sign at Forty Second Street on Crete 1941 (AWM P03731 001).jpg",
    "evac": "File:The Battle For Crete, 20 - 31 May 1941 E3295.jpg",
    "arrival": "File:ANZAC troops arriving in Alexandria after the Crete campaign 7477379.JPG",
}


def E(eid, day, category, title, body, place, units, source, side=None, importance=2, photo=None, caption=None,
      hour="12:00", precision="day", sfx=None):
    e = {"id": "e.cr_" + eid, "at": at(day, hour), "category": category, "precision": precision,
         "importance": importance, "title": {"zh": title}, "body": body, "place": "@" + place,
         "units": units, "sources": list(dict.fromkeys([US, AWM] + source)), "confidence": "high",
         "sfx": sfx or ["typewriter"], "zoom": 5.2}
    if side:
        e["side"] = side
    if photo:
        e["photo"] = {"commons": PHOTO[photo], "caption": caption or title}
    return e


def build_events():
    return [
        E("merkur", 20, "air", "“水星”行动：上午空降",
          "德军运输机和滑翔机自希腊大陆机场出发，上午首先在马莱迈与干尼亚附近投下部队。新西兰、英国、澳大利亚和希腊守军已分区设防。空降兵在着陆时受到密集射击，首批幸存者形成彼此隔离的小据点，战役没有立即成为整岛被占的单向推进。",
          "cr_maleme", ["de.xi_air_crete", "de.7air_crete", "nz.creforce_crete"], [NZ1], "DE", 1,
          "airdrop", "1941年5月20日，德军伞兵和Ju 52运输机出现在克里特上空；澳大利亚战争纪念馆档案。", "08:00", "minute", ["bomber", "mg"]),
        E("maleme_defence", 20, "battle", "107高地与马莱迈机场防御",
          "新西兰第5旅所属第22营守住机场边缘及107高地。德军在塔夫罗尼蒂斯河床西侧获得掩蔽，而降到守军阵地之间的部队损失惨重。电话线路受破坏、增援迟滞和对前沿状况的误判，使高地守军难以保持完整联系，机场成为战局的关键。",
          "cr_hill107", ["nz.5b_crete", "de.maleme_crete"], [NZ1], "NZ", sfx=["mg", "rifle"]),
        E("prison_valley", 20, "battle", "干尼亚：监狱谷地孤立据点",
          "干尼亚方向的滑翔机和伞兵未能夺取苏达港及盟军司令部。部分德国部队在加拉塔斯以南的监狱谷地重新集结，威胁新西兰各防区之间的交通。希腊守军与新军持续阻击，双方围绕村庄、橄榄林和山坡展开战斗，局势仍十分分散。",
          "cr_prison_valley", ["de.chania_crete", "nz.10b_crete", "gr.west_crete"], [NZ1], "DE", sfx=["rifle", "mg"]),
        E("retimo_drop", 20, "air", "雷西姆诺：下午空降受阻",
          "下午投下的德国伞兵在雷西姆诺城东及机场附近遭澳大利亚和希腊守军打击。空降群没有拿下机场，部分部队被困在各自落地区域，无法与岛西部友军取得稳定联系。此防区持续抵抗多日，不能用马莱迈机场的得失代替它的独立战况。",
          "cr_retimo_airfield", ["de.retimo_crete", "au.retimo_crete", "gr.retimo_crete"], [NZ1], "DE", sfx=["bomber", "mg"]),
        E("heraklion_drop", 20, "air", "伊拉克利翁：港口与机场守住",
          "伊拉克利翁方向的下午空降同样遭到强烈抵抗。英国第14旅、澳军分遣队与希腊守军保住港口及机场，迫使德国伞兵在城西和城东分散坚守。首日结束时，德军尚未获得一个完全安全的机场，东部战斗仍有自己的防御与撤离节奏。",
          "cr_heraklion", ["de.heraklion_crete", "gb.14b_crete", "au.heraklion_crete", "gr.heraklion_crete"], [NZ1], "DE", sfx=["bomber", "rifle"]),
        E("hill107_withdrawal", 21, "movement", "107高地撤出，机场形势逆转",
          "20—21日夜间，新西兰部队因通信困难和增援未及时到达而撤出107高地及机场部分阵地。德军清晨发现防御已收缩，随即巩固马莱迈。机场仍受炮火威胁，但失去关键制高点改变了空运条件；这一局部变化对整场战役产生重大影响。",
          "cr_hill107", ["nz.5b_crete", "de.maleme_crete"], [NZ1], "NZ", 1, sfx=["radio", "artillery"]),
        E("mountain_airlift", 21, "air", "第5山地师开始空运增援",
          "Ju 52运输机在马莱迈机场仍遭零星炮火时送入第5山地师先头部队。飞机、物资和重武器不断到达，跑道上出现受损机体，德军同时清理障碍。此前依赖轻装备和有限弹药的西部空降群，开始获得能持续推进的地面增援。",
          "cr_maleme_airfield", ["de.5mountain_crete", "de.maleme_crete"], [NZ1], "DE", 1,
          "maleme", "1941年5月，马莱迈机场上的德军Ju 52运输机；英国皇家空军档案照片。", sfx=["engine", "artillery"]),
        E("convoy_intercepted", 22, "naval", "皇家海军截击海运增援",
          "21—22日夜间，英国巡洋舰和驱逐舰在干尼亚以北海域遇到载运德军山地部队的机帆船队。多艘运输船被击沉，意大利护航舰掩护残部，另一路增援船队随后撤回。德军未能按计划依靠海运补齐重装备，只能继续依赖马莱迈空运。",
          "cr_interception", ["gb.mediterranean_crete", "de.sea_convoy_crete"], [NAVY, NZ1], "GB", sfx=["ship_gun", "explosion"]),
        E("maleme_counterattack", 22, "battle", "马莱迈反攻失败",
          "新西兰部队在夜间向机场发起反攻，但换防和通信问题使出发推迟。到天亮时，攻击者还未完成夺取机场的任务，德军空袭与地面火力使其难以前进。反攻最终退回出发地域，第5旅随后收缩到普拉塔尼亚斯，机场继续供德国运输机使用。",
          "cr_maleme_airfield", ["nz.5b_crete", "de.maleme_crete", "de.5mountain_crete"], [NZ1], "NZ", 1, sfx=["rifle", "bomber"]),
        E("navy_air_losses", 22, "naval", "海上拦截付出高昂代价",
          "皇家海军在缺少持续战斗机保护的海域遭到密集空袭。部分巡洋舰和驱逐舰被击沉或受损，舰队被迫调整白昼行动。虽然海军阻止了主要轴心增援船队登陆，德军的空中优势仍削弱了岛上守军的补给，并增加了后来撤离航行的危险。",
          "cr_interception", ["gb.mediterranean_crete", "de.viii_air_crete"], [NAVY], "DE", photo="ju52",
          caption="1941年5月，一架遭防空火力击中的Ju 52在克里特上空燃烧；皇家海军官方摄影。", sfx=["stuka", "ship_gun"]),
        E("platanias_retreat", 23, "movement", "普拉塔尼亚斯防线再度收缩",
          "马莱迈失守后，新西兰第5旅在普拉塔尼亚斯建立新防线。德国山地部队从南侧山路逼近，试图与监狱谷地的空降群会合，迫使守军继续向加拉塔斯靠拢。西部多个桥头堡逐渐相连，但雷西姆诺和伊拉克利翁的德国部队仍处于孤立状态。",
          "cr_platanias", ["nz.5b_crete", "de.5mountain_crete", "de.chania_crete"], [NZ2], "NZ", sfx=["march", "artillery"]),
        E("galatas_pressure", 24, "battle", "增援累积，压力转向加拉塔斯",
          "林格尔组织西部空降与山地部队，将推进重点转向加拉塔斯及干尼亚附近道路。盟军反复整理受损部队，粮食、弹药和运输能力却不断减少。希腊与澳新部队利用村庄和高地继续防守，德军以北岸正面和南侧山径共同施加压力。",
          "cr_galatas", ["de.5mountain_crete", "nz.4b_crete", "gr.west_crete"], [NZ2], "DE", sfx=["artillery", "rifle"]),
        E("galatas_assault", 25, "battle", "加拉塔斯遭突破",
          "德军山地步兵与空降部队集中攻击加拉塔斯村及周边高地。新西兰守军已严重减员，仍用临时拼合的步兵、炮兵人员和小股预备队维持防线。到傍晚村庄失守，西部防御出现裂口，英联邦指挥官面临继续反攻还是尽快撤退的选择。",
          "cr_galatas", ["de.5mountain_crete", "de.maleme_crete", "nz.4b_crete"], [NZ2], "DE", 1, sfx=["artillery", "mg"]),
        E("galatas_counterattack", 25, "battle", "夜间反击暂时夺回村庄",
          "基彭伯格协调新西兰步兵，在两辆英国轻型坦克支持下向加拉塔斯反击。步兵快速突入村庄，近距离战斗迫使德国部队后退。这次成功为重新组织防线争取了时间，但守军缺少兵员、炮火和空中支持，随后仍决定放弃村庄，撤向干尼亚。",
          "cr_galatas", ["nz.4b_crete", "nz.10b_crete"], [NZ2], "NZ", 2, sfx=["tank", "rifle"]),
        E("evacuation_request", 26, "movement", "弗赖伯格请求撤离",
          "连续作战、补给不足和敌方空袭使守军难以维持岛西部防线。弗赖伯格向埃及的中东指挥部请求尽快决定撤离，以保存还能有组织行动的部队。新西兰与澳大利亚后卫在干尼亚以东重新设防；撤离准备并不意味着各防区同时停止抵抗。",
          "cr_chania", ["nz.creforce_crete", "nz.2d_crete", "au.19b_crete"], [NZ3], "NZ", 1, sfx=["radio", "morse"]),
        E("fortysecond_charge", 27, "battle", "四十二街后卫反击",
          "在苏达—干尼亚公路附近的四十二街，澳大利亚第19旅和新西兰第5旅的后卫遇到德军追击。澳军与毛利营等部队突然发起刺刀反击，暂时打退先头敌军。这次局部行动为主力脱离北岸争取了时间，两旅随后在夜间向斯蒂洛斯及南方山路撤退。",
          "cr_fortysecond", ["au.19b_crete", "nz.5b_crete", "de.5mountain_crete"], [NZ3], "AU", photo="fortysecond",
          caption="四十二街的战时路牌，约1941年5月26日；该处次日发生澳新军后卫反击。", sfx=["rifle", "mg"]),
        E("evacuation_authorised", 27, "movement", "南岸撤离获准，东方防区仍孤立",
          "Creforce收到撤往埃及的批准，主力开始转向斯法基亚。雷西姆诺和伊拉克利翁仍在抵抗，通信困难使撤离指示无法完整传达。伊拉克利翁计划由海军直接接走，雷西姆诺守军却未获得有效南撤安排，整个撤离过程因此出现不同结局。",
          "cr_souda", ["nz.creforce_crete", "gb.14b_crete", "au.retimo_crete"], [NZ3], "NZ", sfx=["radio", "paper"]),
        E("white_mountains", 28, "movement", "越过白山，通往斯法基亚",
          "盟军主力通过斯蒂洛斯、阿斯基富高原和伊姆布罗斯山路向南岸移动。道路陡峭，车辆不足，疲惫步兵在轰炸威胁下弃置重装备。后卫保持隘口通道，德军主力则仍向北岸东部推进，没有立即把全部兵力投入对南撤部队的追击。",
          "cr_askifou", ["nz.4b_crete", "nz.5b_crete", "au.19b_crete"], [NZ3], "NZ", sfx=["march", "engine"]),
        E("sitia_landing", 28, "naval", "意军登陆岛东锡蒂亚",
          "一支意大利部队由罗得岛出发，在克里特东端锡蒂亚湾登陆，随后向当地港口和内陆方向移动。登陆发生在西部德军已突破、盟军开始南撤之际，后来与德军先遣队接触。它是独立海运行动，不能与20日四处德国空降合成一条推进路线。",
          "cr_sitia", ["it.sitia_crete"], ["cr_italian_history"], "IT", sfx=["engine", "ship_gun"]),
        E("heraklion_evacuated", 29, "naval", "伊拉克利翁守军海撤",
          "28—29日夜，巡洋舰和驱逐舰从伊拉克利翁港接走英联邦守军。港口和机场随后被德军接收，归航船只却在白昼遭空袭，船上人员蒙受伤亡。这里的路线绕过克里特东端再转向埃及；希腊当地守军和未能登舰者的处境与已撤离主力不同。",
          "cr_heraklion_port", ["gb.14b_crete", "au.heraklion_crete", "gb.mediterranean_crete"], [NZ4], "GB", 1,
          photo="evac", caption="从克里特撤离的官兵抵达埃及港口后领取茶水；英国陆军摄影队档案，并非战斗当天现场。", sfx=["engine", "stuka"]),
        E("askifou_rearguard", 29, "battle", "阿斯基富高原后卫战",
          "新西兰后卫在阿斯基富高原北部拦阻德国山地部队，掩护第5旅和澳大利亚部队向港口移动。步兵缺少粮食、饮水和弹药，却仍保持道路防御。皇家海军夜间接近斯法基亚，将能到达海滩的部队分批带走，山口战斗与海撤同时继续。",
          "cr_askifou", ["nz.5b_crete", "au.19b_crete", "de.5mountain_crete"], [NZ4], "NZ", sfx=["rifle", "artillery"]),
        E("retimo_surrender", 30, "surrender", "雷西姆诺守军投降",
          "西部德军抵达后，雷西姆诺防区已难以继续独立维持。未收到有效撤离指示的澳大利亚和希腊守军在补给与弹药不足下投降，另有一部分人员分散进入山区。此前德国伞兵多日未能拿下机场，这里的结局来自战区隔离和地面增援到达。",
          "cr_retimo_airfield", ["au.retimo_crete", "gr.retimo_crete", "de.retimo_crete"], [NZ4], "AU", sfx=["stamp", "paper"]),
        E("last_evacuation", 31, "naval", "斯法基亚最后一夜海撤",
          "指挥部决定31日夜间为最后一次有组织撤离。船位有限，优先登舰的是还能整队行动的步兵和伤员；更多人员仍在岸上等待。皇家海军在空袭损失与舰艇故障下继续执行任务，澳新部队及部分陆战队离岛后，仍留下数千名盟军士兵。",
          "cr_sfakia", ["gb.mediterranean_crete", "nz.5b_crete", "au.19b_crete"], [NZ4], "GB", 1,
          "arrival", "1941年6月1日，从克里特撤出的澳新军在亚历山大港下船；George Silk摄。", sfx=["engine", "ship_gun"]),
        E("capitulation", "1941-06-01", "surrender", "克里特有组织抵抗结束",
          "最后一批军舰离开后，仍在斯法基亚及岛上其他地区的盟军残部面临被俘，有组织抵抗于1日结束。部分人员继续在山区躲避搜捕或设法逃往埃及。战役控制图在此完成岛屿收束，但并不表示所有个人抵抗及后续占领事件也在当天结束。",
          "cr_sfakia", ["gb.suda_crete", "gr.west_crete", "de.5mountain_crete"], [NZ5], "GB", 1, sfx=["stamp", "radio"]),
    ]


def build_pockets():
    rows = [
        ("retimo_airborne", "雷西姆诺孤立空降群", at(20, "18:00"), at(29, "18:00"), "cr_perivolia_east", "relieved", ["de.retimo_crete"], "多日未能夺取机场；最后由西部地面部队接通。"),
        ("heraklion_airborne", "伊拉克利翁孤立空降群", at(20, "18:00"), at(29), [25.101, 35.323], "relieved", ["de.heraklion_crete"], "以多个分散据点显示，港口与机场在守军海撤后收束。"),
        ("retimo_garrison", "雷西姆诺被隔离守军", at(28), at(30), "cr_retimo_airfield", "surrendered", ["au.retimo_crete", "gr.retimo_crete"], "未获得有效南撤指示；多数守军投降，部分人员进入山区。"),
        ("sfakia_remnant", "斯法基亚残留部队", at(30), at("1941-06-01"), "cr_sfakia", "surrendered", [], "表示未能海撤的残部，不将已撤离的澳新旅重复计入俘虏。"),
    ]
    return [{"id": "p.cr_" + p, "name": {"zh": n}, "start": a, "end": b, "anchor": "@" + ll if isinstance(ll, str) else ll,
             "fate": f, "units": units, "note": note, "sources": [US, AWM, NZ4, NZ5]}
            for p, n, a, b, ll, f, units, note in rows]


def build_equipment():
    rows = [
        ("ju52", "DE", "Ju 52/3m运输机", "transport", "三发运输机承担伞兵投送与机场空运任务。马莱迈开放后，它将山地部队和重武器送上岛，但拥挤机场、防空射击与受损机体造成持续损耗。作为运输装备列出，数量不与作战飞机合并。"),
        ("dfs230", "DE", "DFS 230滑翔机", "glider", "突击滑翔机将少量部队送到机场与防区附近，依靠牵引机到达目标上空。其低噪声进场不能消除守军火力威胁，许多滑翔机在克里特降落时被击毁或迫降，不能作为地面车辆沿道路前进。"),
        ("kar98", "DE", "Kar 98k步枪", "small_arms", "德军伞兵和山地步兵常用的栓动步枪。空降武器箱能否顺利回收影响首批部队的战斗能力；山地增援携带步兵武器与补给后，德军才获得更稳定的地面作战能力。"),
        ("mp40", "DE", "MP 40冲锋枪", "small_arms", "部分德国突击和空降人员携带的冲锋枪，适用于村落、机场设施和近距离战斗。它是部队装备的代表，不表示所有伞兵均使用同一种武器，也不承担对守军重装备的替代作用。"),
        ("lee_enfield", "GB", "Lee–Enfield步枪", "small_arms", "英国及英联邦守军普遍使用的步枪。澳新步兵在机场防御、加拉塔斯反攻和山区后卫战中依靠步枪、轻机枪与少量炮火作战；撤离过程中可以带走轻武器，较重装备往往被留下。"),
        ("bren", "GB", "Bren轻机枪", "small_arms", "英联邦步兵班的重要支援武器，可由步兵携行进入山地和村庄阵地。守军利用掩蔽地形射击降落中的伞兵，但在补给受阻、人员伤亡和持续空袭下，单靠轻机枪无法维持整岛防御。"),
        ("phoebe", "GB", "HMS Phoebe巡洋舰", "ship", "皇家海军巡洋舰参加克里特周边海上行动，并在最后一夜撤离中返回斯法基亚接走守军。舰艇的主要作用是巡逻、拦截和运输；航路以海域示意呈现，赴亚历山大目的地在图幅以外。"),
    ]
    out = [{"id": "cr_" + q, "side": s, "name": {"zh": n}, "class": c, "desc": d, "sources": [US, AWM, NAVY]}
           for q, s, n, c, d in rows]
    out[0]["photo"] = {"commons": PHOTO["maleme"], "caption": "马莱迈机场上的Ju 52运输机，1941年5月。"}
    out[0]["sources"] = [US, AWM]
    out[1]["sources"] = [US, AWM]
    return out


def summary(name, commander, divisions, men=None, note="", killed="本章未统一汇总", wounded="本章未统一汇总", captured=None):
    losses = {"killed": killed, "wounded": wounded}
    if captured:
        losses["captured"] = captured
    return {"name": name, "commander": commander, "men": men, "divisions": divisions,
            "tanks": None, "aircraft": None, "guns": None, "losses": losses, "note": note}


def build_forces():
    sides = {
        "DE": summary("德国克里特入侵部队", "第11航空军施图登特；地面推进由林格尔组织",
                      "第7航空师、第5山地师及支援部队", 25000,
                      "约2.5万人是美陆军战史所列入侵编组估计，不是20日同时登岛人数；计划、投送与最终投入口径不同。"),
        "IT": summary("意大利锡蒂亚支队", "罗得岛出发的登陆支队", "岛东部海运登陆分遣队",
                      note="只表示5月28日的有限登陆行动，不重复计入此前整个希意战役兵力。"),
        "GB": summary("英国驻岛及皇家海军", "Creforce统一地面指挥；海军坎宁安", "第14旅、苏达守备及陆战队、地中海舰队",
                      note="美陆军估计英联邦驻岛总数约27,500；不是英国单国人数，未与澳新统计重复相加。"),
        "AU": summary("澳大利亚驻克里特部队", "第19旅维西；雷西姆诺坎贝尔", "第19旅主力及雷西姆诺、伊拉克利翁分遣队",
                      note="同一营原属旅与地区分遣队不重复累加；部分后卫撤出，部分守军被俘。"),
        "NZ": summary("新西兰克里特部队", "弗赖伯格；第2师帕蒂克", "第2师第4、第5旅及第10混合旅",
                      killed="671", wounded="伤员口径未单列", captured="约2,180",
                      note="损失取NZHistory战役总览；人数含整场岛上战役，不等同1日斯法基亚岸上人数。"),
        "GR": summary("希腊克里特守备部队", "Creforce与各当地防区", "各地希腊守军及克里特当地协同人员", 14000,
                      "约1.4万人取美陆军战史估计；其他官方史有不同口径，未据此推算正规师数。"),
    }
    return {"sides": sides, "byPhase": {"crete": sides}, "sources": [US, AWM, "cr_nz_overview", NZ4, NZ5, NAVY]}


ASSETS = [
    ("airdrop", PHOTO["airdrop"], "1941年5月20日德军空降克里特", ["e.cr_merkur"], "crete"),
    ("maleme-airfield", PHOTO["maleme"], "1941年5月马莱迈机场与Ju 52运输机", ["e.cr_mountain_airlift", "cr_ju52"], "crete"),
    ("ju52-burning", PHOTO["ju52"], "1941年5月克里特上空遭防空火力击中的Ju 52", ["e.cr_navy_air_losses"], "crete"),
    ("fortysecond-street", PHOTO["fortysecond"], "战时四十二街路牌，约1941年5月26日", ["e.cr_fortysecond_charge"], "crete"),
    ("crete-evacuation-tea", PHOTO["evac"], "撤出克里特后在埃及港口领取茶水的官兵", ["e.cr_heraklion_evacuated"], "crete"),
    ("crete-alexandria-arrival", PHOTO["arrival"], "1941年6月1日澳新军抵达亚历山大港", ["e.cr_last_evacuation", "e.cr_capitulation"], "crete"),
    ("greek-korce", "File:Greek Forces in Korce.JPG", "1940年11月希军在科尔察街道行进", ["科尔察", "1940-11-22"], "mainland"),
    ("italian-albania-december", "File:Italian soldiers in Albania, December 1940.jpg", "1940年12月阿尔巴尼亚的意大利士兵", ["冬季阿尔巴尼亚战线", "1940-12"], "mainland"),
    ("volos-air-attack", "File:Volos Italian air attack 1940 Nov 4.jpg", "1940年11月4日意大利空军拍摄的沃洛斯空袭", ["沃洛斯", "意大利空袭", "1940-11-04"], "mainland"),
    ("belgrade-damage", "File:Bundesarchiv Bild 141-1005, Belgrad, Zerstörungen.jpg", "1941年贝尔格莱德战后破坏，德国联邦档案", ["贝尔格莱德空袭", "1941-04-06"], "mainland"),
    ("athens-entry", "File:Bundesarchiv Bild 146-1979-123-32, Athen, Einmarsch deutscher Truppen.jpg", "1941年4月27日德国部队进入雅典", ["雅典", "1941-04-27"], "mainland"),
    ("greece-alexandria-arrival", "File:Troops evacuated from Greece arriving in Alexandria 7477380.jpg", "1941年4月28日，从希腊撤出的官兵抵达亚历山大", ["希腊大陆海撤", "1941-04-28"], "mainland"),
]

HISTORY_MAPS = [
    ("yugoslavia-1941.jpg", "The German Campaign in Yugoslavia (Operation 25)", 4),
    ("greece-1941.jpg", "The German Campaign in Greece (Operation MARITA)", 5),
    ("crete-1941.jpg", "The Seizure of Crete (Operation MERKUR)", 7),
]


def fetch(url, tries=3):
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "BalkansCampaign-1941/1.0 (educational; https://localhost/)"})
            # Python.org macOS interpreters can miss their optional cert install.
            # Use the system trust bundle while keeping certificate verification.
            bundle = Path("/etc/ssl/cert.pem")
            context = ssl.create_default_context(cafile=str(bundle)) if bundle.exists() else ssl.create_default_context()
            with urllib.request.urlopen(req, timeout=40, context=context) as r:
                return r.read()
        except Exception:
            if n == tries - 1:
                raise
            time.sleep(2 * (n + 1))


def plain(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", s or ""))).strip()


def fetch_assets():
    from PIL import Image
    params = {"action": "query", "format": "json", "formatversion": 2, "redirects": 1,
              "titles": "|".join(row[1] for row in ASSETS), "prop": "imageinfo",
              "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1200}
    info = json.loads(fetch("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    pages = {p["title"]: p for p in info.get("query", {}).get("pages", [])}
    index, rejected = {}, []
    for slug, commons, caption, related, chapter in ASSETS:
        page = pages.get(commons, {})
        ii = page.get("imageinfo", [{}])[0]
        md = ii.get("extmetadata", {})
        lic = plain(md.get("LicenseShortName", {}).get("value", ""))
        if not ii.get("url") or not (lic.lower().startswith(("public domain", "cc by", "cc0"))):
            rejected.append({"commons": commons, "reason": "Missing metadata or unsupported license", "license": lic})
            continue
        src = "photos/balkans/" + slug + ".webp"
        path = ROOT / "public" / src
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            # Some thumbnails have unavailable arbitrary sizes. Download the
            # original rather than keep an HTML error page with an image suffix.
            url = ii.get("thumburl") or ii["url"]
            time.sleep(1.1)
            raw = fetch(url)
            try:
                im = Image.open(io.BytesIO(raw))
                im.load()
            except Exception:
                time.sleep(1.1)
                raw = fetch(ii["url"])
                im = Image.open(io.BytesIO(raw))
                im.load()
            im = im.convert("RGB")
            if im.width > 1200:
                im.thumbnail((1200, 1800), Image.Resampling.LANCZOS)
            im.save(path, "WEBP", quality=88, method=6)
        with Image.open(path) as decoded:
            decoded.load()
            w, h = decoded.size
        artist = plain(md.get("Artist", {}).get("value", "")) or "Unknown author"
        artist = artist.replace("Unknown author Unknown author", "Unknown author")
        license_url = plain(md.get("LicenseUrl", {}).get("value", ""))
        if not license_url and lic.lower().startswith("public domain"):
            license_url = "https://creativecommons.org/publicdomain/mark/1.0/"
        index[commons] = {
            "commons": commons, "src": src, "w": w, "h": h,
            "title": caption, "caption": caption, "author": artist,
            "license": lic, "licenseUrl": license_url,
            "sourceUrl": ii.get("descriptionurl", "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(commons)),
            "originalUrl": ii["url"], "archiveDate": plain(md.get("DateTimeOriginal", {}).get("value", "")),
            "adaptation": "Resized if necessary and converted to WebP; no crop or content changes",
            "chapter": chapter, "related": related,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        print(f"photo {slug}: {w} x {h}, {lic}", flush=True)
    maps = []
    for filename, title, number in HISTORY_MAPS:
        url = f"https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/maps/Campaigns-{number}.jpg"
        dst = ROOT / "public/history" / filename
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.exists():
            dst.write_bytes(fetch(url))
        with Image.open(dst) as im:
            im.load()
            w, h = im.size
        maps.append({"src": "history/" + filename, "title": title, "author": "U.S. Army Center of Military History",
                     "year": 1953, "license": "Public domain — U.S. federal government work (United States)",
                     "licenseUrl": "https://www.copyright.gov/history/copyright-exhibit/lifecycle/",
                     "sourceUrl": "https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/index.html",
                     "originalUrl": url, "w": w, "h": h,
                     "sha256": hashlib.sha256(dst.read_bytes()).hexdigest()})
        print(f"map {filename}: {w} x {h}", flush=True)
    write(".work/crete-assets.json", {
        "photos": index, "maps": maps, "rejected": rejected,
        "eventPhotos": {e["id"]: e["photo"] for e in build_events() if "photo" in e},
        "mainlandCandidates": [{"commons": c, "caption": caption, "match": related}
                               for _, c, caption, related, chapter in ASSETS if chapter == "mainland" and c in index],
        "externalMedia": [{"title": "Return from Crete (1941)", "language": "English",
                           "author": "New Zealand National Film Unit", "year": 1941,
                           "url": "https://www.nzonscreen.com/videos/return-from-crete-1941/",
                           "note": "Original archive film external link; no generated narration or bundled film"}],
    })
    # Check that every event and equipment photo can resolve through the manifest.
    missing = [c for c in PHOTO.values() if c not in index]
    if missing:
        raise RuntimeError("Required Crete images missing: " + ", ".join(missing))


def check(places, units, routes, events, fronts, sources):
    place_ids = {p["id"] for p in places}
    unit_ids = {u["id"] for u in units}
    source_ids = {s["id"] for s in sources}
    if len(place_ids) != len(places) or len(unit_ids) != len(units):
        raise ValueError("duplicate ID")
    for p in places:
        x, y = p["pos"]
        if not (12.5 <= x <= 29.5 and 34.5 <= y <= 48):
            raise ValueError("Place outside map: " + p["id"])
    def ref(p):
        if isinstance(p, str) and p[1:] not in place_ids:
            raise ValueError("Unknown place " + p)
        if isinstance(p, list):
            x, y = p
            if not (12.5 <= x <= 29.5 and 34.5 <= y <= 48):
                raise ValueError("Position outside map")
    for u in units:
        if u["parent"]:
            parent = next(p for p in units if p["id"] == u["parent"])
            if u["side"] != parent["side"]:
                raise ValueError("Cross-national OOB parent")
        dates = [p["at"] for p in u["track"]]
        if dates != sorted(dates):
            raise ValueError("Unsorted unit track " + u["id"])
        for p in u["track"]:
            ref(p["pos"])
    for r in routes:
        if r["unit"] not in unit_ids:
            raise ValueError("Unknown route unit")
        if [p["at"] for p in r["waypoints"]] != sorted(p["at"] for p in r["waypoints"]):
            raise ValueError("Unsorted route")
        for p in r["waypoints"]:
            ref(p["pos"])
    for e in events:
        ref(e["place"])
        if any(u not in unit_ids for u in e["units"]):
            raise ValueError("Unknown event unit")
    for item in units + routes + events + fronts:
        if any(s not in source_ids for s in item["sources"]):
            raise ValueError("Unknown source")
    if fronts[0]["at"] != "1941-05-20T07:59" or fronts[0]["DE"]:
        raise ValueError("Axis must have no Crete control before airborne assault")
    print(f"Checked {len(places)} places, {len(units)} units, {len(routes)} routes, {len(events)} events, {len(fronts)} island frames.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", action="store_true", help="Fetch/decode licensed photos and original U.S. Army maps")
    args = parser.parse_args()
    sources = build_sources()
    places = build_places()
    units = build_units()
    for u in units:
        if u["type"] == "airborne":
            u["equipment"] = [{"id": "cr_kar98"}, {"id": "cr_mp40"}]
        elif u["id"] == "de.5mountain_crete":
            u["equipment"] = [{"id": "cr_kar98"}]
        elif u["side"] in ("GB", "AU", "NZ") and u["type"] in ("infantry", "marine"):
            u["equipment"] = [{"id": "cr_lee_enfield"}, {"id": "cr_bren"}]
    next(u for u in units if u["id"] == "de.xi_air_crete")["equipment"] = [{"id": "cr_ju52"}, {"id": "cr_dfs230"}]
    routes = build_routes(units)
    events = build_events()
    fronts = build_fronts()
    check(places, units, routes, events, fronts, sources)
    write("src/data/sources/crete.json", sources)
    write("src/data/gazetteer/crete.json", places)
    write("src/data/oob/crete.json", units)
    write("src/data/routes/crete.json", routes)
    write("src/data/fragments/crete.json", {
        "events": events, "pockets": build_pockets(), "equipment": build_equipment(), "forces": build_forces(),
        "notes": {"fronts": "Crete-only DE polygons; assembler merges unchanged final mainland control",
                  "precision": "Documented first drop uses minute precision; other events are day-level, including the evening Galatas counterattack",
                  "archiveFilm": "https://www.nzonscreen.com/videos/return-from-crete-1941/"},
    })
    # Remove only this generator's former names; never remove mainland frames.
    for former in (ROOT / "src/data/fronts").glob("*_crete.json"):
        former.unlink()
    for frame in fronts:
        write("src/data/fronts/" + frame["at"].replace(":", "-") + ".json", frame)
    if args.assets:
        fetch_assets()


if __name__ == "__main__":
    main()
