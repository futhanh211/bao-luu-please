import { EngineEvent } from '../../engine/types';

export type DeskKey = 'advisor' | 'ctsv' | 'principal';
export type DeskPhase = 'not-submitted' | 'waiting' | 'done' | 'upcoming' | 'ended';

export const DESK_TASK: Record<DeskKey, 'T4' | 'T5' | 'T9'> = {
  advisor: 'T4',
  ctsv: 'T5',
  principal: 'T9',
};

export const DESK_LABEL: Record<DeskKey, string> = {
  advisor: 'Cố vấn',
  ctsv: 'CTSV',
  principal: 'BGH',
};

export interface DeskStateInput {
  submitted: boolean;
  waitingTaskId: string | null;
  /** T4 và T5 có thể cùng chờ (nhánh song song) — ưu tiên danh sách này khi có. */
  waitingTaskIds?: string[];
  caseEnded: boolean;
  completedTaskIds: string[];
  taskId: 'T4' | 'T5' | 'T9';
}

/** Suy ra trạng thái bàn từ trạng thái ca (thuần, dùng cho test + UI). */
export function getDeskPhase(input: DeskStateInput): DeskPhase {
  const waiting = input.waitingTaskIds ?? (input.waitingTaskId ? [input.waitingTaskId] : []);
  if (waiting.includes(input.taskId)) return 'waiting';
  if (input.completedTaskIds.includes(input.taskId)) return 'done';
  if (!input.submitted) return 'not-submitted';
  if (input.caseEnded) return 'ended';
  return 'upcoming';
}

/** Bàn nào đang thực sự có việc chờ người bấm. */
export function getActiveDesk(waitingTaskId: string | null): DeskKey | null {
  const entry = (Object.keys(DESK_TASK) as DeskKey[]).find(
    (desk) => DESK_TASK[desk] === waitingTaskId
  );
  return entry ?? null;
}

export const SLA_DAY_LIMIT = 3;

/**
 * Ngày giao T4 lấy từ log + mảng ngày song song (UI đã ghi ngày tại thời điểm event).
 */
export function findTaskAssignedDay(
  log: EngineEvent[],
  eventDays: number[],
  taskId: string
): number | null {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const event = log[i];
    if (event.type === 'task.assigned' && event.nodeId === taskId) {
      return eventDays[i] ?? 0;
    }
  }
  return null;
}

export function computeSlaDays(assignedDay: number | null, currentDay: number): number {
  if (assignedDay === null) return 0;
  return Math.max(0, currentDay - assignedDay);
}

export function isSlaOverdue(waitedDays: number): boolean {
  return waitedDays >= SLA_DAY_LIMIT;
}

export function hasTimerFired(log: EngineEvent[]): boolean {
  return log.some((event) => event.type === 'timer.fired');
}

/**
 * AI dùng động từ ngắn (confirm/decline/valid/invalid), người bấm dấu dùng
 * trạng thái của engine (confirmed/declined/valid/invalid). Chuẩn hóa để so sánh
 * "Người ≠ AI" không báo sai chỉ vì khác cách viết.
 */
export function normalizeHumanOutcome(value: string | null | undefined): string {
  if (!value) return '';
  if (value === 'confirm') return 'confirmed';
  if (value === 'decline') return 'declined';
  return value;
}

export function isHumanContrary(human: string, ai: string | null | undefined): boolean {
  if (!ai) return false;
  return normalizeHumanOutcome(human) !== normalizeHumanOutcome(ai);
}
