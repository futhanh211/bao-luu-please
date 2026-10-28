# 01 · PROCESS SPEC — Quy trình To-Be nghỉ học tạm thời / bảo lưu (NGUỒN SỰ THẬT)

Nguồn: Báo cáo Thực hành 3.2 — "Tự động hóa quy trình To-Be của quy trình giải quyết thủ tục nghỉ học tạm thời / bảo lưu kết quả học tập". Chuẩn BPMN 2.0, mức mô hình khả thi (executable-level). Tài liệu này dịch báo cáo thành spec để code. Phần đánh dấu **ASSUMPTION** là chỗ báo cáo không nói rõ, cả nhóm cần rà lại.

## 1. Cấu trúc
- **Pool 1: "Sinh viên"** (bên ngoài, tương tác qua Message Flow).
- **Pool 2: "Trường ĐH Kinh tế – ĐH Đà Nẵng"** gồm 4 Lane:
  - L1 **Hệ thống điều phối** (trung tâm tự động hóa)
  - L2 **Cố vấn học tập / Khoa**
  - L3 **Phòng Công tác sinh viên (CTSV)**
  - L4 **Ban Giám hiệu**
- Nền tảng: Cổng thông tin sinh viên + Hệ thống quản lý luồng công việc (workflow).

## 2. Luồng chạy (topology)
Pool Sinh viên (ASSUMPTION: báo cáo chỉ mô tả message flow, phần nội bộ pool SV do ta tự dựng tối giản):
- `SV_START` Start Event: "Sinh viên có nhu cầu nghỉ học tạm thời"
- `SV_T1` User Task: "Điền đơn, đính kèm minh chứng, nộp trực tuyến"
- `MF1` Message Flow "Đơn + minh chứng (trực tuyến)" → `E_START`
- Nhận kết quả: `SV_R1` "Nhận thông báo hồ sơ chưa hợp lệ" (từ MF2), `SV_R2` "Nhận thông báo từ chối" (từ MF3), `SV_R3` "Nhận Quyết định bảo lưu" (từ MF4)

Pool Trường:
1. `E_START` **Message Start Event** "Sinh viên đã nộp đơn trực tuyến"
2. `T1` Kiểm tra tự động tính đầy đủ hồ sơ → tạo `DO1` "Hồ sơ bảo lưu"
3. `G1` **XOR** "Hồ sơ hợp lệ?"
   - **Không** → `T2` Thông báo hồ sơ chưa hợp lệ (gửi `MF2`) → `E_END_RETURNED` "Trả hồ sơ"
   - **Có** → `G2`
4. `G2` **Parallel Gateway (AND split)** — nhân bản token thành 3 nhánh chạy đồng thời:
   - Nhánh A: `T3` Đối chiếu điều kiện học tập và tài chính (đọc `DS1`)
   - Nhánh B: `T4` Xác nhận trực tuyến (Cố vấn), gắn `BT1` Boundary Timer (xem mục 4)
   - Nhánh C: `T5` Thẩm định minh chứng lý do nghỉ học (CTSV)
5. `G3` **Parallel Gateway (AND join)** — chờ đủ 3 nhánh
6. `G4` **XOR** "Đủ điều kiện bảo lưu?"
   - **Không** → `T7` Thông báo không đủ điều kiện (gửi `MF3`) → `E_END_REJECTED` "Từ chối"
   - **Có** → `T8`
7. `T8` Khởi tạo dự thảo quyết định → tạo `DO2` "Dự thảo quyết định"
8. `T9` Ký số quyết định nghỉ học tạm thời (Ban Giám hiệu) → `DO3` "Quyết định nghỉ học tạm thời"
9. `T10` Cập nhật trạng thái sinh viên → ghi `DS2`
10. `T11` Thông báo quyết định cho sinh viên (gửi `MF4`, đính kèm quyết định đã ký số) → `E_END_OK` "Bảo lưu thành công"

