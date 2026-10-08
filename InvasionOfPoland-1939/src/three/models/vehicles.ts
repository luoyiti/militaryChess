/**
 * 各型坦克/装甲车的参数化构建。坐标：x 前后、y 高、z 左右（+z 右）；构建完由 B.recenter() 归位。
 * 尺寸参考 Wikipedia/Zaloga 公开数据：全长/全宽/全高、负重轮数量与直径、火炮口径与身管长。
 */
import { B, type V2 } from './builder';
import {
  roadWheel, sprocket, idler, roller, track, gun, mg, cupola, hatch, visor, exhaust, headlight, antenna, tools,
  rivets, rivetLine, leafSpring, type Circle, type WheelStyle,
} from './parts';

// ---------- 通用行走机构 ----------
interface RG {
  zc: number; tw: number; tt: number; pitch: number; horns?: 'center' | 'none' | 'alt';
  wheels: number[]; wr: number; wstyle: WheelStyle;
  drive: Circle; idle: Circle; driveFront: boolean;
  rollers: number[]; rr: number; ry: number;
  /** 外侧转向架板（车轮索引组） */
  bogies?: number[][];
  /** 片簧：[x0,x1,y,arch,倾角] */
  springs?: [number, number, number, number, number?][];
  springOut?: boolean;
  /** 外置平衡梁 [x0,x1,y] */
  girder?: [number, number, number];
  /** 克里斯蒂摆臂 */
  arms?: boolean;
}

function runningGear(b: B, g: RG): void {
  const wy = g.wr + g.tt;
  const ww = g.tw * 0.78;
  b.both(() => {
    for (const x of g.wheels) roadWheel(b, x, wy, g.zc, g.wr, ww, g.wstyle);
    sprocket(b, g.drive.x, g.drive.y, g.zc, g.drive.r, g.tw);
    idler(b, g.idle.x, g.idle.y, g.zc, g.idle.r, g.tw);
    for (const x of g.rollers) roller(b, x, g.ry, g.zc - g.tw * 0.12, g.rr, g.tw * 0.5);
    const circles: Circle[] = [g.drive, g.idle, ...g.wheels.map((x) => ({ x, y: wy, r: g.wr })), ...g.rollers.map((x) => ({ x, y: g.ry, r: g.rr }))];
    track(b, circles, { zc: g.zc, w: g.tw, t: g.tt, pitch: g.pitch, horns: g.horns });
    const zo = g.zc + ww / 2 + 0.025;
    for (const grp of g.bogies ?? []) {
      const xs = grp.map((i) => g.wheels[i]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), xm = (x0 + x1) / 2;
      if (b.hi) {
        b.poly([
          [x0, wy - g.wr * 0.25, zo - 0.015], [x1, wy - g.wr * 0.25, zo - 0.015], [x1, wy + g.wr * 0.25, zo - 0.015], [xm, wy + g.wr * 1.25, zo - 0.015],
          [x0, wy + g.wr * 0.25, zo - 0.015],
          [x0, wy - g.wr * 0.25, zo + 0.015], [x1, wy - g.wr * 0.25, zo + 0.015], [x1, wy + g.wr * 0.25, zo + 0.015], [xm, wy + g.wr * 1.25, zo + 0.015],
          [x0, wy + g.wr * 0.25, zo + 0.015],
        ], [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [0, 1, 6, 5], [1, 2, 7, 6], [2, 3, 8, 7], [3, 4, 9, 8], [4, 0, 5, 9]], 'paint');
        for (const x of xs) b.wheelDisc(x, wy, zo + 0.02, g.wr * 0.18, 0.03, 8, 'metal');
      } else {
        b.box([x1 - x0 + g.wr * 0.4, g.wr * 0.7, 0.03], [xm, wy + g.wr * 0.2, zo], 'paint');
      }
    }
    for (const s of g.springs ?? []) {
      const z = g.springOut ? zo + 0.01 : g.zc;
      b.with({ p: [(s[0] + s[1]) / 2, s[2], 0], r: [0, 0, s[4] ?? 0] }, () => leafSpring(b, (s[0] - s[1]) / 2, (s[1] - s[0]) / 2, 0, z, s[3]));
    }
    if (g.girder) {
      const [x0, x1, y] = g.girder;
      b.box([x1 - x0, 0.1, 0.03], [(x0 + x1) / 2, y, zo + 0.005], 'paint');
      if (b.hi) for (let x = x0 + 0.1; x < x1; x += 0.25) b.wheelDisc(x, y, zo + 0.025, 0.015, 0.02, 6, 'metal');
    }
    if (g.arms && b.hi) {
      for (const x of g.wheels) b.cyl([x, wy, zo - 0.01], [x + 0.32, wy + 0.3, g.zc - g.tw / 2 - 0.02], 0.035, 0.03, 6, 'paint');
    }
  });
}

/** 挡泥板：y 高度，z 内外，前后端下折 */
function fenders(b: B, x0: number, x1: number, y: number, zi: number, zo: number, dropF = 0.12, dropR = 0.08): void {
  b.both(() => {
    b.box([x1 - x0, 0.02, zo - zi], [(x0 + x1) / 2, y, (zi + zo) / 2], 'paint');
    const zc = (zi + zo) / 2, w = zo - zi;
    b.cyl([x1, y, zc], [x1 + 0.22, y - dropF, zc], 0.012, 0.012, 3, 'paint');
    b.box([0.24, 0.02, w], [x1 + 0.11, y - dropF / 2, zc], 'paint', [0, 0, -Math.atan2(dropF, 0.22)]);
    b.box([0.2, 0.02, w], [x0 - 0.09, y - dropR / 2, zc], 'paint', [0, 0, Math.atan2(dropR, 0.18)]);
  });
}

/** 车体侧视轮廓拉伸（对称于 z=0） */
function hullBlock(b: B, profile: V2[], half: number): void { b.prism(profile, -half, half, 'paint'); }

/** 两侧 + 后部白十字 */
function crosses(b: B, x: number, y: number, z: number, size: number, rear?: [number, number]): void {
  b.decal({ kind: 'cross', pos: [x, y, z + 0.006], face: '+z', size });
  b.decal({ kind: 'cross', pos: [x, y, -z - 0.006], face: '-z', size });
  if (rear) b.decal({ kind: 'cross', pos: [rear[0] - 0.006, rear[1], 0], face: '-x', size: size * 0.8 });
}
function turretNums(b: B, text: string, x: number, y: number, z: number, size: number, tilt = 0): void {
  b.decal({ kind: 'num', text, pos: [x, y, z + 0.008], face: '+z', size, tilt });
  b.decal({ kind: 'num', text, pos: [x, y, -z - 0.008], face: '-z', size, tilt });
}
function louvers(b: B, x0: number, x1: number, y: number, half: number, n: number): void {
  if (!b.hi) return;
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    b.box([(x1 - x0) / n * 0.45, 0.025, half * 2], [x, y + 0.012, 0], 'paint');
  }
}

