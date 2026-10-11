/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDB } from '../../src/data/db';
import { cameraViewport, eventCameraFrame, frameBounds, frameFocus, theatreFit, type CameraFrame } from '../../src/app/camera';
import { project, unproject } from '../../src/geo/frame';
import { Director } from '../../src/app/director';
import { store } from '../../src/app/store';
import { clock } from '../../src/app/clock';
import { audio } from '../../src/audio/audio';
import type { MapView } from '../../src/map2d/MapView';
import type { EventCard } from '../../src/ui/eventCard';
import type { FxLayer } from '../../src/map2d/fx';
import type { DynamicLayers } from '../../src/map2d/dynamicLayers';

const db = getDB();
const event = (id: string) => db.events.find((e) => e.id === id)!;

describe('事件战区镜头', () => {
  it('北方空袭覆盖挪威、丹麦与英格兰东北的出击和拦截来路', () => {
    const frame = eventCameraFrame(db, event('e.northern_raids'));
    for (const id of ['sola', 'aalborg_west', 'newcastle', 'driffield']) {
      expect(frame.points).toContainEqual(db.gaz.get(id)!.pos);
    }
    const center = unproject(frameBounds(frame).center);
    expect(center[1]).toBeGreaterThan(55);
    expect(center[0]).toBeGreaterThan(0);
  });

  it('另一日期的相同编队航线不会把南岸事件拉到北方', () => {
    const frame = eventCameraFrame(db, event('e.airfields_crisis'));
    expect(frame.points).not.toContainEqual(db.gaz.get('sola')!.pos);
    expect(Math.max(...frame.points.map((p) => p[1]))).toBeLessThan(53);
  });

  it.each([
    { width: 1440, height: 960, insets: { left: 358, right: 420, top: 70, bottom: 150 } },
    { width: 768, height: 1024, insets: { left: 30, right: 344, top: 70, bottom: 150 } },
  ])('完整航线落在 $width 宽视图的可见区域，2D/3D 使用同一中心', ({ width, height, insets }) => {
    const frame = eventCameraFrame(db, event('e.northern_raids'));
    const viewport = cameraViewport(width, height, insets);
    const fitK = theatreFit(viewport);
    const focus = frameFocus(frame, viewport, fitK);
    const center = project(focus.ll), bounds = frameBounds(frame);
    expect(center[0]).toBeCloseTo(bounds.center[0], 6);
    expect(center[1]).toBeCloseTo(bounds.center[1], 6);
    for (const p of frame.points.map(project)) {
      expect(Math.abs(p[0] - center[0]) * fitK * focus.relZoom).toBeLessThan(viewport.width / 2);
      expect(Math.abs(p[1] - center[1]) * fitK * focus.relZoom).toBeLessThan(viewport.height / 2);
    }
  });

  it('驻留后的战略镜头保留同一北方战区并稍微拉远', () => {
    const close = eventCameraFrame(db, event('e.northern_raids'));
    const context = eventCameraFrame(db, event('e.northern_raids'), true);
    expect(context.points).toEqual(close.points);
    expect(context.maxZoom).toBeLessThan(close.maxZoom);
    expect(unproject(frameBounds(context).center)[1]).toBeGreaterThan(55);
  });
});

describe('导演镜头交接', () => {
  afterEach(() => {
    clock.release();
    store.set({ playing: false, mode: '2d', selectedEvent: null, selectedUnit: null, followUnit: false });
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  });

  async function setup(mode: '2d' | '3d' = '2d') {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    vi.spyOn(audio, 'play').mockImplementation(() => undefined);
    const e = event('e.northern_raids');
    store.set({ t: e.h, playing: true, director: true, mode, selectedEvent: null });
    await Promise.resolve();
    const frames: CameraFrame[] = [];
    let manual = () => {};
    const map = { onManual(fn: () => void) { manual = fn; }, flyToFrame(frame: CameraFrame) { frames.push(frame); } } as unknown as MapView;
    const card = { show() {}, dwellMs: () => 0 } as unknown as EventCard;
    const fx = { planesTo() {}, planesAlong() {}, clear() {}, burst() {} } as unknown as FxLayer;
    const director = new Director(db, map, card, fx, {} as DynamicLayers);
    director.onCamera3D = (frame) => { frames.push(frame); };
    return { director, frames, manual, e };
  }

  it.each(['2d', '3d'] as const)('%s 驻留结束后仍回到北方空袭的来路', async (mode) => {
    const { director, frames, e } = await setup(mode);
    director.present(e, true);
    await Promise.resolve();
    vi.advanceTimersByTime(15300);
    expect(frames).toHaveLength(2);
    expect(frames[1]).toEqual(director.frameFor(e, true));
  });

  it('手动拖动取消旧的自动回归，下一个提示可以重新编排', async () => {
    const { director, frames, manual, e } = await setup();
    director.present(e, true);
    await Promise.resolve();
    manual();
    vi.advanceTimersByTime(15300);
    expect(frames).toHaveLength(1);
    const next = event('e.hardest_day');
    director.present(next, false);
    expect(frames[1]).toEqual(director.frameFor(next));
  });

  it('视图切换重新使用当前选中事件的战区范围', async () => {
    const { director, frames, e } = await setup();
    director.present(e, false);
    await Promise.resolve();
    store.set({ mode: '3d' });
    director.reframe();
    expect(frames[1]).toEqual(frames[0]);
  });
});
