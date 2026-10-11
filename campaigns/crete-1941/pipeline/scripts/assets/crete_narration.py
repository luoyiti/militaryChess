#!/usr/bin/env python3
"""Build five modern English narration clips using the installed macOS voice."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://nzhistory.govt.nz/war/the-battle-for-crete/"
PHASES = [
    ("landing", "1941-05-20T08:00:00", "空降开始 · Airborne invasion",
     "May twentieth, nineteen forty one. German gliders and paratroopers descend near Maleme and Canea. British Commonwealth and Greek defenders resist fiercely. Later landings at Rethymno and Heraklion meet similar resistance. By nightfall, the invasion remains dangerously uncertain.", "the-battle-day-1-3"),
    ("maleme", "1941-05-21T18:00:00", "马莱迈机场 · The airfield turns the battle",
     "May twenty first. After the defenders withdraw from Hill one hundred and seven, German troops secure Maleme airfield. Transport aircraft bring mountain troops into the battle despite artillery fire. A delayed New Zealand counterattack the following morning fails to recover the airfield.", "the-battle-day-1-3"),
    ("west", "1941-05-24T12:00:00", "西部防线 · The western front contracts",
     "May twenty fourth. German reinforcements push east from Maleme and threaten the Allied flank. The defenders gather around Galatas and Canea. Rethymno and Heraklion still resist. Fighting around Galatas will force another withdrawal, despite a determined New Zealand counterattack.", "the-battle-day-4-6"),
    ("retreat", "1941-05-27T12:00:00", "翻越白山 · Retreat to the south coast",
     "May twenty seventh. Australian and Maori troops strike back at Forty Second Street, delaying the German pursuit. The main Allied force retreats across the mountains toward Sfakia. The Royal Navy prepares evacuation, while troops at Heraklion await a separate withdrawal by sea.", "retreat-days-7-9"),
    ("aftermath", "1941-06-01T12:00:00", "撤离终止 · Evacuation ends",
     "June first. The final evacuation ships have left Sfakia. Thousands of Allied soldiers remain on Crete and become prisoners, while some evade capture with help from local people. The airborne invasion has succeeded, but heavy German losses and the island's continuing resistance mark its aftermath.", "capitulation-capture"),
]


def main():
    out = ROOT / "public/audio/narration"
    out.mkdir(parents=True, exist_ok=True)
    phases = []
    with tempfile.TemporaryDirectory(prefix="crete-narration-") as tmp:
        for phase_id, date, title, transcript, source in PHASES:
            aiff = Path(tmp) / f"{phase_id}.aiff"
            mp3 = out / f"crete-{phase_id}.mp3"
            subprocess.run(["say", "-v", "Daniel", "-r", "145", "-o", str(aiff), transcript], check=True)
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", str(aiff), "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", "44100", "-ac", "1", str(mp3)], check=True)
            seconds = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(mp3)], text=True))
            if seconds < 5:
                raise RuntimeError(f"Narration clip is unexpectedly short: {mp3}")
            phases.append({"id": phase_id, "date": date, "src": f"audio/narration/{mp3.name}", "title": title, "transcript": transcript, "sources": [BASE + source], "durationSec": round(seconds, 3), "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest()})
    manifest = {"language": "en-GB", "synthetic": True, "voice": "macOS Daniel", "createdOn": "2026-10-11", "note": "现代合成英语讲解，非历史录音；英文文本为本项目按所列史料编写的概要。", "phases": phases}
    (ROOT / "public/audio/narration.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    credits_path = ROOT / "public/credits.json"
    credits = json.loads(credits_path.read_text())
    credits["narration"] = manifest
    credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"clips": len(phases), "seconds": sum(p["durationSec"] for p in phases)}, indent=2))


if __name__ == "__main__":
    main()
