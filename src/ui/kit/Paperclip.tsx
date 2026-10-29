import React from 'react';

interface PaperclipProps {
  position?: 'top-left' | 'top-right' | 'relative';
  size?: 'sm' | 'md' | 'lg';
  angle?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const SIZES = {
  sm: { width: 16, height: 42 },
  md: { width: 22, height: 56 },
  lg: { width: 28, height: 72 },
};

/**
 * Kẹp ghim kim loại (Paperclip) vector SVG tả thực.
 * Kẹp vào mép tài liệu với ánh kim mạ crom và bóng đổ 3D.
 */
export const Paperclip: React.FC<PaperclipProps> = ({
  position = 'top-left',
  size = 'md',
  angle = -12,
  className = '',
  style = {},
  onClick,
}) => {
  const { width, height } = SIZES[size];

  const positionStyles: React.CSSProperties =
    position === 'relative'
      ? {}
      : position === 'top-left'
        ? { position: 'absolute', top: -14, left: 24, zIndex: 15 }
        : { position: 'absolute', top: -14, right: 24, zIndex: 15 };

  return (
    <div
      className={`paperclip-wrapper ${className}`}
      style={{
        ...positionStyles,
        display: 'inline-block',
        transform: `rotate(${angle}deg)`,
        filter: 'drop-shadow(2px 3px 2px rgba(10, 10, 8, 0.45))',
        pointerEvents: onClick ? 'auto' : 'none',
        cursor: onClick ? 'var(--cursor-pointer)' : 'var(--cursor-default)',
        ...style,
      }}
      onClick={onClick}
      title="Kẹp tài liệu kim loại"
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="metal-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a8289" />
            <stop offset="35%" stopColor="#f3f5f8" />
            <stop offset="65%" stopColor="#c5cbd2" />
            <stop offset="100%" stopColor="#5d656d" />
          </linearGradient>
          <linearGradient id="metal-sheen-back" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#555c63" />
            <stop offset="50%" stopColor="#8d97a0" />
            <stop offset="100%" stopColor="#444a50" />
          </linearGradient>
        </defs>

        {/* Vòng kẹp sau (lẩn dưới giấy) */}
        <path
          d="M 12 18 L 12 48 C 12 54 18 54 18 48 L 18 10 C 18 3 6 3 6 10 L 6 36"
          stroke="url(#metal-sheen-back)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />

        {/* Vòng kẹp trước (đè lên mặt giấy) */}
        <path
          d="M 6 36 L 6 52 C 6 60 21 60 21 50 L 21 16 C 21 6 3 6 3 18 L 3 46 C 3 52 9 52 9 46 L 9 20"
          stroke="url(#metal-sheen)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
