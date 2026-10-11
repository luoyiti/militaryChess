/**
 * 音频管理：howler 音效 sprite + 共享配乐库（shared/audio，打包为带哈希的静态资源），加载失败时回退到程序化合成。
 * 两种配乐模式（manifest.audio.mode）：cues = 导演按时间表切换曲目并调制战场氛围；bed = 单曲循环底乐（不列颠空战）。
 */
import { Howl, Howler } from 'howler';
import { playSynth, startAmbience, type Ambience } from './synth';
import { SFX_SPRITE, SFX_SRC, musicTrack } from './library';
import type { CampaignManifest } from '../campaign/types';

class AudioManager {
  private sfx: Howl | null = null;
  private sfxOk = false;
  private music = new Map<string, Howl>();
  private current: string | null = null;
  private amb: Ambience | null = null;
  private ambHowl: number | null = null;
  private initTask: Promise<void> | null = null;
  private cfg: CampaignManifest['audio'] = { music: [], intensity: [] };
  unlocked = false;
  muted = false;
  musicVol = 0.45;
  sfxVol = 0.8;
  private duckLevel = 1;
  private lastPlay = new Map<string, number>();

  configure(cfg: CampaignManifest['audio']) {
    this.cfg = cfg;
    if (cfg.musicVol !== undefined) this.musicVol = cfg.musicVol;
  }

  /** 首次用户交互后调用；重复调用返回同一个加载任务 */
  init(): Promise<void> {
    return (this.initTask ??= this.load());
  }
  private async load() {
    this.unlocked = true;
    this.sfx = new Howl({
      src: SFX_SRC, sprite: SFX_SPRITE, preload: true, volume: this.sfxVol,
      onload: () => { this.sfxOk = true; },
      onloaderror: () => { this.sfxOk = false; },
    });
    // 本战役用到的曲目（时间表 + 开场 + 底乐）
    const ids = new Set([...this.cfg.music.map((c) => c.track), this.cfg.introMusic, this.cfg.bedTrack, this.cfg.introSting === 'hejnal' ? 'hejnal' : undefined].filter(Boolean) as string[]);
    for (const id of ids) {
      const t = musicTrack(id);
      if (!t) continue;
      this.music.set(id, new Howl({ src: t.src, html5: t.html5 ?? true, loop: !t.oneShot, volume: 0, preload: id === (this.cfg.introMusic ?? this.cfg.bedTrack) }));
    }
    // 解锁 WebAudio
    const ctx = Howler.ctx;
    if (ctx && ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
    Howler.mute(this.muted);
  }

  private get ctx(): AudioContext | null { return (Howler.ctx as AudioContext) ?? null; }
  private get out(): AudioNode | null { return (Howler.masterGain as GainNode) ?? null; }

  play(id: string, opts: { volume?: number; pan?: number; throttleMs?: number } = {}) {
    if (!this.unlocked || this.muted) return;
    const now = performance.now();
    const last = this.lastPlay.get(id) ?? 0;
    if (now - last < (opts.throttleMs ?? 250)) return;
    this.lastPlay.set(id, now);
    const alias = this.cfg.sfxAlias?.[id];
    const cue = alias?.to ?? id;
    const vol = (opts.volume ?? 1) * this.sfxVol * (alias?.gain ?? 1);
    if (this.sfx && this.sfxOk && SFX_SPRITE[cue]) {
      const sid = this.sfx.play(cue);
      this.sfx.volume(vol, sid);
      if (opts.pan) this.sfx.stereo(Math.max(-1, Math.min(1, opts.pan)), sid);
      return;
    }
    const ctx = this.ctx, out = this.out;
    if (ctx && out) playSynth(ctx, out, cue, { gain: vol, pan: opts.pan ?? 0 });
  }

  playMusic(id: string, fadeMs = 2500) {
    if (!this.unlocked) return;
    if (this.current === id) return;
    const prevId = this.current;
    const prev = prevId ? this.music.get(prevId) : null;
    if (prev) { const p = prev; p.fade(p.volume(), 0, fadeMs); setTimeout(() => { if (this.current !== prevId) p.pause(); }, fadeMs + 50); }
    const h = this.music.get(id);
    this.current = id;
    if (!h) return;
    if (!h.playing()) h.play();
    h.fade(0, this.muted ? 0 : this.musicVol * this.duckLevel, fadeMs);
  }
  stopMusic(fadeMs = 1500) {
    const h = this.current ? this.music.get(this.current) : null;
    if (h) { h.fade(h.volume(), 0, fadeMs); setTimeout(() => h.pause(), fadeMs + 50); }
    this.current = null;
  }

  /** 开场号角：fanfare = 音效 sprite；hejnal = 配乐库一次性号角，期间闪避音乐 */
  sting() {
    const kind = this.cfg.introSting ?? 'fanfare';
    if (kind === 'none') return;
    if (kind === 'fanfare') { this.play('fanfare'); return; }
    const h = this.music.get('hejnal');
    if (!h || this.muted) { this.play('fanfare'); return; }
    this.duck(0.25, 600);
    h.volume(this.musicVol);
    h.play();
    h.once('end', () => this.duck(1, 1500));
  }

  duck(level: number, ms = 500) {
    this.duckLevel = Math.max(0, Math.min(1, level));
    const h = this.current ? this.music.get(this.current) : null;
    if (h && !this.muted) h.fade(h.volume(), this.musicVol * this.duckLevel, ms);
  }

  /** cues 模式：战场氛围（sprite 循环 + 合成）；bed 模式：开始底乐 */
  startAmbience() {
    if (!this.unlocked) return;
    if (this.cfg.mode === 'bed') { if (this.cfg.bedTrack) this.playMusic(this.cfg.bedTrack); return; }
    if (this.amb) return;
    if (this.sfx && this.sfxOk && SFX_SPRITE['amb_front']) {
      this.ambHowl = this.sfx.play('amb_front');
      this.sfx.loop(true, this.ambHowl);
      this.sfx.volume(0.25 * this.sfxVol, this.ambHowl);
    }
    const ctx = this.ctx, out = this.out;
    if (ctx && out) { this.amb = startAmbience(ctx, out); this.amb.setIntensity(0.2); }
  }
  setIntensity(x: number) {
    if (this.cfg.mode === 'bed') return;
    this.amb?.setIntensity(this.muted ? 0 : x);
    if (this.sfx && this.ambHowl != null) this.sfx.volume((0.12 + 0.3 * x) * this.sfxVol * (this.muted ? 0 : 1), this.ambHowl);
  }

  setMuted(m: boolean) {
    this.muted = m;
    Howler.mute(m);
  }
  setMusicVol(v: number) { this.musicVol = Math.max(0, Math.min(1, v)); const h = this.current ? this.music.get(this.current) : null; if (h) h.volume(this.musicVol * this.duckLevel); }
  setSfxVol(v: number) { this.sfxVol = Math.max(0, Math.min(1, v)); }
}

export const audio = new AudioManager();