Nhánh phụ của timer: `BT1` → `T6` Tự động nhắc cố vấn học tập → `E_END_REMIND` "Hoàn tất nhắc việc".

Data: `DS1` Data Store "CSDL Đào tạo và Tài chính" (T3 đọc). `DS2` Data Store "CSDL Quản lý sinh viên" (T10 ghi). `DO1` Hồ sơ bảo lưu → `DO2` Dự thảo quyết định → `DO3` Quyết định nghỉ học tạm thời (vòng đời hồ sơ điện tử).
Message flow ra Pool SV: `MF2` (từ T2), `MF3` (từ T7), `MF4` (từ T11). Mọi End Event là **None End Event** (vì việc gửi tin đã làm tường minh bằng Send Task phía trước, tránh gửi hai lần).

## 3. Danh mục node (11 task — 8 tự động / 3 người)
Mỗi node có 2 dòng caption dùng hiển thị trên UI khi node chạy (≤ 140 ký tự mỗi dòng ở bản hiển thị).

- **T1 · Kiểm tra tự động tính đầy đủ hồ sơ** — Service Task · L1 *(AI-1 tham gia)*
  - Vì sao tự động hóa: Thay chuyên viên mở từng tệp rà soát thủ công; lọc ngay hồ sơ sai quy cách và phản hồi tức thời cho sinh viên.
  - Vì sao ký hiệu này: Chạy 100% ở backend, không cần người can thiệp; sinh ra đối tượng dữ liệu Hồ sơ bảo lưu.
- **T2 · Thông báo hồ sơ chưa hợp lệ** — Send Task · L1 *(AI-4 soạn lời nhắn)*
  - Vì sao tự động hóa: Bỏ thời gian chờ và công soạn thảo/gửi trả hồ sơ thủ công của cán bộ tiếp nhận.
  - Vì sao ký hiệu này: Send Task để hệ thống đóng gói và đẩy thông điệp (email/thông báo) qua Message Flow sang Pool Sinh viên.
- **T3 · Đối chiếu điều kiện học tập và tài chính** — Business Rule Task · L1 *(KHÔNG dùng AI, chỉ rule engine)*
  - Vì sao tự động hóa: Điều kiện dựa trên quy chế cố định; máy đối chiếu chính xác tuyệt đối, bỏ sai sót chủ quan và công văn qua lại giữa Đào tạo – Tài chính.
  - Vì sao ký hiệu này: Gọi bộ máy quy tắc truy vấn CSDL Đào tạo và Tài chính rồi đánh giá theo tập luật định sẵn.
- **T4 · Xác nhận trực tuyến** — User Task · L2 (Cố vấn học tập) *(AI-3 tóm tắt)*
  - Vì sao tự động hóa: Cố vấn nắm tình hình thực tế để cho ý kiến chuyên môn; số hóa để xác nhận từ xa, sinh viên không phải chạy xin chữ ký.
  - Vì sao ký hiệu này: Vẫn là người làm, nhưng thao tác hoàn toàn trên giao diện phần mềm (xem hồ sơ điện tử, bấm xác nhận).
- **T5 · Thẩm định minh chứng lý do nghỉ học** — User Task · L3 (CTSV) *(AI-3 tóm tắt + cảnh báo bất thường)*
  - Vì sao tự động hóa: Bệnh án, giấy gọi nhập ngũ, minh chứng hoàn cảnh… cần con người kiểm tra tính xác thực và hợp pháp; máy không phán đoán được 100%.
  - Vì sao ký hiệu này: Chuyên viên mở tệp minh chứng số hóa trên màn hình và tích chọn kết quả thẩm định.
- **T6 · Tự động nhắc cố vấn học tập** — Service Task · L1
  - Vì sao tự động hóa: Chặn hồ sơ bị "ngâm" quá hạn, giải phóng nhân sự hành chính khỏi việc theo dõi, gọi điện nhắc.
  - Vì sao ký hiệu này: Khi Boundary Timer đủ 3 ngày làm việc, hệ thống tự chạy Service Task gửi cảnh báo vào tài khoản Cố vấn.
