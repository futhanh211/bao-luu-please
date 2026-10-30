import {
  DocScanResult,
  EvidenceItem,
  ReviewerBrief,
  StudentApplicationForm,
} from '../engine/types';
import { CaseSummary } from './provider';
import { collectAnomalies } from '../data/inspection';
import { normalizeText } from '../data/knowledge-base';

const REASON_CUES: Record<StudentApplicationForm['reason'], { types: string[]; words: string[] }> = {
  'Ốm đau/tai nạn điều trị dài': {
    types: ['medical_record'],
    words: ['vien', 'benh an', 'phau thuat', 'y te', 'dieu tri', 'tai nan'],
  },
  'Nghĩa vụ quân sự': {
    types: ['military_call'],
    words: ['quan su', 'nhap ngu', 'nghia vu'],
  },
  'Hoàn cảnh gia đình': {
    types: ['hardship_proof'],
    words: ['hoan canh', 'ubnd', 'xac nhan', 'gia dinh'],
  },
  'Lý do cá nhân khác': {
    types: ['personal_reason'],
    words: ['thuc tap', 'giao luu', 'trao doi', 'ca nhan'],
  },
};

function evidenceText(item: EvidenceItem): string {
  const fields = (item.fields ?? []).map((f) => `${f.label} ${f.value}`).join(' ');
  return normalizeText(`${item.type} ${item.name} ${item.content} ${item.issueNotes ?? ''} ${fields}`);
}

/** So khớp minh chứng với lý do xin nghỉ — thuần, không random. */
export function matchEvidenceToReason(
  reason: StudentApplicationForm['reason'],
  evidence: EvidenceItem[]
): { matches: boolean; matchedIds: string[] } {
  const cues = REASON_CUES[reason];
  if (!cues) return { matches: false, matchedIds: [] };

  const matchedIds = evidence
    .filter((item) => {
      const type = normalizeText(item.type);
      const text = evidenceText(item);
      return cues.types.includes(type) || cues.words.some((word) => text.includes(word));
    })
    .map((item) => item.id);

  return { matches: matchedIds.length > 0, matchedIds };
}

const NO_EVIDENCE_SCAN: DocScanResult = {
  evidenceType: 'Không có',
  typeMatchesReason: false,
  extracted: {},
  anomalies: [
    {
      field: 'evidence',
      issue: 'Sinh viên chưa đính kèm tài liệu minh chứng hợp lệ',
      severity: 'high',
    },
  ],
  confidence: 0.1,
};

/** Bản quét dự phòng khi kịch bản không có `aiScript` (ca tự nhập). */
export function buildFallbackDocScan(
  form: StudentApplicationForm,
  evidence: EvidenceItem[]
): DocScanResult {
  if (evidence.length === 0) return { ...NO_EVIDENCE_SCAN, anomalies: [...NO_EVIDENCE_SCAN.anomalies] };

  const first = evidence[0];
  const extracted: Record<string, string> = {};
  for (const item of evidence) {
    for (const field of item.fields ?? []) {
      if (!(field.id in extracted)) extracted[field.id] = field.value;
    }
  }
  extracted.documentName = first.name;

  const anomalies: DocScanResult['anomalies'] = [];
  for (const item of evidence) {
    for (const field of item.fields ?? []) {
      if (!field.anomaly) continue;
      anomalies.push({ field: field.id, issue: field.anomaly.issue, severity: field.anomaly.severity });
    }
    if (item.issueNotes) {
      const issue = item.issueNotes.trim();
      if (issue && !anomalies.some((a) => a.issue === issue)) {
        anomalies.push({ field: 'document', issue, severity: 'high' });
      }
    }
  }

  const ratio = matchEvidenceToReason(form.reason, evidence);
  let confidence = 0.95;
  for (const anomaly of anomalies) {
    if (anomaly.severity === 'high') confidence -= 0.2;
    else if (anomaly.severity === 'medium') confidence -= 0.1;
    else confidence -= 0.05;
  }
  if (!ratio.matches) confidence = Math.min(confidence, 0.4);
  confidence = Math.min(0.99, Math.max(0.2, Number(confidence.toFixed(2))));

  return {
    evidenceType: first.type,
    typeMatchesReason: ratio.matches,
    extracted,
    anomalies,
    confidence,
  };
}

const ADVISOR_NOTE = 'Đây chỉ là đề xuất, người duyệt quyết định.';

