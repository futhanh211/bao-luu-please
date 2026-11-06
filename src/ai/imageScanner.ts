import { UploadedEvidenceFile } from '../data/studentFormData';
import { isGarbageEvidenceText } from './mockTemplates';

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
 * 1. Nhận diện tệp tải từ mạng xã hội (Facebook/Instagram: \d+_\d+_\d+_n.jpg)
 * 2. Nhận diện ảnh đồ họa / infographic / poster / dark mode (nền tối, chữ sáng)
 * 3. Kiểm tra tính chất văn bản hành chính in trên giấy trắng (độ sáng nền > 50%, tỷ lệ pixel tối < 35%)
 */
export async function analyzeImageVisualFeatures(
  file: UploadedEvidenceFile
): Promise<ImageVisualAnalysis> {
  // 1. Kiểm tra tên tệp & định dạng cơ bản
  const fileName = file.name || '';
  const isFacebookDownload = Boolean(fileName.match(/\d+_\d+_\d+_n\.(jpg|jpeg|png|webp)$/i));

  if (isFacebookDownload) {
    return {
      isValidDocumentPaper: false,
      rejectReason: `Tệp "${fileName}" là ảnh tải từ mạng xã hội (Facebook/Instagram), không phải văn bản hành chính có giá trị pháp lý.`,
      averageLightness: 0.2,
      darkPixelRatio: 0.7,
      hasRedStamp: false,
      redStampRatio: 0,
    };
  }

  if (isGarbageEvidenceText(fileName)) {
    return {
      isValidDocumentPaper: false,
      rejectReason: `Tệp "${fileName}" chứa từ khóa không liên quan (tài liệu học tập/ứng dụng/đồ họa thông tin), không phát hiện tiêu đề hành chính.`,
      averageLightness: 0.3,
      darkPixelRatio: 0.6,
      hasRedStamp: false,
      redStampRatio: 0,
    };
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
  if (typeof window !== 'undefined' && typeof Image !== 'undefined' && file.dataUrl && file.dataUrl.startsWith('data:image/')) {
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
      return {
        isValidDocumentPaper: true,
        averageLightness: visual.averageLightness,
        darkPixelRatio: visual.darkPixelRatio,
        hasRedStamp: visual.hasRedStamp,
        redStampRatio: visual.redStampRatio,
      };
    } catch {
      // Fallback an toàn nếu canvas bị chặn do CORS
    }
  }

  return {
    isValidDocumentPaper: true,
    averageLightness: 0.85,
    darkPixelRatio: 0.12,
    hasRedStamp: false,
    redStampRatio: 0,
  };
}

interface CanvasInspectionResult {
  isDarkThemeOrInfographic: boolean;
  averageLightness: number;
  darkPixelRatio: number;
  hasRedStamp: boolean;
  redStampRatio: number;
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
