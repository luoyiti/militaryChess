#!/usr/bin/env bash
# 将 scripts/.cache/e/audio/clips/*.wav 按 manifest 顺序拼接（段间 250 ms 静音），
# 输出 public/audio/sfx.webm（Opus 96k）、public/audio/sfx.m4a（AAC 128k）与 public/audio/sfx.json（howler sprite）。
# 先运行：python scripts/assets/fetch_audio.py
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PY="${PY:-/Users/yiti/.workbuddy/binaries/python/envs/default/bin/python}"
FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"
CLIPS="$ROOT/scripts/.cache/e/audio/clips"
WORK="$ROOT/.work/e"
OUT="$ROOT/public/audio"
mkdir -p "$WORK" "$OUT"

"$PY" - "$CLIPS" "$WORK/sfx_sprite.wav" "$OUT/sfx.json" "$FFMPEG" <<'EOF'
import json, subprocess, sys
import numpy as np
clips, out_wav, out_json, ffmpeg = sys.argv[1:5]
m = json.load(open(f"{clips}/manifest.json", encoding="utf-8"))
sr = m["sr"]
gap = np.zeros(int(0.25 * sr), dtype=np.float32)
parts, sprite, pos = [], {}, 0
for c in m["clips"]:
    p = subprocess.run([ffmpeg, "-v", "error", "-i", f"{clips}/{c['file']}", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    x = np.frombuffer(p.stdout, dtype=np.float32)
    start_ms = round(pos / sr * 1000)
    dur_ms = int(len(x) / sr * 1000)  # 向下取整，避免读到下一段
    sprite[c["id"]] = [start_ms, dur_ms, True] if c.get("loop") else [start_ms, dur_ms]
    parts += [x, gap]
    pos += len(x) + len(gap)
y = np.concatenate(parts)
subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", out_wav],
               input=y.astype(np.float32).tobytes(), check=True)
json.dump({"src": ["audio/sfx.webm", "audio/sfx.m4a"], "sprite": sprite}, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"sprite 总长 {len(y)/sr:.2f}s，{len(sprite)} 段")
EOF

"$FFMPEG" -v error -y -i "$WORK/sfx_sprite.wav" -c:a libopus -b:a 96k -vbr on -application audio -f webm "$OUT/sfx.webm"
"$FFMPEG" -v error -y -i "$WORK/sfx_sprite.wav" -c:a aac -b:a 128k -movflags +faststart "$OUT/sfx.m4a"
ls -l "$OUT"/sfx.* | awk '{printf "  %-10s %8.1f KB\n", $NF, $5/1024}'
