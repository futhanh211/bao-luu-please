import { UploadedEvidenceFile } from './studentFormData';
import { StudentEvidenceOptionKey } from './customTestData';

export interface SampleEvidencePreset {
  id: StudentEvidenceOptionKey;
  label: string;
  fileName: string;
  description: string;
}

export const SAMPLE_PRESETS: SampleEvidencePreset[] = [
  {
    id: 'medical',
    label: 'Giấy ra viện Bệnh viện Đa khoa Đà Nẵng (Y tế)',
    fileName: 'giay_ra_vien_bv_da_khoa_da_nang.svg',
    description: 'Chẩn đoán phẫu thuật chấn thương gãy xương, chỉ định nghỉ 6 tháng, có dấu đỏ.',
  },
  {
    id: 'military',
    label: 'Lệnh gọi nhập ngũ BCH Quân sự Hải Châu (Quân sự)',
    fileName: 'lenh_goi_nhap_ngu_bch_quan_su.svg',
    description: 'Lệnh gọi công dân nhập ngũ đợt 2/2026, có chữ ký Chỉ huy trưởng và mộc đỏ.',
  },
  {
    id: 'hardship',
    label: 'Xác nhận hoàn cảnh khó khăn UBND Phường (Hoàn cảnh)',
    fileName: 'xac_nhan_hoan_canh_ubnd_phuong.svg',
    description: 'Xác nhận hộ cận nghèo gặp biến cố kinh tế thiên tai, có dấu tròn UBND.',
  },
  {
    id: 'personal',
    label: 'Đơn giải trình lý do cá nhân / Tiếp nhận thực tập',
    fileName: 'don_trinh_bay_nguyen_vong_ca_nhan.svg',
    description: 'Đơn giải trình tham gia khóa thực tập dự án ngoài trường có cam kết phụ huynh.',
  },
];

