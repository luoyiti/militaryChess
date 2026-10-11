/**
 * 一键 parity：状态导出对比 +（可选）截图对比。
 *   npm run parity -- <campaignId> [--url http://127.0.0.1:5180/campaigns/<id>/]
 * 需要 .baselines/<旧目录>/state.json 与 shots/（M0 生成）。旧目录名见 campaigns/<id>/parity.accepted.json 的 legacy 字段。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, campaignDir } from '../lib/campaign-node';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id) throw new Error('usage: npm run parity -- <campaignId> [--url <campaign page url>]');
const accPath = join(campaignDir(id), 'parity.accepted.json');
const acc = existsSync(accPath) ? JSON.parse(readFileSync(accPath, 'utf8')) : {};
if (!acc.legacy) throw new Error(`${accPath} 缺少 legacy 字段（旧版目录名）`);
const base = join(ROOT, '.baselines', acc.legacy);
const work = join(ROOT, '.work/parity', id);
const run = (cmd: string, a: string[]) => execFileSync(cmd, a, { cwd: ROOT, stdio: 'inherit' });

run('npx', ['tsx', 'tools/parity/dump-new.ts', id, join(base, 'state.json'), join(work, 'state.json')]);
run('npx', ['tsx', 'tools/parity/compare.ts', join(base, 'state.json'), join(work, 'state.json'), accPath]);
const ui = args.indexOf('--url');
if (ui > 0) {
  run('node', ['tools/parity/capture.mjs', '--url', args[ui + 1], '--state', join(base, 'state.json'), '--out', join(work, 'shots'), '--hide', '.tb-back']);
  run('node', ['tools/parity/diff-shots.mjs', join(base, 'shots'), join(work, 'shots'), join(work, 'diff'), '--threshold', String(acc.threshold ?? 0.02), ...(acc.skip?.length ? ['--skip', acc.skip.join(',')] : [])]);
  console.log(`报告：${join(work, 'diff/report.html')}`);
}
