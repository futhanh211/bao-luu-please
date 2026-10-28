export interface NodeCaption {
  whyAutomated: string;
  whySymbol: string;
}

export const NODE_CAPTIONS: Record<string, NodeCaption> = {
  E_START: {
    whyAutomated: 'Tiếp nhận đơn trực tuyến 24/7, tự động khởi tạo phiên quy trình mà không cần cán bộ trực bàn một cửa.',
    whySymbol: 'Message Start Event bắt đầu quy trình khi nhận được gói tin dữ liệu qua Message Flow MF1.',
  },
  T1: {
    whyAutomated: 'Thay chuyên viên mở từng tệp rà soát thủ công; lọc ngay hồ sơ sai quy cách và phản hồi tức thời cho sinh viên.',
    whySymbol: 'Chạy 100% ở backend, không cần người can thiệp; sinh ra đối tượng dữ liệu Hồ sơ bảo lưu.',
  },
  G1: {
    whyAutomated: 'Tự động phân nhánh ngay tức khắc: trả hồ sơ nếu thiếu minh chứng, đi tiếp nếu hồ sơ đầy đủ.',
    whySymbol: 'Exclusive Gateway (XOR) chỉ chọn duy nhất 1 nhánh dựa trên thuộc tính validity.',
  },
  T2: {
    whyAutomated: 'Bỏ thời gian chờ và công soạn thảo/gửi trả hồ sơ thủ công của cán bộ tiếp nhận.',
    whySymbol: 'Send Task để hệ thống đóng gói và đẩy thông điệp qua Message Flow sang Pool Sinh viên.',
  },
  E_END_RETURNED: {
    whyAutomated: 'Đóng phiên xử lý trả hồ sơ để sinh viên hoàn thiện lại từ đầu.',
    whySymbol: 'None End Event kết thúc nhánh trả hồ sơ sau khi đã gửi thông điệp tường minh qua T2.',
  },
  G2: {
    whyAutomated: 'Kích hoạt 3 nhánh nghiệp vụ xử lý đồng thời, rút ngắn chu kỳ quy trình gấp 3 lần so với As-Is tuần tự.',
    whySymbol: 'Parallel Gateway (AND Split) nhân bản 1 token thành 3 token chạy độc lập.',
  },
  T3: {
    whyAutomated: 'Điều kiện dựa trên quy chế cố định; máy đối chiếu chính xác tuyệt đối, bỏ sai sót chủ quan và công văn qua lại giữa Đào tạo – Tài chính.',
    whySymbol: 'Gọi bộ máy quy tắc truy vấn CSDL Đào tạo và Tài chính rồi đánh giá theo tập luật định sẵn.',
  },
  T4: {
    whyAutomated: 'Cố vấn nắm tình hình thực tế để cho ý kiến chuyên môn; số hóa để xác nhận từ xa, sinh viên không phải chạy xin chữ ký.',
    whySymbol: 'Vẫn là người làm, nhưng thao tác hoàn toàn trên giao diện phần mềm (xem hồ sơ điện tử, bấm xác nhận).',
  },
  BT1: {
    whyAutomated: 'Tự động kiểm soát SLA cam kết 3 ngày làm việc mà không cần nhân sự theo dõi thủ công.',
    whySymbol: 'Boundary Timer Event (non-interrupting) gắn cạnh T4; kích hoạt nhánh nhắc việc khi quá hạn mà không hủy T4.',
  },
  T5: {
    whyAutomated: 'Bệnh án, giấy gọi nhập ngũ, minh chứng hoàn cảnh… cần con người kiểm tra tính xác thực và hợp pháp; máy không phán đoán được 100%.',
    whySymbol: 'Chuyên viên mở tệp minh chứng số hóa trên màn hình và tích chọn kết quả thẩm định.',
  },
  T6: {
    whyAutomated: 'Chặn hồ sơ bị "ngâm" quá hạn, giải phóng nhân sự hành chính khỏi việc theo dõi, gọi điện nhắc.',
    whySymbol: 'Khi Boundary Timer đủ 3 ngày làm việc, hệ thống tự chạy Service Task gửi cảnh báo vào tài khoản Cố vấn.',
  },
  E_END_REMIND: {
    whyAutomated: 'Hoàn tất chu trình nhắc việc độc lập cho Cố vấn học tập.',
    whySymbol: 'None End Event kết thúc luồng phụ nhắc nhở.',
  },
  G3: {
    whyAutomated: 'Tự động kiểm tra và đồng bộ hóa: chỉ đi tiếp khi cả 3 nhánh điều kiện, cố vấn và CTSV đều đã hoàn tất.',
    whySymbol: 'Parallel Gateway (AND Join) đợi đủ 3 token hội tụ trước khi chuyển token đơn tiếp tục.',
  },
  G4: {
    whyAutomated: 'Đối chiếu kết quả tổng hợp 3 khâu thẩm định hoàn toàn khách quan theo thuật toán logic.',
    whySymbol: 'Exclusive Gateway (XOR) rẽ nhánh: Đạt đi tiếp phê duyệt, Chưa đạt chuyển sang từ chối.',
  },
  T7: {
    whyAutomated: 'Sinh viên nhận phản hồi từ chối kèm lý do rõ ràng ngay khi xét duyệt xong, không tốn xử lý văn thư.',
    whySymbol: 'Hệ thống tự kích hoạt Send Task bắn "Thông báo từ chối bảo lưu" về Pool Sinh viên.',
  },
  E_END_REJECTED: {
    whyAutomated: 'Đóng ca xử lý đối với các trường hợp không đủ điều kiện.',
    whySymbol: 'None End Event kết thúc quy trình không đạt.',
  },
  T8: {
    whyAutomated: 'Quyết định có mẫu chuẩn; tự trích thông tin vào biểu mẫu, hết lỗi gõ sai họ tên, mã sinh viên, thời hạn bảo lưu.',
    whySymbol: 'Dịch vụ trộn văn bản chạy nền, sinh Data Object Dự thảo quyết định.',
  },
  T9: {
    whyAutomated: 'Thẩm quyền pháp lý thuộc Ban Giám hiệu; ký số cho phép phê duyệt mọi lúc mọi nơi, bỏ in ấn, trình ký, đóng dấu đỏ thủ công.',
    whySymbol: 'Người đại diện BGH trực tiếp kiểm tra dự thảo và xác thực chữ ký số, tạo ra Quyết định nghỉ học tạm thời.',
  },
  T10: {
    whyAutomated: 'Ngay khi quyết định được ký, trạng thái chuyển "Bảo lưu" tức thì, không trễ, không quên, không sai danh sách lớp/học phí.',
    whySymbol: 'Hệ thống ghi thẳng vào CSDL Quản lý sinh viên qua Data Output Association, giáo vụ không nhập lại.',
  },
  T11: {
    whyAutomated: 'Sinh viên nhận ngay quyết định hợp pháp trực tuyến, không phải lên trường lấy bản giấy ở bộ phận một cửa.',
    whySymbol: 'Send Task tự đính kèm quyết định đã ký số, gửi qua Message Flow tới Pool Sinh viên trước khi đóng quy trình.',
  },
  E_END_OK: {
    whyAutomated: 'Thủ tục bảo lưu hoàn tất thành công 100% qua môi trường số hóa.',
    whySymbol: 'None End Event hoàn tất quy trình thành công.',
  },
};