/** 通用棱台炮塔 + 防盾 */
function turretBox(b: B, cx: number, cz: number, y0: number, y1: number, len: number, half: number, slope: number, lenTop = len * 0.9): void {
  b.frustum(cx - len / 2, cx + len / 2, half, cx - lenTop / 2, cx + lenTop / 2, half - slope, y0, y1, 'paint', cz);
}

// =====================================================================
export function pz1(b: B): void {
  runningGear(b, {
    zc: 0.89, tw: 0.28, tt: 0.05, pitch: 0.12, wheels: [1.28, 0.62, -0.02, -0.66, -1.3], wr: 0.265, wstyle: 'dish',
    drive: { x: 1.86, y: 0.5, r: 0.25 }, idle: { x: -1.93, y: 0.47, r: 0.25 }, driveFront: true,
    rollers: [1.1, 0.33, -0.42, -1.18], rr: 0.07, ry: 0.72,
    bogies: [[1, 2], [3, 4]], girder: [-1.42, 0.78, 0.5],
  });
  hullBlock(b, [[-2.1, 0.32], [1.7, 0.32], [2.21, 0.6], [2.21, 0.84], [-2.18, 0.84]], 0.72);
  fenders(b, -2.08, 1.95, 0.86, 0.72, 1.03, 0.14, 0.06);
  // 上部车体：前装甲板 + 驾驶室 + 发动机舱
  hullBlock(b, [[-2.2, 0.85], [2.05, 0.85], [1.72, 1.24], [0.05, 1.24], [-0.05, 1.12], [-2.2, 1.04]], 0.84);
  visor(b, 1.88, 1.05, -0.35, 0.3, 0.12, '+x', 0.7);
  visor(b, 1.0, 1.1, 0.845, 0.25, 0.08, '+z');
  louvers(b, -1.9, -0.3, 1.1, 0.55, 6);
  hatch(b, -1.0, 1.1, 0.42, 0.5, 0.4);
  // 小炮塔（偏右），双 MG13
  const tz = 0.15;
  b.frustum(0.34, 1.34, 0.47, 0.46, 1.24, 0.4, 1.24, 1.64, 'paint', tz);
  b.box([0.14, 0.24, 0.52], [1.34, 1.46, tz], 'paint');
  mg(b, [1.41, 1.47, tz - 0.1], 0.4);
  mg(b, [1.41, 1.47, tz + 0.1], 0.4);
  hatch(b, 0.8, 1.64, tz, 0.5, 0.4);
  if (b.hi) { b.box([0.36, 0.05, 0.5], [0.72, 1.665, tz], 'paint'); visor(b, 0.8, 1.45, tz + 0.45, 0.2, 0.06, '+z', 0.2); }
  exhaust(b, -2.0, -1.4, 0.98, -0.88, 0.075);
  headlight(b, 2.02, 0.98, 0.6, 0.07); headlight(b, 2.02, 0.98, -0.6, 0.07);
  tools(b, 0.6, 0.885, 0.82);
  antenna(b, 0.9, -1.7, 1.18, -0.86);
  crosses(b, -0.9, 1.0, 0.845, 0.28, [-2.2, 0.95]);
  turretNums(b, '114', 0.84, 1.43, tz + 0.44, 0.17);
}

export function pz2(b: B): void {
  runningGear(b, {
    zc: 0.96, tw: 0.3, tt: 0.05, pitch: 0.11, wheels: [1.34, 0.67, 0.0, -0.67, -1.34], wr: 0.275, wstyle: 'dish',
    drive: { x: 2.03, y: 0.56, r: 0.27 }, idle: { x: -2.06, y: 0.52, r: 0.27 }, driveFront: true,
    rollers: [1.35, 0.45, -0.45, -1.35], rr: 0.075, ry: 0.8,
    springs: [[1.02, 1.6, 0.66, 0.03], [0.35, 0.93, 0.66, 0.03], [-0.32, 0.26, 0.66, 0.03], [-0.99, -0.41, 0.66, 0.03], [-1.66, -1.08, 0.66, 0.03]], springOut: true,
  });
  hullBlock(b, [[-2.35, 0.34], [1.95, 0.34], [2.22, 0.4], [2.35, 0.5], [2.41, 0.62], [2.38, 0.74], [2.28, 0.86], [2.05, 0.95], [-2.4, 0.95]], 0.78);
  fenders(b, -2.35, 2.05, 0.96, 0.78, 1.11, 0.12, 0.08);
  hullBlock(b, [[-2.4, 0.95], [2.2, 0.95], [2.02, 1.38], [0.1, 1.4], [-0.05, 1.3], [-2.38, 1.24]], 0.9);
  visor(b, 2.12, 1.15, 0.35, 0.34, 0.12, '+x', 0.4);
  visor(b, 1.6, 1.2, 0.905, 0.25, 0.08, '+z');
  louvers(b, -2.1, -0.4, 1.28, 0.6, 7);
  const tz = -0.1;
  b.frustum(0.32, 1.46, 0.56, 0.42, 1.36, 0.48, 1.4, 1.9, 'paint', tz);
  b.box([0.16, 0.3, 0.64], [1.47, 1.66, tz], 'paint');
  gun(b, { at: [1.55, 1.68, tz - 0.08], len: 0.84, r0: 0.03, r1: 0.024, muzzle: 'ring', sleeve: [0.3, 0.05] });
  mg(b, [1.55, 1.66, tz + 0.12], 0.3);
  if (b.hi) { b.box([0.44, 0.05, 0.56], [0.78, 1.925, tz], 'paint'); b.box([0.12, 0.08, 0.1], [1.12, 1.93, tz + 0.2], 'paint'); }
  hatch(b, 0.8, 1.95, tz, 0.4, 0.5);
  b.cyl([-2.44, 0.75, -0.5], [-2.44, 0.75, 0.5], 0.075, 0.075, b.n(12, 5), 'rust');
  headlight(b, 2.15, 1.04, 0.62); headlight(b, 2.15, 1.04, -0.62);
  tools(b, 0.8, 0.985, 0.92);
  antenna(b, 1.2, -1.6, 1.3, 0.93);
  crosses(b, -1.0, 1.14, 0.905, 0.3, [-2.4, 1.1]);
  turretNums(b, '212', 0.9, 1.64, tz + 0.53, 0.2, 0.15);
}

