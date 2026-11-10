# Engion - System Architecture & Technical Specifications

Engion is a desktop vocabulary learning application built with **Electron + React + Vite + TypeScript**. It features a passive learning mechanism via floating popups triggered by system timers or global hotkeys, backed by Spaced Repetition System (SRS) algorithms.

---

## 🏗️ Technical Stack

- **Framework**: Electron 31.x (`^31.2.0`)
- **Frontend Core**: React 18 + Vite 5 + TypeScript 5
- **Icons**: Lucide React
- **Audio Engine**: Web Speech API (`SpeechSynthesisUtterance`) with US/UK accent selection
- **Translation & Dictionary Engine**:
  - `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` (Phonetics, POS, English Examples)
  - `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={targetLang}&dt=t&q={word}` (Multi-language Translation: `vi`, `ja`, `ko`, `zh`, `fr`, `es`, `de`)
  - `https://api.datamuse.com` (spell-check suggestions) and `https://random-word-api.herokuapp.com` (random word suggestions by difficulty)
- **Data Persistence**: HTML5 `localStorage` (Settings, Daily Targets, Custom Words, SRS Progress, Starred Favorites). JSON backup / CSV export are browser downloads generated in the renderer (`Blob` + `<a download>` in `SettingsPanel.tsx`), not IPC.
- **Cloud Sync**: Google OAuth2 (RFC 8252 loopback flow) + Google Drive API v3 `appDataFolder` for cross-device sync.

---

## 💻 Process Architecture & IPC Model

```
+-------------------------------------------------------------------------+
|                         ELECTRON MAIN PROCESS                           |
|  - System Tray (Live Tooltip Countdown & Context Menu)                 |
|  - Single Instance Lock (app.requestSingleInstanceLock)                 |
|  - Global Shortcuts (Alt+D: Dashboard, Alt+N: Quick Add, Alt+E: Quiz, Alt+Q: Close Focused Window) |
|  - Windows Management (Dashboard, Popup, Quick Add, Quick Add Review)   |
|  - Timer & Countdown Ticker Loop                                        |
+------------------------------------+------------------------------------+
                                     |
                               IPC Bridge (`preload.ts`)
                                     |
+------------------------------------+------------------------------------+
|                       RENDERER PROCESS (React SPA)                      |
|                                                                         |
|   +--------------------------+        +-----------------------------+   |
|   |    Dashboard Window      |        |     Frameless Popup Window  |   |
|   |  - Kho Từ Vựng           |        |  - Flashcard Quiz           |   |
|   |  - Thống Kê Tiến Độ      |        |  - Fill-in-the-blank Quiz   |   |
|   |  - Cài Đặt & Nâng Cao    |        |  - Multiple Choice Quiz     |   |
|   +--------------------------+        +-----------------------------+   |
+-------------------------------------------------------------------------+
```

### 1. Main Process (`electron/main.ts`)
- **Single Instance Lock**: Ensures only 1 instance of Engion runs; second launch restores Dashboard.
- **Tray Management**: Generates 32x32 PNG icon (`scripts/create-icon.js`) dynamically, updates context menu (update-available link when a new release exists, `Open Dashboard (Alt+D)`, `Quick Add (Alt+N)`, `Practice Now (Alt+E)`, `Do Not Disturb` submenu, `Interval` submenu, `Exit`), and live hover tooltip countdown / DND status.
- **Global Shortcuts**: `Alt+D` / `Ctrl+Shift+D` (Dashboard), `Alt+N` / `Ctrl+Shift+N` (Quick Add), `Alt+E` / `Ctrl+Shift+E` (Quiz popup), `Alt+Q` (hide focused Engion window).
- **Auto-Updater**: `electron-updater` (`autoDownload: false`) checks GitHub Releases 5s after startup in packaged builds only; on `update-available` it adds a tray menu item, sends `update-available` to the Dashboard, and shows a native notification that opens the GitHub `/releases/latest` page. The Settings panel separately queries the GitHub REST API (`src/services/updateChecker.ts`) for a manual version check.
- **Do Not Disturb (DND) Safeguard**: Evaluates temporary pauses (`dndUntil`) and scheduled quiet hours (`dndEnabled`, `dndStart`, `dndEnd`) before automatically triggering floating popups.
- **Window Management (Pre-warmed Singleton Windows)**:
  - `dashboardWindow`: Standard 1080x720 window for complete dashboard management (minimized/hidden on close).
  - `popupWindow`: Frameless, transparent, `alwaysOnTop: true`, `skipTaskbar: true`, 440x500 window anchored at bottom-right of active display. Pre-warmed at startup (`show: false`) and reused with `hide()`/`show()` for instant (<10ms) invocation.
  - `quickAddWindow`: Frameless, transparent 550x500 window centered on active display (`screen.getDisplayNearestPoint`). Pre-warmed at startup and reused via `hide()`/`show()` with auto-reset & focus signal. The renderer can resize it via `resize-quick-add-window` (440x115 collapsed / 480x480 expanded).
  - `quickAddReviewWindow`: Frameless 550x500 window that looks up a single word (`?mode=quick-add-review`). Unlike the others it is **not** pre-warmed — it is destroyed and recreated on each `open-quick-add-review-window` call.
