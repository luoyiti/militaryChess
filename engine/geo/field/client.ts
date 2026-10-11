/** 主线程侧的 SDF 场客户端：同一时刻只有一个请求在途，期间只保留最新的待发请求。 */
import { FRAME, GRID, project } from '../frame';
import { bitsMask, type FieldCfg, type KFInput, type FrontGeometry } from './field';
import type { RKeyframe } from '../../data/db';
import type { CampaignManifest } from '../../campaign/types';
import { isoToHours } from '../../core/time';

export { GRID };
export interface GeomResult extends FrontGeometry { ms: number; fA?: Float32Array; fB?: Float32Array }

/** manifest.control → 场配置（主线程与 Node 校验共用） */
export function fieldCfg(control: CampaignManifest['control']): FieldCfg {
  const deferred = (control.deferred ?? []).map((d) => ({ mask: bitsMask(d.bits), h: isoToHours(d.from) }));
  const deferredMask = deferred.reduce((m, d) => m | d.mask, 0);
  return {
    air: control.mode === 'air',
    theatreMask: bitsMask(control.theatreBits) & ~deferredMask,
    deferred,
    homeMasks: [bitsMask(control.slots[0]?.homeBits), bitsMask(control.slots[1]?.homeBits)],
  };
}

export class FieldClient {
  private worker: Worker;
  private ready: Promise<void>;
  private seq = 0;
  private inflight = false;
  private pending: { h: number; wantFields: boolean } | null = null;
  private listeners: ((g: GeomResult) => void)[] = [];
  masks: Uint8Array | null = null;
  last: GeomResult | null = null;

  constructor(keyframes: RKeyframe[], masksUrl: string, cfg: FieldCfg) {
    this.worker = new Worker(new URL('./field.worker.ts', import.meta.url), { type: 'module' });
    const kfs: KFInput[] = keyframes.map((k) => ({
      h: k.h,
      a: k.a.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      b: k.b.map((poly) => poly.map((ring) => ring.map((ll) => toGrid(ll)))),
      ...(k.transition ? { transition: k.transition } : {}),
    }));
    this.ready = fetch(masksUrl)
      .then((r) => { if (!r.ok) throw new Error('field_masks 加载失败'); return r.arrayBuffer(); })
      .then((buf) => new Promise<void>((res) => {
        this.masks = new Uint8Array(buf.slice(0));
        const onReady = (ev: MessageEvent) => {
          if (ev.data?.type === 'ready') { this.worker.removeEventListener('message', onReady); res(); }
        };
        this.worker.addEventListener('message', onReady);
        const grid = { w: GRID.w, h: GRID.h, cell: GRID.cell };
        this.worker.postMessage({ type: 'init', grid, masks: buf, kfs, clamp: Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)), cfg }, [buf]);
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
