import { phaseAt } from '../app/campaign';
import { store } from '../app/store';
import { escapeXml } from '../map2d/symbols';
interface Clip {id:string;src:string;title:string;transcript:string}
/** 由用户主动播放的本地英语讲解；合成旁白不冒充历史录音。 */
export async function mountNarration(parent: HTMLElement) {
  const manifest = await fetch('audio/narration.json').then(r=>r.json()) as {phases:Clip[]};
  const el=document.createElement('div');el.className='narration-panel';parent.appendChild(el);
  const player=new Audio();player.preload='none';let clipId='';
  const render=()=>{
    const clip=manifest.phases.find(c=>c.id===phaseAt(store.get().t).id);if(!clip||clipId===clip.id)return;
    player.pause();clipId=clip.id;player.src=clip.src;
    el.innerHTML=`<span class="narration-title">英语讲解 · ${escapeXml(phaseAt(store.get().t).short)}</span><button type="button">▶ 播放旁白</button><p>现代合成英语讲解，非历史录音</p><details><summary>英文文稿</summary><p>${escapeXml(clip.transcript)}</p></details>`;
    const btn=el.querySelector('button')!;
    btn.onclick=async()=>{if(player.paused){try{await player.play();btn.textContent='❚❚ 暂停旁白';}catch{btn.textContent='重试播放';}}else{player.pause();btn.textContent='▶ 播放旁白';}};
    player.onended=()=>{btn.textContent='▶ 重播旁白';};
  };
  store.on((s,ch)=>{if(ch.has('t'))render();if(ch.has('muted'))player.muted=s.muted;});player.muted=store.get().muted;render();
}
