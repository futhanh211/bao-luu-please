import React from 'react';
import { LetterDoc } from '../../../data/letters';
import { MOTION } from '../../motion';
import { useAppStore } from '../../../store/useApp';

interface Props {
  letters: LetterDoc[];
  readIds: string[];
  onOpen: (letter: LetterDoc) => void;
}

const FLOW_BADGE: Record<string, string> = {
  MF2: 'TRẢ HỒ SƠ',
  MF3: 'TỪ CHỐI',
  MF4: 'QUYẾT ĐỊNH',
};

export const InboxTab: React.FC<Props> = ({ letters, readIds, onOpen }) => {
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  if (letters.length === 0) {
    return (
      <div className="student-dropzone" style={{ textAlign: 'center', padding: 18 }}>
        Hộp thư trống.
        <br />
        Thư của Nhà trường sẽ trượt vào đây sau khi bạn nộp đơn.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {letters
        .slice()
        .reverse()
        .map((letter) => {
          const unread = !readIds.includes(letter.id);
          return (
            <button
              key={letter.id}
              onClick={() => onOpen(letter)}
              style={{
                textAlign: 'left',
                background: 'var(--paper)',
                border: `1px solid ${unread ? 'var(--stamp-blue)' : 'var(--paper-line)'}`,
                borderLeft: `4px solid ${letter.signed ? 'var(--stamp-red)' : 'var(--paper-line)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '9px 10px',
                boxShadow: 'var(--shadow-paper)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-paper)',
                animation: reducedMotion ? 'none' : `letter-slide ${MOTION.letterSlideMs}ms ease-out`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10 }}>
                <span style={{ color: unread ? 'var(--stamp-red)' : 'var(--ink-soft)' }}>
                  {FLOW_BADGE[letter.flowId] || letter.flowId} · NGÀY {letter.day}
                </span>
                {unread && <span style={{ color: 'var(--stamp-red)' }}>● MỚI</span>}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 'bold', margin: '4px 0 2px', lineHeight: 1.35 }}>
                {letter.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                {letter.intro.slice(0, 90)}
                {letter.intro.length > 90 ? '…' : ''}
              </div>
            </button>
          );
        })}
    </div>
  );
};
