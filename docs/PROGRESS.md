# PROGRESS — nhật ký làm việc của agent

Mỗi session thêm một mục theo mẫu:

## [Ngày] · Milestone Mx
- Đã làm:
- File chính:
- ASSUMPTION:
- Nợ / việc dở:
- Đã chạy: `npm run build` · `npm test` → kết quả

---

## 2026-10-30 · Khắc phục Triệt để Lỗi Logic Pipeline Phân quyền Giữa Các Vai (Multi-Role Pipeline Gating & Access Control)
- Đã làm:
  - **Phân tích và sửa triệt để nguyên nhân gốc rễ lỗi không đồng bộ giữa các vai:**
    - Người dùng phản ánh: Hồ sơ bị Cố vấn học tập từ chối ở bước 1, nhưng khi chuyển qua Ban Giám hiệu (`canbo3`) vẫn xuất hiện và vẫn ký số được; đồng thời trên Cổng Sinh viên hiển thị lẫn lộn giữa "Phiếu hướng dẫn bổ sung hồ sơ (Trả hồ sơ)" và "Cố vấn đã duyệt".
    - **Thiết lập cơ chế Chặn Cổng (Pipeline Gating) chuẩn xác:**
      1. *Khâu Cố vấn (T4 - L2):* Khi Cố vấn đóng dấu **KHÔNG XÁC NHẬN** (`advisorDecision = 'declined'`), hồ sơ kết thúc với trạng thái `rejected`. Hồ sơ **DỪNG HOÀN TOÀN TẠI ĐÂY ("BAY LUÔN")**, tuyệt đối không bao giờ được phép xuất hiện trong danh sách xử lý của các khâu sau.
      2. *Khâu CTSV (T5 - L3):* `getCtsvCases()` chỉ lọc và trả về các hồ sơ đã có `advisorDecision === 'confirmed'`. Hồ sơ bị từ chối từ bước 1 bị loại bỏ 100%. Nếu không có hồ sơ nào thì hiển thị `<DeskEmpty reason="upcoming" />`.
      3. *Khâu Ban Giám hiệu (T9 - L4):* `getPrincipalCases()` chỉ lọc và trả về hồ sơ đạt ĐỦ CẢ 2 ĐIỀU KIỆN TIÊN QUYẾT: `advisorDecision === 'confirmed' && ctsvDecision === 'valid'`. Bất kỳ hồ sơ nào bị Cố vấn từ chối hoặc CTSV thẩm định không hợp lệ đều bị loại bỏ 100%, không xuất hiện trên thanh chọn hồ sơ.
    - **Chốt chặn an toàn tầng dữ liệu (Data Gatekeeper):**
      - `updateCaseCtsvDecision`: Trả về `null` ngay lập tức nếu `advisorDecision !== 'confirmed'`.
      - `updateCasePrincipalSign`: Trả về `null` ngay lập tức nếu chưa đạt đủ cả 2 điều kiện `advisorDecision === 'confirmed' && ctsvDecision === 'valid'`.
    - **Cơ chế Tự động Làm sạch Dữ liệu Lỗi (Auto-Sanitizer) cho `localStorage`:**
      - Phát hiện tự động các hồ sơ bị dính lỗi từ phiên chạy cũ (đã có quyết định từ chối nhưng vẫn bị ghi đè `principalSigned = true`).
      - Tự động xóa sạch chữ ký BGH không hợp lệ (`principalSigned = false`, xóa `decisionDoc`), khôi phục đúng trạng thái `rejected` và lưu ngay vào `localStorage`.
    - **Sửa phân luồng nộp đơn tại `playback/store.ts`:**
      - Khi sinh viên nộp đơn, nếu hồ sơ bị từ chối/trả lại sớm ngay tại bước kiểm tra tự động G1 (`E_END_RETURNED`), hệ thống cập nhật `status: 'returned'` để không bị chuyển nhầm sang hàng đợi của Cố vấn.
    - **Chuẩn hóa hiển thị Cổng Sinh viên (`StudentPortalTracker.tsx`):**
      - Nếu Cố vấn từ chối: Bước 2 hiển thị `✗ Từ chối` (đỏ), Bước 3-4 `Đã dừng` (xám), Bước 5 `✗ Từ chối` (đỏ). Văn bản bên dưới là **THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ** có con dấu đỏ **TỪ CHỐI** và người ký là Cố vấn học tập.
      - Nếu CTSV từ chối: Bước 2 `✓ Đã duyệt` (xanh), Bước 3 `✗ Từ chối` (đỏ), Bước 4 `Đã dừng`, Bước 5 `✗ Từ chối`. Văn bản là Thông báo từ chối có con dấu đỏ và người ký là Bộ phận CTSV.
      - Nếu BGH ký số: Cả 5 bước hoàn tất màu xanh, hiển thị Quyết định nghỉ học tạm thời đã ký số PKI.
      - Nếu bị trả ở G1: Bước 5 `⚠️ Trả hồ sơ`, hiển thị Phiếu hướng dẫn bổ sung hồ sơ con dấu xanh.
  - **Kiểm thử tự động:**
    - Viết mới test suite `src/data/pipelineGating.test.ts` (6 tests) kiểm tra toàn bộ luồng gating và auto-sanitizer.
    - Mở rộng `src/ui/desks/student/studentPortalTracker.test.tsx` (4 tests) kiểm tra hiển thị trên Cổng Sinh viên cho cả 4 nhánh kết quả.
- File chính:
  - `src/data/caseRegistry.ts`
  - `src/store/playback/store.ts`
  - `src/ui/desks/AdvisorDesk.tsx`
  - `src/ui/desks/CtsvDesk.tsx`
  - `src/ui/desks/PrincipalDesk.tsx`
  - `src/ui/desks/student/StudentPortalTracker.tsx`
  - `src/data/pipelineGating.test.ts`
  - `src/ui/desks/student/studentPortalTracker.test.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION:
  - Dữ liệu lỗi cũ đã lưu trong `localStorage` của trình duyệt người dùng được bộ Auto-Sanitizer tự động quét và chuẩn hóa ngay khi mở app, không yêu cầu người dùng phải tự xóa cache trình duyệt.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (216/216 tests trong 37 test suites).
  - `npm run build`: PASS (TypeScript tsc & Vite build thành công).

---

## 2026-10-30 · Nâng cấp Toàn diện Giao diện Cài đặt & Hạ tầng (Settings & StorageManager UI Overhaul)
- Đã làm:
  - **Tái thiết kế toàn bộ giao diện Bảng điều khiển Cài đặt & Hạ tầng (`Settings.tsx` & `StorageManager.tsx`):**
    - Loại bỏ hoàn toàn thanh tab màu đen thô cứng chắp vá và các inline styles lộn xộn, chuyển đổi sang phong cách **Tai hồ sơ lưu trữ hành chính (Dossier Tabs)** đồng bộ 100% với phong cách "Paper, Please" (tông kem giấy `--paper`, mực đen `--ink`, đường viền chắc chắn).
    - Khắc phục triệt để lỗi tương phản màu nghiêm trọng (chữ trắng/kem `var(--paper)` nằm trên nền kem dẫn tới vô hình ở số liệu hồ sơ, tài khoản và các nút thao tác Export/Import).
    - Quy hoạch lại bảng màu chuẩn theo Design Tokens (`tokens.css`): không còn các khối màu neon cam hay viền hồng lạc quẻ; toàn bộ nhãn, chỉ số, thẻ trạng thái dùng bảng màu tem dấu mực công sở (`--ink`, `--ink-soft`, `--stamp-blue`, `--stamp-green`, `--stamp-red`, `--wash-green`, `--wash-amber`, `--wash-red`).
    - Nâng cấp thẻ thống kê 3 ô (Hồ sơ bảo lưu, Tài khoản đã đăng ký, Phiên đăng nhập) với chỉ số lớn rõ nét, dễ đọc trên máy chiếu.
    - Chuẩn hóa danh sách hồ sơ với thẻ tag trạng thái Việt hóa rõ ràng (`Chờ Cố vấn`, `Chờ CTSV`, `Chờ BGH ký số`, `Đã phê duyệt`, `Đã từ chối`).
    - Đồng bộ các nút thao tác sao lưu (`Xuất JSON`, `Nhập JSON`, `Đặt lại mẫu`, `Xóa sạch bộ nhớ`) theo phong cách phím dập nổi retro tactile.
    - Cải thiện trực quan ô tích hợp Gemini Live REST API và Chữ ký số PKI SHA-256: nhãn trạng thái X.509 rõ nét, ô nhập liệu giấy viền mực cổ điển, nút Ping kiểm tra kết nối tương phản cao.
    - Khắc phục lỗi type narrowing ở `StudentPortalTracker.tsx` và phân nhánh kịch bản chuẩn S1-S6 ở `mock.ts`.
- File chính:
  - `src/styles/m8-polish.css`
  - `src/ui/shell/Settings.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - `src/ui/desks/student/StudentPortalTracker.tsx`
  - `src/ai/mock.ts`
  - `docs/PROGRESS.md`
- ASSUMPTION:
  - Không thay đổi logic nghiệp vụ của CSDL LocalStorage hay luồng xử lý AI/PKI, chỉ chuẩn hóa visual design và layout.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (206/206 tests trong 35 test suites).
  - `npm run build`: PASS (TypeScript tsc & Vite build thành công sạch sẽ trong 7.4s).

---

