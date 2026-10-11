/**
 * 程序化音效（Web Audio API，无依赖）。作为 public/audio/sfx.* 素材缺失或加载失败时的兜底。
 * - playSynth：覆盖全部 SfxId 的一次性音效
 * - startAmbience：风声 + 远处炮声隆隆（密度随 setIntensity 0–1 变化）+ 偶发电台底噪
 */

export interface SynthOptions {
  gain?: number;
  pan?: number;
  /** 仅 morse 使用：发送的电文，支持 A–Z、0–9；默认 "SOS"（亦可 "SP"） */
  morse?: string;
}

export interface SynthVoice {
  stop(): void;
}

// ---------- 基础工具 ----------

const EPS = 0.0001;
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    const len = Math.floor(ctx.sampleRate * 2);
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

/** 一次发声的上下文：统一收集音源，便于 stop() 与自动清理 */
class Scene {
  readonly ctx: AudioContext;
  readonly out: GainNode;
  readonly t0: number;
  private readonly sources: AudioScheduledSourceNode[] = [];
  private live = 0;
  private stopped = false;
  private readonly tail: AudioNode[] = [];

  constructor(ctx: AudioContext, dest: AudioNode, gain: number, pan: number) {
    this.ctx = ctx;
    this.t0 = ctx.currentTime + 0.005;
    this.out = ctx.createGain();
    this.out.gain.value = gain;
    if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      this.out.connect(p);
      p.connect(dest);
      this.tail.push(p);
    } else {
      this.out.connect(dest);
    }
  }

  track<T extends AudioScheduledSourceNode>(src: T, start: number, stop: number): T {
    this.sources.push(src);
    this.live++;
    src.onended = () => {
      src.disconnect();
      if (--this.live === 0) this.dispose();
    };
    src.start(start);
    src.stop(stop);
    return src;
  }

  noise(start: number, dur: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = noiseBuffer(this.ctx);
    s.loop = true;
    s.loopStart = 0;
    s.loopEnd = s.buffer.duration;
    this.sources.push(s);
    this.live++;
    s.onended = () => {
      s.disconnect();
      if (--this.live === 0) this.dispose();
    };
    s.start(start, Math.random() * (s.buffer.duration - 0.1));
    s.stop(start + dur);
    return s;
  }

  osc(type: OscillatorType, freq: number, start: number, dur: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    return this.track(o, start, start + dur);
  }

  filter(type: BiquadFilterType, freq: number, q = 0.707): BiquadFilterNode {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  gain(v = 0): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  /** 冲击包络：attack 线性上升到 peak，随后指数衰减（decay = 时间常数） */
  hit(g: GainNode, at: number, peak: number, attack: number, decay: number): void {
    const p = g.gain;
    p.setValueAtTime(0, at);
    p.linearRampToValueAtTime(peak, at + attack);
    p.setTargetAtTime(0, at + attack, decay);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    const now = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(now);
    this.out.gain.setValueAtTime(this.out.gain.value, now);
    this.out.gain.linearRampToValueAtTime(0, now + 0.04);
    for (const s of this.sources) {
      try {
        s.stop(now + 0.05);
      } catch {
        /* 已停止 */
      }
    }
  }

  private dispose(): void {
    this.out.disconnect();
    for (const n of this.tail) n.disconnect();
  }
}

// ---------- 可复用音色 ----------

interface BoomSpec {
  dur: number;
  fc0: number;
  fc1: number;
  decay: number;
  sub: number;
  gain: number;
}

