import { describe, it, expect } from 'vitest';
import { createEngine } from '../../engine/engine';
import { PROCESS_DEF } from '../../engine/process.def';
import { Clock } from '../../engine/clock';
import { InMemoryStudentsDB } from '../../data/students.db';
import { InMemoryAcademicFinanceDB } from '../../data/academic-finance.db';
import { MockAIProvider } from '../../ai/mock';
import { SCENARIOS } from '../../data/scenarios';
import { EngineEvent, EngineDeps } from '../../engine/types';
import { buildStudentTimeline } from './studentProgress';

function setup(scenarioId: string): {
  deps: EngineDeps;
  events: EngineEvent[];
  days: number[];
} {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`Scenario not found: ${scenarioId}`);

  const clock = new Clock(0);
  const deps: EngineDeps = {
    clock,
    db: {
      ds1: new InMemoryAcademicFinanceDB(),
      ds2: new InMemoryStudentsDB(),
    },
    ai: new MockAIProvider(scenario.aiScript, 0),
  };

  return { deps, events: [], days: [] };
}

describe('studentProgress.ts — timeline cho sinh viên', () => {
  it('S1: có đủ mốc từ nộp đơn, xét song song, chờ Cố vấn/CTSV tới quyết định', async () => {
    const s1 = SCENARIOS.find((s) => s.id === 's1');
    if (!s1) throw new Error('missing s1');
    const { deps, events, days } = setup('s1');

    const engine = createEngine(PROCESS_DEF, s1, deps);
    engine.subscribe((e) => {
      events.push(e);
      days.push(deps.clock.getDay());
    });

    await engine.start({ form: s1.form, attachedEvidenceIds: ['ev_01'] });
    await engine.runUntilBlocked();
    await engine.completeUserTask('T4', 'confirmed');
    await engine.completeUserTask('T5', 'valid');
    await engine.runUntilBlocked();
    await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await engine.runUntilBlocked();

    const timeline = buildStudentTimeline(events, days);
    const labels = timeline.map((i) => i.label);

    expect(labels).toContain('Đã nộp đơn');
    expect(labels).toContain('Hệ thống đang kiểm tra hồ sơ');
    expect(labels).toContain('Hồ sơ hợp lệ — đang xét song song');
    expect(labels).toContain('Chờ Cố vấn xác nhận');
    expect(labels).toContain('Đang thẩm định minh chứng');
    expect(labels).toContain('Đang đối chiếu điều kiện');
    expect(labels).toContain('Đã có quyết định');

    const last = timeline[timeline.length - 1];
    expect(last.tone).toBe('ok');
    expect(timeline.every((i) => typeof i.day === 'number')).toBe(true);
  });

  it('S2: timeline dừng ở mốc cần bổ sung, không có mốc xét song song', async () => {
    const s2 = SCENARIOS.find((s) => s.id === 's2');
    if (!s2) throw new Error('missing s2');
    const { deps, events, days } = setup('s2');

    const engine = createEngine(PROCESS_DEF, s2, deps);
    engine.subscribe((e) => {
      events.push(e);
      days.push(deps.clock.getDay());
    });

    await engine.start({ form: s2.form, attachedEvidenceIds: [] });
    await engine.runUntilBlocked();

    const timeline = buildStudentTimeline(events, days);
    const labels = timeline.map((i) => i.label);

    expect(labels).toContain('Đã nộp đơn');
    expect(labels).toContain('Hồ sơ cần bổ sung');
    expect(labels).toContain('Hồ sơ đã được trả lại');
    expect(labels).not.toContain('Hồ sơ hợp lệ — đang xét song song');
    expect(labels).not.toContain('Đã có quyết định');

    const last = timeline[timeline.length - 1];
    expect(last.tone).toBe('warn');
  });

  it('Không có event: timeline rỗng', () => {
    expect(buildStudentTimeline([])).toEqual([]);
  });
});