- **T7 · Thông báo không đủ điều kiện** — Send Task · L1 *(AI-4 giải thích lý do từ chối)*
  - Vì sao tự động hóa: Sinh viên nhận phản hồi từ chối kèm lý do rõ ràng ngay khi xét duyệt xong, không tốn xử lý văn thư.
  - Vì sao ký hiệu này: Hệ thống tự kích hoạt Send Task bắn "Thông báo từ chối bảo lưu" về Pool Sinh viên.
- **T8 · Khởi tạo dự thảo quyết định** — Service Task · L1 *(AI-4 soạn phần căn cứ)*
  - Vì sao tự động hóa: Quyết định có mẫu chuẩn; tự trích thông tin vào biểu mẫu, hết lỗi gõ sai họ tên, mã sinh viên, thời hạn bảo lưu.
  - Vì sao ký hiệu này: Dịch vụ trộn văn bản chạy nền, sinh Data Object Dự thảo quyết định.
- **T9 · Ký số quyết định nghỉ học tạm thời** — User Task · L4 (Ban Giám hiệu)
  - Vì sao tự động hóa: Thẩm quyền pháp lý thuộc Ban Giám hiệu; ký số cho phép phê duyệt mọi lúc mọi nơi, bỏ in ấn, trình ký, đóng dấu đỏ thủ công.
  - Vì sao ký hiệu này: Người đại diện BGH trực tiếp kiểm tra dự thảo và xác thực chữ ký số, tạo ra Quyết định nghỉ học tạm thời.
- **T10 · Cập nhật trạng thái sinh viên** — Service Task · L1
  - Vì sao tự động hóa: Ngay khi quyết định được ký, trạng thái chuyển "Bảo lưu" tức thì, không trễ, không quên, không sai danh sách lớp/học phí.
  - Vì sao ký hiệu này: Hệ thống ghi thẳng vào CSDL Quản lý sinh viên qua Data Output Association, giáo vụ không nhập lại.
- **T11 · Thông báo quyết định cho sinh viên** — Send Task · L1
  - Vì sao tự động hóa: Sinh viên nhận ngay quyết định hợp pháp trực tuyến, không phải lên trường lấy bản giấy ở bộ phận một cửa.
  - Vì sao ký hiệu này: Send Task tự đính kèm quyết định đã ký số, gửi qua Message Flow tới Pool Sinh viên trước khi đóng quy trình.

## 4. Sự kiện & cổng
- **E_START — Message Start Event.** Lắng nghe gói tin "Đơn + minh chứng (trực tuyến)", tự khởi tạo phiên quy trình; thay nộp giấy tại bàn tiếp nhận bằng tiếp nhận 24/7.
- **BT1 — Boundary Timer Event (non-interrupting)** gắn vào T4, viền nét đứt. Sau **3 ngày làm việc** chưa xác nhận → tách nhánh phụ chạy T6, **không hủy** T4 đang chờ.
- **G1, G4 — Exclusive Gateway (XOR).** Mỗi điểm chỉ một nhánh đúng, dựa trên biến trạng thái bước trước.
- **G2 / G3 — Parallel Gateway (AND).** Split nhân bản token kích hoạt 3 việc đồng thời; join đồng bộ, đợi cả 3 xong mới chạy tiếp. Đây là chỗ rút ngắn thời gian so với As-Is tuần tự.
- **End Events (None):** Trả hồ sơ · Từ chối · Hoàn tất nhắc việc · Bảo lưu thành công.

