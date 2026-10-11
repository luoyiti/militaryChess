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
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const stop = () => synth?.cancel();
  const speak = (text?: string) => {
    if (!enabled || !synth || !text || store.get().muted) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = 0.96;
    const voice = synth.getVoices().find((v) => v.lang.startsWith('en-GB')) ?? synth.getVoices().find((v) => v.lang.startsWith('en'));
    if (voice) u.voice = voice;
    synth.speak(u);
  };
  return {
    topbar(btns) {
      if (!synth) return;
      const b = document.createElement('button');
      b.className = 'tb-narr';
      b.title = '英文旁白（浏览器语音合成）';
      b.textContent = 'EN 旁白';
      b.onclick = () => { enabled = !enabled; b.classList.toggle('on', enabled); if (!enabled) stop(); };
      btns.insertBefore(b, btns.querySelector('.tb-credits'));
    },
    eventCardExtra(e: REvent) {
      return e.narration ? `<details class="ec-narr"><summary>English narration</summary><p>${escapeXml(e.narration)}</p></details>${e.mapNote ? `<p class="ec-mapnote">${escapeXml(e.mapNote)}</p>` : ''}` : null;
    },
    onPresent(e, hold) { if (hold) speak(e.narration); },
    onCancel: stop,
    onPlaying(p) { if (!p) stop(); },
    onMute(m) { if (m) stop(); },
  };
}
