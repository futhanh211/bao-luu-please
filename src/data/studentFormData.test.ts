import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStudentFormData,
  saveStudentFormData,
  buildEvidenceItemFromFormData,
  buildEvidenceItemsFromFormData,
  toIsoDate,
  toVnDate,
} from './studentFormData';

describe('Student Form Data & Multi-Account Isolation', () => {
  const studentA = {
    mssv: '251121536115',
    name: 'Phạm Minh Khôi',
    className: '51K36',
    faculty: 'Khoa Thống kê - Tin học',
    email: '251121536115@due.udn.vn',
    phone: '0905111222',
  };

  const studentB = {
    mssv: '3121102008',
    name: 'Phan Thanh Tùng',
    className: '46K21.1',
    faculty: 'Khoa Kinh tế',
    email: '3121102008@due.udn.vn',
    phone: '0905333444',
  };

  beforeEach(() => {
    // Không chia sẻ dữ liệu
  });

  it('tự động điền thông tin sinh viên từ tài khoản vào Phần 1 của đơn', () => {
    const dataA = getStudentFormData(studentA.mssv, studentA);
    expect(dataA.fullName).toBe('Phạm Minh Khôi');
    expect(dataA.mssv).toBe('251121536115');
    expect(dataA.className).toBe('51K36');
    expect(dataA.faculty).toBe('Khoa Thống kê - Tin học');
    expect(dataA.email).toBe('251121536115@due.udn.vn');
    expect(dataA.phone).toBe('0905111222');
  });

  it('cô lập dữ liệu độc lập giữa các tài khoản sinh viên khác nhau', () => {
    const dataA = getStudentFormData(studentA.mssv, studentA);
    dataA.medical.hospital = 'Bệnh viện C Đà Nẵng';
    dataA.medical.recordCode = 'BA-KHOI-001';
    saveStudentFormData(studentA.mssv, dataA);

    const dataB = getStudentFormData(studentB.mssv, studentB);
    dataB.military.militaryUnit = 'BCH Quân sự quận Thanh Khê';
    dataB.military.orderNumber = '77/LG-TK';
    saveStudentFormData(studentB.mssv, dataB);

    // Kiểm tra dữ liệu của A không bị ảnh hưởng bởi B
    const reloadedA = getStudentFormData(studentA.mssv, studentA);
    expect(reloadedA.medical.hospital).toBe('Bệnh viện C Đà Nẵng');
    expect(reloadedA.medical.recordCode).toBe('BA-KHOI-001');
    expect(reloadedA.fullName).toBe('Phạm Minh Khôi');

    // Kiểm tra dữ liệu của B giữ nguyên
    const reloadedB = getStudentFormData(studentB.mssv, studentB);
    expect(reloadedB.military.militaryUnit).toBe('BCH Quân sự quận Thanh Khê');
    expect(reloadedB.military.orderNumber).toBe('77/LG-TK');
    expect(reloadedB.fullName).toBe('Phan Thanh Tùng');
  });

  it('tạo EvidenceItem số hóa đúng theo quy tắc cho từng loại lý do', () => {
    const data = getStudentFormData(studentA.mssv, studentA);

    // 1. Y tế
    data.reason = 'Ốm đau/tai nạn điều trị dài';
    data.medical.hospital = 'Bệnh viện Quân Y 17';
    data.medical.isValidStamp = true;
    const evMed = buildEvidenceItemFromFormData(data);
    expect(evMed.type).toBe('medical_record');
    expect(evMed.name).toContain('Bệnh viện Quân Y 17');
    expect(evMed.issueNotes).toBeUndefined();

    // 2. Y tế khi bỏ dấu đỏ (vi phạm quy tắc)
    data.medical.isValidStamp = false;
    const evMedInvalid = buildEvidenceItemFromFormData(data);
    expect(evMedInvalid.issueNotes).toBeDefined();

    // 3. Nghĩa vụ quân sự
    data.reason = 'Nghĩa vụ quân sự';
    data.military.orderNumber = '99/LG-2026';
    data.military.isValidStamp = true;
    const evMil = buildEvidenceItemFromFormData(data);
    expect(evMil.type).toBe('military_call');
    expect(evMil.fields?.find((f) => f.id === 'orderNumber')?.value).toBe('99/LG-2026');

    // 4. Hoàn cảnh gia đình
    data.reason = 'Hoàn cảnh gia đình';
    data.hardship.category = 'Hộ nghèo';
    data.hardship.isValidStamp = true;
    const evHard = buildEvidenceItemFromFormData(data);
    expect(evHard.type).toBe('hardship_proof');
    expect(evHard.fields?.find((f) => f.id === 'category')?.value).toBe('Hộ nghèo');

    // 5. Lý do cá nhân khác
    data.reason = 'Lý do cá nhân khác';
    data.personal.subType = 'internship';
    data.personal.companyName = 'FPT Software Đà Nẵng';
    data.personal.isValidStamp = true;
    const evPers = buildEvidenceItemFromFormData(data);
    expect(evPers.type).toBe('personal_reason');
    expect(evPers.fields?.find((f) => f.id === 'company')?.value).toBe('FPT Software Đà Nẵng');
  });

  it('đảm bảo các trường chi tiết minh chứng ban đầu hoàn toàn trống để người dùng tự nhập tay', () => {
    const data = getStudentFormData('9999999999');
    expect(data.medical.hospital).toBe('');
    expect(data.medical.recordCode).toBe('');
    expect(data.medical.diagnosis).toBe('');
    expect(data.medical.isValidStamp).toBe(false);

    expect(data.military.militaryUnit).toBe('');
    expect(data.military.orderNumber).toBe('');
    expect(data.military.isValidStamp).toBe(false);

    expect(data.hardship.authority).toBe('');
    expect(data.hardship.description).toBe('');
    expect(data.hardship.isValidStamp).toBe(false);

    expect(data.personal.personalReasonContent).toBe('');
    expect(data.personal.companyName).toBe('');
    expect(data.personal.isValidStamp).toBe(false);
  });

  it('nộp bao gồm cả giấy xác nhận và tệp minh chứng do người dùng đăng lên từ máy tính', () => {
    const data = getStudentFormData(studentA.mssv, studentA);
    data.reason = 'Ốm đau/tai nạn điều trị dài';
    data.medical.hospital = 'Bệnh viện Đa khoa Đà Nẵng';
    data.medical.isValidStamp = true;
    data.uploadedFile = {
      name: 'don_xac_nhan_benh_vien.pdf',
      size: 1048576,
      type: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,...',
    };

    const items = buildEvidenceItemsFromFormData(data);
    expect(items).toHaveLength(2);

    // 1. Giấy xác nhận
    expect(items[0].type).toBe('medical_record');
    expect(items[0].name).toContain('Bệnh viện Đa khoa Đà Nẵng');
    expect(items[0].fileData?.name).toBe('don_xac_nhan_benh_vien.pdf');

    // 2. Tệp minh chứng gốc từ máy tính
    expect(items[1].type).toBe('attached_file');
    expect(items[1].name).toBe('Minh chứng gốc: don_xac_nhan_benh_vien.pdf');
    expect(items[1].fileData?.size).toBe(1048576);
  });

  it('chuyển đổi định dạng ngày tháng giữa DD/MM/YYYY và YYYY-MM-DD chính xác', () => {
    expect(toIsoDate('18/09/2026')).toBe('2026-09-18');
    expect(toVnDate('2026-09-18')).toBe('18/09/2026');
    expect(toIsoDate('2026-09-18')).toBe('2026-09-18');
    expect(toVnDate('18/09/2026')).toBe('18/09/2026');
  });
});
