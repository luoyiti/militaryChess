#!/usr/bin/env python3
"""Fetch five Commons assets verified for the Britain campaign; preserve the Poland index.

Only PD / CC-BY-SA assets are bundled. Original photographs are resized as WebP;
their subjects, dates and authors are retained. Historical speech and podcast links
are references and are never downloaded by this script.
"""
from pathlib import Path
import hashlib
import io
import json
import re
import time
import xml.etree.ElementTree as ET

from PIL import Image
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
UA = "BattleOfBritain1940/1.0 (educational historical atlas; https://localhost/)"
PD_URL = "https://creativecommons.org/publicdomain/mark/1.0/"
ASSETS = [
    {"commons": "File:The Battle of Britain HU54418.jpg", "file": "photos/britain-hu54418.webp", "author": "Unknown photographer; Imperial War Museums HU 54418", "license": "Public domain (PD-UKGov)", "licenseUrl": PD_URL, "caption": "1940 年 7 月 29 日，霍金吉的第 32 中队飞行员在 Hurricane P3522 前休息；战役背景照片，非所选事件的现场记录。", "role": "side"},
    {"commons": "File:A Spitfire of No. 19 Squadron is refuelled at Fowlmere, near Duxford, September 1940. CH1372.jpg", "file": "photos/britain-ch1372.webp", "author": "Stanley Arthur Devon, RAF official photographer; Imperial War Museums CH 1372", "license": "Public domain (PD-UKGov)", "licenseUrl": PD_URL, "caption": "1940 年 9 月，福尔米尔机场地勤为第 19 中队的 Spitfire 加油；说明地勤周转，不代表某次精确出击。", "role": "unit"},
    {"commons": "File:Bundesarchiv Bild 101I-342-0620-07A, Belgien-Frankreich, Flieger vor Flugzeug.jpg", "file": "photos/britain-bundesarchiv-0620.webp", "author": "Bundesarchiv, Bild 101I-342-0620-07A / Seuffert / CC-BY-SA 3.0", "license": "CC BY-SA 3.0 DE", "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/", "caption": "1940 年 8 月，比利时／法国战区的德国飞行员与飞机；西线部署背景照片，非不列颠空战某次袭击现场。", "role": "side"},
    {"commons": "File:Heinkel He 111 over Wapping, East London.jpg", "file": "photos/britain-he111-wapping.webp", "author": "German Air Force photographer; Imperial War Museums", "license": "Public domain", "licenseUrl": PD_URL, "caption": "1940 年 9 月 7 日，Heinkel He 111 飞越伦敦东区沃平和泰晤士河港区。", "role": "event"},
    {"commons": "File:Battle of Britain map.svg", "file": "maps/battle-of-britain-map.svg", "author": "Hohum (Wikimedia Commons)", "license": "Public domain (PD-self)", "licenseUrl": PD_URL, "caption": "不列颠空战防区、机场和德军部署参考图；本作以独立地理底图呈现战区。", "role": "reference"},
]

def request(session, url, **kwargs):
    error = None
    for attempt in range(4):
        try:
            r = session.get(url, timeout=35, **kwargs)
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            error = e
            print(f"retry {attempt + 1}: {type(e).__name__}", flush=True)
            time.sleep(1 + attempt)
    raise error

def main():
    session = requests.Session()
    session.headers["User-Agent"] = UA
    cache = ROOT / "scripts/.cache/britain/media"
    cache.mkdir(parents=True, exist_ok=True)
    idx_path = ROOT / "public/photos/index.json"
    index = json.loads(idx_path.read_text()) if idx_path.exists() else {}
    credits_path = ROOT / "public/credits.json"
    credits = json.loads(credits_path.read_text())
    report = []
    for asset in ASSETS:
        title = asset["commons"]
        page_url = "https://commons.wikimedia.org/wiki/" + requests.utils.quote(title.replace(" ", "_"), safe="/:,")
        page = request(session, page_url)
        (cache / (Path(asset["file"]).stem + ".html")).write_text(page.text, encoding="utf-8")
        soup = BeautifulSoup(page.text, "html.parser")
        license_markers = [e.get_text(" ", strip=True) for e in soup.select(".licensetpl_short")]
        expected = "CC BY-SA 3.0" if "Bundesarchiv" in title else "Public domain"
        if not any(expected in label for label in license_markers):
            raise RuntimeError("Expected verified license marker missing: " + title)
        media = soup.select_one(".fullMedia a.internal")
        if media is None:
            media = soup.select_one(".fullMedia a")
        if media is None:
            raise RuntimeError("Commons page has no original media link: " + title)
        download_url = media["href"]
        if download_url.startswith("//"):
            download_url = "https:" + download_url
        raw = request(session, download_url).content
        dst = ROOT / "public" / asset["file"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.suffix == ".svg":
            ET.fromstring(raw)
            dst.write_bytes(raw)
            dims = None
        else:
            im = Image.open(io.BytesIO(raw)); im.load()
            im = im.convert("RGB")
            if im.width > 1200:
                im = im.resize((1200, round(im.height * 1200 / im.width)), Image.Resampling.LANCZOS)
            im.save(dst, "WEBP", quality=85, method=6)
            dims = im.size
        # Preserve the verified attribution string from the Bundesarchiv license
        # block; institutional Creator templates are not the photographer's name.
        entry = {"src": asset["file"], "title": title[5:], "author": asset["author"], "license": asset["license"], "licenseUrl": asset["licenseUrl"], "sourceUrl": page_url, "caption": asset["caption"], "role": asset["role"]}
        if dims:
            entry.update(w=dims[0], h=dims[1]); index[title] = entry
        credit = {"file": asset["file"], **{k: entry[k] for k in ["title", "author", "license", "licenseUrl", "sourceUrl"]}}
        category = "maps" if dst.suffix == ".svg" else "photos"
        existing = [x for x in credits.get(category, []) if x["file"] != credit["file"]]
        credits[category] = existing + [credit]
        report.append({"commons": title, "file": asset["file"], "bytes": dst.stat().st_size, "sha256": hashlib.sha256(dst.read_bytes()).hexdigest(), "decoded": True})
        idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
        credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n")
        (cache / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print("saved", asset["file"], dst.stat().st_size, flush=True)
    (ROOT / "public/maps/index.json").write_text(json.dumps([{"src": x["file"], **{k: x[k] for k in ["commons", "author", "license", "licenseUrl", "caption"]}} for x in ASSETS if x["file"].startswith("maps/")], ensure_ascii=False, indent=2) + "\n")

if __name__ == "__main__":
    main()
