import React from 'react';
import { CtsvResult } from '../../../data/inspection';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';

export type { CtsvResult } from '../../../data/inspection';

const VERDICT: Record<CtsvResult['outcome'], { label: string; color: 'green' | 'red' }> = {
  valid: { label: 'HỢP LỆ', color: 'green' },
  invalid: { label: 'KHÔNG HỢP LỆ', color: 'red' },
};

/** Phản hồi sau khi đóng dấu: điểm soi chỉ để vui, quyết định ca do con dấu. */
export const InspectionResult: React.FC<{ result: CtsvResult }> = ({ result }) => {
  const verdict = VERDICT[result.outcome];
  const { caught, total, falseMarks } = result.score;

  return (
    <Paper className="ctsv-result" rotation={-0.3}>
      <div className="ctsv-result-head">
        <div>
          <h2 className="desk-title">Kết quả thẩm tra</h2>
          <p className="desk-sub">Hồ sơ đã được đóng dấu; kết quả ca đã được ghi nhận.</p>
        </div>
        <Stamp label={verdict.label} color={verdict.color} seed={`T5-${result.outcome}`} size="lg" />
      </div>

      <div className="ctsv-score">
        {total === 0 ? (
          'Hồ sơ này không có điểm bất thường nào để soi.'
        ) : (
          <>
            Bạn bắt được <strong>{caught}/{total}</strong> điểm bất thường.
          </>
        )}
      </div>
      {falseMarks > 0 && (
        <div className="ctsv-warn">
          Có {falseMarks} trường bạn khoanh nhưng không phải bất thường — lần sau soi kỹ hơn nhé.
        </div>
      )}

      {result.anomalies.length > 0 && (
        <ul className="ctsv-anomaly-list">
          {result.anomalies.map((a) => {
            const found = result.markedKeys.includes(a.key);
            return (
              <li key={a.key} data-found={found ? 'true' : 'false'}>
                <span>{found ? '✓' : '○'}</span>
                <span>
                  <strong>{a.label}:</strong> {a.issue}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="ctsv-result-foot">
        Điểm soi không thay đổi kết quả ca — con dấu của người xử lý mới là quyết định.
      </div>
    </Paper>
  );
};
