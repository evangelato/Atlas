import { useMemo, useState } from 'react';
import { generateMap, renderSvg } from '@atlas/engine';
import { Toolbar } from './Toolbar';

const FIRST_SEED = 'atlas';

export function App() {
  const [seed, setSeed] = useState(FIRST_SEED);

  const { svg, ms } = useMemo(() => {
    const start = performance.now();
    const svg = renderSvg(generateMap({ seed }));
    return { svg, ms: Math.round(performance.now() - start) };
  }, [seed]);

  return (
    <main className="app">
      <Toolbar seed={seed} onGenerate={setSeed} status={`Generated in ${ms} ms`} />
      <div className="map" dangerouslySetInnerHTML={{ __html: svg }} />
    </main>
  );
}
