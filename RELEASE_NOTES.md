# 🚀 Engion v1.1.1 - Release Notes

**Release Date**: August 17, 2026

Engion v1.1.1 introduces 1-Click Quick Auto-Lookup (`✨ Tra từ`), Datamuse Spellcheck Auto-Correction, Difficulty-Filtered Internet Random Word Recommendation (`?diff=1..5`), and ultra-compact popup window header optimizations!

---

## 🔥 Key Highlights in v1.1.1

### ✨ 1. 1-Click Quick Auto-Lookup & Sửa Nhanh Từ Vựng
- **`✨ Tra từ` Button**: Added to Quick Edit Word modals (`PopupContainer.tsx`, `DeckManager.tsx`, `QuickAddReviewModal.tsx`). Clicking it automatically re-fetches correct IPA phonetics, definitions, and example sentences from dictionary APIs.

### 🤖 2. Datamuse Spellcheck Auto-Correction Engine
- **Automatic Typo Correction**: If a user types a misspelled word like `incridible`, Engion detects the dictionary 404, queries Datamuse API to auto-correct `incridible` ➔ `incredible`, and populates official IPA, definitions, and examples with an inline toast notification (`💡 Đã tự động sửa lỗi chính tả: "incridible" ➔ "incredible"`).

### 🌐 3. Unlimited Internet Random Word Recommendation with Difficulty Filter (`?diff=1..5`)
- **Internet Random Word API**: Queries `random-word-api.herokuapp.com` and `api.datamuse.com` to fetch brand-new, unlimited English words directly from the web.
- **Difficulty Selector**: Users can filter random word recommendations by proficiency level:
  - 🟢 **Dễ (Easy - Common words)**: `diff=1` (e.g. `water`, `house`, `smile`)
  - 🟡 **Vừa (Medium - Moderately common)**: `diff=3` (e.g. `resilient`, `schedule`, `pragmatic`)
  - 🔴 **Khó (Hard - Rare words)**: `diff=5` (e.g. `defenestration`, `ephemeral`, `quintessential`)

### 🔲 4. Ultra-Compact Non-Wrapping Popup Header
- Applied `whiteSpace: 'nowrap'` and compact icon paddings to the 360px popup window header (`Thẻ từ`, `Điền từ`, `Trắc nghiệm`), preventing awkward line breaks and ensuring a sleek native desktop look.

---

# 🚀 Engion v1.1.0 - Release Notes

**Release Date**: August 7, 2026

Engion v1.1.0 introduces a major upgrade to the Spaced Repetition System (SRS) algorithm, a 3-tier smart word picker, detailed 4-box memory distribution visualizations, top weak words statistics, global hotkeys, and gamified provocative roast badges!

---

## 🔥 Key Highlights in v1.1.0

### 🧠 1. Enhanced SM-2 Spaced Repetition Engine & 3-Tier Picker
- **SM-2 Engine Refinement**: Dynamic Ease Factor clamping (`1.3` to `3.0`), interval progression optimization, and `±10%` random fuzzing to eliminate interval stacking.
- **3-Tier Smart Picker (`pickSmartNextWord`)**:
  - **Tier 1 (Due Words)**: Prioritizes overdue review words (`nextReview ≤ now`) sorted by oldest due date first.
  - **Tier 2 (New Words)**: Presents unseen words recently added to your bank.
  - **Tier 3 (Least Recently Reviewed)**: Selects from the bottom 30% least-recently reviewed pool.
- **Leech Detection (`consecutiveHard`)**: Automatically flags words repeatedly marked "Hard".

### 📊 2. Top Weak Words Tracker & 4-Box Distribution
- **Top Weak Words Card**: Dedicated card in *Stats Overview* highlighting the top 5 hardest/most frequently failed vocabulary words with instant **`⚡ Practice 10 Words`** shortcut.
- **4-Box Visual Distribution**: Real-time progress bars for **Box 1** (Red - 1 day), **Box 2** (Amber - 4 days), **Box 3** (Indigo - 7 days), and **Box 4 & 5** (Green - 15-30 days).

### 😈 3. Gamified Roast & Troll Badges
- Added funny provocative badges alongside standard achievement awards:
  - 😴 **Trùm Làm Biếng**: Triggered when 0 words learned today or streak is 1.
  - ❌ **Trùm Sai Vặt**: Triggered when 3+ words answered wrong / hard.
  - 🎲 **Chuyên Gia Chọn Lụi**: Triggered when quiz accuracy drops below 50%.
  - 🌀 **Thánh Quên Từ**: Triggered when multiple words are stuck at Box 1.

### ⌨️ 4. Global Hotkey Suite & Instant Win32 Response
- `Alt + D`: Instant global trigger to open / focus Engion Dashboard.
- `Alt + N`: Instant popup to add vocabulary.
- `Alt + E`: Instant quiz review.
- `Alt + Q` / `ESC`: Close active focused window/dialog immediately.
- Win32 `onMouseDown` optimization ensuring instantaneous 1-click window responses.

---

## 🛠️ Summary of Changed Components

- `src/services/srs.ts`: Enhanced SM-2 calculation & 3-tier smart word picker.
- `src/services/storage.ts`: Added `getTopWeakWords(limit)` and 5-box stats breakdown.
- `src/components/Dashboard/StatsOverview.tsx`: Visual 4-box bars, weak words card, roast badges.
- `src/components/Dashboard/DeckManager.tsx`: Separated & highlighted static filter tabs (`TẤT CẢ`, `⭐ YÊU THÍCH`, `🔥 CẦN ÔN LẠI`).
- `src/components/Popup/PopupContainer.tsx`: SRS-aware word picking & Win32 1-click focus fix.
- `electron/main.ts`: Registered global shortcuts (`Alt+D`, `Alt+N`, `Alt+E`, `Alt+Q`).
