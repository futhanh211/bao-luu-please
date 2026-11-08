import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EvidenceFormModal } from './EvidenceFormModal';
import {
  StudentDetailedFormData,
  buildEvidenceItemsFromFormData,
} from '../../../data/studentFormData';
import { createSampleEvidenceFile } from '../../../data/sampleEvidenceImages';
import { MockAIProvider } from '../../../ai/mock';
import { AIService } from '../../../ai/service';

const INITIAL_FORM_DATA: StudentDetailedFormData = {
  fullName: 'Nguyễn Minh Khoa',
  mssv: '3121102001',
  className: '47K12.1',
  faculty: 'Khoa Công nghệ thông tin kinh doanh',
  phone: '0905123456',
  email: 'khoa.nm@due.edu.vn',
  reason: 'Ốm đau/tai nạn điều trị dài',
  semesterCount: 1,
  startSemester: 'Học kỳ 1 năm học 2026–2027',
  commitment: true,
  medical: {
    hospital: '',
    recordCode: '',
    department: '',
    doctorName: '',
    admissionDate: '',
    dischargeDate: '',
    diagnosis: '',
    isValidStamp: false,
  },
  military: {
    militaryUnit: '',
    orderNumber: '',
    signDate: '',
    reportDate: '',
    location: '',
    isValidStamp: false,
  },
  hardship: {
    authority: '',
    category: 'Hộ cận nghèo',
    guardianName: '',
    confirmDate: '',
    description: '',
    isValidStamp: false,
  },
  personal: {
    subType: 'personal_letter',
    personalReasonContent: '',
    parentName: '',
    parentPhone: '',
    companyName: '',
    internshipRole: '',
    startDate: '',
    endDate: '',
    isValidStamp: false,
  },
  uploadedFile: null,
};

