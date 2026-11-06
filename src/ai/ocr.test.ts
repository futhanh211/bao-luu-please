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
});
