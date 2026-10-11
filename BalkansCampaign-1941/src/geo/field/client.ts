/** 主线程侧的 SDF 场客户端：只保留最新请求，丢弃过期结果。 */
import { YUGOSLAVIA_ACTIVE_FROM } from '../../app/campaign';
import { FRAME, project } from '../frame';
import type { Grid, KFInput, FrontGeometry } from './field';
import type { RKeyframe } from '../../data/db';

export interface GeomResult extends FrontGeometry { ms: number; fDE?: Float32Array; fSU?: Float32Array }

export const GRID: Grid = { w: FRAME.field.w, h: FRAME.field.h, cell: FRAME.field.cell };

export class FieldClient {
  private worker: Worker;
  private ready: Promise<void>;
  private seq = 0;
  private inflight = false;
  private pending: { h: number; wantFields: boolean } | null = null;
  private listeners: ((g: GeomResult) => void)[] = [];
  masks: Uint8Array | null = null;
  last: GeomResult | null = null;

  constructor(keyframes: RKeyframe[], masksUrl: string) {
    this.worker = new Worker(new URL('./field.worker.ts', import.meta.url), { type: 'module' });
    const kfs: KFInput[] = keyframes.map((k) => ({
      h: k.h,
      DE: k.DE.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      SU: k.SU.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
    }));
    this.ready = fetch(masksUrl)
      .then((r) => { if (!r.ok) throw new Error('field_masks 加载失败'); return r.arrayBuffer(); })
      .then((buf) => new Promise<void>((res) => {
        this.masks = new Uint8Array(buf.slice(0));
        const onReady = (ev: MessageEvent) => {
          if (ev.data?.type === 'ready') { this.worker.removeEventListener('message', onReady); res(); }
        };
        this.worker.addEventListener('message', onReady);
        this.worker.postMessage({ type: 'init', expandAt: YUGOSLAVIA_ACTIVE_FROM, grid: GRID, masks: buf, kfs, clamp: Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)) }, [buf]);
      }));
    this.worker.addEventListener('message', (ev) => {
      const d = ev.data;
      if (d?.type !== 'geom') return;
      this.inflight = false;
      this.last = d as GeomResult;
      for (const l of this.listeners) l(d as GeomResult);
      this.flush();
    });
  }

  whenReady() { return this.ready; }
  onGeom(fn: (g: GeomResult) => void) { this.listeners.push(fn); }
  warm() { this.ready.then(() => this.worker.postMessage({ type: 'warm' })); }

  request(h: number, wantFields = false) {
    this.pending = { h, wantFields: wantFields || (this.pending?.wantFields ?? false) };
    this.ready.then(() => this.flush());
  }
  private flush() {
    if (this.inflight || !this.pending) return;
    const p = this.pending;
    this.pending = null;
    this.inflight = true;
    this.worker.postMessage({ type: 'geom', id: ++this.seq, h: p.h, wantFields: p.wantFields });
  }
}

export function toGrid(ll: readonly number[]): number[] {
  const [x, y] = project(ll);
  return [x / GRID.cell, y / GRID.cell];
}
