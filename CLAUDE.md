# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Engion is a Windows-focused Electron + React 18 + Vite 5 + TypeScript tray app for passive English vocabulary learning: a tray timer periodically opens a floating quiz popup (Flashcard / Fill-in-the-blank / Multiple Choice) driven by an SM-2-style SRS engine. Detailed docs live in `docs/` (ARCHITECTURE, FEATURES, DEVELOPMENT_GUIDE, RULES — some in Vietnamese).

## Commands

```bash
npm install          # postinstall generates the tray icon (scripts/create-icon.js)
npm run dev          # Vite dev server (localhost:5173) + Electron via vite-plugin-electron
npm run build        # create-icon + `tsc` typecheck + vite build → dist/ (renderer) and dist-electron/ (main, preload)
npm run dist         # build + electron-builder → dist_electron/ (NSIS installer + portable .exe)
```

There is no test suite and no linter. `npm run build` (which runs `tsc`) is the verification step — run it before declaring work done.

Google Drive Sync needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env` (copy `.env.example`). The app runs without them; only sync fails. These values are inlined into `dist-electron/main.js` at build time via `define` in `vite.config.ts`.

## Architecture

**One renderer bundle, multiple windows.** `electron/main.ts` creates windows (dashboard, popup, quick-add, quick-add-review) that all load the same `index.html`, distinguished by `?mode=...#...` URL params. Dashboard, popup and quick-add are pre-warmed singletons that are shown/hidden (never recreated) for instant hotkey response; quick-add-review is the exception and is destroyed/recreated per lookup. On each show, main sends `quiz-popup-activated` / `quick-add-activated` IPC signals so the React side resets its state. `src/App.tsx` routes on this mode:
- quick-add-review / quick-add checks come first; popup mode is `hash/search includes 'popup'` **or** `innerWidth <= 550 && innerHeight <= 600`.
- This "Dual Mode Guard" must not be removed or weakened — it prevents the 440x500 frameless popup from ever rendering the full dashboard.

**Main process (`electron/main.ts`, single large file)** owns: tray + live countdown tooltip, the popup timer loop with Do-Not-Disturb checks (`dndUntil`, quiet hours), global shortcuts (Alt+D dashboard, Alt+N quick add, Alt+E quiz, Alt+Q close focused), single-instance lock, auto-launch (handles portable builds via `PORTABLE_EXECUTABLE_FILE`), GitHub-release update checks, `.apkg` file selection, and the Google OAuth loopback flow (local HTTP server on 127.0.0.1:8085 with fallback ports, system browser via `shell.openExternal`, tokens stored with `safeStorage`). Popup/quick-add windows are positioned on the display under the cursor.

**IPC boundary.** `contextIsolation: true`, `nodeIntegration: false`. Every main↔renderer call goes through `window.electronAPI` in `electron/preload.ts`; adding an IPC feature means touching `main.ts` (handler), `preload.ts` (bridge), and the renderer type for `electronAPI`. The preload **must build as CommonJS** — the `force-preload-cjs` plugin in `vite.config.ts` enforces this because `"type": "module"` would otherwise produce ESM and silently break the entire bridge. Don't "simplify" that plugin into a `mergeConfig` override (arrays concatenate, building both formats into one file).

**Renderer data layer (`src/services/`).** All persistence is `localStorage` via `StorageService` in `storage.ts` (keys prefixed `engion_`: settings, word progress, custom words/decks, favorites, stats, and *tombstone lists* of deleted word/deck IDs — built-in vocabulary from `src/data/` is never mutated, deletions are recorded as tombstones). `srs.ts` holds the SM-2 scheduler (±10% interval fuzz) and the 3-tier word picker used by the popup. `googleDriveService.ts` syncs a snapshot of this localStorage state to Drive `appDataFolder`, comparing cloud vs. local timestamps before push/pull. `packageParser.ts` parses Anki `.apkg` in memory with JSZip. `dictionary.ts` calls dictionaryapi.dev and the unofficial Google Translate `translate_a/single` endpoint.

## Project rules (from docs/RULES.md and .agents/AGENTS.md)

- **Keep `docs/` in sync** — mandatory: update `FEATURES.md` for feature/logic changes, `ARCHITECTURE.md` for IPC/window/data-flow changes, `DEVELOPMENT_GUIDE.md` for build/env/process changes, `RULES.md` for new rules. README is also kept current.
- Ask the user before implementing when requirements are ambiguous or when changing business logic, APIs, or data schemas (localStorage shape affects existing users and Drive sync).
- No browser `alert()` and no layout-shifting messages: use `position: fixed` floating toasts or non-blocking inline messages.
- Close/action buttons in floating windows handle `onMouseDown` alongside `onClick` (Win32 swallows the first click to grant focus).
- Keep code simple, avoid unnecessary abstractions; put types in `src/types/`, avoid `any`.
- Fix root causes — no empty `catch` blocks or commented-out broken code.

## Releasing

Version lives in three places that must stay in sync: `package.json` `version`, `src/config/version.ts` `APP_VERSION`, and a new entry in `RELEASE_NOTES.md`. The in-app updater checks GitHub releases of `nguyenngoctrung007/engion`.
