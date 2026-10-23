/** 莫斯科保卫战 · 控制区独立审计（只读，作为审查与回归的共同基准）。
 *
 *  npx tsx campaigns/moscow-1941/pipeline/audit-control.ts
 *
 * 用浏览器同一 SDF 场（engine/geo/field）判定「给定时刻某城归谁」，与已核实的史实断言对照。
 * 断言的每条都注明依据；发现不符即退出码 1。日期为莫斯科时间（UTC+3）。
 *
 * 史实来源：俄文维基各城市条目（逐条核对占领/收复日期）、CMH《Moscow to Stalingrad》第 2—5 章、
 * 本战役 pipeline/research.json 的 sourceReadings。凡口径有分歧者，取多数来源并在注释写明。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCampaign, publicDir } from '../../../tools/lib/campaign-node';
import { buildDB } from '../../../engine/data/db';
import { store } from '../../../engine/app/store';
import { createModel, fieldAt, sample, theaterAt, type KFInput } from '../../../engine/geo/field/field';
import { fieldCfg, toGrid } from '../../../engine/geo/field/client';
import { FRAME, GRID } from '../../../engine/geo/frame';
import { initCampaign } from '../../../engine/campaign/context';
import { initFrame } from '../../../engine/geo/frame';
import { initPhases } from '../../../engine/core/phases';
import { initTime, isoToHours } from '../../../engine/core/time';
import { resolvePos } from '../../../engine/model/core';

const def = loadCampaign('moscow-1941');
initCampaign(def);
initTime(def.manifest.time);
initFrame(def.frame);
initPhases(def.manifest.phases);
store.init(def.manifest, def.manifest.ui.extraLayers ?? []);
const db = buildDB(def.data, def.manifest);

const masks = new Uint8Array(readFileSync(join(publicDir('moscow-1941'), 'geo/field_masks.bin')));
const grid = { w: GRID.w, h: GRID.h, cell: GRID.cell };
const kfs: KFInput[] = db.keyframes.map((k) => ({
  h: k.h,
  a: k.a.map((poly) => poly.map((ring) => ring.map(toGrid))),
  b: k.b.map((poly) => poly.map((ring) => ring.map(toGrid))),
  ...(k.transition ? { transition: k.transition } : {}),
}));
const model = createModel(grid, masks, kfs,
  Math.ceil(FRAME.field.clampKm / (FRAME.kmPerUnit * GRID.cell)), fieldCfg(def.manifest.control));

function holder(placeId: string, at: string): 'DE' | 'SU' | 'out' {
  const ll = resolvePos(`@${placeId}`, db.gaz);
  const h = isoToHours(at);
  const [gx, gy] = toGrid(ll);
  if (sample(theaterAt(model, h), grid, gx, gy) >= 0) return 'out';
  return sample(fieldAt(model, h, 0), grid, gx, gy) < 0 ? 'DE' : 'SU';
}

type Row = [place: string, at: string, want: 'DE' | 'SU', basis: string];
const ROWS: Row[] = [
  // —— 莫斯科：全程苏方 ——
  ['moscow', '1941-10-01T12:00', 'SU', '未被攻占'],
  ['moscow', '1941-11-30T12:00', 'SU', '未被攻占'],
  ['moscow', '1941-12-05T12:00', 'SU', '未被攻占'],
  ['moscow', '1942-01-31T12:00', 'SU', '未被攻占'],
  // —— 图拉：围攻但未陷 ——
  ['tula', '1941-10-30T12:00', 'SU', '10-30 起围攻，城未陷'],
  ['tula', '1941-11-15T12:00', 'SU', '同上'],
  ['tula', '1941-12-05T12:00', 'SU', '同上'],
  // —— 中西段：莫扎伊斯克防线四城 ——
  ['volokolamsk', '1941-10-24T12:00', 'SU', '10-27 才失守'],
  ['volokolamsk', '1941-11-20T12:00', 'DE', '10-27 至 12-20 被占'],
  ['volokolamsk', '1942-01-31T12:00', 'SU', '12-20 收复'],
  ['mozhaisk', '1941-10-16T12:00', 'SU', '10-18 失守'],
  ['mozhaisk', '1941-11-20T12:00', 'DE', '10-18 至 1942-01-20'],
  ['mozhaisk', '1942-01-31T12:00', 'SU', '1942-01-20 收复'],
  ['maloyaroslavets', '1941-11-30T12:00', 'DE', '10-18 至 1942-01-02'],
  ['maloyaroslavets', '1942-01-31T12:00', 'SU', '1942-01-02 收复'],
  ['naro_fominsk', '1941-11-21T12:00', 'SU', '10-22 夺西半，12-01 前未全占'],
  ['naro_fominsk', '1941-12-05T12:00', 'DE', '12-01 失守'],
  ['naro_fominsk', '1942-01-31T12:00', 'SU', '12-26 收复'],
  // —— 北段 ——
  ['kalinin', '1941-11-20T12:00', 'DE', '10-14 至 12-16'],
  ['kalinin', '1942-01-31T12:00', 'SU', '12-16 收复'],
  ['klin', '1941-11-25T12:00', 'DE', '11-23 至 12-15'],
  ['klin', '1942-01-31T12:00', 'SU', '12-15 收复'],
  ['solnechnogorsk', '1941-11-25T12:00', 'DE', '11-22 至 12-12'],
  ['solnechnogorsk', '1942-01-31T12:00', 'SU', '12-12 收复'],
  ['istra', '1941-11-30T12:00', 'DE', '11-26 至 12-10 被占'],
  ['istra', '1941-12-05T12:00', 'DE', '同上'],
  ['istra', '1941-12-20T12:00', 'SU', '12-10 收复'],
  ['dmitrov', '1941-12-01T12:00', 'SU', '全程未被占领'],
  ['dmitrov', '1942-01-31T12:00', 'SU', '同上'],
  ['yakhroma', '1941-11-28T12:00', 'DE', '11-28—29 运河东岸桥头'],
  ['yakhroma', '1941-12-05T12:00', 'DE', '11-28 被占，桥头据守至 12-07 收复（俄文维基：7 декабря освобождён）'],
  ['krasnaya_polyana', '1941-11-30T12:00', 'DE', '11 月末被占（距城约 27 km）'],
  ['krasnaya_polyana', '1941-12-05T12:00', 'DE', '同上'],
  ['sergiyev_posad', '1941-11-28T12:00', 'SU', '未被占领'],
  ['torzhok', '1941-10-20T12:00', 'SU', '未被占领'],
  ['torzhok', '1942-01-31T12:00', 'SU', '未被占领'],
  // —— 南段 ——
  ['kaluga', '1941-11-20T12:00', 'DE', '10-12 至 12-30'],
  ['kaluga', '1942-01-31T12:00', 'SU', '12-30 收复'],
  ['aleksin', '1941-11-20T12:00', 'DE', '11 月被占（12-17 收复）'],
  ['serpukhov', '1941-11-30T12:00', 'SU', '未被占领'],
  ['kashira', '1941-11-30T12:00', 'SU', '未被占领'],
  ['kolomna', '1941-11-30T12:00', 'SU', '未被占领'],
  ['ryazan', '1942-01-31T12:00', 'SU', '未被占领'],
  ['venyov', '1941-11-30T12:00', 'DE', '11-24 被占两周，12-09 由别洛夫第 1 近卫骑兵军收复（俄文维基「Венёв」：Две недели город находился в оккупации）'],
  ['yefremov', '1941-11-25T12:00', 'DE', '11-20 被占（18 装甲师）'],
  ['livny', '1941-11-30T12:00', 'DE', '11-26 被第 2 集团军占领，12 月收复（俄文维基「莫斯科战役」：26 ноября немцы захватили Ливны）'],
  ['yelets', '1941-11-20T12:00', 'SU', '12-03 才被占'],
  ['yelets', '1941-12-05T12:00', 'DE', '12-04 被占（俄文维基「莫斯科战役」：4 декабря…город Елец）'],
  ['yelets', '1941-12-20T12:00', 'SU', '12-09 收复'],
  ['kozelsk', '1941-12-20T12:00', 'DE', '10-08 至 12-28'],
  ['kozelsk', '1942-01-31T12:00', 'SU', '12-28 收复'],
  ['belyov', '1941-12-20T12:00', 'DE', '10-24 至 12-31'],
  ['belyov', '1942-01-31T12:00', 'SU', '12-31 收复'],
  ['sukhinichi', '1941-12-20T12:00', 'DE', '1 月上旬被围，01-29 收复'],
  ['sukhinichi', '1942-01-31T12:00', 'SU', '01-29 收复'],
  // —— 深远后方：全程德占 ——
  ['vyazma', '1941-11-20T12:00', 'DE', '10-13 失守，1943-03 才收复'],
  ['vyazma', '1942-01-31T12:00', 'DE', '同上'],
  ['bryansk', '1941-11-20T12:00', 'DE', '10-06 失守，1943-09 才收复'],
  ['bryansk', '1942-01-31T12:00', 'DE', '同上'],
  ['orel', '1941-10-10T12:00', 'DE', '10-03 失守'],
  ['orel', '1942-01-31T12:00', 'DE', '1943-08 才收复'],
  ['mtsensk', '1941-11-20T12:00', 'DE', '10-11 失守，1943-07-20 才收复'],
  ['mtsensk', '1941-12-20T12:00', 'DE', '同上'],
  ['rzhev', '1942-01-31T12:00', 'DE', '1943-03 才收复'],
  ['gzhatsk', '1941-10-12T12:00', 'DE', '10-09 失守，1943-03 才收复'],
  ['gzhatsk', '1942-01-31T12:00', 'DE', '1943-03 才收复'],
  ['yukhnov', '1941-11-20T12:00', 'DE', '10 月上旬失守'],
  ['kholm_zhirkovsky', '1942-01-15T12:00', 'DE', '突出部走廊，未被围歼'],
  ['smolensk', '1941-12-02T12:00', 'DE', '7 月即被占'],
  // —— 反攻收复 ——
  ['toropets', '1942-01-31T12:00', 'SU', '01-21 由第 4 突击军收复'],
];

let fail = 0;
const fails: Row[] = [];
for (const [p, at, want, basis] of ROWS) {
  if (!db.gaz.has(p)) { console.log(`? 缺少地名 ${p}`); fail++; fails.push([p, at, want, basis]); continue; }
  const got = holder(p, at);
  if (got !== want) { fail++; fails.push([p, at, want, basis]); console.log(`✗ ${p.padEnd(19)} ${at}  期望 ${want} 实得 ${got}   (${basis})`); }
}
console.log(`\n控制区审计：${ROWS.length - fail}/${ROWS.length} 通过`);
if (fails.length) {
  console.log('\n失败清单：');
  for (const [p, at, want, basis] of fails) console.log(`  ${p} @ ${at} 期望 ${want} — ${basis}`);
}
process.exit(fail ? 1 : 0);
