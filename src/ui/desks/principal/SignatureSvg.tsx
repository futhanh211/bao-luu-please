import React from 'react';

interface SignatureSvgProps {
  active: boolean;
  complete: boolean;
  durationMs: number;
  signerName?: string;
}

/** Nét chữ ký vẽ bằng SVG path (stroke-dashoffset), 1200ms/speed. */
export const SignatureSvg: React.FC<SignatureSvgProps> = ({
  active,
  complete,
  durationMs,
  signerName,
}) => (
  <div className="signature-box" data-active={active ? 'true' : 'false'}>
    <svg viewBox="0 0 260 80" width="100%" height="80" aria-label="Chữ ký điện tử">
      <path
        d="M10 58 C 26 12, 40 12, 46 44 C 50 62, 56 60, 62 40 C 68 18, 78 16, 82 44 C 86 64, 96 62, 104 40 C 112 18, 122 20, 126 46 C 130 66, 142 60, 150 44 C 160 24, 172 26, 178 48 C 184 68, 196 60, 208 42 C 218 28, 232 30, 246 44"
        fill="none"
        stroke="var(--stamp-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        className="signature-path"
        data-complete={complete ? 'true' : 'false'}
        style={
          {
            '--sign-ms': `${durationMs}ms`,
            strokeDasharray: 1,
            strokeDashoffset: complete ? 0 : 1,
            animation: active && !complete ? 'sign-draw var(--sign-ms) linear forwards' : 'none',
          } as React.CSSProperties
        }
      />
      <line x1="10" y1="70" x2="250" y2="70" stroke="var(--ink-soft)" strokeWidth="1" />
    </svg>
    <div className="signature-name">{signerName ?? 'Người ký số'}</div>
  </div>
);
