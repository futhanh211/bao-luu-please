import React from 'react';
import { useAppStore, PlayMode } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { findReportEndEvent } from '../../data/caseReport';
import { RoleTabs } from './RoleTabs';
import { AiModeSwitch } from './AiModeSwitch';
import { useAuthStore } from '../../store/useAuth';
import { OfficerAccount } from '../../data/accounts';
import { sfx } from '../audio/sfx';

export const Hud: React.FC = () => {
  const {
    caseCode,
    mode,
    setMode,
    speed,
    cycleSpeed,
    muted,
    toggleMute,
    toggleSettings,
    toggleHelp,
    toggleAsIs,
    resetCase,
    setScreen,
    sessionMode,
  } = useAppStore();

  const day = usePlaybackStore((s) => s.mapState.counters.day);
  const resetPlayback = usePlaybackStore((s) => s.reset);
  const startDirector = usePlaybackStore((s) => s.startDirector);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const reportEnd = usePlaybackStore((s) => findReportEndEvent(s.currentEventLog));
  const setReportDismissed = usePlaybackStore((s) => s.setReportDismissed);

  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  const handleReset = () => {
    resetPlayback();
    resetCase();
  };

  const handleModeChange = (newMode: PlayMode) => {
    if (newMode === 'director') {
      startDirector();
    } else {
      setMode(newMode);
    }
  };

  const modes: { id: PlayMode; label: string; disabled?: boolean; tooltip?: string }[] = [
    { id: 'play', label: 'Play', tooltip: 'Chế độ Vận hành: máy chạy task dịch vụ, người đóng dấu (Phím Space)' },
    { id: 'step', label: 'Step', tooltip: 'Chế độ Từng bước: dừng ở mỗi node BPMN (Phím S / Space)' },
    { id: 'director', label: 'Director', disabled: false, tooltip: 'Chế độ Đạo diễn tự chạy toàn bộ ca 90–120s (Phím D)' },
  ];

  if (sessionMode === 'portal') {
    return (
      <header
        className="hud-header hud-portal-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '54px',
          backgroundColor: 'var(--desk-900)',
          borderBottom: '2px solid var(--amber)',
          boxShadow: 'var(--shadow-hard)',
          zIndex: 100,
        }}
      >
        {/* Khối bên trái: Logo ĐH Kinh tế + Mã hồ sơ + Badge Giả lập */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => {
              sfx.play('paper');
              setScreen('title');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'var(--cursor-pointer)',
              padding: 0,
            }}
            title="Về màn hình chính giới thiệu"
          >
            <span style={{ fontSize: '20px' }}>🏛️</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '11px', color: 'var(--amber)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Trường ĐH Kinh tế – ĐH Đà Nẵng
              </div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-paper)', fontWeight: 'bold' }}>
                HỆ THỐNG MỘT CỬA SỐ
              </div>
            </div>
          </button>

          <div style={{ width: '1px', height: '26px', backgroundColor: 'var(--desk-700)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--paper-dim)' }}>Hồ sơ:</span>
            <strong style={{ color: 'var(--paper)', letterSpacing: '0.5px' }}>{caseCode}</strong>
          </div>
        </div>

        {/* Khối ở giữa: Thông tin tài khoản người dùng đang đăng nhập */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--desk-700)',
          }}
        >
          {currentUser ? (
            <>
              <span style={{ fontSize: '20px' }}>
                {currentUser.type === 'student' ? '🎓' : currentUser.avatar}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-paper)',
                      fontWeight: 'bold',
                      fontSize: '14.5px',
                      color: 'var(--amber)',
                    }}
                  >
                    {currentUser.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--paper)',
                      borderRadius: '2px',
                    }}
                  >
                    {currentUser.type === 'student' ? `MSSV: ${currentUser.mssv}` : (currentUser as OfficerAccount).title}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--paper-dim)' }}>
                  {currentUser.type === 'student' ? `${currentUser.className} · ${currentUser.faculty}` : (currentUser as OfficerAccount).department}
                </span>
              </div>
            </>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--paper-dim)' }}>Chưa xác thực</span>
          )}
        </div>

        {/* Khối bên phải: Âm thanh, Cài đặt, Trợ giúp, Đăng xuất */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Nút loa */}
          <button
            onClick={() => {
              sfx.setEnabled(muted);
              toggleMute();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: muted ? 'var(--paper-dim)' : 'var(--paper)',
              cursor: 'var(--cursor-pointer)',
              fontSize: '17px',
              padding: '6px',
            }}
            title="Bật/Tắt âm thanh (Phím M)"
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Cài đặt */}
          <button
            onClick={toggleSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--paper-dim)',
              cursor: 'var(--cursor-pointer)',
              fontSize: '16px',
              padding: '6px',
            }}
            title="Cài đặt hệ thống"
          >
            ⚙
          </button>

          {/* Trợ giúp */}
          <button
            onClick={toggleHelp}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--paper-dim)',
              cursor: 'var(--cursor-pointer)',
              fontSize: '15px',
              padding: '6px',
            }}
            title="Trợ giúp nghiệp vụ"
          >
            ?
          </button>

          {/* Nút ĐĂNG XUẤT */}
          <button
            onClick={() => {
              sfx.play('paper');
              logout();
              setScreen('login');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--amber)',
              color: 'var(--desk-900)',
              border: '1.5px solid var(--amber)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'bold',
              fontSize: '13px',
              fontFamily: 'var(--font-paper)',
              cursor: 'var(--cursor-pointer)',
              boxShadow: 'var(--shadow-hard)',
            }}
            title="Đăng xuất tài khoản và quay lại Cổng Đăng nhập"
          >
            <span>🚪</span>
            <span>ĐĂNG XUẤT</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className={`hud-header ${currentUser ? 'hud-authenticated' : ''}`}>
      {/* Left: Logo + Case ID + Day + GIẢ LẬP Badge */}
      <div className="hud-left">
        <button
          onClick={() => setScreen('title')}
          className="hud-logo-btn"
          title="Về màn hình chính (Title Screen)"
        >
          <span className="hud-logo-icon">📋</span>
          <span className="hud-logo-text-full">BẢO LƯU, PLEASE</span>
          <span className="hud-logo-text-short">BẢO LƯU</span>
        </button>

        <div className="hud-divider" />

        <div className="hud-case-info">
          <span className="hud-case-code">
            <span className="hud-ca-prefix">MÃ CA: </span>
            <span className="hud-ca-prefix-short">CA: </span>
            <strong style={{ color: 'var(--paper)' }}>{caseCode}</strong>
          </span>

          <span className="hud-day-badge">
            <span className="hud-day-text-full">NGÀY </span>
            <span className="hud-day-text-short">N.</span>
            {day}
          </span>

          {!isCustomCase && (
            <span
              className="hud-sim-badge"
              title="Dữ liệu sinh viên là giả lập"
            >
              GIẢ LẬP
            </span>
          )}

          {currentUser ? (
            <div className="hud-user-badge">
              <span
                className="hud-user-name"
                title={`${currentUser.name} (${currentUser.type === 'student' ? currentUser.className : (currentUser as OfficerAccount).title}) — Bấm Đăng xuất để đổi vai`}
              >
                <span className="hud-user-avatar" aria-hidden="true">
                  {currentUser.type === 'student' ? '🎓' : currentUser.avatar}
                </span>
                <span className="hud-user-text">{currentUser.name}</span>
              </span>
              <button
                onClick={() => {
                  sfx.play('paper');
                  logout();
                  setScreen('login');
                }}
                className="hud-logout-btn"
                title="Đăng xuất tài khoản và quay lại Cổng Đăng nhập"
                aria-label="Đăng xuất tài khoản"
              >
                <span className="hud-logout-text">Đăng xuất</span>
                <span className="hud-logout-icon" aria-hidden="true">🚪</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sfx.play('paper');
                setScreen('login');
              }}
              className="hud-login-btn"
              title="Mở cổng đăng nhập"
            >
              🔐 ĐĂNG NHẬP
            </button>
          )}
        </div>
      </div>

      {/* Middle: 5 Role Tabs */}
      <RoleTabs />

      {/* Right: Controls (Play Modes, Speed, Sound, AI, Reset) */}
      <div className="hud-right">
        {/* Play Modes */}
        <div className="hud-mode-group">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => !m.disabled && handleModeChange(m.id)}
              disabled={m.disabled}
              title={m.tooltip}
              className="hud-mode-btn mode-btn"
              style={{
                fontWeight: mode === m.id ? 'bold' : 'normal',
                backgroundColor: mode === m.id ? 'var(--paper)' : 'transparent',
                color: mode === m.id ? 'var(--ink)' : 'var(--paper-dim)',
                opacity: m.disabled ? 0.45 : 1,
                cursor: m.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="hud-btn hud-speed-btn speed-btn"
          title="Đổi tốc độ (Phím - / +)"
        >
          {speed}×
        </button>

        {/* As-Is simulation button */}
        <button
          onClick={toggleAsIs}
          className="hud-btn hud-asis-btn"
          title="Xem mô phỏng quy trình As-Is giấy (22 ngày)"
          aria-label="Xem As-Is"
        >
          <span className="hud-asis-icon">📂</span>
          <span className="hud-asis-text">As-Is</span>
        </button>

        {/* Settings */}
        <button
          onClick={toggleSettings}
          className="hud-btn hud-settings-btn"
          title="Cài đặt: âm thanh, giảm hiệu ứng, tốc độ"
          aria-label="Mở cài đặt"
        >
          ⚙
        </button>

        {/* Help button */}
        <button
          onClick={toggleHelp}
          className="hud-btn hud-help-btn"
          title="Trợ giúp & Phím tắt (Phím ?)"
          aria-label="Mở trợ giúp"
        >
          ?
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            sfx.setEnabled(muted);
            toggleMute();
          }}
          className="hud-btn hud-sound-btn"
          style={{
            color: muted ? 'var(--paper-dim)' : 'var(--paper)',
          }}
          title="Bật/Tắt âm thanh (Phím M)"
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* Report button — chỉ hiện khi ca đã kết thúc */}
        {reportEnd && (
          <button
            onClick={() => setReportDismissed(false)}
            className="hud-report-btn"
            title="Xem lại báo cáo cuối ca"
          >
            📄 BÁO CÁO
          </button>
        )}

        {/* AI Badge + công tắc nguồn */}
        {!isCustomCase && <AiModeSwitch />}

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="hud-reset-btn"
          title="Đặt lại ca làm việc (Phím R)"
        >
          RESET
        </button>
      </div>
    </header>
  );
};
