import React from 'react';
import { Paper } from '../kit/Paper';

export const AdvisorDesk: React.FC = () => {
  return (
    <Paper minHeight={480} width="850px" rotation={-0.6}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: '24px', textTransform: 'uppercase' }}>
          Bàn Làm Việc — Cố Vấn Học Tập
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
          Lane L2 · Thẩm tra nguyện vọng sinh viên và xác nhận bảo lưu (Task T4, SLA: 3 ngày)
        </p>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '17px', color: 'var(--ink-soft)' }}>
        <p><strong>Trạng thái bàn làm việc:</strong> Chưa có hồ sơ phân công (Sẵn sàng trong Milestone M4).</p>
        <p>Cố vấn xem xét tình hình học tập của sinh viên, xem đề xuất của AI và đóng dấu Xác nhận hoặc Không xác nhận.</p>
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '16px',
          border: '1px dashed var(--paper-line)',
          backgroundColor: 'var(--paper-dim)',
          fontSize: '14px',
          textAlign: 'center',
        }}
      >
        [ Tablet hồ sơ điện tử, tóm tắt AI và 2 con dấu XÁC NHẬN / KHÔNG XÁC NHẬN ]
      </div>
    </Paper>
  );
};
