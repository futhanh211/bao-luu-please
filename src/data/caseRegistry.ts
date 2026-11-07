import { EvidenceItem, StudentApplicationForm, DecisionDoc, EngineEvent, AcademicFinanceRecord } from '../engine/types';
import { getStorageItem, setStorageItem } from './userRegistry';
import { getStudentFormData, buildEvidenceItemsFromFormData, uploadedFileDataUrlCache } from './studentFormData';
import { collectAnomalies } from './inspection';

export interface AiAuditReport {
  status: 'passed' | 'warning' | 'rejected';
  score: number; // 0 - 100
  auditDate: string;
  summary: string;
  studentCheck: {
    pass: boolean;
    title: string;
    note: string;
  };
  ruleCheck: {
    pass: boolean;
    title: string;
    details: { id: string; name: string; pass: boolean; note: string }[];
  };
  evidenceCheck: {
    pass: boolean;
    confidence: number;
    title: string;
    hasRedStamp: boolean;
    doctorSigned: boolean;
    diagnosisMatch: boolean;
    anomalies: string[];
  };
  advisorRecommendation: 'confirm' | 'decline';
  advisorRationale: string;
  ctsvRecommendation: 'valid' | 'invalid';
  ctsvRationale: string;
}

export type CaseStatus =
  | 'pending_advisor'
  | 'advisor_confirmed'
  | 'advisor_declined'
  | 'pending_ctsv'
  | 'ctsv_approved'
  | 'pending_principal'
  | 'completed'
  | 'rejected'
  | 'returned';

export interface SubmittedCase {
  id: string; // e.g. "BL-2026-88"
  caseCode: string; // e.g. "BL-2026-88"
  studentMssv: string;
  studentName: string;
  studentClass: string;
  studentFaculty: string;
  studentPhone?: string;
  studentEmail?: string;
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  attachedEvidenceIds: string[];
  submittedAt: string;
  day: number;
  status: CaseStatus;
  aiAudit?: AiAuditReport;
  advisorDecision?: 'confirmed' | 'declined';
  advisorDecisionAt?: string;
  advisorNotes?: string;
  ctsvDecision?: 'valid' | 'invalid';
  ctsvDecisionAt?: string;
  ctsvMarks?: string[];
  ctsvNotes?: string;
  principalSigned?: boolean;
  principalSignedAt?: string;
  principalSignerName?: string;
  decisionDoc?: DecisionDoc | null;
  log?: EngineEvent[];
}

