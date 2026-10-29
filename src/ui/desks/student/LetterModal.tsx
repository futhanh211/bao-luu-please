import React, { useEffect } from 'react';
import { LetterDoc } from '../../../data/letters';
import { Stamp } from '../../kit/Stamp';
import { AiBadge } from '../../kit/AiBadge';
import { usePlaybackStore } from '../../../store/playback';
import { useAppStore } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface Props {
  letter: LetterDoc;
  onClose: () => void;
}

export const LetterModal: React.FC<Props> = ({ letter, onClose }) => {
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  useEffect(() => {
    sfx.playPaperSlide();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
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
          width: 'min(640px, 92vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '28px 34px',
          transform: 'rotate(0.4deg)',
          boxShadow: 'var(--shadow-paper-lg)',
          position: 'relative',
        }}
      >
        {/* Dấu chìm Watermark Trường ĐH Kinh tế */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.05,
            overflow: 'hidden',
          }}
        >
          <svg width="300" height="300" viewBox="0 0 200 200" style={{ transform: 'rotate(-8deg)' }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="100" y="44" textAnchor="middle" fontSize="10" fontWeight="bold">TRƯỜNG ĐH KINH TẾ</text>
            <text x="100" y="165" textAnchor="middle" fontSize="9" fontWeight="bold">ĐẠI HỌC ĐÀ NẴNG</text>
            <polygon points="100,75 106,90 122,90 110,100 115,115 100,105 85,115 90,100 78,90 94,90" fill="currentColor" />
          </svg>
        </div>

        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 1, color: 'var(--ink-soft)' }}>
            TRƯỜNG ĐH KINH TẾ — ĐH ĐÀ NẴNG · PHÒNG CÔNG TÁC SINH VIÊN
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: 19,
              lineHeight: 1.3,
              marginTop: 8,
              textTransform: 'uppercase',
            }}
          >
            {letter.title}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
            Số hiệu: {letter.flowId}-{String(letter.day).padStart(2, '0')} · {isCustomFlow ? `Ngày làm việc ${letter.day}` : `Ngày giả lập ${letter.day}`}
          </div>
        </div>

        {letter.signed && (
          <div style={{ position: 'absolute', right: 26, top: 92, transform: 'rotate(-8deg)', zIndex: 2 }}>
            <Stamp label="ĐÃ KÝ SỐ" color="red" />
          </div>
        )}

        <div style={{ fontFamily: 'var(--font-paper)', fontSize: 13.5, lineHeight: 1.65, marginTop: 14, position: 'relative', zIndex: 1 }}>
          <p style={{ marginBottom: 12 }}>{letter.intro}</p>

          {letter.aiGenerated && !isCustomFlow && (
            <div className="letter-ai-note">
              <AiBadge compact />
              <span>Nội dung do AI soạn (AI-4) · Hệ thống gửi tự động theo quy trình.</span>
            </div>
          )}

          {letter.sections.map((section) => (
            <div key={section.heading} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{section.heading}</div>
              {section.lines.map((line, i) => (
                <div key={`${section.heading}-${i}`} style={{ marginLeft: 6, marginBottom: 2 }}>
                  {line}
                </div>
              ))}
            </div>
          ))}

          {letter.attachments.length > 0 && (
            <div
              style={{
                border: '1px dashed var(--paper-line)',
                background: 'var(--paper-dim)',
                padding: 8,
                fontSize: 12,
                marginTop: 10,
              }}
            >
              📎 Tệp đính kèm: {letter.attachments.join(' · ')}
            </div>
          )}

          <div style={{ marginTop: 16, whiteSpace: 'pre-line', fontSize: 12, color: 'var(--ink-soft)' }}>
            {letter.footer}
          </div>

          {letter.signed && letter.signerName && (
            <div style={{ marginTop: 14, textAlign: 'right', fontSize: 12 }}>
              <div style={{ fontStyle: 'italic' }}>Ký số bởi: {letter.signerName}</div>
              <div style={{ fontFamily: 'var(--font-hud)', color: 'var(--stamp-blue)', fontSize: 15 }}>
                ✍️ CHỮ KÝ SỐ HỢP LỆ
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
            {isCustomFlow
              ? 'Hệ thống Một cửa điện tử · Thư thông báo tự động theo quy trình'
              : 'Dữ liệu giả lập · Thư soạn theo mẫu của quy trình'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-paper)',
              fontSize: 13,
              background: 'var(--desk-900)',
              color: 'var(--paper)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Gấp thư lại
          </button>
        </div>
      </div>
    </div>
  );
};
