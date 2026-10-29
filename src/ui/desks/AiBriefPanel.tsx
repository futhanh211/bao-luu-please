import React from 'react';
import { ReviewerBrief } from '../../engine/types';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { AiBadge } from '../kit/AiBadge';
import { AiText } from '../kit/AiText';

interface AiBriefPanelProps {
  brief: ReviewerBrief | null;
  loading: boolean;
  onAsk: () => void;
  label?: string;
}

/** Nhãn tiếng Việt cho đề xuất thô của AI — UI không bao giờ hiện confirm/decline. */
const DECISION_LABEL: Record<ReviewerBrief['suggestedDecision'], string> = {
  confirm: 'XÁC NHẬN',
  decline: 'KHÔNG XÁC NHẬN',
  valid: 'HỢP LỆ',
  invalid: 'KHÔNG HỢP LỆ',
};

/** Khung "AI đề xuất" — xanh dương, tách khỏi giấy tờ và con dấu của người. */
export const AiBriefPanel: React.FC<AiBriefPanelProps> = ({
  brief,
  loading,
  onAsk,
  label = 'AI đề xuất cho người duyệt',
}) => {
  const aiStatus = useAppStore((s) => s.aiStatus);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  return (
    <aside className="ai-brief">
      <div className="ai-brief-head">
        {!isCustomFlow && <AiBadge />}
        <span>{isCustomFlow ? 'Đề xuất tham khảo cho người duyệt' : label}</span>
      </div>

      {!brief && !loading && (
        <div className="ai-brief-body">
          <p>Tóm tắt hồ sơ, điểm cần chú ý và đề xuất — chỉ để tham khảo.</p>
          <button type="button" className="ai-ask" onClick={onAsk}>
            {isCustomFlow ? '📋 Xem gợi ý xử lý' : '🤖 Hỏi AI'}
          </button>
        </div>
      )}

      {loading && (
        <div className="ai-brief-body">
          <div className="ai-thinking">
            <span>{isCustomFlow ? 'Hệ thống đang kiểm tra hồ sơ…' : 'AI đang đọc hồ sơ…'}</span>
            <span className="ai-dots">
              <i>.</i>
              <i>.</i>
              <i>.</i>
            </span>
          </div>
        </div>
      )}

      {brief && !loading && (
        <div className="ai-brief-body">
          <p className="ai-summary">
            <AiText text={brief.summary} style={{ fontFamily: 'var(--font-read)', fontSize: 15, lineHeight: 1.55 }} />
          </p>
          <ul className="ai-points">
            {brief.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="ai-suggestion">
            Đề xuất: <strong>{DECISION_LABEL[brief.suggestedDecision]}</strong>
            <div className="ai-rationale">{brief.rationale}</div>
          </div>
          {!isCustomFlow && aiStatus === 'fallback' && (
            <div className="ai-fallback-note">
              AI LIVE không phản hồi — đã chuyển sang MOCK (fallback).
            </div>
          )}
          <div className="ai-footnote">Quyết định cuối cùng thuộc về người bấm dấu.</div>
        </div>
      )}
    </aside>
  );
};
