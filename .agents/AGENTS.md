# Engion Workspace Agent Rules

Khi làm việc trong dự án này, hãy luôn tuân thủ các quy tắc trong [docs/RULES.md](file:///d:/training/engion/docs/RULES.md):

1. **Code tối giản, dễ hiểu**: Viết mã nguồn sạch, trực quan, có TypeScript types đầy đủ, tránh over-engineering.
2. **Chủ động hỏi lại**: Nếu yêu cầu của người dùng chưa đủ rõ ràng hoặc mơ hồ, hãy đặt câu hỏi làm rõ trước khi triển khai.
3. **Luôn cập nhật thư mục `docs/`**: Khi thêm tính năng mới hoặc thay đổi kiến trúc/quy trình, bắt buộc phải cập nhật lại tài liệu tương ứng (`FEATURES.md`, `ARCHITECTURE.md`, `DEVELOPMENT_GUIDE.md`, `RULES.md`).
4. **Bảo vệ UX & IPC Guard**: Tuân thủ các quy tắc UI non-blocking (`position: fixed` toast), phản hồi mượt trên Win32 (`onMouseDown`), và giữ vững Dual Mode Guard trong `App.tsx`.
5. **Kiểm thử trước khi hoàn thành**: Phải chạy lệnh kiểm tra (`npm run build` / typecheck) và xác minh kết quả trước khi báo hoàn thành nhiệm vụ.
