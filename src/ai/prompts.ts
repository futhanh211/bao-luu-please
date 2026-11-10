import { DocScanInput } from '../engine/types';
import { CaseSummary, ChatMessage } from './provider';
import { KNOWLEDGE_ENTRIES } from '../data/knowledge-base';
import { StudentEvidenceOptionKey } from '../data/customTestData';
import { UploadedEvidenceFile } from '../data/studentFormData';

export interface PromptBundle {
  system: string;
  user: string;
  json: boolean;
  imagePart?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Prompt khung lấy nguyên văn từ docs/05-AI-SPEC.md mục 5.
 * Live chỉ là lớp phủ; mock vẫn là đường chạy mặc định.
 */
export const SYSTEM_PROMPTS = {
  docScan:
    'Bạn là bộ đọc hồ sơ cho quy trình nghỉ học tạm thời của một trường đại học. Nhận: đơn sinh viên và nội dung các minh chứng. Nhiệm vụ: (1) xác định loại minh chứng, (2) cho biết có khớp lý do nghỉ không, (3) trích các trường chính, (4) liệt kê bất thường (ngày không hợp lý, tên không khớp, thiếu dấu/chữ ký…), (5) cho confidence 0–1. Chỉ trả về JSON đúng schema. Không suy đoán ngoài dữ liệu.',
  chat: 'Bạn là trợ lý của Cổng thông tin sinh viên, trả lời ngắn gọn, thân thiện bằng tiếng Việt. Chỉ dựa vào TRI THỨC và TÌNH TRẠNG CA được cung cấp. Nếu không có trong tri thức, nói bạn không chắc và hướng dẫn liên hệ Phòng Công tác sinh viên. Không hứa kết quả xét duyệt.',
  reviewer:
    'Bạn hỗ trợ người duyệt hồ sơ (vai: {role}). Tóm tắt ca trong 2–3 câu, nêu tối đa 4 điểm cần chú ý, đề xuất quyết định kèm lý do. Nhấn mạnh quyết định cuối cùng thuộc về người duyệt. Chỉ trả JSON.',
  draft:
    'Soạn văn bản hành chính tiếng Việt lịch sự, rõ ràng, ngắn (≤ 120 từ) cho loại: {kind}. Dùng đúng dữ kiện được cung cấp, không thêm thông tin mới.',
  ocrScan:
    'Bạn là hệ thống Gemini Vision OCR quang học và trích xuất thực thể tài liệu hành chính cho Cổng Dịch vụ Một cửa điện tử Trường Đại học Kinh tế – Đại học Đà Nẵng. Bạn nhận hình ảnh tài liệu minh chứng kèm loại giấy tờ mục tiêu. Nhiệm vụ: Đọc chính xác nội dung chữ trong ảnh, nhận diện đúng loại tài liệu (medical, military, hardship, personal), trích xuất các trường thông tin chuẩn hóa theo định dạng ngày DD/MM/YYYY, nhận diện chữ ký và con dấu mộc đỏ (isValidStamp: true nếu có dấu mộc tròn đỏ hoặc quốc huy của cơ quan). QUY TẮC PHÂN LOẠI CĂN CƯỚC CÔNG DÂN (CCCD / CMND / THẺ CĂN CƯỚC): Nếu hình ảnh là Căn cước công dân / CMND / Thẻ căn cước / Giấy tờ định danh công dân, bạn BẮT BUỘC đặt "documentType": "personal", trong data.personal đặt "subType": "personal_letter" (TUYỆT ĐỐI KHÔNG đặt "internship" cho CCCD), để trống companyName/internshipRole/startDate/endDate, ghi thông tin trích xuất từ thẻ (Số CCCD, Họ và tên, Ngày sinh, Quê quán, Nơi thường trú) vào trường "personalReasonContent", đặt "summary": "Đã nhận diện Căn cước công dân của [Họ tên] (Số: [Số CCCD])", và đặt "isValidStamp": true. Chỉ đặt "subType": "internship" khi tài liệu thực sự là Giấy xác nhận / tiếp nhận thực tập của công ty / doanh nghiệp. QUY TẮC BẢO MẬT & LOẠI BỎ HỒ SƠ KHÔNG HỢP LỆ: Nếu hình ảnh tải lên KHÔNG PHẢI là văn bản hành chính hoặc giấy tờ định danh hợp lệ (ví dụ: sơ đồ hệ thống, biểu đồ ERD, draw.io, flowchart, ảnh chụp màn hình máy tính/app điện thoại, ảnh động vật/mèo/chó, ảnh selfie/chân dung tự chụp, ảnh đồ ăn, ảnh bài tập/slide, meme, ảnh phong cảnh, hoặc tài liệu không liên quan), bạn BẮT BUỘC trả về {"isValidDocument":false,"documentType":"unknown","confidence":0.1,"summary":"Tài liệu bị từ chối: Hình ảnh không phải văn bản hành chính hoặc giấy tờ minh chứng hợp lệ.","data":{}}. Tuyệt đối không tự suy diễn thêm thông tin không có trên giấy tờ.',
} as const;

const DOC_SCAN_SCHEMA =
  '{"evidenceType":"string","typeMatchesReason":true,"extracted":{"key":"value"},"anomalies":[{"field":"string","issue":"string","severity":"low|medium|high"}],"confidence":0.0}';

const BRIEF_SCHEMA =
  '{"summary":"string","points":["string"],"suggestedDecision":"confirm|decline|valid|invalid","rationale":"string"}';

export const DRAFT_SCHEMA = '{"text":"string"}';

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function buildDocScanPayload(input: DocScanInput): PromptBundle {
  const evidence = input.evidence.map((item) => ({
    type: item.type,
    name: item.name,
    content: item.content,
    issueNotes: item.issueNotes,
    fields: (item.fields ?? []).map((field) => ({
      label: field.label,
      value: field.value,
    })),
  }));

  return {
    system: SYSTEM_PROMPTS.docScan,
    user: `ĐƠN SINH VIÊN:\n${toJson(input.form)}\n\nMINH CHỨNG:\n${toJson(evidence)}\n\nTrả về JSON đúng schema sau, không thêm chữ nào khác:\n${DOC_SCAN_SCHEMA}`,
    json: true,
  };
}

export function buildChatPayload(history: ChatMessage[], ctx: unknown): PromptBundle {
  const recent = history.slice(-6);
  const knowledge = KNOWLEDGE_ENTRIES.map(
    (entry) => `- [${entry.id}] ${entry.label}: ${entry.answer}`
  ).join('\n');

  return {
    system: SYSTEM_PROMPTS.chat,
    user: `TRI THỨC:\n${knowledge}\n\nTÌNH TRẠNG CA:\n${toJson(ctx)}\n\nHỘI THOẠI GẦN NHẤT:\n${recent
      .map((message) => `${message.role === 'user' ? 'Sinh viên' : 'Trợ lý'}: ${message.content}`)
      .join('\n')}\n\nTrả lời bằng văn bản thường, ngắn gọn.`,
    json: false,
  };
}

export function buildReviewerPayload(
  role: 'advisor' | 'ctsv',
  ctx: CaseSummary
): PromptBundle {
  const roleLabel = role === 'advisor' ? 'Cố vấn học tập' : 'Phòng Công tác sinh viên';
  const decisionSet = role === 'advisor' ? 'confirm|decline' : 'valid|invalid';

  return {
    system: SYSTEM_PROMPTS.reviewer.replace('{role}', roleLabel),
    user: `VAI: ${roleLabel}\nTÓM TẮT CA:\n${toJson(ctx)}\n\nTrả về JSON đúng schema (suggestedDecision chỉ nhận ${decisionSet}):\n${BRIEF_SCHEMA}`,
    json: true,
  };
}

export function buildDraftPayload(
  kind: 'return' | 'reject' | 'decisionBasis',
  ctx: CaseSummary
): PromptBundle {
  return {
    system: SYSTEM_PROMPTS.draft.replace('{kind}', kind),
    user: `LOẠI VĂN BẢN: ${kind}\nDỮ KIỆN CA:\n${toJson(ctx)}\n\nTrả về JSON đúng schema:\n${DRAFT_SCHEMA}`,
    json: true,
  };
}

const OCR_SCHEMAS: Record<StudentEvidenceOptionKey, string> = {
  medical:
    '{"documentType":"medical","confidence":0.95,"summary":"string","data":{"medical":{"hospital":"string","recordCode":"string","department":"string","doctorName":"string","admissionDate":"DD/MM/YYYY","dischargeDate":"DD/MM/YYYY","diagnosis":"string","isValidStamp":true}}}',
  military:
    '{"documentType":"military","confidence":0.95,"summary":"string","data":{"military":{"militaryUnit":"string","orderNumber":"string","signDate":"DD/MM/YYYY","reportDate":"DD/MM/YYYY","location":"string","isValidStamp":true}}}',
  hardship:
    '{"documentType":"hardship","confidence":0.95,"summary":"string","data":{"hardship":{"authority":"string","category":"Hộ nghèo|Hộ cận nghèo|Biến cố kinh tế đột xuất|Khác","guardianName":"string","confirmDate":"DD/MM/YYYY","description":"string","isValidStamp":true}}}',
  personal:
    '{"documentType":"personal","confidence":0.95,"summary":"string","data":{"personal":{"subType":"personal_letter|internship","personalReasonContent":"string","parentName":"string","parentPhone":"string","companyName":"string","internshipRole":"string","startDate":"DD/MM/YYYY","endDate":"DD/MM/YYYY","isValidStamp":true}}}',
};

export function buildOcrPayload(
  file: UploadedEvidenceFile,
  optionKey: StudentEvidenceOptionKey
): PromptBundle {
  let imagePart: PromptBundle['imagePart'] = undefined;
  if (file.dataUrl && file.dataUrl.startsWith('data:')) {
    const commaIdx = file.dataUrl.indexOf(',');
    if (commaIdx !== -1) {
      const header = file.dataUrl.slice(0, commaIdx);
      const base64Data = file.dataUrl.slice(commaIdx + 1);
      const mimeMatch = header.match(/data:([^;]+)/);
      const rawMime = mimeMatch ? mimeMatch[1] : file.type || 'image/jpeg';
      const isPdf =
        rawMime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (rawMime.startsWith('image/') || isPdf) {
        imagePart = {
          mimeType: isPdf ? 'application/pdf' : rawMime,
          data: base64Data,
        };
      }
    }
  }

  const primarySchema = OCR_SCHEMAS[optionKey] || OCR_SCHEMAS.medical;
  const allSchemasText = [
    `- Nếu là giấy y tế / bệnh viện (medical): ${OCR_SCHEMAS.medical}`,
    `- Nếu là lệnh gọi nhập ngũ / nghĩa vụ quân sự (military): ${OCR_SCHEMAS.military}`,
    `- Nếu là giấy xác nhận hoàn cảnh gia đình / hộ nghèo UBND (hardship): ${OCR_SCHEMAS.hardship}`,
    `- Nếu là đơn trình bày cá nhân / thực tập / CCCD (personal): ${OCR_SCHEMAS.personal}`,
  ].join('\n');

  const userText = [
    `LOẠI GIẤY TỜ MỤC TIÊU (TAB HIỆN TẠI): ${optionKey}`,
    `TÊN TỆP ĐÍNH KÈM: ${file.name}`,
    `DUNG LƯỢNG TỆP: ${file.size} bytes`,
    imagePart
      ? 'HÌNH ẢNH / BẢN SCAN PDF MINH CHỨNG: (Đính kèm trong phần đa phương thức bên dưới)'
      : 'TỆP KHÔNG CÓ DỮ LIỆU ẢNH TRỰC TIẾP.',
    'QUAN TRỌNG: Người dùng có thể đang đứng ở tab khác với loại giấy tờ thực tế trong ảnh. Hãy đọc nội dung chữ viết (OCR) thực tế trên giấy tờ để tự động xác định đúng "documentType" ("medical", "military", "hardship", hoặc "personal") và trả về JSON theo đúng schema tương ứng bên dưới (không thêm văn bản nào khác):',
    allSchemasText,
    `Schema mặc định nếu khớp tab hiện tại (${optionKey}):`,
    primarySchema,
  ].join('\n');

  return {
    system: SYSTEM_PROMPTS.ocrScan,
    user: userText,
    json: true,
    imagePart,
  };
}
