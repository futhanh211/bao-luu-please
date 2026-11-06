import React, { useState } from 'react';
import { useAppStore, AppSpeed } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { sfx } from '../audio/sfx';
import { StorageManager } from './StorageManager';
import {
  isLiveAvailable,
  getCustomGeminiKey,
  saveCustomGeminiKey,
  testGeminiConnection,
} from '../../ai/live';

const SPEEDS: AppSpeed[] = [0.5, 1, 2];

type SettingsTab = 'preferences' | 'ai' | 'storage';

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
  const aiMode = useAppStore((s) => s.aiMode);
  const liveAvailable = useAppStore((s) => s.aiLiveAvailable);
  const setAiMode = usePlaybackStore((s) => s.setAiMode);

  const [geminiKey, setGeminiKey] = useState<string>(
    () => getCustomGeminiKey() || (import.meta.env.VITE_GEMINI_API_KEY ?? '')
  );
  const [geminiModel, setGeminiModel] = useState<string>(() => (import.meta.env.VITE_GEMINI_MODEL || 'gemini-3-flash-preview').trim());
  const [aiTesting, setAiTesting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const handleSaveGemini = () => {
    saveCustomGeminiKey(geminiKey);
    const available = isLiveAvailable();
    if (available) {
      setAiMode('live');
      setAiFeedback('✓ Đã lưu API Key & chuyển sang chế độ Gemini Live!');
      sfx.playStamp();
    } else {
      setAiMode('mock');
      setAiFeedback('Đã xóa API Key. Hệ thống sử dụng chế độ Mock.');
      sfx.playKeyClack();
    }
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      setAiFeedback('Vui lòng nhập API Key để kiểm tra.');
      return;
    }
    setAiTesting(true);
    setAiFeedback('Đang gửi truy vấn kiểm tra tới Google Gemini...');
    try {
      const res = await testGeminiConnection(geminiKey, geminiModel);
      if (res.success) {
        setAiFeedback(`✓ ${res.message}`);
        saveCustomGeminiKey(geminiKey);
        setAiMode('live');
        sfx.playStamp();
      } else {
        setAiFeedback(`✕ ${res.message}`);
        sfx.playBuzz();
      }
    } catch (err: unknown) {
      setAiFeedback(`✕ Lỗi: ${err instanceof Error ? err.message : String(err)}`);
      sfx.playBuzz();
    } finally {
      setAiTesting(false);
    }
  };

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
            aria-selected={activeTab === 'ai'}
            className="settings-tab"
            data-active={activeTab === 'ai' ? 'true' : 'false'}
            onClick={() => setActiveTab('ai')}
          >
            <span>🤖</span> Trí tuệ nhân tạo (Gemini AI)
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
          ) : activeTab === 'ai' ? (
            <div className="settings-ai-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="settings-section-divider">
                CẤU HÌNH GOOGLE GEMINI AI (MULTIMODAL VISION & LLM)
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Hệ thống hỗ trợ 5 điểm chạm AI: <strong>AI-1 Quét OCR minh chứng</strong>, <strong>AI-2 Chatbot</strong>, <strong>AI-3 Tóm tắt ca</strong>, <strong>AI-4 Soạn thảo</strong>.
                Nếu không gắn Key, hệ thống tự động chạy Mock Engine chuẩn theo BPMN 2.0.
              </div>

              <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                <div className="settings-row-main">
                  <span className="settings-label">Chế độ hoạt động hiện tại</span>
                  <span className="settings-note">
                    {liveAvailable
                      ? `Đang bật chế độ LIVE (${aiMode.toUpperCase()})`
                      : 'Đang chạy chế độ MOCK (Chưa kết nối API Key)'}
                  </span>
                </div>
                {liveAvailable && (
                  <button
                    type="button"
                    className="settings-toggle"
                    data-on={aiMode === 'live' ? 'true' : 'false'}
                    onClick={() => setAiMode(aiMode === 'live' ? 'mock' : 'live')}
                  >
                    {aiMode === 'live' ? '⚡ LIVE' : '🤖 MOCK'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold' }}>Gemini API Key (Google AI Studio):</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11.5, color: 'var(--stamp-blue)', textDecoration: 'underline' }}
                  >
                    🔗 Lấy API Key miễn phí
                  </a>
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  placeholder="Dán API Key (AIzaSy...) hoặc cấu hình qua .env.local"
                  onChange={(e) => setGeminiKey(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    border: '1px solid var(--paper-line)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 'bold' }}>Model Gemini:</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    fontSize: 12,
                    border: '1px solid var(--paper-line)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fff',
                  }}
                >
                  <option value="gemini-3-flash-preview">gemini-3-flash-preview (Khuyên dùng - Nhanh & Mới nhất)</option>
                  <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Siêu nhẹ)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Mô hình lớn)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={aiTesting}
                  onClick={handleTestGemini}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--stamp-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'bold',
                    fontSize: 12,
                    cursor: aiTesting ? 'wait' : 'pointer',
                  }}
                >
                  {aiTesting ? '⏳ Đang kiểm tra...' : '⚡ Kiểm tra kết nối (Ping Test)'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveGemini}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--stamp-green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'bold',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Lưu & Áp dụng
                </button>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiKey('');
                      saveCustomGeminiKey('');
                      setAiMode('mock');
                      setAiFeedback('Đã xóa API Key. Quay về chế độ Mock.');
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Xóa Key
                  </button>
                )}
              </div>

              {aiFeedback && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: aiFeedback.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
                    color: aiFeedback.startsWith('✓') ? 'var(--stamp-green)' : 'var(--stamp-red)',
                    border: `1px solid ${aiFeedback.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  {aiFeedback}
                </div>
              )}
            </div>
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
