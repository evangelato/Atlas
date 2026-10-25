import { describe, expect, it } from 'vitest';
import { createMesh } from './mesh';
import { createRng } from './rng';

describe('mesh', () => {
  const mesh = createMesh(createRng('mesh'), 1600, 1000, 10_000);

  it('has about the requested number of cells', () => {
    expect(mesh.cellCount).toBeGreaterThan(9_000);
    expect(mesh.cellCount).toBeLessThan(11_000);
  });

  it('keeps every cell center inside the map', () => {
    for (let i = 0; i < mesh.cellCount; i++) {
      const x = mesh.points[2 * i]!;
      const y = mesh.points[2 * i + 1]!;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1000);
    }
  });

  it('has symmetric neighbors', () => {
    for (let i = 0; i < mesh.cellCount; i += 97) {
      for (const j of mesh.neighbors[i]!) expect(mesh.neighbors[j]).toContain(i);
    }
  });

  it('gives every cell a handful of neighbors', () => {
    const avg = mesh.neighbors.reduce((s, n) => s + n.length, 0) / mesh.cellCount;
    expect(avg).toBeGreaterThan(5);
    expect(avg).toBeLessThan(7);
  });

  it('marks the cells along the map edge', () => {
    expect(mesh.isEdge.some(Boolean)).toBe(true);
    expect(mesh.isEdge.filter(Boolean).length).toBeLessThan(mesh.cellCount * 0.1);
  });

  it('is identical for the same seed', () => {
    const again = createMesh(createRng('mesh'), 1600, 1000, 10_000);
    expect(again.points).toEqual(mesh.points);
  });
});
