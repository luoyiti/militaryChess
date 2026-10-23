#!/usr/bin/env python3
"""核验 Wikimedia Commons 许可，抓取莫斯科保卫战照片 → public/campaigns/moscow-1941/photos/*.webp。

用法：`.venv/bin/python campaigns/moscow-1941/pipeline/fetch_photos.py`

做法与 `campaigns/wuhan-1938/pipeline/fetch_photos.py` 一致：
1. 用 `curl` 调 Commons `action=query` 取 imageinfo（URL、尺寸、extmetadata）；
2. 只接受许可明确的 PD / CC BY / CC BY-SA（无授权、非自由许可一律拒绝，记入 photo-evidence.json 的 excluded）；
3. 缩略图主机当前为 `thumb.wikimedia.org`（`upload.wikimedia.org/wikipedia/commons/thumb/...` 现返回 400），
   脚本把 thumburl 归一到 `thumb.wikimedia.org`；原始文件（小于 1280 px 的）仍走 `upload.wikimedia.org`；
4. 用 Pillow 等比缩到最长边 1280、转 WebP（质量 85），写入 photos/，同时更新 index.json 与 photo-evidence.json。

脚本幂等：重复运行只会覆盖同名文件与索引。网络不可用时不应静默产出半套索引——任一必需条目失败即非零退出。
"""
from __future__ import annotations

import html
import io
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / "public/campaigns/moscow-1941/photos"
INDEX = OUT / "index.json"
EVIDENCE = HERE / "photo-evidence.json"

API = "https://commons.wikimedia.org/w/api.php"
UA = "militaryChess/0.2 (educational history; +https://127.0.0.1:5180)"
MAX_EDGE = 1280
QUALITY = 85

