import React, { useState } from 'react';
import { useAppStore, AppSpeed } from '../../store/useApp';
import { sfx } from '../audio/sfx';
import { StorageManager } from './StorageManager';

const SPEEDS: AppSpeed[] = [0.5, 1, 2];

type SettingsTab = 'preferences' | 'storage';

/** Hộp cài đặt: âm thanh, âm lượng ≤40%, giảm hiệu ứng, tốc độ, quản lý lưu trữ bền vững. */
export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const muted = useAppStore((s) => s.muted);
  const toggleMute = useAppStore((s) => s.toggleMute);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const toggleReducedMotion = useAppStore((s) => s.toggleReducedMotion);
  const customCursor = useAppStore((s) => s.customCursor);
  const toggleCustomCursor = useAppStore((s) => s.toggleCustomCursor);
  const speed = useAppStore((s) => s.speed);
  const setSpeed = useAppStore((s) => s.setSpeed);

  if (!settingsOpen) return null;

  const close = () => setSettingsOpen(false);

  const handleSound = () => {
    // Gọi trực tiếp trong cú click để AudioContext được phép resume.
    sfx.setEnabled(muted);
    toggleMute();
  };

  const handleVolume = (percent: number) => {
    const next = percent / 100;
    setVolume(next);
    sfx.setVolume(next);
    if (!muted) sfx.playTypewriter();
  };

  return (
    <div
      className="settings-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="settings-card"
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt hệ thống"
        style={{
          maxWidth: activeTab === 'storage' ? '700px' : '560px',
          width: '100%',
          transition: 'max-width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <header className="settings-head">
          <div>
            <div className="settings-eyebrow">BẢNG ĐIỀU KHIỂN HỆ THỐNG · MÃ HIỆU SYS-CFG-2026</div>
            <h1 className="settings-title">Cài đặt & Hạ tầng</h1>
          </div>
          <button
            type="button"
            className="settings-close"
            onClick={close}
            title="Đóng (Esc)"
            aria-label="Đóng cài đặt"
          >
            ✕
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="settings-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preferences'}
            className="settings-tab"
            data-active={activeTab === 'preferences' ? 'true' : 'false'}
            onClick={() => setActiveTab('preferences')}
          >
            <span>⚙️</span> Cài đặt chung & Âm thanh
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'storage'}
            className="settings-tab"
            data-active={activeTab === 'storage' ? 'true' : 'false'}
            onClick={() => setActiveTab('storage')}
          >
            <span>💾</span> CSDL Cổng Dịch vụ & Đồng bộ Cloud
          </button>
        </div>

        <div className="settings-body">
          {activeTab === 'storage' ? (
            <StorageManager />
          ) : (
            <>
              <div className="settings-section-divider">
                I. ÂM THANH & PHẢN HỒI (AUDIO SYNTHESIS)
              </div>

              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-label">Hiệu ứng âm thanh</span>
                  <span className="settings-note">WebAudio tự sinh · không dùng file mp3 · mặc định tắt</span>
                </div>
                <button
                  type="button"
                  className="settings-toggle"
                  data-on={muted ? 'false' : 'true'}
                  aria-pressed={!muted}
                  onClick={handleSound}
                >
                  {muted ? '🔇 TẮT' : '🔊 BẬT'}
                </button>
              </div>

              <label className="settings-row settings-row-block">
                <span className="settings-row-main">
                  <span className="settings-label">Âm lượng hệ thống</span>
                  <span className="settings-note">Khống chế tối đa 40% để an toàn khi thuyết trình</span>
                </span>
                <span className="settings-slider">
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={5}
                    value={Math.round(volume * 100)}
                    onChange={(event) => handleVolume(Number(event.target.value))}
                    aria-label="Âm lượng tối đa 40 phần trăm"
                  />
                  <strong>{Math.round(volume * 100)}%</strong>
                </span>
              </label>

              <div className="settings-section-divider">
                II. HIỂN THỊ & TỐC ĐỘ (DISPLAY & MOTION)
              </div>

              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-label">Giảm hiệu ứng động</span>
                  <span className="settings-note">
                    Tắt rung lắc bàn làm việc, loang mực và hoạt ảnh quét giấy.
                  </span>
                </div>
                <button
                  type="button"
                  className="settings-toggle"
                  data-on={reducedMotion ? 'true' : 'false'}
                  aria-pressed={reducedMotion}
                  onClick={toggleReducedMotion}
                >
                  {reducedMotion ? '✔ ĐANG BẬT' : 'TẮT'}
                </button>
              </div>

              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-label">Con trỏ công sở</span>
                  <span className="settings-note">
                    Bộ trỏ retro: con dấu dập gỗ, ngòi bút BGH, kính lúp CTSV, chỉ tay manicule.
                  </span>
                </div>
                <button
                  type="button"
                  className="settings-toggle"
                  data-on={customCursor ? 'true' : 'false'}
                  aria-pressed={customCursor}
                  onClick={toggleCustomCursor}
                >
                  {customCursor ? '✔ ĐANG BẬT' : 'TẮT'}
                </button>
              </div>

              <div className="settings-row settings-row-block">
                <span className="settings-row-main">
                  <span className="settings-label">Tốc độ mô phỏng</span>
                  <span className="settings-note">Áp dụng cho animation, dòng chữ AI và chuyển cảnh</span>
                </span>
                <span className="settings-speeds">
                  {SPEEDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="settings-speed"
                      data-active={speed === value ? 'true' : 'false'}
                      onClick={() => setSpeed(value)}
                    >
                      {value}×
                    </button>
                  ))}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
