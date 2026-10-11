/**
 * 1940 aircraft, metres: +X nose, +Y up, +Z starboard.
 * Height is the parked envelope with gear down; B recentres the lowest point to y=0.
 * Both LODs retain the airframe outline, cockpit, propellers, undercarriage and national markings.
 */
import { B, type V2, type V3 } from './builder';
import type { Role } from './paint';
import { MODEL_SPECS } from './specs';

type AircraftId = 'spitfire' | 'hurricane' | 'bf109' | 'bf110' | 'he111' | 'do17' | 'ju87' | 'ju88';
/** x, centre y, vertical radius, lateral radius. */
type BodyStation = [number, number, number, number];
/** spanwise z, leading edge x, trailing edge x, centre y. */
type WingStation = [number, number, number, number];

function loft(b: B, stations: BodyStation[], zc = 0, role: Role = 'paint', underside: Role = 'belly') {
  const n = b.n(24, 8);
  const ring = (s: BodyStation) => Array.from({ length: n }, (_, i): V3 => {
    const a = i / n * Math.PI * 2;
    return [s[0], s[1] + s[2] * Math.cos(a), zc + s[3] * Math.sin(a)];
  });
  const rings = stations.map(ring);
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n, a = (j + .5) / n * Math.PI * 2;
      b.tris([[rings[i][j], rings[i + 1][j], rings[i + 1][k]], [rings[i][j], rings[i + 1][k], rings[i][k]]],
        Math.cos(a) < -.25 ? underside : role, [0, Math.cos(a), Math.sin(a)]);
    }
  }
  for (const i of [0, stations.length - 1]) {
    const centre: V3 = [stations[i][0], stations[i][1], zc];
    b.tris(rings[i].map((p, j) => [centre, p, rings[i][(j + 1) % n]]), role, [i ? 1 : -1, 0, 0]);
  }
}

