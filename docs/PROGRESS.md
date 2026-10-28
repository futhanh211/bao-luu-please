# PROGRESS — nhật ký làm việc của agent

Mỗi session thêm một mục theo mẫu:

## [Ngày] · Milestone Mx
- Đã làm:
- File chính:
- ASSUMPTION:
- Nợ / việc dở:
- Đã chạy: `npm run build` · `npm test` → kết quả

---

## 2026-10-28 · Milestone M1: Process Engine Headless
- Đã làm:
  - Định nghĩa hoàn chỉnh toàn bộ kiểu dữ liệu `src/engine/types.ts`: `NodeType`, `Node`, `Edge`, `ProcessDef`, `Token`, `CaseState` (đúng các biến ở 01 mục 5), `EngineEvent` (đủ 17 sự kiện ở 04 mục 4.3), `EngineDeps`.
  - Xây dựng mô hình quy trình `src/engine/process.def.ts` đúng 100% topology chuẩn BPMN 2.0 ở 01 mục 2 (2 Pool, 4 Lane, 11 Task, 4 Gateway, 1 Boundary Timer, 4 End Event, 2 Data Store, 3 Data Object, 4 Message Flow).
  - Cài đặt đồng hồ ảo `src/engine/clock.ts` theo ngày làm việc (bắt đầu từ ngày 0, hỗ trợ tiến ngày `advance` và `reset`).
  - Cài đặt rule engine `src/engine/rules.ts` độc lập đánh giá 4 bộ quy tắc R1–R4 (01 mục 6), trả về mảng kết quả chi tiết từng rule và cờ `pass` tổng thể.
  - Cài đặt Process Engine thuần TypeScript `src/engine/engine.ts` cùng các handlers (`service`, `send`, `rule`, `user`, `gateway`, `timer`):
    - Hoạt động theo cơ chế Token-based; `step()` bất đồng bộ; rẽ nhánh XOR `G1`/`G4` và phân nhánh song song AND Split `G2`, hội tụ AND Join `G3` (chờ đủ 3 nhánh).
    - User Task (`T4`, `T5`, `T9`) tạm dừng token ở trạng thái `waiting`, phát `task.assigned` và chỉ tiếp tục khi người dùng gọi `completeUserTask(taskId, outcome)`.
    - Boundary Timer `BT1` non-interrupting: tự động lập lịch khi `T4` được giao (`ngày giao + 3`), kích hoạt khi gọi `advanceDays`, phát `timer.fired`, tạo token mới chạy `T6` đến `E_END_REMIND` mà không ngắt `T4`, đảm bảo chỉ kích hoạt đúng 1 lần.
    - `T1` kiểm tra tính đầy đủ hồ sơ và đối chiếu CSDL `DS2` kết hợp phân tích tài liệu minh chứng của AI (`DocScan`).
    - `T3` kiểm tra Business Rules độc lập qua `rules.ts` (không dùng AI).
    - `T8` khởi tạo dự thảo quyết định; `T10` ghi trạng thái sinh viên `"Bảo lưu"` vào `DS2`; `T11` thông báo hoàn tất kèm ký số.
    - `reset()` dọn dẹp sạch token, state, timer, subscriber và hoàn trả trạng thái sinh viên trong `DS2`.
  - Cung cấp dữ liệu giả lập trong `src/data/`: `students.db.ts` (8 sinh viên giả lập), `academic-finance.db.ts`, `scenarios.ts` (S1–S5 + Custom), `node-captions.ts` (caption 2 dòng "Vì sao" cho từng node).
  - Cài đặt AI Provider interface `src/ai/provider.ts` và bản mock deterministic `src/ai/mock.ts` hỗ trợ kịch bản AI script và độ trễ 0ms cho test headless.
  - Xây dựng bộ test Vitest headless `src/engine/engine.test.ts` gồm 8 test case phủ trọn vẹn yêu cầu tại `04-ARCHITECTURE.md` mục 7.
- File chính:
  - `src/engine/types.ts`, `src/engine/process.def.ts`, `src/engine/clock.ts`, `src/engine/rules.ts`, `src/engine/engine.ts`
  - `src/engine/handlers/{service.ts, send.ts, rule.ts, user.ts, gateway.ts, timer.ts}`
  - `src/data/{students.db.ts, academic-finance.db.ts, scenarios.ts, node-captions.ts}`
  - `src/ai/{provider.ts, mock.ts, index.ts}`
  - `src/engine/engine.test.ts`
- ASSUMPTION:
  - Không có assumption mới làm thay đổi topology. Tất cả topology giữ nguyên 100% theo `01-PROCESS-SPEC.md`. Nhánh phụ của Boundary Timer non-interrupting kết thúc tại `E_END_REMIND` độc lập và không tham gia vào hội tụ `G3`.
- Nợ / việc dở:
  - Không có nợ kỹ thuật cho M1. Sẵn sàng cho M2 (Bản đồ BPMN sống & Playback controller).
- Đã chạy:
  - `npm test`: PASS (12/12 tests, 2 test suites `useApp.test.ts` và `engine.test.ts`).
  - `npm run build`: PASS (TypeScript strict check pass, 406 modules built trong 1.47s).

