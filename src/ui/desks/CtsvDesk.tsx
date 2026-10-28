import React from 'react';
import { Paper } from '../kit/Paper';

export const CtsvDesk: React.FC = () => {
  return (
    <Paper minHeight={480} width="850px" rotation={0.3}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: '24px', textTransform: 'uppercase' }}>
          Bàn Thẩm Tra — Phòng Công Tác Sinh Viên
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
          Lane L3 · Đối chiếu minh chứng, soi sai lệch giấy tờ (Task T5)
        </p>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '17px', color: 'var(--ink-soft)' }}>
        <p><strong>Trạng thái bàn làm việc:</strong> Chưa có hồ sơ phân công (Sẵn sàng trong Milestone M4).</p>
        <p>Chuyên viên CTSV kiểm tra tính xác thực của các giấy tờ viện chứng cứ bệnh tật, quân dịch hay hoàn cảnh gia đình.</p>
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
        [ Bàn soi lệch hồ sơ Paper-Please, kính lúp, ghi nhận Người ≠ AI & con dấu HỢP LỆ / KHÔNG HỢP LỆ ]
      </div>
    </Paper>
  );
};
