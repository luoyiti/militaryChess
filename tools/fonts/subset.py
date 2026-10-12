#!/usr/bin/env python3
"""扫描引擎、总台与全部战役的界面文字，把字体子集化为 woff2，生成 shared/fonts/fonts.css。

所有页面共用这一套子集（并集），新增战役后重新运行即可补齐字形：
    npm run fonts            # 字符集未变时跳过
    npm run fonts -- --force # 强制重建
原始字体在 .cache/fonts/（先运行 tools/fonts/fetch_fonts.py 下载）。
"""
from __future__ import annotations

import hashlib
import json
import sys
import time
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache/fonts"
OUT = ROOT / "shared/fonts"
STAMP = CACHE / ".subset_stamp.json"

# 会显示在界面上的文字：引擎与总台源码、战役清单与数据、署名与照片说明（离线管线 pipeline/ 与文档不扫描）
SCAN_GLOBS = [
    "index.html",
    "engine/**/*.ts", "engine/**/*.css",
    "hub/**/*.ts", "hub/**/*.css", "hub/**/*.json", "shared/handoff/*.js",
    "campaigns/*/campaign.json", "campaigns/*/campaign.ts", "campaigns/*/campaign.css", "campaigns/*/index.html",
    "campaigns/*/plugins/**/*.ts",
    "campaigns/*/data/**/*.json",
    "public/campaigns/*/credits.json", "public/campaigns/*/photos/index.json", "public/campaigns/*/audio/*.json",
    "shared/audio/music/library.json",
    "tools/templates/campaign/**/*",
]

ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
LATIN = "".join(chr(c) for c in range(0xA0, 0x180))  # Latin-1 补充 + Latin Extended-A（波兰文、德文、捷克文、挪威文等）
GREEK = "".join(chr(c) for c in range(0x391, 0x3CA))  # 希腊地名
CYRILLIC = "".join(chr(c) for c in range(0x410, 0x450)) + "ЁёІіЇїЄєЎўЈјЉљЊњЋћЏџ"
PUNCT = (
    "，。、；：？！…—–·‘’“”「」『』（）《》〈〉【】〔〕［］｛｝〖〗～￥％＃＆＊＋－／＜＝＞＠＼＾＿｜"
    "　・•°′″‰§№←↑→↓↔⇒×÷±≈≤≥∞℃·‹›«»„‚†‡▶▸▾❚█ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ"
    "０１２３４５６７８９"
)
BASE_ZH = "年月日时分秒点第一二三四五六七八九十百千万亿零〇两个师旅团军集群方面战役推演开始暂停播放设置关于来源许可照片音乐音效字体"

# (输出名, 源文件, 字重, family, 是否 CJK)
FACES = [
    ("NotoSerifSC-400", "NotoSerifSC-VF.ttf", 400, "WB Serif SC", True),
    ("NotoSerifSC-700", "NotoSerifSC-VF.ttf", 700, "WB Serif SC", True),
    ("LXGWWenKai-400", "LXGWWenKai-Regular.ttf", 400, "WB Hand", True),
    ("SpecialElite-400", "SpecialElite-Regular.ttf", 400, "WB Typewriter", False),
    ("StardosStencil-400", "StardosStencil-Regular.ttf", 400, "WB Stencil", False),
    ("StardosStencil-700", "StardosStencil-Bold.ttf", 700, "WB Stencil", False),
    ("Oswald-400", "Oswald-VF.ttf", 400, "WB Head", False),
    ("Oswald-700", "Oswald-VF.ttf", 700, "WB Head", False),
]
FALLBACK_NOTO_OTF = {400: "NotoSerifSC-Regular.otf", 700: "NotoSerifSC-Bold.otf"}


