// M7 - Trạm + số ngày As-Is (quy trình giấy hiện hành tại ĐH Kinh tế – ĐH Đà Nẵng).
// Dữ liệu dùng cho màn mô phỏng As-Is (AsIs.tsx) và so sánh trong Báo cáo cuối ca (CaseReport.tsx).

export interface AsIsStation {
  id: string;
  name: string;
  role: string;
  days: number;
  location: string;
  action: string;
  gag: string;
}

export interface AsIsSummary {
  paperwork: string;
  travel: string;
  bottlenecks: string;
}

export interface AsIsConfig {
  stations: AsIsStation[];
  /** Tổng số ngày của quy trình giấy (As-Is). */
  days: number;
  summary: AsIsSummary;
}

export const ASIS_CONFIG: AsIsConfig = {
  days: 22,
  summary: {
    paperwork: '100% hồ sơ giấy (đơn in, bản sao y, kẹp ghim, 4 lần ký tay, 2 con dấu mộc đỏ)',
    travel: 'Sinh viên trực tiếp di chuyển 5 tòa nhà/phòng ban khác nhau trong khuôn viên',
    bottlenecks: 'Tuần tự hoàn toàn; chữ ký lãnh đạo và công văn văn thư thường xuyên bị nghẽn',
  },
  stations: [
    {
      id: 'st_reception',
      name: 'Tiếp nhận Một Cửa',
      role: 'Chuyên viên tiếp nhận',
      days: 2,
      location: 'Khu Đa Năng — Tầng 1',
      action: 'Nộp đơn giấy in + kẹp bản sao y chứng từ',
      gag: 'Hồ sơ nằm trong khay chờ gom đủ đợt chuyển tiếp...',
    },
    {
      id: 'st_advisor',
      name: 'Cố vấn học tập',
      role: 'Giảng viên cố vấn',
      days: 3,
      location: 'Văn phòng Khoa chuyên ngành',
      action: 'Xin ý kiến nhận xét & ký tay vào đơn giấy',
      gag: 'Thầy cố vấn bận lịch chấm thi và họp hội đồng, hẹn tuần sau...',
    },
    {
      id: 'st_ctsv',
      name: 'Phòng CTSV',
      role: 'Cán bộ quản lý hồ sơ',
      days: 4,
      location: 'Tòa nhà A — Phòng 104',
      action: 'Kiểm tra hồ sơ sinh viên, đối chiếu sổ sách',
      gag: 'Hồ sơ kẹp ghim xếp chồng chờ cán bộ đối soát hộ tịch thủ công...',
    },
    {
      id: 'st_academic',
      name: 'Phòng Đào tạo',
      role: 'Chuyên viên học vụ',
      days: 3,
      location: 'Tòa nhà A — Phòng 202',
      action: 'Kiểm tra điều kiện tín chỉ & học vụ',
      gag: 'Tra cứu bảng điểm và học phần lưu trữ trong kho lưu trữ giấy...',
    },
    {
      id: 'st_finance',
      name: 'Phòng Kế hoạch - Tài chính',
      role: 'Kế toán viên học phí',
      days: 3,
      location: 'Tòa nhà B — Phòng 108',
      action: 'Đối soát công nợ & học phí sinh viên',
      gag: 'Chờ kế toán đối chiếu sổ ngân hàng cuối tuần mới xác nhận...',
    },
    {
      id: 'st_principal',
      name: 'Ban Giám hiệu',
      role: 'Phó Hiệu trưởng',
      days: 4,
      location: 'Tòa nhà Hiệu bộ — Tầng 3',
      action: 'Phê duyệt & ký bút mực vào bản in Quyết định',
      gag: 'Lãnh đạo đi công tác dài ngày — hồ sơ lưu phòng chờ trình ký...',
    },
    {
      id: 'st_clerk',
      name: 'Bộ phận Văn thư',
      role: 'Văn thư trường',
      days: 2,
      location: 'Tòa nhà Hiệu bộ — Tầng 1',
      action: 'Đóng dấu mộc tròn đỏ & vào sổ công văn giấy',
      gag: 'Cô văn thư đi ăn trưa và họp giao ban — hẹn 2 ngày sau quay lại...',
    },
    {
      id: 'st_result',
      name: 'Trả kết quả giấy',
      role: 'Bộ phận Một Cửa',
      days: 1,
      location: 'Khu Đa Năng — Cửa số 2',
      action: 'Sinh viên nhận quyết định bản in có mộc đỏ',
      gag: 'Hoàn tất sau 22 ngày ròng rã và hơn 10 lượt đi lại giữa các tòa nhà!',
    },
  ],
};
