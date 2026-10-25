import { createNoise2D } from 'simplex-noise';
import type { Mesh } from './mesh';
import { randInt, randRange, type Rng } from './rng';

/** Heights are 0..1. Cells below this are sea. */
export const SEA_LEVEL = 0.2;

export interface HeightOptions {
  /** Share of the map that ends up as land (0..1). Random in 0.3..0.45 if omitted. */
  landFraction?: number;
}

/**
 * Gives every cell a height:
 *  1. A few broad "blobs" decide where continents sit.
 *  2. Layered noise adds hills, bays and peninsulas.
 *  3. A falloff near the border keeps land away from the map edge.
 *  4. Heights are rescaled so the chosen share of cells sits above SEA_LEVEL.
 */
export function generateHeights(mesh: Mesh, rng: Rng, options: HeightOptions = {}): Float32Array {
  const { width, height, cellCount, points } = mesh;
  const noise = createNoise2D(rng);
  const landFraction = options.landFraction ?? randRange(rng, 0.3, 0.45);

  const blobs = Array.from({ length: randInt(rng, 2, 5) }, () => ({
    x: randRange(rng, 0.2, 0.8) * width,
    y: randRange(rng, 0.2, 0.8) * height,
    r: randRange(rng, 0.12, 0.25) * width,
    strength: randRange(rng, 0.6, 1),
  }));

  const raw = new Float32Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    const x = points[2 * i]!;
    const y = points[2 * i + 1]!;

    let continent = 0;
    for (const b of blobs) {
      const d2 = (x - b.x) ** 2 + (y - b.y) ** 2;
      continent = Math.max(continent, b.strength * Math.exp(-d2 / (2 * b.r * b.r)));
    }

    const edge = smoothstep(
      Math.min(
        x / (0.1 * width),
        (width - x) / (0.1 * width),
        y / (0.1 * height),
        (height - y) / (0.1 * height),
      ),
    );

    let v = continent + 0.45 * fbm(noise, x / width, y / width);
    v = v * edge - (1 - edge);
    raw[i] = mesh.isEdge[i] ? -Infinity : v;
  }

  return rescale(raw, landFraction);
}

/** Fractal noise: several layers of noise at growing detail, each fainter. Roughly -1..1. */
function fbm(noise: (x: number, y: number) => number, x: number, y: number): number {
  let sum = 0;
  let amp = 1;
  let freq = 3;
  let norm = 0;
  for (let o = 0; o < 5; o++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Maps raw values to 0..1 so exactly `landFraction` of cells sit at or above SEA_LEVEL. */
function rescale(raw: Float32Array, landFraction: number): Float32Array {
  const finite = Array.from(raw)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const n = raw.length;
  // Edge cells (-Infinity) are always sea, so count the land cells from the top.
  const landCells = Math.min(finite.length, Math.round(landFraction * n));
  const threshold = finite[Math.max(0, finite.length - landCells)]!;
  const min = finite[0]!;
  const max = finite[finite.length - 1]!;

  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = raw[i]!;
    if (!Number.isFinite(v)) out[i] = 0;
    else if (v < threshold) out[i] = (SEA_LEVEL * (v - min)) / (threshold - min || 1);
    else {
      // A gentle curve keeps most land low and makes high peaks rarer.
      const t = (v - threshold) / (max - threshold || 1);
      out[i] = SEA_LEVEL + (1 - SEA_LEVEL) * t ** 1.4;
    }
  }
  return out;
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}
