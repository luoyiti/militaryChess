/** 总台音效（共享音效 sprite）：首次点击后才加载与发声；开关记在本机浏览器。 */
import { Howl } from 'howler';
import { SFX_SRC, SFX_SPRITE } from '../engine/audio/library';

const KEY = 'warroom-hub-sound';
const read = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };

class HubSound {
  private howl: Howl | null = null;
  private last = new Map<string, number>();
  enabled = read();

  /** 浏览器要求用户手势后才能播放声音 */
  unlock() {
    if (this.howl || !this.enabled) return;
    this.howl = new Howl({ src: SFX_SRC, sprite: SFX_SPRITE, volume: 0.5, preload: true });
  }
  play(id: string, volume = 0.5, throttleMs = 120) {
    if (!this.enabled || !this.howl) return;
    const now = performance.now();
    if (now - (this.last.get(id) ?? 0) < throttleMs) return;
    this.last.set(id, now);
    const sid = this.howl.play(id);
    this.howl.volume(volume, sid);
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem(KEY, this.enabled ? 'on' : 'off'); } catch { /* 隐私模式 */ }
    if (this.enabled) this.unlock(); else this.howl?.stop();
    return this.enabled;
  }
}

export const sound = new HubSound();