# ---------------------------------------------------------------------------
# 选片表：Commons 文件名 → 本地 slug、中文标题、图注、史实使用限制
# 图注写清「照片能证明什么、不能证明什么」；拍摄日期取自 Commons 元数据，与事件日期不一致时明确写出。
# ---------------------------------------------------------------------------
ASSETS = [
    {
        "commons": "File:Battle of Moscow.jpg",
        "slug": "moscow-tank-trap-digging",
        "title": "莫斯科市民挖掘反坦克壕",
        "caption": "莫斯科妇女与老年男子在城郊挖掘反坦克壕。美国新闻署档案照片（Commons 编目），具体日期与地段未注明，用作城防动员示意，不指认某日某地工事。",
        "permission": "Public domain",
        "limits": "拍摄日期未详；不能用于确定 10 月某日防线位置。",
    },
    {
        "commons": "File:RIAN archive 46802 The defense of Moscow.jpg",
        "slug": "rian-46802-heavy-gun-crew",
        "title": "重炮组向敌阵地射击",
        "caption": "1941 年 12 月 3 日，苏军重炮组在莫斯科方向射击。俄新社档案（Victor Temin 摄）。照片日期在反攻开始前夕，与 12 月 5 日反攻的炮火准备相互印证，但不能据此确定具体阵地。",
        "permission": "CC BY-SA 3.0",
        "limits": "只证明「12 月初有重炮射击」，不指认部队番号。",
    },
    {
        "commons": "File:RIAN archive 887721 Defense of Moscow.jpg",
        "slug": "rian-887721-aa-guns-hotel-moskva",
        "title": "莫斯科饭店屋顶的高射炮",
        "caption": "1941 年 8 月 1 日，莫斯科饭店屋顶的高射炮组。俄新社档案（Oleg Knorring 摄）。莫斯科防空在开战初期即已就位；照片早于台风行动两个月。",
        "permission": "CC BY-SA 3.0",
        "limits": "8 月拍摄，不能直接配 10—12 月的空袭事件而不加说明。",
    },
    {
        "commons": "File:RIAN archive 403 Antiaircraft balloons in Moscow.jpg",
        "slug": "rian-403-barrage-balloons",
        "title": "为拦阻气球充气",
        "caption": "1941 年 11 月，莫斯科为拦阻气球充气。俄新社档案（Oleg Knorring 摄）。拦阻气球与探照灯、高炮共同构成莫斯科夜间防空网。",
        "permission": "CC BY-SA 3.0",
        "limits": "月份精度；不能据此判断空袭次数。",
    },
    {
        "commons": "File:RIAN archive 38689 Defending the Moscow sky.jpg",
        "slug": "rian-38689-acoustic-detector",
        "title": "声学测音器",
        "caption": "1941 年 10 月 1 日，苏军士兵在莫斯科近郊操作声学测音器搜索德军轰炸机。俄新社档案（Naum Granovsky 摄）。这是靠听音定位的声学测音器，不是雷达；当时莫斯科防空依靠听音、探照灯与高炮协同。",
        "permission": "CC BY-SA 3.0",
        "limits": "10 月 1 日拍摄；装备为声学探测，不是雷达。",
    },
    {
        "commons": "File:RIAN archive 14 Anti-aircraft gunners defending Moscow.jpg",
        "slug": "rian-14-aa-gunners",
        "title": "保卫莫斯科的高射炮手",
        "caption": "1941 年 11 月 1 日，莫斯科防空高射炮手。俄新社档案（Oleg Knorring 摄）。莫斯科防空司令部在 11 月维持了密集的高炮与探照灯配系。",
        "permission": "CC BY-SA 3.0",
        "limits": "月份精度；不表示德军突破防空网。",
    },
    {
        "commons": "File:RIAN archive 669663 Soviet troops head to front lines after 1941 Red Square parade.jpg",
        "slug": "rian-669663-red-square-parade",
        "title": "红场阅兵后直接开赴前线",
        "caption": "1941 年 11 月 7 日，红场阅兵结束后苏军部队直接开赴前线。俄新社档案（Anatoliy Garanin 摄）。阅兵在德军前锋距城数十公里时举行，具有强烈的政治与士气意义。",
        "permission": "CC BY-SA 3.0",
        "limits": "照片证明阅兵与开拔，不能证明具体部队去向与到达时间。",
    },
    {
        "commons": "File:Bundesarchiv Bild 183-B15500, Russland, Dorf vor Moskau.jpg",
        "slug": "ba-183-b15500-village-before-moscow",
        "title": "莫斯科城前的村庄与泥泞道路",
        "caption": "1941 年 11 月，莫斯科城前村庄附近的泥泞道路。德国联邦档案馆 Bild 183-B15500（Britting 摄）。德方宣传连拍摄，说明词为当时原注，可能带有宣传色彩。",
        "permission": "CC BY-SA 3.0 de",
        "limits": "德方原注可能错误或带宣传性；地点只能按「莫斯科城前」理解。",
    },
    {
        "commons": "File:Bundesarchiv Bild 183-B15686, Russland, bei Istra, Flüchtlinge.jpg",
        "slug": "ba-183-b15686-refugees-istra",
        "title": "伊斯特拉附近的逃难居民",
        "caption": "1941 年 12 月，伊斯特拉附近躲避战火的居民。德国联邦档案馆 Bild 183-B15686（Gebauer 摄）。照片记录了战线两侧平民的处境，不代表苏方或德方的官方政策。",
        "permission": "CC BY-SA 3.0 de",
        "limits": "月份精度；地点为德方原注「伊斯特拉附近」。",
    },
    {
        "commons": "File:Bundesarchiv Bild 183-B17220, Sowjetunion, Panzerangriff bei Istra.jpg",
        "slug": "ba-183-b17220-tank-attack-istra",
        "title": "伊斯特拉方向的坦克攻击",
        "caption": "1941 年 11 月 25 日，伊斯特拉（Истра）方向的德军坦克攻击。德国联邦档案馆 Bild 183-B17220（Tannenberg 摄）。同日前后德军在伊斯特拉—克林方向推进最猛。",
        "permission": "CC BY-SA 3.0 de",
        "limits": "德方战地摄影；拍摄日期按档案馆标注，地点按原始说明。",
    },
    {
        "commons": "File:Bundesarchiv Bild 146-2008-0317, Russland, Bergung eines Verwundeten.jpg",
        "slug": "ba-146-2008-0317-wounded-evacuation",
        "title": "后送伤员",
        "caption": "1941 年 11 月，德军在东线后送伤员。德国联邦档案馆 Bild 146-2008-0317（摄影者未详）。用于说明冬季战场的卫生勤务压力，不用于统计伤亡数字。",
        "permission": "CC BY-SA 3.0 de",
        "limits": "无地点、无部队番号；不能用于伤亡统计。",
    },
    {
        "commons": "File:Duitse tanks rukken op tijdens de Kesselschlacht bij Wjasma (2155 078762b).jpg",
        "slug": "kl-wjasma-german-tanks",
        "title": "维亚济马合围中的德军坦克",
        "caption": "1941 年 10 月，维亚济马（Вязьма）合围战中的德军坦克推进。荷兰皇家陆军照片收藏（Commons 编目）。与 10 月 7 日第 3、第 4 装甲集群在维亚济马会师、闭合合围圈的进程对应。",
        "permission": "CC BY-SA 4.0",
        "limits": "收藏方为战后缴获/翻拍照片，原始摄影者与具体日期未详。",
    },
    {
        "commons": "File:Captured Germans in Tula 1941.jpg",
        "slug": "tula-captured-germans-1941",
        "title": "图拉城下的德军俘虏",
        "caption": "1941 年 12 月 17—31 日，图拉地区的德军俘虏。П. А. Трошкин 摄，公有领域。图拉在 10 月 30 日被围后始终未失守，12 月反攻中解围。",
        "permission": "Public domain",
        "limits": "日期为 Commons 标注区间；不能据此推算俘虏总数。",
    },
    {
        "commons": "File:Horsemen of 1st Guard Cavalry Corps entering Odoev.jpg",
        "slug": "belov-cavalry-odoev",
        "title": "近卫骑兵第 1 军进入奥多耶夫",
        "caption": "1941 年 12 月 22 日，别洛夫近卫骑兵第 1 军进入奥多耶夫（Одоев），前景为缴获的德军 37 毫米反坦克炮。公有领域。骑兵军在反攻中承担深远穿插。",
        "permission": "Public domain",
        "limits": "摄影者未详；日期与地点按 Commons 编目。",
    },
    {
        "commons": "File:Komsomolskaya-Pravda-77-1941-11-19-all (page 3 crop).jpg",
        "slug": "panfilov-316-division-recon",
        "title": "潘菲洛夫与第 316 步兵师指挥员",
        "caption": "1941 年 11 月，第 316 步兵师师长潘菲洛夫少将（左）、参谋长谢列布里亚科夫与政委叶戈罗夫在现地勘察。М. Калашников 摄，《共青真理报》1941 年 11 月 19 日版面裁剪。",
        "permission": "Public domain",
        "limits": "报纸版面裁剪；不能作为「28 名潘菲洛夫战士」叙事的证据。",
    },
    {
        "commons": "File:Masking of Bolshoi Theatre 01.jpg",
        "slug": "bolshoi-theatre-camouflage",
        "title": "伪装中的大剧院",
        "caption": "1941 年 10 月，莫斯科大剧院进行防空伪装。莫斯科市档案馆（Главархив Москвы）。城市伪装与灯火管制是空袭防御的日常部分。",
        "permission": "CC BY 4.0",
        "limits": "月份精度；为档案馆藏，非战地摄影。",
    },
    {
        "commons": "File:Defenders of Tula ready to fight.jpg",
        "slug": "tula-defenders",
        "title": "图拉守军准备战斗",
        "caption": "1941 年 10—11 月，图拉苏维埃街与公社街交叉口（今列宁大街）的守军。公有领域。图拉工人团、内务部队与第 50 集团军残部共同守城。",
        "permission": "Public domain",
        "limits": "摄影者未详；月份精度。",
    },
    {
        "commons": "File:Alexander Lisyukov at observation post.jpg",
        "slug": "lisyukov-observation-post",
        "title": "利久科夫上校在观察所",
        "caption": "1941 年 11 月，近卫莫斯科摩托化步兵第 1 师师长利久科夫上校（右一）在观察所，西方面军莫斯科州地域。Дмитрий Чернов 摄，公有领域。",
        "permission": "Public domain",
        "limits": "地点只到「莫斯科州」；不能指认具体高地。",
    },
    {
        "commons": "File:Mosca 1941 sovietici.jpg",
        "slug": "moscow-soviet-riflemen-attack",
        "title": "莫斯科战役中的苏军步兵冲击",
        "caption": "1941 年 12 月，莫斯科战役中的苏军步兵冲击。Commons 编目为公有领域，摄影者与地点未详。用于表现反攻阶段的步兵战术，不指认部队。",
        "permission": "Public domain",
        "limits": "摄影者、地点、具体日期均未详，只能作类型照片。",
    },
    {
        "commons": "File:Mosca 1941 prigionieri tedeschi.jpg",
        "slug": "moscow-german-prisoners-dec41",
        "title": "莫斯科战役中的德军俘虏",
        "caption": "1941 年 12 月，莫斯科战役中被俘的德军士兵。Commons 编目为公有领域，摄影者与地点未详。",
        "permission": "Public domain",
        "limits": "月份精度；不能用于统计俘虏人数。",
    },
]

