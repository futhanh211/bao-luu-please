import React, { useState } from 'react';
import { INITIAL_STUDENTS } from '../../../data/students.db';
import { sfx } from '../../audio/sfx';

interface Props {
  onLogin: (student: { mssv: string; name: string; className: string; faculty: string }) => void;
  onError: (msg: string) => void;
}

export const StudentCustomLogin: React.FC<Props> = ({ onLogin, onError }) => {
  const [mssv, setMssv] = useState<string>('3121102001');
  const [name, setName] = useState<string>('Nguyễn Minh Khoa');
  const [className, setClassName] = useState<string>('47K12.1');
  const [faculty, setFaculty] = useState<string>('Khoa Công nghệ thông tin kinh doanh');
  const [customDetailsOpen, setCustomDetailsOpen] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('••••••••');

  const handleMssvChange = (val: string) => {
    setMssv(val);
    const trimmed = val.trim();
    const found = INITIAL_STUDENTS.find((s) => s.mssv === trimmed);
    if (found) {
      setName(found.name);
      setClassName(found.className);
      setFaculty(found.faculty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mssv.trim();
    if (!trimmed) {
      onError('Vui lòng nhập Mã số sinh viên (MSSV).');
      return;
    }
    sfx.play('stamp');
    onLogin({
      mssv: trimmed,
      name: name.trim() || `Sinh viên ${trimmed}`,
      className: className.trim() || '47K12.1',
      faculty: faculty.trim() || 'Khoa Công nghệ thông tin kinh doanh',
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
          placeholder="Nhập MSSV bất kỳ (VD: 3121102001 hoặc mã của bạn)..."
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

      {/* Thẻ nhận diện sinh viên & Nút tùy chỉnh */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          border: '1px dashed var(--paper-line)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong>{name}</strong> · {className} ({faculty})
        </div>
        <button
          type="button"
          onClick={() => setCustomDetailsOpen(!customDetailsOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-soft)',
            cursor: 'var(--cursor-pointer)',
            fontSize: '11.5px',
            textDecoration: 'underline',
            flexShrink: 0,
          }}
        >
          {customDetailsOpen ? '▲ Ẩn chi tiết' : '✏️ Nhập SV khác'}
        </button>
      </div>

      {customDetailsOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid var(--paper-line)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              HỌ VÀ TÊN SINH VIÊN:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên..."
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '13px',
                fontFamily: 'var(--font-paper)',
                border: '1px solid var(--paper-line)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#dfd8c2',
                color: 'var(--ink)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                LỚP:
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 47K12.1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                KHOA:
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="VD: Khoa CNTT Kinh doanh"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}

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
    </form>
  );
};
