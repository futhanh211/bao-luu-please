# 00 · PROJECT OVERVIEW — "BẢO LƯU, PLEASE"

## One-liner
Một mô phỏng tương tác chạy thật quy trình **To-Be nghỉ học tạm thời / bảo lưu** của ĐH Kinh tế – ĐHĐN: sinh viên nộp đơn → hệ thống tự động điều phối → 3 vai trò con người xử lý → quyết định ký số → CSDL tự cập nhật. Phong cách game "Paper, Please", có AI hỗ trợ ở các điểm hợp lý.

## Vì sao làm (cho cả nhóm nhớ)
- Bài thuyết trình môn Quản lý quy trình kinh doanh. Thầy không yêu cầu demo, nên demo càng độc càng nổi bật.
- Web nằm **tách riêng khỏi slide**, chỉ dùng để trình diễn live trên localhost → không cần deploy, không cần backend, không cần đăng nhập.
- Ý tưởng cốt lõi để kể chuyện: *Paper, Please là game về địa ngục giấy tờ. Quy trình As-Is của bảo lưu cũng na ná vậy. To-Be là bản được tự động hóa.* Người xem phải **thấy** sự khác biệt, không chỉ nghe.

## Người xem & bối cảnh dùng
- Thầy + cả lớp, chiếu máy chiếu, ngồi xa → chữ to, tương phản cao, animation rõ.
- Chạy trên 1 laptop Windows, có thể không có wifi → **offline hoàn toàn**.
- Người điều khiển là thành viên nhóm, vừa thao tác vừa thuyết minh → cần phím tắt, chế độ Step, chế độ tự chạy (Director).

## Phạm vi
### Trong phạm vi (bắt buộc)
- Chạy đúng 100% topology To-Be trong `01-PROCESS-SPEC.md` (2 Pool, 4 Lane, 11 task, 4 gateway, 1 boundary timer, 4 end event, data object/store, 4 message flow).
- Người dùng chơi được từng vai: Sinh viên, Cố vấn học tập, Phòng CTSV, Ban Giám hiệu; xem được "Hệ thống điều phối" tự chạy.
- 5 kịch bản preset + 1 kịch bản tự nhập (xem `02-GAME-DESIGN.md`).
- Bản đồ BPMN sống (token chạy theo thời gian thực) cạnh giao diện game.
- Mỗi node tự động hóa hiện caption "Vì sao tự động hóa / vì sao ký hiệu này" lấy từ báo cáo BTH 3.2.
- AI: quét hồ sơ, trợ lý sinh viên, tóm tắt & đề xuất cho người duyệt, soạn văn bản (xem `05-AI-SPEC.md`).
- Báo cáo cuối ca: số task tự động/thủ công, thông điệp đã gửi, thời gian giả lập, so sánh As-Is.

### Ngoài phạm vi (KHÔNG làm)
- Backend thật, database thật, đăng nhập, phân quyền, multi-user realtime, deploy online, responsive mobile.
- Tích hợp hệ thống thật của trường. Mọi dữ liệu là giả lập.
- Mô phỏng As-Is chi tiết (chỉ làm bản "so sánh nhẹ", xem `02-GAME-DESIGN.md`).

## Tiêu chí thành công
- Chạy trọn 5 kịch bản không lỗi, không cần F5 giữa chừng; reset sạch.
- Happy path chạy chế độ Auto trong 90–120 giây; Step mode dừng được ở từng node.
- Người xem chỉ cần nhìn 10 giây là hiểu: đâu là việc máy làm, đâu là việc người làm, đâu là song song.
- Chạy mượt (~60fps) trên laptop thường ở 1920×1080; chạy được offline.
- Nhóm có Plan B (video quay sẵn) nếu máy/chiếu trục trặc.

## Thuật ngữ nhanh
- **As-Is / To-Be**: quy trình hiện tại (giấy, tuần tự) / quy trình cải tiến (tự động hóa).
- **Token**: "con trỏ" chạy dọc sơ đồ BPMN, đại diện một hồ sơ đang được xử lý.
- **Service / Send / Business Rule / User Task**: 4 loại tác vụ dùng trong quy trình (xem 01).
- **SLA**: cam kết thời gian xử lý (3 ngày làm việc cho Cố vấn xác nhận).
- **Director mode**: chế độ tự chạy toàn bộ kịch bản có thuyết minh bằng caption.

## Nhóm & vai (điền khi chốt)
- Người điều khiển chính: ______
- Người đóng Cố vấn / CTSV / BGH khi demo: ______
- Người thuyết minh BPMN: ______
