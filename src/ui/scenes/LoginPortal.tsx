import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, Role } from '../../store/useApp';
import { useAuthStore } from '../../store/useAuth';
import { usePlaybackStore } from '../../store/playback';
import { OFFICER_ACCOUNTS } from '../../data/accounts';
import { findRegisteredOfficer, RegisteredStudent, RegisteredOfficer } from '../../data/userRegistry';
import { StudentCustomLogin } from './login/StudentCustomLogin';
import { OfficerLogin } from './login/OfficerLogin';
import { RegisterForm } from './login/RegisterForm';
import { screenVariants } from '../motion';
import { sfx } from '../audio/sfx';

type PortalMode = 'login' | 'register';
type PortalTab = 'student' | 'officer';

interface Props {
  initialMode?: PortalMode;
}

export const LoginPortal: React.FC<Props> = ({ initialMode = 'login' }) => {
  const setScreen = useAppStore((s) => s.setScreen);
  const setRole = useAppStore((s) => s.setRole);
  const scenarioId = useAppStore((s) => s.scenarioId);
  const setScenario = useAppStore((s) => s.setScenario);

  const loginAsStudent = useAuthStore((s) => s.loginAsStudent);
  const loginAsOfficer = useAuthStore((s) => s.loginAsOfficer);

  const [portalMode, setPortalMode] = useState<PortalMode>(initialMode);
  const [activeTab, setActiveTab] = useState<PortalTab>('student');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCustomStudentLogin = (student: { mssv: string; name: string; className: string; faculty: string }) => {
    loginAsStudent(student.mssv, {
      name: student.name,
      className: student.className,
      faculty: student.faculty,
      email: `${student.mssv}@due.udn.vn`,
    });

    usePlaybackStore.getState().initStudentSession(student, undefined);
    setRole('student');
    setScreen('desk');
  };

  const handleOfficerLogin = (username: string, targetRole?: Role) => {
    const ok = loginAsOfficer(username);
    if (ok) {
      const regOfficer = findRegisteredOfficer(username);
      const acc = OFFICER_ACCOUNTS.find((o) => o.username === username);
      const chosenRole = targetRole || regOfficer?.targetRole || acc?.targetRole || 'advisor';
      setRole(chosenRole);
      if (!scenarioId) {
        setScenario('s1');
      }
      setScreen('desk');
    } else {
      sfx.play('buzz');
      setErrorMsg(`Tài khoản cán bộ "${username}" không tồn tại.`);
    }
  };

  const handleRegisterSuccess = (account: RegisteredStudent | RegisteredOfficer) => {
    if (account.type === 'student') {
      handleCustomStudentLogin({
        mssv: account.mssv,
        name: account.name,
        className: account.className,
        faculty: account.faculty,
      });
    } else {
      handleOfficerLogin(account.username, account.targetRole);
    }
  };

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        color: 'var(--ink)',
      }}
    >
      {/* Khung bìa hồ sơ công sở / Card Xác thực chuẩn */}
      <div
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          maxWidth: '520px',
          width: '100%',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--paper-line)',
          boxShadow: 'var(--shadow-paper-lg)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header Cổng xác thực */}
        <div
          style={{
            backgroundColor: 'var(--desk-900)',
            color: 'var(--paper)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--amber)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--amber)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-paper)',
              }}
            >
              TRƯỜNG ĐH KINH TẾ – ĐH ĐÀ NẴNG
            </div>
            <h2
              style={{
                margin: '2px 0 0 0',
                fontSize: '17px',
                fontFamily: 'var(--font-paper)',
                color: 'var(--paper)',
                letterSpacing: '0.5px',
              }}
            >
              {portalMode === 'login' ? 'CỔNG ĐĂNG NHẬP PHÂN VAI' : 'CỔNG ĐĂNG KÝ TÀI KHOẢN MỚI'}
            </h2>
          </div>

          <div
            style={{
              fontSize: '10.5px',
              border: '1px solid var(--amber)',
              color: 'var(--amber)',
              padding: '2px 8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            HỆ THỐNG MỘT CỬA SỐ
          </div>
        </div>

        {portalMode === 'login' ? (
          <>
            {/* 2 Tab phân vai: CỔNG SINH VIÊN vs CỔNG CÁN BỘ / GV */}
            <div style={{ padding: '16px 20px 0 20px' }}>
              <div
                role="tablist"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  backgroundColor: '#dfd8c2',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--paper-line)',
                  padding: '3px',
                  gap: '4px',
                }}
              >
                <button
                  role="tab"
                  aria-selected={activeTab === 'student'}
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setErrorMsg(null);
                    sfx.play('type');
                  }}
                  style={{
                    padding: '8px 10px',
                    border: activeTab === 'student' ? '1px solid var(--amber)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'var(--cursor-pointer)',
                    fontFamily: 'var(--font-paper)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    backgroundColor: activeTab === 'student' ? 'var(--desk-900)' : 'transparent',
                    color: activeTab === 'student' ? 'var(--amber)' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🎓</span>
                  <span>CỔNG SINH VIÊN</span>
                </button>

                <button
                  role="tab"
                  aria-selected={activeTab === 'officer'}
                  type="button"
                  onClick={() => {
                    setActiveTab('officer');
                    setErrorMsg(null);
                    sfx.play('type');
                  }}
                  style={{
                    padding: '8px 10px',
                    border: activeTab === 'officer' ? '1px solid var(--amber)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'var(--cursor-pointer)',
                    fontFamily: 'var(--font-paper)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    backgroundColor: activeTab === 'officer' ? 'var(--desk-900)' : 'transparent',
                    color: activeTab === 'officer' ? 'var(--amber)' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>👨‍🏫</span>
                  <span>CỔNG CÁN BỘ / GV</span>
                </button>
              </div>
            </div>

            {/* Nội dung form đăng nhập */}
            <div style={{ padding: '16px 20px 20px 20px' }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(179, 38, 30, 0.12)',
                    color: 'var(--stamp-red)',
                    border: '1px solid var(--stamp-red)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'student' ? (
                <StudentCustomLogin
                  onLogin={handleCustomStudentLogin}
                  onError={(msg) => setErrorMsg(msg)}
                  onSwitchToRegister={() => {
                    setPortalMode('register');
                    setErrorMsg(null);
                  }}
                />
              ) : (
                <OfficerLogin
                  onLogin={handleOfficerLogin}
                  onError={(msg) => setErrorMsg(msg)}
                  onSwitchToRegister={() => {
                    setPortalMode('register');
                    setErrorMsg(null);
                  }}
                />
              )}

              {/* Nút quay lại trang Title */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.play('paper');
                    setScreen('title');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    fontSize: '13px',
                    cursor: 'var(--cursor-pointer)',
                    textDecoration: 'underline',
                    fontFamily: 'var(--font-paper)',
                  }}
                >
                  ← Quay lại trang giới thiệu
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Nội dung form Đăng ký */
          <div style={{ padding: '16px 20px 20px 20px' }}>
            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(179, 38, 30, 0.12)',
                  color: 'var(--stamp-red)',
                  border: '1px solid var(--stamp-red)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <RegisterForm
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => {
                setPortalMode('login');
                setErrorMsg(null);
              }}
              onError={(msg) => setErrorMsg(msg)}
            />

            {/* Nút quay lại trang Title */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  sfx.play('paper');
                  setScreen('title');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  fontSize: '13px',
                  cursor: 'var(--cursor-pointer)',
                  textDecoration: 'underline',
                  fontFamily: 'var(--font-paper)',
                }}
              >
                ← Quay lại trang giới thiệu
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
