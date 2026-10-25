# 01 — Engine and first render

Status: draft for review

## Goal
Prove the foundation: a UI-free engine generates a believable landmass from a seed, and an Electron window shows it.

## What you'll see
- Run `npm run dev` and an Atlas window opens.
- It shows a landscape map with sea, one or more landmasses, smooth coastlines, and simple elevation coloring from lowland green to tan hills to grey peaks.
- A small toolbar at the top has a **seed** field, a **Regenerate** button, and a **Random** button.
- The same seed always gives the same map.

This step is about shape, not beauty. The Tolkien or Sanderson styling comes in spec 06.

## How it works (technical choices)
- **The map is a cell mesh, not a pixel grid.** About 10,000 irregular cells (a Voronoi diagram built with `d3-delaunay`) are the units of the map. Each cell stores its height.
  - Coastlines and borders come out as clean vector paths, which is good for SVG and print.
  - Rivers can run along cell edges.
  - Regions are just sets of cells.
  - Brushes edit the cells under the cursor.
- **Height generation** uses seeded noise (`simplex-noise`) plus a few "blob" landmasses and an edge falloff, so land sits away from the map border. Sea level is a single threshold.
- **Determinism** comes from a seeded random number generator. There are no calls to `Math.random()` in the engine.
- **Rendering:** `renderSvg(map)` in the engine returns an SVG string. The app displays it. Keeping rendering in the engine means the MCP `render_preview` and export can reuse it later. If performance needs it, we can move to canvas for heavy layers later.
- **Repo setup:** npm workspaces with `packages/engine` and `apps/desktop`. Electron with `electron-vite`, React for the toolbar, and `vitest` for tests.
- **Map size:** 1600 × 1000 world units, a landscape ratio of 16:10.

## Engine API in this step
```ts
generateMap({ seed: string, width?: number, height?: number, cellCount?: number }): AtlasMap
renderSvg(map: AtlasMap): string
```
`AtlasMap` (first version): `id`, `name`, `seed`, `width`, `height`, `cells` (points plus heights), `parentId?`, and `children` (empty for now, reserved for nested maps).

## Acceptance criteria
- [ ] `npm install && npm run dev` opens the Atlas window on a Mac.
- [ ] Changing the seed and clicking Regenerate shows a different map in under 1 second.
- [ ] Tests: the same seed gives identical maps, different seeds give different maps, and land takes up a sensible share of the map (about 25–55%).
- [ ] The engine package has no Electron, DOM, or React imports.

## Out of scope
Rivers, cities, styles, editing, saving, the library screen, MCP.

## Commit plan
1. Workspace scaffold (root `package.json`, TypeScript config, lint).
2. Engine: seeded RNG and the mesh, with tests.
3. Engine: height generation and coastlines, with tests.
4. Engine: `renderSvg`.
5. Electron app shell showing a rendered map.
6. Toolbar with seed, Regenerate and Random.
