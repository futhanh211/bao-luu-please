import { EvidenceItem, StudentApplicationForm, DecisionDoc, EngineEvent } from '../engine/types';
import { getStorageItem, setStorageItem } from './userRegistry';
import { getStudentFormData, buildEvidenceItemsFromFormData } from './studentFormData';
import { ScenarioConfig, SCENARIOS } from './scenarios';

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
    advisorDecision: 'confirmed',
    advisorDecisionAt: '30/10/2026 12:18',
  });

  // Tự động khởi tạo sẵn các ca kịch bản chuẩn (S1 - S5) ở trạng thái chờ Cố vấn duyệt
  for (const sc of SCENARIOS) {
    if (sc.id === 's6') continue;
    const caseId = `BL-2026-${sc.id.toUpperCase()}`;
    const ev = sc.evidence ? sc.evidence.map((e) => ({ ...e })) : [];
    cases.unshift({
      id: caseId,
      caseCode: caseId,
      studentMssv: sc.mssv,
      studentName: sc.studentName,
      studentClass: sc.form.className || '47K12.1',
      studentFaculty: sc.form.faculty || 'Khoa Công nghệ thông tin kinh doanh',
      studentPhone: sc.form.phone || '0905123456',
      studentEmail: sc.form.email || `${sc.mssv}@due.edu.vn`,
      form: { ...sc.form },
      evidence: ev,
      attachedEvidenceIds: ev.map((e) => e.id),
      submittedAt: '01/11/2026 08:00',
      day: 0,
      status: 'pending_advisor',
    });
  }

  return cases;
}

export function getAllSubmittedCases(): SubmittedCase[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialCases();
      saveAllSubmittedCases(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as SubmittedCase[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = createInitialCases();
      saveAllSubmittedCases(initial);
      return initial;
    }

    // Đảm bảo cả hai hồ sơ Phạm Minh Khôi và Khai luôn có trong danh sách nếu chưa có
    let modified = false;

    // Tự động làm sạch trạng thái không hợp lệ do các phiên chạy cũ (Sanitize invalid states):
    // 1. Nếu Cố vấn đã từ chối (advisorDecision === 'declined'): hồ sơ dừng hoàn toàn, không thể có thẩm định CTSV hay chữ ký BGH
    // 2. Nếu CTSV kết luận không hợp lệ (ctsvDecision === 'invalid'): hồ sơ dừng, không thể có chữ ký BGH
    for (const c of parsed) {
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
    }

    if (modified) {
      saveAllSubmittedCases(parsed);
      modified = false;
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
      if (modified) {
        saveAllSubmittedCases(parsed);
      }
    }

    return parsed;
  } catch (err) {
    console.error('Lỗi đọc danh sách hồ sơ nộp:', err);
    return createInitialCases();
  }
}

export function saveAllSubmittedCases(cases: SubmittedCase[]): void {
  try {
    setStorageItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error('Lỗi lưu danh sách hồ sơ:', err);
  }
}

export function getSubmittedCaseById(id: string): SubmittedCase | null {
  const all = getAllSubmittedCases();
  return all.find((c) => c.id === id || c.caseCode === id) || null;
}

export function getSubmittedCaseByMssv(mssv: string): SubmittedCase | null {
  const trimmed = (mssv || '').trim();
  const all = getAllSubmittedCases();
  return all.find((c) => c.studentMssv === trimmed) || null;
}

