#!/usr/bin/env python3
"""敦刻尔克大撤退：收集战役数据引用的 Wikimedia Commons 照片，核实许可、下载并转成 780px 宽 webp。

扫描（凡是 `{commons: "File:…", caption?}` 结构都收集，容错任意嵌套）：
  campaigns/dunkirk-1940/data/events.json
  campaigns/dunkirk-1940/pipeline/events/*.json      （各写手的事件草稿，合并前也能先下好照片）
  campaigns/dunkirk-1940/data/equipment.json
  campaigns/dunkirk-1940/pipeline/assets/extra_photos.json   （照片池：封面、开场与备用照片）
  campaigns/dunkirk-1940/campaign.json               （intro.photo / intro.photoFallback）

许可：通过 Commons API 的 extmetadata（LicenseShortName / Artist / LicenseUrl）核实，只接受
公有领域 / CC0 / CC BY / CC BY-SA；人工排除名单见 pipeline/assets/exclude_photos.json。

输出：
  public/campaigns/dunkirk-1940/photos/<slug>.webp
  public/campaigns/dunkirk-1940/photos/index.json   { "File:…": { src, w, h, title, author, license, licenseUrl, sourceUrl, caption } }
  public/campaigns/dunkirk-1940/credits.json 的 photos 段（audio / music / fonts 段原样保留）
  .work/dunkirk-1940/photos_report.json             （拒绝清单与来源分布）
缓存：.cache/dunkirk-1940/photos/。可重复执行：已转换的 webp 直接跳过。

用法（仓库根目录）：
  .venv/bin/python campaigns/dunkirk-1940/pipeline/assets/fetch_photos.py
  .venv/bin/python campaigns/dunkirk-1940/pipeline/assets/fetch_photos.py --keep-unused
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import commons  # noqa: E402

CAMPAIGN = "dunkirk-1940"
CDIR = HERE.parents[1]           # campaigns/dunkirk-1940
ROOT = CDIR.parents[1]           # 仓库根
PUB = ROOT / "public/campaigns" / CAMPAIGN
OUT = PUB / "photos"
CACHE = ROOT / ".cache" / CAMPAIGN / "photos"
REPORT = ROOT / ".work" / CAMPAIGN / "photos_report.json"
TARGET_W = 780
QUALITY = 78


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def load_json(p: Path, quiet: bool = False) -> Any:
    try:
        return json.loads(p.read_text("utf-8"))
    except FileNotFoundError:
        if not quiet:
            print(f"[warn] 缺失 {rel(p)}（跳过）")
    except json.JSONDecodeError as e:
        print(f"[warn] {rel(p)} 解析失败：{e}（跳过）")
    return None


def walk_photos(obj: Any, origin: str, acc: dict[str, dict[str, Any]]) -> None:
    if isinstance(obj, dict):
        if isinstance(obj.get("id"), str):
            origin = f"{origin.split('#')[0]}#{obj['id']}"
        c = obj.get("commons")
        if isinstance(c, str) and c.startswith("File:"):
            e = acc.setdefault(c, {"origins": [], "caption": ""})
            e["origins"].append(origin)
            if not e["caption"] and obj.get("caption"):
                e["caption"] = obj["caption"]
        for v in obj.values():
            walk_photos(v, origin, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_photos(v, origin, acc)


def add_intro(manifest: Any, origin: str, acc: dict[str, dict[str, Any]]) -> None:
    intro = (manifest or {}).get("intro") or {}
    for k in ("photo", "photoFallback"):
        f = intro.get(k)
        if isinstance(f, str) and f.startswith("File:"):
            e = acc.setdefault(f, {"origins": [], "caption": ""})
            e["origins"].append(f"{origin}#intro.{k}")
            if k == "photo" and not e["caption"] and intro.get("caption"):
                e["caption"] = intro["caption"]


def slugify(title: str) -> str:
    name = re.sub(r"^File:", "", title)
    name = re.sub(r"\.[A-Za-z0-9]+$", "", name)
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    s = re.sub(r"^bundesarchiv-bild-", "ba-", s)[:56].strip("-")
    h = hashlib.sha1(title.encode("utf-8")).hexdigest()[:6]
    return f"{s}-{h}" if s else h


def collect() -> dict[str, dict[str, Any]]:
    acc: dict[str, dict[str, Any]] = {}
    sources: list[Path] = [CDIR / "data/events.json", CDIR / "data/equipment.json"]
    sources += sorted((CDIR / "pipeline/events").glob("*.json"))
    for p in sources:
        d = load_json(p)
        if d is not None:
            walk_photos(d, rel(p), acc)
    extra = load_json(HERE / "extra_photos.json") or {}
    for k, v in extra.items():
        e = acc.setdefault(k, {"origins": [], "caption": ""})
        e["origins"].append(f"extra#{v.get('topic', '')}")
        if not e["caption"] and v.get("caption"):
            e["caption"] = v["caption"]
    for p in (CDIR / "pipeline/manifest/texts.json", CDIR / "campaign.json"):
        add_intro(load_json(p, quiet=True), rel(p), acc)
    return acc


def to_webp(raw: bytes, dst: Path) -> None:
    im = Image.open(io.BytesIO(raw))
    im.load()
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > TARGET_W:
        im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=QUALITY, method=6)


def write_credits(index: dict[str, Any]) -> None:
    path = PUB / "credits.json"
    credits = load_json(path) or {}
    photos = [
        {"file": v["src"], "title": v.get("title") or k[5:], "author": v.get("author", "Unknown"),
         "license": v.get("license", ""), "licenseUrl": v.get("licenseUrl", ""), "sourceUrl": v.get("sourceUrl", "")}
        for k, v in sorted(index.items(), key=lambda kv: kv[1]["src"])
    ]
    out: dict[str, Any] = {"photos": photos}
    for k, v in credits.items():
        if k != "photos":
            out[k] = v
    for k in ("audio", "music", "fonts"):
        out.setdefault(k, [])
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--keep-unused", action="store_true", help="不删除未被引用的 webp")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    wanted = collect()
    exclude: dict[str, str] = load_json(HERE / "exclude_photos.json", quiet=True) or {}
    print(f"共收集 {len(wanted)} 个 Commons 文件名")
    if not wanted:
        (PUB / "photos").mkdir(parents=True, exist_ok=True)
        print("没有待处理的照片（数据里还没有 photo 字段）")
        return 0
    info = commons.query_files(sorted(wanted), thumb_width=1000)

    index_path = OUT / "index.json"
    old_index: dict[str, Any] = load_json(index_path, quiet=True) or {}

    index: dict[str, Any] = {}
    rejected: list[dict[str, Any]] = []
    for title in sorted(wanted):
        meta = wanted[title]
        inf = info.get(title, {"exists": False, "reason": "未查询到"})
        if title in exclude:
            rejected.append({"file": title, "reason": f"人工排除：{exclude[title]}", "origins": meta["origins"]})
            print(f"[rej ] {title}: 人工排除")
            continue
        if not inf.get("exists"):
            rejected.append({"file": title, "reason": inf.get("reason", "文件不存在"), "origins": meta["origins"]})
            print(f"[rej ] {title}: {inf.get('reason')}")
            continue
        if not str(inf.get("mime", "")).startswith("image/"):
            rejected.append({"file": title, "reason": f"非图片 {inf.get('mime')}", "origins": meta["origins"]})
            continue
        if not commons.license_ok(inf["license"]):
            rejected.append({"file": title, "reason": f"许可不合规：{inf['license'] or '未知'}", "origins": meta["origins"]})
            print(f"[rej ] {title}: 许可 {inf['license']!r}")
            continue
        slug = slugify(title)
        dst = OUT / f"{slug}.webp"
        if not dst.exists():
            raw = CACHE / f"{slug}.src"
            if not raw.exists():
                print(f"[get ] {title}")
                r = commons.get(inf["thumburl"])
                if r.status_code != 200:
                    rejected.append({"file": title, "reason": f"下载失败 HTTP {r.status_code}", "origins": meta["origins"]})
                    continue
                raw.write_bytes(r.content)
            try:
                to_webp(raw.read_bytes(), dst)
            except Exception as e:  # noqa: BLE001
                rejected.append({"file": title, "reason": f"图片解码失败 {e}", "origins": meta["origins"]})
                raw.unlink(missing_ok=True)
                continue
        with Image.open(dst) as im2:
            w, h = im2.size
        entry: dict[str, Any] = {
            "src": f"photos/{dst.name}",
            "w": w,
            "h": h,
            "title": inf.get("objectName") or re.sub(r"\.[A-Za-z0-9]+$", "", title[5:]),
            "author": inf["artist"] or "Unknown",
            "license": inf["license"],
            "licenseUrl": commons.license_url_fallback(inf["license"], inf["licenseUrl"]),
            "sourceUrl": inf["descriptionurl"],
        }
        if meta.get("caption"):
            entry["caption"] = meta["caption"]
        index[title] = entry

    if not args.keep_unused:
        keep = {Path(v["src"]).name for v in index.values()}
        for f in OUT.glob("*.webp"):
            if f.name not in keep:
                print(f"[del ] 未引用 {f.name}")
                f.unlink()

    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
    write_credits(index)
    REPORT.write_text(json.dumps({"ok": len(index), "rejected": rejected}, ensure_ascii=False, indent=1), "utf-8")
    total = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    by_origin: dict[str, int] = {}
    for t in index:
        for o in {o.split("#")[0] for o in wanted[t]["origins"]}:
            by_origin[o] = by_origin.get(o, 0) + 1
    print(f"\n完成：{len(index)} 张（{total / 1e6:.2f} MB），来源分布 {by_origin}；拒绝 {len(rejected)} 张（见 {rel(REPORT)}）")
    for r in rejected:
        print(f"  - {r['file']}：{r['reason']}（{','.join(r['origins'])}）")
    gone = sorted(set(old_index) - set(index))
    if gone:
        print(f"  本次移除条目：{gone}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
