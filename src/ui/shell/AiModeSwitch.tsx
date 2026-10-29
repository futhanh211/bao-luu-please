import React from 'react';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { AiBadge } from '../kit/AiBadge';

/** Công tắc nguồn AI trên HUD: bấm để đổi MOCK ↔ LIVE khi đã cấu hình .env.local. */
export const AiModeSwitch: React.FC = () => {
  const aiMode = useAppStore((s) => s.aiMode);
  const liveAvailable = useAppStore((s) => s.aiLiveAvailable);
  const aiBusy = useAppStore((s) => s.aiBusy);
  const setAiMode = usePlaybackStore((s) => s.setAiMode);

  const title = liveAvailable
    ? `Đổi nguồn AI (đang chọn ${aiMode.toUpperCase()}) — bấm để chuyển`
    : 'Chưa cấu hình VITE_GEMINI_API_KEY trong .env.local — đang chạy MOCK';

  const handleClick = (): void => {
    if (!liveAvailable) return;
    setAiMode(aiMode === 'live' ? 'mock' : 'live');
  };

  return (
    <button
      type="button"
      className="ai-mode-switch"
      data-live={liveAvailable}
      data-busy={aiBusy ? 'true' : 'false'}
      aria-disabled={!liveAvailable}
      onClick={handleClick}
      title={title}
    >
      <AiBadge compact />
    </button>
  );
};
