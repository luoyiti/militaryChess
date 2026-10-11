"""Wikimedia Commons 访问公共模块（串行、≥1 s 间隔、429/403 退避重试）。"""
from __future__ import annotations

import html
import re
import time
from typing import Any

import requests

# 注：纯 "junqi-wargame/0.1 (educational; contact: local)" 在共享出口 IP 上会被 Wikimedia 以
# "Too Many Reqs" 403 拒绝；按其 UA 政策追加一个联系 URL 段后正常。
UA = "junqi-wargame/0.1 (educational; contact: local; https://localhost/)"
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": UA}

_session = requests.Session()
_session.headers.update(HEADERS)
_last = 0.0


def _throttle(min_gap: float = 1.1) -> None:
    global _last
    dt = time.time() - _last
    if dt < min_gap:
        time.sleep(min_gap - dt)
    _last = time.time()


def get(url: str, params: dict[str, Any] | None = None, stream: bool = False, tries: int = 5) -> requests.Response:
    wait = 5.0
    for i in range(tries):
        _throttle()
        try:
            r = _session.get(url, params=params, timeout=120, stream=stream)
        except requests.RequestException as e:
            print(f"   网络错误 {e}，{wait:.0f}s 后重试")
            time.sleep(wait)
            wait *= 2
            continue
        if r.status_code in (429, 403, 503) and i < tries - 1:
            ra = r.headers.get("Retry-After")
            w = float(ra) if ra and ra.isdigit() else wait
            print(f"   HTTP {r.status_code}，{w:.0f}s 后重试")
            time.sleep(w)
            wait *= 2
            continue
        return r
    return r


def strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    # "Unknown authorUnknown author" 之类的重复（隐藏 span 导致）
    n = len(s)
    if n % 2 == 0 and n > 0 and s[: n // 2] == s[n // 2:]:
        s = s[: n // 2]
    m = re.fullmatch(r"(.+?)\s*\1", s)
    if m:
        s = m.group(1)
    return s.strip()


def license_ok(short: str) -> bool:
    """只接受 PD / CC0 / CC BY / CC BY-SA（拒绝 NC/ND/GFDL-only/Attribution 模糊许可等）。"""
    s = (short or "").strip().lower()
    if not s:
        return False
    if any(x in s for x in ("-nc", " nc", "-nd", " nd", "non-commercial", "noderiv", "fair use")):
        return False
    if s.startswith("public domain") or s.startswith("pd") or s in ("cc0", "cc0 1.0", "cc-zero", "no restrictions"):
        return True
    if s.startswith("cc0"):
        return True
    return bool(re.match(r"^cc[ -]by(-sa)?[ -]?\d", s)) or s in ("cc by", "cc by-sa", "cc-by", "cc-by-sa")


def query_files(titles: list[str], thumb_width: int | None = None) -> dict[str, dict[str, Any]]:
    """批量查询文件信息。返回 {原始标题: info}，info 含 exists/url/thumburl/width/height/mime/license/... 。"""
    out: dict[str, dict[str, Any]] = {}
    for i in range(0, len(titles), 40):
        batch = titles[i:i + 40]
        params: dict[str, Any] = {
            "action": "query", "format": "json", "formatversion": 2, "redirects": 1,
            "titles": "|".join(batch), "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata|mediatype",
            "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|ImageDescription|ObjectName|Credit|UsageTerms",
        }
        if thumb_width:
            params["iiurlwidth"] = thumb_width
        r = get(API, params)
        try:
            data = r.json()
        except ValueError:
            print(f"   API 非 JSON 响应 HTTP {r.status_code}")
            for t in batch:
                out[t] = {"exists": False, "reason": f"API HTTP {r.status_code}"}
            continue
        q = data.get("query", {})
        back: dict[str, str] = {t: t for t in batch}
        for n in q.get("normalized", []):
            for k, v in list(back.items()):
                if v == n["from"]:
                    back[k] = n["to"]
        for rd in q.get("redirects", []):
            for k, v in list(back.items()):
                if v == rd["from"]:
                    back[k] = rd["to"]
        pages = {p["title"]: p for p in q.get("pages", [])}
        for orig, final in back.items():
            p = pages.get(final)
            if not p or p.get("missing") or not p.get("imageinfo"):
                out[orig] = {"exists": False, "reason": "文件不存在"}
                continue
            ii = p["imageinfo"][0]
            md = {k: v.get("value", "") for k, v in ii.get("extmetadata", {}).items()}
            out[orig] = {
                "exists": True,
                "title": final,
                "url": ii.get("url"),
                "thumburl": ii.get("thumburl") or ii.get("url"),
                "thumbwidth": ii.get("thumbwidth"),
                "width": ii.get("width"),
                "height": ii.get("height"),
                "mime": ii.get("mime"),
                "duration": ii.get("duration"),
                "size": ii.get("size"),
                "descriptionurl": ii.get("descriptionurl"),
                "license": strip_html(md.get("LicenseShortName", "")),
                "licenseUrl": strip_html(md.get("LicenseUrl", "")),
                "artist": strip_html(md.get("Artist", "")) or strip_html(md.get("Credit", "")),
                "description": strip_html(md.get("ImageDescription", ""))[:400],
                "objectName": strip_html(md.get("ObjectName", "")),
            }
    return out


def search_files(query: str, audio: bool = False, limit: int = 20) -> list[str]:
    params = {
        "action": "query", "format": "json", "formatversion": 2, "list": "search", "srnamespace": 6,
        "srsearch": query + (" filetype:audio" if audio else ""), "srlimit": limit,
    }
    r = get(API, params)
    try:
        return [x["title"] for x in r.json().get("query", {}).get("search", [])]
    except ValueError:
        return []


def license_url_fallback(lic: str, url: str) -> str:
    if url:
        return url
    s = lic.lower()
    if s.startswith("cc0"):
        return "https://creativecommons.org/publicdomain/zero/1.0/"
    if "public domain" in s or s.startswith("pd"):
        return "https://creativecommons.org/publicdomain/mark/1.0/"
    return ""