export function generateAiAuditReport(
  form: StudentApplicationForm,
  evidence: EvidenceItem[],
  academicRecord?: AcademicFinanceRecord | null
): AiAuditReport {
  const anomalies = collectAnomalies(evidence || []);
  const hasAnomalies = anomalies.length > 0;

  const rec = academicRecord || {
    mssv: form?.mssv || '',
    semestersCompleted: 3,
    gpaNote: 'GPA tích lũy: 3.25 / 4.0 - Đủ điều kiện học vụ',
    discipline: 'none' as const,
    tuitionDebt: 0,
    forcedWithdrawal: false,
  };

  const r1Pass = rec.semestersCompleted >= 1;
  const r2Pass = !rec.forcedWithdrawal;
  const r3Pass = rec.discipline === 'none';
  const r4Pass = rec.tuitionDebt === 0;
  const rulesPass = r1Pass && r2Pass && r3Pass && r4Pass;

  const studentPass = Boolean(form?.fullName && form?.mssv && form?.className && form?.faculty);
  const evidencePass = !hasAnomalies && (evidence || []).length > 0;
  const overallPass = studentPass && rulesPass && evidencePass;

  const auditDate =
    new Date().toLocaleDateString('vi-VN') +
    ' ' +
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return {
    status: overallPass ? 'passed' : hasAnomalies ? 'warning' : 'rejected',
    score: overallPass ? 100 : hasAnomalies ? 45 : 60,
    auditDate,
    summary: overallPass
      ? 'HỒ SƠ HỢP LỆ (100% ĐẠT CHUẨN KIỂM ĐỊNH AI): Hệ thống AI đã thẩm tra đối chiếu CSDL học vụ sinh viên (DS2), quy chế đào tạo R1–R4 (DS1) và toàn bộ tính chuẩn xác của tài liệu minh chứng.'
      : hasAnomalies
      ? `CẢNH BÁO BẤT THƯỜNG: AI phát hiện ${anomalies.length} điểm nghi vấn/sai lệch trên tài liệu minh chứng.`
      : 'HỒ SƠ CẦN BỔ SUNG: Chưa đáp ứng đầy đủ điều kiện quy chế đào tạo hoặc thiếu thông tin sinh viên bắt buộc.',
    studentCheck: {
      pass: studentPass,
      title: 'Hồ sơ người học & Trạng thái đào tạo (DS2)',
      note: studentPass
        ? `Sinh viên ${form?.fullName} (${form?.mssv}) thuộc lớp ${form?.className}, ${form?.faculty}. Trạng thái: Đang học chính quy, hợp lệ.`
        : 'Thiếu thông tin người học bắt buộc trên hệ thống Một cửa.',
    },
    ruleCheck: {
      pass: rulesPass,
      title: 'Điều kiện Quy chế Đào tạo DUE (R1–R4 / DS1)',
      details: [
        {
          id: 'R1',
          name: 'Thời gian đã học tích lũy',
          pass: r1Pass,
          note: r1Pass
            ? `Đã hoàn thành ${rec.semestersCompleted} học kỳ (Quy định: tối thiểu 1 học kỳ)`
            : 'Chưa học đủ 1 học kỳ chính quy',
        },
        {
          id: 'R2',
          name: 'Tình trạng thôi học',
          pass: r2Pass,
          note: r2Pass
            ? 'Không thuộc diện bị buộc thôi học'
            : 'Cảnh báo: Thuộc diện bị buộc thôi học',
        },
        {
          id: 'R3',
          name: 'Kỷ luật sinh viên',
          pass: r3Pass,
          note: r3Pass
            ? 'Không trong thời gian thi hành kỷ luật'
            : 'Có quyết định kỷ luật đang hiệu lực',
        },
        {
          id: 'R4',
          name: 'Nghĩa vụ học phí',
          pass: r4Pass,
          note: r4Pass
            ? 'Đã hoàn thành 100% học phí (0 VNĐ nợ tồn đọng)'
            : `Còn nợ học phí: ${rec.tuitionDebt.toLocaleString('vi-VN')} VNĐ`,
        },
      ],
    },
    evidenceCheck: {
      pass: evidencePass,
      confidence: hasAnomalies ? 0.35 : 0.98,
      title: 'Thẩm tra Minh chứng số hóa (AI Vision & Data Match)',
      hasRedStamp: !hasAnomalies,
      doctorSigned: !hasAnomalies,
      diagnosisMatch: true,
      anomalies: anomalies.map(
        (a) => `${a.label || 'Mục'}: ${a.issue || 'Bất thường'} (Giá trị ghi nhận: "${a.value || ''}")`
      ),
    },
    advisorRecommendation: overallPass || hasAnomalies ? 'confirm' : 'decline',
    advisorRationale: overallPass
      ? 'Sinh viên đủ điều kiện học vụ, có nguyện vọng nghỉ học tạm thời chính đáng kèm minh chứng chuẩn xác. Đề xuất Cố vấn xác nhận nguyện vọng.'
      : hasAnomalies
      ? 'Nguyện vọng sinh viên đã được ghi nhận. Cố vấn xem xét nguyện vọng và lưu ý cảnh báo minh chứng do AI phát hiện.'
      : 'Hồ sơ chưa đáp ứng điều kiện bảo lưu theo quy định.',
    ctsvRecommendation: overallPass ? 'valid' : 'invalid',
    ctsvRationale: overallPass
      ? 'Tài liệu minh chứng hợp lệ, cơ quan cấp rõ ràng, có chữ ký và mộc đỏ xác nhận, khớp với lý do xin bảo lưu. Đề xuất CTSV đóng dấu thẩm định thông qua trình Ban Giám hiệu.'
      : `Minh chứng không đủ độ tin cậy do phát hiện sai lệch: ${anomalies.map((a) => a.label).join(', ')}. Đề xuất từ chối hoặc yêu cầu xác minh trực tiếp.`,
  };
}

const STORAGE_KEY = 'bao_luu_submitted_cases_v2';

