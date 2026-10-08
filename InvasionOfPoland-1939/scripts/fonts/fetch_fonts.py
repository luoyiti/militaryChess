#!/usr/bin/env python3
"""下载 OFL/Apache 字体到 scripts/.cache/e/fonts/（已存在则跳过）。

用法: python scripts/fonts/fetch_fonts.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "scripts/.cache/e/fonts"
UA = {"User-Agent": "junqi-wargame/0.1 (educational; contact: local)"}

GF = "https://raw.githubusercontent.com/google/fonts/main"
# 本地文件名 -> 候选 URL（依次尝试）
FONTS: dict[str, list[str]] = {
    "NotoSerifSC-VF.ttf": [
        f"{GF}/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    ],
    "NotoSerifSC-Regular.otf": [
        "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf",
    ],
    "NotoSerifSC-Bold.otf": [
        "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/SubsetOTF/SC/NotoSerifSC-Bold.otf",
    ],
    "LXGWWenKai-Regular.ttf": [
        "https://github.com/lxgw/LxgwWenKai/releases/latest/download/LXGWWenKai-Regular.ttf",
        "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf",
    ],
    "SpecialElite-Regular.ttf": [
        f"{GF}/apache/specialelite/SpecialElite-Regular.ttf",
        f"{GF}/ofl/specialelite/SpecialElite-Regular.ttf",
    ],
    "StardosStencil-Regular.ttf": [f"{GF}/ofl/stardosstencil/StardosStencil-Regular.ttf"],
    "StardosStencil-Bold.ttf": [f"{GF}/ofl/stardosstencil/StardosStencil-Bold.ttf"],
    "Oswald-VF.ttf": [f"{GF}/ofl/oswald/Oswald%5Bwght%5D.ttf"],
}
# 可选：Noto Serif SC 只需 VF 或 Regular+Bold OTF 之一
OPTIONAL_GROUPS = [{"NotoSerifSC-VF.ttf"}, {"NotoSerifSC-Regular.otf", "NotoSerifSC-Bold.otf"}]


def download(name: str, urls: list[str]) -> bool:
    dst = CACHE / name
    if dst.exists() and dst.stat().st_size > 10_000:
        print(f"[skip] {name} ({dst.stat().st_size/1e6:.1f} MB)")
        return True
    for url in urls:
        try:
            print(f"[get ] {name} <- {url}")
            with requests.get(url, headers=UA, timeout=120, stream=True) as r:
                if r.status_code != 200:
                    print(f"   HTTP {r.status_code}")
                    continue
                tmp = dst.with_suffix(dst.suffix + ".part")
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(1 << 16):
                        f.write(chunk)
                head = tmp.read_bytes()[:4]
                if head not in (b"\x00\x01\x00\x00", b"OTTO", b"true"):
                    print(f"   不是字体文件（头 {head!r}），丢弃")
                    tmp.unlink()
                    continue
                tmp.rename(dst)
                print(f"   ok {dst.stat().st_size/1e6:.1f} MB")
                return True
        except requests.RequestException as e:
            print(f"   失败: {e}")
        time.sleep(1)
    return False


def main() -> int:
    CACHE.mkdir(parents=True, exist_ok=True)
    ok: dict[str, bool] = {}
    # Noto Serif SC：优先 VF，失败再下 OTF
    ok["NotoSerifSC-VF.ttf"] = download("NotoSerifSC-VF.ttf", FONTS["NotoSerifSC-VF.ttf"])
    if not ok["NotoSerifSC-VF.ttf"]:
        for n in ("NotoSerifSC-Regular.otf", "NotoSerifSC-Bold.otf"):
            ok[n] = download(n, FONTS[n])
    for n, urls in FONTS.items():
        if n.startswith("NotoSerifSC"):
            continue
        ok[n] = download(n, urls)
    noto_ok = ok.get("NotoSerifSC-VF.ttf") or (ok.get("NotoSerifSC-Regular.otf") and ok.get("NotoSerifSC-Bold.otf"))
    missing = [n for n, v in ok.items() if not v and not n.startswith("NotoSerifSC")]
    if not noto_ok:
        missing.append("NotoSerifSC")
    if missing:
        print("缺失:", missing)
        return 1
    print("全部字体就绪")
    return 0


if __name__ == "__main__":
    sys.exit(main())
