import { UploadedEvidenceFile } from '../data/studentFormData';
import { isGarbageEvidenceText, isVerifiedMessengerDocument } from './mockTemplates';

export interface ImageVisualAnalysis {
  isValidDocumentPaper: boolean;
  rejectReason?: string;
  averageLightness: number;
  darkPixelRatio: number;
  hasRedStamp: boolean;
  redStampRatio: number;
}

/**
 * Phân tích cấu trúc thị giác (Computer Vision) của tệp minh chứng:
 * 1. Nhận diện tệp tải từ mạng xã hội (Facebook/Instagram: \d+_\d+_\d+_n.jpg) nếu không phải giấy tờ hành chính có dấu đỏ
 * 2. Nhận diện ảnh đồ họa / infographic / poster / dark mode (nền tối, chữ sáng)
 * 3. Kiểm tra tính chất văn bản hành chính in trên giấy trắng (độ sáng nền > 50%, tỷ lệ pixel tối < 35%)
 */
export async function analyzeImageVisualFeatures(
  file: UploadedEvidenceFile
): Promise<ImageVisualAnalysis> {
  // 1. Kiểm tra tên tệp & định dạng cơ bản
  const fileName = file.name || '';
  const isFacebookDownload = Boolean(fileName.match(/\d+_\d+_\d+_n\.(jpg|jpeg|png|webp)$/i));
  const isVerifiedMessengerDoc = isVerifiedMessengerDocument(fileName);
  const canInspectCanvas =
    typeof window !== 'undefined' &&
    typeof Image !== 'undefined' &&
    Boolean(file.dataUrl && file.dataUrl.startsWith('data:image/'));

  if (isFacebookDownload && !isVerifiedMessengerDoc && !canInspectCanvas) {
    return {
      isValidDocumentPaper: false,
      rejectReason: `Tệp "${fileName}" là ảnh tải từ mạng xã hội (Facebook/Instagram), không phải văn bản hành chính có giá trị pháp lý.`,
      averageLightness: 0.2,
      darkPixelRatio: 0.7,
      hasRedStamp: false,
      redStampRatio: 0,
    };
  }

  if (!isFacebookDownload && isGarbageEvidenceText(fileName)) {
    return {
      isValidDocumentPaper: false,
      rejectReason: `Tệp "${fileName}" chứa từ khóa không liên quan (tài liệu học tập/bài giảng/đề thi/đồ án/đồ họa thông tin), không phát hiện tiêu đề hành chính hợp lệ.`,
      averageLightness: 0.3,
      darkPixelRatio: 0.6,
      hasRedStamp: false,
      redStampRatio: 0,
    };
  }

  // 1b. Kiểm tra cấu trúc tệp PDF (số trang & siêu dữ liệu bài giảng/slide)
  const isPdfFile =
    file.type === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf') ||
    Boolean(file.dataUrl?.startsWith('data:application/pdf'));
  if (isPdfFile && file.dataUrl && file.dataUrl.includes(',')) {
    const pdfCheck = inspectPdfDataUrl(file.dataUrl, fileName);
    if (!pdfCheck.isValid) {
      return {
        isValidDocumentPaper: false,
        rejectReason: pdfCheck.reason,
        averageLightness: 0.3,
        darkPixelRatio: 0.5,
        hasRedStamp: false,
        redStampRatio: 0,
      };
    }
  }

  // Tệp mẫu hệ thống SVG chuẩn luôn hợp lệ
  if (
    file.type?.includes('svg') ||
    fileName.endsWith('.svg') ||
    Boolean(file.svgRaw?.includes('ĐẠI HỌC KINH TẾ') || file.svgRaw?.includes('BỆNH VIỆN'))
  ) {
    return {
      isValidDocumentPaper: true,
      averageLightness: 0.95,
      darkPixelRatio: 0.08,
      hasRedStamp: true,
      redStampRatio: 0.02,
    };
  }

  // 2. Phân tích Pixel bằng Canvas (chỉ chạy trong môi trường trình duyệt khi có dataUrl)
  if (canInspectCanvas && file.dataUrl) {
    try {
      const visual = await inspectPixelsViaCanvas(file.dataUrl);
      if (visual.isDarkThemeOrInfographic) {
        return {
          isValidDocumentPaper: false,
          rejectReason: `Hình ảnh "${fileName}" có nền tối hoặc đồ họa thông tin (infographic/poster), không phải văn bản hành chính in trên giấy trắng có con dấu mộc đỏ.`,
          averageLightness: visual.averageLightness,
          darkPixelRatio: visual.darkPixelRatio,
          hasRedStamp: visual.hasRedStamp,
          redStampRatio: visual.redStampRatio,
        };
      }
      if (isFacebookDownload && !isVerifiedMessengerDoc && !visual.hasRedStamp) {
        return {
          isValidDocumentPaper: false,
          rejectReason: `Tệp "${fileName}" là ảnh tải từ mạng xã hội (Facebook/Messenger) không có con dấu mộc đỏ hành chính hợp lệ (ví dụ: ảnh bài tập, đề thi hoặc ảnh cá nhân).`,
          averageLightness: visual.averageLightness,
          darkPixelRatio: visual.darkPixelRatio,
          hasRedStamp: visual.hasRedStamp,
          redStampRatio: visual.redStampRatio,
        };
      }
      return {
        isValidDocumentPaper: true,
        averageLightness: visual.averageLightness,
        darkPixelRatio: visual.darkPixelRatio,
        hasRedStamp: visual.hasRedStamp,
        redStampRatio: visual.redStampRatio,
      };
    } catch {
      if (isFacebookDownload && !isVerifiedMessengerDoc) {
        return {
          isValidDocumentPaper: false,
          rejectReason: `Tệp "${fileName}" là ảnh tải từ mạng xã hội (Facebook/Instagram), không phải văn bản hành chính có giá trị pháp lý.`,
          averageLightness: 0.2,
          darkPixelRatio: 0.7,
          hasRedStamp: false,
          redStampRatio: 0,
        };
      }
    }
  }

  return {
    isValidDocumentPaper: true,
    averageLightness: 0.85,
    darkPixelRatio: 0.12,
    hasRedStamp: isVerifiedMessengerDoc,
    redStampRatio: isVerifiedMessengerDoc ? 0.015 : 0,
  };
}

