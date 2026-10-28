import React from 'react';

interface PaperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rotation?: number; // e.g. -1 to 1 degree for realism
  width?: string | number;
  minHeight?: string | number;
}

export const Paper: React.FC<PaperProps> = ({
  children,
  className = '',
  style = {},
  rotation = 0,
  width,
  minHeight,
}) => {
  return (
    <div
      className={`paper-sheet ${className}`}
      style={{
        width,
        minHeight,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        padding: '28px 32px',
        border: '1px solid var(--paper-line)',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
