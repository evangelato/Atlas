import { smoothLoop, traceContours, type Loop } from './boundaries';
import { SEA_LEVEL } from './heightmap';
import type { AtlasMap } from './map';

/**
 * Elevation bands, drawn bottom to top. Each band fills everything at or
 * above its height, so higher bands stack over lower ones like contour layers.
 * Placeholder colors; the real Tolkien/Sanderson style comes later.
 */
const BANDS: { min: number; fill: string }[] = [
  { min: SEA_LEVEL - 0.03, fill: '#a9c9d6' }, // shallow water
  { min: SEA_LEVEL, fill: '#b5c98f' }, // lowlands
  { min: 0.35, fill: '#cfd09a' }, // uplands
  { min: 0.5, fill: '#d8bf8f' }, // hills
  { min: 0.65, fill: '#bea283' }, // highlands
  { min: 0.8, fill: '#a39d97' }, // peaks
];

const SEA = '#8fb4c8';
const COAST = '#3b2f24';

export function renderSvg(map: AtlasMap): string {
  const { width, height, mesh, heights } = map;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="${SEA}"/>`,
  ];

  let coastline = '';
  for (const band of BANDS) {
    const loops = traceContours(mesh, heights, band.min).map((l) => smoothLoop(l));
    const d = loopsToPath(loops);
    if (!d) continue;
    parts.push(`<path d="${d}" fill="${band.fill}" fill-rule="evenodd"/>`);
    if (band.min === SEA_LEVEL) coastline = d;
  }

  if (coastline) {
    parts.push(
      `<path d="${coastline}" fill="none" stroke="${COAST}" stroke-width="1.6" stroke-linejoin="round"/>`,
    );
  }
  parts.push('</svg>');
  return parts.join('');
}

function loopsToPath(loops: Loop[]): string {
  return loops
    .map((loop) => {
      let d = `M${fmt(loop[0]!)} ${fmt(loop[1]!)}`;
      for (let i = 2; i < loop.length; i += 2) d += `L${fmt(loop[i]!)} ${fmt(loop[i + 1]!)}`;
      return d + 'Z';
    })
    .join('');
}

function fmt(n: number): string {
  return n.toFixed(1);
}
