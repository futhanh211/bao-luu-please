import { describe, it, expect } from 'vitest';
import { composeLetter } from './letters';
import { DecisionDoc } from '../engine/types';

const decisionDoc: DecisionDoc = {
  number: 'BL-2001/QĐ-ĐHKT',
  decisionDate: 'Ngày 3',
  studentName: 'Nguyễn Minh Khoa',
  mssv: '3121102001',
  faculty: 'Khoa Công nghệ thông tin kinh doanh',
  durationSemesters: 2,
  startSemester: 'Học kỳ 1, Năm học 2026-2027',
  basisText: 'Căn cứ Quy chế đào tạo của Trường.',
  signed: true,
  signerName: 'PGS.TS. Đoàn Ngọc Phi Anh',
};

describe('letters.ts — mẫu thư deterministic cho Hộp thư sinh viên', () => {
  it('MF2: liệt kê đúng validity.missing và hướng dẫn nộp lại', () => {
    const letter = composeLetter('MF2', {
      id: 'msg_mf2_1',
      day: 0,
      title: 'Thông báo trả hồ sơ / Yêu cầu bổ sung minh chứng',
      content: 'Hồ sơ chưa có minh chứng.',
      validity: {
        complete: true,
        missing: ['Không tìm thấy sinh viên trong CSDL Quản lý sinh viên (DS2)'],
        evidenceOk: false,
      },
    });

    expect(letter.flowId).toBe('MF2');
    expect(letter.title).toContain('chưa hợp lệ');
    expect(letter.intro).toBe('Hồ sơ chưa có minh chứng.');
    expect(letter.sections).toHaveLength(2);
    expect(letter.sections[0].lines).toContain(
      '• Không tìm thấy sinh viên trong CSDL Quản lý sinh viên (DS2)'
    );
    expect(letter.sections[1].heading).toBe('Hướng dẫn nộp lại');
    expect(letter.signed).toBe(false);
  });

  it('MF3: liệt kê rule fail (R3 nợ học phí) + Cố vấn/CTSV chưa đạt', () => {
    const letter = composeLetter('MF3', {
      id: 'msg_mf3_1',
      day: 3,
      title: 'Thông báo không đủ điều kiện giải quyết bảo lưu kết quả học tập',
      content: 'Hồ sơ còn nợ học phí.',
      ruleResult: {
        pass: false,
        violations: ['Công nợ học phí = 0 (Còn nợ học phí: 7.500.000 VNĐ)'],
      },
      advisorStatus: 'declined',
      ctsvStatus: 'pending',
    });

    const lines = letter.sections.flatMap((s) => s.lines);
    expect(lines.some((l) => l.includes('7.500.000'))).toBe(true);
    expect(lines.some((l) => l.includes('Cố vấn học tập không xác nhận'))).toBe(true);
    expect(lines.some((l) => l.includes('chưa thẩm định'))).toBe(true);
    expect(letter.day).toBe(3);
  });

  it('MF4: quyết định có họ tên, MSSV, thời hạn từ decisionDoc và dấu đã ký số', () => {
    const letter = composeLetter('MF4', {
      id: 'msg_mf4_1',
      day: 3,
      content: 'Chúc mừng bạn!',
      attachments: ['BL-2001/QĐ-ĐHKT'],
      decisionDoc,
    });

    expect(letter.title).toBe('Quyết định nghỉ học tạm thời');
    expect(letter.signed).toBe(true);
    expect(letter.signerName).toBe('PGS.TS. Đoàn Ngọc Phi Anh');

    const lines = letter.sections.flatMap((s) => s.lines).join('\n');
    expect(lines).toContain('Nguyễn Minh Khoa');
    expect(lines).toContain('3121102001');
    expect(lines).toContain('2');
    expect(lines).toContain('Học kỳ 1, Năm học 2026-2027');
    expect(letter.attachments).toContain('BL-2001/QĐ-ĐHKT');
  });

  it('Payload thiếu văn bản: vẫn sinh mẫu deterministic, không rỗng', () => {
    const mf2 = composeLetter('MF2', {});
    const mf3 = composeLetter('MF3', {});
    const mf4 = composeLetter('MF4', {});

    expect(mf2.intro.length).toBeGreaterThan(20);
    expect(mf2.sections[0].lines.length).toBeGreaterThan(0);
    expect(mf3.intro.length).toBeGreaterThan(20);
    expect(mf4.sections.length).toBeGreaterThan(0);
    expect(mf4.signed).toBe(false);
  });
});
