import { describe, expect, it } from 'vitest';
import { createEngine } from '../engine/engine';
import { PROCESS_DEF } from '../engine/process.def';
import { Clock } from '../engine/clock';
import { InMemoryStudentsDB } from './students.db';
import { InMemoryAcademicFinanceDB } from './academic-finance.db';
import { MockAIProvider } from '../ai/mock';
import { SCENARIOS, ScenarioConfig } from './scenarios';
import { EngineEvent } from '../engine/types';
import { buildCaseReport, findReportEndEvent, isMainEndEvent } from './caseReport';

function scenario(id: string): ScenarioConfig {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Không có kịch bản ${id}`);
  return found;
}

interface Harness {
  engine: ReturnType<typeof createEngine>;
  events: EngineEvent[];
  clock: Clock;
}

function createHarness(id: string): Harness {
  const sc = scenario(id);
  const events: EngineEvent[] = [];
  const clock = new Clock(0);
  const engine = createEngine(PROCESS_DEF, sc, {
    clock,
    db: { ds1: new InMemoryAcademicFinanceDB(), ds2: new InMemoryStudentsDB() },
    ai: new MockAIProvider(sc.aiScript, 0),
  });
  engine.subscribe((event) => events.push(event));
  return { engine, events, clock };
}

async function runS1(): Promise<Harness> {
  const harness = createHarness('s1');
  await harness.engine.start();
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T4', 'confirmed');
  await harness.engine.completeUserTask('T5', 'valid');
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
  await harness.engine.runUntilBlocked();
  return harness;
}

async function runS2(): Promise<Harness> {
  const harness = createHarness('s2');
  await harness.engine.start();
  await harness.engine.runUntilBlocked();
  return harness;
}

async function runS3(): Promise<Harness> {
  const harness = createHarness('s3');
  await harness.engine.start();
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T4', 'confirmed');
  await harness.engine.completeUserTask('T5', 'valid');
  await harness.engine.runUntilBlocked();
  return harness;
}

async function runS4(): Promise<Harness> {
  const harness = createHarness('s4');
  await harness.engine.start();
  await harness.engine.runUntilBlocked();
  await harness.engine.advanceDays(3);
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T4', 'confirmed');
  await harness.engine.completeUserTask('T5', 'valid');
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
  await harness.engine.runUntilBlocked();
  return harness;
}

async function runS5(): Promise<Harness> {
  const harness = createHarness('s5');
  await harness.engine.start();
  await harness.engine.runUntilBlocked();
  await harness.engine.completeUserTask('T4', 'confirmed');
  await harness.engine.completeUserTask('T5', 'invalid');
  await harness.engine.runUntilBlocked();
  return harness;
}

function reportOf(harness: Harness, id: string) {
  return buildCaseReport(harness.events, harness.engine.state, {
    scenario: scenario(id),
    day: harness.clock.getDay(),
    asIs: null,
  });
}

describe('caseReport · báo cáo cuối ca từ event log thật', () => {
  it('S1: 5 máy · 3 người · 1 thông điệp · 2 đọc · 1 ghi · kết cục thành công', async () => {
    const harness = await runS1();
    const report = reportOf(harness, 's1');

    expect(report.outcomeKind).toBe('success');
    expect(report.endEventId).toBe('E_END_OK');
    expect(report.outcome).toBe('Bảo lưu thành công');
    expect(report.machineRun).toBe(5);
    expect(report.humanRun).toBe(3);
    expect(report.messagesSent).toBe(1);
    expect(report.dbReads).toBe(2);
    expect(report.dbWrites).toBe(1);
    expect(report.aiTouches).toBe(2);
    expect(report.disagreements).toBe(0);
    expect(report.remindersFired).toBe(0);
    expect(report.rulesFailed).toBe(0);
    expect(report.steps).toHaveLength(8);
    expect(report.automationRate).toBeCloseTo(5 / 8, 5);
    expect(report.design).toEqual({ machine: 8, total: 11, rate: 8 / 11 });
    expect(report.asIs).toBeNull();
    expect(report.decisionNumber).toBe('BL-2001/QĐ-ĐHKT');

    const actors = report.steps.map((step) => `${step.nodeId}:${step.actor}`);
    expect(actors).toEqual(
      expect.arrayContaining([
        'T1:MÁY',
        'T3:MÁY',
        'T4:NGƯỜI',
        'T5:NGƯỜI',
        'T8:MÁY',
        'T9:NGƯỜI',
        'T10:MÁY',
        'T11:MÁY',
      ])
    );
    expect(report.steps.find((step) => step.nodeId === 'T4')?.detail).toBe('Xác nhận bảo lưu');
    expect(report.steps.find((step) => step.nodeId === 'T9')?.detail).toBe('Đã ký số');
  });

  it('S2: trả hồ sơ ngay — 2 máy · 0 người · 1 thông điệp MF2', async () => {
    const harness = await runS2();
    const report = reportOf(harness, 's2');

    expect(report.outcomeKind).toBe('returned');
    expect(report.endEventId).toBe('E_END_RETURNED');
    expect(report.machineRun).toBe(2);
    expect(report.humanRun).toBe(0);
    expect(report.messagesSent).toBe(1);
    expect(report.dbReads).toBe(1);
    expect(report.dbWrites).toBe(0);
    expect(report.aiTouches).toBe(2);
    expect(report.steps.map((step) => step.nodeId)).toEqual(['T1', 'T2']);
    expect(report.automationRate).toBe(1);
  });

  it('S3: nợ học phí — R3 đỏ, 3 máy · 2 người, kết cục từ chối', async () => {
    const harness = await runS3();
    const report = reportOf(harness, 's3');

    expect(report.outcomeKind).toBe('rejected');
    expect(report.endEventId).toBe('E_END_REJECTED');
    expect(report.machineRun).toBe(3);
    expect(report.humanRun).toBe(2);
    expect(report.messagesSent).toBe(1);
    expect(report.dbReads).toBe(2);
    expect(report.dbWrites).toBe(0);
    expect(report.rulesFailed).toBe(1);
    expect(report.rules.find((rule) => rule.id === 'R3')?.passed).toBe(false);
    expect(report.steps.map((step) => step.nodeId)).toEqual(['T1', 'T3', 'T4', 'T5', 'T7']);
  });

  it('S4: E_END_REMIND không mở báo cáo; ca chính OK có 6 máy · 3 người · 1 nhắc việc', async () => {
    const harness = await runS4();
    const report = reportOf(harness, 's4');

    const remind = harness.events.find(
      (event) => event.type === 'case.ended' && event.endEventId === 'E_END_REMIND'
    );
    expect(remind).toBeDefined();
    expect(isMainEndEvent(remind as EngineEvent)).toBe(false);

    expect(report.endEventId).toBe('E_END_OK');
    expect(report.outcomeKind).toBe('success');
    expect(report.machineRun).toBe(6);
    expect(report.humanRun).toBe(3);
    expect(report.remindersFired).toBe(1);
    expect(report.messagesSent).toBe(1);
    expect(report.dbReads).toBe(2);
    expect(report.dbWrites).toBe(1);
    expect(report.steps.map((step) => step.nodeId)).toEqual([
      'T1',
      'T3',
      'T6',
      'T4',
      'T5',
      'T8',
      'T9',
      'T10',
      'T11',
    ]);
    expect(report.simDays).toBe(3);
  });

  it('S5: minh chứng đáng ngờ — CTSV từ chối, 3 máy · 2 người, 0 rule fail', async () => {
    const harness = await runS5();
    const report = reportOf(harness, 's5');

    expect(report.endEventId).toBe('E_END_REJECTED');
    expect(report.machineRun).toBe(3);
    expect(report.humanRun).toBe(2);
    expect(report.messagesSent).toBe(1);
    expect(report.rulesFailed).toBe(0);
    expect(report.steps.find((step) => step.nodeId === 'T5')?.detail).toBe('Không hợp lệ');
  });

  it('findReportEndEvent bỏ qua nhánh nhắc việc và trả null khi chưa có end chính', () => {
    const events: EngineEvent[] = [
      { type: 'case.started', caseId: 'S4' },
      { type: 'case.ended', endEventId: 'E_END_REMIND', outcome: 'Hoàn tất nhắc việc' },
    ];
    expect(findReportEndEvent(events)).toBeNull();
    expect(isMainEndEvent(events[1])).toBe(false);
  });
});
