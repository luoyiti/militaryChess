/// <reference lib="webworker" />
import { createModel, frontGeometry, keyframeField, type FieldModel, type Grid, type KFInput } from './field';

let model: FieldModel | null = null;

type Msg =
  | { type: 'init'; grid: Grid; masks: ArrayBuffer; kfs: KFInput[]; clamp: number }
  | { type: 'geom'; id: number; h: number; wantFields?: boolean }
  | { type: 'warm' };

self.onmessage = (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  if (m.type === 'init') {
    model = createModel(m.grid, new Uint8Array(m.masks), m.kfs, m.clamp);
    (self as unknown as Worker).postMessage({ type: 'ready' });
    return;
  }
  if (!model) return;
  if (m.type === 'warm') {
    // 空闲时预热全部关键帧
    for (let k = 0; k < model.kfs.length; k++) { keyframeField(model, k, 'DE'); keyframeField(model, k, 'SU'); }
    (self as unknown as Worker).postMessage({ type: 'warmed' });
    return;
  }
  if (m.type === 'geom') {
    const t0 = performance.now();
    const g = frontGeometry(model, m.h);
    const msg: Record<string, unknown> = { type: 'geom', id: m.id, h: m.h, fills: g.fills, fronts: g.fronts, ms: performance.now() - t0 };
    const transfer: Transferable[] = [];
    if (m.wantFields) {
      msg.fDE = g.fDE; msg.fSU = g.fSU;
      transfer.push(g.fDE.buffer, g.fSU.buffer);
    }
    (self as unknown as Worker).postMessage(msg, transfer);
  }
};
