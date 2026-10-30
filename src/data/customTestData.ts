import { EvidenceItem, StudentApplicationForm } from '../engine/types';
import { InMemoryStudentsDB } from './students.db';
import { InMemoryAcademicFinanceDB } from './academic-finance.db';

export type CustomEvidencePreset =
  | 'valid_medical'
  | 'suspicious_medical'
  | 'military'
  | 'hardship'
  | 'personal'
  | 'none';

export const CUSTOM_EVIDENCE_OPTIONS: { id: CustomEvidencePreset; label: string }[] = [
  { id: 'valid_medical', label: 'Giấy ra viện Bệnh viện Đa khoa (Hợp lệ, có dấu đỏ)' },
  { id: 'suspicious_medical', label: 'Giấy ra viện nghi vấn (Lệch tên, sai ngày, thiếu dấu)' },
  { id: 'military', label: 'Lệnh gọi nhập ngũ BCH Quân sự (Hợp lệ)' },
  { id: 'hardship', label: 'Giấy xác nhận hoàn cảnh khó khăn UBND (Hợp lệ)' },
  { id: 'personal', label: 'Giấy tờ / Đơn giải trình lý do cá nhân khác' },
  { id: 'none', label: 'Không đính kèm minh chứng nào' },
];

export interface CustomTestDataConfig {
  // 1. Thông tin sinh viên (DS2)
  fullName: string;
  mssv: string;
  className: string;
  faculty: string;
  phone: string;
  email: string;

  // 2. Thông tin đơn xin nghỉ
  reason: StudentApplicationForm['reason'];
  semesterCount: 1 | 2;
  startSemester: string;
  commitment: boolean;

  // 3. Dữ liệu Đào tạo & Tài chính (DS1) — kiểm thử R1 - R4
  semestersCompleted: number; // R1 >= 1
  discipline: 'none' | 'warning' | 'suspended'; // R2 === 'none'
  tuitionDebt: number; // R3 === 0
  forcedWithdrawal: boolean; // R4 === false
  gpaNote?: string;

  // 4. Loại minh chứng
  evidencePreset: CustomEvidencePreset;
}

export function buildCustomEvidence(
  preset: CustomEvidencePreset,
  studentName: string
): EvidenceItem[] {
  switch (preset) {
    case 'valid_medical':
      return [
        {
          id: 'ev_custom_med',
          type: 'medical_record',
          name: 'Giấy ra viện Bệnh viện Đa khoa Đà Nẵng',
          content: 'Chẩn đoán: Hậu phẫu chấn thương thể thao, chỉ định phục hồi chức năng 6 tháng.',
          fields: [
            { id: 'hospital', label: 'Bệnh viện', value: 'Bệnh viện Đa khoa Đà Nẵng' },
            { id: 'patientName', label: 'Họ tên bệnh nhân', value: studentName },
            { id: 'admissionDate', label: 'Ngày vào viện', value: '02/09/2026' },
            { id: 'dischargeDate', label: 'Ngày ra viện', value: '18/09/2026' },
            { id: 'hospitalStamp', label: 'Dấu bệnh viện', value: 'Có dấu đỏ' },
          ],
        },
      ];

    case 'suspicious_medical':
      return [
        {
          id: 'ev_custom_sus',
          type: 'medical_record',
          name: 'Giấy ra viện Bệnh viện Đa khoa (Có nghi vấn)',
          content: 'Chẩn đoán: Điều trị chấn thương.',
          fields: [
            { id: 'hospital', label: 'Bệnh viện', value: 'Bệnh viện Đa khoa Đà Nẵng' },
            { id: 'patientName', label: 'Họ tên bệnh nhân', value: `${studentName} (sai 1 chữ)` },
            { id: 'admissionDate', label: 'Ngày vào viện', value: '18/09/2026' },
            { id: 'dischargeDate', label: 'Ngày ra viện', value: '02/09/2026 (trước ngày vào viện)' },
            { id: 'hospitalStamp', label: 'Dấu bệnh viện', value: 'Không có dấu đỏ' },
          ],
          issueNotes: 'Tên bệnh nhân lệch, ngày ra viện trước ngày vào viện và thiếu dấu đỏ.',
        },
      ];

    case 'military':
      return [
        {
          id: 'ev_custom_mil',
          type: 'military_call',
          name: 'Lệnh gọi công dân nhập ngũ BCH Quân sự',
          content: 'Lệnh nhập ngũ thực hiện nghĩa vụ quân sự đợt 2 năm 2026.',
          fields: [
            { id: 'unit', label: 'Đơn vị ban hành', value: 'BCH Quân sự quận Hải Châu - TP Đà Nẵng' },
            { id: 'citizenName', label: 'Công dân', value: studentName },
            { id: 'reportDate', label: 'Ngày tập trung', value: '15/09/2026' },
            { id: 'stamp', label: 'Dấu đơn vị', value: 'Có dấu mộc đỏ BCH Quân sự' },
          ],
        },
      ];

    case 'hardship':
      return [
        {
          id: 'ev_custom_hard',
          type: 'hardship_proof',
          name: 'Giấy xác nhận hoàn cảnh khó khăn UBND Phường',
          content: 'Gia đình gặp biến cố kinh tế đặc biệt nghiêm trọng do thiên tai.',
          fields: [
            { id: 'authority', label: 'Cơ quan xác nhận', value: 'UBND Phường Thạch Thang' },
            { id: 'citizenName', label: 'Họ tên', value: studentName },
            { id: 'reason', label: 'Lý do', value: 'Gia đình hoàn cảnh khó khăn' },
            { id: 'stamp', label: 'Dấu xác nhận', value: 'Có dấu đỏ UBND' },
          ],
        },
      ];

    case 'personal':
      return [
        {
          id: 'ev_custom_pers',
          type: 'personal_reason',
          name: 'Giấy tờ minh chứng lý do cá nhân khác',
          content: 'Đơn giải trình tham gia đợt thực tập / học tập nâng cao cá nhân có hợp đồng liên kết ngoài trường.',
          fields: [
            { id: 'organization', label: 'Đơn vị tiếp nhận', value: 'Đơn vị thực tập / tiếp nhận ngoài trường' },
            { id: 'citizenName', label: 'Họ tên', value: studentName },
            { id: 'purpose', label: 'Mục đích', value: 'Thực tập, trải nghiệm nghề nghiệp ngoài trường' },
            { id: 'stamp', label: 'Xác nhận', value: 'Có xác nhận và chữ ký hợp lệ' },
          ],
        },
      ];

    case 'none':
    default:
      return [];
  }
}

