/** 拉普拉塔河口海战：史实约束（九艘商船、交战时刻与命中、自沉的时钟）与海战数据的完整性。 */
import { describe, expect, it } from 'vitest';
import { isoToHours, paceAt, timeToU } from '../../../engine/core/time';
import { unitStateAt } from '../../../engine/model/core';
import { damageAt, engagementsAt, distanceKm, rangeLabel } from '../../../engine/naval/model';
import { openCampaign } from '../../../tests/helpers';

const { db, m } = openCampaign('river-plate-1939');
const H = isoToHours;
const at = (id: string, iso: string) => unitStateAt(id, db.units, H(iso))!;

describe('拉普拉塔河口海战', () => {
  it('叙事时钟为英方舰钟 UTC−2，交战的 82 分钟放慢到逐分钟', () => {
    expect(m.time.utcOffset).toBe(-2);
    expect(paceAt(H('1939-12-13T06:30'))).toBeLessThan(0.05);
    expect(paceAt(H('1939-10-15T00:00'))).toBeGreaterThan(5);
    // 交战两小时在时间轴上占的宽度不少于十周航程的十分之一
    expect(timeToU(H('1939-12-13T07:50')) - timeToU(H('1939-12-13T05:45'))).toBeGreaterThan(0.1);
  });

  it('九艘英国商船在 12 月 7 日前全部被击沉，无一在 13 日后出现', () => {
    const merchants = db.unitList.filter((u) => u.parent === 'gb.mn');
    expect(merchants).toHaveLength(9);
    for (const u of merchants) {
      expect(at(u.id, '1939-12-08T00:00').status).toBe('destroyed');
      expect(u.ship?.tonnageKind).toBe('grt');
    }
    expect(merchants.reduce((s, u) => s + (u.ship?.tonnage ?? 0), 0)).toBe(50089);
  });

  it('05:20 的编队位置符合哈伍德战报（34°34′S 49°17′W），06:18 开火时距离约 19,800 码', () => {
    const aj = at('gb.ajax', '1939-12-13T05:20');
    expect(distanceKm(aj.ll, [-49.2833, -34.5667])).toBeLessThan(2);
    const e = engagementsAt(db.naval, db.units, H('1939-12-13T06:19')).find((x) => x.fire.shooter === 'de.graf_spee' && x.fire.target === 'gb.exeter');
    expect(e).toBeTruthy();
    expect(e!.km).toBeGreaterThan(15);
    expect(e!.km).toBeLessThan(22);
    expect(rangeLabel(e!.km, 'yd')).toMatch(/码$/);
  });

  it('埃克塞特号 06:38 失去 A、B 炮塔，07:30 主炮全部失效；阿贾克斯号 07:25 失去 X、Y', () => {
    expect([...damageAt(db.naval, 'gb.exeter', H('1939-12-13T06:39')).gunsOut].sort()).toEqual(['A', 'B']);
    expect(damageAt(db.naval, 'gb.exeter', H('1939-12-13T07:31')).gunsOut.has('Y')).toBe(true);
    expect([...damageAt(db.naval, 'gb.ajax', H('1939-12-13T07:26')).gunsOut].sort()).toEqual(['X', 'Y']);
    // 交战双方只在白昼战斗与零星的尾随交火中射击
    for (const f of db.naval.fire) expect(f.h0 >= H('1939-12-13T06:17') && f.h1 <= H('1939-12-13T21:45')).toBe(true);
  });

  it('施佩伯爵号 14–17 日停泊蒙得维的亚外锚地，17 日 20:54（当地 19:54）自沉，早于 20:00 当地时间的最后期限', () => {
    for (const t of ['1939-12-14T12:00', '1939-12-16T12:00', '1939-12-17T18:00']) {
      expect(distanceKm(at('de.graf_spee', t).ll, [-56.215, -34.925])).toBeLessThan(1);
    }
    expect(at('de.graf_spee', '1939-12-17T20:50').status).not.toBe('destroyed');
    expect(at('de.graf_spee', '1939-12-17T20:55').status).toBe('destroyed');
    // 舰钟 20:54 = UTC 22:54 = 蒙得维的亚 19:54，早于当地 20:00
    expect(H('1939-12-17T20:54') + 2 - 3).toBeLessThan(H('1939-12-17T20:00'));
    const scuttle = db.events.find((e) => e.id === 'e.scuttle')!;
    expect(scuttle.body).toContain('19:54');
  });

  it('电文、射击与命中引用的舰船都存在且有舰船档案', () => {
    const n = db.naval;
    for (const f of n.fire) for (const id of [f.shooter, f.target]) expect(db.units.get(id)?.ship, id).toBeTruthy();
    for (const h of n.hits) expect(db.units.get(h.target)?.ship).toBeTruthy();
    expect(n.signals.length).toBeGreaterThanOrEqual(30);
    expect(n.signals.some((s) => s.text === 'I think it is a pocket battleship.')).toBe(true);
  });
});