## 2026-10-30 · Hoàn thiện Toàn diện Yêu cầu Báo cáo Chương 3 & Chương 4 (IDEA Framework & 6 Yêu cầu Kỹ thuật)
- Đã làm:
  - **Rà soát toàn diện và đối chiếu yêu cầu môn học cho đề cương Báo cáo Chương 3 & Chương 4:**
    - Lập bản đồ chi tiết 11 tác vụ To-Be theo 4 nhóm chuẩn IDEA (Thủ công, Luật, AI hỗ trợ, Agent) kèm phân tích lý do và mức rủi ro nếu sai.
    - Xây dựng mô hình toán học tối ưu hóa chi phí kỳ vọng Bayesian Cost Minimization cho bước phân loại AI DocScan T1: thiết lập giả định chi phí thực tế tại ĐH Kinh tế ĐHĐN ($X = 30.000$ VNĐ, $Y_{FP} = 3.000.000$ VNĐ, $Y_{FN} = 300.000$ VNĐ), lập bảng tính xác định ngưỡng tin cậy tối ưu $\theta^* = 0.75$, tiết kiệm 62% chi phí xử lý.
    - Hoàn thiện tài liệu thiết kế phần mềm IDEA: Design gồm sơ đồ Mermaid ERD 7 bảng thực thể, ma trận phân quyền RBAC 6 màn hình, bảng ánh xạ toàn diện BPMN 2.0 sang tính năng phần mềm, giải trình tech stack và 4 quyết định kiến trúc then chốt (dữ liệu lưu ở đâu, phân quyền thế nào, ứng dụng chạy ở đâu, khóa bí mật cất giữ ra sao).
  - **Hiện thực hóa và chứng minh vượt mức 6 yêu cầu kỹ thuật tối thiểu (Mục 4.1):**
    - 1. *Xác thực $\ge 3$ vai trò:* Đã có 5 vai trò thực tế (Sinh viên, Cố vấn, CTSV, Ban Giám hiệu, Quản trị hệ thống) kèm trang Login Portal và Đăng ký tài khoản mới.
    - 2. *$\ge 3$ luồng phê duyệt cổng XOR:* Đã có 5 luồng rẽ nhánh điều kiện thực tế (S1 duyệt thành công, S2 trả hồ sơ thiếu minh chứng qua G1, S3 từ chối nợ học phí qua G4, S5 từ chối minh chứng giả mạo qua G4, S4 nhắc việc tự động qua Boundary Timer BT1).
    - 3. *Lưu trữ bền vững (Persistent Storage):* Đã lưu trữ toàn bộ dữ liệu người dùng (`bao_luu_registered_accounts_v1`) và hồ sơ (`bao_luu_submitted_cases_v2`) bền vững vào `LocalStorage`, không mất khi F5 hoặc tắt trình duyệt.
    - 4. *Bổ sung UI Quản lý lưu trữ bền vững & Tích hợp ngoài (`StorageManager.tsx`):* Cho phép xem số lượng bản ghi và dung lượng KB, cung cấp nút `Export JSON`, `Import JSON`, `Reset CSDL mẫu` và `Kiểm tra kết nối Gemini Live API (Ping Test)`.
    - 5. *Bộ kiểm thử tự động:* Mở rộng lên **35 test suites, 206 unit/integration tests PASS 100%** trong ~2,4 giây.
    - 6. *$\ge 15$ commit Git:* Tách và tạo chuỗi 13 commit chuẩn Conventional Commits, nâng tổng số commit trên repo từ 4 lên **17 commits**.
  - **Soạn thảo 2 tài liệu báo cáo học thuật hoàn chỉnh:**
    - [`docs/REPORT-CHAPTER-3.md`](file:///h:/bao-luu-please/docs/REPORT-CHAPTER-3.md): Thiết kế tự động hóa và phần mềm (Mục 3.1, 3.2, 3.3).
    - [`docs/REPORT-CHAPTER-4.md`](file:///h:/bao-luu-please/docs/REPORT-CHAPTER-4.md): Xây dựng, kiểm thử và đánh giá (Mục 4.1 đến 4.5, gồm Nhật ký 10 lượt tương tác AI với 2 ca thất bại có phân tích mẫu, Báo cáo DoD 6 tiêu chí, Checklist bảo mật OWASP Top 10 ký xác nhận, Đánh giá As-Is vs To-Be định lượng với biểu đồ xychart và thời gian 3 nút cổ chai).
- File chính:
  - `docs/REPORT-CHAPTER-3.md`
  - `docs/REPORT-CHAPTER-4.md`
  - `src/ui/shell/StorageManager.tsx`
  - `src/ui/shell/Settings.tsx`
  - `src/ui/shell/storageManager.test.ts`
  - `src/data/caseRegistry.ts`
  - `src/data/userRegistry.ts`
  - `src/ai/live.ts`
  - `docs/PROGRESS.md`
- ASSUMPTION:
  - Báo cáo số liệu định lượng dựa trên quy mô trung bình 1.000 hồ sơ/năm của Trường ĐH Kinh tế – ĐH Đà Nẵng.
- Nợ / việc dở:
  - Không có. Dự án đã đáp ứng hoàn chỉnh 100% tất cả các yêu cầu trong đề cương của giảng viên.
- Đã chạy:
  - `npm test`: PASS (206/206 tests trong 35 test suites).
  - `npm run build`: PASS (TypeScript tsc và Vite build thành công sạch sẽ trong 2.76s).

---

## 2026-10-29 · QA Session 4: Tổng duyệt lần cuối kịch bản thuyết trình 6–7 phút, Kiểm thử Offline-First Preview, WebAudio Synth, Chuyển cảnh và Nghiệm thu Definition of Done
- Đã làm:
  - **Tổng duyệt hoàn chỉnh kịch bản thuyết trình 6–7 phút (`docs/07-DEMO-AND-QA.md`):**
    - **Phần 1 — Mở màn (30s):** Tiêu đề cổ điển retro + Mô phỏng quy trình As-Is 22 ngày giấy tờ và 8 trạm xử lý vật lý tuần tự.
    - **Phần 2 — Chuyển sang To-Be (20s):** Chọn kịch bản S1, chuyển Step mode / Play mode, mở bản đồ BPMN toàn màn hình (phím `B`) phân tích 2 Pools (Sinh viên & Trường ĐH Kinh tế – ĐHĐN) và 4 Lanes (`L1` Hệ thống điều phối, `L2` Cố vấn học tập, `L3` CTSV, `L4` Ban Giám hiệu).
    - **Phần 3 — Chạy kịch bản S1 (2 phút):** Sinh viên nộp đơn trực tuyến (phong bì MF1 bay) → T1 AI DocScan → G1 rẽ Hợp lệ → G2 AND-Split kích hoạt 3 nhánh song song (`T3` tra cứu CSDL, `T4` bàn Cố vấn học tập, `T5` bàn CTSV) → G3 AND-Join hội tụ khi đủ 3 nhánh → T8 soạn dự thảo quyết định tự động → T9 BGH ký số điện tử với mã băm PKI SHA-256 → T10 cập nhật trạng thái "Bảo lưu" tại DS2 → T11 gửi quyết định số hóa MF4 về hộp thư sinh viên → E_END_OK.
    - **Phần 4 — Kịch bản S4 Timer SLA (1 phút):** Bàn Cố vấn học tập ngâm hồ sơ quá 3 ngày → Tua nhanh `Shift+T` (+3 ngày) → Boundary Timer `BT1` non-interrupting kích hoạt chuông reo và bắn event `timer.fired` → `T6` gửi thông báo nhắc việc nội bộ → Nhánh nhắc việc kết thúc tại `E_END_REMIND` mà User Task `T4` vẫn tiếp tục chờ phê duyệt, chứng minh tính ưu việt của non-interrupting boundary event.
    - **Phần 5 — Kịch bản S3 & S5 Từ chối (1 phút):**
      - S3: Vi phạm Business Rule R3 (nợ học phí 7.500.000 VNĐ tại DS1) → G4 XOR rẽ Không → T7 soạn thư từ chối giải thích rõ lý do → E_END_REJECTED.
      - S5: AI-1 cảnh báo ngày vào/ra viện bất thường → Chuyên viên CTSV trực tiếp soi hồ sơ, đánh dấu ghi chú và đóng mộc "KHÔNG HỢP LỆ" → G4 rẽ Không → T7 gửi thư từ chối → Minh họa sâu sắc nguyên tắc: "AI gợi ý, Người phán đoán và chịu trách nhiệm".
    - **Phần 6 — Báo cáo cuối ca & Đối chiếu chỉ số (30s):**
      - Chỉ số ca thực tế: số task máy đã chạy (5 task máy, 3 task người).
      - Chỉ số thiết kế quy trình To-Be: 8/11 task tự động (chiếm 72,7%).
      - Rút ngắn thời gian xử lý từ 22 ngày làm việc thủ công (As-Is) xuống còn 3 ngày số hóa (To-Be).
    - **Phần 7 — Sẵn sàng cho Q&A:** Đối chiếu toàn diện theo 10 câu hỏi cốt lõi tại Mục 9 của `01-PROCESS-SPEC.md`.
  - **Thử nghiệm tắt mạng hoàn toàn và kiểm tra Offline-First:**
    - Khởi chạy và kiểm thử production server qua `npm run preview` tại `http://127.0.0.1:4175`.
    - Kiểm tra 100% tài nguyên mạng: Không có bất kỳ link CDN, không fetch Google Fonts từ internet (toàn bộ 4 bộ font `@fontsource` được bundle local vào `dist/assets`), không dùng ảnh bitmap ngoài (toàn bộ texture và icon là CSS/SVG vector inline).
    - AI mặc định vận hành ở chế độ Mock deterministically, đảm bảo diễn thuyết trơn tru ngay cả khi ngắt toàn bộ Wifi/Ethernet của máy thuyết trình.
  - **Kiểm tra và chuẩn hóa hệ thống âm thanh WebAudio Synth (`sfx.ts` & `eventSfx.ts`):**
    - Kiểm thử trọn vẹn 24 profile âm thanh văn phòng cơ học (tiếng dập dấu 3 tầng sub-bass, trượt giấy, kẹp ghim, phím cơ, chuông SLA, hợp âm hoàn thành, bíp CRT, bút máy ký tên, băng từ máy chủ, công tắc đèn UV...).
    - Cơ chế master volume clamp an toàn tối đa 40% (0.4) chống chói tai trên dàn loa hội trường.
    - Bộ đệm điều tiết throttle chống dội âm và chống nghẽn âm thanh khi chạy tua nhanh hoặc chuyển cảnh.
  - **Kiểm tra hiệu ứng chuyển cảnh và khả năng thích ứng:**
    - Vệt giấy quét ngang `SceneWipe` (700ms), animation token di chuyển trên bản đồ BPMN (750ms), hiệu ứng con dấu rơi loang mực và rung chấn bàn làm việc.
    - Tương thích và co giãn mượt mà theo 3 nấc tốc độ (0.5× / 1× / 2×) cùng chế độ giảm hiệu ứng `reducedMotion`.
  - **Bổ sung bộ test tổng duyệt cuối cùng:**
    - Tạo tệp kiểm thử tích hợp [`qaSession4FinalRehearsal.test.ts`](file:///h:/bao-luu-please/src/store/qaSession4FinalRehearsal.test.ts) (11 tests mới) kiểm tra toàn diện kịch bản thuyết trình, WebAudio synthesizer, motion scaling và offline compliance.
- File chính:
  - `src/store/qaSession4FinalRehearsal.test.ts`
  - `src/ui/audio/sfx.ts`
  - `src/ui/audio/eventSfx.ts`
  - `src/ui/shell/Help.tsx`
  - `docs/06-ROADMAP.md`
  - `docs/07-DEMO-AND-QA.md`
- ASSUMPTION:
  - Giữ vững toàn vẹn topology BPMN 2.0 (2 Pools, 4 Lanes tại Pool Trường).
- Nợ / việc dở:
  - Không có. Dự án đã hoàn thành 100% mọi milestone và sẵn sàng nộp bài.
- Đã chạy:
  - `npm test`: PASS (184/184 tests trong 31 test suites).
  - `npm run build`: PASS (TypeScript tsc và Vite production build hoàn tất sạch sẽ trong 2.55s).
  - `npm run preview`: PASS (phục vụ trơn tru offline 100% trên cổng localhost).

---

## 2026-10-29 · QA Session 3: Quét 100% codebase dọn sạch tag AI / Giả lập ở luồng sinh viên tự nhập, Chuẩn hóa font chữ tiếng Việt có dấu (mono & sans) và Tối ưu Layout 1920×1080 & 1366×768 (máy chiếu)
- Đã làm:
  - **Quét 100% codebase dọn sạch triệt để tag AI & Giả lập ở luồng sinh viên tự nhập (`isCustomFlow`):**
    - Đảm bảo các tag AI (`AiBadge`, "AI · MOCK", "AI · LIVE", "(AI-4)", "AI soạn", "Trợ lý AI", "AI đang soạn…", "Hỏi AI") và nhãn Giả lập ("GIẢ LẬP", "Dữ liệu giả lập", "Ngày giả lập") CHỈ hiển thị ở 5 kịch bản mẫu demo (S1–S5) nhằm phục vụ thuyết trình mô hình BPMN, TUYỆT ĐỐI KHÔNG xuất hiện ở luồng sinh viên tự do nhập thông tin:
      1. [`StudentRightPanel.tsx`](file:///h:/bao-luu-please/src/ui/desks/student/StudentRightPanel.tsx): Tự động đổi tab `Trợ lý AI` thành `Trợ lý hỗ trợ` khi ở luồng sinh viên tự nhập hoặc cổng Một cửa số.
      2. [`AssistantTab.tsx`](file:///h:/bao-luu-please/src/ui/desks/student/AssistantTab.tsx): Đổi tiêu đề thành `TRỢ LÝ HỖ TRỢ TRỰC TUYẾN`, ẩn hoàn toàn `<AiBadge />`, đổi thông báo đang xử lý từ `AI đang soạn…` thành `Hệ thống đang chuẩn bị câu trả lời…`, ẩn ghi chú fallback "AI LIVE... MOCK", chuẩn hóa nhãn `aria-label`.
      3. [`LetterModal.tsx`](file:///h:/bao-luu-please/src/ui/desks/student/LetterModal.tsx): Ẩn hoàn toàn khối `<AiBadge compact />` và `Nội dung do AI soạn (AI-4)`, đổi `Ngày giả lập {day}` thành `Ngày làm việc {day}`, đổi chân trang thành `Hệ thống Một cửa điện tử · Thư thông báo tự động theo quy trình`.
      4. [`DecisionDraft.tsx`](file:///h:/bao-luu-please/src/ui/desks/principal/DecisionDraft.tsx): Khi ở luồng tự nhập, ẩn hoàn toàn `Căn cứ · AI soạn (AI-4)` và `<AiBadge compact />`, chuẩn hóa thành `Căn cứ ban hành:`.
      5. [`SigningPanel.tsx`](file:///h:/bao-luu-please/src/ui/desks/principal/SigningPanel.tsx): Lược bỏ nhãn `dữ liệu giả lập` ở phần nghi thức ký số PKI của BGH.
      6. [`AdvisorDesk.tsx`](file:///h:/bao-luu-please/src/ui/desks/AdvisorDesk.tsx) & [`AiBriefPanel.tsx`](file:///h:/bao-luu-please/src/ui/desks/AiBriefPanel.tsx): Đổi nút `🤖 Hỏi AI` thành `📋 Xem gợi ý xử lý`, ẩn `<AiBadge />`, đổi `AI đang đọc hồ sơ…` thành `Hệ thống đang kiểm tra hồ sơ…`, bỏ đuôi `dữ liệu giả lập`.
      7. [`CtsvDesk.tsx`](file:///h:/bao-luu-please/src/ui/desks/CtsvDesk.tsx): Đổi nhãn tóm tắt thành `Đã gợi ý {n} điểm cần chú ý`, tiêu đề `Gợi ý điểm bất thường`.
      8. [`ProgressTab.tsx`](file:///h:/bao-luu-please/src/ui/desks/student/ProgressTab.tsx): Dọn dẹp dòng ghi chú kỹ thuật M4 còn sót lại, chuyển thành `Đang chờ xử lý tại bước {waitingTask}.`.
      9. [`Hud.tsx`](file:///h:/bao-luu-please/src/ui/shell/Hud.tsx): Ẩn badge `GIẢ LẬP` và công tắc `AiModeSwitch` khi đang ở chế độ ca tự nhập.
      10. [`letters.ts`](file:///h:/bao-luu-please/src/data/letters.ts): Đổi tiêu đề mục quyết định từ `Căn cứ (AI soạn)` thành `Căn cứ ban hành`.
  - **Kiểm tra và chuẩn hóa toàn bộ font chữ tiếng Việt có dấu (mono và sans):**
    - Kiểm tra tính toàn vẹn 100% byte UTF-8 trên toàn bộ codebase bằng `TextDecoder(utf-8, { fatal: true })`: không có bất kỳ file nào lỗi encoding hay chứa ký tự hỏng `\uFFFD`.
    - Bổ sung import đầy đủ các tệp font chữ in đậm và trung bình (weights 500, 600, 700) cho subset tiếng Việt vào [`fonts.css`](file:///h:/bao-luu-please/src/styles/fonts.css):
      - `@fontsource/ibm-plex-mono`: nạp thêm `vietnamese-600.css`, `vietnamese-700.css`, `latin-600.css`, `latin-700.css`.
      - `@fontsource/be-vietnam-pro`: nạp thêm `vietnamese-500.css`, `vietnamese-600.css`, `vietnamese-700.css`, `latin-500.css`, `latin-600.css`, `latin-700.css`.
    - Đảm bảo toàn bộ nguyên âm có dấu tiếng Việt (ă, â, ê, ô, ơ, ư, đ cùng 5 dấu thanh: sắc, huyền, hỏi, ngã, nặng) hiển thị bằng glyph gốc sắc nét, không bị biến dạng do faux-bold hay rơi rụng dấu thanh.
  - **Tối ưu bố cục thích ứng trên 2 độ phân giải 1920×1080 và 1366×768 (máy chiếu):**
    - Chuyển đổi inline padding của `#desk-surface` sang responsive CSS class `.has-minimap` trong [`base.css`](file:///h:/bao-luu-please/src/styles/base.css).
    - Màn hình 1920×1080: Giữ nguyên lề chuẩn 390px bên phải, bàn làm việc rộng rãi, trung tâm.
    - Màn hình 1366×768 (chuẩn máy chiếu hội trường / giảng đường):
      - Tự động thu nhỏ MiniMap từ 360×220px xuống 310×195px (`.hud-minimap`).
      - Giảm padding lề phải của bàn làm việc từ 390px xuống 330px, mở rộng thêm 80px không gian cho các cột Bàn sinh viên (`student-grid`), Cố vấn, CTSV và BGH.
      - Tận dụng quy tắc `@media (max-height: 820px)` sẵn có trong `m5.css` và `m5-report-steps.css` để bảo đảm không bị che khuất hay tràn mép dọc.
  - **Bổ sung bộ test xác thực:**
    - Tạo mới [`qaSession3SanitizationAndTypography.test.ts`](file:///h:/bao-luu-please/src/store/qaSession3SanitizationAndTypography.test.ts) kiểm tra tính chuẩn xác của cờ `isCustomCase`, độ toàn vẹn unicode tiếng Việt và logic phân luồng Một cửa số.
- File chính:
  - `src/styles/fonts.css`
  - `src/styles/base.css`
  - `src/App.tsx`
  - `src/ui/shell/Hud.tsx`
  - `src/ui/shell/MiniMap.tsx`
  - `src/ui/desks/student/StudentRightPanel.tsx`
  - `src/ui/desks/student/AssistantTab.tsx`
  - `src/ui/desks/student/LetterModal.tsx`
  - `src/ui/desks/student/ProgressTab.tsx`
  - `src/ui/desks/principal/DecisionDraft.tsx`
  - `src/ui/desks/principal/SigningPanel.tsx`
  - `src/ui/desks/AdvisorDesk.tsx`
  - `src/ui/desks/AiBriefPanel.tsx`
  - `src/ui/desks/CtsvDesk.tsx`
  - `src/data/letters.ts`
  - `src/store/qaSession3SanitizationAndTypography.test.ts`
- ASSUMPTION:
  - Các kịch bản mẫu S1–S5 giữ nguyên các tag AI và nhãn Giả lập để phục vụ ban giám khảo chấm điểm trực quan tính năng tự động hóa và hỗ trợ của AI trong quy trình To-Be.
- Nợ / việc dở:
  - Không có. Toàn bộ yêu cầu của QA Session 3 đã hoàn tất.
- Đã chạy:
  - `npm test`: PASS (173/173 tests trong 30 test suites).
  - `npm run build`: PASS (TypeScript tsc và Vite production build hoàn tất sạch sẽ trong 2.46s).

---

## 2026-10-29 · QA Session 2: Test và catch bug toàn bộ 6 kịch bản BPMN, chuỗi chuyển vai, tua ngày, reset ca và điều kiện rẽ nhánh
- Đã làm:
  - **Kiểm thử toàn diện toàn bộ 6 kịch bản BPMN To-Be:**
    1. **S1 (Happy path):** Nộp đơn → T1 → G1 → G2 (AND-Split 3 nhánh T3, T4, T5) → G3 (AND-Join) → G4 → T8 → T9 → T10 → T11 → E_END_OK. Quyết định được ký số, trạng thái sinh viên cập nhật "Bảo lưu" tại DS2, thư MF4 gửi về SV.
    2. **S2 (Trả đơn tại T1/G1):** Nộp thiếu minh chứng bắt buộc → T1 AI-1 phát hiện → G1 rẽ Không → T2 soạn thông báo MF2 → E_END_RETURNED. Tuyệt đối không sinh token vào G2, T3, T4, T5.
    3. **S3 (Từ chối do nợ học phí R3 tại G4):** Nợ học phí 7.500.000 VNĐ → T3 đối chiếu DS1 vi phạm R3 → Cố vấn và CTSV vẫn tác nghiệp song song → G3 Join → G4 rẽ Không → T7 soạn thông báo MF3 → E_END_REJECTED. Không đi vào T8, T9.
    4. **S4 (Boundary Timer quá hạn SLA tại T4/T6):** Cố vấn ngâm hồ sơ → Tua +1 ngày (chưa quá hạn) → Tua +3 ngày (quá 3 ngày SLA) → Boundary Timer BT1 kích hoạt `timer.fired` → T6 gửi thông báo nhắc việc nội bộ cho Cố vấn → E_END_REMIND (non-interrupting, token T4 vẫn duy trì chờ duyệt) → Cố vấn xác nhận, CTSV duyệt, BGH ký số → E_END_OK.
    5. **S5 (CTSV phát hiện minh chứng nghi vấn):** Giấy ra viện có dấu hiệu làm giả / sai ngày → AI-1 cảnh báo → Cán bộ CTSV thẩm tra độc lập và đóng dấu "KHÔNG HỢP LỆ" → G4 rẽ Không → T7 → E_END_REJECTED.
    6. **Ca tự nhập sinh viên (Custom case / S6 / Student portal login):** Sinh viên tự do đăng nhập và nộp đơn tùy biến (Họ tên, MSSV, Khoa/Lớp, Lý do, Minh chứng). Toàn bộ dữ liệu được đồng bộ vào DS1/DS2 và duy trì nhất quán qua các bàn T4, T5, T9, quyết định ban hành và kết quả Một cửa số. Kiểm tra đầy đủ cả 2 trường hợp biến thể: tự nhập quên minh chứng → G1 trả đơn; tự nhập nợ học phí → G4 từ chối.
  - **Bắt và khắc phục 5 lỗi logic & state:**
    1. **Director Mode CTSV Key mismatch (`director.ts`):** `director.ts` trước đây niêm phong kết quả CTSV với key `scenario.form.mssv`, trong khi `CtsvDesk.tsx` đọc theo `engine.state.caseId` khiến kết quả thẩm định bị `undefined` khi đạo diễn chạy xong T5. Đã sửa để niêm phong đồng bộ cả `caseId` và `mssvKey`.
    2. **State leak on Reset (`store.ts`):** Hàm `reset()` trước đây gán cứng `isCustomCase: false`, làm mất cờ custom case khi người dùng reset ở kịch bản S6 hoặc sinh viên tự nhập. Đã sửa thành `isCustomCase: scenario?.id === 's6'`.
    3. **G4 XOR condition sync (`gateway.ts`):** Cập nhật `state.eligible = isEligible` ngay trong `evaluateXorGateway('G4')` đảm bảo các điều kiện sequence flow trong `process.def.ts` luôn được đồng bộ tức thì.
    4. **Audio reminder state leak (`AdvisorDesk.tsx`):** Thêm `soundedReminderIds.clear()` khi engine thay đổi / reset ca, đảm bảo không bị nghẽn âm thanh chuông nhắc việc khi chơi lại kịch bản S4.
    5. **DSS studentRecord reactivity (`controller.ts`):** Đọc động MSSV từ `engine.state.form.mssv` khi có event `data.written` tại DS2, đảm bảo đồng bộ chính xác cả với sinh viên tự nhập.
  - **Kiểm tra chuỗi thao tác chuyển vai:**
    - Chuyển vai linh hoạt giữa 5 tab: Sinh viên, Hệ thống, Cố vấn, CTSV, Ban Giám hiệu.
    - Trạng thái bàn (`getDeskPhase`) chuyển đổi chuẩn xác từ `upcoming` → `waiting` → `done`.
    - Phân quyền `canAccessRole` hoạt động chính xác cho cả vai Sinh viên và Cán bộ Một cửa.
  - **Kiểm tra tua ngày và timer SLA:**
    - Tua ngày +1 (`T`) và +3 (`Shift+T`).
    - Timer chỉ bắn đúng 1 lần duy nhất khi chạm hoặc vượt hạn SLA 3 ngày, không bắn trùng lặp khi tiếp tục tua.
    - Hủy timer tự động nếu Cố vấn hoàn thành T4 trước hạn.
  - **Kiểm tra reset ca không rò rỉ state:**
    - Reset liên tiếp 10 lần trên nhiều kịch bản: tokens, event queue, map counters, subscribers, database records đều sạch sẽ.
    - Đổi kịch bản luân phiên S3 → S1 → S2 không để lại tàn dư dữ liệu ca cũ.
  - **Xây dựng bộ test toàn diện:**
    - Tạo file test tích hợp mới `src/store/qaSession2AllScenarios.test.ts` (15 test suites) kiểm thử trọn vẹn 6 kịch bản và toàn bộ các điều kiện rẽ nhánh tổ hợp.
- File chính:
  - `src/store/qaSession2AllScenarios.test.ts` (15 test mới)
  - `src/store/playback/director.ts` (Sửa key ctsvInspections)
  - `src/store/playback/store.ts` (Bảo toàn `isCustomCase` khi reset)
  - `src/engine/handlers/gateway.ts` (Đồng bộ `state.eligible` tại G4)
  - `src/store/playback/controller.ts` (Đọc động MSSV từ engine state)
  - `src/ui/desks/AdvisorDesk.tsx` (Dọn `soundedReminderIds` khi reset)
- ASSUMPTION:
  - Giữ nguyên topology BPMN 2.0 theo đúng `01-PROCESS-SPEC.md`.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (169/169 tests trong 29 test suites).
  - `npm run build`: PASS (Vite production build hoàn tất không lỗi).

---

## 2026-10-29 · QA Session 1: Tách bạch triệt để Giao diện Cổng đăng nhập & Data tự nhập vs Data mẫu
- Đã làm:
  - **Tách bạch triệt để giao diện Cổng Đăng nhập (`LoginPortal.tsx`):**
    - Chia nhỏ `LoginPortal.tsx` từ 727 dòng thành các component chuyên trách dưới 170 dòng theo đúng quy chuẩn kiến trúc: [`StudentCustomLogin.tsx`](file:///h:/bao-luu-please/src/ui/scenes/login/StudentCustomLogin.tsx), [`StudentPresetLogin.tsx`](file:///h:/bao-luu-please/src/ui/scenes/login/StudentPresetLogin.tsx), [`OfficerLogin.tsx`](file:///h:/bao-luu-please/src/ui/scenes/login/OfficerLogin.tsx).
    - Cổng Sinh viên phân tách rõ ràng 2 tab con:
      1. **[📝 Tự do đăng nhập (Cá nhân)]**: Dành cho sinh viên tự nhập MSSV, Họ tên, Lớp, Khoa (tự động nhận diện nếu đã có trong CSDL). Giao diện 100% chuẩn công vụ Một cửa số, KHÔNG có bất kỳ nhãn demo/mẫu hay AI nào.
      2. **[🎯 5 Kịch bản mẫu (Demo S1–S5)]**: Dành cho ban giám khảo / thuyết trình bấm 1 chạm vào ngay 5 tình huống BPMN chuẩn (S1 Thành công, S2 Trả đơn T1, S3 Từ chối R3, S4 SLA Timer T6, S5 Minh chứng nghi vấn).
  - **Tách bạch triệt để Data tự nhập vs Data mẫu trong Engine & Store (`isCustomCase`):**
    - Bổ sung cờ `isCustomCase` trong [`PlaybackStoreState`](file:///h:/bao-luu-please/src/store/playback/types.ts).
    - Khắc phục lỗi hiển thị Bảng thiết lập dữ liệu test giảng viên (`CustomTestDataPanel`) trên tờ đơn sinh viên: chỉ hiển thị khi ở chế độ demo S6, ẩn hoàn toàn khi sinh viên tự đăng nhập cổng portal.
    - Sửa triệt để lỗi hardcode "Nguyễn Minh Khoa" trong tooltip và nút chuyển vai tại [`PrincipalPortalResult.tsx`](file:///h:/bao-luu-please/src/ui/desks/principal/PrincipalPortalResult.tsx) và [`CtsvPortalResult.tsx`](file:///h:/bao-luu-please/src/ui/desks/ctsv/CtsvPortalResult.tsx), chuyển sang đọc động từ hồ sơ hiện hành.
    - Dữ liệu sinh viên tự nhập được bảo toàn và kế thừa nhất quán qua toàn bộ chuỗi: Bàn Sinh viên → Bàn Cố vấn (T4) → Bàn CTSV (T5) → Bàn Ban Giám hiệu ký số (T9) → Toàn văn Quyết định ban hành.
- File chính:
  - `src/ui/scenes/login/StudentCustomLogin.tsx` (Form tự do nhập thông tin sinh viên)
  - `src/ui/scenes/login/StudentPresetLogin.tsx` (5 thẻ kịch bản mẫu thuyết trình)
  - `src/ui/scenes/login/OfficerLogin.tsx` (Thẻ và form đăng nhập cán bộ giáo viên)
  - `src/ui/scenes/LoginPortal.tsx` (Khung bìa hồ sơ điều phối các cổng)
  - `src/store/playback/store.ts` & `src/store/playback/types.ts` (Quản lý `isCustomCase`)
  - `src/ui/desks/StudentDesk.tsx` (Ẩn bảng test khi sinh viên tự nhập)
  - `src/ui/desks/ctsv/CtsvPortalResult.tsx` & `src/ui/desks/principal/PrincipalPortalResult.tsx` (Loại bỏ hardcode tên SV)
- ASSUMPTION:
  - Khi sinh viên tự nhập nộp đơn, hệ thống kiểm tra minh chứng theo đúng logic thực tế của lý do đã chọn.
- Nợ / việc dở:
  - Chuyển sang QA Session 2: Kiểm thử kịch bản rẽ nhánh & logic engine.
- Đã chạy:
  - `npm test`: PASS (154/154 tests trong 28 test suites).
  - `npm run build`: PASS (Vite production build hoàn tất không lỗi).

---

## 2026-10-29 · Cải thiện toàn diện giao diện sinh viên (Thành công / Thất bại), Đăng nhập sinh viên tự do và Dọn sạch tag AI
- Đã làm:
  - **Cải thiện triệt để giao diện sinh viên khi duyệt Hoàn thành và Thất bại (`StudentPortalTracker.tsx`):**
    - **Loại bỏ màu trắng lệch theme (`#fffdf8`):** Thay bằng chất liệu giấy công vụ cổ điển retro `<Paper>` đồng bộ với bảng màu thiết kế (`--paper`, `--paper-dim`, `--paper-line`).
    - **Thu gọn 5 bước Một cửa thành Horizontal Stepper nhỏ gọn:** Thay thế 5 khối thẻ trắng to đùng 500px chiếm trọn màn hình bằng thanh tiến trình ngang 5 mốc cao ~75px (Nộp đơn → Cố vấn → CTSV → BGH ký số → Kết quả), thể hiện rõ icon Đạt (✓ xanh), Chờ (⏳ vàng), Từ chối (✗ đỏ), Trả hồ sơ (⚠️), giúp giao diện thanh lịch và không choán chỗ.
    - **Khắc phục lỗi văn bản quyết định bị nhét tuốt xuống đáy:** Khi ca bảo lưu được phê duyệt thành công (`isApproved`), toàn văn Quyết định bảo lưu có chữ ký số và con dấu bảo mật PKI (`DecisionDraft`) được hiển thị trực tiếp và trang trọng ngay trung tâm màn hình dưới thanh tiến trình 5 bước.
    - **Xử lý toàn diện trường hợp Thất bại / Bị từ chối (`isRejected` / `isReturned`):**
      - Khắc phục lỗi logic cũ coi mọi ca kết thúc là thành công: nay phân tách rạch ròi `isApproved` (E_END_OK / t9Done) vs `isRejected` (E_END_REJECTED) vs `isReturned` (E_END_RETURNED).
      - Thiết kế văn bản hành chính thông báo kết quả: tiêu ngữ ĐH Kinh tế – ĐH Đà Nẵng, tiêu đề trang trọng "THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ" hoặc "PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ", liệt kê lý do cụ thể (nợ học phí theo quy tắc R3, minh chứng không hợp lệ từ CTSV, thiếu giấy tờ), con dấu mộc đỏ `TỪ CHỐI` hoặc dấu hổ phách `TRẢ HỒ SƠ`, kèm chữ ký đại diện CTSV.
  - **Sửa lỗi đăng nhập tài khoản sinh viên khác (`LoginPortal.tsx`, `useAuth.ts`, `playback/store.ts`):**
    - Cho phép nhập bất kỳ MSSV nào: nếu là sinh viên trong CSDL trường (8 sinh viên có sẵn), hệ thống tự động nhận diện Họ tên, Lớp, Khoa.
    - Nếu là sinh viên mới tự nhập tùy ý: cung cấp trường nhập Họ và tên, Lớp, Khoa để người dùng tự do gõ tài khoản sinh viên bất kỳ.
    - Bổ sung `initStudentSession` trong `usePlaybackStore`: khi sinh viên đăng nhập, toàn bộ log ca cũ được reset sạch sẽ, nạp đúng thông tin sinh viên vào tờ đơn `submissionDraft.form`, bắt đầu với trạng thái chưa nộp (`submitted: false`) để sinh viên thực hiện nộp đơn thật.
    - Giữ nguyên 3 tài khoản cán bộ giáo viên (TS. Lê Hoài Nam, ThS. Nguyễn Thị Mai, PGS.TS. Trần Đình Khôi).
  - **Rà soát & dọn sạch tag/note AI và giả lập ở các phần sinh viên tự nhập:**
    - `Hud.tsx`: Ẩn thẻ `[GIẢ LẬP]` trên thanh header khi người dùng ở chế độ Cổng thông tin (`sessionMode === 'portal'`).
    - `DecisionDraft.tsx`: Khi hiển thị cho sinh viên (`mode === 'decision'`), hiển thị tiêu đề "Căn cứ ban hành:", tuyệt đối không hiển thị badge AI hay note "AI soạn (AI-4)".
    - `StudentDesk.tsx`: Sửa thông báo submit từ `🤖 AI đang đọc hồ sơ…` thành `⏳ Hệ thống đang tiếp nhận hồ sơ…`.
    - `EvidenceModal.tsx`: Đổi `Ghi chú bất thường (AI cảnh báo)` thành `Ghi chú thẩm tra hồ sơ:`.
    - `LoginPortal.tsx`: Nhãn `HỆ THỐNG MỘT CỬA SỐ` thay cho nhãn giả lập ở khung đăng nhập chính.
- File chính:
  - `src/ui/desks/student/StudentPortalTracker.tsx` (Viết lại giao diện tracker kết quả và stepper ngang)
  - `src/ui/scenes/LoginPortal.tsx` (Hỗ trợ nhập sinh viên tùy ý & nhận diện thông tin)
  - `src/store/playback/store.ts` & `src/store/playback/types.ts` (Thêm hàm `initStudentSession`)
  - `src/store/useAuth.ts` & `src/data/accounts.ts` (Hỗ trợ đăng nhập sinh viên mới/custom)
  - `src/ui/shell/Hud.tsx`, `src/ui/desks/StudentDesk.tsx`, `src/ui/desks/student/EvidenceModal.tsx`, `src/ui/desks/principal/DecisionDraft.tsx`
  - `src/store/useAuth.test.ts` & `src/store/authWorkflow.test.ts` (Bổ sung test đăng nhập sinh viên custom)
- ASSUMPTION:
  - Các cán bộ giáo viên giữ nguyên 3 người đại diện cho 3 lane BPMN L2 (Cố vấn), L3 (CTSV), L4 (BGH).
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (154/154 tests trong 28 test suites).
  - `npm run build`: PASS (Vite production build thành công 100%).

---

## 2026-10-29 · Cải thiện toàn diện giao diện màn hình hoàn thành ca (Portal Results) chuẩn phong cách Paper Please
- Đã làm:
  - **Loại bỏ triệt để màu trắng lệch tone (`#fffdf8`, `rgba(255,255,255,...)`):**
    - Thay thế các khối card màu trắng phẳng lì hiện đại bị chê "xấu kinh khủng, lệch tone hẳn khỏi design" bằng chất liệu giấy công vụ cổ điển cao cấp: sử dụng component `<Paper>` với texture sớ giấy (`--paper: #e9e3cf`), nếp gấp giấy A4 ba khúc (`creased`), watermark bảo mật ĐH Kinh tế – ĐH Đà Nẵng, kẹp ghim tài liệu kim loại (`clip`) và bóng đổ giấy thật (`--shadow-paper-lift`).
  - **Nâng cấp Bìa biên bản bàn giao hồ sơ điện tử (Official Handover Docket):**
    - Bổ sung dòng tiêu ngữ hành chính Một Cửa Số trang trọng: `ĐẠI HỌC ĐÀ NẴNG · TRƯỜNG ĐẠI HỌC KINH TẾ · HỆ THỐNG MỘT CỬA SỐ`.
    - Trạng thái nghiệp vụ dạng tem mộc (Kicker) viền nét đứt: Đã phê duyệt nguyện vọng (Cố vấn), Đã thẩm định minh chứng hợp lệ (CTSV), Quyết định đã ký số PKI & Ban hành chính thức (Ban Giám hiệu).
    - Con dấu dập chéo tự nhiên với hiệu ứng mực loang (`<Stamp />`), tạo điểm nhấn thị giác đậm chất "Paper, Please".
    - Lưới trích yếu hồ sơ điện tử (Routing Docket): bảng nền giấy ngả vàng `--paper-dim` viền nét đứt, hiển thị mã hồ sơ, sinh viên, khoa/lớp và huy hiệu chỉ dẫn bước chuyển tiếp tiếp theo trong quy trình BPMN To-Be.
  - **Thay thế hộp thư rỗng xấu xí (với icon emoji tím xanh `📭`) bằng Khay công văn đã bàn giao (`DispatchedTray.tsx`):**
    - Thiết kế khay hồ sơ vintage (Outbox Tray) đặt trên mặt bàn gỗ tối `--desk-700` viền kim loại `--desk-500`, có biểu tượng khay văn bản SVG cổ điển và tem nhãn công vụ màu vàng hổ phách `--amber`.
    - Thông điệp chuyên môn rõ ràng: "Khay tiếp nhận của bàn này hiện đã trống · Ca làm việc đã được chuyển tiếp tự động sang bước tiếp theo trong quy trình BPMN 2.0". Tuyệt đối không còn bất kỳ khối trắng nào trôi nổi trên bàn làm việc.
  - **Nâng cấp Bàn Ban Giám hiệu (`PrincipalPortalResult.tsx`):**
    - Khung số hiệu quyết định điện tử (`decision-number-plaque`) đóng khung vàng đồng `--seal-gold` sang trọng.
    - 3 thẻ chứng thực đồng bộ To-Be (CSDL Đào tạo, Cổng Một cửa số, Văn thư lưu trữ điện tử) với viền chỉ đứt nét, tích xanh rõ nét.
    - Thêm nút chuyển đổi "Ẩn / Hiện toàn văn Quyết định ban hành" và khung tài liệu trang trọng, không bị cắt xén hay dán đè chắp vá.
  - **Đồng bộ hóa Cổng Sinh viên (`StudentPortalTracker.tsx`):**
    - Chuyển toàn bộ khung thông báo và 5 bước tiến độ thời gian thực sang chất liệu giấy `--paper` và `--paper-dim`, hài hòa 100% với bàn sinh viên.
  - **Sửa lỗi type TS trong `src/store/playback/store.ts`:**
    - Cập nhật giá trị `'valid_medical'` đúng theo union type `CustomEvidencePreset`.
- File chính:
  - `src/styles/portal-result.css` (Style chuyên biệt cho các biên bản hoàn tất ca)
  - `src/main.tsx` (Import `portal-result.css`)
  - `src/ui/desks/DispatchedTray.tsx` (Component khay outbox trên bàn làm việc)
  - `src/ui/desks/advisor/AdvisorPortalResult.tsx` (Bàn Cố vấn học tập)
  - `src/ui/desks/ctsv/CtsvPortalResult.tsx` (Bàn Phòng CTSV)
  - `src/ui/desks/principal/PrincipalPortalResult.tsx` (Bàn Ban Giám hiệu)
  - `src/ui/desks/student/StudentPortalTracker.tsx` (Cổng Sinh viên)
  - `src/store/playback/store.ts` (Sửa lỗi gõ preset)
- ASSUMPTION:
  - Tất cả màu sắc và hiệu ứng tuân thủ nghiêm ngặt design token của dự án (`--paper`, `--paper-dim`, `--ink`, `--desk-900`, `--amber`, `--seal-gold`), đảm bảo không có mã màu trắng lệch tone nào.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (151/151 tests trong 28 test suites).
  - `npm run build`: PASS (Vite production build hoàn tất sạch sẽ, không có lỗi TS).

---

## 2026-10-29 · Phân biệt rạch ròi Chế độ Demo Toàn diện vs Chế độ Đăng nhập Phân vai nghiệp vụ
- Đã làm:
  - **Tách bạch 2 chế độ vận hành độc lập (`sessionMode: 'demo' | 'portal'`):**
    - **Chế độ Demo bình thường:** Dành cho việc thuyết trình tổng quan đồ án quy trình BPMN 2.0. Giữ nguyên 5 bàn làm việc (SV, HT, CV, CTSV, BGH), thanh điều khiển Play/Step/Director, tốc độ 1x/2x, nút As-Is 22 ngày, công tắc AI, nút Reset ca, CaptionCard hiển thị tác vụ BPMN, MiniMap góc màn hình và popup Báo cáo cuối ca (CaseReport) tổng kết tự động hóa 62.5%.
    - **Chế độ Đăng nhập (Portal phân vai nghiệp vụ thực tế):** Dành cho Cán bộ / Giảng viên / Sinh viên tác nghiệp thực tế trên Hệ thống Một Cửa Số. Loại bỏ toàn bộ các công cụ điều khiển kỹ thuật mô phỏng không liên quan.
  - **Khắc phục triệt để lỗi popup Báo cáo cuối ca (CaseReport) đè lên Bàn Giám hiệu khi ký số xong:**
    - Cập nhật `App.tsx`: Chặn tuyệt đối `CaseReport` khi đang ở chế độ đăng nhập (`sessionMode === 'portal'`), giải quyết dứt điểm phản ánh của người dùng.
    - Ẩn hoàn toàn `CaptionCard` (thanh ID tác vụ BPMN T1...T11) và `MiniMap` khi ở chế độ đăng nhập để bàn làm việc rộng rãi, sạch sẽ.
  - **Tối ưu hóa Header (HUD) công vụ chuẩn cơ quan Một cửa số:**
    - Thay thế toàn bộ thanh điều khiển demo bằng Header Một cửa số chính quy: Logo ĐH Kinh tế – ĐH Đà Nẵng, Mã hồ sơ thụ lý, Thẻ dữ liệu giả lập, Hộp định danh cán bộ/sinh viên trang trọng (Avatar, Tên, Chức vụ, Đơn vị công tác), Nút Đăng xuất nổi bật.
  - **Xây dựng giao diện kết quả đúng chức năng chuyên môn của từng người:**
    1. **Bàn Cố vấn học tập (`AdvisorPortalResult.tsx`):**
       - Hiển thị thông báo xác nhận nguyện vọng bảo lưu thành công, thông tin sinh viên, tình trạng chuyển tiếp tự động lên Phòng CTSV để thẩm định minh chứng tiếp theo.
       - Nút xem lại hồ sơ đã đóng dấu, nút chuyển nhanh sang tài khoản CTSV (ThS. Nguyễn Thị Mai), nút Đăng xuất.
    2. **Bàn Phòng Công tác Sinh viên (`CtsvPortalResult.tsx`):**
       - Hiển thị kết luận thẩm định minh chứng hợp lệ, thông tin sinh viên, tình trạng chuyển tiếp tự động lên Ban Giám hiệu để ký số.
       - Nút xem lại minh chứng & kết quả thẩm định, nút chuyển nhanh sang Ban Giám hiệu (PGS.TS. Trần Đình Khôi), nút Đăng xuất.
    3. **Bàn Ban Giám hiệu (`PrincipalPortalResult.tsx`):**
       - Hiển thị trang trọng Quyết định đã ký số chính thức kèm con dấu đỏ ĐH Kinh tế, chữ ký số điện tử và tem niêm phong PKI.
       - Báo cáo kết quả đồng bộ tự động liên thông (Cập nhật CSDL Đào tạo sang "Nghỉ học tạm thời", gửi thông báo một cửa tới sinh viên, lưu chiểu công văn điện tử).
       - Nút In/Tải Quyết định (PDF), nút chuyển sang Cổng Sinh viên để kiểm tra kết quả tiếp nhận, nút Đăng xuất.
    4. **Cổng Sinh viên (`StudentPortalTracker.tsx`):**
       - Hiển thị bảng theo dõi tiến độ hồ sơ 5 bước thời gian thực (Nộp đơn -> Cố vấn xác nhận -> CTSV thẩm định -> BGH ký số -> Nhận kết quả).
       - Khi hoàn tất, hiển thị thông báo phê duyệt thành công kèm toàn văn Quyết định bảo lưu chính thức.
  - **Bổ sung Integration Tests:** Mở rộng `src/store/authWorkflow.test.ts` kiểm thử toàn bộ chu trình phân biệt mode và chặn popup CaseReport.
- File chính:
  - `src/store/useApp.ts`
  - `src/store/useAuth.ts`
  - `src/App.tsx`
  - `src/ui/shell/Hud.tsx`
  - `src/ui/scenes/Title.tsx`
  - `src/ui/desks/AdvisorDesk.tsx` & `src/ui/desks/advisor/AdvisorPortalResult.tsx`
  - `src/ui/desks/CtsvDesk.tsx` & `src/ui/desks/ctsv/CtsvPortalResult.tsx`
  - `src/ui/desks/PrincipalDesk.tsx` & `src/ui/desks/principal/PrincipalPortalResult.tsx`
  - `src/ui/desks/StudentDesk.tsx` & `src/ui/desks/student/StudentPortalTracker.tsx`
  - `src/store/authWorkflow.test.ts`
- ASSUMPTION:
  - Cung cấp sẵn các nút chuyển tiếp tài khoản giữa các bước (Cố vấn -> CTSV -> BGH -> Sinh viên) ngay trong màn hình kết quả công vụ để phục vụ buổi thuyết trình liền mạch và thuận tiện nhất.
- Nợ / việc dở:
  - Không có.
  - Đã chạy: `npm test` (151/151 tests pass) · `npm run build` (pass).

## 2026-10-29 · Tối ưu thanh Header (HUD) gọn gàng & chống tràn/cắt khi đăng nhập tài khoản
- Đã làm:
  - **Khắc phục triệt để lỗi Header bị cắt góc phải khi đăng nhập:** Khi người dùng đăng nhập tài khoản (Sinh viên hoặc Cán bộ), khối tên người dùng chiếm thêm chiều ngang khiến toàn bộ thanh điều khiển bên phải (Director, Tốc độ, As-Is, Cài đặt, Trợ giúp, Âm thanh, AI MOCK, RESET) bị tràn và khuất khỏi màn hình ở các độ phân giải laptop phổ biến (1280px, 1366px, 1440px, 1536px).
  - **Tối ưu hóa hiển thị RoleTabs khi đăng nhập (`is-locked` / `role-tab-locked`):**
    - Các bàn bị khóa quyền truy cập (`!allowed`) tự động chuyển sang hiển thị nhãn ngắn (`shortLabel`: `[🔒 HT]`, `[🔒 CV]`, `[🔒 CTSV]`, `[🔒 BGH]`), tiết kiệm ngay ~180px chiều ngang.
    - Bàn hợp lệ của tài khoản nổi bật với đầy đủ chức danh và phong cách hồ sơ lưu trữ.
  - **Thiết kế lại khối User Badge & Logout:**
    - Cấu trúc lại khối tài khoản với class `.hud-user-badge`, giới hạn độ rộng `max-width` và cắt chữ `ellipsis` an toàn, hiển thị đầy đủ thông tin (Họ tên, Lớp/Chức vụ) qua `title` tooltip.
    - Nút Đăng xuất (`.hud-logout-btn`) có padding tinh gọn, tự động co lại thành icon cửa thoát `🚪` trên màn hình hẹp/trung bình.
  - **Tối ưu toàn diện Header với modifier `.hud-authenticated`:**
    - Tự động rút gọn Logo từ "BẢO LƯU, PLEASE" sang "BẢO LƯU" trên màn hình <= 1550px khi đăng nhập.
    - Ẩn tiền tố "MÃ CA: " chuyển thành "CA: " hoặc mã số gọn; co bớt padding của các nút chế độ (Play/Step/Director), As-Is, AI Badge và RESET.
    - Thiết lập `.hud-right { flex-shrink: 0; margin-left: auto; }` và `.hud-left { flex-shrink: 1; min-width: 0; }` đảm bảo nhóm nút chức năng bên phải không bao giờ bị cắt mất hoặc tràn viền.
  - **Bổ sung Unit Test:** Thêm test xác thực quyền hạn và nhãn ngắn role tab trong `src/store/authWorkflow.test.ts`.
- File chính:
  - `src/ui/shell/Hud.tsx`
  - `src/ui/shell/RoleTabs.tsx`
  - `src/styles/base.css`
  - `src/store/authWorkflow.test.ts`
- ASSUMPTION:
  - Giữ nguyên các chức năng phím tắt và nhãn "GIẢ LẬP" bắt buộc theo quy định của dự án.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (150/150 tests trong 28 test suites).
  - `npm run build`: PASS (TypeScript + Vite build thành công).

---

## 2026-10-29 · Tối giản & Chuẩn hóa Form Đăng nhập theo đúng phong cách Theme
- Đã làm:
  - **Tối giản bố cục:** Loại bỏ toàn bộ các thẻ card kịch bản/dữ liệu mẫu cồng kềnh, đưa giao diện về đúng chuẩn một Form Đăng nhập (Login Box) trung tâm, gọn gàng (max-width: 460px), cân đối để nộp bài thuyết trình.
  - **Chuẩn hóa màu sắc 100% cùng theme:** Xóa bỏ hoàn toàn màu trắng tinh `#ffffff`. Sử dụng màu giấy `#dfd8c2` cho ô nhập liệu input và dropdown, viền mực `#b9b093`, chữ `#1d1d19`, header `#23231d` viền hổ phách `#d9a441`.
  - **Thiết kế 2 Tab phân vai rõ ràng, không bị mờ:** Dùng Segmented Control nằm trên nền `#dfd8c2`:
    - Tab được chọn: Nền `#23231d`, chữ vàng hổ phách `#d9a441`, viền nổi bật.
    - Tab chưa chọn: Nền trong suốt, chữ màu mực đen `#1d1d19`, nhìn rõ 100% (visible), không bị mờ hay tàng hình.
  - **Hỗ trợ chọn nhanh tài khoản gọn gàng 1 dòng:** Thay thế các card chiếm diện tích bằng một dropdown `<select>` tinh tế đặt dưới nút đăng nhập, tự động điền MSSV hoặc tên cán bộ khi cần demo nhanh cho giảng viên.
- File chính:
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/data/loginPresets.ts`
  - `src/ui/scenes/login/loginPresets.test.ts`
- Đã chạy:
  - `npm test`: PASS (150/150 tests).
  - `npm run build`: PASS (Vite production build thành công trong 2.31s).

---

## 2026-10-29 · Nâng cấp toàn diện UI/UX Cổng Đăng nhập & Sửa lỗi hiển thị Tab bị mờ
- Đã làm:
  - **Khắc phục triệt để lỗi Tab bị mờ/tàng hình:** Sửa nguyên nhân do tab inactive dùng màu chữ kem sáng trên nền giấy sáng khi không được chọn. Thiết kế lại thanh chuyển đổi tab thành dạng **Dual Tab Switcher** phong cách hồ sơ lưu trữ:
    - Tab Active: Liền mạch với thân giấy `var(--paper)`, có viền trên hổ phách `3px solid var(--amber)`, chữ mực đen đậm `var(--ink)`, badge "● ĐANG CHỌN".
    - Tab Inactive: Nền sẫm màu công sở `var(--desk-700)`, chữ kem sáng `#f0ebd8` (độ tương phản > 7:1 đạt chuẩn WCAG AA), icon và chú thích hiển thị rõ nét 100%, có badge "Chuyển sang ➜" và hover phản hồi trực quan.
  - **Tách module giao diện chuẩn kiến trúc (< 300 dòng/file):**
    - `LoginPortal.tsx`: Khung bìa hồ sơ công sở retro, Header cơ quan (ĐH Kinh tế - ĐH Đà Nẵng, dấu đỏ mộc son "DỮ LIỆU GIẢ LẬP"), thanh Dual Tab và Footer.
    - `StudentLoginTab.tsx`: Form đăng nhập MSSV/Mật khẩu cùng danh sách **5 Hồ sơ sinh viên mẫu gắn liền với 5 kịch bản BPMN** (S1 Happy path, S2 Quên minh chứng, S3 Nợ học phí, S4 Quá hạn SLA, S5 Minh chứng giả). Khi nhấp chọn sinh viên mẫu, hệ thống tự động gán đúng kịch bản `scenarioId` tương ứng.
    - `OfficerLoginTab.tsx`: Thiết kế dạng **Thẻ công vụ phân quyền theo 3 Lane BPMN** (Lane L2 Cố vấn học tập, Lane L3 Thẩm tra CTSV, Lane L4 Ký số Ban Giám hiệu), hiển thị rõ bước nghiệp vụ phụ trách (T4, T5-T8, T9) kèm nút "Duyệt đơn ➔" đăng nhập trực tiếp.
  - **Bổ sung bộ test xác thực:** Viết `src/ui/scenes/login/loginPresets.test.ts` kiểm thử toàn bộ 5 preset sinh viên và 3 preset cán bộ liên kết chuẩn xác với CSDL và BPMN engine.
- File chính:
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/ui/scenes/login/StudentLoginTab.tsx`
  - `src/ui/scenes/login/OfficerLoginTab.tsx`
  - `src/ui/scenes/login/loginPresets.test.ts`
- ASSUMPTION:
  - Khi sinh viên chọn nhanh hồ sơ mẫu S1–S5, hệ thống tự động đồng bộ `scenarioId` tương ứng giúp dữ liệu đơn và các bước rẽ nhánh BPMN tại bàn làm việc luôn ăn khớp hoàn toàn với kịch bản được chọn.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (149/149 tests).
  - `npm run build`: PASS (Vite production build thành công).

---

## 2026-10-29 · Khắc phục lỗi bảo lưu dữ liệu nộp đơn & tối ưu giao diện Giảng viên duyệt đơn
- Đã làm:
  - **Bảo lưu dữ liệu tiến trình giữa Sinh viên & Giảng viên:** Khắc phục triệt để lỗi `initScenario` bị gọi lại trong `App.tsx` mỗi khi chuyển màn hình từ Cổng Đăng nhập sang Bàn làm việc (`desk`). Khi Sinh viên nộp đơn xong và đăng xuất, tiến trình nộp đơn và token tại các bước thẩm định (`T4` Cố vấn, `T5` CTSV) được bảo toàn nguyên vẹn trong bộ nhớ.
  - **Tách biệt hoàn toàn giao diện Giảng viên:** Cập nhật `accounts.ts` loại bỏ vai `'student'` khỏi `allowedRoles` của Cán bộ/Giảng viên. Khi Giảng viên (TS. Lê Hoài Nam, ThS. Nguyễn Thị Mai, PGS.TS. Trần Đình Khôi) đăng nhập, hệ thống tự động đưa thẳng vào Bàn duyệt nghiệp vụ (`AdvisorDesk`, `CtsvDesk`, `PrincipalDesk`), khóa 🔒 bàn nộp đơn sinh viên.
  - **Tắt thông báo việc mới cho Sinh viên:** Cập nhật `WorkToast.tsx` chặn toàn bộ thông báo "Có việc mới ở bàn Cố vấn/CTSV" khi đang đăng nhập với tư cách Sinh viên.
  - **Hỗ trợ Giảng viên duyệt nhanh:** Thêm tính năng trong `DeskEmpty.tsx` cho phép tự động nộp hồ sơ sinh viên mẫu (S1) với 1 chạm để Giảng viên có thể trải nghiệm đóng dấu duyệt ngay lập tức mà không cần chuyển sang Cổng Sinh viên nộp trước.
  - Viết bộ integration test `src/store/authWorkflow.test.ts` kiểm thử toàn bộ chu trình: Sinh viên nộp đơn -> Đăng xuất -> Giảng viên đăng nhập -> Thấy hồ sơ chờ duyệt -> Đóng dấu duyệt T4 thành công.
- File chính:
  - `src/App.tsx`
  - `src/data/accounts.ts`
  - `src/store/useAuth.ts`
  - `src/ui/shell/WorkToast.tsx`
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/ui/desks/DeskEmpty.tsx`
  - `src/store/authWorkflow.test.ts`
- ASSUMPTION:
  - Giữ nguyên trạng thái ca làm việc khi chuyển đổi tài khoản giữa Sinh viên và Giảng viên, chỉ reset khi người dùng chủ động bấm RESET trên HUD hoặc chọn kịch bản mới ở ScenarioPicker.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (146/146 tests).
  - `npm run build`: PASS (Vite production build thành công trong 2.27s).

---

## 2026-10-29 · Tích hợp 2 Cổng Đăng nhập (Sinh viên & Cán bộ duyệt đơn) trên Localhost
- Đã làm:
  - Thiết kế và triển khai Cổng xác thực phân quyền 100% offline trên localhost (`useAuth.ts` + `accounts.ts`).
  - Xây dựng màn hình Cổng Đăng nhập (`LoginPortal.tsx`) chuẩn phong cách retro bàn giấy công sở, gồm 2 tab:
    1. **Cổng Sinh viên:** Đăng nhập bằng MSSV (hoặc chọn nhanh SV mẫu Nguyễn Minh Khoa, Trần Thu Hà...) để vào Bàn Sinh viên nộp hồ sơ, đính kèm minh chứng và theo dõi tiến độ.
    2. **Cổng Cán bộ / Giáo viên:** Đăng nhập tài khoản Cố vấn học tập (TS. Lê Hoài Nam), Chuyên viên CTSV (ThS. Nguyễn Thị Mai), Ban Giám hiệu (PGS.TS. Trần Đình Khôi) để vào thẩm tra và đóng dấu/ký số phê duyệt.
  - Phân quyền theo vai trò: Khi sinh viên đăng nhập, các bàn duyệt của cán bộ sẽ hiển thị biểu tượng khóa 🔒 và ngăn truy cập trái phép.
  - Tích hợp vào HUD: Hiển thị badge tài khoản người dùng và nút "Đăng xuất" (Logout) một chạm để quay về Cổng Đăng nhập.
  - Bổ sung nút "CỔNG ĐĂNG NHẬP PHÂN VAI" trên màn hình Tiêu đề (`Title.tsx`).
  - Viết bộ unit test `src/store/useAuth.test.ts`.
- File chính:
  - `src/data/accounts.ts`
  - `src/store/useAuth.ts`, `src/store/useAuth.test.ts`
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/App.tsx`, `src/store/useApp.ts`
  - `src/ui/scenes/Title.tsx`
  - `src/ui/shell/Hud.tsx`, `src/ui/shell/RoleTabs.tsx`
- ASSUMPTION:
  - Lưu phiên đăng nhập vào `localStorage` của trình duyệt trên localhost để giữ trạng thái khi tải lại trang, đồng thời cung cấp sẵn nút chọn nhanh tài khoản mẫu phục vụ việc thuyết trình thuận tiện.
- Nợ / việc dở:
  - Không có.
- Đã chạy:
  - `npm test`: PASS (145/145 tests).
  - `npm run build`: PASS (Vite production build thành công trong 2.85s).

---

## 2026-10-29 · Hoàn tác giao diện màn hình Tiêu đề về bản gốc
- Đã làm:
  - Hoàn tác toàn bộ các thay đổi trên màn hình Tiêu đề (`Title.tsx`) về phiên bản gốc tinh gọn theo yêu cầu của người dùng.
  - Xóa bỏ các component phụ thử nghiệm và stylesheet `m8-title.css`.
- File chính:
  - `src/ui/scenes/Title.tsx`
  - `src/main.tsx`
- Đã chạy:
  - `npm test`: PASS (141/141 tests).
  - `npm run build`: PASS (Vite production build thành công).

---

## 2026-10-30 · Sửa lỗi hiển thị sai tiến trình và văn bản khi hồ sơ bị Cố vấn từ chối
- Đã làm:
  - **Khắc phục triệt để lỗi logic đánh giá trạng thái Cố vấn từ chối (`advisorDecision === 'declined'`):**
    - Sửa lỗi trong `StudentPortalTracker.tsx`: trước đó `Boolean(regCase?.advisorDecision)` được gán thành `t4Done`, dẫn đến bước 2 (Cố vấn) hiển thị nhầm thành `✓ Đã duyệt` màu xanh ngay cả khi Cố vấn đã đóng dấu "KHÔNG XÁC NHẬN".
    - Sửa lỗi phân loại: `regCase?.advisorDecision === 'declined'` trước đó bị nhầm thành `isReturned` ("Trả hồ sơ" / Phiếu hướng dẫn bổ sung hồ sơ) thay vì `isRejected` ("Từ chối").
    - Cập nhật 5 bước tiến độ khi Cố vấn từ chối:
      - Bước 1 (Sinh viên): `✓ Ngày 0`
      - Bước 2 (Cố vấn học tập): `✗ Từ chối` (icon ✗ đỏ)
      - Bước 3 (Phòng CTSV): `3 Đã dừng` (icon 3 xám, không chạy vào "Đang thẩm định")
      - Bước 4 (Ban Giám hiệu): `4 Đã dừng` (icon 4 xám)
      - Bước 5 (Kết quả Một cửa): `✗ Từ chối` (icon ✗ đỏ)
  - **Chuẩn hóa văn bản kết quả hiển thị cho sinh viên:**
    - Thay thế "PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ" và con dấu "TRẢ HỒ SƠ" thành đúng "THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ" và con dấu "TỪ CHỐI".
    - Hiển thị rõ lý do Cố vấn không xác nhận nguyện vọng bảo lưu (kèm ghi chú của Cố vấn nếu có), ký tên chức danh Cố vấn học tập / Khoa thay vì Cán bộ tiếp nhận Một cửa.
  - **Đồng bộ hóa luồng nghiệp vụ trên các bàn cán bộ:**
    - Cập nhật `caseRegistry.ts`: khi `updateCaseAdvisorDecision(id, 'declined')` được gọi, trạng thái ca cập nhật chính xác là `'rejected'`.
    - Cập nhật `CtsvDesk.tsx`: ưu tiên lọc hồ sơ Cố vấn đã duyệt (`c.advisorDecision === 'confirmed'`); nếu chọn hồ sơ đã bị Cố vấn từ chối, hiển thị cảnh báo hồ sơ đã dừng và vô hiệu hóa thẩm định.
    - Cập nhật `PrincipalDesk.tsx`: hiển thị tag "✗ ĐÃ TỪ CHỐI" cho hồ sơ bị từ chối ở bước trước và thông báo không đủ điều kiện trình ký BGH.
    - Cập nhật `AdvisorPortalResult.tsx`: phản ánh đúng trạng thái khi Cố vấn từ chối (bước tiếp theo là Từ chối T7/MF3, không chuyển CTSV).
  - Viết unit test xác thực `src/ui/desks/student/studentPortalTracker.test.tsx`.
- File chính:
  - `src/ui/desks/student/StudentPortalTracker.tsx`
  - `src/data/caseRegistry.ts`
  - `src/ui/desks/CtsvDesk.tsx`
  - `src/ui/desks/PrincipalDesk.tsx`
  - `src/ui/desks/advisor/AdvisorPortalResult.tsx`
  - `src/ui/desks/student/studentPortalTracker.test.tsx`
- Đã chạy:
  - `npm test`: PASS (207/207 tests).
  - `npm run build`: PASS (Vite production build thành công trong 2.71s).