function wings(b: B, stations: WingStation[], thickness: number) {
  b.both(() => {
    for (let i = 0; i < stations.length - 1; i++) {
      const [z0, f0, r0, y0] = stations[i], [z1, f1, r1, y1] = stations[i + 1];
      const h = thickness / 2;
      const pts: V3[] = [[r0, y0 - h, z0], [f0, y0 - h, z0], [f1, y1 - h, z1], [r1, y1 - h, z1],
        [r0, y0 + h, z0], [f0, y0 + h, z0], [f1, y1 + h, z1], [r1, y1 + h, z1]];
      b.poly(pts, [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'paint');
      b.tris([[pts[0], pts[1], pts[2]], [pts[0], pts[2], pts[3]]], 'belly', [0, -1, 0]);
    }
  });
}

function propeller(b: B, x: number, y: number, z: number, radius: number, spinnerLength: number, yellow = false) {
  b.cyl([x, y, z], [x + spinnerLength, y, z], radius * .19, 0, b.n(24, 8), yellow ? 'yellow' : 'paint');
  for (let i = 0; i < 3; i++) {
    b.with({ p: [x, y, z], r: [i * Math.PI * 2 / 3, 0, 0] }, () => {
      const t = radius * .025, w = radius * .085;
      b.hexa([[-t, radius * .12, -w], [t, radius * .12, -w], [t, radius, -w * .35], [-t, radius, -w * .35],
        [-t, radius * .12, w], [t, radius * .12, w], [t, radius, w * .35], [-t, radius, w * .35]], 'dark');
      if (b.hi) b.box([t * 2.1, radius * .055, w], [0, radius * .96, 0], 'yellow');
    });
  }
}

function cockpit(b: B, x0: number, x1: number, y: number, width: number, height: number) {
  const p: V2[] = [[x0, y], [x1, y], [x1 - (x1 - x0) * .15, y + height * .65],
    [x1 - (x1 - x0) * .37, y + height], [x0 + (x1 - x0) * .18, y + height * .95]];
  b.prism(p, -width / 2, width / 2, 'glass', 0);
  if (b.hi) {
    for (const z of [-width / 2, width / 2]) {
      for (let i = 0; i < p.length; i++) b.cyl([p[i][0], p[i][1], z], [p[(i + 1) % p.length][0], p[(i + 1) % p.length][1], z], .017, .017, 4, 'paint');
      for (const f of [.2, .57, .82]) {
        const x = x0 + (x1 - x0) * f;
        b.cyl([x, y, z], [x, y + height * .9, z], .016, .016, 4, 'paint');
      }
    }
  }
}

function tail(b: B, length: number, span: number, height: number, y: number, twin = false, rounded = false) {
  wings(b, [[0, -length * .32, -length * .49, y], [span * .14, -length * .35, -length * .47, y + .03],
    [span * .19, -length * .40, -length * .45, y + .045]], height * .025);
  const profile: V2[] = rounded
    ? [[-length * .49, y], [-length * .29, y], [-length * .35, height * .88], [-length * .40, height], [-length * .44, height], [-length * .48, height * .90]]
    : [[-length * .49, y], [-length * .29, y], [-length * .35, height], [-length * .43, height], [-length * .48, height * .83]];
  for (const z of twin ? [-span * .145, span * .145] : [0]) b.prism(profile, z - .045, z + .045, 'paint', 0);
}

function landingGear(b: B, length: number, height: number, topY: number, z: number, fixed = false) {
  const radius = height * .085, x = length * .035;
  for (const side of [-1, 1]) {
    const zz = z * side;
    b.cyl([x - .15, topY, zz * .88], [x + .07, radius, zz], fixed ? .075 : .045, .045, b.n(10, 5), 'metal');
    b.wheelDisc(x + .07, radius, zz, radius, radius * .38, b.n(20, 7), 'rubber');
    if (fixed) {
      b.sphere([x + .03, radius * 1.15, zz], [radius * 1.5, radius * .95, radius * .38], 'paint', b.n(16, 6), b.n(8, 4));
      b.frustum(x - .10, x + .10, .085, x - .18, x + .12, .06, radius * 1.7, topY, 'paint', zz);
    } else if (b.hi) {
      b.box([radius * .6, topY * .6, .04], [x - .08, topY * .68, zz], 'belly');
      b.wheelDisc(x + .07, radius, zz + side * radius * .20, radius * .48, .015, 12, 'metal');
    }
  }
  const r = radius * .47;
  b.cyl([-length * .43, topY * .95, 0], [-length * .43, r, 0], .027, .027, b.n(8, 4), 'metal');
  b.wheelDisc(-length * .43, r, 0, r, r * .5, b.n(14, 6), 'rubber');
}

function marking(b: B, p: V3, size: number, raf: boolean, face: '+y' | '+z' | '-z', surface?: (z: number) => number) {
  // Geometry keeps insignia visible in instancing and node builds; decals sharpen the displayed version.
  const point = (u: number, v: number, lift: number): V3 => face === '+y'
    ? [p[0] + u, (surface ? surface(p[2] + v) : p[1]) + lift, p[2] + v] : [p[0] + u, p[1] + v, p[2] + (face === '+z' ? lift : -lift)];
  const out: V3 = face === '+y' ? [0, 1, 0] : [0, 0, face === '+z' ? 1 : -1];
  if (raf) {
    for (const [f, role] of [[.5, 'blue'], [.33, 'white'], [.17, 'red']] as const) {
      const n = b.n(28, 10), r = size * f, lift = .002 + (.5 - f) * .012;
      b.tris(Array.from({ length: n }, (_, i) => [point(0, 0, lift), point(Math.cos(i * 2 * Math.PI / n) * r, Math.sin(i * 2 * Math.PI / n) * r, lift),
        point(Math.cos((i + 1) * 2 * Math.PI / n) * r, Math.sin((i + 1) * 2 * Math.PI / n) * r, lift)]), role, out);
    }
  } else {
    for (const [w, len, role, lift] of [[.18, .5, 'white', .003], [.10, .45, 'dark', .009]] as const) {
      for (const vertical of [false, true]) {
        const a = size * (vertical ? w : len), c = size * (vertical ? len : w);
        const q = [point(-a, -c, lift), point(a, -c, lift), point(a, c, lift), point(-a, c, lift)];
        b.tris([[q[0], q[1], q[2]], [q[0], q[2], q[3]]], role, out);
      }
    }
  }
  const tilt = surface ? Math.atan((surface(p[2] + .01) - surface(p[2] - .01)) / .02) : undefined;
  b.decal({ kind: raf ? 'roundel' : 'air_cross', face, pos: point(0, 0, .014), size, tilt });
}

function insignia(b: B, length: number, span: number, cy: number, stations: WingStation[], thickness: number, bodyRadius: number, raf = false) {
  const surface = (z: number) => {
    const zz = Math.abs(z);
    const i = Math.max(0, stations.findIndex(s => s[0] >= zz) - 1);
    const a = stations[i], c = stations[i + 1];
    return a[3] + (c[3] - a[3]) * (zz - a[0]) / (c[0] - a[0]) + thickness / 2;
  };
  for (const side of [-1, 1]) {
    marking(b, [-length * .03, surface(span * .34), side * span * .34], span * .105, raf, '+y', surface);
    marking(b, [-length * .21, cy, side * bodyRadius], heightMark(length), raf, side > 0 ? '+z' : '-z');
  }
}
const heightMark = (length: number) => length * .064;

function fuselage(b: B, length: number, height: number, cy: number, width: number, end = .44) {
  loft(b, [[-length / 2, cy, .018, .018], [-length * .42, cy, height * .055, width * .28],
    [-length * .28, cy, height * .09, width * .62], [-length * .10, cy, height * .14, width],
    [length * .08, cy, height * .145, width], [length * .26, cy, height * .125, width * .87],
    [length * end, cy, height * .09, width * .68]]);
}

function exhausts(b: B, x: number, y: number, z: number, length: number) {
  if (!b.hi) return;
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const xx = x + i * length / 8;
    b.cyl([xx, y, s * z], [xx - .05, y - .02, s * (z + .07)], .035, .031, 6, 'rust');
  }
}

