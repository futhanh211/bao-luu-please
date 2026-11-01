import { useMemo } from 'react';
import { usePlaybackStore } from '../../store/playback';
import { EngineInstance } from '../../engine/engine';
import { EngineEvent, StudentRecord } from '../../engine/types';
import { ScenarioConfig } from '../../data/scenarios';
import {
  DESK_TASK,
  DeskKey,
  DeskPhase,
  computeSlaDays,
  findTaskAssignedDay,
  getDeskPhase,
} from './deskState';

export interface CaseView {
  scenario: ScenarioConfig | null;
  engine: EngineInstance | null;
  phase: DeskPhase;
  submitted: boolean;
  waitingTaskId: string | null;
  log: EngineEvent[];
  eventDays: number[];
  day: number;
  waitedDays: number;
  studentRecord: StudentRecord | null;
  completedTaskIds: string[];
}

/**
 * Gom trạng thái ca cho một bàn. Engine là object mutable nên mọi thay đổi
 * state đi kèm event trong currentEventLog — log chính là "phiên bản" re-render.
 */
export function useCaseView(desk: DeskKey): CaseView {
  const scenario = usePlaybackStore((s) => s.scenario);
  const engine = usePlaybackStore((s) => s.engine);
  const submitted = usePlaybackStore((s) => s.submitted);
  const waitingTaskId = usePlaybackStore((s) => s.waitingTaskId);
  const waitingTaskIds = usePlaybackStore((s) => s.waitingTaskIds);
  const log = usePlaybackStore((s) => s.currentEventLog);
  const eventDays = usePlaybackStore((s) => s.eventDays);
  const day = usePlaybackStore((s) => s.mapState.counters.day);
  const caseEnded = usePlaybackStore((s) => s.mapState.caseEnded);
  const studentRecord = usePlaybackStore((s) => s.studentRecord);

  const completedTaskIds = useMemo(
    () =>
      log
        .filter((e): e is Extract<EngineEvent, { type: 'task.completed' }> => e.type === 'task.completed')
        .map((e) => e.taskId),
    [log]
  );

  const phase = getDeskPhase({
    submitted,
    waitingTaskId,
    waitingTaskIds,
    caseEnded,
    completedTaskIds,
    taskId: DESK_TASK[desk],
  });

  const assignedDay = findTaskAssignedDay(log, eventDays, DESK_TASK[desk]);
  const waitedDays = computeSlaDays(assignedDay, day);

  return useMemo(
    () => ({
      scenario,
      engine,
      phase,
      submitted,
      waitingTaskId,
      log,
      eventDays,
      day,
      waitedDays,
      studentRecord,
      completedTaskIds,
    }),
    [
      scenario,
      engine,
      phase,
      submitted,
      waitingTaskId,
      log,
      eventDays,
      day,
      waitedDays,
      studentRecord,
      completedTaskIds,
    ]
  );
}
