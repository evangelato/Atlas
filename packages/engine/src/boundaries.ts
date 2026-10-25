import type { Mesh } from './mesh';

/** A closed outline as [x0, y0, x1, y1, ...]. */
export type Loop = number[];

/**
 * Traces the outlines around every group of cells for which `inside` is true,
 * for example coastlines (inside = land) or the edge of the highlands.
 *
 * Every triangle with both inside and outside corners has exactly one edge
 * going inside → outside, which links it to one neighbouring triangle. So
 * following those links from triangle to triangle walks each outline once.
 */
export function traceBoundaries(
  mesh: Mesh,
  inside: (cell: number) => boolean,
  crossing?: (from: number, to: number) => [number, number],
): Loop[] {
  const { triangles, halfedges } = mesh.delaunay;
  const nextTriangle = new Map<number, number>();
  const pointOf = new Map<number, [number, number]>();

  for (let e = 0; e < triangles.length; e++) {
    const from = triangles[e]!;
    const to = triangles[e % 3 === 2 ? e - 2 : e + 1]!;
    const opposite = halfedges[e]!;
    if (opposite < 0 || !inside(from) || inside(to)) continue;
    const t = Math.floor(e / 3);
    nextTriangle.set(t, Math.floor(opposite / 3));
    if (crossing) pointOf.set(t, crossing(from, to));
  }

  const loops: Loop[] = [];
  const visited = new Set<number>();
  for (const start of nextTriangle.keys()) {
    if (visited.has(start)) continue;
    const loop: Loop = [];
    let t: number | undefined = start;
    while (t !== undefined && !visited.has(t)) {
      visited.add(t);
      const p = pointOf.get(t);
      if (p) loop.push(p[0], p[1]);
      else loop.push(mesh.corners[2 * t]!, mesh.corners[2 * t + 1]!);
      t = nextTriangle.get(t);
    }
    if (loop.length >= 6) loops.push(loop);
  }
  return loops;
}

/**
 * Contour lines: outlines where `values` crosses `threshold` (e.g. the coastline
 * is where height crosses sea level). Each point is placed along the cell-to-cell
 * edge where the value would cross, which gives much smoother lines than cell corners.
 */
export function traceContours(mesh: Mesh, values: ArrayLike<number>, threshold: number): Loop[] {
  const { points } = mesh;
  return traceBoundaries(
    mesh,
    (c) => values[c]! >= threshold,
    (a, b) => {
      const va = values[a]!;
      const vb = values[b]!;
      const t = Math.min(0.9, Math.max(0.1, (va - threshold) / (va - vb || 1)));
      return [
        points[2 * a]! + t * (points[2 * b]! - points[2 * a]!),
        points[2 * a + 1]! + t * (points[2 * b + 1]! - points[2 * a + 1]!),
      ];
    },
  );
}

/** Chaikin smoothing: rounds off corners of a closed loop. Each pass doubles the points. */
export function smoothLoop(loop: Loop, passes = 2): Loop {
  let pts = loop;
  for (let p = 0; p < passes; p++) {
    const out: Loop = [];
    const n = pts.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x0 = pts[2 * i]!;
      const y0 = pts[2 * i + 1]!;
      const x1 = pts[2 * j]!;
      const y1 = pts[2 * j + 1]!;
      out.push(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1);
      out.push(0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1);
    }
    pts = out;
  }
  return pts;
}

/** Signed area of a loop (shoelace formula). The sign tells islands from lakes. */
export function loopArea(loop: Loop): number {
  let a = 0;
  const n = loop.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += loop[2 * i]! * loop[2 * j + 1]! - loop[2 * j]! * loop[2 * i + 1]!;
  }
  return a / 2;
}
