/** 播放时钟：1× = 每秒推进 4 小时（一天约 6 秒）。导演模式驻留时暂停推进。 */
import { store, T_END, T_START } from './store';

export const HOURS_PER_SEC = 4;

class Clock {
  private raf = 0;
  private last = 0;
  holdUntil = 0; // 导演模式驻留（performance.now 毫秒）
  private tickers: ((dtMs: number, now: number) => void)[] = [];
  private seekers: ((t: number) => void)[] = [];

  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(100, now - this.last);
      this.last = now;
      const s = store.get();
      if (s.playing && now >= this.holdUntil) {
        let t = s.t + (dt / 1000) * HOURS_PER_SEC * s.speed;
        if (t >= T_END) { t = T_END; store.set({ t, playing: false }); }
        else store.set({ t });
      }
      for (const f of this.tickers) f(dt, now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  onTick(fn: (dtMs: number, now: number) => void) { this.tickers.push(fn); }
  onSeek(fn: (t: number) => void) { this.seekers.push(fn); }
  hold(ms: number) { this.holdUntil = Math.max(this.holdUntil, performance.now() + ms); }
  release() { this.holdUntil = 0; }
  get holding() { return performance.now() < this.holdUntil; }
  seek(t: number) {
    const next = Math.max(T_START, Math.min(T_END, t));
    for (const fn of this.seekers) fn(next);
    store.set({ t: next });
  }
}

export const clock = new Clock();