/** 爆炸/炮击：噪声 + 下扫低通 + 次低频正弦“砰” */
function boom(s: Scene, at: number, b: BoomSpec): void {
  const n = s.noise(at, b.dur);
  const lp = s.filter('lowpass', b.fc0, 0.5);
  lp.frequency.setValueAtTime(b.fc0, at);
  lp.frequency.exponentialRampToValueAtTime(Math.max(b.fc1, 20), at + Math.min(0.6, b.dur * 0.3));
  const g = s.gain();
  s.hit(g, at, b.gain * 0.7, 0.004, b.decay);
  n.connect(lp).connect(g).connect(s.out);

  const o = s.osc('sine', b.sub * 1.8, at, b.dur);
  o.frequency.exponentialRampToValueAtTime(b.sub, at + 0.12);
  const og = s.gain();
  s.hit(og, at, b.gain * 0.55, 0.002, b.decay * 0.6);
  o.connect(og).connect(s.out);
}

/** 枪声：高频“啪” + 中频躯干 + 低频尾音 */
function shot(s: Scene, at: number, bright: number, decay: number, gain: number): void {
  const n1 = s.noise(at, 0.08);
  const hp = s.filter('highpass', 1500);
  const lp1 = s.filter('lowpass', bright);
  const g1 = s.gain();
  s.hit(g1, at, gain, 0.0005, 0.012);
  n1.connect(hp).connect(lp1).connect(g1).connect(s.out);

  const n2 = s.noise(at, decay * 8);
  const lp2 = s.filter('lowpass', 900);
  const g2 = s.gain();
  s.hit(g2, at, gain * 0.8, 0.001, decay);
  n2.connect(lp2).connect(g2).connect(s.out);

  const n3 = s.noise(at + 0.01, decay * 12);
  const lp3 = s.filter('lowpass', 350);
  const g3 = s.gain();
  s.hit(g3, at + 0.01, gain * 0.25, 0.02, decay * 4);
  n3.connect(lp3).connect(g3).connect(s.out);
}

/** 发动机类嗡鸣：锯齿基频 + 低频 AM + 低通噪声 */
function drone(s: Scene, at: number, dur: number, f0: number, am: number, noiseFc: number, lpFc: number, gain: number): GainNode {
  const env = s.gain();
  env.connect(s.out);
  const lp = s.filter('lowpass', lpFc, 0.9);
  lp.connect(env);
  const amG = s.gain(0.65);
  amG.connect(lp);
  const o = s.osc('sawtooth', f0, at, dur);
  o.connect(amG);
  const lfo = s.osc('sine', am, at, dur);
  const lfoG = s.gain(0.35);
  lfo.connect(lfoG).connect(amG.gain);
  const n = s.noise(at, dur);
  const nl = s.filter('lowpass', noiseFc);
  const ng = s.gain(1.2);
  n.connect(nl).connect(ng).connect(amG);
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + Math.min(0.4, dur / 4));
  env.gain.setValueAtTime(gain, at + dur - Math.min(0.5, dur / 4));
  env.gain.linearRampToValueAtTime(0, at + dur);
  return env;
}

function tone(s: Scene, at: number, dur: number, freq: number, type: OscillatorType, gain: number, attack = 0.004, release = 0.004): void {
  const o = s.osc(type, freq, at, dur + 0.02);
  const g = s.gain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + attack);
  g.gain.setValueAtTime(gain, at + Math.max(attack, dur - release));
  g.gain.linearRampToValueAtTime(0, at + dur);
  o.connect(g).connect(s.out);
}

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....',
  '7': '--...', '8': '---..', '9': '----.',
};

// ---------- 各音效 ----------

type Recipe = (s: Scene, t: number, opts: SynthOptions) => void;

