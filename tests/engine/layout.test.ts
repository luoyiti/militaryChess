/**
 * 棋子避让布局：不变量测试。
 *
 * 这里锁定的是一个曾经真实存在的 bug：布局用「上一帧的结果」做热启动，
 * 于是收敛点取决于相机走过的路径。平移一个来回（相机回到原位、可见集合不变）后
 * 棋子回不到原位，相对地图累积漂移 —— 部队密集的战役（敦刻尔克，6.1 支/千 km²）
 * 表现为拖拽/缩放时整片棋子抖动。
 *
 * 因此核心断言是**平移不变性**：把所有锚点整体平移 (dx,dy)，结果必须恰好整体平移 (dx,dy)。
 * 这只有「每帧从锚点冷启动」的纯函数才能满足。
 */
import { describe, it, expect } from 'vitest';
import { relaxLayout, overlapCount, tieAngle, type RelaxItem } from '../../engine/map2d/layout';

/**
 * 造一组确定性的重叠锚点。默认参数对应敦刻尔克的真实尺度：
 * 100 个半径 13.5px 的棋子、锚点散布在 340×240 的框里 —— 有重叠但**几何上可分离**。
 * （若把 60 个半径 18 的棋子塞进 60×60，按最小间距需要约 58654px² 而只有 3600px²，
 *  无论怎么解都消不掉重叠；那种用例只能测「不崩」，不适合断言分离效果。）
 */
function cluster(n: number, seed = 1, radius = 13.5, spread = 340): RelaxItem[] {
  const out: RelaxItem[] = [];
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < n; i++) {
    const ax = 500 + (rnd() - 0.5) * spread;
    const ay = 400 + (rnd() - 0.5) * spread * 0.7;
    out.push({ ax, ay, x: ax, y: ay, r: radius });
  }
  return out;
}
const clone = (a: RelaxItem[]): RelaxItem[] => a.map((p) => ({ ...p }));
const ids = (n: number) => Array.from({ length: n }, (_, i) => `u.${i}`);

