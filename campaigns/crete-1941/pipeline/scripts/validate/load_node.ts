/** Node 端数据加载（校验/调试脚本共用） */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = resolve(ROOT, 'src/data');

export function readJson<T = unknown>(rel: string, fallback?: T): T {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) {
    if (fallback !== undefined) return fallback;
    throw new Error('缺少文件 ' + rel);
  }
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

export function listJson(relDir: string): string[] {
  const p = resolve(ROOT, relDir);
  if (!existsSync(p)) return [];
  return readdirSync(p).filter((f) => f.endsWith('.json')).sort().map((f) => `${relDir}/${f}`);
}

export interface RawData {
  frame: any;
  keyframes: string[];
  sources: any[];
  gazetteer: { file: string; items: any[] }[];
  units: { file: string; items: any[] }[];
  routes: any[];
  fronts: { file: string; item: any }[];
  pockets: any[];
  demarcation: any[];
  events: any[];
  equipment: any[];
  forces: any | null;
}

export function loadAll(): RawData {
  return {
    frame: readJson('config/frame.json'),
    keyframes: readJson<any>('config/keyframes.json').keyframes,
    sources: listJson('src/data/sources').flatMap((f) => readJson<any[]>(f)),
    gazetteer: listJson('src/data/gazetteer').map((f) => ({ file: f, items: readJson<any[]>(f) })),
    units: listJson('src/data/oob').map((f) => ({ file: f, items: readJson<any[]>(f) })),
    routes: listJson('src/data/routes').flatMap((f) => readJson<any[]>(f)),
    fronts: listJson('src/data/fronts').map((f) => ({ file: f, item: readJson<any>(f) })),
    pockets: readJson('src/data/pockets.json', []),
    demarcation: readJson('src/data/demarcation.json', []),
    events: readJson('src/data/events.json', []),
    equipment: readJson('src/data/equipment.json', []),
    forces: readJson('src/data/forces_summary.json', null as any),
  };
}

/** 克里特陆地战区（校验用）。 */
export function loadTheater(): number[][][][] | null {
  const refined = resolve(ROOT, 'public/geo/crete1941.geojson');
  if (!existsSync(refined)) return null;
  const d = JSON.parse(readFileSync(refined, 'utf8'));
  const g = d.type === 'FeatureCollection' ? d.features[0].geometry : d.type === 'Feature' ? d.geometry : d;
  return g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
}
