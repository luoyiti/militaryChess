/**
 * 总台 ⇄ 战役转场。
 * 进入：浮动面板退场 → 镜头沿平滑缩放曲线推进到战役的开场取景（同时预取战役页面与底图数据）
 *      → 截取地图快照，连同标题卡写入 sessionStorage，铺上幕布 → 跳转；
 *      战役页面第一帧画出同一张幕布，地图就绪后快照继续放大淡出（shared/handoff/）。
 * 返回：战役页面留下 warroom:return 记号；总台从该战役的推进终点开始，拉远回到离开时的视角。
 */
import '../shared/handoff/handoff.css';
import '../shared/handoff/handoff.js';
import type { ZoomTransform } from 'd3-zoom';
import { zoomIdentity } from 'd3-zoom';
import type { HubMap } from './map';
import type { CatalogEntry } from './types';
import { dayOf, fmtDot } from './dates';

export interface HandoffRecord { id: string; at: number; img?: string; zs: number; kicker: string; mark: string; title: string; en: string; dates: string }
interface HandoffApi { KEY: string; build(h: HandoffRecord): HTMLElement; save(h: HandoffRecord): boolean; reveal(): void }
const api = () => (window as unknown as { __wrHandoff: HandoffApi }).__wrHandoff;

const RETURN_KEY = 'warroom:return';
const VIEW_KEY = 'warroom:hubview';
/** 推进镜头的最大缩放：再往里底图精度不够，交给快照的数字放大 */
const FLY_MAX_K = 7;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = {
  get<T>(k: string): T | null { try { const v = sessionStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  set(k: string, v: unknown) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* 隐私模式 */ } },
  del(k: string) { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

/** 预取战役页面的 HTML、入口模块与首屏数据，推进镜头的一两秒里浏览器就把它们放进缓存 */
export function prefetch(c: CatalogEntry) {
  const base = new URL(c.href, location.href);
  const hint = (href: string, rel: string, as?: string) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = rel; l.href = href;
    if (as) l.as = as;
    document.head.appendChild(l);
  };
  void fetch(base, { credentials: 'same-origin' }).then((r) => (r.ok ? r.text() : '')).then((html) => {
    for (const m of html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)) hint(new URL(m[1], base).href, 'modulepreload');
    for (const m of html.matchAll(/<link[^>]+rel="(?:modulepreload|stylesheet)"[^>]+href="([^"]+)"/g)) hint(new URL(m[1], base).href, m[0].includes('stylesheet') ? 'preload' : 'modulepreload', m[0].includes('stylesheet') ? 'style' : undefined);
  }).catch(() => undefined);
  for (const f of ['geo/vectors.topo.json', 'tiles/base/meta.json']) hint(new URL(f, base).href, 'prefetch');
}

/** 离开前保存总台的视角与选中的卷宗，返回时恢复 */
export function saveHubView(map: HubMap, selected: string | null, day: number) {
  const v = map.view;
  store.set(VIEW_KEY, { cx: (map.width / 2 - v.x) / v.k, cy: (map.height / 2 - v.y) / v.k, k: v.k, selected, day });
}
export function savedHubView(map: HubMap): { t: ZoomTransform; selected: string | null; day: number } | null {
  const s = store.get<{ cx: number; cy: number; k: number; selected: string | null; day: number }>(VIEW_KEY);
  if (!s) return null;
  const k = Math.max(map.minK, s.k);
  return { t: zoomIdentity.translate(map.width / 2 - s.cx * k, map.height / 2 - s.cy * k).scale(k), selected: s.selected, day: s.day };
}

/** 进入战役：推进镜头 → 快照幕布 → 跳转 */
export async function enterCampaign(map: HubMap, c: CatalogEntry, url: string, reduced: boolean) {
  prefetch(c);
  const { t, full } = map.campaignTransform(c, FLY_MAX_K);
  map.base.labelAlpha = 0.55;
  await map.flyTo(t, reduced ? 0 : undefined, true);
  const s = dayOf(c.time.start), e = dayOf(c.time.end);
  const rec: HandoffRecord = {
    id: c.id, at: Date.now(), img: map.snapshot(c.id), zs: full.k / t.k,
    kicker: '作战总台 · 正在接通作战室', mark: c.title.mark, title: c.title.zh, en: c.title.en, dates: `${fmtDot(s)} — ${fmtDot(e)}`,
  };
  api().save(rec);
  const veil = api().build(rec);
  veil.classList.add('wr-in');
  document.body.appendChild(veil);
  await sleep(reduced ? 60 : 560);
  location.href = url;
}

/** 从战役返回：记号有效（20 秒内、战役存在）时返回该战役 */
export function takeReturn(entries: CatalogEntry[]): CatalogEntry | null {
  const r = store.get<{ id: string; at: number }>(RETURN_KEY);
  store.del(RETURN_KEY);
  if (!r || Date.now() - r.at > 20000) return null;
  return entries.find((c) => c.id === r.id) ?? null;
}

/** 返回动画：从战役的推进终点拉远到目标视角 */
export async function pullBack(map: HubMap, c: CatalogEntry, target: ZoomTransform, reduced: boolean) {
  const { t } = map.campaignTransform(c, FLY_MAX_K);
  await map.flyTo(t, 0, true);
  map.base.labelAlpha = 0.55;
  await sleep(reduced ? 0 : 160);
  map.base.labelAlpha = 1;
  await map.flyTo(target, reduced ? 0 : undefined);
}

/** 往返缓存恢复（浏览器后退到仍在内存中的总台）：撤掉幕布 */
export function clearVeil() { document.getElementById('wr-handoff')?.remove(); }
