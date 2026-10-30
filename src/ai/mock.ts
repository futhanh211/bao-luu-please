import { AIProvider, DocScanInput, DocScanResult, ReviewerBrief } from '../engine/types';
import { AIScriptConfig, asCaseSummary, ChatMessage } from './provider';
import { answerStudentQuestion, StudentChatContext } from '../data/knowledge-base';
import { buildFallbackBrief, buildFallbackDocScan, buildFallbackDraft } from './mockTemplates';

const EMPTY_BRIEF: Record<'advisor' | 'ctsv', ReviewerBrief> = {
  advisor: {
    summary: 'Chưa có đủ dữ kiện để tóm tắt hồ sơ.',
    points: ['Hồ sơ chưa được nạp vào ca làm việc'],
    suggestedDecision: 'decline',
    rationale: 'Đây chỉ là đề xuất, người duyệt quyết định.',
  },
  ctsv: {
    summary: 'Chưa có đủ dữ kiện để đối chiếu minh chứng.',
    points: ['Chưa đọc được minh chứng của hồ sơ'],
    suggestedDecision: 'invalid',
    rationale: 'Đây chỉ là đề xuất, người duyệt quyết định.',
  },
};

const EMPTY_DRAFT: Record<'return' | 'reject' | 'decisionBasis', string> = {
  return: 'Hồ sơ chưa đầy đủ minh chứng hợp lệ. Vui lòng bổ sung giấy tờ và nộp lại.',
  reject: 'Hồ sơ chưa đủ điều kiện bảo lưu kết quả học tập theo quy chế hiện hành.',
  decisionBasis: 'Căn cứ Quy chế đào tạo của Trường ĐH Kinh tế – ĐH Đà Nẵng và hồ sơ xin nghỉ học tạm thời của sinh viên.',
};

/**
 * AI mock — deterministic 100%, không gọi mạng.
 * Dùng `aiScript` của kịch bản nếu có, ngược lại suy ra từ dữ kiện hồ sơ.
 */
export class MockAIProvider implements AIProvider {
  public mode: 'mock' = 'mock';
  private script?: AIScriptConfig;
  private latencyMs: number;

  constructor(script?: AIScriptConfig, latencyMs = 0) {
    this.script = script;
    this.latencyMs = latencyMs;
  }

  public setScript(script?: AIScriptConfig): void {
    this.script = script;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  public async analyzeDocuments(input: DocScanInput): Promise<DocScanResult> {
    await this.delay();

    // Không đính kèm gì là dữ kiện chắc chắn của hồ sơ, không phụ thuộc kịch bản.
    if (!input.evidence || input.evidence.length === 0) {
      return buildFallbackDocScan(input.form, []);
    }

    if (this.script?.docScanResult) {
      return this.script.docScanResult;
    }

    return buildFallbackDocScan(input.form, input.evidence);
  }

  public async reviewerBrief(role: 'advisor' | 'ctsv', ctx: unknown): Promise<ReviewerBrief> {
    await this.delay();

    const summary = asCaseSummary(ctx);
    const scripted = role === 'advisor' ? this.script?.advisorBrief : this.script?.ctsvBrief;

    // Nếu có dữ liệu ca truyền vào và là ca tùy biến (không phải 6 kịch bản chuẩn S1-S6),
    // ưu tiên sinh Brief động theo đúng thông tin hồ sơ của sinh viên đang được duyệt!
    const STANDARD_SCENARIO_NAMES = [
      'Nguyễn Văn An',
      'Trần Thị Mai',
      'Lê Hoàng Long',
      'Phạm Ngọc Anh',
      'Hoàng Khánh Linh',
      'Vũ Hải Đăng',
    ];
    if (summary && scripted) {
      if (!STANDARD_SCENARIO_NAMES.includes(summary.form.fullName)) {
        return buildFallbackBrief(role, summary);
      }
      return scripted;
    }

    if (scripted) return scripted;
    if (!summary) return EMPTY_BRIEF[role];

    return buildFallbackBrief(role, summary);
  }

  public async draftText(
    kind: 'return' | 'reject' | 'decisionBasis',
    ctx: unknown
  ): Promise<string> {
    await this.delay();

    const scripted =
      kind === 'return'
        ? this.script?.returnMessage
        : kind === 'reject'
          ? this.script?.rejectMessage
          : this.script?.decisionBasis;
    if (scripted) return scripted;

    const summary = asCaseSummary(ctx);
    if (!summary) return EMPTY_DRAFT[kind];

    return buildFallbackDraft(kind, summary);
  }

  public async chat(history: unknown[], ctx: unknown): Promise<string> {
    await this.delay();

    const lastUserText = extractLastUserText(history);
    if (!lastUserText) {
      return 'Xin chào! Tôi là Trợ lý Cổng Một Cửa. Tôi có thể hỗ trợ giải đáp quy trình và tiến độ hồ sơ bảo lưu.';
    }

    return answerStudentQuestion(lastUserText, toChatContext(ctx));
  }
}

function toChatContext(ctx: unknown): StudentChatContext {
  if (!ctx || typeof ctx !== 'object') return {};
  return ctx as StudentChatContext;
}

function extractLastUserText(history: unknown[]): string {
  if (!Array.isArray(history)) return '';
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i] as Partial<ChatMessage> | undefined;
    if (message && message.role === 'user' && typeof message.content === 'string') {
      return message.content;
    }
  }
  return '';
}

export const defaultMockAI = new MockAIProvider(undefined, 0);
