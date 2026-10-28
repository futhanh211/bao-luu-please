import { DocScanInput, DocScanResult, ReviewerBrief, AIProvider } from '../engine/types';
import { AIScriptConfig, CaseSummary } from './provider';

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

    if (this.script?.docScanResult) {
      return this.script.docScanResult;
    }

    // Default heuristic for mock when no custom script is given
    if (!input.evidence || input.evidence.length === 0) {
      return {
        evidenceType: 'Không có',
        typeMatchesReason: false,
        extracted: {},
        anomalies: [
          { field: 'evidence', issue: 'Sinh viên chưa đính kèm tài liệu minh chứng hợp lệ', severity: 'high' },
        ],
        confidence: 0.1,
      };
    }

    const firstEvidence = input.evidence[0];
    const reason = input.form.reason;
    let typeMatchesReason = true;

    if (reason === 'Ốm đau/tai nạn điều trị dài' && !firstEvidence.name.includes('viện') && !firstEvidence.type.includes('medical')) {
      typeMatchesReason = false;
    } else if (reason === 'Nghĩa vụ quân sự' && !firstEvidence.name.includes('quân sự') && !firstEvidence.type.includes('military')) {
      typeMatchesReason = false;
    }

    return {
      evidenceType: firstEvidence.type,
      typeMatchesReason,
      extracted: {
        documentName: firstEvidence.name,
        extractedMssv: input.form.mssv,
        extractedName: input.form.fullName,
      },
      anomalies: firstEvidence.issueNotes
        ? [{ field: 'documentDate', issue: firstEvidence.issueNotes, severity: 'high' }]
        : [],
      confidence: typeMatchesReason ? 0.95 : 0.4,
    };
  }

  public async reviewerBrief(role: 'advisor' | 'ctsv', _ctx: unknown): Promise<ReviewerBrief> {
    await this.delay();

    if (role === 'advisor' && this.script?.advisorBrief) {
      return this.script.advisorBrief;
    }
    if (role === 'ctsv' && this.script?.ctsvBrief) {
      return this.script.ctsvBrief;
    }

    if (role === 'advisor') {
      return {
        summary: 'Sinh viên có đơn đề đạt nguyện vọng nghỉ học tạm thời, thông tin đào tạo cơ bản đạt chuẩn.',
        points: ['Điểm học tập tích lũy bình thường', 'Chưa vi phạm kỷ luật', 'Đã trao đổi cùng gia đình'],
        suggestedDecision: 'confirm',
        rationale: 'Nguyện vọng chính đáng và phù hợp với quy chế đào tạo hiện hành.',
      };
    }

    return {
      summary: 'Hồ sơ minh chứng được quét tự động qua hệ thống trích xuất OCR.',
      points: ['Minh chứng viện phí/bệnh án có mộc đỏ hợp lệ', 'Không phát hiện sai lệch thông tin'],
      suggestedDecision: 'valid',
      rationale: 'Tài liệu đáp ứng đầy đủ điều kiện theo quy chế công tác sinh viên.',
    };
  }

  public async draftText(kind: 'return' | 'reject' | 'decisionBasis', ctx: unknown): Promise<string> {
    await this.delay();

    if (kind === 'return') {
      if (this.script?.returnMessage) return this.script.returnMessage;
      return 'Hồ sơ xin nghỉ học tạm thời của bạn chưa đầy đủ minh chứng hợp lệ. Vui lòng bổ sung giấy tờ và nộp lại.';
    }

    if (kind === 'reject') {
      if (this.script?.rejectMessage) return this.script.rejectMessage;
      return 'Nhà trường rất tiếc không thể phê duyệt yêu cầu bảo lưu kết quả học tập do không đáp ứng đủ các tiêu chuẩn theo quy chế.';
    }

    if (this.script?.decisionBasis) return this.script.decisionBasis;
    const summary = ctx as CaseSummary | undefined;
    return `Căn cứ Quy chế đào tạo đại học; Căn cứ Đơn xin nghỉ học tạm thời của sinh viên ${summary?.form?.fullName || 'sinh viên'} và kết quả thẩm định của các đơn vị chức năng.`;
  }

  public async chat(_history: unknown[], _ctx: unknown): Promise<string> {
    await this.delay();
    return 'Xin chào! Tôi là Trợ lý Cổng Một Cửa. Tôi có thể hỗ trợ giải đáp quy trình và tiến độ hồ sơ bảo lưu.';
  }
}

export const defaultMockAI = new MockAIProvider(undefined, 0);
