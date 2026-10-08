#!/usr/bin/env python3
"""下载/核实音效素材 → 裁剪、淡入淡出、响度归一（-16 LUFS）→ scripts/.cache/e/audio/clips/<id>.wav

来源优先级：Wikimedia Commons（PD/CC0/CC BY/CC BY-SA）→ freesound CC0 公开预览 → numpy 合成兜底。
每条记录来源、作者、许可到 scripts/.cache/e/audio/clips/manifest.json（build_sfx_sprite.sh 读取）。
用法: python scripts/assets/fetch_audio.py [--synth-only id,id]   然后 bash scripts/assets/build_sfx_sprite.sh
"""
from __future__ import annotations

import html
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402
import synth_py  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "scripts/.cache/e/audio/raw"
CLIPS = ROOT / "scripts/.cache/e/audio/clips"
FFMPEG = "/opt/homebrew/bin/ffmpeg"
SR = synth_py.SR
TARGET_LUFS = -16.0
PEAK_DBFS = -1.0

ORDER = [
    "typewriter", "bell", "stamp", "paper", "explosion", "artillery", "stuka", "bomber", "engine", "tank",
    "ship_gun", "siren", "radio", "morse", "mg", "rifle", "march", "cavalry", "ui_click", "fanfare",
    "amb_wind", "amb_front", "amb_radio",
]

# mode: onset=从首个起音开始；loudest=取能量最大的窗口；start=指定起点（秒）
# loop: 氛围循环（首尾交叉淡化为无缝）
SOURCES: dict[str, dict[str, Any]] = {
    "typewriter": {"commons": "File:WWS Typewriter.ogg", "mode": "loudest", "dur": 2.6},
    "bell": {"commons": "File:406243 stubb typewriter-ding-near-mono.wav", "mode": "onset", "dur": 1.1},
    "stamp": {"freesound": 470710, "mode": "onset", "dur": 1.2},
    "paper": {"freesound": 211246, "mode": "onset", "dur": 2.0},
    "explosion": {"commons": "File:Explosion 10.ogg", "mode": "onset", "dur": 3.0},
    "artillery": {"commons": "File:Sexton artillery firing.oga", "mode": "onset", "dur": 3.5},
    "stuka": {"freesound": 758467, "mode": "onset", "dur": 3.6},
    "bomber": {"freesound": 213099, "mode": "loudest", "dur": 4.0},
    "engine": {"freesound": 438085, "mode": "loudest", "dur": 3.5},
    "tank": {"freesound": 329800, "mode": "loudest", "dur": 4.0},
    "ship_gun": {"freesound": 187767, "mode": "onset", "dur": 4.0},
    "siren": {"commons": "File:Motorsirene - Feuerwehralarm.ogg", "mode": "onset", "dur": 4.0},
    "radio": {"commons": "File:Static B.wav", "mode": "start", "start": 0.0, "dur": 2.4},
    "morse": {"commons": "File:SOS.ogg", "mode": "onset", "dur": 2.8},
    "mg": {"freesound": 165394, "mode": "onset", "dur": 3.1},
    "rifle": {"commons": "File:Gunshots 8.ogg", "mode": "onset", "onset_db": -8, "dur": 1.1},
    "march": {"freesound": 240732, "mode": "start", "start": 0.0, "dur": 4.0},
    "cavalry": {"commons": "File:Six Horses Galloping By.ogg", "mode": "loudest", "dur": 4.0},
    "ui_click": {"commons": "File:Computer mouse single click.ogg", "mode": "onset", "dur": 0.3},
    "fanfare": {"commons": "File:Cracow trumpet signal.ogg", "mode": "onset", "dur": 4.0, "fade_out": 0.7},
    "amb_wind": {"commons": "File:Wind in Swedish pine forest at 25 mps.ogg", "mode": "start", "start": 8.0, "dur": 28.0, "loop": True},
    # 远处炮声：以 CC0 远距爆炸素材为“隆隆声”颗粒，随机散布在合成的低频底噪上
    "amb_front": {"derived": {"freesound": 209769}, "dur": 30.0, "loop": True},
    "amb_radio": {"freesound": 38693, "mode": "start", "start": 1.0, "dur": 24.0, "loop": True},
}


