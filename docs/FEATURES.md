# Engion - Comprehensive Feature Guide

This document details all implemented features, business logic, and UI capabilities in Engion.

---

## 🚀 Key Features Overview

### 1. 🔔 System Tray & Floating Popup Window
- **Live Tooltip Countdown**: Hovering over the system tray icon shows real-time countdown (e.g., `Engion - Luyện Từ Vựng (Popup tiếp theo sau: 14 phút 30 giây)`).
- **Non-Transparent Tray Icon**: Clean 32x32 PNG icon built to conform to Win32 System Tray specs.
- **Minimize-to-Tray 📥**: Clicking Minimize (`_`) or Close (`X`) on the main Dashboard window hides the window directly to System Tray instead of cluttering the Windows Taskbar.
- **Global Hotkeys**: Press `Alt + E` or `Ctrl + Shift + E` anytime to force-trigger the learning popup.
- **Continuous Learning Session**: Floating popup tracks session count (e.g. `🔥 Đã học 3 từ`). Clicking **"Từ tiếp theo ➔"** generates a new word instantly.
- **Instant 1-Click Closing**: Close buttons (`X` and `Xong & Đóng ✕`) handle `onMouseDown` events to respond on the very first click without OS focus delays.

---

### 2. 📚 Vocabulary Management (Kho Từ Vựng)
- **Built-in Decks**: 24 curated words spanning 4 categories:
  - **IT**: `asynchronous`, `refactor`, `deprecated`, `concurrency`, `idempotent`, `middleware`
  - **TOEIC**: `negotiate`, `implement`, `collaborate`, `schedule`, `requisition`, `compliance`
  - **IELTS**: `ubiquitous`, `pragmatic`, `scrutinize`, `mitigate`, `ambiguous`, `delineate`
  - **Oxford**: `resilient`, `meticulous`, `proactive`, `versatile`, `eloquent`, `advocate`
- **Preset Vocabulary Library Catalog 📥 & Anki APKG Importer 🎴**: Click **`📥 Thư viện bộ từ có sẵn`** to:
  - **Direct Anki Package (.apkg) Import**: Select any `.apkg` file downloaded from AnkiWeb/computer and automatically extract & import hundreds of vocabulary cards into Engion.
  - **🌟 4000 Essential English Words 1** (600 real words extracted from Anki)
  - **📖 Oxford Core Vocabulary** (150+ curated core words)
  - **💻 IT & Software Developer** (50+ dev terms)
  - **💼 TOEIC Essential 600-900** (40+ commercial terms)
  - **🌐 Online URL / GitHub JSON Importer**: Paste any raw JSON deck URL to import instantly.
- **Word & Deck Management & Deletion 🗑️**:
  - **Universal Word Deletion 🗑️**: Delete any individual word card (custom, imported Anki, or built-in words).
  - **Custom Deck Deletion ✕**: Delete user-created custom deck categories and purge associated words.
- **Data Backup & Reset All Data 🔄**:
  - **Reset All Data Button 🔄**: Clear all custom words, imported Anki decks, custom categories, and study history back to fresh initial state in Settings.
- **Filtering Tabs**: `TẤT CẢ`, `⭐ YÊU THÍCH`, `🔥 CẦN ÔN LẠI`, `IT`, `TOEIC`, `IELTS`, `OXFORD`, `CUSTOM`, + Dynamic User-Created Decks.

---

### 3. 🤖 Auto-Dictionary Lookup & Validation (`⚡ Tra tự động`)
- **1-Click Auto Completion**: When adding a new word in the modal, typing an English word (e.g. `Serendipity`) and clicking **`⚡ Tra tự động`** automatically fills:
  - IPA Phonetic (`/ˌserənˈdɪpəti/`)
  - Part of Speech (`Noun`)
  - **Target Language Translation**: Powered by Google Translate Engine, auto-translating to user's configured target language (Vietnamese 🇻🇳, Japanese 🇯🇵, Korean 🇰🇷, Chinese 🇨🇳, French 🇫🇷, Spanish 🇪🇸, German 🇩🇪).
  - English Example Sentence (`Finding this book was pure serendipity...`)
