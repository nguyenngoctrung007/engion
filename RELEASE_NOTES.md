# 🚀 Engion v1.2.1 - Release Notes

**Release Date**: August 21, 2026

Engion v1.2.1 mang đến cải tiến vượt bậc về tốc độ phản hồi phím tắt tức thì (<10ms) trong Production, Chế độ Thêm từ liên tục (Continuous Quick Add), và Live SRS Progress Badge hiển thị số lượt ôn tập trực quan trên từng thẻ từ vựng và Popup Quiz.

---

## 🔥 Key Highlights in v1.2.1

### ⚡ 1. Pre-warmed Singleton Windows & Tốc Độ Invoke Tức Thì (< 10ms)
- **Tối ưu triệt để độ trễ**: Khởi tạo sẵn cửa sổ Quiz và Quick Add ở chế độ ẩn (`show: false`), chuyển đổi hoàn toàn cơ chế `destroy()` sang `hide()` / `show()`. Giảm độ trễ từ 500ms xuống **dưới 10ms (tức thì)** khi bấm `Alt+N`, `Alt+E`, `Alt+D` trong bản build Production.
- **Tự động Reset & Focus**: IPC signal `quick-add-activated` và `quiz-popup-activated` tự động làm mới form nhập liệu và cập nhật câu hỏi SRS mới nhất mỗi khi mở lại cửa sổ.

### 📝 2. Chế Độ Thêm Từ Liên Tục (Continuous Quick Add Mode)
- **Nhập hàng loạt không gián đoạn**: Bổ sung checkbox `[x] ⚡ Giữ cửa sổ để thêm liên tục nhiều từ` ngay trên Quick Add Modal và tùy chọn trong Settings.
- **Phím tắt Power-user**: `Ctrl + Shift + Enter` để lưu từ hiện tại và sẵn sàng nhập từ tiếp theo ngay lập tức mà không cần rời tay khỏi bàn phím.
- **Kích thước rộng rãi hơn**: Cửa sổ Quick Add được mở rộng lên **550x500px** giúp hiển thị thoải mái đầy đủ mọi thông tin.

### 🔄 3. Live SRS Progress & Mastery Badge
- **Huy hiệu số lượt ôn tập trực quan**: Hiển thị rõ ràng số lần xuất hiện/ôn tập và cấp độ hộp ghi nhớ (`✨ Mới • 0 lượt`, `🔄 3 lượt • Box 2`, `🌟 8 lượt • Thuộc lòng`) kèm tooltip tỷ lệ nhớ đúng.
- **Đồng bộ toàn diện**: Tích hợp trên cả **Kho Từ Vựng (DeckManager)** và **Popup Quiz** (cả 3 chế độ: Thẻ từ, Điền từ, Trắc nghiệm).

---

# 🚀 Engion v1.2.0 - Release Notes

**Release Date**: August 18, 2026

Engion v1.2.0 introduces **Google Drive Sync** — back up and sync your vocabulary, SRS progress, streaks, and settings across devices for free, stored privately in your own Google Drive.

---

## 🔥 Key Highlights in v1.2.0

### ☁️ 1. Google Drive Sync (OAuth2 + appDataFolder)
- **System-Browser OAuth Login**: Standard RFC 8252 loopback-server flow — login opens your system's default browser instead of an embedded webview, avoiding Google's restrictions on embedded OAuth.
- **Private, App-Scoped Storage**: Synced data lives in Google Drive's hidden `appDataFolder` (via the `drive.appdata` scope) — invisible in the normal Drive UI, readable only by Engion.
- **Smart Two-Way Sync**: Compares cloud vs. local sync timestamps to decide whether to push or pull, so `☁️ Đồng bộ ngay` no longer blindly overwrites newer data already synced from another device.
- **Manual Controls**: `☁️ Đồng bộ ngay` (smart push/pull) and `⬇️ Khôi phục từ Cloud` (explicit, confirmed restore) in *Cài Đặt & Nâng Cao*.

---

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