export type StudentEvidenceOptionKey =
  | 'medical'
  | 'military'
  | 'hardship'
  | 'personal';

export interface StudentEvidenceOption {
  key: StudentEvidenceOptionKey;
  icon: string;
  title: string;
  description: string;
  matchingReason: StudentApplicationForm['reason'];
  buildItem: (studentName: string) => EvidenceItem;
}

export const STUDENT_EVIDENCE_OPTIONS: StudentEvidenceOption[] = [
  {
    key: 'medical',
    icon: '🏥',
    title: 'Giấy xác nhận của bệnh viện',
    description: 'Bệnh viện Đa khoa Đà Nẵng (Có dấu mộc đỏ)',
    matchingReason: 'Ốm đau/tai nạn điều trị dài',
    buildItem: (name) => ({
      id: 'ev_custom_med',
      type: 'medical_record',
      name: 'Giấy xác nhận của bệnh viện (BV Đa khoa Đà Nẵng)',
      content: 'Chẩn đoán: Hậu phẫu chấn thương thể thao, chỉ định điều trị và phục hồi chức năng 6 tháng.',
      fields: [
        { id: 'hospital', label: 'Bệnh viện', value: 'Bệnh viện Đa khoa Đà Nẵng' },
        { id: 'patientName', label: 'Họ tên bệnh nhân', value: name },
        { id: 'admissionDate', label: 'Ngày vào viện', value: '02/09/2026' },
        { id: 'dischargeDate', label: 'Ngày ra viện', value: '18/09/2026' },
        { id: 'hospitalStamp', label: 'Dấu bệnh viện', value: 'Có dấu đỏ tròn Bệnh viện' },
      ],
    }),
  },
  {
    key: 'military',
    icon: '🪖',
    title: 'Giấy đi nghĩa vụ quân sự',
    description: 'Lệnh gọi công dân nhập ngũ BCH Quân sự',
    matchingReason: 'Nghĩa vụ quân sự',
    buildItem: (name) => ({
      id: 'ev_custom_mil',
      type: 'military_call',
      name: 'Giấy đi nghĩa vụ quân sự (Lệnh gọi BCH Quân sự)',
      content: 'Lệnh nhập ngũ thực hiện nghĩa vụ quân sự bảo vệ Tổ quốc đợt 2 năm 2026.',
      fields: [
        { id: 'unit', label: 'Đơn vị ban hành', value: 'BCH Quân sự quận Hải Châu - TP Đà Nẵng' },
        { id: 'citizenName', label: 'Công dân', value: name },
        { id: 'reportDate', label: 'Ngày tập trung', value: '15/09/2026' },
        { id: 'stamp', label: 'Dấu đơn vị', value: 'Có dấu mộc đỏ BCH Quân sự' },
      ],
    }),
  },
  {
    key: 'hardship',
    icon: '🏡',
    title: 'Giấy chứng minh hoàn cảnh gia đình',
    description: 'Xác nhận hoàn cảnh khó khăn của UBND Phường/Xã',
    matchingReason: 'Hoàn cảnh gia đình',
    buildItem: (name) => ({
      id: 'ev_custom_hard',
      type: 'hardship_proof',
      name: 'Giấy chứng minh hoàn cảnh gia đình (UBND)',
      content: 'Xác nhận gia đình gặp biến cố kinh tế đặc biệt nghiêm trọng do thiên tai, cần phụ giúp gia đình.',
      fields: [
        { id: 'authority', label: 'Cơ quan xác nhận', value: 'UBND Phường Thạch Thang' },
        { id: 'citizenName', label: 'Họ tên', value: name },
        { id: 'reason', label: 'Lý do', value: 'Gia đình hoàn cảnh khó khăn' },
        { id: 'stamp', label: 'Dấu xác nhận', value: 'Có dấu đỏ UBND' },
      ],
    }),
  },
  {
    key: 'personal',
    icon: '📝',
    title: 'Lý do cá nhân khác',
    description: 'Đơn trình bày lý do cá nhân / Xác nhận thực tập ngoài trường',
    matchingReason: 'Lý do cá nhân khác',
    buildItem: (name) => ({
      id: 'ev_custom_pers',
      type: 'personal_reason',
      name: 'Giấy tờ minh chứng lý do cá nhân khác',
      content: 'Đơn giải trình tham gia đợt thực tập / học tập nâng cao cá nhân có hợp đồng liên kết ngoài trường.',
      fields: [
        { id: 'organization', label: 'Đơn vị tiếp nhận', value: 'Đơn vị tiếp nhận thực tập ngoài trường' },
        { id: 'citizenName', label: 'Họ tên', value: name },
        { id: 'purpose', label: 'Mục đích', value: 'Thực tập, trải nghiệm nghề nghiệp ngoài trường' },
        { id: 'stamp', label: 'Xác nhận', value: 'Có xác nhận và chữ ký hợp lệ' },
      ],
    }),
  },
];