function xmlEscape(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSvgDataUrl(svgString: string): string {
  try {
    const utf8Bytes = encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return `data:image/svg+xml;base64,${btoa(utf8Bytes)}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }
}

export function createSampleEvidenceFile(
  optionKey: StudentEvidenceOptionKey,
  studentName = 'Nguyễn Minh Khoa'
): UploadedEvidenceFile {
  let fileName = 'giay_ra_vien_bv_da_khoa_da_nang.svg';
  let title = 'GIẤY RA VIỆN & XÁC NHẬN ĐIỀU TRỊ';
  let authority = 'BỆNH VIỆN ĐA KHOA ĐÀ NẴNG';
  let subtitle = 'SỞ Y TẾ THÀNH PHỐ ĐÀ NẴNG';
  let content1 = `Họ và tên bệnh nhân: ${studentName.toUpperCase()}`;
  let content2 = 'Chẩn đoán: Hậu phẫu chấn thương gãy 1/3 xương cẳng chân do TNGT';
  let content3 = 'Chỉ định bác sĩ: Tĩnh dưỡng, bất động nẹp vít và phục hồi chức năng 06 tháng';
  let dateText = 'Đà Nẵng, ngày 18 tháng 09 năm 2026';
  let stampText = 'BỆNH VIỆN ĐA KHOA';
  let stampSub = 'TP. ĐÀ NẴNG';

  if (optionKey === 'military') {
    fileName = 'lenh_goi_nhap_ngu_bch_quan_su.svg';
    title = 'LỆNH GỌI CÔNG DÂN NHẬP NGŨ';
    authority = 'BAN CHỈ HUY QUÂN SỰ QUẬN HẢI CHÂU';
    subtitle = 'BỘ TƯ LỆNH QUÂN KHU 5 · BỘ CHQS TP ĐÀ NẴNG';
    content1 = `Gọi công dân: ${studentName.toUpperCase()}`;
    content2 = 'Lý do: Thực hiện nghĩa vụ quân sự theo Luật Nghĩa vụ quân sự';
    content3 = 'Thời gian tập trung: 07h00 ngày 05/09/2026 tại Trung tâm VHTT quận';
    dateText = 'Hải Châu, ngày 10 tháng 08 năm 2026';
    stampText = 'BCH QUÂN SỰ';
    stampSub = 'Q. HẢI CHÂU';
  } else if (optionKey === 'hardship') {
    fileName = 'xac_nhan_hoan_canh_ubnd_phuong.svg';
    title = 'GIẤY XÁC NHẬN HOÀN CẢNH GIA ĐÌNH';
    authority = 'ỦY BAN NHÂN DÂN PHƯỜNG THẠCH THANG';
    subtitle = 'UBND QUẬN HẢI CHÂU · TP. ĐÀ NẴNG';
    content1 = `Xác nhận cho sinh viên: ${studentName.toUpperCase()}`;
    content2 = 'Hoàn cảnh: Hộ cận nghèo (Sổ 2026/CN-TT), gia đình gặp biến cố kinh tế';
    content3 = 'Ý kiến địa phương: Đề nghị Nhà trường tạo điều kiện tạm hoãn học tập';
    dateText = 'Thạch Thang, ngày 12 tháng 08 năm 2026';
    stampText = 'UBND PHƯỜNG';
    stampSub = 'THẠCH THANG';
  } else if (optionKey === 'personal') {
    fileName = 'don_trinh_bay_nguyen_vong_ca_nhan.svg';
    title = 'ĐƠN TRÌNH BÀY NGUYỆN VỌNG CÁ NHÂN';
    authority = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    subtitle = 'Độc lập — Tự do — Hạnh phúc';
    content1 = `Kính gửi: Ban Giám hiệu Trường ĐH Kinh tế – ĐH Đà Nẵng`;
    content2 = `Tôi tên là: ${studentName} — Sinh viên xin tạm nghỉ 1 học kỳ`;
    content3 = 'Lý do: Tham gia chương trình thực tập kỹ năng thực tế có ý kiến phụ huynh';
    dateText = 'Đà Nẵng, ngày 01 tháng 09 năm 2026';
    stampText = 'XÁC NHẬN';
    stampSub = 'HỢP LỆ';
  }

  const safeSubtitle = xmlEscape(subtitle);
  const safeAuthority = xmlEscape(authority);
  const safeTitle = xmlEscape(title);
  const safeContent1 = xmlEscape(content1);
  const safeContent2 = xmlEscape(content2);
  const safeContent3 = xmlEscape(content3);
  const safeDateText = xmlEscape(dateText);
  const safeStampText = xmlEscape(stampText);
  const safeStampSub = xmlEscape(stampSub);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 900" width="100%" height="100%" style="background:#fcfbf7; font-family:'Segoe UI', Arial, sans-serif;">
  <!-- Nền giấy cổ điển và hoa văn viền -->
  <rect x="20" y="20" width="660" height="860" fill="#fcfbf7" stroke="#b9b093" stroke-width="2" />
  <rect x="28" y="28" width="644" height="844" fill="none" stroke="#d8d0b6" stroke-width="1" stroke-dasharray="4 2" />

  <!-- Tiêu ngữ và Cơ quan ban hành -->
  <text x="350" y="70" text-anchor="middle" font-size="12" fill="#4a4a40" letter-spacing="1">${safeSubtitle}</text>
  <text x="350" y="94" text-anchor="middle" font-size="15" font-weight="bold" fill="#1d1d19">${safeAuthority}</text>
  <line x1="260" y1="104" x2="440" y2="104" stroke="#1d1d19" stroke-width="1.5" />

  <!-- Tiêu đề văn bản -->
  <text x="350" y="160" text-anchor="middle" font-size="20" font-weight="bold" fill="#27508a" letter-spacing="0.5">${safeTitle}</text>
  <text x="350" y="185" text-anchor="middle" font-size="12" fill="#717165" font-style="italic">Số hiệu lưu trữ: BL-EVD-2026/894-DN</text>

  <!-- Khung nội dung trích xuất -->
  <rect x="60" y="220" width="580" height="420" fill="#f5f0df" rx="4" stroke="#d8d0b6" stroke-width="1.2" />
  
  <text x="85" y="265" font-size="14" font-weight="bold" fill="#1d1d19">${safeContent1}</text>
  <line x1="85" y1="280" x2="615" y2="280" stroke="#e0d9c4" stroke-width="1" />

  <text x="85" y="325" font-size="13" font-weight="600" fill="#2d3748">Nội dung chi tiết hồ sơ:</text>
  <text x="85" y="355" font-size="12.5" fill="#4a5568">${safeContent2}</text>
  <text x="85" y="385" font-size="12.5" fill="#4a5568">${safeContent3}</text>

  <rect x="85" y="420" width="510" height="180" fill="#ffffff" rx="3" stroke="#cbd5e0" stroke-width="1" />
  <text x="105" y="455" font-size="12" font-weight="bold" fill="#2b6cb0">THÔNG TIN TRÍCH XUẤT QUANG HỌC OCR:</text>
  <text x="105" y="485" font-size="11.5" fill="#4a5568">• Đơn vị xác nhận: ${safeAuthority}</text>
  <text x="105" y="510" font-size="11.5" fill="#4a5568">• Thời gian hiệu lực: 06 tháng kể từ ngày ký</text>
  <text x="105" y="535" font-size="11.5" fill="#4a5568">• Chữ ký bác sĩ / Trưởng đơn vị: ĐÃ XÁC THỰC</text>
  <text x="105" y="560" font-size="11.5" fill="#38a169" font-weight="bold">• Tình trạng dấu mộc: CON DẤU MỘC ĐỎ HỢP LỆ</text>

  <!-- Ngày tháng và Người ký -->
  <text x="500" y="680" text-anchor="middle" font-size="12" font-style="italic" fill="#4a4a40">${safeDateText}</text>
  <text x="500" y="705" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d1d19">THỦ TRƯỞNG ĐƠN VỊ</text>
  <text x="500" y="722" text-anchor="middle" font-size="11" fill="#717165">(Ký, ghi rõ họ tên và đóng dấu)</text>
  <path d="M460,760 Q485,735 510,755 T545,745" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" />
  <text x="500" y="805" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d1d19">Lê Văn Tuấn</text>

  <!-- Con dấu tròn đỏ (Chống giả mạo / Đóng mộc thật) -->
  <g transform="translate(430, 715) rotate(-12)">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#dc2626" stroke-width="3" opacity="0.88" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.88" />
    <circle cx="50" cy="50" r="28" fill="none" stroke="#dc2626" stroke-width="1.5" opacity="0.88" />
    <text x="50" y="32" text-anchor="middle" font-size="8" font-weight="bold" fill="#dc2626" letter-spacing="0.5">${safeStampText}</text>
    <text x="50" y="78" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#dc2626">${safeStampSub}</text>
    <polygon points="50,42 53,48 60,48 55,53 57,60 50,55 43,60 45,53 40,48 47,48" fill="#dc2626" opacity="0.9" />
  </g>
</svg>`;

  const dataUrl = toSvgDataUrl(svg);

  return {
    name: fileName,
    size: svg.length,
    type: 'image/svg+xml',
    dataUrl,
    svgRaw: svg,
    lastModified: Date.now(),
  };
}
