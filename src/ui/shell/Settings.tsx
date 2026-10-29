import React from 'react';
import { useAppStore, AppSpeed } from '../../store/useApp';
import { sfx } from '../audio/sfx';

const SPEEDS: AppSpeed[] = [0.5, 1, 2];

/** Hộp cài đặt: âm thanh, âm lượng ≤40%, giảm hiệu ứng, tốc độ. */
export const Settings: React.FC = () => {
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
      <section className="settings-card" role="dialog" aria-modal="true" aria-label="Cài đặt">
        <header className="settings-head">
          <div>
            <div className="settings-eyebrow">BẢNG ĐIỀU KHIỂN · CA LÀM VIỆC</div>
            <h1 className="settings-title">Cài đặt</h1>
          </div>
          <button type="button" className="settings-close" onClick={close} title="Đóng (Esc)" aria-label="Đóng cài đặt">
            ✕
          </button>
        </header>

        <div className="settings-body">
          <div className="settings-row">
            <div className="settings-row-main">
              <span className="settings-label">Âm thanh</span>
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
              <span className="settings-label">Âm lượng</span>
              <span className="settings-note">Tối đa 40% để an toàn khi thuyết trình</span>
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

          <div className="settings-row">
            <div className="settings-row-main">
              <span className="settings-label">Giảm hiệu ứng</span>
              <span className="settings-note">
                Tắt rung, mực loang, gõ chữ và chuyển cảnh. Tín hiệu vẫn đổi màu.
              </span>
            </div>
            <button
              type="button"
              className="settings-toggle"
              data-on={reducedMotion ? 'true' : 'false'}
              aria-pressed={reducedMotion}
              onClick={toggleReducedMotion}
            >
              {reducedMotion ? '◻ ĐANG BẬT' : '◼ ĐANG TẮT'}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-main">
              <span className="settings-label">Con trỏ công sở</span>
              <span className="settings-note">
                Bộ trỏ retro độc bản: con dấu dập gỗ, ngòi bút BGH, kính lúp CTSV, chỉ tay manicule.
              </span>
            </div>
            <button
              type="button"
              className="settings-toggle"
              data-on={customCursor ? 'true' : 'false'}
              aria-pressed={customCursor}
              onClick={toggleCustomCursor}
            >
              {customCursor ? '◻ ĐANG BẬT' : '◼ ĐANG TẮT'}
            </button>
          </div>

          <div className="settings-row settings-row-block">
            <span className="settings-row-main">
              <span className="settings-label">Tốc độ</span>
              <span className="settings-note">Áp dụng cho animation, chữ AI và chuyển cảnh</span>
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

          <p className="settings-foot">
            Phím tắt: <strong>M</strong> âm thanh · <strong>+ / -</strong> tốc độ · <strong>Esc</strong> đóng.
            Dữ liệu sinh viên là giả lập.
          </p>
        </div>
      </section>
    </div>
  );
};
