#!/usr/bin/env python3
"""下载公有领域/CC0 音乐录音（Wikimedia Commons），转 webm(Opus 96k) + m4a(AAC 128k)，写 public/audio/music.json。

用法: python scripts/assets/fetch_music.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "scripts/.cache/e/music"
OUT = ROOT / "public/audio/music"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

TRACKS: list[dict[str, Any]] = [
    {
        "id": "polonaise",
        "commons": "File:Chopin - Polonaise No. 3 in A major, Op. 40 No. 1 'Military' (Aya Higuchi).flac",
        "title": "A 大调波兰舞曲“军队”，Op. 40 No. 1",
        "composer": "弗雷德里克·肖邦（Fryderyk Chopin）",
        "performer": "Aya Higuchi（Musopen）",
        "note": "1939 年 9 月华沙围城期间，波兰电台反复播放肖邦作品。",
    },
    {
        "id": "elegy",
        "commons": "File:Chopin Pitman sonata no 2 in b flat minor funeral march III marche funebre lento.ogg",
        "title": "降 b 小调第二钢琴奏鸣曲 Op. 35 第三乐章“葬礼进行曲”（节选：进行曲主段）",
        "composer": "弗雷德里克·肖邦（Fryderyk Chopin）",
        "performer": "Paul Pitman（Musopen）",
        # 进行曲主段约在 147 s 处以弱奏终止、随后进入降 D 大调中段；在 138–152 s 找能量最低点截断并淡出
        "cut_search": [138.0, 152.0],
    },
    {
        "id": "hejnal",
        "commons": "File:Cracow trumpet signal.ogg",
        "title": "克拉科夫圣母教堂号角（Hejnał mariacki）",
        "composer": "波兰传统号角曲",
        "performer": "克拉科夫圣母教堂号手",
    },
]


def rms_windows(path: Path, win: float = 1.0) -> np.ndarray:
    p = subprocess.run([FFMPEG, "-v", "error", "-i", str(path), "-ac", "1", "-ar", "8000", "-f", "f32le", "-"],
                       capture_output=True, check=True)
    x = np.frombuffer(p.stdout, dtype=np.float32)
    n = int(8000 * win / 4)  # 0.25 s 步长
    k = len(x) // n
    e = (x[: k * n].reshape(k, n) ** 2).mean(1)
    return np.sqrt(np.convolve(e, np.ones(4) / 4, mode="same"))


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    info = commons.query_files([t["commons"] for t in TRACKS])
    result = []
    for t in TRACKS:
        inf = info[t["commons"]]
        if not inf.get("exists") or not commons.license_ok(inf["license"]):
            print(f"[rej ] {t['id']}: {inf.get('reason') or inf.get('license')}")
            continue
        ext = Path(inf["url"].split("?")[0]).suffix
        raw = RAW / f"{t['id']}{ext}"
        if not raw.exists() or raw.stat().st_size != inf.get("size"):
            print(f"[get ] {t['commons']} ({inf['size']/1e6:.1f} MB)")
            r = commons.get(inf["url"], stream=True)
            r.raise_for_status()
            with open(raw, "wb") as f:
                for chunk in r.iter_content(1 << 16):
                    f.write(chunk)
        webm, m4a = OUT / f"{t['id']}.webm", OUT / f"{t['id']}.m4a"
        fresh = webm.exists() and m4a.exists() and min(webm.stat().st_mtime, m4a.stat().st_mtime) > raw.stat().st_mtime
        if fresh and "--force" not in sys.argv:
            print(f"[skip] {t['id']} 已转码（--force 重转）")
        else:
            encode(t, raw, webm, m4a)
        d = float(subprocess.run(["/opt/homebrew/bin/ffprobe", "-v", "error", "-show_entries", "format=duration",
                                  "-of", "csv=p=0", str(webm)], capture_output=True, text=True).stdout.strip())
        print(f"[ok  ] {t['id']:10s} {d:6.1f}s  webm {webm.stat().st_size/1e6:.2f} MB  m4a {m4a.stat().st_size/1e6:.2f} MB  {inf['license']}")
        entry = {
            "id": t["id"], "title": t["title"], "composer": t["composer"], "performer": t["performer"],
            "src": [f"audio/music/{webm.name}", f"audio/music/{m4a.name}"],
            "license": inf["license"],
            "licenseUrl": commons.license_url_fallback(inf["license"], inf["licenseUrl"]),
            "sourceUrl": inf["descriptionurl"],
            "durationSec": round(d, 1),
            "commonsFile": re.sub(r"^File:", "", t["commons"]),
        }
        if t.get("note"):
            entry["note"] = t["note"]
        result.append(entry)
    (ROOT / "public/audio/music.json").write_text(json.dumps(result, ensure_ascii=False, indent=1), "utf-8")
    print("写入 public/audio/music.json")
    return 0


def encode(t: dict[str, Any], raw: Path, webm: Path, m4a: Path) -> None:
    # 两遍 loudnorm（linear=true，保持钢琴动态，不做动态压缩）
    p = subprocess.run([FFMPEG, "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-18:TP=-1.5:LRA=20:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    mj = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S).group(0))
    af = [f"loudnorm=I=-18:TP=-1.5:LRA=20:linear=true:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}"
          f":measured_LRA={mj['input_lra']}:measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}"]
    dur_args: list[str] = []
    if "cut_search" in t:
        e = rms_windows(raw)
        a, b = (int(v * 4) for v in t["cut_search"])
        i = a + int(np.argmin(e[a:b]))
        cut = i / 4 + 0.5
        print(f"   {t['id']}: 在 {cut:.1f}s 处截断（窗口能量 {20*np.log10(e[i]+1e-9):.1f} dB）")
        dur_args = ["-t", f"{cut:.2f}"]
        af.insert(0, f"afade=t=out:st={max(0, cut-4):.2f}:d=4")
    afs = ",".join(af)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(raw), *dur_args, "-af", afs, "-ar", "48000",
                    "-c:a", "libopus", "-b:a", "96k", "-vn", "-f", "webm", str(webm)], check=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(raw), *dur_args, "-af", afs, "-ar", "44100",
                    "-c:a", "aac", "-b:a", "128k", "-vn", "-movflags", "+faststart", str(m4a)], check=True)


if __name__ == "__main__":
    sys.exit(main())
