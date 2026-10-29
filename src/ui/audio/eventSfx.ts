import type { EngineEvent } from '../../engine/types';
import { sfx, SoundName } from './sfx';

/** Task do máy chạy — chỉ các task này mới phát tiếng CRT. */
const MACHINE_TASKS = new Set(['T1', 'T2', 'T3', 'T6', 'T7', 'T8', 'T10', 'T11']);

/**
 * Ánh xạ event engine → âm thanh. Hàm thuần để test được không cần WebAudio.
 * Trả về null khi event không nên phát tiếng.
 */
export function soundForEvent(event: EngineEvent): SoundName | null {
  switch (event.type) {
    case 'case.started':
      return 'paper';
    case 'message.sent':
      return 'paper';
    case 'dataobject.changed':
      return 'paper';
    case 'data.read':
    case 'data.written':
      return 'crt';
    case 'timer.fired':
      return 'bell';
    case 'token.split':
    case 'token.merged':
      return 'crt';
    case 'task.completed':
      return MACHINE_TASKS.has(event.nodeId) ? 'crt' : null;
    case 'rule.evaluated':
      return event.passed ? null : 'buzz';
    case 'case.ended':
      return event.endEventId === 'E_END_OK' ? 'chime' : 'buzz';
    default:
      return null;
  }
}

export function playEventSfx(event: EngineEvent): void {
  const sound = soundForEvent(event);
  if (sound) sfx.play(sound);
}
