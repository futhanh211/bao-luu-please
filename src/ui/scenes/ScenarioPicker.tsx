import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useApp';
import { SCENARIOS } from '../../data/scenarios';
import { screenVariants } from '../motion';

export const ScenarioPicker: React.FC = () => {
  const setScenario = useAppStore((s) => s.setScenario);
  const setScreen = useAppStore((s) => s.setScreen);

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        flex: 1,
        padding: '36px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'var(--paper)',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '32px',
                color: 'var(--amber)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              CHỌN HỒ SƠ CA LÀM VIỆC
            </h2>
            <p style={{ color: 'var(--paper-dim)', fontSize: '16px', marginTop: '4px' }}>
              Chọn 1 trong 6 kịch bản để bắt đầu phiên xử lý thủ tục bảo lưu kết quả học tập
            </p>
          </div>

          <button
            onClick={() => setScreen('title')}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-paper)',
              fontSize: '15px',
              backgroundColor: 'var(--desk-700)',
              color: 'var(--paper-dim)',
              border: '1px solid var(--desk-500)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          width: '100%',
        }}
      >
        {SCENARIOS.map((sc, idx) => (
          <div
            key={sc.id}
            onClick={() => setScenario(sc.id)}
            style={{
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-paper)',
              padding: '24px',
              cursor: 'pointer',
              border: '1px solid var(--paper-line)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              transform: `rotate(${((idx % 3) - 1) * 0.4}deg)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
              e.currentTarget.style.boxShadow = 'var(--shadow-paper-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${((idx % 3) - 1) * 0.4}deg)`;
              e.currentTarget.style.boxShadow = 'var(--shadow-paper)';
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--paper-line)',
                  paddingBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-hud)',
                    fontSize: '22px',
                    color: 'var(--ink)',
                    fontWeight: 'bold',
                  }}
                >
                  [{sc.code}]
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-paper)',
                    padding: '2px 8px',
                    backgroundColor: 'var(--paper-dim)',
                    borderRadius: '2px',
                    border: '1px solid var(--paper-line)',
                    color: 'var(--ink-soft)',
                  }}
                >
                  {sc.tag}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-paper)',
                  fontSize: '19px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: 'var(--ink)',
                }}
              >
                {sc.title}
              </h3>

              <div
                style={{
                  fontFamily: 'var(--font-paper)',
                  fontSize: '14px',
                  color: 'var(--ink-soft)',
                  marginBottom: '12px',
                }}
              >
                SV: <strong>{sc.studentName}</strong> • MSSV: <code>{sc.mssv}</code>
              </div>

              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.5,
                  color: 'var(--ink)',
                  marginBottom: '16px',
                }}
              >
                {sc.description}
              </p>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '10px',
                borderTop: '1px dashed var(--paper-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
              }}
            >
              <span style={{ color: 'var(--ink-soft)' }}>
                Kết quả kỳ vọng: <strong style={{ color: 'var(--stamp-blue)' }}>{sc.expectedOutcome}</strong>
              </span>
              <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>
                XỬ LÝ →
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
