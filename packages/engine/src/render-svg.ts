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

/** Draws the map as an SVG string. Each layer is drawn on top of the previous one. */
export function renderSvg(map: AtlasMap): string {
  return svgDocument(map.width, map.height, [
    seaLayer(map),
    heightBandsLayer(map),
    coastlineLayer(map),
  ]);
}

function svgDocument(width: number, height: number, layers: string[]): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    layers.join('') +
    '</svg>'
  );
}

function seaLayer(map: AtlasMap): string {
  return `<rect width="${map.width}" height="${map.height}" fill="${SEA}"/>`;
}

function heightBandsLayer(map: AtlasMap): string {
  return BANDS.map((band) => {
    const d = outlinePath(map, band.min);
    return d ? `<path d="${d}" fill="${band.fill}" fill-rule="evenodd"/>` : '';
  }).join('');
}

function coastlineLayer(map: AtlasMap): string {
  const d = outlinePath(map, SEA_LEVEL);
  return d
    ? `<path d="${d}" fill="none" stroke="${COAST}" stroke-width="1.6" stroke-linejoin="round"/>`
    : '';
}

/** Smoothed outline of everything at or above `level`, as SVG path data. */
function outlinePath(map: AtlasMap, level: number): string {
  const loops = traceContours(map.mesh, map.heights, level).map((l) => smoothLoop(l));
  return loopsToPath(loops);
}

/** Turns outlines into SVG path data: "M x y" moves, "L x y" draws a line, "Z" closes. */
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