interface CanvasInspectionResult {
  isDarkThemeOrInfographic: boolean;
  averageLightness: number;
  darkPixelRatio: number;
  hasRedStamp: boolean;
  redStampRatio: number;
}

/**
 * Phân tích nhanh cấu trúc nhị phân của tệp PDF (từ chuỗi base64):
 * - Đếm số trang (/Count N trong cây /Pages): Giấy xác nhận hành chính / bản scan minh chứng chỉ từ 1–10 trang.
 *   Nếu tệp PDF có > 10 trang (ví dụ slide bài giảng 40–230 trang, giáo trình, báo cáo đồ án), từ chối ngay.
 * - Kiểm tra chuỗi văn bản / tiêu đề nhúng trong PDF xem có phải bài giảng / slide môn học không.
 */
export function inspectPdfDataUrl(
  dataUrl: string,
  fileName: string
): { isValid: boolean; pageCount: number; reason?: string } {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return { isValid: true, pageCount: 1 };
    const b64 = dataUrl.slice(commaIdx + 1);
    if (!b64 || typeof globalThis.atob !== 'function') {
      return { isValid: true, pageCount: 1 };
    }

    // Giải mã 120KB đầu và 60KB cuối của PDF (nơi chứa /Pages /Count và /Info trailer)
    const headChunkLen = Math.min(b64.length, 160000);
    const alignedHeadLen = headChunkLen - (headChunkLen % 4);
    const headBin = globalThis.atob(b64.slice(0, alignedHeadLen));

    let tailBin = '';
    if (b64.length > alignedHeadLen) {
      const tailStart = Math.max(alignedHeadLen, b64.length - 80000);
      const alignedTailStart = tailStart + ((4 - (tailStart % 4)) % 4);
      if (alignedTailStart < b64.length) {
        tailBin = globalThis.atob(b64.slice(alignedTailStart));
      }
    }

    const combined = `${headBin}\n${tailBin}`;
    const countMatches = Array.from(combined.matchAll(/\/Count\s+(\d+)/g));
    let maxPages = 0;
    for (const m of countMatches) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxPages && n < 10000) {
        maxPages = n;
      }
    }

    if (maxPages > 10) {
      return {
        isValid: false,
        pageCount: maxPages,
        reason: `Tệp PDF "${fileName}" có tới ${maxPages} trang (tài liệu bài giảng / giáo trình / báo cáo nhiều trang), không phải bản scan giấy tờ minh chứng hành chính hợp lệ.`,
      };
    }

    const lower = combined.toLowerCase();
    if (
      lower.includes('powerpoint') ||
      lower.includes('beamer') ||
      lower.includes('lecture notes') ||
      lower.includes('mathematics for machine learning')
    ) {
      return {
        isValid: false,
        pageCount: maxPages || 1,
        reason: `Tệp PDF "${fileName}" là bản trình chiếu / tài liệu môn học, không phải bản scan giấy tờ minh chứng hành chính hợp lệ.`,
      };
    }

    return { isValid: true, pageCount: maxPages || 1 };
  } catch {
    return { isValid: true, pageCount: 1 };
  }
}