export function pz3(b: B): void {
  const W = [1.79, 1.35, 0.83, 0.39, -0.17, -0.61, -1.13, -1.57];
  runningGear(b, {
    zc: 1.23, tw: 0.36, tt: 0.06, pitch: 0.12, wheels: W, wr: 0.19, wstyle: 'disc',
    drive: { x: 2.47, y: 0.74, r: 0.32 }, idle: { x: -2.42, y: 0.66, r: 0.3 }, driveFront: true,
    rollers: [1.3, 0.1, -1.1], rr: 0.1, ry: 1.02,
    bogies: [[0, 1], [2, 3], [4, 5], [6, 7]],
    springs: [[0.2, 1.95, 0.62, 0.05, -0.1], [-1.75, 0.0, 0.62, 0.05, 0.1]], springOut: false,
  });
  hullBlock(b, [[-2.84, 0.44], [2.32, 0.44], [2.96, 0.84], [2.96, 1.04], [2.62, 1.2], [-2.9, 1.2]], 1.02);
  fenders(b, -2.85, 2.66, 1.2, 1.02, 1.41, 0.16, 0.1);
  hullBlock(b, [[-2.93, 1.2], [2.62, 1.2], [2.6, 1.56], [2.32, 1.64], [-2.25, 1.64], [-2.93, 1.48]], 1.33);
  visor(b, 2.62, 1.44, 0.45, 0.36, 0.14, '+x');
  if (b.hi) { b.cyl([2.6, 1.44, -0.45], [2.7, 1.44, -0.45], 0.1, 0.09, 12, 'paint'); b.cyl([2.69, 1.44, -0.45], [2.72, 1.44, -0.45], 0.04, 0.04, 8, 'dark'); }
  visor(b, 2.0, 1.5, 1.335, 0.3, 0.1, '+z'); visor(b, 2.0, 1.5, -1.335, 0.3, 0.1, '-z');
  louvers(b, -2.6, -1.0, 1.64, 0.8, 5);
  hatch(b, 1.6, 1.64, 0.55, 0.5, 0.45); hatch(b, 1.6, 1.64, -0.55, 0.5, 0.45);
  // 炮塔
  const tx = 0.3;
  b.frustum(tx - 0.98, tx + 0.86, 0.9, tx - 0.86, tx + 0.76, 0.74, 1.64, 2.25, 'paint');
  if (b.hi) {
    for (const s of [1, -1]) {
      b.with({ p: [tx - 0.06, 1.97, s * 0.83], r: [-s * 0.29, 0, 0] }, () => { b.box([0.5, 0.36, 0.04], [0, 0, 0], 'paint'); b.box([0.02, 0.34, 0.045], [0, 0, 0], 'dark'); });
      visor(b, tx + 0.58, 2.0, s * 0.81, 0.16, 0.06, s > 0 ? '+z' : '-z', 0.29);
    }
  }
  b.box([0.16, 0.34, 0.76], [tx + 0.88, 1.94, 0], 'paint');
  gun(b, { at: [tx + 0.96, 1.95, -0.05], len: 1.55, r0: 0.045, r1: 0.035, muzzle: 'ring', sleeve: [0.26, 0.07] });
  mg(b, [tx + 0.96, 1.94, 0.15], 0.25); mg(b, [tx + 0.96, 1.94, 0.25], 0.25);
  cupola(b, tx - 0.72, 2.25, 0, 0.26, 0.14, 8);
  hatch(b, tx + 0.2, 2.25, 0, 0.4, 0.35);
  b.cyl([-2.99, 0.95, -0.7], [-2.99, 0.95, 0.7], 0.085, 0.085, b.n(12, 5), 'rust');
  headlight(b, 2.55, 1.3, 1.1); headlight(b, 2.55, 1.3, -1.1);
  tools(b, 0.9, 1.225, 1.2);
  antenna(b, 0.6, -1.9, 1.52, 1.345);
  crosses(b, -1.0, 1.42, 1.335, 0.34, [-2.93, 1.4]);
  turretNums(b, '421', tx + 0.3, 1.95, 0.82, 0.24, 0.29);
}

export function pz4(b: B): void {
  const W = [1.92, 1.38, 0.78, 0.24, -0.34, -0.88, -1.46, -2.0];
  runningGear(b, {
    zc: 1.225, tw: 0.38, tt: 0.06, pitch: 0.12, wheels: W, wr: 0.235, wstyle: 'twin',
    drive: { x: 2.58, y: 0.84, r: 0.33 }, idle: { x: -2.64, y: 0.78, r: 0.3 }, driveFront: true,
    rollers: [1.72, 0.55, -0.62, -1.78], rr: 0.1, ry: 1.13,
    springs: [[1.25, 2.0, 0.66, 0.04], [0.12, 0.87, 0.66, 0.04], [-1.0, -0.25, 0.66, 0.04], [-2.12, -1.37, 0.66, 0.04]], springOut: false,
    bogies: [[0, 1], [2, 3], [4, 5], [6, 7]],
  });
  hullBlock(b, [[-2.86, 0.5], [2.42, 0.5], [2.95, 0.9], [2.95, 1.06], [2.66, 1.25], [-2.9, 1.25]], 1.0);
  fenders(b, -2.86, 2.72, 1.26, 1.0, 1.415, 0.16, 0.1);
  hullBlock(b, [[-2.92, 1.25], [2.66, 1.25], [2.66, 1.72], [-2.25, 1.72], [-2.92, 1.56]], 1.36);
  visor(b, 2.67, 1.56, 0.5, 0.4, 0.14, '+x');
  if (b.hi) { b.cyl([2.66, 1.55, -0.5], [2.76, 1.55, -0.5], 0.11, 0.1, 12, 'paint'); b.cyl([2.75, 1.55, -0.5], [2.79, 1.55, -0.5], 0.04, 0.04, 8, 'dark'); }
  visor(b, 2.1, 1.58, 1.365, 0.3, 0.1, '+z'); visor(b, 2.1, 1.58, -1.365, 0.3, 0.1, '-z');
  louvers(b, -2.6, -1.1, 1.72, 0.9, 6);
  hatch(b, 1.9, 1.72, 0.62, 0.5, 0.45); hatch(b, 1.9, 1.72, -0.62, 0.5, 0.45);
  const tx = 0.22, tz = -0.07;
  b.frustum(tx - 0.98, tx + 0.98, 0.95, tx - 0.84, tx + 0.86, 0.8, 1.72, 2.38, 'paint', tz);
  if (b.hi) for (const s of [1, -1]) {
    b.with({ p: [tx + 0.05, 2.04, tz + s * 0.9], r: [-s * 0.24, 0, 0] }, () => { b.box([0.56, 0.42, 0.04], [0, 0, 0], 'paint'); b.box([0.02, 0.4, 0.045], [0, 0, 0], 'dark'); });
    visor(b, tx + 0.66, 2.1, tz + s * 0.88, 0.14, 0.06, s > 0 ? '+z' : '-z', 0.24);
  }
  b.box([0.2, 0.42, 0.84], [tx + 1.05, 2.04, tz], 'paint');
  gun(b, { at: [tx + 1.14, 2.05, tz - 0.04], len: 1.1, r0: 0.1, r1: 0.088, muzzle: 'ring', sleeve: [0.22, 0.13] });
  mg(b, [tx + 1.15, 2.02, tz + 0.28], 0.25);
  cupola(b, tx - 0.86, 2.33, tz, 0.3, 0.29, 8);
  hatch(b, tx + 0.2, 2.38, tz, 0.4, 0.4);
  if (b.hi) b.box([0.4, 0.08, 0.2], [tx + 0.55, 2.41, tz + 0.4], 'paint');
  b.cyl([-3.0, 1.0, -0.45], [-3.0, 1.0, 0.75], 0.09, 0.09, b.n(12, 5), 'rust');
  headlight(b, 2.62, 1.34, 1.12); headlight(b, 2.62, 1.34, -1.12);
  tools(b, 0.9, 1.285, 1.22);
  antenna(b, 0.5, -2.0, 1.6, 1.375);
  crosses(b, -0.95, 1.48, 1.365, 0.36, [-2.92, 1.44]);
  turretNums(b, '611', tx + 0.5, 2.08, tz + 0.89, 0.26, 0.24);
}

