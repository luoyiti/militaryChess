/** Britain campaign checks: actual data contracts, references, flight windows and geographical bounds. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Source, Place, Unit, Route, AirKeyframe, Airspace, HistEvent, Equipment, ForcesSummary, ECHELON_RANK, isoToHours, type Pos } from '../../src/schema';
import { buildGazetteer, resolvePos, haversineKm, pointInRing } from '../../src/model/core';
import { ROOT, readJson, listJson } from './load_node';
import scenario from '../../config/scenario.json';

const errors:string[]=[],warnings:string[]=[];
const error=(message:string)=>errors.push(message);
function parse<T>(schema:{safeParse:(x:unknown)=>any}, value:unknown, name:string):T|null {
  const r=schema.safeParse(value);
  if(!r.success){error(`${name}: ${r.error.message}`);return null;}
  return r.data as T;
}
const sources=listJson('src/data/sources').flatMap((file)=>readJson<any[]>(file).map((x)=>parse<any>(Source,x,file))).filter(Boolean);
const sourceIds=new Set<string>();
for(const s of sources){if(sourceIds.has(s.id))error(`重复来源 ${s.id}`);sourceIds.add(s.id);}
const checkSources=(obj:any,name:string)=>{for(const id of obj.sources ?? [])if(!sourceIds.has(id))error(`${name}: 未知来源 ${id}`);};
const places=listJson('src/data/gazetteer').flatMap((file)=>readJson<any[]>(file).map((x)=>parse<any>(Place,x,file))).filter(Boolean);
const {gaz,conflicts}=buildGazetteer(places);conflicts.forEach(error);
const frame=readJson<any>('config/frame.json'),[west,south,east,north]=frame.bbox;
const coord=(p:Pos,name:string,strict=true)=>{
  try{const ll=resolvePos(p,gaz);if(strict&&(ll[0]<west||ll[0]>east||ll[1]<south||ll[1]>north))error(`${name}: 超出地图范围 ${ll}`);return ll;}
  catch(e){error(`${name}: ${String(e)}`);return null;}
};
const h0=isoToHours(scenario.start),h1=isoToHours(scenario.end);
const date=(iso:string,name:string)=>{const h=isoToHours(iso);if(h<h0||h>h1)error(`${name}: 超出战役时间 ${iso}`);return h;};
for(const p of places){coord(p.pos,p.id);checkSources(p,p.id);}
const units=listJson('src/data/oob').flatMap((file)=>readJson<any[]>(file).map((x)=>parse<any>(Unit,x,file))).filter(Boolean);
const unitMap=new Map(units.map((u)=>[u.id,u]));
if(unitMap.size!==units.length)error('重复部队id');
const equipment=(readJson<any[]>('src/data/equipment.json')).map((x)=>parse<any>(Equipment,x,x.id)).filter(Boolean);
const eqMap=new Map(equipment.map((e)=>[e.id,e]));
for(const e of equipment)checkSources(e,e.id);
for(const u of units){
  checkSources(u,u.id);if(u.base)coord(u.base,u.id+'基地');
  if(u.parent){const parent=unitMap.get(u.parent);if(!parent)error(`${u.id}: 未知上级 ${u.parent}`);else if(ECHELON_RANK[parent.echelon as keyof typeof ECHELON_RANK]>=ECHELON_RANK[u.echelon as keyof typeof ECHELON_RANK])error(`${u.id}: 梯队未低于上级`);}
  const ancestors=new Set([u.id]);let parent=u.parent;
  while(parent&&unitMap.has(parent)){if(ancestors.has(parent)){error(`${u.id}: 编制树环`);break;}ancestors.add(parent);parent=unitMap.get(parent).parent;}
  for(const q of u.equipment ?? [])if(!eqMap.has(q.id))error(`${u.id}: 未知装备 ${q.id}`);
  let prev:any=null;
  for(const pt of u.track){const h=date(pt.at,u.id),ll=coord(pt.pos,u.id);
    if(prev){const dt=h-prev.h;if(dt<=0)error(`${u.id}: 轨迹时间未严格递增`);
      if(ll&&prev.ll&&dt>0){const distance=haversineKm(prev.ll,ll),speed=distance/dt;
        if(!(prev.phase==='at_base'&&pt.flightPhase==='at_base')&&distance>1){
          if(dt>6)error(`${u.id}: 跨日飞行 ${dt.toFixed(1)}h`);
          if(speed>800)error(`${u.id}: 飞行速度 ${speed.toFixed(0)}km/h`);
        }
      }
    }
    prev={h,ll,phase:pt.flightPhase};
  }
}
const routes=listJson('src/data/routes').flatMap((file)=>readJson<any[]>(file).map((x)=>parse<any>(Route,x,x.id))).filter(Boolean);
const routeIds=new Set<string>();
for(const r of routes){checkSources(r,r.id);if(routeIds.has(r.id))error(`重复路线 ${r.id}`);routeIds.add(r.id);const u=unitMap.get(r.unit);if(!u)error(`${r.id}: 未知部队 ${r.unit}`);else if(u.side!==r.side)error(`${r.id}: 阵营不一致`);
  let prev:any=null;
  for(const w of r.waypoints){const h=date(w.at,r.id),ll=coord(w.pos,r.id);if(prev){const dt=h-prev.h;if(dt<=0)error(`${r.id}: 路点未严格递增`);if(ll&&prev.ll&&dt>0&&haversineKm(prev.ll,ll)/dt>800)error(`${r.id}: 航线飞行速度越界`);}prev={h,ll};}
  if(r.role&&isoToHours(r.waypoints.at(-1).at)-isoToHours(r.waypoints[0].at)>6)error(`${r.id}: 任务超过6小时`);
}
const events=readJson<any[]>('src/data/events.json').map((x)=>parse<any>(HistEvent,x,x.id)).filter(Boolean);
if(events.length!==15)error(`须有15个事件，实际 ${events.length}`);
let last=-Infinity;
for(const e of events){checkSources(e,e.id);const h=date(e.at,e.id);if(h<=last)error(`${e.id}: 事件未按时间严格递增`);last=h;coord(e.place,e.id);if(e.endAt)date(e.endAt,e.id);
  if(e.body.length<80||e.body.length>140)error(`${e.id}: 正文长度 ${e.body.length}`);
  for(const id of e.units??[])if(!unitMap.has(id))error(`${e.id}: 未知事件部队 ${id}`);
}
const ordered=readJson<any>('config/keyframes.json').keyframes as string[];
const frames=listJson('src/data/airframes').map((file)=>parse<any>(AirKeyframe,readJson(file),file)).filter(Boolean).sort((a,b)=>a.at.localeCompare(b.at));
if(frames.length!==ordered.length)error('关键帧清单与文件数不一致');
for(const k of frames){date(k.at,'空战关键帧');checkSources(k,k.at);if(!ordered.includes(k.at))error(`未列出的关键帧 ${k.at}`);for(const side of ['raids','interceptions'])for(const p of k[side])for(const r of p){for(const pos of r)coord(pos,k.at+'区域',false);
  const pts=r.map((pos:Pos)=>coord(pos,k.at+'环',false)).filter(Boolean);if(pts.length>=3&&Math.abs(pts.reduce((a:number,c:number[],i:number)=>{const b=pts[(i+1)%pts.length];return a+c[0]*b[1]-b[0]*c[1];},0))<1e-8)error(`${k.at}: 退化多边形`);
}}
const space=parse<any>(Airspace,readJson('src/data/airspace.json'),'airspace');
if(space){if(space.groups.length!==4)error('须有4个RAF防区');for(const r of space.radar)coord(r.pos,r.id);}
const forces=parse<any>(ForcesSummary,readJson('src/data/forces_summary.json'),'forces');if(forces){checkSources(forces,'forces');for(const side of scenario.sides)if(!forces.sides[side])error(`缺少 ${side} 概况`);}
const photos=readJson<Record<string,any>>('public/photos/index.json');
for(const e of events)if(e.photo){const ph=photos[e.photo.commons];if(!ph)error(`${e.id}: 照片未索引 ${e.photo.commons}`);else try{const file=readFileSync(resolve(ROOT,'public',ph.src));if(file.length<100)error(`${e.id}: 照片空文件`);}catch{error(`${e.id}: 照片不存在`);}}
const masks=readFileSync(resolve(ROOT,'public/geo/field_masks.bin'));if(masks.length!==frame.field.w*frame.field.h)error('地图掩膜尺寸不符');for(const b of masks)if(b!==0&&b!==16){error('空战掩膜包含领土占领位');break;}
const topos=readJson<any>('public/geo/vectors.topo.json');for(const key of ['land','countries1939','rivers','lakes','marsh','forest'])if(!topos.objects[key])error(`缺少地理层 ${key}`);
for(const e of errors)console.error('ERROR',e);
for(const w of warnings)console.warn('WARN',w);
console.log(`Britain data: ${units.length} units, ${routes.length} routes, ${events.length} events, ${frames.length} air keyframes, ${places.length} places; ${errors.length} errors.`);
if(errors.length)process.exitCode=1;
