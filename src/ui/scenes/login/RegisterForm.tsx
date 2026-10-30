import React, { useState } from 'react';
import { Role } from '../../../store/useApp';
import { registerStudentAccount, registerOfficerAccount, RegisteredStudent, RegisteredOfficer } from '../../../data/userRegistry';
import { sfx } from '../../audio/sfx';

interface Props {
  onRegisterSuccess: (account: RegisteredStudent | RegisteredOfficer) => void;
  onSwitchToLogin: () => void;
  onError: (msg: string) => void;
}

const DUE_FACULTIES = [
  'Khoa Công nghệ thông tin kinh doanh',
  'Khoa Quản trị kinh doanh',
  'Khoa Kế toán',
  'Khoa Tài chính - Ngân hàng',
  'Khoa Marketing',
  'Khoa Thương mại điện tử',
  'Khoa Kinh tế',
  'Khoa Luật',
  'Khoa Du lịch',
  'Khoa Thống kê - Tin học',
  'Khoa Kinh doanh quốc tế',
];

export const RegisterForm: React.FC<Props> = ({ onRegisterSuccess, onSwitchToLogin, onError }) => {
  const [accountType, setAccountType] = useState<'student' | 'officer'>('student');

  // Fields for Student
  const [mssv, setMssv] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('48K12.1');
  const [faculty, setFaculty] = useState(DUE_FACULTIES[0]);
  const [phone, setPhone] = useState('0905123456');
  const [email, setEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentConfirmPassword, setStudentConfirmPassword] = useState('');

  // Fields for Officer
  const [officerUsername, setOfficerUsername] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [targetRole, setTargetRole] = useState<Role>('advisor');
  const [officerTitle, setOfficerTitle] = useState('Cố vấn học tập');
  const [department, setDepartment] = useState('Khoa Công nghệ thông tin kinh doanh');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerConfirmPassword, setOfficerConfirmPassword] = useState('');

  const [registeredSuccessUser, setRegisteredSuccessUser] = useState<RegisteredStudent | RegisteredOfficer | null>(null);

  const handleMssvChange = (val: string) => {
    setMssv(val);
    if (!email || email.includes('@due.udn.vn')) {
      setEmail(val.trim() ? `${val.trim()}@due.udn.vn` : '');
    }
  };

  const handleTargetRoleChange = (role: Role) => {
    setTargetRole(role);
    if (role === 'advisor') {
      setOfficerTitle('Cố vấn học tập');
      setDepartment('Khoa Công nghệ thông tin kinh doanh');
    } else if (role === 'ctsv') {
      setOfficerTitle('Chuyên viên thẩm tra hồ sơ');
      setDepartment('Phòng Công tác sinh viên');
    } else if (role === 'principal') {
      setOfficerTitle('Phó Hiệu trưởng');
      setDepartment('Ban Giám hiệu nhà trường');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'student') {
      if (!mssv.trim()) {
        sfx.play('buzz');
        onError('Vui lòng nhập Mã số sinh viên (MSSV).');
        return;
      }
      if (!studentName.trim()) {
        sfx.play('buzz');
        onError('Vui lòng nhập Họ và tên sinh viên.');
        return;
      }
      if (studentPassword && studentPassword !== studentConfirmPassword) {
        sfx.play('buzz');
        onError('Mật khẩu và Xác nhận mật khẩu không trùng khớp!');
        return;
      }

      const res = registerStudentAccount({
        mssv: mssv.trim(),
        name: studentName.trim(),
        className: className.trim() || '48K12.1',
        faculty: faculty.trim(),
        phone: phone.trim() || '0905123456',
        email: email.trim() || `${mssv.trim()}@due.udn.vn`,
        password: studentPassword.trim(),
      });

      if (!res.success) {
        sfx.play('buzz');
        onError(res.message);
        return;
      }

      sfx.play('stamp');
      setRegisteredSuccessUser(res.account!);
    } else {
      if (!officerUsername.trim()) {
        sfx.play('buzz');
        onError('Vui lòng nhập Tên đăng nhập cán bộ.');
        return;
      }
      if (!officerName.trim()) {
        sfx.play('buzz');
        onError('Vui lòng nhập Họ và tên cán bộ.');
        return;
      }
      if (officerPassword && officerPassword !== officerConfirmPassword) {
        sfx.play('buzz');
        onError('Mật khẩu và Xác nhận mật khẩu không trùng khớp!');
        return;
      }

      const res = registerOfficerAccount({
        username: officerUsername.trim(),
        name: officerName.trim(),
        targetRole,
        title: officerTitle.trim(),
        department: department.trim(),
        password: officerPassword.trim(),
      });

      if (!res.success) {
        sfx.play('buzz');
        onError(res.message);
        return;
      }

      sfx.play('stamp');
      setRegisteredSuccessUser(res.account!);
    }
  };

  if (registeredSuccessUser) {
    const isStudent = registeredSuccessUser.type === 'student';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '16px 8px',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            border: '2px solid #16a34a',
            color: '#15803d',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          ✓ ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG!
        </div>

        <div style={{ fontSize: '28px' }}>
          {isStudent ? '🎓' : registeredSuccessUser.avatar}
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-paper)',
              fontSize: '18px',
              color: 'var(--ink)',
            }}
          >
            {registeredSuccessUser.name}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-soft)' }}>
            {isStudent
              ? `MSSV: ${(registeredSuccessUser as RegisteredStudent).mssv} · ${(registeredSuccessUser as RegisteredStudent).className}`
              : `${(registeredSuccessUser as RegisteredOfficer).title} · ${(registeredSuccessUser as RegisteredOfficer).department}`}
          </p>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: '1px dashed var(--paper-line)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--ink)',
            lineHeight: 1.5,
          }}
        >
          Dữ liệu tài khoản đã được lưu vĩnh viễn trên trình duyệt. Bạn có thể thoát web, tải lại trang hoặc mở lại bất kỳ lúc nào mà không bị mất.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => onRegisterSuccess(registeredSuccessUser)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--amber)',
              color: 'var(--desk-900)',
              border: '2px solid var(--desk-900)',
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
            <span>ĐĂNG NHẬP NGAY BẰNG TÀI KHOẢN NÀY</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--paper-line)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'var(--cursor-pointer)',
              fontFamily: 'var(--font-paper)',
            }}
          >
            ← Chuyển về màn hình Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
        Đăng ký tài khoản mới để tham gia nộp hồ sơ hoặc phê duyệt đơn trên hệ thống Một cửa số. Dữ liệu sẽ được lưu vĩnh viễn trên thiết bị của bạn.
      </div>

      {/* Chọn vai trò: Sinh viên vs Cán bộ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#dfd8c2',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--paper-line)',
          padding: '2px',
          gap: '3px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAccountType('student');
            sfx.play('type');
          }}
          style={{
            padding: '7px 8px',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-paper)',
            borderRadius: 'var(--radius-sm)',
            border: accountType === 'student' ? '1px solid var(--amber)' : '1px solid transparent',
            backgroundColor: accountType === 'student' ? 'var(--desk-900)' : 'transparent',
            color: accountType === 'student' ? 'var(--amber)' : 'var(--ink)',
            cursor: 'var(--cursor-pointer)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span>🎓</span>
          <span>Sinh viên (Nộp đơn)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType('officer');
            sfx.play('type');
          }}
          style={{
            padding: '7px 8px',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-paper)',
            borderRadius: 'var(--radius-sm)',
            border: accountType === 'officer' ? '1px solid var(--amber)' : '1px solid transparent',
            backgroundColor: accountType === 'officer' ? 'var(--desk-900)' : 'transparent',
            color: accountType === 'officer' ? 'var(--amber)' : 'var(--ink)',
            cursor: 'var(--cursor-pointer)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span>👨‍🏫</span>
          <span>Cán bộ / GV (Duyệt đơn)</span>
        </button>
      </div>

      {accountType === 'student' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                MÃ SỐ SINH VIÊN (MSSV) *:
              </label>
              <input
                type="text"
                value={mssv}
                onChange={(e) => handleMssvChange(e.target.value)}
                placeholder="VD: 3121102008..."
                required
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                HỌ VÀ TÊN SINH VIÊN *:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam..."
                required
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                LỚP SINH HOẠT:
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 48K12.1"
                style={{
                  width: '100%',
                  padding: '7px 9px',
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
                KHOA QUẢN LÝ:
              </label>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              >
                {DUE_FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                EMAIL TRƯỜNG:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: mssv@due.udn.vn"
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '12.5px',
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
                SỐ ĐIỆN THOẠI:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0905123456"
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '12.5px',
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                MẬT KHẨU:
              </label>
              <input
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={{
                  width: '100%',
                  padding: '7px 9px',
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
                XÁC NHẬN MẬT KHẨU:
              </label>
              <input
                type="password"
                value={studentConfirmPassword}
                onChange={(e) => setStudentConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                style={{
                  width: '100%',
                  padding: '7px 9px',
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
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                TÊN ĐĂNG NHẬP CÁN BỘ *:
              </label>
              <input
                type="text"
                value={officerUsername}
                onChange={(e) => setOfficerUsername(e.target.value.toLowerCase())}
                placeholder="VD: advisor_dung, ctsv_lan..."
                required
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                HỌ VÀ TÊN CÁN BỘ *:
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="VD: TS. Nguyễn Văn Dũng..."
                required
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-paper)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#dfd8c2',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              VAI TRÒ PHÊ DUYỆT HỒ SƠ:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleTargetRoleChange('advisor')}
                style={{
                  padding: '6px 4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-sm)',
                  border: targetRole === 'advisor' ? '1.5px solid var(--desk-900)' : '1px solid var(--paper-line)',
                  backgroundColor: targetRole === 'advisor' ? 'var(--paper)' : '#dfd8c2',
                  cursor: 'var(--cursor-pointer)',
                }}
              >
                👨‍🏫 Cố vấn (L2)
              </button>
              <button
                type="button"
                onClick={() => handleTargetRoleChange('ctsv')}
                style={{
                  padding: '6px 4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-sm)',
                  border: targetRole === 'ctsv' ? '1.5px solid var(--desk-900)' : '1px solid var(--paper-line)',
                  backgroundColor: targetRole === 'ctsv' ? 'var(--paper)' : '#dfd8c2',
                  cursor: 'var(--cursor-pointer)',
                }}
              >
                👩‍💼 CTSV (L3)
              </button>
              <button
                type="button"
                onClick={() => handleTargetRoleChange('principal')}
                style={{
                  padding: '6px 4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-sm)',
                  border: targetRole === 'principal' ? '1.5px solid var(--desk-900)' : '1px solid var(--paper-line)',
                  backgroundColor: targetRole === 'principal' ? 'var(--paper)' : '#dfd8c2',
                  cursor: 'var(--cursor-pointer)',
                }}
              >
                🏛️ BGH (L4)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                CHỨC DANH / HỌC HÀM:
              </label>
              <input
                type="text"
                value={officerTitle}
                onChange={(e) => setOfficerTitle(e.target.value)}
                placeholder="VD: Cố vấn học tập"
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '12.5px',
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
                ĐƠN VỊ / KHOA / PHÒNG:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="VD: Khoa CNTT Kinh doanh"
                style={{
                  width: '100%',
                  padding: '7px 9px',
                  fontSize: '12.5px',
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                MẬT KHẨU:
              </label>
              <input
                type="password"
                value={officerPassword}
                onChange={(e) => setOfficerPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={{
                  width: '100%',
                  padding: '7px 9px',
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
                XÁC NHẬN MẬT KHẨU:
              </label>
              <input
                type="password"
                value={officerConfirmPassword}
                onChange={(e) => setOfficerConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                style={{
                  width: '100%',
                  padding: '7px 9px',
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
        </>
      )}

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
        <span>📝</span>
        <span>XÁC NHẬN ĐĂNG KÝ TÀI KHOẢN</span>
      </button>

      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px' }}>
        <span style={{ color: 'var(--ink-soft)' }}>Đã có tài khoản trên hệ thống? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
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
          Đăng nhập ngay
        </button>
      </div>
    </form>
  );
};