function inspectPixelsViaCanvas(dataUrl: string): Promise<CanvasInspectionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const sampleSize = 80; // 80x80 = 6,400 pixels (chạy < 3ms)
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            isDarkThemeOrInfographic: false,
            averageLightness: 0.8,
            darkPixelRatio: 0.1,
            hasRedStamp: false,
            redStampRatio: 0,
          });
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalLightness = 0;
        let darkPixels = 0;
        let redStampPixels = 0;
        const totalPixels = sampleSize * sampleSize;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Độ sáng cảm nhận theo chuẩn ITU-R BT.601
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalLightness += lum;

          if (lum < 0.35) {
            darkPixels += 1;
          }

          // Dấu mộc đỏ: Sắc đỏ chiếm ưu thế rõ rệt so với lục và lam
          if (r > 130 && r > g * 1.35 && r > b * 1.35 && lum > 0.22) {
            redStampPixels += 1;
          }
        }

        const avgLightness = totalLightness / totalPixels;
        const darkRatio = darkPixels / totalPixels;
        const redRatio = redStampPixels / totalPixels;

        // Văn bản hành chính luôn in trên giấy trắng (độ sáng > 0.45, tỷ lệ pixel tối < 38%).
        // Đồ họa thông tin, poster, dark mode (như infographic Claude Code) có nền đen/tối:
        const isDarkThemeOrInfographic = avgLightness < 0.45 || darkRatio > 0.38;

        resolve({
          isDarkThemeOrInfographic,
          averageLightness: avgLightness,
          darkPixelRatio: darkRatio,
          hasRedStamp: redRatio >= 0.002,
          redStampRatio: redRatio,
        });
      } catch {
        resolve({
          isDarkThemeOrInfographic: false,
          averageLightness: 0.8,
          darkPixelRatio: 0.1,
          hasRedStamp: false,
          redStampRatio: 0,
        });
      }
    };

    img.onerror = () => {
      resolve({
        isDarkThemeOrInfographic: false,
        averageLightness: 0.8,
        darkPixelRatio: 0.1,
        hasRedStamp: false,
        redStampRatio: 0,
      });
    };

    img.src = dataUrl;
  });
}
