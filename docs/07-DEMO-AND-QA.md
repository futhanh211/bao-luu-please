# 07 · DEMO SCRIPT & QA

## 1. Kịch bản thuyết trình web (~6–7 phút, tách khỏi slide)
Giả định 4 người: Người A điều khiển máy · B đóng Cố vấn · C đóng CTSV · D đóng BGH + thuyết minh BPMN. (Hoặc một người làm hết bằng phím 1–5; Director mode lo phần còn lại.)
1. **Mở màn (30s) — Tiêu đề + As-Is:** "Ai từng đi xin bảo lưu thì biết cảnh này." Bấm Xem As-Is: cặp hồ sơ giấy đi vòng các phòng, đồng hồ ngày nhảy.
2. **Chuyển sang To-Be (20s):** chọn S1, bật Step mode, mở bản đồ `B`: giới thiệu 2 Pool, 4 Lane, màu theo lane.
3. **Chạy S1 (2 phút):** SV nộp đơn (phong bì bay) → T1 (AI đọc hồ sơ) → G1 → G2 tách 3 nhánh ("đây là chỗ nhanh hơn As-Is: ba việc cùng lúc") → chuyển bàn Cố vấn/CTSV (mỗi người đóng dấu) → G3 hội tụ → T8 dự thảo (trường tô vàng) → BGH ký số → T10 → T11, thư quyết định về hộp thư SV.
4. **S4 (1 phút) — Timer:** để Cố vấn "ngâm", bấm tua +3 ngày, chuông reo, T6 chạy, nhánh nhắc kết thúc mà T4 vẫn chờ → giải thích non-interrupting.
5. **S3 hoặc S5 (1 phút) — Từ chối:** nợ học phí: Business Rule R3 đỏ, thông báo từ chối có lời giải thích (AI soạn) — hoặc S5: CTSV soi ra minh chứng giả. Nhấn "AI gợi ý, người quyết".
6. **Báo cáo cuối ca (30s):** 8/11 task tự động (72,7%), thông điệp đã gửi, so sánh As-Is. Chốt 1 câu: "Máy lo việc máy, người lo việc cần phán đoán và trách nhiệm."
7. **Q&A:** dùng mục 9 của `01-PROCESS-SPEC.md`.

## 2. Plan B
- Quay sẵn video màn hình (OBS hoặc Xbox Game Bar) chạy Director S1 + S4 + S3.
- Luôn để AI ở MOCK khi lên lớp (nhanh, không phụ thuộc mạng).
- Chạy `npm run build` rồi `npm run preview`, không chạy dev server khi thuyết trình.
- Bật Không làm phiền của Windows, tắt thông báo, sạc pin, thử máy chiếu trước giờ (độ phân giải, tỷ lệ).
- Có sẵn tab trình duyệt đã mở màn Title; F11 toàn màn hình.

## 3. QA checklist (đánh dấu trước buổi dợt)
- [ ] Mọi chữ tiếng Việt hiển thị đúng dấu ở mọi màn (đặc biệt font mono).
- [ ] 6 kịch bản chạy đúng kết cục; `npm test` pass.
- [ ] Reset 10 lần liên tiếp không rò rỉ (animation lặp, timer, âm thanh chồng).
- [ ] Step / Auto / Director chuyển qua lại giữa chừng không hỏng trạng thái.
- [ ] Tua ngày +1, +3 hoạt động; timer chỉ bắn 1 lần.
- [ ] Tắt wifi vẫn chạy (font, AI mock, âm thanh).
- [ ] 1920×1080 và 1366×768 không vỡ layout; chữ đọc được từ xa.
- [ ] Phím tắt đúng; trang `?` đủ nội dung.
- [ ] Không có lỗi đỏ trong console khi chạy S1–S5.
- [ ] AI lỗi/timeout (giả lập) → fallback êm, không treo.
- [ ] Caption "Vì sao tự động hóa" khớp với báo cáo BTH 3.2.
- [ ] Dợt cả bài đúng giờ ít nhất 2 lần.
