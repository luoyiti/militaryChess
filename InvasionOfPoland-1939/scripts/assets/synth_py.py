"""numpy 程序化音效（与 src/audio/synth.ts 同思路），在找不到合规素材时作为 sprite 段落兜底。

每个函数返回 float32 单声道、采样率 SR 的数组，峰值约 0.9。
"""
from __future__ import annotations

import numpy as np
from scipy.signal import lfilter

SR = 48000
_rng = np.random.default_rng(1939)


def _t(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def _noise(n: int) -> np.ndarray:
    return _rng.standard_normal(n).astype(np.float64)


def _onepole_lp(x: np.ndarray, fc: float | np.ndarray) -> np.ndarray:
    """一阶低通；fc 可为逐样本数组（分块近似时变）。"""
    if np.ndim(fc) == 0:
        a = float(np.exp(-2 * np.pi * float(fc) / SR))
        return lfilter([1 - a], [1, -a], x)
    fc_arr = np.asarray(fc, dtype=np.float64)
    y = np.empty_like(x)
    zi = np.zeros(1)
    blk = 256
    for i in range(0, len(x), blk):
        a = float(np.exp(-2 * np.pi * fc_arr[i] / SR))
        y[i:i + blk], zi = lfilter([1 - a], [1, -a], x[i:i + blk], zi=zi * 1.0)
    return y


def _biquad_bp(x: np.ndarray, f0: float, q: float) -> np.ndarray:
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    a0 = 1 + alpha
    return lfilter([alpha / a0, 0.0, -alpha / a0], [1.0, -2 * np.cos(w0) / a0, (1 - alpha) / a0], x)


def _env_exp(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


def _norm(x: np.ndarray, peak: float = 0.9) -> np.ndarray:
    m = np.max(np.abs(x)) or 1.0
    return (x / m * peak).astype(np.float32)


def _place(dst: np.ndarray, src: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= len(dst):
        return
    n = min(len(src), len(dst) - i)
    dst[i:i + n] += src[:n] * gain


def boom(dur: float = 2.5, fc0: float = 3000, fc1: float = 120, decay: float = 0.5, sub: float = 55) -> np.ndarray:
    n = int(dur * SR)
    t = _t(dur)
    fc = fc1 + (fc0 - fc1) * np.exp(-t / 0.15)
    x = _onepole_lp(_onepole_lp(_noise(n), fc), fc) * _env_exp(n, 0.004, decay)
    s = np.sin(2 * np.pi * sub * t * (1 + 0.8 * np.exp(-t / 0.08))) * _env_exp(n, 0.002, decay * 0.6)
    return _norm(x * 3 + s * 0.8)


def gunshot(dur: float = 1.2, bright: float = 5000, decay: float = 0.12) -> np.ndarray:
    n = int(dur * SR)
    crack = _onepole_lp(_noise(n), bright) * _env_exp(n, 0.0005, 0.02)
    body = _onepole_lp(_noise(n), 900) * _env_exp(n, 0.001, decay)
    tail = _onepole_lp(_noise(n), 400) * _env_exp(n, 0.02, decay * 4) * 0.25
    return _norm(crack * 2 + body + tail)


def s_typewriter() -> np.ndarray:
    out = np.zeros(int(2.4 * SR))
    at = 0.05
    while at < 2.1:
        k = _onepole_lp(_noise(int(0.03 * SR)), 6000) * _env_exp(int(0.03 * SR), 0.0003, 0.004)
        thunk = np.sin(2 * np.pi * 180 * _t(0.03)) * _env_exp(int(0.03 * SR), 0.0005, 0.006) * 0.4
        _place(out, k + thunk, at, 0.8 + 0.4 * _rng.random())
        at += 0.07 + 0.12 * _rng.random()
    return _norm(out)


def s_bell() -> np.ndarray:
    t = _t(1.4)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((2093, 1, 0.5), (5270, 0.4, 0.2), (7040, 0.2, 0.1)))
    return _norm(x * np.clip(t / 0.001, 0, 1))


def s_stamp() -> np.ndarray:
    n = int(0.6 * SR)
    t = _t(0.6)
    thud = np.sin(2 * np.pi * 90 * t) * _env_exp(n, 0.001, 0.05)
    slap = _onepole_lp(_noise(n), 2500) * _env_exp(n, 0.0005, 0.02)
    return _norm(thud + slap * 1.2)


def s_paper() -> np.ndarray:
    n = int(1.4 * SR)
    t = _t(1.4)
    grain = (_rng.random(n) < 0.02) * _noise(n)
    x = _biquad_bp(_noise(n) * 0.3 + grain * 2, 3500, 0.7)
    env = np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 0.7 * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))
    return _norm(x * env)


