#!/usr/bin/env python3
"""核对 docs/research/05-sources.json 里每条来源的 URL 可达性。

- 用与 commons.py 相同的 User-Agent（Wikipedia 对默认 UA 返回 403，对带联系 URL 的 UA 正常）；
- 允许 200/202/206；把失败按 id 归类，并对照 JSON 的 meta.unreachable 白名单；
- 只在白名单里的失败不判错（正文未抓取，仅作「出处指引」）。

用法：
  .venv/bin/python campaigns/battle-atlantic-1945/pipeline/scripts/verify_sources.py
  ... --json    # 机器可读输出
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402

CAMP = Path(__file__).resolve().parents[2]
SRC = CAMP / "docs/research/05-sources.json"
OK = {200, 206}


def check(session: requests.Session, url: str, retries: int = 2) -> tuple[int | str, int, str]:
    """返回 (状态码或异常名, 响应体字节数, 最终 URL)。网络层失败按退避重试。"""
    import time
    wait = 3.0
    last: tuple[int | str, int, str] = ("ConnectTimeout", 0, url)
    for attempt in range(retries + 1):
        try:
            r = session.get(url, timeout=40, allow_redirects=True)
            return r.status_code, len(r.content), r.url
        except requests.RequestException as exc:  # 网络层失败：DNS / TLS / 超时
            last = (type(exc).__name__, 0, url)
            if attempt < retries:
                time.sleep(wait)
                wait *= 2
    return last


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--retries", type=int, default=2, help="网络层失败（超时/DNS/TLS）的重试次数")
    args = ap.parse_args()

    data = json.loads(SRC.read_text("utf-8"))
    sources = data["sources"]
    allowed = {u.split("（")[0].strip() for u in data["meta"].get("unreachable", [])}

    session = requests.Session()
    session.headers.update({"User-Agent": commons.UA})
    results = []
    with cf.ThreadPoolExecutor(args.workers) as ex:
        for s, (status, size, final) in zip(sources, ex.map(lambda x: check(session, x["url"], args.retries), sources)):
            # 202/空响应体是反爬挑战页：URL 存在但正文取不到，按「未验证」处理
            ok = status in OK and size > 2048
            results.append({
                "id": s["id"],
                "tier": s.get("tier", ""),
                "url": s["url"],
                "status": status,
                "bytes": size,
                "finalUrl": final,
                "ok": ok,
                "whitelisted": s["id"] in allowed,
            })

    hard = [r for r in results if not r["ok"] and not r["whitelisted"]]
    soft = [r for r in results if not r["ok"] and r["whitelisted"]]

    if args.json:
        print(json.dumps({"checked": len(results), "hardFailures": hard, "knownUnreachable": soft},
                         ensure_ascii=False, indent=1))
    else:
        for r in hard:
            print(f"✗ {r['id']:26s} {r['status']!s:20s} {r['bytes']:>8d}B {r['url']}")
        for r in soft:
            print(f"△ {r['id']:26s} {r['status']!s:20s} {r['bytes']:>8d}B {r['url']}  （白名单：正文未验证）")
        by_tier: dict[str, int] = {}
        for r in results:
            if r["ok"]:
                by_tier[r["tier"]] = by_tier.get(r["tier"], 0) + 1
        print(f"\n共 {len(results)} 条：可达 {len(results) - len(hard) - len(soft)}、"
              f"白名单 {len(soft)}、失败 {len(hard)}")
        print("可达分布：" + "、".join(f"{k} {v}" for k, v in sorted(by_tier.items())))
    return 0 if not hard else 1


if __name__ == "__main__":
    raise SystemExit(main())
