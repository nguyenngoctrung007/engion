# Engion - Comprehensive Feature Guide

This document details all implemented features, business logic, and UI capabilities in Engion.

---

## 🚀 Key Features Overview

### 1. 🔔 System Tray & Floating Popup Window
- **Live Tooltip Countdown**: Hovering over the system tray icon shows real-time countdown (e.g., `Engion - Luyện Từ Vựng (Popup tiếp theo sau: 14 phút 30 giây)`).
- **Non-Transparent Tray Icon**: Clean 32x32 PNG icon built to conform to Win32 System Tray specs.
- **Minimize-to-Tray 📥**: Clicking Minimize (`_`) or Close (`X`) on the main Dashboard window hides the window directly to System Tray instead of cluttering the Windows Taskbar.
- **Ultra-Compact Non-Wrapping Header**: Segmented quiz mode tabs (`Thẻ từ`, `Điền từ`, `Trắc nghiệm`) are strictly configured with `whiteSpace: 'nowrap'` and compact icon padding to ensure zero line wrapping and a clean, spacious layout on 360px-wide windows.
- **Live SRS Progress Badge trên Thẻ Quiz 🔄**: Thay thế chữ tĩnh "Thẻ từ vựng" bằng huy hiệu tiến độ Spaced Repetition trực tiếp trên cả 3 chế độ (`Thẻ từ`, `Điền từ`, `Trắc nghiệm`), hiển thị rõ ràng `✨ Mới • 0 lượt`, `🔄 3 lượt • Box 2`, hoặc `🌟 8 lượt • Thuộc lòng` kèm tooltip thống kê chi tiết.
### ⚡ 2. Global Hotkeys & Quick Add Word (Bộ Phím Tắt Toàn Cục & Thêm Từ Vựng Siêu Nhanh)
- **Bộ Phím Tắt Toàn Cục (System-wide Global Shortcuts)**:
  - **`Alt + D`**: Mở Engion Dashboard (Bảng điều khiển chính).
  - **`Alt + N`**: Mở Quick Add (Cửa sổ thêm từ vựng siêu nhanh 500x440px).
  - **`Alt + E`**: Bật Popup Flashcard (Học / Luyện từ ngay lập tức).
  - **`Alt + Q`**: **Ẩn ngay cửa sổ / dialog hiện tại đang focus**.
- **Chế độ Thêm từ liên tục (Continuous Quick Add Mode ⚡)**:
  - **Giữ cửa sổ mở để thêm nhiều từ**: Tùy chọn tick `[x] Giữ cửa sổ để thêm liên tục nhiều từ` hoặc bật trong Settings Panel. Sau khi bấm lưu, cửa sổ không bị đóng mà tự động xóa trắng form và autofocus lại vào ô input để nhập tiếp từ tiếp theo.
  - **Phím tắt `Ctrl + Shift + Enter`**: Luôn thực hiện "Lưu & Tiếp tục thêm từ mới" mà không đóng popup bất kể setting.
  - **Phím tắt `Ctrl + Enter` (hoặc `Enter`)**: Lưu từ theo cấu hình mặc định.
- **Luồng Tra Từ 1-Click & Chống Trùng Lặp Gộp Nghĩa**:
  - Gõ từ tiếng Anh ➔ Bấm `Enter` để tra từ điển Oxford & Google Translate.
  - **Smart POS Selector**: Tự động nhận diện chính xác Động từ (`verb`), Danh từ (`noun`), Tính từ (`adjective`), Trạng từ (`adverb`).
  - **Natural Context Generator**: Tự động sinh câu ngữ cảnh mượt mà thực tế cho các từ giao tiếp (`okay`, `hello`, `hi`).
  - **Smart Duplicate Prevention & Merge**: Nếu từ đã có sẵn trong Kho, hệ thống tự động gộp nghĩa mới (ví dụ: `"chơi; vở kịch"`) tránh tạo rác dữ liệu.
  - Bấm `Esc` / `Alt + Q` để ẩn cửa sổ khi đã nhập xong danh sách từ.

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
  - **SRS Review & Mastery Badge 🔄**: Mỗi thẻ từ vựng hiển thị trực tiếp số lượt đã học/xuất hiện và cấp độ hộp ghi nhớ (`✨ Mới • 0 lượt`, `🔄 3 lượt • Box 2`, `🌟 7 lượt • Thuộc lòng`) kèm tooltip thống kê tỷ lệ nhớ đúng.
- **Data Backup & Reset All Data 🔄**:
  - **Reset All Data Button 🔄**: Clear all custom words, imported Anki decks, custom categories, and study history back to fresh initial state in Settings.
- **Filtering Tabs**: `TẤT CẢ`, `⭐ YÊU THÍCH`, `🔥 CẦN ÔN LẠI`, `IT`, `TOEIC`, `IELTS`, `OXFORD`, `CUSTOM`, + Dynamic User-Created Decks.

---

