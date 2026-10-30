import React, { useState, useEffect } from 'react';
import { INITIAL_STUDENTS } from '../../../data/students.db';
import { findRegisteredStudent } from '../../../data/userRegistry';
import { useAuthStore } from '../../../store/useAuth';
import { sfx } from '../../audio/sfx';

interface Props {
  onLogin: (student: { mssv: string; name: string; className: string; faculty: string }) => void;
  onError: (msg: string) => void;
  onSwitchToRegister?: () => void;
}

export const StudentCustomLogin: React.FC<Props> = ({
  onLogin,
  onError,
  onSwitchToRegister,
}) => {
  // Mặc định hoàn toàn trống, bắt buộc người dùng tự nhập
  const [mssv, setMssv] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [faculty, setFaculty] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const verifyStudentLogin = useAuthStore((s) => s.verifyStudentLogin);

  const populateFromMssv = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setName('');
      setClassName('');
      setFaculty('');
      return;
    }

    const reg = findRegisteredStudent(trimmed);
    if (reg) {
      setName(reg.name);
      setClassName(reg.className);
      setFaculty(reg.faculty);
      return;
    }

    const demo = INITIAL_STUDENTS.find((s) => s.mssv === trimmed);
    if (demo) {
      setName(demo.name);
      setClassName(demo.className);
      setFaculty(demo.faculty);
      return;
    }

    setName('');
    setClassName('');
    setFaculty('');
  };

  useEffect(() => {
    populateFromMssv(mssv);
  }, [mssv]);

  const handleMssvChange = (val: string) => {
    setMssv(val);
    populateFromMssv(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mssv.trim();
    if (!trimmed) {
      sfx.play('buzz');
      onError('Vui lòng nhập Mã số sinh viên (MSSV).');
      return;
    }

    // Xác thực tài khoản qua store
    const result = verifyStudentLogin(trimmed, password);
    if (!result.success) {
      sfx.play('buzz');
      onError(result.message);
      return;
    }

    sfx.play('stamp');
    const finalName = name.trim() || result.user?.name || `Sinh viên ${trimmed}`;
    const finalClass = className.trim() || (result.user as any)?.className || '48K12.1';
    const finalFaculty = faculty.trim() || (result.user as any)?.faculty || 'Khoa Công nghệ thông tin kinh doanh';

    onLogin({
      mssv: trimmed,
      name: finalName,
      className: finalClass,
      faculty: finalFaculty,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
        Cổng thông tin Một cửa số dành cho người học nộp và theo dõi đơn xin nghỉ học tạm thời / bảo lưu kết quả học tập.
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
          MÃ SỐ SINH VIÊN (MSSV):
        </label>
        <input
          type="text"
          value={mssv}
          onChange={(e) => handleMssvChange(e.target.value)}
          placeholder="Nhập Mã số sinh viên của bạn..."
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
        <span>ĐĂNG NHẬP VÀO BÀN SINH VIÊN</span>
      </button>

      {onSwitchToRegister && (
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px' }}>
          <span style={{ color: 'var(--ink-soft)' }}>Chưa có tài khoản sinh viên? </span>
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
