import { useMemo } from 'react';
import { generateMap, renderSvg } from '@atlas/engine';

export function App() {
  const svg = useMemo(() => renderSvg(generateMap({ seed: 'atlas' })), []);
  return (
    <main className="app">
      <div className="map" dangerouslySetInnerHTML={{ __html: svg }} />
    </main>
  );
}