const RECIPES: Record<string, Recipe> = {
  // 不列颠空战：战斗机掠过、空袭警报
  fighter(s, t) { const g = drone(s, t, 5.5, 82, 15, 320, 1100, .45); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + 2); g.gain.linearRampToValueAtTime(0, t + 5.5); },
  air_siren(s, t, opts) { RECIPES.siren(s, t, opts); },
  typewriter(s, t) {
    let at = t;
    for (let i = 0; i < 16; i++) {
      const n = s.noise(at, 0.04);
      const bp = s.filter('bandpass', rand(2500, 4200), 1.2);
      const g = s.gain();
      s.hit(g, at, rand(0.5, 0.8), 0.0005, 0.006);
      n.connect(bp).connect(g).connect(s.out);
      const o = s.osc('square', rand(150, 200), at, 0.03);
      const og = s.gain();
      s.hit(og, at, 0.12, 0.0005, 0.006);
      o.connect(s.filter('lowpass', 800)).connect(og).connect(s.out);
      at += rand(0.07, 0.18) * (i % 5 === 4 ? 2 : 1);
    }
  },

  bell(s, t) {
    const partials: Array<[number, number, number]> = [[2093, 0.5, 0.45], [5270, 0.2, 0.18], [7040, 0.1, 0.09]];
    for (const [f, a, d] of partials) {
      const o = s.osc('sine', f, t, d * 6);
      const g = s.gain();
      s.hit(g, t, a, 0.001, d);
      o.connect(g).connect(s.out);
    }
  },

  stamp(s, t) {
    const o = s.osc('sine', 140, t, 0.4);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    const og = s.gain();
    s.hit(og, t, 0.9, 0.001, 0.05);
    o.connect(og).connect(s.out);
    const n = s.noise(t, 0.2);
    const g = s.gain();
    s.hit(g, t, 0.6, 0.0005, 0.02);
    n.connect(s.filter('lowpass', 2500)).connect(g).connect(s.out);
  },

  paper(s, t) {
    const dur = 1.4;
    const n = s.noise(t, dur);
    const bp = s.filter('bandpass', 3500, 0.7);
    const g = s.gain();
    g.gain.setValueAtTime(0, t);
    let at = t;
    while (at < t + dur - 0.1) {
      g.gain.linearRampToValueAtTime(rand(0.15, 0.6), at + 0.03);
      at += rand(0.04, 0.12);
    }
    g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(bp).connect(g).connect(s.out);
  },

  explosion(s, t) {
    boom(s, t, { dur: 3, fc0: 4000, fc1: 90, decay: 0.6, sub: 45, gain: 1 });
  },

  artillery(s, t) {
    boom(s, t, { dur: 2.5, fc0: 2500, fc1: 150, decay: 0.35, sub: 60, gain: 1 });
    boom(s, t + 1.2, { dur: 1.8, fc0: 700, fc1: 80, decay: 0.6, sub: 40, gain: 0.35 });
  },

  stuka(s, t) {
    const dur = 3.8;
    const o = s.osc('sawtooth', 420, t, dur);
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(1320, t + dur);
    const lp = s.filter('lowpass', 3000, 1);
    const g = s.gain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.4);
    g.gain.linearRampToValueAtTime(0.5, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp).connect(g).connect(s.out);
    const prop = drone(s, t, dur, 55, 38, 300, 900, 0.5);
    prop.gain.linearRampToValueAtTime(0.8, t + dur - 0.3);
  },

  bomber(s, t) {
    const dur = 4;
    const a = drone(s, t, dur, 62, 3.1, 250, 700, 0.5);
    const b = drone(s, t, dur, 64.5, 2.3, 200, 650, 0.4); // 双发拍频
    for (const g of [a, b]) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + dur / 2);
      g.gain.linearRampToValueAtTime(0, t + dur);
    }
  },

  engine(s, t) {
    drone(s, t, 3, 38, 12, 400, 1500, 0.7);
  },

  tank(s, t) {
    const dur = 4;
    drone(s, t, dur, 32, 7, 300, 900, 0.6);
    for (let at = t + 0.05; at < t + dur - 0.1; at += rand(0.1, 0.13)) {
      const n = s.noise(at, 0.05);
      const g = s.gain();
      s.hit(g, at, rand(0.15, 0.3), 0.001, 0.01);
      n.connect(s.filter('bandpass', 1800, 3)).connect(g).connect(s.out);
    }
  },

  ship_gun(s, t) {
    boom(s, t, { dur: 4, fc0: 2000, fc1: 70, decay: 0.9, sub: 35, gain: 1 });
    boom(s, t + 0.35, { dur: 2.5, fc0: 600, fc1: 60, decay: 1, sub: 30, gain: 0.3 });
  },

  siren(s, t) {
    const dur = 4;
    const o = s.osc('sawtooth', 300, t, dur);
    o.frequency.setValueAtTime(300, t);
    o.frequency.setTargetAtTime(650, t, 1.2);
    const lfo = s.osc('sine', 0.5, t, dur);
    const lg = s.gain(25);
    lfo.connect(lg).connect(o.frequency);
    const lp = s.filter('lowpass', 1800, 0.8);
    const g = s.gain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.45, t + 0.3);
    g.gain.setValueAtTime(0.45, t + dur - 0.5);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp).connect(g).connect(s.out);
  },

  radio(s, t) {
    radioNoise(s, t, 2.4, 0.6);
  },

  morse(s, t, opts) {
    const text = (opts.morse ?? 'SOS').toUpperCase();
    const unit = 0.07;
    let at = t + 0.02;
    for (const ch of text) {
      const code = MORSE[ch];
      if (!code) {
        at += unit * 4; // 空格/未知字符 = 词间隔
        continue;
      }
      for (const sym of code) {
        const d = sym === '.' ? unit : unit * 3;
        tone(s, at, d, 700, 'sine', 0.5);
        at += d + unit;
      }
      at += unit * 2;
    }
  },

  mg(s, t) {
    let at = t;
    for (let i = 0; i < 18; i++) {
      shot(s, at, 4000, 0.035, rand(0.6, 0.8));
      at += rand(0.08, 0.095);
    }
  },

  rifle(s, t) {
    shot(s, t, 6000, 0.09, 1);
  },

  march(s, t) {
    const beat = 0.5;
    for (let i = 0; i < 8; i++) {
      const at = t + i * beat;
      snare(s, at, i % 2 === 0 ? 0.7 : 0.45);
      if (i % 4 === 3) snare(s, at + beat / 2, 0.35);
      const n = s.noise(at + 0.01, 0.1);
      const g = s.gain();
      s.hit(g, at + 0.01, 0.6, 0.002, 0.03);
      n.connect(s.filter('lowpass', 500)).connect(g).connect(s.out);
    }
  },

  cavalry(s, t) {
    const dur = 4;
    for (let at = t + 0.05; at < t + dur - 0.2; at += rand(0.4, 0.45)) {
      const rel = (at - t) / dur;
      const lvl = 0.3 + 0.6 * Math.sin(Math.PI * rel);
      [0, 0.07, 0.14].forEach((off, k) => {
        const h = at + off + rand(0, 0.01);
        const n = s.noise(h, 0.08);
        const g = s.gain();
        s.hit(g, h, lvl * (k === 2 ? 0.9 : 0.6), 0.001, 0.015);
        n.connect(s.filter('lowpass', 1200)).connect(g).connect(s.out);
        const o = s.osc('sine', 110, h, 0.08);
        const og = s.gain();
        s.hit(og, h, lvl * 0.4, 0.001, 0.02);
        o.connect(og).connect(s.out);
      });
    }
  },

  ui_click(s, t) {
    const n = s.noise(t, 0.03);
    const g = s.gain();
    s.hit(g, t, 0.5, 0.0003, 0.004);
    n.connect(s.filter('bandpass', 3000, 2)).connect(g).connect(s.out);
    const o = s.osc('sine', 1400, t, 0.05);
    const og = s.gain();
    s.hit(og, t, 0.12, 0.0003, 0.01);
    o.connect(og).connect(s.out);
  },

  fanfare(s, t) {
    // 仿克拉科夫号角开头：F 大调三和弦上行，铜管音色（锯齿 + 滤波包络 + 颤音）
    const notes: Array<[number, number]> = [[349.2, 0.35], [440, 0.35], [523.3, 0.35], [698.5, 0.9], [523.3, 0.3], [698.5, 1.2]];
    let at = t;
    for (const [f, d] of notes) {
      const o = s.osc('sawtooth', f, at, d + 0.05);
      const vib = s.osc('sine', 5.5, at, d + 0.05);
      const vg = s.gain(f * 0.004);
      vib.connect(vg).connect(o.frequency);
      const lp = s.filter('lowpass', 800, 1.5);
      lp.frequency.setValueAtTime(800, at);
      lp.frequency.linearRampToValueAtTime(3200, at + 0.06);
      lp.frequency.setTargetAtTime(2000, at + 0.06, 0.2);
      const g = s.gain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.35, at + 0.04);
      g.gain.setValueAtTime(0.3, at + d - 0.06);
      g.gain.linearRampToValueAtTime(0, at + d);
      o.connect(lp).connect(g).connect(s.out);
      at += d;
    }
  },
};

