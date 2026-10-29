import { describe, expect, it } from 'vitest';
import { MockAIProvider } from './mock';
import { SCENARIOS, ScenarioConfig } from '../data/scenarios';
import { CaseSummary } from './provider';

function scenario(id: string): ScenarioConfig {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Không có kịch bản ${id}`);
  return found;
}

function summaryOf(id: string, patch: Partial<CaseSummary> = {}): CaseSummary {
  const sc = scenario(id);
  return {
    form: sc.form,
    evidence: sc.evidence,
    day: 1,
    validity: { complete: true, missing: [], evidenceOk: true },
    ruleResult: { pass: true, violations: [] },
    advisorStatus: 'confirmed',
    ctsvStatus: 'valid',
    ...patch,
  };
}

describe('MockAIProvider · AI-1 đọc minh chứng', () => {
  it('S1: trả đúng aiScript.docScanResult với confidence cao', async () => {
    const sc = scenario('s1');
    const ai = new MockAIProvider(sc.aiScript, 0);
    const result = await ai.analyzeDocuments({ form: sc.form, evidence: sc.evidence });

    expect(result).toEqual(sc.aiScript?.docScanResult);
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('S2: không minh chứng thì luôn fail, bất kể aiScript khai gì', async () => {
    const sc = scenario('s2');
    const ai = new MockAIProvider(sc.aiScript, 0);
    const result = await ai.analyzeDocuments({ form: sc.form, evidence: [] });

    expect(result.confidence).toBe(0.1);
    expect(result.typeMatchesReason).toBe(false);
    expect(result.anomalies.some((a) => a.severity === 'high')).toBe(true);
  });

  it('Custom: suy ra từ dữ kiện hồ sơ, không cần aiScript', async () => {
    const sc = scenario('s6');
    const ai = new MockAIProvider(undefined, 0);
    const result = await ai.analyzeDocuments({ form: sc.form, evidence: sc.evidence });

    expect(result.typeMatchesReason).toBe(true);
    expect(result.extracted.patientName).toBe('Đỗ Mai Lan');
    expect(result.extracted.hospital).toBe('Bệnh viện C Đà Nẵng');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('Custom: lý do nghĩa vụ quân sự nhưng nộp giấy y tế → không khớp, confidence thấp', async () => {
    const sc = scenario('s6');
    const ai = new MockAIProvider(undefined, 0);
    const result = await ai.analyzeDocuments({
      form: { ...sc.form, reason: 'Nghĩa vụ quân sự' },
      evidence: sc.evidence,
    });

    expect(result.typeMatchesReason).toBe(false);
    expect(result.confidence).toBeLessThanOrEqual(0.4);
  });
});

describe('MockAIProvider · AI-3 tóm tắt cho người duyệt', () => {
  it('S5: đề xuất KHÔNG HỢP LỆ với đủ 3 điểm bất thường', async () => {
    const sc = scenario('s5');
    const ai = new MockAIProvider(sc.aiScript, 0);
    const brief = await ai.reviewerBrief('ctsv', summaryOf('s5'));

    expect(brief.suggestedDecision).toBe('invalid');
    expect(brief.points).toHaveLength(3);
  });

  it('Fallback CTSV: evidence có bất thường → invalid, evidence sạch → valid', async () => {
    const ai = new MockAIProvider(undefined, 0);

    const dirty = await ai.reviewerBrief('ctsv', summaryOf('s5'));
    expect(dirty.suggestedDecision).toBe('invalid');
    expect(dirty.rationale).toContain('người duyệt quyết định');

    const clean = await ai.reviewerBrief('ctsv', summaryOf('s1'));
    expect(clean.suggestedDecision).toBe('valid');
  });

  it('Fallback Cố vấn: thiếu điều kiện thì đề xuất KHÔNG XÁC NHẬN', async () => {
    const ai = new MockAIProvider(undefined, 0);

    const ok = await ai.reviewerBrief('advisor', summaryOf('s1'));
    expect(ok.suggestedDecision).toBe('confirm');

    const bad = await ai.reviewerBrief(
      'advisor',
      summaryOf('s3', { ruleResult: { pass: false, violations: ['Công nợ học phí 7.500.000 VNĐ'] } })
    );
    expect(bad.suggestedDecision).toBe('decline');
    expect(bad.points.join(' ')).toContain('7.500.000');
  });
});

describe('MockAIProvider · AI-4 soạn văn bản', () => {
  it('Fallback trả hồ sơ: nêu đúng nội dung còn thiếu', async () => {
    const ai = new MockAIProvider(undefined, 0);
    const text = await ai.draftText(
      'return',
      summaryOf('s2', { validity: { complete: false, missing: ['Họ tên', 'Số điện thoại'], evidenceOk: false } })
    );

    expect(text).toContain('Họ tên');
    expect(text).toContain('Số điện thoại');
    expect(text).toContain('minh chứng');
  });

  it('Fallback từ chối: nêu đúng vi phạm công nợ học phí', async () => {
    const ai = new MockAIProvider(undefined, 0);
    const text = await ai.draftText(
      'reject',
      summaryOf('s3', { ruleResult: { pass: false, violations: ['Công nợ học phí: 7.500.000 VNĐ'] } })
    );

    expect(text).toContain('Công nợ học phí');
    expect(text).toContain('7.500.000');
  });

  it('Fallback căn cứ quyết định: dùng đúng dữ kiện sinh viên', async () => {
    const sc = scenario('s1');
    const ai = new MockAIProvider(undefined, 0);
    const text = await ai.draftText('decisionBasis', summaryOf('s1'));

    expect(text).toContain(sc.form.fullName);
    expect(text).toContain(sc.form.mssv);
    expect(text).toContain(`${sc.form.semesterCount} học kỳ`);
    expect(text).toContain(sc.form.startSemester);
  });
});

describe('MockAIProvider · AI-2 chat & tính tất định', () => {
  it('Câu hỏi tiến độ khi đang chờ Cố vấn → trả lời context-aware', async () => {
    const ai = new MockAIProvider(undefined, 0);
    const answer = await ai.chat(
      [{ role: 'user', content: 'Tiến độ hồ sơ của tôi?' }],
      { submitted: true, waitingTask: 'T4' }
    );

    expect(answer).toContain('Cố vấn');
    expect(answer).toContain('SLA');
  });

  it('Gọi 2 lần cùng input cho cùng output', async () => {
    const sc = scenario('s6');
    const ai = new MockAIProvider(undefined, 0);
    const first = await ai.analyzeDocuments({ form: sc.form, evidence: sc.evidence });
    const second = await ai.analyzeDocuments({ form: sc.form, evidence: sc.evidence });

    expect(second).toEqual(first);
  });
});
