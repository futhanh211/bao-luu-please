import { describe, it, expect } from 'vitest';
import {
  CUSTOM_PRESETS,
  buildCustomEvidence,
  syncCustomTestDataToDatabases,
} from '../data/customTestData';
import { InMemoryStudentsDB } from '../data/students.db';
import { InMemoryAcademicFinanceDB } from '../data/academic-finance.db';
import { evaluateRules } from './rules';
import { createEngine } from './engine';
import { PROCESS_DEF } from './process.def';
import { Clock } from './clock';
import { MockAIProvider } from '../ai/mock';
import { SCENARIOS } from '../data/scenarios';
import { EngineEvent, EngineDeps } from './types';

describe('Custom Test Data & Instructor Validation Engine', () => {
  it('builds custom evidence for each preset correctly', () => {
    const med = buildCustomEvidence('valid_medical', 'Trần Văn A');
    expect(med).toHaveLength(1);
    expect(med[0].type).toBe('medical_record');
    expect(med[0].fields?.find((f) => f.id === 'patientName')?.value).toBe('Trần Văn A');

    const sus = buildCustomEvidence('suspicious_medical', 'Trần Văn A');
    expect(sus).toHaveLength(1);
    expect(sus[0].issueNotes).toBeDefined();

    const mil = buildCustomEvidence('military', 'Trần Văn A');
    expect(mil).toHaveLength(1);
    expect(mil[0].type).toBe('military_call');

    const none = buildCustomEvidence('none', 'Trần Văn A');
    expect(none).toHaveLength(0);
  });

  it('upserts student and academic finance records into DS1 and DS2', () => {
    const studentsDb = new InMemoryStudentsDB();
    const academicFinanceDb = new InMemoryAcademicFinanceDB();

    const config = CUSTOM_PRESETS[1].config; // fail_r3_debt
    syncCustomTestDataToDatabases(config, studentsDb, academicFinanceDb);

    const student = studentsDb.get(config.mssv);
    expect(student).toBeDefined();
    expect(student?.name).toBe(config.fullName);
    expect(student?.status).toBe('Đang học');

    const academic = academicFinanceDb.get(config.mssv);
    expect(academic).toBeDefined();
    expect(academic?.tuitionDebt).toBe(7500000);
  });

  it('evaluates business rules accurately for all custom presets', () => {
    // 1. Happy path -> all pass
    const happy = CUSTOM_PRESETS.find((p) => p.id === 'happy_path')!.config;
    const happyResult = evaluateRules({
      mssv: happy.mssv,
      semestersCompleted: happy.semestersCompleted,
      discipline: happy.discipline,
      tuitionDebt: happy.tuitionDebt,
      forcedWithdrawal: happy.forcedWithdrawal,
      gpaNote: '',
    });
    expect(happyResult.pass).toBe(true);
    expect(happyResult.violations).toHaveLength(0);

    // 2. R1 fail -> sem < 1
    const r1 = CUSTOM_PRESETS.find((p) => p.id === 'fail_r1_semester')!.config;
    const r1Result = evaluateRules({
      mssv: r1.mssv,
      semestersCompleted: r1.semestersCompleted,
      discipline: r1.discipline,
      tuitionDebt: r1.tuitionDebt,
      forcedWithdrawal: r1.forcedWithdrawal,
      gpaNote: '',
    });
    expect(r1Result.pass).toBe(false);
    expect(r1Result.rules.find((r) => r.id === 'R1')?.passed).toBe(false);

    // 3. R2 fail -> warning
    const r2 = CUSTOM_PRESETS.find((p) => p.id === 'fail_r2_discipline')!.config;
    const r2Result = evaluateRules({
      mssv: r2.mssv,
      semestersCompleted: r2.semestersCompleted,
      discipline: r2.discipline,
      tuitionDebt: r2.tuitionDebt,
      forcedWithdrawal: r2.forcedWithdrawal,
      gpaNote: '',
    });
    expect(r2Result.pass).toBe(false);
    expect(r2Result.rules.find((r) => r.id === 'R2')?.passed).toBe(false);

    // 4. R3 fail -> debt
    const r3 = CUSTOM_PRESETS.find((p) => p.id === 'fail_r3_debt')!.config;
    const r3Result = evaluateRules({
      mssv: r3.mssv,
      semestersCompleted: r3.semestersCompleted,
      discipline: r3.discipline,
      tuitionDebt: r3.tuitionDebt,
      forcedWithdrawal: r3.forcedWithdrawal,
      gpaNote: '',
    });
    expect(r3Result.pass).toBe(false);
    expect(r3Result.rules.find((r) => r.id === 'R3')?.passed).toBe(false);

    // 5. R4 fail -> forced
    const r4 = CUSTOM_PRESETS.find((p) => p.id === 'fail_r4_forced')!.config;
    const r4Result = evaluateRules({
      mssv: r4.mssv,
      semestersCompleted: r4.semestersCompleted,
      discipline: r4.discipline,
      tuitionDebt: r4.tuitionDebt,
      forcedWithdrawal: r4.forcedWithdrawal,
      gpaNote: '',
    });
    expect(r4Result.pass).toBe(false);
    expect(r4Result.rules.find((r) => r.id === 'R4')?.passed).toBe(false);
  });

  it('runs engine headless with custom debt test data and rejects at G4', async () => {
    const studentsDb = new InMemoryStudentsDB();
    const academicFinanceDb = new InMemoryAcademicFinanceDB();
    const debtPreset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r3_debt')!.config;

    syncCustomTestDataToDatabases(debtPreset, studentsDb, academicFinanceDb);

    const baseScenario = SCENARIOS.find((s) => s.id === 's6')!;
    const customScenario = {
      ...baseScenario,
      form: {
        fullName: debtPreset.fullName,
        mssv: debtPreset.mssv,
        className: debtPreset.className,
        faculty: debtPreset.faculty,
        phone: debtPreset.phone,
        email: debtPreset.email,
        reason: debtPreset.reason,
        semesterCount: debtPreset.semesterCount,
        startSemester: debtPreset.startSemester,
        commitment: debtPreset.commitment,
      },
      evidence: buildCustomEvidence(debtPreset.evidencePreset, debtPreset.fullName),
    };

    const clock = new Clock(0);
    const mockAI = new MockAIProvider(undefined, 0);
    const deps: EngineDeps = {
      clock,
      db: { ds1: academicFinanceDb, ds2: studentsDb },
      ai: mockAI,
    };

    const engine = createEngine(PROCESS_DEF, customScenario, deps);
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    await engine.start({
      form: customScenario.form,
      attachedEvidenceIds: customScenario.evidence.map((e) => e.id),
    });
    await engine.runUntilBlocked();

    // Complete T4 & T5
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent && endEvent.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_REJECTED');
    }

    const ruleEvaluated = events.filter((e) => e.type === 'rule.evaluated');
    const r3Event = ruleEvaluated.find(
      (e) => e.type === 'rule.evaluated' && e.ruleId === 'R3'
    );
    expect(r3Event).toBeDefined();
    if (r3Event && r3Event.type === 'rule.evaluated') {
      expect(r3Event.passed).toBe(false);
    }
  });

  it('runs engine headless with custom happy path and successfully approves at T11 / E_END_OK', async () => {
    const studentsDb = new InMemoryStudentsDB();
    const academicFinanceDb = new InMemoryAcademicFinanceDB();
    const happyPreset = CUSTOM_PRESETS.find((p) => p.id === 'happy_path')!.config;

    syncCustomTestDataToDatabases(happyPreset, studentsDb, academicFinanceDb);

    const baseScenario = SCENARIOS.find((s) => s.id === 's6')!;
    const customScenario = {
      ...baseScenario,
      form: {
        fullName: happyPreset.fullName,
        mssv: happyPreset.mssv,
        className: happyPreset.className,
        faculty: happyPreset.faculty,
        phone: happyPreset.phone,
        email: happyPreset.email,
        reason: happyPreset.reason,
        semesterCount: happyPreset.semesterCount,
        startSemester: happyPreset.startSemester,
        commitment: happyPreset.commitment,
      },
      evidence: buildCustomEvidence(happyPreset.evidencePreset, happyPreset.fullName),
    };

    const clock = new Clock(0);
    const mockAI = new MockAIProvider(undefined, 0);
    const deps: EngineDeps = {
      clock,
      db: { ds1: academicFinanceDb, ds2: studentsDb },
      ai: mockAI,
    };

    const engine = createEngine(PROCESS_DEF, customScenario, deps);
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    await engine.start({
      form: customScenario.form,
      attachedEvidenceIds: customScenario.evidence.map((e) => e.id),
    });
    await engine.runUntilBlocked();

    // Complete T4 & T5
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    // Complete T9 (Principal signs)
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    const endEvent = events.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent && endEvent.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_OK');
    }

    // Verify student status updated to "Bảo lưu" in DS2
    const student = studentsDb.get(happyPreset.mssv);
    expect(student?.status).toBe('Bảo lưu');
  });
});
