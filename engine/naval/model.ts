/**
 * 海战模型（纯函数，浏览器与 Node 共用，不得依赖 DOM）：data/naval/*.json 的解析与按时刻查询——
 * 射击时段、命中、鱼雷航迹、烟幕、损伤状态、电文；以及舰船的航迹采样（尾迹、航迹图刻度）与距离/方位换算。
 * 2D 海战层（engine/map2d/naval.ts）与 3D 海战沙盘（engine/three/naval/）都只通过这里读取海战数据。
 */
import type {
  NavalData, FirePeriod, NavalHit, TorpedoLaunch, SmokeScreen, DamageState, Signal, LonLat, ShipWeapon, ShipInfo,
} from '../core/types';
import { isoToHours } from '../core/time';
import { unitStateAt, haversineKm, type RUnit, type UnitState } from '../model/core';

export interface RFire extends FirePeriod { h0: number; h1: number }
export interface RHit extends NavalHit { h: number }
export interface RTorpedo extends TorpedoLaunch { h: number; runH: number }
export interface RSmoke extends SmokeScreen { h0: number; h1: number; persistH: number }
export interface RDamage extends DamageState { h: number }
export interface RSignal extends Signal { h: number }
export interface RNaval {
  fire: RFire[]; hits: RHit[]; torpedoes: RTorpedo[]; smoke: RSmoke[]; damage: RDamage[]; signals: RSignal[];
  /** 有任何海战数据 */
  any: boolean;
}

const KN = 1.852;
const byH = <T extends { h: number }>(a: T, b: T) => a.h - b.h;

export function resolveNaval(parts: NavalData[]): RNaval {
  const all = <K extends keyof NavalData>(k: K): NonNullable<NavalData[K]> => parts.flatMap((p) => (p[k] ?? []) as unknown[]) as NonNullable<NavalData[K]>;
  const fire = all('fire').map((f) => ({ ...f, h0: isoToHours(f.from), h1: isoToHours(f.to) })).sort((a, b) => a.h0 - b.h0);
  const hits = all('hits').map((x) => ({ ...x, h: isoToHours(x.at) })).sort(byH);
  const torpedoes = all('torpedoes').map((t) => {
    const speed = (t.speedKn ?? 30) * KN, range = t.rangeKm ?? 12;
    return { ...t, h: isoToHours(t.at), runH: range / speed };
  }).sort(byH);
  const smoke = all('smoke').map((s) => ({ ...s, h0: isoToHours(s.from), h1: isoToHours(s.to), persistH: (s.persistMin ?? 25) / 60 })).sort((a, b) => a.h0 - b.h0);
  const damage = all('damage').map((d) => ({ ...d, h: isoToHours(d.at) })).sort(byH);
  const signals = all('signals').map((s) => ({ ...s, h: isoToHours(s.at) })).sort(byH);
  return { fire, hits, torpedoes, smoke, damage, signals, any: !!(fire.length || hits.length || torpedoes.length || smoke.length || damage.length || signals.length) };
}