export function pz35t(b: B): void {
  const W = [1.43, 1.11, 0.79, 0.47, -0.37, -0.69, -1.01, -1.33];
  runningGear(b, {
    zc: 0.87, tw: 0.32, tt: 0.05, pitch: 0.1, wheels: W, wr: 0.15, wstyle: 'disc',
    drive: { x: -2.1, y: 0.52, r: 0.28 }, idle: { x: 2.06, y: 0.52, r: 0.26 }, driveFront: false,
    rollers: [1.45, 0.45, -0.5, -1.5], rr: 0.07, ry: 0.82,
    bogies: [[0, 1], [2, 3], [4, 5], [6, 7]],
    springs: [[0.35, 1.55, 0.5, 0.06], [-1.45, -0.25, 0.5, 0.06]], springOut: true,
  });
  hullBlock(b, [[-2.32, 0.3], [1.9, 0.3], [2.44, 0.62], [2.44, 0.96], [-2.36, 0.96]], 0.68);
  fenders(b, -2.3, 2.2, 0.97, 0.68, 1.03, 0.14, 0.08);
  hullBlock(b, [[-2.4, 0.96], [2.22, 0.96], [2.22, 1.4], [1.92, 1.56], [-1.2, 1.56], [-2.4, 1.4]], 0.92);
  visor(b, 2.23, 1.2, 0.35, 0.36, 0.14, '+x');
  if (b.hi) { b.cyl([2.2, 1.2, -0.4], [2.32, 1.2, -0.4], 0.09, 0.08, 12, 'paint'); b.cyl([2.3, 1.2, -0.4], [2.5, 1.2, -0.4], 0.03, 0.028, 8, 'metal'); }
  louvers(b, -2.2, -1.25, 1.44, 0.65, 5);
  rivets(b, rivetLine([2.235, 1.38, -0.85], [2.235, 1.38, 0.85], 9), 0);
  rivets(b, rivetLine([-2.2, 1.34, 0.925], [1.95, 1.52, 0.925], 14), -Math.PI / 2);
  rivets(b, rivetLine([-2.2, 1.34, -0.925], [1.95, 1.52, -0.925], 14), Math.PI / 2);
  rivets(b, rivetLine([-2.2, 1.0, 0.925], [2.1, 1.0, 0.925], 14), -Math.PI / 2);
  const tx = 0.32;
  b.frustum(tx - 0.74, tx + 0.72, 0.66, tx - 0.64, tx + 0.64, 0.58, 1.56, 2.06, 'paint');
  b.box([0.12, 0.3, 0.3], [tx + 0.74, 1.8, -0.12], 'paint');
  gun(b, { at: [tx + 0.8, 1.82, -0.12], len: 1.16, r0: 0.04, r1: 0.032, muzzle: 'ring', sleeve: [0.38, 0.065] });
  b.cyl([tx + 0.68, 1.8, 0.26], [tx + 0.82, 1.8, 0.26], 0.07, 0.06, b.n(10, 5), 'paint');
  mg(b, [tx + 0.82, 1.8, 0.26], 0.3);
  cupola(b, tx - 0.18, 2.06, 0, 0.22, 0.25, 6);
  if (b.hi) {
    rivets(b, rivetLine([tx + 0.715, 1.62, -0.58], [tx + 0.715, 1.62, 0.58], 7), 0);
    rivets(b, rivetLine([tx - 0.6, 1.62, 0.645], [tx + 0.6, 1.62, 0.645], 8), -Math.PI / 2);
    rivets(b, rivetLine([tx - 0.6, 1.62, -0.645], [tx + 0.6, 1.62, -0.645], 8), Math.PI / 2);
  }
  exhaust(b, -2.2, -1.5, 1.08, 0.86, 0.075);
  headlight(b, 2.2, 1.06, 0.78); headlight(b, 2.2, 1.06, -0.78);
  tools(b, 0.9, 0.995, 0.85);
  antenna(b, 1.4, -1.0, 1.32, -0.935);
  crosses(b, -0.55, 1.2, 0.93, 0.3, [-2.4, 1.18]);
  turretNums(b, '132', tx + 0.05, 1.84, 0.63, 0.2, 0.16);
}

