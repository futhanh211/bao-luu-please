import React from 'react';

interface StampProps {
  text: string;
  variant?: 'red' | 'green' | 'blue';
  angle?: number;
}

export const Stamp: React.FC<StampProps> = ({
  text,
  variant = 'red',
  angle = -6,
}) => {
  const colorMap = {
    red: 'var(--stamp-red)',
    green: 'var(--stamp-green)',
    blue: 'var(--stamp-blue)',
  };

  return (
    <div
      style={{
        display: 'inline-block',
        border: `3px dashed ${colorMap[variant]}`,
        color: colorMap[variant],
        padding: '6px 14px',
        fontWeight: 'bold',
        fontSize: '18px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transform: `rotate(${angle}deg)`,
        fontFamily: 'var(--font-paper)',
        userSelect: 'none',
        boxShadow: 'var(--shadow-stamp)',
      }}
    >
      {text}
    </div>
  );
};
