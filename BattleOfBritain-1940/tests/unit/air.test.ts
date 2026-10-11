import { describe, it, expect } from 'vitest';
import { ISO, Unit, AirKeyframe, isoToHours } from '../../src/schema';
import { resolveUnits, trackAt, buildGazetteer, routeOpacity } from '../../src/model/core';
import { createAirModel, frontGeometry } from '../../src/geo/field/field';

describe('空战时间与轨迹', () => {
  it('英国战役时间可解析，非法日历时间被拒绝', () => {
    expect(ISO.safeParse('1940-07-10T00:00').success).toBe(true);
    expect(isoToHours('1940-07-10T00:00')).toBe(0);
    expect(isoToHours('1940-07-11T00:00')).toBe(24);
    expect(ISO.safeParse('1940-07-32T00:00').success).toBe(false);
  });
  it('GB中队接受飞行阶段，飞机与航线用相同线性位置', () => {
    const u = Unit.parse({id:'gb.19sq',side:'GB',echelon:'squadron',type:'fighter',parent:null,
      name:{zh:'第19中队',short:'19 Sq'},model:'spitfire',sources:['raf'],confidence:'medium',
      track:[{at:'1940-07-10T12:00',pos:[0,51],flightPhase:'outbound',altitudeM:3000},
        {at:'1940-07-10T13:00',pos:[2,51],flightPhase:'returning',altitudeM:3000}]});
    const units=resolveUnits([u],buildGazetteer().gaz);
    const s=trackAt(units.get('gb.19sq')!.track,12.25)!;
    expect(s.ll[0]).toBeCloseTo(0.5);
    expect(s.flightPhase).toBe('outbound');
    expect(s.altitudeM).toBe(3000);
  });
  it('进攻与拦截范围可重叠并覆盖海域', () => {
    const poly=[[[0,50],[2,50],[2,52],[0,52]]];
    const k=AirKeyframe.parse({at:'1940-08-13T12:00',raids:[poly],interceptions:[poly],sources:['raf'],confidence:'low'});
    expect(k.raids).toEqual(k.interceptions);
  });
  it('空战距离场不依赖陆地，重叠区不会被另一方扣除', () => {
    const grid={w:32,h:32,cell:1};
    const p=[[[8,8],[24,8],[24,24],[8,24]]];
    const m=createAirModel(grid,new Uint8Array(1024),[{h:0,raids:[p],interceptions:[p]}],12);
    const g=frontGeometry(m,0);
    expect(g.fDE[16*32+16]).toBeLessThan(0);
    expect(g.fSU[16*32+16]).toBeLessThan(0);
    expect(g.fills.DE.length).toBeGreaterThan(0);
    expect(g.fills.SU.length).toBeGreaterThan(0);
    expect(g.fills.PL).toEqual([]);
  });
  it('空战任务结束后迅速淡出，全航线图层不延长任务寿命', () => {
    const r={wps:[{h:12,ll:[0,51]},{h:13,ll:[1,51]}],role:'raid',fadeHours:.25} as any;
    expect(routeOpacity(r,11)).toBe(0);
    expect(routeOpacity(r,12.5)).toBe(1);
    expect(routeOpacity(r,13.125)).toBeCloseTo(.5);
    expect(routeOpacity(r,14)).toBe(0);
  });
  it('两个驻场节点之间保持基地位置，调防不产生跨日飞行',()=>{
    const s=trackAt([{h:0,ll:[0,51],status:'active',flightPhase:'at_base',altitudeM:0},{h:72,ll:[1,52],status:'active',flightPhase:'at_base',altitudeM:0}],36)!;
    expect(s.ll).toEqual([0,51]);
    expect(s.moving).toBe(false);
  });
});