export function pz38t(b: B): void {
  const W = [1.27, 0.41, -0.45, -1.31];
  runningGear(b, {
    zc: 0.925, tw: 0.29, tt: 0.05, pitch: 0.1, wheels: W, wr: 0.39, wstyle: 'big',
    drive: { x: 1.96, y: 0.74, r: 0.27 }, idle: { x: -1.98, y: 0.62, r: 0.24 }, driveFront: true,
    rollers: [0.84, -0.88], rr: 0.07, ry: 0.93,
    springs: [[0.3, 1.38, 0.66, -0.07], [-1.42, -0.34, 0.66, -0.07]], springOut: true,
  });
  if (b.hi) b.both(() => { for (const x of [0.84, -0.88]) b.frustum(x - 0.18, x + 0.18, 0.015, x - 0.06, x + 0.06, 0.015, 0.62, 0.88, 'paint', 1.05); });
  hullBlock(b, [[-2.26, 0.36], [1.76, 0.36], [2.31, 0.7], [2.31, 1.0], [-2.3, 1.0]], 0.75);
  fenders(b, -2.25, 2.1, 1.01, 0.75, 1.07, 0.14, 0.08);
  hullBlock(b, [[-2.3, 1.0], [2.06, 1.0], [2.06, 1.54], [1.86, 1.62], [-1.0, 1.62], [-2.3, 1.46]], 0.98);
  visor(b, 2.07, 1.32, 0.38, 0.36, 0.14, '+x');
  if (b.hi) { b.cyl([2.04, 1.3, -0.42], [2.16, 1.3, -0.42], 0.09, 0.08, 12, 'paint'); b.cyl([2.14, 1.3, -0.42], [2.3, 1.3, -0.42], 0.03, 0.028, 8, 'metal'); }
  louvers(b, -2.1, -1.1, 1.5, 0.7, 6);
  rivets(b, rivetLine([2.075, 1.5, -0.9], [2.075, 1.5, 0.9], 10), 0);
  rivets(b, rivetLine([2.075, 1.06, -0.9], [2.075, 1.06, 0.9], 10), 0);
  rivets(b, rivetLine([-2.1, 1.44, 0.985], [1.9, 1.58, 0.985], 14), -Math.PI / 2);
  rivets(b, rivetLine([-2.1, 1.44, -0.985], [1.9, 1.58, -0.985], 14), Math.PI / 2);
  const tx = 0.3;
  b.frustum(tx - 0.74, tx + 0.7, 0.68, tx - 0.64, tx + 0.64, 0.61, 1.62, 2.1, 'paint');
  b.frustum(tx + 0.66, tx + 0.8, 0.36, tx + 0.64, tx + 0.76, 0.32, 1.7, 2.02, 'paint');
  gun(b, { at: [tx + 0.8, 1.86, -0.08], len: 1.18, r0: 0.04, r1: 0.032, muzzle: 'ring', sleeve: [0.3, 0.06] });
  b.cyl([tx + 0.72, 1.84, 0.22], [tx + 0.86, 1.84, 0.22], 0.075, 0.065, b.n(10, 5), 'paint');
  mg(b, [tx + 0.86, 1.84, 0.22], 0.28);
  cupola(b, tx - 0.1, 2.1, 0.05, 0.22, 0.25, 6);
  if (b.hi) {
    rivets(b, rivetLine([tx + 0.62, 2.04, -0.55], [tx + 0.62, 2.04, 0.55], 7), 0);
    rivets(b, rivetLine([tx - 0.5, 1.68, 0.625], [tx + 0.5, 1.68, 0.625], 7), -Math.PI / 2);
    rivets(b, rivetLine([tx - 0.5, 1.68, -0.625], [tx + 0.5, 1.68, -0.625], 7), Math.PI / 2);
  }
  b.cyl([-2.36, 0.9, -0.55], [-2.36, 0.9, 0.55], 0.075, 0.075, b.n(12, 5), 'rust');
  headlight(b, 2.08, 1.1, 0.85); headlight(b, 2.08, 1.1, -0.85);
  tools(b, 0.8, 1.035, 0.9);
  antenna(b, 1.2, -1.2, 1.4, 0.995);
  crosses(b, -0.9, 1.26, 0.99, 0.32, [-2.3, 1.22]);
  turretNums(b, '323', tx + 0.05, 1.88, 0.615, 0.2, 0.12);
}

export function sevenTP(b: B): void {
  const W = [1.43, 1.09, 0.63, 0.29, -0.29, -0.63, -1.09, -1.43];
  runningGear(b, {
    zc: 1.06, tw: 0.26, tt: 0.05, pitch: 0.11, wheels: W, wr: 0.15, wstyle: 'disc',
    drive: { x: 2.0, y: 0.64, r: 0.24 }, idle: { x: -1.98, y: 0.48, r: 0.22 }, driveFront: true,
    rollers: [1.38, 0.46, -0.46, -1.38], rr: 0.07, ry: 0.86,
    bogies: [[0, 1], [2, 3], [4, 5], [6, 7]],
    springs: [[0.4, 1.35, 0.5, 0.07], [-1.35, -0.4, 0.5, 0.07]], springOut: true,
  });
  if (b.hi) b.both(() => { for (const x of [0.86, -0.86]) b.frustum(x - 0.1, x + 0.1, 0.02, x - 0.05, x + 0.05, 0.02, 0.5, 0.92, 'paint', 1.22); });
  hullBlock(b, [[-2.2, 0.3], [1.76, 0.3], [2.28, 0.6], [2.28, 1.0], [-2.25, 1.0]], 0.9);
  fenders(b, -2.2, 2.1, 1.01, 0.9, 1.2, 0.2, 0.08);
  // 上部：前部驾驶室 + 抬高的柴油机舱（7TP 特征）
  hullBlock(b, [[-2.28, 1.0], [2.22, 1.0], [1.95, 1.34], [1.4, 1.5], [-2.1, 1.5], [-2.28, 1.3]], 0.98);
  visor(b, 1.96, 1.33, 0.42, 0.34, 0.12, '+x', 0.67);
  louvers(b, -1.95, -0.75, 1.5, 0.45, 6);
  b.box([0.95, 0.14, 0.34], [-1.3, 1.57, -0.6], 'paint'); // 左后进气装甲罩
  rivets(b, rivetLine([-2.1, 1.08, 0.985], [2.0, 1.08, 0.985], 16), -Math.PI / 2);
  rivets(b, rivetLine([-2.1, 1.08, -0.985], [2.0, 1.08, -0.985], 16), Math.PI / 2);
  // 博福斯炮塔（带尾舱）+ 格恩德拉赫潜望镜
  const tx = 0.35, tz = -0.05;
  b.frustum(tx - 0.58, tx + 0.58, 0.64, tx - 0.5, tx + 0.5, 0.53, 1.5, 2.1, 'paint', tz);
  b.frustum(tx - 0.9, tx - 0.52, 0.44, tx - 0.84, tx - 0.5, 0.4, 1.58, 2.02, 'paint', tz);
  b.cyl([tx + 0.5, 1.82, tz], [tx + 0.64, 1.82, tz], 0.2, 0.16, b.n(12, 6), 'paint');
  gun(b, { at: [tx + 0.62, 1.82, tz - 0.02], len: 1.3, r0: 0.042, r1: 0.03, muzzle: 'ring', sleeve: [0.2, 0.07] });
  mg(b, [tx + 0.55, 1.8, tz - 0.3], 0.3);
  if (b.hi) b.cyl([tx + 0.5, 1.8, tz - 0.3], [tx + 0.6, 1.8, tz - 0.3], 0.06, 0.05, 10, 'paint');
  b.box([0.14, 0.16, 0.14], [tx + 0.1, 2.18, tz + 0.2], 'paint');
  if (b.hi) b.box([0.02, 0.05, 0.1], [tx + 0.18, 2.2, tz + 0.2], 'glass');
  hatch(b, tx - 0.2, 2.1, tz - 0.12, 0.42, 0.42, true);
  if (b.hi) rivets(b, rivetLine([tx - 0.45, 1.6, tz + 0.6], [tx + 0.45, 1.6, tz + 0.6], 7), -Math.PI / 2);
  exhaust(b, -2.05, -1.2, 1.1, 1.07, 0.085);
  headlight(b, 2.12, 1.16, 0.75); headlight(b, 2.12, 1.16, -0.75);
  tools(b, 0.8, 1.035, -1.1);
  b.decal({ kind: 'plate', text: '1427', pos: [-2.29, 1.18, 0], face: '-x', size: 0.12 });
  b.decal({ kind: 'plate', text: '1427', pos: [2.1, 1.2, -0.3], face: '+x', size: 0.1, tilt: 0.9 });
}

