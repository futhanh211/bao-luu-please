import React from 'react';
import { Paperclip } from './Paperclip';

export interface PaperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rotation?: number; // e.g. -1 to 1 degree for realism
  width?: string | number;
  minHeight?: string | number;
  watermark?: boolean | string;
  creased?: boolean;
  elevated?: boolean;
  deckle?: boolean;
  clip?: boolean | 'top-left' | 'top-right';
  onClick?: () => void;
}

/**
 * Tờ giấy hành chính hoài cổ (Paper 2.0).
 * Hỗ trợ dấu chìm Watermark trường học, nếp gấp giấy A4 (crease),
 * mép giấy sờn (deckle) và kẹp ghim tài liệu kim loại (clip).
 */
export const Paper: React.FC<PaperProps> = ({
  children,
  className = '',
  style = {},
  rotation = 0,
  width,
  minHeight,
  watermark = false,
  creased = false,
  elevated = false,
  deckle = false,
  clip = false,
  onClick,
}) => {
  const clipPosition = typeof clip === 'string' ? clip : 'top-left';

  return (
    <div
      className={`paper-sheet ${elevated ? 'paper-lifted' : ''} ${deckle ? 'paper-deckle' : ''} ${className}`}
      onClick={onClick}
      style={{
        width,
        minHeight,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        padding: '28px 32px',
        border: '1px solid var(--paper-line)',
        position: 'relative',
        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease',
        ...style,
      }}
    >
      {/* Kẹp tài liệu kim loại */}
      {clip && <Paperclip position={clipPosition} />}

      {/* Nếp gấp giấy A4 xếp 3 (Trifold Creases) */}
      {creased && (
        <div
          className="paper-crease-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background:
              'linear-gradient(to bottom, transparent 32%, rgba(10, 10, 8, 0.03) 33%, rgba(255, 255, 255, 0.18) 33.5%, transparent 35%, transparent 65%, rgba(10, 10, 8, 0.03) 66%, rgba(255, 255, 255, 0.18) 66.5%, transparent 68%)',
          }}
        />
      )}

      {/* Dấu chìm Watermark trường học ĐH Kinh tế – ĐH Đà Nẵng */}
      {watermark && (
        <div
          className="paper-watermark-container"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <svg
            width="280"
            height="280"
            viewBox="0 0 200 200"
            style={{
              opacity: 0.05,
              transform: 'rotate(-12deg)',
            }}
          >
            {/* Vòng tròn kép ngoài */}
            <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />

            {/* Chữ viền tròn */}
            <path
              id="watermark-arc-top"
              d="M 25 100 A 75 75 0 0 1 175 100"
              fill="none"
            />
            <path
              id="watermark-arc-bottom"
              d="M 175 100 A 75 75 0 0 1 25 100"
              fill="none"
            />
            <text fill="currentColor" fontSize="9.5" fontWeight="bold" letterSpacing="1.2">
              <textPath href="#watermark-arc-top" startOffset="50%" textAnchor="middle">
                TRƯỜNG ĐẠI HỌC KINH TẾ
              </textPath>
            </text>
            <text fill="currentColor" fontSize="8.5" fontWeight="bold" letterSpacing="1">
              <textPath href="#watermark-arc-bottom" startOffset="50%" textAnchor="middle">
                ★ ĐẠI HỌC ĐÀ NẴNG ★
              </textPath>
            </text>

            {/* Biểu tượng trung tâm: Quyển sách mở & Ngôi sao */}
            <g transform="translate(100, 100) scale(0.75)">
              <polygon points="0,-28 7,-10 26,-10 11,2 17,20 0,9 -17,20 -11,2 -26,-10 -7,-10" fill="currentColor" />
              <path
                d="M -30 18 Q 0 8 30 18 L 30 24 Q 0 14 -30 24 Z"
                fill="currentColor"
              />
              <path
                d="M -30 26 Q 0 16 30 26 L 30 32 Q 0 22 -30 32 Z"
                fill="currentColor"
              />
            </g>
          </svg>
        </div>
      )}

      {/* Nội dung tài liệu */}
      <div style={{ position: 'relative', zIndex: 2, minWidth: 0, width: '100%', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
};
