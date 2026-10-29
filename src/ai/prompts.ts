import { DocScanInput } from '../engine/types';
import { CaseSummary, ChatMessage } from './provider';
import { KNOWLEDGE_ENTRIES } from '../data/knowledge-base';

export interface PromptBundle {
  system: string;
  user: string;
  json: boolean;
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