// ---------- 几何 ----------
const R_EARTH = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
/** 方位角（度，真北顺时针） */
export function bearingDeg(a: readonly number[], b: readonly number[]): number {
  const φ1 = rad(a[1]), φ2 = rad(b[1]), Δλ = rad(b[0] - a[0]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
/** 自 ll 沿方位 brg（度）前进 km 公里 */
export function destination(ll: readonly number[], brg: number, km: number): LonLat {
  const δ = km / R_EARTH, θ = rad(brg), φ1 = rad(ll[1]), λ1 = rad(ll[0]);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [deg(λ2), deg(φ2)];
}
export const distanceKm = haversineKm;
/** 距离标注：码（英方战报习惯）/ 公里 / 海里 */
export function rangeLabel(km: number, unit: 'yd' | 'km' | 'nm' = 'yd'): string {
  if (unit === 'km') return `${km < 10 ? km.toFixed(1) : Math.round(km)} 公里`;
  if (unit === 'nm') return `${(km / KN).toFixed(km < 18 ? 1 : 0)} 海里`;
  const yd = Math.round((km * 1093.61) / 100) * 100;
  return `${yd.toLocaleString('en-US')} 码`;
}

// ---------- 舰船与武器 ----------
export const isShip = (u: RUnit | undefined): u is RUnit & { ship: ShipInfo } => !!u?.ship;
/** 射击时段的武器：shooter.ship.weapons 中的 id；'main' / 'secondary' 取同类第一项 */
export function weaponOf(u: RUnit | undefined, id: string | undefined): ShipWeapon | null {
  const ws = u?.ship?.weapons ?? [];
  if (!id) return ws.find((w) => w.kind === 'main') ?? null;
  return ws.find((w) => w.id === id) ?? ws.find((w) => w.kind === id) ?? null;
}
/** 口径（毫米）：从 '28 cm' / '8in' / '6-inch' / '15 cm' / '102 mm' 等写法中解析 */
export function caliberMm(cal: string | undefined): number {
  if (!cal) return 150;
  const m = /([\d.]+)\s*(cm|mm|in|inch|″|")/i.exec(cal);
  if (!m) return 150;
  const v = Number(m[1]), u = m[2].toLowerCase();
  return u === 'cm' ? v * 10 : u === 'mm' ? v : v * 25.4;
}
/** 缺省齐射间隔（叙事秒）：重炮慢、轻巡快（1939 年水面舰实战射速的量级） */
export function defaultSalvoSec(calMm: number): number {
  if (calMm >= 270) return 30;
  if (calMm >= 190) return 20;
  if (calMm >= 140) return 12;
  if (calMm >= 100) return 8;
  return 5;
}
/** 炮弹飞行时间（叙事秒），按射程与口径的经验近似（平均弹速约为初速的 55%） */
export function shellFlightSec(rangeKm: number, calMm: number): number {
  const mv = calMm >= 270 ? 910 : calMm >= 190 ? 855 : calMm >= 140 ? 840 : 800;
  return (rangeKm * 1000) / (mv * 0.55);
}

// ---------- 按时刻查询 ----------
export interface Engagement {
  fire: RFire; shooter: RUnit; target: RUnit; a: UnitState; b: UnitState; km: number; bearing: number; weapon: ShipWeapon | null; calMm: number;
}
/** 时刻 h 正在进行的射击（含双方位置、距离、方位） */
export function engagementsAt(nav: RNaval, units: Map<string, RUnit>, h: number): Engagement[] {
  const out: Engagement[] = [];
  for (const f of nav.fire) {
    if (f.h0 > h) break;
    if (h > f.h1) continue;
    const shooter = units.get(f.shooter), target = units.get(f.target);
    if (!shooter || !target) continue;
    const a = unitStateAt(f.shooter, units, h), b = unitStateAt(f.target, units, h);
    if (!a || !b) continue;
    const weapon = weaponOf(shooter, f.weapon);
    out.push({ fire: f, shooter, target, a, b, km: haversineKm(a.ll, b.ll), bearing: bearingDeg(a.ll, b.ll), weapon, calMm: caliberMm(weapon?.cal ?? f.weapon) });
  }
  return out;
}
/** [h0, h1) 内开火的齐射（确定性：第 k 次齐射在 f.h0 + k·间隔）。interval 由调用方按画面密度放大 */
export function salvosBetween(f: RFire, calMm: number, h0: number, h1: number, minIntervalH = 0): { k: number; h: number }[] {
  const iv = Math.max((f.salvoSec ?? defaultSalvoSec(calMm)) / 3600, minIntervalH);
  const out: { k: number; h: number }[] = [];
  const lo = Math.max(h0, f.h0), hi = Math.min(h1, f.h1);
  if (hi <= lo) return out;
  for (let k = Math.ceil((lo - f.h0) / iv - 1e-9); f.h0 + k * iv < hi; k++) out.push({ k, h: f.h0 + k * iv });
  return out;
}
/** 0..1 的确定性伪随机（散布、闪光大小） */
export function hash01(s: string, k = 0): number {
  let h = 2166136261 ^ k;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface DamageView {
  state: RDamage | null; // 最近的损伤状态
  hits: RHit[]; // 至今的命中
  gunsOut: Set<string>;
  killed: number;
  wounded: number;
  integrity: number;
  fire: boolean;
  speedKn?: number;
}
/** 舰船在时刻 h 的损伤：最近的 damage 状态 + 至今命中累计的打哑武器与伤亡 */
export function damageAt(nav: RNaval, ship: string, h: number): DamageView {
  let state: RDamage | null = null;
  for (const d of nav.damage) { if (d.h > h) break; if (d.ship === ship) state = d; }
  const hits = nav.hits.filter((x) => x.target === ship && x.h <= h);
  const gunsOut = new Set<string>(state?.gunsOut ?? []);
  for (const x of hits) for (const g of x.gunsOut ?? []) if (!state || x.h > state.h) gunsOut.add(g);
  const killed = hits.reduce((n, x) => n + (x.killed ?? 0), 0);
  const wounded = hits.reduce((n, x) => n + (x.wounded ?? 0), 0);
  const integrity = state?.integrity ?? Math.max(0.2, 1 - hits.reduce((n, x) => n + (x.severity === 1 ? 0.18 : x.severity === 2 ? 0.07 : 0.02), 0));
  return { state, hits, gunsOut, killed, wounded, integrity, fire: !!state?.fire, speedKn: state?.speedKn };
}
/** (h0, h1] 内发生的命中（播放时触发闪光） */
export const hitsBetween = (nav: RNaval, h0: number, h1: number) => nav.hits.filter((x) => x.h > h0 && x.h <= h1);

export interface TorpedoTrack { launch: RTorpedo; from: LonLat; to: LonLat; frac: number; done: boolean }
/** 时刻 h 在水中的鱼雷（每条一根航迹；frac = 已航行比例） */
export function torpedoesAt(nav: RNaval, units: Map<string, RUnit>, h: number, linger = 0.25): TorpedoTrack[] {
  const out: TorpedoTrack[] = [];
  for (const t of nav.torpedoes) {
    if (t.h > h) break;
    if (h > t.h + t.runH + linger) continue;
    const s = unitStateAt(t.shooter, units, t.h);
    if (!s) continue;
    let brg = t.bearing;
    if (brg === undefined && t.target) {
      // 瞄准点：目标在鱼雷航程中点时刻的位置（提前量）
      const aim = unitStateAt(t.target, units, t.h + t.runH * 0.5) ?? unitStateAt(t.target, units, t.h);
      brg = aim ? bearingDeg(s.ll, aim.ll) : s.courseDeg ?? 0;
    }
    brg ??= s.courseDeg ?? 0;
    const spread = t.spreadDeg ?? t.count * 2;
    const frac = Math.max(0, Math.min(1, (h - t.h) / t.runH));
    const run = (t.rangeKm ?? 12) * frac;
    for (let i = 0; i < t.count; i++) {
      const off = t.count > 1 ? -spread / 2 + (spread * i) / (t.count - 1) : 0;
      out.push({ launch: t, from: s.ll, to: destination(s.ll, brg + off, run), frac, done: frac >= 1 });
    }
  }
  return out;
}

export interface SmokePuff { ll: LonLat; ageH: number; alpha: number; widthKm: number }
/** 时刻 h 可见的烟幕：沿施放舰航迹每 dtMin 分钟一团，按年龄变淡、变宽，可随风漂移 */
export function smokeAt(nav: RNaval, units: Map<string, RUnit>, h: number, dtMin = 1.5): { smoke: RSmoke; puffs: SmokePuff[] }[] {
  const out: { smoke: RSmoke; puffs: SmokePuff[] }[] = [];
  for (const s of nav.smoke) {
    if (s.h0 > h) break;
    if (h > s.h1 + s.persistH) continue;
    const puffs: SmokePuff[] = [];
    const end = Math.min(h, s.h1), step = dtMin / 60, w0 = s.widthKm ?? 0.8;
    for (let t = s.h0; t <= end + 1e-9; t += step) {
      const st = unitStateAt(s.ship, units, t);
      if (!st) continue;
      const age = h - t;
      const alpha = Math.max(0, 1 - age / s.persistH);
      if (alpha <= 0.02) continue;
      const drift = s.driftDeg !== undefined ? age * 6 : 0; // 约 6 km/h 漂移
      puffs.push({ ll: drift ? destination(st.ll, s.driftDeg!, drift) : st.ll, ageH: age, alpha, widthKm: w0 * (1 + age * 3) });
    }
    if (puffs.length) out.push({ smoke: s, puffs });
  }
  return out;
}

/** 航迹采样：[h0, h1] 每 stepMin 分钟一点（尾迹、航迹图） */
export function trackSamples(units: Map<string, RUnit>, id: string, h0: number, h1: number, stepMin: number): { h: number; ll: LonLat; s: UnitState }[] {
  const out: { h: number; ll: LonLat; s: UnitState }[] = [];
  const u = units.get(id);
  if (!u || h1 <= h0) return out;
  const lo = Math.max(h0, u.track[0]?.h ?? h0, u.fromH);
  const step = stepMin / 60;
  for (let t = lo; t < h1; t += step) { const s = unitStateAt(id, units, t); if (s) out.push({ h: t, ll: s.ll, s }); }
  const s = unitStateAt(id, units, h1);
  if (s) out.push({ h: h1, ll: s.ll, s });
  return out;
}

/** 至时刻 h 为止的电文（最新在后） */
export function signalsUntil(nav: RNaval, h: number, n = 8): RSignal[] {
  let i = nav.signals.length;
  while (i > 0 && nav.signals[i - 1].h > h) i--;
  return nav.signals.slice(Math.max(0, i - n), i);
}

/** 太阳方位（度，真北顺时针）与高度角（度）：3D 沙盘的昼夜光照。utcMs 为 UTC 毫秒 */
export function sunPosition(ll: LonLat, utcMs: number): { azimuth: number; elevation: number } {
  const d = utcMs / 86400000 + 2440587.5 - 2451545.0;
  const g = rad((357.529 + 0.98560028 * d) % 360);
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = rad(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const e = rad(23.439 - 0.00000036 * d);
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = rad(((gmst * 15 + ll[0]) % 360)) - ra;
  const φ = rad(ll[1]);
  const elev = Math.asin(Math.sin(φ) * Math.sin(dec) + Math.cos(φ) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(φ) - Math.sin(φ) * Math.cos(ha));
  return { azimuth: (deg(az) + 360) % 360, elevation: deg(elev) };
}
