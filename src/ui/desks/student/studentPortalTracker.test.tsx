import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentPortalTracker } from './StudentPortalTracker';
import {
  saveSubmittedCase,
  updateCaseAdvisorDecision,
  updateCaseCtsvDecision,
  updateCasePrincipalSign,
  resetSubmittedCasesToDefault,
  SubmittedCase,
} from '../../../data/caseRegistry';

describe('StudentPortalTracker — Hiển thị hồ sơ theo ma trận phân quyền', () => {
  beforeEach(() => {
    resetSubmittedCasesToDefault();
  });

  it('1. khi Cố vấn từ chối (declined): tracker hiển thị Từ chối ở bước 2, Đã dừng ở bước 3-4, Từ chối ở bước 5, và Thông báo từ chối', () => {
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

    // Bước 2 (Cố vấn) phải hiển thị Từ chối (KHÔNG ĐƯỢC hiển thị "Đã duyệt")
    expect(html).toContain('Từ chối');
    expect(html).not.toContain('Đã duyệt');

    // Bước 3 (CTSV) và Bước 4 (BGH) phải hiển thị Đã dừng (KHÔNG ĐƯỢC là "Đang thẩm định")
    expect(html).toContain('Đã dừng');
    expect(html).not.toContain('Đang thẩm định');

    // Văn bản hiển thị: Thông báo từ chối với con dấu đỏ TỪ CHỐI
    expect(html).toContain('THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ');
    expect(html).toContain('Cố vấn học tập');
    expect(html).not.toContain('PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ');
  });

  it('2. khi Cố vấn duyệt nhưng CTSV từ chối (invalid): Bước 2 Đã duyệt, Bước 3 Từ chối, Bước 4 Đã dừng, Bước 5 Từ chối', () => {
    const testCase: SubmittedCase = {
      id: 'BL-2026-91',
      caseCode: 'BL-2026-91',
      studentMssv: '251121536133',
      studentName: 'Nguyễn Văn F',
      studentClass: '51K36',
      studentFaculty: 'Khoa Kinh tế',
      form: {
        fullName: 'Nguyễn Văn F',
        mssv: '251121536133',
        className: '51K36',
        faculty: 'Khoa Kinh tế',
        phone: '0905123456',
        email: 'f@due.udn.vn',
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
    updateCaseAdvisorDecision('BL-2026-91', 'confirmed');
    updateCaseCtsvDecision('BL-2026-91', 'invalid', ['bv_khong_hop_le'], 'Minh chứng y tế sai quy cách');

    const html = renderToStaticMarkup(
      <StudentPortalTracker
        caseCode="BL-2026-91"
        studentName="Nguyễn Văn F"
        mssv="251121536133"
        faculty="Khoa Kinh tế"
        log={[]}
        day={0}
      />
    );

    // Bước 2: Đã duyệt
    expect(html).toContain('Đã duyệt');
    // Bước 3: Từ chối
    expect(html).toContain('THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ');
    expect(html).toContain('BỘ PHẬN MỘT CỬA CTSV');
    expect(html).toContain('ThS. Nguyễn Thị Mai');
  });

  it('3. khi hoàn tất ký số BGH (completed): cả 5 bước hoàn tất và hiển thị Quyết định nghỉ học tạm thời', () => {
    const testCase: SubmittedCase = {
      id: 'BL-2026-92',
      caseCode: 'BL-2026-92',
      studentMssv: '251121536134',
      studentName: 'Hoàng Thị G',
      studentClass: '51K36',
      studentFaculty: 'Khoa Luật',
      form: {
        fullName: 'Hoàng Thị G',
        mssv: '251121536134',
        className: '51K36',
        faculty: 'Khoa Luật',
        phone: '0905123456',
        email: 'g@due.udn.vn',
        reason: 'Nghĩa vụ quân sự',
        semesterCount: 2,
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
    updateCaseAdvisorDecision('BL-2026-92', 'confirmed');
    updateCaseCtsvDecision('BL-2026-92', 'valid');
    updateCasePrincipalSign('BL-2026-92', 'PGS.TS. Trần Đình Khôi - Hiệu trưởng');

    const html = renderToStaticMarkup(
      <StudentPortalTracker
        caseCode="BL-2026-92"
        studentName="Hoàng Thị G"
        mssv="251121536134"
        faculty="Khoa Luật"
        log={[]}
        day={0}
      />
    );

    expect(html).toContain('Đã ký số');
    expect(html).toContain('Thành công');
    expect(html).toContain('Quyết định bảo lưu kết quả học tập đã được ban hành');
  });

  it('4. khi hồ sơ bị trả lại do thiếu minh chứng ngay tại T1/G1 (returned): hiển thị Phiếu hướng dẫn bổ sung hồ sơ', () => {
    const testCase: SubmittedCase = {
      id: 'BL-2026-93',
      caseCode: 'BL-2026-93',
      studentMssv: '251121536135',
      studentName: 'Trịnh H',
      studentClass: '51K36',
      studentFaculty: 'Khoa CNTT',
      form: {
        fullName: 'Trịnh H',
        mssv: '251121536135',
        className: '51K36',
        faculty: 'Khoa CNTT',
        phone: '0905123456',
        email: 'h@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 12:00',
      day: 0,
      status: 'returned',
    };

    saveSubmittedCase(testCase);

    const html = renderToStaticMarkup(
      <StudentPortalTracker
        caseCode="BL-2026-93"
        studentName="Trịnh H"
        mssv="251121536135"
        faculty="Khoa CNTT"
        log={[]}
        day={0}
      />
    );

    expect(html).toContain('Trả hồ sơ');
    expect(html).toContain('PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ');
  });
});
