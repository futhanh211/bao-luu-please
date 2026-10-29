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
- [x] `layout.ts` + `shapes.tsx` + `BpmnMap.tsx` vẽ đủ 2 Pool, 4 Lane, mọi node/cạnh/data/message flow theo 03 mục 5.
- [x] Playback controller: nhận event engine → phát animation token, đổi trạng thái node; Auto / Step.
- [x] Mini-map + toàn màn hình (`B`) + Caption card từ `node-captions.ts`.
- DoD: chọn S1 → bấm chạy → token đi hết sơ đồ, split/join song song hiển thị rõ; Step bằng `Space`.

### M3 · Bàn Sinh viên + Hộp thư (M)
- [x] Đơn đánh máy có validate nhẹ, túi minh chứng, nộp → phong bì bay (MF1) → engine khởi chạy.
- [x] Hộp thư nhận MF2/MF3/MF4 dạng thư; mở được thư quyết định.
- [x] Tab tra cứu tiến độ (timeline).
- [x] Chat khung trợ lý (chạy mock cơ bản).
- DoD: S2 chơi trọn từ đơn tới thư phản hồi chỉ trên Bàn Sinh viên. S1/S3 cần hoàn tất T4/T5/T9 bằng nút tạm ở overlay bản đồ (B) cho tới khi có M4.

### M4 · Các bàn con người: Cố vấn · CTSV · BGH (L)
- [x] Tablet Cố vấn + 2 con dấu; chuông/banner nhắc việc khi `timer.fired`.
- [x] Bàn CTSV: soi lệch, đánh dấu, 2 con dấu, ghi nhận "Người ≠ AI".
- [x] Bàn BGH: dự thảo tô vàng trường tự điền, nghi thức ký số, dấu đỏ.
- [x] Nút Tua ngày (+1/+3) và hiển thị đồng hồ SLA (+ phím `T` / `Shift+T` dùng chung).
- [x] Kit dùng lại: `Stamp` (rơi → rung bàn → mực loang, chốt khi dấu chạm giấy), `SlaClock`, `Toast` "có việc mới" không tự chuyển vai.
- [x] Test thuần: `inspection.test.ts`, `signingMachine.test.ts`, `deskState.test.ts`; e2e `m4Flows.test.ts` (S1, S4, S5).
- DoD: S1, S4, S5 chơi trọn từ nộp đơn tới kết cục bằng tay. ✅ (53/53 test, build pass, đã chụp màn hình 3 bàn)

### M5 · Phòng điều khiển + Báo cáo cuối ca (M)
- [x] Terminal log service, tủ DS1/DS2 sáng khi đọc/ghi, vòng đời DO1→DO2→DO3, bảng rule R1–R4.
- [x] Case Report: số liệu, kết cục, nút chơi lại.
- [x] Dọn nợ M4: tách `store/playback.ts` thành module ≤300 dòng, lưu trạng thái CTSV theo ca, caption dock không che nội dung, test nhanh.
- DoD: toàn bộ 6 kịch bản chơi/xem được từ đầu đến cuối; đây là MVP trình diễn được. ✅ (66/66 test ~1,1s, build pass, đã chụp 1920×1080 + 1366×768)

### M6 · AI đầy đủ (M)
- [x] Hoàn thiện mock cho AI-1…AI-4 theo `aiScript` mỗi kịch bản; chatbot 6+ intent.
  - `ai/mock.ts` + `ai/mockTemplates.ts` sinh DocScan/Brief/Draft theo `aiScript`; AI-4 dùng mẫu văn bản thật; `knowledge-base.ts` 11 intent + 6 câu hỏi nhanh, trả lời theo ngữ cảnh hồ sơ (T4/T5/T9, ngày, thư gần nhất).
- [x] Hiển thị chuẩn (nhãn AI, gõ chữ, badge nguồn); log `ai.*`.
  - `AiBadge` (MOCK/LIVE/fallback), `AiText` (typewriter tôn trọng `speed`/`reducedMotion`), badge ở HUD + panel + chat; nhãn "Căn cứ · AI soạn (AI-4)", thư MF4 có mục "Căn cứ (AI soạn)"; terminal log `[AI-1] DocScan`, `[AI-3] Brief`, `[AI-4] Draft`; store ghi `ai.requested`/`ai.responded` cho AI-3 (mỗi vai 1 lần/ca).
- [x] (Tùy chọn) provider live Gemini + fallback + công tắc LIVE.
  - `ai/live.ts` browser-only, chỉ chạy localhost, bật bằng `VITE_GEMINI_API_KEY`; timeout 4s, retry 1 lần cho lỗi mạng/5xx, lỗi 4xx/JSON sai → fallback ngay; `AIService` giữ fallback dính cho tới khi đổi mode; công tắc trên HUD (`AiModeSwitch`).
- DoD: mọi điểm chạm AI hoạt động trên mock; tắt mạng vẫn chạy. ✅ (115/115 test ~1,6s, build pass, đã chơi S1 trọn ca trên Chrome 1366×768; AI live chưa gọi thật vì không có key)

### M7 · Công cụ trình diễn (M)
- [x] Director mode (tự chơi user task, caption thuyết minh), tạm dừng, tốc độ.
- [x] Phím tắt đầy đủ + trang trợ giúp `?`.
- [x] Màn As-Is (animation + `asis.config.ts`) và so sánh ở báo cáo.
- DoD: bấm Director → S1 tự chạy 90–120s không cần chạm gì. ✅ (125/125 test, build pass, đã kiểm thử Director S1/S4/S5, trang trợ giúp ?, mô phỏng As-Is 22 ngày và so sánh trong CaseReport)

### M8 · Polish & kiểm thử (M)
- [x] SFX synth, chuyển cảnh, rung bàn, mực loang, đếm số lăn, chế độ nhẹ, giảm hiệu ứng.
  - `sfx.ts` WebAudio (stamp/paper/type/bell/chime/buzz/crt/pen/token), master 40%, throttle, mặc định tắt; `eventSfx.ts` map event engine; HUD ⚙ mở bảng cài đặt (âm thanh, âm lượng, giảm hiệu ứng, tốc độ); `SceneWipe` 700ms; `CountUp` 400ms ở báo cáo; tôn trọng `prefers-reduced-motion` + `MotionConfig`.
- [x] QA checklist trong `07-DEMO-AND-QA.md` đạt hết.
  - Đã đạt phần M8: tiếng Việt, reset, tua ngày/timer (test), offline, 1920×1080 & 1366×768, console, S1–S5. Còn chờ M6/M7: Director/Step chuyển qua lại, trang `?`, AI live/fallback, dợt cả bài.
- [x] Build bản `preview`, thử offline, thử 1920×1080 và 1366×768.
  - `npm run preview` tại `127.0.0.1:4173`: chỉ tải tài nguyên cùng host; title → S1 → cài đặt chạy được; không có overlay lỗi.
- DoD: **ĐẠT** — Hoàn tất 100% các tính năng polish, WebAudio synth cơ học, hiệu ứng chuyển cảnh SceneWipe, kiểm thử offline-first preview, hỗ trợ đầy đủ 1920×1080 và 1366×768, tích hợp mượt mà Director mode, As-Is so sánh và trang trợ giúp `?`. 184/184 tests pass, production build pass. ✅

## Quy tắc dùng PROGRESS.md
Mỗi session thêm 1 mục: ngày, milestone, đã làm, file chính đã đụng, ASSUMPTION, nợ kỹ thuật, lệnh test đã chạy và kết quả.
