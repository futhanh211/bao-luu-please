# 02 · GAME DESIGN — Trải nghiệm "Paper, Please" cho quy trình bảo lưu

## 1. Ý tưởng cốt lõi
Người chơi không "xem" quy trình, mà **sống trong nó**: lúc là sinh viên nộp đơn, lúc là Cố vấn đóng dấu, lúc là chuyên viên CTSV soi minh chứng, lúc là Hiệu trưởng ký số, và luôn có góc nhìn "X-quang" của hệ thống điều phối.
Chất Paper, Please: bàn làm việc chật, giấy tờ trượt vào, con dấu đóng cái "chát", soi chi tiết lệch nhau, âm thanh văn phòng. Nhưng **đảo ngược thông điệp**: phần "địa ngục giấy tờ" là As-Is; To-Be là phiên bản máy lo việc máy, người chỉ làm việc cần phán đoán.

## 2. Ba chế độ chơi
- **PLAY (mặc định):** người điều khiển tự chơi từng vai. Khi một User Task được giao, tab vai tương ứng nhấp nháy; chuyển tab bằng phím 1–5.
- **STEP (cho thuyết minh):** engine dừng ở từng node; bấm `Space` chạy node kế. Caption "Vì sao tự động hóa?" hiện ở mỗi node. Dùng khi giảng giải BPMN.
- **DIRECTOR (tự chạy):** toàn bộ kịch bản tự diễn, các User Task tự hoàn tất với độ trễ giả lập, caption thuyết minh. Dùng làm Plan B và để phần mở đầu/kết gọn gàng. `Space` = tạm dừng/tiếp tục.
Tốc độ: 0.5× / 1× / 2× (phím `-` `+`). Phím `R` reset ca.

## 3. Các "bàn" (màn hình) theo vai
Mọi bàn dùng chung một ngôn ngữ thị giác (xem `03-UI-UX-DESIGN.md`) và chung một engine.

### 3.1 Bàn Sinh viên — "Cổng thông tin" (Pool Sinh viên)
- Tờ **Đơn xin nghỉ học tạm thời** (giấy đánh máy): họ tên, MSSV, lớp, khoa, SĐT, email, lý do (Ốm đau/tai nạn điều trị dài · Nghĩa vụ quân sự · Hoàn cảnh gia đình · Lý do cá nhân khác), số học kỳ nghỉ (1/2), học kỳ bắt đầu, ô cam kết.
- **Túi minh chứng**: các tờ minh chứng của kịch bản (giấy ra viện, giấy gọi nhập ngũ, xác nhận hoàn cảnh…) kéo-thả (hoặc bấm) vào khay đính kèm.
- Nút **NỘP TRỰC TUYẾN** → phong bì bay theo đường Message Flow sang Pool Trường (MF1).
- **Trợ lý AI sinh viên** (khung chat bên phải): hỏi thủ tục, hồ sơ cần gì, tiến độ ca. (AI-2)
- **Hộp thư đến**: các thông báo từ T2/T7/T11 trượt vào dạng thư; thư quyết định có file "Quyết định đã ký số" mở xem được.
- Tab **Tra cứu tiến độ**: dòng thời gian trạng thái ca (minh bạch hóa).

### 3.2 Phòng điều khiển — "Hệ thống điều phối" (Lane L1)
- Màn hình CRT xanh lá: log từng dịch vụ chạy (`[T1] Service: kiểm tra hồ sơ… OK`).
- Tủ dữ liệu: `DS1` (Đào tạo & Tài chính) và `DS2` (Quản lý SV) nhấp sáng khi đọc/ghi.
- Ba "hồ sơ điện tử" đổi hình theo vòng đời: Hồ sơ bảo lưu → Dự thảo → Quyết định có dấu đỏ.
- Bảng bộ quy tắc T3: R1–R4 từng dòng chạy tick/cross.
- Đây là nơi người xem thấy "máy làm việc máy".

