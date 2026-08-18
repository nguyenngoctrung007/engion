# Engion - Developer & AI Working Rules

Tài liệu này quy định các nguyên tắc, chuẩn mực làm việc và phát triển mã nguồn đối với lập trình viên và AI Assistant khi thực hiện bất kỳ yêu cầu nào trong dự án **Engion**.

---

## 🎯 1. Nguyên Tắc Code (Code Quality & Simplicity)
- **Tối giản & Dễ hiểu**: Code phải sạch (Clean Code), ngắn gọn, trực quan và dễ bảo trì. Tránh over-engineering hoặc tạo các lớp trừu tượng (abstraction) phức tạp không cần thiết.
- **Type Safety với TypeScript**: Định nghĩa kiểu dữ liệu rõ ràng trong `src/types/`, hạn chế tối đa việc sử dụng `any`.
- **Giữ vững kiến trúc cốt lõi**: Không phá vỡ các luồng xử lý và guard hiện có (ví dụ: `Dual Mode Guard` bảo vệ Popup Window trong `App.tsx`, IPC Context Bridge trong `preload.ts`).

---

## ❓ 2. Làm Rõ Yêu Cầu Khi Mơ Hồ (Ask Before Assuming)
- **Chủ động hỏi lại**: Khi yêu cầu có điểm chưa rõ ràng, mơ hồ hoặc có nhiều phương án thiết kế khác nhau, phải đặt câu hỏi làm rõ với người dùng/team trước khi triển khai.
- **Không tự đoán logic phức tạp**: Không tự ý suy đoán luồng nghiệp vụ quan trọng hay thay đổi cấu trúc API/Data schema mà chưa được xác minh.

---

## 📚 3. Đồng Bộ Tài Liệu (Documentation Synchronization)
- **Luôn cập nhật `docs/`**: Bất kỳ khi nào thêm tính năng mới, thay đổi kiến trúc, thêm cài đặt hay cập nhật quy trình build, **bắt buộc** phải cập nhật lại tài liệu tương ứng trong thư mục `docs/`:
  - [FEATURES.md](FEATURES.md): Cập nhật khi thêm/sửa/xóa tính năng hoặc logic nghiệp vụ.
  - [ARCHITECTURE.md](ARCHITECTURE.md): Cập nhật khi thay đổi IPC, bổ sung window, hay thay đổi luồng dữ liệu.
  - [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md): Cập nhật khi thay đổi lệnh build, cấu hình môi trường hoặc hướng dẫn quy trình.
  - [RULES.md](RULES.md): Cập nhật khi bổ sung quy tắc làm việc mới.

---

## 🎨 4. Trải Nghiệm Người Dùng & UI/UX (User Experience Rules)
- **Không gây giật/lệch giao diện (No Layout Shift)**: Không dùng `alert()` trình duyệt. Các thông báo thành công/thất bại phải dùng floating toast (`position: fixed`) hoặc thông báo inline non-blocking.
- **Phản hồi tức thì trên Win32**: Đối với các nút đóng/hành động trên Cửa sổ Popup nổi, luôn xử lý sự kiện `onMouseDown` kết hợp `onClick` để tránh trễ phản hồi do cơ chế lấy focus của Windows.

---

## 🧪 5. Kiểm Thử & Xác Minh (Verification & Quality First)
- **Không báo hoàn thành khi chưa test**: Sau khi viết code hoặc sửa đổi, luôn phải chạy kiểm tra (`npm run dev` hoặc `npm run build`) để đảm bảo không phát sinh lỗi compile/type checking.
- **Xử lý triệt để nguyên nhân gốc**: Không giải quyết lỗi bằng cách ẩn sự cố (ví dụ: `catch` rỗng, nuốt exception, hay comment out code hỏng).