export function spitfire(b: B) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS.spitfire, cy = H * .54, wy = cy - H * .075;
  fuselage(b, L, H, cy, L * .045);
  // Elliptical leading and trailing edges, including the narrow rounded tip.
  const wing: WingStation[] = [[0, L * .15, -L * .24, wy], [W * .18, L * .18, -L * .22, wy + .10],
    [W * .34, L * .14, -L * .17, wy + .20], [W * .44, L * .065, -L * .10, wy + .26],
    [W / 2, -L * .015, -L * .028, wy + .30]];
  wings(b, wing, H * .037);
  cockpit(b, -L * .12, L * .105, cy + H * .12, L * .065, H * .18);
  tail(b, L, W, H, cy + H * .07, false, true);
  propeller(b, L * .445, cy, 0, H * .34, L * .055);
  landingGear(b, L, H, wy, W * .075);
  b.box([L * .12, H * .075, W * .045], [-L * .03, wy - H * .065, W * .15], 'belly');
  exhausts(b, L * .23, cy + H * .015, L * .044, L * .12);
  insignia(b, L, W, cy, wing, H * .037, L * .045 * .78, true);
}

export function hurricane(b: B) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS.hurricane, cy = H * .54, wy = cy - H * .09;
  fuselage(b, L, H, cy, L * .052);
  const wing: WingStation[] = [[0, L * .15, -L * .25, wy], [W * .18, L * .15, -L * .24, wy + .075],
    [W * .43, L * .08, -L * .14, wy + .18], [W / 2, L * .005, -L * .095, wy + .22]];
  wings(b, wing, H * .055);
  cockpit(b, -L * .13, L * .075, cy + H * .14, L * .071, H * .17);
  tail(b, L, W, H, cy + H * .09, false, true);
  propeller(b, L * .445, cy, 0, H * .35, L * .055);
  landingGear(b, L, H, wy, W * .08);
  // Deep radiator bath and high rear fuselage distinguish the Hurricane from the Spitfire.
  b.frustum(-L * .14, L * .01, L * .025, -L * .16, L * .015, L * .03, cy - H * .25, wy, 'belly');
  if (b.hi) for (let i = 0; i < 9; i++) b.cyl([-L * .38 + i * L * .025, cy + H * .08, L * .027], [-L * .38 + i * L * .025, cy - H * .055, L * .027], .01, .01, 4, 'canvas');
  exhausts(b, L * .23, cy, L * .048, L * .12);
  insignia(b, L, W, cy, wing, H * .055, L * .052 * .78, true);
}

