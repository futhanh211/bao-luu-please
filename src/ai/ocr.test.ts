import { describe, expect, it } from 'vitest';
import { MockAIProvider } from './mock';
import { AIService } from './service';
import { AIProvider } from '../engine/types';
import { buildOcrPayload } from './prompts';
import { parseJsonObject, validateOcrResult } from './validate';
import {
  OcrScanResult,
  UploadedEvidenceFile,
  StudentEvidenceOptionKey,
} from './ocrTypes';

const MOCK_FILE_MED: UploadedEvidenceFile = {
  name: 'giay_ra_vien_bv_da_khoa.jpg',
  size: 1024 * 350,
  type: 'image/jpeg',
  dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

const MOCK_FILE_MIL: UploadedEvidenceFile = {
  name: 'lenh_goi_nhap_ngu_2026.pdf',
  size: 1024 * 500,
  type: 'application/pdf',
};

const MOCK_FILE_HARD: UploadedEvidenceFile = {
  name: 'xac_nhan_hoan_canh_ubnd.png',
  size: 1024 * 280,
  type: 'image/png',
  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

const MOCK_FILE_PERS: UploadedEvidenceFile = {
  name: 'don_trinh_bay_ly_do_ca_nhan.docx',
  size: 1024 * 120,
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

class FakeLiveWithOcr implements AIProvider {
  public mode: 'live' = 'live';
  public calls = 0;

  constructor(private shouldFail: boolean) {}

  public analyzeDocuments() {
    return Promise.reject(new Error('not implemented'));
  }
  public chat() {
    return Promise.reject(new Error('not implemented'));
  }
  public reviewerBrief() {
    return Promise.reject(new Error('not implemented'));
  }
  public draftText() {
    return Promise.reject(new Error('not implemented'));
  }

  public scanDocument(
    _file: UploadedEvidenceFile,
    optionKey: StudentEvidenceOptionKey
  ): Promise<OcrScanResult> {
    this.calls += 1;
    if (this.shouldFail) {
      throw new Error('Gemini OCR connection failed');
    }
    return Promise.resolve({
      documentType: optionKey,
      confidence: 0.99,
      extractedCount: 8,
      summary: 'Trích xuất trực tiếp từ Gemini Live API',
      data: {
        medical: {
          hospital: 'Bệnh viện Live Gemini',
          recordCode: 'LIVE-2026-999',
          department: 'Khoa Cấp cứu',
          doctorName: 'BS. Gemini Live',
          admissionDate: '01/09/2026',
          dischargeDate: '15/09/2026',
          diagnosis: 'Điều trị nội trú theo dõi',
          isValidStamp: true,
        },
      },
      fields: [
        { key: 'hospital', label: 'Bệnh viện', value: 'Bệnh viện Live Gemini', confidence: 0.99 },
      ],
    });
  }
}

describe('AI OCR Document Scanner (Session 1)', () => {
  describe('1. MockAIProvider.scanDocument', () => {
    const mock = new MockAIProvider(undefined, 0); // 0ms delay for fast test

    it('Quét giấy y tế / bệnh viện trả về đủ trường và đúng format', async () => {
      const res = await mock.scanDocument(MOCK_FILE_MED, 'medical');
      expect(res.documentType).toBe('medical');
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
      expect(res.extractedCount).toBe(8);
      expect(res.data.medical?.hospital).toContain('Đà Nẵng');
      expect(res.data.medical?.doctorName).toBeTruthy();
      expect(res.data.medical?.admissionDate).toBe('02/09/2026');
      expect(res.data.medical?.dischargeDate).toBe('18/09/2026');
      expect(res.data.medical?.isValidStamp).toBe(true);
      expect(res.fields.length).toBe(8);
    });

    it('Nhận diện thông minh tên cơ sở y tế theo tên tệp (Heuristics)', async () => {
      const qyFile: UploadedEvidenceFile = {
        name: 'giay_chung_nhan_vien_quan_y_17.png',
        size: 200000,
        type: 'image/png',
      };
      const resQy = await mock.scanDocument(qyFile, 'medical');
      expect(resQy.data.medical?.hospital).toContain('Quân y 17');

      const bvcFile: UploadedEvidenceFile = {
        name: 'benh_an_bv_c_da_nang.jpg',
        size: 200000,
        type: 'image/jpeg',
      };
      const resBvc = await mock.scanDocument(bvcFile, 'medical');
      expect(resBvc.data.medical?.hospital).toContain('Bệnh viện C Đà Nẵng');
    });

    it('Quét lệnh gọi nhập ngũ nghĩa vụ quân sự', async () => {
      const res = await mock.scanDocument(MOCK_FILE_MIL, 'military');
      expect(res.documentType).toBe('military');
      expect(res.data.military?.militaryUnit).toContain('Hải Châu');
      expect(res.data.military?.orderNumber).toBe('142/LGN-QS26');
      expect(res.data.military?.isValidStamp).toBe(true);
    });

    it('Quét xác nhận hoàn cảnh gia đình UBND', async () => {
      const res = await mock.scanDocument(MOCK_FILE_HARD, 'hardship');
      expect(res.documentType).toBe('hardship');
      expect(res.data.hardship?.authority).toContain('UBND Phường Thạch Thang');
      expect(res.data.hardship?.category).toBe('Hộ cận nghèo');
      expect(res.data.hardship?.isValidStamp).toBe(true);
    });

    it('Quét đơn trình bày cá nhân vs giấy thực tập ngoài trường', async () => {
      const resLetter = await mock.scanDocument(MOCK_FILE_PERS, 'personal');
      expect(resLetter.data.personal?.subType).toBe('personal_letter');
      expect(resLetter.data.personal?.personalReasonContent).toBeTruthy();

      const internshipFile: UploadedEvidenceFile = {
        name: 'xac_nhan_thuc_tap_doanh_nghiep.pdf',
        size: 150000,
        type: 'application/pdf',
      };
      const resIntern = await mock.scanDocument(internshipFile, 'personal');
      expect(resIntern.data.personal?.subType).toBe('internship');
      expect(resIntern.data.personal?.companyName).toContain('Danang Tech Solutions');
    });

    it('Quét Căn cước công dân (cccdCatTuong - Copy.jpg) trích xuất đúng thông tin cá nhân, KHÔNG bị quét nhầm thành giấy thực tập', async () => {
      const cccdFile: UploadedEvidenceFile = {
        name: 'cccdCatTuong - Copy.jpg',
        size: 85000,
        type: 'image/jpeg',
      };
      const { detectEvidenceCategory } = await import('./mockTemplates');
      const detectedCat = detectEvidenceCategory(cccdFile);
      expect(detectedCat).toBe('personal');

      const resCccd = await mock.scanDocument(cccdFile, 'personal');
      expect(resCccd.data.personal?.subType).toBe('personal_letter');
      expect(resCccd.data.personal?.companyName).toBeUndefined();
      expect(resCccd.data.personal?.internshipRole).toBeUndefined();
      expect(resCccd.data.personal?.personalReasonContent).toContain('045195003605');
      expect(resCccd.data.personal?.personalReasonContent).toContain('NGUYỄN THỊ CÁT TƯỜNG');
      expect(resCccd.summary).toContain('Căn cước công dân');
      expect(resCccd.summary).not.toContain('thực tập');
      expect(resCccd.summary).not.toContain('FPT Software');
    });

    it('Đa dạng hóa thông minh (Khắc phục lỗi luôn ra cùng 1 đáp án): Các tệp khác nhau trích xuất bệnh viện, bác sĩ và chẩn đoán khác nhau', async () => {
      const fileHoanMy: UploadedEvidenceFile = {
        name: 'giay_xac_nhan_bv_hoan_my_da_nang.jpg',
        size: 245000,
        type: 'image/jpeg',
      };
      const resHoanMy = await mock.scanDocument(fileHoanMy, 'medical');
      expect(resHoanMy.data.medical?.hospital).toContain('Hoàn Mỹ');
      expect(resHoanMy.data.medical?.doctorName).toContain('Phan Hoàng Nam');
      expect(resHoanMy.data.medical?.diagnosis).toContain('dây chằng');

      const fileUngBuou: UploadedEvidenceFile = {
        name: 'benh_an_dieu_tri_ung_buou.png',
        size: 310000,
        type: 'image/png',
      };
      const resUngBuou = await mock.scanDocument(fileUngBuou, 'medical');
      expect(resUngBuou.data.medical?.hospital).toContain('Ung bướu');
      expect(resUngBuou.data.medical?.doctorName).toContain('Hoàng Trung Thông');

      const filePHCN: UploadedEvidenceFile = {
        name: 'chung_nhan_phuc_hoi_chuc_nang.pdf',
        size: 190000,
        type: 'application/pdf',
      };
      const resPHCN = await mock.scanDocument(filePHCN, 'medical');
      expect(resPHCN.data.medical?.hospital).toContain('Phục hồi chức năng');

      // Hai tệp ảnh khác nhau ngẫu nhiên từ thiết bị sẽ tạo ra mã bệnh án và thông tin khác nhau
      const fileA: UploadedEvidenceFile = {
        name: 'anh_giay_vien_01.jpg',
        size: 231450,
        type: 'image/jpeg',
      };
      const fileB: UploadedEvidenceFile = {
        name: 'anh_giay_vien_02.jpg',
        size: 452100,
        type: 'image/jpeg',
      };
      const resA = await mock.scanDocument(fileA, 'medical');
      const resB = await mock.scanDocument(fileB, 'medical');
      expect(resA.data.medical?.recordCode).not.toBe(resB.data.medical?.recordCode);
    });

    it('Đa dạng hóa thông tin quân sự và hoàn cảnh xã hội theo địa bàn các quận/huyện', async () => {
      const milThanhKhe: UploadedEvidenceFile = {
        name: 'lenh_nhap_ngu_bch_thanh_khe.pdf',
        size: 210000,
        type: 'application/pdf',
      };
      const resMil = await mock.scanDocument(milThanhKhe, 'military');
      expect(resMil.data.military?.militaryUnit).toContain('Thanh Khê');

      const hardHoaCuong: UploadedEvidenceFile = {
        name: 'xac_nhan_ubnd_hoa_cuong_bac.png',
        size: 180000,
        type: 'image/png',
      };
      const resHard = await mock.scanDocument(hardHoaCuong, 'hardship');
      expect(resHard.data.hardship?.authority).toContain('Hòa Cường Bắc');
      expect(resHard.data.hardship?.guardianName).toContain('Lê Tấn Phát');
    });
  });

  describe('2. AIService.scanDocument (Điều phối & Fallback an toàn)', () => {
    it('Chế độ Mock mặc định: hoàn tất thành công và kích hoạt activity AI-OCR', async () => {
      const mock = new MockAIProvider(undefined, 0);
      const service = new AIService(mock, null, 'mock');

      const activities: (string | null)[] = [];
      service.onActivity((tp) => activities.push(tp));

      const res = await service.scanDocument(MOCK_FILE_MED, 'medical');
      expect(res.data.medical?.hospital).toBeTruthy();
      expect(activities).toContain('AI-OCR');
      expect(activities[activities.length - 1]).toBeNull();
    });

    it('Chế độ Live thành công: trả về kết quả từ Live AI', async () => {
      const mock = new MockAIProvider(undefined, 0);
      const live = new FakeLiveWithOcr(false);
      const service = new AIService(mock, live, 'live');

      const res = await service.scanDocument(MOCK_FILE_MED, 'medical');
      expect(live.calls).toBe(1);
      expect(res.data.medical?.hospital).toBe('Bệnh viện Live Gemini');
      expect(service.source).toBe('live');
    });

    it('Chế độ Live lỗi/timeout: tự động fallback về Mock mà không làm văng exception', async () => {
      const mock = new MockAIProvider(undefined, 0);
      const live = new FakeLiveWithOcr(true); // Gây lỗi mạng
      const service = new AIService(mock, live, 'live');

      const sources: string[] = [];
      service.onSourceChange((src) => sources.push(src));

      const res = await service.scanDocument(MOCK_FILE_MED, 'medical');
      expect(live.calls).toBe(1);
      // Kết quả được lấy từ mock fallback an toàn
      expect(res.data.medical?.hospital).toContain('Bệnh viện Đa khoa Đà Nẵng');
      expect(service.source).toBe('fallback');
      expect(sources).toContain('fallback');
    });
  });

  describe('3. validateOcrResult & parseJsonObject', () => {
    it('Bóc tách JSON hợp lệ từ chuỗi có markdown code block', () => {
      const text = `
      \`\`\`json
      {
        "documentType": "medical",
        "confidence": 0.95,
        "summary": "Giấy ra viện hợp lệ",
        "data": {
          "medical": {
            "hospital": "Bệnh viện Đa khoa",
            "recordCode": "BA-123",
            "doctorName": "BS. Nguyễn Văn A",
            "admissionDate": "01/01/2026",
            "dischargeDate": "10/01/2026",
            "diagnosis": "Điều trị chấn thương",
            "isValidStamp": true
          }
        }
      }
      \`\`\`
      `;
      const raw = parseJsonObject(text);
      expect(raw).not.toBeNull();
      const validated = validateOcrResult(raw!, 'medical');
      expect(validated).not.toBeNull();
      expect(validated?.documentType).toBe('medical');
      expect(validated?.data.medical?.hospital).toBe('Bệnh viện Đa khoa');
      expect(validated?.extractedCount).toBe(7);
    });

    it('Trả về null nếu JSON không chứa bất kỳ trường hợp lệ nào', () => {
      const rawEmpty = { documentType: 'medical', data: {} };
      expect(validateOcrResult(rawEmpty, 'medical')).toBeNull();
    });
  });

  describe('4. buildOcrPayload (Multimodal Vision Base64)', () => {
    it('Tách dataUrl base64 thành imagePart hợp lệ cho Gemini API', () => {
      const payload = buildOcrPayload(MOCK_FILE_MED, 'medical');
      expect(payload.json).toBe(true);
      expect(payload.imagePart).toBeDefined();
      expect(payload.imagePart?.mimeType).toBe('image/jpeg');
      expect(payload.imagePart?.data.length).toBeGreaterThan(10);
      expect(payload.user).toContain('LOẠI GIẤY TỜ MỤC TIÊU: medical');
    });

    it('Xử lý an toàn khi tệp không có dataUrl ảnh', () => {
      const payload = buildOcrPayload(MOCK_FILE_MIL, 'military');
      expect(payload.imagePart).toBeUndefined();
      expect(payload.user).toContain('TỆP KHÔNG CÓ DỮ LIỆU ẢNH TRỰC TIẾP');
    });
  });

  describe('5. Gemini Vision & Strict Diagram Rejection (Loại bỏ ảnh sơ đồ draw.io / ERD)', () => {
    const drawioDiagramFile: UploadedEvidenceFile = {
      name: 'bonobakeryFINAL-PAGE1.drawio.png',
      size: 1024 * 1800,
      type: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    it('Nhận diện từ khóa draw.io/diagram là tệp rác không liên quan', async () => {
      const { isGarbageEvidenceText, detectEvidenceCategory, evaluateEvidenceFile, buildMockOcrResult } = await import('./mockTemplates');
      expect(isGarbageEvidenceText(drawioDiagramFile.name)).toBe(true);

      const detected = detectEvidenceCategory(drawioDiagramFile, 'military');
      expect(detected).toBeNull();

      const evalRes = evaluateEvidenceFile(drawioDiagramFile, 'military');
      expect(evalRes.valid).toBe(false);
      expect(evalRes.reason).toContain('không liên quan');

      const mockRes = buildMockOcrResult(drawioDiagramFile, 'military');
      expect(mockRes.confidence).toBeLessThan(0.6);
      expect(mockRes.extractedCount).toBe(0);
    });

    it('Gemini Vision trả JSON từ chối khi phát hiện ảnh sơ đồ / không phải văn bản hành chính', () => {
      const geminiRejectResponse = {
        isValidDocument: false,
        documentType: 'unknown',
        confidence: 0.1,
        summary: 'Tài liệu bị từ chối: Hình ảnh là sơ đồ cơ sở dữ liệu draw.io, không phải văn bản hành chính hợp lệ.',
        data: {},
      };

      const result = validateOcrResult(geminiRejectResponse, 'military');
      expect(result).not.toBeNull();
      expect(result?.confidence).toBe(0.1);
      expect(result?.extractedCount).toBe(0);
      expect(result?.summary).toContain('draw.io');
    });

    it('validateOcrResult tự động sửa subType thành personal_letter và xóa companyName nếu Gemini đọc ảnh CCCD', () => {
      const geminiCccdResponse = {
        isValidDocument: true,
        documentType: 'personal',
        confidence: 0.96,
        summary: 'Đã nhận diện Căn cước công dân của Nguyễn Thị Cát Tường (Số: 045195003605)',
        data: {
          personal: {
            subType: 'internship',
            personalReasonContent: 'Căn cước công dân số 045195003605, Họ tên: NGUYỄN THỊ CÁT TƯỜNG, Ngày sinh: 27/07/2007',
            companyName: 'Công ty nhầm lẫn',
            internshipRole: 'Thực tập sinh',
            isValidStamp: true,
          },
        },
      };

      const result = validateOcrResult(geminiCccdResponse, 'personal');
      expect(result).not.toBeNull();
      expect(result?.documentType).toBe('personal');
      expect(result?.data.personal?.subType).toBe('personal_letter');
      expect(result?.data.personal?.companyName).toBeUndefined();
      expect(result?.data.personal?.internshipRole).toBeUndefined();
      expect(result?.data.personal?.personalReasonContent).toContain('045195003605');
    });
  });
});
