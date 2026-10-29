import React from 'react';

interface ToastProps {
  message: string;
  visible?: boolean;
  onClick?: () => void;
  tone?: 'amber' | 'blue';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible = true,
  onClick,
  tone = 'amber',
}) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-toast toast-${tone}`}
      data-clickable={Boolean(onClick)}
    >
      <span className="app-toast-dot" />
      <span>{message}</span>
      {onClick && <span className="app-toast-hint">bấm để mở →</span>}
    </button>
  );
};
