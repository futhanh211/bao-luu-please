import { EvidenceItem, StudentApplicationForm, DecisionDoc, EngineEvent } from '../engine/types';
import { getStorageItem, setStorageItem } from './userRegistry';
import { getStudentFormData, buildEvidenceItemsFromFormData } from './studentFormData';

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
    status: 'pending_ctsv',
    advisorDecision: 'confirmed',
    advisorDecisionAt: '29/10/2026 22:00',
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
  // Sau khi Cố vấn xác nhận, hồ sơ chuyển sang khâu CTSV thẩm tra (T5)
  target.status = 'pending_ctsv';
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
