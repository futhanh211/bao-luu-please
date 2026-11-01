import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useApp';
import { useAuthStore } from '../../store/useAuth';
import { screenVariants } from '../motion';

export const Title: React.FC = () => {
  const setScreen = useAppStore((s) => s.setScreen);
  const setSessionMode = useAppStore((s) => s.setSessionMode);
  const toggleAsIs = useAppStore((s) => s.toggleAsIs);
  const logout = useAuthStore((s) => s.logout);

  const [bootLines, setBootLines] = useState<string[]>([]);
  const fullLines = [
    'INIT DUE_PROCESS_AUTOMATION_OS v2.0-TO-BE...',
    'CONNECTING TO CENTRAL DATABASE [DS1: ACADEMIC_FINANCE] ... ONLINE',
    'CONNECTING TO STUDENT REGISTRY [DS2: STUDENTS_DB] ... ONLINE',
    'BPMN 2.0 WORKFLOW ENGINE COMPILED (11 TASKS, 4 GATEWAYS, 1 TIMER)... READY',
    'AI CO-PILOT SUBSYSTEM: INITIALIZED [MOCK MODE]',
    'ALL SYSTEMS OPERATIONAL. READY FOR SHIFT.',
  ];

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < fullLines.length) {
        setBootLines((prev) => [...prev, fullLines[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 180);

    return () => clearInterval(interval);
  }, []);

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
        padding: '32px 20px',
        color: 'var(--paper)',
      }}
    >
      {/* Boot console box */}
      <div
        className="crt-screen"
        style={{
          width: '100%',
          maxWidth: '780px',
          padding: '16px 20px',
          marginBottom: '32px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--crt-dim)',
          boxShadow: 'var(--shadow-hard)',
          fontSize: '17px',
          minHeight: '140px',
        }}
      >
        <div style={{ color: 'var(--amber)', marginBottom: '8px', fontSize: '15px' }}>
          == HỆ THỐNG MÔ PHỎNG QUY TRÌNH TO-BE ==
        </div>
        {bootLines.map((line, idx) => (
          <div key={idx} style={{ opacity: 0.9, lineHeight: 1.4 }}>
            &gt; {line}
          </div>
        ))}
      </div>

      {/* Main title card */}
      <div
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          padding: '40px 48px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-paper-lg)',
          textAlign: 'center',
          maxWidth: '780px',
          width: '100%',
          border: '2px solid var(--paper-line)',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '3px',
            color: 'var(--ink)',
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}
        >
          BẢO LƯU, PLEASE
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '20px',
            color: 'var(--ink-soft)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Phòng Một Cửa Số — Trường ĐH Kinh tế – ĐH Đà Nẵng
        </p>

        <p
          style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '16px',
            color: 'var(--amber)',
            fontWeight: 700,
            letterSpacing: '1px',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          Lớp MIS3047_2
        </p>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--ink-soft)',
            maxWidth: '560px',
            margin: '0 auto 32px auto',
            lineHeight: 1.5,
          }}
        >
          Mô phỏng vận hành quy trình To-Be: "Giải quyết thủ tục nghỉ học tạm thời / bảo lưu kết quả học tập" theo chuẩn BPMN 2.0 có phối hợp con người & AI.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSessionMode('portal');
                setScreen('login');
              }}
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: 'var(--amber)',
                color: 'var(--desk-900)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--desk-900)',
                boxShadow: 'var(--shadow-hard)',
                cursor: 'var(--cursor-pointer)',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
              title="Đăng nhập cổng Sinh viên (tạo đơn) hoặc Cổng Cán bộ (duyệt đơn)"
            >
              <span>🔐</span>
              <span>CỔNG ĐĂNG NHẬP</span>
            </button>

            <button
              onClick={() => {
                logout();
                setSessionMode('demo');
                setScreen('scenario');
              }}
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: 'var(--desk-900)',
                color: 'var(--amber)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--amber)',
                boxShadow: 'var(--shadow-hard)',
                cursor: 'var(--cursor-pointer)',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--desk-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--desk-900)';
              }}
              title="Vận hành trực tiếp toàn bộ 5 bàn nghiệp vụ với 6 kịch bản mẫu không cần đăng nhập"
            >
              <span>▶</span>
              <span>CHỌN KỊCH BẢN (DEMO TOÀN DIỆN)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSessionMode('portal');
                setScreen('register');
              }}
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: 'var(--desk-700)',
                color: 'var(--paper)',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--desk-500)',
                boxShadow: 'var(--shadow-hard)',
                cursor: 'var(--cursor-pointer)',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease',
              }}
              title="Đăng ký tài khoản Sinh viên hoặc Cán bộ duyệt đơn mới"
            >
              <span>📝</span>
              <span>ĐĂNG KÝ TÀI KHOẢN MỚI</span>
            </button>

            <button
              onClick={toggleAsIs}
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: 'transparent',
                color: 'var(--ink)',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '2px dashed var(--stamp-red)',
                cursor: 'var(--cursor-pointer)',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(179, 38, 30, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Xem mô phỏng bối cảnh quy trình giấy cũ (22 ngày)"
            >
              <span>📂</span>
              <span>XEM BẢN AS-IS (22 NGÀY)</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
