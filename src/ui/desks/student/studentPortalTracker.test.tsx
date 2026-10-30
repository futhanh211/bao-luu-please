import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentPortalTracker } from './StudentPortalTracker';
import {
  saveSubmittedCase,
  updateCaseAdvisorDecision,
  resetSubmittedCasesToDefault,
  SubmittedCase,
} from '../../../data/caseRegistry';

describe('StudentPortalTracker — Hiển thị hồ sơ bị từ chối từ Cố vấn (người đầu tiên)', () => {
  beforeEach(() => {
    resetSubmittedCasesToDefault();
  });

  it('khi Cố vấn từ chối (declined), tracker hiển thị Từ chối ở bước 2, Đã dừng ở bước 3-4, Từ chối ở bước 5, và Thông báo từ chối', () => {
    const testCase: SubmittedCase = {
      id: 'BL-2026-90',
      caseCode: 'BL-2026-90',
      studentMssv: '251121536132',
      studentName: 'Thanhz Lam',
      studentClass: '51K36',
      studentFaculty: 'Khoa Công nghệ thông tin kinh doanh',
      form: {
        fullName: 'Thanhz Lam',
        mssv: '251121536132',
        className: '51K36',
        faculty: 'Khoa Công nghệ thông tin kinh doanh',
        phone: '0905123456',
        email: 'thanhz@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 12:00',
      day: 0,
      status: 'pending_advisor',
    };

    saveSubmittedCase(testCase);

    // Cố vấn (người đầu tiên) đóng dấu không xác nhận
    const updated = updateCaseAdvisorDecision('BL-2026-90', 'declined', 'Không đủ điều kiện theo trao đổi với cố vấn');
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('rejected');
    expect(updated?.advisorDecision).toBe('declined');

    // Render StudentPortalTracker cho sinh viên này
    const html = renderToStaticMarkup(
      <StudentPortalTracker
        caseCode="BL-2026-90"
        studentName="Thanhz Lam"
        mssv="251121536132"
        faculty="Khoa Công nghệ thông tin kinh doanh"
        log={[]}
        day={0}
      />
    );

    // 1. Bước 2 (Cố vấn) phải hiển thị Từ chối (KHÔNG ĐƯỢC hiển thị "Đã duyệt")
    expect(html).toContain('Từ chối');
    expect(html).not.toContain('Đã duyệt');

    // 2. Bước 3 (CTSV) và Bước 4 (BGH) phải hiển thị Đã dừng (KHÔNG ĐƯỢC là "Đang thẩm định")
    expect(html).toContain('Đã dừng');
    expect(html).not.toContain('Đang thẩm định');

    // 3. Tiêu đề văn bản là "THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ" (KHÔNG ĐƯỢC là "PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ")
    expect(html).toContain('THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ');
    expect(html).not.toContain('PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ');

    // 4. Con dấu phải là TỪ CHỐI (KHÔNG ĐƯỢC là TRẢ HỒ SƠ)
    expect(html).toContain('TỪ CHỐI');
    expect(html).not.toContain('TRẢ HỒ SƠ');

    // 5. Thể hiện rõ lý do Cố vấn không xác nhận
    expect(html).toContain('Cố vấn học tập không xác nhận');
  });
});
