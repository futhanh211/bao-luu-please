import {
  ProcessDef,
  Token,
  CaseState,
  EngineEvent,
  EngineDeps,
} from './types';
import { ScenarioConfig } from '../data/scenarios';
import { handleServiceTask } from './handlers/service';
import { handleSendTask } from './handlers/send';
import { handleBusinessRuleTask } from './handlers/rule';
import { handleUserTaskEntry, handleUserTaskCompletion } from './handlers/user';
import { evaluateXorGateway, splitAndGateway } from './handlers/gateway';
import { TimerManager } from './handlers/timer';

export interface EngineInstance {
  state: CaseState;
  subscribe: (subscriber: (event: EngineEvent) => void) => () => void;
  start: () => Promise<void>;
  step: () => Promise<boolean>;
  runUntilBlocked: () => Promise<void>;
  completeUserTask: (taskId: string, outcome: unknown) => Promise<void>;
  advanceDays: (days: number) => Promise<void>;
  reset: () => void;
  getTokens: () => Token[];
  getWaitingTasks: () => string[];
}

export function createEngine(
  def: ProcessDef,
  scenario: ScenarioConfig,
  deps: EngineDeps
): EngineInstance {
  const initialStudent = deps.db.ds2.get(scenario.form.mssv);

  const state: CaseState = {
    caseId: scenario.code,
    form: { ...scenario.form },
    evidence: scenario.evidence ? scenario.evidence.map((e) => ({ ...e })) : [],
    validity: { complete: false, missing: [], evidenceOk: false },
    ruleResult: { pass: false, violations: [] },
    advisor: { status: 'pending' },
    ctsv: { status: 'pending' },
    eligible: false,
    studentStatus: initialStudent?.status || 'Đang học',
    messages: [],
    dataObjects: { DO1: false, DO2: false, DO3: false },
  };

  let tokens: Token[] = [];
  const waitingUserTasks = new Map<string, Token>();
  const arrivedAtG3: Token[] = [];
  const timerManager = new TimerManager();
  const subscribers: Array<(event: EngineEvent) => void> = [];

  function emit(event: EngineEvent): void {
    for (const sub of subscribers) {
      sub(event);
    }
  }

  function subscribe(fn: (event: EngineEvent) => void): () => void {
    subscribers.push(fn);
    return () => {
      const idx = subscribers.indexOf(fn);
      if (idx !== -1) subscribers.splice(idx, 1);
    };
  }

  async function start(): Promise<void> {
    emit({ type: 'case.started', caseId: state.caseId });

    // Pool Sinh viên: SV_START -> SV_T1 -> MF1 -> E_START
    emit({ type: 'node.entered', nodeId: 'SV_START', tokenId: 'token_sv_0' });
    emit({ type: 'node.completed', nodeId: 'SV_START', tokenId: 'token_sv_0' });
    emit({ type: 'edge.traversed', edgeId: 'e_sv_start_t1', tokenId: 'token_sv_0', from: 'SV_START', to: 'SV_T1' });

    emit({ type: 'node.entered', nodeId: 'SV_T1', tokenId: 'token_sv_0' });
    emit({ type: 'node.completed', nodeId: 'SV_T1', tokenId: 'token_sv_0' });
    emit({ type: 'message.sent', flowId: 'MF1', payload: { form: state.form, evidence: state.evidence } });
    emit({ type: 'edge.traversed', edgeId: 'MF1', tokenId: 'token_sv_0', from: 'SV_T1', to: 'E_START' });

    // Pool Trường: E_START -> T1
    emit({ type: 'node.entered', nodeId: 'E_START', tokenId: 'token_1' });
    emit({ type: 'node.completed', nodeId: 'E_START', tokenId: 'token_1' });
    emit({ type: 'edge.traversed', edgeId: 'e_start_t1', tokenId: 'token_1', from: 'E_START', to: 'T1' });

    tokens.push({
      id: 'token_1',
      at: 'T1',
      caseId: state.caseId,
    });
  }

  async function step(): Promise<boolean> {
    // Find ready token that is NOT waiting for a user task or paused at G3
    const readyTokenIdx = tokens.findIndex((t) => !waitingUserTasks.has(t.at) && t.at !== 'G3');
    if (readyTokenIdx === -1) {
      return false;
    }

    const token = tokens[readyTokenIdx];
    const node = def.nodes.find((n) => n.id === token.at);
    if (!node) {
      throw new Error(`Node not found: ${token.at}`);
    }

    emit({ type: 'node.entered', nodeId: node.id, tokenId: token.id });

    switch (node.type) {
      case 'serviceTask': {
        await handleServiceTask(node.id, state, token, deps, emit);
        emit({ type: 'node.completed', nodeId: node.id, tokenId: token.id });
        advanceTokenFromSingleOutgoing(token, node.id);
        break;
      }

      case 'sendTask': {
        await handleSendTask(node.id, state, token, deps, emit);
        emit({ type: 'node.completed', nodeId: node.id, tokenId: token.id });
        advanceTokenFromSingleOutgoing(token, node.id);
        break;
      }

      case 'businessRuleTask': {
        await handleBusinessRuleTask(node.id, state, token, deps, emit);
        emit({ type: 'node.completed', nodeId: node.id, tokenId: token.id });
        advanceTokenFromSingleOutgoing(token, node.id);
        break;
      }

      case 'userTask': {
        handleUserTaskEntry(
          node.id,
          state,
          token,
          deps,
          emit,
          (timerId, targetNodeId, fireAtDay) => {
            timerManager.schedule(timerId, targetNodeId, fireAtDay, emit);
          }
        );
        waitingUserTasks.set(node.id, token);
        break;
      }

      case 'gatewayXor': {
        const nextNodeId = evaluateXorGateway(node.id, state);
        emit({ type: 'node.completed', nodeId: node.id, tokenId: token.id });
        const edge = def.edges.find((e) => e.from === node.id && e.to === nextNodeId);
        emit({
          type: 'edge.traversed',
          edgeId: edge ? edge.id : `e_${node.id}_${nextNodeId}`,
          tokenId: token.id,
          from: node.id,
          to: nextNodeId,
        });
        token.at = nextNodeId;
        break;
      }

      case 'gatewayAnd': {
        if (node.id === 'G2') {
          // Split into 3 branches: T3, T4, T5
          emit({ type: 'node.completed', nodeId: 'G2', tokenId: token.id });
          tokens.splice(readyTokenIdx, 1); // remove split token
          const newTokens = splitAndGateway(token, ['T3', 'T4', 'T5'], emit);
          tokens.push(...newTokens);
          emit({ type: 'edge.traversed', edgeId: 'e_g2_t3', tokenId: newTokens[0].id, from: 'G2', to: 'T3' });
          emit({ type: 'edge.traversed', edgeId: 'e_g2_t4', tokenId: newTokens[1].id, from: 'G2', to: 'T4' });
          emit({ type: 'edge.traversed', edgeId: 'e_g2_t5', tokenId: newTokens[2].id, from: 'G2', to: 'T5' });
        }
        break;
      }

      case 'endNone': {
        emit({ type: 'node.completed', nodeId: node.id, tokenId: token.id });
        tokens.splice(readyTokenIdx, 1);
        let outcome = 'Kết thúc quy trình';
        if (node.id === 'E_END_OK') outcome = 'Bảo lưu thành công';
        if (node.id === 'E_END_RETURNED') outcome = 'Trả hồ sơ';
        if (node.id === 'E_END_REJECTED') outcome = 'Từ chối';
        if (node.id === 'E_END_REMIND') outcome = 'Hoàn tất nhắc việc';
        emit({ type: 'case.ended', endEventId: node.id, outcome });
        break;
      }

      default:
        break;
    }

    return true;
  }

  function advanceTokenFromSingleOutgoing(token: Token, currentNodeId: string): void {
    const outgoing = def.edges.filter((e) => e.from === currentNodeId && e.type === 'sequence');
    if (outgoing.length === 1) {
      const nextNodeId = outgoing[0].to;
      emit({
        type: 'edge.traversed',
        edgeId: outgoing[0].id,
        tokenId: token.id,
        from: currentNodeId,
        to: nextNodeId,
      });

      if (nextNodeId === 'G3') {
        // Token has arrived at G3 join
        token.at = 'G3';
        arrivedAtG3.push(token);
        checkAndExecuteJoin();
      } else {
        token.at = nextNodeId;
      }
    }
  }

  function checkAndExecuteJoin(): void {
    if (arrivedAtG3.length === 3) {
      // All 3 branches (T3, T4, T5) have arrived at G3!
      const mergedTokenId = `token_merged_${Date.now()}`;
      emit({
        type: 'token.merged',
        mergedTokenIds: arrivedAtG3.map((t) => t.id),
        resultingTokenId: mergedTokenId,
      });
      emit({ type: 'node.completed', nodeId: 'G3', tokenId: mergedTokenId });

      // Remove the 3 tokens from active tokens list
      tokens = tokens.filter((t) => !arrivedAtG3.some((a) => a.id === t.id));
      arrivedAtG3.length = 0;

      // Create new merged token and advance to G4
      const nextToken: Token = {
        id: mergedTokenId,
        at: 'G4',
        caseId: state.caseId,
      };
      tokens.push(nextToken);
      emit({ type: 'edge.traversed', edgeId: 'e_g3_g4', tokenId: mergedTokenId, from: 'G3', to: 'G4' });
    }
  }

  async function completeUserTask(taskId: string, outcome: unknown): Promise<void> {
    const token = waitingUserTasks.get(taskId);
    if (!token) {
      throw new Error(`Task ${taskId} is not waiting for completion`);
    }

    handleUserTaskCompletion(taskId, outcome, state, emit);
    waitingUserTasks.delete(taskId);
    emit({ type: 'node.completed', nodeId: taskId, tokenId: token.id, outcome });

    advanceTokenFromSingleOutgoing(token, taskId);
  }

  async function advanceDays(days: number): Promise<void> {
    deps.clock.advance(days);
    const reminderToken = timerManager.check(deps.clock.getDay(), state.caseId, emit);
    if (reminderToken) {
      emit({ type: 'edge.traversed', edgeId: 'e_bt1_t6', tokenId: reminderToken.id, from: 'BT1', to: 'T6' });
      tokens.push(reminderToken);
    }
  }

  async function runUntilBlocked(): Promise<void> {
    let advanced = true;
    while (advanced) {
      advanced = await step();
    }
  }

  function reset(): void {
    deps.clock.reset(0);
    timerManager.reset();
    tokens = [];
    waitingUserTasks.clear();
    arrivedAtG3.length = 0;
    subscribers.length = 0;

    // Reset state
    state.form = { ...scenario.form };
    state.evidence = scenario.evidence ? scenario.evidence.map((e) => ({ ...e })) : [];
    state.validity = { complete: false, missing: [], evidenceOk: false };
    state.ruleResult = { pass: false, violations: [] };
    state.advisor = { status: 'pending' };
    state.ctsv = { status: 'pending' };
    state.eligible = false;
    state.studentStatus = initialStudent?.status || 'Đang học';
    state.messages = [];
    state.decisionDoc = undefined;
    state.dataObjects = { DO1: false, DO2: false, DO3: false };

    // Reset student status in DS2 if modified
    if (initialStudent) {
      deps.db.ds2.updateStudentStatus(initialStudent.mssv, initialStudent.status);
    }
  }

  return {
    state,
    subscribe,
    start,
    step,
    runUntilBlocked,
    completeUserTask,
    advanceDays,
    reset,
    getTokens: () => [...tokens],
    getWaitingTasks: () => Array.from(waitingUserTasks.keys()),
  };
}