---

## 2026-10-28 · Milestone M0: Scaffold & App Shell
- Đã làm:
  - Khởi tạo project Vite + React 18 + TypeScript strict ngay tại thư mục gốc `H:\bao-luu-please`.
  - Cài đặt đầy đủ và đúng các dependencies: `zustand`, `framer-motion`, `vitest`, `@fontsource/courier-prime`, `@fontsource/ibm-plex-mono`, `@fontsource/vt323`, `@fontsource/be-vietnam-pro`.
  - Cấu hình `package.json` với các script `dev`, `build`, `preview`, `test` (`vitest run`); `tsconfig.json` bật toàn bộ cờ `strict`.
  - Thiết lập đầy đủ cấu trúc thư mục rỗng và file placeholder chuẩn xác theo `docs/04-ARCHITECTURE.md` mục 3.
  - Tạo hệ thống styles: `tokens.css` (màu bàn olive, giấy ngả vàng, mực, con dấu đỏ/xanh/xanh số, CRT hệ thống, màu lane, bóng đổ cứng, bo góc), `base.css` (CSS reset, SVG `feTurbulence` inline data-uri làm texture noise bàn, font-size >= 18px), `fonts.css` nạp font offline (subset latin, latin-ext, vietnamese).
  - Tạo trang test typography `/?typography` kiểm tra câu tiếng Việt mẫu có đủ dấu thanh và bảng nguyên âm tiếng Việt trên cả 3 font vai trò.
  - Xây dựng App Shell hoàn chỉnh không dùng router, điều hướng bằng Zustand store `useApp.ts`:
    - Màn Title: Tiêu đề "BẢO LƯU, PLEASE", phụ đề Phòng Một Cửa Số, hiệu ứng CRT boot typewriter, nút "BẮT ĐẦU CA LÀM VIỆC", gợi ý bật âm thanh phím M, nhãn "Dữ liệu giả lập".
    - Màn Chọn kịch bản: 6 thẻ hồ sơ phong cách bìa hồ sơ lưu trữ (S1–S5 + Custom) trích xuất dữ liệu từ `docs/02-GAME-DESIGN.md` mục 4.
    - Màn Bàn làm việc: HUD 64px (logo, Mã ca, Ngày giả lập, 5 tab vai Sinh viên · Hệ thống · Cố vấn · CTSV · BGH, cụm nút Play/Step/Director, đổi tốc độ 0.5x/1x/2x, badge "AI: MOCK", nhãn "Dữ liệu giả lập", nút Reset ca) và khu vực trung tâm hiển thị mặt bàn với tờ giấy placeholder cho vai đang chọn.
    - Bắt sự kiện bàn phím phím 1–5 để chuyển nhanh 5 vai, M để bật/tắt tiếng, R để reset, +/- để đổi tốc độ, P/S/D đổi mode.
    - Chuyển cảnh Framer Motion ~400ms mượt mà giữa các màn và các tab vai.
  - Viết bộ test Vitest `src/store/useApp.test.ts` kiểm thử các action của store (chuyển màn, đổi role, cycle tốc độ, gán scenario).
  - Tạo `.gitignore` bảo vệ `node_modules`, `dist`, `.env.local` mà không đụng tới `.env.example`.
- File chính:
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`
  - `src/main.tsx`, `src/App.tsx`
  - `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/fonts.css`
  - `src/store/useApp.ts`, `src/store/useApp.test.ts`
  - `src/ui/shell/Hud.tsx`, `src/ui/shell/RoleTabs.tsx`
  - `src/ui/scenes/Title.tsx`, `src/ui/scenes/ScenarioPicker.tsx`, `src/ui/scenes/TypographyTest.tsx`
  - `src/ui/desks/{StudentDesk, ControlRoom, AdvisorDesk, CtsvDesk, PrincipalDesk}.tsx`
  - `src/ui/kit/{Paper, Stamp, Envelope, Typewriter, Terminal, Clock, Toast}.tsx`
  - `src/data/scenarios.ts`
- ASSUMPTION:
  - Gói `@fontsource/courier-prime` chỉ có subset latin và latin-ext, không hỗ trợ subset tiếng Việt chính thức (thiếu các nguyên âm ẩ, ẫ, ể, ỗ, ợ, ử, ự). Đúng theo quy định tại `docs/03-UI-UX-DESIGN.md` mục 3 và đề bài, vai trò `--font-paper` được cấu hình sử dụng `IBM Plex Mono` để đảm bảo 100% hiển thị chuẩn và đẹp mắt dấu tiếng Việt trên máy chiếu.
- Nợ / việc dở:
  - Không có nợ kỹ thuật nào thuộc phạm vi M0. Mọi checklist M0 đã hoàn tất.
- Đã chạy:
  - `npm run build`: PASS (TypeScript strict check pass, Vite build 406 modules trong 1.40s, toàn bộ asset font woff/woff2 được nạp cục bộ).
  - `npm test`: PASS (2 file test: `src/engine/engine.test.ts`, `src/store/useApp.test.ts` - 5/5 passed).
  - `npm run dev`: Sẵn sàng sau 330ms, endpoint `/?typography` kiểm tra trả về HTTP 200 OK.
