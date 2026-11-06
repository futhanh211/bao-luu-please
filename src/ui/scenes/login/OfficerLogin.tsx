import React, { useState } from 'react';
import { Role } from '../../../store/useApp';
import { useAuthStore } from '../../../store/useAuth';
import { OFFICER_ACCOUNTS } from '../../../data/accounts';
import { sfx } from '../../audio/sfx';

interface Props {
  onLogin: (username: string, targetRole?: Role) => void;
  onError: (msg: string) => void;
  onSwitchToRegister?: () => void;
}

export const OfficerLogin: React.FC<Props> = ({ onLogin, onError, onSwitchToRegister }) => {
  // Mặc định hoàn toàn trống, bắt buộc tự nhập như cổng sinh viên
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const verifyOfficerLogin = useAuthStore((s) => s.verifyOfficerLogin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      sfx.play('buzz');
      onError('Vui lòng nhập Tên đăng nhập cán bộ / giảng viên.');
      return;
    }

    const result = verifyOfficerLogin(trimmed, password);
    if (!result.success) {
      sfx.play('buzz');
      onError(result.message);
      return;
    }

    sfx.play('stamp');
    const chosenRole = result.user?.targetRole || 'advisor';
    onLogin(trimmed, chosenRole);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
        Dành cho Cố vấn học tập (L2), Phòng CTSV (L3) và Ban Giám hiệu (L4) tiếp nhận, thẩm tra và ký số quyết định.
      </div>

      {/* Chọn nhanh tài khoản cán bộ mẫu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--amber)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Chọn nhanh tài khoản mẫu:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {OFFICER_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => {
                sfx.play('stamp');
                setUsername(acc.username);
                setPassword('');
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                border: username === acc.username ? '1.5px solid var(--amber)' : '1px solid var(--paper-line)',
                backgroundColor: username === acc.username ? 'var(--desk-900)' : 'var(--paper-dim)',
                color: username === acc.username ? 'var(--amber)' : 'var(--ink)',
                fontSize: '11.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.15s ease',
              }}
              title={`${acc.name} (${acc.title})`}
            >
              <span style={{ fontSize: '14px' }}>{acc.avatar}</span>
              <span>{acc.username}</span>
              <span style={{ fontSize: '9.5px', opacity: 0.8, fontWeight: 'normal' }}>
                {acc.targetRole === 'advisor' ? 'Cố vấn' : acc.targetRole === 'ctsv' ? 'CTSV' : 'BGH'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
          TÊN ĐĂNG NHẬP / MÃ CÁN BỘ (GV):
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên đăng nhập..."
          autoFocus
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-paper)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#dfd8c2',
            color: 'var(--ink)',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
          MẬT KHẨU CỔNG MỘT CỬA:
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu..."
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-paper)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#dfd8c2',
            color: 'var(--ink)',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          marginTop: '6px',
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

      {onSwitchToRegister && (
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px' }}>
          <span style={{ color: 'var(--ink-soft)' }}>Chưa có tài khoản cán bộ / giảng viên? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#b45309',
              fontWeight: 'bold',
              cursor: 'var(--cursor-pointer)',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Đăng ký tài khoản ngay
          </button>
        </div>
      )}
    </form>
  );
};
