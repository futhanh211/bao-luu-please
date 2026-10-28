# AGENTS.md — Luật cho AI coding agent (ĐỌC ĐẦU TIÊN, MỖI SESSION)

## Dự án là gì
**BẢO LƯU, PLEASE** — web demo chạy localhost cho bài thuyết trình môn Quản lý quy trình kinh doanh.
Mô phỏng chạy THẬT quy trình To-Be "Giải quyết thủ tục nghỉ học tạm thời / bảo lưu kết quả học tập"
(Trường ĐH Kinh tế – ĐH Đà Nẵng, BPMN 2.0), với phong cách game "Paper, Please": bàn làm việc, giấy tờ, con dấu, animation.

## Thứ tự đọc
1. `docs/00-PROJECT-OVERVIEW.md` (bối cảnh, phạm vi)
2. `docs/01-PROCESS-SPEC.md` (NGUỒN SỰ THẬT của quy trình)
3. `docs/04-ARCHITECTURE.md` (stack, cấu trúc thư mục, engine)
4. Khi làm phần liên quan: `02-GAME-DESIGN`, `03-UI-UX-DESIGN`, `05-AI-SPEC`
5. `docs/06-ROADMAP.md` → xem milestone hiện tại + checklist; `docs/PROGRESS.md` → xem đã làm gì

## Luật cứng
1. **Quy trình = `01-PROCESS-SPEC.md`.** Không tự thêm/bớt/đổi tên node BPMN, không đổi topology.
2. **Engine tách khỏi UI.** `src/engine/` là TypeScript thuần, KHÔNG import React/DOM. UI chỉ subscribe event của engine.
3. **Mỗi session chỉ làm 1 milestone** trong `06-ROADMAP.md`. Xong thì: chạy `npm run build` và `npm test` (phải pass) → tick checklist → ghi `docs/PROGRESS.md`.
4. **Offline-first.** Không CDN, không fetch font/ảnh/script từ internet khi chạy. Font dùng `@fontsource/*`. Hình = CSS/SVG. Âm thanh = WebAudio tự synth.
5. **AI mặc định là MOCK** (deterministic, có độ trễ giả). Chế độ LIVE chỉ bật khi có `.env.local`; lỗi/timeout 4 giây → tự fallback về mock. UI không bao giờ được treo vì AI.
6. **AI không được quyết định** Business Rule Task, XOR Gateway hay chữ ký. Xem `05-AI-SPEC.md`.
7. **Không thêm dependency** ngoài danh sách trong `04-ARCHITECTURE.md`. Nếu thật sự cần, ghi lý do vào `PROGRESS.md`.
8. **UI 100% tiếng Việt có dấu.** Mỗi lần thêm font/màn hình mới phải test hiển thị dấu (ă â ê ô ơ ư đ + dấu thanh).
9. **Môi trường: Windows 11 + PowerShell.** Không dùng lệnh bash-only (`rm -rf`, `export`, `&&` kiểu bash…). Dùng script npm cho mọi thứ.
10. **Không refactor lan man**, không đổi cấu trúc thư mục khi không được yêu cầu, không đụng file ngoài phạm vi milestone.
11. **Spec mơ hồ → chọn phương án đơn giản nhất**, ghi `ASSUMPTION: ...` vào `PROGRESS.md`, làm tiếp. Không dừng lại hỏi trừ khi bị chặn hoàn toàn.
12. **Không copy asset, tên nhân vật, logo từ game Paper, Please.** Chỉ lấy cảm hứng phong cách (bàn làm việc, con dấu, tông màu xám-olive, giấy tờ).
13. Dữ liệu sinh viên là **GIẢ LẬP** — luôn hiển thị nhãn "Dữ liệu giả lập" ở nơi phù hợp.

## Quy ước code
- TypeScript `strict`, cấm `any`. File ≤ 300 dòng, component nhỏ, một việc một file.
- Design token ở `src/styles/tokens.css` (CSS variables). Hằng số animation ở `src/ui/motion.ts`. Không hardcode màu/thời lượng trong component.
- Tên biến/hàm tiếng Anh; chuỗi hiển thị tiếng Việt, gom vào `src/data/*` hoặc file copy riêng, không rải trong logic engine.
- ID node BPMN dùng đúng ID trong `01-PROCESS-SPEC.md` (T1…T11, G1…G4, BT1, E_…, DS1, DS2, DO1…DO3, MF1…MF4).
- Mỗi tính năng animation phải đọc `speed` từ store (0.5x / 1x / 2x) và có thể tắt (`reducedMotion`).

## Definition of Done (mọi task)
- Chạy được bằng `npm run dev`, không lỗi console.
- `npm run build` và `npm test` pass.
- Không phá milestone trước (chạy lại test scenario).
- Tick checklist trong `06-ROADMAP.md` + ghi `PROGRESS.md` (làm gì, file nào, ASSUMPTION nào, còn nợ gì).
