import React from 'react';

export const Toast: React.FC<{ message: string; visible?: boolean }> = ({ message, visible = true }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: '12px 20px',
        backgroundColor: 'var(--amber)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-paper)',
        fontWeight: 'bold',
        boxShadow: 'var(--shadow-paper-lg)',
        borderRadius: 'var(--radius-sm)',
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  );
};
