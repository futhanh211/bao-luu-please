import React from 'react';
import { EvidenceItem } from '../../../engine/types';
import { fieldMarkKey } from '../../../data/inspection';
import { Paper } from '../../kit/Paper';

interface EvidencePaperProps {
  evidence: EvidenceItem;
  marks: string[];
  onToggle: (key: string) => void;
  onZoom?: () => void;
  locked?: boolean;
  large?: boolean;
}

/**
 * Tờ minh chứng đính kèm: từng trường dữ liệu là một vùng bấm để khoanh đỏ nghi vấn.
 */
export const EvidencePaper: React.FC<EvidencePaperProps> = ({
  evidence,
  marks,
  onToggle,
  onZoom,
  locked = false,
  large = false,
}) => {
  const fields = evidence.fields ?? [];

  return (
    <Paper
      className={`ctsv-paper evidence-paper ${large ? 'evidence-paper-large' : ''}`}
      rotation={large ? 0 : 0.5}
    >
      <div className="ctsv-doc-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ctsv-doc-kicker">MINH CHỨNG ĐÍNH KÈM</div>
        </div>
        <h3 className="ctsv-doc-title">{evidence.name}</h3>
        <div className="ctsv-doc-kicker">{evidence.content}</div>
      </div>

      {fields.length === 0 && <p className="ctsv-muted">Tờ này không có trường dữ liệu đọc được.</p>}

      <div className="evidence-fields">
        {fields.map((field) => {
          const key = fieldMarkKey(evidence.id, field.id);
          const marked = marks.includes(key);

          return (
            <button
              key={field.id}
              type="button"
              className="evidence-field"
              data-marked={marked ? 'true' : 'false'}
              aria-pressed={marked}
              disabled={locked}
              onClick={() => onToggle(key)}
            >
              <span className="evidence-field-label">{field.label}</span>
              <span className="evidence-field-value">{field.value}</span>
              {marked && <span className="evidence-mark" aria-label="Đã đánh dấu nghi vấn" />}
            </button>
          );
        })}
      </div>

      <div className="evidence-paper-foot">
        <span>Bấm vào một trường để khoanh đỏ · bấm lại để bỏ</span>
        {onZoom && (
          <button type="button" className="desk-btn desk-btn-small" onClick={onZoom}>
            🔍 Phóng to
          </button>
        )}
      </div>
    </Paper>
  );
};
