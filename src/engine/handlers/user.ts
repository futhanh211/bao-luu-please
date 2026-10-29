import { CaseState, Token, EngineDeps, EngineEvent, AdvisorState, CtsvState } from '../types';

export function handleUserTaskEntry(
  nodeId: string,
  _state: CaseState,
  _token: Token,
  deps: EngineDeps,
  emit: (event: EngineEvent) => void,
  scheduleTimer: (timerId: string, targetNodeId: string, fireAtDay: number) => void
): void {
  switch (nodeId) {
    case 'T4': {
      // Schedule BT1 non-interrupting boundary timer (deadline: currentDay + 3)
      const fireAtDay = deps.clock.getDay() + 3;
      scheduleTimer('BT1', 'T4', fireAtDay);
      emit({ type: 'task.assigned', nodeId: 'T4', lane: 'L2', taskId: 'T4' });
      break;
    }

    case 'T5': {
      emit({ type: 'task.assigned', nodeId: 'T5', lane: 'L3', taskId: 'T5' });
      break;
    }

    case 'T9': {
      emit({ type: 'task.assigned', nodeId: 'T9', lane: 'L4', taskId: 'T9' });
      break;
    }

    default:
      emit({ type: 'task.assigned', nodeId, lane: 'unknown', taskId: nodeId });
      break;
  }
}

export function handleUserTaskCompletion(
  taskId: string,
  outcome: unknown,
  state: CaseState,
  emit: (event: EngineEvent) => void
): void {
  switch (taskId) {
    case 'T4': {
      const status =
        typeof outcome === 'object' && outcome !== null && 'status' in outcome
          ? (outcome as { status: AdvisorState['status'] }).status
          : (outcome as AdvisorState['status']);
      state.advisor.status = status;
      break;
    }

    case 'T5': {
      const status =
        typeof outcome === 'object' && outcome !== null && 'status' in outcome
          ? (outcome as { status: CtsvState['status'] }).status
          : (outcome as CtsvState['status']);
      state.ctsv.status = status;
      break;
    }

    case 'T9': {
      if (state.decisionDoc) {
        state.decisionDoc.signed = true;
        const details = outcome as { signerName?: string } | undefined;
        if (details?.signerName) {
          state.decisionDoc.signerName = details.signerName;
        }
      }
      state.dataObjects.DO3 = true;
      emit({
        type: 'dataobject.changed',
        id: 'DO3',
        stage: 'signed',
        payload: state.decisionDoc,
      });
      break;
    }

    default:
      break;
  }

  // Recalculate overall eligibility (01-PROCESS-SPEC.md section 5)
  state.eligible =
    state.ruleResult.pass &&
    state.advisor.status === 'confirmed' &&
    state.ctsv.status === 'valid';

  emit({ type: 'task.completed', nodeId: taskId, taskId, outcome });
}
