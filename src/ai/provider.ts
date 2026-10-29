import type {
  DocScanResult,
  EvidenceItem,
  ReviewerBrief,
  RuleResultState,
  StudentApplicationForm,
  ValidityState,
} from '../engine/types';

/**
 * Hợp đồng AI của dự án nằm ở `engine/types.ts` (engine không phụ thuộc tầng ai).
 * File này chỉ re-export để tầng AI/UI import một chỗ.
 */
export type {
  AIProvider,
  DocScanInput,
  DocScanResult,
  ReviewerBrief,
} from '../engine/types';

/** Tóm tắt một ca để AI đọc — chỉ chứa dữ kiện engine đã có, không thêm suy diễn. */
export interface CaseSummary {
  form: StudentApplicationForm;
  validity?: ValidityState;
  ruleResult?: RuleResultState;
  advisorStatus?: string;
  ctsvStatus?: string;
  day?: number;
  evidence?: EvidenceItem[];
  /** Kết quả AI-1 đã chạy trước đó (nếu có) để AI-3 không phải quét lại. */
  aiScan?: DocScanResult;
}

/** Một lượt hội thoại với trợ lý AI-2. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Nguồn thực tế đang trả lời — khác với `aiMode` (lựa chọn của người dùng). */
export type AIStatus = 'mock' | 'live' | 'fallback';

export interface AIScriptConfig {
  docScanResult?: DocScanResult;
  advisorBrief?: ReviewerBrief;
  ctsvBrief?: ReviewerBrief;
  returnMessage?: string;
  rejectMessage?: string;
  decisionBasis?: string;
}

/** Đọc `ctx: unknown` của AIProvider thành CaseSummary mà không dùng `any`. */
export function asCaseSummary(ctx: unknown): CaseSummary | null {
  if (!ctx || typeof ctx !== 'object') return null;
  const candidate = ctx as { form?: unknown };
  if (!candidate.form || typeof candidate.form !== 'object') return null;
  return ctx as CaseSummary;
}

/** Đọc `ctx: unknown` của AIProvider thành ngữ cảnh chat sinh viên. */
export function asChatContext(ctx: unknown): Record<string, unknown> {
  if (!ctx || typeof ctx !== 'object') return {};
  return ctx as Record<string, unknown>;
}
