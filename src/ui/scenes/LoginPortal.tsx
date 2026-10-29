import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, Role } from '../../store/useApp';
import { useAuthStore } from '../../store/useAuth';
import { usePlaybackStore } from '../../store/playback';
import { OFFICER_ACCOUNTS } from '../../data/accounts';
import { DemoStudentPreset } from '../../data/loginPresets';
import { StudentCustomLogin } from './login/StudentCustomLogin';
import { StudentPresetLogin } from './login/StudentPresetLogin';
import { OfficerLogin } from './login/OfficerLogin';
import { screenVariants } from '../motion';
import { sfx } from '../audio/sfx';

type PortalTab = 'student' | 'officer';
type StudentSubTab = 'custom' | 'preset';

export const LoginPortal: React.FC = () => {
  const setScreen = useAppStore((s) => s.setScreen);
  const setRole = useAppStore((s) => s.setRole);
  const scenarioId = useAppStore((s) => s.scenarioId);
  const setScenario = useAppStore((s) => s.setScenario);

  const loginAsStudent = useAuthStore((s) => s.loginAsStudent);
  const loginAsOfficer = useAuthStore((s) => s.loginAsOfficer);

  const [activeTab, setActiveTab] = useState<PortalTab>('student');
  const [studentSubTab, setStudentSubTab] = useState<StudentSubTab>('custom');
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

  const handlePresetSelect = (preset: DemoStudentPreset) => {
    loginAsStudent(preset.mssv, {
      name: preset.name,
      className: preset.className,
      faculty: preset.faculty,
      email: `${preset.mssv}@due.udn.vn`,
    });

    usePlaybackStore.getState().initStudentSession(
      {
        mssv: preset.mssv,
        name: preset.name,
        className: preset.className,
        faculty: preset.faculty,
      },
      preset.scenarioId
    );

    setRole('student');
    setScreen('desk');
  };

  const handleOfficerLogin = (username: string, targetRole?: Role) => {
    const ok = loginAsOfficer(username);
    if (ok) {
      const acc = OFFICER_ACCOUNTS.find((o) => o.username === username);
      const chosenRole = targetRole || acc?.targetRole || 'advisor';
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
      {/* Khung bìa hồ sơ công sở / Card Đăng nhập chuẩn */}
      <div
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          maxWidth: '480px',
          width: '100%',
          borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--paper-line)',
          boxShadow: 'var(--shadow-paper-lg)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header Cổng đăng nhập */}
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
              CỔNG ĐĂNG NHẬP XÁC THỰC
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

        {/* 2 Tab chính: CỔNG SINH VIÊN vs CỔNG CÁN BỘ / GV */}
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

        {/* Nội dung form */}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Phân định rõ ràng: Tự do đăng nhập vs Kịch bản mẫu Demo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px',
                  gap: '3px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStudentSubTab('custom');
                    setErrorMsg(null);
                    sfx.play('type');
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-paper)',
                    borderRadius: 'var(--radius-sm)',
                    border: studentSubTab === 'custom' ? '1px solid var(--desk-900)' : '1px solid transparent',
                    backgroundColor: studentSubTab === 'custom' ? 'var(--paper)' : 'transparent',
                    color: studentSubTab === 'custom' ? 'var(--ink)' : 'var(--ink-soft)',
                    cursor: 'var(--cursor-pointer)',
                    boxShadow: studentSubTab === 'custom' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>📝</span>
                  <span>Tự do đăng nhập</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentSubTab('preset');
                    setErrorMsg(null);
                    sfx.play('type');
                  }}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-paper)',
                    borderRadius: 'var(--radius-sm)',
                    border: studentSubTab === 'preset' ? '1px solid var(--amber)' : '1px solid transparent',
                    backgroundColor: studentSubTab === 'preset' ? 'var(--desk-900)' : 'transparent',
                    color: studentSubTab === 'preset' ? 'var(--amber)' : 'var(--ink-soft)',
                    cursor: 'var(--cursor-pointer)',
                    boxShadow: studentSubTab === 'preset' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🎯</span>
                  <span>5 Kịch bản mẫu (Demo)</span>
                </button>
              </div>

              {studentSubTab === 'custom' ? (
                <StudentCustomLogin
                  onLogin={handleCustomStudentLogin}
                  onError={(msg) => setErrorMsg(msg)}
                />
              ) : (
                <StudentPresetLogin
                  onSelectPreset={handlePresetSelect}
                />
              )}
            </div>
          ) : (
            <OfficerLogin
              onLogin={handleOfficerLogin}
              onError={(msg) => setErrorMsg(msg)}
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
      </div>
    </motion.div>
  );
};
