import React from 'react';
import {
  EvidenceItem,
  RuleResultState,
  StudentApplicationForm,
  ValidityState,
} from '../../../engine/types';

interface AdvisorFileProps {
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  ruleResult: RuleResultState;
  ruleEvaluated: boolean;
  validity: ValidityState;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
);

/** Hồ sơ điện tử trên tablet của Cố vấn (Lane L2). */
export const AdvisorFile: React.FC<AdvisorFileProps> = ({
  form,
  evidence,
  ruleResult,
  ruleEvaluated,
  validity,
}) => {
  return (
    <div className="advisor-file">
      <div className="advisor-file-head">
        <div>
          <div className="advisor-file-kicker">Hồ sơ điện tử · T4</div>
          <h2 className="advisor-file-name">{form.fullName}</h2>
          <div className="advisor-file-meta">
            {form.mssv} · Lớp {form.className} · {form.faculty}
          </div>
        </div>
        <div className="tablet-badge">TABLET · L2</div>
      </div>

      <div className="info-grid">
        <InfoRow label="Lý do nghỉ" value={form.reason} />
        <InfoRow label="Số học kỳ" value={`${form.semesterCount} học kỳ`} />
        <InfoRow label="Bắt đầu từ" value={form.startSemester} />
        <InfoRow label="Liên hệ" value={`${form.phone} · ${form.email}`} />
      </div>

      <div className="advisor-section">
        <div className="advisor-section-title">Minh chứng đã đính kèm</div>
        {evidence.length === 0 && <p className="advisor-muted">Không có minh chứng nào.</p>}
        <ul className="advisor-evidence">
          {evidence.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="advisor-section">
        <div className="advisor-section-title">Kết quả đối chiếu tự động (T3)</div>
        {!ruleEvaluated && (
          <p className="advisor-muted">Hệ thống đang đối chiếu CSDL tài chính và điều kiện đào tạo…</p>
        )}
        {ruleEvaluated && ruleResult.pass && (
          <p className="rule-pass">✓ Đạt điều kiện bảo lưu theo quy chế.</p>
        )}
        {ruleEvaluated && !ruleResult.pass && (
          <ul className="rule-fail">
            {ruleResult.violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        )}
        <div className="advisor-muted">
          Hồ sơ {validity.complete ? 'đầy đủ trường bắt buộc' : 'còn thiếu trường bắt buộc'} ·{' '}
          {validity.evidenceOk ? 'minh chứng đúng loại' : 'minh chứng chưa đạt'}.
        </div>
      </div>
    </div>
  );
};