def s_explosion() -> np.ndarray:
    return boom(3.0, 4000, 90, 0.7, 45)


def s_artillery() -> np.ndarray:
    out = boom(3.2, 2500, 150, 0.45, 60).astype(np.float64)
    _place(out, boom(1.5, 800, 80, 0.8, 40), 1.2, 0.35)  # 远处落点回响
    return _norm(out)


def s_stuka() -> np.ndarray:
    dur = 3.8
    t = _t(dur)
    f = 420 + 900 * (t / dur) ** 1.4
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    siren = _onepole_lp(saw, 3000) * np.clip(t / 0.4, 0, 1)
    prop = _onepole_lp(_noise(len(t)), 300) * (1 + 0.6 * np.sin(2 * np.pi * 38 * t))
    return _norm(siren * 0.7 + prop * 2.5 * (0.5 + t / dur))


def drone(dur: float, f0: float, rumble_fc: float, am: float, n_harm: int = 5) -> np.ndarray:
    t = _t(dur)
    x = np.zeros_like(t)
    for h in range(1, n_harm + 1):
        x += np.sin(2 * np.pi * f0 * h * t + _rng.random() * 6) / h
    x *= 1 + 0.35 * np.sin(2 * np.pi * am * t)
    r = _onepole_lp(_noise(len(t)), rumble_fc) * 4
    return x + r


def s_bomber() -> np.ndarray:
    dur = 4.0
    t = _t(dur)
    x = drone(dur, 62, 250, 3.1) + drone(dur, 64.5, 200, 2.3) * 0.8  # 双发拍频
    env = np.sin(np.pi * t / dur) ** 0.8
    return _norm(_onepole_lp(x, 1200) * env)


def s_engine() -> np.ndarray:
    dur = 3.0
    t = _t(dur)
    x = drone(dur, 38, 400, 12.0, 7)
    return _norm(_onepole_lp(x, 1500) * np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.4, 0, 1))


def s_tank() -> np.ndarray:
    dur = 4.0
    t = _t(dur)
    x = drone(dur, 32, 300, 7.0, 6)
    clank = np.zeros_like(t)
    at = 0.0
    while at < dur:
        _place(clank, _biquad_bp(_noise(int(0.04 * SR)), 1800, 3) * _env_exp(int(0.04 * SR), 0.001, 0.01), at, 1.5)
        at += 0.11 + 0.02 * _rng.random()
    return _norm(_onepole_lp(x, 900) + clank * 0.6)


def s_ship_gun() -> np.ndarray:
    out = boom(4.0, 2000, 70, 0.9, 35).astype(np.float64)
    _place(out, boom(2.0, 600, 60, 1.0, 30), 0.35, 0.3)  # 水面回声
    return _norm(out)


def s_siren() -> np.ndarray:
    dur = 4.0
    t = _t(dur)
    f = 300 + 350 * (1 - np.exp(-t / 1.2)) + 30 * np.sin(2 * np.pi * 0.5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    return _norm(x * np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.5, 0, 1))


def s_radio(dur: float = 2.4) -> np.ndarray:
    t = _t(dur)
    hiss = _biquad_bp(_noise(len(t)), 1800, 0.6)
    crack = (_rng.random(len(t)) < 0.0015) * _noise(len(t)) * 6
    whistle = np.sin(2 * np.pi * (900 + 200 * np.sin(2 * np.pi * 0.3 * t)) * t) * 0.08
    return _norm((hiss + crack + whistle) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t)))


MORSE = {"S": "...", "O": "---", "P": ".--."}


def s_morse(text: str = "SOS") -> np.ndarray:
    unit = 0.07
    seq: list[tuple[bool, float]] = []
    for ch in text:
        for sym in MORSE[ch]:
            seq.append((True, unit if sym == "." else unit * 3))
            seq.append((False, unit))
        seq.append((False, unit * 2))
    dur = sum(d for _, d in seq) + 0.1
    out = np.zeros(int(dur * SR))
    at = 0.05
    for on, d in seq:
        if on:
            tt = _t(d)
            tone = np.sin(2 * np.pi * 700 * tt) * np.clip(tt / 0.004, 0, 1) * np.clip((d - tt) / 0.004, 0, 1)
            _place(out, tone, at)
        at += d
    return _norm(out)


def s_mg() -> np.ndarray:
    out = np.zeros(int(2.4 * SR))
    at = 0.02
    for _ in range(18):
        _place(out, gunshot(0.25, 4000, 0.04), at, 0.8 + 0.2 * _rng.random())
        at += 0.085 + 0.01 * _rng.random()
    return _norm(out)


def s_rifle() -> np.ndarray:
    out = gunshot(1.6, 6000, 0.1).astype(np.float64)
    return _norm(out)


