# Engion - System Architecture & Technical Specifications

Engion is a desktop vocabulary learning application built with **Electron + React + Vite + TypeScript**. It features a passive learning mechanism via floating popups triggered by system timers or global hotkeys, backed by Spaced Repetition System (SRS) algorithms.

---

## 🏗️ Technical Stack

- **Framework**: Electron 32.x
- **Frontend Core**: React 18 + Vite 5 + TypeScript 5
- **Icons**: Lucide React
- **Audio Engine**: Web Speech API (`SpeechSynthesisUtterance`) with US/UK accent selection
- **Translation & Dictionary Engine**:
  - `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` (Phonetics, POS, English Examples)
  - `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={targetLang}&dt=t&q={word}` (Multi-language Translation: `vi`, `ja`, `ko`, `zh`, `fr`, `es`, `de`)
- **Data Persistence**: HTML5 `localStorage` (Settings, Daily Targets, Custom Words, SRS Progress, Starred Favorites) & IPC File Backup (JSON / CSV).
- **Cloud Sync**: Google OAuth2 (RFC 8252 loopback flow) + Google Drive API v3 `appDataFolder` for cross-device sync.

---

## 💻 Process Architecture & IPC Model

```
+-------------------------------------------------------------------------+
|                         ELECTRON MAIN PROCESS                           |
|  - System Tray (Live Tooltip Countdown & Context Menu)                 |
|  - Single Instance Lock (app.requestSingleInstanceLock)                 |
|  - Global Shortcuts (Alt+D: Dashboard, Alt+N: Quick Add, Alt+E: Quiz, Alt+Q: Close Focused Window) |
|  - Windows Management (DashboardWindow & PopupWindow)                   |
|  - Timer & Countdown Ticker Loop                                        |
+------------------------------------+------------------------------------+
                                     |
                               IPC Bridge (`preload.js`)
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
- **Tray Management**: Generates 32x32 PNG icon (`scripts/create-icon.js`) dynamically, updates context menu (`Open Dashboard`, `Test Popup`, `Do Not Disturb Submenu`, `Intervals`, `Exit`), and live hover tooltip countdown / DND status.
- **Do Not Disturb (DND) Safeguard**: Evaluates temporary pauses (`dndUntil`) and scheduled quiet hours (`dndEnabled`, `dndStart`, `dndEnd`) before automatically triggering floating popups.
- **Window Management**:
  - `dashboardWindow`: Standard 1000x700 window for complete dashboard management.
  - `popupWindow`: Frameless, transparent, `alwaysOnTop: true`, `skipTaskbar: true`, 440x500 window anchored at bottom-right of primary display (`screenWidth - 460`, `screenHeight - 520`).
- **Focus & Mouse Reactivity Safeguard**: Uses `popupWindow.focus()` and React `onMouseDown` event handlers to guarantee 1-click closing without OS focus-swallowing delays.
- **Google OAuth2 Login (RFC 8252 loopback flow)**: `ipcMain.handle('google-auth-start')` spins up a short-lived `http` server on `127.0.0.1` (port `8085`, auto-falls back to `8086-8089`/a random port if occupied), opens the consent screen in the **system's default browser** via `shell.openExternal` (never an embedded `BrowserWindow` — Google blocks/degrades OAuth from embedded webviews), verifies the returned `state` param (CSRF), exchanges the auth code for tokens, and stores them via `safeStorage` (falls back to plain JSON if OS-level encryption is unavailable). `google-auth-status` / `google-get-token` auto-refresh the access token when expired; `google-auth-logout` clears stored tokens.

### 2. Preload Script (`electron/preload.ts`)
Exposes safe context bridge API `window.electronAPI`. Built via `vite-plugin-electron`, which must emit **CommonJS**, not ESM — Electron loads preload scripts with `require()`, and this repo's `"type": "module"` in `package.json` would otherwise make Vite build it as ESM (silently breaking the entire bridge). See the `force-preload-cjs` plugin in `vite.config.ts`.
- `openDashboard()`: Shows & focuses main dashboard.
- `closePopup()`: Safely closes/destroys floating popup window.
- `getTimerState()`: Fetches current countdown & next popup timestamp.
- `onUpdateTimer(callback)`: Listens for live countdown tick updates.
- `onOpenPopupQuiz(callback)`: Listens for popup trigger events.
- `setAutoLaunch(enable)`: Configures Windows startup registry launch (`applyAutoLaunch`) with Portable build support (`process.env.PORTABLE_EXECUTABLE_FILE`), Dev mode handling, and silent tray start Toast/Balloon notifications.
- `checkForUpdates()`: Triggers background release check via GitHub API (`nguyenngoctrung007/engion`).
- `onUpdateAvailable(callback)`: Listens for new release notifications with GitHub Release download URL.
- `googleAuthStart()` / `googleAuthStatus()` / `googleGetToken()` / `googleAuthLogout()`: Google Drive Sync IPC bridge (see above).

### 3. Renderer Process (`src/`)
- **Dual Mode Guard (`App.tsx`)**: Evaluates `isPopupMode` based on 3 strict criteria:
  1. `window.location.hash.includes('popup')`
  2. `window.location.search.includes('popup')`
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