### 3. 🤖 Multi-Source Auto-Dictionary Engine & Spellcheck Auto-Correction (`✨ Tra từ`)
- **3 Dynamic API Sources**:
  1. **Free English Dictionary API (`dictionaryapi.dev`)**: Fetches official IPA phonetics (`/ɪnˈkrɛdəbəl/`), parts of speech (`adjective`), english definitions, and authentic example sentences.
  2. **Google Translate API (`translate.googleapis.com`)**: Translates meanings into user-configured target languages (Vietnamese 🇻🇳, Japanese 🇯🇵, etc.).
  3. **Datamuse Spellcheck & Suggestion API (`api.datamuse.com`)**: Detects typos & spelling errors and automatically suggests / corrects the word (e.g., `incridible` ➔ `incredible`).
- **Smart Spellcheck Auto-Correction**: If a user types a misspelled word like `incridible`, Engion detects the 404 from Dictionary API, queries Datamuse API to auto-correct `incridible` ➔ `incredible`, and fills official IPA, adjective POS, and definition with a toast banner: `💡 Đã tự động sửa lỗi chính tả: "incridible" ➔ "incredible"`.
- **Quick Edit Auto-Correct (Sửa Nhanh & Tra Từ Nhanh)**: In Quick Edit modals, clicking **`✨ Tra từ`** beside the word field re-fetches exact dictionary phonetics, definitions, and sentence examples.
- **🌐 Difficulty-Filtered Internet Random Word API (`?diff=1..5`)**: When users click **`🎲 Gợi ý từ ngẫu nhiên theo trình độ`**, Engion queries `random-word-api.herokuapp.com/word?number=5&diff=${level}` (using Wikipedia word frequency data) allowing users to choose their desired proficiency level:
  - 🟢 **Dễ (Easy - Common words)**: `diff=1` (e.g. `water`, `house`, `smile`)
  - 🟡 **Vừa (Medium - Moderately common)**: `diff=3` (e.g. `resilient`, `schedule`, `pragmatic`)
  - 🔴 **Khó (Hard - Rare words)**: `diff=5` (e.g. `defenestration`, `ephemeral`, `quintessential`)
  Validates fetched words against English Dictionary API and auto-fills full IPA, definition, and example sentence.
- **Strict Spell & Gibberish Validation**: If a string is completely invalid or gibberish (e.g. `asdfghjkl`), Engion shows an inline error (`❌ Không tìm thấy từ này trong từ điển`) preserving form state.
- **🎙️ Speech Recognition & Pronunciation Evaluator**: Web Speech Recognition API evaluates spoken pronunciation (`✅ Đọc đúng` or `❌ Thử lại`).

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
- **🔄 Version Checker & Release Notification via GitHub**: Automatically checks for new releases on startup targeting `nguyenngoctrung007/engion`. When a new version is detected, displays a native desktop Windows Notification & System Tray menu shortcut redirecting the user directly to the GitHub Releases page (`/releases/latest`) to download the latest installer/portable executable.
- **JSON Backup & Restore**: Export/Import full application state (Settings, Custom Words, SRS progress) via `.json`.
- **Floating Toast Notifications**: Fixed bottom-right notifications (`position: fixed`) with zero layout shift.

---

### 8. ☁️ Google Drive Sync (Đồng Bộ Đám Mây)
- **Đăng Nhập Google (OAuth2, RFC 8252)**: Bấm **`Đăng nhập Google Drive`** mở trình duyệt mặc định của hệ thống (không phải popup nhúng trong app) — Engion chạy một HTTP server tạm trên `127.0.0.1` (cổng `8085`, tự dò cổng trống nếu bị chiếm) để nhận callback sau khi đăng nhập, đúng chuẩn loopback-redirect cho ứng dụng desktop.
- **Lưu Trữ Riêng Tư (`appDataFolder`)**: Dữ liệu (từ vựng tùy chỉnh, tiến trình SRS, yêu thích, cài đặt) được lưu vào vùng `appDataFolder` ẩn của Google Drive (scope `drive.appdata`) — chỉ Engion đọc/ghi được, **không hiển thị** trong giao diện Drive thông thường của người dùng.
- **☁️ Đồng Bộ Ngay (Smart Two-Way Sync)**: So sánh thời điểm đồng bộ gần nhất giữa cloud và máy hiện tại trước khi quyết định đẩy lên hay tải về, tránh ghi đè nhầm dữ liệu mới hơn đã đồng bộ từ thiết bị khác.
- **⬇️ Khôi Phục Từ Cloud**: Tải toàn bộ dữ liệu từ Drive về, ghi đè dữ liệu local — có hộp thoại xác nhận trước khi thực hiện vì đây là hành động không thể hoàn tác.
- **Token Được Mã Hóa**: Access/refresh token lưu qua Electron `safeStorage` (mã hóa bằng DPAPI trên Windows), tự động làm mới access token khi hết hạn.
- **Yêu Cầu Cấu Hình**: Cần khai báo `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` trong `.env` (xem [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)). Trong lúc OAuth Client còn ở trạng thái "Testing" trên Google Cloud Console, chỉ tài khoản được thêm vào danh sách **Test users** mới cấp được scope `drive.appdata`.
