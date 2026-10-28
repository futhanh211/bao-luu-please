import React from 'react';
import { Paper } from '../kit/Paper';

export const StudentDesk: React.FC = () => {
  return (
    <Paper minHeight={480} width="850px" rotation={-0.5}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: '24px', textTransform: 'uppercase' }}>
          Cổng Dịch Vụ Một Cửa — Bàn Sinh Viên
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
          Pool Sinh viên · Tiếp nhận đơn xin nghỉ học tạm thời & nộp minh chứng trực tuyến
        </p>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '17px', color: 'var(--ink-soft)' }}>
        <p><strong>Trạng thái hồ sơ:</strong> Đang chờ chuẩn bị đơn (Sẵn sàng trong Milestone M3).</p>
        <p>Sinh viên chuẩn bị đơn trực tuyến, đính kèm giấy tờ chứng minh lý do tạm dừng học tập và gửi qua Message Flow MF1 tới Nhà trường.</p>
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
        [ Khu vực tương tác nộp đơn, túi minh chứng & trợ lý AI sinh viên ]
      </div>
    </Paper>
  );
};
