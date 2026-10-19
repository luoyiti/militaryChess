#!/usr/bin/env python3
"""核验 Commons 许可并生成本战役的照片文件与署名索引。"""
from __future__ import annotations

import io
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public/campaigns/shanghai-1937/photos"
API = "https://commons.wikimedia.org/w/api.php"
SESSION = requests.Session()
SESSION.headers["User-Agent"] = "militaryChess/0.2 (educational history; https://localhost/)"
ASSETS = [
    {
        "commons": "File:Shanghai1937KMT street88th.jpg",
        "file": "street-position.webp",
        "title": "上海街角的中国军队",
        "caption": "1937年上海街角阵地上的中国军人；Commons编目为第88师，具体拍摄日未详。",
        "permission": "PD-ROC-oldphoto",
    },
    {
        "commons": "File:Shanghai1937KMT trench.jpg",
        "file": "trench-position.webp",
        "title": "淞沪会战中的中国军队壕阵",
        "caption": "1937年淞沪会战中的中国军队壕阵；具体日期与阵地位置未详。",
        "permission": "PD-ROC-oldphoto",
    },
    {
        "commons": "File:1937 Japan navy flagship in Shanghai.jpg",
        "file": "izumo-1937.webp",
        "title": "1937年上海附近的出云号",
        "caption": "1937年上海附近的日本海军出云号；照片不用于确定某日锚位或证明受创战果。",
        "permission": "PD-Japan-oldphoto",
    },
]
EXCLUDED = [
    {
        "commons": "File:Shanghai1937IJA hangzhou bay.jpg",
        "reason": "文件描述将金山卫登陆标作1937年8—10月，与11月5日开始登陆的档案依据冲突；不作为该日实景配图。",
    },
    {
        "commons": "File:Australian War Memorial 096905.jpg",
        "reason": "原编目日期为1945年9月17日，地点是新不列颠获释人员营地，不是1937年四行仓库战斗现场。",
    },
]


def clean(text: str) -> str:
    import html

    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()


def query(params: dict) -> dict:
    response = SESSION.get(API, params={"format": "json", "formatversion": 2, **params}, timeout=45)
    response.raise_for_status()
    data = response.json()
    if "error" in data:
        raise RuntimeError(data["error"])
    return data["query"]


def main() -> None:
    result = query({
        "action": "query", "titles": "|".join(a["commons"] for a in ASSETS),
        "prop": "imageinfo|revisions", "iiprop": "url|size|mime|extmetadata",
        "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|ImageDescription|Credit|DateTimeOriginal",
        "rvprop": "content", "rvslots": "main",
    })
    pages = {p["title"]: p for p in result["pages"]}
    OUT.mkdir(parents=True, exist_ok=True)
    index = {}
    evidence = {"excluded": EXCLUDED, "accepted": []}
    for asset in ASSETS:
        page = pages[asset["commons"]]
        info = page["imageinfo"][0]
        metadata = {key: clean(value.get("value", "")) for key, value in info["extmetadata"].items()}
        permission = asset["permission"]
        wikitext = page["revisions"][0]["slots"]["main"]["content"]
        if metadata.get("LicenseShortName") != "Public domain" or "{{" + permission + "}}" not in wikitext:
            raise RuntimeError(f"照片许可需要重新核实：{asset['commons']}")
        if not info["mime"].startswith("image/"):
            raise RuntimeError(f"照片不是图像：{asset['commons']}")
        parts = urlsplit(info["url"])
        url = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
        response = SESSION.get(url, timeout=45)
        response.raise_for_status()
        with Image.open(io.BytesIO(response.content)) as image:
            image = image.convert("RGB")
            image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            width, height = image.size
            image.save(OUT / asset["file"], "WEBP", quality=85, method=6)
        index[asset["commons"]] = {
            "src": f"photos/{asset['file']}", "w": width, "h": height,
            "title": asset["title"], "author": "作者不详（Commons编目）",
            "license": "Public domain", "licenseUrl": metadata.get("LicenseUrl") or "https://creativecommons.org/publicdomain/mark/1.0/",
            "sourceUrl": info["descriptionurl"], "caption": asset["caption"],
        }
        evidence["accepted"].append({
            "commons": asset["commons"], "permissionTemplate": permission,
            "sourceUrl": info["descriptionurl"], "originalImageUrl": url,
            "metadata": metadata, "filePageWikitext": wikitext,
            "limits": asset["caption"],
        })
        print(f"{asset['commons']} → {asset['file']} ({width}×{height})")
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (Path(__file__).parent / "photo-evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