### 3.3 Bàn Cố vấn học tập (T4)
- Tablet hồ sơ điện tử: thông tin SV + tóm tắt AI + đề xuất AI (AI-3).
- Hai con dấu: **XÁC NHẬN** (xanh) / **KHÔNG XÁC NHẬN** (đỏ) → `advisor.status`.
- Chuông + banner đỏ khi `BT1` bắn: "Nhắc việc từ hệ thống — hồ sơ đã chờ 3 ngày làm việc" (T6).

### 3.4 Bàn Phòng CTSV (T5) — khoảnh khắc "Paper, Please" chính
- Trên bàn: Đơn của SV · Minh chứng · Thẻ tra cứu CSDL (chỉ đọc).
- **Soi lệch:** bấm vào chi tiết nghi vấn (tên, ngày, con dấu, loại giấy tờ, thời hạn) để đánh dấu vòng tròn đỏ.
- Nút "Hỏi AI" hiện gợi ý bất thường (AI-3) — chỉ là gợi ý. Nếu quyết định của người khác với đề xuất của AI thì ghi log "Người ≠ AI" (điểm nhấn human-in-the-loop).
- Hai con dấu: **HỢP LỆ** / **KHÔNG HỢP LỆ** → `ctsv.status`.
- Phản hồi kiểu game: "Bạn bắt được 2/2 điểm bất thường" (chỉ để vui; kết quả ca vẫn theo con dấu).

### 3.5 Bàn Ban Giám hiệu (T9)
- Dự thảo quyết định: các trường được máy điền (họ tên, MSSV, thời hạn…) **tô vàng** để khoe tự động hóa (T8).
- Nghi thức **Ký số:** cắm USB token (animation) → nhập mã PIN (tự điền ••••) → nét chữ ký vẽ ra + con dấu đỏ "chát". Dự thảo hóa thành Quyết định.

### 3.6 Bản đồ BPMN (X-ray)
- Toàn bộ sơ đồ 2 Pool / 4 Lane vẽ bằng SVG; token phát sáng chạy theo cạnh; node đang chạy phát sáng; node xong chuyển màu.
- Hai chế độ hiển thị: **toàn màn hình** (phím `B`) và **mini-map góc phải** luôn hiện trong mọi bàn.
- Legend ký hiệu: Service / Send / Business Rule / User, XOR, AND, Timer, Data Store…
- Bộ đếm sống: số task tự động đã chạy / tổng; số thông điệp đã gửi; ngày giả lập.

## 4. Kịch bản (scenarios)
Dữ liệu SV là giả lập; MSSV 10 chữ số tự đặt.

