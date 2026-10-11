#!/usr/bin/env python3
"""扫描项目文本字符，子集化字体为 woff2，并生成 public/fonts/fonts.css。

先运行 scripts/fonts/fetch_fonts.py 下载原始字体。
用法: python scripts/fonts/subset.py [--force]
      （字符集未变且产物齐全时跳过；--force 强制重建）
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
CACHE = ROOT / "scripts/.cache/e/fonts"
OUT = ROOT / "public/fonts"
STAMP = ROOT / "scripts/.cache/e/fonts/.subset_stamp.json"

SCAN_GLOBS = ["src/**/*.ts", "src/**/*.json", "src/**/*.css", "src/**/*.html", "src/**/*.tsx", "config/**/*.json"]
SCAN_FILES = ["index.html", "public/credits.json", "public/photos/index.json", "public/audio/music.json"]

ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
LATIN = "".join(chr(c) for c in range(0xA0, 0x180))  # Latin-1 补充 + Latin Extended-A（波兰文、德文、捷克文等）
CYRILLIC = "".join(chr(c) for c in range(0x410, 0x450)) + "ЁёІіЇїЄєЎў"
PUNCT = (
    "，。、；：？！…—–·‘’“”「」『』（）《》〈〉【】〔〕［］｛｝〖〗～￥％＃＆＊＋－／＜＝＞＠＼＾＿｜"
    "　・•°′″‰§№←↑→↓↔⇒×÷±≈≤≥∞℃·‹›«»„‚†‡"
    "０１２３４５６７８９"
)
BASE_ZH = "年月日时分秒点第一二三四五六七八九十百千万亿零〇两个师旅团军集群方面德波苏斯洛伐克华沙战役推演开始暂停播放设置关于来源许可照片音乐音效字体"

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


def scan_chars(include_base: bool = True) -> set[str]:
    chars: set[str] = set()
    files: list[Path] = []
    for g in SCAN_GLOBS:
        files += list(ROOT.glob(g))
    files += [ROOT / f for f in SCAN_FILES if (ROOT / f).exists()]
    for f in files:
        try:
            t = f.read_text("utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if f.suffix == ".json":
            # JSON 中可能有 \uXXXX 转义，解码后再取字符
            try:
                t += json.dumps(json.loads(t), ensure_ascii=False)
            except json.JSONDecodeError:
                pass
        chars.update(t)
    print(f"扫描 {len(files)} 个文件")
    if include_base:
        chars.update(ASCII + LATIN + CYRILLIC + PUNCT + BASE_ZH)
    return {c for c in chars if ord(c) >= 0x20 and not (0xD800 <= ord(c) <= 0xDFFF)}


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
        loc = {}
        for tag, (lo, hi) in axes.items():
            loc[tag] = max(lo, min(hi, weight)) if tag == "wght" else None
        font = instancer.instantiateVariableFont(font, {k: v for k, v in loc.items() if v is not None}, updateFontNames=False)
        # 其余轴固定到默认值
        if "fvar" in font:
            font = instancer.instantiateVariableFont(font, {a.axisTag: a.defaultValue for a in font["fvar"].axes})
    font.flavor = "woff2"
    dst = OUT / f"{name}.woff2"
    font.save(dst)
    print(f"  {dst.name:28s} {dst.stat().st_size/1024:8.1f} KB  ({time.time()-t0:.1f}s)")
    return dst


def write_css(chars: set[str]) -> None:
    css = ["/* 由 scripts/fonts/subset.py 生成，勿手改。字体均为 SIL OFL 1.1（Special Elite 为 Apache 2.0）。 */"]
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
    # The original Noto SC has a limited Latin Extended repertoire. Fill its gaps
    # from the already shipped WenKai font so credits remain readable offline.
    accents = {ord(c) for c in chars if 0xC0 <= ord(c) <= 0x24F}
    hand = TTFont(OUT / "LXGWWenKai-400.woff2").getBestCmap()
    for name, _src, weight, fam, _cjk in FACES:
        if fam != "WB Serif SC":
            continue
        primary = TTFont(OUT / f"{name}.woff2").getBestCmap()
        missing = sorted((accents - primary.keys()) & hand.keys())
        if missing:
            ranges = ", ".join(f"U+{cp:04X}" for cp in missing)
            css.append(
                "/* 原 Noto SC 未收录的拉丁扩展字，由同项目的霞鹜文楷补齐。 */\n"
                "@font-face {\n"
                f"  font-family: '{fam}';\n"
                "  src: url('./LXGWWenKai-400.woff2') format('woff2');\n"
                f"  font-weight: {weight};\n"
                "  font-style: normal;\n"
                "  font-display: swap;\n"
                f"  unicode-range: {ranges};\n"
                "}"
            )
    (OUT / "fonts.css").write_text("\n".join(css) + "\n", "utf-8")


def main() -> int:
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    chars = scan_chars()
    cjk_count = sum(1 for c in chars if is_cjk(c))
    print(f"字符总数 {len(chars)}，其中 CJK {cjk_count}")
    all_u = sorted(ord(c) for c in chars)
    latin_u = sorted(ord(c) for c in chars if not is_cjk(c))
    h = hashlib.sha1(("".join(sorted(chars))).encode("utf-8")).hexdigest()
    outputs = [OUT / f"{n}.woff2" for n, *_ in FACES]
    if not force and STAMP.exists() and all(p.exists() for p in outputs) and (OUT / "fonts.css").exists():
        if json.loads(STAMP.read_text()).get("hash") == h:
            print("字符集未变化，跳过（--force 强制重建）")
            write_css(chars)
            report()
            return 0

    for name, srcname, weight, _fam, cjk in FACES:
        src = CACHE / srcname
        if not src.exists() and srcname.startswith("NotoSerifSC"):
            src = CACHE / FALLBACK_NOTO_OTF[weight]
        if not src.exists():
            print(f"[miss] {src}（先运行 fetch_fonts.py）")
            return 1
        build(name, src, weight, all_u if cjk else latin_u)

    write_css(chars)
    STAMP.write_text(json.dumps({"hash": h, "chars": len(chars), "cjk": cjk_count}))
    report()
    return 0


def report() -> None:
    tot = 0
    for f in sorted(OUT.glob("*.woff2")):
        tot += f.stat().st_size
        print(f"  {f.name:28s} {f.stat().st_size/1024:8.1f} KB")
    print(f"  合计 {tot/1024/1024:.2f} MB")


if __name__ == "__main__":
    sys.exit(main())