## 5. Biến trạng thái của một ca (case state)
- `form`: họ tên, MSSV, lớp, khoa, SĐT, email, lý do nghỉ, số học kỳ nghỉ, học kỳ bắt đầu, cam kết.
- `evidence[]`: danh sách minh chứng đính kèm (loại, tên, nội dung giả lập).
- `validity` = `{ complete: boolean, missing: string[], evidenceOk: boolean }` (do T1) → G1 rẽ nhánh.
- `ruleResult` = `{ pass: boolean, violations: string[] }` (do T3).
- `advisor` = `{ status: 'pending'|'confirmed'|'declined', remindedAt?: day }` (T4).
- `ctsv` = `{ status: 'pending'|'valid'|'invalid', notes?: string }` (T5).
- `eligible` = `ruleResult.pass && advisor.status==='confirmed' && ctsv.status==='valid'` → G4 rẽ nhánh. **ASSUMPTION:** báo cáo nói "xét điều kiện tổng thể" sau join; ta định nghĩa tổng thể = cả 3 điều kiện đều đạt.
- `studentStatus`: 'Đang học' → 'Bảo lưu' (T10 ghi vào DS2).
- `messages[]`: thông điệp đã gửi tới sinh viên (MF2/MF3/MF4) + thông báo nhắc cố vấn (T6).

## 6. Bộ quy tắc T3 (Business Rule) — dữ liệu GIẢ LẬP, cấu hình được
Báo cáo chỉ nêu 4 nhóm: số học kỳ đã học, điểm học phần, tình trạng kỷ luật, công nợ học phí. Ta cụ thể hóa (ASSUMPTION — nhóm thay bằng quy chế thật của DUE nếu có):
- `R1` Đã học tối thiểu 1 học kỳ.
- `R2` Không đang trong thời gian bị kỷ luật (cảnh cáo/đình chỉ còn hiệu lực).
- `R3` Công nợ học phí = 0.
- `R4` Không thuộc diện buộc thôi học theo kết quả học tập (cờ trong CSDL Đào tạo).
Mỗi rule trả `{ id, label, passed, detail }` để UI hiển thị từng dòng tick/cross.

## 7. Timer & thời gian giả lập
- Đồng hồ ảo tính theo **ngày làm việc** (bắt đầu Ngày 0 khi nộp đơn). Mọi task tự động tốn ~0 ngày; task người chờ người thao tác.
- `BT1` hẹn bắn ở `ngày giao T4 + 3`. UI có nút "Tua +1 ngày / +3 ngày" để demo timer mà không phải chờ.
- Ở chế độ Director, các user task tự hoàn tất sau delay giả lập và tính thời gian ảo (vd Cố vấn mất 1 ngày, CTSV 2 ngày, BGH 1 ngày) — cấu hình ở kịch bản.

## 8. Số liệu tự động hóa (hiển thị ở báo cáo cuối ca)
- 11 task: **8 tự động hoàn toàn** (4 Service + 3 Send + 1 Business Rule) = 72,7%; **3 User Task** (T4, T5, T9) giữ lại vì cần thẩm định chuyên môn & trách nhiệm pháp lý.
- Thời gian: từ "nhiều ngày luân chuyển giấy tờ" xuống còn thời gian chờ thẩm định trực tuyến, có SLA 3 ngày làm việc ở khâu Cố vấn.
- Minh bạch: mọi trạng thái được ghi vết tự động và thông báo tức thời cho sinh viên qua Message Flow.

## 9. Chuẩn bị Q&A (điểm thầy có thể hỏi — nhóm tự soi)
- Nếu T3 fail sớm, T4 và T5 vẫn chạy song song rồi mới dồn về join → tốn công người vô ích. Hướng cải tiến: Event-based/Terminate hoặc cổng chặn sớm. (Mô hình hiện tại giữ nguyên theo báo cáo, demo hiển thị đúng như vậy.)
- Cố vấn "không xác nhận" thì sao? Báo cáo chưa mô tả; ta coi là `declined` → G4 = Không → T7.
- Timer chỉ nhắc 1 lần, không leo thang (escalation). Có thể đề xuất mở rộng.
- Vì sao T3 không dùng AI? Vì quy chế cố định → rule engine cho kết quả chính xác, kiểm toán được; AI chỉ hỗ trợ khâu có tính phán đoán/ngôn ngữ.
- Vì sao None End Event mà không Message End Event? Đã có Send Task gửi tin tường minh phía trước.
