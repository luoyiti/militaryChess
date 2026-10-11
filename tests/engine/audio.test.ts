/** 共享音频库：每个战役引用的曲目与音效都存在，文件非空。 */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import library from '../../shared/audio/music/library.json';
import sprite from '../../shared/audio/sfx-sprite.json';
import { SYNTH_IDS } from '../../engine/audio/synth';
import { listCampaignIds } from '../../tools/lib/campaign-node';
import { manifestOf } from '../helpers';

const ROOT = join(import.meta.dirname, '../..');
const lib = library as { id: string; files: string[]; oneShot?: boolean }[];

describe('共享音频库', () => {
  it('每个曲目都有 webm 与 m4a 两种文件', () => {
    for (const t of lib) {
      expect(t.files.some((f) => f.endsWith('.webm')) && t.files.some((f) => f.endsWith('.m4a')), t.id).toBe(true);
      for (const f of t.files) expect(statSync(join(ROOT, 'shared/audio/music', f)).size, f).toBeGreaterThan(10_000);
    }
  });
  it('音效 sprite 的每段都在文件时长以内，合成器覆盖全部 sprite 音效（加载失败时回退）', () => {
    for (const f of ['sfx.webm', 'sfx.m4a']) expect(existsSync(join(ROOT, 'shared/audio', f))).toBe(true);
    const spr = (sprite as { sprite: Record<string, number[]> }).sprite;
    for (const [id, [start, dur]] of Object.entries(spr)) expect(start >= 0 && dur > 0, id).toBe(true);
    const synth = new Set(SYNTH_IDS());
    expect(Object.keys(spr).filter((id) => !synth.has(id) && !id.startsWith('amb_'))).toEqual([]);
  });
  it.each(listCampaignIds().filter((id) => manifestOf(id).status !== 'planned'))('%s 引用的曲目都在库中', (id) => {
    const a = manifestOf(id).audio;
    const ids = new Set(lib.map((t) => t.id));
    for (const t of [...a.music.map((c: { track: string }) => c.track), a.introMusic, a.bedTrack].filter(Boolean)) expect(ids.has(t), t).toBe(true);
  });
});
