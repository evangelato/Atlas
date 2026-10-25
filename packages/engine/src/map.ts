import { generateHeights, SEA_LEVEL } from './heightmap';
import { createMesh, type Mesh } from './mesh';
import { createRng, hashSeed } from './rng';

/** A map: its world-size, its cells, and each cell's height. */
export interface AtlasMap {
  id: string;
  name: string;
  seed: string;
  width: number;
  height: number;
  /** Height of each cell, 0..1. Below SEA_LEVEL is sea. */
  heights: Float32Array;
  /** The cell layout. It can be rebuilt from seed, size and cell count, so it isn't saved. */
  mesh: Mesh;
  /** Nested maps: the map this one zooms into, and maps that zoom into this one. */
  parentId?: string;
  children: string[];
}

export interface GenerateOptions {
  seed: string;
  name?: string;
  width?: number;
  height?: number;
  cellCount?: number;
  landFraction?: number;
}

export const DEFAULT_WIDTH = 1600;
export const DEFAULT_HEIGHT = 1000;
export const DEFAULT_CELLS = 10_000;

export function generateMap(options: GenerateOptions): AtlasMap {
  const {
    seed,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    cellCount = DEFAULT_CELLS,
  } = options;
  // Separate random streams, so changing one stage later doesn't reshuffle the others.
  const mesh = createMesh(createRng(`${seed}:mesh`), width, height, cellCount);
  const heights = generateHeights(mesh, createRng(`${seed}:heights`), {
    landFraction: options.landFraction,
  });
  return {
    id: `map-${hashSeed(seed).toString(36)}`,
    name: options.name ?? 'Untitled map',
    seed,
    width,
    height,
    heights,
    mesh,
    children: [],
  };
}

export function isLand(map: AtlasMap, cell: number): boolean {
  return map.heights[cell]! >= SEA_LEVEL;
}

/** Share of cells that are land, 0..1. */
export function landFraction(map: AtlasMap): number {
  let land = 0;
  for (let i = 0; i < map.mesh.cellCount; i++) if (isLand(map, i)) land++;
  return land / map.mesh.cellCount;
}
