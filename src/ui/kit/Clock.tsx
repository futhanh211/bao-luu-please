import React from 'react';

export const Clock: React.FC<{ day: number }> = ({ day }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'var(--desk-700)',
        border: '1px solid var(--desk-500)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--amber)',
        fontFamily: 'var(--font-hud)',
        fontSize: '20px',
      }}
    >
      <span>⏱</span>
      <span>NGÀY {day}</span>
    </div>
  );
};
