/** Small immutable grid index. Query order is stable to preserve label priority/paint order. */
export type Bounds = readonly [number, number, number, number];
export const overlaps = (a: Bounds, b: Bounds) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
export class SpatialIndex<T> {
  private cells = new Map<string, number[]>();
  constructor(private entries: { bounds: Bounds; value: T }[], private cell = 256) {
    entries.forEach((e, i) => {
      for (let x = Math.floor(e.bounds[0] / cell); x <= Math.floor(e.bounds[2] / cell); x++)
        for (let y = Math.floor(e.bounds[1] / cell); y <= Math.floor(e.bounds[3] / cell); y++) {
          const key = `${x},${y}`, ids = this.cells.get(key) ?? [];
          ids.push(i); this.cells.set(key, ids);
        }
    });
  }
  query(b: Bounds): T[] {
    const ids = new Set<number>();
    for (let x = Math.floor(b[0] / this.cell); x <= Math.floor(b[2] / this.cell); x++)
      for (let y = Math.floor(b[1] / this.cell); y <= Math.floor(b[3] / this.cell); y++)
        for (const id of this.cells.get(`${x},${y}`) ?? []) if (overlaps(this.entries[id].bounds, b)) ids.add(id);
    return [...ids].sort((a,b) => a-b).map(i => this.entries[i].value);
  }
}

/** Liang–Barsky: retain crossing segments even when both endpoints are offscreen. */
export function clipSegment(x0: number, y0: number, x1: number, y1: number, b: Bounds): [number, number, number, number] | null {
  const dx = x1-x0, dy = y1-y0; let lo=0, hi=1;
  const p=[-dx,dx,-dy,dy], q=[x0-b[0],b[2]-x0,y0-b[1],b[3]-y0];
  for(let i=0;i<4;i++) {
    if(p[i]===0) { if(q[i]<0) return null; continue; }
    const t=q[i]/p[i];
    if(p[i]<0) lo=Math.max(lo,t); else hi=Math.min(hi,t);
    if(lo>hi) return null;
  }
  return [x0+lo*dx,y0+lo*dy,x0+hi*dx,y0+hi*dy];
}

export function upperBound(a: ArrayLike<number>, t: number) {
  let lo=0, hi=a.length;
  while(lo<hi) { const mid=(lo+hi)>>>1; if(a[mid]<=t) lo=mid+1; else hi=mid; }
  return lo;
}
