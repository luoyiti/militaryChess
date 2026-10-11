"""写出法国战役基础版的 src/data。可重复执行。"""
import json
from pathlib import Path

from shapely.geometry import Polygon
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src/data"
SRC = ["frieser", "horne"]


def dump(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def place(i, zh, orig, lon, lat, kind, rank, country, alt=None):
    p = {"id": i, "zh": zh, "orig": orig, "pos": [lon, lat], "kind": kind, "rank": rank, "country1939": country}
    if alt:
        p["alt"] = alt
    return p


def unit(i, side, ech, typ, parent, zh, orig, short, cmd, track, **kw):
    u = {
        "id": i, "side": side, "echelon": ech, "type": typ, "parent": parent,
        "name": {"zh": zh, "orig": orig, "short": short},
        "commander": {"zh": cmd[0], "orig": cmd[1]},
        "track": track,
        "sources": kw.get("sources", SRC),
        "confidence": kw.get("confidence", "medium"),
    }
    for k in ("model", "active", "history", "equipment", "strength"):
        if k in kw:
            u[k] = kw[k]
    return u


def pt(at, lon, lat, status=None, note=None):
    p = {"at": at, "pos": [round(lon, 2), round(lat, 2)]}
    if status:
        p["status"] = status
    if note:
        p["note"] = note
    return p


PLACES = [
    place("paris", "巴黎", "Paris", 2.35, 48.86, "capital", 1, "FR"),
    place("london", "伦敦", "London", -0.12, 51.51, "capital", 1, "GB"),
    place("brussels", "布鲁塞尔", "Bruxelles", 4.35, 50.85, "capital", 1, "BE"),
    place("amsterdam", "阿姆斯特丹", "Amsterdam", 4.90, 52.37, "capital", 1, "NL"),
    place("lyon", "里昂", "Lyon", 4.83, 45.76, "city", 2, "FR"),
    place("rotterdam", "鹿特丹", "Rotterdam", 4.48, 51.92, "city", 2, "NL"),
    place("the_hague", "海牙", "Den Haag", 4.30, 52.08, "city", 2, "NL"),
    place("antwerp", "安特卫普", "Antwerpen", 4.40, 51.22, "city", 2, "BE"),
    place("liege", "列日", "Liège", 5.57, 50.63, "city", 2, "BE"),
    place("lille", "里尔", "Lille", 3.06, 50.63, "city", 2, "FR"),
    place("dunkirk", "敦刻尔克", "Dunkerque", 2.38, 51.04, "port", 2, "FR"),
    place("sedan", "色当", "Sedan", 4.94, 49.70, "city", 2, "FR"),
    place("reims", "兰斯", "Reims", 4.03, 49.26, "city", 2, "FR"),
    place("amiens", "亚眠", "Amiens", 2.30, 49.89, "city", 2, "FR"),
    place("strasbourg", "斯特拉斯堡", "Strasbourg", 7.75, 48.57, "city", 2, "FR"),
    place("metz", "梅斯", "Metz", 6.18, 49.12, "city", 2, "FR"),
    place("nancy", "南锡", "Nancy", 6.18, 48.69, "city", 2, "FR"),
    place("orleans", "奥尔良", "Orléans", 1.91, 47.90, "city", 2, "FR"),
    place("rouen", "鲁昂", "Rouen", 1.09, 49.44, "city", 2, "FR"),
    place("rennes", "雷恩", "Rennes", -1.68, 48.11, "city", 2, "FR"),
    place("cologne", "科隆", "Köln", 6.96, 50.94, "city", 2, "DE"),
    place("dover", "多佛尔", "Dover", 1.31, 51.13, "port", 2, "GB"),
    place("luxembourg", "卢森堡", "Luxembourg", 6.13, 49.61, "capital", 2, "LU"),
    place("calais", "加来", "Calais", 1.86, 50.95, "port", 3, "FR"),
    place("boulogne", "布洛涅", "Boulogne", 1.61, 50.73, "port", 3, "FR"),
    place("abbeville", "阿布维尔", "Abbeville", 1.83, 50.11, "town", 3, "FR"),
    place("arras", "阿拉斯", "Arras", 2.78, 50.29, "city", 3, "FR"),
    place("cambrai", "康布雷", "Cambrai", 3.23, 50.17, "town", 3, "FR"),
    place("st_quentin", "圣康坦", "Saint-Quentin", 3.29, 49.85, "town", 3, "FR"),
    place("peronne", "佩罗讷", "Péronne", 2.93, 49.93, "town", 3, "FR"),
    place("laon", "拉昂", "Laon", 3.62, 49.56, "town", 3, "FR"),
    place("montcornet", "蒙特科尔内", "Montcornet", 4.02, 49.70, "village", 3, "FR"),
    place("compiegne", "贡比涅", "Compiègne", 2.83, 49.42, "town", 3, "FR"),
    place("dinant", "迪南", "Dinant", 4.91, 50.26, "town", 3, "BE"),
    place("namur", "那慕尔", "Namur", 4.87, 50.47, "city", 3, "BE"),
    place("charleville", "沙勒维尔", "Charleville", 4.72, 49.77, "town", 3, "FR"),
    place("eben_emael", "埃本-埃马尔", "Eben-Emael", 5.68, 50.80, "fort", 3, "BE"),
    place("maastricht", "马斯特里赫特", "Maastricht", 5.69, 50.85, "city", 3, "NL"),
    place("ghent", "根特", "Gent", 3.72, 51.05, "city", 3, "BE"),
    place("bruges", "布鲁日", "Brugge", 3.22, 51.21, "city", 3, "BE"),
    place("breda", "布雷达", "Breda", 4.78, 51.59, "town", 3, "NL"),
    place("utrecht", "乌得勒支", "Utrecht", 5.12, 52.09, "city", 3, "NL"),
    place("groningen", "格罗宁根", "Groningen", 6.57, 53.22, "city", 3, "NL"),
    place("bastogne", "巴斯托涅", "Bastogne", 5.72, 50.00, "town", 3, "BE"),
    place("bouillon", "布永", "Bouillon", 5.07, 49.79, "town", 4, "BE"),
    place("neufchateau", "讷沙托", "Neufchâteau", 5.43, 49.84, "town", 4, "BE"),
    place("gembloux", "让布卢", "Gembloux", 4.69, 50.56, "town", 3, "BE"),
    place("leuven", "鲁汶", "Leuven", 4.70, 50.88, "town", 3, "BE"),
    place("ostend", "奥斯坦德", "Oostende", 2.93, 51.22, "port", 3, "BE"),
    place("tours", "图尔", "Tours", 0.69, 47.39, "city", 3, "FR"),
    place("chartres", "沙特尔", "Chartres", 1.49, 48.45, "city", 3, "FR"),
    place("le_havre", "勒阿弗尔", "Le Havre", 0.11, 49.49, "port", 3, "FR"),
    place("caen", "卡昂", "Caen", -0.37, 49.18, "city", 3, "FR"),
    place("cherbourg", "瑟堡", "Cherbourg", -1.62, 49.64, "port", 3, "FR"),
    place("dijon", "第戎", "Dijon", 5.04, 47.32, "city", 3, "FR"),
    place("troyes", "特鲁瓦", "Troyes", 4.07, 48.30, "town", 3, "FR"),
    place("verdun", "凡尔登", "Verdun", 5.38, 49.16, "city", 3, "FR"),
    place("saarbrucken", "萨尔布吕肯", "Saarbrücken", 6.99, 49.24, "city", 3, "DE"),
    place("aachen", "亚琛", "Aachen", 6.08, 50.78, "city", 3, "DE"),
    place("trier", "特里尔", "Trier", 6.64, 49.76, "city", 3, "DE"),
    place("koblenz", "科布伦茨", "Koblenz", 7.59, 50.36, "city", 3, "DE"),
    place("bitburg", "比特堡", "Bitburg", 6.52, 49.97, "town", 4, "DE"),
    place("kleve", "克莱沃", "Kleve", 6.14, 51.79, "town", 4, "DE"),
    place("montherme", "蒙泰尔梅", "Monthermé", 4.73, 49.88, "village", 4, "FR"),
    place("gravelines", "格拉沃利讷", "Gravelines", 2.13, 50.98, "town", 4, "FR"),
    place("philippeville", "菲利普维尔", "Philippeville", 4.54, 50.20, "town", 4, "BE"),
    place("landrecies", "朗德勒西", "Landrecies", 3.69, 50.12, "village", 4, "FR"),
    place("le_crotoy", "勒克罗图瓦", "Le Crotoy", 1.63, 50.22, "village", 4, "FR"),
    place("st_valery", "圣瓦莱里", "Saint-Valery-en-Caux", 0.71, 49.87, "town", 4, "FR"),
    place("langres", "朗格勒", "Langres", 5.33, 47.86, "town", 4, "FR"),
    place("pontarlier", "蓬塔利耶", "Pontarlier", 6.36, 46.90, "town", 4, "FR"),
    place("belfort", "贝尔福", "Belfort", 6.86, 47.64, "town", 3, "FR"),
    place("colmar", "科尔马", "Colmar", 7.36, 48.08, "town", 3, "FR"),
    place("schleiden", "施莱登", "Schleiden", 6.47, 50.53, "town", 4, "DE"),
    place("rhenen", "雷嫩", "Rhenen", 5.57, 51.96, "town", 4, "NL"),
    place("bourges", "布尔日", "Bourges", 2.40, 47.08, "city", 3, "FR"),
    place("nantes", "南特", "Nantes", -1.55, 47.22, "city", 3, "FR"),
    place("chateau_thierry", "蒂耶里堡", "Château-Thierry", 3.40, 49.04, "town", 4, "FR"),
    place("rethel", "勒泰勒", "Rethel", 4.37, 49.51, "town", 4, "FR"),
    place("hirson", "伊尔松", "Hirson", 4.08, 49.92, "town", 4, "FR"),
]

# ---------- 战线 ----------
def ring(*pts):
    # 顶点必须落在 frame.bbox 内（-2.2, 45.6, 8.8, 53.55），这里再收一寸
    out = []
    for a, b in pts:
        a = min(8.75, max(-2.15, a))
        b = min(53.50, max(45.65, b))
        out.append([round(a, 2), round(b, 2)])
    return out


# 东端贴着 1940 年法德边界北侧折返，避免把马其诺和阿尔萨斯提前涂成德占。
F_MAY12 = ring(
    (6.30, 53.50), (6.00, 52.50), (5.70, 51.90), (5.50, 51.20), (5.30, 50.55),
    (5.00, 50.05), (4.85, 49.75), (5.40, 49.50), (6.20, 49.42), (7.00, 49.30),
    (7.90, 49.12), (8.75, 49.12), (8.75, 53.50), (6.30, 53.50),
)
F_MAY14 = ring(
    (5.30, 53.50), (5.20, 52.40), (5.00, 52.00), (4.70, 51.85), (5.00, 51.30),
    (5.20, 50.60), (4.80, 50.15), (4.15, 49.72), (5.20, 49.48), (6.10, 49.40),
    (7.00, 49.28), (7.90, 49.10), (8.75, 49.10), (8.75, 53.50), (5.30, 53.50),
)
F_MAY16 = ring(
    (3.40, 53.50), (3.50, 51.40), (3.60, 50.70), (3.30, 50.20), (2.90, 49.75),
    (3.50, 49.45), (4.60, 49.35), (5.50, 49.42), (6.30, 49.38), (7.10, 49.28),
    (7.90, 49.10), (8.75, 49.10), (8.75, 53.50), (3.40, 53.50),
)
F_CORRIDOR = ring(
    (1.55, 50.02), (2.15, 49.92), (2.85, 49.90), (3.35, 49.78), (3.85, 49.48),
    (4.70, 49.40), (5.50, 49.42), (6.30, 49.38), (7.10, 49.28), (7.90, 49.10),
    (8.75, 49.10), (8.75, 53.50), (3.30, 53.50), (1.45, 53.20), (1.40, 51.30), (1.55, 50.02),
)
HOLE_MAY20 = ring(
    (2.00, 51.10), (3.40, 51.30), (3.80, 50.75), (3.45, 50.18), (2.40, 50.22), (2.00, 50.85),
)
HOLE_MAY24 = ring(
    (1.85, 51.10), (3.20, 51.05), (3.35, 50.50), (2.70, 50.48), (1.90, 50.90),
)
HOLE_DUNKIRK = ring((2.15, 51.10), (2.65, 51.08), (2.70, 50.95), (2.20, 50.92))
HOLE_LILLE = ring((2.85, 50.75), (3.25, 50.75), (3.30, 50.50), (2.85, 50.50))
F_SOMME = ring(
    (1.50, 50.15), (2.40, 49.90), (2.90, 49.93), (3.50, 49.60), (4.20, 49.42),
    (4.80, 49.40), (5.50, 49.40), (6.40, 49.35), (7.20, 49.25), (7.90, 49.08),
    (8.75, 49.08), (8.75, 53.50), (1.50, 53.50), (1.50, 50.15),
)
F_JUN14 = ring(
    (-2.30, 49.95), (-0.30, 49.20), (0.40, 48.85), (1.70, 48.45), (2.70, 48.35),
    (3.80, 48.55), (4.70, 48.85), (5.40, 49.15), (6.20, 49.45), (7.90, 49.55),
    (8.85, 49.55), (8.85, 53.60), (-2.30, 53.60), (-2.30, 49.95),
)
F_JUN22 = ring(
    (2.30, 45.55), (2.40, 47.08), (3.30, 46.85), (4.50, 46.55), (5.20, 46.40),
    (6.15, 46.20), (6.40, 45.55), (8.85, 45.55), (8.85, 53.60), (-2.30, 53.60),
    (-2.30, 45.55), (2.30, 45.55),
)

FRONTS = [
    ("1940-05-10T04:00", [], "开战前夜，战区边界仍在国境上。", "high"),
    ("1940-05-12T20:00", [[F_MAY12]], "德军进入荷兰东部、列日以东和卢森堡，阿登前锋接近默兹河。", "medium"),
    ("1940-05-14T20:00", [[F_MAY14]], "鹿特丹以东已失。色当、迪南出现桥头堡。要塞荷兰仍在。", "medium"),
    ("1940-05-16T20:00", [[F_MAY16]], "荷兰投降。突破部向圣康坦方向展开，布鲁塞尔一线动摇。", "medium"),
    ("1940-05-20T20:00", [[F_CORRIDOR, HOLE_MAY20]], "阿布维尔到达海峡。敦刻尔克—里尔—根特仍为同盟军口袋。", "medium"),
    ("1940-05-24T20:00", [[F_CORRIDOR, HOLE_MAY24]], "停止前进命令期间，口袋缩向敦刻尔克、加来和里尔。", "medium"),
    ("1940-05-28T20:00", [[F_CORRIDOR, HOLE_DUNKIRK, HOLE_LILLE]], "比利时投降。图上只剩敦刻尔克围圈和里尔。", "medium"),
    ("1940-06-04T20:00", [[F_SOMME]], "敦刻尔克撤退结束。战线停在索姆河—埃纳河。", "medium"),
    ("1940-06-14T20:00", [[F_JUN14]], "巴黎陷落。马其诺东段仍在法军手里，瑟堡尚未丢失。", "low"),
    ("1940-06-22T18:00", [[F_JUN22]], "停战线示意：图内大部分为德占，里昂附近东南角仍为法方。", "low"),
]


def check_fronts():
    for at, polys, *_ in FRONTS:
        for poly in polys:
            shell, holes = poly[0], poly[1:]
            g = Polygon(shell, holes)
            if not g.is_valid:
                raise SystemExit(f"{at} 多边形无效：{explain_validity(g)}")
            outer = Polygon(shell)
            for h in holes:
                if not outer.contains(Polygon(h).representative_point()):
                    raise SystemExit(f"{at} 的洞不在外环内")


def front_file(at, polys, note, conf):
    return {
        "at": at, "DE": polys, "SU": [], "note": note,
        "sources": SRC + ["wiki_france"], "confidence": conf,
    }


# ---------- 部队 ----------
DE = [
    unit("de.ag_b", "DE", "armygroup", "hq", None, "B集团军群", "Heeresgruppe B", "B集",
         ("费多尔·冯·博克", "Fedor von Bock"), [], history="黄色方案中负责荷兰和比利时方向，红色方案中改在索姆河一线向塞纳河和巴黎进攻。"),
    unit("de.ag_a", "DE", "armygroup", "hq", None, "A集团军群", "Heeresgruppe A", "A集",
         ("格德·冯·伦德施泰特", "Gerd von Rundstedt"), [], history="装甲部队经阿登突破，是镰刀收割的主力。红色方案中转向埃纳河和马恩河。"),
    unit("de.ag_c", "DE", "armygroup", "hq", None, "C集团军群", "Heeresgruppe C", "C集",
         ("威廉·里特尔·冯·莱布", "Wilhelm Ritter von Leeb"), [], history="对马其诺防线实施牵制，直到六月中旬法军主力被切断后才转入追击。"),
    unit("de.18a", "DE", "army", "infantry", "de.ag_b", "第18集团军", "18. Armee", "第18集团军",
         ("格奥尔格·冯·屈希勒", "Georg von Küchler"), [
            pt("1940-05-10T06:00", 6.14, 51.79), pt("1940-05-12T20:00", 5.40, 52.10, "engaged"),
            pt("1940-05-14T18:00", 4.70, 51.95, "engaged"), pt("1940-05-15T18:00", 4.48, 51.92),
            pt("1940-05-22T12:00", 4.40, 51.22), pt("1940-05-28T12:00", 3.22, 51.21),
            pt("1940-06-05T08:00", 1.83, 50.11, "engaged"), pt("1940-06-10T12:00", 1.09, 49.44),
            pt("1940-06-18T12:00", 0.11, 49.49), pt("1940-06-22T18:00", -0.37, 49.18),
         ], model="inf_de"),
    unit("de.6a", "DE", "army", "infantry", "de.ag_b", "第6集团军", "6. Armee", "第6集团军",
         ("瓦尔特·冯·赖歇瑙", "Walter von Reichenau"), [
            pt("1940-05-10T06:00", 6.08, 50.78), pt("1940-05-12T20:00", 5.40, 50.60, "engaged"),
            pt("1940-05-14T20:00", 4.80, 50.60, "engaged"), pt("1940-05-17T12:00", 4.35, 50.85),
            pt("1940-05-22T12:00", 3.40, 50.70), pt("1940-05-28T12:00", 3.06, 50.63, "engaged"),
            pt("1940-06-05T08:00", 2.30, 49.89, "engaged"), pt("1940-06-12T12:00", 2.35, 48.70),
            pt("1940-06-14T18:00", 2.35, 48.86), pt("1940-06-22T18:00", 2.40, 47.08),
         ], model="inf_de"),
    unit("de.4a", "DE", "army", "infantry", "de.ag_a", "第4集团军", "4. Armee", "第4集团军",
         ("京特·冯·克卢格", "Günther von Kluge"), [
            pt("1940-05-10T06:00", 6.20, 50.40), pt("1940-05-13T18:00", 4.90, 50.20),
            pt("1940-05-16T20:00", 3.60, 50.10), pt("1940-05-20T20:00", 2.30, 49.90),
            pt("1940-05-24T12:00", 2.60, 50.20), pt("1940-06-05T08:00", 1.83, 50.11, "engaged"),
            pt("1940-06-12T12:00", 1.09, 49.44), pt("1940-06-22T18:00", 0.69, 47.39),
         ], model="inf_de"),
    unit("de.12a", "DE", "army", "infantry", "de.ag_a", "第12集团军", "12. Armee", "第12集团军",
         ("威廉·利斯特", "Wilhelm List"), [
            pt("1940-05-10T06:00", 6.40, 49.70), pt("1940-05-13T20:00", 4.94, 49.70, "engaged"),
            pt("1940-05-17T12:00", 3.62, 49.56), pt("1940-05-24T12:00", 4.37, 49.51),
            pt("1940-06-09T12:00", 4.03, 49.26, "engaged"), pt("1940-06-14T18:00", 4.07, 48.30),
            pt("1940-06-22T18:00", 5.04, 47.32),
         ], model="inf_de"),
    unit("de.1a", "DE", "army", "infantry", "de.ag_c", "第1集团军", "1. Armee", "第1集团军",
         ("埃尔温·冯·维茨莱本", "Erwin von Witzleben"), [
            pt("1940-05-10T06:00", 6.99, 49.24), pt("1940-06-10T12:00", 6.99, 49.24),
            pt("1940-06-17T12:00", 6.18, 49.12, "engaged"), pt("1940-06-22T18:00", 6.18, 48.69),
         ], model="inf_de", history="五月间面对马其诺防线北段，几乎没有大的推进。六月中旬法军被切断后进入洛林。"),
    unit("de.7a", "DE", "army", "infantry", "de.ag_c", "第7集团军", "7. Armee", "第7集团军",
         ("弗里德里希·多尔曼", "Friedrich Dollmann"), [
            pt("1940-05-10T06:00", 8.20, 48.90), pt("1940-06-14T12:00", 8.10, 48.80),
            pt("1940-06-18T12:00", 7.75, 48.57, "engaged"), pt("1940-06-22T18:00", 7.36, 48.08),
         ], model="inf_de"),
    unit("de.pzgr_kleist", "DE", "army", "armor", "de.ag_a", "克莱斯特装甲集群", "Panzergruppe von Kleist", "克莱斯特",
         ("埃瓦尔德·冯·克莱斯特", "Ewald von Kleist"), [
            pt("1940-05-10T06:00", 6.40, 49.85), pt("1940-05-13T16:00", 4.94, 49.70, "engaged"),
            pt("1940-05-17T18:00", 3.29, 49.85), pt("1940-05-20T20:00", 1.83, 50.11),
            pt("1940-05-24T18:00", 2.13, 50.90), pt("1940-06-10T12:00", 4.00, 49.10),
            pt("1940-06-17T18:00", 6.36, 46.90), pt("1940-06-22T18:00", 6.36, 46.90),
         ], model="pz3"),
    unit("de.xix_mk", "DE", "corps", "armor", "de.pzgr_kleist", "第19摩托化军", "XIX. Armeekorps (mot.)", "XIX",
         ("海因茨·古德里安", "Heinz Guderian"), [
            pt("1940-05-10T06:00", 6.52, 49.97), pt("1940-05-12T18:00", 5.07, 49.79),
            pt("1940-05-13T16:00", 4.94, 49.70, "engaged"), pt("1940-05-16T20:00", 4.02, 49.70),
            pt("1940-05-20T20:00", 1.83, 50.11), pt("1940-05-24T18:00", 2.13, 50.98),
            pt("1940-06-10T12:00", 3.40, 49.04), pt("1940-06-14T18:00", 5.33, 47.86),
            pt("1940-06-17T18:00", 6.36, 46.90), pt("1940-06-22T18:00", 6.86, 47.64),
         ], model="pz3", history="古德里安装甲军经卢森堡和阿登，5月13日在色当渡过默兹河，5月20日到达阿布维尔。红色方案中转向东南方，6月17日前后进抵瑞士边境。"),
    unit("de.xv_mk", "DE", "corps", "armor", "de.4a", "第15摩托化军", "XV. Armeekorps (mot.)", "XV",
         ("赫尔曼·霍特", "Hermann Hoth"), [
            pt("1940-05-10T06:00", 6.47, 50.53), pt("1940-05-13T08:00", 4.91, 50.26, "engaged"),
            pt("1940-05-16T20:00", 3.69, 50.12), pt("1940-05-21T16:00", 2.78, 50.29, "engaged"),
            pt("1940-05-22T20:00", 1.63, 50.22), pt("1940-06-08T18:00", 1.09, 49.44),
            pt("1940-06-18T18:00", -1.62, 49.64), pt("1940-06-22T18:00", -1.68, 48.11),
         ], model="pz38t"),
    unit("de.1pz", "DE", "division", "armor", "de.xix_mk", "第1装甲师", "1. Panzer-Division", "1.Pz",
         ("弗里德里希·基希纳", "Friedrich Kirchner"), [
            pt("1940-05-10T05:30", 6.52, 49.97), pt("1940-05-11T18:00", 5.43, 49.84),
            pt("1940-05-12T20:00", 5.07, 49.79), pt("1940-05-13T16:00", 4.94, 49.70, "engaged"),
            pt("1940-05-15T20:00", 4.02, 49.70), pt("1940-05-17T18:00", 3.29, 49.85),
            pt("1940-05-19T12:00", 2.93, 49.93), pt("1940-05-20T20:00", 1.83, 50.11),
            pt("1940-05-23T12:00", 1.61, 50.73), pt("1940-05-24T18:00", 2.13, 50.98),
            pt("1940-06-05T06:00", 2.93, 49.93), pt("1940-06-10T12:00", 3.40, 49.04),
            pt("1940-06-14T18:00", 5.33, 47.86), pt("1940-06-17T18:00", 6.36, 46.90),
            pt("1940-06-22T18:00", 6.36, 46.90),
         ], model="pz3", equipment=[{"id": "pz3", "count": 50}, {"id": "pz4", "count": 30}]),
    unit("de.2pz", "DE", "division", "armor", "de.xix_mk", "第2装甲师", "2. Panzer-Division", "2.Pz",
         ("鲁道夫·法伊尔", "Rudolf Veiel"), [
            pt("1940-05-10T05:30", 6.35, 50.10), pt("1940-05-12T20:00", 5.20, 49.95),
            pt("1940-05-13T18:00", 4.90, 49.80, "engaged"), pt("1940-05-16T20:00", 3.80, 49.85),
            pt("1940-05-19T12:00", 2.70, 50.05), pt("1940-05-22T18:00", 1.61, 50.73, "engaged"),
            pt("1940-05-25T12:00", 1.86, 50.95), pt("1940-06-06T08:00", 2.50, 49.85),
            pt("1940-06-12T12:00", 4.07, 48.30), pt("1940-06-22T18:00", 4.83, 47.20),
         ], model="pz4", equipment=[{"id": "pz4", "count": 30}, {"id": "pz2", "count": 40}]),
    unit("de.10pz", "DE", "division", "armor", "de.xix_mk", "第10装甲师", "10. Panzer-Division", "10.Pz",
         ("费迪南德·沙尔", "Ferdinand Schaal"), [
            pt("1940-05-10T05:30", 6.45, 49.80), pt("1940-05-13T16:00", 4.94, 49.62, "engaged"),
            pt("1940-05-16T18:00", 3.90, 49.55), pt("1940-05-20T20:00", 2.10, 50.00),
            pt("1940-05-24T18:00", 1.86, 50.95, "engaged"), pt("1940-06-08T12:00", 3.20, 49.20),
            pt("1940-06-15T12:00", 5.33, 47.86), pt("1940-06-22T18:00", 6.86, 47.64),
         ], model="pz2", equipment=[{"id": "pz2", "count": 40}, {"id": "pz3", "count": 40}]),
    unit("de.7pz", "DE", "division", "armor", "de.xv_mk", "第7装甲师", "7. Panzer-Division", "7.Pz",
         ("埃尔温·隆美尔", "Erwin Rommel"), [
            pt("1940-05-10T05:30", 6.47, 50.53), pt("1940-05-12T20:00", 4.91, 50.26, "engaged"),
            pt("1940-05-14T20:00", 4.54, 50.20), pt("1940-05-16T20:00", 3.69, 50.12),
            pt("1940-05-18T20:00", 3.23, 50.17), pt("1940-05-21T16:00", 2.78, 50.29, "engaged"),
            pt("1940-05-22T20:00", 1.63, 50.22), pt("1940-06-05T06:00", 1.83, 50.11, "engaged"),
            pt("1940-06-08T18:00", 1.09, 49.44), pt("1940-06-10T18:00", 0.71, 49.87, "engaged"),
            pt("1940-06-14T12:00", -0.37, 49.18), pt("1940-06-18T18:00", -1.62, 49.64),
            pt("1940-06-21T18:00", -1.68, 48.11), pt("1940-06-22T18:00", -1.55, 47.22),
         ], model="pz38t", equipment=[{"id": "pz38t", "count": 90}],
         history="霍特装甲军的先头师。5月12日夜在迪南附近渡过默兹河，5月21日在阿拉斯遭到英军反击，6月又经鲁昂、圣瓦莱里打到瑟堡和布列塔尼。装备以捷克制38(t)为主。三维模型是示意。"),
]
FR = [
    unit("fr.ga1", "FR", "armygroup", "hq", None, "第1集团军群", "Groupe d'armées 1", "第1集",
         ("加斯东·比约特", "Gaston Billotte"), [], history="负责比利时方向。比约特5月21日因车祸重伤，随后由布朗夏尔接替。所属第9、第1集团军在突破后先后崩溃或被围。"),
    unit("fr.ga2", "FR", "armygroup", "hq", None, "第2集团军群", "Groupe d'armées 2", "第2集",
         ("安托万·普雷特拉", "Antoine Prételat"), [], history="守马其诺防线。正面几乎没有被突破，但六月中旬被从西面绕到背后。"),
    unit("fr.1a", "FR", "army", "infantry", "fr.ga1", "第1集团军", "1re armée", "法第1集",
         ("乔治·布朗夏尔", "Georges Blanchard"), [
            pt("1940-05-10T08:00", 3.60, 50.30), pt("1940-05-12T20:00", 4.69, 50.56, "engaged"),
            pt("1940-05-16T18:00", 3.40, 50.55, "withdrawing"), pt("1940-05-21T12:00", 3.06, 50.63, "encircled"),
            pt("1940-05-28T12:00", 3.06, 50.63, "encircled"), pt("1940-05-31T18:00", 3.06, 50.63, "surrendered"),
         ], model="inf_pl", active={"to": "1940-05-31T18:00"},
         history="进入比利时后在让布卢一带挡住德军步兵，但南面的突破把它和后方隔开。残部在里尔战斗到5月31日。"),
    unit("fr.7a", "FR", "army", "infantry", "fr.ga1", "第7集团军", "7e armée", "法第7集",
         ("亨利·吉罗", "Henri Giraud"), [
            pt("1940-05-10T08:00", 4.00, 51.20), pt("1940-05-12T18:00", 4.78, 51.59),
            pt("1940-05-14T20:00", 4.40, 51.22, "withdrawing"), pt("1940-05-18T12:00", 3.72, 51.05, "withdrawing"),
            pt("1940-05-22T12:00", 2.30, 49.89), pt("1940-06-05T08:00", 2.30, 49.89, "engaged"),
            pt("1940-06-09T18:00", 1.09, 49.44, "withdrawing"), pt("1940-06-14T12:00", 0.11, 49.49, "withdrawing"),
            pt("1940-06-18T12:00", -0.20, 49.00, "destroyed"),
         ], model="inf_pl", active={"to": "1940-06-18T18:00"},
         history="开战时按布雷达计划北上荷兰，随即被打回。残部后来出现在索姆河和塞纳河下游，六月中旬解体。"),
    unit("fr.9a", "FR", "army", "infantry", "fr.ga1", "第9集团军", "9e armée", "法第9集",
         ("安德烈·科拉普", "André Corap"), [
            pt("1940-05-10T08:00", 4.40, 49.85), pt("1940-05-13T16:00", 4.73, 49.88, "engaged"),
            pt("1940-05-15T20:00", 4.00, 49.80, "withdrawing"), pt("1940-05-16T18:00", 3.90, 49.83, "destroyed"),
         ], model="inf_pl", active={"to": "1940-05-16T18:00"},
         history="沿默兹河布防，当面正是阿登方向的装甲部队。5月13日起渡口接连失守，两天内失去组织。"),
    unit("fr.2a", "FR", "army", "infantry", "fr.ga1", "第2集团军", "2e armée", "法第2集",
         ("夏尔·安齐热", "Charles Huntziger"), [
            pt("1940-05-10T08:00", 5.20, 49.55), pt("1940-05-14T12:00", 4.94, 49.50, "engaged"),
            pt("1940-05-18T12:00", 4.60, 49.30, "withdrawing"), pt("1940-05-24T12:00", 4.40, 49.40),
            pt("1940-06-10T12:00", 4.30, 49.20, "engaged"), pt("1940-06-14T18:00", 4.07, 48.30, "withdrawing"),
            pt("1940-06-22T18:00", 5.04, 47.32, "withdrawing"),
         ], model="inf_pl", history="色当以南的肩膀。渡口失守后沿埃纳河重编，红色方案中继续南撤。"),
    unit("fr.maginot", "FR", "army", "fortress", "fr.ga2", "马其诺守备", "Ligne Maginot", "马其诺",
         ("安托万·普雷特拉", "Antoine Prételat"), [
            pt("1940-05-10T08:00", 7.20, 49.00), pt("1940-06-14T12:00", 7.20, 49.00),
            pt("1940-06-17T12:00", 6.80, 48.80, "encircled"), pt("1940-06-22T18:00", 7.00, 48.70, "surrendered"),
         ], model="inf_pl", active={"to": "1940-06-22T18:00"},
         history="这枚棋子代表第2集团军群在马其诺防线上的守军，不是单独一个番号。工事本身没有被正面突破，部队是在被绕到背后之后放下武器的。"),
]
ALLIES = [
    unit("gb.bef", "GB", "army", "infantry", None, "英国远征军", "British Expeditionary Force", "BEF",
         ("约翰·戈特", "John Vereker, Lord Gort"), [
            pt("1940-05-10T08:00", 3.06, 50.63), pt("1940-05-12T20:00", 4.70, 50.88, "engaged"),
            pt("1940-05-16T18:00", 3.50, 50.70, "withdrawing"), pt("1940-05-21T14:00", 2.78, 50.29, "engaged"),
            pt("1940-05-24T18:00", 2.50, 50.90, "withdrawing"), pt("1940-05-27T12:00", 2.38, 51.04, "encircled"),
            pt("1940-06-04T14:00", 2.38, 51.04, "disbanded"),
         ], model="inf_pl", active={"to": "1940-06-04T14:00"},
         history="约十三个师进入比利时，5月21日在阿拉斯向南反击，随后退入敦刻尔克。6月4日发电机行动结束，远征军主体撤到英国，棋子随之撤出。"),
    unit("be.army", "BE", "army", "infantry", None, "比利时陆军", "Armée belge", "比军",
         ("利奥波德三世", "Léopold III"), [
            pt("1940-05-10T06:00", 5.57, 50.63, "engaged"), pt("1940-05-12T18:00", 4.35, 50.85, "withdrawing"),
            pt("1940-05-16T18:00", 3.72, 51.05, "withdrawing"), pt("1940-05-24T12:00", 3.22, 51.21, "encircled"),
            pt("1940-05-28T04:00", 3.22, 51.21, "surrendered"),
         ], model="inf_pl", active={"to": "1940-05-28T11:00"},
         history="阿尔贝运河和埃本-埃马尔失守后逐次退到利斯河。5月28日，在北翼暴露、弹药将尽的情况下向德军投降。"),
    unit("nl.army", "NL", "army", "infantry", None, "荷兰陆军", "Nederlandse leger", "荷军",
         ("亨利·温克尔曼", "Henri Winkelman"), [
            pt("1940-05-10T06:00", 5.57, 51.96, "engaged"), pt("1940-05-13T12:00", 5.12, 52.09, "withdrawing"),
            pt("1940-05-14T13:00", 4.48, 51.92, "engaged"), pt("1940-05-15T11:00", 4.30, 52.08, "surrendered"),
         ], model="inf_pl", active={"to": "1940-05-15T16:00"},
         history="陆军沿格雷伯防线和佩尔防线组织抵抗。鹿特丹遭轰炸后，温克尔曼于5月15日签署投降书。泽兰省的战斗又持续了两天，本图未单列。"),
]


def route(i, side, uid, style, label, wps, width=12):
    return {
        "id": i, "side": side, "unit": uid, "style": style, "widthKm": width, "label": label,
        "waypoints": [{"at": a, "pos": [round(x, 2), round(y, 2)]} for a, x, y in wps],
        "sources": SRC, "confidence": "medium",
    }


ROUTES_DE = [
    route("r.de.guderian", "DE", "de.xix_mk", "main", "古德里安", [
        ("1940-05-10T06:00", 6.52, 49.97), ("1940-05-12T18:00", 5.07, 49.79),
        ("1940-05-13T16:00", 4.94, 49.70), ("1940-05-16T12:00", 4.02, 49.70),
        ("1940-05-18T12:00", 3.29, 49.85), ("1940-05-20T20:00", 1.83, 50.11),
    ], 16),
    route("r.de.coast", "DE", "de.2pz", "secondary", "海峡港口", [
        ("1940-05-20T20:00", 1.83, 50.11), ("1940-05-22T18:00", 1.61, 50.73), ("1940-05-25T12:00", 1.86, 50.95),
    ], 8),
    route("r.de.rommel", "DE", "de.7pz", "main", "隆美尔", [
        ("1940-05-10T06:00", 6.47, 50.53), ("1940-05-13T08:00", 4.91, 50.26),
        ("1940-05-16T20:00", 3.69, 50.12), ("1940-05-21T16:00", 2.78, 50.29), ("1940-05-22T20:00", 1.63, 50.22),
    ], 12),
    route("r.de.18a", "DE", "de.18a", "main", "第18集团军", [
        ("1940-05-10T06:00", 6.14, 51.79), ("1940-05-12T20:00", 5.40, 52.10), ("1940-05-15T12:00", 4.48, 51.92),
    ], 14),
    route("r.de.6a", "DE", "de.6a", "main", "第6集团军", [
        ("1940-05-10T06:00", 6.08, 50.78), ("1940-05-12T20:00", 5.57, 50.63),
        ("1940-05-15T12:00", 4.69, 50.56), ("1940-05-21T12:00", 3.06, 50.63),
    ], 14),
    route("r.de.fall_rot", "DE", "de.xix_mk", "main", "红色方案", [
        ("1940-06-05T06:00", 3.20, 49.60), ("1940-06-10T12:00", 3.40, 49.04),
        ("1940-06-14T18:00", 5.33, 47.86), ("1940-06-17T18:00", 6.36, 46.90),
    ], 14),
    route("r.de.rommel_rot", "DE", "de.7pz", "secondary", "塞纳河", [
        ("1940-06-05T06:00", 1.83, 50.11), ("1940-06-09T12:00", 1.09, 49.44),
        ("1940-06-12T12:00", 0.71, 49.87), ("1940-06-18T18:00", -1.62, 49.64),
    ], 10),
]
ROUTES_AL = [
    route("r.gb.retreat", "GB", "gb.bef", "retreat", "撤向敦刻尔克", [
        ("1940-05-16T12:00", 4.20, 50.70), ("1940-05-21T14:00", 2.78, 50.29), ("1940-05-27T12:00", 2.38, 51.04),
    ], 10),
    route("r.fr.lille", "FR", "fr.1a", "retreat", "退向里尔", [
        ("1940-05-14T12:00", 4.69, 50.56), ("1940-05-18T12:00", 3.50, 50.60), ("1940-05-22T12:00", 3.06, 50.63),
    ], 10),
    route("r.fr.breda", "FR", "fr.7a", "secondary", "布雷达", [
        ("1940-05-10T08:00", 3.20, 50.80), ("1940-05-12T18:00", 4.78, 51.59), ("1940-05-15T12:00", 4.40, 51.22),
    ], 8),
    route("r.gb.arras", "GB", "gb.bef", "counter", "阿拉斯反击", [
        ("1940-05-21T08:00", 2.55, 50.45), ("1940-05-21T16:00", 2.95, 50.22),
    ], 6),
    route("r.fr.montcornet", "FR", "fr.2a", "counter", "蒙特科尔内", [
        ("1940-05-17T08:00", 3.62, 49.56), ("1940-05-17T16:00", 4.02, 49.70),
    ], 6),
]

POCKETS = [
    {"id": "p.holland", "name": {"zh": "要塞荷兰", "orig": "Vesting Holland"}, "start": "1940-05-13T08:00", "end": "1940-05-15T16:00",
     "anchor": "@amsterdam", "fate": "surrendered", "units": ["nl.army"], "note": "鹿特丹轰炸后，荷兰陆军于5月15日投降。", "sources": SRC},
    {"id": "p.lille", "name": {"zh": "里尔包围圈", "orig": "Poche de Lille"}, "start": "1940-05-25T06:00", "end": "1940-05-31T20:00",
     "anchor": "@lille", "fate": "surrendered", "units": ["fr.1a"], "note": "法第1集团军残部在里尔坚持到5月31日。", "sources": SRC},
    {"id": "p.dunkirk", "name": {"zh": "敦刻尔克包围圈", "orig": "Poche de Dunkerque"}, "start": "1940-05-26T18:00", "end": "1940-06-04T14:00",
     "anchor": "@dunkirk", "fate": "broke_out", "units": ["gb.bef"], "note": "发电机行动撤出约33.8万人。围圈本身没有突围，而是经海路撤出。", "sources": ["horne", "wiki_france"]},
]
DEMARC = [{
    "id": "armistice", "name": {"zh": "停战线（示意）", "orig": "Ligne de démarcation"},
    "at": "1940-06-22T18:00", "until": "1940-06-25T23:00",
    "line": ["@bourges", [3.30, 46.85], [4.50, 46.55], [5.20, 46.40], [6.15, 46.20]],
    "note": "只画出本图幅内的北缘。大西洋沿岸的占领区和更南的自由区不在这张图里。",
    "sources": ["wiki_france", "jackson"],
}]

EVENTS = [
    {"id": "e.fall_gelb", "at": "1940-05-10T05:35", "category": "battle", "importance": 1, "side": "DE",
     "title": {"zh": "黄色方案", "orig": "Fall Gelb"}, "place": "@maastricht",
     "body": "5月10日凌晨约5时35分，德军三个集团军群同时进入荷兰、比利时和卢森堡。空降兵夺取桥梁和埃本-埃马尔要塞，空军打击同盟国机场。西线长达八个月的“静坐战争”到此结束。",
     "units": ["de.ag_b", "de.ag_a"], "sfx": ["artillery", "bomber"], "zoom": 2, "sources": SRC, "confidence": "high"},
    {"id": "e.eben_emael", "at": "1940-05-10T04:30", "endAt": "1940-05-11T12:00", "category": "battle", "importance": 2, "side": "DE",
     "title": {"zh": "埃本-埃马尔", "orig": "Fort Eben-Emael"}, "place": "@eben_emael",
     "body": "滑翔机载着德军工兵直接降落在要塞顶部，用空心装药破坏炮塔和观察所。要塞本身在第二天中午投降。阿尔贝运河上的桥从此对第6集团军敞开。",
     "units": ["de.6a"], "sfx": ["explosion", "mg"], "zoom": 6, "sources": SRC, "confidence": "high"},
    {"id": "e.sedan", "at": "1940-05-13T16:00", "category": "battle", "importance": 1, "side": "DE",
     "title": {"zh": "色当渡河", "orig": "Bataille de Sedan"}, "place": "@sedan",
     "body": "古德里安的第19摩托化军在色当强渡默兹河。俯冲轰炸机反复压制法军炮兵，步兵在当天下午建立桥头堡，夜里开始过坦克。这是整个战役的转折点。",
     "units": ["de.xix_mk", "de.1pz", "fr.2a"], "sfx": ["stuka", "artillery"], "zoom": 5, "sources": ["frieser", "horne"], "confidence": "high"},
    {"id": "e.dinant", "at": "1940-05-13T06:00", "category": "battle", "importance": 2, "side": "DE",
     "title": {"zh": "迪南渡河", "orig": "Dinant"}, "place": "@dinant",
     "body": "隆美尔的第7装甲师在迪南以北的乌村附近渡过默兹河，比色当稍早。法军第9集团军的正面因此从两处同时被撕开，预备队来不及堵住任何一个口子。",
     "units": ["de.7pz", "fr.9a"], "sfx": ["artillery", "tank"], "zoom": 5, "sources": ["frieser"], "confidence": "high"},
    {"id": "e.rotterdam", "at": "1940-05-14T13:30", "category": "air", "importance": 1, "side": "DE",
     "title": {"zh": "鹿特丹轰炸", "orig": "Bombardement van Rotterdam"}, "place": "@rotterdam",
     "body": "德军要求鹿特丹投降未果后，轰炸机群空袭了市中心。约八百至九百平民死亡，老城大片烧毁。空袭进行时和谈已经开始，部分飞机未能及时召回。次日荷兰陆军投降。",
     "units": ["de.18a", "nl.army"], "sfx": ["bomber", "siren"], "zoom": 5, "sources": ["wiki_france", "horne"], "confidence": "medium"},
    {"id": "e.dutch", "at": "1940-05-15T10:30", "category": "surrender", "importance": 1, "side": "NL",
     "title": {"zh": "荷兰投降", "orig": "Capitulatie van Nederland"}, "place": "@the_hague",
     "body": "总司令温克尔曼签署投降书，荷兰欧洲部分的陆军停止抵抗。泽兰省因与法军共同防守，战斗又延续到5月17日。王室和政府已撤往伦敦。",
     "units": ["nl.army"], "sfx": ["radio"], "zoom": 4, "sources": ["wiki_france"], "confidence": "high"},
    {"id": "e.ninth", "at": "1940-05-15T18:00", "category": "battle", "importance": 1, "side": "FR",
     "title": {"zh": "第9集团军崩溃", "orig": "9e armée"}, "place": "@montherme",
     "body": "蒙泰尔梅、迪南和色当三处渡口都丢失后，科拉普的第9集团军失去联系和预备队。5月15日夜里，司令部已经无法指挥完整的师。缺口从此变成一条通向西面的走廊。",
     "units": ["fr.9a", "de.xv_mk"], "sfx": ["radio", "tank"], "zoom": 4, "sources": ["horne", "frieser"], "confidence": "high"},
    {"id": "e.montcornet", "at": "1940-05-17T16:00", "category": "battle", "importance": 2, "side": "FR",
     "title": {"zh": "蒙特科尔内反击", "orig": "Montcornet"}, "place": "@montcornet",
     "body": "戴高乐以刚拼成的第4装甲师向蒙特科尔内冲击，一度打到德军后方的交通线。缺少步兵和燃料，反击当天停住。它证明法军坦克还能打，但改变不了走廊已经形成的事实。",
     "units": ["fr.2a"], "sfx": ["tank", "artillery"], "zoom": 5, "sources": ["horne"], "confidence": "medium"},
    {"id": "e.abbeville", "at": "1940-05-20T20:00", "category": "movement", "importance": 1, "side": "DE",
     "title": {"zh": "到达阿布维尔", "orig": "Abbeville"}, "place": "@abbeville",
     "body": "第1装甲师的前卫在5月20日晚上开到阿布维尔，看见英吉利海峡。比利时境内的同盟军和法国南部之间的陆上联系被切断。这一天通常被当作镰刀收割完成的标志。",
     "units": ["de.1pz", "de.xix_mk"], "sfx": ["tank", "engine"], "zoom": 4, "sources": ["frieser"], "confidence": "high"},
    {"id": "e.arras", "at": "1940-05-21T14:00", "category": "battle", "importance": 2, "side": "GB",
     "title": {"zh": "阿拉斯反击", "orig": "Battle of Arras"}, "place": "@arras",
     "body": "英军两个坦克营带少量步兵向南反击，冲进隆美尔师的侧翼，击毁一批德军反坦克炮。规模只有约两个师，当夜即停。德军一时高估了这次反击，它也常被拿来解释后来的停止前进令。",
     "units": ["gb.bef", "de.7pz"], "sfx": ["tank", "artillery"], "zoom": 5, "sources": ["horne", "frieser"], "confidence": "high"},
    {"id": "e.halt", "at": "1940-05-24T11:30", "category": "movement", "importance": 1, "side": "DE",
     "title": {"zh": "停止前进命令", "orig": "Haltebefehl"}, "place": "@charleville",
     "body": "希特勒批准装甲部队在运河线停止前进，先巩固走廊，把最后围歼交给空军和步兵。命令的动机至今有争论：有人强调地形和侧翼，有人强调戈林的保证。敦刻尔克因此多出了两天时间。",
     "units": ["de.pzgr_kleist"], "sfx": ["radio"], "zoom": 4, "sources": ["frieser", "horne"], "confidence": "medium"},
    {"id": "e.dynamo", "at": "1940-05-26T18:57", "category": "naval", "importance": 1, "side": "GB",
     "title": {"zh": "发电机行动", "orig": "Operation Dynamo"}, "place": "@dunkirk",
     "body": "英国海军从5月26日晚开始，用军舰和民船从敦刻尔克港与海滩撤人。到6月4日，约33.8万英法士兵渡过海峡，重装备几乎全部留下。这是撤退，不是一场打赢的防御战。",
     "units": ["gb.bef"], "sfx": ["ship_gun", "bomber"], "zoom": 4, "sources": ["horne", "wiki_france"], "confidence": "high"},
    {"id": "e.belgium", "at": "1940-05-28T04:00", "category": "surrender", "importance": 1, "side": "BE",
     "title": {"zh": "比利时投降", "orig": "Capitulation belge"}, "place": "@bruges",
     "body": "利奥波德三世在部队被压到海岸、弹药将尽后决定投降，5月28日凌晨生效。英军侧翼因此暴露，敦刻尔克围圈更小。比利时政府在法国谴责了这一决定，国王留下当了俘虏。",
     "units": ["be.army"], "sfx": ["radio"], "zoom": 4, "sources": ["horne"], "confidence": "high"},
    {"id": "e.dunkirk_end", "at": "1940-06-04T18:00", "category": "naval", "importance": 1, "side": "GB",
     "title": {"zh": "敦刻尔克结束", "orig": "Dunkirk"}, "place": "@dunkirk",
     "body": "最后一批船在6月4日离开。后卫约四万名法军来不及上船，成为俘虏。英国远征军的师保存了下来，火炮、车辆和坦克留在岸上。同一天，德军开始把兵力转向南方。",
     "units": ["gb.bef"], "sfx": ["ship_gun"], "zoom": 4, "sources": ["horne", "wiki_france"], "confidence": "high"},
    {"id": "e.fall_rot", "at": "1940-06-05T04:00", "category": "battle", "importance": 1, "side": "DE",
     "title": {"zh": "红色方案", "orig": "Fall Rot"}, "place": "@amiens",
     "body": "6月5日，德军在索姆河和随后在埃纳河重新发起进攻，目标是剩余的法军和巴黎。魏刚把残部排成一道没有纵深的防线。几天之内，索姆河防线和塞纳河先后被渡过。",
     "units": ["de.ag_b", "fr.7a"], "sfx": ["artillery", "tank"], "zoom": 3, "sources": ["frieser", "jackson"], "confidence": "high"},
    {"id": "e.italy", "at": "1940-06-10T18:00", "category": "political", "importance": 2, "side": "FR",
     "title": {"zh": "意大利宣战", "orig": "Entrée en guerre de l'Italie"}, "place": "@tours",
     "body": "墨索里尼于6月10日对英法宣战。阿尔卑斯山的意军攻势要到6月下旬才展开，而且不在这张图的范围内。法国政府此时已离开巴黎，经图尔继续南迁。",
     "sfx": ["radio"], "zoom": 3, "sources": ["jackson", "wiki_france"], "confidence": "high"},
    {"id": "e.paris", "at": "1940-06-14T09:00", "category": "movement", "importance": 1, "side": "DE",
     "title": {"zh": "德军进入巴黎", "orig": "Paris, ville ouverte"}, "place": "@paris",
     "body": "法国政府把巴黎宣布为不设防城市，以免巷战毁掉它。6月14日早晨德军开进空城。军事上这是追击的一站，政治上它标志着第三共和国的首都已经丢掉。",
     "units": ["de.6a"], "sfx": ["march", "engine"], "zoom": 4, "sources": ["jackson", "horne"], "confidence": "high"},
    {"id": "e.petain", "at": "1940-06-17T12:30", "category": "political", "importance": 1, "side": "FR",
     "title": {"zh": "贝当求和", "orig": "Appel du 17 juin"}, "place": "@tours",
     "body": "贝当在6月16日夜出任总理。17日中午他通过广播说，必须停止战斗，并向德国询问停战条件。广播时政府正在向波尔多转移，波尔多在这张图的南边以外。许多部队听到广播后自行停止抵抗。",
     "sfx": ["radio"], "zoom": 3, "sources": ["jackson"], "confidence": "high"},
    {"id": "e.compiegne", "at": "1940-06-22T18:30", "category": "political", "importance": 1, "side": "DE",
     "title": {"zh": "贡比涅停战", "orig": "Armistice de Rethondes"}, "place": "@compiegne",
     "body": "停战协定签在1918年所用的那节车厢里，地点在贡比涅森林。法国陆军被解除武装，北部和大西洋沿岸由德军占领，东南部暂称自由区。协定要到6月25日凌晨才生效。",
     "sfx": ["radio", "stamp"], "zoom": 5, "sources": ["jackson", "wiki_france"], "confidence": "high"},
    {"id": "e.effective", "at": "1940-06-25T01:35", "category": "surrender", "importance": 2, "side": "FR",
     "title": {"zh": "停战生效", "orig": "Cessez-le-feu"}, "place": "@paris",
     "body": "法德停战于6月25日凌晨1时35分生效，同意大利的停战同一时刻生效。六周之内，荷兰、比利时和法国本土的有组织抵抗都结束了。英国继续单独作战。",
     "sfx": ["bell"], "zoom": 2, "sources": ["wiki_france", "jackson"], "confidence": "high"},
]


PHOTOS = {
    "e.eben_emael": ("File:Fort Eben-Emael Koepel Noord achteraan koepel Zuid.jpg", "埃本-埃马尔要塞的炮塔，摄于战后，不是 1940 年现场"),
    "e.rotterdam": ("File:Rotterdam, Laurenskerk, na bombardement van mei 1940.jpg", "1940 年 5 月轰炸后的鹿特丹，圣劳伦斯教堂仍立在废墟中"),
    "e.abbeville": ("File:German Panzer II in France, in May-June 1940 (242-EAPC-3-285).jpg", "1940 年 5 月至 6 月，法国田野上的德军二号坦克"),
    "e.dynamo": ("File:Dunkirk 26-29 May 1940 NYP68075.jpg", "1940 年 5 月 26 日至 29 日，敦刻尔克海滩上等待上船的英军"),
    "e.montcornet": ("File:Juin 1940, Aubigny-sur-Nère, Char B1 bis.jpg", "1940 年 6 月被击毁的夏尔 B1 bis。戴高乐反击使用的是同一型号，不是这一辆"),
    "e.paris": ("File:French troops barricades paris 1940.png", "1940 年 6 月，巴黎街道上的法军路障。政府宣布巴黎为不设防城市后，德军未遇巷战"),
}


def main():
    for e in EVENTS:
        ph = PHOTOS.get(e["id"])
        if ph:
            e["photo"] = {"commons": ph[0], "caption": ph[1]}
    check_fronts()
    dump(DATA / "gazetteer/base.json", PLACES)
    dump(DATA / "oob/de.json", DE)
    dump(DATA / "oob/fr.json", FR)
    dump(DATA / "oob/allies.json", ALLIES)
    dump(DATA / "routes/de.json", ROUTES_DE)
    dump(DATA / "routes/allies.json", ROUTES_AL)
    for at, polys, note, conf in FRONTS:
        name = at.replace(":", "-") + ".json"
        dump(DATA / "fronts" / name, front_file(at, polys, note, conf))
    dump(DATA / "pockets.json", POCKETS)
    dump(DATA / "demarcation.json", DEMARC)
    EVENTS.sort(key=lambda e: e["at"])
    dump(DATA / "events.json", EVENTS)
    dump(DATA / "sources/core.json", [
        {"id": "frieser", "title": "The Blitzkrieg Legend", "author": "Karl-Heinz Frieser", "year": 2005, "license": "引用书目"},
        {"id": "horne", "title": "To Lose a Battle: France 1940", "author": "Alistair Horne", "year": 1969, "license": "引用书目"},
        {"id": "jackson", "title": "The Fall of France", "author": "Julian Jackson", "year": 2003, "license": "引用书目"},
        {"id": "wiki_france", "title": "Battle of France", "author": "Wikipedia contributors", "year": 2026,
         "url": "https://en.wikipedia.org/wiki/Battle_of_France", "license": "CC BY-SA"},
    ])
    dump(DATA / "equipment.json", [
        {"id": "pz2", "side": "DE", "name": {"zh": "二号坦克", "orig": "Panzer II", "short": "Pz.II"}, "class": "tank_light", "crew": 3, "weightT": 8.9, "gun": "20毫米", "speedKmh": 40, "count": 950, "model": "pz2",
         "desc": "1940年德军装甲师里数量仍然很多的轻型坦克，火力和装甲都不足以对抗法军中型坦克，主要用于侦察和伴随步兵。", "sources": ["frieser"]},
        {"id": "pz3", "side": "DE", "name": {"zh": "三号坦克", "orig": "Panzer III", "short": "Pz.III"}, "class": "tank_medium", "crew": 5, "weightT": 19.5, "gun": "37毫米", "speedKmh": 40, "count": 350, "model": "pz3",
         "desc": "装甲师的主战坦克。1940年多数仍装37毫米炮，靠无线电和连排协同，而不是单车装甲，取得了突破。", "sources": ["frieser"]},
        {"id": "pz4", "side": "DE", "name": {"zh": "四号坦克", "orig": "Panzer IV", "short": "Pz.IV"}, "class": "tank_medium", "crew": 5, "weightT": 25, "gun": "75毫米短管", "speedKmh": 40, "count": 280, "model": "pz4",
         "desc": "当时每个装甲师只有一个连上下的四号坦克，用短管75毫米炮打支撑点和反坦克炮。模型为示意。", "sources": ["frieser"]},
        {"id": "pz38t", "side": "DE", "name": {"zh": "38(t)坦克", "orig": "Panzer 38(t)", "short": "38(t)"}, "class": "tank_light", "crew": 4, "weightT": 9.7, "gun": "37毫米", "speedKmh": 42, "count": 230, "model": "pz38t",
         "desc": "捷克LT vz. 38的德军编号。第7、第8装甲师以此为主。可靠、速度快，火力与三号坦克早期型相当。", "sources": ["frieser"]},
    ])
    dump(DATA / "forces_summary.json", {
        "sides": {
            "DE": {"name": "德国", "commander": "陆军总司令瓦尔特·冯·布劳希奇；西线由A、B、C三个集团军群执行",
                   "men": 3000000, "divisions": "西线约 141 个师，其中装甲师 10 个", "tanks": 2445, "aircraft": 3500, "guns": 7400,
                   "losses": {"killed": "约 2.7 万", "wounded": "约 11 万", "captured": "失踪约 1.8 万", "tanks": "损失约占投入数的四分之一到三分之一，多数可修复", "aircraft": "约 1,200–1,400 架"},
                   "note": "兵力取弗里斯尔与通行战役表的中间值。坦克约 2,400–2,600 辆，飞机为投入西线的作战飞机，各书口径不同。"},
            "FR": {"name": "法国", "commander": "甘末林，5月19日起由魏刚接替；东北战线由乔治指挥",
                   "men": 2300000, "divisions": "东北战线约 90 个师量级，全国师的总数各书在 100 以上", "tanks": 3200, "aircraft": 1400, "guns": 11000,
                   "losses": {"killed": "约 6 万–9 万", "wounded": "约 12 万", "captured": "约 190 万（含停战时被解除武装者）", "tanks": "大部分丢失或缴获", "aircraft": "约 500–1,000 架"},
                   "note": "法国坦克总数多于德军，但分散在步兵师和三个装甲师里。可出动飞机远少于纸面实力。"},
            "GB": {"name": "英国远征军", "commander": "戈特勋爵；空军为前进空中打击部队和航空队",
                   "men": 394000, "divisions": "战斗师约 10 个，另加后勤和筑垒部队，常计为 13 个师", "tanks": 300, "aircraft": 500, "guns": 2800,
                   "losses": {"killed": "约 3,500（敦刻尔克之前的地面战斗，另有撤退中的损失）", "wounded": "约 1.4 万", "captured": "敦刻尔克后约 4 万法军被俘；英军俘虏较少", "tanks": "远征军重装备几乎全部留下"},
                   "note": "人数含交通线和后勤。坦克以轻型坦克和少量玛蒂尔达为主。"},
            "BE": {"name": "比利时", "commander": "国王利奥波德三世",
                   "men": 600000, "divisions": "约 22 个师", "tanks": 270, "aircraft": 180, "guns": 1300,
                   "losses": {"killed": "约 6,000–7,500", "wounded": "约 1.5 万", "captured": "投降时军队被解除武装"},
                   "note": "坦克多数是轻型。5月28日投降后，军队不复存在。"},
            "NL": {"name": "荷兰", "commander": "亨利·温克尔曼",
                   "men": 280000, "divisions": "约 10 个师，另有边防和要塞部队", "tanks": 40, "aircraft": 140, "guns": 700,
                   "losses": {"killed": "约 2,200 名军人", "wounded": "约 7,000", "captured": "投降后被解除武装"},
                   "note": "几乎没有能与德军装甲部队交战的坦克，装甲力量主要是装甲车。鹿特丹平民死亡另计。"},
        },
        "sources": ["frieser", "horne", "wiki_france"],
    })
    # 正文长度自检
    for e in EVENTS:
        n = len(e["body"])
        if not 60 <= n <= 170:
            print("BODY", e["id"], n)
    print("places", len(PLACES), "units", len(DE) + len(FR) + len(ALLIES), "events", len(EVENTS), "fronts", len(FRONTS))


if __name__ == "__main__":
    main()
