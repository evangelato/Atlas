import { Delaunay } from 'd3-delaunay';
import type { Rng } from './rng';

/**
 * The map is divided into irregular cells (a Voronoi diagram). Each cell is
 * one small piece of the world that later carries height, biome, region, etc.
 *
 * Cell centers are a jittered grid: evenly spread like a grid, but irregular
 * enough to look natural.
 */
export interface Mesh {
  width: number;
  height: number;
  cellCount: number;
  /** Cell centers as [x0, y0, x1, y1, ...]. */
  points: Float64Array;
  /** Neighboring cell ids for each cell. */
  neighbors: number[][];
  /** True for cells touching the map's outer edge. */
  isEdge: boolean[];
  delaunay: Delaunay<number>;
  /**
   * One corner per Delaunay triangle, where three cells meet, as [x, y, ...].
   * We use the triangle's centroid instead of its circumcenter: circumcenters
   * of thin triangles can land far away and put spikes in coastlines.
   */
  corners: Float64Array;
}

export function createMesh(rng: Rng, width: number, height: number, targetCells: number): Mesh {
  const spacing = Math.sqrt((width * height) / targetCells);
  const cols = Math.max(1, Math.round(width / spacing));
  const rows = Math.max(1, Math.round(height / spacing));
  const sx = width / cols;
  const sy = height / rows;
  const jitter = 0.45;

  const coords: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5 + (rng() * 2 - 1) * jitter) * sx;
      const y = (r + 0.5 + (rng() * 2 - 1) * jitter) * sy;
      coords.push(x, y);
    }
  }
  const points = Float64Array.from(coords);
  const cellCount = points.length / 2;
  const delaunay = new Delaunay(points);

  const neighbors: number[][] = [];
  const isEdge: boolean[] = [];
  const edgeMargin = Math.max(sx, sy) * 1.5;
  for (let i = 0; i < cellCount; i++) {
    neighbors.push([...delaunay.neighbors(i)]);
    const x = points[2 * i]!;
    const y = points[2 * i + 1]!;
    isEdge.push(
      x < edgeMargin || y < edgeMargin || x > width - edgeMargin || y > height - edgeMargin,
    );
  }

  return {
    width,
    height,
    cellCount,
    points,
    neighbors,
    isEdge,
    delaunay,
    corners: triangleCentroids(points, delaunay.triangles),
  };
}

function triangleCentroids(points: Float64Array, triangles: Uint32Array): Float64Array {
  const out = new Float64Array((triangles.length / 3) * 2);
  for (let t = 0; t < triangles.length / 3; t++) {
    const a = triangles[3 * t]!;
    const b = triangles[3 * t + 1]!;
    const c = triangles[3 * t + 2]!;
    out[2 * t] = (points[2 * a]! + points[2 * b]! + points[2 * c]!) / 3;
    out[2 * t + 1] = (points[2 * a + 1]! + points[2 * b + 1]! + points[2 * c + 1]!) / 3;
  }
  return out;
}
