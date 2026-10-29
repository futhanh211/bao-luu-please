import { describe, it, expect } from 'vitest';
import { createEngine } from '../../engine/engine';
import { PROCESS_DEF } from '../../engine/process.def';
import { Clock } from '../../engine/clock';
import { InMemoryStudentsDB } from '../../data/students.db';
import { InMemoryAcademicFinanceDB } from '../../data/academic-finance.db';
import { MockAIProvider } from '../../ai/mock';
import { SCENARIOS } from '../../data/scenarios';
import { EngineEvent, EngineDeps } from '../../engine/types';
import { createInitialMapState, applyEvent } from './mapState';

describe('Map State Reducer Tests (applyEvent)', () => {
  it('Chạy kịch bản S1 headless, gom event, reduce và kiểm tra trạng thái hiển thị chuẩn xác', async () => {
    const s1 = SCENARIOS.find((s) => s.id === 's1')!;
    const clock = new Clock(0);
    const studentsDb = new InMemoryStudentsDB();
    const academicFinanceDb = new InMemoryAcademicFinanceDB();
    const ai = new MockAIProvider(s1.aiScript, 0);

    const deps: EngineDeps = {
      clock,
      db: { ds1: academicFinanceDb, ds2: studentsDb },
      ai,
    };

    const recordedEvents: EngineEvent[] = [];
    const engine = createEngine(PROCESS_DEF, s1, deps);
    engine.subscribe((e) => recordedEvents.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    // Complete T4 & T5
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    // Complete T9
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    // Reduce all events into MapDisplayState
    let mapState = createInitialMapState();
    for (const event of recordedEvents) {
      mapState = applyEvent(mapState, event);
    }

    // 1. Check all nodes on traversed path are 'done'
    const executedNodes = [
      'SV_START', 'SV_T1', 'E_START', 'T1', 'G1', 'G2',
      'T3', 'T4', 'T5', 'G3', 'G4', 'T8', 'T9', 'T10', 'T11', 'E_END_OK',
    ];
    for (const nodeId of executedNodes) {
      expect(mapState.nodeStates[nodeId], `Node ${nodeId} should be 'done'`).toBe('done');
    }

    // 2. Check untraversed / skipped nodes
    expect(mapState.nodeStates['T2']).toBe('skipped');
    expect(mapState.nodeStates['T6']).toBe('skipped');
    expect(mapState.nodeStates['T7']).toBe('skipped');
    expect(mapState.nodeStates['E_END_RETURNED']).toBe('skipped');
    expect(mapState.nodeStates['E_END_REJECTED']).toBe('skipped');
    expect(mapState.nodeStates['E_END_REMIND']).toBe('skipped');

    // 3. Check data objects
    expect(mapState.visibleDataObjects.DO1).toBe(true);
    expect(mapState.visibleDataObjects.DO2).toBe(true);
    expect(mapState.visibleDataObjects.DO3).toBe(true);

    // 4. Check data stores flashed
    expect(mapState.flashingStores.DS1).toBe(true);
    expect(mapState.flashingStores.DS2).toBe(true);

    // 5. Check counters: 5 auto tasks run in S1 (out of 8 total defined in process), 3 user tasks run, 1 message
    expect(mapState.counters.tasksAutoRun).toBe(5);
    expect(mapState.counters.totalAutoTasks).toBe(8);
    expect(mapState.counters.userTasksRun).toBe(3);
    expect(mapState.counters.messagesSent).toBe(1);
    expect(mapState.caseEnded).toBe(true);
    expect(mapState.endOutcome).toBe('Bảo lưu thành công');
  });

  it('E_END_REMIND chỉ kết thúc nhánh nhắc việc, không kết thúc ca chính', () => {
    const base = createInitialMapState();
    const afterTimer = applyEvent(base, {
      type: 'timer.fired',
      timerId: 'BT1',
      targetNodeId: 'T4',
      day: 3,
    });
    expect(afterTimer.counters.day).toBe(3);

    const afterReminder = applyEvent(afterTimer, {
      type: 'case.ended',
      endEventId: 'E_END_REMIND',
      outcome: 'Hoàn tất nhắc việc',
    });
    expect(afterReminder.caseEnded).toBe(false);
    expect(afterReminder.endOutcome).toBeUndefined();

    const afterRealEnd = applyEvent(afterReminder, {
      type: 'case.ended',
      endEventId: 'E_END_OK',
      outcome: 'Bảo lưu thành công',
    });
    expect(afterRealEnd.caseEnded).toBe(true);
    expect(afterRealEnd.endOutcome).toBe('Bảo lưu thành công');
  });
});
