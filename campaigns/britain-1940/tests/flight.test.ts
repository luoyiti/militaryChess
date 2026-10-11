/** 不列颠空战：编队的 Canvas 朝向与生命周期、事件出击重放、导演驻留时刻。 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FxLayer } from '../../../engine/map2d/fx';
import { Director } from '../../../engine/app/director';
import { openCampaign } from '../../../tests/helpers';
import { project } from '../../../engine/geo/frame';
import { eventSorties, flightPoseAt } from '../../../engine/model/flight';
import { unitStateAt } from '../../../engine/model/core';
import { store } from '../../../engine/app/store';
import { clock } from '../../../engine/app/clock';
import { audio } from '../../../engine/audio/audio';
import type { MapView } from '../../../engine/map2d/MapView';
import type { EventCard } from '../../../engine/ui/eventCard';
import type { DynamicLayers } from '../../../engine/map2d/dynamicLayers';
import type { LonLat } from '../../../engine/core/types';

// Canvas is the external boundary; record the matrix used to paint the real plane shape.
function canvasMap() {
  type Matrix = [number, number, number, number, number, number];
  let matrix: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: { matrix: Matrix; alpha: number; fill: string }[] = [];
  const draws: { x: number; y: number; nose: [number, number]; alpha: number; color: string }[] = [];
  const ctx = {
    globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1,
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number) { matrix = [a, b, c, d, e, f]; },
    getTransform() { const [a, b, c, d, e, f] = matrix; return { a, b, c, d, e, f }; },
    save() { stack.push({ matrix: [...matrix], alpha: this.globalAlpha, fill: this.fillStyle }); },
    restore() { const s = stack.pop()!; matrix = s.matrix; this.globalAlpha = s.alpha; this.fillStyle = s.fill; },
    translate(x: number, y: number) { matrix[4] += matrix[0] * x + matrix[2] * y; matrix[5] += matrix[1] * x + matrix[3] * y; },
    rotate(angle: number) { const [a, b, c, d, e, f] = matrix, cs = Math.cos(angle), sn = Math.sin(angle); matrix = [a * cs + c * sn, b * cs + d * sn, c * cs - a * sn, d * cs - b * sn, e, f]; },
    scale(x: number, y: number) { matrix[0] *= x; matrix[1] *= x; matrix[2] *= y; matrix[3] *= y; },
    fill() { draws.push({ x: matrix[4], y: matrix[5], nose: [matrix[0], matrix[1]], alpha: this.globalAlpha, color: this.fillStyle }); },
    clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {}, stroke() {}, arc() {},
    createRadialGradient() { return { addColorStop() {} }; },
  };
  const map = { fx: { width: 1440, height: 960, getContext: () => ctx }, width: 1440, height: 960, dpr: 1, relK: 1, view: { x: 0, y: 0, k: 1 },
    llToScreen: project, toScreen: (x: number, y: number) => [x, y], toWorld: (x: number, y: number) => [x, y], onManual() {}, flyToFrame() {} } as unknown as MapView;
  return { map, draws, fx: new FxLayer(map) };
}

const { db } = openCampaign('britain-1940');
const event = (id: string) => db.events.find((e) => e.id === id)!;
const subscriptions: (() => void)[] = [];

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal('window', globalThis);
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.spyOn(audio, 'play').mockImplementation(() => undefined);
  const subscribe = store.on.bind(store);
  vi.spyOn(store, 'on').mockImplementation((fn) => { const off = subscribe(fn); subscriptions.push(off); return off; });
  store.set({ t: 0, playing: false, director: true, speed: 1, mode: '2d', selectedEvent: null, selectedUnit: null, followUnit: false });
  await Promise.resolve();
});
afterEach(() => { subscriptions.splice(0).forEach((off) => off()); clock.release(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('编队的实际 Canvas 朝向与生命周期', () => {
  it('法国出发的编队在真实起点和目标之间运动，机头沿投影后的西北航向', () => {
    const { fx, draws } = canvasMap();
    const origin: LonLat = [-.424, 49.106], target: LonLat = [-1.8, 50.32];
    fx.planesTo(target, 'fighter', 'E', origin);
    fx.draw(3100);
    const plane = draws.find((d) => d.color === '#8e3636')!;
    const midpoint = project([-1.112, 49.713]);
    expect(plane.x).toBeCloseTo(midpoint[0], 4);
    expect(plane.y).toBeCloseTo(midpoint[1], 4);
    const a = project([-1.112, 49.713]), b = project([-1.112688, 49.713607]);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    expect((plane.nose[0] * dx + plane.nose[1] * dy) / Math.hypot(...plane.nose) / Math.hypot(dx, dy)).toBeGreaterThan(.9999);
  });

  it('事件编队完成目标后的交战航段并向法国返航，不继续冲向屏幕边缘', async () => {
    const { fx, map, draws } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    director.present(event('e.convoy_peewit'), false);
    await Promise.resolve();
    vi.advanceTimersByTime(350);
    fx.draw(5980);
    const plane = draws.find((d) => d.color === '#2d4056')!;
    expect(plane).toBeDefined();
    // First StG77 sortie: 11:17 -> 12:55; 65% reaches 12:20.7 on its return leg.
    const expected = project([-1.47811714285714, 50.09089]);
    expect(plane.x).toBeCloseTo(expected[0], 4);
    expect(plane.y).toBeCloseTo(expected[1], 4);
    expect(plane.nose[0]).toBeGreaterThan(0);
    expect(plane.nose[1]).toBeGreaterThan(0);
  });

  it('切换事件后，旧事件的延迟出击不会落在新事件地图上', async () => {
    const { fx, map } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    director.present(event('e.convoy_peewit'), false);
    await Promise.resolve();
    vi.advanceTimersByTime(100);
    director.present(event('e.hardest_day'), false);
    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(fx.busy).toBe(false);
  });

  it('播放时向前 seek 六小时也立即取消旧编队和待执行事件', async () => {
    const e = event('e.convoy_peewit');
    store.set({ t: e.h, playing: true });
    await Promise.resolve();
    const { fx, map } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    director.present(e, false);
    await Promise.resolve();
    vi.advanceTimersByTime(350);
    expect(fx.busy).toBe(true);
    clock.seek(e.h + 6);
    expect(fx.busy).toBe(false);
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(fx.busy).toBe(false);
  });

  it('seek 与手动点选同一微任务发布时，新事件五支编队仍然出击', async () => {
    const { fx, map } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    const e = event('e.convoy_peewit');
    clock.seek(e.h);
    director.present(e, false);
    await Promise.resolve();
    vi.advanceTimersByTime(350);
    fx.draw(1000);
    expect(fx.stats().formations).toBe(5);
    expect(fx.stats().planes.map((p) => p.unit).sort()).toEqual(['de.i_stg77', 'de.i_zg26', 'de.iii_stg1', 'gb.601_sqn', 'gb.609_sqn']);
  });

  it('暂停时跳到另一日期会清除当前飞行和投弹效果', async () => {
    const { fx, map } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    director.present(event('e.convoy_peewit'), false);
    await Promise.resolve();
    vi.advanceTimersByTime(350);
    expect(fx.busy).toBe(true);
    store.set({ t: 1200 });
    await Promise.resolve();
    expect(fx.busy).toBe(false);
  });
});


describe('事件的来源航线', () => {
  it('一个事件中的袭击、护航、RAF 中队及各自返航都得到重放', () => {
    const sorties = eventSorties(db, event('e.convoy_peewit'));
    expect(sorties.map((s) => s.unit).sort()).toEqual(['de.i_stg77', 'de.i_zg26', 'de.iii_stg1', 'gb.601_sqn', 'gb.609_sqn']);
    expect(sorties.map((s) => s.role).sort()).toEqual(['escort', 'intercept', 'intercept', 'raid', 'raid']);
    expect(sorties.find((s) => s.unit === 'de.i_stg77')!.wps.at(-1)!.ll).toEqual([-.424, 49.106]);
    expect(sorties.find((s) => s.unit === 'gb.601_sqn')!.wps.at(-1)!.ll).toEqual([-.704, 50.847]);
    expect(eventSorties(db, event('e.hardest_day'))).toHaveLength(6);
    expect(eventSorties(db, event('e.northern_raids'))).toHaveLength(7);
  });

  it('同一编队在不同日期的航迹不混入当前重放，南方目标沿自己的航线返回', () => {
    const sorties = eventSorties(db, event('e.hardest_day'));
    const stuka = sorties.find((s) => s.unit === 'de.i_stg77')!;
    expect(stuka.id).toBe('r.hardest_day_south.de.i_stg77.out');
    expect(stuka.attackLL).toEqual([-.565, 50.83]);
    expect(stuka.wps.every((w) => Math.abs(w.h - event('e.hardest_day').h) < 2)).toBe(true);
  });

  it('航段转弯时位置经过节点，机头切换到下一航段', () => {
    const wps = [{ h: 0, ll: [0, 51] as LonLat }, { h: 1, ll: [0, 52] as LonLat }, { h: 2, ll: [1, 52] as LonLat }];
    const north = flightPoseAt(wps, .5)!;
    expect(north.ll).toEqual([0, 51.5]);
    expect(Math.sin(north.heading)).toBeLessThan(-.99);
    const turn = flightPoseAt(wps, 1)!;
    expect(turn.ll).toEqual([0, 52]);
    expect(Math.cos(turn.heading)).toBeGreaterThan(.99);
  });

  it.each(['escort', 'intercept'] as const)('%s 战斗机经过交战节点时不触发投弹', (role) => {
    const { fx, draws } = canvasMap();
    fx.planesAlong({ id: role, unit: 'fighter', side: role === 'escort' ? 'DE' : 'GB', role,
      wps: [{ h: 0, ll: [0, 51] }, { h: .5, ll: [1, 51] }, { h: 1, ll: [0, 51] }], attackH: .5, attackLL: [1, 51] }, 'fighter');
    fx.draw(6000);
    expect(fx.stats().planes).toHaveLength(1);
    expect(fx.stats().particles).toBe(0);
    expect(draws.some((d) => d.color === (role === 'escort' ? '#2d4056' : '#8e3636'))).toBe(true);
    expect(draws.some((d) => d.color === (role === 'escort' ? '#8e3636' : '#2d4056'))).toBe(false);
  });

  it('编队接近返航终点逐渐淡出，最后一架不会停留在基地', () => {
    const { fx } = canvasMap();
    fx.planesAlong({ id: 'return', unit: 'fighter', side: 'GB', role: 'intercept', wps: [{ h: 0, ll: [0, 51] }, { h: 1, ll: [1, 51] }] }, 'fighter');
    fx.draw(8500);
    const first = fx.stats().planes[0].alpha;
    fx.draw(9100);
    expect(fx.stats().planes[0].alpha).toBeLessThan(first);
    expect(fx.stats().planes[0].alpha).toBeGreaterThan(0);
    fx.draw(9600);
    expect(fx.stats().formations).toBe(0);
    expect(fx.busy).toBe(false);
  });
});


describe('导演驻留的事件时间', () => {
  it('8倍播放越过12:00后驻留回到准确时间，RAF状态与新编队保留', async () => {
    const e = event('e.convoy_peewit');
    store.set({ t: e.h - .25, playing: true, director: true, speed: 8 });
    await Promise.resolve();
    const { fx, map } = canvasMap();
    const director = new Director(db, map, { show() {}, dwellMs: () => 0 } as unknown as EventCard, fx, {} as DynamicLayers);
    store.set({ t: e.h + .5 });
    await Promise.resolve();
    await Promise.resolve();
    expect(director.current?.id).toBe('e.convoy_peewit');
    expect(store.get().t).toBe(708);
    expect(unitStateAt('gb.601_sqn', db.units, store.get().t)!.flightPhase).toBe('engaged');
    expect(clock.holding).toBe(true);
    vi.advanceTimersByTime(1150);
    expect(fx.stats().formations).toBe(5);
  });

  it('驻留时间对齐后保留同次越过的下一个事件，释放后只展示一次', async () => {
    const first = event('e.convoy_peewit');
    const second = { ...first, id: 'e.hold_second', at: '1940-08-08T12:15', h: first.h + .25, h1: first.h + .25 };
    const fixtureDB = { ...db, events: [first, second] };
    store.set({ t: first.h - .25, playing: true, director: true, speed: 8 });
    await Promise.resolve();
    const { fx, map } = canvasMap();
    const shown: string[] = [];
    const card = { show(e: typeof first) { shown.push(e.id); }, dwellMs: () => 0 } as unknown as EventCard;
    const director = new Director(fixtureDB, map, card, fx, {} as DynamicLayers);
    store.set({ t: first.h + .5 });
    await Promise.resolve();
    await Promise.resolve();
    expect(store.get().t).toBe(708);
    expect(shown).toEqual(['e.convoy_peewit']);
    clock.release();
    director.tick();
    await Promise.resolve();
    await Promise.resolve();
    expect(store.get().t).toBe(708.25);
    expect(director.current?.id).toBe('e.hold_second');
    vi.advanceTimersByTime(1150);
    expect(fx.stats().formations).toBe(5);
    clock.release();
    director.tick();
    expect(shown).toEqual(['e.convoy_peewit', 'e.hold_second']);
  });
});