function snare(s: Scene, at: number, lvl: number): void {
  const n = s.noise(at, 0.2);
  const g = s.gain();
  s.hit(g, at, lvl, 0.001, 0.05);
  n.connect(s.filter('bandpass', 2500, 0.8)).connect(g).connect(s.out);
  const o = s.osc('triangle', 190, at, 0.12);
  const og = s.gain();
  s.hit(og, at, lvl * 0.6, 0.001, 0.03);
  o.connect(og).connect(s.out);
}

function radioNoise(s: Scene, t: number, dur: number, lvl: number): void {
  const n = s.noise(t, dur);
  const bp = s.filter('bandpass', 1800, 0.6);
  const g = s.gain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(lvl * 0.6, t + 0.1);
  g.gain.setValueAtTime(lvl * 0.6, t + dur - 0.2);
  g.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(bp).connect(g).connect(s.out);
  // 噼啪爆音
  for (let at = t + rand(0.02, 0.2); at < t + dur - 0.05; at += rand(0.03, 0.35)) {
    const c = s.noise(at, 0.02);
    const cg = s.gain();
    s.hit(cg, at, lvl * rand(0.3, 1), 0.0005, 0.003);
    c.connect(s.filter('highpass', 1000)).connect(cg).connect(s.out);
  }
  // 外差啸叫
  const o = s.osc('sine', 900, t, dur);
  o.frequency.setValueAtTime(rand(800, 1000), t);
  o.frequency.linearRampToValueAtTime(rand(700, 1200), t + dur);
  const og = s.gain();
  og.gain.setValueAtTime(0, t);
  og.gain.linearRampToValueAtTime(lvl * 0.06, t + 0.3);
  og.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(og).connect(s.out);
}

