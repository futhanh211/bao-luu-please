import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllSubmittedCases,
  saveSubmittedCase,
  getSubmittedCaseByMssv,
  getNextCaseCode,
} from './caseRegistry';
import { memoryFallback } from './userRegistry';

describe('Case Registry and Multi-case Flow', () => {
  beforeEach(() => {
    // Clear storage
    for (const k of Object.keys(memoryFallback)) {
      delete memoryFallback[k];
    }
  });

  it('generates next case code and saves submitted case', () => {
    const nextCode = getNextCaseCode();
    expect(nextCode).toBe('BL-2026-88'); // In test env createInitialCases returns []

    saveSubmittedCase({
      id: nextCode,
      caseCode: nextCode,
      studentMssv: 'kkkk',
      studentName: 'kkkk',
      studentClass: '48K12.1',
      studentFaculty: 'Khoa CNTTKD',
      form: {
        fullName: 'kkkk',
        mssv: 'kkkk',
        className: '48K12.1',
        faculty: 'Khoa CNTTKD',
        phone: '0905123456',
        email: 'kkkk@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1',
        commitment: true,
      },
      evidence: [],
      attachedEvidenceIds: [],
      submittedAt: '30/10/2026 14:00',
      day: 0,
      status: 'pending_advisor',
    });

    const all = getAllSubmittedCases();
    expect(all.length).toBe(1);
    expect(all[0].caseCode).toBe(nextCode);
    expect(all[0].studentMssv).toBe('kkkk');

    const byMssv = getSubmittedCaseByMssv('kkkk');
    expect(byMssv).not.toBeNull();
    expect(byMssv?.caseCode).toBe(nextCode);

    // Test case-insensitive lookup
    const byMssvUpper = getSubmittedCaseByMssv('  KKKK  ');
    expect(byMssvUpper).not.toBeNull();
    expect(byMssvUpper?.caseCode).toBe(nextCode);
  });

  it('sanitizes large file dataUrl and caches it without breaking storage', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(5000);
    saveSubmittedCase({
      id: 'BL-TEST-LARGE',
      caseCode: 'BL-TEST-LARGE',
      studentMssv: 'test_large',
      studentName: 'Test Large',
      studentClass: '48K12.1',
      studentFaculty: 'Khoa CNTTKD',
      form: {
        fullName: 'Test Large',
        mssv: 'test_large',
        className: '48K12.1',
        faculty: 'Khoa CNTTKD',
        phone: '0905123456',
        email: 'test_large@due.udn.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1',
        commitment: true,
      },
      evidence: [
        {
          id: 'ev_large',
          name: 'Large File.png',
          type: 'attached_file',
          content: 'Large file content',
          fileData: {
            name: 'large_scan.png',
            size: 5000000,
            type: 'image/png',
            dataUrl: largeDataUrl,
          },
        },
      ],
      attachedEvidenceIds: ['ev_large'],
      submittedAt: '30/10/2026 14:00',
      day: 0,
      status: 'pending_advisor',
    });

    const cases = getAllSubmittedCases();
    const retrieved = cases.find((c) => c.id === 'BL-TEST-LARGE');
    expect(retrieved).toBeDefined();
    // Re-hydrated from RAM cache
    expect(retrieved?.evidence[0].fileData?.dataUrl).toBe(largeDataUrl);
  });
});
