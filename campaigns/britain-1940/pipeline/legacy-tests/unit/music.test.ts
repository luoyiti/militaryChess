import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

describe('器乐背景循环',()=>{
  it('无静音断段，循环接缝与普通采样步长一致且没有削波',()=>{
    const path=resolve(__dirname,'../../public/audio/music/operations-room.wav');
    expect(existsSync(path)).toBe(true);
    const b=readFileSync(path), rate=b.readUInt32LE(24), channels=b.readUInt16LE(22);
    expect(channels).toBe(2);
    const samples=new Int16Array(b.buffer,b.byteOffset+44,(b.length-44)/2);
    const frames=samples.length/channels;
    expect(frames/rate).toBeCloseTo(64,3);
    let peak=0,maxStep=0,minRms=Infinity;
    const halfSecond=Math.floor(rate/2);
    for(let start=0;start<frames;start+=halfSecond){let energy=0,count=0;
      for(let f=start;f<Math.min(frames,start+halfSecond);f++){
        const x=samples[f*2]/32768;energy+=x*x;count++;peak=Math.max(peak,Math.abs(x));
        if(f)maxStep=Math.max(maxStep,Math.abs(x-samples[(f-1)*2]/32768));
      }minRms=Math.min(minRms,Math.sqrt(energy/count));
    }
    expect(minRms).toBeGreaterThan(.015);
    expect(peak).toBeLessThan(.8);
    for(let c=0;c<channels;c++)expect(Math.abs(samples[c]-samples[(frames-1)*2+c])/32768).toBeLessThan(maxStep*1.25+.001);
  });
});