def decode(path: Path) -> np.ndarray:
    p = subprocess.run([FFMPEG, "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)


def write_wav(path: Path, x: np.ndarray) -> None:
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s16le", str(path)], input=x.astype(np.float32).tobytes(), check=True)


def measure_lufs(x: np.ndarray) -> float:
    # loudnorm 测量（短于 3 s 的片段先循环到 ≥3 s，避免门限窗口不足）
    y = x
    while len(y) < 3 * SR:
        y = np.concatenate([y, x])
    p = subprocess.run([FFMPEG, "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", "loudnorm=I=-16:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                       input=y.astype(np.float32).tobytes(), capture_output=True, check=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr.decode("utf-8", "ignore"), re.S)
    if not m:
        return -70.0
    v = json.loads(m.group(0))["input_i"]
    try:
        return float(v)
    except ValueError:
        return -70.0


def limiter(x: np.ndarray) -> np.ndarray:
    """ffmpeg alimiter：峰值限制在 -1 dBFS（前视 5 ms）。"""
    pad = np.zeros(int(0.05 * SR))
    y = np.concatenate([x, pad])
    lim = 10 ** (PEAK_DBFS / 20)
    p = subprocess.run([FFMPEG, "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", f"alimiter=limit={lim:.4f}:attack=5:release=80:level=false:latency=true",
                        "-f", "f32le", "-"], input=y.astype(np.float32).tobytes(), capture_output=True, check=True)
    out = np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)[: len(x)]
    if len(out) < len(x):
        out = np.concatenate([out, np.zeros(len(x) - len(out))])
    return np.clip(out, -lim, lim)


def normalize(x: np.ndarray) -> tuple[np.ndarray, float]:
    """线性增益到 -16 LUFS；若峰值超 -1 dBFS，最多允许 9 dB 的限幅，其余让步（瞬态类音效会略低于目标）。"""
    for _ in range(2):
        lufs = measure_lufs(x)
        gain_db = TARGET_LUFS - lufs if lufs > -60 else 0.0
        peak = np.max(np.abs(x)) or 1.0
        headroom_db = PEAK_DBFS - 20 * np.log10(peak)
        g = min(gain_db, headroom_db + 9.0)
        x = x * 10 ** (g / 20)
        if g > headroom_db:
            x = limiter(x)
        if abs(TARGET_LUFS - measure_lufs(x)) < 0.7:
            break
    return x, measure_lufs(x)


def onset(x: np.ndarray, db: float = -30) -> int:
    env = np.abs(x)
    thr = np.max(env) * 10 ** (db / 20)
    idx = np.argmax(env > thr)
    return max(0, idx - int(0.01 * SR))


def loudest(x: np.ndarray, n: int) -> int:
    if len(x) <= n:
        return 0
    c = np.concatenate([[0.0], np.cumsum(x ** 2)])
    e = c[n:] - c[:-n]
    return int(np.argmax(e))


def fade(x: np.ndarray, fin: float, fout: float) -> np.ndarray:
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a) ** 2
    if b:
        x[-b:] *= np.linspace(1, 0, b) ** 2
    return x


def make_loop(x: np.ndarray, n: int, xf: float = 2.0) -> np.ndarray:
    """取 n+xf 长度，将尾部 xf 与开头交叉淡化，使 out[-1]→out[0] 连续。"""
    m = int(xf * SR)
    if len(x) < n + m:
        reps = int(np.ceil((n + m) / len(x)))
        x = np.tile(x, reps)
    seg = x[: n + m]
    out = seg[:n].copy()
    w = np.linspace(0, 1, m)
    out[:m] = seg[:m] * np.sqrt(w) + seg[n:n + m] * np.sqrt(1 - w)
    return out


def trim_tail(x: np.ndarray, floor_db: float = -55) -> np.ndarray:
    thr = (np.max(np.abs(x)) or 1) * 10 ** (floor_db / 20)
    nz = np.nonzero(np.abs(x) > thr)[0]
    if len(nz) == 0:
        return x
    end = min(len(x), nz[-1] + int(0.05 * SR))
    return x[:max(end, int(0.3 * SR))]


# ---------- 下载 ----------

def fetch_commons(title: str) -> tuple[Path | None, dict[str, Any]]:
    info = commons.query_files([title])[title]
    if not info.get("exists"):
        return None, {"reason": "Commons 文件不存在"}
    if not commons.license_ok(info["license"]):
        return None, {"reason": f"许可不合规 {info['license']}"}
    ext = Path(info["url"]).suffix.lower() or ".bin"
    dst = RAW / (re.sub(r"[^A-Za-z0-9]+", "_", title[5:])[:60] + ext)
    if not dst.exists():
        r = commons.get(info["url"])
        if r.status_code != 200:
            return None, {"reason": f"下载失败 HTTP {r.status_code}"}
        dst.write_bytes(r.content)
    meta = {
        "source": "Wikimedia Commons", "title": title[5:], "author": info["artist"] or "Unknown",
        "license": info["license"], "licenseUrl": commons.license_url_fallback(info["license"], info["licenseUrl"]),
        "sourceUrl": info["descriptionurl"],
    }
    return dst, meta


def fetch_freesound(sid: int) -> tuple[Path | None, dict[str, Any]]:
    cache_meta = RAW / f"fs_{sid}.json"
    dst = RAW / f"fs_{sid}.mp3"
    if dst.exists() and cache_meta.exists():
        return dst, json.loads(cache_meta.read_text("utf-8"))
    # 通过 /s/<id>/ 跳转到声音页，核实 CC0
    r = commons.get(f"https://freesound.org/s/{sid}/")
    if r.status_code != 200:
        return None, {"reason": f"freesound 页面 HTTP {r.status_code}"}
    t = r.text
    if "publicdomain/zero" not in t:
        return None, {"reason": "freesound 许可非 CC0"}
    mp3 = re.search(r'data-mp3="([^"]+)"', t)
    title = re.search(r'<meta property="og:title" content="([^"]*)"', t)
    user = re.search(r'data-username="([^"]+)"', t)
    if not mp3:
        return None, {"reason": "freesound 无预览地址"}
    url = mp3.group(1).replace("-lq.mp3", "-hq.mp3")
    a = commons.get(url)
    if a.status_code != 200:
        a = commons.get(mp3.group(1))
    if a.status_code != 200:
        return None, {"reason": f"预览下载失败 HTTP {a.status_code}"}
    dst.write_bytes(a.content)
    meta = {
        "source": "freesound.org（CC0 公开预览 mp3）",
        "title": html.unescape(title.group(1)) if title else f"freesound #{sid}",
        "author": html.unescape(user.group(1)) if user else "Unknown",
        "license": "CC0 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "sourceUrl": r.url,
    }
    cache_meta.write_text(json.dumps(meta, ensure_ascii=False), "utf-8")
    return dst, meta


def fetch(spec: dict[str, Any]) -> tuple[Path | None, dict[str, Any]]:
    if "commons" in spec:
        return fetch_commons(spec["commons"])
    if "freesound" in spec:
        return fetch_freesound(spec["freesound"])
    return None, {"reason": "无来源"}


# ---------- 处理 ----------

def process(sid: str, spec: dict[str, Any], synth_only: set[str]) -> dict[str, Any]:
    loop = bool(spec.get("loop"))
    dur = float(spec["dur"])
    n = int(dur * SR)
    meta: dict[str, Any]
    x: np.ndarray | None = None
    if sid in synth_only:
        meta = {"reason": "指定合成"}
    elif "derived" in spec:
        src, m = fetch(spec["derived"])
        if src is not None:
            raw = decode(src)
            st = onset(raw)
            grain = trim_tail(raw[st: st + int(6 * SR)])
            grains = [grain, grain[: int(len(grain) * 0.7)]]
            grains = [fade(g, 0.01, min(0.8, len(g) / SR / 3)) for g in grains]
            x = synth_py.s_amb_front(dur + 2.0, booms=grains).astype(np.float64)
            m = dict(m)
            m["source"] = m["source"] + " + numpy 合成低频底噪（派生混音）"
            m["derived"] = True
            meta = m
        else:
            meta = m
    else:
        src, meta = fetch(spec)
        if src is not None:
            raw = decode(src)
            if loop:
                st = int(spec.get("start", 0) * SR)
                x = raw[st:]
            else:
                mode = spec.get("mode", "onset")
                if mode == "onset":
                    st = onset(raw, spec.get("onset_db", -30))
                elif mode == "loudest":
                    st = loudest(raw, n)
                else:
                    st = int(spec.get("start", 0) * SR)
                x = raw[st: st + n]
                if mode == "onset":
                    x = trim_tail(x)
    if x is None:
        reason = meta.get("reason", "")
        print(f"[synth] {sid}：{reason}")
        x = synth_py.SYNTH[sid]().astype(np.float64)
        meta = {"source": "synthesized", "title": f"程序化合成 {sid}", "author": "junqi 项目（numpy）",
                "license": "CC0 1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
                "sourceUrl": "", "synthesized": True, "fallbackReason": reason}
        if not loop:
            x = x[:n]
    x = x - np.mean(x)
    if loop:
        x = make_loop(x, n)
    else:
        x = x[: max(int(0.3 * SR), min(len(x), int(4.0 * SR)))]
        if len(x) < int(0.3 * SR):
            x = np.concatenate([x, np.zeros(int(0.3 * SR) - len(x))])
        fin = 0.004 if spec.get("mode", "onset") == "onset" else 0.05
        fout = spec.get("fade_out", min(0.3, len(x) / SR / 4))
        x = fade(x, fin, fout)
    x, lufs = normalize(x)
    out = CLIPS / f"{sid}.wav"
    write_wav(out, x)
    meta.update({"id": sid, "file": out.name, "samples": len(x), "durMs": round(len(x) / SR * 1000), "loop": loop,
                 "lufs": round(lufs, 1)})
    tag = "合成" if meta.get("synthesized") else meta.get("license")
    print(f"[ok  ] {sid:10s} {len(x)/SR:5.2f}s {lufs:6.1f} LUFS  {tag}  {meta.get('title', '')[:50]}")
    return meta


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    CLIPS.mkdir(parents=True, exist_ok=True)
    synth_only: set[str] = set()
    if "--synth-only" in sys.argv:
        synth_only = set(sys.argv[sys.argv.index("--synth-only") + 1].split(","))
    manifest = [process(sid, SOURCES[sid], synth_only) for sid in ORDER]
    (CLIPS / "manifest.json").write_text(json.dumps({"sr": SR, "clips": manifest}, ensure_ascii=False, indent=1), "utf-8")
    print(f"写入 {CLIPS.relative_to(ROOT)}/manifest.json；下一步：bash scripts/assets/build_sfx_sprite.sh")
    return 0


if __name__ == "__main__":
    sys.exit(main())
