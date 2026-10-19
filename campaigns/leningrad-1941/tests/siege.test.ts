import { describe, expect, it } from 'vitest';
import { latestAt, reconcileLayers, siegeAt, transportAt, type LogisticsRoute } from '../plugins/siege/model';
import mapWindowsJson from '../data/ext/siege/map-windows.json';

const mapWindows = mapWindowsJson as LogisticsRoute[];

const routes: LogisticsRoute[] = [
  { id: 'water', key: 'siegeWaterVisible', label: '水运', segments: [{ from: '1942-12-13T00:00', until: '1943-01-09T00:00', state: 'restricted', note: '冰区军事运输', sources: ['test'] }] },
  { id: 'ice', key: 'siegeIceVisible', label: '冰道', segments: [{ from: '1942-12-24T00:00', until: '1943-03-30T00:00', state: 'regular', note: '汽车货运', sources: ['test'] }] },
  { id: 'rail', key: 'siegeRailVisible', label: '铁路', segments: [{ from: '1943-02-07T00:00', state: 'regular', note: '仍受炮击', sources: ['test'] }] },
];

describe('列宁格勒围城生活的时间规则', () => {
  it('实际地图区分长短水运线，1941年不画1942年启用的短线', () => {
    const long = mapWindows.find((r) => r.key === 'siegeWaterLongVisible')!;
    const short = mapWindows.find((r) => r.key === 'siegeWaterShortVisible')!;
    expect(transportAt(long, '1941-09-12T12:00')).toBeDefined();
    expect(transportAt(short, '1941-09-12T12:00')).toBeUndefined();
    expect(transportAt(short, '1942-05-23T12:00')).toBeDefined();
    expect(transportAt(long, '1942-05-23T12:00')).toBeUndefined();
    expect(transportAt(long, '1942-05-28T12:00')).toBeDefined();
    expect(transportAt(long, '1942-12-25T12:00')).toBeUndefined();
    expect(transportAt(short, '1942-12-25T12:00')?.state).toBe('restricted');
    expect(transportAt(short, '1943-04-02T12:00')?.state).toBe('restricted');
    expect(transportAt(long, '1943-04-26T12:00')).toBeUndefined();
    expect(transportAt(short, '1943-12-15T12:00')?.state).toBe('uncertain');
  });
  it('战略前奏不计围城天数；首尾计入且解围后固定为872天', () => {
    expect(siegeAt('1941-06-22T00:00')).toMatchObject({ stage: 'prelude', day: null });
    expect(siegeAt('1941-09-08T00:00')).toMatchObject({ stage: 'closed', day: 1 });
    expect(siegeAt('1943-01-18T12:00').stage).toBe('corridor');
    expect(siegeAt('1944-01-27T00:00')).toMatchObject({ stage: 'lifted', day: 872 });
    expect(siegeAt('1944-01-31T23:59').day).toBe(872);
  });
  it('配给按已生效的记录切换，不插值、不预取未来标准，允许向后跳转', () => {
    const rations = [{ from: '1941-07-18T00:00', workers: 800 }, { from: '1941-11-20T00:00', workers: 250 }];
    expect(latestAt(rations, '1941-06-22T12:00')).toBeUndefined();
    expect(latestAt(rations, '1941-11-20T12:00')?.workers).toBe(250);
    expect(latestAt(rations, '1941-09-08T12:00')?.workers).toBe(800);
  });
  it('水运和冰运可重叠，铁路不提前出现，结束边界不包含在窗口内', () => {
    expect(transportAt(routes[0], '1942-12-25T12:00')?.state).toBe('restricted');
    expect(transportAt(routes[1], '1942-12-25T12:00')?.state).toBe('regular');
    expect(transportAt(routes[2], '1942-12-25T12:00')).toBeUndefined();
    expect(transportAt(routes[0], '1943-01-09T00:00')).toBeUndefined();
    expect(transportAt(routes[2], '1943-02-07T00:00')?.note).toBe('仍受炮击');
  });
  it('仅更新内部可见位，用户关闭图层后跳时或切模式均不会重新打开', () => {
    const initial = { logistics: true, units: true, siegeRailVisible: false };
    const winter = reconcileLayers(initial, routes, '1942-12-25T12:00', 'time')!;
    expect(winter).toMatchObject({ logistics: true, units: true, siegeWaterVisible: true, siegeIceVisible: true, siegeRailVisible: false });
    expect(reconcileLayers(winter, routes, '1942-12-25T12:00', 'time')).toBeUndefined();
    const disabled = reconcileLayers({ ...winter, logistics: false }, routes, '1943-02-10T12:00', 'history')!;
    expect(disabled).toMatchObject({ logistics: false, units: true, siegeWaterVisible: false, siegeIceVisible: false, siegeRailVisible: false });
    expect(reconcileLayers(disabled, routes, '1944-01-27T12:00', 'time')).toBeUndefined();
    const restored = reconcileLayers({ ...disabled, logistics: true }, routes, '1943-02-10T12:00', 'time')!;
    expect(restored.siegeRailVisible).toBe(true);
    expect(restored.siegeWaterVisible).toBe(false);
  });
});
