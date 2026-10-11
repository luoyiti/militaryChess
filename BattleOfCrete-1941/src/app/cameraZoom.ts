/** Event zoom is a continuous authored value, not an array index. */
export function eventZoom(value = 3): number {
  const stops = [1, 1, 1.35, 1.9, 2.6, 3.4, 4.4, 5.6, 7];
  const v = Number.isFinite(value) ? Math.max(1, Math.min(8, value)) : 3;
  const low = Math.floor(v), high = Math.ceil(v);
  return stops[low] + (stops[high] - stops[low]) * (v - low);
}