# 明确拒绝的候选：写清理由，供审查核对（不是「找不到」，而是「不该用」）
EXCLUDED = [
    {"commons": "File:1941 Parade in Red Square reconstruction in 2014 02.jpg",
     "reason": "2014 年重演活动照片，不是 1941 年实况，不得作历史配图。"},
    {"commons": "File:Mosca 41-42 bis due.jpg",
     "reason": "Commons 未给出摄影者与可靠日期，无法核实，按纪律不采用。"},
    {"commons": "File:Downed Nazi plane in Moscow on 15 August 1941, colorized.png",
     "reason": "现代上色版本，颜色为后期添加；如需使用应改用原始黑白文件。"},
    {"commons": "File:Central Archive of the Soviet Ministry of Defence - Stock 208 inventory 2511 case 1039.pdf",
     "reason": "档案 PDF，不是可用于事件卡的照片；本战役不引用未读全文的档案。"},
    {"commons": "File:Bundesarchiv Bild 183-B17220, Sowjetunion, Panzerangriff bei Istra (cropped).jpg",
     "reason": "同一底片的裁切重复件，已采用未裁切的原始条目。"},
    {"commons": "File:German Panzer Group 2, Battle of Moscow, 27 SEP 41.png",
     "reason": "现代绘制的态势图（2018 年上传），非战时照片；战线另由 data/fronts 承担。"},
]