export function bf109(b: B) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS.bf109, cy = H * .53, wy = cy - H * .06;
  fuselage(b, L, H, cy, L * .042);
  const wing: WingStation[] = [[0, L * .155, -L * .18, wy], [W * .40, L * .075, -L * .13, wy + .13],
    [W / 2, L * .03, -L * .095, wy + .17]];
  wings(b, wing, H * .04);
  cockpit(b, -L * .075, L * .115, cy + H * .13, L * .064, H * .19);
  tail(b, L, W, H, cy + H * .08);
  b.cyl([L * .38, cy, 0], [L * .443, cy, 0], H * .10, H * .09, b.n(24, 8), 'yellow');
  propeller(b, L * .445, cy, 0, H * .36, L * .055, true);
  landingGear(b, L, H, wy, W * .067);
  for (const s of [-1, 1]) b.box([L * .09, H * .09, W * .05], [L * .02, wy - H * .08, s * W * .16], 'belly');
  exhausts(b, L * .24, cy, L * .04, L * .10);
  insignia(b, L, W, cy, wing, H * .04, L * .042 * .78);
}

function twinEngines(b: B, L: number, W: number, H: number, y: number, z: number, radial = false) {
  for (const s of [-1, 1]) {
    const r = W * (radial ? .031 : .024);
    loft(b, [[-L * .17, y, H * .045, r * .42], [-L * .06, y, H * .13, r],
      [L * .20, y, H * .135, r], [L * .27, y, H * .11, r * .85]], s * z);
    if (radial) b.cyl([L * .21, y, s * z], [L * .275, y, s * z], r, r, b.n(24, 8), 'metal');
    propeller(b, L * .28, y, s * z, H * .33, L * .033);
    if (b.hi) b.box([L * .10, H * .045, r * 1.3], [L * .09, y - H * .15, s * z], 'belly');
  }
}

export function bf110(b: B) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS.bf110, cy = H * .49, wy = cy - H * .025;
  fuselage(b, L, H, cy, L * .033, .50);
  const wing: WingStation[] = [[0, L * .12, -L * .23, wy], [W * .18, L * .12, -L * .22, wy],
    [W * .46, L * .015, -L * .125, wy + .13], [W / 2, -L * .025, -L * .095, wy + .15]];
  wings(b, wing, H * .05);
  twinEngines(b, L, W, H, cy, W * .155);
  cockpit(b, -L * .16, L * .19, cy + H * .13, L * .06, H * .21);
  tail(b, L, W, H, cy + H * .075, true);
  landingGear(b, L, H, wy, W * .155);
  if (b.hi) for (const z of [-.11, .11]) b.cyl([L * .42, cy + .12, z], [L * .497, cy + .12, z], .025, .025, 6, 'dark');
  insignia(b, L, W, cy, wing, H * .05, L * .033 * .78);
}

