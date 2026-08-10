// Stamen Watercolor via Stadia Maps (§7.5). Stadia authorizes localhost by
// referer but returns 401 from any other host without an API key — so without
// a key we fall back to standard OSM tiles instead of a broken map. Register
// a free, domain-restricted key and set NEXT_PUBLIC_STADIA_API_KEY to get the
// watercolor look on the public host (safe to expose; licence-bound).
const key = process.env.NEXT_PUBLIC_STADIA_API_KEY;

export const TILE_URL = key
  ? `https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=${key}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION = key
  ? '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> ' +
    '&copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

// The watercolor set thins out above 16 and shows gaps; OSM goes deeper.
export const TILE_MAX_ZOOM = key ? 16 : 19;
