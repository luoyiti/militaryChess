/**
 * 棋子避让布局（纯函数，无 DOM 依赖，可在 Node 下单测）。
 *
 * 目标：把重叠的棋子推开，同时尽量贴近各自的地图锚点；被推远的棋子由调用方画引线指回锚点。
 *
 * **关键约束：必须每帧从锚点冷启动，不得沿用上一帧的结果做热启动。**
 * 热启动会让收敛点取决于「相机走过的路径」而不是「当前视野里的锚点几何」：
 * 平移一个来回（相机回到原位、可见集合不变）时棋子不会回到原位，而是相对地图持续漂移，
 * 表现为拖拽/缩放时整片棋子跳动。部队越密、重叠越多，漂移越明显。
 *
 * 因此本模块只接受锚点坐标，输出的位移场满足：
 *   把所有锚点整体平移 (dx, dy)，结果也恰好整体平移 (dx, dy)。
 * 这由 `tests/engine/layout.test.ts` 断言。
 */
export interface RelaxItem {
  /** 锚点（屏幕坐标） */
  ax: number;
  ay: number;
  /** 当前位置（屏幕坐标）；调用前应置为锚点 */
  x: number;
  y: number;
  /** 避让半径（像素） */
  r: number;
}

/**
 * 重合棋子的拆分方向：由两个稳定 id 派生，与数组下标、帧序无关。
 * 用下标会随可见集合变化而改变方向，同样造成闪烁。
 */
export function tieAngle(idA: string, idB: string): number {
  let h = 2166136261;
  const s = idA < idB ? idA + '\u0000' + idB : idB + '\u0000' + idA;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000 * Math.PI * 2;
}

/** 松弛求解的可选参数：让不同图层共用同一套顺序无关的求解器 */
export interface RelaxOptions {
  /** 每对对象的最小间距（缺省 (a.r+b.r)*0.98）；舰船按舰长变化，故做成函数 */
  minDist?: (a: RelaxItem, b: RelaxItem) => number;
  /** a 承担多大的推开量（缺省 0.5 均分）；舰船让主力舰少动 */
  weight?: (a: RelaxItem, b: RelaxItem) => number;
  /** 参与计算的子集判定（缺省全部参与） */
  active?: (a: RelaxItem) => boolean;
  /** 稳定 id，用于确定性拆分完全重合的对象 */
  ids?: (string | undefined)[];
}

/**
 * 松弛求解（Jacobi 迭代）。`items` 的 x/y 会被就地修改。
 *
 * **为什么是 Jacobi 而不是 Gauss–Seidel**：逐对就地更新（Gauss–Seidel）的结果取决于
 * 遍历顺序。可见集合每帧都在变（平移时不断有对象进出视野），数组顺序随之变化，
 * 于是同样的几何会解出不同的布局 —— 成片重排，看起来就是闪烁。
 * Jacobi 每轮把所有位移先累加到独立缓冲、再统一应用，因此与顺序无关。
 *
 * 调用方**必须**先把 x/y 置为锚点（冷启动）。不要传上一帧的结果：
 * 热启动会让收敛点取决于相机走过的路径（见 tests 里的「平移不变性」）。
 *
 * @param iters 最大迭代轮数（无重叠时提前结束；100 个棋子的量级约 0.5 ms）
 * @param pull  每轮把对象拉回锚点的比例
 */
export function relaxLayout(items: RelaxItem[], iters = 60, pull = 0.1, opts: RelaxOptions = {}): void {
  const n = items.length;
  const dxs = new Float64Array(n), dys = new Float64Array(n);
  const on = opts.active;
  for (let it = 0; it < iters; it++) {
    dxs.fill(0); dys.fill(0);
    let hits = 0;
    for (let i = 0; i < n; i++) {
      const a = items[i];
      if (on && !on(a)) continue;
      for (let j = i + 1; j < n; j++) {
        const b = items[j];
        if (on && !on(b)) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        const min = opts.minDist ? opts.minDist(a, b) : (a.r + b.r) * 0.98;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        hits++;
        let d = Math.sqrt(d2);
        if (d < 0.01) {
          const t = opts.ids ? tieAngle(opts.ids[i] ?? String(i), opts.ids[j] ?? String(j)) : (i + j) * 0.7;
          dx = Math.cos(t); dy = Math.sin(t); d = 1;
        }
        const push = (min - d) / 2, ux = dx / d, uy = dy / d;
        const wa = opts.weight ? opts.weight(a, b) : 0.5;
        dxs[i] -= ux * push * 2 * wa; dys[i] -= uy * push * 2 * wa;
        dxs[j] += ux * push * 2 * (1 - wa); dys[j] += uy * push * 2 * (1 - wa);
      }
    }
    // 统一应用（Jacobi）：位移量与遍历顺序无关
    for (let i = 0; i < n; i++) {
      const a = items[i];
      a.x += dxs[i] + (a.ax - a.x) * pull;
      a.y += dys[i] + (a.ay - a.y) * pull;
    }
    if (!hits) break;
  }
}

/** 重叠统计：返回被判定为「明显重叠」的配对数（供 HUD/测试用） */
export function overlapCount(items: readonly RelaxItem[], factor = 0.7): number {
  let n = 0;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * factor) n++;
  }
  return n;
}
