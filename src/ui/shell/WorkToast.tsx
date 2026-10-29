import React, { useEffect, useState } from 'react';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore, Role } from '../../store/useApp';
import { useAuthStore } from '../../store/useAuth';
import { Toast } from '../kit/Toast';
import { DESK_LABEL, DeskKey } from '../desks/deskState';

const TASK_TO_DESK: Record<string, DeskKey> = {
  T4: 'advisor',
  T5: 'ctsv',
  T9: 'principal',
};

const TASK_TO_ROLE: Record<string, Role> = {
  T4: 'advisor',
  T5: 'ctsv',
  T9: 'principal',
};

/** Nhắc "có việc mới" nhưng KHÔNG tự chuyển vai — người thuyết trình giữ quyền. */
export const WorkToast: React.FC = () => {
  const waitingTaskId = usePlaybackStore((s) => s.waitingTaskId);
  const setRole = useAppStore((s) => s.setRole);
  const currentRole = useAppStore((s) => s.role);
  const currentUser = useAuthStore((s) => s.currentUser);
  const canAccessRole = useAuthStore((s) => s.canAccessRole);
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!waitingTaskId || !TASK_TO_DESK[waitingTaskId]) {
      setTaskId(null);
      return;
    }
    // Sinh viên không hiển thị toast thông báo bàn làm việc của cán bộ
    if (currentUser?.type === 'student') {
      setTaskId(null);
      return;
    }
    setTaskId(waitingTaskId);
    const timer = setTimeout(() => setTaskId(null), 5000);
    return () => clearTimeout(timer);
  }, [waitingTaskId, currentUser]);

  if (!taskId) return null;

  const desk = TASK_TO_DESK[taskId];
  const role = TASK_TO_ROLE[taskId];
  // Đang đứng ngay bàn đó hoặc không có quyền truy cập bàn đó thì không nhắc
  if (role === currentRole || !canAccessRole(role)) return null;

  return (
    <Toast
      message={`Có việc mới ở bàn ${DESK_LABEL[desk]}`}
      onClick={() => {
        setRole(role);
        setTaskId(null);
      }}
    />
  );
};