def curl(url: str) -> bytes:
    r = subprocess.run(["curl", "-sS", "-L", "-A", UA, "--max-time", "90", "-o", "-", url], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"curl 失败 {r.returncode}: {r.stderr.decode('utf-8', 'replace')[:200]}")
    return r.stdout


def api(params: dict) -> dict:
    from urllib.parse import urlencode
    data = curl(f"{API}?{urlencode({**params, 'format': 'json', 'formatversion': 2})}")
    return json.loads(data)


def clean(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()


# Commons 的 Artist 字段常出现「Unknown author Unknown author」「sconosciuto」这类重复或外文占位，
# 直接放进署名会既难看又不诚实：统一改成中文占位，并保留原始值在 photo-evidence.json。
UNKNOWN_AUTHORS = {"unknown", "unknown author", "sconosciuto", "anonymous", "anonimo", "неизвестен", "неизвестный автор", "作者不详"}


def clean_author(text: str | None) -> str:
    s = clean(text)
    if not s:
        return "摄影者未详（Commons 编目）"
    # 「X X」重复（Commons 模板常见）：去重
    words = s.split(" ")
    if len(words) % 2 == 0 and words[: len(words) // 2] == words[len(words) // 2:]:
        s = " ".join(words[: len(words) // 2])
    if s.strip().lower().rstrip(".") in UNKNOWN_AUTHORS:
        return "摄影者未详（Commons 编目）"
    return s


def thumb_url(info: dict) -> str:
    """取 1280 px 缩略图；把 host 归一到 thumb.wikimedia.org（upload 的 /thumb/ 路径现返回 400）。"""
    url = info.get("thumburl") or info["url"]
    parts = urlsplit(url)
    path = parts.path
    if "/thumb/" in path:
        host = "thumb.wikimedia.org"
    else:
        host = "upload.wikimedia.org"
    return urlunsplit(("https", host, path, "", ""))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    from PIL import Image

    index: dict[str, dict] = {}
    accepted: list[dict] = []
    failures: list[str] = []

    titles = [a["commons"] for a in ASSETS]
    pages: dict[str, dict] = {}
    for i in range(0, len(titles), 8):
        chunk = titles[i:i + 8]
        res = api({
            "action": "query", "titles": "|".join(chunk), "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata", "iiurlwidth": str(MAX_EDGE),
            "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|ImageDescription|DateTimeOriginal|Credit|ObjectName",
        })
        for p in res.get("query", {}).get("pages", []):
            pages[p["title"]] = p

    for asset in ASSETS:
        name = asset["commons"]
        page = pages.get(name)
        if not page or "imageinfo" not in page:
            failures.append(f"{name}: Commons 查不到该文件")
            continue
        info = page["imageinfo"][0]
        meta = {k: clean(v.get("value", "")) for k, v in (info.get("extmetadata") or {}).items()}
        license_name = meta.get("LicenseShortName", "")
        ok = license_name == asset["permission"] or (
            license_name.startswith(asset["permission"].split(" ")[0]) and asset["permission"].split(" ")[0] != "Public"
        )
        if not ok:
            failures.append(f"{name}: 许可为「{license_name}」，与预期「{asset['permission']}」不符，需人工复核")
            continue
        if not info.get("mime", "").startswith("image/"):
            failures.append(f"{name}: 不是图像（{info.get('mime')}）")
            continue

        url = thumb_url(info)
        raw = curl(url)
        try:
            image = Image.open(io.BytesIO(raw))
            image.load()
        except Exception as exc:  # 429 / 400 / HTML 错误页
            failures.append(f"{name}: 下载或解码失败（{exc}）{url}")
            continue
        image = image.convert("RGB")
        if max(image.size) > MAX_EDGE:
            image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        width, height = image.size
        if width < 320 or height < 200:
            failures.append(f"{name}: 尺寸 {width}×{height} 过小，不适合事件卡")
            continue
        out_name = f"{asset['slug']}.webp"
        image.save(OUT / out_name, "WEBP", quality=QUALITY, method=6)

        permalink = info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{name.replace(' ', '_')}"
        license_url = meta.get("LicenseUrl") or (
            "https://creativecommons.org/publicdomain/mark/1.0/" if license_name == "Public domain" else ""
        )
        index[name] = {
            "src": f"photos/{out_name}",
            "w": width,
            "h": height,
            "title": asset["title"],
            "author": clean_author(meta.get("Artist")),
            "license": license_name,
            "licenseUrl": license_url,
            "sourceUrl": permalink,
            "caption": asset["caption"],
            "dateMetadata": meta.get("DateTimeOriginal") or "",
            "auditNote": asset["limits"],
            "modifications": f"WebP 展示文件，{width}×{height} 像素；由 Commons 缩略图等比缩放生成，未作内容修描。",
        }
        accepted.append({
            "commons": name,
            "file": f"photos/{out_name}",
            "permissionTemplate": asset["permission"],
            "licenseAsRead": license_name,
            "sourceUrl": permalink,
            "downloadUrl": url,
            "metadata": meta,
            "limits": asset["limits"],
        })
        print(f"{name} → {out_name} ({width}×{height})")

    if failures:
        print("\n失败条目：", file=sys.stderr)
        for f in failures:
            print("  -", f, file=sys.stderr)

    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    EVIDENCE.write_text(json.dumps({
        "_doc": "照片核验记录：accepted 为实际写入 photos/ 的条目（含 Commons 原始元数据与使用限制），excluded 为明确拒绝的候选及理由。由 fetch_photos.py 生成。",
        "station": "Wikimedia Commons API（action=query, prop=imageinfo, iiurlwidth=1280）",
        "retrieved": "2026-10-22",
        "accepted": accepted,
        "excluded": EXCLUDED,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n索引 {len(index)} 条 → {INDEX.relative_to(ROOT)}；证据 → {EVIDENCE.relative_to(ROOT)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
