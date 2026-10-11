import { isoToHours, type LonLat } from '../schema';
const phases = [
  ['landing', '1941-05-20T00:00', '空降突袭', '水星行动：四处空降，守军分区抵抗', [24.62,35.23], 1],
  ['maleme', '1941-05-21T18:00', '马莱迈转折', '机场争夺与空运增援改变西部力量对比', [23.86,35.51], 3],
  ['west', '1941-05-24T12:00', '西部战线东移', '加拉塔斯争夺，干尼亚与苏达湾受压', [24.02,35.49], 2.5],
  ['retreat', '1941-05-27T12:00', '撤向南岸', '后卫战掩护穿越白山，海军分批撤离', [24.16,35.31], 1.8],
  ['aftermath', '1941-06-01T00:00', '撤离结束', '最后一夜撤运结束，留岛部队投降或转入抵抗', [24.62,35.23], 1],
] as const;
export const OVERVIEW_CENTER: LonLat = [24.62,35.23];
export const PHASES = phases.map((p,i) => ({id:p[0],from:isoToHours(p[1]),to:i+1<phases.length?isoToHours(phases[i+1][1]):isoToHours('1941-06-01T23:59')+1/60,name:`第${i+1}阶段 · ${p[2]}`,short:p[2],sub:p[3],center:[...p[4]] as LonLat,zoom:p[5]}));
export const phaseAt=(t:number)=>PHASES.find(p=>t>=p.from&&t<p.to)??PHASES[PHASES.length-1];
