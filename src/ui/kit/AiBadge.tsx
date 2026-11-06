import React from 'react';
import { useAppStore } from '../../store/useApp';
import { AIStatus } from '../../ai/provider';

interface AiBadgeProps {
  compact?: boolean;
  className?: string;
}

const LABELS: Record<AIStatus, { full: string; compact: string; title: string }> = {
  mock: { full: 'AI · MOCK', compact: 'AI: MOCK', title: 'AI đang chạy bản mock, không cần mạng' },
  live: { full: 'AI · LIVE', compact: 'AI: LIVE', title: 'AI đang gọi Gemini trực tiếp' },
  fallback: {
    full: 'AI · MOCK (fallback)',
    compact: 'AI: MOCK (FB)',
    title: 'AI LIVE không phản hồi — đã chuyển sang MOCK (fallback)',
  },
};

/** Badge nguồn AI dùng chung: HUD, panel đề xuất, khung chat, thư. */
export const AiBadge: React.FC<AiBadgeProps> = ({ compact = false, className = '' }) => {
  const status = useAppStore((s) => s.aiStatus);
  const mode = useAppStore((s) => s.aiMode);
  const liveAvailable = useAppStore((s) => s.aiLiveAvailable);
  const effectiveStatus: AIStatus =
    status === 'fallback'
      ? 'fallback'
      : liveAvailable && mode === 'live'
      ? 'live'
      : status;
  const label = LABELS[effectiveStatus] || LABELS[status];

  return (
    <span
      className={`ai-source-badge ${className}`.trim()}
      data-status={effectiveStatus}
      title={label.title}
    >
      <span className="ai-source-dot" aria-hidden="true" />
      {compact ? label.compact : label.full}
    </span>
  );
};
