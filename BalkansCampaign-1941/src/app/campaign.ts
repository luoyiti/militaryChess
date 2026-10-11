import { isoToHours, type LonLat } from '../schema';

export interface Chapter { id: string; from: number; to: number; name: string; short: string; sub: string; center: LonLat; zoom: number }
const chapters = [
  ['invasion', '1940-10-28T00:00', '意军入侵与希军阻击', '希意开战', '伊庇鲁斯与品都斯：山地阻击使意军攻势受挫', [20.5, 40.0], 2.9],
  ['counterattack', '1940-11-14T00:00', '希军反攻阿尔巴尼亚', '希军反攻', '沿海、中央与科尔察三路反攻，战线北移', [20.2, 40.4], 3.0],
  ['winter', '1941-01-11T00:00', '冬季攻防与春季攻势', '冬季与集结', '冬季阵地战、意军春季攻势与英德两方集结', [21.1, 41.1], 2.0],
  ['invasion1941', '1941-04-06T00:00', '轴心国多路入侵', '大陆入侵', '南斯拉夫与希腊同时遭到进攻，防线被多轴突破', [21.4, 43.2], 1.4],
  ['evacuation', '1941-04-18T00:00', '希腊撤退与克里特备战', '撤退与备战', '西部希军分批投降，英联邦向南撤离并转移至克里特', [23.1, 38.0], 2.2],
  ['crete', '1941-05-20T00:00', '克里特空降与撤离', '克里特', '马莱迈、干尼亚、雷西姆诺、伊拉克利翁四个战区', [24.65, 35.23], 6.8],
] as const;
export const PHASES: Chapter[] = chapters.map((c, i) => ({ id: c[0], from: isoToHours(c[1]), to: i + 1 < chapters.length ? isoToHours(chapters[i + 1][1]) : isoToHours('1941-06-01T23:59') + 1 / 60, name: `第${i + 1}章 · ${c[2]}`, short: c[3], sub: c[4], center: [...c[5]] as LonLat, zoom: c[6] }));
export const phaseAt = (t: number) => PHASES.find((p) => t >= p.from && t < p.to) ?? (t < 0 ? PHASES[0] : PHASES[PHASES.length - 1]);
export const YUGOSLAVIA_ACTIVE_FROM = isoToHours('1941-04-06T00:00');
export const OVERVIEW_CENTER: LonLat = [21.0, 41.25];
