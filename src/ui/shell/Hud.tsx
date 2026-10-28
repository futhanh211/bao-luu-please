import React from 'react';
import { useAppStore, PlayMode } from '../../store/useApp';
import { RoleTabs } from './RoleTabs';

export const Hud: React.FC = () => {
  const {
    caseCode,
    day,
    mode,
    setMode,
    speed,
    cycleSpeed,
    muted,
    toggleMute,
    aiMode,
    resetCase,
    setScreen,
  } = useAppStore();

  const modes: { id: PlayMode; label: string; key: string }[] = [
    { id: 'play', label: 'Play', key: 'P' },
    { id: 'step', label: 'Step', key: 'S' },
    { id: 'director', label: 'Director', key: 'D' },
  ];

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--desk-900)',
        borderBottom: '2px solid var(--desk-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: 'var(--paper)',
        userSelect: 'none',
        flexShrink: 0,
        boxShadow: 'var(--shadow-hud)',
        zIndex: 100,
      }}
    >
      {/* Left: Logo + Case ID + Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setScreen('title')}
          style={{
            fontFamily: 'var(--font-paper)',
            fontWeight: 'bold',
            fontSize: '18px',
            color: 'var(--amber)',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title="Về màn hình chính"
        >
          <span style={{ fontSize: '20px' }}>📋</span>
          <span>BẢO LƯU, PLEASE</span>
        </button>

        <div
          style={{
            height: '24px',
            width: '1px',
            backgroundColor: 'var(--desk-500)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '20px',
              color: 'var(--paper-dim)',
              letterSpacing: '0.5px',
            }}
          >
            MÃ CA: <strong style={{ color: 'var(--paper)' }}>{caseCode}</strong>
          </span>

          <span
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '20px',
              backgroundColor: 'var(--desk-700)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--amber)',
            }}
          >
            NGÀY {day}
          </span>

          <span
            style={{
              fontSize: '12px',
              color: 'var(--amber)',
              border: '1px solid var(--amber)',
              padding: '1px 6px',
              borderRadius: '2px',
              fontFamily: 'var(--font-paper)',
              opacity: 0.85,
            }}
          >
            Dữ liệu giả lập
          </span>
        </div>
      </div>

      {/* Middle: 5 Role Tabs */}
      <RoleTabs />

      {/* Right: Mode + Speed + Audio + AI Badge + Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Play Modes */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--desk-700)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--desk-500)',
          }}
        >
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                fontFamily: 'var(--font-paper)',
                fontWeight: mode === m.id ? 'bold' : 'normal',
                backgroundColor: mode === m.id ? 'var(--paper)' : 'transparent',
                color: mode === m.id ? 'var(--ink)' : 'var(--paper-dim)',
                borderRadius: '2px',
                transition: 'all 0.1s ease',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '18px',
            padding: '4px 8px',
            backgroundColor: 'var(--desk-700)',
            color: 'var(--amber)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--desk-500)',
          }}
          title="Đổi tốc độ (Phím - / +)"
        >
          {speed}×
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleMute}
          style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '13px',
            padding: '4px 8px',
            backgroundColor: 'var(--desk-700)',
            color: muted ? 'var(--paper-dim)' : 'var(--paper)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--desk-500)',
          }}
          title="Bật/Tắt âm thanh (Phím M)"
        >
          {muted ? '🔇 Tắt' : '🔊 Bật'}
        </button>

        {/* AI Badge */}
        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '18px',
            padding: '2px 8px',
            backgroundColor: 'var(--crt-bg)',
            color: 'var(--crt-fg)',
            border: '1px solid var(--crt-dim)',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '1px',
          }}
        >
          AI: {aiMode.toUpperCase()}
        </div>

        {/* Reset button */}
        <button
          onClick={resetCase}
          style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '5px 12px',
            backgroundColor: 'var(--stamp-red)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #7c120c',
            boxShadow: 'var(--shadow-hard)',
          }}
          title="Đặt lại ca làm việc (Phím R)"
        >
          RESET
        </button>
      </div>
    </header>
  );
};