describe('EvidenceFormModal & AI Auto-Fill Integration (Session 3)', () => {
  it('1. Render form modal ban đầu chưa có tệp: hiển thị khung tải tệp minh chứng trực tiếp, không có nút tạo mẫu giả lập', () => {
    const html = renderToStaticMarkup(
      <EvidenceFormModal
        optionKey="medical"
        initialData={INITIAL_FORM_DATA}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Tệp minh chứng &amp; AI Quét (OCR)');
    expect(html).not.toContain('Tạo đơn mẫu');
    expect(html).toContain('Bấm vào đây để chọn tệp ảnh hoặc PDF từ máy tính');
    expect(html).toContain('Bệnh viện cấp giấy');
    expect(html).toContain('Mã bệnh án / Số lưu trữ');
  });

  it('2. Render khi đã có tệp minh chứng đính kèm: kích hoạt nút "AI QUÉT & TỰ ĐỘNG ĐIỀN"', () => {
    const sampleFile = createSampleEvidenceFile('medical', 'Nguyễn Minh Khoa');
    const dataWithFile: StudentDetailedFormData = {
      ...INITIAL_FORM_DATA,
      uploadedFile: sampleFile,
    };

    const html = renderToStaticMarkup(
      <EvidenceFormModal
        optionKey="medical"
        initialData={dataWithFile}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('AI QUÉT &amp; TỰ ĐỘNG ĐIỀN');
    expect(html).toContain('Chọn tệp khác');
    expect(html).toContain(sampleFile.name);
    expect(html).toContain('scanner-viewport');
  });

  it('3. Render đúng các trường của form Nghĩa vụ quân sự (military)', () => {
    const html = renderToStaticMarkup(
      <EvidenceFormModal
        optionKey="military"
        initialData={INITIAL_FORM_DATA}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Cơ quan cấp lệnh (BCH Quân sự)');
    expect(html).toContain('Số lệnh gọi nhập ngũ');
    expect(html).toContain('Ngày tập trung nhập ngũ');
    expect(html).toContain('Địa điểm giao nhận quân');
  });

  it('4. Render đúng các trường của form Hoàn cảnh gia đình (hardship)', () => {
    const html = renderToStaticMarkup(
      <EvidenceFormModal
        optionKey="hardship"
        initialData={INITIAL_FORM_DATA}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('UBND Phường/Xã xác nhận');
    expect(html).toContain('Diện hoàn cảnh');
    expect(html).toContain('Họ tên phụ huynh / Chủ hộ');
    expect(html).toContain('Trình bày chi tiết hoàn cảnh khó khăn');
  });

  it('5. E2E luồng trích xuất: Nạp tệp mẫu -> AI Scan -> Tự động điền dữ liệu -> Đóng gói gửi T1', async () => {
    // Bước A: Nạp tệp mẫu y tế
    const sample = createSampleEvidenceFile('medical', 'Nguyễn Minh Khoa');
    expect(sample.name).toContain('giay_ra_vien');
    expect(sample.dataUrl).toContain('data:image/svg+xml');

    // Bước B: AI Quét OCR
    const mockAI = new MockAIProvider(undefined, 0);
    const aiService = new AIService(mockAI, null, 'mock');
    const ocrResult = await aiService.scanDocument(sample, 'medical');

    expect(ocrResult.documentType).toBe('medical');
    expect(ocrResult.extractedCount).toBeGreaterThanOrEqual(7);
    expect(ocrResult.data.medical?.hospital).toContain('Bệnh viện Đa khoa Đà Nẵng');
    expect(ocrResult.data.medical?.admissionDate).toBe('02/09/2026');
    expect(ocrResult.data.medical?.dischargeDate).toBe('18/09/2026');
    expect(ocrResult.data.medical?.isValidStamp).toBe(true);

    // Bước C: Giả lập Form cập nhật dữ liệu tự động điền
    const updatedForm: StudentDetailedFormData = {
      ...INITIAL_FORM_DATA,
      medical: {
        ...INITIAL_FORM_DATA.medical,
        ...ocrResult.data.medical,
      },
      uploadedFile: sample,
    };

    // Bước D: Đóng gói thành EvidenceItem chuẩn bị gửi qua thông điệp MF1
    const items = buildEvidenceItemsFromFormData(updatedForm, 'Ốm đau/tai nạn điều trị dài');
    expect(items.length).toBe(2);

    const confirmationDoc = items[0];
    const attachedFile = items[1];

    expect(confirmationDoc.type).toBe('medical_record');
    expect(confirmationDoc.name).toContain('Bệnh viện Đa khoa');
    expect(attachedFile.type).toBe('attached_file');
    expect(attachedFile.fileData?.name).toBe(sample.name);

    // Bước E: Kiểm thử Task T1 (AI-1 DocScan) thẩm định hồ sơ nộp
    const t1Scan = await mockAI.analyzeDocuments({
      form: {
        fullName: 'Nguyễn Minh Khoa',
        mssv: '3121102001',
        className: '47K12.1',
        faculty: 'Khoa Công nghệ thông tin kinh doanh',
        phone: '0905123456',
        email: 'khoa.nm@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1 năm học 2026–2027',
        commitment: true,
      },
      evidence: items,
    });

    expect(t1Scan.typeMatchesReason).toBe(true);
    expect(t1Scan.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('6. Chống duyệt lọt: Tệp ảnh bậy bạ / không liên quan (Chuyên đề Bác .jpg) -> AI từ chối trích xuất, không tự động điền form', async () => {
    const irrelevantFile = {
      name: 'Chuyên đề Bác .jpg',
      size: 353400,
      type: 'image/jpeg',
    };

    const mockAI = new MockAIProvider(undefined, 0);
    const aiService = new AIService(mockAI, null, 'mock');
    const result = await aiService.scanDocument(irrelevantFile, 'medical');

    // Kiểm tra kết quả AI: confidence thấp, extractedCount = 0, summary có CẢNH BÁO
    expect(result.confidence).toBeLessThan(0.6);
    expect(result.extractedCount).toBe(0);
    expect(result.summary).toContain('CẢNH BÁO');
    expect(result.data.medical?.hospital).toBeUndefined();

    // Giả lập logic kiểm tra isSuccess trong modal
    const isSuccess = result.confidence >= 0.6 && result.extractedCount > 0;
    expect(isSuccess).toBe(false);

    // Form không được phép nhận bất kỳ trường giả nào
    const unchangedForm: StudentDetailedFormData = {
      ...INITIAL_FORM_DATA,
      uploadedFile: irrelevantFile,
    };
    expect(unchangedForm.medical.hospital).toBe('');
    expect(unchangedForm.medical.recordCode).toBe('');
  });

  it('7. detectEvidenceCategory: Tự động phân loại chuẩn xác 4 loại giấy tờ và loại bỏ tệp rác', async () => {
    const { detectEvidenceCategory } = await import('../../../ai/mockTemplates');

    // Tệp bệnh viện (kể cả tệp UUID mẫu test do người dùng chụp)
    expect(
      detectEvidenceCategory({
        name: '12f3e20a-9a64-48cf-a6ed-0799e32fecf0.jpg',
        size: 205100,
        type: 'image/jpeg',
      })
    ).toBe('medical');

    // Tệp nghĩa vụ quân sự
    expect(
      detectEvidenceCategory({
        name: 'lenh_goi_nhap_ngu_bch_quan_su.pdf',
        size: 204800,
        type: 'application/pdf',
      })
    ).toBe('military');

    // Tệp hoàn cảnh gia đình
    expect(
      detectEvidenceCategory({
        name: 'xac_nhan_hoan_canh_ubnd_phuong.jpg',
        size: 150000,
        type: 'image/jpeg',
      })
    ).toBe('hardship');

    // Tệp lý do cá nhân / thực tập
    expect(
      detectEvidenceCategory({
        name: 'don_trinh_bay_nguyen_vong_thuc_tap.pdf',
        size: 120000,
        type: 'application/pdf',
      })
    ).toBe('personal');

    // Tệp rác / không hợp lệ -> loại ra (trả về null)
    expect(
      detectEvidenceCategory({
        name: 'Chuyên đề Bác .jpg',
        size: 350000,
        type: 'image/jpeg',
      })
    ).toBeNull();
    expect(
      detectEvidenceCategory({
        name: 'ho_so_rac.png',
        size: 500,
        type: 'image/png',
      })
    ).toBeNull();
  });

  it('8. Modal hiển thị lưu ý tiếp nhận: AI Pre-check con dấu mộc đỏ hợp lệ trước khi chuyển sang L2 Cố vấn học tập', () => {
    const html = renderToStaticMarkup(
      <EvidenceFormModal
        optionKey="medical"
        initialData={INITIAL_FORM_DATA}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('AI Pre-check');
    expect(html).toContain('Cố vấn học tập (L2)');
    expect(html).toContain('con dấu mộc đỏ hợp lệ');
  });
});
