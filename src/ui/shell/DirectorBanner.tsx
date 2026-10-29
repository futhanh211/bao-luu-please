import React from 'react';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';

export const DirectorBanner: React.FC = () => {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const speed = useAppStore((s) => s.speed);
  const cycleSpeed = useAppStore((s) => s.cycleSpeed);
  const directorCaption = useAppStore((s) => s.directorCaption);

  const isPaused = usePlaybackStore((s) => s.isPaused);
  const pause = usePlaybackStore((s) => s.pause);
  const resume = usePlaybackStore((s) => s.resume);

  if (mode !== 'director') return null;

  const togglePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <div
      className="director-banner"
      role="region"
      aria-label="Chế độ Đạo diễn tự chạy"
      style={{
        width: '100%',
        backgroundColor: '#1b1b16',
        borderBottom: '2px solid var(--amber)',
        color: 'var(--paper)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 90,
        position: 'relative',
        fontSize: '15px',
      }}
    >
      {/* Left indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontSize: '20px' }}>🎬</span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--amber)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isPaused ? 'var(--amber)' : '#52c41a',
                display: 'inline-block',
                boxShadow: isPaused ? 'none' : '0 0 8px #52c41a',
              }}
            />
            {isPaused ? 'ĐẠO DIỄN: TẠM DỪNG' : 'ĐẠO DIỄN: TỰ ĐỘNG CHẠY'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '13px',
              color: 'var(--paper-dim)',
            }}
          >
            Tự động thực hiện & thuyết minh toàn bộ ca làm việc
          </div>
        </div>
      </div>

      {/* Middle: Active narration text */}
      <div
        style={{
          flex: 1,
          fontFamily: 'var(--font-paper)',
          fontSize: '15px',
          fontWeight: 600,
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          padding: '8px 14px',
          borderRadius: '4px',
          borderLeft: '3px solid var(--amber)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={directorCaption ?? 'Hệ thống đang sẵn sàng ca làm việc...'}
      >
        {directorCaption ?? '🎬 Đang kích hoạt chế độ Đạo diễn — Hồ sơ chuẩn bị khởi chạy...'}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={togglePause}
          style={{
            padding: '5px 12px',
            fontFamily: 'var(--font-paper)',
            fontSize: '13px',
            fontWeight: 'bold',
            backgroundColor: isPaused ? 'var(--amber)' : 'var(--desk-700)',
            color: isPaused ? 'var(--desk-900)' : 'var(--paper)',
            border: '1px solid var(--desk-500)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'var(--cursor-pointer)',
          }}
          title={isPaused ? 'Tiếp tục (Phím Space)' : 'Tạm dừng (Phím Space)'}
        >
          {isPaused ? '▶ TIẾP TỤC' : '⏸ TẠM DỪNG'}
        </button>

        <button
          onClick={cycleSpeed}
          style={{
            padding: '5px 10px',
            fontFamily: 'var(--font-hud)',
            fontSize: '14px',
            backgroundColor: 'var(--desk-700)',
            color: 'var(--amber)',
            border: '1px solid var(--desk-500)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'var(--cursor-pointer)',
          }}
          title="Tốc độ Đạo diễn (Phím + / -)"
        >
          {speed}×
        </button>

        <button
          onClick={() => setMode('play')}
          style={{
            padding: '5px 10px',
            fontFamily: 'var(--font-paper)',
            fontSize: '12px',
            backgroundColor: 'transparent',
            color: 'var(--paper-dim)',
            border: '1px solid var(--desk-500)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'var(--cursor-pointer)',
          }}
          title="Chuyển sang chế độ Vận hành thường"
        >
          ✕ Thoát
        </button>
      </div>
    </div>
  );
};