const isTestEnv =
  typeof globalThis !== 'undefined' &&
  Boolean((globalThis as unknown as { process?: { env?: { VITEST?: string } } }).process?.env?.VITEST);

/**
 * Tạo danh sách hồ sơ ban đầu nếu bộ nhớ trống
 */
function createInitialCases(force = false): SubmittedCase[] {
  if (isTestEnv && !force) return [];

  const cases: SubmittedCase[] = [];

  // Hồ sơ 1: Phạm Minh Khôi (MSSV: 251121536115)
  const student1Form: StudentApplicationForm = {
    fullName: 'Phạm Minh Khôi',
    mssv: '251121536115',
    className: '51K36',
    faculty: 'Khoa Thống kê - Tin học',
    phone: '0905123456',
    email: '251121536115@due.udn.vn',
    reason: 'Ốm đau/tai nạn điều trị dài',
    semesterCount: 1,
    startSemester: 'Học kỳ 1 năm học 2026–2027',
    commitment: true,
  };
  const detailed1 = getStudentFormData('251121536115', {
    name: 'Phạm Minh Khôi',
    className: '51K36',
    faculty: 'Khoa Thống kê - Tin học',
  });
  const ev1 = buildEvidenceItemsFromFormData(detailed1, student1Form.reason);

  cases.push({
    id: 'BL-2026-88',
    caseCode: 'BL-2026-88',
    studentMssv: '251121536115',
    studentName: 'Phạm Minh Khôi',
    studentClass: '51K36',
    studentFaculty: 'Khoa Thống kê - Tin học',
    studentPhone: '0905123456',
    studentEmail: '251121536115@due.udn.vn',
    form: student1Form,
    evidence: ev1,
    attachedEvidenceIds: ev1.map((e) => e.id),
    submittedAt: '29/10/2026 21:55',
    day: 0,
    status: 'pending_principal',
    aiAudit: generateAiAuditReport(student1Form, ev1),
    advisorDecision: 'confirmed',
    advisorDecisionAt: '29/10/2026 22:00',
    ctsvDecision: 'valid',
    ctsvDecisionAt: '29/10/2026 22:10',
    ctsvMarks: ['bv_da_khoa_da_nang'],
  });

  // Hồ sơ 2: Khai (MSSV: 251121536114)
  const student2Form: StudentApplicationForm = {
    fullName: 'Khai',
    mssv: '251121536114',
    className: '51K36',
    faculty: 'Khoa Công nghệ thông tin kinh doanh',
    phone: '0905123456',
    email: '251121536114@due.udn.vn',
    reason: 'Ốm đau/tai nạn điều trị dài',
    semesterCount: 1,
    startSemester: 'Học kỳ 1 năm học 2026–2027',
    commitment: true,
  };
  const detailed2 = getStudentFormData('251121536114', {
    name: 'Khai',
    className: '51K36',
    faculty: 'Khoa Công nghệ thông tin kinh doanh',
  });
  const ev2 = buildEvidenceItemsFromFormData(detailed2, student2Form.reason);

  cases.push({
    id: 'BL-2026-89',
    caseCode: 'BL-2026-89',
    studentMssv: '251121536114',
    studentName: 'Khai',
    studentClass: '51K36',
    studentFaculty: 'Khoa Công nghệ thông tin kinh doanh',
    studentPhone: '0905123456',
    studentEmail: '251121536114@due.udn.vn',
    form: student2Form,
    evidence: ev2,
    attachedEvidenceIds: ev2.map((e) => e.id),
    submittedAt: '30/10/2026 12:15',
    day: 0,
    status: 'pending_ctsv',
    aiAudit: generateAiAuditReport(student2Form, ev2),
    advisorDecision: 'confirmed',
    advisorDecisionAt: '30/10/2026 12:18',
  });

  return cases;
}

