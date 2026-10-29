import React from 'react';
import { useAppStore, ROLES } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { useAuthStore } from '../../store/useAuth';
import { AUTO_TASK_IDS } from '../map/mapState';
import { sfx } from '../audio/sfx';

export const RoleTabs: React.FC = () => {
  const currentRole = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const waitingTaskIds = usePlaybackStore((s) => s.waitingTaskIds);
  const mapState = usePlaybackStore((s) => s.mapState);
  const currentUser = useAuthStore((s) => s.currentUser);
  const canAccessRole = useAuthStore((s) => s.canAccessRole);

  const activeNodeId = mapState.activeNodeId;
  const systemBusy =
    Boolean(activeNodeId) &&
    AUTO_TASK_IDS.includes(activeNodeId ?? '') &&
    mapState.nodeStates[activeNodeId ?? ''] === 'active';

  const hasWork = (roleId: string): boolean => {
    if (roleId === 'advisor') return waitingTaskIds.includes('T4');
    if (roleId === 'ctsv') return waitingTaskIds.includes('T5');
    if (roleId === 'principal') return waitingTaskIds.includes('T9');
    if (roleId === 'system') return systemBusy;
    return false;
  };

  return (
    <div className={`hud-role-tabs ${currentUser ? 'has-auth' : ''}`}>
      {ROLES.map((r) => {
        const isActive = currentRole === r.id;
        const busy = hasWork(r.id);
        const allowed = canAccessRole(r.id);

        return (
          <button
            key={r.id}
            onClick={() => {
              if (!allowed) {
                sfx.play('buzz');
                return;
              }
              setRole(r.id);
            }}
            className={`hud-role-btn ${!allowed ? 'is-locked' : ''} ${isActive ? 'is-active' : ''}`}
            style={{
              fontWeight: isActive ? 'bold' : 'normal',
              color: allowed ? (isActive ? 'var(--ink)' : 'var(--paper-dim)') : 'var(--desk-500)',
              backgroundColor: isActive ? 'var(--paper)' : 'transparent',
              boxShadow: isActive ? 'var(--shadow-hard)' : 'none',
              cursor: allowed ? 'var(--cursor-pointer)' : 'not-allowed',
              opacity: allowed ? 1 : 0.45,
            }}
            title={
              !allowed
                ? `Tài khoản ${currentUser?.name} không có quyền truy cập bàn ${r.label}`
                : `Chuyển sang bàn ${r.label} (Phím ${r.shortKey})`
            }
          >
            <span
              className="hud-role-key"
              style={{
                color: isActive ? 'var(--paper)' : 'var(--paper-dim)',
              }}
            >
              {allowed ? r.shortKey : '🔒'}
            </span>
            {allowed ? (
              <>
                <span className="role-tab-full">{r.label}</span>
                <span className="role-tab-short">{r.shortLabel}</span>
              </>
            ) : (
              <span className="role-tab-locked">{r.shortLabel}</span>
            )}
            {busy && allowed && (
              <span
                className="role-work-dot"
                data-reduced={reducedMotion}
                title={
                  r.id === 'system'
                    ? 'Hệ thống đang chạy tác vụ tự động'
                    : 'Có hồ sơ đang chờ bạn xử lý'
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
