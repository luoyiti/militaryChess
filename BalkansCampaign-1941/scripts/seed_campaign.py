#!/usr/bin/env python3
"""Independent Balkan scenario regeneration, retaining the family seed entrypoint."""
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
local = ROOT / '.venv/bin/python'
python = str(local) if local.exists() else sys.executable
for name in ['build_mainland.py', 'build_crete.py', 'build_data.py']:
    subprocess.run([python, str(ROOT / 'scripts/campaign' / name)], cwd=ROOT, check=True)
