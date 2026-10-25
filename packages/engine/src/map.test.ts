import { describe, expect, it } from 'vitest';
import { loopArea, smoothLoop, traceBoundaries, traceContours } from './boundaries';
import { SEA_LEVEL } from './heightmap';
import { generateMap, isLand, landFraction } from './map';

describe('generateMap', () => {
  it('gives identical maps for the same seed', () => {
    const a = generateMap({ seed: 'eldmoor' });
    const b = generateMap({ seed: 'eldmoor' });
    expect(b.heights).toEqual(a.heights);
    expect(b.id).toBe(a.id);
  });

  it('gives different maps for different seeds', () => {
    const a = generateMap({ seed: 'eldmoor' });
    const b = generateMap({ seed: 'varrow' });
    expect(b.heights).not.toEqual(a.heights);
  });

  it('keeps land between 25% and 55% across many seeds', () => {
    for (let s = 0; s < 20; s++) {
      const f = landFraction(generateMap({ seed: `seed-${s}`, cellCount: 3000 }));
      expect(f).toBeGreaterThan(0.25);
      expect(f).toBeLessThan(0.55);
    }
  });

  it('keeps heights in 0..1 and the map edge under water', () => {
    const map = generateMap({ seed: 'edges' });
    for (let i = 0; i < map.mesh.cellCount; i++) {
      expect(map.heights[i]).toBeGreaterThanOrEqual(0);
      expect(map.heights[i]).toBeLessThanOrEqual(1);
      if (map.mesh.isEdge[i]) expect(map.heights[i]).toBeLessThan(SEA_LEVEL);
    }
  });

  it('reserves an empty list for nested maps', () => {
    expect(generateMap({ seed: 'x' }).children).toEqual([]);
  });
});

describe('coastlines', () => {
  const map = generateMap({ seed: 'coast' });
  const loops = traceBoundaries(map.mesh, (c) => isLand(map, c));

  it('finds at least one coastline', () => {
    expect(loops.length).toBeGreaterThan(0);
  });

  it('closes every coastline: consecutive points are close together', () => {
    const maxStep = 40; // a few cell widths
    for (const loop of loops) {
      const n = loop.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const d = Math.hypot(loop[2 * j]! - loop[2 * i]!, loop[2 * j + 1]! - loop[2 * i + 1]!);
        expect(d).toBeLessThan(maxStep);
      }
    }
  });

  it('keeps coastlines inside the map', () => {
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i += 2) {
        expect(loop[i]).toBeGreaterThan(0);
        expect(loop[i]).toBeLessThan(map.width);
        expect(loop[i + 1]).toBeGreaterThan(0);
        expect(loop[i + 1]).toBeLessThan(map.height);
      }
    }
  });

  it('contours match the plain outlines one-to-one', () => {
    const contours = traceContours(map.mesh, map.heights, SEA_LEVEL);
    expect(contours.map((l) => l.length)).toEqual(loops.map((l) => l.length));
  });

  it('smoothing keeps roughly the same enclosed area', () => {
    const biggest = loops.reduce((a, b) => (Math.abs(loopArea(b)) > Math.abs(loopArea(a)) ? b : a));
    const before = Math.abs(loopArea(biggest));
    const after = Math.abs(loopArea(smoothLoop(biggest)));
    expect(after / before).toBeGreaterThan(0.95);
    expect(after / before).toBeLessThan(1.05);
  });
});
