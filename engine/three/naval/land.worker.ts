/// <reference lib="webworker" />
import { buildLandGeometry, indexLand, type LLPolygon } from './land';
import { LocalFrame } from './geo';

let index: ReturnType<typeof indexLand> | null = null;
self.onmessage = (ev: MessageEvent<{ type: 'init'; polys: LLPolygon[] } | { type: 'build'; id: number; origin: number[]; radius: number; step: number }>) => {
  const msg = ev.data;
  if (msg.type === 'init') { index = indexLand(msg.polys); self.postMessage({ type: 'ready' }); return; }
  try {
    if (!index) throw new Error('Land index not initialized');
    const frame = new LocalFrame(msg.origin);
    const geometry = buildLandGeometry(index.query(frame, msg.radius), frame, msg.radius, msg.step);
    const position = geometry?.getAttribute('position').array as Float32Array | undefined;
    const normal = geometry?.getAttribute('normal').array as Float32Array | undefined;
    const top = geometry?.getAttribute('aTop').array as Float32Array | undefined;
    self.postMessage({ type: 'land', id: msg.id, position, normal, top }, { transfer: position ? [position.buffer, normal!.buffer, top!.buffer] : [] });
    geometry?.dispose();
  } catch (error) { self.postMessage({ type: 'error', id: msg.id, error: String(error) }); }
};