export function tks(b: B): void {
  runningGear(b, {
    zc: 0.78, tw: 0.17, tt: 0.035, pitch: 0.07, wheels: [0.64, 0.32, -0.2, -0.52], wr: 0.13, wstyle: 'disc',
    drive: { x: 1.02, y: 0.38, r: 0.17 }, idle: { x: -1.06, y: 0.26, r: 0.16 }, driveFront: true,
    rollers: [0.42, -0.36], rr: 0.05, ry: 0.52,
    bogies: [[0, 1], [2, 3]], girder: [-0.62, 0.74, 0.34],
  });
  // 低矮车体 + 两个乘员装甲罩 + 前右机枪
  hullBlock(b, [[-1.26, 0.2], [0.9, 0.2], [1.28, 0.44], [1.28, 0.6], [0.78, 0.94], [-0.45, 0.94], [-1.26, 0.72]], 0.69);
  fenders(b, -1.1, 0.95, 0.6, 0.69, 0.88, 0.12, 0.06);
  for (const z of [0.3, -0.28]) {
    b.frustum(0.12, 0.72, 0.25, 0.2, 0.52, 0.2, 0.94, 1.22, 'paint', z);
    b.box([0.12, 0.1, 0.12], [0.35, 1.27, z], 'paint');
    if (b.hi) { b.box([0.02, 0.04, 0.1], [0.42, 1.28, z], 'glass'); visor(b, 0.66, 1.08, z, 0.2, 0.06, '+x', 0.6); }
  }
  b.sphere([0.98, 0.77, 0.3], [0.1, 0.1, 0.1], 'paint', b.n(10, 5), b.n(6, 3));
  mg(b, [1.02, 0.77, 0.3], 0.3);
  louvers(b, -1.1, -0.5, 0.82, 0.5, 4);
  exhaust(b, -1.0, -0.5, 0.7, 0.8, 0.055);
  headlight(b, 1.05, 0.66, -0.5, 0.06);
  if (b.hi) b.box([0.03, 0.18, 0.5], [-1.28, 0.55, 0], 'paint');
  b.decal({ kind: 'plate', text: '1181', pos: [-1.29, 0.5, 0], face: '-x', size: 0.1 });
}

export function sdkfz231(b: B): void {
  const ax = [-1.78, -0.68, 0.68, 1.78];
  const r = 0.44, w = 0.24, zc = 0.95;
  b.both(() => { for (const x of ax) roadWheel(b, x, r, zc, r, w, 'car'); });
  // 底盘 + 船形车体（双向驾驶，前后对称斜面）
  b.box([4.2, 0.2, 1.2], [0, 0.42, 0], 'dark');
  b.hexa([
    [-2.3, 0.36, -0.52], [2.3, 0.36, -0.52], [2.3, 0.36, 0.52], [-2.3, 0.36, 0.52],
    [-2.9, 0.96, -0.84], [2.92, 0.96, -0.84], [2.92, 0.96, 0.84], [-2.9, 0.96, 0.84],
  ], 'paint');
  b.hexa([
    [-2.9, 0.96, -0.84], [2.92, 0.96, -0.84], [2.92, 0.96, 0.84], [-2.9, 0.96, 0.84],
    [-2.1, 1.72, -0.66], [2.15, 1.72, -0.66], [2.15, 1.72, 0.66], [-2.1, 1.72, 0.66],
  ], 'paint');
  // 翼子板 + 储物箱
  b.both(() => {
    b.box([1.9, 0.03, 0.26], [1.23, 1.0, 0.97], 'paint');
    b.box([1.9, 0.03, 0.26], [-1.23, 1.0, 0.97], 'paint');
    b.box([0.46, 0.26, 0.22], [0, 1.1, 0.95], 'paint');
    for (const s of [1, -1]) {
      b.box([0.28, 0.03, 0.26], [s * 2.3, 0.9, 0.97], 'paint', [0, 0, s * 0.5]);
      b.box([0.28, 0.03, 0.26], [s * 0.16 + s * 0.2, 0.9, 0.97], 'paint', [0, 0, -s * 0.6]);
    }
    if (b.hi) for (const x of [2.0, -2.0]) visor(b, x, 1.3, 0.77, 0.26, 0.08, '+z', 0.23);
  });
  visor(b, 2.55, 1.32, 0.3, 0.34, 0.1, '+x', 0.78);
  visor(b, -2.5, 1.32, -0.3, 0.34, 0.1, '-x', 0.8);
  // 炮塔：扁平多面体 + 20 mm KwK 30 + 防手榴弹网
  const tx = -0.15;
  b.poly([
    [tx - 0.6, 1.72, -0.58], [tx + 0.45, 1.72, -0.58], [tx + 0.72, 1.72, -0.3], [tx + 0.72, 1.72, 0.3], [tx + 0.45, 1.72, 0.58], [tx - 0.6, 1.72, 0.58],
    [tx - 0.5, 2.2, -0.48], [tx + 0.4, 2.2, -0.48], [tx + 0.6, 2.2, -0.24], [tx + 0.6, 2.2, 0.24], [tx + 0.4, 2.2, 0.48], [tx - 0.5, 2.2, 0.48],
  ], [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [0, 1, 7, 6], [1, 2, 8, 7], [2, 3, 9, 8], [3, 4, 10, 9], [4, 5, 11, 10], [5, 0, 6, 11]], 'paint');
  b.box([0.1, 0.22, 0.44], [tx + 0.7, 1.95, 0], 'paint');
  gun(b, { at: [tx + 0.75, 1.96, -0.08], len: 0.95, r0: 0.03, r1: 0.024, muzzle: 'ring', sleeve: [0.3, 0.05] });
  mg(b, [tx + 0.75, 1.95, 0.12], 0.3);
  if (b.hi) {
    for (let i = 0; i <= 4; i++) b.cyl([tx - 0.5 + i * 0.25, 2.3, -0.46], [tx - 0.5 + i * 0.25, 2.3, 0.46], 0.01, 0.01, 4, 'metal');
    for (const z of [-0.46, 0, 0.46]) b.cyl([tx - 0.5, 2.3, z], [tx + 0.5, 2.3, z], 0.01, 0.01, 4, 'metal');
    for (const [x, z] of [[-0.5, -0.46], [0.5, -0.46], [-0.5, 0.46], [0.5, 0.46]]) b.cyl([tx + x, 2.2, z], [tx + x, 2.3, z], 0.012, 0.012, 4, 'metal');
  } else b.box([1.0, 0.04, 0.92], [tx, 2.3, 0], 'metal');
  headlight(b, 2.65, 1.12, 0.6); headlight(b, 2.65, 1.12, -0.6);
  exhaust(b, -2.4, -1.9, 1.08, -0.9, 0.07);
  antenna(b, 1.6, -1.6, 1.65, 0.7);
  crosses(b, 1.3, 1.32, 0.76, 0.3);
  b.decal({ kind: 'cross', pos: [-2.55, 1.3, 0.35], face: '-x', size: 0.22, tilt: -0.7 });
  turretNums(b, 'N3', tx - 0.05, 1.95, 0.54, 0.16, 0.2);
}

