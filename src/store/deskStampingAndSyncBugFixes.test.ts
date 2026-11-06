import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSubmittedCase,
  updateCaseAdvisorDecision,
  updateCaseCtsvDecision,
  updateCasePrincipalSign,
  getCtsvCases,
  getPrincipalCases,
  getAdvisorCases,
  resetSubmittedCasesToDefault,
  SubmittedCase,
} from '../data/caseRegistry';
import {
  toSupabaseRow,
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  isSupabaseConfigured,
} from '../services/supabaseClient';

describe('Desk Stamping, State Reset & Supabase Sync Verification', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    resetSubmittedCasesToDefault(true);
  });

  it('1. Cố vấn học tập có thể duyệt tuần tự nhiều ca mà không bị khựng (resolved flag reset)', () => {
    const caseA: SubmittedCase = {
      id: 'BL-TEST-A1',
      caseCode: 'BL-TEST-A1',
      studentMssv: '210001',
      studentName: 'Sinh viên A1',
      studentClass: '48K12',
      studentFaculty: 'CNTT',
      form: {
        fullName: 'Sinh viên A1',
        mssv: '210001',
        className: '48K12',
        faculty: 'CNTT',
        phone: '0905111222',
        email: 'a1@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'HK1 2026-2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '06/11/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };

    const caseA2: SubmittedCase = {
      ...caseA,
      id: 'BL-TEST-A2',
      caseCode: 'BL-TEST-A2',
      studentMssv: '210002',
      studentName: 'Sinh viên A2',
    };

    saveSubmittedCase(caseA);
    saveSubmittedCase(caseA2);

    // Duyệt ca thứ nhất:
    const updated1 = updateCaseAdvisorDecision('BL-TEST-A1', 'confirmed');
    expect(updated1).toBeDefined();
    expect(updated1?.advisorDecision).toBe('confirmed');
    expect(updated1?.status).toBe('pending_ctsv');

    // Sau khi duyệt ca 1, ca 2 vẫn ở trạng thái pending và duyệt tiếp được ngay lập tức:
    const updated2 = updateCaseAdvisorDecision('BL-TEST-A2', 'confirmed');
    expect(updated2).toBeDefined();
    expect(updated2?.advisorDecision).toBe('confirmed');
    expect(updated2?.status).toBe('pending_ctsv');

    // CTSV thấy cả 2 ca
    const ctsvCases = getCtsvCases();
    expect(ctsvCases.some((c) => c.id === 'BL-TEST-A1')).toBe(true);
    expect(ctsvCases.some((c) => c.id === 'BL-TEST-A2')).toBe(true);
  });

  it('2. CTSV có thể thẩm định tuần tự nhiều ca mà không bị khựng', () => {
    const caseB1: SubmittedCase = {
      id: 'BL-TEST-B1',
      caseCode: 'BL-TEST-B1',
      studentMssv: '220001',
      studentName: 'Sinh viên B1',
      studentClass: '48K12',
      studentFaculty: 'CNTT',
      form: {
        fullName: 'Sinh viên B1',
        mssv: '220001',
        className: '48K12',
        faculty: 'CNTT',
        phone: '0905111222',
        email: 'b1@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'HK1 2026-2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '06/11/2026 10:00',
      day: 0,
      status: 'pending_ctsv',
      advisorDecision: 'confirmed',
    };

    const caseB2: SubmittedCase = {
      ...caseB1,
      id: 'BL-TEST-B2',
      caseCode: 'BL-TEST-B2',
      studentMssv: '220002',
      studentName: 'Sinh viên B2',
    };

    saveSubmittedCase(caseB1);
    saveSubmittedCase(caseB2);

    // Thẩm định ca 1
    const v1 = updateCaseCtsvDecision('BL-TEST-B1', 'valid', []);
    expect(v1).toBeDefined();
    expect(v1?.ctsvDecision).toBe('valid');
    expect(v1?.status).toBe('pending_principal');

    // Thẩm định ca 2 ngay sau đó
    const v2 = updateCaseCtsvDecision('BL-TEST-B2', 'valid', []);
    expect(v2).toBeDefined();
    expect(v2?.ctsvDecision).toBe('valid');
    expect(v2?.status).toBe('pending_principal');

    // BGH thấy cả 2 ca đủ điều kiện ký số
    const bghCases = getPrincipalCases();
    expect(bghCases.some((c) => c.id === 'BL-TEST-B1')).toBe(true);
    expect(bghCases.some((c) => c.id === 'BL-TEST-B2')).toBe(true);
  });

  it('3. BGH có thể ký số tuần tự nhiều ca mà không bị khựng', () => {
    const caseC1: SubmittedCase = {
      id: 'BL-TEST-C1',
      caseCode: 'BL-TEST-C1',
      studentMssv: '230001',
      studentName: 'Sinh viên C1',
      studentClass: '48K12',
      studentFaculty: 'CNTT',
      form: {
        fullName: 'Sinh viên C1',
        mssv: '230001',
        className: '48K12',
        faculty: 'CNTT',
        phone: '0905111222',
        email: 'c1@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'HK1 2026-2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '06/11/2026 10:00',
      day: 0,
      status: 'pending_principal',
      advisorDecision: 'confirmed',
      ctsvDecision: 'valid',
    };

    const caseC2: SubmittedCase = {
      ...caseC1,
      id: 'BL-TEST-C2',
      caseCode: 'BL-TEST-C2',
      studentMssv: '230002',
      studentName: 'Sinh viên C2',
    };

    saveSubmittedCase(caseC1);
    saveSubmittedCase(caseC2);

    const s1 = updateCasePrincipalSign('BL-TEST-C1', 'Hiệu trưởng');
    expect(s1).toBeDefined();
    expect(s1?.principalSigned).toBe(true);
    expect(s1?.status).toBe('completed');

    const s2 = updateCasePrincipalSign('BL-TEST-C2', 'Hiệu trưởng');
    expect(s2).toBeDefined();
    expect(s2?.principalSigned).toBe(true);
    expect(s2?.status).toBe('completed');
  });

  it('4. Làm sạch dữ liệu minh chứng có dataUrl Base64 quá lớn (>150KB) khi đẩy lên Supabase', () => {
    const hugeBase64 = 'data:image/png;base64,' + 'A'.repeat(200000);
    const caseWithHugeFile: SubmittedCase = {
      id: 'BL-TEST-HUGE',
      caseCode: 'BL-TEST-HUGE',
      studentMssv: '240001',
      studentName: 'Sinh viên Tải Tệp Lớn',
      studentClass: '48K12',
      studentFaculty: 'CNTT',
      form: {
        fullName: 'Sinh viên Tải Tệp Lớn',
        mssv: '240001',
        className: '48K12',
        faculty: 'CNTT',
        phone: '0905111222',
        email: 'huge@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'HK1 2026-2027',
        commitment: true,
      },
      evidence: [
        {
          id: 'ev_huge_file',
          type: 'attached_file',
          name: 'anh_benh_vien_lon.jpg',
          content: 'Ảnh chụp bệnh án dung lượng lớn',
          fileData: {
            name: 'anh_benh_vien_lon.jpg',
            size: 250000,
            type: 'image/jpeg',
            lastModified: Date.now(),
            dataUrl: hugeBase64,
          },
        },
      ],
      attachedEvidenceIds: ['ev_huge_file'],
      submittedAt: '06/11/2026 10:00',
      day: 0,
      status: 'pending_advisor',
    };

    const row = toSupabaseRow(caseWithHugeFile);
    expect(row.id).toBe('BL-TEST-HUGE');
    const evRow = row.evidence as Array<{ fileData?: { dataUrl?: string } }>;
    expect(evRow[0].fileData?.dataUrl).toContain('DATA_URL_TRUNCATED_FOR_CLOUD_SYNC');
    expect(evRow[0].fileData?.dataUrl?.length).toBeLessThan(100);
  });

  it('5. Lưu và phục hồi cấu hình Supabase tùy chỉnh trong localStorage', () => {
    saveCustomSupabaseConfig('https://mytestproject.supabase.co', 'my-test-anon-key-123');
    const cfg = getSupabaseConfig();
    expect(cfg).not.toBeNull();
    expect(cfg?.url).toBe('https://mytestproject.supabase.co');
    expect(cfg?.anonKey).toBe('my-test-anon-key-123');
    expect(isSupabaseConfigured()).toBe(true);

    // Xóa cấu hình tùy chỉnh để trả về env mặc định
    saveCustomSupabaseConfig('', '');
    const resetCfg = getSupabaseConfig();
    expect(resetCfg?.url).not.toBe('https://mytestproject.supabase.co');
  });

  it('6. Hồ sơ bị hệ thống từ chối sớm (G2/BT1) không xuất hiện ở trạng thái chờ duyệt của Cố vấn', () => {
    const earlyRejectedCase: SubmittedCase = {
      id: 'BL-TEST-EARLY-REJECT',
      caseCode: 'BL-TEST-EARLY-REJECT',
      studentMssv: '250001',
      studentName: 'Sinh viên Bị Từ Chối Sớm',
      studentClass: '48K12',
      studentFaculty: 'CNTT',
      form: {
        fullName: 'Sinh viên Bị Từ Chối Sớm',
        mssv: '250001',
        className: '48K12',
        faculty: 'CNTT',
        phone: '0905111222',
        email: 'early@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'HK1 2026-2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '06/11/2026 10:00',
      day: 0,
      status: 'rejected',
    };

    saveSubmittedCase(earlyRejectedCase);
    const advisorList = getAdvisorCases();
    // Hồ sơ này không được phép nằm trong danh sách Cố vấn cần xử lý
    expect(advisorList.some((c) => c.id === 'BL-TEST-EARLY-REJECT')).toBe(false);
  });
});
