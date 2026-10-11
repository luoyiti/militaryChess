/** 引擎边界：引擎不认识任何具体战役；所有战役常量经运行时上下文注入（boot → initCampaign …）。 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const engineFiles = walk(join(ROOT, 'engine')).filter((f) => /\.(ts|css)$/.test(f));
const rel = (f: string) => relative(ROOT, f);
const importsOf = (src: string) => [...src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2] ?? m[3]);
const campaignIds = readdirSync(join(ROOT, 'campaigns'));

describe('引擎边界', () => {
  it('不静态引用战役配置（config/*.json）或战役包（campaigns/**）', () => {
    const bad = engineFiles.flatMap((f) => importsOf(readFileSync(f, 'utf8')).filter((s) => /(^|\/)config\/[^/]+\.json$|(^|\/)campaigns\//.test(s)).map((s) => `${rel(f)} → ${s}`));
    expect(bad).toEqual([]);
  });

  it('zod 只出现在 engine/schema/（离线校验，不进入浏览器包）', () => {
    const bad = engineFiles.filter((f) => !rel(f).startsWith('engine/schema/') && importsOf(readFileSync(f, 'utf8')).includes('zod')).map(rel);
    expect(bad).toEqual([]);
  });

  it('源码里不出现具体战役 id', () => {
    const bad = engineFiles.flatMap((f) => { const src = readFileSync(f, 'utf8'); return campaignIds.filter((id) => src.includes(id)).map((id) => `${rel(f)}: ${id}`); });
    expect(bad).toEqual([]);
  });

  it('没有战役上下文时导入全部引擎模块不抛错（取值都在初始化之后）', async () => {
    const mods = engineFiles.filter((f) => f.endsWith('.ts') && !f.endsWith('.worker.ts') && !f.endsWith('.d.ts'));
    const failed: string[] = [];
    for (const f of mods) {
      try { await import(f); } catch (e) { failed.push(`${rel(f)}: ${(e as Error).message}`); }
    }
    expect(failed).toEqual([]);
  });
});
