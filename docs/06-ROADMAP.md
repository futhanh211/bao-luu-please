# 06 · ROADMAP — Milestone cho agent (mỗi session = 1 milestone)

## Cách dùng với Antigravity
Mỗi session mở đầu bằng: "Đọc AGENTS.md, docs/00, 01, 04 và các docs liên quan tới milestone này. Làm đúng Milestone Mx trong docs/06-ROADMAP.md, theo checklist. Dừng khi đạt Definition of Done. Cập nhật PROGRESS.md." Không giao 2 milestone một lúc (agent nhẹ dễ sa đà).
Nếu Antigravity có cơ chế rules riêng (ví dụ thư mục `.agent/` hoặc file rules/GEMINI.md), copy nội dung `AGENTS.md` sang đó để agent luôn nạp.

## Thứ tự & độ lớn (S nhỏ · M vừa · L lớn)
Bậc **MVP** (phải có): M0 → M1 → M2 → M3 → M4 → M5.
Bậc **WOW** (thêm khi còn thời gian): M6 → M7 → M8.
Thứ tự cắt khi thiếu thời gian: As-Is → AI live → SFX → Director có AI-5 → hiệu ứng CRT.

### M0 · Scaffold & app shell (S)
- [x] Khởi tạo Vite + React + TS strict + Zustand + Framer Motion + Vitest + @fontsource.
- [x] `tokens.css`, `base.css`, font offline, trang test `?typography` hiển thị đúng dấu tiếng Việt.
- [x] Shell: HUD, thanh vai (5 tab), vùng bàn trống, màn Title → Chọn kịch bản (6 thẻ, chưa chạy).
- [x] `.env.example`, script `dev/build/preview/test` chạy được trên Windows.
- DoD: mở web thấy Title đẹp đúng tông; đổi tab vai chạy; build pass.

### M1 · Process engine headless (L) — QUAN TRỌNG NHẤT
- [x] `types.ts`, `process.def.ts` đúng 01 (mọi ID), `clock.ts`, `rules.ts`, `engine.ts` + handlers.
- [x] Data giả lập (`students.db`, `academic-finance.db`), `scenarios.ts` (S1–S5 + custom), mock AI tối thiểu (trả cố định).
- [x] `engine.test.ts` phủ đúng danh sách ở 04 mục 7. Tất cả pass.
- DoD: 6 kịch bản chạy xong headless đúng kết cục; `reset()` chạy lại đúng; chưa cần UI.

### M2 · Bản đồ BPMN sống (L)
- [ ] `layout.ts` + `shapes.tsx` + `BpmnMap.tsx` vẽ đủ 2 Pool, 4 Lane, mọi node/cạnh/data/message flow theo 03 mục 5.
- [ ] Playback controller: nhận event engine → phát animation token, đổi trạng thái node; Auto / Step.
- [ ] Mini-map + toàn màn hình (`B`) + Caption card từ `node-captions.ts`.
- DoD: chọn S1 → bấm chạy → token đi hết sơ đồ, split/join song song hiển thị rõ; Step bằng `Space`.

### M3 · Bàn Sinh viên + Hộp thư (M)
- [ ] Đơn đánh máy có validate nhẹ, túi minh chứng, nộp → phong bì bay (MF1) → engine khởi chạy.
- [ ] Hộp thư nhận MF2/MF3/MF4 dạng thư; mở được thư quyết định.
- [ ] Tab tra cứu tiến độ (timeline).
- [ ] Chat khung trợ lý (chạy mock cơ bản).
- DoD: S2 và S3 chơi từ đơn tới thư phản hồi, không cần mở bản đồ.

### M4 · Các bàn con người: Cố vấn · CTSV · BGH (L)
- [ ] Tablet Cố vấn + 2 con dấu; chuông/banner nhắc việc khi `timer.fired`.
- [ ] Bàn CTSV: soi lệch, đánh dấu, 2 con dấu, ghi nhận "Người ≠ AI".
- [ ] Bàn BGH: dự thảo tô vàng trường tự điền, nghi thức ký số, dấu đỏ.
- [ ] Nút Tua ngày (+1/+3) và hiển thị đồng hồ SLA.
- DoD: S1, S4, S5 chơi trọn từ nộp đơn tới kết cục bằng tay.

### M5 · Phòng điều khiển + Báo cáo cuối ca (M)
- [ ] Terminal log service, tủ DS1/DS2 sáng khi đọc/ghi, vòng đời DO1→DO2→DO3, bảng rule R1–R4.
- [ ] Case Report: số liệu, kết cục, nút chơi lại.
- DoD: toàn bộ 6 kịch bản chơi/xem được từ đầu đến cuối; đây là MVP trình diễn được.

### M6 · AI đầy đủ (M)
- [ ] Hoàn thiện mock cho AI-1…AI-4 theo `aiScript` mỗi kịch bản; chatbot 6+ intent.
- [ ] Hiển thị chuẩn (nhãn AI, gõ chữ, badge nguồn); log `ai.*`.
- [ ] (Tùy chọn) provider live Gemini + fallback + công tắc LIVE.
- DoD: mọi điểm chạm AI hoạt động trên mock; tắt mạng vẫn chạy.

### M7 · Công cụ trình diễn (M)
- [ ] Director mode (tự chơi user task, caption thuyết minh), tạm dừng, tốc độ.
- [ ] Phím tắt đầy đủ + trang trợ giúp `?`.
- [ ] Màn As-Is (animation + `asis.config.ts`) và so sánh ở báo cáo.
- DoD: bấm Director → S1 tự chạy 90–120s không cần chạm gì.

### M8 · Polish & kiểm thử (M)
- [ ] SFX synth, chuyển cảnh, rung bàn, mực loang, đếm số lăn, chế độ nhẹ, giảm hiệu ứng.
- [ ] QA checklist trong `07-DEMO-AND-QA.md` đạt hết.
- [ ] Build bản `preview`, thử offline, thử 1920×1080 và 1366×768.
- DoD: dợt thử cả bài 1 lần liền mạch không lỗi.

## Quy tắc dùng PROGRESS.md
Mỗi session thêm 1 mục: ngày, milestone, đã làm, file chính đã đụng, ASSUMPTION, nợ kỹ thuật, lệnh test đã chạy và kết quả.
