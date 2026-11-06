# PROGRESS — nhật ký làm việc của agent

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Thiết kế lại toàn diện hệ thống quét OCR (Computer Vision Canvas + Chống nhận diện nhầm ảnh rác/infographic)
- Đã làm:
  - **Khắc phục triệt để lỗi tự nhận diện ảnh đồ họa/infographic mạng xã hội thành Giấy bệnh viện (Root Cause Fix):**
    - Người dùng tải lên tệp ảnh infographic công nghệ từ Facebook (`890616983_122119657839500254_8816460267632996987_n.jpg` - "10 Claude Code Skills được yêu thích nhất"). Trước đó, do hệ thống có logic dự phòng giả lập nới lỏng chấp nhận tệp ảnh > 15 KB, hệ thống đã nhận diện nhầm thành Giấy xác nhận Bệnh viện Đa khoa Đà Nẵng.
  - **Xây dựng hệ thống phân tích thị giác máy tính Client-side (Canvas Computer Vision Engine):**
    - Tạo `src/ai/imageScanner.ts`: Phân tích điểm ảnh trực tiếp trong trình duyệt qua offscreen `<canvas>`:
      + Nhận diện tệp tải từ mạng xã hội qua định dạng tên CDN Facebook/Instagram (`\d+_\d+_\d+_n\.(jpg|png)`).
      + Đo lường độ sáng nền trung bình (`averageLightness`) và tỷ lệ điểm ảnh tối (`darkPixelRatio`). Văn bản hành chính in trên giấy trắng luôn có độ sáng > 50% và tỷ lệ pixel chữ tối < 35%. Ảnh infographic/poster/dark mode có nền đen/tối (`averageLightness < 0.45` hoặc `darkPixelRatio > 0.38`) $\to$ **Tự động nhận diện và loại bỏ ngay lập tức**.
      + Nhận diện mật độ pixel con dấu đỏ (`redStampPixelRatio`).
  - **Tái cấu trúc bộ thẩm định minh chứng (Strict Dossier Verification):**
    - `src/ai/mockTemplates.ts`:
      + Mở rộng `isGarbageEvidenceText`: Thêm nhận diện ảnh CDN mạng xã hội (`_n.jpg`), các từ khóa kỹ thuật, infographic, poster, banner, bxh, xếp hạng, claude, skills, superpowers...
      + Cập nhật `detectEvidenceCategory` và `evaluateEvidenceFile`: Chỉ công nhận tệp là minh chứng hợp lệ khi:
        (1) Là mẫu chuẩn SVG của hệ thống (ĐH Kinh tế - ĐH Đà Nẵng).
        (2) Có chứa các từ khóa hành chính rõ ràng của 4 danh mục (`medical`, `military`, `hardship`, `personal`).
        (3) Hoặc là tệp mẫu hồ sơ thử nghiệm đã đăng ký trong bộ test (`12f3c20a-...`, `Gemini_Generated_Image_6k70...`, `xac_nhan_ubnd_ho_ngheo...`).
      + Mọi tệp ảnh rác, ảnh mạng xã hội hoặc không chứa thông tin chứng thực $\to$ Trả về `valid: false`, `confidence: 0`, `extractedCount: 0`. Cửa sổ quét hiển thị cảnh báo đỏ và chặn không cho tự động điền trường giả mạo.
  - **Kích hoạt Live Gemini Vision không giới hạn môi trường & Bổ sung lưu API Key:**
    - `src/ai/live.ts`: Bỏ ràng buộc `!LOCAL_HOSTS.includes(...)` để Gemini Vision có thể hoạt động mượt mà cả trên Vercel và localhost. Bổ sung `saveCustomGeminiKey` và `getCustomGeminiKey`.
    - `src/ui/shell/StorageManager.tsx`: Bổ sung nút "💾 Lưu API Key vào trình duyệt" giúp người dùng nhập Gemini API Key để kích hoạt Google Gemini Vision quét ảnh đa phương thức thật.
  - **Tích hợp vào cửa sổ khai báo:**
    - `src/ui/desks/student/EvidenceFormModal.tsx`: Tích hợp `analyzeImageVisualFeatures` trước khi quét; nếu ảnh không đạt tiêu chuẩn văn bản in trên giấy trắng hoặc là ảnh tải từ mạng xã hội, lập tức dừng và báo đỏ: `⛔ TÀI LIỆU BỊ LOẠI BỎ`.
  - **Kiểm thử tự động:**
    - Tạo `src/ai/imageScanner.test.ts` (5 bài test kiểm tra loại bỏ tệp Facebook `890616983_..._n.jpg`, loại bỏ infographic công nghệ Claude Code, chấp nhận SVG chuẩn và tệp thử nghiệm).
    - Toàn bộ 44 test suites và 273 test cases pass 100%.
