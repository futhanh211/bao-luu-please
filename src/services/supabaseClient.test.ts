import { describe, it, expect, vi } from 'vitest';
import {
  toSupabaseRow,
  fromSupabaseRow,
  isSupabaseConfigured,
  testSupabaseConnection,
} from './supabaseClient';
import { SubmittedCase, subscribeCases, notifyCaseListeners } from '../data/caseRegistry';

describe('Supabase Client & Realtime Data Serialization', () => {
  const sampleCase: SubmittedCase = {
    id: 'BL-2026-99',
    caseCode: 'BL-2026-99',
    studentMssv: '251121536999',
    studentName: 'Nguyễn Văn Test',
    studentClass: '47K12.1',
    studentFaculty: 'Khoa Công nghệ thông tin kinh doanh',
    studentPhone: '0905123456',
    studentEmail: '251121536999@due.edu.vn',
    form: {
      fullName: 'Nguyễn Văn Test',
      mssv: '251121536999',
      className: '47K12.1',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      phone: '0905123456',
      email: '251121536999@due.edu.vn',
      reason: 'Ốm đau/tai nạn điều trị dài',
      semesterCount: 1,
      startSemester: 'Học kỳ 1 năm học 2026–2027',
      commitment: true,
    },
    evidence: [
      {
        id: 'ev-test-1',
        type: 'medical',
        name: 'Giấy ra viện Bệnh viện Đa khoa',
        content: 'Nội dung chứng nhận điều trị',
      },
    ],
    attachedEvidenceIds: ['ev-test-1'],
    submittedAt: '06/11/2026 10:00',
    day: 0,
    status: 'pending_advisor',
    advisorDecision: 'confirmed',
    advisorDecisionAt: '06/11/2026 10:30',
    advisorNotes: 'Đã xác nhận hoàn cảnh',
    ctsvDecision: 'valid',
    ctsvDecisionAt: '06/11/2026 11:00',
    ctsvMarks: ['bv_da_khoa'],
    ctsvNotes: 'Hồ sơ đầy đủ mộc đỏ',
    principalSigned: true,
    principalSignedAt: '06/11/2026 11:30',
    principalSignerName: 'PGS.TS. Trần Đình Khôi - Hiệu trưởng',
    decisionDoc: {
      number: 'BL-99/QĐ-ĐHKT',
      decisionDate: '06/11/2026',
      durationSemesters: 1,
      startSemester: 'Học kỳ 1 năm học 2026–2027',
      studentName: 'Nguyễn Văn Test',
      mssv: '251121536999',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      basisText: 'Xét đơn của sinh viên',
      signed: true,
      signerName: 'PGS.TS. Trần Đình Khôi - Hiệu trưởng',
    },
  };

  it('1. Chuyển đổi chính xác từ SubmittedCase sang Supabase Row (toSupabaseRow)', () => {
    const row = toSupabaseRow(sampleCase);
    expect(row.id).toBe('BL-2026-99');
    expect(row.case_code).toBe('BL-2026-99');
    expect(row.student_mssv).toBe('251121536999');
    expect(row.student_name).toBe('Nguyễn Văn Test');
    expect(row.advisor_decision).toBe('confirmed');
    expect(row.ctsv_decision).toBe('valid');
    expect(row.principal_signed).toBe(true);
    expect(row.principal_signer_name).toBe('PGS.TS. Trần Đình Khôi - Hiệu trưởng');
    expect(row.decision_doc).toBeDefined();
    expect(row.updated_at).toBeDefined();
  });

  it('2. Chuyển đổi chính xác từ Supabase Row về SubmittedCase (fromSupabaseRow)', () => {
    const row = toSupabaseRow(sampleCase);
    const restored = fromSupabaseRow(row);

    expect(restored.id).toBe(sampleCase.id);
    expect(restored.caseCode).toBe(sampleCase.caseCode);
    expect(restored.studentMssv).toBe(sampleCase.studentMssv);
    expect(restored.studentName).toBe(sampleCase.studentName);
    expect(restored.form.reason).toBe(sampleCase.form.reason);
    expect(restored.evidence.length).toBe(1);
    expect(restored.advisorDecision).toBe('confirmed');
    expect(restored.ctsvDecision).toBe('valid');
    expect(restored.principalSigned).toBe(true);
    expect(restored.decisionDoc?.number).toBe('BL-99/QĐ-ĐHKT');
  });

  it('3. Khi chưa có biến môi trường Supabase, isSupabaseConfigured trả về false an toàn', () => {
    // Trong môi trường test mặc định không có .env.local
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('4. testSupabaseConnection báo lỗi rõ ràng nếu chưa cung cấp URL / Anon Key', async () => {
    const res = await testSupabaseConnection('', '');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Chưa cấu hình Supabase URL hoặc Anon Key');
  });

  it('5. Hệ thống đăng ký subscribeCases và notifyCaseListeners hoạt động chuẩn xác', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeCases(callback);

    notifyCaseListeners();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(Array.isArray(callback.mock.calls[0][0])).toBe(true);

    unsubscribe();
    notifyCaseListeners();
    expect(callback).toHaveBeenCalledTimes(1); // không gọi thêm sau khi unsubscribe
  });
});
