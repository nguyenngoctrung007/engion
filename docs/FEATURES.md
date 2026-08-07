# Engion - Comprehensive Feature Guide

This document details all implemented features, business logic, and UI capabilities in Engion.

---

## 🚀 Key Features Overview

### 1. 🔔 System Tray & Floating Popup Window
- **Live Tooltip Countdown**: Hovering over the system tray icon shows real-time countdown (e.g., `Engion - Luyện Từ Vựng (Popup tiếp theo sau: 14 phút 30 giây)`).
- **Non-Transparent Tray Icon**: Clean 32x32 PNG icon built to conform to Win32 System Tray specs.
- **Minimize-to-Tray 📥**: Clicking Minimize (`_`) or Close (`X`) on the main Dashboard window hides the window directly to System Tray instead of cluttering the Windows Taskbar.
### ⚡ 2. Global Hotkeys & Quick Add Word (Bộ Phím Tắt Toàn Cục & Thêm Từ Vựng Siêu Nhanh)
- **Bộ Phím Tắt Toàn Cục (System-wide Global Shortcuts)**:
  - **`Alt + D`**: Mở Engion Dashboard (Bảng điều khiển chính).
  - **`Alt + N`**: Mở Quick Add (Cửa sổ thêm từ vựng siêu nhanh 500x440px).
  - **`Alt + E`**: Bật Popup Flashcard (Học / Luyện từ ngay lập tức).
  - **`Alt + Q`**: **Đóng ngay cửa sổ / dialog hiện tại đang focus**.
- **Luồng Tra Từ 1-Click & Chống Trùng Lặp Gộp Nghĩa**:
  - Gõ từ tiếng Anh ➔ Bấm `Enter` để tra từ điển Oxford & Google Translate.
  - **Smart POS Selector**: Tự động nhận diện chính xác Động từ (`verb`), Danh từ (`noun`), Tính từ (`adjective`), Trạng từ (`adverb`).
  - **Natural Context Generator**: Tự động sinh câu ngữ cảnh mượt mà thực tế cho các từ giao tiếp (`okay`, `hello`, `hi`).
  - **Smart Duplicate Prevention & Merge**: Nếu từ đã có sẵn trong Kho, hệ thống tự động gộp nghĩa mới (ví dụ: `"chơi; vở kịch"`) tránh tạo rác dữ liệu.
  - Nhấn `Ctrl + Enter` (hoặc `Alt + Enter`) để lưu ngầm vào Kho và tự đóng cửa sổ.

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
- **Favorite Tagging**: Click the star icon **`⭐`** on any word card in the Deck Manager or directly in the top action bar of the **Popup Quiz window** to toggle favorite status for special attention without needing to open the Deck Manager.
- **Dedicated Favorite Filter**: Filter deck by **`⭐ YÊU THÍCH`** to review starred words.
- **Anki / CSV Exporter**: Export entire vocabulary bank (Word, Phonetic, POS, Definition, Example, Deck) into a UTF-8 `.csv` file format ready for import into **Anki** or **Quizlet** mobile apps.

---

### 5. 🧠 Enhanced Spaced Repetition System (SRS Engine) & Visual Box Distribution
- **Thuật Toán SM-2 Nâng Cấp & Fuzz ±10%**:
  - `Box 1`: Mới học / Hay quên (Lặp sau 1 ngày) — Thanh Đỏ `#EF4444`
  - `Box 2`: Đang ghi nhớ (Lặp sau 4 ngày) — Thanh Cam `#F59E0B`
  - `Box 3`: Khá vững (Lặp sau 7-10 ngày) — Thanh Xanh Chàm `#6366F1`
  - `Box 4 & 5`: Thuộc lòng (Lặp sau 15-30 ngày) — Thanh Xanh Lá `#10B981`
  - `EaseFactor`: Giới hạn từ `1.3` (từ rất khó) đến `3.0` (từ rất dễ).
  - `Leech Detection`: Theo dõi các từ bị chọn `hard` liên tiếp (`consecutiveHard`) để đưa vào danh sách **🔥 Từ vựng hay sai nhất**.
- **Bộ Chọn Từ 3 Tầng Ưu Tiên Thông Minh (3-Tier Smart Word Picker)**:
  - **Tier 1 (Đến hạn ôn - Due Words)**: Ưu tiên tuyệt đối các từ đã đến hạn hoặc quá hạn ôn luyện (`nextReview ≤ now`), sắp xếp từ cũ nhất lên đầu.
  - **Tier 2 (Từ mới - Unseen Words)**: Tiếp theo ưu tiên hiển thị các từ vựng mới thêm vào Kho chưa học bao giờ.
  - **Tier 3 (Ôn dải rộng - Least Recently Reviewed)**: Nếu không có từ quá hạn hay từ mới, lấy ngẫu nhiên trong 30% số từ ít được ôn tập nhất gần đây.
- **3 Interactive Quiz Modes**:
  1. **Flashcard**: Lật thẻ xem đáp án, đánh giá trí nhớ (`Khó`, `Nhớ được`, `Thuộc`).
  2. **Fill-in-the-blank**: Gõ từ tiếng Anh tương ứng với nghĩa Tiếng Việt.
  3. **Multiple Choice**: Trắc nghiệm 4 lựa chọn bản dịch chuẩn xác.
- **Weak Words Focus Deck (`🔥 CẦN ÔN LẠI`)**: Tự động tổng hợp các từ thuộc Box 1 & 2 hoặc từ có tỷ lệ chính xác thấp để ôn tập tập trung.

---

### 6. 🏆 Gamification, Daily Goal & Roast Badges (Khích Tướng)
- **Daily Learning Target (Mục tiêu hàng ngày)**: Set minimum daily word target (5, 10, 15, 20, 30 words/day) with a real-time progress bar (`🎯 Mục tiêu hôm nay: 8/10 từ`) and 100% completion badge.
- **4 Unlockable Achievement Badges (Huy Hiệu Vinh Danh)**:
  - `🔥 Streak 7 Ngày` (Maintained 7 consecutive days)
  - `🧠 Bậc Thầy Từ Vựng` (Mastered 10+ words)
  - `⚡ Học Giả Chăm Chỉ` (Reviewed 20+ words)
  - `🎯 Sát Thủ Tiếng Anh` (Accuracy rate > 80%)
- **4 Provocative & Troll Badges (Huy Hiệu Khích Tướng Troll)**:
  - `😴 Trùm Làm Biếng`: Gắn nhãn khi chưa nạp từ nào trong ngày hoặc Streak = 1.
  - `❌ Trùm Sai Vặt`: Gắn nhãn khi bị đánh dấu Khó / Trả lời sai từ 3+ lần.
  - `🎲 Chuyên Gia Chọn Lụi`: Gắn nhãn khi tỷ lệ chính xác dưới 50%.
  - `🌀 Thánh Quên Từ`: Gắn nhãn khi có từ dính kẹt lại ở Box 1 chưa thăng cấp được.

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
- **Windows Autostart & Silent Tray Launch**: Auto-launch Engion in system tray on Windows boot. Supports Portable builds (`process.env.PORTABLE_EXECUTABLE_FILE`), Dev mode, and displays a native Toast/Balloon notification (*"Engion đã tự động khởi động và đang chạy ngầm trong Khay hệ thống"*) when started silently.
- **JSON Backup & Restore**: Export/Import full application state (Settings, Custom Words, SRS progress) via `.json`.
- **Floating Toast Notifications**: Fixed bottom-right notifications (`position: fixed`) with zero layout shift.
