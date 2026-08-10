// Stamen Watercolor via Stadia Maps (§7.5). Key is optional locally; use a
// domain-restricted key on the public host (safe to expose, licence-bound).
const key = process.env.NEXT_PUBLIC_STADIA_API_KEY;

export const TILE_URL = `https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg${
  key ? `?api_key=${key}` : ""
}`;

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> ' +
  '&copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

// The watercolor set thins out above 16 and shows gaps.
export const TILE_MAX_ZOOM = 16;
