# Atlas — rules for working in this repo

Atlas is a Mac desktop app (Electron + TypeScript) for drawing fantasy world maps, which Claude can also edit live through MCP. The full picture is in `specs/00-overview.md`.

## Workflow (spec-driven)
- Every feature starts as a numbered spec in `specs/` (goal, what the user sees, acceptance criteria, out of scope).
- Write the spec first. Code only what an approved spec describes. If the plan changes while coding, update the spec in the same PR.
- One branch per spec (`spec-NN-short-name`), built in small commits that each leave the app working.
- Open a PR for each spec. In the description, cover what changed, how to try it, and the choices made, with the reasoning for each.
- **Never merge a PR until the user explicitly says "approved".** Then merge it.
- Prefer small, visible steps over large changes.

## Decisions
- Internal technical choices (libraries, file formats, code structure) are Claude's to make. Explain each in the PR.
- Anything the user sees or uses is the user's call. Ask.

## Git
- Never add "Co-Authored-By: Claude" or any other Claude attribution trailer to commits or PRs.

## Architecture rules
- `packages/engine` has no UI and no Electron imports. Both the app and the MCP server use it.
- Every map change, by hand or through MCP, goes through the command layer. That one path gives us undo, the activity log, and live updates.
- Engine behavior should be testable without opening a window.
