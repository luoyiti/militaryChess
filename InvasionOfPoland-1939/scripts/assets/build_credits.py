#!/usr/bin/env python3
"""汇总 public/credits.json：{ photos, audio, music, fonts }，每项 { file, title, author, license, licenseUrl, sourceUrl }。

依赖：public/photos/index.json、scripts/.cache/e/audio/clips/manifest.json、public/audio/music.json。
用法: python scripts/assets/build_credits.py
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OFL = "SIL Open Font License 1.1"
OFL_URL = "https://openfontlicense.org/"

FONTS = [
    {"file": "fonts/NotoSerifSC-400.woff2, fonts/NotoSerifSC-700.woff2", "title": "Noto Serif SC（思源宋体，子集）",
     "author": "Google / Adobe", "license": OFL, "licenseUrl": OFL_URL,
     "sourceUrl": "https://github.com/google/fonts/tree/main/ofl/notoserifsc"},
    {"file": "fonts/LXGWWenKai-400.woff2", "title": "霞鹜文楷 LXGW WenKai（子集）",
     "author": "LXGW（落霞与孤鹜）", "license": OFL, "licenseUrl": OFL_URL,
     "sourceUrl": "https://github.com/lxgw/LxgwWenKai"},
    {"file": "fonts/SpecialElite-400.woff2", "title": "Special Elite", "author": "Astigmatic",
     "license": "Apache License 2.0", "licenseUrl": "https://www.apache.org/licenses/LICENSE-2.0",
     "sourceUrl": "https://github.com/google/fonts/tree/main/apache/specialelite"},
    {"file": "fonts/StardosStencil-400.woff2, fonts/StardosStencil-700.woff2", "title": "Stardos Stencil",
     "author": "Vernon Adams", "license": OFL, "licenseUrl": OFL_URL,
     "sourceUrl": "https://github.com/google/fonts/tree/main/ofl/stardosstencil"},
    {"file": "fonts/Oswald-400.woff2, fonts/Oswald-700.woff2", "title": "Oswald",
     "author": "Vernon Adams, Kalapi Gajjar, Cyreal", "license": OFL, "licenseUrl": OFL_URL,
     "sourceUrl": "https://github.com/google/fonts/tree/main/ofl/oswald"},
]


def load(p: Path, default: Any) -> Any:
    try:
        return json.loads(p.read_text("utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"[warn] 无法读取 {p.relative_to(ROOT)}")
        return default


def main() -> None:
    photos_idx = load(ROOT / "public/photos/index.json", {})
    photos = [
        {"file": v["src"], "title": v.get("title") or k[5:], "author": v.get("author", "Unknown"),
         "license": v.get("license", ""), "licenseUrl": v.get("licenseUrl", ""), "sourceUrl": v.get("sourceUrl", "")}
        for k, v in sorted(photos_idx.items(), key=lambda kv: kv[1]["src"])
    ]
    manifest = load(ROOT / "scripts/.cache/e/audio/clips/manifest.json", {"clips": []})
    audio = []
    for c in manifest["clips"]:
        synth = bool(c.get("synthesized"))
        audio.append({
            "file": f"audio/sfx.webm#{c['id']}",
            "title": f"{c['id']}：{c.get('title', '')}" + ("（程序化合成）" if synth else ""),
            "author": c.get("author", ""),
            "license": c.get("license", ""),
            "licenseUrl": c.get("licenseUrl", ""),
            "sourceUrl": c.get("sourceUrl", ""),
        })
    music = [
        {"file": m["src"][0], "title": f"{m['title']} — {m['composer']}", "author": m["performer"],
         "license": m["license"], "licenseUrl": m.get("licenseUrl", ""), "sourceUrl": m["sourceUrl"]}
        for m in load(ROOT / "public/audio/music.json", [])
    ]
    out = {"photos": photos, "audio": audio, "music": music, "fonts": FONTS}
    (ROOT / "public/credits.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), "utf-8")
    print(f"public/credits.json：照片 {len(photos)}，音效 {len(audio)}，音乐 {len(music)}，字体 {len(FONTS)}")


if __name__ == "__main__":
    main()
