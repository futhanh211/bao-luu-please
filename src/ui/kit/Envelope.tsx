import React from 'react';

export const Envelope: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div
      style={{
        width: 140,
        height: 90,
        backgroundColor: 'var(--paper-dim)',
        border: '1px solid var(--paper-line)',
        boxShadow: 'var(--shadow-paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-paper)',
        fontSize: '14px',
      }}
    >
      ✉️ {label || 'Bì thư'}
    </div>
  );
};