def scan_chars() -> tuple[set[str], int]:
    chars: set[str] = set()
    files: set[Path] = set()
    for g in SCAN_GLOBS:
        files.update(p for p in ROOT.glob(g) if p.is_file())
    for f in sorted(files):
        try:
            t = f.read_text("utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if f.suffix == ".json":
            # JSON 中可能有 \\uXXXX 转义，解码后再取字符
            try:
                t += json.dumps(json.loads(t), ensure_ascii=False)
            except json.JSONDecodeError:
                pass
        chars.update(t)
    chars.update(ASCII + LATIN + GREEK + CYRILLIC + PUNCT + BASE_ZH)
    return {c for c in chars if ord(c) >= 0x20 and not (0xD800 <= ord(c) <= 0xDFFF)}, len(files)


def is_cjk(c: str) -> bool:
    o = ord(c)
    return 0x2E80 <= o <= 0x9FFF or 0xF900 <= o <= 0xFAFF or 0xFF00 <= o <= 0xFFEF or 0x3000 <= o <= 0x303F or 0x20000 <= o


def build(name: str, src: Path, weight: int, unicodes: list[int]) -> Path:
    t0 = time.time()
    font = TTFont(src, lazy=False)
    opts = subset.Options()
    opts.flavor = None
    opts.layout_features = ["kern", "liga", "calt", "locl", "ccmp", "mark", "mkmk", "tnum", "lnum", "pnum", "frac"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    if "fvar" in font:
        axes = {a.axisTag: (a.minValue, a.maxValue) for a in font["fvar"].axes}
        loc = {tag: max(lo, min(hi, weight)) for tag, (lo, hi) in axes.items() if tag == "wght"}
        font = instancer.instantiateVariableFont(font, loc, updateFontNames=False)
        if "fvar" in font:  # 其余轴固定到默认值
            font = instancer.instantiateVariableFont(font, {a.axisTag: a.defaultValue for a in font["fvar"].axes})
    font.flavor = "woff2"
    dst = OUT / f"{name}.woff2"
    font.save(dst)
    print(f"  {dst.name:28s} {dst.stat().st_size/1024:8.1f} KB  ({time.time()-t0:.1f}s)")
    return dst


def main() -> int:
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    chars, nfiles = scan_chars()
    cjk_count = sum(1 for c in chars if is_cjk(c))
    print(f"扫描 {nfiles} 个文件：字符 {len(chars)} 个，其中 CJK {cjk_count} 个")
    all_u = sorted(ord(c) for c in chars)
    latin_u = sorted(ord(c) for c in chars if not is_cjk(c))
    h = hashlib.sha1(("".join(sorted(chars))).encode("utf-8")).hexdigest()
    outputs = [OUT / f"{n}.woff2" for n, *_ in FACES]
    if not force and STAMP.exists() and all(p.exists() for p in outputs) and (OUT / "fonts.css").exists():
        if json.loads(STAMP.read_text()).get("hash") == h:
            print("字符集未变化，跳过（--force 强制重建）")
            report()
            return 0

    for name, srcname, weight, _fam, cjk in FACES:
        src = CACHE / srcname
        if not src.exists() and srcname.startswith("NotoSerifSC"):
            src = CACHE / FALLBACK_NOTO_OTF[weight]
        if not src.exists():
            print(f"[缺少] {src}（先运行 python tools/fonts/fetch_fonts.py）")
            return 1
        build(name, src, weight, all_u if cjk else latin_u)

    css = ["/* 由 tools/fonts/subset.py 生成（全部战役 + 总台文字的并集子集），勿手改。字体均为 SIL OFL 1.1（Special Elite 为 Apache 2.0）。 */"]
    for name, _src, weight, fam, _cjk in FACES:
        css.append(
            "@font-face {\n"
            f"  font-family: '{fam}';\n"
            f"  src: url('./{name}.woff2') format('woff2');\n"
            f"  font-weight: {weight};\n"
            "  font-style: normal;\n"
            "  font-display: swap;\n"
            "}"
        )
    (OUT / "fonts.css").write_text("\n".join(css) + "\n", "utf-8")
    STAMP.write_text(json.dumps({"hash": h, "chars": len(chars), "cjk": cjk_count}))
    report()
    return 0


def report() -> None:
    tot = 0
    for f in sorted(OUT.glob("*.woff2")):
        tot += f.stat().st_size
    print(f"  shared/fonts 合计 {tot/1024/1024:.2f} MB")


if __name__ == "__main__":
    sys.exit(main())