export function getAllSubmittedCases(): SubmittedCase[] {
  let parsed: SubmittedCase[] = [];
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialCases();
      saveAllSubmittedCases(initial);
      return initial;
    }
    const rawParsed = JSON.parse(raw);
    if (!Array.isArray(rawParsed) || rawParsed.length === 0) {
      const initial = createInitialCases();
      saveAllSubmittedCases(initial);
      return initial;
    }
    parsed = rawParsed as SubmittedCase[];
  } catch (err) {
    console.error('Lỗi phân tích JSON danh sách hồ sơ nộp:', err);
    const initial = createInitialCases();
    return initial;
  }

  try {
    let modified = false;

    // Tự động làm sạch trạng thái không hợp lệ do các phiên chạy cũ (Sanitize invalid states):
    for (const c of parsed) {
      try {
        if (c.advisorDecision === 'declined') {
          if (c.status !== 'rejected') {
            c.status = 'rejected';
            modified = true;
          }
          if (c.ctsvDecision) {
            delete c.ctsvDecision;
            delete c.ctsvDecisionAt;
            delete c.ctsvMarks;
            delete c.ctsvNotes;
            modified = true;
          }
          if (c.principalSigned || c.decisionDoc) {
            c.principalSigned = false;
            delete c.principalSignedAt;
            delete c.principalSignerName;
            delete c.decisionDoc;
            modified = true;
          }
        } else if (c.ctsvDecision === 'invalid') {
          if (c.status !== 'rejected') {
            c.status = 'rejected';
            modified = true;
          }
          if (c.principalSigned || c.decisionDoc) {
            c.principalSigned = false;
            delete c.principalSignedAt;
            delete c.principalSignerName;
            delete c.decisionDoc;
            modified = true;
          }
        }
      } catch (innerErr) {
        console.warn('Lỗi kiểm tra sanitize case:', innerErr);
      }
    }

    const hasKhoi = parsed.some((c) => c.studentMssv === '251121536115');
    const hasKhai = parsed.some((c) => c.studentMssv === '251121536114');

    if (!isTestEnv && (!hasKhoi || !hasKhai)) {
      const initCases = createInitialCases();
      if (!hasKhoi) {
        const k = initCases.find((c) => c.studentMssv === '251121536115');
        if (k) { parsed.unshift(k); modified = true; }
      }
      if (!hasKhai) {
        const kh = initCases.find((c) => c.studentMssv === '251121536114');
        if (kh) { parsed.push(kh); modified = true; }
      }
    }

    for (const c of parsed) {
      try {
        if (!c.aiAudit) {
          c.aiAudit = generateAiAuditReport(c.form, c.evidence || []);
          modified = true;
        }
        if (c.evidence) {
          for (const ev of c.evidence) {
            if (ev.fileData && !ev.fileData.dataUrl) {
              const cached = uploadedFileDataUrlCache.get(`${ev.fileData.name}_${ev.fileData.size}`);
              if (cached) {
                ev.fileData.dataUrl = cached;
              }
            }
          }
        }
      } catch (auditErr) {
        console.warn('Lỗi bổ sung aiAudit cho case:', c.caseCode, auditErr);
      }
    }

    if (modified) {
      saveAllSubmittedCases(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Lỗi đọc danh sách hồ sơ nộp:', err);
    return parsed.length > 0 ? parsed : createInitialCases();
  }
}

function sanitizeCasesForStorage(cases: SubmittedCase[]): SubmittedCase[] {
  return cases.map((c) => ({
    ...c,
    evidence: (c.evidence || []).map((ev) => {
      if (ev.fileData?.dataUrl) {
        uploadedFileDataUrlCache.set(`${ev.fileData.name}_${ev.fileData.size}`, ev.fileData.dataUrl);
        if (ev.fileData.dataUrl.length > 2048) {
          return {
            ...ev,
            fileData: {
              ...ev.fileData,
              dataUrl: undefined,
            },
          };
        }
      }
      return ev;
    }),
  }));
}

export function saveAllSubmittedCases(cases: SubmittedCase[]): void {
  try {
    const sanitized = sanitizeCasesForStorage(cases);
    setStorageItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Lỗi lưu danh sách hồ sơ:', err);
  }
}

export function getSubmittedCaseById(id: string): SubmittedCase | null {
  const all = getAllSubmittedCases();
  return all.find((c) => c.id === id || c.caseCode === id) || null;
}

export function getSubmittedCaseByMssv(mssv: string): SubmittedCase | null {
  const trimmed = (mssv || '').trim().toLowerCase();
  const all = getAllSubmittedCases();
  return all.find((c) => (c.studentMssv || '').trim().toLowerCase() === trimmed) || null;
}

export function saveSubmittedCase(caseData: SubmittedCase): void {
  const all = getAllSubmittedCases();
  const targetMssv = (caseData.studentMssv || '').trim().toLowerCase();
  const index = all.findIndex(
    (c) => c.id === caseData.id || (c.studentMssv || '').trim().toLowerCase() === targetMssv
  );
  if (index >= 0) {
    all[index] = { ...all[index], ...caseData };
  } else {
    all.push(caseData);
  }
  saveAllSubmittedCases(all);
}

export function updateCaseAdvisorDecision(
  caseId: string,
  decision: 'confirmed' | 'declined',
  notes?: string
): SubmittedCase | null {
  const all = getAllSubmittedCases();
  const target = all.find((c) => c.id === caseId || c.caseCode === caseId);
  if (!target) return null;

  target.advisorDecision = decision;
  target.advisorDecisionAt =
    new Date().toLocaleDateString('vi-VN') +
    ' ' +
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  // Sau khi Cố vấn xác nhận, hồ sơ chuyển sang khâu CTSV thẩm tra (T5); nếu Cố vấn từ chối, ca kết thúc từ chối
  target.status = decision === 'declined' ? 'rejected' : 'pending_ctsv';
  if (notes) target.advisorNotes = notes;

  saveAllSubmittedCases(all);
  return target;
}

export function updateCaseCtsvDecision(
  caseId: string,
  decision: 'valid' | 'invalid',
  marks?: string[],
  notes?: string
): SubmittedCase | null {
  const all = getAllSubmittedCases();
  const target = all.find((c) => c.id === caseId || c.caseCode === caseId);
  if (!target) return null;

  // CHẶN BẢO VỆ: Nếu Cố vấn chưa xác nhận hoặc đã từ chối ở bước 1, CTSV không thể thẩm định
  if (target.advisorDecision !== 'confirmed') {
    console.warn(`Hồ sơ ${caseId} không thể thẩm định tại CTSV vì Cố vấn chưa phê duyệt.`);
    return null;
  }

  target.ctsvDecision = decision;
  target.ctsvDecisionAt =
    new Date().toLocaleDateString('vi-VN') +
    ' ' +
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  target.ctsvMarks = marks || [];
  if (notes) target.ctsvNotes = notes;

  // Nếu hợp lệ: chuyển sang BGH ký số Quyết định (T9)
  // Nếu không hợp lệ: chuyển trạng thái từ chối
  target.status = decision === 'valid' ? 'pending_principal' : 'rejected';

  // Tự động tạo bản thảo Quyết định cho BGH ký số
  if (decision === 'valid' && !target.decisionDoc) {
    target.decisionDoc = {
      number: `BL-${target.caseCode.replace(/[^0-9]/g, '') || '2001'}/QĐ-ĐHKT`,
      decisionDate: '01/09/2026',
      durationSemesters: target.form.semesterCount,
      startSemester: target.form.startSemester,
      studentName: target.form.fullName,
      mssv: target.form.mssv,
      faculty: target.form.faculty,
      basisText: `Xét Đơn xin nghỉ học tạm thời của sinh viên ${target.form.fullName} và đề nghị của Trưởng phòng Công tác sinh viên.`,
      signed: false,
      signerName: 'PGS.TS. Trần Đình Khôi - Hiệu trưởng',
    };
  }

  saveAllSubmittedCases(all);
  return target;
}

export function updateCasePrincipalSign(
  caseId: string,
  signerName: string
): SubmittedCase | null {
  const all = getAllSubmittedCases();
  const target = all.find((c) => c.id === caseId || c.caseCode === caseId);
  if (!target) return null;

  // CHẶN BẢO VỆ: BGH CHỈ KÝ KHI CẢ CỐ VẤN ĐÃ XÁC NHẬN VÀ CTSV ĐÃ THẨM ĐỊNH HỢP LỆ!
  if (target.advisorDecision !== 'confirmed' || target.ctsvDecision !== 'valid') {
    console.warn(
      `Hồ sơ ${caseId} KHÔNG ĐỦ ĐIỀU KIỆN KÝ SỐ BGH! (Cố vấn: ${target.advisorDecision}, CTSV: ${target.ctsvDecision})`
    );
    return null;
  }

  target.principalSigned = true;
  target.principalSignedAt =
    new Date().toLocaleDateString('vi-VN') +
    ' ' +
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  target.principalSignerName = signerName;
  target.status = 'completed';

  saveAllSubmittedCases(all);
  return target;
}

/**
 * Danh sách hồ sơ dành cho Bàn Cố vấn học tập (Lane L2 / T4):
 * - Hiển thị tất cả hồ sơ nộp tới Cố vấn (chỉ những hồ sơ hợp lệ vượt qua bước kiểm tra tự động T1/G1).
 * - Hồ sơ bị trả về ngay tại cổng Một cửa (status === 'returned') không chuyển tới Cố vấn.
 * - Ưu tiên ca đang chờ duyệt (chưa có advisorDecision) lên trước.
 */
export function getAdvisorCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.status !== 'returned')
    .sort((a, b) => {
      const aPending = !a.advisorDecision ? 0 : 1;
      const bPending = !b.advisorDecision ? 0 : 1;
      return aPending - bPending;
    });
}

