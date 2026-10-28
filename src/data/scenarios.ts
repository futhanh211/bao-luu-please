import {
  StudentApplicationForm,
  EvidenceItem,
  AdvisorState,
  CtsvState,
} from '../engine/types';
import { AIScriptConfig } from '../ai/provider';

export interface DirectorActionPlan {
  advisorOutcome: AdvisorState['status'];
  advisorDelayDays?: number;
  ctsvOutcome: CtsvState['status'];
  ctsvDelayDays?: number;
  principalSigner?: string;
  principalDelayDays?: number;
}

export interface ScenarioConfig {
  id: string;
  code: string;
  title: string;
  studentName: string;
  mssv: string;
  description: string;
  expectedOutcome: string;
  expectedEndEvent: string;
  tag: string;
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  aiScript?: AIScriptConfig;
  directorPlan: DirectorActionPlan;
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 's1',
    code: 'S1',
    title: 'Happy path — Minh Khoa ốm dài ngày',
    studentName: 'Nguyễn Minh Khoa',
    mssv: '3121102001',
    description: 'Đã học 3 học kỳ, hết nợ, không kỷ luật, có giấy ra viện hợp lệ. Hệ thống và các vai phối hợp nhịp nhàng.',
    expectedOutcome: 'Bảo lưu thành công',
    expectedEndEvent: 'E_END_OK',
    tag: 'Chuẩn',
    form: {
      fullName: 'Nguyễn Minh Khoa',
      mssv: '3121102001',
      className: '47K12.1',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      phone: '0905123456',
      email: 'khoa.nm@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev_01',
        type: 'medical_record',
        name: 'Giấy ra viện Bệnh viện Đa khoa Đà Nẵng',
        content: 'Chẩn đoán: Hậu phẫu chấn thương dây chằng khớp gối, chỉ định điều trị phục hồi chức năng 6 tháng.',
      },
    ],
    aiScript: {
      docScanResult: {
        evidenceType: 'medical_record',
        typeMatchesReason: true,
        extracted: {
          hospital: 'Bệnh viện Đa khoa Đà Nẵng',
          patientName: 'Nguyễn Minh Khoa',
          diagnosis: 'Chấn thương phục hồi dài ngày',
        },
        anomalies: [],
        confidence: 0.98,
      },
      advisorBrief: {
        summary: 'Sinh viên Nguyễn Minh Khoa xin nghỉ 2 học kỳ do điều trị chấn thương.',
        points: ['Học lực Giỏi (GPA: 3.25)', 'Không vi phạm kỷ luật', 'Đã tích lũy 3 học kỳ'],
        suggestedDecision: 'confirm',
        rationale: 'Nguyện vọng chính đáng, có giấy ra viện hợp lệ từ bệnh viện tuyến tỉnh.',
      },
      ctsvBrief: {
        summary: 'Hồ sơ minh chứng y tế được thẩm định đầy đủ.',
        points: ['Giấy ra viện có dấu mộc tròn đỏ hợp lệ', 'Thời gian điều trị phù hợp thời hạn nghỉ'],
        suggestedDecision: 'valid',
        rationale: 'Minh chứng hợp lệ theo quy chế.',
      },
      decisionBasis:
        'Căn cứ Quy chế đào tạo của Trường ĐH Kinh tế – ĐH Đà Nẵng; Căn cứ đơn xin nghỉ học tạm thời của sinh viên Nguyễn Minh Khoa và kết quả thẩm định hồ sơ y tế.',
    },
    directorPlan: {
      advisorOutcome: 'confirmed',
      advisorDelayDays: 1,
      ctsvOutcome: 'valid',
      ctsvDelayDays: 1,
      principalSigner: 'PGS.TS. Đoàn Ngọc Phi Anh - Phó Hiệu trưởng',
      principalDelayDays: 1,
    },
  },
  {
    id: 's2',
    code: 'S2',
    title: 'Hồ sơ thiếu — Thu Hà quên minh chứng',
    studentName: 'Trần Thu Hà',
    mssv: '3121102002',
    description: 'Nộp đơn không đính kèm minh chứng bắt buộc. Hệ thống phát hiện ngay tại T1 và tự động trả hồ sơ.',
    expectedOutcome: 'Trả hồ sơ tức thì',
    expectedEndEvent: 'E_END_RETURNED',
    tag: 'Thiếu giấy tờ',
    form: {
      fullName: 'Trần Thu Hà',
      mssv: '3121102002',
      className: '47K01.2',
      faculty: 'Khoa Quản trị kinh doanh',
      phone: '0905234567',
      email: 'ha.tt@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 1,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [], // Không có minh chứng
    aiScript: {
      docScanResult: {
        evidenceType: 'none',
        typeMatchesReason: false,
        extracted: {},
        anomalies: [
          { field: 'evidence', issue: 'Đơn lý do điều trị dài hạn nhưng không có giấy tờ y tế đính kèm', severity: 'high' },
        ],
        confidence: 0.1,
      },
      returnMessage:
        'Hồ sơ của sinh viên Trần Thu Hà chưa có tài liệu minh chứng đính kèm (giấy ra viện/bệnh án). Vui lòng bổ sung minh chứng để tiếp tục quy trình.',
    },
    directorPlan: {
      advisorOutcome: 'pending',
      ctsvOutcome: 'pending',
    },
  },
  {
    id: 's3',
    code: 'S3',
    title: 'Nợ học phí — Quốc Bảo còn nợ',
    studentName: 'Lê Quốc Bảo',
    mssv: '3121102003',
    description: 'Hồ sơ đủ nhưng chưa hoàn thành nghĩa vụ học phí. Rule R3 tự động từ chối sau khi đối chiếu CSDL Tài chính.',
    expectedOutcome: 'Từ chối (Nợ học phí)',
    expectedEndEvent: 'E_END_REJECTED',
    tag: 'CSDL Tài chính',
    form: {
      fullName: 'Lê Quốc Bảo',
      mssv: '3121102003',
      className: '47K08.1',
      faculty: 'Khoa Tài chính - Ngân hàng',
      phone: '0905345678',
      email: 'bao.lq@due.edu.vn',
      reason: 'Hoàn cảnh gia đình',
      semesterCount: 1,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev_03',
        type: 'hardship_proof',
        name: 'Đơn xác nhận hoàn cảnh gia đình khó khăn của UBND',
        content: 'UBND Phường xác nhận gia đình sinh viên gặp biến cố kinh tế.',
      },
    ],
    aiScript: {
      docScanResult: {
        evidenceType: 'hardship_proof',
        typeMatchesReason: true,
        extracted: { issuer: 'UBND Phường', applicant: 'Lê Quốc Bảo' },
        anomalies: [],
        confidence: 0.95,
      },
      advisorBrief: {
        summary: 'Sinh viên Lê Quốc Bảo xin bảo lưu do hoàn cảnh gia đình.',
        points: ['Cố vấn ủng hộ cho sinh viên nghỉ 1 học kỳ để thu xếp việc nhà'],
        suggestedDecision: 'confirm',
        rationale: 'Nguyện vọng chính đáng.',
      },
      ctsvBrief: {
        summary: 'Giấy tờ xác nhận địa phương hợp lệ.',
        points: ['Đơn có xác nhận của UBND địa phương hợp lệ'],
        suggestedDecision: 'valid',
        rationale: 'Đủ điều kiện về mặt hồ sơ.',
      },
      rejectMessage:
        'Hồ sơ của sinh viên Lê Quốc Bảo chưa đáp ứng điều kiện bảo lưu do còn nợ học phí: 7.500.000 VNĐ theo CSDL Tài chính. Vui lòng thanh toán công nợ và nộp lại.',
    },
    directorPlan: {
      advisorOutcome: 'confirmed',
      advisorDelayDays: 1,
      ctsvOutcome: 'valid',
      ctsvDelayDays: 1,
    },
  },
  {
    id: 's4',
    code: 'S4',
    title: 'Cố vấn ngâm hồ sơ — Ngọc Anh chờ',
    studentName: 'Phạm Ngọc Anh',
    mssv: '3121102004',
    description: 'Hồ sơ hợp lệ nhưng Cố vấn chưa xử lý sau 3 ngày làm việc. Boundary Timer kích hoạt gửi thông báo nhắc việc.',
    expectedOutcome: 'Kích hoạt SLA Timer',
    expectedEndEvent: 'E_END_OK',
    tag: 'Quá hạn SLA',
    form: {
      fullName: 'Phạm Ngọc Anh',
      mssv: '3121102004',
      className: '47K02.1',
      faculty: 'Khoa Kế toán',
      phone: '0905456789',
      email: 'anh.pn@due.edu.vn',
      reason: 'Lý do cá nhân khác',
      semesterCount: 1,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev_04',
        type: 'personal_reason',
        name: 'Giấy tiếp nhận chương trình trao đổi văn hóa sinh viên',
        content: 'Chương trình thực tập ngắn hạn 6 tháng tại Nhật Bản.',
      },
    ],
    aiScript: {
      docScanResult: {
        evidenceType: 'personal_reason',
        typeMatchesReason: true,
        extracted: { program: 'Chương trình giao lưu văn hóa', applicant: 'Phạm Ngọc Anh' },
        anomalies: [],
        confidence: 0.92,
      },
      advisorBrief: {
        summary: 'Sinh viên tham gia chương trình giao lưu, cần xác nhận sau thông báo nhắc việc.',
        points: ['Đã quá hạn SLA 3 ngày', 'Học lực Khá', 'Không nợ học phí'],
        suggestedDecision: 'confirm',
        rationale: 'Xác nhận để sinh viên kịp thời gian làm thủ tục xuất ngoại.',
      },
      ctsvBrief: {
        summary: 'Minh chứng chương trình đối ngoại hợp lệ.',
        points: ['Thư mời chính thức có mã xác thực'],
        suggestedDecision: 'valid',
        rationale: 'Hồ sơ đầy đủ.',
      },
      decisionBasis:
        'Căn cứ Quy chế đào tạo Trường ĐH Kinh tế – ĐH Đà Nẵng; Căn cứ đơn xin nghỉ học tạm thời của sinh viên Phạm Ngọc Anh.',
    },
    directorPlan: {
      advisorOutcome: 'confirmed',
      advisorDelayDays: 4, // > 3 ngày để timer bắn
      ctsvOutcome: 'valid',
      ctsvDelayDays: 1,
      principalSigner: 'PGS.TS. Đoàn Ngọc Phi Anh - Phó Hiệu trưởng',
      principalDelayDays: 1,
    },
  },
  {
    id: 's5',
    code: 'S5',
    title: 'Minh chứng đáng ngờ — Đức Thịnh',
    studentName: 'Hoàng Đức Thịnh',
    mssv: '3121102005',
    description: 'Giấy ra viện có dấu hiệu sai lệch ngày tháng. AI phát hiện bất thường, chuyên viên CTSV thẩm tra và từ chối.',
    expectedOutcome: 'Từ chối (Minh chứng giả)',
    expectedEndEvent: 'E_END_REJECTED',
    tag: 'Soi bất thường',
    form: {
      fullName: 'Hoàng Đức Thịnh',
      mssv: '3121102005',
      className: '47K15.2',
      faculty: 'Khoa Thương mại điện tử',
      phone: '0905567890',
      email: 'thinh.hd@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 2,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev_05',
        type: 'medical_record',
        name: 'Giấy xác nhận nằm viện Phòng khám Đa khoa Quốc tế',
        content: 'Thời gian vào viện: 15/10/2026 - Thời gian ra viện: 10/10/2026 (ngày ra viện trước ngày vào viện).',
        issueNotes: 'Ngày ra viện (10/10/2026) trước ngày nhập viện (15/10/2026). Dấu mộc mờ, nghi vấn chỉnh sửa.',
      },
    ],
    aiScript: {
      docScanResult: {
        evidenceType: 'medical_record',
        typeMatchesReason: true,
        extracted: { hospital: 'Phòng khám Đa khoa Quốc tế', applicant: 'Hoàng Đức Thịnh' },
        anomalies: [
          {
            field: 'admissionDate',
            issue: 'Ngày ra viện trước ngày nhập viện (bất thường thời gian logic)',
            severity: 'high',
          },
        ],
        confidence: 0.65, // >= 0.6 để qua T1 cho con người thẩm định
      },
      advisorBrief: {
        summary: 'Sinh viên đề nghị bảo lưu lý do ốm đau.',
        points: ['Sinh viên nộp đơn nhưng chưa trao đổi trực tiếp với cố vấn'],
        suggestedDecision: 'confirm',
        rationale: 'Cố vấn tạm thời ghi nhận nguyện vọng.',
      },
      ctsvBrief: {
        summary: 'CẢNH BÁO BẤT THƯỜNG: Minh chứng có dấu hiệu làm giả.',
        points: ['Ngày ra viện trước ngày vào viện', 'Con dấu có dấu hiệu can thiệp đồ họa'],
        suggestedDecision: 'invalid',
        rationale: 'Minh chứng không đáng tin cậy. Đề xuất từ chối.',
      },
      rejectMessage:
        'Hồ sơ của sinh viên Hoàng Đức Thịnh bị từ chối do tài liệu minh chứng y tế không hợp lệ (sai lệch ngày tháng và có dấu hiệu chỉnh sửa).',
    },
    directorPlan: {
      advisorOutcome: 'confirmed',
      advisorDelayDays: 1,
      ctsvOutcome: 'invalid', // CTSV phát hiện sai lệch
      ctsvDelayDays: 1,
    },
  },
  {
    id: 's6',
    code: 'Custom',
    title: 'Tự nhập hồ sơ — Nhập tự do',
    studentName: 'Tuỳ chỉnh sinh viên',
    mssv: 'Tuỳ chọn',
    description: 'Tự do chọn sinh viên trong CSDL hoặc nhập thông tin bất kỳ để kiểm thử các trường hợp biên của quy trình.',
    expectedOutcome: 'Theo dữ liệu nhập',
    expectedEndEvent: 'E_END_OK',
    tag: 'Tự do',
    form: {
      fullName: 'Đỗ Mai Lan',
      mssv: '3121102006',
      className: '47K03.1',
      faculty: 'Khoa Marketing',
      phone: '0905678901',
      email: 'lan.dm@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 1,
      startSemester: 'Học kỳ 1, Năm học 2026-2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev_06',
        type: 'medical_record',
        name: 'Giấy chứng nhận phẫu thuật Bệnh viện C',
        content: 'Chỉ định phẫu thuật và tĩnh dưỡng 3 tháng.',
      },
    ],
    directorPlan: {
      advisorOutcome: 'confirmed',
      ctsvOutcome: 'valid',
      principalSigner: 'PGS.TS. Đoàn Ngọc Phi Anh - Phó Hiệu trưởng',
    },
  },
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
