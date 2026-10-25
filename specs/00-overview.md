# 00 — Overview

Status: draft for review · Oct 25, 2026

## Vision
Atlas is a Mac desktop app for drawing the maps of a fantasy novel. It produces stylized maps in a colored Tolkien or Sanderson style, good enough for a printed book. You can edit a map by hand, and Claude can edit the same map through MCP while you watch the changes appear live. Both use the same engine.

## Decisions so far
| Topic | Decision |
|---|---|
| Platform | Mac only for now; Windows maybe later |
| Desktop shell | Electron (all TypeScript; MCP and WebSocket easy to integrate; Windows build cheap later) |
| MCP clients | Claude Code and the Claude desktop app, over local stdio. HTTP may come later; claude.ai web is out of scope for now |
| Which map Claude edits | Always the map open in the app. Claude can list the other maps |
| App not running | The MCP server launches Atlas automatically |
| Undo | One shared history. Every entry is labeled **you** or **Claude** |
| World creation | Both: generate a whole world from a seed, *and* generate pieces on request (an archipelago here, a range from A to B) |
| Editing by hand | Terrain brushes, coastline drawing, painting forests and mountains, rivers and roads, cities, labels, move, select, delete |
| Style | Colored Tolkien or Sanderson: inked linework, side-view mountain and tree symbols, soft color washes, decorative border, compass rose, cartouche, hand-lettered labels. Themes are pluggable so more styles can come later. The user will add reference images later |
| Map shape | Landscape (wider than tall) by default |
| Library | The app opens on your maps, with a **New map** button |
| Nested maps | The file format supports parent and child maps from day one (for example, click a city to open its map). Drawing city maps comes later |
| Names | No name generator in the app. Claude suggests and fills names through MCP |
| Print | Deferred. SVG and PNG export comes in a later step |
| Look and feel | Our own design; other tools are inspiration, not templates |

## Architecture
```
Claude Code / Claude desktop
   |  MCP (stdio)
   v
MCP server (small Node process) ── local WebSocket ──> Atlas app (Electron)
                                                          |
                         packages/engine (TypeScript, no UI) — shared
```
- **The app owns the live map.** The MCP server is a thin bridge: it forwards each tool call to the running app, which applies it as a command and shows it on screen. If the app isn't running, the server launches it.
- **The MCP server runs as a separate process** because Claude Code and Claude desktop expect to start a stdio server themselves. It stays tiny, and all the logic lives in the engine and the app.
- **Commands, not direct changes.** Every edit is a command with an author (`user` or `claude`). This gives us undo and redo, the activity log, live animation, and later an approve mode.

## Repo layout (planned)
```
packages/engine      map model, generation, commands, rendering to SVG (no UI)
packages/mcp-server  stdio MCP server that bridges to the app
apps/desktop         Electron app (UI, library, live map)
specs/               these documents
```

## Draft MCP tools
`list_maps`, `create_map`, `describe_map`, `render_preview`, `edit_terrain`, `generate_feature`, `add_region`, `draw_river`, `draw_road`, `place_city`, `add_label`, `set_style`, `get_selection`, `undo`, `export`. Each tool is small and predictable, returns a short result Claude can check, and reports the ids of whatever it created. The exact shapes get defined in the spec for each step.

## Build order
Each step is its own spec and PR, and ends with something you can try.
1. **Engine and first render.** Generate a landmass from a seed and show it in an Electron window.
2. **Live link.** A minimal MCP server plus a WebSocket link with one tool, `place_city`. Watch a city appear when Claude calls it.
3. **Commands, undo, save and load.** The shared history, the map file, and the library screen with **New map**.
4. **Claude can see.** `describe_map` and `render_preview`.
5. **Hand-editing tools.** Terrain brushes, coastlines, forests and mountains, rivers, roads, cities, labels.
6. **Style.** The colored Tolkien or Sanderson theme: symbols, washes, border, compass, lettering.
7. **Targeted generation.** "Add an archipelago here" and similar, by hand and through MCP.
8. **Live-edit polish.** Animation, highlights, activity log with click-to-jump, selection sharing.
9. **Nested maps, export, packaging.** Child maps, SVG and PNG export, and the Mac app bundle.

Order after step 4 is flexible.

## Later or optional
- **Approve mode:** a switch inside the app. When on, Claude's edits appear faded until you accept them.
- HTTP MCP transport, Windows build, print presets, city-map drawing.

## Out of scope
AI image generation, illustrations, accounts or cloud sync, mobile.
