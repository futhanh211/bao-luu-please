import React from 'react';
import { Paper } from '../kit/Paper';

export const PrincipalDesk: React.FC = () => {
  return (
    <Paper minHeight={480} width="850px" rotation={-0.2}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: '24px', textTransform: 'uppercase' }}>
          Bàn Phê Duyệt — Ban Giám Hiệu
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
          Lane L4 · Xem dự thảo quyết định tự động và ký số (Task T9)
        </p>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '17px', color: 'var(--ink-soft)' }}>
        <p><strong>Trạng thái bàn làm việc:</strong> Chưa có hồ sơ trình ký (Sẵn sàng trong Milestone M4).</p>
        <p>Hiệu trưởng / Phó Hiệu trưởng kiểm tra các trường tự động tô vàng trên văn bản dự thảo và thực hiện ký số điện tử.</p>
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
        [ Dự thảo quyết định, cắm USB token, vẽ nét chữ ký & đóng dấu mộc đỏ ]
      </div>
    </Paper>
  );
};
