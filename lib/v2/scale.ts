/** Design height of the world band, in units. */
export const BAND_U = 720;
/** A phone should see one typical stop: the band is never wider than this many units. */
export const MIN_VIEW_U = 460;

/**
 * Pixels per unit for a viewport, and where the 720u band sits in it. Spare
 * height (tall phones) goes 60% to sky above and 40% to ground below.
 */
export function worldScale(vw: number, vh: number): { s: number; bandTop: number; topU: number; bottomU: number } {
  const s = Math.max(0.05, Math.min(vh / BAND_U, vw / MIN_VIEW_U));
  const spare = Math.max(0, vh - BAND_U * s);
  const bandTop = spare * 0.6;
  return { s, bandTop, topU: -bandTop / s, bottomU: (spare - bandTop) / s };
}