export function wz34(b: B): void {
  const r = 0.37, w = 0.2, zc = 0.76;
  b.both(() => { for (const x of [1.05, -0.95]) roadWheel(b, x, r, zc, r, w, 'car'); });
  b.box([3.1, 0.14, 1.0], [0.05, 0.42, 0], 'dark');
  // 发动机罩（前）+ 战斗室 + 后斜板
  b.hexa([
    [0.45, 0.5, -0.62], [1.62, 0.5, -0.58], [1.62, 0.5, 0.58], [0.45, 0.5, 0.62],
    [0.45, 1.3, -0.58], [1.3, 1.08, -0.46], [1.3, 1.08, 0.46], [0.45, 1.3, 0.58],
  ], 'paint');
  b.hexa([
    [1.62, 0.5, -0.58], [1.8, 0.58, -0.5], [1.8, 0.58, 0.5], [1.62, 0.5, 0.58],
    [1.3, 1.08, -0.46], [1.62, 0.92, -0.42], [1.62, 0.92, 0.42], [1.3, 1.08, 0.46],
  ], 'paint');
  b.hexa([
    [-1.62, 0.5, -0.66], [0.45, 0.5, -0.66], [0.45, 0.5, 0.66], [-1.62, 0.5, 0.66],
    [-1.45, 1.58, -0.56], [0.4, 1.58, -0.56], [0.4, 1.58, 0.56], [-1.45, 1.58, 0.56],
  ], 'paint');
  // 翼子板
  b.both(() => {
    b.box([0.9, 0.025, 0.28], [1.05, 0.85, 0.8], 'paint');
    b.box([0.3, 0.025, 0.28], [1.6, 0.74, 0.8], 'paint', [0, 0, -0.6]);
    b.box([0.8, 0.025, 0.28], [-0.95, 0.85, 0.8], 'paint');
    b.box([0.3, 0.025, 0.28], [-1.47, 0.76, 0.8], 'paint', [0, 0, 0.6]);
    b.box([0.8, 0.02, 0.18], [0.05, 0.6, 0.74], 'paint');
  });
  if (b.hi) for (let i = 0; i < 5; i++) b.box([0.012, 0.018, 0.72], [1.63 + i * 0.037, 0.56 + i * 0.07, 0], 'dark', [0, 0, 0]);
  visor(b, 0.44, 1.32, 0.25, 0.3, 0.1, '+x');
  // 多面炮塔 + 37 mm SA-18 短炮
  const tx = -0.5;
  b.cyl([tx, 1.58, 0], [tx, 2.06, 0], 0.46, 0.4, b.n(8, 8), 'paint', false, Math.PI / 8);
  b.cyl([tx, 2.06, 0], [tx, 2.18, 0], 0.4, 0.28, b.n(8, 8), 'paint', false, Math.PI / 8);
  b.box([0.12, 0.2, 0.22], [tx + 0.44, 1.84, 0], 'paint');
  gun(b, { at: [tx + 0.5, 1.84, 0], len: 0.5, r0: 0.04, r1: 0.036, muzzle: 'ring' });
  hatch(b, tx - 0.05, 2.18, 0, 0.3, 0.3, true);
  headlight(b, 1.4, 1.0, 0.55); headlight(b, 1.4, 1.0, -0.55);
  b.cyl([-1.63, 0.95, 0], [-1.84, 0.95, 0], 0.32, 0.32, b.n(16, 7), 'rubber');
  b.cyl([-1.62, 0.95, 0], [-1.86, 0.95, 0], 0.2, 0.2, b.n(12, 5), 'paint');
  b.decal({ kind: 'plate', text: '6051', pos: [-1.63, 0.62, 0], face: '-x', size: 0.1 });
}

