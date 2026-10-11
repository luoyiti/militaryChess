#!/usr/bin/env python3
"""收集 events.json / equipment.json / extra_photos.json 中的 Commons 照片，核实许可后下载并转为 webp。

输出：public/photos/<slug>.webp、public/photos/index.json；报告 .work/e/photos_report.json
可重复执行：已下载且源文件未变的跳过。
用法: python scripts/assets/fetch_photos.py
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/photos"
CACHE = ROOT / "scripts/.cache/e/photos"
REPORT = ROOT / ".work/e/photos_report.json"
TARGET_W = 800
QUALITY = 78


def walk_photos(obj: Any, origin: str, acc: dict[str, dict[str, Any]]) -> None:
    """递归寻找 {commons: 'File:...', caption?} 结构，容错任意嵌套。"""
    if isinstance(obj, dict):
        if isinstance(obj.get("id"), str):
            origin = f"{origin.split('#')[0]}#{obj['id']}"
        c = obj.get("commons")
        if isinstance(c, str) and c.startswith("File:"):
            e = acc.setdefault(c, {"origins": [], "caption": obj.get("caption") or ""})
            e["origins"].append(origin)
            if not e.get("caption") and obj.get("caption"):
                e["caption"] = obj["caption"]
        for v in obj.values():
            walk_photos(v, origin, acc)
    elif isinstance(obj, list):
        for v in obj:
            walk_photos(v, origin, acc)


def load_json(p: Path) -> Any:
    try:
        return json.loads(p.read_text("utf-8"))
    except FileNotFoundError:
        print(f"[warn] 缺失 {p.relative_to(ROOT)}（跳过）")
    except json.JSONDecodeError as e:
        print(f"[warn] {p.relative_to(ROOT)} 解析失败：{e}（跳过）")
    return None


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
    for rel in ("src/data/events.json", "src/data/equipment.json"):
        d = load_json(ROOT / rel)
        if d is not None:
            walk_photos(d, rel, acc)
    extra = load_json(ROOT / "scripts/assets/extra_photos.json") or {}
    for k, v in extra.items():
        e = acc.setdefault(k, {"origins": [], "caption": ""})
        e["origins"].append("extra")
        e["role"] = v.get("role", "side")
        if v.get("caption"):
            e.setdefault("extraCaption", v["caption"])
            if not e["caption"]:
                e["caption"] = v["caption"]
    return acc


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    wanted = collect()
    exclude: dict[str, str] = load_json(ROOT / "scripts/assets/exclude_photos.json") or {}
    print(f"共收集 {len(wanted)} 个 Commons 文件名")
    info = commons.query_files(sorted(wanted), thumb_width=1000)

    index_path = OUT / "index.json"
    old_index: dict[str, Any] = {}
    if index_path.exists():
        try:
            old_index = json.loads(index_path.read_text("utf-8"))
        except json.JSONDecodeError:
            old_index = {}

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
                im = Image.open(io.BytesIO(raw.read_bytes()))
                im.load()
            except Exception as e:  # noqa: BLE001
                rejected.append({"file": title, "reason": f"图片解码失败 {e}", "origins": meta["origins"]})
                raw.unlink(missing_ok=True)
                continue
            if im.mode not in ("RGB", "L"):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                im = im.convert("RGBA")
                bg.paste(im, mask=im.split()[3])
                im = bg
            elif im.mode == "L":
                im = im.convert("RGB")
            if im.width > TARGET_W:
                im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)), Image.LANCZOS)
            im.save(dst, "WEBP", quality=QUALITY, method=6)
        else:
            print(f"[skip] {title}")
        with Image.open(dst) as im2:
            w, h = im2.size
        entry: dict[str, Any] = {
            "src": f"photos/{slug}.webp",
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
        if meta.get("role"):
            entry["role"] = meta["role"]
        index[title] = entry

    # 清理不再被引用的 webp
    keep = {Path(v["src"]).name for v in index.values()}
    for f in OUT.glob("*.webp"):
        if f.name not in keep:
            print(f"[del ] 未引用 {f.name}")
            f.unlink()

    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=1), "utf-8")
    REPORT.write_text(json.dumps({"ok": len(index), "rejected": rejected}, ensure_ascii=False, indent=1), "utf-8")
    total = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    by_origin: dict[str, int] = {}
    for t in index:
        for o in wanted[t]["origins"]:
            k = o.split("#")[0]
            by_origin[k] = by_origin.get(k, 0) + 1
    print(f"\n完成：{len(index)} 张（{total/1e6:.2f} MB），来源分布 {by_origin}；拒绝 {len(rejected)} 张（见 {REPORT.relative_to(ROOT)}）")
    for r in rejected:
        print(f"  - {r['file']}：{r['reason']}（{','.join(r['origins'])}）")
    if old_index and set(old_index) - set(index):
        print(f"  本次移除条目：{sorted(set(old_index) - set(index))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
