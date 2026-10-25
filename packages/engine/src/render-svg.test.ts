import { describe, expect, it } from 'vitest';
import { generateMap } from './map';
import { renderSvg } from './render-svg';

describe('renderSvg', () => {
  const map = generateMap({ seed: 'render' });
  const svg = renderSvg(map);

  it('produces a landscape SVG sized to the map', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1600 1000"');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('draws elevation bands and a coastline', () => {
    const paths = svg.match(/<path /g) ?? [];
    expect(paths.length).toBeGreaterThanOrEqual(4);
    expect(svg).toContain('stroke=');
  });

  it('is identical for the same seed', () => {
    expect(renderSvg(generateMap({ seed: 'render' }))).toBe(svg);
  });

  it('generates and renders the default map quickly', () => {
    const start = performance.now();
    renderSvg(generateMap({ seed: 'speed' }));
    // Spec target is under 1 s in the app; leave headroom for slow CI machines.
    expect(performance.now() - start).toBeLessThan(1500);
  });
});
