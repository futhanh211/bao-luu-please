import React, { useEffect } from 'react';
import { EvidenceItem } from '../../../engine/types';
import { Paperclip } from '../../kit/Paperclip';
import { sfx } from '../../audio/sfx';

interface Props {
  item: EvidenceItem;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ item, onClose }) => {
  useEffect(() => {
    sfx.playPaperSlide();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        backgroundColor: 'var(--overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-sheet paper-lifted"
        style={{
          width: 'min(560px, 92vw)',
          maxHeight: '86vh',
          overflowY: 'auto',
          padding: '26px 30px',
          transform: 'rotate(-0.6deg)',
          boxShadow: 'var(--shadow-paper-lg)',
          position: 'relative',
        }}
      >
        <Paperclip position="top-right" angle={12} />
        <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-soft)' }}>
            TỜ MINH CHỨNG ĐÃ SỐ HÓA
          </div>
          <h3 style={{ fontFamily: 'var(--font-paper)', fontSize: 18, lineHeight: 1.3, marginTop: 6 }}>
            {item.name}
          </h3>
        </div>

        <div style={{ fontFamily: 'var(--font-paper)', fontSize: 14, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 10 }}>{item.content}</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12 }}>
            Loại giấy tờ: {item.type} · Mã: {item.id}
          </p>
          {item.issueNotes && (
            <p
              style={{
                marginTop: 12,
                padding: 8,
                border: '1px dashed var(--amber)',
                background: 'var(--wash-amber)',
                fontSize: 12,
              }}
            >
              Ghi chú thẩm tra hồ sơ: {item.issueNotes}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            padding: '6px 16px',
            fontFamily: 'var(--font-paper)',
            fontSize: 13,
            background: 'var(--desk-900)',
            color: 'var(--paper)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Đóng tờ giấy
        </button>
      </div>
    </div>
  );
};
