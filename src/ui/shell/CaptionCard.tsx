import React, { useEffect, useState } from 'react';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore } from '../../store/useApp';
import { NODE_CAPTIONS } from '../../data/node-captions';
import { PROCESS_DEF } from '../../engine/process.def';

interface CaptionCardProps {
  /** Overlay bản đồ toàn màn hình cần nổi trên canvas; mặc định là thanh gắn đáy khung. */
  floating?: boolean;
}

export const CaptionCard: React.FC<CaptionCardProps> = ({ floating = false }) => {
  const activeCaptionNodeId = usePlaybackStore((s) => s.activeCaptionNodeId);
  const captionPinned = useAppStore((s) => s.captionPinned);
  const toggleCaptionPinned = useAppStore((s) => s.toggleCaptionPinned);
  const speed = useAppStore((s) => s.speed) || 1;
  const miniMapVisible = useAppStore((s) => s.miniMapVisible);

  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    if (activeCaptionNodeId && NODE_CAPTIONS[activeCaptionNodeId]) {
      setCurrentId(activeCaptionNodeId);
      setVisible(true);

      if (!captionPinned) {
        const timeoutMs = Math.max(3000, 6000 / speed);
        const timer = setTimeout(() => {
          setVisible(false);
        }, timeoutMs);
        return () => clearTimeout(timer);
      }
    }
  }, [activeCaptionNodeId, captionPinned, speed]);

  if (!visible || !currentId) return null;

  const node = PROCESS_DEF.nodes.find((n) => n.id === currentId);
  const caption = NODE_CAPTIONS[currentId];
  if (!caption) return null;

  const icon =
    node?.type === 'serviceTask'
      ? '⚙️'
      : node?.type === 'sendTask'
        ? '✉️'
        : node?.type === 'businessRuleTask'
          ? '📊'
          : '👤';

  const card = (
    <div
      className="caption-bar"
      style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        border: '2px solid var(--paper-line)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: floating ? 'var(--shadow-paper-lg)' : 'var(--shadow-paper)',
        padding: '8px 14px 9px',
        fontFamily: 'var(--font-paper)',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--paper-line)',
          paddingBottom: 4,
          marginBottom: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 17 }}>{icon}</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            [{currentId}] {node?.name}
          </span>
        </div>

        <button
          onClick={toggleCaptionPinned}
          style={{
            flex: 'none',
            fontSize: 12,
            padding: '1px 7px',
            backgroundColor: captionPinned ? 'var(--amber)' : 'var(--paper-dim)',
            color: 'var(--ink)',
            borderRadius: 2,
            border: '1px solid var(--paper-line)',
          }}
          title="Ghim caption (Phím P)"
        >
          {captionPinned ? '📌 Đã ghim' : 'Ghim (P)'}
        </button>
      </div>

      <div className="caption-bar-body">
        <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--stamp-blue)' }}>Vì sao tự động hóa:</strong>{' '}
          {caption.whyAutomated}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.4, color: 'var(--ink-soft)' }}>
          <strong style={{ color: 'var(--stamp-green)' }}>Vì sao ký hiệu này:</strong>{' '}
          {caption.whySymbol}
        </div>
      </div>
    </div>
  );

  if (floating) {
    return (
      <div style={{ position: 'absolute', bottom: 18, left: 18, width: 'min(560px, 52vw)', zIndex: 100 }}>
        {card}
      </div>
    );
  }

  // Thanh gắn đáy khung: chiếm chỗ trong layout nên không bao giờ che tờ giấy.
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        padding: miniMapVisible ? '0 392px 10px 20px' : '0 20px 10px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', width: 'min(880px, 100%)' }}>{card}</div>
    </div>
  );
};
