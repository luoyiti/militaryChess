#!/usr/bin/env python3
"""Read back generated WOFF2 cmap/name tables to validate offline text and notices."""
from __future__ import annotations

import json
import re
from fontTools.ttLib import TTFont
from subset import ASCII, CACHE, FACES, FALLBACK_NOTO_OTF, OUT, scan_chars


def declared_fallbacks(family: str, weight: int) -> tuple[set[int], list[str]]:
    covered: set[int] = set()
    files: list[str] = []
    css = (OUT / "fonts.css").read_text("utf-8")
    for body in re.findall(r"@font-face\s*\{([^}]+)\}", css):
        if f"font-family: '{family}'" not in body or f"font-weight: {weight}" not in body or "unicode-range:" not in body:
            continue
        filename = re.search(r"url\('\./([^']+)" , body).group(1)
        ranges = re.search(r"unicode-range:\s*([^;]+)", body).group(1)
        points: set[int] = set()
        for lo, hi in re.findall(r"U\+([0-9A-F]+)(?:-([0-9A-F]+))?", ranges):
            start = int(lo, 16)
            points.update(range(start, int(hi, 16) + 1) if hi else [start])
        covered.update(points & TTFont(OUT / filename).getBestCmap().keys())
        files.append(filename)
    return covered, files


def main() -> int:
    chars = scan_chars()
    chinese = {ord(c) for c in chars if 0x3400 <= ord(c) <= 0x9FFF or 0x20000 <= ord(c) <= 0x2FA1F}
    latin = {ord(c) for c in ASCII}
    # Verify accents actually used by the project; the broad baseline includes characters
    # some original families never contained and is intentionally a superset.
    accents = {ord(c) for c in scan_chars(include_base=False) if 0xC0 <= ord(c) <= 0x24F}
    report = []
    for name, srcname, weight, family, cjk in FACES:
        path = OUT / f"{name}.woff2"
        font = TTFont(path)
        cmap = font.getBestCmap()
        requested = chinese | latin | accents if cjk else latin
        fallbacks, fallback_files = declared_fallbacks(family, weight)
        missing = sorted(requested - cmap.keys() - fallbacks)
        source = CACHE / srcname
        if not source.exists():
            source = CACHE / FALLBACK_NOTO_OTF[weight]
        source_font = TTFont(source)
        # Preserve the original embedded copyright and license information through subsetting.
        source_notices = {(n.nameID, n.toUnicode()) for n in source_font["name"].names if n.nameID in (0, 13, 14)}
        notices = {(n.nameID, n.toUnicode()) for n in font["name"].names if n.nameID in (0, 13, 14)}
        retained = source_notices <= notices
        row = {"file": path.name, "family": family, "weight": weight, "bytes": path.stat().st_size,
               "chineseChecked": len(chinese) if cjk else 0, "asciiChecked": len(latin),
               "latinAccentsChecked": len(accents) if cjk else 0,
               "declaredFallbacks": fallback_files,
               "missing": [chr(cp) for cp in missing], "noticesRetained": retained}
        report.append(row)
        print(f"{path.name}: missing={len(missing)} notices={retained}")
        if missing or not retained:
            print(json.dumps(row, ensure_ascii=False))
            return 1
    (OUT / "coverage.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"全部 8 款离线字体通过，汉字 {len(chinese)} 个，ASCII {len(latin)} 个，拉丁扩展 {len(accents)} 个；原版权/许可记录保留")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
