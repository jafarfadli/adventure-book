// Shared SVG filters and paper textures for the world. Render <WorldDefs />
// once per document; everything else references the ids below.
//
// Light comes from the upper left: floating pieces drop a shadow down-right
// (ab-lift); stacked landscape bands shade the layer behind them upward
// (ab-edge). Textures are tiled data-URI images, so the noise is rasterised
// once and cached instead of re-running feTurbulence per element.

export const LIFT = "url(#ab-lift)";
export const EDGE = "url(#ab-edge)";
export const DROP = "url(#ab-drop)";

const svgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${svg.replace(/#/g, "%23").replace(/\n\s*/g, "")}")`;

/** Fine paper grain, multiplied over paper and scenery (never over photos). */
export const GRAIN_URL = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
  <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' seed='7' stitchTiles='stitch'/>
  <feColorMatrix values='0 0 0 0 .22  0 0 0 0 .17  0 0 0 0 .12  0 0 0 -1.25 .7'/></filter>
  <rect width='160' height='160' filter='url(#n)'/></svg>`);

/** Coarser fibres for felt boards (covers). */
export const FELT_URL = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='3' seed='11' stitchTiles='stitch'/>
  <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.5 -.62'/></filter>
  <rect width='200' height='200' filter='url(#f)'/></svg>`);

export function WorldDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <filter id="ab-lift" x="-30%" y="-30%" width="160%" height="170%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="1.5" dy="3" stdDeviation="2.2" floodColor="#1e1014" floodOpacity="0.3" />
        </filter>
        <filter id="ab-edge" x="-3%" y="-30%" width="106%" height="160%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="-2" stdDeviation="2.8" floodColor="#1e1014" floodOpacity="0.28" />
        </filter>
        <filter id="ab-drop" x="-5%" y="-10%" width="110%" height="160%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#1a1430" floodOpacity="0.32" />
        </filter>
      </defs>
    </svg>
  );
}
