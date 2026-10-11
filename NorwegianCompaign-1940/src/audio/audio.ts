/** 音频管理：howler 音效 sprite + 音乐（流式），加载失败时回退到程序化合成；支持音乐闪避与战场氛围。 */
import { Howl, Howler } from 'howler';
import type { SfxId } from '../schema';
import { playSynth, startAmbience, type Ambience } from './synth';

type MusicId = 'polonaise' | 'elegy' | 'hejnal';
interface MusicMeta { id: MusicId; src: string[]; title: string }

class AudioManager {
  private sfx: Howl | null = null;
  private sfxOk = false;
  private music = new Map<MusicId, Howl>();
  private current: MusicId | null = null;
  private amb: Ambience | null = null;
  private ambHowl: number | null = null;
  unlocked = false;
  narrationEnabled = false;
  muted = false;
  musicVol = 0.45;
  sfxVol = 0.8;
  private duckLevel = 1;
  private sprite: Record<string, [number, number, boolean?]> = {};
  private lastPlay = new Map<string, number>();

  async init() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const meta = await fetch('audio/sfx.json').then((r) => r.json());
      this.sprite = meta.sprite;
      this.sfx = new Howl({
        src: meta.src, sprite: meta.sprite, preload: true, volume: this.sfxVol,
        onload: () => { this.sfxOk = true; },
        onloaderror: () => { this.sfxOk = false; },
      });
    } catch { this.sfxOk = false; }
    try {
      const list: MusicMeta[] = await fetch('audio/music.json').then((r) => r.json());
      for (const m of list) this.music.set(m.id, new Howl({ src: m.src, html5: true, loop: m.id !== 'hejnal', volume: 0, preload: m.id === 'polonaise' }));
    } catch { /* 无音乐也能运行 */ }
    // 解锁 WebAudio
    const ctx = Howler.ctx;
    if (ctx && ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  }

  private get ctx(): AudioContext | null { return (Howler.ctx as AudioContext) ?? null; }
  private get out(): AudioNode | null { return (Howler.masterGain as GainNode) ?? null; }

  play(id: SfxId, opts: { volume?: number; pan?: number; throttleMs?: number } = {}) {
    if (!this.unlocked || this.muted) return;
    const now = performance.now();
    const last = this.lastPlay.get(id) ?? 0;
    if (now - last < (opts.throttleMs ?? 250)) return;
    this.lastPlay.set(id, now);
    const vol = (opts.volume ?? 1) * this.sfxVol;
    if (this.sfx && this.sfxOk && this.sprite[id]) {
      const sid = this.sfx.play(id);
      this.sfx.volume(vol, sid);
      if (opts.pan) this.sfx.stereo(Math.max(-1, Math.min(1, opts.pan)), sid);
      return;
    }
    const ctx = this.ctx, out = this.out;
    if (ctx && out) playSynth(ctx, out, id, { gain: vol, pan: opts.pan ?? 0 });
  }

  playMusic(id: MusicId, fadeMs = 2500) {
    if (!this.unlocked) return;
    if (this.current === id) return;
    const prev = this.current ? this.music.get(this.current) : null;
    if (prev) { const p = prev; p.fade(p.volume(), 0, fadeMs); setTimeout(() => p.pause(), fadeMs + 50); }
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
  /** 播放号角（一次性），期间闪避音乐 */
  hejnal() {
    const h = this.music.get('hejnal');
    if (!h || this.muted) { this.play('fanfare'); return; }
    this.duck(0.25, 600);
    h.volume(this.musicVol);
    h.play();
    h.once('end', () => this.duck(1, 1500));
  }

  duck(level: number, ms = 500) {
    this.duckLevel = level;
    const h = this.current ? this.music.get(this.current) : null;
    if (h && !this.muted) h.fade(h.volume(), this.musicVol * level, ms);
  }

  startAmbience() {
    if (this.amb || !this.unlocked) return;
    if (this.sfx && this.sfxOk && this.sprite['amb_front']) {
      this.ambHowl = this.sfx.play('amb_front');
      this.sfx.loop(true, this.ambHowl);
      this.sfx.volume(0.25 * this.sfxVol, this.ambHowl);
    }
    const ctx = this.ctx, out = this.out;
    if (ctx && out) { this.amb = startAmbience(ctx, out); this.amb.setIntensity(0.2); }
  }
  setIntensity(x: number) {
    this.amb?.setIntensity(this.muted ? 0 : x);
    if (this.sfx && this.ambHowl != null) this.sfx.volume((0.12 + 0.3 * x) * this.sfxVol * (this.muted ? 0 : 1), this.ambHowl);
  }

  setMuted(m: boolean) {
    this.muted = m;
    Howler.mute(m);
    if (m) this.stopNarration();
  }
  /** Original English summaries, spoken by an optional browser voice, never archival recordings. */
  narrate(text?: string, force = false) {
    if (!text || this.muted || (!force && !this.narrationEnabled) || !('speechSynthesis' in window)) return;
    this.stopNarration();
    const line = new SpeechSynthesisUtterance(text);
    line.lang = 'en-GB'; line.rate = 0.95; line.volume = 0.75;
    const voices = window.speechSynthesis.getVoices();
    line.voice = voices.find(v => v.lang === 'en-GB') ?? voices.find(v => v.lang.startsWith('en')) ?? null;
    window.speechSynthesis.speak(line);
  }
  stopNarration() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  setMusicVol(v: number) { this.musicVol = v; const h = this.current ? this.music.get(this.current) : null; if (h) h.volume(v * this.duckLevel); }
  setSfxVol(v: number) { this.sfxVol = v; }
}

export const audio = new AudioManager();