- **Focus & Multi-monitor Safeguard**: Dynamically calculates coordinates on the active monitor containing the cursor before `win.show()`, fires `quiz-popup-activated` / `quick-add-activated` IPC signals to reset state, and uses React `onMouseDown` event handlers to guarantee 1-click closing without OS focus-swallowing delays.
- **Google OAuth2 Login (RFC 8252 loopback flow)**: `ipcMain.handle('google-auth-start')` spins up a short-lived `http` server on `127.0.0.1` (port `8085`, auto-falls back to `8086-8089`/a random port if occupied), opens the consent screen in the **system's default browser** via `shell.openExternal` (never an embedded `BrowserWindow` — Google blocks/degrades OAuth from embedded webviews), verifies the returned `state` param (CSRF), exchanges the auth code for tokens, and stores them via `safeStorage` (falls back to plain JSON if OS-level encryption is unavailable). `google-auth-status` / `google-get-token` auto-refresh the access token when expired; `google-auth-logout` clears stored tokens.

### 2. Preload Script (`electron/preload.ts`)
Exposes safe context bridge API `window.electronAPI`. Built via `vite-plugin-electron`, which must emit **CommonJS**, not ESM — Electron loads preload scripts with `require()`, and this repo's `"type": "module"` in `package.json` would otherwise make Vite build it as ESM (silently breaking the entire bridge). See the `force-preload-cjs` plugin in `vite.config.ts`.
- **Windows**: `openDashboard()`, `closePopup()` (hides `popupWindow`), `openQuickAdd()`, `closeQuickAdd()`, `resizeQuickAddWindow(expanded)`, `openQuickAddReview(word)`.
- **Activation signals**: `onQuizPopupActivated(cb)` (refresh SRS card when popup is shown), `onQuickAddActivated(cb)` (reset input & autofocus), `onOpenPopup(cb)` (popup trigger event).
- **Timer**: `getTimerStatus()` (asks main to emit current state), `onTimerTick(cb)` (live countdown), `triggerPracticeNow()`.
- **Settings**: `updateSettings(settings)` sends `update-timer-settings` — main applies the interval, DND fields, and `autoLaunch` (via `applyAutoLaunch`, with Portable build support through `process.env.PORTABLE_EXECUTABLE_FILE`). `onSettingsUpdatedFromTray(cb)` receives changes made from the tray menu.
- **Misc**: `sendNotification(title, body)` (native notification), `selectAndParseApkg()` (file dialog + `.apkg` read).
- **Updates**: `checkForUpdates()`, `onUpdateAvailable(cb)`. Engion does not download or install updates in-app — users get the new installer/portable `.exe` from the GitHub Releases page.
- **Google Drive Sync**: `googleAuthStart()` / `googleAuthStatus()` / `googleGetToken()` / `googleAuthLogout()` (see above).

### 3. Renderer Process (`src/`)
- **Dual Mode Guard (`App.tsx`)**: All windows load the same bundle. `App.tsx` first checks for `quick-add-review` and then `quick-add` in the URL hash/query. Only if neither matches does it evaluate popup mode from 3 criteria:
  1. `window.location.hash.includes('popup')`
  2. `window.location.search.includes('mode=popup')`
  3. `(window.innerWidth <= 550 && window.innerHeight <= 600)`
  *Ensures frameless popup window NEVER falls back to rendering the full Dashboard.*
- **Popup Container Controls (`PopupContainer.tsx`)**: Exposes instant top action bar controls across all quiz modes (Flashcard, Fill-in-the-blank, Choice) including 1-click **Star Favorite toggle** (`StorageService.toggleFavorite`), **Edit Word**, and **Delete Word**.

---

## 📁 Directory Structure & Key Files

```
engion/
├── docs/                             # Documentation files
│   ├── ARCHITECTURE.md               # Architecture & system specifications
│   ├── FEATURES.md                   # Full feature list & specs
│   ├── DEVELOPMENT_GUIDE.md          # Local setup & build instructions
│   └── RULES.md                      # Developer & AI working rules
├── electron/                         # Electron Main & Preload source
│   ├── main.ts                       # Main process entry point + Google OAuth2 IPC handlers
│   └── preload.ts                    # Preload script (context bridge, built to CJS)
├── scripts/
│   └── create-icon.js                # Dynamically generates 32x32 PNG tray icon
├── src/                              # React App source
│   ├── components/
│   │   ├── Common/                   # Reusable UI components (AudioButton, Badge, SpeechMicButton)
│   │   ├── Dashboard/                # Dashboard tabs & Modals (DeckManager, StatsOverview, SettingsPanel, QuickAddModal, QuickAddReviewModal, GoogleDriveSyncCard)
│   │   └── Popup/                    # Floating popup components (PopupContainer, FlashcardView, FillInBlankQuiz, MultipleChoiceQuiz)
│   ├── data/
│   │   └── vocabulary.ts             # 24 Built-in vocabulary words (IT, TOEIC, IELTS, Oxford)
│   ├── services/
│   │   ├── dictionary.ts             # Dictionary API & Google Translate integration
│   │   ├── srs.ts                    # Enhanced SM-2 Engine, ±10% fuzzing, 3-tier smart word picker
│   │   ├── storage.ts                # StorageService (localStorage, SRS, favorites, weak words, CSV/JSON export)
│   │   └── googleDriveService.ts     # Google Drive Sync: login, appDataFolder upload/download, smart two-way sync
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces & types
│   ├── App.tsx                       # Main React App root
│   ├── index.css                     # Global design system CSS
│   └── main.tsx                      # Vite React entry
├── package.json                      # Build & scripts config
├── tsconfig.json                     # TypeScript compiler options
└── vite.config.ts                    # Vite build configuration
```
