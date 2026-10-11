"""兼容原地名种子入口；巴尔干地名由战役分片生成器共同维护。
不再向新战役写入波兰地名。
"""
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[2]
if __name__ == '__main__':
    for name in ('build_mainland.py', 'build_crete.py'):
        path = ROOT / 'scripts' / 'campaign' / name
        if not path.is_file():
            raise SystemExit(f'需要巴尔干分片生成器：{path}')
        runpy.run_path(str(path), run_name='__main__')
