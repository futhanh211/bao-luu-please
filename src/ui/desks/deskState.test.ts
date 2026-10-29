import { describe, it, expect } from 'vitest';
import { EngineEvent } from '../../engine/types';
import {
  computeSlaDays,
  findTaskAssignedDay,
  getActiveDesk,
  getDeskPhase,
  isSlaOverdue,
  hasTimerFired,
  isHumanContrary,
} from './deskState';

const assigned = (taskId: string): EngineEvent => ({
  type: 'task.assigned',
  nodeId: taskId,
  lane: 'L2',
  taskId,
});

const completed = (taskId: string): EngineEvent => ({
  type: 'task.completed',
  nodeId: taskId,
  taskId,
  outcome: 'confirmed',
});

describe('deskState · chọn bàn có việc', () => {
  it('chỉ bàn đang giữ task waiting mới có việc', () => {
    expect(getActiveDesk('T4')).toBe('advisor');
    expect(getActiveDesk('T5')).toBe('ctsv');
    expect(getActiveDesk('T9')).toBe('principal');
    expect(getActiveDesk(null)).toBeNull();
    expect(getActiveDesk('T1')).toBeNull();
  });

  it('phân biệt chưa nộp / đang chờ / đã xử lý / ca kết thúc', () => {
    const base = {
      submitted: true,
      waitingTaskId: null,
      caseEnded: false,
      completedTaskIds: [],
      taskId: 'T4' as const,
    };
    expect(getDeskPhase({ ...base, submitted: false })).toBe('not-submitted');
    expect(getDeskPhase({ ...base, waitingTaskId: 'T4' })).toBe('waiting');
    expect(getDeskPhase({ ...base, waitingTaskId: 'T5', waitingTaskIds: ['T4', 'T5'] })).toBe(
      'waiting'
    );
    expect(getDeskPhase({ ...base, completedTaskIds: ['T4'], caseEnded: true })).toBe('done');
    expect(getDeskPhase({ ...base, caseEnded: true })).toBe('ended');
    expect(getDeskPhase(base)).toBe('upcoming');
  });

  it('SLA tính từ ngày giao T4 trong log, không phải ngày 0', () => {
    const log = [assigned('T4'), completed('T4')];
    const days = [2, 2];
    expect(findTaskAssignedDay(log, days, 'T4')).toBe(2);
    expect(computeSlaDays(2, 5)).toBe(3);
    expect(computeSlaDays(null, 9)).toBe(0);
    expect(isSlaOverdue(2)).toBe(false);
    expect(isSlaOverdue(3)).toBe(true);
  });

  it('nhận ra timer đã bắn', () => {
    expect(hasTimerFired([])).toBe(false);
    expect(
      hasTimerFired([{ type: 'timer.fired', timerId: 'BT1', targetNodeId: 'T4', day: 3 }])
    ).toBe(true);
  });

  it('so sánh Người ≠ AI không lệch vì khác cách viết', () => {
    expect(isHumanContrary('confirmed', 'confirm')).toBe(false);
    expect(isHumanContrary('confirmed', 'decline')).toBe(true);
    expect(isHumanContrary('valid', 'valid')).toBe(false);
    expect(isHumanContrary('invalid', 'valid')).toBe(true);
    expect(isHumanContrary('confirmed', null)).toBe(false);
  });
});
