import React from 'react';
import { useAppStore, ROLES } from '../../store/useApp';

export const RoleTabs: React.FC = () => {
  const currentRole = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--desk-900)',
        padding: '3px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--desk-700)',
      }}
    >
      {ROLES.map((r) => {
        const isActive = currentRole === r.id;
        return (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            style={{
              padding: '6px 12px',
              fontFamily: 'var(--font-paper)',
              fontSize: '15px',
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? 'var(--ink)' : 'var(--paper-dim)',
              backgroundColor: isActive ? 'var(--paper)' : 'transparent',
              borderRadius: 'var(--radius-sm)',
              boxShadow: isActive ? 'var(--shadow-hard)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title={`Phím tắt: ${r.shortKey}`}
          >
            <span
              style={{
                fontSize: '11px',
                padding: '1px 4px',
                backgroundColor: isActive ? 'var(--desk-700)' : 'var(--desk-700)',
                color: isActive ? 'var(--paper)' : 'var(--paper-dim)',
                borderRadius: '2px',
                fontFamily: 'var(--font-hud)',
              }}
            >
              {r.shortKey}
            </span>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
