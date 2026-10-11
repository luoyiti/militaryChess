#!/usr/bin/env python3
"""巴尔干大陆战役：以官方战史整理的可重复数据生成器。

在本目录运行 .venv/bin/python scripts/campaign/build_mainland.py。
需要地理管线先生成 .work/a/countries1939.geojson；只写本代理负责的数据。
部署、战线是战区尺度示意，绝不把地点中心当作精确师部坐标。
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from shapely.geometry import Polygon, MultiPolygon, GeometryCollection, shape, mapping, box
from shapely.ops import unary_union
from shapely.validation import explain_validity
from shapely import make_valid, set_precision

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
US1, US2, US3 = "land_us_context", "land_us_yugoslavia", "land_us_greece"
G0, GK, GH, GS = "land_greek_defence", "land_greek_korce", "land_greek_himara", "land_greek_spring"
AWM = "land_awm_greece"

SOURCES = [
    {"id": US1, "title": "The German Campaigns in the Balkans (Spring 1941), Part I", "author": "George E. Blau / US Department of the Army", "year": 1953, "url": "https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-1.html", "license": "US government public domain; HyperWar transcription"},
    {"id": US2, "title": "The German Campaigns in the Balkans (Spring 1941), Part II: Yugoslavia", "author": "US Department of the Army", "year": 1953, "url": "https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-2.html", "license": "US government public domain; based mainly on German records"},
    {"id": US3, "title": "The German Campaigns in the Balkans (Spring 1941), Part III: Greece", "author": "US Department of the Army", "year": 1953, "url": "https://www.ibiblio.org/hyperwar/ETO/East/Balkans/Campaigns/Campaigns-3.html", "license": "US government public domain; cross-checked against Allied official history"},
    {"id": G0, "title": "Pindus–Elaia–Kalamas, 28 October–13 November 1940", "author": "Hellenic Army History Directorate", "year": 2020, "url": "https://stelexi.army.gr/istoriko-gegonos/machi-pindou-elaias-kalama-28-oktovriou-13-noemvriou-1940/", "license": "Official history; factual paraphrase"},
    {"id": GK, "title": "The liberation of Korytsa and its military administration", "author": "Hellenic Army History Directorate", "url": "https://stelexi.army.gr/wp-content/uploads/2022/10/h_maxh_apeleytherosh_korytsas_anoterh_strat_dioikhsh.pdf", "license": "Official history; factual paraphrase"},
    {"id": GH, "title": "Battle of Himara, 20–22 December 1940", "author": "Hellenic Army History Directorate / Marina Tsirtsikou", "year": 2021, "url": "https://stelexi.army.gr/istoriko-gegonos/i-machi-tis-cheimarras-20-22-dekemvriou-1940/", "license": "Official history; factual paraphrase"},
    {"id": GS, "title": "Italian spring offensive and the resistance of the Greek Army", "author": "Hellenic Army History Directorate", "url": "https://stelexi.army.gr/istoriko-gegonos/earini-epithesi-italon-epiki-antistasi-tou-ellinikou-stratou-2/", "license": "Official history; factual paraphrase"},
    {"id": AWM, "title": "Australia in the War of 1939–1945, Series 1, Volume II: Greece, Crete and Syria", "author": "Gavin Long / Australian War Memorial", "year": 1953, "url": "https://www.awm.gov.au/collection/C1417307", "license": "Official history; factual paraphrase"},
    {"id": "land_borders", "title": "1940 campaign geography: Natural Earth coastline and reconstructed state borders", "author": "Natural Earth; local historical boundary reconstruction", "url": "https://www.naturalearthdata.com/", "license": "Public domain; control lines are a schematic historical reconstruction"},
]


def dump(rel: str, value):
    p = DATA / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def at(date: str, time="12:00"):
    return date if "T" in date else f"{date}T{time}"


PLACES = []


def place(i, zh, orig, lon, lat, country, rank=3, kind="town"):
    PLACES.append({"id": i, "zh": zh, "orig": orig, "pos": [lon, lat], "kind": kind, "rank": rank, "country1939": country})


# 1940–41 原名；中文版保留今天常见的译名，异名写进原文便于检索。
for row in [
    ("tirana", "地拉那", "Tiranë", 19.82, 41.33, "AL", 1, "capital"),
    ("durres", "都拉斯", "Durrës / Durazzo", 19.45, 41.32, "AL", 2, "port"),
    ("shkoder", "斯库台", "Shkodër / Scutari", 19.51, 42.07, "AL", 2, "city"),
    ("vlore", "发罗拉", "Vlorë / Valona", 19.49, 40.47, "AL", 2, "port"),
    ("berat", "培拉特", "Berat", 19.95, 40.71, "AL", 3, "town"),
    ("elbasan", "爱尔巴桑", "Elbasan", 20.08, 41.11, "AL", 3, "town"),
    ("korce", "科尔察", "Korçë / Korytsa", 20.78, 40.62, "AL", 2, "city"),
    ("pogradec", "波格拉德茨", "Pogradec", 20.65, 40.90, "AL", 3, "town"),
    ("erseke", "埃尔塞克", "Ersekë", 20.68, 40.33, "AL", 3, "town"),
    ("leskovik", "莱斯科维克", "Leskovik", 20.60, 40.15, "AL", 3, "town"),
    ("permet", "佩尔梅特", "Përmet", 20.35, 40.23, "AL", 3, "town"),
    ("kelcyre", "克利苏拉", "Këlcyrë / Klisoura", 20.19, 40.31, "AL", 3, "town"),
    ("tepelene", "特佩莱讷", "Tepelenë", 20.02, 40.30, "AL", 3, "town"),
    ("gjirokaster", "吉诺卡斯特", "Gjirokastër / Argyrokastro", 20.14, 40.08, "AL", 3, "town"),
    ("delvine", "德尔维纳", "Delvinë / Delvino", 20.10, 39.95, "AL", 3, "town"),
    ("sarande", "萨兰达", "Sarandë / Santi Quaranta", 20.01, 39.87, "AL", 3, "port"),
    ("himare", "希马拉", "Himarë / Cheimarra", 19.74, 40.10, "AL", 3, "town"),
    ("kuci", "库奇山口", "Kuç / Koutsi", 19.82, 40.18, "AL", 4, "crossing"),
    ("hill731", "731高地一带", "Height 731 sector", 20.22, 40.38, "AL", 4, "region"),
    ("athens", "雅典", "Athína / Athens", 23.73, 37.98, "GR", 1, "capital"),
    ("piraeus", "比雷埃夫斯", "Peiraiás / Piraeus", 23.64, 37.94, "GR", 2, "port"),
    ("ioannina", "约阿尼纳", "Ioánnina", 20.85, 39.67, "GR", 2, "city"),
    ("kalpaki", "卡尔帕基", "Kalpáki / Elaia", 20.62, 39.89, "GR", 3, "fort"),
    ("konitsa", "科尼察", "Kónitsa", 20.75, 40.05, "GR", 3, "town"),
    ("samarina", "萨马里纳", "Samarína", 21.02, 40.10, "GR", 4, "village"),
    ("distrato", "迪斯特拉托", "Dístrato", 21.02, 40.02, "GR", 4, "village"),
    ("eptachori", "埃普塔霍里", "Eptachóri", 20.98, 40.22, "GR", 4, "village"),
    ("metsovo", "梅措沃", "Métsovo", 21.18, 39.77, "GR", 3, "town"),
    ("kastoria", "卡斯托里亚", "Kastoriá", 21.27, 40.52, "GR", 3, "town"),
    ("florina", "弗洛里纳", "Flórina", 21.41, 40.78, "GR", 3, "town"),
    ("vevi", "韦维", "Vévi / Klidi", 21.62, 40.50, "GR", 4, "crossing"),
    ("kleisoura", "克莱苏拉山口", "Kleisoura, Macedonia", 21.47, 40.53, "GR", 4, "crossing"),
    ("grevena", "格雷韦纳", "Grevená", 21.43, 40.08, "GR", 3, "town"),
    ("kozani", "科扎尼", "Kozáni", 21.79, 40.30, "GR", 2, "city"),
    ("veria", "韦里亚", "Véroia", 22.20, 40.52, "GR", 3, "town"),
    ("edessa", "埃德萨", "Édessa", 22.05, 40.80, "GR", 3, "town"),
    ("servia", "塞尔维亚山口", "Sérvia", 22.0, 40.18, "GR", 4, "crossing"),
    ("katerini", "卡泰里尼", "Kateríni", 22.50, 40.27, "GR", 3, "town"),
    ("platamon", "普拉塔蒙", "Platamón", 22.62, 39.99, "GR", 4, "crossing"),
    ("tempe", "坦佩峡谷", "Témpi / Pinios Gorge", 22.51, 39.86, "GR", 4, "crossing"),
    ("elassona", "埃拉索纳", "Elassóna", 22.19, 39.89, "GR", 3, "town"),
    ("larisa", "拉里萨", "Lárisa", 22.42, 39.64, "GR", 2, "city"),
    ("kalabaka", "卡兰巴卡", "Kalampáka", 21.63, 39.71, "GR", 3, "town"),
    ("volos", "沃洛斯", "Vólos", 22.95, 39.36, "GR", 2, "port"),
    ("lamia", "拉米亚", "Lamía", 22.43, 38.90, "GR", 3, "town"),
    ("thermopylae", "温泉关", "Thermopýlai", 22.54, 38.79, "GR", 3, "crossing"),
    ("thebes", "底比斯", "Thíva / Thebes", 23.32, 38.32, "GR", 3, "town"),
    ("rafina", "拉菲纳", "Rafína", 24.01, 38.02, "GR", 3, "port"),
    ("megara", "梅加拉", "Mégara", 23.35, 37.99, "GR", 3, "town"),
    ("corinth", "科林斯", "Kórinthos", 22.93, 37.94, "GR", 2, "crossing"),
    ("argos", "阿尔戈斯", "Árgos", 22.72, 37.63, "GR", 3, "town"),
    ("nafplio", "纳夫普利翁", "Náfplio", 22.81, 37.57, "GR", 3, "port"),
    ("tolon", "托隆", "Tolón", 22.86, 37.52, "GR", 3, "port"),
    ("kalamata", "卡拉马塔", "Kalamáta", 22.11, 37.04, "GR", 2, "port"),
    ("monemvasia", "莫奈姆瓦夏", "Monemvasiá", 23.05, 36.69, "GR", 3, "port"),
    ("githion", "吉雄", "Gýtheio", 22.56, 36.76, "GR", 3, "port"),
    ("patras", "帕特雷", "Pátra / Patras", 21.73, 38.25, "GR", 3, "port"),
    ("pyrgos", "皮尔戈斯", "Pýrgos", 21.44, 37.67, "GR", 3, "town"),
    ("igoumenitsa", "伊古迈尼察", "Igoumenítsa", 20.27, 39.50, "GR", 3, "port"),
    ("preveza", "普雷韦扎", "Préveza", 20.75, 38.96, "GR", 3, "port"),
    ("arta", "阿尔塔", "Árta", 20.99, 39.16, "GR", 3, "town"),
    ("thessaloniki", "萨洛尼卡", "Thessaloníki / Salonika", 22.94, 40.64, "GR", 2, "city"),
    ("doiran", "多伊兰湖一带", "Doïráni", 22.73, 41.18, "GR", 3, "region"),
    ("rupel", "鲁佩尔要塞", "Roupel", 23.37, 41.35, "GR", 3, "fort"),
    ("serres", "塞雷斯", "Sérres", 23.55, 41.08, "GR", 3, "town"),
    ("drama", "德拉马", "Dráma", 24.15, 41.15, "GR", 3, "town"),
    ("xanthi", "克桑西", "Xánthi", 24.89, 41.14, "GR", 3, "town"),
    ("komotini", "科莫蒂尼", "Komotiní", 25.40, 41.12, "GR", 3, "town"),
    ("alexandroupoli", "亚历山德鲁波利", "Alexandroúpoli", 25.87, 40.85, "GR", 3, "port"),
    ("belgrade", "贝尔格莱德", "Beograd", 20.46, 44.82, "YU", 1, "capital"),
    ("ljubljana", "卢布尔雅那", "Ljubljana", 14.51, 46.06, "YU", 2, "city"),
    ("maribor", "马里博尔", "Maribor", 15.65, 46.55, "YU", 3, "town"),
    ("zagreb", "萨格勒布", "Zagreb", 15.98, 45.81, "YU", 2, "city"),
    ("varazdin", "瓦拉日丁", "Varaždin", 16.34, 46.31, "YU", 3, "town"),
    ("koprivnica", "科普里夫尼察", "Koprivnica", 16.83, 46.16, "YU", 3, "town"),
    ("bjelovar", "别洛瓦尔", "Bjelovar", 16.85, 45.90, "YU", 3, "town"),
    ("osijek", "奥西耶克", "Osijek", 18.70, 45.56, "YU", 3, "town"),
    ("novisad", "诺维萨德", "Novi Sad", 19.84, 45.25, "YU", 3, "town"),
    ("subotica", "苏博蒂察", "Subotica", 19.67, 46.10, "YU", 3, "town"),
    ("pancevo", "潘切沃", "Pančevo", 20.64, 44.87, "YU", 3, "town"),
    ("vrsac", "弗尔沙茨", "Vršac", 21.30, 45.12, "YU", 3, "town"),
    ("sarajevo", "萨拉热窝", "Sarajevo", 18.41, 43.86, "YU", 2, "city"),
    ("split", "斯普利特", "Split", 16.44, 43.51, "YU", 3, "port"),
    ("dubrovnik", "杜布罗夫尼克", "Dubrovnik", 18.09, 42.65, "YU", 3, "port"),
    ("podgorica", "波德戈里察", "Podgorica", 19.26, 42.44, "YU", 3, "town"),
    ("prizren", "普里兹伦", "Prizren", 20.74, 42.22, "YU", 3, "town"),
    ("skopje", "斯科普里", "Skoplje / Skopje", 21.43, 42.00, "YU", 2, "city"),
    ("kumanovo", "库马诺沃", "Kumanovo", 21.71, 42.13, "YU", 3, "town"),
    ("bitola", "比托拉", "Bitolj / Monastir", 21.33, 41.03, "YU", 3, "town"),
    ("ohrid", "奥赫里德", "Ohrid", 20.80, 41.11, "YU", 3, "town"),
    ("nis", "尼什", "Niš", 21.90, 43.32, "YU", 2, "city"),
    ("pirot", "皮罗特", "Pirot", 22.59, 43.15, "YU", 3, "town"),
    ("kragujevac", "克拉古耶瓦茨", "Kragujevac", 20.91, 44.01, "YU", 3, "town"),
    ("kraljevo", "克拉列沃", "Kraljevo", 20.69, 43.72, "YU", 3, "town"),
    ("leskovac", "莱斯科瓦茨", "Leskovac", 21.95, 43.0, "YU", 3, "town"),
    ("strumica", "斯特鲁米察", "Strumica", 22.64, 41.44, "YU", 3, "town"),
    ("stip", "什蒂普", "Štip", 22.19, 41.74, "YU", 3, "town"),
    ("veles", "韦莱斯", "Veles", 21.78, 41.72, "YU", 3, "town"),
    ("graz", "格拉茨", "Graz", 15.44, 47.07, "DE", 3, "town"),
    ("klagenfurt", "克拉根福", "Klagenfurt", 14.31, 46.62, "DE", 3, "town"),
    ("rijeka", "阜姆", "Fiume / Rijeka", 14.44, 45.33, "IT", 3, "port"),
    ("budapest", "布达佩斯", "Budapest", 19.04, 47.50, "HU", 1, "capital"),
    ("nagykanizsa", "瑙吉考尼饶", "Nagykanizsa", 16.99, 46.45, "HU", 3, "town"),
    ("timisoara", "蒂米什瓦拉", "Timișoara", 21.23, 45.75, "RO", 2, "city"),
    ("sofia", "索非亚", "Sofiya", 23.32, 42.70, "BG", 1, "capital"),
    ("kyustendil", "丘斯滕迪尔", "Kyustendil", 22.69, 42.28, "BG", 3, "town"),
    ("petrich", "佩特里奇", "Petrich", 23.20, 41.40, "BG", 3, "town"),
    ("blagoevgrad", "上朱马亚", "Gorna Dzhumaya", 23.09, 42.02, "BG", 3, "town"),
    ("plovdiv", "普罗夫迪夫", "Plovdiv", 24.75, 42.14, "BG", 3, "town"),
    ("svilengrad", "斯维伦格勒", "Svilengrad", 26.20, 41.77, "BG", 3, "town"),
    ("matapan", "马塔潘角海域", "Cape Matapan waters", 22.5, 35.20, "GR", 3, "region"),
]:
    place(*row)

POS = {p["id"]: p["pos"] for p in PLACES}
UNITS, ROUTES = [], []


def pt(date, loc, status=None, movement=None, note=None):
    p = {"at": at(date), "pos": "@" + loc if isinstance(loc, str) else loc}
    if status: p["status"] = status
    if movement: p["movement"] = movement
    if note: p["note"] = note
    return p


def track(*rows):
    return [pt(*r) for r in rows]


def add_unit(i, side, echelon, typ, parent, zh, orig, short, rows, history, sources, model=None, commander=None, start="1940-10-28", end="1941-05-19T23:59", conf="medium", strength=None, equipment=None):
    obj = {"id": i, "side": side, "echelon": echelon, "type": typ, "parent": parent,
           "name": {"zh": zh, "orig": orig, "short": short}, "track": rows,
           "active": {"from": at(start, "00:00"), "to": at(end, "23:59")},
           "history": history, "sources": sources, "confidence": conf}
    if model: obj["model"] = model
    if commander: obj["commander"] = {"zh": commander[0], "orig": commander[1]}
    if strength: obj["strength"] = strength
    if equipment: obj["equipment"] = [{"id": e} for e in equipment]
    UNITS.append(obj)
    return obj


def add_route(i, side, unit, label, rows, style="main", width=12, movement="land", until=None, sources=None):
    obj = {"id": "r." + i, "side": side, "unit": unit, "label": label, "style": style,
           "widthKm": width, "movement": movement,
           "waypoints": [{"at": p["at"], "pos": p["pos"]} for p in rows],
           "until": at(until or rows[-1]["at"]), "sources": sources or [US3], "confidence": "medium"}
    ROUTES.append(obj)


def make_units():
    # 意大利：军队所属以主要作战阶段为准；Julia最初是独立进攻纵队。
    add_unit("it.albania", "IT", "armygroup", "hq", None, "阿尔巴尼亚战区司令部", "Comando Superiore Truppe Albania", "AL司", [], "负责从意占阿尔巴尼亚发动战争。普拉斯卡之后由索杜、卡瓦莱罗先后统筹；11月增援与重新划分第9、11集团军，也未能消除山区运输和协同困难。", [G0, GK, GS])
    add_unit("it.9a", "IT", "army", "hq", "it.albania", "第9集团军", "9ª Armata", "9A", track(("1940-11-09", "korce"), ("1940-11-23", "elbasan", "withdrawing"), ("1941-03-09", "elbasan", "active"), ("1941-04-23", "korce")), "11月增援重组后负责科尔察和阿尔巴尼亚东北方向。科尔察失守后退向爱尔巴桑、波格拉德茨以北，直至1941年4月希军退却才恢复南下。", [GK, US3], start="1940-11-09")
    add_unit("it.11a", "IT", "army", "hq", "it.albania", "第11集团军", "11ª Armata", "11A", track(("1940-11-09", "gjirokaster"), ("1940-12-08", "tepelene", "withdrawing"), ("1941-03-09", "tepelene", "engaged"), ("1941-04-20", "gjirokaster"), ("1941-04-27", "ioannina")), "格洛索指挥的第11集团军承担伊庇鲁斯和阿尔巴尼亚南部战线。经历希军反攻与冬季相持，春季攻势仍未突破，最后在德国介入后向约阿尼纳推进。", [G0, GH, GS, US3], commander=("卡洛·格洛索", "Carlo Geloso"), start="1940-11-09")
    xxv = track(("1940-10-28", "gjirokaster"), ("1940-11-02", "kalpaki", "engaged"), ("1940-11-10", "gjirokaster", "withdrawing"), ("1940-12-08", "tepelene", "engaged"), ("1941-03-16", "tepelene"), ("1941-04-25", "ioannina"))
    add_unit("it.xxv", "IT", "corps", "hq", "it.albania", "第25军·查穆里亚", "XXV Corpo d'Armata Ciamuria", "XXV", xxv, "开局以费拉拉、锡耶纳和半人马师攻击卡尔帕基—卡拉马斯防线。希腊第8师的防御与当地地形使快速进占约阿尼纳的计划失败；编制后来纳入第11集团军方向。", [G0, GH], commander=("卡洛·罗西", "Carlo Rossi"), strength={"men": 42000})
    xxvi = track(("1940-10-28", "korce"), ("1940-11-16", "korce", "engaged"), ("1940-11-23", "pogradec", "withdrawing"), ("1940-12-02", "elbasan"), ("1941-03-16", "elbasan", "active"), ("1941-04-24", "korce"))
    add_unit("it.xxvi", "IT", "corps", "hq", "it.albania", "第26军", "XXVI Corpo d'Armata", "XXVI", xxvi, "初期配置帕尔马、皮埃蒙特、威尼斯及随后赶到的阿雷佐师。反攻期间在莫拉瓦山地与希军第3军交战，丢失科尔察并退往奥赫里德湖西侧和爱尔巴桑。", [GK], strength={"men": 44000})
    add_unit("it.viii", "IT", "corps", "hq", "it.11a", "第8军·春季攻势", "VIII Corpo d'Armata", "VIII", track(("1941-03-08", "tepelene"), ("1941-03-09", "hill731", "engaged"), ("1941-03-16", "tepelene", "active"), ("1941-04-23", "permet")), "甘巴拉指挥第8军，在德斯尼察谷地集中攻势，企图打穿希腊第2军的防御。连续炮火和步兵攻击未能取得决定性突破；师级标记表示攻击地带而非精确驻地。", [GS], commander=("加斯托内·甘巴拉", "Gastone Gambara"), start="1941-03-08")
    italian_divs = [
        ("ferrara", "23", "费拉拉", "Ferrara", "it.xxv", "infantry", track(("1940-10-28", "gjirokaster"), ("1940-11-02", "kalpaki", "engaged"), ("1940-11-09", "konitsa", "withdrawing"), ("1940-11-22", "permet"), ("1941-03-09", "tepelene", "engaged"), ("1941-04-23", "konitsa")), "在伊庇鲁斯主攻轴线与半人马师配合。卡尔帕基阵地没有被正面突击夺取，11月转为边打边退，冬季在阿尔巴尼亚南部坚持。", [G0, GS]),
        ("siena", "51", "锡耶纳", "Siena", "it.xxv", "infantry", track(("1940-10-28", "delvine"), ("1940-11-03", "igoumenitsa", "engaged"), ("1940-11-14", "delvine", "withdrawing"), ("1940-12-06", "sarande", "withdrawing"), ("1940-12-22", "himare", "engaged"), ("1941-04-23", "sarande")), "向菲利亚泰斯和海岸方向推进，随后在希腊反攻中后撤。海岸线被压向希马拉以北，山区道路和天气限制了意军重新掌握主动。", [G0, GH]),
        ("centauro", "131", "半人马装甲", "Centauro", "it.xxv", "armor", track(("1940-10-28", "gjirokaster"), ("1940-11-04", "kalpaki", "engaged"), ("1940-11-10", "gjirokaster", "withdrawing"), ("1941-01-06", "kelcyre", "engaged"), ("1941-01-11", "tepelene"), ("1941-04-23", "konitsa")), "以轻型履带坦克为主的装甲师分队支援费拉拉师。泥泞、狭窄山路与反坦克防御削弱了装甲优势；这里描绘主作战方向，不代表全师始终集中。", [G0, GS]),
        ("julia", "3", "朱利亚山地", "Julia", "it.albania", "mountain", track(("1940-10-28", "leskovik"), ("1940-11-02", "samarina", "engaged"), ("1940-11-04", "distrato", "encircled"), ("1940-11-08", "konitsa", "withdrawing"), ("1940-11-14", "leskovik"), ("1941-01-06", "kelcyre", "engaged"), ("1941-01-11", "tepelene"), ("1941-04-22", "permet")), "初期独立纵队企图穿越品都斯直取梅措沃、切断希军。补给与两翼暴露导致撤退；巴里师接应使部分队伍脱险。该师后来继续参战，不能将品都斯失利写成全师歼灭。", [G0, GK, GS]),
        ("parma", "49", "帕尔马", "Parma", "it.xxvi", "infantry", track(("1940-10-28", "korce"), ("1940-11-14", [20.93, 40.63], "engaged"), ("1940-11-22", "pogradec", "withdrawing"), ("1940-12-02", "elbasan"), ("1941-04-23", "korce")), "开战时位于科尔察以东，守备通往卡斯托里亚和弗洛里纳的方向。希军在莫拉瓦山地突破后，帕尔马师与相邻意军退往阿尔巴尼亚内部。", [GK]),
        ("piemonte", "29", "皮埃蒙特", "Piemonte", "it.xxvi", "infantry", track(("1940-10-28", [20.62, 40.62]), ("1940-11-15", "korce", "engaged"), ("1940-11-23", "pogradec", "withdrawing"), ("1940-12-02", "elbasan"), ("1941-04-23", "korce")), "开局部署在科尔察西侧，隶属第26军。科尔察撤退后在阿尔巴尼亚中部重整。所示部队位置以战区方向为准，不能用于推断某日具体师部。", [GK]),
        ("venezia", "19", "威尼斯", "Venezia", "it.xxvi", "infantry", track(("1940-10-28", "elbasan"), ("1940-11-14", "pogradec", "engaged"), ("1940-11-30", [20.56, 41.03], "withdrawing"), ("1941-03-16", [20.56, 41.03], "active"), ("1941-04-23", "pogradec")), "起初分布于普雷斯帕湖至爱尔巴桑地带。希军反攻中承担科尔察和奥赫里德湖西岸方向的阻击；冬季战线稳定后继续守住北方运输通道。", [GK]),
        ("bari", "47", "巴里", "Bari", "it.albania", "infantry", track(("1940-11-03", "permet"), ("1940-11-06", "konitsa", "engaged"), ("1940-11-14", "leskovik", "withdrawing"), ("1941-01-11", "tepelene"), ("1941-04-23", "permet")), "增援品都斯，接应朱利亚师从迪斯特拉托一带退却。其加入避免部分意军被完全切断，但没有扭转开局失败；后续归属与驻地有调整。", [G0, GS]),
        ("lupi", "7", "托斯卡纳之狼", "Lupi di Toscana", "it.albania", "infantry", track(("1941-01-04", "tepelene"), ("1941-01-06", "kelcyre", "engaged"), ("1941-01-11", "tepelene", "withdrawing"), ("1941-03-16", "tepelene", "active"), ("1941-04-23", "permet")), "1941年1月投入克利苏拉方向的增援部队。抵达后即卷入希军进攻和艰难退却，冬季补给不良、道路泥泞和严寒进一步削弱战斗力。", [GS, US3]),
    ]
    for i, num, zh, orig, parent, typ, rows, hist, sources in italian_divs:
        add_unit("it."+i, "IT", "division", typ, parent, f"第{num}师·{zh}", f"{num}ª Divisione {orig}", num+"IT", rows, hist, sources, "inf_it", start=rows[0]["at"], equipment=["land_l3"] if typ=="armor" else None)
    add_unit("it.2a", "IT", "army", "hq", None, "第2集团军·南斯拉夫方向", "2ª Armata", "2A", track(("1941-04-06", "rijeka", "reserve"), ("1941-04-11", "ljubljana", "engaged"), ("1941-04-15", "split"), ("1941-04-18", "split", "active")), "从意大利和亚得里亚海北岸进攻。主力于4月11日向卢布尔雅那和达尔马提亚推进，与德国北路配合；此处与阿尔巴尼亚战区分别显示。", [US2], start="1941-04-06")
    # 希腊：第8师开局独立；军树以主要作战阶段归属组织，说明中标出调整。
    add_unit("gr.hq", "GR", "armygroup", "hq", None, "希腊总司令部", "Genikó Stratigeío", "希总", [], "帕帕戈斯统筹全国作战。秋冬优先击败意大利，德国介入后必须同时处理阿尔巴尼亚、马其顿与英联邦联合作战；各司令部并非全程保持同一种编制。", [G0, US3], commander=("亚历山德罗斯·帕帕戈斯", "Alexandros Papagos"), end="1941-04-23")
    add_unit("gr.westmac", "GR", "army", "hq", "gr.hq", "西马其顿军团区", "Tméma Stratiás Dytikís Makedonías", "西马", track(("1940-10-28", "kozani"), ("1940-11-14", "kastoria"), ("1940-11-23", "korce"), ("1941-03-16", "korce", "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "初期辖第2、第3军，负责西马其顿和科尔察方向。反攻后留在阿尔巴尼亚，1941年4月德军经比托拉与克莱苏拉截击其退路。军树展示主要阶段，不表示后期所有调动。", [GK, US3], commander=("约安尼斯·皮齐卡斯（初期）", "Ioannis Pitsikas"), end="1941-04-20")
    add_unit("gr.i", "GR", "corps", "hq", "gr.hq", "第1军", "A' Sóma Stratoú", "I", track(("1940-11-03", "ioannina"), ("1940-11-20", "gjirokaster", "engaged"), ("1940-12-08", "sarande"), ("1940-12-22", "himare", "engaged"), ("1941-03-16", "himare", "active"), ("1941-04-17", "gjirokaster", "withdrawing"), ("1941-04-23", "ioannina", "surrendered")), "动员后进入伊庇鲁斯并向海岸和德里诺河谷反攻。12月由第3、第4师等攻击希马拉和特佩莱讷方向，冬季仍面临坚固阵地与艰难补给。", [GH, G0, US3], start="1940-11-03", end="1941-04-23")
    add_unit("gr.ii", "GR", "corps", "hq", "gr.westmac", "第2军", "B' Sóma Stratoú", "II", track(("1940-10-28", "grevena"), ("1940-11-04", "samarina", "engaged"), ("1940-11-22", "permet"), ("1941-01-10", "kelcyre", "engaged"), ("1941-03-09", "hill731", "engaged"), ("1941-04-16", "permet", "withdrawing"), ("1941-04-23", "konitsa", "surrendered")), "初期参与品都斯增援，随后转向阿尔巴尼亚中部。1月夺取克利苏拉，3月以第1师为核心顶住意军春季攻势；军的指挥归属在战役中有调整。", [GK, GS, US3], commander=("迪米特里奥斯·帕帕多普洛斯（初期）", "Dimitrios Papadopoulos"), end="1941-04-23")
    add_unit("gr.iii", "GR", "corps", "hq", "gr.westmac", "第3军", "C' Sóma Stratoú", "III", track(("1940-10-28", "kastoria"), ("1940-11-14", [20.95, 40.62], "engaged"), ("1940-11-22", "korce"), ("1940-11-30", "pogradec"), ("1941-03-16", "pogradec", "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "楚拉科格鲁指挥第3军进行科尔察方向反攻，以山地迂回迫使意军撤出城市。1941年4月部队南撤，楚拉科格鲁在未获总司令批准的情况下与德国协商投降。", [GK, US3], commander=("乔治斯·楚拉科格鲁", "Georgios Tsolakoglou"), end="1941-04-20")
    add_unit("gr.eastmac", "GR", "army", "hq", "gr.hq", "东马其顿军团区", "Tméma Stratiás Anatolikís Makedonías", "东马", track(("1941-03-01", "thessaloniki"), ("1941-04-06", "serres", "engaged"), ("1941-04-09", "thessaloniki", "surrendered")), "巴科普洛斯统辖梅塔克萨斯防线和保加利亚边界部队。要塞正面抵抗顽强，但德军经南斯拉夫绕向萨洛尼卡，使该军团区被截断，4月9日接受投降。", [US3], commander=("康斯坦丁诺斯·巴科普洛斯", "Konstantinos Bakopoulos"), start="1941-03-01", end="1941-04-09", strength={"men": 70000})
    greek_divs = [
        ("8d", "8", "infantry", "gr.hq", track(("1940-10-28", "kalpaki", "engaged"), ("1940-11-13", "konitsa", "active"), ("1940-12-08", "gjirokaster"), ("1941-03-16", "tepelene", "engaged"), ("1941-04-19", "konitsa", "withdrawing"), ("1941-04-23", "ioannina", "surrendered")), "最初是独立加强师，保卫卡尔帕基—卡拉马斯主防线。卡齐米特罗斯利用地形组织防御，挡住意军主攻，为全国动员和反攻争取时间。", [G0, GH], "1940-10-28", "1941-04-23"),
        ("1d", "1", "infantry", "gr.ii", track(("1940-10-28", "grevena"), ("1940-11-01", "eptachori", "engaged"), ("1940-11-04", "samarina", "engaged"), ("1940-11-20", "leskovik"), ("1941-01-10", "kelcyre", "engaged"), ("1941-03-09", "hill731", "engaged"), ("1941-03-16", "hill731"), ("1941-04-19", "konitsa", "withdrawing"), ("1941-04-23", "ioannina", "surrendered")), "弗拉赫诺斯指挥第1师增援品都斯，反击朱利亚师。1941年3月在731高地和德斯尼察谷地地段成为抵挡意军春季攻势的核心部队。", [G0, GS], "1940-10-28", "1941-04-23"),
        ("3d", "3", "infantry", "gr.i", track(("1940-11-06", "ioannina"), ("1940-11-22", "delvine", "engaged"), ("1940-12-07", "sarande"), ("1940-12-20", "kuci", "engaged"), ("1940-12-22", "himare"), ("1941-03-16", "kuci", "active"), ("1941-04-18", "sarande", "withdrawing"), ("1941-04-23", "ioannina", "surrendered")), "隶属第1军，在沿海和库奇山口方向反攻。第3师的山地行动与希马拉作战密切相关；12月推进并未意味着发罗拉已经落入希军手中。", [GH], "1940-11-06", "1941-04-23"),
        ("4d", "4", "infantry", "gr.i", track(("1940-11-06", "ioannina"), ("1940-11-25", "gjirokaster", "engaged"), ("1940-12-08", "gjirokaster"), ("1940-12-20", "tepelene", "engaged"), ("1941-03-16", [20.08, 40.24], "engaged"), ("1941-04-18", "gjirokaster", "withdrawing"), ("1941-04-23", "ioannina", "surrendered")), "第1军内的第4师沿德里诺河谷攻击特佩莱讷方向。希军在12月收复吉诺卡斯特，但没能随即夺取特佩莱讷交通枢纽，冬季前线就此相持。", [GH], "1940-11-06", "1941-04-23"),
        ("9d", "9", "infantry", "gr.iii", track(("1940-10-28", "kastoria"), ("1940-11-14", [20.95, 40.60], "engaged"), ("1940-11-22", "korce"), ("1940-11-30", "pogradec"), ("1941-03-16", "pogradec", "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "科尔察反攻中参加第3军山地作战，原先军属有变动。部署示意突出卡斯托里亚、莫拉瓦和波格拉德茨轴线，不能解释为整个师逐日沿一条公路行军。", [GK], "1940-10-28", "1941-04-20"),
        ("10d", "10", "infantry", "gr.iii", track(("1940-10-28", "florina"), ("1940-11-14", [20.98, 40.76], "engaged"), ("1940-11-22", "korce"), ("1941-03-16", [20.71, 40.80], "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "初期隶属于西马其顿方向第3军，参加科尔察东侧山地攻势。后续前线轮换和部队调动复杂，轨迹表示主要活动区域及4月撤退结局。", [GK, US3], "1940-10-28", "1941-04-20"),
        ("11d", "11", "infantry", "gr.iii", track(("1940-10-28", "thessaloniki", "reserve"), ("1940-11-13", "florina"), ("1940-11-22", "korce", "engaged"), ("1941-03-16", [20.73, 40.74], "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "动员后从萨洛尼卡地区赴西马其顿，参与科尔察方向作战。主力在阿尔巴尼亚留下到德国进攻之后，随西部希军退往梅措沃一带。", [GK, US3], "1940-10-28", "1941-04-20"),
        ("15d", "15", "infantry", "gr.iii", track(("1940-11-13", "kastoria"), ("1940-11-14", [20.92, 40.52], "engaged"), ("1940-11-22", "korce"), ("1941-03-16", [20.72, 40.68], "active"), ("1941-04-16", "kastoria", "withdrawing"), ("1941-04-20", "metsovo", "surrendered")), "科尔察反攻中的关键师之一，利用莫拉瓦山地地形推动意军撤退。冬季作战以巩固防线和有限攻击为主，未发生一路持续北进到地拉那的情景。", [GK, US3], "1940-11-13", "1941-04-20"),
        ("cav", "骑兵", "cavalry", "gr.westmac", track(("1940-11-03", "grevena"), ("1940-11-05", "distrato", "engaged"), ("1940-11-13", "konitsa"), ("1941-03-16", "korce", "active"), ("1941-04-15", "grevena", "engaged"), ("1941-04-20", "metsovo", "surrendered")), "斯塔诺塔斯指挥骑兵师增援品都斯，步骑协同促使朱利亚师撤出深远突进的突出部。1941年4月又参与西部退路的阻击和撤退。", [G0, US3], "1940-11-03", "1941-04-20"),
        ("7d", "7", "infantry", "gr.eastmac", track(("1941-03-01", "drama"), ("1941-04-06", "drama", "engaged"), ("1941-04-09", "drama", "surrendered")), "位于斯特里蒙河以东的梅塔克萨斯防线，抵挡德军步兵军从保加利亚方向进攻。军团区投降协议及各要塞实际停止抵抗时间并不完全相同。", [US3], "1941-03-01", "1941-04-09"),
        ("14d", "14", "fortress", "gr.eastmac", track(("1941-03-01", "rupel"), ("1941-04-06", "rupel", "engaged"), ("1941-04-10", "rupel", "surrendered")), "守备鲁佩尔等重要要塞地带，在德国山地师和航空兵攻击下继续抵抗。萨洛尼卡被迂回夺取后，东马其顿失去后方联系；鲁佩尔到4月10日才停止抵抗。", [US3], "1941-03-01", "1941-04-10"),
        ("18d", "18", "infantry", "gr.eastmac", track(("1941-03-01", [23.13, 41.25]), ("1941-04-06", [23.13, 41.25], "engaged"), ("1941-04-09", "serres", "surrendered")), "担任斯特里蒙河以西的国境防御。德国第6山地师越过原以为难以通行的山地，随后绕入交通线，使守军的要塞体系遭到迂回。", [US3], "1941-03-01", "1941-04-09"),
        ("19mot", "19", "motorized", "gr.eastmac", track(("1941-03-01", "thessaloniki", "reserve"), ("1941-04-06", "doiran", "engaged"), ("1941-04-09", "thessaloniki", "surrendered")), "希腊新组建的第19摩托化师在多伊兰湖以南担任机动预备队。装备和训练尚未成熟，无法阻挡德国第2装甲师经南斯拉夫绕到萨洛尼卡。", [US3], "1941-03-01", "1941-04-09"),
        ("12d", "12", "infantry", "gr.hq", track(("1941-03-28", "veria"), ("1941-04-12", "veria", "engaged"), ("1941-04-16", "servia", "withdrawing"), ("1941-04-20", "elassona", "disbanded")), "3月28日起在作战上归威尔逊指挥，防守韦尔米翁阵地南段。英希协同受语言、通信和不同退却计划影响，德军突破后该师队伍逐步瓦解。", [US3, AWM], "1941-03-28", "1941-04-20"),
        ("20d", "20", "infantry", "gr.hq", track(("1941-03-28", "edessa"), ("1941-04-12", "vevi", "engaged"), ("1941-04-14", "kleisoura", "withdrawing"), ("1941-04-18", "grevena", "disbanded")), "配合W Force防守韦尔米翁北段，靠近南斯拉夫边境和弗洛里纳缺口。新动员部队重装备不足，韦维败退后通信和队伍组织遭到严重破坏。", [US3, AWM], "1941-03-28", "1941-04-18"),
    ]
    for i, num, typ, parent, rows, hist, sources, start, end in greek_divs:
        zh = "骑兵师" if i=="cav" else f"第{num}{'摩托化' if typ=='motorized' else ''}师"
        suffix = {"1": "st", "3": "rd"}.get(num, "th")
        orig = "Cavalry Division" if i == "cav" else f"{num}{suffix} {'Mechanized' if typ == 'motorized' else 'Infantry'} Division"
        u = add_unit("gr."+i, "GR", "division", typ, parent, zh, orig, num+"GR", rows, hist, sources, "inf_gr", start=start, end=end)
        if i=="8d": u["commander"]={"zh":"哈拉兰博斯·卡齐米特罗斯","orig":"Charalambos Katsimitros"};u["strength"]={"men":35000}
        if i=="1d": u["commander"]={"zh":"瓦西利斯·弗拉赫诺斯","orig":"Vasileios Vrachnos"}
        if i=="cav": u["commander"]={"zh":"乔治斯·斯塔诺塔斯","orig":"Georgios Stanotas"}
    add_unit("gr.pindus", "GR", "brigade", "mountain", "gr.hq", "品都斯支队", "Apóspasma Píndou", "品都", track(("1940-10-28", "eptachori", "engaged"), ("1940-10-31", "samarina", "withdrawing"), ("1940-11-04", "eptachori", "engaged"), ("1940-11-13", "konitsa", "disbanded")), "达瓦基斯率领约2000人的加强支队防卫品都斯。第1师与骑兵增援后，这个初期独立支队融入更大的作战组织；结束标记表示改编，不是全体人员战死。", [G0], "inf_gr", commander=("康斯坦丁诺斯·达瓦基斯", "Konstantinos Davakis"), end="1940-11-13", strength={"men": 2000})
    # 德军：4月6日编成；第5装甲师随后转入XL军，独立树说明此调动。
    add_unit("de.12a", "DE", "army", "hq", None, "第12集团军", "12. Armee", "12A", track(("1941-03-02", "sofia"), ("1941-04-05", "blagoevgrad"), ("1941-04-09", "thessaloniki"), ("1941-04-19", "larisa"), ("1941-04-27", "athens")), "李斯特统辖经保加利亚进入南斯拉夫南部和希腊的攻势。第18山地军与第40装甲军分别沿瓦尔达尔、比托拉轴线迂回防御，随后追击到伯罗奔尼撒。", [US3], commander=("威廉·李斯特", "Wilhelm List"), start="1941-03-02")
    add_unit("de.2a", "DE", "army", "hq", None, "第2集团军", "2. Armee", "2A", track(("1941-04-05", "graz"), ("1941-04-11", "maribor"), ("1941-04-14", "zagreb"), ("1941-04-18", "sarajevo")), "魏克斯指挥北路军队，从德属奥地利及匈牙利展开。装甲纵队越过德拉瓦河向萨格勒布、贝尔格莱德推进；主力随后追击南斯拉夫内陆。", [US2], commander=("马克西米连·冯·魏克斯", "Maximilian von Weichs"), start="1941-04-05", end="1941-04-30")
    add_unit("de.pzgrp1", "DE", "army", "hq", None, "第1装甲集群", "Panzergruppe 1", "PzG1", track(("1941-04-05", "sofia"), ("1941-04-09", "nis", "engaged"), ("1941-04-13", "belgrade"), ("1941-04-17", "sarajevo")), "克莱斯特从保加利亚方向经尼什突向贝尔格莱德。南斯拉夫政变后临时改变任务；原定投入希腊的第5装甲师在尼什附近又转向南方。", [US2, US3], commander=("埃瓦尔德·冯·克莱斯特", "Ewald von Kleist"), start="1941-04-05", end="1941-04-30")
    corps = [
        ("xviii", "XVIII", "de.12a", "第18山地军", "XVIII. Gebirgskorps", track(("1941-04-05", "petrich"), ("1941-04-09", "thessaloniki"), ("1941-04-14", "katerini"), ("1941-04-19", "larisa"), ("1941-04-25", "thermopylae"), ("1941-04-27", "athens")), "伯梅以山地师强攻、装甲师迂回梅塔克萨斯线，随后越过阿利阿克蒙河和奥林匹斯山麓，沿坦佩—拉里萨—温泉关追击。", ("弗兰茨·伯梅", "Franz Böhme"), US3),
        ("xl", "XL", "de.12a", "第40装甲军", "XL. Panzerkorps", track(("1941-04-05", "kyustendil"), ("1941-04-07", "skopje"), ("1941-04-10", "bitola"), ("1941-04-13", "kozani"), ("1941-04-20", "metsovo"), ("1941-04-26", "patras")), "斯图梅以第9装甲师、党卫军警卫旗队和第73步兵师切断南斯拉夫与希腊联系，再穿过比托拉缺口；第5装甲师随后加入该军方向。", ("乔治·斯图梅", "Georg Stumme"), US3),
        ("xiv", "XIV", "de.pzgrp1", "第14装甲军", "XIV. Panzerkorps", track(("1941-04-08", "pirot"), ("1941-04-09", "nis"), ("1941-04-11", "kragujevac"), ("1941-04-13", "belgrade")), "经皮罗特—尼什和摩拉瓦河谷推进，绕过交通困难的山区，在南斯拉夫动员完成前切入其主力后方。4月12—13日与另两路部队会合。", ("古斯塔夫·冯·维特斯海姆", "Gustav von Wietersheim"), US2),
        ("xlvi", "XLVI", "de.2a", "第46装甲军", "XLVI. Panzerkorps", track(("1941-04-05", "nagykanizsa"), ("1941-04-10", "zagreb"), ("1941-04-12", "osijek"), ("1941-04-14", "belgrade"), ("1941-04-17", "sarajevo")), "菲廷霍夫指挥第8、第14装甲师与第16摩托化师。军的分兵分别向萨格勒布、贝尔格莱德推进，随后转向萨拉热窝。军部轨迹仅表示作战重心。", ("海因里希·冯·菲廷霍夫", "Heinrich von Vietinghoff"), US2),
        ("xli", "XLI", None, "第41装甲军", "XLI. Panzerkorps", track(("1941-04-08", "timisoara"), ("1941-04-11", "vrsac"), ("1941-04-12", "pancevo"), ("1941-04-13", "belgrade")), "赖因哈特指挥来自罗马尼亚西部的独立机动集团。大德意志部队和党卫军师经弗尔沙茨、潘切沃接近首都；罗马尼亚主要提供集结与通行条件。", ("格奥尔格·汉斯·赖因哈特", "Georg-Hans Reinhardt"), US2),
        ("xlix", "XLIX", "de.2a", "第49山地军", "XLIX. Gebirgskorps", track(("1941-04-06", "klagenfurt"), ("1941-04-10", [14.90, 46.35]), ("1941-04-12", "ljubljana"), ("1941-04-16", "zagreb")), "屈布勒从克拉根福方向进入南斯拉夫西北部，与意军配合切断卢布尔雅那盆地守军。初期仅部分师及时集结，不能把计划编成等同于已全部参战。", ("路德维希·屈布勒", "Ludwig Kübler"), US2),
        ("xxx", "XXX", "de.12a", "第30步兵军", "XXX. Armeekorps", track(("1941-04-05", "plovdiv"), ("1941-04-08", "xanthi", "engaged"), ("1941-04-10", "drama"), ("1941-04-20", "thessaloniki")), "哈特曼统辖第50、第164师，由保加利亚向西色雷斯和爱琴海推进。该战区由德军首先突破，不能将4月6日的攻势标成保加利亚步兵发动。", ("奥托·哈特曼", "Otto Hartmann"), US3),
    ]
    for i, short, parent, zh, orig, rows, hist, cmd, src in corps:
        add_unit("de."+i, "DE", "corps", "hq", parent, zh, orig, short, rows, hist, [src], commander=cmd, start=rows[0]["at"], end="1941-04-30" if src==US2 else "1941-05-19T23:59")
    de_divs = [
        ("2pz", "第2装甲师", "2. Panzer-Division", "2.Pz", "de.xviii", "armor", "pz3", track(("1941-04-05", "petrich"), ("1941-04-06", "strumica", "engaged"), ("1941-04-08", "doiran"), ("1941-04-09", "thessaloniki"), ("1941-04-14", "katerini"), ("1941-04-16", "platamon", "engaged"), ("1941-04-18", "tempe", "engaged"), ("1941-04-20", "lamia"), ("1941-04-26", "thebes"), ("1941-04-27", "athens")), "经斯特鲁米察和多伊兰湖迂回，4月9日进入萨洛尼卡。随后沿海岸突破普拉塔蒙和坦佩阻击阵地；坦克在狭窄山路上同样受到爆破与运输瓶颈制约。", US3),
        ("9pz", "第9装甲师", "9. Panzer-Division", "9.Pz", "de.xl", "armor", "pz3", track(("1941-04-05", "kyustendil"), ("1941-04-07", "skopje"), ("1941-04-10", "bitola"), ("1941-04-12", "vevi", "engaged"), ("1941-04-14", "kozani"), ("1941-04-18", "elassona"), ("1941-04-24", "thermopylae", "engaged"), ("1941-04-27", "athens")), "第40军的装甲矛头，经南斯拉夫南部进入比托拉缺口。韦维战斗后突向科扎尼，迫使英希部队放弃阿利阿克蒙防线。", US3),
        ("5pz", "第5装甲师", "5. Panzer-Division", "5.Pz", "de.pzgrp1", "armor", "pz4", track(("1941-04-08", "pirot"), ("1941-04-10", "leskovac"), ("1941-04-14", "kozani"), ("1941-04-16", "grevena"), ("1941-04-19", "kalabaka"), ("1941-04-23", "lamia"), ("1941-04-25", "thebes"), ("1941-04-27", "corinth"), ("1941-04-29", "kalamata")), "原属第1装甲集群，尼什方向突破后转归第40军进入希腊。绕经格雷韦纳和卡兰巴卡，最后越科林斯追向卡拉马塔；军树保留最初归属，行动体现调动。", US3),
        ("11pz", "第11装甲师", "11. Panzer-Division", "11.Pz", "de.xiv", "armor", "pz3", track(("1941-04-08", "pirot"), ("1941-04-09", "nis", "engaged"), ("1941-04-11", "kragujevac", "engaged"), ("1941-04-13", "belgrade")), "第14装甲军先头部队，从尼什向摩拉瓦河谷推进。其迅速进击破坏了南斯拉夫在首都以南建立连续防御的企图。", US2),
        ("8pz", "第8装甲师", "8. Panzer-Division", "8.Pz", "de.xlvi", "armor", "pz38t", track(("1941-04-05", "nagykanizsa"), ("1941-04-08", "koprivnica"), ("1941-04-11", "osijek"), ("1941-04-13", "belgrade"), ("1941-04-16", "sarajevo")), "从匈牙利集结区过德拉瓦河，沿北部交通线向首都推进。贝尔格莱德陷落后参加向萨拉热窝方向追击，部分部队随后为对苏作战撤出。", US2),
        ("14pz", "第14装甲师", "14. Panzer-Division", "14.Pz", "de.xlvi", "armor", "pz3", track(("1941-04-05", "nagykanizsa"), ("1941-04-09", "varazdin"), ("1941-04-10", "zagreb"), ("1941-04-12", [15.07, 45.40]), ("1941-04-15", "sarajevo")), "从德拉瓦河方向迅速到达萨格勒布，继而向西南与意军接触并向萨拉热窝追击。城市投降、内部政治分裂与军事突破共同加速了南斯拉夫瓦解。", US2),
        ("16mot", "第16摩托化师", "16. Infanterie-Division (mot.)", "16.mot", "de.xlvi", "motorized", "inf_de", track(("1941-04-05", "nagykanizsa"), ("1941-04-10", "koprivnica"), ("1941-04-13", "belgrade"), ("1941-04-17", "sarajevo")), "属于第46装甲军，为沿德拉瓦—萨瓦河谷推进的装甲部队提供摩托化步兵力量。地图以军的行军轴线表示活动范围，不声称每个节点均为师部。", US2),
        ("1geb", "第1山地师", "1. Gebirgs-Division", "1.Geb", "de.xlix", "mountain", "inf_de", track(("1941-04-06", "klagenfurt"), ("1941-04-10", [14.90, 46.35]), ("1941-04-12", "ljubljana"), ("1941-04-16", "zagreb")), "第49军山地部队从阿尔卑斯山口进入南斯拉夫西北，协助切断卢布尔雅那地区退路。它不是在4月初由保加利亚突破梅塔克萨斯线的两个山地师之一。", US2),
        ("5geb", "第5山地师", "5. Gebirgs-Division", "5.Geb", "de.xviii", "mountain", "inf_de", track(("1941-04-05", "petrich"), ("1941-04-06", "rupel", "engaged"), ("1941-04-10", "serres"), ("1941-04-14", "veria"), ("1941-04-19", "larisa"), ("1941-04-25", "thebes"), ("1941-05-01", "athens", "reserve")), "参与梅塔克萨斯线作战，随后经萨洛尼卡南下。大陆战役结束后在雅典地区整补、准备克里特行动；进入岛上作战的部队在克里特章节单独展示。", US3),
        ("6geb", "第6山地师", "6. Gebirgs-Division", "6.Geb", "de.xviii", "mountain", "inf_de", track(("1941-04-05", "petrich"), ("1941-04-07", [23.13, 41.16], "engaged"), ("1941-04-09", "serres"), ("1941-04-12", "edessa"), ("1941-04-15", "veria"), ("1941-04-18", "tempe", "engaged"), ("1941-04-23", "thermopylae", "engaged"), ("1941-04-27", "athens")), "越过希方原以为难通行的山地迂回要塞。追击中通过韦里亚和坦佩峡谷，又在温泉关西侧山区迂回，体现山地部队在道路受限战场中的作用。", US3),
        ("73id", "第73步兵师", "73. Infanterie-Division", "73.ID", "de.xl", "infantry", "inf_de", track(("1941-04-05", "kyustendil"), ("1941-04-09", "stip"), ("1941-04-13", "bitola"), ("1941-04-17", "florina"), ("1941-04-21", "kozani")), "作为第40军步兵跟进部队，保障南斯拉夫南部交通线并向希腊推进。其步兵主力没有与最前沿装甲矛头同步到达每座城市。", US3),
        ("72id", "第72步兵师", "72. Infanterie-Division", "72.ID", "de.xviii", "infantry", "inf_de", track(("1941-04-05", "petrich"), ("1941-04-08", "rupel", "engaged"), ("1941-04-12", "thessaloniki"), ("1941-04-16", "katerini"), ("1941-04-20", "larisa")), "跟随第18军作战，参与要塞线攻击和萨洛尼卡方向推进。步兵、山地与装甲部队行进速度不同，队尾常受狭窄山路和补给交通堵塞影响。", US3),
        ("50id", "第50步兵师", "50. Infanterie-Division", "50.ID", "de.xxx", "infantry", "inf_de", track(("1941-04-05", "plovdiv"), ("1941-04-08", "komotini", "engaged"), ("1941-04-12", "xanthi"), ("1941-04-18", "drama")), "第30军从保加利亚向西色雷斯推进，绕过或攻打东部防御据点。该师行动与保军随后进驻占领区应在时间轴上区分。", US3),
        ("164id", "第164步兵师", "164. Infanterie-Division", "164.ID", "de.xxx", "infantry", "inf_de", track(("1941-04-05", "plovdiv"), ("1941-04-08", "xanthi", "engaged"), ("1941-04-12", "drama"), ("1941-04-20", "thessaloniki")), "与第50师一起从保加利亚进入希腊东部，逼近爱琴海岸。后续驻防是另一阶段任务，不能等同于意军在阿尔巴尼亚的正面推进。", US3),
        ("lssah", "党卫军警卫旗队", "Leibstandarte SS Adolf Hitler", "LSSAH", "de.xl", "motorized", "inf_de", track(("1941-04-05", "kyustendil"), ("1941-04-08", "skopje"), ("1941-04-11", "florina"), ("1941-04-12", "vevi", "engaged"), ("1941-04-14", "kleisoura", "engaged"), ("1941-04-16", "grevena"), ("1941-04-20", "metsovo"), ("1941-04-25", "patras"), ("1941-04-29", "pyrgos")), "当时为加强摩托化团而非后来装甲师。参加韦维、克莱苏拉和西部迂回，切断阿尔巴尼亚希军退路；其后经西海岸进入伯罗奔尼撒。", US3),
        ("reich", "党卫军第2摩托化师", "SS-Division Reich", "Reich", "de.xli", "motorized", "inf_de", track(("1941-04-08", "timisoara"), ("1941-04-11", "vrsac"), ("1941-04-12", "pancevo"), ("1941-04-13", "belgrade")), "组成从罗马尼亚西部指向首都的独立推进臂。其小股先头部队4月12日进入贝尔格莱德，不能由此推断全师已经在同一时刻占领市区。", US2),
    ]
    for i, zh, orig, short, parent, typ, model, rows, hist, src in de_divs:
        equipment = ["land_pz3", "land_pz2"] if typ=="armor" else None
        if model=="pz38t": equipment=["land_pz38t"]
        if model=="pz4": equipment=["land_pz4", "land_pz3"]
        add_unit("de."+i, "DE", "brigade" if i=="lssah" else "division", typ, parent, zh, orig, short, rows, hist, [src], model, start=rows[0]["at"], end="1941-04-30" if src==US2 else "1941-05-19T23:59", equipment=equipment)
    # 南斯拉夫军队：动员未完成，用集团军活动方向表示，避免臆造师部坐标。
    add_unit("yu.hq", "YU", "armygroup", "hq", None, "南斯拉夫最高统帅部", "Vrhovna komanda", "南总", [], "政变后仓促动员，在边境展开大量部队，同时计划对阿尔巴尼亚进攻。德军从数条交通线突入、通信遭轰炸与内部政治分裂，妨碍了统一撤退和集中抵抗。", [US2], commander=("杜尚·西莫维奇", "Dušan Simović"), start="1941-04-05", end="1941-04-18T12:00")
    yu_armies = [
        ("7a", "7", "ljubljana", "zagreb", "sarajevo", "守备德国、意大利方向。德军与意军在卢布尔雅那盆地两侧展开，撤退道路被机动部队切断。"),
        ("4a", "4", "bjelovar", "zagreb", "sarajevo", "沿德拉瓦河守备匈牙利边界。部分单位出现兵变与瓦解，德军第14装甲师遂迅速进入萨格勒布。"),
        ("2a", "2", "osijek", "novisad", "sarajevo", "守备北部德拉瓦—多瑙河地段，德军越过桥头并沿河谷突破后不得不撤向内陆。"),
        ("1a", "1", "subotica", "novisad", "belgrade", "部署在多瑙河与蒂萨河之间。德军突入及匈牙利4月11日参战后，北部防御迅速崩溃。"),
        ("5a", "5", "nis", "leskovac", "kraljevo", "负责东部边境并承受第1装甲集群的尼什轴线进攻。前沿失守后，向摩拉瓦河组织防御的计划来不及完成。"),
        ("6a", "6", "kragujevac", "kraljevo", "sarajevo", "在中部与首都周边协助抵抗。4月12日南翼被经摩拉瓦河谷前进的德军机动部队突入，成建制抵抗瓦解。"),
        ("3a", "3", "podgorica", "prizren", "podgorica", "沿阿尔巴尼亚边界展开，企图配合希腊进攻意军。局部进攻并未能补救斯科普里交通线被德军切断的局面。"),
        ("3territorial", "3区", "skopje", "ohrid", "prizren", "承担马其顿地区防御，与希腊盟军相联的斯科普里—比托拉交通轴线迅速被切断。这里区分第3集团军与第3军区部队。"),
    ]
    for i, num, loc1, loc2, loc3, hist in yu_armies:
        add_unit("yu."+i, "YU", "army", "hq", "yu.hq", "第3军区军队" if i=="3territorial" else f"第{num}集团军", "Yugoslav "+num+" Army", num+"YU", track(("1941-04-05", loc1), ("1941-04-09", loc2, "engaged"), ("1941-04-14", loc3, "withdrawing"), ("1941-04-18T12:00", loc3, "surrendered")), hist+"棋子描绘军级指挥活动中心，未完成动员的编制数不能当作已到位战斗力。", [US2], "inf_yu", start="1941-04-05", end="1941-04-18T12:00")
    # 英联邦：各国独立树，不把澳新编制挂成英国单位。
    add_unit("gb.wforce", "GB", "army", "hq", None, "W Force司令部", "W Force", "W Force", track(("1941-03-07", "athens"), ("1941-04-05", "larisa"), ("1941-04-15", "lamia"), ("1941-04-24", "athens"), ("1941-04-26", "piraeus", "withdrawing", "sea"), ("1941-04-27", [24.0, 35.72], "withdrawing")), "威尔逊指挥来自英国、澳大利亚和新西兰的远征军，并协调两支希腊师。各国部队在战斗序列中保留独立国家树，W Force本棋子只代表联合指挥活动。", [AWM, US3], "inf_gb", commander=("亨利·梅特兰·威尔逊", "Henry Maitland Wilson"), start="1941-03-07", end="1941-04-27")
    add_unit("gb.1armb_mainland", "GB", "brigade", "armor", "gb.wforce", "第1装甲旅", "1st Armoured Brigade", "1 Armd", track(("1941-03-07", "piraeus"), ("1941-03-24", "thessaloniki"), ("1941-04-10", "vevi", "engaged"), ("1941-04-14", "kozani", "withdrawing"), ("1941-04-18", "elassona"), ("1941-04-23", "thermopylae", "engaged"), ("1941-04-26", "rafina", "withdrawing", "sea"), ("1941-04-27", [24.1, 35.75], "withdrawing")), "由英国第2装甲师抽出的旅级部队，3月海运进入希腊。承担机动掩护、撤退阻击；撤离时许多重装备无法带走，不能画成坦克沿海面开往克里特。", [AWM, US3], "inf_gb", start="1941-03-07", end="1941-04-27")
    add_unit("gb.raf_greece", "GB", "brigade", "air", None, "英国皇家空军驻希腊部队", "RAF contingent in Greece", "RAF", track(("1940-11-04", "athens"), ("1940-11-14", "ioannina"), ("1941-03-01", "larisa"), ("1941-04-18", "athens", "withdrawing"), ("1941-04-21", "athens", "withdrawing", "air"), ("1941-04-22", [24.0, 35.72], "withdrawing")), "自1940年11月起以数量有限的轰炸机、战斗机支援希军。3月远征军增援与此前空中援助是两个阶段；德军进攻后空军遭受损失，于4月下旬撤出大陆。", [US1, AWM], start="1940-11-04", end="1941-04-22")
    au_path = track(("1941-03-19", "piraeus"), ("1941-04-05", "veria"), ("1941-04-12", "vevi", "engaged"), ("1941-04-16", "servia", "withdrawing"), ("1941-04-19", "elassona"), ("1941-04-23", "thermopylae", "engaged"), ("1941-04-26", "megara", "withdrawing", "sea"), ("1941-04-27", [23.7, 35.75], "withdrawing"))
    add_unit("au.1corps_mainland", "AU", "corps", "hq", None, "澳大利亚第1军·安扎克军", "I Australian / ANZAC Corps", "ANZAC", au_path, "布莱米指挥澳大利亚第1军，在希腊与新西兰师合编为安扎克军。各国部队保持国家行政编制；军级棋子主要表示共同防御和撤退指挥中心。", [AWM, US3], "inf_au", commander=("托马斯·布莱米", "Thomas Blamey"), start="1941-03-19", end="1941-04-27")
    add_unit("au.6d_mainland", "AU", "division", "infantry", "au.1corps_mainland", "澳大利亚第6师", "6th Australian Division", "6 AU", au_path, "麦凯指挥第6师，由北非转运希腊。部队在韦维、塞尔维亚与坦佩等地分散阻击，随后南撤。部分人员转往克里特，其余撤至埃及；大陆轨迹在海撤阶段结束。", [AWM, US3], "inf_au", commander=("伊文·麦凯", "Iven Mackay"), start="1941-03-19", end="1941-04-27", equipment=["land_bren", "land_25pdr"])
    au_brigades = [
        ("16b", "16", track(("1941-03-19", "piraeus"), ("1941-04-05", "veria"), ("1941-04-15", "servia", "engaged"), ("1941-04-18", "tempe", "engaged"), ("1941-04-22", "thermopylae"), ("1941-04-26", "megara", "withdrawing", "sea"), ("1941-04-27", [23.75, 35.73], "withdrawing")), "第16旅在阿利阿克蒙地区部署，部分营又被调至坦佩峡谷。主力撤退路线与各营分遣任务并不一致，轨迹以旅级作战方向表示。"),
        ("17b", "17", track(("1941-03-28", "piraeus"), ("1941-04-08", "kozani"), ("1941-04-14", "grevena", "engaged"), ("1941-04-18", "elassona", "withdrawing"), ("1941-04-24", "thebes"), ("1941-04-27", "kalamata", "withdrawing", "sea"), ("1941-04-28", [23.0, 34.55], "withdrawing")), "第17旅在西侧山地及撤退途中担任阻击。部分部队经伯罗奔尼撒港口直接撤往埃及；航路到图幅南缘结束，不能把埃及画到希腊地图内。"),
        ("19b", "19", track(("1941-03-27", "piraeus"), ("1941-04-10", "vevi", "engaged"), ("1941-04-12", "vevi", "engaged"), ("1941-04-15", "servia", "withdrawing"), ("1941-04-22", "thermopylae"), ("1941-04-25", "megara", "withdrawing", "sea"), ("1941-04-26", [23.70, 35.72], "withdrawing")), "第19旅在麦凯临时集群内防卫韦维缺口。冷雨、风雪与德军突击使阵地崩溃，旅随后随安扎克军南撤，转往克里特的人员在该章接续出现。"),
    ]
    for i, n, rows, hist in au_brigades:
        add_unit("au."+i+"_mainland", "AU", "brigade", "infantry", "au.6d_mainland", "澳大利亚第"+n+"旅", n+"th Australian Brigade", n+" AU", rows, hist, [AWM, US3], "inf_au", start=rows[0]["at"], end=rows[-1]["at"])
    nz_path = track(("1941-03-07", "piraeus"), ("1941-03-25", "katerini"), ("1941-04-14", "platamon", "engaged"), ("1941-04-18", "elassona", "withdrawing"), ("1941-04-22", "thermopylae", "engaged"), ("1941-04-27", "monemvasia", "withdrawing", "sea"), ("1941-04-28", [24.0, 35.73], "withdrawing"))
    add_unit("nz.2d_mainland", "NZ", "division", "infantry", None, "新西兰第2师", "2nd New Zealand Division", "2 NZ", nz_path, "弗赖伯格指挥第2师，担任奥林匹斯山和阿利阿克蒙防线的重要部分。4月在山口和峡谷连续阻击，南撤后部分人员登陆克里特，后来担负岛防任务。", [AWM, US3], "inf_nz", commander=("伯纳德·弗赖伯格", "Bernard Freyberg"), start="1941-03-07", end="1941-04-28", equipment=["land_bren", "land_25pdr"])
    nz_brigades = [
        ("4b", "4", track(("1941-03-07", "piraeus"), ("1941-04-05", "servia"), ("1941-04-14", "servia", "engaged"), ("1941-04-18", "elassona", "withdrawing"), ("1941-04-22", "thermopylae"), ("1941-04-26", "rafina", "withdrawing", "sea"), ("1941-04-27", [24.0, 35.73], "withdrawing")), "第4旅在塞尔维亚山口方向构成安扎克防线的一部分，掩护南撤。大陆结束时的旅番号不应与克里特作战重新编组后的支队混为一个固定位置。"),
        ("5b", "5", track(("1941-03-07", "piraeus"), ("1941-04-05", "katerini"), ("1941-04-14", "platamon", "engaged"), ("1941-04-16", "tempe", "engaged"), ("1941-04-18", "elassona", "withdrawing"), ("1941-04-23", "thermopylae"), ("1941-04-27", "monemvasia", "withdrawing", "sea"), ("1941-04-28", [24.0, 35.73], "withdrawing")), "第5旅的部队防守奥林匹斯和普拉塔蒙；第21营等先后转移到坦佩。德军的海岸和山地迂回迫使撤退，部分部队经南部港口转赴克里特。"),
        ("6b", "6", track(("1941-03-07", "piraeus"), ("1941-04-05", "katerini"), ("1941-04-16", "elassona"), ("1941-04-18", "elassona", "engaged"), ("1941-04-22", "thermopylae", "engaged"), ("1941-04-27", "monemvasia", "withdrawing", "sea"), ("1941-04-28", [24.0, 35.73], "withdrawing")), "第6旅在埃拉索纳等撤退阻击阵地作战，最后参与温泉关掩护。并非所有人员都留在克里特，重装备遗弃及分批装船造成了下一阶段重新编组。"),
    ]
    for i, n, rows, hist in nz_brigades:
        add_unit("nz."+i+"_mainland", "NZ", "brigade", "infantry", "nz.2d_mainland", "新西兰第"+n+"旅", n+"th New Zealand Brigade", n+" NZ", rows, hist, [AWM, US3], "inf_nz", start=rows[0]["at"], end=rows[-1]["at"])
    add_unit("hu.3a", "HU", "army", "infantry", None, "匈牙利第3集团军", "Magyar 3. hadsereg", "3 HU", track(("1941-04-10", [19.50, 46.25], "reserve"), ("1941-04-11", "subotica", "engaged"), ("1941-04-13", "novisad"), ("1941-04-18", "novisad", "active")), "匈牙利部队4月11日才越境，主要占领巴奇卡等北部地区。它提供通行和后续参战，但不是4月6日从保加利亚突破希腊防线的军队。", [US2], "inf_hu", start="1941-04-10")
    add_unit("bg.occupation", "BG", "army", "infantry", None, "保加利亚进驻部队", "Bulgarian occupation forces", "BG占", track(("1941-04-20", "petrich", "active"), ("1941-04-24", "drama"), ("1941-04-28", "xanthi"), ("1941-05-19", "xanthi")), "保加利亚允许德军通过和集结；在德军突破、希军投降后，其部队进入马其顿和西色雷斯占领区。轨迹是后续进驻方向，不表示参加4月6日的首轮突破。", [US1, US3], "inf_bg", start="1941-04-20", conf="low")


def make_routes():
    by_id = {u["id"]: u for u in UNITS}
    for uid, label, side, style, end in [
        ("it.ferrara", "卡尔帕基主攻", "IT", "main", "1940-11-08"),
        ("it.siena", "卡拉马斯—海岸攻势", "IT", "secondary", "1940-11-08"),
        ("it.julia", "朱利亚师品都斯突进", "IT", "main", "1940-11-04"),
        ("gr.1d", "品都斯反击", "GR", "counter", "1940-11-13"),
        ("gr.3d", "萨兰达—希马拉反攻", "GR", "counter", "1940-12-23"),
        ("gr.9d", "科尔察—波格拉德茨", "GR", "counter", "1940-12-02"),
        ("de.11pz", "摩拉瓦河谷：尼什—首都", "DE", "main", "1941-04-18"),
        ("de.14pz", "德拉瓦河—萨格勒布", "DE", "main", "1941-04-18"),
        ("de.8pz", "北路—贝尔格莱德", "DE", "main", "1941-04-18"),
        ("de.reich", "罗马尼亚集结区—首都", "DE", "secondary", "1941-04-18"),
        ("de.9pz", "斯科普里—比托拉—希腊", "DE", "main", "1941-04-30"),
        ("de.2pz", "迂回萨洛尼卡—海岸南下", "DE", "main", "1941-04-30"),
        ("de.5pz", "西翼迂回—伯罗奔尼撒", "DE", "main", "1941-04-30"),
        ("de.lssah", "西翼：梅措沃—帕特雷", "DE", "secondary", "1941-04-30"),
        ("it.2a", "意军北方攻势", "IT", "secondary", "1941-04-18"),
        ("hu.3a", "匈军4月11日后越境", "HU", "secondary", "1941-04-18"),
        ("bg.occupation", "保军后续进驻", "BG", "secondary", "1941-05-19"),
    ]:
        rows = [p for p in by_id[uid]["track"] if p["at"] <= at(end, "23:59")]
        if len(rows)>=2: add_route(uid.replace(".", "_")+"_advance", side, uid, label, rows, style, sources=by_id[uid]["sources"])
    # 只画实际撤退部分，避免把3月登陆后的北进错误标成撤退。
    for uid, begin, label in [
        ("gr.iii", "1941-04-13", "西马其顿军从阿尔巴尼亚撤退"),
        ("gr.i", "1941-04-13", "伊庇鲁斯退却"),
        ("au.6d_mainland", "1941-04-12", "安扎克军南撤"),
        ("nz.2d_mainland", "1941-04-14", "奥林匹斯—温泉关退却"),
    ]:
        u=by_id[uid];old=[p for p in u["track"] if p["at"]<at(begin)];new=[p for p in u["track"] if p["at"]>=at(begin) and p.get("movement")!="sea"]
        rows=([old[-1]] if old else [])+new
        if len(rows)>=2:add_route(uid.replace(".","_")+"_retreat",u["side"],uid,label,rows,"retreat",9,until="1941-04-30",sources=u["sources"])
    # 海路为单独图层箭头，起点的movement避免在海中显示地面手办。
    for uid, label in [("au.17b_mainland", "海撤往埃及（图外）"), ("nz.5b_mainland", "海撤往克里特"), ("au.19b_mainland", "海撤往克里特"), ("gb.1armb_mainland", "海撤：装备多被遗弃")]:
        u=by_id[uid];rows=u["track"][-2:]
        add_route(uid.replace(".","_")+"_sea",u["side"],uid,label,rows,"retreat",7,"sea",until="1941-04-30",sources=u["sources"])


EVENTS = []


def event(i, date, zh, body, loc, sources, side=None, category="battle", importance=2, units=None, end=None, precision="day", zoom=4, confidence="high", sfx=None):
    e={"id":"e."+i,"at":at(date),"precision":precision,"category":category,"importance":importance,"title":{"zh":zh},"body":body,"place":"@"+loc if isinstance(loc,str) else loc,"sources":sources,"confidence":confidence,"zoom":zoom}
    if side:e["side"]=side
    if units:e["units"]=units
    if end:e["endAt"]=at(end)
    e["sfx"]=sfx or (["artillery","rifle"] if category=="battle" else ["bomber","siren"] if category=="air" else ["morse","paper"])
    EVENTS.append(e)


def make_events():
    event("ultimatum", "1940-10-28T03:00", "希腊拒绝意大利最后通牒", "意大利大使向梅塔克萨斯要求允许意军占据希腊战略地点。希腊拒绝后，驻阿尔巴尼亚意军开始准备越境。战争首先是意大利与希腊的冲突，德国、匈牙利和保加利亚尚未在这一刻发动地面进攻。", "athens", [G0, AWM], "GR", "political", 1, precision="minute", zoom=2)
    event("italian_invasion", "1940-10-28T05:30", "意军从阿尔巴尼亚入侵", "意军由伊庇鲁斯海岸、卡尔帕基和品都斯山区展开攻势。希腊边境掩护部队边打边退向预设防线；意占阿尔巴尼亚是进攻起点，地图初始控制色不表示意军已经占领希腊。", "kalpaki", [G0, GK], "IT", importance=1, units=["it.xxv","it.julia","gr.8d"], precision="minute")
    event("pindus_attack", "1940-10-29", "朱利亚师向品都斯纵深推进", "朱利亚山地师企图经崎岖山地向梅措沃推进，切断伊庇鲁斯与西马其顿希军的联系。达瓦基斯的品都斯支队人数有限，因而逐步后撤；天气、补给线和暴露的两翼使意軍突出部越深入越脆弱。", "eptachori", [G0, GK], "IT", units=["it.julia","gr.pindus"], end="1940-10-31")
    event("british_air_aid", "1940-11-04", "英国空中援助开始发挥作用", "英国皇家空军由希腊机场攻击意军交通和港口，支持希腊地面作战。当时援助规模有限，英国主力仍在北非；1941年3月澳新陆军登陆应与这批较早的空中、地勤和防空援助分开理解。", "ioannina", [US1, AWM], "GB", "air", units=["gb.raf_greece"], zoom=3)
    event("pindus_counter", "1940-11-01T07:30", "希军在品都斯反击", "第1师在达瓦基斯支队周边组织反击，先攻击朱利亚师左翼。接下来骑兵和步兵逐步收复萨马里纳等村镇，意军向南突进的分队有被切断危险；这是局部转折，尚不是整条前线的总反攻。", "eptachori", [G0], "GR", importance=1, units=["gr.1d","gr.pindus","it.julia"], precision="minute")
    event("kalpaki_battle", "1940-11-02", "卡尔帕基—卡拉马斯防线守住", "加强的希腊第8师利用预设阵地、水障和山地组织防御。费拉拉师与半人马装甲分队正面攻击未取得计划中的突破，锡耶纳师的侧翼推进也未夺取约阿尼纳。防御为全国动员争取了时间。", "kalpaki", [G0], "GR", importance=1, units=["gr.8d","it.ferrara","it.centauro","it.siena"], end="1940-11-08")
    event("julia_retreat", "1940-11-06", "朱利亚师后撤，巴里师接应", "希军第1师和骑兵加紧进攻品都斯突出部。朱利亚师遭受严重损失，但巴里师增援掩护了部分队伍退向科尼察，不能把这次失利描述为全师被彻底消灭。至13日前后，原防御线大体恢复。", "distrato", [G0], "GR", units=["it.julia","it.bari","gr.1d","gr.cav"], end="1940-11-13")
    event("italian_reorganisation", "1940-11-09", "意军更换指挥并增援", "开局计划受挫后，意方撤换普拉斯卡，索杜接任并重组阿尔巴尼亚战区。第9、第11集团军分担东北和伊庇鲁斯方向，增援陆续海运抵达；番号增加并不立即解决狭窄道路、港口吞吐和协同的问题。", "tirana", [GK, US1, GS], "IT", "movement", units=["it.9a","it.11a"], zoom=2, confidence="medium")
    event("greek_counteroffensive", "1940-11-14", "希腊转入全面反攻", "完成进一步动员后，希军由防御转为跨境反攻。第3军在科尔察方向攻击莫拉瓦山地，第1、第2军也向阿尔巴尼亚南部推进。控制区因此出现意军退缩，不能把整个战役画成轴心国单向扩张。", "kastoria", [GK, GH, US3], "GR", importance=1, units=["gr.i","gr.ii","gr.iii"], zoom=2)
    event("morava_battle", "1940-11-17", "莫拉瓦山地打开科尔察通路", "第3军以多支步兵师向科尔察周边高地进攻，通过山地机动威胁意军交通。城市并非孤立据点；意军守住周边山脊的企图失败后，帕尔马、皮埃蒙特等师被迫准备撤出科尔察地区。", "korce", [GK], "GR", units=["gr.9d","gr.10d","gr.15d","it.parma","it.piemonte"], end="1940-11-21")
    event("korce_liberation", "1940-11-22", "科尔察落入希军手中", "希军第3军部队进入科尔察，意军撤向阿尔巴尼亚内部。胜利不仅推进国境外战线，也改善了希军士气；地图所示是战区尺度的控制变化，不能解释为每个师在当天都驻扎于城市中心。", "korce", [GK, GH], "GR", importance=1, units=["gr.iii","it.xxvi"], zoom=3)
    event("pogradec", "1940-11-30", "希军推进到波格拉德茨", "科尔察战斗后，希军继续向奥赫里德湖西岸推进，进入波格拉德茨。意军仍控制更北方的爱尔巴桑及主要交通线。随着山地严寒与补给困难加重，反攻速度逐渐降低，未能持续直抵地拉那。", "pogradec", [GH, GK], "GR", units=["gr.iii","it.venezia"], zoom=4)
    event("sarande", "1940-12-06", "萨兰达海岸交通受到威胁", "12月初希军推进至德尔维纳和萨兰达方向，意军失去南部若干重要城镇。地形把沿海、德里诺河谷和内陆山路分成不同作战轴线；海岸推进并没有自动打开通往发罗拉港的道路。", "sarande", [GH], "GR", units=["gr.3d","it.siena"], confidence="medium")
    event("gjirokaster", "1940-12-08", "希军进入吉诺卡斯特", "希军取得德里诺河谷的重要城镇吉诺卡斯特，并继续向特佩莱讷方向施压。意军仍占据更北的交通枢纽，山口、河谷和坏天气减慢追击。希军的进展是一系列分区战斗，不能画成毫无阻滞的整齐直线。", "gjirokaster", [GH, US3], "GR", units=["gr.i","gr.4d","it.11a"], confidence="medium")
    event("marita_directive", "1940-12-13", "德国下令筹备玛丽塔行动", "德国制定从保加利亚方向进攻希腊的玛丽塔计划，筹划把部队经罗马尼亚运输到南方。此时尚处集结与外交阶段；地图以索非亚方向作战略注记，不表示德国在12月已经侵入希腊。", "sofia", [US1, US3], "DE", "political", importance=2, zoom=1, confidence="medium")
    event("himare", "1940-12-22", "希马拉战斗告捷", "第1军在12月20至22日攻击库奇山口和海岸阵地，第3師等部队取得希马拉方向的进展。意军退向发罗拉以南的山地；胜利威胁港口交通，但发罗拉并未在这个冬季被希军占领。", "himare", [GH], "GR", importance=1, units=["gr.i","gr.3d","it.siena"], end="1940-12-22", zoom=4)
    event("kelcyre", "1941-01-10", "希军夺取克利苏拉隘口", "第2军于1月初在克利苏拉方向进攻，取得重要隘口与河谷节点。意军增援和恶劣天气使后续作战艰难；特佩莱讷仍未陷落，希军最终在比国境更北的阿尔巴尼亚南部形成冬季战线。", "kelcyre", [GS, US3], "GR", importance=1, units=["gr.ii","gr.1d","it.lupi","it.julia"], confidence="medium")
    event("winter_front", "1941-01-11", "冬季相持：补给决定行动上限", "严寒、积雪、泥泞和驮畜运输使双方难以维持大规模机动。希军守住秋冬反攻取得的地区，意军继续增援阿尔巴尼亚港口。地图在这一时期保持大体稳定，零星战斗和轮换不虚构成每天推进的战线。", "tepelene", [GS, AWM, US3], category="movement", importance=1, zoom=2)
    event("greek_rejects_small_force", "1941-01-13", "希方担心小规模英国陆军增援", "面对德国介入的危险，英国与希腊讨论派遣地面部队。希方认为数量不足的援军可能刺激德国，却不足以阻止进攻，因此1月未立即接受这项方案；两国在后续2月会谈中才转向更大的远征军计划。", "athens", [US1, AWM], "GR", "political", zoom=2)
    event("metaxas_death", "1941-01-29", "梅塔克萨斯逝世，希腊继续作战", "梅塔克萨斯逝世后，科里齐斯领导政府继续抵抗意大利。前线仍在阿尔巴尼亚，德国从罗马尼亚向南的筹备却不断加强。政治领导变化并未使冬季战线立即发生地理位移。", "athens", [AWM, US1], "GR", "political", zoom=2)
    event("allied_agreement", "1941-02-22", "英希商议派遣远征军", "英国与希腊商讨德国威胁和防线选择，决定推动较大规模地面援军。希军不愿放弃阿尔巴尼亚既得阵地，英军又无力守住全部国境，结果阿利阿克蒙—韦尔米翁防线与梅塔克萨斯线分离。", "athens", [AWM, US3], "GB", "political", importance=1, zoom=2)
    event("bulgaria_pact", "1941-03-01", "保加利亚加入三国同盟", "保加利亚加入三国同盟，允许德军集结与通行。其边界成为德国进攻希腊和南斯拉夫南部的出发方向。保加利亚军队与德国军队的角色必须区分：4月6日主要突破由德军实施。", "sofia", [US1], "BG", "political", importance=1, zoom=2)
    event("germans_enter_bulgaria", "1941-03-02", "德军进入保加利亚集结", "德军经罗马尼亚和多瑙河通道进入保加利亚，第12集团军逐步转移到希腊及南斯拉夫边界。雪、坏路和缺少铁路运力拖慢集结，地图只显示战区活动中心，不把筹划中的兵力全部提前放到希腊境内。", "sofia", [US1, US3], "DE", "movement", units=["de.12a"], zoom=2)
    event("lustre_landings", "1941-03-07", "光泽行动：英联邦援军登陆", "英国装甲旅、澳大利亚与新西兰部队开始经海路运入希腊，主要在比雷埃夫斯和沃洛斯卸载后向北部署。希腊已有的英军空中援助早于这次登陆；登陆与展开分批进行，不是所有师旅同日到位。", "piraeus", [AWM, US3], "GB", "movement", importance=1, units=["gb.wforce","gb.1armb_mainland","nz.2d_mainland"], zoom=3)
    event("spring_offensive", "1941-03-09", "意军发动春季攻势", "意军第8军集中炮兵和步兵，在德斯尼察谷地、特雷贝希纳及731高地周围进攻希腊第2军。墨索里尼亲临阿尔巴尼亚，希望在德国介入前取得突破；密集攻击仍未打开预期通路。", "hill731", [GS], "IT", importance=1, units=["it.viii","gr.ii","gr.1d"], end="1941-03-16", zoom=5)
    event("spring_offensive_fails", "1941-03-16", "希军守住春季攻势主战区", "连续数日战斗后，意军未能在第1师防守的核心地段取得决定性进展。双方承受伤亡，阿尔巴尼亚南部的总体战线仍保持稳定。这里以区域节点说明作战，不把731高地标记解释为经过勘测的阵地精确坐标。", "hill731", [GS, US3], "GR", importance=1, units=["gr.1d","it.viii"], zoom=4)
    event("yugoslavia_pact", "1941-03-25", "南斯拉夫政府加入三国同盟", "摄政政府在轴心国压力下加入三国同盟，国内反对情绪迅速升高。地图以贝尔格莱德作为政治中心注记，签署地点实际在图外维也纳；这次外交决定并不表示南斯拉夫已被军事占领。", "belgrade", [US2, AWM], "YU", "political", importance=1, zoom=2)
    event("yugoslav_coup", "1941-03-27", "贝尔格莱德政变改变德国计划", "军官发动政变，彼得二世提前亲政，西莫维奇组建政府。希特勒决定把进攻南斯拉夫加入既定希腊行动，德国各路军队在很短时间内重新集结。南斯拉夫仓促动员，未能与英希建立有效统一指挥。", "belgrade", [US2, AWM], "YU", "political", importance=1, zoom=2)
    event("matapan", "1941-03-28", "马塔潘海战保住援军海路", "英国地中海舰队与澳大利亚军舰参与拦截意大利舰队，在夜战中击沉意方重巡洋舰等舰艇。战果降低了意大利水面舰队干扰海运的能力，但没有消除德国航空兵对希腊港口和撤离船只的威胁。", "matapan", [AWM], "GB", "naval", importance=2, end="1941-03-29", zoom=2, sfx=["ship_gun","explosion"])
    event("allied_coordination", "1941-04-03", "英希南会谈仍未建立统一防御", "英国、希腊和南斯拉夫代表商议合作，仍希望南斯拉夫部队能阻断德军并对阿尔巴尼亚意军进攻。计划没有及时转化为有效协同；斯科普里与萨洛尼卡一旦失守，几个战区会迅速分离。", "florina", [US3], category="political", zoom=2, confidence="medium")
    event("belgrade_bombing", "1941-04-06", "贝尔格莱德遭到轰炸", "德国空军猛烈攻击贝尔格莱德，打击首都及通信指挥系统并造成平民伤亡。与此同时，德国地面部队从数个方向进攻。空袭、仓促动员与分散部署共同削弱了南斯拉夫组织连续抵抗的能力。", "belgrade", [US2, AWM], "DE", "air", importance=1, units=["yu.hq"], zoom=3)
    event("marita_begins", "1941-04-06", "玛丽塔与南斯拉夫攻势同时开始", "德国第12集团军从保加利亚进攻希腊和南斯拉夫南部，北路第2集团军也夺取边境桥头。希军主力仍远在阿尔巴尼亚；保军此时主要提供通行条件，不能在地图上冒充突破梅塔克萨斯线的进攻部队。", "rupel", [US2, US3], "DE", importance=1, units=["de.12a","de.xviii","de.xl"], zoom=2)
    event("drava_bridges", "1941-04-06", "德军抢夺德拉瓦河桥头", "德国北路部队在主力尚未全部集结时，先攻击边境桥梁和通路，争取避免南斯拉夫守军完成爆破。这些有限目标进攻为随后装甲纵队沿德拉瓦、萨瓦河谷前进创造条件。", "koprivnica", [US2], "DE", units=["de.xlvi","yu.4a"], zoom=3)
    event("skopje", "1941-04-07", "斯科普里失守切断盟军交通", "德国第40装甲军部队进入斯科普里，切断南斯拉夫与希腊之间的铁路和道路联系。其主力随后转向比托拉缺口，威胁英希防线北端；对阿尔巴尼亚进攻的南斯拉夫计划也失去主要交通支持。", "skopje", [US3, US2], "DE", importance=1, units=["de.xl","de.9pz","yu.3territorial"], zoom=3)
    event("nis_attack", "1941-04-08", "第1装甲集群冲向尼什", "克莱斯特从保加利亚方向发动经皮罗特至尼什的进攻，打开摩拉瓦河谷通路。南斯拉夫第5集团军的撤退和重新布防来不及完成，德国机动部队很快转向贝尔格莱德。", "nis", [US2], "DE", units=["de.pzgrp1","de.11pz","yu.5a"], end="1941-04-09", zoom=3)
    event("salonika", "1941-04-09", "萨洛尼卡陷落，东马其顿投降", "德国第2装甲师经南斯拉夫绕过要塞线，进入萨洛尼卡，截断东马其顿守军后方。巴科普洛斯接受投降，一些要塞到次日才停止抵抗。要塞正面未被迅速攻破，并不等于整个防御体系仍能维持。", "thessaloniki", [US3, AWM], "DE", importance=1, units=["de.2pz","gr.eastmac"], zoom=3)
    event("zagreb", "1941-04-10", "萨格勒布陷落与克罗地亚分裂", "德国第14装甲师进入萨格勒布，克罗地亚独立国家同时宣布成立。南斯拉夫北部军队的内部瓦解和道路、桥梁失守加快了轴心国进击；地图保持1940年国界底图，政治变化由事件解释。", "zagreb", [US2], "DE", importance=1, units=["de.14pz","yu.4a"], zoom=3)
    event("hungarian_entry", "1941-04-11", "匈军越境，意军西北推进", "匈牙利第3集团军从苏博蒂察和奥西耶克以北越境，意大利第2集团军也向卢布尔雅那与达尔马提亚推进。其加入晚于德国4月6日的首轮攻势，应在时间轴上分别出现。", "subotica", [US2], "HU", "movement", units=["hu.3a","it.2a"], zoom=2)
    event("vevi", "1941-04-12", "韦维缺口的英希阻击失败", "麦凯临时集群在寒冷风雪中守卫韦维缺口，澳大利亚第19旅与英希部队迎击德军。德军突击迫使阵地撤退，阿利阿克蒙防线北端暴露；各部队疲惫、通信和补给困难影响了后续协同。", "vevi", [AWM, US3], "DE", importance=1, units=["de.lssah","de.9pz","au.19b_mainland","gr.20d"], zoom=5)
    event("belgrade_falls", "1941-04-12", "德军三路逼近并进入贝尔格莱德", "来自摩拉瓦河谷、罗马尼亚西部和北部河谷的德军接近首都，小股先头部队率先入城。南斯拉夫军队转向内陆的计划受到快速追击；当天的入城不意味着所有德军纵队都已同时到达。", "belgrade", [US2], "DE", importance=1, units=["de.xli","de.reich","de.xiv","de.xlvi"], end="1941-04-13", zoom=3)
    event("albania_withdrawal", "1941-04-13", "希腊西部主力开始从阿尔巴尼亚撤退", "德军从比托拉缺口进入希腊，阿尔巴尼亚前线的希軍必须南撤才能避免退路被切断。部队经历数月山地战争，撤退道路狭窄且缺乏机动车；意军压力和德国快速侧击共同压缩了可用时间。", "korce", [US3, AWM], "GR", "movement", importance=1, units=["gr.westmac","gr.i","gr.ii","gr.iii"], zoom=2)
    event("kleisoura_pass", "1941-04-14", "克莱苏拉山口被德军突破", "警卫旗队等德军在克莱苏拉和卡斯托里亚方向突破希军阻击，使西马其顿军团区退路更危险。这里的克莱苏拉在希腊马其顿，必须与1月阿尔巴尼亚克利苏拉隘口区分，两个地名的相近译法不能混用。", "kleisoura", [US3, AWM], "DE", units=["de.lssah","gr.20d","gr.westmac"], zoom=5)
    event("sarajevo", "1941-04-15", "轴心国追击到南斯拉夫内陆", "贝尔格莱德陷落后，德军机动部队向萨拉热窝方向追击，防止南斯拉夫军队在山区重新集中。西北的意军也向达尔马提亚海岸推进，国家层面的成建制抵抗已经迅速衰弱。", "sarajevo", [US2], "DE", units=["de.14pz","de.8pz","yu.6a"], zoom=3, confidence="medium")
    event("platamon", "1941-04-16", "普拉塔蒙守军退向坦佩", "新西兰部队在奥林匹斯山与爱琴海之间的狭窄通路阻挡第2装甲师。阵地最终遭到迂回，守军撤向皮尼奥斯河峡谷；爆破隧道和道路拖慢了德国坦克，山地师则试图越过周边高地。", "platamon", [AWM, US3], "NZ", units=["nz.5b_mainland","de.2pz"], zoom=5)
    event("yugoslav_surrender_signed", "1941-04-17", "南斯拉夫签署投降协议", "南斯拉夫代表签署无条件投降文件，停战在18日中午生效。投降结束的是正规军战役层面的抵抗；占领并没有消除之后的游击战争。时间轴区分签署与生效，避免所有部队在17日提前消失。", "belgrade", [US2], "YU", "surrender", importance=1, units=["yu.hq"], zoom=2)
    event("yugoslav_armistice_effective", "1941-04-18T12:00", "南斯拉夫停战生效", "签署次日中午，南斯拉夫正规军停战协议生效，残余部队被解除武装。地图从这一刻显示全国战区处于轴心国控制；棋子随后淡出，表现投降后的组织终止，而不是在地理上从一座城市瞬间跳到另一座。", "sarajevo", [US2], "YU", "surrender", importance=2, precision="minute", zoom=1)
    event("tempe", "1941-04-18", "坦佩峡谷与埃拉索纳后卫战", "新西兰及澳大利亚部队在坦佩峡谷和埃拉索纳一带实施后卫战，为主力南撤争取时间。德国装甲与山地部队通过渡河、山地迂回和修复道路追击；盟軍虽遭损失，不能简单写成新西兰部队全被歼灭。", "tempe", [AWM, US3], "NZ", importance=1, units=["nz.5b_mainland","nz.6b_mainland","au.16b_mainland","de.6geb"], zoom=5)
    event("larisa", "1941-04-19", "德军进入拉里萨", "德国第18军部队进入拉里萨，接近希腊中部的重要道路和机场。盟军撤向温泉关方向，德军利用缴获补给继续追击；西翼第5装甲师同时沿格雷韦纳—卡兰巴卡路线南下。", "larisa", [US3, AWM], "DE", units=["de.xviii","de.5pz","gb.wforce"], zoom=3)
    event("greek_first_surrender", "1941-04-20", "楚拉科格鲁自行接洽投降", "西部希军面临梅措沃和约阿尼纳交通线被切断，楚拉科格鲁未获帕帕戈斯批准便与德军接洽投降。20日至23日先后出现不同协议，意大利要求参与；本事件不等于全国全部希军在20日统一停火。", "metsovo", [US3, AWM], "GR", "surrender", importance=1, units=["gr.iii","gr.westmac","de.lssah"], zoom=3)
    event("bulgarian_occupation", "1941-04-20", "保军在德军突破后进驻占领区", "德国已突破东马其顿和色雷斯，希军军团区也已投降，保加利亚随后开始进驻部分占领区。地图按国家显示部队身份，控制填色按轴心国合并；进驻与4月6日的战斗突破不是同一件事。", "drama", [US1, US3], "BG", "movement", units=["bg.occupation"], zoom=2, confidence="medium")
    event("raf_withdrawal", "1941-04-21", "英国空军撤离大陆", "德国掌握空中优势，英国驻希腊航空兵在机场遭到损失，剩余飞机和地勤陆续转往克里特及埃及。地面军队随后经多个小港口夜间装船，失去足够空中掩护使撤离船舶和港口更加脆弱。", "athens", [US3, AWM], "GB", "movement", units=["gb.raf_greece"], zoom=3)
    event("greek_final_surrender", "1941-04-23", "西部希军向德意两国正式投降", "在此前单独接洽和修改协议之后，西部希军正式向德国与意大利签署投降文件。阿尔巴尼亚主力被解除武装；英联邦部队仍在温泉关及撤离道路上作战，希腊政府和部分军人继续转移到克里特。", "ioannina", [US3, AWM], "GR", "surrender", importance=1, units=["gr.i","gr.ii","it.11a"], zoom=2)
    event("thermopylae", "1941-04-24", "温泉关后卫战掩护海撤", "安扎克与英国部队利用温泉关地区地形守住通向雅典的道路，为各港口装船争取时间。德军装甲和山地部队继续试探、迂回。盟军在24日至25日夜间放弃阵地，并不是打算长期固守整条希腊本土战线。", "thermopylae", [AWM, US3], "NZ", importance=1, units=["nz.6b_mainland","au.6d_mainland","gb.1armb_mainland","de.5pz"], end="1941-04-25", zoom=5)
    event("demon_evacuation", "1941-04-24", "恶魔行动：从希腊本土撤离", "盟军由拉菲纳、梅加拉、纳夫普利翁和伯罗奔尼撒其他港口分批撤离，主要在夜间装船。部队目的地包括克里特和图外埃及，许多重装备不得不遗弃；海路箭头表示运输，不把地面棋子画成渡海推进。", "piraeus", [AWM, US3], "GB", "naval", importance=1, units=["gb.wforce","au.6d_mainland","nz.2d_mainland"], end="1941-04-30", zoom=2, sfx=["ship_gun","morse"])
    event("corinth_airborne", "1941-04-26", "德军空降科林斯运河", "德国伞兵在科林斯地峡降落，试图截断英联邦部队向伯罗奔尼撒撤退。运河桥在爆炸中被毁，给德国后续坦克造成困难；临时架桥后机动部队继续追向南岸港口。", "corinth", [US3, AWM], "DE", "air", importance=1, units=["de.5pz"], zoom=5, sfx=["bomber","explosion"])
    event("athens_falls", "1941-04-27", "德军进入雅典", "德国装甲先头部队进入雅典，希腊大陆政治与交通中心被占领。盟军尚在伯罗奔尼撒和沿海港口装船，政府与军人已转移；雅典陷落并不意味着克里特在同一天落入轴心国控制。", "athens", [US3, AWM], "DE", "movement", importance=1, units=["de.2pz","de.12a"], zoom=3)
    event("kalamata", "1941-04-29", "德军到达卡拉马塔，撤离进入尾声", "德军第5装甲师分队到达伯罗奔尼撒南岸，未及时登船的盟军官兵仍在港口周边作战或等待运输。舰艇无法救走所有人，部分人员被俘；不同港口的撤离完成时间也不相同。", "kalamata", [US3, AWM], "DE", importance=1, units=["de.5pz","au.17b_mainland"], zoom=4)
    event("mainland_end", "1941-04-30", "大陆战役结束，战场转向克里特", "南斯拉夫与希腊大陆的正规战役告一段落，轴心国控制大陆主要战区。海撤的盟军在克里特或埃及重新组织，德国开始准备岛上空降行动。主地图仍将克里特留在盟军控制，岛内战线从5月20日开始变化。", "monemvasia", [US3, AWM], "DE", "movement", importance=1, zoom=1)
    event("crete_preparation_mainland", "1941-05-15", "大陆机场与港口准备克里特行动", "德国在希腊大陆整补航空兵、运输机和山地部队，盟军则在克里特安排防御。大陆战线在这段时间保持稳定；出现在雅典地区的集结单位不表示它们已经登陆岛上，空降和海运将由后续章节展示。", "athens", [US3, AWM], "DE", "movement", importance=2, units=["de.5geb"], zoom=2, confidence="medium")


def polygon_list(g):
    # 国界相接、裁切和union产生的极细毛刺要先在GEOS中以固定精度重建。
    # 简化后再随意round坐标会把合法微缝压成自交环，不能只在JSON层舍位。
    g = make_valid(set_precision(g, 0.00001, mode="valid_output"))
    if g.is_empty: return []
    if isinstance(g, Polygon): polys=[g]
    elif isinstance(g, MultiPolygon): polys=list(g.geoms)
    elif isinstance(g, GeometryCollection):
        return [p for x in g.geoms for p in polygon_list(x)]
    else:return []
    out=[]
    for p in polys:
        if p.area<0.00008:continue
        p=make_valid(set_precision(p.simplify(0.008,preserve_topology=True), 0.00001, mode="valid_output"))
        if not isinstance(p, Polygon):
            out.extend(polygon_list(p));continue
        def ring_points(coords):
            pts=[]
            for x,y in coords:
                q=[round(x,6),round(y,6)]
                if not pts or q!=pts[-1]:pts.append(q)
            if pts and pts[0]==pts[-1]:pts.pop()
            # 去掉舍位后出现的微小共线折返点；算法自动连接末点和首点。
            changed=True
            while changed and len(pts)>3:
                changed=False
                for i in range(len(pts)):
                    a,b,c=pts[i-1],pts[i],pts[(i+1)%len(pts)]
                    cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
                    if abs(cross)<1e-10:
                        pts.pop(i);changed=True;break
            return pts
        shell=ring_points(p.exterior.coords)
        holes=[ring_points(h.coords) for h in p.interiors]
        if len(shell)>=3:out.append([shell]+[h for h in holes if len(h)>=3])
    return out


def north_of(line):
    # 西→东的示意战线；上方是轴心控制。国界最后由真实AL形状裁切。
    return Polygon([[12.5,48.0],[29.5,48.0],[29.5,line[-1][1]],*list(reversed(line)),[12.5,line[0][1]],[12.5,48.0]])


def make_fronts():
    country_file=ROOT/".work/a/countries1939.geojson"
    if not country_file.exists():country_file=ROOT/"public/geo/balkans1940.geojson"
    countries=json.loads(country_file.read_text())
    by_id={f["properties"]["id"]:shape(f["geometry"]) for f in countries["features"]}
    clip=box(12.5,34.5,29.5,48)
    al=by_id["AL"].intersection(clip);yu=by_id["YU"].intersection(clip)
    gr=by_id["GR"].intersection(clip)
    comps=list(gr.geoms) if isinstance(gr,MultiPolygon) else [gr]
    largest=max(comps,key=lambda p:p.area)
    # 大陆 + 埃维亚等贴岸岛屿；远方岛屿不能因大陆投降自动提前全被占。
    gr_main=unary_union([p for p in comps if p.centroid.y>36 and (p==largest or p.distance(largest)<0.15)])
    land_main=unary_union([al,yu,gr_main])
    frontline={
        "nov18":[[19.85,39.82],[20.12,39.93],[20.43,40.16],[20.73,40.45],[20.99,40.62]],
        "nov22":[[19.82,39.90],[20.12,40.01],[20.37,40.16],[20.61,40.51],[20.80,40.77],[21.05,40.82]],
        "nov30":[[19.78,39.94],[20.10,40.08],[20.35,40.27],[20.55,40.68],[20.75,40.98],[21.05,41.00]],
        "dec08":[[19.68,40.02],[19.96,40.12],[20.16,40.20],[20.37,40.37],[20.53,40.74],[20.75,40.98],[21.05,41.00]],
        "dec22":[[19.57,40.18],[19.89,40.23],[20.04,40.25],[20.25,40.28],[20.47,40.78],[20.75,40.98],[21.05,41.00]],
        "winter":[[19.57,40.21],[19.89,40.23],[20.04,40.27],[20.18,40.36],[20.34,40.42],[20.48,40.83],[20.75,41.01],[21.05,41.02]],
        "apr16":[[19.58,40.17],[19.88,40.17],[20.15,40.21],[20.42,40.34],[20.62,40.72],[20.98,40.84]],
        "apr20":[[19.8,39.88],[20.15,40.05],[20.40,40.10],[20.71,40.27],[20.95,40.50]],
    }
    def alb(k):return al.intersection(north_of(frontline[k]))
    epirus_tip=Polygon([[19.99,39.81],[20.18,39.45],[20.48,39.56],[20.66,39.80],[20.82,39.99],[20.55,40.16],[19.99,39.81]])
    pindus_tip=Polygon([[20.53,40.22],[20.78,40.18],[21.08,39.99],[21.16,40.04],[21.05,40.25],[20.70,40.37],[20.53,40.22]])
    peak=unary_union([al,epirus_tip.intersection(gr_main),pindus_tip.intersection(gr_main)])
    reduced=unary_union([al,epirus_tip.intersection(box(12.5,39.7,29.5,48)).intersection(gr_main)])
    frames=[]
    def frame(date, geom, note, sources=None, conf="medium"):
        if not geom.is_valid:geom=geom.buffer(0)
        if not geom.is_valid:raise RuntimeError(date+": "+explain_validity(geom))
        frames.append({"at":at(date),"DE":polygon_list(geom.intersection(clip)),"SU":[],"note":note,"sources":sources or [US3,GK,GH,GS],"confidence":conf})
    frame("1940-10-28T00:00",al,"开战前：意大利已控制阿尔巴尼亚；希腊未被入侵，南斯拉夫不在战区。",["land_borders",G0],"high")
    frame("1940-10-28T05:29",al,"越境前；避免插值让意军在实际开战前进入希腊。",[G0],"high")
    frame("1940-10-30",unary_union([al,epirus_tip.intersection(box(12.5,39.8,29.5,48)).intersection(gr_main)]),"伊庇鲁斯掩护部队后撤，意军逼近主防线。",[G0],"low")
    frame("1940-11-02",peak,"意军推进至卡尔帕基、卡拉马斯及品都斯突出部；控制范围为区域示意。",[G0],"low")
    frame("1940-11-05",reduced,"朱利亚师突出部被反击，意军海岸与卡尔帕基方向仍承受阻击。",[G0],"low")
    frame("1940-11-08",al,"品都斯主要突进已被打退，战线逐渐返回国境。",[G0],"medium")
    frame("1940-11-13",al,"希军恢复国境防御，即将展开全面反攻。",[G0],"medium")
    frame("1940-11-14",al,"全面反攻开始，国境外的控制变化从此后关键帧渐进表现。",[GK,GH],"medium")
    frame("1940-11-18",alb("nov18"),"希军在莫拉瓦高地突破，科尔察方向意军防线后缩。",[GK])
    frame("1940-11-22",alb("nov22"),"希军占领科尔察；意军仍控制波格拉德茨以北和阿尔巴尼亚中部。",[GK])
    frame("1940-11-30",alb("nov30"),"希军抵达波格拉德茨，海岸及德里诺河谷继续争夺。",[GK,GH])
    frame("1940-12-06",alb("dec08"),"萨兰达、德尔维纳方向退却；阿尔巴尼亚南部控制为阶段示意。",[GH],"low")
    frame("1940-12-08",alb("dec08"),"吉诺卡斯特已失；特佩莱讷与发罗拉仍属意军控制。",[GH])
    frame("1940-12-22",alb("dec22"),"希军在希马拉方向获胜，但没有夺取发罗拉。",[GH])
    frame("1941-01-10",alb("winter"),"克利苏拉隘口失守，希军控制阿尔巴尼亚南部一带。",[GS])
    for d in ["1941-01-11","1941-02-01","1941-03-01","1941-03-08","1941-03-09","1941-03-16","1941-04-05T23:59"]:
        frame(d,alb("winter"),"冬季基本战线维持：春季攻势未造成决定性控制区变化；南斯拉夫保持中立。",[GS,US3])
    # 4月跨国进攻：德军几个不相连的轴线分别扩大，最后才连成控制区。
    y_south=Polygon([[22.95,43.0],[23.0,41.1],[21.22,40.85],[21.15,41.75],[21.55,42.15],[22.95,43.0]])
    y_nis=Polygon([[23.4,44.3],[23.4,42.45],[21.7,42.85],[21.55,43.4],[21.7,43.72],[23.4,44.3]])
    g_east=Polygon([[22.65,41.55],[26.8,42.0],[26.8,40.2],[22.82,40.54],[22.6,40.97],[22.65,41.55]])
    y_north=Polygon([[12.5,48],[24.0,48],[24.0,45.3],[20.5,44.70],[18.0,45.1],[16.0,45.6],[14.5,45.8],[12.5,45.8],[12.5,48]])
    drava_bridgeheads=unary_union([box(16.45,46.08,17.05,46.65),box(15.3,46.45,16.0,47)])
    # 2装甲师6日到达Strumica；此桥头在7日继续保持，不能从控制区中消失。
    strumica_corridor=Polygon([[23.00,41.68],[23.24,41.55],[22.55,41.30],[22.45,41.52],[22.82,41.80],[23.00,41.68]])
    italian_link=Polygon([[13.9,45.5],[14.1,46.2],[14.8,46.35],[15.55,45.6],[15.5,45.15],[14.5,45.2],[13.9,45.5]])
    def controlled_yu(ydate):
        if ydate==6:return yu.intersection(unary_union([drava_bridgeheads,strumica_corridor]))
        if ydate==7:return yu.intersection(unary_union([y_south.intersection(box(21.1,41.7,23.1,44)),drava_bridgeheads,strumica_corridor]))
        if ydate==9:return yu.intersection(unary_union([y_south,y_nis,box(15.2,46.08,17.5,47)]))
        if ydate==10:return yu.intersection(unary_union([y_south,y_nis,y_north.intersection(box(15.65,34.5,24,48))]))
        if ydate==12:return yu.intersection(unary_union([y_south,y_nis,y_north,italian_link,box(19.0,43.75,22.5,46.1)]))
        if ydate==15:return yu.intersection(unary_union([y_south,y_nis,y_north,box(17.9,43.6,24,46.1),box(12.5,44.0,17.9,48)]))
        return yu
    def greek_north(southline):return gr_main.intersection(north_of(southline))
    greek_fronts={
        12:[[19.5,40.3],[21.1,40.75],[21.8,40.65],[22.5,40.62],[23.0,40.55],[27.0,40.55]],
        14:[[19.5,40.25],[20.7,40.25],[21.3,40.32],[21.8,40.22],[22.2,40.25],[22.6,40.18],[27.0,40.5]],
        16:[[19.5,40.2],[20.7,40.12],[21.1,39.96],[21.8,39.89],[22.35,39.91],[22.65,39.98],[27.0,40.5]],
        18:[[19.5,40.1],[20.7,39.85],[21.4,39.69],[22.1,39.78],[22.55,39.78],[27.0,40.1]],
        20:[[19.5,39.9],[20.5,39.75],[21.1,39.55],[21.7,39.12],[22.4,38.85],[23.05,39.15],[27.0,39.2]],
        23:[[19.5,39.0],[20.5,39.0],[21.1,38.9],[21.7,38.83],[22.5,38.83],[23.1,38.7],[27.0,38.8]],
        25:[[19.0,38.1],[21.5,38.15],[22.0,38.1],[23.0,38.3],[23.8,38.2],[27.0,38.3]],
        27:[[19.0,38.0],[21.4,37.95],[22.1,37.8],[22.75,37.7],[23.1,37.55],[24.3,37.6],[27.0,38.1]],
        29:[[19.0,36.9],[21.3,36.8],[22.3,36.75],[22.9,36.7],[24.3,36.8],[27.0,37.3]],
    }
    frame("1941-04-06T00:00",alb("winter"),"德国进攻前：南斯拉夫刚进入战区；希意冬季战线未变。",[US2,US3,GS])
    frame("1941-04-06T18:00",unary_union([alb("winter"),controlled_yu(6),g_east.intersection(gr_main).intersection(box(22.5,41.25,29.5,48))]),"北部边境桥头与希腊国境最初进攻，仍是几个局部突破。",[US2,US3],"low")
    frame("1941-04-07",unary_union([alb("winter"),controlled_yu(7),g_east.intersection(gr_main).intersection(box(22.5,41.1,29.5,48))]),"斯科普里交通线被切断，梅塔克萨斯要塞仍抵抗。",[US2,US3],"low")
    frame("1941-04-09",unary_union([alb("winter"),controlled_yu(9),g_east.intersection(gr_main)]),"萨洛尼卡陷落、东马其顿投降；尼什轴线推进。",[US2,US3])
    frame("1941-04-10",unary_union([alb("winter"),controlled_yu(10),g_east.intersection(gr_main)]),"萨格勒布陷落；西北、摩拉瓦与南方推进轴线逐渐展开。",[US2,US3])
    frame("1941-04-12",unary_union([alb("winter"),controlled_yu(12),greek_north(greek_fronts[12])]),"贝尔格莱德遭三路夹击；韦维守军败退。",[US2,US3,AWM])
    frame("1941-04-14",unary_union([alb("winter"),controlled_yu(12),greek_north(greek_fronts[14])]),"德军进入科扎尼、卡泰里尼一带；希军在阿尔巴尼亚开始撤退。",[US2,US3,AWM])
    frame("1941-04-15",unary_union([alb("winter"),controlled_yu(15),greek_north(greek_fronts[14])]),"南斯拉夫军退向内陆仍遭快速追击；希腊北部山口防线破裂。",[US2,US3,AWM],"low")
    frame("1941-04-16",unary_union([alb("apr16"),controlled_yu(15),greek_north(greek_fronts[16])]),"阿尔巴尼亚前线希军南撤，德军接近坦佩与埃拉索纳。",[US2,US3,AWM])
    frame("1941-04-18T11:59",unary_union([alb("apr16"),controlled_yu(15),greek_north(greek_fronts[18])]),"南斯拉夫停战生效前，希腊盟军实施后卫战。",[US2,US3,AWM],"low")
    frame("1941-04-18T12:00",unary_union([alb("apr16"),yu,greek_north(greek_fronts[18])]),"南斯拉夫停战正式生效，正规军抵抗终止。",[US2,US3])
    frame("1941-04-20",unary_union([alb("apr20"),yu,greek_north(greek_fronts[20])]),"德军切断梅措沃方向；西部希军开始接洽投降，英联邦退向温泉关。",[US3,AWM])
    frame("1941-04-23",unary_union([al,yu,greek_north(greek_fronts[23])]),"西部希军向德意投降，阿尔巴尼亚恢复轴心国控制；温泉关仍有后卫阵地。",[US3,AWM])
    frame("1941-04-25",unary_union([al,yu,greek_north(greek_fronts[25])]),"盟军放弃温泉关，港口海撤继续。",[US3,AWM])
    frame("1941-04-27",unary_union([al,yu,greek_north(greek_fronts[27])]),"雅典陷落，伯罗奔尼撒南部仍有撤离部队。",[US3,AWM])
    frame("1941-04-29",unary_union([al,yu,greek_north(greek_fronts[29])]),"德军到达卡拉马塔及南岸，少数盟军仍在装船或抵抗。",[US3,AWM])
    for d in ["1941-04-30","1941-05-19T23:59"]:
        frame(d,land_main,"大陆战区已受轴心国控制；远方尚未占领的岛屿不随大陆投降填色，克里特无轴心控制。",[US3,AWM,"land_borders"])
    # 每次只清理本代理负责的大陆帧，不触碰5/20及以后克里特帧。
    out=DATA/"fronts";out.mkdir(parents=True,exist_ok=True)
    for old in out.glob("*.json"):
        try:
            date=json.loads(old.read_text()).get("at","")
            if "1940-10-28T00:00"<=date<"1941-05-20T00:00":old.unlink()
        except (ValueError,OSError):pass
    for f in frames:dump("fronts/"+f["at"].replace(":","-")+".json",f)
    return frames


EQUIPMENT = [
    {"id":"land_pz2","side":"DE","name":{"zh":"二号坦克","orig":"Panzer II","short":"Pz.II"},"class":"tank_light","crew":3,"gun":"20毫米机关炮","model":"pz2","desc":"德军装甲师中的轻型坦克，用于侦察和支援机动步兵。巴尔干山区限制其道路选择，数量和轻装甲不能替代桥梁、通信、炮兵与步兵协同。","sources":[US2,US3]},
    {"id":"land_pz3","side":"DE","name":{"zh":"三号坦克","orig":"Panzer III","short":"Pz.III"},"class":"tank_medium","crew":5,"model":"pz3","desc":"德军装甲师的主力型号之一，与其他轻、中型坦克共同组成纵队。装甲部队的快速推进依靠无线电、道路和补给；在峡谷和被爆破的桥梁前仍需等待工兵和步兵。","sources":[US3]},
    {"id":"land_pz4","side":"DE","name":{"zh":"四号坦克","orig":"Panzer IV","short":"Pz.IV"},"class":"tank_medium","crew":5,"gun":"75毫米短管炮","model":"pz4","desc":"1941年主要承担火力支援任务，以短管75毫米炮打击据点和步兵目标。沙盘模型表现早期四号坦克，巴尔干进攻中不应使用后期长管重型型号替代。","sources":[US3]},
    {"id":"land_pz38t","side":"DE","name":{"zh":"38(t)坦克","orig":"Panzer 38(t)","short":"38(t)"},"class":"tank_light","crew":4,"model":"pz38t","desc":"原捷克制造的轻型坦克，被编入德军装甲部队，第8装甲师以其为重要装备。地图中的德军机动突破仍受山路、桥梁和交通堵塞制约，不能仅用单车性能解释胜负。","sources":[US2]},
    {"id":"land_l3","side":"IT","name":{"zh":"L3轻型坦克","orig":"Carro Veloce L3/33–L3/35","short":"L3"},"class":"tankette","crew":2,"desc":"意军半人马师使用的轻型履带车辆，火力与防护有限。狭窄山路、泥泞和希军反坦克火力削弱了装甲冲击效果，车辆往往以小股分队支援步兵，难以形成平原上的集中突破。","sources":[G0,GK]},
    {"id":"land_bren","side":"GB","name":{"zh":"布伦轻机枪","orig":"Bren light machine gun","short":"Bren"},"class":"small_arms","desc":"英联邦步兵班的重要自动武器，澳大利亚、新西兰和英国部队均使用。撤退中的山口与峡谷阻击需要机枪、迫击炮和炮兵配合；许多支援装备在海撤前被遗弃或破坏。","sources":[AWM]},
    {"id":"land_25pdr","side":"GB","name":{"zh":"25磅野战炮","orig":"Ordnance QF 25-pounder","short":"25 pdr"},"class":"gun","model":"art_gun","desc":"英联邦炮兵的主要野战炮之一，在山口和后卫战中支援步兵。这里的手办是通用野战炮示意，重点是炮兵如何掩护撤退；具体炮位和撤离数量随部队不同而变化。","sources":[AWM]},
]


def side_summary(name, commander, divisions, men=None, note="", tanks=None, aircraft=None, guns=None):
    return {"name":name,"commander":commander,"men":men,"divisions":divisions,"tanks":tanks,"aircraft":aircraft,"guns":guns,"losses":{"killed":"各阶段与来源统计口径不同","wounded":"未统一估计","captured":"见各阶段投降与撤离事件"},"note":note}


def make_forces():
    it=side_summary("意大利","普拉斯卡→索杜→卡瓦莱罗；第11集团军由格洛索指挥","开战主攻约8个师，冬季持续增援",note="开局第25军约4.2万人、第26军约4.4万人、朱利亚师约1.08万人。各数字为方向或单位口径，不加成全国参战总数。")
    gr=side_summary("希腊","帕帕戈斯；第8师卡齐米特罗斯；西部军团区指挥随阶段变化","动员后14个师左右投入阿尔巴尼亚前线",note="第8师加强后约3.5万人；1941年东马其顿国境防御约7万人。两者是不同地域、时期，不能作为全军兵力直接比较。")
    de=side_summary("德国","李斯特、魏克斯与克莱斯特","第12、第2集团军及独立机动集团",note="第1装甲集群临时改向南斯拉夫；计划编制与及时赶到的攻击部队并不完全相同。")
    yu=side_summary("南斯拉夫","西莫维奇；最高统帅部与各集团军","多支集团军，动员尚未完成",note="正规军编制数不等于已到位、可协同作战的战斗力；4/17签署投降、4/18中午生效。")
    gb=side_summary("英国与W Force指挥","威尔逊；英国第1装甲旅及空地勤部队","1940年秋已有RAF援助，1941年3月海运陆军增援",note="W Force总规模约数取决于是否包括空军、后勤与希腊单位；澳新兵力在各自栏显示，不再计入英国总数。")
    au=side_summary("澳大利亚","布莱米；第6师麦凯","第1军司令部、第6师及16/17/19旅",note="3月分批登陆，4月南撤后部分人员往克里特、其余往埃及。")
    nz=side_summary("新西兰","弗赖伯格","第2师及4/5/6旅",note="不是4月6日才首次参战；3月已完成主要登陆和北部展开。")
    hu=side_summary("匈牙利","第3集团军","4月11日起越境，占领北部地区",note="提供德军通行及后续北部攻势，未参与梅塔克萨斯线最初突破。")
    bg=side_summary("保加利亚","保加利亚政府与军方","德军通行、集结及后续占领区进驻",note="3月加入三国同盟；4月6日进攻矛头是德军，保军随后进驻占领区。")
    sides={"IT":it,"GR":gr,"DE":de,"YU":yu,"GB":gb,"AU":au,"NZ":nz,"HU":hu,"BG":bg}
    invasion={"IT":dict(it,divisions="第25、26军与独立朱利亚师等"),"GR":dict(gr,divisions="第8加强师、品都斯支队及逐步动员部队"),"GB":dict(gb,divisions="有限RAF与地勤、防空援助；大陆远征军尚未登陆")}
    counter={"IT":dict(it,divisions="第9、第11集团军不断获得增援"),"GR":dict(gr,divisions="第1、第2、第3军沿各轴线反攻"),"GB":dict(gb,divisions="航空援助；无澳新主力大陆师")}
    winter={"IT":dict(it,divisions="1月初约19师在阿尔巴尼亚；3月春季攻势集中第8军"),"GR":dict(gr,divisions="1月初约14师在阿尔巴尼亚；3月英联邦主力开始登陆"),"GB":gb,"AU":au,"NZ":nz,"DE":dict(de,divisions="3月进入保加利亚集结；尚未入侵希腊")}
    attack={k:sides[k] for k in ["DE","IT","GR","YU","GB","AU","NZ","HU","BG"]}
    evac={k:sides[k] for k in ["DE","IT","GR","GB","AU","NZ","BG"]}
    return {"sides":sides,"byPhase":{"invasion":invasion,"counterattack":counter,"winter":winter,"invasion1941":attack,"evacuation":evac},"sources":[G0,GK,GS,US2,US3,AWM]}


def checks(frames):
    seen=set()
    for u in UNITS:
        assert u["id"] not in seen,u["id"];seen.add(u["id"])
        assert all(a["at"]<b["at"] for a,b in zip(u["track"],u["track"][1:])),u["id"]
    units={u["id"]:u for u in UNITS}
    for u in UNITS:
        if u["parent"]:
            assert u["parent"] in units,u["id"]
            assert units[u["parent"]]["side"]==u["side"],u["id"]
    sources={s["id"] for s in SOURCES};gaz={p["id"] for p in PLACES}
    def inspect(obj):
        if isinstance(obj,dict):
            if "sources" in obj:assert all(s in sources for s in obj["sources"]),obj
            if "pos" in obj:
                p=obj["pos"]
                if isinstance(p,str):assert p[1:] in gaz,p
                else:assert 12.5<=p[0]<=29.5 and 34.5<=p[1]<=48,p
            for x in obj.values():inspect(x)
        elif isinstance(obj,list):
            for x in obj:inspect(x)
    inspect([UNITS,ROUTES,EVENTS,EQUIPMENT,frames])
    for e in EVENTS:
        assert all(u in units for u in e.get("units",[])),e["id"]
        assert e["precision"]!="day" or e["at"].endswith("T12:00"),e["id"]
    assert not any(p[1]<36.0 for poly in frames[-1]["DE"] for ring in poly for p in ring),"final mainland frame touches Crete latitude"


def main():
    make_units()
    for u in UNITS:
        # 本代理的海撤终点是海路接续点或图幅边缘，尚未描绘登陆。
        # 否则最后一个轨迹点缺省land，会在海中重新出现步兵手办。
        rows = u["track"]
        if len(rows) > 1 and rows[-2].get("movement") in ("sea", "air"):
            rows[-1]["movement"] = rows[-2]["movement"]
            rows[-1]["note"] = "海路/空路接续点；抵达后的编组见克里特章节或图外埃及。"
        for p in rows:
            if u["side"] in ("GB", "AU", "NZ") and "1941-04-12" <= p["at"] <= "1941-04-30T23:59" and p.get("movement", "land") == "land":
                p["note"] = "英联邦南撤分段使用卡车等车辆运输；旅师轨迹表示作战重心，时间为阶段示意。"
    make_routes();make_events()
    EVENTS.sort(key=lambda e:(e["at"],e["id"]))
    frames=make_fronts()
    checks(frames)
    dump("gazetteer/mainland.json",PLACES)
    dump("oob/mainland.json",UNITS)
    dump("routes/mainland.json",ROUTES)
    dump("sources/mainland.json",SOURCES)
    # 包围突出部范围在关键帧中不够精确，不伪造单一完整包围圈。
    dump("fragments/mainland.json",{"events":EVENTS,"pockets":[],"equipment":EQUIPMENT,"forces":make_forces()})
    print(json.dumps({"places":len(PLACES),"units":len(UNITS),"routes":len(ROUTES),"events":len(EVENTS),"fronts":len(frames),"equipment":len(EQUIPMENT)},ensure_ascii=False))


if __name__=="__main__":main()