export interface CustomPreset {
  id: string;
  label: string;
  shortLabel: string;
  tag: string;
  tagColor: 'green' | 'amber' | 'red';
  description: string;
  expectedOutcome: string;
  config: CustomTestDataConfig;
}

export const CUSTOM_PRESETS: CustomPreset[] = [
  {
    id: 'happy_path',
    label: '🌟 Chuẩn (Đủ điều kiện bảo lưu)',
    shortLabel: '🌟 Chuẩn',
    tag: 'Thành công',
    tagColor: 'green',
    description: 'Sinh viên tích lũy 3 kỳ, không nợ, không kỷ luật, giấy ra viện hợp lệ.',
    expectedOutcome: 'Bảo lưu thành công (E_END_OK)',
    config: {
      fullName: 'Trần Văn Test',
      mssv: '3121109999',
      className: '47K12.1',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      phone: '0905999888',
      email: 'test.tv@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 3,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      gpaNote: 'GPA tích lũy: 3.20 / 4.0 - Học lực Khá',
      evidencePreset: 'valid_medical',
    },
  },
  {
    id: 'fail_r3_debt',
    label: '❌ Vi phạm R3: Nợ tiền học phí',
    shortLabel: '❌ Nợ học phí',
    tag: 'Từ chối R3',
    tagColor: 'red',
    description: 'Còn nợ 7.500.000 VNĐ học phí. Hệ thống phát hiện tại T3 và từ chối tại G4.',
    expectedOutcome: 'Từ chối tại G4 (E_END_REJECTED)',
    config: {
      fullName: 'Lê Tuấn Vũ',
      mssv: '3121109903',
      className: '47K08.1',
      faculty: 'Khoa Tài chính - Ngân hàng',
      phone: '0905333444',
      email: 'vu.lt@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 3,
      discipline: 'none',
      tuitionDebt: 7500000,
      forcedWithdrawal: false,
      gpaNote: 'GPA tích lũy: 2.85 / 4.0',
      evidencePreset: 'valid_medical',
    },
  },
  {
    id: 'fail_r1_semester',
    label: '❌ Vi phạm R1: Chưa học đủ 1 kỳ',
    shortLabel: '❌ Chưa đủ 1 kỳ',
    tag: 'Từ chối R1',
    tagColor: 'red',
    description: 'Sinh viên năm nhất chưa tích lũy đủ 1 học kỳ đầu tiên (semestersCompleted = 0).',
    expectedOutcome: 'Từ chối tại G4 (E_END_REJECTED)',
    config: {
      fullName: 'Vũ Hải Nam',
      mssv: '3121109907',
      className: '48K12.2',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      phone: '0905777888',
      email: 'nam.vh@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 1,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 0,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      gpaNote: 'Chưa có kết quả học kỳ đầu',
      evidencePreset: 'valid_medical',
    },
  },
  {
    id: 'fail_r2_discipline',
    label: '❌ Vi phạm R2: Đang bị kỷ luật',
    shortLabel: '❌ Bị kỷ luật',
    tag: 'Từ chối R2',
    tagColor: 'red',
    description: 'Đang trong thời gian thi hành quyết định kỷ luật Cảnh cáo toàn trường.',
    expectedOutcome: 'Từ chối tại G4 (E_END_REJECTED)',
    config: {
      fullName: 'Phan Quốc Việt',
      mssv: '3121109908',
      className: '46K21.1',
      faculty: 'Khoa Kinh tế',
      phone: '0905888999',
      email: 'viet.pq@due.edu.vn',
      reason: 'Hoàn cảnh gia đình',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 4,
      discipline: 'warning',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      gpaNote: 'GPA tích lũy: 2.20 / 4.0 - Đang chịu kỷ luật Cảnh cáo',
      evidencePreset: 'hardship',
    },
  },
  {
    id: 'fail_r4_forced',
    label: '❌ Vi phạm R4: Buộc thôi học',
    shortLabel: '❌ Buộc thôi học',
    tag: 'Từ chối R4',
    tagColor: 'red',
    description: 'Sinh viên thuộc diện buộc thôi học do kết quả học tập kém hoặc quá thời gian đào tạo.',
    expectedOutcome: 'Từ chối tại G4 (E_END_REJECTED)',
    config: {
      fullName: 'Nguyễn Văn Đạt',
      mssv: '3121109904',
      className: '45K02.1',
      faculty: 'Khoa Kế toán',
      phone: '0905444555',
      email: 'dat.nv@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 6,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: true,
      gpaNote: 'Buộc thôi học do cảnh báo học vụ 3 lần liên tiếp',
      evidencePreset: 'valid_medical',
    },
  },
  {
    id: 'suspicious_evidence',
    label: '⚠️ Minh chứng giả mạo / sai lệch',
    shortLabel: '⚠️ Giấy tờ nghi vấn',
    tag: 'CTSV từ chối',
    tagColor: 'amber',
    description: 'Giấy ra viện lệch tên, sai ngày và thiếu dấu đỏ. CTSV phát hiện và từ chối duyệt.',
    expectedOutcome: 'Từ chối tại G4 (E_END_REJECTED)',
    config: {
      fullName: 'Hoàng Văn Thịnh',
      mssv: '3121109905',
      className: '47K15.2',
      faculty: 'Khoa Thương mại điện tử',
      phone: '0905555666',
      email: 'thinh.hv@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 3,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      gpaNote: 'GPA tích lũy: 2.90 / 4.0',
      evidencePreset: 'suspicious_medical',
    },
  },
  {
    id: 'missing_evidence',
    label: '📄 Quên đính kèm minh chứng',
    shortLabel: '📄 Thiếu minh chứng',
    tag: 'Trả hồ sơ T1',
    tagColor: 'amber',
    description: 'Sinh viên nộp đơn nhưng quên đính kèm giấy tờ. Hệ thống trả hồ sơ ngay tại G1.',
    expectedOutcome: 'Trả hồ sơ tại G1 (E_END_RETURNED)',
    config: {
      fullName: 'Trần Thị Hà',
      mssv: '3121109902',
      className: '47K01.2',
      faculty: 'Khoa Quản trị kinh doanh',
      phone: '0905222333',
      email: 'ha.tt@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
      semestersCompleted: 2,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      gpaNote: 'GPA tích lũy: 2.80 / 4.0',
      evidencePreset: 'none',
    },
  },
];

export function syncCustomTestDataToDatabases(
  config: CustomTestDataConfig,
  studentsDb: InMemoryStudentsDB,
  academicFinanceDb: InMemoryAcademicFinanceDB
): void {
  const mssv = config.mssv.trim();
  const fullName = config.fullName.trim();

  studentsDb.upsert({
    mssv,
    name: fullName,
    className: config.className.trim(),
    faculty: config.faculty.trim(),
    phone: config.phone.trim(),
    email: config.email.trim(),
    status: 'Đang học',
  });

  academicFinanceDb.upsert({
    mssv,
    semestersCompleted: Number(config.semestersCompleted),
    gpaNote: config.gpaNote || `GPA tích lũy: 3.00 / 4.0`,
    discipline: config.discipline,
    tuitionDebt: Number(config.tuitionDebt) || 0,
    forcedWithdrawal: Boolean(config.forcedWithdrawal),
  });
}
