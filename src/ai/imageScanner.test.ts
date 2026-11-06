import { describe, it, expect } from 'vitest';
import { analyzeImageVisualFeatures } from './imageScanner';
import {
  isGarbageEvidenceText,
  detectEvidenceCategory,
  evaluateEvidenceFile,
  buildMockOcrResult,
} from './mockTemplates';
import { UploadedEvidenceFile } from '../data/studentFormData';

describe('Computer Vision & Strict Dossier Verification (Chống nhận diện nhầm ảnh rác/infographic)', () => {
  it('1. Tệp ảnh tải từ mạng xã hội (Facebook: 890616983_..._n.jpg) bị loại bỏ ngay lập tức', async () => {
    const fbFile: UploadedEvidenceFile = {
      name: '890616983_122119657839500254_8816460267632996987_n.jpg',
      size: 278100,
      type: 'image/jpeg',
    };

    // Layer 1: Nhận diện mẫu tệp mạng xã hội
    expect(isGarbageEvidenceText(fbFile.name)).toBe(true);

    // Layer 2: Phân tích thị giác hình ảnh
    const visual = await analyzeImageVisualFeatures(fbFile);
    expect(visual.isValidDocumentPaper).toBe(false);
    expect(visual.rejectReason).toContain('mạng xã hội');

    // Layer 3: Bộ phân loại danh mục minh chứng
    const detected = detectEvidenceCategory(fbFile, 'medical');
    expect(detected).toBeNull();

    // Layer 4: Bộ thẩm tra hồ sơ
    const evaluation = evaluateEvidenceFile(fbFile, 'medical');
    expect(evaluation.valid).toBe(false);
    expect(evaluation.reason).toContain('không liên quan');

    // Kết quả quét OCR: Bắt buộc từ chối, không trích xuất bất kỳ trường giả nào
    const ocrResult = buildMockOcrResult(fbFile, 'medical');
    expect(ocrResult.confidence).toBeLessThan(0.6);
    expect(ocrResult.extractedCount).toBe(0);
    expect(ocrResult.data.medical?.hospital).toBeUndefined();
    expect(ocrResult.data.medical?.isValidStamp).toBe(false);
  });

  it('2. Tệp ảnh infographic kỹ thuật (Claude Code skills, superpowers, ranking...) bị loại bỏ', async () => {
    const techInfographic: UploadedEvidenceFile = {
      name: '10_claude_code_skills_superpowers_ranking.png',
      size: 320000,
      type: 'image/png',
    };

    expect(isGarbageEvidenceText(techInfographic.name)).toBe(true);

    const visual = await analyzeImageVisualFeatures(techInfographic);
    expect(visual.isValidDocumentPaper).toBe(false);

    const detected = detectEvidenceCategory(techInfographic, 'medical');
    expect(detected).toBeNull();
  });

  it('3. Tệp mẫu chuẩn SVG hệ thống (ĐH Đà Nẵng) luôn hợp lệ', async () => {
    const validSvg: UploadedEvidenceFile = {
      name: 'giay_ra_vien_bv_da_khoa_da_nang.svg',
      size: 15400,
      type: 'image/svg+xml',
      svgRaw: '<svg>ĐẠI HỌC KINH TẾ - ĐH ĐÀ NẴNG BỆNH VIỆN ĐA KHOA</svg>',
    };

    const visual = await analyzeImageVisualFeatures(validSvg);
    expect(visual.isValidDocumentPaper).toBe(true);

    const detected = detectEvidenceCategory(validSvg);
    expect(detected).toBe('medical');

    const evalRes = evaluateEvidenceFile(validSvg, 'medical');
    expect(evalRes.valid).toBe(true);
  });

  it('4. Tệp có tên văn bản hành chính rõ ràng (giay_ra_vien_bv.jpg) được nhận diện chuẩn xác', async () => {
    const validMedicalFile: UploadedEvidenceFile = {
      name: 'giay_ra_vien_benh_vien_da_khoa.jpg',
      size: 1024 * 350,
      type: 'image/jpeg',
    };

    const detected = detectEvidenceCategory(validMedicalFile);
    expect(detected).toBe('medical');

    const evalRes = evaluateEvidenceFile(validMedicalFile, 'medical');
    expect(evalRes.valid).toBe(true);
  });

  it('5. Tệp ảnh chụp hồ sơ thử nghiệm đã đăng ký (UUID 12f3...) vẫn trích xuất thành công', async () => {
    const testDossierFile: UploadedEvidenceFile = {
      name: '12f3c20a-9a64-40cf-a6cd-0799e32fecf0.jpg',
      size: 205100,
      type: 'image/jpeg',
    };

    const detected = detectEvidenceCategory(testDossierFile);
    expect(detected).toBe('medical');

    const evalRes = evaluateEvidenceFile(testDossierFile, 'medical');
    expect(evalRes.valid).toBe(true);

    const ocr = buildMockOcrResult(testDossierFile, 'medical');
    expect(ocr.confidence).toBeGreaterThanOrEqual(0.9);
    expect(ocr.data.medical?.hospital).toContain('Mẫu Test');
    expect(ocr.data.medical?.doctorName).toContain('Trần Văn Mẫu');
    expect(ocr.data.medical?.isValidStamp).toBe(true);
  });
});
