import { describe, expect, it } from 'vitest';
import { openCampaign } from '../../../tests/helpers';
import type { EvidenceNote, LogisticsRoute, MilitaryStatistics } from '../plugins/siege/model';

describe('列宁格勒扩展数据的集成契约', () => {
  const { db, m } = openCampaign('leningrad-1941');
  const ext = db.ext.siege;
  const notes = [...ext.notes as EvidenceNote[], ...ext['military-notes'] as EvidenceNote[]];

  it('所有深入阅读都对应真实事件，引用已登记并属于该事件的来源', () => {
    expect(notes).toHaveLength(45);
    expect(new Set(notes.map((n) => n.eventId)).size).toBe(notes.length);
    for (const note of notes) {
      const event = db.events.find((e) => e.id === note.eventId);
      expect(event, note.eventId).toBeDefined();
      expect(note.paragraphs.length).toBeGreaterThanOrEqual(2);
      for (const id of note.sources) {
        expect(db.sources.has(id), id).toBe(true);
        expect(event!.sources, note.eventId).toContain(id);
      }
    }
  });

  it('独立地图航线有已注册的图层和来源，时效窗口有序且不相互覆盖', () => {
    const keys = new Set(m.ui.extraLayers?.map((layer) => layer.key));
    const routes = ext['map-windows'] as LogisticsRoute[];
    expect(routes).toHaveLength(2);
    for (const route of routes) {
      expect(keys.has(route.key), route.key).toBe(true);
      expect(db.overlays.some((overlay) => overlay.layer === route.key), route.key).toBe(true);
      route.segments.forEach((segment, i) => {
        expect(segment.sources.length).toBeGreaterThan(0);
        for (const id of segment.sources) expect(db.sources.has(id), id).toBe(true);
        if (segment.until) expect(segment.until > segment.from).toBe(true);
        if (i > 0) expect(route.segments[i - 1].until! <= segment.from).toBe(true);
      });
    }
  });

  it('火花数字是1月12—30日的苏方统计，原始减员分类与参战范围不混同', () => {
    const [stat] = ext.statistics as MilitaryStatistics[];
    expect(stat.period).toBe('1943年1月12—30日');
    expect(stat.eventId).toBe('e.iskra_linkup');
    expect(stat.rows[2]).toMatchObject({ initial: 302800, irrecoverable: 33940, sanitary: 81142 });
    for (const key of ['initial', 'irrecoverable', 'sanitary'] as const) expect(stat.rows[0][key] + stat.rows[1][key]).toBe(stat.rows[2][key]);
    expect(stat.rows[2].irrecoverable + stat.rows[2].sanitary).toBe(115082);
    expect(stat.scope).toContain('不是两个方面军的全部兵力');
    expect(stat.definition).toContain('失踪、被俘');
    expect(db.forces.byPhase?.iskra.SU.men).toBe(302800);
    for (const id of stat.sources) expect(db.sources.has(id), id).toBe(true);
  });
});
