#!/usr/bin/env python3
"""下载大西洋海战照片（Wikimedia Commons，核实许可）→ public/campaigns/battle-atlantic-1945/photos/<slug>.webp + index.json。

只接受 Public Domain / CC0 / CC BY / CC BY-SA（拒绝 NC、ND、GFDL-only 与许可不明）；
每张照片重新查询 Commons 的 extmetadata 核对作者、许可与出处，查询结果与下载内容都写入 index.json。
可重复执行：已存在且尺寸正确的 webp 跳过下载，但仍刷新索引与许可字段。

用法：
  .venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/fetch_photos.py
  .venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/fetch_photos.py --verify-only
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402

CAMP = Path(__file__).resolve().parents[2]
OUT = CAMP.parents[1] / "public/campaigns" / CAMP.name / "photos"
MAX_W = 900

# 文件名 → (slug, role, 中文说明, 归类)
PHOTOS: dict[str, tuple[str, str, str, str]] = {
    # —— U 艇与狼群 ——
    "File:German submarine U-541 in the Atlantic Ocean on 11 May 1945 (80-G-319661).jpg": (
        "u541-surrendered-1945", "intro",
        "1945 年 5 月 11 日，U-541 在圣文森特角以西海面向英国驱逐舰马尔科姆号投降，照片摄自美军 PBY-5A 卡塔琳娜（美国国家档案馆 80-G-319661）。簿记差异：uboat.net 记投降日为 5 月 12 日于直布罗陀",
        "uboat"),
    "File:Bundesarchiv Bild 101II-MW-3712-04A, St. Nazaire, U-96 einlaufend.jpg": (
        "u96-st-nazaire", "uboat",
        "U-96 驶入圣纳泽尔：船员在码头列队，人群在混凝土掩体顶上看望。这艘 VII C 型艇共执行 11 次巡逻、击沉 27 艘商船，是狼群主力的代表（德国联邦档案馆 Bild 101II-MW-3712-04A，摄影 Schlemmer）",
        "uboat"),
    # —— 航空反潜 ——
    "File:German submarine U-243 under attack by Sunderland aircraft of No. 10 Squadron RAAF in the Bay of Biscay, 8 July 1944 (AWM 135145).jpg": (
        "u243-sunderland-attack", "air",
        "1944 年 7 月 8 日，澳大利亚皇家空军第 10 中队的两架桑德兰在比斯开湾以西约 170 海里攻击 U-243；深水炸弹在艇尾激起水柱（澳大利亚战争纪念馆 AWM 135145）",
        "air"),
    "File:A Short Sunderland Mk I flying boat of No. 210 Squadron RAF based at Oban in Scotland, patrols over a Canadian troop convoy on its way to Greenock, 31 July 1940. CH832.jpg": (
        "sunderland-convoy-1940", "air",
        "1940 年 7 月 31 日，第 210 中队的桑德兰 Mk I（L2163「DA-G」）在苏格兰奥本外海为驶往格里诺克的加拿大运兵船队 TC.6 提供掩护（帝国战争博物馆 CH 832，摄影 Stanley Devon）",
        "air"),
    "File:The Battle of the Atlantic 1939-1945 CH14001.jpg": (
        "liberator-leigh-light", "air",
        "海岸司令部的一架解放者停在康沃尔圣埃瓦尔机场，机身被利式探照灯（Leigh Light）照亮。这种机载探照灯 1942 年起让夜间反潜从几乎无效变为有效（帝国战争博物馆 CH 14001）",
        "air"),
    # —— 护航队与护航舰 ——
    "File:An aerial view of a convoy in the Atlantic, 1941. Two escorts can be seen in the foreground. C2647.jpg": (
        "convoy-aerial-1941", "convoy",
        "1941 年北大西洋护航队的空中俯瞰：商船排成纵队，两艘护航舰在前方两侧（英国帝国战争博物馆 C 2647，皇家空军摄）",
        "convoy"),
    "File:A convoy conference in progress, August 1942. A11796.jpg": (
        "convoy-conference-1942", "convoy",
        "1942 年 8 月，一次出航前的护航队会议：商船船长与护航舰军官在同一张桌前核对队位、信号与应急程序；墙上贴着「No Smoking」告示（帝国战争博物馆 A 11796）",
        "convoy"),
    "File:Destroyers on Convoy Escort Duty, October 1941 A5914.jpg": (
        "destroyers-escort-1941", "escort",
        "1941 年 10 月，老式 V 级驱逐舰 HMS Vanity（D 式迷彩）在护航队前方警戒；背景是商船队。位置据信在诺福克郡谢林厄姆外海（帝国战争博物馆 A 5914）",
        "escort"),
    "File:HMS Biter (D97) underway c1943.jpg": (
        "hms-biter", "carrier",
        "护航航母 HMS Biter 由商船改装，甲板上停着 Martlet 战斗机与剑鱼攻击机；1943–44 年它随猎杀群在中大西洋作战（帝国战争博物馆，摄影 S. J. Beadell）",
        "carrier"),
    "File:HMS AUDACITY, 1941. FL1204.jpg": (
        "hms-audacity", "carrier",
        "1941 年的护航航母 HMS Audacity。它由德国商船汉诺威号改装，是英国第一艘护航航母；1941 年 12 月 21 日在护航 HG-76 时被 U-751 击沉（帝国战争博物馆 FL 1204）",
        "carrier"),
    "File:HMS Starling (U66) underway 1943.jpg": (
        "hms-starling", "escort",
        "1943 年的 HMS Starling。这艘改进型黑天鹅级单桅帆船是沃克上校第 2 护航群的旗舰，1944 年 1 月随群在北大西洋作战（帝国战争博物馆，J. Hall 收藏）",
        "escort"),
    # —— 指挥与海图 ——
    "File:The Operations Room at Derby House in Liverpool, the headquarters of the Commander-in-Chief Western Approaches, September 1944. A25746.jpg": (
        "western-approaches-plot", "command",
        "1944 年 9 月，利物浦德比大厦西部海口司令部作战室：巨大的态势板上标着最新船位，一名皇家海军妇女服务队标图员正在梯子上修改标记（帝国战争博物馆 A 25746）",
        "command"),
    "File:The war in Western Europe and Battle of the Atlantic.jpg": (
        "map-west-point-atlantic", "map",
        "西点军校《美国战争地图集》第 46 图：轴心扩张（1939-09 至 1942-08）与同盟国反攻（1942-11 至 1944-06）的范围；左下角图例用符号标出各时段被 U 艇击沉的船只位置（最后一段至 1943 年 5 月）",
        "map"),
    # —— 大西洋会议 ——
    "File:Winston Churchill with Franklin D. Roosevelt on board USS Augusta (CA-31) on 9 August 1941 (NH 67201).jpg": (
        "churchill-roosevelt-1941", "conference",
        "1941 年 8 月 9 日，丘吉尔与罗斯福在纽芬兰阿真舍湾的美国重巡洋舰奥古斯塔号上会面；《大西洋宪章》随后于 8 月 14 日公布（美国海军 NH 67201）",
        "conference"),
    "File:President Roosevelt and Winston Churchill seated on the quarterdeck of HMS PRINCE OF WALES for a Sunday service during the Atlantic Conference, 10 August 1941. A4816.jpg": (
        "atlantic-conference-service-1941", "conference",
        "1941 年 8 月 10 日，罗斯福与丘吉尔在威尔士亲王号战列舰后甲板参加礼拜，身后是美国海军金上将与斯塔克上将；大西洋会议在此舰与奥古斯塔号之间往返举行（帝国战争博物馆 A 4816）",
        "conference"),
    # —— 人物 ——
    "File:Nazi Personalities- Grossadmiral Karl Doenitz (1891-1984) A14899.jpg": (
        "doenitz-portrait", "leaders",
        "卡尔·邓尼茨，1935–1943 年任潜艇部队司令（BdU），1943 年 1 月接任海军总司令，1945 年 5 月成为德国国家元首（帝国战争博物馆 A 14899）",
        "leaders"),
    # —— 密码战 ——
    "File:U-110 and HMS Bulldog.jpg": (
        "u110-and-bulldog", "enigma",
        "1941 年 5 月 9 日，U-110 在冰岛以南攻击 OB-318 后被护航舰逼出水面；驱逐舰 HMS Bulldog 靠帮，恩尼格玛机与密码表落入英军之手（皇家海军官方照片）",
        "enigma"),
    "File:EnigmaMachine.jpg": (
        "enigma-machine", "enigma",
        "恩尼格玛密码机（伦敦帝国战争博物馆藏）。U 艇自 1942 年 2 月起换用四转子 M4，一度让盟军破译失明十个月（摄影 Karsten Sperling，公有领域）",
        "enigma"),
    # —— 商船损失 ——    # —— 商船损失 ——
    "File:Allied tanker torpedoed.jpg": (
        "dixie-arrow-torpedoed", "loss",
        "1942 年 3 月 26 日晨，美国油轮 Dixie Arrow 在哈特拉斯角外被 U-71 鱼雷击中，船体燃烧断裂，当晚沉没；33 名船员中 22 人获救（美国国家档案馆 80-G-43376）",
        "loss"),
    # —— 诺曼底 ——
    "File:The Mulberry artificial harbour at Arromanches in Normandy, June 1944. A24675.jpg": (
        "mulberry-arromanches", "normandy",
        "1944 年 6 月，诺曼底阿罗芒什的桑葚人工港 B 开始运转；跨海峡补给的成败直接决定登陆后能否站稳（帝国战争博物馆 A 24675）",
        "normandy"),
}


def clean_author(raw: str) -> str:
    """把 Commons 的 author 字段整理成可署名的短句。

    Commons 常见形态：``Unknown author Unknown author``（隐藏 span 造成重复）、
    ``Unknown author U.S. Navy (photo 80-G-43376)``、``Lt. X ...; originally uploaded by Y``。
    规则：压空白 → 去掉「Unknown author」这类占位片段 → 取分号前的主体；全空则记「佚名」。
    """
    s = " ".join((raw or "").split())
    s = re.sub(r"(?i)\bunknown\s*(author)?\b", "", s)
    s = re.sub(r"^[\s,;:.\-]+", "", s).strip()
    s = s.split(";")[0].strip()
    return s or "佚名"


def load_index() -> dict:
    p = OUT / "index.json"
    if p.exists():
        try:
            return json.loads(p.read_text("utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_index(index: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")


def check_webp(path: Path) -> tuple[int, int] | None:
    """解码校验：必须是 WebP、宽 ≤ 900、文件非空。返回 (w, h)。"""
    try:
        if path.stat().st_size < 1024:
            return None
        with Image.open(path) as im:
            if im.format != "WEBP" or im.width > MAX_W:
                return None
            im.load()
            return im.width, im.height
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verify-only", action="store_true", help="只核对索引与现有文件，不下载")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    index = load_index()
    info = commons.query_files(list(PHOTOS), thumb_width=1000)
    failures: list[str] = []

    for title, (slug, role, caption, kind) in PHOTOS.items():
        i = info.get(title, {})
        if not i.get("exists"):
            failures.append(f"文件不存在：{title}")
            continue
        lic = i.get("license", "")
        if not commons.license_ok(lic):
            failures.append(f"许可不符（{lic}）：{title}")
            continue
        dst = OUT / f"{slug}.webp"
        size = check_webp(dst)
        if size is None and not args.verify_only:
            r = commons.get(i["thumburl"])
            r.raise_for_status()
            im = Image.open(io.BytesIO(r.content)).convert("RGB")
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            im.save(dst, "WEBP", quality=82, method=6)
            size = check_webp(dst)
        if size is None:
            failures.append(f"下载或解码失败：{slug}")
            continue
        w, h = size
        index[title] = {
            "src": f"photos/{slug}.webp",
            "title": title[5:],
            "author": clean_author(i.get("artist") or ""),
            "license": lic,
            "licenseUrl": commons.license_url_fallback(lic, i.get("licenseUrl", "")),
            "sourceUrl": i.get("descriptionurl", ""),
            "originalUrl": (i.get("url") or "").split("?")[0],
            "caption": caption,
            "role": role,
            "kind": kind,
            "w": w,
            "h": h,
            "verifiedOn": "2026-10-19",
        }
        print(f"✓ {slug:32s} {lic:20s} {w}×{h}")

    # 只保留本脚本管理的条目（避免旧索引里的死条目）
    keep = {t: v for t, v in index.items() if t in PHOTOS}
    save_index(keep)

    # 逐条核对文件存在且尺寸达标
    for title, (slug, *_rest) in PHOTOS.items():
        p = OUT / f"{slug}.webp"
        if check_webp(p) is None and f"下载或解码失败：{slug}" not in failures:
            failures.append(f"索引存在但文件缺失/不合规：{slug}")

    # 目录里不应残留任何未登记的 webp
    registered = {OUT / f"{slug}.webp" for slug, *_ in PHOTOS.values()}
    strays = sorted(p.name for p in OUT.glob("*.webp") if p not in registered)
    if strays:
        failures.append("目录中有未登记的 webp（请删除）：" + "、".join(strays))

    print(f"\n索引 {len(keep)} 条，目录 {len(list(OUT.glob('*.webp')))} 个 webp")
    if failures:
        print("✗ 失败：", *failures, sep="\n  ")
        return 1
    print("✓ 全部照片：许可合规、WebP、宽 ≤ 900px、文件可解码、无未登记文件")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