describe('棋子避让布局', () => {
  it('平移不变性：整体平移锚点，结果整体平移同样距离', () => {
    const base = cluster(100, 7);
    const solved = clone(base);
    relaxLayout(solved, 60, 0.1, { ids: ids(base.length) });

    for (const [dx, dy] of [[100, 0], [0, -250], [-37, 91], [1200, -800]]) {
      const shifted = base.map((p) => ({ ...p, ax: p.ax + dx, ay: p.ay + dy, x: p.ax + dx, y: p.ay + dy }));
      relaxLayout(shifted, 60, 0.1, { ids: ids(base.length) });
      for (let i = 0; i < base.length; i++) {
        expect(shifted[i].x, `平移 (${dx},${dy}) 后第 ${i} 个棋子的 x`).toBeCloseTo(solved[i].x + dx, 6);
        expect(shifted[i].y, `平移 (${dx},${dy}) 后第 ${i} 个棋子的 y`).toBeCloseTo(solved[i].y + dy, 6);
      }
    }
  });

  it('可复现：同样的输入求解两次结果完全一致', () => {
    const a = cluster(80, 11), b = cluster(80, 11);
    relaxLayout(a, 60, 0.1, { ids: ids(a.length) });
    relaxLayout(b, 60, 0.1, { ids: ids(b.length) });
    for (let i = 0; i < a.length; i++) { expect(b[i].x).toBe(a[i].x); expect(b[i].y).toBe(a[i].y); }
  });

  it('平移一个来回后回到原位（正是闪烁 bug 的复现路径）', () => {
    const base = cluster(100, 3);
    const solve = (items: RelaxItem[]) => { const c = clone(items); relaxLayout(c, 60, 0.1, { ids: ids(c.length) }); return c; };
    const before = solve(base);
    // 相机向左下平移 260px 再回来：锚点回到完全相同的坐标
    const away = base.map((p) => ({ ...p, ax: p.ax - 260, ay: p.ay - 90, x: p.ax - 260, y: p.ay - 90 }));
    solve(away);
    const after = solve(base);
    for (let i = 0; i < base.length; i++) {
      expect(after[i].x).toBeCloseTo(before[i].x, 9);
      expect(after[i].y).toBeCloseTo(before[i].y, 9);
    }
  });

  it('避开重叠：可行布局能完全分离', () => {
    const items = cluster(100, 5);
    const before = overlapCount(items);
    relaxLayout(items, 60, 0.1, { ids: ids(items.length) });
    const after = overlapCount(items);
    expect(before, '构造的用例应当有重叠').toBeGreaterThan(0);
    expect(after, `仍有 ${after} 对重叠`).toBe(0);
  });

  it('不把棋子推得过远：位移有界（引线才不会拉成长线）', () => {
    const items = cluster(100, 9);
    relaxLayout(items, 60, 0.1, { ids: ids(items.length) });
    for (const p of items) {
      const d = Math.hypot(p.x - p.ax, p.y - p.ay);
      // 可行布局下，位移应限制在 2 个半径左右
      expect(d, `位移 ${d.toFixed(1)}px 过大`).toBeLessThan(2 * p.r);
    }
  });

  it('顺序无关：同一几何换个数组顺序，结果完全一致', () => {
    // 可见集合每帧都在变（棋子进出视野），若求解依赖遍历顺序，同样的几何会解出不同布局 ——
    // 那正是「整片棋子重排」的闪烁根因。Jacobi 迭代保证与顺序无关。
    const base = cluster(60, 21, 13.5, 220);
    const forward = base.map((p, i) => ({ ...p, id: `u.${i}`, x: p.ax, y: p.ay }));
    const backward = [...forward].reverse().map((p) => ({ ...p }));
    relaxLayout(forward, 60, 0.1, { ids: forward.map((p) => p.id) });
    relaxLayout(backward, 60, 0.1, { ids: backward.map((p) => p.id) });
    const byId = new Map(backward.map((p) => [p.id!, p]));
    for (const p of forward) {
      const q = byId.get(p.id!)!;
      expect(q.x, `${p.id} 顺序颠倒后 x 不同`).toBeCloseTo(p.x, 9);
      expect(q.y, `${p.id} 顺序颠倒后 y 不同`).toBeCloseTo(p.y, 9);
    }
  });

  it('无重叠时不做任何移动（快速路径）', () => {
    const items: RelaxItem[] = [
      { ax: 0, ay: 0, x: 0, y: 0, r: 10 },
      { ax: 100, ay: 0, x: 100, y: 0, r: 10 },
      { ax: 0, ay: 100, x: 0, y: 100, r: 10 },
    ];
    const copy = clone(items);
    relaxLayout(copy, 60, 0.1, { ids: ['a', 'b', 'c'] });
    for (let i = 0; i < items.length; i++) { expect(copy[i].x).toBe(items[i].x); expect(copy[i].y).toBe(items[i].y); }
  });

  it('完全重合的棋子用稳定 id 拆分：与数组顺序无关', () => {
    const a: RelaxItem[] = [{ ax: 10, ay: 10, x: 10, y: 10, r: 20 }, { ax: 10, ay: 10, x: 10, y: 10, r: 20 }];
    const b: RelaxItem[] = [{ ax: 10, ay: 10, x: 10, y: 10, r: 20 }, { ax: 10, ay: 10, x: 10, y: 10, r: 20 }];
    relaxLayout(a, 60, 0.1, { ids: ['x.1', 'x.2'] });
    relaxLayout(b, 60, 0.1, { ids: ['x.2', 'x.1'] }); // 顺序颠倒
    // 拆分方向由 id 对决定，与下标无关：两点仍然分开且距离相同
    const dA = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    const dB = Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y);
    expect(dA).toBeGreaterThan(1);
    expect(dB).toBeCloseTo(dA, 6);
  });

  it('tieAngle 对称：交换两个 id 得到同一角度', () => {
    expect(tieAngle('de.1pz', 'gb.3div')).toBeCloseTo(tieAngle('gb.3div', 'de.1pz'), 12);
    expect(tieAngle('a', 'b')).not.toBeCloseTo(tieAngle('a', 'c'), 6);
  });

  it('可选参数：minDist / weight / active（海战层用同一求解器）', () => {
    // 舰船层：间距按舰长变化、主力舰少动、只处理在视野内的对象
    type Ship = RelaxItem & { L: number; prio: number; on: boolean };
    const ships: Ship[] = [
      { ax: 0, ay: 0, x: 0, y: 0, r: 0, L: 40, prio: 1, on: true },     // 主力舰
      { ax: 10, ay: 0, x: 10, y: 0, r: 0, L: 40, prio: 9, on: true },    // 小船，重叠
      { ax: 10, ay: 0, x: 10, y: 0, r: 0, L: 40, prio: 9, on: false },   // 视野外，不应被移动
    ];
    relaxLayout(ships, 40, 0.08, {
      active: (a) => (a as Ship).on,
      minDist: (a, b) => ((a as Ship).L + (b as Ship).L) * 0.42,
      weight: (a, b) => ((a as Ship).prio <= (b as Ship).prio ? 0.35 : 0.65),
      ids: ['bb', 'dd', 'off'],
    });
    const bigMove = Math.hypot(ships[0].x - ships[0].ax, ships[0].y - ships[0].ay);
    const smallMove = Math.hypot(ships[1].x - ships[1].ax, ships[1].y - ships[1].ay);
    expect(smallMove, '小船应让位更多').toBeGreaterThan(bigMove);
    expect(ships[2].x, '视野外的对象不应被移动').toBe(ships[2].ax);
    expect(ships[2].y).toBe(ships[2].ay);
    expect(Math.hypot(ships[0].x - ships[1].x, ships[0].y - ships[1].y), '应被推开').toBeGreaterThan(1);
  });

  it('空集合与单元素不报错', () => {
    expect(() => relaxLayout([], 60, 0.1, { ids: [] })).not.toThrow();
    const one: RelaxItem[] = [{ ax: 5, ay: 5, x: 5, y: 5, r: 10 }];
    relaxLayout(one, 60, 0.1, { ids: ['only'] });
    expect(one[0].x).toBe(5);
    expect(one[0].y).toBe(5);
  });
});