export function t26(b: B): void {
  const W = [1.43, 1.09, 0.63, 0.29, -0.29, -0.63, -1.09, -1.43];
  runningGear(b, {
    zc: 1.08, tw: 0.26, tt: 0.05, pitch: 0.1, wheels: W, wr: 0.15, wstyle: 'disc',
    drive: { x: 2.02, y: 0.62, r: 0.24 }, idle: { x: -2.0, y: 0.46, r: 0.22 }, driveFront: true,
    rollers: [1.38, 0.46, -0.46, -1.38], rr: 0.07, ry: 0.85,
    bogies: [[0, 1], [2, 3], [4, 5], [6, 7]],
    springs: [[0.4, 1.35, 0.5, 0.07], [-1.35, -0.4, 0.5, 0.07]], springOut: true,
  });
  if (b.hi) b.both(() => { for (const x of [0.86, -0.86]) b.frustum(x - 0.1, x + 0.1, 0.02, x - 0.05, x + 0.05, 0.02, 0.5, 0.9, 'paint', 1.24); });
  hullBlock(b, [[-2.28, 0.3], [1.74, 0.3], [2.32, 0.6], [2.32, 0.98], [-2.3, 0.98]], 0.92);
  fenders(b, -2.2, 2.12, 0.99, 0.92, 1.22, 0.2, 0.08);
  hullBlock(b, [[-2.32, 0.98], [2.18, 0.98], [1.9, 1.34], [1.55, 1.44], [-1.7, 1.44], [-2.32, 1.3]], 1.04);
  visor(b, 1.75, 1.39, 0.45, 0.4, 0.1, '+x', 1.2);
  louvers(b, -2.1, -0.8, 1.44, 0.7, 7);
  // 圆柱炮塔 + 尾舱 + 45 mm 20-K
  const tx = 0.22, tz = -0.1;
  b.cyl([tx, 1.44, tz], [tx, 2.06, tz], 0.64, 0.64, b.n(24, 9), 'paint');
  b.frustum(tx - 1.0, tx - 0.4, 0.42, tx - 0.96, tx - 0.4, 0.38, 1.52, 1.98, 'paint', tz);
  b.box([0.16, 0.34, 0.5], [tx + 0.66, 1.76, tz], 'paint');
  gun(b, { at: [tx + 0.72, 1.77, tz + 0.04], len: 1.4, r0: 0.045, r1: 0.034, muzzle: 'ring', sleeve: [0.16, 0.07] });
  mg(b, [tx + 0.72, 1.76, tz - 0.14], 0.25);
  hatch(b, tx - 0.1, 2.06, tz, 0.5, 0.5, true);
  b.cyl([tx + 0.3, 2.06, tz + 0.28], [tx + 0.3, 2.2, tz + 0.28], 0.06, 0.05, b.n(8, 4), 'paint');
  if (b.hi) b.cyl([tx - 0.3, 2.06, tz - 0.28], [tx - 0.3, 2.14, tz - 0.28], 0.05, 0.05, 8, 'paint');
  exhaust(b, -2.1, -1.3, 1.08, -1.07, 0.08);
  headlight(b, 1.92, 1.36, 0.0, 0.09);
  tools(b, 0.8, 1.015, 1.07);
  b.decal({ kind: 'star', pos: [tx, 1.8, tz + 0.66], face: '+z', size: 0.2 });
  b.decal({ kind: 'star', pos: [tx, 1.8, tz - 0.66], face: '-z', size: 0.2 });
}

export function bt7(b: B): void {
  const W = [1.8, 0.86, -0.44, -1.4];
  runningGear(b, {
    zc: 1.015, tw: 0.26, tt: 0.05, pitch: 0.25, horns: 'alt', wheels: W, wr: 0.415, wstyle: 'big',
    drive: { x: -2.36, y: 0.62, r: 0.32 }, idle: { x: 2.48, y: 0.64, r: 0.3 }, driveFront: false,
    rollers: [], rr: 0.05, ry: 0.5, arms: true,
  });
  // 楔形车首（BT 特征）
  b.poly([
    [-2.72, 0.36, -0.85], [2.1, 0.36, -0.85], [2.72, 0.5, -0.36], [2.72, 0.5, 0.36], [2.1, 0.36, 0.85], [-2.72, 0.36, 0.85],
    [-2.8, 1.04, -0.85], [2.2, 1.04, -0.85], [2.82, 0.92, -0.38], [2.82, 0.92, 0.38], [2.2, 1.04, 0.85], [-2.8, 1.04, 0.85],
  ], [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11], [0, 1, 7, 6], [1, 2, 8, 7], [2, 3, 9, 8], [3, 4, 10, 9], [4, 5, 11, 10], [5, 0, 6, 11]], 'paint');
  fenders(b, -2.7, 2.35, 1.05, 0.85, 1.145, 0.22, 0.14);
  hullBlock(b, [[-2.8, 1.04], [2.2, 1.04], [1.78, 1.52], [-1.4, 1.52], [-2.8, 1.3]], 0.98);
  visor(b, 2.0, 1.28, 0, 0.4, 0.12, '+x', 0.72);
  hatch(b, 1.86, 1.4, 0, 0.36, 0.3);
  louvers(b, -2.6, -1.5, 1.4, 0.7, 5);
  // 两根排气管（后部）
  for (const z of [0.3, -0.3]) b.cyl([-2.72, 1.2, z], [-2.95, 1.12, z], 0.06, 0.06, b.n(10, 5), 'rust');
  // 椭圆柱炮塔 + 大尾舱 + 45 mm
  const tx = 0.4;
  b.with({ s: [1.12, 1, 1] }, () => b.cyl([tx / 1.12, 1.52, 0], [tx / 1.12, 2.18, 0], 0.66, 0.64, b.n(24, 9), 'paint'));
  b.frustum(tx - 1.22, tx - 0.5, 0.46, tx - 1.16, tx - 0.5, 0.42, 1.6, 2.1, 'paint');
  b.box([0.18, 0.36, 0.52], [tx + 0.76, 1.86, 0], 'paint');
  gun(b, { at: [tx + 0.84, 1.87, 0.04], len: 1.46, r0: 0.045, r1: 0.034, muzzle: 'ring', sleeve: [0.16, 0.07] });
  mg(b, [tx + 0.84, 1.86, -0.14], 0.25);
  hatch(b, tx - 0.1, 2.18, 0.05, 0.62, 0.4);
  b.cyl([tx + 0.3, 2.18, -0.3], [tx + 0.3, 2.38, -0.3], 0.06, 0.05, b.n(8, 4), 'paint');
  headlight(b, 2.4, 1.28, 0.45, 0.09); headlight(b, 2.4, 1.28, -0.45, 0.09);
  tools(b, 0.8, 1.075, 1.0);
  b.decal({ kind: 'star', pos: [tx, 1.86, 0.672], face: '+z', size: 0.22 });
  b.decal({ kind: 'star', pos: [tx, 1.86, -0.672], face: '-z', size: 0.22 });
}

