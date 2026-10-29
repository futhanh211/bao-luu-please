import React, { useState } from 'react';
import { OFFICER_CARD_SPECS, OfficerCardSpec } from '../../../data/loginPresets';
import { Role } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface Props {
  onLogin: (username: string, targetRole?: Role) => void;
  onError: (msg: string) => void;
}

export const OfficerLogin: React.FC<Props> = ({ onLogin, onError }) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('advisor_nam');
  const [password, setPassword] = useState<string>('••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) {
      onError('Vui lòng chọn tài khoản cán bộ.');
      return;
    }
    sfx.play('stamp');
    const spec = OFFICER_CARD_SPECS.find((o) => o.username === selectedUsername);
    onLogin(selectedUsername, spec?.targetRole);
  };

  const handleQuickSelect = (spec: OfficerCardSpec) => {
    setSelectedUsername(spec.username);
    sfx.play('stamp');
    onLogin(spec.username, spec.targetRole);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
        Dành cho Cố vấn học tập (L2), Phòng CTSV (L3) và Ban Giám hiệu (L4) tiếp nhận, thẩm tra và ký số quyết định.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--ink)' }}>
          CHỌN CÁN BỘ / GIẢNG VIÊN DUYỆT ĐƠN:
        </label>

        {OFFICER_CARD_SPECS.map((spec) => {
          const isSelected = selectedUsername === spec.username;

          return (
            <div
              key={spec.username}
              onClick={() => handleQuickSelect(spec)}
              style={{
                padding: '10px 12px',
                backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                border: isSelected ? '1.5px solid var(--amber)' : '1px solid var(--paper-line)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-pointer)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--amber)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--paper-line)';
              }}
            >
              <div style={{ fontSize: '24px', flexShrink: 0 }}>{spec.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--ink)' }}>
                    {spec.name}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '2px', backgroundColor: 'var(--desk-900)', color: 'var(--amber)' }}>
                    {spec.laneCode}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  {spec.title} · {spec.department}
                </div>
                <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 500 }}>
                  {spec.bpmnSteps}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '4px' }}>
        <input type="hidden" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '11px',
            backgroundColor: 'var(--desk-900)',
            color: 'var(--amber)',
            border: '2px solid var(--amber)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'bold',
            fontSize: '14.5px',
            cursor: 'var(--cursor-pointer)',
            fontFamily: 'var(--font-paper)',
            letterSpacing: '0.5px',
            boxShadow: 'var(--shadow-hard)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>▶</span>
          <span>ĐĂNG NHẬP VÀO BÀN DUYỆT ĐƠN</span>
        </button>
      </form>
    </div>
  );
};
