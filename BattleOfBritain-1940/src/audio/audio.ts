/** Offline instrumental bed + one-shot effects. Background level never depends on the effects slider. */
import { Howl, Howler } from 'howler';
import type { SfxId } from '../schema';
import { playSynth } from './synth';

type MusicId = 'operations' | 'polonaise' | 'elegy' | 'hejnal';
interface MusicMeta { id: MusicId; src: string[]; title: string }

class AudioManager {
  private sfx: Howl | null = null;
  private sfxOk=false;
  private music=new Map<MusicId,Howl>();
  private current:MusicId|null=null;
  private initTask:Promise<void>|null=null;
  private duckLevel=1;
  private sprite:Record<string,[number,number,boolean?]>={};
  private lastPlay=new Map<string,number>();
  unlocked=false;
  muted=false;
  musicVol=.22;
  sfxVol=.8;

  init():Promise<void>{
    if(!this.initTask)this.initTask=this.load();
    return this.initTask;
  }
  private async load(){
    try{
      const meta=await fetch('audio/sfx.json').then(r=>r.json());this.sprite=meta.sprite;
      this.sfx=new Howl({src:meta.src,sprite:meta.sprite,preload:true,volume:this.sfxVol,
        onload:()=>{this.sfxOk=true;},onloaderror:()=>{this.sfxOk=false;}});
    }catch{this.sfxOk=false;}
    try{
      const list:MusicMeta[]=await fetch('audio/music.json').then(r=>r.json());
      for(const m of list)this.music.set(m.id,new Howl({src:m.src,html5:false,loop:m.id!=='hejnal',volume:0,preload:m.id==='operations'}));
    }catch{/* Effects remain available if a music asset is missing. */}
    if(Howler.ctx?.state==='suspended')await Howler.ctx.resume().catch(()=>undefined);
    this.unlocked=true;
    Howler.mute(this.muted);
  }
  private get ctx():AudioContext|null{return Howler.ctx as AudioContext??null;}
  private get out():AudioNode|null{return Howler.masterGain as GainNode??null;}

  play(id:SfxId,opts:{volume?:number;pan?:number;throttleMs?:number}={}){
    if(!this.unlocked||this.muted)return;
    const now=performance.now(),last=this.lastPlay.get(id)??-Infinity;
    if(now-last<(opts.throttleMs??250))return;this.lastPlay.set(id,now);
    // The copied radio samples are static/interference rather than narration; use a quiet paper cue.
    const cue:SfxId=id==='radio'?'paper':id;
    const vol=(opts.volume??1)*this.sfxVol*(id==='radio'?.25:1);
    if(this.sfx&&this.sfxOk&&this.sprite[cue]){
      const sid=this.sfx.play(cue);this.sfx.volume(vol,sid);
      if(opts.pan)this.sfx.stereo(Math.max(-1,Math.min(1,opts.pan)),sid);
      return;
    }
    if(this.ctx&&this.out)playSynth(this.ctx,this.out,cue,{gain:vol,pan:opts.pan??0});
  }
  playMusic(id:MusicId,fadeMs=1800){
    if(!this.unlocked||this.current===id)return;
    const prevId=this.current,prev=prevId?this.music.get(prevId):null;
    if(prev){prev.fade(prev.volume(),0,fadeMs);setTimeout(()=>{if(this.current!==prevId)prev.pause();},fadeMs+50);}
    const h=this.music.get(id);this.current=id;if(!h)return;
    h.volume(0);if(!h.playing())h.play();h.fade(0,this.musicVol*this.duckLevel,fadeMs);
  }
  stopMusic(fadeMs=1000){
    const prev=this.current?this.music.get(this.current):null;this.current=null;
    if(prev){prev.fade(prev.volume(),0,fadeMs);setTimeout(()=>prev.pause(),fadeMs+50);}
  }
  hejnal(){this.playMusic('hejnal');}
  duck(level:number,ms=500){
    this.duckLevel=Math.max(0,Math.min(1,level));
    const h=this.current?this.music.get(this.current):null;
    if(h)h.fade(h.volume(),this.musicVol*this.duckLevel,ms);
  }
  /** Existing entry point now starts exactly one continuous, non-vocal music bed. */
  startAmbience(){if(this.unlocked)this.playMusic('operations');}
  // Timeline progression does not restart or modulate the background on every frame.
  setIntensity(_x:number){}
  setMuted(m:boolean){this.muted=m;Howler.mute(m);}
  setMusicVol(v:number){
    this.musicVol=Math.max(0,Math.min(1,v));const h=this.current?this.music.get(this.current):null;
    if(h)h.volume(this.musicVol*this.duckLevel);
  }
  setSfxVol(v:number){this.sfxVol=Math.max(0,Math.min(1,v));}
}
export const audio=new AudioManager();