/** Brief dự phòng cho AI-3 khi kịch bản không khai `advisorBrief`/`ctsvBrief`. */
export function buildFallbackBrief(role: 'advisor' | 'ctsv', ctx: CaseSummary): ReviewerBrief {
  const form = ctx.form;
  const validity = ctx.validity;
  const ruleResult = ctx.ruleResult;
  const day = ctx.day ?? 0;
  const evidenceList = ctx.evidence ?? [];

  if (role === 'advisor') {
    const complete = validity?.complete !== false;
    const rulesPass = ruleResult?.pass !== false;
    const hasEvidence = evidenceList.length > 0;
    const ratio = matchEvidenceToReason(form.reason, evidenceList);
    const evidenceOk = hasEvidence && ratio.matches;

    let evidencePoint = 'Minh chứng: Chưa đính kèm tài liệu minh chứng';
    if (hasEvidence) {
      const names = evidenceList.map((e) => e.name).join(', ');
      evidencePoint = evidenceOk
        ? `Minh chứng: ${names} (Khớp với lý do xin nghỉ)`
        : `Minh chứng: ${names} (Chưa khớp với lý do "${form.reason}")`;
    }

    const points: string[] = [
      `Hồ sơ: ${complete ? 'Đầy đủ trường bắt buộc' : `Còn thiếu: ${(validity?.missing ?? []).join(', ')}`}`,
      evidencePoint,
      `Điều kiện R1–R4: ${rulesPass ? 'Đạt quy chế đào tạo' : (ruleResult?.violations ?? []).join('; ')}`,
      `Đã chờ ${day} ngày làm việc (SLA 3 ngày)`,
    ];

    const canConfirm = complete && evidenceOk && rulesPass;

    return {
      summary: `${form.fullName} (${form.mssv} · ${form.className}) xin nghỉ ${form.semesterCount} học kỳ vì lý do “${form.reason}”.`,
      points: points.slice(0, 4),
      suggestedDecision: canConfirm ? 'confirm' : 'decline',
      rationale: canConfirm
        ? `${ADVISOR_NOTE} Hồ sơ hợp lệ, Cố vấn có thể bấm xác nhận nguyện vọng.`
        : `${ADVISOR_NOTE} Hồ sơ chưa đủ minh chứng hoặc chưa đạt điều kiện, khuyến nghị Cố vấn kiểm tra kỹ trước khi bấm dấu.`,
    };
  }

  const fromScan = (ctx.aiScan?.anomalies ?? []).map((a) => a.issue);
  const fromFields = collectAnomalies(evidenceList).map((a) => a.issue);
  const issues: string[] = [];
  if (evidenceList.length === 0) {
    issues.push('Sinh viên chưa tải lên tệp tài liệu minh chứng hợp lệ');
  }
  for (const issue of [...fromScan, ...fromFields]) {
    if (!issues.includes(issue)) issues.push(issue);
  }

  const points =
    issues.length > 0
      ? issues.slice(0, 4)
      : [
          'Không phát hiện sai lệch trên các trường tài liệu đã đọc',
          `Minh chứng (${evidenceList.map((e) => e.name).join(', ') || 'Đã nộp'}) khớp với lý do xin nghỉ`,
          `Đã chờ ${day} ngày làm việc để thẩm định`,
        ];

  return {
    summary:
      issues.length > 0
        ? `Phát hiện ${issues.length} điểm cần chú ý trên hồ sơ của sinh viên ${form.fullName}.`
        : `Hồ sơ và minh chứng của sinh viên ${form.fullName} hợp lệ, không có nghi vấn.`,
    points: points.slice(0, 4),
    suggestedDecision: issues.length > 0 ? 'invalid' : 'valid',
    rationale: `${ADVISOR_NOTE} Chuyên viên CTSV kiểm tra đối chiếu trước khi kết luận.`,
  };
}

/** Văn bản dự phòng cho AI-4 (T2 trả hồ sơ, T7 từ chối, T8 căn cứ quyết định). */
export function buildFallbackDraft(
  kind: 'return' | 'reject' | 'decisionBasis',
  ctx: CaseSummary
): string {
  const form = ctx.form;
  const missing = ctx.validity?.missing ?? [];
  const violations = ctx.ruleResult?.violations ?? [];

  if (kind === 'return') {
    const parts: string[] = [];
    if (missing.length > 0) parts.push(`còn thiếu: ${missing.join('; ')}`);
    if (ctx.validity && ctx.validity.evidenceOk === false) parts.push('minh chứng chưa khớp lý do đã khai');
    if (parts.length === 0) parts.push('thông tin trên đơn chưa đầy đủ hoặc chưa hợp lệ');
    return `Hồ sơ của sinh viên ${form.fullName} (MSSV ${form.mssv}) chưa được tiếp nhận vì ${parts.join('; ')}. Vui lòng bổ sung giấy tờ và nộp lại; hệ thống sẽ kiểm tra ngay sau khi nhận.`;
  }

  if (kind === 'reject') {
    const reasons =
      violations.length > 0
        ? violations.join('; ')
        : `Cố vấn: ${ctx.advisorStatus ?? 'chưa xác nhận'}; CTSV: ${ctx.ctsvStatus ?? 'chưa thẩm định'}`;
    return `Hồ sơ của sinh viên ${form.fullName} (MSSV ${form.mssv}) chưa đủ điều kiện bảo lưu kết quả học tập vì ${reasons}. Bạn vui lòng liên hệ Phòng Công tác sinh viên để được hướng dẫn bước tiếp theo.`;
  }

  return `Căn cứ Quy chế đào tạo của Trường ĐH Kinh tế – ĐH Đà Nẵng; Căn cứ Đơn xin nghỉ học tạm thời của sinh viên ${form.fullName}, MSSV ${form.mssv}, xin nghỉ ${form.semesterCount} học kỳ bắt đầu từ ${form.startSemester}; Căn cứ kết quả thẩm định của Cố vấn học tập và Phòng Công tác sinh viên.`;
}
