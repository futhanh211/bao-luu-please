import React from 'react';
import { Paper } from '../kit/Paper';

export const ControlRoom: React.FC = () => {
  return (
    <Paper minHeight={480} width="850px" rotation={0.4}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: '24px', textTransform: 'uppercase' }}>
          Phòng Điều Phối Tự Động — Hệ Thống
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
          Lane L1 · Điều phối luồng BPMN, kiểm tra Business Rules, cập nhật CSDL DS1/DS2
        </p>
      </div>

      <div style={{ lineHeight: 1.8, fontSize: '17px', color: 'var(--ink-soft)' }}>
        <p><strong>Trạng thái hệ thống:</strong> Động cơ BPMN sẵn sàng (Sẵn sàng trong Milestone M5).</p>
        <p>Hệ thống tự động thực thi các Service Task (T1, T8, T10), Send Task (T2, T7, T11) và Business Rule Task (T3: R1–R4).</p>
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '24px',
          backgroundColor: 'var(--crt-bg)',
          color: 'var(--crt-fg)',
          fontFamily: 'var(--font-hud)',
          fontSize: '20px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--crt-dim)',
        }}
      >
        <div>&gt; SYSTEM CORE INITIALIZED</div>
        <div>&gt; WAITING FOR PROCESS TOKEN DISPATCH...</div>
        <div>&gt; DS1 (ACADEMIC_FINANCE): READY</div>
        <div>&gt; DS2 (STUDENTS): READY</div>
      </div>
    </Paper>
  );
};