// ---------- 导出 ----------

/** 程序化合成可用的音效 id（音效 sprite 缺少时的回退；校验 event.sfx 时与 sprite 合并） */
export const SYNTH_IDS = () => Object.keys(RECIPES);

export function playSynth(ctx: AudioContext, out: AudioNode, id: string, opts: SynthOptions = {}): SynthVoice {
  const s = new Scene(ctx, out, opts.gain ?? 0.8, opts.pan ?? 0);
  const recipe = RECIPES[id] ?? RECIPES.ui_click;
  recipe(s, s.t0, opts);
  return { stop: () => s.stop() };
}

export interface Ambience {
  setIntensity(x: number): void;
  stop(): void;
}

export function startAmbience(ctx: AudioContext, out: AudioNode): Ambience {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
  master.connect(out);
  const persistent: AudioScheduledSourceNode[] = [];
  let intensity = 0.3;
  let stopped = false;

  // 风声：循环噪声 → 低通（阵风调制频率与音量）
  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuffer(ctx);
  wind.loop = true;
  const windLp = ctx.createBiquadFilter();
  windLp.type = 'lowpass';
  windLp.frequency.value = 450;
  windLp.Q.value = 0.8;
  const windG = ctx.createGain();
  windG.gain.value = 0.12;
  wind.connect(windLp).connect(windG).connect(master);
  wind.start();
  persistent.push(wind);

  // 远方低频隆隆底噪（强度越大越响）
  const rumble = ctx.createBufferSource();
  rumble.buffer = noiseBuffer(ctx);
  rumble.loop = true;
  rumble.playbackRate.value = 0.5;
  const rumbleLp = ctx.createBiquadFilter();
  rumbleLp.type = 'lowpass';
  rumbleLp.frequency.value = 80;
  const rumbleG = ctx.createGain();
  rumbleG.gain.value = 0.1 * intensity;
  rumble.connect(rumbleLp).connect(rumbleG).connect(master);
  rumble.start();
  persistent.push(rumble);

  const scenes = new Set<Scene>();
  const spawn = (fn: (s: Scene, t: number) => void, gain: number, pan: number): void => {
    const s = new Scene(ctx, master, gain, pan);
    scenes.add(s);
    fn(s, s.t0);
    // 场景自动清理后移除引用
    globalThis.setTimeout(() => scenes.delete(s), 8000);
  };

  let nextGust = ctx.currentTime;
  let nextBoom = ctx.currentTime + rand(0.5, 2);
  let nextRadio = ctx.currentTime + rand(12, 30);

  const tick = (): void => {
    if (stopped) return;
    const now = ctx.currentTime;
    const horizon = now + 0.5;
    if (nextGust < horizon) {
      const d = rand(1.5, 4);
      windLp.frequency.setTargetAtTime(rand(250, 900), nextGust, d / 3);
      windG.gain.setTargetAtTime(rand(0.06, 0.18), nextGust, d / 3);
      nextGust += d;
    }
    // 炮声密度：每秒 0.05（平静）～ 0.9（激战）次
    while (nextBoom < horizon) {
      const at = Math.max(nextBoom, now + 0.01);
      const far = rand(0, 1);
      spawn((s) => {
        boom(s, at, { dur: 3.5, fc0: 380 + 300 * (1 - far), fc1: 60, decay: 0.8 + far, sub: 32 + 10 * (1 - far), gain: 1 });
        if (Math.random() < 0.35 * intensity) {
          boom(s, at + rand(0.15, 0.6), { dur: 3, fc0: 300, fc1: 50, decay: 1.1, sub: 30, gain: 0.5 });
        }
      }, (0.08 + 0.22 * (1 - far)) * (0.5 + 0.5 * intensity), rand(-0.8, 0.8));
      const rate = 0.05 + 0.85 * intensity * intensity;
      nextBoom += -Math.log(1 - Math.random()) / rate;
    }
    if (nextRadio < horizon) {
      const at = Math.max(nextRadio, now + 0.01);
      spawn((s) => radioNoise(s, at, rand(2, 5), 0.5), 0.05, rand(-0.3, 0.3));
      nextRadio = at + rand(15, 40);
    }
  };
  const timer = globalThis.setInterval(tick, 200);
  tick();

  return {
    setIntensity(x: number): void {
      intensity = Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
      rumbleG.gain.setTargetAtTime(0.1 * intensity, ctx.currentTime, 1.5);
      // 强度上升时立即拉近下一次炮声
      const rate = 0.05 + 0.85 * intensity * intensity;
      nextBoom = Math.min(nextBoom, ctx.currentTime + -Math.log(1 - Math.random()) / rate);
    },
    stop(): void {
      if (stopped) return;
      stopped = true;
      globalThis.clearInterval(timer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
      for (const s of scenes) s.stop();
      for (const src of persistent) src.stop(now + 0.7);
      globalThis.setTimeout(() => master.disconnect(), 900);
    },
  };
}