- **Strict Spell & Gibberish Validation**: If user types an invalid or non-existent word (e.g. `hellissdfasdf`), it is validated against English Dictionary API. If invalid, a non-blocking red inline error (`❌ Không tìm thấy từ này trong từ điển`) is displayed, preserving form state without popups or form corruption.
- **🎙️ Speech Recognition & Pronunciation Evaluator**: Click the microphone button `🎙️` next to any word to speak into your mic. The app listens via Web Speech Recognition API and evaluates pronunciation accuracy (`✅ Đọc đúng` or `❌ Thử lại`).

---

### 4. ⚡ Quick Review Session Modal & Windows Goal Notifications
- **⚡ Dashboard Quick Review Modal**: Click **"⚡ Ôn 10 từ siêu tốc"** on the Dashboard to practice 10 random vocabulary words instantly in a 4-choice quiz modal.
- **🔔 Windows Goal Notifications**: Automatic Windows native desktop notification triggers when you reach 100% of your daily vocabulary target.

### 4. ⭐ Starred Favorites & Anki CSV Exporter
- **Favorite Tagging**: Click the star icon **`⭐`** on any word card to toggle favorite status.
- **Dedicated Favorite Filter**: Filter deck by **`⭐ YÊU THÍCH`** to review starred words.
- **Anki / CSV Exporter**: Export entire vocabulary bank (Word, Phonetic, POS, Definition, Example, Deck) into a UTF-8 `.csv` file format ready for import into **Anki** or **Quizlet** mobile apps.

---

### 5. 🧠 Spaced Repetition System (SRS) & Quiz Modes
- **5 Memory Boxes Algorithm**:
  - `Box 1`: Learning / Hard (reviewed every 1 day)
  - `Box 2`: Medium (reviewed every 3 days)
  - `Box 3`: Good (reviewed every 7 days)
  - `Box 4`: Mastered (reviewed every 15 days)
  - `Box 5`: Mastered (reviewed every 30 days)
- **3 Interactive Quiz Modes**:
  1. **Flashcard**: Flip card to reveal answer, rate memory (`Khó`, `Nhớ được`, `Thuộc`).
  2. **Fill-in-the-blank**: Type the English word matching the Vietnamese definition.
  3. **Multiple Choice**: Select correct translation out of 4 options.
- **Weak Words Focus Deck (`🔥 CẦN ÔN LẠI`)**: Automatically aggregates all words in Box 1 & 2 or low accuracy words for targeted revision.

---

### 6. 🏆 Gamification, Daily Goal & Badges
- **Daily Learning Target (Mục tiêu hàng ngày)**: Set minimum daily word target (5, 10, 15, 20, 30 words/day) with a real-time progress bar (`🎯 Mục tiêu hôm nay: 8/10 từ`) and 100% completion badge.
- **Tracks overall progress**: Total learned words, Mastered count (Box 4 & 5), Accuracy %, and Continuous Streak days.
- **4 Unlockable Achievement Badges**:
  - `🔥 Streak 7 Ngày` (Maintained 7 consecutive days)
  - `🧠 Bậc Thầy Từ Vựng` (Mastered 10+ words)
  - `⚡ Học Giả Chăm Chỉ` (Reviewed 20+ words)
  - `🎯 Sát Thủ Tiếng Anh` (Accuracy rate > 80%)

---

### 7. ⚙️ Settings & System Backup
- **Daily Target Control**: Configure daily word target (5, 10, 15, 20, 30 words/day).
- **Interval Control**: 10 seconds (Test), 15 minutes, 30 minutes (Recommended), 60 minutes.
- **Active Deck Selection**: Multi-select which decks trigger in popup quizzes.
- **Target Translation Language**: Select default auto-lookup translation language (Vietnamese, Japanese, Korean, Chinese, French, Spanish, German).
- **Do Not Disturb (DND)**:
  - **Quick Pause**: One-click temporary DND pause for 1 hour, 2 hours, or until 7:00 AM tomorrow via Settings or System Tray Context Menu.
  - **Scheduled Quiet Hours**: Configure automatic night DND hours (e.g., `22:00` to `07:00`) to suppress automatic popup quizzes.
- **Audio Accent & Auto-Play**: Toggle between US and UK accents with auto-audio option.
- **Windows Autostart**: Auto-launch Engion in system tray on Windows boot.
- **JSON Backup & Restore**: Export/Import full application state (Settings, Custom Words, SRS progress) via `.json`.
- **Floating Toast Notifications**: Fixed bottom-right notifications (`position: fixed`) with zero layout shift.
