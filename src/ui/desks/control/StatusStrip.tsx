import React from 'react';
import { ControlData } from './useControlData';

export const StatusStrip: React.FC<{
  scenario: ControlData['scenario'];
  day: number;
  activeNodeId: string | null;
  activeNodeLabel: string;
  caseEnded: boolean;
  endOutcome: string | null;
}> = ({ scenario, day, activeNodeId, activeNodeLabel, caseEnded, endOutcome }) => {
  return (
    <div className="control-status">
      <span>
        CA: <strong>{scenario?.code ?? '—'}</strong>
      </span>
      <span>{scenario?.title ?? 'Chưa chọn kịch bản'}</span>
      <span>
        NODE: <strong>{activeNodeId ?? '—'}</strong> {activeNodeLabel}
      </span>
      <span>
        NGÀY: <strong>{day}</strong>
      </span>
      {caseEnded && (
        <span style={{ color: 'var(--crt-fg)' }}>
          KẾT THÚC: <strong>{endOutcome ?? '—'}</strong>
        </span>
      )}
      <span className="control-sim" title="Dữ liệu sinh viên là giả lập">
        DỮ LIỆU GIẢ LẬP
      </span>
    </div>
  );
};