/**
 * Danh sách hồ sơ chuyển sang Bàn CTSV (Lane L3 / T5):
 * - CHỈ NHỮNG HỒ SƠ ĐÃ ĐƯỢC CỐ VẤN DUYỆT (advisorDecision === 'confirmed') mới xuất hiện!
 * - Hồ sơ bị Cố vấn từ chối (advisorDecision === 'declined') BỊ DỪNG HOÀN TOÀN ("bay luôn"),
 *   không bao giờ xuất hiện ở Bàn CTSV.
 */
export function getCtsvCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.advisorDecision === 'confirmed')
    .sort((a, b) => {
      const aPending = !a.ctsvDecision ? 0 : 1;
      const bPending = !b.ctsvDecision ? 0 : 1;
      return aPending - bPending;
    });
}

/**
 * Danh sách hồ sơ trình Ban Giám hiệu ký số (Lane L4 / T9):
 * - CHỈ NHỮNG HỒ SƠ ĐÃ ĐẠT CẢ 2 BƯỚC:
 *   1. Cố vấn xác nhận (advisorDecision === 'confirmed')
 *   2. CTSV thẩm định hợp lệ (ctsvDecision === 'valid')
 *   mới đủ điều kiện xuất hiện trên bàn BGH để ký số!
 * - Hồ sơ bị từ chối từ bất kỳ bước nào phía trước BỊ DỪNG HOÀN TOÀN ("bay luôn"),
 *   tuyệt đối không bao giờ xuất hiện trên bàn BGH.
 */
