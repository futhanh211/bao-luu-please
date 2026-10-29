import { EngineEvent } from '../../engine/types';
import { NodeStatus } from './shapes';

export interface MapCounters {
  tasksAutoRun: number;
  totalAutoTasks: number;
  userTasksRun: number;
  totalUserTasks: number;
  messagesSent: number;
  day: number;
}

export interface MapDisplayState {
  nodeStates: Record<string, NodeStatus>;
  edgeStates: Record<string, 'idle' | 'traversed'>;
  visibleDataObjects: Record<'DO1' | 'DO2' | 'DO3', boolean>;
  flashingStores: Record<'DS1' | 'DS2', boolean>;
  counters: MapCounters;
  caseEnded: boolean;
  endOutcome?: string;
  activeNodeId?: string;
}

export const AUTO_TASK_IDS = ['T1', 'T2', 'T3', 'T6', 'T7', 'T8', 'T10', 'T11'];
export const USER_TASK_IDS = ['T4', 'T5', 'T9'];

export function createInitialMapState(): MapDisplayState {
  return {
    nodeStates: {},
    edgeStates: {},
    visibleDataObjects: { DO1: false, DO2: false, DO3: false },
    flashingStores: { DS1: false, DS2: false },
    counters: {
      tasksAutoRun: 0,
      totalAutoTasks: 8,
      userTasksRun: 0,
      totalUserTasks: 3,
      messagesSent: 0,
      day: 0,
    },
    caseEnded: false,
  };
}

export function applyEvent(state: MapDisplayState, event: EngineEvent): MapDisplayState {
  const next: MapDisplayState = {
    ...state,
    nodeStates: { ...state.nodeStates },
    edgeStates: { ...state.edgeStates },
    visibleDataObjects: { ...state.visibleDataObjects },
    flashingStores: { ...state.flashingStores },
    counters: { ...state.counters },
  };

  switch (event.type) {
    case 'node.entered': {
      next.activeNodeId = event.nodeId;
      next.nodeStates[event.nodeId] = 'active';
      break;
    }

    case 'task.assigned': {
      next.nodeStates[event.nodeId] = 'waiting';
      break;
    }

    case 'node.completed': {
      next.nodeStates[event.nodeId] = 'done';
      if (AUTO_TASK_IDS.includes(event.nodeId)) {
        next.counters.tasksAutoRun += 1;
      } else if (USER_TASK_IDS.includes(event.nodeId)) {
        next.counters.userTasksRun += 1;
      }
      break;
    }

    case 'edge.traversed': {
      next.edgeStates[event.edgeId] = 'traversed';
      break;
    }

    case 'message.sent': {
      // Đếm số thông điệp phản hồi gửi tới Sinh viên (MF2, MF3, MF4)
      if (['MF2', 'MF3', 'MF4'].includes(event.flowId)) {
        next.counters.messagesSent += 1;
      }
      break;
    }

    case 'dataobject.changed': {
      if (event.id === 'DO1' || event.id === 'DO2' || event.id === 'DO3') {
        next.visibleDataObjects[event.id] = true;
      }
      break;
    }

    case 'data.read':
    case 'data.written': {
      if (event.storeId === 'DS1' || event.storeId === 'DS2') {
        next.flashingStores[event.storeId] = true;
      }
      break;
    }

    case 'timer.scheduled': {
      next.nodeStates[event.timerId] = 'waiting';
      break;
    }

    case 'timer.fired': {
      next.counters.day = event.day;
      next.nodeStates[event.timerId] = 'done';
      break;
    }

    case 'case.ended': {
      // E_END_REMIND chỉ kết thúc NHÁNH NHẮC VIỆC (boundary timer non-interrupting),
      // ca chính vẫn đang chờ Cố vấn ở T4 — không được đánh dấu cả ca đã kết thúc.
      if (event.endEventId === 'E_END_REMIND') break;

      next.caseEnded = true;
      next.endOutcome = event.outcome;

      // Mark all unvisited / idle process nodes as 'skipped'
      const allProcessNodeIds = [
        'SV_START', 'SV_T1', 'SV_R1', 'SV_R2', 'SV_R3',
        'E_START', 'T1', 'G1', 'T2', 'E_END_RETURNED',
        'G2', 'T3', 'T4', 'BT1', 'T5', 'G3', 'G4',
        'T6', 'E_END_REMIND', 'T7', 'E_END_REJECTED',
        'T8', 'T9', 'T10', 'T11', 'E_END_OK',
      ];

      for (const id of allProcessNodeIds) {
        if (!next.nodeStates[id] || next.nodeStates[id] === 'idle') {
          next.nodeStates[id] = 'skipped';
        }
      }
      break;
    }

    default:
      break;
  }

  return next;
}
