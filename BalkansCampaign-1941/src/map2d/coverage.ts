export type WorldBounds = readonly [number, number, number, number];
export interface CameraView { k: number; x: number; y: number }
export interface ViewportSize { width: number; height: number }

/** Minimum scale that keeps every viewport pixel inside geographic data. */
export function coverageScale(size: ViewportSize, bounds: WorldBounds): number {
  return Math.max(size.width / (bounds[2] - bounds[0]), size.height / (bounds[3] - bounds[1]));
}

export function clampViewport(view: CameraView, size: ViewportSize, bounds: WorldBounds): CameraView {
  const k = Math.max(view.k, coverageScale(size, bounds));
  return {
    k,
    x: Math.max(size.width - bounds[2] * k, Math.min(-bounds[0] * k, view.x)),
    y: Math.max(size.height - bounds[3] * k, Math.min(-bounds[1] * k, view.y)),
  };
}

export function visibleWorld(view: CameraView, size: ViewportSize): WorldBounds {
  return [-view.x / view.k, -view.y / view.k, (size.width - view.x) / view.k, (size.height - view.y) / view.k];
}
