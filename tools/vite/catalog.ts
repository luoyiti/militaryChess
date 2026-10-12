/**
 * 战役发现与目录（Node，供 vite.config.ts 与工具脚本使用）：
 *  - discoverCampaigns()：扫描 campaigns/<id>/campaign.json
 *  - campaignsPlugin()：提供 virtual:campaign-catalog（总台用的战役清单 + 构建时统计），
 *    开发时把无尾斜杠的 /campaigns/<id> 重定向到 /campaigns/<id>/
 *  - 每个战役页面内联注入总台转场幕布（shared/handoff/），从总台进入时第一帧就接上总台的推进镜头
 * 战役资源在 public/campaigns/<id>/ 下，由 Vite 自带的 public 服务与构建复制处理。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { Plugin } from 'vite';

export const ROOT = resolve(import.meta.dirname, '../..');
export const CAMPAIGNS = join(ROOT, 'campaigns');

export interface DiscoveredCampaign {
  id: string;
  dir: string;
  manifest: Record<string, any>;
  status: 'published' | 'draft' | 'planned';
  hasPage: boolean;
}

export function discoverCampaigns(): DiscoveredCampaign[] {
  if (!existsSync(CAMPAIGNS)) return [];
  return readdirSync(CAMPAIGNS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(CAMPAIGNS, d.name, 'campaign.json')))
    .map((d) => {
      const dir = join(CAMPAIGNS, d.name);
      const manifest = JSON.parse(readFileSync(join(dir, 'campaign.json'), 'utf8'));
      if (manifest.id !== d.name) throw new Error(`campaigns/${d.name}/campaign.json 的 id（${manifest.id}）须与目录名一致`);
      return { id: d.name, dir, manifest, status: manifest.status, hasPage: existsSync(join(dir, 'index.html')) };
    })
    .sort((a, b) => (a.manifest.hub?.order ?? 99) - (b.manifest.hub?.order ?? 99) || String(a.manifest.time?.start).localeCompare(String(b.manifest.time?.start)));
}

/** 本次构建/开发要编译的战役页面：published 总是；draft 仅开发；planned 只在总台显示 */
export function buildable(c: DiscoveredCampaign, dev: boolean) {
  return c.hasPage && (c.status === 'published' || (dev && c.status === 'draft'));
}

const readJson = (p: string, fb: unknown) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fb);
const listJson = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)) : []);

export function campaignStats(c: DiscoveredCampaign) {
  const data = join(c.dir, 'data');
  const units = listJson(join(data, 'oob')).reduce((n, f) => n + (readJson(f, []) as unknown[]).length, 0);
  const photos = Object.keys(readJson(join(ROOT, 'public/campaigns', c.id, 'photos/index.json'), {}) as object).length;
  return {
    units,
    events: (readJson(join(data, 'events.json'), []) as unknown[]).length,
    keyframes: listJson(join(data, 'fronts')).length,
    routes: listJson(join(data, 'routes')).reduce((n, f) => n + (readJson(f, []) as unknown[]).length, 0),
    photos,
  };
}

/** 封面照片的署名（取自战役 photos/index.json） */
function coverCredit(c: DiscoveredCampaign, src: string) {
  const index = readJson(join(ROOT, 'public/campaigns', c.id, 'photos/index.json'), {}) as Record<string, { src: string; author?: string; license?: string; caption?: string; sourceUrl?: string }>;
  const e = Object.values(index).find((p) => p.src === src);
  return e ? { caption: e.caption ?? '', author: e.author ?? '', license: e.license ?? '', url: e.sourceUrl ?? '' } : null;
}

export function catalog(dev: boolean) {
  // 草稿只在开发服务器里出现在总台；构建产物只含已发布与筹备中的战役
  return discoverCampaigns().filter((c) => dev || c.status !== 'draft').map((c) => {
    const m = c.manifest;
    const frame = readJson(join(c.dir, 'config/frame.json'), null) as { bbox?: [number, number, number, number] } | null;
    const hub = m.hub ?? {};
    return {
      id: c.id,
      status: c.status,
      playable: buildable(c, dev),
      href: `campaigns/${c.id}/`,
      title: m.title,
      time: { start: m.time.start, end: m.time.end },
      sides: (m.sides ?? []).map((s: any) => ({ id: s.id, nation: s.nation ?? s.id, name: s.name, coalition: s.coalition, color: s.css?.main ?? s.counter?.bg })),
      hub: { ...hub, theatre: hub.theatre ?? (frame?.bbox ? { bbox: frame.bbox } : undefined) },
      // 战役页面开场的地图范围：map.fit 的经纬度框，缺省为整幅画布（frame.bbox）
      view: typeof m.map?.fit === 'object' && m.map.fit.bbox ? { bbox: m.map.fit.bbox } : frame?.bbox ? { bbox: frame.bbox } : null,
      cover: hub.cover ? { src: `campaigns/${c.id}/${hub.cover}`, credit: coverCredit(c, hub.cover) } : null,
      phases: (m.phases ?? []).map((p: any) => ({ from: p.from, name: p.name })),
      stats: c.status === 'planned' ? null : campaignStats(c),
    };
  });
}
export type CatalogEntry = ReturnType<typeof catalog>[number];

const HANDOFF = join(ROOT, 'shared/handoff');

export function campaignsPlugin(): Plugin {
  const VID = 'virtual:campaign-catalog';
  let dev = true;
  return {
    name: 'campaign-catalog',
    configResolved(cfg) { dev = cfg.command === 'serve'; },
    // 战役页面：内联转场幕布的样式与脚本（第一帧之前执行，不经过打包）
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!/(^|\/)campaigns\/[a-z0-9-]+\/index\.html$/.test(ctx.path ?? ctx.filename ?? '')) return html;
        return [
          { tag: 'style', attrs: { 'data-handoff': '' }, children: readFileSync(join(HANDOFF, 'handoff.css'), 'utf8'), injectTo: 'head' },
          { tag: 'script', attrs: { 'data-handoff': '' }, children: readFileSync(join(HANDOFF, 'handoff.js'), 'utf8'), injectTo: 'body-prepend' },
        ];
      },
    },
    resolveId(id) { return id === VID ? '\0' + VID : null; },
    load(id) { return id === '\0' + VID ? `export default ${JSON.stringify(catalog(dev))};` : null; },
    configureServer(server) {
      server.watcher.add(join(CAMPAIGNS, '*/campaign.json'));
      // 新增 / 删除 / 修改任何战役清单：刷新目录并重载（总台立即出现新战役）
      const refresh = (f: string) => {
        if (!f.endsWith('campaign.json')) return;
        const mod = server.moduleGraph.getModuleById('\0' + VID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      for (const ev of ['change', 'add', 'unlink'] as const) server.watcher.on(ev, refresh);
      server.middlewares.use((req, res, next) => {
        const m = /^\/campaigns\/([a-z0-9-]+)$/.exec(req.url?.split('?')[0] ?? '');
        if (m && existsSync(join(CAMPAIGNS, m[1], 'index.html'))) {
          res.statusCode = 301;
          res.setHeader('Location', `/campaigns/${m[1]}/` + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''));
          res.end();
          return;
        }
        next();
      });
    },
  };
}
