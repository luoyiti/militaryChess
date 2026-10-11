/// <reference lib="webworker" />
import { createModel, createAirModel, frontGeometry, keyframeField, type FieldModel, type Grid, type KFInput } from './field';

let model: FieldModel | null = null;

type Msg =
  | { type: 'init'; grid: Grid; masks: ArrayBuffer; kfs: KFInput[]; clamp: number; air?:boolean }
  | { type: 'geom'; id: number; h: number; wantFields?: boolean }
  | { type: 'warm' };

self.onmessage = (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  if (m.type === 'init') {
    model = m.air ? createAirModel(m.grid,new Uint8Array(m.masks),m.kfs.map((k)=>({h:k.h,raids:k.DE,interceptions:k.SU})),m.clamp) : createModel(m.grid, new Uint8Array(m.masks), m.kfs, m.clamp);
    (self as unknown as Worker).postMessage({ type: 'ready' });
    return;
  }
  if (!model) return;
  if (m.type === 'warm') {
    // 分批预热，允许拖动时间轴产生的新请求在关键帧之间插队。
    const warmModel=model;
    const step=(k:number)=>{if(k>=warmModel.kfs.length){(self as unknown as Worker).postMessage({type:'warmed'});return;}keyframeField(warmModel,k,'DE');keyframeField(warmModel,k,'SU');setTimeout(()=>step(k+1),0);};
    step(0);
    return;
  }
  if (m.type === 'geom') {
    const t0 = performance.now();
    const g = frontGeometry(model, m.h);
    const msg: Record<string, unknown> = { type: 'geom', id: m.id, h: m.h, air:g.air, fills: g.fills, fronts: g.fronts, ms: performance.now() - t0 };
    const transfer: Transferable[] = [];
    if (m.wantFields) {
      msg.fDE = g.fDE; msg.fSU = g.fSU;
      transfer.push(g.fDE.buffer, g.fSU.buffer);
    }
    (self as unknown as Worker).postMessage(msg, transfer);
  }
};
