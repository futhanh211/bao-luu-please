import { applyEvent } from '../../ui/map/mapState';
import { playEventSfx } from '../../ui/audio/eventSfx';
import { useAppStore } from '../useApp';
import { handleEventAnimation } from './animation';
import { getDirectorNodeNarration, handleDirectorUserTask } from './director';
import {
  getActiveStudentsDb,
  isQueueProcessing,
  queuedCount,
  setQueueProcessing,
  shiftQueuedEvent,
} from './session';
import type { PlaybackStoreState } from './types';

type Getter = () => PlaybackStoreState;
type Setter = (
  partial:
    | Partial<PlaybackStoreState>
    | ((state: PlaybackStoreState) => Partial<PlaybackStoreState>)
) => void;

/** Vòng lặp phát event của engine ra UI (map, log, ngày, caption, director). */
export async function processQueue(
  get: Getter,
  set: Setter,
  singleStep = false
): Promise<void> {
  if (isQueueProcessing()) return;
  setQueueProcessing(true);

  try {
    while (get().isPlaying && !get().isPaused) {
      const { engine } = get();
      if (!engine) break;

      const appSpeed = useAppStore.getState().speed || 1;
      const appMode = useAppStore.getState().mode;

      if (queuedCount() > 0) {
        const queued = shiftQueuedEvent();
        if (!queued) break;
        const event = queued.event;

        set((s) => ({
          mapState: applyEvent(s.mapState, event),
          currentEventLog: [...s.currentEventLog, event],
          eventDays: [...s.eventDays, queued.day],
        }));

        playEventSfx(event);

        const delayMs = await handleEventAnimation(event, appSpeed);

        if (event.type === 'node.entered') {
          set({ activeCaptionNodeId: event.nodeId });
          if (appMode === 'director') {
            useAppStore.getState().setDirectorCaption(getDirectorNodeNarration(event.nodeId));
          }
        }

        if (event.type === 'task.assigned') {
          set((s) => {
            const ids = s.waitingTaskIds.includes(event.nodeId)
              ? s.waitingTaskIds
              : [...s.waitingTaskIds, event.nodeId];
            return {
              waitingTaskIds: ids,
              waitingTaskId: s.waitingTaskId ?? event.nodeId,
              isWaitingUserTask: true,
            };
          });
          // T4 và T5 chạy SONG SONG: không dừng cả luồng ở task đầu tiên.
        }

        if (event.type === 'data.written' && event.storeId === 'DS2') {
          const mssv = get().engine?.state.form.mssv ?? get().scenario?.form.mssv;
          if (mssv) {
            set({ studentRecord: getActiveStudentsDb()?.get(mssv) ?? null });
          }
        }

        if (event.type === 'case.ended') {
          if (appMode === 'director') {
            useAppStore.getState().setDirectorCaption(getDirectorNodeNarration(event.endEventId));
          }
          if (event.endEventId !== 'E_END_REMIND') {
            set({ isPlaying: false });
            break;
          }
          // Nhánh nhắc việc kết thúc, ca chính vẫn tiếp tục chờ T4.
        }

        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }

        if (singleStep && queuedCount() === 0) {
          set({ isPaused: true });
          break;
        }
      } else {
        if (appMode === 'step' || singleStep) {
          set({ isPaused: true });
          break;
        }

        const stepped = await engine.step();
        if (!stepped) {
          // Engine blocked (waiting user task or ended).
          if (appMode === 'director' && get().isWaitingUserTask) {
            const handled = await handleDirectorUserTask(get, set);
            if (handled) {
              continue;
            }
          }
          break;
        }
      }
    }
  } finally {
    setQueueProcessing(false);
  }
}