function bomber(b: B, id: AircraftId, narrow: boolean, shoulder: boolean, glazedNose: boolean) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS[id], cy = H * .53, wy = cy + H * (shoulder ? .09 : -.07), wr = L * (narrow ? .035 : .055);
  fuselage(b, L, H, cy, wr, glazedNose ? .29 : .50);
  if (glazedNose) {
    loft(b, [[L * .29, cy, H * .12, wr * .85], [L * .42, cy - H * .015, H * .15, wr * .9],
      [L / 2, cy - H * .045, H * .085, wr * .30]], 0, 'glass', 'glass');
    if (b.hi) {
      for (const z of [-wr * .48, 0, wr * .48]) b.cyl([L * .29, cy + H * .12, z], [L * .495, cy - H * .01, z * .32], .024, .024, 4, 'paint');
      for (const f of [.35, .41, .46]) b.cyl([L * f, cy - H * .10, wr * .74], [L * f, cy + H * .12, wr * .74], .022, .022, 4, 'paint');
    }
  } else cockpit(b, L * .25, L * .465, cy + H * .11, wr * 1.75, H * .18);
  const wing: WingStation[] = [[0, L * .14, -L * .19, wy], [W * .17, L * .145, -L * .21, wy],
    [W * .36, L * .065, -L * .15, wy + .13], [W * .46, -L * .015, -L * .10, wy + .19],
    [W / 2, -L * .045, -L * .075, wy + .22]];
  wings(b, wing, H * .043);
  twinEngines(b, L, W, H, wy, W * .15, id === 'do17');
  tail(b, L, W, H, cy + H * .08, id === 'do17', id === 'he111');
  landingGear(b, L, H, wy, W * .15);
  // Ventral gondola and dorsal gun position remain visible even at the instance LOD.
  b.sphere([-L * .04, cy - H * .17, 0], [L * .13, H * .045, wr * .65], 'belly', b.n(18, 8), b.n(8, 4));
  b.sphere([-L * .075, cy + H * .145, 0], [L * .06, H * .045, wr * .57], 'glass', b.n(16, 6), b.n(8, 3));
  if (b.hi) b.cyl([-L * .08, cy + H * .18, 0], [-L * .16, cy + H * .20, 0], .02, .02, 6, 'dark');
  insignia(b, L, W, cy, wing, H * .043, wr * .78);
}

export function he111(b: B) { bomber(b, 'he111', false, false, true); }
export function do17(b: B) { bomber(b, 'do17', true, true, false); }

export function ju88(b: B) {
  bomber(b, 'ju88', false, false, true);
  const { lengthM: L, heightM: H } = MODEL_SPECS.ju88;
  // Ju 88 has a stepped, broad framed cockpit rather than He 111's continuous glazed prow.
  cockpit(b, L * .20, L * .42, H * .66, L * .09, H * .15);
}

export function ju87(b: B) {
  const { lengthM: L, widthM: W, heightM: H } = MODEL_SPECS.ju87, cy = H * .57, wy = cy - H * .065;
  fuselage(b, L, H, cy, L * .045);
  // Cranked inner wing drops to the fixed main gear, then rises to the outer tips.
  const wing: WingStation[] = [[0, L * .16, -L * .20, wy], [W * .145, L * .15, -L * .23, wy - H * .14],
    [W * .40, L * .035, -L * .15, wy - H * .025], [W / 2, -L * .04, -L * .11, wy + H * .015]];
  wings(b, wing, H * .045);
  cockpit(b, -L * .16, L * .15, cy + H * .12, L * .07, H * .16);
  tail(b, L, W, H, cy + H * .08);
  propeller(b, L * .445, cy, 0, H * .32, L * .055);
  landingGear(b, L, H, wy - H * .14, W * .145, true);
  b.frustum(L * .23, L * .39, L * .025, L * .21, L * .38, L * .035, cy - H * .23, cy - H * .09, 'belly');
  b.sphere([-L * .015, H * .26, 0], [L * .09, H * .047, H * .047], 'dark', b.n(16, 6), b.n(8, 4));
  if (b.hi) {
    for (const s of [-1, 1]) {
      b.box([L * .035, .04, W * .16], [L * .06, wy - H * .18, s * W * .28], 'metal');
      for (let i = 0; i < 7; i++) b.box([L * .035, .025, .025], [L * .06, wy - H * .175, s * (W * .20 + i * W * .024)], 'dark');
    }
  }
  exhausts(b, L * .23, cy, L * .044, L * .12);
  insignia(b, L, W, cy, wing, H * .045, L * .045 * .78);
}
