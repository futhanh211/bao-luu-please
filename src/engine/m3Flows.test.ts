import { describe, it, expect } from 'vitest';
import { createEngine } from './engine';
import { PROCESS_DEF } from './process.def';
import { Clock } from './clock';
import { InMemoryStudentsDB } from '../data/students.db';
import { InMemoryAcademicFinanceDB } from '../data/academic-finance.db';
import { MockAIProvider } from '../ai/mock';
import { SCENARIOS } from '../data/scenarios';
import { EngineEvent, EngineDeps } from './types';
import { composeLetter } from '../data/letters';

/**
 * Chạy trọn kịch bản ở tầng headless (đúng luồng Bàn Sinh viên M3):
 * nộp đơn -> engine -> thư MF2/MF3/MF4 -> soạn thư hiển thị trong Hộp thư.
 */
function createRig(scenarioId: string): {
  deps: EngineDeps;
  engine: ReturnType<typeof createEngine>;
  events: EngineEvent[];
  scenario: (typeof SCENARIOS)[number];
} {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`Scenario not found: ${scenarioId}`);

  const deps: EngineDeps = {
    clock: new Clock(0),
    db: {
      ds1: new InMemoryAcademicFinanceDB(),
      ds2: new InMemoryStudentsDB(),
    },
    ai: new MockAIProvider(scenario.aiScript, 0),
  };

  const engine = createEngine(PROCESS_DEF, scenario, deps);
  const events: EngineEvent[] = [];
  engine.subscribe((e) => events.push(e));

  return { deps, engine, events, scenario };
}

function studentLetters(events: EngineEvent[]) {
  return events.flatMap((e) =>
    e.type === 'message.sent' && ['MF2', 'MF3', 'MF4'].includes(e.flowId)
      ? [composeLetter(e.flowId, e.payload)]
      : []
  );
}

describe('M3 · Luồng Bàn Sinh viên (headless)', () => {
  it('S2: nộp không minh chứng -> Hộp thư nhận thư MF2 "hồ sơ chưa hợp lệ"', async () => {
    const { engine, events, scenario } = createRig('s2');

    await engine.start({ form: scenario.form, attachedEvidenceIds: [] });
    await engine.runUntilBlocked();

    const letters = studentLetters(events);
    expect(letters).toHaveLength(1);
    expect(letters[0].flowId).toBe('MF2');
    expect(letters[0].title).toContain('chưa hợp lệ');
    expect(letters[0].sections[0].lines.length).toBeGreaterThan(0);
    expect(letters[0].signed).toBe(false);

    const ended = events.find((e) => e.type === 'case.ended');
    expect(ended?.type === 'case.ended' ? ended.endEventId : '').toBe('E_END_RETURNED');
  });

  it('S1: đính kèm đúng minh chứng + hoàn tất T4/T5/T9 -> Hộp thư nhận quyết định ký số', async () => {
    const { engine, events, scenario } = createRig('s1');

    await engine.start({ form: scenario.form, attachedEvidenceIds: ['ev_01'] });
    await engine.runUntilBlocked();
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    const letters = studentLetters(events);
    const decision = letters.find((l) => l.flowId === 'MF4');
    expect(decision).toBeDefined();
    expect(decision?.signed).toBe(true);
    expect(decision?.title).toBe('Quyết định nghỉ học tạm thời');
    expect(decision?.sections.flatMap((s) => s.lines).join(' ')).toContain('3121102001');
  });

  it('S3: nộp đủ giấy nhưng nợ học phí -> thư MF3 liệt kê R3', async () => {
    const { engine, events, scenario } = createRig('s3');

    await engine.start({ form: scenario.form, attachedEvidenceIds: ['ev_03'] });
    await engine.runUntilBlocked();
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();

    const letters = studentLetters(events);
    expect(letters).toHaveLength(1);
    expect(letters[0].flowId).toBe('MF3');

    const body = letters[0].sections.flatMap((s) => s.lines).join('\n');
    expect(body).toContain('học phí');
    expect(body).toContain('7.500.000');
  });

  it('S1 nộp không minh chứng -> không vào xét song song, nhận MF2', async () => {
    const { engine, events, scenario } = createRig('s1');

    await engine.start({ form: scenario.form, attachedEvidenceIds: [] });
    await engine.runUntilBlocked();

    expect(events.some((e) => e.type === 'node.completed' && e.nodeId === 'T2')).toBe(true);
    expect(events.some((e) => e.type === 'node.entered' && e.nodeId === 'G2')).toBe(false);
    expect(studentLetters(events).map((l) => l.flowId)).toEqual(['MF2']);
  });
});
