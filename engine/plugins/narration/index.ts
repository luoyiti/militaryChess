/**
 * 旁白插件：两种来源共用一套静音/停止约定。
 *  - clips：按战役阶段播放预录的讲解音频（audio/narration.json，克里特）。由用户主动播放；合成旁白不冒充历史录音。
 *  - tts：用浏览器语音合成朗读事件的英文 narration 字段（挪威），顶栏「EN 旁白」开关，导演驻留时朗读。
 */
import { definePlugin, type PluginHooks } from '../api';
import { phaseAt } from '../../core/phases';
import { escapeXml } from '../../map2d/symbols';
import type { REvent } from '../../data/db';

interface Clip { id: string; src: string; title: string; transcript: string }

export function narration(opts: { provider: 'clips' | 'tts' }) {
  return definePlugin({
    id: `narration-${opts.provider}`,
    setup: (ctx) => (opts.provider === 'clips' ? clips(ctx.store) : tts(ctx.store)),
  });
}

function clips(store: import('../api').EngineCtx['store']): PluginHooks {
  const player = new Audio();
  player.preload = 'none';
  let clipId = '';
  let el: HTMLElement | null = null;
  let manifest: { phases: Clip[] } | null = null;
  const render = () => {
    if (!el || !manifest) return;
    const p = phaseAt(store.get().t);
    const clip = manifest.phases.find((c) => c.id === p.id);
    if (!clip || clipId === clip.id) return;
    player.pause(); clipId = clip.id; player.src = clip.src;
    el.innerHTML = `<span class="narration-title">英语讲解 · ${escapeXml(p.short)}</span><button type="button">▶ 播放旁白</button><p>现代合成英语讲解，非历史录音</p><details><summary>英文文稿</summary><p>${escapeXml(clip.transcript)}</p></details>`;
    const btn = el.querySelector('button')!;
    btn.onclick = async () => {
      if (player.paused) { try { await player.play(); btn.textContent = '❚❚ 暂停旁白'; } catch { btn.textContent = '重试播放'; } }
      else { player.pause(); btn.textContent = '▶ 播放旁白'; }
    };
    player.onended = () => { btn.textContent = '▶ 重播旁白'; };
  };
  player.muted = store.get().muted;
  return {
    sidebarBrief(pane) {
      el = document.createElement('div');
      el.className = 'narration-panel';
      pane.appendChild(el);
      fetch('audio/narration.json').then((r) => r.json()).then((m) => { manifest = m; render(); }).catch(() => el?.remove());
    },
    onTime: render,
    onMute(m) { player.muted = m; },
  };
}

function tts(store: import('../api').EngineCtx['store']): PluginHooks {
  let enabled = false;
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
  const stop = () => synth?.cancel();
  /** 原创英文摘要，由可选的浏览器语音朗读，绝不冒充历史录音 */
  const speak = (text?: string, force = false) => {
    if (!synth || !text || store.get().muted || (!force && !enabled)) return;
    stop();
    const line = new SpeechSynthesisUtterance(text);
    line.lang = 'en-GB'; line.rate = 0.95; line.volume = 0.75;
    const voices = synth.getVoices();
    line.voice = voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
    synth.speak(line);
  };
  let current: REvent | null = null;
  document.addEventListener('click', (ev) => {
    if (!(ev.target as HTMLElement).closest?.('.ec-speak')) return;
    ev.preventDefault();
    speak(current?.narration, true);
  });
  return {
    topbar(btns) {
      const b = document.createElement('button');
      b.className = 'tb-narrate';
      b.title = '可选合成英语旁白；非历史录音';
      b.textContent = 'EN 旁白';
      b.onclick = () => { enabled = !enabled; b.classList.toggle('on', enabled); if (!enabled) stop(); };
      btns.querySelector('.tb-sound')?.insertAdjacentElement('afterend', b);
    },
    eventCardExtra(e: REvent) {
      current = e;
      return e.narration ? `<details class="ec-narration"><summary>English briefing · <button class="ec-speak" type="button">朗读</button></summary><p>${escapeXml(e.narration)}</p><small>可选浏览器合成英语声音 · 非历史录音</small></details>` : null;
    },
    onPresent(e, hold) { if (hold) speak(e.narration); },
    onCancel: stop,
    onPlaying(p) { if (!p) stop(); },
    onMute(m) { if (m) stop(); },
  };
}
