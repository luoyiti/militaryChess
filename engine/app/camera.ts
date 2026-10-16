/** 事件镜头取自关联航线，同一战区范围供地图与沙盘使用。 */
import type { DB, REvent } from '../data/db';
import { project, unproject, W, H } from '../geo/frame';
import { unitStateAt } from '../model/core';
import type { LonLat } from '../core/types';
import { manifest } from '../campaign/context';

export interface CameraFrame { points: LonLat[]; maxZoom: number }
export interface CameraFocus { ll: LonLat; relZoom: number }
export interface CameraInsets { left: number; right: number; top: number; bottom: number }
export interface CameraViewport { x: number; y: number; width: number; height: number }

export function cameraViewport(width: number, height: number, insets: CameraInsets): CameraViewport {
  // 小屏上卡片可能覆盖整幅地图；保留有效画幅，避免插值或投影产生无穷值。
  const left = Math.min(insets.left, width * .45), right = Math.min(insets.right, width * .45);
  const top = Math.min(insets.top, height * .4), bottom = Math.min(insets.bottom, height * .4);
  return { x: left, y: top, width: Math.max(1, width - left - right), height: Math.max(1, height - top - bottom) };
}

export function eventCameraFrame(db: DB, e: REvent, context = false): CameraFrame {
  const units = new Set(e.units ?? []);
  const routes = db.routes.filter((r) => units.has(r.unit) && r.wps[0].h <= e.h + 6 && r.wps.at(-1)!.h >= e.h - 6);
  const points: LonLat[] = [e.ll];
  for (const r of routes) points.push(...r.wps.map((w) => w.ll));
  // 无航线的决策／总结事件仍显示其关联指挥部；不把其他日期的出击混进当前镜头。
  if (!routes.length) for (const id of units) {
    const state = unitStateAt(id, db.units, e.h);
    if (state) points.push(state.ll);
  }
  const [major, minor] = manifest().director.defaultZoom ?? [2.8, 3.4];
  const maxZoom = Math.max(.55, Math.min(manifest().map.maxZoom ?? 8, e.zoomRel ?? (e.importance === 1 ? major : minor)));
  return { points, maxZoom: context ? maxZoom * .78 : maxZoom };
}

export function frameBounds(frame: CameraFrame) {
  const points = frame.points.map(project);
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { x0, x1, y0, y1, center: [(x0 + x1) / 2, (y0 + y1) / 2] as [number, number] };
}

export function frameFocus(frame: CameraFrame, viewport: CameraViewport, fitK: number): CameraFocus {
  const bounds = frameBounds(frame);
  const pad = Math.min(56, viewport.width * .12, viewport.height * .12);
  const k = Math.min(
    fitK * frame.maxZoom,
    (viewport.width - pad * 2) / Math.max(1, bounds.x1 - bounds.x0),
    (viewport.height - pad * 2) / Math.max(1, bounds.y1 - bounds.y0),
  );
  return { ll: unproject(bounds.center), relZoom: Math.max(.55, Math.min(manifest().map.maxZoom ?? 16, k / fitK)) };
}

export function theatreFit(viewport: CameraViewport) { return Math.min(viewport.width / W, viewport.height / H); }
