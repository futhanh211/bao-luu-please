import React from 'react';

export const Terminal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="crt-screen"
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--crt-dim)',
        boxShadow: 'var(--shadow-hard)',
        minHeight: '200px',
      }}
    >
      {children}
    </div>
  );
};
