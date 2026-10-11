/// <reference lib="webworker" />
import { createModel, frontGeometry, keyframeField, type FieldCfg, type FieldModel, type Grid, type KFInput } from './field';

let model: FieldModel | null = null;

type Msg =
  | { type: 'init'; grid: Grid; masks: ArrayBuffer; kfs: KFInput[]; clamp: number; cfg: FieldCfg }
  | { type: 'geom'; id: number; h: number; wantFields?: boolean }
  | { type: 'warm' };

self.onmessage = (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  if (m.type === 'init') {
    model = createModel(m.grid, new Uint8Array(m.masks), m.kfs, m.clamp, m.cfg);
    (self as unknown as Worker).postMessage({ type: 'ready' });
    return;
  }
  if (!model) return;
  if (m.type === 'warm') {
    // 空闲时逐帧预热（分批让出，避免阻塞随后到来的几何请求）
    const warmModel = model;
    const step = (k: number) => {
      if (k >= warmModel.kfs.length) { (self as unknown as Worker).postMessage({ type: 'warmed' }); return; }
      keyframeField(warmModel, k, 0); keyframeField(warmModel, k, 1);
      setTimeout(() => step(k + 1), 0);
    };
    step(0);
    return;
  }
  if (m.type === 'geom') {
    const t0 = performance.now();
    const g = frontGeometry(model, m.h);
    const msg: Record<string, unknown> = { type: 'geom', id: m.id, h: m.h, air: g.air, fills: g.fills, fronts: g.fronts, ms: performance.now() - t0 };
    const transfer: Transferable[] = [];
    if (m.wantFields) {
      msg.fA = g.fA; msg.fB = g.fB;
      transfer.push(g.fA.buffer, g.fB.buffer);
    }
    (self as unknown as Worker).postMessage(msg, transfer);
  }
};
