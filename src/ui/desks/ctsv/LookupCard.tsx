import React from 'react';
import { StudentRecord } from '../../../engine/types';
import { Paper } from '../../kit/Paper';

/** Thẻ tra cứu DS2 — chỉ đọc, không bấm sửa được. */
export const LookupCard: React.FC<{ record: StudentRecord | null }> = ({ record }) => (
  <Paper className="ctsv-paper lookup-card" rotation={0.9}>
    <div className="lookup-head">
      <span className="lookup-badge">CHỈ ĐỌC</span>
      <span className="lookup-store">DS2 · QUẢN LÝ SINH VIÊN</span>
    </div>
    {!record && <p className="ctsv-muted">Không tìm thấy bản ghi trong CSDL.</p>}
    {record && (
      <div className="lookup-body">
        <div className="lookup-name">{record.name}</div>
        <div className="lookup-row">
          <span>MSSV</span>
          <strong>{record.mssv}</strong>
        </div>
        <div className="lookup-row">
          <span>Lớp</span>
          <strong>{record.className}</strong>
        </div>
        <div className="lookup-row">
          <span>Khoa</span>
          <strong>{record.faculty}</strong>
        </div>
        <div className="lookup-row">
          <span>Trạng thái</span>
          <strong>{record.status}</strong>
        </div>
      </div>
    )}
    <div className="lookup-foot">Tra cứu tự động tại T3 · không sửa được từ bàn CTSV</div>
  </Paper>
);
