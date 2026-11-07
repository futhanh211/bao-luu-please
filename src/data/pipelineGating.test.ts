import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAllSubmittedCases,
  getAllSubmittedCases,
  saveSubmittedCase,
  updateCaseAdvisorDecision,
  updateCaseCtsvDecision,
  updateCasePrincipalSign,
  getAdvisorCases,
  getCtsvCases,
  getPrincipalCases,
  SubmittedCase,
} from './caseRegistry';

describe('Multi-Role Pipeline Gating & Access Control (Luật gating giữa các vai)', () => {
  beforeEach(() => {
    clearAllSubmittedCases();
  });

  it('1. Hồ sơ nộp ban đầu: chỉ nằm ở AdvisorCases, chưa thể lọt vào CTSV hay BGH', () => {
    const newCase: SubmittedCase = {
      id: 'BL-TEST-01',
      caseCode: 'BL-TEST-01',
      studentMssv: '251121536901',
      studentName: 'Trần Văn A',
      studentClass: '51K36',
      studentFaculty: 'Khoa CNTT',
      form: {
        fullName: 'Trần Văn A',
        mssv: '251121536901',
        className: '51K36',
        faculty: 'Khoa CNTT',
        phone: '0905123456',
        email: '251121536901@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };
    saveSubmittedCase(newCase);

    const advisorCases = getAdvisorCases();
    expect(advisorCases.some((c) => c.id === 'BL-TEST-01')).toBe(true);

    const ctsvCases = getCtsvCases();
    expect(ctsvCases.some((c) => c.id === 'BL-TEST-01')).toBe(false);

    const principalCases = getPrincipalCases();
    expect(principalCases.some((c) => c.id === 'BL-TEST-01')).toBe(false);
  });

  it('2. Nếu Cố vấn từ chối (KHÔNG XÁC NHẬN): hồ sơ "bay luôn" khỏi CTSV và BGH', () => {
    const newCase: SubmittedCase = {
      id: 'BL-TEST-02',
      caseCode: 'BL-TEST-02',
      studentMssv: '251121536902',
      studentName: 'Lê Thị B',
      studentClass: '51K36',
      studentFaculty: 'Khoa Quản trị',
      form: {
        fullName: 'Lê Thị B',
        mssv: '251121536902',
        className: '51K36',
        faculty: 'Khoa Quản trị',
        phone: '0905123456',
        email: '251121536902@due.udn.vn',
        reason: 'Lý do cá nhân khác',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };
    saveSubmittedCase(newCase);

    // Cố vấn đóng dấu KHÔNG XÁC NHẬN
    const updated = updateCaseAdvisorDecision('BL-TEST-02', 'declined', 'Lý do không chính đáng');
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('rejected');
    expect(updated?.advisorDecision).toBe('declined');

    // Kiểm tra CTSV: Tuyệt đối không xuất hiện
    const ctsvCases = getCtsvCases();
    expect(ctsvCases.some((c) => c.id === 'BL-TEST-02')).toBe(false);

    // Kiểm tra BGH: Tuyệt đối không xuất hiện
    const principalCases = getPrincipalCases();
    expect(principalCases.some((c) => c.id === 'BL-TEST-02')).toBe(false);
  });

  it('3. Gatekeeper từ chối cập nhật CTSV và BGH nếu Cố vấn đã từ chối', () => {
    const newCase: SubmittedCase = {
      id: 'BL-TEST-03',
      caseCode: 'BL-TEST-03',
      studentMssv: '251121536903',
      studentName: 'Vũ Văn C',
      studentClass: '51K36',
      studentFaculty: 'Khoa Marketing',
      form: {
        fullName: 'Vũ Văn C',
        mssv: '251121536903',
        className: '51K36',
        faculty: 'Khoa Marketing',
        phone: '0905123456',
        email: '251121536903@due.udn.vn',
        reason: 'Lý do cá nhân khác',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'pending_advisor',
      advisorDecision: 'declined',
    };
    saveSubmittedCase(newCase);

    // Cố ý gọi updateCaseCtsvDecision
    const ctsvRes = updateCaseCtsvDecision('BL-TEST-03', 'valid');
    expect(ctsvRes).toBeNull();

    // Cố ý gọi updateCasePrincipalSign
    const principalRes = updateCasePrincipalSign('BL-TEST-03', 'PGS.TS. Trần Đình Khôi');
    expect(principalRes).toBeNull();
  });

  it('4. Cố vấn duyệt -> CTSV thấy; CTSV từ chối (KHÔNG HỢP LỆ) -> BGH "bay luôn"', () => {
    const newCase: SubmittedCase = {
      id: 'BL-TEST-04',
      caseCode: 'BL-TEST-04',
      studentMssv: '251121536904',
      studentName: 'Đặng Thu D',
      studentClass: '51K36',
      studentFaculty: 'Khoa Kinh tế',
      form: {
        fullName: 'Đặng Thu D',
        mssv: '251121536904',
        className: '51K36',
        faculty: 'Khoa Kinh tế',
        phone: '0905123456',
        email: '251121536904@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };
    saveSubmittedCase(newCase);

    // 1. Cố vấn duyệt
    updateCaseAdvisorDecision('BL-TEST-04', 'confirmed');
    expect(getCtsvCases().some((c) => c.id === 'BL-TEST-04')).toBe(true);
    expect(getPrincipalCases().some((c) => c.id === 'BL-TEST-04')).toBe(false);

    // 2. CTSV đóng dấu KHÔNG HỢP LỆ
    const ctsvRes = updateCaseCtsvDecision('BL-TEST-04', 'invalid', ['bv_khong_hop_le']);
    expect(ctsvRes).not.toBeNull();
    expect(ctsvRes?.status).toBe('rejected');

    // 3. BGH kiểm tra danh sách: Không có hồ sơ này
    expect(getPrincipalCases().some((c) => c.id === 'BL-TEST-04')).toBe(false);

    // 4. Cố ý ký số: Bị từ chối
    const pRes = updateCasePrincipalSign('BL-TEST-04', 'PGS.TS. Trần Đình Khôi');
    expect(pRes).toBeNull();
  });

  it('5. Cố vấn duyệt VÀ CTSV hợp lệ -> BGH thấy và ký số thành công', () => {
    const newCase: SubmittedCase = {
      id: 'BL-TEST-05',
      caseCode: 'BL-TEST-05',
      studentMssv: '251121536905',
      studentName: 'Hoàng Anh E',
      studentClass: '51K36',
      studentFaculty: 'Khoa Tài chính',
      form: {
        fullName: 'Hoàng Anh E',
        mssv: '251121536905',
        className: '51K36',
        faculty: 'Khoa Tài chính',
        phone: '0905123456',
        email: '251121536905@due.udn.vn',
        reason: 'Nghĩa vụ quân sự',
        semesterCount: 2,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };
    saveSubmittedCase(newCase);

    // Cố vấn duyệt
    updateCaseAdvisorDecision('BL-TEST-05', 'confirmed');
    // CTSV thẩm định hợp lệ
    updateCaseCtsvDecision('BL-TEST-05', 'valid');

    // BGH thấy hồ sơ
    const principalCases = getPrincipalCases();
    expect(principalCases.some((c) => c.id === 'BL-TEST-05')).toBe(true);

    // BGH ký số
    const signed = updateCasePrincipalSign('BL-TEST-05', 'PGS.TS. Trần Đình Khôi');
    expect(signed).not.toBeNull();
    expect(signed?.principalSigned).toBe(true);
    expect(signed?.status).toBe('completed');
  });

  it('6. Auto-sanitizer: Dọn dẹp triệt để dữ liệu lỗi cũ trong localStorage', () => {
    // Giả lập ca lỗi cũ: Cố vấn đã từ chối nhưng bị ghi đè principalSigned = true
    const dirtyCase: SubmittedCase = {
      id: 'BL-DIRTY-01',
      caseCode: 'BL-DIRTY-01',
      studentMssv: '251121536999',
      studentName: 'Test Dirty',
      studentClass: '51K36',
      studentFaculty: 'Khoa CNTT',
      form: {
        fullName: 'Test Dirty',
        mssv: '251121536999',
        className: '51K36',
        faculty: 'Khoa CNTT',
        phone: '0905123456',
        email: 'dirty@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '29/10/2026 10:00',
      day: 0,
      status: 'completed',
      advisorDecision: 'declined', // Cố vấn đã từ chối!
      principalSigned: true, // Sai phạm do phiên cũ!
      decisionDoc: {
        number: 'BL-DIRTY/QĐ',
        decisionDate: '01/09/2026',
        durationSemesters: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        studentName: 'Test Dirty',
        mssv: '251121536999',
        faculty: 'Khoa CNTT',
        basisText: 'Basis',
        signed: true,
        signerName: 'Hiệu trưởng',
      },
    };

    // Ghi trực tiếp vào storage
    saveSubmittedCase(dirtyCase);

    // Gọi getAllSubmittedCases() -> Auto sanitizer chạy
    const cleaned = getAllSubmittedCases();
    const target = cleaned.find((c) => c.id === 'BL-DIRTY-01');

    expect(target).toBeDefined();
    expect(target?.status).toBe('rejected');
    expect(target?.principalSigned).toBe(false);
    expect(target?.decisionDoc).toBeUndefined();
    expect(target?.principalSignerName).toBeUndefined();
    expect(getPrincipalCases().some((c) => c.id === 'BL-DIRTY-01')).toBe(false);
  });

  it('7. Hồ sơ bị trả về ngay tại cổng kiểm tra tự động T1 (status: returned) không chuyển tới L2, L3, L4', () => {
    const returnedCase: SubmittedCase = {
      id: 'BL-TEST-RETURNED',
      caseCode: 'BL-TEST-RETURNED',
      studentMssv: '251121536907',
      studentName: 'Trần Thị Thiếu',
      studentClass: '51K36',
      studentFaculty: 'Khoa Thương mại',
      form: {
        fullName: 'Trần Thị Thiếu',
        mssv: '251121536907',
        className: '51K36',
        faculty: 'Khoa Thương mại',
        phone: '0905123456',
        email: '251121536907@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 10:00',
      day: 0,
      status: 'returned', // AI phát hiện thiếu minh chứng ngay tại T1/G1
    };

    saveSubmittedCase(returnedCase);

    // Bàn Cố vấn (L2): Không được nhận hồ sơ này
    expect(getAdvisorCases().some((c) => c.id === 'BL-TEST-RETURNED')).toBe(false);

    // Bàn CTSV (L3): Không được nhận hồ sơ này
    expect(getCtsvCases().some((c) => c.id === 'BL-TEST-RETURNED')).toBe(false);

    // Bàn Ban Giám hiệu (L4): Không được nhận hồ sơ này
    expect(getPrincipalCases().some((c) => c.id === 'BL-TEST-RETURNED')).toBe(false);
  });
});
