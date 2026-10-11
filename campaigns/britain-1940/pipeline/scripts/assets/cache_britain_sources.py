#!/usr/bin/env python3
"""Cache the institutional sources used to prepare the curated 1940 campaign.

This cache is research input, not bundled copyrighted museum prose.
"""
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts/.cache/britain/sources"
BASE = "https://www.rafmuseum.org.uk/research/online-exhibitions/history-of-the-battle-of-britain/"
ARTICLES = ["the-battle-of-britain-phase-one", "the-battle-of-britain-phase-two", "the-battle-of-britain-phase-three", "the-battle-of-britain-phase-four", "the-battle-of-britain-phase-five", "subordinate-raf-commanders", "british-defences", "radar-the-battle-winner", "operation-sealion"]

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ARTICLES:
        r = requests.get(BASE + name + "/", timeout=35)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        h = soup.find("h1")
        raw = soup.get_text(" ", strip=True)
        key = h.get_text(" ", strip=True) if h else ""
        start = raw.rfind(key) if key else 0
        body = raw[start:].split("LONDON")[0].strip()
        (OUT / (name + ".txt")).write_text(body, encoding="utf-8")
        print(name, body[:6500], flush=True)
    r = requests.get("https://www.iwm.org.uk/sites/default/files/press-release/Battle_of_Britain_and_Blitz_Factsheet.pdf", timeout=35)
    r.raise_for_status()
    (OUT / "iwm-factsheet.pdf").write_bytes(r.content)
    print("IWM factsheet downloaded", len(r.content), flush=True)

if __name__ == "__main__":
    main()
