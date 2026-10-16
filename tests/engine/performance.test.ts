import { describe, expect, it } from 'vitest';
import { SpatialIndex, clipSegment, upperBound } from '../../engine/geo/spatial';
import { LatestRequest } from '../../engine/core/latest';
import { indexLand, buildLandGeometry } from '../../engine/three/naval/land';
import { LocalFrame } from '../../engine/three/naval/geo';

describe('viewport queries preserve geographic content', () => {
  it('clips crossing lines whose endpoints are both outside; keeps boundary lines', () => {
    expect(clipSegment(-20,5,20,5,[0,0,10,10])).toEqual([0,5,10,5]);
    expect(clipSegment(0,-5,0,20,[0,0,10,10])).toEqual([0,0,0,10]);
    expect(clipSegment(-5,-5,-5,20,[0,0,10,10])).toBeNull();
    expect(clipSegment(5,5,5,5,[0,0,10,10])).toEqual([5,5,5,5]);
  });
  it('deduplicates multi-cell lines and retains original paint/label order', () => {
    const index = new SpatialIndex([
      {bounds:[-10,5,40,5] as const,value:'crossing'},
      {bounds:[2,2,3,3] as const,value:'near'},
      {bounds:[100,100,120,120] as const,value:'far'},
    ],10);
    expect(index.query([0,0,20,20])).toEqual(['crossing','near']);
  });
  it('resolves exact event boundaries, reverse seeks and duplicated times', () => {
    const times = new Float64Array([1,2,2,4]);
    expect([5,2,0,1,3].map(t=>upperBound(times,t))).toEqual([4,3,0,1,3]);
  });
  it('indexed coastal geometry is identical to full input, excluding distant polygons', () => {
    const near = [[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]]];
    const far = [[[40,40],[41,40],[41,41],[40,41],[40,40]]];
    const frame = new LocalFrame([0,0]);
    const polys = [near,far] as Parameters<typeof indexLand>[0];
    const candidates=indexLand(polys).query(frame,200000);
    expect(candidates).toEqual([near]);
    const original=buildLandGeometry(polys,frame,200000,700)!;
    const indexed=buildLandGeometry(candidates,frame,200000,700)!;
    expect(indexed.getAttribute('position').array).toEqual(original.getAttribute('position').array);
    original.dispose();indexed.dispose();
  });
});

describe('asynchronous land rebuilds', () => {
  it('never accepts the old origin after rapid camera changes', () => {
    const requests=new LatestRequest(), a=requests.next(), b=requests.next(), c=requests.next();
    expect(requests.accepts(b)).toBe(false);
    expect(requests.accepts(a)).toBe(false);
    expect(requests.accepts(c)).toBe(true);
    requests.next(); expect(requests.accepts(c)).toBe(false);
  });
});