export function getPrincipalCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.advisorDecision === 'confirmed' && c.ctsvDecision === 'valid')
    .sort((a, b) => {
      const aPending = !a.principalSigned ? 0 : 1;
      const bPending = !b.principalSigned ? 0 : 1;
      return aPending - bPending;
    });
}

export function getNextCaseCode(): string {
  const all = getAllSubmittedCases();
  let maxNum = 87;
  for (const c of all) {
    const match = c.caseCode.match(/BL-2026-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `BL-2026-${maxNum + 1}`;
}

/**
 * Đặt lại CSDL hồ sơ về trạng thái mẫu ban đầu
 */
export function resetSubmittedCasesToDefault(forceSample = true): SubmittedCase[] {
  const initial = createInitialCases(forceSample);
  saveAllSubmittedCases(initial);
  return initial;
}

/**
 * Xóa sạch toàn bộ hồ sơ trong bộ nhớ bền vững
 */
export function clearAllSubmittedCases(): void {
  saveAllSubmittedCases([]);
}

/**
 * Xuất toàn bộ hồ sơ ra định dạng JSON sao lưu
 */
export function exportAllCasesJson(): string {
  const cases = getAllSubmittedCases();
  return JSON.stringify(cases, null, 2);
}

/**
 * Nhập hồ sơ từ chuỗi JSON sao lưu
 */
export function importCasesJson(jsonStr: string): { success: boolean; count: number; message: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, message: 'Dữ liệu JSON không phải danh sách mảng hồ sơ hợp lệ.' };
    }
    saveAllSubmittedCases(parsed as SubmittedCase[]);
    return { success: true, count: parsed.length, message: `Nhập thành công ${parsed.length} hồ sơ.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, message: `Lỗi đọc JSON: ${msg}` };
  }
}