def s_march() -> np.ndarray:
    dur = 4.0
    out = np.zeros(int(dur * SR))
    beat = 0.5
    at = 0.02
    i = 0
    while at < dur - 0.2:
        n = int(0.15 * SR)
        snare = _biquad_bp(_noise(n), 2500, 0.8) * _env_exp(n, 0.001, 0.05) + np.sin(2 * np.pi * 190 * _t(0.15)) * _env_exp(n, 0.001, 0.03)
        _place(out, snare, at, 1.0 if i % 2 == 0 else 0.6)
        foot = _onepole_lp(_noise(int(0.1 * SR)), 500) * _env_exp(int(0.1 * SR), 0.002, 0.03)
        _place(out, foot, at + 0.01, 1.2)
        if i % 4 == 3:
            _place(out, snare, at + beat / 2, 0.5)
        at += beat
        i += 1
    return _norm(out)


def s_cavalry() -> np.ndarray:
    dur = 4.0
    out = np.zeros(int(dur * SR))
    at = 0.05
    while at < dur - 0.2:
        for k, off in enumerate((0.0, 0.07, 0.14)):  # 三拍马蹄
            n = int(0.08 * SR)
            hit = _onepole_lp(_noise(n), 1200) * _env_exp(n, 0.001, 0.015) + np.sin(2 * np.pi * 110 * _t(0.08)) * _env_exp(n, 0.001, 0.02)
            _place(out, hit, at + off + 0.01 * _rng.random(), 0.7 + 0.3 * (k == 2))
        at += 0.42 + 0.03 * _rng.random()
    t = _t(dur)
    return _norm(out * (0.4 + 0.6 * np.sin(np.pi * t / dur)))


def s_ui_click() -> np.ndarray:
    n = int(0.3 * SR)
    t = _t(0.3)
    x = _biquad_bp(_noise(n), 3000, 2) * _env_exp(n, 0.0003, 0.004) + np.sin(2 * np.pi * 1400 * t) * _env_exp(n, 0.0003, 0.01) * 0.3
    return _norm(x)


def s_fanfare() -> np.ndarray:
    # 仿“克拉科夫号角”开头（F 大调三和弦上行），铜管音色
    notes = [(349.2, 0.35), (440.0, 0.35), (523.3, 0.35), (698.5, 0.9), (523.3, 0.3), (698.5, 1.2)]
    out = np.zeros(int(4.0 * SR))
    at = 0.05
    for f, d in notes:
        tt = _t(d)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        tone = sum(np.sin(k * ph) * (0.8 ** k) for k in range(1, 9))
        env = np.clip(tt / 0.04, 0, 1) * np.clip((d - tt) / 0.06, 0, 1)
        _place(out, tone * env, at)
        at += d
    return _norm(_onepole_lp(out, 3500))


def s_amb_wind(dur: float = 30.0) -> np.ndarray:
    t = _t(dur)
    gust = 0.5 + 0.5 * np.sin(2 * np.pi * t / 7.5) * np.sin(2 * np.pi * t / 3.0 + 1)
    x = _onepole_lp(_noise(len(t)), 300 + 500 * gust)
    return _norm(x * (0.4 + 0.6 * gust))


def s_amb_front(dur: float = 30.0, booms: list[np.ndarray] | None = None) -> np.ndarray:
    t = _t(dur)
    bed = _onepole_lp(_onepole_lp(_noise(len(t)), 90), 90)
    bed *= 0.035 / (np.std(bed) or 1)  # 低沉底噪（远低于炮声颗粒）
    out = bed.copy()
    at = 0.8
    while at < dur - 3:
        b = booms[_rng.integers(len(booms))] if booms else boom(3.0, 500, 60, 1.2, 35)
        b = _onepole_lp(_onepole_lp(b.astype(np.float64), 400), 400)
        b /= np.max(np.abs(b)) or 1
        _place(out, b, at, 0.25 + 0.75 * _rng.random())
        at += 1.2 + 3.3 * _rng.random()
    return _norm(out)


def s_amb_radio(dur: float = 24.0) -> np.ndarray:
    return s_radio(dur)


SYNTH = {
    "typewriter": s_typewriter, "bell": s_bell, "stamp": s_stamp, "paper": s_paper, "explosion": s_explosion,
    "artillery": s_artillery, "stuka": s_stuka, "bomber": s_bomber, "engine": s_engine, "tank": s_tank,
    "ship_gun": s_ship_gun, "siren": s_siren, "radio": s_radio, "morse": s_morse, "mg": s_mg, "rifle": s_rifle,
    "march": s_march, "cavalry": s_cavalry, "ui_click": s_ui_click, "fanfare": s_fanfare,
    "amb_wind": s_amb_wind, "amb_front": s_amb_front, "amb_radio": s_amb_radio,
}
