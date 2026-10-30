import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllSubmittedCases,
  saveSubmittedCase,
  resetSubmittedCasesToDefault,
  clearAllSubmittedCases,
  exportAllCasesJson,
  importCasesJson,
  SubmittedCase,
} from '../../data/caseRegistry';
import {
  getRegisteredAccounts,
  resetUsersToDefault,
  exportAllUsersJson,
  importUsersJson,
} from '../../data/userRegistry';
import { testGeminiConnection } from '../../ai/live';

describe('StorageManager & External Integration Suite', () => {
  beforeEach(() => {
    resetSubmittedCasesToDefault();
    resetUsersToDefault();
  });

  it('xác thực khởi tạo và lưu trữ bền vững hồ sơ bảo lưu', () => {
    const cases = getAllSubmittedCases();
    expect(cases.length).toBeGreaterThanOrEqual(1);
    expect(cases[0].caseCode).toBeDefined();

    // Thêm hồ sơ mới và kiểm tra lưu trữ
    const newCase: SubmittedCase = {
      id: 'BL-TEST-999',
      caseCode: 'BL-TEST-999',
      studentMssv: '251121536999',
      studentName: 'Sinh viên Kiểm thử Bền vững',
      studentClass: '51K36',
      studentFaculty: 'Khoa Thống kê - Tin học',
      form: {
        fullName: 'Sinh viên Kiểm thử Bền vững',
        mssv: '251121536999',
        className: '51K36',
        faculty: 'Khoa Thống kê - Tin học',
        phone: '0905123456',
        email: '251121536999@due.udn.vn',
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

    saveSubmittedCase(newCase);
    const updatedCases = getAllSubmittedCases();
    const found = updatedCases.find((c) => c.id === 'BL-TEST-999');
    expect(found).toBeDefined();
    expect(found?.studentName).toBe('Sinh viên Kiểm thử Bền vững');
  });

  it('xác thực chức năng Export và Import JSON của Case Registry', () => {
    const exportedJson = exportAllCasesJson();
    expect(exportedJson).toContain('BL-');

    clearAllSubmittedCases();
    expect(getAllSubmittedCases().length).toBe(0);

    const importRes = importCasesJson(exportedJson);
    expect(importRes.success).toBe(true);
    expect(importRes.count).toBeGreaterThanOrEqual(1);
    expect(getAllSubmittedCases().length).toBe(importRes.count);
  });

  it('xác thực chức năng Export và Import JSON của User Registry', () => {
    const exportedJson = exportAllUsersJson();
    expect(exportedJson).toBeDefined();

    resetUsersToDefault();
    expect(getRegisteredAccounts().length).toBe(0);

    const sampleUsers = [
      {
        type: 'student' as const,
        mssv: '251121536888',
        name: 'Nguyễn Văn A',
        className: '51K36',
        faculty: 'Khoa Thống kê - Tin học',
        email: '251121536888@due.udn.vn',
        avatar: '👨‍🎓',
        createdAt: new Date().toISOString(),
      },
    ];

    const importRes = importUsersJson(JSON.stringify(sampleUsers));
    expect(importRes.success).toBe(true);
    expect(importRes.count).toBe(1);
    expect(getRegisteredAccounts().length).toBe(1);
  });

  it('xác thực hàm kiểm tra kết nối API Gemini khi thiếu API Key', async () => {
    const result = await testGeminiConnection('', 'gemini-1.5-flash');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Chưa cấu hình API Key');
    expect(result.modelUsed).toBe('gemini-1.5-flash');
  });
});
