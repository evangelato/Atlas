import { describe, expect, it } from 'vitest';
import { createRng, hashSeed, randInt } from './rng';

describe('rng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng('eldmoor');
    const b = createRng('eldmoor');
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('gives different sequences for different seeds', () => {
    const a = createRng('eldmoor');
    const b = createRng('eldmoor2');
    const same = Array.from({ length: 20 }, () => a() === b()).filter(Boolean).length;
    expect(same).toBeLessThan(2);
  });

  it('stays in [0, 1) and is roughly uniform', () => {
    const rng = createRng('uniform');
    let sum = 0;
    for (let i = 0; i < 10_000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 10_000).toBeCloseTo(0.5, 1);
  });

  it('randInt is inclusive on both ends', () => {
    const rng = createRng('ints');
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randInt(rng, 1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('hashes to an unsigned 32-bit integer', () => {
    const h = hashSeed('anything');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});
