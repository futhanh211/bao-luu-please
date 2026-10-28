import { describe, it, expect, beforeEach } from 'vitest';
import { createEngine } from './engine';
import { PROCESS_DEF } from './process.def';
import { Clock } from './clock';
import { InMemoryStudentsDB } from '../data/students.db';
import { InMemoryAcademicFinanceDB } from '../data/academic-finance.db';
import { MockAIProvider } from '../ai/mock';
import { SCENARIOS, ScenarioConfig } from '../data/scenarios';
import { EngineEvent, EngineDeps } from './types';

describe('Process Engine Headless (Milestone M1)', () => {
  let clock: Clock;
  let studentsDb: InMemoryStudentsDB;
  let academicFinanceDb: InMemoryAcademicFinanceDB;
  let ai: MockAIProvider;
  let deps: EngineDeps;
  let events: EngineEvent[];

  beforeEach(() => {
    clock = new Clock(0);
    studentsDb = new InMemoryStudentsDB();
    academicFinanceDb = new InMemoryAcademicFinanceDB();
    ai = new MockAIProvider(undefined, 0);
    events = [];

    deps = {
      clock,
      db: {
        ds1: academicFinanceDb,
        ds2: studentsDb,
      },
      ai,
    };
  });

  const getScenario = (id: string): ScenarioConfig => {
    const sc = SCENARIOS.find((s) => s.id === id);
    if (!sc) throw new Error(`Scenario not found: ${id}`);
    return sc;
  };

  it('S1: Happy path -> E_END_OK, studentStatus = "Bảo lưu", MF4 sent, correct tasks executed', async () => {
    const s1 = getScenario('s1');
    ai.setScript(s1.aiScript);

    const engine = createEngine(PROCESS_DEF, s1, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    // T1 and G2 completed, waiting on T4 and T5
    expect(engine.getWaitingTasks()).toEqual(expect.arrayContaining(['T4', 'T5']));
    expect(engine.state.validity.complete).toBe(true);
    expect(engine.state.validity.evidenceOk).toBe(true);

    // Complete Advisor (T4) & CTSV (T5)
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    // Now at T9 (BGH Ký số)
    expect(engine.getWaitingTasks()).toContain('T9');
    expect(engine.state.decisionDoc).toBeDefined();
    expect(engine.state.decisionDoc?.signed).toBe(false);

    // BGH signs
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    // Final assertions
    expect(engine.state.studentStatus).toBe('Bảo lưu');
    expect(studentsDb.get(s1.form.mssv)?.status).toBe('Bảo lưu');
    expect(engine.state.decisionDoc?.signed).toBe(true);

    // Verify end event
    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent?.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_OK');
      expect(endEvent.outcome).toBe('Bảo lưu thành công');
    }

    // Verify messages: MF4 sent once to SV, no MF2 or MF3
    const mf4Messages = engine.state.messages.filter((m) => m.flowId === 'MF4');
    expect(mf4Messages).toHaveLength(1);
    expect(engine.state.messages.filter((m) => m.flowId === 'MF2')).toHaveLength(0);
    expect(engine.state.messages.filter((m) => m.flowId === 'MF3')).toHaveLength(0);

    // Check executed task events
    const completedNodeIds = events
      .filter((e) => e.type === 'node.completed')
      .map((e) => (e as { nodeId: string }).nodeId);

    expect(completedNodeIds).toEqual(
      expect.arrayContaining(['T1', 'T3', 'T4', 'T5', 'T8', 'T9', 'T10', 'T11'])
    );
    expect(completedNodeIds).not.toContain('T2');
    expect(completedNodeIds).not.toContain('T6');
    expect(completedNodeIds).not.toContain('T7');
  });

  it('S2: Hồ sơ thiếu -> T1 phát hiện -> G1=Không -> T2 -> E_END_RETURNED (MF2 sent once, no token in G2)', async () => {
    const s2 = getScenario('s2');
    ai.setScript(s2.aiScript);

    const engine = createEngine(PROCESS_DEF, s2, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    expect(engine.state.validity.evidenceOk).toBe(false);

    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent?.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_RETURNED');
      expect(endEvent.outcome).toBe('Trả hồ sơ');
    }

    const mf2Messages = engine.state.messages.filter((m) => m.flowId === 'MF2');
    expect(mf2Messages).toHaveLength(1);

    const completedNodeIds = events
      .filter((e) => e.type === 'node.completed')
      .map((e) => (e as { nodeId: string }).nodeId);

    expect(completedNodeIds).toContain('T1');
    expect(completedNodeIds).toContain('T2');
    expect(completedNodeIds).not.toContain('G2');
    expect(completedNodeIds).not.toContain('T3');
  });

  it('S3: Nợ học phí -> R3 fail -> T4/T5 vẫn chạy song song -> G4=Không -> T7 -> E_END_REJECTED (MF3 sent)', async () => {
    const s3 = getScenario('s3');
    ai.setScript(s3.aiScript);

    const engine = createEngine(PROCESS_DEF, s3, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    // Parallel branches T4 and T5 are waiting
    expect(engine.getWaitingTasks()).toEqual(expect.arrayContaining(['T4', 'T5']));
    expect(engine.state.ruleResult.pass).toBe(false);
    expect(engine.state.ruleResult.violations.some((v) => v.includes('học phí'))).toBe(true);

    // Human roles still complete their parallel tasks
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    // G4 evaluates eligible = false -> goes to T7 -> E_END_REJECTED
    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent?.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_REJECTED');
      expect(endEvent.outcome).toBe('Từ chối');
    }

    const mf3Messages = engine.state.messages.filter((m) => m.flowId === 'MF3');
    expect(mf3Messages).toHaveLength(1);
  });

  it('S4: Cố vấn ngâm hồ sơ -> advanceDays(3) triggers timer.fired -> T6 -> E_END_REMIND, T4 remains waiting -> E_END_OK', async () => {
    const s4 = getScenario('s4');
    ai.setScript(s4.aiScript);

    const engine = createEngine(PROCESS_DEF, s4, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    expect(engine.getWaitingTasks()).toContain('T4');

    // Advance 3 days to trigger BT1
    await engine.advanceDays(3);
    await engine.runUntilBlocked();

    // Verify timer.fired event and T6 execution
    const timerFired = events.find((e) => e.type === 'timer.fired');
    expect(timerFired).toBeDefined();

    const remindEnded = events.find(
      (e) => e.type === 'case.ended' && (e as { endEventId: string }).endEventId === 'E_END_REMIND'
    );
    expect(remindEnded).toBeDefined();

    // Non-interrupting timer: T4 must STILL be waiting!
    expect(engine.getWaitingTasks()).toContain('T4');
    expect(engine.state.advisor.remindedAt).toBe(3);

    // Complete T4 & T5
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    // Complete T9
    expect(engine.getWaitingTasks()).toContain('T9');
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    // Main case ends in E_END_OK
    const okEnded = events.find(
      (e) => e.type === 'case.ended' && (e as { endEventId: string }).endEventId === 'E_END_OK'
    );
    expect(okEnded).toBeDefined();
  });

  it('S5: Minh chứng đáng ngờ -> CTSV invalid -> G4=Không -> E_END_REJECTED', async () => {
    const s5 = getScenario('s5');
    ai.setScript(s5.aiScript);

    const engine = createEngine(PROCESS_DEF, s5, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    // Advisor confirms, but CTSV spots fraud and marks invalid
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'invalid');
    await engine.runUntilBlocked();

    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent?.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_REJECTED');
      expect(endEvent.outcome).toBe('Từ chối');
    }
  });

  it('Custom: MSSV không tồn tại trong DS2 -> T1 trả hồ sơ không hợp lệ -> E_END_RETURNED', async () => {
    const custom = getScenario('s6');
    const unknownStudentScenario: ScenarioConfig = {
      ...custom,
      form: {
        ...custom.form,
        mssv: '9999999999', // Unknown MSSV
      },
    };

    const engine = createEngine(PROCESS_DEF, unknownStudentScenario, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    expect(engine.state.validity.complete).toBe(false);
    expect(engine.state.validity.missing.some((m) => m.includes('Không tìm thấy'))).toBe(true);

    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent?.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_RETURNED');
    }
  });

  it('Join G3: Chỉ đi tiếp khi đủ cả 3 nhánh (T3, T4, T5)', async () => {
    const s1 = getScenario('s1');
    ai.setScript(s1.aiScript);

    const engine = createEngine(PROCESS_DEF, s1, deps);
    engine.subscribe((e) => events.push(e));

    await engine.start();
    await engine.runUntilBlocked();

    // T3 is done, but T4 & T5 are waiting
    expect(events.filter((e) => e.type === 'token.merged')).toHaveLength(0);

    // Complete only T4
    await engine.completeUserTask('T4', 'confirmed');
    await engine.runUntilBlocked();
    expect(events.filter((e) => e.type === 'token.merged')).toHaveLength(0);

    // Now complete T5 -> exactly 3 branches arrive at G3
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    expect(events.filter((e) => e.type === 'token.merged')).toHaveLength(1);
    expect(engine.getWaitingTasks()).toContain('T9');
  });

  it('Reset: reset() dọn sạch và chạy lại cho kết quả hoàn toàn giống nhau', async () => {
    const s1 = getScenario('s1');
    ai.setScript(s1.aiScript);

    const engine = createEngine(PROCESS_DEF, s1, deps);

    // Run 1st time
    await engine.start();
    await engine.runUntilBlocked();
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();
    await engine.completeUserTask('T9', { signerName: 'Hiệu trưởng' });
    await engine.runUntilBlocked();

    expect(engine.state.studentStatus).toBe('Bảo lưu');

    // Reset engine
    engine.reset();

    expect(clock.getDay()).toBe(0);
    expect(engine.state.studentStatus).toBe('Đang học');
    expect(engine.getTokens()).toHaveLength(0);
    expect(engine.getWaitingTasks()).toHaveLength(0);

    // Run 2nd time
    events = [];
    engine.subscribe((e) => events.push(e));
    await engine.start();
    await engine.runUntilBlocked();
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();
    await engine.completeUserTask('T9', { signerName: 'Hiệu trưởng' });
    await engine.runUntilBlocked();

    expect(engine.state.studentStatus).toBe('Bảo lưu');
    const okEnded = events.find(
      (e) => e.type === 'case.ended' && (e as { endEventId: string }).endEventId === 'E_END_OK'
    );
    expect(okEnded).toBeDefined();
  });
});
