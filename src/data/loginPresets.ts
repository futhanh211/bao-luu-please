import { Role } from '../store/useApp';

export interface DemoStudentPreset {
  mssv: string;
  name: string;
  className: string;
  faculty: string;
  scenarioId: string;
  scenarioCode: string;
  tag: string;
  desc: string;
}

export const DEMO_STUDENT_PRESETS: DemoStudentPreset[] = [
  {
    mssv: '3121102001',
    name: 'Nguyễn Minh Khoa',
    className: '47K12.1',
    faculty: 'Khoa CNTT Kinh doanh',
    scenarioId: 's1',
    scenarioCode: 'S1',
    tag: 'S1 · Ốm dài ngày (Chuẩn)',
    desc: 'Đầy đủ giấy ra viện bệnh viện tuyến tỉnh, không nợ học phí.',
  },
  {
    mssv: '3121102002',
    name: 'Trần Thu Hà',
    className: '47K01.2',
    faculty: 'Khoa Quản trị kinh doanh',
    scenarioId: 's2',
    scenarioCode: 'S2',
    tag: 'S2 · Quên minh chứng (Tự động trả đơn)',
    desc: 'Lý do sức khỏe nhưng quên đính kèm giấy ra viện hợp lệ.',
  },
  {
    mssv: '3121102003',
    name: 'Lê Tuấn Kiệt',
    className: '47K08.1',
    faculty: 'Khoa Tài chính - Ngân hàng',
    scenarioId: 's3',
    scenarioCode: 'S3',
    tag: 'S3 · Nợ học phí (Từ chối theo R3)',
    desc: 'Hoàn cảnh gia đình nhưng CSDL tài chính báo nợ 7.500.000 VNĐ.',
  },
  {
    mssv: '3121102004',
    name: 'Phạm Ngọc Anh',
    className: '47K02.1',
    faculty: 'Khoa Kế toán',
    scenarioId: 's4',
    scenarioCode: 'S4',
    tag: 'S4 · Quá hạn SLA (Boundary Timer)',
    desc: 'Giao lưu quốc tế, Cố vấn học tập ngâm hồ sơ quá 3 ngày.',
  },
  {
    mssv: '3121102005',
    name: 'Hoàng Khánh Linh',
    className: '47K15.2',
    faculty: 'Khoa TMĐT',
    scenarioId: 's5',
    scenarioCode: 'S5',
    tag: 'S5 · Bất thường (AI soi & Từ chối)',
    desc: 'Giấy tờ y tế có dấu hiệu sai lệch ngày tháng xuất viện.',
  },
];

export interface OfficerCardSpec {
  username: string;
  targetRole: Role;
  name: string;
  title: string;
  department: string;
  avatar: string;
  laneCode: string;
  laneLabel: string;
  bpmnSteps: string;
}

export const OFFICER_CARD_SPECS: OfficerCardSpec[] = [
  {
    username: 'advisor_nam',
    targetRole: 'advisor',
    name: 'TS. Lê Hoài Nam',
    title: 'Cố vấn học tập',
    department: 'Khoa CNTT Kinh doanh',
    avatar: '👨‍🏫',
    laneCode: 'LANE L2',
    laneLabel: 'Cố vấn học tập',
    bpmnSteps: 'Bước T4 (Phỏng vấn & Ghi ý kiến tư vấn)',
  },
  {
    username: 'ctsv_mai',
    targetRole: 'ctsv',
    name: 'ThS. Nguyễn Thị Mai',
    title: 'Chuyên viên thẩm tra hồ sơ',
    department: 'Phòng Công tác sinh viên',
    avatar: '👩‍💼',
    laneCode: 'LANE L3',
    laneLabel: 'Phòng CTSV',
    bpmnSteps: 'Bước T5 · T6 · T7 · T8 (Thẩm tra & Dự thảo Quyết định)',
  },
  {
    username: 'bgh_khoi',
    targetRole: 'principal',
    name: 'PGS.TS. Trần Đình Khôi',
    title: 'Phó Hiệu trưởng',
    department: 'Ban Giám hiệu nhà trường',
    avatar: '🏛️',
    laneCode: 'LANE L4',
    laneLabel: 'Ban Giám hiệu',
    bpmnSteps: 'Bước T9 (Phê duyệt & Ký số Quyết định)',
  },
];