1. **S1 · Happy path — "Minh Khoa ốm dài ngày".** Nguyễn Minh Khoa, đã học 3 học kỳ, hết nợ, không kỷ luật, có giấy ra viện hợp lệ → T1 OK → song song 3 nhánh → Cố vấn xác nhận, CTSV hợp lệ → ký số → cập nhật → thông báo. **Kết: Bảo lưu thành công.**
2. **S2 · Hồ sơ thiếu — "Thu Hà quên minh chứng".** Trần Thu Hà nộp đơn không đính kèm minh chứng (hoặc sai loại giấy tờ) → T1 phát hiện → G1=Không → T2 gửi thông báo liệt kê thiếu gì (AI-4 soạn). **Kết: Trả hồ sơ** (End "Trả hồ sơ"). Điểm nhấn: phản hồi tức thời, không cần cán bộ.
3. **S3 · Nợ học phí — "Quốc Bảo còn nợ".** Lê Quốc Bảo hồ sơ đủ nhưng công nợ > 0 → T3 R3 fail (và người vẫn xử lý song song T4, T5) → G4=Không → T7 (AI-4 giải thích lý do + hướng xử lý). **Kết: Từ chối.** Điểm nhấn: máy đối chiếu CSDL Tài chính tức thì; cũng là chỗ mở Q&A về lãng phí song song (xem 01 mục 9).
4. **S4 · Cố vấn "ngâm" hồ sơ — "Ngọc Anh chờ".** Hồ sơ hợp lệ, T4 bị bỏ đó → bấm Tua +3 ngày → `BT1` bắn → T6 nhắc Cố vấn (chuông reo) → nhánh nhắc kết thúc ở "Hoàn tất nhắc việc", T4 vẫn chờ → Cố vấn xác nhận → chạy tiếp thành công. Điểm nhấn: non-interrupting timer + SLA.
5. **S5 · Minh chứng đáng ngờ — "Đức Thịnh".** Giấy ra viện có bất thường (ngày ra viện trước ngày vào viện, tên lệch một chữ, thiếu dấu đỏ). AI-3 cảnh báo; người chơi ở bàn CTSV phải soi và đóng KHÔNG HỢP LỆ → G4=Không → T7. **Kết: Từ chối.** Điểm nhấn: máy hỗ trợ, người quyết (lý do T5 là User Task).
6. **S6 · Tự nhập (Custom).** Người xem điền form tự do với MSSV bất kỳ trong CSDL giả lập (có ~8 SV mẫu với tình trạng khác nhau). Kết quả suy ra từ dữ liệu → tính "thật" của demo.

Mỗi kịch bản là một object trong `src/data/scenarios.ts` gồm: sinh viên, form mặc định, danh sách minh chứng (có nội dung hiển thị), điểm bất thường "đáp án", `aiScript` cho mock, độ trễ ảo cho các user task ở chế độ Director, kết cục kỳ vọng (dùng cho test).

## 5. So sánh As-Is (nhẹ, 20–30 giây)
Nút "Xem bản As-Is" (trên màn tiêu đề và báo cáo cuối ca) chạy một đoạn animation: cái cặp hồ sơ giấy đi từ bàn tiếp nhận → Cố vấn → CTSV → Đào tạo → Tài chính → BGH (in, đóng dấu đỏ) → Văn thư → SV nhận bản giấy; đồng hồ ngày nhảy; gag văn phòng ("Cô văn thư đi ăn trưa — quay lại sau 2 ngày", "Sếp đi công tác — hồ sơ chờ chữ ký").
- **ASSUMPTION:** các trạm và số ngày As-Is là giả định; nhóm điền số thật từ báo cáo As-Is vào `src/data/asis.config.ts` (các trường `stations[]` và `days`).
- Mục đích duy nhất: tạo tương phản trước khi vào To-Be, và làm số so sánh ở báo cáo cuối ca.

## 6. Báo cáo cuối ca ("Case Report")
Hiện khi ca kết thúc (bất kỳ End Event chính nào): kết cục, thời gian giả lập, X/11 task tự động đã chạy (tính theo task thực sự chạy trong ca), số task người, số thông điệp đã gửi, số lần đọc/ghi CSDL, số lần "Người ≠ AI", so sánh với As-Is (từ config), nút Chơi lại / Chọn kịch bản khác / Xem X-quang.

## 7. Cảm giác (game feel) — danh sách khoảnh khắc phải có
- Giấy trượt vào bàn, hơi nghiêng ngẫu nhiên.
- Con dấu: nhấc lên → đóng "chát" → bàn rung nhẹ → mực loang.
- Token chạy dọc cạnh BPMN có vệt sáng; tách 3 ở G2, hội tụ + chớp ở G3.
- Phong bì bay theo Message Flow sang hộp thư SV.
- Đồng hồ SLA quay nhanh khi tua ngày; chuông rung khi T6.
- Chữ ký số vẽ nét, kèm dấu đỏ.
- Chữ AI hiện kiểu máy đánh chữ.
- Màn tiêu đề kiểu khởi động máy (boot sequence) → chọn kịch bản như chọn hồ sơ ca.