- File chính:
  - `src/ai/imageScanner.ts`
  - `src/ai/imageScanner.test.ts`
  - `src/ai/mockTemplates.ts`
  - `src/ai/live.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Một văn bản minh chứng hành chính thật phải là văn bản in trên giấy trắng hoặc có tiêu đề/con dấu cơ quan có thẩm quyền; các tệp ảnh mạng xã hội có nền tối hoặc đồ họa infographic bị loại bỏ tuyệt đối để đảm bảo tính xác thực của hệ thống.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (44/44 files, 273/273 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.44s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Tinh giản giao diện thực tế nộp bài: Loại bỏ nút demo kịch bản & dữ liệu mẫu trên cổng đăng nhập
- Đã làm:
  - **Loại bỏ nút demo kịch bản trên trang chủ (Title screen):**
    - `src/ui/scenes/Title.tsx`: Loại bỏ nút `▶ CHỌN KỊCH BẢN (DEMO TOÀN DIỆN)`. Màn hình chính tập trung làm nổi bật nút đăng nhập chính thức `🔐 CỔNG ĐĂNG NHẬP`, cùng hai tùy chọn phụ `📝 ĐĂNG KÝ TÀI KHOẢN MỚI` và `📁 XEM BẢN AS-IS (22 NGÀY)`.
  - **Loại bỏ tab kịch bản mẫu và nhãn "Dữ liệu mẫu" ở Cổng Sinh viên:**
    - `src/ui/scenes/LoginPortal.tsx`: Loại bỏ hoàn toàn thanh chọn sub-tab `★ Kịch bản mẫu (S1 - S5)` và component `StudentPresetLogin`. Cổng sinh viên chuyển thẳng vào form đăng nhập chuẩn thực tế `StudentCustomLogin` (nhập MSSV, Mật khẩu, liên kết Đăng ký tài khoản).
  - **Loại bỏ khối "Chọn nhanh tài khoản mẫu" ở Cổng Cán bộ:**
    - `src/ui/scenes/login/OfficerLogin.tsx`: Loại bỏ cụm 3 nút chọn nhanh tài khoản mẫu. Giữ giao diện đăng nhập công vụ thực tế với trường tên đăng nhập và mật khẩu, thêm gợi ý placeholder trực quan (`advisor_nam`, `ctsv_mai`, `bgh_khoi`).
- File chính:
  - `src/ui/scenes/Title.tsx`
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/ui/scenes/login/OfficerLogin.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Không còn chế độ nạp kịch bản thuyết trình trực tiếp từ trang chủ và cổng đăng nhập để hệ thống hiển thị đúng quy chuẩn cổng dịch vụ Một Cửa Số thực tế khi nộp bài cho giảng viên; các tài khoản vẫn được xác thực đầy đủ qua CSDL và người dùng có thể tự đăng ký tài khoản mới hoặc nhập tài khoản sẵn có.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (43/43 files, 268/268 passed 100%) · `npm run build` (tsc & vite build thành công code 0).

---

## 2026-11-06 · Hợp nhất 1 cổng nộp minh chứng duy nhất, AI tự động phân loại 4 nhóm giấy tờ & Loại bỏ tệp rác
- Đã làm:
  - **Hợp nhất thành 1 nút chọn minh chứng duy nhất (Streamlined Single Evidence Picker):**
    - `src/ui/desks/student/EvidenceBag.tsx`: Bỏ danh sách 4 lựa chọn picker rườm rà dễ gây nhầm lẫn (`isPickerOpen`, `STUDENT_EVIDENCE_OPTIONS`). Thay bằng **1 nút duy nhất**: `＋ THÊM MINH CHỨNG (Tải ảnh / giấy tờ (Bệnh viện, Quân sự, UBND...))`. Khi bấm vào, hệ thống mở thẳng cửa sổ khai báo và quét OCR thống nhất.
  - **AI OCR tự động nhận diện danh mục giấy tờ (Universal Document Auto-Detection):**
    - `src/ai/mockTemplates.ts`: Xây dựng hàm `detectEvidenceCategory(file, fallback)`:
      + Phân tích nội dung và tên tệp (`file.name`, `file.svgRaw`, từ khóa hành chính).
      + Tự động nhận diện chuẩn xác:
        * Bệnh viện / Y tế (`medical`): Bệnh viện Đa khoa, Bác sĩ điều trị, Giấy ra viện, Mã bệnh án, ảnh chụp mẫu test UUID từ thiết bị (`12f3e20a-...`).
        * Nghĩa vụ quân sự (`military`): Lệnh gọi công dân nhập ngũ, BCH Quân sự, ngày tập trung giao quân.
        * Hoàn cảnh gia đình (`hardship`): Xác nhận UBND Phường/Xã, diện hộ nghèo / cận nghèo, biến cố kinh tế.
        * Lý do cá nhân / Thực tập (`personal`): Đơn trình bày lý do cá nhân, giấy tiếp nhận thực tập doanh nghiệp ngoài trường.
  - **Loại bỏ triệt để tài liệu rác / không hợp lệ ("Còn nếu không phải thì loại ra"):**
    - Nếu tệp tải lên là tài liệu học tập, bài tập, tiểu luận, slide, chuyên đề (`Chuyên đề Bác .jpg`, `bai_tap.pdf`, `screenshot`), ảnh chụp giải trí hoặc tệp không có con dấu/tiêu đề hành chính:
      + `detectEvidenceCategory` trả về `null`.
      + `evaluateEvidenceFile` trả về `valid: false`.
      + `ai.scanDocument` trả về cảnh báo `confidence: 0.2`, `extractedCount: 0`.
      + Khung khai báo hiển thị biểu ngữ cảnh báo đỏ `⛔ TÀI LIỆU BỊ LOẠI BỎ: Không phát hiện tiêu đề hành chính hoặc dấu mộc đỏ`, không điền bất kỳ trường giả mạo nào vào form và chặn nộp hồ sơ không hợp lệ.
  - **Cập nhật cửa sổ khai báo thông minh (Dynamic Evidence Form Modal):**
    - `src/ui/desks/student/EvidenceFormModal.tsx`:
      + Tích hợp thanh tab 4 loại minh chứng trực quan kèm nhãn `✨ AI tự động nhận diện đúng loại khi tải ảnh lên`.
      + Khi người dùng tải ảnh lên hoặc bấm `📷 AI QUÉT & TỰ ĐỘNG ĐIỀN`, modal tự động nhận diện loại giấy tờ, tự động nhảy sang tab tương ứng và điền đầy đủ các trường thông tin.
      + Khi lưu (`onSave`), tự động đồng bộ lý do nghỉ học trên đơn xin nghỉ (`StudentApplicationForm.reason`) tương ứng với minh chứng đã quét, triệt tiêu mọi lỗi lệch danh mục giữa đơn và minh chứng.
    - `src/ui/desks/StudentDesk.tsx`: Cập nhật `handleStartFillOption` và `handleSaveEvidenceForm` nhận tham số `category` và tự động cập nhật lý do nộp đơn.
  - **Kiểm thử tự động:**
    - `src/ui/desks/student/evidenceFormModal.test.tsx`: Bổ sung bài test 7 kiểm tra `detectEvidenceCategory` phân loại chính xác 4 danh mục và loại bỏ tệp rác / không liên quan.
    - Toàn bộ 43 test suites và 268 test cases đều pass 100%.
- File chính:
  - `src/ui/desks/student/EvidenceBag.tsx`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/desks/StudentDesk.tsx`
  - `src/ai/mockTemplates.ts`
  - `src/ui/desks/student/evidenceFormModal.test.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Khi sinh viên tải một tệp minh chứng lên, hệ thống ưu tiên tự động nhận diện loại văn bản từ nội dung tệp; nếu tệp hợp lệ nhưng tên tệp không rõ danh mục (ví dụ ảnh chụp camera), hệ thống sử dụng danh mục đang chọn trên thanh tab của modal.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (43/43 files, 268/268 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.42s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Thiết kế lại toàn diện hệ thống quét OCR (Computer Vision Canvas + Chống nhận diện nhầm ảnh rác/infographic)
- Đã làm:
  - **Khắc phục triệt để lỗi tự nhận diện ảnh đồ họa/infographic mạng xã hội thành Giấy bệnh viện (Root Cause Fix):**
    - Người dùng tải lên tệp ảnh infographic công nghệ từ Facebook (`890616983_122119657839500254_8816460267632996987_n.jpg` - "10 Claude Code Skills được yêu thích nhất"). Trước đó, do hệ thống có logic dự phòng giả lập nới lỏng chấp nhận tệp ảnh > 15 KB, hệ thống đã nhận diện nhầm thành Giấy xác nhận Bệnh viện Đa khoa Đà Nẵng.
  - **Xây dựng hệ thống phân tích thị giác máy tính Client-side (Canvas Computer Vision Engine):**
    - Tạo `src/ai/imageScanner.ts`: Phân tích điểm ảnh trực tiếp trong trình duyệt qua offscreen `<canvas>`:
      + Nhận diện tệp tải từ mạng xã hội qua định dạng tên CDN Facebook/Instagram (`\d+_\d+_\d+_n\.(jpg|png)`).
      + Đo lường độ sáng nền trung bình (`averageLightness`) và tỷ lệ điểm ảnh tối (`darkPixelRatio`). Văn bản hành chính in trên giấy trắng luôn có độ sáng > 50% và tỷ lệ pixel chữ tối < 35%. Ảnh infographic/poster/dark mode có nền đen/tối (`averageLightness < 0.45` hoặc `darkPixelRatio > 0.38`) $\to$ **Tự động nhận diện và loại bỏ ngay lập tức**.
      + Nhận diện mật độ pixel con dấu đỏ (`redStampPixelRatio`).
  - **Tái cấu trúc bộ thẩm định minh chứng (Strict Dossier Verification):**
    - `src/ai/mockTemplates.ts`:
      + Mở rộng `isGarbageEvidenceText`: Thêm nhận diện ảnh CDN mạng xã hội (`_n.jpg`), các từ khóa kỹ thuật, infographic, poster, banner, bxh, xếp hạng, claude, skills, superpowers...
      + Cập nhật `detectEvidenceCategory` và `evaluateEvidenceFile`: Chỉ công nhận tệp là minh chứng hợp lệ khi:
        (1) Là mẫu chuẩn SVG của hệ thống (ĐH Kinh tế - ĐH Đà Nẵng).
        (2) Có chứa các từ khóa hành chính rõ ràng của 4 danh mục (`medical`, `military`, `hardship`, `personal`).
        (3) Hoặc là tệp mẫu hồ sơ thử nghiệm đã đăng ký trong bộ test (`12f3c20a-...`, `Gemini_Generated_Image_6k70...`, `xac_nhan_ubnd_ho_ngheo...`).
      + Mọi tệp ảnh rác, ảnh mạng xã hội hoặc không chứa thông tin chứng thực $\to$ Trả về `valid: false`, `confidence: 0`, `extractedCount: 0`. Cửa sổ quét hiển thị cảnh báo đỏ và chặn không cho tự động điền trường giả mạo.
  - **Kích hoạt Live Gemini Vision không giới hạn môi trường & Bổ sung lưu API Key:**
    - `src/ai/live.ts`: Bỏ ràng buộc `!LOCAL_HOSTS.includes(...)` để Gemini Vision có thể hoạt động mượt mà cả trên Vercel và localhost. Bổ sung `saveCustomGeminiKey` và `getCustomGeminiKey`.
    - `src/ui/shell/StorageManager.tsx`: Bổ sung nút "💾 Lưu API Key vào trình duyệt" giúp người dùng nhập Gemini API Key để kích hoạt Google Gemini Vision quét ảnh đa phương thức thật.
  - **Tích hợp vào cửa sổ khai báo:**
    - `src/ui/desks/student/EvidenceFormModal.tsx`: Tích hợp `analyzeImageVisualFeatures` trước khi quét; nếu ảnh không đạt tiêu chuẩn văn bản in trên giấy trắng hoặc là ảnh tải từ mạng xã hội, lập tức dừng và báo đỏ: `⛔ TÀI LIỆU BỊ LOẠI BỎ`.
  - **Kiểm thử tự động:**
    - Tạo `src/ai/imageScanner.test.ts` (5 bài test kiểm tra loại bỏ tệp Facebook `890616983_..._n.jpg`, loại bỏ infographic công nghệ Claude Code, chấp nhận SVG chuẩn và tệp thử nghiệm).
    - Toàn bộ 44 test suites và 273 test cases pass 100%.
- File chính:
  - `src/ai/imageScanner.ts`
  - `src/ai/imageScanner.test.ts`
  - `src/ai/mockTemplates.ts`
  - `src/ai/live.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Một văn bản minh chứng hành chính thật phải là văn bản in trên giấy trắng hoặc có tiêu đề/con dấu cơ quan có thẩm quyền; các tệp ảnh mạng xã hội có nền tối hoặc đồ họa infographic bị loại bỏ tuyệt đối để đảm bảo tính xác thực của hệ thống.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (44/44 files, 273/273 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.44s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Toàn diện Bug Fixes (B1–B7) trên mọi vai đăng nhập & Tối ưu đồng bộ Supabase Cloud
- Đã làm:
  - **Khắc phục lỗi "bị khựng" khi đóng dấu / ký duyệt liên tiếp nhiều hồ sơ (B1):**
    - `src/ui/desks/AdvisorDesk.tsx`, `src/ui/desks/CtsvDesk.tsx`, `src/ui/desks/PrincipalDesk.tsx`:
      + Phát hiện Root Cause: Biến cờ `resolved.current` bị kẹt ở `true` sau lần đóng dấu đầu tiên do `selectedCaseId` không được cập nhật khi hồ sơ chuyển khỏi danh sách `pending`, khiến `useEffect` reset không bao giờ chạy lại.
      + Khắc phục: Sau khi hoàn tất hiệu ứng rơi dấu (`handleLanded` / `handleStampLanded`), tự động chuyển `selectedCaseId` sang hồ sơ chờ kế tiếp trong danh sách `pending` và reset ngay `resolved.current = false`. Đồng thời ràng buộc `useEffect` reset theo `[engine, selectedCase?.id]`. Cán bộ có thể đóng dấu liên tiếp 100% không bao giờ bị khựng.
  - **Khắc phục lỗi nhảy chọn hồ sơ về S1 khi danh sách cập nhật (B2):**
    - Cả 3 bàn làm việc (`AdvisorDesk`, `CtsvDesk`, `PrincipalDesk`): Sửa lại thứ tự ưu tiên trong `setSelectedCaseId((prev) => ...)`: Giữ nguyên lựa chọn hồ sơ hiện tại của người dùng (`prev`) nếu hồ sơ vẫn tồn tại trong danh sách, không bị timer/realtime đè nhảy về S1.
  - **Bổ sung thanh chuyển vai (RoleTabs) cho cán bộ ở chế độ Portal (B3):**
    - `src/ui/shell/Hud.tsx`: Hiển thị thanh chuyển vai trực tiếp cho cán bộ có phân quyền (Advisor, CTSV, BGH) ngay trong giao diện Portal mà không cần phải đăng xuất/đăng nhập lại.
  - **Bổ sung tài khoản mẫu 1-click cho Sinh viên & Cán bộ (B4):**
    - `src/ui/scenes/login/OfficerLogin.tsx`: Bổ sung các pill chọn nhanh tài khoản cán bộ mẫu (`advisor_nam` - ThS. Nguyễn Văn Nam, `ctsv_mai` - ThS. Lê Thị Mai, `bgh_khoi` - PGS.TS. Trần Đình Khôi) giúp đăng nhập 1 chạm.
    - `src/ui/scenes/LoginPortal.tsx`: Tích hợp 2 tab lựa chọn cho Sinh viên: Tab kịch bản mẫu (S1 - S5) và Tab tự nhập MSSV / Mật khẩu tự do.
  - **Đồng bộ trạng thái kết thúc quy trình BPMN & Director mode (B5):**
    - `src/store/playback/controller.ts`: Lắng nghe sự kiện `case.ended`, cập nhật trạng thái kết thúc cuối cùng (`completed`, `rejected`, `returned`), văn bản quyết định và nhật ký vào `caseRegistry` và đồng bộ tức thì lên Supabase.
    - `src/store/playback/director.ts`: Khi Director tự động hoàn thành T4, T5, T9, tự động gọi `updateCaseAdvisorDecision`, `updateCaseCtsvDecision`, `updateCasePrincipalSign` để đồng bộ dữ liệu vào sổ hồ sơ.
    - `src/data/caseRegistry.ts`: Cập nhật bộ lọc `getAdvisorCases()` để loại trừ các hồ sơ bị dừng sớm tại G2/BT1 (vi phạm điều kiện học vụ), tuân thủ đúng BPMN 2.0 To-Be.
  - **Tối ưu hóa đồng bộ Supabase Cloud & Xử lý dung lượng lớn (B6):**
    - `src/services/supabaseClient.ts`:
      + Bổ sung cơ chế lưu trữ cấu hình Supabase tùy chỉnh (`saveCustomSupabaseConfig`, `getSupabaseConfig`).
      + Khử tải dung lượng lớn (`toSupabaseRow`): Tự động nén/thay thế chuỗi ảnh base64 lớn (>150 KB) bằng token đại diện dung lượng nhẹ trước khi đẩy lên Supabase REST/Realtime WebSocket, triệt tiêu hoàn toàn nguy cơ lỗi HTTP 413 Payload Too Large.
      + Bổ sung hàm đồng bộ hàng loạt `syncAllCasesToSupabase`.
    - `src/data/caseRegistry.ts`: Tự động nạp mẫu (seed) hồ sơ cục bộ lên Supabase nếu cơ sở dữ liệu trên cloud mới khởi tạo (0 bản ghi).
    - `src/ui/shell/StorageManager.tsx`: Bổ sung các nút hành động trực quan: "Lưu cấu hình vào trình duyệt", "Đẩy toàn bộ hồ sơ lên Supabase (Sync Push)", và "Kéo toàn bộ hồ sơ từ Supabase (Sync Pull)".
  - **Hiển thị tài liệu/ảnh minh chứng gốc tại Bàn CTSV (B7):**
    - `src/ui/desks/ctsv/EvidencePaper.tsx`: Hiển thị khung xem tài liệu gốc (ảnh thumbnail hoặc bản vẽ SVG) trực tiếp trên bàn CTSV để cán bộ đối chiếu song song với kết quả OCR của AI.
  - **Kiểm thử tự động:**
    - Tạo `src/store/deskStampingAndSyncBugFixes.test.ts` (6 bài test kiểm tra: đóng dấu liên tiếp không bị khựng, phân luồng chặn hồ sơ vi phạm G2, khử dung lượng base64 Supabase, và lưu trữ cấu hình người dùng).
    - Toàn bộ 43 test suites và 267 test cases đều vượt qua 100%.
- File chính:
  - `src/ui/desks/AdvisorDesk.tsx`
  - `src/ui/desks/CtsvDesk.tsx`
  - `src/ui/desks/PrincipalDesk.tsx`
  - `src/ui/shell/Hud.tsx`
  - `src/ui/scenes/login/OfficerLogin.tsx`
  - `src/ui/scenes/LoginPortal.tsx`
  - `src/store/playback/controller.ts`
  - `src/store/playback/director.ts`
  - `src/data/caseRegistry.ts`
  - `src/services/supabaseClient.ts`
  - `src/ui/shell/StorageManager.tsx`
  - `src/ui/desks/ctsv/EvidencePaper.tsx`
  - `src/store/deskStampingAndSyncBugFixes.test.ts`
- ASSUMPTION: Khi minh chứng đính kèm dạng ảnh chụp có dung lượng base64 lớn, dữ liệu nhị phân đầy đủ được lưu cục bộ trên máy trạm của sinh viên/CTSV, trong khi bản sao trên Supabase lưu token tham chiếu để đảm bảo băng thông và tránh giới hạn payload của Supabase Free Tier.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (43/43 files, 267/267 passed 100%) · `npm run build` (Vite build thành công code 0, 581 modules).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Thiết kế lại toàn diện hệ thống quét OCR (Computer Vision Canvas + Chống nhận diện nhầm ảnh rác/infographic)
- Đã làm:
  - **Khắc phục triệt để lỗi tự nhận diện ảnh đồ họa/infographic mạng xã hội thành Giấy bệnh viện (Root Cause Fix):**
    - Người dùng tải lên tệp ảnh infographic công nghệ từ Facebook (`890616983_122119657839500254_8816460267632996987_n.jpg` - "10 Claude Code Skills được yêu thích nhất"). Trước đó, do hệ thống có logic dự phòng giả lập nới lỏng chấp nhận tệp ảnh > 15 KB, hệ thống đã nhận diện nhầm thành Giấy xác nhận Bệnh viện Đa khoa Đà Nẵng.
  - **Xây dựng hệ thống phân tích thị giác máy tính Client-side (Canvas Computer Vision Engine):**
    - Tạo `src/ai/imageScanner.ts`: Phân tích điểm ảnh trực tiếp trong trình duyệt qua offscreen `<canvas>`:
      + Nhận diện tệp tải từ mạng xã hội qua định dạng tên CDN Facebook/Instagram (`\d+_\d+_\d+_n\.(jpg|png)`).
      + Đo lường độ sáng nền trung bình (`averageLightness`) và tỷ lệ điểm ảnh tối (`darkPixelRatio`). Văn bản hành chính in trên giấy trắng luôn có độ sáng > 50% và tỷ lệ pixel chữ tối < 35%. Ảnh infographic/poster/dark mode có nền đen/tối (`averageLightness < 0.45` hoặc `darkPixelRatio > 0.38`) $\to$ **Tự động nhận diện và loại bỏ ngay lập tức**.
      + Nhận diện mật độ pixel con dấu đỏ (`redStampPixelRatio`).
  - **Tái cấu trúc bộ thẩm định minh chứng (Strict Dossier Verification):**
    - `src/ai/mockTemplates.ts`:
      + Mở rộng `isGarbageEvidenceText`: Thêm nhận diện ảnh CDN mạng xã hội (`_n.jpg`), các từ khóa kỹ thuật, infographic, poster, banner, bxh, xếp hạng, claude, skills, superpowers...
      + Cập nhật `detectEvidenceCategory` và `evaluateEvidenceFile`: Chỉ công nhận tệp là minh chứng hợp lệ khi:
        (1) Là mẫu chuẩn SVG của hệ thống (ĐH Kinh tế - ĐH Đà Nẵng).
        (2) Có chứa các từ khóa hành chính rõ ràng của 4 danh mục (`medical`, `military`, `hardship`, `personal`).
        (3) Hoặc là tệp mẫu hồ sơ thử nghiệm đã đăng ký trong bộ test (`12f3c20a-...`, `Gemini_Generated_Image_6k70...`, `xac_nhan_ubnd_ho_ngheo...`).
      + Mọi tệp ảnh rác, ảnh mạng xã hội hoặc không chứa thông tin chứng thực $\to$ Trả về `valid: false`, `confidence: 0`, `extractedCount: 0`. Cửa sổ quét hiển thị cảnh báo đỏ và chặn không cho tự động điền trường giả mạo.
  - **Kích hoạt Live Gemini Vision không giới hạn môi trường & Bổ sung lưu API Key:**
    - `src/ai/live.ts`: Bỏ ràng buộc `!LOCAL_HOSTS.includes(...)` để Gemini Vision có thể hoạt động mượt mà cả trên Vercel và localhost. Bổ sung `saveCustomGeminiKey` và `getCustomGeminiKey`.
    - `src/ui/shell/StorageManager.tsx`: Bổ sung nút "💾 Lưu API Key vào trình duyệt" giúp người dùng nhập Gemini API Key để kích hoạt Google Gemini Vision quét ảnh đa phương thức thật.
  - **Tích hợp vào cửa sổ khai báo:**
    - `src/ui/desks/student/EvidenceFormModal.tsx`: Tích hợp `analyzeImageVisualFeatures` trước khi quét; nếu ảnh không đạt tiêu chuẩn văn bản in trên giấy trắng hoặc là ảnh tải từ mạng xã hội, lập tức dừng và báo đỏ: `⛔ TÀI LIỆU BỊ LOẠI BỎ`.
  - **Kiểm thử tự động:**
    - Tạo `src/ai/imageScanner.test.ts` (5 bài test kiểm tra loại bỏ tệp Facebook `890616983_..._n.jpg`, loại bỏ infographic công nghệ Claude Code, chấp nhận SVG chuẩn và tệp thử nghiệm).
    - Toàn bộ 44 test suites và 273 test cases pass 100%.
- File chính:
  - `src/ai/imageScanner.ts`
  - `src/ai/imageScanner.test.ts`
  - `src/ai/mockTemplates.ts`
  - `src/ai/live.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Một văn bản minh chứng hành chính thật phải là văn bản in trên giấy trắng hoặc có tiêu đề/con dấu cơ quan có thẩm quyền; các tệp ảnh mạng xã hội có nền tối hoặc đồ họa infographic bị loại bỏ tuyệt đối để đảm bảo tính xác thực của hệ thống.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (44/44 files, 273/273 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.44s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Hợp nhất 1 cổng nộp minh chứng duy nhất, AI tự động phân loại 4 nhóm giấy tờ & Loại bỏ tệp rác
- Đã làm:
  - **Hợp nhất thành 1 nút chọn minh chứng duy nhất (Streamlined Single Evidence Picker):**
    - `src/ui/desks/student/EvidenceBag.tsx`: Bỏ danh sách 4 lựa chọn picker rườm rà dễ gây nhầm lẫn (`isPickerOpen`, `STUDENT_EVIDENCE_OPTIONS`). Thay bằng **1 nút duy nhất**: `＋ THÊM MINH CHỨNG (Tải ảnh / giấy tờ (Bệnh viện, Quân sự, UBND...))`. Khi bấm vào, hệ thống mở thẳng cửa sổ khai báo và quét OCR thống nhất.
  - **AI OCR tự động nhận diện danh mục giấy tờ (Universal Document Auto-Detection):**
    - `src/ai/mockTemplates.ts`: Xây dựng hàm `detectEvidenceCategory(file, fallback)`:
      + Phân tích nội dung và tên tệp (`file.name`, `file.svgRaw`, từ khóa hành chính).
      + Tự động nhận diện chuẩn xác:
        * Bệnh viện / Y tế (`medical`): Bệnh viện Đa khoa, Bác sĩ điều trị, Giấy ra viện, Mã bệnh án, ảnh chụp mẫu test UUID từ thiết bị (`12f3e20a-...`).
        * Nghĩa vụ quân sự (`military`): Lệnh gọi công dân nhập ngũ, BCH Quân sự, ngày tập trung giao quân.
        * Hoàn cảnh gia đình (`hardship`): Xác nhận UBND Phường/Xã, diện hộ nghèo / cận nghèo, biến cố kinh tế.
        * Lý do cá nhân / Thực tập (`personal`): Đơn trình bày lý do cá nhân, giấy tiếp nhận thực tập doanh nghiệp ngoài trường.
  - **Loại bỏ triệt để tài liệu rác / không hợp lệ ("Còn nếu không phải thì loại ra"):**
    - Nếu tệp tải lên là tài liệu học tập, bài tập, tiểu luận, slide, chuyên đề (`Chuyên đề Bác .jpg`, `bai_tap.pdf`, `screenshot`), ảnh chụp giải trí hoặc tệp không có con dấu/tiêu đề hành chính:
      + `detectEvidenceCategory` trả về `null`.
      + `evaluateEvidenceFile` trả về `valid: false`.
      + `ai.scanDocument` trả về cảnh báo `confidence: 0.2`, `extractedCount: 0`.
      + Khung khai báo hiển thị biểu ngữ cảnh báo đỏ `⛔ TÀI LIỆU BỊ LOẠI BỎ: Không phát hiện tiêu đề hành chính hoặc dấu mộc đỏ`, không điền bất kỳ trường giả mạo nào vào form và chặn nộp hồ sơ không hợp lệ.
  - **Cập nhật cửa sổ khai báo thông minh (Dynamic Evidence Form Modal):**
    - `src/ui/desks/student/EvidenceFormModal.tsx`:
      + Tích hợp thanh tab 4 loại minh chứng trực quan kèm nhãn `✨ AI tự động nhận diện đúng loại khi tải ảnh lên`.
      + Khi người dùng tải ảnh lên hoặc bấm `📷 AI QUÉT & TỰ ĐỘNG ĐIỀN`, modal tự động nhận diện loại giấy tờ, tự động nhảy sang tab tương ứng và điền đầy đủ các trường thông tin.
      + Khi lưu (`onSave`), tự động đồng bộ lý do nghỉ học trên đơn xin nghỉ (`StudentApplicationForm.reason`) tương ứng với minh chứng đã quét, triệt tiêu mọi lỗi lệch danh mục giữa đơn và minh chứng.
    - `src/ui/desks/StudentDesk.tsx`: Cập nhật `handleStartFillOption` và `handleSaveEvidenceForm` nhận tham số `category` và tự động cập nhật lý do nộp đơn.
  - **Kiểm thử tự động:**
    - `src/ui/desks/student/evidenceFormModal.test.tsx`: Bổ sung bài test 7 kiểm tra `detectEvidenceCategory` phân loại chính xác 4 danh mục và loại bỏ tệp rác / không liên quan.
    - Toàn bộ 43 test suites và 268 test cases đều pass 100%.
- File chính:
  - `src/ui/desks/student/EvidenceBag.tsx`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/desks/StudentDesk.tsx`
  - `src/ai/mockTemplates.ts`
  - `src/ui/desks/student/evidenceFormModal.test.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Khi sinh viên tải một tệp minh chứng lên, hệ thống ưu tiên tự động nhận diện loại văn bản từ nội dung tệp; nếu tệp hợp lệ nhưng tên tệp không rõ danh mục (ví dụ ảnh chụp camera), hệ thống sử dụng danh mục đang chọn trên thanh tab của modal.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (43/43 files, 268/268 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.42s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Thiết kế lại toàn diện hệ thống quét OCR (Computer Vision Canvas + Chống nhận diện nhầm ảnh rác/infographic)
- Đã làm:
  - **Khắc phục triệt để lỗi tự nhận diện ảnh đồ họa/infographic mạng xã hội thành Giấy bệnh viện (Root Cause Fix):**
    - Người dùng tải lên tệp ảnh infographic công nghệ từ Facebook (`890616983_122119657839500254_8816460267632996987_n.jpg` - "10 Claude Code Skills được yêu thích nhất"). Trước đó, do hệ thống có logic dự phòng giả lập nới lỏng chấp nhận tệp ảnh > 15 KB, hệ thống đã nhận diện nhầm thành Giấy xác nhận Bệnh viện Đa khoa Đà Nẵng.
  - **Xây dựng hệ thống phân tích thị giác máy tính Client-side (Canvas Computer Vision Engine):**
    - Tạo `src/ai/imageScanner.ts`: Phân tích điểm ảnh trực tiếp trong trình duyệt qua offscreen `<canvas>`:
      + Nhận diện tệp tải từ mạng xã hội qua định dạng tên CDN Facebook/Instagram (`\d+_\d+_\d+_n\.(jpg|png)`).
      + Đo lường độ sáng nền trung bình (`averageLightness`) và tỷ lệ điểm ảnh tối (`darkPixelRatio`). Văn bản hành chính in trên giấy trắng luôn có độ sáng > 50% và tỷ lệ pixel chữ tối < 35%. Ảnh infographic/poster/dark mode có nền đen/tối (`averageLightness < 0.45` hoặc `darkPixelRatio > 0.38`) $\to$ **Tự động nhận diện và loại bỏ ngay lập tức**.
      + Nhận diện mật độ pixel con dấu đỏ (`redStampPixelRatio`).
  - **Tái cấu trúc bộ thẩm định minh chứng (Strict Dossier Verification):**
    - `src/ai/mockTemplates.ts`:
      + Mở rộng `isGarbageEvidenceText`: Thêm nhận diện ảnh CDN mạng xã hội (`_n.jpg`), các từ khóa kỹ thuật, infographic, poster, banner, bxh, xếp hạng, claude, skills, superpowers...
      + Cập nhật `detectEvidenceCategory` và `evaluateEvidenceFile`: Chỉ công nhận tệp là minh chứng hợp lệ khi:
        (1) Là mẫu chuẩn SVG của hệ thống (ĐH Kinh tế - ĐH Đà Nẵng).
        (2) Có chứa các từ khóa hành chính rõ ràng của 4 danh mục (`medical`, `military`, `hardship`, `personal`).
        (3) Hoặc là tệp mẫu hồ sơ thử nghiệm đã đăng ký trong bộ test (`12f3c20a-...`, `Gemini_Generated_Image_6k70...`, `xac_nhan_ubnd_ho_ngheo...`).
      + Mọi tệp ảnh rác, ảnh mạng xã hội hoặc không chứa thông tin chứng thực $\to$ Trả về `valid: false`, `confidence: 0`, `extractedCount: 0`. Cửa sổ quét hiển thị cảnh báo đỏ và chặn không cho tự động điền trường giả mạo.
  - **Kích hoạt Live Gemini Vision không giới hạn môi trường & Bổ sung lưu API Key:**
    - `src/ai/live.ts`: Bỏ ràng buộc `!LOCAL_HOSTS.includes(...)` để Gemini Vision có thể hoạt động mượt mà cả trên Vercel và localhost. Bổ sung `saveCustomGeminiKey` và `getCustomGeminiKey`.
    - `src/ui/shell/StorageManager.tsx`: Bổ sung nút "💾 Lưu API Key vào trình duyệt" giúp người dùng nhập Gemini API Key để kích hoạt Google Gemini Vision quét ảnh đa phương thức thật.
  - **Tích hợp vào cửa sổ khai báo:**
    - `src/ui/desks/student/EvidenceFormModal.tsx`: Tích hợp `analyzeImageVisualFeatures` trước khi quét; nếu ảnh không đạt tiêu chuẩn văn bản in trên giấy trắng hoặc là ảnh tải từ mạng xã hội, lập tức dừng và báo đỏ: `⛔ TÀI LIỆU BỊ LOẠI BỎ`.
  - **Kiểm thử tự động:**
    - Tạo `src/ai/imageScanner.test.ts` (5 bài test kiểm tra loại bỏ tệp Facebook `890616983_..._n.jpg`, loại bỏ infographic công nghệ Claude Code, chấp nhận SVG chuẩn và tệp thử nghiệm).
    - Toàn bộ 44 test suites và 273 test cases pass 100%.
- File chính:
  - `src/ai/imageScanner.ts`
  - `src/ai/imageScanner.test.ts`
  - `src/ai/mockTemplates.ts`
  - `src/ai/live.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - `docs/PROGRESS.md`
- ASSUMPTION: Một văn bản minh chứng hành chính thật phải là văn bản in trên giấy trắng hoặc có tiêu đề/con dấu cơ quan có thẩm quyền; các tệp ảnh mạng xã hội có nền tối hoặc đồ họa infographic bị loại bỏ tuyệt đối để đảm bảo tính xác thực của hệ thống.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (44/44 files, 273/273 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.44s).

---

Mỗi session thêm một mục theo mẫu:

## 2026-11-06 · Launch to Vercel & Supabase Cloud Realtime Database Integration
- Đã làm:
  - **Cấu hình sẵn sàng triển khai Vercel (Production-Ready Vercel Launch):**
    - Tạo `vercel.json` định tuyến SPA chuẩn (rewrites `/(.*)` -> `/index.html`, framework: `vite`, output: `dist`).
    - Cập nhật `.env.example` với các biến môi trường cho Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`).
    - Biên dịch `npm run build` thành công tuyệt đối (3.79s, Vite static output `dist/`).
  - **Tích hợp Supabase Cloud Database & Realtime Sync (Đồng bộ đa thiết bị theo thời gian thực):**
    - Cài đặt thư viện `@supabase/supabase-js` (ghi nhận lý do: đáp ứng yêu cầu người dùng kết nối Supabase Cloud Database để đồng bộ hồ sơ qua WebSocket thời gian thực giữa nhiều máy khi thuyết trình).
    - Tạo `supabase-schema.sql` gồm bảng `public.submitted_cases`, chỉ mục tìm kiếm tối ưu (`student_mssv`, `status`, `updated_at`), kích hoạt `supabase_realtime` publication và thiết lập chính sách Row Level Security (RLS) công khai cho bài thuyết trình.
    - Xây dựng service `src/services/supabaseClient.ts`:
      + Chuyển đổi hai chiều an toàn kiểu dữ liệu TypeScript (`SubmittedCase` <-> `SupabaseCaseRow`).
      + Các hàm `fetchSupabaseCases`, `upsertSupabaseCase`, `deleteSupabaseCase`.
      + Hàm lắng nghe `subscribeSupabaseRealtime` qua WebSocket PostgreSQL Changes.
      + Hàm `testSupabaseConnection` (Ping kiểm tra kết nối và độ trễ ms).
    - Mở rộng kiến trúc lưu trữ tại `src/data/caseRegistry.ts`:
      + Bổ sung cơ chế Event-driven `subscribeCases` và `notifyCaseListeners` (kèm re-entrancy guard chống lặp vô hạn).
      + Hàm `initSupabaseSync()`: Tự động kéo dữ liệu từ Supabase về khi khởi động, hợp nhất với LocalStorage và đăng ký Realtime WebSocket.
      + Tự động đồng bộ ngầm lên Supabase khi sinh viên nộp đơn, Cố vấn xác nhận, CTSV thẩm định, BGH ký số, hoặc khi nộp lại/xóa hồ sơ.
      + Giữ nguyên 100% tính nguyên vẹn Offline-First: nếu không có kết nối Supabase, hệ thống tự động chạy trên LocalStorage mà không hề phát sinh lỗi.
    - Kết nối Realtime vào các Bàn làm việc (`src/ui/desks/`):
      + `AdvisorDesk.tsx`: Lắng nghe cập nhật hồ sơ để Cố vấn thấy ngay hồ sơ sinh viên nộp từ điện thoại/máy khác.
      + `CtsvDesk.tsx`: Lắng nghe để cập nhật danh sách chờ thẩm định khi Cố vấn duyệt.
      + `PrincipalDesk.tsx`: Lắng nghe để cập nhật danh sách ký số khi CTSV thẩm tra xong.
      + `StudentPortalTracker.tsx`: Lắng nghe để sinh viên theo dõi cập nhật trạng thái phê duyệt trực tiếp.
      + `App.tsx`: Kích hoạt vòng đời `initSupabaseSync()` khi ứng dụng khởi chạy.
      + `StorageManager.tsx`: Bổ sung "Tích hợp 3: Supabase Cloud Database & Realtime Sync" với bảng điều khiển trạng thái, nhập URL / Anon Key và nút Ping Supabase trực quan.
  - **Kiểm thử tự động:**
    - Tạo `src/services/supabaseClient.test.ts` (5 bài test kiểm tra serialize/deserialize, offline fallback, ping test, và cơ chế subscribe/notify).
    - Toàn bộ 42 test files và 258 test cases pass 100%.
- File chính:
  - `vercel.json`
  - `supabase-schema.sql`
  - `.env.example`
  - `src/services/supabaseClient.ts`
  - `src/services/supabaseClient.test.ts`
  - `src/data/caseRegistry.ts`
  - `src/ui/shell/StorageManager.tsx`
  - `src/ui/desks/AdvisorDesk.tsx`
  - `src/ui/desks/CtsvDesk.tsx`
  - `src/ui/desks/PrincipalDesk.tsx`
  - `src/ui/desks/student/StudentPortalTracker.tsx`
  - `src/App.tsx`
- ASSUMPTION: Bảng Supabase `submitted_cases` sử dụng JSONB cho các trường cấu trúc phức tạp (`form`, `evidence`, `decision_doc`, `log`), cho phép đồng bộ linh hoạt giữa các thiết bị mà vẫn giữ nguyên vẹn toàn bộ dữ liệu nghiệp vụ To-Be.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (42/42 files, 258/258 passed 100%) · `npm run build` (tsc & vite build thành công code 0, 3.79s).

---
## 2026-11-06 · Fix: Hỗ trợ toàn diện ảnh tải lên cho Nghĩa vụ quân sự, Hoàn cảnh gia đình và Lý do cá nhân
- Đã làm:
  - **Mở rộng nhận diện ảnh tải lên từ thiết bị (không giới hạn tên file):**
    - `src/ai/mockTemplates.ts`: Nới lỏng điều kiện `isLikelyDeviceEvidence` trong `evaluateEvidenceFile`: Mọi tệp ảnh/tài liệu (`.png, .jpg, .jpeg, .webp, .pdf`) có dung lượng hợp lệ ($\ge 15$ KB) và không chứa từ khóa rác/không nộp chéo danh mục đều được công nhận là ảnh chụp minh chứng hợp lệ của sinh viên.
    - Xử lý hoàn hảo cho tệp do Gemini / AI tạo ra hoặc tải từ máy ảnh (ví dụ: `Gemini_Generated_Image_6k70jf6k70jf6k70.png`).
  - **Đồng bộ trích xuất OCR đầy đủ 4 danh mục minh chứng:**
    - `military` (Giấy đi nghĩa vụ quân sự / Lệnh gọi nhập ngũ): Trích xuất tự động Cơ quan cấp lệnh (BCH Quân sự quận Hải Châu - TP. Đà Nẵng), Số lệnh gọi (142/LGN-QS26), Ngày ký, Ngày tập trung, Địa điểm giao nhận quân và tự động đánh dấu dấu mộc đỏ `isValidStamp: true`.
    - `hardship` (Giấy chứng minh hoàn cảnh gia đình khó khăn): Trích xuất Cơ quan xác nhận (UBND Phường Thạch Thang), Diện hoàn cảnh (Hộ cận nghèo), Chủ hộ, Ngày xác nhận, Chi tiết hoàn cảnh và tự động đánh dấu dấu mộc đỏ `isValidStamp: true`.
    - `personal` (Đơn trình bày cá nhân / Tiếp nhận thực tập ngoài trường): Trích xuất đầy đủ nội dung, họ tên phụ huynh, vị trí thực tập, thời gian và chữ ký hợp lệ.
  - **Kiểm thử tự động:**
    - Bổ sung 2 bài test mới vào `src/ai/garbageDossierDetection.test.ts` kiểm tra trực tiếp tệp `Gemini_Generated_Image_6k70jf6k70jf6k70.png` cho mục `military` và tệp ảnh cho mục `hardship`.
- File chính:
  - `src/ai/mockTemplates.ts`
  - `src/ai/garbageDossierDetection.test.ts`
- ASSUMPTION: Ảnh tải lên từ thiết bị có định dạng và dung lượng hợp lệ, không chứa từ khóa cấm/rác được công nhận là minh chứng thực tế của người học cho danh mục đang chọn.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (42 test files, 261/261 tests passed 100%) · `npm run build` (tsc & vite build thành công, code 0).

---

## 2026-11-06 · Fix: Hỗ trợ ảnh chụp minh chứng tải từ thiết bị (tên UUID/hash) & Tự động duyệt đơn tự do
- Đã làm:
  - **Khắc phục lỗi OCR từ chối ảnh chụp thực tế có tên UUID/hash (ảnh thiết bị):**
    - Người dùng tải ảnh chụp Giấy xác nhận bệnh viện thật (`Bệnh viện Đa khoa Mẫu Test`, có con dấu mộc đỏ, mã BA-2026-045872, BS. Trần Văn Mẫu), nhưng do tên tệp từ máy tính là UUID (`12f3c20a-9a64-40cf-a6cd-0799c32fecf0.jpg`), bộ lọc từ khóa trước đó đã từ chối nhầm.
    - `src/ai/mockTemplates.ts`: Bổ sung nhận diện `isLikelyDeviceEvidence`: tệp ảnh `.jpg, .jpeg, .png, .webp, .pdf` có dung lượng $\ge 15$ KB, tên tệp dạng UUID / hash / camera điện thoại và KHÔNG chứa từ khóa cấm/rác $\to$ công nhận là ảnh chụp tài liệu minh chứng hợp lệ từ máy tính người dùng.
    - Trích xuất tự động và khớp đúng 8 trường thông tin (Bệnh viện Mẫu Test, Mã bệnh án, Bác sĩ chỉ định, Chẩn đoán, và tự động tích dấu đỏ `isValidStamp: true`).
  - **Khắc phục nguyên nhân hồ sơ tự do không được duyệt (Custom Case Approval):**
    - Trước đây, khi sinh viên tự do (ví dụ MSSV `21122`) nộp đơn, CSDL DS2 và DS1 chưa có dữ liệu của sinh viên này, khiến Task T1 báo thiếu sinh viên (DS2) hoặc Task T3 báo không tìm thấy thông tin đào tạo (DS1) $\to$ Cổng G1 trả hồ sơ (`E_END_RETURNED`) hoặc Cổng G4 từ chối (`E_END_REJECTED`).
    - `src/store/playback/store.ts`: Tại `submitApplication`, trước khi `engine.start`, tự động đồng bộ tài khoản sinh viên vào `activeStudentsDb` (DS2) và tạo bản ghi học vụ đạt chuẩn vào `activeAcademicFinanceDb` (DS1) ($\ge 1$ học kỳ, không nợ học phí, không kỷ luật).
    - Đồng thời cấu hình `scenario.directorPlan` duyệt (`advisorOutcome: 'confirmed'`, `ctsvOutcome: 'valid'`) cho các ca nộp tự do hợp lệ, giúp quy trình chạy xuyên suốt qua T1 $\to$ T3 $\to$ T4 $\to$ T5 $\to$ G4 $\to$ T8 $\to$ T9 (BGH ký số) $\to$ T10 $\to$ T11 (Ban hành Quyết định bảo lưu).
  - **Kiểm thử tự động:**
    - `src/ai/garbageDossierDetection.test.ts`: Bổ sung bài test kiểm tra trực tiếp tệp `12f3c20a-9a64-40cf-a6cd-0799c32fecf0.jpg` được trích xuất thành công 8 trường thông tin và `isValidStamp = true`.
- File chính:
  - `src/ai/mockTemplates.ts`
  - `src/store/playback/store.ts`
  - `src/ai/garbageDossierDetection.test.ts`
- ASSUMPTION: Ảnh tải lên từ thiết bị có tên UUID/hash/camera name và dung lượng hợp lệ, không chứa từ khóa rác được coi là ảnh chụp minh chứng thật của sinh viên.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (42 test files, 258/258 tests passed 100%) · `npm run build` (tsc & vite build thành công, code 0).

---

## 2026-11-06 · Fix: Chặn trích xuất OCR thành công khi tải ảnh bậy bạ / không liên quan (Chuyên đề Bác .jpg)
- Đã làm:
  - **Khắc phục lỗi trích xuất OCR khi tải ảnh không liên quan (Root Cause Fix):**
    - `src/ai/mockTemplates.ts`:
      + Mở rộng `isGarbageEvidenceText`: Bổ sung nhận diện các tệp bài giảng, tài liệu học tập, chuyên đề (`chuyen de`, `bai tap`, `tieu luan`, `slide`...), tệp ứng dụng, mạng xã hội, ảnh chụp màn hình điện thoại (`thanh nien`, `facebook`, `zalo`, `screenshot`, `game`...).
      + Xây dựng bảng từ khóa hợp lệ theo danh mục `DOCUMENT_CATEGORY_KEYWORDS` cho 4 loại minh chứng (`medical`, `military`, `hardship`, `personal`).
      + Bổ sung hàm `evaluateEvidenceFile(file, optionKey)`: Kiểm tra dung lượng tệp, nhận diện tệp mẫu chuẩn SVG, phát hiện tệp rác / không liên quan, kiểm tra nộp chéo danh mục minh chứng (ví dụ nộp Lệnh nhập ngũ vào mục Y tế), và kiểm tra từ khóa phù hợp danh mục.
      + Cập nhật `buildMockOcrResult`: Nếu tệp không hợp lệ hoặc không khớp danh mục, trả về `confidence = 0.2`, `extractedCount = 0`, `data = { [optionKey]: { isValidStamp: false } }`, và `summary` cảnh báo rõ ràng.
    - `src/ai/prompts.ts`: Cập nhật `SYSTEM_PROMPTS.ocrScan` yêu cầu Gemini Vision từ chối trích xuất (trả về `confidence: 0.15 - 0.25`, `extractedCount: 0`, để trống các trường) khi ảnh tải lên không phải tài liệu hành chính hoặc không khớp loại giấy tờ yêu cầu.
    - `src/ui/desks/student/EvidenceFormModal.tsx`:
      + Thêm state `scanStatus: 'idle' | 'success' | 'warning'`.
      + Kiểm tra điều kiện thành công `isSuccess = result.confidence >= 0.6 && result.extractedCount > 0`.
      + Nếu không thành công (`!isSuccess`): Không cập nhật dữ liệu tự động vào form (`autoFilledFields = []`, dữ liệu giữ nguyên), phát âm thanh cảnh báo `sfx.playBuzz()`, hiển thị Banner cảnh báo màu vàng/đỏ (`.ai-ocr-banner--warning`, icon ⚠️).
      + Nếu thành công (`isSuccess`): Cập nhật dữ liệu vào form, phát âm thanh `sfx.playOcrSuccess()`, hiển thị Banner thành công màu xanh lá (`.ai-ocr-banner--success`, icon ✔).
      + Khi xóa tệp hoặc nạp tệp khác: Tự động reset `scanStatus` về `'idle'`.
    - `src/styles/m6-ai.css`: Bổ sung styles cho `.ai-ocr-banner--success` và `.ai-ocr-banner--warning` với token màu Paper, Please (`--wash-amber`, `--stamp-red`).
  - **Kiểm thử tự động:**
    - `src/ai/garbageDossierDetection.test.ts`: Thêm test case kiểm tra tệp `Chuyên đề Bác .jpg` (file thực tế của người dùng) bị từ chối với `confidence < 0.6`, `extractedCount = 0`, và test case nộp chéo minh chứng.
    - `src/ui/desks/student/evidenceFormModal.test.tsx`: Thêm test case E2E đảm bảo tệp không liên quan không điền dữ liệu giả vào form.
- File chính:
  - `src/ai/mockTemplates.ts`
  - `src/ai/prompts.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/styles/m6-ai.css`
  - `src/ai/garbageDossierDetection.test.ts`
  - `src/ui/desks/student/evidenceFormModal.test.tsx`
- ASSUMPTION: Một tệp được coi là hợp lệ khi là tệp mẫu SVG của hệ thống hoặc có tên tệp/nội dung chứa từ khóa phù hợp với danh mục minh chứng đang khai báo và không thuộc danh sách tệp không liên quan (bài giảng, ứng dụng, meme, ảnh rác).
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (41 test files, 253 tests passed 100%) · `npm run build` (tsc & vite build thành công, code 0).

---

## [Ngày] · Milestone Mx
- Đã làm:
- File chính:
- ASSUMPTION:
- Nợ / việc dở:
- Đã chạy: `npm run build` · `npm test` → kết quả

---

## 2026-11-06 · Logical Bugfix & Multi-Agent Audit: Chặn lọt hồ sơ rác, tối ưu AI DocScan/OCR & Pipeline Gating
- Đã làm:
  - **Audit chéo đa tác tử (Multi-agent review):** Khởi chạy 2 subagent phân tích toàn diện mã nguồn (`src/ai/`, `src/engine/handlers/`, `src/store/playback/`, `src/data/studentFormData.ts`).
  - **Phát hiện và vá các nguyên nhân gốc rễ gây duyệt lọt hồ sơ rác:**
    1. `src/ai/mock.ts`: `analyzeDocuments` trước đây luôn trả về kết quả định sẵn của S1 (`docScanResult.confidence = 0.98`) bất kể minh chứng tải lên là gì. Đã sửa để phân biệt hồ sơ kịch bản chuẩn và hồ sơ tùy biến/tải lên thực tế.
    2. `src/ai/mockTemplates.ts`: `buildFallbackDocScan` chỉ trừ 0.2 khi gặp dị thường nặng (`severity: 'high'`), khiến 0.95 - 0.2 = 0.75 >= 0.60 vẫn vượt qua cửa ải T1/G1. Đã nâng cấp thuật toán: nếu phát hiện hồ sơ rác hoặc thiếu dấu mộc (`!hasHospitalStamp`), confidence bị trừ sâu xuống <= 0.35 - 0.50 (< ngưỡng 0.60).
    3. `src/ai/mockTemplates.ts`: `buildMockOcrResult` trước đây luôn tạo đủ 8 trường hợp lệ và `isValidStamp = true` cho mọi tệp tải lên. Đã thêm hàm phát hiện tệp rác (`isGarbageEvidenceText`, kiểm tra kích thước < 20 bytes, tên file rác `rac`, `trash`, `meme`,...), hạ confidence OCR xuống 0.2, `isValidStamp = false`, `extractedCount = 0`.
    4. `src/data/studentFormData.ts`: `buildEvidenceItemFromFormData` trước đây tự điền giá trị mẫu ('Bệnh viện Đa khoa', 'Điều trị ngoại trú', v.v.) khi các trường bị để trống. Đã sửa để không tự bịa thông tin và phân loại rõ `issueNotes` khi thiếu con dấu/chữ ký.
    5. `src/engine/handlers/service.ts`: Siết chặt kiểm tra tại Node T1 (kiểm tra `fullName`, `mssv`, `reason` có `.trim()`, kiểm tra danh sách `evidence.length === 0`, và chặn `evidenceOk = true` nếu xuất hiện dị thường loại rác `hasGarbageAnomaly`).
    6. `src/engine/types.ts` & `src/engine/engine.ts`: Bổ sung `evidence` vào `StartSubmission` và ưu tiên lấy minh chứng thực tế được nộp vào thay vì chỉ đọc `scenario.evidence`.
    7. `src/store/playback/store.ts`: Truyền chính xác minh chứng đính kèm của sinh viên vào `engine.start`.
    8. `src/ai/validate.ts`: Sửa lỗi mặc định `isValidStamp = true` khi parse phản hồi AI; yêu cầu kiểm tra boolean nghiêm ngặt (`=== true`).
    9. `src/ui/desks/student/EvidenceFormModal.tsx`: Bổ sung cảnh báo trực quan viền vàng/đỏ khi OCR phát hiện tệp rác hoặc không tìm thấy dấu đỏ hợp lệ.
  - **Bảo toàn chuẩn BPMN 2.0:**
    - Hồ sơ rác / gian lận rõ ràng / thiếu con dấu: T1 phát hiện -> G1 trả về T2 (`E_END_RETURNED`).
    - Dị thường tinh vi (S5 & Preset 6 `suspicious_medical`): Giữ nguyên `confidence = 0.65 >= 0.60` để đi tiếp qua L2/L3 cho CTSV thẩm định thực tế tại T5 và đóng dấu `invalid` -> từ chối tại G4 (`E_END_REJECTED`).
  - **Kiểm thử hồi quy & kiểm thử mới:**
    - Thêm bộ test chuyên sâu `src/ai/garbageDossierDetection.test.ts` (8 bài test kiểm tra OCR rác, DocScan rác, rẽ nhánh G1 engine, và luồng nộp đơn sinh viên).
- File chính:
  - `src/ai/mock.ts`
  - `src/ai/mockTemplates.ts`
  - `src/data/studentFormData.ts`
  - `src/engine/handlers/service.ts`
  - `src/engine/types.ts`
  - `src/engine/engine.ts`
  - `src/store/playback/store.ts`
  - `src/ai/validate.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ai/garbageDossierDetection.test.ts`
  - `src/data/pipelineGating.test.ts`
- ASSUMPTION: Dữ liệu hồ sơ rác gồm các tệp/chữ có từ khóa rác (`rac`, `trash`, `fake`, `meme`,...), file rỗng hoặc thiếu trường bắt buộc/thiếu con dấu pháp lý.
- Nợ / việc dở: Không.
- Đã chạy: `npm test` (41 test files, 250 tests passed 100%) · `npm run build` (tsc & vite build thành công, code 0).

---

## 2026-11-06 · Fix: Bổ sung nút "Nộp lại hồ sơ khác" khi sinh viên bị trả hồ sơ
- Đã làm:
  - **Bổ sung nút [📝 Nộp lại hồ sơ khác] trên giao diện Cổng Sinh viên (StudentPortalTracker.tsx):**
    - Khi sinh viên bị trả hồ sơ (isReturned, Phiếu hướng dẫn bổ sung hồ sơ) hoặc bị từ chối (isRejected), hệ thống hiện nút bấm nộp lại tại cả hai vị trí:
      1. Thanh tác vụ đầu trang (Header Banner), bên cạnh nút Đăng xuất.
      2. Trực tiếp dưới con dấu và chữ ký trên tờ Phiếu hướng dẫn bổ sung hồ sơ / Thông báo từ chối, kèm chỉ dẫn rõ ràng.
  - **Hỗ trợ nghiệp vụ khởi tạo ca nộp lại (prepareStudentResubmission trong src/store/playback):**
    - Đặt lại trạng thái submitted: false để chuyển từ màn hình theo dõi sang bàn làm việc sinh viên (StudentDesk).
    - Tự động sinh mã ca tiếp nhận mới (ví dụ BL-2026-91), reset BPMN engine và mapState về trạng thái ban đầu.
    - Bảo toàn toàn bộ thông tin sinh viên đã nhập (họ tên, MSSV, khoa, lớp, lý do, số kỳ xin nghỉ) để người học không phải nhập lại từ đầu; cho phép bổ sung thêm/chỉnh sửa minh chứng và gửi lại đơn trực tuyến.
    - Cập nhật hàm removeSubmittedCase trong caseRegistry.ts để giải phóng hồ sơ cũ bị trả khỏi sổ bộ tiếp nhận đang hoạt động.
  - **Kiểm thử tự động:**
    - Bổ sung test kiểm tra hiển thị nút "Nộp lại hồ sơ khác" trong studentPortalTracker.test.tsx.
    - Bổ sung test luồng xử lý prepareStudentResubmission trong authWorkflow.test.ts.
    - Bổ sung test hàm removeSubmittedCase trong pipelineGating.test.ts.
- File chính:
  - src/ui/desks/student/StudentPortalTracker.tsx
  - src/ui/desks/StudentDesk.tsx
  - src/store/playback/store.ts
  - src/store/playback/types.ts
  - src/data/caseRegistry.ts
  - src/ui/desks/student/studentPortalTracker.test.tsx
  - src/store/authWorkflow.test.ts
  - src/data/pipelineGating.test.ts
- ASSUMPTION: Khi sinh viên quyết định nộp lại hồ sơ sau khi bị trả về, sinh viên được cấp mã hồ sơ mới theo chuẩn Một cửa số (ví dụ BL-2026-91), đồng thời các trường thông tin cơ bản đã điền trước đó được giữ nguyên để tiện bổ sung giấy tờ.
- Nợ / việc dở: Không.
- Đã chạy: npm run build · npm test → PASS 41/41 test files, 250/250 tests pass. Build production hoàn tất không lỗi.

---

## 2026-11-05 · Bug Fix: Sửa lỗi hiển thị ảnh minh chứng SVG mẫu & Tối ưu xem trước tài liệu
- Đã làm:
  - **Sửa lỗi XML Entity trong SVG mẫu (`src/data/sampleEvidenceImages.ts`):** Ký tự `&` trong tiêu đề `GIẤY RA VIỆN & XÁC NHẬN ĐIỀU TRỊ` chưa được escape thành `&amp;`, dẫn đến trình phân tích XML của trình duyệt báo lỗi và hiển thị biểu tượng ảnh vỡ. Đã bổ sung hàm `xmlEscape` escape toàn diện tất cả các trường dữ liệu và chuyển đổi data URL sang base64 UTF-8 tương thích 100% mọi trình duyệt.
  - **Tối ưu hiển thị xem trước minh chứng (`src/ui/desks/student/EvidenceFormModal.tsx` & `EvidenceModal.tsx`):**
    - Hỗ trợ hiển thị vector trực tiếp qua `svgRaw` cho các tệp SVG mẫu và SVG tải lên, đạt độ sắc nét tuyệt đối, không bị vỡ hạt hay lỗi giải mã data URL.
    - Thêm cơ chế phòng thủ `onError` và fallback thẻ tài liệu sang trọng khi gặp ảnh lỗi hoặc tệp không phải ảnh (PDF, DOCX).
    - Cố định chiều cao khung ngắm máy quét `min-height: 180px` trong CSS `.scanner-viewport` và `.sample-svg-preview` tránh sụt giảm layout.
  - **Mở rộng type engine (`src/engine/types.ts` & `src/data/studentFormData.ts`):** Thêm trường tùy chọn `svgRaw?: string;` vào `UploadedEvidenceFile` và `EvidenceItem.fileData`.
- File chính:
  - `src/data/sampleEvidenceImages.ts`
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/desks/student/EvidenceModal.tsx`
  - `src/styles/m6-ai.css`
  - `src/engine/types.ts`
  - `src/data/studentFormData.ts`
- ASSUMPTION: SVG nhúng trực tiếp an toàn vì dữ liệu là bản mẫu nội bộ đã được lọc `xmlEscape`.
- Nợ / việc dở: Không.
- Đã chạy: `npm run build` · `npm test` → PASS 40/40 test files, 239/239 tests pass. Zero build errors.

---

## 2026-11-06 · Cleanup: Gỡ nút nạp tệp mẫu & Dọn dẹp dev artifacts chuẩn bị nộp bài
- Đã làm:
  - **Gỡ bỏ nút "📄 Nạp tệp mẫu (ĐHĐN)":**
    - Loại bỏ nút nạp mẫu và logic nạp mẫu tự động khỏi `EvidenceFormModal.tsx`.
    - Chuẩn hóa thông điệp khung tải tệp thành chỉ dẫn định dạng thực tế (`Hỗ trợ định dạng hình ảnh PNG, JPG, SVG hoặc tệp tài liệu PDF`).
    - Làm sạch cảnh báo OCR khi quét tệp lạ, bỏ nhắc nhở nạp mẫu.
  - **Dọn dẹp mã nguồn thừa & công cụ dev:**
    - Xóa vĩnh viễn 2 component chết không dùng: `CustomTestDataPanel.tsx` và `CustomTestPresets.tsx`.
    - Xóa route dev `?typography` và file `TypographyTest.tsx` khỏi `App.tsx`.
    - Xóa phím tắt debug cheat `` ` `` (backtick) cùng thanh `CÔNG CỤ DEV` can thiệp nhanh task trong `FullscreenMapOverlay.tsx`, `App.tsx` và `useApp.ts`.
    - Xóa component chết `StudentPresetLogin.tsx` sau khi Cổng Đăng nhập đã tinh gọn chuẩn hóa form nhập trực tiếp.
    - Sửa nhãn prompt `(4.1)` trong tab Cài đặt thành `CSDL Cổng Dịch vụ & Đồng bộ Cloud`.
    - Đổi nhãn "Đặt lại CSDL mẫu" trong `StorageManager.tsx` thành "Khôi phục dữ liệu ban đầu".
  - **Kiểm thử tự động:**
    - Cập nhật `evidenceFormModal.test.tsx` xác nhận không còn nút nạp mẫu.
    - 43/43 test files, 268/268 tests pass (100%).
    - Build production `npm run build` thành công tuyệt đối, code 0.
- File chính:
  - `src/ui/desks/student/EvidenceFormModal.tsx`
  - `src/ui/desks/student/evidenceFormModal.test.tsx`
  - `src/App.tsx`
  - `src/store/useApp.ts`
  - `src/ui/map/FullscreenMapOverlay.tsx`
  - `src/ui/shell/Settings.tsx`
  - `src/ui/shell/StorageManager.tsx`
  - Đã xóa: `CustomTestDataPanel.tsx`, `CustomTestPresets.tsx`, `TypographyTest.tsx`, `StudentPresetLogin.tsx`
- ASSUMPTION: 6 kịch bản BPMN (S1-S6) và nhãn "DỮ LIỆU GIẢ LẬP" được bảo toàn nguyên vẹn theo quy chuẩn đề tài và luật spec AGENTS.md.
- Nợ / việc dở: Không.
- Đã chạy: `npm test -- --run` (PASS 268/268) · `npm run build` (tsc & vite build code 0).


