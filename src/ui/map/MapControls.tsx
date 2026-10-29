import React from 'react';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

export interface MapControlsProps {
  cameraMode: 'follow' | 'overview';
  setCameraMode: React.Dispatch<React.SetStateAction<'follow' | 'overview'>>;
  showEventLog: boolean;
  setShowEventLog: React.Dispatch<React.SetStateAction<boolean>>;
}

const vDivider: React.CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: 'var(--desk-500)',
  flexShrink: 0,
};

const segmentBox: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: 'var(--desk-700)',
  borderRadius: 'var(--radius-sm)',
  padding: '2px',
  border: '1px solid var(--desk-500)',
};

const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontFamily: 'var(--font-paper)',
  fontSize: '12.5px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--desk-500)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

export const MapControls: React.FC<MapControlsProps> = ({
  cameraMode,
  setCameraMode,
  showEventLog,
  setShowEventLog,
}) => {
  const toggleFullscreen = useAppStore((s) => s.toggleMapFullscreen);

  const {
    isPlaying,
    isPaused,
    isWaitingUserTask,
    start,
    pause,
    resume,
    stepNext,
    advanceDays,
    reset,
  } = usePlaybackStore();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {/* 1. Camera Toggle (Segmented) */}
      <div style={segmentBox} title="Chuyển chế độ xem Camera (Phím tắt: V)">
        <button
          onClick={() => setCameraMode('follow')}
          style={{
            padding: '3px 8px',
            fontSize: '12px',
            fontFamily: 'var(--font-paper)',
            fontWeight: cameraMode === 'follow' ? 'bold' : 'normal',
            backgroundColor: cameraMode === 'follow' ? 'var(--amber)' : 'transparent',
            color: cameraMode === 'follow' ? 'var(--ink)' : 'var(--paper-dim)',
            borderRadius: '2px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 5V3a1 1 0 0 1 1-1h2M11 2h2a1 1 0 0 1 1 1v2M14 11v2a1 1 0 0 1-1 1h-2M5 14H3a1 1 0 0 1-1-1v-2" />
            <circle cx="8" cy="8" r="2.5" />
          </svg>
          <span>Theo dõi</span>
        </button>
        <button
          onClick={() => setCameraMode('overview')}
          style={{
            padding: '3px 8px',
            fontSize: '12px',
            fontFamily: 'var(--font-paper)',
            fontWeight: cameraMode === 'overview' ? 'bold' : 'normal',
            backgroundColor: cameraMode === 'overview' ? 'var(--amber)' : 'transparent',
            color: cameraMode === 'overview' ? 'var(--ink)' : 'var(--paper-dim)',
            borderRadius: '2px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="12" height="12" rx="1.5" strokeDasharray="3 2" />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
          <span>Toàn cảnh</span>
        </button>
        <span style={{ fontSize: '10px', color: 'var(--paper-dim)', padding: '0 4px', opacity: 0.65, fontFamily: 'var(--font-paper)' }}>
          V
        </span>
      </div>

      <div style={vDivider} />

      {/* 2. Playback: Play / Pause / Resume + Step */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {!isPlaying ? (
          <button
            onClick={() => start()}
            style={{
              ...btnBase,
              backgroundColor: 'var(--stamp-green)',
              color: '#ffffff',
              fontWeight: 'bold',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: 'var(--shadow-hard)',
            }}
            title="Khởi chạy quy trình tự động To-Be (Phím Space)"
          >
            <span>▶</span>
            <span>CHẠY CA</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={() => resume()}
            style={{
              ...btnBase,
              backgroundColor: 'var(--amber)',
              color: 'var(--ink)',
              fontWeight: 'bold',
              border: '1px solid rgba(0,0,0,0.3)',
              boxShadow: 'var(--shadow-hard)',
            }}
            title="Tiếp tục mô phỏng (Phím Space)"
          >
            <span>▶</span>
            <span>TIẾP TỤC</span>
          </button>
        ) : (
          <button
            onClick={() => pause()}
            style={{
              ...btnBase,
              backgroundColor: 'var(--desk-700)',
              color: 'var(--paper)',
              fontWeight: 'bold',
            }}
            title="Tạm dừng mô phỏng (Phím Space)"
          >
            <span>⏸</span>
            <span>TẠM DỪNG</span>
          </button>
        )}

        <button
          onClick={() => stepNext()}
          disabled={isWaitingUserTask}
          style={{
            ...btnBase,
            backgroundColor: 'var(--desk-700)',
            color: 'var(--paper)',
            cursor: isWaitingUserTask ? 'not-allowed' : 'pointer',
            opacity: isWaitingUserTask ? 0.45 : 1,
          }}
          title="Bước tiếp 1 token / node BPMN (Phím Space khi ở chế độ Step)"
        >
          <span>⏭</span>
          <span>BƯỚC</span>
        </button>
      </div>

      <div style={vDivider} />

      {/* 3. Time Manipulation */}
      <div style={segmentBox} title="Tua thời gian mô phỏng">
        <button
          onClick={() => {
            sfx.playClockTick();
            advanceDays(1);
          }}
          style={{
            padding: '3px 7px',
            backgroundColor: 'transparent',
            color: 'var(--amber)',
            fontFamily: 'var(--font-hud)',
            fontSize: '14px',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
          title="Tua +1 ngày (Phím T)"
        >
          +1 NGÀY
        </button>
        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--desk-500)' }} />
        <button
          onClick={() => {
            sfx.playCalendarTear();
            advanceDays(3);
          }}
          style={{
            padding: '3px 7px',
            backgroundColor: 'transparent',
            color: 'var(--amber)',
            fontFamily: 'var(--font-hud)',
            fontSize: '14px',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
          title="Tua +3 ngày đến hạn SLA Cố vấn học tập (Shift+T)"
        >
          +3 NGÀY (SLA)
        </button>
      </div>

      <div style={vDivider} />

      {/* 4. Reset Action */}
      <button
        onClick={() => reset()}
        style={{
          ...btnBase,
          backgroundColor: 'transparent',
          color: 'var(--crt-fail-soft)',
          border: '1px solid var(--stamp-red)',
          fontWeight: 'bold',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--stamp-red)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--crt-fail-soft)';
        }}
        title="Đặt lại ca về điểm khởi tạo (Phím R)"
      >
        <span>↺</span>
        <span>RESET</span>
      </button>

      <div style={vDivider} />

      {/* 5. Utility & Close */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setShowEventLog((prev) => !prev)}
          style={{
            ...btnBase,
            backgroundColor: showEventLog ? 'var(--amber)' : 'var(--desk-700)',
            color: showEventLog ? 'var(--ink)' : 'var(--paper)',
            fontWeight: showEventLog ? 'bold' : 'normal',
          }}
          title="Bật/tắt bảng Nhật ký sự kiện chi tiết"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 2h6v2H5z" />
            <path d="M4 4h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
            <line x1="6" y1="8" x2="10" y2="8" />
            <line x1="6" y1="11" x2="9" y2="11" />
          </svg>
          <span>NHẬT KÝ</span>
        </button>

        <button
          onClick={toggleFullscreen}
          style={{
            ...btnBase,
            backgroundColor: 'var(--desk-700)',
            color: 'var(--paper-dim)',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-hard)',
          }}
          title="Đóng bản đồ (Phím Esc hoặc B)"
        >
          <span>✕</span>
          <span>ĐÓNG</span>
          <span style={{ fontSize: '10px', opacity: 0.65, marginLeft: '2px' }}>(Esc)</span>
        </button>
      </div>
    </div>
  );
};