export function saveSubmittedCase(caseData: SubmittedCase): void {
  const all = getAllSubmittedCases();
  const index = all.findIndex((c) => c.id === caseData.id || c.studentMssv === caseData.studentMssv);
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
 * Đảm bảo một kịch bản Demo (S1 - S6) đã được nạp vào Sổ tiếp nhận hồ sơ.
 * Giúp các bàn nghiệp vụ (Cố vấn, CTSV, BGH) thấy ngay hồ sơ của kịch bản đang chọn
 * để thẩm định và phê duyệt trực tiếp.
 */
export function ensureScenarioInCaseRegistry(scenario: ScenarioConfig): SubmittedCase {
  const all = getAllSubmittedCases();
  const caseId = `BL-2026-${scenario.id.toUpperCase()}`;
  const existingIdx = all.findIndex(
    (c) => c.id === caseId || c.studentMssv === scenario.mssv || c.caseCode === caseId
  );

  const formCopy: StudentApplicationForm = { ...scenario.form };
  const evidenceCopy = scenario.evidence ? scenario.evidence.map((e) => ({ ...e })) : [];

  if (existingIdx >= 0) {
    const existing = all[existingIdx];
    // Nếu ca chưa qua bước Cố vấn duyệt, cập nhật dữ liệu mới nhất từ scenario
    if (!existing.advisorDecision) {
      existing.form = formCopy;
      existing.evidence = evidenceCopy;
      existing.attachedEvidenceIds = evidenceCopy.map((e) => e.id);
      saveAllSubmittedCases(all);
    }
    return existing;
  }

  const newCase: SubmittedCase = {
    id: caseId,
    caseCode: caseId,
    studentMssv: scenario.mssv,
    studentName: scenario.studentName,
    studentClass: scenario.form.className || '47K12.1',
    studentFaculty: scenario.form.faculty || 'Khoa Công nghệ thông tin kinh doanh',
    studentPhone: scenario.form.phone || '0905123456',
    studentEmail: scenario.form.email || `${scenario.mssv}@due.edu.vn`,
    form: formCopy,
    evidence: evidenceCopy,
    attachedEvidenceIds: evidenceCopy.map((e) => e.id),
    submittedAt:
      new Date().toLocaleDateString('vi-VN') +
      ' ' +
      new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    day: 0,
    status: 'pending_advisor',
  };

  all.unshift(newCase);
  saveAllSubmittedCases(all);
  return newCase;
}

/**
 * Danh sách hồ sơ dành cho Bàn Cố vấn học tập (Lane L2 / T4):
 * - Hiển thị tất cả hồ sơ nộp tới Cố vấn.
 * - Ưu tiên ca đang chờ duyệt (chưa có advisorDecision) lên trước.
 * - Ca đã duyệt / từ chối luôn bị đẩy xuống dưới cùng.
 */
export function getAdvisorCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.status !== 'returned')
    .sort((a, b) => {
      const aPending = !a.advisorDecision ? 0 : 1;
      const bPending = !b.advisorDecision ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (b.id || '').localeCompare(a.id || '');
    });
}

/**
 * Danh sách hồ sơ chuyển sang Bàn CTSV (Lane L3 / T5):
 * - CHỈ NHỮNG HỒ SƠ ĐÃ ĐƯỢC CỐ VẤN DUYỆT (advisorDecision === 'confirmed') mới xuất hiện!
 * - Ưu tiên ca chưa thẩm định (chưa có ctsvDecision) lên trước.
 * - Ca đã thẩm định bị đẩy xuống dưới cùng.
 */
export function getCtsvCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.advisorDecision === 'confirmed')
    .sort((a, b) => {
      const aPending = !a.ctsvDecision ? 0 : 1;
      const bPending = !b.ctsvDecision ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (b.id || '').localeCompare(a.id || '');
    });
}

/**
 * Danh sách hồ sơ trình Ban Giám hiệu ký số (Lane L4 / T9):
 * - CHỈ NHỮNG HỒ SƠ ĐÃ ĐẠT CẢ 2 BƯỚC:
 *   1. Cố vấn xác nhận (advisorDecision === 'confirmed')
 *   2. CTSV thẩm định hợp lệ (ctsvDecision === 'valid')
 *   mới đủ điều kiện xuất hiện trên bàn BGH để ký số!
 * - Ưu tiên ca chưa ký số (!c.principalSigned) lên trước.
 * - Ca đã ký số ban hành bị đẩy xuống dưới cùng.
 */
export function getPrincipalCases(): SubmittedCase[] {
  const all = getAllSubmittedCases();
  return all
    .filter((c) => c.advisorDecision === 'confirmed' && c.ctsvDecision === 'valid')
    .sort((a, b) => {
      const aPending = !a.principalSigned ? 0 : 1;
      const bPending = !b.principalSigned ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return (b.id || '').localeCompare(a.id || '');
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
