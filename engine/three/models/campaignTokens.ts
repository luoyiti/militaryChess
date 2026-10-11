/** Generic campaign tokens reuse the existing geometry/material builder. These are symbols, not ship/aircraft reconstructions. */
import { B } from './builder';
export function navalToken(b: B) {
  b.box([3.4, .22, .65], [0,.11,0], 'paint');
  b.box([2.6,.15,.58], [0,.295,0], 'wood');
  b.box([.65,.45,.45], [-.1,.595,0], 'paint');
  b.cyl([.35,.37,0],[.35,1.3,0],.055,.055,b.n(16,5),'dark');
  b.cyl([-.55,.37,0],[-.55,1.05,0],.08,.08,b.n(16,5),'dark');
  b.box([.55,.08,.22],[1,.44,0],'metal');
  b.box([.55,.08,.22],[-1,.44,0],'metal');
  for (const x of [-1.2,-.7,-.2,.3,.8,1.3]) for (const z of [-.31,.31]) b.box([.06,.14,.04],[x,.35,z],'white');
}
export function aircraftToken(b: B) {
  b.cyl([-1.6,.3,0],[1.6,.3,0],.16,.10,b.n(16,6),'paint');
  b.box([.6,.06,3.2],[.1,.32,0],'paint');
  b.box([.4,.04,1.1],[-1.3,.38,0],'paint');
  b.box([.4,.42,.04],[-1.3,.5,0],'paint');
  b.box([.32,.13,.2],[.55,.43,0],'glass');
  b.box([.045,.6,.07],[1.62,.3,0],'dark');
  b.cyl([.3,0,.3],[.3,.23,.3],.025,.025,b.n(8,4),'metal');
  b.cyl([.3,0,-.3],[.3,.23,-.3],.025,.025,b.n(8,4),'metal');
}
